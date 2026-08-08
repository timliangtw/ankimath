const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q011 - 照鏡子：站在鏡子前的人應該是什麼樣子？
 * ------------------------------------------------------------------
 * 鏡子裡的樣子是真人的左右相反：
 *   鏡中帽舌朝左 → 真人帽舌朝右
 *   鏡中背包在左 → 真人背包在右
 * 兩個特徵（帽舌方向、背包位置）剛好組出 4 個選項。
 * ------------------------------------------------------------------
 */

const SHIRTS = ['#facc15', '#fb923c', '#a3e635', '#67e8f9'];
const PANTS = ['#22c55e', '#3b82f6', '#a855f7', '#ef4444'];

function flip(side) {
    return side === 'left' ? 'right' : 'left';
}

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    // 鏡子裡看到的樣子
    const mirrorCap = Math.random() < 0.5 ? 'left' : 'right';
    const mirrorBag = Math.random() < 0.5 ? 'left' : 'right';
    // 真正站在鏡子前的人：左右都相反
    const realCap = flip(mirrorCap);
    const realBag = flip(mirrorBag);

    const options = shuffle([
        { cap: 'left', bag: 'left' },
        { cap: 'left', bag: 'right' },
        { cap: 'right', bag: 'left' },
        { cap: 'right', bag: 'right' }
    ]).map(o => ({ ...o, isRight: o.cap === realCap && o.bag === realBag }));

    return {
        mirrorCap, mirrorBag, realCap, realBag, options,
        shirt: SHIRTS[Math.floor(Math.random() * SHIRTS.length)],
        pants: PANTS[Math.floor(Math.random() * PANTS.length)]
    };
}

const Kid = ({ cap, bag, shirt, pants }) => {
    const bagX = bag === 'right' ? 64 : 16;
    const strapFrom = bag === 'right' ? 36 : 64;
    const strapTo = bag === 'right' ? 68 : 32;
    const brim = cap === 'left'
        ? { x: 10, width: 22 }
        : { x: 68, width: 22 };

    return html`
        <svg viewBox="0 0 100 150" className="w-full h-auto">
            <!-- 帽舌 -->
            <rect x=${brim.x} y="25" width=${brim.width} height="7" rx="3" fill="#1d4ed8" />
            <!-- 頭 -->
            <circle cx="50" cy="42" r="18" fill="#fcd9b6" stroke="#e2b48c" strokeWidth="1.5" />
            <!-- 帽子 -->
            <path d="M 32,32 A 18,18 0 0 1 68,32 Z" fill="#2563eb" />
            <rect x="32" y="28" width="36" height="6" rx="3" fill="#f8fafc" />
            <!-- 五官 -->
            <circle cx="43" cy="44" r="2.4" fill="#1e293b" />
            <circle cx="57" cy="44" r="2.4" fill="#1e293b" />
            <path d="M 44,52 Q 50,57 56,52" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
            <!-- 上衣 -->
            <rect x="28" y="62" width="44" height="44" rx="10" fill=${shirt} stroke="#94a3b8" strokeWidth="1.5" />
            <!-- 手臂 -->
            <rect x="16" y="66" width="12" height="34" rx="6" fill=${shirt} stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="72" y="66" width="12" height="34" rx="6" fill=${shirt} stroke="#94a3b8" strokeWidth="1.5" />
            <!-- 背帶 -->
            <line x1=${strapFrom} y1="66" x2=${strapTo} y2="100" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
            <!-- 背包 -->
            <rect x=${bagX} y="94" width="20" height="20" rx="5" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
            <rect x=${bagX + 4} y="100" width="12" height="4" rx="2" fill="#fecaca" />
            <!-- 短褲 -->
            <rect x="30" y="104" width="40" height="22" rx="5" fill=${pants} />
            <!-- 腿 -->
            <rect x="34" y="124" width="10" height="14" rx="4" fill="#fcd9b6" />
            <rect x="56" y="124" width="10" height="14" rx="4" fill="#fcd9b6" />
            <!-- 鞋 -->
            <rect x="31" y="136" width="16" height="8" rx="4" fill="#dc2626" />
            <rect x="53" y="136" width="16" height="8" rx="4" fill="#dc2626" />
        </svg>
    `;
};

const MirrorGame = () => {
    const [problem, setProblem] = useState(null);
    const [selected, setSelected] = useState(null);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setSelected(null);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handleSelect = (index) => {
        if (gameState === 'correct') return;
        setSelected(index);
        if (problem.options[index].isRight) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">擦鏡子中...</div>`;

    const { mirrorCap, mirrorBag, realCap, realBag, options, shirt, pants } = problem;
    const zh = (side) => (side === 'left' ? '左邊' : '右邊');

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    照鏡子
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    這是鏡子裡看到的樣子。
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-800">
                    站在鏡子前面的人是哪一個？
                </p>
            </div>

            <!-- 鏡子 -->
            <div className="flex justify-center mb-6">
                <div className="relative rounded-full border-8 border-emerald-600 bg-emerald-50 px-6 py-3 shadow-inner"
                    style=${{ width: '170px' }}>
                    <${Kid} cap=${mirrorCap} bag=${mirrorBag} shirt=${shirt} pants=${pants} />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-black px-3 py-0.5 rounded-full">
                        鏡子裡
                    </div>
                </div>
            </div>

            <!-- 四個選項 -->
            <div className="grid grid-cols-4 gap-2 mb-5">
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
                                rounded-2xl border-b-4 p-1 transition-all shadow-sm
                                ${isCorrect ? 'bg-green-100 border-green-500 scale-105' : ''}
                                ${isWrong ? 'bg-red-50 border-red-300 animate-pulse' : ''}
                                ${isDisabled ? 'bg-slate-50 border-slate-100 opacity-40 cursor-not-allowed' : ''}
                                ${!isSelected && !isDisabled ? 'bg-white border-slate-200 hover:bg-orange-50 hover:border-orange-300 active:scale-95 cursor-pointer' : ''}
                            `}
                        >
                            <${Kid} cap=${opt.cap} bag=${opt.bag} shirt=${shirt} pants=${pants} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再想一想</div>
                    <p className="text-red-600 text-sm mt-1">鏡子裡的東西左右會相反喔。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        <div className="flex justify-between items-center">
                            <span>帽子的帽舌：</span>
                            <span className="font-black text-orange-600">
                                鏡子裡朝${zh(mirrorCap)} → 真人朝${zh(realCap)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>背包背在：</span>
                            <span className="font-black text-blue-600">
                                鏡子裡在${zh(mirrorBag)} → 真人在${zh(realBag)}
                            </span>
                        </div>
                        <div className="border-t border-green-100 pt-2 text-center font-black text-green-700">
                            鏡子會把左右對調
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再照一次
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q011',
    type: 'custom',
    title: '照鏡子：真正的人是哪一個',
    q: '鏡子裡的左右是相反的，找出站在鏡子前面的人。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${MirrorGame} />`);
    }
};
