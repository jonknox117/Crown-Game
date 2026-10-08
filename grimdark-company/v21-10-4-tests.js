/* v21.10.4 casualty-replacement regression suite. */
window.__GC414_TEST=function(){
 const previous=state,results={};
 try{
  state=createState('Casualty Manager Test','veyric');
  state.regions.veyric.hq.established=true;
  state.regions.skeld.hq.established=true;
  gc270Progression().phase='network';
  state.company.silver=3000;
  const founder=gc260CreateFounderRecord('veyric',{
    name:'Player',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1
  },true);
  founder.status='Ready';
  const boss=generateAdventurer('veyric');boss.status='Ready';boss.lvl=15;
  state.roster.push(boss);
  const make=(label,count=2)=>{
   const crew=Array.from({length:count},()=>{
    const a=generateAdventurer('veyric');a.status='Ready';a.hp=derived(a).maxHp;
    a.dailyOrder='Train';state.roster.push(a);return a;
   });
   const p=makeParty('veyric',label);p.members=crew.map(x=>x.id);
   p.captainId=crew[0].id;state.parties.push(p);return{p,crew};
  };
  const victimParty=make('Veteran Patrol'),manualParty=make('Manual Veterans',1),captainParty=make('Captain Company',2);
  const noVacancy=makeParty('veyric','Intentionally Small');state.parties.push(noVacancy);
  const appointed=gc280Appoint('veyric',boss.id)===true,cmd=gc280CommandState('veyric');
  cmd.autonomy=true;
  results.appointed=appointed;
  const config=gc414Config('veyric');
  results.offByDefault=config.gc414AutoReplaceDead===false;
  const lost=victimParty.crew[1],beforeIds=[...victimParty.p.members];
  lost.status='Dead';lost.hp=0;
  victimParty.p.members=victimParty.p.members.filter(id=>id!==lost.id);
  results.confirmedDeath=gc414DeathRecord(victimParty.p,beforeIds,victimParty.p.captainId)===1;
  results.deadRecorded=gc414Vacancies(victimParty.p)[0]?.deadId===lost.id;
  results.hiringDisabled=!gc414HireReplacement('veyric',victimParty.p)&&
    victimParty.p.members.length===1;
  config.gc414AutoReplaceDead=true;
  const candidate=generateAdventurer('veyric');
  candidate.status='Freelancer';candidate.gc310Freelancer=true;candidate.gc310Temporary=false;
  candidate.className=lost.className;candidate.lvl=lost.lvl;
  candidate.hp=derived(candidate).maxHp;
  const alternative=generateAdventurer('veyric');alternative.className='Other Class';
  state.regions.veyric.recruits=[candidate,alternative];
  state.regions.veyric.gc310Freelancers=[candidate];
  const cost=gc201HireCost(candidate),silver=state.company.silver;
  const idsBefore=[...victimParty.p.members],captainBefore=victimParty.p.captainId;
  const success=gc414HireReplacement('veyric',victimParty.p);
  const hired=state.roster.find(a=>a.id===candidate.id);
  results.hiredSuccess=success&&!!hired;
  results.realCost=state.company.silver===silver-cost;
  results.notFromAnotherParty=manualParty.p.members.join(',')===manualParty.crew.map(a=>a.id).join(',');
  results.exactClassPreferred=hired?.className===lost.className;
  results.formerFreelancerReady=hired?.status==='Ready'&&!hired.gc310Freelancer;
  results.unchangedCaptain=victimParty.p.captainId===captainBefore;
  results.unchangedSurvivors=idsBefore.every(id=>victimParty.p.members.includes(id));
  results.inOriginalSlot=victimParty.p.members[1]===candidate.id;
  results.noRemainingVacancy=gc414Vacancies(victimParty.p).length===0;
  results.noDuplicateRecruit=!state.regions.veyric.recruits.some(a=>a.id===candidate.id)&&
    !state.regions.veyric.gc310Freelancers.some(a=>a.id===candidate.id);
  results.neverFillsIntentionalGap=noVacancy.members.length===0&&gc414Vacancies(noVacancy).length===0;
  manualParty.p.gc413Manual=true;
  const other=manualParty.crew[0],manualBefore=[...manualParty.p.members];
  other.status='Dead';other.hp=0;manualParty.p.members=[];
  gc414DeathRecord(manualParty.p,manualBefore,manualParty.p.captainId);
  results.manualNoHire=!gc414HireReplacement('veyric',manualParty.p)&&
    gc414Vacancies(manualParty.p).length===1;
  const captain=captainParty.crew[0],capIds=[...captainParty.p.members];
  captain.status='Dead';captain.hp=0;captainParty.p.members=captainParty.p.members.filter(id=>id!==captain.id);
  gc414DeathRecord(captainParty.p,capIds,captain.id);
  results.deadCaptainVacant=captainParty.p.captainId===null;
  const successor=generateAdventurer('veyric');successor.status='Ready';successor.hp=derived(successor).maxHp;
  state.regions.veyric.recruits=[successor];
  const capHire=gc414HireReplacement('veyric',captainParty.p);
  results.hireCaptainSlot=capHire&&captainParty.p.members.includes(successor.id);
  results.captainRequiresPlayer=captainParty.p.captainId===null&&!gc413Ready(captainParty.p,'veyric');
  const empty=generateAdventurer('veyric');
  empty.status='Ready';empty.hp=derived(empty).maxHp;state.regions.veyric.recruits=[empty];
  const filledState=state.company.silver;
  results.noRepeatHire=!gc414HireReplacement('veyric',victimParty.p)&&
    state.company.silver===filledState;
  results.respectsNoFunds=(()=>{
   const backup=state.company.silver;
   const m=manualParty.p; m.gc413Manual=false;state.company.silver=0;
   const denied=!gc414HireReplacement('veyric',m)&&gc414Vacancies(m).length===1;
   state.company.silver=backup;return denied;
  })();
  const toggledOff=(()=>{
   const on=config.gc414AutoReplaceDead;
   config.gc414AutoReplaceDead=false;
   const blocked=!gc414HireReplacement('veyric',manualParty.p);
   config.gc414AutoReplaceDead=on;return blocked;
  })();
  results.respectsToggleOff=toggledOff;
  gc280OpenCommand('veyric');
  results.toggleVisible=!!document.getElementById('sheet')?.querySelector('[data-action="gc414ReplaceToggle"]');
  results.stanceUntouched=state.roster.find(a=>a.id===victimParty.crew[0].id)?.dailyOrder==='Train';
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),restore=copy.regions.veyric.gc280Command.gc370;
  results.savePersistsOption=restore.gc414AutoReplaceDead===true;
  results.savePersistsVacancy=copy.parties.find(p=>p.id===manualParty.p.id)?.gc414Vacancies?.length===1;
  const failed=Object.entries(results).filter(([k,v])=>!v).map(([k])=>k);
  return{ok:!failed.length,failed,...results};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),partial:results}}
 finally{state=previous;document.getElementById('modal')?.classList.remove('show');try{render()}catch(_){}}
};
