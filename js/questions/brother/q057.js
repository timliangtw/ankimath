const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q057 - 【題組】貼紙用掉多長、要買幾卷？（2 小題）
 * ------------------------------------------------------------------
 * 共同題幹：三種貼紙各有各的長度和條數
 *   小題 1：總長 = 每種（長度 × 條數）再全部加起來，
 *           換算成「幾公尺幾公分」（100 公分 = 1 公尺）
 *   小題 2：一卷 100 公分 → 總長 ÷ 100，有剩下就要多買一卷（進位）
 * ------------------------------------------------------------------
 */

const KINDS = [
    { key: 'gray', name: '灰色貼紙', color: 'bg-slate-300 border-slate-500' },
    { key: 'black', name: '黑色貼紙', color: 'bg-slate-700 border-slate-900' },
    { key: 'dot', name: '圓點貼紙', color: 'bg-amber-200 border-amber-500' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function fmtLength(cm) {
    return { m: Math.floor(cm / 100), cm: cm % 100 };
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const lengths = [
            20 + Math.floor(Math.random() * 4) * 4,     // 20~32
            50 + Math.floor(Math.random() * 6) * 4,     // 50~70
            16 + Math.floor(Math.random() * 4) * 4      // 16~28
        ];
        const counts = [
            4 + Math.floor(Math.random() * 5),
            3 + Math.floor(Math.random() * 4),
            4 + Math.floor(Math.random() * 5)
        ];

        const parts = lengths.map((L, i) => L * counts[i]);
        const total = parts.reduce((a, b) => a + b, 0);
        if (total < 300 || total > 1500) continue;
        if (total % 100 === 0) continue;                 // 讓第 2 小題一定要進位

        const rolls = Math.ceil(total / 100);
        const t = fmtLength(total);

        // 小題 1 的選項：正解 + 常見錯誤（公尺公分寫反、少算一種、多 1 公尺）
        const cand1 = [
            total,
            total - parts[0],
            total + 100,
            total - 100,
            parts.reduce((a, b) => a + b, 0) - parts[2]
        ];
        const set1 = new Set();
        for (const v of cand1) {
            if (v > 0 && v !== total) set1.add(v);
            if (set1.size >= 3) break;
        }
        if (set1.size < 3) continue;
        const options1 = shuffle([...set1].slice(0, 3).concat(total)).map(fmtLength);

        const set2 = new Set();
        for (const v of [Math.floor(total / 100), rolls + 1, rolls + 2, rolls - 2]) {
            if (v > 0 && v !== rolls) set2.add(v);
            if (set2.size >= 3) break;
        }
        if (set2.size < 3) continue;
        const options2 = shuffle([...set2].slice(0, 3).concat(rolls));

        return { lengths, counts, parts, total, rolls, t, options1, options2 };
    }
    return null;
}

const StickerProblem = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState([null, null]);
    const [states, setStates] = useState(['playing', 'playing']);

    const newProblem = useCallback(() => {
        let p = null;
        for (let i = 0; i < 5 && !p; i++) p = generateProblem();
        setProblem(p);
        setStep(0);
        setPicked([null, null]);
        setStates(['playing', 'playing']);
    }, []);

    useEffect(() => { newProblem(); }, []);

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { lengths, counts, parts, total, rolls, t, options1, options2 } = problem;
    const allDone = states.every(s => s === 'correct');

    const handleSelect1 = (opt) => {
        if (states[0] === 'correct') return;
        const key = `${opt.m}-${opt.cm}`;
        setPicked([key, picked[1]]);
        const next = [...states];
        if (opt.m === t.m && opt.cm === t.cm) {
            next[0] = 'correct';
            setStep(s => Math.max(s, 1));
        } else {
            next[0] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(next);
    };

    const handleSelect2 = (opt) => {
        if (states[1] === 'correct') return;
        setPicked([picked[0], opt]);
        const next = [...states];
        if (opt === rolls) {
            next[1] = 'correct';
        } else {
            next[1] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(next);
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    題組・長度與單位（共 2 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    老師用三種不同的貼紙，在布告欄上貼出一個樓房。
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-6 space-y-2">
                ${KINDS.map((k, i) => html`
                    <div key=${k.key} className="bg-white rounded-xl border border-amber-200 p-2 flex items-center gap-2">
                        <span className=${`inline-block w-8 h-4 rounded border-2 ${k.color}`}></span>
                        <span className="font-bold text-slate-700 text-sm md:text-base">
                            ${k.name}：每一條長 <span className="text-amber-600">${lengths[i]} 公分</span>，
                            用了 <span className="text-blue-600">${counts[i]} 條</span>
                        </span>
                    </div>
                `)}
            </div>

            <!-- 小題 1 -->
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 1 小題</span>
                    ${states[0] === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-800 mb-3">
                    老師一共用掉長幾公尺幾公分的貼紙？
                </p>
                <div className="grid grid-cols-2 gap-2">
                    ${options1.map((opt, idx) => {
                        const key = `${opt.m}-${opt.cm}`;
                        const isSelected = picked[0] === key;
                        const isCorrect = states[0] === 'correct' && isSelected;
                        const isWrong = states[0] === 'wrong' && isSelected;
                        const isDisabled = states[0] === 'correct' && !isSelected;
                        return html`
                            <button
                                key=${key}
                                onClick=${() => handleSelect1(opt)}
                                disabled=${isDisabled}
                                className=${`
                                    py-3 rounded-2xl text-lg font-black transition-all border-b-4 shadow-sm
                                    ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                    ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                                `}
                            >
                                ${opt.m} 公尺 ${opt.cm} 公分
                            </button>
                        `;
                    })}
                </div>
                ${states[0] === 'wrong' && html`
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                        <div className="text-red-500 font-bold">❌ 再想想看！</div>
                        <p className="text-red-600 text-sm">三種貼紙都要算：每種先「長度 × 條數」，再全部加起來。</p>
                    </div>
                `}
                ${states[0] === 'correct' && html`
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3">
                        <div className="text-green-600 font-bold mb-1">第 1 小題答對了！</div>
                        <div className="bg-white rounded-xl p-2 text-slate-700 border border-green-100 text-sm md:text-base space-y-1">
                            ${KINDS.map((k, i) => html`
                                <div key=${k.key} className="flex justify-between">
                                    <span>${k.name}：</span>
                                    <span className="font-bold">${lengths[i]} × ${counts[i]} = ${parts[i]} 公分</span>
                                </div>
                            `)}
                            <div className="flex justify-between border-t border-green-100 pt-1">
                                <span>全部加起來：</span>
                                <span className="font-bold">${parts.join(' + ')} = ${total} 公分</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">換算：</span>
                                <span className="font-black text-green-700">${total} 公分 = ${t.m} 公尺 ${t.cm} 公分</span>
                            </div>
                        </div>
                    </div>
                `}
            </div>

            <!-- 小題 2 -->
            ${step >= 1 && html`
                <div className="mb-6 border-t-2 border-dashed border-slate-200 pt-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 2 小題</span>
                        ${states[1] === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                    </div>
                    <p className="text-lg md:text-xl font-bold text-slate-800 mb-3">
                        一卷貼紙是 100 公分，老師<span className="underline">最少</span>需要買幾卷貼紙才夠？
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        ${options2.map((opt, idx) => {
                            const isSelected = picked[1] === opt;
                            const isCorrect = states[1] === 'correct' && isSelected;
                            const isWrong = states[1] === 'wrong' && isSelected;
                            const isDisabled = states[1] === 'correct' && !isSelected;
                            return html`
                                <button
                                    key=${idx}
                                    onClick=${() => handleSelect2(opt)}
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
                    ${states[1] === 'wrong' && html`
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                            <div className="text-red-500 font-bold">❌ 再想想看！</div>
                            <p className="text-red-600 text-sm">剩下不滿一卷的部分，還是要再買一整卷才夠。</p>
                        </div>
                    `}
                </div>
            `}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 兩小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between"><span>貼紙總長：</span><span className="font-black text-amber-600">${total} 公分 = ${t.m} 公尺 ${t.cm} 公分</span></div>
                        <div className="flex justify-between">
                            <span>每卷 100 公分：</span>
                            <span className="font-black text-blue-600">${total} ÷ 100 = ${Math.floor(total / 100)} 卷，還剩 ${total % 100} 公分</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">剩下的還要再買一卷：</span>
                            <span className="font-black text-green-700 text-xl">最少 ${rolls} 卷 ✓</span>
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
    id: 'q057',
    type: 'custom',
    title: '【題組】貼紙用掉多長？要買幾卷？',
    q: '題組（2 小題）：乘法合計、公尺公分換算、進位（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${StickerProblem} />`);
    }
};
