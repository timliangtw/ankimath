const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const TOYS = [
    { id: 'ball', name: '彩球', icon: '🏐', color: 'bg-pink-100 border-pink-300 text-pink-700' },
    { id: 'bear', name: '小熊', icon: '🧸', color: 'bg-amber-100 border-amber-300 text-amber-700' },
    { id: 'frog', name: '青蛙', icon: '🐸', color: 'bg-green-100 border-green-300 text-green-700' },
    { id: 'doll', name: '娃娃', icon: '🪆', color: 'bg-purple-100 border-purple-300 text-purple-700' },
    { id: 'plane', name: '飛機', icon: '✈️', color: 'bg-sky-100 border-sky-300 text-sky-700' },
];

const CHILDREN = [
    { id: 'blueBoy', name: '藍衣男孩', shirt: 'blue', hair: 'red', pants: 'red' },
    { id: 'blueDressGirl', name: '藍裙女孩', shirt: 'blueDress', hair: 'brown', pants: 'red' },
    { id: 'whiteBoy', name: '白衣男孩', shirt: 'striped', hair: 'brown', pants: 'blue' },
    { id: 'redDressGirl', name: '紅裙女孩', shirt: 'redDress', hair: 'purple', pants: 'green' },
    { id: 'yellowBoy', name: '黃衣男孩', shirt: 'yellow', hair: 'brownCurly', pants: 'green' },
];

function generateProblem() {
    const toys = shuffle(TOYS);
    const pairs = CHILDREN.map((child, index) => ({
        ...child,
        toy: toys[index].id,
    }));
    const child = pairs[Math.floor(Math.random() * pairs.length)];
    return {
        pairs,
        child,
        answerToyId: child.toy,
        options: shuffle(TOYS),
    };
}

const KidAvatar = ({ child, toyId = null, question = false, small = false }) => {
    const hairColor = {
        red: '#d45135',
        brown: '#6b3f2a',
        purple: '#6c4ca8',
        brownCurly: '#6b3f2a',
    }[child.hair];
    const shirt = {
        blue: '#285b9f',
        blueDress: '#2f8fc7',
        striped: 'repeating-linear-gradient(0deg, #fff 0 8px, #f28b36 8px 12px)',
        redDress: '#d84a50',
        yellow: '#f5d92f',
    }[child.shirt];
    const pants = {
        red: '#bf513d',
        blue: '#3182ce',
        green: '#2f8a67',
    }[child.pants];
    const toy = toyId ? TOYS.find(item => item.id === toyId) : null;
    const scale = small ? 'scale-90' : 'scale-100';
    const frame = small ? 'h-28 w-24' : 'h-36 w-28';

    return html`
        <div className=${`relative mx-auto ${frame} ${scale}`} aria-label=${child.name}>
            <div
                className="absolute left-1/2 top-1 h-12 w-14 -translate-x-1/2 rounded-full border-2 border-amber-700"
                style=${{ background: '#ffd7ad' }}
            >
                ${child.hair === 'brownCurly' ? html`
                    <div className="absolute -top-2 left-0 flex w-14 justify-center gap-0.5">
                        ${[0, 1, 2, 3, 4].map(index => html`
                            <span key=${index} className="h-3 w-3 rounded-full" style=${{ background: hairColor }}></span>
                        `)}
                    </div>
                ` : html`
                    <div className="absolute -left-1 -top-1 h-5 w-16 rounded-t-full" style=${{ background: hairColor }}></div>
                `}
                ${child.hair === 'purple' && html`
                    <div className="absolute -left-4 top-2 h-7 w-7 rounded-full" style=${{ background: hairColor }}></div>
                `}
                <div className="absolute left-3 top-6 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute right-3 top-6 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute left-1/2 top-9 h-2 w-6 -translate-x-1/2 rounded-b-full border-b-2 border-red-500"></div>
            </div>
            <div
                className=${`absolute left-1/2 top-14 -translate-x-1/2 border-2 border-slate-600 ${child.shirt.includes('Dress') ? 'h-14 w-12 rounded-b-3xl' : 'h-12 w-12 rounded-xl'}`}
                style=${{ background: shirt }}
            ></div>
            <div className="absolute left-4 top-[70px] h-8 w-2 -rotate-12 rounded-full bg-amber-700"></div>
            <div className="absolute right-4 top-[70px] h-8 w-2 rotate-12 rounded-full bg-amber-700"></div>
            <div className="absolute left-10 top-[102px] h-7 w-2 rounded-full" style=${{ background: pants }}></div>
            <div className="absolute right-10 top-[102px] h-7 w-2 rounded-full" style=${{ background: pants }}></div>
            <div className="absolute right-0 top-[72px] flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-white bg-white text-4xl shadow-md">
                ${question ? html`<span className="text-5xl font-black text-violet-300">?</span>` : toy.icon}
            </div>
        </div>
    `;
};

