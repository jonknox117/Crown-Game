/* Grim Company v21.2.1 — Decision Hard Lock hotfix.
   A pending Founder decision is not a notification. It owns the simulation:
   no clock, HQ work, expedition travel, combat, world day, or command AI can advance. */
const GC321_VERSION='21.2.1';

function gc321PendingParty(){
 if(!state)return null;
 return state.parties.find(p=>p?.expedition?.gc260PendingDecision&&gc260FounderInParty(p))||null;
}
function gc321Locked(){return !!gc321PendingParty()}
function gc321Acquire(p){
 const e=p?.expedition,d=e?.gc260PendingDecision;if(!state||!p||!e||!d)return false;
 gc199InitState(state);
 const existing=state.timeSystem.gc321DecisionLock;
 const prior=e.gc320ResumeMode||existing?.resumeMode||gc199Mode();
 if(!e.gc320ResumeMode)e.gc320ResumeMode=prior==='fast'?'fast':prior==='play'?'play':'paused';
 state.timeSystem.gc321DecisionLock={partyId:p.id,decisionId:d.id,resumeMode:e.gc320ResumeMode,day:state.company.day,progress:Number(e.progress)||0};
 state.timeSystem.gc199Mode='paused';
 state.timeSystem.gc199PauseReason='DECISION REQUIRED — simulation hard-locked.';
 GC199_LAST_REAL=(typeof performance!=='undefined'?performance.now():Date.now());
 gc199UpdateClock();save();
 return true;
}
function gc321ClearStaleLock(){
 if(!state?.timeSystem)return;
 if(!gc321Locked())delete state.timeSystem.gc321DecisionLock;
}
function gc321EnsureModal(){
 const p=gc321PendingParty();if(!p)return false;
 gc321Acquire(p);
 const d=p.expedition.gc260PendingDecision,m=document.getElementById('modal'),sheet=document.getElementById('sheet');
 const shown=!!(m?.classList.contains('show')&&sheet?.dataset.gc321DecisionId===d.id);
 if(!shown){
  gc320OpenDecisionModal(p);
  const next=document.getElementById('sheet');if(next)next.dataset.gc321DecisionId=d.id;
 }
 return true;
}
function gc321Watchdog(){
 if(!state)return;
 const p=gc321PendingParty();
 if(!p){gc321ClearStaleLock();return}
 if(gc199Mode()!=='paused'||state.timeSystem?.gc199PauseReason!=='DECISION REQUIRED — simulation hard-locked.')gc321Acquire(p);
 gc321EnsureModal();
}

/* Decision creation synchronously acquires the hard lock and throws the decision
   in front of the player before the creating simulation function can continue. */
const _gc260SetPendingGC321=gc260SetPending;
gc260SetPending=function(p,d){
 const out=_gc260SetPendingGC321(p,d);
 if(p?.expedition?.gc260PendingDecision){
  gc321Acquire(p);gc321EnsureModal();
 }
 return out;
};

/* Critical fix: v20.1's continuous expedition routine kept executing after
   fieldCheck() created a pending Founder decision. Founder expeditions now return
   from the exact simulation tick that creates a decision. */
const _gc201AdvanceExpeditionGC321=gc201AdvanceExpedition;
gc201AdvanceExpedition=function(p,deltaDays){
 if(gc321Locked())return false;
 if(!gc260FounderInParty(p))return _gc201AdvanceExpeditionGC321(p,deltaDays);
 const e=p?.expedition;if(!e||e.battle||deltaDays<=0)return false;
 gc193MigrateExpedition(p);
 const current=(Number(e.elapsedDays)||0)+(Number(e.gc199FieldProgress)||0),remaining=Math.max(0,e.durationDays-current);
 if(remaining<=.0001)return gc193FinishNoTime(p);
 const momentum=clamp(Number(e.gc201Momentum)||0,0,GC201_PUSH_CAP),speed=1+momentum,span=Math.min(remaining,deltaDays*speed),rate=gc201ContactRate(p),hazard=1-Math.exp(-rate*span),contact=chance(hazard),travel=contact?span*Math.random():span,total=current+travel;
 gc200SetFieldProgress(e,total);e.gc201ContactExposure=(Number(e.gc201ContactExposure)||0)+travel;e.gc201LastContactRate=rate;gc200FieldRelations(p,travel);gc201PushStrain(p,travel,momentum);
 e.gc201Momentum=Math.max(0,momentum-GC201_PUSH_DECAY*deltaDays);
 if((e.gcChecksDone||0)<1&&total>=Math.min(.35,e.durationDays*.25)){
  fieldCheck(p);e.gcChecksDone=(e.gcChecksDone||0)+1;
  if(gc321Locked()){gc321EnsureModal();return false}
 }
 if(contact){
  e.gc194Encounters=(e.gc194Encounters||0)+1;e.events.push(`Hostile contact at ${Math.round(e.progress)}% travel progress.`);
  startBattle(p);
  if(gc321Locked()){gc321EnsureModal();save();return false}
  save();render();return true;
 }
 if(gc321Locked()){gc321EnsureModal();return false}
 if(total>=e.durationDays-.0001){gc200SetFieldProgress(e,e.durationDays);return gc193FinishNoTime(p)}
 e.expectedReturnDay=state.company.day+Math.ceil(Math.max(0,e.durationDays-total));
 return true;
};

