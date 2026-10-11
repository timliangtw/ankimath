const { useState, useRef } = React;
const html = htm.bind(React.createElement);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const decorations=[Array.from({length:25},(_,i)=>({x:166+9*Math.cos(i*Math.PI/12),y:120+9*Math.sin(i*Math.PI/12)})),Array.from({length:11},(_,i)=>{const angle=-Math.PI/2+i*Math.PI/5,r=i%2?6:13;return {x:165+r*Math.cos(angle),y:195+r*Math.sin(angle)};})];
function generateProblem() {
    const spread=70+Math.floor(Math.random()*20);
    return [{x:200,y:20},{x:200-spread,y:85},{x:155,y:85},{x:200-spread-20,y:155},{x:145,y:155},{x:200-spread-40,y:225},{x:185,y:225},{x:185,y:270},{x:200,y:270}];
}
const Game=()=>{
    const [left,setLeft]=useState(generateProblem);
    const [points,setPoints]=useState([]);
    const [state,setState]=useState('playing');
    const active=useRef(false),board=useRef(null);
    const target=left.map(p=>({x:400-p.x,y:p.y}));
    const locate=event=>{const r=board.current.getBoundingClientRect();return {x:(event.clientX-r.left)*400/r.width,y:(event.clientY-r.top)*300/r.height};};
    const clear=()=>{setPoints([]);setState('playing');active.current=false;};
    const check=()=>{
        const sample=[];
        const paths=[target,...decorations.map(path=>path.map(p=>({x:400-p.x,y:p.y})))];
        for(const path of paths)for(let i=1;i<path.length;i++) for(let j=0;j<=12;j++) sample.push({x:path[i-1].x+(path[i].x-path[i-1].x)*j/12,y:path[i-1].y+(path[i].y-path[i-1].y)*j/12});
        const near=(p,list)=>Math.min(...list.map(q=>distance(p,q)));
        const drawn=points.filter(Boolean);
        const ok=drawn.length>15 && sample.every(p=>near(p,drawn)<14) && drawn.every(p=>near(p,sample)<22);
        setState(ok?'correct':'wrong');if(!ok&&window.onIncorrectAnswer)window.onIncorrectAnswer();
    };
    return html`<div className="w-full mx-auto text-center" style=${{maxWidth:'800px'}}><h2 className="text-xl font-bold mb-3">聖誕樹：畫出另一半</h2><p className="mb-3">沿中間的對稱線，在右邊畫出一樣的樹形和裝飾。</p>
        <svg ref=${board} viewBox="0 0 400 300" preserveAspectRatio="none" className="w-full border rounded-lg bg-white" style=${{touchAction:'none',height:'clamp(420px, 62vh, 660px)',display:'block'}}
            onPointerDown=${e=>{if(state==='correct')return;e.currentTarget.setPointerCapture(e.pointerId);active.current=true;const p=locate(e);setPoints(prev=>[...prev,null,p]);setState('playing');}}
            onPointerMove=${e=>{if(active.current){const p=locate(e);setPoints(prev=>[...prev,p]);}}}
            onPointerUp=${()=>{active.current=false;}} onPointerCancel=${()=>{active.current=false;}}>
            <path d=${`M200 20 ${left.slice(1).map(p=>`L${p.x} ${p.y}`).join(' ')} Z`} fill="#86efac" stroke="#15803d" strokeWidth="4" />
            ${decorations.map((path,i)=>html`<polyline key=${i} points=${path.map(p=>`${p.x},${p.y}`).join(' ')} fill=${i?'#facc15':'#f87171'} stroke="#334155" strokeWidth="2" />`)}
            <line x1="200" y1="5" x2="200" y2="290" stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 6" />
            <path d=${points.reduce((out,p,i)=>p?out+`${i===0||!points[i-1]?'M':'L'}${p.x} ${p.y} `:out,'')} fill="none" stroke=${state==='correct'?'#16a34a':'#2563eb'} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="flex justify-center gap-3 my-4"><button onClick=${clear} className="border rounded-lg px-4 py-2">清除重畫</button><button onClick=${check} disabled=${points.length<2||state==='correct'} className="bg-blue-500 text-white rounded-lg px-4 py-2">檢查</button></div>
        ${state==='wrong'&&html`<p role="status" className="text-red-600">再比一比，每個轉角到中間線的距離要和左邊相同。</p>`}
        ${state==='correct'&&html`<p role="status" className="text-green-700 font-bold">完成了！左右的高度相同，到對稱線的距離也相同。</p>`}
        <button onClick=${()=>{setLeft(generateProblem());clear();}} className="my-4 text-blue-700 border rounded-lg px-4 py-2">再試一題（換圖）</button>
    </div>`;
};
export default {id:'q026',type:'custom',title:'聖誕樹：對稱補畫',q:'徒手補畫聖誕樹的另一半。',render:container=>ReactDOM.createRoot(container).render(html`<${Game} />`)};
