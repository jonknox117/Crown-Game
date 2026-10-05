/* Broken Lantern v10 expansion: opening balance, regional ecology, legendary threats,
   retreat/capture aftermath, louder mobile audio, and icon-based presentation. */

// ---------- Save/state migration ----------
const _createStateV9=createState;
createState=function(name){
 const s=_createStateV9(name);
 s.balanceVersion=10;
 s.company.founderMuster=3;
 s.company.starterProtectionUntil=10;
 s.settings.sfxVolume=1;
 s.settings.musicVolume=.9;
 return s;
};
const _normalizeStateV9=normalizeState;
normalizeState=function(s){
 s=_normalizeStateV9(s);if(!s)return s;
 s.balanceVersion=10;
 if(s.company.founderMuster==null){
   const veyricCount=(s.roster||[]).filter(a=>a.regionId==='veyric'&&a.status!=='Dead').length;
   s.company.founderMuster=s.company.day<=10?Math.max(0,3-veyricCount):0;
 }
 if(s.company.starterProtectionUntil==null)s.company.starterProtectionUntil=10;
 return s;
};

// ---------- Regional enemy ecology ----------
const REGION_ECOLOGY={
 veyric:{
  signature:'Goblinoids',
  families:[
   {name:'Goblinoids',species:['Goblin','Hobgoblin']},
   {name:'Restless Dead',species:['Undead','Ghoul','Wight']},
   {name:'Cursed Beasts',species:['Werewolf','Ogre','Dire Wolf']}
  ],
  legendary:{species:'Dragon',title:'Dragon',names:['Varrak the Ash-Wing','Mordren Blackscale','The Wyrm of Orrin Keep']}
 },
 skeld:{
  signature:'Trollkin',
  families:[
   {name:'Trollkin',species:['Trollkin','Frost Troll']},
   {name:'Barrow Dead',species:['Draugr','Barrow Wight']},
   {name:'Giants & Sea-Beasts',species:['Frost Giant','Sea Beast']}
  ],
  legendary:{species:'Jotunn',title:'Jötunn',names:['Hrimvald Shore-Breaker','Skorri Mountain-Blood','The Grey Jötunn']}
 },
 hoshin:{
  signature:'Yokai',
  families:[
   {name:'Yōkai',species:['Yokai','Tengu','Kappa']},
   {name:'Oni',species:['Oni','Oni Brute']},
   {name:'Restless Spirits',species:['Spirit','Yurei','Onryo']}
  ],
  legendary:{species:'Great Ryu',title:'Great Ryū',names:['Kuroame the Black Rain','The Mooncoil Ryū','Ryū of the Drowned Shrine']}
 },
 nambara:{
  signature:'Nightkin',
  families:[
   {name:'Nightkin',species:['Nightkin','Bone Hyena','Night Stalker']},
   {name:'Great Beasts',species:['Great Beast','Giant Crocodile','Bone Lion']},
   {name:'Storm Creatures',species:['Lightning Beast','River Serpent','Storm Scavenger']}
  ],
  legendary:{species:'Storm Bird',title:'Storm Bird',names:['Inkanyezi Blackwing','The Thunder-Crowned Bird','Storm-Eater of the Redveld']}
 },
 firmament:{
  signature:'Horrors',
  families:[
   {name:'Horrors',species:['Horror','Crawling Horror','Hollow Horror']},
   {name:'Fallen Celestials',species:['Fallen Celestial','Broken Choir']},
   {name:'Aberrations',species:['Aberration','Void Wraith','Glass Maw']}
  ],
  legendary:{species:'Fallen Seraph',title:'Fallen Seraph',names:['Seraph Khel, Unbound','The Ashen Seraph','The Last Judge']}
 }
};

