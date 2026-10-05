(function(){
'use strict';

// The older quality layer binds tactic buttons by data attributes. The v7
// culture party card replaced that markup, so restore those hooks here and
// then bind to the v7 tactic setter after the legacy wire pass has finished.
const oldWireCulture8=wire;
wire=function(){
 oldWireCulture8();
 document.querySelectorAll('.tacticBtn').forEach(b=>{
  const card=b.closest('.card');
  const partyName=card?.querySelector('.statline b')?.textContent?.trim();
  const p=state.parties.find(x=>x.name===partyName);
  const tactic=b.textContent.trim();
  if(!p)return;
  b.dataset.party=p.id;b.dataset.tactic=tactic;
  b.onclick=e=>{e.stopPropagation();if(window.blSetTactic7)blSetTactic7(p.id,tactic)};
 });
};

// Also make the current cultural context visible on the HQ landing screen.
const oldHQCulture8=renderHQ;
renderHQ=function(){
 let html=oldHQCulture8();
 html=html.replace('GREYHAVEN • THE GRAVEN MARCH','GREYHAVEN • THE GRAVEN MARCH • VEYRIC MARCHES');
 return html;
};

state.version=Math.max(state.version||1,8);save();setTimeout(()=>render(),0);
})();
