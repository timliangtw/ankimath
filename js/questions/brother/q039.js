const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q039 - 野餐登記表：一共有幾個人參加？
 * ------------------------------------------------------------------
 * 每個人都登記帶 K 樣物品，統計表上是所有人登記的物品總數
 *   參加人數 = 物品總數 ÷ K
 * 表格用「正」字記號呈現，要先把四類加起來。
 * ------------------------------------------------------------------
 */

const CATEGORIES = ['水果類', '餐點類', '飲料類', '器具類'];

// 「正」字的五個筆畫，依序畫出來就是 1~5
const TALLY_STROKES = [
    'M5,4 H19',
    'M10,4 V22',
    'M10,13 H18',
    'M18,13 V22',
    'M4,22 H20'
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const perPerson = 2 + Math.floor(Math.random() * 3);       // 每人帶 2~4 樣
        const people = 8 + Math.floor(Math.random() * 8);          // 8~15 個人
        const total = perPerson * people;

        // 四類每類至少 2 樣、最多 14 樣（正字才畫得下），所以總數不能超過 56
        if (total < 8 || total > 52) continue;

        // 把總數拆成四類
        const counts = [2, 2, 2, 2];
        let rest = total - 8;
        let guard = 0;
        while (rest > 0 && guard++ < 2000) {
            const i = Math.floor(Math.random() * 4);
            if (counts[i] >= 14) continue;
            counts[i]++;
            rest--;
        }
        if (rest > 0) continue;

        const wrongSet = new Set();
        for (const w of [total, people + perPerson, total - people, people + 2, people - 2]) {
            if (Number.isInteger(w) && w > 0 && w !== people) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = shuffle([...wrongSet].slice(0, 3).concat(people));
        return { perPerson, people, total, counts, options };
    }
    return { perPerson: 3, people: 10, total: 30, counts: [7, 10, 6, 7], options: [4, 10, 20, 30] };
}

const Tally = ({ count }) => {
    const full = Math.floor(count / 5);
    const rest = count % 5;
    const groups = [...Array.from({ length: full }, () => 5), ...(rest ? [rest] : [])];
    return html`
        <div className="flex flex-wrap justify-center gap-1">
            ${groups.map((n, i) => html`
                <svg key=${i} viewBox="0 0 24 26" className="w-5 h-6">
                    ${TALLY_STROKES.slice(0, n).map((d, k) => html`
                        <path key=${k} d=${d} stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                    `)}
                </svg>
            `)}
        </div>
    `;
};

const PicnicTallyProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (opt) => {
        if (gameState === 'correct') return;
        setSelected(opt);
        if (opt === problem.people) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { perPerson, people, total, counts, options } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    統計表應用題
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    小芳和同事們週末要去野餐，每個人把要準備的物品登記成下表。
                    如果每個人都登記帶 <span className="text-blue-600">${perPerson} 樣物品</span>，
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    參加野餐活動的一共有多少個人？
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-6">
                <div className="grid grid-cols-4 gap-1">
                    ${CATEGORIES.map((name, i) => html`
                        <div key=${name} className="bg-white border-2 border-amber-200 rounded-xl p-2 text-center">
                            <div className="text-xs font-bold text-amber-700 mb-1">${name}</div>
                            <${Tally} count=${counts[i]} />
                        </div>
                    `)}
                </div>
                <p className="text-center text-xs text-slate-500 font-bold mt-2">一個「正」字代表 5 樣</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === opt;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(opt)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1})  ${opt} 個人
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        先把四類物品全部加起來，再想想每個人帶 ${perPerson} 樣，可以分給幾個人。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${CATEGORIES.map((name, i) => html`
                            <div key=${name} className="flex justify-between items-center text-sm">
                                <span>${name}：</span>
                                <span className="font-bold text-slate-600">${counts[i]} 樣</span>
                            </div>
                        `)}
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span>物品總數：</span>
                            <span className="font-black text-amber-600">${counts.join(' + ')} = ${total} 樣</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>每人帶 ${perPerson} 樣：</span>
                            <span className="font-black text-blue-600">${total} ÷ ${perPerson} = ${people} 個人</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${people} 個人 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q039',
    type: 'custom',
    title: '野餐登記表：一共有幾個人？',
    q: '統計表：先合計再平分（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${PicnicTallyProblem} />`);
    }
};
