// Tracks PCPD wanted stars and the peaceful cool-down period after crimes.
/** Creates the wanted-level state machine used by crime and pursuit systems. */
export function createWanted() {
  let score = 0;
  let coolOff = 0;
  let lostTime = 0;
  let hidden = false;
  return {
    stars: 0,
    reason: '',
    status: 'clear',
    addCrime(amount, reason) {
      score = Math.min(100, score + amount);
      this.stars = Math.min(5, Math.max(1, Math.ceil(score / 20)));
      coolOff = 0; lostTime = 0; hidden = false;
      this.reason = reason; this.status = 'spotted';
    },
    setHidden(value) { hidden = Boolean(value); },
    tick(dt, policeVisible, inCar) {
      if (this.stars === 0) { this.status = 'clear'; this.reason = ''; return; }
      if (policeVisible) {
        lostTime = 0; coolOff = 0; hidden = false; this.status = 'spotted';
      } else {
        lostTime += dt; coolOff += dt;
        this.status = hidden ? 'hidden' : 'searching';
      }
      const threshold = inCar ? 14 : 9;
      if (lostTime > threshold) {
        let drain = dt * (inCar ? 1.85 : 1.55);
        if (this.stars >= 4) drain *= .72;
        if (hidden) drain *= 1.35;
        score = Math.max(0, score - drain);
        if (score < 2) {
          score = 0; this.stars = 0; this.reason = ''; this.status = 'evaded'; lostTime = 0; hidden = false;
          return;
        }
      }
      this.stars = score < 2 ? 0 : Math.ceil(score / 20);
      if (!this.stars) { this.reason = ''; this.status = 'evaded'; }
    },
    clear() { score = 0; this.stars = 0; this.reason = ''; coolOff = 0; lostTime = 0; hidden = false; this.status = 'clear'; },
    get searchProgress() { return Math.min(1, lostTime / 14); },
  };
}
