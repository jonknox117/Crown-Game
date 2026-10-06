/* Grim Company v20.3 — World Pressure
   Patch 1: Risk describes the job; regional state describes the world around it.
   Cleaning up a region makes operating there materially easier without deleting
   high-risk content, while unattended regions slowly slide back toward trouble. */
const GC230_VERSION='20.3';
const GC230_RISK_WEIGHTS=[22,24,22,18,14];
const GC230_RISK_CONTACT={1:.18,2:.28,3:.42,4:.65,5:.90};
const GC230_AMBIENT_REPORT_DAYS=5;

/* ---------- regional state / migration ---------- */
function gc230InitRegion(r){
 if(!r)return r;
 r.threat=clamp(Number(r.threat)||0,0,100);
 r.stability=clamp(Number(r.stability)||0,0,100);
 r.prosperity=clamp(Number(r.prosperity)||0,0,100);
 r.gc230World=r.gc230World||{};
 const w=r.gc230World;
 w.ambient=w.ambient||{threat:0,stability:0,prosperity:0};
 ['threat','stability','prosperity'].forEach(k=>w.ambient[k]=Number(w.ambient[k])||0);
 w.lastAmbientReportDay=Number(w.lastAmbientReportDay)||Number(state?.company?.day)||1;
 return r;
}
function gc230InitState(s=state){
 if(!s)return s;
 s.timeSystem=s.timeSystem||{};s.timeSystem.gc230Version=GC230_VERSION;
 Object.values(s.regions||{}).forEach(gc230InitRegion);
 return s;
}

/* ---------- contract Risk is independent of regional Threat ---------- */
function gc230RandomRisk(){
 let n=Math.random()*GC230_RISK_WEIGHTS.reduce((a,b)=>a+b,0);
 for(let i=0;i<GC230_RISK_WEIGHTS.length;i++){n-=GC230_RISK_WEIGHTS[i];if(n<=0)return i+1}
 return 3;
}
contractRisk=function(){return gc230RandomRisk()};
function gc230EnemyCount(risk){const band=[[2,4],[3,5],[5,8],[7,11],[10,16]][clamp(Number(risk)||1,1,5)-1];return rnd(band[0],band[1])}
function gc230SetContractRisk(c,risk){
 if(!c)return c;risk=clamp(Number(risk)||1,1,5);c.risk=risk;c.enemyCount=gc230EnemyCount(risk);
 if(risk<4)c.nemesisId=null;
 c.unknown=clamp(Number(c.unknown)||0,0,risk);
 delete c.gcDuration;delete c.gc194Economy;gc193EnsureContract(c);gc194TuneContract(c);c.gc230RiskIndependent=true;return c;
}
const _generateContractGC230=generateContract;
generateContract=function(regionId){
 const c=_generateContractGC230(regionId);if(!c)return c;
 /* The old generator added bodies when Threat was high. Encounter pressure now
    carries that environmental danger, so the contract's advertised Risk remains
    an honest description of its intended opposition. */
 c.enemyCount=gc230EnemyCount(c.risk);delete c.gc194Economy;gc194TuneContract(c);c.gc230RiskIndependent=true;return c;
};
function gc230RequiredRisks(count){return count>=5?[1,2,3,4,5]:Array.from({length:count},(_,i)=>i+1)}
function gc230EnsureBoardVariety(regionId){
 const r=state?.regions?.[regionId];if(!r||!Array.isArray(r.contracts)||r.contracts.length<2)return;
 if(typeof gc201EarlyCompany==='function'&&gc201EarlyCompany(state)&&regionId===state.currentRegion)return;
 const required=gc230RequiredRisks(r.contracts.length),counts={1:0,2:0,3:0,4:0,5:0};r.contracts.forEach(c=>counts[clamp(Number(c.risk)||1,1,5)]++);
 for(const target of required){
   if(counts[target]>0)continue;
   const donor=r.contracts.find(c=>!c.nemesisId&&counts[clamp(Number(c.risk)||1,1,5)]>1);
   if(!donor)continue;
   const old=clamp(Number(donor.risk)||1,1,5);counts[old]=Math.max(0,counts[old]-1);gc230SetContractRisk(donor,target);counts[target]++;
 }
}
const _refreshContractsGC230=refreshContracts;
refreshContracts=function(regionId){const out=_refreshContractsGC230(regionId);gc230EnsureBoardVariety(regionId);return out};

