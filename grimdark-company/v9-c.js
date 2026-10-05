  Shieldthane:'Skeldic',Berserker:'Skeldic',Raider:'Skeldic',Skald:'Skeldic','Rune-Seer':'Skeldic',Samurai:'Hoshin','Yumi Archer':'Hoshin',Shinobi:'Hoshin',Ashigaru:'Hoshin','Spirit Scribe':'Hoshin',
  Spearwall:'Nambaran','Horn Runner':'Nambaran','Shield-Breaker':'Nambaran','War-Singer':'Nambaran','Bone-Seer':'Nambaran'};
 s.roster=(old.roster||[]).map(r=>{
  const culture=classCulture[r.className]||legacyCulture[r.culture]||({Human:'Veyric',Dwarf:'Skeldic',Elf:'Hoshin',Orc:'Nambaran'}[r.race]||'Veyric');
  const cls=(CLASSES[culture]||CLASSES.Veyric).find(c=>c.name===r.className)||pick(CLASSES[culture]);
  const baseStats={power:r.stats?.power||12,defense:r.stats?.defense||12,speed:r.stats?.speed||12,awareness:r.stats?.awareness||12,resolve:r.stats?.resolve||12};
  return{id:r.id||uid('a'),name:r.name||`${pick(FIRST)} ${pick(LAST)}`,race:RACES[r.race]?r.race:'Human',culture,className:cls.name,background:r.bg||r.background||'Peasant',traits:(r.traits||[]).filter(t=>TRAITS[t]),lvl:r.lvl||1,xp:r.xp||0,hp:r.hp??100,maxHp:r.maxHp??100,stats:baseStats,wage:r.wage||3,status:r.status||'Ready',injury:r.injury||null,recovery:r.recovery||0,gear:{weapon:legacyGear(r.gear?.weapon,'weapon'),armor:legacyGear(r.gear?.armor,'armor'),charm:null},kills:r.kills||0,missions:r.missions||0,scars:r.scars||[],regionId:'veyric',history:[]};
 });
 if(old.hq){Object.keys(HQ_DEFS).forEach(k=>{if(old.hq[k]!=null)s.regions.veyric.hq.upgrades[k]=clamp(Number(old.hq[k])||0,0,HQ_DEFS[k].max)})}
 if(old.parties?.length){s.parties=old.parties.map((p,i)=>({id:p.id||uid('p'),regionId:'veyric',name:p.name||`Party ${i+1}`,members:(p.members||[]).filter(id=>s.roster.some(r=>r.id===id)),tactic:p.tactic||'Balanced',cohesion:0,captainId:null,missions:0,wins:0,deaths:0,expedition:null,specialty:null,enemyWins:{}}))}
 if(!s.parties.length)s.parties=[makeParty('veyric','Ash Dogs')];
 if(old.artifacts)s.artifacts=old.artifacts.map(a=>({id:a.id||uid('art'),name:a.name||'Unknown Artifact',desc:a.desc||'',cost:a.cost||'',regionId:'veyric'}));
 if(old.inventory){old.inventory.forEach(x=>{if(x.type==='Weapon'||x.type==='Armor')s.inventory.push({item:legacyGear(x.name,x.type==='Weapon'?'weapon':'armor'),qty:x.qty||1,regionId:'veyric'});else s.inventory.push({item:{id:uid('mat'),name:x.name,type:'material',rarity:0,mods:[],baseValue:4},qty:x.qty||1,regionId:'veyric'})})}
 const threatVals=old.threats?Object.values(old.threats).map(Number).filter(Number.isFinite):[];if(threatVals.length)s.regions.veyric.threat=Math.round(threatVals.reduce((a,b)=>a+b,0)/threatVals.length);
 refreshRegion('veyric',true,s);
 return s;
}
function legacyGear(name,slot){if(!name||name==='Worn Clothes'||name==='Wood Axe')return null;return{id:uid('i'),name,slot,rarity:-1,mods:[],baseValue:8}}
async function loadState(){
 let raw=safeLocalGet(SAVE_KEY);if(!raw)raw=await idbGet();
 if(raw){try{return normalizeState(JSON.parse(raw))}catch(e){}}
 let legacy=safeLocalGet(LEGACY_KEY);if(!legacy){try{legacy=await idbGet(LEGACY_KEY,'brokenLanternMobile')}catch(e){}}
 if(legacy){try{return migrateLegacy(JSON.parse(legacy))}catch(e){}}
 return null;
}
function normalizeState(s){
 if(!s||typeof s!=='object')return null;
 if((s.version||0)<VERSION&&s.company&&s.regions){s.version=VERSION}
 s.settings=Object.assign({music:true,sfx:true,musicVolume:.8,sfxVolume:.9},s.settings||{});s.ui=Object.assign({tab:'hq'},s.ui||{});s.relationships=s.relationships||{};s.history=s.history||[];s.nemeses=s.nemeses||[];s.inventory=s.inventory||[];s.caches=s.caches||[];s.artifacts=s.artifacts||[];
 REGION_ORDER.forEach(id=>{if(!s.regions[id])s.regions[id]=makeRegion(id);const r=s.regions[id];r.hq=r.hq||{established:id==='veyric',name:REGION_DEFS[id].hqName,upgrades:freshUpgrades()};r.hq.upgrades=Object.assign(freshUpgrades(),r.hq.upgrades||{});r.market=r.market||{stock:[],nextRefresh:1};r.recruits=r.recruits||[];r.contracts=r.contracts||[];r.log=r.log||[]});
 s.roster=(s.roster||[]).map(a=>{a.gear=Object.assign({weapon:null,armor:null,charm:null},a.gear||{});a.regionId=a.regionId||'veyric';a.history=a.history||[];return a});s.parties=(s.parties||[]).map(p=>Object.assign({regionId:'veyric',tactic:'Balanced',cohesion:0,captainId:null,missions:0,wins:0,deaths:0,specialty:null,enemyWins:{},expedition:null},p));return s;
}

