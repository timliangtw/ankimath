const { useState, useRef } = React;
const html = htm.bind(React.createElement);

const PATH_TEMPLATES = [
    {
        name: '山谷線',
        points: [
            { x: 0, y: 2 }, { x: 1, y: 1 }, { x: 2, y: 3 }, { x: 3, y: 0 },
            { x: 4, y: 2 }, { x: 5, y: 0 }, { x: 7, y: 3 }, { x: 8, y: 0 },
        ],
    },
    {
        name: '鋸齒線',
        points: [
            { x: 0, y: 1 }, { x: 1, y: 3 }, { x: 2, y: 0 }, { x: 3, y: 2 },
            { x: 4, y: 1 }, { x: 5, y: 3 }, { x: 6, y: 0 }, { x: 8, y: 2 },
        ],
    },
    {
        name: '高低線',
        points: [
            { x: 0, y: 3 }, { x: 1, y: 0 }, { x: 2, y: 2 }, { x: 3, y: 1 },
            { x: 4, y: 3 }, { x: 6, y: 0 }, { x: 7, y: 2 }, { x: 8, y: 1 },
        ],
    },
    {
        name: '波浪線',
        points: [
            { x: 0, y: 2 }, { x: 1, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 3 },
            { x: 4, y: 1 }, { x: 5, y: 2 }, { x: 6, y: 0 }, { x: 8, y: 3 },
        ],
    },
];

const VIEW = {
    width: 440,
    height: 170,
    left: 20,
    top: 20,
    col: 50,
    row: 42,
};

function toSvgPoint(point) {
    return {
        x: VIEW.left + point.x * VIEW.col,
        y: VIEW.top + point.y * VIEW.row,
    };
}

function generateProblem() {
    const template = PATH_TEMPLATES[Math.floor(Math.random() * PATH_TEMPLATES.length)];
    const flipY = Math.random() < 0.5;
    const points = template.points.map(point => ({
        x: point.x,
        y: flipY ? 3 - point.y : point.y,
    }));
    return {
        name: flipY ? `${template.name}（上下相反）` : template.name,
        targetPoints: points.map(toSvgPoint),
    };
}

function pointDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
}

function interpolateTargetY(targetPoints, x) {
    for (let i = 0; i < targetPoints.length - 1; i++) {
        const a = targetPoints[i];
        const b = targetPoints[i + 1];
        const minX = Math.min(a.x, b.x);
        const maxX = Math.max(a.x, b.x);
        if (x >= minX && x <= maxX) {
            const t = (x - a.x) / (b.x - a.x);
            return a.y + (b.y - a.y) * t;
        }
    }
    return null;
}

function nearestDrawnY(points, x) {
    let best = null;
    points.forEach(point => {
        const distance = Math.abs(point.x - x);
        if (!best || distance < best.distance) {
            best = { y: point.y, distance };
        }
    });
    return best && best.distance <= 18 ? best.y : null;
}

function evaluateDrawing(points, targetPoints) {
    if (points.length < 18) {
        return { ok: false, message: '線太短了，請從左邊開始把整條折線畫完。' };
    }

    const first = targetPoints[0];
    const last = targetPoints[targetPoints.length - 1];
    const minX = Math.min(...points.map(point => point.x));
    const maxX = Math.max(...points.map(point => point.x));

    if (pointDistance(points[0], first) > 45) {
        return { ok: false, message: '起點要從左邊粉紅線開始的位置出發。' };
    }
    if (pointDistance(points[points.length - 1], last) > 50) {
        return { ok: false, message: '終點要走到右上方的最後一個格點。' };
    }
    if (minX > first.x + 25 || maxX < last.x - 25) {
        return { ok: false, message: '要從左邊一路畫到右邊，不能只畫中間一段。' };
    }

    const missedTurn = targetPoints.some(target =>
        !points.some(point => pointDistance(point, target) <= 42)
    );
    if (missedTurn) {
        return { ok: false, message: '有轉折點沒有靠近格線上的位置，再對照上面的範例畫一次。' };
    }

    const sampleXs = Array.from({ length: 17 }).map((_, index) => first.x + index * ((last.x - first.x) / 16));
    const errors = sampleXs.map(x => {
        const targetY = interpolateTargetY(targetPoints, x);
        const drawnY = nearestDrawnY(points, x);
        return drawnY === null || targetY === null ? 999 : Math.abs(drawnY - targetY);
    });
    const averageError = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    const maxError = Math.max(...errors);

    if (averageError > 30 || maxError > 64) {
        return { ok: false, message: '整體形狀還不太像範例，注意每一段是往上還是往下。' };
    }

    return { ok: true, message: '你照著上面的範例，把下面的折線畫出來了。' };
}

function getPracticeLabel() {
    try {
        const key = 'sister-q006-practice-count';
        const value = Number(window.sessionStorage.getItem(key) || '0');
        window.sessionStorage.setItem(key, String(value + 1));
        return `徒手描線 ${value % 3 + 1}`;
    } catch (error) {
        return '徒手描線';
    }
}

