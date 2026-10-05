(function(){
'use strict';

// ---- PARTY SIZE PROGRESSION -------------------------------------------------
hqDefs['Command Hall']={icon:'🚩',desc:'Raises maximum party size by 1 per level, from 4 up to 8.',base:95};
if(state.hq['Command Hall']==null)state.hq['Command Hall']=0;

function partyCap(){return Math.min(8,4+(state.hq['Command Hall']||0))}
window.blPartyCap=partyCap;

const oldPartyCardV3=partyCard;
partyCard=function(p){
 const members=p.members.map(id=>state.roster.find(r=>r.id===id)).filter(Boolean);
 let html=oldPartyCardV3(p);
 html=html.replace(`>${members.length}/4</span>`,`>${members.length}/${partyCap()}</span>`);
 return html;
};

editParty=function(pid){
 const p=state.parties.find(x=>x.id===pid);if(!p||p.expedition)return;
 const max=partyCap();
 modal(`<div class="sheetHead"><div><h3>${p.name}</h3><div class="small muted">Party capacity ${p.members.length}/${max}</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <p class="small muted">Choose up to ${max} ready adventurers. Upgrade the Command Hall to field larger parties.</p>
 ${state.roster.map(r=>{const elsewhere=state.parties.some(q=>q.id!==p.id&&q.members.includes(r.id)),checked=p.members.includes(r.id),canUse=checked||(!elsewhere&&r.status==='Ready');return `<div class="toggleRow"><div><b>${RACES[r.race]} ${r.name}</b><div class="tiny muted">Lv.${r.lvl} ${r.className||r.bg} • ${r.status}</div></div><button class="btn toggleMember" data-rid="${r.id}" ${canUse?'':'disabled'}>${checked?'Remove':'Add'}</button></div>`}).join('')||'<div class="empty">Hire somebody first.</div>'}`);
 document.querySelectorAll('.toggleMember').forEach(b=>b.onclick=()=>{const id=b.dataset.rid,i=p.members.indexOf(id);if(i>=0)p.members.splice(i,1);else if(p.members.length<max)p.members.push(id);else return toast(`Party capacity is ${max}.`);save();closeModal();render();editParty(pid)});
};

const oldUpgradeV3=upgrade;
upgrade=function(k){
 if(k==='Command Hall'&&(state.hq[k]||0)>=4)return toast('Command Hall is already at maximum: 8 adventurers per party.');
 return oldUpgradeV3(k);
};

const oldInfoHQV3=infoHQ;
infoHQ=function(k){
 if(k!=='Command Hall')return oldInfoHQV3(k);
 const lv=state.hq[k]||0;
 modal(`<div class="sheetHead"><h3>🚩 Command Hall</h3><button class="x" onclick="closeModal()">✕</button></div><p>Officers, maps, standards and logistics let a single party operate with more bodies without becoming a mob.</p><div class="card small">Current level: <b>${lv}/4</b><br>Maximum party size: <b class="gold">${partyCap()}</b><br>Each upgrade: <b>+1 party member</b><br>Maximum: <b>8 members</b></div>`);
};

// ---- EQUIPMENT --------------------------------------------------------------
const ITEM_RULES={
 'Worn Clothes':{slot:'armor',mods:{},desc:'No meaningful protection.'},
 'Wood Axe':{slot:'weapon',mods:{power:2},desc:'+2 Power'},
 'Hunting Bow':{slot:'weapon',mods:{power:1,awareness:2},desc:'+1 Power, +2 Awareness'},
 'Heavy Pick':{slot:'weapon',mods:{power:3,speed:-1},desc:'+3 Power, -1 Speed'},
 'Rusty Handaxe':{slot:'weapon',mods:{power:3},desc:'+3 Power'},
 'Goblin Knife':{slot:'weapon',mods:{power:1,speed:2},desc:'+1 Power, +2 Speed'},
 'Boar Spear':{slot:'weapon',mods:{power:2,awareness:1},desc:'+2 Power, +1 Awareness'},
 'Iron Mace':{slot:'weapon',mods:{power:4,speed:-1},desc:'+4 Power, -1 Speed'},
 'Notched Longsword':{slot:'weapon',mods:{power:4,awareness:1},desc:'+4 Power, +1 Awareness'},
 'Bone-handled Dagger':{slot:'weapon',mods:{power:2,speed:2},desc:'+2 Power, +2 Speed'},
 'Quilted Coat':{slot:'armor',mods:{defense:2},desc:'+2 Defense'},
 'Leather Jerkin':{slot:'armor',mods:{defense:2,speed:1},desc:'+2 Defense, +1 Speed'},
 'Iron Skullcap':{slot:'armor',mods:{defense:2,resolve:1},desc:'+2 Defense, +1 Resolve'},
 'Chain Scraps':{slot:'armor',mods:{defense:4,speed:-1},desc:'+4 Defense, -1 Speed'},
 'Round Shield':{slot:'armor',mods:{defense:4,speed:-1},desc:'+4 Defense, -1 Speed'},
 'Reinforced Boots':{slot:'armor',mods:{defense:1,speed:2},desc:'+1 Defense, +2 Speed'},
 'Brigandine Vest':{slot:'armor',mods:{defense:5,speed:-1},desc:'+5 Defense, -1 Speed'}
};
window.blItemRules=ITEM_RULES;

function zeroMods(){return{power:0,defense:0,speed:0,awareness:0,resolve:0}}
function modsForGear(r){
 const out=zeroMods();
 ['weapon','armor'].forEach(slot=>{const rule=ITEM_RULES[r.gear?.[slot]];if(rule)Object.entries(rule.mods||{}).forEach(([k,v])=>out[k]+=v)});
 return out;
}
function syncGearMods(r){
 if(!r||!r.stats)return;
 const old=r._equipModsV3||zeroMods(),next=modsForGear(r);
 Object.keys(next).forEach(k=>r.stats[k]=(r.stats[k]||0)-(old[k]||0)+(next[k]||0));
 r._equipModsV3=next;
}
function syncAllGear(){[...(state.roster||[]),...(state.recruits||[])].forEach(syncGearMods)}

function gearDesc(name){return ITEM_RULES[name]?.desc||'No documented combat modifier.'}
function countInventory(type){
 const out={};(state.inventory||[]).forEach(x=>{if(x.type===type)out[x.name]=(out[x.name]||0)+(x.qty||1)});return out;
}
function takeInventory(name,type){
 const i=state.inventory.findIndex(x=>x.name===name&&x.type===type);if(i<0)return false;
 const x=state.inventory[i],q=x.qty||1;if(q>1)x.qty=q-1;else state.inventory.splice(i,1);return true;
}
function giveInventory(name,type){
 if(!name)return;const x=state.inventory.find(x=>x.name===name&&x.type===type);if(x)x.qty=(x.qty||1)+1;else state.inventory.push({name,type,qty:1});
}
function equip(r,slot,name){
 const type=slot==='weapon'?'Weapon':'Armor',old=r.gear[slot];if(old===name)return;
 if(!takeInventory(name,type))return toast(`${name} is no longer in the Vault.`);
 giveInventory(old,type);r.gear[slot]=name;syncGearMods(r);save();toast(`${r.name} equipped ${name}.`);openEquipment(r.id);
}
function gearOption(name,count,slot,r){const rule=ITEM_RULES[name];return `<button class="card choice equipChoice" data-slot="${slot}" data-name="${name}"><div class="statline"><b>${name}</b><span>×${count}</span></div><div class="tiny muted">${rule?.desc||'No documented modifier.'}</div></button>`}
function openEquipment(id){
 const r=state.roster.find(x=>x.id===id);if(!r)return;syncGearMods(r);
 const weapons=countInventory('Weapon'),armor=countInventory('Armor');
 modal(`<div class="sheetHead"><div><h3>Equip ${r.name}</h3><div class="small muted">Equipment changes base stats immediately.</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="sectionTitle"><h3>Current Loadout</h3><span>Tap a replacement below</span></div>
 <div class="grid2"><div class="card"><div class="tiny muted">WEAPON</div><b>${r.gear.weapon}</b><div class="small gold">${gearDesc(r.gear.weapon)}</div></div><div class="card"><div class="tiny muted">ARMOR</div><b>${r.gear.armor}</b><div class="small gold">${gearDesc(r.gear.armor)}</div></div></div>
 <div class="sectionTitle"><h3>Weapons in Vault</h3><span>${Object.values(weapons).reduce((a,b)=>a+b,0)}</span></div><div class="list">${Object.keys(weapons).length?Object.entries(weapons).map(([n,c])=>gearOption(n,c,'weapon',r)).join(''):'<div class="empty">No spare weapons.</div>'}</div>
 <div class="sectionTitle"><h3>Armor in Vault</h3><span>${Object.values(armor).reduce((a,b)=>a+b,0)}</span></div><div class="list">${Object.keys(armor).length?Object.entries(armor).map(([n,c])=>gearOption(n,c,'armor',r)).join(''):'<div class="empty">No spare armor.</div>'}</div>
 <div class="actions"><button class="btn ghost" id="backToAdventurer">Back to Adventurer</button></div>`);
 document.querySelectorAll('.equipChoice').forEach(b=>b.onclick=()=>equip(r,b.dataset.slot,b.dataset.name));
 const back=document.getElementById('backToAdventurer');if(back)back.onclick=()=>inspectRecruit(r.id);
}
window.blOpenEquipment=openEquipment;

// Apply starting/previously-equipped gear exactly once without double-dipping on reload.
syncAllGear();

// Add equipment + progression to the existing detailed sheet without replacing the class/trait UI.
const oldInspectV3=inspectRecruit;
inspectRecruit=function(id){
 oldInspectV3(id);
 const r=state.roster.find(x=>x.id===id)||state.recruits.find(x=>x.id===id);if(!r)return;syncGearMods(r);
 const sheet=document.getElementById('sheet');if(!sheet)return;
 const rule=(window.blRules?.CLASS_POOLS?.[r.race]||[]).find(x=>x.name===r.className),primary=primaryStat(r),xpNext=r.xpNext||50;
 sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Level Progress</h3><span>${r.xp||0}/${xpNext} XP</span></div><div class="bar goldbar"><i style="width:${Math.min(100,(r.xp||0)/xpNext*100)}%"></i></div><div class="card small levelRules"><b>Every level makes this adventurer stronger.</b><br>+1 Power, Defense, Speed, Awareness and Resolve<br>+2 extra <b class="gold">${prettyStat(primary)}</b> for ${r.className||'their class'}<br>+5 maximum HP</div>
 <div class="sectionTitle"><h3>Equipment Management</h3><span>Vault gear is usable</span></div><div class="card equipmentSummary"><div><span class="tiny muted">WEAPON</span><b>${r.gear.weapon}</b><small>${gearDesc(r.gear.weapon)}</small></div><div><span class="tiny muted">ARMOR</span><b>${r.gear.armor}</b><small>${gearDesc(r.gear.armor)}</small></div></div>${state.roster.some(x=>x.id===r.id)?`<div class="actions"><button class="btn goldbtn" id="manageEquipment">Manage Equipment</button></div>`:''}`);
 const m=document.getElementById('manageEquipment');if(m)m.onclick=()=>openEquipment(r.id);
};

// Make equipment in the Vault visibly meaningful.
const oldRenderVaultV3=renderVault;
renderVault=function(){
 let html=oldRenderVaultV3();
 html=html.replace('<div class="sectionTitle"><h3>Inventory</h3>','<div class="sectionTitle"><h3>Inventory</h3>');
 return html;
};

// ---- VISIBLE LEVEL GROWTH ---------------------------------------------------
function primaryStat(r){
 const map={
  'Man-at-Arms':'power','Knight-Errant':'defense','March Ranger':'awareness','Battle Chaplain':'resolve',
  'Shieldthane':'defense','Berserker':'power','Skald':'resolve','Rune-Seer':'awareness',
  'Samurai':'power','Yumi Archer':'awareness','Shadow Scout':'speed','Spirit Scribe':'awareness',
  'Spearwall':'defense','Horn Runner':'speed','War-Singer':'resolve','Bone-Seer':'awareness'
 };
 return map[r.className]||'power';
}
function prettyStat(k){return({power:'Power',defense:'Defense',speed:'Speed',awareness:'Awareness',resolve:'Resolve'})[k]||k}

levelCheck=function(r){
 while(r.xp>=r.xpNext){
  r.xp-=r.xpNext;r.lvl++;r.xpNext=Math.floor(r.xpNext*1.35);
  ['power','defense','speed','awareness','resolve'].forEach(k=>r.stats[k]=(r.stats[k]||0)+1);
  const primary=primaryStat(r);r.stats[primary]+=2;
  r.maxHp+=5;r.hp=Math.min(r.maxHp,r.hp+12);
  state.log.push(`${r.name} reached Level ${r.lvl}: +1 all stats, +2 ${prettyStat(primary)}, +5 max HP.`);
 }
};

// ---- UI/QOL ----------------------------------------------------------------
const oldWireV3=wire;
wire=function(){
 oldWireV3();
 const hall=document.querySelector('.upgrade[data-up="Command Hall"]');if(hall&&(state.hq['Command Hall']||0)>=4){hall.disabled=true;hall.textContent='MAX • Party 8'}
 document.querySelectorAll('.inspect').forEach(el=>{const r=state.roster.find(x=>x.id===el.dataset.id);if(r)syncGearMods(r)});
};

const oldInfoRenderV3=render;
render=function(){syncAllGear();oldInfoRenderV3()};window.render=render;

const style=document.createElement('style');style.textContent=`
.equipmentSummary{display:grid;grid-template-columns:1fr 1fr;gap:7px}.equipmentSummary>div{display:flex;flex-direction:column;gap:3px}.equipmentSummary small{font-size:10px;color:#d3ad69}.levelRules{line-height:1.55}.equipChoice{width:100%;text-align:left}.equipChoice .statline{margin-top:0}.upgrade[data-up="Command Hall"]:disabled{opacity:.75}.partyCapNote{color:var(--gold)}
@media(max-width:390px){.equipmentSummary{grid-template-columns:1fr}}
`;document.head.appendChild(style);

state.version=Math.max(state.version||1,3);save();setTimeout(()=>render(),0);
})();