function hasArtifact(name,regionId=state.currentRegion){return state.artifacts.some(a=>a.name===name&&a.regionId===regionId)}
function region(){return state.regions[state.currentRegion]}
function regionDef(id=state.currentRegion){return REGION_DEFS[id]}
function hq(id=state.currentRegion){return state.regions[id].hq}
function localRoster(id=state.currentRegion){return state.roster.filter(a=>a.regionId===id&&a.status!=='Dead')}
function localParties(id=state.currentRegion){return state.parties.filter(p=>p.regionId===id)}
function rosterCap(id=state.currentRegion){return 8+(hq(id).upgrades.Barracks||0)*6}
function partyCap(id=state.currentRegion){return 4+(hq(id).upgrades['Command Hall']||0)}
function classRule(a){return (CLASSES[a.culture]||CLASSES.Veyric).find(c=>c.name===a.className)||CLASSES.Veyric[0]}
function backgroundRule(a){return BACKGROUNDS.find(b=>b.name===a.background)||BACKGROUNDS[0]}
function add(obj,src){if(!src)return;Object.entries(src).forEach(([k,v])=>obj[k]=(obj[k]||0)+v)}
function gearItems(a){return Object.values(a.gear||{}).filter(Boolean)}
function applyItem(item,out,util,special){if(!item)return;(item.mods||[]).forEach(m=>{if(m.effect)add(out,m.effect);if(m.util)util[m.util]=(util[m.util]||0)+m.value;if(m.maxHp)special.maxHp+=m.value;if(m.special)special[m.special]=(special[m.special]||0)+m.value;if(m.enemy)special.enemy[m.enemy]=(special.enemy[m.enemy]||0)+m.value})}
function derived(a){
 const race=RACES[a.race]||RACES.Human,cul=CULTURES[a.culture]||CULTURES.Veyric,cls=classRule(a),bg=backgroundRule(a),traits=(a.traits||[]).map(t=>TRAITS[t]).filter(Boolean);
 const combat={attack:a.stats.power,guard:a.stats.defense,speed:a.stats.speed,accuracy:Math.round((a.stats.awareness+a.stats.speed)/2),resolve:a.stats.resolve};
 const util={talk:Math.round(a.stats.resolve*.42+a.stats.awareness*.18),sneak:Math.round(a.stats.speed*.42+a.stats.awareness*.25),scout:Math.round(a.stats.awareness*.52+a.stats.speed*.18),endure:Math.round(a.stats.defense*.42+a.stats.resolve*.28),occult:Math.round(a.stats.awareness*.34+a.stats.resolve*.26)};
 const special={maxHp:0,opening:0,injuryResist:0,loot:0,enemy:{},crit:0,xp:race.xp||1,attrition:race.attrition||1,pay:0};
 add(combat,race.base);add(combat,race.combat);add(util,race.util);add(combat,cul.combat);add(util,cul.util);add(combat,cls.combat);add(util,cls.util);add(combat,bg.combat);add(util,bg.util);
 traits.forEach(t=>{add(combat,t.combat);add(util,t.util);special.xp*=t.xp||1;special.attrition*=t.attrition||1;special.pay+=t.pay||0;special.crit+=t.crit||0});gearItems(a).forEach(i=>applyItem(i,combat,util,special));
 Object.keys(util).forEach(k=>util[k]=Math.max(0,Math.round(util[k])));Object.keys(combat).forEach(k=>combat[k]=Math.max(1,Math.round(combat[k])));return{combat,util,special,cls,race,cul,bg,traits,maxHp:(a.maxHp||100)+special.maxHp};
}
function traitDesc(t){return TRAITS[t]?.desc||'No documented effect.'}
function relKey(a,b){return[a,b].sort().join('|')}
function relValue(a,b){return state.relationships[relKey(a,b)]||0}
function setRel(a,b,v){state.relationships[relKey(a,b)]=clamp(Math.round(v),-100,100)}
function relLabel(v){if(v>=80)return'Bonded';if(v>=55)return'Close Friends';if(v>=25)return'Friends';if(v<=-55)return'Enemies';if(v<=-25)return'Rivals';return'Acquaintances'}

