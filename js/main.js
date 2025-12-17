import defaultQuestions from './questions/index.js';

// --- 2. 應用程式狀態 ---
let cards = [];
let sessionQueue = []; // 當前學習隊列
let currentCard = null;

// --- 3. 核心邏輯 (Local Storage & Anki 簡易演算法) ---

// 初始化
function initApp() {
    loadData();
    updateHomeStats();
}

// 讀取資料
function loadData() {
    const storedData = localStorage.getItem('ankiMathKids_v1');
    if (storedData) {
        cards = JSON.parse(storedData);
        // 檢查是否有新題目加入 (簡單的 id 比對)
        defaultQuestions.forEach(q => {
            if (!cards.find(c => c.id === q.id)) {
                // 初始化新卡片
                cards.push({
                    ...q,
                    interval: 0,
                    reps: 0,
                    ef: 2.5, // 輕鬆度係數 (Ease Factor)
                    nextReview: 0 // 時間戳
                });
            }
        });
    } else {
        // 第一次使用
        cards = defaultQuestions.map(q => ({
            ...q,
            interval: 0,
            reps: 0,
            ef: 2.5,
            nextReview: 0
        }));
    }
    saveData();
}

// 存檔
function saveData() {
    localStorage.setItem('ankiMathKids_v1', JSON.stringify(cards));
}

// 清除資料
function clearDataConfirm() {
    if (confirm("確定要清除所有學習進度嗎？小孩的複習紀錄會歸零喔！")) {
        localStorage.removeItem('ankiMathKids_v1');
        location.reload();
    }
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
        // 如果沒有到期的，可以練習一些未來的，或是隨機選幾題複習 (這裡我們先簡單處理：直接顯示完成)
        // 為了讓展示有趣，如果全部做完了，就抓最早複習的那幾題進來
        alert("目前沒有到期的題目，但我們還是來練習一下吧！");
        sessionQueue = [...cards].sort((a, b) => a.nextReview - b.nextReview).slice(0, 5);
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

    // 渲染卡片內容
    document.getElementById('card-content').innerHTML = `<div class="question-text">${currentCard.q}</div>`;
    document.getElementById('answer-content').innerText = currentCard.a;
    document.getElementById('explanation-content').innerHTML = currentCard.exp || "太棒了！";

    // 重置 UI 狀態
    document.getElementById('answer-section').style.display = 'none';
    document.getElementById('show-answer-btn-area').style.display = 'flex';
    document.getElementById('rating-btns-area').style.display = 'none';
}

function showAnswer() {
    document.getElementById('answer-section').style.display = 'block';
    document.getElementById('show-answer-btn-area').style.display = 'none';
    document.getElementById('rating-btns-area').style.display = 'flex';

    // 自動捲動到底部，確保按鈕可見
    setTimeout(() => {
        document.querySelector('.card').scrollTop = document.querySelector('.card').scrollHeight;
    }, 100);
}

// 核心演算法 (SM-2 簡化版)
// quality: 1 (重來/不會), 3 (還可以), 5 (簡單)
function rateCard(quality) {
    const now = Date.now();
    const dayMillis = 24 * 60 * 60 * 1000;

    // 在原始資料陣列中找到這張卡片
    let cardIndex = cards.findIndex(c => c.id === currentCard.id);
    let card = cards[cardIndex];

    if (quality < 3) {
        // 答錯了：重置
        card.reps = 0;
        card.interval = 1;
        // 設定為 1 分鐘後重試 (這裡為了 Demo 方便，設為 0，如果隊列還有題就會排在後面)
        card.nextReview = now + 60000;

        // 既然答錯了，這題不移出 sessionQueue，而是移到隊列最後面再做一次
        sessionQueue.shift(); // 移除開頭
        sessionQueue.push(currentCard); // 加到最後

    } else {
        // 答對了
        if (card.reps === 0) {
            card.interval = 1;
        } else if (card.reps === 1) {
            card.interval = 6;
        } else {
            card.interval = Math.round(card.interval * card.ef);
        }

        card.reps += 1;
        // 調整輕鬆度 (EF)
        // 簡單算法：如果覺得簡單(5)，EF 增加；如果覺得難(3)，EF稍微減少
        if (quality === 5) card.ef = card.ef + 0.1;
        if (quality === 3) card.ef = Math.max(1.3, card.ef - 0.15);

        // 設定下次複習時間 (天數 * 毫秒)
        // 注意：如果是"太簡單"，我們加一點隨機性避免題目堆積
        card.nextReview = now + (card.interval * dayMillis);

        // 移出當前學習隊列
        sessionQueue.shift();
    }

    saveData(); // 存檔
    loadNextCard(); // 下一題
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
    listContainer.innerHTML = ''; // 清空

    // 顯示所有 "已導入" 的題目。
    cards.sort((a, b) => a.id - b.id).forEach(card => {
        const item = document.createElement('div');
        item.className = 'q-item';
        // 移除 HTML 標籤以純文字顯示預覽
        const rawText = card.q.replace(/<[^>]*>?/gm, '');

        // 格式化時間
        let nextReviewText = "尚未開始";
        const now = Date.now();
        if (card.nextReview > 0) {
            const date = new Date(card.nextReview);
            // 簡單格式：MM/DD HH:mm
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
                    <span class="q-item-text">${rawText}</span>
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

    document.getElementById('preview-q').innerHTML = card.q;
    document.getElementById('preview-a-text').innerText = card.a;
    document.getElementById('preview-exp').innerHTML = card.exp || "無說明";

    showPage('preview-page');
}

function backToSettings() {
    showPage('settings-page');
}

// Expose functions to window for HTML onclick events
window.startSession = startSession;
window.clearDataConfirm = clearDataConfirm;
window.showAnswer = showAnswer;
window.rateCard = rateCard;
window.goHome = goHome;
window.openSettings = openSettings;
window.previewQuestion = previewQuestion;
window.backToSettings = backToSettings;

// 啟動
initApp();
