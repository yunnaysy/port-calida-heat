// Owns cash-and-respect purchases and fare payouts for progression throughout Port Calida.
/** Creates the economy helpers that modify shared player progression state. */
export function createEconomy(state, notify) {
  return {
    get level() { return 1 + Math.floor(state.respect / 3); },
    buyWeapon(index, price, combat) {
      if (state.cash < price) { notify('NOT ENOUGH CASH · TRY A FARE'); return false; }
      state.cash -= price; state.weapons[index] = true; combat.unlock(index);
      notify('CALIDA ARMS · PURCHASE CONFIRMED'); return true;
    },
    fare() {
      const earning = 180 + this.level * 45;
      state.cash += earning; state.respect += 1;
      notify(`FARE COMPLETE · +$${earning} · RESPECT +1`);
    },
  };
}
