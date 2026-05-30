const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目：野餐統計大作戰 (Anki 轉化版)
 * ------------------------------------------------------------------
 */

const MyQuestionComponent = () => {
    // --- 1. 狀態管理 (State) ---
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null

    // 輔助函數：產生正字標記字串
    const getTallyString = (num) => {
        const full = Math.floor(num / 5);
        const remainder = num % 5;
        let str = "正 ".repeat(full);
        const visualStrokes = ["", "一", "ㄒ", "下", "止"];
        str += visualStrokes[remainder];
        return str.trim() || "0";
    };

    // 輔助函數：產生隨機題目資料
    const generateProblem = () => {
        const categories = ["水果類", "餐點類", "飲料類", "器具類"];
        const itemsPerPerson = [2, 3, 5][Math.floor(Math.random() * 3)];
        const peopleCount = Math.floor(Math.random() * 10) + 4; // 4 to 13 people
        const totalItems = peopleCount * itemsPerPerson;

        let remaining = totalItems;
        let counts = [];
        for (let i = 0; i < 3; i++) {
            let val = Math.floor(Math.random() * (remaining / (4 - i) * 1.5)) + 1;
            counts.push(val);
            remaining -= val;
        }
        counts.push(remaining);

        const tableData = categories.map((name, index) => ({
            name,
            count: counts[index],
            tally: getTallyString(counts[index])
        }));

        return {
            tableData,
            totalItems,
            itemsPerPerson,
            answer: peopleCount.toString(),
            unit: "人"
        };
    };

    // 初始化題目
    useEffect(() => {
        setProblem(generateProblem());
    }, []);

    // --- 2. 邏輯處理 (Handlers) ---
    const checkAnswer = () => {
        if (userAnswer === problem.answer) {
            setFeedback('correct');
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();}
    };

    const resetProblem = () => {
        setProblem(generateProblem());
        setUserAnswer('');
        setFeedback(null);
    };

    if (!problem) return html`<div>載入中...</div>`;

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <!-- ⚠️ DO NOT MODIFY START -->
        <div className="w-full font-sans text-left mx-auto">
        <!-- ⚠️ DO NOT MODIFY END -->

            <!-- 區域 A: 題目顯示區 -->
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
                <span className="absolute -top-3 -left-3 bg-amber-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    題目
                </span>
                
                <p className="text-xl md:text-2xl font-bold text-slate-700 leading-relaxed mt-4 break-words">
                    小芳和同事們要去野餐，大家登記了要帶的物品（如下表）。如果每個人都登記帶 <span className="text-sky-600">${problem.itemsPerPerson}</span> 樣物品，請問參加野餐活動的總共有多少個人？
                </p>

                <!-- 統計表格 -->
                <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-sm">
                                <th className="p-3 border-b border-slate-100">物品類別</th>
                                <th className="p-3 border-b border-slate-100 text-center">登記數量 (正字標記)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${problem.tableData.map(item => html`
                                <tr key=${item.name} className="border-b border-slate-50 last:border-0">
                                    <td className="p-3 font-bold text-slate-600">${item.name}</td>
                                    <td className="p-3 text-center text-2xl text-sky-700 font-serif font-bold tracking-widest">${item.tally}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 區域 B: 作答與互動區 -->
            <div className="flex flex-col items-center gap-6">
                
                <div className="flex items-center gap-4 w-full justify-center flex-wrap">
                    <input
                        type="number"
                        value=${userAnswer}
                        onChange=${(e) => setUserAnswer(e.target.value)}
                        placeholder="?"
                        className="w-32 h-20 text-center text-4xl font-bold border-4 border-slate-200 rounded-2xl focus:border-sky-400 focus:outline-none transition-all text-slate-700"
                        disabled=${feedback === 'correct'}
                    />
                    <span className="text-2xl font-bold text-slate-400">${problem.unit}</span>
                </div>

                ${feedback !== 'correct' && html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-600 text-white text-xl font-bold rounded-2xl shadow-lg transition-all"
                    >
                        送出答案
                    </button>
                `}

                ${feedback === 'wrong' && html`
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-red-500 font-bold text-lg animate-pulse">
                            答案不對喔，再試試看！
                        </div>
                        <button onClick=${() => setFeedback(null)} className="text-slate-400 underline text-sm">重新嘗試</button>
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200 animate-bounce">
                            <span className="text-xl font-bold">🎉 答對了！太棒了！</span>
                        </div>
                        <button 
                            onClick=${resetProblem}
                            className="text-sky-500 font-bold hover:underline"
                        >
                            再挑戰一題？
                        </button>
                    </div>
                `}
            </div>

            <!-- 區域 C: 詳解區 -->
            ${feedback === 'correct' && html`
                <div className="mt-8 p-6 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                        <span>💡</span> 老師的解題詳解
                    </h3>
                    <div className="space-y-4 text-slate-600 leading-relaxed">
                        <p>
                            1️⃣ <strong>先算出物品總數：</strong><br/>
                            我們把所有類別加起來：${problem.tableData.map(i => `${i.name}(${i.count})`).join(' + ')} = <strong className="text-slate-800">${problem.totalItems}</strong> 樣物品。
                        </p>
                        <p>
                            2️⃣ <strong>再算出總人數：</strong><br/>
                            每個人帶 <strong className="text-slate-800">${problem.itemsPerPerson}</strong> 樣物品，所以：<br/>
                            <code className="bg-white px-2 py-1 rounded border border-slate-200 text-lg font-bold">${problem.totalItems} ÷ ${problem.itemsPerPerson} = ${problem.answer}</code>
                        </p>
                        <p className="font-bold text-emerald-700 pt-2 border-t border-emerald-100">
                            所以這場野餐總共有 ${problem.answer} 個人參加喔！
                        </p>
                    </div>
                </div>
            `}

        <!-- ⚠️ DO NOT MODIFY START -->
        </div>
        <!-- ⚠️ DO NOT MODIFY END -->
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q015',
    type: 'custom',
    title: '野餐統計大作戰',
    q: '根據正字統計表計算參加野餐的總人數',
    render: (container) => {
        // ⚠️ DO NOT MODIFY
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MyQuestionComponent} />`);
    }
};