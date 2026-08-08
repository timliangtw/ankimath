// 動態載入題庫
// 這樣使用者只需要將檔案放入 (如 q008.js)，不需要修改此檔案
// 限制：檔名必須是 q001, q002... 連續編號

const VALID_BANKS = new Set(['brother', 'sister']);
const MAX_CONSECUTIVE_FAILURES = 3; // 允許連續找不到 3 個檔案才停止
const RETRY_DELAY_MS = 150;

function normalizeBank(bank) {
    return VALID_BANKS.has(bank) ? bank : 'brother';
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

let retryToken = 0;

// 載入失敗有兩種可能：檔案不存在（正常，代表題庫結束），或只是網路暫時出問題。
// 兩者從 import 看起來一樣，所以一律重試一次，避免網路抖動讓某一題被靜默跳過。
// 注意：瀏覽器會把載入失敗的網址記在 module map 裡，直接重試同一個網址不會重新下載，
// 所以重試時一定要加上不重複的 query string。
async function importWithRetry(filename) {
    try {
        return await import(filename);
    } catch (firstError) {
        await delay(RETRY_DELAY_MS);
        try {
            return await import(`${filename}?retry=${Date.now()}-${++retryToken}`);
        } catch (secondError) {
            return null;
        }
    }
}

async function loadQuestions(bank = 'brother') {
    const questionBank = normalizeBank(bank);
    const questions = [];
    const failedIndexes = [];
    let index = 1;
    const maxLimit = 999; // 避免無窮迴圈的保險機制

    let consecutiveFailures = 0;

    while (index <= maxLimit) {
        // 格式化編號：將 1 轉成 "001"
        const idStr = index.toString().padStart(3, '0');
        const filename = `./${questionBank}/q${idStr}.js`;

        const module = await importWithRetry(filename);

        if (module) {
            questions.push(module.default);
            console.log(`Loaded: ${filename}`);
            consecutiveFailures = 0;
        } else {
            // 載入不到，先記下來，連續失敗夠多次才認定題庫已經結束
            failedIndexes.push(index);
            consecutiveFailures++;

            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.log(`Stopped loading after ${MAX_CONSECUTIVE_FAILURES} consecutive missing files.`);
                break;
            }
        }
        index++;
    }

    // 結尾那幾個連續失敗是「題庫到此為止」，中間的失敗才是真的漏題
    const missingCount = Math.max(0, failedIndexes.length - consecutiveFailures);
    questions.missing = failedIndexes
        .slice(0, missingCount)
        .map(i => `q${i.toString().padStart(3, '0')}`);

    if (questions.missing.length > 0) {
        console.warn(`題庫 ${questionBank} 有題目載入失敗（重試後仍失敗）:`, questions.missing.join(', '));
    }

    return questions;
}

export default loadQuestions;
