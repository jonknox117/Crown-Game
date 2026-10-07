/* Grim Company v21.3.2 — freelance presentation and regression coverage. */

const _gc310FreebladeContractCardGC332=gc310FreebladeContractCard;
gc310FreebladeContractCard=function(c){
 let html=_gc310FreebladeContractCardGC332(c);
 html=html.replace('Crew available','Fresh healthy crew assembled on acceptance');
 return html.replace('<div class="actions">','<div class="gc332FreelanceRule">You are accepting work as one freelancer. The organizer fills the remaining slots with healthy available mercenaries; this is not a persistent party.</div><div class="actions">');
};

const _gc320IndependentCardGC332=gc320IndependentCard;
gc320IndependentCard=function(c){
 let html=_gc320IndependentCardGC332(c);
 return html.replace('<div class="actions">','<div class="gc332FreelanceRule">Fresh healthy mercenaries are assembled for each personal contract. Previous crew members may reappear later, but are never forced into the next job.</div><div class="actions">');
};

function gc332InstallStyles(){
 if(document.getElementById('gc332Styles'))return;
 const st=document.createElement('style');st.id='gc332Styles';
 st.textContent='.gc332FreelanceRule{margin:7px 0;padding:7px 8px;border-left:2px solid #8f7449;background:#15130f;border-radius:4px;font-size:7px;line-height:1.35;color:#938879}';
 document.head.appendChild(st);
}
gc332InstallStyles();

const _auditGC332=audit;
audit=function(){
 const out=_auditGC332();
 out.v332FreelancerCrewFix=GC332_VERSION;
 out.freelanceCrewIsTemporary=true;
 out.freelanceCrewAlwaysHealthy=true;
 out.freelanceCrewRotates=true;
 out.injuredFreelancersNotForcedBack=true;
 out.sameThreeNotPreferred=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC332_TEST=function(){
 const old=state;
 try{
  gc270CreateFreebladeState('veyric',{name:'Freelance Rotation Test',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1});
  const f=gc260Founder();gc260System().gc332RecentFreelancers=[];
  const pool=gc310EnsurePool('veyric');
  pool.slice(0,4).forEach(a=>{a.injury='Badly Bruised';a.recovery=3;a.hp=Math.max(1,Math.round(derived(a).maxHp*.35));a.status='Freelancer'});
  const c=gc310FreebladeContracts()[0];
  const home=gc332HoldingParty(f),temp1=gc332CreateFreelanceCrew(c),crew1=gc310AssembleCrew(c,temp1);
  const healthy1=crew1.length===gc310CrewSize(c)-1&&crew1.every(a=>!a.injury&&!a.recovery&&a.hp===derived(a).maxHp);
  const ids1=crew1.map(a=>a.id);
  gc310ReturnFreelancers(temp1,ids1,c.regionId);gc332RestoreFounderHome(temp1);
  const temp2=gc332CreateFreelanceCrew(c),crew2=gc310AssembleCrew(c,temp2),ids2=crew2.map(a=>a.id);
  const noImmediateRepeat=ids2.every(id=>!ids1.includes(id));
  const healthy2=crew2.every(a=>!a.injury&&!a.recovery&&a.hp===derived(a).maxHp);
  const ephemeral=temp2.gc332EphemeralFreelance===true&&home.id===temp2.gc332HoldingPartyId&&temp2.id!==home.id;
  gc310ReturnFreelancers(temp2,ids2,c.regionId);gc332RestoreFounderHome(temp2);
  const restored=!!state.parties.find(p=>p.id===home.id&&p.members.length===1&&p.members[0]===f.id)&&!state.parties.some(p=>p.gc332EphemeralFreelance);
  const knownStillPersistent=ids1.every(id=>!!gc310KnownFreelancer(id,'veyric'));
  const injuredNotSelected=pool.slice(0,4).every(a=>!ids1.includes(a.id)&&!ids2.includes(a.id));
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=copy.progression.phase==='freeblade'&&copy.parties.some(p=>p.gc332FreebladeHolding);
  return{ok:!!(healthy1&&healthy2&&noImmediateRepeat&&ephemeral&&restored&&knownStillPersistent&&injuredNotSelected&&saveSafe),healthy1,healthy2,noImmediateRepeat,ephemeral,restored,knownStillPersistent,injuredNotSelected,saveSafe,firstCrew:ids1,secondCrew:ids2};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
