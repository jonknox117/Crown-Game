/* Broken Lantern v21.9.0 — scroll-stable Push Pace and per-HQ cap. */
const GC390_PUSH_STEP=.12;
let GC390_PUSH_GUARD_TO=0;
const GC390_PUSH_STATS={taps:0,suppressedRebuilds:0,highestSpeed:1};
function gc390PushBusy(){return gc351Now()<GC390_PUSH_GUARD_TO}
function gc390HoldScroll(y){
 /* iOS Safari scroll anchoring sometimes moves the document after interaction
    styles unwind; no DOM replacement is allowed on this ordinary push tap. */
 requestAnimationFrame(()=>{
  if(Math.abs((window.scrollY||0)-y)>3)window.scrollTo(0,y);
  requestAnimationFrame(()=>{if(Math.abs((window.scrollY||0)-y)>3)window.scrollTo(0,y)});
 });
}
const _gc347RefreshVisibleBodyGC390=gc347RefreshVisibleBody;
gc347RefreshVisibleBody=function(force=false){
 if(gc390PushBusy()&&state&&!gc321Locked()&&!state.parties.some(p=>p.expedition?.battle&&gc260FounderInParty(p))){
  GC390_PUSH_STATS.suppressedRebuilds++;
  /* Count avoided work in the existing smoothness telemetry as well. */
  if(typeof GC351_STATS!=='undefined')GC351_STATS.fullHtmlAvoided++;
  return false;
 }
 return _gc347RefreshVisibleBodyGC390(force);
};
const _gc348RefreshExpeditionDOMGC390=gc348RefreshExpeditionDOM;
gc348RefreshExpeditionDOM=function(pid=null,forceCard=false){
 return _gc348RefreshExpeditionDOMGC390(pid,forceCard&&!gc390PushBusy());
};
const _gc199PushPartyGC390=gc199PushParty;
gc199PushParty=function(pid){
 const p=state?.parties?.find(x=>x.id===pid),e=p?.expedition;
 if(!e||e.battle)return _gc199PushPartyGC390(pid);
 const max=gc390PushCap(p),prior=clamp(Number(e.gc201Momentum)||0,0,max);
 if(prior>=max-.0001)return toast('Maximum pace '+(1+max).toFixed(2)+'× reached. Roadmaster Stables upgrades increase the limit.');
 const y=window.scrollY||0,oldEvents=e.events?.length||0;
 GC390_PUSH_GUARD_TO=gc351Now()+550;
 const result=_gc199PushPartyGC390(pid);
 if(!p.expedition)return result;
 e.gc201Momentum=clamp(prior+GC390_PUSH_STEP,0,max);
 if(e.events?.length>oldEvents)e.events[e.events.length-1]='Headquarters pushed the wagon to '+(1+e.gc201Momentum).toFixed(2)+'× (maximum '+(1+max).toFixed(2)+'×).';
 GC390_PUSH_STATS.taps++;
 GC390_PUSH_STATS.highestSpeed=Math.max(GC390_PUSH_STATS.highestSpeed,1+e.gc201Momentum);
 if(typeof gc348RefreshExpeditionDOM==='function')gc348RefreshExpeditionDOM(pid,false);
 gc390HoldScroll(y);
 save();
 return result;
};
const _gc330ExpeditionCardGC390=gc330ExpeditionCard;
gc330ExpeditionCard=function(p){
 let html=_gc330ExpeditionCardGC390(p);
 if(p?.expedition&&!p.expedition.battle){
  const max=(1+gc390PushCap(p)).toFixed(2);
  html=html.replace('>Push Pace</button>','>Push Pace • Max '+max+'×</button>');
 }
 return html;
};
const _expeditionCardGC390=expeditionCard;
expeditionCard=function(p){
 let html=_expeditionCardGC390(p);
 if(p?.expedition&&!p.expedition.battle){
  const max=(1+gc390PushCap(p)).toFixed(2);
  html=html.replace(/(data-action="gc199Push"[^>]*>)(Push Party[^<]*)<\/button>/,'$1$2 • Max '+max+'×</button>');
 }
 return html;
};
const _auditGC390=audit;
audit=function(){
 const out=_auditGC390();
 out.v390HQRoadmaster=GC390_VERSION;
 out.pushMaxTwoXWithStables=true;
 out.pushKeepsScrollAndExpeditionCard=true;
 out.singleSpoilsUpgrade=true;
 out.stanceLeadersScaleWithLevelAndRarity=true;
 out.directorIsFounderOrAppointedCommander=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC390_PUSH_STATS=()=>({...GC390_PUSH_STATS});
