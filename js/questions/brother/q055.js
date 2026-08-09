const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q055 - 哪一種分法可以剛好分完？
 * ------------------------------------------------------------------
 * 「平分給小明和他的 3 位同學」= 小明自己也要算，一共 4 個人。
 *   可以剛好分完 ⇔ 東西的個數能被人數整除
 * 只有一個選項整除，其餘都會剩下。
 * ------------------------------------------------------------------
 */

// 每個名字附上要用的第三人稱，避免產生「他／她」用錯的敘述
const NAMES = [
    { name: '怡萱', pronoun: '她' }, { name: '雅儒', pronoun: '她' },
    { name: '思妤', pronoun: '她' }, { name: '子晴', pronoun: '她' },
    { name: '志文', pronoun: '他' }, { name: '書凱', pronoun: '他' },
    { name: '佑新', pronoun: '他' }, { name: '宗翰', pronoun: '他' }
];
const THINGS = [
    { name: '餅乾', unit: '片', icon: '🍪' },
    { name: '糖果', unit: '顆', icon: '🍬' },
    { name: '果凍', unit: '個', icon: '🍮' },
    { name: '貼紙', unit: '張', icon: '⭐' },
    { name: '鉛筆', unit: '枝', icon: '✏️' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    for (let attempt = 0; attempt < 400; attempt++) {
        const names = shuffle(NAMES).slice(0, 4);
        const things = shuffle(THINGS).slice(0, 4);

        // 正確選項：整除
        const friends = 2 + Math.floor(Math.random() * 4);      // 同學 2~5 位
        const people = friends + 1;
        const per = 3 + Math.floor(Math.random() * 6);
        const total = people * per;

        const right = { who: names[0], friends, people, total, thing: things[0], ok: true, per };

        // 干擾：不整除
        const decoys = [];
        for (let t = 0; t < 200 && decoys.length < 3; t++) {
            const f = 2 + Math.floor(Math.random() * 4);
            const p = f + 1;
            const n = 8 + Math.floor(Math.random() * 22);
            if (n % p === 0) continue;
            const i = decoys.length + 1;
            decoys.push({ who: names[i], friends: f, people: p, total: n, thing: things[i], ok: false, rest: n % p });
        }
        if (decoys.length < 3) continue;

        const options = shuffle([right, ...decoys]);
        return { options };
    }
    return null;
}

const ShareEvenlyProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        let p = null;
        for (let i = 0; i < 5 && !p; i++) p = generateProblem();
        setProblem(p);
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (idx) => {
        if (gameState === 'correct') return;
        setSelected(idx);
        if (problem.options[idx].ok) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { options } = problem;
    const rightIdx = options.findIndex(o => o.ok);
    const text = (o) => `把 ${o.total} ${o.thing.unit}${o.thing.name}平分給${o.who.name}和${o.who.pronoun}的 ${o.friends} 位同學`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-6">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    除法與整除
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    下面哪一種分法可以<span className="text-amber-600">剛好分完</span>？
                </h1>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
                ${options.map((opt, idx) => {
                    const isSelected = selected === idx;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${idx}
                            onClick=${() => handleSelect(idx)}
                            disabled=${isDisabled}
                            className=${`
                                px-4 py-3 rounded-2xl text-base md:text-lg font-bold text-left transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${opt.thing.icon} ${text(opt)}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        別忘了「他自己」也要分到，人數要多算 1 個喔。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${options.map((o, i) => html`
                            <div key=${i} className="flex justify-between items-center text-sm">
                                <span>(${i + 1}) ${o.total} ÷ ${o.people} 人：</span>
                                <span className=${`font-black ${o.ok ? 'text-green-600' : 'text-red-400'}`}>
                                    ${o.ok ? `每人 ${o.per} ${o.thing.unit}，剛好分完` : `每人 ${Math.floor(o.total / o.people)} ${o.thing.unit}，還剩 ${o.rest} ${o.thing.unit}`}
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-sm text-slate-500">
                            「和他的 N 位同學」要記得加上他自己，一共是 N + 1 個人。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">(${rightIdx + 1}) ✓</span>
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
    id: 'q055',
    type: 'custom',
    title: '哪一種分法可以剛好分完？',
    q: '除法與整除：別忘了算自己（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${ShareEvenlyProblem} />`);
    }
};
