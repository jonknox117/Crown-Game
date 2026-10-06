/* Grim Company v19.5 — consequential relationships.
   Shared time creates chances for meaningful events; bonds and grudges then
   affect battlefield behavior, enemy reactions, and character history. */
const GC195_VERSION='19.5';

function gc195EnsureRelationRecord(r){
 if(!r)return r;
 if(!Number.isFinite(Number(r.bond)))r.bond=clamp((Number(r.sharedMissions)||0)*4+(Number(r.rescues)||0)*8+Math.round((Number(r.trust)||0)*.15),0,100);
 r.bond=clamp(Number(r.bond)||0,0,100);
 r.memories=Array.isArray(r.memories)?r.memories:[];
 r.gc195Version=GC195_VERSION;
 return r;
}
function gc195InitRelationState(s){
 if(!s)return s;
 const lv=s.livingVeterans||{};
 Object.values(lv.relationships||{}).forEach(gc195EnsureRelationRecord);
 s.relationshipSystem=s.relationshipSystem||{version:GC195_VERSION,recent:[]};
 s.relationshipSystem.version=GC195_VERSION;
 s.relationshipSystem.recent=Array.isArray(s.relationshipSystem.recent)?s.relationshipSystem.recent:[];
 return s;
}
const _bl18RelGC195=bl18Rel;
bl18Rel=function(a,b){return gc195EnsureRelationRecord(_bl18RelGC195(a,b))};

function gc195RelationStage(r,a,b){
 gc195EnsureRelationRecord(r);
 if(r.tension>=72&&r.affinity<=-25)return'Bitter Enemies';
 if(r.tension>=52&&r.respect>=45)return'Professional Rivals';
 if(r.tension>=45&&r.trust<28)return'Grudge';
 if(r.bond>=72&&r.trust>=62)return'Battle-Bound';
 if(r.trust>=76&&r.affinity>=48)return'Close Friends';
 if(r.respect>=58&&Math.abs((a?.lvl||1)-(b?.lvl||1))>=2&&r.trust>=34)return'Mentor & Protégé';
 if(r.respect>=58&&r.affinity<22&&r.tension<45)return'Professional Respect';
 if(r.affinity>=26&&r.trust>=34)return'Friends';
 if(r.affinity<=-28)return'Dislike';
 if(r.respect>=38)return'Respected Companions';
 return'Acquaintances';
}
bl18RelationStage=function(r,a,b){return gc195RelationStage(r,a,b)};

function gc195StageEffect(stage){
 return({
  'Battle-Bound':'Fight as a unit: major Resolve/Guard bonuses; strong protection and retaliation reactions.',
  'Close Friends':'Steadier together and much more likely to react when the other is badly hurt.',
  'Friends':'Small morale benefit when fighting together.',
  'Mentor & Protégé':'The veteran steadies the junior; the junior fights more accurately.',
  'Professional Respect':'Small Accuracy/Guard benefit when assigned together.',
  'Professional Rivals':'Compete aggressively: stronger offense, but increased emotional pressure.',
  'Grudge':'Reduced teamwork and battlefield composure.',
  'Bitter Enemies':'Severe teamwork penalty when forced into the same party.',
  'Dislike':'No direct combat bonus; conflict events are more likely.',
  'Respected Companions':'Competence is recognized even without friendship.',
  'Acquaintances':'No special combat effect.'
 })[stage]||'No special combat effect.';
}

