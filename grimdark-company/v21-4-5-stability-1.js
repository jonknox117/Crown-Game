/* Grim Company v21.4.5 — serious mobile stability pass.
   Recovery is de-thrashed, phone clock presentation is lightweight, and the
   master simulation loop no longer allocates full structural fingerprints each tick. */
const GC345_VERSION='21.4.5';
const GC345_STATS={recoveryCompletions:0,recoverySounds:0,minimalClockUpdates:0,masterTicks:0};
let GC345_RECOVERY_CONTEXT=null;
let GC345_RECOVERY_BATCH=[];
let GC345_RECOVERY_DEPTH=0;
let GC345_LAST_RECOVERY_SOUND=0;
let GC345_LAST_TRIM=0;
let GC345_LAST_PHONE_CLOCK=0;
let GC345_LAST_PHONE_WORK=0;

function gc345PhoneMode(){
 return window.__GC345_FORCE_PHONE===true||gc343PhoneMode();
}

/* Identical recovery rules, without repeatedly recomputing Founder presence for
   every single roster member and without firing one sound per recovered person. */
gc201RecoveryTick=function(a,deltaDays){
 if(!a||!gc193AtHQ(a)||deltaDays<=0)return;
 const ctx=GC345_RECOVERY_CONTEXT||(()=>{
  const f=gc260Founder(),pr=gc340SyncPresence();
  return{founderId:f?.id||null,regionId:f?.regionId||null,present:!!(f&&pr?.mode==='town'&&pr.regionId===f.regionId&&pr.place==='recover'&&f.status!=='Dead')};
 })();
 const support=ctx.present&&ctx.regionId===a.regionId?GC340_SUPPORT.Recover:1;
 const dt=deltaDays*support,w=gc200Work(a),max=derived(a).maxHp,inf=hq(a.regionId).upgrades.Infirmary||0;
 a.hp=clamp(Number(a.hp)||0,0,max);
 const focused=a.status==='Recovering'||a.dailyOrder==='Recover';
 const pct=focused?(.14+inf*.018):.012;
 if(a.hp<max){
  w.gc201HealFraction=(Number(w.gc201HealFraction)||0)+max*pct*dt;
  const heal=Math.floor(w.gc201HealFraction+1e-8);
  if(heal>0){w.gc201HealFraction-=heal;a.hp=Math.min(max,a.hp+heal)}
 }else if(w.gc201HealFraction)w.gc201HealFraction=0;
 if(a.status==='Recovering'){
  if(w.gc201LastStatus!=='Recovering'||!Number.isFinite(Number(w.recoveryLeft))||w.recoveryLeft<=0)w.recoveryLeft=Math.max(.25,Number(a.recovery)||1);
  w.recoveryLeft=Math.max(0,w.recoveryLeft-dt*(1+inf*.12));
  a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
  if(w.recoveryLeft<=0){
   a.status='Ready';a.injury=null;a.recovery=0;a.dailyOrder='Recover';w.recoveryLeft=0;
   const text=`${a.name} completed injury recovery and remains on Recover until reassigned.`;
   pushHistory(text,a.regionId);gc199RecordFeed(text,'recovery');
   GC345_RECOVERY_BATCH.push(a.name);GC345_STATS.recoveryCompletions++;
  }
 }
 w.gc201LastStatus=a.status;
};

