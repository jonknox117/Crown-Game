/* Grim Company v21.6.0 — final progression and action consistency. */
/* The independent mercenary board remains available after company founding.
   Its grade requirement must match both the normal freeblade board and dungeons. */
gc320IndependentEligible=function(c){
 const f=gc260Founder(),need=GC360_RISK_RANK[clamp(Number(c?.risk)||1,1,5)];
 const available=!!(f&&f.status==='Ready'&&!gc260System()?.activity&&!gc260FounderParty()?.expedition);
 const rank=gc360Rank(f);
 return{ok:available&&rank>=need,need,rank,available,level:f?.lvl||0,rarity:gc360RiskName(c?.risk)};
};
const _gc320IndependentCardGC360=gc320IndependentCard;
gc320IndependentCard=function(c){
 const html=_gc320IndependentCardGC360(c),gate=gc320IndependentEligible(c);
 return html.replace(/Risk \d+ requires you to be Lv\.\d+\+/g,'Risk '+c.risk+' requires '+gate.rarity+'+ career rarity')
  .replace('Your experience is not yet sufficient.','Earn '+gate.rarity+' career rarity to qualify.');
};
const _gc320TakeIndependentGC360=gc320TakeIndependent;
gc320TakeIndependent=function(cid){
 const c=contractById(cid),gate=c&&gc320IndependentEligible(c);
 if(c?.gc320Independent&&gate&&!gate.ok){
  return toast(!gate.available?'Return to town and become available first.':'Need '+gate.rarity+' career rarity for Risk '+c.risk+'.');
 }
 return _gc320TakeIndependentGC360(cid);
};
const _gc310AcceptContractGC360=gc310AcceptContract;
gc310AcceptContract=function(cid){
 const c=contractById(cid),gate=c&&gc310Eligibility(c);
 if(c&&gate&&!gate.ok)return toast('Need '+gc360RiskName(c.risk)+' career rarity for Risk '+c.risk+'.');
 return _gc310AcceptContractGC360(cid);
};

/* At critical health, Guard costs a standard action; at dangerous but not critical
   health, Reposition may evade the next targeted blow. Neither is a free turn. */
const _supportActionGC360Basic=supportAction;
supportAction=function(actor,p){
 const b=p?.expedition?.battle;
 if(b&&actor?.charId&&actor.hp>0&&!actor.gc320Downed){
  const ratio=actor.hp/Math.max(1,actor.maxHp);
  const since=Number(actor.gc360BasicRepositionRound)||-100;
  if(ratio>=.27&&ratio<.58&&(actor.gc360DodgeUntil||0)<b.round&&b.round-since>=3
       &&alive(b.allies).length>1){
   actor.gc360DodgeUntil=b.round+1;
   actor.gc360BasicRepositionRound=b.round;
   gc360BattleLine(b,actor.name+' REPOSITIONS instead of attacking and evades the next targeted attack.');
   return true;
  }
 }
 return _supportActionGC360Basic(actor,p);
};

/* Shield mastery prevents one potentially fatal hit, never infinite revivals. */
const _gc360ShouldUseFinal=gc360ShouldUse;
gc360ShouldUse=function(t,ctx){
 if(t.kind==='deathSave'&&ctx.actor.gc360LastStandSpent)return false;
 return _gc360ShouldUseFinal(t,ctx);
};
const _gc360UseTalentFinal=gc360UseTalent;
gc360UseTalent=function(t,ctx,p){
 const success=_gc360UseTalentFinal(t,ctx,p);
 if(success&&t.kind==='deathSave')ctx.actor.gc360LastStandSpent=true;
 return success;
};
/* Legacy basic Guard still works after its previous defensive window expires. */
const _supportActionGC360Guard=supportAction;
supportAction=function(actor,p){
 if(actor&&actor.gc360GuardUntil&&p?.expedition?.battle?.round>actor.gc360GuardUntil)
  actor.gc360GuardUntil=0;
 return _supportActionGC360Guard(actor,p);
};

/* Delegated commanders must obey the same career qualification.
   Their casualty policy still influences preferences, not legal access. */
gc280RiskAllowed=function(regionId,p,risk){
 return gc320PartyQualification(p,{risk}).ok;
};

const _auditGC360F=audit;
audit=function(){
 const a=_auditGC360F();
 a.independentWorkUsesCareerRarity=true;
 a.delegatedCommandUsesCareerRarity=true;
 a.basicRepositionCostsAction=true;
 a.lastStandOneUsePerBattle=true;
 return a;
};
window.__BL_AUDIT=audit;
window.__GC360_FINAL_TEST=function(){
 const old=state;
 try{
  state=createState('Independent Tier Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';
  const f=gc260CreateFounderRecord('veyric',{name:'Tier Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=20;f.missions=0;
  const novice=!gc320IndependentEligible({risk:5}).ok;
  f.missions=40;f.lvl=1;
  const veteran=gc320IndependentEligible({risk:5}).ok;
  const panel=gc320IndependentCard({risk:5,id:'fake',type:'Job',species:'Bandit',title:'Test',desc:'Test',reward:50,enemyCount:5,regionId:'veyric'});
  const textCorrect=panel.includes('Legendary+ career rarity')&&!panel.includes('Lv.15');
  const p=makeParty('veyric','Rarity Captain');p.members=[f.id];p.captainId=f.id;state.parties.push(p);
  const delegatedVeteran=gc280RiskAllowed('veyric',p,5);
  f.missions=0;f.lvl=20;
  const delegatedNovice=!gc280RiskAllowed('veyric',p,5);
  return{ok:novice&&veteran&&textCorrect&&delegatedVeteran&&delegatedNovice,novice,veteran,textCorrect,delegatedVeteran,delegatedNovice};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};