const _normalizeStateGC230=normalizeState;
normalizeState=function(s){
 s=gc230InitState(_normalizeStateGC230(s));if(!s)return s;
 if(typeof withState==='function')withState(s,()=>REGION_ORDER.forEach(id=>gc230EnsureBoardVariety(id)));
 return s;
};
const _createStateGC230=createState;
createState=function(name,startRegion='veyric'){return gc230InitState(_createStateGC230(name,startRegion))};

/* ---------- every regional stat has a distinct, player-facing job ---------- */
function gc230ThreatBand(t){t=clamp(Number(t)||0,0,100);return t<15?'PACIFIED':t<35?'CONTROLLED':t<55?'UNEASY':t<75?'DANGEROUS':t<90?'SEVERE':'OVERRUN'}
function gc230StabilityBand(s){s=clamp(Number(s)||0,0,100);return s<20?'COLLAPSING':s<40?'FRAGILE':s<60?'FUNCTIONAL':s<80?'SECURE':s<95?'STRONG':'EXCEPTIONAL'}
function gc230ProsperityBand(p){p=clamp(Number(p)||0,0,100);return p<20?'DESTITUTE':p<40?'POOR':p<60?'MODEST':p<80?'HEALTHY':p<95?'WEALTHY':'FLOURISHING'}
function gc230ThreatContactMultiplier(t){return .65+clamp(Number(t)||0,0,100)*.007}
function gc230ThreatEnemyMultiplier(t){return .92+clamp(Number(t)||0,0,100)*.0016}
function gc230StabilityBenefits(regionId){
 const r=state.regions[regionId],s=clamp(Number(r.stability)||0,0,100),renown=Number(state.company?.renown)||0;
 const recruits=clamp(2+Math.floor(s/12)+(renown>50?1:0),2,12),elite=clamp((s-45)/180+renown/600,0,.28),bad=clamp((55-s)/100,0,.35);
 return{recruits,elite,bad,oddSpeed:.92+(100-s)*.0016};
}
function gc230ProsperityBenefits(regionId){
 const r=state.regions[regionId],p=clamp(Number(r.prosperity)||0,0,100),stores=hq(regionId).upgrades.Stores||0;
 return{marketSlots:clamp(4+Math.floor(p/12)+(hasArtifact('The Salt Crown',regionId)?1:0),4,14),contractPay:.90+p*.002,price:(1.38-p*.0045)*(1-stores*.04),hqCost:1+(100-p)/250,oddPay:.90+p*.0025};
}

/* Threat changes operating conditions around a contract, not the Risk tier. The
   old v20.1.3 post-modifier floor is intentionally replaced so good scouting and
   a pacified region can actually make expeditions safer. */
