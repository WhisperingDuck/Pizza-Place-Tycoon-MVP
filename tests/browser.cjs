const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.join(__dirname,'..'),out=path.join(root,'review-output');
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'pizza-place-tycoon.html'),'utf8');
const embeddedCopy=JSON.parse(source.match(/<script id="stand-copy" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const longMessage='The awning drips on the last paper plate. '.repeat(45)+'The last sentence is still here.';
const longSource=source.replace(/(<script id="stand-copy" type="application\/json">)([\s\S]*?)(<\/script>)/,(all,start,json,end)=>{
 const copy=JSON.parse(json);copy.events.find(event=>event.id==='rain_check').message=longMessage;
 return start+JSON.stringify(copy)+end;
});
const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(req.url.startsWith('/long-copy')?longSource:source)});
let base,checks=0;
async function tap(page,selector){const el=page.locator(selector);await el.focus();await el.press('Enter');}
async function layout(page,label){
 const result=await page.evaluate(()=>{
  const doc=document.documentElement,p=document.getElementById('primary').getBoundingClientRect();
  const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
  return {width:innerWidth,height:innerHeight,scrollWidth:doc.scrollWidth,scrollHeight:doc.scrollHeight,primary:{x:p.x,y:p.y,right:p.right,bottom:p.bottom},unique:ids.length===new Set(ids).size};
 });
 assert(result.scrollWidth<=result.width+1,label+' horizontal overflow '+JSON.stringify(result));
 assert(result.scrollHeight<=result.height+1,label+' vertical overflow '+JSON.stringify(result));
 assert(result.primary.bottom<=result.height+1&&result.primary.y>=0,label+' primary outside viewport');
 assert(result.unique,label+' duplicate IDs');checks++;
 console.log('LAYOUT '+label+' '+JSON.stringify(result));
}
async function capture(page,name){await page.screenshot({path:path.join(out,name+'.png')});}
async function prep(page,price=false,partial=false){
 await page.locator('#pflourBuy').focus();await page.keyboard.press('Space');await tap(page,'[data-action="dough"]');
 if(partial){await page.reload();assert.equal(await page.locator('#doughPct').textContent(),'20%');checks++;}
 for(let i=0;i<12&&!(await page.locator('#doughCount').textContent()).startsWith('1 ');i++)await tap(page,'[data-action="dough"]');
 await tap(page,'#psauceBuy');await tap(page,'#pcheeseBuy');
 for(let i=0;i<12&&!(await page.locator('#trayCount').textContent()).startsWith('8 ');i++)await tap(page,'[data-action="prepare"]');
 if(await page.locator('#buyMicrowave').isVisible())await tap(page,'#buyMicrowave');
 if(price)await tap(page,'#priceUp');
 assert.equal(await page.locator('#primary').isEnabled(),true);checks++;
}
async function closeDay(page){
 const visitors=Number(await page.locator('#forecastVisitors').textContent());
 const duration=await page.evaluate(n=>Math.max(Pizza.CONFIG.daySeconds,n*Pizza.CONFIG.service.customerSeconds),visitors);
 await tap(page,'#primary');await page.clock.runFor(Math.ceil(duration*1000)+1000);
 assert.equal(await page.locator('#report').isVisible(),true,'day settles after its checkpoint-defined duration');
}
async function tools(page,name){
 const selector='#tools [data-dialog="'+name+'"]';await tap(page,selector);
 assert(await page.locator('#sheet').evaluate(el=>el.open));
 for(let i=0;i<20;i++){await page.keyboard.press('Tab');assert(await page.locator('#sheet').evaluate(el=>el.contains(document.activeElement)));}
 await page.keyboard.press('Shift+Tab');assert(await page.locator('#sheet').evaluate(el=>el.contains(document.activeElement)));
 await page.keyboard.press('Escape');assert(await page.locator(selector).evaluate(el=>el===document.activeElement),name+' returns focus to its opener');checks++;
}
async function run(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/';
 for(const [engine,browserType] of Object.entries({chromium,webkit})){
 const browser=await browserType.launch();
 try{for(const [width,height] of [[1596,947],[1024,600],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.clock.install({time:new Date('2026-11-18T10:00:00Z')});
  await page.goto(base+'#mode=sample');
  await page.clock.pauseAt(new Date('2026-11-18T11:00:00Z'));
  const tag=engine+'-'+width;
  await layout(page,tag+' empty');await prep(page,true,true);await layout(page,tag+' prepared');
  await capture(page,tag+'-prep');
  for(const name of ['stock','equipment','stand','log'])await tools(page,name);
  await tap(page,'#primary');await page.clock.runFor(3000);await tap(page,'#primary');
  const before=await page.locator('#serviceFill').getAttribute('style');await page.clock.runFor(5000);
  assert.equal(await page.locator('#serviceFill').getAttribute('style'),before);
  await tools(page,'log');await page.clock.runFor(1000);assert.equal(await page.locator('#serviceFill').getAttribute('style'),before);
  await layout(page,tag+' service');await capture(page,tag+'-service');
  await page.reload();assert.equal(await page.locator('#prep').isVisible(),true);assert.equal(await page.locator('#trayCount').textContent(),'8 slices');
  await closeDay(page);assert.equal(await page.locator('#cash').textContent(),'$53.00');
  assert.equal(await page.locator('#rSales').textContent(),'$13.00');assert.equal(await page.locator('#rSpent').textContent(),'$24.00');
  await layout(page,tag+' receipt');await capture(page,tag+'-receipt');
  await tap(page,'#readNote');assert((await page.locator('#sheetBody').textContent()).includes('$53.00'));await page.keyboard.press('Escape');
  await page.reload();assert.equal(await page.locator('#cash').textContent(),'$53.00');await page.clock.runFor(5000);assert.equal(await page.locator('#cash').textContent(),'$53.00');
  await tap(page,'#primary');assert.equal(await page.locator('#day').textContent(),'Day 02');await layout(page,tag+' day2');
  await tap(page,'#restart');await page.keyboard.press('Escape');assert.equal(await page.locator('#day').textContent(),'Day 02');
  await tap(page,'#restart');await tap(page,'[data-confirm-reset]');assert.equal(await page.locator('#day').textContent(),'Day 01');assert.equal(await page.locator('#cash').textContent(),'$64.00');
  await tap(page,'#modeSwitch');await page.waitForURL(url=>!url.hash,{timeout:15000});await page.waitForFunction(()=>document.getElementById('edition').textContent.startsWith('Continuing'));
  await page.evaluate(()=>localStorage.setItem(Pizza.CONFIG.keys.run,JSON.stringify({version:2,restoreDay:false,state:Pizza.State.create(6)})));await page.reload();
  await prep(page,true);await closeDay(page);
  for(let day=2;day<=5;day++){
   await tap(page,'#primary');await tap(page,'[data-dialog="stand"]');
   for(const action of ['clean','train'])for(let i=0;i<12&&await page.locator('#sheet [data-action="'+action+'"]').isEnabled();i++)await tap(page,'#sheet [data-action="'+action+'"]');
   if(day===4){await tap(page,'#sheet [data-action="food"]');await page.clock.runFor(5500);assert.equal(await page.locator('#health').textContent(),'10/10');}
   await page.keyboard.press('Escape');await tap(page,'[data-dialog="stock"]');
   for(const id of ['napkins','paper_plates'])if(Number(await page.locator('#m'+id+'Count').textContent())<5)await tap(page,'#m'+id+'Buy');
   await page.keyboard.press('Escape');await prep(page);await layout(page,tag+' day'+day+' prep');await closeDay(page);
   const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(Pizza.CONFIG.keys.run)).state);
   assert.equal(saved.day,day);assert.equal(saved.history.length,day);assert.equal(saved.report.startCash+saved.report.incomeTotal-saved.report.expenseTotal,saved.cash);assert.equal(await page.evaluate(()=>Pizza.Save.valid(JSON.parse(localStorage.getItem(Pizza.CONFIG.keys.run)).state)),true);
   await layout(page,tag+' day'+day+' receipt');
  }
  const ending=await page.locator('#cash').textContent();await capture(page,tag+'-day5');
  await page.reload();assert.equal(await page.locator('#day').textContent(),'Day 05');assert.equal(await page.locator('#cash').textContent(),ending);
  await tap(page,'#modeSwitch');await page.waitForFunction(()=>document.getElementById('edition').textContent==='Repeatable sample day');assert.equal(await page.locator('#day').textContent(),'Day 01');
  await tap(page,'#modeSwitch');await page.waitForFunction(()=>document.getElementById('edition').textContent.startsWith('Continuing'));assert.equal(await page.locator('#day').textContent(),'Day 05');
  await tap(page,'#restart');await tap(page,'[data-confirm-reset]');assert.equal(await page.locator('#cash').textContent(),'$64.00');
  if(width===390){
   for(const event of ['none','rain_check']){
    await page.goto(base+'long-copy#mode=sample&event='+event);await page.reload();
    await tap(page,'#restart');await tap(page,'[data-confirm-reset]');await prep(page,true);await closeDay(page);
    await layout(page,tag+' event '+event);await tap(page,'#readNote');
    const note=await page.locator('#sheetBody').textContent();
    if(event==='none')assert(note.includes(embeddedCopy.receipt.quiet));
    else {
     assert(note.includes('The last sentence is still here.'));
     const scroll=await page.locator('#sheetBody').evaluate(el=>{el.scrollTop=el.scrollHeight;return {top:el.scrollTop,height:el.scrollHeight,visible:el.clientHeight}});
     assert(scroll.height>scroll.visible&&scroll.top>0,'long editable event can be scrolled');
     await capture(page,tag+'-long-event');
    }
    await page.locator('#closeSheet').press('Enter');assert(await page.locator('#readNote').evaluate(el=>el===document.activeElement));
   }
   console.log('PASS '+tag+' quiet closing and long editable rain event');checks++;
  }
  assert.deepEqual(errors,[]);console.log('PASS '+tag+' keyboard, Days 1–5, save/reload, separate sample and restart');checks++;
  await context.close();
 }}finally{await browser.close();}
 }
 // A real-time service checks that the controlled-clock tests have not hidden a timer problem.
 const browser=await chromium.launch();
 try{const page=await browser.newPage({viewport:{width:1024,height:600}}),requests=[];page.on('request',request=>{if(/^https?:/.test(request.url()))requests.push(request.url())});await page.goto('file://'+path.join(root,'pizza-place-tycoon.html')+'#mode=sample');await prep(page,true);await page.reload();assert.equal(await page.locator('#trayCount').textContent(),'8 slices');const start=Date.now();await page.locator('#primary').click();await page.locator('#report').waitFor({state:'visible',timeout:35000});const seconds=(Date.now()-start)/1000;assert(seconds>=19&&seconds<30);assert.equal(await page.locator('#cash').textContent(),'$53.00');assert.deepEqual(requests,[]);console.log('PASS local-file real-time sample '+seconds.toFixed(1)+'s, prepared save and zero external requests');checks++;}finally{await browser.close();}
 console.log(checks+' browser checks passed.');fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({passed:true,checks,browsers:['chromium','webkit'],sizes:[[1596,947],[1024,600],[390,844]]},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>server.close());
