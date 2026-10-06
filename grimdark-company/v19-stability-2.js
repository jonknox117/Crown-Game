/* Broken Lantern v19.2 — secondary UI integrity pass. */

/* Keep modal sheet state deterministic even when a previous presentation wrapper
   added temporary classes after modal() returned. */
function bl192SanitizeSheet(){
 const sheet=document.getElementById('sheet');if(!sheet)return;
 const allowed=['sheet','bl192InspectSheet','bl19LootReveal','bl19MissionReport','bl19ChronicleSheet'];
 [...sheet.classList].forEach(c=>{if(!allowed.includes(c))sheet.classList.remove(c)});
}

/* A reusable inspector should never leave duplicate sections from repeated opens. */
function bl192DedupeInspect(){
 const sheet=document.getElementById('sheet');if(!sheet)return;
 const seen=new Map();
 [...sheet.querySelectorAll('.sectionTitle')].forEach(sec=>{
   const title=sec.querySelector('h3')?.textContent.trim();
   if(!title)return;
   if(['Living Veteran','Monster Experience','Fears & Trauma','Developed Traits'].includes(title)){
     if(seen.has(title)){
       const next=sec.nextElementSibling;
       sec.remove();
       if(next?.classList.contains('card'))next.remove();
     }else seen.set(title,sec);
   }
 });
}

const _renderInspectV192B=renderInspect;
renderInspect=function(id,recruit=false){
 const out=_renderInspectV192B(id,recruit);
 if(!recruit){
   bl192RepairInspectDOM();
   bl192DedupeInspect();
   const sheet=document.getElementById('sheet');
   if(sheet){
     sheet.classList.add('bl192InspectSheet');
     sheet.scrollTop=0;
   }
 }
 return out;
};

/* Make the reusable modal resilient to any future direct-child insertion bug. */
const _renderV192B=render;
render=function(){
 const modalEl=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(modalEl&&sheet&&!modalEl.classList.contains('show')){
   [...modalEl.children].filter(x=>x!==sheet).forEach(x=>x.remove());
 }
 return _renderV192B();
};

const _auditV192B=audit;
audit=function(){
 const out=_auditV192B();
 out.v19InspectDedupe=true;
 out.v19ModalDirectChildGuard=true;
 return out;
};
window.__BL_AUDIT=audit;
