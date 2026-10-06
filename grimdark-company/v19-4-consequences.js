/* Grim Company v19.4 — consequential contracts, career bands, regional starts, payroll, and stronger rewards. */
const GC194_VERSION='19.4';
const GC194_MAX_LEVEL=20;
const GC194_MORTAL_REGIONS=['veyric','skeld','hoshin','nambara'];
const GC194_RISK_LEVELS={1:1,2:5,3:10,4:15,5:20};
const GC194_REGION_NATIVE={veyric:'Human',skeld:'Dwarf',hoshin:'Elf',nambara:'Orc',firmament:'Celestial'};

/* Regional demographics: 50% native; mortal regions split the remaining normal
   races at 15% each and leave 5% for rare Celestials. The Firmament reverses
   that: 50% Celestial and 12.5% each mortal race. */
REGION_DEFS.veyric.raceWeights={Human:50,Dwarf:15,Elf:15,Orc:15,Celestial:5};
REGION_DEFS.skeld.raceWeights={Dwarf:50,Human:15,Elf:15,Orc:15,Celestial:5};
REGION_DEFS.hoshin.raceWeights={Elf:50,Human:15,Dwarf:15,Orc:15,Celestial:5};
REGION_DEFS.nambara.raceWeights={Orc:50,Human:15,Dwarf:15,Elf:15,Celestial:5};
REGION_DEFS.firmament.raceWeights={Celestial:50,Human:12.5,Dwarf:12.5,Elf:12.5,Orc:12.5};

function gc194RiskLevel(risk){return GC194_RISK_LEVELS[clamp(Number(risk)||1,1,5)]||1}
function gc194RiskBand(risk){return ({1:'PROFESSIONAL',2:'PROVEN',3:'VETERAN',4:'ELITE',5:'LEGENDARY'})[risk]||'PROFESSIONAL'}

/* Level 20 is the career ceiling. Experience at cap is discarded rather than
   silently creating level 21+ adventurers. */
grantXP=function(a,amount){
 if(!a||a.status==='Dead')return false;
 if((a.lvl||1)>=GC194_MAX_LEVEL){a.lvl=GC194_MAX_LEVEL;a.xp=0;return false}
 const mult=derived(a).special.xp;
 a.xp+=Math.max(0,Math.round((Number(amount)||0)*mult));
 let leveled=false;
 while(a.lvl<GC194_MAX_LEVEL&&a.xp>=xpNeed(a.lvl)){
   a.xp-=xpNeed(a.lvl);levelUp(a,true);leveled=true;
 }
 if(a.lvl>=GC194_MAX_LEVEL){a.lvl=GC194_MAX_LEVEL;a.xp=0}
 return leveled;
};

/* Risk tiers are major career bands, not tiny adjacent difficulty bumps. */
makeEnemy=function(c,index){
 const sp=ENEMY_SPECIES[c.species]||ENEMY_SPECIES.Bandit,role=pick(Object.keys(ENEMY_ROLES)),rr=ENEMY_ROLES[role];
 const boss=c.nemesisId&&index===0?state.nemeses.find(n=>n.id===c.nemesisId):null;
 const benchmark=gc194RiskLevel(c.risk),level=clamp(Math.max(benchmark,boss?.level||0)+(benchmark<20?rnd(0,1):0),1,GC194_MAX_LEVEL);
 const base=18+level*7;
 const hp=Math.round((48+level*18)*sp.hp*rr.hp*(boss?1.35:1));
 return{id:uid('e'),name:boss?boss.name:`${c.species} ${role}`,species:c.species,role,level,maxHp:hp,hp,
  attack:Math.round(base*sp.attack*rr.attack*(boss?1.18:1)),
  guard:Math.round((12+level*6)*sp.guard*rr.guard*(boss?1.15:1)),
  speed:Math.round((10+level*3)*sp.speed*rr.speed),accuracy:Math.round((11+level*3)*sp.accuracy*rr.accuracy),
  resolve:20+level*4,bossId:boss?.id||null,supernatural:!!sp.supernatural,horror:!!sp.horror,regen:sp.regen||0,evade:sp.evade||0};
};

/* Contract money is priced around time exposed + danger, so a four-day job is
   not economically equivalent to a one-day errand. */
