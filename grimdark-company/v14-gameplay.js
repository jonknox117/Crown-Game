/* Broken Lantern v14 — Combat 2.0 / intelligent retreat / Salvager's Lodge.
   Injected before boot; compatible with existing canonical saves. */

HQ_DEFS['Salvager’s Lodge']={
 icon:'SALVAGE',max:5,base:85,
 desc:'Improves post-contract item recovery, cache discovery and loot rarity. Higher levels can recover salvage even from retreats.'
};

const _normalizeStateV14=normalizeState;
normalizeState=function(s){
 s=_normalizeStateV14(s); if(!s)return s;
 REGION_ORDER.forEach(id=>{
   const up=s.regions?.[id]?.hq?.upgrades;
   if(up&&up['Salvager’s Lodge']==null)up['Salvager’s Lodge']=0;
 });
 s.combatVersion=14;
 return s;
};

const _createStateV14=createState;
createState=function(name){
 const s=_createStateV14(name);
 REGION_ORDER.forEach(id=>{if(s.regions[id].hq.upgrades['Salvager’s Lodge']==null)s.regions[id].hq.upgrades['Salvager’s Lodge']=0});
 s.combatVersion=14;
 return s;
};

const BL14_FRONT_CLASSES=new Set([
 'Knight-Errant','Man-at-Arms','Berserker','Shieldthane','Samurai','Shield-Spear',
 'Impi Captain','Lumen Guard','Star-Spear','Shield-Breaker','Raider'
]);
const BL14_BACK_CLASSES=new Set([
 'Crossbowman','Yumi Archer','Shinobi','Battle Chaplain','Houndmaster','March Ranger',
 'Shaman','Rune-Speaker','Choir Adept','Veilwalker'
]);
const BL14_PROTECTORS={
 'Knight-Errant':.34,'Man-at-Arms':.22,'Shieldthane':.50,'Lumen Guard':.46,
 'Samurai':.16,'Impi Captain':.22
};
const BL14_PREDATORS=new Set(['Wolf','Dire Wolf','Werewolf','Ghoul','Bone Hyena','Hyena Beast','Night Stalker']);
const BL14_DISCIPLINED=new Set(['Hobgoblin','Warband','Bandit Clan','Fallen Celestial','Oni Brute']);

function bl14Formation(u){
 if(BL14_FRONT_CLASSES.has(u.className))return'FRONT';
 if(BL14_BACK_CLASSES.has(u.className))return'BACK';
 return'MID';
}
function bl14WeightedPick(entries){
 let total=entries.reduce((s,x)=>s+Math.max(.001,x.w),0),r=Math.random()*total;
 for(const x of entries){r-=Math.max(.001,x.w);if(r<=0)return x}
 return entries[entries.length-1];
}
function bl14TargetWeights(allies,enemy){
 const living=alive(allies);
 return living.map(a=>{
   const hp=a.hp/Math.max(1,a.maxHp),form=bl14Formation(a);
   let w=1,reasons=[];
   if(enemy.role==='Brute'||enemy.role==='Shield'){
     if(form==='FRONT'){w*=2.0;reasons.push('frontline')}
     if(a.guard>=Math.max(...living.map(x=>x.guard))){w*=1.15;reasons.push('hard target')}
   }else if(enemy.role==='Archer'){
     if(form==='BACK'){w*=1.85;reasons.push('backline')}
     w*=1+(1-hp)*.8;
     if(hp<.55)reasons.push('exposed');
   }else if(enemy.role==='Stalker'){
     if(form==='BACK'){w*=2.15;reasons.push('backline')}
     w*=1+(1-hp)*1.25;
     if(hp<.65)reasons.push('wounded');
   }else if(enemy.role==='Skirmisher'){
     if(form!=='FRONT')w*=1.25;
   }
   if(BL14_PREDATORS.has(enemy.species)){
     w*=1+(1-hp)*2.3;
     if(hp<.7)reasons.push('wounded prey');
   }
   if(BL14_DISCIPLINED.has(enemy.species)){
     const vuln=(1-hp)+Math.max(0,25-a.guard)/50;
     w*=1+vuln*.9;
     if(vuln>.8)reasons.push('coordinated focus');
   }
   if(enemy.species==='Ogre'||enemy.species==='Frost Giant'||enemy.species==='Jotunn'){
     if(form==='FRONT'){w*=1.6;reasons.push('line breaker')}
   }
   if(enemy.species==='Storm Bird'||enemy.species==='Great Ryu'){
     if(form==='BACK'){w*=1.45;reasons.push('bypasses line')}
   }
   if(form==='FRONT')w*=1.12;
   return{u:a,w,reason:reasons.length?reasons.join(', '):'battlefield opportunity'};
 });
}
chooseEnemyTarget=function(allies,enemy){
 const entries=bl14TargetWeights(allies,enemy);if(!entries.length)return null;
 const chosen=bl14WeightedPick(entries);
 enemy._targetReason=chosen.reason;
 return chosen.u;
};

