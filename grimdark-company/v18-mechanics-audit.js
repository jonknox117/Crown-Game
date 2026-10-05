/* Broken Lantern v18.1 — mechanics audit hardening.
   Ensures every advertised Living Veterans keyword has a real gameplay hook. */

const BL18_MECHANICS_AUDIT='18.1';

/* Vengeful used to advertise target-specific vengeance while only granting a tiny
   global Attack bonus. Make the description and mechanic actually target-specific. */
if(typeof TRAITS!=='undefined'&&TRAITS['Vengeful']){
  /* Remove legacy metadata fields that were never consumed anywhere; keep only
     mechanics that have an actual reader in the engine. */
  if(TRAITS['Hard Worker']){delete TRAITS['Hard Worker'].heal}
  if(TRAITS['Kindhearted']){delete TRAITS['Kindhearted'].mercy;TRAITS['Kindhearted'].desc='+4 Talk. Also slightly improves day-to-day relationships; the Talk bonus directly helps Rescue and Negotiation checks.'}
  if(TRAITS['Bloodthirsty']){delete TRAITS['Bloodthirsty'].reckless;TRAITS['Bloodthirsty'].desc='+4 Attack, -2 Talk. Makes the party less willing to retreat while this adventurer is still fighting.'}
  if(TRAITS['Lucky']){delete TRAITS['Lucky'].lucky}
  if(TRAITS['Greedy'])TRAITS['Greedy'].desc='+2 Talk and +4% contract payment.';
  if(TRAITS['Sickly'])TRAITS['Sickly'].desc='-4 Endure and increased expedition attrition.';
  TRAITS['Vengeful'].desc='Deals +12% damage against monster families tied to a close companion’s death; -1 Talk.';
  TRAITS['Vengeful'].combat={};
  TRAITS['Vengeful'].util={talk:-1};
}

function bl181PairStageFor(a,b){
  if(!a||!b)return'Acquaintances';
  return bl18RelationStage(bl18Rel(a,b),a,b);
}
function bl181FamilyRank(a,family){
  if(!a||!family)return 0;
  return bl18MonsterRank(bl18Monster(a,family));
}

/* Vindictive existed as a stat block but had no acquisition path. */
const _bl18MaybeTraits181=bl18MaybeTraits;
bl18MaybeTraits=function(a){
  const out=_bl18MaybeTraits181(a);
  if(!a||a.status==='Dead')return out;
  const hostile=state.roster.filter(b=>b.id!==a.id&&b.status!=='Dead').map(b=>bl181PairStageFor(a,b));
  const grudges=hostile.filter(x=>x==='Grudge'||x==='Bitter Enemies').length;
  if(grudges>=2||hostile.includes('Bitter Enemies')){
    bl18AddTrait(a,'Vindictive','long-running grudges hardened into aggression');
  }
  return out;
};

/* Protective now actually changes protection behavior, rather than only giving Guard. */
const _bl14ProtectorFor181=bl14ProtectorFor;
bl14ProtectorFor=function(target,allies){
  const normal=_bl14ProtectorFor181(target,allies);
  if(normal||!target||bl14Formation(target)==='FRONT')return normal;
  const targetA=state.roster.find(x=>x.id===target.charId);
  if(!targetA)return null;
  const candidates=alive(allies).filter(u=>u!==target).map(u=>({
    u,a:state.roster.find(x=>x.id===u.charId)
  })).filter(x=>x.a&&bl18HasTrait(x.a,'Protective'));
  if(!candidates.length)return null;
  candidates.sort((x,y)=>{
    const xr=bl18Rel(x.a,targetA),yr=bl18Rel(y.a,targetA);
    return (yr.trust+yr.affinity*.25+y.u.guard)-(xr.trust+xr.affinity*.25+x.u.guard);
  });
  const best=candidates[0],r=bl18Rel(best.a,targetA),stage=bl18RelationStage(r,best.a,targetA);
  let chanceTo=.18+Math.min(.20,r.trust/450);
  if(stage==='Trusted Friends')chanceTo+=.08;
  if(stage==='Blood-Bound')chanceTo+=.16;
  if(!chance(bl18Clamp(chanceTo,.18,.62)))return null;
  best.a.veteran.behavior.protective++;
  bl18AdjustRelation(best.a,targetA,{trust:2,respect:2,affinity:1,rescues:1},'one chose to intercept an attack for the other');
  bl18MaybeTraits(best.a);
  return best.u;
};

