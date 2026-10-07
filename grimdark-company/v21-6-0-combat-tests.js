/* Grim Company v21.6.0 — full class-action and battle regression tests. */
window.__GC360_COMBAT_TEST=function(){
 const old=state;
 try{
  state=createState('Combat Skill Test','veyric');
  state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';
  const a=generateAdventurer('veyric'),mate=generateAdventurer('veyric');
  a.className='Shieldthane';a.lvl=20;a.missions=40;a.status='Expedition';
  mate.className='Battle Chaplain';mate.lvl=20;mate.missions=40;mate.status='Expedition';
  state.roster=[a,mate];
  const u={charId:a.id,name:a.name,className:a.className,race:a.race,culture:a.culture,hp:110,maxHp:110,attack:70,guard:45,speed:25,accuracy:50,resolve:42};
  const v={charId:mate.id,name:mate.name,className:mate.className,race:mate.race,culture:mate.culture,hp:16,maxHp:100,attack:45,guard:32,speed:20,accuracy:40,resolve:50};
  const enemies=[
    {id:'enemy1',name:'Bandit Captain',species:'Bandit',role:'Brute',hp:500,maxHp:500,attack:45,guard:30,speed:16,accuracy:26,resolve:25},
    {id:'enemy2',name:'Bandit Archer',species:'Bandit',role:'Archer',hp:500,maxHp:500,attack:30,guard:22,speed:20,accuracy:30,resolve:25},
    {id:'enemy3',name:'Bandit Guard',species:'Bandit',role:'Shield',hp:500,maxHp:500,attack:35,guard:45,speed:14,accuracy:23,resolve:24},
    {id:'enemy4',name:'Bandit Scout',species:'Bandit',role:'Stalker',hp:500,maxHp:500,attack:27,guard:20,speed:22,accuracy:24,resolve:20}
  ];
  const b={round:1,allies:[u,v],enemies,log:[],first:'party'};
  const p={id:'skill-test-party',members:[a.id,mate.id],captainId:a.id,tactic:'Balanced',regionId:'veyric',expedition:{battle:b,contract:{id:'skill-test',risk:1,unknown:0,regionId:'veyric',title:'Skill Test',species:'Bandit',check:'scout',enemyCount:4},events:[],checks:[],progress:75,step:4}};
  state.parties=[p];
  const failures=[];let executed=0;
  for(const [cls,talents] of Object.entries(GC360_ABILITIES)){
   a.className=cls;u.className=cls;
   for(const t of talents){
    u.gc360Cooldowns={};u.gc360GuardUntil=0;u.gc360RiposteUntil=0;u.gc360DodgeUntil=0;
    v.hp=16;v.gc320Downed=t.kind==='revive'?{round:1,exposure:4,base:.25,by:'test'}:null;
    enemies.forEach(x=>{x.hp=500;x.gc360StaggerUntil=0;x.gc360ArmorUntil=0;x.gc360ExposedUntil=0;x.gc360Bleeding=null});
    b.round++;
    try{
     const ctx=gc360Context(u,p);
     if(!ctx||!gc360UseTalent(t,ctx,p))failures.push(cls+' > '+t.name+' did not activate');
     else executed++;
    }catch(e){failures.push(cls+' > '+t.name+': '+String(e&&e.message||e))}
    delete v.gc320Downed;
   }
  }
  const rounds=b.round,turnCount=Object.keys(GC360_ABILITIES).length*4;
  /* Test real basic Guard when a low-health non-ability class has no skill. */
  a.className='Shieldthane';a.lvl=1;u.className='Shieldthane';u.hp=8;u.gc360GuardUntil=0;u.gc360BasicGuardRound=0;
  const guarded=supportAction(u,p)===true&&u.gc360GuardUntil>=b.round;
  const integrity=gc342StateIntegrity().ok;
  return{ok:executed===104&&!failures.length&&guarded&&integrity,executed,expected:turnCount,failures:failures.slice(0,18),guarded,integrity,rounds};
 }catch(e){return{ok:false,error:String(e&&e.stack||e)}}
 finally{state=old}
};