gc201ContactRate=function(p){
 const e=p?.expedition,c=e?.contract;if(!c)return 0;const r=state.regions[c.regionId],risk=clamp(Number(c.risk)||1,1,5);
 let rate=GC230_RISK_CONTACT[risk]||GC230_RISK_CONTACT[1];
 rate+=({Extermination:.09,Siege:.12,Defense:.07,Hunt:.05,Escort:.025,Caravan:.025,Exploration:.04,Retrieval:.015,Rescue:0,Assassination:.035,Investigation:-.035,Negotiation:-.06})[c.type]||0;
 rate+=Math.min(.12,(Number(c.unknown)||0)*.028);
 const scout=bestUtility(p,'scout')?.value||0;rate-=Math.min(.11,Math.max(0,scout-12)/190);rate-=(Number(c.gcIntel)||0)*.04+(Number(c.gcScoutEdge)||0)*.38;
 rate+=p?.tactic==='Cautious'?-.055:p?.tactic==='Aggressive'?.065:0;
 rate=Math.max(.045,rate);
 const total=Math.max(0,Number(e.gc201ContactExposure)||0),last=Math.max(0,Number(e.gc213LastEncounterExposure)||0),dry=Math.max(0,total-last),dryRamp=1+Math.min(GC213_DRY_PRESSURE_CAP,dry*GC213_DRY_PRESSURE_PER_DAY);
 const env=gc230ThreatContactMultiplier(r?.threat),push=1+(Number(e.gc201Momentum)||0)*.60;
 e.gc213DryTravel=dry;e.gc213PressureRamp=dryRamp;e.gc230ThreatMultiplier=env;
 return clamp(rate*env*push*dryRamp,.025,2.4);
};

/* A low-Threat region also makes the actual fight a little cleaner: fewer useful
   reinforcements, worse coordination, and less ambient support for the enemy.
   Risk remains the dominant factor; this modifier is deliberately modest. */
const _makeEnemyGC230=makeEnemy;
makeEnemy=function(c,index){
 const x=_makeEnemyGC230(c,index),t=state.regions[c.regionId]?.threat??50,m=gc230ThreatEnemyMultiplier(t),accuracyMult=1+(m-1)*.55;
 x.maxHp=Math.max(1,Math.round(x.maxHp*m));x.hp=x.maxHp;x.attack=Math.max(1,Math.round(x.attack*m));x.guard=Math.max(1,Math.round(x.guard*m));x.accuracy=Math.max(1,Math.round(x.accuracy*accuracyMult));x.gc230RegionalPressure=m;return x;
};
const _startBattleGC230=startBattle;
startBattle=function(p){
 const before=!!p?.expedition?.battle,out=_startBattleGC230(p),b=p?.expedition?.battle,c=p?.expedition?.contract;
 if(!before&&b&&c){const t=state.regions[c.regionId]?.threat??50,m=gc230ThreatEnemyMultiplier(t),delta=Math.round((m-1)*100);b.log.unshift(`Regional Threat ${Math.round(t)} (${gc230ThreatBand(t)}): enemy pressure ${delta===0?'±0':delta>0?'+'+delta:delta}%.`)}
 return out;
};

gc201PushStrain=function(p,travel,momentum){
 const e=p?.expedition;if(!e||travel<=0||momentum<=0)return;const risk=Number(e.contract?.risk)||1,people=partyMembers(p).filter(a=>a.status!=='Dead');if(!people.length)return;
 const env=gc230ThreatContactMultiplier(state.regions[e.contract.regionId]?.threat??50),hazard=1-Math.exp(-(.025*risk*momentum*env)*travel);if(!chance(hazard))return;
 const a=pick(people),max=derived(a).maxHp,dmgScale=.92+(env-1)*.35,dmg=Math.max(2,Math.round(max*(.025+Math.random()*.035)*dmgScale));a.hp=Math.max(1,a.hp-dmg);e.events.push(`${a.name} lost ${dmg} HP to the forced pace.`);
 if(a.hp/max<.25&&chance(clamp(.12*env,.06,.20))){a.status='Recovering';a.injury=injuryName();a.recovery=1+rnd(0,1);e.events.push(`${a.name} aggravated ${a.injury} while pushing the pace.`)}
};

/* Stability already controls recruit count, elite chance and negative-trait risk.
   Prosperity already controls market breadth, prices, HQ costs and contract pay.
   Give both an additional small routine-work payoff so their benefits are felt
   during ordinary company life too. */
const _gc220RollOddJobGC230=gc220RollOddJob;
gc220RollOddJob=function(regionId,previous=''){
 const job=_gc220RollOddJobGC230(regionId,previous),s=gc230StabilityBenefits(regionId),p=gc230ProsperityBenefits(regionId);
 job.duration=Math.max(.28,job.duration*s.oddSpeed);job.pay=Math.max(2,Math.round(job.pay*p.oddPay));return job;
};

