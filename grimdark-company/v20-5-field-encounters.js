/* Grim Company v20.5 — Field Encounters
   Patch 3: every HQ always shows the full Risk 1–5 ladder, Contract Office stops
   creating extra board slots, campaigns foreground named antagonists, and the
   guaranteed field check becomes a visible expedition encounter with consequences. */
const GC250_VERSION='20.5';
const GC250_BOARD_RISKS=[1,2,3,4,5];
const GC250_CHECK_META={
 scout:{label:'SCOUTING CHECK',icon:'⌖',success:'A clean read of the ground changes the route ahead.',failure:'The party misreads the ground and gives danger room to close in.'},
 sneak:{label:'STEALTH CHECK',icon:'◐',success:'The party moves through the danger before it can react.',failure:'A careless movement gives away the party’s position.'},
 talk:{label:'PARLEY CHECK',icon:'◇',success:'The right words buy cooperation, information and better terms.',failure:'The wrong words sour local support and the contract gets harder to profit from.'},
 occult:{label:'OCCULT CHECK',icon:'✧',success:'The pattern is understood before it can turn against the party.',failure:'Something in the pattern notices them back.'},
 endure:{label:'ENDURANCE CHECK',icon:'△',success:'The party absorbs the hardship without losing operational pace.',failure:'The road takes a physical toll before the real fighting even starts.'}
};

/* --------------------------------------------------------------------------
   CONTRACT BOARD — always one Risk 1, 2, 3, 4 and 5. Contract Office is now a
   quality/economy upgrade only; it never increases board volume.
   -------------------------------------------------------------------------- */
function gc250FreshContractForRisk(regionId,risk,usedTitles=[]){
 let c=null;for(let i=0;i<7;i++){
   c=generateContract(regionId);gc230SetContractRisk(c,risk);c.expires=Math.max(Number(c.expires)||0,(state.company?.day||1)+rnd(3,7));
   if(!usedTitles.includes(c.title))break;
 }
 return c;
}
function gc250EnsureRiskBoard(regionId){
 const r=state?.regions?.[regionId];if(!r)return[];const day=Number(state.company?.day)||1,existing=(r.contracts||[]).filter(c=>!c.gc240CampaignId&&Number(c.expires||0)>=day),next=[],usedTitles=[];
 for(const risk of GC250_BOARD_RISKS){
   let c=existing.find(x=>Number(x.risk)===risk&&!next.includes(x));
   if(!c)c=gc250FreshContractForRisk(regionId,risk,usedTitles);
   else{gc230SetContractRisk(c,risk);c.expires=Math.max(Number(c.expires)||0,day+1)}
   next.push(c);usedTitles.push(c.title);
 }
 r.contracts=next;
 if(r.gc200ScoutTarget&&!next.some(c=>c.id===r.gc200ScoutTarget))r.gc200ScoutTarget=null;
 return next;
}
refreshContracts=function(regionId){return gc250EnsureRiskBoard(regionId)};
const _normalizeStateGC250=normalizeState;
normalizeState=function(s){s=_normalizeStateGC250(s);if(!s)return s;withState(s,()=>REGION_ORDER.forEach(id=>gc250EnsureRiskBoard(id)));s.timeSystem=s.timeSystem||{};s.timeSystem.gc250Version=GC250_VERSION;return s};
const _createStateGC250=createState;
createState=function(name,startRegion='veyric'){const s=_createStateGC250(name,startRegion);withState(s,()=>REGION_ORDER.forEach(id=>gc250EnsureRiskBoard(id)));s.timeSystem=s.timeSystem||{};s.timeSystem.gc250Version=GC250_VERSION;return s};
const _dispatchContractGC250=dispatchContract;
dispatchContract=function(cid,pid){
 const c=contractById(cid),normal=!!(c&&!c.gc240CampaignId),rid=c?.regionId,out=_dispatchContractGC250(cid,pid),p=state.parties.find(x=>x.id===pid);
 if(normal&&p?.expedition?.contract?.id===cid&&rid){gc250EnsureRiskBoard(rid);save();render()}
 return out;
};
if(HQ_DEFS?.['Contract Office'])HQ_DEFS['Contract Office'].desc='Increases contract pay by 5% per level and improves shared Scout progress. The board always carries Risk 1–5.';
const _hqInfoGC250=hqInfo;
hqInfo=function(k){
 if(k==='Contract Office'){
   const lv=hq().upgrades[k]||0;return modal(`<div class="sheetHead"><h3>Contract Office</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: +${lv*5}% base contract pay and +${(lv*2.5).toFixed(1)}% shared Scout progress. Contract capacity is permanently five: one job at each Risk.</div></div>`);
 }
 return _hqInfoGC250(k);
};