function gc195HasTrait(a,name){return!!((a?.traits||[]).includes(name)||(a?.veteran?.developedTraits||[]).includes(name))}
function gc195PairClash(a,b){
 let n=0;
 if((gc195HasTrait(a,'Hot Temper')&&gc195HasTrait(b,'Stubborn'))||(gc195HasTrait(b,'Hot Temper')&&gc195HasTrait(a,'Stubborn')))n+=3;
 if((gc195HasTrait(a,'Bloodthirsty')&&gc195HasTrait(b,'Kindhearted'))||(gc195HasTrait(b,'Bloodthirsty')&&gc195HasTrait(a,'Kindhearted')))n+=3;
 if((gc195HasTrait(a,'Reckless')&&gc195HasTrait(b,'Cautious'))||(gc195HasTrait(b,'Reckless')&&gc195HasTrait(a,'Cautious')))n+=3;
 if(gc195HasTrait(a,'Greedy')&&gc195HasTrait(b,'Greedy'))n+=1;
 return n;
}
function gc195Adjust(a,b,deltas){
 const r=bl18Rel(a,b),before=gc195RelationStage(r,a,b);
 r.affinity=clamp((Number(r.affinity)||0)+(deltas.affinity||0),-100,100);
 r.trust=clamp((Number(r.trust)||0)+(deltas.trust||0),0,100);
 r.respect=clamp((Number(r.respect)||0)+(deltas.respect||0),0,100);
 r.tension=clamp((Number(r.tension)||0)+(deltas.tension||0),0,100);
 r.bond=clamp((Number(r.bond)||0)+(deltas.bond||0),0,100);
 if(deltas.sharedMissions)r.sharedMissions=(Number(r.sharedMissions)||0)+deltas.sharedMissions;
 if(deltas.rescues)r.rescues=(Number(r.rescues)||0)+deltas.rescues;
 if(typeof bl18SyncLegacy==='function')bl18SyncLegacy(a,b,r);
 return{r,before,after:gc195RelationStage(r,a,b)};
}
function gc195Remember(a,b,text,importance='normal'){
 if(!a||!b||!text)return;
 const r=bl18Rel(a,b),entry={day:state.company.day,text,importance};
 r.memories.push(entry);if(r.memories.length>10)r.memories.splice(0,r.memories.length-10);
 a.history=a.history||[];b.history=b.history||[];
 a.history.push(`Day ${state.company.day}: ${text}`);b.history.push(`Day ${state.company.day}: ${text}`);
 if(a.history.length>40)a.history.splice(0,a.history.length-40);if(b.history.length>40)b.history.splice(0,b.history.length-40);
 state.relationshipSystem=state.relationshipSystem||{version:GC195_VERSION,recent:[]};
 state.relationshipSystem.recent.push({day:state.company.day,regionId:a.regionId,text,importance,a:a.id,b:b.id});
 if(state.relationshipSystem.recent.length>40)state.relationshipSystem.recent.splice(0,state.relationshipSystem.recent.length-40);
 if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id,b.id],importance);
 else pushHistory(text,a.regionId);
}
function gc195ApplyEvent(a,b,deltas,text,importance='normal'){
 const x=gc195Adjust(a,b,deltas);
 const suffix=x.before!==x.after?` Their relationship is now ${x.after}.`:'';
 gc195Remember(a,b,text+suffix,importance==='major'||['Battle-Bound','Bitter Enemies','Close Friends'].includes(x.after)?'major':importance);
 return x;
}

