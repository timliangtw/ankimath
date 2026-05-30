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
    { id: 'striped', name: '條紋衣男孩', icon: '👦', answer: 'soccer', clue: '想玩足球。' },
    { id: 'yellow', name: '黃衣女孩', icon: '👧', answer: 'basketball', clue: '要和紅洋裝女孩一起玩。' },
    { id: 'redDress', name: '紅洋裝女孩', icon: '👧🏻', answer: 'basketball', clue: '玩的不是皮球和足球。' },
    { id: 'green', name: '綠衣女孩', icon: '🧒', answer: 'volleyball', clue: '想自己一個人玩球。' },
    { id: 'blue', name: '藍衣男孩', icon: '👦🏼', answer: 'soccer', clue: '要和條紋衣男孩一起玩。' },
];

function generateProblem() {
    const child = CHILDREN[Math.floor(Math.random() * CHILDREN.length)];
    return { child, options: shuffle(TOYS) };
}

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
                    ${problem.child.icon} ${problem.child.name} 想玩什麼？
                </h1>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-5 mb-5">
                <div className="text-center font-black text-slate-700 mb-3">提示卡</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    ${CHILDREN.map(child => html`
                        <div key=${child.id} className=${`
                            bg-white rounded-xl border p-3 flex items-center gap-3
                            ${child.id === problem.child.id ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-emerald-100'}
                        `}>
                            <span className="text-3xl">${child.icon}</span>
                            <div>
                                <div className="font-black text-slate-700">${child.name}</div>
                                <div className="text-sm text-slate-500">${child.clue}</div>
                            </div>
                        </div>
                    `)}
                </div>
            </div>

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
                            <div className="font-black">${toy.name}</div>
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再讀一次提示</div>
                    <p className="text-red-600 text-sm mt-1">有些小朋友想一起玩，所以會選同一種球。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        ${problem.child.name} 的提示是「${problem.child.clue}」，
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
    q: '根據提示判斷每個小朋友想玩的球類。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PlaygroundChoice} />`);
    }
};