/* ---------- slow, always-on grimdark world pressure ---------- */
function gc230PressureRatesFor(r){
 const t=clamp(Number(r?.threat)||0,0,100)/100,s=clamp(Number(r?.stability)||0,0,100)/100,p=clamp(Number(r?.prosperity)||0,0,100)/100;
 const world=r?.hq?.established?1:.65;
 return{
  threat:(.035+(1-s)*.050+(1-p)*.015+Math.pow(t,1.7)*.055)*world,
  stability:-(.010+Math.pow(t,1.6)*.070+(1-p)*.018)*world,
  prosperity:-(.008+Math.pow(t,1.5)*.060+(1-s)*.026)*world
 };
}
function gc230PressureRates(regionId){return gc230PressureRatesFor(state.regions[regionId])}
function gc230AccumulateAmbient(regionId,delta){
 const r=state.regions[regionId];gc230InitRegion(r);const a=r.gc230World.ambient;a.threat+=delta.threat;a.stability+=delta.stability;a.prosperity+=delta.prosperity;
}
function gc230AmbientText(a){
 const parts=[];[['Threat','threat'],['Stability','stability'],['Prosperity','prosperity']].forEach(([label,key])=>{const v=Number(a[key])||0;if(Math.abs(v)>=.05)parts.push(`${label} ${v>0?'+':''}${v.toFixed(1)}`)});return parts.join(' • ');
}
function gc230FlushAmbient(regionId){
 const r=state.regions[regionId];gc230InitRegion(r);const w=r.gc230World,day=Number(state.company?.day)||1;
 if(day-w.lastAmbientReportDay<GC230_AMBIENT_REPORT_DAYS)return;const text=gc230AmbientText(w.ambient);
 if(text){r.gc220RecentChanges.push({day,cause:'World pressure',text});if(r.gc220RecentChanges.length>12)r.gc220RecentChanges.splice(0,r.gc220RecentChanges.length-12)}
 w.ambient={threat:0,stability:0,prosperity:0};w.lastAmbientReportDay=day;
}
processWorldDay=function(){
 REGION_ORDER.forEach(id=>{
   const r=state.regions[id];gc230InitRegion(r);const rates=gc230PressureRates(id),before=gc220RegionSnapshot(id);
   r.threat=clamp(r.threat+rates.threat,0,100);r.stability=clamp(r.stability+rates.stability,0,100);r.prosperity=clamp(r.prosperity+rates.prosperity,0,100);
   gc230AccumulateAmbient(id,{threat:r.threat-before.threat,stability:r.stability-before.stability,prosperity:r.prosperity-before.prosperity});
   if(hasArtifact('The Salt Crown',id)&&chance(.45)){
     const saltBefore=gc220RegionSnapshot(id);r.stability=clamp(r.stability-1,0,100);gc220RecordRegionChanges(id,saltBefore,gc220RegionSnapshot(id),'The Salt Crown');
   }
   if(r.threat>=95&&r.settlements>1){
     const lossChance=clamp(.015+(r.threat-95)*.01+(100-r.stability)*.0008,.015,.15);
     if(chance(lossChance)){const lossBefore=gc220RegionSnapshot(id);r.settlements--;r.stability=clamp(r.stability-4,0,100);r.prosperity=clamp(r.prosperity-4,0,100);pushHistory(`${REGION_DEFS[id].name}: a settlement was lost to unchecked threats.`,id);gc220RecordRegionChanges(id,lossBefore,gc220RegionSnapshot(id),'Settlement lost')}
   }
   if(r.settlements<=1)r.lost=true;
   gc230FlushAmbient(id);refreshMarket(id);refreshContracts(id);
 });
};
/* v20.2 recorded every world tick as a separate recent-change entry. Keep the
   useful five-day pressure summary instead, so meaningful contracts/jobs remain
   visible in the regional history. */