/* --------------------------------------------------------------------------
   CAMPAIGNS — every campaign already owns a persistent antagonist. Make that
   character visible from offer to finale, and record the defeat permanently.
   -------------------------------------------------------------------------- */
gc240OfferHTML=function(o,regionId){return`<div class="card gc240Offer"><div class="statline"><div><b>${esc(o.title)}</b><div class="tiny muted">${gc240FocusText(o.focus)} CAMPAIGN • ${o.length} operations</div></div><span class="riskDots">${'●'.repeat(o.finalRisk)}${'○'.repeat(5-o.finalRisk)}</span></div><p class="small">${esc(o.summary)}</p><div class="gc250BossLine"><span>NAMED ANTAGONIST</span><b>${esc(o.antagonist)}</b></div><div class="gc240OfferMeta"><span>Starts Risk ${o.baseRisk}</span><span>Finale Risk ${o.finalRisk}</span><span>+${Math.round(o.bonusRate*100)}% silver premium</span></div><button class="btn primary wide" data-action="gc240StartCampaign" data-region="${regionId}" data-id="${o.id}">Begin Campaign</button></div>`};
const _gc240CampaignPanelHTMLGC250=gc240CampaignPanelHTML;
gc240CampaignPanelHTML=function(regionId,compact=false){
 let html=_gc240CampaignPanelHTMLGC250(regionId,compact),c=gc240CampaignState(regionId).active;if(!c)return html;
 if(compact)return html.replace('<small>',`<small><span class="gc250BossInline">Target: ${esc(c.antagonist)}</span> • `);
 return html.replace('<div class="bar goldbar">',`<div class="gc250BossLine active"><span>NAMED ANTAGONIST</span><b>${esc(c.antagonist)}</b></div><div class="bar goldbar">`);
};
const _gc240CompleteCampaignGC250=gc240CompleteCampaign;
gc240CompleteCampaign=function(regionId,campaign,opts={}){
 const antagonist=campaign?.antagonist,participants=gc240Clone(campaign?.participants||[]),out=_gc240CompleteCampaignGC250(regionId,campaign,opts);
 if(out?.released&&antagonist){
   pushHistory(`NAMED TARGET DEFEATED — ${antagonist}, antagonist of ${campaign.title}.`,regionId);gc199RecordFeed(`NAMED TARGET DEFEATED — ${antagonist}.`,'campaign');
   participants.forEach(m=>{const a=state.roster.find(x=>x.id===m.id);if(a){a.history=a.history||[];a.history.push(`Day ${state.company.day}: helped defeat ${antagonist}, named antagonist of ${campaign.title}.`)}});
 }
 return out;
};

/* --------------------------------------------------------------------------
   FIELD ENCOUNTERS — the guaranteed contract check is now a real expedition
   scene. Results alter later contact pressure, combat, payout or attrition.
   -------------------------------------------------------------------------- */