const Grid = ({ children, muted = false }) => html`
    <svg
        viewBox=${`0 0 ${VIEW.width} ${VIEW.height}`}
        className=${`w-full rounded-2xl border-2 bg-white ${muted ? 'border-slate-200' : 'border-lime-200'}`}
    >
        ${[0, 1, 2, 3].map(row => html`
            <line key=${`h-${row}`} x1=${VIEW.left} y1=${VIEW.top + row * VIEW.row}
                x2=${VIEW.left + 8 * VIEW.col} y2=${VIEW.top + row * VIEW.row}
                stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
        `)}
        ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(col => html`
            <line key=${`v-${col}`} x1=${VIEW.left + col * VIEW.col} y1=${VIEW.top}
                x2=${VIEW.left + col * VIEW.col} y2=${VIEW.top + 3 * VIEW.row}
                stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
        `)}
        ${children}
    </svg>
`;

const ReferencePath = ({ targetPoints }) => {
    const polyline = targetPoints.map(point => `${point.x},${point.y}`).join(' ');
    return html`
        <${Grid}>
            <polyline points=${polyline} fill="none" stroke="#d94682" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            ${targetPoints.map((point, index) => html`
                <circle key=${`ref-${index}`} cx=${point.x} cy=${point.y} r="6" fill="#d94682" />
            `)}
            <text x="20" y="160" fontSize="13" fill="#64748b" fontWeight="700">範例</text>
        <//>
    `;
};

const DrawingBoard = ({ points, boardRef, onStart, onMove, onEnd, gameState }) => {
    const polyline = points.map(point => `${point.x},${point.y}`).join(' ');
    const stroke = gameState === 'correct' ? '#16a34a' : '#2563eb';
    return html`
        <div
            className="relative w-full touch-none cursor-crosshair select-none"
            style=${{ lineHeight: 0 }}
        >
            <svg
                viewBox=${`0 0 ${VIEW.width} ${VIEW.height}`}
                className="w-full rounded-2xl border-2 border-blue-200 bg-white pointer-events-none"
            >
                ${[0, 1, 2, 3].map(row => html`
                    <line key=${`draw-h-${row}`} x1=${VIEW.left} y1=${VIEW.top + row * VIEW.row}
                        x2=${VIEW.left + 8 * VIEW.col} y2=${VIEW.top + row * VIEW.row}
                        stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
                `)}
                ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(col => html`
                    <line key=${`draw-v-${col}`} x1=${VIEW.left + col * VIEW.col} y1=${VIEW.top}
                        x2=${VIEW.left + col * VIEW.col} y2=${VIEW.top + 3 * VIEW.row}
                        stroke="#86a36d" strokeWidth="2" strokeDasharray="7 7" />
                `)}
                ${points.length > 1 && html`
                    <polyline points=${polyline} fill="none" stroke=${stroke} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
                `}
                ${points.length === 0 && html`
                    <text x="20" y="160" fontSize="13" fill="#64748b" fontWeight="700">在這裡徒手畫一條一樣的線</text>
                `}
            </svg>
            <div
                ref=${boardRef}
                className="absolute inset-0 rounded-2xl"
                style=${{ touchAction: 'none' }}
                aria-label="徒手畫線區"
                onMouseDown=${onStart}
                onMouseMove=${onMove}
                onMouseUp=${onEnd}
                onMouseLeave=${onEnd}
                onTouchStart=${onStart}
                onTouchMove=${onMove}
                onTouchEnd=${onEnd}
                onTouchCancel=${onEnd}
            ></div>
        </div>
    `;
};

