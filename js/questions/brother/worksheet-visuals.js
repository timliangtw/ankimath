const html=htm.bind(React.createElement);

const picture=(body,label,viewBox='0 0 360 240')=>html`<svg role="img" aria-label=${label} viewBox=${viewBox} className="w-full" style=${{maxHeight:'360px'}}>${React.Children.toArray(body)}</svg>`;
const egg=(x,y,key)=>html`<ellipse key=${key} cx=${x} cy=${y} rx="12" ry="16" fill="#fef3c7" stroke="#a16207" strokeWidth="2" />`;
const person=(x,y,key,color='#0284c7')=>html`<g key=${key} fill=${color}><circle cx=${x} cy=${y} r="6" /><path d=${`M${x-8} ${y+10}h16v18h-16Z`} /></g>`;
const block=(x,y,key)=>html`<g key=${key} stroke="#0e7490" strokeWidth="2"><path d=${`M${x} ${y}l20 -10 20 10 -20 10Z`} fill="#a5f3fc" /><path d=${`M${x} ${y}l20 10v24l-20 -10Z`} fill="#67e8f9" /><path d=${`M${x+20} ${y+10}l20 -10v24l-20 10Z`} fill="#22d3ee" /></g>`;
const cake=(key,pieces=0)=>picture(html`<circle cx="90" cy="90" r="65" fill="#fbcfe8" stroke="#be185d" strokeWidth="3" />${Array.from({length:pieces},(_,i)=>{const a=i*2*Math.PI/pieces;return html`<line key=${i} x1="90" y1="90" x2=${90+65*Math.sin(a)} y2=${90-65*Math.cos(a)} stroke="#be185d" strokeWidth="2" />`;})}`,'一個完整蛋糕','0 0 180 180');

function eggBox(count,label,key) {
    const columns=count/2;
    return html`<div key=${key}>${picture(html`<rect x="25" y="35" width="310" height="150" rx="8" fill="#ecfdf5" stroke="#059669" strokeWidth="3" />${Array.from({length:count},(_,i)=>egg(55+(i%columns)*250/(columns-1),75+Math.floor(i/columns)*65,i))}` ,`${count} 顆裝雞蛋`)}<p className="font-bold">${label}</p></div>`;
}

