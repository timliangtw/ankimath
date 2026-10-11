const { useState } = React;
const html = htm.bind(React.createElement);
const integer=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
const choose=items=>items[integer(0,items.length-1)];
const shuffle=items=>items.map(value=>({value,order:Math.random()})).sort((a,b)=>a.order-b.order).map(item=>item.value);
const time=minutes=>`${Math.floor(minutes/60)%12||12} 時 ${minutes%60} 分`;
const gcd=(a,b)=>b?gcd(b,a%b):a;
const fraction=(a,b)=>{const g=gcd(a,b);return `${a/g}/${b/g}`;};

export const worksheetKinds=['cake','perimeter','ant','digits','mirror-invalid','paper','expressions','prizes','meal-time','menu','discount','eggs','egg-left','egg-exact','mirror-time','faces','digit-sum','formation','share','cube','multiples','balance'];

export function generateProblem(kind,original=false) {
    const n=(a,b,fixed)=>original?fixed:integer(a,b);
    if(kind==='cake') {
        const parts=original?4:choose([2,4,6]);
        return {kind,parts,question:`蛋糕先平均切成兩半。上半部平均分成 ${parts} 份，弟弟拿其中一份；下半部先平分，再把左邊從對角切開，妹妹拿一個三角形。兩人各拿了整個蛋糕的幾分之幾？`,
            answer:`弟弟 ${fraction(1,2*parts)}，妹妹 1/8`,options:shuffle([`弟弟 ${fraction(1,2*parts)}，妹妹 1/8`,'兩人都是 1/7',`弟弟 1/${parts}，妹妹 1/4`,'兩人都是 1/4']),
            explanation:[`弟弟：整個蛋糕的 1/2 再分成 ${parts} 份，是 1/${2*parts}。`,'妹妹：1/2 再分成 2 份，再對角平分，是 1/8。','形狀不同不能直接用塊數當分母；必須比較面積。']};
    }
    if(kind==='perimeter') {
        const short=n(1,5,2),long=short*3;
        return {kind,short,long,answer:14*short,question:`4 個一樣的小長方形，左邊橫放 3 個，右邊直放 1 個，拼成大長方形。小長方形的長邊是 ${long} 公分，大長方形周長是多少公分？`,
            explanation:[`3 條短邊等於 1 條長邊：${long} ÷ 3 = ${short} 公分。`,`大長方形長 ${long+short} 公分，寬 ${long} 公分。`,`周長 = (${long+short} + ${long}) × 2 = ${14*short} 公分。`]};
    }
    if(kind==='ant') {
        const x=n(1,3,2),y=n(1,2,1),z=n(2,4,3),edge=n(2,8,5);
        return {kind,x,y,z,edge,answer:(x+y+2*z)*edge,question:`螞蟻從 A 點出發，沿正方體骨架爬到對角上方的糖果，再把糖果搬到地面（不必回到 A 點）。每個小正方體邊長 ${edge} 公分，整段至少走幾公分？`,
            explanation:[`去程必須橫走 ${x} 格、往深處走 ${y} 格、向上走 ${z} 格。`,`到糖果 = (${x} + ${y} + ${z}) × ${edge} = ${(x+y+z)*edge} 公分。`,`拿到糖果後，只需向下走 ${z} 格到地面：${z} × ${edge} = ${z*edge} 公分。`,`合計：${(x+y+z)*edge} + ${z*edge} = ${(x+y+2*z)*edge} 公分。不必走回 A 點。`]};
    }
    if(kind==='digits') {
        const digits=original?[0,1,3,5,7,8]:[0,...shuffle([1,2,3,4,5,6,7,8,9]).slice(0,4),5].filter((v,i,a)=>a.indexOf(v)===i);
        if(digits.length<6)digits.push(choose([1,2,3,4,6,7,8,9].filter(v=>!digits.includes(v))));
        const numbers=[];for(const a of digits)for(const b of digits)for(const c of digits)if(a&&a!==b&&a!==c&&b!==c)numbers.push(100*a+10*b+c);
        const small=Math.min(...numbers.filter(v=>v%5===0)),large=Math.max(...numbers.filter(v=>v%5!==0));
        return {kind,digits,small,large,answer:large-small,question:`數字卡 ${digits.join('、')}，每張最多用一次。小萍排出可以五個一數數到的最小三位數，小慧排出不能五個一數數到的最大三位數。兩數相差多少？`,explanation:[`能五個一數到的數，個位必須是 0 或 5；最小三位數是 ${small}。`,`不能五個一數到的數，個位不能是 0 或 5；最大是 ${large}。`,`${large} − ${small} = ${large-small}。`]};
    }
    if(kind==='mirror-invalid') {
        const hour=n(2,10,6),minute=choose(original?[30]:[15,30,45]);
        const clocks=[{h:3,m:30},{h:9,m:15},{h:hour,m:minute,invalid:true},{h:6,m:15}];
        const options=shuffle(clocks.map((clock,i)=>({...clock,label:`時鐘 ${i+1}`})));
        return {kind,options,answer:options.find(c=>c.invalid).label,question:'這些都是鏡子中的時鐘。哪一個不可能是真正時鐘的鏡像？',explanation:[`分針走到 ${minute} 分時，時針也要從整點向下一個數字移動。`,'錯誤的鐘面時針仍停在整點位置；鏡像不會改變兩根指針應有的相對位置。']};
    }
    if(kind==='paper') {
        const labels=original?['小毅','思均','語庭','光正']:shuffle(['小毅','思均','語庭','光正']);
        return {kind,labels,answer:labels[1],options:shuffle(labels),question:'四張一樣大的色紙，圓的大小相同。各人照圖剪洞，哪個人剩下的色紙面積最大？',explanation:['對摺後，剪洞會同時剪到兩層。半圓面積是圓的一半。',`${labels[0]}：4 個半圓 × 2 層 = 4 個圓的面積。`,`${labels[1]}：1 個圓和 1 個半圓 × 2 層 = 3 個圓的面積。`,`${labels[2]}：2 個圓 × 2 層 = 4 個圓；${labels[3]}：直接剪 4 個圓。`,`${labels[1]}剪掉最少，所以剩下最多。`]};
    }
    if(kind==='expressions') {
        const a=n(3,9,7),b=n(2,8,5),sum=a+b,product=a*b;
        const expressions=[{label:`${b} × ${a}`,value:product},{label:`${a} 有 ${sum} 個`,value:a*sum},{label:`${sum} × ${b}`,value:sum*b},{label:`${a} 的 ${b} 倍`,value:product},{label:`${b} 的 ${a} 倍`,value:product},{label:Array(b).fill(a).join(' + '),value:product},{label:Array(a).fill(b).join(' + '),value:product}];
        const answer=expressions.filter(e=>e.value!==product).length;
        return {kind,a,b,sum,expressions,answer,question:`計算「${a} 乘以一個數」時，誤把 × 寫成 +，得到 ${sum}。正確乘積和下列算式的答案不同的有幾個？`,explanation:[`未知的數 = ${sum} − ${a} = ${b}；正確乘積 = ${a} × ${b} = ${product}。`,...expressions.map(e=>`${e.label} = ${e.value}${e.value===product?'（相同）':'（不同）'}`),`共有 ${answer} 個不同。`]};
    }
    if(kind==='prizes') {
        const third=n(2,6,4)*50,less=n(1,3,1)*50,more=n(1,4,2)*50,second=third+less,first=second+more;
        return {kind,third,second,first,answer:third+second+first,question:`第三名獎金 ${third} 元，比第二名少 ${less} 元；第一名比第二名多 ${more} 元。前三名獎金合計多少元？`,explanation:[`第二名：${third} + ${less} = ${second} 元。`,`第一名：${second} + ${more} = ${first} 元。`,`合計：${first} + ${second} + ${third} = ${first+second+third} 元。`]};
    }
    if(kind==='meal-time') {
        const start=original?390:integer(5,8)*60+choose([0,15,30,45]),hours=n(1,3,2),answer=time(start+hours*60);
        return {kind,start,hours,answer,options:shuffle([answer,time(start+(hours+1)*60),time(start+hours*60+30),time(start+hours*60-30)]),question:`下午從圖中的時間開始用餐，最多可用餐 ${hours} 小時。最晚可以吃到下午幾時幾分？`,explanation:[`開始時間：下午 ${time(start)}。`,`加上 ${hours} 小時，分鐘不變：下午 ${answer}。`]};
    }
    if(kind==='menu'||kind==='discount') {
        const fish=n(23,29,26)*10+8,beef=n(25,31,27)*10+8,soup=n(3,6,4)*10+9,rice=n(1,3,3)*5,sale=n(17,22,19)*10+8;
        const answer=kind==='menu'?fish+rice+beef+soup:2*sale;
        return {kind,fish,beef,soup,rice,sale,answer,question:kind==='menu'?'兩人分別點「石頭鍋＋鮮嫩鯛魚＋滷肉飯」和「泡菜鍋＋嫩肩牛肉＋冬粉」。一共多少元？':`兩人都點套餐。現在所有主餐一律 ${sale} 元，湯底與副餐免加價。這一餐需付多少元？`,explanation:kind==='menu'?[`第一人：${fish} + ${rice} = ${fish+rice} 元。`,`第二人：${beef} + ${soup} = ${beef+soup} 元。`,`總共：${fish+rice} + ${beef+soup} = ${answer} 元。`]:[`優惠時湯底、副餐都不用另外加錢。`,`${sale} × 2 = ${answer} 元。`]};
    }
    if(['eggs','egg-left','egg-exact'].includes(kind)) {
        const boxes=n(4,9,6),total=boxes*10,small=8,buy=Math.ceil(total/small),left=original?5:integer(buy*small-total+1,7),used=buy*small-left;
        if(kind==='eggs')return {kind,total,small,buy,answer:buy,question:`料理課原本要買 10 顆裝雞蛋 ${boxes} 盒。現在只有 8 顆裝，至少要買幾盒才夠？`,explanation:[`需要 ${10} × ${boxes} = ${total} 顆。`,`${buy-1} 盒只有 ${(buy-1)*small} 顆，不夠；${buy} 盒有 ${buy*small} 顆，才夠。`]};
        if(kind==='egg-left')return {kind,total,small,buy,left,used,answer:total-used,question:`原本預計買 10 顆裝 ${boxes} 盒，後來改買 ${buy} 盒 8 顆裝。課後剩下 ${left} 顆。若照原本買法，課後剩幾顆？`,explanation:[`實際買了 ${buy} × 8 = ${buy*8} 顆。`,`用了 ${buy*8} − ${left} = ${used} 顆。`,`原本買法剩下 ${total} − ${used} = ${total-used} 顆。`]};
        const combos=[];for(let a=0;a<=used/6;a++)for(let b=0;b<=used/8;b++)for(let c=0;c<=used/10;c++)if(6*a+8*b+10*c===used)combos.push([a,b,c]);
        return {kind,used,combos,answer:combos.length?'能':'不能',options:['能','不能'],question:`料理課剛好需要 ${used} 顆雞蛋。超市有 6 顆、8 顆、10 顆裝，可以買整盒（可重複選同一包裝，不必三種都買），剛好湊足嗎？`,explanation:combos.length?[`例如買 6 顆裝 ${combos[0][0]} 盒、8 顆裝 ${combos[0][1]} 盒、10 顆裝 ${combos[0][2]} 盒。`,`6 × ${combos[0][0]} + 8 × ${combos[0][1]} + 10 × ${combos[0][2]} = ${used}。`]:['每種包裝都是偶數顆，買整盒的總數一定是偶數。',`${used} 是奇數，所以不能剛好湊足。`]};
    }
    if(kind==='mirror-time') {
        const actual=original?365:integer(1,11)*60+choose([5,10,15,25,35,45,55]),reflected=(720-actual)%720;
        const answer=time(actual);
        return {kind,actual,reflected,answer,options:shuffle([answer,time((actual+60)%720),time(reflected),time((actual+10)%720)]).filter((v,i,a)=>a.indexOf(v)===i),question:'圖中是鏡子裡的時鐘。真正的時間是幾時幾分？',explanation:[`左右翻轉後，鏡中的 ${time(reflected)} 會還原成 ${answer}。`,'鏡中指向左邊的刻度，還原後會指向右邊；時針也要一起翻轉。']};
    }
    if(kind==='faces') {
        const labels=original?['甲','乙','丙','丁','戊']:shuffle(['甲','乙','丙','丁','戊']);
        const [a,b,c,d,e]=labels,options=shuffle([`${a} × 4、${e} × 2`,`${b} × 2、${c} × 2、${d} × 2`,`${b} × 2、${c} × 2、${e} × 2`,`${a} × 2、${b} × 4`]);
        return {kind,labels,answer:`${b} × 2、${c} × 2、${d} × 2`,options,question:'圖卡每格大小相同。哪組六張圖卡可以組成一個長方體？',explanation:[`長方體的相對面大小一樣，所以要有 3 對相同的面。`,`${b} 是 2 × 3，${c} 是 3 × 4，${d} 是 2 × 4。`,'三種面能對應長、寬、高 2、3、4；每種各兩張，剛好六面。']};
    }
    if(kind==='digit-sum') {
        const limit=n(2,5,3)*100,sum=n(2,7,2),numbers=[];for(let i=100;i<limit;i++)if(String(i).split('').reduce((s,d)=>s+Number(d),0)===sum)numbers.push(i);
        return {kind,limit,sum,numbers,answer:numbers.length,question:`小於 ${limit} 的三位數，三個數字相加等於 ${sum}，共有幾個？`,explanation:[`三位數的百位不能是 0，而且必須小於 ${limit}。`,`符合的是：${numbers.join('、')}。`,`共有 ${numbers.length} 個。`]};
    }
    if(kind==='formation') {
        const left=n(2,5,3),right=n(3,7,7),front=n(4,9,8),columns=left+right-1,rows=front+1;
        return {kind,left,right,front,columns,rows,answer:columns*rows,question:`長方形隊伍每行人數相同。玟晴從左數第 ${left} 行、從右數第 ${right} 行，站在這一行最後面，前面有 ${front} 人。全部有幾人？`,explanation:[`橫向行數：${left} + ${right} − 1 = ${columns}，玟晴那一行不能重複算。`,`每行：前面 ${front} 人加上自己，共 ${rows} 人。`,`${columns} × ${rows} = ${columns*rows} 人。`]};
    }
    if(kind==='share') {
        const cakes=n(1,3,2),denom=choose(original?[5]:[3,4,5,6]),people=cakes*denom,boys=n(1,people-1,4),girls=people-boys;
        return {kind,cakes,people,boys,girls,answer:`1/${denom}`,question:`書法班有 ${boys} 個男生、${girls} 個女生，將 ${cakes} 個一樣大的蛋糕平均分給所有人。每人分到幾個蛋糕？`,options:shuffle([`1/${denom}`,`1/${denom+1}`,`1/${denom+2}`,`1/${denom+3}`]),explanation:[`共有 ${boys} + ${girls} = ${people} 人。`,`${cakes} 個蛋糕平均分成 ${people} 份：${cakes}/${people} = 1/${denom} 個。`]};
    }
    if(kind==='cube') {
        const side=n(2,4,2),answer=side**3;
        return {kind,side,answer,options:shuffle([answer,side**2,answer+1,side*(side+1)]),question:'哪個數量的小正方體，能剛好堆成每邊至少 2 格的大正方體？',explanation:[`每排 ${side} 個，每層 ${side} 排：${side} × ${side} = ${side**2} 個。`,`共 ${side} 層：${side**2} × ${side} = ${answer} 個。`,'正方體的長、寬、高格數必須相同。']};
    }
    if(kind==='multiples') {
        const base=n(2,6,3),a=n(2,4,2),b=n(2,4,3),second=base*a,third=second*b;
        return {kind,base,a,b,second,third,answer:third/base,question:`欣宜用 ${base} 張正方形圖卡；至奇用的張數是欣宜的 ${a} 倍；品嫻用的張數是至奇的 ${b} 倍。品嫻是欣宜的幾倍？`,explanation:[`至奇：${base} × ${a} = ${second} 張。`,`品嫻：${second} × ${b} = ${third} 張。`,`${third} ÷ ${base} = ${a*b} 倍，也就是 ${a} × ${b}。`]};
    }
    const labels=original?['甲','乙','丙','丁','戊']:shuffle(['甲','乙','丙','丁','戊']);
    const [a,b,c,d,e]=labels;
    return {kind:'balance',labels,pairs:[[a,b],[a,c],[d,a],[e,d]],answer:`${b} 和 ${c}`,options:shuffle([`${d} 和 ${b}`,`${d} 和 ${c}`,`${b} 和 ${c}`,`${e} 和 ${a}`]),question:'天平低的一側比較重。根據四次測量，最後應比較哪兩個，才能排出全部五個由重到輕的順序？',explanation:[`已知 ${e} > ${d} > ${a}，而 ${a} > ${b}、${a} > ${c}。`,`${b}、${c} 都比 ${a} 輕，但還不知道誰比較重。`,`最後只需比較 ${b} 和 ${c}。`]};
}

