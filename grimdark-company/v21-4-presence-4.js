/* Grim Company v21.4 — Presence presentation, mobile polish and regression coverage. */
const _gc270FreebladeYouGC340D=gc270FreebladeYou;
gc270FreebladeYou=function(){const p=gc340FounderInDungeon();if(p)return gc340DungeonRunHTML(p);return _gc270FreebladeYouGC340D()};

function gc340InstallStyles(){
 if(document.getElementById('gc340Styles'))return;
 const st=document.createElement('style');st.id='gc340Styles';
 st.textContent=`
 .gc340TownMap{position:relative;display:grid;grid-template-columns:repeat(3,1fr);grid-template-areas:". scout ." "odd hall train" ". recover .";gap:6px;padding:8px;margin-bottom:7px;border:1px solid rgba(201,171,116,.12);border-radius:9px;background:radial-gradient(circle at 50% 50%,rgba(121,93,49,.08),transparent 55%),#10100e}
 .gc340Place{min-width:0;min-height:76px;padding:7px 5px;border:1px solid rgba(255,255,255,.06);border-radius:7px;background:#161512;color:#aaa195;text-align:center}.gc340Place.hall{grid-area:hall}.gc340Place.scout{grid-area:scout}.gc340Place.odd{grid-area:odd}.gc340Place.train{grid-area:train}.gc340Place.recover{grid-area:recover}.gc340Place.active{border-color:rgba(209,171,101,.56);background:linear-gradient(180deg,#282116,#17140f);color:#ddc18b}.gc340Place b,.gc340Place span,.gc340Place em{display:block}.gc340Place b{font-size:18px}.gc340Place span{margin-top:3px;font-size:8px;line-height:1.15}.gc340Place em{margin-top:3px;font-size:6px;letter-spacing:.1em;color:#81786c;font-style:normal}.gc340Place.active em{color:#bd9d67}
 .gc340PlacePanel{padding:9px;border:1px solid rgba(255,255,255,.06);border-radius:8px;background:#14130f}.gc340PlaceHead{display:flex;justify-content:space-between;gap:10px}.gc340PlaceHead>div{min-width:0}.gc340PlaceHead span,.gc340PlaceHead b,.gc340PlaceHead small{display:block}.gc340PlaceHead span{font-size:6px;letter-spacing:.12em;color:#b08c56}.gc340PlaceHead b{margin-top:2px;font-size:13px}.gc340PlaceHead small{margin-top:3px;font-size:8px;line-height:1.35;color:#8f8578}.gc340PlaceHead strong{font-size:15px;color:#d1ad6d}.gc340PlacePanel>p{font-size:8px;line-height:1.35;color:#9a8e7f}
 .gc340FocusGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-top:7px}.gc340FocusAction{position:relative;min-height:98px;padding:8px 7px 18px;border:1px solid rgba(255,255,255,.06);border-radius:6px;background:#191713;color:#c8bfb0;text-align:left}.gc340FocusAction b,.gc340FocusAction span,.gc340FocusAction em{display:block}.gc340FocusAction b{font-size:9px}.gc340FocusAction span{margin-top:4px;font-size:7px;line-height:1.3;color:#8d8375}.gc340FocusAction em{position:absolute;right:6px;bottom:5px;font-size:7px;color:#c09c62;font-style:normal}
 .gc340Activity{margin:8px 0;padding:8px;border-left:3px solid #a98148;background:#18140e}.gc340Activity span,.gc340Activity b,.gc340Activity small{display:block}.gc340Activity span{font-size:6px;letter-spacing:.13em;color:#c19b61}.gc340Activity b{font-size:10px;margin-top:2px}.gc340Activity small{font-size:7px;color:#8f8374;margin-top:3px}.gc340Activity i{display:block;height:3px;margin:6px 0;background:#2b2924}.gc340Activity em{display:block;height:100%;background:#b38d4d}
 .gc340Away{padding:9px;border-left:3px solid #665a45;background:#14130f}.gc340Away b,.gc340Away span{display:block}.gc340Away b{font-size:10px}.gc340Away span{margin-top:3px;font-size:8px;color:#8b8276}
 .gc340DungeonSites{display:grid;gap:5px}.gc340Site{display:flex;justify-content:space-between;align-items:center;gap:8px;min-height:58px;padding:8px 9px;border:1px solid rgba(164,82,69,.23);border-left:3px solid #87453d;border-radius:7px;background:#17110f;color:#c9bdb0;text-align:left}.gc340Site>div{min-width:0}.gc340Site span,.gc340Site b,.gc340Site small{display:block}.gc340Site span{font-size:6px;letter-spacing:.12em;color:#bd685d}.gc340Site b{font-size:10px;margin-top:2px}.gc340Site small{font-size:7px;color:#897d72;margin-top:2px}.gc340Site strong{font-size:20px;color:#c88a64}.gc340Site.cleared{opacity:.52;border-left-color:#5c725b}
 .gc340Autonomy{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:7px 0;padding:7px;border:1px solid rgba(255,255,255,.055);border-radius:6px;background:#12110f}.gc340Autonomy.active{border-color:rgba(175,143,82,.28)}.gc340Autonomy>div{min-width:0}.gc340Autonomy span,.gc340Autonomy b,.gc340Autonomy small{display:block}.gc340Autonomy span{font-size:6px;color:#8e806d}.gc340Autonomy b{font-size:9px;margin-top:2px}.gc340Autonomy small{font-size:7px;color:#82786c;margin-top:2px;line-height:1.3}.gc340Autonomy .btn{flex:0 0 82px}
 .gc340DungeonLead{padding:8px 2px 10px}.gc340DungeonLead span{font-size:7px;letter-spacing:.14em;color:#c26457}.gc340DungeonLead h2{font-size:22px;margin:3px 0}.gc340DungeonLead p{margin:3px 0;font-size:9px;color:#97897d;line-height:1.4}
 .gc340DungeonMap{position:relative;height:250px;margin:6px 0 9px;border:1px solid rgba(178,113,83,.18);border-radius:9px;background:radial-gradient(circle at 50% 45%,rgba(124,52,42,.08),transparent 50%),#0e0d0c;overflow:hidden}.gc340DungeonMap svg{position:absolute;inset:0;width:100%;height:100%}.gc340DungeonMap line{stroke:#4d4137;stroke-width:.8;vector-effect:non-scaling-stroke}.gc340Room{position:absolute;transform:translate(-50%,-50%);width:54px;min-height:46px;padding:4px;border:1px solid #51483e;border-radius:8px;background:#171512;color:#8f8577;z-index:2}.gc340Room b,.gc340Room span{display:block}.gc340Room b{font-size:15px}.gc340Room span{font-size:6px;line-height:1.1;margin-top:2px}.gc340Room.available{border-color:#98634f;color:#cba18c}.gc340Room.current{border-color:#d0a666;background:#241c13;color:#e0c48f}.gc340Room.cleared{border-color:#566a55;color:#9bb19a}.gc340Room:disabled:not(.current){opacity:.72}
 .gc340DungeonStatus{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:7px 0}.gc340DungeonStatus>div{padding:6px;background:#14120f;border:1px solid rgba(255,255,255,.05);border-radius:5px}.gc340DungeonStatus span,.gc340DungeonStatus b{display:block}.gc340DungeonStatus span{font-size:6px;color:#7f7569}.gc340DungeonStatus b{font-size:9px;margin-top:2px}.gc340RoomChoices{display:grid;grid-template-columns:repeat(2,1fr);gap:5px;margin:8px 0}.gc340RoomChoices .card{text-align:left}.gc340RoomChoices b,.gc340RoomChoices small{display:block}.gc340RoomChoices small{font-size:7px;color:#8d8376;margin-top:3px}
 @media(max-width:430px){.gc340FocusGrid{grid-template-columns:1fr}.gc340FocusAction{min-height:72px}.gc340DungeonMap{height:220px}.gc340Room{width:48px}.gc340RoomChoices{grid-template-columns:1fr}}
 @media(max-width:350px){.gc340TownMap{grid-template-columns:1fr 1fr;grid-template-areas:"hall scout" "odd train" "recover recover"}.gc340Place{min-height:68px}.gc340DungeonStatus{grid-template-columns:1fr}}
 `;
 document.head.appendChild(st);
}
gc340InstallStyles();

