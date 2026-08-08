const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q020 - 【題組】蔬菜天平：右邊還要放幾個茄子？（2 小題）
 * ------------------------------------------------------------------
 * 換算關係：1 個 🥕 = a 個 🍆，1 個 🎃 = b 個 🥕
 *   小題 1：左盤 n 個 🥕，右盤已有 c1 個 🍆 → 還要 n×a − c1 個
 *   小題 2：左盤 1 個 🎃，右盤已有 c2 個 🍆 → 還要 b×a − c2 個
 * 兩小題共用同一組換算關係。
 * ------------------------------------------------------------------
 */

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function buildOptions(correct, max) {
    const wrong = new Set();
    for (const w of [correct + 1, correct - 1, correct + 2, correct - 2, max]) {
        if (Number.isInteger(w) && w >= 1 && w !== correct) wrong.add(w);
        if (wrong.size >= 3) break;
    }
    let bump = 3;
    while (wrong.size < 3) {
        const w = correct + bump;
        if (w >= 1 && w !== correct) wrong.add(w);
        bump++;
    }
    return shuffle([...wrong].slice(0, 3).concat(correct));
}

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const perCarrot = 2 + Math.floor(Math.random() * 2);      // 1 🥕 = 2~3 🍆
        const carrotsPerPumpkin = 2 + Math.floor(Math.random() * 2); // 1 🎃 = 2~3 🥕
        const carrots = 1 + Math.floor(Math.random() * 2);        // 左盤 1~2 個 🥕

        const need1 = carrots * perCarrot;
        const need2 = carrotsPerPumpkin * perCarrot;
        const have1 = 1 + Math.floor(Math.random() * Math.max(1, need1 - 1));
        const have2 = 1 + Math.floor(Math.random() * Math.max(1, need2 - 1));

        const answer1 = need1 - have1;
        const answer2 = need2 - have2;
        if (answer1 < 1 || answer2 < 1) continue;

        return {
            perCarrot, carrotsPerPumpkin, carrots,
            need1, have1, answer1,
            need2, have2, answer2,
            options1: buildOptions(answer1, need1),
            options2: buildOptions(answer2, need2)
        };
    }
    return {
        perCarrot: 2, carrotsPerPumpkin: 3, carrots: 2,
        need1: 4, have1: 1, answer1: 3,
        need2: 6, have2: 1, answer2: 5,
        options1: [2, 3, 4, 5], options2: [3, 4, 5, 6]
    };
}

const Row = ({ count, icon }) => html`
    <span className="inline-flex flex-wrap gap-0.5 align-middle">
        ${Array.from({ length: count }).map((_, i) => html`
            <span key=${i} className="text-2xl">${icon}</span>
        `)}
    </span>
`;

const Balance = ({ leftCount, leftIcon, haveCount, solved, addCount }) => html`
    <div className="bg-white rounded-2xl border-2 border-lime-200 p-3">
        <div className="grid grid-cols-2 gap-2 items-center">
            <div className="rounded-xl bg-yellow-100 border-2 border-yellow-300 p-2 min-h-[64px] flex items-center justify-center">
                <${Row} count=${leftCount} icon=${leftIcon} />
            </div>
            <div className="rounded-xl bg-yellow-100 border-2 border-yellow-300 p-2 min-h-[64px] flex items-center justify-center flex-wrap gap-1">
                <${Row} count=${haveCount} icon="🍆" />
                ${solved && html`
                    <span className="inline-flex flex-wrap gap-0.5">
                        ${Array.from({ length: addCount }).map((_, i) => html`
                            <span key=${i} className="text-2xl bg-green-100 rounded border-2 border-green-400">🍆</span>
                        `)}
                    </span>
                `}
            </div>
        </div>
        <div className="text-center text-3xl text-slate-400 -mt-1">⚖️</div>
    </div>
`;