function weightedRace(weights){const entries=Object.entries(weights);let n=Math.random()*entries.reduce((s,x)=>s+x[1],0);for(const[e,w]of entries){n-=w;if(n<=0)return e}return entries[0][0]}
function chooseCulture(regionId,race){const local=REGION_DEFS[regionId].culture;const affinity={Human:'Veyric',Dwarf:'Skeldic',Elf:'Hoshin',Orc:'Nambaran',Celestial:'Aethren'}[race]||local;if(local===affinity)return chance(.86)?local:pick(Object.keys(CULTURES).filter(x=>x!==local));if(chance(.72))return local;if(chance(.7))return affinity;return pick(Object.keys(CULTURES).filter(x=>x!==local&&x!==affinity))}
function generateAdventurer(regionId){
 const r=state.regions[regionId],d=REGION_DEFS[regionId],race=weightedRace(d.raceWeights),culture=chooseCulture(regionId,race),cls=pick(CLASSES[culture]),bg=pick(BACKGROUNDS);let lvl=1;
 const stability=r.stability,renown=state.company.renown;const eliteChance=clamp((stability-45)/180+renown/600,0,.28);if(chance(eliteChance))lvl=2;if(lvl===2&&chance(eliteChance*.45))lvl=3;if(lvl===3&&chance(eliteChance*.2))lvl=4;
 const stats={power:rnd(9,15),defense:rnd(9,15),speed:rnd(9,15),awareness:rnd(9,15),resolve:rnd(9,15)};const a={id:uid('a'),name:`${pick(FIRST)} ${pick(LAST)}`,race,culture,className:cls.name,background:bg.name,traits:[],lvl:1,xp:0,stats,hp:100,maxHp:100,wage:3,status:'Ready',injury:null,recovery:0,gear:{weapon:null,armor:null,charm:null},kills:0,missions:0,scars:[],regionId,history:[]};
 const negChance=clamp((55-stability)/100,0,.35);const pool=Object.keys(TRAITS);a.traits.push(pick(pool));if(chance(.55))a.traits.push(pick(pool.filter(t=>!a.traits.includes(t))));if(chance(negChance)&&!a.traits.some(t=>['Bad Knee','Sickly','Cowardly','Haunted'].includes(t)))a.traits.push(pick(['Bad Knee','Sickly','Cowardly','Haunted']));
 while(a.lvl<lvl)levelUp(a,false);a.wage=Math.max(2,Math.ceil((4+a.lvl*2+(culture===d.culture?0:1))*(1+(100-stability)/180)));a.hp=a.maxHp;return a;
}
function xpNeed(lvl){return 45+lvl*35}
function grantXP(a,amount){const mult=derived(a).special.xp;a.xp+=Math.round(amount*mult);let leveled=false;while(a.xp>=xpNeed(a.lvl)){a.xp-=xpNeed(a.lvl);levelUp(a,true);leveled=true}return leveled}
function levelUp(a,announce=true){a.lvl++;const p=classRule(a).primary;Object.keys(a.stats).forEach(k=>a.stats[k]+=1);a.stats[p]+=2;a.maxHp+=5;a.hp=Math.min(a.maxHp,a.hp+12);if(announce){pushHistory(`${a.name} reached Level ${a.lvl}.`,a.regionId);sfx('level')}}