Object.assign(ENEMY_SPECIES,{
 Hobgoblin:{hp:1.05,attack:1.04,guard:1.08,speed:.98,accuracy:1.05,desc:'Disciplined goblinoid soldiers that trade speed for armor.'},
 Ghoul:{hp:.9,attack:1.08,guard:.72,speed:1.18,accuracy:1.03,supernatural:true,desc:'Fast corpse-eaters that punish wounded adventurers.'},
 Wight:{hp:1.25,attack:1.12,guard:1.2,speed:.82,accuracy:.96,supernatural:true,desc:'Armored dead that resist ordinary pressure.'},
 Werewolf:{hp:1.35,attack:1.22,guard:.85,speed:1.22,accuracy:1.02,desc:'Cursed predators with violent speed and heavy single-target damage.'},
 'Dire Wolf':{hp:.9,attack:1.02,guard:.68,speed:1.42,accuracy:1.08,desc:'Huge pack predators that run down weak backliners.'},
 'Frost Troll':{hp:1.7,attack:1.22,guard:1.14,speed:.62,accuracy:.86,regen:.05,desc:'Massive northern trolls with stronger regeneration.'},
 'Barrow Wight':{hp:1.28,attack:1.08,guard:1.3,speed:.7,accuracy:.94,supernatural:true,desc:'Burial-mound dead wrapped in old armor and grave magic.'},
 'Frost Giant':{hp:1.9,attack:1.42,guard:1.15,speed:.58,accuracy:.82,desc:'Giant northern raiders whose blows can break a line.'},
 'Sea Beast':{hp:1.55,attack:1.2,guard:.92,speed:.9,accuracy:.94,desc:'Huge coastal predators dragged out of black water.'},
 Yokai:{hp:.95,attack:1.02,guard:.78,speed:1.18,accuracy:1.1,supernatural:true,evade:.08,desc:'Unpredictable supernatural creatures that reward Scout and Occult.'},
 Tengu:{hp:1,attack:1.08,guard:.8,speed:1.32,accuracy:1.18,supernatural:true,evade:.1,desc:'Fast mountain spirits with exceptional initiative.'},
 Kappa:{hp:1.12,attack:.98,guard:1.18,speed:.92,accuracy:.98,supernatural:true,desc:'River creatures with stubborn defenses and ambush habits.'},
 Oni:{hp:1.65,attack:1.42,guard:1.06,speed:.78,accuracy:.9,supernatural:true,desc:'Huge supernatural brutes that smash Guard.'},
 'Oni Brute':{hp:1.85,attack:1.55,guard:1.08,speed:.66,accuracy:.84,supernatural:true,desc:'Heavy Oni shock troops capable of breaking fortified lines.'},
 Yurei:{hp:.82,attack:1.08,guard:.62,speed:1.2,accuracy:1.16,supernatural:true,evade:.14,desc:'Restless ghosts that are difficult to hit physically.'},
 Onryo:{hp:.92,attack:1.24,guard:.68,speed:1.12,accuracy:1.14,supernatural:true,desc:'Vengeful spirits that punish low Resolve.'},
 Nightkin:{hp:.82,attack:1.02,guard:.7,speed:1.3,accuracy:1.08,desc:'Small nocturnal predators that excel at ambush.'},
 'Bone Hyena':{hp:.92,attack:1.1,guard:.72,speed:1.3,accuracy:1.08,desc:'Relentless pack hunters that prioritize the wounded.'},
 'Night Stalker':{hp:1.02,attack:1.18,guard:.78,speed:1.25,accuracy:1.14,supernatural:true,desc:'A malicious night-creature that slips around frontlines.'},
 'Great Beast':{hp:1.7,attack:1.36,guard:1.04,speed:.92,accuracy:.92,desc:'Enormous predators built to absorb punishment.'},
 'Giant Crocodile':{hp:1.85,attack:1.35,guard:1.22,speed:.62,accuracy:.9,desc:'Armored river predators with crushing bites.'},
 'Bone Lion':{hp:1.45,attack:1.38,guard:.88,speed:1.08,accuracy:1.04,desc:'A great hunting beast that hits hard and moves quickly.'},
 'Lightning Beast':{hp:1.1,attack:1.18,guard:.82,speed:1.3,accuracy:1.12,supernatural:true,desc:'Storm-charged predators that strike before slower parties.'},
 'River Serpent':{hp:1.45,attack:1.2,guard:1.02,speed:1.02,accuracy:1,supernatural:true,desc:'Large water-serpents that combine durability and speed.'},
 'Storm Scavenger':{hp:.9,attack:1.04,guard:.72,speed:1.38,accuracy:1.1,supernatural:true,desc:'Winged scavengers that hunt beneath violent storms.'},
 'Crawling Horror':{hp:1.2,attack:1.18,guard:.94,speed:1.14,accuracy:1.1,supernatural:true,horror:true,desc:'Malformed things that attack mind and flesh at once.'},
 'Hollow Horror':{hp:1.45,attack:1.28,guard:1.12,speed:.9,accuracy:1.05,supernatural:true,horror:true,desc:'Large empty-bodied Horrors with extraordinary durability.'},
 'Fallen Celestial':{hp:1.35,attack:1.25,guard:1.18,speed:1.12,accuracy:1.16,supernatural:true,horror:true,desc:'Broken Aethren warriors retaining disciplined celestial techniques.'},
 'Broken Choir':{hp:1.05,attack:1.16,guard:.9,speed:1.05,accuracy:1.12,supernatural:true,horror:true,desc:'Corrupted harmonists whose presence tears at Resolve.'},
 Aberration:{hp:1.3,attack:1.3,guard:.95,speed:1.12,accuracy:1.08,supernatural:true,horror:true,desc:'Unstable bodies that do not obey ordinary anatomy.'},
 'Glass Maw':{hp:1.4,attack:1.38,guard:1.02,speed:.98,accuracy:1.08,supernatural:true,horror:true,desc:'A crystalline predator that fractures armor and nerve.'},
 Dragon:{hp:2.35,attack:1.62,guard:1.5,speed:1.02,accuracy:1.18,supernatural:true,legendary:true,desc:'Legendary Veyric apex. Armored scales, terror and sweeping breath attacks.'},
 Jotunn:{hp:2.7,attack:1.72,guard:1.42,speed:.58,accuracy:.9,legendary:true,desc:'Legendary Skeldic apex. Colossal endurance and line-breaking strength.'},
 'Great Ryu':{hp:2.25,attack:1.5,guard:1.18,speed:1.35,accuracy:1.24,supernatural:true,evade:.16,legendary:true,desc:'Legendary Hoshin apex. Supernatural speed, storms and extreme evasion.'},
 'Storm Bird':{hp:2.05,attack:1.52,guard:1.02,speed:1.58,accuracy:1.28,supernatural:true,evade:.12,legendary:true,desc:'Legendary Nambaran apex. A black storm-raptor that attacks from above.'},
 'Fallen Seraph':{hp:2.5,attack:1.65,guard:1.48,speed:1.2,accuracy:1.28,supernatural:true,horror:true,legendary:true,desc:'Legendary Firmament apex. A ruined Celestial capable of judgment and execution.'}
});

