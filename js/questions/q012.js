const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目：q012 摺紙剪紙邏輯挑戰
 * ------------------------------------------------------------------
 */

const MyQuestionComponent = () => {
    // --- 1. 狀態管理 (State) ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', or null
    const [score, setScore] = useState(0);

    // 題庫資料
    const quizData = [
        {
            id: 1,
            title: "混合剪法題",
            // 摺疊圖 (寬 100)
            foldedSvg: html`
                <svg width="100" height="240" viewBox="0 0 100 240">
                    <rect x="0" y="0" width="100" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="4" />
                    <rect x="0" y="20" width="30" height="40" fill="white" />
                    <polygon points="50,0 70,30 90,0" fill="white" />
                    <rect x="80" y="210" width="20" height="30" fill="white" />
                    <path d="M 100,150 A 30,30 0 0 0 100,200" fill="white" />
                </svg>
            `,
            // 展開圖 (寬 200)
            unfoldedSvg: html`
                <svg width="200" height="240" viewBox="0 0 200 240">
                    <rect x="0" y="0" width="200" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="8,4" />
                    <rect x="0" y="20" width="30" height="40" fill="white" /><rect x="170" y="20" width="30" height="40" fill="white" />
                    <polygon points="50,0 70,30 90,0" fill="white" /><polygon points="110,0 130,30 150,0" fill="white" />
                    <rect x="80" y="210" width="40" height="30" fill="white" />
                    <circle cx="100" cy="175" r="30" fill="white" />
                </svg>
            `,
            options: ["1個圓、2個長方形、2個三角形", "1個圓、3個長方形、2個三角形", "2個圓、1個長方形、1個三角形"],
            correct: 1,
            explanation: "中間摺線處：半圓變 1個圓形，邊緣小方塊變成了 1個大長方形。旁邊開口處：三角形跟小長方形都變成了 2個！"
        },
        {
            id: 2,
            title: "摺線對稱練習",
            foldedSvg: html`
                <svg width="100" height="240" viewBox="0 0 100 240">
                    <rect x="0" y="0" width="100" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="4" />
                    <path d="M 100,60 L 60,90 L 100,120" fill="white" />
                    <path d="M 100,160 A 30,30 0 0 0 100,220" fill="white" />
                </svg>
            `,
            unfoldedSvg: html`
                <svg width="200" height="240" viewBox="0 0 200 240">
                    <rect x="0" y="0" width="200" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="8,4" />
                    <polygon points="100,60 60,90 100,120 140,90" fill="white" />
                    <circle cx="100" cy="190" r="30" fill="white" />
                </svg>
            `,
            options: ["一個圓形和一個菱形", "兩個圓形和兩個三角形", "一個圓形和一個正方形"],
            correct: 0,
            explanation: "所有的剪裁都在摺線上！所以展開後會併在一起：半圓變圓形，那個三角形展開就變成了菱形喔！"
        },
        {
            id: 3,
            title: "開口複製練習",
            foldedSvg: html`
                <svg width="100" height="240" viewBox="0 0 100 240">
                    <rect x="0" y="0" width="100" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="4" />
                    <circle cx="30" cy="60" r="20" fill="white" />
                    <rect x="20" y="160" width="40" height="40" fill="white" />
                </svg>
            `,
            unfoldedSvg: html`
                <svg width="200" height="240" viewBox="0 0 200 240">
                    <rect x="0" y="0" width="200" height="240" fill="#bae6fd" stroke="#0ea5e9" stroke-width="2" />
                    <line x1="100" y1="0" x2="100" y2="240" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="8,4" />
                    <circle cx="30" cy="60" r="20" fill="white" /><circle cx="170" cy="60" r="20" fill="white" />
                    <rect x="20" y="160" width="40" height="40" fill="white" /><rect x="140" y="160" width="40" height="40" fill="white" />
                </svg>
            `,
            options: ["1個圓、1個正方形", "2個圓、2個正方形", "4個三角形"],
            correct: 1,
            explanation: "這次都剪在旁邊開口處！剪一刀會切到兩層紙，所以展開會像照鏡子，變出左右各一個。"
        }
    ];

    const currentProblem = quizData[currentIndex];

    // --- 2. 邏輯處理 (Handlers) ---
    const checkAnswer = (idx) => {
        if (feedback === 'correct') return;
        setSelectedOption(idx);
        if (idx === currentProblem.correct) {
            setFeedback('correct');
            setScore(score + 1);
        } else {
            setFeedback('wrong');
        }
    };

    const nextQuestion = () => {
        let next = (currentIndex + 1) % quizData.length;
        setCurrentIndex(next);
        setSelectedOption(null);
        setFeedback(null);
    };

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <div className="w-full font-sans text-left mx-auto">
            
            <!-- 區域 A: 題目顯示區 (摺疊圖) -->
            <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100 relative mb-8">
                <span className="absolute -top-3 -left-3 bg-emerald-500 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    第 ${currentIndex + 1} 題
                </span>
                
                <p className="text-xl font-bold text-slate-700 text-center mb-6">
                    這是摺起來剪過的紙，展開後會變什麼？
                </p>
                
                <div className="flex justify-center bg-white/50 rounded-xl p-4 border border-emerald-100 shadow-inner">
                    ${currentProblem.foldedSvg}
                </div>
                <p className="text-center text-xs text-slate-400 mt-2">（右邊深色線是摺痕）</p>
            </div>

            <!-- 區域 B: 選項區 -->
            <div className="flex flex-col gap-3">
                ${currentProblem.options.map((opt, idx) => html`
                    <button
                        key=${idx}
                        onClick=${() => checkAnswer(idx)}
                        disabled=${feedback === 'correct'}
                        className="w-full p-5 text-left border-4 rounded-2xl transition-all flex items-center gap-4 
                        ${selectedOption === idx ? (idx === currentProblem.correct ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50') : 'border-slate-100 bg-white hover:border-emerald-300'}"
                    >
                        <span className="w-8 h-8 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">${idx + 1}</span>
                        <span className="text-lg font-bold text-slate-700">${opt}</span>
                    </button>
                `)}

                <!-- 回饋訊息 -->
                ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-center animate-pulse mt-2">
                        不對喔，再仔細看看圖形的位置！
                    </div>
                `}
            </div>

            <!-- 區域 C: 詳解區 (展開圖) -->
            ${feedback === 'correct' && html`
                <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-100 shadow-sm animate-fade-in text-center">
                    <h3 className="font-bold text-blue-700 text-xl mb-4">🎉 答對了！打開看結果：</h3>
                    
                    <div className="flex justify-center bg-white rounded-xl p-4 mb-4 shadow-sm border border-blue-200">
                        ${currentProblem.unfoldedSvg}
                    </div>

                    <p className="text-slate-700 leading-relaxed text-left">
                        💡 <span className="font-bold text-blue-600">原理分析：</span><br/>
                        ${currentProblem.explanation}
                    </p>

                    <button
                        onClick=${nextQuestion}
                        className="mt-6 px-10 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all"
                    >
                        挑戰下一題
                    </button>
                </div>
            `}

            <!-- 分數統計 -->
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-slate-400 font-bold text-sm">
                目前答對題數：${score} | 加油，小小科學家！
            </div>
        </div>
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q012',
    type: 'custom',
    title: '摺紙剪紙邏輯挑戰',
    q: '觀察摺紙與剪下的洞，預測展開後的圖形種類',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MyQuestionComponent} />`);
    }
};