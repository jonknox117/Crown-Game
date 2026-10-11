/* Grim Company v21.10.7 — founder follows the actively selected headquarters. */
const GC427_VERSION='21.10.7';
function gc427MoveFounderToHQ(id){
 if(!state?.regions?.[id]?.hq?.established)return {moved:false,reason:'unavailable'};
 const founder=gc260Founder();
 if(!founder||founder.status==='Dead')return {moved:false,reason:'no-founder'};
 if(founder.regionId===id)return {moved:false,reason:'already-here'};
 const fs=gc260System(),presence=gc340Presence();
 const inActiveParty=state.parties.some(p=>p.members?.includes(founder.id)&&
   (p.expedition||p.gc340DungeonRun?.active));
 const busy=founder.status!=='Ready'||!!fs?.activity||!!presence?.activity||
   !!gc340FounderInField()||!!gc340FounderInDungeon()||inActiveParty;
 if(busy)return {moved:false,reason:'busy',from:founder.regionId};
 const from=founder.regionId;
 gc260RemoveFounderFromParties();
 founder.regionId=id;
 if(fs)fs.location=id;
 const p=gc340Presence();
 if(p){p.regionId=id;p.place='hall';p.mode='town';p.activity=null;}
 founder.history=founder.history||[];
 founder.history.push('Day '+state.company.day+': moved from '+
   (REGION_DEFS[from]?.name||from)+' to '+(REGION_DEFS[id]?.name||id)+' to manage the HQ.');
 pushHistory(founder.name+' relocated to '+(REGION_DEFS[id]?.name||id)+' headquarters.',id);
 return {moved:true,from,to:id};
}
function gc427HQMoveNotice(result,id){
 if(result.moved)toast('You have moved to '+(REGION_DEFS[id]?.name||id)+'. You can join local parties.');
 else if(result.reason==='busy')toast('HQ view switched. Your character remains in '+
  (REGION_DEFS[result.from]?.name||result.from)+' until the current activity or expedition ends.');
}
const _gc427SwitchRegion=switchRegion;
switchRegion=function(id){
 if(!state?.regions?.[id]?.hq?.established)return _gc427SwitchRegion(id);
 const result=gc427MoveFounderToHQ(id);
 const out=_gc427SwitchRegion(id);
 gc427HQMoveNotice(result,id);
 return out;
};
const _gc427FoundBranch=foundBranch;
foundBranch=function(id){
 const established=!!state?.regions?.[id]?.hq?.established;
 const out=_gc427FoundBranch(id);
 if(!established&&state?.regions?.[id]?.hq?.established&&state.currentRegion===id){
  const result=gc427MoveFounderToHQ(id);
  if(result.moved){save();render();}
  gc427HQMoveNotice(result,id);
 }
 return out;
};
const _gc427HQAgencyHTML=gc260HQAgencyHTML;
gc260HQAgencyHTML=function(f,p){
 return _gc427HQAgencyHTML(f,p).replace(
  'Your physical location matters. Management remains global, but Direct Command only happens where you actually are.',
  'Switch HQ on the World screen to move here and join its parties. Active expeditions and personal activities prevent instant relocation.'
 );
};
window.__GC427_TEST=function(){
 const priorState=state,priorSave=save,priorRender=render,priorToast=toast,r={};
 try{
  save=function(){};render=function(){};toast=function(){};
  state=createState('HQ Transfer Regression','veyric');
  state.company.silver=1000000;state.company.renown=100000;
  state.regions.veyric.hq.established=true;
  state.regions.skeld.hq.established=true;
  gc270Progression().phase='network';
  const founder=gc260CreateFounderRecord('veyric',{
   name:'Relocation Tester',race:'Human',culture:'Veyric',
   className:'March Ranger',gender:'Male',portrait:1
  },true);
  founder.status='Ready';
  const teammate=generateAdventurer('veyric');teammate.status='Ready';state.roster.push(teammate);
  const oldParty=makeParty('veyric','Old Headquarters Party');
  oldParty.members=[founder.id,teammate.id];oldParty.captainId=founder.id;
  const newParty=makeParty('skeld','New Headquarters Party');
  state.parties.push(oldParty,newParty);
  const presence=gc340Presence();presence.regionId='veyric';presence.place='scout';presence.mode='town';
  switchRegion('skeld');
  r.switchMovesFounder=state.currentRegion==='skeld'&&founder.regionId==='skeld';
  r.presenceTracksMove=presence.regionId==='skeld'&&presence.place==='hall'&&
   presence.mode==='town'&&gc260System().location==='skeld';
  r.oldPartyPreserved=oldParty.members.length===1&&oldParty.members[0]===teammate.id&&
   oldParty.captainId===teammate.id&&teammate.regionId==='veyric';
  r.newPartyCanRecruitFounder=localRoster('skeld').some(a=>a.id===founder.id);
  gc260JoinParty(newParty.id);
  r.canJoinNewHQParty=newParty.members.includes(founder.id)&&gc260FounderParty()?.id===newParty.id;
  switchRegion('veyric');
  r.movesBack=founder.regionId==='veyric'&&state.currentRegion==='veyric'&&
   !newParty.members.includes(founder.id)&&presence.regionId==='veyric';
  oldParty.members.push(founder.id);oldParty.expedition={contract:{regionId:'veyric'}};
  switchRegion('skeld');
  r.fieldProtected=founder.regionId==='veyric'&&oldParty.members.includes(founder.id)&&
   !!oldParty.expedition&&state.currentRegion==='skeld';
  oldParty.expedition=null;oldParty.members=oldParty.members.filter(x=>x!==founder.id);
  presence.activity={type:'study',remainingDays:.1};
  switchRegion('skeld');
  r.activityProtected=founder.regionId==='veyric'&&!!presence.activity;
  presence.activity=null;
  gc260System().activity={type:'training',remaining:1};
  switchRegion('skeld');
  r.travelProtected=founder.regionId==='veyric'&&!!gc260System().activity;
  gc260System().activity=null;
  state.regions.nambara.hq.established=false;
  foundBranch('nambara');
  r.newBranchMovesFounder=state.regions.nambara.hq.established&&
   founder.regionId==='nambara'&&state.currentRegion==='nambara'&&presence.place==='hall';
  r.noDuplicateFounder=state.roster.filter(x=>x.id===founder.id).length===1;
  const saved=normalizeState(JSON.parse(JSON.stringify(state)));
  r.saveCompatible=saved.company.founderId===founder.id&&
    saved.roster.find(x=>x.id===founder.id)?.regionId===founder.regionId;
  const failed=Object.keys(r).filter(k=>!r[k]);
  return {ok:failed.length===0,failed,...r};
 }catch(e){return {ok:false,error:String(e?.stack||e),partial:r}}
 finally{state=priorState;save=priorSave;render=priorRender;toast=priorToast;try{render()}catch(_){}}
};