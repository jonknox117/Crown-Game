/* Grim Company v21.0 — Veteran Legacy presentation and self-test. */
function gc300LegacySummary(a){
 const l=gc300Legacy(a);
 return `${l.contracts} contracts • ${l.campaigns} campaigns • ${l.bossKills} named kills`;
}
function gc300LegacyHTML(a){
 const l=gc300Legacy(a),title=gc300Title(a),items=Object.entries(l.legendaryItems).sort((x,y)=>y[1]-x[1]).slice(0,4);
 return`<div class="sectionTitle"><h3>Veteran Legacy</h3><span>${title?esc(title):'still being written'}</span></div>
 <div class="card gc300LegacyCard"><div class="gc300LegacyStats"><div><span>CONTRACTS</span><b>${l.contracts}</b></div><div><span>RISK 5</span><b>${l.risk5}</b></div><div><span>CAMPAIGNS</span><b>${l.campaigns}</b></div><div><span>BOSSES</span><b>${l.bossKills}</b></div><div><span>INJURIES</span><b>${l.injuries}</b></div><div><span>COMMAND</span><b>${Math.floor(l.commandDays)}d</b></div></div>
 ${l.titles.length?`<div class="gc300Block"><b>Earned Titles</b><div class="tags">${l.titles.map(t=>`<button class="tag ${l.activeTitle===t?'gold':''}" data-action="gc300Title" data-id="${a.id}" data-value="${esc(t)}">${esc(t)}</button>`).join('')}</div></div>`:''}
 ${l.accomplishments.length?`<div class="gc300Block"><b>Accomplishments</b>${l.accomplishments.slice(-8).reverse().map(x=>`<div class="gc300Line"><strong>${esc(x.name)}</strong><span>${esc(x.desc)}</span></div>`).join('')}</div>`:''}
 ${l.scars.length?`<div class="gc300Block"><b>Permanent Scars</b>${l.scars.map(x=>`<div class="gc300Line"><strong>${esc(x)}</strong><span>${esc(GC300_SCARS[x]?.desc||'A permanent mark of survival.')}</span></div>`).join('')}</div>`:''}
 ${l.bosses.length?`<div class="gc300Block"><b>Named Enemies Defeated</b><div class="tiny muted">${l.bosses.map(esc).join(' • ')}</div></div>`:''}
 ${items.length?`<div class="gc300Block"><b>Legendary Weapons & Relics Carried</b><div class="tiny muted">${items.map(([n,c])=>`${esc(n)}${c>1?` ×${c}`:''}`).join(' • ')}</div></div>`:''}
 </div>`;
}
const _rosterCardGC300=rosterCard;
rosterCard=function(a){
 let html=_rosterCardGC300(a),title=gc300Title(a);
 if(title)html=html.replace('</h4>',` <span class="gc300Title">${esc(title)}</span></h4>`);
 return html;
};
const _renderInspectGC300=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectGC300(id,recruit);
 if(!recruit){
  const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');
  if(a&&sheet)sheet.insertAdjacentHTML('beforeend',gc300LegacyHTML(a));
 }
 return out;
};
if(typeof gc260RenderYou==='function'){
 const _gc260RenderYouGC300=gc260RenderYou;
 gc260RenderYou=function(){
  let html=_gc260RenderYouGC300(),f=gc260Founder();
  if(f&&f.status!=='Dead')html+=gc300LegacyHTML(f);
  return html;
 };
}
const _showReportGC300=showReport;
showReport=function(r){
 const out=_showReportGC300(r),sheet=document.getElementById('sheet');
 if(sheet&&r?.deaths?.length){
  const records=r.deaths.map(name=>(state.gc300Memorials||[]).slice().reverse().find(x=>x.name===name)).filter(Boolean);
  if(records.length)sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Lives Written Into Company History</h3><span>${records.length} fallen</span></div>${records.map(x=>`<div class="card danger gc300Memorial"><b>${esc(x.name)}${x.title?` — ${esc(x.title)}`:''}</b><div class="tiny muted">Lv.${x.lvl} • ${x.contracts} contracts • ${x.campaigns} campaigns • ${x.bossKills} named kills • ${x.kills} kills</div><div class="tiny">${esc(x.cause)}</div></div>`).join('')}`);
 }
 return out;
};
const _processActionGC300=processAction;
processAction=function(el){
 if(el.dataset.action==='gc300Title'){
  const a=state.roster.find(x=>x.id===el.dataset.id),title=el.dataset.value;
  if(a&&gc300Legacy(a).titles.includes(title)){gc300Legacy(a).activeTitle=title;save();renderInspect(a.id)}
  return;
 }
 return _processActionGC300(el);
};

function gc300InstallStyles(){
 if(document.getElementById('gc300Styles'))return;
 const st=document.createElement('style');st.id='gc300Styles';
 st.textContent='.gc300Title{display:inline-block;margin-left:4px;padding:1px 4px;border:1px solid rgba(186,143,73,.35);border-radius:999px;color:#d3ad6b;font-size:6px;letter-spacing:.05em;vertical-align:middle}.gc300LegacyStats{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.gc300LegacyStats>div{padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:5px;background:rgba(255,255,255,.018);text-align:center}.gc300LegacyStats span{display:block;font-size:7px;color:#8f8270}.gc300LegacyStats b{display:block;margin-top:2px;font-size:12px}.gc300Block{margin-top:9px;padding-top:7px;border-top:1px solid rgba(255,255,255,.06)}.gc300Block>b{display:block;margin-bottom:5px;font-size:9px;color:#b99a68}.gc300Line{display:grid;grid-template-columns:110px 1fr;gap:7px;margin:4px 0;font-size:8px}.gc300Line strong{color:#d4b374}.gc300Line span{color:#9b8f7f}.gc300LegacyCard .tag{cursor:pointer}.gc300Memorial{border-left:3px solid #733b34}@media(max-width:420px){.gc300LegacyStats{grid-template-columns:repeat(2,1fr)}.gc300Line{grid-template-columns:1fr}.gc300Line span{margin-top:-2px}}';
 document.head.appendChild(st);
}
gc300InstallStyles();

const _auditGC300=audit;
audit=function(){const out=_auditGC300();out.v300VeteranLegacy=GC300_VERSION;out.structuredCareerHistory=true;out.earnedTitles=true;out.permanentScars=true;out.namedBossLegacy=true;out.commanderServiceRecorded=true;out.deathLegacyCards=true;return out};
window.__BL_AUDIT=audit;

window.__GC300_TEST=function(){
 const old=state;
 try{
  state=createState('Legacy Test','veyric');
  const a=generateAdventurer('veyric');a.name='Mara Test';state.roster=[a];
  const l=gc300Legacy(a);l.contracts=30;l.risk5=5;l.campaigns=3;l.bossKills=1;l.fieldSuccess=20;l.captainMissions=20;l.commandDays=31;l.nearDeaths=3;
  gc300Evaluate(a);gc300RecordBoss(a,'Hadrik Test');const before=derived(a);l.scars.push('One-Eyed');
  const d=derived(a),titles=l.titles.length>=5,accomplishments=l.accomplishments.length>=7,scarApplied=d.combat.resolve===before.combat.resolve+2,copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=copy.roster[0].gc300Legacy.titles.length===l.titles.length;
  return{ok:!!(titles&&accomplishments&&scarApplied&&saveSafe),titles:l.titles.length,accomplishments:l.accomplishments.length,active:l.activeTitle,scarApplied,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
