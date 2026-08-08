import loadQuestions from './questions/index.js';
import { testConnection } from './firebase-config.js';
import { getAllProfiles, createProfile, loadUserProfile, saveUserProfile, updateProfileSettings, inferQuestionBankFromName } from './user-manager.js';
import { VERSION } from './version.js';

// --- 2. 應用程式狀態 ---
let cards = [];
let sessionQueue = []; // 當前學習隊列
let currentCard = null;
let defaultQuestions = [];
let currentProfileId = null;
let currentQuestionBank = 'brother';
let availableProfiles = [];   // 首頁下拉可以切換的使用者
let isSwitchingProfile = false;

// 首頁下拉只列出這幾個固定帳號（名稱要完全相同，避免撈到大小寫不同的重複帳號）
const ALLOWED_PROFILES = [
    { name: 'Leo', label: 'Leo（哥哥）' },
    { name: 'Natasha', label: 'Natasha（妹妹）' },
    { name: 'test', label: '測試帳號' }
];
let isRating = false; // 防止評分按鈕重複點擊
let previewRoot = null; // 追蹤預覽頁的 React root，避免 createRoot 重複警告
let studyRoot = null;   // 追蹤學習頁的 React root

// 掛載 React 組件，先 unmount 舊 root 再建新的
function mountCard(card, container, existingRoot) {
    if (existingRoot) { try { existingRoot.unmount(); } catch (e) {} }
    const origCreateRoot = ReactDOM.createRoot;
    let captured = null;
    ReactDOM.createRoot = function (c, opts) {
        captured = origCreateRoot.call(ReactDOM, c, opts);
        ReactDOM.createRoot = origCreateRoot;
        return captured;
    };
    try {
        card.render(container);
    } finally {
        ReactDOM.createRoot = origCreateRoot;
    }
    return captured;
}

// --- 3. 核心邏輯 (Firestore & Anki 簡易演算法) ---

const VALID_QUESTION_BANKS = new Set(['brother', 'sister']);

function normalizeQuestionBank(bank) {
    return VALID_QUESTION_BANKS.has(bank) ? bank : 'brother';
}

function progressIdFor(bank, questionId) {
    return `${normalizeQuestionBank(bank)}/${questionId}`;
}

function getBankFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return normalizeQuestionBank(urlParams.get('bank') || 'brother');
}

async function loadQuestionBank(bank) {
    currentQuestionBank = normalizeQuestionBank(bank);
    defaultQuestions = await loadQuestions(currentQuestionBank);
    renderLoadWarning(defaultQuestions.missing || []);
    console.log(`Total questions loaded for ${currentQuestionBank}:`, defaultQuestions.length);
}

// 題目檔案載入失敗（重試後仍失敗）時，在首頁明確告知，不要靜默少題
function renderLoadWarning(missing) {
    const existing = document.getElementById('load-warning');

    if (!missing.length) {
        if (existing) existing.remove();
        return;
    }

    const container = document.querySelector('#home-page .container');
    if (!container) return;

    const el = existing || document.createElement('p');
    if (!existing) {
        el.id = 'load-warning';
        el.style.cssText = 'margin-top:16px; font-size:0.85rem; color:#b91c1c; font-weight:bold; line-height:1.6;';
        container.appendChild(el);
    }
    el.innerText = `⚠️ 有 ${missing.length} 題沒有載入成功（${missing.join('、')}），請檢查網路後重新整理。`;
}

function buildInitialCard(defaultQ, savedCard = null) {
    const progressId = progressIdFor(currentQuestionBank, defaultQ.id);
    return {
        ...defaultQ,
        progressId,
        interval: savedCard?.interval ?? 0,
        reps: savedCard?.reps ?? 0,
        ef: savedCard?.ef ?? 2.5,
        nextReview: savedCard?.nextReview ?? 0,
        lastUpdated: savedCard?.lastUpdated
    };
}

