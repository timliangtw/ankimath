const { useState, useEffect, useCallback } = React;
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
const THURSDAYS = [1, 8, 15, 22, 29]; // 二月的所有星期四
const ORDINAL_LABELS = ['', '第一', '第二', '第三', '第四', '第五'];

const generateProblem = () => {
    const ordinal = Math.floor(Math.random() * 4) + 1; // 1~4
    const tripLength = Math.floor(Math.random() * 4) + 4; // 4~7 天
    const tripStart = THURSDAYS[ordinal - 1];
    const correct = tripStart + tripLength - 1;

    // 生成 3 個錯誤選項（相鄰日期，過濾超界）
    const candidates = [correct - 2, correct - 1, correct + 1, correct + 2]
        .filter(d => d >= 1 && d <= 29);
    const wrongs = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [correct, ...wrongs].sort((a, b) => a - b);

    return { ordinal, tripLength, tripStart, correct, options };
};

const JapanTripProblem = () => {
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
        if (day === problem.tripStart) return 'bg-blue-500 text-white rounded-full font-black';
        if (gameState === 'correct' && day === problem.correct) return 'bg-green-500 text-white rounded-full font-black';
        if (gameState === 'correct' && day > problem.tripStart && day < problem.correct) return 'bg-blue-100 text-blue-800 font-semibold rounded';
        return 'text-slate-600';
    };

    // 生成旅程日期串（出發→...→結束）
    const tripDays = Array.from({ length: problem.tripLength }, (_, i) => problem.tripStart + i).join(' → ');

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-xl">

            <!-- 標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日曆推算
                </div>
                <p className="text-sm text-slate-500 mb-2">小橋一家人計畫安排<span className="font-bold text-blue-700">${problem.tripLength}天${problem.tripLength - 1}夜</span>的旅遊。</p>
                <h1 className="text-lg font-bold text-slate-800 leading-relaxed">
                    爸爸想從 <span className="text-blue-600">2 月${ORDINAL_LABELS[problem.ordinal]}個星期四</span> 開始日本旅遊，
                    <br/>旅遊哪一天<span className="text-blue-600">結束</span>？
                </h1>
            </div>

            <!-- 月曆 -->
            <div className="bg-white border border-slate-200 rounded-2xl p-3 mb-5">
                <div className="text-center font-bold text-slate-700 mb-2 text-sm">2 月</div>
                <table className="w-full text-center" style=${{maxWidth: '320px', margin: '0 auto'}}>
                    <thead>
                        <tr>
                            ${DOW_LABELS.map((d, i) => html`
                                <th key=${i} className=${`pb-1 text-xs font-bold ${i===0?'text-red-400':i===6?'text-indigo-400':'text-slate-500'}`}>${d}</th>
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
                <div className="flex gap-4 justify-center mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>出發日</span>
                    ${gameState === 'correct' && html`<span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>結束日</span>`}
                </div>
            </div>

            <!-- 選項 -->
            <div className="grid grid-cols-2 gap-3 mb-4">
                ${problem.options.map((val, idx) => {
                    const isSelected = selected === val;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong   = gameState === 'wrong'   && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(val)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-lg font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105'           : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300'                        : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed': ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) 2 月 ${val} 日
                        </button>
                    `;
                })}
            </div>

            <!-- 答錯回饋 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想！</div>
                    <p className="text-red-600 text-sm">先找${ORDINAL_LABELS[problem.ordinal]}個星期四，再從那天往後數${problem.tripLength}天。</p>
                </div>
            `}

            <!-- 答對回饋 -->
            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100 text-sm">
                        <div className="flex justify-between">
                            <span>2 月的星期四：</span>
                            <span className="font-bold text-slate-600">1, 8, 15, 22, 29 日</span>
                        </div>
                        <div className="flex justify-between">
                            <span>${ORDINAL_LABELS[problem.ordinal]}個星期四：</span>
                            <span className="font-black text-blue-600">2 月 ${problem.tripStart} 日（出發）</span>
                        </div>
                        <div className="flex justify-between flex-wrap gap-1">
                            <span>${problem.tripLength}天旅遊：</span>
                            <span className="font-bold text-slate-600">${tripDays}</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">結束日：</span>
                            <span className="font-black text-green-700 text-xl">2 月 ${problem.correct} 日 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${reset}
                        className="mt-4 px-6 py-2 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q018',
    type: 'custom',
    title: '日曆推算：旅遊結束日',
    q: '日曆推算：從第幾個星期四出發，幾天旅遊哪天結束？',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${JapanTripProblem} />`);
    }
};
