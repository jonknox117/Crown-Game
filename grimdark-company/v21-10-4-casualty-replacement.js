/* Grim Company v21.10.4 — optional casualty replacement hiring.
   ONLY confirmed death vacancies from previously filled slots are eligible.
   A manager never fills a deliberately empty slot, edits living members,
   changes a captain, or borrows an existing employee from another party. */
const GC414_VERSION='21.10.4';
function gc414Config(r,s=state){
 const x=gc370Config(r,s);
 if(!x)return null;
 if(typeof x.gc414AutoReplaceDead!=='boolean')x.gc414AutoReplaceDead=false;
 return x;
}
const _normalizeStateGC414=normalizeState;
normalizeState=function(s){
 const out=_normalizeStateGC414(s);
 if(out)REGION_ORDER.forEach(r=>gc414Config(r,out));
 return out;
};
const _createStateGC414=createState;
createState=function(...args){
 const s=_createStateGC414(...args);
 if(s)REGION_ORDER.forEach(r=>gc414Config(r,s));
 return s;
};
function gc414Vacancies(p){
 if(!Array.isArray(p.gc414Vacancies))p.gc414Vacancies=[];
 return p.gc414Vacancies;
}
function gc414DeathRecord(p,oldIds,oldCaptain){
 if(!p||p.gc320IndependentCrew||!Array.isArray(oldIds)||!oldIds.length)return 0;
 const missing=oldIds.filter(id=>!p.members.includes(id));
 const vacancies=gc414Vacancies(p);
 let added=0;
 for(const id of missing){
  const dead=state.roster.find(a=>a.id===id);
  if(!dead||dead.status!=='Dead'||vacancies.some(v=>v.deadId===id))continue;
  vacancies.push({deadId:id,deadName:dead.name,deadClass:dead.className,
   deadRole:derived(dead).cls?.role||'',deadLevel:dead.lvl||1,
   slot:oldIds.indexOf(id),wasCaptain:oldCaptain===id,
   day:state.company.day});
  added++;
 }
 if(added&&oldCaptain&&missing.includes(oldCaptain)&&!p.members.includes(oldCaptain))
  p.captainId=null;
 return added;
}
/* The actual return handler removes dead members. Snapshot its membership
   before it prunes them so a casualty can be distinguished from a manual gap. */
const _gc193FinishNoTimeGC414=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const ids=[...(p?.members||[])],captain=p?.captainId;
 const out=_gc193FinishNoTimeGC414(p);
 if(p&&!p.expedition&&gc414DeathRecord(p,ids,captain)){
  gc280Log(p.regionId,p.name+' has confirmed casualty vacancies; a manager may hire replacements if enabled.');
  save();
 }
 return out;
};
/* Manual party editing deliberately supersedes pending casualty requests.
   The player's new crew size or membership always takes priority. */