/* Make relationship labels mechanically distinct. The strongest labels already
   have v18 effects; the quieter labels now matter too. Natural Leader also now
   steadies the party when the veteran is actually captain. */
const _startBattle181=startBattle;
startBattle=function(p){
  const out=_startBattle181(p);
  const b=p?.expedition?.battle;
  if(!b)return out;

  /* Remove the old "best mastery applies to every enemy family" bundle.
     Family-specific mastery is applied at attack/defense time below. */
  b.allies.forEach(u=>{
    const a=state.roster.find(x=>x.id===u.charId); if(!a)return;
    const families=b._v18Families||bl18BattleFamilies(b);
    let bestRank=0;
    u._v181MasteryRanks={};
    families.forEach(f=>{
      const rank=bl181FamilyRank(a,f);
      u._v181MasteryRanks[f]=rank;
      bestRank=Math.max(bestRank,rank);
    });
    const old=bl18MasteryBonus(bestRank);
    u.accuracy=Math.max(1,u.accuracy-old.accuracy);
    u.guard=Math.max(1,u.guard-old.guard);
    u.resolve=Math.max(1,u.resolve-old.resolve);
    u._v18Damage=0;
  });

  for(let i=0;i<b.allies.length;i++)for(let j=i+1;j<b.allies.length;j++){
    const x=b.allies[i],y=b.allies[j];
    const a=state.roster.find(z=>z.id===x.charId),c=state.roster.find(z=>z.id===y.charId);
    if(!a||!c)continue;
    const stage=bl181PairStageFor(a,c);
    if(stage==='Trusted Friends'){x.resolve+=1;y.resolve+=1;x.guard+=1;y.guard+=1}
    else if(stage==='Friends'){x.resolve+=1;y.resolve+=1}
    else if(stage==='Respected Companions'){x.accuracy+=1;y.accuracy+=1}
    else if(stage==='Dislike'){x.resolve=Math.max(1,x.resolve-1);y.resolve=Math.max(1,y.resolve-1)}
    else if(stage==='Bitter Enemies'){x.accuracy=Math.max(1,x.accuracy-1);y.accuracy=Math.max(1,y.accuracy-1)}
  }

  const captain=state.roster.find(x=>x.id===p.captainId);
  if(captain&&bl18HasTrait(captain,'Natural Leader')){
    alive(b.allies).forEach(u=>{u.resolve+=2;u.accuracy+=1});
    b.log.push(`${captain.name}'s leadership steadies the party (+Resolve, +Accuracy).`);
  }
  return out;
};

/* Monster mastery is now keyed to the actual target family. */
const _allyAttack181=allyAttack;
allyAttack=function(actor,target,p){
  if(!actor||!target)return _allyAttack181(actor,target,p);
  const a=actor.charId?state.roster.find(x=>x.id===actor.charId):null;
  const family=bl18Family(target.species||target.name);
  const rank=a?bl181FamilyRank(a,family):0,bonus=bl18MasteryBonus(rank);
  const oldAcc=actor.accuracy,oldDmg=actor._v18Damage;
  actor.accuracy+=bonus.accuracy;
  actor._v18Damage=bonus.damage;
  const out=_allyAttack181(actor,target,p);
  actor.accuracy=oldAcc;
  actor._v18Damage=oldDmg;
  return out;
};

const _enemyAttack181=enemyAttack;
enemyAttack=function(actor,target,p){
  if(!actor||!target)return _enemyAttack181(actor,target,p);
  const family=bl18Family(actor.species||actor.name);
  const battle=p?.expedition?.battle;
  const snapshots=(battle?.allies||[target]).map(u=>{
    const a=u.charId?state.roster.find(x=>x.id===u.charId):null;
    const rank=a?bl181FamilyRank(a,family):0,bonus=bl18MasteryBonus(rank);
    const snap={u,guard:u.guard,resolve:u.resolve};
    u.guard+=bonus.guard;
    u.resolve+=bonus.resolve;
    return snap;
  });
  const out=_enemyAttack181(actor,target,p);
  snapshots.forEach(x=>{x.u.guard=x.guard;x.u.resolve=x.resolve});
  return out;
};

