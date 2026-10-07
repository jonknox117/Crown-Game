/* Grim Company v21.4 — Presence support and progressive NPC autonomy. */
const _gc201ScoutRegionGC340=gc201ScoutRegion;
gc201ScoutRegion=function(regionId,deltaDays){return _gc201ScoutRegionGC340(regionId,deltaDays*(gc340At('Scout',regionId)?GC340_SUPPORT.Scout:1))};

const _gc201TrainRegionGC340=gc201TrainRegion;
gc201TrainRegion=function(regionId,deltaDays){return _gc201TrainRegionGC340(regionId,deltaDays*(gc340At('Train',regionId)?GC340_SUPPORT.Train:1))};

const _gc220OddJobsRegionGC340=gc220OddJobsRegion;
gc220OddJobsRegion=function(regionId,deltaDays){return _gc220OddJobsRegionGC340(regionId,deltaDays*(gc340At('Odd Jobs',regionId)?GC340_SUPPORT['Odd Jobs']:1))};
/* The continuous-work loop still reaches Odd Jobs through the historical patrol function. */
gc201PatrolRegion=function(regionId,deltaDays){return gc220OddJobsRegion(regionId,deltaDays)};

const _gc201RecoveryTickGC340=gc201RecoveryTick;
gc201RecoveryTick=function(a,deltaDays){
 const pr=gc340SyncPresence(),f=gc260Founder(),present=!!(f&&pr?.mode==='town'&&pr.regionId===a.regionId&&pr.place==='recover'&&f.status!=='Dead'),founderHere=present&&a.id===f.id;
 const out=_gc201RecoveryTickGC340(a,deltaDays*(present?GC340_SUPPORT.Recover:1));
 if(founderHere&&a.status==='Ready')a.dailyOrder='Recover';
 return out;
};

