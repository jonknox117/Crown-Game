/* Grim Company v20.8 — command overview surfaces. */
const _regionCardGC280=regionCard;
regionCard=function(id){
 let html=_regionCardGC280(id),strip=gc280CommandStrip(id);
 if(strip)html=html.replace('<div class="actions">',strip+'<div class="actions">');
 return html;
};
function gc280CompanyCommandHTML(){
 if(!gc280NetworkUnlocked())return'';
 const ids=REGION_ORDER.filter(id=>state.regions[id]?.hq?.established);
 const managed=ids.filter(id=>gc280Commander(id)&&gc280CommandState(id).autonomy).length;
 return '<div class="gc280Overview"><div class="statline"><div><span>COMPANY COMMAND</span><b>'+ids.length+' headquarters • '+managed+' delegated</b></div></div><div class="tiny muted">Appoint veterans to operate distant headquarters, or keep any region under direct control.</div></div>';
}
const _renderWorldGC280=renderWorld;
renderWorld=function(){
 let html=_renderWorldGC280(),panel=gc280CompanyCommandHTML();
 return panel?html.replace('<div class="list">',panel+'<div class="list">'):html;
};
const _renderHQGC280=renderHQ;
renderHQ=function(){
 let html=_renderHQGC280();
 if(gc280NetworkUnlocked()){const strip=gc280CommandStrip(state.currentRegion);if(strip)html=html.replace('<div class="grid3">',strip+'<div class="grid3">')}
 return html;
};
