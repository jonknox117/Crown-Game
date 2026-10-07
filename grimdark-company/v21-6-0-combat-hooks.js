/* Grim Company v21.6.0 — integrate class conditions with existing attacks.
   Battle-only states survive mid-fight saves and never require a new clock. */
const _startBattleGC360=startBattle;
startBattle=function(p){
 const out=_startBattleGC360(p),b=p?.expedition?.battle;
 if(b){
  (b.allies||[]).forEach(x=>{x.gc360Cooldowns=x.gc360Cooldowns||{}});
  b.log.push('TACTICAL COMBAT — class passives, basic actions and unlocked abilities are active.');
 }
 return out;
};

const _chooseEnemyTargetGC360=chooseEnemyTarget;
chooseEnemyTarget=function(allies,enemy){
 const taunt=allies.find(x=>x.charId===enemy.gc360TauntId&&x.hp>0&&!x.gc320Downed);
 if(taunt&&enemy.gc360TauntUntil>=(state.parties.find(p=>p.expedition?.battle?.enemies?.includes(enemy))?.expedition.battle.round||0))return taunt;
 const candidates=allies.filter(x=>!(x.gc360DodgeUntil>=(state.parties.find(p=>p.expedition?.battle?.enemies?.includes(enemy))?.expedition.battle.round||0))) ;
 return _chooseEnemyTargetGC360(candidates.length?candidates:allies,enemy);
};

const _allyAttackGC360=allyAttack;
allyAttack=function(actor,target,p){
 if(!target)return;
 const round=p?.expedition?.battle?.round||0;
 const was=target.guard;
 if(target.gc360ArmorUntil>=round)target.guard=Math.max(1,Math.round(target.guard*.66));
 if(target.gc360ExposedUntil>=round)target.guard=Math.max(1,Math.round(target.guard*.77));
 try{return _allyAttackGC360(actor,target,p)}finally{target.guard=was}
};

const _enemyAttackGC360=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=p?.expedition?.battle;if(!b||!target)return;
 const round=b.round;
 if(actor.gc360StaggerUntil>=round){
  gc360BattleLine(b,actor.name+' loses this turn, interrupted by a class technique.');
  delete actor.gc360StaggerUntil;return;
 }
 /* Redirect one imminent attack to a living protector, preserving real danger. */
 const proxy=b.allies.find(x=>x.charId===target.gc360ProtectorId&&x.hp>0&&!x.gc320Downed);
 if(proxy&&target.gc360ProtectorUntil>=round&&proxy!==target){
  gc360BattleLine(b,proxy.name+' intercepts an attack meant for '+target.name+'.');
  delete target.gc360ProtectorId;target=proxy;
 }
 const oldGuard=target.guard,oldAttack=actor.attack,oldAccuracy=actor.accuracy;
 const ward=target.gc360WardCharges>0,guard=target.gc360GuardUntil>=round;
 const blessing=!!target.gc360LastStand;
 const hpBefore=target.hp;
 if(guard)target.guard=Math.round(oldGuard*1.85);
 if(ward)target.guard=Math.round(target.guard*1.65);
 if(target.gc360ExposedUntil>=round)target.guard=Math.max(1,Math.round(target.guard*.73));
 if(actor.gc360CurseUntil>=round)actor.attack=Math.max(1,Math.round(oldAttack*.62));
 if(actor.gc360BlindUntil>=round)actor.accuracy=Math.max(1,Math.round(oldAccuracy*.38));
 /* Buffered HP prevents the older downed wrapper from firing before a rescue
    can be applied. Only the specific protected blow can use this buffer. */
 const buffer=blessing?Math.max(250,target.maxHp*3):0;
 if(buffer)target.hp+=buffer;
 let out;
 try{out=_enemyAttackGC360(actor,target,p)}
 finally{actor.attack=oldAttack;actor.accuracy=oldAccuracy;target.guard=oldGuard}
 const damage=Math.max(0,hpBefore+buffer-target.hp);
 if(buffer){
  target.hp=Math.max(0,hpBefore-damage);
  if(target.hp<=0){
   target.hp=1;target.gc360LastStand=false;
   gc360BattleLine(b,(target.gc360LastStandBy||'An ally')+' prevents a fatal blow against '+target.name+'.');
  }
 }
 if(ward&&damage>0){target.gc360WardCharges=Math.max(0,(target.gc360WardCharges||0)-1)}
 if(target.gc360RiposteUntil>=round&&damage>0&&actor.hp>0){
  const strike=Math.max(4,Math.round(target.attack*.48-actor.guard*.12));
  actor.hp=Math.max(0,actor.hp-strike);
  delete target.gc360RiposteUntil;
  gc360BattleLine(b,target.name+' COUNTERS '+actor.name+' for '+strike+' damage.');
 }
 return out;
};

const _combatRoundGC360=combatRound;
combatRound=function(p){
 const b=p?.expedition?.battle;if(!b)return _combatRoundGC360(p);
 const next=b.round+1;
 (b.enemies||[]).forEach(x=>{
  if(x.hp>0&&x.gc360Bleeding&&x.gc360Bleeding.until>=next){
   const amount=x.gc360Bleeding.damage||2;
   x.hp=Math.max(0,x.hp-amount);
   gc360BattleLine(b,x.name+' takes '+amount+' ongoing BLEED damage.');
  }
  if(x.gc360Bleeding&&x.gc360Bleeding.until<next)delete x.gc360Bleeding;
 });
 const out=_combatRoundGC360(p);
 return out;
};

const _auditGC360Actions=audit;
audit=function(){
 const a=_auditGC360Actions();
 a.classActionEngine=true;a.classActionsUseActualTurns=true;
 a.combatConditionsHaveDuration=true;a.guardAndPositionActions=true;
 a.downingAndDeathStillHandledByExistingEngine=true;
 return a;
};
window.__BL_AUDIT=audit;
