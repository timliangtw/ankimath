const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q015 - 【題組】菜園裡：還要再摘幾個？（3 小題）
 * ------------------------------------------------------------------
 * 共同題幹：每種蔬菜都要摘滿 T 個，已經摘了 a / b / c 個
 *   小題 1：還要摘幾根黃瓜？   → T − a
 *   小題 2：還要摘幾棵白菜？   → T − b
 *   小題 3：還要摘幾根胡蘿蔔？ → T − c
 * 三小題共用同一組隨機數字，全部答對才算完成。
 * ------------------------------------------------------------------
 */

const TOTAL_POOL = [10, 10, 10, 8, 12];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function buildOptions(correct, total) {
    const wrong = new Set();
    for (const w of [correct + 1, correct - 1, total - correct, correct + 2, correct - 2, total]) {
        if (w >= 0 && w <= total && w !== correct) wrong.add(w);
        if (wrong.size >= 3) break;
    }
    let extra = 0;
    while (wrong.size < 3) {
        if (extra !== correct && extra <= total) wrong.add(extra);
        extra++;
    }
    return shuffle([...wrong].slice(0, 3).concat(correct));
}

function generateProblem() {
    const total = TOTAL_POOL[Math.floor(Math.random() * TOTAL_POOL.length)];

    const picks = shuffle(Array.from({ length: total - 1 }, (_, i) => i + 1)).slice(0, 3);
    const veggies = [
        { key: 'cucumber', name: '黃瓜', unit: '根', icon: '🥒', picked: picks[0] },
        { key: 'cabbage', name: '白菜', unit: '棵', icon: '🥬', picked: picks[1] },
        { key: 'carrot', name: '胡蘿蔔', unit: '根', icon: '🥕', picked: picks[2] }
    ].map(v => ({ ...v, answer: total - v.picked }));

    return {
        total,
        veggies: veggies.map(v => ({ ...v, options: buildOptions(v.answer, total) }))
    };
}

const VeggieGardenGame = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);            // 目前進行到第幾小題
    const [picked, setPicked] = useState([null, null, null]);
    const [states, setStates] = useState(['playing', 'playing', 'playing']);

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(0);
        setPicked([null, null, null]);
        setStates(['playing', 'playing', 'playing']);
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (index, opt) => {
        if (states[index] === 'correct') return;
        const nextPicked = [...picked];
        nextPicked[index] = opt;
        setPicked(nextPicked);

        const nextStates = [...states];
        if (opt === problem.veggies[index].answer) {
            nextStates[index] = 'correct';
            setStep(s => Math.max(s, index + 1));
        } else {
            nextStates[index] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(nextStates);
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">走到菜園裡...</div>`;

    const { total, veggies } = problem;
    const allDone = states.every(s => s === 'correct');

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    菜園裡（共 3 小題）
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    妮妮每一種蔬菜都要摘滿
                    <span className="text-orange-600"> ${total} 個</span>。
                </h1>
            </div>

            <!-- 共同題幹：妮妮已經摘的 -->
            <div className="bg-lime-50 border-2 border-lime-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-2 mb-3">
                    <span className="text-4xl">👧</span>
                    <div className="bg-white border-2 border-lime-300 rounded-2xl px-3 py-2 text-base md:text-lg font-bold text-slate-700">
                        我已經摘了
                        ${veggies.map((v, i) => html`
                            <span key=${i}>
                                <span className="text-orange-600">${v.picked} ${v.unit}${v.name}</span>${i < veggies.length - 1 ? '、' : '。'}
                            </span>
                        `)}
                    </div>
                </div>
                <div className="space-y-2">
                    ${veggies.map((v, i) => html`
                        <div key=${i} className="flex items-center gap-2 bg-white rounded-xl border border-lime-200 p-2">
                            <span className="text-sm font-black text-slate-500 w-14">${v.name}</span>
                            <div className="flex flex-wrap gap-0.5">
                                ${Array.from({ length: v.picked }).map((_, k) => html`
                                    <span key=${k} className="text-xl">${v.icon}</span>
                                `)}
                            </div>
                        </div>
                    `)}
                </div>
            </div>

            <!-- 三個小題 -->
            ${veggies.map((v, index) => {
                if (index > step) return null;
                const state = states[index];
                return html`
                    <div key=${v.key} className=${`mb-6 ${index > 0 ? 'border-t-2 border-dashed border-slate-200 pt-5' : ''}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 ${index + 1} 小題</span>
                            ${state === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                        </div>
                        <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">
                            ${v.name} 要摘滿 ${total} ${v.unit}，已經摘了 ${v.picked} ${v.unit}，
                            還要再摘幾${v.unit}${v.name}？
                        </p>
                        <div className="grid grid-cols-4 gap-2">
                            ${v.options.map((opt, idx) => {
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
                                            ${isCorrect ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                            ${isWrong ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                            ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                            ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                                        `}
                                    >
                                        ${opt}
                                    </button>
                                `;
                            })}
                        </div>

                        ${state === 'wrong' && html`
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                                <div className="text-red-500 font-bold">再數一次</div>
                                <p className="text-red-600 text-sm">從 ${v.picked} 開始數，數到 ${total} 要數幾下呢？</p>
                            </div>
                        `}

                        ${state === 'correct' && html`
                            <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3">
                                <div className="text-green-600 font-bold mb-1">第 ${index + 1} 小題答對了！</div>
                                <div className="bg-white rounded-xl p-2 text-slate-700 border border-green-100 flex justify-between text-sm md:text-base">
                                    <span>${total} ${v.unit}要摘滿，已摘 ${v.picked} ${v.unit}：</span>
                                    <span className="font-black text-green-700">${total} − ${v.picked} = ${v.answer} ${v.unit}</span>
                                </div>
                            </div>
                        `}
                    </div>
                `;
            })}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">三小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${veggies.map((v, i) => html`
                            <div key=${i} className="flex justify-between items-center">
                                <span>${v.icon} ${v.name}：</span>
                                <span className="font-black text-green-700">
                                    ${total} − ${v.picked} = 還要 ${v.answer} ${v.unit}
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-center text-slate-600">
                            每一種都要湊滿 ${total} 個，用「總共要的」減掉「已經摘的」。
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再摘一次（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q015',
    type: 'custom',
    title: '【題組】菜園裡：還要再摘幾個',
    q: '題組（3 小題）：用要摘的總數減掉已經摘的，算出還要摘幾個。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${VeggieGardenGame} />`);
    }
};
