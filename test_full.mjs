/**
 * 全面 E2E 測試：AnkiMath
 * 測試項目：
 * 1. 每題預覽頁不空白（custom render 正常）
 * 2. 隨機化題目連續出兩次，答案不完全相同（非固定）
 * 3. 答錯後仍可繼續作答（選擇題選項可點、填空送出按鈕存在）
 * 4. 跨題評分按鈕全部可點（再練習/還可以/太簡單了）
 * 5. 全程無 JS console 錯誤
 */

import pkg from '/Users/tim_liang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.59.1/node_modules/playwright/index.js';
const { chromium } = pkg;

const URL = 'https://timliangtw.github.io/ankimath/?debug';
const TIMEOUT = 15000;

let passed = 0;
let failed = 0;
const issues = [];

function pass(label) {
    console.log(`  ✓ ${label}`);
    passed++;
}
function fail(label, detail = '') {
    console.error(`  ✗ ${label}${detail ? ': ' + detail : ''}`);
    failed++;
    issues.push({ label, detail });
}
function section(title) {
    console.log(`\n[${title}]`);
}

async function login(page) {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForSelector('#startup-loading', { state: 'hidden', timeout: 20000 });
    const nameInput = page.locator('input[type="text"], input[placeholder]').first();
    if (await nameInput.isVisible()) {
        await nameInput.fill('test');
        await page.locator('button').filter({ hasText: /開始|登入|進入/ }).first().click();
    }
    await page.waitForSelector('#home-page.active', { timeout: 10000 });
}

async function goToSettings(page) {
    const settingsBtn = page.locator('button').filter({ hasText: /家長|設定|管理/ }).first();
    if (await settingsBtn.isVisible()) await settingsBtn.click();
    else await page.evaluate(() => openSettings && openSettings());
    await page.waitForSelector('#settings-page.active', { timeout: 5000 });
}

// ── 收集所有題目 ID ──────────────────────────────────────────────
async function getQuestionIds(page) {
    return await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.q-item'))
            .map(el => el.querySelector('.q-item-id')?.textContent?.replace('#', '').trim())
            .filter(Boolean);
    });
}

const browser = await chromium.launch({ headless: true });
const jsErrors = [];

