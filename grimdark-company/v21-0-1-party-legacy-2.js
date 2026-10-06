/* Grim Company v21.0.1 — Party Legacy presentation and self-test. */
function gc301PartyLegacyHTML(p){
 const l=gc301Party(p),captainIds=Object.entries(l.captains).sort((a,b)=>b[1]-a[1]).slice(0,3);
 const captains=captainIds.map(([id,n])=>{const a=state.roster.find(x=>x.id===id);return a?`${a.name} (${n})`:null}).filter(Boolean);
 return`<div class="gc301PartyLegacy"><div class="statline"><div><span>PARTY LEGACY</span><b>Founded Day ${l.foundedDay} • ${l.missions} contracts • ${l.campaigns} campaigns</b></div><strong>${l.bossKills} boss${l.bossKills===1?'':'es'}</strong></div>
 ${l.traditions.length?`<div class="tags">${l.traditions.map(t=>`<span class="tag gold">${esc(t)}</span>`).join('')}</div>`:'<div class="tiny muted">No tradition yet. Repeated behavior will become doctrine.</div>'}
 ${captains.length?`<div class="tiny muted">Most-used captains: ${captains.map(esc).join(' • ')}</div>`:''}</div>`;
}
const _partyCardGC301=partyCard;
partyCard=function(p){
 let html=_partyCardGC301(p),legacy=gc301PartyLegacyHTML(p);
 return html.replace('<div class="cohesion">',legacy+'<div class="cohesion">');
};
const _renderModalPartyGC301=renderModalParty;
renderModalParty=function(pid){
 const out=_renderModalPartyGC301(pid),p=state.parties.find(x=>x.id===pid),sheet=document.getElementById('sheet');
 if(p&&sheet){
  const l=gc301Party(p);
  sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Party History</h3><span>${l.casualties} casualties</span></div><div class="card history">${l.history.slice(-10).reverse().map(x=>`<div>Day ${x.day} • ${esc(x.text)}</div>`).join('')||'<div>No defining history yet.</div>'}</div>`);
 }
 return out;
};
function gc301InstallStyles(){
 if(document.getElementById('gc301Styles'))return;
 const st=document.createElement('style');st.id='gc301Styles';
 st.textContent='.gc301PartyLegacy{margin:7px 0;padding:7px;border:1px solid rgba(187,147,79,.18);border-left:2px solid #84633d;border-radius:5px;background:rgba(132,99,61,.035)}.gc301PartyLegacy span{font-size:7px;letter-spacing:.08em;color:#9f8d72}.gc301PartyLegacy b{display:block;margin-top:2px;font-size:9px}.gc301PartyLegacy strong{font-size:9px;color:#c8a467}.gc301PartyLegacy .tags{margin:5px 0 3px}';
 document.head.appendChild(st);
}
gc301InstallStyles();

const _auditGC301=audit;
audit=function(){const out=_auditGC301();out.v301PartyLegacy=GC301_VERSION;out.persistentPartyHistory=true;out.emergentPartyTraditions=true;out.partyTraditionsHaveEffects=true;out.partyCaptainHistory=true;return out};
window.__BL_AUDIT=audit;

window.__GC301_TEST=function(){
 const old=state;
 try{
  state=createState('Party Test','veyric');
  const p=makeParty('veyric','Ash Hounds');state.parties=[p];
  const l=gc301Party(p);l.missions=22;l.scoutSneakSuccess=8;l.cautiousWins=8;l.aggressiveWins=8;l.bossKills=2;
  gc301Evaluate(p);
  const needed=['Night Hunters','Hold the Line','Bossbreakers','Shock Company','Long Road Veterans'];
  const traditions=needed.every(x=>l.traditions.includes(x));
  const base=.4;
  const oldRate=_gc201ContactRateGC301;
  const saveExp=p.expedition;
  p.expedition={contract:{risk:2,regionId:'veyric'},gc250ContactMod:0};
  let rate=gc201ContactRate(p);
  p.expedition=saveExp;
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=copy.parties[0].gc301Legacy.traditions.length===l.traditions.length;
  return{ok:!!(traditions&&rate<1&&saveSafe),traditions:l.traditions,rate,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
