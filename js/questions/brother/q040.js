const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q040 - 鏡子裡的時鐘：他是什麼時候開始的？
 * ------------------------------------------------------------------
 * 從鏡子看鐘面，左右會相反：
 *   真正的時間 + 鏡子裡看到的時間 = 12 小時
 *   （例如鏡子裡看起來像 9:30，真正的時間就是 2:30）
 * 先把鏡中時間換回真正的結束時間，再往前扣掉練習的時間長度。
 * ------------------------------------------------------------------
 */

const ACTIVITIES = [
    { name: '拉小提琴', icon: '🎻' },
    { name: '練鋼琴', icon: '🎹' },
    { name: '寫作業', icon: '📖' },
    { name: '打籃球', icon: '🏀' }
];

function fmt(t) {
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    let h = h24 % 12;
    if (h === 0) h = 12;
    if (m === 0) return `下午 ${h} 點鐘`;
    if (m === 30) return `下午 ${h} 點半`;
    return `下午 ${h} 點 ${m} 分`;
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const lastMin = [30, 60, 90][Math.floor(Math.random() * 3)];   // 練習 30/60/90 分鐘
        // 結束時間：下午 1:00 ~ 5:30，整點或半點
        const end = 13 * 60 + Math.floor(Math.random() * 10) * 30;
        const start = end - lastMin;
        if (start < 12 * 60 + 30) continue;

        // 鏡中時間：真實 + 鏡中 = 12 小時（以 12 小時制計算）
        const end12 = end % (12 * 60);
        const mirror = (12 * 60 - end12) % (12 * 60);

        const wrongSet = new Set();
        for (const w of [end, mirror + 12 * 60, mirror + 12 * 60 - lastMin, start + 2 * 60, start - 60]) {
            if (w > 12 * 60 && w < 24 * 60 && w !== start) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, start].sort(() => Math.random() - 0.5);
        const activity = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
        return { lastMin, end, start, mirror, options, activity };
    }
    return {
        lastMin: 60, end: 14 * 60 + 30, start: 13 * 60 + 30, mirror: 9 * 60 + 30,
        options: [13 * 60 + 30, 14 * 60 + 30, 21 * 60 + 30, 12 * 60 + 30],
        activity: ACTIVITIES[0]
    };
}

const CX = 100, CY = 100, R = 84;

function handPoint(angleDeg, len) {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: CX + len * Math.cos(rad), y: CY + len * Math.sin(rad) };
}

const MirrorClockProblem = () => {
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
        if (opt === problem.start) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { lastMin, end, start, mirror, options, activity } = problem;

    // 鏡中鐘面：直接把「鏡中時間」畫出來就是鏡子裡看到的樣子
    const mh = Math.floor(mirror / 60) % 12;
    const mm = mirror % 60;
    const mirrorMinute = handPoint(mm * 6, 62);
    const mirrorHour = handPoint((mh + mm / 60) * 30, 42);

    // 答對後另外畫真正的鐘面
    const eh = Math.floor(end / 60) % 12;
    const em = end % 60;
    const realMinute = handPoint(em * 6, 62);
    const realHour = handPoint((eh + em / 60) * 30, 42);

    const clock = (hour, minute, label, color) => html`
        <div className="text-center">
            <svg viewBox="0 0 200 200" className="w-36 h-36 md:w-40 md:h-40">
                <circle cx=${CX} cy=${CY} r=${R} fill="#fff" stroke=${color} strokeWidth="4" />
                ${Array.from({ length: 60 }).map((_, i) => {
                    const big = i % 5 === 0;
                    const outer = handPoint(i * 6, R - 3);
                    const inner = handPoint(i * 6, R - (big ? 12 : 7));
                    return html`<line key=${i} x1=${outer.x} y1=${outer.y} x2=${inner.x} y2=${inner.y}
                        stroke="#475569" strokeWidth=${big ? 3 : 1.5} />`;
                })}
                <line x1=${CX} y1=${CY} x2=${hour.x} y2=${hour.y} stroke="#1e293b" strokeWidth="7" strokeLinecap="round" />
                <line x1=${CX} y1=${CY} x2=${minute.x} y2=${minute.y} stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                <circle cx=${CX} cy=${CY} r="5" fill="#1e293b" />
            </svg>
            <div className="text-sm font-black" style=${{ color }}>${label}</div>
        </div>
    `;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    鏡子裡的時鐘
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    ${activity.icon} 小華${activity.name} <span className="text-blue-600">${lastMin} 分鐘</span>，
                    做完以後<span className="text-amber-600">從鏡子裡</span>看到鐘面如下圖。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    小華是什麼時候開始${activity.name}的？
                </p>
            </div>

            <div className="flex justify-center gap-4 mb-6 flex-wrap">
                ${clock(mirrorHour, mirrorMinute, '鏡子裡看到的', '#0284c7')}
                ${gameState === 'correct' && clock(realHour, realMinute, `真正的時間（${fmt(end)}）`, '#16a34a')}
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
                                py-4 rounded-2xl text-lg md:text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${fmt(opt)}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        鏡子裡的鐘左右相反，要先換回真正的時間，再往前推 ${lastMin} 分鐘。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>鏡子裡看起來像：</span>
                            <span className="font-black text-blue-600">${fmt(mirror + 12 * 60)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>換回真正的時間：</span>
                            <span className="font-black text-amber-600">${fmt(end)}（結束）</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            鏡子會把左右對調，真正的時間和鏡中的時間加起來剛好是 12 小時。
                        </div>
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span>往前推 ${lastMin} 分鐘：</span>
                            <span className="font-black text-green-600">${fmt(start)}</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">${fmt(start)} 開始 ✓</span>
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
    id: 'q040',
    type: 'custom',
    title: '鏡子裡的時鐘：什麼時候開始的？',
    q: '鏡中時間換算 + 往前推算（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MirrorClockProblem} />`);
    }
};
