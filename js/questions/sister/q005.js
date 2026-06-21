const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const FEATURES = {
    cap: [
        { id: 'left', text: '帽檐在左邊' },
        { id: 'right', text: '帽檐在右邊' },
    ],
    bag: [
        { id: 'left', text: '書包在左邊' },
        { id: 'right', text: '書包在右邊' },
    ],
};

function opposite(side) {
    return side === 'left' ? 'right' : 'left';
}

function generateProblem() {
    const real = {
        cap: Math.random() < 0.5 ? 'left' : 'right',
        bag: Math.random() < 0.5 ? 'left' : 'right',
    };
    const mirror = {
        cap: opposite(real.cap),
        bag: opposite(real.bag),
    };
    const all = FEATURES.cap.flatMap(cap => FEATURES.bag.map(bag => ({
        cap: cap.id,
        bag: bag.id,
        key: `${cap.id}-${bag.id}`,
    })));
    return {
        real,
        mirror,
        options: shuffle(all),
        answerKey: `${real.cap}-${real.bag}`,
    };
}

const MirrorBoy = ({ boy, inMirror = false, small = false }) => {
    const capLeft = boy.cap === 'left';
    const bagLeft = boy.bag === 'left';
    const scale = small ? 'h-40 w-28' : 'h-52 w-36';
    const headSize = small ? 'h-14 w-14' : 'h-16 w-16';

    return html`
        <div className=${`relative mx-auto ${scale}`} aria-label=${inMirror ? '鏡子裡的樣子' : '選項男孩'}>
            <div className=${`absolute left-1/2 top-2 ${headSize} -translate-x-1/2 rounded-full border-2 border-amber-700 bg-amber-100`}>
                <div className="absolute left-1 top-6 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute right-1 top-6 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute left-1/2 top-9 h-2 w-7 -translate-x-1/2 rounded-b-full border-b-2 border-red-500"></div>
                <div className="absolute -top-2 left-1 h-6 w-8 rounded-t-full bg-blue-500"></div>
                <div className="absolute -top-2 right-1 h-6 w-8 rounded-t-full bg-white border-l border-blue-300"></div>
                <div
                    className="absolute top-3 h-3 w-9 rounded-full bg-blue-500"
                    style=${capLeft ? { left: '-20px' } : { right: '-20px' }}
                ></div>
            </div>
            <div className="absolute left-1/2 top-16 h-20 w-16 -translate-x-1/2 rounded-xl border-2 border-amber-700 bg-yellow-300"></div>
            <div className="absolute left-7 top-[132px] h-9 w-4 rounded-full bg-green-600"></div>
            <div className="absolute right-7 top-[132px] h-9 w-4 rounded-full bg-green-600"></div>
            <div className="absolute left-5 top-[170px] h-4 w-7 rounded bg-red-700"></div>
            <div className="absolute right-5 top-[170px] h-4 w-7 rounded bg-red-700"></div>
            <div
                className="absolute top-[92px] h-9 w-12 rounded-lg border-2 border-blue-700 bg-blue-400"
                style=${bagLeft ? { left: '6px' } : { right: '6px' }}
            ></div>
            <div
                className="absolute top-[70px] h-16 w-1 rounded-full bg-green-700"
                style=${bagLeft
                    ? { left: '70px', transform: 'rotate(28deg)' }
                    : { right: '70px', transform: 'rotate(-28deg)' }}
            ></div>
        </div>
    `;
};

const MirrorChoice = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (option) => {
        if (gameState === 'correct') return;
        setSelected(option.key);
        if (option.key === problem.answerKey) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備鏡子中...</div>`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-cyan-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    照鏡子
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    鏡子前的男孩是哪一個？
                </h1>
            </div>

            <div className="rounded-2xl border-4 border-cyan-200 bg-cyan-50 p-5 mb-5 text-center">
                <div className="mx-auto max-w-xs rounded-full border-8 border-cyan-400 bg-white/70 p-4 shadow-inner">
                    <${MirrorBoy} boy=${problem.mirror} inMirror=${true} />
                </div>
                <div className="mt-3 text-sm font-black text-cyan-700">這是鏡子裡看到的樣子</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${problem.options.map((option, index) => {
                    const isSelected = selected === option.key;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${option.key}
                            onClick=${() => handleSelect(option)}
                            disabled=${isDisabled}
                            className=${`
                                rounded-2xl p-3 border-b-4 transition-all shadow-sm bg-white
                                ${isCorrect ? 'border-green-500 bg-green-100 scale-105' : ''}
                                ${isWrong ? 'border-red-300 bg-red-100 animate-pulse' : ''}
                                ${isDisabled ? 'border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'border-slate-200 hover:bg-cyan-50 hover:border-cyan-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <div className="text-xs font-black text-slate-400 mb-1">選項 ${index + 1}</div>
                            <${MirrorBoy} boy=${option} small=${true} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再比一次左右</div>
                    <p className="text-red-600 text-sm mt-1">鏡子會把左邊和右邊交換，帽檐和書包都要反過來看。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        鏡子裡${FEATURES.cap.find(item => item.id === problem.mirror.cap).text}、
                        ${FEATURES.bag.find(item => item.id === problem.mirror.bag).text}，
                        鏡前就要左右相反：
                        <span className="text-green-700">
                            ${FEATURES.cap.find(item => item.id === problem.real.cap).text}、
                            ${FEATURES.bag.find(item => item.id === problem.real.bag).text}
                        </span>。
                    </p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換樣子）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q005',
    type: 'custom',
    title: '照鏡子：左右相反',
    q: '看鏡子裡的男孩，選出站在鏡子前真正的樣子。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MirrorChoice} />`);
    }
};
