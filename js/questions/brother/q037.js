const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q037 - 對話裡的年齡差：爺爺比妹妹大幾歲？
 * ------------------------------------------------------------------
 * 妹妹 → 哥哥 → 爸爸 → 爺爺，每一段都只給「差幾歲」
 *   爺爺比妹妹大 = 第一段 + 第二段 + 第三段
 * 關鍵：問「大幾歲」時，其實用不到妹妹今年幾歲（那是干擾條件）。
 * ------------------------------------------------------------------
 */

function generateProblem() {
    for (let attempt = 0; attempt < 200; attempt++) {
        const youngAge = 3 + Math.floor(Math.random() * 6);      // 妹妹 3~8 歲
        const gapBrother = 2 + Math.floor(Math.random() * 4);    // 哥哥大 2~5
        const gapDad = 20 + Math.floor(Math.random() * 11);      // 爸爸大 20~30
        const gapGrandpa = 20 + Math.floor(Math.random() * 9);   // 爺爺大 20~28

        const answer = gapBrother + gapDad + gapGrandpa;
        const brotherAge = youngAge + gapBrother;
        const dadAge = brotherAge + gapDad;
        const grandpaAge = dadAge + gapGrandpa;

        const wrongSet = new Set();
        for (const w of [grandpaAge, gapDad + gapGrandpa, gapBrother + gapDad, answer + youngAge, answer - youngAge]) {
            if (w > 0 && w !== answer) wrongSet.add(w);
            if (wrongSet.size >= 3) break;
        }
        if (wrongSet.size < 3) continue;

        const options = [...wrongSet, answer].sort(() => Math.random() - 0.5);
        return { youngAge, gapBrother, gapDad, gapGrandpa, brotherAge, dadAge, grandpaAge, answer, options };
    }
    return {
        youngAge: 3, gapBrother: 2, gapDad: 23, gapGrandpa: 21,
        brotherAge: 5, dadAge: 28, grandpaAge: 49, answer: 46,
        options: [44, 46, 49, 51]
    };
}

const AgeChainProblem = () => {
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
        if (opt === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { youngAge, gapBrother, gapDad, gapGrandpa, brotherAge, dadAge, grandpaAge, answer, options } = problem;

    const bubble = (who, icon, text, color) => html`
        <div className="flex items-center gap-2">
            <span className="text-3xl">${icon}</span>
            <div className=${`rounded-2xl border-2 px-3 py-2 text-base md:text-lg font-bold ${color}`}>
                <span className="text-xs block text-slate-500">${who}</span>
                ${text}
            </div>
        </div>
    `;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-5">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    年齡的差
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800">
                    下面是可欣、豪豪、爸爸和爺爺的對話。
                </h1>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 mb-6 space-y-3">
                ${bubble('可欣', '👧', `我今年 ${youngAge} 歲。`, 'bg-white border-amber-200 text-slate-700')}
                ${bubble('豪豪（對可欣說）', '👦', `我比你大 ${gapBrother} 歲。`, 'bg-white border-amber-200 text-slate-700')}
                ${bubble('爸爸（對豪豪說）', '👨', `你比我小 ${gapDad} 歲。`, 'bg-white border-amber-200 text-slate-700')}
                ${bubble('爺爺（對爸爸說）', '👴', `我比你大 ${gapGrandpa} 歲。`, 'bg-white border-amber-200 text-slate-700')}
            </div>

            <p className="text-center text-xl md:text-2xl font-bold text-slate-700 mb-5">
                爺爺比可欣大幾歲？
            </p>

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
                            (${idx + 1})  ${opt} 歲
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        一段一段接起來：可欣到豪豪、豪豪到爸爸、爸爸到爺爺，差距要全部加起來。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>可欣 ${youngAge} 歲，豪豪大 ${gapBrother} 歲：</span>
                            <span className="font-black text-blue-600">豪豪 ${brotherAge} 歲</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>爸爸比豪豪大 ${gapDad} 歲：</span>
                            <span className="font-black text-blue-600">爸爸 ${dadAge} 歲</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>爺爺比爸爸大 ${gapGrandpa} 歲：</span>
                            <span className="font-black text-blue-600">爺爺 ${grandpaAge} 歲</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-green-100 pt-2">
                            <span>爺爺比可欣大：</span>
                            <span className="font-black text-amber-600">${grandpaAge} − ${youngAge} = ${answer} 歲</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            也可以把三段差距直接加起來：${gapBrother} + ${gapDad} + ${gapGrandpa} = ${answer} 歲，
                            根本不用知道可欣幾歲。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 歲 ✓</span>
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
    id: 'q037',
    type: 'custom',
    title: '爺爺比可欣大幾歲？',
    q: '年齡的差：把每一段差距接起來（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${AgeChainProblem} />`);
    }
};
