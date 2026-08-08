const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q031 - 繩子對摺：全長是幾枝鉛筆？
 * ------------------------------------------------------------------
 * 對摺 1 次 → 2 段，對摺 2 次 → 4 段，對摺 3 次 → 8 段
 *   全長 = 摺完後的長度 × 2^(對摺次數)
 * ------------------------------------------------------------------
 */

const FOLD_TEXT = {
    1: '對摺一次',
    2: '對摺再對摺（共 2 次）',
    3: '連續對摺 3 次'
};

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const folds = 1 + Math.floor(Math.random() * 3);   // 對摺 1~3 次
        const parts = Math.pow(2, folds);                   // 摺完後有幾段
        const foldedLen = 2 + Math.floor(Math.random() * 4); // 摺完後 = 2~5 枝
        const answer = foldedLen * parts;

        const wrongSet = new Set();
        for (const w of [
            foldedLen * folds * 2,
            foldedLen * Math.pow(2, folds - 1),
            foldedLen + parts,
            foldedLen * (parts + 2),
            answer + 2
        ]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        return { folds, parts, foldedLen, answer, options };
    }
    return { folds: 2, parts: 4, foldedLen: 2, answer: 8, options: [2, 4, 6, 8] };
}

const RopeFoldProblem = () => {
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
        setSelected(opt);
        if (opt === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { folds, parts, foldedLen, answer, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    長度與倍數
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    把一條繩子<span className="text-blue-600">${FOLD_TEXT[folds]}</span>以後，
                    長度和 <span className="text-amber-600">${foldedLen} 枝鉛筆</span>一樣長。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    這條繩子全長和幾枝鉛筆一樣長？
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === opt;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(opt)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1})  ${opt} 枝
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        每對摺一次，繩子就被分成兩倍多的段數，攤開來會變長喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="text-sm text-slate-500">攤開來看，繩子被摺成幾段：</div>
                        ${Array.from({ length: folds }).map((_, i) => html`
                            <div key=${i} className="flex justify-between items-center">
                                <span>第 ${i + 1} 次對摺後：</span>
                                <span className="font-black text-blue-600">${Math.pow(2, i + 1)} 段</span>
                            </div>
                        `)}
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span>每一段 ${foldedLen} 枝，共 ${parts} 段：</span>
                            <span className="font-black text-amber-600">${foldedLen} × ${parts} = ${answer}</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 枝 ✓</span>
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
    id: 'q031',
    type: 'custom',
    title: '繩子對摺後，全長是幾枝鉛筆？',
    q: '對摺與倍數：從摺後長度推回全長（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${RopeFoldProblem} />`);
    }
};
