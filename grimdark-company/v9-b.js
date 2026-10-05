 Spirit:{hp:.82,attack:1.05,guard:.7,speed:1.25,accuracy:1.15,evade:.12,supernatural:true,desc:'Spirits are difficult to hit without Accuracy and Occult support.'},
 'Corrupted Beast':{hp:1.1,attack:1.15,guard:.82,speed:1.08,accuracy:1,supernatural:true,desc:'Warped animals with violent bursts of speed.'},
 'Bandit Clan':{hp:1,attack:1,guard:1,speed:1,accuracy:1.05,desc:'Organized mortal fighters.'},
 Wraith:{hp:.9,attack:1.15,guard:.75,speed:1.15,accuracy:1.1,supernatural:true,desc:'Wraiths punish low Resolve.'},
 Ogre:{hp:1.55,attack:1.4,guard:1.05,speed:.65,accuracy:.82,desc:'Massive, inaccurate and devastating.'},
 Warband:{hp:1.05,attack:1.1,guard:1.05,speed:1.05,accuracy:.98,desc:'Disciplined mortal enemies.'},
 'Hyena Beast':{hp:.8,attack:1,guard:.72,speed:1.3,accuracy:1.05,desc:'Pack hunters that target the wounded.'},
 'Giant Predator':{hp:1.7,attack:1.35,guard:1.08,speed:.9,accuracy:.9,desc:'Single monsters with extraordinary durability.'},
 Horror:{hp:1.25,attack:1.25,guard:1.05,speed:1.05,accuracy:1.08,supernatural:true,horror:true,desc:'Horrors inflict Resolve pressure simply by being present.'},
 'Void Wraith':{hp:1.05,attack:1.3,guard:.82,speed:1.25,accuracy:1.15,supernatural:true,horror:true,desc:'Fast Firmament predators that distort targeting.'}
};
const ENEMY_ROLES={
 Brute:{hp:1.3,attack:1.25,guard:1.05,speed:.8,accuracy:.85},Skirmisher:{hp:.85,attack:.95,guard:.8,speed:1.3,accuracy:1.08},Archer:{hp:.8,attack:1,guard:.72,speed:1.05,accuracy:1.25},
 Shield:{hp:1.15,attack:.88,guard:1.35,speed:.78,accuracy:.9},Shaman:{hp:.82,attack:1.08,guard:.78,speed:.95,accuracy:1.1},Stalker:{hp:.9,attack:1.15,guard:.75,speed:1.28,accuracy:1.12}
};

const ITEM_BASES={
 Veyric:[['Arming Sword','weapon',18],['Crossbow','weapon',20],['Boar Spear','weapon',16],['War Hammer','weapon',22],['Brigandine','armor',24],['Mail Hauberk','armor',28],['Kite Shield','armor',20],['Hunter Hound Token','charm',18]],
 Skeldic:[['Bearded Axe','weapon',19],['Long Axe','weapon',24],['Seax','weapon',15],['Round Shield','armor',20],['Ring Mail','armor',26],['Wolfskin Mantle','armor',18],['Rune Stone','charm',24]],
 Hoshin:[['Katana','weapon',23],['Yumi Bow','weapon',22],['Yari','weapon',18],['Lamellar Do','armor',25],['Scout Wraps','armor',16],['Prayer Tablet','charm',22]],
 Nambaran:[['Short Spear','weapon',17],['Heavy Knobkerrie','weapon',20],['Broad Shield','armor',22],['Hide Cuirass','armor',18],['Runner Anklets','charm',19],['Ancestor Beads','charm',23]],
 Aethren:[['Lumen Spear','weapon',40],['Glass Blade','weapon',42],['Resonant Aegis','armor',46],['Veil Mantle','armor',38],['Pattern Prism','charm',45]]
};
const MODIFIERS=[
 {id:'atk',label:(v)=>`+${v} Attack`,scale:[2,4,6,9,13],effect:(v)=>({attack:v})},
 {id:'guard',label:v=>`+${v} Guard`,scale:[2,4,6,9,13],effect:v=>({guard:v})},
 {id:'speed',label:v=>`+${v} Speed`,scale:[1,2,4,6,9],effect:v=>({speed:v})},
 {id:'acc',label:v=>`+${v} Accuracy`,scale:[2,4,6,9,13],effect:v=>({accuracy:v})},
 {id:'res',label:v=>`+${v} Resolve`,scale:[2,4,6,9,13],effect:v=>({resolve:v})},
 {id:'talk',label:v=>`+${v} Talk`,scale:[2,3,5,7,10],util:'talk'},
 {id:'sneak',label:v=>`+${v} Sneak`,scale:[2,3,5,7,10],util:'sneak'},
 {id:'scout',label:v=>`+${v} Scout`,scale:[2,3,5,7,10],util:'scout'},
 {id:'endure',label:v=>`+${v} Endure`,scale:[2,3,5,7,10],util:'endure'},
 {id:'occult',label:v=>`+${v} Occult`,scale:[2,3,5,7,10],util:'occult'},
 {id:'hp',label:v=>`+${v} Max HP`,scale:[6,10,16,24,36],maxHp:true},
 {id:'opening',label:v=>`+${v}% opening-round damage`,scale:[5,9,14,20,28],special:'opening'},
 {id:'injury',label:v=>`${v}% injury resistance`,scale:[6,10,15,22,30],special:'injuryResist'},
 {id:'loot',label:v=>`+${v}% loot quality chance`,scale:[3,5,8,12,18],special:'loot'},
 {id:'goblin',label:v=>`+${v}% damage vs Goblins`,scale:[6,10,15,22,30],enemy:'Goblin'},
 {id:'undead',label:v=>`+${v}% damage vs supernatural enemies`,scale:[5,9,14,20,28],enemy:'supernatural'},
 {id:'horror',label:v=>`+${v}% damage vs Horrors`,scale:[7,12,18,26,36],enemy:'Horror'}
];

