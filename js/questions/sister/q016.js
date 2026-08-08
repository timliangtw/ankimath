const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q016 - 【題組】座位：照著描述找到每隻小動物的位子（4 小題）
 * ------------------------------------------------------------------
 * 座位 3 排 × 5 個，號碼由前往後、由左往右編：
 *   第 1 排 1~5、第 2 排 6~10、第 3 排 11~15
 * 小動物背對我們面向螢幕，所以牠們的左手邊就是我們看到的左邊。
 *   1. 河馬：從前往後第 2 排、從左往右第 C 個
 *   2. 小熊：坐在河馬後面（同一直行的下一排）
 *   3. 小豬：小熊左手邊的第 K 個位子
 *   4. 小狗：河馬前面那一排，從右往左數第 M 個
 * ------------------------------------------------------------------
 */

const ROWS = 3, COLS = 5;

function seatNo(row, col) {   // row/col 從 0 開始
    return row * COLS + col + 1;
}

function generateProblem() {
    // 從第 2 個位子開始，保證小熊左手邊一定還有位子
    const hippoCol = 1 + Math.floor(Math.random() * (COLS - 1)); // 0-based，1~4
    const hippoRow = 1;                                          // 固定第 2 排，前後都有位子
    const bearRow = hippoRow + 1;
    const pigStep = 1 + Math.floor(Math.random() * hippoCol);    // 左手邊第 1~hippoCol 個
    const dogFromRight = 1 + Math.floor(Math.random() * COLS);   // 從右往左第 1~5 個

    const hippo = { row: hippoRow, col: hippoCol };
    const bear = { row: bearRow, col: hippoCol };
    const pig = { row: bearRow, col: hippoCol - pigStep };
    const dog = { row: hippoRow - 1, col: COLS - dogFromRight };

    return {
        hippoCol, pigStep, dogFromRight,
        steps: [
            { icon: '🦛', name: '河馬', seat: hippo,
              text: `河馬坐在從前往後數第 2 排的座位，從左往右數第 ${hippoCol + 1} 個椅子上。`,
              explain: `第 2 排是 ${seatNo(1, 0)}～${seatNo(1, COLS - 1)} 號，從左邊數第 ${hippoCol + 1} 個就是 ${seatNo(hippo.row, hippo.col)} 號。` },
            { icon: '🐻', name: '小熊', seat: bear,
              text: '小熊坐在河馬的後面。',
              explain: `河馬在 ${seatNo(hippo.row, hippo.col)} 號，正後面那一排的同一個位子是 ${seatNo(bear.row, bear.col)} 號。` },
            { icon: '🐷', name: '小豬', seat: pig,
              text: `小豬坐在小熊左手邊的第 ${pigStep} 個椅子上。`,
              explain: `小熊在 ${seatNo(bear.row, bear.col)} 號，往左邊數 ${pigStep} 個是 ${seatNo(pig.row, pig.col)} 號。` },
            { icon: '🐶', name: '小狗', seat: dog,
              text: `小狗坐在河馬前面的那排座位，從右往左數第 ${dogFromRight} 個椅子上。`,
              explain: `河馬前面是第 1 排（${seatNo(0, 0)}～${seatNo(0, COLS - 1)} 號），從右邊數第 ${dogFromRight} 個是 ${seatNo(dog.row, dog.col)} 號。` }
        ]
    };
}

const SeatingGame = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);
    const [placed, setPlaced] = useState([]);
    const [wrongSeat, setWrongSeat] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(0);
        setPlaced([]);
        setWrongSeat(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (row, col) => {
        if (gameState === 'correct') return;
        const target = problem.steps[step].seat;
        if (row === target.row && col === target.col) {
            const next = [...placed, { ...problem.steps[step], row, col }];
            setPlaced(next);
            setWrongSeat(null);
            if (next.length === problem.steps.length) {
                setGameState('correct');
            } else {
                setStep(step + 1);
                setGameState('playing');
            }
        } else {
            setWrongSeat(`${row}-${col}`);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">找位子中...</div>`;

    const { steps } = problem;
    const current = steps[step];
    const done = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    座位（共 4 小題）
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    小動物們一起來看電影，幫牠們找到座位。
                </h1>
                <p className="mt-1 text-sm font-bold text-slate-500">螢幕在最上面，小動物都面向螢幕坐</p>
            </div>

            <!-- 目前這一小題 -->
            ${!done && html`
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-4xl">${current.icon}</span>
                    <div className="bg-lime-50 border-2 border-lime-300 rounded-2xl px-4 py-3 text-lg md:text-xl font-bold text-slate-700">
                        <span className="text-xs block text-slate-500">第 ${step + 1} / ${steps.length} 隻</span>
                        ${current.text}
                    </div>
                </div>
            `}

            <!-- 座位圖 -->
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-3 mb-5">
                <div className="text-center text-xs font-black text-blue-500 mb-2">🎬 螢幕</div>
                <div className="space-y-2">
                    ${Array.from({ length: ROWS }).map((_, r) => html`
                        <div key=${r} className="grid grid-cols-5 gap-1">
                            ${Array.from({ length: COLS }).map((_, c) => {
                                const who = placed.find(p => p.row === r && p.col === c);
                                const isWrong = wrongSeat === `${r}-${c}`;
                                return html`
                                    <button
                                        key=${c}
                                        onClick=${() => handlePick(r, c)}
                                        disabled=${done || !!who}
                                        className=${`
                                            aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all
                                            ${who ? 'bg-green-100 border-green-400' : ''}
                                            ${isWrong ? 'bg-red-100 border-red-400 animate-pulse' : ''}
                                            ${!who && !isWrong ? 'bg-pink-100 border-pink-300 hover:bg-orange-100 hover:border-orange-300 active:scale-90' : ''}
                                        `}
                                    >
                                        <span className="text-lg md:text-2xl leading-none">${who ? who.icon : ''}</span>
                                        <span className="text-[10px] md:text-xs font-black text-slate-500">${seatNo(r, c)}</span>
                                    </button>
                                `;
                            })}
                        </div>
                    `)}
                </div>
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">不是這一個，再數一次</div>
                    <p className="text-red-600 text-sm mt-1">${current.text}</p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">四隻都找到位子了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${steps.map((s, i) => html`
                            <div key=${i}>
                                <div className="flex justify-between items-center">
                                    <span>${s.icon} ${s.name}：</span>
                                    <span className="font-black text-green-700">${seatNo(s.seat.row, s.seat.col)} 號</span>
                                </div>
                                <div className="text-xs text-slate-500">${s.explain}</div>
                            </div>
                        `)}
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再找一次（換位子）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q016',
    type: 'custom',
    title: '【題組】座位：小動物坐在哪一個位子',
    q: '題組（4 小題）：照著前後左右的描述找出座位。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${SeatingGame} />`);
    }
};
