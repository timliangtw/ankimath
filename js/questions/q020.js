const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function generateProblem() {
    const possibleTargets = [5, 6, 7, 8];
    const targetN = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
    const oddOffset = Math.random() < 0.5 ? 1 : 2;
    const oddDir = Math.random() < 0.5 ? 1 : -1;
    const oddN = Math.max(3, Math.min(12, targetN + oddOffset * oddDir));

    function makeGrid(total) {
        if (total < 3 || total > 12) return null;
        for (let attempt = 0; attempt < 300; attempt++) {
            const flat = [0, 0, 0, 0, 0, 0];
            const numCells = Math.min(total, Math.max(3, Math.floor(Math.random() * 3) + 3));
            const indices = [0, 1, 2, 3, 4, 5];
            for (let i = 5; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const used = indices.slice(0, Math.min(numCells, total));
            let remaining = total;
            for (const i of used) { flat[i] = 1; remaining--; }
            if (remaining < 0) continue;
            let tries = 0;
            while (remaining > 0 && tries < 300) {
                const i = used[Math.floor(Math.random() * used.length)];
                if (flat[i] < 3) { flat[i]++; remaining--; }
                tries++;
            }
            if (remaining === 0) return [[flat[0], flat[1], flat[2]], [flat[3], flat[4], flat[5]]];
        }
        return null;
    }

    for (let attempt = 0; attempt < 50; attempt++) {
        const g1 = makeGrid(targetN);
        const g2 = makeGrid(targetN);
        const g3 = makeGrid(targetN);
        const gOdd = makeGrid(oddN);
        if (!g1 || !g2 || !g3 || !gOdd) continue;
        const oddPos = Math.floor(Math.random() * 4);
        const grids = [g1, g2, g3];
        grids.splice(oddPos, 0, gOdd);
        return { targetN, oddN, oddPos, grids };
    }

    return {
        targetN: 6, oddN: 7, oddPos: 3,
        grids: [
            [[1, 2, 1], [1, 0, 1]],
            [[2, 1, 1], [1, 1, 0]],
            [[1, 1, 2], [0, 1, 1]],
            [[2, 2, 1], [1, 0, 1]],
        ],
    };
}

const BlockCountProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (idx === problem.oddPos) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { targetN, oddN, oddPos, grids } = problem;
    const labels = ['甲', '乙', '丙', '丁'];

    const cellStyle = (height) => ({
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '800',
        fontSize: '15px',
        border: '2px solid',
        background: height === 0 ? '#f1f5f9'
                  : height === 1 ? '#fef3c7'
                  : height === 2 ? '#fbbf24'
                  : '#d97706',
        borderColor: height === 0 ? '#e2e8f0'
                   : height === 1 ? '#fcd34d'
                   : height === 2 ? '#d97706'
                   : '#92400e',
        color: height === 0 ? 'transparent'
             : height === 1 ? '#92400e'
             : '#ffffff',
    });

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-5">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    立體積木計數
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面哪一個形體<span className="text-red-500">不是</span>用
                    <span className="text-amber-600"> ${targetN} 塊</span>積木堆成的？
                </h1>
                <p className="text-sm text-slate-500 mt-1">（從正上方往下看，數字代表該位置疊了幾塊積木）</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                ${grids.map((grid, idx) => {
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
                                rounded-2xl p-4 border-2 transition-all shadow-sm
                                ${isCorrect  ? 'bg-green-50 border-green-400 scale-105' : ''}
                                ${isWrong    ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50 cursor-pointer active:scale-95' : ''}
                            `}
                        >
                            <div className="text-center font-black text-slate-600 mb-3 text-lg">（${labels[idx]}）</div>
                            <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '132px', margin: '0 auto' }}>
                                ${grid.flat().map((height, i) => html`
                                    <div key=${i} style=${cellStyle(height)}>
                                        ${height > 0 ? height : ''}
                                    </div>
                                `)}
                            </div>
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再算算看！</div>
                    <p className="text-red-600 text-sm">把每個格子裡的數字全部加起來，就是積木的總數喔。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-4">🎉 答對了！</div>
                    <button
                        onClick=${newProblem}
                        className="px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q020',
    type: 'custom',
    title: '積木數量：哪個形體不是 N 塊？',
    q: '立體積木計數（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${BlockCountProblem} />`);
    }
};
