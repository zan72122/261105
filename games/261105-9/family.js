'use strict';
/* ---------------- family ---------------- */
function famTarget(m){
  const ph=G.phase;
  if(ph==='cloth'||ph==='toCloth'){
    if(m.i===0) return {x:LY.grandTop.x,y:LY.grandTop.y};
    const kd=CL.kids.find(k=>k.m===m); if(kd){const p=clothRest(kd.gx,kd.gy);return {x:p.x,y:p.y};}
  }
  return LY.seats[m.seat];
}
function hrOf(m){return LY.hr*m.k.scale*(G.phase==='cloth'||G.phase==='toCloth'?(m.i===0?1.05:0.9):1);}
function learnSlice(m,comp,small){
  const ph=m.phrase,du=m.pdur,reg=m.k.reg;
  const put=(st,note,dur)=>{for(let k=0;k<3;k++){const s=(st+k)%16;if(ph[s]<0){ph[s]=note;du[s]=dur;return;}}ph[st]=note;du[st]=dur;};
  if(comp.tom>0){const steps=m.i%2?[0,4,8,12]:[0,6,8,14],mel=[0,2,1,3];const n=Math.min(4,Math.ceil(comp.tom/2));for(let k=0;k<n;k++)put(steps[k],reg+mel[k],2);}
  if(comp.corn>0){const steps=[2,10,6,14],mel=[5,7,6,8];const n=Math.min(4,Math.ceil(comp.corn/3));for(let k=0;k<n;k++)put(steps[k],reg+mel[k],1);}
  if(comp.puff>0)put(0,reg+4,4);
  if(comp.crisp>0){put(13,reg+6,1);put(15,reg+7,1);}
  if(!comp.tom&&!comp.corn&&!comp.puff&&!comp.crisp){put(0,reg+2,2);put(8,reg+1,2);put(12,reg+3,2);}
  let cnt=0;for(let i=0;i<16;i++)if(ph[i]>=0)cnt++;
  while(cnt>12){const i=(rnd()*16)|0;if(ph[i]>=0&&i%4){ph[i]=-1;cnt--;}}
  m.ate.tom+=comp.tom;m.ate.corn+=comp.corn;m.ate.puff+=comp.puff;m.ate.crisp+=comp.crisp;
  const sc=[['bounce',comp.tom],['sway',comp.corn],['jump',comp.puff*1.5],['shimmy',comp.crisp*1.5]].sort((a,b)=>b[1]-a[1]);
  m.dance=sc[0][1]>0?sc[0][0]:'nod';
  m.hasSong=true; m.glow=1; m.danceAmt=1; m.loudUntil=aNow()+BAR*2; m.served++;
  if(!small){const hr=hrOf(m);for(let i=0;i<10;i++){const a=-PI/2+(rnd()-0.5)*1.6;fx(m.x,m.y-hr,Math.cos(a)*80,Math.sin(a)*80,0.9,LY.ds*1.6,0,1,-20,1);}}
  glog('sing '+m.k.id+' dance='+m.dance+' notes='+cnt+' comp='+JSON.stringify(comp));
}
function startDuet(A,B){
  if(!A||!B||A===B) return;
  const until=aNow()+BAR*2;
  A.duet=B.i;A.duetUntil=until;B.duet=A.i;B.duetUntil=until;A.loudUntil=Math.max(A.loudUntil,until);B.loudUntil=Math.max(B.loudUntil,until);
  A.danceAmt=B.danceAmt=1; A.glow=B.glow=1; G.stats.duets++; glog('duet '+A.k.id+'+'+B.k.id); S.reveal();
}
function updateFamily(dt){
  for(const m of fam){
    const p=famTarget(m); const sp=G.phase==='kitchen'?5:3.2;
    m.x+=(p.x-m.x)*Math.min(1,dt*sp); m.y+=(p.y-m.y)*Math.min(1,dt*sp);
    m.glow=Math.max(0,m.glow-dt*0.35); m.danceAmt=Math.max(0,m.danceAmt-dt*0.12); m.wig=Math.max(0,m.wig-dt*2.2); m.pop=Math.max(0,m.pop-dt*2);
    m.blink-=dt; if(m.blink<-0.13) m.blink=2+rnd()*3.5;
    m.beckon=lerp(m.beckon,(G.target&&G.target.kind==='slice'&&G.target.m===m)?1:0,Math.min(1,dt*5));
    if(m.eating===null&&m.queue.length){const k=m.queue.shift();m.eating=k;m.eatT=0;D.slices[k].state='eating';}
    if(m.eating!==null){
      const s=D.slices[m.eating]; const prev=m.eatT; m.eatT+=dt/1.2;
      for(const tt of [0.2,0.5,0.8]) if(prev<tt&&m.eatT>=tt) S.munch();
      if(m.eatT>=1){
        const comp=sliceComp(m.eating); s.state='eaten';
        let partner=null;
        for(const t of D.tops){
          if(t.slice===m.eating&&t.st==='on'){ if(t.fromMember>=0&&t.fromMember!==m.i) partner=fam[t.fromMember]; t.st='gone'; }
          if(t.fromSlice===m.eating&&t.st!=='gone') t.fromMember=m.i;
        }
        learnSlice(m,comp,false); m.eating=null;
        if(partner) startDuet(partner,m);
      }
    }
    if(m.lp&&AC){const want=m.muffle?650:6000;m.lp.frequency.setTargetAtTime(want,AC.currentTime,0.1);}
  }
}

