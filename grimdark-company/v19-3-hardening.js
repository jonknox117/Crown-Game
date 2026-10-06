/* Grim Company v19.3.1 — smart calendar/order hardening.
   Prevents free field healing, meaningless mentorship/facility assignments,
   and keeps daily choices mechanically substantive. */
const GC193_HARDENING='19.3.1';

function gc193CareerScore(a){
 if(!a)return 0;
 return (a.lvl||1)*10+bl17EnsureCareer(a)*12+Math.min(40,Number(a.missions)||0);
}
function gc193CanMentor(a,t){
 if(!a||!t||a.id===t.id||a.regionId!==t.regionId||t.status!=='Ready'||t.dailyOrder!=='Train')return false;
 return gc193CareerScore(a)>=gc193CareerScore(t)+8;
}
function gc193ReturningSoon(regionId){
 return state.parties.some(p=>{
   if(p.regionId!==regionId||!p.expedition||p.expedition.battle)return false;
   gc193MigrateExpedition(p);
   const e=p.expedition;
   return e.elapsedDays+1>=e.durationDays;
 });
}
function gc193UsefulFacilities(a){
 if(!a)return[];
 const id=a.regionId,up=hq(id).upgrades||{},out=[];
 const others=(f)=>gc193FacilityWorkers(id,f).filter(x=>x.id!==a.id);
 const wounded=state.roster.some(x=>x.regionId===id&&gc193AtHQ(x)&&x.status!=='Dead'&&(x.status==='Recovering'||x.hp<derived(x).maxHp));
 const trainees=state.roster.some(x=>x.id!==a.id&&x.regionId===id&&x.status==='Ready'&&x.dailyOrder==='Train');
 const contracts=state.regions[id].contracts||[];
 const supernatural=contracts.filter(c=>ENEMY_SPECIES[c.species]?.supernatural&&(Number(c.unknown)||0)>0);
 if((up.Infirmary||0)>0&&wounded&&others('Infirmary').length<2)out.push('Infirmary');
 if((up['Training Yard']||0)>0&&trainees&&others('Training Yard').length<2)out.push('Training Yard');
 if((up['Contract Office']||0)>0&&contracts.length>others('Contract Office').length)out.push('Contract Office');
 if((up['Occult Archive']||0)>0&&supernatural.length>others('Occult Archive').length)out.push('Occult Archive');
 if((up['Salvager’s Lodge']||0)>0&&gc193ReturningSoon(id)&&others('Salvager’s Lodge').length<2)out.push('Salvager’s Lodge');
 return out;
}

/* Patrol and Scout are field work. They no longer receive passive HQ healing.
   Train/Mentor/Facility get light recovery; Rest and injury Recovery remain fast. */
gc193HealAdventurer=function(a,effects,order,report){
 if(!gc193AtHQ(a))return;
 const max=derived(a).maxHp;
 a.hp=Math.min(max,Math.max(0,a.hp));
 const infLv=hq(a.regionId).upgrades.Infirmary||0;
 const facility=effects?.healPct||0;
 let pct=0;
 if(a.status==='Recovering')pct=.10;
 else if(a.status==='Ready'){
   if(order==='Rest')pct=.10;
   else if(['Train','Mentor','Facility'].includes(order))pct=.04;
   else pct=0;
 }
 const before=a.hp;
 if(pct>0){
   pct+=infLv*.01+facility;
   if(before<max)a.hp=Math.min(max,before+Math.max(1,Math.round(max*pct)));
 }
 if(a.status==='Recovering'&&a.recovery>0){
   a.recovery=Math.max(0,a.recovery-1);
   if(a.recovery===0){
     a.status='Ready';a.injury=null;
     if(!a.dailyOrder)a.dailyOrder='Rest';
     pushHistory(`${a.name} returned to duty.`,a.regionId);
   }
 }
 const healed=Math.max(0,a.hp-before);
 if(healed)report.push(`${a.name}: +${healed} HP (${a.hp}/${max})${a.status==='Recovering'?` • ${a.recovery} recovery day(s) left`:''}`);
 if(a.status==='Ready'&&order==='Rest'&&a.hp>=max){
   a.dailyOrder='Train';a.dailyMentorId=null;a.dailyFacility=null;
   report.push(`${a.name} is fully recovered; future order changed from Rest to Train.`);
 }
};