function gc195PairEventChance(a,b,ctx){
 const r=bl18Rel(a,b);let p=ctx.kind==='field'?.12:.065;
 if(ctx.kind==='field')p+=Math.min(.07,(ctx.risk||1)*.012);
 if(a.dailyOrder&&a.dailyOrder===b.dailyOrder)p+=.035;
 if((a.dailyOrder==='Mentor'&&a.dailyMentorId===b.id)||(b.dailyOrder==='Mentor'&&b.dailyMentorId===a.id))p+=.18;
 if(a.status==='Recovering'||b.status==='Recovering')p+=.055;
 if(r.tension>=40||r.trust>=55||r.bond>=45)p+=.035;
 p+=gc195PairClash(a,b)*.012;
 return clamp(p,.035,.42);
}
function gc195RunPairEvent(a,b,ctx){
 if(!a||!b)return false;
 const r=bl18Rel(a,b),clash=gc195PairClash(a,b);
 const mentor=(a.dailyOrder==='Mentor'&&a.dailyMentorId===b.id)?[a,b]:(b.dailyOrder==='Mentor'&&b.dailyMentorId===a.id)?[b,a]:null;
 if(mentor){
   const [m,t]=mentor;
   gc195ApplyEvent(m,t,{trust:5,respect:7,affinity:2,bond:3},`${m.name} spent the day passing hard-earned technique to ${t.name}.`);
   return true;
 }
 if(a.status==='Recovering'||b.status==='Recovering'){
   const hurt=a.status==='Recovering'?a:b,other=hurt===a?b:a;
   if(gc195HasTrait(other,'Kindhearted')||r.trust>=35||chance(.55)){
     gc195ApplyEvent(other,hurt,{trust:6,affinity:4,respect:2,bond:4},`${other.name} stayed with ${hurt.name} through a difficult recovery day.`);
     return true;
   }
 }
 const conflictChance=clamp(.10+clash*.09+r.tension/260-(r.trust||0)/500,.06,.62);
 if(chance(conflictChance)){
   const field=ctx.kind==='field';
   const text=field?`${a.name} and ${b.name} clashed over how to handle danger in the field.`:`${a.name} and ${b.name} had an argument at headquarters that did not blow over quickly.`;
   gc195ApplyEvent(a,b,{affinity:-3-clash,trust:-2,tension:5+clash*2,respect:clash?1:0,bond:field?1:0},text,r.tension>=60?'major':'normal');
   return true;
 }
 if(ctx.kind==='field'){
   if(r.bond>=45||r.trust>=45||chance(.58)){
     gc195ApplyEvent(a,b,{trust:4,respect:3,affinity:2,bond:6},`${a.name} and ${b.name} covered each other's blind sides through a dangerous day on ${ctx.title||'contract'}.`);
   }else{
     gc195ApplyEvent(a,b,{trust:3,respect:4,bond:4},`${a.name} and ${b.name} learned they could rely on each other under field pressure.`);
   }
   return true;
 }
 if(a.dailyOrder==='Train'&&b.dailyOrder==='Train'){
   if(r.tension>=25||chance(.35))gc195ApplyEvent(a,b,{respect:5,tension:2,bond:1},`${a.name} and ${b.name} pushed each other hard in training.`);
   else gc195ApplyEvent(a,b,{respect:4,trust:2,affinity:2,bond:2},`${a.name} and ${b.name} found a productive rhythm training together.`);
   return true;
 }
 if(a.dailyOrder==='Patrol'&&b.dailyOrder==='Patrol'){
   gc195ApplyEvent(a,b,{trust:4,respect:4,bond:3},`${a.name} and ${b.name} worked the same patrol route and came back trusting each other's instincts more.`);return true;
 }
 if(a.dailyOrder==='Scout'&&b.dailyOrder==='Scout'){
   gc195ApplyEvent(a,b,{respect:5,trust:3,bond:2},`${a.name} and ${b.name} compared field signs and discovered they read danger well together.`);return true;
 }
 if(gc195HasTrait(a,'Kindhearted')||gc195HasTrait(b,'Kindhearted')){
   const kind=gc195HasTrait(a,'Kindhearted')?a:b,other=kind===a?b:a;
   gc195ApplyEvent(kind,other,{affinity:4,trust:4,bond:2},`${kind.name} quietly helped ${other.name} through an unpleasant day at headquarters.`);return true;
 }
 if(r.respect>=45){gc195ApplyEvent(a,b,{respect:3,trust:2,bond:1},`${a.name} and ${b.name} traded practical advice and came away respecting each other's competence more.`);return true}
 gc195ApplyEvent(a,b,{affinity:3,trust:2,respect:1,bond:1},`${a.name} and ${b.name} spent enough time together to stop feeling like strangers.`);return true;
}
function gc195Shuffle(xs){return xs.map(x=>({x,n:Math.random()})).sort((a,b)=>a.n-b.n).map(v=>v.x)}
function gc195HQRelationships(){
 REGION_ORDER.forEach(regionId=>{
   const pool=state.roster.filter(a=>a.regionId===regionId&&a.status!=='Dead'&&a.status!=='Expedition'&&a.status!=='Captured');
   if(pool.length<2)return;
   const pairs=[];for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++)pairs.push([pool[i],pool[j]]);
   const cap=Math.min(3,Math.max(1,Math.ceil(pool.length/5)));let events=0;
   for(const [a,b] of gc195Shuffle(pairs)){
     if(events>=cap)break;
     if(chance(gc195PairEventChance(a,b,{kind:'hq'}))&&gc195RunPairEvent(a,b,{kind:'hq'}))events++;
   }
 });
}
function gc195FieldRelationships(p){
 const e=p?.expedition;if(!e)return;
 const members=partyMembers(p).filter(a=>a.status!=='Dead');if(members.length<2)return;
 const pairs=[];for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)pairs.push([members[i],members[j]]);
 for(const [a,b] of gc195Shuffle(pairs)){
   const ctx={kind:'field',risk:e.contract?.risk||1,title:e.contract?.title||'contract'};
   if(chance(gc195PairEventChance(a,b,ctx))){gc195RunPairEvent(a,b,ctx);break}
 }
}

