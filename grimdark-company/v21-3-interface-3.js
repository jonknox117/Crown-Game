/* Grim Company v21.3 — Interface & QoL: cohesive visual system, terminology cleanup and UI checks. */

const _gc260PendingDecisionHTMLGC330=gc260PendingDecisionHTML;
gc260PendingDecisionHTML=function(p,d){
 let html=_gc260PendingDecisionHTMLGC330(p,d);
 html=html.replace('Only this expedition is waiting. Every other company activity continues normally.','The entire simulation is paused until you make this decision.');
 html=html.replace('Only this expedition is waiting. The company simulation is still running.','The entire simulation is paused until you make this decision.');
 return html;
};

function gc330InstallStyles(){
 if(document.getElementById('gc330Styles'))return;
 const st=document.createElement('style');st.id='gc330Styles';
 st.textContent=`
 body.gc330Visual{background:#0b0b0a;color:#d8d0c2}
 body.gc330Visual .app{max-width:780px;margin:0 auto}
 body.gc330Visual .screen{padding:10px 10px 92px}
 body.gc330Visual .card{border-color:rgba(220,205,177,.09);background:linear-gradient(180deg,rgba(28,27,24,.96),rgba(18,18,16,.96));box-shadow:none}
 body.gc330Visual .card:hover{transform:none}
 .gc330Topbar{padding:10px 12px 8px;border-bottom:1px solid rgba(216,189,137,.13);background:linear-gradient(180deg,#11110f,#0d0d0c)}
 .gc330Topline{display:flex;align-items:center;justify-content:space-between;gap:10px}
 .gc330Topbar .brand{min-width:0}.gc330Topbar .brand>span{display:block;font-size:7px;letter-spacing:.18em;color:#a98a58}
 .gc330Topbar .brand h1{font-size:17px;line-height:1.05;margin:2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .gc330Topbar .brand small{display:block;color:#847d72;font-size:8px}
 .gc330TopActions{display:flex;gap:6px;flex:0 0 auto}.gc330TopActions .iconbtn{width:42px;height:42px;border-radius:7px}
 .gc330Hud{display:flex;gap:5px;margin-top:8px;overflow:hidden}
 .gc330Hud>div{min-width:0;flex:1;padding:5px 7px;border-left:1px solid rgba(255,255,255,.07)}
 .gc330Hud>div:first-child{border-left:0}.gc330Hud span{display:block;font-size:6px;letter-spacing:.12em;color:#777166}
 .gc330Hud b{display:block;margin-top:1px;font-size:11px;color:#d6c49c}.gc330Hud .live b{color:#c9ad70}.gc330Hud .warn b{color:#c98e68}.gc330Hud .danger b{color:#dc7062}
 #gc199ClockBar.gc199ClockBar{max-width:780px;margin:0 auto;padding:5px 10px;background:#0e0e0d;border-bottom:1px solid rgba(255,255,255,.055)}
 #gc199ClockBar .gc199ClockMain{min-height:32px}#gc199ClockBar .gc199ClockTrack{height:2px}
 #nav{grid-template-columns:repeat(4,1fr)!important;gap:0!important;background:rgba(10,10,9,.97)!important;border-top:1px solid rgba(207,177,119,.18)!important}
 .gc330NavBtn{min-height:58px!important;padding:7px 2px 6px!important;gap:2px!important;font-size:7px!important;letter-spacing:.07em}
 .gc330NavBtn b{font-size:17px!important;line-height:1}.gc330NavBtn span{display:block}.gc330NavBtn.active{color:#d7b97e!important;background:linear-gradient(180deg,rgba(176,137,75,.12),rgba(176,137,75,.035))!important}
 .gc330Screen>.hero:first-child{margin-top:0}
 .gc330Subnav{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:0 0 10px;padding:3px;background:#11110f;border:1px solid rgba(255,255,255,.055);border-radius:7px}
 .gc330Subnav button{min-height:36px;border:0;border-radius:5px;background:transparent;color:#817a70;font:700 8px inherit;letter-spacing:.05em}
 .gc330Subnav button.active{background:#242018;color:#d5b578}
 .gc330PageLead{padding:9px 2px 11px}.gc330PageLead>span{display:block;font-size:7px;letter-spacing:.16em;color:#9e8154}.gc330PageLead h2{margin:3px 0;font-size:21px;line-height:1.06}.gc330PageLead p{margin:4px 0 0;font-size:10px;line-height:1.4;color:#938a7d}.gc330PageLead.danger>span{color:#cf6256}
 .gc330RegionVitals{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:9px}
 .gc330RegionVitals>div{padding:7px;background:#121210;border:1px solid rgba(255,255,255,.055);border-radius:6px}.gc330RegionVitals span{display:block;font-size:6px;letter-spacing:.1em;color:#81786c}.gc330RegionVitals b{display:block;font-size:13px;margin:2px 0 4px}.gc330RegionVitals i{display:block;height:3px;background:#292722;border-radius:4px;overflow:hidden}.gc330RegionVitals em{display:block;height:100%;background:#9a7c4b}
 .gc330Quick{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin:8px 0 12px}.gc330Quick button{min-height:50px;padding:6px;border:1px solid rgba(255,255,255,.06);border-radius:6px;background:#151411;color:#c9c0b2}.gc330Quick b,.gc330Quick span{display:block}.gc330Quick b{font-size:12px}.gc330Quick span{margin-top:2px;font-size:7px;color:#837a6d}.gc330HQQuick{grid-template-columns:repeat(3,1fr)}
 .sectionTitle{margin-top:14px;margin-bottom:6px}.sectionTitle h3{font-size:11px;letter-spacing:.02em}.sectionTitle>span{font-size:7px;color:#827a6e}
 .gc201StanceGrid{gap:5px!important}.gc201Stance{min-height:112px!important;padding:7px!important}.gc201StanceScene{min-height:42px!important}.gc201StanceScene *{animation:none!important}.gc201StanceMeta{font-size:7px!important;line-height:1.25!important;max-height:28px;overflow:hidden}
 .gc330CompactList,.gc330RecruitList{display:grid;gap:5px}
 .gc330PersonRow{display:grid;grid-template-columns:44px minmax(0,1fr) 12px;gap:8px;align-items:center;width:100%;padding:7px 8px;border:1px solid rgba(255,255,255,.06);border-radius:7px;background:#151411;color:inherit;text-align:left}.gc330PersonRow.wounded{border-left:2px solid #915047}.gc330Face{width:42px;height:42px;overflow:hidden;border-radius:5px}.gc330Face .blSvgPortrait{width:42px!important;height:42px!important}.gc330PersonMain{min-width:0}.gc330Name{display:flex;align-items:center;gap:5px;min-width:0}.gc330Name b{font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gc330Name span,.gc330Name em{flex:0 0 auto;padding:1px 4px;border:1px solid rgba(195,158,94,.27);border-radius:999px;font-size:6px;color:#c9a96c;font-style:normal}.gc330PersonMain>small{display:block;margin-top:2px;color:#8e8578;font-size:8px}.gc330PersonStatus{display:flex;gap:5px;flex-wrap:wrap;margin:3px 0}.gc330PersonStatus span,.gc330PersonStatus strong{font-size:7px;color:#9e9587}.gc330PersonStatus strong{color:#c36f64}.gc330PersonRow .hpbar{height:3px}
 .gc330RecruitRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center;padding:7px;border:1px solid rgba(255,255,255,.06);border-radius:7px;background:#151411}.gc330RecruitIdentity{display:grid;grid-template-columns:42px minmax(0,1fr);gap:7px;align-items:center;background:none;border:0;color:inherit;text-align:left;padding:0}.gc330RecruitIdentity b,.gc330RecruitIdentity small,.gc330RecruitIdentity em{display:block}.gc330RecruitIdentity b{font-size:10px}.gc330RecruitIdentity small{font-size:8px;color:#908678}.gc330RecruitIdentity em{font-size:7px;color:#c0a064;font-style:normal}
 .gc330PartyCard{padding:9px}.gc330PartyHead{display:flex;justify-content:space-between;gap:8px;align-items:start}.gc330PartyHead b,.gc330PartyHead small{display:block}.gc330PartyHead b{font-size:11px}.gc330PartyHead small{margin-top:2px;font-size:8px;color:#8c8376}.gc330PartyRisk{min-width:34px;padding:5px;border:1px solid rgba(202,168,106,.26);border-radius:6px;text-align:center;color:#d0ad6e;font-weight:800}
 .gc330PartyFaces{display:flex;gap:5px;flex-wrap:wrap;margin:8px 0}.gc330PartyFaces button{position:relative;width:45px;padding:0;border:0;background:transparent;color:#aaa}.gc330PartyFaces .blSvgPortrait{width:42px!important;height:42px!important;border-radius:5px}.gc330PartyFaces button span{display:block;margin-top:2px;font-size:6px}.gc330PartyMeta{display:flex;gap:5px;flex-wrap:wrap}.gc330PartyMeta span{padding:2px 5px;border-radius:999px;background:#201e1a;font-size:7px;color:#938a7c}
 .gc330Facilities{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.gc330Facilities .card{margin:0}.gc330Facilities small{display:block;margin:4px 0;color:#8f8678;font-size:8px;line-height:1.35}
 .gc330FieldSummary{display:grid;gap:5px}.gc330FieldSummary .card{text-align:left}.gc330FieldSummary b,.gc330FieldSummary span,.gc330FieldSummary em{display:block}.gc330FieldSummary span{font-size:8px;color:#aa9c88;margin-top:2px}.gc330FieldSummary em{font-size:7px;color:#b89964;font-style:normal;margin-top:3px}
 .gc330ContractContext{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:7px 8px;margin-bottom:10px;border-left:2px solid #8a7048;background:#14130f;font-size:7px;color:#8f8678}.gc330ContractContext b{color:#d0a768}
 .gc330ContractCard{padding:10px;overflow:hidden}.gc330ContractCard.blocked{opacity:.72}.gc330ContractTop{display:flex;justify-content:space-between;gap:10px}.gc330ContractTop span{display:block;font-size:7px;letter-spacing:.08em;color:#8c8273}.gc330ContractTop h3{margin:2px 0;font-size:13px}.gc330RiskBadge{width:42px;height:42px;display:grid;place-content:center;border:1px solid rgba(203,161,92,.3);border-radius:7px;text-align:center}.gc330RiskBadge b{font-size:18px;line-height:1;color:#d4ad69}.gc330RiskBadge small{font-size:5px;letter-spacing:.12em;color:#8f806b}.gc330ContractFacts{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:8px 0}.gc330ContractFacts>div{padding:5px;background:#11110f;border-radius:4px}.gc330ContractFacts span,.gc330ContractFacts b{display:block}.gc330ContractFacts span{font-size:6px;color:#776f64}.gc330ContractFacts b{margin-top:2px;font-size:9px}.gc330Boss{padding:6px 7px;border-left:2px solid #9c4c43;background:rgba(126,47,41,.08)}.gc330Boss span,.gc330Boss b{display:block}.gc330Boss span{font-size:6px;color:#a86b63}.gc330Boss b{font-size:9px;color:#d39a90}.gc330QualificationLine{display:flex;justify-content:space-between;gap:8px;margin:8px 0;font-size:7px}.gc330QualificationLine b{color:#bca16d}.gc330QualificationLine span{color:#837a6d;text-align:right}.gc330QualificationLine.blocked b{color:#c06c61}
 .gc330Expedition{padding:10px}.gc330Expedition.critical{border-left:3px solid #a7473f}.gc330ExpeditionHead{display:flex;justify-content:space-between;gap:8px}.gc330ExpeditionHead span{display:block;font-size:7px;letter-spacing:.08em;color:#b08b54}.gc330ExpeditionHead h3{margin:2px 0;font-size:13px}.gc330ExpeditionHead small{font-size:8px;color:#8b8275}.gc330ExpeditionHead>strong{font-size:16px;color:#c8a56a}.gc330ExpeditionState{display:flex;justify-content:space-between;gap:8px;margin:6px 0;font-size:7px;color:#92887a}.gc330Recent{margin:7px 0;padding:7px;background:#11110f;border-radius:5px}.gc330Recent>b{display:block;margin-bottom:4px;font-size:6px;letter-spacing:.12em;color:#8f7f68}.gc330Recent>div{font-size:8px;line-height:1.35;color:#aaa093;margin-top:2px}
 .gc330WorldRegion.current{border-color:rgba(197,158,91,.32)}.gc330WorldHead{display:flex;justify-content:space-between;gap:8px}.gc330WorldHead span{font-size:7px;color:#8d8374}.gc330WorldHead h3{margin:2px 0 7px;font-size:14px}.gc330WorldHead>b{font-size:7px;color:#b69a66}.gc330WorldMeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.gc330WorldMeta span{font-size:7px;color:#887f72}
 .gc330YouLead{display:grid;grid-template-columns:88px minmax(0,1fr);gap:10px;align-items:center;padding:8px 2px 10px}.gc330YouPortrait .blSvgPortrait{width:86px!important;height:86px!important}.gc330YouLead>div:last-child>span{display:block;font-size:7px;color:#9b845e}.gc330YouLead h2{font-size:22px;margin:2px 0}.gc330YouLead em{display:inline-block;padding:2px 6px;border:1px solid rgba(190,148,79,.32);border-radius:999px;font-size:7px;color:#d0ab6c;font-style:normal}.gc330YouLead p{margin:4px 0 0;font-size:9px;color:#938a7c}.gc330YouVitals{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:7px 0}.gc330YouVitals>div{padding:6px;background:#14130f;border:1px solid rgba(255,255,255,.05);border-radius:5px}.gc330YouVitals span,.gc330YouVitals b{display:block}.gc330YouVitals span{font-size:6px;color:#7d756a}.gc330YouVitals b{font-size:10px;margin-top:2px}.gc330Relations{display:grid;gap:4px}.gc330Relations button{display:flex;justify-content:space-between;gap:8px;min-height:38px;padding:7px 9px;border:1px solid rgba(255,255,255,.055);border-radius:6px;background:#151411;color:#bdb4a6;text-align:left}.gc330FounderDead{display:grid;grid-template-columns:80px 1fr;gap:10px;align-items:center}
 .gc320FounderStances{gap:5px!important}.gc320FounderStances .card{min-height:86px!important}.gc320FounderStances .gc202StanceScene{min-height:34px!important}.gc320FounderStances small{max-height:24px;overflow:hidden}
 .gc320IndependentHero{padding:8px!important}.gc260AgencyGrid{gap:6px!important}.gc260AgencyGrid>.card{padding:8px!important}.gc260AgencyGrid .tiny{line-height:1.35}
 .gc330MenuGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-bottom:10px}.gc330MenuGrid .card{text-align:left;min-height:74px}.gc330MenuGrid b,.gc330MenuGrid small{display:block}.gc330MenuGrid small{margin-top:3px;color:#8d8375;font-size:8px}
 .gc330SecondaryView>.hero{display:none}.gc330FullLog{display:grid;gap:4px}.gc330FullLog>div{padding:6px 7px;background:#12110f;border-left:1px solid #4e4537;font-size:8px;line-height:1.4;color:#a99f91}
 .gc330ReportLead{padding:10px;margin-bottom:8px;border-left:3px solid #7f6a48;background:#14120f}.gc330ReportLead span,.gc330ReportLead b,.gc330ReportLead small{display:block}.gc330ReportLead span{font-size:7px;letter-spacing:.14em;color:#b38f58}.gc330ReportLead b{font-size:16px;margin-top:2px}.gc330ReportLead small{font-size:9px;color:#968b7b;margin-top:3px}.gc330ReportLead.danger{border-left-color:#b34d43;background:#1c100e}.gc330ReportLead.danger span{color:#df7468}.gc330DeathReport .gc202ResultBurst{opacity:.35}
 .modal.show .sheet{border-color:rgba(219,188,132,.17);background:#0e0e0d}.sheetHead{border-bottom-color:rgba(255,255,255,.06)}
 .gc320DecisionModal .gc320DecisionBanner{margin-top:0}.gc320DecisionModal .gc260DecisionChoices .card{min-height:68px;text-align:left}.gc320DecisionModal .gc260DecisionChoices .card b{font-size:10px}.gc320DecisionModal .gc260DecisionChoices .card small{font-size:8px;line-height:1.35}
 .btn{min-height:40px}.iconbtn{min-width:40px;min-height:40px}
 @media(max-width:430px){
  body.gc330Visual .screen{padding-left:8px;padding-right:8px}
  .gc330Facilities{grid-template-columns:1fr}.gc330ContractContext{align-items:flex-start;flex-direction:column}
  .gc330YouVitals{grid-template-columns:repeat(2,1fr)}.gc330Quick{grid-template-columns:repeat(2,1fr)}.gc330HQQuick{grid-template-columns:repeat(3,1fr)}
  .gc330ContractFacts{grid-template-columns:repeat(3,1fr)}
  .gc330QualificationLine{flex-direction:column}.gc330QualificationLine span{text-align:left}
  .gc330Hud>div{padding-left:5px;padding-right:5px}
 }
 @media(max-width:350px){
  .gc330Subnav button{font-size:7px;padding:0 2px}.gc330HQQuick{grid-template-columns:1fr}.gc330YouLead{grid-template-columns:70px minmax(0,1fr)}.gc330YouPortrait .blSvgPortrait{width:68px!important;height:68px!important}
  .gc330RecruitRow{grid-template-columns:1fr}.gc330RecruitRow>.btn{width:100%}
 }
 `;
 document.head.appendChild(st);
}
gc330InstallStyles();

