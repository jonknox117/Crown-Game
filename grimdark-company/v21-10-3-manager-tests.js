/* v21.10.3 — real expedition behavior, save migration, party ownership. */
window.__GC413_TEST=function(){
 const before=state,r={};
 try{
  state=createState('Simple Manager Regression','veyric');
  state.regions.veyric.hq.established=true;
  state.regions.skeld.hq.established=true;
  gc270Progression().phase='network';
  state.company.silver=2200;
  const founder=gc260CreateFounderRecord('veyric',{
   name:'Owner',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1
  },true);
  founder.status='Ready';
  const leader=generateAdventurer('veyric');
  leader.name='Manager';leader.status='Ready';leader.lvl=20;leader.missions=40;
  state.roster.push(leader);
  const make=(name,count=3)=>{
   const crew=[];
   for(let i=0;i<count;i++){
    const a=generateAdventurer('veyric');
    a.status='Ready';a.dailyOrder='Train';a.lvl=20;a.missions=40;
    a.hp=derived(a).maxHp;
    state.roster.push(a);crew.push(a);
   }
   const p=makeParty('veyric',name);
   p.members=crew.map(a=>a.id);p.captainId=crew[0].id;state.parties.push(p);
   return{p,crew};
  };
  const active=make('Working Crew'),healing=make('Recovery Crew'),manual=make('Manual Crew'),waiting=make('Available Crew');
  const player=makeParty('veyric','Founder Crew');player.members=[founder.id];player.captainId=founder.id;state.parties.push(player);
  manual.p.gc413Manual=true;
  const board=gc250EnsureRiskBoard('veyric');
  r.contractsAvailable=board.length>=5;
  const beforeComposition=state.parties.map(p=>({id:p.id,members:p.members.join(','),captain:p.captainId}));
  const beforeRosterSize=state.roster.length,beforeParties=state.parties.length,
   beforeJobs=state.roster.map(a=>[a.id,a.dailyOrder]);
  r.memberCannotBeAppointed=gc280Appoint('veyric',active.crew[0].id)===false;
  const appointed=gc280Appoint('veyric',leader.id)===true;
  r.appointed=appointed;
  const x=gc413Orders('veyric'),c=gc280CommandState('veyric');
  r.threeModes=['Conservative','Normal','Ruthless'].every(v=>!!GC413_RISK[v]);
  const sample=waiting.p;
  x.risk='Conservative';
  const conservative=gc413PickContract('veyric',sample)?.risk||0;
  x.risk='Normal';
  const normal=gc413PickContract('veyric',sample)?.risk||0;
  x.risk='Ruthless';
  const ruthless=gc413PickContract('veyric',sample)?.risk||0;
  r.riskPreference=conservative===1&&ruthless===5&&normal>=conservative&&normal<=ruthless;
  x.risk='Normal';
  /* All members must finish healing — even a fractional HP shortfall blocks. */
  const patient=healing.crew[1];patient.hp=derived(patient).maxHp-.5;
  r.blocksNotFullHP=!gc413Ready(healing.p,'veyric')&&gc413PartyState(healing.p,'veyric')==='Recovering';
  const sampleContract=gc413PickContract('veyric',sample);
  r.blocksUnhealedDirect=!gc280Dispatch('veyric',healing.p,sampleContract);
  c.autonomy=true;
  const sent=gc280CommandAct('veyric');
  r.healthyDispatched=sent&&!!active.p.expedition&&!!active.p.expedition.gc370ManagerId;
  r.unhealedStayed=healing.p.expedition===null||!healing.p.expedition;
  r.manualUntouched=!manual.p.expedition;
  r.founderUntouched=!player.expedition;
  r.noAutohire=beforeRosterSize===state.roster.length;
  r.noAutocharter=beforeParties===state.parties.length;
  r.noReorganization=beforeComposition.every(b=>{
   const p=state.parties.find(x=>x.id===b.id);
   return p&&p.members.join(',')===b.members&&p.captainId===b.captain;
  });
  r.noJobReassignment=beforeJobs.every(([id,job])=>state.roster.find(a=>a.id===id)?.dailyOrder===job);
  patient.hp=derived(patient).maxHp;
  r.readyWhenFull=gc413Ready(healing.p,'veyric');
  const sentAfterRecovery=gc280CommandAct('veyric');
  r.recoveredDispatched=sentAfterRecovery&&!!healing.p.expedition;
  const remaining=waiting.p;
  c.autonomy=false;
  const beforePending=!!remaining.expedition;
  gc280CommandAct('veyric');
  r.pauseRespected=!beforePending&&!remaining.expedition;
  c.autonomy=true;remaining.gc413Manual=true;
  gc280CommandAct('veyric');
  r.manualToggleRespected=!remaining.expedition;
  remaining.gc413Manual=false;
  gc280OpenCommand('veyric');
  const sheet=document.getElementById('sheet');
  r.simpleUI=!!sheet?.querySelector('.gc413ManagerBoard')&&sheet.querySelectorAll('[data-action="gc413Policy"]').length===3&&
    !sheet.querySelector('#gc370Priority')&&!sheet.querySelector('[data-action="gc370Approve"]');
  r.counts=gc413Totals('veyric').Working>=2&&gc413Totals('veyric').Recovering===0;
  r.perks=active.p.expedition.gc370AidKit===true&&active.p.expedition.gc370Contingency===true;
  const stored=JSON.parse(JSON.stringify(state));
  const oldSettings=stored.regions.veyric.gc280Command.gc370;
  oldSettings.gc413Version='old';oldSettings.requests=[{kind:'charter',id:'stale'}];
  const recovered=normalizeState(stored);
  const x2=recovered.regions.veyric.gc280Command.gc370;
  r.migrationSafe=x2.gc413Version===GC413_VERSION&&x2.requests.length===0&&
    recovered.parties.find(p=>p.id===manual.p.id).gc413Manual===true&&
    recovered.regions.veyric.gc280Command.commanderId===leader.id;
  const failed=Object.entries(r).filter(([key,val])=>!val).map(([key])=>key);
  return{ok:failed.length===0,failed,...r,policies:{conservative,normal,ruthless}};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),partial:r}}
 finally{state=before;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};
/* The old test functions assumed commanders reorganize rosters and request
   financial approvals. The replacement tests the new real behavior instead. */
window.__GC280_TEST=window.__GC413_TEST;
window.__GC370_TEST=window.__GC413_TEST;