/* Multiple facility workers must contribute. Capacity is intentionally small so
   extra bodies cannot be assigned for fake productivity. */
gc193FacilityEffects=function(regionId){
 const effects={healPct:0,trainingMult:1,salvageBonus:0,officeWorkers:[],archiveWorkers:[]};
 const inf=gc193FacilityWorkers(regionId,'Infirmary').sort((a,b)=>(derived(b).util.occult+derived(b).combat.resolve)-(derived(a).util.occult+derived(a).combat.resolve)).slice(0,2);
 if(inf.length){
   effects.healPct=Math.min(.04,inf.reduce((s,a)=>s+.012+(derived(a).util.occult+derived(a).combat.resolve)/5000,0));
 }
 const trainers=gc193FacilityWorkers(regionId,'Training Yard').slice(0,2);
 if(trainers.length){
   const contribution=trainers.reduce((s,a)=>s+.12+Math.min(.16,(a.lvl*2+bl17EnsureCareer(a)*5+derived(a).combat.resolve*.2)/220),0);
   effects.trainingMult=1+Math.min(.65,contribution);
 }
 effects.officeWorkers=gc193FacilityWorkers(regionId,'Contract Office').sort((a,b)=>derived(b).util.talk-derived(a).util.talk).slice(0,3);
 effects.archiveWorkers=gc193FacilityWorkers(regionId,'Occult Archive').sort((a,b)=>derived(b).util.occult-derived(a).util.occult).slice(0,3);
 const salv=gc193FacilityWorkers(regionId,'Salvager’s Lodge').sort((a,b)=>derived(b).util.scout-derived(a).util.scout).slice(0,2);
 if(salv.length)effects.salvageBonus=Math.min(.24,salv.reduce((s,a)=>s+.05+derived(a).util.scout/900,0));
 return effects;
};

gc193FacilityWork=function(regionId,effects,report){
 const r=state.regions[regionId],used=new Set();
 const contracts=[...(r.contracts||[])].sort((a,b)=>b.reward-a.reward);
 (effects.officeWorkers||[]).forEach((a,i)=>{
   const c=contracts[i];
   if(!c)return;
   gc193EnsureContract(c);
   const bonus=Math.min(.18,.08+derived(a).util.talk/500);
   c.gcOfficeBonus=Math.max(c.gcOfficeBonus,bonus);
   grantXP(a,2);used.add(a.id);
   report.push(`${a.name} worked the Contract Office: ${c.title} prepared for +${Math.round(c.gcOfficeBonus*100)}% payout.`);
 });
 const supernatural=contracts.filter(c=>ENEMY_SPECIES[c.species]?.supernatural&&(Number(c.unknown)||0)>0);
 (effects.archiveWorkers||[]).forEach((a,i)=>{
   const c=supernatural[i];
   if(!c)return;
   gc193EnsureContract(c);
   c.unknown=Math.max(0,(c.unknown||0)-1);
   c.gcOccultEdge=Math.max(c.gcOccultEdge,Math.min(.12,.05+derived(a).util.occult/500));
   grantXP(a,2);used.add(a.id);
   report.push(`${a.name} worked the Occult Archive: ${c.title} lost one supernatural unknown.`);
 });
 gc193FacilityWorkers(regionId,'Infirmary').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
 gc193FacilityWorkers(regionId,'Training Yard').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
 gc193FacilityWorkers(regionId,'Salvager’s Lodge').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
};

gc193Mentor=function(a,effects,report){
 const t=state.roster.find(x=>x.id===a.dailyMentorId);
 if(!gc193CanMentor(a,t)){
   a.dailyOrder='Train';a.dailyMentorId=null;
   report.push(`${a.name}'s mentorship assignment was no longer valid; they trained instead.`);
   return gc193Train(a,effects,report);
 }
 const gap=Math.max(8,gc193CareerScore(a)-gc193CareerScore(t)),yard=hq(a.regionId).upgrades['Training Yard']||0;
 const xp=Math.round((9+yard*2+Math.min(12,gap/4))*(effects?.trainingMult||1));
 grantXP(t,xp);grantXP(a,2);
 if(typeof bl18AdjustRelation==='function')bl18AdjustRelation(a,t,{trust:2,respect:3,affinity:1},'training together');
 report.push(`${a.name} mentored ${t.name}: ${t.name} gained +${xp} XP.`);
};

