/* Broken Lantern v21.10.0 — combat identity & interactive UI regression. */
window.__GC410_TEST=function(){
 const old=state,r={},errors=[];
 try{
  const classes=Object.keys(GC360_ABILITIES),passiveClasses=Object.keys(GC410_PASSIVES);
  r.allClasses=classes.length===26&&passiveClasses.length===26&&classes.every(cls=>{
   const p=GC410_PASSIVES[cls],talents=GC360_ABILITIES[cls];
   return Array.isArray(p)&&p[0].length>6&&p[1].length>24&&talents.length===4&&talents[3].level===20&&
    talents[3].description.startsWith('ULTIMATE • Once per battle.');
  });
  r.distinctPassives=new Set(passiveClasses.map(x=>GC410_PASSIVES[x][0])).size===26;
  r.distinctUltimateEffects=new Set(Object.values(GC410_ULTIMATE_DETAILS)).size===26;
  state=createState('Combat Identity Regression','veyric');
  gc270Progression().phase='freeblade';
  const f=gc260CreateFounderRecord('veyric',{name:'Combat Player',race:'Human',culture:'Veyric',className:'Knight-Errant',gender:'Male',portrait:1},true);
  f.lvl=20;f.missions=40;f.status='Expedition';
  const p=gc260FounderParty();
  if(!p)throw Error('Founder party unavailable');
  const friend=generateAdventurer('veyric');friend.status='Expedition';friend.lvl=20;state.roster.push(friend);
  p.members=[f.id,friend.id];p.captainId=f.id;
  const u={charId:f.id,name:f.name,className:f.className,hp:120,maxHp:120,attack:77,guard:40,speed:38,accuracy:52,resolve:54},
        v={charId:friend.id,name:friend.name,className:friend.className,hp:18,maxHp:100,attack:40,guard:28,speed:20,accuracy:32,resolve:40};
  const enemies=[0,1,2,3].map(i=>({id:'gc410-enemy-'+i,name:'Bandit '+i,role:i===2?'Archer':'Brute',species:'Bandit',hp:1500,maxHp:1500,attack:39+i,guard:26,speed:16,accuracy:25,resolve:20,supernatural:i===3,horror:i===3}));
  const b={round:3,allies:[u,v],enemies,log:[],first:'party'};
  p.expedition={contract:{id:'gc410-job',title:'Combat QA Contract',species:'Bandit',regionId:'veyric',risk:1,enemyCount:4,check:'scout'},battle:b,progress:63,checks:[],events:[],fought:false};
  state.ui.tab='jobs';
  render();
  const panel=document.querySelector('.gc410Fight');
  r.combatUI=!!panel&&panel.querySelectorAll('.gc410Enemy').length===4&&panel.querySelector('.gc410Ultimate')?.textContent.includes('Final Vow');
  r.compactArt=document.body.classList.contains('gc410CombatActive');
  r.enemyButtons=Array.from(panel?.querySelectorAll('.gc410Enemy')||[]).every(x=>x.getBoundingClientRect().height>=44);
  r.passiveUI=gc360TalentHTML(f).includes('Chivalric Intervention')&&gc360TalentHTML(f).includes('LV 20 ★')&&gc360TalentHTML(f).includes('ULTIMATE');
  const before=enemies[0].hp;
  const tap=panel.querySelector('.gc410Enemy');
  if(tap)processAction(tap);
  const changed=before-enemies[0].hp;
  r.tapDamages=changed>=2&&changed<Math.max(10,u.attack*.5)&&b.gc410ManualHits===1&&b.gc410ManualDamage===changed;
  const after=enemies[0].hp;gc410HitTarget(p.id,enemies[0].id);
  r.cooldown=enemies[0].hp===after&&b.gc410ManualHits===1;
  b.gc410NextManualAt=Date.now()-1;gc410PatchCombatFocus();
  const cooled=document.querySelector('.gc410Enemy:not(:disabled)');
  r.reenabled=!!cooled;
  if(cooled)gc410HitTarget(p.id,enemies[0].id);
  r.secondTap=b.gc410ManualHits===2;
  f.hp=0;u.gc320Downed={round:3,exposure:0,base:.1};b.gc410NextManualAt=0;
  r.downedBlocksTap=gc410HitTarget(p.id,enemies[1].id)===false;
  f.hp=120;delete u.gc320Downed;
  /* NPC parties never have an extra input ability. */
  const npc=makeParty('veyric','NPC Combat');
  const stranger=generateAdventurer('veyric');stranger.status='Expedition';state.roster.push(stranger);
  npc.members=[stranger.id];npc.expedition={battle:{round:1,allies:[{charId:stranger.id,hp:40,maxHp:40}],enemies:[{id:'npc-foe',hp:80,maxHp:80}],log:[]},contract:{id:'npc',title:'NPC',regionId:'veyric'}};
  state.parties.push(npc);
  r.npcCannotTap=gc410HitTarget(npc.id,'npc-foe')===false;
  state.parties=state.parties.filter(x=>x!==npc);
  /* All Level-20 actives must not be generic and must spend a single charge. */
  let ultimates=0;
  for(const cls of classes){
   f.className=cls;u.className=cls;u.gc410UltimateSpent=null;u.gc360Cooldowns={};
   u.hp=u.maxHp=120;v.hp=18;v.gc320Downed=null;
   b.round=4;b.log=[];
   enemies.forEach(x=>{x.hp=x.maxHp=1500;delete x.gc360StaggerUntil;delete x.gc360Bleeding;delete x.gc360ExposedUntil;delete x.gc360BlindUntil;delete x.gc410Scribed});
   const t=GC360_ABILITIES[cls][3];if(t.kind==='revive')v.gc320Downed={round:1,exposure:1,base:.12};
   try{
    const ctx=gc360Context(u,p),result=gc360UseTalent(t,ctx,p);
    if(!result||u.gc410UltimateSpent!==cls||!b.log.some(x=>x.includes('ULTIMATE — ')&&x.includes(t.name))){
     errors.push(cls+': ultimate failed '+String(result));
    }else ultimates++;
    if(gc360UseTalent(t,ctx,p)!==false)errors.push(cls+': ultimate used twice');
   }catch(e){errors.push(cls+': '+String(e&&e.stack||e).slice(0,200))}
  }
  r.ultimates=ultimates===26&&!errors.length;
  /* Combat start hooks must perform observable first-round effects. */
  b.log=[];f.className=u.className='Crossbowman';
  enemies.forEach(x=>{x.hp=x.maxHp=1500});
  gc410BattleStart(p);
  r.initialPassive=b.log.some(x=>x.includes('loaded opening bolt'))&&b.enemies.some(x=>x.gc360StaggerUntil>=1);
  f.className=u.className='Battle Chaplain';u.gc410Passive={};v.gc320Downed=null;
  const tooDangerous={...enemies[0],attack:10000,accuracy:10000,gc360StaggerUntil:0,gc360BlindUntil:0,gc360CurseUntil:0};
  const oldMath=Math.random;Math.random=()=>0;
  try{
   v.hp=1;enemyAttack(tooDangerous,v,p);
  }finally{Math.random=oldMath}
  r.chaplainIntervention=!!u.gc410Passive?.mercy&&v.hp>0&&!v.gc320Downed;
  /* UI must expose fast expedition actions without scrolling to an old card. */
  p.expedition.battle=null;f.status='Expedition';render();
  const quick=document.querySelector('.gc410FieldBar');
  r.travelQuick=!!quick&&!!quick.querySelector('[data-action="gc410GoJobs"]')&&!!quick.querySelector('[data-action="gc410QuickPush"]');
  const copy=normalizeState(JSON.parse(JSON.stringify(state)));
  r.saveSafe=copy?.parties?.some(x=>x.id===p.id)&&gc342StateIntegrity().ok;
  const failed=Object.entries(r).filter(([k,v])=>!v).map(([k])=>k);
  return{ok:failed.length===0,failed,...r,ultimates,errors:errors.slice(0,8),manualDamage:changed};
 }catch(e){return{ok:false,error:String(e&&e.stack||e),tests:r,errors:errors.slice(0,10)}}
 finally{state=old;try{render()}catch(_){}}
};