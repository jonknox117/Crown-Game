(function(){
  'use strict';

  if(!state.settings) state.settings={};
  if(typeof state.settings.sound!=='boolean') state.settings.sound=true;

  let audioCtx=null;

  function getAudio(){
    if(!state.settings.sound) return null;
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC) return null;
    if(!audioCtx) audioCtx=new AC();
    if(audioCtx.state==='suspended') audioCtx.resume().catch(()=>{});
    return audioCtx;
  }

  function tone(freq,dur=.07,type='sine',gain=.035,delay=0,slide=0){
    const c=getAudio(); if(!c) return;
    const t=c.currentTime+delay;
    const o=c.createOscillator(), g=c.createGain();
    o.type=type;
    o.frequency.setValueAtTime(freq,t);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),t+dur);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t+dur+.02);
  }

  function noise(dur=.06,gain=.025,delay=0){
    const c=getAudio(); if(!c) return;
    const len=Math.max(1,Math.floor(c.sampleRate*dur));
    const buf=c.createBuffer(1,len,c.sampleRate), data=buf.getChannelData(0);
    for(let i=0;i<len;i++) data[i]=(Math.random()*2-1)*(1-i/len);
    const src=c.createBufferSource(), g=c.createGain();
    src.buffer=buf; g.gain.value=gain;
    src.connect(g); g.connect(c.destination);
    src.start(c.currentTime+delay);
  }

  function sfx(name){
    if(!state.settings.sound) return;
    switch(name){
      case 'tap': tone(150,.045,'triangle',.018,0,-25); break;
      case 'nav': tone(230,.05,'sine',.02); tone(310,.05,'sine',.014,.035); break;
      case 'hire': tone(420,.06,'triangle',.025); tone(650,.08,'triangle',.022,.05); break;
      case 'coin': tone(740,.045,'sine',.025); tone(980,.07,'sine',.018,.045); break;
      case 'depart': tone(180,.08,'sawtooth',.018,0,70); tone(120,.12,'triangle',.015,.07,-20); break;
      case 'hit': noise(.055,.022); tone(85,.07,'square',.016,0,-20); break;
      case 'danger': tone(130,.12,'sawtooth',.018); tone(110,.16,'sawtooth',.015,.12); break;
      case 'cache': noise(.09,.03); tone(105,.09,'triangle',.022,0,-30); break;
      case 'loot': tone(440,.06,'sine',.022); tone(660,.07,'sine',.022,.06); tone(880,.10,'sine',.018,.13); break;
      case 'success': tone(330,.08,'triangle',.025); tone(495,.10,'triangle',.022,.07); tone(660,.14,'triangle',.02,.14); break;
      case 'fail': tone(190,.12,'sawtooth',.02,0,-45); tone(120,.2,'triangle',.018,.12,-25); break;
      case 'blocked': tone(95,.06,'square',.012); break;
    }
  }
  window.blSound=sfx;

  function go(tab){
    state.tab=tab;
    sfx('nav');
    render();
  }

  function nextAction(){
    if(employedCount()===0) return {icon:'👥',label:'NEXT: Hire your first adventurer',sub:'The tavern has desperate people.',tab:'roster'};
    const staffed=state.parties.some(p=>p.members.length>0);
    if(!staffed) return {icon:'⚔️',label:'NEXT: Staff the Ash Dogs',sub:'Assign at least one ready adventurer.',tab:'roster'};
    const active=state.parties.filter(p=>p.expedition).length;
    if(active) return {icon:'🔥',label:`${active} expedition${active>1?'s':''} in the field`,sub:'Tap to monitor the bloodshed.',tab:'contracts'};
    const low=state.contracts.length?Math.min(...state.contracts.map(c=>c.risk)):0;
    return {icon:'📜',label:`${state.contracts.length} contracts waiting`,sub:low?`Lowest estimated risk: ${low}/4.`:'The desk is empty.',tab:'contracts'};
  }

  function enhance(){
    const topbar=document.querySelector('.topbar');
    if(topbar){
      const brand=topbar.querySelector('.brand');
      if(brand&&!brand.querySelector('.utilityButtons')){
        const box=document.createElement('div');
        box.className='utilityButtons';
        box.innerHTML=`<div class="dayMini">DAY ${state.day}</div><button class="soundToggle" aria-label="Toggle sound" title="Sound">${state.settings.sound?'🔊':'🔇'}</button>`;
        const oldDay=brand.querySelector('.day');
        if(oldDay) oldDay.remove();
        brand.appendChild(box);
        box.querySelector('.soundToggle').onclick=(e)=>{
          e.stopPropagation();
          state.settings.sound=!state.settings.sound;
          save();
          if(state.settings.sound) sfx('success');
          render();
        };
      }
      if(!document.querySelector('.quickAction')){
        const n=nextAction(), q=document.createElement('button');
        q.className='quickAction';
        q.innerHTML=`<span class="qaIcon">${n.icon}</span><span><b>${n.label}</b><small>${n.sub}</small></span><span class="qaArrow">›</span>`;
        q.onclick=()=>go(n.tab);
        topbar.insertAdjacentElement('afterend',q);
      }
    }

    const contractBtn=document.querySelector('.navbtn[data-tab="contracts"]');
    const vaultBtn=document.querySelector('.navbtn[data-tab="vault"]');
    if(contractBtn){
      const active=state.parties.filter(p=>p.expedition).length;
      if(active) contractBtn.insertAdjacentHTML('beforeend',`<span class="navBadge">${active}</span>`);
    }
    if(vaultBtn&&state.caches.length) vaultBtn.insertAdjacentHTML('beforeend',`<span class="navBadge goldBadge">${state.caches.length}</span>`);

    const minRisk=state.contracts.length?Math.min(...state.contracts.map(c=>c.risk)):99;
    document.querySelectorAll('.contract').forEach((el,i)=>{
      const c=state.contracts[i];
      if(c&&c.risk===minRisk&&c.risk<=2){
        el.classList.add('recommended');
        if(!el.querySelector('.contractBadge')) el.insertAdjacentHTML('afterbegin','<span class="contractBadge">BEST LEAD</span>');
      }
    });

    document.querySelectorAll('.member').forEach((el,i)=>{
      const r=state.roster[i]; if(!r) return;
      el.classList.add('status-'+r.status.toLowerCase().replace(/\s+/g,'-'));
      const info=el.querySelector('.small.muted');
      if(info&&!el.querySelector('.statusChip')){
        const cls=r.status==='Ready'?'ready':r.status==='Dead'?'dead':'hurt';
        info.insertAdjacentHTML('beforeend',` <span class="statusChip ${cls}">${r.status}</span>`);
      }
    });

    const rosterPill=[...document.querySelectorAll('.pill')].find(x=>x.textContent.includes('ROSTER'));
    const activePill=[...document.querySelectorAll('.pill')].find(x=>x.textContent.includes('ACTIVE'));
    if(rosterPill){rosterPill.classList.add('clickPill');rosterPill.onclick=()=>go('roster')}
    if(activePill){activePill.classList.add('clickPill');activePill.onclick=()=>go('contracts')}

    requestAnimationFrame(()=>document.querySelector('.screen')?.classList.add('screenReady'));
  }

  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button');
    if(!b||b.classList.contains('soundToggle')) return;
    sfx(b.disabled?'blocked':'tap');
  },{passive:true});

  const oldRender=render;
  render=function(){
    oldRender();
    enhance();
  };
  window.render=render;

  const oldHire=hire;
  hire=function(id){
    const before=state.roster.length;
    oldHire(id);
    if(state.roster.length>before) sfx('hire');
  };

  const oldDispatch=dispatch;
  dispatch=function(cid,pid){
    const before=state.parties.filter(p=>p.expedition).length;
    oldDispatch(cid,pid);
    if(state.parties.filter(p=>p.expedition).length>before) sfx('depart');
  };

  const oldUpgrade=upgrade;
  upgrade=function(k){
    const before=state.hq[k]||0;
    oldUpgrade(k);
    if((state.hq[k]||0)>before) sfx('coin');
  };

  const oldStartCombat=startCombat;
  startCombat=function(p){
    oldStartCombat(p);
    sfx('danger');
  };

  const oldCombatRound=combatRound;
  combatRound=function(p){
    const b=p?.expedition?.battle, before=b?b.enemyHp:null;
    oldCombatRound(p);
    if(before!==null) sfx('hit');
  };

  const oldOpenCache=openCache;
  openCache=function(i){
    oldOpenCache(i);
    sfx('cache');
    setTimeout(()=>sfx('loot'),270);
  };

  const oldShowReport=showReport;
  showReport=function(){
    const success=state.lastReport?.success;
    oldShowReport();
    sfx(success?'success':'fail');
  };

  enhance();
})();