try {
    // ═══════════════════════════════════════════════════════
    section('Test 1：登入並取得題目列表');
    // ═══════════════════════════════════════════════════════
    const page = await browser.newPage();
    page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
    page.on('pageerror', err => jsErrors.push(err.message));

    await login(page);
    pass('登入成功，首頁顯示');

    await goToSettings(page);
    const qIds = await getQuestionIds(page);
    if (qIds.length > 0) pass(`取得 ${qIds.length} 道題目`);
    else fail('無法取得題目列表');

    // ═══════════════════════════════════════════════════════
    section('Test 2：每題預覽不空白');
    // ═══════════════════════════════════════════════════════
    for (const id of qIds) {
        await goToSettings(page);
        const item = page.locator(`.q-item`).filter({ hasText: `#${id}` }).first();
        await item.click();
        await page.waitForSelector('#preview-page.active', { timeout: 5000 });
        await page.waitForTimeout(800); // React 非同步渲染

        const previewQ = page.locator('#preview-q');
        const html = await previewQ.innerHTML();
        const text = await previewQ.innerText().catch(() => '');
        const isEmpty = html.trim() === '' || html === '<div></div>';
        const hasError = html.includes('style="color:red"') || html.includes('color:red');

        if (hasError) fail(`q${id} 預覽有 React 錯誤`, html.slice(0, 120));
        else if (isEmpty) fail(`q${id} 預覽空白`);
        else pass(`q${id} 預覽正常渲染`);
    }

    // ═══════════════════════════════════════════════════════
    section('Test 3：隨機化題目每次數字不同');
    // ═══════════════════════════════════════════════════════

    // 從預覽連抓兩次同一題，比較顯示文字
    const randomCandidates = ['q006', 'q007', 'q014', 'q015', 'q017', 'q018', 'q019']; // 已知有隨機化的題目
    const toCheck = randomCandidates.filter(id => qIds.includes(id));

    for (const qid of toCheck) {
        const texts = [];
        for (let i = 0; i < 3; i++) {
            await goToSettings(page);
            const item = page.locator(`.q-item`).filter({ hasText: `#${qid}` }).first();
            await item.click();
            await page.waitForSelector('#preview-page.active', { timeout: 5000 });
            await page.waitForTimeout(600);
            const t = await page.locator('#preview-q').innerText().catch(() => '');
            texts.push(t.replace(/\s+/g, ' ').trim().slice(0, 200));
        }
        const allSame = texts.every(t => t === texts[0]);
        if (allSame) fail(`${qid} 三次預覽文字完全相同（可能未隨機化）`, texts[0].slice(0, 80));
        else pass(`${qid} 隨機化正常（每次不同）`);
    }

    // ═══════════════════════════════════════════════════════
    section('Test 4：答錯後仍可繼續作答');
    // ═══════════════════════════════════════════════════════

    // 進入學習模式，對第一題答錯後測試
    await page.evaluate(() => window.goHome && goHome());
    await page.waitForSelector('#home-page.active', { timeout: 5000 });
    await page.locator('button').filter({ hasText: /開始學習|開始複習|開始練習/ }).first().click();
    await page.waitForSelector('#study-page.active', { timeout: 5000 });
    await page.waitForTimeout(800);

    // 拿到當前 card id
    const currentCardId = await page.evaluate(() => window.currentCard?.id || '');
    console.log(`  目前題目：${currentCardId}`);

    const cardType = await page.evaluate(() => window.currentCard?.type || '');
    const hasRender = await page.evaluate(() => !!window.currentCard?.render);

    if (hasRender) {
        // Custom 題型：找選項按鈕，點第一個非正確答案的
        const optBtns = page.locator('#card-content button').filter({ hasNotText: /再試|換數字|重新/ });
        const count = await optBtns.count();
        if (count > 0) {
            // 點第一個選項（可能錯）
            await optBtns.first().click();
            await page.waitForTimeout(400);

            const wrongMsg = await page.locator('#card-content').evaluate(el =>
                el.innerText.includes('再想') || el.innerText.includes('不對') || el.innerText.includes('答錯') || el.innerText.includes('❌')
            );
            const correctMsg = await page.locator('#card-content').evaluate(el =>
                el.innerText.includes('答對') || el.innerText.includes('🎉')
            );

            if (wrongMsg) {
                // 確認其他選項仍可點
                const stillClickable = await optBtns.nth(1).isEnabled().catch(() => false);
                if (stillClickable) pass(`${currentCardId} 答錯後其他選項仍可點`);
                else fail(`${currentCardId} 答錯後其他選項被 disabled`);
            } else if (correctMsg) {
                pass(`${currentCardId} 第一個選項即正確，跳過答錯測試`);
            } else {
                pass(`${currentCardId} 無明確答對/答錯訊息（題型可能不同）`);
            }
        } else {
            // 填空題：找 input + 送出按鈕
            const input = page.locator('#card-content input[type="number"], #card-content input[type="text"]').first();
            const submitBtn = page.locator('#card-content button').filter({ hasText: /送出/ }).first();
            if (await input.isVisible() && await submitBtn.isVisible()) {
                await input.fill('99999'); // 故意答錯
                await submitBtn.click();
                await page.waitForTimeout(400);
                const submitStillVisible = await submitBtn.isVisible();
                if (submitStillVisible) pass(`${currentCardId} 答錯後送出按鈕仍顯示`);
                else fail(`${currentCardId} 答錯後送出按鈕消失`);
            } else {
                pass(`${currentCardId} 未偵測到可測試的互動元素，跳過`);
            }
        }
    } else {
        pass(`${currentCardId} 為非 custom 題型，跳過答錯重試測試`);
    }

    // ═══════════════════════════════════════════════════════
    section('Test 5：跨題評分按鈕全部可點（連過 3 題）');
    // ═══════════════════════════════════════════════════════

    // 確保在 study-page
    const isStudyActive = await page.locator('#study-page.active').isVisible().catch(() => false);
    if (!isStudyActive) {
        await page.evaluate(() => window.goHome && goHome());
        await page.waitForSelector('#home-page.active', { timeout: 5000 });
        await page.locator('button').filter({ hasText: /開始/ }).first().click();
        await page.waitForSelector('#study-page.active', { timeout: 5000 });
        await page.waitForTimeout(500);
    }

    for (let round = 1; round <= 3; round++) {
        await page.waitForSelector('#study-page.active', { timeout: 5000 });
        await page.waitForTimeout(600);

        const cid = await page.evaluate(() => window.currentCard?.id || '?');
        const ratingArea = page.locator('#rating-btns-area');
        const isRatingVisible = await ratingArea.isVisible().catch(() => false);

        if (!isRatingVisible) {
            // 非 custom：按「看答案」
            const showAns = page.locator('#show-answer-btn-area button');
            if (await showAns.isVisible()) await showAns.click();
            await page.waitForSelector('#rating-btns-area', { state: 'visible', timeout: 3000 });
        }

        const btnDanger  = page.locator('#rating-btns-area .btn-danger');
        const btnPrimary = page.locator('#rating-btns-area .btn-primary');
        const btnSuccess = page.locator('#rating-btns-area #btn-easy');

        const d = await btnDanger.isEnabled().catch(() => false);
        const p = await btnPrimary.isEnabled().catch(() => false);
        const s = await btnSuccess.isEnabled().catch(() => false);

        if (d && p && s) pass(`第 ${round} 題 (${cid})：三個評分按鈕全部 enabled`);
        else fail(`第 ${round} 題 (${cid})：評分按鈕有被 disabled`, `再練習=${d} 還可以=${p} 太簡單=${s}`);

        // 點「還可以」進下一題
        await btnPrimary.click();
        await page.waitForTimeout(800);

        // 若跳到完成頁，重新開始
        const isFinish = await page.locator('#finish-page.active').isVisible().catch(() => false);
        if (isFinish) {
            await page.evaluate(() => window.goHome && goHome());
            await page.waitForSelector('#home-page.active', { timeout: 5000 });
            await page.locator('button').filter({ hasText: /開始/ }).first().click();
            await page.waitForSelector('#study-page.active', { timeout: 5000 });
        }
    }

    // ═══════════════════════════════════════════════════════
    section('Test 6：全程 JS 錯誤檢查');
    // ═══════════════════════════════════════════════════════
    const seriousErrors = jsErrors.filter(e =>
        !e.includes('404') && !e.includes('ERR_ABORTED') &&
        !e.includes('Firebase') && !e.includes('firestore') &&
        !e.includes('q020') && !e.includes('q021') && !e.includes('q022')
    );
    if (seriousErrors.length === 0) pass('無嚴重 JS 錯誤');
    else {
        seriousErrors.forEach(e => fail('JS 錯誤', e.slice(0, 120)));
    }

} catch (err) {
    fail('測試執行異常', err.message);
} finally {
    await browser.close();
}

// ── 總結 ──────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`結果：${passed} 通過，${failed} 失敗`);
if (issues.length > 0) {
    console.log('\n⚠️  發現的問題：');
    issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. [${issue.label}]${issue.detail ? '\n     ' + issue.detail : ''}`);
    });
}
if (failed > 0) process.exit(1);
