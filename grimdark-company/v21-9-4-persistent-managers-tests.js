/* v21.9.4 — persistent manager appointments through every NPC activity. */
window.__GC394_TEST=function(){
 const previous=state;
 const checks={};
 try{
  state=createState('Permanent HQ Leadership Test','veyric');
  gc270Progression().phase='company';
  state.regions.veyric.hq.established=true;
  const founder=gc260CreateFounderRecord('veyric',{
   name:'HQ Tester',race:'Human',culture:'Veyric',
   className:'March Ranger',gender:'Male',portrait:1
  },true);
  founder.status='Ready';
  const pr=gc340Presence();pr.regionId='veyric';pr.place='odd';pr.mode='town';
  state.ui.tab='you';
  const a=generateAdventurer('veyric');a.status='Ready';a.lvl=15;a.missions=25;a.dailyOrder='Odd Jobs';state.roster.push(a);
  const b=generateAdventurer('veyric');b.status='Recovering';b.lvl=10;b.missions=12;b.dailyOrder='Recover';state.roster.push(b);
  const base=gc390Power(a,'stance'),managerBonus=base*gc390Power(gc390Director('veyric')?.a,'director');
  checks.appointment=gc390SetPost('veyric','Train',a.id)===true;
  checks.noForcedStance=a.dailyOrder==='Odd Jobs'&&gc390StanceLead('veyric','Train')?.id===a.id;
  checks.activeInitially=Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.dailyOrder='Scout';
  checks.independentOfWork=gc390StanceLead('veyric','Train')?.id===a.id&&Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.status='Expedition';
  checks.activeInField=gc390StanceLead('veyric','Train')?.id===a.id&&Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.status='Recovering';
  checks.activeWounded=gc390StanceLead('veyric','Train')?.id===a.id&&Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.status='Captured';
  checks.activeCaptured=gc390StanceLead('veyric','Train')?.id===a.id&&Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.regionId='skeld';
  checks.activeAfterTransfer=gc390StanceLead('veyric','Train')?.id===a.id&&Math.abs(gc390WorkBonus('veyric','Train')-managerBonus)<.00001;
  a.regionId='veyric';a.status='Ready';
  /* Newly appointed leaders can be on recovery; no order/status overwrites. */
  checks.recoveringEligible=gc390PotentialLead('veyric',b);
  checks.reassign=gc390SetPost('veyric','Scout',a.id)===true&&gc390EnsurePosts('veyric').Train===null&&gc390EnsurePosts('veyric').Scout===a.id;
  checks.recoveringAppointed=gc390SetPost('veyric','Train',b.id)===true&&b.status==='Recovering'&&b.dailyOrder==='Recover'&&gc390StanceLead('veyric','Train')?.id===b.id;
  state.ui.tab='you';render();
  const map=document.querySelector('.gc393RoomManagement');
  checks.roomMap=!!map&&map.querySelector('[data-gc393-post="Train"]')?.textContent.includes(b.name)&&
   !map.textContent.includes('UNAVAILABLE');
  const hqHTML=gc390HQStaffPanel('veyric');
  checks.hqDisplay=hqHTML.includes(b.name)&&hqHTML.includes('Active • ')&&!hqHTML.includes('Unavailable • ')&&
   hqHTML.includes('bonus during expeditions, recovery');
  gc390LeadPicker('veyric','Train');
  const sheet=document.getElementById('sheet');
  checks.pickerExplains=!!sheet?.textContent.includes('leadership bonus remains active')&&
   !sheet?.textContent.includes('An absent or wounded leader provides no benefit.');
  document.getElementById('modal')?.classList.remove('show');
  checks.saved=normalizeState(JSON.parse(JSON.stringify(state))).regions.veyric.hq.gc390Posts.Train===b.id;
  const baseline=Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(b,'stance'))<.00001;
  checks.realWorkMultiplier=baseline;
  /* The existing manager should not disappear from a non-training daily job. */
  b.dailyOrder='Odd Jobs';
  gc351TargetedPatch();
  checks.liveNumber=!!document.querySelector('.gc393RoomPost[data-stance="Train"] [data-gc393-post]')?.textContent.includes(b.name)&&
   gc390StanceLead('veyric','Train')?.id===b.id;
  b.status='Dead';
  const deathPosts=gc390EnsurePosts('veyric');
  checks.deadVacates=deathPosts.Train===null&&gc390StanceLead('veyric','Train')===null;
  checks.unassigned=gc390SetPost('veyric','Scout','none')===true&&gc390EnsurePosts('veyric').Scout===null;
  const integrity=gc342StateIntegrity().ok;
  checks.integrity=integrity;
  const failed=Object.entries(checks).filter(([k,v])=>!v).map(([k])=>k);
  return{ok:failed.length===0,failed,...checks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),checks}}
 finally{state=previous;try{document.getElementById('modal')?.classList.remove('show');render()}catch(_){}}
};