/* Broken Lantern v21.10.0 — level 20 battle-changing capstones.
   Builds on existing 5/10/15/20 abilities. Every capstone is a one-battle
   event with class-specific actions, status consequences and log feedback. */
const GC410_ULTIMATE_DETAILS={
 'Knight-Errant':'All allies receive a fatal-blow safeguard. The Knight draws the enemy commander’s aggression and commits to a last stand.',
 'Man-at-Arms':'Locks the formation; each living ally receives a counterattack. Three immediate spear thrusts disrupt the strongest enemies.',
 'Crossbowman':'Piercing execution volley: a focused armor-breaking shot and a follow-up on the weakest hostile.',
 'Houndmaster':'The full kennel arrives; up to four enemies suffer hound strikes, bleeding and disrupted actions.',
 'March Ranger':'A perfect hunter’s volley marks every hostile; three priority targets take precise opening fire.',
 'Battle Chaplain':'Martyr’s covenant saves the weakest comrade, revives one downed ally if possible and shares protective wards.',
 'Shieldthane':'The final bulwark guards the whole line and counterattacks the strongest foe.',
 'Berserker':'Unbound fury chains four heavy attacks; the Berserker is left exposed and injured by exhaustion.',
 'Raider':'Crimson raid strikes multiple weakened foes; each kill triggers another attack before the line can respond.',
 'Skald':'The saga makes every living ally attack a chosen foe immediately, then raises a guarded line.',
 'Rune-Seer':'A collapsing rune seal detonates and interrupts every supernatural enemy while warding allies.',
 'Samurai':'Perfect cut passes through guard and leaves the target unable to retaliate in the next round.',
 'Yumi Archer':'Heavenfall arrows rain over the entire enemy formation, pinning ranged units.',
 'Shinobi':'The silent execution targets the weakest foe and blinds surviving enemies with smoke.',
 'Ashigaru':'A storm of spears forces each enemy to confront the rank, interrupting the frontline.',
 'Spirit Scribe':'Seals the unquiet with delayed inscribed wounds and silences supernatural enemies.',
 'Spearwall':'An unbroken phalanx grants a lethal guard to the party and retaliates against the enemy vanguard.',
 'Horn Runner':'A thunder charge overruns a hostile flank, exposing each enemy and dealing follow-up hits.',
 'Shield-Breaker':'Earthsplitter devastates the strongest foe and fractures the armor of every surviving opponent.',
 'War-Singer':'A last song stabilizes fallen allies, then sends the living party into a coordinated attack.',
 'Bone-Seer':'Ancestors manifest: every ally receives protection while the strongest hostile is cursed with an imminent wound.',
 'Lumen Guard':'A solar aegis prevents one fatal blow per ally and blinds all unholy enemies.',
 'Star-Spear':'Starfall impales the front and rear lines, especially supernatural or horrifying opponents.',
 'Choir Adept':'A celestial requiem stabilizes the downed, heals the whole line and removes hostile curses.',
 'Veilwalker':'A broken path causes the enemy formation to miss its next assault as the Veilwalker strikes a commander.',
 'Pattern-Savant':'Reality fracture rewrites the battle pattern: all enemies become exposed and suffer cascading interrupts.'
};
function gc410UltimateName(a){return gc360Talents(a).find(x=>x.level===20)?.name||'Ultimate'}
function gc410UltimateCanUse(ctx){
 const b=ctx?.b,actor=ctx?.actor;if(!b||!actor)return false;
 if(actor.gc410UltimateSpent===ctx?.a?.className)return false;
 return gc410Living(b).length>0;
}
const _gc360ShouldUseGC410=gc360ShouldUse;
gc360ShouldUse=function(t,ctx){
 if(t.level===20){
  if(!gc410UltimateCanUse(ctx))return false;
  /* Offensive ultimates wait until the battle matters; emergency support
     capstones still obey the existing condition checks. */
  const emergency=['revive','deathSave','martyr','teamGuard'].includes(t.kind);
  if(!emergency&&ctx.b.round<2&&gc410Living(ctx.b).length<=2)return false;
 }
 return _gc360ShouldUseGC410(t,ctx);
};
function gc410UltimateEffect(ctx,p,skill){
 const {b,actor,a}=ctx,round=b.round,allies=gc410Living(b,'allies'),enemies=gc410Living(b),cls=a.className;
 const strongest=enemies.slice().sort((x,y)=>y.attack-x.attack)[0],
 weakest=enemies.slice().sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0],
 protectedAlly=allies.slice().sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0],
 downed=b.allies.find(x=>x.gc320Downed);
 const strike=(t,m=.9,label='ULTIMATE')=>gc410Chip(actor,t,b,m,label);
 const ward=(x,c=1)=>{if(x){x.gc360WardCharges=(x.gc360WardCharges||0)+c;x.gc360GuardUntil=round+2}};
 const bleed=(x,d=3)=>{if(x&&x.hp>0)x.gc360Bleeding={damage:Math.max(3,Math.round(actor.attack*.12)*d),until:round+3}};
 const stagger=(x)=>{if(x&&x.hp>0){x.gc360StaggerUntil=Math.max(x.gc360StaggerUntil||0,round+1);x.gc360ExposedUntil=round+2}};
 const rallyDown=(x)=>{if(x?.gc320Downed){x.gc320Downed.protection='protected';x.gc320Downed.exposure=0;x.hp=Math.max(1,x.hp);return true}return false};
 switch(cls){
 case 'Knight-Errant':
  allies.forEach(x=>{x.gc360LastStand=true;x.gc360LastStandBy=actor.name;ward(x,1)});
  if(strongest){strongest.gc360TauntId=actor.charId;strongest.gc360TauntUntil=round+3}
  break;
 case 'Man-at-Arms':
  allies.forEach(x=>{x.gc360RiposteUntil=round+3;ward(x)});
  enemies.slice(0,3).forEach(x=>{strike(x,.62,'orders a spear thrust into');stagger(x)});break;
 case 'Crossbowman':
  strike(weakest,2.15,'piercing execution shot against');
  if(strongest&&strongest.hp>0){strike(strongest,1.12,'fires a finishing bolt at');strongest.gc360ArmorUntil=round+3}break;
 case 'Houndmaster':
  enemies.slice(0,4).forEach(x=>{strike(x,.60,'unleashes a hound on');bleed(x,1);stagger(x)});break;
 case 'March Ranger':
  enemies.forEach(x=>{x.gc360MarkedUntil=round+4;x.gc360ExposedUntil=round+3});
  enemies.slice(0,3).forEach(x=>strike(x,.81,'looses a hunter’s volley at'));break;
 case 'Battle Chaplain':
  if(downed)rallyDown(downed);
  allies.forEach(x=>ward(x,2));
  if(protectedAlly)protectedAlly.hp=Math.min(protectedAlly.maxHp,protectedAlly.hp+Math.round(actor.resolve*.8));
  break;
 case 'Shieldthane':
  allies.forEach(x=>{ward(x,2);x.gc360RiposteUntil=round+3});
  strike(strongest,1.10,'smashes the siege line around');break;
 case 'Berserker':
  for(let i=0;i<4;i++){const x=gc410Living(b).slice().sort((u,v)=>u.hp-v.hp)[0];if(x)strike(x,.87,'rips into')}
  actor.hp=Math.max(1,actor.hp-Math.max(1,Math.round(actor.maxHp*.09)));actor.gc360ExposedUntil=round+3;break;
 case 'Raider':
  for(let i=0;i<4;i++){const x=gc410Living(b).slice().sort((u,v)=>u.hp-v.hp)[0];if(x)strike(x,.80,'storms over')}
  enemies.filter(x=>x.hp>0).forEach(x=>{x.gc360ExposedUntil=round+2});break;
 case 'Skald':
  allies.filter(x=>x!==actor).forEach(x=>{const t=gc410Living(b)[0];if(t)gc410Chip(x,t,b,.78,'answers the Skald’s saga against')});
  allies.forEach(x=>ward(x));break;
 case 'Rune-Seer':
  enemies.forEach(x=>{strike(x,x.supernatural||x.horror?1.24:.65,'collapses a rune beneath');if(x.supernatural||x.horror)stagger(x)});
  allies.forEach(x=>ward(x));break;
 case 'Samurai':
  strike(strongest,2.20,'delivers the perfect cut to');stagger(strongest);actor.gc360DodgeUntil=round+2;break;
 case 'Yumi Archer':
  enemies.forEach(x=>{strike(x,.84,'rains arrows onto');if(['Archer','Shaman','Stalker'].includes(x.role))stagger(x)});break;
 case 'Shinobi':
  strike(weakest,2.08,'executes a shadow strike on');
  enemies.forEach(x=>{x.gc360BlindUntil=round+2});actor.gc360DodgeUntil=round+3;break;
 case 'Ashigaru':
  enemies.forEach(x=>{strike(x,.57,'drives the storm of spears into');if(x.role!=='Archer')stagger(x)});
  allies.forEach(x=>ward(x));break;
 case 'Spirit Scribe':
  enemies.forEach(x=>{x.gc410Scribed={round:round+2,damage:Math.round(actor.resolve*.62),by:actor.name};if(x.supernatural||x.horror)stagger(x)});
  ward(protectedAlly,2);break;
 case 'Spearwall':
  allies.forEach(x=>{x.gc360LastStand=true;x.gc360LastStandBy=actor.name;ward(x)});
  enemies.slice(0,2).forEach(x=>{strike(x,.50,'impales the assault of');stagger(x)});break;
 case 'Horn Runner':
  enemies.forEach(x=>{x.gc360ExposedUntil=round+3;strike(x,.62,'overruns the flank of')});
  actor.gc360DodgeUntil=round+2;break;
 case 'Shield-Breaker':
  strike(strongest,1.75,'splits the earth beneath');
  enemies.forEach(x=>{x.gc360ArmorUntil=round+4;x.gc360ExposedUntil=round+3});break;
 case 'War-Singer':
  if(downed)rallyDown(downed);
  allies.forEach(x=>{ward(x);const t=gc410Living(b)[0];if(t)gc410Chip(x,t,b,.50,'answers the last song against')});break;
 case 'Bone-Seer':
  allies.forEach(x=>ward(x,2));
  if(strongest)strongest.gc410Scribed={round:round+2,damage:Math.round(actor.resolve*1.12),by:actor.name};break;
 case 'Lumen Guard':
  allies.forEach(x=>{x.gc360LastStand=true;x.gc360LastStandBy=actor.name;ward(x,2)});
  enemies.filter(x=>x.supernatural||x.horror).forEach(x=>{x.gc360BlindUntil=round+3;strike(x,.65,'sears with solar light')});break;
 case 'Star-Spear':
  enemies.forEach(x=>strike(x,x.supernatural||x.horror?1.18:.66,'casts starfall onto'));
  stagger(strongest);break;
 case 'Choir Adept':
  if(downed)rallyDown(downed);
  b.allies.filter(x=>x.hp>0).forEach(x=>{x.hp=Math.min(x.maxHp,x.hp+Math.round(actor.resolve*.75));delete x.gc360Bleeding;delete x.gc360CurseUntil;ward(x)});
  break;
 case 'Veilwalker':
  strike(strongest,1.50,'opens a broken path through');
  enemies.forEach(x=>{x.gc360BlindUntil=round+2});actor.gc360DodgeUntil=round+3;break;
 case 'Pattern-Savant':
  enemies.forEach(x=>{strike(x,.72,'fractures reality around');stagger(x);x.gc360ArmorUntil=round+3});break;
 default:return false;
 }
 gc410Log(b,'ULTIMATE — '+actor.name+' unleashes '+skill.name+'. '+GC410_ULTIMATE_DETAILS[cls]);
 return true;
}
const _gc360UseTalentGC410=gc360UseTalent;
gc360UseTalent=function(t,ctx,p){
 if(t.level===20&&ctx?.actor?.gc410UltimateSpent===ctx?.a?.className)return false;
 const worked=_gc360UseTalentGC410(t,ctx,p);
 if(worked&&t.level===20){
  ctx.actor.gc410UltimateSpent=ctx.a.className;
  gc410UltimateEffect(ctx,p,t);
 }
 return worked;
};