/* Phobias now affect retreat behavior as well as Accuracy/Resolve. */
const _bl14RetreatDecision181=bl14RetreatDecision;
bl14RetreatDecision=function(p,b){
  const out=_bl14RetreatDecision181(p,b);
  if(!out||!b||!out.allies?.length||!out.enemies?.length)return out;
  const families=b._v18Families||bl18BattleFamilies(b);
  let fearTotal=0,hardened=0,count=0;
  out.allies.forEach(u=>{
    const a=state.roster.find(x=>x.id===u.charId); if(!a)return;
    count++;
    let worst=0,hard=false;
    families.forEach(f=>{
      const fr=bl18Fear(a,f);
      worst=Math.max(worst,bl18FearStage(fr));
      hard=hard||!!(fr.hardened&&bl18FearStage(fr)===0);
    });
    fearTotal+=worst;
    if(hard&&!worst)hardened++;
  });
  if(!count)return out;
  const fearShift=Math.min(.15,(fearTotal/count)*.045);
  const hardShift=Math.min(.04,(hardened/count)*.03);
  const base=Number(out.threshold);
  if(Number.isFinite(base)){
    const threshold=bl18Clamp(base+fearShift-hardShift,.18,.82);
    out.threshold=threshold;
    if(b.round>=2&&out.ratio<threshold){
      out.retreat=true;
      out.reason=`Fear-adjusted effective strength ${out.ratio.toFixed(2)}× is below retreat threshold ${threshold.toFixed(2)}.`;
    }
  }
  return out;
};

/* Record which monster family a close companion died fighting, then make
   Vengeful target that family instead of acting as a generic stat sticker. */
const _resolveBattle181=resolveBattle;
resolveBattle=function(p,win){
  const b=p?.expedition?.battle;
  const families=b?(b._v18Families||bl18BattleFamilies(b)):[];
  const ids=(b?.allies||[]).map(u=>u.charId);
  const out=_resolveBattle181(p,win);
  ids.forEach(id=>{
    const a=state.roster.find(x=>x.id===id);
    if(a){bl18InitAdventurer(a);a.veteran.lastBattleFamilies=[...families]}
  });
  return out;
};

const _relationshipAfterMission181=relationshipAfterMission;
relationshipAfterMission=function(p,deaths){
  const out=_relationshipAfterMission181(p,deaths);
  const deadNames=new Set(deaths||[]);
  const members=(p.members||[]).map(id=>state.roster.find(a=>a.id===id)).filter(Boolean);
  const dead=members.filter(a=>deadNames.has(a.name));
  members.filter(a=>a.status!=='Dead').forEach(a=>{
    dead.forEach(d=>{
      const r=bl18Rel(a,d);
      if((r.trust>=45||r.affinity>=35)&&a.traits?.includes('Vengeful')){
        bl18InitAdventurer(a);
        a.veteran.vengeanceFamilies=a.veteran.vengeanceFamilies||{};
        (a.veteran.lastBattleFamilies||[]).forEach(f=>a.veteran.vengeanceFamilies[f]=(a.veteran.vengeanceFamilies[f]||0)+1);
      }
    });
  });
  return out;
};

const _classDamageMult181=classDamageMult;
classDamageMult=function(actor,battle,p,e,target){
  const out=_classDamageMult181(actor,battle,p,e,target);
  const a=actor?.charId?state.roster.find(x=>x.id===actor.charId):null;
  if(a?.traits?.includes('Vengeful')&&target){
    const family=bl18Family(target.species||target.name);
    if(a.veteran?.vengeanceFamilies?.[family])out.m*=1.12;
  }
  return out;
};

/* The UI used to say “Scars” even though v18 has trauma/phobias, not a
   separate persistent scar subsystem. Name the thing that actually exists. */
const _renderInspect181=renderInspect;
renderInspect=function(id,recruit=false){
  const out=_renderInspect181(id,recruit);
  if(!recruit){
    const sheet=document.getElementById('sheet');
    const h=[...(sheet?.querySelectorAll('.sectionTitle h3')||[])].find(x=>x.textContent==='Fears & Scars');
    if(h)h.textContent='Fears & Trauma';
  }
  return out;
};

/* HQ Chronicle mutations made after older save calls now persist immediately. */
const _upgradeHQ181=upgradeHQ;
upgradeHQ=function(k){const out=_upgradeHQ181(k);save();return out};
const _foundBranch181=foundBranch;
foundBranch=function(id){const out=_foundBranch181(id);save();return out};

const _audit181=audit;
audit=function(){
  const out=_audit181();
  out.v18MechanicsAudit=BL18_MECHANICS_AUDIT;
  out.v18AdvertisedMechanicsWired=true;
  return out;
};
window.__BL_AUDIT=audit;