const VeggieBalanceGame = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState([null, null]);
    const [states, setStates] = useState(['playing', 'playing']);

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setStep(0);
        setPicked([null, null]);
        setStates(['playing', 'playing']);
    }, []);

    useEffect(() => { newProblem(); }, []);

    if (!problem) return html`<div className="text-center p-8 text-slate-400">秤蔬菜中...</div>`;

    const {
        perCarrot, carrotsPerPumpkin, carrots,
        need1, have1, answer1, need2, have2, answer2,
        options1, options2
    } = problem;
    const answers = [answer1, answer2];
    const allDone = states.every(s => s === 'correct');

    const handleSelect = (index, opt) => {
        if (states[index] === 'correct') return;
        const nextPicked = [...picked];
        nextPicked[index] = opt;
        setPicked(nextPicked);

        const nextStates = [...states];
        if (opt === answers[index]) {
            nextStates[index] = 'correct';
            setStep(s => Math.max(s, index + 1));
        } else {
            nextStates[index] = 'wrong';
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
        setStates(nextStates);
    };

    const block = (index, leftCount, leftIcon, need, have, answer, options, hint) => {
        if (index > step) return null;
        const state = states[index];
        return html`
            <div className=${`mb-6 ${index > 0 ? 'border-t-2 border-dashed border-slate-200 pt-5' : ''}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 ${index + 1} 個天平</span>
                    ${state === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                </div>
                <${Balance} leftCount=${leftCount} leftIcon=${leftIcon} haveCount=${have}
                    solved=${state === 'correct'} addCount=${answer} />
                <p className="mt-3 text-lg md:text-xl font-bold text-slate-800">
                    右邊還要再放幾個 🍆，天平才會平平的？
                </p>
                <div className="grid grid-cols-4 gap-2 mt-3">
                    ${options.map((opt, idx) => {
                        const isSelected = picked[index] === opt;
                        const isCorrect = state === 'correct' && isSelected;
                        const isWrong = state === 'wrong' && isSelected;
                        const isDisabled = state === 'correct' && !isSelected;
                        return html`
                            <button
                                key=${idx}
                                onClick=${() => handleSelect(index, opt)}
                                disabled=${isDisabled}
                                className=${`
                                    py-3 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                    ${isCorrect ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                    ${isWrong ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                                `}
                            >
                                ${opt}
                            </button>
                        `;
                    })}
                </div>
                ${state === 'wrong' && html`
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
                        <div className="text-red-500 font-bold">再算一次</div>
                        <p className="text-red-600 text-sm">${hint}</p>
                    </div>
                `}
                ${state === 'correct' && html`
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3">
                        <div className="text-green-600 font-bold mb-1">第 ${index + 1} 個天平平平的了！</div>
                        <div className="bg-white rounded-xl p-2 text-slate-700 border border-green-100 text-sm md:text-base space-y-1">
                            <div className="flex justify-between"><span>左邊等於幾個 🍆：</span><span className="font-bold">${need} 個</span></div>
                            <div className="flex justify-between"><span>右邊已經有：</span><span className="font-bold">${have} 個</span></div>
                            <div className="flex justify-between border-t border-green-100 pt-1">
                                <span className="font-bold">還要再放：</span>
                                <span className="font-black text-green-700">${need} − ${have} = ${answer} 個</span>
                            </div>
                        </div>
                    </div>
                `}
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    蔬菜天平（共 2 小題）
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    看看蔬菜一樣重的關係，想一想右邊還要放幾個。
                </h1>
            </div>

            <!-- 共同題幹：換算關係 -->
            <div className="bg-lime-100 border-2 border-lime-300 rounded-2xl p-3 mb-6 space-y-2">
                <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-700">
                    <span className="text-2xl">🥕</span>
                    <span>=</span>
                    <${Row} count=${perCarrot} icon="🍆" />
                </div>
                <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-700">
                    <span className="text-2xl">🎃</span>
                    <span>=</span>
                    <${Row} count=${carrotsPerPumpkin} icon="🥕" />
                </div>
            </div>

            ${block(0, carrots, '🥕', need1, have1, answer1, options1,
                `1 個 🥕 等於 ${perCarrot} 個 🍆，左邊有 ${carrots} 個 🥕。`)}

            ${block(1, 1, '🎃', need2, have2, answer2, options2,
                `1 個 🎃 等於 ${carrotsPerPumpkin} 個 🥕，1 個 🥕 又等於 ${perCarrot} 個 🍆。`)}

            ${allDone && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">兩個天平都平平的了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between">
                            <span>${carrots} 個 🥕 =</span>
                            <span className="font-black text-amber-600">${carrots} × ${perCarrot} = ${need1} 個 🍆</span>
                        </div>
                        <div className="flex justify-between">
                            <span>1 個 🎃 =</span>
                            <span className="font-black text-amber-600">${carrotsPerPumpkin} × ${perCarrot} = ${need2} 個 🍆</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-sm text-slate-500">
                            🎃 要先換成 🥕，🥕 再換成 🍆，要換兩次喔。
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再秤一次（換數字）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q020',
    type: 'custom',
    title: '【題組】蔬菜天平：還要放幾個茄子',
    q: '題組（2 小題）：用一樣重的關係換算數量。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${VeggieBalanceGame} />`);
    }
};