function gc250CheckScene(key,c){
 const species=c?.species||'opposition';
 const pool={
  scout:[`Tracks split around a bad stretch of ground. ${species} signs are fresh.`,`The road narrows and the party has to decide what the terrain is trying to tell them.`,`Movement ahead is visible for only a few seconds before it disappears.`],
  sneak:[`A hostile presence controls the obvious route. The party looks for a way through unseen.`,`Loose stone, bad light and watchful eyes turn a simple approach into a test of discipline.`,`The safest route runs uncomfortably close to ${species} sentries.`],
  talk:[`Locals know something useful, but they do not owe the company anything.`,`A frightened witness has information and every reason to keep it to themselves.`,`Passage depends on convincing people who have already had enough trouble.`],
  occult:[`The signs on the road are wrong in a way that ordinary training cannot explain.`,`Something old has been disturbed nearby and the residue is still active.`,`The party finds a pattern that feels more like a warning than a clue.`],
  endure:[`The route turns into a long grind of bad ground, bad weather and no shelter.`,`The party has to keep moving through conditions that punish every weak point.`,`There is no clever way around this stretch. They simply have to survive it.`]
 };
 return pick(pool[key]||pool.scout);
}
function gc250ApplyCheckConsequences(p,key,ok){
 const e=p.expedition,c=e.contract,risk=clamp(Number(c.risk)||1,1,5),members=partyMembers(p).filter(a=>a.status!=='Dead');
 if(key==='scout'){
   if(ok){e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.18;e.opening=(Number(e.opening)||0)+.10;return'Future hostile-contact pressure -18% and the party gains a small opening advantage.'}
   e.gc250ContactMod=(Number(e.gc250ContactMod)||0)+.18;e.enemyOpening=(Number(e.enemyOpening)||0)+.10;return'Future hostile-contact pressure +18%; enemies gain a small opening advantage.';
 }
 if(key==='sneak'){
   if(ok){e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.10;e.opening=(Number(e.opening)||0)+.22;return'Future contact pressure -10%; the party gains a major opening advantage in its next fight.'}
   e.gc250ContactMod=(Number(e.gc250ContactMod)||0)+.10;e.enemyOpening=(Number(e.enemyOpening)||0)+.22;return'Future contact pressure +10%; enemies gain a major opening advantage.';
 }
 if(key==='talk'){
   if(ok){e.payBonus=(Number(e.payBonus)||0)+.12;e.gc250ContactMod=(Number(e.gc250ContactMod)||0)-.05;return'Contract payment +12% and local cooperation trims hostile-contact pressure by 5%.'}
   e.payBonus=(Number(e.payBonus)||0)-.05;e.gc250ContactMod=(Number(e.gc250ContactMod)||0)+.08;return'Contract payment -5% and hostile-contact pressure +8% after local support dries up.';
 }
 if(key==='occult'){
   if(ok){e.enemyDebuff=(Number(e.enemyDebuff)||0)+.15;c.cacheChance=clamp((Number(c.cacheChance)||0)+.10,0,.95);return'Enemy Attack/Guard -15% in combat and the expedition gains +10% cache discovery chance.'}
   e.horrorPressure=(Number(e.horrorPressure)||0)+.18;e.gc250EnemyStrength=(Number(e.gc250EnemyStrength)||0)+.10;return'Enemies gain +10% combat strength and supernatural horror pressure increases.';
 }
 if(key==='endure'){
   if(ok){e.attritionGuard=(Number(e.attritionGuard)||0)+.25;e.gc250PushStrainMult=Math.min(Number(e.gc250PushStrainMult)||1,.75);return'Attrition resistance +25%; forced-pace strain is reduced by 25% for the rest of the expedition.'}
   let total=0;members.forEach(a=>{const max=derived(a).maxHp,dmg=Math.max(1,Math.round(max*(.03+risk*.005)));a.hp=Math.max(1,a.hp-dmg);total+=dmg});e.gc250PushStrainMult=Math.max(Number(e.gc250PushStrainMult)||1,1.30);return`The party loses ${total} total HP to attrition and forced-pace strain becomes 30% worse.`;
 }
 return ok?'The party gains a field advantage.':'The expedition becomes more dangerous.';
}
fieldCheck=function(p){
 const e=p?.expedition,c=e?.contract;if(!e||!c)return null;const key=c.check,b=bestUtility(p,key);if(!b.a)return null;const diff=8+c.risk*4+c.unknown*2;let roll=b.value+rnd(-4,5);if(b.a.traits.includes('Lucky')&&chance(.22))roll+=4;const ok=roll>=diff,consequence=gc250ApplyCheckConsequences(p,key,ok),meta=GC250_CHECK_META[key]||GC250_CHECK_META.scout,scene=gc250CheckScene(key,c);
 e.checks=Array.isArray(e.checks)?e.checks:[];const rec={key,ok,name:b.a.name,roll,diff,consequence};e.checks.push(rec);e.events.push(`${key.toUpperCase()} — ${b.a.name} ${ok?'succeeds':'fails'} (${roll} vs ${diff}).`);e.events.push(`FIELD CONSEQUENCE — ${consequence}`);e.gc250FieldEvent={id:uid('field'),key,ok,name:b.a.name,roll,diff,scene,consequence,label:meta.label,icon:meta.icon,progress:Number(e.progress)||0,day:state.company.day};gc199RecordFeed(`FIELD — ${c.title}: ${meta.label} ${ok?'SUCCESS':'FAILURE'} • ${consequence}`,'field');if(typeof gc202ScheduleRender==='function')gc202ScheduleRender();else render();return rec;
};
const _gc201ContactRateGC250=gc201ContactRate;
gc201ContactRate=function(p){const base=_gc201ContactRateGC250(p),mod=clamp(Number(p?.expedition?.gc250ContactMod)||0,-.35,.60);return clamp(base*(1+mod),.015,2.4)};
const _gc201PushStrainGC250=gc201PushStrain;
gc201PushStrain=function(p,travel,momentum){const mult=clamp(Number(p?.expedition?.gc250PushStrainMult)||1,.5,1.6);return _gc201PushStrainGC250(p,travel,momentum*mult)};
const _startBattleGC250=startBattle;
startBattle=function(p){
 const before=!!p?.expedition?.battle,out=_startBattleGC250(p),e=p?.expedition,b=e?.battle;if(!before&&b&&!b.gc250FieldApplied){
   const strength=clamp(Number(e.gc250EnemyStrength)||0,0,.35);if(strength>0)b.enemies.forEach(x=>{x.maxHp=Math.max(1,Math.round(x.maxHp*(1+strength*.55)));x.hp=x.maxHp;x.attack=Math.max(1,Math.round(x.attack*(1+strength)));x.guard=Math.max(1,Math.round(x.guard*(1+strength)))});
   if(e.gc250FieldEvent)b.log.unshift(`Field check ${e.gc250FieldEvent.ok?'advantage':'setback'}: ${e.gc250FieldEvent.consequence}`);b.gc250FieldApplied=true;
 }return out;
};
/* Defensive guarantee: if an unusual expedition path reaches its return point before
   the normal 25%-progress trigger, resolve its field encounter before rewards. */
