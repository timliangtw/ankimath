const { useState, useEffect, useCallback, useMemo } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 - 積木分層計數 (無限題庫版)
 * ------------------------------------------------------------------
 */

// --- 輔助元件：單顆積木 (SVG Isometric Cube) ---
const IsoCube = ({ x, y, z, color = "#fbbf24", opacity = 1 }) => {
    const tileW = 24;
    const tileH = 14;
    const blockH = 24;

    const screenX = (x - y) * tileW + 150;
    const screenY = (x + y) * tileH - (z * blockH) + 150;

    const adjustColor = (c, amt) => '#' + c.replace(/^#/, '').replace(/../g, color => ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amt)).toString(16)).substr(-2));

    const topColor = color;
    const rightColor = adjustColor(color, -20);
    const leftColor = adjustColor(color, -40);

    return html`
        <g className="cube-transition" style=${{ opacity: opacity, transform: `translate(${screenX}px, ${screenY}px)` }}>
            <path d="M0 ${tileH} L0 ${tileH + blockH} L-${tileW} ${blockH} L-${tileW} 0 Z" fill=${leftColor} stroke="${leftColor}" strokeWidth="1"/>
            <path d="M0 ${tileH} L${tileW} 0 L${tileW} ${blockH} L0 ${tileH + blockH} Z" fill=${rightColor} stroke="${rightColor}" strokeWidth="1"/>
            <path d="M0 ${tileH} L-${tileW} 0 L0 -${tileH} L${tileW} 0 Z" fill=${topColor} stroke="#ffffff" strokeWidth="1" strokeOpacity="0.5"/>
        </g>
    `;
};

// --- 輔助元件：2D 平面圖 (分層顯示用) ---
const LayerView = ({ layerGrid, layerIndex }) => {
    // 使用平面迴圈產生格子，避免 Key 的警告問題
    const cells = [];
    for (let i = 0; i < 9; i++) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hasBlock = layerGrid[row][col];
        cells.push(html`
            <div key=${i} className=${`w-full h-full rounded-sm flex items-center justify-center text-[10px] font-bold transition-all ${hasBlock ? 'bg-amber-400 shadow-sm text-amber-800' : 'bg-slate-200'}`}>
                ${hasBlock ? '1' : ''}
            </div>
        `);
    }

    return html`
        <div className="flex flex-col items-center">
            <div className="text-sm font-bold text-slate-500 mb-2">第 ${layerIndex + 1} 層</div>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-2 rounded-lg border-2 border-slate-200" style=${{ width: '80px', height: '80px' }}>
                ${cells}
            </div>
            <div className="mt-1 font-bold text-amber-600">
                ${layerGrid.flat().filter(Boolean).length} 個
            </div>
        </div>
    `;
};

