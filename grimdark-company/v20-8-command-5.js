/* Grim Company v20.8 — regional command modal and actions. */
function gc280OpenCommand(regionId){
 if(!gc280NetworkUnlocked())return toast('Regional command unlocks after your second headquarters.');
 const c=gc280CommandState(regionId),a=gc280Commander(regionId),eligible=gc280EligibleCommanders(regionId),log=c.log.slice(-8).reverse();
 let html='<div class="sheetHead"><div><h3>'+esc(state.regions[regionId].hq.name)+'</h3><div class="tiny muted">Regional Command</div></div><button class="x" data-action="close">×</button></div>';
 if(a){
  html+='<div class="gc280CommanderHero">'+blPortraitHTML(a,'blPortraitLarge')+'<div><b>'+esc(a.name)+'</b><span>Lv.'+a.lvl+' '+esc(a.culture)+' '+esc(a.className)+'</span><span>Command '+gc280CommandScore(a)+' • '+esc(gc280Temperament(a))+'</span></div></div>';
  html+='<div class="sectionTitle"><h3>Directive</h3><span>what this HQ optimizes for</span></div><div class="gc280ChoiceGrid">';
  html+=GC280_DIRECTIVES.map(v=>'<button class="card '+(c.directive===v?'selected':'')+'" data-action="gc280Directive" data-region="'+regionId+'" data-value="'+esc(v)+'"><b>'+esc(v)+'</b><small>'+esc(gc280DirectiveDesc(v))+'</small></button>').join('');
  html+='</div><div class="sectionTitle"><h3>Risk Policy</h3><span>how close to the edge they work</span></div><div class="tactics">';
  html+=GC280_POLICIES.map(v=>'<button class="tactic '+(c.casualtyPolicy===v?'active':'')+'" data-action="gc280Policy" data-region="'+regionId+'" data-value="'+v+'">'+v+'</button>').join('');
  html+='</div><div class="card gc280Autonomy"><div><b>'+(c.autonomy?'AUTONOMY ACTIVE':'DIRECT CONTROL')+'</b><div class="tiny muted">'+(c.autonomy?'The commander assigns stances, organizes staff and sends real parties on real contracts while time runs.':'The commander remains in post but issues no automatic orders.')+'</div></div><button class="btn '+(c.autonomy?'dangerBtn':'primary')+'" data-action="gc280Toggle" data-region="'+regionId+'">'+(c.autonomy?'Take Direct Control':'Resume Autonomy')+'</button></div>';
  html+='<button class="btn ghost wide" data-action="gc280Release" data-region="'+regionId+'">Return '+esc(a.name)+' to Roster Duty</button>';
 }else{
  html+='<div class="card"><b>Appoint a real adventurer</b><div class="tiny muted">Command removes them from field parties while they hold the post. Their actual level, traits and skills shape their judgment.</div>';
  if(eligible.length){
   html+='<select class="field" id="gc280CommanderPick">'+eligible.map(x=>'<option value="'+x.id+'">'+esc(x.name)+' — Lv.'+x.lvl+' • Command '+gc280CommandScore(x)+'</option>').join('')+'</select><button class="btn goldbtn wide" data-action="gc280Appoint" data-region="'+regionId+'">Appoint HQ Commander</button>';
  }else html+='<div class="empty">No ready local adventurer is available for command.</div>';
  html+='</div>';
 }
 html+='<div class="sectionTitle"><h3>Commander Log</h3><span>real simulation actions</span></div><div class="card history">'+(log.length?log.map(x=>'<div>Day '+x.day+' • '+esc(x.text)+'</div>').join(''):'<div>No delegated actions yet.</div>')+'</div>';
 modal(html);
}
function gc280SetDirective(regionId,value){const c=gc280CommandState(regionId);if(!c||!GC280_DIRECTIVES.includes(value))return;c.directive=value;gc280Log(regionId,(gc280Commander(regionId)?.name||'Commander')+' changed directive to '+value+'.');save();gc280OpenCommand(regionId)}
function gc280SetPolicy(regionId,value){const c=gc280CommandState(regionId);if(!c||!GC280_POLICIES.includes(value))return;c.casualtyPolicy=value;gc280Log(regionId,(gc280Commander(regionId)?.name||'Commander')+' changed risk policy to '+value+'.');save();gc280OpenCommand(regionId)}
function gc280Toggle(regionId){const c=gc280CommandState(regionId),a=gc280Commander(regionId);if(!a)return;c.autonomy=!c.autonomy;c.progress=0;gc280Log(regionId,a.name+(c.autonomy?' resumed autonomous command.':' yielded to direct control.'));save();render();gc280OpenCommand(regionId)}
function gc280ReleaseAction(regionId){const a=gc280Commander(regionId);if(!a)return;gc280Release(regionId,true);gc280Log(regionId,a.name+' left the command post and returned to roster duty.');save();render();gc280OpenCommand(regionId)}
const _processActionGC280=processAction;
processAction=function(el){
 const a=el.dataset.action,rid=el.dataset.region;
 if(a==='gc280Open')return gc280OpenCommand(rid);
 if(a==='gc280Appoint'){const ok=gc280Appoint(rid,document.getElementById('gc280CommanderPick')?.value);if(ok)gc280OpenCommand(rid);return}
 if(a==='gc280Directive')return gc280SetDirective(rid,el.dataset.value);
 if(a==='gc280Policy')return gc280SetPolicy(rid,el.dataset.value);
 if(a==='gc280Toggle')return gc280Toggle(rid);
 if(a==='gc280Release')return gc280ReleaseAction(rid);
 return _processActionGC280(el);
};
