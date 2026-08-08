const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q029 - 哪一個圖形的面積與其他不一樣？
 * ------------------------------------------------------------------
 * 在方格紙上畫出甲、乙、丙、丁四個圖形，
 * 其中三個佔的格子數相同，一個不同 → 找出不一樣的那一個。
 * ------------------------------------------------------------------
 */

const LABELS = ['甲', '乙', '丙', '丁'];
const COLS = 4, ROWS = 4, CELL = 24, PAD = 4;

function growShape(size, cols, rows) {
    const key = (c, r) => `${c},${r}`;
    const cells = [];
    const used = new Set();
    const start = { c: Math.floor(Math.random() * cols), r: Math.floor(Math.random() * rows) };
    cells.push(start);
    used.add(key(start.c, start.r));

    let guard = 0;
    while (cells.length < size && guard++ < 3000) {
        const base = cells[Math.floor(Math.random() * cells.length)];
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        const d = dirs[Math.floor(Math.random() * 4)];
        const nc = base.c + d[0];
        const nr = base.r + d[1];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        if (used.has(key(nc, nr))) continue;
        cells.push({ c: nc, r: nr });
        used.add(key(nc, nr));
    }
    return cells.length === size ? cells : null;
}

function shapeKey(cells) {
    const minC = Math.min(...cells.map(c => c.c));
    const minR = Math.min(...cells.map(c => c.r));
    return cells.map(c => `${c.c - minC},${c.r - minR}`).sort().join('|');
}

function generateProblem() {
    for (let attempt = 0; attempt < 100; attempt++) {
        const same = 4 + Math.floor(Math.random() * 4);              // 三個一樣的面積 4~7
        const diff = same + (Math.random() < 0.5 ? -1 : 1);          // 不一樣的那個 ±1
        if (diff < 3 || diff > 8) continue;

        const oddIdx = Math.floor(Math.random() * 4);
        const shapes = [];
        const seen = new Set();
        let ok = true;

        for (let i = 0; i < 4; i++) {
            const size = i === oddIdx ? diff : same;
            let cells = null;
            for (let t = 0; t < 40 && !cells; t++) {
                const cand = growShape(size, COLS, ROWS);
                if (!cand) continue;
                const k = shapeKey(cand);
                if (seen.has(k)) continue;
                seen.add(k);
                cells = cand;
            }
            if (!cells) { ok = false; break; }
            shapes.push({ label: LABELS[i], cells, size });
        }

        if (!ok) continue;
        return { shapes, oddIdx, same, diff };
    }
    return null;
}

const OddAreaProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing'); // playing | correct | wrong

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
        if (idx === problem.oddIdx) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { shapes, oddIdx, same, diff } = problem;
    const boardW = COLS * CELL + PAD * 2;
    const boardH = ROWS * CELL + PAD * 2;
    const revealed = gameState === 'correct';

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    面積
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面哪一個圖形的<span className="text-amber-600">面積</span>與其他不一樣？
                </h1>
            </div>

            <!-- 四個圖形 -->
            <div className="grid grid-cols-2 gap-3 mb-6">
                ${shapes.map((s, i) => html`
                    <div key=${i} className="bg-white rounded-2xl border-2 border-slate-100 p-2 flex flex-col items-center">
                        <div className="font-black text-slate-600 mb-1">${s.label}</div>
                        <svg viewBox=${`0 0 ${boardW} ${boardH}`} className="w-full h-auto max-w-[160px]" role="img">
                            ${Array.from({ length: ROWS }).map((_, r) =>
                                Array.from({ length: COLS }).map((_, c) => html`
                                    <rect key=${`g${r}-${c}`} x=${PAD + c * CELL} y=${PAD + r * CELL}
                                        width=${CELL} height=${CELL}
                                        fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                `)
                            )}
                            ${s.cells.map((cell, k) => html`
                                <rect key=${`f${k}`} x=${PAD + cell.c * CELL} y=${PAD + cell.r * CELL}
                                    width=${CELL} height=${CELL}
                                    fill=${revealed && i === oddIdx ? '#4ade80' : '#94a3b8'}
                                    stroke="#475569" strokeWidth="1" />
                            `)}
                        </svg>
                        ${revealed && html`
                            <div className=${`mt-1 text-sm font-bold ${i === oddIdx ? 'text-green-600' : 'text-slate-500'}`}>
                                ${s.size} 格
                            </div>
                        `}
                    </div>
                `)}
            </div>

            <!-- 四個選項 -->
            <div className="grid grid-cols-2 gap-3 mb-6">
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
                            (${idx + 1}) ${s.label}
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        一格一格慢慢數，形狀不一樣不代表面積不一樣喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${shapes.map((s, i) => html`
                            <div key=${i} className="flex justify-between items-center">
                                <span>${s.label} 佔的格子：</span>
                                <span className=${`font-black ${i === oddIdx ? 'text-green-600' : 'text-slate-600'}`}>
                                    ${s.size} 格${i === oddIdx ? '（不一樣）' : ''}
                                </span>
                            </div>
                        `)}
                        <div className="text-sm text-slate-500 pt-1">
                            其他三個都是 ${same} 格，只有一個是 ${diff} 格。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${shapes[oddIdx].label} ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換圖形）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q029',
    type: 'custom',
    title: '哪個圖形的面積不一樣？',
    q: '面積比較：數方格（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OddAreaProblem} />`);
    }
};
