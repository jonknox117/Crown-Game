/* Grim Company v21.5.0 — motion language & tactile feedback.
   Lightweight CSS/SVG-style presentation only: no particle pools, no render loops. */
const GC350_VERSION='21.5.0';
const GC350_STATS={tapPulses:0,pressedTargets:0,activityVisuals:0};
let GC350_TAP_NODE=null;

function gc350Family(type=''){
 if(['surveyRuins','studyContract','huntThreat'].includes(type))return'scout';
 if(['lucrativeJob','helpLocals','workContacts'].includes(type))return'odd';
 if(['mentor','drillParty','personalDrill'].includes(type))return'train';
 if(['visitWounded','helpInfirmary','treatment'].includes(type))return'recover';
 return'neutral';
}
function gc350VizHTML(type){
 const family=gc350Family(type);
 const label=family==='scout'?'SCOUTING':family==='odd'?'WORKING':family==='train'?'TRAINING':family==='recover'?'RECOVERING':'FOCUSED';
 return `<div class="gc350ActivityViz ${family}" data-gc350-viz="${family}" aria-hidden="true"><div class="gc350VizStage"><i></i><b></b><em></em></div><span>${label}</span></div>`;
}

/* Add an activity vignette directly to the existing tiny focus host. */
gc340ActivityHTML=function(){
 const pr=gc340Presence(),a=pr?.activity;if(!a)return'';
 const pct=clamp((1-a.remainingDays/a.durationDays)*100,0,100);
 GC350_STATS.activityVisuals++;
 return`<div class="gc340Activity gc350Activity" data-focus-type="${esc(a.type||'')}">${gc350VizHTML(a.type)}<span>FOCUSED ACTIVITY</span><b>${esc(a.label)}</b><small>${Math.max(0,a.remainingDays*24).toFixed(1)}h remaining • normal company simulation continues</small><i class="gc350ProgressShell"><em data-gc340-activitybar style="width:${pct}%"></em></i><button class="btn ghost" data-action="gc340CancelFocus">Cancel</button></div>`;
};

function gc350EnsureTapNode(){
 if(GC350_TAP_NODE?.isConnected)return GC350_TAP_NODE;
 const old=document.getElementById('gc350TapPulse');if(old){GC350_TAP_NODE=old;return old}
 const n=document.createElement('div');n.id='gc350TapPulse';n.setAttribute('aria-hidden','true');document.body.appendChild(n);GC350_TAP_NODE=n;return n;
}
function gc350TapFeedback(ev){
 const t=ev.target?.closest?.('button,.btn,[data-action],[role="button"]');
 if(!t||t.disabled||t.getAttribute('aria-disabled')==='true')return;
 const n=gc350EnsureTapNode(),x=Number(ev.clientX),y=Number(ev.clientY);
 if(Number.isFinite(x)&&Number.isFinite(y)){n.style.left=x+'px';n.style.top=y+'px'}
 n.classList.remove('fire');void n.offsetWidth;n.classList.add('fire');
 t.classList.add('gc350Pressed');setTimeout(()=>t.classList.remove('gc350Pressed'),140);
 GC350_STATS.tapPulses++;GC350_STATS.pressedTargets++;
}
document.addEventListener('pointerdown',gc350TapFeedback,{passive:true});

function gc350SyncMotionState(){
 const running=!!state&&gc199Mode()!=='paused'&&!document.hidden;
 document.body.classList.toggle('gc350Running',running);
 document.body.classList.toggle('gc350MotionPaused',document.hidden);
}
const _gc199UpdateClockGC350=gc199UpdateClock;
gc199UpdateClock=function(){
 const out=_gc199UpdateClockGC350();
 gc350SyncMotionState();
 return out;
};
document.addEventListener('visibilitychange',gc350SyncMotionState);
requestAnimationFrame(()=>{gc350EnsureTapNode();gc350SyncMotionState()});

