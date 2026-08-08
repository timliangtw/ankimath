const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q022 - 小熊的冰淇淋：算術迷宮
 * ------------------------------------------------------------------
 * 4×4 的格子，每格一個算式。只能踩「答案剛好等於目標數」的格子，
 * 從左上角一路走到右下角（只能往右或往下）。
 * 出題時先隨機決定一條路徑，路徑上的算式答案 = 目標數，
 * 其他格子的答案一定不等於目標數，所以路只有一條。
 * ------------------------------------------------------------------
 */

const SIZE = 4;

function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

// 隨機做一個答案 = value 的算式
function makeExpr(value) {
    if (Math.random() < 0.5 && value < 10) {
        const a = randInt(1, value - 1);
        return { text: `${a} + ${value - a}`, value };
    }
    const a = randInt(value + 1, Math.min(18, value + 9));
    return { text: `${a} − ${a - value}`, value };
}

// 隨機做一個答案不等於 avoid 的算式
function makeOtherExpr(avoid) {
    for (let i = 0; i < 50; i++) {
        const v = randInt(1, 12);
        if (v !== avoid) return makeExpr(v);
    }
    return makeExpr(avoid === 1 ? 2 : 1);
}

function generateProblem() {
    const target = randInt(5, 9);

    // 隨機走一條只往右／往下的路徑
    const path = [{ r: 0, c: 0 }];
    let r = 0, c = 0;
    while (r < SIZE - 1 || c < SIZE - 1) {
        const canDown = r < SIZE - 1;
        const canRight = c < SIZE - 1;
        const goDown = canDown && (!canRight || Math.random() < 0.5);
        if (goDown) r++; else c++;
        path.push({ r, c });
    }
    const onPath = new Set(path.map(p => `${p.r}-${p.c}`));

    const grid = [];
    for (let row = 0; row < SIZE; row++) {
        const line = [];
        for (let col = 0; col < SIZE; col++) {
            line.push(onPath.has(`${row}-${col}`) ? makeExpr(target) : makeOtherExpr(target));
        }
        grid.push(line);
    }

    return { target, grid, path };
}

const MazeGame = () => {
    const [problem, setProblem] = useState(null);
    const [walked, setWalked] = useState([{ r: 0, c: 0 }]);
    const [wrongCell, setWrongCell] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setWalked([{ r: 0, c: 0 }]);
        setWrongCell(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (r, c) => {
        if (gameState === 'correct') return;
        const here = walked[walked.length - 1];
        const isNeighbour = Math.abs(here.r - r) + Math.abs(here.c - c) === 1;
        const already = walked.some(w => w.r === r && w.c === c);
        const cell = problem.grid[r][c];

        if (isNeighbour && !already && cell.value === problem.target) {
            const next = [...walked, { r, c }];
            setWalked(next);
            setWrongCell(null);
            setGameState(r === SIZE - 1 && c === SIZE - 1 ? 'correct' : 'playing');
        } else {
            setWrongCell(`${r}-${c}`);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">蓋迷宮中...</div>`;

    const { target, grid, path } = problem;
    const done = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    小熊的冰淇淋
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    只能踩答案是 <span className="text-amber-600">${target}</span> 的格子，
                </h1>
                <p className="text-lg md:text-xl font-bold text-slate-700">
                    從 🐻 一路走到 🍦（一次走一格，上下左右都可以）
                </p>
            </div>

            <div className="bg-pink-100 border-2 border-pink-300 rounded-2xl p-2 mb-5">
                <div className="grid grid-cols-4 gap-1">
                    ${grid.map((line, r) => line.map((cell, c) => {
                        const isWalked = walked.some(w => w.r === r && w.c === c);
                        const isStart = r === 0 && c === 0;
                        const isEnd = r === SIZE - 1 && c === SIZE - 1;
                        const isBad = wrongCell === `${r}-${c}`;
                        return html`
                            <button
                                key=${`${r}-${c}`}
                                onClick=${() => handlePick(r, c)}
                                disabled=${done}
                                className=${`
                                    aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all
                                    ${isWalked ? 'bg-green-200 border-green-500' : ''}
                                    ${isBad ? 'bg-red-100 border-red-400 animate-pulse' : ''}
                                    ${!isWalked && !isBad ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-90' : ''}
                                `}
                            >
                                <span className="text-sm md:text-lg font-black text-slate-700">${cell.text}</span>
                                ${isStart && html`<span className="text-lg leading-none">🐻</span>`}
                                ${isEnd && html`<span className="text-lg leading-none">🍦</span>`}
                            </button>
                        `;
                    }))}
                </div>
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">這一格不能走</div>
                    <p className="text-red-600 text-sm mt-1">
                        只能走到旁邊（上下左右）而且答案剛好是 ${target} 的格子。
                    </p>
                </div>
            `}

            ${done && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">小熊吃到冰淇淋了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-1 border border-green-100">
                        <div className="text-sm text-slate-500 mb-1">走過的每一格答案都是 ${target}：</div>
                        ${path.map((p, i) => html`
                            <div key=${i} className="flex justify-between items-center text-sm">
                                <span>第 ${i + 1} 格：</span>
                                <span className="font-black text-green-700">${grid[p.r][p.c].text} = ${target}</span>
                            </div>
                        `)}
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再走一次（換迷宮）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q022',
    type: 'custom',
    title: '小熊的冰淇淋：算術迷宮',
    q: '只踩答案等於目標數的格子，一路走到終點。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MazeGame} />`);
    }
};
