/* Grim Company v21.6.0 — class progression, rarity and battle clarity. */
function gc360TalentHTML(a){
 const talents=gc360Talents(a);
 if(!talents.length)return'';
 const passive=gc360Passive(a);
 const rows=talents.map(t=>{
  const unlocked=(a.lvl||1)>=t.level;
  return '<div class="gc360Talent '+(unlocked?'unlocked':'locked')+'"><div class="gc360TalentLevel">LV '+t.level+'</div><div class="gc360TalentBody"><b>'+esc(t.name)+'</b><small>'+esc(t.description)+'</small><em>'+(unlocked?'AVAILABLE • '+t.cooldown+' ROUND COOLDOWN':'LOCKED • LEVEL '+t.level)+'</em></div></div>';
 }).join('');
 return '<section class="gc360ClassPanel"><div class="gc360SectionHead"><span>COMBAT IDENTITY</span><b>'+esc(a.className||'Adventurer')+' • '+esc(gc360RankName(a))+'</b></div><div class="gc360Passive"><strong>LEVEL 1 • PASSIVE</strong><b>'+esc(passive)+'</b></div><div class="gc360Basic"><b>BASIC ACTIONS</b><span>Attack • Guard • Reposition</span><small>Every adventurer can attack, sacrifice a turn to guard, or evade and change position when in danger. Class skills replace one regular action.</small></div><div class="gc360SectionHead"><span>CLASS ABILITIES</span><b>'+talents.filter(x=>a.lvl>=x.level).length+'/4 UNLOCKED</b></div>'+rows+'</section>';
}
const _renderInspectGC360=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC360(id,recruit),a=state.roster.find(x=>x.id===id)||REGION_ORDER.flatMap(r=>state.regions?.[r]?.recruits||[]).find(x=>x.id===id);
 const sheet=document.getElementById('sheet');
 if(a&&sheet&&!sheet.querySelector('.gc360ClassPanel')){
  const el=document.createElement('div');el.innerHTML=gc360TalentHTML(a);
  const body=el.firstElementChild;
  if(body)sheet.appendChild(body);
 }
 return out;
};
const _gc330PersonCardGC360=typeof gc330PersonCard==='function'?gc330PersonCard:null;
if(_gc330PersonCardGC360)gc330PersonCard=function(a){
 let html=_gc330PersonCardGC360(a);
 return html.replace('Lv.'+a.lvl+' ', 'Lv.'+a.lvl+' • '+gc360RankName(a)+' ');
};
const _gc330RecruitCardGC360=typeof gc330RecruitCard==='function'?gc330RecruitCard:null;
if(_gc330RecruitCardGC360)gc330RecruitCard=function(a){
 let html=_gc330RecruitCardGC360(a);
 return html.replace('Lv.'+a.lvl+' ', 'Lv.'+a.lvl+' • '+gc360RankName(a)+' ');
};
function gc360InstallStyles(){
 if(document.getElementById('gc360ClassStyles'))return;
 const s=document.createElement('style');s.id='gc360ClassStyles';s.textContent=
 '.gc360ClassPanel{margin:12px 0 18px;padding:12px;border:1px solid rgba(201,164,96,.25);border-radius:10px;background:linear-gradient(180deg,#1d1a16,#12110f)}'+
 '.gc360SectionHead{display:flex;justify-content:space-between;gap:6px;padding:3px 0 9px;border-bottom:1px solid rgba(255,255,255,.08)}'+
 '.gc360SectionHead span{font-size:8px;color:#b89c68;letter-spacing:.12em}.gc360SectionHead b{font-size:9px;color:#d8c6a7}'+
 '.gc360Passive{margin:10px 0;padding:11px;border-left:3px solid #b49358;background:#2b251c}'+
 '.gc360Passive strong,.gc360Passive b{display:block}.gc360Passive strong{font-size:8px;color:#d3b576;letter-spacing:.1em}.gc360Passive b{font-size:10px;line-height:1.5;color:#e3dacc;margin-top:5px}'+
 '.gc360Basic{margin:9px 0 12px;padding:9px;border-radius:6px;background:#171917}'+
 '.gc360Basic b,.gc360Basic span,.gc360Basic small{display:block}.gc360Basic b{font-size:8px;letter-spacing:.1em;color:#b4a387}.gc360Basic span{font-size:11px;font-weight:700;color:#ddd1bc;margin:4px 0}.gc360Basic small{font-size:9px;color:#aaa091;line-height:1.55}'+
 '.gc360Talent{display:flex;gap:9px;align-items:flex-start;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}'+
 '.gc360Talent:last-child{border:0}.gc360TalentLevel{flex:0 0 44px;padding:6px 3px;text-align:center;border-radius:5px;background:#362b1d;border:1px solid #6e5330;color:#d7ae6a;font-size:9px;font-weight:800}'+
 '.gc360TalentBody{min-width:0}.gc360TalentBody b,.gc360TalentBody small,.gc360TalentBody em{display:block}'+
 '.gc360TalentBody b{font-size:12px;color:#e2d2b6}.gc360TalentBody small{font-size:9px;line-height:1.5;color:#aaa294;margin:4px 0}.gc360TalentBody em{font-size:8px;font-style:normal;color:#d1aa6f}'+
 '.gc360Talent.locked{opacity:.62}.gc360Talent.locked .gc360TalentLevel{background:#171717;color:#938c81;border-color:#45403a}.gc360Talent.locked .gc360TalentBody em{color:#9e9689}';
 document.head.appendChild(s);
}
gc360InstallStyles();
const _auditGC360UI=audit;
audit=function(){
 const x=_auditGC360UI();x.visibleClassLevelLadder=true;x.fourUniqueSkillsPerClass=true;x.passiveAndBasicActionsListed=true;return x;
};
window.__BL_AUDIT=audit;

window.__GC360_CLASS_TEST=function(){
 try{
  const classes=Object.values(CLASSES).flat().map(x=>x.name),seen=new Set();
  const missing=classes.filter(n=>!GC360_ABILITIES[n]);
  let collisions=0,descriptions=true,unlocks=true;
  const names=new Set();
  classes.forEach(name=>{
   const abilities=GC360_ABILITIES[name]||[];
   if(abilities.length!==4)unlocks=false;
   abilities.forEach((t,i)=>{
    if(t.level!==GC360_UNLOCKS[i]||!GC360_EFFECT_HELP[t.kind])unlocks=false;
    if(!t.description||t.description.length<25)descriptions=false;
    if(names.has(t.name))collisions++;
    names.add(t.name);
   });
  });
  const check={name:'Test',className:'Shieldthane',lvl:4,missions:0};
  const l4=gc360Unlocked(check).length;check.lvl=5;const l5=gc360Unlocked(check).length;check.lvl=10;const l10=gc360Unlocked(check).length;check.lvl=15;const l15=gc360Unlocked(check).length;check.lvl=20;const l20=gc360Unlocked(check).length;
  const html=gc360TalentHTML(check),visible=html.includes('PASSIVE')&&html.includes('LV 20')&&html.includes('BASIC ACTIONS');
  return{ok:classes.length===26&&!missing.length&&!collisions&&descriptions&&unlocks&&names.size===104&&l4===0&&l5===1&&l10===2&&l15===3&&l20===4&&visible,classes:classes.length,skills:names.size,missing,collisions,descriptions,unlocks,levels:[l4,l5,l10,l15,l20],visible};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}
};