const _gc193FinishNoTimeGC250=gc193FinishNoTime;
gc193FinishNoTime=function(p){const e=p?.expedition;if(e&&(!Array.isArray(e.checks)||!e.checks.length)&&partyMembers(p).length){fieldCheck(p);e.gcChecksDone=Math.max(1,Number(e.gcChecksDone)||0)}return _gc193FinishNoTimeGC250(p)};

function gc250FieldEncounterHTML(e){
 const x=e?.gc250FieldEvent;if(!x)return'';const meta=GC250_CHECK_META[x.key]||GC250_CHECK_META.scout,pct=clamp((x.roll/Math.max(1,x.diff))*72,8,100);
 return`<div class="gc250FieldEncounter ${esc(x.key)} ${x.ok?'success':'failure'}"><div class="gc250FieldVisual"><i class="a"></i><i class="b"></i><i class="c"></i><strong>${esc(meta.icon)}</strong></div><div class="gc250FieldBody"><div class="gc250FieldHead"><span>${esc(meta.label)}</span><b>${x.ok?'SUCCESS':'FAILURE'}</b></div><p>${esc(x.scene)}</p><div class="gc250CheckTrack"><i style="--gc250-fill:${pct}%"></i><em style="left:${clamp(72,0,100)}%"></em></div><div class="gc250CheckNumbers"><span>${esc(x.name)} • ${Math.round(x.roll)}</span><span>Difficulty ${Math.round(x.diff)}</span></div><div class="gc250Consequence"><b>CONSEQUENCE</b><span>${esc(x.consequence)}</span></div></div></div>`;
}
const _expeditionCardGC250=expeditionCard;
expeditionCard=function(p){let html=_expeditionCardGC250(p),scene=gc250FieldEncounterHTML(p?.expedition);if(!scene)return html;return html.includes('<div class="gc220FieldBrief">')?html.replace('<div class="gc220FieldBrief">',scene+'<div class="gc220FieldBrief">'):html.replace('<div class="combatLog">',scene+'<div class="combatLog">')};
const _renderContractsGC250=renderContracts;
renderContracts=function(){let html=_renderContractsGC250();const note='<div class="gc250RiskLadder"><b>FULL RISK LADDER</b><span>Every HQ always carries exactly five rotating contracts: one each at Risk 1, 2, 3, 4 and 5. Contract Office improves quality and pay, not board size.</span></div>';return html.replace('<div class="sectionTitle"><h3>Available Work</h3>',note+'<div class="sectionTitle"><h3>Available Work</h3>')};
const _gc193DailyDashboardGC250=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC250().replace('v20.4 • REGIONAL CAMPAIGNS','v20.5 • FIELD ENCOUNTERS')};

