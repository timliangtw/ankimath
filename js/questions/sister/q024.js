const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q024 - 魔術師：水果變成幾倍
 * ------------------------------------------------------------------
 * 圖例：紅魔術師讓 1 個蘋果變成 R 個（變 R 倍）
 *       綠魔術師讓 1 個桃子變成 G 個（變 G 倍）
 * 兩位一起表演後：蘋果 × R、桃子 × G
 * 陷阱：以為是「多 R 個」而不是「變 R 倍」。
 * ------------------------------------------------------------------
 */

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const appleRate = 2 + Math.floor(Math.random() * 2);     // 蘋果變 2~3 倍
    const peachRate = 2 + Math.floor(Math.random() * 2);     // 桃子變 2~3 倍
    const apples = 1 + Math.floor(Math.random() * 3);        // 桌上 1~3 個蘋果
    const peaches = 1 + Math.floor(Math.random() * 3);       // 桌上 1~3 個桃子

    const answer = { apples: apples * appleRate, peaches: peaches * peachRate };

    const candidates = [
        { apples: apples + appleRate, peaches: peaches + peachRate },
        { apples: apples * peachRate, peaches: peaches * appleRate },
        { apples: answer.apples, peaches: peaches },
        { apples: apples, peaches: answer.peaches },
        { apples: answer.apples + 1, peaches: answer.peaches },
        { apples: answer.apples, peaches: answer.peaches + 1 }
    ];

    const unique = [answer];
    candidates.forEach(c => {
        if (!unique.some(u => u.apples === c.apples && u.peaches === c.peaches)) unique.push(c);
    });

    return {
        appleRate, peachRate, apples, peaches, answer,
        options: shuffle(unique.slice(0, 4))
    };
}

const Plate = ({ apples, peaches, highlight = false }) => html`
    <div className=${`rounded-2xl border-2 p-2 text-center ${highlight ? 'border-green-400 bg-green-50 ring-4 ring-green-100' : 'border-yellow-300 bg-yellow-100'}`}>
        <div className="mx-auto flex min-h-16 flex-wrap items-center justify-center gap-0.5 rounded-full border-4 border-blue-400 bg-yellow-200 px-3 py-2">
            ${Array.from({ length: apples }).map((_, i) => html`<span key=${`a${i}`} className="text-2xl">🍎</span>`)}
            ${Array.from({ length: peaches }).map((_, i) => html`<span key=${`p${i}`} className="text-2xl">🍑</span>`)}
        </div>
        <div className="mt-1 text-xs font-black text-slate-600">蘋果 ${apples} 個、桃子 ${peaches} 個</div>
    </div>
`;

const MagicMultiplyGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (opt) => {
        if (gameState === 'correct') return;
        const key = `${opt.apples}-${opt.peaches}`;
        setSelected(key);
        if (opt.apples === problem.answer.apples && opt.peaches === problem.answer.peaches) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備變魔術...</div>`;

    const { appleRate, peachRate, apples, peaches, answer, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    魔術師
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    兩位魔術師一起表演，變完後有幾個蘋果、幾個桃子？
                </h1>
            </div>

            <!-- 圖例 -->
            <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-3 mb-4">
                <div className="text-center text-sm font-black text-orange-700 mb-2">圖例</div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-2 text-center border border-orange-100">
                        <div className="text-2xl">🧙‍♂️</div>
                        <div className="text-xs font-black text-red-600 mb-1">紅魔術師</div>
                        <div className="text-lg">🍎 → ${Array.from({ length: appleRate }).map(() => '🍎').join('')}</div>
                    </div>
                    <div className="bg-white rounded-xl p-2 text-center border border-orange-100">
                        <div className="text-2xl">🧙</div>
                        <div className="text-xs font-black text-green-600 mb-1">綠魔術師</div>
                        <div className="text-lg">🍑 → ${Array.from({ length: peachRate }).map(() => '🍑').join('')}</div>
                    </div>
                </div>
            </div>

            <!-- 表演前 -->
            <div className="mb-4">
                <div className="text-center text-sm font-black text-slate-500 mb-1">表演前</div>
                <${Plate} apples=${apples} peaches=${peaches} />
            </div>

            <div className="text-center text-3xl mb-3">⬇️</div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${options.map(opt => {
                    const key = `${opt.apples}-${opt.peaches}`;
                    const isSelected = selected === key;
                    const isAnswer = opt.apples === answer.apples && opt.peaches === answer.peaches;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${key}
                            onClick=${() => handleSelect(opt)}
                            disabled=${isDisabled}
                            className=${`
                                rounded-2xl border-b-4 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-50 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <${Plate} apples=${opt.apples} peaches=${opt.peaches}
                                highlight=${gameState === 'correct' && isAnswer} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再數一次</div>
                    <p className="text-red-600 text-sm mt-1">
                        魔術師是讓水果變成好幾<span className="font-black">倍</span>，不是多幾個喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>🍎 蘋果變 ${appleRate} 倍：</span>
                            <span className="font-black text-red-600">${apples} × ${appleRate} = ${answer.apples} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>🍑 桃子變 ${peachRate} 倍：</span>
                            <span className="font-black text-green-600">${peaches} × ${peachRate} = ${answer.peaches} 個</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700">蘋果 ${answer.apples} 個、桃子 ${answer.peaches} 個 ✓</span>
                        </div>
                    </div>
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
    id: 'q024',
    type: 'custom',
    title: '魔術師：水果變成幾倍',
    q: '看圖例判斷水果變成幾倍，算出變完後的數量。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MagicMultiplyGame} />`);
    }
};
