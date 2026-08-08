const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q012 - 新年禮物：照著描述找到格子
 * ------------------------------------------------------------------
 * 小動物說出禮物的位置（從上／從下數第幾排，從左／從右數第幾個），
 * 小朋友要在格子裡點出正確的位置。
 * 「行、列」在不同課本的說法會相反，這裡一律用
 * 「第幾排（上下）」「第幾個（左右）」，避免混淆。
 * ------------------------------------------------------------------
 */

const ROWS = 4, COLS = 5;
const ANIMALS = ['🐘', '🐶', '🦛', '🐱', '🐰', '🐻', '🐯', '🐸'];
const GIFTS = ['🎁', '🎀', '🧸', '🍬'];

function generateProblem() {
    const rowFromTop = Math.random() < 0.5;
    const colFromLeft = Math.random() < 0.5;
    const rowNo = 1 + Math.floor(Math.random() * ROWS);
    const colNo = 1 + Math.floor(Math.random() * COLS);

    const row = rowFromTop ? rowNo - 1 : ROWS - rowNo;
    const col = colFromLeft ? colNo - 1 : COLS - colNo;

    return {
        rowFromTop, colFromLeft, rowNo, colNo, row, col,
        animal: ANIMALS[Math.floor(Math.random() * ANIMALS.length)],
        gift: GIFTS[Math.floor(Math.random() * GIFTS.length)]
    };
}

const GiftGridGame = () => {
    const [problem, setProblem] = useState(null);
    const [wrongCell, setWrongCell] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setWrongCell(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (r, c) => {
        if (gameState === 'correct') return;
        if (r === problem.row && c === problem.col) {
            setWrongCell(null);
            setGameState('correct');
        } else {
            setWrongCell(`${r}-${c}`);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">包禮物中...</div>`;

    const { rowFromTop, colFromLeft, rowNo, colNo, row, col, animal, gift } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    新年禮物
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    幫小動物找到它的禮物在哪一格。
                </h1>
            </div>

            <!-- 小動物的描述 -->
            <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-5xl">${animal}</span>
                <div className="relative bg-lime-50 border-2 border-lime-300 rounded-2xl px-4 py-3 max-w-xs">
                    <p className="text-lg md:text-xl font-bold text-slate-700 leading-relaxed">
                        我的禮物在
                        <span className="text-orange-600">${rowFromTop ? '從上往下' : '從下往上'}數第 ${rowNo} 排</span>、
                        <span className="text-blue-600">${colFromLeft ? '從左往右' : '從右往左'}數第 ${colNo} 個</span>
                        的格子裡。
                    </p>
                </div>
            </div>

            <!-- 格子 -->
            <div className="bg-white rounded-2xl border-2 border-slate-100 p-2 mb-5">
                <div className="grid gap-1" style=${{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
                    ${Array.from({ length: ROWS }).map((_, r) =>
                        Array.from({ length: COLS }).map((_, c) => {
                            const key = `${r}-${c}`;
                            const isAnswer = r === row && c === col;
                            const showGift = gameState === 'correct' && isAnswer;
                            const isWrong = wrongCell === key;
                            return html`
                                <button
                                    key=${key}
                                    onClick=${() => handlePick(r, c)}
                                    disabled=${gameState === 'correct'}
                                    className=${`
                                        aspect-square rounded-lg border-2 flex items-center justify-center text-2xl md:text-3xl transition-all
                                        ${showGift ? 'bg-green-100 border-green-500 scale-105' : ''}
                                        ${isWrong ? 'bg-red-50 border-red-400 animate-pulse' : ''}
                                        ${!showGift && !isWrong ? 'bg-lime-50 border-lime-300 hover:bg-orange-50 hover:border-orange-300 active:scale-90' : ''}
                                        ${gameState === 'correct' && !isAnswer ? 'opacity-40' : ''}
                                    `}
                                >
                                    ${showGift ? gift : (isWrong ? '❌' : '')}
                                </button>
                            `;
                        })
                    )}
                </div>
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再數一次</div>
                    <p className="text-red-600 text-sm mt-1">
                        先找到是${rowFromTop ? '從上面' : '從下面'}數的第 ${rowNo} 排，
                        再${colFromLeft ? '從左邊' : '從右邊'}數 ${colNo} 個。
                    </p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>${rowFromTop ? '從上往下' : '從下往上'}數第 ${rowNo} 排：</span>
                            <span className="font-black text-orange-600">整個格子的第 ${row + 1} 排（從上面算）</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>${colFromLeft ? '從左往右' : '從右往左'}數第 ${colNo} 個：</span>
                            <span className="font-black text-blue-600">整個格子的第 ${col + 1} 個（從左邊算）</span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-center font-black text-green-700">
                            禮物 ${gift} 就在這兩條交會的格子裡
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再找一個禮物
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q012',
    type: 'custom',
    title: '新年禮物：禮物在哪一格',
    q: '照著小動物說的排數和個數，在格子裡點出禮物的位置。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${GiftGridGame} />`);
    }
};
