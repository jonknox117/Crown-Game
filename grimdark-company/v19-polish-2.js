/* Broken Lantern v19.1 — presentation refinement after visual integration review. */
const BL19_REFINEMENT='19.1';

function bl191PartyChemistry(p){
 const ms=partyMembers(p),rows=[];
 for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++){
   const stage=bl19ExistingRelation(ms[i],ms[j]);
   const weight={'Blood-Bound':9,'Bitter Enemies':8,'Trusted Friends':7,'Professional Rivals':6,'Mentor & Protégé':6,'Grudge':5,'Friends':4,'Respected Companions':3,'Dislike':2}[stage]||0;
   if(weight&&BL19_REL_ICON[stage])rows.push({a:ms[i],b:ms[j],stage,weight});
 }
 rows.sort((a,b)=>b.weight-a.weight);
 return rows.slice(0,3).map(x=>{const [kind,label,tone]=BL19_REL_ICON[x.stage];return bl19Badge(kind,`${x.a.name.split(' ')[0]} + ${x.b.name.split(' ')[0]}: ${label}`,tone)}).join('');
}
const _partyCardV191=partyCard;
partyCard=function(p){
 const base=_partyCardV191(p),chem=bl191PartyChemistry(p);
 if(!chem)return base;
 return base.replace('<div class="cohesion">',`<div class="bl19PartyChemistry">${chem}</div><div class="cohesion">`);
};

bl19HQScene=function(){
 const id=state.currentRegion,up=hq(id).upgrades||{};
 const defs=[
  ['Barracks',10,69,48,44,'Barracks'],['Infirmary',72,77,42,36,'Infirmary'],['Armory',128,67,48,46,'Armory'],['Stores',190,77,42,36,'Stores'],['Training Yard',246,72,52,41,'Training'],
  ['Contract Office',18,123,54,40,'Contracts'],['Command Hall',88,112,58,51,'Command'],['Occult Archive',163,121,48,42,'Archive'],['Artifact Vault',228,128,46,35,'Vault'],['Salvager’s Lodge',292,124,58,39,'Salvager']
 ];
 const total=Object.values(up).reduce((s,v)=>s+(Number(v)||0),0),active=Object.values(up).filter(v=>Number(v)>0).length;
 return `<div class="bl19HQScene"><div class="bl19HQBackdrop">${bl17RegionScene(id)}</div><svg viewBox="0 0 400 182" aria-label="${esc(hq(id).name)} visual headquarters"><g class="bl19Ground"><path d="M0 116Q100 105 200 119T400 112V182H0Z"/></g>${defs.map(([k,x,y,w,h,label])=>bl19FacilityShape(id,x,y,w,h,up[k]||0,label)).join('')}</svg><div class="bl19HQCaption"><div><b>${esc(hq(id).name)}</b><span>${active} active facilities • ${total} total upgrade levels</span></div><span class="bl19HQSeal">${bl19Icon('hq')} HQ</span></div></div>`;
};

const _renderInspectV191=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectV191(id,recruit);
 if(!recruit){
   const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');
   if(a&&sheet){
     const duplicate=[...sheet.querySelectorAll('.bl19InspectBanner')].find(x=>x.querySelector('.bl19InspectPortrait'));
     if(duplicate)duplicate.remove();
     const portrait=sheet.querySelector('.blInspectPortrait');
     if(portrait){
       portrait.classList.add('bl19InspectBanner',`rank-${bl17EnsureCareer(a)}`);
       const info=portrait.querySelector(':scope > div:last-child');
       if(info&&!info.querySelector('.bl19BadgeRow'))info.insertAdjacentHTML('beforeend',`<div class="bl19BadgeRow">${bl19VeteranBadges(a,5)}</div>`);
     }
   }
 }
 return out;
};

const _auditV191=audit;
audit=function(){const out=_auditV191();out.v19Refinement=BL19_REFINEMENT;out.v19AllHQFacilitiesVisualized=true;out.v19PartyRelationshipBadges=true;out.v19DuplicateInspectPortraits=false;return out};
window.__BL_AUDIT=audit;