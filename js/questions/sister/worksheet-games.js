const { useState } = React;
const html = htm.bind(React.createElement);
const pick = items => items[Math.floor(Math.random() * items.length)];
const mix = items => items.map(value => ({ value, order: Math.random() })).sort((a,b) => a.order-b.order).map(item => item.value);
const svg = body => html`<svg viewBox="0 0 300 240" className="w-full" style=${{maxHeight:'260px'}}>${React.Children.toArray(body)}</svg>`;

function cubes(heights, color) {
    const cells = [];
    heights.forEach((row,y) => row.forEach((height,x) => {
        for(let z=0;z<height;z++) cells.push({x,y,z});
    }));
    cells.sort((a,b) => a.x+a.y-b.x-b.y || a.z-b.z);
    return svg(cells.map(({x,y,z}) => {
        const cx=150+(x-y)*27, cy=100+(x+y)*14-z*28;
        return html`<g key=${`${x}-${y}-${z}`} stroke="#334155" strokeWidth="1.5">
            <polygon points=${`${cx},${cy} ${cx+27},${cy+14} ${cx},${cy+28} ${cx-27},${cy+14}`} fill=${color} />
            <polygon points=${`${cx-27},${cy+14} ${cx},${cy+28} ${cx},${cy+56} ${cx-27},${cy+42}`} fill=${color} style=${{filter:'brightness(.85)'}} />
            <polygon points=${`${cx},${cy+28} ${cx+27},${cy+14} ${cx+27},${cy+42} ${cx},${cy+56}`} fill=${color} style=${{filter:'brightness(.65)'}} />
        </g>`;
    }));
}

function pizza(mask, remaining=false) {
    const slices=8;
    return svg(html`<g transform="translate(150 120)">
        ${Array.from({length:slices},(_,i) => {
            if (remaining ? mask.includes(i) : !mask.includes(i)) return null;
            const a=i*Math.PI/4, b=(i+1)*Math.PI/4;
            return html`<g key=${i}><path d=${`M0 0 L${90*Math.cos(a)} ${90*Math.sin(a)} A90 90 0 0 1 ${90*Math.cos(b)} ${90*Math.sin(b)} Z`} fill="#facc15" stroke="#b45309" strokeWidth="5" />
                <circle cx=${58*Math.cos((a+b)/2)} cy=${58*Math.sin((a+b)/2)} r="7" fill="#ef4444" />
                <circle cx=${35*Math.cos((a+b)/2)} cy=${35*Math.sin((a+b)/2)} r="5" fill="#22c55e" />
            </g>`;
        })}
    </g>`);
}

export function countedShapes(kind) {
    const rectangle=(x,y,w,h)=>`M${x} ${y}h${w}v${h}h${-w}Z`;
    if(kind==='square') return [
        ...[10,65].flatMap(y=>[150,205].map(x=>rectangle(x,y,55,55))),
        ...[10,120].flatMap(y=>[40,150].map(x=>rectangle(x,y,110,110))),
        rectangle(40,10,220,220)
    ];
    if(kind==='triangle') return ['M150 10L85 101H215Z','M150 10L50 150H250Z',
        'M150 80L135 101H165Z','M150 80L100 150H200Z','M150 80L50 220H250Z'];
    if(kind==='rectangle') {
        const levels=[35,85,135,185];
        return [...levels.flatMap((y,i)=>levels.slice(i+1).map(end=>rectangle(60,y,180,end-y))),
            rectangle(20,35,40,100),rectangle(20,35,220,100),
            rectangle(240,85,40,100),rectangle(60,85,220,100)];
    }
    return [0,Math.PI/2,Math.PI/4].flatMap(angle=>[angle,angle+Math.PI].map(a=>
        `M${150+100*Math.cos(a)} ${120+100*Math.sin(a)} A100 100 0 0 1 ${150-100*Math.cos(a)} ${120-100*Math.sin(a)} Z`));
}

function countDiagram(kind, highlight=null, compact=false) {
    if(highlight!==null) return html`<svg viewBox="0 0 300 240" className="w-full" style=${{maxHeight:compact?'140px':'420px'}}>
        <g opacity=".3">${countDiagram(kind).props.children}</g>
        <path d=${countedShapes(kind)[highlight]} fill="#06b6d4" fillOpacity=".2" stroke="#0891b2" strokeWidth="5" strokeLinejoin="round" />
    </svg>`;
    if(kind==='square') return svg(html`<g fill="none" stroke="#2563eb" strokeWidth="4"><rect x="40" y="10" width="220" height="220" /><path d="M150 10V230 M40 120H260 M205 10V120 M150 65H260" /></g>`);
    if(kind==='triangle') return svg(html`<g fill="none" stroke="#db2777" strokeWidth="4"><path d="M150 10L50 150H250Z M150 80L50 220H250Z M85 101H215" /></g>`);
    if(kind==='rectangle') return svg(html`<g fill="none" stroke="#ea580c" strokeWidth="4"><rect x="20" y="35" width="220" height="100" /><rect x="60" y="85" width="220" height="100" /><path d="M60 35V185 M240 35V185" /></g>`);
    return svg(html`<circle cx="150" cy="120" r="100" fill="none" stroke="#65a30d" strokeWidth="4" /><path d="M50 120H250 M150 20V220 M79.29 49.29L220.71 190.71" fill="none" stroke="#65a30d" strokeWidth="4" />`);
}

