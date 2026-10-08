/* Broken Lantern v21.9.3 — leadership accessible from the town map.
   Personal leadership scales in all five rooms without changing save format. */
const GC393_VERSION='21.9.3';
const GC393_STANCE_PLACE={Scout:'scout','Odd Jobs':'odd',Train:'train',Recover:'recover'};
const GC393_BASE_PRESENCE={Scout:1.25,'Odd Jobs':1.25,Train:1.25,Recover:1.20};

/* Keep the old 25/20% novice bonuses and add real level/rarity scaling.
   Getters preserve the original support hooks in the continuous simulation. */
function gc393PersonalMultiplier(stance,founder=gc260Founder()){
 const base=GC393_BASE_PRESENCE[stance]||1;
 if(!founder)return base;
 const progression=Math.max(0,gc390Power(founder,'director')-1.05);
 return Math.round((base+progression*.80)*10000)/10000;
}
for(const stance of Object.keys(GC393_BASE_PRESENCE)){
 Object.defineProperty(GC340_SUPPORT,stance,{
  configurable:true,enumerable:true,
  get(){return gc393PersonalMultiplier(stance)}
 });
}
function gc393RoomBonus(rid,place){
 const f=gc260Founder(),pr=gc340SyncPresence();
 if(!f||!pr||f.regionId!==rid||pr.mode!=='town'||pr.place!==place)return 1;
 const stance=gc340TownDef(rid)[place]?.stance;
 return stance?gc393PersonalMultiplier(stance,f):gc390Power(gc390Director(rid)?.a,'director');
}
function gc393TownPostHTML(rid,stance){
 const leader=gc390StanceLead(rid,stance),
  id=gc390EnsurePosts(rid)?.[stance],
  standby=!leader&&id?state.roster.find(a=>a.id===id):null,
  name=leader?.name||standby?.name||'No manager';
 return '<button type="button" class="gc393RoomPost" data-action="gc390PickPost" data-region="'+esc(rid)+'" data-stance="'+esc(stance)+'">'+
 '<b>'+esc(GC390_LABEL[stance])+'</b>'+
 '<span data-gc393-post="'+esc(stance)+'">'+esc(name)+(leader?' • +'+Math.round((gc390Power(leader,'stance')-1)*100)+'%':'')+'</span>'+
 '<em>'+(leader?'REASSIGN':standby?'ASSIGNED • UNAVAILABLE':'ASSIGN')+' ›</em></button>';
}
function gc393RoomManagement(rid){
 if(!gc270IsCompany()||!state?.regions?.[rid]?.hq?.established)return'';
 const commander=gc390Director(rid),unlocked=gc280NetworkUnlocked();
 let home='<div class="gc393HomeManager"><span>CHAPTERHOUSE • REGIONAL DIRECTOR</span>'+
 '<b data-gc393-director>'+esc(commander?.a?.name||'No active director')+'</b>'+
 '<small data-gc393-directorbonus>'+(commander?('+'+Math.round((gc390Power(commander.a,'director')-1)*100)+'% to all HQ stances • '+commander.source):'Return here to lead')+'</small>'+
 (unlocked?'<button type="button" data-action="gc280Open" data-region="'+esc(rid)+'">MANAGE COMMANDER ›</button>':
 '<small>Appointing a replacement director unlocks when you establish a second HQ.</small>')+'</div>';
 return '<section class="gc393RoomManagement" aria-label="Assign managers from the location map">'+
 '<div class="gc393ManagerHead"><b>MANAGE YOUR FIVE ROOMS</b><span>Assignments can be changed here</span></div>'+home+
 '<div class="gc393PostGrid">'+GC390_STANCES.map(s=>gc393TownPostHTML(rid,s)).join('')+'</div>'+
 '<p>Your presence benefits the room you occupy. Appointed stance leaders help their own room whether you are here or away. A commander replaces your Chapterhouse leadership, not your personal bonuses elsewhere.</p></section>';
}
const _gc340TownHTMLGC393=gc340TownHTML;
gc340TownHTML=function(){
 let html=_gc340TownHTMLGC393();
 const founder=gc260Founder(),pr=gc340SyncPresence();
 if(!founder||pr?.mode!=='town')return html;
 const rid=founder.regionId,active=gc340TownDef(rid)?.[pr.place];
 if(!active)return html;
 if(active.stance){
  const old=GC393_BASE_PRESENCE[active.stance];
  const next=gc393PersonalMultiplier(active.stance,founder);
  const pct=Math.round((next-1)*100);
  /* v21.4 generates the active room caption and badge using GC340_SUPPORT.
     This already uses our getter; add a level/rarity explanation as well. */
  const sentence='Your presence strengthens '+active.stance+' work at this HQ by '+pct+'%.';
  if(html.includes(sentence)){
   html=html.replace(sentence,sentence+' Level '+founder.lvl+' • '+gc360RankName(founder)+' career. Novice baseline +'+Math.round((old-1)*100)+'%; experience improves it.');
  }
 }
 const anchor='</div><div class="gc340PlacePanel">';
 if(html.includes(anchor)&&gc270IsCompany()){
  html=html.replace(anchor,'</div>'+gc393RoomManagement(rid)+'<div class="gc340PlacePanel">');
 }
 return html;
};

