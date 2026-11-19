export function createWanted() {
  let score = 0;
  let coolOff = 0;
  let lostTime = 0;
  return {
    stars: 0,
    addCrime(amount, reason) {
      score = Math.min(100, score + amount);
      this.stars = Math.min(5, Math.max(1, Math.ceil(score / 20)));
      coolOff = 0; lostTime = 0; this.reason = reason;
    },
    tick(dt, policeVisible, inCar) {
      if (this.stars === 0) return;
      if (policeVisible) { lostTime = 0; coolOff = 0; }
      else { lostTime += dt; coolOff += dt; }
      if (lostTime > (inCar ? 14 : 9)) score = Math.max(0, score - dt * 1.65);
      this.stars = score < 2 ? 0 : Math.ceil(score / 20);
      if (!this.stars) this.reason = '';
    },
    clear() { score = 0; this.stars = 0; this.reason = ''; coolOff = 0; lostTime = 0; },
    get searchProgress() { return Math.min(1, lostTime / 14); },
  };
}
