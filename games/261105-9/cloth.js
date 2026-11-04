'use strict';
/* ---------------- cloth (hide and seek) ---------------- */
const CL={corners:[],kids:[],dots:[],polka:[],allT:-1,ghost:null,grab:-1};
function clothRest(gx,gy){const c=LY.cloth;return{x:c.l+gx*c.w,y:c.t+gy*c.h};}
function clothW(c,gx,gy){const a=Math.abs(gx-c.gx),b=Math.abs(gy-c.gy);const sa=0.16+0.52*c.ux*c.ux,sb=0.16+0.52*c.uy*c.uy;const qa=a/sa,qb=b/sb;return Math.exp(-(qa*qa+qb*qb));}
function clothAmt(vx,vy){return Math.min(1,hyp(vx,vy)/(0.3*Math.min(LY.cloth.w,LY.cloth.h)));}
function clothSetup(){
  CL.corners=[[0,0],[1,0],[0,1],[1,1]].map(([gx,gy])=>({gx,gy,vx:0,vy:0,cvx:0,cvy:0,ux:0.707,uy:0.707,amt:0,grabbed:false,gs:{x:0,y:0},wig:0}));
  const order=[0,1,2,3].sort(()=>rnd()-0.5); const modes=['h','v','d'].sort(()=>rnd()-0.5);
  CL.kids=[1,2,3].map((mi,j)=>{const ci=order[j],c=CL.corners[ci],mode=modes[j];
    const ab=mode==='h'?[0.36,0.1]:mode==='v'?[0.1,0.36]:[0.16,0.16];
    return {m:fam[mi],corner:ci,mode,gx:c.gx?1-ab[0]:ab[0],gy:c.gy?1-ab[1]:ab[1],reveal:0,hold:0,found:false,emptyHint:0};});
  CL.empty=order[3]; CL.allT=-1; CL.ghost=null; CL.grab=-1;
  const n=Math.min(innerWidth,innerHeight)<500?1150:1350; CL.dots=[]; const cols=Math.round(Math.sqrt(n*LY.cloth.w/LY.cloth.h)); const rows=Math.ceil(n/cols);
  for(let i=0;i<n;i++){const cx=i%cols,cy=(i/cols)|0;CL.dots.push({gx:clamp((cx+0.2+R()*0.6)/cols,0,1),gy:clamp((cy+0.2+R()*0.6)/rows,0,1),sx:0,sy:0,stg:R(),sz:0.8+R()*0.4,ph:R()*TAU,x:0,y:0});}
}
function clothPos(gx,gy,out){
  const c=LY.cloth; let x=c.l+gx*c.w,y=c.t+gy*c.h,lift=0;
  for(let k=0;k<4;k++){
    const cn=CL.corners[k]; let vx=cn.vx,vy=cn.vy;
    if(CL.ghost&&CL.ghost.k===k){vx+=CL.ghost.vx;vy+=CL.ghost.vy;}
    if(cn.wig>0){vx+=Math.sin(G.time*30)*cn.wig*6;vy+=Math.cos(G.time*26)*cn.wig*4;}
    if(Math.abs(vx)+Math.abs(vy)<0.3) continue;
    const w=clothW(cn,gx,gy); if(w<0.004) continue;
    const amt=clothAmt(vx,vy);
    x+=vx*w; y+=vy*w-w*amt*c.h*0.05;
    const l=hyp(vx,vy)+1e-3,px=-vy/l,py=vx/l,wr=Math.sin((Math.abs(gx-cn.gx)+Math.abs(gy-cn.gy))*22-G.time*2)*w*(1-w)*amt*LY.R0*0.16;
    x+=px*wr; y+=py*wr; lift+=w*amt;
  }
  out.x=x;out.y=y;out.lift=Math.min(1,lift);
}
function updateCloth(dt){
  for(const cn of CL.corners){
    if(!cn.grabbed){cn.cvx+=(-cn.vx*55-cn.cvx*6.5)*dt;cn.cvy+=(-cn.vy*55-cn.cvy*6.5)*dt;cn.vx+=cn.cvx*dt;cn.vy+=cn.cvy*dt;}
    cn.amt=clothAmt(cn.vx,cn.vy); cn.wig=Math.max(0,cn.wig-dt*1.5);
  }
  const tg=G.target;
  if(tg&&tg.kind==='corner'&&!G.demo&&CL.grab<0){const cn=CL.corners[tg.corner];const b=(G.time*1.4)%1;if(b<0.25)cn.wig=Math.max(cn.wig,0.5);}
  let foundNow=0;
  for(const kd of CL.kids){
    let rv=0; for(const cn of CL.corners){rv=Math.max(rv,clothW(cn,kd.gx,kd.gy)*cn.amt);}
    kd.reveal=rv;
    if(!kd.found){
      if(rv>0.48){kd.hold+=dt;if(kd.hold>0.1)findKid(kd);}else kd.hold=Math.max(0,kd.hold-dt);
      kd.m.muffle=true;
    } else {kd.m.muffle=false;foundNow++;}
    kd.emptyHint=Math.max(0,kd.emptyHint-dt);
  }
  const ce=CL.corners[CL.empty];
  if(ce&&ce.amt>0.6&&!ce.hinted){ce.hinted=true;for(const kd of CL.kids)if(!kd.found){kd.emptyHint=1;}const k=CL.kids.find(k=>!k.found);if(k)mGiggle(k.m,tn(),0.6);}
  if(ce&&ce.amt<0.2)ce.hinted=false;
  if(foundNow===3&&CL.allT<0){CL.allT=G.time;G.laughUntil=aNow()+BAR*4;for(const m of fam){m.loudUntil=aNow()+BAR*2;m.danceAmt=1;m.wig=1;}S.chime();glog('all found');}
  if(CL.allT>=0&&G.time-CL.allT>3.4&&CL.grab<0) startFromCloth();
}
function findKid(kd){
  kd.found=true; kd.m.pop=1; kd.m.wig=1; kd.m.muffle=false; G.stats.found++; G.laughUntil=aNow()+BAR*4;
  S.reveal(); mGiggle(kd.m,tn()+0.05,1); fam[0].wig=1;
  const p=clothRest(kd.gx,kd.gy);
  for(let i=0;i<12;i++){const a=i/12*TAU;fx(p.x,p.y,Math.cos(a)*120,Math.sin(a)*120,0.6,LY.ds*1.8,0,1,0,3);}
  glog('found '+kd.m.k.id+' mode='+kd.mode);
}
function startCloth(){
  endOp(true);
  G.phase='toCloth'; G.phaseT=0; G.clothThisRound=true; G.stats.cloths++; glog('cloth!');
  clothSetup();
  for(let i=0;i<CL.dots.length;i++){const d=D.dots[i%D.dots.length];CL.dots[i].sx=d.x;CL.dots[i].sy=d.y;}
  CL.polka=D.tops.filter(t=>t.st==='on').map(t=>{const p=toppingPos(t);return{sx:p.x,sy:p.y,gx:0.08+R()*0.84,gy:0.08+R()*0.84,kind:t.kind};});
  S.cloth();
  for(const m of fam) m.wig=1;
}
function startFromCloth(){
  G.phase='fromCloth'; G.phaseT=0;
  const tmp={x:0,y:0};
  const pos=CL.dots.map(d=>{clothPos(d.gx,d.gy,tmp);return{x:tmp.x,y:tmp.y};});
  for(const kd of CL.kids) kd.m.muffle=false;
  newRound(pos);
}

