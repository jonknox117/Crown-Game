/* Broken Lantern v17 — Career Rarity + Native SVG Visual Unification.
   Keeps v15 adventurer portraits. Everything else visible uses inline SVG/native CSS. */

function blHash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}

const BL17_CAREER=[
 {name:'Common',min:0,tier:1,slots:1,color:'#9aa0a3'},
 {name:'Uncommon',min:5,tier:2,slots:1,color:'#6ca870'},
 {name:'Rare',min:12,tier:2,slots:2,color:'#638fc8'},
 {name:'Super Rare',min:25,tier:3,slots:2,color:'#9b72c7'},
 {name:'Legendary',min:40,tier:3,slots:3,color:'#d6ad55'}
];
function bl17RankForMissions(n){n=Number(n)||0;let r=0;for(let i=1;i<BL17_CAREER.length;i++)if(n>=BL17_CAREER[i].min)r=i;return r}
function bl17EnsureCareer(a){if(!a)return 0;const rank=bl17RankForMissions(a.missions||0);a.careerRank=rank;a.careerRarity=BL17_CAREER[rank].name;return rank}
function bl17Career(a){return BL17_CAREER[bl17EnsureCareer(a)]}

const BL17_CLASS_SKILLS={
 'Knight-Errant':[['Hold the Line','guard'],['Oathbound','morale'],['Unbroken','spearwall']],
 'Man-at-Arms':[['Drilled Steel','balanced'],['Shield Drill','ranks'],['Veteran’s Eye','duel']],
 'Crossbowman':[['Steady Aim','marksman'],['Bodkin Doctrine','breaker'],['Kill Lane','volley']],
 'Houndmaster':[['War Hound','hound'],['Pack Keeper','scout'],['Nobody Left Behind','morale']],
 'March Ranger':[['Border Sense','scout'],['First Shot','volley'],['Road Ghost','stealth']],
 'Battle Chaplain':[['Field Benediction','healer'],['Last Rites','spirit'],['Iron Faith','morale']],
 'Shieldthane':[['Shield Wall','guard'],['Holdfast','spearwall'],['Oath of Stone','morale']],
 'Berserker':[['Blood Heat','berserk'],['Red Mist','breaker'],['Death Laugh','morale']],
 'Raider':[['Beach Rush','skirmish'],['Sea Wolf','scout'],['Plunder Sense','hound']],
 'Skald':[['War Song','song'],['Saga Keeper','morale'],['Name of Heroes','healer']],
 'Rune-Seer':[['Rune Ward','occult'],['Grave Reading','spirit'],['Storm Sign','scout']],
 'Samurai':[['Perfect Cut','duel'],['Unshaken Form','morale'],['Duelist’s Measure','marksman']],
 'Yumi Archer':[['First Volley','volley'],['Long Sight','marksman'],['Wind Reading','scout']],
 'Shinobi':[['Hidden Blade','stealth'],['Smoke Step','skirmish'],['Weak Point','breaker']],
 'Ashigaru':[['Ranks','ranks'],['Spear Discipline','spearwall'],['Common Steel','balanced']],
 'Spirit Scribe':[['Binding Script','spirit'],['True Name','occult'],['Ward Brush','healer']],
 'Spearwall':[['Close Ranks','spearwall'],['Shield Rhythm','ranks'],['Stand Together','morale']],
 'Horn Runner':[['Encircle','encircle'],['Long Run','scout'],['Gap Finder','skirmish']],
 'Shield-Breaker':[['Break the Line','breaker'],['Heavy Hand','berserk'],['Crush Guard','duel']],
 'War-Singer':[['Battle Rhythm','song'],['Heart Drum','morale'],['Carry the Fallen','healer']],
 'Bone-Seer':[['Ancestor Sign','ancestor'],['Bone Reading','occult'],['Redveld Omen','scout']],
 'Lumen Guard':[['Radiant Screen','radiant'],['Harmonic Bulwark','guard'],['No Shadow Passes','morale']],
 'Star-Spear':[['Anatomy Break','horrorhunter'],['Perfect Reach','marksman'],['Starfall Thrust','breaker']],
 'Choir Adept':[['Harmonic Ward','choir'],['Steady Chorus','morale'],['Restoring Note','healer']],
 'Veilwalker':[['Slip Angle','veil'],['Impossible Step','stealth'],['Broken Path','scout']],
 'Pattern-Savant':[['Pattern Collapse','pattern'],['Structure Sight','occult'],['Fault Line','breaker']]
};
function bl17SkillDefs(a){let defs=BL17_CLASS_SKILLS[a.className]||[['Veteran Instinct','balanced'],['Hard Lessons','morale'],['Old Hand','scout']];const off=blHash(`${a.id}|${a.name}|career-skills`)%defs.length;return defs.slice(off).concat(defs.slice(0,off))}
function bl17Skills(a){const c=bl17Career(a),defs=bl17SkillDefs(a);return defs.slice(0,c.slots).map(([name,type])=>({name,type,tier:c.tier}))}
function bl17TierRoman(t){return['','I','II','III'][t]||String(t)}
function bl17SkillText(s){const t=s.tier;const scale=(a,b,c)=>[0,a,b,c][t];switch(s.type){
 case'guard':return `+${scale(2,4,7)} Guard, +${scale(1,2,4)} Resolve, stronger protection.`;
 case'balanced':return `+${scale(1,3,5)} Attack and +${scale(1,2,4)} Guard.`;
 case'marksman':return `+${scale(2,5,8)} Accuracy, +${scale(4,9,15)}% opening damage, armor penetration.`;
 case'hound':return `+${scale(2,4,7)} Scout and +${scale(1,3,5)} Accuracy.`;
 case'scout':return `+${scale(2,5,8)} Scout, +${scale(1,2,4)} Speed, stronger opening.`;
 case'healer':return `+${scale(2,4,7)} Resolve and +${scale(1,3,5)} Occult; improves support healing.`;
 case'berserk':return `+${scale(2,5,8)} Attack and +${scale(2,5,9)}% critical chance.`;
 case'skirmish':return `+${scale(2,4,7)} Speed, +${scale(1,3,5)} Attack, +${scale(1,3,5)} Sneak.`;
 case'morale':return `+${scale(2,5,8)} Resolve and +${scale(1,3,5)} Talk.`;
 case'occult':return `+${scale(3,6,10)} Occult, +${scale(1,3,5)} Resolve, bonus vs supernatural enemies.`;
 case'duel':return `+${scale(2,4,7)} Attack, +${scale(1,3,5)} Accuracy, increased critical chance.`;
 case'volley':return `+${scale(2,5,8)} Accuracy and +${scale(6,12,20)}% opening damage.`;
 case'stealth':return `+${scale(3,6,9)} Sneak, +${scale(1,3,5)} Speed, stronger opening.`;
 case'ranks':return `+${scale(2,4,7)} Guard and +${scale(2,4,6)} Endure.`;
 case'spirit':return `+${scale(3,6,10)} Occult and +${scale(2,4,7)} Resolve; bonus vs supernatural enemies.`;
 case'spearwall':return `+${scale(2,5,8)} Guard, +${scale(1,2,4)} Attack, improved intercept chance.`;
 case'encircle':return `+${scale(2,5,8)} Speed, +${scale(1,3,5)} Accuracy and Scout.`;
 case'breaker':return `+${scale(3,6,9)} Attack and stronger armor penetration.`;
 case'song':return `+${scale(3,6,9)} Resolve, +${scale(1,3,5)} Attack and Talk.`;
 case'ancestor':return `+${scale(3,6,10)} Occult and +${scale(1,3,5)} Scout.`;
 case'radiant':return `+${scale(3,6,10)} Guard and +${scale(2,4,7)} Resolve; bonus against Horrors.`;
 case'horrorhunter':return `+${scale(2,5,8)} Attack, +${scale(2,4,7)} Accuracy, heavy bonus vs Horrors.`;
 case'choir':return `+${scale(3,6,10)} Resolve and +${scale(2,4,7)} Occult; improves support.`;
 case'veil':return `+${scale(3,6,9)} Speed and +${scale(3,6,9)} Sneak.`;
 case'pattern':return `+${scale(2,5,8)} Accuracy, +${scale(3,6,10)} Occult, bonus vs supernatural enemies.`;
 default:return'Career-hardened combat instinct.';
}}
function bl17ApplySkill(s,d){const t=s.tier,combat=d.combat,util=d.util,sp=d.special;const n=(a,b,c)=>[0,a,b,c][t];sp.careerIntercept=sp.careerIntercept||0;sp.careerPierce=sp.careerPierce||0;switch(s.type){
 case'guard':combat.guard+=n(2,4,7);combat.resolve+=n(1,2,4);sp.careerIntercept+=n(.03,.07,.12);break;
 case'balanced':combat.attack+=n(1,3,5);combat.guard+=n(1,2,4);break;
 case'marksman':combat.accuracy+=n(2,5,8);sp.opening+=n(4,9,15);sp.careerPierce=Math.max(sp.careerPierce,n(.04,.10,.18));break;
 case'hound':util.scout+=n(2,4,7);combat.accuracy+=n(1,3,5);break;
 case'scout':util.scout+=n(2,5,8);combat.speed+=n(1,2,4);sp.opening+=n(3,7,12);break;
 case'healer':combat.resolve+=n(2,4,7);util.occult+=n(1,3,5);break;
 case'berserk':combat.attack+=n(2,5,8);sp.crit+=n(.02,.05,.09);break;
 case'skirmish':combat.speed+=n(2,4,7);combat.attack+=n(1,3,5);util.sneak+=n(1,3,5);break;
 case'morale':combat.resolve+=n(2,5,8);util.talk+=n(1,3,5);break;
 case'occult':util.occult+=n(3,6,10);combat.resolve+=n(1,3,5);sp.enemy.supernatural=(sp.enemy.supernatural||0)+n(4,9,16);break;
 case'duel':combat.attack+=n(2,4,7);combat.accuracy+=n(1,3,5);sp.crit+=n(.02,.05,.08);break;
 case'volley':combat.accuracy+=n(2,5,8);sp.opening+=n(6,12,20);break;
 case'stealth':util.sneak+=n(3,6,9);combat.speed+=n(1,3,5);sp.opening+=n(4,9,15);break;
 case'ranks':combat.guard+=n(2,4,7);util.endure+=n(2,4,6);break;
 case'spirit':util.occult+=n(3,6,10);combat.resolve+=n(2,4,7);sp.enemy.supernatural=(sp.enemy.supernatural||0)+n(4,10,18);break;
 case'spearwall':combat.guard+=n(2,5,8);combat.attack+=n(1,2,4);sp.careerIntercept+=n(.03,.07,.12);break;
 case'encircle':combat.speed+=n(2,5,8);combat.accuracy+=n(1,3,5);util.scout+=n(1,3,5);break;
 case'breaker':combat.attack+=n(3,6,9);sp.careerPierce=Math.max(sp.careerPierce,n(.06,.14,.25));break;
 case'song':combat.resolve+=n(3,6,9);combat.attack+=n(1,3,5);util.talk+=n(1,3,5);break;
 case'ancestor':util.occult+=n(3,6,10);util.scout+=n(1,3,5);break;
 case'radiant':combat.guard+=n(3,6,10);combat.resolve+=n(2,4,7);sp.enemy.Horror=(sp.enemy.Horror||0)+n(6,14,24);break;
 case'horrorhunter':combat.attack+=n(2,5,8);combat.accuracy+=n(2,4,7);sp.enemy.Horror=(sp.enemy.Horror||0)+n(10,22,36);break;
 case'choir':combat.resolve+=n(3,6,10);util.occult+=n(2,4,7);break;
 case'veil':combat.speed+=n(3,6,9);util.sneak+=n(3,6,9);break;
 case'pattern':combat.accuracy+=n(2,5,8);util.occult+=n(3,6,10);sp.enemy.supernatural=(sp.enemy.supernatural||0)+n(6,14,24);break;
 }}

