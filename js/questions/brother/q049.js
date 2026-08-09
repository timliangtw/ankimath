const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q049 - 剩下的錢改買便宜的筆，可以買幾枝？
 * ------------------------------------------------------------------
 * 剩下的錢 = 原本那種筆的單價 × 可以買的枝數
 *   改買另一種筆 → 剩下的錢 ÷ 新單價
 * 題目裡「買早餐花了多少錢」是用不到的多餘條件。
 * ------------------------------------------------------------------
 */

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const price1 = [12, 15, 18, 20, 24][Math.floor(Math.random() * 5)];
        const count1 = 3 + Math.floor(Math.random() * 5);            // 原本可以買 3~7 枝
        const money = price1 * count1;

        const price2 = [3, 4, 5, 6, 8][Math.floor(Math.random() * 5)];
        if (price2 >= price1) continue;
        if (money % price2 !== 0) continue;
        const answer = money / price2;
        if (answer > 40) continue;

        const breakfast = 5 * (5 + Math.floor(Math.random() * 8));    // 干擾條件：早餐 25~60 元

        const wrongSet = new Set();
        for (const w of [count1, Math.round(money / price1) + price2, answer - count1, answer + count1, Math.round((money + breakfast) / price2)]) {
            if (Number.isInteger(w) && w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        return { price1, count1, money, price2, answer, breakfast, options };
    }
    return { price1: 18, count1: 6, money: 108, price2: 6, answer: 18, breakfast: 36, options: [6, 8, 18, 24] };
}

const PencilMoneyProblem = () => {
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

    const { price1, count1, money, price2, answer, breakfast, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘除應用題
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    秀婷帶了一些錢出門，買早餐花了 <span className="text-slate-500">${breakfast} 元</span>。
                    到文具店時，她想把剩下的錢全部拿去買一枝
                    <span className="text-amber-600">${price1} 元</span>的自動鉛筆，
                    剛好可以買 <span className="text-amber-600">${count1} 枝</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    如果改成買一枝 <span className="text-blue-600">${price2} 元</span>的鉛筆，可以買幾枝？
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
                        先算出「剩下的錢」是多少，再用它去除以新的價錢。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>剩下的錢：</span>
                            <span className="font-black text-amber-600">${price1} × ${count1} = ${money} 元</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>改買 ${price2} 元的鉛筆：</span>
                            <span className="font-black text-blue-600">${money} ÷ ${price2} = ${answer} 枝</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            買早餐的 ${breakfast} 元在這題用不到，它只是多餘的條件。
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
    id: 'q049',
    type: 'custom',
    title: '剩下的錢可以買幾枝鉛筆？',
    q: '乘除應用題：有多餘條件的題目（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PencilMoneyProblem} />`);
    }
};