function bl14ProtectorFor(target,allies){
 if(bl14Formation(target)==='FRONT')return null;
 const protectors=alive(allies).filter(a=>a.id!==target.id&&BL14_PROTECTORS[a.className]);
 if(!protectors.length)return null;
 protectors.sort((a,b)=>(BL14_PROTECTORS[b.className]+b.guard/250)-(BL14_PROTECTORS[a.className]+a.guard/250));
 const p=protectors[0],chanceTo=clamp(BL14_PROTECTORS[p.className]+Math.min(.12,p.resolve/400),.12,.62);
 return chance(chanceTo)?p:null;
}
const _enemyAttackV14=enemyAttack;
enemyAttack=function(actor,target,p){
 const b=p.expedition.battle;if(!b||!target)return;
 let actual=target,reason=actor._targetReason||'battlefield opportunity';
 const protector=bl14ProtectorFor(target,b.allies);
 if(protector){
   b.log.push(`${protector.name} intercepts ${actor.name}'s attack meant for ${target.name}.`);
   actual=protector;reason=`intercepting for ${target.name}`;
 }
 actual._targetedBy=actual._targetedBy||[];
 actual._targetedBy.push({name:actor.name,reason});
 actual._lastTargetReason=reason;
 _enemyAttackV14(actor,actual,p);
};

function bl14InitiativeBonus(u,side){
 if(side==='a'){
   if(['Shinobi','Yumi Archer','March Ranger','Crossbowman'].includes(u.className))return 4;
   if(['Knight-Errant','Shieldthane','Man-at-Arms'].includes(u.className))return 1;
 }
 if(side==='e'){
   if(u.role==='Stalker')return 4;
   if(u.role==='Archer'||u.role==='Skirmisher')return 2;
   if(u.role==='Brute')return-2;
 }
 return 0;
}

const _supportActionV14=supportAction;
supportAction=function(actor,p){
 if(_supportActionV14(actor,p))return true;
 const b=p.expedition.battle;
 if(actor.className==='Houndmaster'&&b.round%3===1){
   const t=alive(b.enemies).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
   if(t){t.guard=Math.max(1,Math.round(t.guard*.9));t.accuracy=Math.max(1,Math.round(t.accuracy*.94));b.log.push(`${actor.name}'s hound harasses ${t.name}, opening its guard.`);return true}
 }
 if((actor.className==='Shaman'||actor.className==='Rune-Speaker')&&b.round%3===0){
   const allies=alive(b.allies);const t=allies.sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp)[0];
   if(t&&t.hp<t.maxHp){const heal=5+Math.round(actor.resolve*.18);t.hp=Math.min(t.maxHp,t.hp+heal);b.log.push(`${actor.name} wards ${t.name} for ${heal} HP.`);return true}
 }
 return false;
};