const EXTRA_CONTRACT_NAMES={
 Hobgoblin:['Iron Caps on the Road','The Drill Camp'],Ghoul:['Grave-Eaters','The Empty Ossuary'],Wight:['Knight Beneath the Hill','The Wight Road'],Werewolf:['Tracks Become Footprints','Moon-Torn Livestock'],Ogre:['The Toll-Eater','The Hill That Walks'],'Dire Wolf':['The Black Pack'],
 'Frost Troll':['Ice Under the Bridge','The Winter Maw'],'Barrow Wight':['Mound-King Wakes'],'Frost Giant':['Footprints Across the Fjord'],'Sea Beast':['Something Under the Jetty'],
 Yokai:['Laughing Lights','The Wrong-Faced Traveler'],Tengu:['Feathers on the Pass'],Kappa:['Hands Beneath the Ford'],Oni:['Red Club at the Shrine'],'Oni Brute':['The Gate-Breaker'],Yurei:['Woman Without Footprints'],Onryo:['The Grudge House'],
 Nightkin:['Scratching Beneath the Eaves'],'Bone Hyena':['Laughter Beyond the Fires'],'Night Stalker':['The Thing Outside the Kraal'],'Great Beast':['Cattle Gone Whole'],'Giant Crocodile':['The River Takes Men'],'Bone Lion':['The Red Mane'],'Lightning Beast':['Storm Tracks'],'River Serpent':['The Water Rolls Back'],'Storm Scavenger':['Black Wings in Lightning'],
 'Crawling Horror':['Hands Where Faces Should Be'],'Hollow Horror':['The Empty Giant'],'Fallen Celestial':['Broken Wings'],'Broken Choir':['Singing Under Glass'],Aberration:['The Shape That Changes'],'Glass Maw':['Teeth in the Wall']
};
Object.assign(CONTRACT_NAMES,EXTRA_CONTRACT_NAMES);
Object.entries(REGION_ECOLOGY).forEach(([id,eco])=>{
 const d=REGION_DEFS[id];d.common=eco.families[0].species[0];d.enemies=eco.families.flatMap(f=>f.species);d.families=eco.families.map(f=>f.name);d.legendary=eco.legendary.species;
});

function ecologyFamily(regionId,species){const eco=REGION_ECOLOGY[regionId];return eco?.families.find(f=>f.species.includes(species))?.name||'Outsider';}
const _pickEnemySpeciesV9=pickEnemySpecies;
pickEnemySpecies=function(regionId){
 const eco=REGION_ECOLOGY[regionId];if(!eco)return _pickEnemySpeciesV9(regionId);
 const family=chance(.48)?eco.families[0]:pick(eco.families);
 return pick(family.species);
};

const RISK_COUNTS=[[2,3],[4,6],[5,8],[7,12],[10,18]];
const _generateContractV9=generateContract;
generateContract=function(regionId){
 const c=_generateContractV9(regionId),range=RISK_COUNTS[c.risk-1];
 c.enemyCount=rnd(range[0],range[1]);
 c.family=ecologyFamily(regionId,c.species);
 c.recommended=[2,3,4,5,7][c.risk-1];
 const eco=REGION_ECOLOGY[regionId];
 const legendaryChance=c.risk===5?clamp(.05+(state.regions[regionId].threat-65)*.003+state.company.renown*.0004,.04,.18):0;
 if(eco&&chance(legendaryChance)){
   c.legendarySpecies=eco.legendary.species;
   c.legendaryName=pick(eco.legendary.names);
   c.title=`LEGENDARY — ${c.legendaryName}`;
   c.reward=Math.round(c.reward*1.8);
   c.cacheChance=.95;c.unknown=0;
   c.desc=`${c.desc} A ${eco.legendary.title} has been confirmed at the site. Apex loot is recovered only if it is killed and the contract is completed.`;
 }
 return c;
};
function starterContract(){
 const species=pick(['Goblin','Goblin','Bandit','Wolf','Undead']),type=pick([['Hunt','Track and remove a small local threat.','scout'],['Escort','Get ordinary people through a dangerous stretch of road.','endure'],['Rescue','Find missing locals before the trail goes cold.','talk'],['Retrieval','Recover property from a lightly held position.','sneak']]);
 const enemyCount=rnd(2,3);
 return{id:uid('c'),regionId:'veyric',type:type[0],check:type[2],title:pick(CONTRACT_NAMES[species]||[`${species} Trouble`]),desc:`LOCAL WORK — ${type[1]} Basic opposition expected.`,species,family:ecologyFamily('veyric',species),risk:1,enemyCount,reward:22+enemyCount*3,unknown:0,expires:state.company.day+4,nemesisId:null,cacheChance:.55,starter:true,guaranteedGear:true,recommended:2};
}
function ensureStarterBoard(){
 if(!state||state.company.day>state.company.starterProtectionUntil)return;
 const r=state.regions.veyric;if(!r?.hq.established)return;
 let starters=r.contracts.filter(c=>c.starter&&c.risk===1).length;
 while(starters<2){
   const replacement=r.contracts.slice().sort((a,b)=>b.risk-a.risk)[0];
   if(replacement)r.contracts=r.contracts.filter(c=>c.id!==replacement.id);
   r.contracts.push(starterContract());starters++;
 }
}
const _refreshContractsV9=refreshContracts;
refreshContracts=function(regionId){_refreshContractsV9(regionId);if(regionId==='veyric')ensureStarterBoard();};

