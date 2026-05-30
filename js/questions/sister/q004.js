const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const TOYS = [
    { id: 'ball', name: '彩色球', icon: '🏐', color: 'bg-pink-100 border-pink-300 text-pink-700' },
    { id: 'bear', name: '小熊', icon: '🧸', color: 'bg-amber-100 border-amber-300 text-amber-700' },
    { id: 'frog', name: '青蛙', icon: '🐸', color: 'bg-green-100 border-green-300 text-green-700' },
    { id: 'doll', name: '娃娃', icon: '🪆', color: 'bg-purple-100 border-purple-300 text-purple-700' },
    { id: 'plane', name: '飛機', icon: '✈️', color: 'bg-sky-100 border-sky-300 text-sky-700' },
];

const CHILDREN = [
    { id: 'blueBoy', name: '藍衣男孩', icon: '👦', toy: 'ball' },
    { id: 'blueDressGirl', name: '藍洋裝女孩', icon: '👧', toy: 'bear' },
    { id: 'whiteBoy', name: '白衣男孩', icon: '🧒', toy: 'frog' },
    { id: 'redDressGirl', name: '紅洋裝女孩', icon: '👧🏻', toy: 'doll' },
    { id: 'yellowBoy', name: '黃衣男孩', icon: '👦🏼', toy: 'plane' },
];

function generateProblem() {
    const child = CHILDREN[Math.floor(Math.random() * CHILDREN.length)];
    return { child, options: shuffle(TOYS) };
}

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
        setGameState(toyId === problem.child.toy ? 'correct' : 'wrong');
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備玩具中...</div>`;

    const answerToy = TOYS.find(toy => toy.id === problem.child.toy);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-violet-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    玩玩具
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    先看大家拿什麼，再幫小朋友找回玩具
                </h1>
            </div>

            ${mode === 'look' && html`
                <div className="bg-violet-50 border-2 border-violet-100 rounded-2xl p-5 mb-5">
                    <div className="text-center font-black text-slate-700 mb-4">觀察時間</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        ${CHILDREN.map(child => {
                            const toy = TOYS.find(item => item.id === child.toy);
                            return html`
                                <div key=${child.id} className="bg-white rounded-xl border border-violet-100 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-3xl">${child.icon}</span>
                                        <span className="font-black text-slate-700">${child.name}</span>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl">${toy.icon}</div>
                                        <div className="text-xs font-bold text-slate-500">${toy.name}</div>
                                    </div>
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
                        <div className="text-5xl mb-2">${problem.child.icon}</div>
                        <div className="text-xl font-black text-slate-800">
                            ${problem.child.name} 剛剛拿的是什麼玩具？
                        </div>
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
                                    <div className="text-4xl mb-2">${toy.icon}</div>
                                    <div className="font-black">${toy.name}</div>
                                </button>
                            `;
                        })}
                    </div>
                </div>
            `}

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再想想看</div>
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
                        ${problem.child.name} 拿的是 ${answerToy.icon} ${answerToy.name}。
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
    q: '觀察上一頁玩具，再把玩具配到小朋友手中。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ToyMemoryGame} />`);
    }
};
