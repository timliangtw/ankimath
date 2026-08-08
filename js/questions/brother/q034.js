const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q034 - 員工旅遊最多會有多少人參加？
 * ------------------------------------------------------------------
 * 每位員工最多可以帶 K 位家人 → 每位員工最多帶來 (K+1) 個人
 *   最多人數 = 員工數 × (K + 1)
 * 陷阱：只算家人（N×K）或忘了員工自己也算一個人。
 * ------------------------------------------------------------------
 */

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const guests = 1 + Math.floor(Math.random() * 3);        // 每人最多帶 1~3 位家人
        const staff = 12 + Math.floor(Math.random() * 24);       // 員工 12~35 人
        const answer = staff * (guests + 1);

        const wrongSet = new Set();
        for (const w of [staff * guests, staff, staff + guests, staff * (guests + 2), answer + staff]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        return { guests, staff, answer, options };
    }
    return { guests: 1, staff: 24, answer: 48, options: [12, 24, 36, 48] };
}

const CompanyTripProblem = () => {
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

    const { guests, staff, answer, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    乘法應用題
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    活力公司舉辦員工旅遊，每位員工最多只能帶
                    <span className="text-blue-600">${guests} 位家人</span>參加。
                    參加這次旅遊的公司員工一共有
                    <span className="text-amber-600">${staff} 個人</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    這次旅遊<span className="underline">最多</span>會有多少個人參加？
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
                            (${idx + 1})  ${opt} 個人
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        員工自己也要算進去喔，一位員工最多會帶來幾個人？
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>一位員工最多帶來：</span>
                            <span className="font-black text-blue-600">自己 1 人 + 家人 ${guests} 人 = ${guests + 1} 人</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>${staff} 位員工：</span>
                            <span className="font-black text-amber-600">${staff} × ${guests + 1} = ${answer} 人</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 個人 ✓</span>
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
    id: 'q034',
    type: 'custom',
    title: '員工旅遊最多幾個人參加？',
    q: '乘法應用題：每人最多帶幾位家人（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${CompanyTripProblem} />`);
    }
};