// ---------- Founder's Muster ----------
function hireCostV10(a){const base=Math.max(6,a.wage*3);return state.currentRegion==='veyric'&&(state.company.founderMuster||0)>0?Math.max(4,Math.ceil(base*.5)):base;}
hireRecruit=function(id){
 const r=region(),a=r.recruits.find(x=>x.id===id);if(!a)return;
 if(localRoster().length>=rosterCap())return toast('Barracks are full.');
 const cost=hireCostV10(a);if(state.company.silver<cost)return toast(`Need ${money(cost)}.`);
 state.company.silver-=cost;r.recruits=r.recruits.filter(x=>x.id!==id);state.roster.push(a);
 if(state.currentRegion==='veyric'&&(state.company.founderMuster||0)>0)state.company.founderMuster--;
 pushHistory(`Hired ${a.name}, ${a.culture} ${a.className}, for ${money(cost)}.`);sfx('hire');save();render();
};
recruitCard=function(a){const cost=hireCostV10(a),muster=state.currentRegion==='veyric'&&(state.company.founderMuster||0)>0;return`<div class="card member"><div class="portrait">${RACE_ICONS[a.race]||'?'}</div><div><h4>${esc(a.name)}</h4><div class="small muted">Lv.${a.lvl} ${esc(a.race)} • <b class="gold">${esc(a.culture)} ${esc(a.className)}</b></div><div class="tiny muted">${esc(a.background)} • ${a.wage}s/week</div><div class="tags">${a.traits.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div></div><div>${muster?'<div class="musterTag">FOUNDER’S MUSTER</div>':''}<button class="btn ghost" data-action="inspectRecruit" data-id="${a.id}">ⓘ</button><button class="btn goldbtn" data-action="hire" data-id="${a.id}">Hire ${cost}s</button></div></div>`};

// ---------- Party danger readout ----------
function partyDanger(p,c){
 const ms=partyMembers(p);if(!ms.length)return{label:'NO PARTY',cls:'danger-extreme',ratio:0};
 let partyScore=0;ms.forEach(a=>{const x=derived(a).combat;partyScore+=(x.attack+x.guard+x.accuracy+x.resolve+x.speed*.7)/12+a.lvl*.7});
 partyScore*=1+p.cohesion/650;
 const enemyScore=c.enemyCount*(2.6+c.risk*1.4)+(c.legendarySpecies?20+c.risk*4:0)+(c.nemesisId?8:0);
 const ratio=partyScore/Math.max(1,enemyScore);
 if(ratio<.55)return{label:'OVERWHELMING',cls:'danger-extreme',ratio};
 if(ratio<.75)return{label:'DEADLY',cls:'danger-high',ratio};
 if(ratio<1)return{label:'DANGEROUS',cls:'danger-warn',ratio};
 if(ratio<1.2)return{label:'EVEN',cls:'danger-even',ratio};
 if(ratio<1.55)return{label:'FAVORED',cls:'danger-good',ratio};
 return{label:'DOMINANT',cls:'danger-good',ratio};
}
const _contractCardV9=contractCard;
contractCard=function(c){
 const base=_contractCardV9(c),legend=c.legendarySpecies?`<div class="legendaryBanner">LEGENDARY APEX: ${esc(c.legendaryName||c.legendarySpecies)}</div>`:'',starter=c.starter?'<span class="starterBadge">LOCAL WORK</span>':'';
 return base.replace('<div class="small muted">',`${legend}<div class="small muted">${starter} <b>${esc(c.family||ecologyFamily(c.regionId,c.species))}</b> • `).replace('approximately '+c.enemyCount+' enemies',`approximately ${c.enemyCount}${c.legendarySpecies?' + 1 apex':''} enemies`);
};
showContractInfo=function(id){const c=contractById(id);if(!c)return;const rec=[2,3,4,5,7][c.risk-1];modal(`<div class="sheetHead"><h3>${esc(c.title)}</h3><button class="x" data-action="close">✕</button></div>${c.legendarySpecies?`<div class="legendaryBanner">LEGENDARY — ${esc(c.legendaryName||c.legendarySpecies)}</div>`:''}<div class="card"><b>Risk ${c.risk}/5 • ${c.enemyCount}${c.legendarySpecies?' + apex':''} expected enemies</b><div class="small muted">${esc(c.desc)}</div><div class="small" style="margin-top:8px"><b>${esc(c.family||ecologyFamily(c.regionId,c.species))}:</b> ${esc(ENEMY_SPECIES[c.species]?.desc||'')}</div></div><div class="notice">Typical party recommendation: ${rec}${c.risk===1?'–3':c.risk===2?'–5':c.risk===3?'–6':c.risk===4?'–8':'–8 veteran'} adventurers. The party-selection screen estimates your actual matchup.</div>`)};
showChooseParty=function(cid){const c=contractById(cid),ps=localParties(c.regionId).filter(p=>!p.expedition&&p.members.length);if(!ps.length)return toast('No staffed idle party.');modal(`<div class="sheetHead"><h3>Send a Party</h3><button class="x" data-action="close">✕</button></div><div class="notice">${esc(c.title)} • Risk ${c.risk} • approximately ${c.enemyCount}${c.legendarySpecies?' + apex':''} enemies.</div><div class="list" style="margin-top:8px">${ps.map(p=>{const prof=partyProfile(p),best=bestUtility(p,c.check),d=partyDanger(p,c);return`<button class="card dispatchCard" data-action="dispatch" data-id="${c.id}" data-party="${p.id}" style="text-align:left"><div class="statline"><b>${esc(p.name)}</b><span class="dangerReadout ${d.cls}">${d.label}</span></div><div class="tiny muted">${p.members.length}/${partyCap(p.regionId)} • ATK ${Math.round(prof.attack)} • GUARD ${Math.round(prof.guard)} • ${esc(c.check)} ${best.value}</div><div class="tiny gold">${best.a?`${esc(best.a.name)} is best suited to the field check.`:'No specialist.'}</div></button>`}).join('')}</div>`)};

