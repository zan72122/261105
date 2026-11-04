'use strict';
/* ---------------- input ---------------- */
let OP=null, activeId=null;
function P(e){return{x:e.clientX,y:e.clientY};}
function onDown(e){
  e.preventDefault();
  initAudio();
  G.idle=0; cancelDemo();
  const p=P(e);
  if(!G.woke){G.woke=true;G.wake=1;for(let i=0;i<NBIN;i++)D.wobV[i]+=1.2*Math.sin(i*0.5);for(const m of fam)m.wig=0.5;S.wake();}
  if(activeId!==null){ return; }
  activeId=e.pointerId; try{cv.setPointerCapture(e.pointerId);}catch(_){}
  beginTouch(p);
  const C=LY.C;
  if(G.phase==='cloth'){clothDown(p);return;}
  if(G.phase!=='kitchen'){return;}
  const ang=Math.atan2(p.y-C.y,p.x-C.x),dist=hyp(p.x-C.x,p.y-C.y),rr=interp(D.rPx,ang);
  const onDough=dist<=rr+Math.max(30,LY.R0*0.4);
  if(D.state==='raw'){
    if(onDough){poke(p,dist<rr?0.75:0.45);OP={type:'stretch',sx:p.x,sy:p.y,sd:Math.max(0.2,dist/LY.R0),lobe:null,moved:false,lx:p.x,ly:p.y,lt:performance.now(),speed:0};return;}
    tapOther(p);return;
  }
  if(D.state==='baking'){ if(onDough) poke(p,0.5); else tapOther(p); return; }
  if(D.state==='baked'){
    const inside=dist<=rr+24;
    const canCut=D.cuts.length<6&&D.slices.every(s=>s.state==='on');
    const grab=canCut?dist<=rr*0.92:inside;
    if(D.slices.length>=2&&grab){const k=sliceOf(ang);if(D.slices[k].state==='on'){startCarry(k,p);return;}}
    if(canCut&&(inside||dist<rr+LY.R0*1.6)){OP={type:'cut',sx:p.x,sy:p.y,minD:dist,lx:p.x,ly:p.y,done:false};if(inside)poke(p,0.35);return;}
    if(inside){poke(p,0.5);return;}
    tapOther(p);
  }
}
function segDist(px,py,ax,ay,bx2,by2){const vx=bx2-ax,vy=by2-ay;const l=vx*vx+vy*vy;let t=l>0?((px-ax)*vx+(py-ay)*vy)/l:0;t=clamp(t,0,1);return hyp(ax+vx*t-px,ay+vy*t-py);}
function onMove(e){
  if(e.pointerId!==activeId) return;
  touchGlow.x=e.clientX;touchGlow.y=e.clientY;
  if(!OP) return;
  e.preventDefault(); G.idle=0;
  const p=P(e),C=LY.C,R0=LY.R0,now=performance.now();
  if(OP.type==='stretch'){
    const dt=Math.max(1,now-OP.lt); const sp=hyp(p.x-OP.lx,p.y-OP.ly)/dt*1000; OP.speed=lerp(OP.speed,sp,0.4); OP.lx=p.x;OP.ly=p.y;OP.lt=now;
    if(!OP.moved){if(hyp(p.x-OP.sx,p.y-OP.sy)<7)return;OP.moved=true;
      const a0=Math.atan2(OP.sy-C.y,OP.sx-C.x);let best=null,bd=0.4;
      for(const lb of D.lobes){const d=Math.abs(angD(lb.a,a0));if(d<bd){bd=d;best=lb;}}
      if(!best){ if(D.lobes.length>=7){D.lobes.sort((a,b)=>a.L-b.L);D.lobes.shift();}
        best={a:a0,at:a0,L:realR(a0),Lt:realR(a0),v:0,w:0.6,thick:1,held:true};D.lobes.push(best);}
      best.held=true; OP.lobe=best; OP.grabOff=Math.max(0,best.L-OP.sd);
    }
    const lb=OP.lobe; const fd=hyp(p.x-C.x,p.y-C.y)/R0, ang=Math.atan2(p.y-C.y,p.x-C.x);
    lb.at=ang;
    const off=OP.grabOff*clamp(1-(fd-OP.sd)/1.0,0,1);
    lb.Lt=clamp(fd+off,1,stretchCap(ang));
    stretchSound(OP.speed,lb.L,true);
    if(rnd()<0.25){const tp={x:C.x+Math.cos(lb.a)*lb.L*R0,y:C.y+Math.sin(lb.a)*lb.L*R0};fx(tp.x,tp.y,(rnd()-0.5)*40,(rnd()-0.5)*40,0.3,LY.ds*1.2,0,0.7,0,3);}
    // big stretch to the table edge on the 2nd dough and later -> tablecloth
    if(G.round>=2&&!G.clothThisRound&&D.state==='raw'&&nearSlot(lb.a)>0.45&&lb.L*R0>=clothDist(lb.a)*0.96){startCloth();}
  } else if(OP.type==='cut'){
    const d=segDist(C.x,C.y,OP.lx,OP.ly,p.x,p.y); OP.minD=Math.min(OP.minD,d);
    OP.lx=p.x;OP.ly=p.y;
    if(rnd()<0.7)fx(p.x,p.y,(rnd()-0.5)*30,(rnd()-0.5)*30,0.35,LY.ds*1.3,0,1,0,2);
    S.rustle&&rnd()<0.1&&S.rustle(0.3);
    const rr=D.rPx.reduce((a,b)=>a+b,0)/NBIN, mv=hyp(p.x-OP.sx,p.y-OP.sy), dc=hyp(p.x-C.x,p.y-C.y);
    if(!OP.done&&OP.minD<rr*0.7&&mv>R0*1.3&&dc>rr*0.6){OP.done=doCut(Math.atan2(p.y-OP.sy,p.x-OP.sx));if(OP.done)G.demoDone.cut=true;}
  } else if(OP.type==='carry'){
    const s=D.slices[OP.k]; s.gx=p.x-s.grab.x; s.gy=p.y-s.grab.y;
    OP.hist.push([p.x,p.y,now]); while(OP.hist.length>2&&now-OP.hist[0][2]>90)OP.hist.shift();
  } else if(OP.type==='cloth'){
    const cn=CL.corners[OP.k]; let vx=p.x-cn.gs.x,vy=p.y-cn.gs.y; const ml=Math.min(LY.cloth.w,LY.cloth.h)*0.7,l=hyp(vx,vy);
    if(l>ml){vx*=ml/l;vy*=ml/l;}
    const sp=hyp(vx-cn.vx,vy-cn.vy); cn.vx=vx;cn.vy=vy;
    if(l>6){cn.ux=Math.abs(vx)/l;cn.uy=Math.abs(vy)/l;}
    if(sp>3&&rnd()<0.5)S.rustle(Math.min(1,sp/30));
  }
}
function onUp(e){
  if(e.pointerId!==activeId) return;
  if(e.cancelable) e.preventDefault();
  const p=P(e); endOp(e.type==='pointercancel',p);
}
function endOp(cancel,p){
  const op=OP; OP=null; activeId=null;
  releaseTouch(cancel);
  stretchSound(0,1,false);
  if(!op) return;
  if(op.type==='stretch'){
    if(op.lobe){const lb=op.lobe;lb.held=false;lb.Lt=1+(lb.Lt-1)*0.95;S.release(lb.L);
      for(let i=0;i<NBIN;i++){D.wobV[i]+=0.9*lobeWeight(lb,i*TAU/NBIN);} G.demoDone.stretch=true;}
  } else if(op.type==='cut'){
    if(!op.done&&!cancel&&p){const C=LY.C,rr=D.rPx.reduce((a,b)=>a+b,0)/NBIN;
      if(op.minD<rr*0.75&&hyp(p.x-op.sx,p.y-op.sy)>LY.R0*0.9){doCut(Math.atan2(p.y-op.sy,p.x-op.sx));}}
  } else if(op.type==='carry'){
    const s=D.slices[op.k]; if(!s||s.state!=='carry') return;
    let m=null;
    if(!cancel&&p){const h=op.hist;const a=h[0],b=h[h.length-1];const dt=Math.max(1,b[2]-a[2]);m=choosePlate(p,(b[0]-a[0])/dt,(b[1]-a[1])/dt);}
    if(m){sendSlice(op.k,m);G.demoDone.carry=true;} else {s.state='back';S.release(1.2);}
  } else if(op.type==='cloth'){
    const cn=CL.corners[op.k]; cn.grabbed=false; CL.grab=-1; S.release(1.5);
  }
}
function clothDown(p){
  let best=-1,bd=1e9; const tmp={x:0,y:0};
  for(let k=0;k<4;k++){const cn=CL.corners[k];const r=clothRest(cn.gx,cn.gy);const x=r.x+cn.vx,y=r.y+cn.vy;const d=hyp(p.x-x,p.y-y);if(d<bd){bd=d;best=k;}}
  const c=LY.cloth; const inside=p.x>c.l-50&&p.x<c.r+50&&p.y>c.t-50&&p.y<c.b+50;
  if(best>=0&&(bd<Math.max(60,0.55*Math.min(c.w,c.h))||inside)){
    const cn=CL.corners[best]; cn.grabbed=true; CL.grab=best; cn.gs={x:p.x-cn.vx,y:p.y-cn.vy}; cn.cvx=cn.cvy=0;
    OP={type:'cloth',k:best}; S.rustle(0.5);
    clothPos(clamp((p.x-c.l)/c.w,0,1),clamp((p.y-c.t)/c.h,0,1),tmp);
    for(let i=0;i<4;i++){const a=rnd()*TAU;fx(p.x,p.y,Math.cos(a)*60,Math.sin(a)*60,0.3,LY.ds*1.3,1,0.9,0,3);}
  } else {
    // grandma: small wiggle only
    const g=fam[0]; if(hyp(p.x-g.x,p.y-g.y)<hrOf(g)*1.6){g.wig=1;S.blip(g);}
  }
}
function tapOther(p){
  const R0=LY.R0;
  for(const c of [cont.tomato,cont.corn]){if(hyp(p.x-c.x,p.y-c.y)<LY.contR+28){c.wob=1;S.knock(c.kind==='tomato'?520:880);return;}}
  if(hyp(p.x-oven.x,p.y-oven.y)<LY.ovenR+28){oven.wob=1;S.knock(300);for(let i=0;i<3;i++)fx(oven.x,oven.y+LY.ovenR*0.2,(rnd()-0.5)*30,-40-rnd()*30,0.5,LY.ds*1.5,1,0.9,-10,1);return;}
  for(const m of fam){const hr=hrOf(m);if(hyp(p.x-m.x,p.y-m.y)<hr*1.5||(Math.abs(p.x-m.x)<hr&&p.y>m.y&&p.y<m.y+hr*2.4)){m.wig=1;S.blip(m);return;}}
  // Background touches acknowledge input without advancing the game.
  fx(p.x,p.y,0,-10,0.3,LY.ds*1.1,0,0.4,0,0);
}
cv.addEventListener('pointerdown',onDown,{passive:false});
cv.addEventListener('pointermove',onMove,{passive:false});
cv.addEventListener('pointerup',onUp,{passive:false});
cv.addEventListener('pointercancel',onUp,{passive:false});
cv.addEventListener('lostpointercapture',e=>{if(e.pointerId===activeId)endOp(true);});
window.addEventListener('pointerup',e=>{if(e.pointerId===activeId)onUp(e);},{passive:false});
window.addEventListener('blur',()=>{if(activeId!==null)endOp(true);});
['touchstart','touchmove','touchend','gesturestart','gesturechange','dblclick','contextmenu'].forEach(ev=>document.addEventListener(ev,e=>{if(e.cancelable)e.preventDefault();},{passive:false}));
window.addEventListener('resize',()=>layout());
window.addEventListener('orientationchange',()=>setTimeout(layout,120));

