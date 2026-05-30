const { useState } = React;
const html = htm.bind(React.createElement);

const PUZZLE_VARIANTS = [
    {
        order: ['A', 'C', 'D', 'B'],
        characters: [
            { id: 'A', name: 'A', color: 'bg-red-400', avatar: '🦊', clue: '我不是排在最後一個。' },
            { id: 'B', name: 'B', color: 'bg-blue-400', avatar: '🐰', clue: '我前面的人是 D。' },
            { id: 'C', name: 'C', color: 'bg-green-400', avatar: '🐻', clue: '我後面有 2 個人。' },
            { id: 'D', name: 'D', color: 'bg-purple-400', avatar: '🐱', clue: '我不是排在第一個。' },
        ],
        hint: '試著先看看 C 說的話，他說「後面有2個人」，那他應該排在第幾個呢？',
        steps: [
            { color: 'green', title: '先找最確定的線索', body: 'C 說「後面有2個人」。4個位置中，只有第 2 個位置後面有2人，所以 C 一定在第 2 個。' },
            { color: 'blue', title: '找出連在一起的人', body: 'B 說「前面是 D」，表示 D 和 B 相鄰（D→B）。第 2 是 C，所以只能是 D=3、B=4。' },
            { color: 'red', title: '最後剩下的位置', body: '只剩第 1 個位置，所以 A 排第 1。確認：A「不是最後」✓，D「不是第一」✓。' },
        ],
        finalNote: '最終順序：A → C → D → B',
    },
    {
        order: ['C', 'A', 'D', 'B'],
        characters: [
            { id: 'A', name: 'A', color: 'bg-red-400', avatar: '🦊', clue: '我後面有 2 個人。' },
            { id: 'B', name: 'B', color: 'bg-blue-400', avatar: '🐰', clue: '我是最後一個。' },
            { id: 'C', name: 'C', color: 'bg-green-400', avatar: '🐻', clue: '我排在最前面。' },
            { id: 'D', name: 'D', color: 'bg-purple-400', avatar: '🐱', clue: '我前面的人是 A。' },
        ],
        hint: '試著先看 C 和 B 說的話，一個說最前、一個說最後，先把他們放好！',
        steps: [
            { color: 'green', title: '先找確定的兩端', body: 'C 說「排在最前面」→ C=第1個。B 說「是最後一個」→ B=第4個。' },
            { color: 'blue', title: '用數量推理', body: 'A 說「後面有2個人」→ A 在第 2 個（後面有 D 和 B）。' },
            { color: 'red', title: '驗證最後一個', body: 'D 說「前面是 A」。A 在第 2，D 在第 3，正好相鄰！所有提示都符合。' },
        ],
        finalNote: '最終順序：C → A → D → B',
    },
    {
        order: ['D', 'A', 'C', 'B'],
        characters: [
            { id: 'A', name: 'A', color: 'bg-red-400', avatar: '🦊', clue: '我前面的人是 D。' },
            { id: 'B', name: 'B', color: 'bg-blue-400', avatar: '🐰', clue: '我是最後一個。' },
            { id: 'C', name: 'C', color: 'bg-green-400', avatar: '🐻', clue: '我後面只有 1 個人。' },
            { id: 'D', name: 'D', color: 'bg-purple-400', avatar: '🐱', clue: '我後面有 3 個人。' },
        ],
        hint: '試著先看 D 說的話，他說「後面有3個人」，一共才4個位置，他能排在哪裡呢？',
        steps: [
            { color: 'green', title: '先找最確定的線索', body: 'D 說「後面有3個人」。只有第 1 個位置後面有3人，所以 D=第1個。' },
            { color: 'blue', title: '找出連在一起的人', body: 'A 說「前面是 D」。D=第1，所以 A=第2，兩人緊鄰。' },
            { color: 'red', title: '用數量定位', body: 'C 說「後面只有1個人」→ C=第3個。B 說「是最後一個」→ B=第4個。全部對上！' },
        ],
        finalNote: '最終順序：D → A → C → B',
    },
    {
        order: ['B', 'D', 'A', 'C'],
        characters: [
            { id: 'A', name: 'A', color: 'bg-red-400', avatar: '🦊', clue: '我後面只有 1 個人。' },
            { id: 'B', name: 'B', color: 'bg-blue-400', avatar: '🐰', clue: '我後面有 3 個人。' },
            { id: 'C', name: 'C', color: 'bg-green-400', avatar: '🐻', clue: '我是最後一個。' },
            { id: 'D', name: 'D', color: 'bg-purple-400', avatar: '🐱', clue: '我前面的人是 B。' },
        ],
        hint: '試著先看 B 和 C 說的話，B說「後面有3個人」，C說「是最後一個」，先把他們放好！',
        steps: [
            { color: 'green', title: '先找確定的兩端', body: 'B 說「後面有3個人」→ B=第1個。C 說「是最後一個」→ C=第4個。' },
            { color: 'blue', title: '找出連在一起的人', body: 'D 說「前面是 B」。B=第1，所以 D=第2，緊鄰在後。' },
            { color: 'red', title: '驗證最後的位置', body: 'A 說「後面只有1個人」→ A=第3個（後面只有C）。所有提示都對上了！' },
        ],
        finalNote: '最終順序：B → D → A → C',
    },
];