/* Replace the old one-pair random drift with contextual event rolls. */
gc193RelationshipDowntime=function(){gc195HQRelationships()};
const _gc193ProgressExpeditionGC195=gc193ProgressExpedition;
gc193ProgressExpedition=function(p,report){
 if(p?.expedition&&!p.expedition.battle)gc195FieldRelationships(p);
 return _gc193ProgressExpeditionGC195(p,report);
};

/* Completing dangerous work always adds some shared bond even when no discrete
   relationship event fired during the trip. */
const _relationshipAfterMissionGC195=relationshipAfterMission;
relationshipAfterMission=function(p,deaths){
 const ids=(p.members||[]).slice(),members=ids.map(id=>state.roster.find(a=>a.id===id)).filter(Boolean);
 const before=new Map();for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){const a=members[i],b=members[j],r=bl18Rel(a,b);before.set(bl18PairKey(a.id,b.id),gc195RelationStage(r,a,b))}
 const out=_relationshipAfterMissionGC195(p,deaths);
 const risk=p.expedition?.contract?.risk||1;
 for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
   const a=members[i],b=members[j];if(a.status==='Dead'&&b.status==='Dead')continue;
   const x=gc195Adjust(a,b,{bond:2+risk+(deaths?.length?2:0)}),old=before.get(bl18PairKey(a.id,b.id));
   if(old!==x.after)gc195Remember(a,b,`${a.name} and ${b.name} came home from ${p.expedition?.contract?.title||'a contract'} changed by what they survived together. Their relationship is now ${x.after}.`,['Battle-Bound','Close Friends','Bitter Enemies'].includes(x.after)?'major':'normal');
 }
 return out;
};

/* Relationship states now have direct battlefield consequences. */
const _startBattleGC195=startBattle;
startBattle=function(p){
 const out=_startBattleGC195(p),b=p?.expedition?.battle;if(!b)return out;
 for(let i=0;i<b.allies.length;i++)for(let j=i+1;j<b.allies.length;j++){
   const x=b.allies[i],y=b.allies[j],a=state.roster.find(z=>z.id===x.charId),c=state.roster.find(z=>z.id===y.charId);if(!a||!c)continue;
   const stage=gc195RelationStage(bl18Rel(a,c),a,c);
   if(stage==='Battle-Bound'){x.resolve+=3;y.resolve+=3;x.guard+=2;y.guard+=2;x.accuracy+=1;y.accuracy+=1}
   else if(stage==='Close Friends'){x.resolve+=2;y.resolve+=2;x.guard+=1;y.guard+=1}
   else if(stage==='Friends'){x.resolve+=1;y.resolve+=1}
   else if(stage==='Professional Respect'){x.accuracy+=1;y.accuracy+=1;x.guard+=1;y.guard+=1}
 }
 return out;
};

