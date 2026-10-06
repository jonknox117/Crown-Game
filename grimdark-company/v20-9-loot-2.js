/* Grim Company v20.9 — equipment field hooks. */
function gc290FindPower(a,id){let hit=null;gc290EachPower(a,(p,item)=>{if(!hit&&p.id===id)hit={p,item}});return hit}
function gc290PowerMatches(a,trigger){const out=[];gc290EachPower(a,(p,item)=>{if(p.trigger===trigger)out.push({p,item})});return out}
function gc290FieldSnapshot(p){
 const e=p?.expedition;
 return{
  hp:new Map(partyMembers(p).map(a=>[a.id,a.hp])),
  contact:Number(e?.gc250ContactMod)||0,
  horror:Number(e?.horrorPressure)||0,
  pay:Number(e?.payBonus)||0,
  cache:Number(e?.contract?.cacheChance)||0
 };
}
function gc290FieldActor(p,ch){return state.roster.find(a=>p.members.includes(a.id)&&a.name===ch?.name)||null}
function gc290AfterFieldResult(p,ch,snap){
 const e=p?.expedition,a=gc290FieldActor(p,ch);
 if(!e||!a||!ch)return;
 const powers=[];gc290EachPower(a,(pow,item)=>powers.push({pow,item}));
 if(ch.ok){
  powers.forEach(({pow})=>{
   if(pow.trigger==='fieldSuccessTalk'&&ch.key==='talk'){
    e.payBonus=(Number(e.payBonus)||0)+(Number(pow.pay)||0);
    e.events.push(pow.name+' increases the contract payment.');
   }
   if(pow.trigger==='fieldSuccessScout'&&ch.key==='scout'){
    e.gc250ContactMod=(Number(e.gc250ContactMod)||0)+(Number(pow.contact)||0);
    e.events.push(pow.name+' finds a safer line through the region.');
   }
   if(pow.trigger==='fieldSuccess'||(pow.trigger==='fieldSuccessOccult'&&ch.key==='occult')){
    e.contract.cacheChance=clamp((Number(e.contract.cacheChance)||0)+(Number(pow.cache)||0),0,.98);
    e.events.push(pow.name+' improves the chance of finding something valuable.');
   }
  });
 }else{
  powers.forEach(({pow})=>{
   if(pow.trigger==='fieldFailOccult'&&ch.key==='occult'&&e.horrorPressure>snap.horror){
    e.horrorPressure=snap.horror;e.events.push(pow.name+' seals the supernatural backlash.');
   }
   if(pow.trigger==='fieldFailureSoften'){
    e.gc290Used=e.gc290Used||{};
    if(e.gc290Used[pow.id])return;
    e.gc290Used[pow.id]=true;
    partyMembers(p).forEach(m=>{
     const before=snap.hp.get(m.id);
     if(Number.isFinite(before)&&m.hp<before)m.hp=Math.min(before,m.hp+Math.ceil((before-m.hp)/2));
    });
    e.gc250ContactMod=snap.contact+(Number(e.gc250ContactMod||0)-snap.contact)*.5;
    e.horrorPressure=snap.horror+(Number(e.horrorPressure||0)-snap.horror)*.5;
    e.events.push(pow.name+' turns the worst of the failure aside.');
   }
  });
 }
}
const _fieldCheckGC290=fieldCheck;
fieldCheck=function(p){
 const before=p?.expedition?.checks?.length||0,snap=gc290FieldSnapshot(p),out=_fieldCheckGC290(p),e=p?.expedition;
 if(e&&e.checks.length>before)gc290AfterFieldResult(p,e.checks[e.checks.length-1],snap);
 return out;
};
if(typeof gc260ResolveFieldRoll==='function'){
 const _gc260ResolveFieldRollGC290=gc260ResolveFieldRoll;
 gc260ResolveFieldRoll=function(p,d,actor){
  const before=p?.expedition?.checks?.length||0,snap=gc290FieldSnapshot(p),out=_gc260ResolveFieldRollGC290(p,d,actor),e=p?.expedition;
  if(e&&e.checks.length>before)gc290AfterFieldResult(p,e.checks[e.checks.length-1],snap);
  return out;
 };
}