/* Belt-and-suspenders hard gates. Even if some future UI or timer accidentally
   tries to advance while the clock says Play, a pending decision makes the
   underlying simulation functions no-ops. */
const _gc199AdvanceFieldClocksGC321=gc199AdvanceFieldClocks;
gc199AdvanceFieldClocks=function(deltaDays){if(gc321Locked()){gc321EnsureModal();return false}return _gc199AdvanceFieldClocksGC321(deltaDays)};

const _gc200ContinuousWorkGC321=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){if(gc321Locked())return false;return _gc200ContinuousWorkGC321(deltaDays)};

const _gc201AdvanceFieldGC321=gc201AdvanceField;
gc201AdvanceField=function(deltaDays){if(gc321Locked())return false;const out=_gc201AdvanceFieldGC321(deltaDays);if(gc321Locked())gc321EnsureModal();return out};

const _gc201CombatTickGC321=gc201CombatTick;
gc201CombatTick=function(p,deltaDays){if(gc321Locked())return false;const out=_gc201CombatTickGC321(p,deltaDays);if(gc321Locked())gc321EnsureModal();return out};

const _gc199AdvanceWorldDayGC321=gc199AdvanceWorldDay;
gc199AdvanceWorldDay=function(){if(gc321Locked())return false;return _gc199AdvanceWorldDayGC321()};

const _gc193AdvanceDayGC321=gc193AdvanceDay;
gc193AdvanceDay=function(){if(gc321Locked())return false;return _gc193AdvanceDayGC321.apply(this,arguments)};

if(typeof gc280CommandTick==='function'){
 const _gc280CommandTickGC321=gc280CommandTick;
 gc280CommandTick=function(deltaDays){if(gc321Locked())return false;return _gc280CommandTickGC321(deltaDays)};
}
if(typeof gc280CommandAct==='function'){
 const _gc280CommandActGC321=gc280CommandAct;
 gc280CommandAct=function(regionId,force=false){if(gc321Locked())return false;return _gc280CommandActGC321(regionId,force)};
}
const _gc199PushPartyGC321=gc199PushParty;
gc199PushParty=function(pid){if(gc321Locked()){gc321EnsureModal();return toast('Resolve your decision first. Nothing else can advance.')}return _gc199PushPartyGC321(pid)};

const _gc199SetModeGC321=gc199SetMode;
gc199SetMode=function(mode){
 if(gc321Locked()&&mode!=='paused'){gc321Acquire(gc321PendingParty());gc321EnsureModal();return toast('The simulation is locked until you choose.')}
 return _gc199SetModeGC321(mode);
};

/* While a decision is pending, the modal is the only interactive surface.
   No navigation, management action, time control, Push, retreat, gear change,
   or unrelated click is allowed through. */
const _processActionGC321=processAction;
processAction=function(el){
 if(gc321Locked()){
  const a=el?.dataset?.action;
  if(a==='gc260Decision'||a==='gc320Casualty'||a==='gc340DungeonChoice'||a==='gc382DungeonWithdraw')return _processActionGC321(el);
  gc321EnsureModal();return;
 }
 return _processActionGC321(el);
};

const _closeModalGC321=closeModal;
closeModal=function(){
 if(gc321Locked()){gc321EnsureModal();return}
 return _closeModalGC321();
};

/* Re-renders, tab changes attempted from stale DOM, and restored saves all
   reassert the required decision in front of the player. */
const _renderGC321=render;
render=function(){
 const out=_renderGC321();
 if(state&&gc321Locked())requestAnimationFrame(gc321EnsureModal);
 return out;
};

const _normalizeStateGC321=normalizeState;
normalizeState=function(s){
 s=_normalizeStateGC321(s);
 if(s?.timeSystem&&s.parties?.some(p=>p?.expedition?.gc260PendingDecision&&p.members?.includes(s.company?.founderId))){
  s.timeSystem.gc199Mode='paused';s.timeSystem.gc199PauseReason='DECISION REQUIRED — simulation hard-locked.';
 }
 return s;
};

