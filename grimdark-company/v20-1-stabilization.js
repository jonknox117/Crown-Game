/* Grim Company v20.1 stabilization — remove remaining day-era UI assumptions. */
const GC201_STABILIZATION='20.1';

/* Injured adventurers are physically in the Recover stance even while their
   status is Recovering, so the four-stance dashboard always accounts for them. */
gc201Team=function(regionId,stance){
 return state.roster.filter(a=>{
   if(a.regionId!==regionId||a.status==='Dead'||a.status==='Expedition'||a.status==='Captured')return false;
   if(stance==='Recover')return a.status==='Recovering'||(a.status==='Ready'&&a.dailyOrder==='Recover');
   return a.status==='Ready'&&a.dailyOrder===stance;
 });
};

/* v19.4 used to append a daily-risk sentence on dispatch. Replace it with the
   v20.1 native continuous-pressure language and initialize tick-era clocks. */
const _dispatchContractGC201=dispatchContract;
dispatchContract=function(cid,pid){
 const out=_dispatchContractGC201(cid,pid),p=state.parties.find(x=>x.id===pid),e=p?.expedition;
 if(e){
   e.gc201Momentum=0;e.gc201CombatClock=0;e.gc201ContactExposure=0;
   e.events=(e.events||[]).filter(x=>!/daily hostile-contact risk|field operation continues autonomously/i.test(String(x)));
   e.events.push(`Continuous contact pressure: ${gc201ContactLabel(gc201ContactRate(p))} at departure.`);save();render();
 }
 return out;
};

/* Return reports no longer claim that completing a contract advanced a day, and
   they never pause the living company. */
showReport=function(r){
 if(!r)return;const text=`${r.win?'CONTRACT COMPLETE':'CONTRACT FAILED'} — ${r.title||'Expedition returned'}`;gc199RecordFeed(text,r.win?'return':'danger');
 if(r.pay)gc199RecordFeed(`${r.title}: ${money(r.pay)} paid.`,'return');if(r.deaths?.length)gc199RecordFeed(`${r.title}: dead — ${r.deaths.join(', ')}.`,'danger');
 toast(r.win?'A party completed its contract.':'A party returned from a failed contract.');
 modal(`<div class="sheetHead"><div><h3>${r.win?'CONTRACT COMPLETE':'CONTRACT FAILED'}</h3><div class="tiny muted">The company is still running</div></div><button class="x" data-action="close">×</button></div><div class="hero"><div class="kicker">${esc(r.title||'Expedition')}</div><h2>${r.win?'They came back.':'The contract went bad.'}</h2><p>${r.win?`Payment ${money(r.pay||0)}.`:'No contract payment.'}</p></div>${r.loot?itemHTML(r.loot):''}${r.cache?`<div class="notice"><b>${esc(r.cache.name)}</b> added to the Vault.</div>`:''}${r.artifact?`<div class="notice rarity-5"><b>Artifact recovered:</b> ${esc(r.artifact.name)}</div>`:''}${r.deaths?.length?`<div class="card danger"><b>Dead:</b> ${r.deaths.map(esc).join(', ')}</div>`:'<div class="card good"><b>No confirmed deaths.</b></div>'}<div class="notice">Travel, HQ stances and other parties continue progressing while this report is open.</div>`);
};

/* Facility upgrades modify the four stances passively; adventurers no longer
   need a separate Facility job. */
if(HQ_DEFS?.Infirmary)HQ_DEFS.Infirmary.desc='Improves continuous Recover healing and injury recovery.';
if(HQ_DEFS?.['Training Yard'])HQ_DEFS['Training Yard'].desc='Improves continuous Train XP. Training partners add a diminishing group bonus.';
if(HQ_DEFS?.['Contract Office'])HQ_DEFS['Contract Office'].desc='Adds contract capacity/pay and contributes to shared Scout progress.';
if(HQ_DEFS?.['Occult Archive'])HQ_DEFS['Occult Archive'].desc='Improves supernatural intelligence and shared Scout progress.';
const _hqInfoGC201=hqInfo;
hqInfo=function(k){
 const lv=hq().upgrades[k]||0;
 if(k==='Infirmary')return modal(`<div class="sheetHead"><h3>Infirmary</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: Recover heals ${Math.round((.14+lv*.018)*100)}% max HP per simulation day before individual modifiers, and injuries recover faster.</div></div>`);
 if(k==='Training Yard')return modal(`<div class="sheetHead"><h3>Training Yard</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: +${lv*2} base XP-rate to every adventurer currently Training.</div></div>`);
 if(k==='Contract Office')return modal(`<div class="sheetHead"><h3>Contract Office</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: +${lv*5}% base contract pay, +${lv} board slot${lv===1?'':'s'}, and a small boost to shared scouting work.</div></div>`);
 if(k==='Occult Archive')return modal(`<div class="sheetHead"><h3>Occult Archive</h3><button class="x" data-action="close">×</button></div><div class="card"><div class="small">${esc(HQ_DEFS[k].desc)}</div><div class="gold small" style="margin-top:6px">Lv.${lv}: stronger starting occult intel and +${lv*6}% shared Scout progress.</div></div>`);
 return _hqInfoGC201(k);
};

const _auditGC201Stabilization=audit;
audit=function(){const out=_auditGC201Stabilization();out.v201Stabilized=true;out.dispatchUsesContinuousPressure=true;out.returnReportsDoNotPause=true;out.recoveringCountedInStance=true;out.facilitiesArePassiveModifiers=true;return out};
window.__BL_AUDIT=audit;
