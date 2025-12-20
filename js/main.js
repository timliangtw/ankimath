import loadQuestions from './questions/index.js';
import { testConnection } from './firebase-config.js';
import { getAllProfiles, createProfile, loadUserProfile, saveUserProfile } from './user-manager.js';

// --- 2. 應用程式狀態 ---
let cards = [];
let sessionQueue = []; // 當前學習隊列
let currentCard = null;
let defaultQuestions = [];
let currentProfileId = null;

// --- 3. 核心邏輯 (Firestore & Anki 簡易演算法) ---

// 初始化
async function initApp() {
    const loadingEl = document.getElementById('startup-loading');
    const loadingMsg = document.getElementById('loading-msg');
    const statusEl = document.getElementById('db-status-indicator');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('span');

    try {
        // 1. 載入預設題目 (Code)
        loadingMsg.innerText = "載入題目中...";
        defaultQuestions = await loadQuestions();
        console.log("Total questions loaded:", defaultQuestions.length);

        // 2. 測試資料庫連線
        loadingMsg.innerText = "連線到雲端資料庫...";
        const isConnected = await testConnection();

        if (isConnected) {
            statusEl.classList.add('connected');
            statusEl.classList.remove('disconnected');
            textEl.innerText = "已連線";
            // dotEl color inherited
        } else {
            statusEl.classList.add('disconnected');
            statusEl.classList.remove('connected');
            textEl.innerText = "連線失敗"; // 仍可試著運作，但無法存檔
            alert("無法連線到資料庫，請檢查網路。目前將無法儲存進度。");
        }

        // 3. 處理使用者 Profile
        // 檢查 LocalStorage 是否有上次登入的 ID
        const lastProfileId = localStorage.getItem('lastProfileId');

        loadingMsg.innerText = "讀取使用者資料...";
        const profiles = await getAllProfiles();

        if (profiles.length === 0) {
            // 沒有任何使用者 -> 創建第一個
            const name = prompt("歡迎！請輸入你的名字 (例如: 這裡輸入小孩名字):", "小明");
            if (name) {
                const newInfo = await createProfile(name);
                await loginProfile(newInfo.id);
            } else {
                alert("必須輸入名字才能開始！");
                location.reload();
                return;
            }
        } else {
            // 有使用者
            if (lastProfileId && profiles.find(p => p.id === lastProfileId)) {
                // 自動登入上次的使用者
                await loginProfile(lastProfileId);
            } else {
                // 顯示選擇與建立介面 (簡單用 prompt/confirm 或是自製 UI)
                // 這裡為了簡化，如果找不到上次的，就列出名字讓使用者輸入，或是輸入新名字
                const names = profiles.map(p => p.name).join(', ');
                const inputName = prompt(`請輸入你的名字以登入:\n(已知使用者: ${names})\n\n或輸入新名字建立新帳號:`);

                if (!inputName) {
                    alert("請重新整理並輸入名字");
                    return;
                }

                const existing = profiles.find(p => p.name === inputName);
                if (existing) {
                    await loginProfile(existing.id);
                } else {
                    const newInfo = await createProfile(inputName);
                    await loginProfile(newInfo.id);
                }
            }
        }

        // 移除 Loading
        loadingEl.style.display = 'none';

    } catch (e) {
        console.error("Init failed:", e);
        loadingMsg.innerText = "發生錯誤: " + e.message;
        loadingMsg.style.color = "red";
    }
}

// 登入特定 Profile 並載入資料
async function loginProfile(profileId) {
    currentProfileId = profileId;
    localStorage.setItem('lastProfileId', profileId); // 記住登入狀態

    // 載入該使用者的進度資料
    const userData = await loadUserProfile(profileId);

    // 合併邏輯 (Merge Content + Progress)
    const savedCards = userData && userData.cards ? userData.cards : [];

    cards = defaultQuestions.map(defaultQ => {
        const savedCard = savedCards.find(c => c.id === defaultQ.id);
        if (savedCard) {
            return {
                ...defaultQ, // 使用最新的 Code (q, a, render...)
                // 覆蓋進度
                reps: savedCard.reps,
                interval: savedCard.interval,
                ef: savedCard.ef,
                nextReview: savedCard.nextReview
            };
        } else {
            return {
                ...defaultQ,
                interval: 0,
                reps: 0,
                ef: 2.5,
                nextReview: 0
            };
        }
    });

    console.log(`User ${profileId} loaded with ${cards.length} cards.`);
    updateHomeStats();
}

