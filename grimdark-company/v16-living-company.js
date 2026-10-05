/* Broken Lantern v16 — Living Company Pass.
   Deepens existing relationships/history/mission/world systems without adding micromanagement. */

const _normalizeStateV16=normalizeState;
normalizeState=function(s){
 s=_normalizeStateV16(s); if(!s)return s;
 s.livingCompany=s.livingCompany||{events:[],pairMilestones:{},version:16};
 s.livingCompany.events=s.livingCompany.events||[];
 s.livingCompany.pairMilestones=s.livingCompany.pairMilestones||{};
 s.livingCompany.version=16;
 const all=[...(s.roster||[])];
 REGION_ORDER.forEach(id=>all.push(...(s.regions?.[id]?.recruits||[])));
 all.forEach(a=>bl16InitAdventurer(a));
 return s;
};
const _createStateV16=createState;
createState=function(name){
 const s=_createStateV16(name);
 s.livingCompany={events:[],pairMilestones:{},version:16};
 (s.roster||[]).forEach(a=>bl16InitAdventurer(a));
 REGION_ORDER.forEach(id=>(s.regions[id].recruits||[]).forEach(a=>bl16InitAdventurer(a)));
 return s;
};

function bl16InitAdventurer(a){
 if(!a)return a;
 if(!a.nickname)a.nickname='';
 a.legacy=a.legacy||{};
 a.legacy.closeCalls=a.legacy.closeCalls||0;
 a.legacy.legendaryKills=a.legacy.legendaryKills||0;
 a.legacy.rescues=a.legacy.rescues||0;
 a.storyFlags=a.storyFlags||[];
 a.history=a.history||[];
 return a;
}
function bl16LC(){
 state.livingCompany=state.livingCompany||{events:[],pairMilestones:{},version:16};
 return state.livingCompany;
}
function bl16PairKey(a,b){return[a,b].sort().join('|')}
function bl16Record(text,regionId=state.currentRegion,memberIds=[],importance='normal'){
 const lc=bl16LC();
 const ev={id:uid('story'),day:state.company.day,regionId,text,memberIds:[...memberIds],importance};
 lc.events.push(ev);if(lc.events.length>160)lc.events.splice(0,lc.events.length-160);
 memberIds.forEach(id=>{const a=state.roster.find(x=>x.id===id);if(a){bl16InitAdventurer(a);a.history.push(`Day ${state.company.day}: ${text}`);if(a.history.length>40)a.history.splice(0,a.history.length-40)}});
 if(importance==='major')pushHistory(text,regionId);
 if(lc.currentMissionMemberIds?.some(id=>memberIds.includes(id))){lc.currentMissionBeats=lc.currentMissionBeats||[];if(!lc.currentMissionBeats.includes(text))lc.currentMissionBeats.push(text)}
 return ev;
}
function bl16Nickname(a){return a?.nickname?`${a.name} “${a.nickname}”`:a?.name||''}
function bl16MaybeNickname(a){
 if(!a||a.nickname||a.status==='Dead')return;
 bl16InitAdventurer(a);
 if((a.missions||0)<7&&(a.kills||0)<10&&(a.legacy.closeCalls||0)<2)return;
 let nick='Old Hand';
 if(a.legacy.closeCalls>=2)nick='Death-Cheated';
 else if(a.traits?.includes('Haunted'))nick='Ghost-Eyed';
 else if(a.traits?.includes('Kindhearted'))nick='Goodheart';
 else if(a.traits?.includes('Bloodthirsty'))nick='Redhand';
 else if(a.traits?.includes('Bad Knee'))nick='Crooked Step';
 else if((a.kills||0)>=16)nick='Grimhand';
 else if(a.className==='Crossbowman')nick='Bolt';
 else if(['Knight-Errant','Shieldthane','Lumen Guard'].includes(a.className))nick='Ironwall';
 else if(a.className==='Houndmaster')nick='Hound-Friend';
 else if(['March Ranger','Yumi Archer','Shinobi'].includes(a.className))nick='Far-Eye';
 a.nickname=nick;
 bl16Record(`${a.name} earned the name “${nick}”.`,a.regionId,[a.id],'major');
}
function bl16RelationStage(v){
 if(v>=60)return'Blood-Bound';
 if(v>=35)return'Trusted Friends';
 if(v<=-55)return'Bitter Rivals';
 if(v<=-30)return'Rivals';
 return'';
}
function bl16CheckPairMilestone(a,b){
 if(!a||!b)return;
 const v=relValue(a.id,b.id),stage=bl16RelationStage(v);if(!stage)return;
 const lc=bl16LC(),key=`${bl16PairKey(a.id,b.id)}:${stage}`;
 if(lc.pairMilestones[key])return;
 lc.pairMilestones[key]=state.company.day;
 const positive=v>0;
 bl16Record(`${a.name} and ${b.name} became ${stage.toLowerCase()}${positive?' after surviving together.':'.'}`,a.regionId,[a.id,b.id],Math.abs(v)>=55?'major':'normal');
}
function bl16PairEvent(a,b,regionId){
 if(!a||!b)return;
 const v=relValue(a.id,b.id),diff=Math.abs((a.lvl||1)-(b.lvl||1));
 let text='',delta=0;
 if(diff>=2&&v>=15){
  const senior=(a.lvl||1)>(b.lvl||1)?a:b,junior=senior===a?b:a;
  text=`${senior.name} spent the evening drilling ${junior.name} on the mistakes that nearly got them killed.`;delta=3;
 }else if(v>=20){
  text=pick([`${a.name} and ${b.name} shared the last decent ration without arguing.`,`${a.name} repaired ${b.name}'s kit before anyone asked.`,`${a.name} and ${b.name} took the same watch and talked until dawn.`]);delta=rnd(2,4);
 }else if(v<=-18){
  text=pick([`${a.name} and ${b.name} nearly came to blows over the division of salvage.`,`${a.name} openly blamed ${b.name} for the last retreat.`,`${a.name} and ${b.name} refused to share a table at the chapterhouse.`]);delta=-rnd(2,5);
 }else{
  text=pick([`${a.name} and ${b.name} traded stories over bad ale.`,`${a.name} helped ${b.name} clean blood from their equipment.`,`${a.name} and ${b.name} argued about the safest route home, then laughed about it.`]);delta=rnd(1,3);
 }
 setRel(a.id,b.id,clamp(v+delta,-100,100));
 bl16Record(text,regionId,[a.id,b.id]);
 bl16CheckPairMilestone(a,b);
}

