/* Broken Lantern v21.9.5 — restore a first-class Loot tab on Freeblade and Company.
   Reuses the canonical state.caches, state.inventory and openCache reveal engine. */
const GC395_VERSION='21.9.5';
if(!GC330_PRIMARY.some(x=>x[0]==='loot'))GC330_PRIMARY.splice(3,0,['loot','♢','LOOT']);
if(!GC270_FREEBLADE_TABS.some(x=>x[0]==='loot'))GC270_FREEBLADE_TABS.splice(3,0,['loot','♢','LOOT']);
function gc395AllCaches(){return Array.isArray(state?.caches)?state.caches:[]}
function gc395AllItems(){
 return Array.isArray(state?.inventory)?state.inventory.filter(x=>x&&x.item):[];
}
function gc395CacheCard(c){
 const rarity=clamp(Number(c.rarity)||0,0,4),region=REGION_DEFS[c.regionId]?.name||'Unknown region';
 return '<div class="card gc395CacheCard rarity-'+(rarity+1)+'">'+
 '<div class="gc395CacheSymbol">'+bl17CacheSvg(rarity)+'</div>'+
 '<div class="gc395CacheText"><b>'+esc(c.name||'Recovered Cache')+'</b>'+
 '<small>'+esc(region)+(c.from?' • '+esc(c.from):'')+'</small>'+
 '<span>'+esc(RARITIES[rarity]||'Unidentified')+' chest • contains an unrevealed item</span></div>'+
 '<button type="button" class="btn goldbtn gc395Open" data-action="gc395OpenCache" data-id="'+esc(c.id)+'">OPEN CHEST</button></div>';
}
function gc395ItemCard(entry){
 const item=entry.item,rarity=clamp(Number(item.rarity)||0,0,4),
 region=REGION_DEFS[entry.regionId]?.name||REGION_DEFS[state.currentRegion]?.name||'Storage';
 return '<div class="card gc395Item"><div><b class="rarity-'+(rarity+1)+'">'+esc(item.name||'Unknown equipment')+'</b>'+
 '<small>'+esc(item.slot||'Item')+' • '+esc(region)+' • ×'+Math.max(1,Number(entry.qty)||1)+'</small></div>'+
 '<button class="btn ghost" data-action="itemInfo" data-id="'+esc(item.id)+'">INSPECT</button></div>';
}
function gc395SpoilsHTML(){
 const caches=gc395AllCaches(),items=gc395AllItems(),
 artifacts=Array.isArray(state?.artifacts)?state.artifacts:[];
 const n=items.reduce((sum,e)=>sum+Math.max(1,Number(e.qty)||1),0);
 const f=gc260Founder(),free=gc270IsFreeblade();
 const gameRegion=REGION_DEFS[state.currentRegion]?.name||'The region';
 return '<section class="gc395Loot" aria-label="Loot and unopened chests">'+
 '<div class="gc395Lead"><span>LOOT • CHESTS & SPOILS</span><h2>The Spoils Vault</h2>'+
 '<p>Open recovered chests, inspect your treasures, and manage everything you have brought back from the field.</p></div>'+
 '<div class="gc395Totals"><div><b>'+caches.length+'</b><small>UNOPENED CHESTS</small></div>'+
 '<div><b>'+n+'</b><small>STORED ITEMS</small></div>'+
 '<div><b>'+artifacts.length+'</b><small>ARTIFACTS</small></div></div>'+
 '<div class="sectionTitle"><h3>Unopened Chests</h3><span>'+caches.length+' waiting</span></div>'+
 '<div class="gc395ChestList">'+(caches.length?caches.map(gc395CacheCard).join(''):
 '<div class="gc395Empty">No unopened chests. Complete jobs and recover caches to collect new treasure.</div>')+'</div>'+
 '<div class="sectionTitle"><h3>Stored Loot</h3><span>'+n+' items</span></div>'+
 '<div class="gc395ItemList">'+(items.length?items.map(gc395ItemCard).join(''):
 '<div class="gc395Empty">Your stores are empty. Items equipped on adventurers are shown on their character sheets.</div>')+'</div>'+
 '<div class="sectionTitle"><h3>Legendary Artifacts</h3><span>'+artifacts.length+'</span></div>'+
 '<div class="gc395Artifacts">'+(artifacts.length?artifacts.map(a=>
 '<div class="card gc395Artifact"><b>'+esc(a.name||'Unnamed artifact')+'</b>'+
 '<small>'+esc(a.desc||a.cost||'Legendary treasure')+'</small></div>').join(''):
 '<div class="gc395Empty">No legendary artifacts collected yet.</div>')+'</div>'+
 '<div class="gc395Footer"><span>'+esc(gameRegion)+' • '+(free?'Personal spoils':'Company spoils')+'</span>'+
 '<button type="button" class="btn" data-action="gear" data-id="'+esc(f?.id||'')+'"'+(!f?' disabled':'')+'>MY EQUIPMENT ›</button></div>'+
 '</section>';
}
/* Both phase renderers have a final WORLD/REGION fallback branch. Reuse those
   safely for the new fifth tab instead of recreating or forking the render loop. */