function gc250InstallStyles(){if(document.getElementById('gc250Styles'))return;const style=document.createElement('style');style.id='gc250Styles';style.textContent=`
 .gc250RiskLadder{margin:8px 0 10px;padding:8px 9px;border-left:2px solid rgba(202,168,106,.55);background:rgba(202,168,106,.045);border-radius:5px}.gc250RiskLadder b{display:block;font-size:8px;letter-spacing:.14em;color:#caa86a}.gc250RiskLadder span{display:block;margin-top:3px;font-size:10px;line-height:1.35;color:#aa9e8d}
 .gc250BossLine{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:7px 0;padding:7px 8px;border:1px solid rgba(184,77,65,.24);background:rgba(184,77,65,.045);border-radius:5px}.gc250BossLine span{font-size:8px;letter-spacing:.12em;color:#a9897f}.gc250BossLine b{font-size:10px;color:#d5b3a8}.gc250BossLine.active{margin-bottom:8px}.gc250BossInline{color:#c99d91;font-weight:700}
 .gc250FieldEncounter{display:grid;grid-template-columns:70px 1fr;gap:9px;margin:8px 0;padding:8px;border:1px solid rgba(255,255,255,.08);border-radius:7px;background:linear-gradient(180deg,rgba(20,20,19,.98),rgba(11,11,10,.98));overflow:hidden}.gc250FieldEncounter.success{border-left:2px solid rgba(181,155,94,.70)}.gc250FieldEncounter.failure{border-left:2px solid rgba(183,74,65,.72)}.gc250FieldVisual{position:relative;min-height:92px;border:1px solid rgba(255,255,255,.06);border-radius:5px;overflow:hidden;background:rgba(255,255,255,.018)}.gc250FieldVisual strong{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:24px;color:#c8b58d;text-shadow:0 0 12px rgba(200,181,141,.22)}.gc250FieldVisual i{position:absolute;display:block}.gc250FieldBody{min-width:0}.gc250FieldHead{display:flex;justify-content:space-between;gap:8px}.gc250FieldHead span{font-size:8px;letter-spacing:.14em;color:#a79984}.gc250FieldHead b{font-size:9px}.gc250FieldEncounter.success .gc250FieldHead b{color:#cbb87d}.gc250FieldEncounter.failure .gc250FieldHead b{color:#d28577}.gc250FieldBody p{margin:4px 0 7px;font-size:10px;line-height:1.35;color:#c0b4a2}.gc250CheckTrack{position:relative;height:7px;border:1px solid rgba(255,255,255,.08);background:#0b0b0b;border-radius:8px;overflow:hidden}.gc250CheckTrack i{position:absolute;inset:0 auto 0 0;width:var(--gc250-fill);background:linear-gradient(90deg,rgba(119,103,76,.75),rgba(204,177,111,.9));animation:gc250Fill .75s cubic-bezier(.2,.8,.2,1) both;transform-origin:left}.gc250CheckTrack em{position:absolute;top:-2px;bottom:-2px;width:1px;background:rgba(255,255,255,.55)}.gc250CheckNumbers{display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:8px;color:#8f8679}.gc250Consequence{margin-top:7px;padding:6px 7px;border:1px solid rgba(255,255,255,.055);background:rgba(255,255,255,.02);border-radius:4px}.gc250Consequence b{display:block;font-size:7px;letter-spacing:.13em;color:#8f8475}.gc250Consequence span{display:block;margin-top:2px;font-size:9px;line-height:1.35;color:#c8bba7}
 .gc250FieldEncounter.scout .gc250FieldVisual .a{left:-30%;top:50%;width:160%;height:1px;background:linear-gradient(90deg,transparent,#bca874,transparent);animation:gc250Sweep 1.8s linear infinite}.gc250FieldEncounter.scout .gc250FieldVisual .b{left:18%;top:22%;width:44px;height:44px;border:1px solid rgba(187,168,116,.28);border-radius:50%;animation:gc250Pulse 1.8s ease-in-out infinite}
 .gc250FieldEncounter.sneak .gc250FieldVisual .a{left:8px;right:8px;top:16px;bottom:16px;background:linear-gradient(110deg,transparent 38%,rgba(118,105,86,.12) 39%,rgba(118,105,86,.12) 61%,transparent 62%);animation:gc250Drift 2.2s ease-in-out infinite}.gc250FieldEncounter.sneak .gc250FieldVisual .b{width:6px;height:6px;border-radius:50%;background:#a36f62;right:13px;top:16px;animation:gc250Blink 1.2s ease-in-out infinite}
 .gc250FieldEncounter.talk .gc250FieldVisual .a,.gc250FieldEncounter.talk .gc250FieldVisual .b{width:18px;height:18px;border:1px solid rgba(197,169,111,.38);border-radius:50%;top:36%}.gc250FieldEncounter.talk .gc250FieldVisual .a{left:10px}.gc250FieldEncounter.talk .gc250FieldVisual .b{right:10px}.gc250FieldEncounter.talk .gc250FieldVisual .c{left:29px;right:29px;top:46%;height:1px;background:rgba(197,169,111,.35);animation:gc250Pulse 1.3s ease-in-out infinite}
 .gc250FieldEncounter.occult .gc250FieldVisual .a,.gc250FieldEncounter.occult .gc250FieldVisual .b{left:50%;top:50%;border:1px solid rgba(158,132,188,.32);border-radius:50%;transform:translate(-50%,-50%);animation:gc250Occult 2.4s linear infinite}.gc250FieldEncounter.occult .gc250FieldVisual .a{width:48px;height:48px}.gc250FieldEncounter.occult .gc250FieldVisual .b{width:28px;height:28px;animation-direction:reverse}
 .gc250FieldEncounter.endure .gc250FieldVisual .a,.gc250FieldEncounter.endure .gc250FieldVisual .b,.gc250FieldEncounter.endure .gc250FieldVisual .c{top:-20%;width:1px;height:140%;background:linear-gradient(transparent,rgba(151,166,174,.35),transparent);transform:rotate(12deg);animation:gc250Rain 1.1s linear infinite}.gc250FieldEncounter.endure .gc250FieldVisual .a{left:22%}.gc250FieldEncounter.endure .gc250FieldVisual .b{left:52%;animation-delay:.35s}.gc250FieldEncounter.endure .gc250FieldVisual .c{left:78%;animation-delay:.7s}
 @keyframes gc250Fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes gc250Sweep{0%{transform:translateY(-24px);opacity:.15}50%{opacity:1}100%{transform:translateY(24px);opacity:.15}}@keyframes gc250Pulse{50%{opacity:.28;transform:scale(.92)}}@keyframes gc250Drift{50%{transform:translateX(8px)}}@keyframes gc250Blink{50%{opacity:.2}}@keyframes gc250Occult{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes gc250Rain{to{transform:translateY(34px) rotate(12deg)}}
 @media(max-width:420px){.gc250FieldEncounter{grid-template-columns:56px 1fr}.gc250FieldVisual{min-height:100px}.gc250CheckNumbers{flex-direction:column;gap:1px}}
 @media(prefers-reduced-motion:reduce){.gc250FieldEncounter *{animation:none!important}}
 `;document.head.appendChild(style)}