const _relationshipAfterMissionV16=relationshipAfterMission;
relationshipAfterMission=function(p,deaths){
 _relationshipAfterMissionV16(p,deaths);
 const members=p.members.map(id=>state.roster.find(a=>a.id===id)).filter(Boolean);
 for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++)bl16CheckPairMilestone(members[i],members[j]);
 if(members.length>=2&&chance(.58)){
  const a=pick(members.filter(x=>x.status!=='Dead'));
  const choices=members.filter(x=>a&&x.id!==a.id&&x.status!=='Dead');
  if(a&&choices.length)bl16PairEvent(a,pick(choices),p.regionId);
 }
 members.forEach(bl16MaybeNickname);
};

const _relationshipDayV16=relationshipDay;
relationshipDay=function(){
 _relationshipDayV16();
 if(!state||!chance(.16))return;
 const local=state.roster.filter(a=>a.status==='Ready'&&a.regionId===state.currentRegion);
 if(local.length<2)return;
 const a=pick(local),b=pick(local.filter(x=>x.id!==a.id));if(a&&b)bl16PairEvent(a,b,a.regionId);
};

const _grantXPV16=grantXP;
grantXP=function(a,n){
 const before=a?.lvl||1,r=_grantXPV16(a,n);
 if(a&&a.lvl>before){bl16Record(`${a.name} reached Level ${a.lvl}.`,a.regionId,[a.id],'major');bl16MaybeNickname(a)}
 return r;
};

const _startBattleV16=startBattle;
startBattle=function(p){
 _startBattleV16(p);
 const b=p.expedition?.battle;if(!b)return;
 let bonds=0,rivals=0,mentors=0;
 for(let i=0;i<b.allies.length;i++)for(let j=i+1;j<b.allies.length;j++){
  const x=b.allies[i],y=b.allies[j],a=state.roster.find(z=>z.id===x.charId),c=state.roster.find(z=>z.id===y.charId);if(!a||!c)continue;
  const v=relValue(a.id,c.id);
  if(v>=45){x.resolve+=3;y.resolve+=3;x.guard+=2;y.guard+=2;bonds++;b.log.push(`${a.name} and ${c.name} fight as trusted companions (+Resolve, +Guard).`)}
  else if(v<=-35){x.attack+=2;y.attack+=2;x.resolve=Math.max(1,x.resolve-1);y.resolve=Math.max(1,y.resolve-1);rivals++;b.log.push(`${a.name} and ${c.name} push each other recklessly (+Attack, -Resolve).`)}
  const hi=(a.lvl||1)>=(c.lvl||1)+2?a:(c.lvl||1)>=(a.lvl||1)+2?c:null;
  if(hi&&v>=20){const low=hi===a?y:x;low.accuracy+=3;low.speed+=1;mentors++;b.log.push(`${hi.name}'s experience steadies ${hi===a?c.name:a.name}.`)}
 }
 b._living={bonds,rivals,mentors};
};

