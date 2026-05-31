const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const TOYS = [
    { id: 'volleyball', name: '皮球', icon: '🏐', color: 'bg-green-100 border-green-300 text-green-700' },
    { id: 'soccer', name: '足球', icon: '⚽', color: 'bg-slate-100 border-slate-300 text-slate-700' },
    { id: 'basketball', name: '籃球', icon: '🏀', color: 'bg-orange-100 border-orange-300 text-orange-700' },
];

const CHILDREN = [
    { id: 'striped', name: '條紋男孩', answer: 'soccer', shirt: 'striped', hair: 'brown', pants: 'green', clue: '想玩足球。' },
    { id: 'yellow', name: '黃衣女孩', answer: 'basketball', shirt: 'yellow', hair: 'red', pants: 'green', clue: '和紅裙女孩一起玩。' },
    { id: 'redDress', name: '紅裙女孩', answer: 'basketball', shirt: 'redDress', hair: 'brown', pants: 'green', clue: '不是皮球，也不是足球。' },
    { id: 'green', name: '綠衣女孩', answer: 'volleyball', shirt: 'green', hair: 'red', pants: 'orange', clue: '自己一個人玩。' },
    { id: 'blue', name: '藍衣男孩', answer: 'soccer', shirt: 'blue', hair: 'blond', pants: 'orange', clue: '和條紋男孩一起玩。' },
];

function generateProblem() {
    const child = CHILDREN[Math.floor(Math.random() * CHILDREN.length)];
    return { child, options: shuffle(TOYS) };
}

const KidAvatar = ({ child, small = false }) => {
    const scale = small ? 'scale-90' : 'scale-100';
    const hairColor = child.hair === 'blond' ? '#f8c05a' : child.hair === 'red' ? '#d45135' : '#6b3f2a';
    const shirt = {
        striped: 'repeating-linear-gradient(0deg, #fff 0 7px, #d95f4f 7px 11px)',
        yellow: '#f4c84a',
        redDress: '#d84a50',
        green: '#269366',
        blue: '#315fa8',
    }[child.shirt];
    const pants = child.pants === 'green' ? '#2f8a67' : '#e57936';

    return html`
        <div className=${`relative mx-auto h-32 w-20 ${scale}`} aria-label=${child.name}>
            <div
                className="absolute left-1/2 top-1 h-11 w-12 -translate-x-1/2 rounded-full border-2 border-amber-700"
                style=${{ background: '#ffd7ad' }}
            >
                <div
                    className="absolute -left-1 -top-1 h-5 w-14 rounded-t-full"
                    style=${{ background: hairColor }}
                ></div>
                <div className="absolute left-3 top-5 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute right-3 top-5 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
                <div className="absolute left-1/2 top-8 h-2 w-5 -translate-x-1/2 rounded-b-full border-b-2 border-red-500"></div>
                ${child.hair === 'red' && html`
                    <div>
                        <div className="absolute -left-3 top-3 h-4 w-4 rounded-full" style=${{ background: hairColor }}></div>
                        <div className="absolute -right-3 top-3 h-4 w-4 rounded-full" style=${{ background: hairColor }}></div>
                    </div>
                `}
            </div>
            <div
                className=${`absolute left-1/2 top-12 -translate-x-1/2 border-2 border-slate-600 ${child.shirt === 'redDress' ? 'h-11 w-10 rounded-b-2xl' : 'h-10 w-11 rounded-xl'}`}
                style=${{ background: shirt }}
            ></div>
            <div className="absolute left-2 top-14 h-7 w-2 -rotate-12 rounded-full bg-amber-700"></div>
            <div className="absolute right-2 top-14 h-7 w-2 rotate-12 rounded-full bg-amber-700"></div>
            <div className="absolute left-7 top-[86px] h-8 w-2 rounded-full" style=${{ background: pants }}></div>
            <div className="absolute right-7 top-[86px] h-8 w-2 rounded-full" style=${{ background: pants }}></div>
        </div>
    `;
};

