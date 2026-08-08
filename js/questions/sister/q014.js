const { useState, useEffect, useCallback } = React;
const html = htm.bind(React.createElement);

/**
 * ------------------------------------------------------------------
 * q014 - 小白兔採蘑菇：把 4 張圖照事情發生的先後排好
 * ------------------------------------------------------------------
 * 4 張圖是同一件事的 4 個階段（東西從一邊一個一個移到另一邊）。
 * 小朋友要依照發生的先後順序，一張一張點下去。
 * 點錯就從第 1 張重來（不會鎖住）。
 * ------------------------------------------------------------------
 */

const SCENES = [
    { title: '小白兔採蘑菇', from: '🍄', to: '🧺', fromLabel: '地上的蘑菇', toLabel: '籃子裡的蘑菇', hint: '蘑菇一個一個被採進籃子裡' },
    { title: '小熊吃餅乾', from: '🍪', to: '🐻', fromLabel: '盤子裡的餅乾', toLabel: '吃掉的餅乾', hint: '餅乾一片一片被吃掉' },
    { title: '小朋友撿貝殼', from: '🐚', to: '🪣', fromLabel: '沙灘上的貝殼', toLabel: '桶子裡的貝殼', hint: '貝殼一顆一顆被撿進桶子' },
    { title: '小猴子摘香蕉', from: '🍌', to: '🐵', fromLabel: '樹上的香蕉', toLabel: '摘下來的香蕉', hint: '香蕉一根一根被摘下來' }
];

function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
}

function generateProblem() {
    const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
    const total = Math.random() < 0.5 ? 6 : 8;

    const inner = shuffle(Array.from({ length: total - 1 }, (_, i) => i + 1)).slice(0, 2).sort((a, b) => a - b);
    const moved = [0, inner[0], inner[1], total];

    const stages = moved.map((m, i) => ({
        order: i,
        from: total - m,
        to: m
    }));

    return { scene, total, stages, shown: shuffle(stages) };
}

const StageCard = ({ scene, stage, badge, dim }) => html`
    <div className=${`rounded-2xl border-2 p-2 h-full ${dim ? 'opacity-40' : ''} ${badge ? 'border-green-400 bg-green-50' : 'border-slate-200 bg-white'}`}>
        <div className="relative">
            ${badge && html`
                <span className="absolute -top-1 -left-1 bg-green-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                    ${badge}
                </span>
            `}
            <div className="rounded-xl bg-lime-100 border border-lime-300 p-2 mb-1 min-h-[54px] flex flex-wrap items-center justify-center gap-0.5">
                ${Array.from({ length: stage.from }).map((_, i) => html`
                    <span key=${`f${i}`} className="text-lg md:text-xl">${scene.from}</span>
                `)}
                ${stage.from === 0 && html`<span className="text-xs text-slate-400 font-bold">沒有了</span>`}
            </div>
            <div className="rounded-xl bg-amber-100 border border-amber-300 p-2 min-h-[54px] flex flex-wrap items-center justify-center gap-0.5">
                <span className="text-lg md:text-xl">${scene.to}</span>
                ${Array.from({ length: stage.to }).map((_, i) => html`
                    <span key=${`t${i}`} className="text-lg md:text-xl">${scene.from}</span>
                `)}
                ${stage.to === 0 && html`<span className="text-xs text-slate-400 font-bold">還沒有</span>`}
            </div>
        </div>
    </div>
`;

const StorySortGame = () => {
    const [problem, setProblem] = useState(null);
    const [progress, setProgress] = useState([]);
    const [gameState, setGameState] = useState('playing');

    const newProblem = useCallback(() => {
        setProblem(generateProblem());
        setProgress([]);
        setGameState('playing');
    }, []);

    useEffect(() => { newProblem(); }, []);

    const handlePick = (order) => {
        if (gameState === 'correct') return;
        if (order === progress.length) {
            const next = [...progress, order];
            setProgress(next);
            setGameState(next.length === 4 ? 'correct' : 'playing');
        } else {
            setProgress([]);
            setGameState('wrong');
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
        }
    };

    if (!problem) return html`<div className="text-center p-8 text-slate-400">準備圖片中...</div>`;

    const { scene, total, stages, shown } = problem;

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-4">
                <div className="inline-block bg-orange-500 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    ${scene.title}
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    這 4 張圖是同一件事情。
                </h1>
                <p className="text-xl md:text-2xl font-bold text-slate-800">
                    照著<span className="text-orange-600">先後順序</span>一張一張點下去。
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                    上面是${scene.fromLabel}，下面是${scene.toLabel}
                </p>
            </div>

            <div className="text-center text-sm font-black text-slate-500 mb-2">
                已經排好 ${progress.length} / 4 張
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
                ${shown.map((stage) => {
                    const picked = progress.indexOf(stage.order);
                    return html`
                        <button
                            key=${stage.order}
                            onClick=${() => handlePick(stage.order)}
                            disabled=${gameState === 'correct' || picked >= 0}
                            className=${`
                                text-left transition-all rounded-2xl
                                ${picked >= 0 ? '' : 'hover:scale-[1.02] active:scale-95 cursor-pointer'}
                            `}
                        >
                            <${StageCard} scene=${scene} stage=${stage}
                                badge=${picked >= 0 ? picked + 1 : null}
                                dim=${gameState === 'correct' && picked < 0} />
                        </button>
                    `;
                })}
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">順序不對，從第 1 張再來一次</div>
                    <p className="text-red-600 text-sm mt-1">${scene.hint}，所以上面會越來越少。</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">答對了！</div>
                    <div className="bg-white rounded-xl p-4 text-left text-slate-700 space-y-2 border border-green-100">
                        ${stages.map((s, i) => html`
                            <div key=${i} className="flex justify-between items-center">
                                <span className="font-black text-green-600">第 ${i + 1} 張：</span>
                                <span className="font-bold">
                                    ${scene.fromLabel} ${s.from} 個、${scene.toLabel} ${s.to} 個
                                </span>
                            </div>
                        `)}
                        <div className="border-t border-green-100 pt-2 text-center text-slate-600">
                            ${scene.hint}，所以上面從 ${total} 個一路變成 0 個。
                        </div>
                    </div>
                    <button
                        onClick=${newProblem}
                        className="mt-4 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再排一次（換故事）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q014',
    type: 'custom',
    title: '把 4 張圖照先後順序排好',
    q: '看東西從一邊移到另一邊的多少，排出事情發生的先後順序。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${StorySortGame} />`);
    }
};
