const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q010 - 送郵件：照著左邊的路線，在右邊依序點出郵差經過的房子
 * ------------------------------------------------------------------
 * 左圖畫出郵差今天走的路線（依序經過 4 棟房子並標上號碼），
 * 右圖只有房子，小朋友要照同樣的順序一棟一棟點。
 * 點錯就從頭再來（不會鎖住，可以一直重試）。
 * ------------------------------------------------------------------
 */

const SPOTS = [
    { x: 18, y: 18 }, { x: 50, y: 12 }, { x: 82, y: 20 },
    { x: 14, y: 48 }, { x: 48, y: 46 }, { x: 84, y: 50 },
    { x: 28, y: 76 }, { x: 64, y: 74 }
];
const HOUSE_ICONS = ['🏠', '🏡', '🏢', '🏫', '🏰', '⛪'];
const POSTMAN = { x: 6, y: 92 };
const ROUTE_LEN = 4;

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const spots = shuffle(SPOTS).slice(0, 6);
    const icons = shuffle(HOUSE_ICONS);
    const houses = spots.map((spot, i) => ({ ...spot, icon: icons[i] }));

    const route = shuffle(houses.map((_, i) => i)).slice(0, ROUTE_LEN);
    return { houses, route };
}

const MapBoard = ({ houses, route, showRoute, progress, onPick, gameState }) => {
    const points = showRoute
        ? [POSTMAN, ...route.map(i => houses[i])]
        : [POSTMAN, ...progress.map(i => houses[i])];
    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');

    return html`
        <div className="relative w-full rounded-2xl border-2 border-lime-300 bg-lime-100 overflow-hidden"
            style=${{ paddingBottom: '78%' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none">
                <path d="M -2,58 C 20,50 40,66 62,58 C 80,52 92,60 102,56 L 102,66 C 90,70 78,62 62,68 C 40,76 20,60 -2,68 Z"
                    fill="#93c5fd" opacity="0.8" />
                <polyline points=${polyline} fill="none"
                    stroke=${gameState === 'correct' ? '#16a34a' : '#dc2626'}
                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke" />
            </svg>

            <div className="absolute" style=${{ left: `${POSTMAN.x}%`, top: `${POSTMAN.y}%`, transform: 'translate(-50%, -50%)' }}>
                <span className="text-2xl md:text-3xl">📮</span>
            </div>

            ${houses.map((house, i) => {
                const order = showRoute ? route.indexOf(i) : progress.indexOf(i);
                const done = order >= 0;
                const inner = html`
                    <div className="relative">
                        <span className="text-3xl md:text-4xl">${house.icon}</span>
                        ${done && html`
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] md:text-xs font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                                ${order + 1}
                            </span>
                        `}
                    </div>
                `;
                const style = { left: `${house.x}%`, top: `${house.y}%`, transform: 'translate(-50%, -50%)' };

                if (!onPick) {
                    return html`<div key=${i} className="absolute" style=${style}>${inner}</div>`;
                }
                return html`
                    <button key=${i} className="absolute active:scale-90 transition-transform"
                        style=${style} onClick=${() => onPick(i)}
                        disabled=${gameState === 'correct'}>
                        ${inner}
                    </button>
                `;
            })}
        </div>
    `;
};

const MailRouteGame = () => {
    const [problem, setProblem] = useState(null);
    const [progress, setProgress] = useState([]);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setProgress([]);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (index) => {
        if (gameState === 'correct') return;
        const step = progress.length;
        if (problem.route[step] === index) {
            const next = [...progress, index];
            setProgress(next);
            setGameState(next.length === problem.route.length ? 'correct' : 'playing');
        } else {
            setProgress([]);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">畫地圖中...</div>`;

    const { houses, route } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    送郵件
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    照著上面的路線，
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-800">
                    在下面把郵差經過的房子<span className="text-orange-600">依照順序</span>點一次。
                </p>
            </div>

            <div className="mb-2 text-center text-sm font-black text-slate-500">郵差今天走的路線</div>
            <div className="mb-5">
                <${MapBoard} houses=${houses} route=${route} showRoute=${true} progress=${[]} onPick=${null} gameState=${gameState} />
            </div>

            <div className="mb-2 text-center text-sm font-black text-slate-500">
                換你走一次（已經點對 ${progress.length} / ${route.length} 棟）
            </div>
            <div className="mb-5">
                <${MapBoard} houses=${houses} route=${route} showRoute=${false} progress=${progress} onPick=${handlePick} gameState=${gameState} />
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">順序不對，從第 1 棟再來一次</div>
                    <p className="text-red-600 text-sm mt-1">先看上面的地圖，紅線是從郵筒往哪一棟走。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="text-sm text-slate-500">郵差今天走的順序：</div>
                        <div className="flex flex-wrap items-center justify-center gap-1 text-2xl">
                            <span>📮</span>
                            ${route.map((h, i) => html`
                                <span key=${i} className="flex items-center gap-1">
                                    <span className="text-slate-400 text-lg">→</span>
                                    <span>${houses[h].icon}</span>
                                    <span className="text-sm font-black text-red-500">${i + 1}</span>
                                </span>
                            `)}
                        </div>
                        <div className="border-t border-green-100 pt-2 text-center font-black text-green-700">
                            ${route.length} 棟房子的順序全部正確
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再送一次（換路線）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q010',
    type: 'custom',
    title: '送郵件：照著路線走一次',
    q: '對照上面的地圖，依照順序點出郵差經過的房子。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MailRouteGame} />`);
    }
};
