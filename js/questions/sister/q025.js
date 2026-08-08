const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q025 - 中間放什麼？
 * ------------------------------------------------------------------
 * 十字形的圖：
 *   上下兩張圖 → 形狀相同（顏色不同）
 *   左右兩張圖 → 顏色相同（形狀不同）
 * 所以中間那一格要「上下的形狀 ＋ 左右的顏色」。
 * 三個選項：正解、形狀對顏色錯、顏色對形狀錯。
 * ------------------------------------------------------------------
 */

const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const COLORS = [
    { key: 'red', fill: '#ef4444', stroke: '#991b1b' },
    { key: 'blue', fill: '#3b82f6', stroke: '#1e40af' },
    { key: 'yellow', fill: '#facc15', stroke: '#a16207' },
    { key: 'green', fill: '#22c55e', stroke: '#15803d' },
    { key: 'purple', fill: '#a855f7', stroke: '#6b21a8' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const [rowShape, otherShape1, otherShape2] = shuffle(SHAPES).slice(0, 3);
    const [colShape] = [otherShape1];
    const [colColor, otherColor1, otherColor2] = shuffle(COLORS).slice(0, 3);

    // 上下：形狀都是 rowShape，顏色各不相同（也不是 colColor）
    const top = { shape: rowShape, color: otherColor1 };
    const bottom = { shape: rowShape, color: otherColor2 };
    // 左右：顏色都是 colColor，形狀各不相同（也不是 rowShape）
    const left = { shape: colShape, color: colColor };
    const right = { shape: otherShape2, color: colColor };

    const answer = { shape: rowShape, color: colColor };
    const options = shuffle([
        { ...answer, isRight: true },
        { shape: rowShape, color: otherColor1, isRight: false },  // 形狀對、顏色錯
        { shape: otherShape2, color: colColor, isRight: false }   // 顏色對、形狀錯
    ]);

    return { top, bottom, left, right, answer, options, rowShape, colColor };
}

const Figure = ({ shape, color, size = 'w-14 h-14' }) => {
    const props = { fill: color.fill, stroke: color.stroke, strokeWidth: 3 };
    let body;
    if (shape === 'circle') body = html`<circle cx="30" cy="30" r="22" ...${props} />`;
    else if (shape === 'square') body = html`<rect x="9" y="9" width="42" height="42" rx="5" ...${props} />`;
    else if (shape === 'triangle') body = html`<polygon points="30,7 53,50 7,50" ...${props} />`;
    else if (shape === 'star') body = html`<polygon points="30,5 37,23 56,23 41,34 47,52 30,41 13,52 19,34 4,23 23,23" ...${props} />`;
    else body = html`<path d="M30,52 C6,36 8,14 20,12 C26,11 30,17 30,20 C30,17 34,11 40,12 C52,14 54,36 30,52 Z" ...${props} />`;

    return html`<svg viewBox="0 0 60 60" className=${`${size} mx-auto`}>${body}</svg>`;
};

const MiddlePieceGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
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
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">排圖中...</div>`;

    const { top, bottom, left, right, answer, options } = problem;
    const done = gameState === 'correct';

    const cell = (content, filled = true) => html`
        <div className=${`rounded-xl border-2 p-1 flex items-center justify-center min-h-[68px]
            ${filled ? 'bg-white border-blue-300' : 'bg-blue-50 border-dashed border-blue-300'}`}>
            ${content}
        </div>
    `;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    中間放什麼
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    橫的一排有一個共同的地方，直的一排也有一個共同的地方。
                </h1>
                <p className="text-lg md:text-xl font-bold text-slate-700">中間那一格應該放哪一個？</p>
            </div>

            <!-- 十字圖 -->
            <div className="bg-blue-100 border-2 border-blue-200 rounded-2xl p-3 mb-5">
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    <div></div>
                    ${cell(html`<${Figure} shape=${top.shape} color=${top.color} />`)}
                    <div></div>

                    ${cell(html`<${Figure} shape=${left.shape} color=${left.color} />`)}
                    ${cell(
                        done
                            ? html`<${Figure} shape=${answer.shape} color=${answer.color} />`
                            : html`<span className="text-3xl font-black text-blue-400">？</span>`,
                        done
                    )}
                    ${cell(html`<${Figure} shape=${right.shape} color=${right.color} />`)}

                    <div></div>
                    ${cell(html`<${Figure} shape=${bottom.shape} color=${bottom.color} />`)}
                    <div></div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
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
                                rounded-2xl border-b-4 p-2 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <${Figure} shape=${opt.shape} color=${opt.color} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看一次</div>
                    <p className="text-red-600 text-sm mt-1">
                        上面和下面的<span className="font-black">形狀</span>一樣，
                        左邊和右邊的<span className="font-black">顏色</span>一樣。
                    </p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>直的一排（上下）：</span>
                            <span className="font-black text-amber-600">形狀都一樣</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>橫的一排（左右）：</span>
                            <span className="font-black text-blue-600">顏色都一樣</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-center">
                            <span className="font-bold">所以中間要放</span>
                            <div className="flex justify-center mt-1">
                                <${Figure} shape=${answer.shape} color=${answer.color} />
                            </div>
                            <span className="font-black text-green-700">上下的形狀 ＋ 左右的顏色 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再排一次（換圖）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q025',
    type: 'custom',
    title: '中間放什麼？',
    q: '直排看形狀、橫排看顏色，找出中間那一格。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MiddlePieceGame} />`);
    }
};
