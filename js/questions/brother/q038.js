const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q038 - 【題組】飲品訂購單（3 小題）
 * ------------------------------------------------------------------
 * 共同題幹：甲班、乙班用「正」字記號統計四種鮮奶的訂購數量
 *   小題 1：兩班「不加配料」一共幾杯？        → 甲 + 乙
 *   小題 2：一共會用掉幾盒布丁？              → （加布丁 + 兩種都加）兩班合計
 *   小題 3：一個袋子最多裝 N 杯，最少幾個袋子？→ 總杯數 ÷ N（有餘數要進位）
 * 三小題共用同一組隨機數字，全部答對才算完成。
 * ------------------------------------------------------------------
 */

const COLUMNS = [
    { key: 'plain', label: '不加配料' },
    { key: 'pudding', label: '加布丁' },
    { key: 'boba', label: '加粉圓' },
    { key: 'both', label: '兩種都加' }
];

// 「正」字的五個筆畫，依序畫出來就是 1~5
const TALLY_STROKES = [
    'M5,4 H19',
    'M10,4 V22',
    'M10,13 H18',
    'M18,13 V22',
    'M4,22 H20'
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function buildOptions(correct, extras) {
    const wrong = new Set();
    for (const w of extras) {
        if (Number.isInteger(w) && w > 0 && w !== correct) wrong.add(w);
        if (wrong.size >= 3) break;
    }
    let bump = 1;
    while (wrong.size < 3) {
        const w = correct + bump;
        if (w > 0 && w !== correct) wrong.add(w);
        bump++;
    }
    return shuffle([...wrong].slice(0, 3).concat(correct));
}

function generateProblem() {
    const classA = {};
    const classB = {};
    COLUMNS.forEach(col => {
        classA[col.key] = 1 + Math.floor(Math.random() * 9);   // 1~9 杯
        classB[col.key] = 1 + Math.floor(Math.random() * 9);
    });

    const perBag = 5 + Math.floor(Math.random() * 3);          // 一袋 5~7 杯

    const plainTotal = classA.plain + classB.plain;
    const puddingBoxes = classA.pudding + classB.pudding + classA.both + classB.both;
    const totalCups = COLUMNS.reduce((sum, c) => sum + classA[c.key] + classB[c.key], 0);
    const bags = Math.ceil(totalCups / perBag);

    return {
        classA, classB, perBag, plainTotal, puddingBoxes, totalCups, bags,
        options1: buildOptions(plainTotal, [classA.plain, classB.plain, plainTotal + 1, plainTotal - 1]),
        options2: buildOptions(puddingBoxes, [
            classA.pudding + classB.pudding,
            classA.both + classB.both,
            puddingBoxes + 2,
            puddingBoxes - 2
        ]),
        options3: buildOptions(bags, [bags - 1, bags + 1, Math.floor(totalCups / perBag), bags + 2])
    };
}

const Tally = ({ count }) => {
    const full = Math.floor(count / 5);
    const rest = count % 5;
    const groups = [...Array.from({ length: full }, () => 5), ...(rest ? [rest] : [])];
    return html`
        <div className="flex flex-wrap justify-center gap-1">
            ${groups.map((n, i) => html`
                <svg key=${i} viewBox="0 0 24 26" className="w-5 h-6">
                    ${TALLY_STROKES.slice(0, n).map((d, k) => html`
                        <path key=${k} d=${d} stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    `)}
                </svg>
            `)}
        </div>
    `;
};

const DrinkOrderProblem = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState([null, null, null]);
    const [states, setStates] = useState(['playing', 'playing', 'playing']);

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(0);
        setPicked([null, null, null]);
        setStates(['playing', 'playing', 'playing']);
    }, []);

    useEffect(() => { newProblem(); }, []);

    const answers = problem ? [problem.plainTotal, problem.puddingBoxes, problem.bags] : [];

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

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { classA, classB, perBag, plainTotal, puddingBoxes, totalCups, bags, options1, options2, options3 } = problem;
    const allDone = states.every(s => s === 'correct');

    const classTable = (title, data) => html`
        <div className="mb-3">
            <div className="text-sm font-black text-slate-500 mb-1">${title}</div>
            <div className="grid grid-cols-4 gap-1">
                ${COLUMNS.map(col => html`
                    <div key=${col.key} className="bg-white border-2 border-amber-200 rounded-xl p-2 text-center">
                        <div className="text-xs font-bold text-amber-700 mb-1">${col.label}</div>
                        <${Tally} count=${data[col.key]} />
                    </div>
                `)}
            </div>
        </div>
    `;

    const questionBlock = (index, title, text, options, hint, explain) => {
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
                                    py-3 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
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
                        <div className="bg-white rounded-xl p-2 text-slate-700 border border-green-100 text-sm md:text-base">
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
                    題組・統計表（共 3 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    老師請二年甲班和乙班的學生點鮮奶，可以不加配料、加布丁、加粉圓，
                    也可以兩種都加。下面是兩班點好的飲品單。
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-6">
                ${classTable('甲班', classA)}
                ${classTable('乙班', classB)}
                <p className="text-center text-xs text-slate-500 font-bold">一個「正」字代表 5 杯</p>
            </div>

            ${questionBlock(
                0, '第 1 小題',
                html`兩班<span className="text-amber-600">不加配料</span>的鮮奶一共有幾杯？`,
                options1,
                '把甲班和乙班「不加配料」那一格的數量加起來。',
                html`<div className="flex justify-between"><span>甲班 ${classA.plain} 杯 + 乙班 ${classB.plain} 杯：</span><span className="font-black text-green-700">${plainTotal} 杯</span></div>`
            )}

            ${questionBlock(
                1, '第 2 小題',
                html`每一杯有加布丁的飲品都要加 1 盒布丁，兩班一共會用掉幾盒布丁？`,
                options2,
                '「兩種都加」的飲品裡面也有布丁喔。',
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>加布丁：</span><span className="font-bold">${classA.pudding} + ${classB.pudding} = ${classA.pudding + classB.pudding} 杯</span></div>
                        <div className="flex justify-between"><span>兩種都加：</span><span className="font-bold">${classA.both} + ${classB.both} = ${classA.both + classB.both} 杯</span></div>
                        <div className="flex justify-between border-t border-green-100 pt-1"><span>一共要：</span><span className="font-black text-green-700">${puddingBoxes} 盒布丁</span></div>
                    </div>
                `
            )}

            ${questionBlock(
                2, '第 3 小題',
                html`飲品要裝在袋子裡，1 個袋子最多只能裝 <span className="text-blue-600">${perBag} 杯</span>，
                     兩班訂購的飲品<span className="underline">最少</span>共需要幾個袋子才能全部裝完？`,
                options3,
                '剩下裝不滿一袋的幾杯，也還是要多用一個袋子。',
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>兩班的飲品總數：</span><span className="font-bold">${totalCups} 杯</span></div>
                        <div className="flex justify-between">
                            <span>每袋 ${perBag} 杯：</span>
                            <span className="font-bold">${totalCups} ÷ ${perBag} = ${Math.floor(totalCups / perBag)} 袋${totalCups % perBag ? `，還剩 ${totalCups % perBag} 杯` : ''}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-100 pt-1">
                            <span>${totalCups % perBag ? '剩下的還要再一個袋子：' : '剛好裝滿：'}</span>
                            <span className="font-black text-green-700">${bags} 個袋子</span>
                        </div>
                    </div>
                `
            )}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 三小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between"><span>不加配料一共：</span><span className="font-black text-amber-600">${plainTotal} 杯</span></div>
                        <div className="flex justify-between"><span>要用掉的布丁：</span><span className="font-black text-blue-600">${puddingBoxes} 盒</span></div>
                        <div className="flex justify-between"><span>飲品總數：</span><span className="font-black text-slate-600">${totalCups} 杯</span></div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">最少要準備：</span>
                            <span className="font-black text-green-700 text-xl">${bags} 個袋子 ✓</span>
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
    id: 'q038',
    type: 'custom',
    title: '【題組】飲品訂購單：讀正字統計表',
    q: '題組（3 小題）：正字記號、合計與裝袋（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${DrinkOrderProblem} />`);
    }
};
