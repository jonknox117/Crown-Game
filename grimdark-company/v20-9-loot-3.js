/* Grim Company v20.9 — equipment combat hooks. */
function gc290IsBoss(p,target){
 const c=p?.expedition?.contract;
 return !!(target?.bossId||target?.role==='Campaign Nemesis'||(c?.gc240BossName&&target?.name===c.gc240BossName));
}
function gc290BattleUsed(e,key){
 e.gc290Used=e.gc290Used||{};
 if(e.gc290Used[key])return true;
 e.gc290Used[key]=true;
 return false;
}
function gc290ApplyBattleStart(p){
 const e=p?.expedition,b=e?.battle;
 if(!b||b.gc290Started)return;
 b.gc290Started=true;b.gc290Attacks={};b.gc290Fury={};b.gc290FirstRoundAttack={};
 const horror=(b.enemies||[]).some(x=>x.horror);
 b.allies.forEach(u=>{
  const a=state.roster.find(x=>x.id===u.charId);if(!a)return;
  gc290EachPower(a,pow=>{
   if(pow.trigger==='battleStart'){
    u.guard=Math.round(u.guard*(1+(Number(pow.guard)||0)));
    u.resolve+=Number(pow.resolve)||0;
    if(pow.firstRoundAttack)b.gc290FirstRoundAttack[u.charId]=Number(pow.firstRoundAttack);
   }
   if(pow.trigger==='battleStartHorror'&&horror){
    u.guard=Math.round(u.guard*(1+(Number(pow.guard)||0)));
    u.resolve+=Number(pow.resolve)||0;
   }
   if(pow.trigger==='bondBattle'){
    const bonded=p.members.some(id=>id!==a.id&&relValue(a.id,id)>=25);
    if(bonded){
     const amt=Number(pow.amount)||0;
     u.attack=Math.round(u.attack*(1+amt));
     u.guard=Math.round(u.guard*(1+amt));
     b.log.unshift(a.name+"'s "+pow.name+' answers a trusted companion.');
    }
   }
  });
 });
}
const _startBattleGC290=startBattle;
startBattle=function(p){
 const out=_startBattleGC290(p);
 if(p?.expedition?.battle)gc290ApplyBattleStart(p);
 return out;
};

function gc290ApplyKillPowers(a,actor,target,p,b){
 gc290EachPower(a,pow=>{
  if(pow.trigger==='kill'){
   actor.hp=Math.min(actor.maxHp,actor.hp+Math.max(1,Math.round(actor.maxHp*(Number(pow.heal)||0))));
   b.log.push(pow.name+' restores '+a.name+'.');
  }
  if(pow.trigger==='killFury'){
   const cur=b.gc290Fury[a.id]||0,max=Number(pow.max)||4;
   if(cur<max){
    b.gc290Fury[a.id]=cur+1;
    actor.attack=Math.round(actor.attack*(1+(Number(pow.amount)||0)));
    b.log.push(pow.name+' grows stronger with the kill.');
   }
  }
  if(pow.trigger==='killBoss'&&gc290IsBoss(p,target)){
   actor.hp=Math.min(actor.maxHp,actor.hp+Math.max(1,Math.round(actor.maxHp*(Number(pow.heal)||0))));
   b.log.push(pow.name+' drinks in the fall of a named enemy.');
  }
 });
}
const _allyAttackGC290=allyAttack;
allyAttack=function(actor,target,p){
 const b=p?.expedition?.battle,a=state.roster.find(x=>x.id===actor?.charId),before=target?.hp||0;
 const wasFirst=b?!(b.gc290Attacks?.[actor.charId]):false;
 const out=_allyAttackGC290(actor,target,p);
 if(!b||!a||!target)return out;
 b.gc290Attacks=b.gc290Attacks||{};
 b.gc290Attacks[actor.charId]=(b.gc290Attacks[actor.charId]||0)+1;
 const dealt=Math.max(0,before-target.hp);
 let extra=0;
 if(dealt>0&&target.hp>0){
  gc290EachPower(a,pow=>{
   if(pow.trigger==='firstAttack'&&wasFirst)extra+=dealt*(Number(pow.amount)||0);
   if(pow.trigger==='attackLowTarget'&&before/Math.max(1,target.maxHp)<=Number(pow.threshold||.35))extra+=dealt*(Number(pow.amount)||0);
   if(pow.trigger==='attackBoss'&&gc290IsBoss(p,target))extra+=dealt*(Number(pow.amount)||0);
   if(pow.trigger==='attackSupernatural'&&target.supernatural)extra+=dealt*(Number(pow.amount)||0);
  });
  if(b.round===1&&b.gc290FirstRoundAttack?.[actor.charId])extra+=dealt*b.gc290FirstRoundAttack[actor.charId];
  if(extra>0){
   const hp0=target.hp,bonus=Math.max(1,Math.round(extra));
   target.hp=Math.max(0,target.hp-bonus);
   b.log.push(a.name+"'s equipment adds "+bonus+' damage.');
   if(hp0>0&&target.hp<=0){
    a.kills++;
    b.log.push(target.name+' falls to the follow-through.');
   }
  }
 }
 if(before>0&&target.hp<=0)gc290ApplyKillPowers(a,actor,target,p,b);
 return out;
};

function gc290TrySaveAlly(p,target,damage){
 const e=p?.expedition,b=e?.battle;
 if(!e||!b||target.hp>0)return false;
 for(const u of b.allies){
  if(u.charId===target.charId||u.hp<=0)continue;
  const a=state.roster.find(x=>x.id===u.charId);if(!a)continue;
  const hit=gc290PowerMatches(a,'saveAlly')[0];if(!hit)continue;
  const key=hit.p.id+':'+a.id;
  if(gc290BattleUsed(e,key))continue;
  target.hp=1;
  const transferred=Math.max(1,Math.round(damage*(Number(hit.p.transfer)||.55)));
  u.hp=Math.max(0,u.hp-transferred);
  b.log.push(a.name+"'s "+hit.p.name+' keeps '+target.name+' standing at 1 HP; '+a.name+' takes '+transferred+'.');
  return true;
 }
 return false;
}
const _enemyAttackGC290=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=p?.expedition?.battle,a=state.roster.find(x=>x.id===target?.charId),before=target?.hp||0;
 const out=_enemyAttackGC290(actor,target,p);
 if(!b||!a||before<=0)return out;
 const damage=Math.max(0,before-target.hp);
 if(damage<=0)return out;
 gc290EachPower(a,pow=>{
  if(pow.trigger==='lowHpGuard'&&target.hp/Math.max(1,target.maxHp)<=(Number(pow.threshold)||.35)){
   const restore=Math.min(damage,Math.round(damage*(Number(pow.amount)||0)));
   if(restore>0){
    target.hp=Math.min(target.maxHp,target.hp+restore);
    b.log.push(pow.name+' absorbs '+restore+' damage for '+a.name+'.');
   }
  }
  if(pow.trigger==='lowHpHeal'&&target.hp>0&&target.hp/Math.max(1,target.maxHp)<=(Number(pow.threshold)||.30)){
   b.gc290LowHeal=b.gc290LowHeal||{};
   const key=pow.id+':'+a.id;
   if(!b.gc290LowHeal[key]){
    b.gc290LowHeal[key]=true;
    const heal=Math.max(1,Math.round(target.maxHp*(Number(pow.heal)||0)));
    target.hp=Math.min(target.maxHp,target.hp+heal);
    b.log.push(pow.name+' restores '+heal+' HP to '+a.name+'.');
   }
  }
 });
 gc290TrySaveAlly(p,target,damage);
 return out;
};
