const { useState, useEffect } = React;
const html = htm.bind(React.createElement);

// --- 角色資料與設定 ---
const CHARACTERS = [
    { id: 'A', name: 'A', color: 'bg-red-400', avatar: '🦊', clue: '我不是排在最後一個。' },
    { id: 'B', name: 'B', color: 'bg-blue-400', avatar: '🐰', clue: '我前面的人是 D。' },
    { id: 'C', name: 'C', color: 'bg-green-400', avatar: '🐻', clue: '我後面有 2 個人。' },
    { id: 'D', name: 'D', color: 'bg-purple-400', avatar: '🐱', clue: '我不是排在第一個。' },
];

// 正確答案順序 (A, C, D, B)
const CORRECT_ORDER = ['A', 'C', 'D', 'B'];

// --- 主程式邏輯 ---
const LogicGame = () => {
    // 狀態：目前 4 個位置上分別是誰 (null 代表空的)
    const [slots, setSlots] = useState([null, null, null, null]);
    // 狀態：目前選中的角色 (準備放置)
    const [selectedChar, setSelectedChar] = useState(null);
    // 狀態：回饋與解答顯示
    const [feedback, setFeedback] = useState(null); // 'correct', 'wrong', null
    const [showExplanation, setShowExplanation] = useState(false);

    // 處理點擊角色庫中的角色
    const handleCharClick = (charId) => {
        if (feedback === 'correct') return;
        // 如果該角色已經在盤面上了，先把它拿下來
        if (slots.includes(charId)) {
            const newSlots = slots.map(s => s === charId ? null : s);
            setSlots(newSlots);
        }
        setSelectedChar(charId);
    };

    // 處理點擊目標位置
    const handleSlotClick = (index) => {
        if (feedback === 'correct') return;

        // 如果有點選角色，則放置該角色
        if (selectedChar) {
            const newSlots = [...slots];

            // 1. 如果選中的角色原本就在其他格子，先清空舊格子
            const oldIndex = slots.indexOf(selectedChar);
            if (oldIndex !== -1) {
                newSlots[oldIndex] = null;
            }

            // 2. 放置新角色
            newSlots[index] = selectedChar;
            setSlots(newSlots);
            setSelectedChar(null); // 放完後取消選取
        } else {
            // 如果沒選角色，點擊格子代表把格子裡的人拿下來
            if (slots[index]) {
                const newSlots = [...slots];
                newSlots[index] = null;
                setSlots(newSlots);
            }
        }
    };

    // 檢查答案
    const checkAnswer = () => {
        // 檢查是否都填滿了
        if (slots.some(s => s === null)) {
            // 這裡不使用 alert，改用簡單的 UI 提示或忽略
            return;
        }

        // 比對答案
        const isCorrect = slots.every((charId, index) => charId === CORRECT_ORDER[index]);

        if (isCorrect) {
            setFeedback('correct');
            setShowExplanation(true);
        } else {
            setFeedback('wrong');
            setShowExplanation(true);
        }
    };

    // 重置
    const resetGame = () => {
        setSlots([null, null, null, null]);
        setFeedback(null);
        setShowExplanation(false);
        setSelectedChar(null);
    };

    return html`
        <div className="w-full font-sans text-left mx-auto">
            
            <!-- 標題區 -->
            <div className="text-center mb-8">
                <div className="inline-block bg-yellow-400 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-2 transform -rotate-2">
                    邏輯推理小學堂
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">誰排在哪裡？</h1>
                <p className="text-slate-500 mt-2">請根據提示，幫 A, B, C, D 排排隊</p>
            </div>

            <!-- 提示區 (Clues) -->
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                ${CHARACTERS.map(char => html`
                    <div key=${char.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className=${`w-12 h-12 ${char.color} rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0`}>
                            ${char.avatar}
                        </div>
                        <div>
                            <span className="font-bold text-slate-700 mr-2">${char.name} 說:</span>
                            <span className="text-slate-600 font-medium">「${char.clue}」</span>
                        </div>
                    </div>
                `)}
            </div>

            <!-- 遊戲區 (Slots) -->
            <div className="bg-slate-100 p-4 md:p-8 rounded-3xl border-2 border-slate-200 shadow-inner mb-8 relative">
                <!-- 位置標示 -->
                <div className="flex justify-between w-full mb-2 px-1">
                    ${['第1個', '第2個', '第3個', '第4個'].map((label, i) => html`
                        <div key=${i} className="text-xs md:text-sm font-bold text-slate-400 w-16 md:w-24 text-center">
                            ${label}
                        </div>
                    `)}
                </div>

                <!-- 排隊格子 -->
                <div className="flex justify-between items-center relative z-10 gap-2">
                    ${slots.map((charId, index) => {
        const char = CHARACTERS.find(c => c.id === charId);
        return html`
                            <div 
                                key=${index}
                                onClick=${() => handleSlotClick(index)}
                                className=${`
                                    w-16 h-24 md:w-24 md:h-32 bg-white rounded-xl border-2 border-dashed 
                                    flex items-center justify-center cursor-pointer transition-all duration-200
                                    ${!char ? 'border-slate-300 hover:bg-slate-50' : 'border-transparent bg-transparent'}
                                    ${selectedChar && !char ? 'animate-pulse ring-2 ring-yellow-400 ring-offset-2' : ''}
                                `}
                            >
                                ${char ? html`
                                    <div className=${`
                                        w-full h-full ${char.color} rounded-xl shadow-lg border-b-4 border-black/10
                                        flex flex-col items-center justify-center text-white
                                        hover:scale-105 transition-transform
                                    `}>
                                        <span className="text-3xl md:text-5xl mb-1">${char.avatar}</span>
                                        <span className="font-bold text-lg md:text-2xl">${char.name}</span>
                                    </div>
                                ` : html`
                                    <span className="text-slate-300 text-3xl font-bold opacity-20">${index + 1}</span>
                                `}
                            </div>
                        `;
    })}
                    
                    <!-- 地板線 -->
                    <div className="absolute bottom-2 left-0 w-full h-2 bg-slate-200 rounded-full -z-10"></div>
                </div>

                <!-- 題目問句重點 -->
                <div className="absolute -bottom-5 right-2 md:right-6 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 rotate-1">
                     <span className="text-slate-500 text-sm font-bold">誰排在第 3 個？</span>
                </div>
            </div>

            <!-- 角色選擇區 (Inventory) -->
            <div className="flex justify-center gap-4 mb-8">
                ${CHARACTERS.map(char => {
        const isPlaced = slots.includes(char.id);
        const isSelected = selectedChar === char.id;
        return html`
                        <button
                            key=${char.id}
                            onClick=${() => handleCharClick(char.id)}
                            className=${`
                                w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all shadow-sm
                                ${isPlaced ? 'bg-slate-200 text-slate-400 cursor-default scale-90 grayscale' : `${char.color} text-white hover:scale-110 shadow-lg`}
                                ${isSelected ? 'ring-4 ring-yellow-400 scale-110 -translate-y-2' : ''}
                            `}
                            disabled=${isPlaced}
                        >
                            ${char.name}
                        </button>
                    `;
    })}
            </div>

            <!-- 控制區 -->
            <div className="flex flex-col items-center gap-4">
                ${!feedback ? html`
                    <button
                        onClick=${checkAnswer}
                        className="w-full md:w-auto px-12 py-4 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-xl font-bold rounded-2xl shadow-lg shadow-sky-200 transition-all"
                    >
                        送出答案
                    </button>
                ` : html`
                    <div className="flex flex-col items-center gap-4">
                        <div className=${`text-xl font-bold px-6 py-2 rounded-full ${feedback === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                            ${feedback === 'correct' ? '🎉 答對了！太厲害了！' : '🤔 嗯...好像哪裡怪怪的，再檢查一下？'}
                        </div>
                        ${feedback === 'wrong' ? html`
                            <button 
                                onClick=${() => setFeedback(null)}
                                className="text-slate-500 underline hover:text-slate-700"
                            >
                                繼續嘗試
                            </button>
                        ` : null}
                    </div>
                `}
            </div>

            <!-- 詳解區域 -->
            ${(showExplanation || feedback === 'wrong') ? html`
                <div className=${`mt-8 transition-all duration-500 ${showExplanation ? 'opacity-100' : 'opacity-0'}`}>
                    ${feedback === 'wrong' ? html`
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-4 text-center">
                            <p className="text-yellow-800 font-bold mb-2">💡 小提示</p>
                            <p className="text-slate-600">
                                試著先看看 <strong className="text-green-600">C</strong> 說的話，
                                他說「後面有2個人」，那他應該排在第幾個呢？
                            </p>
                        </div>
                    ` : null}

                    ${feedback === 'correct' ? html`
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                邏輯解密步驟
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <span className="bg-green-100 text-green-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</span>
                                    <div>
                                        <p className="font-bold text-slate-700">先找最確定的線索</p>
                                        <p className="text-slate-600 text-sm">
                                            C 說「後面有2個人」。因為總共才4個位置，所以 C 一定在 <strong className="text-green-600">第 2 個</strong>。
                                            <br/><span className="text-xs text-slate-400">(如果是第1個後面有3人，第3個後面只有1人)</span>
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-blue-100 text-blue-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</span>
                                    <div>
                                        <p className="font-bold text-slate-700">找出連在一起的人</p>
                                        <p className="text-slate-600 text-sm">
                                            B 說「前面是 D」。這表示 <strong className="text-purple-600">D</strong> 和 <strong className="text-blue-600">B</strong> 必須黏在一起 (D, B)。
                                            因為第 2 個位置已經是 C 了，所以 D 和 B 只能排在 <strong className="text-slate-800">第 3 和 第 4</strong>。
                                        </p>
                                    </div>
                                </li>
                                <li className="flex gap-3">
                                    <span className="bg-red-100 text-red-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</span>
                                    <div>
                                        <p className="font-bold text-slate-700">最後剩下的位置</p>
                                        <p className="text-slate-600 text-sm">
                                            只剩下第 1 個位置了，那一定就是 <strong className="text-red-600">A</strong> 囉！
                                            <br/>檢查一下：A說「我不是最後」(正確)，D說「我不是第一」(正確)。
                                        </p>
                                    </div>
                                </li>
                                <li className="p-3 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                                    <p className="font-bold text-amber-800">
                                        最終答案：第 3 個位置是 <span className="text-2xl align-middle">🐱</span> D！
                                    </p>
                                </li>
                            </ul>
                            <div className="mt-6 text-center">
                                <button onClick=${resetGame} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold">
                                    再玩一次
                                </button>
                            </div>
                        </div>
                    ` : null}
                </div>
            ` : null}
        </div>
    `;
};

export default {
    id: 'q001',
    type: 'custom',
    title: '邏輯推理：誰排在哪裡？',
    q: '位置邏輯推理 (點擊開啟互動介面)',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${LogicGame} />`);
    }
};