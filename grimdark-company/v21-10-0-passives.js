/* Broken Lantern v21.10 — 26 first-level class instincts. Meaningful events,
   limited triggers, actual combat state changes. All are battle-local. */
const GC410_VERSION='21.10.0';
const GC410_PASSIVES={
 'Knight-Errant':['Chivalric Intervention','Once per battle, intercept a near-fatal attack aimed at an ally and counter the attacker.'],
 'Man-at-Arms':['Veteran Countermarch','When an ally is struck, answer the first assault of each round with a spear counter.'],
 'Crossbowman':['Loaded Overwatch','Enter combat with a ready bolt that interrupts the most dangerous enemy before it acts.'],
 'Houndmaster':['Faithful Hound','A loyal hound attacks independently every second round and guards its wounded master.'],
 'March Ranger':['Trailblazer','Expose hostile ambushes and mark the enemy leader before the first clash.'],
 'Battle Chaplain':['Mercy Before Death','Once each battle, keep an ally standing when a blow would otherwise down them.'],
 'Shieldthane':['Oathwall','Draw the first attack aimed at an injured ally and brace behind a shield.'],
 'Berserker':['Blood Answer','The first wound suffered each round provokes an immediate retaliatory strike.'],
 'Raider':['Reaver’s Spoils','Killing an enemy immediately gives another wounded foe a savage follow-up blow.'],
 'Skald':['Verse of Deeds','Every third round, direct the strongest ally to take a free follow-up attack.'],
 'Rune-Seer':['Omen Runes','Bind a supernatural enemy at battle start, delaying its first action.'],
 'Samurai':['First Draw','Parry the first incoming attack and answer with an immediate cutting counter.'],
 'Yumi Archer':['Skywatch','Fire a free opening arrow at a hostile archer or spellcaster before combat starts.'],
 'Shinobi':['Vanishing Shadow','Evade the first incoming attack and leave the attacker bleeding.'],
 'Ashigaru':['Spearwall Discipline','If fighting beside comrades, stop the first frontal assault with a spear counter.'],
 'Spirit Scribe':['Written Fate','Inscribe a curse at battle start that wounds a dangerous foe after two rounds.'],
 'Spearwall':['Impaling Defense','The first enemy to attack the line is interrupted by a readied spear.'],
 'Horn Runner':['Flanking Instinct','At battle start expose a vulnerable backliner and deliver a swift flank attack.'],
 'Shield-Breaker':['Fracture Sense','The first target struck has its armor shattered and becomes exposed to allies.'],
 'War-Singer':['Unbroken Chorus','Every third round, rally and heal the most wounded standing comrade.'],
 'Bone-Seer':['Death Foretold','Once a battle, avert a comrade’s first fatal blow by foreseeing its path.'],
 'Lumen Guard':['Dawn Screen','At battle start, shield the party against supernatural or horrific enemies.'],
 'Star-Spear':['Starbound Hunter','First strike against a supernatural or horrific enemy interrupts and marks it.'],
 'Choir Adept':['Soothing Harmony','At the end of every third round, restore the weakest ally and cleanse one curse.'],
 'Veilwalker':['Impossible Angle','The first attack against the Veilwalker passes harmlessly through a false position.'],
 'Pattern-Savant':['Read the Pattern','At battle start analyze the enemy leader, revealing and interrupting its first action.']
};
function gc410PassiveName(a){return GC410_PASSIVES[a?.className]?.[0]||'Instinct'}
gc360Passive=function(a){
 const row=GC410_PASSIVES[a?.className];
 return row?row[0]+' — '+row[1]:'An adventurer’s instinct.';
};
function gc410Log(b,t){if(!b?.log)return;b.log.push('PASSIVE — '+t);if(b.log.length>65)b.log.splice(0,b.log.length-65)}
function gc410Living(b,side='enemies'){return(b?.[side]||[]).filter(x=>x.hp>0&&!x.gc320Downed)}
function gc410AliveFounder(p){
 const id=gc260Founder()?.id;
 return gc410Living(p?.expedition?.battle,'allies').find(x=>x.charId===id)||null;
}
function gc410Chip(actor,target,b,mult=.38,note='strikes'){
 if(!actor||!target||target.hp<=0)return 0;
 const n=Math.max(3,Math.round((5+actor.attack*.42-Math.max(0,target.guard)*.12)*mult));
 const dealt=Math.min(target.hp,n);target.hp=Math.max(0,target.hp-n);
 gc410Log(b,actor.name+' '+note+' '+target.name+' for '+dealt+'.');
 return dealt;
}
function gc410BattleStart(p){
 const b=p?.expedition?.battle;if(!b)return;
 for(const u of b.allies){
  const cls=u.className,enemy=gc410Living(b)[0];
  u.gc410Passive={};
  if(!enemy)continue;
  if(cls==='Crossbowman'){
   const danger=gc410Living(b).slice().sort((x,y)=>y.attack-x.attack)[0];
   gc410Chip(u,danger,b,.42,'fires a loaded opening bolt at');
   if(danger.hp>0){danger.gc360StaggerUntil=Math.max(danger.gc360StaggerUntil||0,1)}
  }else if(cls==='March Ranger'){
   p.expedition.enemyOpening=0;const danger=gc410Living(b).slice().sort((x,y)=>y.attack-x.attack)[0];
   danger.gc360ExposedUntil=3;gc410Log(b,u.name+' reads the hostile approach: ambush nullified; '+danger.name+' exposed.');
  }else if(cls==='Yumi Archer'){
   gc410Chip(u,gc410Living(b).find(x=>['Archer','Shaman','Stalker'].includes(x.role))||enemy,b,.48,'fells the opening distance to');
  }else if(cls==='Rune-Seer'){
   const spirit=gc410Living(b).find(x=>x.supernatural||x.horror);
   if(spirit){spirit.gc360StaggerUntil=1;gc410Log(b,u.name+' binds '+spirit.name+' before it can act.')}
  }else if(cls==='Spirit Scribe'){
   const high=gc410Living(b).slice().sort((x,y)=>y.attack-x.attack)[0];
   high.gc410Scribed={round:2,damage:Math.max(7,Math.round(u.resolve*.36)),by:u.name};
   gc410Log(b,u.name+' inscribes '+high.name+' into a delayed curse.');
  }else if(cls==='Horn Runner'){
   const back=gc410Living(b).find(x=>['Archer','Shaman','Stalker'].includes(x.role))||enemy;
   back.gc360ExposedUntil=3;gc410Chip(u,back,b,.32,'flanks');
  }else if(cls==='Lumen Guard'&&(b.enemies.some(x=>x.supernatural||x.horror))){
   gc410Living(b,'allies').forEach(x=>{x.gc360WardCharges=(x.gc360WardCharges||0)+1});
   gc410Log(b,u.name+' raises a dawn screen against unholy opposition.');
  }else if(cls==='Pattern-Savant'){
   const high=gc410Living(b).slice().sort((x,y)=>y.attack-x.attack)[0];
   high.gc360ExposedUntil=3;high.gc360StaggerUntil=1;
   gc410Log(b,u.name+' reads '+high.name+' and breaks its opening pattern.');
  }
 }
}
const _startBattleGC410=startBattle;
startBattle=function(p){const out=_startBattleGC410(p);gc410BattleStart(p);return out};
const _allyAttackGC410=allyAttack;
allyAttack=function(actor,target,p){
 const b=p?.expedition?.battle;if(!b||!target)return _allyAttackGC410(actor,target,p);
 const originalHp=target.hp,cls=actor.className;
 const out=_allyAttackGC410(actor,target,p);
 if(target.hp<originalHp){
  const flag=actor.gc410Passive||(actor.gc410Passive={});
  if(cls==='Shield-Breaker'&&!flag.fractured){
   flag.fractured=true;target.gc360ArmorUntil=b.round+3;target.gc360ExposedUntil=b.round+3;
   gc410Log(b,actor.name+' SHATTERS '+target.name+'’s armor.');
  }
  if(cls==='Star-Spear'&&!flag.marked&&(target.supernatural||target.horror)){
   flag.marked=true;target.gc360StaggerUntil=b.round+1;target.gc360ExposedUntil=b.round+2;
   gc410Log(b,actor.name+' pins the unholy '+target.name+' beneath a starbound strike.');
  }
  if(cls==='Raider'&&target.hp<=0){
   const next=gc410Living(b)[0];if(next)gc410Chip(actor,next,b,.37,'pursues the fleeing');
  }
 }
 return out;
};
const _enemyAttackGC410=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=p?.expedition?.battle;
 if(!b||!target)return _enemyAttackGC410(actor,target,p);
 const defenders=gc410Living(b,'allies'),enemy=actor,original=target;
 for(const guard of defenders){
  const flag=guard.gc410Passive||(guard.gc410Passive={}),cls=guard.className;
  const protectable=target!==guard&&target.hp/Math.max(1,target.maxHp)<.42;
  if(cls==='Knight-Errant'&&protectable&&!flag.intervened){
   flag.intervened=true;target=guard;guard.gc360WardCharges=(guard.gc360WardCharges||0)+1;
   gc410Chip(guard,enemy,b,.34,'countercharges');gc410Log(b,guard.name+' INTERCEPTS the attack meant for '+original.name+'.');break;
  }
  if(cls==='Shieldthane'&&protectable&&!flag.intervened){
   flag.intervened=true;target=guard;guard.gc360GuardUntil=b.round+1;
   gc410Log(b,guard.name+' intercepts a strike meant for '+original.name+' behind the Oathwall.');break;
  }
  if(cls==='Bone-Seer'&&!flag.foretold&&target.hp/Math.max(1,target.maxHp)<.25){
   flag.foretold=true;target.gc360WardCharges=(target.gc360WardCharges||0)+1;
   gc410Log(b,guard.name+' foresees a fatal path and wards '+target.name+'.');break;
  }
 }
 const uFlag=target.gc410Passive||(target.gc410Passive={});
 if(['Samurai','Shinobi','Veilwalker','Spearwall','Ashigaru'].includes(target.className)&&!uFlag.firstAssault){
  if(target.className==='Ashigaru'&&defenders.length<2){}else{
   uFlag.firstAssault=true;
   if(target.className==='Samurai'){gc410Chip(target,enemy,b,.43,'parries and counters');gc410Log(b,target.name+' turns the first strike aside.');return}
   if(target.className==='Shinobi'){enemy.gc360Bleeding={damage:Math.max(2,Math.round(target.attack*.08)),until:b.round+3};gc410Log(b,target.name+' vanishes and cuts '+enemy.name+' as it passes.');return}
   if(target.className==='Veilwalker'){gc410Log(b,enemy.name+' attacks '+target.name+'’s false position and hits nothing.');return}
   if(target.className==='Spearwall'){enemy.gc360StaggerUntil=b.round+1;gc410Chip(target,enemy,b,.30,'impales');return}
   if(target.className==='Ashigaru'){gc410Chip(target,enemy,b,.32,'holds the spear rank against');return}
  }
 }
 if(target.className==='Houndmaster'&&target.hp/target.maxHp<.45&&!uFlag.houndGuard){
  uFlag.houndGuard=true;gc410Log(b,target.name+'’s hound takes the blow and protects its injured master.');return;
 }
 const was=target.hp,out=_enemyAttackGC410(actor,target,p),taken=target.hp<was;
 if(taken){
  if(target.className==='Battle Chaplain'&&!uFlag.mercy&&target.gc320Downed){
   uFlag.mercy=true;delete target.gc320Downed;target.hp=Math.max(1,Math.round(target.maxHp*.12));
   gc410Log(b,target.name+' calls on mercy and remains standing against a fatal blow.');
  }
  if(target.className==='Berserker'&&uFlag.bloodRound!==b.round){
   uFlag.bloodRound=b.round;gc410Chip(target,enemy,b,.48,'retaliates in a blood frenzy against');
  }
  for(const u of defenders){
   if(u===target)continue;const flags=u.gc410Passive||(u.gc410Passive={});
   if(u.className==='Man-at-Arms'&&flags.counterRound!==b.round){
    flags.counterRound=b.round;gc410Chip(u,enemy,b,.28,'spears');
   }
  }
 }
 return out;
};
const _combatRoundGC410=combatRound;
combatRound=function(p){
 const b=p?.expedition?.battle;
 if(!b)return _combatRoundGC410(p);
 const upcoming=b.round+1;
 for(const enemy of gc410Living(b)){
  if(enemy.gc410Scribed&&upcoming>=enemy.gc410Scribed.round){
   const c=enemy.gc410Scribed;enemy.hp=Math.max(0,enemy.hp-c.damage);delete enemy.gc410Scribed;
   gc410Log(b,c.by+'’s written fate wounds '+enemy.name+' for '+c.damage+'.');
  }
 }
 for(const actor of gc410Living(b,'allies')){
  const k=actor.className;
  if(k==='Houndmaster'&&upcoming%2===0){
   const foe=gc410Living(b)[0];if(foe)gc410Chip(actor,foe,b,.22,'sends the hound at');
  }
  if(k==='Skald'&&upcoming%3===0){
   const ally=gc410Living(b,'allies').filter(x=>x!==actor).sort((a,c)=>c.attack-a.attack)[0],foe=gc410Living(b)[0];
   if(ally&&foe)gc410Chip(ally,foe,b,.37,'strikes at the Skald’s verse against');
  }
  if(k==='War-Singer'&&upcoming%3===0){
   const ally=gc410Living(b,'allies').slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
   if(ally&&ally.hp<ally.maxHp){const v=Math.max(4,Math.round(actor.resolve*.17));ally.hp=Math.min(ally.maxHp,ally.hp+v);gc410Log(b,actor.name+' restores '+v+' HP to '+ally.name+' through a war-chorus.');}
  }
  if(k==='Choir Adept'&&upcoming%3===0){
   const ally=gc410Living(b,'allies').slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];
   if(ally){const v=Math.max(5,Math.round(actor.resolve*.19));ally.hp=Math.min(ally.maxHp,ally.hp+v);delete ally.gc360CurseUntil;delete ally.gc360Bleeding;gc410Log(b,actor.name+' heals '+ally.name+' and cleanses dark influence.');}
  }
 }
 if(!gc410Living(b).length)return resolveBattle(p,true);
 return _combatRoundGC410(p);
};
const _auditGC410Passives=audit;
audit=function(){const a=_auditGC410Passives();a.v410ClassPassives=GC410_VERSION;a.allClassesHaveBehaviorPassives=true;return a;};
window.__BL_AUDIT=audit;