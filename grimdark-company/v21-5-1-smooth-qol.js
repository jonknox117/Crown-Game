/* Grim Company v21.5.1 — Smoothness, bugfix & QoL pass.
   One lightweight live reconciler, targeted stat patches, double-tap protection,
   better scroll memory, and substantially fewer full screen rebuilds. */
const GC351_VERSION='21.5.1';
const GC351_STATS={
 liveTicks:0,targetedPatches:0,structuralChecks:0,structuralRefreshes:0,
 fullHtmlAvoided:0,actionsBlocked:0,toastsDeduped:0,scrollRestores:0,errors:0
};
let GC351_LAST_STRUCT='';
let GC351_LAST_STRUCT_CHECK=0;
let GC351_LAST_ACTION={sig:'',at:0};
let GC351_LAST_TOAST={msg:'',at:0};
let GC351_LIVE_RAF=0;
let GC351_LAST_LIVE=0;
let GC351_HEARTBEAT=0;

function gc351Now(){return typeof performance!=='undefined'?performance.now():Date.now()}

function gc351ScreenKey(){
 if(!state)return'';
 const phase=gc270IsFreeblade()?'free':'company';
 const tab=state.ui?.tab||'you';
 const sub=phase==='company'&&tab==='company'?(state.ui?.gc330CompanySub||'overview'):'';
 return `${phase}:${state.currentRegion}:${tab}:${sub}`;
}
function gc351StructuralSignature(){
 if(!state)return'';
 const f=gc260Founder(),pr=typeof gc340Presence==='function'?gc340Presence():null;
 const parties=(state.parties||[]).map(p=>{
  const e=p.expedition;
  return e?`${p.id}:E:${e.contract?.id||e.contract?.title||''}:${e.battle?'B':'T'}:${e.gc260PendingDecision?.id||''}:${p.gc340DungeonRun?.currentRoomId||''}`:`${p.id}:I:${p.members?.length||0}:${p.captainId||''}`;
 }).join('|');
 const statusCounts=(state.roster||[]).reduce((o,a)=>{o[a.status]=(o[a.status]||0)+1;return o},{});
 const region=state.regions?.[state.currentRegion];
 const dungeons=(region?.gc340Dungeons||[]).map(d=>`${d.id}:${d.cleared?1:0}:${(d.rooms||[]).filter(r=>r.cleared).length}`).join(',');
 const campaign=region?.gc240Campaign;
 return[
  gc351ScreenKey(),f?.status||'',f?.regionId||'',pr?.mode||'',pr?.place||'',pr?.activity?.id||'',
  Object.entries(statusCounts).sort().map(x=>x.join(':')).join(','),
  parties,dungeons,campaign?.id||'',campaign?.stage||'',campaign?.complete?1:0,
  (region?.contracts||[]).map(c=>c.id).join(',')
 ].join(';');
}

/* Give region vitals stable hooks so they can update without rebuilding WORLD/COMPANY. */
gc330RegionVitals=function(r){
 const rid=Object.entries(state.regions||{}).find(([,x])=>x===r)?.[0]||state.currentRegion;
 return`<div class="gc330RegionVitals" data-gc351-vitals="${esc(rid)}"><div data-vital="threat"><span>THREAT</span><b>${Math.round(r.threat)}</b><i><em style="width:${clamp(r.threat,0,100)}%"></em></i></div><div data-vital="stability"><span>STABILITY</span><b>${Math.round(r.stability)}</b><i><em style="width:${clamp(r.stability,0,100)}%"></em></i></div><div data-vital="prosperity"><span>PROSPERITY</span><b>${Math.round(r.prosperity)}</b><i><em style="width:${clamp(r.prosperity,0,100)}%"></em></i></div></div>`;
};

