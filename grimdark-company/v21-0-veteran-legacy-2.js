/* Grim Company v21.0 — Veteran Legacy event hooks. */
function gc300RecordFieldCheck(p,ch){
 if(!p||!ch||ch.name==='Direct order')return;
 const a=state.roster.find(x=>p.members.includes(x.id)&&x.name===ch.name);if(!a)return;
 const l=gc300Legacy(a);if(ch.ok)l.fieldSuccess++;else l.fieldFailure++;gc300Evaluate(a);
}
const _fieldCheckGC300=fieldCheck;
fieldCheck=function(p){
 const before=p?.expedition?.checks?.length||0,out=_fieldCheckGC300(p),e=p?.expedition;
 if(e&&e.checks.length>before)gc300RecordFieldCheck(p,e.checks[e.checks.length-1]);
 return out;
};
if(typeof gc260ResolveFieldRoll==='function'){
 const _gc260ResolveFieldRollGC300=gc260ResolveFieldRoll;
 gc260ResolveFieldRoll=function(p,d,actor){
  const before=p?.expedition?.checks?.length||0,out=_gc260ResolveFieldRollGC300(p,d,actor),e=p?.expedition;
  if(e&&e.checks.length>before)gc300RecordFieldCheck(p,e.checks[e.checks.length-1]);
  return out;
 };
}

const _resolveBattleGC300=resolveBattle;
resolveBattle=function(p,win){
 const e=p?.expedition,b=e?.battle;
 if(!b)return _resolveBattleGC300(p,win);
 const snapshot=b.allies.map(u=>({id:u.charId,down:u.hp<=0,hp:u.hp,max:u.maxHp}));
 const title=e.contract?.title||'an expedition';
 const out=_resolveBattleGC300(p,win);
 snapshot.forEach(s=>{
  const a=state.roster.find(x=>x.id===s.id);if(!a)return;
  const l=gc300Legacy(a);
  if(s.down)l.nearDeaths++;
  if(a.status==='Recovering'&&a.injury){
   l.injuries++;
   if(s.down)gc300MaybeScar(a,`surviving ${title}`);
  }
  if(a.status==='Dead')gc300Memorial(a,title);
  gc300Evaluate(a);
 });
 save();return out;
};

const _gc193FinishNoTimeGC300=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition;
 if(!e||e.gc300LegacyRecorded)return _gc193FinishNoTimeGC300(p);
 e.gc300LegacyRecorded=true;
 const c=e.contract||{},ids=(p.members||[]).slice(),win=e.battleWon!==false,founderPresent=ids.includes(state.company.founderId);
 const snap={
  title:c.title||'Contract',regionId:c.regionId,risk:Number(c.risk)||1,campaign:!!c.gc240CampaignId,
  boss:c.gc240BossName||null,finale:!!c.gc240BossName,partyId:p.id,partyName:p.name,captainId:p.captainId,
  legendary:new Map(ids.map(id=>{const a=state.roster.find(x=>x.id===id),names=[];if(a)gearItems(a).forEach(i=>{if(i?.gc291Legendary)names.push(i.name)});return[id,names]}))
 };
 const out=_gc193FinishNoTimeGC300(p);
 ids.forEach(id=>{
  const a=state.roster.find(x=>x.id===id);if(!a)return;
  const l=gc300Legacy(a);
  l.contracts++;if(win)l.wins++;else l.failures++;
  if(win&&snap.risk===5)l.risk5++;
  if(snap.campaign)l.campaignOps++;
  if(win&&snap.finale){l.campaigns++;gc300RecordBoss(a,snap.boss)}
  if(id===snap.captainId)l.captainMissions++;
  if(founderPresent&&id!==state.company.founderId)l.withFounder++;
  l.regions[snap.regionId]=(l.regions[snap.regionId]||0)+1;
  l.parties[snap.partyId]=(l.parties[snap.partyId]||0)+1;
  (snap.legendary.get(id)||[]).forEach(name=>l.legendaryItems[name]=(l.legendaryItems[name]||0)+1);
  gc300Evaluate(a);
 });
 save();return out;
};

const _gc200ContinuousWorkGC300=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){
 const out=_gc200ContinuousWorkGC300(deltaDays);
 if(deltaDays>0&&typeof gc280Commander==='function'){
  REGION_ORDER.forEach(id=>{
   const a=gc280Commander(id);if(!a||a.status!=='Command')return;
   const l=gc300Legacy(a),before=Math.floor(l.commandDays);l.commandDays+=deltaDays;
   if(Math.floor(l.commandDays)!==before)gc300Evaluate(a);
  });
 }
 return out;
};
