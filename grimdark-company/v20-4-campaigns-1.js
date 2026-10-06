/* Grim Company v20.4 — Regional Campaigns
   Patch 2: contracts are jobs; campaigns are sustained regional operations.
   Campaign operations reuse the proven contract/expedition/combat pipeline while
   rewards are escrowed until the whole operation chain is completed. */
const GC240_VERSION='20.4';
const GC240_OFFER_COUNT=3;
const GC240_THEME_DEFS={
 raiders:{focus:'threat',names:['The Black Road','War on the Ash Banner','The Wolf-Toll'],summary:'A coordinated raider force is becoming a regional problem.',stages:[
  {label:'Trace Their Supply Route',type:'Investigation',check:'scout'},
  {label:'Recover the Taken',type:'Rescue',check:'scout'},
  {label:'Break the Forward Camp',type:'Extermination',check:'endure'},
  {label:'Hunt the Field Captain',type:'Hunt',check:'scout'},
  {label:'Storm the Stronghold',type:'Siege',check:'endure'}]},
 monsters:{focus:'threat',names:['The Red Maw','The Hollow Hunt','Teeth in the Dark'],summary:'Predators are multiplying faster than local settlements can contain them.',stages:[
  {label:'Read the Spoor',type:'Hunt',check:'scout'},
  {label:'Pull Survivors Out',type:'Rescue',check:'endure'},
  {label:'Burn the Nests',type:'Extermination',check:'scout'},
  {label:'Track the Alpha',type:'Hunt',check:'endure'},
  {label:'Kill the Beast',type:'Extermination',check:'endure'}]},
 cult:{focus:'stability',names:['The Ashen Litany','The Hidden Choir','The Veiled Rite'],summary:'A secretive cult is undermining the region from inside its settlements.',stages:[
  {label:'Follow the Whispers',type:'Investigation',check:'occult'},
  {label:'Secure the Profaned Relic',type:'Retrieval',check:'occult'},
  {label:'Break the Ritual Site',type:'Extermination',check:'occult'},
  {label:'Find the Hidden Master',type:'Hunt',check:'occult'},
  {label:'Silence the Hierophant',type:'Assassination',check:'occult'}]},
 unrest:{focus:'stability',names:['The Broken Oath','The Splintered Banner','The Long Riot'],summary:'Local authority is failing and armed unrest is becoming organized.',stages:[
  {label:'Hear the Grievances',type:'Negotiation',check:'talk'},
  {label:'Guard the Magistrates',type:'Defense',check:'talk'},
  {label:'Expose the Agitators',type:'Investigation',check:'scout'},
  {label:'Break the Armed Cell',type:'Extermination',check:'endure'},
  {label:'End the Uprising',type:'Defense',check:'talk'}]},
 crime:{focus:'stability',names:['The Gilded Knife','The Quiet Syndicate','The Crooked Ledger'],summary:'An organized criminal network has become too entrenched to ignore.',stages:[
  {label:'Trace the Stolen Goods',type:'Investigation',check:'sneak'},
  {label:'Escort the Witness',type:'Escort',check:'talk'},
  {label:'Raid the Safehouse',type:'Retrieval',check:'sneak'},
  {label:'Hunt the Lieutenant',type:'Hunt',check:'scout'},
  {label:'Take the Kingpin',type:'Assassination',check:'sneak'}]},
 trade:{focus:'prosperity',names:['The Choked Road','The Empty Market','The Broken Caravan'],summary:'Trade has become unreliable enough to drag down the whole region.',stages:[
  {label:'Survey the Road',type:'Exploration',check:'scout'},
  {label:'Recover the Lost Cargo',type:'Retrieval',check:'scout'},
  {label:'Escort the Relief Train',type:'Escort',check:'endure'},
  {label:'Break the Extortionists',type:'Extermination',check:'talk'},
  {label:'Reopen the Route',type:'Caravan',check:'talk'}]},
 reclaim:{focus:'prosperity',names:['The Fallen Works','The Dead Mine','The Ruined Crossing'],summary:'A valuable site can be restored, but only after a chain of dangerous work.',stages:[
  {label:'Survey the Ruins',type:'Exploration',check:'scout'},
  {label:'Rescue the Trapped Crew',type:'Rescue',check:'endure'},
  {label:'Recover the Tools',type:'Retrieval',check:'endure'},
  {label:'Hold the Worksite',type:'Defense',check:'endure'},
  {label:'Secure the Site',type:'Extermination',check:'scout'}]},
 relic:{focus:'adventure',names:['The Sealed Door','The Black Reliquary','The Forgotten Stair'],summary:'Old clues point toward something valuable and extremely dangerous.',stages:[
  {label:'Decode the Signs',type:'Investigation',check:'occult'},
  {label:'Enter the Ruin',type:'Exploration',check:'scout'},
  {label:'Recover the Key',type:'Retrieval',check:'occult'},
  {label:'Survive the Guardians',type:'Extermination',check:'endure'},
  {label:'Claim the Relic',type:'Retrieval',check:'occult'}]},
 legend:{focus:'adventure',names:['The Last Hunt','The Crowned Beast','The Old Terror'],summary:'A legendary quarry has surfaced. Killing it would make the company famous.',stages:[
  {label:'Gather the Sightings',type:'Investigation',check:'scout'},
  {label:'Track the Quarry',type:'Hunt',check:'scout'},
  {label:'Enter the Lair',type:'Exploration',check:'endure'},
  {label:'Bleed the Beast',type:'Hunt',check:'endure'},
  {label:'Slay the Legend',type:'Extermination',check:'endure'}]}
};
const GC240_PLACES={
 veyric:['Blackmere','Gallows Ford','Saint’s Road','Red Chapel','Greyfen'],
 skeld:['Black Crag','Frostvein','Ash Fjord','Old Delve','Stonewake'],
 hoshin:['Moon Gate','Cedar Pass','Glass Shrine','Kuro Vale','White Bridge'],
 nambara:['Red Gorge','Bone Road','Sunken Well','Spear Plain','Dust Crown'],
 firmament:['Starfall Verge','Hollow Meridian','Glass Horizon','Ninth Stair','Dead Constellation']
};
const GC240_FOCUS_LABEL={threat:'THREAT',stability:'STABILITY',prosperity:'PROSPERITY',adventure:'LEGENDARY WORK'};
let GC240_FINISH_CONTEXT=null;

