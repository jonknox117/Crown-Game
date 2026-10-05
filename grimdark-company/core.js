const SAVE='brokenLanternDemo_v1';
const RACES={Human:'🧑',Dwarf:'🧔',Elf:'🧝',Orc:'👹'};
const backgrounds=['Peasant','Miner','Poacher','Rat Catcher','Grave Digger','Hunter','Deserter','Village Guard','Failed Apprentice','Laborer','Charcoal Burner','Pit Fighter','Shepherd','Tanner'];
const traits=['Hard Worker','Cowardly','Greedy','Iron Stomach','Bad Knee','Quick Learner','Hot Temper','Night Eyes','Steady Hands','Superstitious','Kindhearted','Bloodthirsty','Stubborn','Lucky','Sickly','Tunnel Rat','Streetwise','Haunted'];
const first=['Edric','Morga','Branna','Sylwen','Harl','Vessa','Torren','Kelda','Orin','Maela','Garrik','Sorn','Elian','Brok','Nessa','Dorr','Avel','Rusk','Thalen','Yara','Korr','Miren','Sten','Asha'];
const last=['Vale','Stone','Ash','Crow','Black','Marr','Rook','Fen','Grim','Holt','Varn','Skull','Reed','Moss','Dusk','Thorn','Grey','Bone','Marsh','Kell','Rime','Ward'];
const enemySets=[['Goblin','Goblin','Goblin Archer'],['Wolf','Wolf','Dire Wolf'],['Zombie','Zombie','Ghoul'],['Bandit','Bandit','Poacher'],['Skeleton','Skeleton','Grave Wight'],['Giant Spider','Spiderling','Spiderling'],['Orc Marauder','Orc Marauder','Warhound'],['Ghoul','Ghoul','Carrion Crawler']];
const weaponLoot=['Rusty Handaxe','Goblin Knife','Boar Spear','Hunting Bow','Iron Mace','Notched Longsword','Bone-handled Dagger','Heavy Pick'];
const armorLoot=['Quilted Coat','Leather Jerkin','Iron Skullcap','Chain Scraps','Round Shield','Reinforced Boots','Brigandine Vest'];
const miscLoot=['Wolf Pelt','Ghoul Teeth','Blackpine Resin','Silver Candlestick','Spider Silk','Bone Charm','Ogre Knuckle','Grave Salt'];
const artifactPool=[
{name:'The Mourning Bell',icon:'🔔',desc:'A black bell cut from a saint’s grave. Once per expedition, a fallen adventurer may stand again long enough to finish the job.',cost:'Every use permanently lowers the company’s average Resolve.'},
{name:"The King’s Second Face",icon:'🎭',desc:'A preserved royal face beneath cloudy glass. Contracts involving nobles pay 35% more.',cost:'Recruit wages rise while it is owned. Nobody sleeps well near it.'},
{name:'Saint Veyra’s Nail',icon:'📍',desc:'A corroded iron spike. Parties gain major power against undead.',cost:'Living recruits sometimes return from undead missions with a new scar or trauma even when unharmed.'}
];
const contractTemplates=[
['Missing Goats','Something is dragging livestock into the eastern tree line.','Blackpine Forest',1],
['Charcoal Burner Gone','A burner’s kiln is still smoking. The burner is not there.','Blackpine Forest',1],
['The Mill Won’t Stop Screaming','The mill turns day and night. Nobody has gone inside since the screams began.','Drowned Farms',2],
['Graves Opened From Below','Three graves are empty. Their coffins were broken outward.','Saint Orrin’s Vale',2],
['The Old Road Tax','A gang is collecting blood and silver from supply wagons.','The Old Road',2],
['Beneath Saint Orrin','The church crypt has opened into something much older.','Saint Orrin’s Vale',3],
['Redfang Toll','An ogre has taken the bridge and eats every third traveler.','Redfang Hills',3],
['Moon-Bitten Shepherd','A shepherd returned after three nights missing. The village locked him in a grain store.','Drowned Farms',3],
['Children in the Mine','Voices are calling from a mine that collapsed twenty years ago.','Redfang Hills',4]
];
const hqDefs={
Barracks:{icon:'🛏️',desc:'Increase roster capacity by 4.',base:45},
Infirmary:{icon:'⚕️',desc:'Reduces recovery time and death chance from wounds.',base:70},
Armory:{icon:'🛡️',desc:'Improves equipment found in ordinary contracts.',base:60},
'Contract Office':{icon:'📜',desc:'Adds one contract to each refresh and improves rewards.',base:65},
Stores:{icon:'📦',desc:'Reduces supply costs and expedition mishaps.',base:50},
'Training Yard':{icon:'⚔️',desc:'Idle adventurers gain a little XP after each completed contract.',base:85},
'Occult Archive':{icon:'🕯️',desc:'Reveals more unknown factors and improves artifact discovery.',base:130},
'Artifact Vault':{icon:'🗝️',desc:'Safely stores legendary relics. Required beyond 2 artifacts.',base:150}
};
function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function uid(){return Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4)}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function recruitGen(){
 const race=pick(Object.keys(RACES)),bg=pick(backgrounds); const lvl=1; let base=rnd(8,14);
 let stats={power:base+rnd(0,6),defense:base+rnd(0,6),speed:base+rnd(0,6),awareness:base+rnd(0,6),resolve:base+rnd(0,6)};
 if(race==='Orc')stats.power+=5;if(race==='Dwarf')stats.defense+=5;if(race==='Elf'){stats.speed+=3;stats.awareness+=4}if(race==='Human')stats.resolve+=2;
 const cost=rnd(7,14)+(race==='Elf'?5:0)+(race==='Dwarf'?3:0)+(race==='Orc'?2:0);
 return{id:uid(),name:pick(first)+' '+pick(last),race,bg,lvl,xp:0,xpNext:50,hp:100,maxHp:100,stats,traits:[pick(traits),pick(traits)].filter((v,i,a)=>a.indexOf(v)===i),wage:Math.max(2,Math.ceil(cost/4)),hire:cost,status:'Ready',injury:null,recovery:0,gear:{weapon:bg==='Hunter'||bg==='Poacher'?'Hunting Bow':bg==='Miner'?'Heavy Pick':'Wood Axe',armor:'Worn Clothes'},kills:0,missions:0,scars:[]};
}
function contractGen(i=0){const t=pick(contractTemplates);let risk=clamp(t[3]+(state?.day>15&&Math.random()<.25?1:0),1,4);let reward=rnd(8,14)*risk+Math.floor((state?.hq?.['Contract Office']||0)*4);return{id:uid(),title:t[0],desc:t[1],place:t[2],risk,reward,distance:rnd(2,14),unknown:rnd(0,risk),enemies:enemySets[clamp(risk-1+rnd(0,1),0,enemySets.length-1)],expires:(state?.day||1)+rnd(2,5),cache:Math.random()<.55};}
function initial(){const hq={};Object.keys(hqDefs).forEach(k=>hq[k]=k==='Barracks'?1:0);return{version:1,tab:'hq',day:1,silver:82,renown:0,food:9,medicine:2,roster:[],recruits:Array.from({length:6},recruitGen),parties:[{id:uid(),name:'Ash Dogs',members:[],expedition:null}],inventory:[{name:'Bandages',type:'Supply',qty:3},{name:'Rope',type:'Supply',qty:1}],caches:[],artifacts:[],hq,contracts:Array.from({length:5},(_,i)=>contractGen(i)),threats:{'Blackpine Forest':23,'Drowned Farms':31,'Redfang Hills':38,'Saint Orrin’s Vale':44,'The Old Road':19},log:['Day 1 — The deed to a ruined coaching house is yours. Unfortunately, so are its debts.'],tutorial:true,lastReport:null,completed:0,settings:{fast:false}}}
let state;try{state=JSON.parse(localStorage.getItem(SAVE))||initial()}catch(e){state=initial()}
function save(){localStorage.setItem(SAVE,JSON.stringify(state))}
function money(n){return n+'s'}
function cap(){return 4+(state.hq.Barracks||1)*4}
function employedCount(){return state.roster.filter(r=>r.status!=='Dead').length}
function totalPower(p){return p.members.map(id=>state.roster.find(r=>r.id===id)).filter(Boolean).reduce((s,r)=>s+r.stats.power+r.stats.defense*.65+r.stats.speed*.35+r.lvl*5,0)}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function modal(html){document.getElementById('sheet').innerHTML=html;document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()})
window.closeModal=closeModal;
function top(){return `<div class="topbar"><div class="brand"><h1>Broken Lantern Co.</h1><div class="day">DAY ${state.day}</div></div><div class="resources"><div class="pill">SILVER<b>${state.silver}</b></div><div class="pill">RENOWN<b>${state.renown}</b></div><div class="pill">ROSTER<b>${employedCount()}/${cap()}</b></div><div class="pill">ACTIVE<b>${state.parties.filter(p=>p.expedition).length}</b></div></div></div>`}
function nav(){const items=[['hq','🏰','HQ'],['roster','👥','ROSTER'],['contracts','📜','CONTRACTS'],['world','🗺️','WORLD'],['vault','🎒','VAULT']];document.getElementById('nav').innerHTML=items.map(x=>`<button class="navbtn ${state.tab===x[0]?'active':''}" data-tab="${x[0]}"><b>${x[1]}</b>${x[2]}</button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()})}
