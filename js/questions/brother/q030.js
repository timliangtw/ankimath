const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q030 - 間隔定時器：倒推開始時間
 * ------------------------------------------------------------------
 * 定時器設定「分針每走一大格響鈴一次」＝ 每 5 分鐘響一次。
 * 第 N 次響鈴時剛好結束 → 一共經過 N × 5 分鐘
 *   開始時間 = 結束時間 − N × 5 分鐘
 * 結束時間用類比時鐘顯示，要先會讀鐘面。
 * ------------------------------------------------------------------
 */

function fmtTime(t) {
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    let h = h24 % 12;
    if (h === 0) h = 12;
    return `下午 ${h} 時 ${String(m).padStart(2, '0')} 分`;
}

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const times = 5 + Math.floor(Math.random() * 5);   // 第 5~9 次響鈴
        const total = times * 5;

        // 開始時間：下午 1:00 ~ 6:30，5 分鐘為單位
        const start = 13 * 60 + Math.floor(Math.random() * 67) * 5;
        const end = start + total;
        if (end >= 20 * 60) continue;

        const wrongSet = new Set();
        for (const w of [end - times, end + total, start - 5, start + 5, start - 30, end]) {
            if (w >= 12 * 60 && w < 24 * 60 && w !== start) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, start].sort(() => Math.random() - 0.5);
        return { times, total, start, end, options };
    }

    return { times: 7, total: 35, start: 17 * 60 + 15, end: 17 * 60 + 50, options: [17 * 60 + 15, 17 * 60 + 20, 17 * 60 + 43, 18 * 60 + 25] };
}

const CLOCK_R = 88, CX = 100, CY = 100;

function handPoint(angleDeg, len) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + len * Math.cos(rad), y: CY + len * Math.sin(rad) };
}

const TimerClockProblem = () => {
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
        if (opt === problem.start) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { times, total, start, end, options } = problem;
    const endH = Math.floor(end / 60) % 12;
    const endM = end % 60;
    const minuteHand = handPoint(endM * 6, 66);
    const hourHand = handPoint((endH + endM / 60) * 30, 44);

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    時間的倒推
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    哥哥用手機下載了一個間隔定時器，設定
                    <span className="text-blue-600">分針每走一大格會響鈴一次</span>。
                    哥哥在開始玩拼圖時按下定時器按鈕，在定時器
                    <span className="text-amber-600">第 ${times} 次響鈴時</span>剛好拼完，
                    拼完後時鐘顯示如下圖。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    他是在下午幾時幾分開始玩拼圖？
                </p>
            </div>

            <!-- 時鐘 -->
            <div className="flex justify-center mb-6">
                <svg viewBox="0 0 200 200" className="w-44 h-44 md:w-52 md:h-52" role="img">
                    <circle cx=${CX} cy=${CY} r=${CLOCK_R} fill="#fff" stroke="#475569" strokeWidth="3" />
                    ${Array.from({ length: 12 }).map((_, i) => {
                        const outer = handPoint(i * 30, CLOCK_R - 4);
                        const inner = handPoint(i * 30, CLOCK_R - 12);
                        const label = handPoint(i * 30, CLOCK_R - 26);
                        return html`
                            <g key=${i}>
                                <line x1=${outer.x} y1=${outer.y} x2=${inner.x} y2=${inner.y}
                                    stroke="#475569" strokeWidth="2" />
                                <text x=${label.x} y=${label.y + 5} textAnchor="middle"
                                    fontSize="14" fontWeight="bold" fill="#475569">${i === 0 ? 12 : i}</text>
                            </g>
                        `;
                    })}
                    <line x1=${CX} y1=${CY} x2=${hourHand.x} y2=${hourHand.y}
                        stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
                    <line x1=${CX} y1=${CY} x2=${minuteHand.x} y2=${minuteHand.y}
                        stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                    <circle cx=${CX} cy=${CY} r="5" fill="#1e293b" />
                </svg>
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
                                py-3 rounded-2xl text-lg md:text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${fmtTime(opt)}
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        分針走一大格是 5 分鐘，先算出響 ${times} 次一共過了多久，再往前倒推。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>分針一大格：</span>
                            <span className="font-black text-blue-600">5 分鐘</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>響 ${times} 次共經過：</span>
                            <span className="font-black text-blue-600">${times} × 5 = ${total} 分鐘</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>時鐘顯示拼完的時間：</span>
                            <span className="font-black text-amber-600">${fmtTime(end)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>往前推 ${total} 分鐘：</span>
                            <span className="font-black text-green-600">${fmtTime(start)}</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">${fmtTime(start)} ✓</span>
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
    id: 'q030',
    type: 'custom',
    title: '定時器響幾次？倒推開始時間',
    q: '時間倒推：讀鐘面 + 間隔計算（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TimerClockProblem} />`);
    }
};
