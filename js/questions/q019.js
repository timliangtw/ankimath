const { useState, useCallback } = React;
const html = htm.bind(React.createElement);

// 固定的 2 月月曆：29 天，2/1 = 星期四
const CAL_ROWS = [
    [null, null, null, null,   1,   2,   3],
    [   4,    5,    6,    7,   8,   9,  10],
    [  11,   12,   13,   14,  15,  16,  17],
    [  18,   19,   20,   21,  22,  23,  24],
    [  25,   26,   27,   28,  29, null, null],
];
const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const DOW_FULL   = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
// 2月第n天的星期: (n+3)%7  →  n=1→4(四), n=2→5(五), n=3→6(六)
const THURSDAYS = [1, 8, 15, 22]; // 4個星期四
const EXPENSIVE = new Set([5, 6]); // 星期五=5, 星期六=6

const getDOW = (day) => (day + 3) % 7;

const generateProblem = () => {
    const thurIdx = Math.floor(Math.random() * 4);
    const thuDay  = THURSDAYS[thurIdx]; // 1,8,15,22
    const nights  = Math.floor(Math.random() * 3) + 4; // 4,5,6 夜

    // 三個出發日：星期四、五、六
    const startDays = [thuDay, thuDay + 1, thuDay + 2];
    const details = startDays.map(d => {
        const nightDays = Array.from({ length: nights }, (_, i) => d + i);
        const expCount = nightDays.filter(nd => EXPENSIVE.has(getDOW(nd))).length;
        const nightStr = nightDays.map(nd => {
            const dow = getDOW(nd);
            return `${nd}(${DOW_LABELS[dow]}${EXPENSIVE.has(dow) ? '★' : ''})`;
        }).join(', ');
        return { day: d, dowFull: DOW_FULL[getDOW(d)], nights: nightStr, expensive: expCount };
    });

    const correct = thuDay + 2; // 星期六，永遠最省（1個昂貴夜 vs 2個）

    return { thuDay, nights, startDays, details, correct };
};

const IslandTripProblem = () => {
    const [problem, setProblem] = useState(() => generateProblem());
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const reset = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    const handleSelect = (value) => {
        if (gameState === 'correct') return;
        setSelected(value);
        if (value === problem.correct) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    const getCellStyle = (day) => {
        if (!day) return '';
        if (problem.startDays.includes(day)) {
            if (gameState === 'correct') {
                return day === problem.correct
                    ? 'bg-green-500 text-white rounded-full font-black'
                    : 'bg-amber-200 text-amber-800 rounded-full font-semibold';
            }
            return 'bg-amber-100 text-amber-700 rounded-full font-bold';
        }
        return 'text-slate-600';
    };

    // 選項：三個出發日 + 「三天費用都相同」干擾項
    const options = [
        ...problem.startDays.map(d => ({ value: d, label: `2月${d}日（${DOW_FULL[getDOW(d)]}）` })),
        { value: -1, label: '三天費用都相同' },
    ];

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-xl">

            <!-- 標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日曆＋費用比較
                </div>
                <p className="text-sm text-slate-600 mb-2">
                    媽媽想安排<span className="font-bold text-amber-700">${problem.nights + 1}天${problem.nights}夜</span>的環島旅遊，計畫在
                    <span className="font-bold"> 2月${problem.thuDay}日～${problem.thuDay + 2}日</span>之間出發。
                </p>
                <p className="text-sm text-slate-600 mb-2">
                    旅館<span className="font-bold text-red-600">星期五、星期六</span>的住宿費比其他天<span className="font-bold text-red-600">貴</span>。
                </p>
                <h1 className="text-lg font-bold text-slate-800">
                    媽媽想花<span className="text-amber-600">最少</span>的住宿費，應選哪一天出發？
                </h1>
            </div>

            <!-- 月曆 -->
            <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-5">
                <div className="text-center font-bold text-slate-700 mb-2 text-sm">2 月</div>
                <table className="w-full text-center" style=${{maxWidth: '320px', margin: '0 auto'}}>
                    <thead>
                        <tr>
                            ${DOW_LABELS.map((d, i) => html`
                                <th key=${i} className=${`pb-1 text-xs font-bold
                                    ${i===0 ? 'text-red-400' : ''}
                                    ${i===5 || i===6 ? 'text-red-500' : ''}
                                    ${i>0 && i<5 ? 'text-slate-500' : ''}
                                `}>${d}${(i===5||i===6)?'★':''}</th>
                            `)}
                        </tr>
                    </thead>
                    <tbody>
                        ${CAL_ROWS.map((row, ri) => html`
                            <tr key=${ri}>
                                ${row.map((day, di) => html`
                                    <td key=${di} className="py-1">
                                        <span className=${`inline-flex items-center justify-center w-7 h-7 text-xs ${getCellStyle(day)}`}>
                                            ${day || ''}
                                        </span>
                                    </td>
                                `)}
                            </tr>
                        `)}
                    </tbody>
                </table>
                <p className="text-xs text-red-500 text-center mt-2">★ 星期五、六住宿費較貴</p>
            </div>

            <!-- 選項 -->
            <div className="grid grid-cols-2 gap-3 mb-4">
                ${options.map((opt, idx) => {
                    const isSelected = selected === opt.value;
                    const isCorrect  = gameState === 'correct' && isSelected;
                    const isWrong    = gameState === 'wrong'   && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(opt.value)}
                            disabled=${isDisabled}
                            className=${`
                                py-3 rounded-2xl text-base font-bold transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105'           : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300'                        : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed': ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.label}
                        </button>
                    `;
                })}
            </div>

            <!-- 答錯回饋 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想！</div>
                    <p className="text-red-600 text-sm">數數看每個出發日的${problem.nights}個住宿夜晚，哪個出發日落在星期五／六的次數最少？</p>
                </div>
            `}

            <!-- 答對回饋 -->
            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-4">🎉 答對了！</div>
                    <button
                        onClick=${reset}
                        className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q019',
    type: 'custom',
    title: '日曆推算：選最省費用的出發日',
    q: '日曆推算：比較三個出發日的住宿費，哪天出發最省？',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${IslandTripProblem} />`);
    }
};