const _gc199UpdateClockGC340=gc199UpdateClock;
gc199UpdateClock=function(){
 _gc199UpdateClockGC340();
 const pr=state&&gc340Presence(),a=pr?.activity,bar=document.querySelector('[data-gc340-activitybar]');
 if(a&&bar)bar.style.width=`${clamp((1-a.remainingDays/a.durationDays)*100,0,100)}%`;
};

const _gc193DailyDashboardGC340=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC340().replace(/v21\.3\.1\s*•\s*QOL[^<]*/gi,'v21.4 • PRESENCE')};

const _auditGC340=audit;
audit=function(){
 const out=_auditGC340();
 out.v340Presence=GC340_VERSION;
 out.pcPhysicalPresence=true;
 out.townMapFiveLocations=true;
 out.focusedInteractiveStances=true;
 out.founderLocalSupport=GC340_SUPPORT;
 out.progressiveCaptainAutonomy=true;
 out.proceduralPersistentDungeons=true;
 out.dungeonBranchingMap=true;
 out.dungeonBossAndHoard=true;
 out.dungeonRetreatPersistsProgress=true;
 out.dungeonUsesRealCombatAndMortality=true;
 out.playerAttentionIsStrategicResource=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC340_TEST=function(){
 const old=state;
 try{
  state=createState('Presence Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';state.company.silver=400;
  const f=gc260CreateFounderRecord('veyric',{name:'Presence Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);f.status='Ready';f.lvl=10;f.dailyOrder='Scout';
  const p=makeParty('veyric','Delvers'),crew=[];
  for(let i=0;i<3;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=10;state.roster.push(a);crew.push(a)}
  p.members=[f.id,...crew.map(a=>a.id)];p.captainId=f.id;p.missions=5;state.parties.push(p);
  const pr=gc340Presence();gc340Move('scout');
  const town=gc340TownHTML(),townOK=['March Watch','Lantern Market','Muster Yard','Pilgrim House','Greyhaven Chapterhouse'].every(x=>town.includes(x));
  const support=gc340At('Scout','veyric')&&GC340_SUPPORT.Scout>1;
  gc340StartFocused('studyContract');const activityStarted=!!pr.activity;gc340TickFocused(1);const activityFinished=!pr.activity&&pr.focusedCompleted===1;
  const d=gc340DiscoverDungeon('veyric'),generated=!!d&&d.rooms.length>=7&&d.rooms.some(r=>r.type==='boss')&&d.rooms[0].links.length>0;
  const persistent=gc340DungeonById(d.id)===d;
  gc340Move('hall');gc340EnterDungeon(d.id,p.id);
  const entered=!!p.gc340DungeonRun&&p.expedition?.gc340Dungeon&&gc340Presence().mode==='dungeon';
  const map=gc340DungeonMapHTML(d,p.gc340DungeonRun),mapOK=/gc340DungeonMap/.test(map)&&/gc340Room/.test(map);
  const first=d.rooms.find(r=>r.revealed&&r.id!==d.rooms[0].id),adjacent=!!first&&d.rooms[0].links.includes(first.id);
  p.gc340DungeonRun.carriedSilver=25;p.gc340DungeonRun.carriedItems=[generateItem('veyric',1)];
  const invBefore=state.inventory.length,silverBefore=state.company.silver;gc340ExitDungeon(p,'test retreat');
  const retreated=!p.gc340DungeonRun&&!p.expedition&&state.inventory.length===invBefore+1&&state.company.silver===silverBefore+25&&!d.cleared;
  const autoCap=gc340CaptainAutoCap(p)>=3;
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=Array.isArray(copy.regions.veyric.gc340Dungeons)&&!!copy.founderSystem.gc340Presence;
  return{ok:!!(townOK&&support&&activityStarted&&activityFinished&&generated&&persistent&&entered&&mapOK&&adjacent&&retreated&&autoCap&&saveSafe),townOK,support,activityStarted,activityFinished,generated,rooms:d.rooms.length,persistent,entered,mapOK,adjacent,retreated,autoCap,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};
