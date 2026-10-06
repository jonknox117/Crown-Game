/* Grim Company v19.3 — order clarity + runtime integrity checks. */
const GC193_CLARITY='19.3.1';

function gc193EligibleMentorTargets(a){
 if(!a)return[];
 const mentorRank=bl17EnsureCareer(a);
 return state.roster.filter(x=>x.id!==a.id&&x.regionId===a.regionId&&x.status==='Ready'&&(x.lvl<a.lvl||bl17EnsureCareer(x)<mentorRank));
}

const _gc193OrderPickClarity=gc193OrderPick;
gc193OrderPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a||a.status!=='Ready')return;
 const hasMentorTarget=gc193EligibleMentorTargets(a).length>0;
 const hasFacility=GC193_FACILITIES.some(f=>(hq(a.regionId).upgrades[f]||0)>0);
 const orders=GC193_ORDERS.filter(o=>(o!=='Mentor'||hasMentorTarget)&&(o!=='Facility'||hasFacility));
 const desc={
  Rest:'Heal 10% max HP plus Infirmary/staff bonuses. No XP or field utility.',
  Train:'Heal 4% max HP plus HQ bonuses and gain XP.',
  Patrol:'Heal 4% max HP before duty; suppress regional Threat and risk real skirmish damage.',
  Scout:'Heal 4% max HP; improve a real contract’s intel, unknowns, and opening advantage.',
  Mentor:'Heal 4% max HP; give a junior extra XP and build Trust/Respect.',
  Facility:'Heal 4% max HP; staff an upgraded facility with a concrete daily effect.'
 };
 modal(`<div class="sheetHead"><div><h3>Order • ${esc(a.name)}</h3><div class="tiny muted">Current: ${esc(gc193OrderLabel(a))}</div></div><button class="x" data-action="close">×</button></div><div class="list">${orders.map(o=>`<button class="card gc193OrderChoice" data-action="gcSetOrder" data-id="${a.id}" data-value="${o}"><b>${o}</b><span>${esc(desc[o])}</span></button>`).join('')}</div>`);
};

gc193MentorPick=function(id){
 const a=state.roster.find(x=>x.id===id);if(!a)return;
 const targets=gc193EligibleMentorTargets(a);
 modal(`<div class="sheetHead"><h3>Mentor • ${esc(a.name)}</h3><button class="x" data-action="close">×</button></div><div class="notice">The trainee must spend the day Training. Mentorship is only available to a genuinely less-experienced adventurer.</div><div class="list">${targets.map(t=>`<button class="card statline" data-action="gcMentorTarget" data-id="${a.id}" data-target="${t.id}"><span><b>${esc(t.name)}</b><br><span class="tiny muted">Lv.${t.lvl} ${esc(t.className)} • ${esc(gc193OrderLabel(t))}</span></span><span>Choose</span></button>`).join('')||'<div class="empty">No less-experienced eligible trainee is at this HQ.</div>'}</div>`);
};

function gc193SelfCheck(){
 const issues=[];
 if(!state)return{ok:true,issues};
 state.roster.forEach(a=>{
   if(a.status==='Ready'&&!GC193_ORDERS.includes(a.dailyOrder||'Train'))issues.push(`${a.name}: invalid daily order`);
   if(a.hp>derived(a).maxHp+0.001)issues.push(`${a.name}: HP exceeds derived max`);
 });
 state.parties.filter(p=>p.expedition).forEach(p=>{
   const e=p.expedition;
   if(!e.gcClock)issues.push(`${p.name}: expedition missing global-clock migration`);
   if((e.elapsedDays||0)>(e.durationDays||Infinity))issues.push(`${p.name}: elapsed time exceeds duration`);
 });
 return{ok:issues.length===0,issues};
}

const _auditGC193Clarity=audit;
audit=function(){
 const out=_auditGC193Clarity();
 out.grimCompanyClarity=GC193_CLARITY;
 out.invalidDailyOptionsHidden=true;
 out.healingRates={activeHQ:'.04 + infirmary + staffing',rest:'.10 + infirmary + staffing',recovering:'.10 + infirmary + staffing',expedition:'0 passive'};
 out.runtimeCheck=gc193SelfCheck();
 return out;
};
window.__BL_AUDIT=audit;
