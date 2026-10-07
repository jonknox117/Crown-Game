/* Grim Company v21.4 — PRESENCE
   The Founder is a physical person. NPCs automate broad work; YOU focus it. */
const GC340_VERSION='21.4';
const GC340_SUPPORT={Scout:1.25,'Odd Jobs':1.25,Train:1.25,Recover:1.20};
const GC340_TOWNS={
 veyric:{
  hall:{name:'Greyhaven Chapterhouse',icon:'◆',desc:'Your rooms, ledgers and company table.'},
  scout:{name:'March Watch',icon:'⌖',stance:'Scout',desc:'Rangers, road reports and rumors from beyond the walls.'},
  odd:{name:'Lantern Market',icon:'¤',stance:'Odd Jobs',desc:'Merchants, taverns and ordinary people who need capable hands.'},
  train:{name:'Muster Yard',icon:'✦',stance:'Train',desc:'Drills, sparring circles and people trying to become dangerous.'},
  recover:{name:'Pilgrim House',icon:'✚',stance:'Recover',desc:'Healers, beds and the wounded people who made it home.'}
 },
 skeld:{
  hall:{name:'Skeldhaven Hall',icon:'◆',desc:'The company hearth and command benches.'},
  scout:{name:'Beacon Tower',icon:'⌖',stance:'Scout',desc:'Lookouts watch the fjords, snow roads and distant smoke.'},
  odd:{name:'Harbor Mead Hall',icon:'¤',stance:'Odd Jobs',desc:'Sailors, traders and locals trade work beside the fire.'},
  train:{name:'Shield Ring',icon:'✦',stance:'Train',desc:'Veterans drill shieldwork and settle arguments with practice steel.'},
  recover:{name:'Rune-Healer Lodge',icon:'✚',stance:'Recover',desc:'Herbs, carved wards and hard-earned northern medicine.'}
 },
 hoshin:{
  hall:{name:'Mizukane House',icon:'◆',desc:'The company residence and audience chamber.'},
  scout:{name:'Cedar Watch',icon:'⌖',stance:'Scout',desc:'Messengers, scouts and shrine reports arrive beneath the eaves.'},
  odd:{name:'River Market',icon:'¤',stance:'Odd Jobs',desc:'Craftsmen, porters and households post practical work.'},
  train:{name:'Practice Court',icon:'✦',stance:'Train',desc:'Forms, archery lanes and controlled sparring.'},
  recover:{name:'Quiet Shrine',icon:'✚',stance:'Recover',desc:'Physicians and shrine attendants tend body and spirit.'}
 },
 nambara:{
  hall:{name:'Red Shield Lodge',icon:'◆',desc:'Your fortified lodge above the redveld.'},
  scout:{name:'Horn Post',icon:'⌖',stance:'Scout',desc:'Runners bring tracks, migration signs and warband sightings.'},
  odd:{name:'Caravan Circle',icon:'¤',stance:'Odd Jobs',desc:'Drovers, traders and settlement elders bring immediate work.'},
  train:{name:'Spear Court',icon:'✦',stance:'Train',desc:'Formation drills and hard sparring under the open sky.'},
  recover:{name:'Bone-Healer Tent',icon:'✚',stance:'Recover',desc:'Surgeons and omen-readers work beside smoking braziers.'}
 },
 firmament:{
  hall:{name:'Glass Bastion',icon:'◆',desc:'The last sane rooms at the edge of impossible country.'},
  scout:{name:'Veil Observatory',icon:'⌖',stance:'Scout',desc:'Observers chart geometry that refuses to stay still.'},
  odd:{name:'Refuge Concourse',icon:'¤',stance:'Odd Jobs',desc:'Survivors and supply crews need practical help every hour.'},
  train:{name:'Resonance Court',icon:'✦',stance:'Train',desc:'Fighters practice against shapes and rhythms no mortal school teaches.'},
  recover:{name:'Choir Infirmary',icon:'✚',stance:'Recover',desc:'Harmonic medicine holds damaged minds and bodies together.'}
 }
};
function gc340Presence(s=state){
 if(!s)return null;
 s.founderSystem=s.founderSystem||{};
 const f=(s.roster||[]).find(a=>a.id===s.company?.founderId),rid=f?.regionId||s.currentRegion||'veyric';
 const p=s.founderSystem.gc340Presence=s.founderSystem.gc340Presence||{regionId:rid,place:'hall',mode:'town',activity:null,focusedCompleted:0};
 p.regionId=p.regionId||rid;p.place=GC340_TOWNS[p.regionId]?.[p.place]?p.place:'hall';p.mode=p.mode||'town';p.focusedCompleted=Number(p.focusedCompleted)||0;
 return p;
}
function gc340TownDef(regionId=gc340Presence()?.regionId){return GC340_TOWNS[regionId]||GC340_TOWNS.veyric}
function gc340FounderInDungeon(){return state?.parties?.find(p=>p.gc340DungeonRun&&p.members.includes(state.company.founderId))||null}
function gc340FounderInField(){return state?.parties?.find(p=>p.expedition&&!p.expedition.gc340Dungeon&&p.members.includes(state.company.founderId))||null}
function gc340SyncPresence(){
 const pr=gc340Presence(),f=gc260Founder();if(!pr||!f)return pr;
 pr.regionId=f.regionId;
 if(gc340FounderInDungeon())pr.mode='dungeon';
 else if(gc340FounderInField())pr.mode='field';
 else pr.mode='town';
 return pr;
}
function gc340At(stance,regionId){
 const pr=gc340SyncPresence(),f=gc260Founder();if(!pr||!f||pr.mode!=='town'||f.regionId!==regionId||f.status==='Dead')return false;
 const place=gc340TownDef(regionId)[pr.place];return place?.stance===stance&&f.dailyOrder===stance;
}
const _normalizeStateGC340=normalizeState;
normalizeState=function(s){s=_normalizeStateGC340(s);gc340Presence(s);return s};
const _createStateGC340=createState;
createState=function(name,startRegion='veyric'){const s=_createStateGC340(name,startRegion);gc340Presence(s);return s};

