/* Broken Lantern v19.2 — lightweight runtime invariants for the stability pass. */
function bl192RuntimeCheck(){
 const issues=[];
 const modalEl=document.getElementById('modal'),sheet=document.getElementById('sheet');
 if(!modalEl||!sheet)issues.push('modal structure missing');
 if(modalEl&&sheet&&[...modalEl.children].some(x=>x!==sheet))issues.push('orphan modal children');
 if(sheet&&sheet.scrollWidth>sheet.clientWidth+2)issues.push('sheet horizontal overflow');
 if(sheet&&sheet.querySelectorAll('.bl19InspectBanner').length>1)issues.push('duplicate inspect banner');
 return{ok:issues.length===0,issues};
}
const _auditV192C=audit;
audit=function(){const out=_auditV192C();out.v19RuntimeIntegrityCheck='bl192RuntimeCheck';return out};
window.__BL_AUDIT=audit;
window.__BL19_RUNTIME_CHECK=bl192RuntimeCheck;