function bl14UnitStrength(u){
 if(!u||u.hp<=0)return 0;
 const hp=u.hp/Math.max(1,u.maxHp);
 return hp*(u.attack*.48+u.guard*.34+u.speed*.10+u.accuracy*.08+8);
}
function bl14BattleAssessment(p,b){
 const allies=alive(b.allies),enemies=alive(b.enemies);
 const allyPower=allies.reduce((s,u)=>s+bl14UnitStrength(u),0);
 const enemyPower=enemies.reduce((s,u)=>s+bl14UnitStrength(u),0);
 const ratio=enemyPower>0?allyPower/enemyPower:99;
 const allyHp=allies.length?allies.reduce((s,u)=>s+u.hp/u.maxHp,0)/allies.length:0;
 const enemyHp=enemies.length?enemies.reduce((s,u)=>s+u.hp/u.maxHp,0)/enemies.length:0;
 const downed=b.allies.length-allies.length;
 let label=ratio>=1.65?'DOMINANT':ratio>=1.15?'FAVORED':ratio>=.78?'EVEN':ratio>=.48?'DANGEROUS':'CRITICAL';
 return{allyPower,enemyPower,ratio,allyHp,enemyHp,downed,allies,enemies,label};
}
function bl14RetreatDecision(p,b){
 const x=bl14BattleAssessment(p,b);
 if(!x.allies.length)return{retreat:false,reason:'No conscious adventurers remain.',...x};
 if(!x.enemies.length)return{retreat:false,reason:'Enemy defeated.',...x};
 const nearlyFinished=x.enemies.length===1&&x.enemyHp<=.38;
 const healthyControl=x.allies.length>=2&&x.allyHp>=.55&&x.enemies.length<=x.allies.length;
 if(nearlyFinished||healthyControl||x.ratio>=1.18){
   return{retreat:false,reason:nearlyFinished?'One badly wounded enemy remains. Finish the fight.':healthyControl?'The surviving line still controls the field.':'The party retains the advantage.',...x};
 }
 let threshold=p.tactic==='Cautious'?.64:p.tactic==='Aggressive'?.27:.43;
 const chars=x.allies.map(u=>state.roster.find(a=>a.id===u.charId)).filter(Boolean);
 const captain=state.roster.find(a=>a.id===p.captainId);
 const coward=chars.filter(a=>a.traits?.includes('Cowardly')).length;
 const stubborn=chars.filter(a=>a.traits?.includes('Stubborn')||a.traits?.includes('Bloodthirsty')).length;
 threshold+=coward*.035-stubborn*.025;
 threshold-=Math.min(.06,(p.cohesion||0)/1200);
 if(captain){const d=derived(captain);if(d.combat.resolve>=30)threshold-=.045;else if(d.combat.resolve<18)threshold+=.04}
 if(x.downed>=Math.ceil(b.allies.length/2))threshold+=.08;
 threshold=clamp(threshold,.18,.78);
 const should=b.round>=2&&x.ratio<threshold;
 const reason=should?`Effective strength ${x.ratio.toFixed(2)}× enemy strength, below ${p.tactic} retreat threshold ${threshold.toFixed(2)}.`:`Effective strength ${x.ratio.toFixed(2)}× enemy strength; ${p.tactic} doctrine holds.`;
 return{retreat:should,threshold,reason,...x};
}

function bl14MaybeGlassHeart(p,b){
 const e=p.expedition;
 if(alive(b.allies).length||!hasArtifact('Glass Heart of Namar',e.contract.regionId)||e.glassHeartUsed)return false;
 const fallen=b.allies.slice().sort((x,y)=>y.maxHp-x.maxHp)[0];
 if(!fallen)return false;
 fallen.hp=1;e.glassHeartUsed=true;b.log.push(`The Glass Heart forces ${fallen.name} back onto their feet at 1 HP.`);return true;
}

combatRound=function(p){
 const e=p.expedition,b=e?.battle;if(!b)return;
 b.round++;
 b.allies.forEach(u=>{u._targetedBy=[];u._lastTargetReason='';});
 const order=[
  ...alive(b.allies).map(x=>({side:'a',x,init:x.speed+rnd(0,12)+bl14InitiativeBonus(x,'a')})),
  ...alive(b.enemies).map(x=>({side:'e',x,init:x.speed+rnd(0,12)+bl14InitiativeBonus(x,'e')}))
 ].sort((a,c)=>c.init-a.init);
 for(const turn of order){
   if(turn.x.hp<=0)continue;
   if(!alive(b.allies).length||!alive(b.enemies).length)break;
   if(turn.side==='a'){
     if(supportAction(turn.x,p))continue;
     const t=chooseAllyTarget(b.enemies,turn.x);if(t)allyAttack(turn.x,t,p);
   }else{
     const t=chooseEnemyTarget(b.allies,turn.x);if(t)enemyAttack(turn.x,t,p);
   }
 }
 b.enemies.forEach(x=>{if(x.hp>0&&x.regen)x.hp=Math.min(x.maxHp,x.hp+Math.round(x.maxHp*x.regen))});
 const apex=b.enemies.find(x=>x.legendary);
 if(apex&&apex.hp<=0)e.legendaryKilled=true;
 const liveApex=b.enemies.find(x=>x.legendary&&x.hp>0);
 if(liveApex)legendaryPulse(p,b,liveApex);
 if(!alive(b.enemies).length)return resolveBattle(p,true);
 if(!alive(b.allies).length){
   if(bl14MaybeGlassHeart(p,b)){save();render();return}
   return resolveBattle(p,false);
 }
 const decision=bl14RetreatDecision(p,b);
 b._assessment=decision;
 if(decision.retreat){
   e.retreated=true;
   b.log.push(`${p.tactic.toUpperCase()} DOCTRINE — retreat ordered. ${decision.reason}`);
   return resolveBattle(p,false);
 }
 if(b.round>=20){
   const win=decision.ratio>=1;
   b.log.push(`The prolonged fight breaks by remaining effective strength (${decision.ratio.toFixed(2)}×).`);
   return resolveBattle(p,win);
 }
 if(b.log.length>55)b.log=b.log.slice(-55);
 sfx('hit');save();render();
};

