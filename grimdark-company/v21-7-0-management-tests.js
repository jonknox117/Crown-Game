/* Grim Company v21.7 — appointment, authority, quality and save tests. */
window.__GC370_TEST=function(){
 const old=state;
 try{
  state=createState('Regional Command Test','veyric');
  state.regions.veyric.hq.established=true;state.regions.skeld.hq.established=true;
  gc270Progression().phase='network';state.company.silver=2500;
  const f=gc260CreateFounderRecord('veyric',{name:'Management Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';
  const lead=generateAdventurer('veyric');lead.lvl=20;lead.missions=40;lead.status='Ready';state.roster.push(lead);
  const troop=[];
  for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.lvl=i===0?2:12;a.missions=i===0?0:25;a.status='Ready';state.roster.push(a);troop.push(a)}
  const p=makeParty('veyric','Managed Veterans');p.members=troop.slice(0,3).map(a=>a.id);p.captainId=troop[0].id;state.parties.push(p);
  const appointed=gc280Appoint('veyric',lead.id)===true;
  const orders=gc370ChangeOrders('veyric',{priority:'Balanced',risk:'Conservative',spending:'Ask',authority:'Major',reserve:250,actionCap:50});
  const x=gc370Config('veyric'),capability=gc370Talent(lead);
  const tiered=capability.prep&&capability.personnel&&capability.contingency&&capability.master&&capability.logistics&&capability.assessment&&capability.coordination&&capability.adaptation;
  gc280BuildParties('veyric');
  const captainImproved=p.captainId!==troop[0].id&&gc370Rank(state.roster.find(a=>a.id===p.captainId))>=3;
  const board=gc250EnsureRiskBoard('veyric'),c=board.find(c=>c.risk===4);
  const qualified=!!c&&gc320PartyQualification(p,c).ok;
  const queued=!!c&&!gc280Dispatch('veyric',p,c);
  const dispatchQ=x.requests.find(q=>q.kind==='dispatch'),approvalQueued=queued&&!!dispatchQ&&!p.expedition;
  const approved=!!dispatchQ&&gc370ResolveRequest('veyric',dispatchQ.id,true);
  const dispatched=approved&&!!p.expedition&&p.expedition.gc370ManagerId===lead.id&&p.expedition.gc370AidKit===true;
  const legacyPolicy=gc370Config('veyric').priority==='Balanced'&&gc280EffectivePolicy('veyric')==='Conservative';
  /* The approval queue is bounded and deduplicates repeat requests. */
  const once=gc370Ask('veyric','charter','test-key','Charter test',25);
  const again=gc370Ask('veyric','charter','test-key','Charter test',25);
  const dedup=!!once&&once.id===again?.id;
  const declined=gc370ResolveRequest('veyric',once.id,false)&&x.performance.declines===1;
  gc280OpenCommand('veyric');
  const hasUI=!!document.getElementById('gc370Priority')&&!!document.getElementById('gc370Authority')&&document.getElementById('sheet')?.innerHTML.includes('ACCOUNTABILITY');
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saved=copy.regions.veyric.gc280Command.gc370;
  const saveSafe=saved.priority==='Balanced'&&saved.reserve===250&&saved.performance.managerId===lead.id&&saved.performance.dispatches===1;
  const untouchedRarity=gc360Rank(troop[0])===0&&gc360Rank(lead)===4;
  return{ok:!!(appointed&&orders&&tiered&&captainImproved&&qualified&&approvalQueued&&dispatched&&legacyPolicy&&dedup&&declined&&hasUI&&saveSafe&&untouchedRarity),appointed,orders,tiered,captainImproved,qualified,approvalQueued,dispatched,legacyPolicy,dedup,declined,hasUI,saveSafe,untouchedRarity,requests:x.requests.length};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}
 finally{state=old;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};