const _derivedV17=derived;
derived=function(a){const d=_derivedV17(a);bl17Skills(a).forEach(s=>bl17ApplySkill(s,d));Object.keys(d.combat).forEach(k=>d.combat[k]=Math.max(1,Math.round(d.combat[k])));Object.keys(d.util).forEach(k=>d.util[k]=Math.max(0,Math.round(d.util[k])));return d};

const _normalizeStateV17=normalizeState;
normalizeState=function(s){s=_normalizeStateV17(s);if(!s)return s;const all=[...(s.roster||[])];REGION_ORDER.forEach(id=>all.push(...(s.regions?.[id]?.recruits||[])));all.forEach(bl17EnsureCareer);s.careerVersion=17;return s};
const _createStateV17=createState;
createState=function(name){const s=_createStateV17(name);const prev=state;state=s;try{REGION_ORDER.forEach(id=>(s.regions[id].recruits||[]).forEach(bl17EnsureCareer));}finally{state=prev}s.careerVersion=17;return s};

const _classDamageMultV17=classDamageMult;
classDamageMult=function(actor,battle,p,e,target){const out=_classDamageMultV17(actor,battle,p,e,target),a=state.roster.find(x=>x.id===actor.charId);if(a){const d=derived(a);out.ignore=Math.max(out.ignore||0,d.special.careerPierce||0)}return out};