resolveBattle=function(p,win){
 const e=p.expedition,b=e.battle,c=e.contract,inf=hq(c.regionId).upgrades.Infirmary||0,deaths=[],captured=[];
 let bellAvailable=hasArtifact('The Mourning Bell',c.regionId)&&!e.bellUsed;
 const riskDeath=[.035,.075,.15,.26,.39][c.risk-1];
 b.allies.forEach(u=>{
  const a=state.roster.find(x=>x.id===u.charId);if(!a)return;
  const d=derived(a);a.hp=Math.max(1,Math.round(u.hp));
  if(u.hp<=0){
   let deathChance=riskDeath*(win?.38:1)*(1-inf*.1)*(1-(d.special.injuryResist||0)/100);
   if(e.retreated)deathChance*=p.tactic==='Cautious'?.38:p.tactic==='Balanced'?.52:.72;
   deathChance=clamp(deathChance,.005,.58);
   if(chance(deathChance)){
    if(bellAvailable){
     bellAvailable=false;e.bellUsed=true;a.status='Recovering';a.hp=1;a.injury='Bell-Touched';a.recovery=4;
     p.members.map(id=>state.roster.find(x=>x.id===id)).filter(x=>x&&x.id!==a.id&&x.status!=='Dead').forEach(x=>x.stats.resolve=Math.max(1,x.stats.resolve-1));
     b.log.push(`The Mourning Bell rings. ${a.name} returns at 1 HP.`);
    }else{
     a.status='Dead';a.hp=0;deaths.push(a.name);p.deaths++;a.history.push(`Day ${state.company.day}: died on ${c.title}.`);
    }
   }else if(!win&&canCapture(c.species)&&chance(e.retreated?.07:.15)){
    a.status='Captured';a.hp=1;a.injury=`Captured by ${c.species}`;a.recovery=0;captured.push({id:a.id,name:a.name});a.history.push(`Day ${state.company.day}: captured during ${c.title}.`);
   }else{
    a.status='Recovering';a.injury=`Badly Injured — ${injuryName()}`;
    a.recovery=Math.max(1,rnd(c.risk<=2?1:2,c.risk<=2?3:5)-Math.floor(inf/2));a.hp=1;
   }
  }else if(u.hp/u.maxHp<.38&&chance(.28)){
   a.status='Recovering';a.injury=injuryName();a.recovery=Math.max(1,rnd(1,2+c.risk)-Math.floor(inf/2));
  }else a.status='Expedition';
 });
 captured.forEach(x=>{
  const a=state.roster.find(q=>q.id===x.id);
  if(a&&!state.regions[c.regionId].contracts.some(rc=>rc.rescueTargetId===a.id))state.regions[c.regionId].contracts.unshift(rescueContract(a,c));
 });
 e.battle=null;e.fought=true;e.battleWon=win;e.deaths=deaths;e.captured=captured;
 e.events.push(win?'The enemy formation breaks.':e.retreated?`${p.name} breaks contact after the field turns genuinely unfavorable.`:'The party is driven from the field.');
 if(!win)e.progress=100;save();render();
};

