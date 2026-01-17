
const { useState, useEffect, useCallback } = React;
const { createRoot } = ReactDOM;
const html = htm.bind(React.createElement);

// --- 水果圖示 ---
const Fruit = ({ type, size = "md" }) => {
    const sizeClass = size === "lg" ? "text-5xl" : "text-3xl";
    let icon = "";
    let color = "";

    if (type === "watermelon") { icon = "🍉"; color = "drop-shadow-md"; }
    else if (type === "pineapple") { icon = "🍍"; color = "drop-shadow-md"; }
    else if (type === "apple") { icon = "🍎"; color = "drop-shadow-md"; }

    return html`<span className=${`${sizeClass} ${color} fruit-pop inline-block`}>${icon}</span>`;
};

// --- 天平元件 ---
const Scale = ({ leftContent, rightContent, label }) => {
    return html`
        <div className="flex flex-col items-center w-full max-w-xs mx-auto">
            <div className="bg-white/80 p-2 rounded-lg shadow-sm mb-2 text-sm text-slate-500 font-bold border border-slate-200">
                ${label}
            </div>
            
            <!-- 天平橫桿 -->
            <div className="relative w-full h-32 flex items-end justify-center">
                <!-- 支架 -->
                <div className="absolute bottom-0 w-2 h-24 bg-slate-300 rounded-t-lg left-1/2 -translate-x-1/2"></div>
                <div className="absolute bottom-0 w-16 h-2 bg-slate-300 rounded-full left-1/2 -translate-x-1/2"></div>
                
                <!-- 橫桿與盤子 (平衡狀態) -->
                <div className="w-full h-full flex items-end justify-between relative z-10 pb-4">
                    <!-- 左盤 -->
                    <div className="flex flex-col items-center w-1/2">
                        <div className="flex flex-wrap justify-center gap-1 mb-1 min-h-[40px] items-end">
                            ${leftContent}
                        </div>
                        <div className="w-24 h-1 bg-slate-400"></div>
                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-slate-300"></div>
                    </div>

                    <!-- 右盤 -->
                    <div className="flex flex-col items-center w-1/2">
                        <div className="flex flex-wrap justify-center gap-1 mb-1 min-h-[40px] items-end">
                            ${rightContent}
                        </div>
                        <div className="w-24 h-1 bg-slate-400"></div>
                        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-slate-300"></div>
                    </div>
                    
                    <!-- 橫桿連結 -->
                    <div className="absolute bottom-[20px] left-[15%] right-[15%] h-1 bg-slate-400 -z-10"></div>
                </div>
            </div>
        </div>
    `;
};

