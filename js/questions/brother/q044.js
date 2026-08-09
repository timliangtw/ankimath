const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q044 - 號碼牌發到第幾輪：他是第幾個客人？
 * ------------------------------------------------------------------
 * 號碼牌 1 ~ N 發完就再從 1 號開始發，
 *   第 R 輪的 K 號 = 前面已經發完 (R−1) 輪，再往後數 K 個
 *   → 第 (R−1) × N + K 個客人
 * ------------------------------------------------------------------
 */

const SHOPS = ['烤肉店', '牛肉麵店', '早餐店', '冰淇淋店'];

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const total = [20, 25, 30, 40][Math.floor(Math.random() * 4)];
        const round = 2 + Math.floor(Math.random() * 4);          // 第 2~5 輪
        const num = 1 + Math.floor(Math.random() * total);
        const answer = (round - 1) * total + num;

        const wrongSet = new Set();
        for (const w of [num, round * total + num, (round - 1) * total, round * total - num, answer + total]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const shop = SHOPS[Math.floor(Math.random() * SHOPS.length)];
        return { total, round, num, answer, options, shop };
    }
    return { total: 30, round: 4, num: 28, answer: 118, options: [28, 117, 118, 148], shop: SHOPS[0] };
}

const TicketRoundProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (opt) => {
        if (gameState === 'correct') return;
        setSelected(opt);
        if (opt === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { total, round, num, answer, options, shop } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    週期與乘法
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    ${shop}老闆做了 <span className="text-amber-600">1 到 ${total} 號</span>的號碼牌，
                    按照順序發給每一位客人，發完 ${total} 號之後，又會再從 1 號開始發。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    冠霖拿到<span className="text-blue-600">第 ${round} 輪</span>的號碼牌
                    <span className="text-blue-600">${num} 號</span>，他是第幾個客人？
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === opt;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(opt)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1})  ${opt} 個
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        第 ${round} 輪之前，已經完整發過幾輪？每一輪都是 ${total} 個人。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>前面完整發完的輪數：</span>
                            <span className="font-black text-blue-600">${round} − 1 = ${round - 1} 輪</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>這 ${round - 1} 輪一共發給：</span>
                            <span className="font-black text-amber-600">${round - 1} × ${total} = ${(round - 1) * total} 個人</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>再往後數到 ${num} 號：</span>
                            <span className="font-black text-blue-600">${(round - 1) * total} + ${num} = ${answer}</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">第 ${answer} 個客人 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q044',
    type: 'custom',
    title: '號碼牌第幾輪：他是第幾個客人？',
    q: '週期與乘法：發完一輪再重來（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TicketRoundProblem} />`);
    }
};
