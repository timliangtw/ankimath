const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q042 - 【題組】大寶的零用錢（2 小題）
 * ------------------------------------------------------------------
 * 共同題幹：帶了幾個 50 元、10 元、5 元出門，先買早餐再買文具
 *   小題 1：想買 C 元的蛋糕，還差多少元？   → C − 剩下的錢
 *   小題 2：媽媽再給 G 元，買完蛋糕剩多少？ → 剩下的錢 + G − C
 * 兩小題共用同一組隨機數字，全部答對才算完成。
 * ------------------------------------------------------------------
 */

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function buildOptions(correct, candidates) {
    const wrong = new Set();
    for (const w of candidates) {
        if (Number.isInteger(w) && w > 0 && w !== correct) wrong.add(w);
        if (wrong.size >= 3) break;
    }
    let bump = 1;
    while (wrong.size < 3) {
        const w = correct + bump * 3;
        if (w > 0 && w !== correct) wrong.add(w);
        bump++;
    }
    return shuffle([...wrong].slice(0, 3).concat(correct));
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const c50 = 1 + Math.floor(Math.random() * 2);        // 1~2 個 50 元
        const c10 = 2 + Math.floor(Math.random() * 4);        // 2~5 個 10 元
        const c5 = 2 + Math.floor(Math.random() * 3);         // 2~4 個 5 元
        const money = c50 * 50 + c10 * 10 + c5 * 5;

        const breakfast = 5 * (6 + Math.floor(Math.random() * 7));   // 早餐 30~60 元
        const stationery = 5 * (2 + Math.floor(Math.random() * 5));  // 文具 10~30 元
        const left = money - breakfast - stationery;
        if (left < 15) continue;

        const cake = left + 5 * (2 + Math.floor(Math.random() * 6)); // 蛋糕比剩下的錢貴 10~35 元
        const short = cake - left;

        const gift = 50 * (1 + Math.floor(Math.random() * 2));       // 媽媽再給 50 或 100
        const rest = left + gift - cake;
        if (rest < 5) continue;

        return {
            c50, c10, c5, money, breakfast, stationery, left, cake, short, gift, rest,
            options1: buildOptions(short, [left, cake, cake - money, short + 10, short - 5]),
            options2: buildOptions(rest, [gift - short, cake - gift, rest + 10, rest - 5, left])
        };
    }
    return {
        c50: 1, c10: 4, c5: 2, money: 100, breakfast: 50, stationery: 10, left: 40,
        cake: 67, short: 27, gift: 50, rest: 23,
        options1: [17, 27, 37, 40], options2: [13, 23, 33, 40]
    };
}

const Coins = ({ count, value, color }) => html`
    <span className="inline-flex flex-wrap gap-1 align-middle">
        ${Array.from({ length: count }).map((_, i) => html`
            <span key=${i} className=${`inline-flex items-center justify-center w-9 h-9 rounded-full border-2 text-xs font-black ${color}`}>
                ${value}
            </span>
        `)}
    </span>
`;

