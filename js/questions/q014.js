const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目：和差問題 (線段圖解法)
 * ------------------------------------------------------------------
 */

const MyQuestionComponent = () => {
    // --- 1. 狀態管理 (State) ---
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null

    // 初始化題目
    useEffect(() => {
        generateProblem();
    }, []);

    const generateProblem = () => {
        const diff = (Math.floor(Math.random() * 5) + 1) * 2; // 2, 4, 6, 8, 10
        const pen = Math.floor(Math.random() * 15) + 5;      // 5 ~ 20
        const ans = pen + diff;
        const sum = ans + pen;

        setProblem({ sum, diff, ans, pen });
        setFeedback(null);
        setUserAnswer('');
    };

    // --- 2. 邏輯處理 (Handlers) ---
    const checkAnswer = () => {
        if (parseInt(userAnswer) === problem.ans) {
            setFeedback('correct');
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();}
    };

    if (!problem) return html`<div>載入中...</div>`;

    // 計算線段比例 (最大寬度設定為 280px)
    const baseWidth = 240;
    const ratio = baseWidth / problem.sum;
    const notebookWidth = problem.ans * ratio;
    const penWidth = problem.pen * ratio;
    const diffWidth = problem.diff * ratio;

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <!-- ⚠️ DO NOT MODIFY START -->
        <div className="w-full font-sans text-left mx-auto">
        <!-- ⚠️ DO NOT MODIFY END -->

            <!-- 題目顯示區 -->
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
                <span className="absolute -top-3 -left-3 bg-orange-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    數學挑戰
                </span>
                
                <p className="text-2xl md:text-3xl font-bold text-slate-700 leading-relaxed text-center mt-8 break-words">
                    姐姐買一本<span className="text-blue-600">筆記本</span>和一枝<span className="text-green-600">原子筆</span>共付了 <span className="underline decoration-orange-300">${problem.sum}</span> 元。已知筆記本比原子筆多 <span className="text-rose-500">${problem.diff}</span> 元，一本筆記本要多少元？
                </p>
            </div>

            <!-- 作答區 -->
            <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 w-full justify-center flex-wrap">
                    <input
                        type="number"
                        value=${userAnswer}
                        onChange=${(e) => setUserAnswer(e.target.value)}
                        placeholder="?"
                        className="w-32 h-20 text-center text-4xl font-bold border-4 border-slate-200 rounded-2xl focus:border-orange-400 focus:outline-none transition-all text-slate-700"
                        disabled=${feedback === 'correct'}
                    />
                    <span className="text-2xl font-bold text-slate-400">元</span>
                </div>

                ${!feedback && html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-2xl shadow-lg transition-all"
                    >
                        送出答案
                    </button>
                `}

                ${feedback === 'wrong' && html`
                    <div className="text-orange-600 font-bold text-lg animate-pulse">
                        再想一下喔，可以試著畫圖看看！
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="flex flex-col items-center gap-4 animate-bounce">
                        <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200">
                            <span className="text-xl font-bold">🎉 太棒了！你答對囉！</span>
                        </div>
                        <button onClick=${generateProblem} className="text-sm text-slate-400 underline mt-2">挑戰下一題</button>
                    </div>
                `}
            </div>

            <!-- 詳解區 -->
            ${feedback === 'correct' && html`
                <div className="mt-8 p-6 bg-white rounded-2xl border-2 border-orange-100 shadow-sm animate-fade-in">
                    <h3 className="font-bold text-orange-800 text-xl mb-6 flex items-center gap-2">🎨 專家解題線段圖</h3>
                    
                    <!-- 線段圖視覺化 -->
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 overflow-x-auto">
                        <div className="min-w-[320px]">
                            <!-- 筆記本線段 -->
                            <div className="flex items-center mb-4 h-8">
                                <div className="w-20 font-bold text-blue-600">筆記本</div>
                                <div style=${{ width: notebookWidth + 'px' }} className="h-6 bg-blue-400 rounded-full transition-all duration-700"></div>
                            </div>
                            <!-- 原子筆線段 -->
                            <div className="flex items-center mb-4 h-8">
                                <div className="w-20 font-bold text-green-600">原子筆</div>
                                <div style=${{ width: penWidth + 'px' }} className="h-6 bg-green-400 rounded-full transition-all duration-700"></div>
                                <div style=${{ width: diffWidth + 'px' }} className="h-6 border-2 border-dashed border-rose-400 bg-rose-50 rounded-r-full flex items-center justify-center text-xs font-bold text-rose-500">
                                    ${problem.diff}
                                </div>
                            </div>
                            <!-- 總和標記 -->
                            <div className="ml-20 border-b-4 border-l-4 border-r-4 border-slate-300 h-4 rounded-b-lg relative" style=${{ width: (problem.sum * ratio) + 'px' }}>
                                <div className="absolute top-4 left-0 w-full text-center font-bold text-slate-500">
                                    共 ${problem.sum} 元
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 text-slate-700 leading-relaxed">
                        <div className="pl-4 border-l-4 border-blue-400">
                            <p className="font-bold text-blue-600 text-lg mb-1">方法一：變「一樣貴」</p>
                            <p className="text-slate-600">多給原子筆 ${problem.diff} 元，兩條線變一樣長：</p>
                            <div className="bg-blue-50 p-3 rounded-lg mt-2 font-mono font-bold">
                                ${problem.sum} + ${problem.diff} = ${problem.sum + problem.diff} 元<br/>
                                筆記本 = ${problem.sum + problem.diff} ÷ 2 = ${problem.ans} 元
                            </div>
                        </div>

                        <div className="pl-4 border-l-4 border-green-400">
                            <p className="font-bold text-green-600 text-lg mb-1">方法二：變「一樣便宜」</p>
                            <p className="text-slate-600">拿走多出的 ${problem.diff} 元，兩條線變一樣短：</p>
                            <div className="bg-green-50 p-3 rounded-lg mt-2 font-mono font-bold">
                                剩下的：${problem.sum} - ${problem.diff} = ${problem.sum - problem.diff} 元<br/>
                                原子筆：${problem.sum - problem.diff} ÷ 2 = ${problem.pen} 元<br/>
                                筆記本：${problem.pen} + ${problem.diff} = ${problem.ans} 元
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
    id: 'q014',
    type: 'custom',
    title: '和差問題：筆記本與原子筆',
    q: '解開線段圖，找出正確的單價。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MyQuestionComponent} />`);
    }
};