function gc194ContractPay(c){
 gc193EnsureContract(c);
 const r=state.regions[c.regionId],risk=clamp(Number(c.risk)||1,1,5),days=Math.max(1,c.gcDuration||gc193ContractDuration(c));
 const curve={
   1:{base:20,day:10,enemy:2},
   2:{base:70,day:20,enemy:5},
   3:{base:220,day:45,enemy:10},
   4:{base:600,day:100,enemy:20},
   5:{base:1500,day:220,enemy:35}
 }[risk];
 const office=hq(c.regionId).upgrades['Contract Office']||0;
 const prosperity=.90+(r.prosperity||50)*.002;
 return Math.max(10,Math.round((curve.base+curve.day*days+curve.enemy*(c.enemyCount||1))*(1+office*.05)*prosperity));
}
function gc194TuneContract(c){
 if(!c)return c;gc193EnsureContract(c);
 if(c.gc194Economy!==GC194_VERSION){c.reward=gc194ContractPay(c);c.gc194Economy=GC194_VERSION}
 return c;
}
const _generateContractGC194=generateContract;
generateContract=function(regionId){return gc194TuneContract(_generateContractGC194(regionId))};

/* Loot now feels like an actual build decision. Existing generated items are
   upgraded once on load, and future loot enters at the stronger values. */
function gc194EmpowerItem(item){
 if(!item||item._gc194Power)return item;
 (item.mods||[]).forEach(m=>{
   if(!Number.isFinite(Number(m.value)))return;
   const def=MODIFIERS.find(x=>x.id===m.id);
   const v=Number(m.value),boosted=Math.max(v+1,Math.round(v*1.5));
   m.value=boosted;
   if(def){m.label=def.label(boosted);if(def.effect)m.effect=def.effect(boosted)}
 });
 item.baseValue=Math.max(1,Math.round((item.baseValue||8)*1.2));
 item._gc194Power=true;
 return item;
}
function gc194EmpowerStateItems(s){
 if(!s)return;
 (s.inventory||[]).forEach(e=>gc194EmpowerItem(e.item));
 (s.roster||[]).forEach(a=>Object.values(a.gear||{}).forEach(gc194EmpowerItem));
 Object.values(s.regions||{}).forEach(r=>(r.market?.stock||[]).forEach(x=>gc194EmpowerItem(x.item)));
}
const _generateItemGC194=generateItem;
generateItem=function(regionId,rarity=null){return gc194EmpowerItem(_generateItemGC194(regionId,rarity))};

/* Starting and developed traits should materially change a character. */
Object.assign(TRAITS['Hard Worker'].util,{endure:5});
TRAITS['Cowardly'].util.sneak=4;TRAITS['Cowardly'].combat.resolve=-5;
TRAITS['Greedy'].util.talk=4;TRAITS['Greedy'].pay=.08;TRAITS['Greedy'].desc='+4 Talk and +8% contract payment.';
TRAITS['Iron Stomach'].util.endure=6;TRAITS['Iron Stomach'].attrition=.5;
TRAITS['Bad Knee'].combat.speed=-5;TRAITS['Bad Knee'].util.sneak=-4;
TRAITS['Quick Learner'].xp=1.4;TRAITS['Quick Learner'].desc='+40% contract and field XP.';
TRAITS['Hot Temper'].combat.attack=5;TRAITS['Hot Temper'].util.talk=-3;
TRAITS['Night Eyes'].util.scout=5;TRAITS['Night Eyes'].util.sneak=4;
TRAITS['Steady Hands'].combat.accuracy=5;TRAITS['Steady Hands'].util.scout=2;
TRAITS['Superstitious'].util.occult=5;TRAITS['Superstitious'].combat.resolve=-3;
TRAITS['Kindhearted'].util.talk=6;
TRAITS['Bloodthirsty'].combat.attack=6;TRAITS['Bloodthirsty'].util.talk=-3;
TRAITS['Stubborn'].combat.resolve=5;TRAITS['Stubborn'].util.endure=3;
TRAITS['Lucky'].crit=.10;TRAITS['Lucky'].desc='+10% critical chance and stronger field-check swings.';
TRAITS['Sickly'].util.endure=-6;TRAITS['Sickly'].attrition=1.4;
TRAITS['Tunnel Rat'].util.sneak=6;TRAITS['Tunnel Rat'].util.scout=4;
TRAITS['Streetwise'].util.talk=5;TRAITS['Streetwise'].util.sneak=4;
TRAITS['Haunted'].util.occult=6;TRAITS['Haunted'].util.scout=2;TRAITS['Haunted'].combat.resolve=-3;
TRAITS['Vengeful'].combat.attack=3;TRAITS['Vengeful'].util.talk=-2;

