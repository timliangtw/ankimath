const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q052 - 大 1 歲又幾天，是哪一天出生的？
 * ------------------------------------------------------------------
 * 比較大 = 比較早出生：
 *   大 1 歲 → 年份要減 1
 *   再大 K 天 → 日期還要再往前推 K 天（可能會退到上個月）
 * ------------------------------------------------------------------
 */

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const NAMES = [
    ['旋轉', '小品品'], ['冠廷', '思妤'], ['家瑋', '若涵'], ['宥辰', '子晴']
];

function minusDays(month, day, k) {
    let m = month, d = day - k;
    while (d < 1) {
        m -= 1;
        if (m < 1) m = 12;
        d += MONTH_DAYS[m - 1];
    }
    return { month: m, day: d };
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const year = 80 + Math.floor(Math.random() * 25);          // 民國 80~104 年
        const month = 3 + Math.floor(Math.random() * 10);          // 3~12 月（回推不會跨年）
        const day = 1 + Math.floor(Math.random() * 28);
        const gapDays = 5 + Math.floor(Math.random() * 16);        // 再大 5~20 天

        const back = minusDays(month, day, gapDays);
        if (back.month < 1) continue;

        const answer = { year: year - 1, month: back.month, day: back.day };

        // 干擾：年份加一年、日期往後推、只減天數沒減年
        const decoys = [
            { year: year + 1, month: back.month, day: back.day },
            { year: year - 1, month, day },
            { year: year - 1, month: minusDays(month, day, gapDays + 1).month, day: minusDays(month, day, gapDays + 1).day }
        ];

        const keys = new Set([`${answer.year}-${answer.month}-${answer.day}`]);
        const uniqueDecoys = [];
        decoys.forEach(d => {
            const k = `${d.year}-${d.month}-${d.day}`;
            if (!keys.has(k)) { keys.add(k); uniqueDecoys.push(d); }
        });
        if (uniqueDecoys.length < 3) continue;

        const options = [answer, ...uniqueDecoys].sort(() => Math.random() - 0.5);
        const names = NAMES[Math.floor(Math.random() * NAMES.length)];
        return { year, month, day, gapDays, answer, options, names };
    }
    return null;
}

const BirthdayBackProblem = () => {
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

    const handleSelect = (opt) => {
        if (gameState === 'correct') return;
        const key = `${opt.year}-${opt.month}-${opt.day}`;
        setSelected(key);
        const a = problem.answer;
        if (opt.year === a.year && opt.month === a.month && opt.day === a.day) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { year, month, day, gapDays, answer, options, names } = problem;
    const [baseName, otherName] = names;
    const sameYearBack = minusDays(month, day, gapDays);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日期推算
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    🎂 ${baseName}是民國
                    <span className="text-amber-600">${year} 年 ${month} 月 ${day} 日</span>出生的，
                    ${otherName}比${baseName}
                    <span className="text-blue-600">大 1 歲又 ${gapDays} 天</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    ${otherName}是哪一天出生的？
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const key = `${opt.year}-${opt.month}-${opt.day}`;
                    const isSelected = selected === key;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${key}
                            onClick=${() => handleSelect(opt)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-base md:text-lg font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.year} 年 ${opt.month} 月 ${opt.day} 日
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        比較大就是比較早出生，年份要往前一年，日期也要再往前推。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>${baseName}的生日：</span>
                            <span className="font-black text-amber-600">${year} 年 ${month} 月 ${day} 日</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>大 1 歲 → 年份減 1：</span>
                            <span className="font-black text-blue-600">${year - 1} 年 ${month} 月 ${day} 日</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>再往前推 ${gapDays} 天：</span>
                            <span className="font-black text-blue-600">${answer.year} 年 ${sameYearBack.month} 月 ${sameYearBack.day} 日</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            ${month !== sameYearBack.month
                                ? `${day} 日往前推 ${gapDays} 天不夠減，要退到上個月（${sameYearBack.month} 月有 ${MONTH_DAYS[sameYearBack.month - 1]} 天）。`
                                : `${day} 日往前推 ${gapDays} 天還在同一個月裡。`}
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">${answer.year} 年 ${answer.month} 月 ${answer.day} 日 ✓</span>
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
    id: 'q052',
    type: 'custom',
    title: '大 1 歲又幾天，是哪天出生？',
    q: '日期推算：往前推年和天數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${BirthdayBackProblem} />`);
    }
};
