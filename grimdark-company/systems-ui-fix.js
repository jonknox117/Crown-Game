(function(){
'use strict';
renderRoster=function(){return `<div class="hero"><div class="kicker">COMPANY ROSTER</div><h2>${employedCount()} employed</h2><p>Race, class and traits now change what an adventurer can actually do. Build parties for the job, not just the body count.</p></div>
<div class="sectionTitle"><h3>Your People</h3><div class="headerTools"><span>Capacity ${cap()}</span><button class="btn ghost systemsInfo">Rules ⓘ</button></div></div><div class="list">${state.roster.length?state.roster.map(r=>rosterCard(r)).join(''):'<div class="empty">Nobody works for you yet.</div>'}</div>
<div class="sectionTitle"><h3>Tavern & Yard</h3><button class="btn ghost" id="refreshRecruits">Refresh 4s</button></div><div class="list">${state.recruits.map(recruitCard).join('')}</div>
<div class="sectionTitle"><h3>Parties</h3><span>Different jobs want different specialists</span></div>${state.parties.map(p=>partyCard(p)).join('')}`};
const style=document.createElement('style');style.textContent=`.headerTools{display:flex;align-items:center;gap:6px}.headerTools>span{color:var(--muted);font-size:10px}.headerTools .btn{padding:6px 8px;min-width:0}`;document.head.appendChild(style);
})();
