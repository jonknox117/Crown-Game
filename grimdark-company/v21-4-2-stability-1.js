/* Grim Company v21.4.2 — stability / performance pass.
   Fast mode keeps 4x simulation speed, but persistence and DOM work are coalesced. */
const GC342_VERSION='21.4.2';
let GC342_SIM_DEPTH=0;
let GC342_SAVE_DIRTY=false;
let GC342_RENDER_DIRTY=false;
let GC342_RENDER_TIMER=0;
let GC342_LAST_RENDER_REAL=0;
let GC342_LAST_SAVE_REAL=(typeof performance!=='undefined'?performance.now():Date.now());
let GC342_LAST_CLOCK_REAL=0;
let GC342_LAST_CLOCK_MODE='';
let GC342_LAST_CARD_REAL=new Map();
const GC342_STATS={suppressedSaves:0,actualSaves:0,suppressedRenders:0,actualRenders:0,clockSkips:0,cardSkips:0,ticks:0,errors:0};

function gc342Now(){return typeof performance!=='undefined'?performance.now():Date.now()}
function gc342StructuralFingerprint(){
 if(!state)return'';
 const exp=(state.parties||[]).map(p=>{
  const e=p.expedition;if(!e)return`${p.id}:idle`;
  return`${p.id}:${e.contract?.id||e.contract?.title||'exp'}:${e.battle?'battle':'field'}:${e.gc260PendingDecision?.id||''}:${p.gc340DungeonRun?.currentRoomId||''}`;
 }).join('|');
 const pr=state.founderSystem?.gc340Presence;
 const statuses=(state.roster||[]).reduce((o,a)=>{o[a.status]=(o[a.status]||0)+1;return o},{});
 return`${state.company?.day||0};${exp};${pr?.activity?.id||''};${pr?.mode||''};${Object.entries(statuses).sort().map(x=>x.join(':')).join(',')}`;
}
function gc342CriticalState(){
 if(!state)return false;
 return !!((typeof gc321Locked==='function'&&gc321Locked())||
   state.parties?.some(p=>p.expedition?.gc260PendingDecision)||
   state.roster?.some(a=>a.status==='Dead'));
}
function gc342TrimVolatile(){
 if(!state)return;
 (state.parties||[]).forEach(p=>{
  const e=p.expedition;
  if(e&&Array.isArray(e.events)&&e.events.length>90)e.events=e.events.slice(-90);
  if(e?.battle&&Array.isArray(e.battle.log)&&e.battle.log.length>45)e.battle.log=e.battle.log.slice(-45);
 });
 const feed=state.timeSystem?.gc199Feed;
 if(Array.isArray(feed)&&feed.length>80)feed.splice(0,feed.length-80);
 const recent=state.relationshipSystem?.recent;
 if(Array.isArray(recent)&&recent.length>120)recent.splice(0,recent.length-120);
}

const _saveGC342=save;
save=function(force=false){
 if(GC342_SIM_DEPTH>0&&force!==true){
  GC342_SAVE_DIRTY=true;GC342_STATS.suppressedSaves++;return true;
 }
 GC342_STATS.actualSaves++;
 GC342_LAST_SAVE_REAL=gc342Now();
 return _saveGC342();
};
window.save=save;
function gc342FlushSave(force=false){
 if(!state)return false;
 const now=gc342Now();
 if(!force&&!GC342_SAVE_DIRTY)return false;
 if(!force&&now-GC342_LAST_SAVE_REAL<900)return false;
 GC342_SAVE_DIRTY=false;
 return save(true);
}

const _renderGC342=render;
render=function(){
 if(GC342_SIM_DEPTH>0){
  GC342_RENDER_DIRTY=true;GC342_STATS.suppressedRenders++;return true;
 }
 GC342_STATS.actualRenders++;
 GC342_LAST_RENDER_REAL=gc342Now();
 return _renderGC342();
};
function gc342ScheduleRender(urgent=false){
 if(!state)return;
 GC342_RENDER_DIRTY=true;
 const now=gc342Now(),interval=urgent?0:(gc199Mode()==='fast'?900:450);
 const wait=Math.max(0,interval-(now-GC342_LAST_RENDER_REAL));
 if(GC342_RENDER_TIMER)return;
 const fire=()=>{
  GC342_RENDER_TIMER=0;
  if(!state||!GC342_RENDER_DIRTY)return;
  GC342_RENDER_DIRTY=false;
  requestAnimationFrame(()=>{if(state)try{render()}catch(e){gc341RuntimeError('coalesced render',e)}});
 };
 if(wait<=1)fire();else GC342_RENDER_TIMER=setTimeout(fire,wait);
}

