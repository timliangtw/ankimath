const { useState } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const CHALLENGES = [
    {
        id: 'lines',
        badge: '線條變多',
        title: '下一格要畫幾條直線？',
        sequence: [1, 1, 2, 2],
        answer: 3,
        explain: '橫線一直在上面，直線是 1、1、2、2，所以下一格接 3 條直線。',
    },
    {
        id: 'circle',
        badge: '缺口轉圈',
        title: '下一個缺口會在哪裡？',
        sequence: ['右上', '右下', '左下'],
        answer: '左上',
        explain: '缺口每次往下一個角落轉：右上、右下、左下，下一個是左上。',
    },
    {
        id: 'stars',
        badge: '數量規律',
        title: '下一格要放幾顆星星？',
        sequence: [1, 4, 2, 4, 3],
        answer: 4,
        explain: '星星數量是 1、4、2、4、3，單數位置慢慢增加，中間都接 4 顆。',
    },
];

function lineChoices(answer) {
    return shuffle([1, 2, 3, 4]).map(value => ({ key: String(value), value }));
}

function circleChoices(answer) {
    return shuffle(['右上', '右下', '左下', '左上']).map(value => ({ key: value, value }));
}

function starChoices(answer) {
    return shuffle([2, 3, 4, 5]).map(value => ({ key: String(value), value }));
}

function choicesFor(challenge) {
    if (challenge.id === 'lines') return lineChoices(challenge.answer);
    if (challenge.id === 'circle') return circleChoices(challenge.answer);
    return starChoices(challenge.answer);
}

function getInitialLevel() {
    try {
        const key = 'sister-q007-start-level';
        const value = Number(window.sessionStorage.getItem(key) || '0');
        window.sessionStorage.setItem(key, String(value + 1));
        return value % CHALLENGES.length;
    } catch (error) {
        return Math.floor(Math.random() * CHALLENGES.length);
    }
}

const LineSymbol = ({ count }) => html`
    <div className="mx-auto flex h-20 w-24 flex-col items-center justify-start pt-3">
        <div className="h-1.5 w-20 rounded bg-rose-500"></div>
        <div className="mt-1 flex h-14 items-start justify-center gap-3">
            ${Array.from({ length: count }).map((_, index) => html`
                <div key=${index} className="h-12 w-1.5 rounded bg-rose-500"></div>
            `)}
        </div>
    </div>
`;

const CircleSymbol = ({ missing }) => {
    const clip = {
        '右上': 'polygon(0 0, 50% 0, 50% 50%, 100% 50%, 100% 100%, 0 100%)',
        '右下': 'polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%)',
        '左下': 'polygon(0 0, 100% 0, 100% 100%, 50% 100%, 50% 50%, 0 50%)',
        '左上': 'polygon(50% 0, 100% 0, 100% 100%, 0 100%, 0 50%, 50% 50%)',
    }[missing];
    return html`
        <div className="mx-auto h-20 w-20 rounded-full bg-red-500" style=${{ clipPath: clip }}></div>
    `;
};

const Stars = ({ count }) => html`
    <div className="mx-auto flex h-24 w-16 flex-col items-center justify-center gap-1 rounded-xl bg-white">
        ${Array.from({ length: count }).map((_, index) => html`
            <div key=${index} className="text-2xl leading-none text-yellow-400">★</div>
        `)}
    </div>
`;

const PatternPreview = ({ challenge, value }) => {
    if (challenge.id === 'lines') return html`<${LineSymbol} count=${value} />`;
    if (challenge.id === 'circle') return html`<${CircleSymbol} missing=${value} />`;
    return html`<${Stars} count=${value} />`;
};

const PatternGame = () => {
    const [level, setLevel] = useState(getInitialLevel);
    const [choices, setChoices] = useState(() => choicesFor(CHALLENGES[level]));
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const challenge = CHALLENGES[level];

    const nextLevel = () => {
        const next = level + 1;
        if (next >= CHALLENGES.length) {
            setLevel(0);
            setChoices(choicesFor(CHALLENGES[0]));
        } else {
            setLevel(next);
            setChoices(choicesFor(CHALLENGES[next]));
        }
        setSelected(null);
        setGameState('playing');
    };

    const handleSelect = (choice) => {
        if (gameState === 'correct') return;
        setSelected(choice.key);
        if (choice.value === challenge.answer) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-fuchsia-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    畫圖形
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${challenge.title}
                </h1>
                <p className="text-slate-500 font-bold mt-2">第 ${level + 1} 關 / ${CHALLENGES.length}：${challenge.badge}</p>
            </div>

            <div className="bg-fuchsia-50 border-2 border-fuchsia-100 rounded-2xl p-4 mb-5">
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 items-center">
                    ${challenge.sequence.map((value, index) => html`
                        <div key=${`seq-${index}`} className="rounded-2xl border border-fuchsia-100 bg-white p-2 text-center shadow-sm">
                            <div className="text-xs font-black text-slate-400 mb-1">${index + 1}</div>
                            <${PatternPreview} challenge=${challenge} value=${value} />
                        </div>
                    `)}
                    <div className="rounded-2xl border-2 border-dashed border-fuchsia-300 bg-white p-2 text-center shadow-sm">
                        <div className="text-xs font-black text-fuchsia-400 mb-1">下一格</div>
                        <div className="flex h-20 items-center justify-center text-5xl font-black text-fuchsia-300">?</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${choices.map(choice => {
                    const isSelected = selected === choice.key;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${choice.key}
                            onClick=${() => handleSelect(choice)}
                            disabled=${isDisabled}
                            className=${`
                                rounded-2xl p-3 border-b-4 transition-all shadow-sm bg-white
                                ${isCorrect ? 'border-green-500 bg-green-100 scale-105' : ''}
                                ${isWrong ? 'border-red-300 bg-red-100 animate-pulse' : ''}
                                ${isDisabled ? 'border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'border-slate-200 hover:bg-fuchsia-50 hover:border-fuchsia-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <${PatternPreview} challenge=${challenge} value=${choice.value} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再找規律</div>
                    <p className="text-red-600 text-sm mt-1">先從左到右看，每一格改變了什麼。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        ${challenge.explain}
                    </p>
                    <button
                        onClick=${nextLevel}
                        className="mt-4 px-6 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        ${level + 1 >= CHALLENGES.length ? '再玩一次' : '下一關'}
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q007',
    type: 'custom',
    title: '畫圖形：找出變化規律',
    q: '觀察每組圖形的變化規律，選出下一格應該出現的圖形。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PatternGame} />`);
    }
};
