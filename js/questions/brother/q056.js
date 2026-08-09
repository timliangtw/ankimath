const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q056 - 【題組】一放寒假就出發：哪天出發、哪天回國？（2 小題）
 * ------------------------------------------------------------------
 * 共同題幹：學校在 1 月的第 K 個星期四開始放寒假，
 *           旅行團固定每個星期六出發，行程是 D 天 (D−1) 夜。
 *   小題 1：一放寒假就出發 → 放假日之後（含當天）第一個星期六
 *   小題 2：回國日 = 出發日 + (D − 1) 天
 *           （8 天 7 夜代表出發那天算第 1 天，第 8 天回到家）
 * ------------------------------------------------------------------
 */

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const JAN_DAYS = 31, FEB_DAYS = 28;

function toIndex(month, day) {
    return month === 1 ? day - 1 : JAN_DAYS + day - 1;
}
function fromIndex(idx) {
    return idx < JAN_DAYS ? { month: 1, day: idx + 1 } : { month: 2, day: idx - JAN_DAYS + 1 };
}

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const firstWeekday = Math.floor(Math.random() * 7);        // 1 月 1 日是星期幾
        const nth = 2 + Math.floor(Math.random() * 3);             // 第 2~4 個星期四
        const nights = 5 + Math.floor(Math.random() * 5);          // 5~9 夜
        const days = nights + 1;                                    // 天數 = 夜數 + 1

        const weekdayOf = (idx) => (firstWeekday + idx) % 7;

        // 找 1 月的第 nth 個星期四
        let count = 0, holidayIdx = -1;
        for (let idx = 0; idx < JAN_DAYS; idx++) {
            if (weekdayOf(idx) === 4) {
                count++;
                if (count === nth) { holidayIdx = idx; break; }
            }
        }
        if (holidayIdx < 0) continue;

        // 放假日之後（含當天）的第一個星期六
        let departIdx = holidayIdx;
        while (weekdayOf(departIdx) !== 6) departIdx++;
        const returnIdx = departIdx + nights;
        if (returnIdx >= JAN_DAYS + FEB_DAYS) continue;

        const depart = fromIndex(departIdx);
        const back = fromIndex(returnIdx);
        const holiday = fromIndex(holidayIdx);

        const makeOptions = (correctIdx, offsets) => {
            const set = new Set();
            for (const off of offsets) {
                const w = correctIdx + off;
                if (w >= 0 && w < JAN_DAYS + FEB_DAYS && w !== correctIdx) set.add(w);
                if (set.size >= 3) break;
            }
            return shuffle([...set].slice(0, 3).concat(correctIdx)).map(fromIndex);
        };

        return {
            firstWeekday, nth, nights, days,
            holiday, depart, back, holidayIdx, departIdx, returnIdx,
            options1: makeOptions(departIdx, [-7, 7, -1, 1, 14]),
            options2: makeOptions(returnIdx, [-1, 1, 7, -7, 2])
        };
    }
    return null;
}

