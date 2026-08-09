const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q051 - 特價買幾瓶，一共便宜多少元？
 * ------------------------------------------------------------------
 * 一瓶便宜的錢 = 原價 − 特價
 *   買 N 瓶一共便宜 = （原價 − 特價）× N
 * 常見錯誤：只算一瓶便宜多少，忘了乘上瓶數。
 * ------------------------------------------------------------------
 */

const ITEMS = [
    { name: '果汁', unit: '瓶', icon: '🧃' },
    { name: '牛奶', unit: '瓶', icon: '🥛' },
    { name: '麵包', unit: '個', icon: '🍞' },
    { name: '布丁', unit: '個', icon: '🍮' }
];
const BUYERS = ['丹丹', '小宇', '阿力', '婷婷'];

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const origin = 12 + Math.floor(Math.random() * 24);        // 原價 12~35
        const sale = 5 + Math.floor(Math.random() * 15);           // 特價 5~19
        if (sale >= origin) continue;

        const perSave = origin - sale;
        const count = 3 + Math.floor(Math.random() * 6);           // 買 3~8 個
        const answer = perSave * count;

        const wrongSet = new Set();
        for (const w of [perSave, sale * count, origin * count, answer + perSave, answer - perSave]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
        const buyer = BUYERS[Math.floor(Math.random() * BUYERS.length)];
        return { origin, sale, perSave, count, answer, options, item, buyer };
    }
    return {
        origin: 17, sale: 10, perSave: 7, count: 3, answer: 21,
        options: [7, 10, 21, 30], item: ITEMS[0], buyer: BUYERS[0]
    };
}

const SaleDiscountProblem = () => {
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

    const { origin, sale, perSave, count, answer, options, item, buyer } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘減應用題
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    ${item.icon} 一${item.unit}${item.name}原本 <span className="text-amber-600">${origin} 元</span>，
                    特價期間每${item.unit}只賣 <span className="text-blue-600">${sale} 元</span>。
                    ${buyer}買了 <span className="text-amber-600">${count} ${item.unit}</span>特價的${item.name}。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    一共便宜了多少元？
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
                            (${idx + 1})  ${opt} 元
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        一${item.unit}便宜多少？買了 ${count} ${item.unit}，要把便宜的錢乘起來喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>一${item.unit}便宜：</span>
                            <span className="font-black text-amber-600">${origin} − ${sale} = ${perSave} 元</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>買了 ${count} ${item.unit}：</span>
                            <span className="font-black text-blue-600">${perSave} × ${count} = ${answer} 元</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">一共便宜 ${answer} 元 ✓</span>
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
    id: 'q051',
    type: 'custom',
    title: '特價一共便宜了多少元？',
    q: '乘減應用題：一個便宜多少 × 數量（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${SaleDiscountProblem} />`);
    }
};
