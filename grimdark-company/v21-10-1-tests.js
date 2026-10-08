/* v21.10.1 — regressions from real full-health recruits locked as freelancers. */
window.__GC411_TEST=function(){
 const original=state,checks={};
 try{
  state=createState('Signed Recruit QA','veyric');
  gc270Progression().phase='company';
  state.regions.veyric.hq.established=true;
  state.company.silver=10000;
  const f=gc260CreateFounderRecord('veyric',{
   name:'Recruit QA',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1
  },true);
  f.status='Ready';
  const stale=generateAdventurer('veyric');
  stale.name='Stale Signed Adventurer';
  stale.status='Freelancer';stale.dailyOrder='Train';
  stale.gc310Freelancer=false;stale.gc310Temporary=false;
  stale.hp=derived(stale).maxHp;
  state.roster.push(stale);
  state.regions.veyric.gc310Freelancers=[stale];
  const loaded=normalizeState(JSON.parse(JSON.stringify(state)));
  checks.oldSaveRepaired=loaded.roster.find(a=>a.id===stale.id)?.status==='Ready';
  checks.poolCleaned=!loaded.regions.veyric.gc310Freelancers.some(a=>a.id===stale.id);
  checks.hpUnchanged=loaded.roster.find(a=>a.id===stale.id)?.hp===stale.hp;
  checks.trainingPreserved=loaded.roster.find(a=>a.id===stale.id)?.dailyOrder==='Train';
  state=loaded;
  const party=makeParty('veyric','Signed People QA');party.members=[f.id];party.captainId=f.id;
  state.parties.push(party);
  state.ui.tab='company';state.ui.gc330CompanySub='parties';
  render();renderModalParty(party.id);
  const button=document.querySelector('#sheet [data-action="toggleMember"][data-id="'+stale.id+'"]');
  checks.addEnabled=!!button&&!button.disabled;
  if(button)processAction(button);
  checks.joinedParty=party.members.includes(stale.id);
  checks.trainingWorks=gc201Team('veyric','Train').some(a=>a.id===stale.id)&&
   gc201TrainingRate(state.roster.find(a=>a.id===stale.id))>0;
  document.getElementById('modal')?.classList.remove('show');
  const candidate=generateAdventurer('veyric');
  candidate.name='New Hired Contractor';
  candidate.status='Freelancer';candidate.dailyOrder='Train';
  candidate.gc310Freelancer=true;candidate.gc310Temporary=false;
  candidate.hp=derived(candidate).maxHp;
  state.regions.veyric.recruits.push(candidate);
  state.regions.veyric.gc310Freelancers.push(candidate);
  hireRecruit(candidate.id);
  const signed=state.roster.find(a=>a.id===candidate.id);
  checks.hireSucceeded=!!signed;
  checks.hireReady=signed?.status==='Ready'&&!signed.gc310Freelancer&&!signed.gc310Temporary;
  checks.hireTraining=gc201Team('veyric','Train').some(a=>a.id===candidate.id);
  checks.noDoublePool=!state.regions.veyric.gc310Freelancers.some(a=>a.id===candidate.id);
  renderModalParty(party.id);
  const second=document.querySelector('#sheet [data-action="toggleMember"][data-id="'+candidate.id+'"]');
  checks.newHireAddEnabled=!!second&&!second.disabled;
  if(second)processAction(second);
  checks.newHireJoined=party.members.includes(candidate.id);
  const freeCopy=JSON.parse(JSON.stringify(state));
  freeCopy.progression.phase='freeblade';
  const temporary=generateAdventurer('veyric');temporary.status='Freelancer';
  temporary.gc310Temporary=true;freeCopy.roster.push(temporary);
  checks.freebladeUntouched=gc411RepairSignedPeople(freeCopy)===0&&temporary.status==='Freelancer';
  checks.portraitBoot=typeof blPortraitHTML==='function';
  checks.saveIntegrity=gc342StateIntegrity().ok;
  const failed=Object.keys(checks).filter(k=>!checks[k]);
  return{ok:failed.length===0,failed,...checks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),checks}}
 finally{state=original;document.getElementById('modal')?.classList.remove('show');try{render()}catch(_){}}
};
