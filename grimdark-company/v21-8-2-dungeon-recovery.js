/* Broken Lantern v21.8.2 — dungeon decision rescue and safe withdrawal.
   A locked dungeon must always present actionable choices, even if the
   mandatory popup disappears or a loaded save contains a stale room target. */
const GC382_VERSION='21.8.2';

function gc382InlineDecision(p){
 const e=p?.expedition,d=e?.gc260PendingDecision;
 if(!e||!d)return '';
 let choices='';
 if(d.type==='dungeon'){
  choices=gc340DungeonDecisionHTML(p,d);
 }else if(d.type==='casualty'&&e.battle){
  choices=gc320CasualtyDecisionHTML(p,d);
 }else if(d.type==='field'){
  choices=gc260PendingDecisionHTML(p,d);
 }else{
  try{choices=gc260PendingDecisionHTML(p,d)}catch(_){}
 }
 /* A stale or unknown decision must not leave the player without a way out. */
 const invalid=!choices||!choices.includes('data-action');
 const advice=invalid
  ?'<p>The original decision could not be reconstructed from this save. You can safely abandon the delve and resolve its consequences.</p>'
  :'<p>Choose an option to continue. You can always abandon this delve instead of remaining trapped here.</p>';
 return '<section class="gc382DecisionInline" role="region" aria-label="Required expedition decision">'+
  '<div class="gc382DecisionHeader"><span>DECISION REQUIRED • SIMULATION PAUSED</span><b>Make your choice to continue</b></div>'+
  advice+(invalid?'<div class="gc382Orphan">The saved decision is unavailable.</div>':choices)+
  '<button class="btn dangerBtn gc382Leave" data-action="gc382DungeonWithdraw" data-party="'+esc(p.id)+'">ABANDON DELVE &amp; RETURN TO TOWN</button>'+
  '<small>Withdrawing forfeits further exploration. Carried loot is recovered if someone survives. Existing wounds, deaths, and casualty rules still apply.</small>'+
 '</section>';
}
const _gc340DungeonRunHTMLGC382=gc340DungeonRunHTML;
gc340DungeonRunHTML=function(p){
 const original=_gc340DungeonRunHTMLGC382(p);
 const pending=p?.expedition?.gc260PendingDecision;
 if(!pending)return original;
 const choices=gc382InlineDecision(p);
 if(!choices)return original;
 const notice='<div class="notice danger">A dungeon decision is waiting. The entire simulation is hard-locked.</div>';
 if(original.includes(notice))return original.replace(notice,choices);
 /* Combat or casualty decisions previously showed only a battlefield panel. */
 const anchor='<div class="actions"><button class="btn ghost" data-action="gc330FullLog"';
 if(original.includes(anchor))return original.replace(anchor,choices+anchor);
 return choices+original;
};

/* Remount a decision's choices in the dungeon interface when the page updates.
   The global lock remains mandatory; ordinary unrelated actions stay blocked. */
function gc382DungeonWithdraw(pid){
 const p=state?.parties?.find(p=>p.id===pid),e=p?.expedition,run=p?.gc340DungeonRun;
 if(!p||!e||!run||!gc260FounderInParty(p))return false;
 if(!e.gc260PendingDecision)return false;
 if(e.gc382Withdrawing)return false;
 e.gc382Withdrawing=true;
 const dungeon=gc340DungeonById(run.dungeonId);
 if(!dungeon){e.gc382Withdrawing=false;return toast('Dungeon data is missing. Your save has not been changed.')}
 e.events=e.events||[];
 e.events.push('The expedition was abandoned on a mandatory decision. The party attempts an emergency withdrawal.');
 e.gc260PendingDecision=null;
 delete e.gc320ResumeMode;
 gc321ClearStaleLock();
 const m=document.getElementById('modal');if(m)m.classList.remove('show');
 if(e.battle){
  /* resolveBattle owns the mortality and wound calculation for downed units.
     Never call gc340ExitDungeon directly while a battle exists. */
  return resolveBattle(p,false);
 }
 return gc340ExitDungeon(p,'emergency withdrawal before resolving a dungeon decision');
}

