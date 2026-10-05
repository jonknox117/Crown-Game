/* Broken Lantern v18 — Living Veterans.
   Expands relationships, monster mastery, trauma/phobias, evolving traits, and company chronicle.
   Designed as an additive layer on top of v16 Living Company + v17 Career/SVG systems. */

const BL18_VERSION=18;

const BL18_MONSTER_RANKS=[
 {name:'Unfamiliar',min:0},
 {name:'Familiar',min:12},
 {name:'Experienced',min:30},
 {name:'Hunter',min:65},
 {name:'Slayer',min:120}
];

const BL18_TRAITS={
 Protective:{cat:'personality',desc:'More likely to protect companions; gains Guard.',combat:{guard:3}},
 'Hard to Kill':{cat:'distinction',desc:'Repeatedly survived being brought down; gains maximum HP and Resolve.',combat:{resolve:3},maxHp:8},
 'Keen-Eyed':{cat:'personality',desc:'Repeated field success sharpened awareness.',combat:{accuracy:2},util:{scout:4}},
 'Monster Scholar':{cat:'distinction',desc:'Broad monster experience improves supernatural field work.',util:{scout:2,occult:3}},
 'Steady Nerves':{cat:'personality',desc:'Many battles without breaking hardened their nerves.',combat:{resolve:4}},
 Reckless:{cat:'personality',desc:'Aggressive habits increase Attack but reduce Guard.',combat:{attack:4,guard:-2}},
 Cautious:{cat:'personality',desc:'A defensive veteran who gives up some offense for survival.',combat:{guard:4,attack:-1}},
 'Survivor’s Guilt':{cat:'trauma',desc:'Carries the deaths of close companions.',combat:{resolve:-3}},
 'Night Terrors':{cat:'trauma',desc:'Bad memories erode Resolve.',combat:{resolve:-2}},
 'Glory Hound':{cat:'personality',desc:'Chases decisive blows; stronger Attack, slightly weaker Resolve.',combat:{attack:3,resolve:-1}},
 'Natural Leader':{cat:'distinction',desc:'Repeated command experience steadies the party.',combat:{resolve:2},util:{talk:3}},
 Vindictive:{cat:'personality',desc:'Turns grudges into aggression.',combat:{attack:2}},
 'Grave-Hardened':{cat:'distinction',desc:'Conquered a serious supernatural fear.',combat:{resolve:2},util:{occult:2}}
};

function bl18Clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function bl18PairKey(a,b){return[a,b].sort().join('|')}

function bl18State(s=state){
 if(!s)return null;
 s.livingVeterans=s.livingVeterans||{};
 const lv=s.livingVeterans;
 lv.version=BL18_VERSION;
 lv.relationships=lv.relationships||{};
 lv.chronicle=lv.chronicle||[];
 lv.fallen=lv.fallen||[];
 lv.milestones=lv.milestones||{};
 lv.hqMilestones=lv.hqMilestones||{};
 lv.recentChanges=lv.recentChanges||[];
 return lv;
}

function bl18InitAdventurer(a){
 if(!a)return a;
 a.veteran=a.veteran||{};
 a.veteran.monsters=a.veteran.monsters||{};
 a.veteran.fears=a.veteran.fears||{};
 a.veteran.developedTraits=a.veteran.developedTraits||[];
 a.veteran.behavior=a.veteran.behavior||{};
 const b=a.veteran.behavior;
 ['protective','reckless','cautious','survivor','fieldcraft','grief','battles','cleanWins','leadership'].forEach(k=>b[k]=Number(b[k])||0);
 return a;
}

function bl18Family(species=''){
 const s=String(species).toLowerCase();
 if(/goblin|hobgoblin|orc raider|greenskin/.test(s))return'Goblinoids';
 if(/ghoul|zombie|skeleton|wight|draugr|wraith|barrow|restless dead|undead/.test(s))return'Restless Dead';
 if(/troll/.test(s))return'Trollkin';
 if(/giant|jotunn|jötunn/.test(s))return'Giants';
 if(/wolf|werewolf|cursed beast|hyena|predator/.test(s))return'Cursed Beasts';
 if(/yokai|yōkai/.test(s))return'Yōkai';
 if(/oni/.test(s))return'Oni';
 if(/spirit|ghost|specter/.test(s))return'Spirits';
 if(/nightkin|night stalker|bone hyena/.test(s))return'Nightkin';
 if(/great beast|sea-beast|sea beast/.test(s))return'Great Beasts';
 if(/storm/.test(s))return'Storm Creatures';
 if(/horror|void/.test(s))return'Horrors';
 if(/fallen|seraph|celestial/.test(s))return'Fallen Celestials';
 if(/aberration|pattern|impossible/.test(s))return'Aberrations';
 if(/dragon|ryu|ryū/.test(s))return'Dragons';
 if(/ogre/.test(s))return'Ogres';
 return String(species||'Unknown Threat');
}

