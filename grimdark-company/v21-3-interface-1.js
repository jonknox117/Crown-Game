/* Grim Company v21.3 — Interface & QoL: information architecture and navigation. */
const GC330_VERSION='21.3';
const GC330_PRIMARY=[
 ['you','♙','YOU'],
 ['company','◆','COMPANY'],
 ['contracts','⚔','CONTRACTS'],
 ['world','⌖','WORLD']
];
const GC330_COMPANY_SUB=['overview','people','parties','hq'];

function gc330UIState(){
 state.ui=state.ui||{};
 const aliases={hq:'company',roster:'company',vault:'company',gear:'you',jobs:'contracts',region:'world'};
 if(aliases[state.ui.tab])state.ui.tab=aliases[state.ui.tab];
 if(!GC330_PRIMARY.some(x=>x[0]===state.ui.tab))state.ui.tab='company';
 if(!GC330_COMPANY_SUB.includes(state.ui.gc330CompanySub))state.ui.gc330CompanySub='overview';
 state.ui.gc330Scroll=state.ui.gc330Scroll&&typeof state.ui.gc330Scroll==='object'?state.ui.gc330Scroll:{};
 return state.ui;
}
function gc330CurrentKey(){
 const ui=gc330UIState();return ui.tab==='company'?`company:${ui.gc330CompanySub}`:ui.tab;
}
function gc330RememberScroll(){
 if(!state||gc270IsFreeblade())return;
 const ui=gc330UIState();ui.gc330Scroll[gc330CurrentKey()]=Math.max(0,window.scrollY||0);
}
function gc330RestoreScroll(key){
 requestAnimationFrame(()=>{const y=Number(state?.ui?.gc330Scroll?.[key])||0;window.scrollTo(0,y)});
}
function gc330NavHTML(){
 const ui=gc330UIState();
 return GC330_PRIMARY.map(([id,icon,label])=>`<button class="navbtn gc330NavBtn ${ui.tab===id?'active':''}" data-action="nav" data-tab="${id}"><b>${icon}</b><span>${label}</span></button>`).join('');
}
function gc330Attention(){
 const active=state.parties.filter(p=>p.expedition).length;
 const recovering=state.roster.filter(a=>a.status==='Recovering').length;
 const downed=state.parties.reduce((n,p)=>n+(p.expedition?.battle?.allies?.filter(u=>u.gc320Downed).length||0),0);
 return{active,recovering,downed};
}
function gc330Topbar(){
 const a=gc330Attention(),f=gc260Founder(),name=state.company.name||f?.name||'Grim Company';
 return`<header class="topbar gc330Topbar"><div class="gc330Topline"><div class="brand"><span>GRIM COMPANY</span><h1>${esc(name)}</h1><small>${esc(REGION_DEFS[state.currentRegion]?.name||state.currentRegion)}</small></div><div class="gc330TopActions"><button class="iconbtn" data-action="audio" aria-label="Audio">${state.settings.sfx?'♪':'×'}</button><button class="iconbtn" data-action="menu" aria-label="Menu">☰</button></div></div><div class="gc330Hud"><div><span>SILVER</span><b>${Math.round(state.company.silver)}</b></div><div><span>RENOWN</span><b>${Math.round(state.company.renown||0)}</b></div><div class="${a.active?'live':''}"><span>FIELD</span><b>${a.active}</b></div><div class="${a.recovering?'warn':''}"><span>RECOVER</span><b>${a.recovering}</b></div>${a.downed?`<div class="danger"><span>DOWNED</span><b>${a.downed}</b></div>`:''}</div></header>`;
}

