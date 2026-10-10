/* Grim Company v21.10.6 — automatically hosted original portrait and stage artwork.
 * Images are standalone, losslessly transferred files; no canvas, resizing, or re-encoding.
 * Changes only presentation. Saves and simulation are unchanged. */
const GC426_VERSION='21.10.6';
const GC426_SCENE_FILES={
 chapterhouse:'blood_moon_mercenary_hall.png',
 market:'twilight_market_beneath_the_griffin_keep.png',
 musterYard:'crimson_moon_fortress_training_yard.png',
 marchWatch:'blood_moon_watchpost.png',
 pilgrimHouse:'gothic_infirmary_by_candlelight.png',
 jobsBoard:'medieval_fantasy_contract_hall.png',
 armory:'gothic_griffon_castle_armory_workshop.png',
 worldMap:'candlelit_fantasy_war_room_map.png'
};
const GC426_FOCUS={chapterhouse:'50% 50%',market:'50% 53%',musterYard:'50% 50%',marchWatch:'48% 51%',pilgrimHouse:'50% 56%',jobsBoard:'52% 51%',armory:'50% 54%',worldMap:'50% 53%'};
Object.keys(GC426_SCENE_FILES).forEach(id=>{
 if(GC381_SCENES[id]){
  GC381_SCENES[id].file=GC426_SCENE_FILES[id];
  GC381_SCENES[id].focus=GC426_FOCUS[id];
 }
});
const _gc426BlPortraitHTML=blPortraitHTML;
blPortraitHTML=function(adventurer,cls=''){
 const key=gc425Key(adventurer);
 if(!key)return _gc426BlPortraitHTML(adventurer,cls);
 const src=GC425_URLS[key]||('../art/portraits/original-50/'+key+'.jpg');
 return '<span class="blSvgPortrait gc425Portrait gc426OriginalPortrait '+esc(cls)+'" data-gc425-portrait="'+key+'">'+
 '<img src="'+src+'" alt="'+esc(String(adventurer.name||adventurer.race||'Adventurer'))+' portrait" loading="eager" decoding="async" draggable="false"></span>';
};
const _gc426OldStageHTML=gc380StageHTML;
gc380StageHTML=function(scene){
 return _gc426OldStageHTML(scene).replace('ORIGINAL VECTOR ENVIRONMENT','ORIGINAL ENVIRONMENT ART');
};
function gc426ArtStyles(){
 if(document.getElementById('gc426Styles'))return;
 const s=document.createElement('style');s.id='gc426Styles';
 s.textContent=[
  '.gc381Stage .gc380Artwork{width:100%;height:100%;object-fit:cover;image-rendering:auto;filter:none!important;transform:none!important}',
  '.gc426OriginalPortrait>img{width:100%;height:100%;object-fit:cover;object-position:center 34%;image-rendering:auto;filter:none!important;transform:none!important}',
  '#gc425Trigger{display:none!important}'
 ].join('');
 document.head.appendChild(s);
}
gc426ArtStyles();
window.__GC426_TEST=function(){
 const files=Object.keys(GC426_SCENE_FILES).length===8&&new Set(Object.values(GC426_SCENE_FILES)).size===8;
 const portraits=GC425_SLOTS.length===50&&new Set(GC425_SLOTS).size===50;
 const probe=blPortraitHTML({id:'gc426-probe',name:'Probe',culture:'Veyric',race:'Orc',gender:'Female'});
 return {ok:files&&portraits&&probe.includes('veyric_orc_female.jpg')&&
  Object.keys(GC426_SCENE_FILES).every(id=>GC381_SCENES[id]?.file===GC426_SCENE_FILES[id]),
  scenes:Object.keys(GC426_SCENE_FILES).length,portraits:GC425_SLOTS.length,version:GC426_VERSION};
};