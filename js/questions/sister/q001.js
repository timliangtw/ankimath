const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

const ANIMALS = [
    { name: '小烏龜', icon: '🐢', color: 'bg-green-100 border-green-300 text-green-700' },
    { name: '小長頸鹿', icon: '🦒', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
    { name: '小貓頭鷹', icon: '🦉', color: 'bg-amber-100 border-amber-300 text-amber-700' },
    { name: '小狗', icon: '🐶', color: 'bg-orange-100 border-orange-300 text-orange-700' },
    { name: '小企鵝', icon: '🐧', color: 'bg-sky-100 border-sky-300 text-sky-700' },
];

const ALL_COORDS = [
    { col: 1, row: 1 },
    { col: 2, row: 1 },
    { col: 1, row: 2 },
    { col: 2, row: 2 },
    { col: 1, row: 3 },
    { col: 2, row: 3 },
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function coordText(coord) {
    return `(${coord.col},${coord.row})`;
}

function generateProblem() {
    const coords = shuffle(ALL_COORDS).slice(0, 4);
    const animals = shuffle(ANIMALS).slice(0, 4);
    const placements = animals.map((animal, index) => ({ ...animal, ...coords[index] }));
    const target = placements[Math.floor(Math.random() * placements.length)];

    const answer = coordText(target);
    const wrongOptions = shuffle(ALL_COORDS)
        .map(coordText)
        .filter(option => option !== answer)
        .slice(0, 3);
    const options = shuffle([answer, ...wrongOptions]);

    return { placements, target, answer, options };
}

const CoordinateHouse = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (option) => {
        if (gameState === 'correct') return;
        setSelected(option);
        if (option === problem.answer) {
            setGameState('correct');
        } else {
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備小房子中...</div>`;

    const animalAt = (col, row) => problem.placements.find(item => item.col === col && item.row === row);
    const renderHouseCell = (col, row) => {
        const animal = animalAt(col, row);
        const isTarget = animal && animal.name === problem.target.name;

        return html`
            <div
                className=${`
                    h-24 md:h-28 rounded-xl border-4 bg-white flex flex-col items-center justify-center
                    ${animal ? animal.color : 'border-slate-200 text-slate-300'}
                    ${gameState === 'correct' && isTarget ? 'ring-4 ring-green-400 ring-offset-2' : ''}
                `}
            >
                ${animal ? html`
                    <div className="flex flex-col items-center justify-center">
                        <div className="text-4xl md:text-5xl">${animal.icon}</div>
                        <div className="text-xs md:text-sm font-bold mt-1">${animal.name}</div>
                    </div>
                ` : html`
                    <div className="text-3xl font-black">?</div>
                `}
            </div>
        `;
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-sky-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    位置小房子
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    ${problem.target.icon} ${problem.target.name} 住在哪一格？
                </h1>
                <p className="text-slate-500 font-bold mt-2">
                    先看下面是第幾欄，再看左邊是第幾層
                </p>
            </div>

            <div className="bg-sky-50 border-2 border-sky-100 rounded-2xl p-4 mb-5">
                <div className="grid gap-2" style=${{ gridTemplateColumns: '2rem repeat(2, minmax(0, 1fr))' }}>
                    <div className="flex items-center justify-center text-lg font-black text-slate-400">3</div>
                    ${renderHouseCell(1, 3)}
                    ${renderHouseCell(2, 3)}

                    <div className="flex items-center justify-center text-lg font-black text-slate-400">2</div>
                    ${renderHouseCell(1, 2)}
                    ${renderHouseCell(2, 2)}

                    <div className="flex items-center justify-center text-lg font-black text-slate-400">1</div>
                    ${renderHouseCell(1, 1)}
                    ${renderHouseCell(2, 1)}

                    <div></div>
                    <div className="text-center text-lg font-black text-slate-500">1</div>
                    <div className="text-center text-lg font-black text-slate-500">2</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${problem.options.map(option => {
                    const isSelected = selected === option;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;

                    return html`
                        <button
                            key=${option}
                            onClick=${() => handleSelect(option)}
                            disabled=${isDisabled}
                            className=${`
                                py-4 rounded-2xl text-2xl font-black transition-all border-b-4 shadow-sm
                                ${isCorrect ? 'bg-green-400 text-white border-green-600 scale-105' : ''}
                                ${isWrong ? 'bg-red-100 text-red-500 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white text-slate-700 border-slate-200 hover:bg-sky-50 hover:border-sky-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            ${option}
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再看一次喔</div>
                    <p className="text-red-600 text-sm mt-1">下面的數字是第幾欄，左邊的數字是第幾層。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        ${problem.target.name} 在第
                        <span className="text-sky-600">${problem.target.col}</span>
                        欄，第
                        <span className="text-sky-600">${problem.target.row}</span>
                        層，所以是
                        <span className="text-green-700 text-xl">${problem.answer}</span>。
                    </p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換位置）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q001',
    type: 'custom',
    title: '位置小房子：動物住在哪一格？',
    q: '座標位置練習：看小房子裡的動物，選出正確的位置。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${CoordinateHouse} />`);
    }
};
