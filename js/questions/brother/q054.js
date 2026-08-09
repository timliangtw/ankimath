const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q054 - 罐子裡原來有多少元？
 * ------------------------------------------------------------------
 * 找回來的錢 = 給的錢 − 東西的價錢
 * 現在罐子裡的錢 = 各種硬幣加起來
 *   原來的錢 = 現在的錢 − 找回來放進去的錢
 * ------------------------------------------------------------------
 */

const COIN_TYPES = [
    { value: 50, color: 'bg-yellow-200 border-yellow-500 text-yellow-800' },
    { value: 10, color: 'bg-slate-200 border-slate-500 text-slate-700' },
    { value: 5, color: 'bg-orange-100 border-orange-400 text-orange-700' },
    { value: 1, color: 'bg-amber-100 border-amber-400 text-amber-700' }
];

const GOODS = [
    { name: '沙拉油', icon: '🫗' },
    { name: '洗髮精', icon: '🧴' },
    { name: '蛋糕', icon: '🍰' },
    { name: '雨傘', icon: '☂️' }
];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const given = 50 * (2 + Math.floor(Math.random() * 5));       // 給 100~300 元
        const price = given - (5 + Math.floor(Math.random() * 8) * 5); // 找回 5~40 元
        const change = given - price;
        if (price < 40) continue;

        const counts = [
            1 + Math.floor(Math.random() * 2),        // 50 元 1~2 個
            10 + Math.floor(Math.random() * 12),      // 10 元 10~21 個
            3 + Math.floor(Math.random() * 6),        // 5 元 3~8 個
            2 + Math.floor(Math.random() * 8)         // 1 元 2~9 個
        ];
        const now = counts.reduce((sum, c, i) => sum + c * COIN_TYPES[i].value, 0);
        const answer = now - change;
        if (answer < 50) continue;

        const wrongSet = new Set();
        for (const w of [now, now + change, change, answer + 10, answer - 10]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const goods = GOODS[Math.floor(Math.random() * GOODS.length)];
        return { given, price, change, counts, now, answer, options, goods };
    }
    return null;
}

const CoinJarProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        let p = null;
        for (let i = 0; i < 5 && !p; i++) p = generateProblem();
        setProblem(p);
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

    const { given, price, change, counts, now, answer, options, goods } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    錢的加減
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    媽媽給佑甫 <span className="text-amber-600">${given} 元</span>去買一瓶
                    ${goods.icon} <span className="text-amber-600">${price} 元</span>的${goods.name}，
                    他把找回來的錢放進家中裝零錢的罐子裡。
                </h1>
                <p className="mt-2 text-base md:text-lg font-bold text-slate-700">
                    佑甫點數罐子裡的零錢，發現一共有：
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 mb-5">
                <div className="space-y-2">
                    ${COIN_TYPES.map((coin, i) => html`
                        <div key=${coin.value} className="flex items-center gap-2">
                            <span className=${`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 text-xs font-black ${coin.color}`}>
                                ${coin.value}
                            </span>
                            <span className="text-lg font-black text-slate-600">× ${counts[i]} 個</span>
                        </div>
                    `)}
                </div>
            </div>

            <p className="text-center text-xl md:text-2xl font-bold text-slate-700 mb-5">
                罐子裡<span className="text-blue-600">原來</span>有多少元？
            </p>

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
                        現在罐子裡的錢包含了「找回來才放進去」的那些錢，要把它扣掉。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>找回來的錢：</span>
                            <span className="font-black text-amber-600">${given} − ${price} = ${change} 元</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 space-y-1">
                            ${COIN_TYPES.map((coin, i) => html`
                                <div key=${coin.value} className="flex justify-between items-center text-sm">
                                    <span>${coin.value} 元 × ${counts[i]} 個：</span>
                                    <span className="font-bold text-slate-600">${coin.value * counts[i]} 元</span>
                                </div>
                            `)}
                        </div>
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span>現在罐子裡：</span>
                            <span className="font-black text-blue-600">${counts.map((c, i) => c * COIN_TYPES[i].value).join(' + ')} = ${now} 元</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>扣掉後來放進去的：</span>
                            <span className="font-black text-blue-600">${now} − ${change} = ${answer} 元</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">原來有 ${answer} 元 ✓</span>
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
    id: 'q054',
    type: 'custom',
    title: '罐子裡原來有多少元？',
    q: '錢的加減：先算硬幣總額再扣掉找零（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${CoinJarProblem} />`);
    }
};