if(typeof BL18_TRAITS!=='undefined'){
 Object.assign(BL18_TRAITS.Protective.combat,{guard:5});
 Object.assign(BL18_TRAITS['Hard to Kill'].combat,{resolve:5});BL18_TRAITS['Hard to Kill'].maxHp=15;
 Object.assign(BL18_TRAITS['Keen-Eyed'].combat,{accuracy:4});Object.assign(BL18_TRAITS['Keen-Eyed'].util,{scout:6});
 Object.assign(BL18_TRAITS['Monster Scholar'].util,{scout:4,occult:6});
 Object.assign(BL18_TRAITS['Steady Nerves'].combat,{resolve:7});
 Object.assign(BL18_TRAITS.Reckless.combat,{attack:7,guard:-3});
 Object.assign(BL18_TRAITS.Cautious.combat,{guard:7,attack:-2});
 Object.assign(BL18_TRAITS['Glory Hound'].combat,{attack:5,resolve:-2});
 Object.assign(BL18_TRAITS['Natural Leader'].combat,{resolve:4});Object.assign(BL18_TRAITS['Natural Leader'].util,{talk:5});
 Object.assign(BL18_TRAITS.Vindictive.combat,{attack:4});
 Object.assign(BL18_TRAITS['Grave-Hardened'].combat,{resolve:4});Object.assign(BL18_TRAITS['Grave-Hardened'].util,{occult:4});
}
if(typeof bl18MasteryBonus==='function'){
 bl18MasteryBonus=function(rank){return[
  {accuracy:0,guard:0,resolve:0,damage:0},
  {accuracy:2,guard:1,resolve:1,damage:.04},
  {accuracy:4,guard:3,resolve:2,damage:.08},
  {accuracy:6,guard:5,resolve:4,damage:.14},
  {accuracy:9,guard:7,resolve:6,damage:.22}
 ][rank]||{accuracy:0,guard:0,resolve:0,damage:0}}
}

/* Career keywords get an extra punch on top of their existing specialized effect. */
if(typeof bl17ApplySkill==='function'){
 const _bl17ApplySkillGC194=bl17ApplySkill;
 bl17ApplySkill=function(s,d){
   _bl17ApplySkillGC194(s,d);
   const t=Number(s?.tier)||1,bonus=[0,1,2,4][t]||1;
   const offensive=['berserk','duel','breaker','horrorhunter','balanced','song'];
   const defensive=['guard','ranks','spearwall','radiant'];
   const precise=['marksman','volley','pattern','hound','encircle'];
   if(offensive.includes(s.type))d.combat.attack+=bonus;
   if(defensive.includes(s.type))d.combat.guard+=bonus;
   if(precise.includes(s.type))d.combat.accuracy+=bonus;
   if(['scout','stealth','veil','skirmish'].includes(s.type))d.combat.speed+=bonus;
   if(['morale','healer','choir','spirit','occult','ancestor'].includes(s.type))d.combat.resolve+=bonus;
   return d;
 };
}

/* Contract encounter risk is rolled every field day. Longer work means more
   exposure, scouting matters, and combat is no longer guaranteed. */
function gc194EncounterChance(p){
 const e=p?.expedition,c=e?.contract;if(!e||!c)return 0;
 const r=state.regions[c.regionId],base={1:.18,2:.24,3:.31,4:.38,5:.46}[c.risk]||.18;
 const typeShift={Extermination:.10,Siege:.12,Defense:.08,Hunt:.06,Escort:.03,Caravan:.03,Exploration:.04,Retrieval:.01,Rescue:0,Assassination:.02,Investigation:-.07,Negotiation:-.10}[c.type]||0;
 const scout=bestUtility(p,'scout')?.value||0;
 const scoutReduction=Math.min(.10,Math.max(0,scout-12)/220);
 const intelReduction=(c.gcIntel||0)*.035+(c.gcScoutEdge||0)*.35;
 const threatShift=((r?.threat||50)-50)*.0015;
 const tacticShift=p.tactic==='Cautious'?-.05:p.tactic==='Aggressive'?.05:0;
 const unknownShift=Math.min(.12,(c.unknown||0)*.025);
 return clamp(base+typeShift+threatShift+tacticShift+unknownShift-scoutReduction-intelReduction,.06,.72);
}

