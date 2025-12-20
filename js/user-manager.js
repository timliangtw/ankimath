import { db } from './firebase-config.js';
import { collection, doc, getDocs, getDoc, setDoc, runTransaction } from "firebase/firestore";

// 使用者集合名稱
const COLLECTION_NAME = "users";

// 取得所有小孩 Profile
export async function getAllProfiles() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const profiles = [];
        querySnapshot.forEach((doc) => {
            profiles.push({
                id: doc.id,
                ...doc.data()
            });
        });
        return profiles;
    } catch (e) {
        console.error("Error fetching profiles:", e);
        throw e;
    }
}

// 建立新 Profile
export async function createProfile(name) {
    if (!name) return null;
    try {
        const newProfile = {
            name: name,
            createdAt: Date.now(),
            cards: [] // 初始是空的學習紀錄
        };
        // 使用 name 當作 ID (簡單起見，實際應用可能要避免重複)
        // 為了避免重複，我們加個後綴
        const id = name + "_" + Math.floor(Math.random() * 1000);

        await setDoc(doc(db, COLLECTION_NAME, id), newProfile);
        return { id, ...newProfile };
    } catch (e) {
        console.error("Error creating profile:", e);
        throw e;
    }
}

// 讀取特定 Profile 的資料
export async function loadUserProfile(id) {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data();
        } else {
            console.warn("No such profile!");
            return null;
        }
    } catch (e) {
        console.error("Error loading profile:", e);
        throw e;
    }
}

// 儲存進度 (使用 Transaction 進行合併)
export async function saveUserProfile(id, localCards) {
    if (!id) return;
    const docRef = doc(db, COLLECTION_NAME, id);

    try {
        await runTransaction(db, async (transaction) => {
            // 1. 先讀去雲端最新的資料
            const sfDoc = await transaction.get(docRef);

            // 處理文件不存在的情況
            let serverCards = [];
            if (sfDoc.exists()) {
                const serverData = sfDoc.data();
                serverCards = serverData.cards || [];
            }

            // 2. 進行合併 (Merge)
            // 將 serverCards 轉成 Map 方便查找
            const serverMap = new Map(serverCards.map(c => [c.id, c]));

            const mergedCards = localCards.map(local => {
                const server = serverMap.get(local.id);

                if (!server) {
                    // 雲端沒有，直接用本地的
                    return local;
                }

                // 雲端有，開始比對
                // 規則 1: 誰的 reps (複習次數) 比較多，就贏 (保留進度較多的)
                if ((local.reps || 0) > (server.reps || 0)) {
                    return local;
                }
                if ((server.reps || 0) > (local.reps || 0)) {
                    return server;
                }

                // 規則 2: 如果 reps 一樣，比較 lastUpdated (誰比較新)
                // 如果沒有 lastUpdated 欄位，就比 nextReview (誰是最近才做完的，nextReview 通常比較大)
                const localTime = local.lastUpdated || 0;
                const serverTime = server.lastUpdated || 0;

                if (localTime > serverTime) {
                    return local;
                } else if (serverTime > localTime) {
                    return server;
                }

                // 完全一樣，用本地的
                return local;
            });

            // 還有一個情況：雲端有新題目 (serverCards 有，但 localCards 沒有)
            // 這種情況通常是題目更新，我們應該也要把雲端多出來的卡片加進來
            // 但因為我們的 main.js 邏輯是「以 defaultQuestions」為主去 map，所以這裡存檔時
            // 我們主要專注於「更新已存在的卡片進度」。
            // 如果我們只存 progressData (不含 code)，那合併後的 mergedCards 就是最終進度。

            // --- 關鍵修復：移除所有 undefined 的欄位 ---
            // Firestore 不接受 undefined，必須轉成 null 或刪除該 key
            // 我們這裡做一次簡單的清洗
            const cleanCards = mergedCards.map(c => {
                // 回傳新物件，確保沒有 undefined
                return JSON.parse(JSON.stringify(c));
            });

            // 3. 寫回雲端
            // 使用 set({...}, {merge: true}) 來確保如果欄位有變動可以合併，
            // 但在 transaction 內其實我們是取代 cards 欄位。
            transaction.set(docRef, { cards: cleanCards }, { merge: true });
        });
        console.log("Transaction successfully committed!");
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e; // 拋出錯誤讓 UI 顯示同步失敗
    }
}
