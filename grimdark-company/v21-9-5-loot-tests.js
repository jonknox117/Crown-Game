/* v21.9.5 — regression for actual, playable chest opening in BOTH phases. */
window.__GC395_TEST=function(){
 const old=state,checks={};
 const close=()=>{const m=document.getElementById('modal');if(m)m.classList.remove('show')};
 try{
  state=createState('Freeblade Loot Test','veyric');
  const f=gc260CreateFounderRecord('veyric',{
   name:'Vault Tester',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1
  },true);
  f.status='Ready';
  gc270Progression().phase='freeblade';
  state.regions.veyric.hq.established=false;
  state.ui.tab='loot';
  const cache={id:'gc395-test-free',name:'Forgotten Strongbox',regionId:'veyric',rarity:2,from:'Old Road'};
  state.caches.push(cache);
  render();
  const freeNav=[...document.querySelectorAll('#nav button')].map(n=>n.dataset.tab).join(',');
  checks.freebladeNav=freeNav==='you,jobs,gear,loot,region';
  checks.freebladeTab=state.ui.tab==='loot'&&!!document.querySelector('.gc395Loot')&&
   !!document.querySelector('.gc380Stage[data-gc380-stage="armory"]');
  checks.freebladeChest=!!document.querySelector('.gc395Open[data-id="gc395-test-free"]')&&
   document.querySelector('.gc395Totals')?.textContent.includes('1');
  const initial=gc395AllItems().reduce((n,x)=>n+Number(x.qty||1),0);
  const openBtn=document.querySelector('.gc395Open[data-id="gc395-test-free"]');
  if(openBtn)processAction(openBtn);
  const newTotal=gc395AllItems().reduce((n,x)=>n+Number(x.qty||1),0);
  checks.freebladeOpened=!state.caches.some(c=>c.id===cache.id)&&newTotal===initial+1&&state.ui.tab==='loot';
  checks.freebladeReveal=!!document.getElementById('modal')?.classList.contains('show')&&
   !!document.querySelector('#sheet .gc200ChestReveal');
  close();render();
  checks.lootVisible=!!document.querySelector('.gc395Item')&&
   !!document.querySelector('.gc395Item [data-action="itemInfo"]')&&
   !!document.querySelector('.gc395Totals b')?.textContent.includes('0');
  checks.itemRegion=document.querySelector('.gc395Item')?.textContent.includes('Veyric')===true;
  const equipmentBtn=document.querySelector('.gc395Footer [data-action="gear"]');
  if(equipmentBtn)processAction(equipmentBtn);
  checks.equipment=!!document.getElementById('modal')?.classList.contains('show');
  close();
  /* Validate company navigation and the menu's old vault entry. */
  gc270Progression().phase='company';
  state.regions.veyric.hq.established=true;
  state.ui.tab='company';render();
  const companyNav=[...document.querySelectorAll('#nav button')].map(n=>n.dataset.tab).join(',');
  checks.companyNav=companyNav==='you,company,contracts,loot,world';
  const nav=document.querySelector('[data-action="nav"][data-tab="loot"]');
  if(nav)processAction(nav);
  checks.companyTab=state.ui.tab==='loot'&&!!document.querySelector('.gc395Loot')&&
   !!document.querySelector('.gc380Stage[data-gc380-stage="armory"]');
  const companyCache={id:'gc395-test-company',name:'Company Cache',regionId:'veyric',rarity:1,from:'Company Contract'};
  state.caches.push(companyCache);
  render();
  const companyButton=document.querySelector('.gc395Open[data-id="gc395-test-company"]');
  if(companyButton)processAction(companyButton);
  checks.companyOpened=!state.caches.some(c=>c.id===companyCache.id)&&
   !!document.getElementById('modal')?.classList.contains('show');
  close();
  gc330OpenVault();
  checks.menuRedirect=state.ui.tab==='loot'&&!!document.querySelector('.gc395Loot');
  const serialized=normalizeState(JSON.parse(JSON.stringify(state)));
  checks.save=serialized.inventory.length===state.inventory.length&&
   !!serialized.ui&&serialized.ui.tab==='loot';
  checks.touch=[...document.querySelectorAll('#nav button')].every(x=>x.getBoundingClientRect().height>=44);
  checks.overflow=document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
  checks.integrity=gc342StateIntegrity().ok;
  const failed=Object.keys(checks).filter(k=>!checks[k]);
  return{ok:failed.length===0,failed,...checks};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),checks}}
 finally{state=old;close();try{render()}catch(_){}}
};