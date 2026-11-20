// Drives the story mission sequence, targets, timers, rewards, and completion dialogue.
import { MISSIONS } from '../config.js';

const LU_LINES = [
  'Bring my Solstice home, Rafa. Then we talk.',
  'High tide, quiet hands. The docks do not forgive noise.',
  'The courier runs fast, but Port Calida remembers faces.',
  'Pier 9 wants silence. Lose the sirens before you clock in.',
  'No witnesses, no panic. Sweep it clean and walk out breathing.',
  'Causeway run is live. Finish hard and the keys are yours.',
];

/** Creates the mission state machine that advances Lu Varga's story jobs. */
export function createMissionSystem(state, notify, dialogue, crime, save) {
  let timer = 0;
  let elapsed = 0;
  let justPassed = false;
  let activeIndex = -1;
  let retryQueued = false;
  let completeQueued = false;
  let failNotice = '';
  return {
    get index() { return state.mission; },
    get current() { return MISSIONS[Math.min(state.mission, MISSIONS.length - 1)]; },
    get completed() { return state.mission >= MISSIONS.length; },
    get timeLeft() { return timer; },
    get destination() { return this.completed ? [-398, 120] : this.current.target; },
    get status() {
      if (this.completed) return 'STORY COMPLETE · FREE ROAM';
      if (failNotice) return failNotice;
      if (completeQueued) return 'JOB COMPLETE · NEXT BRIEFING INCOMING';
      if (retryQueued) return 'JOB RESETTING · GET BACK IN POSITION';
      if (elapsed < 1.5) return 'BRIEFING WINDOW · TIMER ARMED';
      return timer > 0 ? `TIME LEFT ${Math.ceil(timer)}s` : 'OBJECTIVE ACTIVE';
    },
    begin() {
      if (this.completed) return;
      const mission = MISSIONS[Math.min(state.mission, MISSIONS.length - 1)];
      activeIndex = state.mission;
      timer = mission.timer ?? 0; elapsed = 0; justPassed = false;
      retryQueued = false; completeQueued = false; failNotice = '';
      if (mission.wanted) crime(mission.wanted);
      const line = LU_LINES[Math.min(state.mission, LU_LINES.length - 1)] ?? mission.title;
      dialogue(`LU VARGA  ·  “${line}”`);
    },
    tick(dt, player, car, crimeStars, onTarget) {
      if (this.completed) return;
      elapsed += dt;
      if (activeIndex !== state.mission && !retryQueued && !completeQueued) this.begin();
      if (retryQueued || completeQueued) return;
      if (timer > 0 && elapsed > 1.5) {
        timer -= dt;
        if (timer <= 0) {
          timer = 0; failNotice = 'JOB FAILED · WINDOW CLOSED';
          notify('JOB LOST · THE WINDOW CLOSED');
          retryQueued = true;
          setTimeout(() => { retryQueued = false; this.begin(); }, 1800);
          return;
        }
      }
      const mission = MISSIONS[Math.min(state.mission, MISSIONS.length - 1)];
      const target = mission.target;
      const distance = Math.hypot(player.x - target[0], player.z - target[1]);
      const needsCar = state.mission <= 1 || state.mission === 3 || state.mission === 5;
      const valid = !needsCar || Boolean(car) && (state.mission !== 0 || car.missionCar === true);
      const encounter = state.mission === 2 || state.mission === 4 ? onTarget : distance < 15;
      if (valid && encounter) {
        const finished = state.mission;
        const respectGain = finished === 5 ? 3 : 1;
        state.cash += mission.reward; state.respect += respectGain;
        state.mission++;
        if (crimeStars?.clear) crimeStars.clear();
        justPassed = true;
        completeQueued = true;
        failNotice = '';
        notify(`JOB COMPLETE · +$${mission.reward.toLocaleString()} · RESPECT +${respectGain}`);
        dialogue(`LU VARGA  ·  “${LU_LINES[Math.min(finished, LU_LINES.length - 1)]}”`);
        save?.();
        if (this.completed) notify('THE KEYS ARE YOURS · STORY COMPLETE');
        else {
          timer = 0;
          setTimeout(() => { completeQueued = false; this.begin(); }, 3200);
        }
      }
    },
    consumePassed() { const value = justPassed; justPassed = false; return value; },
  };
}
