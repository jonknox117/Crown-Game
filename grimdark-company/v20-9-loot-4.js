/* Grim Company v20.9 — loot presentation, finish hooks and self-test. */
const _gc193FinishNoTimeGC290=gc193FinishNoTime;
gc193FinishNoTime=function(p){
 const e=p?.expedition,c=e?.contract;
 if(!e||!c)return _gc193FinishNoTimeGC290(p);
 let bonus=0;
 partyMembers(p).forEach(a=>gc290EachPower(a,pow=>{if(pow.trigger==='lootPassive')bonus+=Number(pow.cache)||0}));
 const original=Number(c.cacheChance)||0;
 if(bonus)c.cacheChance=clamp(original+bonus,0,.98);
 const out=_gc193FinishNoTimeGC290(p);
 c.cacheChance=original;
 return out;
};

function gc290InstallStyles(){
 if(document.getElementById('gc290Styles'))return;
 const st=document.createElement('style');st.id='gc290Styles';
 st.textContent='.gc290PowerList{margin-top:7px;padding-top:6px;border-top:1px solid rgba(190,150,88,.2)}.gc290Power{margin:4px 0;padding:5px 7px;border-left:2px solid #a97b43;background:rgba(169,123,67,.055)}.gc290Power b{display:block;font-size:9px;color:#d9b36d}.gc290Power span{display:block;margin-top:2px;font-size:8px;line-height:1.35;color:#a99b87}.gc290LegendaryCallout{margin-top:5px;font-size:8px;color:#d6ad55;letter-spacing:.08em}';
 document.head.appendChild(st);
}
gc290InstallStyles();

const _itemHTMLGC291=itemHTML;
itemHTML=function(item){
 let html=_itemHTMLGC291(item);
 const powers=gc290PowerHTML(item);
 if(!powers)return html;
 const tag=item.gc291Legendary?'<div class="gc290LegendaryCallout">NAMED LEGENDARY • RULE-BENDING EFFECTS</div>':'';
 return html.replace('</div></div>',tag+powers+'</div></div>');
};

window.__GC290_TEST=function(){
 const old=state;
 try{
  state=createState('Loot Test','veyric');
  const a=generateAdventurer('veyric'),item=generateItem('veyric',4);
  a.gear[item.slot]=item;state.roster=[a];
  const powers=gc290Powers(item);
  const legendary=!!item.gc291Legendary&&powers.length>=2&&GC291_LEGENDARIES.some(x=>x.name===item.name);
  const clone=normalizeState(JSON.parse(JSON.stringify(state)));
  const migrated=clone.roster[0].gear[item.slot].gc290Version===GC291_VERSION;
  const html=itemHTML(item),visible=powers.every(p=>html.includes(p.name));
  const rare=gc290EnchantItem({id:'rare-test',name:'Rare Test',slot:'charm',rarity:2,mods:[],baseValue:10});
  const rarePower=gc290Powers(rare).length===1;
  return{ok:!!(legendary&&migrated&&visible&&rarePower),legendary,name:item.name,powers:powers.length,migrated,visible,rarePower,templates:GC291_LEGENDARIES.length};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}finally{state=old}
};