const _gc193DailyDashboardGC330=gc193DailyDashboard;
gc193DailyDashboard=function(){return _gc193DailyDashboardGC330().replace(/v21\\.2\\s*•\\s*STAKES|v21\\.1\\s*•\\s*FREELANCER ECONOMY/g,'v21.3 • INTERFACE & QOL')};

const _auditGC330=audit;
audit=function(){
 const out=_auditGC330();
 out.v330InterfaceQol=GC330_VERSION;
 out.fourPrimaryDestinations=['you','company','contracts','world'];
 out.referenceInfoDemoted=true;
 out.compactGlobalHud=true;
 out.companySubnavigation=['overview','people','parties','hq'];
 out.expeditionRecentEventsCollapsed=true;
 out.mobileTouchTargets=true;
 out.visualUrgencyHierarchy=true;
 out.legacyPrimaryTabsRemoved=true;
 return out;
};
window.__BL_AUDIT=audit;

window.__GC330_TEST=function(){
 const old=state;
 try{
  state=createState('UI Test','veyric');state.regions.veyric.hq.established=true;
  const f=gc260CreateFounderRecord('veyric',{name:'UI Founder',race:'Human',culture:'Veyric',className:'March Ranger',gender:'Male',portrait:1},true);
  gc270Progression().phase='company';f.status='Ready';f.dailyOrder='Odd Jobs';state.company.silver=300;
  const p=makeParty('veyric','UI Test Party'),crew=[];
  for(let i=0;i<4;i++){const a=generateAdventurer('veyric');a.status='Ready';a.lvl=6;state.roster.push(a);crew.push(a)}
  p.members=crew.map(a=>a.id);p.captainId=crew[0].id;state.parties.push(p);gc250EnsureRiskBoard('veyric');
  state.ui.tab='company';state.ui.gc330CompanySub='overview';render();
  const nav=[...document.querySelectorAll('#nav .gc330NavBtn')].map(x=>x.dataset.tab),navOK=nav.join(',')==='you,company,contracts,world';
  const sub=[...document.querySelectorAll('.gc330Subnav button')].map(x=>x.dataset.value),subOK=sub.join(',')==='overview,people,parties,hq';
  const companyText=document.querySelector('.gc330Screen')?.innerText||'',noPatrol=!/\\bPatrol\\b/i.test(companyText);
  state.ui.tab='you';render();const youText=document.querySelector('.gc330Screen')?.innerText||'',stances=['Scout','Odd Jobs','Train','Recover'].every(x=>youText.includes(x)),independent=youText.includes('Independent Work');
  state.ui.tab='contracts';render();const contract=document.querySelector('.gc330ContractCard'),contractOK=!!contract&&/RISK/i.test(contract.innerText)&&/COMPANY REVENUE/i.test(contract.innerText)&&/qualified|Underqualified/i.test(contract.innerText);
  state.ui.tab='world';render();const worldOK=document.querySelectorAll('.gc330WorldRegion').length===5;
  const touch=[...document.querySelectorAll('#nav button')].every(x=>x.getBoundingClientRect().height>=44);
  const noOverflow=document.documentElement.scrollWidth<=document.documentElement.clientWidth+2;
  const copy=normalizeState(JSON.parse(JSON.stringify(state))),saveSafe=!!copy.ui;
  return{ok:!!(navOK&&subOK&&noPatrol&&stances&&independent&&contractOK&&worldOK&&touch&&noOverflow&&saveSafe),navOK,subOK,noPatrol,stances,independent,contractOK,worldOK,touch,noOverflow,saveSafe};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