const _gc199AdvanceWorldDayGC230=gc199AdvanceWorldDay;
gc199AdvanceWorldDay=function(){
 const out=_gc199AdvanceWorldDayGC230();if(out)REGION_ORDER.forEach(id=>{const r=state.regions[id];r.gc220RecentChanges=(r.gc220RecentChanges||[]).filter(x=>!(x.day===state.company.day&&x.cause==='Daily regional simulation'))});return out;
};

/* ---------- contracts make visible dents; campaigns will become the big hammer ---------- */
function gc230ContractImpact(c,win){
 const risk=clamp(Number(c?.risk)||1,1,5),base={1:{t:2.5,s:.6,p:.35},2:{t:3.8,s:.9,p:.5},3:{t:5.6,s:1.3,p:.75},4:{t:8.2,s:1.8,p:1.1},5:{t:11.2,s:2.5,p:1.6}}[risk];
 const tf=({Extermination:1.25,Siege:1.22,Hunt:1.16,Assassination:1.15,Defense:1.05,Rescue:.9,Retrieval:.8,Investigation:.72,Escort:.68,Caravan:.58,Negotiation:.55})[c?.type]||.8;
 const sf=({Defense:1.45,Rescue:1.35,Negotiation:1.35,Investigation:1.18,Escort:1.08,Caravan:1.0,Retrieval:.95,Hunt:.8,Extermination:.75,Assassination:.7,Siege:.7})[c?.type]||.9;
 const pf=({Caravan:1.75,Escort:1.55,Retrieval:1.3,Defense:1.15,Negotiation:1.12,Investigation:1.0,Rescue:.9,Hunt:.7,Extermination:.6,Assassination:.55,Siege:.5})[c?.type]||.8;
 if(win)return{threat:-base.t*tf,stability:base.s*sf,prosperity:base.p*pf};
 return{threat:base.t*tf*.45,stability:-base.s*sf*.75,prosperity:-base.p*pf*.60};
}
function gc230ImpactText(d){return `Threat ${d.threat>0?'+':''}${d.threat.toFixed(1)} • Stability ${d.stability>0?'+':''}${d.stability.toFixed(1)} • Prosperity ${d.prosperity>0?'+':''}${d.prosperity.toFixed(1)}`}
/* Bypass only v20.2's recorder so the legacy random regional swing can be replaced
   by the deterministic risk/type impact below. All earlier finish wrappers remain. */
gc193FinishNoTime=function(p){
 const e=p?.expedition,c=e?.contract;if(!e||!c)return _gc193FinishNoTimeGC220(p);
 const rid=c.regionId,r=state.regions[rid],before=gc220RegionSnapshot(rid),win=e.battleWon!==false,face=hasArtifact("The King’s Second Face",rid),impact=gc230ContractImpact(c,win),title=c.title;
 const out=_gc193FinishNoTimeGC220(p);
 r.threat=clamp(before.threat+impact.threat+(face&&win?2:0),0,100);r.stability=clamp(before.stability+impact.stability,0,100);r.prosperity=clamp(before.prosperity+impact.prosperity,0,100);
 const after=gc220RegionSnapshot(rid),actual={threat:after.threat-before.threat,stability:after.stability-before.stability,prosperity:after.prosperity-before.prosperity};
 gc220RecordRegionChanges(rid,before,after,`Contract: ${title}`);gc199RecordFeed(`REGION — ${title}: ${gc230ImpactText(actual)}.`,'region');save();return out;
};

