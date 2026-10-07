/* Grim Company v21.4 — procedural dungeons. Persistent places, real parties,
   real combat, real wounds, route decisions and carried loot. */
let GC340_DUNGEON_RESOLVING=false;
const GC340_DUNGEON_NAMES={
 veyric:['The Hollow Chapel','Blackmere Crypt','The Broken Toll-Fort','Saint Orra’s Cellars','The Ashen Barrow'],
 skeld:['Barrow Under Ice','The Drowned Hold','Frost-Wolf Caves','The Sunken Longhouse','Gravetide Tunnel'],
 hoshin:['The Mossbound Shrine','Cedar Catacombs','The Sealed Monastery','Foxfire Caverns','The Fallen Watch Temple'],
 nambara:['Red Stone Warrens','The Buried Spear-Fort','Hyena King Caves','The Bone Vault','Sunken Caravan Tomb'],
 firmament:['The Folded Observatory','Choir Below Glass','The Impossible Stair','The Red Geometry','Vault of Unmaking']
};
const GC340_BOSS_NAMES={
 veyric:['The Gravetoll Warden','Mother Blackroot','The Ash Knight','Gorren Below'],
 skeld:['Hroth Ice-Eater','The Barrow Jarl','White Maw','Sigrun Twice-Dead'],
 hoshin:['The Cedar Wraith','Lord Empty-Mask','The Bell-Eater','Red Fox Spirit'],
 nambara:['The Redveld Devourer','Mogo Bone-Crowned','The Buried Tyrant','Old Spear-Breaker'],
 firmament:['The Ninth Angle','Choir-Thing Veyr','The Unfinished Saint','Pattern That Hunts']
};
function gc340InitDungeons(s=state){
 if(!s)return s;
 Object.keys(s.regions||{}).forEach(id=>{const r=s.regions[id];r.gc340Dungeons=Array.isArray(r.gc340Dungeons)?r.gc340Dungeons:[]});
 return s;
}
const _normalizeStateGC340D=normalizeState;
normalizeState=function(s){return gc340InitDungeons(_normalizeStateGC340D(s))};
const _createStateGC340D=createState;
createState=function(name,startRegion='veyric'){return gc340InitDungeons(_createStateGC340D(name,startRegion))};

