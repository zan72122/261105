'use strict';
/* ---------------- main loop ---------------- */
function update(dt){
  G.idle+=dt; G.wake=Math.max(0,G.wake-dt*1.5);
  G.target=computeTarget();
  BCNT=boardCounts();
  const ph=G.phase;
  if(ph==='kitchen'){
    updateDough(dt); updateContainers(dt); updateFalling(dt); updateToppings(dt);
    if(D.state==='baking')updateBake(dt);
    updateSlices(dt); checkRoundEnd(dt);
    G.kAlpha=1;
  } else if(ph==='toCloth'){
    G.phaseT+=dt/1.6; G.kAlpha=1-ease(G.phaseT*1.4); G.clothMix=ease(G.phaseT);
    for(const kd of CL.kids) kd.m.alpha=1-ease(G.phaseT*1.2);
    updateCloth(dt);
    if(G.phaseT>=1){G.phase='cloth';G.phaseT=0;G.clothMix=1;}
  } else if(ph==='cloth'){
    updateCloth(dt);
  } else if(ph==='fromCloth'){
    G.phaseT+=dt/1.3; G.kAlpha=ease(G.phaseT); G.clothMix=1-ease(G.phaseT);
    for(const m of fam) m.alpha=1;
    updateDough(dt); updateContainers(dt);
    if(G.phaseT>=1){G.phase='kitchen';G.phaseT=0;G.clothMix=0;G.kAlpha=1;}
  }
  if(ph!=='cloth'&&ph!=='toCloth') for(const m of fam) m.alpha=lerp(m.alpha,1,Math.min(1,dt*4));
  updateFamily(dt);
  G.goldF=lerp(G.goldF,D.state==='baked'?1:D.state==='baking'?0.5:0,Math.min(1,dt*2));
  updateDemo(dt); updateFX(dt);
}
const PEAK={};
let raf=0,lastTs=-1;
function frame(ts){
  raf=requestAnimationFrame(frame);
  let dt=lastTs<0?1/60:(ts-lastTs)/1000; lastTs=ts;
  if(!(dt>0)) dt=1/60; dt=Math.min(dt,1/24);
  G.time+=dt;
  schedule();
  update(dt);
  render();
}
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){ if(raf){cancelAnimationFrame(raf);raf=0;} if(activeId!==null)endOp(true); if(AC&&AC.state==='running')AC.suspend().catch(()=>{}); }
  else { lastTs=-1; if(!raf) raf=requestAnimationFrame(frame); if(AC&&AC.state==='suspended')AC.resume().catch(()=>{}); }
});

/* ---------------- boot ---------------- */
makeDots();
layout();
for(const d of D.dots){d.x=LY.C.x;d.y=LY.C.y;}
{const C=LY.C;computeShape();for(const d of D.dots){const a=d.q*TAU;d.x=C.x+Math.cos(a)*d.u0*LY.R0;d.y=C.y+Math.sin(a)*d.u0*LY.R0;}}
for(const m of fam){const p=famTarget(m);m.x=p.x;m.y=p.y;}
raf=requestAnimationFrame(frame);

/* test hook (no UI) */
const API={forceBounce:false,G,D,CL,fam,cont,oven,get LY(){return LY;},get maxDots(){return maxDots;},set maxDots(v){maxDots=v;},
  get dotCount(){return dotCount;},get audio(){return AC?AC.state:'none';},get op(){return OP?OP.type:null;},
  boardCounts:()=>BCNT,PEAK,clothRest,clothDist,realR,sliceComp,
  doughEnergy(){let e=0;for(const d of D.dots)e+=Math.abs(d.vx)+Math.abs(d.vy);return e/D.dots.length;}};
window.__gf=API;
