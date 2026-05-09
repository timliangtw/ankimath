const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

// 固定的 2 月月曆：29 天，2/1 = 星期四（日=0...四=4）
const CAL_ROWS = [
    [null, null, null, null,   1,   2,   3],
    [   4,    5,    6,    7,   8,   9,  10],
    [  11,   12,   13,   14,  15,  16,  17],
    [  18,   19,   20,   21,  22,  23,  24],
    [  25,   26,   27,   28,  29, null, null],
];
const DOW_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

// 星期四：1, 8, 15, 22, 29 → 第三個星期四 = 15
const TRIP_START = 15;
const TRIP_LENGTH = 6;
const CORRECT = TRIP_START + TRIP_LENGTH - 1; // 20

const options = [
    { value: 18, label: '2 月 18 日' },
    { value: 19, label: '2 月 19 日' },
    { value: 20, label: '2 月 20 日' },
    { value: 21, label: '2 月 21 日' },
];

const JapanTripProblem = () => {
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const reset = useCallback(() => {
        setSelected(null);
        setGameState('playing');
    }, []);

    const handleSelect = (value) => {
        if (gameState === 'correct') return;
        setSelected(value);
        if (value === CORRECT) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    const getCellStyle = (day) => {
        if (!day) return '';
        if (day === TRIP_START) return 'bg-blue-500 text-white rounded-full font-black';
        if (gameState === 'correct' && day === CORRECT) return 'bg-green-500 text-white rounded-full font-black';
        if (gameState === 'correct' && day > TRIP_START && day < CORRECT) return 'bg-blue-100 text-blue-800 font-semibold rounded';
        return 'text-slate-600';
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-xl">

            <!-- 標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-blue-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日曆推算
                </div>
                <p className="text-sm text-slate-500 mb-2">小橋一家人計畫安排<span className="font-bold text-blue-700">六天五夜</span>的旅遊。</p>
                <h1 className="text-lg font-bold text-slate-800 leading-relaxed">
                    爸爸想從 <span className="text-blue-600">2 月第三個星期四</span> 開始日本旅遊，
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
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-blue-500"></span>出發日（第3個星期四）</span>
                    ${gameState === 'correct' && html`<span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>結束日</span>`}
                </div>
            </div>

            <!-- 選項 -->
            <div className="grid grid-cols-2 gap-3 mb-4">
                ${options.map((opt, idx) => {
                    const isSelected = selected === opt.value;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong   = gameState === 'wrong'   && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(opt.value)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-lg font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105'           : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300'                        : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed': ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300 active:scale-95 cursor-pointer' : ''}
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
                    <p className="text-red-600 text-sm">先找第三個星期四，再從那天往後數六天。</p>
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
                            <span>第三個星期四：</span>
                            <span className="font-black text-blue-600">2 月 15 日（出發）</span>
                        </div>
                        <div className="flex justify-between">
                            <span>六天旅遊：</span>
                            <span className="font-bold text-slate-600">15 → 16 → 17 → 18 → 19 → 20</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">結束日：</span>
                            <span className="font-black text-green-700 text-xl">2 月 20 日 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${reset}
                        className="mt-4 px-6 py-2 bg-blue-400 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        重新作答
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q018',
    type: 'custom',
    title: '日曆推算：六天旅遊的結束日',
    q: '日曆推算：從第三個星期四出發，六天旅遊哪天結束？',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${JapanTripProblem} />`);
    }
};