// --- 主程式元件 ---
const BlockCountingGame = () => {
    const [gridData, setGridData] = useState([]);
    const [totalBlocks, setTotalBlocks] = useState(0);
    const [options, setOptions] = useState([]);
    const [gameState, setGameState] = useState('playing');
    const [feedback, setFeedback] = useState(null);
    const [viewMode, setViewMode] = useState('stack');

    // 隨機出題邏輯
    const generateLevel = useCallback(() => {
        const newGrid = Array(3).fill(0).map(() => Array(3).fill(0));
        let count = 0;

        // 第 1 層 (底層)
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                newGrid[r][c] = 1;
                count++;
            }
        }

        // 第 2 層
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (Math.random() > 0.3) {
                    newGrid[r][c]++;
                    count++;
                }
            }
        }

        // 第 3 層
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (newGrid[r][c] === 2 && Math.random() > 0.6) {
                    newGrid[r][c]++;
                    count++;
                }
            }
        }

        if (count < 10 || count > 22) {
            generateLevel();
            return;
        }

        const correctAnswer = count;
        const trapVisible = Math.max(5, count - (Math.floor(Math.random() * 4) + 3));
        const trapLayer = count + (Math.random() > 0.5 ? 2 : -2);
        const trapRandom = count + (Math.floor(Math.random() * 5) + 4);

        const newOptions = [correctAnswer, trapVisible, trapLayer, trapRandom]
            .sort(() => Math.random() - 0.5);

        const uniqueOptions = [...new Set(newOptions)].sort((a, b) => a - b);

        setGridData(newGrid);
        setTotalBlocks(count);
        setOptions(uniqueOptions);
        setGameState('playing');
        setFeedback(null);
        setViewMode('stack');
    }, []);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    const checkAnswer = (opt) => {
        if (opt === totalBlocks) {
            setFeedback('correct');
            setGameState('won');
            setViewMode('layers'); // 答對自動切換
        } else {
            setFeedback('wrong');
            setGameState('playing');
        }
    };

    const renderStack = () => {
        const cubes = [];
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                const h = gridData[x][y];
                for (let z = 0; z < h; z++) {
                    cubes.push({ x, y, z });
                }
            }
        }
        cubes.sort((a, b) => (a.x + a.y + a.z) - (b.x + b.y + b.z));

        return html`
            <svg viewBox="0 0 300 300" className="w-full h-64 md:h-80 drop-shadow-xl transform scale-110 md:scale-100">
                ${cubes.map((c, i) => html`
                    <${IsoCube} key=${`cube-${i}`} x=${c.x} y=${c.y} z=${c.z} />
                `)}
            </svg>
        `;
    };

    const renderLayers = () => {
        const layers = [
            [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
            [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
        ];

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const h = gridData[r][c];
                if (h >= 1) layers[0][r][c] = 1;
                if (h >= 2) layers[1][r][c] = 1;
                if (h >= 3) layers[2][r][c] = 1;
            }
        }

        const counts = layers.map(layer => layer.flat().filter(x => x === 1).length);

        return html`
            <div className="flex justify-center gap-2 md:gap-4 animate-fade-in py-8">
                <div className="flex flex-col gap-2 items-center">
                    <${LayerView} layerGrid=${layers[2]} layerIndex=${2} />
                    <span className="text-slate-400 font-bold">+</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                    <${LayerView} layerGrid=${layers[1]} layerIndex=${1} />
                    <span className="text-slate-400 font-bold">+</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                    <${LayerView} layerGrid=${layers[0]} layerIndex=${0} />
                    <div className="text-center font-black text-indigo-600 border-t-2 border-indigo-200 mt-1 pt-1 w-full">
                        = ${counts[0] + counts[1] + counts[2]}
                    </div>
                </div>
            </div>
        `;
    };

    if (!gridData.length) return html`<div>載入中...</div>`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl select-none">
            
            <!-- 內嵌必要樣式 -->
            <style>
                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .cube-transition { transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
            </style>

            <!-- 標題 -->
            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3 transform -rotate-1">
                    空間概念
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    共有幾個積木？
                </h1>
                <p className="text-slate-500 text-sm mt-2">
                    記得喔！看不見的角落也有積木支撐著！
                </p>
            </div>

            <!-- 視覺展示區 -->
            <div className="bg-white rounded-2xl border-4 border-slate-200 relative overflow-hidden mb-8 min-h-[320px] flex items-center justify-center shadow-sm">
                <!-- 切換按鈕 (只在答對後顯示) -->
                ${gameState === 'won' && html`
                    <div className="absolute top-4 right-4 z-10 animate-fade-in">
                        <button 
                            onClick=${() => setViewMode(viewMode === 'stack' ? 'layers' : 'stack')}
                            className="bg-slate-100 px-4 py-2 rounded-full text-sm font-bold shadow-md text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-2 border border-slate-200"
                        >
                            ${viewMode === 'stack'
                ? html`<span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> 拆開來看</span>`
                : html`<span className="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-9 5-9-5"/><polygon points="3 8 12 13 21 8 12 3 3 8"/></svg> 組合起來</span>`
            }
                        </button>
                    </div>
                `}

                <!-- 內容 -->
                ${viewMode === 'stack' ? renderStack() : renderLayers()}
                
                ${gameState === 'won' && viewMode === 'stack' && html`
                    <div className="absolute bottom-4 left-0 right-0 text-center text-slate-400 text-xs animate-fade-in">
                        (試著按右上角按鈕把積木拆開)
                    </div>
                `}
            </div>

            <!-- 選項區 -->
            <div className="grid grid-cols-2 gap-4 mb-8">
                ${options.map(opt => html`
                    <button
                        key=${opt}
                        onClick=${() => checkAnswer(opt)}
                        disabled=${gameState === 'won' && opt !== totalBlocks}
                        className=${`
                            py-4 rounded-xl text-2xl font-bold transition-all border-b-4 
                            ${gameState === 'won' && opt === totalBlocks
                    ? 'bg-green-500 text-white border-green-700 scale-105 shadow-lg'
                    : feedback === 'wrong' && opt !== totalBlocks
                        ? 'bg-white text-slate-300 border-slate-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:-translate-y-1'
                }
                        `}
                    >
                        ${opt} 個
                    </button>
                `)}
            </div>

            <!-- 回饋區 -->
            <div className="min-h-[120px]">
                ${feedback === 'wrong' && html`
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center animate-pulse">
                        <p className="text-red-600 font-bold text-lg">再數數看！</p>
                        <p className="text-slate-600 text-sm mt-1">
                            提示：有些積木躲在後面幫忙支撐喔！<br/>
                            要注意看不見的角落。
                        </p>
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm animate-fade-in text-center">
                        <h3 className="text-green-800 font-bold text-2xl mb-2 flex items-center justify-center gap-2">
                            🎉 答對了！共有 ${totalBlocks} 個
                        </h3>
                        <p className="text-green-700 mb-4">
                            你真厲害！發現了所有隱藏的積木！
                        </p>
                        <button onClick=${generateLevel} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm">
                            再玩一題
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
};

export default {
    id: 'q010',
    type: 'custom',
    title: '積木透視眼：共有幾個？',
    q: '空間概念與分層計數 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${BlockCountingGame} />`);
    }
};