/* Grim Company v21.10.8 — HQ continuity, party and contract readiness QoL.
   No simulation balance changes, art transformations, or save format migration. */
const GC428_VERSION='21.10.8';
function gc428PendingHQ(){
 const fs=gc260System();
 return fs?.gc428PendingHQ&&state?.regions?.[fs.gc428PendingHQ]?.hq?.established?fs.gc428PendingHQ:null;
}
function gc428SetDestination(id){
 const f=gc260Founder(),fs=gc260System();
 if(!f||!fs||f.status==='Dead'||!state?.regions?.[id]?.hq?.established)return;
 if(f.regionId===id)delete fs.gc428PendingHQ;
 else fs.gc428PendingHQ=id;
 save();
}
function gc428FinishPendingTransfer(){
 if(!state)return false;
 const fs=gc260System(),id=fs?.gc428PendingHQ;
 if(!id)return false;
 if(!state.regions?.[id]?.hq?.established||gc260Founder()?.status==='Dead'){
  delete fs.gc428PendingHQ;save();return false;
 }
 if(gc260Founder()?.regionId===id){delete fs.gc428PendingHQ;save();return false;}
 const result=gc427MoveFounderToHQ(id);
 if(!result.moved)return false;
 delete fs.gc428PendingHQ;
 save();render();
 return true;
}
const _gc428SwitchHQ=switchRegion;
switchRegion=function(id){
 const established=!!state?.regions?.[id]?.hq?.established;
 const out=_gc428SwitchHQ(id);
 if(established)gc428SetDestination(id);
 return out;
};
const _gc428FoundHQ=foundBranch;
foundBranch=function(id){
 const out=_gc428FoundHQ(id);
 if(state?.regions?.[id]?.hq?.established&&state.currentRegion===id)gc428SetDestination(id);
 return out;
};
/* A focused town task must not coexist with starting a different personal action. */
function gc428FounderFree(){
 const f=gc260Founder();
 return !!(f&&f.status==='Ready'&&!gc260System()?.activity&&!gc340Presence()?.activity&&
  !gc340FounderInField()&&!gc340FounderInDungeon());
}
const _gc428JoinParty=gc260JoinParty;
gc260JoinParty=function(pid){
 if(!gc428FounderFree())return toast('Finish your current expedition or personal activity before joining a party.');
 return _gc428JoinParty(pid);
};
const _gc428Travel=gc260StartTravel;
gc260StartTravel=function(id){
 if(!gc428FounderFree())return toast('Finish your current expedition or personal activity before traveling.');
 return _gc428Travel(id);
};
const _gc428Train=gc260StartTraining;
gc260StartTraining=function(id){
 if(!gc428FounderFree())return toast('Finish your current expedition or personal activity before training.');
 return _gc428Train(id);
};
const _gc428CancelFocused=gc340CancelFocused;
gc340CancelFocused=function(...args){
 const out=_gc428CancelFocused(...args);
 gc428FinishPendingTransfer();
 return out;
};
const _gc428CompanyTick=gc200ContinuousWork;
gc200ContinuousWork=function(delta){
 const out=_gc428CompanyTick(delta);
 if(delta>0&&state?.founderSystem?.gc428PendingHQ)gc428FinishPendingTransfer();
 return out;
};
function gc428LocationNotice(){
 const f=gc260Founder(),id=state?.currentRegion;
 if(!f||f.status==='Dead'||!state.regions?.[id]?.hq?.established||f.regionId===id)return '';
 const label=REGION_DEFS[f.regionId]?.name||f.regionId;
 const pending=gc428PendingHQ()===id;
 return '<div class="gc428Notice" role="status"><b>YOUR CHARACTER IS IN '+esc(label.toUpperCase())+'</b>'+
  '<span>'+ (pending?'Relocation to this HQ is queued. You will arrive when your current activity or expedition ends.':
  'You can manage this HQ remotely. Switch HQ on the World screen to relocate when available.')+
  ' Until then, you cannot join parties here.</span></div>';
}
const _gc428People=gc330PeopleScreen;
gc330PeopleScreen=function(){return gc428LocationNotice()+_gc428People()};
const _gc428Parties=gc330PartiesScreen;
gc330PartiesScreen=function(){return gc428LocationNotice()+_gc428Parties()};
const _gc428Overview=gc330CompanyOverview;
gc330CompanyOverview=function(){return gc428LocationNotice()+_gc428Overview()};
const _gc428YouScreen=gc330YouScreen;
gc330YouScreen=function(){
 const html=_gc428YouScreen(),id=gc428PendingHQ();
 return id?'<div class="gc428Notice"><b>NEXT HQ: '+esc((REGION_DEFS[id]?.name||id).toUpperCase())+
  '</b><span>Your character will relocate when free, then can join parties stationed there.</span></div>'+html:html;
};
const _gc428PartyCard=gc330PartyCard;
gc330PartyCard=function(p){
 let html=_gc428PartyCard(p),f=gc260Founder();
 if(!f||f.regionId!==p.regionId||p.expedition||p.gc340DungeonRun||p.members?.includes(f.id)||
    (p.members||[]).length>=partyCap(p.regionId))return html;
 const ready=gc428FounderFree(),assigned=!!gc260FounderParty();
 const btn='<div class="gc428JoinActions"><button class="btn '+(ready?'goldbtn':'ghost')+
  '" data-action="gc260JoinParty" data-id="'+esc(p.id)+'" '+(ready?'':'disabled')+'>'+
  (assigned?'Switch to This Party':'Join This Party')+'</button></div>';
 const pos=html.lastIndexOf('</div>');
 return pos>=0?html.slice(0,pos)+btn+html.slice(pos):html;
};
function gc428CanDispatch(p,c){
 if(!p||!c||p.regionId!==c.regionId||p.expedition||p.gc340DungeonRun||p.gc320IndependentCrew)return false;
 const ids=p.members||[],team=partyMembers(p);
 return ids.length>0&&ids.length===team.length&&team.every(a=>
  a.status==='Ready'&&a.regionId===p.regionId)&&
  gc320PartyQualification(p,c).ok;
}
/* Career qualified does not imply immediately deployable. Do not advertise
   an unavailable team as a valid contract choice. */