const _bl14ProtectorForV17=bl14ProtectorFor;
bl14ProtectorFor=function(target,allies){let p=_bl14ProtectorForV17(target,allies);if(p)return p;if(bl14Formation(target)==='FRONT')return null;const candidates=alive(allies).filter(u=>u!==target).map(u=>({u,a:state.roster.find(x=>x.id===u.charId)})).filter(x=>x.a);candidates.sort((x,y)=>(derived(y.a).special.careerIntercept||0)-(derived(x.a).special.careerIntercept||0));const best=candidates[0];if(best&&chance(derived(best.a).special.careerIntercept||0))return best.u;return null};

const _allyAttackV17=allyAttack;
allyAttack=function(actor,target,p){const before=target?.hp||0;_allyAttackV17(actor,target,p);if(target&&before>0&&target.hp<=0){const a=state.roster.find(x=>x.id===actor.charId);if(a)grantXP(a,Math.max(2,2+(target.level||1)))} };
const _fieldCheckV17=fieldCheck;
fieldCheck=function(p){const e=p.expedition,before=e?.checks?.length||0;_fieldCheckV17(p);if(e&&e.checks.length>before){const ch=e.checks[e.checks.length-1];if(ch.ok){const a=state.roster.find(x=>x.name===ch.name&&p.members.includes(x.id));if(a)grantXP(a,4+e.contract.risk)}}};

function bl17Promote(a,oldRank){const nr=bl17EnsureCareer(a);if(nr<=oldRank)return null;const c=BL17_CAREER[nr],skills=bl17Skills(a);const text=`${a.name} rose to ${c.name} after ${a.missions} completed contracts.`;if(typeof bl16Record==='function')bl16Record(text,a.regionId,[a.id],'major');else pushHistory(text,a.regionId);a.history=a.history||[];a.history.push(`Day ${state.company.day}: ${text}`);sfx('level');return{a,rank:nr,career:c,skills}}
const _finishExpeditionV17=finishExpedition;
finishExpedition=function(p){const ids=p?.members?.slice()||[],old=new Map(ids.map(id=>{const a=state.roster.find(x=>x.id===id);return[id,a?bl17RankForMissions(a.missions||0):0]}));const result=_finishExpeditionV17(p);const promotions=[];ids.forEach(id=>{const a=state.roster.find(x=>x.id===id);if(a&&a.status!=='Dead'){const pr=bl17Promote(a,old.get(id)||0);if(pr)promotions.push(pr)}});if(promotions.length){const sheet=document.getElementById('sheet');if(sheet)sheet.insertAdjacentHTML('beforeend',`<div class="sectionTitle"><h3>Career Promotion</h3><span>earned in the field</span></div>${promotions.map(x=>`<div class="card bl17Promotion rank-${x.rank}"><b>${esc(x.a.name)} — ${x.career.name}</b><div class="tiny muted">${x.skills.map(s=>`${esc(s.name)} ${bl17TierRoman(s.tier)}`).join(' • ')}</div></div>`).join('')}`);save()}return result};

