const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q028 - 第 N 個星期日：哪一個日期不可能？
 * ------------------------------------------------------------------
 * 某活動在 M 月的第 N 個星期日舉行：
 *   最早 → 1 日就是星期日時，第 N 個星期日 = (N−1)×7 + 1 日
 *   最晚 → 1 日是星期一時，第 1 個星期日 = 7 日，第 N 個 = N×7 日
 * 所以可能的日期只有 [(N−1)×7+1, N×7] 這 7 天，其餘都不可能。
 * ------------------------------------------------------------------
 */

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const EVENTS = ['直排輪比賽', '圍棋比賽', '社區跳蚤市場', '親子路跑', '棒球隊練習賽'];
const WEEK_HEAD = ['日', '一', '二', '三', '四', '五', '六'];

function pickSome(pool, n) {
    const copy = [...pool];
    const out = [];
    while (out.length < n && copy.length > 0) {
        out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
    }
    return out;
}

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const month = 1 + Math.floor(Math.random() * 12);
        const nth = 2 + Math.floor(Math.random() * 3);   // 第 2~4 個星期日
        const days = DAYS_IN_MONTH[month - 1];

        const lo = (nth - 1) * 7 + 1;
        const hi = nth * 7;
        if (hi > days) continue;

        const possible = [];
        for (let d = lo; d <= hi; d++) possible.push(d);

        const impossible = [];
        for (let d = 1; d < lo; d++) impossible.push(d);
        for (let d = hi + 1; d <= days; d++) impossible.push(d);
        if (impossible.length === 0) continue;

        const answer = impossible[Math.floor(Math.random() * impossible.length)];
        const decoys = pickSome(possible, 3);
        if (decoys.length < 3) continue;

        const options = [...decoys, answer].sort((a, b) => a - b);
        const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];

        return { month, nth, days, lo, hi, answer, options, event };
    }

    return {
        month: 5, nth: 2, days: 31, lo: 8, hi: 14,
        answer: 15, options: [8, 10, 14, 15], event: '直排輪比賽'
    };
}

const NthSundayProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing'); // playing | correct | wrong

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

    const { month, nth, lo, hi, answer, options, event } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日期與星期
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${event}是 <span className="text-amber-600">${month} 月的第 ${nth} 個星期日</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    下面哪一個日期<span className="text-red-500 underline">不可能</span>是${event}的日子？
                </p>
            </div>

            <!-- 空白月曆（可以在腦中排排看） -->
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-3 mb-6">
                <div className="text-center font-bold text-slate-600 mb-2">${month} 月</div>
                <div className="grid grid-cols-7 gap-1">
                    ${WEEK_HEAD.map((w, i) => html`
                        <div key=${`h${i}`} className="text-center text-sm font-bold text-slate-500 bg-slate-100 rounded py-1">${w}</div>
                    `)}
                    ${Array.from({ length: 35 }).map((_, i) => html`
                        <div key=${`c${i}`} className="h-7 border border-slate-100 rounded"></div>
                    `)}
                </div>
            </div>

            <!-- 四個選項 -->
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
                                py-4 rounded-2xl text-xl md:text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${month} 月 ${opt} 日
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        想想看：${month} 月 1 日最早、最晚分別是星期幾的時候，第 ${nth} 個星期日會落在哪一天？
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>1 日剛好是星期日時：</span>
                            <span className="font-black text-amber-600">第 ${nth} 個星期日 = ${lo} 日（最早）</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>1 日是星期一時：</span>
                            <span className="font-black text-blue-600">第 ${nth} 個星期日 = ${hi} 日（最晚）</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            所以第 ${nth} 個星期日只可能落在 ${lo} 日 ～ ${hi} 日這 7 天裡面。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">不可能的日期：</span>
                            <span className="font-black text-green-700 text-xl">${month} 月 ${answer} 日 ✓</span>
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
    id: 'q028',
    type: 'custom',
    title: '第幾個星期日？哪個日期不可能',
    q: '日期推理：第 N 個星期日的範圍（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${NthSundayProblem} />`);
    }
};