const _gc199AdvanceFieldClocksGC342=gc199AdvanceFieldClocks;
gc199AdvanceFieldClocks=function(deltaDays){
 if(!state||!Number.isFinite(Number(deltaDays))||deltaDays<=0)return;
 if(GC342_SIM_DEPTH>0)return _gc199AdvanceFieldClocksGC342(deltaDays);
 const before=gc342StructuralFingerprint();
 GC342_SIM_DEPTH++;GC342_STATS.ticks++;
 let out;
 try{
  out=_gc199AdvanceFieldClocksGC342(deltaDays);
 }catch(e){
  GC342_STATS.errors++;
  gc341RuntimeError('master simulation tick',e);
  return false;
 }finally{
  GC342_SIM_DEPTH--;
  gc342TrimVolatile();
  const after=gc342StructuralFingerprint(),structural=before!==after,critical=gc342CriticalState();
  if(GC342_RENDER_DIRTY)gc342ScheduleRender(structural||critical);
  if(GC342_SAVE_DIRTY)gc342FlushSave(structural||critical);
 }
 return out;
};

/* Fast mode still simulates 4x time, but live chrome/card refreshes at a lower,
   bounded frequency instead of hammering Mobile Safari every 250ms. */
const _gc199UpdateClockGC342=gc199UpdateClock;
gc199UpdateClock=function(){
 if(!state)return;
 const now=gc342Now(),mode=gc199Mode(),modeChanged=mode!==GC342_LAST_CLOCK_MODE,fast=mode==='fast';
 if(fast&&!modeChanged&&now-GC342_LAST_CLOCK_REAL<500){
  GC342_STATS.clockSkips++;return;
 }
 GC342_LAST_CLOCK_REAL=now;GC342_LAST_CLOCK_MODE=mode;
 return _gc199UpdateClockGC342();
};

if(typeof gc331RefreshExpeditionCard==='function'){
 const _gc331RefreshExpeditionCardGC342=gc331RefreshExpeditionCard;
 gc331RefreshExpeditionCard=function(pid){
  const now=gc342Now(),last=GC342_LAST_CARD_REAL.get(pid)||0,interval=gc199Mode()==='fast'?550:250;
  if(now-last<interval){GC342_STATS.cardSkips++;return false}
  GC342_LAST_CARD_REAL.set(pid,now);
  return _gc331RefreshExpeditionCardGC342(pid);
 };
}

/* Save immediately when leaving the page, even if a simulation save was batched. */
window.addEventListener('pagehide',()=>{try{gc342FlushSave(true)}catch(_){}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)try{gc342FlushSave(true)}catch(_){}});

/* Capture uncaught JS failures so a recoverable bug pauses instead of continuing to
   mutate the save. This cannot catch an OS-level Safari process kill, but it gives
   us a concrete diagnostic for script failures. */
window.addEventListener('error',ev=>{
 if(!state)return;
 GC342_STATS.errors++;
 gc341RuntimeError('window error',ev.error||ev.message||'Unknown window error');
});
window.addEventListener('unhandledrejection',ev=>{
 if(!state)return;
 GC342_STATS.errors++;
 gc341RuntimeError('unhandled promise rejection',ev.reason||'Unknown promise rejection');
});

const _gc199TimeHelpGC342=gc199TimeHelp;
gc199TimeHelp=function(){
 modal(`<div class="sheetHead"><h3>How Time Works</h3><button class="x" data-action="close">×</button></div><div class="notice"><b>Active play only.</b> Closing or backgrounding the game pauses it. No offline catch-up.</div><div class="list"><div class="card"><b>▶ Play</b><div class="small muted">Runs the full company simulation at normal speed.</div></div><div class="card"><b>▶▶ Fast — 4×</b><div class="small muted">Simulation remains 4×, but screen refreshes and autosaves are deliberately batched to reduce iPhone CPU, DOM and storage pressure.</div></div><div class="card"><b>Important decisions</b><div class="small muted">Founder decisions still hard-lock the entire simulation immediately.</div></div><div class="card"><b>Combat</b><div class="small muted">Combat remains automatic and visible. Fast mode advances combat faster without forcing a full-page rebuild every round.</div></div></div>`);
};