const WinterTripProblem = () => {
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

    const {
        firstWeekday, nth, nights, days,
        holiday, depart, back, holidayIdx, departIdx, returnIdx,
        options1, options2
    } = problem;

    const answers = [departIdx, returnIdx];
    const allDone = states.every(s => s === 'correct');

    const handleSelect = (index, opt) => {
        if (states[index] === 'correct') return;
        const idx = toIndex(opt.month, opt.day);
        const nextPicked = [...picked];
        nextPicked[index] = `${opt.month}-${opt.day}`;
        setPicked(nextPicked);

        const nextStates = [...states];
        if (idx === answers[index]) {
            nextStates[index] = 'correct';
            setStep(s => Math.max(s, index + 1));
        } else {
            nextStates[index] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(nextStates);
    };

    const calendar = (month) => {
        const startIdx = month === 1 ? 0 : JAN_DAYS;
        const total = month === 1 ? JAN_DAYS : FEB_DAYS;
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
                        const isHoliday = idx === holidayIdx;
                        const isDepart = states[0] === 'correct' && idx === departIdx;
                        const isBack = states[1] === 'correct' && idx === returnIdx;
                        const inTrip = states[1] === 'correct' && idx > departIdx && idx < returnIdx;
                        return html`
                            <div key=${`d${i}`} className=${`text-center text-[11px] font-bold rounded py-0.5
                                ${isDepart ? 'bg-blue-500 text-white' : ''}
                                ${isBack ? 'bg-green-500 text-white' : ''}
                                ${inTrip ? 'bg-blue-100 text-blue-700' : ''}
                                ${isHoliday && !isDepart ? 'ring-2 ring-amber-400 text-amber-600' : ''}
                                ${!isDepart && !isBack && !inTrip && !isHoliday ? 'text-slate-500' : ''}`}>${d}</div>
                        `;
                    })}
                </div>
            </div>
        `;
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
                <div className="grid grid-cols-2 gap-2">
                    ${options.map((opt, idx) => {
                        const key = `${opt.month}-${opt.day}`;
                        const isSelected = picked[index] === key;
                        const isCorrect = state === 'correct' && isSelected;
                        const isWrong = state === 'wrong' && isSelected;
                        const isDisabled = state === 'correct' && !isSelected;
                        return html`
                            <button
                                key=${key}
                                onClick=${() => handleSelect(index, opt)}
                                disabled=${isDisabled}
                                className=${`
                                    py-3 rounded-2xl text-lg font-black transition-all border-b-4 shadow-sm
                                    ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                    ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                                `}
                            >
                                ${opt.month} 月 ${opt.day} 日
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
                    題組・日期推算（共 2 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    學校會在 <span className="text-amber-600">1 月的第 ${nth} 個星期四</span>開始放寒假。
                    有一個 <span className="text-blue-600">${days} 天 ${nights} 夜</span>的國外旅遊行程，
                    固定<span className="text-blue-600">每個星期六出發</span>。
                </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-5">
                ${calendar(1)}
                ${calendar(2)}
            </div>

            ${block(
                0,
                html`<span>小貝一家人想要<span className="text-amber-600">一放寒假就出發</span>旅行，他們應該參加哪一天出發的旅行團？</span>`,
                options1,
                `先找出 1 月的第 ${nth} 個星期四是幾號（黃框），再看那天之後最近的星期六。`,
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>第 ${nth} 個星期四：</span><span className="font-bold">1 月 ${holiday.day} 日開始放寒假</span></div>
                        <div className="flex justify-between border-t border-green-100 pt-1">
                            <span className="font-bold">之後最近的星期六：</span>
                            <span className="font-black text-green-700">${depart.month} 月 ${depart.day} 日出發</span>
                        </div>
                    </div>
                `
            )}

            ${block(
                1,
                html`<span>這個 ${days} 天 ${nights} 夜的行程，他們哪一天回國？</span>`,
                options2,
                `${days} 天 ${nights} 夜是出發那天算第 1 天，再往後推 ${nights} 天。`,
                html`
                    <div className="space-y-1">
                        <div className="flex justify-between"><span>出發那天算第 1 天：</span><span className="font-bold">${depart.month} 月 ${depart.day} 日</span></div>
                        <div className="flex justify-between"><span>往後推 ${nights} 天：</span><span className="font-bold">${depart.day} + ${nights}</span></div>
                        <div className="flex justify-between border-t border-green-100 pt-1">
                            <span className="font-bold">回國：</span>
                            <span className="font-black text-green-700">${back.month} 月 ${back.day} 日（第 ${days} 天）</span>
                        </div>
                    </div>
                `
            )}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 兩小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between"><span>開始放寒假：</span><span className="font-black text-amber-600">1 月 ${holiday.day} 日（星期四）</span></div>
                        <div className="flex justify-between"><span>出發：</span><span className="font-black text-blue-600">${depart.month} 月 ${depart.day} 日（星期六）</span></div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">回國：</span>
                            <span className="font-black text-green-700 text-xl">${back.month} 月 ${back.day} 日 ✓</span>
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
    id: 'q056',
    type: 'custom',
    title: '【題組】一放寒假就出發：哪天出發、哪天回國',
    q: '題組（2 小題）：第幾個星期幾 + 幾天幾夜（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${WinterTripProblem} />`);
    }
};