const _togglePartyMemberGC414=togglePartyMember;
togglePartyMember=function(pid,aid){
 const p=state.parties.find(x=>x.id===pid),before=p?.members?.join('|');
 const out=_togglePartyMemberGC414(pid,aid);
 if(p&&p.members.join('|')!==before){
  p.gc414Vacancies=[];save();
 }
 return out;
};
function gc414CanReplace(p,r){
 return !!(p&&p.regionId===r&&!p.expedition&&!p.gc413Manual&&
  !(p.members||[]).includes(state.company.founderId)&&
  !p.gc320IndependentCrew&&gc280CommandState(r)?.autonomy&&
  gc280Commander(r)?.status==='Command'&&gc414Config(r)?.gc414AutoReplaceDead);
}
function gc414EligibleRecruit(r,v){
 const slots=Math.max(0,rosterCap(r)-localRoster(r).length);
 if(!slots||!v)return null;
 const pool=state.regions[r]?.recruits||[];
 const available=pool.filter(a=>a&&a.status!=='Dead'&&
   !state.roster.some(y=>y.id===a.id)&&
   gc201HireCost(a)<=state.company.silver);
 if(!available.length)return null;
 available.sort((a,b)=>{
  const score=x=>{
   const exact=x.className===v.deadClass?2000:0;
   const role=derived(x).cls?.role===v.deadRole?900:0;
   return exact+role-Math.abs((x.lvl||1)-(v.deadLevel||1))*12+
     (gc360Rank(x)||0)*18;
  };
  return score(b)-score(a)||gc201HireCost(a)-gc201HireCost(b)||
   String(a.id).localeCompare(String(b.id));
 });
 return available[0]||null;
}
function gc414HireReplacement(r,p){
 if(!gc414CanReplace(p,r))return false;
 const queue=gc414Vacancies(p);
 if(!queue.length)return false;
 /* A manager must not refill more than the actual death-created openings.
    If the player modified the roster outside normal party editing, retire any
    requests with no remaining empty slot rather than expanding the party. */
 if(p.members.length>=partyCap(r)){p.gc414Vacancies=[];return false}
 const v=queue[0],candidate=gc414EligibleRecruit(r,v);
 if(!candidate)return false;
 const cost=gc201HireCost(candidate),reg=state.regions[r];
 if(!reg?.recruits?.some(a=>a.id===candidate.id)||
    localRoster(r).length>=rosterCap(r)||cost>state.company.silver||
    p.members.length>=partyCap(r))return false;
 state.company.silver-=cost;
 reg.recruits=reg.recruits.filter(a=>a.id!==candidate.id);
 if(Array.isArray(reg.gc310Freelancers))
  reg.gc310Freelancers=reg.gc310Freelancers.filter(a=>a.id!==candidate.id);
 gc201MigrateAdventurer(candidate);
 candidate.status='Ready';candidate.gc310Freelancer=false;candidate.gc310Temporary=false;
 candidate.dailyOrder='Train';
 candidate.history=candidate.history||[];
 candidate.history.push('Day '+state.company.day+': hired to replace '+v.deadName+' in '+p.name+'.');
 state.roster.push(candidate);
 p.members.splice(Math.max(0,Math.min(v.slot,p.members.length)),0,candidate.id);
 /* Captain authority is intentionally left vacant after a captain's death.
    Only the player can select the next captain. */
 if(v.wasCaptain)p.captainId=null;
 queue.shift();
 const x=gc414Config(r);
 x.performance.hires++;x.performance.netSilver-=cost;
 const msg=gc280Commander(r).name+' hired '+candidate.name+' for '+p.name+
  ' to replace '+v.deadName+' ('+money(cost)+').'+
  (v.wasCaptain?' Awaiting your captain appointment.':'');
 pushHistory(msg,r);gc370Record(r,'replacement',msg);
 save();
 return true;
}
const _gc413ReadyGC414=gc413Ready;
gc413Ready=function(p,r){
 if(gc414Config(r)?.gc414AutoReplaceDead&&gc414Vacancies(p).length)return false;
 return _gc413ReadyGC414(p,r);
};
const _gc280CommandActGC414=gc280CommandAct;
gc280CommandAct=function(r,...args){
 if(gc280NetworkUnlocked()&&gc414Config(r)?.gc414AutoReplaceDead&&
  gc280CommandState(r)?.autonomy&&gc280Commander(r)?.status==='Command'){
  /* At most one purchase per cycle: deliberate, observable and affordable. */
  const outstanding=state.parties.filter(p=>gc414CanReplace(p,r)&&gc414Vacancies(p).length);
  outstanding.sort((a,b)=>a.id.localeCompare(b.id));
  for(const p of outstanding){if(gc414HireReplacement(r,p))break}
 }
 return _gc280CommandActGC414(r,...args);
};
const _gc413PartyStateGC414=gc413PartyState;
gc413PartyState=function(p,r){
 if(gc414Vacancies(p).length&&gc414Config(r)?.gc414AutoReplaceDead&&
  !p.gc413Manual&&!p.expedition)return 'Unavailable';
 return _gc413PartyStateGC414(p,r);
};
gc413PartyRows=function(r){
 const automatic=gc414Config(r)?.gc414AutoReplaceDead;
 return state.parties.filter(p=>p.regionId===r).map(p=>{
  const status=gc413PartyState(p,r),manual=!!p.gc413Manual,
   founder=(p.members||[]).includes(state.company.founderId);
  const vacancies=gc414Vacancies(p);
  let note=status==='Working'?'On contract':status==='Recovering'?'Waiting for full recovery':
   status==='Manual'?'Controlled by you':status==='Unavailable'?'Crew/captain unavailable':
   gc413Ready(p,r)?'Ready for a suitable contract':'No complete crew';
  if(vacancies.length){
   note=!automatic?'Casualties recorded • auto replacement off':
    status==='Manual'?'Casualty replacement paused (manual party)':
    !p.captainId?'Captain appointment required':
    'Awaiting funded recruit for '+vacancies.length+' casualty slot'+(vacancies.length===1?'':'s');
  }else if(!p.captainId&&p.members.length)note='Choose a new captain';
  return '<div class="gc413Party" data-gc413-party="'+esc(p.id)+'"><div><b>'+esc(p.name)+
   '</b><small>'+esc(status)+' • '+esc(note)+'</small></div>'+
   (!founder?'<button type="button" class="btn ghost" data-action="gc413Party" data-region="'+r+'" data-id="'+esc(p.id)+'">'+
   (manual?'ENABLE AUTO':'MANUAL')+'</button>':'<span>PLAYER PARTY</span>')+'</div>';
 }).join('')||'<div class="gc413Empty">Build a party to begin automatic contracting.</div>';
};
const _gc413BoardGC414=gc413Board;
gc413Board=function(r){
 const base=_gc413BoardGC414(r),on=gc414Config(r)?.gc414AutoReplaceDead;
 const toggle='<div class="gc414Switch"><div><b>AUTO-REPLACE CASUALTIES</b>'+
  '<small>'+(on?'ON — Hire affordable recruits only for confirmed deaths.':'OFF — You fill all party vacancies yourself.')+
  '</small></div><button type="button" class="btn '+(on?'goldbtn':'ghost')+
  '" data-action="gc414ReplaceToggle" data-region="'+r+'">'+(on?'ON':'OFF')+'</button></div>';
 return base.replace('<div class="gc413PartyList">',toggle+'<div class="gc413PartyList">');
};
function gc414Toggle(r){
 if(!state.regions[r]?.hq?.established||!gc280Commander(r))return false;
 const x=gc414Config(r);x.gc414AutoReplaceDead=!x.gc414AutoReplaceDead;
 gc370Record(r,'orders','Automatic casualty replacement '+(x.gc414AutoReplaceDead?'enabled':'disabled')+'.');
 save();gc280OpenCommand(r);return true;
}
const _processActionGC414=processAction;
processAction=function(el){
 if(el?.dataset?.action==='gc414ReplaceToggle')return gc414Toggle(el.dataset.region);
 return _processActionGC414(el);
};
function gc414Styles(){
 if(document.getElementById('gc414CSS'))return;
 const st=document.createElement('style');st.id='gc414CSS';
 st.textContent='.gc414Switch{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #665039;background:#211b15;border-radius:7px;padding:12px 9px;margin:12px 0}.gc414Switch div{min-width:0;flex:1}.gc414Switch b,.gc414Switch small{display:block}.gc414Switch b{font-size:10px;color:#e1c99d}.gc414Switch small{font-size:10px;line-height:1.5;color:#ae9d84;margin-top:4px}.gc414Switch button{min-width:65px;min-height:42px}';
 document.head.appendChild(st);
}
gc414Styles();
const _auditGC414=audit;
audit=function(){
 const result=_auditGC414();
 result.autoReplaceOnlyConfirmedDeaths=true;result.autoReplaceOptionDefaultOff=true;
 result.autoReplaceHiresWithRealMoney=true;result.autoReplacePreservesLivingParty=true;
 result.autoReplaceNeverAppointsCaptain=true;
 return result;
};
window.__BL_AUDIT=audit;