function gc350InstallStyles(){
 if(document.getElementById('gc350Styles'))return;
 const st=document.createElement('style');st.id='gc350Styles';
 st.textContent=`
 :root{--gc350-gold:#c9a667;--gc350-warm:#9f7650;--gc350-soft:#d8c9ae}
 button,.btn,[data-action]{-webkit-tap-highlight-color:transparent;transform:translateZ(0)}
 button:active,.btn:active,[data-action]:active,.gc350Pressed{transform:translateY(1px) scale(.985)!important;filter:brightness(1.08)}
 .gc330NavBtn:active,.gc340Place:active{transform:scale(.965)!important}
 #gc350TapPulse{position:fixed;z-index:99999;pointer-events:none;width:12px;height:12px;margin:-6px 0 0 -6px;border:1px solid rgba(223,190,126,.65);border-radius:50%;opacity:0;transform:scale(.2);box-shadow:0 0 0 0 rgba(202,164,96,.24)}
 #gc350TapPulse.fire{animation:gc350Tap .36s ease-out}
 @keyframes gc350Tap{0%{opacity:.85;transform:scale(.25);box-shadow:0 0 0 0 rgba(202,164,96,.28)}100%{opacity:0;transform:scale(2.6);box-shadow:0 0 0 10px rgba(202,164,96,0)}}

 /* Moving progress has a restrained leading glow + travelling highlight. */
 [data-gc199-progress],[data-gc331-progress],[data-gc340-activitybar],[data-gc199-daybar]{position:relative;overflow:visible;background-image:linear-gradient(90deg,rgba(255,255,255,.02),rgba(255,255,255,.15),rgba(255,255,255,.02));background-size:38px 100%}
 body.gc350Running [data-gc199-progress],body.gc350Running [data-gc331-progress],body.gc350Running [data-gc340-activitybar],body.gc350Running [data-gc199-daybar]{animation:gc350BarFlow 1.15s linear infinite}
 body.gc350Running [data-gc199-progress]::after,body.gc350Running [data-gc331-progress]::after,body.gc350Running [data-gc340-activitybar]::after{content:"";position:absolute;right:-2px;top:50%;width:5px;height:5px;border-radius:50%;background:#d8b16d;box-shadow:0 0 7px rgba(211,166,92,.65);transform:translateY(-50%);animation:gc350LeadPulse .8s ease-in-out infinite alternate}
 @keyframes gc350BarFlow{from{background-position:-38px 0}to{background-position:38px 0}}
 @keyframes gc350LeadPulse{from{opacity:.45;transform:translateY(-50%) scale(.8)}to{opacity:1;transform:translateY(-50%) scale(1.25)}}

 /* Active town locations communicate what kind of work the Founder is doing. */
 .gc340Place{position:relative;overflow:hidden}
 .gc340Place.active::after{position:absolute;right:6px;top:5px;width:20px;height:20px;display:grid;place-items:center;border-radius:50%;font-size:12px;color:#d1ad6d;background:rgba(21,18,13,.72);border:1px solid rgba(201,166,103,.18)}
 .gc340Place.scout.active::after{content:"⌖";animation:gc350Compass 2.2s ease-in-out infinite}
 .gc340Place.odd.active::after{content:"¤";animation:gc350Coin 1.5s ease-in-out infinite}
 .gc340Place.train.active::after{content:"⚔";animation:gc350Strike 1.3s ease-in-out infinite}
 .gc340Place.recover.active::after{content:"✚";animation:gc350Heal 1.8s ease-in-out infinite}
 .gc340Place.hall.active::after{content:"◆";animation:gc350Hearth 2.4s ease-in-out infinite}
 @keyframes gc350Compass{0%,100%{transform:rotate(-16deg)}50%{transform:rotate(20deg)}}
 @keyframes gc350Coin{0%,100%{transform:translateY(0) rotateY(0)}50%{transform:translateY(-3px) rotateY(180deg)}}
 @keyframes gc350Strike{0%,70%,100%{transform:rotate(0) scale(1)}82%{transform:rotate(-12deg) scale(1.15)}90%{transform:rotate(10deg) scale(1.06)}}
 @keyframes gc350Heal{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.15);box-shadow:0 0 10px rgba(129,164,109,.35)}}
 @keyframes gc350Hearth{0%,100%{opacity:.55}50%{opacity:1;text-shadow:0 0 8px rgba(209,164,88,.45)}}

 /* Focus choices get a compact activity glyph without adding DOM. */
 .gc340FocusAction{overflow:hidden;padding-left:34px!important}
 .gc340FocusAction::before{position:absolute;left:8px;top:10px;width:18px;height:18px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(196,160,96,.16);background:#12110f;color:#b79861;font-size:10px}
 .gc340FocusAction[data-type="surveyRuins"]::before,.gc340FocusAction[data-type="studyContract"]::before,.gc340FocusAction[data-type="huntThreat"]::before{content:"⌖"}
 .gc340FocusAction[data-type="lucrativeJob"]::before,.gc340FocusAction[data-type="helpLocals"]::before,.gc340FocusAction[data-type="workContacts"]::before{content:"¤"}
 .gc340FocusAction[data-type="mentor"]::before,.gc340FocusAction[data-type="drillParty"]::before,.gc340FocusAction[data-type="personalDrill"]::before{content:"⚔"}
 .gc340FocusAction[data-type="visitWounded"]::before,.gc340FocusAction[data-type="helpInfirmary"]::before,.gc340FocusAction[data-type="treatment"]::before{content:"✚"}
 .gc340FocusAction:active::before{animation:gc350ChoicePop .28s ease-out}
 @keyframes gc350ChoicePop{0%{transform:scale(.7);opacity:.45}55%{transform:scale(1.25);opacity:1}100%{transform:scale(1)}}

 /* One small activity scene. All motion uses transform/opacity only. */
 .gc350ActivityViz{height:62px;margin:0 0 8px;border:1px solid rgba(255,255,255,.055);border-radius:6px;background:linear-gradient(180deg,#171612,#11100e);position:relative;overflow:hidden}
 .gc350ActivityViz>span{position:absolute;left:7px;bottom:5px;font-size:6px;letter-spacing:.13em;color:#8c7d68}
 .gc350VizStage{position:absolute;inset:0}
 .gc350VizStage i,.gc350VizStage b,.gc350VizStage em{position:absolute;display:block;font-style:normal}
 .gc350ActivityViz.scout .gc350VizStage i{left:50%;top:8px;width:38px;height:38px;margin-left:-19px;border:1px solid #6f6657;border-radius:50%}
 .gc350ActivityViz.scout .gc350VizStage b{left:50%;top:17px;width:2px;height:21px;background:#c69e5e;transform-origin:50% 80%;animation:gc350Needle 2s ease-in-out infinite}
 .gc350ActivityViz.scout .gc350VizStage em{left:12%;right:12%;bottom:16px;height:1px;background:linear-gradient(90deg,transparent,#4e493f,transparent)}
 @keyframes gc350Needle{0%,100%{transform:rotate(-45deg)}50%{transform:rotate(42deg)}}

 .gc350ActivityViz.odd .gc350VizStage i,.gc350ActivityViz.odd .gc350VizStage b,.gc350ActivityViz.odd .gc350VizStage em{bottom:19px;width:15px;height:15px;border:1px solid #9d7c48;border-radius:50%;background:#211b12}
 .gc350ActivityViz.odd .gc350VizStage i{left:34%;animation:gc350CoinStack 1.3s ease-in-out infinite}
 .gc350ActivityViz.odd .gc350VizStage b{left:47%;animation:gc350CoinStack 1.3s .16s ease-in-out infinite}
 .gc350ActivityViz.odd .gc350VizStage em{left:60%;animation:gc350CoinStack 1.3s .32s ease-in-out infinite}
 @keyframes gc350CoinStack{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px);border-color:#cba55f}}

 .gc350ActivityViz.train .gc350VizStage i,.gc350ActivityViz.train .gc350VizStage b{left:50%;top:10px;width:2px;height:38px;background:#9f927d;transform-origin:50% 80%}
 .gc350ActivityViz.train .gc350VizStage i{transform:rotate(-42deg);animation:gc350BladeA 1.25s ease-in-out infinite}
 .gc350ActivityViz.train .gc350VizStage b{transform:rotate(42deg);animation:gc350BladeB 1.25s ease-in-out infinite}
 .gc350ActivityViz.train .gc350VizStage em{left:50%;top:29px;width:5px;height:5px;border-radius:50%;background:#d5b16e;box-shadow:0 0 8px rgba(210,169,100,.55);animation:gc350Spark 1.25s ease-in-out infinite}
 @keyframes gc350BladeA{0%,100%{transform:rotate(-42deg)}50%{transform:rotate(-28deg)}}
 @keyframes gc350BladeB{0%,100%{transform:rotate(42deg)}50%{transform:rotate(28deg)}}
 @keyframes gc350Spark{0%,40%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1.35)}}

 .gc350ActivityViz.recover .gc350VizStage i{left:50%;top:9px;width:30px;height:30px;margin-left:-15px;border:1px solid rgba(120,154,103,.36);border-radius:50%;animation:gc350RecoveryRing 1.8s ease-in-out infinite}
 .gc350ActivityViz.recover .gc350VizStage b::before,.gc350ActivityViz.recover .gc350VizStage b::after{content:"";position:absolute;background:#8aa471;border-radius:1px}
 .gc350ActivityViz.recover .gc350VizStage b{left:50%;top:15px}
 .gc350ActivityViz.recover .gc350VizStage b::before{width:4px;height:18px;left:-2px}.gc350ActivityViz.recover .gc350VizStage b::after{width:18px;height:4px;left:-9px;top:7px}
 .gc350ActivityViz.recover .gc350VizStage em{left:18%;right:18%;bottom:14px;height:2px;background:linear-gradient(90deg,transparent,#72905f 30%,#a0b68d 50%,#72905f 70%,transparent);animation:gc350Heartline 1.3s ease-in-out infinite}
 @keyframes gc350RecoveryRing{0%,100%{transform:scale(.88);opacity:.4}50%{transform:scale(1.15);opacity:1}}
 @keyframes gc350Heartline{0%,100%{opacity:.3;transform:scaleX(.85)}50%{opacity:1;transform:scaleX(1)}}

 /* Expedition motion gets slightly stronger when the party is pushing. */
 .gc200Travel{position:relative;overflow:hidden}
 body.gc350Running .gc200Travel::after{content:"";position:absolute;left:-35%;bottom:5px;width:28%;height:1px;background:linear-gradient(90deg,transparent,rgba(215,182,122,.34),transparent);animation:gc350RoadSweep 2.6s linear infinite;pointer-events:none}
 body.gc350Running .gc200Travel.gc201Pushing::after{height:2px;width:42%;animation-duration:1.05s;background:linear-gradient(90deg,transparent,rgba(225,179,95,.6),transparent)}
 @keyframes gc350RoadSweep{to{left:115%}}

 body.gc343SafeFast .gc340Place.active::after,body.gc343SafeFast .gc350ActivityViz *,body.gc343SafeFast .gc340FocusAction::before{animation-duration:3s!important}
 body.gc343SafeFast #gc350TapPulse.fire{animation-duration:.25s!important}
 body.gc350MotionPaused *{animation-play-state:paused!important}
 @media (prefers-reduced-motion:reduce){
  #gc350TapPulse,.gc340Place.active::after,.gc350ActivityViz *,[data-gc199-progress],[data-gc331-progress],[data-gc340-activitybar],[data-gc199-daybar],.gc200Travel::after{animation:none!important;transition:none!important}
 }
 `;
 document.head.appendChild(st);
}
gc350InstallStyles();

