const { useState, useEffect, useMemo } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 零用錢逆向思考應用題
 * ------------------------------------------------------------------
 */

// --- 輔助元件：小豬撲滿 SVG ---
const PiggyIcon = ({ className }) => html`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className=${className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.1"/>
        <path d="M19 12h-2v2h2v-2zm-4 0h-2v2h2v-2zm-4 0H9v2h2v-2zm-4 0H5v2h2v-2zm12-4h-2v2h2V8zm-4 0h-2v2h2V8zm-4 0H9v2h2V8zm-4 0H5v2h2V8z" opacity="0.0"/>
        <path d="M20.5 10.5c.3 0 .5-.2.5-.5V8c0-1.1-.9-2-2-2h-1V5c0-.55-.45-1-1-1s-1 .45-1 1v1h-2V5c0-.55-.45-1-1-1s-1 .45-1 1v1h-2V5c0-.55-.45-1-1-1s-1 .45-1 1v1h-2V5c0-.55-.45-1-1-1s-1 .45-1 1v1H9V5c0-.55-.45-1-1-1s-1 .45-1 1v1H6c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2.5c0-.3-.2-.5-.5-.5s-.5.2-.5.5V19H6V8h13v2c0 .3.2.5.5.5zM8 12h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z" fill="#ec4899"/>
        <!-- 簡單的硬幣投幣口 -->
        <rect x="9" y="4" width="6" height="1" rx="0.5" fill="#db2777"/>
    </svg>
`;

