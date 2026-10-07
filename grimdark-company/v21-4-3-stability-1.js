/* Grim Company v21.4.3 — stability hardening and Founder party drill fix. */
const GC343_VERSION='21.4.3';
const GC343_CARD_LAST=new Map();

function gc343PhoneMode(){
 try{return (navigator.maxTouchPoints||0)>1&&/AppleWebKit/i.test(navigator.userAgent)}catch(_){return false}
}
function gc343FastMultiplier(phone=gc343PhoneMode()){return phone?2:4}

const _gc199SpeedGC343=gc199Speed;
gc199Speed=function(){
 const mode=gc199Mode();
 if(mode==='fast')return gc343FastMultiplier();
 return mode==='play'?1:0;
};

gc342ScheduleRender=function(urgent=false){
 if(!state)return;
 GC342_RENDER_DIRTY=true;
 const fast=gc199Mode()==='fast';
 if(fast&&!urgent){
  GC342_RENDER_DIRTY=false;
  GC342_STATS.suppressedRenders++;
  return;
 }
 const now=gc342Now(),interval=urgent?0:(fast?1200:500);
 const wait=Math.max(0,interval-(now-GC342_LAST_RENDER_REAL));
 if(GC342_RENDER_TIMER)return;
 const fire=()=>{
  GC342_RENDER_TIMER=0;
  if(!state||!GC342_RENDER_DIRTY)return;
  GC342_RENDER_DIRTY=false;
  requestAnimationFrame(()=>{if(state)try{render()}catch(e){gc341RuntimeError('coalesced render',e)}});
 };
 if(wait<=1)fire();else GC342_RENDER_TIMER=setTimeout(fire,wait);
};

if(typeof gc331RefreshExpeditionCard==='function'){
 const _gc331RefreshExpeditionCardGC343=gc331RefreshExpeditionCard;
 gc331RefreshExpeditionCard=function(pid){
  const now=gc342Now(),last=GC343_CARD_LAST.get(pid)||0;
  const interval=gc199Mode()==='fast'?(gc343PhoneMode()?1200:750):300;
  if(now-last<interval){GC342_STATS.cardSkips++;return false}
  GC343_CARD_LAST.set(pid,now);
  return _gc331RefreshExpeditionCardGC343(pid);
 };
}

gc340ChooseTarget=function(type){
 const f=gc260Founder(),sp=gc340ActionSpec(type);if(!f||!sp)return;
 let rows=[];
 if(type==='mentor')rows=localRoster(f.regionId).filter(a=>a.id!==f.id&&a.status==='Ready');
 else if(type==='visitWounded')rows=localRoster(f.regionId).filter(a=>a.id!==f.id&&a.status==='Recovering');
 else if(type==='drillParty')rows=localParties(f.regionId).filter(p=>!p.expedition&&p.members.length&&(p.members.length>1||!p.members.includes(f.id)));
 if(!rows.length)return toast(type==='visitWounded'?'Nobody here is recovering.':'No valid target is available.');
 modal(`<div class="sheetHead"><div><h3>${esc(sp.label)}</h3><div class="tiny muted">${esc(sp.desc)}</div></div><button class="x" data-action="close">×</button></div><div class="list">${rows.map(x=>type==='drillParty'?`<button class="card" data-action="gc340FocusTarget" data-type="${type}" data-id="${x.id}"><b>${esc(x.name)}${x.members.includes(f.id)?' • YOUR PARTY':''}</b><small>${x.members.length} members • Cohesion ${Math.round(x.cohesion||0)}${x.members.includes(f.id)?' • you train with them':''}</small></button>`:`<button class="card" data-action="gc340FocusTarget" data-type="${type}" data-id="${x.id}"><b>${esc(x.name)}</b><small>Lv.${x.lvl} ${esc(x.className)} • ${esc(x.status)}</small></button>`).join('')}</div>`);
};

const _gc199UpdateClockGC343=gc199UpdateClock;
gc199UpdateClock=function(){
 const out=_gc199UpdateClockGC343();
 if(!state)return out;
 const s=document.querySelector('[data-gc199-state]');
 if(s&&gc199Mode()==='fast')s.textContent=gc343PhoneMode()?'SAFE FAST 2×':'RUNNING 4×';
 return out;
};

const _auditGC343=audit;
audit=function(){
 const out=_auditGC343();
 out.v343Stability=GC343_VERSION;
 out.phoneFastCappedAt2x=true;
 out.fastRoutineFullRendersSuppressed=true;
 out.fastCombatCardRefreshReduced=true;
 out.founderCanDrillOwnParty=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC343_TEST=function(){
 const old=state;
 try{
  state=createState('v343 Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';
  const f=gc260CreateFounderRecord('veyric',{name:'Drill Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=10;
  const a=generateAdventurer('veyric');a.status='Ready';a.lvl=7;state.roster.push(a);
  const p=makeParty('veyric','Founder Company');p.members=[f.id,a.id];p.captainId=f.id;p.cohesion=22;state.parties.push(p);
  gc340Presence().place='train';f.dailyOrder='Train';
  gc340ChooseTarget('drillParty');
  const sheet=document.getElementById('sheet')?.innerText||'';
  const ownPartyVisible=sheet.includes('Founder Company')&&sheet.includes('YOUR PARTY');
  closeModal();
  const mobileFast=gc343FastMultiplier(true)===2,desktopFast=gc343FastMultiplier(false)===4;
  state.timeSystem.gc199Mode='fast';
  const before=GC342_STATS.suppressedRenders;
  GC342_RENDER_DIRTY=false;gc342ScheduleRender(false);
  const routineRenderSuppressed=GC342_STATS.suppressedRenders>before&&!GC342_RENDER_DIRTY;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(ownPartyVisible&&mobileFast&&desktopFast&&routineRenderSuppressed&&integrity),ownPartyVisible,mobileFast,desktopFast,routineRenderSuppressed,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};