/* Grim Company v21.6.0 — combat actions.
   Persistent data: only battle-local cooldowns and statuses. Existing saves migrate implicitly.
   All class abilities spend the actor's turn; no hidden free turns. */
function gc360Living(list){return (list||[]).filter(x=>x.hp>0&&!x.gc320Downed)}
function gc360Battle(p){return p?.expedition?.battle}
function gc360Log(b,msg){if(!b.log)b.log=[];b.log.push(msg);if(b.log.length>65)b.log.splice(0,b.log.length-65)}
function gc360MostWounded(b){return gc360Living(b.allies).sort((a,c)=>a.hp/Math.max(1,a.maxHp)-c.hp/Math.max(1,c.maxHp))[0]}
function gc360MostDangerous(b){return gc360Living(b.enemies).sort((a,c)=>(c.attack+c.accuracy*.5)-(a.attack+a.accuracy*.5))[0]}
function gc360Target(b,kind){
 const enemies=gc360Living(b.enemies);if(!enemies.length)return null;
 if(kind==='execute'||kind==='rampage')return enemies.slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
 if(kind==='snipe'||kind==='charge'||kind==='flank')return enemies.find(x=>['Archer','Shaman','Stalker'].includes(x.role))||gc360MostDangerous(b);
 if(kind==='bind'||kind==='pin'||kind==='stagger'||kind==='silence'||kind==='doom')return gc360MostDangerous(b);
 return enemies.find(x=>x.gc360MarkedUntil>=b.round)||enemies.find(x=>x.gc360ExposedUntil>=b.round)||gc360MostDangerous(b);
}
function gc360Damage(actor,target,b,mult=1,pierce=0,source='strike'){
 if(!target||target.hp<=0)return 0;
 const exposed=target.gc360ExposedUntil>=b.round? .35:0;
 const marked=target.gc360MarkedUntil>=b.round? 1.18:1;
 const guard=Math.max(0,target.guard*(1-Math.max(pierce,exposed)));
 const raw=Math.max(4,(6+actor.attack*.43-guard*.14)*mult*marked);
 const dmg=Math.max(1,Math.round(raw));
 target.hp=Math.max(0,target.hp-dmg);
 gc360Log(b,actor.name+' uses '+source+' against '+target.name+' for '+dmg+' damage.');
 if(target.hp<=0) {
  gc360Log(b,target.name+' falls.');
  const a=state.roster.find(x=>x.id===actor.charId);
  if(a)a.kills=(Number(a.kills)||0)+1;
 }
 return dmg;
}
function gc360CanUse(a,u,skill,b){
 if((a?.lvl||1)<skill.level)return false;
 if(!gc360Living(b.enemies).length)return false;
 if(u.gc360UsedOnce&&u.gc360UsedOnce[skill.id])return false;
 const last=u.gc360Last?.[skill.id];
 if(last!=null&&b.round-last<skill.cooldown)return false;
 const kind=skill.kind,wounded=gc360MostWounded(b),down=b.allies.some(x=>x.gc320Downed);
 if(['revive','rescue'].includes(kind))return down;
 if(['heal','sacrifice'].includes(kind))return !!wounded&&wounded.hp/wounded.maxHp<.72;
 if(['guard','counter','ward'].includes(kind))return !!wounded&&(wounded.hp/wounded.maxHp<.85||b.round>1);
 if(kind==='stand')return b.allies.some(x=>x.gc320Downed||x.hp/x.maxHp<.42);
 if(kind==='rally')return b.allies.some(x=>x.gc360Bleed||x.gc360ExposedUntil>=b.round||x.hp/x.maxHp<.86)||b.round>=3;
 if(kind==='execute')return gc360Living(b.enemies).some(x=>x.hp/x.maxHp<.55||x.gc360ExposedUntil>=b.round);
 if(kind==='rampage')return gc360Living(b.enemies).some(x=>x.hp/x.maxHp<.65);
 if(kind==='vengeance')return b.allies.some(x=>x.hp/x.maxHp<.7||x.gc320Downed);
 if(kind==='siphon')return u.hp/u.maxHp<.88;
 if(kind==='purge')return b.enemies.some(x=>x.supernatural||x.horror)||b.round>2;
 return true;
}
function gc360Execute(actor,p,skill){
 const b=gc360Battle(p);if(!b)return false;
 const k=skill.kind,target=gc360Target(b,k),friend=gc360MostWounded(b),foes=gc360Living(b.enemies);
 if(!target||!friend)return false;
 const n=skill.name;
 if(k==='heal'){
  const amount=Math.round(12+actor.resolve*.45+skill.level*.6);
  friend.hp=Math.min(friend.maxHp,friend.hp+amount);gc360Log(b,actor.name+' uses '+n+' — '+friend.name+' recovers '+amount+' HP.');
 }else if(k==='revive'||k==='rescue'){
  const down=b.allies.find(x=>x.gc320Downed);
  if(!down)return false;
  delete down.gc320Downed;
  down.hp=Math.max(1,Math.min(down.maxHp,Math.round(down.maxHp*(k==='revive'?.36:.23))));
  down.gc360GuardUntil=b.round+2;gc360Log(b,actor.name+' uses '+n+' — '+down.name+' returns to the fight, protected.');
 }else if(k==='sacrifice'){
  friend.gc360GuardUntil=b.round+3;friend.gc360Protector=actor.charId;
  gc360Log(b,actor.name+' binds a Martyr’s Covenant to '+friend.name+' and accepts the cost of its protection.');
 }else if(k==='guard'||k==='ward'||k==='counter'||k==='countershot'){
  const t=k==='counter'?friend:k==='countershot'?friend:k==='guard'?friend:friend;
  t.gc360GuardUntil=b.round+2;
  if(k==='counter'||k==='countershot')t.gc360Counter={actorId:actor.charId,damage:Math.max(7,Math.round(actor.attack*.47)),until:b.round+2};
  if(k==='ward')t.gc360WardCharges=2;
  gc360Log(b,actor.name+' uses '+n+' — '+t.name+' is '+(k==='counter'||k==='countershot'?'guarded and ready to counter':k==='ward'?'warded against the next two blows':'shielded')+'.');
 }else if(k==='wardall'||k==='formation'||k==='stand'){
  b.allies.filter(x=>x.hp>0).forEach(x=>{x.gc360GuardUntil=b.round+(k==='stand'?3:2);if(k==='wardall')x.gc360WardCharges=(x.gc360WardCharges||0)+1;});
  gc360Log(b,actor.name+' uses '+n+' — '+(k==='stand'?'the line makes its last stand':'the entire formation is protected')+'.');
 }else if(k==='rally'){
  b.allies.filter(x=>x.hp>0).forEach(x=>{x.gc360ExposedUntil=0;x.gc360Bleed=0;x.hp=Math.min(x.maxHp,x.hp+Math.max(3,Math.round(actor.resolve*.15)));});
  gc360Log(b,actor.name+' uses '+n+' — fear and bleeding subside as the formation rallies.');
 }else if(k==='smoke'){
  actor.gc360GuardUntil=b.round+2;actor.gc360EvasionUntil=b.round+2;
  friend.gc360EvasionUntil=b.round+2;
  gc360Log(b,actor.name+' uses '+n+' — the rear line shifts out of danger.');
 }else if(k==='mark'||k==='expose'){
  target.gc360MarkedUntil=b.round+3;
  target.gc360ExposedUntil=b.round+2;
  if(k==='expose')gc360Damage(actor,target,b,1,.35,n);
  else gc360Log(b,actor.name+' uses '+n+' — '+target.name+' is marked and exposed to the entire party.');
 }else if(k==='stagger'||k==='pin'||k==='bind'||k==='silence'){
  gc360Damage(actor,target,b,k==='stagger'?.78:.56,k==='bind'?.14:0,n);
  if(target.hp>0){
   // Bosses resist hard control; they still become Exposed.
   if(target.bossId||target.legendary){target.gc360ExposedUntil=b.round+2;gc360Log(b,target.name+' resists the full interruption but is exposed.');}
   else {target.gc360Stagger=(target.gc360Stagger||0)+1;target.gc360ExposedUntil=b.round+1;gc360Log(b,target.name+' loses its next action.');}
  }
 }else if(k==='bleed'){
  gc360Damage(actor,target,b,1.0,.1,n);
  target.gc360Bleed=Math.min(3,(target.gc360Bleed||0)+1);
  gc360Log(b,target.name+' begins bleeding.');
 }else if(k==='pierce'||k==='snipe'||k==='charge'||k==='flank'||k==='pull'){
  const factor=k==='snipe'?1.7:k==='charge'?1.5:k==='pierce'?1.37:k==='flank'?1.30:1.18;
  gc360Damage(actor,target,b,factor,.65,n);
  if(k==='charge'){actor.gc360ExposedUntil=b.round+2;gc360Log(b,actor.name+' is exposed by the charge.');}
  if(k==='pierce'||k==='pull')target.gc360ExposedUntil=b.round+2;
  if(k==='flank')actor.gc360EvasionUntil=b.round+1;
 }else if(k==='cleave'||k==='multi'||k==='surround'||k==='frenzy'){
  const count=k==='cleave'||k==='surround'?2:foes.length;
  foes.slice(0,count).forEach(t=>{
   gc360Damage(actor,t,b,k==='frenzy'?1.25:k==='cleave'?.85:.72,k==='surround'?.30:0,n);
   if(k==='surround')t.gc360ExposedUntil=b.round+2;
  });
  if(k==='frenzy'){actor.gc360ExposedUntil=b.round+3;gc360Log(b,actor.name+' is exhausted and vulnerable after the frenzy.');}
 }else if(k==='hound'||k==='siphon'||k==='vengeance'){
  const dealt=gc360Damage(actor,target,b,k==='vengeance'?1.55:1.10,.10,n);
  if(k==='hound')target.gc360Bleed=Math.min(3,(target.gc360Bleed||0)+1);
  if(k==='siphon'){actor.hp=Math.min(actor.maxHp,actor.hp+Math.max(4,Math.round(dealt*.45)));gc360Log(b,actor.name+' regains vigor from the assault.');}
 }else if(k==='purge'){
  const special=target.supernatural||target.horror;
  gc360Damage(actor,target,b,special?1.6:.8,.2,n);
  target.attack=Math.max(1,Math.round(target.attack*.82));target.gc360MarkedUntil=0;
  gc360Log(b,target.name+' loses hostile enchantments and fighting strength.');
 }else if(k==='rampage'||k==='execute'){
  const before=target.hp;
  gc360Damage(actor,target,b,k==='execute'?2.55:1.65,k==='execute'?.70:.20,n);
  if(k==='rampage'&&before>0&&target.hp<=0){
   const other=gc360Living(b.enemies)[0];if(other)gc360Damage(actor,other,b,.82,0,'Rampage follow-through');
  }
 }else if(k==='command'){
  target.gc360ExposedUntil=b.round+2;
  const allies=gc360Living(b.allies).filter(x=>x!==actor).slice(0,3);
  for(const ally of allies)gc360Damage(ally,target,b,.48,.15,'coordinated strike');
  gc360Log(b,actor.name+' uses '+n+' — the company attacks as one.');
 }else if(k==='doom'){
  target.gc360Doom={round:b.round+2,power:Math.round(actor.attack*1.9),owner:actor.name};
  target.gc360ExposedUntil=b.round+3;gc360Log(b,actor.name+' invokes '+n+' — a terrible judgment is set to strike '+target.name+'.');
 }else return false;
 actor.gc360Last=actor.gc360Last||{};
 actor.gc360Last[skill.id]=b.round;
 if(k==='stand'||k==='revive'||k==='rescue'){actor.gc360UsedOnce=actor.gc360UsedOnce||{};actor.gc360UsedOnce[skill.id]=true;}
 return true;
}
function gc360TryAction(actor,p){
 const b=gc360Battle(p),a=state.roster.find(x=>x.id===actor?.charId);
 if(!b||!a||!actor||actor.hp<=0||actor.gc320Downed)return false;
 const usable=gc360Unlocked(a).filter(s=>gc360CanUse(a,actor,s,b));
 // Emergency rescue and defense first; then stronger unlocks and cooldown rotation.
 const order={revive:100,rescue:96,stand:95,sacrifice:93,heal:91,wardall:72,formation:69,rally:68,guard:64,ward:64,counter:62,countershot:62,execute:80,rampage:78};
 usable.sort((x,y)=>(order[y.kind]||45)+y.level*.35-(order[x.kind]||45)-x.level*.35);
 if(usable.length)return gc360Execute(actor,p,usable[0]);
 // Common basic Guard / Reposition actions also consume one turn.
 if(actor.hp/actor.maxHp<.27&&(!actor.gc360LastGuard||b.round-actor.gc360LastGuard>=3)){
  actor.gc360GuardUntil=b.round+2;actor.gc360LastGuard=b.round;
  gc360Log(b,actor.name+' GUARDS — bracing against the next attack.');return true;
 }
 if(bl14Formation(actor)==='BACK'&&actor.hp/actor.maxHp<.38&&(!actor.gc360LastMove||b.round-actor.gc360LastMove>=4)){
  actor.gc360EvasionUntil=b.round+2;actor.gc360LastMove=b.round;
  gc360Log(b,actor.name+' REPOSITIONS behind cover.');return true;
 }
 return false; // Basic Attack occurs in the existing combat engine.
}
const _gc360SupportAction=supportAction;
supportAction=function(actor,p){if(gc360TryAction(actor,p))return true;return _gc360SupportAction(actor,p)};
const _gc360EnemyAttack=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=gc360Battle(p);if(!b||!actor||!target)return _gc360EnemyAttack(actor,target,p);
 if(actor.gc360Stagger>0){actor.gc360Stagger--;gc360Log(b,actor.name+' is staggered and loses its action.');return;}
 if(actor.gc360Doom&&b.round>=actor.gc360Doom.round){actor.hp=Math.max(0,actor.hp-actor.gc360Doom.power);gc360Log(b,actor.gc360Doom.owner+'’s delayed judgment deals '+actor.gc360Doom.power+' to '+actor.name+'.');actor.gc360Doom=null;if(!actor.hp)return;}
 if(target.gc360EvasionUntil>=b.round&&Math.random()<.65){gc360Log(b,target.name+' avoids the blow by repositioning.');return;}
 const oldAttack=actor.attack,oldGuard=target.guard,oldHp=target.hp;
 if(target.gc360GuardUntil>=b.round)target.guard=Math.round(target.guard*1.85+9);
 if(target.gc360WardCharges>0)actor.attack=Math.max(1,Math.round(actor.attack*.55));
 if(target.gc360ExposedUntil>=b.round)target.guard=Math.max(1,Math.round(target.guard*.58));
 try{return _gc360EnemyAttack(actor,target,p)}
 finally{
  actor.attack=oldAttack;target.guard=oldGuard;
  if(target.gc360WardCharges>0&&oldHp>target.hp)target.gc360WardCharges--;
  if(target.gc360Counter&&target.gc360Counter.until>=b.round&&oldHp>target.hp){
   const x=target.gc360Counter,owner=b.allies.find(u=>u.charId===x.actorId);
   if(owner&&owner.hp>0&&!owner.gc320Downed){actor.hp=Math.max(0,actor.hp-x.damage);gc360Log(b,owner.name+' counters '+actor.name+' for '+x.damage+'.');}
   target.gc360Counter=null;
  }
  if(target.gc360Protector&&target.hp<oldHp){
   const protector=b.allies.find(x=>x.charId===target.gc360Protector);
   if(protector&&protector.hp>0){
    const redirect=Math.max(1,Math.round((oldHp-target.hp)*.55));
    target.hp=Math.min(target.maxHp,target.hp+redirect);
    protector.hp=Math.max(0,protector.hp-redirect);
    gc360Log(b,protector.name+' absorbs '+redirect+' damage meant for '+target.name+'.');
    target.gc360Protector=null;
   }
  }
 }
};
const _gc360CombatRound=combatRound;
combatRound=function(p){
 const b=gc360Battle(p);if(!b)return _gc360CombatRound(p);
 for(const enemy of b.enemies){
  if(enemy.hp<=0)continue;
  if(enemy.gc360Bleed>0){
   const dmg=Math.max(3,Math.round(enemy.maxHp*.026*enemy.gc360Bleed));
   enemy.hp=Math.max(0,enemy.hp-dmg);gc360Log(b,enemy.name+' bleeds for '+dmg+'.');
  }
  if(enemy.gc360Doom&&b.round+1>=enemy.gc360Doom.round){
   enemy.hp=Math.max(0,enemy.hp-enemy.gc360Doom.power);
   gc360Log(b,enemy.gc360Doom.owner+'’s delayed judgment strikes '+enemy.name+' for '+enemy.gc360Doom.power+'.');
   enemy.gc360Doom=null;
  }
 }
 if(!gc360Living(b.enemies).length)return resolveBattle(p,true);
 return _gc360CombatRound(p);
};
const _gc360StartBattle=startBattle;
startBattle=function(p){
 const out=_gc360StartBattle(p),b=gc360Battle(p);
 if(b){b.gc360CombatVersion=1;b.allies.forEach(x=>{x.gc360Last={};x.gc360UsedOnce={}});}
 return out;
};