function bl18Monster(a,family){
 bl18InitAdventurer(a);
 const m=a.veteran.monsters;
 m[family]=m[family]||{xp:0,encounters:0,wins:0,losses:0,kills:0,downs:0};
 return m[family];
}
function bl18MonsterRank(rec){
 let r=0;
 for(let i=1;i<BL18_MONSTER_RANKS.length;i++)if((rec?.xp||0)>=BL18_MONSTER_RANKS[i].min)r=i;
 return r;
}
function bl18MonsterRankName(rec){return BL18_MONSTER_RANKS[bl18MonsterRank(rec)].name}

function bl18Fear(a,family){
 bl18InitAdventurer(a);
 const f=a.veteran.fears;
 f[family]=f[family]||{trauma:0,peak:0,cleanWins:0,hardened:false};
 return f[family];
}
function bl18FearStage(f){
 const t=Number(f?.trauma)||0;
 if(t>=45)return 3;
 if(t>=25)return 2;
 if(t>=12)return 1;
 return 0;
}
function bl18FearName(f,family){
 const n=bl18FearStage(f);
 if(f?.hardened&&n===0)return`${family}-Hardened`;
 return n===3?`${family} Phobia`:n===2?`Fear of ${family}`:n===1?`Uneasy Around ${family}`:'';
}

function bl18Chronicle(text,regionId=state?.currentRegion,memberIds=[],kind='major'){
 if(!state||!text)return;
 const lv=bl18State();
 const last=lv.chronicle[lv.chronicle.length-1];
 if(last&&last.day===state.company.day&&last.text===text)return last;
 const ev={id:uid('chron'),day:state.company.day,regionId,text,memberIds:[...memberIds],kind};
 lv.chronicle.push(ev);
 if(lv.chronicle.length>220)lv.chronicle.splice(0,lv.chronicle.length-220);
 return ev;
}
function bl18Change(text){
 const lv=bl18State();
 lv.recentChanges.push({day:state.company.day,text});
 if(lv.recentChanges.length>18)lv.recentChanges.splice(0,lv.recentChanges.length-18);
}

function bl18Rel(a,b){
 const lv=bl18State(),key=bl18PairKey(a.id,b.id);
 if(!lv.relationships[key]){
   const old=typeof relValue==='function'?relValue(a.id,b.id):0;
   lv.relationships[key]={
     a:a.id,b:b.id,
     affinity:bl18Clamp(old,-100,100),
     trust:bl18Clamp(old>0?Math.round(old*.8):0,0,100),
     respect:bl18Clamp(Math.round(Math.abs(old)*.35),0,100),
     tension:bl18Clamp(old<0?Math.round(Math.abs(old)*.9):0,0,100),
     sharedMissions:0,rescues:0
   };
 }
 return lv.relationships[key];
}
function bl18RelationStage(r,a,b){
 if(!r)return'Acquaintances';
 if(r.tension>=70&&r.affinity<=-25)return'Bitter Enemies';
 if(r.tension>=48&&r.respect>=38)return'Professional Rivals';
 if(r.tension>=45)return'Grudge';
 if(r.trust>=78&&r.affinity>=48)return'Blood-Bound';
 if(r.trust>=55&&r.affinity>=28)return'Trusted Friends';
 if(r.respect>=55&&Math.abs((a?.lvl||1)-(b?.lvl||1))>=2&&r.trust>=30)return'Mentor & Protégé';
 if(r.affinity>=22)return'Friends';
 if(r.respect>=38)return'Respected Companions';
 if(r.affinity<=-25)return'Dislike';
 return'Acquaintances';
}
function bl18SyncLegacy(a,b,r){
 if(typeof setRel!=='function')return;
 const score=bl18Clamp(Math.round(r.affinity+r.trust*.32+r.respect*.16-r.tension*.58),-100,100);
 setRel(a.id,b.id,score);
}
function bl18AdjustRelation(a,b,deltas={},reason=''){
 if(!a||!b||a.id===b.id)return;
 const r=bl18Rel(a,b),before=bl18RelationStage(r,a,b);
 r.affinity=bl18Clamp(r.affinity+(deltas.affinity||0),-100,100);
 r.trust=bl18Clamp(r.trust+(deltas.trust||0),0,100);
 r.respect=bl18Clamp(r.respect+(deltas.respect||0),0,100);
 r.tension=bl18Clamp(r.tension+(deltas.tension||0),0,100);
 if(deltas.sharedMissions)r.sharedMissions+=deltas.sharedMissions;
 if(deltas.rescues)r.rescues+=deltas.rescues;
 bl18SyncLegacy(a,b,r);
 const after=bl18RelationStage(r,a,b);
 if(after!==before&&after!=='Acquaintances'){
   const text=`${a.name} and ${b.name} became ${after.toLowerCase()}${reason?` after ${reason}.`:'.'}`;
   if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id,b.id],['Blood-Bound','Bitter Enemies'].includes(after)?'major':'normal');
   bl18Change(text);
 }
}