const _auditGC350=audit;
audit=function(){
 const out=_auditGC350();
 out.v350MotionPolish=GC350_VERSION;
 out.universalTouchFeedback=true;
 out.singleReusableTapPulse=true;
 out.progressBarsHaveLiveMotion=true;
 out.focusActionsHaveActivityGlyphs=true;
 out.focusedActivitiesHaveAnimatedVignettes=true;
 out.townLocationsHaveAmbientMotion=true;
 out.pushTravelHasMotionFeedback=true;
 out.motionPausesWhenHidden=true;
 out.safeFastReducesMotionCost=true;
 return out;
};
window.__BL_AUDIT=audit;
window.__GC350_STATS=()=>({...GC350_STATS});

window.__GC350_TEST=function(){
 const old=state,oldForce=window.__GC345_FORCE_PHONE;
 try{
  window.__GC345_FORCE_PHONE=true;
  state=createState('Motion Test','veyric');state.regions.veyric.hq.established=true;gc270Progression().phase='company';
  const f=gc260CreateFounderRecord('veyric',{name:'Motion Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  f.status='Ready';f.lvl=6;state.ui.tab='you';gc340Presence().place='train';f.dailyOrder='Train';state.timeSystem.gc199Mode='play';
  render();gc199MountClock();gc350SyncMotionState();
  gc340StartFocused('personalDrill');
  if(typeof gc344RefreshFocusHost==='function')gc344RefreshFocusHost();
  const viz=document.querySelector('[data-gc350-viz="train"]');
  const bar=document.querySelector('[data-gc340-activitybar]');
  const activePlace=document.querySelector('.gc340Place.train.active');
  const actionGlyph=document.querySelector('.gc340FocusAction[data-type="personalDrill"]')||document.querySelector('.gc340FocusAction[data-type]');
  const pulse=gc350EnsureTapNode();
  const onePulse=document.querySelectorAll('#gc350TapPulse').length===1;
  const running=document.body.classList.contains('gc350Running');
  const barAnim=bar?getComputedStyle(bar).animationName!=='none':false;
  gc340CancelFocused();if(typeof gc344RefreshFocusHost==='function')gc344RefreshFocusHost();
  const btn=document.querySelector('.gc340FocusAction[data-type="personalDrill"]');
  const before=GC350_STATS.tapPulses;
  if(btn){
   const rect=btn.getBoundingClientRect();
   btn.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:rect.left+5,clientY:rect.top+5,pointerType:'touch'}));
  }
  const tapWorks=GC350_STATS.tapPulses>before&&pulse.classList.contains('fire');
  const noDuplicates=document.querySelectorAll('#gc350TapPulse').length===1;
  const integrity=gc342StateIntegrity().ok;
  return{ok:!!(viz&&bar&&activePlace&&actionGlyph&&onePulse&&running&&barAnim&&tapWorks&&noDuplicates&&integrity),viz:!!viz,bar:!!bar,activePlace:!!activePlace,actionGlyph:!!actionGlyph,onePulse,running,barAnim,tapWorks,noDuplicates,integrity};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{
  state=old;window.__GC345_FORCE_PHONE=oldForce;
  try{document.getElementById('modal')?.classList.remove('show')}catch(_){}
 }
};