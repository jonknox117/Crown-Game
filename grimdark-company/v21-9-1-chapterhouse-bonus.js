/* Broken Lantern v21.9.1 — make Chapterhouse leadership visible on YOU.
   The displayed percentage always comes from the actual simulation multiplier. */
const GC391_VERSION='21.9.1';

function gc391HomePresence(rid){
 const f=gc260Founder(),r=state?.regions?.[rid];
 if(!f||!r)return null;
 const potential=Math.round((gc390Power(f,'director')-1)*100);
 if(gc270IsFreeblade()||!r.hq?.established){
  return{
   label:'HOME • LEADERSHIP LOCKED',
   badge:'LOCKED',
   kind:'locked',
   description:'Found your company here to unlock your HQ director bonus. With your current Level '+(f.lvl||1)+' and '+gc360RankName(f)+' career, that would be +'+potential+'% output to Scout, Odd Jobs, Train and Recover while you are present. No HQ director bonus is active yet.'
  };
 }
 const director=gc390Director(rid);
 if(director?.a){
  const a=director.a,pct=Math.round((gc390Power(a,'director')-1)*100);
  return{
   label:director.source==='Commander'?'HOME • COMMANDER LEADING':'HOME • YOU ARE LEADING',
   badge:'+'+pct+'%',
   kind:'active',
   description:director.source==='Commander'
    ?a.name+' (Level '+(a.lvl||1)+', '+gc360RankName(a)+') provides +'+pct+'% to all four HQ stances as appointed commander. Your personal presence does not add a second director bonus.'
    :'Your presence provides +'+pct+'% to Scout, Odd Jobs, Train and Recover at this HQ. This is based on your Level '+(a.lvl||1)+' and '+gc360RankName(a)+' career. Leaving the Chapterhouse ends this director bonus until you return or appoint a commander.'
  };
 }
 return{
  label:'HOME • LEADERSHIP INACTIVE',badge:'0%',kind:'inactive',
  description:'Your HQ director bonus is inactive. Be Ready and physically at the Chapterhouse to lead, or appoint a commander to provide the bonus while you are away.'
 };
}

const _gc340TownHTMLGC391=gc340TownHTML;
gc340TownHTML=function(){
 const html=_gc340TownHTMLGC391();
 const f=gc260Founder(),pr=gc340SyncPresence();
 if(!f||!pr||pr.mode!=='town'||pr.place!=='hall')return html;
 const info=gc391HomePresence(f.regionId);
 if(!info)return html;
 const def=gc340TownDef(f.regionId)?.hall;
 if(!def)return html;
 const head='<span>HOME</span><b>'+esc(def.name)+'</b>';
 const body='<small>'+esc(def.desc)+'</small></div></div><p>';
 if(!html.includes(head)||!html.includes(body))return html;
 return html.replace(head,'<span data-gc391-presence-label>'+esc(info.label)+'</span><b>'+esc(def.name)+'</b>')
  .replace(body,'<small>'+esc(def.desc)+'</small></div><strong class="gc391Bonus '+info.kind+'" data-gc391-presence-bonus>'+esc(info.badge)+'</strong></div><p>')
  .replace('This is your neutral management location.','<span data-gc391-presence-description>'+esc(info.description)+'</span>');
};

function gc391InstallStyles(){
 if(document.getElementById('gc391Styles'))return;
 const s=document.createElement('style');s.id='gc391Styles';
 s.textContent=[
  '.gc340PlacePanel .gc391Bonus{white-space:nowrap;align-self:center;font-size:15px}',
  '.gc340PlacePanel .gc391Bonus.active{color:#d0ae6d}',
  '.gc340PlacePanel .gc391Bonus.locked{font-size:10px;color:#c39a68;letter-spacing:.08em}',
  '.gc340PlacePanel .gc391Bonus.inactive{color:#958675}',
  '.gc340PlacePanel [data-gc391-presence-label]{font-size:8px;letter-spacing:.08em;color:#caa86d}',
  '.gc340PlacePanel [data-gc391-presence-description]{font-size:10px;line-height:1.6;color:#c5b39a}',
  '.gc340PlacePanel:has([data-gc391-presence-bonus]){border-color:rgba(197,151,83,.30);background:linear-gradient(160deg,#191611,#11100e)}'
 ].join('');
 document.head.appendChild(s);
}
gc391InstallStyles();

const _auditGC391=audit;
audit=function(){
 const a=_auditGC391();
 a.v391ChapterhouseDisplay=GC391_VERSION;
 a.directorBonusVisibleOnYouTab=true;
 a.preFoundingBonusExplicitlyLocked=true;
 a.managerAndFounderBonusVisibleWithLevelAndRarity=true;
 return a;
};
window.__BL_AUDIT=audit;