const STEP_COLORS = {
    green: { dot: 'bg-green-100 text-green-700', title: 'text-slate-700' },
    blue:  { dot: 'bg-blue-100 text-blue-700',  title: 'text-slate-700' },
    red:   { dot: 'bg-red-100 text-red-700',    title: 'text-slate-700' },
};

const pickVariant = (exclude) => {
    const pool = exclude ? PUZZLE_VARIANTS.filter(v => v !== exclude) : PUZZLE_VARIANTS;
    return pool[Math.floor(Math.random() * pool.length)];
};

const LogicGame = () => {
    const [variant, setVariant] = useState(() => pickVariant(null));
    const [slots, setSlots] = useState([null, null, null, null]);
    const [selectedChar, setSelectedChar] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const handleCharClick = (charId) => {
        if (feedback === 'correct') return;
        if (slots.includes(charId)) {
            setSlots(slots.map(s => s === charId ? null : s));
        }
        setSelectedChar(charId);
    };

    const handleSlotClick = (index) => {
        if (feedback === 'correct') return;
        if (selectedChar) {
            const newSlots = [...slots];
            const oldIndex = slots.indexOf(selectedChar);
            if (oldIndex !== -1) newSlots[oldIndex] = null;
            newSlots[index] = selectedChar;
            setSlots(newSlots);
            setSelectedChar(null);
        } else if (slots[index]) {
            const newSlots = [...slots];
            newSlots[index] = null;
            setSlots(newSlots);
        }
    };

    const checkAnswer = () => {
        if (slots.some(s => s === null)) return;
        const isCorrect = slots.every((charId, i) => charId === variant.order[i]);
        if (isCorrect) {
            setFeedback('correct');
            setShowExplanation(true);
        } else {
            setFeedback('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setShowExplanation(true);
        }
    };

    const resetGame = () => {
        setVariant(v => pickVariant(v));
        setSlots([null, null, null, null]);
        setFeedback(null);
        setShowExplanation(false);
        setSelectedChar(null);
    };

    const pos3Char = variant.characters.find(c => c.id === variant.order[2]);

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

            <!-- 提示區 -->
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                ${variant.characters.map(char => html`
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

            <!-- 遊戲區 -->
            <div className="bg-slate-100 p-4 md:p-8 rounded-3xl border-2 border-slate-200 shadow-inner mb-8 relative">
                <div className="flex justify-between w-full mb-2 px-1">
                    ${['第1個', '第2個', '第3個', '第4個'].map((label, i) => html`
                        <div key=${i} className="text-xs md:text-sm font-bold text-slate-400 w-16 md:w-24 text-center">
                            ${label}
                        </div>
                    `)}
                </div>

                <div className="flex justify-between items-center relative z-10 gap-2">
                    ${slots.map((charId, index) => {
                        const char = variant.characters.find(c => c.id === charId);
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
                    <div className="absolute bottom-2 left-0 w-full h-2 bg-slate-200 rounded-full -z-10"></div>
                </div>

                <div className="absolute -bottom-5 right-2 md:right-6 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200 rotate-1">
                    <span className="text-slate-500 text-sm font-bold">誰排在第 3 個？</span>
                </div>
            </div>

            <!-- 角色選擇區 -->
            <div className="flex justify-center gap-4 mb-8">
                ${variant.characters.map(char => {
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
                            <p className="text-slate-600">${variant.hint}</p>
                        </div>
                    ` : null}

                    ${feedback === 'correct' ? html`
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                邏輯解密步驟
                            </h3>
                            <ul className="space-y-4">
                                ${variant.steps.map((step, i) => {
                                    const c = STEP_COLORS[step.color];
                                    return html`
                                        <li key=${i} className="flex gap-3">
                                            <span className=${`${c.dot} font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0`}>${i + 1}</span>
                                            <div>
                                                <p className="font-bold text-slate-700">${step.title}</p>
                                                <p className="text-slate-600 text-sm">${step.body}</p>
                                            </div>
                                        </li>
                                    `;
                                })}
                                <li className="p-3 bg-amber-50 rounded-lg border border-amber-100 mt-2">
                                    <p className="font-bold text-amber-800">
                                        ${variant.finalNote}。第 3 個是 ${pos3Char.avatar} ${pos3Char.name}！
                                    </p>
                                </li>
                            </ul>
                            <div className="mt-6 text-center">
                                <button onClick=${resetGame} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 font-bold">
                                    換一題試試
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