const _finishExpeditionV14=finishExpedition;
finishExpedition=function(p){
 const e=p.expedition;if(!e)return;
 const c=e.contract,win=e.battleWon!==false,retreated=!!e.retreated,regionId=c.regionId;
 const lodge=hq(regionId).upgrades['Salvager’s Lodge']||0;
 _finishExpeditionV14(p);
 if(!lodge)return;
 let bonusItem=null,bonusCache=null;
 if(win&&chance(.08+lodge*.075)){
   let ri=itemRarityFrom(regionId,c.risk,false);
   if(chance(.08*lodge))ri++;
   if(lodge>=4&&chance(.08))ri++;
   ri=clamp(ri,0,4);
   bonusItem=generateItem(regionId,ri);inventoryEntry(bonusItem,regionId,1);
 }
 if(win&&chance(.035+lodge*.045)){
   let ri=clamp(itemRarityFrom(regionId,c.risk,false)+(lodge>=5&&chance(.18)?1:0),0,4);
   bonusCache={id:uid('cache'),name:`${RARITIES[ri]} Salvager Cache`,rarity:ri,regionId,from:c.title};
   state.caches.push(bonusCache);
 }
 if(!win&&retreated&&chance(lodge*.055)){
   const ri=clamp(Math.floor((lodge-1)/2),0,2);
   bonusItem=generateItem(regionId,ri);inventoryEntry(bonusItem,regionId,1);
 }
 if(bonusItem||bonusCache){
   pushHistory(`${hq(regionId).name}'s Salvager’s Lodge recovered ${bonusItem?bonusItem.name:''}${bonusItem&&bonusCache?' and ':''}${bonusCache?bonusCache.name:''}.`,regionId);
   const sheet=document.getElementById('sheet');
   if(sheet){
    let html='<div class="sectionTitle"><h3>Salvager’s Lodge</h3><span>recovered after-action material</span></div>';
    if(bonusItem)html+=itemHTML(bonusItem);
    if(bonusCache)html+=`<div class="card good"><b>${esc(bonusCache.name)}</b><div class="tiny muted">Added to the Vault.</div></div>`;
    sheet.insertAdjacentHTML('beforeend',html);
   }
   save();
 }
};

const _unitHTMLV14=unitHTML;
unitHTML=function(u){
 let html=_unitHTMLV14(u);
 const form=u.charId?bl14Formation(u):u.role||'ENEMY';
 const target=(u._targetedBy||[]).slice(-1)[0];
 const meta=`<div class="bl14UnitMeta"><span class="bl14Role">${esc(form)}</span>${target?`<span class="bl14Target">TARGETED: ${esc(target.name)} — ${esc(target.reason)}</span>`:''}</div>`;
 return html.replace('</div>',meta+'</div>');
};

const _battleHTMLV14=battleHTML;
battleHTML=function(b){
 const p=state.parties.find(q=>q.expedition?.battle===b);
 const x=p?bl14BattleAssessment(p,b):null;
 const read=x?`<div class="bl14BattleState ${x.label.toLowerCase()}"><b>${x.label}</b><span>Party ${x.ratio.toFixed(2)}× enemy effective strength</span><span>${p.tactic} doctrine</span></div>`:'';
 const formation=`<div class="bl14FormationKey"><span><b>FRONT</b> more likely to engage and intercept</span><span><b>BACK</b> protected, but stalkers/archers can reach them</span></div>`;
 return read+formation+_battleHTMLV14(b);
};

const _showHQInfoV14=typeof showHQInfo==='function'?showHQInfo:null;
if(_showHQInfoV14){
 showHQInfo=function(key){
   if(key!=='Salvager’s Lodge')return _showHQInfoV14(key);
   const lv=hq().upgrades[key]||0;
   modal(`<div class="sheetHead"><h3>Salvager’s Lodge</h3><button class="x" data-action="close">✕</button></div>
   <div class="card"><b>Level ${lv}/5</b><p class="small">Specialists follow expeditions, recover abandoned equipment, identify valuable caches and strip battlefields efficiently.</p></div>
   <div class="list">
    <div class="card"><b>Bonus item recovery</b><div class="tiny muted">${Math.round((.08+lv*.075)*100)}% after a successful contract at current level.</div></div>
    <div class="card"><b>Bonus cache discovery</b><div class="tiny muted">${Math.round((.035+lv*.045)*100)}% after a successful contract at current level.</div></div>
    <div class="card"><b>Rarity improvement</b><div class="tiny muted">Each level increases the chance that recovered items roll one rarity tier higher.</div></div>
    <div class="card"><b>Retreat recovery</b><div class="tiny muted">${Math.round(lv*.055*100)}% chance to recover equipment even after an organized retreat.</div></div>
   </div>`);
 };
}

const _auditV14=audit;
audit=function(){
 const out=_auditV14();
 out.combatV14=true;
 out.weightedTargeting=true;
 out.formationTargeting=true;
 out.protectorIntercepts=true;
 out.strengthBasedRetreat=true;
 out.salvagersLodge=!!HQ_DEFS['Salvager’s Lodge'];
 out.attritionTuned=true;
 return out;
};
window.__BL_AUDIT=audit;
