/* Grim Company v20.9 — Build-Defining Loot: item power schema, migration and generation. */
const GC290_VERSION='20.9';
const GC291_VERSION='20.9.1';

function gc290Hash(v){
 let h=2166136261>>>0;for(const ch of String(v||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return h>>>0;
}
function gc290PickSeeded(list,seed){return list.length?list[Math.abs(Number(seed)||0)%list.length]:null}
function gc290Power(id,name,trigger,desc,extra={}){return{id,name,trigger,desc,...extra}}
const GC290_POWER_POOLS={
 weapon:[
  gc290Power('first_cut','First Cut','firstAttack','First landed attack each battle deals +35% damage.',{amount:.35}),
  gc290Power('executioner','Executioner','attackLowTarget','Deals +35% damage to enemies below 35% HP.',{amount:.35,threshold:.35}),
  gc290Power('bossbane','Bossbane','attackBoss','Deals +30% damage to named or Campaign enemies.',{amount:.30}),
  gc290Power('blood_return','Blood Return','kill','Killing an enemy restores 12% maximum HP.',{heal:.12}),
  gc290Power('red_momentum','Red Momentum','killFury','Each kill grants +8% Attack for the rest of that battle.',{amount:.08,max:4}),
  gc290Power('supernatural_edge','Witch Edge','attackSupernatural','Deals +28% damage to supernatural enemies.',{amount:.28})
 ],
 armor:[
  gc290Power('iron_low','Iron Below','lowHpGuard','While below 35% HP, incoming damage is reduced by 35%.',{amount:.35,threshold:.35}),
  gc290Power('second_wind','Second Wind','lowHpHeal','Once per battle on falling below 30% HP, heal 18% maximum HP.',{heal:.18,threshold:.30}),
  gc290Power('steady_plate','Steady Plate','battleStart','Gain +12% Guard and +6 Resolve for the battle.',{guard:.12,resolve:6}),
  gc290Power('endure_mail','Road-Hardened','static','+8 Endure.',{util:{endure:8}}),
  gc290Power('horror_ward','Horror Ward','battleStartHorror','Against horror enemies, gain +18% Guard and +8 Resolve.',{guard:.18,resolve:8})
 ],
 charm:[
  gc290Power('scout_lens','Pathfinder Lens','static','+8 Scout.',{util:{scout:8}}),
  gc290Power('shadow_token','Shadow Token','static','+8 Sneak.',{util:{sneak:8}}),
  gc290Power('silver_tongue','Silver Tongue','static','+8 Talk.',{util:{talk:8}}),
  gc290Power('occult_focus','Occult Focus','static','+9 Occult.',{util:{occult:9}}),
  gc290Power('trail_charm','Trail Charm','static','+8 Endure.',{util:{endure:8}}),
  gc290Power('field_pay','Negotiator Seal','fieldSuccessTalk','Successful Talk checks add another +8% contract pay.',{pay:.08}),
  gc290Power('field_scout','Wayfinder Mark','fieldSuccessScout','Successful Scout checks reduce future hostile-contact pressure by another 8%.',{contact:-.08}),
  gc290Power('occult_shelter','Seal Against Night','fieldFailOccult','Occult failure cannot add Horror Pressure.',{}),
  gc290Power('loot_eye','Finder’s Knot','fieldSuccess','Any successful field check adds +8% cache chance.',{cache:.08})
 ]
};

const GC291_LEGENDARIES=[
 {slot:'weapon',name:'WIDOWMAKER',former:false,powers:[
  gc290Power('legend_widow_first','Perfect Opening','firstAttack','First landed attack each battle deals +75% damage.',{amount:.75}),
  gc290Power('legend_widow_cost','Glass Edge','static','+10 Attack, -6 Guard.',{combat:{attack:10,guard:-6}})
 ]},
 {slot:'weapon',name:'KINGSLAYER',powers:[
  gc290Power('legend_king_boss','Kingslayer','attackBoss','Deals +60% damage to named or Campaign enemies.',{amount:.60}),
  gc290Power('legend_king_blood','Claim the Crown','killBoss','Killing a named enemy restores 35% maximum HP.',{heal:.35})
 ]},
 {slot:'weapon',name:'THE RED LEDGER',powers:[
  gc290Power('legend_red_kill','Every Name Is Written','killFury','Each kill grants +15% Attack for the rest of the battle, stacking up to five times.',{amount:.15,max:5}),
  gc290Power('legend_red_static','Debt Collector','static','+6 Attack and +4 Resolve.',{combat:{attack:6,resolve:4}})
 ]},
 {slot:'weapon',name:'STARFALL PIKE',powers:[
  gc290Power('legend_star_horror','Pierce the Impossible','attackSupernatural','Deals +55% damage to supernatural enemies.',{amount:.55}),
  gc290Power('legend_star_open','Falling Star','battleStart','Party wielder gains +20% Attack for the first battle round.',{firstRoundAttack:.20})
 ]},
 {slot:'armor',name:'THE LAST OATH',powers:[
  gc290Power('legend_oath_save','Not While I Stand','saveAlly','Once per expedition, when another ally would be brought down, leave them at 1 HP and transfer the blow to the wearer.',{transfer:.55}),
  gc290Power('legend_oath_guard','Oathbound Plate','static','+7 Guard and +5 Resolve.',{combat:{guard:7,resolve:5}})
 ]},
 {slot:'armor',name:'IRON SAINT',powers:[
  gc290Power('legend_saint_low','Saint of the Last Inch','lowHpGuard','Below 35% HP, incoming damage is reduced by 55%.',{amount:.55,threshold:.35}),
  gc290Power('legend_saint_wind','Refuse the Grave','lowHpHeal','Once per battle on falling below 30% HP, heal 25% maximum HP.',{heal:.25,threshold:.30})
 ]},
 {slot:'armor',name:'PILGRIM’S BASTION',powers:[
  gc290Power('legend_pilgrim_start','Unbroken March','battleStart','Gain +18% Guard and +10 Resolve for the battle.',{guard:.18,resolve:10}),
  gc290Power('legend_pilgrim_endure','Road Without End','static','+14 Endure.',{util:{endure:14}})
 ]},
 {slot:'armor',name:'GRAVEPLATE',powers:[
  gc290Power('legend_grave_horror','Nothing Left to Fear','battleStartHorror','Against horror enemies, gain +30% Guard and +12 Resolve.',{guard:.30,resolve:12}),
  gc290Power('legend_grave_static','Grave Weight','static','+10 Guard, -3 Speed.',{combat:{guard:10,speed:-3}})
 ]},
 {slot:'charm',name:'BLACKMERE LANTERN',powers:[
  gc290Power('legend_lantern_occult','See the Pattern','static','+16 Occult.',{util:{occult:16}}),
  gc290Power('legend_lantern_fail','No Door Opens Twice','fieldFailOccult','Occult failure cannot add Horror Pressure.',{}),
  gc290Power('legend_lantern_find','Light Behind the Wall','fieldSuccessOccult','Occult success adds +18% cache chance.',{cache:.18})
 ]},
 {slot:'charm',name:'WAYFINDER’S EYE',powers:[
  gc290Power('legend_eye_skills','Every Road at Once','static','+11 Scout and +9 Sneak.',{util:{scout:11,sneak:9}}),
  gc290Power('legend_eye_success','The Safer Line','fieldSuccessScout','Scout success reduces future hostile-contact pressure by another 14%.',{contact:-.14})
 ]},
 {slot:'charm',name:'RAVEN COIN',powers:[
  gc290Power('legend_raven_fail','Bad Luck, Paid Once','fieldFailureSoften','Once per expedition, soften a failed field check: restore half HP loss and halve newly added pressure.',{}),
  gc290Power('legend_raven_luck','Coin on Edge','static','+5 to every field skill.',{util:{talk:5,sneak:5,scout:5,endure:5,occult:5}})
 ]},
 {slot:'charm',name:'OATH RING',powers:[
  gc290Power('legend_ring_bond','No One Fights Alone','bondBattle','If the wearer has a Friend or better in the party, gain +18% Attack and Guard in battle.',{amount:.18}),
  gc290Power('legend_ring_talk','Known by Deeds','static','+8 Talk and +4 Resolve.',{util:{talk:8},combat:{resolve:4}})
 ]}
];

function gc290Powers(item){return Array.isArray(item?.gc290Powers)?item.gc290Powers:[]}
function gc290LegendFor(item){
 const list=GC291_LEGENDARIES.filter(x=>x.slot===item.slot);return gc290PickSeeded(list,gc290Hash(item.id||item.name));
}
function gc290ClonePower(p){return JSON.parse(JSON.stringify(p))}
function gc290EnchantItem(item,opts={}){
 if(!item)return item;
 if(item.gc290Version===GC291_VERSION&&Array.isArray(item.gc290Powers))return item;
 item.gc290Powers=Array.isArray(item.gc290Powers)?item.gc290Powers:[];
 const rarity=clamp(Number(item.rarity)||0,0,4),seed=gc290Hash(item.id||item.name);
 if(rarity>=4){
  const leg=gc290LegendFor(item);
  if(leg){
   if(!item.gc291FormerName)item.gc291FormerName=item.name;
   item.name=leg.name;item.gc291Legendary=true;item.gc290Powers=leg.powers.map(gc290ClonePower);
   item.baseValue=Math.max(Number(item.baseValue)||1,420);
  }
 }else if(rarity>=2&&!item.gc290Powers.length){
  const pool=(GC290_POWER_POOLS[item.slot]||[]).slice(),count=rarity===3?2:1;
  for(let i=0;i<count&&pool.length;i++){const idx=(seed+i*17)%pool.length;item.gc290Powers.push(gc290ClonePower(pool.splice(idx,1)[0]))}
 }
 item.gc290Version=GC291_VERSION;return item;
}
function gc290MigrateState(s){
 if(!s)return s;
 (s.inventory||[]).forEach(e=>gc290EnchantItem(e.item));
 (s.roster||[]).forEach(a=>Object.values(a.gear||{}).forEach(gc290EnchantItem));
 Object.values(s.regions||{}).forEach(r=>(r.market?.stock||[]).forEach(x=>gc290EnchantItem(x.item)));
 return s;
}
const _normalizeStateGC290=normalizeState;
normalizeState=function(s){return gc290MigrateState(_normalizeStateGC290(s))};
const _createStateGC290=createState;
createState=function(name,startRegion='veyric'){return gc290MigrateState(_createStateGC290(name,startRegion))};
const _generateItemGC290=generateItem;
generateItem=function(regionId,rarity=null){return gc290EnchantItem(_generateItemGC290(regionId,rarity),{newItem:true})};

function gc290EachPower(a,fn){gearItems(a).forEach(item=>gc290Powers(item).forEach(p=>fn(p,item)))}
const _derivedGC290=derived;
derived=function(a){
 const d=_derivedGC290(a);
 gc290EachPower(a,p=>{
  if(p.trigger!=='static')return;
  Object.entries(p.combat||{}).forEach(([k,v])=>{if(k in d.combat)d.combat[k]+=v});
  Object.entries(p.util||{}).forEach(([k,v])=>{if(k in d.util)d.util[k]+=v});
  if(Number(p.maxHp))d.maxHp+=Number(p.maxHp);
 });
 Object.keys(d.combat).forEach(k=>d.combat[k]=Math.max(1,Math.round(d.combat[k])));
 Object.keys(d.util).forEach(k=>d.util[k]=Math.max(0,Math.round(d.util[k])));
 d.maxHp=Math.max(1,Math.round(d.maxHp));return d;
};

function gc290PowerHTML(item){
 const ps=gc290Powers(item);if(!ps.length)return'';
 return '<div class="gc290PowerList">'+ps.map(p=>'<div class="gc290Power"><b>'+esc(p.name)+'</b><span>'+esc(p.desc)+'</span></div>').join('')+'</div>';
}
const _itemHTMLGC290=itemHTML;
itemHTML=function(item){let html=_itemHTMLGC290(item);const powers=gc290PowerHTML(item);if(powers)html=html.replace('</div></div>',powers+'</div></div>');return html};

const _auditGC290=audit;
audit=function(){const out=_auditGC290();out.v290Loot=GC290_VERSION;out.v291LegendaryArsenal=GC291_VERSION;out.itemTriggerEngine=true;out.rarityBehaviorIdentity=true;out.handAuthoredLegendaries=GC291_LEGENDARIES.length;out.oldGearMigrates=true;return out};
window.__BL_AUDIT=audit;
