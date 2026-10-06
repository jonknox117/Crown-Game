/* Grim Company v20.8 — authority and commander identity surfaces. */
const _gc260RenderYouGC280=gc260RenderYou;
gc260RenderYou=function(){
 let html=_gc260RenderYouGC280();
 if(gc280NetworkUnlocked()&&gc260Founder()?.status!=='Dead'){
  const ids=REGION_ORDER.filter(id=>state.regions[id]?.hq?.established);
  const managed=ids.filter(id=>gc280Commander(id)&&gc280CommandState(id).autonomy).length;
  const card='<div class="gc280Authority"><span>YOUR AUTHORITY</span><b>'+ids.length+' HQs • '+managed+' delegated</b><small>You can still travel, join a party and personally take the field.</small></div>';
  html=html.replace('<div class="grid3 gc260PersonalStats">',card+'<div class="grid3 gc260PersonalStats">');
 }
 return html;
};
const _rosterCardGC280=rosterCard;
rosterCard=function(a){
 let html=_rosterCardGC280(a),rid=gc280CommanderRegion(a?.id);
 if(rid)html=html.replace('<h4>'+esc(a.name),'<h4>'+esc(a.name)+' <span class="gc280CommanderTag">COMMANDER</span>');
 return html;
};
const _renderInspectGC280=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC280(id,recruit),rid=!recruit?gc280CommanderRegion(id):null;
 if(rid){
  const head=document.getElementById('sheet')?.querySelector('.sheetHead');
  if(head){const n=document.createElement('div');n.className='gc280InspectBadge';n.textContent='HQ COMMANDER • '+REGION_DEFS[rid].name+' • '+gc280CommandState(rid).directive;head.after(n)}
 }
 return out;
};
const _gc193DailyDashboardGC280=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC280().replace('v20.7 • FROM NOTHING','v20.8 • COMMAND')};