function clock(minutes,mirror=false,invalid=false) {
    const hour=minutes/60%12,minute=minutes%60;
    const hand=(angle,length,color,width)=>html`<line x1="100" y1="100" x2=${100+length*Math.sin(angle)} y2=${100-length*Math.cos(angle)} stroke=${color} strokeWidth=${width} strokeLinecap="round" />`;
    return html`<svg viewBox="0 0 200 200" className="w-full" style=${{maxHeight:'280px'}} aria-label=${mirror?'鏡中鐘面':'鐘面'}>
        <circle cx="100" cy="100" r="91" fill="white" stroke="#475569" strokeWidth="3" />
        <g transform=${mirror?'translate(200 0) scale(-1 1)':undefined}>
            ${Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/6;return html`<text key=${i} x=${100+74*Math.sin(a)} y=${106-74*Math.cos(a)} textAnchor="middle" fontSize="17">${i+1}</text>`;})}
            ${hand((invalid?Math.floor(hour):hour)*Math.PI/6,48,'#db2777',7)}
            ${hand(minute*Math.PI/30,67,'#2563eb',4)}
        </g><circle cx="100" cy="100" r="5" fill="#334155" />
    </svg>`;
}

function frame(children,viewBox='0 0 360 260') {
    return html`<svg viewBox=${viewBox} className="w-full my-4" style=${{maxHeight:'420px'}}>${React.Children.toArray(children)}</svg>`;
}

