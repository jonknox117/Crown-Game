/* Grim Company v21.4.2 — integrity checks, dungeon discoverability, and fast-mode regression coverage. */

gc341DungeonBoardHTML=function(regionId,freeblade=false){
 const all=state.regions[regionId]?.gc340Dungeons||[],ds=all.filter(d=>!d.cleared||d.entered);
 if(!ds.length){
  const scoutName=gc340TownDef(regionId)?.scout?.name||'Scout location';
  return`<div class="sectionTitle gc341DungeonTitle"><h3>Dungeons</h3><span>none discovered</span></div><div class="gc342DungeonEmpty"><b>No known dungeon sites.</b><span>Go to <strong>${esc(scoutName)}</strong> under YOU and use <strong>Survey the Wilds</strong> to deliberately search for ruins, caves, strongholds and other persistent sites.</span></div>`;
 }
 return`<div class="sectionTitle gc341DungeonTitle"><h3>Dungeons</h3><span>${ds.filter(d=>!d.cleared).length} active site${ds.filter(d=>!d.cleared).length===1?'':'s'}</span></div><div class="list gc341DungeonBoard">${ds.slice().sort((a,b)=>Number(a.cleared)-Number(b.cleared)||a.risk-b.risk).map(d=>gc341DungeonCard(d,freeblade)).join('')}</div>`;
};

function gc342StateIntegrity(){
 if(!state)return{ok:true};
 const issues=[];
 if(!Number.isFinite(Number(state.company?.day)))issues.push('company day is invalid');
 if(!Number.isFinite(Number(state.timeSystem?.gc199DayProgress)))issues.push('day progress is invalid');
 (state.parties||[]).forEach(p=>{
  if(p.expedition&&!p.expedition.contract)issues.push(`${p.name||p.id} has an expedition without a contract`);
  if(p.gc340DungeonRun&&!gc340DungeonById(p.gc340DungeonRun.dungeonId))issues.push(`${p.name||p.id} references a missing dungeon`);
 });
 (state.roster||[]).forEach(a=>{
  if(!Number.isFinite(Number(a.hp)))issues.push(`${a.name||a.id} has invalid HP`);
  if(!Number.isFinite(Number(a.lvl)))issues.push(`${a.name||a.id} has invalid level`);
 });
 return{ok:issues.length===0,issues};
}
function gc342CheckIntegrity(){
 const chk=gc342StateIntegrity();
 if(chk.ok)return true;
 gc341RuntimeError('state integrity check',new Error(chk.issues.join('; ')));
 return false;
}
let GC342_INTEGRITY_CLOCK=0;
const _gc340AutonomyTickGC342B=gc340AutonomyTick;
gc340AutonomyTick=function(deltaDays){
 const out=_gc340AutonomyTickGC342B(deltaDays);
 GC342_INTEGRITY_CLOCK+=Math.max(0,Number(deltaDays)||0);
 if(GC342_INTEGRITY_CLOCK>=.5){GC342_INTEGRITY_CLOCK%=.5;gc342CheckIntegrity()}
 return out;
};

function gc342PerfSummary(){
 return{
  version:GC342_VERSION,
  mode:state?gc199Mode():'none',
  suppressedSaves:GC342_STATS.suppressedSaves,
  actualSaves:GC342_STATS.actualSaves,
  suppressedRenders:GC342_STATS.suppressedRenders,
  actualRenders:GC342_STATS.actualRenders,
  clockSkips:GC342_STATS.clockSkips,
  cardSkips:GC342_STATS.cardSkips,
  ticks:GC342_STATS.ticks,
  errors:GC342_STATS.errors
 };
}
window.__GC342_PERF=gc342PerfSummary;

const _showMenuGC342=showMenu;
showMenu=function(){
 const out=_showMenuGC342(),sheet=document.getElementById('sheet');
 if(sheet){
  const list=sheet.querySelector('.gc330MenuGrid')||sheet.querySelector('.list');
  if(list&&!sheet.querySelector('[data-action="gc342Perf"]'))list.insertAdjacentHTML('beforeend',`<button class="card" data-action="gc342Perf"><b>Stability Status</b><small>Fast-mode batching and runtime health</small></button>`);
 }
 return out;
};
const _processActionGC342B=processAction;
processAction=function(el){
 if(el.dataset.action==='gc342Perf'){
  const p=gc342PerfSummary(),integrity=gc342StateIntegrity();
  return modal(`<div class="sheetHead"><h3>Stability Status</h3><button class="x" data-action="close">×</button></div><div class="notice ${integrity.ok?'good':'danger'}"><b>${integrity.ok?'Save state integrity looks healthy.':'State integrity issue detected.'}</b>${integrity.ok?'':'<div class="small">'+integrity.issues.map(esc).join('<br>')+'</div>'}</div><div class="grid3"><div class="card"><span class="tiny muted">SIM TICKS</span><br><b>${p.ticks}</b></div><div class="card"><span class="tiny muted">BATCHED SAVES</span><br><b>${p.suppressedSaves}</b></div><div class="card"><span class="tiny muted">BATCHED RENDERS</span><br><b>${p.suppressedRenders}</b></div></div><div class="card"><b>Fast-mode pressure reduction</b><div class="small muted">Clock refreshes skipped: ${p.clockSkips}<br>Expedition-card refreshes skipped: ${p.cardSkips}<br>Actual saves this session: ${p.actualSaves}<br>Actual full renders this session: ${p.actualRenders}<br>Contained runtime errors: ${p.errors}</div></div>`);
 }
 return _processActionGC342B(el);
};