const _bl14ProtectorForGC195=bl14ProtectorFor;
bl14ProtectorFor=function(target,allies){
 const existing=_bl14ProtectorForGC195(target,allies);
 if(existing){
   if(existing.charId&&target?.charId&&existing.charId!==target.charId){const a=state.roster.find(x=>x.id===existing.charId),b=state.roster.find(x=>x.id===target.charId);if(a&&b)gc195Adjust(a,b,{bond:2})}
   return existing;
 }
 if(!target?.charId)return null;
 const defended=state.roster.find(x=>x.id===target.charId);if(!defended)return null;
 const candidates=alive(allies).filter(u=>u.charId!==target.charId).map(u=>({u,a:state.roster.find(x=>x.id===u.charId)})).filter(x=>x.a).map(x=>{const r=bl18Rel(x.a,defended),stage=gc195RelationStage(r,x.a,defended);return{...x,r,stage,score:r.trust+r.bond*.9-r.tension*.6}}).filter(x=>!['Grudge','Bitter Enemies'].includes(x.stage)&&(x.r.trust>=48||x.r.bond>=42)).sort((a,b)=>b.score-a.score);
 const best=candidates[0];if(!best)return null;
 const p=clamp(.08+best.r.trust/420+best.r.bond/520-.08*(best.stage==='Professional Rivals'),.08,.48);
 if(!chance(p))return null;
 gc195ApplyEvent(best.a,defended,{trust:3,respect:3,bond:5,rescues:1},`${best.a.name} threw themselves into danger to protect ${defended.name}.`);
 return best.u;
};

const _enemyAttackGC195=enemyAttack;
enemyAttack=function(actor,target,p){
 const before=target?.hp||0,out=_enemyAttackGC195(actor,target,p),b=p?.expedition?.battle;
 if(!b||!target?.charId||!actor||before<=target.hp)return out;
 const hurt=state.roster.find(x=>x.id===target.charId);if(!hurt)return out;
 const severe=target.hp<=0||target.hp/Math.max(1,target.maxHp)<.38||(before-target.hp)>target.maxHp*.28;if(!severe)return out;
 const reactions=alive(b.allies).filter(u=>u.charId!==target.charId).map(u=>({u,a:state.roster.find(x=>x.id===u.charId)})).filter(x=>x.a).map(x=>{const r=bl18Rel(x.a,hurt),stage=gc195RelationStage(r,x.a,hurt);return{...x,r,stage,score:r.bond+r.trust*.75-r.tension*.3}}).filter(x=>x.r.bond>=38||x.r.trust>=58).sort((a,b)=>b.score-a.score);
 const best=reactions[0];if(!best)return out;
 const trigger=clamp(.15+best.r.bond/260+best.r.trust/520+(target.hp<=0?.14:0),.15,.72);if(!chance(trigger))return out;
 best.u._gc195FuryAgainst=actor.id;best.u._gc195Fury=Math.max(best.u._gc195Fury||0,clamp(.12+best.r.bond/360,.12,.38));best.u.resolve+=2;
 b.log.push(`${best.a.name} reacts to ${hurt.name}'s injury with protective fury against ${actor.name}.`);
 gc195Adjust(best.a,hurt,{bond:2,trust:1});
 return out;
};

const _classDamageMultGC195=classDamageMult;
classDamageMult=function(actor,battle,p,e,target){
 const out=_classDamageMultGC195(actor,battle,p,e,target);
 if(actor?._gc195FuryAgainst&&target?.id===actor._gc195FuryAgainst)out.m*=1+(actor._gc195Fury||.15);
 return out;
};