function gc240Clone(x){return x==null?x:JSON.parse(JSON.stringify(x))}
function gc240Hash(text){const h=typeof blHash==='function'?blHash(String(text)):Array.from(String(text)).reduce((n,c)=>((n*31+c.charCodeAt(0))|0),7);return(h>>>0)||1}
function gc240Rng(seed){let x=(Number(seed)>>>0)||1;return()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296}}
function gc240Pick(rng,arr){return arr[Math.min(arr.length-1,Math.floor(rng()*arr.length))]}
function gc240Int(rng,a,b){return a+Math.floor(rng()*(b-a+1))}
function gc240InitRegion(r){
 if(!r)return r;r.gc240Campaigns=r.gc240Campaigns||{};const cs=r.gc240Campaigns;
 cs.offers=Array.isArray(cs.offers)?cs.offers:[];cs.history=Array.isArray(cs.history)?cs.history:[];cs.generation=Number(cs.generation)||0;cs.active=cs.active||null;
 if(cs.active){const c=cs.active;c.stages=Array.isArray(c.stages)?c.stages:[];c.currentStage=clamp(Number(c.currentStage)||0,0,Math.max(0,c.stages.length-1));c.failures=Number(c.failures)||0;c.antagonistPower=Number(c.antagonistPower)||0;c.participants=Array.isArray(c.participants)?c.participants:[];c.deaths=Array.isArray(c.deaths)?c.deaths:[];c.results=Array.isArray(c.results)?c.results:[];c.escrow=c.escrow||{silver:0,renown:0,items:[],caches:[],artifacts:[],region:{threat:0,stability:0,prosperity:0}};c.escrow.items=Array.isArray(c.escrow.items)?c.escrow.items:[];c.escrow.caches=Array.isArray(c.escrow.caches)?c.escrow.caches:[];c.escrow.artifacts=Array.isArray(c.escrow.artifacts)?c.escrow.artifacts:[];c.escrow.region=c.escrow.region||{threat:0,stability:0,prosperity:0}}
 return r;
}
function gc240InitState(s=state){if(!s)return s;s.timeSystem=s.timeSystem||{};s.timeSystem.gc240Version=GC240_VERSION;Object.values(s.regions||{}).forEach(gc240InitRegion);return s}
const _normalizeStateGC240=normalizeState;
normalizeState=function(s){return gc240InitState(_normalizeStateGC240(s))};
const _createStateGC240=createState;
createState=function(name,startRegion='veyric'){return gc240InitState(_createStateGC240(name,startRegion))};