const BL16_MISSION_HINTS={
 Hunt:'SCOUT success improves the opening strike.',
 Rescue:'TALK/SCOUT success protects captives and improves local Stability.',
 Escort:'ENDURE success reduces road attrition.',
 Defense:'ENDURE success weakens the enemy assault.',
 Retrieval:'SNEAK success improves cache recovery odds.',
 Investigation:'OCCULT/SCOUT success exposes enemy weaknesses.',
 Extermination:'SCOUT success improves the opening engagement.',
 Negotiation:'TALK success can reduce the force that must be fought.',
 Exploration:'SCOUT success improves cache discovery.',
 Siege:'ENDURE/SCOUT success strips enemy defenses.',
 Assassination:'SNEAK success removes part of the target’s screen.',
 Caravan:'ENDURE/TALK success protects trade and reduces attrition.'
};
function bl16MissionBeat(e,text){e.storyBeats=e.storyBeats||[];if(!e.storyBeats.includes(text))e.storyBeats.push(text);e.events.push(text)}
const _fieldCheckV16=fieldCheck;
fieldCheck=function(p){
 const e=p.expedition;if(!e)return _fieldCheckV16(p);
 const before=e.checks.length;_fieldCheckV16(p);
 if(e.checks.length===before)return;
 const c=e.contract,ch=e.checks[e.checks.length-1];if(!ch||e.livingTypeBonus)return;
 if(!ch.ok){bl16MissionBeat(e,`${c.type.toUpperCase()} — the failed ${ch.key} check leaves the party without a clean advantage.`);return}
 let text='';
 switch(c.type){
  case'Hunt':e.opening=(e.opening||0)+.07;text='HUNT — the quarry is found before it can choose the ground.';break;
  case'Rescue':state.regions[c.regionId].stability=clamp(state.regions[c.regionId].stability+1,0,100);e.payBonus=(e.payBonus||0)+.03;text='RESCUE — the missing are located before the enemy can move them.';break;
  case'Escort':case'Caravan':e.attritionGuard=(e.attritionGuard||0)+.12;text=`${c.type.toUpperCase()} — the party finds a safer route and preserves its strength.`;break;
  case'Defense':e.enemyDebuff=(e.enemyDebuff||0)+.06;text='DEFENSE — the party prepares the ground before the assault.';break;
  case'Retrieval':c.cacheChance=clamp((c.cacheChance||.3)+.15,0,.95);text='RETRIEVAL — a hidden salvage route is marked for the return trip.';break;
  case'Investigation':e.enemyDebuff=(e.enemyDebuff||0)+.08;c.unknown=Math.max(0,(c.unknown||0)-1);text='INVESTIGATION — the threat is understood before steel is drawn.';break;
  case'Extermination':e.opening=(e.opening||0)+.05;text='EXTERMINATION — the nest is approached from the weak side.';break;
  case'Negotiation':c.enemyCount=Math.max(1,c.enemyCount-1);e.payBonus=(e.payBonus||0)+.04;text='NEGOTIATION — part of the opposition stands down before the fight.';break;
  case'Exploration':c.cacheChance=clamp((c.cacheChance||.3)+.14,0,.95);text='EXPLORATION — the party marks an untouched cache site.';break;
  case'Siege':e.enemyDebuff=(e.enemyDebuff||0)+.08;text='SIEGE — weak points are found in the enemy position.';break;
  case'Assassination':c.enemyCount=Math.max(1,c.enemyCount-1);e.opening=(e.opening||0)+.08;text='ASSASSINATION — one layer of the target’s protection is bypassed.';break;
 }
 if(text){e.livingTypeBonus=true;bl16MissionBeat(e,text)}
};

const _resolveBattleV16=resolveBattle;
resolveBattle=function(p,win){
 const b=p.expedition?.battle;
 const downed=b?b.allies.filter(u=>u.hp<=0).map(u=>u.charId):[];
 const result=_resolveBattleV16(p,win);
 downed.forEach(id=>{const a=state.roster.find(x=>x.id===id);if(a&&a.status!=='Dead'&&a.status!=='Captured'){bl16InitAdventurer(a);a.legacy.closeCalls++;bl16Record(`${a.name} was carried home after going down in battle.`,a.regionId,[a.id]);bl16MaybeNickname(a)}});
 return result;
};