/* ---------------- music scheduler ---------------- */
const BELL_MEL=[[0,2,3,2],[4,3,2,0],[4,5,4,3],[3,1,3,6]];
const ROOTS=[0,9,5,7];
function boardCounts(){
  let tom=0,corn=0,puff=0,crisp=0;
  for(const t of D.tops){if(t.st!=='on')continue;const s=t.slice>=0?D.slices[t.slice]:null;if(!s||s.state==='on'||s.state==='carry'||s.state==='back'){if(t.kind==='tomato')tom++;else corn++;}}
  for(let i=0;i<NBIN;i++){if(!D.bakeEv[i])continue;const k=D.binSlice[i];const s=k>=0&&D.slices.length?D.slices[k]:null;if(!s||s.state==='on'||s.state==='carry'||s.state==='back'){if(D.puffT[i]>0)puff++;if(D.crisp[i])crisp++;}}
  return{tom,corn,puff,crisp};
}
let BCNT={tom:0,corn:0,puff:0,crisp:0};
function playStep(i,t){
  const s=i%16,bar=Math.floor(i/16),root=ROOTS[bar%4];const B=BCNT;
  if(G.bass){if(s===0||s===8)mBass(t,65.41*Math.pow(2,root/12));if(s===12&&bar%2)mBass(t,65.41*Math.pow(2,(root+7)/12));}
  const tomFirst=D.order[0]!=='corn';
  if(B.tom>0){
    const pat=tomFirst?[0,4,8,12]:[0,3,6,8,11,14];
    const v=0.35+0.45*Math.min(1,B.tom/8);
    if(pat.indexOf(s)>=0){mTom(t,v,s===0);PUL.tom.n=t;}
    else if(B.tom>=8&&tomFirst&&(s===14||s===15)){mTom(t,v*0.4,false);}
  }
  if(B.corn>0){
    const v=0.07+0.07*Math.min(1,B.corn/10);
    if(!tomFirst){const steps=[0,4,8,12],j=steps.indexOf(s);if(j>=0){mBell(t,pf(BELL_MEL[bar%4][j],523.25),v);PUL.bell.n=t;}}
    else{const steps=[2,6,10,14],j=steps.indexOf(s);if(j>=0){mBell(t,pf(2+((j+bar)%4),523.25),v*0.9);PUL.bell.n=t;}else if(B.corn>=10&&s===15){mBell(t,pf(6,523.25),v*0.6);}}
  }
  if(B.puff>0&&(s===0||s===10)){mPon(t);PUL.pon.n=t;}
  if(B.crisp>0&&s%2===1){mShake(t,0.6+0.4*Math.min(1,B.crisp/8));PUL.shake.n=t;}
  for(const m of fam){
    if(!m.hasSong) continue;
    const loud=t<m.loudUntil;
    const n=m.phrase[s];
    if(n>=0) mVoice(m,pf(n,m.k.base),t,STEP*m.pdur[s]*0.95,loud);
    if(m.duet>=0&&t<m.duetUntil){const pn=fam[m.duet].phrase[s];if(pn>=0&&n<0)mVoice(m,pf(pn+2,m.k.base),t,STEP*fam[m.duet].pdur[s]*0.9,true);}
  }
  // giggles mixed into the song
  if(s===14&&bar%2===1){for(const m of fam){if(m.i===0)continue;const kd=CL.kids.find(k=>k.m===m);
    if(G.phase==='cloth'&&kd&&!kd.found&&kd===CL.kids.find(k=>!k.found)) mGiggle(m,t,0.45);
    else if(t<G.laughUntil&&kd&&kd.found) mGiggle(m,t,0.7);}}
  if(fam.every(m=>m.hasSong)&&(s===4||s===12)){mClap(t);PUL.clap.n=t;}
}
function schedule(){
  if(!aOK()) return;
  const now=AC.currentTime;
  if(nextStep<now-0.05){const skip=Math.ceil((now+0.03-nextStep)/STEP);nextStep+=skip*STEP;stepIdx+=skip;}
  while(nextStep<now+0.12){playStep(stepIdx,nextStep);nextStep+=STEP;stepIdx++;}
  for(const k in PUL){const p=PUL[k];if(p.n<=now&&p.n>p.l)p.l=p.n;}
}