function gc340SelfManagedStance(a){
 const r=state.regions[a.regionId];if(!r)return'Train';
 if(a.hp<derived(a).maxHp)return'Recover';
 if((a.lvl||1)<6)return'Train';
 if(r.threat>=62)return'Scout';
 if(r.prosperity<45)return'Odd Jobs';
 return chance(.45)?'Train':'Odd Jobs';
}
function gc340RoutineSelfManage(){
 if(!gc270IsCompany())return;
 const founderId=state.company.founderId;
 state.roster.forEach(a=>{
  if(a.id===founderId||a.status!=='Ready'||!gc193AtHQ(a))return;
  if(!GC220_STANCES.includes(a.dailyOrder)||(a.dailyOrder==='Recover'&&a.hp>=derived(a).maxHp)){
   a.dailyOrder=gc340SelfManagedStance(a);
   if(typeof gc220RememberReturn==='function'&&a.dailyOrder!=='Recover')gc220RememberReturn(a,a.dailyOrder);
  }
 });
}
function gc340CaptainAutoCap(p){
 const c=state.roster.find(a=>a.id===p?.captainId);if(!c)return 0;
 const missionGate=(Number(p.missions)||0)>=3;
 if(!missionGate||(c.lvl||1)<6)return 0;
 if(c.lvl>=15)return 4;
 if(c.lvl>=10)return 3;
 return 2;
}
function gc340CaptainAutoEligible(p){
 if(!p||p.members.includes(state.company.founderId)||p.gc320IndependentCrew||p.gc332EphemeralFreelance||p.gc340DungeonRun)return false;
 const cap=gc340CaptainAutoCap(p);if(!cap||!p.gc340CaptainAutonomy||p.expedition||!p.members.length)return false;
 return partyMembers(p).every(a=>a.status==='Ready');
}
function gc340PickRoutineContract(p){
 const cap=gc340CaptainAutoCap(p),r=state.regions[p.regionId];if(!cap||!r)return null;
 return(r.contracts||[]).filter(c=>!c.gc240CampaignId&&!c.gc320Independent&&Number(c.risk)<=cap&&gc320PartyQualification(p,c).ok)
  .sort((a,b)=>(b.risk-a.risk)||((b.reward||0)-(a.reward||0)))[0]||null;
}
function gc340CaptainDispatch(p,c){
 const oldTab=state.ui.tab,oldRegion=state.currentRegion,wasInternal=typeof GC280_INTERNAL!=='undefined'?GC280_INTERNAL:false;
 try{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=true;
  dispatchContract(c.id,p.id);
 }catch(e){return false}
 finally{
  if(typeof GC280_INTERNAL!=='undefined')GC280_INTERNAL=wasInternal;
  state.ui.tab=oldTab;state.currentRegion=oldRegion;
 }
 const ok=!!p.expedition;if(ok){gc199RecordFeed(`CAPTAIN AUTONOMY — ${p.name} accepted ${c.title} (Risk ${c.risk}).`,'command');save();render()}
 return ok;
}
function gc340AutonomyTick(deltaDays){
 if(!gc270IsCompany()||deltaDays<=0)return;
 const fs=gc260System();fs.gc340RoutineClock=(Number(fs.gc340RoutineClock)||0)+deltaDays;
 if(fs.gc340RoutineClock>=.25){fs.gc340RoutineClock%=.25;gc340RoutineSelfManage()}
 state.parties.forEach(p=>{
  if(!gc340CaptainAutoEligible(p))return;
  p.gc340AutoClock=(Number(p.gc340AutoClock)||0)+deltaDays;
  if(p.gc340AutoClock<.75)return;p.gc340AutoClock%=.75;
  const regionalCommand=(typeof gc280CommandState==='function')?gc280CommandState(p.regionId):null;
  if(regionalCommand?.autonomy&&regionalCommand?.commanderId)return;
  const c=gc340PickRoutineContract(p);if(c)gc340CaptainDispatch(p,c);
 });
}
const _gc200ContinuousWorkGC340=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){
 const out=_gc200ContinuousWorkGC340(deltaDays);
 gc340TickFocused(deltaDays);
 gc340AutonomyTick(deltaDays);
 return out;
};

const _gc330PartyCardGC340=gc330PartyCard;
gc330PartyCard=function(p){
 let html=_gc330PartyCardGC340(p);
 if(p.members.includes(state.company.founderId)||p.gc320IndependentCrew||p.gc332EphemeralFreelance)return html;
 const cap=gc340CaptainAutoCap(p),captain=state.roster.find(a=>a.id===p.captainId),enabled=!!p.gc340CaptainAutonomy;
 const block=`<div class="gc340Autonomy ${enabled?'active':''}"><div><span>CAPTAIN AUTONOMY</span><b>${cap?`Routine Risk 1–${cap}`:'Locked'}</b><small>${cap?`${esc(captain?.name||'Captain')} may independently accept ordinary contracts. Campaigns and Risk 5 always remain deliberate.`:'Requires a Lv.6+ captain and 3 completed party missions.'}</small></div><button class="btn ${enabled?'goldbtn':'ghost'}" data-action="gc340ToggleAutonomy" data-id="${p.id}" ${cap?'':'disabled'}>${enabled?'AUTO ON':'AUTO OFF'}</button></div>`;
 return html.replace('<div class="tactics">',block+'<div class="tactics">');
};

const _processActionGC340B=processAction;
processAction=function(el){
 if(el.dataset.action==='gc340ToggleAutonomy'){
  const p=state.parties.find(x=>x.id===el.dataset.id),cap=gc340CaptainAutoCap(p);if(!p||!cap)return toast('This party has not earned captain autonomy yet.');
  p.gc340CaptainAutonomy=!p.gc340CaptainAutonomy;p.gc340AutoClock=0;save();render();return toast(p.gc340CaptainAutonomy?'Captain autonomy enabled.':'Captain autonomy disabled.');
 }
 return _processActionGC340B(el);
};
