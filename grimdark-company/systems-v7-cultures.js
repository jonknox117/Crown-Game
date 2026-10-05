(function(){
'use strict';

// ---------------------------------------------------------------------------
// CULTURE / CLASS REBUILD
// Race, culture and class are now independent mechanical layers.
// The Graven March is a province of the Veyric homeland, so Veyric recruits
// dominate locally while foreigners remain possible.
// ---------------------------------------------------------------------------
const CULTURES={
 Veyric:{
  homeland:'The Veyric Marches',icon:'♜',inspiration:'Knightly marcher kingdoms',passive:'Drilled Society',
  desc:'Castle towns, feudal obligations, crossbow guilds, hunting kennels and hard military roads. +2 Guard, +1 Resolve and +2 Talk.',
  combat:{guard:2,resolve:1},util:{talk:2}
 },
 Skeldic:{
  homeland:'The Skeld Coast',icon:'ᛉ',inspiration:'Fjord-raider and shieldwall culture',passive:'Raid-Born',
  desc:'Cold coastal holds built around ships, shieldwalls, feuds and saga law. +2 Attack, +1 Resolve and +3 Endure.',
  combat:{attack:2,resolve:1},util:{endure:3}
 },
 Hoshin:{
  homeland:'The Hoshin Provinces',icon:'✦',inspiration:'Sword-house culture',passive:'Discipline of Form',
  desc:'Fortified provinces ruled through sword houses, retainers and exacting schools of war. +2 Accuracy, +1 Speed, +2 Scout and +1 Sneak.',
  combat:{accuracy:2,speed:1},util:{scout:2,sneak:1}
 },
 Nambara:{
  homeland:'The Redveld of Nambara',icon:'◈',inspiration:'Shield-and-spear war culture',passive:'Regimental Blood',
  desc:'Open red grasslands where disciplined shield-and-spear regiments move by cadence and encirclement. +2 Speed, +1 Guard, +2 Endure and +1 Scout. Multiple Nambarans fight especially well together.',
  combat:{speed:2,guard:1},util:{endure:2,scout:1},formation:.05
 }
};

const CLASSES={
 Veyric:[
  {name:'Knight-Errant',role:'Guardian',primary:'defense',desc:'A sworn mounted warrior forced to fight most contracts on foot.',combat:{attack:2,guard:4,resolve:2},util:{talk:2},ability:'Hold Fast — first-round incoming damage is reduced.'},
  {name:'Man-at-Arms',role:'Frontline',primary:'power',desc:'Professional infantry drilled around spear, shield and brutal close work.',combat:{attack:3,guard:3,accuracy:1},util:{endure:1},ability:'Drilled — strong attack and guard with no major weakness.'},
  {name:'Crossbowman',role:'Marksman',primary:'awareness',desc:'Guild-trained missile soldier carrying a weapon built to punch through armor.',combat:{attack:2,accuracy:5,guard:1},util:{scout:1},ability:'Armor Punch — opening volleys hit especially hard when the party has initiative.'},
  {name:'Houndmaster',role:'Controller',primary:'awareness',desc:'Handler of war hounds, trackers and ugly kennel-bred pursuit dogs.',combat:{attack:2,speed:2,accuracy:2},util:{scout:4,endure:1,talk:1},ability:'Harriers — hounds worry the enemy line, slightly reducing enemy Guard.'},
  {name:'March Ranger',role:'Scout',primary:'awareness',desc:'Border hunter serving isolated keeps and roadwardens.',combat:{attack:1,speed:2,accuracy:2},util:{sneak:2,scout:4,endure:1},ability:'Opening Shot — Scout success improves first-round damage.'},
  {name:'Battle Chaplain',role:'Support',primary:'resolve',desc:'Field priest trained to keep frightened soldiers moving and dead things down.',combat:{guard:1,resolve:4},util:{talk:2,occult:3,endure:1},ability:'Last Rites — steadies the line and blunts undead pressure.'}
 ],
 Skeldic:[
  {name:'Shieldthane',role:'Guardian',primary:'defense',desc:'Heavy shield fighter sworn to a hold, ship or household.',combat:{attack:1,guard:5,resolve:2},util:{endure:2},ability:'Shield Wall — reduces incoming combat damage.'},
  {name:'Berserker',role:'Striker',primary:'power',desc:'Fury-driven axe fighter whose usefulness rises with the blood level.',combat:{attack:5,guard:-1,speed:1},util:{endure:1},ability:'Blood Heat — deals more damage when the party is badly hurt.'},
  {name:'Raider',role:'Skirmisher',primary:'speed',desc:'Fast coastal fighter accustomed to violent entries and rapid withdrawals.',combat:{attack:3,speed:3,accuracy:1},util:{sneak:2,scout:2,endure:1},ability:'Beach Rush — gains opening damage when the party takes initiative.'},
  {name:'Skald',role:'Support',primary:'resolve',desc:'Saga-keeper, law-speaker and morale fighter.',combat:{attack:1,resolve:4},util:{talk:4,occult:1},ability:'War Song — reduces collapse when the party is bloodied.'},
  {name:'Rune-Seer',role:'Mystic',primary:'awareness',desc:'Reader of carved signs, graves, weather and old stone magic.',combat:{guard:1,accuracy:1,resolve:2},util:{occult:5,scout:1},ability:'Rune Ward — reduces pressure from undead and supernatural enemies.'}
 ],
 Hoshin:[
  {name:'Samurai',role:'Duelist',primary:'power',desc:'Sword-retainer of a Hoshin house, drilled for composure and decisive violence.',combat:{attack:3,guard:2,accuracy:4,resolve:2},util:{talk:1},ability:'Perfect Cut — increased critical-hit chance.'},
  {name:'Yumi Archer',role:'Marksman',primary:'awareness',desc:'Longbow specialist trained around distance, timing and disciplined volleys.',combat:{attack:2,speed:2,accuracy:5},util:{scout:3},ability:'First Volley — stronger opening damage when the party has initiative.'},
  {name:'Shinobi',role:'Infiltrator',primary:'speed',desc:'Scout, spy and saboteur working outside formal battle lines.',combat:{attack:2,speed:4,accuracy:2},util:{sneak:5,scout:3,talk:1},ability:'Hidden Blade — successful Sneak work converts into opening combat damage.'},
  {name:'Ashigaru',role:'Frontline',primary:'defense',desc:'Disciplined common infantry drilled to hold formation with spear and bow.',combat:{attack:2,guard:3,accuracy:2,resolve:1},util:{endure:2},ability:'Ranks — multiple Hoshin fighters slightly improve defensive cohesion.'},
  {name:'Spirit Scribe',role:'Mystic',primary:'awareness',desc:'Ritual scholar who records names, omens and hostile spirits.',combat:{guard:1,resolve:3},util:{occult:5,talk:1,scout:1},ability:'Binding Script — Occult success weakens supernatural enemies.'}
 ],
 Nambara:[
  {name:'Spearwall',role:'Frontline',primary:'defense',desc:'Disciplined short-spear and shield fighter trained to stay inside the formation.',combat:{attack:2,guard:4,resolve:1},util:{endure:2},ability:'Close Ranks — gains extra protection beside another Nambaran.'},
  {name:'Horn Runner',role:'Skirmisher',primary:'speed',desc:'Fast flanking fighter trained to run wide and close the encirclement.',combat:{attack:2,speed:5,accuracy:1},util:{sneak:2,scout:3,endure:1},ability:'Encircle — exceptional Speed helps steal the opening exchange.'},
  {name:'Shield-Breaker',role:'Striker',primary:'power',desc:'Heavy assault fighter tasked with cracking a fixed enemy line.',combat:{attack:5,guard:1,accuracy:1},util:{endure:2},ability:'Break the Line — attacks partially ignore enemy Guard.'},
  {name:'War-Singer',role:'Support',primary:'resolve',desc:'Cadence-keeper who coordinates movement, nerve and formation changes.',combat:{attack:1,resolve:5},util:{talk:3,endure:1},ability:'Battle Rhythm — bloodied parties lose less momentum.'},
  {name:'Bone-Seer',role:'Mystic',primary:'awareness',desc:'Reader of ancestors, wounds and battlefield omens.',combat:{guard:1,resolve:3},util:{occult:4,scout:2},ability:'Ancestor Sign — improves supernatural awareness and resistance.'}
 ]
};

const RACE_V7={
 Human:{passive:'Adaptable Blood',desc:'+2 base Resolve and +10% contract XP. Humans adapt quickly to foreign doctrine.',xp:1.10},
 Dwarf:{passive:'Stoneblood',desc:'+5 base Defense and 15% less expedition attrition from exposure, disease and hardship.',attrition:.85},
 Elf:{passive:'Keen Senses',desc:'+3 base Speed and +4 base Awareness. Their advantage is perception and reaction, not culture.'},
 Orc:{passive:'Powerful Build',desc:'+5 base Power. Orc strength remains useful no matter which culture trained them.'}
};

const LEGACY_CULTURE={
 'Marcher Kingdoms':'Veyric','Fjord Holds':'Skeldic','Sword Houses':'Hoshin','Shield-Spear Clans':'Nambara'
};
const LEGACY_CLASS_CULTURE={
 'Man-at-Arms':'Veyric','Knight-Errant':'Veyric','March Ranger':'Veyric','Battle Chaplain':'Veyric','Crossbowman':'Veyric','Houndmaster':'Veyric',
 'Shieldthane':'Skeldic','Berserker':'Skeldic','Skald':'Skeldic','Rune-Seer':'Skeldic','Raider':'Skeldic',
 'Samurai':'Hoshin','Yumi Archer':'Hoshin','Shadow Scout':'Hoshin','Shinobi':'Hoshin','Ashigaru':'Hoshin','Spirit Scribe':'Hoshin',
 'Spearwall':'Nambara','Horn Runner':'Nambara','War-Singer':'Nambara','Bone-Seer':'Nambara','Shield-Breaker':'Nambara'
};
const AFFINITY={Human:'Veyric',Dwarf:'Skeldic',Elf:'Hoshin',Orc:'Nambara'};
const UTIL={talk:'Talk',sneak:'Sneak',scout:'Scout',endure:'Endure',occult:'Occult'};

function h7(s){let h=0;for(let i=0;i<String(s).length;i++)h=((h<<5)-h+String(s).charCodeAt(i))|0;return Math.abs(h)}
function weighted(entries){let total=entries.reduce((s,x)=>s+x[1],0),n=Math.random()*total;for(const [k,w] of entries){n-=w;if(n<=0)return k}return entries[0][0]}
function localCulture(){return state.currentCulture||'Veyric'}
function chooseCulture(race){
 const local=localCulture(),aff=AFFINITY[race]||'Veyric';
 if(local===aff)return weighted([[local,85],...Object.keys(CULTURES).filter(x=>x!==local).map(x=>[x,5])]);
 const others=Object.keys(CULTURES).filter(x=>x!==local&&x!==aff);
 return weighted([[local,65],[aff,25],[others[0],5],[others[1],5]]);
}
function cultureClass(culture,seed){const pool=CLASSES[culture]||CLASSES.Veyric;return pool[h7(seed)%pool.length]}
function classRule7(r){const pool=CLASSES[r.culture]||CLASSES.Veyric;return pool.find(c=>c.name===r.className)||cultureClass(r.culture,r.id||r.name)}
function ensure7(r,isNew=false){
 if(!r)return r;
 let c=LEGACY_CULTURE[r.culture]||r.culture;
 const inferred=LEGACY_CLASS_CULTURE[r.className];
 if(inferred)c=inferred;
 if(!CULTURES[c])c=isNew?chooseCulture(r.race):(AFFINITY[r.race]||'Veyric');
 r.culture=c;
 const valid=(CLASSES[c]||[]).some(x=>x.name===r.className);
 if(!valid)r.className=cultureClass(c,r.id||r.name).name;
 return r;
}
function tRules(r){const T=window.blRules?.TRAIT_RULES||{};return (r.traits||[]).map(t=>T[t]).filter(Boolean)}
function add7(out,obj){if(!obj)return;Object.entries(obj).forEach(([k,v])=>out[k]=(out[k]||0)+v)}
function combat7(r){
 ensure7(r);const c=classRule7(r),cul=CULTURES[r.culture];
 const o={attack:r.stats.power,guard:r.stats.defense,speed:r.stats.speed,accuracy:Math.round((r.stats.awareness+r.stats.speed)/2),resolve:r.stats.resolve};
 add7(o,cul.combat);add7(o,c.combat);tRules(r).forEach(t=>add7(o,t.combat));return o;
}
function utility7(r){
 ensure7(r);const c=classRule7(r),cul=CULTURES[r.culture];
 const o={talk:Math.round(r.stats.resolve*.42+r.stats.awareness*.18),sneak:Math.round(r.stats.speed*.42+r.stats.awareness*.25),scout:Math.round(r.stats.awareness*.52+r.stats.speed*.18),endure:Math.round(r.stats.defense*.42+r.stats.resolve*.28),occult:Math.round(r.stats.awareness*.34+r.stats.resolve*.26)};
 add7(o,cul.util);add7(o,c.util);tRules(r).forEach(t=>add7(o,t.util));Object.keys(o).forEach(k=>o[k]=Math.max(0,Math.round(o[k])));return o;
}
function members7(p){return p.members.map(id=>state.roster.find(r=>r.id===id)).filter(r=>r&&r.status!=='Dead')}
function profile7(p){
 const ms=members7(p),o={attack:0,guard:0,speed:0,accuracy:0,resolve:0};
 ms.forEach(r=>{const s=combat7(r);Object.keys(o).forEach(k=>o[k]+=s[k])});
 if(ms.length){o.speed/=ms.length;o.accuracy/=ms.length;o.resolve/=ms.length}
 const n=ms.filter(r=>r.culture==='Nambara').length;if(n>1)o.attack*=1+(n-1)*CULTURES.Nambara.formation;
 return o;
}
function best7(p,key){let best=null;members7(p).forEach(r=>{const value=utility7(r)[key];if(!best||value>best.value)best={r,value}});return best||{r:null,value:0}}
function strongest7(p){return Object.keys(UTIL).map(k=>({k,...best7(p,k)})).sort((a,b)=>b.value-a.value)}
function attrition7(r){let m=RACE_V7[r.race]?.attrition||1;tRules(r).forEach(t=>m*=t.attrition||1);return m}

// Migrate existing people without rerolling their race, level, traits or equipment.
state.currentRegion=state.currentRegion||'The Graven March';
state.currentCulture=state.currentCulture||'Veyric';
[...(state.roster||[]),...(state.recruits||[])].forEach(r=>ensure7(r,false));

// Keep public rules truthful. The old closure remains for legacy compatibility,
// but all active combat/field/UI paths below use the independent v7 rules.
if(window.blRules){
 const oldR=window.blRules.RACE_RULES||{};
 Object.keys(RACE_V7).forEach(r=>{if(oldR[r]){oldR[r].passive=RACE_V7[r].passive;oldR[r].desc=RACE_V7[r].desc;oldR[r].combat={};oldR[r].util={};oldR[r].stat={};if(RACE_V7[r].xp)oldR[r].xp=RACE_V7[r].xp;if(RACE_V7[r].attrition)oldR[r].attrition=RACE_V7[r].attrition}});
 Object.assign(window.blRules,{CULTURE_RULES:CULTURES,CULTURE_CLASS_POOLS:CLASSES,RACE_V7,combatStats:combat7,utilityStats:utility7,partyProfile:profile7});
}

const recruitBefore7=recruitGen;
recruitGen=function(){const r=recruitBefore7();r.culture=chooseCulture(r.race);r.className=pick(CLASSES[r.culture]).name;return ensure7(r,true)};

function showRace7(race){const x=RACE_V7[race];modal(`<div class="sheetHead"><h3>${RACES[race]} ${race}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card"><b>${x.passive}</b><p class="small">${x.desc}</p></div><p class="tiny muted">Race is biological. It does not determine culture or class.</p>`)}
function showCulture7(name){const x=CULTURES[name];modal(`<div class="sheetHead"><h3>${x.icon} ${name}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="hero miniHero"><div class="kicker">${x.homeland}</div><h2>${x.passive}</h2><p>${x.desc}</p></div><div class="sectionTitle"><h3>Classes</h3><span>${CLASSES[name].length}</span></div>${CLASSES[name].map(c=>`<div class="card small cultureClass"><b>${c.name}</b> • ${c.role}<br><span class="muted">${c.desc}</span></div>`).join('')}`)}
function showClass7(culture,name){const c=(CLASSES[culture]||[]).find(x=>x.name===name);if(!c)return;modal(`<div class="sheetHead"><h3>${name}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card"><b>${c.role}</b><p class="small">${c.desc}</p><div class="gold small">${c.ability}</div></div><p class="tiny muted">Class bonuses stack with ${culture} culture bonuses, race bonuses and traits.</p>`)}
function showTrait7(name){const t=window.blRules?.TRAIT_RULES?.[name];if(!t)return;modal(`<div class="sheetHead"><h3>${name}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card small">${t.desc}</div>`)}
window.blShowRace=showRace7;window.blShowCulture=showCulture7;window.blShowClass=showClass7;window.blShowTrait=showTrait7;

rosterCard=function(r){ensure7(r);const c=classRule7(r);return `<div class="card member clickable inspect" data-id="${r.id}"><div class="portrait">${RACES[r.race]}</div><div><div class="statline"><h4>${r.name}</h4><span>Lv.${r.lvl}</span></div><div class="small muted">${r.race} • <b class="classText">${r.className}</b> • ${r.bg}</div><div class="tiny cultureLine">${CULTURES[r.culture].icon} ${r.culture} • ${c.role}</div><div class="hpbar"><i style="width:${r.hp/r.maxHp*100}%"></i></div><div class="tags">${(r.traits||[]).map(t=>`<button class="tag keywordInfo" onclick="event.stopPropagation();blShowTrait('${t.replace(/'/g,"\\'")}')">${t} ⓘ</button>`).join('')}${r.injury?`<span class="tag danger">${r.injury}</span>`:''}</div></div></div>`};

recruitCard=function(r){ensure7(r);return `<div class="card recruit"><div class="portrait">${RACES[r.race]}</div><div><h4>${r.name}</h4><div class="small muted">${r.race} • <b class="classText">${r.className}</b></div><div class="tiny cultureLine">${CULTURES[r.culture].icon} ${r.culture} • ${r.bg} • ${r.wage}s/week</div><div class="tags">${(r.traits||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div><div class="recruitActions"><button class="btn ghost recruitInfo" data-id="${r.id}">ⓘ</button><button class="btn goldbtn hire" data-id="${r.id}" ${employedCount()>=cap()||state.silver<r.hire?'disabled':''}>Hire<br>${r.hire}s</button></div></div>`};

inspectRecruit=function(id){
 const r=state.roster.find(x=>x.id===id)||state.recruits.find(x=>x.id===id);if(!r)return;ensure7(r);
 const cul=CULTURES[r.culture],c=classRule7(r),u=utility7(r),cs=combat7(r),rr=RACE_V7[r.race],xpNext=r.xpNext||50;
 const gearRule=n=>window.blItemRules?.[n]?.desc||'No documented modifier.';
 modal(`<div class="sheetHead"><div><h3>${RACES[r.race]} ${r.name}</h3><div class="small muted">Level ${r.lvl} • ${r.bg} • ${r.status}</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="identityStack"><button onclick="blShowRace('${r.race}')"><span>RACE</span><b>${r.race}</b><small>${rr.passive}</small></button><button onclick="blShowCulture('${r.culture}')"><span>CULTURE</span><b>${cul.icon} ${r.culture}</b><small>${cul.passive}</small></button><button onclick="blShowClass('${r.culture}','${r.className.replace(/'/g,"\\'")}')"><span>CLASS</span><b>${r.className}</b><small>${c.role}</small></button></div>
 <div class="sectionTitle"><h3>Combat</h3><span>Race + culture + class + traits</span></div><div class="skillGrid">${Object.entries(cs).map(([k,v])=>`<div class="skillBox"><span>${k.toUpperCase()}</span><b>${Math.round(v)}</b></div>`).join('')}</div>
 <div class="sectionTitle"><h3>Field Skills</h3><span>Used during expeditions</span></div><div class="skillGrid">${Object.entries(u).map(([k,v])=>`<div class="skillBox"><span>${UTIL[k].toUpperCase()}</span><b>${v}</b></div>`).join('')}</div>
 <div class="sectionTitle"><h3>Traits</h3><span>All mechanical</span></div><div class="list">${(r.traits||[]).map(t=>`<button class="card choice traitExplain" onclick="blShowTrait('${t.replace(/'/g,"\\'")}')"><b>${t}</b><div class="tiny muted">${window.blRules?.TRAIT_RULES?.[t]?.desc||''}</div></button>`).join('')||'<div class="empty">No notable traits.</div>'}</div>
 <div class="sectionTitle"><h3>Condition</h3><span>${r.hp}/${r.maxHp} HP</span></div><div class="hpbar"><i style="width:${r.hp/r.maxHp*100}%"></i></div>${r.injury?`<div class="card danger recoveryDetail"><b>${r.injury}</b><br>${r.recovery} recovery day(s) remaining</div>`:''}
 <div class="sectionTitle"><h3>Level Progress</h3><span>${r.xp||0}/${xpNext} XP</span></div><div class="bar goldbar"><i style="width:${Math.min(100,(r.xp||0)/xpNext*100)}%"></i></div><div class="card small"><b>On level:</b> +1 all five base stats, +2 extra ${c.primary.charAt(0).toUpperCase()+c.primary.slice(1)}, +5 max HP.</div>
 <div class="sectionTitle"><h3>Equipment</h3><span>Changes stats immediately</span></div><div class="equipmentSummary card"><div><span class="tiny muted">WEAPON</span><b>${r.gear.weapon}</b><small>${gearRule(r.gear.weapon)}</small></div><div><span class="tiny muted">ARMOR</span><b>${r.gear.armor}</b><small>${gearRule(r.gear.armor)}</small></div></div>${state.roster.some(x=>x.id===r.id)&&window.blOpenEquipment?`<div class="actions"><button class="btn goldbtn" onclick="blOpenEquipment('${r.id}')">Manage Equipment</button>${r.status==='Recovering'&&window.blTreatAdventurer?`<button class="btn" onclick="blTreatAdventurer('${r.id}')">Treat Injury</button>`:''}</div>`:''}
 <div class="sectionTitle"><h3>Record</h3></div><div class="card small">Missions: ${r.missions}<br>Kills: ${r.kills}<br>Scars: ${r.scars.length?r.scars.join(', '):'None'}</div>`)
};

const priorRosterRender7=renderRoster;
renderRoster=function(){let html=priorRosterRender7();html=html.replace('<div class="kicker">COMPANY ROSTER</div>','<div class="kicker">COMPANY ROSTER • VEYRIC HOMELAND</div>');html=html.replace('Names become veterans, cripples, corpses, or legends. Most become one of the first three.','Greyhaven sits inside the Veyric Marches. Most local hires know Veyric doctrine; foreigners arrive as mercenaries, exiles and travelers.');return html};

partyCard=function(p){
 const ms=members7(p),max=window.blPartyCap?blPartyCap():4,best=strongest7(p).slice(0,2);p.tactic=p.tactic||'Balanced';
 return `<div class="card" style="margin-bottom:8px"><div class="statline"><b>${p.name}</b><span>${ms.length}/${max}</span></div><div class="partyMembers">${ms.map(r=>`<div class="facechip" title="${r.name} • ${r.culture} ${r.className}">${RACES[r.race]}<span class="lvl">${r.lvl}</span></div>`).join('')||'<span class="small muted">Empty party</span>'}</div>${ms.length?`<div class="partySkills">${best.map(x=>`<span>${UTIL[x.k]} <b>${x.value}</b></span>`).join('')}</div>`:''}<div class="tacticStrip"><span class="tiny muted">TACTIC</span>${['Cautious','Balanced','Aggressive'].map(t=>`<button class="tacticBtn ${p.tactic===t?'selected':''}" onclick="blSetTactic7('${p.id}','${t}')" ${p.expedition?'disabled':''}>${t}</button>`).join('')}</div><div class="actions"><button class="btn partyEdit" data-party="${p.id}" ${p.expedition?'disabled':''}>Assign Members</button></div></div>`
};
function setTactic7(pid,t){const p=state.parties.find(x=>x.id===pid);if(!p||p.expedition)return;p.tactic=t;save();if(window.blSound)blSound('tap');render()}
window.blSetTactic7=setTactic7;

chooseParty=function(cid){const c=state.contracts.find(x=>x.id===cid);let idle=state.parties.filter(p=>!p.expedition&&p.members.length);if(!idle.length)return toast('No staffed idle party.');modal(`<div class="sheetHead"><h3>Send a party</h3><button class="x" onclick="closeModal()">✕</button></div><p class="small muted">${c.title} • Risk ${c.risk}/4 • culture, class and traits all feed these numbers.</p>${idle.map(p=>{const prof=profile7(p),best=strongest7(p).slice(0,3);return `<button class="btn choice dispatch" data-party="${p.id}"><b>${p.name}</b><br><span class="tiny">${p.members.length} members • ATK ${Math.round(prof.attack)} • GUARD ${Math.round(prof.guard)} • SPD ${Math.round(prof.speed)}</span><div class="partySkills">${best.map(x=>`<span>${UTIL[x.k]} <b>${x.value}</b></span>`).join('')}</div></button>`}).join('')}`);document.querySelectorAll('.dispatch').forEach(b=>b.onclick=()=>dispatch(cid,b.dataset.party))};

const FIELD={
 talk:[['A local reeve blocks the road with armed retainers.','The party gets passage and a useful warning.','The exchange turns hostile and useful time is lost.'],['Refugees crowd a narrow causeway.','A calm voice gets everyone moving without bloodshed.','Panic spreads and the party loses ground.']],
 sneak:[['Enemy lookouts hold the obvious approach.','The party slips around them unseen.','A snapped branch gives away the approach.'],['A ruined lane offers cover and several bad angles.','The party crosses without showing itself.','Movement is spotted from the ruins.']],
 scout:[['Tracks split around old stonework.','The party reads the ground correctly and finds the safer route.','The wrong trail costs time and gives the enemy warning.'],['Crows lift from something beyond sight.','The scout identifies danger before entering it.','The party walks into the sign too late.']],
 endure:[['Cold rain turns the road into sucking mud.','The party keeps formation and pace.','Exhaustion and exposure take their toll.'],['Spoiled provisions are discovered halfway out.','The party rations what remains and keeps moving.','Hunger and sickness weaken someone.']],
 occult:[['Old grave-marks have been freshly disturbed.','The signs are read before anything answers them.','The party misunderstands the warning and something notices.'],['A roadside shrine has been turned to face the wrong direction.','The ritual meaning is recognized in time.','The party carries the omen with them.']]
};
function fieldKey(c){
 const p=c.place||'';
 let w=p.includes('Saint')||p.includes('Drowned')?[['occult',30],['scout',20],['endure',20],['sneak',15],['talk',15]]:p.includes('Blackpine')?[['scout',30],['sneak',25],['endure',20],['talk',15],['occult',10]]:p.includes('Old Road')?[['talk',35],['scout',20],['sneak',20],['endure',15],['occult',10]]:[['endure',30],['scout',25],['sneak',20],['talk',15],['occult',10]];
 return weighted(w);
}
function fieldCheck7(p){
 const e=p.expedition,c=e.contract,key=fieldKey(c),best=best7(p,key),scene=pick(FIELD[key]);if(!best.r)return;
 const diff=8+c.risk*4+c.unknown*2;let roll=best.value+rnd(-4,5);if((best.r.traits||[]).includes('Lucky')&&Math.random()<.2)roll+=4;const ok=roll>=diff;
 e.events.push(`${UTIL[key].toUpperCase()} — ${scene[0]}`);e.events.push(`${best.r.name} (${best.r.culture} ${best.r.className}) ${ok?'succeeds':'fails'} — ${roll} vs ${diff}. ${ok?scene[1]:scene[2]}`);e.checks=(e.checks||[]).concat({key,name:best.r.name,ok,roll,diff});
 if(ok){if(key==='talk')e.bonusPay=(e.bonusPay||0)+.08;if(key==='sneak')e.ambush=(e.ambush||0)+.12;if(key==='scout')e.scoutEdge=(e.scoutEdge||0)+.12;if(key==='endure')e.attritionEdge=(e.attritionEdge||0)+.18;if(key==='occult')e.occultEdge=(e.occultEdge||0)+.15}
 else{if(key==='sneak'||key==='scout')e.enemyAmbush=(e.enemyAmbush||0)+.10;if(key==='occult')e.occultTrouble=(e.occultTrouble||0)+.12;if(key==='endure'){const victim=pick(members7(p));if(victim){const dmg=Math.max(3,Math.round(10*attrition7(victim)));victim.hp=Math.max(1,victim.hp-dmg);e.events.push(`${victim.name} loses ${dmg} HP to attrition.`)}}if(key==='talk')e.bonusPay=(e.bonusPay||0)-.04}e.lastCheckStep=e.step;
}

advanceExpedition=function(pid,manual=false){const p=state.parties.find(x=>x.id===pid);if(!p||!p.expedition)return;const e=p.expedition;if(e.battle){combatRound(p);return}e.step++;e.progress=clamp(e.progress+rnd(12,21),0,100);if(e.progress<64&&(!e.lastCheckStep||e.step-e.lastCheckStep>=2)&&Math.random()<.58){fieldCheck7(p)}else if(e.progress<65){e.events.push(`+${e.progress}% — ${pick(phaseEvents)}`)}else if(!e.fought){e.fought=true;startCombat(p);return}else e.events.push(`+${e.progress}% — The party pushes toward the objective.`);if(e.progress>=100&&!e.battle)finishExpedition(p);render()};

function enemy7(c){const base=c.risk*42+c.unknown*5+rnd(-6,8);return{attack:base*1.02,guard:base*.9,speed:10+c.risk*3+rnd(0,5),accuracy:11+c.risk*3,resolve:12+c.risk*5}}
function supernatural(c){return /Zombie|Ghoul|Skeleton|Wight|undead|grave|spirit|crypt/i.test((c.enemies||[]).join(' ')+' '+c.title)}
startCombat=function(p){
 const e=p.expedition,c=e.contract,prof=profile7(p),enemy=enemy7(c),ms=members7(p);let first=(prof.speed+(e.ambush||0)*20)-(enemy.speed+(e.enemyAmbush||0)*20);
 enemy.attack*=1+(e.occultTrouble||0);enemy.guard*=1-(e.scoutEdge||0)-(e.occultEdge||0);
 p.tactic=p.tactic||'Balanced';if(p.tactic==='Cautious'){enemy.attack*=.82;enemy.guard*=1.10;e.events.push('TACTIC — Cautious formation.')}if(p.tactic==='Aggressive'){enemy.attack*=1.12;enemy.guard*=.86;e.events.push('TACTIC — Aggressive push.')}
 if(ms.some(r=>r.className==='Houndmaster')){enemy.guard*=.95;e.events.push('CLASS — War hounds harry the enemy line.')}
 if(supernatural(c)&&state.artifacts?.some(a=>a.name==='Saint Veyra’s Nail')){enemy.attack*=.80;enemy.guard*=.85;e._veyra=true;e.events.push('RELIC — Saint Veyra’s Nail burns cold.')}
 if(supernatural(c)&&ms.some(r=>r.className==='Rune-Seer'))enemy.attack*=.90;
 if(supernatural(c)&&ms.some(r=>r.className==='Battle Chaplain'))enemy.attack*=.95;
 if(supernatural(c)&&ms.some(r=>r.className==='Bone-Seer'))enemy.attack*=.94;
 e.battle={partyName:p.name,partyHp:100,enemyHp:100,profile:prof,enemyProfile:enemy,enemy:pick(c.enemies),round:0,first:first>=0?'party':'enemy'};e.events.push(`ENCOUNTER — ${c.enemies.join(', ')}.`);e.events.push(`${first>=0?'The party seizes':'The enemy steals'} the opening tempo.`);if(window.blSound)blSound('danger');render();setTimeout(()=>combatRound(p),350)
};

combatRound=function(p){
 const e=p.expedition,b=e?.battle;if(!b)return;b.round++;const prof=profile7(p),enemy=b.enemyProfile,ms=members7(p);let hit=Math.max(.45,Math.min(.96,.62+(prof.accuracy-enemy.speed)*.012)),ehit=Math.max(.42,Math.min(.94,.62+(enemy.accuracy-prof.speed)*.012));let pd=rnd(7,13)*(prof.attack/(enemy.guard+35)),ed=rnd(6,12)*(enemy.attack/(prof.guard+35));
 if(b.round===1){if(b.first==='party')pd*=1.22;else ed*=1.22}
 if(ms.some(r=>r.className==='Knight-Errant')&&b.round===1)ed*=.78;
 if(ms.some(r=>r.className==='Crossbowman')&&b.round===1&&b.first==='party')pd*=1.16;
 if(ms.some(r=>r.className==='March Ranger')&&b.round===1&&e.scoutEdge)pd*=1.18;
 if(ms.some(r=>r.className==='Shieldthane'))ed*=.92;
 if(ms.some(r=>r.className==='Berserker')&&b.partyHp<55)pd*=1.18;
 if(ms.some(r=>r.className==='Raider')&&b.round===1&&b.first==='party')pd*=1.12;
 if(ms.some(r=>r.className==='Skald')&&b.partyHp<50)ed*=.94;
 if(ms.some(r=>r.className==='Yumi Archer')&&b.round===1&&b.first==='party')pd*=1.18;
 if(ms.some(r=>r.className==='Shinobi')&&b.round===1&&e.ambush)pd*=1.20;
 if(ms.filter(r=>r.culture==='Hoshin').length>1&&ms.some(r=>r.className==='Ashigaru'))ed*=.95;
 if(ms.some(r=>r.className==='Shield-Breaker'))pd*=1.08;
 if(ms.some(r=>r.className==='War-Singer')&&b.partyHp<50){ed*=.95;pd*=1.05}
 if(ms.filter(r=>r.culture==='Nambara').length>1&&ms.some(r=>r.className==='Spearwall'))ed*=.92;
 if(Math.random()>hit)pd*=.35;if(Math.random()>ehit)ed*=.35;
 let crit=.06+ms.filter(r=>r.className==='Samurai').length*.035+ms.reduce((s,r)=>s+((r.traits||[]).includes('Lucky')?.05:0),0);if(Math.random()<crit){pd*=1.65;e.events.push('A clean critical strike tears through the enemy line.')}
 if(b.partyHp<35&&prof.resolve<14)ed*=1.18;else if(b.partyHp<35&&prof.resolve>21)pd*=1.10;
 b.enemyHp=clamp(b.enemyHp-pd,0,100);b.partyHp=clamp(b.partyHp-ed,0,100);e.events.push(`Round ${b.round}: ${Math.round(pd)}% dealt • ${Math.round(ed)}% taken. ATK ${Math.round(prof.attack)} / GUARD ${Math.round(prof.guard)} / RES ${Math.round(prof.resolve)}.`);if(window.blSound)blSound('hit');if(b.enemyHp<=0||b.partyHp<=0||b.round>=8)resolveCombat(p,b.partyHp>b.enemyHp);render()
};

// Class specialty now follows the actual class rather than the old race-keyed pool.
levelCheck=function(r){ensure7(r);while(r.xp>=r.xpNext){r.xp-=r.xpNext;r.lvl++;r.xpNext=Math.floor(r.xpNext*1.35);['power','defense','speed','awareness','resolve'].forEach(k=>r.stats[k]=(r.stats[k]||0)+1);const primary=classRule7(r).primary||'power';r.stats[primary]+=2;r.maxHp+=5;r.hp=Math.min(r.maxHp,r.hp+12);state.log.push(`${r.name} reached Level ${r.lvl}: +1 all stats, +2 ${primary}, +5 max HP.`);if(window.blSound)blSound('success')}};

renderWorld=function(){
 const pos={'Greyhaven':[50,50],'Blackpine Forest':[24,22],'Drowned Farms':[73,28],'Redfang Hills':[20,77],'Saint Orrin’s Vale':[76,75],'The Old Road':[51,16]};
 return `<div class="hero"><div class="kicker">THE GRAVEN MARCH • VEYRIC MARCHES</div><h2>The current map is Veyric country.</h2><p>Greyhaven lies on the failing edge of the Veyric Marches. That is why most recruits here know knightly, crossbow, kennel and marcher doctrine.</p></div><div class="map">${Object.entries(pos).map(([n,p])=>`<div class="place ${n!=='Greyhaven'&&state.threats[n]>45?'dangerp':''}" style="left:${p[0]}%;top:${p[1]}%"><b>${n==='Greyhaven'?'🏚️':n==='Blackpine Forest'?'🌲':n==='Drowned Farms'?'🌾':n==='Redfang Hills'?'⛰️':n==='Saint Orrin’s Vale'?'⛪':'🛣️'}</b>${n}</div>`).join('')}</div><div class="sectionTitle"><h3>Regional Threat</h3><span>0 safe • 100 lost</span></div>${Object.entries(state.threats).map(([k,v])=>`<div class="card" style="margin-bottom:6px"><div class="statline"><b>${k}</b><span class="${v>60?'danger':v<30?'good':''}">${Math.round(v)}%</span></div><div class="bar threat"><i style="width:${v}%"></i></div></div>`).join('')}<div class="sectionTitle"><h3>The Wider World</h3><span>future travel regions</span></div><div class="cultureRegions">${Object.entries(CULTURES).map(([k,c])=>`<button class="card cultureRegion ${k==='Veyric'?'currentRegion':'lockedRegion'}" onclick="blShowCulture('${k}')"><div class="regionIcon">${c.icon}</div><div><b>${c.homeland}</b><small>${k} culture</small><span>${k==='Veyric'?'CURRENT HOMELAND':'TRAVEL NOT YET OPEN'}</span></div></button>`).join('')}</div>`
};

function systemRules7(){modal(`<div class="sheetHead"><div><h3>Character Build</h3><div class="small muted">Four independent layers make an adventurer.</div></div><button class="x" onclick="closeModal()">✕</button></div><div class="identityRules"><div class="card"><b>1 • Race</b><p class="small">Biological bonuses: Human adaptability, Dwarf toughness, Elf senses, Orc power.</p></div><div class="card"><b>2 • Culture</b><p class="small">Regional training and social doctrine. Any race can belong to any culture.</p></div><div class="card"><b>3 • Class</b><p class="small">Specific profession learned inside that culture: Knight, Berserker, Samurai, Spearwall, etc.</p></div><div class="card"><b>4 • Traits</b><p class="small">Personal keywords such as Haunted, Kindhearted or Bad Knee modify the final build again.</p></div></div><div class="sectionTitle"><h3>Current Recruitment</h3></div><div class="card small"><b>The Graven March is Veyric territory.</b><br>Local Veyric classes dominate the tavern pool. Foreign cultures remain possible and become much more common when their homelands eventually open.</div>`)}
window.blSystemRules7=systemRules7;

const oldWire7=wire;wire=function(){oldWire7();document.querySelectorAll('.systemsInfo').forEach(b=>b.onclick=systemRules7)};

const css=document.createElement('style');css.textContent=`
.cultureLine{color:#caa96c;margin-top:2px}.identityStack{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.identityStack button{background:#15100c;border:1px solid #4d3929;border-radius:10px;padding:9px 6px;color:#eadbc0;text-align:left}.identityStack span,.identityStack small{display:block;font-size:8px;color:#8f806e}.identityStack b{display:block;margin:3px 0;color:#dbb96f;font-size:11px}.cultureClass{margin-top:6px}.cultureRegions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.cultureRegion{display:flex;align-items:center;gap:9px;text-align:left;width:100%}.cultureRegion .regionIcon{font-size:26px;color:#d0aa63}.cultureRegion b,.cultureRegion small,.cultureRegion span{display:block}.cultureRegion small{color:#a99a84;margin:2px 0}.cultureRegion span{font-size:8px;letter-spacing:.08em;color:#7f7465}.cultureRegion.currentRegion{border-color:#8a693b}.cultureRegion.currentRegion span{color:#d5b36d}.lockedRegion{opacity:.72}.identityRules{display:grid;gap:6px}.miniHero{margin-top:4px}
@media(max-width:390px){.identityStack{grid-template-columns:1fr}.cultureRegions{grid-template-columns:1fr}}
`;document.head.appendChild(css);

state.version=Math.max(state.version||1,7);save();setTimeout(()=>render(),0);
})();
