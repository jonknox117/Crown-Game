/* Grim Company v21.10.2 — actual DOM/numeric continuity regressions. */
window.__GC412_TEST=function(){
 const prior=state,r={},oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  state=createState('Continuous Progress QA','veyric');
  gc270Progression().phase='company';
  state.regions.veyric.hq.established=true;
  state.company.silver=100;
  const f=gc260CreateFounderRecord('veyric',{
    name:'Live Progress QA',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1
  },true);
  f.status='Ready';f.dailyOrder='Train';f.lvl=6;f.xp=2;
  const a=generateAdventurer('veyric');
  a.status='Ready';a.dailyOrder='Train';a.hp=derived(a).maxHp;state.roster.push(a);
  state.ui.tab='company';state.ui.gc330CompanySub='overview';
  render();
  const root=document.querySelector('#app .screen');
  const scene=document.querySelector('#app .gc380Stage');
  const grid=document.querySelector('#app .gc201StanceGrid');
  const team=grid?.querySelector('.gc201Stance.train');
  const oldLabel=team?.querySelector('.gc201StanceMeta')?.textContent;
  const work=gc200Work(a);work.gc201TrainFraction=.83;
  GC412_LAST_DOM=0;gc412PatchScreen();
  const actual=grid?.querySelector('.gc201Stance.train');
  const expected=document.createElement('template');expected.innerHTML=gc201StanceDashboard('veyric');
  const reference=expected.content.querySelector('.gc201Stance.train');
  r.stanceText=actual?.querySelector('.gc201StanceMeta')?.textContent===reference?.querySelector('.gc201StanceMeta')?.textContent;
  r.stanceBar=actual?.querySelector(':scope > i em')?.style.width===reference?.querySelector(':scope > i em')?.style.width;
  r.noNavigation=state.ui.tab==='company';
  r.sameScreen=root===document.querySelector('#app .screen');
  r.sameStance=actual===team;
  r.scenePreserved=!scene||scene===document.querySelector('#app .gc380Stage');
  state.ui.tab='world';render();const world=document.querySelector('[data-gc351-vitals="veyric"]');
  const node=world?.querySelector('[data-vital="threat"] b');
  state.regions.veyric.threat=76.4;GC412_LAST_DOM=0;gc412PatchScreen();gc351TargetedPatch();
  r.worldThreat=node?.textContent==='76'&&world===document.querySelector('[data-gc351-vitals="veyric"]');
  state.ui.tab='you';render();const xpNode=document.querySelector('.gc330YouVitals > div:nth-child(3) b');
  f.xp=24;GC412_LAST_DOM=0;gc412PatchScreen();gc351TargetedPatch();
  r.youXp=xpNode?.textContent?.startsWith('24/')===true;
  renderInspect(a.id,false);
  const section=[...document.querySelectorAll('#sheet .sectionTitle')].find(x=>x.querySelector('h3')?.textContent==='Condition & Experience');
  const oldXP=section?.querySelector('span')?.textContent;
  a.xp=33;a.hp=Math.max(1,a.hp-5);
  gc412PatchModal();
  r.inspectXp=section?.querySelector('span')?.textContent===a.xp+'/'+xpNeed(a.lvl)+' XP';
  r.inspectHealth=section?.nextElementSibling?.querySelector('.statline b')?.textContent===a.hp+'/'+derived(a).maxHp+' HP';
  document.getElementById('modal')?.classList.remove('show');
  gc193OrdersModal();
  const row=[...document.querySelectorAll('#sheet .gc193OrderRow')].find(x=>x.querySelector('[data-action="gcOrderPick"]')?.dataset.id===a.id);
  a.hp=Math.max(1,a.hp-3);
  gc412PatchModal();
  r.ordersHealth=row?.textContent.includes(a.hp+'/'+derived(a).maxHp+' HP')===true;
  r.saveSafe=gc342StateIntegrity().ok&&normalizeState(JSON.parse(JSON.stringify(state)))?.roster?.some(x=>x.id===a.id);
  const failed=Object.entries(r).filter(([k,v])=>!v).map(([k])=>k);
  return{ok:failed.length===0,failed,...r,diag:window.__GC412_STATS()};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),results:r}}
 finally{state=prior;window.__GC345_FORCE_PHONE=oldForce;document.getElementById('modal')?.classList.remove('show');try{render()}catch(_){}}
};