function gc351PatchRegionVitals(){
 let changed=false;
 document.querySelectorAll('[data-gc351-vitals]').forEach(box=>{
  const r=state.regions?.[box.dataset.gc351Vitals];if(!r)return;
  for(const [key,val] of [['threat',r.threat],['stability',r.stability],['prosperity',r.prosperity]]){
   const row=box.querySelector(`[data-vital="${key}"]`);if(!row)continue;
   const b=row.querySelector('b'),em=row.querySelector('em'),txt=String(Math.round(val));
   if(b&&b.textContent!==txt){b.textContent=txt;changed=true}
   const w=`${clamp(val,0,100)}%`;
   if(em&&em.style.width!==w){em.style.width=w;changed=true}
  }
 });
 return changed;
}
function gc351PatchCompanyFieldSummary(){
 const list=document.querySelector('.gc330FieldSummary');if(!list)return false;
 const active=localParties(state.currentRegion).filter(p=>p.expedition);
 let changed=false;
 [...list.querySelectorAll('.card em')].forEach((em,i)=>{
  const p=active[i];if(!p)return;
  const e=p.expedition,total=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),pct=clamp(total/Math.max(.001,Number(e.durationDays)||1)*100,0,100);
  const txt=`Risk ${e.contract.risk} • ${Math.round(pct)}%`;
  if(em.textContent!==txt){em.textContent=txt;changed=true}
 });
 return changed;
}
function gc351PatchFocus(){
 const a=gc340Presence()?.activity,bar=document.querySelector('[data-gc340-activitybar]');
 if(!a||!bar)return false;
 const pct=clamp((1-a.remainingDays/a.durationDays)*100,0,100),w=`${pct}%`;
 if(bar.style.width!==w){bar.style.width=w;return true}
 return false;
}
function gc351PatchYouVitals(){
 if(typeof gc344RefreshQuickNumbers!=='function')return false;
 gc344RefreshQuickNumbers();return true;
}
function gc351PatchWork(){
 if(typeof gc200UpdateWorkUI!=='function')return false;
 gc200UpdateWorkUI();return true;
}
function gc351TargetedPatch(){
 if(!state||document.hidden)return false;
 let changed=false;
 try{
  if(typeof gc347RefreshHud==='function')changed=gc347RefreshHud()||changed;
  changed=gc351PatchYouVitals()||changed;
  changed=gc351PatchFocus()||changed;
  if(state.ui?.tab==='company')changed=gc351PatchWork()||changed;
  if(state.ui?.tab==='company'||state.ui?.tab==='world')changed=gc351PatchRegionVitals()||changed;
  if(state.ui?.tab==='company')changed=gc351PatchCompanyFieldSummary()||changed;
  if(typeof gc348RefreshExpeditionDOM==='function')changed=gc348RefreshExpeditionDOM()||changed;
 }catch(e){
  GC351_STATS.errors++;
  if(typeof gc341RuntimeError==='function')gc341RuntimeError('v21.5.1 targeted live patch',e);
 }
 if(changed)GC351_STATS.targetedPatches++;
 return changed;
}

/* Full body reconciliation is now structural-only. The old reconciler rebuilt
   screen HTML just to discover that a number or progress width changed. */
gc347RefreshVisibleBody=function(force=false){
 if(!state||document.hidden)return false;
 const now=gc351Now();
 if(!force&&now-GC351_LAST_STRUCT_CHECK<900){GC351_STATS.fullHtmlAvoided++;return false}
 GC351_LAST_STRUCT_CHECK=now;GC351_STATS.structuralChecks++;
 const sig=gc351StructuralSignature();
 if(!force&&sig===GC351_LAST_STRUCT){GC351_STATS.fullHtmlAvoided++;return false}
 if(!force&&typeof gc347InteractionBusy==='function'&&gc347InteractionBusy()){return false}
 const screen=document.querySelector('#app .screen');if(!screen)return false;
 let fresh='';
 try{fresh=gc347CurrentBodyHTML()}catch(e){GC351_STATS.errors++;gc341RuntimeError('v21.5.1 structural renderer',e);return false}
 const y=window.scrollY;
 screen.innerHTML=fresh;
 GC351_LAST_STRUCT=sig;
 GC347_LAST_KEY=gc347ScreenKey();
 GC347_LAST_BODY_HASH=typeof gc347Hash==='function'?gc347Hash(fresh):0;
 GC351_STATS.structuralRefreshes++;
 requestAnimationFrame(()=>{
  if(Math.abs(window.scrollY-y)>3)window.scrollTo(0,y);
  try{gc346DedupClock();gc199UpdateClock()}catch(_){}
  gc351TargetedPatch();
 });
 return true;
};

