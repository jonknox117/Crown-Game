/* Broken Lantern v21.9.2 — Chapterhouse works during the Freeblade phase.
   Earlier presence bonuses already affected solo stance work, so the director
   bonus must use the same simulation instead of being visually locked. */
const GC392_VERSION='21.9.2';

const _gc390DirectorGC392=gc390Director;
gc390Director=function(rid){
 if(gc270IsFreeblade()){
  const founder=gc260Founder(),presence=gc340SyncPresence();
  return founder&&founder.regionId===rid&&founder.status==='Ready'&&
   presence?.regionId===rid&&presence.mode==='town'&&presence.place==='hall'
   ?{a:founder,source:'Founder'}:null;
 }
 return _gc390DirectorGC392(rid);
};
const _gc390WorkBonusGC392=gc390WorkBonus;
gc390WorkBonus=function(rid,stance){
 if(!gc270IsFreeblade())return _gc390WorkBonusGC392(rid,stance);
 if(!GC390_STANCES.includes(stance))return 1;
 /* No HQ specialist posts exist before founding, only the player's own
    Chapterhouse oversight. The multiplier applies to real solo work ticks. */
 return gc390Power(gc390Director(rid)?.a,'director');
};

const _gc391HomePresenceGC392=gc391HomePresence;
gc391HomePresence=function(rid){
 if(gc270IsFreeblade()){
  const founder=gc260Founder(),head=gc390Director(rid);
  const ratio=gc390Power(head?.a,'director');
  const percentage=Math.round((ratio-1)*100);
  if(head){
   return{
    label:'HOME • PERSONAL LEADERSHIP',
    badge:'+'+percentage+'%',
    kind:'active',
    description:'Your Level '+founder.lvl+' and '+gc360RankName(founder)+
     ' career provide +'+percentage+
     '% to Scout, Odd Jobs, Train and Recover work while you are at the Chapterhouse. This is a real Freeblade bonus. Founding a company later unlocks appointable commanders and stance leaders.'
   };
  }
  return{
   label:'HOME • LEADERSHIP INACTIVE',badge:'0%',kind:'inactive',
   description:'Return here while Ready to apply your Level and career-based personal leadership bonus to local work. You do not need to found a company first.'
  };
 }
 return _gc391HomePresenceGC392(rid);
};
const _auditGC392=audit;
audit=function(){
 const a=_auditGC392();
 a.v392FreebladeHomeBonus=GC392_VERSION;
 a.freebladeHomeDirectorActive=true;
 a.freebladeHomeBenefitAppliedToWork=true;
 a.noPrematureManagerUnlocks=true;
 return a;
};
window.__BL_AUDIT=audit;
