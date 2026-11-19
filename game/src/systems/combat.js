import * as THREE from 'three';
import { WEAPONS } from '../config.js';

export function createCombat(player, wanted, particles, audio, notify, ownedWeapons = [true, true, false, false]) {
  const ammunition = [Infinity, 48, 120, 20];
  const owned = ownedWeapons;
  let selected = 0, cooldown = 0, reloading = 0;
  return {
    get selected() { return selected; },
    get ammunition() { return ammunition[selected]; },
    get owned() { return owned; },
    equip(index) {
      if (owned[index] && index >= 0 && index < WEAPONS.length) {
        selected = index; audio.weaponSwitch(); notify(`${WEAPONS[index].name} · EQUIPPED`);
      }
    },
    unlock(index) {
      owned[index] = true; ammunition[index] = index === 2 ? 120 : 20; this.equip(index);
    },
    reload() {
      if (selected && ammunition[selected] !== Infinity) { reloading = 1.05; notify('RELOADING'); }
    },
    fire(direction, origin, targets, wantedPolice) {
      if (cooldown > 0 || reloading > 0) return false;
      const weapon = WEAPONS[selected];
      if (ammunition[selected] <= 0) { this.reload(); return false; }
      cooldown = weapon.rate;
      if (selected) ammunition[selected]--;
      if (selected) audio.shot();
      const forward = direction.clone().normalize();
      const hit = targets.filter(target => target.health > 0)
        .map(target => ({ target, offset: target.position.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(origin), distance: 0 }))
        .map(item => { item.distance = item.offset.length(); return item; })
        .filter(item => item.distance <= weapon.range && item.offset.normalize().dot(forward) > .975)
        .sort((a, b) => a.distance - b.distance)[0];
      const end = hit ? hit.target.position.clone().add(new THREE.Vector3(0, 1.1, 0)) : origin.clone().addScaledVector(forward, weapon.range);
      particles.tracer(origin, end);
      particles.burst(end, hit ? 0xffba70 : 0xe9d9b8, 6);
      if (hit) {
        const isPolice = Boolean(hit.target.isPolice || hit.target.entity?.police);
        hit.target.damage(weapon.damage);
        if (isPolice) wanted.addCrime(30, 'assault on an officer');
        else wanted.addCrime(12, 'assault');
      } else if (wantedPolice) wanted.addCrime(22, 'discharging a firearm near PCPD');
      return true;
    },
    tick(dt) {
      cooldown = Math.max(0, cooldown - dt);
      if (reloading > 0) {
        reloading -= dt;
        if (reloading <= 0) { ammunition[selected] = selected === 3 ? 20 : selected === 2 ? 120 : 48; notify('MAGAZINE REFILLED'); }
      }
    },
  };
}