const CONTRACT_TYPES=[
 ['Hunt','Track and kill a dangerous target.','scout'],['Rescue','Find missing people before the enemy moves them.','talk'],['Escort','Move vulnerable people or goods through hostile territory.','endure'],
 ['Defense','Hold a settlement or road position.','endure'],['Retrieval','Recover an object from enemy-held ground.','sneak'],['Investigation','Find out what happened before deciding what to kill.','occult'],
 ['Extermination','Clear a nest, camp or infestation.','scout'],['Negotiation','Resolve a dangerous dispute without starting surrounded.','talk'],['Exploration','Push into unmapped or abandoned ground.','scout'],
 ['Siege','Break an entrenched enemy position.','endure'],['Assassination','Reach a specific target and remove them.','sneak'],['Caravan','Protect trade across a dangerous route.','talk']
];
const CONTRACT_NAMES={
 Goblin:['Broken Tollhouse','Blackpine Warrens','The Red Cap Gang','Missing Grain Carts'],Bandit:['Road Tax','The Burned Inn','Dead Courier','Bridge Men'],Undead:['Graves Opened Below','Bell After Midnight','Saintless Crypt','Walking Field'],Wolf:['Livestock Vanishing','Red-Eyed Pack','The Shepherd Road'],
 Trollkin:['Bridge-Eater','Ice Cave Roar','Broken Longhouse'],Draugr:['Barrow Door Open','Dead Oarsmen','The Old King Walks'],Beast:['White Maw','Tracks Bigger Than Horses'],Raider:['Salt-Road Feud','Burned Jetty'],
 Spirit:['Lanterns in the Cedar','Shrine Without Shadows','The Weeping Ford'],'Corrupted Beast':['Antlered Thing','Rotting Crane Grove'],'Bandit Clan':['House War','Rice Road Ambush'],Wraith:['No-Face Procession','Cold Room'],
 Ogre:['The Third Traveler','Redveld Toll','Bone Hill'],Warband:['Broken Regiment','Night Spears'],'Hyena Beast':['Laughing Pack','Dry River Hunt'],'Giant Predator':['The Long Shadow','Cattle Torn in Half'],
 Horror:['The Door That Breathes','Choir Beneath Glass','Skin of the Sky','The Crooked Birth'],'Void Wraith':['Black Star Crossing','No Shadow at Noon']
};


const ARTIFACT_POOL=[
 {name:'The Mourning Bell',desc:'Once per expedition, a fallen adventurer may be dragged back at 1 HP.',cost:'When it triggers, surviving party members lose 1 Resolve.'},
 {name:"The King’s Second Face",desc:'Successful contracts pay 25% more in the region where it is stored.',cost:'Weekly local wages rise by 8%.'},
 {name:'Saint Veyra’s Nail',desc:'Supernatural enemies begin combat with weakened Guard.',cost:'Survivors sometimes return Haunted.'},
 {name:'The Salt Crown',desc:'Markets refresh with one additional item.',cost:'Regional Stability drifts downward slightly while stored.'},
 {name:'Glass Heart of Namar',desc:'A downed party has a small chance to keep fighting for one extra combat round.',cost:'Its region gains additional Horror activity.'}
];

const HQ_DEFS={
 Barracks:{icon:'🛏️',max:5,base:55,desc:'Adds 6 adventurer roster spaces in this region per level.'},
 Infirmary:{icon:'⚕️',max:5,base:75,desc:'Heals +5 HP per recovery day per level and reduces injury/death risk.'},
 Armory:{icon:'🛡️',max:5,base:70,desc:'Improves bonus equipment chance and loot rarity after contracts.'},
 'Contract Office':{icon:'📜',max:5,base:75,desc:'Adds one contract slot and +5% contract pay per level.'},
 Stores:{icon:'📦',max:5,base:60,desc:'Reduces market purchase prices and weekly wages by 4% per level.'},
 'Training Yard':{icon:'⚔️',max:5,base:90,desc:'Ready local adventurers gain 2 XP per level each game day.'},
 'Occult Archive':{icon:'🕯️',max:5,base:140,desc:'Improves Occult field checks and supernatural loot discovery.'},
 'Artifact Vault':{icon:'🗝️',max:1,base:180,desc:'Removes the two-artifact safety limit for this HQ.'},
 'Command Hall':{icon:'🚩',max:4,base:110,desc:'Adds one member to maximum party size per level, up to 8.'}
};

