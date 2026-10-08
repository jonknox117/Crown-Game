/* Broken Lantern v21.9.0 — Roadmaster push, consolidated spoils, HQ leadership. */
const GC390_VERSION='21.9.0';
HQ_DEFS['Roadmaster Stables']={icon:'🐎',max:4,base:115,desc:'Raises maximum Push Pace by 0.05× per level, from 1.80× to 2.00×. Faster wagons still face contact danger and attrition.'};
HQ_DEFS.Armory.desc='One combined spoils upgrade: improves recovered equipment rarity AND the chance of retrieving additional loot caches after contracts.';
HQ_DEFS['Occult Archive'].desc='Occult research, supernatural countermeasures, and shared Scout intelligence. Loot recovery belongs to the Armory.';
if(typeof GC193_FACILITIES!=='undefined'){
 const old=GC193_FACILITIES.indexOf('Salvager’s Lodge');
 if(old>=0)GC193_FACILITIES.splice(old,1);
}
const GC390_STANCES=['Scout','Odd Jobs','Train','Recover'];
const GC390_LABEL={Scout:'Recon Captain','Odd Jobs':'Market Steward',Train:'Drillmaster',Recover:'Chief Healer'};
function gc390Stables(regionId){return clamp(Number(state?.regions?.[regionId]?.hq?.upgrades?.['Roadmaster Stables'])||0,0,4)}
function gc390PushCap(p){return .80+gc390Stables(p?.expedition?.contract?.regionId||p?.regionId||state.currentRegion)*.05}
function gc390Rank(a){return a&&typeof gc360Rank==='function'?gc360Rank(a):0}
function gc390Power(a,type='director'){
 if(!a)return 1;
 const lv=clamp(Number(a.lvl)||1,1,20),career=clamp(gc390Rank(a),0,4);
 return type==='director'
  ?1.05+Math.floor((lv-1)/5)*.035+career*.04
  :1.07+Math.floor((lv-1)/5)*.045+career*.035;
}
function gc390EnsurePosts(rid,s=state){
 const h=s?.regions?.[rid]?.hq;if(!h)return null;
 h.gc390Posts=h.gc390Posts&&typeof h.gc390Posts==='object'?h.gc390Posts:{};
 GC390_STANCES.forEach(x=>{
  const id=h.gc390Posts[x];
  if(!id||(s.roster||[]).some(a=>a.id===id&&a.regionId===rid&&a.status!=='Dead'))h.gc390Posts[x]=id||null;
  else h.gc390Posts[x]=null;
 });
 return h.gc390Posts;
}
const _normalizeStateGC390=normalizeState;
normalizeState=function(s){
 s=_normalizeStateGC390(s);
 REGION_ORDER.forEach(id=>gc390EnsurePosts(id,s));
 return s;
};
const _createStateGC390=createState;
createState=function(...args){
 const s=_createStateGC390(...args);
 REGION_ORDER.forEach(id=>gc390EnsurePosts(id,s));
 return s;
};
function gc390Director(rid){
 if(!state?.regions?.[rid]?.hq?.established)return null;
 const manager=gc280Commander(rid);
 if(manager&&manager.status==='Command'&&manager.regionId===rid)return{a:manager,source:'Commander'};
 const f=gc260Founder(),pr=gc340SyncPresence();
 if(f&&f.regionId===rid&&f.status==='Ready'&&pr?.regionId===rid&&pr.mode==='town'&&pr.place==='hall')return{a:f,source:'Founder'};
 return null;
}
function gc390StanceLead(rid,stance){
 if(!GC390_STANCES.includes(stance)||!state?.regions?.[rid]?.hq?.established)return null;
 const id=gc390EnsurePosts(rid)?.[stance];
 const a=state.roster.find(a=>a.id===id);
 if(!a||a.regionId!==rid||a.status!=='Ready'||a.dailyOrder!==stance)return null;
 if(gc280CommanderRegion(a.id))return null;
 return a;
}
function gc390WorkBonus(rid,stance){
 if(!state?.regions?.[rid]?.hq?.established)return 1;
 const leader=gc390Director(rid),specialist=gc390StanceLead(rid,stance);
 return gc390Power(leader?.a,'director')*gc390Power(specialist,'stance');
}
function gc390PotentialLead(rid,a){
 return !!(a&&a.regionId===rid&&a.status==='Ready'&&!a.gc260Founder&&!gc280CommanderRegion(a.id));
}
function gc390SetPost(rid,stance,id){
 if(!GC390_STANCES.includes(stance)||!gc270IsCompany()||!state?.regions?.[rid]?.hq?.established)return false;
 const posts=gc390EnsurePosts(rid);
 if(id==='none'){posts[stance]=null;save();render();return true}
 const a=state.roster.find(x=>x.id===id);
 if(!gc390PotentialLead(rid,a))return toast('That adventurer is unavailable to lead a stance.');
 GC390_STANCES.forEach(k=>{if(k!==stance&&posts[k]===a.id)posts[k]=null});
 posts[stance]=a.id;a.dailyOrder=stance;a.dailyMentorId=null;a.dailyFacility=null;
 pushHistory(a.name+' became '+GC390_LABEL[stance]+' of '+REGION_DEFS[rid].name+'.',rid);
 save();render();return true;
}
function gc390LeadPicker(rid,stance){
 if(!GC390_STANCES.includes(stance)||!state?.regions?.[rid]?.hq?.established)return;
 const available=state.roster.filter(a=>gc390PotentialLead(rid,a)).sort((a,b)=>gc390Power(b,'stance')-gc390Power(a,'stance'));
 const current=gc390StanceLead(rid,stance);
 modal('<div class="sheetHead"><div><h3>'+esc(GC390_LABEL[stance])+'</h3><div class="tiny muted">'+esc(REGION_DEFS[rid].name)+' • '+stance+'</div></div><button class="x" data-action="close">×</button></div>'+
  '<div class="notice">A posted adventurer works with their team, not instead of it. Level and career rarity improve the entire stance. An absent or wounded leader provides no benefit.</div>'+
  '<div class="list">'+available.map(a=>'<button class="card gc390Pick" data-action="gc390SetPost" data-region="'+rid+'" data-stance="'+stance+'" data-id="'+a.id+'"><b>'+esc(a.name)+(current?.id===a.id?' • CURRENT':'')+'</b><small>Level '+a.lvl+' • '+esc(typeof gc360RarityName==='function'?gc360RarityName(a):a.careerRarity||'Common')+' • +'+Math.round((gc390Power(a,'stance')-1)*100)+'% stance output</small></button>').join('')+
  '<button class="card" data-action="gc390SetPost" data-region="'+rid+'" data-stance="'+stance+'" data-id="none"><b>Leave position vacant</b></button></div>');
}
function gc390HQStaffPanel(rid=state.currentRegion){
 if(!gc270IsCompany()||!state?.regions?.[rid]?.hq?.established)return'';
 const boss=gc390Director(rid),posts=gc390EnsurePosts(rid);
 const head=boss?'<b>'+esc(boss.a.name)+'</b><span>'+boss.source+' • Lv.'+boss.a.lvl+' • '+esc(boss.a.careerRarity||'Common')+' • +'+Math.round((gc390Power(boss.a)-1)*100)+'% to every HQ stance</span>':
  '<b>Regional director vacant</b><span>Stand in your Chapterhouse to lead personally, or appoint a commander. Only one director bonus applies.</span>';
 return '<section class="gc390HQPanel"><div class="sectionTitle"><h3>HQ Leadership</h3><span>Level & rarity affect output</span></div>'+
  '<div class="gc390Director"><span>REGIONAL DIRECTOR</span>'+head+'</div>'+
  '<div class="gc390PostGrid">'+GC390_STANCES.map(st=>{
   const person=gc390StanceLead(rid,st),id=posts[st],standby=!person&&id?state.roster.find(a=>a.id===id):null;
   const bonus=gc390WorkBonus(rid,st),gain=Math.round((bonus-1)*100);
   return '<button class="card gc390Post" data-action="gc390PickPost" data-region="'+rid+'" data-stance="'+st+'">'+
    '<span>'+esc(st.toUpperCase())+' • '+esc(GC390_LABEL[st])+'</span><b>'+esc(person?.name||standby?.name||'Unassigned')+'</b>'+
    '<small>'+(person?'Active • ':standby?'Unavailable • ':'Open position • ')+'Effective output '+Math.round(bonus*100)+'%'+(gain?' (+'+gain+'%)':'')+'</small><em>CHANGE LEADER ›</em></button>';
  }).join('')+'</div><p>Scout improves contract intelligence; Odd Jobs improves earnings and local community ties; Train accelerates XP; Recover improves healing and injury recovery. Stationed leaders remain available for field work, but their HQ bonus ends while away.</p></section>';
}
/* The director leads; each stance's specialist adds their own bonus.
   Delegate via existing simulation functions to preserve their side effects. */