function scene(clip=null) {
    return html`<g key=${clip||'scene'} clipPath=${clip ? `url(#${clip})` : undefined}>
        <rect width="300" height="240" fill="#7dd3fc" /><rect y="160" width="300" height="80" fill="#86efac" />
        <circle cx="245" cy="45" r="25" fill="#facc15" /><path d="M20 160V80L85 25 150 80V160Z" fill="#fb7185" stroke="#be123c" strokeWidth="4" />
        <rect x="65" y="100" width="35" height="60" fill="#fef08a" /><rect x="30" y="90" width="25" height="25" fill="#bfdbfe" />
        <rect x="207" y="104" width="12" height="85" fill="#a16207" /><circle cx="213" cy="95" r="42" fill="#16a34a" />
        <path d="M0 220Q120 150 300 225" fill="none" stroke="#fef08a" strokeWidth="20" />
    </g>`;
}

export function generateWorksheet(kind) {
    if(kind==='count') {
        const type=pick(['semicircle','square','triangle','rectangle']);
        const answers={semicircle:6,square:9,triangle:5,rectangle:10};
        return {type, answer:answers[type], label:{semicircle:'半圓',square:'正方形',triangle:'三角形',rectangle:'長方形'}[type]};
    }
    if(kind==='cubes'||kind==='blocks') {
        const heights=kind==='cubes' ? pick([[[3,3,1],[1,1,0]],[[4,3,2,1]],[[3,2,1],[1,1,1],[1,1,1]]]) : pick([[[2,2,2],[2,2,2]],[[3,1],[2,1]],[[3,3],[3,1]],[[2,2,2],[2,2,2],[1,0,0]]]);
        return {heights,answer:heights.flat().reduce((a,b)=>a+b,0),color:pick(['#38bdf8','#a78bfa','#facc15','#4ade80'])};
    }
    if(kind==='pizza') {
        const masks=mix([[0,1],[2,3,4],[0,2],[4,5],[1,2,3],[5,7]]).slice(0,4);
        return {mask:masks[0],options:mix(masks),answer:JSON.stringify(masks[0])};
    }
    if(kind==='kite') {
        const row=1+Math.floor(Math.random()*3), col=1+Math.floor(Math.random()*4);
        const up=Math.random()<.5, left=Math.random()<.5;
        return {row,col,up,left,answer:(row-1)*4+col-1,colors:mix(['#ec4899','#38bdf8','#a78bfa','#a3e635','#fb923c','#2dd4bf','#f87171','#facc15','#c084fc','#60a5fa','#4ade80','#f472b6'])};
    }
    if(kind==='water') {
        const widths=mix([55,70,85,100]);
        return {widths,cherries:pick([3,4,5]),answer:widths.indexOf(100)};
    }
    const shapes=['0,0 150,0 150,240 0,240','150,0 300,0 300,120 150,120','150,120 300,120 300,240 150,240','0,0 100,0 100,100 0,100'];
    const options=mix(shapes.map((shape,index)=>({shape,index})));
    return {options,answer:3};
}

export function worksheetQuestion(id,kind,title) {
    const Game=()=>{
        const [problem,setProblem]=useState(()=>generateWorksheet(kind));
        const [value,setValue]=useState('');
        const [state,setState]=useState('playing');
        const [activeShape,setActiveShape]=useState(0);
        const next=()=>{setProblem(generateWorksheet(kind));setValue('');setState('playing');setActiveShape(0);};
        const submit=answer=>{
            if(state==='correct') return;
            if(answer===problem.answer) setState('correct');
            else {setState('wrong');if(window.onIncorrectAnswer) window.onIncorrectAnswer();}
        };
        const button=(content,answer,key)=>html`<button key=${key} disabled=${state==='correct'} onClick=${()=>submit(answer)} className=${`border-2 rounded-lg p-2 ${state==='correct'&&answer===problem.answer?'border-green-500 bg-green-100':'border-blue-200 bg-white hover:bg-blue-50'}`}>${content}</button>`;
        let question,body,explanation;
        if(kind==='count') {
            question=`圖中一共有幾個${problem.label}？`; body=countDiagram(problem.type,state==='correct'?activeShape:null);
            explanation={semicircle:'每條直徑把圓分成兩個半圓，共有 3 條直徑：3 × 2 = 6 個半圓。',square:'小正方形 4 個，四分之一大小的正方形 4 個，最外面 1 個：4 + 4 + 1 = 9。',triangle:'上面的三角形有 2 個，下面的三角形有 3 個：2 + 3 = 5。',rectangle:'中間寬的一區有 6 個長方形，加上左右各 2 個：6 + 2 + 2 = 10。'}[problem.type];
        } else if(kind==='cubes'||kind==='blocks') {
            question='一共有幾塊積木？';body=cubes(problem.heights,problem.color);
            const layers=Array.from({length:Math.max(...problem.heights.flat())},(_,z)=>problem.heights.flat().filter(h=>h>z).length);
            explanation=`由下往上分層數：${layers.join(' + ')} = ${problem.answer}。被擋住、支撐上層的積木也要算。`;
        } else if(kind==='pizza') {
            question='比薩吃掉的部分是哪一片？';
            body=html`<div>${pizza(problem.mask,true)}<div className="grid grid-cols-2 gap-3">${problem.options.map((mask,i)=>button(pizza(mask),JSON.stringify(mask),i))}</div></div>`;
            explanation='這一片的形狀和方向，剛好能補上比薩的缺口。';
        } else if(kind==='kite') {
            question=`從${problem.up?'上往下':'下往上'}數第 ${problem.up?problem.row:4-problem.row} 行，從${problem.left?'左往右':'右往左'}數第 ${problem.left?problem.col:5-problem.col} 列，是哪個風箏？`;
            body=html`<div className="grid grid-cols-4 gap-2">${problem.colors.map((color,i)=>button(svg(html`<path d="M150 30L225 100 150 170 75 100Z" fill=${color} stroke="#334155" strokeWidth="4" /><path d="M150 170Q100 195 150 225" fill="none" stroke="#334155" strokeWidth="4" />`),i,i))}</div>`;
            explanation=`換成從上、從左數，是第 ${problem.row} 行、第 ${problem.col} 列。`;
        } else if(kind==='water') {
            question='每杯放入一樣多的櫻桃後，哪一杯的水最多？';
            body=html`<div className="grid grid-cols-2 gap-3">${problem.widths.map((w,i)=>button(svg(html`<text x="150" y="30" textAnchor="middle" fontSize="22">${'🍒'.repeat(problem.cherries)}</text><rect x=${150-w/2} y="55" width=${w} height="150" rx="12" fill="#e0f2fe" stroke="#475569" strokeWidth="4" /><rect x=${153-w/2} y="115" width=${w-6} height="85" rx="8" fill="#38bdf8" /><path d=${`M${150-w/2} 115H${150+w/2}`} stroke="#0284c7" strokeWidth="2" />`),i,i))}</div>`;
            explanation='水一樣高時，最寬的杯子裝的水最多。放入相同數量、相同大小的櫻桃，不會改變原本的水量。';
        } else {
            question='哪一塊拼圖是多餘的？';
            body=html`<div>${svg(scene())}<div className="grid grid-cols-2 gap-3">${problem.options.map((option,i)=>button(svg(html`<defs key="clip"><clipPath id=${`${id}-piece-${i}`}><polygon points=${option.shape} /></clipPath></defs>${scene(`${id}-piece-${i}`)}<polygon key="outline" points=${option.shape} fill="none" stroke="#334155" strokeWidth="3" />`),option.index,i))}</div></div>`;
            explanation='其餘三片剛好拼成完整圖片；這片和左半邊的內容重複，是多餘的。';
        }
        const numeric=['count','cubes','blocks'].includes(kind);
        return html`<div className="max-w-2xl mx-auto text-center p-2"><h2 className="text-xl font-bold mb-3">${title}</h2><p className="text-lg mb-4">${question}</p>${body}
            ${numeric&&html`<form onSubmit=${event=>{event.preventDefault();submit(value.trim()===''?null:Number(value));}} className="flex justify-center gap-3 my-4"><input aria-label="答案" type="number" min="0" value=${value} onChange=${event=>setValue(event.target.value)} disabled=${state==='correct'} className="w-24 border-2 rounded-lg p-2 text-xl text-center" /><button disabled=${state==='correct'} className="bg-blue-500 text-white rounded-lg px-5">送出</button></form>`}
            ${state==='wrong'&&html`<p role="status" className="text-red-600 my-4">再觀察一次，還可以繼續作答。</p>`}
            ${state==='correct'&&html`<div role="status" className="text-green-700 my-4"><strong className="text-xl">答對了！</strong><p className="mt-2">${explanation}</p>${numeric&&html`<strong className="text-2xl">${problem.answer}</strong>`}</div>`}
            ${kind==='count'&&state==='correct'&&html`<section aria-label="圖形逐個講解">
                <p className="font-bold my-3">第 ${activeShape+1} 個${problem.label}（共 ${problem.answer} 個）</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">${countedShapes(problem.type).map((shape,i)=>html`
                    <button key=${i} type="button" aria-label=${`第 ${i+1} 個${problem.label}`} aria-pressed=${activeShape===i}
                        onClick=${()=>setActiveShape(i)} className="border-2 rounded-lg p-2"
                        style=${{borderColor:activeShape===i?'#0891b2':'#d1d5db',background:activeShape===i?'#ecfeff':'white',minHeight:'48px'}}>
                        ${countDiagram(problem.type,i,true)}<strong>${i+1}</strong>
                    </button>`)}</div>
            </section>`}
            <button onClick=${next} className="my-4 border border-blue-300 text-blue-700 rounded-lg px-5 py-2">再試一題（換圖）</button>
        </div>`;
    };
    return {id,type:'custom',title,q:title,render:container=>ReactDOM.createRoot(container).render(html`<${Game} />`)};
}
