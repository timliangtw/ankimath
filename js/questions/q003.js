const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 數字偵探實作
 * ------------------------------------------------------------------
 */

// --- 輔助元件：線索卡片 ---
const ClueCard = ({ icon, title, desc, isMet, showResult }) => {
    let borderColor = "border-slate-200";
    let bgColor = "bg-white";
    let iconColor = "text-slate-400";

    if (showResult) {
        if (isMet) {
            borderColor = "border-green-400";
            bgColor = "bg-green-50";
            iconColor = "text-green-500";
        } else {
            borderColor = "border-red-300";
            bgColor = "bg-red-50";
            iconColor = "text-red-400";
        }
    }

    return html`
        <div className=${`relative p-4 rounded-xl border-2 ${borderColor} ${bgColor} shadow-sm flex items-start gap-3 transition-all hover:-translate-y-0.5`}>
            <div className=${`p-2 rounded-full bg-white border border-slate-100 shadow-sm ${iconColor}`}>
                ${icon}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-700 text-sm md:text-base">${title}</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">${desc}</p>
            </div>
            
            <!-- 檢核結果圖示 -->
            ${showResult && html`
                <div className="absolute top-2 right-2 animate-bounce">
                    ${isMet ? html`
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ` : html`
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    `}
                </div>
            `}
        </div>
    `;
};

