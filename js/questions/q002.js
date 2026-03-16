const { useState, useEffect, useMemo } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 餐點統計實作
 * ------------------------------------------------------------------
 */

// --- 輔助元件：西式計數符號 (Tally Marks) ---
const DrawWesternTally = ({ n }) => html`
    <svg width="36" height="36" viewBox="0 0 100 100" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" className="inline-block mx-1">
        ${n >= 1 && html`<path d="M25 15 V85" />`}
        ${n >= 2 && html`<path d="M42 15 V85" />`}
        ${n >= 3 && html`<path d="M59 15 V85" />`}
        ${n >= 4 && html`<path d="M76 15 V85" />`}
        ${n >= 5 && html`<path d="M15 85 L85 15" strokeOpacity="0.8" />`}
    </svg>
`;

const TallyMark = ({ count }) => {
    const fullFives = Math.floor(count / 5);
    const remainder = count % 5;
    return html`
        <div className="flex items-center flex-wrap">
            ${[...Array(fullFives)].map((_, i) => html`<${DrawWesternTally} key=${i} n=${5} />`)}
            ${remainder > 0 && html`<${DrawWesternTally} n=${remainder} />`}
        </div>
    `;
};

const MealCountingQuestion = () => {
    // --- 1. 狀態管理 (State) ---
    const [menu, setMenu] = useState([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [friendsCount, setFriendsCount] = useState(0);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', 'trap', or null
    const [showExplanation, setShowExplanation] = useState(false);

    // 產生題目邏輯
    const generateProblem = () => {
        const items = [
            { name: '義大利麵', icon: '🍝' },
            { name: '雞塊', icon: '🍗' },
            { name: '牛肉飯', icon: '🍛' },
            { name: '雞腿', icon: '🍖' }
        ];

        let currentTotal = 0;
        const newMenu = items.map(item => {
            const count = Math.floor(Math.random() * 5) + 1;
            currentTotal += count;
            return { ...item, count };
        });

        // 確保總數至少有2，且至少有一個5以展示斜線
        if (currentTotal < 2) {
            newMenu[0].count += 2;
            currentTotal += 2;
        }
        if (currentTotal < 6 && newMenu[0].count < 5) {
            newMenu[0].count = 5;
            currentTotal = newMenu.reduce((acc, i) => acc + i.count, 0);
        }

        setMenu(newMenu);
        setTotalOrders(currentTotal);
        setFriendsCount(currentTotal - 1); // 朋友 = 總數 - 有均(1)
        setFeedback(null);
        setShowExplanation(false);
    };

    useEffect(() => {
        generateProblem();
    }, []);

    // 產生選項
    const options = useMemo(() => {
        if (!friendsCount) return [];
        const opts = new Set();
        opts.add(friendsCount); // 正解
        opts.add(totalOrders);  // 陷阱
        while (opts.size < 4) {
            const r = Math.floor(Math.random() * 5) + (friendsCount - 2);
            if (r > 0 && r !== friendsCount && r !== totalOrders) opts.add(r);
        }
        return Array.from(opts).sort((a, b) => a - b);
    }, [friendsCount, totalOrders]);

    // --- 2. 邏輯處理 (Handlers) ---
    const checkAnswer = (selectedAns) => {
        if (selectedAns === friendsCount) {
            setFeedback('correct');
            setShowExplanation(true);
        } else if (selectedAns === totalOrders) {
            setFeedback('trap');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();// 中了陷阱
            setShowExplanation(true);
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();setShowExplanation(false);
        }
    };

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <!-- ⚠️ DO NOT MODIFY START: 最外層容器，確保寬度與對齊 -->
        <div className="w-full font-sans text-left mx-auto">
        <!-- ⚠️ DO NOT MODIFY END -->

            <!-- 
               區域 A: 題目顯示區
            -->
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
                <!-- 標籤 -->
                <span className="absolute -top-3 -left-3 bg-amber-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    統計題目
                </span>
                
                <p className="text-xl md:text-2xl font-bold text-slate-700 leading-relaxed text-center mt-6 mb-4">
                    有均和幾個朋友一起用餐？
                </p>
                <p className="text-center text-slate-500 text-sm mb-6">
                    請觀察下表，看看大家點了什麼餐點，算算看有幾個朋友？
                </p>

                <!-- 餐點統計表 -->
                <div className="bg-white p-2 rounded-xl shadow-md border-2 border-slate-200 mx-auto max-w-lg relative rotate-1">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-700 rounded-sm opacity-80 z-10"></div>
                    <table className="w-full text-left border-collapse mt-2">
                        <thead>
                            <tr className="bg-orange-50 border-b-2 border-orange-100">
                                <th className="p-3 text-slate-600 font-bold w-1/3 text-sm md:text-base">餐點</th>
                                <th className="p-3 text-slate-600 font-bold text-sm md:text-base">數量</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${menu.map((item, idx) => html`
                                <tr key=${idx} className="border-b border-slate-100">
                                    <td className="p-3 flex items-center gap-2">
                                        <span className="text-xl bg-slate-50 p-1 rounded-full">${item.icon}</span>
                                        <span className="font-bold text-slate-700 text-sm md:text-base">${item.name}</span>
                                    </td>
                                    <td className="p-3">
                                        <${TallyMark} count=${item.count} />
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 
               區域 B: 作答與互動區
            -->
            <div className="flex flex-col items-center gap-6">
                
                <!-- 選項按鈕區 -->
                <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                    ${options.map(opt => html`
                        <button
                            key=${opt}
                            onClick=${() => checkAnswer(opt)}
                            disabled=${feedback === 'correct'}
                            className=${`
                                py-4 px-6 rounded-xl font-bold text-xl shadow-sm border-b-4 transition-all
                                ${feedback === 'correct' && opt === friendsCount
            ? 'bg-green-500 text-white border-green-700 scale-105'
            : feedback !== 'correct'
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95'
                : 'bg-slate-100 text-slate-400 border-slate-200 opacity-50'
        }
                            `}
                        >
                            ${opt} 個朋友
                        </button>
                    `)}
                </div>

                <!-- 結果回饋 -->
                ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-lg animate-pulse flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                        答案不對喔，再算算看！
                    </div>
                `}

                ${feedback === 'trap' && html`
                    <div className="text-orange-500 font-bold text-lg animate-pulse flex items-center gap-2">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        哎呀！記得把「有均」自己扣掉喔！
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200 animate-bounce">
                        <span className="text-xl font-bold">🎉 答對了！太棒了！</span>
                    </div>
                `}
            </div>

            <!-- 
               區域 C: 詳解區
            -->
            ${(showExplanation && feedback) && html`
                <div className="mt-8 p-6 bg-white rounded-xl border border-slate-200 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                        解題小教室
                    </h3>
                    <div className="space-y-4 text-slate-700">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold">1. 算出總餐點數：</span>
                            <div className="bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                                ${menu.map(m => m.count).join(' + ')} = ${totalOrders}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-lg pt-2 border-t border-slate-100">
                            <span className="font-bold">2. 扣掉自己：</span>
                            <div className="flex items-center gap-2 font-bold">
                                <span className="text-sky-600">${totalOrders}</span>
                                <span className="text-slate-400">-</span>
                                <span className="text-orange-500">1</span>
                                <span className="text-slate-400">=</span>
                                <span className="text-green-600 text-2xl">${friendsCount}</span>
                            </div>
                            <span className="text-green-600 text-sm">(個朋友)</span>
                        </div>
                        <div className="text-sm text-slate-400 mt-2">
                            題目問的是「和幾個朋友」，所以不包含自己喔。
                        </div>
                    </div>
                    <button onClick=${generateProblem} className="mt-4 w-full py-2 bg-sky-50 text-sky-600 font-bold rounded-lg hover:bg-sky-100 transition-colors">
                        再練習一題
                    </button>
                </div>
            `}

        <!-- ⚠️ DO NOT MODIFY START: 結尾標籤 -->
        </div>
        <!-- ⚠️ DO NOT MODIFY END -->
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q002', // 唯一 ID
    type: 'custom',
    title: '統計圖表：朋友有幾個？',
    q: '統計與加減應用 (點擊開啟互動介面)',
    render: (container) => {
        // ⚠️ DO NOT MODIFY: 這是 React 的掛載點
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MealCountingQuestion} />`);
    }
};