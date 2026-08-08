const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q019 - 格子路：先向前走幾格，再倒回來幾格
 * ------------------------------------------------------------------
 * 小 A 每走 step 格，小 B 就先走 fwd 格、再倒回 back 格
 *   → 小 B 這一輪其實只前進 (fwd − back) 格
 * 小 A 走 total 格 = total ÷ step 輪
 *   → 小 B 最後停在 (total ÷ step) × (fwd − back) 格
 * ------------------------------------------------------------------
 */

const PAIRS = [
    { a: { name: '小象', icon: '🐘' }, b: { name: '小熊', icon: '🐻' } },
    { a: { name: '小鹿', icon: '🦌' }, b: { name: '小猴', icon: '🐵' } },
    { a: { name: '小牛', icon: '🐮' }, b: { name: '小羊', icon: '🐑' } }
];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const step = 1 + Math.floor(Math.random() * 2);        // 小 A 每輪走 1~2 格
        const back = 1 + Math.floor(Math.random() * 2);        // 倒回 1~2 格
        const net = 1 + Math.floor(Math.random() * 2);         // 每輪淨前進 1~2 格
        const fwd = net + back;                                 // 先走幾格
        const rounds = 2 + Math.floor(Math.random() * 3);       // 2~4 輪
        const total = step * rounds;
        const answer = net * rounds;

        if (fwd > 5 || answer > 10) continue;

        const wrongSet = new Set();
        for (const w of [fwd * rounds, answer + back, answer - 1, total, rounds]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        return { step, fwd, back, net, rounds, total, answer, options, pair };
    }
    return {
        step: 2, fwd: 3, back: 2, net: 1, rounds: 3, total: 6, answer: 3,
        options: [1, 3, 6, 9], pair: PAIRS[0]
    };
}

const ForwardBackProblem = () => {
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
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備賽道中...</div>`;

    const { step, fwd, back, net, rounds, total, answer, options, pair } = problem;
    const done = gameState === 'correct';
    const laneLength = Math.max(total, answer, fwd) + 2;

    const lane = (icon, filled, color) => html`
        <div className="flex items-center gap-1">
            <span className="text-2xl md:text-3xl w-9 shrink-0">${icon}</span>
            <div className="flex gap-0.5 flex-wrap">
                ${Array.from({ length: laneLength }).map((_, i) => html`
                    <div key=${i} className=${`w-6 h-6 md:w-7 md:h-7 rounded border-2 flex items-center justify-center text-xs font-black
                        ${i < filled ? `${color} text-white` : 'bg-white border-slate-200 text-slate-300'}`}>
                        ${i < filled ? i + 1 : ''}
                    </div>
                `)}
            </div>
        </div>
    `;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    格子路
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    ${pair.a.icon} ${pair.a.name}走 <span className="text-amber-600">${step} 格</span>，
                    ${pair.b.icon} ${pair.b.name}就要先走 <span className="text-blue-600">${fwd} 格</span>，
                    再倒回來 <span className="text-red-500">${back} 格</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    ${pair.a.name}走 <span className="text-amber-600">${total} 格</span>，
                    ${pair.b.name}最後會停在第幾格？
                </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-3 mb-5 space-y-2 overflow-x-auto">
                ${lane(pair.a.icon, total, 'bg-amber-400 border-amber-500')}
                ${lane(pair.b.icon, done ? answer : 0, 'bg-blue-400 border-blue-500')}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
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
                                ${isCorrect ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            ${opt}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再走一次看看</div>
                    <p className="text-red-600 text-sm mt-1">
                        先走 ${fwd} 格再倒回 ${back} 格，其實只往前 ${net} 格喔。
                    </p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>${pair.b.name}每一輪：</span>
                            <span className="font-black text-blue-600">先走 ${fwd} 格 − 倒回 ${back} 格 = 前進 ${net} 格</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>${pair.a.name}走 ${total} 格：</span>
                            <span className="font-black text-amber-600">${total} ÷ ${step} = ${rounds} 輪</span>
                        </div>
                        ${Array.from({ length: rounds }).map((_, i) => html`
                            <div key=${i} className="flex justify-between items-center text-sm">
                                <span>第 ${i + 1} 輪結束：</span>
                                <span className="font-bold text-slate-600">${pair.b.name}在第 ${(i + 1) * net} 格</span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">第 ${answer} 格 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再走一次（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q019',
    type: 'custom',
    title: '格子路：先走幾格再倒回來',
    q: '前進與後退：算出每一輪其實走了幾格。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ForwardBackProblem} />`);
    }
};
