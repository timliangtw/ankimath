const {useState,useRef}=React;
const html=htm.bind(React.createElement);

export function generateProblem() {
    const costs=Array.from({length:10},()=>Array.from({length:3},(_,lane)=>1+Math.floor(Math.random()*(lane===1?6:9))));
    let totals=[0,0,0],paths=[[],[],[]];
    costs.forEach(row=>{
        const next=row.map((cost,lane)=>{
            const previous=[0,1,2].filter(v=>Math.abs(v-lane)<=1).sort((a,b)=>totals[a]-totals[b])[0];
            return {total:totals[previous]+cost,path:[...paths[previous],lane]};
        });
        totals=next.map(v=>v.total);paths=next.map(v=>v.path);
    });
    const best=totals.indexOf(Math.min(...totals));
    return {costs,answer:totals[best],path:paths[best]};
}

function Game() {
    const [problem,setProblem]=useState(generateProblem),[route,setRoute]=useState([]),[state,setState]=useState('playing');
    const board=useRef(null),drawing=useRef(false),routeRef=useRef([]);
    const position=(row,lane)=>({x:70+lane*130,y:75+row*65});
    const append=(row,lane)=>{
        const current=routeRef.current;
        if(state==='correct'||row!==current.length||(row>0&&Math.abs(lane-current[row-1])>1))return;
        const next=[...current,lane];routeRef.current=next;setRoute(next);setState('playing');
    };
    const touch=e=>{
        const rect=board.current.getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width*400,y=(e.clientY-rect.top)/rect.height*760;
        const row=Math.round((y-75)/65),lane=Math.round((x-70)/130);
        if(row<0||row>9||lane<0||lane>2)return;
        const point=position(row,lane);if(Math.hypot(x-point.x,y-point.y)<32)append(row,lane);
    };
    const clear=()=>{drawing.current=false;routeRef.current=[];setRoute([]);setState('playing');};
    const total=route.reduce((sum,lane,row)=>sum+problem.costs[row][lane],0);
    const check=()=>{if(state==='correct'||route.length!==10)return;if(total===problem.answer)setState('correct');else{setState('wrong');if(window.onIncorrectAnswer)window.onIncorrectAnswer();}};
    const points=route.map((lane,row)=>position(row,lane));
    return html`<div className="w-full mx-auto text-center" style=${{maxWidth:'800px'}}>
        <h2 className="text-xl font-bold mb-3">小老鼠：最省體力的路線</h2>
        <p className="text-lg mb-3">小老鼠有 70 點體力。從上往下，每排走一個木樁，只能走到下一排的同欄或相鄰欄，不能後退。走滿 10 步到乳酪，找出消耗最少的路線。</p>
        <svg ref=${board} viewBox="0 0 400 760" preserveAspectRatio="none" className="w-full border rounded-lg bg-blue-50"
            style=${{height:'clamp(700px, 80vh, 950px)',touchAction:'none',display:'block'}}
            onPointerDown=${e=>{if(state==='correct')return;e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;touch(e);}}
            onPointerMove=${e=>{if(drawing.current)touch(e);}} onPointerUp=${()=>{drawing.current=false;}} onPointerCancel=${()=>{drawing.current=false;}}>
            <text x="200" y="30" textAnchor="middle" fontSize="22">小老鼠出發</text>
            ${problem.costs.slice(0,9).flatMap((row,r)=>row.flatMap((cost,l)=>[0,1,2].filter(next=>Math.abs(l-next)<=1).map(next=>{const a=position(r,l),b=position(r+1,next);return html`<line key=${`${r}-${l}-${next}`} x1=${a.x} y1=${a.y} x2=${b.x} y2=${b.y} stroke="#cbd5e1" strokeWidth="2" />`;})))}
            ${points.length>1&&html`<polyline points=${points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth="8" />`}
            ${state==='correct'&&html`<polyline points=${problem.path.map((lane,row)=>{const p=position(row,lane);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="#16a34a" strokeWidth="5" strokeDasharray="8 5" />`}
            ${problem.costs.flatMap((row,r)=>row.map((cost,l)=>{const p=position(r,l);return html`<g key=${`${r}-${l}`}><circle cx=${p.x} cy=${p.y} r="26" fill=${route[r]===l?'#bfdbfe':'#fef3c7'} stroke=${route[r]===l?'#2563eb':'#a16207'} strokeWidth="3" /><text x=${p.x} y=${p.y+7} textAnchor="middle" fontSize="23" fontWeight="bold">${cost}</text></g>`;}))}
            <text x="200" y="735" textAnchor="middle" fontSize="24">乳酪</text>
        </svg>
        <p className="my-3 font-bold">已走 ${route.length} / 10 步；消耗 ${total}；剩下 ${70-total}</p>
        <div className="flex justify-center gap-3"><button onClick=${clear} className="border rounded-lg px-5 py-3">清除重畫</button><button onClick=${check} disabled=${route.length!==10||state==='correct'} className="bg-blue-500 text-white rounded-lg px-5 py-3">檢查路線</button></div>
        ${state==='wrong'&&html`<p role="status" className="text-red-600 my-4">還有更省體力的路線，可以清除後再試。</p>`}
        ${state==='correct'&&html`<section role="status" className="text-green-700 my-4"><strong className="text-xl">答對了！</strong><p>最少消耗：${problem.path.map((lane,row)=>problem.costs[row][lane]).join(' + ')} = ${problem.answer}。</p><p>綠色虛線是一條最省體力的路線。每次前進都要比較後面整段路，不是只挑眼前最小的數。</p><strong>剩下 ${70-problem.answer} 點體力</strong></section>`}
        <button onClick=${()=>{setProblem(generateProblem());clear();}} className="my-4 border text-blue-700 rounded-lg px-5 py-3">再試一題（換路線）</button>
    </div>`;
}
export default {id:'q063',type:'custom',title:'小老鼠：最省體力的路線',q:'走滿十步，找出最省體力的路線',render:container=>ReactDOM.createRoot(container).render(html`<${Game} />`)};