gc250InstallStyles();

const _auditGC250=audit;
audit=function(){const out=_auditGC250();out.v250FieldEncounters=GC250_VERSION;out.fixedRiskLadder=true;out.contractOfficeNoBoardSlots=true;out.campaignNamedAntagonists=true;out.guaranteedFieldCheck=true;out.animatedFieldChecks=true;out.meaningfulFieldConsequences=true;out.fieldCheckTypes=['scout','sneak','talk','occult','endure'];return out};
window.__BL_AUDIT=audit;
window.__GC250_TEST=function(){
 const old=state;try{
   state=createState('Field Test','veyric');state.regions.veyric.hq.established=true;gc250EnsureRiskBoard('veyric');const risks=state.regions.veyric.contracts.map(c=>Number(c.risk)).sort((a,b)=>a-b),boardOk=state.regions.veyric.contracts.length===5&&GC250_BOARD_RISKS.every((r,i)=>risks[i]===r);
   let p=state.parties.find(x=>x.regionId==='veyric');if(!p){p=makeParty('veyric','Field Test Party');state.parties.push(p)}let a=state.roster.find(x=>x.regionId==='veyric'&&x.status!=='Dead');if(!a){a=generateAdventurer('veyric');state.roster.push(a)}a.status='Expedition';p.members=[a.id];p.captainId=a.id;const c=gc250FreshContractForRisk('veyric',1,[]);c.check='scout';p.expedition={contract:c,progress:30,events:[],checks:[],battle:null,fought:false,complete:false,gc201ContactExposure:0,gc213LastEncounterExposure:0};const before=gc201ContactRate(p),rec=fieldCheck(p),after=gc201ContactRate(p),fieldOk=!!(rec&&p.expedition.gc250FieldEvent&&p.expedition.gc250FieldEvent.consequence&&p.expedition.checks.length===1&&after!==before);
   const offers=(gc240CampaignState('veyric').offers=[],gc240EnsureOffers('veyric')),bossOk=offers.length===3&&offers.every(o=>!!o.antagonist);
   return{ok:boardOk&&fieldOk&&bossOk,boardOk,risks,fieldOk,fieldResult:rec?.ok?'success':'failure',contactBefore:before,contactAfter:after,bossOk,bosses:offers.map(o=>o.antagonist)};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};