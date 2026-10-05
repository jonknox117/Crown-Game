(function(){
'use strict';

const VERSION=9;
const SAVE_KEY='brokenLanternCanonical_v9';
const LEGACY_KEY='brokenLanternDemo_v1';
const BACKUP_KEY='brokenLanternPreV9Backup';
const RARITIES=['Common','Uncommon','Rare','Super Rare','Legendary'];
const RARITY_MULT=[1,1.75,3.1,5.2,8.8];
const RACE_ICONS={Human:'🧑',Dwarf:'🧔',Elf:'🧝',Orc:'👹',Celestial:'✧'};
const REGION_ORDER=['veyric','skeld','hoshin','nambara','firmament'];
const NAV=[['hq','🏰','HQ'],['roster','👥','ROSTER'],['contracts','📜','CONTRACTS'],['world','🗺️','WORLD'],['vault','🎒','VAULT']];
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const chance=p=>Math.random()<p;
const uid=(p='x')=>p+Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-4);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>`${Math.round(n)}s`;

const RACES={
 Human:{passive:'Adaptable Blood',desc:'+2 Resolve and +10% contract XP.',base:{resolve:2},xp:1.10},
 Dwarf:{passive:'Stoneblood',desc:'+4 Guard and 15% less expedition attrition.',combat:{guard:4},attrition:.85},
 Elf:{passive:'Keen Senses',desc:'+2 Speed and +3 Accuracy.',combat:{speed:2,accuracy:3}},
 Orc:{passive:'Powerful Build',desc:'+5 Attack.',combat:{attack:5}},
 Celestial:{passive:'Luminous Anatomy',desc:'+3 Resolve, +3 Occult and 15% resistance to Horror effects.',combat:{resolve:3},util:{occult:3},horrorResist:.85}
};

const CULTURES={
 Veyric:{homeland:'The Veyric Marches',icon:'♜',passive:'Drilled Society',desc:'+2 Guard, +1 Resolve, +2 Talk.',combat:{guard:2,resolve:1},util:{talk:2}},
 Skeldic:{homeland:'The Skeld Coast',icon:'ᛉ',passive:'Raid-Born',desc:'+2 Attack, +1 Resolve, +3 Endure.',combat:{attack:2,resolve:1},util:{endure:3}},
 Hoshin:{homeland:'The Hoshin Provinces',icon:'✦',passive:'Discipline of Form',desc:'+2 Accuracy, +1 Speed, +2 Scout, +1 Sneak.',combat:{accuracy:2,speed:1},util:{scout:2,sneak:1}},
 Nambaran:{homeland:'The Redveld of Nambara',icon:'◈',passive:'Regimental Blood',desc:'+1 Guard, +2 Speed, +2 Endure, +1 Scout. Multiple Nambarans gain formation attack.',combat:{guard:1,speed:2},util:{endure:2,scout:1},formation:.05},
 Aethren:{homeland:'The Shattered Firmament',icon:'✧',passive:'Harmonic Doctrine',desc:'+2 Resolve, +2 Occult, +1 Accuracy. Excels against Horrors.',combat:{resolve:2,accuracy:1},util:{occult:2},horrorBonus:.15}
};

const CLASSES={
 Veyric:[
  {name:'Knight-Errant',role:'Guardian',primary:'defense',desc:'Sworn heavy fighter of the marcher nobility.',combat:{attack:2,guard:4,resolve:2},util:{talk:2},ability:'Hold Fast — reduces first-round damage to the party.'},
  {name:'Man-at-Arms',role:'Frontline',primary:'power',desc:'Professional infantry drilled for spear, shield and close work.',combat:{attack:3,guard:3,accuracy:1},util:{endure:1},ability:'Drilled — reliable attack and defense.'},
  {name:'Crossbowman',role:'Marksman',primary:'awareness',desc:'Guild-trained missile soldier.',combat:{attack:2,accuracy:5,guard:1},util:{scout:1},ability:'Armor Punch — opening attack partially ignores Guard.'},
  {name:'Houndmaster',role:'Controller',primary:'awareness',desc:'Handler of trackers and war hounds.',combat:{attack:2,speed:2,accuracy:2},util:{scout:4,endure:1,talk:1},ability:'Harriers — enemy Guard is reduced while the handler stands.'},
  {name:'March Ranger',role:'Scout',primary:'awareness',desc:'Border hunter and roadwarden.',combat:{attack:1,speed:2,accuracy:2},util:{sneak:2,scout:4,endure:1},ability:'Opening Shot — Scout success improves the first attack.'},
  {name:'Battle Chaplain',role:'Support',primary:'resolve',desc:'Field priest trained for morale and hostile dead.',combat:{guard:1,resolve:4},util:{talk:2,occult:3,endure:1},ability:'Last Rites — periodically restores an ally and helps against undead.'}
 ],
 Skeldic:[
  {name:'Shieldthane',role:'Guardian',primary:'defense',desc:'Heavy shield fighter sworn to a hold.',combat:{attack:1,guard:5,resolve:2},util:{endure:2},ability:'Shield Wall — reduces incoming party damage.'},
  {name:'Berserker',role:'Striker',primary:'power',desc:'Fury-driven axe fighter.',combat:{attack:5,guard:-1,speed:1},util:{endure:1},ability:'Blood Heat — deals more damage while badly hurt.'},
  {name:'Raider',role:'Skirmisher',primary:'speed',desc:'Fast coastal assault fighter.',combat:{attack:3,speed:3,accuracy:1},util:{sneak:2,scout:2,endure:1},ability:'Beach Rush — stronger opening attack with initiative.'},
  {name:'Skald',role:'Support',primary:'resolve',desc:'Saga-keeper and morale fighter.',combat:{attack:1,resolve:4},util:{talk:4,occult:1},ability:'War Song — stabilizes bloodied allies.'},
  {name:'Rune-Seer',role:'Mystic',primary:'awareness',desc:'Reader of graves, weather and old stone magic.',combat:{guard:1,accuracy:1,resolve:2},util:{occult:5,scout:1},ability:'Rune Ward — bonus defense against supernatural enemies.'}
 ],
 Hoshin:[
  {name:'Samurai',role:'Duelist',primary:'power',desc:'Sword-retainer of a Hoshin house.',combat:{attack:3,guard:2,accuracy:4,resolve:2},util:{talk:1},ability:'Perfect Cut — increased critical chance.'},
  {name:'Yumi Archer',role:'Marksman',primary:'awareness',desc:'Longbow specialist trained around timing and distance.',combat:{attack:2,speed:2,accuracy:5},util:{scout:3},ability:'First Volley — stronger first attack with initiative.'},
  {name:'Shinobi',role:'Infiltrator',primary:'speed',desc:'Scout, spy and saboteur.',combat:{attack:2,speed:4,accuracy:2},util:{sneak:5,scout:3,talk:1},ability:'Hidden Blade — Sneak success improves opening damage.'},
  {name:'Ashigaru',role:'Frontline',primary:'defense',desc:'Disciplined common infantry.',combat:{attack:2,guard:3,accuracy:2,resolve:1},util:{endure:2},ability:'Ranks — other Hoshin fighters improve cohesion.'},
  {name:'Spirit Scribe',role:'Mystic',primary:'awareness',desc:'Ritual scholar of names, omens and spirits.',combat:{guard:1,resolve:3},util:{occult:5,talk:1,scout:1},ability:'Binding Script — Occult success weakens supernatural enemies.'}
 ],
 Nambaran:[
  {name:'Spearwall',role:'Frontline',primary:'defense',desc:'Disciplined short-spear and shield fighter.',combat:{attack:2,guard:4,resolve:1},util:{endure:2},ability:'Close Ranks — gains protection beside another Nambaran.'},
  {name:'Horn Runner',role:'Skirmisher',primary:'speed',desc:'Flanking fighter trained to close an encirclement.',combat:{attack:2,speed:5,accuracy:1},util:{sneak:2,scout:3,endure:1},ability:'Encircle — exceptional initiative.'},
  {name:'Shield-Breaker',role:'Striker',primary:'power',desc:'Heavy assault fighter tasked with cracking fixed lines.',combat:{attack:5,guard:1,accuracy:1},util:{endure:2},ability:'Break the Line — attacks partially ignore Guard.'},
  {name:'War-Singer',role:'Support',primary:'resolve',desc:'Cadence-keeper coordinating nerve and movement.',combat:{attack:1,resolve:5},util:{talk:3,endure:1},ability:'Battle Rhythm — improves performance while bloodied.'},
  {name:'Bone-Seer',role:'Mystic',primary:'awareness',desc:'Reader of ancestors, wounds and battlefield omens.',combat:{guard:1,resolve:3},util:{occult:4,scout:2},ability:'Ancestor Sign — improves supernatural awareness.'}
 ],
 Aethren:[
  {name:'Lumen Guard',role:'Guardian',primary:'defense',desc:'Celestial line fighter carrying resonant shields.',combat:{guard:5,resolve:3},util:{occult:2},ability:'Radiant Screen — sharply reduces Horror opening pressure.'},
  {name:'Star-Spear',role:'Striker',primary:'power',desc:'Long-reach hunter of impossible anatomy.',combat:{attack:5,accuracy:2},util:{scout:2},ability:'Anatomy Break — bonus damage against Horrors.'},
  {name:'Choir Adept',role:'Support',primary:'resolve',desc:'Voice-trained harmonist who stabilizes minds.',combat:{resolve:6},util:{talk:2,occult:3},ability:'Harmonic Ward — restores Resolve and blunts fear.'},
  {name:'Veilwalker',role:'Scout',primary:'speed',desc:'Scout accustomed to broken geometry.',combat:{speed:5,accuracy:2},util:{sneak:4,scout:4,occult:2},ability:'Slip Angle — unusually hard for Horrors to hit.'},
  {name:'Pattern-Savant',role:'Mystic',primary:'awareness',desc:'Analyst of metaphysical structures.',combat:{accuracy:3,resolve:3},util:{occult:6,scout:2},ability:'Pattern Collapse — Occult success damages Horror defenses.'}
 ]
};

const BACKGROUNDS=[
 {name:'Peasant',util:{endure:1}},{name:'Miner',util:{endure:2,scout:1}},{name:'Poacher',util:{sneak:2,scout:2}},{name:'Rat Catcher',util:{sneak:2,endure:1}},
 {name:'Grave Digger',util:{occult:2,endure:1}},{name:'Hunter',util:{scout:3}},{name:'Deserter',combat:{attack:1},util:{sneak:1}},{name:'Village Guard',combat:{guard:1},util:{talk:1}},
 {name:'Failed Apprentice',util:{occult:2}},{name:'Laborer',util:{endure:2}},{name:'Charcoal Burner',util:{endure:1,scout:1}},{name:'Pit Fighter',combat:{attack:2}},
 {name:'Shepherd',util:{scout:2,talk:1}},{name:'Tanner',util:{endure:1,talk:1}}
];
const TRAITS={
 'Hard Worker':{desc:'+3 Endure and +3 HP recovered per recovery day.',util:{endure:3},heal:3},
 'Cowardly':{desc:'+2 Sneak, -3 Resolve.',util:{sneak:2},combat:{resolve:-3}},
 'Greedy':{desc:'+2 Talk; slightly increases loose silver recovered.',util:{talk:2},pay:.04},
 'Iron Stomach':{desc:'+4 Endure and reduced expedition attrition.',util:{endure:4},attrition:.65},
 'Bad Knee':{desc:'-3 Speed and -2 Sneak.',combat:{speed:-3},util:{sneak:-2}},
 'Quick Learner':{desc:'+25% contract XP.',xp:1.25},
 'Hot Temper':{desc:'+3 Attack, -2 Talk.',combat:{attack:3},util:{talk:-2}},
 'Night Eyes':{desc:'+3 Scout, +2 Sneak.',util:{scout:3,sneak:2}},
 'Steady Hands':{desc:'+3 Accuracy, +1 Scout.',combat:{accuracy:3},util:{scout:1}},
 'Superstitious':{desc:'+3 Occult, -2 Resolve.',util:{occult:3},combat:{resolve:-2}},
 'Kindhearted':{desc:'+4 Talk. Improves rescue and surrender events.',util:{talk:4},mercy:true},
 'Bloodthirsty':{desc:'+4 Attack, -2 Talk. Raises injury risk after bloody fights.',combat:{attack:4},util:{talk:-2},reckless:true},
 'Stubborn':{desc:'+3 Resolve, +2 Endure.',combat:{resolve:3},util:{endure:2}},
 'Lucky':{desc:'+5% critical chance and occasional field-check swing.',crit:.05,lucky:true},
 'Sickly':{desc:'-4 Endure and increased attrition/injury risk.',util:{endure:-4},attrition:1.25},
 'Tunnel Rat':{desc:'+4 Sneak, +2 Scout.',util:{sneak:4,scout:2}},
 'Streetwise':{desc:'+3 Talk, +2 Sneak.',util:{talk:3,sneak:2}},
 'Haunted':{desc:'+4 Occult, +1 Scout, -2 Resolve.',util:{occult:4,scout:1},combat:{resolve:-2}},
 'Vengeful':{desc:'+3 Attack against enemies tied to a friend’s death, -1 Talk.',combat:{attack:1},util:{talk:-1}}
};

const REGION_DEFS={
 veyric:{name:'The Veyric Marches',culture:'Veyric',start:{prosperity:46,stability:61,threat:38},common:'Goblin',desc:'Feudal roads, castle towns and dying border villages. The Graven March is one battered province.',hqName:'Greyhaven Chapterhouse',foundCost:0,renown:0,raceWeights:{Human:55,Dwarf:15,Elf:15,Orc:15},enemies:['Goblin','Bandit','Undead','Wolf']},
 skeld:{name:'The Skeld Coast',culture:'Skeldic',start:{prosperity:37,stability:48,threat:52},common:'Trollkin',desc:'Cold fjords, island holds and raiding roads where giant things move below the snow.',hqName:'Skeldhaven Hall',foundCost:600,renown:15,raceWeights:{Dwarf:50,Human:20,Orc:15,Elf:15},enemies:['Trollkin','Draugr','Beast','Raider']},
 hoshin:{name:'The Hoshin Provinces',culture:'Hoshin',start:{prosperity:58,stability:56,threat:45},common:'Spirit',desc:'Fortified provinces, cedar forests and old shrines whose boundaries are failing.',hqName:'Mizukane House',foundCost:900,renown:30,raceWeights:{Elf:50,Human:20,Dwarf:10,Orc:20},enemies:['Spirit','Corrupted Beast','Bandit Clan','Wraith']},
 nambara:{name:'The Redveld of Nambara',culture:'Nambaran',start:{prosperity:43,stability:53,threat:57},common:'Ogre',desc:'Red grasslands, fortress settlements and migration routes hunted by enormous predators.',hqName:'Red Shield Lodge',foundCost:1200,renown:45,raceWeights:{Orc:50,Human:20,Dwarf:15,Elf:15},enemies:['Ogre','Warband','Hyena Beast','Giant Predator']},
 firmament:{name:'The Shattered Firmament',culture:'Aethren',start:{prosperity:18,stability:21,threat:84},common:'Horror',desc:'A late-game frontier where geometry, flesh and weather no longer agree with themselves.',hqName:'Glass Bastion',foundCost:3000,renown:100,raceWeights:{Celestial:70,Human:8,Dwarf:7,Elf:8,Orc:7},enemies:['Horror','Horror','Horror','Void Wraith'],late:true}
};

const ENEMY_SPECIES={
 Goblin:{hp:.75,attack:.85,guard:.72,speed:1.15,accuracy:1.02,pack:.06,desc:'Goblins become more dangerous when they heavily outnumber a party.'},
 Bandit:{hp:1,attack:1,guard:1,speed:1,accuracy:1,desc:'Human raiders with no universal weakness.'},
 Undead:{hp:1.05,attack:.95,guard:1.08,speed:.72,accuracy:.9,supernatural:true,desc:'Unliving enemies ignore morale pressure.'},
 Wolf:{hp:.7,attack:.9,guard:.6,speed:1.35,accuracy:1.05,desc:'Fast predators that pressure injured targets.'},
 Trollkin:{hp:1.45,attack:1.15,guard:1.1,speed:.7,accuracy:.9,regen:.04,desc:'Trollkin regenerate every combat round.'},
 Draugr:{hp:1.15,attack:1.05,guard:1.15,speed:.75,accuracy:.9,supernatural:true,desc:'Ancient dead with heavy defenses.'},
 Beast:{hp:1.15,attack:1.1,guard:.85,speed:1.05,accuracy:.95,desc:'Large northern predators.'},
 Raider:{hp:1,attack:1.08,guard:.95,speed:1.05,accuracy:1,desc:'Aggressive coastal fighters.'},