const _dispatchContractGC194=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_dispatchContractGC194(cid,pid),p=state.parties.find(x=>x.id===pid);
 if(p?.expedition){const e=p.expedition;e.gc194EncounterRolls=0;e.gc194Encounters=0;e.gc194Deaths=e.gc194Deaths||[];e.events.push(`Daily hostile-contact risk: ${Math.round(gc194EncounterChance(p)*100)}% at departure.`);save();render()}
 return out;
};

gc193ProgressExpedition=function(p,report){
 const e=p.expedition;if(!e)return;gc193MigrateExpedition(p);
 if(e.battle){report.push(`${p.name}: encounter still unresolved.`);return}
 if(e.elapsedDays>=e.durationDays){gc193FinishNoTime(p);return}
 e.elapsedDays++;e.progress=clamp(Math.round((e.elapsedDays/e.durationDays)*100),0,100);
 e.events.push(`Day ${state.company.day}: ${e.elapsedDays}/${e.durationDays} expedition days elapsed.`);
 if((e.gcChecksDone||0)<1){fieldCheck(p);e.gcChecksDone=(e.gcChecksDone||0)+1}
 const encounterChance=gc194EncounterChance(p);e.gc194EncounterRolls=(e.gc194EncounterRolls||0)+1;
 if(chance(encounterChance)){
   e.gc194Encounters=(e.gc194Encounters||0)+1;
   e.events.push(`Hostile contact (${Math.round(encounterChance*100)}% daily risk).`);
   startBattle(p);report.push(`${p.name}: ENCOUNTER on ${e.contract.title} — resolve combat before advancing another day.`);return;
 }
 e.events.push(`No hostile contact (${Math.round(encounterChance*100)}% daily risk).`);
 if(e.elapsedDays>=e.durationDays){gc193FinishNoTime(p);return}
 report.push(`${p.name}: ${e.elapsedDays}/${e.durationDays} days • ${e.gc194Encounters||0} encounter${(e.gc194Encounters||0)===1?'':'s'} so far • expected return Day ${e.expectedReturnDay}.`);
};

const _gc193FinishNoTimeGC194=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition;if(e&&e.gc194Deaths?.length)e.deaths=[...new Set([...(e.deaths||[]),...e.gc194Deaths])];
 return _gc193FinishNoTimeGC194(p);
};
const _resolveBattleGC194=resolveBattle;
resolveBattle=function(p,win){
 const before=[...(p?.expedition?.gc194Deaths||[])];
 const out=_resolveBattleGC194(p,win);
 const e=p?.expedition;
 if(e){e.gc194Deaths=[...new Set([...before,...(e.deaths||[])])];if(win)e.events.push(`The party survived encounter ${e.gc194Encounters||1}.`);save()}
 if(!win&&p?.expedition&&!p.expedition.battle)return gc193FinishNoTime(p);
 return out;
};

/* Individual payroll anniversaries. A Day-6 hire is due on Day 13, not Day 7. */
function gc194RecoverHireDay(s,a){
 const history=[...(s.history||[])].reverse();
 const hit=history.find(ev=>ev&&typeof ev==='object'&&Number.isFinite(Number(ev.day))&&String(ev.text||'').startsWith(`Hired ${a.name},`));
 return hit?Number(hit.day):Number(s.company?.day||1);
}
function gc194InitPayroll(s){
 if(!s)return;
 (s.roster||[]).forEach(a=>{
   if(!Number.isFinite(Number(a.hireDay)))a.hireDay=gc194RecoverHireDay(s,a);
   if(!Number.isFinite(Number(a.nextPayDay))){a.nextPayDay=a.hireDay+7;while(a.nextPayDay<=s.company.day)a.nextPayDay+=7}
 });
}
weeklyWages=function(){
 const due=state.roster.filter(a=>a.status!=='Dead'&&Number(a.nextPayDay)<=state.company.day);
 if(!due.length)return;
 let total=0;const names=[];
 due.forEach(a=>{
   const stores=hq(a.regionId).upgrades.Stores||0,mult=(1-stores*.04)*(hasArtifact("The King’s Second Face",a.regionId)?1.08:1);
   const pay=Math.max(1,Math.ceil(a.wage*mult));total+=pay;names.push(`${a.name} ${money(pay)}`);
   do{a.nextPayDay=(Number(a.nextPayDay)||state.company.day)+7}while(a.nextPayDay<=state.company.day);
 });
 state.company.silver-=total;pushHistory(`Payroll: ${names.join(' • ')}. Total ${money(total)}.`);
 if(state.company.silver<0){state.company.renown=Math.max(0,state.company.renown-3);pushHistory('The treasury fell below zero. Company reputation suffered.')}
};
const _hireRecruitGC194=hireRecruit;
hireRecruit=function(id){
 const recruit=region().recruits.find(x=>x.id===id),day=state.company.day;
 const out=_hireRecruitGC194(id);
 const a=state.roster.find(x=>x.id===id);
 if(a&&recruit){a.hireDay=day;a.nextPayDay=day+7;save();render()}
 return out;
};

