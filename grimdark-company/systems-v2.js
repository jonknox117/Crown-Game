(function(){
'use strict';

const RACE_RULES={
 Human:{culture:'Marcher Kingdoms',passive:'Adaptable',desc:'Most humans in the March come from feudal knightly cultures. +2 Talk, +1 Resolve, and +10% XP earned.',util:{talk:2},stat:{resolve:1},xp:1.10},
 Dwarf:{culture:'Fjord Holds',passive:'Stoneblood',desc:'Dwarven holds prize shield walls, raiding craft and saga tradition. +3 Endure, +2 Guard; wounds deal slightly less expedition attrition.',util:{endure:3},combat:{guard:2},attrition:.85},
 Elf:{culture:'Sword Houses',passive:'Measured Step',desc:'Elven sword-houses prize precision, discipline and patient reconnaissance. +3 Scout, +2 Accuracy, +1 Speed.',util:{scout:3},combat:{accuracy:2,speed:1}},
 Orc:{culture:'Shield-Spear Clans',passive:'Running Formation',desc:'Orc war-clans favor mobile shield-and-spear formations and coordinated encirclement. +2 Speed, +2 Guard; another Orc in the party grants +5% attack.',combat:{speed:2,guard:2},packAttack:.05}
};

const CLASS_POOLS={
 Human:[
  {name:'Man-at-Arms',role:'Frontline',desc:'Professional foot soldier of the Marcher kingdoms.',combat:{attack:2,guard:2,accuracy:1},util:{endure:1},ability:'Drilled — steady damage with no major weakness.'},
  {name:'Knight-Errant',role:'Guardian',desc:'Mounted ideals translated into hard road fighting.',combat:{attack:2,guard:4,resolve:2},util:{talk:2},ability:'Hold Fast — party takes less damage in the first combat round.'},
  {name:'March Ranger',role:'Scout',desc:'Border hunter serving the knightly settlements.',combat:{attack:1,speed:2,accuracy:2},util:{sneak:2,scout:3},ability:'Opening Shot — stronger first round after a successful Scout check.'},
  {name:'Battle Chaplain',role:'Support',desc:'Field priest who keeps frightened soldiers moving.',combat:{guard:1,resolve:4},util:{talk:2,occult:2,endure:1},ability:'Last Rites — improves resolve and blunts occult threats.'}
 ],
 Dwarf:[
  {name:'Shieldthane',role:'Guardian',desc:'Heavy shield fighter of the Fjord Holds.',combat:{attack:1,guard:5,resolve:2},util:{endure:2},ability:'Shield Wall — greatly improves party Guard.'},
  {name:'Berserker',role:'Striker',desc:'Fury-driven axe fighter feared even by allies.',combat:{attack:5,guard:-1,speed:1},util:{endure:1},ability:'Blood Heat — deals more damage when the party is badly hurt.'},
  {name:'Skald',role:'Support',desc:'Saga-keeper, morale fighter and negotiator.',combat:{attack:1,resolve:4},util:{talk:3,occult:1},ability:'War Song — high Resolve reduces collapse under pressure.'},
  {name:'Rune-Seer',role:'Mystic',desc:'Reader of carved signs, graves and old stone magic.',combat:{guard:1,accuracy:1,resolve:2},util:{occult:5,scout:1},ability:'Rune Ward — reduces damage from undead and supernatural enemies.'}
 ],
 Elf:[
  {name:'Samurai',role:'Duelist',desc:'Disciplined sword-retainer of an elven Sword House.',combat:{attack:3,guard:2,accuracy:4,resolve:2},util:{talk:1},ability:'Perfect Cut — higher critical-hit chance.'},
  {name:'Yumi Archer',role:'Marksman',desc:'Longbow specialist trained for distance and timing.',combat:{attack:2,speed:2,accuracy:5},util:{scout:3},ability:'First Volley — strong opening damage when the party is not ambushed.'},
  {name:'Shadow Scout',role:'Scout',desc:'Pathfinder and infiltrator working beyond the house banners.',combat:{attack:1,speed:4,accuracy:2},util:{sneak:5,scout:3},ability:'Ambush — Sneak successes translate directly into combat advantage.'},
  {name:'Spirit Scribe',role:'Mystic',desc:'Ritual scholar who records names, omens and hostile spirits.',combat:{guard:1,resolve:3},util:{occult:5,talk:1,scout:1},ability:'Binding Script — weakens supernatural enemies after Occult successes.'}
 ],
 Orc:[
  {name:'Spearwall',role:'Frontline',desc:'Disciplined shield-and-short-spear fighter.',combat:{attack:2,guard:4,resolve:1},util:{endure:2},ability:'Close Ranks — gains extra Guard when fighting beside another Orc.'},
  {name:'Horn Runner',role:'Skirmisher',desc:'Fast flanking fighter used to envelop enemy lines.',combat:{attack:2,speed:5,accuracy:1},util:{sneak:2,scout:2,endure:1},ability:'Encircle — high Speed can steal the first exchange.'},
  {name:'War-Singer',role:'Support',desc:'Cadence-keeper who coordinates movement and courage.',combat:{attack:1,resolve:5},util:{talk:3,endure:1},ability:'Battle Rhythm — raises party Resolve and stabilizes retreats.'},
  {name:'Bone-Seer',role:'Mystic',desc:'Reader of ancestors, wounds and battlefield omens.',combat:{guard:1,resolve:3},util:{occult:4,scout:2},ability:'Ancestor Sign — improves occult checks and reduces supernatural surprise.'}
 ]
};

const TRAIT_RULES={
 'Hard Worker':{desc:'+3 Endure. Recovers a little more reliably between missions.',util:{endure:3}},
 'Cowardly':{desc:'+2 Sneak, -3 combat Resolve. Good at avoiding danger; poor at standing in it.',util:{sneak:2},combat:{resolve:-3}},
 'Greedy':{desc:'+2 Talk when money is involved. Successful contracts recover slightly more loose silver.',util:{talk:2},pay:.04},
 'Iron Stomach':{desc:'+4 Endure. Much less vulnerable to attrition from foul food, weather and disease.',util:{endure:4},attrition:.65},
 'Bad Knee':{desc:'-3 Speed and -2 Sneak. The penalty matters in pursuit, ambushes and combat initiative.',combat:{speed:-3},util:{sneak:-2}},
 'Quick Learner':{desc:'+25% XP earned from contracts.',xp:1.25},
 'Hot Temper':{desc:'+3 Attack, -2 Talk. Better once steel is out; worse before it gets there.',combat:{attack:3},util:{talk:-2}},
 'Night Eyes':{desc:'+3 Scout and +2 Sneak during dark-road, ruin and wilderness work.',util:{scout:3,sneak:2}},
 'Steady Hands':{desc:'+3 Accuracy and +1 Scout. Helps ranged attacks and careful field work.',combat:{accuracy:3},util:{scout:1}},
 'Superstitious':{desc:'+3 Occult, -2 Resolve against supernatural threats.',util:{occult:3},combat:{resolve:-2}},
 'Kindhearted':{desc:'+4 Talk on frightened civilians, rescue work and surrender situations.',util:{talk:4},mercy:true},
 'Bloodthirsty':{desc:'+4 Attack, -2 Talk. Increased chance to turn a clean victory into injuries.',combat:{attack:4},util:{talk:-2},reckless:true},
 'Stubborn':{desc:'+3 Resolve and +2 Endure.',combat:{resolve:3},util:{endure:2}},
 'Lucky':{desc:'+5% critical/check swing chance and slightly better loot rolls.',lucky:.05},
 'Sickly':{desc:'-4 Endure and increased injury/attrition risk.',util:{endure:-4},attrition:1.25},
 'Tunnel Rat':{desc:'+4 Sneak and +2 Scout in mines, crypts and ruins.',util:{sneak:4,scout:2}},
 'Streetwise':{desc:'+3 Talk and +2 Sneak around settlements, roads, gangs and markets.',util:{talk:3,sneak:2}},
 'Haunted':{desc:'+4 Occult and +1 Scout, but -2 combat Resolve. Sometimes the dead warn you first.',util:{occult:4,scout:1},combat:{resolve:-2}}
};

const UTIL_LABELS={talk:'Talk',sneak:'Sneak',scout:'Scout',endure:'Endure',occult:'Occult'};

function hash(s){let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;return Math.abs(h)}
function classFor(r){const pool=CLASS_POOLS[r.race]||CLASS_POOLS.Human;return pool[hash(String(r.id||r.name))%pool.length]}
function ensureBuild(r){
 if(!r)return r;
 if(!r.className)r.className=classFor(r).name;
 if(!r.culture)r.culture=(RACE_RULES[r.race]||RACE_RULES.Human).culture;
 return r;
}
function classRule(r){ensureBuild(r);return (CLASS_POOLS[r.race]||[]).find(x=>x.name===r.className)||classFor(r)}
function addMap(out,obj){if(!obj)return;Object.entries(obj).forEach(([k,v])=>out[k]=(out[k]||0)+v)}
function traitRules(r){return (r.traits||[]).map(t=>TRAIT_RULES[t]).filter(Boolean)}
function combatStats(r){
 ensureBuild(r);const c=classRule(r),race=RACE_RULES[r.race]||RACE_RULES.Human;
 let o={attack:r.stats.power,guard:r.stats.defense,speed:r.stats.speed,accuracy:Math.round((r.stats.awareness+r.stats.speed)/2),resolve:r.stats.resolve};
 addMap(o,c.combat);addMap(o,race.combat);traitRules(r).forEach(t=>addMap(o,t.combat));
 if(race.stat)addMap(o,race.stat);
 return o;
}
function utilityStats(r){
 ensureBuild(r);const c=classRule(r),race=RACE_RULES[r.race]||RACE_RULES.Human;
 let o={
  talk:Math.round(r.stats.resolve*.42+r.stats.awareness*.18),
  sneak:Math.round(r.stats.speed*.42+r.stats.awareness*.25),
  scout:Math.round(r.stats.awareness*.52+r.stats.speed*.18),
  endure:Math.round(r.stats.defense*.42+r.stats.resolve*.28),
  occult:Math.round(r.stats.awareness*.34+r.stats.resolve*.26)
 };
 addMap(o,c.util);addMap(o,race.util);traitRules(r).forEach(t=>addMap(o,t.util));
 Object.keys(o).forEach(k=>o[k]=Math.max(0,Math.round(o[k])));return o;
}
function xpMult(r){let m=(RACE_RULES[r.race]?.xp||1);traitRules(r).forEach(t=>m*=t.xp||1);return m}
function payMult(p){let m=1;p.members.map(id=>state.roster.find(r=>r.id===id)).filter(Boolean).forEach(r=>traitRules(r).forEach(t=>m+=t.pay||0));return m}
function attritionMult(r){let m=RACE_RULES[r.race]?.attrition||1;traitRules(r).forEach(t=>m*=t.attrition||1);return m}
function partyMembers(p){return p.members.map(id=>state.roster.find(r=>r.id===id)).filter(r=>r&&r.status!=='Dead')}
function partyProfile(p){
 const ms=partyMembers(p);let sums={attack:0,guard:0,speed:0,accuracy:0,resolve:0};
 ms.forEach(r=>{let s=combatStats(r);Object.keys(sums).forEach(k=>sums[k]+=s[k])});
 if(ms.length){sums.speed/=ms.length;sums.accuracy/=ms.length;sums.resolve/=ms.length}
 const orcs=ms.filter(r=>r.race==='Orc').length;if(orcs>1)sums.attack*=1+(orcs-1)*.05;
 return sums;
}
function bestUtility(p,key){
 let best=null;partyMembers(p).forEach(r=>{let v=utilityStats(r)[key];if(!best||v>best.value)best={r,value:v}});return best||{r:null,value:0};
}
function strongestUtilities(p){return Object.keys(UTIL_LABELS).map(k=>({k,...bestUtility(p,k)})).sort((a,b)=>b.value-a.value)}

function migrate(){
 [...(state.roster||[]),...(state.recruits||[])].forEach(ensureBuild);state.version=Math.max(state.version||1,2);save();
}

const oldRecruitGen=recruitGen;
recruitGen=function(){const r=oldRecruitGen();ensureBuild(r);return r};

const oldRosterCard=rosterCard;
rosterCard=function(r){ensureBuild(r);const c=classRule(r);return `<div class="card member clickable inspect" data-id="${r.id}"><div class="portrait">${RACES[r.race]}</div><div><div class="statline"><h4>${r.name}</h4><span>Lv.${r.lvl}</span></div><div class="small muted">${r.race} • <b class="classText">${r.className}</b> • ${r.bg}</div><div class="tiny muted">${r.culture} • ${c.role}</div><div class="hpbar"><i style="width:${r.hp/r.maxHp*100}%"></i></div><div class="tags">${(r.traits||[]).map(t=>`<button class="tag keywordInfo" data-kind="trait" data-key="${t}">${t} ⓘ</button>`).join('')}${r.injury?`<span class="tag danger">${r.injury}</span>`:''}</div></div></div>`};

recruitCard=function(r){ensureBuild(r);return `<div class="card recruit"><div class="portrait">${RACES[r.race]}</div><div><h4>${r.name}</h4><div class="small muted">${r.race} • <b class="classText">${r.className}</b></div><div class="tiny muted">${r.bg} • ${r.wage}s/week</div><div class="tags">${(r.traits||[]).map(t=>`<span class="tag">${t}</span>`).join('')}</div></div><div class="recruitActions"><button class="btn ghost recruitInfo" data-id="${r.id}">ⓘ</button><button class="btn goldbtn hire" data-id="${r.id}" ${employedCount()>=cap()||state.silver<r.hire?'disabled':''}>Hire<br>${r.hire}s</button></div></div>`};

const oldRenderRoster=renderRoster;
renderRoster=function(){const html=oldRenderRoster();return html.replace('<div class="sectionTitle"><h3>Your People</h3>','<div class="sectionTitle"><h3>Your People</h3><button class="btn ghost systemsInfo">Rules ⓘ</button><span style="display:none">')};

inspectRecruit=function(id){const r=state.roster.find(x=>x.id===id)||state.recruits.find(x=>x.id===id);if(!r)return;ensureBuild(r);const c=classRule(r),race=RACE_RULES[r.race],u=utilityStats(r),cs=combatStats(r);
 modal(`<div class="sheetHead"><div><h3>${RACES[r.race]} ${r.name}</h3><div class="small muted">${r.race} • ${r.className} • ${r.bg} • Level ${r.lvl}</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="buildBanner"><b>${r.culture}</b><span>${c.role}</span></div>
 <div class="sectionTitle"><h3>Race</h3><button class="btn ghost raceInfo" data-race="${r.race}">ⓘ</button></div><div class="card small"><b>${race.passive}</b> — ${race.desc}</div>
 <div class="sectionTitle"><h3>Class</h3><button class="btn ghost classInfo" data-race="${r.race}" data-class="${r.className}">ⓘ</button></div><div class="card small"><b>${r.className}</b> — ${c.desc}<br><span class="gold">${c.ability}</span></div>
 <div class="sectionTitle"><h3>Combat</h3><span>Derived after race/class/traits</span></div><div class="skillGrid">${Object.entries(cs).map(([k,v])=>`<div class="skillBox"><span>${k.toUpperCase()}</span><b>${Math.round(v)}</b></div>`).join('')}</div>
 <div class="sectionTitle"><h3>Field Skills</h3><span>Best member handles checks</span></div><div class="skillGrid">${Object.entries(u).map(([k,v])=>`<div class="skillBox"><span>${UTIL_LABELS[k].toUpperCase()}</span><b>${v}</b></div>`).join('')}</div>
 <div class="sectionTitle"><h3>Traits</h3><span>All traits are mechanical</span></div><div class="list">${(r.traits||[]).map(t=>`<button class="card choice keywordInfo" data-kind="trait" data-key="${t}"><b>${t}</b><div class="small muted">${TRAIT_RULES[t]?.desc||'No effect documented.'}</div></button>`).join('')}</div>
 <div class="sectionTitle"><h3>Condition</h3><span>${r.hp}/${r.maxHp} HP</span></div><div class="hpbar"><i style="width:${r.hp/r.maxHp*100}%"></i></div>${r.injury?`<p class="danger small">${r.injury} • ${r.recovery} day(s) recovery</p>`:''}
 <div class="sectionTitle"><h3>Equipment & Record</h3></div><div class="card small">Weapon: <b>${r.gear.weapon}</b><br>Armor: <b>${r.gear.armor}</b><hr>Missions: ${r.missions} • Kills: ${r.kills}<br>Scars: ${r.scars.length?r.scars.join(', '):'None'}</div>`);bindSystemInfo();
};

function systemsCodex(){modal(`<div class="sheetHead"><div><h3>Adventurer Rules</h3><div class="small muted">Every label on a recruit changes something.</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="card small"><b>Race</b> gives a passive and cultural tendency. <b>Class</b> defines combat role and specialty. <b>Background</b> is origin/flavor and starting gear. <b>Traits</b> modify combat, field checks, XP, loot or injury risk.</div>
 <div class="sectionTitle"><h3>Field Checks</h3><span>Highest qualified member leads</span></div>${Object.entries({Talk:'Negotiation, civilians, surrender and deception.',Sneak:'Avoid patrols, ambush or bypass threats.',Scout:'Tracks, traps, routes and enemy warning.',Endure:'Weather, hunger, disease, forced marches.',Occult:'Undead, curses, spirits and forbidden relics.'}).map(([k,v])=>`<div class="card small"><b>${k}</b> — ${v}</div>`).join('')}
 <div class="sectionTitle"><h3>Combat</h3></div><div class="card small"><b>Attack</b> drives damage. <b>Guard</b> reduces incoming damage. <b>Speed</b> controls opening advantage. <b>Accuracy</b> affects clean hits and criticals. <b>Resolve</b> prevents collapse when a fight turns ugly.</div>`)}
function showKeyword(t){const x=TRAIT_RULES[t];if(!x)return;modal(`<div class="sheetHead"><h3>${t}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card"><b>Mechanical effect</b><p class="small">${x.desc}</p></div>`)}
function showRace(r){const x=RACE_RULES[r];if(!x)return;modal(`<div class="sheetHead"><h3>${RACES[r]} ${r}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card"><b>${x.culture}</b><p class="small">${x.desc}</p></div>`)}
function showClass(r,n){const x=(CLASS_POOLS[r]||[]).find(c=>c.name===n);if(!x)return;modal(`<div class="sheetHead"><h3>${n}</h3><button class="x" onclick="closeModal()">✕</button></div><div class="card"><b>${x.role}</b><p class="small">${x.desc}</p><div class="gold small">${x.ability}</div></div>`)}
function bindSystemInfo(){
 document.querySelectorAll('.keywordInfo').forEach(b=>b.onclick=e=>{e.stopPropagation();showKeyword(b.dataset.key)});
 document.querySelectorAll('.recruitInfo').forEach(b=>b.onclick=e=>{e.stopPropagation();inspectRecruit(b.dataset.id)});
 document.querySelectorAll('.systemsInfo').forEach(b=>b.onclick=e=>{e.stopPropagation();systemsCodex()});
 document.querySelectorAll('.raceInfo').forEach(b=>b.onclick=e=>{e.stopPropagation();showRace(b.dataset.race)});
 document.querySelectorAll('.classInfo').forEach(b=>b.onclick=e=>{e.stopPropagation();showClass(b.dataset.race,b.dataset.class)});
}
const oldWire=wire;wire=function(){oldWire();bindSystemInfo()};

const oldPartyCard=partyCard;
partyCard=function(p){const base=oldPartyCard(p),best=strongestUtilities(p).slice(0,2);if(!p.members.length)return base;const strip=`<div class="partySkills">${best.map(x=>`<span>${UTIL_LABELS[x.k]} <b>${x.value}</b></span>`).join('')}</div>`;return base.replace('<div class="actions">',strip+'<div class="actions">')};

chooseParty=function(cid){const c=state.contracts.find(x=>x.id===cid);let idle=state.parties.filter(p=>!p.expedition&&p.members.length);if(!idle.length)return toast('No staffed idle party.');modal(`<div class="sheetHead"><h3>Send a party</h3><button class="x" onclick="closeModal()">✕</button></div><p class="small muted">${c.title} • Risk ${c.risk}/4 • field skills can change what happens before combat.</p>${idle.map(p=>{const prof=partyProfile(p),best=strongestUtilities(p).slice(0,3);return `<button class="btn choice dispatch" data-party="${p.id}"><b>${p.name}</b><br><span class="tiny">${p.members.length} members • ATK ${Math.round(prof.attack)} • GUARD ${Math.round(prof.guard)}</span><div class="partySkills">${best.map(x=>`<span>${UTIL_LABELS[x.k]} <b>${x.value}</b></span>`).join('')}</div></button>`}).join('')}`);document.querySelectorAll('.dispatch').forEach(b=>b.onclick=()=>dispatch(cid,b.dataset.party))};

const CHALLENGES={
 talk:[['Refugees block the road and demand protection.','The party talks them down and learns a safer route.','The argument turns ugly; time and supplies are lost.'],['A frightened witness knows more than they first admit.','A calm conversation produces useful details.','The witness shuts down and the lead goes cold.']],
 sneak:[['Torchlight moves across the road ahead.','The party slips around the patrol unseen.','A snapped branch gives the party away.'],['Something nests between the party and the objective.','They pass without waking it.','The nest erupts behind them.']],
 scout:[['The trail divides around old ruins.','Tracks reveal the safer approach.','The party chooses the wrong ground.'],['Fresh signs suggest an ambush.','The scout spots the kill zone first.','The warning comes one heartbeat too late.']],
 endure:[['Cold rain turns the road into black mud.','The party keeps pace without burning itself out.','Fatigue and soaked gear take a toll.'],['Bad water is the only water for miles.','Someone knows how to make it safe enough.','The march continues with cramps and fever.']],
 occult:[['A roadside shrine is covered in fresh grave wax.','The signs are read before anyone touches the wrong thing.','Something notices the party first.'],['Whispers begin after sunset.','The party identifies the omen and changes course.','The whispers follow them into sleep.']]
};
function challengeKeyFor(c){let weights=['scout','endure','sneak','talk'];if(/Saint|grave|crypt|Moon|Mill|Children/i.test(c.title+' '+c.place))weights.push('occult','occult');if(/Road|Bandit|Tax/i.test(c.title+' '+c.place))weights.push('talk','sneak');return pick(weights)}
function doFieldCheck(p){const e=p.expedition,c=e.contract,key=challengeKeyFor(c),best=bestUtility(p,key),scene=pick(CHALLENGES[key]);if(!best.r)return;const diff=8+c.risk*4+c.unknown*2;let roll=best.value+rnd(-4,5);if(traitRules(best.r).some(t=>t.lucky)&&Math.random()<.2)roll+=4;const ok=roll>=diff;e.events.push(`${UTIL_LABELS[key].toUpperCase()} — ${scene[0]}`);e.events.push(`${best.r.name} ${ok?'succeeds':'fails'} (${roll} vs ${diff}). ${ok?scene[1]:scene[2]}`);e.checks=(e.checks||[]).concat({key,name:best.r.name,ok,roll,diff});if(ok){if(key==='talk')e.bonusPay=(e.bonusPay||0)+.08;if(key==='sneak')e.ambush=(e.ambush||0)+.12;if(key==='scout')e.scoutEdge=(e.scoutEdge||0)+.12;if(key==='endure')e.attritionEdge=(e.attritionEdge||0)+.18;if(key==='occult')e.occultEdge=(e.occultEdge||0)+.15}else{if(key==='sneak'||key==='scout')e.enemyAmbush=(e.enemyAmbush||0)+.10;if(key==='occult')e.occultTrouble=(e.occultTrouble||0)+.12;if(key==='endure'){const victim=pick(partyMembers(p));if(victim){const dmg=Math.max(3,Math.round(10*attritionMult(victim)));victim.hp=Math.max(1,victim.hp-dmg);e.events.push(`${victim.name} loses ${dmg} HP to attrition.`)}}if(key==='talk')e.bonusPay=(e.bonusPay||0)-.04}e.lastCheckStep=e.step}

advanceExpedition=function(pid,manual=false){const p=state.parties.find(x=>x.id===pid);if(!p||!p.expedition)return;const e=p.expedition;if(e.battle){combatRound(p);return}e.step++;e.progress=clamp(e.progress+rnd(12,21),0,100);if(e.progress<64&&(!e.lastCheckStep||e.step-e.lastCheckStep>=2)&&Math.random()<.58){doFieldCheck(p)}else if(e.progress<65){e.events.push(`+${e.progress}% — ${pick(phaseEvents)}`)}else if(!e.fought){e.fought=true;startCombat(p);return}else e.events.push(`+${e.progress}% — The party pushes toward the objective.`);if(e.progress>=100&&!e.battle)finishExpedition(p);render()};

function enemyProfile(c){const base=c.risk*42+c.unknown*5+rnd(-6,8);return{attack:base*1.02,guard:base*.9,speed:10+c.risk*3+rnd(0,5),accuracy:11+c.risk*3,resolve:12+c.risk*5}}
startCombat=function(p){const e=p.expedition,c=e.contract,prof=partyProfile(p),enemy=enemyProfile(c);let first=(prof.speed+(e.ambush||0)*20)-(enemy.speed+(e.enemyAmbush||0)*20);enemy.attack*=1+(e.occultTrouble||0);enemy.guard*=1-(e.scoutEdge||0)-(e.occultEdge||0);e.battle={partyName:p.name,partyHp:100,enemyHp:100,profile:prof,enemyProfile:enemy,enemy:pick(c.enemies),round:0,first:first>=0?'party':'enemy'};e.events.push(`ENCOUNTER — ${c.enemies.join(', ')}.`);e.events.push(`${first>=0?'The party seizes':'The enemy steals'} the opening tempo.`);if(window.blSound)blSound('danger');render();setTimeout(()=>combatRound(p),350)};

combatRound=function(p){const e=p.expedition,b=e?.battle;if(!b)return;b.round++;const prof=partyProfile(p),enemy=b.enemyProfile;let hit=Math.max(.45,Math.min(.96,.62+(prof.accuracy-enemy.speed)*.012));let ehit=Math.max(.42,Math.min(.94,.62+(enemy.accuracy-prof.speed)*.012));let pd=rnd(7,13)*(prof.attack/(enemy.guard+35));let ed=rnd(6,12)*(enemy.attack/(prof.guard+35));if(b.round===1){if(b.first==='party')pd*=1.22;else ed*=1.22}
 const ms=partyMembers(p);if(ms.some(r=>r.className==='Knight-Errant')&&b.round===1)ed*=.78;if(ms.some(r=>r.className==='Yumi Archer')&&b.round===1&&b.first==='party')pd*=1.18;if(ms.some(r=>r.className==='March Ranger')&&b.round===1&&e.scoutEdge)pd*=1.18;if(ms.some(r=>r.className==='Berserker')&&b.partyHp<55)pd*=1.18;if(ms.some(r=>r.className==='Shieldthane'))ed*=.92;if(ms.some(r=>r.className==='Spearwall')&&ms.filter(r=>r.race==='Orc').length>1)ed*=.92;
 if(Math.random()>hit)pd*=.35;if(Math.random()>ehit)ed*=.35;let crit=.06+ms.filter(r=>r.className==='Samurai').length*.035+ms.reduce((s,r)=>s+traitRules(r).reduce((q,t)=>q+(t.lucky||0),0),0);if(Math.random()<crit){pd*=1.65;e.events.push('A clean critical strike tears through the enemy line.')}if(b.partyHp<35&&prof.resolve<14)ed*=1.18;else if(b.partyHp<35&&prof.resolve>21)pd*=1.10;
 b.enemyHp=clamp(b.enemyHp-pd,0,100);b.partyHp=clamp(b.partyHp-ed,0,100);e.events.push(`Round ${b.round}: ${Math.round(pd)}% dealt • ${Math.round(ed)}% taken. ATK ${Math.round(prof.attack)} / GUARD ${Math.round(prof.guard)} / RES ${Math.round(prof.resolve)}.`);if(window.blSound)blSound('hit');if(b.enemyHp<=0||b.partyHp<=0||b.round>=8){resolveCombat(p,b.partyHp>b.enemyHp)}render()};

const oldFinish=finishExpedition;
finishExpedition=function(p){const e=p.expedition;if(!e)return;const beforeSilver=state.silver;const members=partyMembers(p);const bonus=e.bonusPay||0;oldFinish(p);if(state.lastReport?.success){const baseGain=Math.max(0,state.silver-beforeSilver);let extra=Math.floor(baseGain*(bonus+Math.max(0,payMult({members:members.map(r=>r.id)})-1)));if(extra>0){state.silver+=extra;state.lastReport.pay+=extra;state.log.push(`Specialists secured ${extra}s in additional value.`)}}members.forEach(r=>{if(r.status!=='Dead'){const mult=xpMult(r);if(mult>1){const extra=Math.round((state.lastReport?.success?15:8)*(mult-1));r.xp+=extra;levelCheck(r)}}});save()};

renderBattle=function(b){const p=b.profile||{},e=b.enemyProfile||{};return `<div class="combatrow"><div class="combatSide"><b>${b.partyName}</b><div class="hpbar"><i style="width:${b.partyHp}%"></i></div><div class="tiny muted">ATK ${Math.round(p.attack||0)} • G ${Math.round(p.guard||0)} • SPD ${Math.round(p.speed||0)}</div></div><div class="vs">VS</div><div class="combatSide"><b>${b.enemy}</b><div class="hpbar"><i style="width:${b.enemyHp}%"></i></div><div class="tiny muted">ATK ${Math.round(e.attack||0)} • G ${Math.round(e.guard||0)}</div></div></div>`};

const style=document.createElement('style');style.textContent=`.keywordInfo{font:inherit;color:#c6b59e;cursor:pointer}.recruitActions{display:flex;gap:5px;align-items:center}.recruitActions .btn{min-width:44px}.buildBanner{display:flex;justify-content:space-between;gap:8px;border:1px solid #5a422f;background:#1a130f;border-radius:10px;padding:9px 10px;margin:8px 0;color:#d8c7aa;font-size:11px}.buildBanner b{color:#d3ac61}.skillGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.skillBox{background:#120e0b;border:1px solid #3d2c20;border-radius:8px;padding:7px 3px;text-align:center}.skillBox span{display:block;color:#9e8f7b;font-size:8px}.skillBox b{font-size:14px;color:#e4cfaa}.partySkills{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.partySkills span{border:1px solid #4a3728;background:#18110d;border-radius:999px;padding:3px 7px;font-size:9px;color:#aa9a84}.partySkills b{color:#dfbd72}.classText{color:#d8bc80}@media(max-width:390px){.skillGrid{grid-template-columns:repeat(3,1fr)}}`;document.head.appendChild(style);

window.blRules={RACE_RULES,CLASS_POOLS,TRAIT_RULES,utilityStats,combatStats,partyProfile};
migrate();
setTimeout(()=>render(),0);
})();