const _gc200ContinuousWorkGC345=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){
 if(!state||deltaDays<=0)return _gc200ContinuousWorkGC345(deltaDays);
 const outer=GC345_RECOVERY_DEPTH++===0;
 if(outer){
  const f=gc260Founder(),pr=gc340SyncPresence();
  GC345_RECOVERY_CONTEXT={founderId:f?.id||null,regionId:f?.regionId||null,present:!!(f&&pr?.mode==='town'&&pr.regionId===f.regionId&&pr.place==='recover'&&f.status!=='Dead')};
  GC345_RECOVERY_BATCH=[];
 }
 let out;
 try{out=_gc200ContinuousWorkGC345(deltaDays)}
 finally{
  GC345_RECOVERY_DEPTH--;
  if(outer){
   const finished=GC345_RECOVERY_BATCH.slice();
   GC345_RECOVERY_CONTEXT=null;GC345_RECOVERY_BATCH=[];
   if(finished.length){
    if(typeof gc344TrimRoutineHistory==='function')gc344TrimRoutineHistory();
    const now=Date.now();
    if(now-GC345_LAST_RECOVERY_SOUND>2200){
     GC345_LAST_RECOVERY_SOUND=now;GC345_STATS.recoverySounds++;
     try{sfx('rest')}catch(_){}
    }
   }
  }
 }
 return out;
};

/* Coalesce identical SFX bursts. Fast time should never create an audio machine gun. */
const _sfxGC345=sfx;
const GC345_SFX_LAST=new Map();
sfx=function(name,...args){
 const now=Date.now(),key=String(name||''),gap=key==='rest'?1800:key==='level'?500:80,last=GC345_SFX_LAST.get(key)||0;
 if(now-last<gap)return false;
 GC345_SFX_LAST.set(key,now);
 return _sfxGC345(name,...args);
};

/* Bypass v21.4.2's per-tick string fingerprint allocation. The existing save/render
   wrappers already tell us when inner systems requested work. */
gc199AdvanceFieldClocks=function(deltaDays){
 if(!state||!Number.isFinite(Number(deltaDays))||deltaDays<=0)return false;
 if(typeof gc321Locked==='function'&&gc321Locked())return false;
 const depth=GC342_SIM_DEPTH;
 GC342_SIM_DEPTH=depth+1;GC342_STATS.ticks++;GC345_STATS.masterTicks++;
 let out=false;
 try{
  out=_gc199AdvanceFieldClocksGC342(deltaDays);
 }catch(e){
  GC342_STATS.errors++;
  gc341RuntimeError('v21.4.5 master simulation tick',e);
  return false;
 }finally{
  GC342_SIM_DEPTH=depth;
  const now=gc342Now(),critical=gc342CriticalState();
  if(GC342_RENDER_DIRTY)gc342ScheduleRender(critical);
  if(GC342_SAVE_DIRTY)gc342FlushSave(critical);
  if(now-GC345_LAST_TRIM>3000){GC345_LAST_TRIM=now;gc342TrimVolatile()}
 }
 return out;
};

