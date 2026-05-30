const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function generateProblem() {
    const perPackPool = [6, 8, 10, 12];
    const groupsPool = [3, 4, 5, 6];
    const giftPool = [2, 4, 5, 6];
    const spendPool = [300, 400, 500, 600];

    for (let attempt = 0; attempt < 300; attempt++) {
        const perPack = perPackPool[Math.floor(Math.random() * perPackPool.length)];
        const groups = groupsPool[Math.floor(Math.random() * groupsPool.length)];
        const gift = giftPool[Math.floor(Math.random() * giftPool.length)];
        const total = perPack * groups;

        if (total % gift !== 0) continue;
        const answer = total / gift;
        if (answer < 4 || answer > 24) continue;

        const spend = spendPool[Math.floor(Math.random() * spendPool.length)];

        // 錯誤選項：用 groups、perPack 當誘答，再補一個鄰近值
        const wrongCandidates = [groups, perPack];
        const wrongSet = new Set();
        for (const w of wrongCandidates) {
            if (w !== answer && w > 0) wrongSet.add(w);
        }
        for (const off of [1, 2, -1, -2, 3, -3]) {
            if (wrongSet.size >= 3) break;
            const w = answer + off;
            if (w > 0 && w !== answer && !wrongSet.has(w)) wrongSet.add(w);
        }
        if (wrongSet.size < 3) continue;

        const options = [[...wrongSet].slice(0, 3).concat([answer])].flat()
            .sort(() => Math.random() - 0.5);
        return { perPack, groups, gift, total, answer, spend, options };
    }

    return { perPack: 10, groups: 4, gift: 5, total: 40, answer: 8, spend: 500, options: [4, 8, 10, 2] };
}

const YogurtProblem = () => {
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

    const { perPack, groups, gift, total, answer, spend, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    除法應用題
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    便利商店促銷活動：消費滿
                    <span className="text-amber-600"> ${spend} 元</span>
                    贈送
                    <span className="text-amber-600"> ${gift} 瓶</span>
                    發酵乳，送完為止。
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-700 leading-relaxed">
                    店裡現有
                    <span className="text-blue-600">${perPack} 瓶裝</span>
                    的發酵乳共
                    <span className="text-blue-600">${groups} 組</span>，
                    最多有幾個顧客可以得到贈送的發酵乳？
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
                            (${idx + 1}) ${opt} 個
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再算算看！</div>
                    <p className="text-red-600 text-sm">先算出總共幾瓶，再用總瓶數除以每人贈送的瓶數喔。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>發酵乳總瓶數：</span>
                            <span className="font-black text-blue-600">${perPack} × ${groups} = ${total} 瓶</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>每人贈 ${gift} 瓶：</span>
                            <span className="font-black text-amber-600">${total} ÷ ${gift} = ${answer} 個顧客</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">最多 ${answer} 個顧客 ✓</span>
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
    id: 'q021',
    type: 'custom',
    title: '促銷贈品：最多幾個顧客可得到？',
    q: '除法應用題：促銷活動贈品分配（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${YogurtProblem} />`);
    }
};
