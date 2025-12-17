const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

// --- 輔助元件 ---
const Ruler = ({ length, color, label, className = "" }) => html`
    <div className=${`relative h-8 md:h-12 rounded-md flex items-center justify-center text-white font-bold shadow-sm transition-all ${className}`}
         style=${{ width: `${length * 10}%`, backgroundColor: color }}>
        ${label} (${length})
    </div>
`;

// --- 主程式邏輯 ---
const RibbonProblem = () => {
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const generateProblem = () => {
        // 設定長度範圍 (單位：迴紋針)
        // 重疊部分 (2~5)
        const overlap = Math.floor(Math.random() * 4) + 2;

        // 紅色彩帶 (只有單邊+重疊) -> 總長 6~10
        const redOnly = Math.floor(Math.random() * 5) + 4;
        const redTotal = redOnly + overlap; // 其實這裡 redOnly 定義不太精確，應該是 (redTotal - overlap) >= 1

        // 綠色彩帶
        const greenOnly = Math.floor(Math.random() * 5) + 4;
        const greenTotal = greenOnly + overlap;

        const totalLength = redTotal + greenTotal - overlap;

        const questionText = `紅色紙條長 ${redTotal} 個迴紋針，綠色紙條長 ${greenTotal} 個迴紋針。兩條黏在一起，重疊的部分是 ${overlap} 個迴紋針。請問黏好後「總共」有多長？`;

        const explanationText = `紅長(${redTotal}) + 綠長(${greenTotal}) - 重疊(${overlap}) = ${totalLength}`;

        setProblem({
            overlap,
            redTotal,
            greenTotal,
            totalLength,
            questionText,
            explanationText
        });
        setUserAnswer('');
        setFeedback(null);
        setShowExplanation(false);
    };

    useEffect(() => {
        generateProblem();
    }, []);

    const checkAnswer = () => {
        const num = parseInt(userAnswer);
        if (isNaN(num)) return;

        if (num === problem.totalLength) {
            setFeedback('correct');
            setShowExplanation(true);
        } else {
            setFeedback('wrong');
            setShowExplanation(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') checkAnswer();
    };

    // --- 圖解視覺化 ---
    const Visualizer = () => {
        if (!problem) return null;

        // 計算比例用的常數
        const scale = 8; // 每個單位長度的 px 或 % (這邊用相對寬度)

        // 因為寬度有限，我們用 flex 和相對比例來畫
        // 我們用 grid 或用 flex row 來模擬

        // 視覺化結構：
        // 1. 分開顯示：紅條 + 綠條
        // 2. 合併顯示：紅左 + 重疊(紫) + 綠右

        const redLeft = problem.redTotal - problem.overlap;
        const greenRight = problem.greenTotal - problem.overlap;

        return html`
            <div className="mt-8 p-6 bg-slate-50 rounded-xl border border-slate-200 w-full overflow-hidden">
                <div className="text-center text-sm text-gray-500 mb-6 font-bold">
                    圖解小教室：為什麼要減掉重疊？
                </div>

                <div className="flex flex-col gap-6">
                    <!-- 1. 原始長度 -->
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="w-12">原本：</span>
                        <div className="flex-1 flex gap-2">
                             <div className="h-8 bg-red-400 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm" style=${{ flex: problem.redTotal }}>
                                紅 (${problem.redTotal})
                             </div>
                             <div className="h-8 bg-green-500 rounded flex items-center justify-center text-white text-xs font-bold shadow-sm" style=${{ flex: problem.greenTotal }}>
                                綠 (${problem.greenTotal})
                             </div>
                        </div>
                    </div>

                    <!-- 2. 黏合過程 (示意重疊) -->
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="w-12">黏貼：</span>
                        <div className="flex-1 flex relative h-10">
                            <!-- 紅色底層 -->
                            <div className="absolute top-0 left-0 h-full bg-red-400 rounded-l opacity-80 flex items-center pl-2 text-white font-bold" 
                                 style=${{ width: `${(problem.redTotal / problem.totalLength) * 100}%` }}>
                                紅
                            </div>
                            
                            <!-- 綠色上層，定位在右邊 -->
                            <div className="absolute top-0 right-0 h-full bg-green-500 rounded-r opacity-80 flex items-center justify-end pr-2 text-white font-bold" 
                                 style=${{ width: `${(problem.greenTotal / problem.totalLength) * 100}%` }}>
                                綠
                            </div>

                            <!-- 重疊區塊高亮 -->
                            <div className="absolute top-0 h-full border-x-2 border-white bg-black/20 flex flex-col items-center justify-center"
                                 style=${{
                left: `${(redLeft / problem.totalLength) * 100}%`,
                width: `${(problem.overlap / problem.totalLength) * 100}%`
            }}>
                                 <span className="text-[10px] text-white font-bold bg-black/50 px-1 rounded">
                                    重疊 ${problem.overlap}
                                 </span>
                            </div>
                        </div>
                    </div>

                    <!-- 3. 結果算式 -->
                    <div className="mt-2 text-center p-3 bg-white rounded-lg border border-yellow-100 shadow-sm">
                        <p className="text-lg text-slate-700 font-bold">
                            ${problem.explanationText}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            (因為重疊的地方被算了兩次，所以要扣掉一次喔！)
                        </p>
                    </div>
                </div>
            </div>
        `;
    };

    // --- 題目示意圖 ---
    const ProblemDiagram = () => {
        if (!problem) return null;

        // 我們用相對寬度來畫示意圖
        // 假設總長度是 (redTotal + greenTotal - overlap) 的 100% 寬度好像太複雜
        // 簡單一點，假設 redTotal 是 40%, greenTotal 是 40%，剩下 20% 是...
        // 不對，我們直接用 flex 比例。

        let total = problem.totalLength; // 雖然此時使用者不知道 total，但我們畫圖需要比例

        // 算出三個區段的比例：
        // 1. 左邊紅色獨有部分 = problem.redTotal - problem.overlap
        // 2. 中間重疊部分 = problem.overlap
        // 3. 右邊綠色獨有部分 = problem.greenTotal - problem.overlap

        const leftW = ((problem.redTotal - problem.overlap) / total) * 100;
        const midW = (problem.overlap / total) * 100;
        const rightW = ((problem.greenTotal - problem.overlap) / total) * 100;

        return html`
            <div className="mb-8 p-4 bg-white rounded-xl border border-slate-200">
                <div className="text-center text-sm text-gray-400 mb-4 font-bold">
                    示意圖
                </div>
                
                <div className="relative h-24 w-full flex items-center justify-center px-4">
                    <!-- 紅色紙帶 (包含重疊) -->
                    <!-- 我們畫兩條分開一點點或是半透明疊在一起 -->
                    
                    <!-- 容器 -->
                    <div className="relative w-full h-12">
                        <!-- 左邊紅色 -->
                        <div className="absolute top-0 left-0 h-full bg-red-400 rounded-l border-2 border-red-500 opacity-90 flex items-start justify-center pt-1 text-white text-xs font-bold z-10"
                             style=${{ width: `${leftW + midW}%`, zIndex: 10 }}>
                             <span className="bg-black/20 px-1 rounded absolute top-1">紅長 ${problem.redTotal}</span>
                        </div>

                        <!-- 右邊綠色 -->
                        <div className="absolute top-2 left-0 h-full bg-green-500 rounded-r border-2 border-green-600 opacity-90 flex items-end justify-center pb-1 text-white text-xs font-bold z-20"
                             style=${{ width: `${rightW + midW}%`, left: `${leftW}%` }}>
                             <span className="bg-black/20 px-1 rounded absolute bottom-1">綠長 ${problem.greenTotal}</span>
                        </div>

                        <!-- 重疊標示 -->
                        <!-- 畫一個框框標示重疊區域 -->
                        <div className="absolute top-[-10px] h-[calc(100%+20px)] border-x-2 border-slate-400 border-dashed z-30"
                             style=${{ left: `${leftW}%`, width: `${midW}%` }}>
                             
                             <!-- 上方箭頭或標籤說明重疊 -->
                             <div className="absolute -top-6 w-full text-center">
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1 rounded border border-slate-300 whitespace-nowrap">
                                    重疊 ${problem.overlap}
                                </span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left">
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
               <span className="absolute -top-3 -left-3 bg-amber-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    題目
                </span>
                <p className="text-2xl md:text-3xl font-bold text-slate-700 leading-relaxed text-center mt-12 mb-6">
                    ${problem ? problem.questionText : '載入中...'}
                </p>
                
                <!-- 插入示意圖 -->
                <${ProblemDiagram} />
            </div>

            <div className="flex flex-col items-center gap-6">
                <!-- 輸入區 -->
                <div className="flex items-center gap-4 w-full justify-center">
                    <input
                        type="number"
                        value=${userAnswer}
                        onChange=${(e) => setUserAnswer(e.target.value)}
                        onKeyDown=${handleKeyDown}
                        placeholder="?"
                        className="w-32 h-20 text-center text-4xl font-bold border-4 border-slate-200 rounded-2xl focus:border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-100 transition-all text-slate-700 placeholder-slate-300"
                        disabled=${feedback === 'correct'}
                    />
                    <span className="text-2xl font-bold text-slate-400">個</span>
                </div>

                <!-- 確認按鈕 (只在未答對時顯示) -->
                ${!feedback && html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xl font-bold rounded-2xl shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                        送出答案
                    </button>
                `}

                ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-lg animate-pulse">
                        再算算看喔！記得扣掉重疊的部分
                    </div>
                `}
            </div>

            ${feedback && html`
                <div className=${`transition-all duration-500 ease-out mt-6 ${showExplanation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                     <div className="flex justify-center mb-4">
                        ${feedback === 'correct' ? html`
                            <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200">
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                <span className="text-xl font-bold">答對了！</span>
                            </div>
                        ` : null}
                    </div>
                    <${Visualizer} />
                </div>
            `}
        </div>
    `;
};

export default {
    id: 7,
    type: 'custom',
    title: '重疊問題小學堂 (互動)',
    q: '彩帶重疊邏輯 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${RibbonProblem} />`);
    }
};