function bl18TraitCount(a,cat){return bl18InitAdventurer(a).veteran.developedTraits.filter(t=>BL18_TRAITS[t]?.cat===cat).length}
function bl18HasTrait(a,name){return bl18InitAdventurer(a).veteran.developedTraits.includes(name)}
function bl18AddTrait(a,name,why=''){
 const def=BL18_TRAITS[name];
 if(!a||!def||bl18HasTrait(a,name))return false;
 const caps={personality:3,trauma:2,distinction:2};
 if(bl18TraitCount(a,def.cat)>=(caps[def.cat]||3))return false;
 a.veteran.developedTraits.push(name);
 const text=`${a.name} developed ${name}${why?` — ${why}`:''}.`;
 if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id],def.cat==='distinction'?'major':'normal');
 bl18Change(text);
 return true;
}

function bl18MaybeTraits(a){
 if(!a||a.status==='Dead')return;
 const v=bl18InitAdventurer(a).veteran,b=v.behavior;
 if(b.protective>=5)bl18AddTrait(a,'Protective','repeatedly putting themselves between danger and companions');
 if(b.survivor>=3)bl18AddTrait(a,'Hard to Kill','surviving repeated battlefield collapses');
 if(b.fieldcraft>=8)bl18AddTrait(a,'Keen-Eyed','repeated successful field work');
 if(b.battles>=18&&b.cleanWins>=10&&Object.values(v.fears).every(f=>bl18FearStage(f)<=1))bl18AddTrait(a,'Steady Nerves','a long record of facing danger without breaking');
 if(b.reckless>=7)bl18AddTrait(a,'Reckless','a career of aggressive tactics');
 if(b.cautious>=7)bl18AddTrait(a,'Cautious','a career built around survival and disciplined retreats');
 if(b.grief>=2)bl18AddTrait(a,'Survivor’s Guilt','too many close companions did not come home');
 if((a.legacy?.legendaryKills||0)>=2)bl18AddTrait(a,'Glory Hound','repeated legendary kills changed how they seek battle');
 if(b.leadership>=8)bl18AddTrait(a,'Natural Leader','repeatedly leading parties through contracts');
 const broad=Object.values(v.monsters).filter(m=>bl18MonsterRank(m)>=3).length;
 if(broad>=2)bl18AddTrait(a,'Monster Scholar','mastering more than one class of threat');
}

function bl18ApplyDevelopedTraits(a,d){
 bl18InitAdventurer(a);
 a.veteran.developedTraits.forEach(name=>{
   const x=BL18_TRAITS[name];if(!x)return;
   if(x.maxHp)d.maxHp+=x.maxHp;
   Object.entries(x.combat||{}).forEach(([k,v])=>{if(k in d.combat)d.combat[k]+=v});
   Object.entries(x.util||{}).forEach(([k,v])=>{if(k in d.util)d.util[k]+=v});
 });
 return d;
}

const _derivedV18=derived;
derived=function(a){const d=_derivedV18(a);bl18ApplyDevelopedTraits(a,d);Object.keys(d.combat).forEach(k=>d.combat[k]=Math.max(1,Math.round(d.combat[k])));Object.keys(d.util).forEach(k=>d.util[k]=Math.max(0,Math.round(d.util[k])));d.maxHp=Math.max(1,Math.round(d.maxHp));return d};

function bl18BattleFamilies(b){
 return [...new Set((b?.enemies||[]).map(e=>bl18Family(e.species||e.name)).filter(Boolean))];
}
function bl18MasteryBonus(rank){
 return[
   {accuracy:0,guard:0,resolve:0,damage:0},
   {accuracy:1,guard:1,resolve:0,damage:.02},
   {accuracy:2,guard:2,resolve:1,damage:.04},
   {accuracy:4,guard:3,resolve:2,damage:.07},
   {accuracy:6,guard:4,resolve:3,damage:.11}
 ][rank]||{accuracy:0,guard:0,resolve:0,damage:0};
}

