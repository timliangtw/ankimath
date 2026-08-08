const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q026 - 【題組】換衣服磁貼：搭配組合數（2 小題）
 * ------------------------------------------------------------------
 * 共同題幹：A 件上衣、B 件褲子，1 件上衣 + 1 件褲子算 1 種組合
 *   小題 1：一共可以搭配出幾種？        → A × B
 *   小題 2：再加 a 件上衣、b 件褲子後？  → (A+a) × (B+b)
 * 兩小題共用同一組隨機數字，全部答對才算完成。
 * ------------------------------------------------------------------
 */

function buildOptions(correct, candidates) {
    const wrong = [];
    for (const c of candidates) {
        if (c === correct || c <= 0) continue;
        if (wrong.includes(c)) continue;
        wrong.push(c);
        if (wrong.length >= 3) break;
    }
    return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const A = 4 + Math.floor(Math.random() * 4);   // 上衣 4~7 件
    const B = 4 + Math.floor(Math.random() * 4);   // 褲子 4~7 件
    const a = 1 + Math.floor(Math.random() * 2);   // 加購上衣 1~2 件
    const b = 1 + Math.floor(Math.random() * 3);   // 加購褲子 1~3 件

    const answer1 = A * B;
    const answer2 = (A + a) * (B + b);

    return {
        A, B, a, b, answer1, answer2,
        options1: buildOptions(answer1, [A + B, answer1 - A, answer1 + B, answer1 - B, answer1 + A]),
        options2: buildOptions(answer2, [
            answer1 + a * b,
            answer1 + (a + b),
            (A + a) * B,
            A * (B + b),
            answer2 + (a + b)
        ])
    };
}

