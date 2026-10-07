/* Grim Company v21.4.5 — long-session regression playtest. */
window.__GC345_PLAYTEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE,oldErr=safeLocalGet('grimCompanyLastRuntimeError');
 const statsBefore={...GC345_STATS},rendersBefore=GC342_STATS.actualRenders;
 try{
  window.__GC345_FORCE_PHONE=true;
  safeLocalRemove('grimCompanyLastRuntimeError');
  state=createState('Long Session Test','veyric');
  state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=500;
  const f=gc260CreateFounderRecord('veyric',{name:'Long Session Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=10;f.dailyOrder='Train';
  for(let i=0;i<18;i++){
   const a=generateAdventurer('veyric');a.lvl=5+(i%7);a.status=i<9?'Recovering':'Ready';a.dailyOrder=i<9?'Recover':['Train','Scout','Odd Jobs'][i%3];
   if(i<9){a.recovery=1+(i%2);a.injury=injuryName();a.hp=Math.max(1,Math.round(derived(a).maxHp*(.28+(i%3)*.08)))}
   state.roster.push(a);
  }
  state.ui.tab='you';state.timeSystem.gc199Mode='fast';
  gc340Presence().place='hall';render();gc199MountClock();
  const startNodes=document.querySelectorAll('*').length;
  let maxNodes=startNodes;

  function advanceUntilDone(limit=80){
   let n=0;
   while(gc340Presence().activity&&n++<limit){gc199AdvanceFieldClocks(.01);gc199UpdateClock()}
   if(gc340Presence().activity)throw new Error('Focused action failed to complete during soak.');
  }
  function repeat(place,type,count){
   gc340Move(place);gc199SetMode('fast');
   for(let i=0;i<count;i++){gc340StartFocused(type);advanceUntilDone()}
   maxNodes=Math.max(maxNodes,document.querySelectorAll('*').length);
  }

  repeat('train','personalDrill',24);
  repeat('odd','helpLocals',24);
  repeat('scout','studyContract',16);
  gc340Move('recover');gc199SetMode('fast');
  for(let i=0;i<18;i++){gc340StartFocused('helpInfirmary');advanceUntilDone()}
  for(let i=0;i<700;i++){gc199AdvanceFieldClocks(.004);if(i%4===0)gc199UpdateClock()}
  maxNodes=Math.max(maxNodes,document.querySelectorAll('*').length);

  gc199MountClock();
  if(typeof gc344TrimRoutineHistory==='function')gc344TrimRoutineHistory();
  gc342TrimVolatile();
  const recovering=state.roster.filter(a=>a.status==='Recovering').length;
  const sun=document.querySelector('[data-gc200-sun]'),moon=document.querySelector('[data-gc200-moon]');
  const celestialStatic=(!sun||getComputedStyle(sun).display==='none')&&(!moon||getComputedStyle(moon).display==='none');
  const clockCount=document.querySelectorAll('#gc199ClockBar').length,oneClock=clockCount===1;
  const nodeStable=maxNodes<=Math.max(startNodes*1.55,startNodes+220);
  const recoverySoundDelta=GC345_STATS.recoverySounds-statsBefore.recoverySounds;
  const audioControlled=recoverySoundDelta<=1;
  const renderDelta=GC342_STATS.actualRenders-rendersBefore;
  const renderControlled=renderDelta<25;
  const bounded=(f.history||[]).length<=80&&(state.timeSystem.gc199Feed||[]).length<=80;
  const noError=!safeLocalGet('grimCompanyLastRuntimeError')&&!state.founderSystem?.gc341LastRuntimeError&&GC342_STATS.errors===0;
  const integrity=gc342StateIntegrity().ok;
  const serializable=!!JSON.parse(JSON.stringify(state)).founderSystem;
  const rewards=state.company.silver>500&&f.xp>0;
  return{ok:!!(recovering===0&&celestialStatic&&oneClock&&nodeStable&&audioControlled&&renderControlled&&bounded&&noError&&integrity&&serializable&&rewards),recovering,celestialStatic,oneClock,clockCount,nodeStable,startNodes,maxNodes,audioControlled,recoverySoundDelta,renderControlled,renderDelta,bounded,noError,integrity,serializable,rewards,masterTicks:GC345_STATS.masterTicks-statsBefore.masterTicks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;window.__GC345_FORCE_PHONE=oldForce;
  if(oldErr)safeLocalSet('grimCompanyLastRuntimeError',oldErr);else safeLocalRemove('grimCompanyLastRuntimeError');
  document.body.classList.remove('gc345PhoneClock');
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};

const _auditGC345B=audit;
audit=function(){
 const out=_auditGC345B();
 out.longSessionPhonePlaytest=true;
 out.pilgrimHouseStressTest=true;
 out.repeatedFocusedActionsStressTest=true;
 out.clockDomLeakCheck=true;
 out.recoveryAudioSpamCheck=true;
 return out;
};
window.__BL_AUDIT=audit;
