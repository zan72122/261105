'use strict';
/* ---------------- effects ---------------- */
const FX=[],FX_CAP=240;
function fx(x,y,vx,vy,life,r,slot,a,g,drag){if(FX.length>=FX_CAP)return;FX.push({x,y,vx,vy,life,max:life,r,slot,a,g:g||0,dr:drag||0});}
function updateFX(dt){for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.life-=dt;if(f.life<=0){FX[i]=FX[FX.length-1];FX.pop();continue;}f.vy+=f.g*dt;const k=Math.exp(-f.dr*dt);f.vx*=k;f.vy*=k;f.x+=f.vx*dt;f.y+=f.vy*dt;}}
function drawFX(){for(const f of FX){const t=f.life/f.max;dot(f.x,f.y,f.r*(0.6+0.4*t),f.slot,f.a*t);}drawTouch();}

// A visible acknowledgement also for the generous hit area around the dough.
// It never changes the recipe, gesture, or round progression.
const touchGlow={x:0,y:0,start:-10,released:-10,held:false};
function beginTouch(p){
  touchGlow.x=p.x;touchGlow.y=p.y;touchGlow.start=G.time;
  touchGlow.held=true;
}
function releaseTouch(cancel){
  touchGlow.held=false;
  touchGlow.released=cancel?-10:G.time;
}
function drawTouch(){
  const t=touchGlow,age=G.time-t.start;
  const fade=t.held?1:1-ease((G.time-t.released)/1.8);
  if(fade<=0) return;
  const scale=clamp(LY.ds,1,1.6);
  const spread=1-Math.exp(-age*8);
  for(let ring=0;ring<2;ring++){
    const count=ring?32:24;
    const radius=(12+ring*12+spread*9+Math.sin(age*6-ring)*3)*scale;
    for(let i=0;i<count;i++){
      const a=i/count*TAU+age*(ring?-0.35:0.45);
      dot(t.x+Math.cos(a)*radius,t.y+Math.sin(a)*radius,
        (ring?2:2.5)*scale,0,fade*(ring?0.85:1));
    }
  }
}

