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

// 六天五夜：5 個住宿夜晚，2/1=四, 2/2=五, 2/3=六
// 2/1 出發：住宿夜 1(四),2(五★),3(六★),4(日),5(一) → 貴 2 晚
// 2/2 出發：住宿夜 2(五★),3(六★),4(日),5(一),6(二) → 貴 2 晚
// 2/3 出發：住宿夜 3(六★),4(日),5(一),6(二),7(三) → 貴 1 晚
const CORRECT = 3; // 2 月 3 日出發最省

const options = [
    { value: 1, label: '2 月 1 日（星期四）' },
    { value: 2, label: '2 月 2 日（星期五）' },
    { value: 3, label: '2 月 3 日（星期六）' },
    { value: 0, label: '三天費用都相同'      },
];

// 各出發日的「昂貴住宿夜」明細（用於解析說明）
const NIGHT_DETAILS = {
    1: { nights: '1(四), 2(五★), 3(六★), 4(日), 5(一)', expensive: 2 },
    2: { nights: '2(五★), 3(六★), 4(日), 5(一), 6(二)', expensive: 2 },
    3: { nights: '3(六★), 4(日), 5(一), 6(二), 7(三)',  expensive: 1 },
};

const IslandTripProblem = () => {
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
        if (day >= 1 && day <= 3) {
            if (gameState === 'correct') {
                return day === CORRECT
                    ? 'bg-green-500 text-white rounded-full font-black'
                    : 'bg-amber-200 text-amber-800 rounded-full font-semibold';
            }
            return 'bg-amber-100 text-amber-700 rounded-full font-bold';
        }
        return 'text-slate-600';
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-xl">

            <!-- 標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    日曆＋費用比較
                </div>
                <p className="text-sm text-slate-600 mb-2">
                    媽媽想安排<span className="font-bold text-amber-700">六天五夜</span>的環島旅遊，計畫在
                    <span className="font-bold"> 2 月 1 日～3 日</span>之間出發。
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
                                    ${i===5 ? 'text-red-500' : ''}
                                    ${i===6 ? 'text-red-500' : ''}
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
                    <p className="text-red-600 text-sm">數數看每個出發日的五個住宿夜晚，哪個出發日落在星期五／六的次數最少？</p>
                </div>
            `}

            <!-- 答對回饋 -->
            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left border border-green-100 text-sm space-y-3">
                        ${[1, 2, 3].map(startDay => {
                            const detail = NIGHT_DETAILS[startDay];
                            const isWinner = startDay === CORRECT;
                            return html`
                                <div key=${startDay} className=${`rounded-lg p-3 ${isWinner ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                                    <div className=${`font-bold mb-1 ${isWinner ? 'text-green-700' : 'text-slate-600'}`}>
                                        2 月 ${startDay} 日出發
                                        ${isWinner ? html`<span className="ml-2 text-green-600">← 最省 ✓</span>` : ''}
                                    </div>
                                    <div className="text-xs text-slate-500">住宿夜晚：${detail.nights}</div>
                                    <div className=${`text-xs font-bold mt-1 ${isWinner ? 'text-green-600' : 'text-red-500'}`}>
                                        貴的夜晚：${detail.expensive} 天
                                    </div>
                                </div>
                            `;
                        })}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">最省方案：</span>
                            <span className="font-black text-green-700 text-lg">2 月 3 日（星期六）出發 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${reset}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        重新作答
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
