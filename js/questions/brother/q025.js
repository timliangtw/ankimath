const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q025 - 【題組】線上點餐的時間計算（2 小題）
 * ------------------------------------------------------------------
 * 共同題幹：手機線上點餐畫面（現在時間、取餐等待時間 D 分鐘、餐點價目）
 *   小題 1：現在馬上點餐，幾時幾分可以取餐？   → now + D
 *   小題 2：想在 E 吃晚餐，最晚幾時幾分要點餐？→ E - D(回家) - D(等待)
 *           （從家到餐廳、從餐廳回家、取餐等待都是 D 分鐘，
 *             所以點餐後出發，剛好到餐廳就能取餐）
 * 兩小題共用同一組隨機數字，全部答對才算完成。
 * ------------------------------------------------------------------
 */

function fmtTime(t) {
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    const isPM = h24 >= 12;
    let h = h24 % 12;
    if (h === 0) h = 12;
    return `${isPM ? '下午' : '上午'} ${h} 時 ${String(m).padStart(2, '0')} 分`;
}

function fmtClock(t) {
    const h24 = Math.floor(t / 60);
    const m = t % 60;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildOptions(correct, candidates) {
    const wrong = [];
    for (const c of candidates) {
        if (c === correct) continue;
        if (c < 0 || c > 1439) continue;
        if (wrong.includes(c)) continue;
        wrong.push(c);
        if (wrong.length >= 3) break;
    }
    return [...wrong, correct].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const D = [20, 30, 40][Math.floor(Math.random() * 3)];

    // 現在時間：上午 9:00 ~ 11:00，5 分鐘為單位
    const now = 9 * 60 + Math.floor(Math.random() * 25) * 5;
    const pickup = now + D;

    // 晚餐時間：下午 5:30 ~ 7:00
    const dinner = [17 * 60 + 30, 18 * 60, 18 * 60 + 30, 19 * 60][Math.floor(Math.random() * 4)];
    const orderBy = dinner - D - D;

    const noodlePrice = 100 + Math.floor(Math.random() * 6) * 5;
    const ricePrice = noodlePrice - 5 * (1 + Math.floor(Math.random() * 3));

    return {
        D, now, pickup, dinner, orderBy, noodlePrice, ricePrice,
        options1: buildOptions(pickup, [now, pickup + 30, pickup - 5, pickup + 5, pickup + 60]),
        options2: buildOptions(orderBy, [dinner - D, orderBy - 30, orderBy + 30, dinner - 3 * D, orderBy + 5])
    };
}

const OnlineOrderProblem = () => {
    const [problem, setProblem] = useState(null);
    const [step, setStep] = useState(1);          // 目前進行到第幾小題
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
        if (opt === problem.pickup) {
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
        if (opt === problem.orderBy) {
            setState2('correct');
        } else {
            setState2('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { D, now, pickup, dinner, orderBy, noodlePrice, ricePrice, options1, options2 } = problem;
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
                    py-3 rounded-2xl text-lg md:text-xl font-black transition-all border-b-4 shadow-sm
                    ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                    ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                    ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                    ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                `}
            >
                (${idx + 1}) ${fmtTime(opt)}
            </button>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <!-- 題組標題 -->
            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    題組・時間計算（共 2 小題）
                </div>
                <p className="text-base md:text-lg font-bold text-slate-700 leading-relaxed">
                    許多店家推出線上點餐服務。下面是小貝正在用店家的線上點餐系統訂購午餐的畫面。
                </p>
            </div>

            <!-- 共同題幹：手機畫面 -->
            <div className="mx-auto mb-6 w-64 md:w-72 bg-white border-4 border-slate-300 rounded-3xl p-3 shadow-md">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-1 mb-2">
                    <span>${fmtClock(now)}</span>
                    <span>📶 🔋</span>
                </div>
                <div className="border-2 border-slate-300 rounded-xl py-2 text-center font-bold text-slate-700 mb-2">
                    預訂外帶
                </div>
                <div className="border-2 border-slate-300 rounded-xl py-2 text-center text-slate-700 mb-3">
                    <div className="font-bold">取餐等待時間</div>
                    <div className="text-sm">盡快（預估 <span className="text-amber-600 font-black">${D} 分鐘</span>）</div>
                </div>
                <div className="text-sm text-slate-700 space-y-1 px-1">
                    <div className="flex justify-between"><span>牛肉鍋燒麵</span><span className="font-bold">${noodlePrice}</span></div>
                    <div className="flex justify-between"><span>咖哩燴飯</span><span className="font-bold">${ricePrice}</span></div>
                </div>
            </div>

            <!-- 小題 1 -->
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 1 小題</span>
                    ${state1 === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                </div>
                <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">
                    如果小貝現在馬上點餐，大約幾時幾分可以取餐？
                </p>
                <div className="grid grid-cols-2 gap-3">
                    ${options1.map((opt, idx) => optionButton(opt, idx, pick1, state1, handleSelect1))}
                </div>

                ${state1 === 'wrong' && html`
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center animate-pulse">
                        <div className="text-red-500 font-bold">❌ 再想想看！</div>
                        <p className="text-red-600 text-sm">從現在的時間往後推「取餐等待時間」喔。</p>
                    </div>
                `}

                ${state1 === 'correct' && html`
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                        <div className="text-green-600 font-bold mb-2">🎉 第 1 小題答對了！</div>
                        <div className="bg-white rounded-xl p-3 text-slate-700 space-y-1 border border-green-100 text-sm md:text-base">
                            <div className="flex justify-between"><span>現在時間：</span><span className="font-black text-slate-700">${fmtTime(now)}</span></div>
                            <div className="flex justify-between"><span>等待取餐：</span><span className="font-black text-amber-600">再過 ${D} 分鐘</span></div>
                            <div className="border-t border-green-100 pt-1 flex justify-between">
                                <span className="font-bold">可以取餐：</span>
                                <span className="font-black text-green-700">${fmtTime(pickup)} ✓</span>
                            </div>
                        </div>
                    </div>
                `}
            </div>

            <!-- 小題 2（第 1 小題答對後才出現） -->
            ${step >= 2 && html`
                <div className="mb-6 border-t-2 border-dashed border-slate-200 pt-5">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500 text-white text-sm font-bold px-3 py-1 rounded-full">第 2 小題</span>
                        ${state2 === 'correct' && html`<span className="text-green-600 font-bold">✓ 完成</span>`}
                    </div>
                    <p className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed mb-3">
                        媽媽晚餐想點同一家的餐點，從家裡到餐廳需要 <span className="text-blue-600">${D} 分鐘</span>，
                        從餐廳回家也需要 <span className="text-blue-600">${D} 分鐘</span>（含取餐時間）。
                        線上點餐的取餐等待時間都一樣，如果想要
                        <span className="text-amber-600">${fmtTime(dinner)}</span> 吃晚餐，
                        媽媽大約要在幾時幾分之前點餐？
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        ${options2.map((opt, idx) => optionButton(opt, idx, pick2, state2, handleSelect2))}
                    </div>

                    ${state2 === 'wrong' && html`
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-2xl p-3 text-center animate-pulse">
                            <div className="text-red-500 font-bold">❌ 再想想看！</div>
                            <p className="text-red-600 text-sm">從吃晚餐的時間往前推，回家要花時間，等餐也要花時間。</p>
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
                            <span>想吃晚餐的時間：</span>
                            <span className="font-black text-amber-600">${fmtTime(dinner)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>往前扣掉回家的 ${D} 分鐘：</span>
                            <span className="font-black text-blue-600">${fmtTime(dinner - D)} 取餐</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>再往前扣掉等餐的 ${D} 分鐘：</span>
                            <span className="font-black text-blue-600">${fmtTime(orderBy)} 點餐</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            點完餐就出發，路上剛好花 ${D} 分鐘，到餐廳時餐點正好做好。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">${fmtTime(orderBy)} 之前 ✓</span>
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
    id: 'q025',
    type: 'custom',
    title: '【題組】線上點餐：取餐與點餐時間',
    q: '題組（2 小題）：時間的加減（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${OnlineOrderProblem} />`);
    }
};
