const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * 互動題目模板 (Template) - 數列規則檢查器 (無限題庫版)
 * ------------------------------------------------------------------
 */

// 允許的規則：加2, 加5, 加10
const ALLOWED_DIFFS = [2, 5, 10];

const SequenceCheckerGame = () => {
    // --- 1. 狀態管理 (State) ---
    const [sequences, setSequences] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [results, setResults] = useState({});
    const [gameState, setGameState] = useState('playing'); // playing, won

    // --- 2. 邏輯處理 (Logic) ---

    // 動態題目生成器
    const generateGameData = () => {
        const correctStep = ALLOWED_DIFFS[Math.floor(Math.random() * ALLOWED_DIFFS.length)];

        // 1. 生成正確數列 (固定間隔)
        const start1 = Math.floor(Math.random() * 50) + 10;
        const correctSeq = {
            id: 1,
            nums: Array.from({ length: 6 }, (_, i) => start1 + i * correctStep),
            desc: '選項 (1)',
            type: 'correct'
        };

        // 2. 生成錯誤數列 A (亂跳：間隔不固定)
        const start2 = Math.floor(Math.random() * 50) + 10;
        const nums2 = [start2];
        for (let i = 0; i < 5; i++) {
            const step = ALLOWED_DIFFS[Math.floor(Math.random() * ALLOWED_DIFFS.length)];
            nums2.push(nums2[nums2.length - 1] + step);
        }
        const wrongSeqA = { id: 2, nums: nums2, desc: '選項 (2)', type: 'random_step' };

        // 3. 生成錯誤數列 B (跳過：中間突然加倍)
        const start3 = Math.floor(Math.random() * 50) + 10;
        const step3 = ALLOWED_DIFFS[Math.floor(Math.random() * ALLOWED_DIFFS.length)];
        const nums3 = [start3];
        const errorIdx = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < 5; i++) {
            let currentStep = step3;
            if (i === errorIdx) currentStep = step3 * 2;
            nums3.push(nums3[nums3.length - 1] + currentStep);
        }
        const wrongSeqB = { id: 3, nums: nums3, desc: '選項 (3)', type: 'jump_error' };

        // 4. 生成錯誤數列 C (非法間隔：例如 +3, +4)
        const start4 = Math.floor(Math.random() * 50) + 10;
        const badStep = [3, 4, 6, 7][Math.floor(Math.random() * 4)];
        const nums4 = Array.from({ length: 6 }, (_, i) => start4 + i * badStep);
        const wrongSeqC = { id: 4, nums: nums4, desc: '選項 (4)', type: 'bad_step' };

        // 洗牌與重設
        const all = [correctSeq, wrongSeqA, wrongSeqB, wrongSeqC];
        all.sort(() => Math.random() - 0.5);

        // 重新編號顯示文字
        all.forEach((seq, idx) => {
            seq.desc = `選項 (${idx + 1})`;
            seq.id = idx + 1;
        });

        setSequences(all);
        setResults({});
        setSelectedId(null);
        setGameState('playing');
    };

    // 初始化
    useEffect(() => {
        generateGameData();
    }, []);

    // 檢查運算邏輯
    const calculateResult = (seq) => {
        const diffs = [];
        let isAllAllowed = true;
        let isConsistent = true;
        let errorIndex = -1;

        const firstDiff = seq.nums[1] - seq.nums[0];

        for (let i = 0; i < seq.nums.length - 1; i++) {
            const diff = seq.nums[i + 1] - seq.nums[i];
            const isOk = ALLOWED_DIFFS.includes(diff);

            if (!isOk) {
                isAllAllowed = false;
                if (errorIndex === -1) errorIndex = i;
            }

            if (diff !== firstDiff) {
                isConsistent = false;
                if (errorIndex === -1) errorIndex = i;
            }

            diffs.push({ val: diff, isOk: isOk });
        }

        const isValid = isAllAllowed && isConsistent;

        // 如果是因為不規律而錯誤，標記那個不規律的間隔為 False
        if (!isValid && isAllAllowed && !isConsistent) {
            diffs.forEach((d) => {
                if (d.val !== firstDiff) d.isOk = false;
            });
        }

        return { diffs, isValid, errorIndex };
    };

    // 處理作答
    const handleAnswer = (seqId) => {
        if (gameState === 'won') return;

        const seq = sequences.find(s => s.id === seqId);
        const result = calculateResult(seq);

        setResults(prev => ({ ...prev, [seqId]: result }));
        setSelectedId(seqId);

        if (result.isValid) {
            setGameState('won');
        } else {
            setGameState('playing');
        }
    };

    // --- 3. 畫面渲染 (Render) ---
    return html`
        <div className="w-full font-sans text-left mx-auto max-w-4xl">
            
            <!-- 標題區 -->
            <div className="text-center mb-8">
                <div className="inline-block bg-indigo-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    數列邏輯測驗
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
                    哪一個是按照規則排的？
                </h1>
                <p className="text-slate-500 text-sm md:text-base">
                    請找出 <span className="text-indigo-600 font-bold">固定增加</span> 2、5 或 10 的數列！
                </p>
            </div>

            <!-- 選項列表 -->
            <div className="flex flex-col gap-6">
                ${sequences.map((seq) => {
        const result = results[seq.id];
        const isSelected = selectedId === seq.id;
        const isCorrect = result?.isValid;
        const isWrong = result && !result.isValid;

        return html`
                        <button 
                            key=${seq.id}
                            onClick=${() => handleAnswer(seq.id)}
                            disabled=${gameState === 'won' && !isCorrect}
                            className=${`
                                w-full text-left relative bg-white rounded-2xl p-4 md:p-6 border-4 transition-all shadow-sm group
                                ${isWrong && isSelected ? 'border-red-200 ring-4 ring-red-50 animate-pulse' : ''}
                                ${isCorrect ? 'border-green-400 ring-4 ring-green-50 scale-[1.02] z-10' : ''}
                                ${!result ? 'border-slate-100 hover:border-indigo-200 hover:shadow-md cursor-pointer' : ''}
                            `}
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className=${`
                                        font-bold px-3 py-1 rounded-lg text-sm transition-colors
                                        ${isCorrect ? 'bg-green-100 text-green-700' :
                isWrong ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
                                    `}>
                                        ${seq.desc}
                                    </span>

                                    ${result && html`
                                        <span className="text-sm font-bold flex items-center gap-1 animate-bounce">
                                            ${isCorrect ? html`
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                    答對了！
                                                </span>
                                            ` : html`
                                                <span className="text-red-500 flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                    這裡怪怪的...
                                                </span>
                                            `}
                                        </span>
                                    `}
                                </div>
                            </div>

                            <!-- 數字與間隔視覺化 -->
                            <div className="relative pt-6 pb-2 overflow-x-auto">
                                <div className="flex items-center gap-1 md:gap-2 min-w-[600px]">
                                    ${seq.nums.map((num, idx) => html`
                                        <div className=${`
                                            w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-lg md:text-2xl font-bold border-2 shrink-0 z-10 transition-colors duration-500
                                            ${isCorrect ? 'bg-green-50 border-green-200 text-green-700' :
                        isWrong && (idx === result.errorIndex || idx === result.errorIndex + 1) ? 'bg-red-50 border-red-200 text-red-600' :
                            'bg-white border-slate-200 text-slate-600'}
                                        `}>
                                            ${num}
                                        </div>

                                        ${idx < seq.nums.length - 1 && html`
                                            <div className="flex-1 flex flex-col items-center relative h-10 justify-start -mt-4 min-w-[60px]">
                                                ${result && html`
                                                    <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none" className="absolute top-4">
                                                        <path d="M0 25 Q50 0 100 25" fill="none" 
                                                              stroke=${result.diffs[idx].isOk ? "#22c55e" : "#f87171"} 
                                                              strokeWidth="2" strokeDasharray="4 2" />
                                                        <path d="M95 22 L100 25 L95 28" fill="none" 
                                                              stroke=${result.diffs[idx].isOk ? "#22c55e" : "#f87171"} 
                                                              strokeWidth="2" />
                                                    </svg>
                                                    
                                                    <div className=${`
                                                        absolute top-0 text-xs md:text-sm font-bold px-2 py-0.5 rounded-full transition-all duration-500
                                                        ${result.diffs[idx].isOk
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-600 ring-2 ring-red-200'}
                                                    `} style=${{ transitionDelay: `${idx * 100}ms` }}>
                                                        +${result.diffs[idx].val}
                                                        ${!result.diffs[idx].isOk && html`<span className="ml-1 text-[10px]">(X)</span>`}
                                                    </div>
                                                `}
                                            </div>
                                        `}
                                    `)}
                                </div>
                            </div>
                            
                            ${isWrong && isSelected && html`
                                <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700 flex items-start gap-2 animate-pulse text-left">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                                    <span>
                                        發現問題了！<br/>
                                        ${result.diffs.some(d => !ALLOWED_DIFFS.includes(d.val))
                    ? html`<span>這裡增加了 <strong>${result.diffs[result.errorIndex].val}</strong>，不符合「2, 5, 10」的規則喔。</span>`
                    : html`<span>這裡規則變了！應該要<strong>固定</strong>增加同一個數字才對。</span>`
                }
                                    </span>
                                </div>
                            `}
                        </button>
                    `;
    })}
            </div>
            
            ${gameState === 'won' && html`
                <div className="mt-8 text-center animate-bounce">
                    <button 
                        onClick=${generateGameData}
                        className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        再玩一次 (換題目)
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q004',
    type: 'custom',
    title: '數列規則檢查器',
    q: '數列邏輯測驗 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${SequenceCheckerGame} />`);
    }
};