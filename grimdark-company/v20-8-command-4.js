/* Grim Company v20.8 — regional command presentation helpers. */
function gc280DirectiveDesc(v){
 const m={
  'Make Money':'Favors profitable contracts and puts idle staff on Odd Jobs.',
  'Secure Region':'Favors work that improves regional safety and keeps scouts active.',
  'Develop Roster':'Prioritizes training, sustainable work and selective recruiting when the treasury has a reserve.',
  'Break Campaign':'Prioritizes the active regional Campaign whenever an appropriate party can handle it.'
 };
 return m[v]||'Regional command.';
}
function gc280CommandStrip(regionId){
 if(!gc280NetworkUnlocked()||!state.regions[regionId]?.hq?.established)return'';
 const c=gc280CommandState(regionId),a=gc280Commander(regionId),last=c.log[c.log.length-1];
 return '<div class="gc280CommandStrip '+(a&&c.autonomy?'active':'')+'"><div><span>REGIONAL COMMAND</span><b>'+(a?esc(a.name):'Direct control')+'</b><small>'+(a?(esc(c.directive)+' • '+esc(c.casualtyPolicy)+(c.autonomy?' • AUTONOMOUS':' • PAUSED')):'No commander appointed.')+'</small>'+(last?'<em>Last: '+esc(last.text)+'</em>':'')+'</div><button class="btn '+(a?'ghost':'goldbtn')+'" data-action="gc280Open" data-region="'+regionId+'">'+(a?'Manage':'Appoint')+'</button></div>';
}