const _finishExpeditionV16=finishExpedition;
finishExpedition=function(p){
 const e=p.expedition;if(!e)return _finishExpeditionV16(p);
 const c=e.contract,r=state.regions[c.regionId],members=p.members.slice();
 const lc=bl16LC();
 lc.currentMissionMemberIds=members.slice();lc.currentMissionBeats=[];
 lc.reportContext={partyId:p.id,regionId:c.regionId,type:c.type,title:c.title,storyBeats:[...(e.storyBeats||[])],pre:{threat:r.threat,stability:r.stability,prosperity:r.prosperity},legendaryKilled:!!e.legendaryKilled,memberIds:members.slice(),retreated:!!e.retreated};
 if(e.legendaryKilled&&e.battleWon!==false){members.forEach(id=>{const a=state.roster.find(x=>x.id===id);if(a){bl16InitAdventurer(a);a.legacy.legendaryKills++;}});bl16Record(`${p.name} brought down a legendary threat on ${c.title}.`,c.regionId,members,'major')}
 return _finishExpeditionV16(p);
};

const _processWorldDayV16=processWorldDay;
processWorldDay=function(){
 const before={};REGION_ORDER.forEach(id=>before[id]={threat:state.regions[id].threat,stability:state.regions[id].stability,prosperity:state.regions[id].prosperity,settlements:state.regions[id].settlements});
 _processWorldDayV16();
 REGION_ORDER.forEach(id=>{const a=before[id],r=state.regions[id],name=REGION_DEFS[id].name;
  if(a.threat<70&&r.threat>=70)bl16Record(`${name} entered severe threat conditions. Trade and civilian confidence begin to erode.`,id,[],'major');
  if(a.threat<90&&r.threat>=90)bl16Record(`${name} is near collapse. Settlements can now be lost rapidly.`,id,[],'major');
  if(a.stability>=40&&r.stability<40)bl16Record(`${name} recruitment became unstable as local confidence broke down.`,id,[],'major');
  if(a.prosperity>=35&&r.prosperity<35)bl16Record(`${name} markets slipped into scarcity.`,id,[],'major');
  if(r.settlements<a.settlements)bl16Record(`${name} lost a settlement. The map is getting smaller.`,id,[],'major');
 });
};

function bl16RegionConsequence(id){
 const r=state.regions[id],bits=[];
 if(r.threat>=90)bits.push('SETTLEMENT LOSS IMMINENT');else if(r.threat>=70)bits.push('trade & stability under pressure');else if(r.threat<30)bits.push('roads relatively secure');
 if(r.stability<40)bits.push('thin recruit pool');else if(r.stability>=75)bits.push('strong recruitment');
 if(r.prosperity<35)bits.push('scarce market');else if(r.prosperity>=75)bits.push('high-grade market stock');
 return bits.join(' • ');
}
const _regionCardV16=regionCard;
regionCard=function(id){let html=_regionCardV16(id),txt=bl16RegionConsequence(id);if(!txt)return html;return html.replace('<div class="actions">',`<div class="bl16WorldConsequence">${esc(txt)}</div><div class="actions">`)};

const _contractCardV16=contractCard;
contractCard=function(c){let html=_contractCardV16(c),hint=BL16_MISSION_HINTS[c.type]||'';if(!hint)return html;return html.replace('<div class="actions">',`<div class="bl16MissionHint"><b>${esc(c.type.toUpperCase())}</b> — ${esc(hint)}</div><div class="actions">`)};

const _unitHTMLV16=unitHTML;
unitHTML=function(u){
 let html=_unitHTMLV16(u),detail='';
 if(u.charId)detail=`${bl14Formation(u)} • ${u.className||'Adventurer'}`;else detail=`${u.role||'Enemy'}${u.species?` • ${u.species}`:''}`;
 if(u._lastTargetReason)detail+=` • targeted: ${u._lastTargetReason}`;
 const idx=html.lastIndexOf('</div>');if(idx<0)return html;
 return html.slice(0,idx)+`<div class="bl16UnitMeta">${esc(detail)}</div>`+html.slice(idx);
};
const _battleHTMLV16=battleHTML;
battleHTML=function(b){
 const a=b._assessment,lc=b._living||{};
 const pulse=a?`<div class="bl16BattleRead"><b>${esc(a.label)}</b><span>${a.ratio.toFixed(2)}× effective strength</span><span>${lc.bonds||0} bond${lc.bonds===1?'':'s'} active${lc.rivals?` • ${lc.rivals} rivalry`:''}</span></div>`:'';
 return pulse+_battleHTMLV16(b);
};

