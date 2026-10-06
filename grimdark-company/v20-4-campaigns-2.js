
/* Campaign operations are not normal board entries, but every existing party,
   contract-info, dispatch and expedition system can still resolve them by ID. */
const _contractByIdGC240=contractById;
contractById=function(id){const normal=_contractByIdGC240(id);if(normal)return normal;for(const rid of REGION_ORDER){const c=gc240ActiveContract(rid);if(c?.id===id)return c}return null};
const _dispatchContractGC240=dispatchContract;
dispatchContract=function(cid,pid){const c=contractById(cid),campaign=c?.gc240CampaignId?gc240CampaignState(c.regionId).active:null;if(campaign){if(campaign.inFieldPartyId)return toast('That campaign operation already has a party in the field.');campaign.inFieldPartyId=pid}const out=_dispatchContractGC240(cid,pid),p=state.parties.find(x=>x.id===pid);if(campaign&&!p?.expedition){campaign.inFieldPartyId=null;save()}else if(campaign&&p?.expedition){p.expedition.gc240CampaignId=campaign.id;p.expedition.gc240Stage=campaign.currentStage;save();render()}return out};

/* Scouts automatically prioritize the active campaign operation because it is the
   company's declared regional objective; otherwise they fall back to board work. */
gc200SharedScoutTarget=function(regionId){
 const r=state.regions[regionId];if(!r)return null;const unfinished=c=>c&&((Number(c.gcIntel)||0)<2||(Number(c.unknown)||0)>0),active=gc240CampaignState(regionId).active,campaign=active&&!active.inFieldPartyId?active.currentContract:null,pool=[...(campaign?[campaign]:[]),...(r.contracts||[])];
 let c=pool.find(x=>x.id===r.gc200ScoutTarget&&unfinished(x));if(!c){c=(campaign&&unfinished(campaign)?campaign:pool.map(gc193EnsureContract).filter(unfinished).sort((x,y)=>(y.unknown||0)-(x.unknown||0)||(x.gcIntel||0)-(y.gcIntel||0)||(y.risk||0)-(x.risk||0))[0])||null;r.gc200ScoutTarget=c?.id||null}if(c&&!Number.isFinite(Number(c.gc200ScoutProgress)))c.gc200ScoutProgress=0;return c;
};

/* Final campaign targets are named without leaking them into the ordinary nemesis
   pool, so they cannot accidentally appear on unrelated contracts. */
const _makeEnemyGC240=makeEnemy;
makeEnemy=function(c,index){const x=_makeEnemyGC240(c,index);if(c?.gc240CampaignBoss&&index===0){const power=Math.max(0,Number(c.gc240BossPower)||0),m=1.28+Math.min(.32,power*.06);x.name=c.gc240BossName||x.name;x.role='Campaign Nemesis';x.level=clamp(Math.max(x.level||1,gc194RiskLevel(c.risk)+power),1,GC194_MAX_LEVEL);x.maxHp=Math.round(x.maxHp*m);x.hp=x.maxHp;x.attack=Math.round(x.attack*(1.12+power*.035));x.guard=Math.round(x.guard*(1.10+power*.03));x.resolve=Math.round(x.resolve*(1.15+power*.04));x.gc240CampaignBoss=true}return x};

/* Intercept the report while the proven normal finish pipeline does all character,
   relationship, XP and party bookkeeping. Then escrow company rewards and replace
   the ordinary regional win swing with a campaign-level payout on completion. */
