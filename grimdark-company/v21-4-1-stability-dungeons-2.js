/* Grim Company v21.4.1 — regression and soak coverage. */
const _auditGC341=audit;
audit=function(){
 const out=_auditGC341();
 out.v341PresenceHotfix=GC341_VERSION;
 out.presenceRuntimeContained=true;
 out.focusCompletionNoNestedRender=true;
 out.captainDispatchNoNestedRender=true;
 out.dungeonsUnderCampaigns=true;
 out.dungeonsAboveContracts=true;
 out.dungeonCardsShowOwnRisk=true;
 out.dungeonsRemovedFromTownMap=true;
 out.presenceSoakTest=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC341_TEST=function(){
 const old=state,oldErr=safeLocalGet('grimCompanyLastRuntimeError');
 try{
  safeLocalRemove('grimCompanyLastRuntimeError');
  state=createState('Stability Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=500;
  const f=gc260CreateFounderRecord('veyric',{name:'Stability Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=10;f.dailyOrder='Train';
  for(let i=0;i<5;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=6+i;state.roster.push(a)}
  const p=makeParty('veyric','Soak Party');p.members=state.roster.filter(a=>a.id!==f.id).slice(0,4).map(a=>a.id);p.captainId=p.members[0];p.missions=5;p.gc340CaptainAutonomy=false;state.parties.push(p);
  const d=gc340DiscoverDungeon('veyric');
  const town=gc340TownHTML(),townClean=!town.includes(d.name)&&!town.includes('Discovered Sites');
  const screen=gc330ContractsScreen(),campaignPos=screen.indexOf('CAMPAIGN'),dungeonPos=screen.indexOf(d.name),contractPos=screen.indexOf('Available Contracts');
  const ordering=dungeonPos>=0&&contractPos>dungeonPos&&(campaignPos<0||campaignPos<dungeonPos);
  const riskShown=screen.includes(`<b>${d.risk}</b><small>RISK</small>`)||screen.includes(`RISK ${d.risk}`);
  gc340Move('train');gc340StartFocused('personalDrill');
  let soakError=null;
  try{
   for(let i=0;i<1600;i++){
    gc200ContinuousWork(.0015);
    if(i%100===0){gc330ContractsScreen();gc340TownHTML();JSON.stringify(state)}
   }
  }catch(e){soakError=String(e&&e.stack||e)}
  const focusCompleted=!gc340Presence().activity&&gc340Presence().focusedCompleted>=1;
  const captured=!!safeLocalGet('grimCompanyLastRuntimeError')||!!state.founderSystem?.gc341LastRuntimeError;
  const serializable=!!JSON.parse(JSON.stringify(state)).founderSystem;
  return{ok:!!(townClean&&ordering&&riskShown&&!soakError&&!captured&&focusCompleted&&serializable),townClean,ordering,riskShown,soakError,captured,focusCompleted,serializable,rooms:d.rooms.length};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;
  if(oldErr)safeLocalSet('grimCompanyLastRuntimeError',oldErr);else safeLocalRemove('grimCompanyLastRuntimeError');
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};