function gc240CampaignState(regionId){const r=state.regions[regionId];gc240InitRegion(r);const cs=r.gc240Campaigns,c=cs.active;if(c){const field=c.inFieldPartyId?state.parties.find(p=>p.id===c.inFieldPartyId&&p.expedition?.contract?.gc240CampaignId===c.id):null;if(c.inFieldPartyId&&!field)c.inFieldPartyId=null;if(!c.currentContract&&!c.rewardReleased&&!c.inFieldPartyId&&c.stages.length)c.currentContract=gc240MaterializeStage(c,c.currentStage)}return cs}
function gc240CareerRisk(regionId){const people=localRoster(regionId).filter(a=>a.status!=='Dead');if(!people.length)return 1;const avg=people.reduce((n,a)=>n+(Number(a.lvl)||1),0)/people.length;return avg>=17?5:avg>=12?4:avg>=8?3:avg>=4?2:1}
function gc240ThemeWeight(key,regionId){const r=state.regions[regionId],d=GC240_THEME_DEFS[key];if(d.focus==='threat')return 18+r.threat*1.05;if(d.focus==='stability')return 18+(100-r.stability)*1.05;if(d.focus==='prosperity')return 18+(100-r.prosperity)*1.05;const healthy=(100-r.threat+r.stability+r.prosperity)/3;return 28+healthy*.65}
function gc240WeightedTheme(rng,regionId,exclude){const keys=Object.keys(GC240_THEME_DEFS).filter(k=>!exclude.includes(k)),weighted=keys.map(k=>[k,gc240ThemeWeight(k,regionId)*(0.78+rng()*.44)]);let n=rng()*weighted.reduce((s,x)=>s+x[1],0);for(const[k,w]of weighted){n-=w;if(n<=0)return k}return weighted[0]?.[0]||'raiders'}
function gc240Species(regionId,themeKey,rng){const d=REGION_DEFS[regionId],pool=[d.common,...(d.enemies||[])].filter(Boolean);if(themeKey==='cult'){const occult=pool.filter(x=>ENEMY_SPECIES[x]?.supernatural||ENEMY_SPECIES[x]?.horror);if(occult.length)return gc240Pick(rng,occult)}return gc240Pick(rng,pool.length?pool:[d.common])}
function gc240MakeOffer(regionId,index){
 const cs=gc240CampaignState(regionId),seed=gc240Hash(`${state.company.name}|${regionId}|${cs.generation}|${state.company.day}|${index}`),rng=gc240Rng(seed),prior=cs.offers.slice(0,index).map(x=>x.theme),themeKey=gc240WeightedTheme(rng,regionId,prior),theme=GC240_THEME_DEFS[themeKey],place=gc240Pick(rng,GC240_PLACES[regionId]||['the frontier']),length=gc240Int(rng,3,5),career=gc240CareerRisk(regionId),baseRisk=clamp(career+index,1,5),species=gc240Species(regionId,themeKey,rng),name=gc240Pick(rng,theme.names),firstPool=(typeof NEMESIS_FIRST!=='undefined'&&NEMESIS_FIRST.length?NEMESIS_FIRST:['Mara','Vorn','Kesh','Drenn']),titlePool=(typeof NEMESIS_TITLES!=='undefined'&&NEMESIS_TITLES.length?NEMESIS_TITLES:['the Ashen','the Red','the Hollow','the Cruel']),antagonist=`${gc240Pick(rng,firstPool)} ${gc240Pick(rng,titlePool)}`;
 const source=theme.stages,chosen=length===5?source:[...source.slice(0,length-1),source[source.length-1]],stages=chosen.map((s,i)=>{const rise=Math.floor((i/Math.max(1,length-1))*1.8),risk=clamp(baseRisk+rise,1,5),band=[[2,4],[3,5],[5,8],[7,11],[10,16]][risk-1];return{index:i,label:s.label,title:`${s.label} — ${place}`,type:s.type,check:s.check,risk,enemyCount:gc240Int(rng,band[0],band[1]),species,duration:null,attempts:0}}),bonusRate=.20+length*.05;
 return{id:`offer-${regionId}-${cs.generation}-${index}`,seed,theme:themeKey,focus:theme.focus,title:`${name}: ${place}`,summary:theme.summary,place,antagonist,species,length,baseRisk,finalRisk:stages[stages.length-1].risk,bonusRate,stages};
}
function gc240EnsureOffers(regionId){const r=state.regions[regionId];if(!r?.hq?.established)return[];const cs=gc240CampaignState(regionId);if(cs.active)return[];if(cs.offers.length!==GC240_OFFER_COUNT){cs.offers=[];for(let i=0;i<GC240_OFFER_COUNT;i++)cs.offers.push(gc240MakeOffer(regionId,i))}return cs.offers}
function gc240CampaignFromOffer(regionId,offer){return{id:uid('campaign'),regionId,title:offer.title,summary:offer.summary,focus:offer.focus,theme:offer.theme,place:offer.place,antagonist:offer.antagonist,species:offer.species,bonusRate:offer.bonusRate,stages:gc240Clone(offer.stages),currentStage:0,failures:0,antagonistPower:0,startedDay:state.company.day,status:'active',participants:[],deaths:[],results:[],inFieldPartyId:null,rewardReleased:false,escrow:{silver:0,renown:0,items:[],caches:[],artifacts:[],region:{threat:0,stability:0,prosperity:0}},currentContract:null}}
function gc240MaterializeStage(campaign,index){
 const s=campaign?.stages?.[index];if(!s)return null;const attempts=Number(s.attempts)||0,risk=clamp(Number(s.risk)+Math.floor(attempts/2),1,5),enemyCount=clamp(Number(s.enemyCount||2)+Math.min(4,attempts),2,20),final=index===campaign.stages.length-1;
 const c={id:`${campaign.id}-op-${index}-a${attempts}`,regionId:campaign.regionId,type:s.type,check:s.check,title:s.title,desc:`Campaign operation ${index+1}/${campaign.stages.length}. ${campaign.summary}${attempts?` Opposition is better prepared after ${attempts} failed attempt${attempts===1?'':'s'}.`:''}`,species:s.species||campaign.species,risk,enemyCount,reward:0,unknown:Math.max(0,Math.ceil(risk/2)),expires:999999,nemesisId:null,cacheChance:clamp(.35+risk*.08,0,.8),gc240CampaignId:campaign.id,gc240Stage:index,gc240Attempt:attempts,gc240CampaignTitle:campaign.title,gc240CampaignBoss:final,gc240BossName:final?campaign.antagonist:null,gc240BossPower:final?campaign.antagonistPower:0};
 gc193EnsureContract(c);c.reward=gc194ContractPay(c);c.gc194Economy=GC194_VERSION;c.gc230RiskIndependent=true;c.gc200ScoutProgress=Number(c.gc200ScoutProgress)||0;return c;
}
function gc240StartCampaign(regionId,offerId){const r=state.regions[regionId],cs=gc240CampaignState(regionId);if(!r?.hq?.established)return toast('Establish an HQ here first.');if(cs.active)return toast('This region already has an active campaign.');const offer=gc240EnsureOffers(regionId).find(x=>x.id===offerId);if(!offer)return toast('That campaign plan is no longer available.');const c=gc240CampaignFromOffer(regionId,offer);c.currentContract=gc240MaterializeStage(c,0);cs.active=c;cs.offers=[];pushHistory(`CAMPAIGN BEGUN — ${c.title}.`,regionId);gc199RecordFeed(`CAMPAIGN — ${c.title} begun in ${REGION_DEFS[regionId].name}.`,'campaign');sfx('success');save();render();toast(`Campaign begun: ${c.title}`)}
function gc240ActiveContract(regionId){return gc240CampaignState(regionId)?.active?.currentContract||null}