function bl18AwardMonster(a,family,amount,win=null,downed=false){
 if(!a||!family)return;
 const rec=bl18Monster(a,family),before=bl18MonsterRank(rec);
 rec.xp=Math.max(0,rec.xp+Math.max(0,amount||0));
 rec.encounters++;
 if(win===true)rec.wins++;
 if(win===false)rec.losses++;
 if(downed)rec.downs++;
 const after=bl18MonsterRank(rec);
 if(after>before){
   const text=`${a.name} became ${BL18_MONSTER_RANKS[after].name.toLowerCase()} at fighting ${family}.`;
   if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id],after>=3?'major':'normal');
   bl18Change(text);
 }
}
function bl18AddTrauma(a,family,amount,reason=''){
 if(!a||!family||amount<=0)return;
 const f=bl18Fear(a,family),before=bl18FearStage(f);
 f.trauma=bl18Clamp(f.trauma+amount,0,80);
 f.peak=Math.max(f.peak,bl18FearStage(f));
 f.cleanWins=0;
 const after=bl18FearStage(f);
 if(after>before){
   const text=`${a.name} developed ${bl18FearName(f,family)}${reason?` after ${reason}`:''}.`;
   if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id],after>=3?'major':'normal');
   bl18Change(text);
   if(after>=3)bl18AddTrait(a,'Night Terrors','a severe battlefield phobia followed them home');
 }
}
function bl18CleanWin(a,family){
 const f=bl18Fear(a,family),before=bl18FearStage(f);
 f.cleanWins=(f.cleanWins||0)+1;
 const reduction=before?Math.min(3,1+Math.floor(f.cleanWins/3)):0;
 if(reduction)f.trauma=Math.max(0,f.trauma-reduction);
 const after=bl18FearStage(f);
 if(after<before){
   const text=`${a.name} began overcoming ${family} fear through repeated victories.`;
   if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id]);
   bl18Change(text);
 }
 if(f.peak>=2&&after===0&&f.cleanWins>=6&&!f.hardened){
   f.hardened=true;
   const text=`${a.name} conquered a long-held fear of ${family} and became ${family.toLowerCase()}-hardened.`;
   if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id],'major');
   bl18Change(text);
   if(/Dead|Spirit|Horror|Fallen|Aberration/i.test(family))bl18AddTrait(a,'Grave-Hardened','overcoming a severe supernatural fear');
 }
}

const _normalizeStateV18=normalizeState;
normalizeState=function(s){
 s=_normalizeStateV18(s);if(!s)return s;
 bl18State(s);
 const all=[...(s.roster||[])];
 REGION_ORDER.forEach(id=>all.push(...(s.regions?.[id]?.recruits||[])));
 all.forEach(bl18InitAdventurer);
 const lv=bl18State(s);
 if(!lv.chronicle.length&&s.livingCompany?.events?.length){
   s.livingCompany.events.filter(e=>e.importance==='major').slice(-80).forEach(e=>lv.chronicle.push({id:e.id||uid('chron'),day:e.day||1,regionId:e.regionId,text:e.text,memberIds:[...(e.memberIds||[])],kind:'legacy'}));
 }
 (s.roster||[]).filter(a=>a.status==='Dead').forEach(a=>{
   if(!lv.fallen.some(x=>x.id===a.id)){
     const mastery=Object.entries(a.veteran?.monsters||{}).map(([family,m])=>({family,rank:bl18MonsterRankName(m),xp:m.xp,kills:m.kills})).filter(x=>x.xp>0).sort((x,y)=>y.xp-x.xp).slice(0,5);
     lv.fallen.push({id:a.id,name:a.name,nickname:a.nickname||'',className:a.className,culture:a.culture,lvl:a.lvl,careerRarity:a.careerRarity||'Common',missions:a.missions||0,kills:a.kills||0,traits:[...(a.veteran?.developedTraits||[])],mastery,cause:'recorded before the Living Veterans chronicle',day:s.company?.day||1});
   }
 });
 return s;
};
const _createStateV18=createState;
createState=function(name){
 const s=_createStateV18(name);
 const lv=bl18State(s);
 (s.roster||[]).forEach(bl18InitAdventurer);
 REGION_ORDER.forEach(id=>(s.regions[id].recruits||[]).forEach(bl18InitAdventurer));
 lv.chronicle.push({id:uid('chron'),day:s.company.day,regionId:s.currentRegion,text:`${s.company.name} was founded at ${s.regions[s.currentRegion].hq.name}.`,memberIds:[],kind:'founding'});
 return s;
};

const _bl16RecordV18=typeof bl16Record==='function'?bl16Record:null;
if(_bl16RecordV18){
 bl16Record=function(text,regionId=state.currentRegion,memberIds=[],importance='normal'){
   const ev=_bl16RecordV18(text,regionId,memberIds,importance);
   if(importance==='major')bl18Chronicle(text,regionId,memberIds,'major');
   return ev;
 };
}

const _bl16PairEventV18=typeof bl16PairEvent==='function'?bl16PairEvent:null;
if(_bl16PairEventV18){
 bl16PairEvent=function(a,b,regionId){
   const before=relValue(a.id,b.id);
   const out=_bl16PairEventV18(a,b,regionId);
   const delta=relValue(a.id,b.id)-before;
   if(delta>0)bl18AdjustRelation(a,b,{affinity:Math.max(1,delta),trust:Math.ceil(delta*.6),respect:1},'spending time together');
   else if(delta<0)bl18AdjustRelation(a,b,{affinity:delta,tension:Math.abs(delta)+1,respect:1},'an argument at headquarters');
   return out;
 };
}