gc193MentorPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a)return;
 const targets=state.roster.filter(t=>gc193CanMentor(a,t));
 modal(`<div class="sheetHead"><h3>Mentor • ${esc(a.name)}</h3><button class="x" data-action="close">×</button></div><div class="notice">Only less-experienced adventurers currently assigned to Train can be mentored.</div><div class="list">${targets.map(t=>`<button class="card statline" data-action="gcMentorTarget" data-id="${a.id}" data-target="${t.id}"><span><b>${esc(t.name)}</b><br><span class="tiny muted">Lv.${t.lvl} ${esc(t.className)} • ${t.missions||0} contracts</span></span><span>Choose</span></button>`).join('')||'<div class="empty">No genuinely eligible trainee is available today.</div>'}</div>`);
};

gc193FacilityPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a)return;
 const list=gc193UsefulFacilities(a);
 const desc={Infirmary:'Improves actual HP recovery for wounded people at this HQ today.','Training Yard':'Raises today’s XP for adventurers assigned to Train.','Contract Office':'Prepares a real payout bonus on an available contract.','Occult Archive':'Removes supernatural unknowns and adds countermeasures.',"Salvager’s Lodge":'Raises cache recovery odds for an expedition that can return today.'};
 modal(`<div class="sheetHead"><h3>Facility Duty • ${esc(a.name)}</h3><button class="x" data-action="close">×</button></div><div class="list">${list.map(f=>`<button class="card gc193OrderChoice" data-action="gcFacilityTarget" data-id="${a.id}" data-value="${esc(f)}"><b>${esc(f)}</b><span>${esc(desc[f])}</span></button>`).join('')||'<div class="empty">No upgraded facility has meaningful work for another adventurer today.</div>'}</div>`);
};

gc193OrderPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 const max=derived(a).maxHp,contracts=state.regions[a.regionId].contracts||[];
 const choices=['Train'];
 if(a.hp<max)choices.unshift('Rest');
 if(state.regions[a.regionId].threat>0)choices.push('Patrol');
 if(contracts.some(c=>(Number(c.gcIntel)||0)<2||(Number(c.unknown)||0)>0))choices.push('Scout');
 if(state.roster.some(t=>gc193CanMentor(a,t)))choices.push('Mentor');
 if(gc193UsefulFacilities(a).length)choices.push('Facility');
 const desc={Rest:'Fastest HP recovery; no XP or field utility.',Train:'Gain XP and light HQ recovery.',Patrol:'Suppress Threat and risk real local skirmishes; no free healing.',Scout:'Improve a specific contract’s intelligence and opening edge; no free healing.',Mentor:'Trade this veteran’s day for meaningful growth in a less-experienced trainee.',Facility:'Staff an upgraded facility only when it has a concrete job today.'};
 modal(`<div class="sheetHead"><div><h3>Order • ${esc(a.name)}</h3><div class="tiny muted">Current: ${esc(gc193OrderLabel(a))}</div></div><button class="x" data-action="close">×</button></div><div class="list">${choices.map(o=>`<button class="card gc193OrderChoice" data-action="gcSetOrder" data-id="${a.id}" data-value="${o}"><b>${o}</b><span>${esc(desc[o])}</span></button>`).join('')}</div>`);
};

/* Keep a single authoritative day-advance control on the dashboard. */
const _renderHQGC193H=renderHQ;
renderHQ=function(){
 let html=_renderHQGC193H();
 html=html.replace(/<button class="card gc193AdvanceCard" data-action="gcAdvanceDay">[\s\S]*?<\/button>/,`<button class="card gc193AdvanceCard" data-action="gcOrders"><b>Daily Orders</b><div class="tiny muted">Assign productive work before advancing the calendar</div></button>`);
 return html;
};

const _auditGC193H=audit;
audit=function(){
 const out=_auditGC193H();
 out.grimCompanyHardening=GC193_HARDENING;
 out.fieldOrdersReceiveHQHealing=false;
 out.mentorRequiresExperienceAdvantage=true;
 out.facilityAssignmentsRequireUsefulWork=true;
 out.facilityWorkerCaps=true;
 return out;
};
window.__BL_AUDIT=audit;
