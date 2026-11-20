import { WEAPONS } from '../config.js';

export function createHud() {
  const byId = id => document.getElementById(id);
  const objective = byId('objective-text'), objectiveLabel = byId('objective').querySelector('b'), wanted = byId('wanted');
  const feed = byId('feed'), toast = byId('toast'), dialogue = byId('dialogue'), prompt = byId('prompt');
  const radio = byId('radio');
  const touchVehicleButton = document.querySelector('[data-touch-action="vehicle"]');
  const touchBrakeButton = document.querySelector('[data-touch-action="brake"]');
  const feedLines = [];
  let toastTimer = 0, dialogueTimer = 0, radioTimer = 0;
  return {
    notify(message) {
      feedLines.unshift({ text: message, life: 4.5 }); feedLines.length = Math.min(feedLines.length, 4);
      toast.classList.toggle('mission-complete', message.includes('JOB COMPLETE'));
      toast.textContent = message; toast.style.opacity = '1'; toastTimer = 2.4;
    },
    setPrompt(message) { prompt.textContent = message; prompt.hidden = !message; },
    dismissToast() { toast.style.opacity = '0'; toastTimer = 0; },
    say(message, duration = 4) {
      dialogue.textContent = message; dialogue.hidden = false; dialogueTimer = duration;
    },
    clearDialogue() { dialogue.hidden = true; dialogueTimer = 0; },
    clearFeed() { feedLines.length = 0; feed.textContent = ''; },
    showRadio() { radio.style.opacity = '1'; radioTimer = 4.2; },
    update(state, mission, combat, wantedSystem, dt) {
      const current = mission.current;
      objectiveLabel.textContent = mission.completed ? 'SOLANA KEYS · FREE ROAM' : `JOB ${String(mission.index + 1).padStart(2, '0')} · ${current.title.toUpperCase()}`;
      objective.textContent = mission.completed ? 'The tide is yours to read now.' :
        `${current.detail}${state.encounterText ? ` · ${state.encounterText}` : ''}${state.shotTimer ? ` · ${state.shotTimer}` : ''}${mission.timeLeft > 0 ? ` · ${Math.ceil(mission.timeLeft)} SEC` : ''}${mission.status && !mission.completed ? ` · ${mission.status}` : ''}${state.activityStatus ? ` · ${state.activityStatus}` : ''}`;
      wanted.innerHTML = `${'<span class="star-lit">★</span> '.repeat(wantedSystem.stars)}${'<span class="star-dark">★</span> '.repeat(5 - wantedSystem.stars)}`;
      wanted.title = wantedSystem.status ? wantedSystem.status.toUpperCase() : '';
      wanted.style.opacity = wantedSystem.stars ? '1' : (wantedSystem.status === 'evaded' ? '.5' : '0');
      wanted.style.color = wantedSystem.stars >= 4 ? '#ff795e' : '#ffd174';
      wanted.style.setProperty('--wanted-lit', wantedSystem.stars >= 4 ? '#ff795e' : '#ffd174');
      byId('health-fill').style.width = `${Math.max(0, state.player.health)}%`;
      byId('armour-fill').style.width = `${Math.max(0, state.player.armour)}%`;
      byId('health-num').textContent = Math.ceil(state.player.health);
      byId('armour-num').textContent = Math.ceil(state.player.armour);
      const staminaFill = byId('stamina-fill');
      if (staminaFill) staminaFill.style.width = `${Math.max(0, Math.min(100, (state.player.stamina ?? 1) * 100))}%`;
      byId('cash-label').textContent = `CASH · REP ${state.respect}`;
      document.querySelector('#money span').textContent = state.cash.toLocaleString();
      const weapon = WEAPONS[combat.selected];
      byId('weapon').innerHTML = `${weapon.name}<small>${weapon.label} · ${Number.isFinite(combat.ammunition) ? combat.ammunition : 'READY'}</small>`;
      const vehicleLabel = state.player.vehicle ? 'EXIT' : 'ENTER';
      if (touchVehicleButton && touchVehicleButton.textContent !== vehicleLabel) touchVehicleButton.textContent = vehicleLabel;
      const brakeLabel = state.player.vehicle ? 'BRAKE' : 'SPRINT';
      if (touchBrakeButton && touchBrakeButton.textContent !== brakeLabel) touchBrakeButton.textContent = brakeLabel;
      byId('reticle').style.display = combat.selected > 0 && !state.player.vehicle ? 'block' : 'none';
      byId('district').textContent = state.player.mesh.position.z > 220 && Math.abs(state.player.mesh.position.x) > 400 ? 'THE CAUSEWAY · SOLANA KEYS' :
        state.player.mesh.position.x < -330 ? 'THE PORT DOCKS · SOLANA KEYS' :
        state.player.mesh.position.z > 130 ? 'THE CAUSEWAY · SOLANA KEYS' :
        state.player.mesh.position.z < -130 ? 'CORAL HEIGHTS · SOLANA KEYS' : 'MARINA ROW · SOLANA KEYS';
      for (let index = feedLines.length - 1; index >= 0; index--) {
        feedLines[index].life -= dt; if (feedLines[index].life <= 0) feedLines.splice(index, 1);
      }
      feed.innerHTML = feedLines.map(line => `<div>${line.text}</div>`).join('');
      toastTimer -= dt; if (toastTimer <= 0) toast.style.opacity = '0';
      dialogueTimer -= dt; if (dialogueTimer <= 0) dialogue.hidden = true;
      radioTimer -= dt; if (radioTimer <= 0) radio.style.opacity = '0';
    },
  };
}