/* Keep the equipment sheet open until the player closes it. */
equipItem=function(aid,itemId){
 const a=state.roster.find(x=>x.id===aid),entry=state.inventory.find(x=>x.regionId===a?.regionId&&x.item.id===itemId);if(!a||!entry)return;
 const item=removeInventoryItem(itemId,a.regionId);if(!item)return;const old=a.gear[item.slot];if(old)inventoryEntry(old,a.regionId,1);
 a.gear[item.slot]=item;a.hp=Math.min(derived(a).maxHp,a.hp);save();showGear(aid);
};
unequip=function(aid,slot){const a=state.roster.find(x=>x.id===aid);if(!a||!a.gear[slot])return;inventoryEntry(a.gear[slot],a.regionId,1);a.gear[slot]=null;save();showGear(aid)};

/* New companies choose one of the four mortal regions. The Firmament is the
   fifth and final expansion. Expansion costs are based on how many mortal HQs
   already exist, so the player chooses order rather than following a fixed path. */
const _createStateGC194=createState;
createState=function(name,startRegion='veyric'){
 const chosen=GC194_MORTAL_REGIONS.includes(startRegion)?startRegion:'veyric',s=_createStateGC194(name);
 GC194_MORTAL_REGIONS.concat('firmament').forEach(id=>{
   const r=s.regions[id];r.hq.established=false;Object.keys(r.hq.upgrades||{}).forEach(k=>r.hq.upgrades[k]=0);
 });
 s.regions[chosen].hq.established=true;s.regions[chosen].hq.upgrades.Barracks=1;s.currentRegion=chosen;
 s.parties=[makeParty(chosen,`${REGION_DEFS[chosen].culture} First Company`)];
 gc194InitPayroll(s);gc194EmpowerStateItems(s);withState(s,()=>Object.values(s.regions).forEach(r=>(r.contracts||[]).forEach(gc194TuneContract)));
 return gc193InitState(s);
};

const _normalizeStateGC194=normalizeState;
normalizeState=function(s){s=_normalizeStateGC194(s);if(!s)return s;gc194InitPayroll(s);gc194EmpowerStateItems(s);withState(s,()=>Object.values(s.regions||{}).forEach(r=>(r.contracts||[]).forEach(gc194TuneContract)));return s};

branchRequirements=function(id){
 const d=REGION_DEFS[id],mortals=GC194_MORTAL_REGIONS.filter(x=>hq(x).established).length;
 if(hq(id).established)return{ok:true,cost:0,renown:0};
 if(id==='firmament'){
   const four=mortals===4;return{ok:four&&state.company.silver>=d.foundCost&&state.company.renown>=d.renown,cost:d.foundCost,renown:d.renown,extra:'Requires HQs in all four mortal regions.'};
 }
 const step=[{cost:600,renown:15},{cost:900,renown:30},{cost:1200,renown:45}][clamp(mortals-1,0,2)];
 return{ok:state.company.silver>=step.cost&&state.company.renown>=step.renown,cost:step.cost,renown:step.renown};
};

renderStart=function(){
 document.title='Grim Company';document.body.dataset.brand='grim-company';
 const choices=GC194_MORTAL_REGIONS.map((id,i)=>{const d=REGION_DEFS[id],native=GC194_REGION_NATIVE[id];return`<label class="gc194StartRegion"><input type="radio" name="startRegion" value="${id}" ${i===0?'checked':''}><span><b>${esc(d.name)}</b><small>${esc(d.culture)} homeland • 50% ${native} recruits</small><em>${esc(d.desc)}</em></span></label>`}).join('');
 document.getElementById('app').className='';
 document.getElementById('app').innerHTML=`<div class="start gc193Start"><div class="startPanel gc193StartPanel"><div class="gc193LogoHero">${gc193SkullSvg('hero')}</div><h1>GRIM COMPANY</h1><p>Build an adventuring company in a world that survives by sending professionals into places everyone else has learned to fear.</p><div class="label">Name your company</div><input id="companyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><div class="label gc194ChooseLabel">Choose your first region</div><div class="gc194StartRegions">${choices}</div><button class="btn primary wide" data-action="begin">FOUND COMPANY</button><p class="tiny muted">The Shattered Firmament remains locked until your company has established all four mortal regions.</p></div></div>`;
 document.getElementById('nav').innerHTML='';
};
startCompany=function(){
 const input=document.getElementById('companyName'),name=(input?.value||'').trim();if(name.length<2)return toast('Give the company a name first.');
 const chosen=document.querySelector('input[name="startRegion"]:checked')?.value||'veyric';state=createState(name,chosen);safeLocalRemove(LEGACY_KEY);save();unlockAudio();render();toast(`${name} founded in ${REGION_DEFS[chosen].name}.`);
};