gc347LiveTick=function(force=false){
 if(!state||document.hidden)return false;
 GC347_STATS.ticks++;GC351_STATS.liveTicks++;
 gc351TargetedPatch();
 return gc347RefreshVisibleBody(force);
};

function gc351ScheduleLive(force=false){
 if(!state||document.hidden)return;
 const now=gc351Now(),min=force?0:(gc199Mode()==='fast'?300:220);
 if(!force&&now-GC351_LAST_LIVE<min)return;
 GC351_LAST_LIVE=now;
 if(GC351_LIVE_RAF)return;
 GC351_LIVE_RAF=requestAnimationFrame(()=>{
  GC351_LIVE_RAF=0;
  gc347LiveTick(force);
 });
}

/* Replace the old 300ms heartbeat with one coalesced heartbeat. Older simulation
   wrappers may still request updates, but the scheduler folds them together. */
if(GC347_TIMER)clearInterval(GC347_TIMER);
if(GC351_HEARTBEAT)clearInterval(GC351_HEARTBEAT);
GC351_HEARTBEAT=setInterval(()=>gc351ScheduleLive(false),420);

const _gc199AdvanceFieldClocksGC351=gc199AdvanceFieldClocks;
gc199AdvanceFieldClocks=function(deltaDays){
 const out=_gc199AdvanceFieldClocksGC351(deltaDays);
 gc351ScheduleLive(false);
 return out;
};

const _renderGC351=render;
render=function(...args){
 const out=_renderGC351(...args);
 requestAnimationFrame(()=>{
  GC351_LAST_STRUCT=gc351StructuralSignature();
  GC351_LAST_STRUCT_CHECK=gc351Now();
  gc351TargetedPatch();
 });
 return out;
};

/* QoL: remember scroll position for Freeblade tabs too, not only company tabs. */
function gc351ScrollStore(){
 if(!state)return{};
 state.ui=state.ui||{};
 state.ui.gc351Scroll=state.ui.gc351Scroll||{};
 return state.ui.gc351Scroll;
}
function gc351RememberScroll(){
 if(!state)return;
 gc351ScrollStore()[gc351ScreenKey()]=Math.max(0,window.scrollY||0);
}
function gc351RestoreScroll(){
 if(!state)return;
 const y=Number(gc351ScrollStore()[gc351ScreenKey()])||0;
 requestAnimationFrame(()=>{window.scrollTo(0,y);GC351_STATS.scrollRestores++});
}

/* QoL/bug prevention: double taps cannot execute the same mutating command twice.
   Important simulation controls remain immediately responsive. */
const GC351_ACTION_EXEMPT=new Set(['gc199Pause','gc199Play','gc199Fast','close','audio','menu','testSound']);
const _processActionGC351=processAction;
processAction=function(el){
 const a=el?.dataset?.action;if(!a)return;
 const now=gc351Now(),sig=[a,el.dataset.id||'',el.dataset.party||'',el.dataset.value||'',el.dataset.type||'',el.dataset.choice||''].join('|');
 if(!GC351_ACTION_EXEMPT.has(a)&&sig===GC351_LAST_ACTION.sig&&now-GC351_LAST_ACTION.at<260){
  GC351_STATS.actionsBlocked++;
  el.classList?.add('gc351Blocked');
  setTimeout(()=>el.classList?.remove('gc351Blocked'),180);
  return false;
 }
 GC351_LAST_ACTION={sig,at:now};
 const nav=a==='nav'||a==='gc330CompanySub'||a==='switchRegion';
 if(nav)gc351RememberScroll();
 el.classList?.add('gc351Busy');
 let out;
 try{out=_processActionGC351(el)}
 finally{
  setTimeout(()=>el.classList?.remove('gc351Busy'),160);
  if(nav)gc351RestoreScroll();
  gc351ScheduleLive(true);
 }
 return out;
};

