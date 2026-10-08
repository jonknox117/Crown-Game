/* Broken Lantern v21.9.4 — permanent NPC leadership appointments.
   A leadership post is an assignment, not the adventurer's current daily job.
   No bonus is lost because of a daily-order change, expedition, recovery,
   region transfer, captivity or being promoted to another command duty.
   Death, dismissal and explicit reassignment are the only ways it ends. */
const GC394_VERSION='21.9.4';
function gc394LivingMember(s,id){
 return !!id&&(s?.roster||[]).find(a=>a.id===id&&a.status!=='Dead')||null;
}
gc390EnsurePosts=function(rid,s=state){
 const h=s?.regions?.[rid]?.hq;
 if(!h)return null;
 if(!h.gc390Posts||typeof h.gc390Posts!=='object'||Array.isArray(h.gc390Posts))h.gc390Posts={};
 for(const st of GC390_STANCES){
  const id=h.gc390Posts[st];
  h.gc390Posts[st]=gc394LivingMember(s,id)?id:null;
 }
 return h.gc390Posts;
};
gc390StanceLead=function(rid,stance){
 if(!GC390_STANCES.includes(stance)||!state?.regions?.[rid]?.hq?.established)return null;
 return gc394LivingMember(state,gc390EnsurePosts(rid)?.[stance]);
};
gc390PotentialLead=function(rid,a){
 return!!(a&&a.id!==state?.company?.founderId&&a.regionId===rid&&a.status!=='Dead'
  &&!gc280CommanderRegion(a.id));
};
gc390SetPost=function(rid,stance,id){
 if(!GC390_STANCES.includes(stance)||!gc270IsCompany()||!state?.regions?.[rid]?.hq?.established)return false;
 const posts=gc390EnsurePosts(rid);
 if(id==='none'){
  posts[stance]=null;
  save();render();
  return true;
 }
 const a=state.roster.find(a=>a.id===id);
 if(!gc390PotentialLead(rid,a))return toast('Choose a living adventurer stationed in this region.');
 /* A living NPC can serve one appointed stance across the company's HQs.
    Deliberately assigning to a different post moves them, but normal duty
    changes never dislodge the appointment. */
 REGION_ORDER.forEach(region=>{
  const other=gc390EnsurePosts(region);
  if(other)GC390_STANCES.forEach(st=>{
   if((region!==rid||st!==stance)&&other[st]===a.id)other[st]=null;
  });
 });
 posts[stance]=a.id;
 /* Never mutate dailyOrder, recovery, team membership or expedition state. */
 pushHistory(a.name+' accepted a standing appointment as '+GC390_LABEL[stance]+' of '+REGION_DEFS[rid].name+'.',rid);
 save();render();
 return true;
};
const _gc390DirectorGC394=gc390Director;
gc390Director=function(rid){
 if(!gc270IsFreeblade()&&state?.regions?.[rid]?.hq?.established){
  const appointed=gc394LivingMember(state,gc280CommandState(rid)?.commanderId);
  if(appointed)return{a:appointed,source:'Commander'};
 }
 return _gc390DirectorGC394(rid);
};
/* Keep the original panel's slot percentages but remove the contradictory
   'unavailable' copy. Active assigned bonuses are always applied. */
const _gc390HQStaffPanelGC394=gc390HQStaffPanel;
gc390HQStaffPanel=function(...args){
 return _gc390HQStaffPanelGC394(...args)
  .replaceAll('Unavailable • ','Active • ')
  .replace('Stationed leaders remain available for field work, but their HQ bonus ends while away.',
   'Appointments are permanent: a living leader gives the bonus during expeditions, recovery and other duties. Only death, dismissal or reassignment removes it.');
};
const _gc390LeadPickerGC394=gc390LeadPicker;
gc390LeadPicker=function(...args){
 const out=_gc390LeadPickerGC394(...args);
 const sheet=document.getElementById('sheet');
 if(sheet){
  [...sheet.querySelectorAll('.notice')].forEach(n=>{
   if(n.textContent.includes('An absent or wounded leader provides no benefit.'))
    n.textContent='Assign any living local adventurer. The leadership bonus remains active regardless of their stance, expedition, injury or location. Their normal duty is unchanged.';
  });
 }
 return out;
};
const _gc393RoomManagementGC394=gc393RoomManagement;
gc393RoomManagement=function(rid){
 return _gc393RoomManagementGC394(rid)
  .replace('Appointed stance leaders help their own room whether you are here or away.',
   'Appointed NPC leaders continuously improve their own room, even while on an expedition or recovering.');
};
const _auditGC394=audit;
audit=function(){
 const out=_auditGC394();
 out.v394PermanentManagers=GC394_VERSION;
 out.stanceBonusesPersistOnExpedition=true;
 out.stanceBonusesPersistWhileRecovering=true;
 out.stanceBonusesIndependentOfDailyOrders=true;
 out.deadAppointeesVacatePost=true;
 out.assignedUnavailableRemoved=true;
 return out;
};
window.__BL_AUDIT=audit;