// 初始化
async function initApp() {
    const loadingEl = document.getElementById('startup-loading');
    const loadingMsg = document.getElementById('loading-msg');
    const statusEl = document.getElementById('db-status-indicator');
    const dotEl = statusEl.querySelector('.status-dot');
    const textEl = statusEl.querySelector('span');

    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('debug')) {
            console.log("進入除錯模式 (Debug Mode)，跳過資料庫與登入");
            statusEl.className = 'db-status disconnected';
            textEl.innerText = "Debug (未連線)";
            currentProfileId = "debug_user";
            loadingMsg.innerText = "載入題目中...";
            await loadQuestionBank(getBankFromUrl());
            cards = defaultQuestions.map(defaultQ => buildInitialCard(defaultQ));
            updateHomeStats();
            renderProfileSelector();
            loadingEl.style.display = 'none';
            return;
        }

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
        loadingMsg.innerText = "讀取使用者資料...";
        const profiles = await getAllProfiles();
        availableProfiles = pickAllowedProfiles(profiles);

        if (availableProfiles.length === 0) {
            // 雲端還沒有任何預設帳號 -> 建立第一個
            const name = prompt("找不到預設帳號，請輸入名字建立新帳號:", ALLOWED_PROFILES[0].name);
            if (name) {
                const newInfo = await createProfile(name);
                availableProfiles = pickAllowedProfiles(await getAllProfiles());
                await loginProfile(newInfo.id);
            } else {
                alert("必須輸入名字才能開始！");
                location.reload();
                return;
            }
        } else {
            // 沿用上次選的使用者，沒有就用第一個
            const lastProfileId = localStorage.getItem('lastProfileId');
            const target = availableProfiles.find(p => p.id === lastProfileId) || availableProfiles[0];
            await loginProfile(target.id);
        }

        renderProfileSelector();

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

    // 載入該使用者的進度資料（失敗時降級為空進度，仍可正常使用）
    let savedCards = [];
    let userData = null;
    try {
        userData = await loadUserProfile(profileId);
        savedCards = userData && userData.cards ? userData.cards : [];
    } catch (e) {
        console.warn("無法讀取雲端進度，以初始狀態繼續:", e);
        // savedCards 保持 []，所有卡片以預設進度顯示
    }

    const urlBank = new URLSearchParams(window.location.search).get('bank');
    const isTestProfile = (userData?.name || '').trim().toLowerCase() === 'test';
    const inferredBank = userData?.questionBank || inferQuestionBankFromName(userData?.name);
    const selectedBank = isTestProfile && urlBank ? normalizeQuestionBank(urlBank) : normalizeQuestionBank(inferredBank);

    if (userData && !userData.questionBank) {
        updateProfileSettings(profileId, { questionBank: selectedBank }).catch(e => {
            console.warn("無法寫入題庫設定，仍以本次推斷題庫繼續:", e);
        });
    }

    await loadQuestionBank(selectedBank);

    // 合併邏輯 (Merge Content + Progress)
    cards = defaultQuestions.map(defaultQ => {
        const newProgressId = progressIdFor(currentQuestionBank, defaultQ.id);
        const savedCard = savedCards.find(c => c.id === newProgressId) || savedCards.find(c => c.id === defaultQ.id);
        return buildInitialCard(defaultQ, savedCard);
    });

    console.log(`User ${profileId} loaded ${currentQuestionBank} with ${cards.length} cards.`);
    updateHomeStats();
    renderProfileSelector();
}

// --- 使用者切換（首頁下拉選單） ---

// 只挑出白名單裡的帳號；同名有多筆時取進度最多的那一筆
function pickAllowedProfiles(profiles) {
    return ALLOWED_PROFILES.map(allowed => {
        const matches = profiles.filter(p => (p.name || '') === allowed.name);
        if (matches.length === 0) return null;
        const best = matches.reduce((a, b) => ((b.cards || []).length > (a.cards || []).length ? b : a));
        return { id: best.id, name: best.name, label: allowed.label };
    }).filter(Boolean);
}

function renderProfileSelector() {
    const select = document.getElementById('profile-select');
    if (!select) return;

    if (currentProfileId === 'debug_user') {
        select.innerHTML = '<option value="debug_user">Debug 模式</option>';
        select.disabled = true;
        return;
    }

    const options = [...availableProfiles];
    // 目前帳號不在白名單裡（例如手動建立的舊帳號）也要能顯示
    if (currentProfileId && !options.some(p => p.id === currentProfileId)) {
        options.unshift({ id: currentProfileId, name: currentProfileId, label: currentProfileId });
    }

    select.innerHTML = options
        .map(p => `<option value="${p.id}">${p.label}</option>`)
        .join('');
    if (currentProfileId) select.value = currentProfileId;
    select.disabled = isSwitchingProfile || options.length <= 1;
    select.onchange = () => switchProfile(select.value);
}

async function switchProfile(profileId) {
    if (!profileId || profileId === currentProfileId || isSwitchingProfile) return;

    const select = document.getElementById('profile-select');
    const loadingEl = document.getElementById('startup-loading');
    const loadingMsg = document.getElementById('loading-msg');

    isSwitchingProfile = true;
    if (select) select.disabled = true;
    // 題庫載入完成前先擋住畫面，避免看到上一位使用者的題目
    if (loadingEl) {
        if (loadingMsg) loadingMsg.innerText = "切換使用者，載入題目中...";
        loadingEl.style.display = 'flex';
    }

    try {
        await loginProfile(profileId);
        goHome();
    } catch (e) {
        console.error("切換使用者失敗:", e);
        alert("切換使用者失敗，請再試一次。");
    } finally {
        isSwitchingProfile = false;
        if (loadingEl) loadingEl.style.display = 'none';
        renderProfileSelector();
    }
}