const _relationshipAfterMissionV18=relationshipAfterMission;
relationshipAfterMission=function(p,deaths){
 const ids=(p.members||[]).slice();
 const members=ids.map(id=>state.roster.find(a=>a.id===id)).filter(Boolean);
 const out=_relationshipAfterMissionV18(p,deaths);
 const win=p.expedition?.battleWon!==false;
 for(let i=0;i<members.length;i++)for(let j=i+1;j<members.length;j++){
   const a=members[i],b=members[j];
   bl18AdjustRelation(a,b,{
     affinity:win?2:-1,
     trust:win?3:-1,
     respect:win?2:1,
     tension:win?-1:(deaths?.length?4:3),
     sharedMissions:1
   },win?'surviving another contract together':'coming home from a failed contract');
 }
 if(!win&&members.filter(x=>x.status!=='Dead').length>=2&&chance(.28)){
   const living=members.filter(x=>x.status!=='Dead'),a=pick(living),b=pick(living.filter(x=>x.id!==a.id));
   if(a&&b){
     bl18AdjustRelation(a,b,{affinity:-4,trust:-3,tension:7,respect:1},'blame over a failed expedition');
     if(typeof bl16Record==='function')bl16Record(`${a.name} blamed ${b.name} for the failure of ${p.name}.`,p.regionId,[a.id,b.id]);
   }
 }
 const deadNames=new Set(deaths||[]);
 members.filter(a=>a.status!=='Dead').forEach(a=>{
   members.filter(d=>deadNames.has(d.name)).forEach(d=>{
     const r=bl18Rel(a,d);
     if(r.trust>=45||r.affinity>=35){
       a.veteran.behavior.grief++;
       r.tension=bl18Clamp(r.tension+4,0,100);
       if(!a.traits.includes('Vengeful')&&r.affinity>=45)a.traits.push('Vengeful');
     }
   });
   if(p.tactic==='Aggressive')a.veteran.behavior.reckless++;
   if(p.tactic==='Cautious')a.veteran.behavior.cautious++;
   if(p.captainId===a.id)a.veteran.behavior.leadership++;
   bl18MaybeTraits(a);
 });
 return out;
};

const _bestUtilityV18=typeof bestUtility==='function'?bestUtility:null;
if(_bestUtilityV18){
 bestUtility=function(p,key){
   const out=_bestUtilityV18(p,key);
   const c=p?.expedition?.contract;
   if(out?.a&&c){
     const rank=bl18MonsterRank(bl18Monster(out.a,bl18Family(c.species)));
     out.value+=rank;
   }
   return out;
 };
}

const _fieldCheckV18=fieldCheck;
fieldCheck=function(p){
 const before=p?.expedition?.checks?.length||0;
 const out=_fieldCheckV18(p);
 const e=p?.expedition;
 if(e&&e.checks.length>before){
   const ch=e.checks[e.checks.length-1];
   const a=state.roster.find(x=>x.name===ch.name&&p.members.includes(x.id));
   if(a&&ch.ok){
     a.veteran.behavior.fieldcraft++;
     bl18MaybeTraits(a);
   }
 }
 return out;
};

const _startBattleV18=startBattle;
startBattle=function(p){
 const out=_startBattleV18(p);
 const b=p?.expedition?.battle;if(!b)return out;
 const families=bl18BattleFamilies(b);
 b._v18Families=families;
 b.allies.forEach(u=>{
   const a=state.roster.find(x=>x.id===u.charId);if(!a)return;
   bl18InitAdventurer(a);a.veteran.behavior.battles++;
   let bestRank=0,worstFear=0,hardened=false;
   families.forEach(f=>{
     const rank=bl18MonsterRank(bl18Monster(a,f));
     bestRank=Math.max(bestRank,rank);
     const fr=bl18Fear(a,f);
     worstFear=Math.max(worstFear,bl18FearStage(fr));
     hardened=hardened||!!(fr.hardened&&bl18FearStage(fr)===0);
   });
   const bonus=bl18MasteryBonus(bestRank);
   u.accuracy+=bonus.accuracy;u.guard+=bonus.guard;u.resolve+=bonus.resolve;
   u._v18Damage=bonus.damage;
   if(worstFear){
     const rp=[0,2,5,9][worstFear],ap=[0,1,2,4][worstFear];
     u.resolve=Math.max(1,u.resolve-rp);u.accuracy=Math.max(1,u.accuracy-ap);
     b.log.push(`${a.name} is shaken by an old fear (-Resolve${ap?`, -Accuracy`:''}).`);
   }else if(hardened){u.resolve+=2}
   if(bestRank>=2)b.log.push(`${a.name}'s ${BL18_MONSTER_RANKS[bestRank].name.toLowerCase()} monster experience shows.`);
 });
 for(let i=0;i<b.allies.length;i++)for(let j=i+1;j<b.allies.length;j++){
   const x=b.allies[i],y=b.allies[j],a=state.roster.find(z=>z.id===x.charId),c=state.roster.find(z=>z.id===y.charId);
   if(!a||!c)continue;
   const r=bl18Rel(a,c),stage=bl18RelationStage(r,a,c);
   if(stage==='Blood-Bound'){x.resolve+=2;y.resolve+=2;x.guard+=1;y.guard+=1}
   else if(stage==='Professional Rivals'){x.attack+=2;y.attack+=2;x.accuracy+=1;y.accuracy+=1;x.resolve=Math.max(1,x.resolve-1);y.resolve=Math.max(1,y.resolve-1)}
   else if(stage==='Grudge'||stage==='Bitter Enemies'){x.resolve=Math.max(1,x.resolve-2);y.resolve=Math.max(1,y.resolve-2);x.guard=Math.max(1,x.guard-1);y.guard=Math.max(1,y.guard-1)}
   else if(stage==='Mentor & Protégé'){
     const senior=(a.lvl||1)>=(c.lvl||1)?x:y,junior=senior===x?y:x;senior.resolve+=1;junior.accuracy+=2;junior.guard+=1;
   }
 }
 return out;
};