const OutfitComboProblem = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(1);
    const [pick1, setPick1] = useState(null);
    const [pick2, setPick2] = useState(null);
    const [state1, setState1] = useState('playing'); // playing | correct | wrong
    const [state2, setState2] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(1);
        setPick1(null);
        setPick2(null);
        setState1('playing');
        setState2('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect1 = (opt) => {
        if (state1 === 'correct') return;
        setPick1(opt);
        if (opt === problem.answer1) {
            setState1('correct');
            setStep(2);
        } else {
            setState1('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    const handleSelect2 = (opt) => {
        if (state2 === 'correct') return;
        setPick2(opt);
        if (opt === problem.answer2) {
            setState2('correct');
        } else {
            setState2('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { A, B, a, b, answer1, answer2, options1, options2 } = problem;
    const allDone = state1 === 'correct' && state2 === 'correct';

    const optionButton = (opt, idx, picked, state, onSelect) => {
        const isSelected = picked === opt;
        const isCorrect = state === 'correct' && isSelected;
        const isWrong = state === 'wrong' && isSelected;
        const isDisabled = state === 'correct' && !isSelected;

        return html`
            <button
                key=${idx}
                onClick=${() => onSelect(opt)}
                disabled=${isDisabled}
                className=${`
                    py-3 rounded-2xl text-xl md:text-2xl font-black transition-all border-b-4 shadow-sm
                    ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                    ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                `}
            >
                (${idx + 1}) ${opt} 種
            </button>
        `;
    };

    const clothesRow = (count, emoji, extra, label) => html`
        <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-sm font-bold text-slate-500 w-12 text-right">${label}</span>
            ${Array.from({ length: count }).map((_, i) => html`
                <span key=${`o${i}`} className="text-2xl md:text-3xl">${emoji}</span>
            `)}
            ${Array.from({ length: extra }).map((_, i) => html`
                <span key=${`n${i}`} className="text-2xl md:text-3xl bg-blue-100 rounded-lg px-1 border-2 border-blue-300">${emoji}</span>
            `)}
        </div>
    `;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題組標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    題組・搭配組合（共 2 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    老師有一套換衣服磁貼遊戲組，這套遊戲組有
                    <span className="text-amber-600">${A} 件上衣</span>和
                    <span className="text-amber-600">${B} 件褲子</span>，
                    可以自由搭配出不同的組合（1 件上衣和 1 件褲子算 1 種組合）。
                </p>
            </div>

            <!-- 共同題幹：圖示 -->
            <div className="bg-amber-50 rounded-2xl border-2 border-amber-100 p-4 mb-6 space-y-3">
                ${clothesRow(A, '👕', step >= 2 ? a : 0, '上衣')}
                ${clothesRow(B, '👖', step >= 2 ? b : 0, '褲子')}
                ${step >= 2 && html`
                    <p className="text-center text-xs text-blue-500 font-bold">藍框是後來新買的服裝</p>
                `}
            </div>

            <!-- 小題 1 -->
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 1 小題</span>
                    ${state1 === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">
                    這套遊戲組一共可以搭配出幾種不同的服裝組合？
                </p>
                <div className="grid grid-cols-2 gap-3">
                    ${options1.map((opt, idx) => optionButton(opt, idx, pick1, state1, handleSelect1))}
                </div>

                ${state1 === 'wrong' && html`
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center animate-pulse">
                        <div className="text-red-500 font-bold">❌ 再想想看！</div>
                        <p className="text-red-600 text-sm">每一件上衣都可以配上任何一件褲子喔。</p>
                    </div>
                `}

                ${state1 === 'correct' && html`
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <div className="text-green-600 font-bold mb-2">🎉 第 1 小題答對了！</div>
                        <div className="bg-white rounded-xl p-3 text-slate-700 space-y-1 border border-green-100 text-sm md:text-base">
                            <div className="flex justify-between"><span>每件上衣可以配：</span><span className="font-black text-blue-600">${B} 種褲子</span></div>
                            <div className="flex justify-between"><span>一共 ${A} 件上衣：</span><span className="font-black text-amber-600">${A} × ${B} = ${answer1}</span></div>
                            <div className="border-t border-green-100 pt-1 flex justify-between">
                                <span className="font-bold">答案：</span>
                                <span className="font-black text-green-700">${answer1} 種 ✓</span>
                            </div>
                        </div>
                    </div>
                `}
            </div>

            <!-- 小題 2 -->
            ${step >= 2 && html`
                <div className="mb-6 border-t-2 border-dashed border-slate-200 pt-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 2 小題</span>
                        ${state2 === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                    </div>
                    <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">
                        老師又買了 <span className="text-blue-600">${a} 件上衣</span>和
                        <span className="text-blue-600">${b} 件褲子</span>（都和原本的服裝不一樣）。
                        增加了這 ${a + b} 件服裝後，老師一共可以搭配出幾種不同的服裝組合？
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        ${options2.map((opt, idx) => optionButton(opt, idx, pick2, state2, handleSelect2))}
                    </div>

                    ${state2 === 'wrong' && html`
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center animate-pulse">
                            <div className="text-red-500 font-bold">❌ 再想想看！</div>
                            <p className="text-red-600 text-sm">先算出現在總共有幾件上衣、幾件褲子，再重新搭配一次。</p>
                        </div>
                    `}
                </div>
            `}

            <!-- 全部答對的總結 -->
            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 兩小題都答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>現在的上衣：</span>
                            <span className="font-black text-amber-600">${A} + ${a} = ${A + a} 件</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>現在的褲子：</span>
                            <span className="font-black text-amber-600">${B} + ${b} = ${B + b} 件</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>可以搭配：</span>
                            <span className="font-black text-blue-600">${A + a} × ${B + b} = ${answer2}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            注意不是原本的 ${answer1} 種再多幾件而已，上衣和褲子都變多，要重新相乘一次。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-xl">${answer2} 種 ✓</span>
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
    id: 'q026',
    type: 'custom',
    title: '【題組】換衣服磁貼：可以搭配幾種？',
    q: '題組（2 小題）：乘法的搭配組合（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OutfitComboProblem} />`);
    }
};
