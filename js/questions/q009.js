const { useState, useEffect, useCallback, useMemo } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 圖形邏輯找錯 (無限題庫版)
 * ------------------------------------------------------------------
 */

// --- 輔助元件：形狀 ---
const Shape = ({ type, color, className = "" }) => {
    const sizeClass = "w-8 h-8 md:w-10 md:h-10 flex-shrink-0";

    if (type === 'square') {
        const colorClass = color === 'black' ? 'bg-slate-800 border-slate-900' : 'bg-white border-slate-300';
        return html`<div className=${`${sizeClass} ${colorClass} border-2 shadow-sm rounded-sm ${className}`}></div>`;
    } else {
        // 使用 filter drop-shadow 避免方框陰影
        const dropShadowClass = "drop-shadow-sm";
        return html`
            <svg viewBox="0 0 100 100" className=${`${sizeClass} ${className} bg-transparent overflow-visible ${dropShadowClass}`}>
                <polygon points="50,10 90,90 10,90" 
                         fill=${color === 'black' ? '#1e293b' : '#ffffff'} 
                         stroke=${color === 'black' ? '#0f172a' : '#cbd5e1'} 
                         strokeWidth="8" 
                         strokeLinejoin="round"/>
            </svg>
        `;
    }
};

// --- 主程式元件 ---
const GeometryLogicGame = () => {
    // 1. 狀態管理
    const [levelData, setLevelData] = useState(null);
    const [displayShapes, setDisplayShapes] = useState([]);
    const [isSorted, setIsSorted] = useState(false);
    const [gameState, setGameState] = useState('playing');
    const [feedback, setFeedback] = useState(null);
    const [checkedIds, setCheckedIds] = useState(new Set());

    // 2. 隨機出題邏輯
    const generateLevel = useCallback(() => {
        // A. 隨機產生數量 (4~9之間)
        const bs = Math.floor(Math.random() * 6) + 4; // 黑正
        const bt = Math.floor(Math.random() * 5) + 3; // 黑三
        const ws = Math.floor(Math.random() * 6) + 4; // 白正
        const wt = Math.floor(Math.random() * 5) + 3; // 白三

        const realData = {
            blackTotal: bs + bt,
            whiteTotal: ws + wt,
            squareTotal: bs + ws,
            triangleTotal: bt + wt,
            mix1: bt + ws, // 黑三 + 白正
            mix2: bs + wt  // 黑正 + 白三
        };

        // B. 建立圖形物件陣列
        const shapes = [];
        let id = 1;
        const addShapes = (count, color, type) => {
            for (let i = 0; i < count; i++) {
                shapes.push({ id: `s-${Date.now()}-${id++}`, color, type });
            }
        };
        addShapes(bs, 'black', 'square');
        addShapes(bt, 'black', 'triangle');
        addShapes(ws, 'white', 'square');
        addShapes(wt, 'white', 'triangle');

        // C. 設計敘述模板 (隨機挑選一個作為謊言)
        const statementTypes = [
            {
                type: 'color',
                getTrue: () => `黑色圖形有 ${realData.blackTotal} 個，白色圖形有 ${realData.whiteTotal} 個`,
                getFalse: () => `黑色圖形有 ${realData.blackTotal} 個，白色圖形有 ${realData.whiteTotal + (Math.random() > 0.5 ? 1 : -1)} 個`
            },
            {
                type: 'mix',
                getTrue: () => `黑色三角形和白色正方形一共有 ${realData.mix1} 個`,
                getFalse: () => `黑色三角形和白色正方形一共有 ${realData.mix1 + (Math.random() > 0.5 ? 2 : -1)} 個`
            },
            {
                type: 'shape',
                getTrue: () => `正方形有 ${realData.squareTotal} 個，三角形有 ${realData.triangleTotal} 個`,
                getFalse: () => `正方形有 ${realData.squareTotal + (Math.random() > 0.5 ? 1 : -1)} 個，三角形有 ${realData.triangleTotal} 個`
            },
            {
                type: 'compare',
                getTrue: () => realData.triangleTotal === realData.whiteTotal
                    ? "三角形的數量和白色圖形的數量一樣多"
                    : "三角形的數量和白色圖形的數量不一樣多",
                getFalse: () => realData.triangleTotal !== realData.whiteTotal
                    ? "三角形的數量和白色圖形的數量一樣多"
                    : "三角形的數量和白色圖形的數量不一樣多"
            }
        ];

        const lieIndex = Math.floor(Math.random() * 4);

        const options = statementTypes.map((st, index) => {
            const isLie = index === lieIndex;
            return {
                id: index,
                type: st.type,
                text: isLie ? st.getFalse() : st.getTrue(),
                isFact: !isLie // isFact=true 代表是事實(題目選項正確)，isFact=false 代表是謊言(題目選項錯誤->是答案)
            };
        });

        // 洗牌選項順序
        const shuffledOptions = options.map(o => ({ ...o, r: Math.random() }))
            .sort((a, b) => a.r - b.r)
            .map((o, idx) => ({ ...o, id: idx + 1 }));

        // D. 設定狀態
        setLevelData({
            counts: { bs, bt, ws, wt, ...realData },
            originalShapes: shapes,
            options: shuffledOptions
        });
        setDisplayShapes([...shapes].sort(() => Math.random() - 0.5));
        setIsSorted(false);
        setGameState('playing');
        setFeedback(null);
        setCheckedIds(new Set());
    }, []);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    // 3. 互動邏輯
    const toggleSort = () => {
        if (!levelData) return;
        if (isSorted) {
            setDisplayShapes([...levelData.originalShapes].sort(() => Math.random() - 0.5));
        } else {
            const sorted = [...levelData.originalShapes].sort((a, b) => {
                if (a.color !== b.color) return a.color === 'black' ? -1 : 1;
                return a.type === 'square' ? -1 : 1;
            });
            setDisplayShapes(sorted);
        }
        setIsSorted(!isSorted);
    };

    const handleShapeClick = (id) => {
        const newChecked = new Set(checkedIds);
        if (newChecked.has(id)) newChecked.delete(id);
        else newChecked.add(id);
        setCheckedIds(newChecked);
    };

    const checkAnswer = (opt) => {
        setFeedback(opt);
        if (opt.isFact === false) {
            setGameState('won');
        } else {
            setGameState('playing');
        }
    };

    // 4. 詳解內容產生器
    const renderExplanation = (opt) => {
        const counts = levelData.counts;
        switch (opt.type) {
            case 'color':
                return html`
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="bg-white p-3 rounded border">
                            <div className="text-sm font-bold text-slate-500 mb-2">黑色圖形</div>
                            <div className="flex flex-wrap gap-2">
                                ${[...Array(counts.bs)].map((_, i) => html`<${Shape} key=${`bs-${i}`} type="square" color="black" />`)}
                                ${[...Array(counts.bt)].map((_, i) => html`<${Shape} key=${`bt-${i}`} type="triangle" color="black" />`)}
                            </div>
                            <div className="text-right font-bold mt-2">共 ${counts.blackTotal} 個</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <div className="text-sm font-bold text-slate-500 mb-2">白色圖形</div>
                            <div className="flex flex-wrap gap-2">
                                ${[...Array(counts.ws)].map((_, i) => html`<${Shape} key=${`ws-${i}`} type="square" color="white" />`)}
                                ${[...Array(counts.wt)].map((_, i) => html`<${Shape} key=${`wt-${i}`} type="triangle" color="white" />`)}
                            </div>
                            <div className="text-right font-bold mt-2">共 ${counts.whiteTotal} 個</div>
                        </div>
                    </div>
                `;
            case 'mix':
                return html`
                    <div className="bg-white p-4 rounded border text-left">
                        <div className="text-sm font-bold text-slate-500 mb-2">黑色三角形 + 白色正方形</div>
                        <div className="flex flex-wrap gap-2 items-center">
                            ${[...Array(counts.bt)].map((_, i) => html`<${Shape} key=${`mix-bt-${i}`} type="triangle" color="black" />`)}
                            <span className="text-2xl text-slate-300 mx-2">+</span>
                            ${[...Array(counts.ws)].map((_, i) => html`<${Shape} key=${`mix-ws-${i}`} type="square" color="white" />`)}
                        </div>
                        <div className="text-right font-bold mt-2 text-xl">${counts.bt} + ${counts.ws} = ${counts.mix1} 個</div>
                    </div>
                `;
            case 'shape':
                return html`
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="bg-white p-3 rounded border">
                            <div className="text-sm font-bold text-slate-500 mb-2">正方形</div>
                            <div className="flex flex-wrap gap-2">
                                ${[...Array(counts.bs)].map((_, i) => html`<${Shape} key=${`sq-b-${i}`} type="square" color="black" />`)}
                                ${[...Array(counts.ws)].map((_, i) => html`<${Shape} key=${`sq-w-${i}`} type="square" color="white" />`)}
                            </div>
                            <div className="text-right font-bold mt-2">共 ${counts.squareTotal} 個</div>
                        </div>
                        <div className="bg-white p-3 rounded border">
                            <div className="text-sm font-bold text-slate-500 mb-2">三角形</div>
                            <div className="flex flex-wrap gap-2">
                                ${[...Array(counts.bt)].map((_, i) => html`<${Shape} key=${`tri-b-${i}`} type="triangle" color="black" />`)}
                                ${[...Array(counts.wt)].map((_, i) => html`<${Shape} key=${`tri-w-${i}`} type="triangle" color="white" />`)}
                            </div>
                            <div className="text-right font-bold mt-2">共 ${counts.triangleTotal} 個</div>
                        </div>
                    </div>
                `;
            case 'compare':
                return html`
                    <div className="flex flex-col gap-4 text-left">
                        <div className="bg-white p-3 rounded border flex justify-between items-center">
                            <span className="font-bold">三角形</span>
                            <div className="flex gap-1">${[...Array(counts.triangleTotal)].map((_, i) => html`<${Shape} key=${`cmp-tri-${i}`} type="triangle" color="black" className="w-6 h-6" />`)}</div>
                            <span className="font-black text-xl">${counts.triangleTotal}</span>
                        </div>
                        <div className="bg-white p-3 rounded border flex justify-between items-center">
                            <span className="font-bold">白色圖形</span>
                            <div className="flex gap-1">${[...Array(counts.whiteTotal)].map((_, i) => html`<${Shape} key=${`cmp-white-${i}`} type="square" color="white" className="w-6 h-6" />`)}</div>
                            <span className="font-black text-xl">${counts.whiteTotal}</span>
                        </div>
                        <div className="text-center font-bold text-indigo-600 bg-indigo-50 p-2 rounded">
                            ${counts.triangleTotal} ${counts.triangleTotal === counts.whiteTotal ? '=' : '≠'} ${counts.whiteTotal}
                        </div>
                    </div>
                `;
            default: return null;
        }
    };

    if (!levelData) return html`<div className="text-center p-10 font-bold text-slate-500">準備圖形中...</div>`;

    // 5. 渲染
    return html`
        <div className="w-full font-sans text-left mx-auto max-w-3xl select-none">
            
            <!-- 內嵌必要樣式 (動畫) -->
            <style>
                .shape-item { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                .pop-in { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
                @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }
                .check-anim { animation: checkPop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes checkPop { 0% { transform: scale(0) rotate(-45deg); opacity: 0; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
            </style>

            <!-- 標題 -->
            <div className="text-center mb-6">
                <div className="inline-block bg-indigo-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    邏輯與計數 (無限題庫)
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    找找看，哪一句話是<span className="text-red-500">錯的</span>？
                </h1>
            </div>

            <!-- 圖形展示區 -->
            <div className="bg-slate-200 p-4 rounded-2xl mb-6 relative border-4 border-slate-300">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button 
                        onClick=${() => setCheckedIds(new Set())}
                        className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm hover:bg-red-50 text-red-500 transition-colors"
                    >
                        <span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg> 重算</span>
                    </button>
                    <button 
                        onClick=${toggleSort}
                        className="bg-white px-3 py-1 rounded-full text-sm font-bold shadow-sm hover:bg-indigo-50 text-indigo-600 transition-colors"
                    >
                        ${isSorted
            ? html`<span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l5 5"/><path d="M4 4l5 5"/></svg> 打亂</span>`
            : html`<span className="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> 幫我分類</span>`
        }
                    </button>
                </div>

                <div className="bg-white rounded-xl p-6 min-h-[250px] flex flex-wrap content-start gap-3 transition-all cursor-pointer">
                    ${displayShapes.map(s => {
            const isChecked = checkedIds.has(s.id);
            return html`
                            <div 
                                key=${s.id} 
                                className="shape-item pop-in relative group"
                                onClick=${() => handleShapeClick(s.id)}
                            >
                                <div className=${`transition-opacity duration-200 ${isChecked ? 'opacity-40' : 'opacity-100 group-hover:scale-110'}`}>
                                    <${Shape} type=${s.type} color=${s.color} />
                                </div>
                                ${isChecked && html`
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none check-anim z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    </div>
                                `}
                            </div>
                        `;
        })}
                </div>
                <div className="text-center mt-2 text-slate-500 text-sm">
                    ${isSorted ? "排整齊了！" : "點擊圖形可以做記號喔！"}
                </div>
            </div>

            <!-- 選項區 -->
            <div className="grid grid-cols-1 gap-3 mb-8">
                ${levelData.options.map(opt => html`
                    <button
                        key=${opt.id}
                        onClick=${() => checkAnswer(opt)}
                        disabled=${gameState === 'won' && opt.isFact === true}
                        className=${`
                            w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                            ${gameState === 'won' && opt.isFact === false
                ? 'bg-green-100 border-green-400 ring-2 ring-green-200 z-10'
                : feedback === opt && opt.isFact === true
                    ? 'bg-red-50 border-red-300 shake'
                    : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
            }
                            ${gameState === 'won' && opt.isFact === true ? 'opacity-50' : ''}
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <span className=${`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                                ${gameState === 'won' && opt.isFact === false ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}
                            `}>${opt.id}</span>
                            <span className="text-slate-700 font-bold text-lg">${opt.text}</span>
                        </div>

                        ${feedback === opt && html`
                            <span className="text-sm font-bold ml-2 shrink-0">
                                ${opt.isFact === false
                    ? html`<span className="text-green-600 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 答對了(這句是錯的)</span>`
                    : html`<span className="text-red-500 flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> 這句是對的喔</span>`
                }
                            </span>
                        `}
                    </button>
                `)}
            </div>

            <!-- 回饋與詳解區 -->
            <div className="min-h-[200px]">
                ${feedback && html`
                    <div className="animate-pulse">
                        ${feedback.isFact === true ? html`
                            <!-- 選到正確敘述 (答錯) -->
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <p className="text-red-600 font-bold text-lg mb-2 text-center">再檢查一次！</p>
                                <p className="text-slate-600 text-center mb-4">
                                    你選的這句話是<strong className="text-green-600">正確的事實</strong>喔。<br/>
                                    但是題目要我們找出<strong className="text-red-500">錯誤</strong>的那一句。
                                </p>
                                <!-- 顯示證據 -->
                                ${renderExplanation(feedback)}
                            </div>
                        ` : html`
                            <!-- 選到錯誤敘述 (答對) -->
                            <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm">
                                <h3 className="text-green-800 font-bold text-xl mb-4 flex items-center gap-2 justify-center">
                                    🎉 沒錯！這句話說錯了！
                                </h3>
                                
                                <!-- 顯示證據 -->
                                ${renderExplanation(feedback)}

                                <button onClick=${generateLevel} className="mt-6 w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-sm">
                                    再玩一次 (換新題目)
                                </button>
                            </div>
                        `}
                    </div>
                `}
            </div>
        </div>
    `;
};

export default {
    id: 'geometry_logic',
    type: 'custom',
    title: '圖形偵探：哪一句話說錯了？',
    q: '邏輯與計數 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${GeometryLogicGame} />`);
    }
};