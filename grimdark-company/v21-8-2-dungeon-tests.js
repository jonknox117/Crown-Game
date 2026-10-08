/* v21.8.2 regression: locked dungeon choices, save recovery, and escape. */
window.__GC382_TEST=function(){
 const old=state,modalHost=document.getElementById('modal');
 try{
  state=createState('Dungeon Recovery Test','veyric');
  state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';
  const f=gc260CreateFounderRecord('veyric',{name:'Delve Tester',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Expedition';f.lvl=12;f.missions=40;
  const p=makeParty('veyric','Recovery Party');p.members=[f.id];p.captainId=f.id;state.parties.push(p);
  const dungeon=gc340GenerateDungeon('veyric',1),entrance=dungeon.rooms[0],room=dungeon.rooms[1];
  room.type='trap';room.title='Hazard Chamber';room.revealed=true;
  state.regions.veyric.gc340Dungeons.push(dungeon);
  p.gc340DungeonRun={dungeonId:dungeon.id,currentRoomId:room.id,previousRoomId:entrance.id,carriedSilver:86,carriedItems:[],enteredDay:state.company.day,roomsCleared:1,freeblade:false,tempIds:[]};
  p.expedition={contract:gc340DungeonContract(dungeon,room),progress:0,elapsedDays:0,durationDays:999,
   events:[],checks:[],battle:null,fought:false,complete:false,gc340Dungeon:true,gc340DungeonId:dungeon.id,
   gc260PendingDecision:{id:uid('decision'),type:'dungeon',dungeonKind:'trap',roomId:room.id,fromRoomId:entrance.id,title:room.title}};
  const pr=gc340Presence();pr.mode='dungeon';state.ui.tab='you';
  gc321Acquire(p);
  const locked=gc321Locked()&&gc199Mode()==='paused';
  const scene=gc340DungeonRunHTML(p),inline=scene.includes('data-action="gc340DungeonChoice"')&&scene.includes('data-action="gc382DungeonWithdraw"')&&scene.includes('Pick through carefully');
  const mapDisabled=gc340DungeonMapHTML(dungeon,p.gc340DungeonRun).includes('aria-disabled="true"');
  const roundtrip=normalizeState(JSON.parse(JSON.stringify(state)));
  const saved=roundtrip.parties.find(x=>x.id===p.id)?.expedition?.gc260PendingDecision?.roomId===room.id;
  /* Run the same action dispatched by a real tap, not a direct function call. */
  const selection=document.createElement('button');
  selection.dataset.action='gc340DungeonChoice';selection.dataset.party=p.id;selection.dataset.choice='back';
  processAction(selection);
  const selected=!gc321Locked()&&!p.expedition.gc260PendingDecision&&p.gc340DungeonRun.currentRoomId===entrance.id;
  /* Deliberately corrupt the saved decision target: fall back to explicit retreat. */
  p.gc340DungeonRun.currentRoomId=room.id;
  p.expedition.gc260PendingDecision={id:uid('decision'),type:'dungeon',dungeonKind:'trap',roomId:'vanished-room',fromRoomId:entrance.id};
  gc321Acquire(p);
  const fallback=gc340DungeonRunHTML(p).includes('data-action="gc382DungeonWithdraw"');
  const beforeSilver=state.company.silver;
  const leave=document.createElement('button');leave.dataset.action='gc382DungeonWithdraw';leave.dataset.party=p.id;
  processAction(leave);
  const escaped=!p.expedition&&!p.gc340DungeonRun&&gc340SyncPresence().mode==='town'&&!gc321Locked();
  const lootRecovered=state.company.silver===beforeSilver+86;
  const nav=[...document.querySelectorAll('#nav button')].length===4;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(locked&&inline&&mapDisabled&&saved&&selected&&fallback&&escaped&&lootRecovered&&nav&&integrity),
   locked,inline,mapDisabled,saved,selected,fallback,escaped,lootRecovered,nav,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}
 finally{
  state=old;
  if(modalHost)modalHost.classList.remove('show');
  try{render()}catch(_){}
 }
};