// ---------- Legendary battles ----------
function makeLegendaryEnemy(c){
 const name=c.legendarySpecies,sp=ENEMY_SPECIES[name],level=6+Math.max(0,c.risk-4),base=58+level*8;
 const hp=Math.round((250+level*35)*sp.hp);
 return{id:uid('apex'),name:c.legendaryName||name,species:name,role:'Apex',level,maxHp:hp,hp,attack:Math.round(base*sp.attack),guard:Math.round((34+level*6)*sp.guard),speed:Math.round((18+level*3)*sp.speed),accuracy:Math.round((18+level*3)*sp.accuracy),resolve:40+level*5,bossId:null,supernatural:!!sp.supernatural,horror:!!sp.horror,regen:sp.regen||0,evade:sp.evade||0,legendary:true};
}
const _startBattleV9=startBattle;
startBattle=function(p){_startBattleV9(p);const e=p.expedition,c=e?.contract,b=e?.battle;if(!b||!c.legendarySpecies)return;const apex=makeLegendaryEnemy(c);b.enemies.push(apex);b.log.unshift(`LEGENDARY THREAT — ${apex.name} enters the battle.`);e.legendaryKilled=false;};
function legendaryPulse(p,b,apex){
 if(!apex||apex.hp<=0)return;const living=alive(b.allies);if(!living.length)return;
 if(apex.species==='Dragon'&&b.round%3===0){living.forEach(t=>t.hp=Math.max(0,t.hp-rnd(9,16)));b.log.push(`${apex.name} sweeps the line with dragonfire.`);sfx('danger');}
 else if(apex.species==='Jotunn'&&b.round%3===0){living.forEach(t=>{t.hp=Math.max(0,t.hp-rnd(7,14));t.speed=Math.max(1,t.speed-1)});b.log.push(`${apex.name} shatters the ground beneath the party.`);}
 else if(apex.species==='Great Ryu'&&b.round%2===0){apex.evade=Math.min(.28,(apex.evade||0)+.025);const t=pick(living);t.hp=Math.max(0,t.hp-rnd(10,17));b.log.push(`${apex.name} vanishes through the storm and strikes ${t.name}.`);}
 else if(apex.species==='Storm Bird'&&b.round%2===0){const t=living.slice().sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];t.hp=Math.max(0,t.hp-rnd(13,20));b.log.push(`${apex.name} dives over the frontline into ${t.name}.`);}
 else if(apex.species==='Fallen Seraph'&&b.round%3===0){living.sort((a,c)=>a.resolve-c.resolve).slice(0,Math.min(3,living.length)).forEach(t=>t.hp=Math.max(0,t.hp-rnd(8,15)));apex.hp=Math.min(apex.maxHp,apex.hp+Math.round(apex.maxHp*.04));b.log.push(`${apex.name} pronounces judgment. The weakest minds buckle.`);}
}

// ---------- Defeat, retreat, capture, rescue ----------
function canCapture(species){return['Goblin','Hobgoblin','Bandit','Raider','Warband','Oni','Oni Brute','Nightkin','Night Stalker','Fallen Celestial'].includes(species);}
function rescueContract(a,c){
 const risk=clamp(c.risk,1,4),range=RISK_COUNTS[risk-1];return{id:uid('c'),regionId:c.regionId,type:'Rescue',check:chance(.5)?'sneak':'talk',title:`Bring ${a.name} Home`,desc:`A company adventurer is alive in enemy hands. Find and extract them.`,species:c.species,family:c.family||ecologyFamily(c.regionId,c.species),risk,enemyCount:rnd(range[0],range[1]),reward:0,unknown:0,expires:state.company.day+12,nemesisId:c.nemesisId||null,cacheChance:.15,rescueTargetId:a.id,isRescue:true,recommended:[2,3,4,5][risk-1]};
}
resolveBattle=function(p,win){
 const e=p.expedition,b=e.battle,c=e.contract,inf=hq(c.regionId).upgrades.Infirmary||0,deaths=[],captured=[];let bellAvailable=hasArtifact('The Mourning Bell',c.regionId)&&!e.bellUsed;
 const riskDeath=[.055,.11,.2,.31,.43][c.risk-1];
 b.allies.forEach(u=>{const a=state.roster.find(x=>x.id===u.charId);if(!a)return;const d=derived(a);a.hp=Math.max(1,Math.round(u.hp));
  if(u.hp<=0){let deathChance=riskDeath*(win?.42:1)*(1-inf*.09)*(1-(d.special.injuryResist||0)/100);if(e.retreated){deathChance*=p.tactic==='Cautious'?.55:p.tactic==='Balanced'?.72:.92}deathChance=clamp(deathChance,.01,.6);
   if(chance(deathChance)){
    if(bellAvailable){bellAvailable=false;e.bellUsed=true;a.status='Recovering';a.hp=1;a.injury='Bell-Touched';a.recovery=4;p.members.map(id=>state.roster.find(x=>x.id===id)).filter(x=>x&&x.id!==a.id&&x.status!=='Dead').forEach(x=>x.stats.resolve=Math.max(1,x.stats.resolve-1));b.log.push(`The Mourning Bell rings. ${a.name} returns at 1 HP.`)}
    else{a.status='Dead';a.hp=0;deaths.push(a.name);p.deaths++;a.history.push(`Day ${state.company.day}: died on ${c.title}.`)}
   }else if(!win&&canCapture(c.species)&&chance(e.retreated?.10:.18)){
    a.status='Captured';a.hp=1;a.injury=`Captured by ${c.species}`;a.recovery=0;captured.push({id:a.id,name:a.name});a.history.push(`Day ${state.company.day}: captured during ${c.title}.`);
   }else{a.status='Recovering';a.injury=`Badly Injured — ${injuryName()}`;a.recovery=Math.max(2,rnd(c.risk<=2?2:3,c.risk<=2?4:6)-Math.floor(inf/2));a.hp=1}
  }else if(u.hp/u.maxHp<.45&&chance(.38)){a.status='Recovering';a.injury=injuryName();a.recovery=Math.max(1,rnd(1,3+c.risk)-Math.floor(inf/2));}
  else a.status='Expedition';
 });
 captured.forEach(x=>{const a=state.roster.find(q=>q.id===x.id);if(a&&!state.regions[c.regionId].contracts.some(rc=>rc.rescueTargetId===a.id))state.regions[c.regionId].contracts.unshift(rescueContract(a,c));});
 e.battle=null;e.fought=true;e.battleWon=win;e.deaths=deaths;e.captured=captured;e.events.push(win?'The enemy formation breaks.':e.retreated?`${p.name} breaks contact and retreats before the field becomes a massacre.`:'The party is driven from the field.');if(!win)e.progress=100;save();render();
};
const _combatRoundV9=combatRound;
combatRound=function(p){
 const e=p.expedition,b=e?.battle;if(!b)return;const battleRef=b;_combatRoundV9(p);
 const apex=battleRef.enemies.find(x=>x.legendary);if(apex&&apex.hp<=0)e.legendaryKilled=true;
 if(!e.battle)return;
 const liveApex=e.battle.enemies.find(x=>x.legendary&&x.hp>0);legendaryPulse(p,e.battle,liveApex);
 if(!alive(e.battle.allies).length)return resolveBattle(p,false);
 const living=alive(e.battle.allies),total=e.battle.allies.length,hpRatio=living.reduce((s,x)=>s+x.hp/x.maxHp,0)/Math.max(1,living.length),round=e.battle.round;
 let retreat=false;if(p.tactic==='Cautious')retreat=round>=2&&(living.length<total||hpRatio<.58);else if(p.tactic==='Balanced')retreat=round>=3&&(living.length<=Math.ceil(total*.6)||hpRatio<.34);else retreat=round>=4&&(living.length===1&&total>2||hpRatio<.17);
 if(retreat){e.retreated=true;e.battle.log.push(`${p.tactic.toUpperCase()} DOCTRINE — retreat ordered.`);return resolveBattle(p,false)}
 save();render();
};

