const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q046 - 只上平日的課程，最後一天是幾月幾日？
 * ------------------------------------------------------------------
 * 從明天開始每天上課，星期六、星期日不上課，一共要上 T 天。
 * 做法：從明天起一天一天往後推，遇到週末就跳過，數到第 T 個上課日。
 * 為了看得懂，畫出 3 月和 4 月的日曆，答對後把上課日標出來。
 * ------------------------------------------------------------------
 */

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const COURSES = [
    { name: '游泳課', icon: '🏊' },
    { name: '直排輪課', icon: '🛼' },
    { name: '書法課', icon: '🖌️' },
    { name: '圍棋課', icon: '⚫' }
];
const MONTH_DAYS = { 3: 31, 4: 30 };

// 把 (月, 日) 轉成「3 月 1 日算第 0 天」的序號
function toIndex(month, day) {
    return month === 3 ? day - 1 : 31 + day - 1;
}
function fromIndex(idx) {
    return idx < 31 ? { month: 3, day: idx + 1 } : { month: 4, day: idx - 31 + 1 };
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const firstWeekday = Math.floor(Math.random() * 7);        // 3 月 1 日是星期幾
        const todayDay = 3 + Math.floor(Math.random() * 12);       // 今天是 3 月 3~14 日
        const lessons = 8 + Math.floor(Math.random() * 8);         // 一共上 8~15 天

        const weekdayOf = (idx) => (firstWeekday + idx) % 7;

        const days = [];
        let idx = toIndex(3, todayDay) + 1;                        // 從明天開始
        let guard = 0;
        while (days.length < lessons && guard++ < 200) {
            const w = weekdayOf(idx);
            if (w !== 0 && w !== 6) days.push(idx);
            idx++;
        }
        if (days.length < lessons) continue;

        const lastIdx = days[days.length - 1];
        const last = fromIndex(lastIdx);
        if (lastIdx > 31 + 25) continue;                            // 不要跑太遠

        const wrongSet = new Set();
        for (const off of [-7, -3, 3, 7, -1]) {
            const w = lastIdx + off;
            if (w > toIndex(3, todayDay) && w < 31 + 30 && w !== lastIdx) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, lastIdx].sort(() => Math.random() - 0.5).map(fromIndex);
        const course = COURSES[Math.floor(Math.random() * COURSES.length)];

        return { firstWeekday, todayDay, lessons, days, lastIdx, last, options, course };
    }
    return null;
}

const WeekdayCourseProblem = () => {
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
        setSelected(`${opt.month}-${opt.day}`);
        if (opt.month === problem.last.month && opt.day === problem.last.day) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { firstWeekday, todayDay, lessons, days, last, options, course } = problem;
    const solved = gameState === 'correct';
    const daySet = new Set(days);

    const calendar = (month) => {
        const startIdx = month === 3 ? 0 : 31;
        const total = MONTH_DAYS[month];
        const lead = (firstWeekday + startIdx) % 7;
        const cells = [...Array.from({ length: lead }, () => null),
                       ...Array.from({ length: total }, (_, i) => i + 1)];
        return html`
            <div className="bg-white rounded-xl border-2 border-slate-100 p-2">
                <div className="text-center font-bold text-slate-600 text-sm mb-1">${month} 月</div>
                <div className="grid grid-cols-7 gap-0.5">
                    ${WEEK.map((w, i) => html`
                        <div key=${`h${i}`} className=${`text-center text-[10px] font-bold rounded py-0.5
                            ${i === 0 || i === 6 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-500'}`}>${w}</div>
                    `)}
                    ${cells.map((d, i) => {
                        if (d === null) return html`<div key=${`e${i}`}></div>`;
                        const idx = startIdx + d - 1;
                        const isToday = month === 3 && d === todayDay;
                        const isLesson = solved && daySet.has(idx);
                        const isLast = solved && idx === problem.lastIdx;
                        return html`
                            <div key=${`d${i}`} className=${`text-center text-[11px] font-bold rounded py-0.5
                                ${isLast ? 'bg-green-500 text-white' : ''}
                                ${isLesson && !isLast ? 'bg-green-100 text-green-700' : ''}
                                ${isToday ? 'ring-2 ring-amber-400 text-amber-600' : ''}
                                ${!isLesson && !isToday ? 'text-slate-500' : ''}`}>${d}</div>
                        `;
                    })}
                </div>
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日期推算
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    今天是 <span className="text-amber-600">3 月 ${todayDay} 日</span>，
                    哥哥從<span className="text-amber-600">明天</span>開始每天上${course.icon}${course.name}，
                    一共要上 <span className="text-blue-600">${lessons} 天</span>，
                    星期六和星期日不上課。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    最後一天上${course.name}是幾月幾日？
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
                ${calendar(3)}
                ${calendar(4)}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const key = `${opt.month}-${opt.day}`;
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
                                py-4 rounded-2xl text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.month} 月 ${opt.day} 日
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        在日曆上從明天開始一天一天數，遇到星期六、日要跳過去不算。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="text-sm text-slate-500">上課的日子（綠色，深綠色是最後一天）：</div>
                        <div className="flex flex-wrap gap-1">
                            ${days.map((d, i) => {
                                const t = fromIndex(d);
                                return html`
                                    <span key=${i} className=${`px-2 py-0.5 rounded text-sm font-bold
                                        ${i === days.length - 1 ? 'bg-green-500 text-white' : 'bg-green-100 text-green-700'}`}>
                                        ${i + 1}. ${t.month}/${t.day}
                                    </span>
                                `;
                            })}
                        </div>
                        <div className="text-sm text-slate-500 pt-1">
                            中間跳過的星期六、日不算上課日，所以要往後多推幾天。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">最後一天：</span>
                            <span className="font-black text-green-700 text-xl">${last.month} 月 ${last.day} 日 ✓</span>
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
    id: 'q046',
    type: 'custom',
    title: '只上平日：最後一天是幾月幾日？',
    q: '日期推算：跳過週末往後數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${WeekdayCourseProblem} />`);
    }
};
