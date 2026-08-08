const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q033 - 弄丟的藏寶圖：只有一個人說真話
 * ------------------------------------------------------------------
 * 3 個山洞，每個洞主人各說一句話，其中只有一個人說真話。
 * 解法：把「寶圖在 1 號 / 2 號 / 3 號」逐一假設，
 *       算出每種情況下有幾句是真話，剛好 1 句的那個就是答案。
 * 產生題目時會確保只有一個位置能讓真話數 = 1（答案唯一）。
 * ------------------------------------------------------------------
 */

const PEOPLE = ['🧔', '👩', '🧑'];

function statementIsTrue(st, treasure) {
    return st.kind === 'in' ? treasure === st.target : treasure !== st.target;
}

function generateProblem() {
    for (let attempt = 0; attempt < 500; attempt++) {
        const statements = [0, 1, 2].map(speaker => ({
            speaker,
            kind: Math.random() < 0.5 ? 'in' : 'not-in',
            target: 1 + Math.floor(Math.random() * 3)
        }));

        const counts = [1, 2, 3].map(c =>
            statements.filter(st => statementIsTrue(st, c)).length
        );

        const candidates = [1, 2, 3].filter(c => counts[c - 1] === 1);
        if (candidates.length !== 1) continue;

        // 三句話不能完全一樣，否則題目太無聊
        const keys = new Set(statements.map(s => `${s.kind}-${s.target}`));
        if (keys.size < 2) continue;

        return { statements, answer: candidates[0], counts };
    }

    return {
        statements: [
            { speaker: 0, kind: 'in', target: 1 },
            { speaker: 1, kind: 'not-in', target: 1 },
            { speaker: 2, kind: 'not-in', target: 2 }
        ],
        answer: 2,
        counts: [2, 1, 2]
    };
}

const TreasureMapProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (cave) => {
        if (gameState === 'correct') return;
        setSelected(cave);
        if (cave === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { statements, answer, counts } = problem;
    const sentence = (st) => st.kind === 'in'
        ? `藏寶圖在 ${st.target} 號山洞裡。`
        : `藏寶圖不在 ${st.target} 號山洞裡。`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-5">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    邏輯推理
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    藏寶圖藏在某一個山洞裡。三個山洞的主人各說了一句話，
                    但是<span className="text-red-500">只有一個人說了真話</span>。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    藏寶圖在幾號山洞裡呢？
                </p>
            </div>

            <!-- 三個洞主人的話 -->
            <div className="space-y-3 mb-6">
                ${statements.map((st, idx) => html`
                    <div key=${idx} className="flex items-center gap-3 bg-amber-50 border-2 border-amber-100 rounded-2xl p-3">
                        <div className="text-center shrink-0">
                            <div className="text-3xl">${PEOPLE[idx]}</div>
                            <div className="text-xs font-black text-amber-700">${idx + 1} 號洞主人</div>
                        </div>
                        <div className="bg-white border-2 border-amber-200 rounded-2xl px-4 py-2 text-base md:text-lg font-bold text-slate-700">
                            「${sentence(st)}」
                        </div>
                    </div>
                `)}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                ${[1, 2, 3].map(cave => {
                    const isSelected = selected === cave;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${cave}
                            onClick=${() => handleSelect(cave)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            ⛰️<br />${cave} 號洞
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        一個一個試試看：假設藏寶圖在 1 號洞，這三句話會有幾句是真的？
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-3 border border-green-100">
                        ${[1, 2, 3].map(cave => html`
                            <div key=${cave} className=${`rounded-xl p-2 ${cave === answer ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                                <div className="font-bold mb-1">
                                    假設藏寶圖在 ${cave} 號洞：
                                    <span className=${`font-black ${cave === answer ? 'text-green-700' : 'text-slate-500'}`}>
                                        ${counts[cave - 1]} 句真話${cave === answer ? '（剛好只有 1 句 ✓）' : ''}
                                    </span>
                                </div>
                                <div className="text-sm space-y-0.5">
                                    ${statements.map((st, i) => html`
                                        <div key=${i} className="flex justify-between">
                                            <span>${i + 1} 號主人：${sentence(st)}</span>
                                            <span className=${statementIsTrue(st, cave) ? 'text-green-600 font-bold' : 'text-slate-400'}>
                                                ${statementIsTrue(st, cave) ? '真' : '假'}
                                            </span>
                                        </div>
                                    `)}
                                </div>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer} 號山洞 ✓</span>
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換說法）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q033',
    type: 'custom',
    title: '弄丟的藏寶圖：只有一個人說真話',
    q: '邏輯推理：逐一假設找出唯一符合的位置（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TreasureMapProblem} />`);
    }
};