/* Surface the decisions the player is actually making. */
const _contractCardGC194=contractCard;
contractCard=function(c){
 gc194TuneContract(c);let html=_contractCardGC194(c);const chancePct=Math.round(gc194EncounterChance({expedition:{contract:c},tactic:'Balanced',members:[]} )*100);
 const info=`<div class="gc194RiskReadout"><b>RISK ${c.risk} — ${gc194RiskBand(c.risk)}</b><span>Recommended Lv.${gc194RiskLevel(c.risk)}+ • ${c.gcDuration} day${c.gcDuration===1?'':'s'} • ~${chancePct}% hostile contact/day before party scouting</span></div>`;
 return html.replace('<div class="actions">',info+'<div class="actions">');
};
const _expeditionCardGC194=expeditionCard;
expeditionCard=function(p){let html=_expeditionCardGC194(p),e=p?.expedition;if(!e)return html;if(e.fought&&!e.battle&&e.elapsedDays<e.durationDays)html=html.replace('RETURNING','IN THE FIELD');const line=`<div class="gc194FieldRisk">Daily encounter risk <b>${Math.round(gc194EncounterChance(p)*100)}%</b> • ${e.gc194Encounters||0} encounter${(e.gc194Encounters||0)===1?'':'s'} survived</div>`;return html.replace('<div class="combatLog">',line+'<div class="combatLog">')};

const _renderInspectGC194=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC194(id,recruit),a=(recruit?region().recruits:state.roster).find(x=>x.id===id),sheet=document.getElementById('sheet');
 if(a&&sheet&&!recruit&&!sheet.querySelector('.gc194PayrollCard')){
   const panel=`<div class="gc194PayrollCard"><b>PAYROLL</b><span>${money(a.wage)}/week • hired Day ${a.hireDay??'—'} • next pay Day ${a.nextPayDay??'—'}</span></div>`;
   const anchor=sheet.querySelector('.gc193OrderPanel,.buildStack');if(anchor)anchor.insertAdjacentHTML('afterend',panel);else sheet.insertAdjacentHTML('afterbegin',panel);
 }
 return out;
};

const _renderGC194=render;
render=function(){
 const out=_renderGC194();
 if(state)requestAnimationFrame(()=>{
   document.querySelectorAll('.member[data-action="inspect"]').forEach(card=>{
     if(card.querySelector('.gc194RosterWage'))return;const a=state.roster.find(x=>x.id===card.dataset.id);if(!a)return;
     const center=card.children[1];if(center)center.insertAdjacentHTML('beforeend',`<div class="gc194RosterWage">${money(a.wage)}/week • next pay Day ${a.nextPayDay??'—'}</div>`);
   });
 });
 return out;
};

const _regionCardGC194=regionCard;
regionCard=function(id){
 let html=_regionCardGC194(id);
 if(id==='firmament'&&!GC194_MORTAL_REGIONS.every(x=>hq(x).established)){
   html=html.replace(/<button class="btn goldbtn" data-action="foundBranch"[^>]*>[^<]*<\/button>/,`<button class="btn" disabled>LOCKED • Establish all four mortal HQs</button>`);
 }
 return html;
};

const _auditGC194=audit;
audit=function(){
 const out=_auditGC194();out.grimCompanyConsequences=GC194_VERSION;out.maxLevel=GC194_MAX_LEVEL;out.riskRecommendedLevels={...GC194_RISK_LEVELS};out.dailyEncounterRolls=true;out.individualPayroll=true;out.chooseStartingRegion=true;out.regionalRecruitWeights=true;out.empoweredLoot=true;return out;
};
window.__BL_AUDIT=audit;
