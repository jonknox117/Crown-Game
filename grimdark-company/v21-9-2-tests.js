/* v21.9.2 regression: Chapterhouse bonus is real before founding. */
window.__GC392_TEST=function(){
 const savedState=state;
 try{
  state=createState('Freeblade Chapterhouse Test','veyric');
  gc270Progression().phase='freeblade';
  state.regions.veyric.hq.established=false;
  const f=gc260CreateFounderRecord('veyric',{
   name:'Solo Chapterhouse Tester',race:'Human',culture:'Veyric',
   className:'March Ranger',gender:'Male',portrait:1
  },true);
  f.status='Ready';f.lvl=1;f.missions=0;f.dailyOrder='Train';
  state.ui.tab='you';
  const pr=gc340Presence();pr.regionId='veyric';pr.mode='town';pr.place='hall';
  render();
  const badge=document.querySelector('[data-gc391-presence-bonus]');
  const freeMarkup=gc340TownHTML();
  const freeActive=badge?.textContent==='+5%'&&
   freeMarkup.includes('HOME • PERSONAL LEADERSHIP')&&
   freeMarkup.includes('real Freeblade bonus')&&
   !freeMarkup.includes('Found your company here to unlock');
  const scalar=Math.abs(gc390WorkBonus('veyric','Train')-1.05)<.000001;
  const baselineWork=gc200Work(f);
  baselineWork.gc201TrainFraction=0;
  gc201TrainRegion('veyric',.1);
  const boostedFraction=baselineWork.gc201TrainFraction;
  pr.place='odd';f.dailyOrder='Train';
  const awayScalar=gc390WorkBonus('veyric','Train')===1;
  baselineWork.gc201TrainFraction=0;
  gc201TrainRegion('veyric',.1);
  const awayFraction=baselineWork.gc201TrainFraction;
  const actualWorkBonus=boostedFraction>awayFraction+.02&&awayFraction>.59;
  pr.place='odd';f.dailyOrder='Odd Jobs';render();
  const otherLocations=gc340TownHTML().includes('Odd Jobs • ACTIVE PRESENCE')||
   gc340TownHTML().includes('ODD JOBS • ACTIVE PRESENCE');
  const otherBadge=gc340TownHTML().includes('Your presence strengthens Odd Jobs work at this HQ by 25%');
  pr.place='hall';f.dailyOrder='Train';f.lvl=20;f.missions=40;render();
  const legendaryPercent=Math.round((gc390Power(f,'director')-1)*100);
  const experienced=gc340TownHTML().includes('+'+legendaryPercent+'%')&&
   gc340TownHTML().includes('Legendary career')&&
   Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(f,'director'))<.00001;
  state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';render();
  const founded=gc340TownHTML().includes('HOME • YOU ARE LEADING')&&
   gc340TownHTML().includes('+'+legendaryPercent+'%')&&
   Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(f,'director'))<.00001;
  pr.place='odd';const leftHQ=gc390Director('veyric')===null;
  state.regions.skeld.hq.established=true;gc270Progression().phase='network';
  const manager=generateAdventurer('veyric');
  manager.status='Ready';manager.lvl=15;manager.missions=25;state.roster.push(manager);
  const appointed=gc280Appoint('veyric',manager.id)===true;
  pr.place='hall';state.ui.tab='you';render();
  const managed=appointed&&gc340TownHTML().includes('HOME • COMMANDER LEADING')&&
   Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(manager,'director'))<.00001;
  const saves=normalizeState(JSON.parse(JSON.stringify(state)));
  const saveValid=saves.company.founderId===f.id&&gc342StateIntegrity().ok;
  const ok=!!(freeActive&&scalar&&awayScalar&&actualWorkBonus&&otherLocations&&otherBadge&&
   experienced&&founded&&leftHQ&&managed&&saveValid);
  return {ok,freeActive,scalar,awayScalar,actualWorkBonus,boostedFraction,awayFraction,
   otherLocations,otherBadge,experienced,founded,leftHQ,managed,saveValid};
 }catch(e){return {ok:false,error:String(e&&e.stack||e)}}
 finally{state=savedState;try{document.getElementById('modal')?.classList.remove('show');render()}catch(_){}}
};
/* Replace the old v21.9.1 expectation that Freeblade bonuses must be locked. */
window.__GC391_TEST=window.__GC392_TEST;
