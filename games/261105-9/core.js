'use strict';
/*
 びろーん！つぶつぶピザのかくれんぼ食卓
 設計メモ（文字はUIに出さない）
  触る理由 : 生地の端がぷくっと跳ね、家族が具の容器を見ている。
  即時反応 : 触れた所がへこみ粒が散って戻る。引けば生地が指についてくる。
  次の試し : 届いた容器から具が落ち音が育つ → 別の方向・長さへ引く → 窯 → 切って配る → 二枚目でクロス。
 画風 : 群青単色背景 + 場面ごとの2色（台所=黄/赤、クロス=白/緑）。全て粒の集合と密度差。
*/
'use strict';
const TAU=Math.PI*2, PI=Math.PI;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const easeOut=t=>{t=clamp(t,0,1);return 1-(1-t)*(1-t)*(1-t);};
const angN=a=>((a%TAU)+TAU)%TAU;
const angD=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};
const hyp=Math.hypot;
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const R=mulberry(261105);
const rnd=Math.random;

const cv=document.getElementById('c');
const ctx=cv.getContext('2d',{alpha:false});
const saEl=document.getElementById('sa');
let W=1,H=1,DPR=1;

/* ---------------- dot batcher (2 color slots, 8 alpha levels) ---------------- */
const DOT_CAP=3000, BUCK=16, BCAP=3000;
const bx=[],by=[],br=[];const bn=new Int32Array(BUCK);
for(let i=0;i<BUCK;i++){bx.push(new Float32Array(BCAP));by.push(new Float32Array(BCAP));br.push(new Float32Array(BCAP));}
let dotCount=0,maxDots=0;
let camS=1,camCx=0,camCy=0,gA=1;
const colStr=['#fff','#f00'];
function dot(x,y,r,slot,a){
  a*=gA; if(a<0.04||dotCount>=DOT_CAP) return;
  if(camS!==1){x=(x-camCx)*camS+camCx;y=(y-camCy)*camS+camCy;r*=Math.max(0.6,camS);}
  if(x<-12||y<-12||x>W+12||y>H+12) return;
  let lv=(a*8)|0; if(lv>7)lv=7;
  const k=slot*8+lv,n=bn[k]; if(n>=BCAP) return;
  bx[k][n]=x;by[k][n]=y;br[k][n]=r;bn[k]=n+1;dotCount++;
}
function flush(){
  for(let k=0;k<BUCK;k++){
    const n=bn[k]; if(!n) continue;
    ctx.globalAlpha=((k&7)+1)/8; ctx.fillStyle=colStr[k>>3]; ctx.beginPath();
    const X=bx[k],Y=by[k],Rr=br[k];
    for(let i=0;i<n;i++){const r=Rr[i]; if(r<1.15){ctx.rect(X[i]-r,Y[i]-r,r*2,r*2);} else {ctx.moveTo(X[i]+r,Y[i]);ctx.arc(X[i],Y[i],r,0,TAU);}}
    ctx.fill(); bn[k]=0;
  }
  ctx.globalAlpha=1;
}

/* ---------------- palette ---------------- */
const BG='#1c2a88';
const PCREAM=[255,228,128],PGOLD=[255,190,52],PRED=[255,78,64],PWHITE=[242,246,255],PGREEN=[74,214,122];
function mix(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function rgb(c){return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')';}

