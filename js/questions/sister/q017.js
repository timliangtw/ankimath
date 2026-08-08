const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q017 - 我們的影子：哪些影子是錯的？
 * ------------------------------------------------------------------
 * 太陽在左邊 → 影子一定朝右邊；太陽在右邊 → 影子一定朝左邊。
 * 圖上有幾個小朋友，其中有些人的影子方向和太陽對不起來，
 * 小朋友要把「錯的影子」全部點出來。
 * ------------------------------------------------------------------
 */

const KID_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6'];

function generateProblem() {
    const sunOnLeft = Math.random() < 0.5;
    const kidCount = 4 + Math.floor(Math.random() * 2);          // 4~5 個小朋友
    const wrongCount = 1 + Math.floor(Math.random() * 2);        // 其中 1~2 個影子是錯的

    const wrongIdx = new Set();
    while (wrongIdx.size < wrongCount) {
        wrongIdx.add(Math.floor(Math.random() * kidCount));
    }

    const slots = [
        { x: 60, y: 62 }, { x: 160, y: 46 }, { x: 258, y: 62 },
        { x: 108, y: 112 }, { x: 214, y: 116 }
    ].slice(0, kidCount);

    const kids = slots.map((slot, i) => ({
        ...slot,
        color: KID_COLORS[i % KID_COLORS.length],
        // 影子朝向：正確時和太陽相反
        shadowRight: wrongIdx.has(i) ? sunOnLeft === false : sunOnLeft === true,
        isWrong: wrongIdx.has(i)
    }));

    return { sunOnLeft, kids, wrongTotal: wrongCount };
}

const ShadowGame = () => {
    const [problem, setProblem] = useState(null);
    const [found, setFound] = useState([]);
    const [wrongPick, setWrongPick] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setFound([]);
        setWrongPick(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (index) => {
        if (gameState === 'correct') return;
        const kid = problem.kids[index];
        if (kid.isWrong) {
            if (found.includes(index)) return;
            const next = [...found, index];
            setFound(next);
            setWrongPick(null);
            setGameState(next.length === problem.wrongTotal ? 'correct' : 'playing');
        } else {
            setWrongPick(index);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">曬太陽中...</div>`;

    const { sunOnLeft, kids, wrongTotal } = problem;
    const done = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    我們的影子
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    看看圖中哪些影子是<span className="text-red-500">錯的</span>，把它們點出來。
                </h1>
                <p className="mt-1 text-sm font-black text-slate-500">
                    還要找出 ${wrongTotal - found.length} 個
                </p>
            </div>

            <div className="relative rounded-2xl border-2 border-lime-300 bg-lime-100 overflow-hidden mb-5">
                <svg viewBox="0 0 320 170" className="w-full h-auto">
                    <rect x="0" y="0" width="320" height="60" fill="#fef9c3" />
                    <rect x="0" y="60" width="320" height="110" fill="#bbf7d0" />
                    <circle cx=${sunOnLeft ? 30 : 290} cy="26" r="18" fill="#f87171" />
                    ${Array.from({ length: 8 }).map((_, i) => {
                        const a = (i * Math.PI) / 4;
                        const cx = sunOnLeft ? 30 : 290;
                        return html`<line key=${i}
                            x1=${cx + Math.cos(a) * 21} y1=${26 + Math.sin(a) * 21}
                            x2=${cx + Math.cos(a) * 28} y2=${26 + Math.sin(a) * 28}
                            stroke="#f87171" strokeWidth="3" strokeLinecap="round" />`;
                    })}
                </svg>

                ${kids.map((kid, i) => {
                    const picked = found.includes(i);
                    const isBadPick = wrongPick === i;
                    return html`
                        <button
                            key=${i}
                            onClick=${() => handlePick(i)}
                            disabled=${done && !kid.isWrong}
                            className=${`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl p-1 transition-all
                                ${picked ? 'ring-4 ring-green-400 bg-green-100/70' : ''}
                                ${isBadPick ? 'ring-4 ring-red-400 bg-red-100/70' : ''}
                                ${!picked && !isBadPick ? 'hover:bg-white/50 active:scale-90' : ''}`}
                            style=${{ left: `${(kid.x / 320) * 100}%`, top: `${(kid.y / 170) * 100}%` }}
                        >
                            <svg viewBox="0 0 60 60" className="w-12 h-12 md:w-16 md:h-16">
                                <!-- 影子 -->
                                <ellipse cx=${kid.shadowRight ? 44 : 16} cy="50" rx="14" ry="6" fill="#334155" opacity="0.55" />
                                <!-- 小朋友 -->
                                <circle cx="30" cy="18" r="9" fill="#fcd9b6" stroke="#e2b48c" strokeWidth="1.5" />
                                <rect x="22" y="27" width="16" height="18" rx="5" fill=${kid.color} />
                                <rect x="25" y="44" width="4" height="8" rx="2" fill="#fcd9b6" />
                                <rect x="31" y="44" width="4" height="8" rx="2" fill="#fcd9b6" />
                            </svg>
                            ${picked && html`<span className="absolute -top-1 -right-1 text-lg">❌</span>`}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">這個影子是對的喔</div>
                    <p className="text-red-600 text-sm mt-1">
                        太陽在${sunOnLeft ? '左邊' : '右邊'}，影子應該倒向${sunOnLeft ? '右邊' : '左邊'}。
                    </p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">全部找到了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>太陽的位置：</span>
                            <span className="font-black text-amber-600">在${sunOnLeft ? '左' : '右'}邊</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>影子應該倒向：</span>
                            <span className="font-black text-blue-600">${sunOnLeft ? '右' : '左'}邊（和太陽相反）</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span className="font-bold">畫錯的影子：</span>
                            <span className="font-black text-green-700">${wrongTotal} 個，都倒向${sunOnLeft ? '左' : '右'}邊</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再找一次（換太陽）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q017',
    type: 'custom',
    title: '我們的影子：哪些影子畫錯了',
    q: '太陽在哪邊，影子就倒向另一邊，找出畫錯的影子。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ShadowGame} />`);
    }
};
