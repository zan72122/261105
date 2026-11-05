'use strict';
/* ---------------- dough ---------------- */
const NBIN=72;
const D={state:'raw',lobes:[],ghost:null,nubE:0,nubA:0,
  rN:new Float32Array(NBIN),rD:new Float32Array(NBIN),th:new Float32Array(NBIN).fill(1),wob:new Float32Array(NBIN),wobV:new Float32Array(NBIN),
  rPx:new Float32Array(NBIN),bake:new Float32Array(NBIN),bakeEv:new Uint8Array(NBIN),puff:new Float32Array(NBIN),puffV:new Float32Array(NBIN),puffT:new Float32Array(NBIN),crisp:new Uint8Array(NBIN),
  cdf:new Float32Array(NBIN+1),frozen:false,dots:[],tops:[],falling:[],cuts:[],slices:[],bakeT:0,ovenBin:0,order:[],caught:{tomato:0,corn:0},binSlice:new Int8Array(NBIN).fill(-1),pokeE:0};
function makeDots(){
  const n=(Math.min(innerWidth,innerHeight)<500)?620:760;
  D.dots=[];
  for(let i=0;i<n;i++){const q=(i+R())/n,s=R();const u0=Math.sqrt(s)*0.96;const k=190-100*u0+R()*40;
    D.dots.push({q,u0,k,c:2*Math.sqrt(k)*0.42,x:0,y:0,vx:0,vy:0,tx:0,ty:0,ang:0,bin:0,sz:0.8+R()*0.45,ph:R()*TAU,slice:-1});}
}
function thickFor(e){if(e<=0.6)return 1.55;if(e<=1.1)return lerp(1.55,1.0,(e-0.6)/0.5);if(e<=1.5)return 1.0;if(e<=2.3)return lerp(1.0,0.42,(e-1.5)/0.8);return 0.42;}
function binOf(a){return (Math.floor(angN(a)/TAU*NBIN+0.5))%NBIN;}
function interp(arr,a){const f=angN(a)/TAU*NBIN;const i=f|0,fr=f-i;return arr[i%NBIN]*(1-fr)+arr[(i+1)%NBIN]*fr;}
function lobeWeight(lb,a){const d=angD(lb.a,a)/lb.w;return Math.exp(-2.2*d*d);}
function computeShape(){
  for(let i=0;i<NBIN;i++){
    const a=i*TAU/NBIN; let rn=1,bmax=0,thv=1;
    for(const lb of D.lobes){const b=lobeWeight(lb,a);if(b<0.003)continue;const v=1+(lb.L-1)*b;if(v>rn)rn=v;if(b>bmax){bmax=b;thv=1+(lb.thick-1)*b;}}
    let rd=rn;
    if(D.ghost){const b=lobeWeight(D.ghost,a);const v=1+(D.ghost.L-1)*b;if(v>rd)rd=v;}
    if(D.nubE>0){const dd=angD(D.nubA,a)/0.3;rd+=D.nubE*Math.exp(-dd*dd*2.5);}
    D.rN[i]=rn; D.rD[i]=rd; if(!D.frozen) D.th[i]=thv;
  }
}
function realR(a){return interp(D.rN,a);}
function maxObjD(){return Math.max(cont.tomato.d,cont.corn.d,oven.d)/LY.R0;}
function nearSlot(a){return Math.min(Math.abs(angD(a,cont.tomato.a)),Math.abs(angD(a,cont.corn.a)),Math.abs(angD(a,oven.a)));}
function stretchCap(a){
  const cl=clothDist(a)/LY.R0;
  if(G.round>=2&&nearSlot(a)>0.45&&!G.clothThisRound) return cl+0.4;
  return Math.max(1.2,Math.min(maxObjD()+1.0,cl-0.25));
}
function updateDough(dt){
  const R0=LY.R0,C=LY.C;
  for(const lb of D.lobes){
    if(lb.held){lb.a+=angD(lb.a,lb.at)*Math.min(1,dt*22);lb.L+=(lb.Lt-lb.L)*Math.min(1,dt*28);lb.v=0;}
    else{lb.v+=((lb.Lt-lb.L)*260-lb.v*10)*dt;lb.L+=lb.v*dt;}
    const e=Math.max(0,lb.L-1); lb.w=clamp(0.5/Math.max(0.6,e)+0.16,0.24,0.8); if(!D.frozen) lb.thick=thickFor(e);
  }
  if(D.ghost){const e=Math.max(0,D.ghost.L-1);D.ghost.w=clamp(0.5/Math.max(0.6,e)+0.16,0.24,0.8);}
  // grip nub toward the target
  const tg=G.target;
  if(tg&&tg.kind==='nub'&&!OP&&D.state==='raw'&&!G.demo){D.nubA+=angD(D.nubA,tg.ang)*Math.min(1,dt*6);const b=(G.time*1.6)%1;D.nubE=0.14+0.22*Math.max(0,Math.sin(b*PI*2))*(b<0.5?1:0);}
  else D.nubE=Math.max(0,D.nubE-dt*0.8);
  computeShape();
  const wob=D.wob,wv=D.wobV;
  for(let i=0;i<NBIN;i++){const l=wob[(i+NBIN-1)%NBIN],r=wob[(i+1)%NBIN];wv[i]+=(-170*wob[i]-6.5*wv[i]+(l+r-2*wob[i])*70)*dt;}
  for(let i=0;i<NBIN;i++){wob[i]=clamp(wob[i]+wv[i]*dt,-0.45,0.45);}
  for(let i=0;i<NBIN;i++){D.puffV[i]+=((D.puffT[i]-D.puff[i])*90-D.puffV[i]*5)*dt;D.puff[i]+=D.puffV[i]*dt;}
  for(let i=0;i<NBIN;i++) D.rPx[i]=Math.max(0.3,D.rD[i]+wob[i])*R0*(1+0.08*D.puff[i]);
  const cdf=D.cdf;
  if(!D.frozen){let acc=0;cdf[0]=0;for(let i=0;i<NBIN;i++){acc+=D.rD[i]*D.rD[i]*D.th[i];cdf[i+1]=acc;}for(let i=1;i<=NBIN;i++)cdf[i]/=acc;cdf[NBIN]=1;}
  let bi=0; const dots=D.dots,rp=D.rPx;
  for(let n=0;n<dots.length;n++){
    const d=dots[n];
    while(bi<NBIN-1&&cdf[bi+1]<=d.q)bi++;
    const span=cdf[bi+1]-cdf[bi],fr=span>1e-7?(d.q-cdf[bi])/span:0.5;
    const ang=(bi+fr)*TAU/NBIN,j=(bi+1)%NBIN,rr=rp[bi]*(1-fr)+rp[j]*fr;
    d.ang=ang;d.bin=fr<0.5?bi:j;
    const tx=C.x+Math.cos(ang)*d.u0*rr,ty=C.y+Math.sin(ang)*d.u0*rr; d.tx=tx;d.ty=ty;
    d.vx+=(d.k*(tx-d.x)-d.c*d.vx)*dt; d.vy+=(d.k*(ty-d.y)-d.c*d.vy)*dt; d.x+=d.vx*dt; d.y+=d.vy*dt;
  }
}
function poke(p,str){
  const R0=LY.R0,C=LY.C,rad=R0*0.95;
  for(const d of D.dots){const dx=d.x-p.x,dy=d.y-p.y,dd=Math.sqrt(dx*dx+dy*dy)+0.01;if(dd<rad){const f=(1-dd/rad)*str*R0*9;d.vx+=dx/dd*f;d.vy+=dy/dd*f;}}
  const a=Math.atan2(p.y-C.y,p.x-C.x);
  for(let i=0;i<NBIN;i++){const dd=angD(a,i*TAU/NBIN)/0.4;D.wobV[i]-=2.4*str*Math.exp(-dd*dd);}
  S.poke(interp(D.th,a)); D.pokeE=1; G.stats.pokes++; if(G.stats.firstPokeT<0)G.stats.firstPokeT=performance.now();
  for(let i=0;i<5;i++){const aa=rnd()*TAU;fx(p.x,p.y,Math.cos(aa)*90,Math.sin(aa)*90,0.35,LY.ds*1.4,0,0.9,0,3);}
}
function toppingPos(t){const C=LY.C,rr=interp(D.rPx,t.ang)*t.u;return{x:C.x+Math.cos(t.ang)*rr,y:C.y+Math.sin(t.ang)*rr};}