const _gc199UpdateClockGC345=gc199UpdateClock;
gc199UpdateClock=function(){
 if(!state)return;
 if(!gc345PhoneMode())return _gc199UpdateClockGC345();
 const now=gc342Now(),mode=gc199Mode(),minGap=mode==='fast'?900:450;
 if(now-GC345_LAST_PHONE_CLOCK<minGap){GC342_STATS.clockSkips++;return}
 GC345_LAST_PHONE_CLOCK=now;GC345_STATS.minimalClockUpdates++;
 document.body.classList.add('gc345PhoneClock');
 const bar=document.getElementById('gc199ClockBar');
 if(bar){
  const reason=state.timeSystem.gc199PauseReason||'',c=bar.querySelector('[data-gc199-clock]'),st=bar.querySelector('[data-gc199-state]'),daybar=bar.querySelector('[data-gc199-daybar]');
  if(c)c.textContent=gc199ClockLabel();
  if(st)st.textContent=mode==='paused'?(reason||'PAUSED'):mode==='fast'?'SAFE FAST 2×':'RUNNING';
  if(daybar)daybar.style.width=`${clamp(Number(state.timeSystem.gc199DayProgress)||0,0,1)*100}%`;
  bar.querySelectorAll('.gc199ModeBtn').forEach(x=>x.classList.remove('active'));
  const which=mode==='paused'?'gc199Pause':mode==='play'?'gc199Play':'gc199Fast';
  bar.querySelector(`[data-action="${which}"]`)?.classList.add('active');
  const sky=bar.querySelector('[data-gc200-sky]'),phase=bar.querySelector('[data-gc200-phase]');
  const daylight=(Number(state.timeSystem.gc199DayProgress)||0)<.5;
  if(sky)sky.dataset.phase=daylight?'day':'night';
  if(phase)phase.textContent=daylight?'DAYLIGHT':'NIGHT';
 }
 const a=gc340Presence()?.activity,activityBar=document.querySelector('[data-gc340-activitybar]');
 if(a&&activityBar)activityBar.style.width=`${clamp((1-a.remainingDays/a.durationDays)*100,0,100)}%`;
 document.querySelectorAll('[data-gc331-party]').forEach(card=>{
  const p=state.parties.find(x=>x.id===card.dataset.gc331Party),e=p?.expedition;if(!e)return;
  const total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),pct=clamp(total/Math.max(.001,Number(e.durationDays)||1)*100,0,100);
  const n=card.querySelector('[data-gc331-pct]'),line=card.querySelector('[data-gc331-progress]'),eta=card.querySelector('[data-gc331-eta]');
  if(n)n.textContent=`${Math.round(pct)}%`;if(line)line.style.width=`${pct}%`;if(eta)eta.textContent=gc199Eta(p);
 });
 if(state.ui?.tab==='company'&&now-GC345_LAST_PHONE_WORK>1800){GC345_LAST_PHONE_WORK=now;try{gc200UpdateWorkUI()}catch(_){}}
};


/* Preserve the actual clock DOM node across full renders. Older render wrappers
   removed and recreated the sun/moon clock, which could visibly reset/flicker. */
const _renderGC345StableClock=render;
render=function(...args){
 if(GC342_SIM_DEPTH>0)return _renderGC345StableClock(...args);
 const oldClock=document.getElementById('gc199ClockBar');
 if(oldClock)oldClock.remove();
 const out=_renderGC345StableClock(...args);
 if(state){
  const top=document.querySelector('.topbar'),host=document.getElementById('app');
  if(oldClock&&(top||host)){
   if(top)top.insertAdjacentElement('afterend',oldClock);else host.insertAdjacentElement('afterbegin',oldClock);
   gc199UpdateClock();
  }else if(!document.getElementById('gc199ClockBar')){
   gc199MountClock();
  }
 }
 return out;
};

function gc345InstallStyles(){
 if(document.getElementById('gc345Styles'))return;
 const st=document.createElement('style');st.id='gc345Styles';
 st.textContent=`
 body.gc345PhoneClock .gc200Sun,body.gc345PhoneClock .gc200Moon,body.gc345PhoneClock .gc200Horizon{display:none!important}
 body.gc345PhoneClock .gc200Sky{min-height:18px!important;height:18px!important;overflow:hidden!important;transition:none!important}
 body.gc345PhoneClock .gc200Sky *{animation:none!important;transition:none!important}
 body.gc345PhoneClock .gc200Sky>[data-gc200-phase]{position:static!important;display:block!important;text-align:center!important;line-height:18px!important}
 `;
 document.head.appendChild(st);
 setTimeout(()=>{if(gc345PhoneMode())document.body.classList.add('gc345PhoneClock')},0);
}
gc345InstallStyles();

const _auditGC345=audit;
audit=function(){
 const out=_auditGC345();
 out.v345SeriousStability=GC345_VERSION;
 out.recoveryPresenceCalculatedOncePerTick=true;
 out.recoveryAudioCoalesced=true;
 out.fastAudioRateLimited=true;
 out.phoneSunMoonMotionRemoved=true;
 out.phoneClockMinimalUpdates=true;
 out.clockDomPreservedAcrossRenders=true;
 out.perTickStructuralFingerprintRemoved=true;
 out.volatileTrimThrottled=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC345_STATS=()=>({...GC345_STATS});