// 存檔 (同步到 Firestore)
async function saveData() {
    if (!currentProfileId) return;

    const statusEl = document.getElementById('db-status-indicator');
    const textEl = statusEl.querySelector('span');

    // 更新狀態為同步中
    statusEl.className = 'db-status syncing';
    textEl.innerText = "同步中...";

    // 我們只存需要的欄位，不存題目內容 (節省流量與空間)
    const progressData = cards.map(c => ({
        id: c.id,
        reps: c.reps,
        interval: c.interval,
        ef: c.ef,
        nextReview: c.nextReview
    }));

    try {
        await saveUserProfile(currentProfileId, progressData);
        // 同步完成
        statusEl.className = 'db-status connected';
        textEl.innerText = "已同步";

        // 2秒後變回單純的 "已連線" 或是保留 "已同步" 也可以
        // 這裡我們讓它顯示一下 "已同步" 然後變回 "已連線" 代表待機
        setTimeout(() => {
            if (statusEl.classList.contains('connected')) {
                textEl.innerText = "已連線";
            }
        }, 2000);

    } catch (e) {
        console.error("Sync failed:", e);
        statusEl.className = 'db-status disconnected';
        textEl.innerText = "同步失敗";
    }
}

// 清除資料 (Reset)
async function clearDataConfirm() {
    if (confirm("確定要清除所有學習進度嗎？這個動作會清空雲端上的紀錄喔！")) {
        // 重置 local state
        cards = cards.map(c => ({
            ...c,
            reps: 0,
            interval: 0,
            ef: 2.5,
            nextReview: 0
        }));
        await saveData();
        location.reload();
    }
}

// 切換使用者 (登出)
function logout() {
    localStorage.removeItem('lastProfileId');
    location.reload();
}

// 更新首頁數字
function updateHomeStats() {
    const now = Date.now();
    const due = cards.filter(c => c.nextReview <= now).length;
    document.getElementById('due-count').innerText = due;
}

// --- 4. 學習流程控制 ---

function startSession() {
    const now = Date.now();
    // 找出所有到期或還沒學過的卡片
    sessionQueue = cards.filter(c => c.nextReview <= now);

    if (sessionQueue.length === 0) {
        // 如果沒有到期的，可以練習一些未來的，或是隨機選幾題複習
        alert("目前沒有到期的題目，但我們還是來練習一下吧！(隨機挑選 5 題)");
        sessionQueue = [...cards].sort(() => Math.random() - 0.5).slice(0, 5);
    }

    if (sessionQueue.length > 0) {
        showPage('study-page');
        loadNextCard();
    } else {
        showPage('finish-page');
    }
}

function loadNextCard() {
    if (sessionQueue.length === 0) {
        showPage('finish-page');
        updateHomeStats();
        return;
    }

    currentCard = sessionQueue[0];
    document.getElementById('remaining-count').innerText = sessionQueue.length;

    const cardContent = document.getElementById('card-content');

    // 清空並重置容器
    cardContent.innerHTML = '';
    document.getElementById('answer-section').style.display = 'none';
    document.getElementById('show-answer-btn-area').style.display = 'none';
    document.getElementById('rating-btns-area').style.display = 'none';

    // --- 檢查是否為自訂渲染 (Custom Render) ---
    if (currentCard.render) {
        if (!window.React || !window.ReactDOM || !window.htm) {
            cardContent.innerHTML = '<div style="color:red; padding:20px;">錯誤：缺少 React 或 htm 函式庫。請確保網路連線正常以載入外部資源。</div>';
            return;
        }

        try {
            const mountPoint = document.createElement('div');
            mountPoint.style.width = '100%';
            cardContent.appendChild(mountPoint);
            currentCard.render(mountPoint);
        } catch (error) {
            console.error("Render Error:", error);
            cardContent.innerHTML = `<div style="color:red; padding:20px;">渲染錯誤：${error.message}</div>`;
        }

        // 自訂卡片不需要看答案按鈕
        document.getElementById('show-answer-btn-area').style.display = 'none';
        document.getElementById('rating-btns-area').style.display = 'flex';

    } else {
        // --- 標準模式 ---
        cardContent.innerHTML = `<div class="question-text">${currentCard.q}</div>`;
        document.getElementById('answer-content').innerText = currentCard.a;
        document.getElementById('explanation-content').innerHTML = currentCard.exp || "太棒了！";

        // 控制按鈕
        document.getElementById('show-answer-btn-area').style.display = 'flex';
    }
}

function showAnswer() {
    document.getElementById('answer-section').style.display = 'block';
    document.getElementById('show-answer-btn-area').style.display = 'none';
    document.getElementById('rating-btns-area').style.display = 'flex';

    setTimeout(() => {
        document.querySelector('.card').scrollTop = document.querySelector('.card').scrollHeight;
    }, 100);
}