// Starter encounters are explicitly small local problems, not hidden player buffs.
const _makeEnemyV9=makeEnemy;
makeEnemy=function(c,index){const e=_makeEnemyV9(c,index);if(c.starter){e.level=1;e.maxHp=Math.max(22,Math.round(e.maxHp*.86));e.hp=e.maxHp;e.attack=Math.max(8,Math.round(e.attack*.9));e.guard=Math.max(6,Math.round(e.guard*.92));e.bossId=null}return e;};

// ---------- Completion extras ----------
const _finishExpeditionV9=finishExpedition;
finishExpedition=function(p){
 const e=p.expedition;if(!e)return;const c=e.contract,win=e.battleWon!==false,extras={retreated:!!e.retreated,captured:(e.captured||[]).map(x=>x.name)};
 const capturedIds=(e.captured||[]).map(x=>x.id);if(capturedIds.length)p.members=p.members.filter(id=>!capturedIds.includes(id));
 if(win&&c.rescueTargetId){const a=state.roster.find(x=>x.id===c.rescueTargetId);if(a&&a.status==='Captured'){a.status='Recovering';a.injury='Freed from Captivity';a.recovery=2;a.hp=Math.max(1,Math.round(a.maxHp*.35));a.history.push(`Day ${state.company.day}: rescued by ${p.name}.`);extras.rescued=a.name;pushHistory(`${p.name} rescued ${a.name} from captivity.`,c.regionId)}}
 if(win&&c.starter&&c.guaranteedGear){const gear=generateItem(c.regionId,0);inventoryEntry(gear,c.regionId,1);extras.starterGear=gear;pushHistory(`${p.name} recovered starter equipment: ${gear.name}.`,c.regionId)}
 if(c.legendarySpecies&&e.legendaryKilled){
  if(win){const roll=Math.random(),ri=roll<.18?4:roll<.58?3:2,drop=generateItem(c.regionId,ri);drop.name=`${c.legendarySpecies} Trophy — ${drop.name}`;inventoryEntry(drop,c.regionId,1);extras.legendaryLoot=drop;state.company.renown+=8;const rr=state.regions[c.regionId];rr.threat=clamp(rr.threat-8,0,100);rr.stability=clamp(rr.stability+4,0,100);rr.prosperity=clamp(rr.prosperity+3,0,100);pushHistory(`LEGENDARY KILL — ${c.legendaryName||c.legendarySpecies} slain by ${p.name}.`,c.regionId)}
  else pushHistory(`${p.name} slew ${c.legendaryName||c.legendarySpecies}, but failed to complete the contract. The apex loot was lost.`,c.regionId);
 }
 state.ui.v10ReportExtras=extras;_finishExpeditionV9(p);save();
};
const _showReportV9=showReport;
showReport=function(r){_showReportV9(r);const x=state.ui.v10ReportExtras||{};const sheet=document.getElementById('sheet');if(!sheet)return;let html='';if(x.retreated)html+='<div class="notice retreatNote"><b>RETREAT:</b> the party broke contact instead of fighting to extermination.</div>';if(x.captured?.length)html+=`<div class="card danger"><b>Captured:</b> ${x.captured.map(esc).join(', ')}. Rescue contracts have been added to the board.</div>`;if(x.rescued)html+=`<div class="card good"><b>Rescued:</b> ${esc(x.rescued)} is back in company hands and recovering.</div>`;if(x.starterGear)html+=`<div class="card"><b>Local-work equipment:</b>${itemHTML(x.starterGear)}</div>`;if(x.legendaryLoot)html+=`<div class="legendaryBanner">APEX LOOT RECOVERED</div>${itemHTML(x.legendaryLoot)}`;if(html)sheet.insertAdjacentHTML('beforeend',html);state.ui.v10ReportExtras=null;decorateNoEmoji(sheet);};

