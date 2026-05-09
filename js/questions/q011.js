const { useState, useEffect } = React;
const { createRoot } = ReactDOM;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目：郵局排隊問題 (Post Office Queue)
 * ------------------------------------------------------------------
 */

// --- Icons (Inline SVGs to replace lucide-react) ---
const IconSend = ({ size = 24, color = "currentColor" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
`;

const IconRefreshCw = ({ size = 24, color = "currentColor" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </svg>
`;

const IconCheckCircle = ({ size = 24, color = "currentColor" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
`;

const IconXCircle = ({ size = 24, color = "currentColor" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
`;

const IconUser = ({ size = 24, color = "currentColor" }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke=${color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
`;

const App = () => {
    const [problem, setProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [status, setStatus] = useState('answering'); // 'answering', 'correct', 'wrong'
    const [showExplanation, setShowExplanation] = useState(false);

    // 初始化題目
    useEffect(() => {
        generateProblem();
    }, []);

    const generateProblem = () => {
        // 設定合理的範圍給低年級學生
        // 號碼牌範圍 20 ~ 50
        const myNum = Math.floor(Math.random() * 31) + 20;
        // 等待人數範圍 5 ~ 15 (確保算出來不是負數)
        const waiting = Math.floor(Math.random() * 11) + 5;

        // 計算邏輯：正在辦理 = (我的號碼 - 1) - 等待人數
        // 例如：我28號，前面那個人是27號。有11人等待，代表27往回推11人還沒辦。
        const serving = (myNum - 1) - waiting;

        setProblem({
            myNumber: myNum,
            waitingCount: waiting,
            servingNumber: serving
        });
        setUserAnswer('');
        setStatus('answering');
        setShowExplanation(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!userAnswer) return;

        const val = parseInt(userAnswer);
        if (val === problem.servingNumber) {
            setStatus('correct');
            setShowExplanation(true);
        } else {
            setStatus('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setShowExplanation(true);
        }
    };

    // 視覺化排隊組件
    const QueueVisualizer = ({ problem }) => {
        const { myNumber, waitingCount, servingNumber } = problem;
        const items = [];

        // 1. 正在辦理的人 (Serving)
        items.push({ type: 'serving', num: servingNumber, label: '正在辦理' });

        // 2. 等待的人 (Waiting)
        // 為了版面簡潔，如果等待人數太多，中間用省略號
        const startWait = servingNumber + 1;
        const endWait = myNumber - 1;

        // 加入第一個等待的人
        items.push({ type: 'waiting', num: startWait, label: '等待中' });

        if (waitingCount > 3) {
            items.push({ type: 'dots', count: waitingCount - 2 }); // 減去頭尾顯示的
            items.push({ type: 'waiting', num: endWait, label: '等待中' });
        } else {
            // 人數少，全部列出來
            for (let i = startWait + 1; i <= endWait; i++) {
                items.push({ type: 'waiting', num: i, label: '等待中' });
            }
        }

        // 3. 我 (Me)
        items.push({ type: 'me', num: myNumber, label: '張媽媽' });

        return html`
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                <h3 className="text-center text-slate-500 font-bold mb-4">
                    👇 排隊圖解 👇
                </h3>
                <div className="flex flex-wrap items-end justify-center gap-2 sm:gap-4">
                    ${items.map((item, idx) => {
            if (item.type === 'dots') {
                return html`
                                <div key=${idx} className="flex flex-col items-center pb-4">
                                    <span className="text-slate-400 font-bold text-lg tracking-widest">...還有${item.count}人...</span>
                                </div>
                            `;
            }

            let bgColor = 'bg-gray-200';
            let borderColor = 'border-gray-300';
            let textColor = 'text-gray-500';
            let icon = html`<${IconUser} size=${20} />`;

            if (item.type === 'serving') {
                bgColor = 'bg-green-100';
                borderColor = 'border-green-500';
                textColor = 'text-green-700';
                icon = html`<${IconCheckCircle} size=${20} />`;
            } else if (item.type === 'me') {
                bgColor = 'bg-blue-100';
                borderColor = 'border-blue-500';
                textColor = 'text-blue-700';
                icon = html`<${IconUser} size=${20} />`;
            }

            return html`
                            <div key=${idx} className="flex flex-col items-center animate-bounce-short">
                                <!-- 氣泡標籤 -->
                                <div className=${`mb-2 px-2 py-1 text-xs rounded-full ${bgColor} ${textColor} font-bold whitespace-nowrap`}>
                                    ${item.label}
                                </div>
                                <!-- 人物圓圈 -->
                                <div className=${`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 flex items-center justify-center text-lg sm:text-xl font-bold bg-white shadow-sm ${borderColor} ${textColor}`}>
                                    ${item.num}
                                </div>
                            </div>
                        `;
        })}
                </div>

                <!-- 文字解說 -->
                <div className="mt-6 text-left bg-white p-4 rounded-lg border border-slate-200 text-slate-600 text-sm sm:text-base leading-relaxed">
                    <p className="mb-2"><strong>思路小幫手：</strong></p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>張媽媽拿到了 <span className="text-blue-600 font-bold">${myNumber}號</span>，所以排在她正前面還沒輪到的人是 <span className="text-slate-500 font-bold">${myNumber - 1}號</span>。</li>
                        <li>因為還有 <span className="text-orange-500 font-bold">${waitingCount}人</span> 在等待，我們從 ${myNumber - 1}號 往前推 ${waitingCount} 個人。</li>
                        <li>算式：${myNumber - 1} (前一位) - ${waitingCount} (等待人數) = <span className="text-green-600 font-bold text-lg">${servingNumber}</span> 號。</li>
                    </ul>
                </div>
            </div>
        `;
    };

    if (!problem) return html`<div className="p-10 text-center">載入中...</div>`;

    return html`
        <div className="w-full font-sans">
            
            <!-- 標題區 -->
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-black text-slate-700 flex items-center justify-center gap-2">
                    📮 郵局排隊小教室
                </h1>
                <p className="text-slate-500 mt-2">適合低年級的數學邏輯練習</p>
            </header>

            <!-- 題目卡片 -->
            <div className="max-w-xl mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border-b-8 border-blue-200">
                <div className="bg-blue-500 p-6 text-white text-center">
                    <h2 className="text-xl font-bold opacity-90">請仔細讀題</h2>
                </div>
                
                <div className="p-6 sm:p-10">
                    <div className="text-xl sm:text-2xl leading-loose text-slate-700 font-medium">
                        張媽媽到郵局寄信，<br/>
                        抽號碼牌前看到機器顯示有 
                        <span className="mx-2 inline-block px-3 py-1 bg-orange-100 text-orange-600 rounded-lg border-2 border-orange-300 font-bold transform -rotate-2">
                            ${problem.waitingCount}
                        </span> 
                        個人在等待。<br/>
                        
                        張媽媽抽到了 
                        <span className="mx-2 inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-lg border-2 border-blue-300 font-bold transform rotate-2">
                            ${problem.myNumber}號
                        </span>。
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <p className="text-lg text-slate-600 mb-4 font-bold text-center">請問：現在櫃檯正在辦理幾號？</p>
                        
                        <form onSubmit=${handleSubmit} className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value=${userAnswer}
                                    onChange=${(e) => setUserAnswer(e.target.value)}
                                    disabled=${status === 'correct'}
                                    placeholder="?"
                                    className=${`w-32 h-20 text-center text-4xl font-bold rounded-2xl border-4 outline-none focus:ring-4 transition-all
                                        ${status === 'wrong' ? 'border-red-300 bg-red-50 focus:ring-red-200 text-red-600' :
            status === 'correct' ? 'border-green-300 bg-green-50 text-green-600' :
                'border-slate-200 focus:border-blue-400 focus:ring-blue-100 text-slate-700'}`}
                                />
                                <span className="absolute -right-8 bottom-6 text-xl text-slate-400 font-bold">號</span>
                            </div>

                            ${status === 'answering' && html`
                                <button 
                                    type="submit"
                                    className="w-full sm:w-auto px-10 py-3 bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold rounded-full shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <${IconSend} size=${24} />
                                    檢查答案
                                </button>
                            `}
                        </form>
                    </div>
                </div>

                <!-- 回饋與解釋區域 -->
                ${showExplanation && html`
                    <div className=${`p-6 border-t-2 ${status === 'correct' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <div className="text-center mb-4">
                            ${status === 'correct' ? html`
                                <div className="animate-bounce">
                                    <h3 className="text-2xl font-black text-green-600 flex items-center justify-center gap-2">
                                        <${IconCheckCircle} size=${32} /> 答對了！太棒了！
                                    </h3>
                                </div>
                            ` : html`
                                <div>
                                    <h3 className="text-2xl font-black text-red-500 flex items-center justify-center gap-2">
                                        <${IconXCircle} size=${32} /> 哎呀，再想一下！
                                    </h3>
                                    <p className="text-red-400 mt-1">正確答案是 <b>${problem.servingNumber}</b> 號喔。</p>
                                </div>
                            `}
                        </div>

                        <${QueueVisualizer} problem=${problem} />

                        <div className="mt-8 flex justify-center">
                            <button 
                                onClick=${generateProblem}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold rounded-full shadow-lg transform transition active:scale-95 flex items-center gap-2"
                            >
                                <${IconRefreshCw} size=${20} />
                                再來一題
                            </button>
                        </div>
                    </div>
                `}
            </div>

            <footer className="mt-8 text-slate-400 text-sm mb-20 text-center">
                爸爸設計給小朋友的數學練習
            </footer>
        </div>
    `;
};

// --- 設定檔 (Metadata) ---
export default {
    id: 'q011', // 題目ID
    type: 'custom',
    title: '郵局排隊問題',
    q: '數學邏輯練習：序數與基數的應用',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${App} />`);
    }
};