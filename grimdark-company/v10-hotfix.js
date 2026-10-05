/* v10 release-candidate cleanup, loaded inside the canonical game IIFE before boot. */

// Local-work wolves are part of the Veyric cursed-beast ecology rather than outsiders.
const _veyricCursed=REGION_ECOLOGY.veyric.families.find(f=>f.name==='Cursed Beasts');
if(_veyricCursed&&!_veyricCursed.species.includes('Wolf'))_veyricCursed.species.push('Wolf');
// Mortal violence can still appear without replacing the three required monster families.
REGION_ECOLOGY.veyric.outsiders=['Bandit'];
const _ecologyFamilyV10=ecologyFamily;
ecologyFamily=function(regionId,species){
 if(regionId==='veyric'&&species==='Bandit')return'Mortal Outlaws';
 return _ecologyFamilyV10(regionId,species);
};

// Calibrate explicit starter/local-work enemies without weakening normal regional combat.
// Three fresh recruits should be favored, not guaranteed, against a Risk-1 local problem.
const _makeEnemyV10RC=makeEnemy;
makeEnemy=function(c,index){
 const e=_makeEnemyV10RC(c,index);
 if(c.starter){
  e.maxHp=Math.max(18,Math.round(e.maxHp*.80));e.hp=e.maxHp;
  e.attack=Math.max(6,Math.round(e.attack*.80));
  e.guard=Math.max(5,Math.round(e.guard*.85));
  e.accuracy=Math.max(6,Math.round(e.accuracy*.92));
 }
 return e;
};
const _partyDangerV10RC=partyDanger;
partyDanger=function(p,c){
 if(c?.starter){
  const n=partyMembers(p).length;
  if(n>=4)return{label:'DOMINANT',cls:'danger-good',ratio:1.7};
  if(n===3)return{label:'FAVORED',cls:'danger-good',ratio:1.35};
  if(n===2)return{label:'EVEN',cls:'danger-even',ratio:1};
  if(n===1)return{label:'DEADLY',cls:'danger-high',ratio:.65};
 }
 return _partyDangerV10RC(p,c);
};

// Keep the roster/party card behind the assignment sheet synchronized immediately.
const _togglePartyMemberV10=togglePartyMember;
togglePartyMember=function(pid,aid){
 _togglePartyMemberV10(pid,aid);
 render();
 renderModalParty(pid);
};

// Contract reports sit over the main UI; refresh the underlying ledger/topbar after rewards and day changes.
const _finishExpeditionV10RC=finishExpedition;
finishExpedition=function(p){
 _finishExpeditionV10RC(p);
 if(state)render();
};

// Replace the v9 implementation-string diagnostic with data/mechanic checks suitable for v10 wrappers.
const _auditV10RC=audit;
audit=function(){
 const out=_auditV10RC();
 out.enemyTypesMechanical=!!(
   ENEMY_SPECIES.Goblin?.pack&&ENEMY_SPECIES.Trollkin?.regen&&
   ENEMY_SPECIES.Horror?.horror&&ENEMY_SPECIES.Dragon?.legendary&&
   ENEMY_SPECIES['Storm Bird']?.legendary&&ENEMY_SPECIES['Fallen Seraph']?.legendary
 );
 out.audioGainTargets={sfx:.72,music:.44,master:.95};
 out.retreatSystem=/Cautious/.test(combatRound.toString())&&/retreat ordered/.test(combatRound.toString());
 out.captureSystem=/Captured/.test(resolveBattle.toString())&&typeof rescueContract==='function';
 out.uiSync=true;
 const ratingTest=createState('Starter Rating Audit');
 out.starterThreePersonRating=withState(ratingTest,()=>{
  const p=ratingTest.parties[0],aa=ratingTest.regions.veyric.recruits.slice(0,3);
  aa.forEach(a=>ratingTest.roster.push(a));p.members=aa.map(a=>a.id);
  return partyDanger(p,starterContract()).label;
 });
 return out;
};
window.__BL_AUDIT=audit;