// ---------- Region consequence / ecology UI ----------
const _regionCardV9=regionCard;
regionCard=function(id){let html=_regionCardV9(id),eco=REGION_ECOLOGY[id];const ecoHtml=`<div class="ecologyStrip"><span>Native families: <b>${eco.families.map(f=>esc(f.name)).join(' • ')}</b></span><span>Legendary: <b>${esc(eco.legendary.title)}</b></span></div>`;return html.replace('<div class="actions">',ecoHtml+'<div class="actions">')};
showRegionInfo=function(id){const r=state.regions[id],d=REGION_DEFS[id],eco=REGION_ECOLOGY[id];modal(`<div class="sheetHead"><h3>${esc(d.name)}</h3><button class="x" data-action="close">✕</button></div><div class="card"><b>${esc(d.culture)} culture</b><p class="small muted">${esc(CULTURES[d.culture].desc)}</p></div><div class="sectionTitle"><h3>Native Enemy Ecology</h3><span>at least three families</span></div><div class="list">${eco.families.map(f=>`<div class="card"><b>${esc(f.name)}</b><div class="tiny muted">${f.species.map(esc).join(' • ')}</div></div>`).join('')}<div class="card legendaryCard"><b>LEGENDARY APEX — ${esc(eco.legendary.title)}</b><div class="tiny muted">Rare Risk 5 appearances. Killing it only awards apex loot if the contract is also completed.</div></div></div><div class="grid3"><div class="card"><b>${Math.round(r.prosperity)}</b><div class="tiny muted">Prosperity controls stock, rarity and prices.</div></div><div class="card"><b>${Math.round(r.stability)}</b><div class="tiny muted">Stability controls recruit quantity and quality.</div></div><div class="card"><b>${Math.round(r.threat)}</b><div class="tiny muted">Threat controls risk, enemy counts, elites and settlement loss.</div></div></div>`)};

