/* Broken Lantern v21.10 — mobile-first active combat & contextual control.
   Independent of battle rounds: player taps are bonus light hits, not extra
   auto-attacks. Combat AI, casualties, formations and all class skills remain. */
const GC410_STRIKE_COOLDOWN_MS=1400;
const GC410_STRIKE_RATIO=.13;
let GC410_LATEST_HIT=null;
function gc410BattleParty(){
 if(!state||!gc260Founder())return null;
 return state.parties.find(p=>p.expedition?.battle&&gc260FounderInParty(p))||null;
}
function gc410TravelParty(){
 if(!state||!gc260Founder())return null;
 return state.parties.find(p=>p.expedition&&!p.expedition.battle&&gc260FounderInParty(p))||null;
}
function gc410ReadyHit(p){
 const f=gc410AliveFounder(p),b=p?.expedition?.battle;
 return !!(f&&f.hp>0&&!f.gc320Downed&&b&&!p.expedition.gc260PendingDecision&&
  !gc321Locked()&&Date.now()>=(b.gc410NextManualAt||0));
}
function gc410HitTarget(pid,eid){
 const p=state?.parties?.find(x=>x.id===pid),b=p?.expedition?.battle,
  f=gc260Founder(),actor=gc410AliveFounder(p);
 if(!b||!f||!actor||!gc260FounderInParty(p))return false;
 if(!gc410ReadyHit(p))return false;
 const enemy=b.enemies.find(x=>x.id===eid&&x.hp>0);
 if(!enemy)return false;
 const d=derived(f),normal=Math.max(4,(5+actor.attack*.5-enemy.guard*.16)),
  critBonus=Math.max(0,d?.special?.crit||0),damage=Math.max(2,Math.round(normal*GC410_STRIKE_RATIO*(1+critBonus*.25)));
 const dealt=Math.min(enemy.hp,damage);
 enemy.hp=Math.max(0,enemy.hp-damage);
 b.gc410ManualHits=(Number(b.gc410ManualHits)||0)+1;
 b.gc410ManualDamage=(Number(b.gc410ManualDamage)||0)+dealt;
 b.gc410NextManualAt=Date.now()+GC410_STRIKE_COOLDOWN_MS;
 b.log.push('PLAYER STRIKE — '+f.name+' taps '+enemy.name+' for '+dealt+' bonus damage.');
 if(b.log.length>65)b.log.splice(0,b.log.length-65);
 GC410_LATEST_HIT={id:enemy.id,value:dealt,at:Date.now()};
 sfx('hit');
 if(!gc410Living(b).length){resolveBattle(p,true);return true}
 save();
 gc410PatchCombatFocus();
 return true;
}
function gc410EnemyGlyph(enemy){
 const role=enemy.role||'',r=['Archer','Shaman','Stalker'].includes(role);
 return '<svg viewBox="0 0 54 54" width="45" height="45" aria-hidden="true" fill="none">'+
 '<path d="M27 8C17 8 12 15 12 23V34L7 43H47L42 34V23C42 15 37 8 27 8Z" fill="'+(r?'#24384a':'#493029')+'" stroke="#a48867" stroke-width="2"/>'+
 '<path d="M18 23C18 17 36 17 36 23V36H18Z" fill="#8f786b"/>'+
 '<path d="M19 27H25M29 27H35" stroke="#241b19" stroke-width="4"/>'+
 '<path d="M27 34V42M15 46H39" stroke="#d0a26b" stroke-width="2"/>'+
 (r?'<path d="M9 40Q27 3 45 40" stroke="#ceb88c" stroke-width="2"/>':'<path d="M18 14H36L33 7H21Z" fill="#6c4c39"/>')+
 '</svg>';
}
function gc410EnemyButton(p,x){
 const ready=gc410ReadyHit(p),down=x.hp<=0,ratio=clamp(x.hp/Math.max(1,x.maxHp)*100,0,100);
 return '<button type="button" class="gc410Enemy '+(down?'gc410EnemyDead':'')+'" data-action="gc410PlayerStrike" data-party="'+esc(p.id)+'" data-id="'+esc(x.id)+'" '+(!ready||down?'disabled':'')+' aria-label="Strike '+esc(x.name)+'">'+
 '<div class="gc410EnemyIcon">'+gc410EnemyGlyph(x)+'</div>'+
 '<b>'+esc(x.name)+'</b><small>'+Math.max(0,Math.round(x.hp))+' / '+Math.max(1,Math.round(x.maxHp))+' HP</small>'+
 '<div class="gc410EnemyBar"><i style="width:'+ratio+'%"></i></div>'+
 '<span class="gc410EnemyTap">'+(down?'DEFEATED':ready?'TAP TO STRIKE':'WAIT')+'</span></button>';
}
function gc410UltimateState(a,u){
 if(!a||!u)return 'AUTO';
 if(a.lvl<20)return 'LOCKED • LV 20';
 if(u.gc410UltimateSpent)return 'USED THIS BATTLE';
 const t=gc360Talents(a).find(x=>x.level===20);
 if(!t)return 'NO ULTIMATE';
 return 'READY • AUTO TRIGGER';
}
function gc410CombatFocusHTML(p){
 const b=p.expedition.battle,f=gc260Founder(),actor=gc410AliveFounder(p);
 const ability=gc360Talents(f).find(x=>x.level===20);
 const log=b.log.slice(-2).reverse(),ready=gc410ReadyHit(p);
 return '<section class="gc410Fight" data-gc410-party="'+esc(p.id)+'" aria-label="Live player combat" role="region">'+
 '<div class="gc410FightHead"><div><span>LIVE COMBAT • ROUND '+Math.max(1,b.round)+'</span><h3>'+esc(p.expedition.contract?.title||'Battle')+'</h3></div>'+
 '<strong class="gc410FightTag">'+(actor?'YOU ARE FIGHTING':'YOU ARE DOWN')+'</strong></div>'+
 '<p class="gc410FightInstructions">Tap an enemy for a light bonus strike. Your class and party continue fighting automatically.</p>'+
 '<div class="gc410EnemyGrid">'+b.enemies.map(x=>gc410EnemyButton(p,x)).join('')+'</div>'+
 '<div class="gc410FightMeter"><span>'+(!actor?'INCAPACITATED — PLAYER STRIKES DISABLED':ready?'PLAYER STRIKE READY':'STRIKE RECHARGING')+'</span>'+
 '<b>'+Math.round(b.gc410ManualDamage||0)+' BONUS DAMAGE</b></div>'+
 '<div class="gc410CombatIdentity"><div><b>'+esc(f.className)+'</b><span>LV '+f.lvl+' • '+esc(gc410PassiveName(f))+'</span></div>'+
 '<div class="gc410Ultimate '+(actor?.gc410UltimateSpent?'spent':'')+'"><strong>ULTIMATE • '+esc(ability?.name||'LV 20')+'</strong>'+
 '<small>'+gc410UltimateState(f,actor)+'</small></div></div>'+
 '<div class="gc410FightLog">'+log.map(t=>'<div>'+esc(t)+'</div>').join('')+'</div>'+
 '<button class="gc410ClassDetails" type="button" data-action="inspect" data-id="'+esc(f.id)+'">CLASS PASSIVE & ABILITY DETAILS ›</button>'+
 '</section>';
}
function gc410ContextHTML(p){
 const e=p.expedition;
 if(!e)return '';
 if(e.battle)return gc410CombatFocusHTML(p);
 return '<section class="gc410FieldBar" data-gc410-field="'+esc(p.id)+'">'+
 '<div><small>YOU ARE ON AN EXPEDITION</small><b>'+esc(e.contract?.title||'On the road')+'</b><span>Travel '+Math.round(e.progress||0)+'% • '+(e.gc260PendingDecision?'DECISION REQUIRED':'Party traveling')+'</span></div>'+
 '<div class="gc410FieldActions"><button data-action="gc410GoJobs" type="button">EXPEDITION ›</button>'+
 (!e.gc260PendingDecision?'<button data-action="gc410QuickPush" data-party="'+esc(p.id)+'" type="button">PUSH PACE</button>':'<b>CHOOSE AN ACTION BELOW</b>')+
 '</div></section>';
}
function gc410MountContext(){
 const app=document.querySelector('#app'),screen=app?.querySelector('.gc330Screen')||app?.querySelector('.screen'),p=gc410BattleParty()||gc410TravelParty();
 if(!screen){document.body.classList.remove('gc410CombatActive');return false}
 const existing=screen.querySelector(':scope > [data-gc410-party], :scope > [data-gc410-field]'),
  scene=screen.querySelector(':scope > .gc380Stage');
 if(!p){existing?.remove();document.body.classList.remove('gc410CombatActive');return false}
 const id=p.id,key=p.expedition.battle?'gc410Party':'gc410Field';
 const matches=existing&&existing.getAttribute(p.expedition.battle?'data-gc410-party':'data-gc410-field')===id;
 document.body.classList.toggle('gc410CombatActive',!!p.expedition.battle);
 if(matches){return gc410PatchCombatFocus()}
 if(existing)existing.remove();
 if(scene)scene.insertAdjacentHTML('afterend',gc410ContextHTML(p));
 else screen.insertAdjacentHTML('afterbegin',gc410ContextHTML(p));
 return true;
}
function gc410PatchCombatFocus(){
 const p=gc410BattleParty()||gc410TravelParty();if(!p)return false;
 const screen=document.querySelector('#app .gc330Screen')||document.querySelector('#app .screen');
 const panel=screen?.querySelector('[data-gc410-party],[data-gc410-field]');
 if(!panel||!panel.isConnected)return false;
 if(p.expedition.battle){
  if(!panel.hasAttribute('data-gc410-party'))return gc410MountContext();
  const b=p.expedition.battle,actor=gc410AliveFounder(p),ready=gc410ReadyHit(p);
  const title=panel.querySelector('.gc410FightHead span');if(title)title.textContent='LIVE COMBAT • ROUND '+Math.max(1,b.round);
  const tag=panel.querySelector('.gc410FightTag');if(tag)tag.textContent=actor?'YOU ARE FIGHTING':'YOU ARE DOWN';
  const numbers=panel.querySelectorAll('.gc410Enemy');if(numbers.length!==b.enemies.length)return gc410MountContext();
  numbers.forEach((node,i)=>{
   const u=b.enemies[i],pct=clamp(u.hp/Math.max(1,u.maxHp)*100,0,100);
   const value=node.querySelector('small'),bar=node.querySelector('.gc410EnemyBar i'),hint=node.querySelector('.gc410EnemyTap');
   if(value)value.textContent=Math.round(u.hp)+' / '+Math.round(u.maxHp)+' HP';
   if(bar)bar.style.width=pct+'%';
   node.disabled=!ready||u.hp<=0;
   node.classList.toggle('gc410EnemyDead',u.hp<=0);
   if(hint)hint.textContent=u.hp<=0?'DEFEATED':ready?'TAP TO STRIKE':'WAIT';
   node.classList.toggle('gc410JustHit',GC410_LATEST_HIT?.id===u.id&&Date.now()-GC410_LATEST_HIT.at<650);
  });
  const meter=panel.querySelector('.gc410FightMeter span'),total=panel.querySelector('.gc410FightMeter b');
  if(meter)meter.textContent=!actor?'INCAPACITATED — PLAYER STRIKES DISABLED':ready?'PLAYER STRIKE READY':'STRIKE RECHARGING';
  if(total)total.textContent=Math.round(b.gc410ManualDamage||0)+' BONUS DAMAGE';
  const ultimate=panel.querySelector('.gc410Ultimate small');
  if(ultimate)ultimate.textContent=gc410UltimateState(gc260Founder(),actor);
  const log=panel.querySelector('.gc410FightLog');
  if(log)log.innerHTML=b.log.slice(-2).reverse().map(t=>'<div>'+esc(t)+'</div>').join('');
 }else{
  if(!panel.hasAttribute('data-gc410-field'))return gc410MountContext();
  const value=panel.querySelector('span');
  if(value)value.textContent='Travel '+Math.round(p.expedition.progress||0)+'% • '+(p.expedition.gc260PendingDecision?'DECISION REQUIRED':'Party traveling');
 }
 return true;
}
const _renderGC410=render;
render=function(...args){const out=_renderGC410(...args);gc410MountContext();return out};
const _gc351TargetedPatchGC410=gc351TargetedPatch;
gc351TargetedPatch=function(...args){
 const out=_gc351TargetedPatchGC410(...args);
 if(state)gc410MountContext();return out;
};
const _processActionGC410=processAction;
processAction=function(el){
 const a=el?.dataset?.action;
 if(a==='gc410PlayerStrike')return gc410HitTarget(el.dataset.party,el.dataset.id);
 if(a==='gc410GoJobs'){
  state.ui.tab=gc270IsFreeblade()?'jobs':'contracts';save();render();return true;
 }
 if(a==='gc410QuickPush'){
  const p=state?.parties?.find(x=>x.id===el.dataset.party);
  if(!p?.expedition||p.expedition.battle||p.expedition.gc260PendingDecision)return false;
  return gc199PushParty(p.id);
 }
 return _processActionGC410(el);
};
for(const [cls,desc] of Object.entries(GC410_ULTIMATE_DETAILS)){
 if(GC360_ABILITIES[cls]?.[3])GC360_ABILITIES[cls][3].description='ULTIMATE • Once per battle. '+desc;
}
const _gc360TalentHTMLGC410=gc360TalentHTML;
gc360TalentHTML=function(a){
 return _gc360TalentHTMLGC410(a)
  .replace('<div class="gc360TalentLevel">LV 20</div>','<div class="gc360TalentLevel gc410UltimateLevel">LV 20 ★</div>')
  .replace('LEVEL 1 • PASSIVE','LEVEL 1 • ACTIVE MECHANICAL PASSIVE');
};
function gc410InstallCSS(){
 if(document.getElementById('gc410Styles'))return;
 const s=document.createElement('style');s.id='gc410Styles';
 s.textContent=[
 'body.gc410CombatActive .gc380Stage{position:relative!important;height:clamp(82px,15dvh,130px)!important;min-height:82px!important;margin-bottom:5px!important}',
 'body.gc410CombatActive .gc380SceneHeading{bottom:11px!important}',
 'body.gc410CombatActive .gc380SceneHeading h2{font-size:17px!important}',
 'body.gc410CombatActive .gc380Frame,body.gc410CombatActive .gc380Info,body.gc410CombatActive .gc380ArtCredit{display:none!important}',
 '.gc410Fight{position:relative;z-index:4;margin:0 0 11px;border:1px solid #916a43;border-radius:10px;background:linear-gradient(155deg,#2c211d,#13171b 55%,#100e10);padding:12px 10px;box-shadow:0 9px 25px #0009}',
 '.gc410FightHead{display:flex;align-items:start;justify-content:space-between;gap:8px}',
 '.gc410FightHead span{font-size:9px;color:#d1aa73;letter-spacing:.13em;font-weight:700}',
 '.gc410FightHead h3{font:700 22px Georgia,serif;line-height:1.1;color:#f0dfc2;margin:4px 0 0}',
 '.gc410FightTag{font-size:8px;color:#e6bd83;background:#30271e;border:1px solid #795b3a;border-radius:5px;padding:7px 5px;max-width:86px;text-align:center;line-height:1.35}',
 '.gc410FightInstructions{font-size:11px;color:#c9b69b;line-height:1.4;margin:9px 0 11px}',
 '.gc410EnemyGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}',
 '.gc410Enemy{display:flex;flex-direction:column;align-items:center;justify-content:start;gap:5px;min-height:138px;min-width:0;padding:8px 5px;background:linear-gradient(#292421,#171717);color:#edcfb4;border:1px solid #735340;border-radius:8px;touch-action:manipulation}',
 '.gc410Enemy:not(:disabled):active{transform:scale(.96);background:#4c2e27}',
 '.gc410EnemyIcon{height:45px;display:grid;place-items:center}',
 '.gc410Enemy b{display:block;font-size:10px;text-align:center;line-height:1.2;max-width:100%;overflow-wrap:anywhere}',
 '.gc410Enemy small{font-size:9px;color:#c2a68b;font-variant-numeric:tabular-nums}',
 '.gc410EnemyBar{width:100%;height:7px;border-radius:4px;background:#443431;overflow:hidden}',
 '.gc410EnemyBar i{display:block;height:100%;background:linear-gradient(90deg,#9e4436,#df8c58);transition:width .18s linear}',
 '.gc410EnemyTap{font-size:8px;font-weight:800;letter-spacing:.06em;color:#e6b76c;margin-top:auto}',
 '.gc410Enemy:disabled:not(.gc410EnemyDead){opacity:.74}',
 '.gc410EnemyDead{filter:grayscale(1);opacity:.5!important}',
 '.gc410Enemy.gc410JustHit{border-color:#ffd386;box-shadow:0 0 0 2px #bd7b3f80,inset 0 0 13px #ae623f66}',
 '.gc410FightMeter{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:9px 0;padding:8px 5px;border-top:1px solid #755b43;border-bottom:1px solid #544233}',
 '.gc410FightMeter span{font-size:9px;color:#dfc189;font-weight:750}',
 '.gc410FightMeter b{font-size:9px;color:#c7ab85;font-variant-numeric:tabular-nums}',
 '.gc410CombatIdentity{display:flex;justify-content:space-between;align-items:center;gap:6px}',
 '.gc410CombatIdentity>div:first-child{min-width:0}.gc410CombatIdentity b,.gc410CombatIdentity span{display:block}',
 '.gc410CombatIdentity b{font-size:12px;color:#efdec7}.gc410CombatIdentity span{font-size:9px;line-height:1.3;margin-top:3px;color:#beab8d}',
 '.gc410Ultimate{border:1px solid #97713b;background:#312417;border-radius:6px;padding:8px 6px;max-width:50%;text-align:right}',
 '.gc410Ultimate strong{display:block;font-size:9px;color:#dfbe81}.gc410Ultimate small{display:block;font-size:9px;color:#e5d3af;margin-top:4px}',
 '.gc410Ultimate.spent{opacity:.65}',
 '.gc410FightLog{display:grid;gap:3px;margin-top:10px;padding:8px;background:#0e1115;border-radius:5px}',
 '.gc410FightLog>div{font-size:10px;line-height:1.35;color:#aab3b4}',
 '.gc410ClassDetails{display:block;margin-top:9px;width:100%;min-height:43px;background:#211b18;color:#d9bd94;border:1px solid #554635;border-radius:6px;font-size:9px;font-weight:700;letter-spacing:.06em}',
 '.gc410FieldBar{margin:0 0 11px;padding:11px;border:1px solid #776044;background:linear-gradient(125deg,#261f16,#13161b);border-radius:8px;display:flex;align-items:center;justify-content:space-between;gap:8px}',
 '.gc410FieldBar>div:first-child{min-width:0}.gc410FieldBar small{display:block;color:#bfa078;font-size:8px;letter-spacing:.09em}',
 '.gc410FieldBar b{display:block;font-size:13px;color:#e6d0ae;margin:4px 0;overflow-wrap:anywhere}',
 '.gc410FieldBar span{display:block;color:#a99b87;font-size:9px}',
 '.gc410FieldActions{display:grid;gap:5px;min-width:100px}.gc410FieldActions button{min-height:42px;background:#372719;border:1px solid #ab8752;color:#efd7ad;font-size:9px;font-weight:700;border-radius:5px}',
 '.gc410FieldActions b{font-size:9px;color:#e7a180}',
 '.gc410UltimateLevel{background:#513627!important;color:#f9d595!important;border-color:#c48a51!important}',
 '@media(max-width:355px){.gc410EnemyGrid{gap:4px}.gc410Enemy{padding:7px 3px;min-height:132px}.gc410Enemy b{font-size:9px}.gc410FightHead h3{font-size:19px}}',
 '@media(prefers-reduced-motion:reduce){.gc410Enemy,.gc410EnemyBar i{transition:none!important}}'
 ].join('');
 document.head.appendChild(s);
}
gc410InstallCSS();
const _auditGC410UI=audit;
audit=function(){const a=_auditGC410UI();a.playerOnlyManualEnemyTap=true;a.tapDamageRate=GC410_STRIKE_RATIO;a.liveCombatFocusAndTravelBar=true;a.level20CapstonesVisible=true;return a};
window.__BL_AUDIT=audit;
