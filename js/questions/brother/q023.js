const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q023 - 倍數關係的組合種數
 * ------------------------------------------------------------------
 * 題型結構：
 *   大數 = 小數 × K + M，且兩個數都比 N 小
 *   問組合有幾種 → 小數可以是 1, 2, 3 ... 直到 K×小數+M 超過 N 為止
 *   答案 = floor((N - M - 1) / K)
 * ------------------------------------------------------------------
 */

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const K = 3 + Math.floor(Math.random() * 4);    // 3~6 倍
        const M = 1 + Math.floor(Math.random() * 4);    // 還多 1~4
        const N = 20 + Math.floor(Math.random() * 26);  // 都比 20~45 小
        const count = Math.floor((N - M - 1) / K);

        if (count < 3 || count > 8) continue;

        const pairs = [];
        for (let s = 1; s <= count; s++) {
            pairs.push({ small: s, big: K * s + M });
        }

        const wrongSet = new Set();
        for (const off of [-2, -1, 1, 2, 3]) {
            const w = count + off;
            if (w > 0 && w !== count) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, count].sort(() => Math.random() - 0.5);
        const sample = pairs[Math.floor(Math.random() * pairs.length)];

        return { K, M, N, count, pairs, options, sample };
    }

    // Fallback（理論上不會到這裡）
    const pairs = [1, 2, 3, 4, 5].map(s => ({ small: s, big: 5 * s + 2 }));
    return {
        K: 5, M: 2, N: 30, count: 5, pairs,
        options: [3, 4, 5, 6], sample: { small: 3, big: 17 }
    };
}

const NumberPairProblem = () => {
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
        if (opt === problem.count) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { K, M, N, count, pairs, options, sample } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    數的組合
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    有大、小兩個數，這兩個數都
                    <span className="text-amber-600">比 ${N} 小</span>，
                    大數是小數的
                    <span className="text-blue-600">${K} 倍還多 ${M}</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    這兩個數的組合有幾種？
                </p>
                <p className="mt-3 text-sm md:text-base text-slate-500 bg-slate-50 rounded-xl px-4 py-2 inline-block border border-slate-200">
                    註：例如小數是 ${sample.small}、大數是 ${sample.big}，這個組合是其中一種。
                </p>
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
                            (${idx + 1})  ${opt} 種
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        小數從 1 開始一個一個試，看看大數什麼時候會超過 ${N}。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="text-sm text-slate-500">
                            小數每加 1，大數就是「小數 × ${K} + ${M}」，只要大數還比 ${N} 小就算一種：
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            ${pairs.map((p, i) => html`
                                <div key=${i} className="bg-amber-50 rounded-lg px-3 py-1 text-sm font-bold text-slate-700 border border-amber-100">
                                    小 ${p.small} → 大 ${p.small} × ${K} + ${M} = ${p.big}
                                </div>
                            `)}
                        </div>
                        <div className="text-sm text-slate-500 pt-1">
                            小數再大一點就變成 ${count + 1} × ${K} + ${M} = ${(count + 1) * K + M}，
                            已經不比 ${N} 小了，所以停在這裡。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${count} 種 ✓</span>
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
    id: 'q023',
    type: 'custom',
    title: '兩個數的組合有幾種？',
    q: '倍數關係的組合種數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${NumberPairProblem} />`);
    }
};
