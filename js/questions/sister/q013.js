const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q013 - 走台階：最後站在第幾階？
 * ------------------------------------------------------------------
 * 從第 S 階出發，先往一個方向走 A 階，再往另一個方向走 B 階。
 *   往上 = 階數變大，往下 = 階數變小
 * 過程中不可以走出樓梯（1 ～ N 階）。
 * ------------------------------------------------------------------
 */

const KIDS = ['🧒', '👦', '👧', '🧑'];

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const total = 6 + Math.floor(Math.random() * 3);      // 6~8 階
        const firstDown = Math.random() < 0.5;
        const stepA = 1 + Math.floor(Math.random() * 4);
        const stepB = 1 + Math.floor(Math.random() * 4);
        const start = 1 + Math.floor(Math.random() * total);

        const mid = firstDown ? start - stepA : start + stepA;
        const end = firstDown ? mid + stepB : mid - stepB;

        if (mid < 1 || mid > total) continue;
        if (end < 1 || end > total) continue;
        if (end === start) continue;

        const wrongSet = new Set();
        for (const w of [mid, start, end + 1, end - 1, start + stepA + stepB, start - stepA - stepB]) {
            if (w >= 1 && w <= total && w !== end) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, end].sort(() => Math.random() - 0.5);
        return {
            total, firstDown, stepA, stepB, start, mid, end, options,
            kid: KIDS[Math.floor(Math.random() * KIDS.length)]
        };
    }

    return {
        total: 7, firstDown: true, stepA: 3, stepB: 1, start: 5, mid: 2, end: 3,
        options: [2, 3, 4, 5], kid: '🧒'
    };
}

const VIEW_W = 360, VIEW_H = 230;

const Stairs = ({ total, marks, kid, kidStep }) => {
    const stepW = (VIEW_W - 40) / total;
    const stepH = (VIEW_H - 50) / total;
    const bottom = VIEW_H - 20;
    const left = 20;

    return html`
        <svg viewBox=${`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" role="img">
            ${Array.from({ length: total }).map((_, i) => {
                const n = i + 1;
                const x = left + i * stepW;
                const y = bottom - n * stepH;
                const mark = marks[n];
                return html`
                    <g key=${n}>
                        <rect x=${x} y=${y} width=${stepW} height=${n * stepH}
                            fill=${mark ? mark.fill : '#7dd3fc'} stroke="#0284c7" strokeWidth="1.5" />
                        <rect x=${x} y=${y} width=${stepW} height=${Math.min(stepH, 14)}
                            fill=${mark ? mark.top : '#bae6fd'} stroke="#0284c7" strokeWidth="1.5" />
                        <text x=${x + stepW / 2} y=${y + stepH + 14} textAnchor="middle"
                            fontSize="13" fontWeight="bold" fill="#075985">${n}</text>
                        ${mark && mark.label && html`
                            <text x=${x + stepW / 2} y=${y - 6} textAnchor="middle"
                                fontSize="12" fontWeight="bold" fill=${mark.text}>${mark.label}</text>
                        `}
                    </g>
                `;
            })}
            ${kidStep && html`
                <text x=${left + (kidStep - 0.5) * stepW} y=${bottom - kidStep * stepH - 4}
                    textAnchor="middle" fontSize="26">${kid}</text>
            `}
        </svg>
    `;
};

const StairsGame = () => {
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
        if (opt === problem.end) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">蓋樓梯中...</div>`;

    const { total, firstDown, stepA, stepB, start, mid, end, options, kid } = problem;
    const solved = gameState === 'correct';

    const marks = {};
    marks[start] = { fill: '#fcd34d', top: '#fde68a', label: '出發', text: '#b45309' };
    if (solved) {
        marks[mid] = { fill: '#c4b5fd', top: '#ddd6fe', label: '中間', text: '#6d28d9' };
        marks[end] = { fill: '#86efac', top: '#bbf7d0', label: '最後', text: '#15803d' };
    }

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    走台階
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    小朋友站在第 <span className="text-amber-600">${start}</span> 階，
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    先向<span className="text-blue-600">${firstDown ? '下' : '上'}走 ${stepA} 階</span>，
                    再向<span className="text-blue-600">${firstDown ? '上' : '下'}走 ${stepB} 階</span>。
                </p>
                <p className="mt-2 text-xl md:text-2xl font-bold text-slate-700">最後站在第幾階？</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-100 p-2 mb-5">
                <${Stairs} total=${total} marks=${marks} kid=${kid} kidStep=${solved ? end : start} />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-5">
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
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            ${opt}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再走一次看看</div>
                    <p className="text-red-600 text-sm mt-1">往上走階數會變大，往下走階數會變小。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>出發：</span>
                            <span className="font-black text-amber-600">第 ${start} 階</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>向${firstDown ? '下' : '上'}走 ${stepA} 階：</span>
                            <span className="font-black text-purple-600">
                                ${start} ${firstDown ? '−' : '+'} ${stepA} = ${mid} → 第 ${mid} 階
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>再向${firstDown ? '上' : '下'}走 ${stepB} 階：</span>
                            <span className="font-black text-green-600">
                                ${mid} ${firstDown ? '+' : '−'} ${stepB} = ${end} → 第 ${end} 階
                            </span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">第 ${end} 階</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再走一次（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q013',
    type: 'custom',
    title: '走台階：最後站在第幾階',
    q: '往上走階數變大、往下走階數變小，算出最後站在第幾階。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${StairsGame} />`);
    }
};
