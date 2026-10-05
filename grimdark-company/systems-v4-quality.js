(function(){
'use strict';

// QUALITY PASS: make time, recovery, HQ upgrades, artifacts and tactical choices concrete.
const MAX_HQ={Barracks:5,Infirmary:5,Armory:5,'Contract Office':5,Stores:5,'Training Yard':5,'Occult Archive':5,'Artifact Vault':1,'Command Hall':4};
const hasArtifact=n=>(state.artifacts||[]).some(a=>a.name===n);
const recovering=()=>state.roster.filter(r=>r.status==='Recovering'&&r.recovery>0);
const activeExpeditions=()=>state.parties.filter(p=>p.expedition);

Object.assign(hqDefs,{
 Barracks:{...hqDefs.Barracks,desc:'Adds 4 roster spaces per level. More bunks mean more adventurers can be employed.'},
 Infirmary:{...hqDefs.Infirmary,desc:'Improves HP healed each day, shortens serious injuries, and lowers death risk after failed contracts.'},
 Armory:{...hqDefs.Armory,desc:'Adds a growing chance for successful contracts to yield an extra weapon or armor piece; higher levels favor better gear.'},
 'Contract Office':{...hqDefs['Contract Office'],desc:'Adds 1 contract slot per level, improves posted rewards, and adds +5% final contract pay per level.'},
 Stores:{...hqDefs.Stores,desc:'Quartermasters cut weekly company upkeep by 5% per level.'},
 'Training Yard':{...hqDefs['Training Yard'],desc:'Ready adventurers gain 2 XP per level every game day.'},
 'Occult Archive':{...hqDefs['Occult Archive'],desc:'Reveals 1 contract unknown per level and increases artifact discovery chances.'},
 'Artifact Vault':{...hqDefs['Artifact Vault'],desc:'One-time upgrade that removes the company’s 2-artifact safety limit.'}
});

// Correct any old trait text that promised effects the simulation did not actually execute.
if(window.blRules?.TRAIT_RULES){
 const T=window.blRules.TRAIT_RULES;
 if(T['Hard Worker'])T['Hard Worker'].desc='+3 Endure and +3 HP recovered each game day while injured.';
 if(T['Bloodthirsty'])T['Bloodthirsty'].desc='+4 Attack, -2 Talk. Excellent once violence starts; abrasive before it does.';
 if(T['Lucky'])T['Lucky'].desc='+5% critical chance and occasional +4 swing on field checks.';
}

// Make artifact text match concrete mechanics implemented below.
const art=(state.artifacts||[]);
const pool=typeof artifactPool!=='undefined'?artifactPool:[];
[...pool,...art].forEach(a=>{
 if(a.name==='The Mourning Bell'){
  a.desc='Once per failed expedition, the first adventurer who would die is dragged back at 1 HP.';
  a.cost='When it saves someone, every surviving member of that party permanently loses 1 Resolve.';
 }
 if(a.name==="The King’s Second Face"){
  a.desc='Successful contracts pay 35% more.';
  a.cost='Weekly wages and company upkeep cost 10% more while it is owned.';
 }
 if(a.name==='Saint Veyra’s Nail'){
  a.desc='Undead encounters suffer -20% Attack and -15% Guard against your party.';
  a.cost='Survivors of undead contracts have a small chance to become Haunted.';
 }
});

// ---- TIME / RECOVERY --------------------------------------------------------
function recoveryHealPerDay(r){return 10+(state.hq.Infirmary||0)*4+((r.traits||[]).includes('Hard Worker')?3:0)}
function processRecoveryDay(){
 const healed=[];
 state.roster.forEach(r=>{
  if(r.status!=='Recovering'||!r.recovery)return;
  const before=r.recovery,hpBefore=r.hp;
  r.recovery=Math.max(0,r.recovery-1);
  r.hp=Math.min(r.maxHp,r.hp+recoveryHealPerDay(r));
  if(r.recovery===0){r.status='Ready';r.injury=null;state.log.push(`${r.name} finished recovery and returned to duty.`)}
  healed.push({name:r.name,before,after:r.recovery,hp:r.hp-hpBefore});
 });
 return healed;
}

advanceDay=function(reason='A day passes.'){
 state.day++;
 const healed=processRecoveryDay();
 state._lastRecoveryDay=state.day; // prevents the legacy render hook from double-healing
 Object.keys(state.threats).forEach(k=>state.threats[k]=clamp(state.threats[k]+rnd(1,4),0,100));
 if(state.day%7===0){
  const base=state.roster.filter(r=>r.status!=='Dead').reduce((s,r)=>s+r.wage,0);
  const stores=Math.min(.25,(state.hq.Stores||0)*.05);
  const face=hasArtifact("The King’s Second Face")?1.10:1;
  const wages=Math.max(0,Math.ceil(base*(1-stores)*face));
  state.silver-=wages;state.log.push(`Weekly upkeep paid: ${wages}s${stores?` (${Math.round(stores*100)}% Stores reduction)`:''}.`);
  if(state.silver<0){state.renown=Math.max(0,state.renown-2);state.log.push('The treasury is empty. People are talking.')}
 }
 state.contracts=state.contracts.filter(c=>c.expires>=state.day);
 const count=5+(state.hq['Contract Office']||0);
 while(state.contracts.length<count)state.contracts.push(contractGen());
 state.recruits=Array.from({length:6+(state.renown>15?2:0)},recruitGen);
 if(state.hq['Training Yard'])state.roster.filter(r=>r.status==='Ready').forEach(r=>{r.xp+=2*state.hq['Training Yard'];levelCheck(r)});
 state.log.push(`Day ${state.day} — ${reason}${healed.length?` ${healed.length} adventurer${healed.length===1?'':'s'} recovered.`:''}`);
 save();
 return healed;
};

// Legacy render calls this; recovery is now processed explicitly by advanceDay.
tickRecoveries=function(){state._lastRecoveryDay=state.day};

function restCompany(){
 if(activeExpeditions().length)return toast('Parties are still in the field. Resolve them before resting the company.');
 const before=recovering().map(r=>({id:r.id,recovery:r.recovery,hp:r.hp}));
 const healed=advanceDay('The company stands down, repairs gear and tends wounds.');
 qfx('rest');render();
 if(!before.length)toast('A quiet day passes. Threats still grow outside Greyhaven.');
 else toast(`${healed.length} recovering adventurer${healed.length===1?'':'s'} advanced by 1 day.`);
}
window.blRestCompany=restCompany;

function treatAdventurer(id){
 const r=state.roster.find(x=>x.id===id);if(!r||r.status!=='Recovering')return;
 if((state.medicine||0)<1)return toast('No medicine. Buy supplies at HQ.');
 state.medicine--;r.recovery=Math.max(0,r.recovery-1);r.hp=Math.min(r.maxHp,r.hp+20+(state.hq.Infirmary||0)*5);
 if(r.recovery===0){r.status='Ready';r.injury=null;state.log.push(`${r.name} returned to duty after treatment.`)}
 else state.log.push(`${r.name} received treatment. ${r.recovery} day(s) remain.`);
 save();qfx('heal');inspectRecruit(r.id);
}
function buyMedicine(){if(state.silver<8)return toast('Need 8 silver.');state.silver-=8;state.medicine=(state.medicine||0)+1;save();qfx('coin');render();toast('Bought 1 medicine.')}

// ---- HQ FACILITY AUDIT ------------------------------------------------------
const oldUpgradeV4=upgrade;
upgrade=function(k){
 const max=MAX_HQ[k];if(max!=null&&(state.hq[k]||0)>=max)return toast(`${k} is already at maximum.`);
 const before=state.hq[k]||0;oldUpgradeV4(k);
 if((state.hq[k]||0)>before)qfx('upgrade');
};

infoHQ=function(k){
 const lv=state.hq[k]||0,max=MAX_HQ[k]??'∞';let effect='';
 if(k==='Barracks')effect=`Roster capacity: ${cap()} • each level adds 4.`;
 if(k==='Infirmary')effect=`Healing: ${10+lv*4} HP per recovery day • failed-contract death risk reduced ${Math.min(60,lv*12)}% • high levels further shorten serious injuries.`;
 if(k==='Armory')effect=`Extra gear chance after a successful contract: ${Math.min(75,lv*15)}% • higher levels bias the bonus toward stronger equipment.`;
 if(k==='Contract Office')effect=`Contract slots: ${5+lv} • final pay bonus: +${lv*5}% • posted rewards also improve.`;
 if(k==='Stores')effect=`Weekly upkeep reduction: ${Math.min(25,lv*5)}%.`;
 if(k==='Training Yard')effect=`Ready adventurers gain ${lv*2} XP every game day.`;
 if(k==='Occult Archive')effect=`Reveals ${lv} contract unknown(s) • artifact discovery receives its existing level-based bonus.`;
 if(k==='Artifact Vault')effect=lv?'Artifact safety limit removed. Facility complete.':'Without it, only 2 artifacts can be safely retained.';
 if(k==='Command Hall')effect=`Maximum party size: ${window.blPartyCap?blPartyCap():4}. Each level adds 1, up to 8.`;
 modal(`<div class="sheetHead"><h3>${hqDefs[k]?.icon||'🏚️'} ${k}</h3><button class="x" onclick="closeModal()">✕</button></div><p>${hqDefs[k]?.desc||''}</p><div class="card small"><b>Current level:</b> ${lv}/${max}<br><span class="gold">${effect}</span></div>`)
};

function facilityCodex(){
 const order=['Barracks','Infirmary','Armory','Contract Office','Stores','Training Yard','Occult Archive','Artifact Vault','Command Hall'];
 modal(`<div class="sheetHead"><div><h3>Facility Effects</h3><div class="small muted">No decorative upgrades. Every facility changes a live system.</div></div><button class="x" onclick="closeModal()">✕</button></div>${order.filter(k=>hqDefs[k]).map(k=>`<button class="card choice facilityInfo" data-fac="${k}"><div class="statline"><b>${hqDefs[k].icon} ${k}</b><span>Lv.${state.hq[k]||0}/${MAX_HQ[k]??'∞'}</span></div><div class="small muted">${hqDefs[k].desc}</div></button>`).join('')}`);
 document.querySelectorAll('.facilityInfo').forEach(b=>b.onclick=()=>infoHQ(b.dataset.fac));
}

// ---- TACTICAL CHOICE --------------------------------------------------------
(state.parties||[]).forEach(p=>p.tactic=p.tactic||'Balanced');
const TACTICS={
 Cautious:{desc:'-pressure: enemy Attack -18%, enemy Guard +10%. Safer, slower kills.'},
 Balanced:{desc:'No modifier. Standard doctrine.'},
 Aggressive:{desc:'+pressure: enemy Guard -14%, enemy Attack +12%. Faster, bloodier fights.'}
};
function setTactic(pid,t){const p=state.parties.find(x=>x.id===pid);if(!p||p.expedition||!TACTICS[t])return;p.tactic=t;save();qfx('tactic');render()}
const oldPartyCardV4=partyCard;
partyCard=function(p){p.tactic=p.tactic||'Balanced';let html=oldPartyCardV4(p);const row=`<div class="tacticStrip"><span class="tiny muted">TACTIC</span>${Object.keys(TACTICS).map(t=>`<button class="tacticBtn ${p.tactic===t?'selected':''}" data-party="${p.id}" data-tactic="${t}" ${p.expedition?'disabled':''}>${t}</button>`).join('')}</div>`;return html.replace('<div class="actions">',row+'<div class="actions">')};

const oldStartCombatV4=startCombat;
startCombat=function(p){
 p.tactic=p.tactic||'Balanced';oldStartCombatV4(p);const b=p.expedition?.battle;if(!b)return;
 if(p.tactic==='Cautious'){b.enemyProfile.attack*=.82;b.enemyProfile.guard*=1.10;p.expedition.events.push('TACTIC — Cautious formation. Incoming pressure drops, but enemies are harder to break.')}
 if(p.tactic==='Aggressive'){b.enemyProfile.attack*=1.12;b.enemyProfile.guard*=.86;p.expedition.events.push('TACTIC — Aggressive push. The party hits harder openings but accepts more danger.')}
 const undead=/Zombie|Ghoul|Skeleton|Wight|undead|grave/i.test((p.expedition.contract.enemies||[]).join(' ')+' '+p.expedition.contract.title);
 if(undead&&hasArtifact('Saint Veyra’s Nail')){b.enemyProfile.attack*=.80;b.enemyProfile.guard*=.85;p.expedition._veyra=true;p.expedition.events.push('RELIC — Saint Veyra’s Nail burns cold. The undead recoil.')}
 const ms=p.members.map(id=>state.roster.find(r=>r.id===id)).filter(Boolean);
 if(undead&&ms.some(r=>r.className==='Rune-Seer')){b.enemyProfile.attack*=.90;p.expedition.events.push('CLASS — A Rune-Seer raises a ward against the dead.')}
 if(undead&&ms.some(r=>r.className==='Battle Chaplain')){b.enemyProfile.attack*=.95;p.expedition.events.push('CLASS — Last rites steady the line against the dead.')}
 render();
};

// Infirmary levels 3–5 continue shortening newly inflicted serious injuries.
const oldResolveCombatV4=resolveCombat;
resolveCombat=function(p,win){
 const before=new Map(p.members.map(id=>{const r=state.roster.find(x=>x.id===id);return [id,r?{status:r.status,recovery:r.recovery}:null]}));
 oldResolveCombatV4(p,win);
 const lv=state.hq.Infirmary||0,extra=Math.max(0,lv-2);
 if(extra){p.members.forEach(id=>{const r=state.roster.find(x=>x.id===id),old=before.get(id);if(r&&r.status==='Recovering'&&old?.status!=='Recovering')r.recovery=Math.max(1,r.recovery-extra)})}
};

// ---- ARMORY + ARTIFACTS + MATERIALS ----------------------------------------
function addInventory(name,type,qty=1){const x=state.inventory.find(i=>i.name===name&&i.type===type);if(x)x.qty=(x.qty||1)+qty;else state.inventory.push({name,type,qty})}
const gearQuality={
 'Rusty Handaxe':1,'Goblin Knife':1,'Wood Axe':1,'Hunting Bow':2,'Heavy Pick':2,'Boar Spear':2,'Iron Mace':3,'Bone-handled Dagger':3,'Notched Longsword':4,
 'Worn Clothes':0,'Quilted Coat':1,'Leather Jerkin':2,'Iron Skullcap':2,'Chain Scraps':3,'Round Shield':3,'Reinforced Boots':3,'Brigandine Vest':4
};
function armoryGear(lv){let pool=[...weaponLoot,...armorLoot];const floor=Math.max(1,Math.min(4,Math.ceil(lv/2)));let better=pool.filter(n=>(gearQuality[n]||1)>=floor);if(!better.length)better=pool;return pick(better)}

const oldFinishV4=finishExpedition;
finishExpedition=function(p){
 const exp=p.expedition,contract=exp?.contract,memberIds=[...(p.members||[])],wasUndead=!!exp?._veyra;
 oldFinishV4(p);
 if(!state.lastReport)return;
 // King's Second Face: actual payout effect.
 if(state.lastReport.success&&hasArtifact("The King’s Second Face")){
  const extra=Math.floor((state.lastReport.pay||0)*.35);if(extra>0){state.silver+=extra;state.lastReport.pay+=extra;state.lastReport.faceBonus=extra;state.log.push(`The King’s Second Face extracted an additional ${extra}s.`)}
 }
 // Armory: every level has an actual extra-gear chance.
 const arm=state.hq.Armory||0;
 if(state.lastReport.success&&arm&&Math.random()<Math.min(.75,arm*.15)){
  const g=armoryGear(arm),type=weaponLoot.includes(g)?'Weapon':'Armor';addInventory(g,type,1);state.lastReport.armoryBonus=g;state.log.push(`Armory contacts secured bonus gear: ${g}.`)
 }
 // Mourning Bell: revive the first newly dead member once per failed expedition.
 if(!state.lastReport.success&&hasArtifact('The Mourning Bell')&&state.lastReport.deaths?.length){
  const name=state.lastReport.deaths[0],r=state.roster.find(x=>x.name===name&&x.status==='Dead');
  if(r){r.status='Recovering';r.hp=1;r.recovery=Math.max(4,6-(state.hq.Infirmary||0));r.injury='Bell-Touched';if(!p.members.includes(r.id))p.members.push(r.id);state.lastReport.deaths=state.lastReport.deaths.filter(n=>n!==name);state.lastReport.bellSaved=name;memberIds.map(id=>state.roster.find(x=>x.id===id)).filter(x=>x&&x.status!=='Dead').forEach(x=>x.stats.resolve=Math.max(1,x.stats.resolve-1));state.log.push(`THE MOURNING BELL — ${name} stood back up. The survivors lost 1 Resolve.`)}
 }
 // Saint Veyra's Nail cost.
 if(wasUndead&&state.lastReport.success&&hasArtifact('Saint Veyra’s Nail')){
  memberIds.map(id=>state.roster.find(x=>x.id===id)).filter(x=>x&&x.status!=='Dead').forEach(r=>{if(Math.random()<.10&&!(r.traits||[]).includes('Haunted')){r.traits.push('Haunted');state.log.push(`${r.name} returned from the undead hunt Haunted.`)}})
 }
 save();
 // Patch the already-open mission report so bonuses are visible immediately.
 const sheet=document.getElementById('sheet');if(sheet&&document.getElementById('modal')?.classList.contains('show')){
  let extras='';if(state.lastReport.faceBonus)extras+=`<div class="card good"><b>Second Face:</b> +${state.lastReport.faceBonus}s</div>`;if(state.lastReport.armoryBonus)extras+=`<div class="card good"><b>Armory bonus:</b> ${state.lastReport.armoryBonus}</div>`;if(state.lastReport.bellSaved)extras+=`<div class="card danger"><b>Mourning Bell:</b> ${state.lastReport.bellSaved} returned at 1 HP.</div>`;if(extras)sheet.insertAdjacentHTML('beforeend',extras)
 }
};

function sellMaterials(){
 const mats=state.inventory.filter(x=>x.type==='Material');if(!mats.length)return toast('No materials to sell.');
 let total=0;mats.forEach(x=>{const q=x.qty||1;total+=q*(x.name==='Ogre Knuckle'?6:x.name==='Silver Candlestick'?7:x.name==='Spider Silk'?5:3)});state.inventory=state.inventory.filter(x=>x.type!=='Material');state.silver+=total;state.log.push(`Sold monster parts and salvage for ${total}s.`);save();qfx('coin');render();toast(`Sold materials for ${total}s.`)
}

const oldRenderVaultV4=renderVault;
renderVault=function(){let html=oldRenderVaultV4();const count=state.inventory.filter(x=>x.type==='Material').reduce((s,x)=>s+(x.qty||1),0);if(count)html=html.replace('<div class="sectionTitle"><h3>Inventory</h3>',`<div class="sectionTitle"><h3>Inventory</h3><button class="btn ghost" id="sellMaterials">Sell Materials (${count})</button>`);return html};

// ---- VISUAL / MOMENT-TO-MOMENT UI -----------------------------------------
const oldRenderHQV4=renderHQ;
renderHQ=function(){
 let html=oldRenderHQV4();const rec=recovering(),heal=10+(state.hq.Infirmary||0)*4,active=activeExpeditions().length;
 const recovery=`<div class="recoveryPanel"><div class="statline"><div><div class="kicker">TIME & RECOVERY</div><b>Day ${state.day}</b></div><button class="btn ghost facilityCodex">Facilities ⓘ</button></div><div class="small muted">A game day passes when a contract resolves or when you deliberately rest. Injuries lose exactly 1 recovery day per game day. Infirmary Lv.${state.hq.Infirmary||0} heals at least ${heal} HP/day.</div>${rec.length?`<div class="recoveryList">${rec.map(r=>`<button class="recoveryChip inspect" data-id="${r.id}"><b>${r.name}</b><span>${r.injury||'Injured'} • ${r.recovery}d • ${r.hp}/${r.maxHp} HP</span></button>`).join('')}</div>`:'<div class="tiny good">Nobody is currently recovering.</div>'}<div class="actions"><button class="btn primary" id="restDay" ${active?'disabled':''}>Rest Company • Advance 1 Day</button><button class="btn ghost" id="buyMedicine">Buy Medicine 8s (${state.medicine||0} owned)</button></div>${active?'<div class="tiny danger">Resolve active expeditions before resting.</div>':''}</div>`;
 return html.replace('</div>\n<div class="sectionTitle"><h3>Headquarters</h3>',`</div>${recovery}<div class="sectionTitle"><h3>Headquarters</h3>`)
};

// Detailed adventurer sheet: make recovery actionable and obvious.
const oldInspectV4=inspectRecruit;
inspectRecruit=function(id){oldInspectV4(id);const r=state.roster.find(x=>x.id===id)||state.recruits.find(x=>x.id===id);if(!r||r.status!=='Recovering')return;const sheet=document.getElementById('sheet');if(!sheet)return;sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Recovery</h3><span>${r.recovery} game day(s)</span></div><div class="card recoveryDetail"><b>${r.injury||'Injured'}</b><div class="small muted">Each game day: -1 recovery day and +${recoveryHealPerDay(r)} HP. Game days advance when a contract ends or you use Rest Company.</div><div class="actions"><button class="btn goldbtn" id="treatAdventurer" ${(state.medicine||0)<1?'disabled':''}>Treat • 1 Medicine</button></div></div>`);const t=document.getElementById('treatAdventurer');if(t)t.onclick=()=>treatAdventurer(r.id)};

// Show MAX states so the user never spends money on a level with no further effect.
const oldWireV4=wire;
wire=function(){
 oldWireV4();
 document.querySelectorAll('.upgrade').forEach(b=>{const k=b.dataset.up,max=MAX_HQ[k];if(max!=null&&(state.hq[k]||0)>=max){b.disabled=true;b.textContent='MAX'}});
 document.querySelectorAll('.tacticBtn').forEach(b=>b.onclick=e=>{e.stopPropagation();setTactic(b.dataset.party,b.dataset.tactic)});
 const rest=document.getElementById('restDay');if(rest)rest.onclick=restCompany;
 const med=document.getElementById('buyMedicine');if(med)med.onclick=buyMedicine;
 const sell=document.getElementById('sellMaterials');if(sell)sell.onclick=sellMaterials;
 document.querySelectorAll('.facilityCodex').forEach(b=>b.onclick=facilityCodex);
};

// ---- AUDIO POLISH -----------------------------------------------------------
let qaCtx=null;
function qa(){if(!state.settings?.sound)return null;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!qaCtx)qaCtx=new AC();if(qaCtx.state==='suspended')qaCtx.resume().catch(()=>{});return qaCtx}
function qtone(freq,dur=.08,type='sine',gain=.018,delay=0,end=null){const c=qa();if(!c)return;const t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+dur);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(gain,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+dur+.02)}
function qnoise(dur=.05,gain=.012,delay=0){const c=qa();if(!c)return;const n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),g=c.createGain();s.buffer=buf;g.gain.value=gain;s.connect(g);g.connect(c.destination);s.start(c.currentTime+delay)}
function qfx(name){if(!state.settings?.sound)return;if(name==='rest'){qtone(180,.14,'triangle',.015);qtone(240,.16,'sine',.012,.08);qtone(300,.2,'sine',.009,.16)}if(name==='heal'){qtone(360,.08,'sine',.018);qtone(540,.12,'sine',.014,.06);qtone(720,.14,'sine',.01,.12)}if(name==='upgrade'){qnoise(.06,.01);qtone(120,.09,'square',.012);qtone(210,.12,'triangle',.015,.05);qtone(330,.15,'triangle',.012,.12)}if(name==='tactic'){qtone(155,.05,'triangle',.012);qtone(205,.06,'triangle',.01,.035)}if(name==='coin'){qtone(780,.045,'sine',.015);qtone(1050,.06,'sine',.012,.04)}if(name==='level'){qtone(330,.08,'triangle',.018);qtone(495,.09,'triangle',.016,.06);qtone(660,.12,'triangle',.014,.13);qtone(990,.18,'sine',.01,.21)}}
window.blQualitySound=qfx;
const oldBlSound=window.blSound;window.blSound=function(name){if(oldBlSound)oldBlSound(name);if(name==='success')qfx('level')};
const oldLevelCheckV4=levelCheck;levelCheck=function(r){const before=r.lvl;oldLevelCheckV4(r);if(r.lvl>before){qfx('level');toast(`${r.name} reached Level ${r.lvl}.`)}};

// ---- MECHANIC SELF-AUDIT ----------------------------------------------------
window.blMechanicAudit=function(){return{
 recovery:'advanceDay -> processRecoveryDay -> -1 recovery + HP heal',
 Barracks:`cap ${cap()}`,
 Infirmary:`${10+(state.hq.Infirmary||0)*4} HP/day; death-risk reduction and injury shortening`,
 Armory:`${Math.min(75,(state.hq.Armory||0)*15)}% bonus gear chance`,
 ContractOffice:`${5+(state.hq['Contract Office']||0)} slots, +${(state.hq['Contract Office']||0)*5}% final pay`,
 Stores:`${Math.min(25,(state.hq.Stores||0)*5)}% weekly upkeep reduction`,
 TrainingYard:`${(state.hq['Training Yard']||0)*2} XP/day to Ready adventurers`,
 OccultArchive:`${state.hq['Occult Archive']||0} unknowns revealed + artifact bonus`,
 ArtifactVault:(state.hq['Artifact Vault']||0)?'unlocked':'2-artifact limit',
 CommandHall:`party cap ${window.blPartyCap?blPartyCap():4}`,
 artifacts:{bell:hasArtifact('The Mourning Bell'),face:hasArtifact("The King’s Second Face"),nail:hasArtifact('Saint Veyra’s Nail')}
}};

const css=document.createElement('style');css.textContent=`
.recoveryPanel{margin:10px 0 15px;padding:12px;border:1px solid #5b4630;border-radius:14px;background:linear-gradient(180deg,#1b1510,#100d0a);box-shadow:inset 0 1px rgba(255,255,255,.025)}
.recoveryList{display:grid;gap:5px;margin-top:9px}.recoveryChip{display:flex;align-items:center;justify-content:space-between;text-align:left;width:100%;border:1px solid #50392b;border-radius:9px;background:#17110e;color:#d8c9b2;padding:8px}.recoveryChip span{font-size:9px;color:#a99780}.recoveryDetail{border-color:#6f4e37}.tacticStrip{display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:8px;padding:6px;border-radius:9px;background:#110d0a;border:1px solid #34271e}.tacticBtn{appearance:none;border:1px solid #4b392b;background:#1b1511;color:#9f907c;border-radius:999px;padding:5px 8px;font-size:9px;font-weight:700}.tacticBtn.selected{border-color:#a17645;color:#f0d19a;background:#2b1d13;box-shadow:0 0 0 1px rgba(206,157,91,.08)}.tacticBtn:disabled{opacity:.5}.facilityInfo{width:100%;text-align:left;margin-bottom:6px}.facilityCodex{min-width:0;padding:6px 8px}.recoveryPanel .actions{margin-top:9px}
`;
document.head.appendChild(css);

state.version=Math.max(state.version||1,4);save();setTimeout(()=>render(),0);
})();