const _classDamageMultV18=classDamageMult;
classDamageMult=function(actor,battle,p,e,target){
 const out=_classDamageMultV18(actor,battle,p,e,target);
 out.m*=1+(actor?._v18Damage||0);
 return out;
};

const _bl14ProtectorForV18=typeof bl14ProtectorFor==='function'?bl14ProtectorFor:null;
if(_bl14ProtectorForV18){
 bl14ProtectorFor=function(target,allies){
   const protector=_bl14ProtectorForV18(target,allies);
   if(protector?.charId&&target?.charId&&protector.charId!==target.charId){
     const a=state.roster.find(x=>x.id===protector.charId),b=state.roster.find(x=>x.id===target.charId);
     if(a&&b){
       a.veteran.behavior.protective++;
       bl18AdjustRelation(a,b,{trust:2,respect:2,affinity:1,rescues:1},'one protected the other in battle');
       bl18MaybeTraits(a);
     }
   }
   return protector;
 };
}

const _supportActionV18=supportAction;
supportAction=function(actor,p){
 const b=p?.expedition?.battle,before=new Map((b?.allies||[]).map(x=>[x.charId,x.hp]));
 const out=_supportActionV18(actor,p);
 if(out&&actor?.charId&&b){
   let healed=null,best=0;
   b.allies.forEach(x=>{const gain=x.hp-(before.get(x.charId)||x.hp);if(gain>best){best=gain;healed=x}});
   if(healed?.charId&&healed.charId!==actor.charId){
     const a=state.roster.find(x=>x.id===actor.charId),t=state.roster.find(x=>x.id===healed.charId);
     if(a&&t){a.veteran.behavior.protective+=.5;bl18AdjustRelation(a,t,{trust:1,affinity:1,respect:1},'one tended the other under fire')}
   }
 }
 return out;
};

const _allyAttackV18=allyAttack;
allyAttack=function(actor,target,p){
 const before=target?.hp||0;
 const out=_allyAttackV18(actor,target,p);
 if(actor?.charId&&target&&before>0&&target.hp<=0){
   const a=state.roster.find(x=>x.id===actor.charId);
   if(a){const f=bl18Family(target.species||target.name),m=bl18Monster(a,f);m.kills++;m.xp+=2}
 }
 return out;
};

function bl18Memorial(a,cause='Unknown'){
 if(!a||!state)return;
 const lv=bl18State();
 if(lv.fallen.some(x=>x.id===a.id))return;
 const mastery=Object.entries(a.veteran?.monsters||{}).map(([family,m])=>({family,rank:bl18MonsterRankName(m),xp:m.xp,kills:m.kills})).filter(x=>x.xp>0).sort((x,y)=>y.xp-x.xp).slice(0,5);
 lv.fallen.push({id:a.id,name:a.name,nickname:a.nickname||'',className:a.className,culture:a.culture,lvl:a.lvl,careerRarity:a.careerRarity||'Common',missions:a.missions||0,kills:a.kills||0,traits:[...(a.veteran?.developedTraits||[])],mastery,cause,day:state.company.day});
 if(lv.fallen.length>120)lv.fallen.shift();
 bl18Chronicle(`${a.name}${a.nickname?` “${a.nickname}”`:''} died on ${cause} after ${a.missions||0} contracts.`,a.regionId,[a.id],'death');
}