// ---------- SVG/monochrome presentation ----------
function v10Icon(name){
 const paths={
  hq:'M3 21V9l4-4 5 4 5-4 4 4v12M7 21v-6h4v6M14 21v-8h4v8M3 9h18',
  roster:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-2a3 3 0 1 0 0-6M2 21c0-4 2-7 6-7s6 3 6 7M14 15c4 0 7 2 8 6',
  contracts:'M5 3h12v18H5zM8 7h6M8 11h6M8 15h4M17 6h2v12h-2',
  world:'M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18M4.5 7h15M4.5 17h15',
  vault:'M5 8h14l1 13H4L5 8Zm3 0V6a4 4 0 0 1 8 0v2M9 13h6',
  audio:'M4 10v4h4l5 4V6L8 10H4Zm12-2c1 1 2 2.5 2 4s-1 3-2 4M18 5c2 2 3 4.5 3 7s-1 5-3 7',
  mute:'M4 10v4h4l5 4V6L8 10H4Zm12-2 5 8M21 8l-5 8',
  market:'M3 9l2-5h14l2 5M5 9v11h14V9M3 9h18M8 20v-6h8v6',
  rest:'M19 16A8 8 0 0 1 8 5a7 7 0 1 0 11 11Z',
  info:'M12 17v-6M12 7h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z',
  bed:'M3 19v-8M3 15h18v4M6 11h5a3 3 0 0 1 3 3v1M6 11V7h5a3 3 0 0 1 3 3',
  heal:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6z',
  shield:'M12 3l8 3v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z',
  crate:'M4 6h16v14H4zM4 10h16M8 6v14M16 6v14',
  sword:'M4 20l5-5M7 17l-2-2 11-11 4-1-1 4L8 18M4 20l-1 1',
  archive:'M5 4h11a3 3 0 0 1 3 3v13H7a2 2 0 0 1-2-2V4Zm2 0v14a2 2 0 0 0-2 2M10 8h6M10 12h6',
  key:'M14 8a5 5 0 1 1-2 4L21 3M17 7l2 2M15 9l2 2',
  flag:'M5 21V4m0 1h12l-2 4 2 4H5',
  cache:'M4 8h16v12H4V8Zm2 0V5h12v3M4 12h16M10 12v3h4v-3',
  save:'M4 4h14l2 2v14H4V4Zm3 0v6h9V4M8 20v-6h8v6',
  newgame:'M4 12a8 8 0 1 0 2-5M4 4v5h5M12 8v8M8 12h8',
  lantern:'M8 5h8l2 4-2 10H8L6 9l2-4Zm2-3h4M9 9h6M10 19l-2 3M14 19l2 3',
  menu:'M4 7h16M4 12h16M4 17h16'
 };
 const d=paths[name]||paths.info;return`<svg class="uiIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
}
function raceGlyph(r){return`<span class="raceGlyph race-${String(r).toLowerCase()}">${({Human:'HU',Dwarf:'DW',Elf:'EL',Orc:'OR',Celestial:'CE'})[r]||'??'}</span>`}
Object.keys(RACE_ICONS).forEach(r=>RACE_ICONS[r]=raceGlyph(r));
NAV.splice(0,NAV.length,['hq',v10Icon('hq'),'HQ'],['roster',v10Icon('roster'),'ROSTER'],['contracts',v10Icon('contracts'),'CONTRACTS'],['world',v10Icon('world'),'WORLD'],['vault',v10Icon('vault'),'VAULT']);
const hqIconMap={Barracks:'bed',Infirmary:'heal',Armory:'shield','Contract Office':'contracts',Stores:'crate','Training Yard':'sword','Occult Archive':'archive','Artifact Vault':'key','Command Hall':'flag'};Object.entries(hqIconMap).forEach(([k,v])=>HQ_DEFS[k].icon=v10Icon(v));
const EMOJI_MAP={'🏰':'hq','👥':'roster','📜':'contracts','🗺️':'world','🎒':'vault','🔊':'audio','🔇':'mute','🏮':'lantern','🛒':'market','🌙':'rest','🛏️':'bed','⚕️':'heal','🛡️':'shield','📦':'crate','⚔️':'sword','🕯️':'archive','🗝️':'key','🚩':'flag','🧰':'cache','💾':'save','🆕':'newgame'};
function decorateNoEmoji(root){if(!root)return;let html=root.innerHTML;Object.entries(EMOJI_MAP).forEach(([e,k])=>{html=html.split(e).join(v10Icon(k))});root.innerHTML=html;}
const _renderV9=render;render=function(){_renderV9();if(state)document.body.dataset.region=state.currentRegion;decorateNoEmoji(document.getElementById('app'));decorateNoEmoji(document.getElementById('nav'));};
const _renderStartV9=renderStart;renderStart=function(){_renderStartV9();document.body.dataset.region='start';decorateNoEmoji(document.getElementById('app'));};
const _modalV9=modal;modal=function(html){_modalV9(html);decorateNoEmoji(document.getElementById('sheet'));};
unitHTML=function(u){const mark=u.charId?raceGlyph(u.race||'Human'):`<span class="enemyGlyph">${esc((u.species||'?').slice(0,2).toUpperCase())}</span>`;return`<div class="unit ${u.hp<=0?'dead':''} ${u.legendary?'unitLegendary':''}"><div class="unitTop"><span class="unitIdentity">${mark}<b>${esc(u.name)}</b></span><span>${Math.max(0,Math.round(u.hp))}/${u.maxHp}</span></div><div class="hpbar"><i style="width:${clamp(u.hp/u.maxHp*100,0,100)}%"></i></div></div>`};

// ---------- Audio: explicit mobile unlock + substantially louder master levels ----------
audioCtx=function(){if(audio?.ctx)return audio.ctx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;const ctx=new AC(),master=ctx.createGain(),compressor=ctx.createDynamicsCompressor(),musicGain=ctx.createGain(),sfxGain=ctx.createGain();compressor.threshold.value=-16;compressor.knee.value=12;compressor.ratio.value=5;compressor.attack.value=.003;compressor.release.value=.22;musicGain.connect(compressor);sfxGain.connect(compressor);compressor.connect(master);master.connect(ctx.destination);audio={ctx,master,compressor,musicGain,sfxGain,musicNodes:[],musicTimer:null,unlocked:false};updateAudioGains();return ctx};
updateAudioGains=function(){if(!audio||!state)return;audio.master.gain.value=.95;audio.sfxGain.gain.value=.72*(state.settings.sfxVolume??1);audio.musicGain.gain.value=.44*(state.settings.musicVolume??.9)};
unlockAudio=function(){if(!state)return;const ctx=audioCtx();if(!ctx)return;const finish=()=>{audio.unlocked=ctx.state==='running';updateAudioGains();if(audio.unlocked&&state.settings.sfx)simpleTone(540,.09,'triangle',.24,true);if(audio.unlocked&&state.settings.music)startMusic()};try{const p=ctx.resume();if(p&&typeof p.then==='function')p.then(finish).catch(()=>{});else finish()}catch(e){finish()}};
document.addEventListener('touchstart',()=>{if(state)unlockAudio()},{passive:true});
const _showAudioV9=showAudio;showAudio=function(){_showAudioV9();const sheet=document.getElementById('sheet');if(sheet){const n=document.createElement('div');n.className='audioStatus';n.innerHTML=`ENGINE: <b>${audio?.unlocked&&audio?.ctx?.state==='running'?'ACTIVE':'TAP TEST SOUND TO UNLOCK'}</b> • Output boosted for mobile`;sheet.appendChild(n);decorateNoEmoji(sheet)}};

// ---------- Extend audit ----------
const _auditV9=audit;
audit=function(){const out=_auditV9();const test=createState('V10 Audit');return withState(test,()=>{out.balanceVersion=10;out.enemyFamiliesMinimum=REGION_ORDER.every(id=>REGION_ECOLOGY[id].families.length>=3);out.legendaryEveryRegion=REGION_ORDER.every(id=>!!REGION_ECOLOGY[id].legendary);out.founderMuster=state.company.founderMuster===3;state.company.day=1;refreshContracts('veyric');out.starterRiskOne=state.regions.veyric.contracts.filter(c=>c.risk===1&&c.starter).length>=2;out.starterEnemyCounts=state.regions.veyric.contracts.filter(c=>c.starter).every(c=>c.enemyCount>=2&&c.enemyCount<=3);const p=state.parties[0];state.regions.veyric.recruits.slice(0,3).forEach(a=>{state.roster.push(a);p.members.push(a.id)});const c=starterContract();out.dangerReadout=!!partyDanger(p,c).label;out.noEmojiNav=NAV.every(x=>!/[🏰👥📜🗺️🎒]/u.test(x[1]));return out})};
window.__BL_AUDIT=audit;
