const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q009 - 小貓玩毛線球：被玩具車擋住的那一段是哪一個？
 * ------------------------------------------------------------------
 * 一條毛線從線球連到小貓，中間有一段被玩具車擋住。
 * 判斷依據：擋住的地方，線是從「上面」還是「下面」進去、
 *           又是從「上面」還是「下面」出來，端點要接得起來。
 * 四種進出組合（上上／上下／下上／下下）取三個當選項。
 * ------------------------------------------------------------------
 */

const VIEW_W = 400, VIEW_H = 170;
const COVER_X1 = 150, COVER_X2 = 250;      // 被車擋住的區間
const HIGH_Y = 52, LOW_Y = 118;            // 線可以進出的兩個高度
const YARN_COLORS = [
    { line: '#2563eb', ball: '#1d4ed8', name: '藍' },
    { line: '#dc2626', ball: '#b91c1c', name: '紅' },
    { line: '#7c3aed', ball: '#6d28d9', name: '紫' },
    { line: '#ea580c', ball: '#c2410c', name: '橘' }
];

// 選項小框的座標（與主圖的高度對應）
const BOX_W = 110, BOX_H = 76;
function toBoxY(mainY) {
    return ((mainY - 20) / 130) * BOX_H;
}

function optionPath(inY, outY, style) {
    const a = toBoxY(inY);
    const b = toBoxY(outY);
    if (style === 'loop') {
        // 中間打一個圈
        return `M 0,${a} C 30,${a} 20,${b - 34} 55,${b - 8} C 82,${b + 12} 70,${a - 10} 110,${b}`;
    }
    if (a === b) {
        // 同高度：中間拱一下
        const bump = a < BOX_H / 2 ? a + 34 : a - 34;
        return `M 0,${a} C 32,${bump} 78,${bump} 110,${b}`;
    }
    return `M 0,${a} C 38,${a} 72,${b} 110,${b}`;
}

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const inY = Math.random() < 0.5 ? HIGH_Y : LOW_Y;
    const outY = Math.random() < 0.5 ? HIGH_Y : LOW_Y;

    // 另外兩個干擾：進出組合和正解不同
    const combos = [
        { inY: HIGH_Y, outY: HIGH_Y },
        { inY: HIGH_Y, outY: LOW_Y },
        { inY: LOW_Y, outY: HIGH_Y },
        { inY: LOW_Y, outY: LOW_Y }
    ].filter(c => !(c.inY === inY && c.outY === outY));

    const decoys = shuffle(combos).slice(0, 2);
    const styles = shuffle(['wave', 'wave', 'loop']);

    const options = shuffle([
        { inY, outY, isRight: true },
        { ...decoys[0], isRight: false },
        { ...decoys[1], isRight: false }
    ]).map((opt, i) => ({ ...opt, style: styles[i], key: `${opt.inY}-${opt.outY}` }));

    const color = YARN_COLORS[Math.floor(Math.random() * YARN_COLORS.length)];
    const wobble = 18 + Math.floor(Math.random() * 22);

    return { inY, outY, options, color, wobble };
}

const YarnBallGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (index) => {
        if (gameState === 'correct') return;
        setSelected(index);
        if (problem.options[index].isRight) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">整理毛線中...</div>`;

    const { inY, outY, options, color, wobble } = problem;
    const leftPath = `M 46,85 C 80,${85 - wobble} 110,${inY + wobble} ${COVER_X1},${inY}`;
    const rightPath = `M ${COVER_X2},${outY} C 290,${outY - wobble} 320,${85 + wobble} 356,85`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    小貓玩毛線球
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    毛線有一段被玩具車擋住了，
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-800">車子後面的毛線是哪一個？</p>
            </div>

            <!-- 主圖 -->
            <div className="bg-lime-100 border-2 border-lime-300 rounded-2xl p-2 mb-5">
                <svg viewBox=${`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" role="img">
                    <!-- 毛線球 -->
                    <circle cx="30" cy="85" r="22" fill=${color.ball} />
                    <path d="M 14,80 C 26,70 40,78 46,92" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
                    <path d="M 16,94 C 28,86 40,92 46,102" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />

                    <!-- 左右兩段露出來的線 -->
                    <path d=${leftPath} fill="none" stroke=${color.line} strokeWidth="5" strokeLinecap="round" />
                    <path d=${rightPath} fill="none" stroke=${color.line} strokeWidth="5" strokeLinecap="round" />

                    <!-- 玩具車（擋住中間那段） -->
                    <rect x=${COVER_X1 - 6} y="34" width=${COVER_X2 - COVER_X1 + 12} height="102" rx="10" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
                    <rect x=${COVER_X1 + 4} y="58" width="82" height="34" rx="8" fill="#ef4444" />
                    <rect x=${COVER_X1 + 16} y="64" width="24" height="20" rx="4" fill="#bfdbfe" />
                    <rect x=${COVER_X1 + 48} y="64" width="24" height="20" rx="4" fill="#bfdbfe" />
                    <rect x=${COVER_X1 + 2} y="90" width="90" height="18" rx="6" fill="#dc2626" />
                    <circle cx=${COVER_X1 + 22} cy="110" r="10" fill="#334155" />
                    <circle cx=${COVER_X1 + 74} cy="110" r="10" fill="#334155" />
                    <circle cx=${COVER_X1 + 22} cy="110" r="4" fill="#e2e8f0" />
                    <circle cx=${COVER_X1 + 74} cy="110" r="4" fill="#e2e8f0" />

                    <!-- 小貓 -->
                    <text x="360" y="98" fontSize="42">🐱</text>
                </svg>
            </div>

            <!-- 三個選項 -->
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-5">
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
                            <div className="text-sm font-black text-slate-500 mb-1">${idx + 1}</div>
                            <svg viewBox=${`0 0 ${BOX_W} ${BOX_H}`} className="w-full h-auto">
                                <rect x="1" y="1" width=${BOX_W - 2} height=${BOX_H - 2} rx="8"
                                    fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
                                <path d=${optionPath(opt.inY, opt.outY, opt.style)}
                                    fill="none" stroke=${color.line} strokeWidth="5" strokeLinecap="round" />
                            </svg>
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看一次</div>
                    <p className="text-red-600 text-sm mt-1">看看車子左邊的線是從高的地方還是低的地方進去，右邊又是從哪裡出來。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>車子<span className="font-bold">左邊</span>的線：</span>
                            <span className="font-black text-orange-600">從${inY === HIGH_Y ? '上面' : '下面'}進去</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>車子<span className="font-bold">右邊</span>的線：</span>
                            <span className="font-black text-blue-600">從${outY === HIGH_Y ? '上面' : '下面'}出來</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-slate-600">
                            所以中間那段要
                            <span className="font-black text-green-700">
                                ${inY === HIGH_Y ? '上面' : '下面'}進、${outY === HIGH_Y ? '上面' : '下面'}出
                            </span>
                            才接得起來。
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再玩一次
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q009',
    type: 'custom',
    title: '小貓玩毛線球：被擋住的那一段',
    q: '看毛線進去和出來的高度，找出被玩具車擋住的那一段。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${YarnBallGame} />`);
    }
};
