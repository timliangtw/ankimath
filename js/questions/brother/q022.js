const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const CLASS_DAYS = new Set([1, 2, 3, 4, 5]);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function getWeekday(day) {
    // 2024/7/1 is Monday, matching the calendar layout in the source image.
    return (day + 0) % 7;
}

function countLeaveDates(startDay, endDay, leaveWeekday) {
    const dates = [];
    for (let day = startDay; day <= endDay; day++) {
        if (getWeekday(day) === leaveWeekday) dates.push(day);
    }
    return dates;
}

function generateProblem() {
    const leavePool = [1, 2, 3, 4, 5];

    for (let attempt = 0; attempt < 300; attempt++) {
        const startDay = 6 + Math.floor(Math.random() * 10); // 6~15
        const duration = 14 + Math.floor(Math.random() * 8); // 14~21 days
        const endDay = Math.min(31, startDay + duration);
        const leaveWeekday = leavePool[Math.floor(Math.random() * leavePool.length)];
        const leaveDates = countLeaveDates(startDay, endDay, leaveWeekday);
        const answer = leaveDates.length;

        if (answer < 2 || answer > 5) continue;

        const wrongSet = new Set();
        for (const off of [-2, -1, 1, 2, 3, -3]) {
            const wrong = answer + off;
            if (wrong > 0 && wrong !== answer) wrongSet.add(wrong);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        return {
            month: 7,
            startDay,
            endDay,
            leaveWeekday,
            leaveDates,
            answer,
            options: shuffle([...wrongSet].slice(0, 3).concat(answer))
        };
    }

    return {
        month: 7,
        startDay: 10,
        endDay: 30,
        leaveWeekday: 2,
        leaveDates: [16, 23, 30],
        answer: 3,
        options: [2, 3, 4, 5]
    };
}

const CalendarProblem = () => {
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

    const { month, startDay, endDay, leaveWeekday, leaveDates, answer, options } = problem;
    const days = Array.from({ length: 31 }, (_, idx) => idx + 1);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日曆應用題
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    小豪參加運動夏令營，課程從
                    <span className="text-amber-600">${month}/${startDay}</span>
                    到
                    <span className="text-amber-600">${month}/${endDay}</span>，
                    上課時間是星期一到星期五。
                </h1>
                <p className="mt-3 text-lg font-bold text-slate-700 leading-relaxed">
                    小豪家每週
                    <span className="text-blue-600">星期${WEEKDAYS[leaveWeekday]}</span>
                    都要請假，他一共要請幾天假？
                </p>
            </div>

            <div className="bg-white border border-amber-100 rounded-2xl p-3 mb-5 shadow-sm">
                <div className="text-center font-black text-amber-600 text-lg mb-2">${month}月</div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    ${WEEKDAYS.map(day => html`
                        <div key=${day} className="font-bold text-slate-500 py-1">${day}</div>
                    `)}
                    <div className="h-9"></div>
                    ${days.map(day => {
                        const weekday = getWeekday(day);
                        const inCourse = day >= startDay && day <= endDay && CLASS_DAYS.has(weekday);
                        const showLeaveDay = gameState === 'correct' && inCourse && weekday === leaveWeekday;

                        return html`
                            <div
                                key=${day}
                                className=${`
                                    h-9 flex items-center justify-center rounded-xl font-bold border
                                    ${showLeaveDay ? 'bg-blue-100 text-blue-700 border-blue-300' : ''}
                                    ${inCourse && !showLeaveDay ? 'bg-amber-50 text-slate-700 border-amber-100' : ''}
                                    ${!inCourse ? 'bg-slate-50 text-slate-300 border-slate-100' : ''}
                                `}
                            >
                                ${day}
                            </div>
                        `;
                    })}
                    ${Array.from({ length: 3 }, (_, idx) => html`
                        <div key=${`blank-${idx}`} className="h-9"></div>
                    `)}
                </div>
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
                            (${idx + 1}) ${opt} 天
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再找找看！</div>
                    <p className="text-red-600 text-sm">
                        只數課程期間內，而且是星期${WEEKDAYS[leaveWeekday]}的日期。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>課程期間：</span>
                            <span className="font-black text-amber-600">${month}/${startDay} 到 ${month}/${endDay}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>要請假的星期：</span>
                            <span className="font-black text-blue-600">星期${WEEKDAYS[leaveWeekday]}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>符合的日期：</span>
                            <span className="font-black text-blue-600">
                                ${leaveDates.map(day => `${month}/${day}`).join('、')}
                            </span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 天 ✓</span>
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

export { generateProblem };

export default {
    id: 'q022',
    type: 'custom',
    title: '夏令營請假：一共請幾天？',
    q: '日曆應用題：數出固定星期的請假天數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${CalendarProblem} />`);
    }
};