/* Repeated identical toasts can stack from rapid simulation events. Collapse them. */
const _toastGC351=toast;
toast=function(msg,...args){
 const text=String(msg||''),now=gc351Now();
 if(text===GC351_LAST_TOAST.msg&&now-GC351_LAST_TOAST.at<650){GC351_STATS.toastsDeduped++;return false}
 GC351_LAST_TOAST={msg:text,at:now};
 return _toastGC351(msg,...args);
};

function gc351InstallStyles(){
 if(document.getElementById('gc351Styles'))return;
 const st=document.createElement('style');st.id='gc351Styles';
 st.textContent=`
 button,.btn,[data-action]{touch-action:manipulation}
 .gc351Busy{will-change:transform;filter:brightness(1.05)}
 .gc351Blocked{animation:gc351Nope .18s ease-out}
 @keyframes gc351Nope{0%,100%{transform:translateX(0)}35%{transform:translateX(-2px)}70%{transform:translateX(2px)}}
 .gc330RegionVitals em,.gc200WorkLive em,.gc330FieldSummary em{transition:width .24s linear}
 .gc330Screen{overflow-anchor:none}
 @media (prefers-reduced-motion:reduce){.gc351Blocked{animation:none!important}}
 `;
 document.head.appendChild(st);
}
gc351InstallStyles();

const _auditGC351=audit;
audit=function(){
 const out=_auditGC351();
 out.v351SmoothQol=GC351_VERSION;
 out.singleCoalescedLiveHeartbeat=true;
 out.structuralOnlyScreenRebuilds=true;
 out.targetedWorldVitalsLive=true;
 out.targetedWorkProgressLive=true;
 out.targetedExpeditionProgressLive=true;
 out.doubleTapMutationGuard=true;
 out.duplicateToastGuard=true;
 out.freebladeScrollMemory=true;
 out.companyScrollMemoryPreserved=true;
 out.noTabSwitchRequiredForLiveProgress=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC351_STATS=()=>({...GC351_STATS});

window.__GC351_TEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  state=createState('Smooth QoL Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=100;
  const f=gc260CreateFounderRecord('veyric',{name:'Smooth Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=7;f.dailyOrder='Train';state.ui.tab='world';render();
  GC351_LAST_STRUCT=gc351StructuralSignature();
  const screen=document.querySelector('#app .screen'),screenBefore=screen;
  const struct0=GC351_STATS.structuralRefreshes,avoid0=GC351_STATS.fullHtmlAvoided;
  state.regions.veyric.threat=71.4;state.regions.veyric.stability=62.2;state.regions.veyric.prosperity=51.8;
  for(let i=0;i<12;i++)gc347LiveTick(false);
  const sameScreen=document.querySelector('#app .screen')===screenBefore;
  const vital=document.querySelector('[data-gc351-vitals="veyric"]');
  const liveVitals=!!vital&&vital.querySelector('[data-vital="threat"] b')?.textContent==='71'&&vital.querySelector('[data-vital="stability"] b')?.textContent==='62';
  const avoided=GC351_STATS.fullHtmlAvoided>avoid0&&GC351_STATS.structuralRefreshes===struct0;

  const dummy=document.createElement('button');dummy.dataset.action='nav';dummy.dataset.tab='world';
  processAction(dummy);const blocked0=GC351_STATS.actionsBlocked;processAction(dummy);
  const doubleTapBlocked=GC351_STATS.actionsBlocked>blocked0;

  state.ui.tab='you';render();gc340Presence().place='train';f.dailyOrder='Train';gc340StartFocused('personalDrill');
  gc351TargetedPatch();
  const bar=()=>document.querySelector('[data-gc340-activitybar]')?.style.width||'';
  const b0=bar();gc199AdvanceFieldClocks(.03);gc351TargetedPatch();const b1=bar();
  const focusLive=b0!==b1;

  const integrity=gc342StateIntegrity().ok;
  const oneClock=gc346AllClocks().length===1;
  return{ok:!!(sameScreen&&liveVitals&&avoided&&doubleTapBlocked&&focusLive&&integrity&&oneClock),sameScreen,liveVitals,avoided,doubleTapBlocked,focusLive,b0,b1,integrity,oneClock,stats:{...GC351_STATS}};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;window.__GC345_FORCE_PHONE=oldForce;
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};