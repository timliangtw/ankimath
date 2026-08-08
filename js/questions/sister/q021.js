const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q021 - 去遊樂場：他玩了哪些設施？
 * ------------------------------------------------------------------
 * 四個小朋友各說一句話：
 *   1 號：除了某一項以外，別的都玩了
 *   2 號：玩的和 1 號完全不一樣（1 號玩的他都沒玩，1 號沒玩的他玩了）
 *   3 號：只玩了兩項
 *   4 號：和 3 號玩的一樣，另外還多玩了一項
 * 小朋友要把指定那一位玩過的設施全部點出來。
 * ------------------------------------------------------------------
 */

const RIDES = [
    { name: '滑梯', icon: '🛝' },
    { name: '鞦韆', icon: '🎪' },
    { name: '蹺蹺板', icon: '⚖️' },
    { name: '摩天輪', icon: '🎡' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const idxAll = [0, 1, 2, 3];

    const skip = Math.floor(Math.random() * 4);                     // 1 號沒玩的那一項
    const kid1 = idxAll.filter(i => i !== skip);
    const kid2 = [skip];

    const pair = shuffle(idxAll).slice(0, 2).sort();                // 3 號玩的兩項
    const rest = idxAll.filter(i => !pair.includes(i));
    const extra = rest[Math.floor(Math.random() * rest.length)];    // 4 號多玩的那一項
    const kid3 = pair;
    const kid4 = [...pair, extra].sort();

    const kids = [
        { no: 1, plays: kid1, say: `我除了${RIDES[skip].name}以外，別的都玩了。` },
        { no: 2, plays: kid2, say: '我玩的和 1 號完全不一樣。' },
        { no: 3, plays: kid3, say: `我玩了${RIDES[pair[0]].name}和${RIDES[pair[1]].name}。` },
        { no: 4, plays: kid4, say: `我和 3 號玩的一樣，但是我還多玩了${RIDES[extra].name}。` }
    ];

    const askNo = 1 + Math.floor(Math.random() * 4);
    return { kids, askNo, ask: kids[askNo - 1], skip, extra };
}

const PlaygroundGame = () => {
    const [problem, setProblem] = useState(null);
    const [picked, setPicked] = useState([]);
    const [wrongPick, setWrongPick] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setPicked([]);
        setWrongPick(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (rideIdx) => {
        if (gameState === 'correct') return;
        const plays = problem.ask.plays;
        if (plays.includes(rideIdx)) {
            if (picked.includes(rideIdx)) return;
            const next = [...picked, rideIdx];
            setPicked(next);
            setWrongPick(null);
            setGameState(next.length === plays.length ? 'correct' : 'playing');
        } else {
            setWrongPick(rideIdx);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">出發去遊樂場...</div>`;

    const { kids, askNo, ask } = problem;
    const done = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    去遊樂場
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${askNo} 號小朋友玩了哪些設施？
                </h1>
                <p className="mt-1 text-sm font-black text-slate-500">
                    全部點出來（還有 ${ask.plays.length - picked.length} 個）
                </p>
            </div>

            <div className="space-y-2 mb-5">
                ${kids.map(kid => html`
                    <div key=${kid.no} className=${`flex items-center gap-2 rounded-2xl border-2 p-2
                        ${kid.no === askNo ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                        <span className=${`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black text-white
                            ${kid.no === askNo ? 'bg-amber-500' : 'bg-slate-400'}`}>${kid.no}</span>
                        <span className="text-sm md:text-base font-bold text-slate-700">${kid.say}</span>
                    </div>
                `)}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
                ${RIDES.map((ride, idx) => {
                    const isPicked = picked.includes(idx);
                    const isBad = wrongPick === idx;
                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handlePick(idx)}
                            disabled=${done && !isPicked}
                            className=${`
                                rounded-2xl border-b-4 py-3 transition-all shadow-sm
                                ${isPicked ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isBad ? 'bg-red-100 border-red-300 animate-pulse' : ''}
                                ${!isPicked && !isBad ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95' : ''}
                            `}
                        >
                            <div className="text-3xl">${ride.icon}</div>
                            <div className="text-xs font-black text-slate-600 mt-1">${ride.name}</div>
                            ${isPicked && html`<div className="text-green-600 font-black text-sm">✓</div>`}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">${askNo} 號沒有玩這個</div>
                    <p className="text-red-600 text-sm mt-1">再讀一次 ${askNo} 號說的話。</p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${kids.map(kid => html`
                            <div key=${kid.no} className=${`flex justify-between items-center ${kid.no === askNo ? 'font-black text-green-700' : 'text-slate-600'}`}>
                                <span>${kid.no} 號：</span>
                                <span>${kid.plays.map(i => RIDES[i].icon + RIDES[i].name).join('、')}</span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-sm text-slate-500">
                            2 號「完全不一樣」的意思是：1 號玩過的他都沒玩，1 號沒玩的他才玩。
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再玩一次（換說法）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q021',
    type: 'custom',
    title: '去遊樂場：他玩了哪些設施',
    q: '邏輯推理：從四句話推出某個人玩過的設施。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PlaygroundGame} />`);
    }
};
