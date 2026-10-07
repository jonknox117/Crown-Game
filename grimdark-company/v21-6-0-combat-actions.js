/* Grim Company v21.6.0 — class action engine, phase 1.
   Runs inside the existing per-unit battle sequence; no timers or extra turns by default. */
function gc360Context(actor,p){
 const b=p?.expedition?.battle;
 if(!b||!actor||!actor.charId)return null;
 const a=state.roster.find(x=>x.id===actor.charId);
 if(!a||a.status==='Dead')return null;
 actor.gc360Cooldowns=actor.gc360Cooldowns||{};
 return{b,a,actor,allies:alive(b.allies),enemies:alive(b.enemies)};
}
function gc360Lowest(list){return list.slice().sort((x,y)=>x.hp/Math.max(1,x.maxHp)-y.hp/Math.max(1,y.maxHp))[0]||null}
function gc360Strongest(list){return list.slice().sort((x,y)=>y.attack-x.attack)[0]||null}
function gc360Backliner(list){
 return list.find(x=>['Archer','Shaman','Stalker'].includes(x.role))||gc360Lowest(list);
}
function gc360Target(kind,ctx){
 const {allies,enemies,actor}=ctx;
 if(['heal','multiHeal','cleanse','ward','petGuard','teamGuard','martyr','deathSave'].includes(kind))return gc360Lowest(allies.filter(x=>x!==actor))||actor;
 if(kind==='revive')return ctx.b.allies.find(x=>x.gc320Downed)||null;
 if(['silence','disarm','curse','taunt','stagger','blind'].includes(kind))return gc360Strongest(enemies);
 if(['execute','rampage','bleed','hound'].includes(kind))return gc360Lowest(enemies);
 if(['charge','teleport','reposition','pin'].includes(kind))return gc360Backliner(enemies);
 if(kind==='cleanse')return allies.find(x=>x.gc360Bleeding||x.gc360ExposedUntil||x.gc360CurseUntil)||gc360Lowest(allies);
 return gc360Strongest(enemies);
}
function gc360ShouldUse(t,ctx){
 const {b,actor,allies,enemies}=ctx,k=t.kind;
 if(!enemies.length)return false;
 if(k==='revive')return !!b.allies.find(x=>x.gc320Downed);
 if(k==='heal')return allies.some(x=>x.hp/x.maxHp<.72);
 if(k==='multiHeal')return allies.filter(x=>x.hp/x.maxHp<.8).length>=2;
 if(k==='cleanse')return allies.some(x=>x.gc360Bleeding||x.gc360ExposedUntil>=b.round||x.gc360CurseUntil>=b.round);
 if(k==='deathSave'||k==='martyr')return allies.some(x=>x.hp/x.maxHp<.45);
 if(k==='execute'||k==='rampage')return enemies.some(x=>x.hp/x.maxHp<.70);
 if(k==='teamGuard'||k==='ward'||k==='petGuard'||k==='parry'||k==='brace'||k==='riposte')
  return !(actor.gc360GuardUntil>=b.round+1)&&!(actor.gc360RiposteUntil>=b.round+1);
 if(k==='reposition'||k==='teleport')return !(actor.gc360DodgeUntil>=b.round+1);
 return true;
}
function gc360Strike(actor,target,p,boost=1,armorPierce=0){
 if(!target||target.hp<=0)return false;
 const oldA=actor.attack,oldG=target.guard;
 try{actor.attack=Math.max(1,Math.round(oldA*boost));target.guard=Math.max(1,Math.round(oldG*(1-armorPierce)));allyAttack(actor,target,p)}
 finally{actor.attack=oldA;target.guard=oldG}
 return target.hp<=0;
}
function gc360BattleLine(b,msg){
 b.log.push('ABILITY — '+msg);
 if(b.log.length>55)b.log=b.log.slice(-55);
}
function gc360UseTalent(t,ctx,p){
 const {b,actor,a,allies,enemies}=ctx,round=b.round,target=gc360Target(t.kind,ctx),k=t.kind;
 if(!target)return false;
 const label=a.name+' uses '+t.name+': ';
 const strength=1+Math.max(0,(a.lvl-t.level))/30;
 const hit=(x,boost=1.1,pierce=0)=>gc360Strike(actor,x,p,boost*strength,pierce);
 switch(k){
 case 'taunt':
  target.gc360TauntId=a.id;target.gc360TauntUntil=round+2;
  actor.gc360GuardUntil=round+2;gc360BattleLine(b,label+'draws '+target.name+' into a defended duel.');break;
 case 'stagger':case 'pin':case 'hound':
  hit(target,1.05);if(target.hp>0){target.gc360StaggerUntil=round+1;target.gc360ExposedUntil=round+2}
  gc360BattleLine(b,label+'interrupts '+target.name+' and leaves an opening.');break;
 case 'shred':
  hit(target,1.04,.30);target.gc360ArmorUntil=round+3;
  gc360BattleLine(b,label+'cracks '+target.name+'’s armor for subsequent attacks.');break;
 case 'pierce':case 'ignoreArmor':
  hit(target,k==='ignoreArmor'?1.65:1.35,k==='ignoreArmor'?.78:.55);
  gc360BattleLine(b,label+'pierces '+target.name+'’s defenses.');break;
 case 'disarm':case 'curse':
  hit(target,.85);target.gc360CurseUntil=round+3;
  gc360BattleLine(b,label+'weakens '+target.name+'’s next attacks.');break;
 case 'bleed':
  hit(target,1.12);target.gc360Bleeding={damage:Math.max(2,Math.round(actor.attack*.16)),until:round+3};
  gc360BattleLine(b,label+target.name+' suffers a continuing wound.');break;
 case 'mark':case 'duel':
  target.gc360ExposedUntil=round+3;
  if(k==='duel'){actor.gc360GuardUntil=round+1;hit(target,1.24)}
  gc360BattleLine(b,label+target.name+' is marked and vulnerable to allied strikes.');break;
 case 'execute':
  hit(target,target.hp/target.maxHp<.35?2.4:1.70,.20);
  gc360BattleLine(b,label+'attempts to finish '+target.name+'.');break;
 case 'rampage':
  if(hit(target,1.38)&&alive(enemies).length)hit(gc360Lowest(alive(enemies)),1.08);
  gc360BattleLine(b,label+'a fallen enemy can trigger a follow-up attack.');break;
 case 'volley':case 'multiVolley':case 'cleave':case 'packStorm':case 'arcaneBlast':
  {
   const count=k==='multiVolley'?4:k==='packStorm'?3:k==='cleave'?2:3;
   const targets=alive(enemies).slice(0,count);
   targets.forEach(x=>{hit(x,k==='cleave'?.95:k==='arcaneBlast'?.95:.82,k==='arcaneBlast'?.25:0);
    if(k==='packStorm'){x.gc360Bleeding={damage:Math.max(2,Math.round(actor.attack*.1)),until:round+2};x.gc360StaggerUntil=round+1}
    if(k==='arcaneBlast')x.gc360ExposedUntil=round+2;
   });
   gc360BattleLine(b,label+'strikes '+targets.length+' enemies in one action.');
  }break;
 case 'frenzy':
  {const targets=alive(enemies);for(let i=0;i<3;i++){const x=gc360Lowest(alive(targets));if(!x)break;hit(x,.87)}
   actor.gc360ExposedUntil=round+2;gc360BattleLine(b,label+'launches three strikes but leaves '+actor.name+' exposed.');
  }break;
 case 'charge':case 'teleport':
  hit(target,1.5,.25);actor.gc360ExposedUntil=k==='charge'?round+2:0;
  if(k==='teleport')actor.gc360DodgeUntil=round+2;
  gc360BattleLine(b,label+'breaks through to '+target.name+'.');break;
 case 'reposition':
  actor.gc360DodgeUntil=round+2;target.gc360ExposedUntil=round+2;hit(target,.95);
  gc360BattleLine(b,label+'slips around '+target.name+' and avoids the next attack.');break;
 case 'pull':
  hit(target,.95);target.gc360ExposedUntil=round+3;target.gc360StaggerUntil=round+1;
  gc360BattleLine(b,label+'drags '+target.name+' out of formation.');break;
 case 'blind':case 'silence':
  hit(target,.65);target.gc360StaggerUntil=round+1;target.gc360BlindUntil=round+2;
  gc360BattleLine(b,label+'disrupts '+target.name+'’s next action.');break;
 case 'heal':
  {
   const amount=Math.max(8,Math.round(actor.resolve*.72+target.maxHp*.12));
   target.hp=Math.min(target.maxHp,target.hp+amount);
   gc360BattleLine(b,label+'restores '+amount+' HP to '+target.name+'.');
  }break;
 case 'multiHeal':
  {
   let restored=0;allies.forEach(x=>{const before=x.hp;x.hp=Math.min(x.maxHp,x.hp+Math.max(6,Math.round(actor.resolve*.25+x.maxHp*.1)));restored+=x.hp-before});
   gc360BattleLine(b,label+'restores '+restored+' HP across the formation.');
  }break;
 case 'revive':
  if(!target.gc320Downed)return false;
  target.gc320Downed.protection='protected';
  target.gc320Downed.exposure=Math.max(0,(target.gc320Downed.exposure||0)-2);
  target.hp=Math.max(1,target.hp);
  gc360BattleLine(b,label+'stabilizes '+target.name+' and reduces mortal danger.');break;
 case 'cleanse':
  allies.forEach(x=>{delete x.gc360Bleeding;delete x.gc360CurseUntil;delete x.gc360ExposedUntil});
  gc360BattleLine(b,label+'clears bleeding, exposure and curses from the party.');break;
 case 'ward':case 'consecrate':
  allies.forEach(x=>{x.gc360GuardUntil=Math.max(x.gc360GuardUntil||0,round+2);x.gc360WardCharges=(x.gc360WardCharges||0)+1});
  if(k==='consecrate')enemies.filter(x=>x.supernatural).forEach(x=>{x.hp=Math.max(0,x.hp-Math.max(6,Math.round(actor.resolve*.4)))});
  gc360BattleLine(b,label+'raises a protective ward'+(k==='consecrate'?' that sears unholy foes':'')+'.');break;
 case 'teamGuard':
  allies.forEach(x=>{x.gc360GuardUntil=Math.max(x.gc360GuardUntil||0,round+2);x.gc360WardCharges=(x.gc360WardCharges||0)+1});
  gc360BattleLine(b,label+'the entire line braces for the next assault.');break;
 case 'petGuard':case 'martyr':case 'deathSave':
  {
   const guardian=k==='petGuard'?actor:actor;
   target.gc360ProtectorId=guardian.charId;target.gc360ProtectorUntil=round+3;
   if(k==='deathSave'){target.gc360LastStand=true;target.gc360LastStandBy=actor.name}
   gc360BattleLine(b,label+'protects '+target.name+' from a lethal attack.');
  }break;
 case 'brace':case 'riposte':case 'parry':
  actor.gc360GuardUntil=round+2;actor.gc360RiposteUntil=round+2;
  if(k==='parry')actor.gc360WardCharges=(actor.gc360WardCharges||0)+1;
  gc360BattleLine(b,label+'braces to counter the next attacker.');break;
 case 'rally':
  allies.forEach(x=>{delete x.gc360BlindUntil;delete x.gc360CurseUntil});
  gc360BattleLine(b,label+'steadies the whole party and clears disruption.');break;
 case 'inspire':
  {
   const helper=allies.filter(x=>x!==actor).sort((x,y)=>y.attack-x.attack)[0];
   if(helper){const victim=gc360Lowest(alive(enemies));if(victim)gc360Strike(helper,victim,p,.90)}
   actor.gc360GuardUntil=round+1;
   gc360BattleLine(b,label+'directs an ally to seize an immediate opening.');
  }break;
 default:return false;
 }
 actor.gc360Cooldowns[t.name]=round+t.cooldown;
 actor.gc360LastAbility=t.name;actor.gc360LastAbilityRound=round;
 return true;
}
const _supportActionGC360=supportAction;
supportAction=function(actor,p){
 const ctx=gc360Context(actor,p);
 if(ctx){
  const {a,b}=ctx;
  const talents=gc360Unlocked(a).slice().reverse();
  for(const t of talents){
   if((actor.gc360Cooldowns[t.name]||0)>b.round)continue;
   if(!gc360ShouldUse(t,ctx))continue;
   if(gc360UseTalent(t,ctx,p))return true;
  }
  /* Shared basic Guard: a conscious tactical sacrifice when critically wounded. */
  if(actor.hp/Math.max(1,actor.maxHp)<.27&&!actor.gc360GuardUntil&&!actor.gc360BasicGuardRound){
   actor.gc360GuardUntil=b.round+1;actor.gc360BasicGuardRound=b.round;
   gc360BattleLine(b,actor.name+' GUARDS instead of attacking while critically wounded.');
   return true;
  }
 }
 return _supportActionGC360(actor,p);
};