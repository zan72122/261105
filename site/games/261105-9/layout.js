'use strict';
/* ---------------- layout ---------------- */
let LY=null;
function readSafe(){const cs=getComputedStyle(saEl);return{t:parseFloat(cs.paddingTop)||0,r:parseFloat(cs.paddingRight)||0,b:parseFloat(cs.paddingBottom)||0,l:parseFloat(cs.paddingLeft)||0};}
function layout(){
  W=Math.max(1,window.innerWidth|0); H=Math.max(1,window.innerHeight|0);
  DPR=Math.min(2,window.devicePixelRatio||1);
  cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR); cv.style.width=W+'px'; cv.style.height=H+'px';
  const s=readSafe(); const x0=s.l+4,y0=s.t+4,x1=W-s.r-4,y1=H-s.b-4,w=Math.max(10,x1-x0),h=Math.max(10,y1-y0);
  const portrait=h>=w*1.05;
  const L={x0,y0,x1,y1,w,h,portrait};
  if(portrait){
    L.R0=Math.min(w*0.16,h*0.082); L.C={x:x0+w/2,y:y0+h*0.40}; L.hr=Math.min(w*0.075,h*0.04);
    L.famY=y0+h*0.865; L.plateY=y0+h*0.70; L.seatX=i=>x0+w*(0.14+0.24*i);
  } else {
    L.R0=Math.min(h*0.12,w*0.09); L.C={x:x0+w/2,y:y0+h*0.40}; L.hr=Math.min(h*0.042,w*0.035);
    L.famY=y0+h*0.868; L.plateY=y0+h*0.705; const sp=Math.min(w*0.15,L.R0*1.9); L.seatX=i=>x0+w/2+(i-1.5)*sp;
  }
  L.plateR=L.hr*1.2; L.ds=L.R0/62;
  L.seats=[0,1,2,3].map(i=>({x:L.seatX(i),y:L.famY}));
  L.plates=[0,1,2,3].map(i=>({x:L.seatX(i),y:L.plateY}));
  const C=L.C,R0=L.R0;
  L.table=portrait?{l:x0+4,r:x1-4,t:Math.max(y0+4,C.y-2.95*R0),b:L.plateY+L.plateR+6}
                  :{l:Math.max(x0+4,C.x-4.3*R0),r:Math.min(x1-4,C.x+4.3*R0),t:y0+6,b:L.plateY+L.plateR+8};
  L.contR=R0*0.42; L.ovenR=R0*0.56;
  L.cloth=portrait?{l:x0+w*0.07,r:x1-w*0.07,t:y0+h*0.31,b:y0+h*0.84}:{l:x0+w*0.2,r:x1-w*0.2,t:y0+h*0.27,b:y0+h*0.92};
  L.cloth.w=L.cloth.r-L.cloth.l; L.cloth.h=L.cloth.b-L.cloth.t;
  L.grandTop={x:x0+w/2,y:portrait?y0+h*0.205:y0+h*0.15};
  LY=L;
  buildTable();
  placeObjects(true);
  if(activeId!==null) endOp(true);
  for(const d of D.dots){d.x=d.tx||C.x;d.y=d.ty||C.y;}
  for(const m of fam){const p=famTarget(m);m.x=p.x;m.y=p.y;}
}
function slotPos(a,rr){
  const C=LY.C,R0=LY.R0,dx=Math.cos(a),dy=Math.sin(a); let d=2.45*R0; const m=rr+8;
  if(dx>0.01) d=Math.min(d,(LY.x1-m-C.x)/dx);
  if(dx<-0.01) d=Math.min(d,(C.x-LY.x0-m)/-dx);
  if(dy<-0.01) d=Math.min(d,(C.y-LY.y0-m-4)/-dy);
  return {x:C.x+dx*d,y:C.y+dy*d,d};
}
function clothDist(a){
  const T=LY.table,C=LY.C,dx=Math.cos(a),dy=Math.sin(a); let t=1e9;
  if(dx>1e-4)t=Math.min(t,(T.r-C.x)/dx); if(dx<-1e-4)t=Math.min(t,(T.l-C.x)/dx);
  if(dy>1e-4)t=Math.min(t,(T.b-C.y)/dy); if(dy<-1e-4)t=Math.min(t,(T.t-C.y)/dy);
  return t;
}

