const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q027 - 竹槍長度：兩根竹筷重疊接合
 * ------------------------------------------------------------------
 * 兩根長 L 公分的竹筷接在一起，重疊 O 公分
 *   → 總長 = L + L − O
 * 題目另外提到「3 根長 X 公分的竹筷做支架」，是不影響槍身長度的干擾條件。
 * ------------------------------------------------------------------
 */

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const L = 15 + Math.floor(Math.random() * 11);   // 每根 15~25 公分
        const O = 4 + Math.floor(Math.random() * 9);     // 重疊 4~12 公分
        const X = 8 + Math.floor(Math.random() * 6);     // 支架 8~13 公分（干擾）

        if (O >= L - 4) continue;                        // 重疊不能太長
        const answer = 2 * L - O;

        const wrongSet = new Set();
        for (const w of [2 * L, L + O, 2 * L + O, 2 * L - 2 * O, L + X, answer + 2 * X]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        return { L, O, X, answer, options };
    }

    return { L: 22, O: 9, X: 11, answer: 35, options: [26, 33, 35, 53] };
}

const BambooGunProblem = () => {
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
        if (opt === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { L, O, X, answer, options } = problem;

    // --- 依比例畫圖 ---
    const x0 = 20;
    const drawW = 300;
    const scale = drawW / answer;
    const bar1End = x0 + L * scale;
    const bar2Start = x0 + (L - O) * scale;
    const bar2End = x0 + answer * scale;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    長度與測量
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    爸爸帶著哥哥和小凱，用 <span className="text-slate-500">3 根長 ${X} 公分</span>
                    和 <span className="text-amber-600">2 根長 ${L} 公分</span>的竹筷和一些橡皮筋製作竹槍（如圖）。
                    兩根長竹筷接起來時
                    <span className="text-blue-600">重疊了 ${O} 公分</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    他們製作的竹槍長度是幾公分？
                </p>
            </div>

            <!-- 示意圖 -->
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-3 mb-6">
                <svg viewBox="0 0 340 170" className="w-full h-auto" role="img">
                    <!-- 重疊長度標示 -->
                    <line x1=${bar2Start} y1="38" x2=${bar1End} y2="38" stroke="#2563eb" strokeWidth="2" />
                    <line x1=${bar2Start} y1="32" x2=${bar2Start} y2="44" stroke="#2563eb" strokeWidth="2" />
                    <line x1=${bar1End} y1="32" x2=${bar1End} y2="44" stroke="#2563eb" strokeWidth="2" />
                    <text x=${(bar2Start + bar1End) / 2} y="26" textAnchor="middle"
                        fontSize="15" fontWeight="bold" fill="#2563eb">${O} 公分</text>

                    <!-- 支架（干擾用的短竹筷） -->
                    <rect x=${x0 + 40} y="50" width="9" height="80" rx="2" fill="#cbd5e1" stroke="#94a3b8"
                        transform=${`rotate(8 ${x0 + 44} 90)`} />
                    <rect x=${x0 + 85} y="50" width="9" height="80" rx="2" fill="#cbd5e1" stroke="#94a3b8"
                        transform=${`rotate(-8 ${x0 + 89} 90)`} />

                    <!-- 兩根長竹筷 -->
                    <rect x=${x0} y="56" width=${bar1End - x0} height="16" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
                    <rect x=${bar2Start} y="72" width=${bar2End - bar2Start} height="16" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2" />

                    <!-- 重疊區塊highlight -->
                    <rect x=${bar2Start} y="56" width=${bar1End - bar2Start} height="32" fill="#60a5fa" fillOpacity="0.35" />

                    <!-- 橡皮筋 -->
                    <line x1=${x0 + 46} y1="50" x2=${x0 + 46} y2="95" stroke="#64748b" strokeWidth="2" />
                    <line x1=${x0 + 92} y1="50" x2=${x0 + 92} y2="95" stroke="#64748b" strokeWidth="2" />

                    <!-- 總長標示 -->
                    <line x1=${x0} y1="140" x2=${bar2End} y2="140" stroke="#d97706" strokeWidth="2" />
                    <line x1=${x0} y1="134" x2=${x0} y2="146" stroke="#d97706" strokeWidth="2" />
                    <line x1=${bar2End} y1="134" x2=${bar2End} y2="146" stroke="#d97706" strokeWidth="2" />
                    <text x=${(x0 + bar2End) / 2} y="163" textAnchor="middle"
                        fontSize="17" fontWeight="bold" fill="#d97706">? 公分</text>
                </svg>
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
                            (${idx + 1})  ${opt} 公分
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        兩根接在一起的地方疊住了，疊住的長度不能算兩次喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>兩根竹筷合起來：</span>
                            <span className="font-black text-amber-600">${L} + ${L} = ${2 * L} 公分</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>扣掉重疊的部分：</span>
                            <span className="font-black text-blue-600">${2 * L} − ${O} = ${answer} 公分</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            那 3 根 ${X} 公分的竹筷是做把手和支架用的，不會讓槍身變長。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 公分 ✓</span>
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
    id: 'q027',
    type: 'custom',
    title: '竹槍有多長？兩根竹筷重疊接合',
    q: '長度應用題：重疊接合的總長（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${BambooGunProblem} />`);
    }
};
