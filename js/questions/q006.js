const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

// --- 圖示元件 ---
const User = ({ size = 24, strokeWidth = 2, className = "" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth=${strokeWidth} strokeLinecap="round" strokeLinejoin="round" className=${className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
`;
const CheckCircle2 = ({ size = 24 }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
    </svg>
`;
const XCircle = ({ size = 24 }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="m15 9-6 6" />
        <path d="m9 9 6 6" />
    </svg>
`;
const HelpCircle = ({ size = 24 }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
    </svg>
`;

// --- 主程式邏輯 ---
const QueuePractice = () => {
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const generateProblem = () => {
        const type = Math.floor(Math.random() * 3) + 1;
        let n1, n2, answer, questionText, explanationText;
        const targetName = "小明";

        if (type === 1) {
            // 題型一：前後加總 (+1)
            n1 = Math.floor(Math.random() * 5) + 1;
            n2 = Math.floor(Math.random() * 5) + 1;
            answer = n1 + n2 + 1;
            questionText = `${targetName}去排隊，他的「前面」有 ${n1} 個人，他的「後面」有 ${n2} 個人。請問這排隊伍「總共有」幾個人？`;
            explanationText = `前面 ${n1} 人 + ${targetName}自己 1 人 + 後面 ${n2} 人 = ${answer} 人`;
        } else if (type === 2) {
            // 題型二：重疊扣除 (-1)
            const total = Math.floor(Math.random() * 6) + 5;
            n1 = Math.floor(Math.random() * (total - 1)) + 1;
            n2 = total - n1 + 1;
            answer = total;
            questionText = `${targetName}在排隊，從「前面」數過來他是第 ${n1} 個，從「後面」數過來他是第 ${n2} 個。請問這排隊伍「總共有」幾個人？`;
            explanationText = `從前面數第 ${n1} 個，從後面數第 ${n2} 個，${targetName}被數了兩次，所以要扣掉一次喔！ ${n1} + ${n2} - 1 = ${answer} 人`;
        } else {
            // 題型三：單邊推算 (直接加)
            n1 = Math.floor(Math.random() * 5) + 1;
            n2 = Math.floor(Math.random() * 5) + 1;
            answer = n1 + n2;
            questionText = `${targetName}排在第 ${n1} 個，他的「後面」還有 ${n2} 個人。請問這排隊伍「總共有」幾個人？`;
            explanationText = `排第 ${n1} 個的意思就是包含${targetName}前面已經有 ${n1} 人了，再加上後面的 ${n2} 人，就是總人數囉！`;
        }

        setProblem({ type, n1, n2, answer, questionText, explanationText, targetName });
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

        if (num === problem.answer) {
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

    const Visualizer = () => {
        if (!problem) return null;

        let items = [];
        const total = problem.answer;
        let targetIndex = -1;

        if (problem.type === 1) targetIndex = problem.n1;
        else if (problem.type === 2) targetIndex = problem.n1 - 1;
        else if (problem.type === 3) targetIndex = problem.n1 - 1;

        for (let i = 0; i < total; i++) {
            const isTarget = i === targetIndex;
            let label = '';
            let subLabel = '';

            if (problem.type === 1) {
                if (i < targetIndex) label = '前';
                if (i > targetIndex) label = '後';
            } else if (problem.type === 2) {
                if (i === targetIndex) subLabel = `前${problem.n1}/後${problem.n2}`;
            } else if (problem.type === 3) {
                if (i < targetIndex) label = `${i + 1}`;
                if (i > targetIndex) label = '後';
            }

            items.push(html`
                <div key=${i} className="flex flex-col items-center mx-1 animate-[fade-in_0.3s_ease-out]">
                    <div className=${`relative w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border-4 text-2xl mb-1 shadow-sm transition-all
                        ${isTarget
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700 scale-110 z-10'
                    : 'bg-white border-blue-200 text-blue-400'
                }`}>
                        ${isTarget ? html`<${User} size=${28} strokeWidth=${2.5} />` : html`<${User} size=${20} />`}
                        <div className="absolute -top-8 text-xs font-bold text-gray-400">
                            ${i + 1}
                        </div>
                    </div>

                    ${isTarget && html`<span className="text-sm font-bold text-yellow-700 whitespace-nowrap">${problem.targetName}</span>`}
                    ${!isTarget && label && html`<span className="text-xs text-blue-400">${label}</span>`}
                    ${isTarget && subLabel && html`<span className="text-[10px] text-yellow-600 bg-yellow-50 px-1 rounded whitespace-nowrap mt-1">${subLabel}</span>`}
                </div>
            `);
        }

        return html`
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto w-full">
                <div className="text-center text-sm text-gray-500 mb-12 font-bold flex items-center justify-center gap-2">
                    <${HelpCircle} size=${16} />
                    圖解小教室：數數看這裡有幾個人？
                </div>
                <div className="flex justify-center items-end min-w-max pb-2 px-4">
                    ${items}
                </div>
                <div className="mt-4 text-center p-3 bg-white rounded-lg border border-yellow-100 shadow-sm">
                    <p className="text-lg text-slate-700 font-bold">
                        ${problem.explanationText}
                    </p>
                </div>
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left">
            <!-- 題目區塊 (移除外層的大 Card 樣式，只保留內容區塊) -->
            <div className="bg-amber-50 rounded-2xl p-6 border-2 border-amber-100 relative mb-8">
                <span className="absolute -top-3 -left-3 bg-amber-400 text-white px-3 py-1 rounded-lg font-bold shadow-sm transform -rotate-3">
                    題目
                </span>
                <p className="text-2xl md:text-3xl font-bold text-slate-700 leading-relaxed text-center mt-12">
                    ${problem ? problem.questionText : '載入中...'}
                </p>
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
                    <span className="text-2xl font-bold text-slate-400">人</span>
                </div>

                <!-- 確認按鈕 -->
                ${!feedback && html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xl font-bold rounded-2xl shadow-lg shadow-sky-200 transition-all flex items-center justify-center gap-2"
                    >
                        <${CheckCircle2} size=${24} />
                        送出答案
                    </button>
                `}
                
                <!-- 答錯時顯示重試提示 (不顯示再練一題按鈕) -->
                 ${feedback === 'wrong' && html`
                    <div className="text-red-500 font-bold text-lg animate-pulse">
                        答案不對喔，再試試看！(或點擊下方「看答案」)
                    </div>
                `}
            </div>

            <!-- 回饋與圖解區 (答對或答錯都可能顯示) -->
            ${feedback && html`
                <div className=${`transition-all duration-500 ease-out mt-6 ${showExplanation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="flex justify-center mb-4">
                        ${feedback === 'correct' ? html`
                            <div className="flex items-center gap-2 text-green-500 bg-green-50 px-6 py-2 rounded-full border border-green-200">
                                <${CheckCircle2} size=${28} />
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
    id: 'q006',
    type: 'custom',
    title: '排隊邏輯小學堂 (互動)',
    q: '排隊邏輯題目 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${QueuePractice} />`);
    }
};