/* containers / falling toppings */
function placeObjects(snap){
  const cf=G.cfg; cont.tomato.a=cf.tom; cont.corn.a=cf.corn; oven.a=cf.oven;
  for(const c of [cont.tomato,cont.corn]){const p=slotPos(c.a,LY.contR);c.tx=p.x;c.ty=p.y;c.d=p.d;if(snap){c.x=p.x;c.y=p.y;}}
  const p=slotPos(oven.a,LY.ovenR);oven.tx=p.x;oven.ty=p.y;oven.d=p.d;if(snap){oven.x=p.x;oven.y=p.y;}
}
function updateContainers(dt){
  const R0=LY.R0;
  for(const c of [cont.tomato,cont.corn]){
    c.x+=(c.tx-c.x)*Math.min(1,dt*4);c.y+=(c.ty-c.y)*Math.min(1,dt*4);
    c.wob=Math.max(0,c.wob-dt*2.5);
    const reach=realR(c.a)*R0>=c.d-0.5*R0;
    if(G.phase==='kitchen'&&D.state==='raw'&&reach&&c.stock>0){
      c.tilt=Math.min(1,c.tilt+dt*6); c.pourT-=dt;
      if(c.pourT<=0){spawnFall(c);c.pourT=c.kind==='tomato'?0.17:0.11;c.stock--;}
    } else {c.tilt=Math.max(0,c.tilt-dt*4);c.pourT=Math.min(c.pourT,0.04);}
  }
  oven.x+=(oven.tx-oven.x)*Math.min(1,dt*4);oven.y+=(oven.ty-oven.y)*Math.min(1,dt*4);
  oven.wob=Math.max(0,oven.wob-dt*2.5);
  oven.fire=lerp(oven.fire,D.state==='baking'?1:0.25,Math.min(1,dt*3));
  if(G.phase==='kitchen'&&D.state==='raw'&&realR(oven.a)*R0>=oven.d-0.62*R0) startBake();
}
function spawnFall(c){
  const ang=c.a+(rnd()-0.5)*0.24, maxR=realR(ang)*LY.R0;
  const dist=Math.min(c.d*(0.7+rnd()*0.22),maxR*0.93);
  D.falling.push({kind:c.kind,sx:c.x,sy:c.y-LY.contR*0.3,ang,dist,t:0,dur:0.3+rnd()*0.08});
}
function updateFalling(dt){
  const C=LY.C;
  for(let i=D.falling.length-1;i>=0;i--){
    const f=D.falling[i]; f.t+=dt/f.dur;
    if(f.t>=1){
      D.falling.splice(i,1);
      const rr=interp(D.rPx,f.ang); const lx=C.x+Math.cos(f.ang)*f.dist,ly=C.y+Math.sin(f.ang)*f.dist;
      if(f.dist<=rr*1.02&&G.phase==='kitchen'&&(D.state==='raw'||D.state==='baking')){
        D.tops.push({kind:f.kind,ang:f.ang,u:Math.min(0.97,f.dist/rr),uv:f.kind==='tomato'?-(0.35+rnd()*0.4):0,spin:rnd()*TAU,hop:f.kind==='corn'?1:0,slice:-1,st:'on',fromSlice:-1,fromMember:-1,gx:0,gy:0,hx:0,hy:0,ht:0,hdst:null});
        if(D.order.indexOf(f.kind)<0){D.order.push(f.kind);glog('first '+f.kind+' order='+D.order.join(','));for(const m of fam)m.wig=Math.max(m.wig,0.6);}
        D.caught[f.kind]++; G.stats.catches[f.kind]++;
        const th=interp(D.th,f.ang);
        if(f.kind==='tomato')S.landTom(th);else S.landCorn();
        for(let k=0;k<3;k++){const a=rnd()*TAU;fx(lx,ly,Math.cos(a)*50,Math.sin(a)*50,0.3,LY.ds*1.2,f.kind==='tomato'?1:0,0.8,0,4);}
      } else {
        S.miss(); for(let k=0;k<4;k++){fx(lx,ly,(rnd()-0.5)*80,-40-rnd()*40,0.6,LY.ds*1.8,f.kind==='tomato'?1:0,0.9,240,1);}
        (f.kind==='tomato'?cont.tomato:cont.corn).stock++;
      }
    }
  }
}
function updateToppings(dt){
  for(const t of D.tops){
    if(t.uv<0){t.u=Math.max(0.12,t.u+t.uv*dt);t.uv*=Math.exp(-3.2*dt);t.spin+=-t.uv*16*dt;if(t.uv>-0.01)t.uv=0;}
    if(t.hop>0)t.hop=Math.max(0,t.hop-dt*3);
    if(t.st==='hop'||t.st==='hopPlate'){
      t.ht+=dt/0.55;
      if(t.ht>=1){
        if(t.st==='hop'){t.st='on';t.ang=t.hdst.ang;t.u=t.hdst.u;t.slice=t.hdst.slice;S.knock(900);}
        else {t.st='gone';const m=t.hdst.m;learnSlice(m,{tom:t.kind==='tomato'?1:0,corn:t.kind==='corn'?1:0,puff:0,crisp:0},true);startDuet(t.hdst.from,m);}
      }
    }
  }
}

