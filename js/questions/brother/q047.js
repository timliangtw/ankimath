const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q047 - 巧克力裝盒：可以用哪些分法？
 * ------------------------------------------------------------------
 * 一種分法可行的條件有兩個：
 *   1. 每盒裝的數量要能整除總數（才裝得剛剛好）
 *   2. 裝出來的盒數不能超過「最多幾個盒子」
 * 四種分法裡挑出全部可行的那一組。
 * ------------------------------------------------------------------
 */

const LABELS = ['甲', '乙', '丙', '丁'];

function divisorsOf(n) {
    const out = [];
    for (let i = 2; i <= n; i++) if (n % i === 0) out.push(i);
    return out;
}

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function setKey(list) {
    return [...list].sort((a, b) => a - b).join(',');
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const total = [18, 20, 24, 30, 36][Math.floor(Math.random() * 5)];
        const maxBoxes = 3 + Math.floor(Math.random() * 4);          // 最多 3~6 個盒子

        const divs = divisorsOf(total).filter(d => d < total);
        if (divs.length < 4) continue;

        const picked = shuffle(divs).slice(0, 4).sort((a, b) => b - a);  // 每盒裝的數量，由大到小
        const plans = picked.map((per, i) => ({
            label: LABELS[i],
            per,
            boxes: total / per,
            ok: total / per <= maxBoxes
        }));

        const okIdx = plans.map((p, i) => (p.ok ? i : -1)).filter(i => i >= 0);
        if (okIdx.length < 1 || okIdx.length > 3) continue;

        // 干擾組合：和正解不一樣的其他子集
        const answerKey = setKey(okIdx);
        const decoyPool = [];
        for (let mask = 1; mask < 16; mask++) {
            const subset = [0, 1, 2, 3].filter(i => mask & (1 << i));
            if (subset.length < 1 || subset.length > 3) continue;
            if (setKey(subset) === answerKey) continue;
            decoyPool.push(subset);
        }
        const decoys = shuffle(decoyPool).slice(0, 3);
        if (decoys.length < 3) continue;

        const options = shuffle([
            { picks: okIdx, isRight: true },
            ...decoys.map(d => ({ picks: d, isRight: false }))
        ]);

        return { total, maxBoxes, plans, options };
    }
    return null;
}

const ChocolateBoxProblem = () => {
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

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (problem.options[idx].isRight) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { total, maxBoxes, plans, options } = problem;
    const label = (picks) => picks.map(i => plans[i].label).join('、');

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    除法與因數
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    🍫 媽媽做了 <span className="text-amber-600">${total} 塊</span>巧克力，想全部裝進盒子裡，
                    每個盒子裡的巧克力要裝一樣多，
                    <span className="text-blue-600">最多只有 ${maxBoxes} 個盒子</span>可以裝。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    媽媽可以用下面哪些分法？
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-5 grid grid-cols-2 gap-2">
                ${plans.map(p => html`
                    <div key=${p.label} className="bg-white rounded-xl border border-amber-200 px-3 py-2 font-bold text-slate-700">
                        <span className="text-amber-600">${p.label}</span>：每 ${p.per} 塊裝一盒
                    </div>
                `)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(idx)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-xl md:text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${label(opt.picks)}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        每一種分法都算算看會裝成幾盒，盒子超過 ${maxBoxes} 個就不行喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${plans.map(p => html`
                            <div key=${p.label} className="flex justify-between items-center">
                                <span>${p.label}：每 ${p.per} 塊一盒</span>
                                <span className=${`font-black ${p.ok ? 'text-green-600' : 'text-red-400'}`}>
                                    ${total} ÷ ${p.per} = ${p.boxes} 盒${p.ok ? '（可以）' : `（超過 ${maxBoxes} 盒）`}
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">可以用的分法：</span>
                            <span className="font-black text-green-700 text-xl">${label(options.find(o => o.isRight).picks)} ✓</span>
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
    id: 'q047',
    type: 'custom',
    title: '巧克力裝盒：可以用哪些分法？',
    q: '除法與因數：裝得剛好又不超過盒數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ChocolateBoxProblem} />`);
    }
};
