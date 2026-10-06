/* Grim Company v19.3.3 — reconcile order hardening with calendar-expiry rules. */
const GC193_INTEGRATION='19.3.3';
function gc193LiveContracts(regionId){
 return typeof gc193TomorrowContracts==='function'?gc193TomorrowContracts(regionId):((state.regions[regionId].contracts||[]).filter(c=>c.expires==null||c.expires>state.company.day).map(gc193EnsureContract));
}

gc193UsefulFacilities=function(a){
 if(!a)return[];
 const id=a.regionId,up=hq(id).upgrades||{},out=[];
 const others=(f)=>gc193FacilityWorkers(id,f).filter(x=>x.id!==a.id);
 const wounded=state.roster.some(x=>x.regionId===id&&gc193AtHQ(x)&&x.status!=='Dead'&&(x.status==='Recovering'||x.hp<derived(x).maxHp));
 const trainees=state.roster.some(x=>x.id!==a.id&&x.regionId===id&&x.status==='Ready'&&x.dailyOrder==='Train');
 const contracts=gc193LiveContracts(id);
 const supernatural=contracts.filter(c=>ENEMY_SPECIES[c.species]?.supernatural&&(Number(c.unknown)||0)>0);
 if((up.Infirmary||0)>0&&wounded&&others('Infirmary').length<2)out.push('Infirmary');
 if((up['Training Yard']||0)>0&&trainees&&others('Training Yard').length<2)out.push('Training Yard');
 if((up['Contract Office']||0)>0&&contracts.length>others('Contract Office').length)out.push('Contract Office');
 if((up['Occult Archive']||0)>0&&supernatural.length>others('Occult Archive').length)out.push('Occult Archive');
 if((up['Salvager’s Lodge']||0)>0&&gc193ReturningSoon(id)&&others('Salvager’s Lodge').length<2)out.push('Salvager’s Lodge');
 return out;
};

gc193FacilityWork=function(regionId,effects,report){
 const contracts=gc193LiveContracts(regionId).sort((a,b)=>b.reward-a.reward),used=new Set();
 (effects.officeWorkers||[]).forEach((a,i)=>{
   const c=contracts[i];if(!c)return;
   const bonus=Math.min(.18,.08+derived(a).util.talk/500);
   c.gcOfficeBonus=Math.max(c.gcOfficeBonus,bonus);grantXP(a,2);used.add(a.id);
   report.push(`${a.name} worked the Contract Office: ${c.title} prepared for +${Math.round(c.gcOfficeBonus*100)}% payout.`);
 });
 const supernatural=contracts.filter(c=>ENEMY_SPECIES[c.species]?.supernatural&&(Number(c.unknown)||0)>0);
 (effects.archiveWorkers||[]).forEach((a,i)=>{
   const c=supernatural[i];if(!c)return;
   c.unknown=Math.max(0,(c.unknown||0)-1);
   c.gcOccultEdge=Math.max(c.gcOccultEdge,Math.min(.12,.05+derived(a).util.occult/500));grantXP(a,2);used.add(a.id);
   report.push(`${a.name} worked the Occult Archive: ${c.title} lost one supernatural unknown.`);
 });
 gc193FacilityWorkers(regionId,'Infirmary').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
 gc193FacilityWorkers(regionId,'Training Yard').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
 gc193FacilityWorkers(regionId,'Salvager’s Lodge').slice(0,2).forEach(a=>{if(!used.has(a.id))grantXP(a,2);used.add(a.id)});
};

gc193OrderPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 const max=derived(a).maxHp,contracts=gc193LiveContracts(a.regionId),choices=['Train'];
 if(a.hp<max)choices.unshift('Rest');
 if(state.regions[a.regionId].threat>0)choices.push('Patrol');
 if(contracts.some(c=>(Number(c.gcIntel)||0)<2||(Number(c.unknown)||0)>0))choices.push('Scout');
 if(state.roster.some(t=>gc193CanMentor(a,t)))choices.push('Mentor');
 if(gc193UsefulFacilities(a).length)choices.push('Facility');
 const desc={Rest:'Fastest HP recovery; no XP or field utility.',Train:'Gain XP and light HQ recovery.',Patrol:'Suppress Threat and risk real local skirmishes; no free healing.',Scout:'Improve a contract that will still exist tomorrow; no free healing.',Mentor:'Trade this veteran’s day for meaningful growth in a less-experienced trainee.',Facility:'Staff an upgraded facility only when it has a concrete job today.'};
 modal(`<div class="sheetHead"><div><h3>Order • ${esc(a.name)}</h3><div class="tiny muted">Current: ${esc(gc193OrderLabel(a))}</div></div><button class="x" data-action="close">×</button></div><div class="list">${choices.map(o=>`<button class="card gc193OrderChoice" data-action="gcSetOrder" data-id="${a.id}" data-value="${o}"><b>${o}</b><span>${esc(desc[o])}</span></button>`).join('')}</div>`);
};

const _auditGC193I=audit;
audit=function(){const out=_auditGC193I();out.grimCompanyIntegration=GC193_INTEGRATION;out.meaningfulOrdersRespectContractExpiry=true;return out};
window.__BL_AUDIT=audit;
