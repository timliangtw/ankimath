const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q024 - 正方形與長方形重疊：哪一個敘述正確？
 * ------------------------------------------------------------------
 * 一個正方形和一個長方形部分重疊，圖上散布若干黑點。
 * 每個點屬於四個區域之一：
 *   sq   = 只在正方形內
 *   rc   = 只在長方形內
 *   both = 同時在兩個圖形內（重疊區）
 *   out  = 兩個圖形外面
 * 四個敘述各對應一個區域，只有一個敘述的數字是正確的。
 * ------------------------------------------------------------------
 */

const W = 340, H = 230;
const SQ = { x1: 25, y1: 65, x2: 165, y2: 205 };   // 正方形 140 × 140
const RC = { x1: 115, y1: 20, x2: 320, y2: 145 };  // 長方形 205 × 125
const EDGE_GAP = 12;   // 點要離邊線這麼遠，避免「在線上」的爭議
const MIN_DIST = 20;   // 點跟點的最小距離

function classify(p) {
    const inSq = p.x > SQ.x1 && p.x < SQ.x2 && p.y > SQ.y1 && p.y < SQ.y2;
    const inRc = p.x > RC.x1 && p.x < RC.x2 && p.y > RC.y1 && p.y < RC.y2;
    if (inSq && inRc) return 'both';
    if (inSq) return 'sq';
    if (inRc) return 'rc';
    return 'out';
}

function tooCloseToEdges(p) {
    for (const r of [SQ, RC]) {
        if (Math.abs(p.x - r.x1) < EDGE_GAP || Math.abs(p.x - r.x2) < EDGE_GAP) return true;
        if (Math.abs(p.y - r.y1) < EDGE_GAP || Math.abs(p.y - r.y2) < EDGE_GAP) return true;
    }
    return false;
}

function collectPoints(target) {
    const pts = [];
    const counts = { sq: 0, rc: 0, both: 0, out: 0 };
    let guard = 0;

    while (guard++ < 8000) {
        if (['sq', 'rc', 'both', 'out'].every(k => counts[k] >= target[k])) return pts;

        const p = { x: 16 + Math.random() * (W - 32), y: 16 + Math.random() * (H - 32) };
        if (tooCloseToEdges(p)) continue;

        const zone = classify(p);
        if (counts[zone] >= target[zone]) continue;
        if (pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < MIN_DIST)) continue;

        pts.push({ x: p.x, y: p.y, zone });
        counts[zone]++;
    }
    return null;
}

function wrongValue(correct) {
    const pool = [correct - 2, correct - 1, correct + 1, correct + 2].filter(v => v > 0 && v !== correct);
    return pool[Math.floor(Math.random() * pool.length)];
}

function generateProblem() {
    for (let attempt = 0; attempt < 60; attempt++) {
        const target = {
            sq: 2 + Math.floor(Math.random() * 3),
            rc: 2 + Math.floor(Math.random() * 3),
            both: 2 + Math.floor(Math.random() * 3),
            out: 1 + Math.floor(Math.random() * 3)
        };

        const pts = collectPoints(target);
        if (!pts) continue;

        const zoneCount = { sq: 0, rc: 0, both: 0, out: 0 };
        pts.forEach(p => zoneCount[p.zone]++);

        const truth = {
            sq: zoneCount.sq + zoneCount.both,   // 正方形內部（含重疊部分）
            rc: zoneCount.rc + zoneCount.both,   // 長方形內部（含重疊部分）
            both: zoneCount.both,
            out: zoneCount.out
        };

        const specs = [
            { key: 'sq', text: (v) => `正方形內部有 ${v} 個 ●` },
            { key: 'rc', text: (v) => `長方形內部有 ${v} 個 ●` },
            { key: 'both', text: (v) => `同時在正方形又在長方形內部有 ${v} 個 ●` },
            { key: 'out', text: (v) => `在正方形和長方形外面有 ${v} 個 ●` }
        ];

        const rightIdx = Math.floor(Math.random() * specs.length);
        const options = specs.map((s, i) => {
            const value = i === rightIdx ? truth[s.key] : wrongValue(truth[s.key]);
            return { key: s.key, value, text: s.text(value), isRight: i === rightIdx };
        });

        return { pts, zoneCount, truth, options };
    }

    return null;
}

const OverlapDotsProblem = () => {
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
        if (problem.options[idx].isRight) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { pts, zoneCount, truth, options } = problem;
    const showZoneColor = gameState === 'correct';

    const dotColor = (zone) => {
        if (!showZoneColor) return '#334155';
        if (zone === 'both') return '#16a34a';
        if (zone === 'sq') return '#d97706';
        if (zone === 'rc') return '#2563eb';
        return '#94a3b8';
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題目 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    圖形與位置
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面的敘述哪一個正確？
                </h1>
            </div>

            <!-- 圖 -->
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-3 mb-6">
                <svg viewBox=${`0 0 ${W} ${H}`} className="w-full h-auto" role="img">
                    <rect x=${SQ.x1} y=${SQ.y1} width=${SQ.x2 - SQ.x1} height=${SQ.y2 - SQ.y1}
                        fill="none" stroke="#475569" strokeWidth="2" />
                    <rect x=${RC.x1} y=${RC.y1} width=${RC.x2 - RC.x1} height=${RC.y2 - RC.y1}
                        fill="none" stroke="#475569" strokeWidth="2" />
                    ${pts.map((p, i) => html`
                        <circle key=${i} cx=${p.x} cy=${p.y} r="7" fill=${dotColor(p.zone)} />
                    `)}
                </svg>
            </div>

            <!-- 四個選項 -->
            <div className="grid grid-cols-1 gap-3 mb-6">
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
                                px-4 py-3 rounded-2xl text-base md:text-lg font-bold text-left transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.text}
                        </button>
                    `;
                })}
            </div>

            <!-- 回饋區 -->
            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        重疊的地方，那些點同時算在正方形裡面，也算在長方形裡面喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span><span className="text-amber-600">●</span> 只在正方形裡：</span>
                            <span className="font-black text-amber-600">${zoneCount.sq} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span><span className="text-blue-600">●</span> 只在長方形裡：</span>
                            <span className="font-black text-blue-600">${zoneCount.rc} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span><span className="text-green-600">●</span> 兩個都在（重疊）：</span>
                            <span className="font-black text-green-600">${zoneCount.both} 個</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span><span className="text-slate-400">●</span> 兩個都不在：</span>
                            <span className="font-black text-slate-500">${zoneCount.out} 個</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-sm text-slate-500">
                            所以正方形內部一共 ${zoneCount.sq} + ${zoneCount.both} = ${truth.sq} 個，
                            長方形內部一共 ${zoneCount.rc} + ${zoneCount.both} = ${truth.rc} 個。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">正確的敘述：</span>
                            <span className="font-black text-green-700 text-right">${options.find(o => o.isRight).text} ✓</span>
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
    id: 'q024',
    type: 'custom',
    title: '正方形與長方形重疊：哪個敘述正確？',
    q: '圖形與位置：數重疊區域的點（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OverlapDotsProblem} />`);
    }
};
