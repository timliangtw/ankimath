const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q017 - 蛋塔重新包裝：乘除應用題（隨機數字版）
 * ------------------------------------------------------------------
 * 題型結構：
 *   原本：每盒 A 個，共 B 盒 → 總數 = A × B
 *   改成：每盒 C 個 → 裝幾盒？= 總數 ÷ C = D（正確答案）
 * ------------------------------------------------------------------
 */

function generateProblem() {
    const cPool = [2, 3, 4, 5];
    const dPool = [3, 4, 5, 6, 8];

    for (let attempt = 0; attempt < 200; attempt++) {
        const C = cPool[Math.floor(Math.random() * cPool.length)];
        const D = dPool[Math.floor(Math.random() * dPool.length)];
        const total = C * D;

        // A：total 的因數，≠ C，介於 2~6
        const aCandidates = [];
        for (let i = 2; i <= 6; i++) {
            if (i !== C && total % i === 0) aCandidates.push(i);
        }
        if (aCandidates.length === 0) continue;

        const A = aCandidates[Math.floor(Math.random() * aCandidates.length)];
        const B = total / A;

        // B 要在合理範圍
        if (B < 4 || B > 15) continue;

        // 產生 3 個錯誤選項（D 附近，正整數，不重複，不等於 D）
        const wrongSet = new Set();
        for (const offset of [-3, -2, -1, 1, 2, 3]) {
            const w = D + offset;
            if (w > 0 && w !== D) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, D].sort(() => Math.random() - 0.5);
        return { A, B, C, D, total, options };
    }

    // Fallback（理論上不會到這裡）
    return { A: 2, B: 10, C: 5, D: 4, total: 20, options: [2, 3, 4, 5] };
}

const EggTartProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing'); // playing | correct | wrong

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (opt) => {
        if (gameState === 'correct') return;
        setSelected(opt);
        if (opt === problem.D) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { A, B, C, D, total, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 標題 -->
            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘除應用題
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    麵包店準備了一些蛋塔，
                    <span className="text-amber-600">${A} 個裝一盒</span>
                    可以裝成
                    <span className="text-amber-600">${B} 盒</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    如果改成
                    <span className="text-blue-600">${C} 個裝一盒</span>，
                    可以裝成幾盒？
                </p>
            </div>

            <!-- 視覺示意 -->
            <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl mb-1">${'🥮'.repeat(Math.min(A, 5))}${A > 5 ? '...' : ''}</div>
                    <div className="text-sm text-amber-700 font-bold">每盒 ${A} 個 × ${B} 盒</div>
                </div>
                <div className="text-2xl text-slate-400 font-bold">=</div>
                <div className="bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-black text-slate-700">${total} 個</div>
                    <div className="text-sm text-slate-500">蛋塔總數</div>
                </div>
                <div className="text-2xl text-slate-400 font-bold">÷</div>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 text-center">
                    <div className="text-2xl font-black text-blue-700">${C}</div>
                    <div className="text-sm text-blue-600">新的每盒數</div>
                </div>
                <div className="text-2xl text-slate-400 font-bold">=</div>
                <div className="bg-green-50 border-2 border-green-200 rounded-xl px-4 py-3 text-center min-w-[64px]">
                    <div className="text-2xl font-black text-green-700">？</div>
                    <div className="text-sm text-green-600">盒</div>
                </div>
            </div>

            <!-- 四個選項 -->
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
                            (${idx + 1})  ${opt} 盒
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        先算出總共有幾個蛋塔，再除以新的每盒數喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>蛋塔總數：</span>
                            <span className="font-black text-amber-600">${A} × ${B} = ${total} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>改成每盒 ${C} 個：</span>
                            <span className="font-black text-blue-600">${total} ÷ ${C} = ${D} 盒</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${D} 盒 ✓</span>
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
    id: 'q017',
    type: 'custom',
    title: '蛋塔重新包裝：改裝後幾盒？',
    q: '乘除應用題：重新分裝（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${EggTartProblem} />`);
    }
};