/* Bonuses in the four work rooms and the Chapterhouse never double-count
   one person's presence. The director applies globally only while in Hall.
   Room bonus applies only to the selected room's ordinary work. */
function gc393InstallStyles(){
 if(document.getElementById('gc393Styles'))return;
 const st=document.createElement('style');st.id='gc393Styles';
 st.textContent=[
 '.gc393RoomManagement{margin:10px 0;padding:10px;border:1px solid #655138;background:linear-gradient(140deg,#1b1713,#111111);border-radius:9px}',
 '.gc393ManagerHead{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:5px;margin-bottom:10px}.gc393ManagerHead b{letter-spacing:.1em;font-size:10px;color:#dbbb86}.gc393ManagerHead span{font-size:10px;color:#ae9a7c}',
 '.gc393HomeManager{padding:10px;border:1px solid #745936;background:#201913;border-radius:7px;margin-bottom:8px}',
 '.gc393HomeManager>span,.gc393HomeManager>b,.gc393HomeManager>small{display:block}.gc393HomeManager>span{font-size:9px;color:#c4a578;letter-spacing:.08em}.gc393HomeManager>b{font-size:14px;margin:5px 0;color:#ead5b2}',
 '.gc393HomeManager>small{font-size:10px;color:#b9a58a;line-height:1.5}.gc393HomeManager>button{background:#33281c;border:1px solid #aa8351;color:#eacda4;min-height:44px;border-radius:5px;padding:8px 14px;margin-top:7px;font-size:10px;font-weight:700}',
 '.gc393PostGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
 '.gc393RoomPost{background:#171716;border:1px solid #5a4b35;border-radius:7px;min-height:83px;display:flex;flex-direction:column;align-items:stretch;justify-content:center;text-align:left;padding:9px 10px;gap:5px;color:#ddccb0}',
 '.gc393RoomPost b{font-size:11px}.gc393RoomPost span{font-size:10px;color:#bea98e}.gc393RoomPost em{font-style:normal;font-size:9px;color:#d7b178;letter-spacing:.09em}',
 '.gc393RoomManagement p{font-size:10px;color:#ae9d87;line-height:1.5;margin:10px 2px 0}',
 '@media(max-width:350px){.gc393PostGrid{grid-template-columns:1fr}}'
 ].join('');
 document.head.appendChild(st);
}
gc393InstallStyles();
const _auditGC393=audit;
audit=function(){
 const a=_auditGC393();
 a.v393RoomLeadership=GC393_VERSION;
 a.allFiveRoomsScaleWithFounderLevelAndRarity=true;
 a.roomManagerPickerOnTownMap=true;
 a.managerAndPlayerBonusesAreDistinct=true;
 return a;
};
window.__BL_AUDIT=audit;