function gc340DungeonRisk(regionId){
 const r=state.regions[regionId],base=1+Math.floor((Number(r?.threat)||35)/24),swing=rnd(-1,1);
 return clamp(base+swing,1,5);
}
function gc340LinkRooms(a,b){if(!a.links.includes(b.id))a.links.push(b.id);if(!b.links.includes(a.id))b.links.push(a.id)}
function gc340GenerateDungeon(regionId,risk=gc340DungeonRisk(regionId)){
 const count=7+rnd(0,3),name=pick(GC340_DUNGEON_NAMES[regionId]||GC340_DUNGEON_NAMES.veyric),boss=pick(GC340_BOSS_NAMES[regionId]||GC340_BOSS_NAMES.veyric),rooms=[],depthCount=Math.max(3,Math.ceil((count-2)/2));
 const entrance={id:uid('room'),depth:0,row:1,type:'entrance',title:'Entrance',links:[],revealed:true,cleared:true,x:7,y:50};rooms.push(entrance);
 let previous=[entrance],made=1;
 for(let depth=1;depth<=depthCount&&made<count-1;depth++){
  const remaining=(count-1)-made,slots=Math.min(remaining,depth===depthCount?remaining:(chance(.58)?2:1)),current=[];
  for(let j=0;j<slots&&made<count-1;j++){
   const roll=Math.random(),type=roll<.34?'combat':roll<.52?'trap':roll<.68?'loot':roll<.82?'shrine':roll<.93?'empty':'elite';
   const room={id:uid('room'),depth,row:slots===1?1:j*2,type,title:type==='combat'?'Occupied Chamber':type==='trap'?'Hazard Chamber':type==='loot'?'Hidden Cache':type==='shrine'?'Strange Shrine':type==='elite'?'Guarded Hall':'Quiet Room',links:[],revealed:false,cleared:false,x:7+(depth/(depthCount+1))*82,y:slots===1?50:(j===0?28:72)};
   rooms.push(room);gc340LinkRooms(pick(previous),room);if(previous.length>1&&chance(.30))gc340LinkRooms(previous.find(x=>!room.links.includes(x.id))||previous[0],room);current.push(room);made++;
  }
  previous=current.length?current:previous;
 }
 const bossRoom={id:uid('room'),depth:depthCount+1,row:1,type:'boss',title:'Boss Chamber',links:[],revealed:false,cleared:false,x:93,y:50};
 rooms.push(bossRoom);gc340LinkRooms(pick(previous),bossRoom);if(previous.length>1)gc340LinkRooms(previous[0],bossRoom);
 entrance.links.forEach(id=>{const x=rooms.find(r=>r.id===id);if(x)x.revealed=true});
 return{id:uid('dungeon'),regionId,name,bossName:boss,risk,discoveredDay:state.company.day,cleared:false,entered:0,rooms,depthCount:depthCount+1,notes:[],species:pick(REGION_DEFS[regionId].enemies)};
}
function gc340DiscoverDungeon(regionId){
 const r=state.regions[regionId];if(!r)return null;gc340InitDungeons(state);
 const uncleared=r.gc340Dungeons.filter(d=>!d.cleared);if(uncleared.length>=3)return null;
 const d=gc340GenerateDungeon(regionId);r.gc340Dungeons.push(d);
 pushHistory(`Discovered ${d.name}, a Risk ${d.risk} dungeon.`,regionId);gc199RecordFeed(`DUNGEON DISCOVERED — ${d.name} • Risk ${d.risk}.`,'rumor');save();return d;
}
function gc340DungeonById(id){for(const rid of REGION_ORDER){const d=state.regions[rid]?.gc340Dungeons?.find(x=>x.id===id);if(d)return d}return null}
function gc340DungeonRoom(d,id){return d?.rooms?.find(r=>r.id===id)||null}
function gc340DungeonSitesHTML(regionId){
 const ds=state.regions[regionId]?.gc340Dungeons||[];if(!ds.length)return'';
 return`<div class="sectionTitle"><h3>Discovered Sites</h3><span>${ds.filter(d=>!d.cleared).length} uncleared</span></div><div class="gc340DungeonSites">${ds.slice().sort((a,b)=>Number(a.cleared)-Number(b.cleared)).map(d=>`<button class="gc340Site ${d.cleared?'cleared':''}" data-action="gc340DungeonEntry" data-id="${d.id}" ${d.cleared?'disabled':''}><div><span>${d.cleared?'CLEARED':`RISK ${d.risk} • DUNGEON`}</span><b>${esc(d.name)}</b><small>${esc(d.bossName)} ${d.entered?`• entered ${d.entered}×`:''}</small></div><strong>${d.cleared?'✓':'›'}</strong></button>`).join('')}</div>`;
}
function gc340DungeonEntry(did){
 const d=gc340DungeonById(did),f=gc260Founder();if(!d||!f||d.cleared)return;
 if(gc340Presence()?.activity)return toast('Finish or cancel your focused town activity first.');
 if(f.status!=='Ready')return toast('You must be Ready before entering a dungeon.');
 if(gc270IsFreeblade()){
  const need=gc320RiskLevel(d.risk),ok=typeof gc360Rank==='function'?gc360Rank(f)>=d.risk-1:f.lvl>=need;
  return modal(`<div class="sheetHead"><div><h3>${esc(d.name)}</h3><div class="tiny muted">Risk ${d.risk} • boss: ${esc(d.bossName)}</div></div><button class="x" data-action="close">×</button></div><div class="notice">You are still a freelancer. A fresh healthy expedition crew will be assembled for this delve; it is not a standing party.</div><button class="btn goldbtn wide" data-action="gc340DungeonEnter" data-id="${d.id}" data-party="freelance" ${ok?'':'disabled'}>${ok?'ASSEMBLE CREW & ENTER':typeof gc360RiskName==='function'?`NEED ${gc360RiskName(d.risk)} CAREER`:`NEED LEVEL ${need}`}</button>`);
 }
 const parties=state.parties.filter(p=>!p.expedition&&p.members.includes(f.id)&&p.members.length&&partyMembers(p).every(a=>a.status==='Ready'));
 if(!parties.length)return toast('Put yourself in an idle staffed party before entering.');
 modal(`<div class="sheetHead"><div><h3>${esc(d.name)}</h3><div class="tiny muted">Risk ${d.risk} • boss: ${esc(d.bossName)}</div></div><button class="x" data-action="close">×</button></div><div class="notice">Dungeon progress persists if you retreat. Loot is carried until the party gets back out.</div><div class="list">${parties.map(p=>{const q=gc320PartyQualification(p,{risk:d.risk});return`<button class="card" data-action="gc340DungeonEnter" data-id="${d.id}" data-party="${p.id}" ${q.ok?'':'disabled'}><b>${esc(p.name)}</b><small>${q.ok?`Qualified • ${p.members.length} members`:`Underqualified — ${esc(q.reason)}`}</small></button>`}).join('')}</div>`);
}
function gc340DungeonContract(d,room){
 const species=d.species||REGION_DEFS[d.regionId].common,elite=room?.type==='elite',boss=room?.type==='boss';
 return{id:`dungeon-${d.id}-${room?.id||'entry'}`,title:`${d.name} — ${room?.title||'Depths'}`,desc:`Explore ${d.name}.`,risk:clamp(d.risk+(elite?1:0),1,5),regionId:d.regionId,type:'Exploration',species,enemyCount:boss?Math.max(2,2+d.risk):elite?Math.max(2,2+d.risk):Math.max(1,1+d.risk),check:'scout',unknown:0,reward:0,cacheChance:0,expires:999999,gc340Dungeon:true};
}
function gc340StartRun(d,p,freeblade=false,tempIds=[]){
 const f=gc260Founder(),start=d.rooms[0];if(!d||!p||!f)return;
 const c=gc340DungeonContract(d,start);if(typeof gc193EnsureContract==='function')gc193EnsureContract(c);
 p.gc340DungeonRun={dungeonId:d.id,currentRoomId:start.id,previousRoomId:null,carriedSilver:0,carriedItems:[],enteredDay:state.company.day,roomsCleared:d.rooms.filter(r=>r.cleared).length,freeblade,tempIds:[...tempIds]};
 p.expedition={contract:c,progress:0,elapsedDays:0,durationDays:999,expectedReturnDay:999,events:[`Entered ${d.name}.`],checks:[],battle:null,fought:false,complete:false,gcChecksDone:1,gc199FieldProgress:0,gc201Momentum:0,gc201ContactExposure:0,gc340Dungeon:true,gc340DungeonId:d.id};
 partyMembers(p).forEach(a=>a.status='Expedition');d.entered=(Number(d.entered)||0)+1;const pr=gc340Presence();pr.mode='dungeon';pr.regionId=d.regionId;state.ui.tab='you';closeModal();save();render();sfx('depart');
}
function gc340EnterDungeon(did,pid){
 const d=gc340DungeonById(did),f=gc260Founder();if(!d||!f||d.cleared)return;
 if(pid==='freelance'){
  const need=gc320RiskLevel(d.risk),qualified=typeof gc360Rank==='function'?gc360Rank(f)>=d.risk-1:f.lvl>=need;if(!qualified)return toast(typeof gc360RiskName==='function'?`Need ${gc360RiskName(d.risk)} career rarity.`:`Need Level ${need}.`);
  const fake=gc340DungeonContract(d,d.rooms[0]),p=gc332CreateFreelanceCrew(fake);if(!p)return toast('Could not assemble a freelance delve.');
  const crew=gc310AssembleCrew(fake,p),ids=crew.map(a=>a.id);p.gc340FreebladeDungeon=true;return gc340StartRun(d,p,true,ids);
 }
 const p=state.parties.find(x=>x.id===pid);if(!p||p.expedition||!p.members.includes(f.id))return toast('That party is no longer available.');
 const q=gc320PartyQualification(p,{risk:d.risk});if(!q.ok)return toast(q.reason);return gc340StartRun(d,p,false,[]);
}
function gc340SpendDungeonTime(days){
 if(!state||days<=0)return;gc199InitState(state);gc199AdvanceFieldClocks(days);state.timeSystem.gc199DayProgress=(Number(state.timeSystem.gc199DayProgress)||0)+days;
 let guard=0;while(state.timeSystem.gc199DayProgress>=1&&guard++<3){state.timeSystem.gc199DayProgress-=1;if(!gc199AdvanceWorldDay())break}
}
function gc340RevealNeighbors(d,room){room.links.forEach(id=>{const x=gc340DungeonRoom(d,id);if(x)x.revealed=true})}
function gc340ClearDungeonRoom(p,room,text=''){
 const run=p.gc340DungeonRun,d=gc340DungeonById(run.dungeonId);room.cleared=true;run.currentRoomId=room.id;run.roomsCleared=d.rooms.filter(r=>r.cleared).length;gc340RevealNeighbors(d,room);
 if(text){d.notes.push({day:state.company.day,text});p.expedition.events.push(text);gc199RecordFeed(`DUNGEON — ${d.name}: ${text}`,'field')}
 save();render();
}
function gc340CarryLoot(p,item=null,silver=0,label='Loot'){
 const run=p.gc340DungeonRun;if(!run)return;if(item)run.carriedItems.push(item);run.carriedSilver+=(Number(silver)||0);
 p.expedition.events.push(`${label}: ${item?item.name:''}${item&&silver?' • ':''}${silver?money(silver):''}.`);
}
function gc340LootRoom(p,room){
 const d=gc340DungeonById(p.gc340DungeonRun.dungeonId),rarity=clamp(Math.floor((d.risk-1)/2)+rnd(0,1),0,3),item=generateItem(d.regionId,rarity),silver=rnd(5+d.risk*3,12+d.risk*6);
 gc340CarryLoot(p,item,silver,'Recovered cache');gc340ClearDungeonRoom(p,room,`Recovered ${item.name} and ${money(silver)} from a side cache.`);
}
function gc340BossPile(p,room){
 const d=gc340DungeonById(p.gc340DungeonRun.dungeonId),first=generateItem(d.regionId,clamp(d.risk-1,1,4)),second=generateItem(d.regionId,clamp(d.risk-2,0,3)),silver=rnd(30+d.risk*18,55+d.risk*28);
 gc340CarryLoot(p,first,silver,'Boss hoard');gc340CarryLoot(p,second,0,'Boss hoard');d.cleared=true;room.cleared=true;gc340RevealNeighbors(d,room);
 state.regions[d.regionId].threat=clamp(state.regions[d.regionId].threat-(3+d.risk),0,100);state.regions[d.regionId].prosperity=clamp(state.regions[d.regionId].prosperity+1+d.risk*.4,0,100);
 pushHistory(`${d.name} cleared. ${d.bossName} was defeated; Threat fell and the region reclaimed what lay beneath it.`,d.regionId);gc199RecordFeed(`DUNGEON CLEARED — ${d.name}. Boss ${d.bossName} defeated.`,'history');
}
function gc340DamageParty(p,amount,all=false){
 const people=partyMembers(p).filter(a=>a.status!=='Dead');const targets=all?people:[pick(people)].filter(Boolean);
 targets.forEach(a=>{const dmg=Math.max(2,Math.round(amount*(.8+Math.random()*.4)));a.hp=Math.max(1,a.hp-dmg);if(a.hp/derived(a).maxHp<.35&&chance(.18)){a.injury=a.injury||injuryName();a.recovery=Math.max(Number(a.recovery)||0,1);}});
 return targets.map(a=>a.name).join(', ');
}
function gc340SetDungeonDecision(p,kind,room,fromId){
 const e=p.expedition;if(!e||e.gc260PendingDecision)return;
 if(!e.gc320ResumeMode)e.gc320ResumeMode=gc199Mode();
 e.gc260PendingDecision={id:uid('decision'),type:'dungeon',dungeonKind:kind,roomId:room.id,fromRoomId:fromId,title:room.title};
 gc321Acquire(p);gc321EnsureModal();save();
}
function gc340DungeonDecisionHTML(p,dn){
 const d=gc340DungeonById(p.gc340DungeonRun?.dungeonId),room=gc340DungeonRoom(d,dn.roomId);if(!d||!room)return'';
 if(dn.dungeonKind==='trap')return`<div class="gc320DecisionModal"><div class="gc320DecisionBanner danger"><span>DUNGEON • SIMULATION PAUSED</span><b>${esc(room.title)}</b><small>A mechanism, unstable floor or concealed hazard blocks the way.</small></div><div class="gc260Decision dangerDecision"><div class="gc260DecisionChoices"><button class="card" data-action="gc340DungeonChoice" data-party="${p.id}" data-choice="careful"><b>Pick through carefully</b><small>Best Scout/Sneak specialist. Safer on success; one person takes the failure.</small></button><button class="card" data-action="gc340DungeonChoice" data-party="${p.id}" data-choice="force"><b>Force a path</b><small>Best Endure specialist. Faster, but failure can hurt the whole party.</small></button><button class="card" data-action="gc340DungeonChoice" data-party="${p.id}" data-choice="back"><b>Back out</b><small>Leave this room uncleared and return to the previous node.</small></button></div></div></div>`;
 return`<div class="gc320DecisionModal"><div class="gc320DecisionBanner"><span>DUNGEON • SIMULATION PAUSED</span><b>${esc(room.title)}</b><small>An old power still answers here.</small></div><div class="gc260Decision"><div class="gc260DecisionChoices"><button class="card" data-action="gc340DungeonChoice" data-party="${p.id}" data-choice="study"><b>Study it</b><small>Occult check. Success weakens the next enemy group and may reveal valuables; failure bites back.</small></button><button class="card" data-action="gc340DungeonChoice" data-party="${p.id}" data-choice="leave"><b>Leave it alone</b><small>Clear the room without touching what you do not understand.</small></button></div></div></div>`;
}
const _gc320OpenDecisionModalGC340=gc320OpenDecisionModal;
gc320OpenDecisionModal=function(p){
 const d=p?.expedition?.gc260PendingDecision;if(d?.type==='dungeon')return modal(gc340DungeonDecisionHTML(p,d));
 return _gc320OpenDecisionModalGC340(p);
};
function gc340FinishDungeonDecision(p,choice){
 const e=p?.expedition,dn=e?.gc260PendingDecision;if(!p||!e||dn?.type!=='dungeon')return;
 const dungeon=gc340DungeonById(p.gc340DungeonRun.dungeonId),room=gc340DungeonRoom(dungeon,dn.roomId),resume=e.gc320ResumeMode||'paused';if(!room)return;
 let text='';
 if(dn.dungeonKind==='trap'){
  if(choice==='back'){p.gc340DungeonRun.currentRoomId=dn.fromRoomId||p.gc340DungeonRun.currentRoomId;text='The party backed away from the hazard.'}
  else{
   const skill=choice==='careful'?(bestUtility(p,'scout').value>=bestUtility(p,'sneak').value?bestUtility(p,'scout'):bestUtility(p,'sneak')):bestUtility(p,'endure'),diff=9+dungeon.risk*4,roll=skill.value+rnd(-4,5),ok=roll>=diff;
   if(ok){text=`${skill.a?.name||'The party'} handled the hazard (${roll} vs ${diff}).`;gc340ClearDungeonRoom(p,room,text)}
   else{const names=gc340DamageParty(p,4+dungeon.risk*3,choice==='force');text=`The hazard caught ${names} (${roll} vs ${diff}).`;gc340ClearDungeonRoom(p,room,text)}
  }
 }else{
  if(choice==='leave'){text='You leave the strange shrine untouched.';gc340ClearDungeonRoom(p,room,text)}
  else{
   const b=bestUtility(p,'occult'),diff=10+dungeon.risk*4,roll=b.value+rnd(-4,5),ok=roll>=diff;
   if(ok){p.gc340DungeonRun.nextEnemyDebuff=(Number(p.gc340DungeonRun.nextEnemyDebuff)||0)+.10;const silver=rnd(4,10+dungeon.risk*3);gc340CarryLoot(p,null,silver,'Shrine offering');text=`${b.a?.name||'The party'} understood the shrine (${roll} vs ${diff}). The next enemies are weakened and ${money(silver)} was recovered.`}
   else{text=`The shrine answered badly (${roll} vs ${diff}). ${gc340DamageParty(p,3+dungeon.risk*2,true)} suffered the backlash.`}
   gc340ClearDungeonRoom(p,room,text);
  }
 }
 e.gc260PendingDecision=null;delete e.gc320ResumeMode;document.getElementById('modal')?.classList.remove('show');gc321ClearStaleLock();gc320ResumeAfterDecision(resume);save();render();
}
function gc340PrepareRoomCombat(p,room){
 const run=p.gc340DungeonRun,d=gc340DungeonById(run.dungeonId),e=p.expedition;e.contract=gc340DungeonContract(d,room);if(typeof gc193EnsureContract==='function')gc193EnsureContract(e.contract);
 e.gc260BattleDecisionDone=false;e.gc260DeferredBattle=false;e.gc260PendingDecision=null;e.battle=null;e.enemyDebuff=Number(run.nextEnemyDebuff)||0;run.nextEnemyDebuff=0;run.pendingCombatRoomId=room.id;
 startBattle(p);
}
function gc340ExploreRoom(pid,roomId){
 const p=state.parties.find(x=>x.id===pid),run=p?.gc340DungeonRun,d=gc340DungeonById(run?.dungeonId),room=gc340DungeonRoom(d,roomId),current=gc340DungeonRoom(d,run?.currentRoomId);
 if(!p||!run||!d||!room||!current||p.expedition?.battle||p.expedition?.gc260PendingDecision)return;
 if(!current.links.includes(room.id))return toast('That room is not connected to your current position.');
 const from=current.id;gc340SpendDungeonTime(room.cleared?.02:.045);run.previousRoomId=from;run.currentRoomId=room.id;
 if(room.cleared){gc340RevealNeighbors(d,room);save();render();return}
 if(room.type==='combat'||room.type==='elite'||room.type==='boss')return gc340PrepareRoomCombat(p,room);
 if(room.type==='trap'||room.type==='shrine')return gc340SetDungeonDecision(p,room.type,room,from);
 if(room.type==='loot')return gc340LootRoom(p,room);
 return gc340ClearDungeonRoom(p,room,'The room was searched and found quiet.');
}
function gc340BankDungeonLoot(p,survived=true){
 const run=p.gc340DungeonRun,d=gc340DungeonById(run?.dungeonId);if(!run||!d)return{items:0,silver:0};
 if(!survived)return{items:0,silver:0};
 run.carriedItems.forEach(item=>inventoryEntry(item,d.regionId,1));state.company.silver+=run.carriedSilver;
 return{items:run.carriedItems.length,silver:run.carriedSilver};
}
function gc340ExitDungeon(p,reason='withdrew'){
 const run=p?.gc340DungeonRun,d=gc340DungeonById(run?.dungeonId);if(!p||!run||!d)return;
 const survivors=partyMembers(p).filter(a=>a.status!=='Dead'),bank=gc340BankDungeonLoot(p,survivors.length>0);
 if(typeof relationshipAfterMission==='function')relationshipAfterMission(p,partyMembers(p).filter(a=>a.status==='Dead').map(a=>a.name));
 partyMembers(p).forEach(a=>{if(a.gc320PendingRecovery){a.gc320PendingRecovery=false;a.status='Recovering';a.dailyOrder='Recover'}else if(a.status==='Expedition')a.status='Ready'});
 p.expedition=null;p.gc340DungeonRun=null;
 const free=run.freeblade,tempIds=run.tempIds||[];
 if(free){gc310ReturnFreelancers(p,tempIds,d.regionId);gc332RestoreFounderHome(p)}
 else if(p.captainId&&!state.roster.find(a=>a.id===p.captainId&&a.status!=='Dead'))p.captainId=p.members.map(id=>state.roster.find(a=>a.id===id)).find(a=>a&&a.status!=='Dead')?.id||null;
 const f=gc260Founder(),pr=gc340Presence();if(f&&f.status!=='Dead'){pr.mode='town';pr.regionId=f.regionId;pr.place='hall'}
 gc199RecordFeed(`DUNGEON RETURN — ${d.name}: ${reason}. Recovered ${bank.items} item${bank.items===1?'':'s'} and ${money(bank.silver)}.`,'field');save();state.ui.tab='you';render();toast(`${d.name}: returned with ${bank.items} item${bank.items===1?'':'s'} and ${money(bank.silver)}.`);
}
function gc340DungeonMapHTML(d,run){
 const roomMap=new Map(d.rooms.map(r=>[r.id,r])),lines=[];
 d.rooms.forEach(a=>a.links.forEach(id=>{const b=roomMap.get(id);if(b&&a.id<id)lines.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`)}));
 return`<div class="gc340DungeonMap"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>${d.rooms.filter(r=>r.revealed).map(r=>{const available=gc340DungeonRoom(d,run.currentRoomId)?.links.includes(r.id),current=run.currentRoomId===r.id,icon=r.cleared?'✓':r.type==='boss'?'☠':r.type==='entrance'?'⌂':'?';return`<button class="gc340Room ${current?'current':''} ${r.cleared?'cleared':''} ${available?'available':''}" style="left:${r.x}%;top:${r.y}%;" data-action="gc340DungeonRoom" data-party="${gc340FounderInDungeon()?.id||''}" data-id="${r.id}" ${available&&!gc340FounderInDungeon()?.expedition?.battle?'':'disabled'}><b>${icon}</b><span>${r.revealed?(r.cleared||current?esc(r.title):'Unknown'):''}</span></button>`}).join('')}</div>`;
}
function gc340DungeonRunHTML(p){
 const run=p.gc340DungeonRun,d=gc340DungeonById(run.dungeonId),room=gc340DungeonRoom(d,run.currentRoomId),e=p.expedition;if(!d||!room)return'';
 const members=partyMembers(p),loot=`${run.carriedItems.length} item${run.carriedItems.length===1?'':'s'} • ${money(run.carriedSilver)}`;
 return`<div class="gc340DungeonLead"><span>YOU • DUNGEON • RISK ${d.risk}</span><h2>${esc(d.name)}</h2><p>${esc(d.bossName)} waits somewhere below. Progress persists if you retreat.</p></div>${gc340DungeonMapHTML(d,run)}<div class="gc340DungeonStatus"><div><span>CURRENT ROOM</span><b>${esc(room.title)}</b></div><div><span>CARRIED LOOT</span><b>${esc(loot)}</b></div><div><span>EXPLORED</span><b>${d.rooms.filter(r=>r.cleared).length}/${d.rooms.length}</b></div></div><div class="gc330PartyFaces">${members.map(a=>`<button data-action="inspect" data-id="${a.id}">${blPortraitHTML(a,'blPortraitMini')}<span>${a.status==='Dead'?'DEAD':`${Math.round(a.hp)}/${derived(a).maxHp}`}</span></button>`).join('')}</div>${e.battle?gc331CombatPanel(p):e.gc260PendingDecision?'<div class="notice danger">A dungeon decision is waiting. The entire simulation is hard-locked.</div>':`<div class="gc340RoomChoices">${room.links.map(id=>{const r=gc340DungeonRoom(d,id);if(!r?.revealed)return'';return`<button class="card" data-action="gc340DungeonRoom" data-party="${p.id}" data-id="${r.id}"><b>${r.cleared?'Move to':'Explore'} ${esc(r.cleared?r.title:'Unknown Passage')}</b><small>${r.cleared?'Known route.':'Uncleared room. The map will not tell you what is inside.'}</small></button>`}).join('')}</div>`}<div class="actions"><button class="btn ghost" data-action="gc330FullLog" data-id="${p.id}">Expedition Log</button><button class="btn dangerBtn" data-action="gc340DungeonExit" data-party="${p.id}" ${e.battle||e.gc260PendingDecision?'disabled':''}>${d.cleared?'Return With the Hoard':'Retreat to Town'}</button></div>`;
}

const _gc330YouScreenGC340=gc330YouScreen;
gc330YouScreen=function(){const p=gc340FounderInDungeon();if(p)return gc340DungeonRunHTML(p);return _gc330YouScreenGC340()};

const _gc201AdvanceExpeditionGC340=gc201AdvanceExpedition;
gc201AdvanceExpedition=function(p,deltaDays){if(p?.expedition?.gc340Dungeon)return false;return _gc201AdvanceExpeditionGC340(p,deltaDays)};

const _gc193FinishNoTimeGC340D=gc193FinishNoTime;
gc193FinishNoTime=function(p){if(p?.expedition?.gc340Dungeon)return false;return _gc193FinishNoTimeGC340D(p)};

const _startBattleGC340D=startBattle;
startBattle=function(p){
 const dungeon=!!p?.expedition?.gc340Dungeon,out=_startBattleGC340D(p),e=p?.expedition,b=e?.battle;
 if(dungeon&&b){
  const run=p.gc340DungeonRun,d=gc340DungeonById(run?.dungeonId),room=gc340DungeonRoom(d,run?.pendingCombatRoomId);
  if(room?.type==='boss'&&!b.gc340BossApplied){
   const boss=b.enemies[0];if(boss){boss.name=d.bossName;boss.bossId=d.id;boss.maxHp=Math.round(boss.maxHp*1.55);boss.hp=boss.maxHp;boss.attack=Math.round(boss.attack*1.18);boss.guard=Math.round(boss.guard*1.12);b.log.unshift(`BOSS — ${d.bossName} bars the way to the hoard.`)}b.gc340BossApplied=true;
  }
  state.ui.tab='you';save();render();
 }
 return out;
};

const _resolveBattleGC340D=resolveBattle;
resolveBattle=function(p,win){
 const dungeon=!!p?.expedition?.gc340Dungeon,run=p?.gc340DungeonRun,roomId=run?.pendingCombatRoomId;
 if(!dungeon)return _resolveBattleGC340D(p,win);
 GC340_DUNGEON_RESOLVING=true;let out;try{out=_resolveBattleGC340D(p,win)}finally{GC340_DUNGEON_RESOLVING=false}
 const d=gc340DungeonById(run.dungeonId),room=gc340DungeonRoom(d,roomId);
 if(!p.expedition)return out;
 if(win&&room){
  room.cleared=true;run.currentRoomId=room.id;run.pendingCombatRoomId=null;run.roomsCleared=d.rooms.filter(r=>r.cleared).length;gc340RevealNeighbors(d,room);
  p.expedition.battleWon=null;p.expedition.fought=false;p.expedition.gc260BattleDecisionDone=false;p.expedition.gc260DeferredBattle=false;
  if(room.type==='boss'){gc340BossPile(p,room);p.expedition.events.push(`BOSS DEFEATED — ${d.bossName}. The hoard is yours if you can carry it home.`)}
  else p.expedition.events.push(`${room.title} cleared.`);
  save();render();return out;
 }
 if(!win)return gc340ExitDungeon(p,'driven out of the dungeon');
 return out;
};

const _gc320RetreatPartyGC340D=gc320RetreatParty;
gc320RetreatParty=function(pid){const p=state.parties.find(x=>x.id===pid);if(p?.expedition?.gc340Dungeon)return gc340ExitDungeon(p,'withdrew before the dungeon was cleared');return _gc320RetreatPartyGC340D(pid)};

const _processActionGC340C=processAction;
processAction=function(el){
 const a=el.dataset.action;
 if(a==='gc340DungeonEntry')return gc340DungeonEntry(el.dataset.id);
 if(a==='gc340DungeonEnter')return gc340EnterDungeon(el.dataset.id,el.dataset.party);
 if(a==='gc340DungeonRoom')return gc340ExploreRoom(el.dataset.party,el.dataset.id);
 if(a==='gc340DungeonChoice')return gc340FinishDungeonDecision(state.parties.find(p=>p.id===el.dataset.party),el.dataset.choice);
 if(a==='gc340DungeonExit')return gc340ExitDungeon(state.parties.find(p=>p.id===el.dataset.party),'returned voluntarily');
 return _processActionGC340C(el);
};
