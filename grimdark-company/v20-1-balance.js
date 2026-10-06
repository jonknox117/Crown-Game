/* Grim Company v20.1.1 — early-game danger/economy balance. */
const GC201_BALANCE='20.1.1';
const GC201_STARTING_SILVER=160;
const GC201_CONTACT_MULT={1:1.10,2:1.20,3:1.30,4:1.35,5:1.40};

/* Continuous contact pressure was landing too softly in live runs, especially at
   Risk 2–3. Preserve every existing modifier, but weight the final native tick
   hazard upward by career bracket so higher-risk work is much less likely to be
   free money while Risk 1 remains relatively forgiving. */
const _gc201ContactRateBalance=gc201ContactRate;
gc201ContactRate=function(p){
 const base=_gc201ContactRateBalance(p),risk=clamp(Number(p?.expedition?.contract?.risk)||1,1,5);
 return clamp(base*(GC201_CONTACT_MULT[risk]||1),.03,1.65);
};

/* New companies need enough signing capital to form an actual party before the
   first contract. This applies only when a new state is created; existing saves
   are never topped up or otherwise rewritten. */
const _createStateGC201Balance=createState;
createState=function(name,startRegion='veyric'){
 const s=_createStateGC201Balance(name,startRegion);
 if(s?.company){
   s.company.silver=Math.max(Number(s.company.silver)||0,GC201_STARTING_SILVER);
   s.company.gc201StartingCapital=GC201_STARTING_SILVER;
 }
 return s;
};

const _auditGC201Balance=audit;
audit=function(){
 const out=_auditGC201Balance();
 out.v201Balance=GC201_BALANCE;
 out.startingSilver=GC201_STARTING_SILVER;
 out.contactPressureMultipliers={...GC201_CONTACT_MULT};
 out.riskWeightedTickDanger=true;
 return out;
};
window.__BL_AUDIT=audit;