/* ---------------- rounds ---------------- */
function newRound(fromPos){
  G.round++; G.stats.rounds=G.round; G.cfg=CONFIGS[(G.round-1)%4]; G.clothThisRound=false; G.endT=0;
  const perm=PERMS[(G.round-1)%4]; for(const m of fam){m.seat=perm[m.i];m.queue=[];m.eating=null;}
  placeObjects(false);
  cont.tomato.stock=cont.tomato.max; cont.corn.stock=cont.corn.max;
  D.state='raw'; D.lobes=[]; D.ghost=null; D.frozen=false; D.cuts=[]; D.slices=[]; D.tops=[]; D.falling=[]; D.order=[]; D.caught={tomato:0,corn:0};
  D.bake.fill(0); D.bakeEv.fill(0); D.puff.fill(0); D.puffV.fill(0); D.puffT.fill(0); D.crisp.fill(0); D.wob.fill(0); D.wobV.fill(0); D.th.fill(1); D.binSlice.fill(-1);
  const g=fam[0];
  for(let i=0;i<D.dots.length;i++){const d=D.dots[i];d.slice=-1;
    if(fromPos){const p=fromPos[i%fromPos.length];d.x=p.x;d.y=p.y;d.vx=0;d.vy=0;}
    else{d.x=g.x+(rnd()-0.5)*20;d.y=g.y-hrOf(g)+(rnd()-0.5)*20;d.vx=(rnd()-0.5)*200;d.vy=-200-rnd()*200;}}
  S.poof(); glog('round '+G.round);
}
function checkRoundEnd(dt){
  if(D.state!=='baked'||!D.slices.length) return;
  const busy=D.slices.some(s=>s.state!=='eaten')||fam.some(m=>m.eating!==null)||D.tops.some(t=>t.st==='hop'||t.st==='hopPlate');
  if(busy){G.endT=0;return;}
  G.endT+=dt; if(G.endT>1.3) newRound(null);
}

