const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q032 - 哪一個選項的結果和其他不同？
 * ------------------------------------------------------------------
 * 三個選項都等於 A × B：「A×B」「B×A」「B 個 A 相加」
 * 另一個是異類，兩種模式：
 *   repeated-multiply → 「B 個 A 相乘」＝ A 的 B 次方
 *   plain-sum         → 「A + B」
 * ------------------------------------------------------------------
 */

function generateProblem() {
    const A = 3 + Math.floor(Math.random() * 6);   // 3~8
    let B = 3 + Math.floor(Math.random() * 6);     // 3~8
    if (B === A) B = A === 8 ? 3 : A + 1;          // 兩數不同，避免敘述重複

    const product = A * B;
    const mode = Math.random() < 0.5 ? 'repeated-multiply' : 'plain-sum';

    const oddOption = mode === 'repeated-multiply'
        ? { text: `${B} 個 ${A} 相乘`, value: `${A} 連乘 ${B} 次`, isOdd: true }
        : { text: `${A} + ${B}`, value: `${A + B}`, isOdd: true };

    const sameOptions = [
        { text: `${A} × ${B}`, value: `${product}`, isOdd: false },
        { text: `${B} × ${A}`, value: `${product}`, isOdd: false },
        { text: `${B} 個 ${A} 相加`, value: `${product}`, isOdd: false }
    ];

    const options = [...sameOptions, oddOption].sort(() => Math.random() - 0.5);
    return { A, B, product, mode, options };
}

const OddResultProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (problem.options[idx].isOdd) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { A, B, product, mode, options } = problem;
    const oddIdx = options.findIndex(o => o.isOdd);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘法的意義
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下列哪一個選項的結果和其他<span className="text-red-500 underline">不相同</span>？
                </h1>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(idx)}
                            disabled=${isDisabled}
                            className=${`
                                py-5 rounded-2xl text-xl md:text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.text}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        把每一個選項的答案都算出來，再比比看哪一個不一樣。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${options.map((opt, idx) => html`
                            <div key=${idx} className="flex justify-between items-center">
                                <span>${opt.text}：</span>
                                <span className=${`font-black ${opt.isOdd ? 'text-green-600' : 'text-slate-600'}`}>
                                    ${opt.isOdd
                                        ? (mode === 'repeated-multiply'
                                            ? `${Array.from({ length: B }).map(() => A).join(' × ')}（不是 ${product}）`
                                            : `${A + B}（不是 ${product}）`)
                                        : product}
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-sm text-slate-500">
                            ${mode === 'repeated-multiply'
                                ? `「${B} 個 ${A} 相加」是 ${A}＋${A}＋…＝${product}，「${B} 個 ${A} 相乘」卻是一直乘下去，會大很多。`
                                : `「${A} + ${B}」只是把兩個數加起來，和「${A} 的 ${B} 倍」不一樣。`}
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">(${oddIdx + 1}) ${options[oddIdx].text} ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q032',
    type: 'custom',
    title: '哪一個結果和其他不同？',
    q: '乘法的意義：相加與相乘的差別（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OddResultProblem} />`);
    }
};
