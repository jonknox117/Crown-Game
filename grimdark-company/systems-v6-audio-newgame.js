(function(){
'use strict';

if(!state.settings)state.settings={};
if(typeof state.settings.sound!=='boolean')state.settings.sound=true;
if(typeof state.settings.music!=='boolean')state.settings.music=true;

// ---------------------------------------------------------------------------
// IOS-SAFE AUDIO ENGINE
// AudioContext is created/resumed only from a genuine user gesture. Every SFX
// and the music bed share that unlocked context so iOS cannot silently strand
// sounds in a suspended context.
// ---------------------------------------------------------------------------
let ctx=null,master=null,sfxBus=null,musicBus=null,musicTimer=null,musicStep=0;
let unlocked=false;

function ensureGraph(){
 const AC=window.AudioContext||window.webkitAudioContext;
 if(!AC)return false;
 if(!ctx){
  ctx=new AC();
  master=ctx.createGain();sfxBus=ctx.createGain();musicBus=ctx.createGain();
  master.gain.value=.72;sfxBus.gain.value=.72;musicBus.gain.value=.42;
  sfxBus.connect(master);musicBus.connect(master);master.connect(ctx.destination);
 }
 return true;
}

async function unlockAudio(showToast=false){
 if(!ensureGraph())return false;
 try{if(ctx.state!=='running')await ctx.resume()}catch(e){}
 unlocked=ctx.state==='running';
 if(unlocked){
  if(state.settings.music)startMusic();
  updateAudioButtons();
  if(showToast){playSfx('unlock');toast('Audio enabled.');}
 }
 return unlocked;
}
window.blUnlockAudio=unlockAudio;

function envTone(freq,dur=.09,type='triangle',gain=.08,delay=0,endFreq=null,bus=sfxBus){
 if(!unlocked||!ctx||!bus)return;
 const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(Math.max(35,freq),t);
 if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(35,endFreq),t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
 o.connect(g);g.connect(bus);o.start(t);o.stop(t+dur+.04);
}
function burst(dur=.055,gain=.055,delay=0){
 if(!unlocked||!ctx||!sfxBus)return;
 const n=Math.max(1,Math.floor(ctx.sampleRate*dur)),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const src=ctx.createBufferSource(),g=ctx.createGain(),f=ctx.createBiquadFilter();src.buffer=b;f.type='lowpass';f.frequency.value=1200;g.gain.value=gain;src.connect(f);f.connect(g);g.connect(sfxBus);src.start(ctx.currentTime+delay);
}

function playSfx(name){
 if(!state.settings.sound)return;
 if(!unlocked){unlockAudio(false);return;}
 switch(name){
  case 'tap':envTone(185,.035,'triangle',.045,0,150);break;
  case 'nav':envTone(250,.05,'sine',.05);envTone(335,.055,'sine',.038,.035);break;
  case 'hire':envTone(390,.06,'triangle',.065);envTone(590,.08,'triangle',.055,.05);break;
  case 'coin':envTone(720,.045,'sine',.07);envTone(1030,.065,'sine',.05,.045);break;
  case 'depart':envTone(165,.10,'sawtooth',.045,0,235);envTone(105,.14,'triangle',.035,.06,82);break;
  case 'hit':burst(.06,.065);envTone(82,.075,'square',.035,0,58);break;
  case 'danger':envTone(125,.15,'sawtooth',.045);envTone(98,.18,'sawtooth',.04,.12);break;
  case 'cache':burst(.09,.075);envTone(115,.10,'triangle',.05,0,70);break;
  case 'loot':envTone(410,.06,'sine',.06);envTone(615,.075,'sine',.055,.055);envTone(820,.10,'sine',.05,.12);break;
  case 'success':envTone(294,.09,'triangle',.06);envTone(440,.11,'triangle',.06,.07);envTone(587,.15,'triangle',.05,.14);break;
  case 'fail':envTone(180,.13,'sawtooth',.05,0,118);envTone(105,.22,'triangle',.04,.1,70);break;
  case 'blocked':envTone(88,.07,'square',.035);break;
  case 'heal':envTone(330,.09,'sine',.055);envTone(494,.12,'sine',.05,.07);break;
  case 'rest':envTone(196,.16,'sine',.035);envTone(147,.25,'sine',.028,.11);break;
  case 'upgrade':envTone(220,.06,'triangle',.055);envTone(330,.08,'triangle',.055,.05);envTone(494,.12,'triangle',.05,.1);break;
  case 'tactic':envTone(150,.055,'square',.04);envTone(225,.07,'triangle',.04,.045);break;
  case 'level':envTone(330,.07,'triangle',.06);envTone(440,.08,'triangle',.06,.06);envTone(660,.13,'sine',.055,.13);break;
  case 'unlock':envTone(440,.07,'sine',.06);envTone(660,.1,'sine',.055,.07);break;
 }
}
window.blAudioSfx=playSfx;
window.blSound=playSfx;
window.qfx=playSfx;

// Procedural, lightweight dark-fantasy music. No external assets are required,
// so the phone build remains a single file and works offline after loading.
const chords=[
 [73.42,110.00,146.83], // D2 A2 D3
 [65.41,98.00,130.81],  // C2 G2 C3
 [58.27,87.31,116.54],  // Bb1 F2 Bb2
 [65.41,98.00,146.83]   // C2 G2 D3
];
const melody=[293.66,261.63,220.00,246.94,293.66,349.23,293.66,246.94];
function musicMeasure(){
 if(!unlocked||!state.settings.music||!ctx||ctx.state!=='running')return;
 const notes=chords[musicStep%chords.length];
 notes.forEach((f,i)=>envTone(f,4.3,i===0?'sine':'triangle',i===0?.032:.018,i*.035,f*.995,musicBus));
 envTone(melody[musicStep%melody.length],1.45,'sine',.017,.55,null,musicBus);
 if(musicStep%2===1)envTone(melody[(musicStep+3)%melody.length]/2,1.8,'triangle',.012,2.25,null,musicBus);
 musicStep++;
}
function startMusic(){
 if(!unlocked||!state.settings.music)return;
 if(musicTimer)return;
 musicMeasure();musicTimer=setInterval(musicMeasure,4300);
}
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
window.blStartMusic=startMusic;window.blStopMusic=stopMusic;

document.addEventListener('visibilitychange',()=>{
 if(document.visibilityState==='hidden')stopMusic();
 else if(unlocked&&state.settings.music){ctx?.resume?.().then(()=>startMusic()).catch(()=>{})}
});

// iOS requires the resume call to happen inside a gesture. Capture phase makes
// this run before the game's button handlers on the first tap.
let firstGesture=true;
async function gestureUnlock(){
 if(!firstGesture&&unlocked)return;
 firstGesture=false;
 const was=unlocked;await unlockAudio(false);
 if(!was&&unlocked)playSfx('unlock');
}
document.addEventListener('pointerdown',gestureUnlock,{capture:true,passive:true});
document.addEventListener('touchend',gestureUnlock,{capture:true,passive:true});
document.addEventListener('click',gestureUnlock,{capture:true,passive:true});

// ---------------------------------------------------------------------------
// AUDIO UI
// ---------------------------------------------------------------------------
function audioPanel(){
 modal(`<div class="sheetHead"><div><h3>Audio</h3><div class="small muted">iPhone audio begins after a user tap.</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="card audioStatus"><div><b>Audio engine</b><span class="statusChip ${unlocked?'ready':'hurt'}">${unlocked?'ACTIVE':'LOCKED'}</span></div><div class="small muted">${unlocked?'WebAudio is running.':'Tap Enable Audio below. iOS will not allow sound before a gesture.'}</div></div>
 <button class="card choice audioChoice" id="toggleSfx"><div class="statline"><b>Sound Effects</b><span>${state.settings.sound?'ON':'OFF'}</span></div><div class="small muted">Buttons, combat, loot, healing, upgrades and reports.</div></button>
 <button class="card choice audioChoice" id="toggleMusic"><div class="statline"><b>Background Music</b><span>${state.settings.music?'ON':'OFF'}</span></div><div class="small muted">Low-volume procedural dark-fantasy ambience.</div></button>
 <div class="actions"><button class="btn primary" id="enableAudio">${unlocked?'Test Sound':'Enable Audio'}</button></div>`);
 document.getElementById('toggleSfx').onclick=async()=>{state.settings.sound=!state.settings.sound;save();if(state.settings.sound){await unlockAudio(false);playSfx('success')}audioPanel()};
 document.getElementById('toggleMusic').onclick=async()=>{state.settings.music=!state.settings.music;save();if(state.settings.music){await unlockAudio(false);startMusic()}else stopMusic();audioPanel()};
 document.getElementById('enableAudio').onclick=async()=>{await unlockAudio(true);if(unlocked)playSfx('success');audioPanel()};
}
window.blAudioPanel=audioPanel;

function updateAudioButtons(){
 document.querySelectorAll('.soundToggle').forEach(b=>{b.textContent=!state.settings.sound?'🔇':unlocked?'🔊':'🔈';b.title=unlocked?'Audio settings':'Tap to enable audio';b.setAttribute('aria-label','Audio settings')});
 document.querySelectorAll('.musicToggle').forEach(b=>{b.textContent=state.settings.music?'♫':'♪';b.classList.toggle('mutedAudio',!state.settings.music)});
}

function injectAudioUI(){
 const util=document.querySelector('.utilityButtons');if(!util)return;
 const snd=util.querySelector('.soundToggle');
 if(snd&&!snd.dataset.v6){snd.dataset.v6='1';snd.onclick=async e=>{e.stopPropagation();await unlockAudio(false);audioPanel()}}
 if(!util.querySelector('.musicToggle')){
  const m=document.createElement('button');m.className='soundToggle musicToggle';m.title='Music';m.onclick=async e=>{e.stopPropagation();await unlockAudio(false);state.settings.music=!state.settings.music;save();if(state.settings.music)startMusic();else stopMusic();updateAudioButtons();playSfx('tap')};util.appendChild(m);
 }
 if(!util.querySelector('.newGameToggle')){
  const n=document.createElement('button');n.className='soundToggle newGameToggle';n.textContent='↻';n.title='New Game';n.setAttribute('aria-label','Start new game');n.onclick=e=>{e.stopPropagation();newGamePrompt()};util.appendChild(n);
 }
 updateAudioButtons();
}

// ---------------------------------------------------------------------------
// NEW GAME / SAVE RESET
// ---------------------------------------------------------------------------
function newGamePrompt(){
 modal(`<div class="sheetHead"><div><h3>Start a New Company?</h3><div class="small muted">This is the permanent reset control.</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="card danger"><b>Your current company will be replaced.</b><div class="small">Roster, loot, HQ upgrades, contracts, relics, renown and day progression will reset to Day 1.</div></div>
 <div class="card small">If you may want this company later, use the 💾 button and copy a backup before resetting.</div>
 <div class="actions"><button class="btn" onclick="closeModal()">Keep Current Game</button><button class="btn dangerBtn" id="newGameSecond">Continue</button></div>`);
 document.getElementById('newGameSecond').onclick=()=>{
  modal(`<div class="sheetHead"><h3>Final Confirmation</h3><button class="x" onclick="closeModal()">✕</button></div><p>This cannot be undone unless you copied a backup.</p><div class="actions"><button class="btn" onclick="closeModal()">Cancel</button><button class="btn dangerBtn" id="confirmNewGame">Erase & Start Day 1</button></div>`);
  document.getElementById('confirmNewGame').onclick=resetGame;
 };
}
function resetGame(){
 stopMusic();
 state=null;
 state=initial();
 // Let existing migrations rebuild class/culture/HQ fields on reload. save() is
 // already the hardened version, so the fresh state is mirrored to IndexedDB.
 save();
 try{sessionStorage.setItem('blJustReset','1')}catch(e){}
 playSfx('fail');
 setTimeout(()=>location.reload(),180);
}
window.blNewGame=newGamePrompt;

try{if(sessionStorage.getItem('blJustReset')){sessionStorage.removeItem('blJustReset');setTimeout(()=>toast('New company started. Day 1.'),500)}}catch(e){}

// Re-inject controls after every render because the top bar is rebuilt.
const oldRenderV6=render;
render=function(){oldRenderV6();injectAudioUI()};window.render=render;

// Additional reliable tap feedback through the new unlocked engine.
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.classList.contains('soundToggle'))return;if(unlocked)playSfx(b.disabled?'blocked':'tap')},{passive:true});

const css=document.createElement('style');css.textContent=`
.musicToggle,.newGameToggle{min-width:34px}.musicToggle.mutedAudio{opacity:.48}.audioStatus>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:8px}.audioChoice{width:100%;text-align:left;margin-top:7px}.dangerBtn{background:#702d27!important;border-color:#a04a40!important;color:#fff!important}.utilityButtons{flex-wrap:nowrap}.utilityButtons .soundToggle{flex:0 0 auto}
@media(max-width:390px){.utilityButtons .soundToggle{width:34px;padding-left:0;padding-right:0}.dayMini{font-size:9px}}
`;document.head.appendChild(css);

state.version=Math.max(state.version||1,6);save();injectAudioUI();
})();
