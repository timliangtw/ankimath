const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q045 - 天平：哪一個圖是對的？
 * ------------------------------------------------------------------
 * 先給兩個平衡的天平當線索，換算出六邊形和圓形各等於幾個正方形，
 * 再判斷四個天平圖裡，哪一個的傾斜方向畫得正確。
 *   左邊比較重 → 左邊往下沉；一樣重 → 平平的。
 * ------------------------------------------------------------------
 */

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

// 隨機生一側的物件組合，回傳 { hex, cir, sq }
function randomSide() {
    for (let i = 0; i < 50; i++) {
        const hex = Math.floor(Math.random() * 2);
        const cir = Math.floor(Math.random() * 3);
        const sq = Math.floor(Math.random() * 5);
        if (hex + cir + sq >= 1 && hex + cir + sq <= 4) return { hex, cir, sq };
    }
    return { hex: 0, cir: 0, sq: 1 };
}

function weight(side, hexW, cirW) {
    return side.hex * hexW + side.cir * cirW + side.sq;
}

function tiltOf(left, right, hexW, cirW) {
    const l = weight(left, hexW, cirW);
    const r = weight(right, hexW, cirW);
    if (l === r) return 'balance';
    return l > r ? 'left' : 'right';
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const hexW = 3 + Math.floor(Math.random() * 3);   // 六邊形 = 3~5 個正方形
        const cirW = 2 + Math.floor(Math.random() * 2);   // 圓形 = 2~3 個正方形
        if (hexW === cirW) continue;

        const cands = [];
        for (let i = 0; i < 80 && cands.length < 8; i++) {
            const left = randomSide();
            const right = randomSide();
            const real = tiltOf(left, right, hexW, cirW);
            cands.push({ left, right, real });
        }

        // 正確選項：畫的方向 = 真實方向
        const rightOne = cands.find(c => c.real !== 'balance');
        if (!rightOne) continue;

        // 錯誤選項：畫的方向 ≠ 真實方向
        const wrongs = [];
        for (const c of cands) {
            if (c === rightOne) continue;
            const shownPool = ['left', 'right', 'balance'].filter(t => t !== c.real);
            const shown = shownPool[Math.floor(Math.random() * shownPool.length)];
            wrongs.push({ ...c, shown });
            if (wrongs.length >= 3) break;
        }
        if (wrongs.length < 3) continue;

        const options = shuffle([
            { ...rightOne, shown: rightOne.real, isRight: true },
            ...wrongs.map(w => ({ ...w, isRight: false }))
        ]);

        return { hexW, cirW, options };
    }
    return null;
}

const Piece = ({ kind, x, y }) => {
    if (kind === 'hex') {
        const pts = [[0, -11], [10, -5.5], [10, 5.5], [0, 11], [-10, 5.5], [-10, -5.5]]
            .map(p => `${x + p[0]},${y + p[1]}`).join(' ');
        return html`<polygon points=${pts} fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />`;
    }
    if (kind === 'cir') {
        return html`<circle cx=${x} cy=${y} r="10" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />`;
    }
    return html`<rect x=${x - 9} y=${y - 9} width="18" height="18" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />`;
};

const Scale = ({ left, right, shown }) => {
    const pieces = (side) => [
        ...Array.from({ length: side.hex }, () => 'hex'),
        ...Array.from({ length: side.cir }, () => 'cir'),
        ...Array.from({ length: side.sq }, () => 'sq')
    ];
    const dy = shown === 'left' ? 12 : shown === 'right' ? -12 : 0;

    const sideGroup = (side, cx, offset) => {
        const list = pieces(side);
        const startX = cx - (list.length - 1) * 12;
        return list.map((kind, i) => html`
            <${Piece} key=${i} kind=${kind} x=${startX + i * 24} y=${58 + offset - 14} />
        `);
    };

    return html`
        <svg viewBox="0 0 240 110" className="w-full h-auto">
            <line x1="20" y1=${58 + dy} x2="220" y2=${58 - dy} stroke="#475569" strokeWidth="6" strokeLinecap="round" />
            ${sideGroup(left, 66, dy)}
            ${sideGroup(right, 174, -dy)}
            <polygon points="120,58 104,92 136,92" fill="#1e293b" />
        </svg>
    `;
};

const BalanceProblem = () => {
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
        if (problem.options[idx].isRight) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { hexW, cirW, options } = problem;
    const rightIdx = options.findIndex(o => o.isRight);
    const desc = (side) => {
        const parts = [];
        if (side.hex) parts.push(`${side.hex} 個六邊形`);
        if (side.cir) parts.push(`${side.cir} 個圓形`);
        if (side.sq) parts.push(`${side.sq} 個正方形`);
        return parts.join(' + ');
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    天平推理
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800">
                    先看看這兩個平平的天平：
                </h1>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-5 grid grid-cols-2 gap-2">
                <div className="bg-white rounded-xl border border-amber-200 p-1">
                    <${Scale} left=${{ hex: 1, cir: 0, sq: 0 }} right=${{ hex: 0, cir: 0, sq: hexW }} shown="balance" />
                </div>
                <div className="bg-white rounded-xl border border-amber-200 p-1">
                    <${Scale} left=${{ hex: 0, cir: 1, sq: 0 }} right=${{ hex: 0, cir: 0, sq: cirW }} shown="balance" />
                </div>
            </div>

            <p className="text-center text-xl md:text-2xl font-bold text-slate-700 mb-4">
                下面哪一個天平圖是<span className="text-amber-600">對的</span>？
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${options.map((opt, idx) => {
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
                                rounded-2xl border-b-4 p-1 transition-all shadow-sm
                                ${isCorrect  ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isWrong    ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <div className="text-sm font-black text-slate-500">(${idx + 1})</div>
                            <${Scale} left=${opt.left} right=${opt.right} shown=${opt.shown} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        先把每一邊都換算成「幾個正方形」，再看看哪一邊比較重。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>1 個六邊形 =</span>
                            <span className="font-black text-amber-600">${hexW} 個正方形</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>1 個圓形 =</span>
                            <span className="font-black text-amber-600">${cirW} 個正方形</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 space-y-1">
                            ${options.map((o, i) => {
                                const l = o.left.hex * hexW + o.left.cir * cirW + o.left.sq;
                                const r = o.right.hex * hexW + o.right.cir * cirW + o.right.sq;
                                const realText = l === r ? '一樣重' : (l > r ? '左邊比較重' : '右邊比較重');
                                return html`
                                    <div key=${i} className=${`flex justify-between items-center text-sm ${o.isRight ? 'font-black text-green-700' : 'text-slate-500'}`}>
                                        <span>(${i + 1}) ${desc(o.left)} ↔ ${desc(o.right)}</span>
                                        <span>${l} : ${r}，${realText}${o.isRight ? ' ✓' : ''}</span>
                                    </div>
                                `;
                            })}
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">(${rightIdx + 1}) ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換圖）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q045',
    type: 'custom',
    title: '天平：哪一個圖畫對了？',
    q: '天平推理：換算後比較輕重（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${BalanceProblem} />`);
    }
};