const _gc330WorldScreenGC395=gc330WorldScreen;
gc330WorldScreen=function(...args){return state?.ui?.tab==='loot'?gc395SpoilsHTML():_gc330WorldScreenGC395(...args)};
const _gc270RegionGC395=gc270Region;
gc270Region=function(...args){return state?.ui?.tab==='loot'?gc395SpoilsHTML():_gc270RegionGC395(...args)};
const _gc270NavHTMLGC395=gc270NavHTML;
gc270NavHTML=function(){
 if(!state||!gc270IsFreeblade())return _gc270NavHTMLGC395();
 return [['you','♙','YOU'],['jobs','⚔','JOBS'],['gear','◇','GEAR'],['loot','♢','LOOT'],['region','⌖','WORLD']]
  .map(([id,icon,label])=>'<button class="navbtn gc330NavBtn '+(state.ui.tab===id?'active':'')+
  '" data-action="nav" data-tab="'+id+'" aria-label="'+label+'">'+
  '<b>'+icon+'</b><span>'+label+'</span></button>').join('');
};
const _gc381ResolveSceneGC395=gc381ResolveScene;
gc381ResolveScene=function(){
 if(state?.ui?.tab==='loot'){
  return{id:'armory',regionId:state.currentRegion,label:'LOOT • OPEN CHESTS',title:'The Spoils Vault'};
 }
 return _gc381ResolveSceneGC395();
};
/* The old menu opened the inventory as a popup. Take the player to the
   dedicated, scrollable Loot tab instead. */
gc330OpenVault=function(){
 if(!state)return;
 state.ui.tab='loot';save();render();
 requestAnimationFrame(()=>window.scrollTo(0,0));
};
const _processActionGC395=processAction;
processAction=function(el){
 const action=el?.dataset?.action;
 if(action==='gc395OpenCache'){
  if(typeof gc321Locked==='function'&&gc321Locked())return toast('Resolve the current decision before opening a chest.');
  const id=el.dataset.id;
  if(!gc395AllCaches().some(c=>c.id===id))return toast('That chest has already been opened.');
  return openCache(id);
 }
 return _processActionGC395(el);
};
function gc395InstallStyles(){
 if(document.getElementById('gc395Styles'))return;
 const s=document.createElement('style');s.id='gc395Styles';
 s.textContent=[
  '#nav{grid-template-columns:repeat(5,minmax(0,1fr))!important}',
  '#nav .navbtn{min-width:0!important;min-height:58px!important;padding:6px 1px!important}',
  '#nav .navbtn b{font-size:clamp(15px,4.4vw,23px)!important}',
  '#nav .navbtn span{display:block!important;font-size:clamp(8px,2.1vw,10px)!important;letter-spacing:.035em!important}',
  '.gc395Loot{padding-bottom:calc(90px + env(safe-area-inset-bottom,0px))}',
  '.gc395Lead{padding:15px 11px 12px;background:linear-gradient(145deg,#24201b,#111214);border:1px solid #574833;border-radius:8px}',
  '.gc395Lead>span{font-size:9px;letter-spacing:.16em;color:#c8a36e;font-weight:700}',
  '.gc395Lead h2{font:700 25px Georgia,serif;color:#ead8b7;margin:6px 0}',
  '.gc395Lead p{font-size:12px;line-height:1.5;color:#bca88d;margin:0}',
  '.gc395Totals{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:10px 0}',
  '.gc395Totals>div{border:1px solid #584732;background:#191714;border-radius:7px;text-align:center;padding:12px 3px}',
  '.gc395Totals b{display:block;color:#e4c28b;font:700 23px Georgia,serif}',
  '.gc395Totals small{display:block;color:#b19a79;font-size:8px;letter-spacing:.04em;margin-top:5px}',
  '.gc395ChestList,.gc395ItemList,.gc395Artifacts{display:grid;gap:8px}',
  '.gc395CacheCard{display:grid;grid-template-columns:56px minmax(0,1fr);gap:9px;align-items:center;padding:11px!important}',
  '.gc395CacheSymbol{width:54px;height:58px;display:grid;place-items:center;color:#c5a475}',
  '.gc395CacheSymbol svg{max-width:54px;max-height:58px}',
  '.gc395CacheText{min-width:0}.gc395CacheText b{display:block;color:#e6d6bc;font-size:14px}',
  '.gc395CacheText small,.gc395CacheText span{display:block;font-size:10px;color:#b9a38a;line-height:1.5;margin-top:4px}',
  '.gc395Open{grid-column:1 / -1;min-height:48px!important;width:100%}',
  '.gc395Item{display:flex;justify-content:space-between;align-items:center;gap:8px}',
  '.gc395Item>div{min-width:0}.gc395Item b,.gc395Item small{display:block;overflow-wrap:anywhere}',
  '.gc395Item b{font-size:13px}.gc395Item small{font-size:10px;color:#ad9b84;margin-top:5px}',
  '.gc395Item button{min-width:78px;min-height:45px}',
  '.gc395Artifact small{display:block;font-size:10px;line-height:1.5;color:#bea788;margin-top:6px}',
  '.gc395Empty{padding:17px 12px;background:#141313;border:1px dashed #63513a;border-radius:7px;color:#b6a185;font-size:12px;line-height:1.5}',
  '.gc395Footer{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:16px;font-size:10px;color:#ae9b7f}',
  '.gc395Footer button{min-height:44px}',
  '@media(max-width:345px){.gc395Totals small{font-size:7px}.gc395Item{flex-wrap:wrap}.gc395Item button{width:100%}}'
 ].join('');
 document.head.appendChild(s);
}
gc395InstallStyles();
const _auditGC395=audit;
audit=function(){
 const out=_auditGC395();
 out.v395LootTab=GC395_VERSION;
 out.lootTabAvailableFreebladeAndCompany=true;
 out.chestOpeningUsesCanonicalCacheState=true;
 out.inventoryAndArtifactsVisibleInLootTab=true;
 return out;
};
window.__BL_AUDIT=audit;