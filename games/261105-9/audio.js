'use strict';
/* ---------------- audio ---------------- */
let AC=null,master=null,musicBus=null,sfxBus=null,noiseBuf=null,ST=null;
const BPM=96,STEP=60/BPM/4,BAR=STEP*16;
let nextStep=0,stepIdx=0;
const PENTA=[0,2,4,7,9];
function pf(idx,base){const o=Math.floor(idx/5),n=((idx%5)+5)%5;return base*Math.pow(2,(PENTA[n]+12*o)/12);}
function initAudio(){
  if(AC){ if(AC.state==='suspended'&&!document.hidden){AC.resume().catch(()=>{});} return; }
  const Ctor=window.AudioContext||window.webkitAudioContext; if(!Ctor) return;
  try{AC=new Ctor();}catch(e){AC=null;return;}
  try{
    master=AC.createGain(); master.gain.value=0.9;
    const comp=AC.createDynamicsCompressor(); comp.threshold.value=-14; comp.knee.value=10; comp.ratio.value=4; comp.attack.value=0.003; comp.release.value=0.2;
    master.connect(comp); comp.connect(AC.destination);
    musicBus=AC.createGain(); musicBus.gain.value=0.6; musicBus.connect(master);
    sfxBus=AC.createGain(); sfxBus.gain.value=0.8; sfxBus.connect(master);
    const len=AC.sampleRate|0; noiseBuf=AC.createBuffer(1,len,AC.sampleRate);
    const nd=noiseBuf.getChannelData(0); for(let i=0;i<len;i++) nd[i]=Math.random()*2-1;
    // continuous stretch voice: rubbery tone + friction noise
    const ns=AC.createBufferSource(); ns.buffer=noiseBuf; ns.loop=true;
    const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=500; bp.Q.value=1.6;
    const ng=AC.createGain(); ng.gain.value=0; ns.connect(bp); bp.connect(ng); ng.connect(sfxBus); ns.start();
    const o=AC.createOscillator(); o.type='triangle'; o.frequency.value=140;
    const og=AC.createGain(); og.gain.value=0; o.connect(og); og.connect(sfxBus); o.start();
    ST={ng,bp,o,og};
    for(const m of fam) setupBus(m);
    const b=AC.createBuffer(1,1,22050), s=AC.createBufferSource(); s.buffer=b; s.connect(AC.destination); s.start(0);
    if(AC.state==='suspended') AC.resume().catch(()=>{});
    nextStep=AC.currentTime+0.08; stepIdx=0;
  }catch(e){AC=null;}
}
function setupBus(m){ if(!AC) return; m.bus=AC.createGain(); m.bus.gain.value=1; m.lp=AC.createBiquadFilter(); m.lp.type='lowpass'; m.lp.frequency.value=6000; m.bus.connect(m.lp); m.lp.connect(musicBus); }
function aOK(){return AC&&AC.state==='running';}
function aNow(){return aOK()?AC.currentTime:G.time;}
function stepPos(){ if(aOK()) return stepIdx-(nextStep-AC.currentTime)/STEP; return G.time/STEP; }
function env(g,t,a,p,d){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(0.0002,p),t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+d);}
function tone(type,f,t,d,p,dest,a,f2){
  if(!aOK())return; a=a||0.004;
  const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+a+d);
  const g=AC.createGain(); env(g,t,a,p,d); o.connect(g); g.connect(dest||sfxBus); o.start(t); o.stop(t+a+d+0.03);
}
function nz(t,d,p,type,f,q,dest,f2){
  if(!aOK())return;
  const s=AC.createBufferSource(); s.buffer=noiseBuf;
  const fl=AC.createBiquadFilter(); fl.type=type; fl.frequency.setValueAtTime(f,t); if(f2) fl.frequency.exponentialRampToValueAtTime(f2,t+d); fl.Q.value=q||1;
  const g=AC.createGain(); env(g,t,0.003,p,d); s.connect(fl); fl.connect(g); g.connect(dest||sfxBus);
  s.start(t,Math.random()*Math.max(0,0.95-d)); s.stop(t+d+0.05);
}
const tn=()=>AC?AC.currentTime+0.004:0;
/* sfx (immediate, unquantized) */
const S={
  poke(th){const t=tn(),f=330*(1.35-0.3*th);tone('sine',f,t,0.12,0.3,null,0.003,f*0.55);nz(t,0.05,0.05,'lowpass',900,1);},
  release(L){const t=tn(),f=90+L*30;tone('sine',f*1.6,t,0.22,0.22,null,0.004,f*0.7);tone('triangle',f,t+0.06,0.16,0.08,null,0.004,f*1.3);},
  landTom(th){const t=tn();tone('sine',220*(1.2-0.2*th),t,0.09,0.32,null,0.002,110);nz(t,0.04,0.08,'lowpass',700,1);},
  landCorn(){const t=tn(),f=1800+rnd()*500;tone('sine',f,t,0.06,0.1,null,0.002);tone('sine',f*1.5,t,0.04,0.04,null,0.002);},
  miss(){const t=tn();tone('triangle',300,t,0.08,0.08,null,0.003,240);},
  pon(th){const t=tn(),f=300+60*(th-1);tone('sine',f,t,0.2,0.5,null,0.002,80);nz(t,0.08,0.15,'lowpass',1200,1,null,300);},
  pari(){const t=tn();for(let i=0;i<5;i++)nz(t+i*0.022+rnd()*0.01,0.018,0.16,'highpass',3500+rnd()*3000,1);},
  sizzle(){const t=tn();nz(t,0.6,0.06,'highpass',4500,0.7);tone('sine',140,t,0.5,0.06,null,0.05,220);},
  cut(){const t=tn();nz(t,0.17,0.25,'bandpass',2500,2,null,8000);tone('sine',1200,t,0.08,0.05,null,0.003,2400);},
  pick(){const t=tn();tone('sine',420,t,0.08,0.18,null,0.003,640);},
  whoosh(){const t=tn();nz(t,0.3,0.1,'bandpass',500,1.5,null,2200);},
  chime(){const t=tn();tone('sine',1046.5,t,0.5,0.16,null,0.003);tone('sine',1318.5,t+0.07,0.5,0.14,null,0.003);tone('sine',1568,t+0.14,0.6,0.12,null,0.003);},
  munch(){const t=tn();tone('sine',170,t,0.07,0.15,null,0.003,120);nz(t,0.05,0.05,'lowpass',600,1);},
  hop(){const t=tn();tone('sine',500,t,0.14,0.2,null,0.003,1300);},
  cloth(){const t=tn();nz(t,1.0,0.16,'lowpass',300,0.8,null,3000);[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone('sine',f,t+0.1+i*0.09,0.9,0.08,null,0.01));},
  reveal(){const t=tn();[784,1046.5,1318.5,1568].forEach((f,i)=>tone('sine',f,t+i*0.06,0.4,0.12,null,0.003));},
  knock(f){const t=tn();tone('triangle',f||700,t,0.05,0.12,null,0.002,(f||700)*0.8);},
  blip(m){const t=tn();const f=m.k.base*2;tone('sine',f,t,0.12,0.1,null,0.01,f*1.25);},
  poof(){const t=tn();nz(t,0.25,0.14,'lowpass',900,1,null,250);tone('sine',260,t,0.18,0.18,null,0.004,150);},
  rustle(v){const t=tn();nz(t,0.12,0.04+0.08*v,'bandpass',1500+v*1500,0.8);},
  wake(){const t=tn();tone('sine',784,t,0.25,0.06,null,0.01);tone('sine',1174.7,t+0.05,0.3,0.05,null,0.01);}
};
function stretchSound(speed,L,on){
  if(!aOK()||!ST) return; const t=AC.currentTime;
  const v=on?clamp(speed*0.0006,0,0.22):0;
  ST.ng.gain.setTargetAtTime(v,t,0.03); ST.bp.frequency.setTargetAtTime(350+L*260,t,0.05);
  ST.og.gain.setTargetAtTime(on?clamp(0.02+speed*0.00012,0,0.07):0,t,0.04);
  ST.o.frequency.setTargetAtTime(110+L*55,t,0.05);
}
/* music voices */
function mTom(t,v,acc){tone('sine',acc?150:130,t,0.28,0.55*v,musicBus,0.002,52);nz(t,0.03,0.12*v,'lowpass',1500,1,musicBus);}
function mBell(t,f,v){tone('sine',f,t,0.6,v,musicBus,0.002);tone('sine',f*2.76,t,0.18,v*0.35,musicBus,0.002);}
function mBass(t,f){tone('triangle',f,t,0.42,0.3,musicBus,0.01);tone('sine',f*2,t,0.3,0.08,musicBus,0.01);}
function mPon(t){tone('sine',240,t,0.16,0.3,musicBus,0.002,90);}
function mShake(t,v){nz(t,0.04,0.05*v,'highpass',6500,0.8,musicBus);}
function mClap(t){nz(t,0.05,0.16,'bandpass',1300,1.5,musicBus);nz(t+0.012,0.05,0.12,'bandpass',1100,1.5,musicBus);}
function mVoice(m,f,t,dur,loud){
  if(!aOK()||!m.bus) return;
  if(loud){
    const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(f*0.97,t); o.frequency.exponentialRampToValueAtTime(f,t+0.05);
    const lfo=AC.createOscillator(); lfo.frequency.value=5.2+m.i*0.4; const lg=AC.createGain(); lg.gain.value=f*0.013; lfo.connect(lg); lg.connect(o.frequency);
    const f1=AC.createBiquadFilter(); f1.type='bandpass'; f1.frequency.value=m.k.form[0]; f1.Q.value=5;
    const f2=AC.createBiquadFilter(); f2.type='bandpass'; f2.frequency.value=m.k.form[1]; f2.Q.value=7;
    const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.7,t+0.03); g.gain.setValueAtTime(0.7,t+dur*0.65); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(m.bus);
    o.start(t); lfo.start(t); o.stop(t+dur+0.02); lfo.stop(t+dur+0.02);
  } else {
    tone('triangle',f,t,dur*0.9,0.07,m.bus,0.04);
  }
  m.notes.push(t,t+dur);
  if(m.notes.length>12) m.notes.splice(0,2);
}
function mGiggle(m,t,v){
  if(!aOK()||!m.bus) return;
  const b=m.k.base*3;
  for(let i=0;i<4;i++){const tt=t+i*0.08,f=b*(1.3-i*0.08);tone('sine',f,tt,0.055,0.16*v,m.bus,0.006,f*0.82);nz(tt,0.045,0.05*v,'bandpass',2400,2,m.bus);}
  m.notes.push(t,t+0.34);
  if(m.notes.length>12) m.notes.splice(0,2);
}