/* Freeblade keeps its phase-specific four choices, but uses the same visual hierarchy. */
gc270Topbar=function(){
 const f=gc260Founder(),fb=gc310Freeblade(),a=gc330Attention();
 return`<header class="topbar gc330Topbar"><div class="gc330Topline"><div class="brand"><span>INDEPENDENT MERCENARY</span><h1>${esc(f?.name||'Freeblade')}</h1><small>${esc(REGION_DEFS[state.currentRegion]?.name||state.currentRegion)}</small></div><div class="gc330TopActions"><button class="iconbtn" data-action="audio" aria-label="Audio">${state.settings.sfx?'♪':'×'}</button><button class="iconbtn" data-action="menu" aria-label="Menu">☰</button></div></div><div class="gc330Hud"><div><span>SILVER</span><b>${Math.round(state.company.silver)}</b></div><div><span>REP</span><b>${Math.round(fb?.reputation||0)}</b></div><div><span>LEVEL</span><b>${f?.lvl||1}</b></div><div class="${a.active?'live':''}"><span>FIELD</span><b>${a.active}</b></div></div></header>`;
};
gc270NavHTML=function(){
 const tabs=[['you','♙','YOU'],['jobs','⚔','JOBS'],['gear','◇','GEAR'],['region','⌖','WORLD']];
 return tabs.map(([id,ic,l])=>`<button class="navbtn gc330NavBtn ${state.ui.tab===id?'active':''}" data-action="nav" data-tab="${id}"><b>${ic}</b><span>${l}</span></button>`).join('');
};

function gc330CompanySubnav(){
 const ui=gc330UIState(),items=[['overview','Overview'],['people','People'],['parties','Parties'],['hq','HQ']];
 return`<div class="gc330Subnav" role="tablist">${items.map(([id,label])=>`<button class="${ui.gc330CompanySub===id?'active':''}" data-action="gc330CompanySub" data-value="${id}">${label}</button>`).join('')}</div>`;
}
function gc330OpenVault(){
 modal(`<div class="sheetHead"><div><h3>Armory & Vault</h3><div class="tiny muted">${esc(REGION_DEFS[state.currentRegion].name)} stores</div></div><button class="x" data-action="close">×</button></div><div class="gc330SecondaryView">${renderVault()}</div>`);
}
function gc330FullLog(pid){
 const p=state.parties.find(x=>x.id===pid),e=p?.expedition;if(!p||!e)return;
 const lines=(e.battle?.log||e.events||[]).slice().reverse();
 modal(`<div class="sheetHead"><div><h3>${esc(p.name)}</h3><div class="tiny muted">${esc(e.contract.title)} • Full expedition log</div></div><button class="x" data-action="close">×</button></div><div class="gc330FullLog">${lines.length?lines.map(x=>`<div>${esc(x)}</div>`).join(''):'<div class="empty">Nothing has happened yet.</div>'}</div>`);
}
function gc330Menu(){
 modal(`<div class="sheetHead"><h3>Game Menu</h3><button class="x" data-action="close">×</button></div><div class="gc330MenuGrid">${gc270IsCompany()?`<button class="card" data-action="gc330Vault"><b>Armory & Vault</b><small>Equipment, caches and artifacts</small></button>`:''}<button class="card" data-action="gc199Feed"><b>Event Log</b><small>Recent company events</small></button><button class="card" data-action="audio"><b>Audio</b><small>Music and effects</small></button><button class="card" data-action="backup"><b>Save & Backup</b><small>Protect or restore this save</small></button></div><button class="btn dangerBtn wide" data-action="newGame">New Game</button>`);
}
showMenu=gc330Menu;

const _processActionGC330=processAction;
processAction=function(el){
 if(typeof gc321Locked==='function'&&gc321Locked())return _processActionGC330(el);
 const a=el.dataset.action;
 if(gc270IsCompany()&&a==='nav'){
  gc330RememberScroll();
  const aliases={hq:'company',roster:'company',vault:'company',gear:'you',jobs:'contracts',region:'world'};
  const next=aliases[el.dataset.tab]||el.dataset.tab;
  state.ui.tab=GC330_PRIMARY.some(x=>x[0]===next)?next:'company';save();render();gc330RestoreScroll(gc330CurrentKey());return;
 }
 if(a==='gc330CompanySub'){
  gc330RememberScroll();state.ui.tab='company';state.ui.gc330CompanySub=GC330_COMPANY_SUB.includes(el.dataset.value)?el.dataset.value:'overview';save();render();gc330RestoreScroll(gc330CurrentKey());return;
 }
 if(a==='gc330Vault')return gc330OpenVault();
 if(a==='gc330FullLog')return gc330FullLog(el.dataset.id);
 return _processActionGC330(el);
};