function diagram(p,correct) {
    if(p.kind==='cake')return frame(html`
        <rect x="40" y="25" width="280" height="200" fill="#fff7ed" stroke="#334155" strokeWidth="3" />
        <rect x=${40+280/p.parts} y="25" width=${280/p.parts} height="100" fill="#38bdf8" />
        <path d="M40 225H180V125Z" fill="#fb7185" />
        <path d="M40 125H320 M180 125V225 M40 225L180 125" stroke="#334155" strokeWidth="2" fill="none" />
        ${Array.from({length:p.parts-1},(_,i)=>html`<path key=${i} d=${`M${40+(i+1)*280/p.parts} 25V125`} stroke="#334155" strokeWidth="2" />`)}
        <text x=${40+420/p.parts} y="80" textAnchor="middle" fontSize="18">弟弟</text><text x="135" y="208" textAnchor="middle" fontSize="18">妹妹</text>
        ${correct&&html`<g fill="#047857" fontSize="18"><text x="180" y="250" textAnchor="middle">藍色 1/${2*p.parts}；粉色 1/8</text></g>`}`);
    if(p.kind==='perimeter')return frame(html`<rect x="70" y="35" width="240" height="180" fill="#f0fdf4" stroke="#334155" strokeWidth="3" /><path d="M250 35V215 M70 95H250 M70 155H250" fill="none" stroke="#334155" strokeWidth="2" /><text x="160" y="25" textAnchor="middle" fontSize="18">${p.long} 公分</text>${correct&&html`<g fill="#047857" fontSize="18"><text x="280" y="25" textAnchor="middle">${p.short}</text><text x="190" y="245" textAnchor="middle">${p.long+p.short} 公分</text><text x="30" y="130" textAnchor="middle">${p.long}</text></g>`}`);
    if(p.kind==='ant') {
        const point=(x,y,z)=>[60+x*65+y*30,220-y*25-z*45],lines=[];
        for(let x=0;x<=p.x;x++)for(let y=0;y<=p.y;y++)for(let z=0;z<=p.z;z++)for(const [dx,dy,dz]of [[1,0,0],[0,1,0],[0,0,1]])if(x+dx<=p.x&&y+dy<=p.y&&z+dz<=p.z){const a=point(x,y,z),b=point(x+dx,y+dy,z+dz);lines.push(html`<line key=${`${x}-${y}-${z}-${dx}-${dy}`} x1=${a[0]} y1=${a[1]} x2=${b[0]} y2=${b[1]} stroke="#94a3b8" strokeWidth="2" />`);}
        const a=point(0,0,0),end=point(p.x,p.y,p.z),b=point(p.x,0,0),c=point(p.x,p.y,0);
        return frame(html`${lines}<circle cx=${a[0]} cy=${a[1]} r="6" fill="#2563eb" /><text x=${a[0]-15} y=${a[1]+22} fontSize="18">A</text><text x=${end[0]} y=${end[1]-10} fontSize="18">糖果</text>${correct&&html`<polyline points=${[a,b,c,end].map(v=>v.join(',')).join(' ')} fill="none" stroke="#db2777" strokeWidth="6" /><line x1=${end[0]} y1=${end[1]} x2=${c[0]} y2=${c[1]} stroke="#16a34a" strokeWidth="4" strokeDasharray="8 5" /><text x=${c[0]} y=${c[1]+24} fontSize="16" fill="#047857">放到地面</text>`}`,'0 0 360 300');
    }
    if(p.kind==='meal-time')return clock(p.start);
    if(p.kind==='mirror-time')return html`<div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div>${clock(p.actual,true)}<p>鏡中</p></div>${correct&&html`<div>${clock(p.actual)}<p>真正鐘面</p></div>`}</div>`;
    if(p.kind==='mirror-invalid')return html`<div className="grid grid-cols-2 gap-3">${p.options.map(c=>html`<div key=${c.label}>${clock(c.h*60+c.m,true,c.invalid)}<p className=${correct&&c.invalid?'text-red-600 font-bold':''}>${c.label}${correct&&c.invalid?'：時針位置不正確':''}</p></div>`)}</div>`;
    if(p.kind==='paper')return html`<div className="grid grid-cols-2 gap-3">${p.labels.map((label,i)=>html`<div key=${label}>${frame(html`<defs><clipPath id=${`paper-${i}`}><rect x="50" y="20" width="260" height="200" /></clipPath></defs><rect x="50" y="20" width="260" height="200" fill="#e0f2fe" stroke="#334155" strokeWidth="3" />
        <g clipPath=${`url(#paper-${i})`}>
        ${i===0?[[180,20],[180,220],[50,120],[310,120]].map(([x,y],j)=>html`<circle key=${j} cx=${x} cy=${y} r="25" fill="white" stroke="#db2777" strokeWidth="2" />`):
        (i===1?[[150,90],[310,150]]:i===2?[[120,85],[235,160]]:[[105,75],[175,145],[235,75],[280,175]]).map(([x,y],j)=>html`<circle key=${j} cx=${x} cy=${y} r="25" fill="white" stroke="#db2777" strokeWidth="2" />`)}
        </g>${i<3&&html`<path d="M310 20V220" stroke="#2563eb" strokeWidth="5" strokeDasharray="8 5" />`}`)}<p>${label}（${i<3?'對摺兩層':'未對摺'}）</p>${correct&&html`<strong className="text-green-700">剪掉 ${i===1?3:4} 個圓的面積</strong>`}</div>`)}</div>`;
    if(p.kind==='menu'||p.kind==='discount')return html`<table className="w-full my-4 text-left border-collapse"><thead><tr><th className="p-2 border-b">項目</th><th className="p-2 border-b">價錢／加價</th></tr></thead><tbody>${[['石頭鍋',0],['泡菜鍋',p.soup],['鮮嫩鯛魚',p.fish],['嫩肩牛肉',p.beef],['冬粉',0],['滷肉飯',p.rice]].map(([name,price])=>html`<tr key=${name}><td className="p-2 border-b">${name}</td><td className="p-2 border-b">${price} 元</td></tr>`)}</tbody></table>`;
    if(p.kind==='expressions')return html`<ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">${p.expressions.map((e,i)=>html`<li key=${i} className="border rounded-lg p-3" style=${{background:correct&&e.value!==p.a*p.b?'#fce7f3':'white'}}>${e.label}${correct?` = ${e.value}`:''}</li>`)}</ul>`;
    if(p.kind==='faces')return html`<div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">${[[3,3],[2,3],[3,4],[2,4],[2,2]].map(([w,h],i)=>html`<div key=${i}>${frame(html`<rect x="20" y="20" width=${w*50} height=${h*50} fill=${correct&&[1,2,3].includes(i)?'#a7f3d0':'#e0f2fe'} stroke="#475569" strokeWidth="3" />${Array.from({length:w-1},(_,j)=>html`<path key=${`v${j}`} d=${`M${70+j*50} 20v${h*50}`} stroke="#94a3b8" />`)}${Array.from({length:h-1},(_,j)=>html`<path key=${`h${j}`} d=${`M20 ${70+j*50}h${w*50}`} stroke="#94a3b8" />`)}`,'0 0 200 240')}<p>${p.labels[i]}：${w} × ${h}</p></div>`)}</div>`;
    if(p.kind==='formation'&&correct)return frame(html`${Array.from({length:p.rows},(_,r)=>Array.from({length:p.columns},(_,c)=>html`<circle key=${`${r}-${c}`} cx=${25+c*28} cy=${25+r*28} r="9" fill=${r===p.rows-1&&c===p.left-1?'#db2777':'#38bdf8'} />`))}<text x="15" y=${p.rows*28+20} fontSize="16">粉色是玟晴；包含她自己</text>`,`0 0 ${Math.max(360,p.columns*28+30)} ${p.rows*28+55}`);
    if(p.kind==='cube'&&correct)return html`<div className="my-4">${Array.from({length:p.side},(_,layer)=>html`<div key=${layer} className="my-3"><p>第 ${layer+1} 層：${p.side**2} 個</p><div className="grid gap-1 mx-auto" style=${{gridTemplateColumns:`repeat(${p.side}, 32px)`,width:`${p.side*36}px`}}>${Array.from({length:p.side**2},(_,i)=>html`<span key=${i} className="border border-green-700 bg-green-200" style=${{width:'32px',height:'32px'}} />`)}</div></div>`)}</div>`;
    if(p.kind==='balance')return html`<div className="grid grid-cols-2 gap-3 my-4">${p.pairs.map(([heavy,light],i)=>html`<div key=${i}>${frame(html`<path d="M60 175L300 85" stroke="#475569" strokeWidth="9" /><path d="M180 165L155 210H205Z" fill="#475569" /><circle cx="65" cy="130" r="35" fill="#fbcfe8" stroke="#be185d" /><circle cx="295" cy="40" r="35" fill="#bae6fd" stroke="#0284c7" /><text x="65" y="138" textAnchor="middle" fontSize="26">${heavy}</text><text x="295" y="48" textAnchor="middle" fontSize="26">${light}</text>`)}${correct&&html`<strong>${heavy} 比 ${light} 重</strong>`}</div>`)}</div>`;
    if(p.kind==='digits')return html`<div className="flex flex-wrap justify-center gap-3 my-4">${p.digits.map(d=>html`<span key=${d} className="border-2 rounded-lg p-3 text-2xl bg-white">${d}</span>`)}</div>`;
    return null;
}

export function worksheetQuestion(id,kind,title) {
    const Game=({original=false})=>{
        const [problem,setProblem]=useState(()=>generateProblem(kind,original));
        const [value,setValue]=useState('');
        const [state,setState]=useState('playing');
        const submit=answer=>{if(state==='correct')return;if(answer===problem.answer)setState('correct');else{setState('wrong');if(window.onIncorrectAnswer)window.onIncorrectAnswer();}};
        const next=()=>{setProblem(generateProblem(kind));setValue('');setState('playing');};
        return html`<div className="w-full mx-auto text-center p-2" style=${{maxWidth:'800px'}}>
            <h2 className="text-xl font-bold mb-3">${title}</h2><p className="text-lg leading-relaxed mb-4">${problem.question}</p>
            ${diagram(problem,state==='correct')}
            ${problem.options?html`<div className="grid grid-cols-2 gap-3 my-4">${problem.options.map((option,i)=>{const answer=typeof option==='object'?option.label:option;return html`<button key=${i} onClick=${()=>submit(answer)} disabled=${state==='correct'} className="border-2 rounded-lg p-3 text-lg font-bold" style=${{minHeight:'56px',background:state==='correct'&&answer===problem.answer?'#dcfce7':'white',borderColor:state==='correct'&&answer===problem.answer?'#16a34a':'#bfdbfe'}}>${answer}</button>`;})}</div>`:
                html`<form className="flex justify-center gap-3 my-4" onSubmit=${e=>{e.preventDefault();submit(value.trim()===''?null:Number(value));}}><input aria-label="答案" type="number" min="0" inputMode="numeric" value=${value} onChange=${e=>setValue(e.target.value)} disabled=${state==='correct'} className="border-2 rounded-lg p-2 w-28 text-xl text-center" /><button disabled=${state==='correct'} className="bg-blue-500 text-white rounded-lg px-5" style=${{minHeight:'48px'}}>送出</button></form>`}
            ${state==='wrong'&&html`<p role="status" className="text-red-600 my-4">再想想看，還可以繼續作答。</p>`}
            ${state==='correct'&&html`<section role="status" className="text-green-700 my-4"><h3 className="font-bold text-xl">答對了！</h3><ol className="text-left space-y-2 my-3">${problem.explanation.map((line,i)=>html`<li key=${i}>${line}</li>`)}</ol><strong className="text-2xl">答案：${problem.answer}</strong></section>`}
            <button onClick=${next} className="border border-blue-300 text-blue-700 rounded-lg px-5 py-3 my-4">再試一題（換題目）</button>
        </div>`;
    };
    return {id,type:'custom',title,q:title,render:(container,{original=false}={})=>ReactDOM.createRoot(container).render(html`<${Game} original=${original} />`)};
}