function itemRarityFrom(regionId,risk=1,market=false){const r=state.regions[regionId];let score=risk*8+(market?r.prosperity*.35:0)+(hq(regionId).upgrades.Armory||0)*4+rnd(0,45);if(score>88)return 4;if(score>70)return 3;if(score>52)return 2;if(score>31)return 1;return 0}
function generateItem(regionId,rarity=null){const culture=REGION_DEFS[regionId].culture,base=pick(ITEM_BASES[culture]),ri=rarity==null?itemRarityFrom(regionId,1,true):clamp(rarity,0,4);const mods=[],pool=[...MODIFIERS];for(let i=0;i<ri+1;i++){const m=pool.splice(rnd(0,pool.length-1),1)[0];const value=m.scale[ri];mods.push({id:m.id,label:m.label(value),value,effect:m.effect?m.effect(value):null,util:m.util||null,maxHp:!!m.maxHp,special:m.special||null,enemy:m.enemy||null})}const prefix=['','Fine','Masterwork','Exalted','Mythic'][ri];return{id:uid('i'),name:`${prefix?prefix+' ':''}${base[0]}`,slot:base[1],rarity:ri,mods,baseValue:Math.round(base[2]*RARITY_MULT[ri])}}
function itemPower(item){return(item.mods||[]).reduce((s,m)=>s+Math.abs(m.value||0),0)}
function itemPrice(item,regionId){const r=state.regions[regionId],stores=hq(regionId).upgrades.Stores||0;const scarcity=1.38-r.prosperity*.0045;return Math.max(2,Math.round(item.baseValue*scarcity*(1-stores*.04)))}
function inventoryEntry(item,regionId,qty=1){const e=state.inventory.find(x=>x.regionId===regionId&&x.item.id===item.id);if(e)e.qty+=qty;else state.inventory.push({item,regionId,qty})}
function removeInventoryItem(itemId,regionId){const e=state.inventory.find(x=>x.regionId===regionId&&x.item.id===itemId);if(!e)return null;e.qty--;const item=e.item;if(e.qty<=0)state.inventory=state.inventory.filter(x=>x!==e);return item}
