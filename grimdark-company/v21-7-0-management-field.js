/* Grim Company v21.7 — meaningful managerial preparation and contingency. */
const _combatRoundGC370=combatRound;
combatRound=function(p){
 const e=p?.expedition,b=e?.battle;
 if(e&&b&&e.gc370ManagerId){
  const r=e.gc370RegionId,x=gc370Config(r),manager=gc280Commander(r);
  /* Level 5: one real field treatment during a dangerous battle. */
  if(e.gc370AidKit&&!e.gc370AidKitUsed){
   const ally=alive(b.allies).filter(u=>!u.gc320Downed).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
   if(ally&&ally.hp/Math.max(1,ally.maxHp)<.45){
    const healed=Math.min(ally.maxHp-ally.hp,Math.max(8,Math.round(ally.maxHp*.28)));
    if(healed>0){
     ally.hp+=healed;e.gc370AidKitUsed=true;
     if(x&&x.performance.managerId===e.gc370ManagerId)x.performance.aidKits++;
     b.log.push('COMMANDER PREPARATION — Emergency field kit restores '+healed+' HP to '+ally.name+'.');
    }
   }
  }
  /* Level 15: a contingency can withdraw an imperiled autonomous party.
     Directly controlled parties are never affected. No false rescue guarantee. */
  if(e.gc370Contingency&&b.round>=2&&!e.gc260PendingDecision&&!e.gc370FallbackUsed){
   const living=alive(b.allies),enemies=alive(b.enemies);
   const hp=living.reduce((s,u)=>s+u.hp/Math.max(1,u.maxHp),0)/Math.max(1,living.length);
   const enemyHP=enemies.reduce((s,u)=>s+u.hp/Math.max(1,u.maxHp),0)/Math.max(1,enemies.length);
   const limit=e.gc370RiskPolicy==='Conservative'?.37:e.gc370RiskPolicy==='Ruthless'?.12:.24;
   if(living.length&&enemies.length&&hp<limit&&enemyHP>.32&&p.id&&x?.performance.managerId===e.gc370ManagerId){
    e.gc370FallbackUsed=true;x.performance.retreats++;
    gc370Record(r,'retreat','Contingency withdrawal: '+p.name+' was close to collapse.');
    return gc320RetreatParty(p.id);
   }
  }
 }
 return _combatRoundGC370(p);
};
const _auditGC370=audit;
audit=function(){
 const x=_auditGC370();
 x.v370RegionalCommand=GC370_VERSION;
 x.managerStandingOrders=true;x.managerApprovalsAndTreasuryReserve=true;
 x.managerLevelMilestoneBenefits=true;x.managerRarityBenefits=true;
 x.managerPerformanceRecord=true;x.managerContingencyRetreat=true;
 return x;
};
window.__BL_AUDIT=audit;
