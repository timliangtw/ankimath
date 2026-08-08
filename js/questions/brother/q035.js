const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q035 - 賞螢活動一共有幾個大人？
 * ------------------------------------------------------------------
 * 男生 + 女生 = 總人數，總人數 − 小孩 = 大人
 * 陷阱：題目用「男生／女生」分一次，又用「小孩／大人」分一次，
 *       兩種分法要先合起來再相減。
 * ------------------------------------------------------------------
 */

const EVENTS = [
    { name: '賞螢活動', icon: '🪰' },
    { name: '淨灘活動', icon: '🏖️' },
    { name: '觀星活動', icon: '🔭' },
    { name: '社區園遊會', icon: '🎪' }
];

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const boys = 18 + Math.floor(Math.random() * 23);   // 18~40
        const girls = 18 + Math.floor(Math.random() * 23);
        const total = boys + girls;
        const kids = 15 + Math.floor(Math.random() * 25);   // 15~39
        const answer = total - kids;

        if (answer < 8 || answer >= total) continue;

        const wrongSet = new Set();
        for (const w of [total, kids, total + kids, Math.abs(boys - girls), boys - kids + girls + 10]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        return { boys, girls, total, kids, answer, options, event };
    }
    return {
        boys: 25, girls: 31, total: 56, kids: 23, answer: 33,
        options: [23, 33, 56, 79], event: EVENTS[0]
    };
}

const AdultCountProblem = () => {
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

    const { boys, girls, total, kids, answer, options, event } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    加減應用題
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${event.icon} ${event.name}共有
                    <span className="text-blue-600">${boys} 個男生</span>和
                    <span className="text-blue-600">${girls} 個女生</span>參加，
                    其中有 <span className="text-amber-600">${kids} 個是小孩</span>，其他都是大人。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    一共有多少個大人參加${event.name}？
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
                            (${idx + 1})  ${opt} 個大人
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        男生和女生加起來是全部的人，扣掉小孩剩下的就是大人。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>參加的總人數：</span>
                            <span className="font-black text-blue-600">${boys} + ${girls} = ${total} 人</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>扣掉小孩：</span>
                            <span className="font-black text-amber-600">${total} − ${kids} = ${answer} 人</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            「男生／女生」和「小孩／大人」是兩種不同的分法，要先把全部的人算出來。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 個大人 ✓</span>
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
    id: 'q035',
    type: 'custom',
    title: '一共有幾個大人參加？',
    q: '加減應用題：兩種分法的人數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${AdultCountProblem} />`);
    }
};