// 存檔 (同步到 Firestore)
async function saveData() {
    if (!currentProfileId) return;
    if (currentProfileId === 'debug_user') return; // 除錯模式不存檔

    const statusEl = document.getElementById('db-status-indicator');
    const textEl = statusEl.querySelector('span');

    // 更新狀態為同步中
    statusEl.className = 'db-status syncing';
    textEl.innerText = "同步中...";

    // 我們只存需要的欄位，不存題目內容 (節省流量與空間)
    const progressData = cards.map(c => ({
        id: c.progressId || progressIdFor(currentQuestionBank, c.id),
        reps: c.reps,
        interval: c.interval,
        ef: c.ef,
        nextReview: c.nextReview,
        lastUpdated: c.lastUpdated // 重要：同步時間戳記
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

    // 複習題優先（學過且到期），按最久未複習排序
    const reviews = cards
        .filter(c => c.reps > 0 && c.nextReview <= now)
        .sort((a, b) => a.nextReview - b.nextReview);

    // 新題補後面（從未學過）
    const newCards = cards.filter(c => c.reps === 0);

    sessionQueue = [...reviews, ...newCards];

    if (sessionQueue.length === 0) {
        alert("目前沒有到期的題目，但我們還是來練習一下吧！(隨機挑選 3 題)");
        sessionQueue = [...cards].sort(() => Math.random() - 0.5).slice(0, 3);
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
    window.currentCard = currentCard;
    document.getElementById('remaining-count').innerText = sessionQueue.length;

    const cardContent = document.getElementById('card-content');

    // 重設所有評分按鈕（rateCard 會 disable 全部，這裡全部還原）
    document.querySelectorAll('#rating-btns-area button').forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });

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
            studyRoot = mountCard(currentCard, mountPoint, studyRoot);
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
    if (isRating) return;
    isRating = true;

    // 鎖住所有評分按鈕，防止重複提交
    document.querySelectorAll('#rating-btns-area button').forEach(btn => btn.disabled = true);

    try {
        const now = Date.now();
        const dayMillis = 24 * 60 * 60 * 1000;

        const cardIndex = cards.findIndex(c => c.id === currentCard.id);
        if (cardIndex === -1) return; // 安全檢查：卡片已不存在
        const card = cards[cardIndex];

        // 更新時間戳記 (為了 Smart Merge)
        card.lastUpdated = now;

        if (quality < 3) {
            // 答錯
            card.reps = 0;
            card.interval = 1;
            card.ef = Math.max(1.3, card.ef - 0.20);
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
    } finally {
        isRating = false;
    }
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

    // 顯示目前使用者資訊（切換使用者已移到首頁的下拉選單）
    const currentLabel = currentProfileId === 'debug_user'
        ? 'Debug 模式'
        : (availableProfiles.find(p => p.id === currentProfileId)?.label || currentProfileId || '未知');

    const userControlDiv = document.createElement('div');
    userControlDiv.style.padding = '10px';
    userControlDiv.style.marginBottom = '20px';
    userControlDiv.style.background = '#f0f9ff';
    userControlDiv.style.borderRadius = '10px';
    userControlDiv.innerHTML = `
        <p style="margin:0 0 6px 0; color:#444;">目前使用者: <b>${currentLabel}</b></p>
        <p style="margin:0 0 6px 0; color:#666; font-size:0.9rem;">目前題庫: <b>${currentQuestionBank}</b></p>
        <p style="margin:0; color:#999; font-size:0.85rem;">要換人請回首頁，用上方的下拉選單切換。</p>
    `;
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

        const previewQ = document.getElementById('preview-q');
        previewQ.innerHTML = '';
        previewQ.classList.remove('question-text');
        try {
            const mountPoint = document.createElement('div');
            mountPoint.style.width = '100%';
            previewQ.appendChild(mountPoint);
            previewRoot = mountCard(card, mountPoint, previewRoot);
        } catch (e) {
            previewQ.innerHTML = `<div style="color:red;">預覽錯誤：${e.message}</div>`;
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

// 當答錯時被呼叫，用來禁用「太簡單了」選項
window.onIncorrectAnswer = function () {
    const btnEasy = document.getElementById('btn-easy');
    if (btnEasy) {
        btnEasy.disabled = true;
        btnEasy.style.opacity = '0.5';
        btnEasy.style.cursor = 'not-allowed';
    }
};

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
window.switchProfile = switchProfile;

// 顯示版本號
document.getElementById('app-version').textContent = VERSION;

// 啟動
initApp();