const _rosterCardV16=rosterCard;
rosterCard=function(a){let html=_rosterCardV16(a);if(a.nickname)html=html.replace(`<h4>${esc(a.name)}</h4>`,`<h4>${esc(a.name)} <span class="bl16Nick">“${esc(a.nickname)}”</span></h4>`);return html};
const _renderInspectV16=renderInspect;
renderInspect=function(id,recruit=false){
 _renderInspectV16(id,recruit);if(recruit)return;
 const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');if(!a||!sheet)return;bl16InitAdventurer(a);
 const p=sheet.querySelector('.blInspectPortrait');
 const card=`<div class="bl16Legacy"><div><span>MISSIONS</span><b>${a.missions||0}</b></div><div><span>KILLS</span><b>${a.kills||0}</b></div><div><span>CLOSE CALLS</span><b>${a.legacy.closeCalls||0}</b></div><div><span>LEGENDARY</span><b>${a.legacy.legendaryKills||0}</b></div></div>`;
 if(p&&!sheet.querySelector('.bl16Legacy'))p.insertAdjacentHTML('afterend',card);
 if(a.nickname){const h=sheet.querySelector('.sheetHead h3');if(h&&!h.textContent.includes(a.nickname))h.insertAdjacentHTML('beforeend',` <span class="bl16Nick">“${esc(a.nickname)}”</span>`)}
};

const _renderHQV16=renderHQ;
renderHQ=function(){
 const base=_renderHQV16(),events=bl16LC().events.filter(e=>e.regionId===state.currentRegion).slice(-6).reverse();
 if(!events.length)return base;
 return base+`<div class="sectionTitle"><h3>Company Stories</h3><span>recent lives, grudges & close calls</span></div><div class="bl16StoryList">${events.map(e=>`<div class="card bl16Story ${e.importance==='major'?'major':''}"><span>Day ${e.day}</span><b>${esc(e.text)}</b></div>`).join('')}</div>`;
};

const _showReportV16=showReport;
showReport=function(r){
 _showReportV16(r);
 const lc=bl16LC(),ctx=lc.reportContext,sheet=document.getElementById('sheet');if(!ctx||!sheet)return;
 const reg=state.regions[ctx.regionId],delta=(now,old)=>Math.round(now-old),beats=[...(ctx.storyBeats||[]),...(lc.currentMissionBeats||[])].filter((x,i,a)=>a.indexOf(x)===i).slice(-6);
 const world=`Threat ${delta(reg.threat,ctx.pre.threat)>=0?'+':''}${delta(reg.threat,ctx.pre.threat)} • Stability ${delta(reg.stability,ctx.pre.stability)>=0?'+':''}${delta(reg.stability,ctx.pre.stability)} • Prosperity ${delta(reg.prosperity,ctx.pre.prosperity)>=0?'+':''}${delta(reg.prosperity,ctx.pre.prosperity)}`;
 const extra=`${beats.length?`<div class="sectionTitle"><h3>What They’ll Remember</h3><span>${beats.length} story beat${beats.length===1?'':'s'}</span></div><div class="bl16StoryList">${beats.map(x=>`<div class="card bl16Story"><b>${esc(x)}</b></div>`).join('')}</div>`:''}<div class="bl16RegionResult"><b>REGIONAL CONSEQUENCE</b><span>${esc(world)}</span></div>${ctx.legendaryKilled?'<div class="bl16LegendaryMoment">LEGENDARY THREAT SLAIN</div>':''}`;
 sheet.insertAdjacentHTML('beforeend',extra);
 lc.reportContext=null;lc.currentMissionMemberIds=[];lc.currentMissionBeats=[];
};

const _openCacheV16=openCache;
openCache=function(id){
 const c=state.caches.find(x=>x.id===id),rarity=c?.rarity??0;_openCacheV16(id);
 const sheet=document.getElementById('sheet');if(sheet){const head=sheet.querySelector('.sheetHead');if(head)head.insertAdjacentHTML('afterend',`<div class="bl16LootReveal rarity-${rarity+1}">${esc((RARITIES[rarity]||'COMMON').toUpperCase())} RECOVERY</div>`)}
};

const _auditV16=audit;
audit=function(){const out=_auditV16();out.livingCompany={relationshipsMatter:true,emergentStories:true,nicknames:true,missionIdentity:true,worldConsequences:true,combatReadability:true,svgPortraits:true};return out};
