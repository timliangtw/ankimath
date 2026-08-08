const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q018 - 格子路：一個走 1 格，另一個走 K 格
 * ------------------------------------------------------------------
 * 小 A 走 1 格 → 小 B 走 K 格
 *   小 A 走 N 格 → 小 B 走 N × K 格
 * ------------------------------------------------------------------
 */

const PAIRS = [
    { slow: { name: '小豬', icon: '🐷' }, fast: { name: '小鱷魚', icon: '🐊' } },
    { slow: { name: '小兔', icon: '🐰' }, fast: { name: '小馬', icon: '🐴' } },
    { slow: { name: '小雞', icon: '🐤' }, fast: { name: '小狗', icon: '🐶' } },
    { slow: { name: '小貓', icon: '🐱' }, fast: { name: '小老虎', icon: '🐯' } }
];

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const rate = 2 + Math.floor(Math.random() * 3);       // 快的走 2~4 格
        const steps = 2 + Math.floor(Math.random() * 4);      // 慢的走 2~5 格
        const answer = rate * steps;
        if (answer > 16) continue;

        const wrongSet = new Set();
        for (const w of [steps + rate, answer + rate, answer - rate, steps, rate * (steps + 1)]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const pair = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        return { rate, steps, answer, options, pair };
    }
    return { rate: 2, steps: 3, answer: 6, options: [4, 5, 6, 8], pair: PAIRS[0] };
}

const GridRaceProblem = () => {
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

    const { rate, steps, answer, options, pair } = problem;
    const done = gameState === 'correct';
    const laneLength = Math.max(answer, steps) + 2;

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
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${pair.slow.icon} ${pair.slow.name}走 <span className="text-amber-600">1 格</span>，
                    ${pair.fast.icon} ${pair.fast.name}就走 <span className="text-amber-600">${rate} 格</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    ${pair.slow.name}走 <span className="text-blue-600">${steps} 格</span>，
                    ${pair.fast.name}要走幾格？
                </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-3 mb-5 space-y-2 overflow-x-auto">
                ${lane(pair.slow.icon, steps, 'bg-amber-400 border-amber-500')}
                ${lane(pair.fast.icon, done ? answer : 0, 'bg-blue-400 border-blue-500')}
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
                    <div className="text-red-500 font-bold text-lg">再數一次</div>
                    <p className="text-red-600 text-sm mt-1">
                        ${pair.slow.name}每走 1 格，${pair.fast.name}就要走 ${rate} 格。
                    </p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${Array.from({ length: steps }).map((_, i) => html`
                            <div key=${i} className="flex justify-between items-center text-sm">
                                <span>${pair.slow.name}第 ${i + 1} 格：</span>
                                <span className="font-bold text-blue-600">${pair.fast.name}走到第 ${(i + 1) * rate} 格</span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">${steps} 個 ${rate} 格：</span>
                            <span className="font-black text-green-700 text-xl">${steps} × ${rate} = ${answer} 格 ✓</span>
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
    id: 'q018',
    type: 'custom',
    title: '格子路：一個走 1 格，另一個走幾格',
    q: '倍數關係：一邊走幾格，另一邊要走幾格。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${GridRaceProblem} />`);
    }
};
