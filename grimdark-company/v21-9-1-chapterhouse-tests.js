/* v21.9.1 Chapterhouse bonus truthfulness and UI regression. */
window.__GC391_TEST=function(){
 const previous=state;
 try{
  state=createState('Chapterhouse Bonus UI Test','veyric');
  gc270Progression().phase='freeblade';
  state.regions.veyric.hq.established=false;
  const f=gc260CreateFounderRecord('veyric',{name:'Home Tester',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=1;f.missions=0;state.ui.tab='you';
  const pr=gc340Presence();pr.mode='town';pr.place='hall';pr.regionId='veyric';
  render();
  const free=gc340TownHTML(),freeBadge=document.querySelector('[data-gc391-presence-bonus]')?.textContent;
  const locked=freeBadge==='LOCKED'&&free.includes('Found your company')&&free.includes('No HQ director bonus is active yet')&&free.includes('would be +5%');
  pr.place='train';render();
  const train=gc340TownHTML();
  const retainsTownBonus=train.includes('Your presence strengthens Train work')&&train.includes('+25%')&&!train.includes('gc391Bonus');
  state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';
  f.lvl=20;f.missions=40;pr.place='hall';render();
  const founded=gc340TownHTML(),badge=document.querySelector('[data-gc391-presence-bonus]')?.textContent;
  const expected='+'+Math.round((gc390Power(f,'director')-1)*100)+'%';
  const foundVisible=badge===expected&&founded.includes('HOME • YOU ARE LEADING')&&founded.includes('Scout, Odd Jobs, Train and Recover')&&founded.includes('Legendary career');
  const actualEffect=Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(f,'director'))<.000001;
  pr.place='odd';render();
  const away=gc390Director('veyric')===null&&gc340TownHTML().includes('Your presence strengthens Odd Jobs');
  pr.place='hall';
  state.regions.skeld.hq.established=true;gc270Progression().phase='network';
  const manager=generateAdventurer('veyric');manager.lvl=10;manager.missions=12;manager.status='Ready';state.roster.push(manager);
  const appointed=gc280Appoint('veyric',manager.id)===true;
  state.ui.tab='you';render();
  const commanded=gc340TownHTML(),leaderBadge=document.querySelector('[data-gc391-presence-bonus]')?.textContent;
  const managerVisible=appointed&&leaderBadge==='+'+Math.round((gc390Power(manager,'director')-1)*100)+'%'&&commanded.includes('HOME • COMMANDER LEADING')&&commanded.includes(manager.name)&&commanded.includes('Rare')&&commanded.includes('does not add a second director bonus');
  const noDouble=Math.abs(gc390WorkBonus('veyric','Train')-gc390Power(manager,'director'))<.000001;
  gc280Release('veyric',true);f.status='Recovering';render();
  const inactive=gc340TownHTML();
  const inactiveShown=inactive.includes('HOME • LEADERSHIP INACTIVE')&&inactive.includes('0%')&&inactive.includes('Be Ready and physically at the Chapterhouse');
  f.status='Ready';
  const saveSafe=normalizeState(JSON.parse(JSON.stringify(state))).roster.some(a=>a.id===f.id);
  return{ok:locked&&retainsTownBonus&&foundVisible&&actualEffect&&away&&managerVisible&&noDouble&&inactiveShown&&saveSafe,
   locked,freeBadge,retainsTownBonus,foundVisible,badge,expected,actualEffect,away,managerVisible,leaderBadge,noDouble,inactiveShown,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}
 finally{state=previous;try{document.getElementById('modal')?.classList.remove('show');render()}catch(_){}}
};
