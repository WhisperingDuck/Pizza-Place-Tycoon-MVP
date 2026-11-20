(()=>{
'use strict';
// Five-by-seven bitmap lettering for world signs, drawn directly into Canvas.
const glyphs={P:['11110','10001','10001','11110','10000','10000','10000'],I:['11111','00100','00100','00100','00100','00100','11111'],Z:['11111','00001','00010','00100','01000','10000','11111'],A:['01110','10001','10001','11111','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],E:['11111','10000','10000','11110','10000','10000','11111'],N:['10001','11001','11001','10101','10011','10011','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],L:['10000','10000','10000','10000','10000','10000','11111'],S:['01111','10000','10000','01110','00001','00001','11110'],D:['11110','10001','10001','10001','10001','10001','11110']};
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const artboard=document.createElement('canvas');artboard.width=640;artboard.height=220;
let walkElapsed=0,lastPaint=0,wasFrozen=false,lastVisitor=null,lastVM=null,frame=0;
function drawScene(vm){
 const canvas=artboard,x=canvas.getContext('2d');x.imageSmoothingEnabled=false;
 const time=vm.phase==='prep'?600:vm.phase==='report'?1140:660+480*vm.serviceProgress, dark=vm.phase==='report', dusk=vm.phase==='service'&&vm.serviceProgress>.61;
 const p=dark?{sky:'#263f4b',far:'#344c48',trees:'#2a443d',field:'#4b5e47',road:'#293c3f',line:'#7f947e',pole:'#1e3431',wall:'#aa9269',window:'#b8ac6e',front:'#81644b',roof:'#2a3c32',cloud:'#43565a'}:dusk?{sky:'#c6a781',far:'#9b9f76',trees:'#677a58',field:'#8e9762',road:'#646d5e',line:'#bbbd93',pole:'#4d5c45',wall:'#dbc795',window:'#8e9c72',front:'#b38a57',roof:'#445b43',cloud:'#e4c49a'}:{sky:'#abcab6',far:'#94b291',trees:'#648d65',field:'#a1b875',road:'#737d68',line:'#d5d9b5',pole:'#4e694d',wall:'#e9d7a0',window:'#6f936f',front:'#c69d61',roof:'#45694d',cloud:'#e2e8c7'};
 const r=(a,b,w,h,c)=>{x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),w,h)};
 const line=(a,b,c,d,col)=>{x.strokeStyle=col;x.lineWidth=1;x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke()};
 const txt=(str,a,b,scale,col)=>{for(let k=0;k<str.length;k++){const g=glyphs[str[k]];if(!g)continue;g.forEach((row,j)=>[...row].forEach((v,i)=>{if(v==='1')r(a+(k*6+i)*scale,b+j*scale,scale,scale,col)}));}};
 r(0,0,640,220,p.sky);
 if(dark){r(507,35,13,15,'#dddcae');r(503,39,4,7,'#dddcae');r(516,34,7,11,p.sky);[[69,37],[164,55],[350,27],[430,58],[566,77],[589,24],[263,31],[396,26]].forEach(([a,b])=>r(a,b,1,1,'#b8c9ba'));}
 else{const position=(time-600)/540;const sx=115+Math.min(1,position)*415,sy=29+Math.pow(position-.35,2)*125;r(sx,sy,18,14,'#f2dfa0');r(sx+3,sy-3,12,20,'#f2dfa0');r(42,52,49,5,p.cloud);r(51,47,25,5,p.cloud);r(510,68,65,5,p.cloud);r(527,62,29,6,p.cloud);}
 r(0,110,640,79,p.far);r(0,102,85,8,p.far);r(85,107,110,4,p.far);r(440,101,105,9,p.far);r(545,106,95,5,p.far);
 for(const [a,b,w]of [[26,107,20],[78,101,17],[136,113,15],[467,104,22],[548,109,19],[594,102,20]]){r(a,b,w,49,p.trees);r(a+3,b-8,w-6,8,p.trees);r(a+6,b-13,w-12,5,p.trees);}
 r(0,151,640,44,p.field);r(0,195,640,25,p.road);r(0,192,640,3,p.line);for(let i=0;i<9;i++)r(i*84+12,213,28,2,p.line);
 r(95,58,4,131,p.pole);r(82,67,30,4,p.pole);line(0,59,95,69,p.pole);line(95,69,460,80,p.pole);line(460,80,640,58,p.pole);r(459,72,4,117,p.pole);r(447,79,28,3,p.pole);
 // One modest stand. One microwave. Geometry is deliberately simple.
 // A few clumps of verge grass and gravel catch the changing light.
 for(let i=0;i<77;i++){let gx=(i*179+17)%640,gy=155+(i*43)%35;r(gx,gy,2+(i%3),1,dark?'#54664c':dusk?'#9a9a6d':'#aebe81');if(i%5===0)r(gx+1,gy-2,1,2,dark?'#415b44':'#86a467');}
 for(let i=0;i<48;i++){let gx=(i*197+97)%640,gy=197+(i*7)%22;r(gx,gy,1+(i%4),1,dark?'#344747':dusk?'#707565':'#7e866e');}
 r(200,78,212,108,p.roof);r(205,86,202,96,p.wall);r(205,85,202,6,p.roof);
 r(230,50,150,29,'#3c503c');r(233,53,144,23,dark?'#c8be8c':'#eee1b1');txt('PIZZA',261,57,2,'#9c4630');
 r(197,79,218,10,'#344c37');for(let i=0;i<12;i++)r(199+i*18,80,18,7,i%2?'#e0cb92':'#a74731');r(197,87,218,5,p.roof);
 r(217,101,178,50,p.roof);r(221,104,170,45,p.window);r(225,120,162,3,p.roof);
 r(232,109,9,11,'#9b5135');r(231,107,11,3,'#d2c69b');r(248,106,13,14,'#cfc59b');r(252,112,5,2,'#9b9b70');
 // Lamp is lit only at dusk and night.
 r(305,92,2,9,p.roof);r(300,100,12,4,p.roof);if(dark||dusk)r(303,104,6,2,'#f0da7b');
 r(280,124,12,12,'#d3a174');r(279,121,14,5,'#a3432d');r(290,126,4,2,'#a3432d');r(283,130,1,1,p.roof);r(289,130,1,1,p.roof);r(276,137,21,14,'#ece0b7');r(276,138,4,13,'#8a9d7d');r(293,138,4,13,'#8a9d7d');
 if(vm.microwave){r(349,124,33,24,'#c6c8ab');r(352,127,21,17,p.roof);r(354,129,17,13,'#65806d');r(376,128,3,4,p.roof);r(376,135,3,2,'#71866c');r(376,140,3,2,'#71866c');}
 r(215,150,182,6,p.roof);r(217,150,178,3,'#c8ad73');r(213,156,186,25,p.front);r(218,165,176,1,dark?'#907551':'#af874c');r(218,178,176,1,p.roof);
 r(310,147,25,3,'#d2c795');for(let i=0;i<Math.min(6,vm.stock.slices);i++){r(311+i*4,145,3,2,'#ecc567');r(311+i*4,144,2,1,'#b98244');}
 // Service counter panels and apron, with a little wear at the feet.
 for(const gx of [223,249,278,306,335,365,389]){r(gx,157,1,20,dark?'#765d47':'#ac8755');r(gx+1,158,1,17,dark?'#937656':'#d1ac70');}
 r(219,159,174,1,dark?'#9d815d':'#d7b575');r(206,93,3,88,dark?'#a18c65':'#d2bb86');
 r(349,164,42,11,vm.phase==='service'?'#3d6a40':'#a04530');txt(vm.phase==='service'?'OPEN':'CLOSED',vm.phase==='service'?358:352,166,1,'#f0e2ad');
 r(206,183,9,5,p.roof);r(398,183,9,5,p.roof);r(197,188,220,3,dark?'#394d3d':'#8ca465');
 r(428,164,17,25,'#526e54');r(425,161,23,4,'#718769');r(432,167,2,19,'#3b5641');r(440,167,2,19,'#3b5641');
 r(44,184,12,3,'#6c8d55');r(47,178,2,8,'#6c8d55');r(53,180,2,5,'#6c8d55');r(579,185,11,2,'#6c8d55');r(584,177,2,8,'#6c8d55');
 if(vm.phase==='service'&&vm.reaction){const duration=walkElapsed;const walking=!reducedMotion&&duration<900;const a=Math.round(reducedMotion?477:620-Math.min(1,duration/900)*143),b=158;const foot=walking?Math.floor(duration/140)%2:0;const shirt=['#977e54','#71918a','#6f83a1','#aa6d4d'][(vm.reaction.visitor||0)%4];r(a,b,9,10,'#caa181');r(a-1,b-2,10,4,'#494b35');r(a-2,b+10,13,17,shirt);r(a,b+27,3,12-foot*2,'#314c3e');r(a+6,b+27,3,10+foot*2,'#314c3e');r(a-1,b+37-foot*2,5,2,'#273b31');r(a+5,b+36+foot*2,6,2,'#273b31');}
}