// --- 主程式元件 ---
const NumberDetective = () => {
    // 題目狀態
    const [targetSum, setTargetSum] = useState(6); // 預設題目是和為 6
    const [options, setOptions] = useState([]);
    const [selectedNum, setSelectedNum] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
    const [showExplanation, setShowExplanation] = useState(false);

    // 產生題目
    const generateProblem = () => {
        // 隨機決定一個 "數字和" (介於 3 ~ 9)
        const newSum = Math.floor(Math.random() * 7) + 3;
        setTargetSum(newSum);

        const correctAnswer = newSum * 10; // 答案必為 ??0

        // 產生干擾選項
        const distractors = [];

        // 干擾項 A: 數字和對了，但不是 10 的倍數
        const part1 = Math.floor(newSum / 2);
        const part2 = newSum - part1;
        if (part1 !== 0 && part2 !== 0) {
            distractors.push(part1 * 10 + part2);
            distractors.push(part2 * 10 + part1);
        } else {
            distractors.push((newSum - 1) * 10 + 1);
        }

        // 干擾項 B: 10 的倍數，但和不對
        let wrongTen = (newSum - 2) * 10;
        if (wrongTen <= 0) wrongTen = (newSum + 2) * 10;
        distractors.push(wrongTen);

        // 干擾項 C: 隨機偶數
        distractors.push((Math.floor(Math.random() * 8) + 1) * 10 + 2);

        // 組合選項並打亂
        let finalOptions = [];
        // 特別保留您原本題目要求的選項組合 (當 sum 為 6 時)
        if (newSum === 6) {
            finalOptions = [60, 42, 30, 24];
        } else {
            finalOptions = [correctAnswer, ...distractors].slice(0, 4);
        }

        // Shuffle
        finalOptions.sort(() => Math.random() - 0.5);

        setOptions(finalOptions);
        setSelectedNum(null);
        setFeedback(null);
        setShowExplanation(false);
    };

    useEffect(() => {
        generateProblem();
    }, []);

    // 檢查邏輯
    const checkConditions = (num) => {
        const isEven = num % 2 === 0;
        const isDivBy5 = num % 5 === 0;
        const tens = Math.floor(num / 10);
        const units = num % 10;
        const sumIsTarget = (tens + units) === targetSum;

        return { isEven, isDivBy5, sumIsTarget };
    };

    const handleSelect = (num) => {
        if (feedback === 'correct') return;

        setSelectedNum(num);
        const { isEven, isDivBy5, sumIsTarget } = checkConditions(num);

        if (isEven && isDivBy5 && sumIsTarget) {
            setFeedback('correct');
            setShowExplanation(true);
        } else {
            setFeedback('wrong');
            setShowExplanation(false);
        }
    };

    // 如果還沒選，預設都是 false
    const results = selectedNum ? checkConditions(selectedNum) : { isEven: false, isDivBy5: false, sumIsTarget: false };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            
            <!-- 標題區 -->
            <div className="text-center mb-8">
                <div className="inline-block bg-emerald-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3 transform -rotate-2">
                    數學偵探事務所
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    尋找神秘數
                </h1>
                <p className="text-slate-500 mt-2">
                    有一個二位數，同時符合下面三個線索，它是多少呢？
                </p>
            </div>

            <!-- 線索區 -->
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <${ClueCard} 
                    icon=${html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/></svg>`}
                    title="線索一"
                    desc="2 個一數，剛好數完 (偶數)"
                    isMet=${results.isEven}
                    showResult=${selectedNum !== null}
                />
                <${ClueCard} 
                    icon=${html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M8 12h8"/></svg>`}
                    title="線索二"
                    desc="5 個一數，剛好數完 (0或5結尾)"
                    isMet=${results.isDivBy5}
                    showResult=${selectedNum !== null}
                />
                <${ClueCard} 
                    icon=${html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`}
                    title="線索三"
                    desc=${`十位數 + 個位數 = ${targetSum}`}
                    isMet=${results.sumIsTarget}
                    showResult=${selectedNum !== null}
                />
            </div>

            <!-- 選項區 -->
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
                <h3 className="text-center text-slate-400 font-bold mb-4 text-sm">嫌疑數字名單 (請點擊選擇)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${options.map(opt => html`
                        <button
                            key=${opt}
                            onClick=${() => handleSelect(opt)}
                            disabled=${feedback === 'correct'}
                            className=${`
                                py-6 rounded-xl text-2xl md:text-3xl font-bold transition-all border-b-4
                                ${selectedNum === opt
            ? (feedback === 'correct' ? 'bg-green-500 text-white border-green-700 scale-105 shadow-lg' : 'bg-red-500 text-white border-red-700 scale-95')
            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:-translate-y-1'
        }
                            `}
                        >
                            ${opt}
                        </button>
                    `)}
                </div>
            </div>

            <!-- 回饋區 -->
            <div className="min-h-[100px] text-center">
                ${feedback === 'wrong' && html`
                    <div className="inline-flex items-center gap-2 text-red-500 bg-red-50 px-6 py-3 rounded-full border border-red-200 animate-pulse">
                        <span className="font-bold">喔喔！看看上面哪個線索被打叉了？</span>
                    </div>
                `}

                ${feedback === 'correct' && html`
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 text-green-600 bg-green-100 px-8 py-3 rounded-full border border-green-200 shadow-sm">
                            <span className="text-xl font-bold">破案了！答案就是 ${selectedNum}</span>
                        </div>

                        <!-- 推理筆記 -->
                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-left max-w-lg mx-auto">
                            <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                偵探筆記：為什麼是 ${selectedNum}？
                            </h4>
                            <ul className="space-y-3 text-slate-700 text-sm md:text-base">
                                <li className="flex items-start gap-2">
                                    <span className="bg-emerald-100 text-emerald-600 font-bold px-2 rounded mt-0.5 shrink-0">1</span>
                                    <span>要被 2 整除，也要被 5 整除，所以個位數一定要是 <strong>0</strong>。</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-emerald-100 text-emerald-600 font-bold px-2 rounded mt-0.5 shrink-0">2</span>
                                    <span>因為個位數是 0，題目說「十位 + 個位 = ${targetSum}」，代表十位數就是 <strong>${targetSum}</strong>。</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="bg-emerald-100 text-emerald-600 font-bold px-2 rounded mt-0.5 shrink-0">3</span>
                                    <span>所以答案就是 <strong>${targetSum}0</strong>！</span>
                                </li>
                            </ul>
                        </div>
                        
                        <button 
                            onClick=${generateProblem}
                            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold rounded-lg transition-colors"
                        >
                            再來一題
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
};

export default {
    id: 'number_detective',
    type: 'custom',
    title: '數字偵探：神秘的二位數',
    q: '邏輯推理與倍數判斷 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${NumberDetective} />`);
    }
};