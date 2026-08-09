const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q041 - 哪一個形體用的積木最少？
 * ------------------------------------------------------------------
 * 四個形體都是用同樣的小正方體積木堆出來的，
 * 用「每一格疊幾層」的方式隨機產生，再用等角投影畫出來。
 * 積木總數 = 每一格的層數全部加起來。
 * ------------------------------------------------------------------
 */

const GRID = 3;          // 3 × 3 的底面
const CW = 26, CH = 15, CD = 20;   // 立方體的寬、菱形高、垂直高
const OX = 40, OY = 62;

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function randomShape() {
    const heights = [];
    for (let r = 0; r < GRID; r++) {
        const row = [];
        for (let c = 0; c < GRID; c++) row.push(Math.floor(Math.random() * 4));
        heights.push(row);
    }
    return heights;
}

function totalCubes(heights) {
    return heights.reduce((sum, row) => sum + row.reduce((s, h) => s + h, 0), 0);
}

function filledCells(heights) {
    return heights.reduce((sum, row) => sum + row.filter(h => h > 0).length, 0);
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const shapes = [];
        const seenTotals = new Set();
        let ok = true;

        for (let i = 0; i < 4; i++) {
            let shape = null;
            for (let t = 0; t < 60 && !shape; t++) {
                const cand = randomShape();
                const n = totalCubes(cand);
                if (n < 6 || n > 16) continue;
                if (filledCells(cand) < 5) continue;
                if (seenTotals.has(n)) continue;
                seenTotals.add(n);
                shape = cand;
            }
            if (!shape) { ok = false; break; }
            shapes.push({ heights: shape, total: totalCubes(shape) });
        }
        if (!ok) continue;

        const minTotal = Math.min(...shapes.map(s => s.total));
        const answerIdx = shapes.findIndex(s => s.total === minTotal);
        return { shapes, answerIdx, minTotal };
    }
    return null;
}

const IsoShape = ({ heights }) => {
    const cubes = [];
    for (let r = 0; r < GRID; r++) {
        for (let c = 0; c < GRID; c++) {
            for (let level = 0; level < heights[r][c]; level++) {
                cubes.push({ r, c, level });
            }
        }
    }
    // 畫家演算法：先畫遠的（r+c 小），同一格由下往上
    cubes.sort((a, b) => (a.r + a.c) - (b.r + b.c) || a.level - b.level);

    return html`
        <svg viewBox="0 0 120 132" className="w-full h-auto">
            ${cubes.map((cube, i) => {
                const px = OX + (cube.c - cube.r) * (CW / 2);
                const py = OY + (cube.c + cube.r) * (CH / 2) - cube.level * CD;
                const top = `${px},${py} ${px + CW / 2},${py - CH / 2} ${px + CW},${py} ${px + CW / 2},${py + CH / 2}`;
                const left = `${px},${py} ${px},${py + CD} ${px + CW / 2},${py + CD + CH / 2} ${px + CW / 2},${py + CH / 2}`;
                const right = `${px + CW},${py} ${px + CW},${py + CD} ${px + CW / 2},${py + CD + CH / 2} ${px + CW / 2},${py + CH / 2}`;
                return html`
                    <g key=${i}>
                        <polygon points=${left} fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                        <polygon points=${right} fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                        <polygon points=${top} fill="#f1f5f9" stroke="#475569" strokeWidth="1" />
                    </g>
                `;
            })}
        </svg>
    `;
};

const FewestCubesProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        let p = null;
        for (let i = 0; i < 5 && !p; i++) p = generateProblem();
        setProblem(p);
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (idx === problem.answerIdx) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { shapes, answerIdx, minTotal } = problem;
    const solved = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    立體圖形
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面的形體都是用同樣的小積木堆出來的，
                </h1>
                <p className="text-lg md:text-xl font-bold text-slate-700">
                    哪一個用的積木個數<span className="text-amber-600 underline">最少</span>？
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${shapes.map((s, i) => html`
                    <div key=${i} className=${`rounded-2xl border-2 p-2 ${solved && i === answerIdx ? 'border-green-400 bg-green-50' : 'border-slate-100 bg-white'}`}>
                        <div className="text-center font-black text-slate-500 text-sm">(${i + 1})</div>
                        <${IsoShape} heights=${s.heights} />
                        ${solved && html`
                            <div className=${`text-center text-sm font-black ${i === answerIdx ? 'text-green-600' : 'text-slate-500'}`}>
                                ${s.total} 個
                            </div>
                        `}
                    </div>
                `)}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
                ${shapes.map((s, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(idx)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1})
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        一疊一疊數：每一直行疊了幾個？後面被擋住的也要算進去。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${shapes.map((s, i) => html`
                            <div key=${i} className="flex justify-between items-center">
                                <span>(${i + 1}) 每一疊：</span>
                                <span className=${`font-black ${i === answerIdx ? 'text-green-600' : 'text-slate-600'}`}>
                                    ${s.heights.flat().filter(h => h > 0).join(' + ')} = ${s.total} 個
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">用最少積木的是：</span>
                            <span className="font-black text-green-700 text-xl">(${answerIdx + 1})，只用 ${minTotal} 個 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換形體）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q041',
    type: 'custom',
    title: '哪一個形體用的積木最少？',
    q: '立體圖形：數出每個形體用了幾個積木（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${FewestCubesProblem} />`);
    }
};
