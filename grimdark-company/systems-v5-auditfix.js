(function(){
'use strict';

// Final audit cleanup: descriptions match unconditional math exactly.
if(window.blRules?.TRAIT_RULES){
 const T=window.blRules.TRAIT_RULES;
 if(T['Night Eyes'])T['Night Eyes'].desc='+3 Scout and +2 Sneak.';
 if(T['Superstitious'])T['Superstitious'].desc='+3 Occult, -2 combat Resolve.';
 if(T['Kindhearted'])T['Kindhearted'].desc='+4 Talk. Especially valuable on negotiation, rescue and surrender checks.';
 if(T['Tunnel Rat'])T['Tunnel Rat'].desc='+4 Sneak and +2 Scout.';
 if(T['Streetwise'])T['Streetwise'].desc='+3 Talk and +2 Sneak.';
}
if(window.blRules?.RACE_RULES?.Human)window.blRules.RACE_RULES.Human.desc='Most humans in the March come from feudal knightly cultures. +2 Talk, +1 Resolve, and +10% contract XP.';

function publicXpMult(r){
 const R=window.blRules?.RACE_RULES?.[r.race],T=window.blRules?.TRAIT_RULES||{};let m=R?.xp||1;
 (r.traits||[]).forEach(t=>m*=T[t]?.xp||1);return m;
}

// Redraw the final mission report only after every post-contract effect is settled.
function finalReport(){
 const r=state.lastReport;if(!r)return;
 const extras=[];
 if(r.faceBonus)extras.push(`<div class="reportBonus"><b>The King’s Second Face</b><span>+${r.faceBonus}s</span></div>`);
 if(r.armoryBonus)extras.push(`<div class="reportBonus"><b>Armory recovery</b><span>${r.armoryBonus}</span></div>`);
 if(r.bellSaved)extras.push(`<div class="reportBonus bell"><b>The Mourning Bell</b><span>${r.bellSaved} returned at 1 HP</span></div>`);
 modal(`<div class="sheetHead"><div><h3>${r.success?'CONTRACT COMPLETE':'CONTRACT FAILED'}</h3><div class="small muted">Day ${state.day}</div></div><button class="x" onclick="closeModal()">✕</button></div>
 <div class="hero reportHero"><div class="kicker">${r.title}</div><h2>${r.success?'They came back.':'Greyhaven gets quieter.'}</h2><p>${r.success?`Total payment <b class="gold">${r.pay}s</b>. ${r.loot?`Recovered <b>${r.loot}</b>.`:''}`:'The company gains no contract reward.'}</p></div>
 ${extras.length?`<div class="reportExtras">${extras.join('')}</div>`:''}
 ${r.deaths?.length?`<div class="card danger"><b>Confirmed dead:</b> ${r.deaths.join(', ')}</div>`:'<div class="card good"><b>No confirmed deaths.</b></div>'}
 <div class="card small reportClock"><b>Time advanced to Day ${state.day}.</b><br>Recovering adventurers have already completed one recovery day.</div>
 <div class="actions"><button class="btn primary" onclick="closeModal()">Back to Company</button></div>`);
}
window.blFinalReport=finalReport;

const oldFinishV5=finishExpedition;
finishExpedition=function(p){
 const exp=p.expedition,contract=exp?.contract,ids=[...(p.members||[])],risk=contract?.risk||0;
 const before=new Map(ids.map(id=>{const a=state.roster.find(x=>x.id===id);return [id,a?{xp:a.xp,lvl:a.lvl}:null]}));
 oldFinishV5(p);
 // systems-v2 already granted the percentage bonus on the flat part of XP.
 // Add the missing risk-based portion so +10%/+25% really means the whole contract reward.
 if(state.lastReport?.success&&risk){
  ids.forEach(id=>{const a=state.roster.find(x=>x.id===id);if(!a||a.status==='Dead')return;const mult=publicXpMult(a);const correction=Math.round(risk*10*(mult-1));if(correction>0){a.xp+=correction;levelCheck(a)}});
 }
 save();
 finalReport();
};

// Facility info and system codex should always explain exactly when time moves.
const oldSystemsInfo=window.blMechanicAudit;
window.blMechanicAudit=function(){const x=oldSystemsInfo?oldSystemsInfo():{};x.time='A day advances only when a contract resolves or Rest Company is used.';x.contractXP='Race/trait XP multipliers apply to the full contract XP award.';return x};

const css=document.createElement('style');css.textContent=`
.reportHero b{color:var(--gold)}.reportExtras{display:grid;gap:6px;margin:9px 0}.reportBonus{display:flex;justify-content:space-between;gap:10px;border:1px solid #5a452f;border-radius:10px;background:#17120e;padding:9px 10px;font-size:11px}.reportBonus b{color:#d8bd83}.reportBonus span{color:#e5d1a7;text-align:right}.reportBonus.bell{border-color:#76504a;background:#1d1110}.reportClock{margin-top:8px;border-color:#49382a}
`;document.head.appendChild(css);

state.version=Math.max(state.version||1,5);save();
})();