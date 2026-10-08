/* v21.9.3 QA: personal room scaling, map-side managers, in-place live numbers. */
window.__GC393_TEST=function(){
 const old=state,results={};
 try{
  state=createState('Room Management QA','veyric');
  gc270Progression().phase='freeblade';
  const f=gc260CreateFounderRecord('veyric',{
   name:'Room QA',race:'Human',culture:'Veyric',
   className:'March Ranger',gender:'Male',portrait:1
  },true);
  f.status='Ready';f.lvl=1;f.missions=0;
  const pr=gc340Presence();pr.mode='town';pr.regionId='veyric';pr.place='hall';
  state.ui.tab='you';render();
  results.chapterhouse=gc340TownHTML().includes('HOME • PERSONAL LEADERSHIP')&&gc390WorkBonus('veyric','Train')===1.05;
  results.novice=GC390_STANCES.every(st=>Math.abs(gc393PersonalMultiplier(st,f)-GC393_BASE_PRESENCE[st])<.00001);
  for(const [place,stance] of [['scout','Scout'],['odd','Odd Jobs'],['train','Train'],['recover','Recover']]){
   gc340Move(place);f.dailyOrder=stance;
   const html=gc340TownHTML();
   results['novice_'+place]=html.includes('by '+Math.round((GC393_BASE_PRESENCE[stance]-1)*100)+'%')&&
    gc340At(stance,'veyric')&&html.includes('Level 1');
  }
  f.lvl=20;f.missions=40;
  results.veteran=GC390_STANCES.every(st=>gc393PersonalMultiplier(st,f)>GC393_BASE_PRESENCE[st]+.12);
  for(const [place,stance] of [['scout','Scout'],['odd','Odd Jobs'],['train','Train'],['recover','Recover']]){
   gc340Move(place);f.dailyOrder=stance;
   results['veteran_'+place]=gc340TownHTML().includes('Level 20')&&
    gc340TownHTML().includes('Legendary career')&&
    gc340TownHTML().includes('by '+Math.round((gc393PersonalMultiplier(stance,f)-1)*100)+'%');
  }
  gc340Move('train');
  gc340StartFocused('personalDrill');
  pr.activity.remainingDays=pr.activity.durationDays*.4;
  gc351TargetedPatch();
  results.liveFocus=!!document.querySelector('.gc340Activity small')?.textContent.includes('1.0h remaining')&&
   Math.abs(parseFloat(document.querySelector('[data-gc340-activitybar]')?.style.width)-60)<.01;
  gc340CancelFocused();
  f.xp=7;render();f.xp=13;
  const freeStatsBefore=document.querySelector('.gc260PersonalStats,.gc270PersonalStats');
  gc351TargetedPatch();
  const freeStatsAfter=document.querySelector('.gc260PersonalStats,.gc270PersonalStats');
  results.liveFreeblade=!!freeStatsBefore&&freeStatsBefore===freeStatsAfter&&
   freeStatsAfter.textContent.includes('13/');
  state.ui.tab='region';render();
  const region=state.regions.veyric,oldThreat=Math.round(region.threat);
  region.threat=oldThreat+7;gc351TargetedPatch();
  const threat=Array.from(document.querySelectorAll('.regionStat')).find(x=>x.querySelector('span')?.textContent==='THREAT');
  results.liveWorld=!!threat&&threat.querySelector('b')?.textContent===String(Math.round(region.threat))&&
   Math.abs(parseFloat(threat.querySelector('.meter i')?.style.width)-region.threat)<.01;
  state.ui.tab='you';render();
  state.company.silver=12;render();const founding=document.querySelector('.gc270Founding');
  state.company.silver+=11;gc351TargetedPatch();
  results.liveFounding=!!founding&&founding.isConnected&&founding.textContent.includes('Silver 23/')&&
   parseFloat(founding.querySelector('.bar i')?.style.width)>0;
  gc270Progression().phase='company';state.regions.veyric.hq.established=true;
  const manager=generateAdventurer('veyric');manager.status='Ready';manager.lvl=10;manager.missions=12;state.roster.push(manager);
  gc340Move('hall');state.ui.tab='you';render();
  const grid=document.querySelector('.gc393RoomManagement');
  results.mapManagement=!!grid&&grid.querySelectorAll('.gc393RoomPost').length===4&&
   grid.querySelector('.gc393HomeManager')?.textContent.includes('REGIONAL DIRECTOR');
  const picker=grid?.querySelector('[data-action="gc390PickPost"][data-stance="Train"]');
  if(picker)processAction(picker);
  results.picker=!!document.getElementById('modal')?.classList.contains('show')&&
   document.getElementById('sheet')?.textContent.includes('Drillmaster');
  document.getElementById('modal')?.classList.remove('show');
  const assigned=gc390SetPost('veyric','Train',manager.id);
  results.assigned=assigned===true&&gc390StanceLead('veyric','Train')?.id===manager.id;
  state.ui.tab='you';render();
  results.assignedOnMap=document.querySelector('.gc393RoomPost[data-stance="Train"] [data-gc393-post]')?.textContent.includes(manager.name)===true;
  state.ui.tab='company';state.ui.gc330CompanySub='overview';render();
  manager.dailyOrder='Train';gc200Work(manager).gc201TrainFraction=.21;
  gc351TargetedPatch();
  const stanceNode=Array.from(document.querySelectorAll('.gc201Stance')).find(x=>x.querySelector('.gc201StanceHead b')?.textContent==='TRAIN');
  gc200Work(manager).gc201TrainFraction=.72;
  gc351TargetedPatch();
  const pct=stanceNode?.querySelector(':scope > i em')?.style.width;
  results.liveStance=!!stanceNode&&stanceNode.isConnected&&Math.abs(parseFloat(pct)-72)<.1;
  const clone=normalizeState(JSON.parse(JSON.stringify(state)));
  results.saveSafe=clone.regions.veyric.hq.gc390Posts.Train===manager.id&&gc342StateIntegrity().ok;
  const failed=Object.keys(results).filter(key=>!results[key]);
  return{ok:failed.length===0,failed,...results,pct,liveStats:window.__GC393_LIVE_STATS?.()};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),results}}
 finally{state=old;try{document.getElementById('modal')?.classList.remove('show');render()}catch(_){}}
};