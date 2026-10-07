/* Grim Company v21.6.0 — class talent catalog: 26 classes × four milestones. */
const GC360_UNLOCKS=[5,10,15,20];
const GC360_ABILITIES={};
const GC360_SKILL_ROWS=[
['Knight-Errant',['Shield Challenge>taunt>3','Interposing Lance>stagger>3','Oathbound Circle>teamGuard>5','Final Vow>deathSave>8']],
['Man-at-Arms',['Spear Thrust>pierce>3','Shield Drill>brace>3','Disarming Counter>disarm>4','Veteran Formation>teamGuard>5']],
['Crossbowman',['Pinning Bolt>pin>3','Armor Splitter>shred>3','Kill Lane>volley>4','Execution Shot>execute>5']],
['Houndmaster',['Harrier Bite>hound>3','Scent Mark>mark>3','Pack Interception>petGuard>4','Unleash the Kennels>packStorm>5']],
['March Ranger',['Snare Shot>pin>3','Ghost Trail>reposition>3','Weak Spot Mark>mark>4','Hunter’s Volley>volley>5']],
['Battle Chaplain',['Mend Wounds>heal>3','Consecration>consecrate>4','Rally the Fallen>revive>5','Martyr’s Covenant>martyr>6']],
['Shieldthane',['Shield Bash>stagger>3','Hold the Line>teamGuard>4','Retribution>riposte>4','Last Bulwark>deathSave>8']],
['Berserker',['Cleave>cleave>3','Reckless Charge>charge>4','Rampage>rampage>4','Unbound Fury>frenzy>6']],
['Raider',['Hook and Drag>pull>3','Boarding Rush>charge>3','Plunder Momentum>rampage>4','Crimson Raid>frenzy>6']],
['Skald',['Battle Verse>inspire>3','Name the Fallen>revive>5','Saga of Courage>rally>4','Final Refrain>teamGuard>5']],
['Rune-Seer',['Rune Ward>ward>3','Bind the Shade>silence>4','Unravel Curse>cleanse>4','Runic Collapse>arcaneBlast>5']],
['Samurai',['Iaijutsu>execute>3','Deflecting Steel>parry>3','Duel Challenge>duel>4','Perfect Cut>ignoreArmor>5']],
['Yumi Archer',['Pinning Arrow>pin>3','Rain of Arrows>volley>4','Falcon Sight>mark>3','Heavenfall Volley>multiVolley>6']],
['Shinobi',['Smoke Step>reposition>3','Hidden Blade>bleed>3','Shadow Bind>silence>4','Silent Execution>execute>5']],
['Ashigaru',['Spear Brace>brace>3','Disciplined Ranks>teamGuard>4','Driving Thrust>pull>4','Storm of Spears>multiVolley>6']],
['Spirit Scribe',['Binding Script>silence>3','True Name>mark>4','Ink Ward>ward>4','Seal the Unquiet>arcaneBlast>5']],
['Spearwall',['Impaling Stand>riposte>3','Close Ranks>teamGuard>4','Hook and Pin>pin>4','Unbroken Phalanx>deathSave>8']],
['Horn Runner',['Long Flank>reposition>3','Encirclement>mark>4','Hamstring>bleed>3','Thunder Charge>charge>5']],
['Shield-Breaker',['Crack Armor>shred>3','Smash Guard>stagger>4','Break the Line>charge>4','Earthsplitter>arcaneBlast>6']],
['War-Singer',['Rally Cry>rally>3','Battle Rhythm>inspire>3','Defiant Chorus>teamGuard>5','Last Song>revive>6']],
['Bone-Seer',['Ancestor Ward>ward>3','Foretell Wound>mark>3','Bone Hex>curse>4','Voices of the Dead>arcaneBlast>5']],
['Lumen Guard',['Radiant Screen>ward>3','Blinding Flash>blind>3','Dawnbreak Guard>teamGuard>4','Solar Aegis>deathSave>8']],
['Star-Spear',['Comet Thrust>pierce>3','Falling Star>charge>4','Horror Bane>execute>4','Starfall>multiVolley>6']],
['Choir Adept',['Healing Note>heal>3','Harmonic Seal>silence>4','Restoring Chorus>multiHeal>5','Celestial Requiem>revive>6']],
['Veilwalker',['Slip Angle>reposition>3','Phase Strike>ignoreArmor>4','Unseen Passage>blind>4','Broken Path>teleport>5']],
['Pattern-Savant',['Fault Line>shred>3','Pattern Break>stagger>4','Unmake Shape>arcaneBlast>5','Reality Fracture>multiVolley>6']]
];
const GC360_EFFECT_HELP={
 taunt:'Draw enemy attacks toward yourself and brace to withstand them.',
 stagger:'Hit and interrupt an enemy’s next action.',
 teamGuard:'Raise a protective formation around living allies.',
 deathSave:'Prevent an imminent fatal blow on a vulnerable ally, once per battle.',
 pierce:'Attack through armor and weaken the target’s defenses.',
 brace:'Guard and counterattack the next enemy that strikes.',
 disarm:'Disrupt the target’s weapon and reduce its next attack.',
 pin:'Damage a target and prevent its next reposition or attack.',
 shred:'Crack armor, making the target vulnerable to subsequent blows.',
 volley:'Fire on multiple enemy combatants in one action.',
 execute:'Deliver a powerful finishing strike against a weakened target.',
 hound:'Send a companion to harry and stagger an enemy.',
 mark:'Expose a target so allies can exploit its weakness.',
 petGuard:'Set a companion to intercept the next attack against a wounded ally.',
 packStorm:'Send the hounds against several enemies, causing stagger and bleeding.',
 reposition:'Evade danger, gain initiative and expose a vulnerable enemy.',
 heal:'Spend an action to heal the most wounded standing ally.',
 consecrate:'Consecrate the battlefield; protect allies and harm supernatural enemies.',
 revive:'Stabilize a downed ally and reduce their mortal danger.',
 martyr:'Take the next hit meant for an ally; the rescuer can be injured.',
 riposte:'Prepare an immediate counterattack when attacked.',
 cleave:'Strike two adjacent enemies in one swinging attack.',
 charge:'Break past the enemy line to attack a vulnerable backliner.',
 rampage:'Strike a weakened enemy; a kill earns an immediate follow-up blow.',
 frenzy:'Unleash repeated strikes but become exposed afterwards.',
 pull:'Drag an enemy out of formation and expose them.',
 inspire:'Inspire your whole party, granting an extra response in combat.',
 rally:'Steady allies, clearing fear and bolstering resolve.',
 ward:'Raise a ward that absorbs incoming damage.',
 silence:'Interrupt an enemy’s next support or offensive action.',
 cleanse:'Remove bleeding, weakened, and exposed conditions from allies.',
 arcaneBlast:'Disrupt and damage several enemies at once.',
 parry:'Negate the next incoming blow and return a counterstrike.',
 duel:'Challenge an enemy leader, concentrating pressure on them.',
 ignoreArmor:'Drive a precise attack through the target’s Guard.',
 multiVolley:'Launch a devastating volley against multiple opponents.',
 bleed:'Cause a wound that continues damaging an enemy over several rounds.',
 blind:'Blind an enemy and disrupt its next attack.',
 curse:'Place a weakening curse that persists over multiple turns.',
 multiHeal:'Heal all standing party members instead of attacking.',
 teleport:'Slip past the front line and appear beside a vulnerable enemy.'
};
for(const row of GC360_SKILL_ROWS){
 GC360_ABILITIES[row[0]]=row[1].map((entry,i)=>{
  const [name,kind,cd]=entry.split('>');
  return{name,kind,level:GC360_UNLOCKS[i],cooldown:Number(cd),description:GC360_EFFECT_HELP[kind]};
 });
}
function gc360Talents(a){return GC360_ABILITIES[a?.className]||[]}
function gc360Unlocked(a){return gc360Talents(a).filter(x=>(a.lvl||1)>=x.level)}
function gc360Passive(a){return(typeof classRule7==='function'&&a)?classRule7(a).ability||'Class instinct.':'Class instinct.'}