export function worksheetVisual(p,correct) {
    if(['eggs','egg-left','egg-exact'].includes(p.kind))return html`<figure aria-label="雞蛋包裝示意圖" className="my-4">
        <div className=${`grid ${p.kind==='egg-exact'?'grid-cols-1 sm:grid-cols-3':'grid-cols-2'} gap-3`}>
            ${p.kind==='egg-exact'?[6,8,10].map(count=>eggBox(count,`${count} 顆／盒`,count)):[eggBox(10,`原本：${p.total/10} 盒，每盒 10 顆`,10),eggBox(8,`改買：${p.kind==='eggs'?'？':p.buy} 盒，每盒 8 顆`,8)]}
        </div>
        ${p.kind==='egg-left'&&html`<figcaption className="my-3">兩種買法用掉一樣多雞蛋；改買後剩 ${p.left} 顆。</figcaption>`}
        ${p.kind==='egg-exact'&&html`<figcaption className="my-3">需要剛好 ${p.used} 顆，不能拆盒購買。</figcaption>`}
        ${correct&&html`<div className="font-bold text-green-700 my-3">${p.kind==='eggs'?`${p.buy} 盒 × 8 顆 = ${p.buy*8} 顆，足夠 ${p.total} 顆`:p.kind==='egg-left'?`買進 ${p.buy*8} 顆 − 剩下 ${p.left} 顆 = 用掉 ${p.used} 顆`:`6、8、10 顆都可以兩顆一組；${p.used%2?'需求最後會落單一顆':'需求可以湊成完整組合'}`}</div>`}
    </figure>`;
    if(p.kind==='prizes')return html`<figure aria-label="獎金比較圖" className="my-4">${picture(html`
        <text x="10" y="35" fontSize="18">第一名</text><rect x="100" y="12" width="90" height="32" fill="#38bdf8" /><rect x="190" y="12" width="45" height="32" fill="#fb7185" /><text x="250" y="35" fontSize="16">多 ${p.first-p.second} 元</text>
        <text x="10" y="105" fontSize="18">第二名</text><rect x="100" y="82" width="90" height="32" fill="#38bdf8" /><text x="200" y="105" fontSize="17">${correct?p.second:'？'} 元</text>
        <text x="10" y="175" fontSize="18">第三名</text><rect x="100" y="152" width="65" height="32" fill="#38bdf8" /><path d="M165 150H190V186H165Z" fill="none" stroke="#db2777" strokeWidth="2" strokeDasharray="5 4" /><text x="200" y="175" fontSize="16">少 ${p.second-p.third} 元</text>
        <text x="100" y="225" fontSize="18">第三名已知：${p.third} 元</text>`,'前三名獎金的多與少')}
        <figcaption>藍色比較基本獎金，粉色表示第一名多出的部分。</figcaption>
    </figure>`;
    if(p.kind==='share')return html`<figure aria-label="平均分蛋糕示意圖" className="my-4">
        <div className="flex justify-center gap-2">${Array.from({length:p.cakes},(_,i)=>html`<div key=${i} style=${{width:`${Math.min(150,300/p.cakes)}px`}}>${cake(i,correct?p.people/p.cakes:0)}</div>`)}</div>
        ${picture(html`${Array.from({length:p.people},(_,i)=>person(35+(i%9)*36,25+Math.floor(i/9)*55,i,i<p.boys?'#0284c7':'#db2777'))}`,'參與分蛋糕的小朋友','0 0 360 145')}
        <figcaption>${p.cakes} 個蛋糕平均分給 ${p.boys} 個男生和 ${p.girls} 個女生${correct?`；每人拿一個 1/${p.people/p.cakes} 的扇形`:''}。</figcaption>
    </figure>`;
    if(p.kind==='multiples')return html`<figure aria-label="圖卡倍數關係圖" className="my-4">
        ${picture(html`
            <text x="10" y="35" fontSize="18">欣宜</text><rect x="80" y="12" width="90" height="35" fill="#bae6fd" stroke="#0284c7" /><text x="125" y="36" textAnchor="middle" fontSize="18">${p.base} 張</text>
            <path d="M125 52V77" stroke="#64748b" strokeWidth="3" /><text x="150" y="70" fontSize="18">× ${p.a}</text>
            <text x="10" y="112" fontSize="18">至奇</text><rect x="80" y="90" width="90" height="35" fill="#fce7f3" stroke="#db2777" /><text x="125" y="114" textAnchor="middle" fontSize="18">${correct?p.second:'？'} 張</text>
            <path d="M125 130V155" stroke="#64748b" strokeWidth="3" /><text x="150" y="148" fontSize="18">× ${p.b}</text>
            <text x="10" y="190" fontSize="18">品嫻</text><rect x="80" y="168" width="90" height="35" fill="#dcfce7" stroke="#16a34a" /><text x="125" y="192" textAnchor="middle" fontSize="18">${correct?p.third:'？'} 張</text>
            <path d="M210 15H230V200H210" stroke="#16a34a" strokeWidth="3" fill="none" /><text x="250" y="110" fontSize="18">${correct?p.answer:'？'} 倍</text>`,'三人的圖卡數量與倍數')}
    </figure>`;
    if(p.kind==='digit-sum')return html`<figure aria-label="三位數位值圖" className="my-4">
        ${picture(html`${['百位','十位','個位'].map((label,i)=>html`<g key=${i}><text x=${65+i*115} y="35" textAnchor="middle" fontSize="20">${label}</text><rect x=${20+i*115} y="50" width="90" height="70" rx="6" fill=${i===0?'#bae6fd':'#fce7f3'} stroke="#475569" strokeWidth="2" /><text x=${65+i*115} y="96" textAnchor="middle" fontSize="28">？</text></g>`)}<text x="180" y="165" textAnchor="middle" fontSize="20">三個數字加起來 = ${p.sum}</text><text x="180" y="205" textAnchor="middle" fontSize="18">百位不能是 0；整個數小於 ${p.limit}</text>`,'百位十位個位的總和')}
        ${correct&&html`<div className="flex flex-wrap justify-center gap-2">${p.numbers.map(number=>html`<span key=${number} className="border border-green-600 bg-green-50 rounded-lg px-3 py-2 font-bold">${String(number).split('').join(' + ')} → ${number}</span>`)}</div>`}
    </figure>`;
    if(p.kind==='formation')return html`<figure aria-label="隊伍位置示意圖" className="my-4">${picture(html`
        ${[0,1,2].flatMap(row=>[0,1,2,3,4].map(col=>person(45+col*62,60+row*42,`${row}-${col}`,row===2&&col===2?'#db2777':'#0284c7')))}
        <path d="M30 28H155 M175 28H300" stroke="#475569" strokeWidth="2" /><text x="90" y="20" textAnchor="middle" fontSize="16">左數第 ${p.left} 行</text><text x="245" y="20" textAnchor="middle" fontSize="16">右數第 ${p.right} 行</text>
        <text x="335" y="105" textAnchor="middle" fontSize="18">⋮</text><text x="335" y="150" textAnchor="middle" fontSize="15">前面</text><text x="335" y="175" textAnchor="middle" fontSize="15">${p.front} 人</text>
        <text x="170" y="212" textAnchor="middle" fontSize="18" fill="#be185d">玟晴站最後面</text>`,'隊伍位置示意，圖中省略部分人數')}
        <figcaption>位置示意，省略部分人數；粉色是玟晴。</figcaption>
    </figure>`;
    if(p.kind==='cube')return html`<figure aria-label="小積木與正方體示意圖" className="my-4">${picture(html`
        ${block(35,70,'unit')}<text x="55" y="135" textAnchor="middle" fontSize="18">小積木</text>
        <path d="M110 95H165" stroke="#64748b" strokeWidth="3" /><path d="M155 87L165 95 155 103" fill="none" stroke="#64748b" strokeWidth="3" />
        <path d="M210 70L260 45 310 70 260 95Z" fill="#a5f3fc" stroke="#0e7490" strokeWidth="3" /><path d="M210 70L260 95V165L210 140Z" fill="#67e8f9" stroke="#0e7490" strokeWidth="3" /><path d="M260 95L310 70V140L260 165Z" fill="#22d3ee" stroke="#0e7490" strokeWidth="3" />
        <text x="260" y="205" textAnchor="middle" fontSize="18">長、寬、高格數相同</text>`,'用相同小積木堆成立方體，示意圖不代表格數')}
        <figcaption>大正方體示意，尚未標出分格數量。</figcaption>
    </figure>`;
    return null;
}
