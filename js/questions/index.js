// 動態載入題庫
// 這樣使用者只需要將檔案放入 (如 q008.js)，不需要修改此檔案
// 限制：檔名必須是 q001, q002... 連續編號

async function loadQuestions() {
    const questions = [];
    let index = 1;
    const maxLimit = 999; // 避免無窮迴圈的保險機制

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

            index++;
        } catch (error) {
            // 載入失敗，通常代表檔案不存在，停止載入
            // console.warn(`End of question list or error loading q${idStr}.js:`, error);
            // 這裡我們不 throw，而是當作載入結束
            break;
        }
    }

    return questions;
}

export default loadQuestions;