/* Other retreat buttons must not bypass the downed-character mortality system. */
const _gc320RetreatPartyGC382=gc320RetreatParty;
gc320RetreatParty=function(pid){
 const p=state?.parties?.find(x=>x.id===pid),e=p?.expedition;
 if(e?.gc340Dungeon&&e.battle&&!e.gc260PendingDecision){
  e.events.push('The party withdrew from dungeon combat. Injuries and mortality are resolved.');
  return resolveBattle(p,false);
 }
 return _gc320RetreatPartyGC382(pid);
};
const _processActionGC382=processAction;
processAction=function(el){
 if(el?.dataset?.action==='gc382DungeonWithdraw')return gc382DungeonWithdraw(el.dataset.party);
 return _processActionGC382(el);
};

/* Keep the real map inert while any decision is waiting instead of showing
   apparently clickable destinations that cannot be chosen. */
const _gc340DungeonMapHTMLGC382=gc340DungeonMapHTML;
gc340DungeonMapHTML=function(d,run){
 const html=_gc340DungeonMapHTMLGC382(d,run),p=gc340FounderInDungeon();
 if(!p?.expedition?.gc260PendingDecision)return html;
 return html.replace(/(<button\b[^>]*\bdata-action="gc340DungeonRoom"[^>]*)(>)/g,(all,before,end)=>{
  return before.includes('disabled')?all:before+' disabled aria-disabled="true"'+end;
 });
};
function gc382InstallStyles(){
 if(document.getElementById('gc382Styles'))return;
 const st=document.createElement('style');st.id='gc382Styles';
 st.textContent=[
 '.gc382DecisionInline{margin:12px 0;padding:13px 11px 15px;background:linear-gradient(180deg,#211916,#100f12);border:2px solid #bf9161;border-radius:10px;box-shadow:0 0 0 2px #120e0c,0 5px 24px #0007}',
 '.gc382DecisionHeader{margin:0 0 9px}.gc382DecisionHeader span{display:block;font-size:9px;color:#dfac73;letter-spacing:.13em}.gc382DecisionHeader b{display:block;font-family:Georgia,serif;font-size:19px;color:#f0d3b2;margin-top:5px}',
 '.gc382DecisionInline>p{font-size:12px;line-height:1.5;color:#ddc6ad;margin:7px 0 12px}',
 '.gc382DecisionInline .gc320DecisionModal{margin:0;border:0;background:transparent;box-shadow:none}',
 '.gc382DecisionInline .gc260DecisionChoices{display:grid;grid-template-columns:1fr;gap:8px}',
 '.gc382DecisionInline .gc260DecisionChoices button{min-height:64px!important;text-align:left;border:1px solid #94734e;border-radius:7px;color:#ead1b0;background:#2a211b;padding:11px 13px}',
 '.gc382DecisionInline .gc260DecisionChoices button b{display:block;font-size:12px;color:#f0d4ad}',
 '.gc382DecisionInline .gc260DecisionChoices button small{display:block;line-height:1.5;font-size:10px;color:#c2ac95;margin-top:5px}',
 '.gc382DecisionInline>.gc382Leave{display:block;width:100%;min-height:51px;margin-top:13px;border-color:#9d4a3e}',
 '.gc382DecisionInline>small{display:block;margin:8px 0 0;font-size:10px;line-height:1.5;color:#a79482}',
 '.gc382Orphan{padding:12px;border:1px solid #ab6854;color:#ebc4aa;font-size:11px}'
 ].join('');
 document.head.appendChild(st);
}
gc382InstallStyles();
const _auditGC382=audit;
audit=function(){
 const out=_auditGC382();
 out.v382DungeonRecovery=GC382_VERSION;
 out.pendingDungeonChoicesVisibleInline=true;
 out.dungeonChoiceActionsAllowedThroughHardLock=true;
 out.emergencyWithdrawalAvailable=true;
 out.emergencyWithdrawalPreservesMortality=true;
 out.anchoredFlameAnimations=true;
 return out;
};
window.__BL_AUDIT=audit;
