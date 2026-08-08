const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q036 - 促銷贈品最多可以送給幾個顧客？
 * ------------------------------------------------------------------
 * 店裡的贈品總數 = 每組瓶數 × 組數
 *   最多顧客數 = 贈品總數 ÷ 每人贈送瓶數
 * 陷阱：只看「組數」或忘了先算總瓶數。
 * ------------------------------------------------------------------
 */

const GIFTS = [
    { name: '發酵乳', unit: '瓶', icon: '🥛' },
    { name: '運動飲料', unit: '瓶', icon: '🧃' },
    { name: '茶包', unit: '包', icon: '🍵' },
    { name: '果凍', unit: '個', icon: '🍮' }
];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const perCustomer = [2, 4, 5][Math.floor(Math.random() * 3)];
        const perPack = [6, 8, 10, 12][Math.floor(Math.random() * 4)];
        const packs = 2 + Math.floor(Math.random() * 5);        // 2~6 組
        const totalBottles = perPack * packs;

        if (totalBottles % perCustomer !== 0) continue;
        const answer = totalBottles / perCustomer;
        if (answer < 3 || answer > 30) continue;

        const wrongSet = new Set();
        for (const w of [packs, totalBottles, perPack, answer + 2, answer - 2, perPack / perCustomer]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const spend = [300, 500, 800][Math.floor(Math.random() * 3)];
        const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
        return { perCustomer, perPack, packs, totalBottles, answer, options, spend, gift };
    }
    return {
        perCustomer: 5, perPack: 10, packs: 4, totalBottles: 40, answer: 8,
        options: [2, 4, 8, 10], spend: 500, gift: GIFTS[0]
    };
}

const PromotionProblem = () => {
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

    const { perCustomer, perPack, packs, totalBottles, answer, options, spend, gift } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘除應用題
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    便利商店促銷活動：消費滿 ${spend} 元贈送
                    <span className="text-blue-600">${perCustomer} ${gift.unit}${gift.name}</span>，送完為止。
                    店裡現在 <span className="text-amber-600">${perPack} ${gift.unit}裝</span>的${gift.name}有
                    <span className="text-amber-600">${packs} 組</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    最多有幾個顧客可以得到促銷活動贈送的${gift.name}？
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
                            (${idx + 1})  ${opt} 個顧客
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        先算出店裡一共有幾${gift.unit}，再看每個顧客會拿走幾${gift.unit}。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>${gift.icon} 店裡一共有：</span>
                            <span className="font-black text-amber-600">${perPack} × ${packs} = ${totalBottles} ${gift.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>每個顧客拿 ${perCustomer} ${gift.unit}：</span>
                            <span className="font-black text-blue-600">${totalBottles} ÷ ${perCustomer} = ${answer} 個顧客</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 個顧客 ✓</span>
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
    id: 'q036',
    type: 'custom',
    title: '促銷贈品最多送給幾個顧客？',
    q: '乘除應用題：先算總數再平分（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PromotionProblem} />`);
    }
};
