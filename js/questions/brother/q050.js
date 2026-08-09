const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q050 - 怎麼給，四個人的糖果才會一樣多？
 * ------------------------------------------------------------------
 * 先算出平均：糖果總數 ÷ 4 = 每個人應該有幾顆
 * 比平均多的人要送出多的部分，比平均少的人要收到不足的部分。
 * 四個選項只有一種給法可以讓每個人都剛好等於平均。
 * ------------------------------------------------------------------
 */

const KIDS = ['大寶', '二寶', '三寶', '小寶'];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function applyPlan(counts, plan) {
    const next = [...counts];
    plan.forEach(m => { next[m.from] -= m.n; next[m.to] += m.n; });
    return next;
}

function allEqual(list) {
    return list.every(v => v === list[0]);
}

function planKey(plan) {
    return plan.map(m => `${m.from}>${m.to}:${m.n}`).sort().join('|');
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const avg = 5 + Math.floor(Math.random() * 5);            // 平均 5~9 顆
        const p = 1 + Math.floor(Math.random() * 3);              // 第一組差 1~3
        const q = 1 + Math.floor(Math.random() * 3);              // 第二組差 1~3

        const order = shuffle([0, 1, 2, 3]);
        const [rich1, rich2, poor1, poor2] = order;

        const counts = [avg, avg, avg, avg];
        counts[rich1] += p;
        counts[poor1] -= p;
        counts[rich2] += q;
        counts[poor2] -= q;
        if (counts.some(c => c < 1)) continue;

        const answerPlan = [
            { from: rich1, to: poor1, n: p },
            { from: rich2, to: poor2, n: q }
        ];
        if (!allEqual(applyPlan(counts, answerPlan))) continue;

        // 干擾方案：隨機做兩筆轉移，但結果不會平均
        const decoys = [];
        const seen = new Set([planKey(answerPlan)]);
        for (let t = 0; t < 200 && decoys.length < 3; t++) {
            const a = Math.floor(Math.random() * 4);
            let b = Math.floor(Math.random() * 4);
            if (b === a) b = (b + 1) % 4;
            const c = Math.floor(Math.random() * 4);
            let d = Math.floor(Math.random() * 4);
            if (d === c) d = (d + 1) % 4;
            const plan = [
                { from: a, to: b, n: 1 + Math.floor(Math.random() * 3) },
                { from: c, to: d, n: 1 + Math.floor(Math.random() * 3) }
            ];
            const key = planKey(plan);
            if (seen.has(key)) continue;
            const after = applyPlan(counts, plan);
            if (allEqual(after)) continue;
            if (after.some(v => v < 0)) continue;
            seen.add(key);
            decoys.push(plan);
        }
        if (decoys.length < 3) continue;

        const options = shuffle([
            { plan: answerPlan, isRight: true },
            ...decoys.map(plan => ({ plan, isRight: false }))
        ]);

        return { avg, counts, options, total: counts.reduce((a, b) => a + b, 0) };
    }
    return null;
}

const CandyPlate = ({ name, count, highlight }) => html`
    <div className=${`rounded-2xl border-2 p-2 text-center ${highlight ? 'border-green-400 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
        <div className="text-sm font-black text-slate-600 mb-1">${name}</div>
        <div className="flex flex-wrap justify-center gap-0.5 min-h-12 items-center">
            ${Array.from({ length: count }).map((_, i) => html`
                <span key=${i} className="text-lg">🍬</span>
            `)}
        </div>
        <div className="text-xs font-black text-slate-500 mt-1">${count} 顆</div>
    </div>
`;

const CandyShareProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        let p = null;
        for (let i = 0; i < 5 && !p; i++) p = generateProblem();
        setProblem(p);
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (problem.options[idx].isRight) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { avg, counts, options, total } = problem;
    const solved = gameState === 'correct';
    const planText = (plan) => plan.map(m => `${KIDS[m.from]}給${KIDS[m.to]} ${m.n} 顆`).join('、');

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    平均分配
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面哪一種方式可以讓 4 個人的糖果<span className="text-amber-600">一樣多</span>？
                </h1>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
                ${KIDS.map((name, i) => html`
                    <${CandyPlate} key=${name} name=${name} count=${counts[i]} highlight=${false} />
                `)}
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(idx)}
                            disabled=${isDisabled}
                            className=${`
                                px-4 py-3 rounded-2xl text-base md:text-lg font-bold text-left transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${planText(opt.plan)}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        先算出平均每個人應該有幾顆，再看誰要送出、誰要收到。
                    </p>
                </div>
            `}

            ${solved && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>糖果總數：</span>
                            <span className="font-black text-amber-600">${counts.join(' + ')} = ${total} 顆</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>平均每個人：</span>
                            <span className="font-black text-blue-600">${total} ÷ 4 = ${avg} 顆</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 space-y-1">
                            ${KIDS.map((name, i) => html`
                                <div key=${name} className="flex justify-between items-center text-sm">
                                    <span>${name}：${counts[i]} 顆</span>
                                    <span className=${`font-bold ${counts[i] > avg ? 'text-red-500' : counts[i] < avg ? 'text-blue-500' : 'text-slate-400'}`}>
                                        ${counts[i] > avg ? `要送出 ${counts[i] - avg} 顆` : counts[i] < avg ? `要收到 ${avg - counts[i]} 顆` : '剛剛好'}
                                    </span>
                                </div>
                            `)}
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700">${planText(options.find(o => o.isRight).plan)} ✓</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                        ${KIDS.map((name) => html`
                            <${CandyPlate} key=${name} name=${name} count=${avg} highlight=${true} />
                        `)}
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
    id: 'q050',
    type: 'custom',
    title: '怎麼給，糖果才會一樣多？',
    q: '平均分配：多的送出、少的收到（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${CandyShareProblem} />`);
    }
};