function gc342InstallStyles(){
 if(document.getElementById('gc342Styles'))return;
 const st=document.createElement('style');st.id='gc342Styles';
 st.textContent=`
 .gc342DungeonEmpty{margin-bottom:10px;padding:9px 10px;border:1px dashed rgba(178,142,82,.22);border-radius:7px;background:#12110f}.gc342DungeonEmpty b,.gc342DungeonEmpty span{display:block}.gc342DungeonEmpty b{font-size:9px;color:#bba177}.gc342DungeonEmpty span{margin-top:3px;font-size:7px;line-height:1.4;color:#857b6e}.gc342DungeonEmpty strong{color:#c5a267}
 `;
 document.head.appendChild(st);
}
gc342InstallStyles();

const _auditGC342=audit;
audit=function(){
 const out=_auditGC342();
 out.v342Stability=GC342_VERSION;
 out.fastSimulationStill4x=true;
 out.fastModeBatchedSaves=true;
 out.fastModeBatchedRenders=true;
 out.fastModeThrottledDomRefresh=true;
 out.simulationSaveCoalescing=true;
 out.simulationRenderCoalescing=true;
 out.runtimeErrorBoundary=true;
 out.stateIntegrityChecks=true;
 out.volatileLogsBounded=true;
 out.dungeonEmptyStateExplainsDiscovery=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC342_TEST=function(){
 const old=state,oldErr=safeLocalGet('grimCompanyLastRuntimeError');
 try{
  safeLocalRemove('grimCompanyLastRuntimeError');
  state=createState('Fast Stability Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=500;
  const f=gc260CreateFounderRecord('veyric',{name:'Fast Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=10;f.dailyOrder='Train';
  const crew=[];
  for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=8;state.roster.push(a);crew.push(a)}
  const p=makeParty('veyric','Fast Test Party');p.members=crew.map(a=>a.id);p.captainId=crew[0].id;p.missions=4;state.parties.push(p);
  const c=gc250FreshContractForRisk('veyric',2,[]);gc193EnsureContract(c);
  p.expedition={contract:c,progress:25,elapsedDays:.2,durationDays:2,expectedReturnDay:3,events:[],checks:[],battle:null,fought:false,complete:false,gcChecksDone:1,gc199FieldProgress:.1,gc201Momentum:0,gc201ContactExposure:.1,gc260BattleDecisionDone:true};
  crew.forEach(a=>a.status='Expedition');
  startBattle(p);
  if(!p.expedition?.battle)throw new Error('Could not create combat for fast stability test.');
  p.expedition.battle.allies.forEach(u=>{u.maxHp=Math.max(999,u.maxHp);u.hp=u.maxHp});
  p.expedition.battle.enemies.forEach(u=>{u.maxHp=Math.max(999,u.maxHp);u.hp=u.maxHp});
  state.timeSystem.gc199Mode='fast';
  const before={ss:GC342_STATS.suppressedSaves,sr:GC342_STATS.suppressedRenders,as:GC342_STATS.actualSaves,ar:GC342_STATS.actualRenders,cs:GC342_STATS.clockSkips,ks:GC342_STATS.cardSkips};
  const step=(typeof GC201_COMBAT_STEP_DAYS!=='undefined'?GC201_COMBAT_STEP_DAYS:.015)*1.08;
  for(let i=0;i<16;i++)gc199AdvanceFieldClocks(step);
  for(let i=0;i<20;i++)gc199UpdateClock();
  if(typeof gc331RefreshExpeditionCard==='function')for(let i=0;i<8;i++)gc331RefreshExpeditionCard(p.id);
  const after={ss:GC342_STATS.suppressedSaves,sr:GC342_STATS.suppressedRenders,as:GC342_STATS.actualSaves,ar:GC342_STATS.actualRenders,cs:GC342_STATS.clockSkips,ks:GC342_STATS.cardSkips};
  const savesBatched=after.ss>before.ss;
  const rendersBatched=after.sr>before.sr;
  const clockThrottled=after.cs>before.cs;
  const cardThrottled=after.ks>before.ks;
  const fastStill4x=gc199Speed()===4;
  const integrity=gc342StateIntegrity().ok;
  const dungeonEmpty=gc341DungeonBoardHTML('veyric',false).includes('Survey the Wilds');
  const serializable=!!JSON.parse(JSON.stringify(state)).timeSystem;
  const noCapturedError=!safeLocalGet('grimCompanyLastRuntimeError')&&!state.founderSystem?.gc341LastRuntimeError&&GC342_STATS.errors===0;
  gc342FlushSave(true);
  return{ok:!!(savesBatched&&rendersBatched&&clockThrottled&&cardThrottled&&fastStill4x&&integrity&&dungeonEmpty&&serializable&&noCapturedError),savesBatched,rendersBatched,clockThrottled,cardThrottled,fastStill4x,integrity,dungeonEmpty,serializable,noCapturedError,delta:{suppressedSaves:after.ss-before.ss,suppressedRenders:after.sr-before.sr,actualSaves:after.as-before.as,actualRenders:after.ar-before.ar,clockSkips:after.cs-before.cs,cardSkips:after.ks-before.ks}};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;
  if(oldErr)safeLocalSet('grimCompanyLastRuntimeError',oldErr);else safeLocalRemove('grimCompanyLastRuntimeError');
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};