/* ---------- make the benefits and pressure legible ---------- */
function gc230SignedPercent(v){const n=Math.round(v*100);return`${n>0?'+':''}${n}%`}
function gc230RegionBenefitsHTML(id,compact=false){
 const r=state.regions[id],t=clamp(Number(r.threat)||0,0,100),s=clamp(Number(r.stability)||0,0,100),p=clamp(Number(r.prosperity)||0,0,100),sb=gc230StabilityBenefits(id),pb=gc230ProsperityBenefits(id),rates=gc230PressureRates(id),contact=gc230ThreatContactMultiplier(t),enemy=gc230ThreatEnemyMultiplier(t);
 const html=`<div class="gc230RegionBenefits ${compact?'compact':''}"><div class="gc230Benefit threat"><span>THREAT • ${gc230ThreatBand(t)}</span><b>${Math.round(t)}</b><small>Contact ${gc230SignedPercent(contact-1)} • enemy pressure ${gc230SignedPercent(enemy-1)}</small></div><div class="gc230Benefit stability"><span>STABILITY • ${gc230StabilityBand(s)}</span><b>${Math.round(s)}</b><small>${sb.recruits} recruit slots • ${Math.round(sb.elite*100)}% elite chance cap • ${Math.round(sb.bad*100)}% bad-trait risk</small></div><div class="gc230Benefit prosperity"><span>PROSPERITY • ${gc230ProsperityBand(p)}</span><b>${Math.round(p)}</b><small>${pb.marketSlots} market slots • contract pay ${gc230SignedPercent(pb.contractPay-1)} • local work ${gc230SignedPercent(pb.oddPay-1)}</small></div><div class="gc230Drift"><span>AMBIENT / SIM DAY</span><b>T +${rates.threat.toFixed(2)} • S ${rates.stability.toFixed(2)} • P ${rates.prosperity.toFixed(2)}</b><small>Only while the simulation is running. No offline deterioration.</small></div></div>`;
 return html;
}
const _regionCardGC230=regionCard;
regionCard=function(id){let html=_regionCardGC230(id),panel=gc230RegionBenefitsHTML(id,true);return html.includes('<div class="gc220RegionTrail">')?html.replace('<div class="gc220RegionTrail">',panel+'<div class="gc220RegionTrail">'):html.replace('<div class="actions">',panel+'<div class="actions">')};
const _showRegionInfoGC230=showRegionInfo;
showRegionInfo=function(id){const out=_showRegionInfoGC230(id),sheet=document.getElementById('sheet');if(sheet&&!sheet.querySelector('.gc230RegionBenefits')){const head=sheet.querySelector('.sheetHead');head?.insertAdjacentHTML('afterend',`<div class="notice gc230RiskRule"><b>RISK ≠ THREAT.</b> Risk is the job you choose. Threat is how hostile the region is while your people do it.</div>${gc230RegionBenefitsHTML(id,false)}`)}return out};
const _contractCardGC230=contractCard;
contractCard=function(c){
 let html=_contractCardGC230(c),r=state.regions[c.regionId],t=r?.threat??50,fake={expedition:{contract:c,gc201Momentum:0,gc201ContactExposure:0,gc213LastEncounterExposure:0},tactic:'Balanced',members:[]},rate=gc201ContactRate(fake),enemy=gc230ThreatEnemyMultiplier(t);
 const env=`<div class="gc230ContractEnv"><span>${gc230ThreatBand(t)} REGION • THREAT ${Math.round(t)}</span><b>Contact ${gc201ContactLabel(rate)} • enemy pressure ${gc230SignedPercent(enemy-1)}</b></div>`;
 return html.replace('<div class="actions">',env+'<div class="actions">');
};
const _renderContractsGC230=renderContracts;
renderContracts=function(){return _renderContractsGC230().replace('Threat controls the risk distribution, enemy count, elites and named enemy activity.','Contract Risk is independent of Threat. Threat changes travel, contact pressure and enemy support; hard work remains available even in safe regions.')};
const _gc193DailyDashboardGC230=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC230().replace('v20.2 • COMPANY FLOW','v20.3 • WORLD PRESSURE')+`<div class="gc230HQPulse"><b>REGIONAL CONDITION</b><span>Cleaning up ${esc(REGION_DEFS[state.currentRegion].name)} directly improves expedition safety, recruitment and the local economy.</span>${gc230RegionBenefitsHTML(state.currentRegion,true)}</div>`};