function bl17SvgWrap(body,cls='',label=''){return`<svg class="bl17svg ${cls}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ${label?`role="img" aria-label="${esc(label)}"`:'aria-hidden="true"'}>${body}</svg>`}
const BL17_ICON_PATHS={
 hq:'<path d="M16 83V42L50 19L84 42V83H16ZM27 83V49H73V83M42 83V62H58V83M34 43V28H45V36"/>',
 roster:'<circle cx="37" cy="35" r="13"/><circle cx="66" cy="39" r="11"/><path d="M14 82Q17 57 38 57Q59 57 62 82M51 82Q54 61 68 61Q84 61 87 82"/>',
 contracts:'<path d="M24 13H70L80 23V87H24Z"/><path d="M70 13V24H80M35 39H68M35 52H68M35 65H59"/>',
 world:'<circle cx="50" cy="50" r="36"/><path d="M14 50H86M50 14Q34 31 34 50Q34 69 50 86M50 14Q66 31 66 50Q66 69 50 86M23 31H77M23 69H77"/>',
 vault:'<path d="M18 40H82V83H18Z"/><path d="M24 40Q26 20 50 20Q74 20 76 40M18 55H82M44 53H56V68H44Z"/>',
 market:'<path d="M18 33H82L75 77H28Z"/><path d="M25 33L31 20H69L76 33M31 77A6 6 0 1 0 31 89A6 6 0 1 0 31 77M70 77A6 6 0 1 0 70 89A6 6 0 1 0 70 77"/>',
 audio:'<path d="M19 43H36L54 28V72L36 57H19Z"/><path d="M62 39Q72 50 62 61M70 30Q88 50 70 70"/>',
 menu:'<path d="M20 30H80M20 50H80M20 70H80"/>',
 info:'<circle cx="50" cy="50" r="35"/><path d="M50 44V70M50 30V33"/>',
 rest:'<path d="M68 22Q46 26 43 48Q40 70 61 78Q34 83 22 61Q10 39 28 22Q43 8 68 22Z"/>',
 heal:'<path d="M41 18H59V41H82V59H59V82H41V59H18V41H41Z"/>',
 silver:'<circle cx="50" cy="50" r="31"/><path d="M61 35Q55 29 46 31Q37 33 38 40Q39 47 50 49Q63 51 63 60Q62 70 50 70Q40 70 34 64M50 25V76"/>',
 newgame:'<path d="M49 18A32 32 0 1 0 78 63M49 18L38 30M49 18L61 28"/>'
};
function bl17Icon(name,cls=''){const p=BL17_ICON_PATHS[name]||BL17_ICON_PATHS.info;return bl17SvgWrap(`<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${p}</g>`,`bl17Icon ${cls}`)}

function bl17RaceMini(race){let b='';if(race==='Elf')b='<path d="M28 39L9 29L27 54M72 39L91 29L73 54"/>';else if(race==='Orc')b='<path d="M31 61L38 76L44 59M69 61L62 76L56 59"/>';else if(race==='Dwarf')b='<path d="M32 58Q36 88 50 91Q64 88 68 58"/>';return bl17SvgWrap(`<g fill="#9b8f7f" stroke="#22282a" stroke-width="4"><circle cx="50" cy="44" r="25"/>${b}</g><path d="M31 85Q34 66 50 66Q66 66 69 85" fill="#3c464a"/>`,'bl17RaceMini',race)}
Object.assign(RACE_ICONS,{Human:bl17RaceMini('Human'),Dwarf:bl17RaceMini('Dwarf'),Elf:bl17RaceMini('Elf'),Orc:bl17RaceMini('Orc'),Celestial:bl17RaceMini('Elf')});