/* ---------------- templates ---------------- */
function sunflower(n,filter,rad){const out=[];rad=rad||1;for(let i=0;i<n;i++){const r=Math.sqrt((i+0.5)/n)*rad,a=i*2.399963;const x=r*Math.cos(a),y=r*Math.sin(a);if(!filter||filter(x,y))out.push({x,y,s:0.85+0.3*R(),p:R()*TAU});}return out;}
const TPL={};
TPL.bowl=sunflower(60,(x,y)=>y>-0.05);
TPL.ovenDome=sunflower(170,(x,y)=>y<0.5&&!((x*x)/(0.44*0.44)+((y-0.5)*(y-0.5))/(0.66*0.66)<1));
TPL.ovenFire=sunflower(26,null,1).map(p=>({x:p.x*0.32,y:0.5-Math.abs(p.y)*0.5,s:p.s,p:p.p}));
TPL.plateRing=[];for(let i=0;i<26;i++){const a=i/26*TAU;TPL.plateRing.push({x:Math.cos(a)*(0.95+R()*0.08),y:Math.sin(a)*(0.95+R()*0.08)*0.62,s:0.8+R()*0.4});}
TPL.plateIn=sunflower(16).map(p=>({x:p.x*0.72,y:p.y*0.45,s:p.s}));
TPL.mound=[{x:0,y:-0.35},{x:-0.42,y:-0.22},{x:0.42,y:-0.22},{x:-0.2,y:-0.62},{x:0.22,y:-0.6},{x:0,y:-0.85},{x:-0.62,y:-0.05},{x:0.62,y:-0.05},{x:-0.45,y:-0.5},{x:0.45,y:-0.48}];
TPL.hand=(()=>{const a=[];for(let i=0;i<7;i++)a.push({x:1+i*0.4,y:i*3.2,s:1.15});
  sunflower(34).forEach(p=>a.push({x:9+p.x*11,y:30+p.y*10,s:p.s}));
  for(let i=0;i<4;i++)a.push({x:-2-i*1.6,y:26-i*2.6,s:1});
  for(let k=0;k<3;k++)for(let i=0;i<4;i++)a.push({x:9+k*5.4,y:19-i*1.3+k*0.6,s:0.95});
  return a;})();
const KINDS=[
  {id:'grandma',scale:1.14,base:196.0,reg:2,form:[520,880],hair:'bun',gig:1},
  {id:'k1',scale:0.94,base:392.0,reg:2,form:[860,1300],hair:'pig',gig:1.25},
  {id:'k2',scale:0.88,base:329.6,reg:1,form:[380,1050],hair:'short',gig:1.15},
  {id:'k3',scale:0.8,base:523.25,reg:0,form:[470,1950],hair:'bob',gig:1.4}];
function memberTpl(k){
  const head=sunflower(96);
  let hair=[];
  if(k.hair==='bun'){hair=sunflower(28).map(p=>({x:p.x*0.36,y:-1.02+p.y*0.32,s:p.s}));hair=hair.concat(sunflower(70,(x,y)=>y<-0.42,1.04));}
  else if(k.hair==='pig'){[-1,1].forEach(sx=>sunflower(18).forEach(p=>hair.push({x:sx*1.05+p.x*0.3,y:-0.12+p.y*0.32,s:p.s})));hair=hair.concat(sunflower(60,(x,y)=>y<-0.5,1.03));}
  else if(k.hair==='short'){hair=sunflower(66,(x,y)=>y<-0.36,1.06);for(let i=0;i<6;i++)hair.push({x:0.1+i*0.06,y:-1.12-Math.sin(i*0.6)*0.18,s:1});}
  else {hair=sunflower(110,(x,y)=>(x*x+y*y)>0.8*0.8&&y<0.5,1.15);}
  const body=sunflower(58).map(p=>{const t=(p.y+1)/2;return{x:p.x*(0.72+0.38*t),y:1.12+t*1.3,s:p.s};});
  return {head,hair,body};
}

