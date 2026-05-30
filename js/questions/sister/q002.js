const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

const SHAPES = [
    { shape: 'circle', face: 'smile', label: '圓形笑臉' },
    { shape: 'square', face: 'angry', label: '方形生氣臉' },
    { shape: 'triangle', face: 'happy', label: '三角形開心臉' },
    { shape: 'rect', face: 'cry', label: '長方形哭臉' },
];

function generateProblem() {
    const base = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const answerRotation = [90, 180, 270][Math.floor(Math.random() * 3)];
    const wrongRotations = [0, 90, 180, 270].filter(rotation => rotation !== answerRotation);
    const options = shuffle([answerRotation, ...shuffle(wrongRotations).slice(0, 3)]);
    return { base, answerRotation, options };
}

const FaceShape = ({ item, rotation = 0, small = false }) => {
    const size = small ? 'w-24 h-24' : 'w-32 h-32 md:w-40 md:h-40';
    const shapeClass = {
        circle: 'rounded-full',
        square: 'rounded-xl',
        rect: 'rounded-xl',
        triangle: 'triangle-face',
    }[item.shape];

    const face = {
        smile: { eyes: '•  •', mouth: '︶' },
        angry: { eyes: '⌒  ⌒', mouth: '︵' },
        happy: { eyes: '⌒  ⌒', mouth: '▽' },
        cry: { eyes: '>  <', mouth: '︵' },
    }[item.face];

    return html`
        <div className=${`relative ${size} mx-auto flex items-center justify-center`}>
            <div
                className=${`
                    ${item.shape === 'triangle' ? '' : `${size} ${shapeClass} bg-white border-4 border-slate-800`}
                    flex flex-col items-center justify-center text-slate-800 font-black shadow-sm
                `}
                style=${{
                    transform: `rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease'
                }}
            >
                ${item.shape === 'triangle' ? html`
                    <div className="relative w-0 h-0"
                        style=${{
                            borderLeft: small ? '48px solid transparent' : '70px solid transparent',
                            borderRight: small ? '48px solid transparent' : '70px solid transparent',
                            borderBottom: small ? '88px solid white' : '126px solid white',
                            filter: 'drop-shadow(0 0 0 #1f2937)'
                        }}>
                        <div className="absolute text-slate-800 font-black text-center"
                            style=${{
                                left: small ? '-30px' : '-42px',
                                top: small ? '34px' : '50px',
                                width: small ? '60px' : '84px'
                            }}>
                            <div className=${small ? 'text-lg' : 'text-2xl'}>${face.eyes}</div>
                            <div className=${small ? 'text-2xl leading-none' : 'text-4xl leading-none'}>${face.mouth}</div>
                        </div>
                    </div>
                ` : html`
                    <div className="flex flex-col items-center justify-center">
                        <div className=${small ? 'text-lg' : 'text-2xl'}>${face.eyes}</div>
                        <div className=${small ? 'text-3xl leading-none' : 'text-5xl leading-none'}>${face.mouth}</div>
                    </div>
                `}
            </div>
        </div>
    `;
};

const FlipShapeGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (rotation) => {
        if (gameState === 'correct') return;
        setSelected(rotation);
        setGameState(rotation === problem.answerRotation ? 'correct' : 'wrong');
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備圖形中...</div>`;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <style>
                .triangle-face:before {
                    content: "";
                    position: absolute;
                    inset: 0;
                }
            </style>

            <div className="text-center mb-5">
                <div className="inline-block bg-pink-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    圖形翻跟頭
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    這個圖形翻跟頭後，會變成哪一個？
                </h1>
            </div>

            <div className="bg-pink-50 border-2 border-pink-100 rounded-2xl p-5 mb-5 text-center">
                <${FaceShape} item=${problem.base} rotation=${0} />
                <div className="mt-3 text-slate-500 font-bold">${problem.base.label}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${problem.options.map((rotation, index) => {
                    const isSelected = selected === rotation;
                    const isCorrect = gameState === 'correct' && isSelected;
                    const isWrong = gameState === 'wrong' && isSelected;
                    const isDisabled = gameState === 'correct' && !isSelected;
                    return html`
                        <button
                            key=${rotation}
                            onClick=${() => handleSelect(rotation)}
                            disabled=${isDisabled}
                            className=${`
                                rounded-2xl p-3 border-b-4 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-100 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-pink-50 hover:border-pink-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <div className="text-sm font-black text-slate-400 mb-1">選項 ${index + 1}</div>
                            <${FaceShape} item=${problem.base} rotation=${rotation} small=${true} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再轉轉看</div>
                    <p className="text-red-600 text-sm mt-1">眼睛和嘴巴的位置也要一起跟著轉喔。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <p className="text-slate-700 font-bold">圖形轉了，臉上的眼睛和嘴巴也會一起轉。</p>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再試一題（換圖形）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q002',
    type: 'custom',
    title: '圖形翻跟頭：轉一轉找相同',
    q: '觀察圖形翻轉後，選出正確的樣子。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${FlipShapeGame} />`);
    }
};