function paint(vm){
  lastVM=vm;
  const visitor=vm.phase==='service'?vm.reaction?.visitor:null;
  const now=performance.now(),frozen=vm.paused||document.getElementById('sheet').open||document.hidden;
  if(visitor!==lastVisitor){lastVisitor=visitor;walkElapsed=0;}
  else if(visitor&&!frozen&&!wasFrozen){walkElapsed=Math.min(905,walkElapsed+Math.max(0,now-lastPaint));}
  lastPaint=now;wasFrozen=frozen;
  drawScene(vm);
  const display=document.getElementById('scene');
  const box=display.getBoundingClientRect();if(!box.height||!box.width)return;
  const height=box.width>700&&box.height<220?177:211;
  const width=Math.round(height*box.width/box.height);
  if(display.width!==width||display.height!==height){display.width=width;display.height=height;}
  const g=display.getContext('2d');g.imageSmoothingEnabled=false;
  const ox=Math.round((width-640)/2),oy=height===177?-32:-6;
  // Sky and power lines continue beyond the composition on short wide displays.
  // Only the distant verge is tiled. Keep celestial objects and poles unique.
  g.drawImage(artboard,0,0,1,1,0,0,width,height);
  const side=72,treeTop=88;
  for(let dist=0;dist<ox;dist+=side){
    g.save();g.translate(ox-dist,0);g.scale(-1,1);g.drawImage(artboard,0,treeTop,side,220-treeTop,0,oy+treeTop,side,220-treeTop);g.restore();
    g.save();g.translate(ox+640+dist+side,0);g.scale(-1,1);g.drawImage(artboard,640-side,treeTop,side,220-treeTop,0,oy+treeTop,side,220-treeTop);g.restore();
  }
  if(ox>0){
    g.strokeStyle=vm.phase==='report'?'#1e3431':vm.phase==='service'&&vm.serviceProgress>.61?'#4d5c45':'#4e694d';
    g.lineWidth=1;g.beginPath();g.moveTo(0,oy+59-ox*.1);g.lineTo(ox,oy+59);g.moveTo(ox+640,oy+58);g.lineTo(width,oy+58-ox*.12);g.stroke();
  }
  g.drawImage(artboard,ox,oy);
  if(frame)cancelAnimationFrame(frame);
  if(visitor&&!frozen&&!reducedMotion&&walkElapsed<905){frame=requestAnimationFrame(()=>paint(lastVM));}
}
window.addEventListener('resize',()=>{if(lastVM)paint(lastVM);});
document.addEventListener('visibilitychange',()=>{if(lastVM)paint(lastVM);});
window.StandScene={paint};
})();