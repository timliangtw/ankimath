import assert from 'node:assert/strict';

globalThis.React={useState(){},useRef(){},createElement(){}};
globalThis.htm={bind:()=>()=>null};
const {generateProblem,worksheetKinds}=await import('./js/questions/brother/october-worksheets.js');
const {generateProblem:generateRoute}=await import('./js/questions/brother/q063.js');
const originals={cake:'弟弟 1/8，妹妹 1/8',perimeter:28,ant:45,digits:768,paper:'思均',expressions:2,prizes:800,'meal-time':'8 時 30 分',menu:610,discount:396,eggs:8,'egg-left':1,'egg-exact':'不能','mirror-time':'6 時 5 分',faces:'乙 × 2、丙 × 2、丁 × 2','digit-sum':3,formation:81,share:'1/5',cube:8,multiples:6,balance:'乙 和 丙'};
for(const [kind,answer]of Object.entries(originals))assert.equal(generateProblem(kind,true).answer,answer,kind);
for(const kind of worksheetKinds)for(let i=0;i<1000;i++) {
    const p=generateProblem(kind);
    if(typeof p.answer==='number')assert.ok(Number.isInteger(p.answer)&&p.answer>=0,kind);
    if(p.options) {
        const options=p.options.map(v=>typeof v==='object'?v.label:v);
        assert.equal(new Set(options).size,options.length,`${kind}: duplicate choices`);
        assert.ok(options.includes(p.answer),`${kind}: missing answer`);
    }
    if(kind==='digits') {
        const values=[];for(const a of p.digits)for(const b of p.digits)for(const c of p.digits)
            if(a&&new Set([a,b,c]).size===3)values.push(100*a+10*b+c);
        assert.equal(p.small,Math.min(...values.filter(v=>v%5===0)));
        assert.equal(p.large,Math.max(...values.filter(v=>v%5!==0)));
    }
    if(kind==='egg-left')assert.equal(p.answer,p.total-p.used);
    if(kind==='egg-exact') {
        // Every even total in this range is obtainable using packs of 6, 8 and 10.
        assert.equal(p.answer,p.used%2?'不能':'能');
        for(const [a,b,c]of p.combos)assert.equal(6*a+8*b+10*c,p.used);
    }
    if(kind==='cube')assert.equal(p.answer,p.side**3);
    if(kind==='ant')assert.equal(p.answer,(p.x+p.y+2*p.z)*p.edge);
}
for(let i=0;i<100;i++) {
    const p=generateRoute();let best=Infinity;
    const visit=(row,lane,total)=>{
        if(row===10){best=Math.min(best,total);return;}
        for(let next=0;next<3;next++)if(row===0||Math.abs(next-lane)<=1)visit(row+1,next,total+p.costs[row][next]);
    };
    visit(0,0,0);assert.equal(p.answer,best);
    assert.equal(p.path.length,10);
    assert.equal(p.path.reduce((sum,lane,row)=>sum+p.costs[row][lane],0),best);
    assert.ok(p.answer<=70);
}
console.log('Original answers, 22,000 generated problems, and 100 exhaustive route checks passed.');
