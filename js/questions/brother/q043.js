const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q043 - 存錢筒：還要再存幾天？
 * ------------------------------------------------------------------
 * 還差的錢 = 玩具價錢 − 存錢筒裡已有的錢
 *   還要存的天數 = 還差的錢 ÷ 每天存的錢
 * 陷阱：直接用玩具價錢除以每天存的錢，忘了扣掉已經存的。
 * ------------------------------------------------------------------
 */

const TOYS = [
    { name: '玩具車', icon: '🚗' },
    { name: '機器人', icon: '🤖' },
    { name: '足球', icon: '⚽' },
    { name: '拼圖', icon: '🧩' },
    { name: '故事書', icon: '📚' }
];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const perDay = [2, 5, 10][Math.floor(Math.random() * 3)];
        const days = 4 + Math.floor(Math.random() * 9);         // 還要存 4~12 天
        const gap = perDay * days;
        const saved = 5 * (4 + Math.floor(Math.random() * 15));  // 已存 20~90 元
        const price = saved + gap;

        if (price > 200 || price < 40) continue;

        const wrongSet = new Set();
        for (const w of [Math.round(price / perDay), Math.round(saved / perDay), days + 2, days - 2, days + 5]) {
            if (Number.isInteger(w) && w > 0 && w !== days) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, days].sort(() => Math.random() - 0.5);
        const toy = TOYS[Math.floor(Math.random() * TOYS.length)];
        return { perDay, days, gap, saved, price, options, toy };
    }
    return { perDay: 2, days: 7, gap: 14, saved: 61, price: 75, options: [6, 7, 8, 13], toy: TOYS[0] };
}

const PiggyBankProblem = () => {
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
        if (opt === problem.days) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { perDay, days, gap, saved, price, options, toy } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘除應用題
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    🐷 宗翰的存錢筒裡已經有 <span className="text-amber-600">${saved} 元</span>，
                    他每天再存 <span className="text-blue-600">${perDay} 元</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    還要再存幾天，才能買 ${toy.icon} <span className="text-amber-600">${price} 元</span>的${toy.name}？
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
                            (${idx + 1})  ${opt} 天
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        存錢筒裡已經有錢了，要先算出「還差多少」，再除以每天存的錢。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>還差多少錢：</span>
                            <span className="font-black text-amber-600">${price} − ${saved} = ${gap} 元</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>每天存 ${perDay} 元：</span>
                            <span className="font-black text-blue-600">${gap} ÷ ${perDay} = ${days} 天</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">還要存 ${days} 天 ✓</span>
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
    id: 'q043',
    type: 'custom',
    title: '存錢筒：還要再存幾天？',
    q: '乘除應用題：先算差額再除（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PiggyBankProblem} />`);
    }
};
