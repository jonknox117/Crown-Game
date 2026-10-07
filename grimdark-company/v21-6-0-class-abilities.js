/* Grim Company v21.6.0 — class techniques, levels 5/10/15/20.
   name|effect|cooldown|description: each tuple describes a distinct battle action.
   All actions consume one combat turn. Existing class passives remain active. */
const GC360_VERSION='21.6.0';
const GC360_MILESTONES=[5,10,15,20];
const GC360_TECHNIQUES={
'Knight-Errant':[
 ['Oathbreaker Challenge','taunt',3,'Draw a dangerous foe away from wounded comrades.'],
 ['Lance of Judgment','pierce',3,'Drive through armor and leave the target exposed.'],
 ['Unyielding Oath','counter',4,'Shield a comrade and punish the next attacker.'],
 ['The Last Knight','stand',1,'Once per battle, shield every ally from a deadly assault.']],
'Man-at-Arms':[
 ['Shieldhook','stagger',3,'Hook and disrupt an enemy strike.'],
 ['Press the Line','cleave',3,'Attack two nearby opponents and force them back.'],
 ['Veteran Formation','formation',4,'Give the whole front line lasting protection.'],
 ['Iron Discipline','command',4,'Issue a coordinated attack against a marked foe.']],
'Crossbowman':[
 ['Bodkin Bolt','pierce',3,'Ignore heavy armor and expose a weak point.'],
 ['Pinning Shot','pin',3,'Stop a mobile foe before its next action.'],
 ['Overwatch','countershot',4,'Cover vulnerable allies with a reactive shot.'],
 ['Execution Lane','execute',5,'Finish an exposed or gravely wounded enemy.']],
'Houndmaster':[
 ['Release the Hounds','hound',3,'Send a war hound to tear into an enemy.'],
 ['Hamstring','bleed',3,'Slow an enemy with a lasting wound.'],
 ['Pack Surround','surround',4,'Trap two opponents and strip their protection.'],
 ['Call Them Home','rescue',5,'Retrieve a downed ally behind the hounds.']],
'March Ranger':[
 ['Snare Trap','pin',3,'Snare a charging foe before it reaches the line.'],
 ['Hunter’s Mark','mark',3,'Identify prey for the party to focus.'],
 ['Ghost Trail','smoke',4,'Reposition and protect the weakest backliner.'],
 ['Death From Cover','snipe',5,'Strike a marked enemy through its defenses.']],
'Battle Chaplain':[
 ['Mend Wounds','heal',3,'Give up an attack to heal the most wounded ally.'],
 ['Consecrate Ground','wardall',4,'Protect the line, especially against unholy attacks.'],
 ['Rally the Fallen','revive',5,'Bring a fallen ally back into the fight once.'],
 ['Martyr’s Covenant','sacrifice',5,'Take a comrade’s danger onto yourself.']],
'Shieldthane':[
 ['Shield Bash','stagger',3,'Interrupt a foe with a brutal shield blow.'],
 ['Hold the Line','formation',4,'Prevent the backline from being overrun.'],
 ['Retribution','counter',4,'Guard an ally and counter its next assailant.'],
 ['Last Bulwark','stand',1,'Once per battle, absorb a fatal blow meant for the party.']],
'Berserker':[
 ['Cleave','cleave',3,'Slash two opponents in a single swing.'],
 ['Reckless Charge','charge',3,'Break the line, but leave yourself exposed.'],
 ['Rampage','rampage',4,'Finish a wounded foe, then attack another.'],
 ['Unbound Fury','frenzy',5,'Unleash savage strikes at the cost of exhaustion.']],
'Raider':[
 ['Boarding Rush','charge',3,'Crash into the backline at great personal risk.'],
 ['Hook and Drag','pull',3,'Drag a vulnerable foe into reach.'],
 ['Spoils of Battle','siphon',4,'Steal momentum and recover vigor while attacking.'],
 ['Red Tide','multi',5,'Strike the entire enemy line while exposed.']],
'Skald':[
 ['War Cry','rally',3,'Drive fear from comrades and renew their strength.'],
 ['Saga of the Fallen','vengeance',4,'Punish foes for hurting or downing allies.'],
 ['Shield-Song','wardall',4,'Sustain the line with a protective battle chant.'],
 ['Name of Legends','command',5,'Call for a devastating coordinated attack.']],
'Rune-Seer':[
 ['Gravebind Rune','bind',3,'Seal the actions of an unholy target.'],
 ['Stoneward','ward',3,'Mark an ally with a protective ward.'],
 ['Sunder Curse','purge',4,'Strip enemy power and hostile effects.'],
 ['Doom Inscription','doom',5,'Write a delayed sentence against a mighty foe.']],
'Samurai':[
 ['Iaijutsu','snipe',3,'Deliver a swift blade strike before the foe reacts.'],
 ['Riposte Stance','counter',3,'Invite an attack and answer it immediately.'],
 ['Severing Cut','pierce',4,'Cut through defenses and cripple the target.'],
 ['One Perfect Stroke','execute',5,'Commit to a decisive finishing attack.']],
'Yumi Archer':[
 ['Piercing Arrow','pierce',3,'Bypass the line and puncture armor.'],
 ['Suppressing Volley','pin',3,'Disrupt an enemy advance with a hail of arrows.'],
 ['Hawk Eye','mark',4,'Mark the most dangerous enemy for execution.'],
 ['Rain of Arrows','multi',5,'Strike all visible opponents at once.']],
'Shinobi':[
 ['Hidden Blade','bleed',3,'Draw blood from a poorly guarded foe.'],
 ['Smoke Step','smoke',3,'Vanish from enemy attention and shift position.'],
 ['Shadow Bind','bind',4,'Stop the target from acting or escaping.'],
 ['Silent Execution','execute',5,'Finish a gravely wounded foe without warning.']],
'Ashigaru':[
 ['Spear Thrust','pierce',3,'Pierce armor from behind a stable line.'],
 ['Close Ranks','formation',3,'Form a spearwall protecting weaker allies.'],
 ['Countermarch','countershot',4,'Strike the next foe attacking the line.'],
 ['Thousand Spears','multi',5,'Launch a formation-wide sweeping attack.']],
'Spirit Scribe':[
 ['Binding Glyph','bind',3,'Bind the next action of a hostile spirit or foe.'],
 ['Sigil of Rest','heal',3,'Use written rites to treat battle wounds.'],
 ['True Name','doom',4,'Weaken a marked enemy with its revealed identity.'],
 ['Circle of Return','revive',5,'Restore a fallen ally inside a protective sigil.']],
'Spearwall':[
 ['Set Spears','pin',3,'Stop an enemy charge in its tracks.'],
 ['Shield Rhythm','formation',3,'Raise a defensive line for all comrades.'],
 ['Hedge of Steel','counter',4,'Punish attackers striking the protected line.'],
 ['No Step Back','stand',1,'Once per battle, anchor a line against annihilation.']],
'Horn Runner':[
 ['Flanking Dash','flank',3,'Bypass frontline enemies and hit the rear.'],
 ['War Horn','rally',3,'Restore the party’s discipline and nerve.'],
 ['Encirclement','surround',4,'Expose enemies by attacking from both sides.'],
 ['Final Pursuit','rampage',5,'Run down a wounded foe and pursue the next.']],
'Shield-Breaker':[
 ['Crack Guard','pierce',3,'Splinter armor and expose a weak spot.'],
 ['Hammerfall','stagger',3,'Interrupt a powerful enemy with a crushing blow.'],
 ['Crush Formation','surround',4,'Break multiple defenders at once.'],
 ['Siegebreaker','execute',5,'Overwhelm an armored target in a single attack.']],
'War-Singer':[
 ['Battle Cadence','rally',3,'Keep the party fighting as wounds mount.'],
 ['Discordant Cry','silence',3,'Rattle and interrupt an enemy caster or leader.'],
 ['Heart Drum','wardall',4,'Protect wounded allies with a sustaining rhythm.'],
 ['March of Thunder','command',5,'Trigger a coordinated assault by the whole line.']],
'Bone-Seer':[
 ['Ancestor’s Warning','ward',3,'Warn an ally away from a lethal strike.'],
 ['Bone Hex','bleed',3,'Inflict supernatural wasting on a foe.'],
 ['Spirit Fetters','bind',4,'Bind a dangerous enemy to its own shadow.'],
 ['The Ancestors Rise','rescue',5,'Call ancestral guardians to retrieve a casualty.']],
'Lumen Guard':[
 ['Radiant Intercept','guard',3,'Step before an ally and take the threat.'],
 ['Purging Brand','purge',3,'Strike and cleanse unholy corruption.'],
 ['Halo Bastion','wardall',4,'Erect a protective halo around the formation.'],
 ['Dawn Unbroken','stand',1,'Once per battle, shield the entire party from collapse.']],
'Star-Spear':[
 ['Anatomy Break','pierce',3,'Strike a monster’s weak point, ignoring guard.'],
 ['Perfect Reach','pin',3,'Stop a distant foe before it can close.'],
 ['Starfall Thrust','charge',4,'Descend upon a high-value enemy with lethal force.'],
 ['Constellation Spear','doom',5,'Seal a monstrous foe’s fate with a delayed strike.']],
'Choir Adept':[
 ['Restoring Note','heal',3,'Restore the most wounded ally with a measured verse.'],
 ['Harmonic Screen','ward',3,'Protect an ally with resonant sound.'],
 ['Crescendo','rally',4,'Cleanse fear and rally all survivors.'],
 ['Final Chorus','revive',5,'Return a downed ally to the formation in song.']],
'Veilwalker':[
 ['Slip Angle','smoke',3,'Disappear from the enemy’s line of attack.'],
 ['Broken Path','pin',3,'Trap a foe inside impossible geometry.'],
 ['Phantom Reversal','counter',4,'Phase around a strike and retaliate.'],
 ['Worldfold','multi',5,'Strike several foes from impossible positions.']],
'Pattern-Savant':[
 ['Fault Line','expose',3,'Identify and exploit structural weakness.'],
 ['Pattern Lock','bind',3,'Break an enemy’s planned action.'],
 ['Rewritten Defense','wardall',4,'Reconfigure allied protection mid-battle.'],
 ['Pattern Collapse','doom',5,'Cause a marked foe’s defenses to fail catastrophically.']]
};
const GC360_ALL=Object.entries(GC360_TECHNIQUES);
function gc360Skills(a){return (GC360_TECHNIQUES[a?.className]||[]).map((x,i)=>({name:x[0],kind:x[1],cooldown:x[2],desc:x[3],level:GC360_MILESTONES[i],id:i}));}
function gc360Unlocked(a){return gc360Skills(a).filter(x=>(a?.lvl||1)>=x.level);}
