const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template)
 * ------------------------------------------------------------------
 * 使用說明：
 * 1. 將此檔案複製並重新命名，例如 q008.js
 * 2. 修改下方的 export default 中的 id 與 title
 * 3. 在 MyQuestionComponent 中撰寫您的題目邏輯與畫面
 * 
 * ⚠️ 注意事項：
 * - 請勿移除或修改標註 "⚠️ DO NOT MODIFY" 的區域
 * - 最外層的 <div className="w-full ..."> 是確保版面正常的關鍵
 * ------------------------------------------------------------------
 */

const MyQuestionComponent = () => {
    // --- 1. 狀態管理 (State) ---
    // 在這裡定義題目的變數，例如答案、使用者輸入、是否答對
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null

    // 模擬題目資料 (您也可以隨機產生)
    const problem = {
        question: "這是一個範例題目，請算出 1 + 1 = ?",
        answer: "2",
        unit: "個"
    };

    // --- 2. 邏輯處理 (Handlers) ---
    const checkAnswer = () => {
        if (userAnswer === problem.answer) {
            setFeedback('correct');
        } else {
            setFeedback('wrong');
        }
    };

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <!-- ⚠️ DO NOT MODIFY START: 最外層容器，確保寬度與對齊 -->
        <div className="w-full font-sans text-left mx-auto">
        <!-- ⚠️ DO NOT MODIFY END -->

            <!-- 
               區域 A: 題目顯示區
               (建議保留 bg-amber-50 風格，但內容長度可自由增加)
            -->
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
                <!-- 標籤 (選擇性保留) -->
                <span className="absolute -top-3 -left-3 bg-amber-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    題目
                </span>
                
                <!-- 題目文字 (可自動換行，字數多也不會跑版) -->
                <p className="text-2xl md:text-3xl font-bold text-slate-700 leading-relaxed text-center mt-8 break-words">
                    ${problem.question}
                </p>
                
                <!-- 如果有圖片或示意圖，可以放在這裡 -->
                <!-- <div className="my-4">...</div> -->
            </div>

            <!-- 
               區域 B: 作答與互動區
               (這是 Flex 容器，會自動垂直排列)
            -->
            <div className="flex flex-col items-center gap-6">
                
                <!-- 輸入框 (範例) -->
                <div className="flex items-center gap-4 w-full justify-center flex-wrap">
                    <input
                        type="text"
                        value=${userAnswer}
                        onChange=${(e) => setUserAnswer(e.target.value)}
                        placeholder="?"
                        className="w-32 h-20 text-center text-4xl font-bold border-4 border-slate-200 rounded-2xl focus:border-sky-400 focus:outline-none transition-all text-slate-700"
                        disabled=${feedback === 'correct'}
                    />
                    <span className="text-2xl font-bold text-slate-400">${problem.unit}</span>
                </div>

                <!-- 送出按鈕 -->
                ${!feedback && html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-600 text-white text-xl font-bold rounded-2xl shadow-lg transition-all"
                    >
                        送出答案
                    </button>
                `}

                <!-- 結果回饋 -->
                ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-lg animate-pulse">
                        答案不對喔，再試試看！
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200 animate-bounce">
                        <span className="text-xl font-bold">🎉 答對了！太棒了！</span>
                    </div>
                `}
            </div>

            <!-- 
               區域 C: 詳解區 (選擇性)
               (可放置大量文字，容器會自動延伸)
            -->
            ${feedback === 'correct' && html`
                <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-slate-700 mb-2">💡 小知識</h3>
                    <p className="text-slate-600 leading-relaxed">
                        這裡可以放很長很長的解釋文字，
                        或是圖解說明。因為外層容器設定了 w-full 和自動高度，
                        所以這裡寫再多都不會破壞版面喔！
                    </p>
                </div>
            `}

        <!-- ⚠️ DO NOT MODIFY START: 結尾標籤 -->
        </div>
        <!-- ⚠️ DO NOT MODIFY END -->
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'template', // ⚠️ 請記得修改為唯一的數字 ID (如 8, 9, 10...)
    type: 'custom',
    title: '新題目模板', // 標題
    q: '這是模板 (使用者在列表看到的文字)',
    render: (container) => {
        // ⚠️ DO NOT MODIFY: 這是 React 的掛載點
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MyQuestionComponent} />`);
    }
};
