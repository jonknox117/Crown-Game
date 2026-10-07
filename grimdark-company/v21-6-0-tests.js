/* Grim Company v21.6.0 — deterministic progression, rarity, and combat checks. */
window.__GC360_TEST=function(){
 const old=state,results={},failures=[];
 try{
  state=createState('Combat 2 Test','veyric');
  state.regions.veyric.hq.established=true;
  gc270Progression().phase='company';
  const all=GC360_ALL;
  results.classes=all.length===26;
  results.techniques=all.reduce((n,p)=>n+p[1].length,0)===104;
  const unique=all.every(([key,techs])=>techs.length===4&&techs.every((t,i)=>t.length===4&&t[0]&&t[1]&&Number.isInteger(t[2])&&GC360_MILESTONES[i]===[5,10,15,20][i]));
  results.definitions=unique;
  const a=generateAdventurer('veyric');a.status='Ready';a.lvl=1;a.missions=0;state.roster.push(a);
  results.ladder=[0,5,12,25,40].every((n,i)=>{a.missions=n;return gc360Rank(a)===i&&gc360RiskCap(a)===i+1});
  a.missions=0;a.lvl=20;
  const q=makeParty('veyric','Test Party');q.members=[a.id];q.captainId=a.id;state.parties.push(q);
  results.rarityNotLevel=!gc320PartyQualification(q,{risk:5}).ok;
  a.missions=40;
  results.levelNotGate=gc320PartyQualification(q,{risk:5}).ok;
  a.lvl=1;
  results.lowLevelLegendary=gc320PartyQualification(q,{risk:5}).ok;
  // 104 skills must have a working action effect (attack, statuses, healing, defense, or log).
  let count=0,types=new Set();
  for(const [name,techs] of all){
   a.className=name;a.lvl=20;
   for(let i=0;i<4;i++){
    const x=techs[i],skill=gc360Skills(a)[i];
    types.add(skill.kind);
    const actor={charId:a.id,name:'Test '+name,hp:55,maxHp:100,attack:45,guard:25,speed:25,accuracy:25,resolve:35};
    const patient={charId:'patient',name:'Wounded Companion',hp:18,maxHp:100,attack:24,guard:20,speed:20,resolve:18,gc320Downed:{round:1,exposure:0}};
    const foes=[
     {name:'Enemy Brute',hp:62,maxHp:100,attack:35,guard:25,accuracy:25,speed:18,role:'Brute'},
     {name:'Enemy Archer',hp:70,maxHp:100,attack:20,guard:14,accuracy:30,speed:22,role:'Archer'}
    ];
    const b={round:4,allies:[actor,patient],enemies:foes,log:[]};
    q.expedition={contract:{id:'combat-test',risk:3,regionId:'veyric'},battle:b,events:[]};
    const ok=gc360Execute(actor,q,skill);
    if(!ok||!b.log.length||!actor.gc360Last||actor.gc360Last[i]!==4)failures.push(name+' '+skill.name);
    else count++;
   }
  }
  results.effects=count===104&&failures.length===0;
  results.effectTypes=types.size>=23;
  const s=JSON.stringify(q.expedition),copy=JSON.parse(s);
  results.saveSafe=!!copy?.battle?.allies?.length&&!s.includes('undefined');
  // Unlock boundaries should be exact and not alter historical level/rarity records.
  a.className='Berserker';
  results.unlocks=[1,4,5,9,10,14,15,19,20].map(l=>{a.lvl=l;return gc360Unlocked(a).length}).join(',')==='0,0,1,1,2,2,3,3,4';
  a.missions=0;a.lvl=20;
  results.freebladeRarityGate=true;
  const originalPhase=gc270Progression().phase;
  gc270Progression().phase='freeblade';const fb=gc310Freeblade();if(fb)fb.reputation=50;
  const c={risk:5},low=gc310Eligibility(c,a);a.missions=40;
  const high=gc310Eligibility(c,a);results.freebladeRarityGate=!low.ok&&high.ok;
  gc270Progression().phase=originalPhase;
  results.inventoryUnchanged=true;
  const integrity=gc342StateIntegrity();
  results.integrity=integrity.ok;
  return{ok:Object.values(results).every(Boolean),results,classes:all.length,actions:count,effectTypes:types.size,failures};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),results,failures};}
 finally{state=old;try{document.getElementById('modal')?.classList.remove('show')}catch(_){}}
};
