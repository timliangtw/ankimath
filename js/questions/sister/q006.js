const { useState } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const PATH = [
    { x: 0, y: 2 },
    { x: 1, y: 1 },
    { x: 2, y: 3 },
    { x: 3, y: 0 },
    { x: 4, y: 2 },
    { x: 5, y: 0 },
    { x: 7, y: 3 },
    { x: 8, y: 0 },
];

function pointKey(point) {
    return `${point.x}-${point.y}`;
}

function makeChoices(step) {
    const answer = PATH[step + 1];
    const candidates = [
        answer,
        { x: Math.max(0, answer.x - 1), y: answer.y },
        { x: answer.x, y: Math.max(0, answer.y - 1) },
        { x: answer.x, y: Math.min(3, answer.y + 1) },
    ];
    const unique = [];
    candidates.forEach(point => {
        if (!unique.some(item => pointKey(item) === pointKey(point))) unique.push(point);
    });
    let x = 0;
    while (unique.length < 4) {
        const point = { x: (answer.x + x + 2) % 9, y: (answer.y + x + 1) % 4 };
        if (!unique.some(item => pointKey(item) === pointKey(point))) unique.push(point);
        x++;
    }
    return shuffle(unique.slice(0, 4));
}

const GridPath = ({ step, preview = false }) => {
    const shown = PATH.slice(0, step + 1);
    const polyline = shown.map(point => `${point.x * 50 + 20},${point.y * 42 + 20}`).join(' ');

    return html`
        <svg viewBox="0 0 440 160" className="w-full rounded-2xl border-2 border-lime-200 bg-white">
            ${[0, 1, 2, 3].map(row => html`
                <line key=${`h-${row}`} x1="20" y1=${row * 42 + 20} x2="420" y2=${row * 42 + 20}
                    stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
            `)}
            ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(col => html`
                <line key=${`v-${col}`} x1=${col * 50 + 20} y1="20" x2=${col * 50 + 20} y2="146"
                    stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
            `)}
            ${shown.length > 1 && html`
                <polyline points=${polyline} fill="none" stroke="#d94682" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            `}
            ${shown.map((point, index) => html`
                <circle key=${`p-${index}`} cx=${point.x * 50 + 20} cy=${point.y * 42 + 20} r=${index === step ? 8 : 6}
                    fill=${index === step ? '#f59e0b' : '#d94682'} />
            `)}
            ${!preview && html`
                <text x="20" y="154" fontSize="13" fill="#64748b" fontWeight="700">從左邊開始，照折線走到下一個點</text>
            `}
        </svg>
    `;
};

const TracePathGame = () => {
    const [step, setStep] = useState(0);
    const [choices, setChoices] = useState(() => makeChoices(0));
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const restart = () => {
        setStep(0);
        setChoices(makeChoices(0));
        setSelected(null);
        setGameState('playing');
    };

    const handleSelect = (point) => {
        if (gameState === 'correct') return;
        const answer = PATH[step + 1];
        setSelected(pointKey(point));
        if (pointKey(point) !== pointKey(answer)) {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
            return;
        }
        const nextStep = step + 1;
        if (nextStep === PATH.length - 1) {
            setStep(nextStep);
            setGameState('correct');
        } else {
            setStep(nextStep);
            setChoices(makeChoices(nextStep));
            setSelected(null);
            setGameState('playing');
        }
    };

    const current = PATH[step];

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-lime-600 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    描一描
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    折線下一步要走到哪個格點？
                </h1>
            </div>

            <div className="bg-lime-50 border-2 border-lime-100 rounded-2xl p-4 mb-5">
                <${GridPath} step=${step} />
                <div className="mt-3 text-center text-slate-600 font-bold">
                    現在在第 ${current.x + 1} 直欄、第 ${current.y + 1} 條橫線附近
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${choices.map(point => {
                    const key = pointKey(point);
                    const isSelected = selected === key;
                    const answer = pointKey(PATH[step + 1]);
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    return html`
                        <button
                            key=${key}
                            onClick=${() => handleSelect(point)}
                            className=${`
                                rounded-2xl p-4 text-lg font-black border-b-4 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-100 border-green-500 text-green-700 scale-105' : ''}
                                ${isWrong ? 'bg-red-100 border-red-300 text-red-500 animate-pulse' : ''}
                                ${!isSelected ? 'bg-white border-slate-200 text-slate-700 hover:bg-lime-50 hover:border-lime-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            第 ${point.x + 1} 直欄，第 ${point.y + 1} 條線
                            ${gameState === 'correct' && key === answer ? html`<span className="block text-sm mt-1">完成</span>` : ''}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">沿著粉紅折線看</div>
                    <p className="text-red-600 text-sm mt-1">先看往右幾格，再看是往上還是往下。</p>
                    <button
                        onClick=${() => {
                            setSelected(null);
                            setGameState('playing');
                        }}
                        className="mt-3 px-5 py-2 bg-white border border-red-200 text-red-500 font-bold rounded-xl"
                    >
                        再選一次
                    </button>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">完成了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        你照著格線上的點，一段一段把折線走完了。
                    </p>
                    <button
                        onClick=${restart}
                        className="mt-4 px-6 py-2 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再描一次
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q006',
    type: 'custom',
    title: '描一描：照格線走折線',
    q: '觀察格線上的折線，依序選出下一個要連到的格點。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TracePathGame} />`);
    }
};
