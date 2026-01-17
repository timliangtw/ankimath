// 動態載入題庫
// 這樣使用者只需要將檔案放入 (如 q008.js)，不需要修改此檔案
// 限制：檔名必須是 q001, q002... 連續編號

async function loadQuestions() {
    const questions = [];
    let index = 1;
    const maxLimit = 999; // 避免無窮迴圈的保險機制

    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3; // 允許連續找不到 3 個檔案才停止

    while (index <= maxLimit) {
        // 格式化編號：將 1 轉成 "001"
        const idStr = index.toString().padStart(3, '0');
        const filename = `./q${idStr}.js`;

        try {
            // 動態引入
            // 注意：這裡是瀏覽器原生的 dynamic import
            // 如果檔案不存在，瀏覽器會報錯 (404)，我們會 catch 住並認為列表結束
            const module = await import(filename);

            // 假設每個題庫 module export default 一個物件
            questions.push(module.default);
            console.log(`Loaded: ${filename}`);

            // 成功載入，重置連續失敗計數
            consecutiveFailures = 0;

        } catch (error) {
            // 載入失敗，我們不馬上 break，而是增加失敗計數
            // console.warn(`Failed to load q${idStr}.js (might be missing)`);
            consecutiveFailures++;

            if (consecutiveFailures >= maxConsecutiveFailures) {
                console.log(`Stopped loading after ${maxConsecutiveFailures} consecutive missing files.`);
                break;
            }
        }
        index++;
    }

    return questions;
}

export default loadQuestions;