const ToyMemoryGame = () => {
    const [problem, setProblem] = useState(null);
    const [mode, setMode] = useState('look');
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setMode('look');
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (toyId) => {
        if (gameState === 'correct') return;
        setSelected(toyId);
        setGameState(toyId === problem.answerToyId ? 'correct' : 'wrong');
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備玩具中...</div>`;

    const answerToy = TOYS.find(toy => toy.id === problem.answerToyId);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-violet-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    玩玩具
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    先看圖，再找玩具
                </h1>
            </div>

            ${mode === 'look' && html`
                <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-4 mb-5">
                    <div className="text-center font-black text-slate-700 mb-3">記一記</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        ${problem.pairs.map(child => {
                            const toy = TOYS.find(item => item.id === child.toy);
                            return html`
                                <div key=${child.id} className="bg-white rounded-2xl border border-violet-100 p-2 text-center shadow-sm">
                                    <${KidAvatar} child=${child} toyId=${toy.id} small=${true} />
                                </div>
                            `;
                        })}
                    </div>
                    <button
                        onClick=${() => setMode('answer')}
                        className="mt-5 w-full py-3 bg-violet-500 hover:bg-violet-600 text-white font-black rounded-xl shadow-sm"
                    >
                        我看好了，開始配對
                    </button>
                </div>
            `}

            ${mode === 'answer' && html`
                <div>
                    <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-5 mb-5 text-center">
                        <${KidAvatar} child=${problem.child} question=${true} />
                        <div className="text-xl font-black text-slate-800">找玩具</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                        ${problem.options.map(toy => {
                            const isSelected = selected === toy.id;
                            const isCorrect = gameState === 'correct' && isSelected;
                            const isWrong = gameState === 'wrong' && isSelected;
                            const isDisabled = gameState === 'correct' && !isSelected;

                            return html`
                                <button
                                    key=${toy.id}
                                    onClick=${() => handleSelect(toy.id)}
                                    disabled=${isDisabled}
                                    className=${`
                                        rounded-2xl p-4 border-b-4 transition-all shadow-sm text-center
                                        ${isCorrect ? 'bg-green-100 border-green-500 scale-105' : ''}
                                        ${isWrong ? 'bg-red-100 border-red-300 animate-pulse' : ''}
                                        ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                        ${!isSelected && !isDisabled ? `${toy.color} hover:brightness-105 active:scale-95 cursor-pointer` : ''}
                                    `}
                                >
                                    <div className="text-5xl mb-1">${toy.icon}</div>
                                    <div className="text-sm font-black">${toy.name}</div>
                                </button>
                            `;
                        })}
                    </div>
                </div>
            `}

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看一次</div>
                    <button
                        onClick=${() => {
                            setMode('look');
                            setSelected(null);
                            setGameState('playing');
                        }}
                        className="mt-3 px-5 py-2 bg-white border border-red-200 text-red-500 font-bold rounded-xl"
                    >
                        回去看一次
                    </button>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold">
                        ${answerToy.icon} ${answerToy.name}
                    </p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再記一個
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q004',
    type: 'custom',
    title: '玩玩具：記得誰拿什麼',
    q: '看圖記住小朋友手上的玩具，再選出正確玩具。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ToyMemoryGame} />`);
    }
};