// --- 主程式 ---
const FruitWeightGame = ({ onCorrect }) => {
    // 題目數據 (預設: 西瓜=4鳳梨, 鳳梨=3蘋果)
    const [problem, setProblem] = useState({
        w_to_p: 4, // 1西瓜 = 4鳳梨
        p_to_a: 3, // 1鳳梨 = 3蘋果
        correctAnswer: 12 // 4 * 3
    });
    const [options, setOptions] = useState([]);
    const [gameState, setGameState] = useState('playing'); // playing, won
    const [feedback, setFeedback] = useState(null);

    // 用於詳解動畫的狀態
    const [isExplaining, setIsExplaining] = useState(false);
    const [showTransformation, setShowTransformation] = useState(false); // 控制鳳梨變蘋果

    // 產生題目
    const generateLevel = useCallback(() => {
        const wp = Math.floor(Math.random() * 2) + 2; // 1西瓜 = 2~3鳳梨 (數字小一點比較好畫)
        const pa = Math.floor(Math.random() * 3) + 2; // 1鳳梨 = 2~4蘋果
        const ans = wp * pa;

        // 選項
        const opts = [
            ans,           // 正解
            wp + pa,       // 加法陷阱
            ans - pa,      // 少算一個鳳梨
            ans + pa       // 多算一個鳳梨
        ].sort(() => Math.random() - 0.5);

        // 去重並排序
        const uniqueOpts = [...new Set(opts)].sort((a, b) => a - b);
        while (uniqueOpts.length < 4) {
            uniqueOpts.push(uniqueOpts[uniqueOpts.length - 1] + 1);
        }

        setProblem({ w_to_p: wp, p_to_a: pa, correctAnswer: ans });
        setOptions(uniqueOpts);
        setGameState('playing');
        setFeedback(null);
        setIsExplaining(false);
        setShowTransformation(false);
    }, []);

    useEffect(() => {
        generateLevel();
    }, [generateLevel]);

    const checkAnswer = (opt) => {
        if (opt === problem.correctAnswer) {
            setFeedback('correct');
            setGameState('won');
            setIsExplaining(true);
            // Removed auto-advance: if (onCorrect) onCorrect();
        } else {
            setFeedback('wrong');
            setGameState('playing');
        }
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl px-4">
            <!-- 注入樣式 -->
            <style>
                .fruit-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes pop { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                .fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
            
            <!-- 標題 -->
            <div className="text-center mb-6">
                <div className="inline-block bg-green-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3 transform -rotate-1">
                    代換推理
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    1 顆西瓜 = 幾顆蘋果？
                </h1>
            </div>

            <!-- 題目展示區 (天平) -->
            <div className="bg-white rounded-2xl border-4 border-slate-200 p-4 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <${Scale} 
                        label="天平 1"
                        leftContent=${html`<${Fruit} type="watermelon" size="lg" />`}
                        rightContent=${[...Array(problem.w_to_p)].map((_, i) => html`<${Fruit} key=${i} type="pineapple" />`)}
                    />
                    <${Scale} 
                        label="天平 2"
                        leftContent=${html`<${Fruit} type="pineapple" size="lg" />`}
                        rightContent=${[...Array(problem.p_to_a)].map((_, i) => html`<${Fruit} key=${i} type="apple" />`)}
                    />
                </div>
            </div>

            <!-- 選項區 -->
            <div className="grid grid-cols-2 gap-4 mb-8">
                ${options.map(opt => html`
                    <button
                        key=${opt}
                        onClick=${() => checkAnswer(opt)}
                        disabled=${gameState === 'won' && opt !== problem.correctAnswer}
                        className=${`
                            py-4 rounded-xl text-2xl font-bold transition-all border-b-4 flex items-center justify-center gap-2
                            ${gameState === 'won' && opt === problem.correctAnswer
            ? 'bg-green-500 text-white border-green-700 scale-105 shadow-lg'
            : feedback === 'wrong' && opt !== problem.correctAnswer
                ? 'bg-white text-slate-300 border-slate-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-green-50 hover:border-green-300 hover:-translate-y-1'
        }
                        `}
                    >
                        ${opt} 顆
                    </button>
                `)}
            </div>

            <!-- 回饋與詳解區 -->
            <div className="min-h-[120px]">
                ${feedback === 'wrong' && html`
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center animate-pulse">
                        <p className="text-red-600 font-bold text-lg">再想一想！</p>
                        <p className="text-slate-600 text-sm mt-1">
                            提示：先把西瓜換成鳳梨，再把每一個鳳梨都換成蘋果喔！
                        </p>
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="bg-green-50 p-6 rounded-xl border border-green-200 shadow-sm fade-in">
                        <h3 className="text-green-800 font-bold text-xl mb-4 text-center">
                            🎉 答對了！就是 ${problem.correctAnswer} 顆！
                        </h3>
                        
                        <!-- 動態圖解 -->
                        <div className="bg-white p-4 rounded-lg border border-slate-200 text-center">
                            <div className="text-sm text-slate-500 mb-4 font-bold">
                                來看變身魔法：
                                ${!showTransformation ?
                html`<button onClick=${() => setShowTransformation(true)} className="ml-2 bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs hover:bg-indigo-200 transition-colors">把鳳梨變成蘋果</button>` :
                html`<button onClick=${() => setShowTransformation(false)} className="ml-2 bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs hover:bg-slate-200 transition-colors">復原</button>`
            }
                            </div>

                            <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                                <div className="flex flex-col items-center">
                                    <${Fruit} type="watermelon" size="lg" />
                                    <span className="text-xs text-slate-400 mt-1">1 西瓜</span>
                                </div>
                                
                                <span className="text-2xl font-bold text-slate-300">=</span>

                                <!-- 這裡顯示鳳梨或變身後的蘋果 -->
                                <div className="flex gap-2 p-2 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    ${[...Array(problem.w_to_p)].map((_, i) => html`
                                        <div key=${i} className="flex flex-col items-center relative">
                                            ${!showTransformation ? html`
                                                <!-- 顯示鳳梨 -->
                                                <div className="fruit-pop"><${Fruit} type="pineapple" /></div>
                                            ` : html`
                                                <!-- 顯示蘋果群組 -->
                                                <div className="grid grid-cols-2 gap-1 fruit-pop bg-green-100 p-1 rounded-lg">
                                                    ${[...Array(problem.p_to_a)].map((_, j) => html`
                                                        <${Fruit} key=${j} type="apple" size="sm" />
                                                    `)}
                                                </div>
                                            `}
                                        </div>
                                    `)}
                                </div>
                            </div>
                            
                            <div className="mt-4 text-slate-600 text-sm">
                                ${showTransformation
                ? html`每個鳳梨都變成了 ${problem.p_to_a} 顆蘋果，總共是 <strong className="text-red-500 text-lg">${problem.w_to_p} × ${problem.p_to_a} = ${problem.correctAnswer}</strong> 顆！`
                : html`原本 1 顆西瓜 = ${problem.w_to_p} 個鳳梨... (點按鈕變身)`
            }
                            </div>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q013',
    type: 'custom',
    title: '水果天平代換推理',
    q: '觀察天平的關係，推算出一個大物品等於幾個小物品',
    render: (container) => {
        const root = createRoot(container);
        root.render(html`<${FruitWeightGame} />`);
    }
};