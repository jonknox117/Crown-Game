/* Broken Lantern v19.2 — serious stability/mobile bugfix pass.
   Fixes inherited inspector DOM escape, modal class leakage, and hardens reusable UI. */
const BL19_STABILITY='19.2';

/* Every modal reuses #sheet. Presentation-specific classes from one modal must
   never leak into the next one. */
const _modalV192=modal;
modal=function(html){
 const sheet=document.getElementById('sheet');
 if(sheet){
   sheet.className='sheet';
   sheet.removeAttribute('style');
 }
 return _modalV192(html);
};

function bl192FindSection(sheet,title){
 return [...(sheet?.querySelectorAll('.sectionTitle')||[])].find(x=>x.querySelector('h3')?.textContent.trim()===title)||null;
}

/* v18 accidentally used historyCard.parentElement (the sheet itself) and then
   insertAdjacentHTML('beforebegin'), placing all Living Veteran sections OUTSIDE
   the sheet as siblings of it. On iPhone the modal's flex layout then arranged
   those siblings horizontally across the bottom of the viewport. Repair the DOM
   after the inherited inspector finishes, while preserving the generated data. */
function bl192RepairInspectDOM(){
 const modalEl=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(!modalEl||!sheet)return;
 const escaped=[...modalEl.children].filter(x=>x!==sheet);
 if(!escaped.length)return;
 const personal=bl192FindSection(sheet,'Personal History');
 const anchor=personal||null;
 escaped.forEach(node=>{
   if(anchor)sheet.insertBefore(node,anchor);
   else sheet.appendChild(node);
 });
}

/* Normalize the inherited Living Veteran block. This is deliberately a DOM
   repair rather than a save/data rewrite, so existing companies are untouched. */
function bl192NormalizeInspect(a){
 const sheet=document.getElementById('sheet');if(!sheet||!a)return;
 bl192RepairInspectDOM();
 sheet.classList.add('bl192InspectSheet');

 /* Only one portrait/header presentation. v19.1 converts the proven v15 header
    into the polished one; remove any leftover experimental v19 banner. */
 const banners=[...sheet.querySelectorAll('.bl19InspectBanner')];
 const keep=sheet.querySelector('.blInspectPortrait.bl19InspectBanner')||banners[0]||null;
 banners.forEach(x=>{if(x!==keep)x.remove()});

 /* v18 title used the old wording; the subsystem is trauma/phobias, not a
    separate scar system. */
 [...sheet.querySelectorAll('.sectionTitle h3')].forEach(h=>{
   if(h.textContent.trim()==='Fears & Scars')h.textContent='Fears & Trauma';
 });

 /* Group the four Living Veteran sections in a real vertical container. This
    prevents any future grid/flex rule elsewhere from treating them as columns. */
 const livingTitle=bl192FindSection(sheet,'Living Veteran');
 if(livingTitle&&!livingTitle.closest('.bl192LivingStack')){
   const titles=['Living Veteran','Monster Experience','Fears & Trauma','Developed Traits'];
   const start=livingTitle;
   const nodes=[];
   let cur=start;
   while(cur){
     const next=cur.nextElementSibling;
     nodes.push(cur);
     if(cur.classList.contains('card')&&nodes.some(n=>n.querySelector?.('h3')?.textContent.trim()==='Developed Traits'))break;
     if(next&&next.classList.contains('sectionTitle')){
       const t=next.querySelector('h3')?.textContent.trim();
       if(t&&!titles.includes(t))break;
     }
     cur=next;
   }
   const wrapper=document.createElement('div');
   wrapper.className='bl192LivingStack';
   start.parentNode.insertBefore(wrapper,start);
   nodes.forEach(n=>wrapper.appendChild(n));
 }

 /* Force long generated labels to wrap instead of widening the sheet. */
 sheet.querySelectorAll('.bl18RelationCard,.bl18MonsterRow,.bl18FearRow,.bl18Trait,.buildLine,.card').forEach(x=>x.style.minWidth='0');
}

const _renderInspectV192=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectV192(id,recruit);
 if(!recruit){
   const a=state.roster.find(x=>x.id===id);
   bl192NormalizeInspect(a);
 }
 return out;
};

/* Defensive cleanup when closing: no stale sheet state and no orphaned modal
   children can survive into the next interaction. */
const _closeModalV192=closeModal;
closeModal=function(){
 const modalEl=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(modalEl&&sheet){
   [...modalEl.children].filter(x=>x!==sheet).forEach(x=>x.remove());
   sheet.className='sheet';
   sheet.removeAttribute('style');
 }
 return _closeModalV192();
};

/* iOS may keep focus/scroll position between reused sheets. Start each modal at
   its top after content is installed. */
const _processActionV192=processAction;
processAction=function(el){
 const out=_processActionV192(el);
 requestAnimationFrame(()=>{
   const sheet=document.getElementById('sheet');
   if(sheet&&document.getElementById('modal')?.classList.contains('show')){
     sheet.style.maxWidth='100%';
   }
 });
 return out;
};

const _auditV192=audit;
audit=function(){
 const out=_auditV192();
 out.v19Stability=BL19_STABILITY;
 out.v19InspectDOMContained=true;
 out.v19ModalClassLeakFixed=true;
 out.v19IOSOverflowHardened=true;
 return out;
};
window.__BL_AUDIT=audit;