/* baking */
function startBake(){
  if(OP&&OP.type==='stretch') endOp();
  D.state='baking'; D.bakeT=0; D.ovenBin=binOf(oven.a); S.sizzle(); G.stats.bakes++; glog('bake start');
  for(const lb of D.lobes) lb.Lt=lb.L;
}
function updateBake(dt){
  D.bakeT+=dt; let all=true; const C=LY.C;
  for(let i=0;i<NBIN;i++){
    let dd=Math.abs(i-D.ovenBin); dd=Math.min(dd,NBIN-dd);
    if(D.bakeT*20>=dd){
      if(D.bake[i]<1&&rnd()<dt*6){const a=i*TAU/NBIN,rr=D.rPx[i]*(0.4+rnd()*0.6);fx(C.x+Math.cos(a)*rr,C.y+Math.sin(a)*rr,(rnd()-0.5)*20,-30-rnd()*30,0.5,LY.ds*1.5,1,0.9,-20,1);}
      D.bake[i]=Math.min(1,D.bake[i]+dt/0.55);
    }
    if(D.bake[i]<1)all=false; else if(!D.bakeEv[i]){D.bakeEv[i]=1;bakeEvent(i);}
  }
  if(all){
    D.state='baked'; D.frozen=true; G.bass=true; glog('baked puffBins='+D.puffT.reduce((a,b)=>a+(b>0?1:0),0)+' crispBins='+D.crisp.reduce((a,b)=>a+b,0));
    for(const m of fam) m.wig=Math.max(m.wig,0.8);
    S.chime();
  }
}
function bakeEvent(i){
  const th=D.th[i],C=LY.C,a=i*TAU/NBIN,rr=D.rPx[i];
  const now=G.time;
  if(th>1.25){
    D.puffT[i]=1; D.puffV[i]+=6;
    for(const d of D.dots){if(d.bin===i){d.vx+=Math.cos(a)*60;d.vy+=Math.sin(a)*60-90;}}
    if(now-G.lastPon>0.13){G.lastPon=now;S.pon(th);G.stats.puffs++;glog('pon th='+th.toFixed(2));
      for(let k=0;k<6;k++){fx(C.x+Math.cos(a)*rr*0.8,C.y+Math.sin(a)*rr*0.8,(rnd()-0.5)*60,-60-rnd()*60,0.7,LY.ds*2.2,0,0.8,-10,2);}}
  } else if(th<0.65){
    D.crisp[i]=1;
    if(now-G.lastPari>0.1){G.lastPari=now;S.pari();G.stats.crisps++;glog('pari th='+th.toFixed(2));}
    for(let k=0;k<3;k++){fx(C.x+Math.cos(a)*rr*0.9,C.y+Math.sin(a)*rr*0.9,(rnd()-0.5)*120,(rnd()-0.5)*120,0.35,LY.ds*1.1,0,1,0,2);}
  } else if(now-G.lastSoft>0.25){G.lastSoft=now;tone('sine',600+rnd()*200,tn(),0.08,0.05,null,0.01);}
}