const PocketMoneyProblem = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState([null, null]);
    const [states, setStates] = useState(['playing', 'playing']);

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(0);
        setPicked([null, null]);
        setStates(['playing', 'playing']);
    }, []);

    useEffect(() => { newProblem(); }, []);

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { c50, c10, c5, money, breakfast, stationery, left, cake, short, gift, rest, options1, options2 } = problem;
    const answers = [short, rest];
    const allDone = states.every(s => s === 'correct');

    const handleSelect = (index, opt) => {
        if (states[index] === 'correct') return;
        const nextPicked = [...picked];
        nextPicked[index] = opt;
        setPicked(nextPicked);

        const nextStates = [...states];
        if (opt === answers[index]) {
            nextStates[index] = 'correct';
            setStep(s => Math.max(s, index + 1));
        } else {
            nextStates[index] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(nextStates);
    };

    const block = (index, text, options, hint, explain) => {
        if (index > step) return null;
        const state = states[index];
        return html`
            <div className=${`mb-6 ${index > 0 ? 'border-t-2 border-dashed border-slate-200 pt-5' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 ${index + 1} 小題</span>
                    ${state === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">${text}</p>
                <div className="grid grid-cols-4 gap-2">
                    ${options.map((opt, idx) => {
                        const isSelected = picked[index] === opt;
                        const isCorrect = state === 'correct' && isSelected;
                        const isWrong = state === 'wrong' && isSelected;
                        const isDisabled = state === 'correct' && !isSelected;
                        return html`
                            <button
                                key=${idx}
                                onClick=${() => handleSelect(index, opt)}
                                disabled=${isDisabled}
                                className=${`
                                    py-3 rounded-2xl text-xl font-black transition-all border-b-4 shadow-sm
                                    ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                    ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                                `}
                            >
                                ${opt}
                            </button>
                        `;
                    })}
                </div>
                ${state === 'wrong' && html`
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                        <div className="text-red-500 font-bold">❌ 再想想看！</div>
                        <p className="text-red-600 text-sm">${hint}</p>
                    </div>
                `}
                ${state === 'correct' && html`
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3">
                        <div className="text-green-600 font-bold mb-1">第 ${index + 1} 小題答對了！</div>
                        <div className="bg-white rounded-xl p-2 text-slate-700 border border-green-100 text-sm md:text-base space-y-1">
                            ${explain}
                        </div>
                    </div>
                `}
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    題組・錢的計算（共 2 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    大寶帶了下面這些錢出門，先在便利商店買早餐花了
                    <span className="text-blue-600">${breakfast} 元</span>，
                    再到文具店買色紙花了 <span className="text-blue-600">${stationery} 元</span>。
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 mb-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-500 w-16">50 元</span>
                        <${Coins} count=${c50} value="50" color="bg-yellow-200 border-yellow-500 text-yellow-800" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-500 w-16">10 元</span>
                        <${Coins} count=${c10} value="10" color="bg-slate-200 border-slate-500 text-slate-700" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-500 w-16">5 元</span>
                        <${Coins} count=${c5} value="5" color="bg-orange-100 border-orange-400 text-orange-700" />
                    </div>
                </div>
            </div>

            ${block(
                0,
                html`<span>大寶想買一個 <span className="text-amber-600">${cake} 元</span>的蛋糕，還差多少元？</span>`,
                options1,
                '先算出帶了多少錢，再扣掉早餐和色紙，看看還剩多少。',
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>帶出門的錢：</span><span className="font-bold">${c50}×50 + ${c10}×10 + ${c5}×5 = ${money} 元</span></div>
                        <div className="flex justify-between"><span>買完早餐和色紙：</span><span className="font-bold">${money} − ${breakfast} − ${stationery} = ${left} 元</span></div>
                        <div className="flex justify-between border-t border-green-100 pt-1"><span className="font-bold">還差：</span><span className="font-black text-green-700">${cake} − ${left} = ${short} 元</span></div>
                    </div>
                `
            )}

            ${block(
                1,
                html`<span>媽媽又給大寶 <span className="text-amber-600">${gift} 元</span>，讓他去買那個 ${cake} 元的蛋糕。買完以後還剩下多少元？</span>`,
                options2,
                '把剩下的錢加上媽媽給的，再扣掉蛋糕的錢。',
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>原本剩下：</span><span className="font-bold">${left} 元</span></div>
                        <div className="flex justify-between"><span>媽媽再給：</span><span className="font-bold">${left} + ${gift} = ${left + gift} 元</span></div>
                        <div className="flex justify-between border-t border-green-100 pt-1"><span className="font-bold">買完蛋糕剩：</span><span className="font-black text-green-700">${left + gift} − ${cake} = ${rest} 元</span></div>
                    </div>
                `
            )}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 兩小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between"><span>帶出門：</span><span className="font-black text-amber-600">${money} 元</span></div>
                        <div className="flex justify-between"><span>買完早餐和色紙剩：</span><span className="font-black text-blue-600">${left} 元</span></div>
                        <div className="flex justify-between"><span>買 ${cake} 元蛋糕還差：</span><span className="font-black text-blue-600">${short} 元</span></div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">媽媽給 ${gift} 元後，買完剩：</span>
                            <span className="font-black text-green-700 text-xl">${rest} 元 ✓</span>
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
    id: 'q042',
    type: 'custom',
    title: '【題組】大寶的零用錢：還差多少、剩多少',
    q: '題組（2 小題）：錢幣合計與加減（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PocketMoneyProblem} />`);
    }
};