function bl17EnemyType(species=''){const s=String(species).toLowerCase();if(/goblin|hobgoblin/.test(s))return'goblin';if(/undead|ghoul|wight|draugr|wraith|spirit/.test(s))return'undead';if(/wolf|beast|hyena|predator/.test(s))return'beast';if(/ogre|troll|giant|jotunn/.test(s))return'giant';if(/horror|void|fallen|seraph/.test(s))return'horror';if(/dragon|ryu|storm bird/.test(s))return'apex';return'warrior'}
function bl17EnemySvg(u,cls=''){const type=bl17EnemyType(u?.species||u?.name),legend=!!u?.legendary||/dragon|jotunn|ryu|storm bird|seraph/i.test(u?.species||'');let body='';if(type==='goblin')body='<path d="M20 38L5 24L29 29Q50 9 71 29L95 24L80 39L77 65Q69 84 50 85Q31 84 23 65Z"/><circle cx="38" cy="48" r="4"/><circle cx="62" cy="48" r="4"/><path d="M36 66Q50 72 64 66"/>';else if(type==='undead')body='<path d="M22 42Q22 16 50 13Q78 16 78 42V68L66 85H34L22 68Z"/><circle cx="38" cy="48" r="7"/><circle cx="62" cy="48" r="7"/><path d="M42 67H58M46 67V78M54 67V78"/>';else if(type==='beast')body='<path d="M17 38L12 13L36 29Q50 20 64 29L88 13L83 40L75 70Q64 87 50 87Q36 87 25 70Z"/><path d="M33 49L42 45M67 49L58 45M42 66L50 72L58 66"/>';else if(type==='giant')body='<path d="M20 83L25 32L38 20L50 28L62 20L75 32L80 83Z"/><path d="M25 35L10 19M75 35L90 19"/><circle cx="39" cy="47" r="4"/><circle cx="61" cy="47" r="4"/><path d="M35 67H65"/>';else if(type==='horror')body='<circle cx="50" cy="47" r="25"/><path d="M31 29L17 8M43 23L39 4M57 23L61 4M69 29L83 8M27 64L9 84M41 70L34 94M59 70L66 94M73 64L91 84"/><circle cx="40" cy="45" r="4"/><circle cx="50" cy="39" r="4"/><circle cx="60" cy="45" r="4"/><path d="M38 58Q50 68 62 58"/>';else if(type==='apex')body='<path d="M14 78L27 37L17 18L40 31L50 8L60 31L83 18L73 37L86 78L62 68L50 91L38 68Z"/><circle cx="39" cy="49" r="4"/><circle cx="61" cy="49" r="4"/><path d="M35 62Q50 72 65 62"/>';else body='<path d="M23 84V40Q27 17 50 14Q73 17 77 40V84Z"/><path d="M26 38L15 22M74 38L85 22"/><circle cx="40" cy="48" r="4"/><circle cx="60" cy="48" r="4"/><path d="M38 66H62"/>';return bl17SvgWrap(`<rect x="3" y="3" width="94" height="94" rx="8" fill="${legend?'#241714':'#101416'}" stroke="${legend?'#d6ad55':'#5c676b'}" stroke-width="4"/><g fill="none" stroke="${legend?'#d6ad55':'#c0bbb0'}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,`bl17Enemy ${cls}`,u?.species||u?.name||'Enemy')}
function blEnemyPortrait(u){return`<span class="bl17EnemyPortrait">${bl17EnemySvg(u)}</span>`}

function bl17CacheSvg(rarity=0,cls=''){const r=clamp(Number(rarity)||0,0,4),c=['#8d8f8e','#6ca870','#638fc8','#9b72c7','#d6ad55'][r];let marks='';for(let i=0;i<r+1;i++)marks+=`<path d="M${34+i*8} 48V58"/>`;return bl17SvgWrap(`<rect x="10" y="30" width="80" height="52" rx="5" fill="#17191a" stroke="${c}" stroke-width="5"/><path d="M17 30Q21 13 50 13Q79 13 83 30" fill="#25292b" stroke="${c}" stroke-width="5"/><path d="M10 47H90" stroke="${c}" stroke-width="4"/><rect x="43" y="43" width="14" height="19" rx="2" fill="#0a0b0c" stroke="${c}" stroke-width="3"/><g stroke="${c}" stroke-width="3">${marks}</g>`,`bl17Cache ${cls}`,'Loot cache')}
function blCacheArt(rarity,cls=''){return`<span class="blCacheArt bl17CacheWrap ${cls}">${bl17CacheSvg(rarity)}</span>`}

function bl17ItemSvg(item,cls=''){const n=String(item?.name||'').toLowerCase(),slot=item?.slot||item?.type||'';let body='';if(/bow|crossbow/.test(n))body='<path d="M21 15Q58 50 21 85M21 50H82M68 42L82 50L68 58"/>';else if(/spear|yari|lumen/.test(n))body='<path d="M22 83L76 22M65 20L82 9L80 27M18 87L27 78"/>';else if(slot==='armor'||/shield|mail|brigandine|cuirass/.test(n))body='<path d="M50 12L82 25V50Q78 73 50 88Q22 73 18 50V25Z"/><path d="M34 46H66M50 30V68"/>';else if(slot==='charm'||/token|stone|beads|prism|tablet/.test(n))body='<circle cx="50" cy="48" r="25"/><path d="M50 8V23M50 73V92M10 48H25M75 48H90M32 30L22 20M68 30L78 20"/>';else body='<path d="M24 83L68 39M60 20L80 40L68 48L52 32ZM19 88L31 76M16 80L27 91"/>';return bl17SvgWrap(`<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${body}</g>`,`bl17Item ${cls}`,item?.name||'Item')}

function bl17RegionScene(id,cls=''){const culture=REGION_DEFS[id]?.culture||'Veyric',colors={Veyric:['#223a55','#7890a3'],Skeldic:['#29464b','#88a3a4'],Hoshin:['#542b34','#a76b70'],Nambaran:['#654123','#b17a43'],Aethren:['#4c493c','#d4c78e']}[culture];let land='';if(id==='veyric')land='<path d="M8 77H92M20 77V45H34V77M66 77V36H81V77M16 45H38L27 27ZM61 36H86L73 16Z"/>';else if(id==='skeld')land='<path d="M6 78Q25 57 41 70Q57 82 72 55Q82 37 95 29M18 68L33 39L48 68M55 68L70 28L87 68"/>';else if(id==='hoshin')land='<path d="M10 78H90M34 76V52H66V76M29 52H71L64 43H36ZM34 43H66L59 34H41ZM17 78Q20 53 29 43M83 78Q80 53 71 43"/>';else if(id==='nambara')land='<path d="M6 78H94M15 69Q31 54 47 69Q63 53 82 69M68 68V35M58 43Q68 30 78 43M61 51Q68 40 75 51"/>';else land='<path d="M8 78L25 52L36 68L50 19L63 65L76 42L92 78M50 19V6M28 52L19 33M76 42L88 25"/>';return bl17SvgWrap(`<rect width="100" height="100" fill="#0c1012"/><rect y="55" width="100" height="45" fill="${colors[0]}" opacity=".55"/><g fill="none" stroke="${colors[1]}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${land}</g>`,`bl17RegionScene ${cls}`,REGION_DEFS[id]?.name||'Region')}
function bl17HeroScene(tab){return`<div class="bl17HeroScene">${bl17RegionScene(state.currentRegion,`scene-${tab}`)}</div>`}
function blApplyHeroArt(){const hero=document.querySelector('#app .hero');if(!hero||hero.querySelector('.bl17HeroScene'))return;hero.classList.remove('blHeroArt');hero.style.removeProperty('--bl-scene');hero.style.removeProperty('--bl-pos');hero.insertAdjacentHTML('afterbegin',bl17HeroScene(state.ui.tab));}
function blPostProcess(){blApplyHeroArt();}

const BL17_FACILITY_ICONS={Barracks:'roster',Infirmary:'heal',Armory:'vault','Contract Office':'contracts',Stores:'market','Training Yard':'hq','Occult Archive':'info','Artifact Vault':'vault','Command Hall':'hq','Salvager’s Lodge':'vault'};
Object.entries(HQ_DEFS).forEach(([k,d])=>{d.icon=bl17Icon(BL17_FACILITY_ICONS[k]||'hq','facilityIcon')});
NAV.splice(0,NAV.length,['hq',bl17Icon('hq'),'HQ'],['roster',bl17Icon('roster'),'ROSTER'],['contracts',bl17Icon('contracts'),'CONTRACTS'],['world',bl17Icon('world'),'WORLD'],['vault',bl17Icon('vault'),'VAULT']);

topbar=function(){const r=region();return`<div class="topbar"><div class="toprow"><div class="brand"><h1>${esc(state.company.name)}</h1><small>${esc(REGION_DEFS[state.currentRegion].name)} • Day ${state.company.day}</small></div><button class="iconbtn" data-action="audio" title="Audio">${bl17Icon('audio')}</button><button class="iconbtn" data-action="menu" title="Game menu">${bl17Icon('menu')}</button></div><div class="resources"><div class="res">Silver<b>${Math.round(state.company.silver)}</b></div><div class="res">Renown<b>${state.company.renown}</b></div><div class="res">Roster<b>${localRoster().length}/${rosterCap()}</b></div><div class="res">Threat<b>${Math.round(r.threat)}%</b></div></div></div>`};

function bl17RarityBadge(a){const c=bl17Career(a);return`<span class="bl17Rank rank-${a.careerRank}" title="${c.name} career rank">${c.name}</span>`}
function bl17Name(a){return`${esc(a.name)}${a.nickname?` <span class="bl16Nick">“${esc(a.nickname)}”</span>`:''}`}
rosterCard=function(a){const d=derived(a),pct=clamp(a.hp/d.maxHp*100,0,100),skills=bl17Skills(a);return`<button class="card member blMember bl17CareerCard rank-${a.careerRank}" data-action="inspect" data-id="${a.id}"><div class="portrait blPortraitFrame">${blPortraitHTML(a)}</div><div style="text-align:left"><div class="statline"><h4>${bl17Name(a)}</h4><span>Lv.${a.lvl}</span></div><div class="small muted">${esc(a.race)} • <b class="gold">${esc(a.culture)} ${esc(a.className)}</b> ${bl17RarityBadge(a)}</div><div class="tiny muted">${esc(a.background)} • ${esc(a.status)} • ${a.hp}/${d.maxHp} HP • ${a.missions||0} contracts</div><div class="hpbar"><i style="width:${pct}%"></i></div><div class="tiny bl17SkillLine">${skills.map(s=>`${esc(s.name)} ${bl17TierRoman(s.tier)}`).join(' • ')}</div></div><span class="tiny">›</span></button>`};
recruitCard=function(a){const d=derived(a),skills=bl17Skills(a);return`<div class="card member blMember bl17CareerCard rank-${a.careerRank}"><div class="portrait blPortraitFrame">${blPortraitHTML(a)}</div><div><h4>${bl17Name(a)}</h4><div class="small muted">Lv.${a.lvl} ${esc(a.race)} • <b class="gold">${esc(a.culture)} ${esc(a.className)}</b> ${bl17RarityBadge(a)}</div><div class="tiny muted">${esc(a.background)} • ${a.wage}s/week • ${d.maxHp} HP</div><div class="tiny bl17SkillLine">${skills.map(s=>`${esc(s.name)} ${bl17TierRoman(s.tier)}`).join(' • ')}</div></div><div><button class="btn ghost" data-action="inspectRecruit" data-id="${a.id}">ⓘ</button><button class="btn goldbtn" data-action="hire" data-id="${a.id}">Hire ${a.wage*3}s</button></div></div>`};
partyCard=function(p){const ms=partyMembers(p),cap=partyCap(p.regionId),captain=state.roster.find(a=>a.id===p.captainId);return`<div class="card partyCard"><div class="statline"><div><b>${esc(p.name)}</b><div class="tiny muted">${captain?`Captain ${esc(captain.name)} • `:''}${p.missions} missions • ${p.wins} wins${p.specialty?` • ${esc(p.specialty)}`:''}</div></div><span>${ms.length}/${cap}</span></div><div class="faces">${ms.map(a=>{const d=derived(a);return`<div class="face blPartyFace rank-${bl17EnsureCareer(a)}" title="${esc(a.name)} • ${a.hp}/${d.maxHp} HP • ${a.careerRarity}">${blPortraitHTML(a,'blFacePortrait')}<small>${a.lvl}</small></div>`}).join('')||'<span class="small muted">Empty party</span>'}</div><div class="cohesion">Cohesion ${p.cohesion}/100</div><div class="tactics">${['Cautious','Balanced','Aggressive'].map(t=>`<button class="tactic ${p.tactic===t?'active':''}" data-action="tactic" data-id="${p.id}" data-value="${t}" ${p.expedition?'disabled':''}>${t}</button>`).join('')}</div><div class="actions"><button class="btn" data-action="editParty" data-id="${p.id}" ${p.expedition?'disabled':''}>Assign Members</button>${p.expedition?`<button class="btn primary" data-action="nav" data-tab="contracts">Monitor</button>`:''}</div></div>`};
renderModalParty=function(pid){const p=state.parties.find(x=>x.id===pid);if(!p)return;const cap=partyCap(p.regionId);modal(`<div class="sheetHead"><div><h3>${esc(p.name)}</h3><div class="tiny muted">${p.members.length}/${cap} • Cohesion ${p.cohesion}</div></div><button class="x" data-action="close">×</button></div><div class="notice">Health, career rank and class skills are visible here. Rank rises through completed contracts.</div><div class="list blPartyPicker" style="margin-top:8px">${localRoster(p.regionId).filter(a=>a.status==='Ready'||p.members.includes(a.id)).map(a=>{const inP=p.members.includes(a.id),other=state.parties.some(q=>q.id!==p.id&&q.members.includes(a.id)),d=derived(a),pct=clamp(a.hp/d.maxHp*100,0,100);return`<div class="card blPickCard rank-${bl17EnsureCareer(a)}"><div class="blPickIdentity"><div class="portrait blPickPortrait">${blPortraitHTML(a)}</div><div class="blPickMeta"><b>${bl17Name(a)}</b><div class="tiny muted">${esc(a.culture)} ${esc(a.className)} • Lv.${a.lvl} • ${a.careerRarity}</div><div class="tiny ${pct<45?'danger':'muted'}">${a.hp}/${d.maxHp} HP${a.injury?` • ${esc(a.injury)} • ${a.recovery}d`:''}</div><div class="hpbar"><i style="width:${pct}%"></i></div></div></div><div class="blPickActions"><button class="btn" data-action="toggleMember" data-party="${p.id}" data-id="${a.id}" ${other?'disabled':''}>${inP?'Remove':'Add'}</button>${inP?`<button class="btn ghost" data-action="captain" data-party="${p.id}" data-id="${a.id}">${p.captainId===a.id?'Captain':'Make Captain'}</button>`:''}</div></div>`}).join('')}</div>`)};

unitHTML=function(u){let mark;if(u.charId){const a=state.roster.find(x=>x.id===u.charId);mark=a?blPortraitHTML(a,'blCombatPortrait'):bl17RaceMini(u.race||'Human')}else mark=blEnemyPortrait(u);const rank=u.charId?` rank-${bl17EnsureCareer(state.roster.find(x=>x.id===u.charId)||{})}`:'';return`<div class="unit ${u.hp<=0?'dead':''} ${u.legendary?'unitLegendary':''}${rank}"><div class="unitTop"><span class="unitIdentity">${mark}<b>${esc(u.name)}</b></span><span>${Math.max(0,Math.round(u.hp))}/${u.maxHp}</span></div><div class="hpbar"><i style="width:${clamp(u.hp/u.maxHp*100,0,100)}%"></i></div></div>`};

itemHTML=function(item){return`<div class="card itemCard bl17ItemCard"><div class="bl17ItemIcon rarity-${item.rarity+1}">${bl17ItemSvg(item)}</div><div class="bl17ItemBody"><div class="statline"><div><b class="rarity-${item.rarity+1}">${esc(RARITIES[item.rarity]||'Legacy')} ${esc(item.name)}</b><div class="tiny muted">${esc(item.slot||item.type||'item')} • ${item.mods?.length||0} modifier${item.mods?.length===1?'':'s'}</div></div><span class="rarity-${item.rarity+1}">${Math.max(1,(item.rarity||0)+1)}◆</span></div><div class="itemMods">${(item.mods||[]).map(m=>`<div>• ${esc(m.label)}</div>`).join('')||'<div>• Legacy item with no generated modifiers.</div>'}</div></div></div>`};

contractCard=function(c){const r=state.regions[c.regionId],nem=c.nemesisId?state.nemeses.find(n=>n.id===c.nemesisId&&n.alive):null;return`<div class="card contract ${nem?'boss':''}"><div class="bl17ContractHead"><div class="bl17EnemyThumb">${bl17EnemySvg({species:c.species,legendary:!!c.legendary})}</div><div><div class="statline"><h4>${esc(c.title)}</h4><span class="riskDots">${'●'.repeat(c.risk)}${'○'.repeat(5-c.risk)}</span></div><div class="small muted">${esc(c.type)} • ${esc(c.species)} • approximately ${c.enemyCount} enemies</div></div></div><p class="small">${esc(c.desc)}</p><div class="grid3"><div class="tiny"><span class="muted">Reward</span><br><b class="gold">${money(c.reward)}</b></div><div class="tiny"><span class="muted">Field check</span><br>${esc(c.check)}</div><div class="tiny"><span class="muted">Unknowns</span><br>${c.unknown}</div></div>${nem?`<div class="notice danger"><b>Named enemy:</b> ${esc(nem.name)} • Level ${nem.level}</div>`:''}<div class="actions"><button class="btn ghost" data-action="contractInfo" data-id="${c.id}">Inspect</button><button class="btn primary" data-action="chooseParty" data-id="${c.id}">Send Party</button></div></div>`};

regionCard=function(id){const r=state.regions[id],d=REGION_DEFS[id],req=branchRequirements(id),current=id===state.currentRegion;return`<div class="card regionCard ${current?'regionCurrent':''} ${r.lost?'lost':''}"><div class="bl17RegionBanner">${bl17RegionScene(id)}</div><div class="regionHead"><div><h3>${esc(d.name)}</h3><div class="tiny muted">${esc(d.culture)} culture • Common threat: <b>${esc(d.common)}</b></div></div><span class="pill">${r.hq.established?'HQ ACTIVE':'NO HQ'}</span></div><p class="small muted">${esc(d.desc)}</p><div class="regionStats"><div class="regionStat"><span>PROSPERITY</span><b>${Math.round(r.prosperity)}</b><div class="meter"><i style="width:${r.prosperity}%"></i></div></div><div class="regionStat"><span>STABILITY</span><b>${Math.round(r.stability)}</b><div class="meter"><i style="width:${r.stability}%"></i></div></div><div class="regionStat"><span>THREAT</span><b>${Math.round(r.threat)}</b><div class="meter"><i style="width:${r.threat}%"></i></div></div></div><div class="stockMeta"><span class="tag">Market: ${marketQualityText(r.prosperity)}</span><span class="tag">Recruitment: ${stabilityText(r.stability)}</span><span class="tag">Settlements ${r.settlements}/${r.totalSettlements}</span><span class="tag">Nemeses ${state.nemeses.filter(n=>n.regionId===id&&n.alive).length}</span></div><div class="actions">${r.hq.established?`<button class="btn ${current?'':'primary'}" data-action="switchRegion" data-id="${id}" ${current?'disabled':''}>${current?'Current HQ':'Switch HQ'}</button>`:`<button class="btn goldbtn" data-action="foundBranch" data-id="${id}">Found Branch • ${money(req.cost)} • ${req.renown} Renown</button>`}<button class="btn ghost" data-action="regionInfo" data-id="${id}">Details</button></div></div>`};

renderVault=function(){const inv=localInventory(),caches=state.caches.filter(c=>c.regionId===state.currentRegion);return`<div class="hero"><div class="kicker">ARMORY & VAULT</div><h2>${inv.reduce((s,x)=>s+x.qty,0)} stored items</h2><p>Equipment remains procedural; its icons are now crisp native SVG and rarity stays mechanical.</p></div><div class="sectionTitle"><h3>Loot Caches</h3><span>${caches.length}</span></div><div class="grid2">${caches.length?caches.map(c=>`<button class="card bl17CacheCard" data-action="openCache" data-id="${c.id}">${blCacheArt(c.rarity,'blCacheThumb')}<b class="rarity-${c.rarity+1}">${esc(c.name)}</b><div class="tiny muted">Recovered from ${esc(c.from)}</div></button>`).join(''):'<div class="empty" style="grid-column:1/-1">No unopened caches here.</div>'}</div><div class="sectionTitle"><h3>Inventory</h3><span>Local to ${esc(regionDef().name)}</span></div><div class="list">${inv.length?inv.map(e=>`<div class="card bl17InventoryRow"><div class="bl17MiniItem">${bl17ItemSvg(e.item)}</div><div class="marketRow"><div><b class="rarity-${(e.item.rarity||0)+1}">${esc(RARITIES[e.item.rarity]||'Legacy')} ${esc(e.item.name)}</b><div class="tiny muted">${esc(e.item.slot||e.item.type||'item')} • ×${e.qty}</div></div><button class="btn ghost" data-action="itemInfo" data-id="${e.item.id}">ⓘ</button></div><div class="actions"><button class="btn" data-action="sell" data-id="${e.item.id}">Sell ${money(Math.max(1,Math.round(itemPrice(e.item,state.currentRegion)*.45)))}</button></div></div>`).join(''):'<div class="empty">No equipment stored at this HQ.</div>'}</div><div class="sectionTitle"><h3>Artifacts</h3><span>${state.artifacts.length}</span></div><div class="list">${state.artifacts.length?state.artifacts.map(a=>`<div class="card"><div class="bl17ArtifactIcon">${bl17ItemSvg({name:a.name,slot:'charm'})}</div><b class="rarity-5">${esc(a.name)}</b><div class="small muted">${esc(a.desc||'An impossible relic.')}</div><div class="tiny danger">Cost: ${esc(a.cost||'Unknown')}</div></div>`).join(''):'<div class="empty">No artifacts secured.</div>'}</div>`};

const _renderHQV17=renderHQ;
renderHQ=function(){return _renderHQV17().replace('🛒 Market',`${bl17Icon('market')} Market`).replace('🌙 Rest Day',`${bl17Icon('rest')} Rest Day`).replace('ⓘ Systems',`${bl17Icon('info')} Systems`)};

const _renderMarketV17=renderMarket;
renderMarket=function(){_renderMarketV17();const sheet=document.getElementById('sheet');if(!sheet)return;sheet.querySelectorAll('.blMarketBanner').forEach(x=>x.remove());const h=sheet.querySelector('.sheetHead h3');if(h)h.innerHTML=`${bl17Icon('market')} ${esc(REGION_DEFS[state.currentRegion].culture)} Market`;sheet.insertAdjacentHTML('afterbegin',`<div class="bl17MarketBanner">${bl17RegionScene(state.currentRegion)}</div>`)};

const _renderInspectV17=renderInspect;
renderInspect=function(id,recruit=false){_renderInspectV17(id,recruit);const a=(recruit?region().recruits:state.roster).find(x=>x.id===id),sheet=document.getElementById('sheet');if(!a||!sheet)return;const c=bl17Career(a),skills=bl17Skills(a);const anchor=sheet.querySelector('.blInspectPortrait')||sheet.querySelector('.sheetHead');if(anchor&&!sheet.querySelector('.bl17CareerPanel'))anchor.insertAdjacentHTML('afterend',`<div class="card bl17CareerPanel rank-${a.careerRank}"><div class="statline"><div><b>${c.name} Adventurer</b><div class="tiny muted">${a.missions||0} completed contracts • next rank ${a.careerRank<4?`${BL17_CAREER[a.careerRank+1].min} contracts`:'MAXIMUM'}</div></div>${bl17RarityBadge(a)}</div><div class="bl17Skills">${skills.map(s=>`<div class="bl17Skill"><b>${esc(s.name)} ${bl17TierRoman(s.tier)}</b><span>${esc(bl17SkillText(s))}</span></div>`).join('')}</div><div class="tiny muted bl17LevelNote">Level ${a.lvl}: every level improves all core stats, with extra growth in the class primary stat.</div></div>`)};

renderStart=function(){document.body.dataset.region='start';document.getElementById('app').className='';document.getElementById('app').innerHTML=`<div class="start"><div class="startPanel blStartPanel bl17Start"><div class="bl17TitleMark">${bl17SvgWrap('<path d="M36 17H64M42 17V29H58V17M34 30H66L73 78H27Z" fill="#15191b" stroke="#d6ad55" stroke-width="5"/><path d="M39 47Q50 32 61 47Q57 66 50 71Q43 66 39 47Z" fill="#8d342d" stroke="#d6ad55" stroke-width="3"/><path d="M50 36L45 52L53 49L48 66" fill="none" stroke="#f0d48a" stroke-width="3"/>','bl17TitleLantern','Broken Lantern')}</div><div class="blStartForm"><h1>The Broken Lantern</h1><p>Build an adventuring company in a world where civilization survives by paying people like you to walk outside the walls.</p><div class="label">Name your company</div><input id="companyName" class="field" maxlength="32" placeholder="e.g. The Black Hounds"><button class="btn primary wide" data-action="begin">FOUND COMPANY</button><p class="tiny muted">You begin in Greyhaven, in the Graven March of the Veyric Marches.</p></div></div></div>`;document.getElementById('nav').innerHTML=''};

showMenu=function(){modal(`<div class="sheetHead"><h3>${bl17Icon('menu')} Game Menu</h3><button class="x" data-action="close">×</button></div><div class="list"><button class="card" data-action="audio"><b>${bl17Icon('audio')} Audio</b><div class="tiny muted">Music and effects volumes</div></button><button class="card" data-action="backup"><b>${bl17Icon('vault')} Save & Backup</b><div class="tiny muted">Copy or restore your company save</div></button><button class="card dangerBtn" data-action="newGame"><b>${bl17Icon('newgame')} New Game</b><div class="tiny">Permanently replace this company</div></button></div>`)};

const _renderV17=render;
render=function(){_renderV17();if(state){blPostProcess();save()}};

const _auditV17=audit;
audit=function(){const out=_auditV17();out.v17CareerRarity=true;out.v17CareerMilestones=BL17_CAREER.map(x=>x.min);out.v17TieredClassSkills=true;out.v17SvgOnlyGameplayVisuals=true;out.v17RasterGameplayVisuals=false;out.v17LevelGrowth='all core stats + class primary';return out};
window.__BL_AUDIT=audit;