// --- 主程式元件 ---
const PocketMoney = () => {
    // 1. 狀態管理
    const [startMoney, setStartMoney] = useState(21); // 上週剩下
    const [totalMoney, setTotalMoney] = useState(76); // 現在總共
    const [dadGiven, setDadGiven] = useState(55);     // 爸爸給的 (正確答案)

    const [options, setOptions] = useState([]);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', 'trap_add'

    // 2. 邏輯計算
    // 初始化與隨機出題
    const generateProblem = (isRandom = false) => {
        let start, total, given;

        if (!isRandom) {
            // 預設題目 (使用者指定的數字)
            start = 21;
            total = 76;
            given = 55;
            // 特殊選項：題目給的 50, 55, 57, 97
            setOptions([50, 55, 57, 97]);
        } else {
            // 隨機出題 (讓孩子多練習)
            start = Math.floor(Math.random() * 30) + 10; // 10~39
            given = Math.floor(Math.random() * 50) + 10; // 10~59
            total = start + given;

            // 產生選項
            const correct = given;
            const trapAdd = start + total; // 加法陷阱
            const trapNear = correct + (Math.random() > 0.5 ? 2 : -2); // 接近陷阱
            const trapRandom = Math.floor(Math.random() * 90) + 10;

            const newOpts = [correct, trapAdd, trapNear, trapRandom].sort(() => Math.random() - 0.5);
            // 去重
            const uniqueOpts = [...new Set(newOpts)];
            while (uniqueOpts.length < 4) {
                uniqueOpts.push(Math.floor(Math.random() * 90) + 10);
            }

            setStartMoney(start);
            setTotalMoney(total);
            setDadGiven(correct);
            setOptions(uniqueOpts.sort((a, b) => a - b));
        }

        setFeedback(null);
    };

    useEffect(() => {
        generateProblem(false); // 第一次載入使用指定題目
    }, []);

    const checkAnswer = (ans) => {
        if (ans === dadGiven) {
            setFeedback('correct');
        } else if (ans === startMoney + totalMoney) {
            setFeedback('trap_add');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();// 孩子把兩個數字加起來了
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();}
    };

    // 3. 畫面渲染
    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            
            <!-- 標題 -->
            <div className="text-center mb-8">
                <div className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3 transform rotate-1">
                    應用題：錢變多了？
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                    爸爸這星期給了多少零用錢？
                </h1>
            </div>

            <!-- 視覺化情境區 -->
            <div className="bg-white rounded-2xl p-6 shadow-md border-b-8 border-pink-200 mb-8 relative overflow-hidden">
                <!-- 時間軸線 -->
                <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-100 -z-0"></div>

                <div className="flex justify-between items-end relative z-10">
                    
                    <!-- 1. 上個星期 -->
                    <div className="flex flex-col items-center gap-2 group cursor-help">
                        <div className="bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-500 font-bold mb-1">上星期剩下</div>
                        <div className="relative">
                            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center border-4 border-pink-200 text-slate-400 group-hover:scale-110 transition-transform">
                                <span className="text-2xl font-black text-pink-500">$${startMoney}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 箭頭與運算符號 -->
                    <div className="flex flex-col items-center pb-6">
                        <span className="text-slate-400 text-sm font-bold mb-1">爸爸給了</span>
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center border-2 border-dashed border-yellow-400 animate-pulse">
                            <span className="text-2xl font-bold text-yellow-600">?</span>
                        </div>
                        <div className="mt-2 text-slate-300 font-bold text-xl">+</div>
                    </div>

                    <!-- 2. 這個星期 (總共) -->
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-slate-100 px-3 py-1 rounded-full text-xs text-slate-500 font-bold mb-1">現在一共有</div>
                        <div className="relative">
                            <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center border-4 border-pink-600 text-white shadow-lg animate-bounce">
                                <span className="text-3xl font-black">$${totalMoney}</span>
                            </div>
                            <!-- 金幣動畫裝飾 -->
                            ${feedback === 'correct' && html`
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">✨</div>
                            `}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 題目問句 -->
            <div className="text-center mb-6">
                <p className="text-lg text-slate-600 font-bold">
                    原本有 <span className="text-pink-500">$${startMoney}</span>，加上爸爸給的錢，變成 <span className="text-pink-600">$${totalMoney}</span>。<br/>
                    請問爸爸給了多少？
                </p>
            </div>

            <!-- 選項區 -->
            <div className="grid grid-cols-2 gap-4 mb-8">
                ${options.map(opt => html`
                    <button
                        key=${opt}
                        onClick=${() => checkAnswer(opt)}
                        disabled=${feedback === 'correct'}
                        className=${`
                            py-4 rounded-xl text-2xl font-bold transition-all border-b-4 flex items-center justify-center gap-2
                            ${feedback === 'correct' && opt === dadGiven
            ? 'bg-green-500 text-white border-green-700 scale-105 shadow-lg'
            : (feedback === 'trap_add' || feedback === 'wrong') && opt !== dadGiven
                ? 'bg-white text-slate-400 border-slate-200 opacity-50' // 答錯時淡化其他
                : 'bg-white text-slate-700 border-slate-200 hover:bg-pink-50 hover:border-pink-300 hover:-translate-y-1'
        }
                            ${(feedback === 'trap_add' || feedback === 'wrong') && opt === (feedback === 'trap_add' ? startMoney + totalMoney : opt) ? '!bg-red-100 !text-red-500 !border-red-200' : ''}
                        `}
                    >
                        $${opt}
                    </button>
                `)}
            </div>

            <!-- 回饋與詳解區 -->
            <div className="min-h-[150px]">
                ${feedback && html`
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all duration-500">
                        
                        ${feedback === 'trap_add' && html`
                            <div className="text-center text-red-500 font-bold mb-4">
                                <div className="text-xl mb-2">喔喔！太多了！</div>
                                <p className="text-slate-600 font-normal">
                                    如果爸爸給了 $${startMoney + totalMoney}，<br/>
                                    加上原本的 $${startMoney}，你會變成 <strong className="text-red-500">$${startMoney + totalMoney + startMoney}</strong> 耶！(變成大富翁了)
                                </p>
                            </div>
                        `}

                        ${feedback === 'wrong' && html`
                            <div className="text-center text-slate-500 font-bold">
                                再試試看！想想看是用加法還是減法？
                            </div>
                        `}

                        ${feedback === 'correct' && html`
                            <div className="space-y-4">
                                <div className="text-center text-green-600 font-bold text-2xl mb-4 flex items-center justify-center gap-2">
                                    <span>🎉 答對了！</span>
                                </div>

                                <!-- 算式圖解 -->
                                <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
                                    <h3 className="text-pink-800 font-bold mb-3 border-b border-pink-200 pb-2">解題魔法：倒過來想</h3>
                                    
                                    <div className="flex items-center justify-center gap-2 text-lg md:text-xl font-bold text-slate-700">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-slate-400 mb-1">全部</span>
                                            <span className="bg-white px-3 py-1 rounded border border-slate-200">$${totalMoney}</span>
                                        </div>
                                        <span className="text-slate-400">-</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-slate-400 mb-1">原本</span>
                                            <span className="bg-white px-3 py-1 rounded border border-slate-200">$${startMoney}</span>
                                        </div>
                                        <span className="text-slate-400">=</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-pink-500 mb-1">爸爸給的</span>
                                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded border border-yellow-300">$${dadGiven}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 text-sm text-slate-600 text-center">
                                        把原本就在存錢筒裡的 <strong>$${startMoney}</strong> 拿出來，<br/>
                                        剩下的就是爸爸給的錢囉！
                                    </div>
                                </div>

                                <button onClick=${() => generateProblem(true)} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors">
                                    換一題數字練習
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
    id: 'q008',
    type: 'custom',
    title: '零用錢計算機：爸爸給了多少？',
    q: '應用題：錢變多了 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PocketMoney} />`);
    }
};