/* Clear metadata only after a real decision has been resolved. Existing v21.2
   resolution code owns restoration of the prior Play/Fast state. */
const _gc260ResolveDecisionGC321=gc260ResolveDecision;
gc260ResolveDecision=function(pid,choice){
 const out=_gc260ResolveDecisionGC321(pid,choice);
 gc321ClearStaleLock();
 if(gc321Locked()){gc321Acquire(gc321PendingParty());gc321EnsureModal()}
 return out;
};
const _gc320HandleCasualtyGC321=gc320HandleCasualty;
gc320HandleCasualty=function(pid,targetId,choice){
 const out=_gc320HandleCasualtyGC321(pid,targetId,choice);
 gc321ClearStaleLock();
 if(gc321Locked()){gc321Acquire(gc321PendingParty());gc321EnsureModal()}
 return out;
};

setInterval(gc321Watchdog,100);

const _auditGC321=audit;
audit=function(){
 const out=_auditGC321();
 out.v321DecisionHardLock=GC321_VERSION;
 out.pendingDecisionStopsEverySimulationPath=true;
 out.decisionModalImmediate=true;
 out.decisionModalMandatory=true;
 out.questCannotProgressWhileWaiting=true;
 out.hqCannotProgressWhileWaiting=true;
 out.worldCannotProgressWhileWaiting=true;
 out.commandersCannotActWhileWaiting=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC321_TEST=function(){
 const old=state,oldRate=gc201ContactRate;
 try{
  state=createState('Decision Lock Test','veyric');state.regions.veyric.hq.established=true;
  const f=gc260CreateFounderRecord('veyric',{name:'Lock Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  gc270Progression().phase='company';f.status='Expedition';f.dailyOrder='Train';
  const p=makeParty('veyric','Lock Test Crew');p.members=[f.id];p.captainId=f.id;state.parties.push(p);
  const c=gc250FreshContractForRisk('veyric',1,[]);c.check='scout';
  p.expedition={contract:c,progress:0,elapsedDays:0,durationDays:1.2,expectedReturnDay:2,events:[],checks:[],battle:null,fought:false,complete:false,gcChecksDone:0,gc199FieldProgress:0,gc201Momentum:0,gc201ContactExposure:0};
  state.timeSystem.gc199Mode='fast';state.timeSystem.gc199PauseReason='';
  gc201ContactRate=function(){return 0};
  gc201AdvanceExpedition(p,.4);
  const pending=!!p.expedition.gc260PendingDecision,modalNow=document.getElementById('modal')?.classList.contains('show'),paused=gc199Mode()==='paused';
  const snap={day:state.company.day,dayProgress:state.timeSystem.gc199DayProgress,progress:p.expedition.progress,elapsed:p.expedition.elapsedDays,field:p.expedition.gc199FieldProgress,xp:f.xp,hp:f.hp};
  gc199AdvanceFieldClocks(.8);gc200ContinuousWork(.8);gc201AdvanceField(.8);gc201CombatTick(p,.8);gc199AdvanceWorldDay();if(typeof gc280CommandTick==='function')gc280CommandTick(.8);gc199SetMode('fast');
  const frozen=snap.day===state.company.day&&snap.dayProgress===state.timeSystem.gc199DayProgress&&snap.progress===p.expedition.progress&&snap.elapsed===p.expedition.elapsedDays&&snap.field===p.expedition.gc199FieldProgress&&snap.xp===f.xp&&snap.hp===f.hp&&gc199Mode()==='paused';
  const pendingCopy=normalizeState(JSON.parse(JSON.stringify(state))),pendingSaveSafe=pendingCopy.timeSystem.gc199Mode==='paused'&&!!pendingCopy.parties.find(x=>x.expedition?.gc260PendingDecision);
  const d=p.expedition.gc260PendingDecision;gc260ResolveDecision(p.id,'self');
  const cleared=!p.expedition.gc260PendingDecision&&!gc321Locked(),resumed=gc199Mode()==='fast';
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=!copy.parties.some(x=>x.expedition?.gc260PendingDecision)&&!copy.timeSystem.gc321DecisionLock;
  return{ok:!!(pending&&modalNow&&paused&&frozen&&cleared&&resumed&&pendingSaveSafe&&saveSafe),pending,modalNow,paused,frozen,cleared,resumed,pendingSaveSafe,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{gc201ContactRate=oldRate;state=old;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};