const _gc201ScoutRegionGC390=gc201ScoutRegion;
gc201ScoutRegion=function(rid,delta){return _gc201ScoutRegionGC390(rid,delta*gc390WorkBonus(rid,'Scout'))};
const _gc201PatrolRegionGC390=gc201PatrolRegion;
gc201PatrolRegion=function(rid,delta){return _gc201PatrolRegionGC390(rid,delta*gc390WorkBonus(rid,'Odd Jobs'))};
const _gc201TrainRegionGC390=gc201TrainRegion;
gc201TrainRegion=function(rid,delta){return _gc201TrainRegionGC390(rid,delta*gc390WorkBonus(rid,'Train'))};
const _gc201RecoveryTickGC390=gc201RecoveryTick;
gc201RecoveryTick=function(a,delta){
 const st=a&&(a.status==='Recovering'||a.dailyOrder==='Recover')?'Recover':null;
 return _gc201RecoveryTickGC390(a,st?delta*gc390WorkBonus(a.regionId,st):delta);
};
const _gc201TrainingRateGC390=gc201TrainingRate;
gc201TrainingRate=function(a){return _gc201TrainingRateGC390(a)*gc390WorkBonus(a.regionId,'Train')};
/* The Armory is the SINGLE loot upgrade. Legacy Salvager's Lodge duty is
   folded into its cache finding benefit; the Occult Archive remains research. */
