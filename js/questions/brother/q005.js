const { useState, useEffect, useMemo } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 購物付款應用題
 * ------------------------------------------------------------------
 */

// --- 輔助元件：10元硬幣 SVG ---
const Coin10 = () => html`
    <svg width="40" height="40" viewBox="0 0 100 100" className="inline-block shadow-sm rounded-full">
        <circle cx="50" cy="50" r="48" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="4 2"/>
        <text x="50" y="58" fontSize="36" fontWeight="bold" textAnchor="middle" fill="#713f12" fontFamily="sans-serif">10</text>
    </svg>
`;

// --- 主程式元件 ---
const ShoppingProblem = () => {
    // 1. 狀態管理
    const [items, setItems] = useState([
        { id: 1, name: '懷舊便當', price: 79, icon: '🍱' },
        { id: 2, name: '冰紅茶', price: 15, icon: '🥤' }
    ]);

    const [gameState, setGameState] = useState('playing'); // playing, won
    const [feedback, setFeedback] = useState(null); // { type: 'correct'|'too_few'|'too_many', val: number }

    // 2. 邏輯計算
    // 計算總價
    const totalPrice = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

    // 計算正確答案 (無條件進位)
    const correctCoins = Math.ceil(totalPrice / 10);

    // 選項 (產生 4 個選項，包含正確答案)
    const options = useMemo(() => {
        // 依照題目邏輯產生選項
        return [correctCoins - 2, correctCoins - 1, correctCoins, correctCoins + 1];
    }, [correctCoins]);

    // 重新出題
    const generateProblem = () => {
        const newPrice1 = Math.floor(Math.random() * 40) + 50; // 50~89
        const newPrice2 = Math.floor(Math.random() * 20) + 10; // 10~29
        setItems([
            { id: 1, name: '好吃的便當', price: newPrice1, icon: '🍱' },
            { id: 2, name: '清涼飲料', price: newPrice2, icon: '🥤' }
        ]);
        setGameState('playing');
        setFeedback(null);
    };

    // 檢查答案
    useEffect(() => { generateProblem(); }, []);

    const checkAnswer = (selectedCoins) => {
        if (selectedCoins === correctCoins) {
            setFeedback({ type: 'correct', val: selectedCoins });
            setGameState('won');
        } else if (selectedCoins < correctCoins) {
            setFeedback({ type: 'too_few', val: selectedCoins });
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('playing');
        } else {
            setFeedback({ type: 'too_many', val: selectedCoins });
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('playing');
        }
    };

    // 3. 畫面渲染
    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            
            <!-- 標題區 -->
            <div className="text-center mb-8">
                <div className="inline-block bg-yellow-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3 transform -rotate-2">
                    生活數學應用
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                    至少要付幾個 10 元？
                </h1>
                <p className="text-slate-500 text-sm md:text-base">
                    小瑜只能用 <strong className="text-yellow-600 bg-yellow-100 px-1 rounded">10元硬幣</strong> 付錢喔！
                </p>
            </div>

            <!-- 商品展示區 (收據樣式) -->
            <div className="bg-white p-6 rounded-xl shadow-lg border-t-8 border-yellow-400 mb-8 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-gray-200 rounded-full border-4 border-yellow-50"></div>
                <h2 className="text-center text-gray-400 text-sm font-bold mb-4 tracking-widest">購物清單</h2>
                
                <div className="space-y-4">
                    ${items.map(item => html`
                        <div key=${item.id} className="flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl md:text-4xl">${item.icon}</span>
                                <span className="text-lg md:text-xl font-bold text-slate-700">${item.name}</span>
                            </div>
                            <div className="text-xl md:text-2xl font-bold text-slate-600">
                                $${item.price}
                            </div>
                        </div>
                    `)}
                </div>

                <!-- 總計 -->
                <div className="mt-6 flex justify-between items-center pt-4 border-t-2 border-slate-800">
                    <span className="text-lg font-bold text-slate-500">總金額</span>
                    <div className="text-3xl md:text-4xl font-black text-slate-800">
                        $${totalPrice}
                    </div>
                </div>
            </div>

            <!-- 互動說明文字 -->
            <div className="text-center mb-6">
                <p className="text-lg text-slate-700 font-bold mb-4">
                    請問至少要拿幾個硬幣才夠？
                </p>
            </div>

            <!-- 選項區 -->
            <div className="grid grid-cols-2 gap-4 mb-8">
                ${options.map(opt => html`
                    <button
                        key=${opt}
                        onClick=${() => checkAnswer(opt)}
                        disabled=${gameState === 'won' && opt !== correctCoins}
                        className=${`
                            py-4 rounded-xl text-xl font-bold transition-all border-b-4 flex flex-col items-center justify-center gap-2
                            ${gameState === 'won' && opt === correctCoins
            ? 'bg-green-500 text-white border-green-700 scale-105 shadow-lg'
            : feedback?.type === 'too_few' && feedback.val === opt
                ? 'bg-red-100 text-red-500 border-red-200 animate-pulse'
                : feedback?.type === 'too_many' && feedback.val === opt
                    ? 'bg-orange-100 text-orange-600 border-orange-200 animate-pulse'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-yellow-50 hover:border-yellow-300 active:scale-95'
        }
                        `}
                    >
                        <span>${opt} 個</span>
                        <!-- 視覺化小硬幣堆 (最多顯示5個做示意) -->
                        <div className="flex -space-x-2 overflow-hidden px-2 h-8 items-center opacity-50">
                            ${[...Array(Math.min(opt, 5))].map((_, i) => html`
                                <div key=${i} className="w-6 h-6 rounded-full bg-yellow-400 border border-yellow-600"></div>
                            `)}
                            ${opt > 5 && html`<span className="text-xs pl-3">...</span>`}
                        </div>
                    </button>
                `)}
            </div>

            <!-- 回饋與詳解區 -->
            <div className="min-h-[160px]">
                ${feedback && html`
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-500">
                        <!-- 1. 不夠錢的情況 -->
                        ${feedback.type === 'too_few' && html`
                            <div className="text-center">
                                <div className="text-red-500 font-bold text-xl mb-2 flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                    錢不夠喔！
                                </div>
                                <p className="text-slate-600 text-lg">
                                    ${feedback.val} 個 10 元只有 <strong className="text-red-500">$${feedback.val * 10}</strong> 元，<br/>
                                    但是總共要 <strong className="text-slate-800">$${totalPrice}</strong> 元。
                                </p>
                            </div>
                        `}

                        <!-- 2. 太多錢的情況 -->
                        ${feedback.type === 'too_many' && html`
                            <div className="text-center">
                                <div className="text-orange-500 font-bold text-xl mb-2 flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                    太多了！
                                </div>
                                <p className="text-slate-600">
                                    雖然 <strong className="text-orange-500">$${feedback.val * 10}</strong> 夠付錢，<br/>
                                    但題目問「至少」，我們可以少拿一個硬幣試試看？
                                </p>
                            </div>
                        `}

                        <!-- 3. 正確答案 -->
                        ${feedback.type === 'correct' && html`
                            <div className="text-center space-y-4">
                                <div className="text-green-600 font-bold text-2xl mb-2 flex items-center justify-center gap-2 animate-bounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                    答對了！
                                </div>
                                
                                <!-- 圖解計算過程 -->
                                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-left">
                                    <h3 className="font-bold text-yellow-800 mb-2 border-b border-yellow-200 pb-1">為什麼是 ${correctCoins} 個？</h3>
                                    <div className="space-y-2 text-slate-700">
                                        <div className="flex justify-between">
                                            <span>總共要付：</span>
                                            <span className="font-bold">$${totalPrice}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span>拿 ${correctCoins - 1} 個 10 元：</span>
                                            <span className="text-red-500 font-bold">$${(correctCoins - 1) * 10} (不夠)</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white p-2 rounded border border-green-200 shadow-sm">
                                            <span>拿 ${correctCoins} 個 10 元：</span>
                                            <span className="text-green-600 font-bold">$${correctCoins * 10} (夠了！)</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- 視覺化硬幣堆 -->
                                <div className="flex justify-center flex-wrap gap-2 mt-4">
                                    ${[...Array(correctCoins)].map((_, i) => html`
                                        <div key=${i} className="transition-all duration-500" style=${{ animationDelay: `${i * 0.1}s` }}>
                                            <${Coin10} />
                                        </div>
                                    `)}
                                </div>
                                
                                <button onClick=${generateProblem} className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg transition-colors">
                                    再試一題
                                </button>
                            </div>
                        `}
                    </div>
                `}
            </div>
        </div>
    `;
};

export default {
    id: 'q005',
    type: 'custom',
    title: '購物付款：要付幾個10元？',
    q: '生活應用與估算 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ShoppingProblem} />`);
    }
};