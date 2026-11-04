'use strict';
/* ---------------- drawing ---------------- */
const TMP={x:0,y:0};
function drawTable(){
  const tg=G.target; const edge=tg&&tg.kind==='nub'&&tg.dk==='edge';
  for(const t of TABLE){let a=0.22;if(edge){const d=hyp(t.x-tg.dest.x,t.y-tg.dest.y);if(d<LY.R0*2.2)a+=0.5*(1-d/(LY.R0*2.2))*(0.5+0.5*Math.sin(G.time*5+t.p));}dot(t.x,t.y,LY.ds*1.2*t.s,0,a);}
}
let TABLE=[];
function buildTable(){const T=LY.table;TABLE=[];const area=(T.r-T.l)*(T.b-T.t);const n=clamp(Math.round(area/2800),60,170);const r2=mulberry(77);
  for(let i=0;i<n;i++){const x=T.l+r2()*(T.r-T.l),y=T.t+r2()*(T.b-T.t);const ex=Math.min(x-T.l,T.r-x,y-T.t,T.b-y);TABLE.push({x,y,s:0.7+r2()*0.6,p:r2()*TAU,e:ex});}
  for(let i=0;i<70;i++){const k=i/70;let x,y;const per=k*4;if(per<1){x=T.l+per*(T.r-T.l);y=T.t;}else if(per<2){x=T.r;y=T.t+(per-1)*(T.b-T.t);}else if(per<3){x=T.r-(per-2)*(T.r-T.l);y=T.b;}else{x=T.l;y=T.b-(per-3)*(T.b-T.t);}
    TABLE.push({x:x+(r2()-0.5)*8,y:y+(r2()-0.5)*8,s:0.9+r2()*0.4,p:r2()*TAU});}
}
function drawPlates(){
  const tg=G.target;
  for(let i=0;i<4;i++){const p=LY.plates[i],r=LY.plateR;let beck=0;if(tg&&tg.kind==='slice'&&plateOf(tg.m)===p)beck=0.5+0.5*Math.sin(G.time*6);
    for(const q of TPL.plateRing)dot(p.x+q.x*r,p.y+q.y*r,LY.ds*1.5*q.s,0,0.7+0.3*beck);
    for(const q of TPL.plateIn)dot(p.x+q.x*r,p.y+q.y*r,LY.ds*1.2*q.s,0,0.32);}
}
function destPulse(o){const tg=G.target;return(tg&&tg.kind==='nub'&&tg.dest===o)?(0.5+0.5*Math.sin(G.time*5)):0;}
function drawOven(){
  const r=LY.ovenR,ds=LY.ds,pu=destPulse(oven),wb=Math.sin(G.time*35)*oven.wob*0.08;
  const sc=1+pu*0.08; const cx=oven.x,cy=oven.y-r*0.1-pu*r*0.08;
  for(const p of TPL.ovenDome){const x=p.x*r*sc,y=p.y*r*sc;dot(cx+x*Math.cos(wb)-y*Math.sin(wb),cy+x*Math.sin(wb)+y*Math.cos(wb),ds*1.45*p.s,0,0.7+0.15*(-p.y));}
  for(let i=0;i<9;i++)dot(cx+(i/8-0.5)*r*2.1,cy+r*0.58,ds*1.6,0,0.8);
  const n=Math.round(8+18*oven.fire);
  for(let i=0;i<n&&i<TPL.ovenFire.length;i++){const p=TPL.ovenFire[i];const fl=0.5+0.5*Math.sin(G.time*(9+p.s*7)+p.p);dot(cx+p.x*r*sc,cy+(p.y-fl*0.12)*r*sc,ds*(1.2+1.3*fl*oven.fire+0.4*pu)*p.s,1,0.5+0.5*fl);}
}
function drawCont(c){
  const r=LY.contR,ds=LY.ds,pu=destPulse(c);
  const tilt=-Math.sign(Math.cos(c.a))*(Math.abs(Math.cos(c.a))>0.3?1:0)*0.5*c.tilt+Math.sin(G.time*32)*(c.wob*0.15+c.tilt*0.05);
  const bob=-pu*r*0.25*Math.abs(Math.sin(G.time*5)); const cs=Math.cos(tilt),sn=Math.sin(tilt);
  const cx=c.x,cy=c.y+bob,sc=1+pu*0.1;
  for(const p of TPL.bowl){const x=p.x*r*sc,y=p.y*r*sc;dot(cx+x*cs-y*sn,cy+x*sn+y*cs,ds*1.4*p.s,0,0.72+0.2*p.y);}
  const n=c.kind==='tomato'?Math.ceil(c.stock/c.max*7):Math.ceil(c.stock/c.max*10);
  for(let i=0;i<n&&i<TPL.mound.length;i++){const q=TPL.mound[i];const x=q.x*r*sc,y=q.y*r*sc;const px=cx+x*cs-y*sn,py=cy+x*sn+y*cs;
    if(c.kind==='tomato')drawTomato(px,py,ds*0.95,i*1.3,0,1);else drawCorn(px,py,ds*0.95,0,1);}
}
function drawTomato(x,y,s,spin,pl,a){dot(x,y,2.3*s*(1+pl*0.35),1,a);for(let k=0;k<6;k++){const an=spin+k*TAU/6;dot(x+Math.cos(an)*3.3*s,y+Math.sin(an)*3.3*s,1.6*s,1,a*0.92);}}
function drawCorn(x,y,s,tw,a){dot(x-1.7*s,y+1*s,2*s,0,a);dot(x+1.7*s,y+1*s,2*s,0,a);dot(x,y-1.7*s,2*s,0,a);if(tw>0.05){for(let k=0;k<4;k++){const an=k*TAU/4+0.4;dot(x+Math.cos(an)*6*s,y+Math.sin(an)*6*s,1*s,0,tw);}}}
function drawDough(){
  const ds=LY.ds,dots=D.dots,tg=G.target; const pz=tg&&tg.kind==='pizza'&&!G.demo?(0.5+0.5*Math.sin(G.time*4)):0;
  const pPon=pulse('pon'),pSh=pulse('shake');
  for(let n=0;n<dots.length;n++){
    const d=dots[n]; let x=d.x,y=d.y; const bi=d.bin; const th=D.th[bi],bk=D.bake[bi],pfv=D.puff[bi];
    let a=lerp(0.6+0.2*(th-1),1,bk), r=ds*(1.0+0.42*th)*d.sz*(1+0.3*Math.max(0,pfv))*(1+0.15*bk);
    if(bk>0&&bk<1) a*=0.75+0.25*Math.sin(G.time*30+d.ph);
    if(D.crisp[bi]&&bk>=1){a*=0.7+0.3*Math.sin(G.time*6+d.ph*3)+0.35*pSh;r*=0.85;}
    if(pfv>0.3) r*=1+0.25*pPon;
    if(pz) a=Math.min(1,a+0.25*pz*(d.u0>0.8?1:0.3));
    if(D.nubE>0.02&&d.u0>0.55){const q=Math.abs(angD(d.ang,D.nubA));if(q<0.4){const k=(1-q/0.4)*Math.min(1,D.nubE*5);a=Math.min(1,a+0.4*k);r*=1+0.35*k;}}
    if(d.slice>=0&&D.slices.length){
      const s=D.slices[d.slice]; if(s.state==='eaten') continue;
      sliceXY(s,x,y,TMP); x=TMP.x;y=TMP.y; r*=Math.max(0.7,s.sc);
      if(s.state==='eating'){const m=s.m,hr=hrOf(m);const k=(n*0.618)%1;const l=clamp((m.eatT-k*0.55)/0.45,0,1);if(l>=1)continue;x=lerp(x,m.x,ease(l));y=lerp(y,m.y+hr*0.45,ease(l));a*=1-l;}
    }
    dot(x,y,r,0,a);
  }
}
function drawToppings(){
  const ds=LY.ds,pT=pulse('tom'),pB=pulse('bell');
  for(const t of D.tops){
    if(t.st==='gone') continue;
    let x,y,a=1;
    if(t.st==='hop'||t.st==='hopPlate'){
      let tx,ty; if(t.st==='hop'){const s=D.slices[t.hdst.slice];const C=LY.C;const rr=interp(D.rPx,t.hdst.ang)*t.hdst.u;sliceXY(s,C.x+Math.cos(t.hdst.ang)*rr,C.y+Math.sin(t.hdst.ang)*rr,TMP);tx=TMP.x;ty=TMP.y;}
      else{const pl=plateOf(t.hdst.m);tx=pl.x;ty=pl.y;}
      const e=ease(t.ht); x=lerp(t.hx,tx,e); y=lerp(t.hy,ty,e)-Math.sin(e*PI)*LY.R0*0.8;
      if(rnd()<0.5)fx(x,y,0,0,0.4,ds*1.3,0,1,0,0);
    } else {
      const p=toppingPos(t); x=p.x;y=p.y;
      if(t.slice>=0&&D.slices.length){const s=D.slices[t.slice];if(s.state==='eaten')continue;sliceXY(s,x,y,TMP);x=TMP.x;y=TMP.y;
        if(s.state==='eating'){const m=s.m;const l=clamp((m.eatT-0.2)/0.5,0,1);x=lerp(x,m.x,ease(l));y=lerp(y,m.y+hrOf(m)*0.45,ease(l));a=1-l;if(l>=1)continue;}}
      if(t.hop>0) y-=Math.sin(t.hop*PI)*ds*8;
    }
    if(t.kind==='tomato'){const j=pT*ds*3;drawTomato(x,y-j,ds,t.spin,pT,a);}
    else drawCorn(x,y,ds,pB*0.9,a);
  }
  for(const f of D.falling){const e=f.t;const C=LY.C;const lx=C.x+Math.cos(f.ang)*f.dist,ly=C.y+Math.sin(f.ang)*f.dist;
    const x=lerp(f.sx,lx,e),y=lerp(f.sy,ly,e)-Math.sin(e*PI)*LY.R0*0.5;const s=ds*(1+0.4*Math.sin(e*PI));
    if(f.kind==='tomato')drawTomato(x,y,s,e*6,0,1);else drawCorn(x,y,s,0,1);}
}
function drawMember(m,x,y,hr,o){
  const T=m.tpl,a=o.alpha,ds=hr*0.058;
  const ct=Math.cos(o.tilt),st=Math.sin(o.tilt);
  // body + arms
  for(const p of T.body){dot(x+p.x*hr,y+p.y*hr,ds*1.05*p.s,0,a*0.6);}
  if(o.body!==false){
    for(const sd of [-1,1]){const ang=sd<0?o.armL:o.armR;const sx=x+sd*0.72*hr,sy=y+1.35*hr;
      for(let i=1;i<=6;i++){const l=i/6*1.15*hr;dot(sx+sd*Math.sin(ang)*l,sy+Math.cos(ang)*l,ds*1.2,0,a*0.8);}}
  }
  const gx=o.gx,gy=o.gy; const hx=x+gx*hr*0.08,hy=y+gy*hr*0.05;
  const blink=m.blink<0; const grand=m.i===0; const open=o.open;
  for(const p of T.head){
    const ux=p.x,uy=p.y;
    let skip=false;
    for(const ex of [-0.36,0.36]){const dx=ux-ex,dy=uy+0.04;
      if(grand){ if(Math.abs(dx)<0.2&&Math.abs(dy-(0.05-dx*dx*2.2))<0.07){skip=true;break;} }
      else if(blink){ if(Math.abs(dx)<0.18&&Math.abs(dy)<0.05){skip=true;break;} }
      else if(dx*dx+dy*dy<0.17*0.17){skip=true;break;}}
    if(!skip){
      if(open>0.08){const mx=ux,my=uy-0.45;if((mx*mx)/(0.22*0.22)+(my*my)/Math.pow(0.06+0.16*open,2)<1)skip=true;}
      else {if(Math.abs(ux)<0.34){const yy=0.36+0.13*(1-(ux/0.34)*(ux/0.34));if(Math.abs(uy-yy)<0.055)skip=true;}}
    }
    if(skip) continue;
    const shade=0.78+0.22*(-0.5*ux-0.6*uy);
    const rx=ux*hr,ry=uy*hr; dot(hx+rx*ct-ry*st,hy+rx*st+ry*ct,ds*p.s*(0.95+0.2*shade),0,a*0.86*shade);
  }
  for(const p of T.hair){const rx=p.x*hr,ry=p.y*hr;dot(hx+rx*ct-ry*st,hy+rx*st+ry*ct,ds*1.12*p.s,0,a*0.92);}
  if(!grand&&!blink){for(const ex of [-0.36,0.36]){const rx=(ex+gx*0.07)*hr,ry=(-0.04+gy*0.06)*hr;dot(hx+rx*ct-ry*st,hy+rx*st+ry*ct,ds*1.9,0,a);}}
  if(o.cheek>0){for(const ex of [-0.58,0.58]){for(let k=0;k<5;k++){const an=k*1.26+0.3;const rx=(ex+Math.cos(an)*0.1)*hr,ry=(0.26+Math.sin(an)*0.07)*hr;dot(hx+rx*ct-ry*st,hy+rx*st+ry*ct,ds*(1.1+0.6*o.glow),1,a*o.cheek);}}}
  if(o.eat&&open>0.2&&o.cheek>0){dot(hx,hy+hr*0.47,ds*1.5,1,a*0.8);}
}
function drawFamily(list){
  const sp=stepPos(), bp=sp/4; const cloth=G.phase==='cloth'||G.phase==='toCloth';
  const now=aNow(); const cheekOK=1-G.clothMix;
  for(const m of list){
    if(m.alpha<=0.02) continue;
    const hr=hrOf(m); let x=m.x,y=m.y,dx=0,dy=0,tilt=0,armL=0.25,armR=0.25;
    const A=Math.max(m.danceAmt,m.hasSong?0.22:0)*(cloth&&m.muffle?0.3:1);
    switch(m.dance){
      case 'bounce':{const s=Math.abs(Math.sin(bp*PI));dy=-s*hr*0.28*A;armL=armR=0.3+1.1*A*s;break;}
      case 'sway':{const s=Math.sin(bp*PI*0.5);dx=s*hr*0.32*A;tilt=s*0.25*A;armL=0.4+1.4*A*Math.max(0,s);armR=0.4+1.4*A*Math.max(0,-s);break;}
      case 'jump':{const ph=(bp%4)/4;const j=ph<0.2?Math.sin(ph/0.2*PI):0;dy=-j*hr*0.7*A;armL=armR=0.3+2.2*A*j;break;}
      case 'shimmy':{dx=Math.sin(G.time*28)*hr*0.07*A;tilt=Math.sin(bp*PI)*0.16*A;armL=armR=0.6+0.6*A*Math.abs(Math.sin(G.time*14));break;}
      default:{dy=Math.sin(bp*PI*2)*hr*0.05*A;tilt=Math.sin(bp*PI)*0.08*A;}
    }
    if(m.duet>=0&&now<m.duetUntil){const pm=fam[m.duet];tilt+=Math.sign(pm.x-m.x)*0.2;}
    if(fam.every(q=>q.hasSong)&&pulse('clap')>0.3){armL=armR=1.3;}
    dx+=Math.sin(G.time*40)*m.wig*hr*0.09; dy-=m.wig*hr*0.1*Math.abs(Math.sin(G.time*12));
    dy-=G.wake*hr*0.15*Math.abs(Math.sin(G.time*10));
    if(m.beckon>0.05){armL=lerp(armL,1.9+0.4*Math.sin(G.time*8),m.beckon);armR=lerp(armR,1.9+0.4*Math.sin(G.time*8+1),m.beckon);}
    let open=0; for(let i=0;i<m.notes.length;i+=2){if(now>=m.notes[i]&&now<=m.notes[i+1]){open=Math.max(open,now<m.loudUntil?0.9:0.45);}}
    if(m.beckon>0.3) open=Math.max(open,0.6*m.beckon);
    let eat=false; if(m.eating!==null){eat=true;open=0.3+0.5*Math.abs(Math.sin(G.time*14));dy+=hr*0.12;}
    if(m.pop>0){dy-=Math.sin(m.pop*PI)*hr*0.5;}
    const gp=gazePoint(m); let gx=gp.x-(x+dx),gy=gp.y-(y+dy);const gl=hyp(gx,gy)+1e-3;gx/=gl;gy/=gl;
    const cheek=cheekOK*(0.22+0.78*m.glow);
    drawMember(m,x+dx,y+dy,hr,{alpha:m.alpha,tilt,armL,armR,gx,gy,open,glow:m.glow,cheek,eat});
    if(m.duet>=0&&now<m.duetUntil&&m.i<m.duet){const pm=fam[m.duet];for(let k=0;k<6;k++){const t=(k/6+G.time*0.5)%1;const xx=lerp(m.x,pm.x,t),yy=lerp(m.y,pm.y,t)-Math.sin(t*PI)*hr*2.2;dot(xx,yy,LY.ds*1.8,0,0.9*Math.sin(t*PI));}}
  }
}
function drawHand(){
  const dm=G.demo; if(!dm||!dm.hand) return;
  const s=clamp(LY.ds,0.9,1.6)*1.05,h=dm.hand,a=dm.al*0.95;
  for(const p of TPL.hand){dot(h.x+p.x*s,h.y+p.y*s+(dm.press?0:-4),LY.ds*1.45*p.s,0,a);}
  if(dm.press>0){for(let k=0;k<8;k++){const an=k/8*TAU+G.time*2;dot(h.x+Math.cos(an)*10*s,h.y+Math.sin(an)*10*s,LY.ds*1.1,0,a*0.6*dm.press);}}
}
function drawCloth(t){
  const ds=LY.ds,c=LY.cloth; const tg=G.target;
  const kidsFound=CL.kids.filter(k=>k.found);
  for(let i=0;i<CL.dots.length;i++){
    const d=CL.dots[i]; clothPos(d.gx,d.gy,TMP); let x=TMP.x,y=TMP.y,lift=TMP.lift;
    for(const kd of CL.kids){if(kd.found)continue;const dx=d.gx-kd.gx,dy=(d.gy-kd.gy)*c.h/c.w;const q=dx*dx+dy*dy;if(q<0.012){const b=1-q/0.012;y-=b*ds*(6+4*Math.sin(G.time*(kd.emptyHint>0?20:3)+kd.corner));lift=Math.max(lift,b*0.55);}}
    if(t<1){const e=ease(clamp(t*1.25-d.stg*0.25,0,1));x=lerp(d.sx,x,e);y=lerp(d.sy,y,e);}
    let skip=false; for(const kd of kidsFound){const m=kd.m;const hr=hrOf(m);if(hyp(x-m.x,y-(m.y-hr*0.15))<hr*1.15){skip=true;break;}}
    if(skip) continue;
    const edge=Math.min(d.gx,1-d.gx,d.gy,1-d.gy);
    let a=0.72+0.2*lift+(edge<0.04?0.15:0); a*=1-0.5*lift*lift;
    if(tg&&tg.kind==='corner'&&!G.demo){const cn=CL.corners[tg.corner];const q=Math.abs(d.gx-cn.gx)+Math.abs(d.gy-cn.gy);if(q<0.16)a+=0.35*(1-q/0.16)*(0.5+0.5*Math.sin(G.time*6));}
    const e2=t<1?ease(clamp(t*1.25-d.stg*0.25,0,1)):1;
    dot(x,y,ds*(1.75+0.7*lift)*d.sz,e2<0.55?0:1,a);
  }
  for(const p of CL.polka){clothPos(p.gx,p.gy,TMP);let x=TMP.x,y=TMP.y;if(t<1){const e=ease(t);x=lerp(p.sx,x,e);y=lerp(p.sy,y,e);}
    for(let k=0;k<5;k++){const an=k*TAU/5;dot(x+Math.cos(an)*ds*2.6,y+Math.sin(an)*ds*2.6,ds*1.4,0,0.75);}}
}
function render(){
  dotCount=0;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle=BG; ctx.fillRect(0,0,W,H);
  const gm=G.goldF, cm=G.clothMix;
  colStr[0]=rgb(mix(mix(PCREAM,PGOLD,gm),PWHITE,cm));
  colStr[1]=rgb(mix(PRED,PGREEN,clamp(cm*2.5-0.2,0,1)));
  const ph=G.phase;
  if(ph==='kitchen'||ph==='toCloth'||ph==='fromCloth'){
    camCx=LY.C.x;camCy=LY.C.y;
    camS=ph==='toCloth'?1-0.5*ease(G.phaseT):ph==='fromCloth'?0.6+0.4*ease(G.phaseT):1;
    gA=G.kAlpha;
    drawTable(); drawPlates(); drawOven(); drawCont(cont.tomato); drawCont(cont.corn);
    if(ph!=='toCloth'){
      if(ph==='fromCloth'){camS=1;gA=1;}
      drawDough(); drawToppings();
    } else {
      gA=1;camS=1; drawCloth(G.phaseT);
    }
    camS=1;gA=1;
    drawFamily(fam);
    flush();
  } else if(ph==='cloth'){
    camS=1;gA=1;
    const hidden=[fam[0]]; for(const kd of CL.kids){if(!kd.found&&kd.reveal>0.12){kd.m.alpha=clamp((kd.reveal-0.12)/0.36,0,1)*0.9;hidden.push(kd.m);}}
    drawFamily([fam[0]]); flush();
    drawCloth(1); flush();
    for(const kd of CL.kids){if(kd.found){kd.m.alpha=1;}else{kd.m.alpha=clamp((kd.reveal-0.12)/0.36,0,1)*0.9;}}
    drawFamily(CL.kids.map(k=>k.m));
    for(const kd of CL.kids){if(kd.found){const m=kd.m,hr=hrOf(m);for(const sd of [-1,1]){for(let k=0;k<5;k++){const an=k*1.25;dot(m.x+sd*hr*1.05+Math.cos(an)*hr*0.18,m.y+hr*0.95+Math.sin(an)*hr*0.12+Math.sin(G.time*8+sd)*hr*0.05,LY.ds*1.4,0,0.8);}}}}
    flush();
  }
  drawFX(); drawHand(); flush();
  if(dotCount>maxDots)maxDots=dotCount;
  if(!(dotCount<=(PEAK[ph]||0)))PEAK[ph]=dotCount;
}