/* slices */
function sliceOf(a){
  const n=D.slices.length; if(!n) return -1;
  for(let k=0;k<n;k++){const s=D.slices[k];const d=angN(a-s.a0);if(d<s.span)return k;}
  return 0;
}
function rebuildSlices(){
  const cuts=D.cuts.slice().sort((a,b)=>a-b); D.cuts=cuts; const n=cuts.length; D.slices=[];
  for(let k=0;k<n;k++){const a0=cuts[k],a1=cuts[(k+1)%n];let span=angN(a1-a0);if(span<1e-3)span=TAU;
    D.slices.push({a0,span,bis:a0+span/2,state:'on',ox:0,oy:0,vx:0,vy:0,sc:1,sep:0,cx:0,cy:0,ext:1,gx:0,gy:0,ft:0,fx0:0,fy0:0,fs0:1,fxt:0,fyt:0,fst:1,m:null,eatT:0,ghx:0,ghy:0});}
  const C=LY.C;
  for(const s of D.slices){s.cx=0;s.cy=0;s.cnt=0;}
  for(const d of D.dots){const k=sliceOf(d.ang);d.slice=k;const s=D.slices[k];s.cx+=d.tx;s.cy+=d.ty;s.cnt++;}
  for(const s of D.slices){if(s.cnt){s.cx/=s.cnt;s.cy/=s.cnt;}else{s.cx=C.x;s.cy=C.y;}s.ext=1;}
  for(const d of D.dots){const s=D.slices[d.slice];const e=hyp(d.tx-s.cx,d.ty-s.cy);if(e>s.ext)s.ext=e;}
  for(const t of D.tops){if(t.st==='on')t.slice=sliceOf(t.ang);}
  for(let i=0;i<NBIN;i++)D.binSlice[i]=sliceOf(i*TAU/NBIN);
}
function doCut(phi){
  let added=false;
  for(const c of [angN(phi),angN(phi+PI)]){if(D.cuts.every(x=>Math.abs(angD(x,c))>0.32)){D.cuts.push(c);added=true;}}
  if(!added) return false;
  rebuildSlices(); S.cut(); G.stats.cuts++; glog('cut slices='+D.slices.length);
  const C=LY.C,rr=Math.max(...D.rPx);
  for(let k=-6;k<=6;k++){const x=C.x+Math.cos(phi)*rr*k/6,y=C.y+Math.sin(phi)*rr*k/6;fx(x,y,(rnd()-0.5)*40,(rnd()-0.5)*40,0.45,LY.ds*1.3,0,1,0,2);}
  return true;
}
function sliceComp(k){
  const r={tom:0,corn:0,puff:0,crisp:0};
  for(const t of D.tops){if(t.slice===k&&t.st==='on'){if(t.kind==='tomato')r.tom++;else r.corn++;}}
  for(let i=0;i<NBIN;i++){if(D.binSlice[i]===k){if(D.puffT[i]>0)r.puff++;if(D.crisp[i])r.crisp++;}}
  return r;
}
function sliceXY(s,x,y,out){
  out.x=s.cx+(x-s.cx)*s.sc+s.ox+s.ghx; out.y=s.cy+(y-s.cy)*s.sc+s.oy+s.ghy;
}
function plateOf(m){return LY.plates[m.seat];}
function updateSlices(dt){
  const ds=LY.ds;
  for(let k=0;k<D.slices.length;k++){
    const s=D.slices[k];
    s.ghx*=Math.exp(-dt*8);s.ghy*=Math.exp(-dt*8);
    const bx=Math.cos(s.bis),by=Math.sin(s.bis);
    if(s.state==='on'||s.state==='back'){
      s.sep=lerp(s.sep,ds*5,Math.min(1,dt*8));
      let hop=0; const tg=G.target; if(tg&&tg.kind==='slice'&&tg.s===s&&!G.demo){const b=(G.time*1.5)%1;hop=b<0.4?Math.sin(b/0.4*PI)*ds*9:0;}
      const tx=bx*(s.sep+hop),ty=by*(s.sep+hop);
      s.vx+=((tx-s.ox)*220-s.vx*18)*dt;s.vy+=((ty-s.oy)*220-s.vy*18)*dt;s.ox+=s.vx*dt;s.oy+=s.vy*dt;s.sc=lerp(s.sc,1,Math.min(1,dt*10));
      if(s.state==='back'&&hyp(s.ox-tx,s.oy-ty)<2)s.state='on';
    } else if(s.state==='carry'){
      s.ox+=(s.gx-s.ox)*Math.min(1,dt*26);s.oy+=(s.gy-s.oy)*Math.min(1,dt*26);s.sc=lerp(s.sc,1.06,Math.min(1,dt*10));
    } else if(s.state==='fly'){
      s.ft+=dt/0.45; const e=easeOut(s.ft);
      s.ox=lerp(s.fx0,s.fxt,e);s.oy=lerp(s.fy0,s.fyt,e)-Math.sin(e*PI)*LY.R0*0.6;s.sc=lerp(s.fs0,s.fst,e);
      if(s.ft>=1){s.state='plate';s.m.queue.push(k);S.chime();G.stats.served++;glog('served slice'+k+' to '+s.m.k.id);
        const pl=plateOf(s.m);for(let i=0;i<8;i++){const a=i/8*TAU;fx(pl.x,pl.y,Math.cos(a)*90,Math.sin(a)*60,0.5,ds*1.6,0,1,0,3);}
        // rare edge bounce onto the neighbour's plate (when nothing left on the board)
        if(!D.slices.some(o=>o.state==='on')&&(rnd()<0.14||API.forceBounce)) bounceToPlate(k);
      }
    } else if(s.state==='plate'){
      const pl=plateOf(s.m); s.ox=pl.x-s.cx; s.oy=pl.y-s.cy-LY.plateR*0.1;
    }
  }
}
function startCarry(k,p){
  const s=D.slices[k]; s.state='carry'; s.grab={x:p.x-s.ox,y:p.y-s.oy}; s.gx=s.ox; s.gy=s.oy; S.pick();
  OP={type:'carry',k,hist:[[p.x,p.y,performance.now()]]};
  // rare: a topping on the cut edge hops to the neighbouring slice
  const on=D.slices.map((o,i)=>o.state==='on'?i:-1).filter(i=>i>=0);
  if(on.length&&(rnd()<0.14||API.forceBounce)){
    const mine=D.tops.filter(t=>t.slice===k&&t.st==='on');
    if(mine.length){
      let best=null,bd=9,dst=-1,dang=0;
      for(const t of mine){for(const j of on){const o=D.slices[j];for(const edge of [o.a0,o.a0+o.span]){const dd=Math.abs(angD(t.ang,edge));if(dd<bd){bd=dd;best=t;dst=j;dang=edge;}}}}
      if(best){
        const from=toppingPos(best); const o=D.slices[dst];
        const inside=angN(dang-o.a0)<0.01?dang+0.14:dang-0.14;
        best.st='hop';best.ht=0;best.hx=from.x+s.ox;best.hy=from.y+s.oy;best.fromSlice=k;
        best.hdst={ang:inside,u:0.7,slice:dst};S.hop();G.stats.bounces++;glog('edge bounce slice'+k+'->'+dst);
      }
    }
  }
}
function bounceToPlate(k){
  const s=D.slices[k]; const A=s.m;
  const mine=D.tops.filter(t=>t.slice===k&&t.st==='on'); if(!mine.length) return;
  const nb=fam.filter(m=>m!==A).sort((a,b)=>Math.abs(a.seat-A.seat)-Math.abs(b.seat-A.seat))[0];
  const t=mine[0]; const p=toppingPos(t); const q={x:0,y:0}; sliceXY(s,p.x,p.y,q);
  t.st='hopPlate';t.ht=0;t.hx=q.x;t.hy=q.y;t.hdst={m:nb,from:A};S.hop();G.stats.bounces++;glog('edge bounce plate '+A.k.id+'->'+nb.k.id);
}
function choosePlate(p,vx,vy){
  let best=null,bd=1e9;
  for(const m of fam){const pl=plateOf(m);const d=hyp(p.x-pl.x,p.y-pl.y);if(d<bd){bd=d;best=m;}}
  if(bd<LY.plateR*2.8) return best;
  const sp=hyp(vx,vy);
  if(sp>0.3){let ba=0.75,bm=null;for(const m of fam){const pl=plateOf(m);const a=Math.abs(angD(Math.atan2(vy,vx),Math.atan2(pl.y-p.y,pl.x-p.x)));if(a<ba){ba=a;bm=m;}}if(bm)return bm;}
  const rr=D.rPx.reduce((a,b)=>a+b,0)/NBIN;
  if(p.y>LY.C.y+rr*0.9){let bx2=1e9,bm=null;for(const m of fam){const d=Math.abs(plateOf(m).x-p.x);if(d<bx2){bx2=d;bm=m;}}return bm;}
  return null;
}
function sendSlice(k,m){
  const s=D.slices[k]; s.state='fly'; s.m=m; s.ft=0; s.fx0=s.ox; s.fy0=s.oy; s.fs0=s.sc;
  const pl=plateOf(m); s.fst=Math.min(1,LY.plateR*1.15/Math.max(10,s.ext)); s.fxt=pl.x-s.cx; s.fyt=pl.y-s.cy-LY.plateR*0.1; S.whoosh();
}

