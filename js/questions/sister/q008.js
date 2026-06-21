const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const apples = Math.floor(Math.random() * 2) + 1;
    const peaches = Math.floor(Math.random() * 2) + 1;
    const redAdd = Math.floor(Math.random() * 2) + 1;
    const greenAdd = Math.floor(Math.random() * 2) + 1;
    const mode = Math.random() < 0.5 ? 'both' : (Math.random() < 0.5 ? 'red' : 'green');
    const answer = {
        apples: apples + (mode === 'red' || mode === 'both' ? redAdd : 0),
        peaches: peaches + (mode === 'green' || mode === 'both' ? greenAdd : 0),
    };
    const wrongs = [
        { apples: apples + redAdd, peaches },
        { apples, peaches: peaches + greenAdd },
        { apples: apples + greenAdd, peaches: peaches + redAdd },
        { apples: answer.apples + 1, peaches: answer.peaches },
        { apples: answer.apples, peaches: answer.peaches + 1 },
    ].filter(item => item.apples !== answer.apples || item.peaches !== answer.peaches);
    const unique = [];
    [answer, ...wrongs].forEach(item => {
        if (!unique.some(old => old.apples === item.apples && old.peaches === item.peaches)) unique.push(item);
    });
    return {
        apples,
        peaches,
        redAdd,
        greenAdd,
        mode,
        answer,
        options: shuffle(unique.slice(0, 4)),
    };
}

const Wizard = ({ color }) => html`
    <div className="relative h-28 w-20">
        <div
            className="absolute left-1/2 top-0 h-16 w-12 -translate-x-1/2"
            style=${{
                clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
                background: color === 'red' ? '#dc2626' : '#16a34a',
            }}
        ></div>
        <div className="absolute left-1/2 top-11 h-10 w-10 -translate-x-1/2 rounded-full border-2 border-amber-700 bg-amber-100">
            <div className="absolute left-2 top-4 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
            <div className="absolute right-2 top-4 h-1.5 w-1.5 rounded-full bg-slate-800"></div>
            <div className="absolute left-1/2 top-6 h-2 w-5 -translate-x-1/2 rounded-b-full border-b-2 border-red-500"></div>
        </div>
        <div
            className="absolute left-1/2 top-[72px] h-12 w-12 -translate-x-1/2 rounded-b-2xl border-2 border-slate-700"
            style=${{ background: color === 'red' ? '#ef4444' : '#22c55e' }}
        ></div>
    </div>
`;

const Plate = ({ apples, peaches, highlight = false }) => html`
    <div className=${`rounded-2xl border-2 bg-yellow-100 p-3 text-center shadow-sm ${highlight ? 'border-green-400 ring-4 ring-green-100' : 'border-yellow-300'}`}>
        <div className="mx-auto mb-2 flex min-h-20 max-w-xs flex-wrap items-center justify-center gap-1 rounded-full border-4 border-blue-400 bg-yellow-200 px-4 py-3">
            ${Array.from({ length: apples }).map((_, index) => html`
                <span key=${`a-${index}`} className="text-3xl">🍎</span>
            `)}
            ${Array.from({ length: peaches }).map((_, index) => html`
                <span key=${`p-${index}`} className="text-3xl">🍑</span>
            `)}
        </div>
        <div className="text-sm font-black text-slate-600">蘋果 ${apples} 個，桃子 ${peaches} 個</div>
    </div>
`;

const MagicFruitGame = () => {
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
        const key = `${option.apples}-${option.peaches}`;
        setSelected(key);
        if (option.apples === problem.answer.apples && option.peaches === problem.answer.peaches) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備水果中...</div>`;

    const modeText = {
        red: '紅魔術師表演',
        green: '綠魔術師表演',
        both: '兩位魔術師一起表演',
    }[problem.mode];

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    魔術師
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    變完後有幾個蘋果、幾個桃子？
                </h1>
            </div>

            <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 mb-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="rounded-2xl bg-white p-3 text-center border border-orange-100">
                        <div className="flex justify-center"><${Wizard} color="red" /></div>
                        <div className="font-black text-red-600">紅魔術師：蘋果 +${problem.redAdd}</div>
                    </div>
                    <div className="rounded-2xl bg-white p-3 text-center border border-orange-100">
                        <div className="flex justify-center"><${Wizard} color="green" /></div>
                        <div className="font-black text-green-600">綠魔術師：桃子 +${problem.greenAdd}</div>
                    </div>
                </div>
                <div className="text-center text-lg font-black text-orange-700 mb-3">${modeText}</div>
                <${Plate} apples=${problem.apples} peaches=${problem.peaches} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                ${problem.options.map(option => {
                    const key = `${option.apples}-${option.peaches}`;
                    const isSelected = selected === key;
                    const isAnswer = option.apples === problem.answer.apples && option.peaches === problem.answer.peaches;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${key}
                            onClick=${() => handleSelect(option)}
                            disabled=${isDisabled}
                            className=${`
                                rounded-2xl border-b-4 transition-all shadow-sm text-left
                                ${isCorrect ? 'bg-green-50 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <${Plate} apples=${option.apples} peaches=${option.peaches} highlight=${gameState === 'correct' && isAnswer} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再數一次</div>
                    <p className="text-red-600 text-sm mt-1">紅魔術師只讓蘋果變多，綠魔術師只讓桃子變多。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        原本有蘋果 ${problem.apples} 個、桃子 ${problem.peaches} 個。
                        ${problem.mode !== 'green' ? html`紅魔術師讓蘋果多 ${problem.redAdd} 個，` : ''}
                        ${problem.mode !== 'red' ? html`綠魔術師讓桃子多 ${problem.greenAdd} 個，` : ''}
                        所以最後是
                        <span className="text-green-700">蘋果 ${problem.answer.apples} 個、桃子 ${problem.answer.peaches} 個</span>。
                    </p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再變一次
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q008',
    type: 'custom',
    title: '魔術師：水果變多了',
    q: '依照紅魔術師和綠魔術師的規則，判斷變完後的蘋果和桃子數量。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MagicFruitGame} />`);
    }
};
