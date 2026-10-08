/* Grim Company v21.10.1 — hired freelancers must become employees.
   Do not touch independent freeblade contractors or temporary expedition crew. */
const GC411_VERSION='21.10.1';
function gc411RepairSignedPeople(s){
 if(!s||!gc270IsCompany(s))return 0;
 let repaired=0;
 for(const a of s.roster||[]){
  if(a.status!=='Freelancer'||a.gc310Temporary)continue;
  a.status='Ready';
  a.gc310Freelancer=false;
  a.gc310Temporary=false;
  if(!a.dailyOrder)a.dailyOrder='Train';
  for(const r of Object.values(s.regions||{})){
   if(Array.isArray(r.gc310Freelancers)){
    r.gc310Freelancers=r.gc310Freelancers.filter(f=>f.id!==a.id);
   }
  }
  repaired++;
 }
 return repaired;
}
/* The loaded-save normalization is the safest point to repair existing companies:
   the original record and its identity, gear, history and XP are preserved. */
const _normalizeStateGC411=normalizeState;
normalizeState=function(s){
 const loaded=_normalizeStateGC411(s);
 gc411RepairSignedPeople(loaded);
 return loaded;
};
/* The v20.1 hiring path sets the training duty but retains Freelancer status.
   The v21.1 known-freelancer wrapper clears a flag, not the actual status.
   Complete the conversion only after a genuinely successful signing. */
const _hireRecruitGC411=hireRecruit;
hireRecruit=function(id){
 const before=state?.roster?.some(a=>a.id===id);
 const result=_hireRecruitGC411(id);
 const hired=!before&&gc270IsCompany()?state?.roster?.find(a=>a.id===id):null;
 if(!hired)return result;
 const r=state.regions?.[hired.regionId];
 if(r&&Array.isArray(r.gc310Freelancers)){
  r.gc310Freelancers=r.gc310Freelancers.filter(a=>a.id!==id);
 }
 if(hired.status==='Freelancer')hired.status='Ready';
 hired.gc310Temporary=false;
 hired.gc310Freelancer=false;
 if(!hired.dailyOrder)hired.dailyOrder='Train';
 save();render();
 return result;
};
