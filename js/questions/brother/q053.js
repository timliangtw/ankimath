const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q053 - 誰的體重最重？
 * ------------------------------------------------------------------
 * 兩句話有兩種情況：
 *   接得起來（A 比 B 重、B 比 C 重）→ 可以排出順序，A 最重
 *   接不起來（A 比 B 重、C 也比 B 重）→ A 和 C 誰重不知道 → 無法比較
 * 這題就是要判斷「資料夠不夠」。
 * ------------------------------------------------------------------
 */

const PEOPLE = [
    { name: '哥哥', icon: '👦' },
    { name: '妹妹', icon: '👧' },
    { name: '弟弟', icon: '🧒' },
    { name: '姐姐', icon: '👱‍♀️' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const trio = shuffle(PEOPLE).slice(0, 3);
    const [a, b, c] = trio;
    const chain = Math.random() < 0.5;

    let sentences, answerKey, reason;
    if (chain) {
        // A 比 B 重，B 比 C 重 → A 最重
        sentences = [
            `${a.name}比${b.name}重。`,
            `${b.name}比${c.name}重。`
        ];
        answerKey = a.name;
        reason = `${a.name} > ${b.name} > ${c.name}，三個人可以排成一排，所以${a.name}最重。`;
    } else {
        // A 比 B 重，C 也比 B 重 → A 和 C 比不出來
        sentences = [
            `${a.name}比${b.name}重。`,
            `${b.name}比${c.name}輕。`
        ];
        answerKey = 'unknown';
        reason = `${a.name} > ${b.name}、${c.name} > ${b.name}，只知道${b.name}最輕，`
            + `但是${a.name}和${c.name}誰比較重沒有說，所以沒辦法比較。`;
    }

    const choices = shuffle([
        ...trio.map(p => ({ key: p.name, text: p.name, icon: p.icon })),
        { key: 'unknown', text: '無法比較', icon: '❓' }
    ]);

    return { trio, sentences, answerKey, reason, choices, chain };
}

const HeaviestProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (key) => {
        if (gameState === 'correct') return;
        setSelected(key);
        if (key === problem.answerKey) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { sentences, answerKey, reason, choices } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    比較與推理
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    誰的體重<span className="text-amber-600">最重</span>？
                </h1>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 mb-6 space-y-2">
                ${sentences.map((s, i) => html`
                    <div key=${i} className="bg-white border-2 border-amber-200 rounded-xl px-4 py-2 text-lg font-bold text-slate-700">
                        ${i + 1}. ${s}
                    </div>
                `)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${choices.map((c, idx) => {
                    const isSelected = selected === c.key;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${c.key}
                            onClick=${() => handleSelect(c.key)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${c.icon} ${c.text}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        試試看把三個人排成一排，兩句話接得起來嗎？接不起來就沒辦法知道誰最重。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${sentences.map((s, i) => html`
                            <div key=${i} className="text-sm text-slate-600">${i + 1}. ${s}</div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-slate-700 font-bold">
                            ${reason}
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">
                                ${answerKey === 'unknown' ? '無法比較' : `${answerKey}最重`} ✓
                            </span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換說法）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q053',
    type: 'custom',
    title: '誰的體重最重？',
    q: '比較與推理：判斷資料夠不夠（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${HeaviestProblem} />`);
    }
};