const _allyAttackGC195=allyAttack;
allyAttack=function(actor,target,p){
 const before=target?.hp||0,out=_allyAttackGC195(actor,target,p),b=p?.expedition?.battle;
 if(!b||!actor?.charId||!target||before<=0||target.hp>0)return out;
 const killer=state.roster.find(x=>x.id===actor.charId);if(!killer)return out;
 const rivals=alive(b.allies).filter(u=>u.charId!==actor.charId&&!u._gc195RivalDrive).map(u=>({u,a:state.roster.find(x=>x.id===u.charId)})).filter(x=>x.a&&gc195RelationStage(bl18Rel(x.a,killer),x.a,killer)==='Professional Rivals');
 if(rivals.length&&chance(.55)){
   const r=pick(rivals);r.u._gc195RivalDrive=true;r.u.attack+=2;r.u.accuracy+=1;
   b.log.push(`${r.a.name} sees ${killer.name}'s kill and refuses to be outdone.`);
   gc195Adjust(r.a,killer,{respect:1,tension:1});
 }
 return out;
};

/* Relationship UI: show bond, gameplay effect, and remembered events. */
bl18Bars=function(r){
 gc195EnsureRelationRecord(r);
 const row=(name,v,cls='')=>`<div class="bl18RelMetric"><span>${name}</span><i><b class="${cls}" style="width:${clamp(v,0,100)}%"></b></i><em>${Math.round(v)}</em></div>`;
 return row('Affinity',(r.affinity+100)/2,'good')+row('Trust',r.trust,'good')+row('Respect',r.respect,'neutral')+row('Bond',r.bond,'bond')+row('Tension',r.tension,'bad');
};
bl18RelationList=function(a){
 const rows=state.roster.filter(b=>b.id!==a.id&&b.status!=='Dead').map(b=>({b,r:bl18Rel(a,b)})).filter(x=>x.r.sharedMissions||x.r.rescues||x.r.affinity!==0||x.r.trust||x.r.tension||x.r.bond).sort((x,y)=>(y.r.bond+y.r.trust+y.r.respect+y.r.tension)-(x.r.bond+x.r.trust+x.r.respect+x.r.tension)).slice(0,10);
 if(!rows.length)return'<div class="tiny muted">No meaningful bonds or grudges yet. Shared days can change that.</div>';
 return rows.map(x=>{const stage=gc195RelationStage(x.r,a,x.b),mem=(x.r.memories||[]).slice(-2).reverse();return`<div class="bl18RelationCard gc195RelCard"><div class="statline"><b>${esc(x.b.name)}</b><span>${esc(stage)}</span></div>${bl18Bars(x.r)}<div class="tiny gc195RelEffect">${esc(gc195StageEffect(stage))}</div><div class="tiny muted">${x.r.sharedMissions||0} shared contracts • ${x.r.rescues||0} protection moments</div>${mem.length?`<div class="gc195Memories">${mem.map(m=>`<div><b>Day ${m.day}</b> — ${esc(m.text)}</div>`).join('')}</div>`:''}</div>`}).join('');
};

const _normalizeStateGC195=normalizeState;
normalizeState=function(s){s=_normalizeStateGC195(s);return gc195InitRelationState(s)};
const _createStateGC195=createState;
createState=function(name){return gc195InitRelationState(_createStateGC195(name))};

const _gc193ShowDayReportGC195=gc193ShowDayReport;
gc193ShowDayReport=function(r){
 if(!r)return _gc193ShowDayReportGC195(r);
 const recent=(state.relationshipSystem?.recent||[]).filter(x=>!x.reported&&x.day>=r.from&&x.day<=r.to);
 recent.forEach(x=>x.reported=true);
 if(!recent.length)return _gc193ShowDayReportGC195(r);
 const next={...r,lines:[...(r.lines||[]),...recent.slice(-5).map(x=>`RELATIONSHIP — ${x.text}`)]};save();return _gc193ShowDayReportGC195(next);
};

const _auditGC195=audit;
audit=function(){const out=_auditGC195();out.relationshipEngine=GC195_VERSION;out.relationshipDailyEvents=true;out.relationshipBond=true;out.relationshipBattleBehavior=true;return out};
