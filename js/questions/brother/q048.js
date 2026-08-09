const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q048 - 內圈外圈：誰跑得比較快？
 * ------------------------------------------------------------------
 * 同樣的時間裡，誰跑的距離比較長，誰就比較快。
 *   內圈的人跑完一圈 = 內圈長度
 *   外圈的人還差 C 公尺 = 外圈長度 − C
 * 比較這兩個距離就好，不必管誰先跑完一圈。
 * ------------------------------------------------------------------
 */

const NAMES = [
    ['豆豆', '奇奇'], ['小安', '阿宏'], ['小恩', '大威'], ['妮妮', '球球']
];

function generateProblem() {
    for (let attempt = 0; attempt < 300; attempt++) {
        const inner = 100 * (2 + Math.floor(Math.random() * 3));       // 內圈 200/300/400
        const outer = inner + 5 * (3 + Math.floor(Math.random() * 8)); // 外圈多 15~50
        const mode = Math.floor(Math.random() * 3);                    // 0 外圈快 / 1 內圈快 / 2 一樣快

        let short;
        if (mode === 2) short = outer - inner;                         // 剛好一樣
        else if (mode === 0) short = outer - inner - 5 * (1 + Math.floor(Math.random() * 3));
        else short = outer - inner + 5 * (1 + Math.floor(Math.random() * 3));

        if (short <= 0 || short >= outer) continue;

        const outerRun = outer - short;
        const answer = outerRun > inner ? 'outer' : (outerRun < inner ? 'inner' : 'same');

        const names = NAMES[Math.floor(Math.random() * NAMES.length)];
        return { inner, outer, short, outerRun, answer, names };
    }
    return {
        inner: 200, outer: 225, short: 12, outerRun: 213, answer: 'outer',
        names: NAMES[0]
    };
}

const TrackSpeedProblem = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (key) => {
        if (gameState === 'correct') return;
        setSelected(key);
        if (key === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">載入中...</div>`;

    const { inner, outer, short, outerRun, answer, names } = problem;
    const [innerName, outerName] = names;

    const choices = [
        { key: 'inner', text: `${innerName}（跑內圈）` },
        { key: 'outer', text: `${outerName}（跑外圈）` },
        { key: 'same', text: '一樣快' },
        { key: 'unknown', text: '不能比較' }
    ];

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">

            <div className="text-center mb-4">
                <div className="inline-block bg-amber-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    速度比較
                </div>
                <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-relaxed">
                    🏃 ${innerName}在<span className="text-amber-600">內圈</span>、
                    ${outerName}在<span className="text-blue-600">外圈</span>跑步，兩個人同時起跑。
                    ${innerName}跑完一圈的時候，${outerName}還差
                    <span className="text-blue-600">${short} 公尺</span>才跑完一圈。
                </h1>
                <p className="mt-2 text-lg md:text-xl font-bold text-slate-700">
                    誰跑得比較快？
                </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-3 mb-6">
                <div className="text-center text-sm font-black text-amber-700 mb-2">操場跑道一圈的長度</div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl border-2 border-amber-200 p-3 text-center">
                        <div className="text-sm font-bold text-slate-500">內圈</div>
                        <div className="text-2xl font-black text-amber-600">${inner} 公尺</div>
                    </div>
                    <div className="bg-white rounded-xl border-2 border-amber-200 p-3 text-center">
                        <div className="text-sm font-bold text-slate-500">外圈</div>
                        <div className="text-2xl font-black text-blue-600">${outer} 公尺</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                ${choices.map((c, idx) => {
                    const isSelected = selected === c.key;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${c.key}
                            onClick=${() => handleSelect(c.key)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-lg md:text-xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect  ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong    ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            (${idx + 1}) ${c.text}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4 animate-pulse">
                    <div className="text-red-500 font-bold text-lg mb-1">❌ 再想想看！</div>
                    <p className="text-red-600 text-sm">
                        時間一樣長，就比誰「跑的距離」比較長。${outerName}跑了幾公尺呢？
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-3">🎉 答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>${innerName}跑的距離：</span>
                            <span className="font-black text-amber-600">${inner} 公尺（跑完一圈）</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>${outerName}跑的距離：</span>
                            <span className="font-black text-blue-600">${outer} − ${short} = ${outerRun} 公尺</span>
                        </div>
                        <div className="text-sm text-slate-500">
                            兩個人跑的時間一樣長，距離比較長的就比較快。
                        </div>
                        <div className="border-t border-green-100 pt-2 flex justify-between items-center">
                            <span className="font-bold">答案：</span>
                            <span className="font-black text-green-700 text-lg">
                                ${answer === 'same'
                                    ? `${inner} = ${outerRun}，兩個人一樣快 ✓`
                                    : (answer === 'outer'
                                        ? `${outerRun} > ${inner}，${outerName}比較快 ✓`
                                        : `${inner} > ${outerRun}，${innerName}比較快 ✓`)}
                            </span>
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
    id: 'q048',
    type: 'custom',
    title: '內圈外圈：誰跑得比較快？',
    q: '速度比較：同樣時間比距離（點擊開啟互動介面）',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TrackSpeedProblem} />`);
    }
};
