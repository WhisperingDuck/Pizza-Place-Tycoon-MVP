const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const modules=['config','data','state','events','customers','logic','save'];
const files=Object.fromEntries(['source/content.json','source/recipe-book.json','source/adapter.js',...modules.map(n=>'checkpoint/js/'+n+'.js'),...[...modules,'recipes'].map(n=>'engine/js/'+n+'.js')].map(p=>[p,fs.readFileSync(path.join(root,p),'utf8')]));
function boot(storage = {}, hash = '') {
 const window = { location: {hash,reload(){}}, addEventListener(){}, setInterval(fn){this.timer=fn}, StandView:{render(vm){window.vm=JSON.parse(JSON.stringify(vm))}} };
 const localStorage = { getItem:key=>storage[key]??null, setItem:(key,value)=>{storage[key]=value}, removeItem:key=>delete storage[key] };
 const performance = {time:0,now(){return this.time;}};
 const document = {hidden:false,getElementById(){return {textContent:files['source/content.json']}},addEventListener(){}};
 const params=new URLSearchParams(hash.slice(1));window.PizzaMode={sample:params.get('mode')==='sample'||(params.has('event')&&!params.has('mode'))};
 const directory=window.PizzaMode.sample?'checkpoint':'engine';
 const order=window.PizzaMode.sample?modules:['config','data','state','events','customers','recipes','logic','save'];
 const source=order.map(name=>files[directory+'/js/'+name+'.js']).join('\n');
 const P = new Function('window','localStorage','book','const Pizza=window.Pizza={RECIPE_BOOK:book};'+source+';return Pizza;')(window,localStorage,JSON.parse(files['source/recipe-book.json']));
 const Query = typeof URLSearchParams === 'function' ? URLSearchParams : class {constructor(q){this.map=Object.fromEntries(q.split('&').filter(Boolean).map(p=>p.split('=')))}get(k){return this.map[k]??null}has(k){return Object.hasOwn(this.map,k)}};
 new Function('window','document','performance','URLSearchParams',files['source/adapter.js'])(window,document,performance,Query);
 return {window,P,storage,act:(...args)=>window.Stand.action(...args),get vm(){return window.vm},tick(n=1){for(let i=0;i<n;i++){performance.time+=120;window.timer();}}};
}
function prepared(b, price = true) {
 ['flour','sauce','cheese'].forEach(id=>b.act('buy',id));
 for(let i=0;i<5;i++)b.act('dough');
 for(let i=0;i<4;i++)b.act('prepare');
 if(!b.vm.microwave)b.act('microwave');
 if(price)b.act('price','1');
}
function service(b){b.act('open');let n=0;while(b.vm.phase==='service'&&n++<10000)b.tick();if(n>=10000)throw Error('Service did not finish');}
function check(condition,message){if(!condition)throw Error(message);}
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
test("$3.25 sample closes with $53",()=>{const b=boot({},'#mode=sample');prepared(b);service(b);check(b.vm.cash===5300,'Cash');check(b.vm.receipt.sales===1300&&b.vm.receipt.spending===2400&&b.vm.receipt.sold===4&&b.vm.receipt.leftovers===4,'Ledger');});
test("partial prep restores without a second ingredient charge",()=>{const b=boot({},'#mode=sample');b.act('buy','flour');b.act('dough');const r=boot(b.storage,'#mode=sample');check(r.vm.work.progress===20&&r.vm.stock.flour===0&&r.vm.cash===6300,'Partial job');for(let i=0;i<4;i++)r.act('dough');check(r.vm.stock.dough===1&&r.vm.cash===6300,'Completed job');});
test("service reload restores prepared stock and identical luck",()=>{const b=boot({},'#mode=sample');prepared(b);b.act('open');b.tick(50);const r=boot(b.storage,'#mode=sample');check(r.vm.phase==='prep'&&r.vm.stock.slices===8&&r.vm.cash===4000,'Checkpoint');service(r);check(r.vm.cash===5300,'Same result');});
test("receipt reload and idle ticks never settle twice",()=>{const b=boot({},'#mode=sample');prepared(b);service(b);const r=boot(b.storage,'#mode=sample');r.tick(500);check(r.vm.cash===5300&&r.vm.history.length===1&&r.vm.health===9,'Exactly once');r.act('next');check(r.vm.day===2&&r.vm.cash===5300&&r.vm.microwave&&r.vm.stock.slices===0,'Carry');});
test("run and sample restart stay isolated",()=>{const run=boot();run.act('buy','cheese');const key=run.P.CONFIG.keys.run,before=run.storage[key];const sample=boot(run.storage,'#mode=sample');prepared(sample);service(sample);sample.act('reset');check(run.storage[key]===before,'Run preserved');const restored=boot(run.storage);check(restored.vm.cash===6200&&restored.vm.stock.cheese===1,'Run restored');const sampleSave=run.storage[sample.P.CONFIG.keys.run];restored.act('reset');check(run.storage[sample.P.CONFIG.keys.run]===sampleSave&&restored.vm.day===1&&restored.vm.cash===6400,'Restart isolated');});
test("pause and open panel freeze the service clock",()=>{const b=boot({},'#mode=sample');prepared(b);b.act('open');b.tick(10);b.act('pause');const progress=b.vm.serviceProgress;b.tick(100);check(b.vm.serviceProgress===progress,'Pause');b.act('panel',true);b.act('pause');b.tick(100);check(b.vm.serviceProgress===progress,'Panel');b.act('panel',false);b.tick(10);check(b.vm.serviceProgress>progress,'Resume');});
test("v2.2.0 continuing key and saves are reused",()=>{const b=boot();const state=b.P.State.create(6);b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,restoreDay:false,state});const r=boot(b.storage);check(r.P.CONFIG.keys.run==='pizza-place-rebuild.run.v1'&&r.vm.cash===6400,'Compatible key');prepared(r);service(r);check(r.vm.cash===5300,'Compatible simulation');});
test("damaged saves recover without touching the sample",()=>{const b=boot();b.storage[b.P.CONFIG.keys.run]='{broken';const r=boot(b.storage);check(r.vm.phase==='prep'&&r.vm.cash===6400&&!!r.vm.notice,'Damaged save');});
test("v1 migration still uses checkpoint rules",()=>{const b=boot();const state=b.P.State.create(6);state.version=1;state.waste=2;state.action={type:'dough',total:5,remaining:3};b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:1,state});const r=boot(b.storage);check(r.vm.cans===0&&r.vm.disgust===2&&r.vm.work.progress===40,'Migration');});
test("five days preserve cash, history, stock and health",()=>{const b=boot({},'#mode=sample');prepared(b);service(b);for(let day=2;day<=5;day++){b.act('next');check(b.vm.day===day&&b.vm.phase==='prep','Next day');for(let n=0;n<10&&b.vm.disgust>0;n++)b.act('clean');for(let n=0;n<8;n++)b.act('train');for(const id of ['napkins','paper_plates']){if(b.vm.stock[id]<5)b.act('buy',id,5);}if(day===4){b.act('food');b.tick(45);}prepared(b,false);service(b);const r=b.vm.receipt;check(r.startCash+r.sales+r.otherIncome-r.spending===b.vm.cash,'Ledger Day '+day);check(b.P.Save.valid(JSON.parse(b.storage[b.P.CONFIG.keys.run]).state),'Valid save Day '+day);}check(b.vm.history.length===5&&b.vm.health>0,'Five receipts');const r=boot(b.storage,'#mode=sample');check(r.vm.day===5&&r.vm.history.length===5&&r.vm.cash===b.vm.cash,'Day 5 reload');r.act('next');check(r.vm.day===6,'Continuing checkpoint');});
test("food completes while a prep panel is open",()=>{const b=boot({},'#mode=sample');prepared(b);service(b);b.act('next');b.act('panel',true);b.act('food');const paid=b.vm.cash;b.tick(45);check(b.vm.health===10&&b.vm.cash===paid&&!b.vm.work,'Food delivered once');});
test("catalogue purchases and locked recipes use engine reasons",()=>{const b=boot();b.act('buy','pepperoni');check(b.vm.stock.pepperoni===0&&b.vm.cash===6400,'Locked topping');b.act('upgrade','hand_made_sign');check(b.vm.cash===3900&&b.vm.reputation===4,'Sign');b.act('buy','pop',5);check(b.vm.stock.pop===5&&b.vm.cash===3400,'Five pack');});
test("milestones remain visible and unlock menus",()=>{const b=boot({},'#mode=sample');const state=b.P.State.create(6);state.stats.slices=24;b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,state});const r=boot(b.storage,'#mode=sample');prepared(r);service(r);check(r.vm.slots===2&&r.vm.recipes.find(x=>x.id==='pepperoni').unlocked,'Unlocked');check(r.vm.receipt.milestones.length>0&&r.vm.log.some(row=>row.text.includes('Unlocked')),'Visible milestone');r.act('next');r.act('menu','pepperoni');check(r.vm.recipes.find(x=>x.id==='pepperoni').active,'Editable menu');});
test("health ending shows a score before confirmed restart",()=>{const b=boot({},'#mode=sample');const state=b.P.State.create(6);state.health=1;state.today.startHealth=1;b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,state});const r=boot(b.storage,'#mode=sample');prepared(r);service(r);check(r.vm.dayTerminal&&r.vm.health===0,'Health zero receipt');r.act('next');check(r.vm.runEnded&&r.vm.endReason==='health'&&r.vm.final.days===1,'Score');check(r.P.Save.valid(JSON.parse(r.storage[r.P.CONFIG.keys.run]).state),'Valid end save');});
test("cash ending applies checkpoint recovery only once",()=>{const b=boot();const state=b.P.State.create(6);state.cash=0;state.today.startCash=0;b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,state});const r=boot(b.storage);check(r.vm.canRecover,'Recovery offered');r.act('recover');check(r.vm.runEnded&&r.vm.endReason==='cash'&&r.vm.cash===1000,'Checkpoint recovery');r.act('recover');check(r.vm.cash===1000,'Once');});
test("closing events reconcile all other income",()=>{const b=boot({},'#mode=sample&event=lucky_ticket');prepared(b);service(b);check(b.vm.cash===9800&&b.vm.receipt.otherIncome===4500,'Cash event');check(b.vm.receipt.startCash+b.vm.receipt.sales+b.vm.receipt.otherIncome-b.vm.receipt.spending===b.vm.cash,'Full ledger');});
test("preview events cannot alter the continuing run",()=>{const b=boot({},'#mode=run&event=lucky_ticket');const state=b.P.State.create(6);b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,state});const r=boot(b.storage,'#mode=run&event=lucky_ticket');prepared(r);service(r);check(!r.vm.sample&&r.vm.cash===5300&&r.vm.receipt.otherIncome===0,'Run ignores preview effects');});
function recipeDay(day=2){
 const b=boot(),s=b.P.State.create(6);s.day=day;s.today=b.P.State.daily(s);
 b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:b.P.CONFIG.saveVersion,state:s});
 const r=boot(b.storage);prepared(r,false);return r;
}
function select(b,ids){for(const id of b.vm.notebook.selected)b.act('selectTopping',id);for(const id of ids)b.act('selectTopping',id);}
test('deliveries introduce experiments by Day 2 without auto-discovering recipes',()=>{
 const b=recipeDay();check(b.vm.notebook.choices.find(x=>x.id==='onion').available&&b.vm.notebook.choices.find(x=>x.id==='pickles').available,'Day 2 delivery');
 check(!b.vm.recipes.find(x=>x.id==='dill_icious').unlocked&&b.vm.notebook.known===1,'Still undiscovered');
 const d3=recipeDay(3);check(d3.vm.notebook.choices.find(x=>x.id==='pepperoni').available&&!d3.vm.recipes.find(x=>x.id==='pepperoni').unlocked,'Delivery and discovery separate');
});
test('a successful combination spends exactly one slice and one of each topping',()=>{
 const b=recipeDay();b.act('buy','onion',5);b.act('buy','pickles',5);select(b,['pickles','onion']);const before=b.vm.cash,rng=JSON.parse(b.storage[b.P.CONFIG.keys.run]).state.rng;
 b.act('experiment');check(b.vm.stock.slices===7&&b.vm.stock.onion===4&&b.vm.stock.pickles===4&&b.vm.cash===before,'Exact cost');
 check(b.vm.notebook.last.name==='Dill-icious'&&b.vm.notebook.known===2&&b.vm.notebook.last.matches,'Discovery');
 const saved=JSON.parse(b.storage[b.P.CONFIG.keys.run]).state;
 check(saved.today.tastedSlices===1&&saved.lots.onion[0].quantity===4&&saved.rng===rng,'Lots, ledger and randomness');
 check(saved.stats.slices===0&&b.P.Save.valid(saved),'Samples are not sales');
});
test('duplicate recipes and failed combinations do not charge a second time',()=>{
 const b=recipeDay();b.act('buy','onion',3);b.act('buy','pickles',3);select(b,['onion']);b.act('experiment');
 check(!b.vm.notebook.last.found&&b.vm.stock.slices===7,'Failed sample');const failed=JSON.stringify(b.vm.stock);b.act('experiment');check(JSON.stringify(b.vm.stock)===failed,'Failed mix not charged twice');
 select(b,['onion','pickles']);b.act('experiment');const found=JSON.stringify(b.vm.stock);b.act('experiment');check(JSON.stringify(b.vm.stock)===found&&b.vm.notebook.known===2,'Known recipe not charged twice');
});
test('a discovered recipe can replace the single starting menu slot and sell',()=>{
 const b=recipeDay();b.act('buy','onion',10);b.act('buy','pickles',10);select(b,['onion','pickles']);b.act('experiment');b.act('menu','dill_icious');
 check(b.vm.recipes.find(r=>r.id==='dill_icious').active&&!b.vm.recipes.find(r=>r.id==='plain').active,'Replaced one slot');
 service(b);const saved=JSON.parse(b.storage[b.P.CONFIG.keys.run]).state;
 check(saved.today.sales.dill_icious>0,'Discovered recipe sold');check(b.vm.receipt.prepared===8&&b.vm.receipt.tasted===1,'Prepared count includes taste test');
 check(b.vm.receipt.sold+b.vm.receipt.leftovers+b.vm.receipt.tasted===8&&b.vm.receipt.discoveries.includes('Dill-icious'),'Inventory and discovery receipt');
 check(b.vm.receipt.startCash+b.vm.receipt.sales+b.vm.receipt.otherIncome-b.vm.receipt.spending===b.vm.cash,'Cash reconciles');
});
test('discovery persists through reload and service checkpoint restoration',()=>{
 const b=recipeDay();b.act('buy','onion',5);b.act('buy','pickles',5);select(b,['onion','pickles']);b.act('experiment');b.act('menu','dill_icious');
 const r=boot(b.storage);check(r.vm.notebook.known===2&&r.vm.stock.slices===7,'Reload discovery');r.act('open');r.tick(50);
 const restored=boot(r.storage);check(restored.vm.phase==='prep'&&restored.vm.stock.slices===7&&restored.vm.notebook.known===2&&restored.vm.notebook.attempts.length===1,'Prepared checkpoint includes experiment');
});
test('experiments reject missing slices, missing stock and service input without spending',()=>{
 const b=recipeDay();select(b,['onion','pickles']);const before=b.vm.cash;b.act('experiment');check(b.vm.stock.slices===8&&b.vm.cash===before,'No free stock');
 b.act('buy','onion');b.act('buy','pickles');b.act('open');const snapshot=JSON.stringify(b.vm.stock);b.act('experiment');check(JSON.stringify(b.vm.stock)===snapshot,'No service experiments');
 const c=recipeDay();const saved=JSON.parse(c.storage[c.P.CONFIG.keys.run]);saved.state.inventory.slices=0;c.storage[c.P.CONFIG.keys.run]=JSON.stringify(saved);const r=boot(c.storage);r.act('buy','onion');select(r,['onion']);r.act('experiment');check(r.vm.stock.onion===1,'No sample without slice');
});
test('locked toppings, duplicates and overfull combinations cannot be tested',()=>{
 const b=recipeDay(),s=JSON.parse(b.storage[b.P.CONFIG.keys.run]).state;
 for(const mix of ['onion,onion','pepperoni','onion,pickles,ham,pineapple','unknown'])check(!b.P.Recipes.check(s,mix).ok,'Rejected '+mix);
 check(b.vm.notebook.known===1,'No discovery');
});
test('legacy v2 runs migrate recipes, stock, history and cash with a backup',()=>{
 const original=boot({},'#mode=sample'),s=original.P.State.create(6);s.day=3;s.stats.slices=50;s.menu=['classic'];s.cash=12345;s.inventory.flour=3;s.today=original.P.State.daily(s);
 const raw=JSON.stringify({version:2,state:s}),storage={[original.P.CONFIG.keys.run.replace('roadside.one-day.design-v1.run','pizza-place-rebuild.run.v1')]:raw};
 const b=boot(storage);check(b.vm.day===3&&b.vm.cash===12345&&b.vm.stock.flour===3,'Existing run');
 check(b.vm.recipes.find(r=>r.id==='classic').active&&b.vm.recipes.find(r=>r.id==='mushroom').unlocked,'Grandfathered recipes');
 check(b.vm.stock.onion===0&&b.vm.notebook.known===4&&storage[b.P.CONFIG.keys.run+'.pre-2.3.0']===raw,'New stock and original backup');
});
test('malformed discovery saves fail gracefully',()=>{
 const b=recipeDay(),key=b.P.CONFIG.keys.run;const s=JSON.parse(b.storage[key]);s.state.recipeBook.known.push('not_a_recipe');b.storage[key]=JSON.stringify(s);const r=boot(b.storage);check(r.vm.day===1&&r.vm.cash===6400&&!!r.vm.notice,'Damaged recipe data');
 const broken=boot({[key]:JSON.stringify({version:2,state:{version:2}})});check(broken.vm.cash===6400,'Malformed legacy structure');
});
test('positive, negative and neutral customer outcomes retain distinct labels',()=>{
 const b=boot({},'#mode=sample');prepared(b);service(b);const rows=b.vm.log;
 check(rows.some(row=>row.tone==='positive'&&row.outcome)&&rows.some(row=>row.tone==='negative'&&row.outcome),'Different outcome categories');
 check(rows.every(row=>row.tone&&row.outcome)&&b.vm.salesTotal===4,'Labels and persistent sales total');
});
test('resetting the current run clears discoveries and preserves the sample',()=>{
 const b=recipeDay();b.act('buy','onion');b.act('buy','pickles');select(b,['onion','pickles']);b.act('experiment');
 const sample=boot(b.storage,'#mode=sample');prepared(sample);service(sample);const before=b.storage[sample.P.CONFIG.keys.run];b.act('reset');
 check(b.vm.notebook.known===1&&b.vm.notebook.attempts.length===0&&b.vm.salesTotal===0&&b.storage[sample.P.CONFIG.keys.run]===before,'Isolated fresh run');
});
test('all nine discoverable recipes match their intended combinations',()=>{
 const b=recipeDay(5);prepared(b,false);for(const ingredient of b.P.RECIPE_BOOK.ingredients)b.act('buy',ingredient.id,5);
 for(const recipe of b.P.DATA.recipes.filter(recipe=>recipe.id!=='plain')){select(b,[...recipe.ingredients].reverse());b.act('experiment');check(b.vm.notebook.last.name===recipe.name&&b.vm.notebook.last.matches,'Found '+recipe.id);}
 const s=JSON.parse(b.storage[b.P.CONFIG.keys.run]).state;
 check(b.vm.notebook.known===10&&s.today.tastedSlices===9&&s.inventory.slices===7&&b.P.Save.valid(s),'Complete notebook and lots');
});
test('a bad customer reaction is negative even when the customer paid',()=>{
 let found=false;
 for(let seed=1;seed<=20&&!found;seed++){
  const b=boot({},'#mode=sample'),s=b.P.State.create(seed);s.dirt=10;s.price=100;s.today=b.P.State.daily(s);b.storage[b.P.CONFIG.keys.run]=JSON.stringify({version:2,state:s});
  const r=boot(b.storage,'#mode=sample');prepared(r,false);service(r);
  const row=r.vm.log.find(row=>row.outcome==='Unhappy');
  if(row){check(row.tone==='negative'&&row.text.includes('+$')&&row.effect.includes('−'),'Paid, negative reaction and reputation loss');found=true;}
 }
 check(found,'Unhappy sale covered');
});
test('presentation history cannot break a valid discovered-recipe save',()=>{
 const b=recipeDay(),saved=JSON.parse(b.storage[b.P.CONFIG.keys.run]);saved.state.recipeBook.last={recipe:'missing',ingredients:null};b.storage[b.P.CONFIG.keys.run]=JSON.stringify(saved);
 const r=boot(b.storage);check(r.vm.day===2&&r.vm.cash===b.vm.cash&&r.vm.notebook.last===null,'Derived last attempt from validated history');
});
console.log(passed+' model checks passed.');
