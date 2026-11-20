// Owns cash-and-respect purchases and fare payouts for progression throughout Port Calida.
/** Creates the economy helpers that modify shared player progression state. */
export function createEconomy(state, notify) {
  let firstFarePaid = false;
  return {
    get level() { return 1 + Math.floor(state.respect / 3); },
    get discount() { return Math.min(.18, Math.floor(state.respect / 3) * .03); },
    buyWeapon(index, price, combat) {
      const finalPrice = Math.max(0, Math.round(price * (1 - this.discount)));
      if (state.cash < finalPrice) { notify(`NOT ENOUGH CASH · NEED $${finalPrice.toLocaleString()}`); return false; }
      state.cash -= finalPrice; state.weapons[index] = true; combat.unlock(index);
      const note = finalPrice < price ? ` · RESPECT DISCOUNT -$${(price - finalPrice).toLocaleString()}` : '';
      notify(`CALIDA ARMS · PURCHASE CONFIRMED${note}`); return true;
    },
    fare(options = {}) {
      const bonus = Math.max(0, Number(options.bonus) || 0);
      let earning = 180 + this.level * 45 + bonus;
      let extra = '';
      if (!firstFarePaid) { earning += 120; firstFarePaid = true; extra = ' · FIRST FARE BONUS'; }
      state.cash += earning; state.respect += 1;
      const reason = options.reason ? `${options.reason} · ` : '';
      notify(`${reason}FARE COMPLETE · +$${earning.toLocaleString()} · RESPECT +1${extra}`);
      return earning;
    },
    oddJob(name = 'PORT-SIDE ODD JOB') {
      const payout = 110 + this.level * 20;
      state.cash += payout;
      notify(`${name} · +$${payout.toLocaleString()}`);
      return payout;
    },
  };
}
