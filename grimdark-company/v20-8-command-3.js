/* Grim Company v20.8 — Command, real-system autonomous execution. */
let GC280_INTERNAL=false;
const _renderGC280Core=render;
render=function(){if(GC280_INTERNAL)return;return _renderGC280Core()};
const _closeModalGC280=closeModal;
closeModal=function(){if(GC280_INTERNAL)return;return _closeModalGC280()};

function gc280Dispatch(regionId,p,c){
 const oldTab=state.ui.tab,oldRegion=state.currentRegion;let ok=false;GC280_INTERNAL=true;
 try{dispatchContract(c.id,p.id);ok=!!p.expedition}catch(e){ok=false}
 finally{GC280_INTERNAL=false;state.ui.tab=oldTab;state.currentRegion=oldRegion;save()}
 if(ok)gc280Log(regionId,`${gc280Commander(regionId).name} sent ${p.name} on ${c.gc240CampaignId?'campaign operation ':''}${c.title} (Risk ${c.risk}).`);
 return ok;
}
function gc280CommandAct(regionId,force=false){
 if(!gc280NetworkUnlocked())return false;
 const r=state.regions[regionId],cmd=gc280CommandState(regionId),leader=gc280Commander(regionId);if(!r?.hq?.established||!cmd.autonomy||!leader||leader.status!=='Command')return false;
 gc280AssignStances(regionId);gc280MaybeRecruit(regionId);gc280BuildParties(regionId);
 const parties=state.parties.filter(p=>p.regionId===regionId&&!p.expedition&&!p.members.includes(state.company.founderId)&&p.members.length&&partyMembers(p).every(a=>a.status==='Ready')).sort((a,b)=>gc280PartyAverageLevel(b)-gc280PartyAverageLevel(a));
 for(const p of parties){const c=gc280PickContract(regionId,p);if(c&&gc280Dispatch(regionId,p,c))return true}
 return force;
}
function gc280CommandTick(deltaDays){
 if(!gc280NetworkUnlocked()||deltaDays<=0)return;
 REGION_ORDER.forEach(id=>{const c=gc280CommandState(id);if(!c.autonomy||!c.commanderId)return;c.progress+=deltaDays;let guard=0;while(c.progress>=GC280_COMMAND_STEP&&guard++<2){c.progress-=GC280_COMMAND_STEP;gc280CommandAct(id)}});
}
const _gc200ContinuousWorkGC280=gc200ContinuousWork;
gc200ContinuousWork=function(deltaDays){const out=_gc200ContinuousWorkGC280(deltaDays);gc280CommandTick(deltaDays);return out};

const _foundBranchGC280=foundBranch;
foundBranch=function(id){
 const before=gc270EstablishedCount(),out=_foundBranchGC280(id);
 if(state&&gc270EstablishedCount()>before){gc280InitState(state);if(gc280NetworkUnlocked()){gc270Progression().phase='network';gc199RecordFeed('REGIONAL COMMAND UNLOCKED — veteran adventurers can now manage distant headquarters.','command');save();render()}}
 return out;
};