const _gc193FinishNoTimeGC390=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,rid=e?.contract?.regionId;
 if(e&&!e.gc340Dungeon&&rid&&state?.regions?.[rid]?.hq?.established&&!e.gc390SpoilsApplied){
  const arm=Number(hq(rid).upgrades.Armory)||0;
  if(arm>0&&e.contract){
   e.gc390SpoilsApplied=true;
   /* Expedition-local clone: never permanently stack the bonus on a board contract. */
   e.contract={...e.contract,cacheChance:clamp((Number(e.contract.cacheChance)||0)+arm*.035,0,.95)};
  }
 }
 return _gc193FinishNoTimeGC390(p);
};
const _gc330HQScreenGC390=gc330HQScreen;
gc330HQScreen=function(){return _gc330HQScreenGC390()+gc390HQStaffPanel(state.currentRegion)};
const _gc193OrdersModalGC390=gc193OrdersModal;
gc193OrdersModal=function(...args){
 const out=_gc193OrdersModalGC390(...args),sheet=document.getElementById('sheet');
 if(sheet&&gc270IsCompany()&&!sheet.querySelector('.gc390HQPanel'))sheet.insertAdjacentHTML('beforeend',gc390HQStaffPanel(state.currentRegion));
 return out;
};
const _hqInfoGC390=hqInfo;
hqInfo=function(k){
 if(k==='Roadmaster Stables'){
  const lv=gc390Stables(state.currentRegion);
  return modal('<div class="sheetHead"><h3>Roadmaster Stables</h3><button class="x" data-action="close">×</button></div><div class="card"><b>Wagon Push Pace maximum: '+(1.8+lv*.05).toFixed(2)+'×</b><p>Each level raises the momentum ceiling by 0.05×. At Lv.4, wagons may sustain 2.00× travel pace while momentum lasts. Forced speed still increases the risk of contact and exhaustion.</p></div>');
 }
 if(k==='Armory')return modal('<div class="sheetHead"><h3>Armory • Spoils Workshop</h3><button class="x" data-action="close">×</button></div><div class="card"><b>Combined loot improvement</b><p>Armory levels improve recovered equipment rarity and add 3.5 percentage points of cache discovery per level to completed contracts. The old Salvager’s Lodge function is included here.</p></div>');
 return _hqInfoGC390(k);
};
const _processActionGC390=processAction;
processAction=function(el){
 const action=el?.dataset?.action;
 if(action==='gc390PickPost')return gc390LeadPicker(el.dataset.region,el.dataset.stance);
 if(action==='gc390SetPost'){
  const result=gc390SetPost(el.dataset.region,el.dataset.stance,el.dataset.id);
  if(result&&document.getElementById('modal')?.classList.contains('show'))gc390LeadPicker(el.dataset.region,el.dataset.stance);
  return result;
 }
 return _processActionGC390(el);
};
function gc390Styles(){
 if(document.getElementById('gc390Styles'))return;
 const css=document.createElement('style');css.id='gc390Styles';
 css.textContent='.gc390HQPanel{margin:12px 0;padding:10px;border:1px solid #655037;border-radius:9px;background:#14120f}.gc390Director{padding:12px;border:1px solid #8b6e43;border-radius:6px;background:#1a1814;margin:6px 0 9px}.gc390Director>span:first-child{font-size:9px;letter-spacing:.15em;color:#bca071}.gc390Director b{display:block;font-size:16px;margin:6px 0;color:#e6d0ac}.gc390Director span:last-child{display:block;font-size:11px;line-height:1.5;color:#b3a18a}.gc390PostGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.gc390Post{text-align:left!important;min-width:0;min-height:103px!important;padding:10px!important;border-color:#554631!important}.gc390Post span,.gc390Post b,.gc390Post small,.gc390Post em{display:block}.gc390Post span{font-size:8px;letter-spacing:.05em;color:#ad936b}.gc390Post b{font-size:13px;margin:7px 0 4px;color:#e3d0b0}.gc390Post small{font-size:10px;color:#bea98e;line-height:1.5}.gc390Post em{font-size:9px;margin-top:7px;color:#d1ad78;font-style:normal}.gc390HQPanel>p{margin:10px 2px 0;font-size:11px;line-height:1.5;color:#b9a893}.gc390Pick{text-align:left!important;min-height:60px!important}.gc390Pick b,.gc390Pick small{display:block}.gc390Pick small{font-size:10px;color:#bda58a;margin-top:5px}@media(max-width:355px){.gc390PostGrid{grid-template-columns:1fr}}';
 document.head.appendChild(css);
}
gc390Styles();
