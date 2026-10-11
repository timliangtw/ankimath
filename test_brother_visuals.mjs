import assert from 'node:assert/strict';
import pkg from '/Users/tim_liang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.js';

const base=process.env.BASE_URL||'https://timliangtw.github.io/ankimath/';
const cases=[[67,'prizes'],[71,'eggs'],[72,'egg-left'],[73,'egg-exact'],[76,'digit-sum'],[77,'formation'],[78,'share'],[79,'cube'],[80,'multiples']];
const browser=await pkg.chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
    const page=await browser.newPage({viewport:{width:768,height:1024},hasTouch:true});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('dialog',d=>d.accept('test'));
    await page.goto(`${base}?debug&bank=brother`);
    await page.waitForFunction(()=>window.ReactDOM&&window.htm);
    for(const [number,kind]of cases) {
        const answer=await page.evaluate(async({number,kind,base})=>{
            const module=await import(`${base}js/questions/brother/q${String(number).padStart(3,'0')}.js`);
            const {generateProblem}=await import(`${base}js/questions/brother/october-worksheets.js`);
            const container=document.createElement('main');document.body.replaceChildren(container);
            module.default.render(container,{original:true});
            return generateProblem(kind,true).answer;
        },{number,kind,base});
        await page.getByRole('img').first().waitFor();
        assert.equal(await page.getByRole('status').count(),0,'answer must remain hidden');
        for(const width of [390,768,1024]) {
            await page.setViewportSize({width,height:1024});
            assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`q${number}: overflow`);
            const box=await page.getByRole('img').first().boundingBox();
            assert.ok(box.width>100&&box.height>80,`q${number}: visual too small`);
        }
        if(await page.getByRole('spinbutton').count()) {
            await page.getByRole('spinbutton').fill(String(answer));
            await page.getByRole('button',{name:'送出'}).click();
        } else await page.getByRole('button',{name:String(answer),exact:true}).click();
        assert.ok((await page.getByRole('status').innerText()).includes('答對了'));
        await page.getByRole('button',{name:/再試一題/}).click();
        assert.equal(await page.getByRole('status').count(),0);
        assert.ok(await page.getByRole('img').count());
        console.log(`q${number}: question visual, responsive layout and explanation passed`);
    }
    assert.deepEqual(errors,[]);
} finally {await browser.close();}