const _resolveBattleV18=resolveBattle;
resolveBattle=function(p,win){
 const b=p?.expedition?.battle;
 if(!b)return _resolveBattleV18(p,win);
 const families=b._v18Families||bl18BattleFamilies(b);
 const snapshot=b.allies.map(u=>({id:u.charId,down:u.hp<=0}));
 const title=p.expedition?.contract?.title||'an expedition';
 const legendary=(b.enemies||[]).some(e=>e.legendary||/dragon|jotunn|jötunn|ryu|ryū|storm bird|seraph/i.test(e.species||e.name||''));
 const out=_resolveBattleV18(p,win);
 snapshot.forEach(s=>{
   const a=state.roster.find(x=>x.id===s.id);if(!a)return;
   bl18InitAdventurer(a);
   if(s.down)a.veteran.behavior.survivor++;
   else if(win)a.veteran.behavior.cleanWins++;
   families.forEach(f=>{
     bl18AwardMonster(a,f,win?(s.down?4:7):(s.down?3:2),win,s.down);
     if(s.down)bl18AddTrauma(a,f,10,`being brought down fighting ${f.toLowerCase()}`);
     if(!win)bl18AddTrauma(a,f,5,`a defeat by ${f.toLowerCase()}`);
     if(legendary&&!win)bl18AddTrauma(a,f,4,'facing a legendary threat');
     if(win&&!s.down)bl18CleanWin(a,f);
   });
   if(a.status==='Dead')bl18Memorial(a,title);
   bl18MaybeTraits(a);
 });
 save();
 return out;
};

const _finishExpeditionV18=finishExpedition;
finishExpedition=function(p){
 const e=p?.expedition;
 if(!e)return _finishExpeditionV18(p);
 const memberIds=(p.members||[]).slice();
 const contract=e.contract;
 const out=_finishExpeditionV18(p);
 memberIds.forEach(id=>{
   const a=state.roster.find(x=>x.id===id);if(a&&a.status!=='Dead')bl18MaybeTraits(a);
 });
 return out;
};

const _upgradeHQV18=typeof upgradeHQ==='function'?upgradeHQ:null;
if(_upgradeHQV18){
 upgradeHQ=function(k){
   const before=hq().upgrades[k]||0;
   const rid=state.currentRegion;
   const out=_upgradeHQV18(k);
   const after=hq(rid).upgrades[k]||0;
   if(after>before)bl18Chronicle(`${hq(rid).name} upgraded ${k} to Level ${after}.`,rid,[],'hq');
   return out;
 };
}
const _foundBranchV18=typeof foundBranch==='function'?foundBranch:null;
if(_foundBranchV18){
 foundBranch=function(id){
   const had=!!state.regions[id]?.hq?.founded;
   const out=_foundBranchV18(id);
   if(!had&&state.regions[id]?.hq?.founded)bl18Chronicle(`The company founded ${state.regions[id].hq.name} in ${REGION_DEFS[id].name}.`,id,[],'hq');
   return out;
 };
}

function bl18Bars(r){
 const row=(name,v,cls='')=>`<div class="bl18RelMetric"><span>${name}</span><i><b class="${cls}" style="width:${bl18Clamp(v,0,100)}%"></b></i><em>${Math.round(v)}</em></div>`;
 return row('Affinity',(r.affinity+100)/2,'good')+row('Trust',r.trust,'good')+row('Respect',r.respect,'neutral')+row('Tension',r.tension,'bad');
}
function bl18RelationList(a){
 const rows=state.roster.filter(b=>b.id!==a.id).map(b=>({b,r:bl18Rel(a,b)})).filter(x=>x.r.sharedMissions||x.r.rescues||x.r.affinity!==0||x.r.trust||x.r.tension).sort((x,y)=>(y.r.trust+y.r.respect+y.r.tension)-(x.r.trust+x.r.respect+x.r.tension)).slice(0,8);
 if(!rows.length)return'<div class="tiny muted">No meaningful bonds or grudges yet.</div>';
 return rows.map(x=>`<div class="bl18RelationCard"><div class="statline"><b>${esc(x.b.name)}</b><span>${esc(bl18RelationStage(x.r,a,x.b))}</span></div>${bl18Bars(x.r)}<div class="tiny muted">${x.r.sharedMissions} shared contracts • ${x.r.rescues} protection moments</div></div>`).join('');
}
function bl18MonsterList(a){
 const rows=Object.entries(bl18InitAdventurer(a).veteran.monsters).filter(([,m])=>m.xp>0).sort((x,y)=>y[1].xp-x[1].xp);
 if(!rows.length)return'<div class="tiny muted">No specialized monster experience yet.</div>';
 return rows.slice(0,10).map(([family,m])=>{const rank=bl18MonsterRank(m),next=rank<4?BL18_MONSTER_RANKS[rank+1].min:null;const pct=next?Math.round(bl18Clamp(m.xp/next*100,0,100)):100;return`<div class="bl18MonsterRow"><div class="statline"><b>${esc(family)}</b><span>${BL18_MONSTER_RANKS[rank].name}</span></div><div class="bar goldbar"><i style="width:${pct}%"></i></div><div class="tiny muted">${m.encounters} encounters • ${m.wins} wins • ${m.kills} kills • ${m.xp} mastery</div></div>`}).join('');
}
function bl18FearList(a){
 const rows=Object.entries(bl18InitAdventurer(a).veteran.fears).map(([family,f])=>({family,f,name:bl18FearName(f,family)})).filter(x=>x.name);
 if(!rows.length)return'<div class="tiny muted">No lasting phobias.</div>';
 return rows.map(x=>`<div class="bl18FearRow ${x.f.hardened&&bl18FearStage(x.f)===0?'hardened':''}"><b>${esc(x.name)}</b><span>${x.f.hardened&&bl18FearStage(x.f)===0?'Conquered fear':'Trauma '+Math.round(x.f.trauma)}</span></div>`).join('');
}
function bl18TraitList(a){
 const ts=bl18InitAdventurer(a).veteran.developedTraits;
 if(!ts.length)return'<div class="tiny muted">No career-developed traits yet.</div>';
 return ts.map(t=>`<div class="bl18Trait"><b>${esc(t)}</b><span>${esc(BL18_TRAITS[t]?.desc||'Career-developed trait.')}</span></div>`).join('');
}

