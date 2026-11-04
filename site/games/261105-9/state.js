'use strict';
/* ---------------- state ---------------- */
const CONFIGS=[
  {tom:0,corn:-PI/2,oven:PI,first:'tomato'},
  {tom:-3*PI/4,corn:0,oven:-PI/4,first:'corn'},
  {tom:-PI/2,corn:PI,oven:0,first:'corn'},
  {tom:PI,corn:-PI/4,oven:-3*PI/4,first:'tomato'}];
const PERMS=[[1,0,2,3],[2,3,0,1],[0,2,3,1],[3,1,0,2]];
const G={round:1,cfg:CONFIGS[0],phase:'kitchen',phaseT:0,time:0,idle:0,demo:null,demoDone:{stretch:false,cut:false,carry:false,corner:false},
  woke:false,wake:0,clothThisRound:false,endT:0,target:null,goldF:0,clothMix:0,kAlpha:1,bass:false,laughUntil:0,
  lastPon:0,lastPari:0,lastSoft:0,stats:{pokes:0,firstPokeT:-1,catches:{tomato:0,corn:0},bakes:0,puffs:0,crisps:0,cuts:0,served:0,duets:0,bounces:0,cloths:0,found:0,rounds:1},log:[]};
function glog(s){G.log.push([+G.time.toFixed(2),s]);if(G.log.length>300)G.log.shift();}
const cont={tomato:{kind:'tomato',a:0,x:0,y:0,tx:0,ty:0,d:0,stock:12,max:12,pourT:0,tilt:0,wob:0},
            corn:{kind:'corn',a:0,x:0,y:0,tx:0,ty:0,d:0,stock:16,max:16,pourT:0,tilt:0,wob:0}};
const oven={a:PI,x:0,y:0,tx:0,ty:0,d:0,fire:0,wob:0};
const fam=KINDS.map((k,i)=>({k,i,tpl:memberTpl(k),seat:PERMS[0][i],x:0,y:0,phrase:new Int8Array(16).fill(-1),pdur:new Uint8Array(16).fill(1),
  hasSong:false,loudUntil:0,glow:0,dance:'nod',danceAmt:0,queue:[],eating:null,eatT:0,ate:{tom:0,corn:0,puff:0,crisp:0},wig:0,blink:2+R()*3,
  notes:[],bus:null,lp:null,alpha:1,duet:-1,duetUntil:0,served:0,beckon:0,muffle:false,pop:0}));
const PUL={tom:{l:-9,n:-9},bell:{l:-9,n:-9},pon:{l:-9,n:-9},shake:{l:-9,n:-9},clap:{l:-9,n:-9}};
function pulse(k){const p=PUL[k];const now=aNow();const dt=now-p.l;return dt>=0&&dt<0.6?Math.exp(-dt*9):0;}

