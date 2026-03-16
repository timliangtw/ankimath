const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 空間結構推理：三合一挑戰 (Anki 版)
 * ------------------------------------------------------------------
 */

// 基礎圖形資料庫
const PIECES_LIB = {
    'A': { id: 'A', name: 'T形', cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: '#ef4444' },
    'B': { id: 'B', name: '長條', cells: [[0, 0], [1, 0], [2, 0], [3, 0]], color: '#3b82f6' },
    'C': { id: 'C', name: '田字', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#f59e0b' },
    'D': { id: 'D', name: 'L-3', cells: [[0, 0], [0, 1], [1, 1]], color: '#10b981' },
    'E': { id: 'E', name: 'L-4', cells: [[0, 0], [0, 1], [0, 2], [1, 2]], color: '#8b5cf6' }
};

// 校準過的題庫 (確保不重疊且邏輯同步)
const CALIBRATED_PROBLEMS = [
    {
        id: 1,
        layout: [
            { id: 'B', color: '#3b82f6', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
            { id: 'C', color: '#f59e0b', cells: [[0, 1], [1, 1], [0, 2], [1, 2]] },
            { id: 'D', color: '#10b981', cells: [[2, 1], [3, 1], [3, 2]] }
        ],
        given: [0, 1], answerId: 'D',
        text: "目標影子上方是長條 B，左下是田字 C。右下角剩下一個 3 格的 L 形空隙，答案就是 圖卡 D。"
    },
    {
        id: 2,
        layout: [
            { id: 'A', color: '#ef4444', cells: [[1, 1], [2, 1], [3, 1], [2, 2]] },
            { id: 'B', color: '#3b82f6', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
            { id: 'E', color: '#8b5cf6', cells: [[0, 1], [0, 2], [0, 3], [1, 3]] }
        ],
        given: [0, 1], answerId: 'E',
        text: "影子左方剩下一個長長的轉角空間，格數為 4 格。比對形狀，只有 圖卡 E 旋轉後可以填滿它！"
    },
    {
        id: 3,
        layout: [
            { id: 'B', color: '#3b82f6', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
            { id: 'C', color: '#f59e0b', cells: [[1, 0], [2, 0], [1, 1], [2, 1]] },
            { id: 'A', color: '#ef4444', cells: [[1, 2], [2, 2], [3, 2], [2, 3]] }
        ],
        given: [0, 1], answerId: 'A',
        text: "左側是直長條 B，右上是田字 C。剩下的缺口是一個 T 字形，所以答案是 圖卡 A。"
    }
];

const MyQuestionComponent = () => {
    // --- 1. 狀態管理 (State) ---
    const [problem, setProblem] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null
    const [selectedId, setSelectedId] = useState(null);

    // 初始化：隨機選一題
    useEffect(() => {
        const randomProb = CALIBRATED_PROBLEMS[Math.floor(Math.random() * CALIBRATED_PROBLEMS.length)];
        setProblem(randomProb);
    }, []);

    if (!problem) return html`<div>載入中...</div>`;

    // --- 2. 輔助繪圖組件 ---
    const ShapeSVG = ({ cells, color, size = 30, mystery = false, normalized = true }) => {
        if (!cells) return null;

        let displayCells = cells;
        if (normalized) {
            const minX = Math.min(...cells.map(c => c[0]));
            const minY = Math.min(...cells.map(c => c[1]));
            displayCells = cells.map(c => [c[0] - minX, c[1] - minY]);
        }

        const maxX = Math.max(...displayCells.map(c => c[0])) + 1;
        const maxY = Math.max(...displayCells.map(c => c[1])) + 1;

        return html`
            <svg width=${maxX * size} height=${maxY * size} viewBox=${`0 0 ${maxX * size} ${maxY * size}`}>
                ${displayCells.map(c => html`
                    <rect 
                        key=${`${c[0]}-${c[1]}`}
                        x=${c[0] * size} 
                        y=${c[1] * size} 
                        width=${size} 
                        height=${size} 
                        fill=${mystery ? '#334155' : color} 
                        rx="4"
                        style=${{ stroke: 'white', strokeWidth: mystery ? '1px' : '2px', opacity: mystery ? 1 : 0.9 }}
                    />
                `)}
            </svg>
        `;
    };

    // --- 3. 邏輯處理 ---
    const handleSelect = (id) => {
        if (feedback === 'correct') return;
        setSelectedId(id);
        if (id === problem.answerId) {
            setFeedback('correct');
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();}
    };

    const allMysteryCells = problem.layout.flatMap(p => p.cells);

    // --- 4. 畫面渲染 ---
    return html`
        <!-- ⚠️ DO NOT MODIFY START -->
        <div className="w-full font-sans text-left mx-auto">
        <!-- ⚠️ DO NOT MODIFY END -->

            <!-- 題目影子區 -->
            <div className="bg-slate-800 rounded-3xl p-6 border-4 border-slate-700 relative mb-6 shadow-xl">
                <span className="absolute -top-3 -left-3 bg-indigo-500 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-2">
                    目標影子
                </span>
                <div className="flex justify-center items-center min-h-[180px] mt-4">
                    <${ShapeSVG} cells=${allMysteryCells} mystery=${true} size=${40} normalized=${false} />
                </div>
            </div>

            <!-- 已知圖卡與作答區 -->
            <div className="flex flex-col gap-6">
                
                <!-- 已知條件 -->
                <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-100">
                    <p className="text-xs font-bold text-amber-600 mb-3 uppercase tracking-wider">已知組件：</p>
                    <div className="flex justify-center items-center gap-4">
                        ${problem.given.map((idx, i) => html`
                            <div key=${i} className="flex flex-col items-center">
                                <${ShapeSVG} cells=${problem.layout[idx].cells} color=${problem.layout[idx].color} size=${20} />
                                <span className="text-[10px] font-bold text-amber-400 mt-1">圖卡 ${problem.layout[idx].id}</span>
                            </div>
                        `).reduce((acc, curr, i) => i === 0 ? [curr] : [...acc, html`<span className="text-amber-200 font-bold">+</span>`, curr], [])}
                    </div>
                </div>

                <!-- 選項按鈕 -->
                <div className="grid grid-cols-5 gap-2">
                    ${Object.keys(PIECES_LIB).map(id => html`
                        <button
                            key=${id}
                            onClick=${() => handleSelect(id)}
                            className=${`p-2 bg-white border-2 rounded-xl flex flex-col items-center transition-all ${selectedId === id
            ? (id === problem.answerId ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50')
            : 'border-slate-100 hover:border-indigo-300'
        }`}
                        >
                            <${ShapeSVG} cells=${PIECES_LIB[id].cells} color=${selectedId === id ? (id === problem.answerId ? '#22c55e' : '#ef4444') : '#cbd5e1'} size=${10} />
                            <span className="text-[10px] font-bold text-slate-400 mt-1">${id}</span>
                        </button>
                    `)}
                </div>

                <!-- 結果回饋 -->
                ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-center animate-pulse">
                        形狀好像不對喔，再觀察一下！
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="flex flex-col items-center gap-2 animate-fade-in">
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-6 py-2 rounded-full border border-green-200 animate-bounce">
                            <span className="text-xl font-bold">🎉 答對了！太強了！</span>
                        </div>
                    </div>
                `}
            </div>

            <!-- 詳解區 -->
            ${feedback === 'correct' && html`
                <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-slate-200 shadow-lg animate-fade-in">
                    <h3 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
                        <span className="bg-indigo-100 p-1 rounded">💡</span> 真相剖析圖
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                             <${ShapeSVG} cells=${allMysteryCells} size=${35} normalized=${false} isSolution=${true} 
                                // 覆蓋繪製邏輯，使用彩色解答
                                cells=${null} // 這裡用 custom render
                             />
                             <!-- 手動渲染解答 SVG -->
                             <svg width=${(Math.max(...allMysteryCells.map(c => c[0])) + 1) * 35} height=${(Math.max(...allMysteryCells.map(c => c[1])) + 1) * 35}>
                                ${problem.layout.map(p => p.cells.map(c => html`
                                    <rect x=${c[0] * 35} y=${c[1] * 35} width="35" height="35" fill=${p.color} rx="4" style=${{ stroke: 'white', strokeWidth: '1.5px' }} />
                                `))}
                             </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-slate-600 leading-relaxed text-sm">
                                ${problem.text}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                ${problem.layout.map(p => html`
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                        <div className="w-2 h-2 rounded-full" style=${{ backgroundColor: p.color }}></div>
                                        圖卡 ${p.id}
                                    </div>
                                `)}
                            </div>
                        </div>
                    </div>
                </div>
            `}

        <!-- ⚠️ DO NOT MODIFY START -->
        </div>
        <!-- ⚠️ DO NOT MODIFY END -->
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q016',
    type: 'custom',
    title: '空間結構推理挑戰',
    q: '觀察影子輪廓，找出構成圖形的第三張圖卡是誰？',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MyQuestionComponent} />`);
    }
};