function gc340Move(place){
 const f=gc260Founder(),pr=gc340Presence(),def=gc340TownDef(f?.regionId)?.[place];
 if(!f||!pr||!def||gc340FounderInField()||gc340FounderInDungeon()||gc260System()?.activity)return toast('You are not free to move around town right now.');
 if(pr.activity)return toast('Finish or cancel your focused activity first.');
 pr.regionId=f.regionId;pr.place=place;pr.mode='town';
 if(def.stance){
  f.dailyOrder=def.stance;f.dailyMentorId=null;f.dailyFacility=null;
  if(typeof gc220RememberReturn==='function'&&def.stance!=='Recover')gc220RememberReturn(f,def.stance);
 }
 save();render();sfx('tap');
}
function gc340ActionSpec(type,targetId=null){
 const f=gc260Founder(),rid=f?.regionId;
 const specs={
  surveyRuins:{place:'scout',stance:'Scout',hours:6,label:'Survey the Wilds',desc:'Personally search for a hidden site. Strong chance to uncover a dungeon; otherwise improve contract intelligence.'},
  studyContract:{place:'scout',stance:'Scout',hours:2.5,label:'Study a Dangerous Contract',desc:'Focus on the least-understood local contract and improve its intelligence before anyone deploys.'},
  huntThreat:{place:'scout',stance:'Scout',hours:4,label:'Follow a Threat Lead',desc:'Track a real local danger and directly reduce regional Threat if the lead pans out.'},
  lucrativeJob:{place:'odd',stance:'Odd Jobs',hours:3.5,label:'Take a High-Value Local Job',desc:'Choose a better-paying piece of local work and improve Prosperity.'},
  helpLocals:{place:'odd',stance:'Odd Jobs',hours:3,label:'Solve a Local Problem',desc:'Trade personal time for Stability, a little silver and stronger local trust.'},
  workContacts:{place:'odd',stance:'Odd Jobs',hours:2.5,label:'Work the Local Network',desc:'Spend time with mercenaries, merchants and fixers to improve the available people and rumors.'},
  mentor:{place:'train',stance:'Train',hours:3,label:'Mentor One Adventurer',desc:'Give one person focused training and build a direct relationship with them.',targetId},
  drillParty:{place:'train',stance:'Train',hours:4,label:'Drill a Party',desc:'Personally train an entire idle party, raising XP and Cohesion.',targetId},
  personalDrill:{place:'train',stance:'Train',hours:2.5,label:'Train Yourself',desc:'Focused personal work gives substantially more XP than simply remaining on Train.'},
  visitWounded:{place:'recover',stance:'Recover',hours:2,label:'Visit a Wounded Adventurer',desc:'Help one recovering person heal faster and build the relationship.',targetId},
  helpInfirmary:{place:'recover',stance:'Recover',hours:3.5,label:'Help the Infirmary',desc:'Spend your time helping every wounded company member at this HQ.'},
  treatment:{place:'recover',stance:'Recover',hours:3,label:'Seek Intensive Treatment',desc:'Concentrated care for your own wounds and recovery.'}
 };
 return specs[type]||null;
}
function gc340StartFocused(type,targetId=null){
 const f=gc260Founder(),pr=gc340Presence(),sp=gc340ActionSpec(type,targetId);if(!f||!pr||!sp)return;
 if(pr.mode!=='town'||f.status==='Dead'||gc260System()?.activity)return toast('You cannot start that while away from town.');
 if(pr.activity)return toast('You are already focused on something.');
 if(pr.place!==sp.place)return toast(`Go to ${gc340TownDef(f.regionId)[sp.place].name} first.`);
 if(sp.stance){f.dailyOrder=sp.stance;if(typeof gc220RememberReturn==='function'&&sp.stance!=='Recover')gc220RememberReturn(f,sp.stance)}
 if(type==='treatment'&&f.hp>=derived(f).maxHp&&!f.injury)return toast('You do not need intensive treatment.');
 pr.activity={id:uid('focus'),type,targetId:targetId||null,label:sp.label,durationDays:sp.hours/24,remainingDays:sp.hours/24,startedDay:state.company.day,regionId:f.regionId,place:sp.place};
 save();render();toast(`${sp.label} started • ${sp.hours}h.`);
}
function gc340CancelFocused(){
 const pr=gc340Presence();if(!pr?.activity)return;pr.activity=null;save();render();toast('Focused activity cancelled. No focused reward earned.');
}
function gc340AdjustRecovery(a,days,hpPct){
 if(!a||a.status==='Dead')return;
 const m=derived(a),w=gc200Work(a);a.hp=Math.min(m.maxHp,(Number(a.hp)||0)+Math.round(m.maxHp*hpPct));
 if(a.status==='Recovering'){
  w.recoveryLeft=Math.max(0,(Number(w.recoveryLeft)||Number(a.recovery)||1)-days);a.recovery=w.recoveryLeft>0?Math.max(1,Math.ceil(w.recoveryLeft)):0;
  if(w.recoveryLeft<=0){a.status='Ready';a.injury=null;a.recovery=0;if(a.hp>=m.maxHp)a.dailyOrder=gc220ReturnStance(a)}
 }
}
function gc340CompleteFocused(act){
 const f=gc260Founder(),pr=gc340Presence(),rid=act.regionId,r=state.regions[rid];if(!f||!pr||!r)return;
 let result='';
 if(act.type==='surveyRuins'){
  const d=gc340DiscoverDungeon(rid);
  if(d)result=`You uncovered ${d.name}, a Risk ${d.risk} dungeon.`;
  else{const c=gc200SharedScoutTarget(rid)||r.contracts[0];if(c){c.gcIntel=Math.min(3,(Number(c.gcIntel)||0)+1);c.unknown=Math.max(0,(Number(c.unknown)||0)-1);result=`No new site, but ${c.title} gained useful intelligence.`}else result='The survey found no immediate lead.'}
 }else if(act.type==='studyContract'){
  const c=r.contracts.slice().sort((a,b)=>(b.unknown||0)-(a.unknown||0)||(a.gcIntel||0)-(b.gcIntel||0))[0];
  if(c){c.gcIntel=Math.min(3,(Number(c.gcIntel)||0)+1);c.unknown=Math.max(0,(Number(c.unknown)||0)-1);c.gcScoutEdge=(Number(c.gcScoutEdge)||0)+.08;result=`You personally improved the intelligence on ${c.title}.`}else result='There was no open contract left to study.';
 }else if(act.type==='huntThreat'){
  const before=r.threat;r.threat=clamp(r.threat-.75,0,100);r.stability=clamp(r.stability+.15,0,100);result=`You broke up a local threat lead. Threat ${before.toFixed(1)} → ${r.threat.toFixed(1)}.`;
 }else if(act.type==='lucrativeJob'){
  const pay=rnd(10,18);state.company.silver+=pay;r.prosperity=clamp(r.prosperity+.30,0,100);grantXP(f,3);result=`You completed a lucrative local job for ${money(pay)}. Prosperity +0.3.`;
 }else if(act.type==='helpLocals'){
  const pay=rnd(4,8);state.company.silver+=pay;r.stability=clamp(r.stability+.45,0,100);r.threat=clamp(r.threat-.15,0,100);result=`You solved a local problem for ${money(pay)}. Stability +0.5 and Threat -0.2.`;
 }else if(act.type==='workContacts'){
  if(typeof refreshRecruits==='function')refreshRecruits(rid);const pool=typeof gc310EnsurePool==='function'?gc310EnsurePool(rid):[];const known=pool.filter(a=>(a.gc310JobsWithFounder||0)>0);if(known.length&&gc270IsCompany()){const a=pick(known);if(!r.recruits.some(x=>x.id===a.id))r.recruits.unshift(a)}
  result='You worked the local network. Recruitment and familiar mercenary contacts refreshed.';
 }else if(act.type==='mentor'){
  const a=state.roster.find(x=>x.id===act.targetId&&x.status!=='Dead');if(a){const xp=10+Math.floor((f.lvl||1)/3);grantXP(a,xp);grantXP(f,3);setRel(f.id,a.id,relValue(f.id,a.id)+4);result=`You personally mentored ${a.name}: +${xp} XP and relationship improved.`}else result='Your intended trainee was unavailable.';
 }else if(act.type==='drillParty'){
  const p=state.parties.find(x=>x.id===act.targetId);if(p&&!p.expedition){p.cohesion=clamp((Number(p.cohesion)||0)+10,0,100);partyMembers(p).filter(a=>a.status==='Ready').forEach(a=>grantXP(a,5));grantXP(f,3);result=`You drilled ${p.name}: +10 Cohesion and +5 XP to each ready member.`}else result='That party was no longer available to drill.';
 }else if(act.type==='personalDrill'){
  grantXP(f,12);result='Focused practice earned you 12 XP.';
 }else if(act.type==='visitWounded'){
  const a=state.roster.find(x=>x.id===act.targetId);if(a){gc340AdjustRecovery(a,.45,.20);setRel(f.id,a.id,relValue(f.id,a.id)+5);result=`You spent time with ${a.name}. Their recovery accelerated and the relationship improved.`}else result='The person you meant to visit was unavailable.';
 }else if(act.type==='helpInfirmary'){
  const wounded=state.roster.filter(a=>a.regionId===rid&&a.status==='Recovering');wounded.forEach(a=>gc340AdjustRecovery(a,.28,.12));grantXP(f,3);result=`You helped the infirmary treat ${wounded.length} wounded adventurer${wounded.length===1?'':'s'}.`;
 }else if(act.type==='treatment'){
  gc340AdjustRecovery(f,.65,.45);result='Intensive treatment substantially improved your own condition.';
 }
 pr.focusedCompleted++;pr.activity=null;
 f.history=f.history||[];f.history.push(`Day ${state.company.day}: ${result}`);
 gc199RecordFeed(`YOU — ${result}`,'history');pushHistory(`${f.name}: ${result}`,rid);sfx('success');save();render();
}
function gc340TickFocused(deltaDays){
 const pr=gc340Presence();if(!pr?.activity||deltaDays<=0)return;
 const f=gc260Founder();if(!f||f.status==='Dead'||gc340FounderInField()||gc340FounderInDungeon())return;
 pr.activity.remainingDays=Math.max(0,Number(pr.activity.remainingDays)-deltaDays);
 if(pr.activity.remainingDays<=.00001)gc340CompleteFocused({...pr.activity});
}
function gc340ChooseTarget(type){
 const f=gc260Founder(),sp=gc340ActionSpec(type);if(!f||!sp)return;
 let rows=[];
 if(type==='mentor')rows=localRoster(f.regionId).filter(a=>a.id!==f.id&&a.status==='Ready');
 else if(type==='visitWounded')rows=localRoster(f.regionId).filter(a=>a.id!==f.id&&a.status==='Recovering');
 else if(type==='drillParty')rows=localParties(f.regionId).filter(p=>!p.expedition&&p.members.length&&!p.members.includes(f.id));
 if(!rows.length)return toast(type==='visitWounded'?'Nobody here is recovering.':'No valid target is available.');
 modal(`<div class="sheetHead"><div><h3>${esc(sp.label)}</h3><div class="tiny muted">${esc(sp.desc)}</div></div><button class="x" data-action="close">×</button></div><div class="list">${rows.map(x=>type==='drillParty'?`<button class="card" data-action="gc340FocusTarget" data-type="${type}" data-id="${x.id}"><b>${esc(x.name)}</b><small>${x.members.length} members • Cohesion ${Math.round(x.cohesion||0)}</small></button>`:`<button class="card" data-action="gc340FocusTarget" data-type="${type}" data-id="${x.id}"><b>${esc(x.name)}</b><small>Lv.${x.lvl} ${esc(x.className)} • ${esc(x.status)}</small></button>`).join('')}</div>`);
}
function gc340ActivityHTML(){
 const pr=gc340Presence(),a=pr?.activity;if(!a)return'';
 const pct=clamp((1-a.remainingDays/a.durationDays)*100,0,100);
 return`<div class="gc340Activity"><span>FOCUSED ACTIVITY</span><b>${esc(a.label)}</b><small>${Math.max(0,a.remainingDays*24).toFixed(1)}h remaining • normal company simulation continues</small><i><em data-gc340-activitybar style="width:${pct}%"></em></i><button class="btn ghost" data-action="gc340CancelFocus">Cancel</button></div>`;
}
function gc340PlaceActions(place){
 const map={
  scout:['surveyRuins','studyContract','huntThreat'],
  odd:['lucrativeJob','helpLocals','workContacts'],
  train:['mentor','drillParty','personalDrill'],
  recover:['visitWounded','helpInfirmary','treatment']
 };
 return(map[place]||[]).map(type=>{const sp=gc340ActionSpec(type),target=['mentor','drillParty','visitWounded'].includes(type);return`<button class="gc340FocusAction" data-action="${target?'gc340FocusChoose':'gc340FocusStart'}" data-type="${type}"><b>${esc(sp.label)}</b><span>${esc(sp.desc)}</span><em>${sp.hours}h</em></button>`}).join('');
}
function gc340TownHTML(){
 const f=gc260Founder(),pr=gc340SyncPresence();if(!f||!pr)return'';
 if(pr.mode!=='town')return`<div class="sectionTitle"><h3>Presence</h3><span>${pr.mode==='dungeon'?'inside a dungeon':'away from town'}</span></div><div class="gc340Away"><b>Your physical presence is committed elsewhere.</b><span>Town focus actions and local Founder support resume when you return.</span></div>`;
 const defs=gc340TownDef(f.regionId),active=defs[pr.place]||defs.hall,support=active.stance?`Your presence strengthens ${active.stance} work at this HQ by ${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%.`:'This is your neutral management location.';
 return`<div class="sectionTitle"><h3>Town</h3><span>YOU are physically here</span></div><div class="gc340TownMap">${Object.entries(defs).map(([id,d])=>`<button class="gc340Place ${id} ${pr.place===id?'active':''}" data-action="gc340Move" data-value="${id}"><b>${d.icon}</b><span>${esc(d.name)}</span><em>${d.stance?esc(d.stance):'HOME'}</em></button>`).join('')}</div><div class="gc340PlacePanel"><div class="gc340PlaceHead"><div><span>${active.stance?`${active.stance.toUpperCase()} • ACTIVE PRESENCE`:'HOME'}</span><b>${esc(active.name)}</b><small>${esc(active.desc)}</small></div>${active.stance?`<strong>+${Math.round((GC340_SUPPORT[active.stance]-1)*100)}%</strong>`:''}</div><p>${esc(support)}</p>${gc340ActivityHTML()}${!pr.activity&&active.stance?`<div class="gc340FocusGrid">${gc340PlaceActions(pr.place)}</div>`:''}</div>${typeof gc340DungeonSitesHTML==='function'?gc340DungeonSitesHTML(f.regionId):''}`;
}
const _gc320FounderStancesHTMLGC340=gc320FounderStancesHTML;
gc320FounderStancesHTML=function(){return gc340TownHTML()};

const _processActionGC340=processAction;
processAction=function(el){
 const a=el.dataset.action;
 if(a==='gc340Move')return gc340Move(el.dataset.value);
 if(a==='gc340FocusStart')return gc340StartFocused(el.dataset.type);
 if(a==='gc340FocusChoose')return gc340ChooseTarget(el.dataset.type);
 if(a==='gc340FocusTarget'){closeModal();return gc340StartFocused(el.dataset.type,el.dataset.id)}
 if(a==='gc340CancelFocus')return gc340CancelFocused();
 return _processActionGC340(el);
};