gc330ContractQualifiedCount=function(c){
 return localParties(c.regionId).filter(p=>gc428CanDispatch(p,c)).length;
};
const _gc428ContractCard=gc330ContractCard;
gc330ContractCard=function(c){
 let html=_gc428ContractCard(c);
 if(gc330ContractQualifiedCount(c))return html;
 const qualified=localParties(c.regionId).some(p=>!p.expedition&&(p.members||[]).length&&gc320PartyQualification(p,c).ok);
 return qualified?html.replace('No qualified party','No ready party').replace('>Underqualified</button>','>Not Ready</button>'):html;
};
const _gc428ShowChooseParty=showChooseParty;
showChooseParty=function(cid){
 const out=_gc428ShowChooseParty(cid),c=contractById(cid);
 if(!c||gc270IsFreeblade())return out;
 const sheet=document.getElementById('sheet');
 if(!sheet)return out;
 sheet.querySelectorAll('[data-action="dispatch"][data-party]').forEach(button=>{
  const party=state.parties.find(p=>p.id===button.dataset.party);
  if(party&&!gc428CanDispatch(party,c)){
   button.disabled=true;button.classList.remove('primary');
   if(gc320PartyQualification(party,c).ok){button.textContent='NOT READY';button.title='Every party member must be Ready and stationed here.';}
  }
 });
 return out;
};
function gc428InstallStyle(){
 if(document.getElementById('gc428Style'))return;
 const s=document.createElement('style');s.id='gc428Style';
 s.textContent='.gc428Notice{padding:11px;margin:8px 0 12px;background:#1b1813;border:1px solid #80633a;border-left:3px solid #bf9857;border-radius:7px;color:#e1cda6;font:11px/1.45 system-ui}'+
  '.gc428Notice b,.gc428Notice span{display:block}.gc428Notice b{font-size:10px;letter-spacing:.06em}.gc428Notice span{margin-top:4px;color:#bcae93}'+
  '.gc428JoinActions{margin-top:8px}.gc428JoinActions button{min-height:44px;width:100%}';
 document.head.appendChild(s);
}
gc428InstallStyle();
window.__GC428_TEST=function(){
 const prior=state,oldSave=save,oldRender=render,oldToast=toast,checks={};
 try{
  save=function(){};render=function(){};toast=function(){};
  state=createState('HQ and Party QoL QA','veyric');
  state.regions.veyric.hq.established=true;state.regions.skeld.hq.established=true;
  gc270Progression().phase='network';
  const f=gc260CreateFounderRecord('veyric',{name:'HQ QA',race:'Human',culture:'Veyric',
   className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.hp=derived(f).maxHp;
  const p=makeParty('veyric','QA Company');p.members=[f.id];p.captainId=f.id;state.parties.push(p);
  const t=makeParty('skeld','New HQ Party');state.parties.push(t);
  const pr=gc340Presence();pr.regionId='veyric';pr.place='scout';pr.mode='town';
  pr.activity={type:'studyContract',remainingDays:.25};
  gc260StartTravel('skeld');
  checks.noTravelDuringFocus=!gc260System().activity;
  gc260JoinParty(t.id);
  checks.noJoinDuringFocus=!t.members.includes(f.id)&&p.members.includes(f.id);
  const coach=generateAdventurer('veyric');coach.status='Ready';state.roster.push(coach);
  gc260StartTraining(coach.id);
  checks.noTrainingDuringFocus=!gc260System().activity;
  switchRegion('skeld');
  checks.pendingDestination=gc428PendingHQ()==='skeld'&&f.regionId==='veyric'&&
   state.currentRegion==='skeld';
  checks.remoteLocationNotice=gc330PartiesScreen().includes('Relocation to this HQ is queued');
  const archived=normalizeState(JSON.parse(JSON.stringify(state)));
  checks.pendingSurvivesSave=archived.founderSystem.gc428PendingHQ==='skeld';
  gc340CancelFocused();
  checks.arrivedAfterFocus=f.regionId==='skeld'&&pr.regionId==='skeld'&&pr.place==='hall'&&
   !gc428PendingHQ();
  checks.joinActionVisible=gc330PartyCard(t).includes('Join This Party');
  gc260JoinParty(t.id);
  checks.joinedNewParty=t.members.includes(f.id)&&!p.members.includes(f.id);
  switchRegion('veyric');
  checks.returnedToOldHQ=f.regionId==='veyric'&&!t.members.includes(f.id);
  p.members=[f.id];p.captainId=f.id;
  const contract={regionId:'veyric',risk:1,check:'scout',id:'gc428-contract'};
  checks.contractReady=gc428CanDispatch(p,contract)&&gc330ContractQualifiedCount(contract)===1;
  f.status='Recovering';
  checks.contractUnavailable=!gc428CanDispatch(p,contract)&&gc330ContractQualifiedCount(contract)===0;
  checks.contractStillCareerQualified=gc320PartyQualification(p,contract).ok===false||gc360Rank(f)===0;
  f.status='Ready';
  checks.contractRestored=gc330ContractQualifiedCount(contract)===1;
  p.expedition={contract};f.status='Expedition';
  switchRegion('skeld');
  checks.fieldTransferQueued=f.regionId==='veyric'&&gc428PendingHQ()==='skeld';
  gc428FinishPendingTransfer();
  checks.fieldNotTeleported=f.regionId==='veyric';
  p.expedition=null;f.status='Ready';gc428FinishPendingTransfer();
  checks.arrivedAfterField=f.regionId==='skeld'&&gc260FounderParty()===null;
  checks.otherPartyUnchanged=t.members.length===0;
  const failed=Object.keys(checks).filter(k=>!checks[k]);
  return {ok:failed.length===0,failed,...checks};
 }catch(e){return {ok:false,error:String(e?.stack||e),partial:checks}}
 finally{state=prior;save=oldSave;render=oldRender;toast=oldToast;try{render()}catch(_){}}
};