// 核心演算法 (SM-2 簡化版)
async function rateCard(quality) {
    const now = Date.now();
    const dayMillis = 24 * 60 * 60 * 1000;

    let cardIndex = cards.findIndex(c => c.id === currentCard.id);
    let card = cards[cardIndex];

    if (quality < 3) {
        // 答錯
        card.reps = 0;
        card.interval = 1;
        card.nextReview = now + 60000; // 1 min later

        sessionQueue.shift();
        sessionQueue.push(currentCard); // Put back to end

    } else {
        // 答對
        if (card.reps === 0) {
            card.interval = 1;
        } else if (card.reps === 1) {
            card.interval = 6;
        } else {
            card.interval = Math.round(card.interval * card.ef);
        }

        card.reps += 1;
        if (quality === 5) card.ef = card.ef + 0.1;
        if (quality === 3) card.ef = Math.max(1.3, card.ef - 0.15);

        card.nextReview = now + (card.interval * dayMillis);

        sessionQueue.shift();
    }

    // 每次評分都同步存檔
    await saveData();
    loadNextCard();
}

// --- 5. 頁面切換 ---
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function goHome() {
    updateHomeStats();
    showPage('home-page');
}

// --- 6. 家長專區邏輯 ---
function openSettings() {
    showPage('settings-page');
    renderQuestionList();
}

function renderQuestionList() {
    const listContainer = document.getElementById('question-list');
    listContainer.innerHTML = '';

    // 插入切換使用者按鈕
    const userControlDiv = document.createElement('div');
    userControlDiv.style.padding = '10px';
    userControlDiv.style.marginBottom = '20px';
    userControlDiv.style.background = '#f0f9ff';
    userControlDiv.style.borderRadius = '10px';
    userControlDiv.innerHTML = `
        <p style="margin:0 0 10px 0; color:#444;">目前使用者: <b>${currentProfileId || '未知'}</b></p>
        <button class="btn btn-neutral" style="font-size:0.9rem; padding: 5px 15px;">登出 / 切換使用者</button>
    `;
    userControlDiv.querySelector('button').onclick = logout;
    listContainer.appendChild(userControlDiv);

    cards.sort((a, b) => (typeof a.id === 'string' ? a.id.localeCompare(b.id) : a.id - b.id)).forEach(card => {
        const item = document.createElement('div');
        item.className = 'q-item';

        let displayText = card.title || card.q.replace(/<[^>]*>?/gm, '');

        let nextReviewText = "尚未開始";
        const now = Date.now();
        if (card.nextReview > 0) {
            const date = new Date(card.nextReview);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hour = date.getHours().toString().padStart(2, '0');
            const minute = date.getMinutes().toString().padStart(2, '0');

            nextReviewText = `${month}/${day} ${hour}:${minute}`;

            if (card.nextReview <= now) {
                nextReviewText = `<span style="color:var(--wrong-color); font-weight:bold;">${nextReviewText} (已到期)</span>`;
            }
        }

        item.innerHTML = `
            <div style="flex: 1; min-width: 0;">
                <div>
                    <span class="q-item-id">#${card.id}</span>
                    <span class="q-item-text">${displayText}</span>
                </div>
                <div class="q-item-stats">
                    複習: ${card.reps} 次 | 下次: ${nextReviewText}
                </div>
            </div>
            <div style="color: #ccc; margin-left: 10px;">ᐳ</div>
        `;
        item.onclick = () => previewQuestion(card.id);
        listContainer.appendChild(item);
    });
}

function previewQuestion(id) {
    const card = cards.find(c => c.id === id);
    if (!card) return;

    if (card.render) {
        if (!window.React || !window.ReactDOM || !window.htm) {
            document.getElementById('preview-q').innerHTML = '<div style="color:red;">錯誤：缺少必要函式庫 (React/htm)。</div>';
            return;
        }

        document.getElementById('preview-q').innerHTML = '';
        document.getElementById('preview-q').classList.remove('question-text');
        try {
            card.render(document.getElementById('preview-q'));
        } catch (e) {
            document.getElementById('preview-q').innerHTML = `<div style="color:red;">預覽錯誤：${e.message}</div>`;
        }
        document.getElementById('preview-a').style.display = 'none';
        document.getElementById('preview-exp').style.display = 'none';
    } else {
        document.getElementById('preview-q').classList.add('question-text');
        document.getElementById('preview-q').innerHTML = card.q;
        document.getElementById('preview-a').style.display = 'block';
        document.getElementById('preview-a-text').innerText = card.a;
        document.getElementById('preview-exp').style.display = 'block';
        document.getElementById('preview-exp').innerHTML = card.exp || "無說明";
    }

    showPage('preview-page');
}

function backToSettings() {
    showPage('settings-page');
}

// Expose functions
window.startSession = startSession;
window.clearDataConfirm = clearDataConfirm;
window.showAnswer = showAnswer;
window.rateCard = rateCard;
window.goHome = goHome;
window.openSettings = openSettings;
window.previewQuestion = previewQuestion;
window.backToSettings = backToSettings;
window.logout = logout;

// 啟動
initApp();
