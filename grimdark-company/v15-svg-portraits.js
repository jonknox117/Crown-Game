/* Broken Lantern v15 — crisp modular adventurer portraits.
   No raster portrait atlas: race + gender head, culture torso. */

function bl15Hash(s){let h=2166136261;for(let i=0;i<String(s).length;i++){h^=String(s).charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}

const BL15_CULTURE_COLORS={
 Veyric:{base:'#294b78',dark:'#15283f',trim:'#a88a52'},
 Skeldic:{base:'#49686b',dark:'#263b3d',trim:'#a6afb0'},
 Hoshin:{base:'#7d3038',dark:'#3f171c',trim:'#b89066'},
 Nambaran:{base:'#98612f',dark:'#4e301d',trim:'#d0a05f'},
 Aethren:{base:'#d0c28d',dark:'#676044',trim:'#f0e3ae'}
};
const BL15_HAIR=['#201915','#34251d','#59321f','#7a4c27','#a68760','#3a3a39'];
const BL15_HUMAN_SKIN=['#d7aa86','#bd8768','#8e6048','#6b4938'];
const BL15_ELF_SKIN=['#dfc2aa','#c9a58d','#aa8170'];
const BL15_DWARF_SKIN=['#c99370','#aa6f54','#87513e'];
const BL15_ORC_SKIN=['#75806a','#65715d','#566351','#859078'];
const BL15_GENDER_BY_NAME={
 Edric:'Male',Morga:'Female',Branna:'Female',Sylwen:'Female',Harl:'Male',Vessa:'Female',Torren:'Male',Kelda:'Female',Orin:'Male',Maela:'Female',Garrik:'Male',Sorn:'Male',Elian:'Male',Brok:'Male',Nessa:'Female',Dorr:'Male',Avel:'Female',Rusk:'Male',Thalen:'Male',Yara:'Female',Korr:'Male',Miren:'Female',Sten:'Male',Asha:'Female',Jiro:'Male',Hana:'Female',Kaito:'Male',Sable:'Female',Nara:'Female',Veyl:'Male'
};
function bl15FirstName(a){return String(a?.name||'').trim().split(/\s+/)[0]||''}
function bl15EnsureGender(a){
 if(!a)return'Male';
 if(a.gender==='Male'||a.gender==='Female')return a.gender;
 const named=BL15_GENDER_BY_NAME[bl15FirstName(a)];
 a.gender=named||(bl15Hash(`${a.id}|${a.name}|gender`)%2?'Female':'Male');
 return a.gender;
}
function bl15Pick(arr,a,salt=''){return arr[bl15Hash(`${a?.id}|${a?.name}|${salt}`)%arr.length]}
function bl15EscAttr(v){return String(v??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;')}
function bl15CultureTorso(culture){
 const c=BL15_CULTURE_COLORS[culture]||BL15_CULTURE_COLORS.Veyric;
 if(culture==='Skeldic')return`<path d="M7 97Q11 73 29 66L40 61H60L72 66Q89 73 93 97Z" fill="${c.dark}"/><path d="M10 96Q15 76 31 69L40 65H60L70 69Q85 76 90 96Z" fill="${c.base}"/><path d="M20 75Q31 62 41 64L50 73L59 64Q70 62 80 75L72 82L62 75L50 84L38 75L28 82Z" fill="#b9b9b2" opacity=".82"/><path d="M22 79L34 72M78 79L66 72" stroke="${c.trim}" stroke-width="2"/>`;
 if(culture==='Hoshin')return`<path d="M8 97Q13 73 31 66L42 62H58L69 66Q87 73 92 97Z" fill="${c.dark}"/><path d="M12 96Q17 77 32 70L42 66H58L68 70Q83 77 88 96Z" fill="${c.base}"/><path d="M33 67L50 84L67 67" fill="none" stroke="#171719" stroke-width="7"/><path d="M35 67L50 80L65 67" fill="none" stroke="${c.trim}" stroke-width="2.2"/><path d="M16 88H84" stroke="#4c171b" stroke-width="3"/>`;
 if(culture==='Nambaran')return`<path d="M7 97Q12 73 30 66L42 62H58L71 66Q89 73 93 97Z" fill="${c.dark}"/><path d="M11 96Q17 77 33 70L43 66H59L69 70Q83 78 89 96Z" fill="${c.base}"/><path d="M21 70Q42 81 78 69L72 81Q47 89 17 78Z" fill="#d2b17b"/><path d="M18 82L81 72" stroke="${c.trim}" stroke-width="2"/><circle cx="72" cy="77" r="4" fill="${c.trim}"/>`;
 if(culture==='Aethren')return`<path d="M8 97Q13 72 32 65L43 60H57L68 65Q87 72 92 97Z" fill="${c.dark}"/><path d="M12 96Q18 76 34 68L43 64H57L66 68Q82 76 88 96Z" fill="${c.base}"/><path d="M34 69L50 83L66 69L61 64H39Z" fill="#f1ead0"/><path d="M50 72V94" stroke="${c.trim}" stroke-width="2"/>`;
 return`<path d="M7 97Q12 73 30 66L41 62H59L70 66Q88 73 93 97Z" fill="${c.dark}"/><path d="M11 96Q16 77 32 70L42 66H58L68 70Q84 77 89 96Z" fill="${c.base}"/><path d="M28 70L42 82L50 72L58 82L72 70" fill="none" stroke="${c.trim}" stroke-width="2.4"/><path d="M50 73V96" stroke="#132035" stroke-width="4"/><circle cx="50" cy="79" r="3.4" fill="${c.trim}"/>`;
}
function bl15FacePath(gender,race){
 if(race==='Dwarf')return gender==='Female'?'M31 28Q34 15 50 13Q66 15 69 28V47Q66 62 50 68Q34 62 31 47Z':'M29 28Q33 14 50 12Q67 14 71 28V48Q67 61 50 66Q33 61 29 48Z';
 if(race==='Orc')return gender==='Female'?'M30 27Q34 14 50 13Q66 14 70 27L68 49Q63 63 50 68Q37 63 32 49Z':'M27 28Q32 13 50 12Q68 13 73 28L70 50Q64 64 50 68Q36 64 30 50Z';
 if(gender==='Female')return'M33 25Q37 12 50 11Q63 12 67 25V45Q64 59 50 66Q36 59 33 45Z';
 return'M31 25Q35 12 50 11Q65 12 69 25V46Q65 60 50 66Q35 60 31 46Z';
}
function bl15HairSvg(a,gender,race,hair){
 const variant=bl15Hash(`${a.id}|hair`)%3;
 if(race==='Dwarf'&&gender==='Male')return`<path d="M29 29Q31 12 50 9Q69 12 71 29L64 24Q50 17 36 24Z" fill="${hair}"/><path d="M34 48Q37 62 50 72Q63 62 66 48Q62 67 57 79L50 75L43 79Q38 67 34 48Z" fill="${hair}"/><path d="M42 58L42 78M58 58L58 78" stroke="#211713" stroke-width="2"/>`;
 if(race==='Dwarf'&&gender==='Female')return`<path d="M31 28Q32 11 50 9Q68 11 69 28L63 22Q50 16 37 22Z" fill="${hair}"/><path d="M32 28Q25 45 31 67L37 61L39 34ZM68 28Q75 45 69 67L63 61L61 34Z" fill="${hair}"/><path d="M33 53L29 73M67 53L71 73" stroke="${hair}" stroke-width="5"/>`;
 if(gender==='Female'){
  if(variant===0)return`<path d="M32 28Q31 11 50 8Q69 11 68 28L62 21Q50 15 38 21Z" fill="${hair}"/><path d="M32 25Q24 43 29 67L35 61L38 31ZM68 25Q76 43 71 67L65 61L62 31Z" fill="${hair}"/>`;
  if(variant===1)return`<path d="M31 29Q34 10 51 9Q68 12 69 28L62 20Q48 16 36 23Z" fill="${hair}"/><path d="M68 25Q77 44 68 65L63 57L61 31Z" fill="${hair}"/><path d="M31 27Q25 42 31 58L37 52L38 31Z" fill="${hair}"/>`;
  return`<path d="M32 28Q36 9 50 9Q64 9 68 28L61 20Q50 14 39 20Z" fill="${hair}"/><path d="M30 24Q27 40 32 54L38 47L39 29ZM70 24Q73 40 68 54L62 47L61 29Z" fill="${hair}"/>`;
 }
 if(variant===0)return`<path d="M31 28Q34 10 50 8Q66 10 69 28L62 21Q50 16 37 23Z" fill="${hair}"/>`;
 if(variant===1)return`<path d="M30 27Q37 8 54 10Q69 13 70 29L63 21Q50 17 36 24Z" fill="${hair}"/><path d="M35 16L28 29L38 24Z" fill="${hair}"/>`;
 return`<path d="M32 26Q38 9 51 9Q64 10 69 25L61 21L54 17L48 22L40 18Z" fill="${hair}"/>`;
}
function bl15HeadSvg(a){
 const gender=bl15EnsureGender(a),race=['Human','Elf','Dwarf','Orc'].includes(a.race)?a.race:'Human';
 const skin=bl15Pick(race==='Elf'?BL15_ELF_SKIN:race==='Dwarf'?BL15_DWARF_SKIN:race==='Orc'?BL15_ORC_SKIN:BL15_HUMAN_SKIN,a,'skin');
 const hair=bl15Pick(BL15_HAIR,a,'hair');
 const eye=race==='Orc'?'#d8b96a':'#ddd8c7';
 let extra='';
 if(race==='Elf')extra=`<path d="M34 29L17 22L32 39Z" fill="${skin}" stroke="#17191b" stroke-width="1.5"/><path d="M66 29L83 22L68 39Z" fill="${skin}" stroke="#17191b" stroke-width="1.5"/>`;
 else if(race==='Orc')extra=`<path d="M31 31L18 27L31 40Z" fill="${skin}" stroke="#17191b" stroke-width="1.5"/><path d="M69 31L82 27L69 40Z" fill="${skin}" stroke="#17191b" stroke-width="1.5"/><path d="M39 55L43 64L46 54Z" fill="#e1d3aa" stroke="#27231c"/><path d="M61 55L57 64L54 54Z" fill="#e1d3aa" stroke="#27231c"/>`;
 else extra=`<ellipse cx="31" cy="36" rx="4" ry="7" fill="${skin}"/><ellipse cx="69" cy="36" rx="4" ry="7" fill="${skin}"/>`;
 const scar=(bl15Hash(`${a.id}|scar`)%5===0)?'<path d="M58 28L54 43" stroke="#77453c" stroke-width="1.6" opacity=".8"/>':'';
 return`<path d="M42 58V72H58V58" fill="${skin}" stroke="#17191b" stroke-width="1.4"/>${extra}<path d="${bl15FacePath(gender,race)}" fill="${skin}" stroke="#17191b" stroke-width="1.8"/>${bl15HairSvg(a,gender,race,hair)}<path d="M39 35Q43 32 47 35M53 35Q57 32 61 35" fill="none" stroke="#24201e" stroke-width="1.8"/><circle cx="43" cy="36" r="1.3" fill="${eye}"/><circle cx="57" cy="36" r="1.3" fill="${eye}"/><path d="M50 36L47 47L51 48" fill="none" stroke="#6f5547" stroke-width="1.3"/><path d="M43 54Q50 57 57 54" fill="none" stroke="#51372f" stroke-width="1.4"/>${scar}`;
}
function bl15PortraitSvg(a){
 const gender=bl15EnsureGender(a),culture=a.culture||'Veyric';
 return`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${bl15EscAttr(a.name)} — ${bl15EscAttr(gender)} ${bl15EscAttr(a.race)} of ${bl15EscAttr(culture)}"><rect width="100" height="100" fill="#090b0c"/><path d="M5 98H95" stroke="#303538" stroke-width="2"/>${bl15CultureTorso(culture)}${bl15HeadSvg(a)}<path d="M2 2H98V98H2Z" fill="none" stroke="#555b5e" stroke-width="2"/></svg>`;
}
var blPortraitHTML=function(a,cls=''){
 if(!a)return raceGlyph('Human');
 return`<span class="blSvgPortrait ${cls}" data-race="${bl15EscAttr(a.race)}" data-gender="${bl15EscAttr(bl15EnsureGender(a))}" data-culture="${bl15EscAttr(a.culture)}">${bl15PortraitSvg(a)}</span>`;
};

/* Veyric v11 inspect wrapper only inserted portraits for atlas-supported characters.
   Add the modular portrait for any culture when it did not already insert one. */
const _renderInspectV15=renderInspect;
renderInspect=function(id,recruit=false){
 _renderInspectV15(id,recruit);
 const a=(recruit?region().recruits:state.roster).find(x=>x.id===id);if(!a)return;
 const sheet=document.getElementById('sheet'),head=sheet?.querySelector('.sheetHead');
 if(head&&!sheet.querySelector('.blInspectPortrait'))head.insertAdjacentHTML('afterend',`<div class="blInspectPortrait">${blPortraitHTML(a,'blPortraitLarge')}<div><b>${esc(a.name)}</b><div class="small muted">${esc(bl15EnsureGender(a))} ${esc(a.race)} • ${esc(a.culture)} ${esc(a.className)}</div></div></div>`);
};

const _auditV15=audit;
audit=function(){const out=_auditV15();out.v15SvgPortraits=true;out.v15RasterAdventurerPortraits=false;out.v15PortraitLayers=['race+gender head','culture torso'];return out};
window.__BL_AUDIT=audit;