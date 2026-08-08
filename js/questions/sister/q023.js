const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q023 - 重疊的圖形：把它們分開會是什麼樣子？
 * ------------------------------------------------------------------
 * 上面那張圖是兩個圖形疊在一起（後面那個被擋住一部分），
 * 分開來看，兩個都應該是完整的。
 * 干擾選項：其中一個仍然缺一角、或形狀／顏色換掉了。
 * ------------------------------------------------------------------
 */

const SHAPES = ['square', 'circle', 'triangle', 'pentagon'];
const COLORS = [
    { fill: '#fbbf24', stroke: '#b45309' },
    { fill: '#4ade80', stroke: '#15803d' },
    { fill: '#f472b6', stroke: '#be185d' },
    { fill: '#60a5fa', stroke: '#1d4ed8' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const [shapeA, shapeB, shapeC] = shuffle(SHAPES).slice(0, 3);
    const [colorA, colorB] = shuffle(COLORS).slice(0, 2);

    const correct = { a: { shape: shapeA, color: colorA, clipped: false }, b: { shape: shapeB, color: colorB, clipped: false } };
    const decoys = [
        { a: { shape: shapeA, color: colorA, clipped: true }, b: { shape: shapeB, color: colorB, clipped: false } },
        { a: { shape: shapeA, color: colorA, clipped: false }, b: { shape: shapeB, color: colorB, clipped: true } },
        { a: { shape: shapeC, color: colorA, clipped: false }, b: { shape: shapeB, color: colorB, clipped: false } }
    ];

    const options = shuffle([
        { ...correct, isRight: true },
        ...shuffle(decoys).slice(0, 2).map(d => ({ ...d, isRight: false }))
    ]);

    return { shapeA, shapeB, colorA, colorB, options };
}

const Shape = ({ shape, color, clipId }) => {
    const clip = clipId ? `url(#${clipId})` : undefined;
    const common = { fill: color.fill, stroke: color.stroke, strokeWidth: 3, clipPath: clip };
    if (shape === 'circle') return html`<circle cx="30" cy="30" r="24" ...${common} />`;
    if (shape === 'triangle') return html`<polygon points="30,6 55,52 5,52" ...${common} />`;
    if (shape === 'pentagon') return html`<polygon points="30,5 54,23 45,52 15,52 6,23" ...${common} />`;
    return html`<rect x="7" y="7" width="46" height="46" rx="4" ...${common} />`;
};

// 一組「分開後」的圖：兩個圖形並排，clipped 的那個右半／左半被切掉
const SplitPair = ({ pair, idPrefix }) => html`
    <svg viewBox="0 0 130 60" className="w-full h-auto">
        <defs>
            <clipPath id=${`${idPrefix}-a`}><rect x="0" y="0" width="32" height="60" /></clipPath>
            <clipPath id=${`${idPrefix}-b`}><rect x="28" y="0" width="40" height="60" /></clipPath>
        </defs>
        <g><${Shape} shape=${pair.a.shape} color=${pair.a.color} clipId=${pair.a.clipped ? `${idPrefix}-a` : null} /></g>
        <g transform="translate(70,0)"><${Shape} shape=${pair.b.shape} color=${pair.b.color} clipId=${pair.b.clipped ? `${idPrefix}-b` : null} /></g>
    </svg>
`;

const OverlapShapeGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');
    const [round, setRound] = useState(0);

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
        setRound(r => r + 1);
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (problem.options[idx].isRight) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">疊圖形中...</div>`;

    const { shapeA, shapeB, colorA, colorB, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    重疊的圖形
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    上面這張圖是兩個圖形疊在一起。
                </h1>
                <p className="text-lg md:text-xl font-bold text-slate-700">
                    把它們分開來，會是哪一組？
                </p>
            </div>

            <!-- 重疊圖：後面那個被前面蓋住一部分 -->
            <div className="flex justify-center mb-6">
                <div className="bg-white rounded-2xl border-2 border-slate-200 p-3 w-48">
                    <svg viewBox="0 0 90 60" className="w-full h-auto">
                        <g><${Shape} shape=${shapeA} color=${colorA} /></g>
                        <g transform="translate(30,0)"><${Shape} shape=${shapeB} color=${colorB} /></g>
                    </svg>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-5">
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
                                flex items-center gap-2 rounded-2xl border-b-4 p-2 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <span className="text-lg font-black text-slate-500 w-6">${idx + 1}</span>
                            <div className="flex-1">
                                <${SplitPair} pair=${opt} idPrefix=${`q023-r${round}-o${idx}`} />
                            </div>
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看一次</div>
                    <p className="text-red-600 text-sm mt-1">
                        分開以後，被擋住的那個圖形應該是<span className="font-black">完整</span>的喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-slate-700 border border-green-100 space-y-2">
                        <p className="font-bold">後面那個圖形只是被蓋住，其實是完整的。</p>
                        <div className="flex justify-center">
                            <div className="w-40">
                                <${SplitPair} pair=${options.find(o => o.isRight)} idPrefix=${`q023-r${round}-ans`} />
                            </div>
                        </div>
                        <p className="text-sm text-slate-500">
                            另外兩組不是缺了一角，就是形狀被換掉了。
                        </p>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再看一組（換圖形）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q023',
    type: 'custom',
    title: '重疊的圖形：分開來是什麼樣子',
    q: '被擋住的圖形其實是完整的，選出正確的一組。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OverlapShapeGame} />`);
    }
};
