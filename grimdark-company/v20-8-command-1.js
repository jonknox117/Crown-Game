/* Grim Company v20.8 — Command, regional commander state. */
const GC280_VERSION='20.8';
const GC280_COMMAND_STEP=.25;
const GC280_DIRECTIVES=['Make Money','Secure Region','Develop Roster','Break Campaign'];
const GC280_POLICIES=['Conservative','Normal','Ruthless'];

function gc280CommandState(regionId,s=state){
 const r=s?.regions?.[regionId];if(!r)return null;r.gc280Command=r.gc280Command||{};const c=r.gc280Command;c.version=GC280_VERSION;c.commanderId=c.commanderId||null;c.directive=GC280_DIRECTIVES.includes(c.directive)?c.directive:'Secure Region';c.casualtyPolicy=GC280_POLICIES.includes(c.casualtyPolicy)?c.casualtyPolicy:'Normal';c.autonomy=!!c.autonomy;c.progress=Number(c.progress)||0;c.log=Array.isArray(c.log)?c.log:[];return c;
}
function gc280NetworkUnlocked(s=state){return!!(s&&gc270IsCompany(s)&&gc270EstablishedCount(s)>=2)}
function gc280EnsureNetworkPhase(s=state){if(gc280NetworkUnlocked(s)&&gc270Progression(s).phase==='company')gc270Progression(s).phase='network';return s}
function gc280InitState(s=state){
 if(!s)return s;REGION_ORDER.forEach(id=>gc280CommandState(id,s));gc280EnsureNetworkPhase(s);REGION_ORDER.forEach(id=>{const c=gc280CommandState(id,s);if(c.commanderId&&!s.roster.some(a=>a.id===c.commanderId&&a.status!=='Dead')){c.commanderId=null;c.autonomy=false}});return s;
}
const _normalizeStateGC280=normalizeState;
normalizeState=function(s){return gc280InitState(_normalizeStateGC280(s))};
const _createStateGC280=createState;
createState=function(name,startRegion='veyric'){return gc280InitState(_createStateGC280(name,startRegion))};

const _gc193AtHQGC280=gc193AtHQ;
gc193AtHQ=function(a){if(a?.status==='Command')return false;return _gc193AtHQGC280(a)};
function gc280Commander(regionId){const id=gc280CommandState(regionId)?.commanderId;return id?state.roster.find(a=>a.id===id)||null:null}
function gc280CommanderRegion(id){return REGION_ORDER.find(r=>gc280CommandState(r)?.commanderId===id)||null}
function gc280CommandScore(a){if(!a)return 0;const d=derived(a),career=typeof bl17EnsureCareer==='function'?(bl17EnsureCareer(a)||0):0;let score=(a.lvl||1)*4+d.combat.resolve*.30+d.util.talk*.35+d.util.scout*.20+career*3;if(a.traits?.includes('Natural Leader'))score+=10;if(a.traits?.includes('Steady Nerves'))score+=5;if(a.traits?.includes('Cowardly'))score-=5;return Math.max(1,Math.round(score))}
function gc280Temperament(a){if(!a)return'Balanced';if(a.traits?.some(t=>['Reckless','Glory Hound','Bloodthirsty','Hot Temper'].includes(t)))return'Reckless';if(a.traits?.some(t=>['Cautious','Kindhearted'].includes(t)))return'Cautious';if(a.traits?.includes('Greedy'))return'Profit-minded';return'Balanced'}
function gc280Log(regionId,text){const c=gc280CommandState(regionId);if(!c||!text)return;c.log.push({day:state.company.day,text:String(text)});if(c.log.length>18)c.log.splice(0,c.log.length-18);gc199RecordFeed(`COMMAND — ${REGION_DEFS[regionId].name}: ${text}`,'command')}
function gc280EligibleCommanders(regionId){return state.roster.filter(a=>a.regionId===regionId&&a.status==='Ready'&&a.id!==state.company.founderId&&!gc280CommanderRegion(a.id)&&!state.parties.some(p=>p.expedition&&p.members.includes(a.id))).sort((a,b)=>gc280CommandScore(b)-gc280CommandScore(a))}
function gc280Release(regionId,silent=false){const c=gc280CommandState(regionId),a=gc280Commander(regionId);if(a&&a.status==='Command')a.status='Ready';if(c){c.commanderId=null;c.autonomy=false;c.progress=0}if(!silent&&a)gc280Log(regionId,`${a.name} returned to normal roster duty.`);return a}
function gc280Appoint(regionId,id){
 if(!gc280NetworkUnlocked())return toast('Establish a second headquarters before delegating regional command.');
 const a=state.roster.find(x=>x.id===id),c=gc280CommandState(regionId);if(!a||a.id===state.company.founderId||a.regionId!==regionId||a.status!=='Ready')return toast('That adventurer is not available for command.');
 const other=gc280CommanderRegion(a.id);if(other&&other!==regionId)return toast('That adventurer already commands another headquarters.');if(c.commanderId&&c.commanderId!==a.id)gc280Release(regionId,true);
 state.parties.forEach(p=>{if(p.expedition)return;p.members=p.members.filter(x=>x!==a.id);if(p.captainId===a.id)p.captainId=p.members[0]||null});a.status='Command';a.dailyOrder='Train';c.commanderId=a.id;c.autonomy=true;c.progress=0;gc280Log(regionId,`${a.name} was appointed HQ Commander. Directive: ${c.directive}.`);a.history=a.history||[];a.history.push(`Day ${state.company.day}: appointed Commander of ${state.regions[regionId].hq.name}.`);save();render();return true;
}
const _dismissAdventurerGC280=dismissAdventurer;
dismissAdventurer=function(id){const rid=gc280CommanderRegion(id);if(rid)gc280Release(rid,true);return _dismissAdventurerGC280(id)};
