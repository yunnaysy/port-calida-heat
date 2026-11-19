import { MISSIONS } from '../config.js';

export function createMissionSystem(state, notify, dialogue, crime, save) {
  let timer = 0;
  let elapsed = 0;
  let justPassed = false;
  return {
    get index() { return state.mission; },
    get current() { return MISSIONS[Math.min(state.mission, MISSIONS.length - 1)]; },
    get completed() { return state.mission >= MISSIONS.length; },
    get timeLeft() { return timer; },
    get destination() { return this.completed ? [-398, 120] : this.current.target; },
    begin() {
      const mission = MISSIONS[Math.min(state.mission, MISSIONS.length - 1)];
      timer = mission.timer ?? 0; elapsed = 0; justPassed = false;
      if (mission.wanted) crime(mission.wanted);
      dialogue(state.mission === 0 ? 'LU VARGA  ·  “You want back in? Bring my Solstice home, Rafa. Then we talk.”' : `LU VARGA  ·  “${mission.title} Keep your head down and your eyes open.”`);
    },
    tick(dt, player, car, crimeStars, onTarget) {
      if (this.completed) return;
      elapsed += dt;
      if (timer > 0) { timer -= dt; if (timer <= 0) { timer = 0; notify('JOB LOST · THE WINDOW CLOSED'); this.begin(); return; } }
      const target = this.current.target;
      const distance = Math.hypot(player.x - target[0], player.z - target[1]);
      const needsCar = state.mission <= 1 || state.mission === 3 || state.mission === 5;
      const valid = !needsCar || Boolean(car) && (state.mission !== 0 || car.missionCar === true);
      const encounter = state.mission === 2 || state.mission === 4 ? onTarget : distance < 15;
      if (valid && encounter) {
        const mission = this.current;
        state.cash += mission.reward; state.respect += state.mission === 5 ? 3 : 1;
        state.mission++;
        if (crimeStars.clear) crimeStars.clear();
        justPassed = true;
        notify(`JOB COMPLETE · +$${mission.reward.toLocaleString()} · RESPECT +1`);
        dialogue('LU VARGA  ·  “That’s one more thing this city owes us.”');
        save();
        if (this.completed) notify('THE KEYS ARE YOURS · STORY COMPLETE');
        else { timer = 0; setTimeout(() => this.begin(), 3200); }
      }
    },
    consumePassed() { const value = justPassed; justPassed = false; return value; },
  };
}