const BallBadge = ({ toyId, muted = false, crossed = false }) => {
    const toy = TOYS.find(item => item.id === toyId);
    return html`
        <div className=${`
            relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-white text-4xl shadow-sm
            ${muted ? 'opacity-45 grayscale' : toy.color}
        `}>
            ${toy.icon}
            ${crossed && html`
                <div className="absolute inset-0 flex items-center justify-center text-5xl font-black text-red-500">×</div>
            `}
        </div>
    `;
};

const SameBallHint = ({ first, second }) => html`
    <div className="flex items-center justify-center gap-2">
        <${KidAvatar} child=${first} small=${true} />
        <div className="flex flex-col items-center">
            <div className="text-3xl font-black text-sky-500">↔</div>
            <div className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-black text-sky-700">一起</div>
        </div>
        <${KidAvatar} child=${second} small=${true} />
    </div>
`;

const VisualClues = ({ activeId }) => {
    const byId = Object.fromEntries(CHILDREN.map(child => [child.id, child]));
    const cardClass = (id) => `
        rounded-2xl border-2 bg-white p-3 shadow-sm
        ${activeId === id ? 'border-emerald-400 ring-4 ring-emerald-100' : 'border-emerald-100'}
    `;

    return html`
        <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-4 mb-5">
            <div className="mb-3 flex items-center justify-center gap-3">
                <${BallBadge} toyId="volleyball" />
                <div className="text-xl font-black text-slate-400">1</div>
                <${BallBadge} toyId="soccer" />
                <div className="text-xl font-black text-slate-400">1</div>
                <${BallBadge} toyId="basketball" />
                <div className="text-xl font-black text-slate-400">1</div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className=${cardClass('striped')}>
                    <div className="flex items-center justify-center gap-3">
                        <${KidAvatar} child=${byId.striped} small=${true} />
                        <div className="text-3xl font-black text-emerald-500">→</div>
                        <${BallBadge} toyId="soccer" />
                    </div>
                </div>
                <div className=${cardClass('blue')}>
                    <${SameBallHint} first=${byId.blue} second=${byId.striped} />
                </div>
                <div className=${cardClass('redDress')}>
                    <div className="flex items-center justify-center gap-2">
                        <${KidAvatar} child=${byId.redDress} small=${true} />
                        <div className="text-2xl font-black text-slate-400">≠</div>
                        <${BallBadge} toyId="volleyball" crossed=${true} />
                        <${BallBadge} toyId="soccer" crossed=${true} />
                    </div>
                </div>
                <div className=${cardClass('yellow')}>
                    <${SameBallHint} first=${byId.yellow} second=${byId.redDress} />
                </div>
                <div className=${cardClass('green')}>
                    <div className="flex items-center justify-center gap-3">
                        <${KidAvatar} child=${byId.green} small=${true} />
                        <div className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700">1 人</div>
                        <div className="text-3xl font-black text-slate-300">?</div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

const PlaygroundChoice = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (toyId) => {
        if (gameState === 'correct') return;
        setSelected(toyId);
        setGameState(toyId === problem.child.answer ? 'correct' : 'wrong');
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備操場中...</div>`;

    const answerToy = TOYS.find(toy => toy.id === problem.child.answer);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-emerald-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    操場上
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    這位小朋友玩什麼？
                </h1>
                <div className="mt-3 rounded-2xl border-2 border-emerald-200 bg-white p-3 shadow-sm">
                    <${KidAvatar} child=${problem.child} />
                    <div className="mt-1 text-lg font-black text-slate-700">${problem.child.name}</div>
                </div>
            </div>

            <${VisualClues} activeId=${problem.child.id} />

            <div className="grid grid-cols-3 gap-3 mb-5">
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
                            <div className="text-sm font-black">${toy.name}</div>
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看圖</div>
                    <p className="text-red-600 text-sm mt-1">看箭頭、叉叉，還有誰跟誰一起玩。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        ${problem.child.name}：${problem.child.clue}
                        所以選 ${answerToy.icon} ${answerToy.name}。
                    </p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再問一個小朋友
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q003',
    type: 'custom',
    title: '操場上：小朋友想玩什麼？',
    q: '看圖像提示，判斷每個小朋友想玩的球類。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PlaygroundChoice} />`);
    }
};
