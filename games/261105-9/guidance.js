'use strict';
/* ---------------- guidance ---------------- */
function computeTarget(){
  if(G.phase==='cloth'){const k=CL.kids.find(k=>!k.found);return k?{kind:'corner',corner:k.corner,kid:k}:null;}
  if(G.phase!=='kitchen') return null;
  const C=LY.C;
  if(D.state==='raw'){
    if(G.round>=2&&G.round%2===0&&!G.clothThisRound){const a=PI/2;return{kind:'nub',ang:a,dest:{x:C.x,y:C.y+clothDist(a)},dk:'edge'};}
    const f=G.cfg.first,s2=f==='tomato'?'corn':'tomato';
    for(const k of [f,s2]){const c=cont[k];if(D.caught[k]<3&&c.stock>0)return{kind:'nub',ang:c.a,dest:c,dk:k};}
    return{kind:'nub',ang:oven.a,dest:oven,dk:'oven'};
  }
  if(D.state==='baking') return null;
  if(!D.slices.length) return{kind:'pizza'};
  const on=D.slices.filter(s=>s.state==='on'); if(!on.length) return null;
  let bs=on[0],bc=-1; for(const s of on){const k=D.slices.indexOf(s);const c=D.tops.filter(t=>t.slice===k&&t.st==='on').length;if(c>bc){bc=c;bs=s;}}
  let bm=fam[0]; for(const m of fam){if(m.served<bm.served||(m.served===bm.served&&m.i<bm.i))bm=m;}
  return{kind:'slice',s:bs,m:bm};
}
function gazePoint(m){
  const tg=G.target,C=LY.C;
  if(G.phase==='cloth'){ if(tg&&tg.kind==='corner'){const cn=CL.corners[tg.corner];return clothRest(cn.gx,cn.gy);} return {x:LY.C.x,y:LY.cloth.t+LY.cloth.h/2}; }
  if(m.eating!==null) return plateOf(m);
  if(OP&&OP.type==='carry'){const s=D.slices[OP.k];return{x:s.cx+s.ox,y:s.cy+s.oy};}
  if(tg){ if(tg.kind==='nub') return tg.dest; if(tg.kind==='slice'){return{x:tg.s.cx+tg.s.ox,y:tg.s.cy+tg.s.oy};} }
  return C;
}
function startDemo(op){
  G.demoDone[op]=true; G.demo={op,t:0,tg:G.target}; glog('demo '+op);
}
function cancelDemo(){ if(!G.demo) return; G.demo=null; D.ghost=null; CL.ghost=null; for(const s of D.slices){s.ghx=0;s.ghy=0;} }
function updateDemo(dt){
  if(!G.demo){
    if(G.idle>4&&!OP){const tg=G.target;if(tg){
      if(tg.kind==='nub'&&!G.demoDone.stretch)startDemo('stretch');
      else if(tg.kind==='pizza'&&!G.demoDone.cut)startDemo('cut');
      else if(tg.kind==='slice'&&!G.demoDone.carry)startDemo('carry');
      else if(tg.kind==='corner'&&!G.demoDone.corner)startDemo('corner');}}
    return;
  }
  const dm=G.demo,tg=dm.tg,C=LY.C,R0=LY.R0; dm.t+=dt;
  if(dm.op==='stretch'){
    if(!(G.phase==='kitchen'&&D.state==='raw')){cancelDemo();return;}
    const a=tg.ang,base=realR(a),dest=hyp(tg.dest.x-C.x,tg.dest.y-C.y)/R0-0.15;
    let L=base,hand,press=0,al=1;
    if(dm.t<0.5){const e=ease(dm.t/0.5);const ex=C.x+Math.cos(a)*base*R0,ey=C.y+Math.sin(a)*base*R0;hand={x:lerp(ex+R0*0.9,ex,e),y:lerp(ey+R0*1.1,ey,e)};al=e;}
    else if(dm.t<0.75){hand={x:C.x+Math.cos(a)*base*R0,y:C.y+Math.sin(a)*base*R0};press=(dm.t-0.5)/0.25;}
    else if(dm.t<2.1){const e=ease((dm.t-0.75)/1.35);L=lerp(base,Math.max(base+0.3,dest),e);hand={x:C.x+Math.cos(a)*L*R0,y:C.y+Math.sin(a)*L*R0};press=1;}
    else if(dm.t<2.7){const e=ease((dm.t-2.1)/0.6);L=lerp(Math.max(base+0.3,dest),base,e);const hl=Math.max(base+0.3,dest);hand={x:C.x+Math.cos(a)*hl*R0,y:C.y+Math.sin(a)*hl*R0-e*R0*0.3};al=1-e;}
    else {cancelDemo();return;}
    D.ghost={a,L,w:0.5}; dm.hand=hand; dm.press=press; dm.al=al;
  } else if(dm.op==='cut'){
    if(!(G.phase==='kitchen'&&D.state==='baked'&&!D.slices.length)){cancelDemo();return;}
    const rr=Math.max(...D.rPx)+R0*0.3,a=-2.5;
    const s={x:C.x+Math.cos(a)*rr,y:C.y+Math.sin(a)*rr},e2={x:C.x-Math.cos(a)*rr,y:C.y-Math.sin(a)*rr};
    let hand,al=1,press=0;
    if(dm.t<0.5){al=ease(dm.t/0.5);hand=s;}
    else if(dm.t<1.4){const e=ease((dm.t-0.5)/0.9);hand={x:lerp(s.x,e2.x,e),y:lerp(s.y,e2.y,e)};press=1;if(rnd()<0.6)fx(hand.x,hand.y,(rnd()-0.5)*20,(rnd()-0.5)*20,0.4,LY.ds*1.4,0,1,0,2);}
    else if(dm.t<1.9){al=1-ease((dm.t-1.4)/0.5);hand=e2;}
    else {cancelDemo();return;}
    dm.hand=hand;dm.press=press;dm.al=al;
  } else if(dm.op==='carry'){
    const s=tg.s; if(!(s&&s.state==='on')){cancelDemo();return;}
    const pl=plateOf(tg.m),sx=s.cx+s.ox,sy=s.cy+s.oy;
    let hand,al=1,press=0;
    if(dm.t<0.5){al=ease(dm.t/0.5);hand={x:sx,y:sy};}
    else if(dm.t<0.7){hand={x:sx,y:sy};press=(dm.t-0.5)/0.2;}
    else if(dm.t<1.8){const e=ease((dm.t-0.7)/1.1);hand={x:lerp(sx,pl.x,e),y:lerp(sy,pl.y,e)};press=1;s.ghx=(hand.x-sx)*0.3;s.ghy=(hand.y-sy)*0.3;}
    else if(dm.t<2.3){al=1-ease((dm.t-1.8)/0.5);hand={x:pl.x,y:pl.y};}
    else {cancelDemo();return;}
    dm.hand=hand;dm.press=press;dm.al=al;
  } else if(dm.op==='corner'){
    if(G.phase!=='cloth'){cancelDemo();return;}
    const kd=tg.kid,cn=CL.corners[kd.corner];const p0=clothRest(cn.gx,cn.gy);
    const sx=cn.gx?-1:1,sy=cn.gy?-1:1,dl=Math.min(LY.cloth.w,LY.cloth.h)*0.32;
    const dir=kd.mode==='h'?{x:sx,y:0}:kd.mode==='v'?{x:0,y:sy}:{x:sx*0.707,y:sy*0.707};
    let hand,al=1,press=0,e=0;
    if(dm.t<0.5){al=ease(dm.t/0.5);hand=p0;}
    else if(dm.t<0.7){hand=p0;press=(dm.t-0.5)/0.2;}
    else if(dm.t<1.8){e=ease((dm.t-0.7)/1.1)*0.8;press=1;}
    else if(dm.t<2.4){e=0.8*(1-ease((dm.t-1.8)/0.6));al=1-ease((dm.t-1.8)/0.6);}
    else {cancelDemo();return;}
    if(dm.t>=0.7){CL.ghost={k:kd.corner,vx:dir.x*dl*e,vy:dir.y*dl*e};cn.ux=Math.abs(dir.x);cn.uy=Math.abs(dir.y);hand={x:p0.x+dir.x*dl*e,y:p0.y+dir.y*dl*e};}
    dm.hand=hand;dm.press=press;dm.al=al;
  }
}