const TracePathGame = () => {
    const [problem, setProblem] = useState(generateProblem);
    const [points, setPoints] = useState([]);
    const [gameState, setGameState] = useState('playing');
    const [message, setMessage] = useState('');
    const [practiceLabel] = useState(getPracticeLabel);
    const pointsRef = useRef([]);
    const boardRef = useRef(null);
    const drawingRef = useRef(false);
    const gameStateRef = useRef(gameState);

    gameStateRef.current = gameState;

    const clientPoint = (clientX, clientY) => {
        const rect = boardRef.current.getBoundingClientRect();
        return {
            x: ((clientX - rect.left) / rect.width) * VIEW.width,
            y: ((clientY - rect.top) / rect.height) * VIEW.height,
        };
    };

    const startAt = (clientX, clientY) => {
        if (gameStateRef.current === 'correct') return;
        const point = clientPoint(clientX, clientY);
        pointsRef.current = [point];
        setPoints([point]);
        drawingRef.current = true;
        setGameState('playing');
        setMessage('');
    };

    const moveAt = (clientX, clientY) => {
        if (!drawingRef.current || gameStateRef.current === 'correct') return;
        const point = clientPoint(clientX, clientY);
        const previous = pointsRef.current[pointsRef.current.length - 1];
        if (previous && pointDistance(previous, point) < 3) return;
        const next = [...pointsRef.current, point];
        pointsRef.current = next;
        setPoints(next);
    };

    const eventSource = (event) => event.touches && event.touches.length > 0 ? event.touches[0] : event;

    const startDrawing = (event) => {
        event.preventDefault();
        const source = eventSource(event);
        startAt(source.clientX, source.clientY);
    };

    const moveDrawing = (event) => {
        if (!drawingRef.current) return;
        event.preventDefault();
        const source = eventSource(event);
        moveAt(source.clientX, source.clientY);
    };

    const stopDrawing = () => {
        drawingRef.current = false;
    };

    const bindBoard = (board) => {
        if (!board || board.__q006Bound) return;
        boardRef.current = board;
        board.__q006Bound = true;
        const onMouseDown = (event) => {
            event.preventDefault();
            startAt(event.clientX, event.clientY);
        };
        const onMouseMove = (event) => moveAt(event.clientX, event.clientY);
        const onMouseUp = () => stopDrawing();
        const onTouchStart = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) startAt(event.touches[0].clientX, event.touches[0].clientY);
        };
        const onTouchMove = (event) => {
            event.preventDefault();
            if (event.touches.length > 0) moveAt(event.touches[0].clientX, event.touches[0].clientY);
        };

        board.addEventListener('mousedown', onMouseDown);
        board.addEventListener('touchstart', onTouchStart, { passive: false });
        board.addEventListener('touchmove', onTouchMove, { passive: false });
        board.addEventListener('touchend', onMouseUp);
        board.addEventListener('touchcancel', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        board.__q006Cleanup = () => {
            board.removeEventListener('mousedown', onMouseDown);
            board.removeEventListener('touchstart', onTouchStart);
            board.removeEventListener('touchmove', onTouchMove);
            board.removeEventListener('touchend', onMouseUp);
            board.removeEventListener('touchcancel', onMouseUp);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    };

    const clearDrawing = () => {
        pointsRef.current = [];
        setPoints([]);
        setGameState('playing');
        setMessage('');
    };

    const checkDrawing = () => {
        const result = evaluateDrawing(points, problem.targetPoints);
        setMessage(result.message);
        if (result.ok) {
            setGameState('correct');
        } else {
            if (window.onIncorrectAnswer) window.onIncorrectAnswer();
            setGameState('wrong');
        }
    };

    const nextProblem = () => {
        setProblem(generateProblem());
        clearDrawing();
    };

    return html`
        <div className="w-full font-sans text-left mx-auto max-w-2xl">
            <div className="text-center mb-5">
                <div className="inline-block bg-lime-600 text-white px-4 py-1 rounded-full font-bold shadow-sm mb-3">
                    描一描
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-relaxed">
                    看上面的範例，在下面徒手畫一條一樣的折線
                </h1>
                <p className="text-slate-500 font-bold mt-2">${practiceLabel}：${problem.name}</p>
            </div>

            <div className="bg-lime-50 border-2 border-lime-100 rounded-2xl p-4 mb-4">
                <div className="text-center font-black text-lime-700 mb-2">先看範例</div>
                <${ReferencePath} targetPoints=${problem.targetPoints} />
            </div>

            <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 mb-5">
                <div className="text-center font-black text-blue-700 mb-2">在這裡畫</div>
                <${DrawingBoard}
                    points=${points}
                    boardRef=${bindBoard}
                    onStart=${startDrawing}
                    onMove=${moveDrawing}
                    onEnd=${stopDrawing}
                    gameState=${gameState}
                />
                <div className="mt-3 flex gap-3">
                    <button
                        onClick=${clearDrawing}
                        className="flex-1 py-3 bg-white border border-blue-200 text-blue-600 font-black rounded-xl shadow-sm active:scale-95"
                    >
                        清除重畫
                    </button>
                    <button
                        onClick=${checkDrawing}
                        disabled=${points.length < 2 || gameState === 'correct'}
                        className=${`
                            flex-1 py-3 font-black rounded-xl shadow-sm active:scale-95
                            ${points.length < 2 || gameState === 'correct'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'}
                        `}
                    >
                        檢查
                    </button>
                </div>
            </div>

            ${gameState === 'wrong' && html`
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center mb-4">
                    <div className="text-red-500 font-bold text-lg">再畫一次</div>
                    <p className="text-red-600 text-sm mt-1">${message}</p>
                </div>
            `}

            ${gameState === 'correct' && html`
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center mb-4">
                    <div className="text-green-600 font-bold text-xl mb-2">完成了！</div>
                    <p className="text-slate-700 font-bold leading-relaxed">
                        ${message}
                    </p>
                    <button
                        onClick=${nextProblem}
                        className="mt-4 px-6 py-2 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                    >
                        再描一題（換範例）
                    </button>
                </div>
            `}
        </div>
    `;
};

export default {
    id: 'q006',
    type: 'custom',
    title: '描一描：照樣畫折線',
    q: '觀察上方格線中的折線，在下方空白格線徒手畫出一樣的線。',
    render: (container) => {
        const root = ReactDOM.createRoot(container);
        root.render(html`<${TracePathGame} />`);
    }
};
