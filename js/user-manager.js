import { db } from './firebase-config.js';
import { collection, doc, getDocs, getDoc, setDoc } from "firebase/firestore";

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

// 儲存進度
export async function saveUserProfile(id, data) {
    if (!id) return;
    try {
        // 我們只更新 cards 部分，避免覆蓋其他 metadata
        const docRef = doc(db, COLLECTION_NAME, id);
        // data 應該是完整的 cards array
        // Firestore 建議不要存太大 array，但對於個人學習紀錄 (幾百題) 還行
        // 若題目變多，應拆分 collection sub-structure。現在先維持簡單。

        // 這裡 data 結構預期是整個 profile object 或是 { cards: [...] }
        // 為了方便，我們預設傳入的是 cards array
        await setDoc(docRef, { cards: data }, { merge: true });
        console.log("Saved to Firestore:", id);
    } catch (e) {
        console.error("Error saving profile:", e);
        // 不 throw，避免打斷學習流程，但 UI 應該要顯示同步失敗
    }
}
