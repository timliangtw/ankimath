const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q058 - 同一條繩子改圍別的形狀，每一邊有多長？
 * ------------------------------------------------------------------
 * 繩子長度不變 = 圍出來的形狀周長不變
 *   先算原本的周長：每邊長 × 邊數
 *   再除以新形狀的邊數 = 新的每邊長
 * ------------------------------------------------------------------
 */

const SHAPES = {
    triangle: { name: '正三角形', sides: 3, icon: '🔺' },
    square: { name: '正方形', sides: 4, icon: '🟦' },
    hexagon: { name: '正六邊形', sides: 6, icon: '⬡' }
};

const PAIRS = [
    ['square', 'triangle'],
    ['triangle', 'square'],
    ['hexagon', 'triangle'],
    ['triangle', 'hexagon'],
    ['square', 'hexagon'],
    ['hexagon', 'square']
];

const OWNERS = ['王老伯', '李阿姨', '陳伯伯', '林奶奶'];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const [fromKey, toKey] = PAIRS[Math.floor(Math.random() * PAIRS.length)];
        const from = SHAPES[fromKey], to = SHAPES[toKey];

        const side1 = 3 + Math.floor(Math.random() * 12);        // 原本每邊 3~14 公尺
        const perimeter = side1 * from.sides;
        if (perimeter % to.sides !== 0) continue;
        const answer = perimeter / to.sides;
        if (answer < 2 || answer === side1) continue;

        const wrongSet = new Set();
        for (const w of [side1, perimeter, Math.round(side1 * to.sides / from.sides), answer + 2, answer - 2]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const owner = OWNERS[Math.floor(Math.random() * OWNERS.length)];
        return { from, to, side1, perimeter, answer, options, owner };
    }
    return null;
}

const RopeShapeProblem = () => {
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

    const { from, to, side1, perimeter, answer, options, owner } = problem;

    const polygon = (sides, label, color) => {
        const pts = Array.from({ length: sides }, (_, i) => {
            const a = (i * 2 * Math.PI) / sides - Math.PI / 2;
            return `${50 + 36 * Math.cos(a)},${52 + 36 * Math.sin(a)}`;
        }).join(' ');
        return html`
            <div className="text-center">
                <svg viewBox="0 0 100 100" className="w-24 h-24 mx-auto">
                    <polygon points=${pts} fill="none" stroke=${color} strokeWidth="5" strokeLinejoin="round" />
                </svg>
                <div className="text-sm font-black" style=${{ color }}>${label}</div>
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    周長
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    ${owner}用一條繩子圍出一塊${from.name}的土地，
                    每一邊的長是 <span className="text-amber-600">${side1} 公尺</span>。
                    後來${owner}決定用<span className="text-blue-600">同一條繩子</span>改圍出一塊${to.name}的土地。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    這塊${to.name}土地每一邊的長是幾公尺？
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-6 flex items-center justify-center gap-3">
                ${polygon(from.sides, `${from.name}（${from.sides} 邊）`, '#d97706')}
                <span className="text-3xl text-slate-400">→</span>
                ${polygon(to.sides, `${to.name}（${to.sides} 邊）`, '#2563eb')}
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
                            (${idx + 1})  ${opt} 公尺
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        繩子沒有變長也沒有變短，先算出繩子有多長，再平分給 ${to.sides} 個邊。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>繩子的長度（${from.name}周長）：</span>
                            <span className="font-black text-amber-600">${side1} × ${from.sides} = ${perimeter} 公尺</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>改圍${to.name}（${to.sides} 個邊）：</span>
                            <span className="font-black text-blue-600">${perimeter} ÷ ${to.sides} = ${answer} 公尺</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            繩子長度沒有變，所以兩個形狀的周長是一樣的。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">每一邊 ${answer} 公尺 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換形狀）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q058',
    type: 'custom',
    title: '同一條繩子改圍別的形狀',
    q: '周長：先算周長再平分給每一邊（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${RopeShapeProblem} />`);
    }
};
