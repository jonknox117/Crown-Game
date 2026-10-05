/* v10 release-candidate cleanup, loaded inside the canonical game IIFE before boot. */

// Local-work wolves are part of the Veyric cursed-beast ecology rather than outsiders.
const _veyricCursed=REGION_ECOLOGY.veyric.families.find(f=>f.name==='Cursed Beasts');
if(_veyricCursed&&!_veyricCursed.species.includes('Wolf'))_veyricCursed.species.push('Wolf');
// Mortal violence still exists without displacing the required fantasy-monster families.
REGION_ECOLOGY.veyric.outsiders=['Bandit'];

// Replace the v9 implementation-string diagnostic with data/mechanic checks suitable for v10 wrappers.
const _auditV10RC=audit;
audit=function(){
 const out=_auditV10RC();
 out.enemyTypesMechanical=!!(
   ENEMY_SPECIES.Goblin?.pack&&ENEMY_SPECIES.Trollkin?.regen&&
   ENEMY_SPECIES.Horror?.horror&&ENEMY_SPECIES.Dragon?.legendary&&
   ENEMY_SPECIES['Storm Bird']?.legendary&&ENEMY_SPECIES['Fallen Seraph']?.legendary
 );
 out.audioGainTargets={sfx:.72,music:.44,master:.95};
 out.retreatSystem=/Cautious/.test(combatRound.toString())&&/retreat ordered/.test(combatRound.toString());
 out.captureSystem=/Captured/.test(resolveBattle.toString())&&typeof rescueContract==='function';
 return out;
};
window.__BL_AUDIT=audit;