const FIRST=['Edric','Morga','Branna','Sylwen','Harl','Vessa','Torren','Kelda','Orin','Maela','Garrik','Sorn','Elian','Brok','Nessa','Dorr','Avel','Rusk','Thalen','Yara','Korr','Miren','Sten','Asha','Jiro','Hana','Kaito','Sable','Nara','Veyl'];
const LAST=['Vale','Stone','Ash','Crow','Black','Marr','Rook','Fen','Grim','Holt','Varn','Skull','Reed','Moss','Dusk','Thorn','Grey','Bone','Marsh','Kell','Rime','Ward','Kane','Ruun','Soryn','Storm'];
const NEMESIS_FIRST=['Grizzik','Mogru','Hask','Vorr','Skar','Umei','Thruk','Nesh','Krag','Sable-Eye','Oss','Moro'];
const NEMESIS_TITLES=['One-Eye','the Red','Bone-Taker','Road-King','the Hollow','Nine-Teeth','the Crooked','Black Tongue','the Pale','Carrion Lord'];

let state=null;
let toastTimer=null;
let autoTimer=null;
let audio=null;

function freshUpgrades(){const x={};Object.keys(HQ_DEFS).forEach(k=>x[k]=0);return x}
function makeRegion(id){const d=REGION_DEFS[id];return{id,prosperity:d.start.prosperity,stability:d.start.stability,threat:d.start.threat,settlements:5,totalSettlements:5,lost:false,hq:{established:id==='veyric',name:d.hqName,upgrades:freshUpgrades()},market:{stock:[],nextRefresh:1},recruits:[],contracts:[],log:[]}}
function createState(name){
 const s={version:VERSION,company:{name:name||'',silver:90,renown:0,day:1},currentRegion:'veyric',regions:{},roster:[],parties:[],inventory:[],caches:[],artifacts:[],nemeses:[],relationships:{},history:[],settings:{music:true,sfx:true,musicVolume:.8,sfxVolume:.9},ui:{tab:'hq'}};
 REGION_ORDER.forEach(id=>s.regions[id]=makeRegion(id));
 s.regions.veyric.hq.upgrades.Barracks=1;
 s.parties.push(makeParty('veyric','Ash Dogs'));
 withState(s,()=>{refreshRegion('veyric',true);REGION_ORDER.slice(1).forEach(id=>refreshRegion(id,true));});
 return s;
}
function withState(s,fn){const prev=state;state=s;try{return fn()}finally{state=prev}}
function makeParty(regionId,name){return{id:uid('p'),regionId,name,members:[],tactic:'Balanced',cohesion:0,captainId:null,missions:0,wins:0,deaths:0,expedition:null,specialty:null}}

function idbOpen(name='brokenLanternCanonical'){return new Promise(resolve=>{if(!('indexedDB'in window))return resolve(null);try{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains('saves'))db.createObjectStore('saves')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}
async function idbGet(key=SAVE_KEY,name='brokenLanternCanonical'){const db=await idbOpen(name);if(!db)return null;return new Promise(resolve=>{try{const tx=db.transaction('saves','readonly'),r=tx.objectStore('saves').get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>resolve(null)}catch(e){resolve(null)}})}
async function idbPut(raw){const db=await idbOpen();if(!db)return;try{const tx=db.transaction('saves','readwrite');tx.objectStore('saves').put(raw,SAVE_KEY)}catch(e){}}
async function idbClear(){try{indexedDB.deleteDatabase('brokenLanternCanonical')}catch(e){}try{indexedDB.deleteDatabase('brokenLanternMobile')}catch(e){}}
function safeLocalGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function safeLocalSet(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}}
function safeLocalRemove(k){try{localStorage.removeItem(k)}catch(e){}}
function save(){if(!state)return false;state.version=VERSION;const raw=JSON.stringify(state);safeLocalSet(SAVE_KEY,raw);idbPut(raw);return true}

function migrateLegacy(old){
 const s=createState(old?.company?.name||old?.name||'Broken Lantern Company');
 if(!old||typeof old!=='object')return s;
 try{safeLocalSet(BACKUP_KEY,JSON.stringify(old))}catch(e){}
 s.company.silver=Number(old.silver??old.company?.silver??s.company.silver);
 s.company.renown=Number(old.renown??old.company?.renown??0);
 s.company.day=Number(old.day??old.company?.day??1);
 const legacyCulture={'Marcher Kingdoms':'Veyric','Veyric':'Veyric','Fjord Holds':'Skeldic','Skeldic':'Skeldic','Sword Houses':'Hoshin','Hoshin':'Hoshin','Shield-Spear Clans':'Nambaran','Nambara':'Nambaran','Nambaran':'Nambaran'};
 const classCulture={
  'Knight-Errant':'Veyric','Man-at-Arms':'Veyric','Crossbowman':'Veyric','Houndmaster':'Veyric','March Ranger':'Veyric','Battle Chaplain':'Veyric',