function gc230InstallStyles(){
 if(document.getElementById('gc230Styles'))return;const style=document.createElement('style');style.id='gc230Styles';style.textContent=`
 .gc230RegionBenefits{display:grid;grid-template-columns:1fr;gap:6px;margin:8px 0}.gc230Benefit{position:relative;padding:8px 9px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.025);border-radius:6px}.gc230Benefit>span{display:block;font-size:8px;letter-spacing:.12em;color:#928878}.gc230Benefit>b{display:block;font-size:18px;margin:2px 0}.gc230Benefit>small{display:block;font-size:9px;line-height:1.35;color:#b8aa96}.gc230Benefit.threat{border-left:2px solid rgba(192,79,68,.55)}.gc230Benefit.stability{border-left:2px solid rgba(174,155,104,.55)}.gc230Benefit.prosperity{border-left:2px solid rgba(177,132,68,.55)}
 .gc230Drift{grid-column:1/-1;padding:7px 8px;border:1px dashed rgba(255,255,255,.08);border-radius:5px;background:rgba(0,0,0,.12)}.gc230Drift span{display:block;font-size:8px;letter-spacing:.12em;color:#82796d}.gc230Drift b{display:block;margin-top:2px;font-size:10px;color:#c7bba9}.gc230Drift small{display:block;margin-top:2px;font-size:8px;color:#82796d}
 .gc230ContractEnv{margin:7px 0;padding:7px 8px;border:1px solid rgba(160,139,101,.18);background:rgba(160,139,101,.045);border-radius:5px;display:flex;justify-content:space-between;gap:8px;align-items:center}.gc230ContractEnv span{font-size:8px;letter-spacing:.1em;color:#988b79}.gc230ContractEnv b{font-size:9px;text-align:right;color:#c5b8a5}
 .gc230HQPulse{margin:10px 0 12px;padding:9px;border:1px solid rgba(154,127,83,.24);border-radius:7px;background:rgba(154,127,83,.04)}.gc230HQPulse>b{display:block;font-size:9px;letter-spacing:.14em;color:#c7a56d}.gc230HQPulse>span{display:block;margin-top:3px;font-size:10px;color:#a99d8d;line-height:1.35}.gc230RiskRule{margin-bottom:8px}
 @media(min-width:680px){.gc230RegionBenefits{grid-template-columns:repeat(3,1fr)}.gc230RegionBenefits.compact .gc230Drift{grid-column:1/-1}}
 `;document.head.appendChild(style);
}
gc230InstallStyles();

const _auditGC230=audit;
audit=function(){
 const out=_auditGC230();out.v230WorldPressure=GC230_VERSION;out.riskThreatSeparated=true;out.boardRiskSpread='1-5 after starter phase';out.threatExpeditionSafety=true;out.stabilityRecruitReliability=true;out.prosperityEconomyBenefits=true;out.ambientWorldPressure=true;out.noOfflineWorldPressure=true;out.contractRegionalImpact=true;out.worldPressureSummaryDays=GC230_AMBIENT_REPORT_DAYS;return out;
};
window.__BL_AUDIT=audit;
window.__GC230_TEST=function(){
 const ideal=gc230PressureRatesFor({threat:0,stability:100,prosperity:100,hq:{established:true}}),bad=gc230PressureRatesFor({threat:90,stability:20,prosperity:25,hq:{established:true}}),spread=gc230RequiredRisks(5),low=gc230ThreatContactMultiplier(0),high=gc230ThreatContactMultiplier(100);
 const ok=low<1&&high>1&&ideal.threat>0&&ideal.stability<0&&ideal.prosperity<0&&bad.threat>ideal.threat&&bad.stability<ideal.stability&&bad.prosperity<ideal.prosperity&&[1,2,3,4,5].every(x=>spread.includes(x));
 return{ok,lowThreatContact:low,highThreatContact:high,ideal,bad,spread};
};