const _renderInspectV18=renderInspect;
renderInspect=function(id,recruit=false){
 _renderInspectV18(id,recruit);
 if(recruit)return;
 const a=state.roster.find(x=>x.id===id),sheet=document.getElementById('sheet');if(!a||!sheet)return;
 const historyAnchor=sheet.querySelector('.history')?.parentElement;
 const html=`<div class="sectionTitle bl18Section"><h3>Living Veteran</h3><span>formed by actual career events</span></div>
 <div class="card bl18VeteranSummary"><div class="tiny muted">Relationships</div>${bl18RelationList(a)}</div>
 <div class="sectionTitle"><h3>Monster Experience</h3><span>earned in combat</span></div><div class="card">${bl18MonsterList(a)}</div>
 <div class="sectionTitle"><h3>Fears & Scars</h3><span>can worsen or be overcome</span></div><div class="card">${bl18FearList(a)}</div>
 <div class="sectionTitle"><h3>Developed Traits</h3><span>career-driven</span></div><div class="card bl18Traits">${bl18TraitList(a)}</div>`;
 if(historyAnchor)historyAnchor.insertAdjacentHTML('beforebegin',html);else sheet.insertAdjacentHTML('beforeend',html);
};

function bl18ChronicleModal(){
 const lv=bl18State(),events=lv.chronicle.slice().reverse(),fallen=lv.fallen.slice().reverse();
 modal(`<div class="sheetHead"><div><h3>Company Chronicle</h3><div class="tiny muted">The history the company leaves behind</div></div><button class="x" data-action="close">×</button></div>
 <div class="sectionTitle"><h3>Major Events</h3><span>${events.length}</span></div>
 <div class="bl18Chronicle">${events.length?events.map(e=>`<div class="card bl18Chron ${e.kind}"><span>Day ${e.day}</span><b>${esc(e.text)}</b></div>`).join(''):'<div class="empty">No major events have entered the chronicle yet.</div>'}</div>
 <div class="sectionTitle"><h3>Fallen Company Members</h3><span>${fallen.length}</span></div>
 <div class="bl18Memorials">${fallen.length?fallen.map(f=>`<div class="card bl18Memorial"><b>${esc(f.name)}${f.nickname?` “${esc(f.nickname)}”`:''}</b><div class="tiny muted">${esc(f.culture)} ${esc(f.className)} • Lv.${f.lvl} • ${esc(f.careerRarity)}</div><div class="tiny">${f.missions} contracts • ${f.kills} kills</div><div class="tiny danger">Died: ${esc(f.cause)} • Day ${f.day}</div>${f.mastery.length?`<div class="tiny gold">${f.mastery.map(m=>`${esc(m.family)} ${esc(m.rank)}`).join(' • ')}</div>`:''}</div>`).join(''):'<div class="empty">No names on the memorial wall.</div>'}</div>`);
}

const _renderHQV18=renderHQ;
renderHQ=function(){
 const base=_renderHQV18(),lv=bl18State();
 const recent=lv.chronicle.filter(e=>!e.regionId||e.regionId===state.currentRegion).slice(-4).reverse();
 return base+`<div class="sectionTitle"><h3>Company Chronicle</h3><button class="btn ghost" data-action="v18Chronicle">Open Chronicle</button></div><div class="bl18Chronicle">${recent.length?recent.map(e=>`<div class="card bl18Chron ${e.kind}"><span>Day ${e.day}</span><b>${esc(e.text)}</b></div>`).join(''):'<div class="empty">The next great story has not happened yet.</div>'}</div>`;
};

const _processActionV18=processAction;
processAction=function(el){
 if(el?.dataset?.action==='v18Chronicle')return bl18ChronicleModal();
 return _processActionV18(el);
};

const _auditV18=audit;
audit=function(){
 const out=_auditV18();
 out.v18LivingVeterans=true;
 out.v18Systems=['relationship dimensions','monster mastery','phobias','career traits','company chronicle','fallen memorials'];
 return out;
};
window.__BL_AUDIT=audit;