/* Grim Company v21.4.6 — duplicate clock hotfix.
   Enforces a single canonical clock even when an older live session already has stale duplicates. */
const GC346_VERSION='21.4.6';

function gc346AllClocks(){return Array.from(document.querySelectorAll('#gc199ClockBar'))}
function gc346DedupClock(preferred=null){
 const clocks=gc346AllClocks();
 let keep=preferred&&preferred.isConnected?preferred:(clocks[0]||null);
 if(!keep&&state){
  const top=document.querySelector('.topbar'),host=document.getElementById('app');
  if(host){
   if(top)top.insertAdjacentHTML('afterend',gc199ClockHTML());else host.insertAdjacentHTML('afterbegin',gc199ClockHTML());
   keep=document.getElementById('gc199ClockBar');
  }
 }
 gc346AllClocks().forEach(x=>{if(x!==keep)x.remove()});
 if(keep){
  const top=document.querySelector('.topbar'),host=document.getElementById('app');
  if(top&&keep.previousElementSibling!==top)top.insertAdjacentElement('afterend',keep);
  else if(!top&&host&&keep.parentElement!==host)host.insertAdjacentElement('afterbegin',keep);
 }
 return keep;
}

/* Replace the legacy mount with an idempotent canonicalizer. */
gc199MountClock=function(){
 if(!state)return;
 gc346DedupClock();
 gc199UpdateClock();
};

/* Replace the previous preservation wrapper. Remove every stale copy before the
   underlying render, then restore exactly one clock after it finishes. */
const _renderGC346=render;
render=function(...args){
 if(GC342_SIM_DEPTH>0)return _renderGC346(...args);
 const existing=gc346AllClocks(),keep=existing[0]||null;
 existing.forEach(x=>x.remove());
 const out=_renderGC346(...args);
 requestAnimationFrame(()=>{
  if(!state)return;
  const mounted=gc346AllClocks();
  if(keep&&!keep.isConnected){
   mounted.forEach(x=>x.remove());
   const top=document.querySelector('.topbar'),host=document.getElementById('app');
   if(top)top.insertAdjacentElement('afterend',keep);else if(host)host.insertAdjacentElement('afterbegin',keep);
  }
  gc346DedupClock(keep&&keep.isConnected?keep:null);
  gc199UpdateClock();
 });
 return out;
};

/* Clean an already-broken live document as soon as this patch loads. */
requestAnimationFrame(()=>{if(state){gc346DedupClock();gc199UpdateClock()}});

const _auditGC346=audit;
audit=function(){
 const out=_auditGC346();
 out.v346ClockHotfix=GC346_VERSION;
 out.singleCanonicalClock=true;
 out.duplicateClockSelfHealing=true;
 out.clockSurvivesRepeatedRenders=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC346_TEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  state=createState('Clock Hotfix Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';
  const f=gc260CreateFounderRecord('veyric',{name:'Clock Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=5;state.ui.tab='you';state.timeSystem.gc199Mode='fast';
  render();gc199MountClock();
  const first=document.getElementById('gc199ClockBar');
  document.querySelector('.topbar')?.insertAdjacentHTML('afterend',gc199ClockHTML());
  document.querySelector('.topbar')?.insertAdjacentHTML('afterend',gc199ClockHTML());
  const planted=gc346AllClocks().length>=3;
  gc199MountClock();
  const healed=gc346AllClocks().length===1;
  for(let i=0;i<20;i++){
   gc340Move(['hall','train','odd','recover','scout'][i%5]);
   render();gc199MountClock();
  }
  const afterRenders=gc346AllClocks().length===1;
  const canonical=document.getElementById('gc199ClockBar');
  const controls=!!canonical?.querySelector('[data-action="gc199Pause"]')&&!!canonical?.querySelector('[data-action="gc199Play"]')&&!!canonical?.querySelector('[data-action="gc199Fast"]');
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(planted&&healed&&afterRenders&&controls&&integrity),planted,healed,afterRenders,clockCount:gc346AllClocks().length,controls,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  gc346AllClocks().forEach(x=>x.remove());
  state=old;window.__GC345_FORCE_PHONE=oldForce;
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};