// Runs optional taxi-fare and Causeway Sprint side activities, including timers and rewards.
/** Creates the side-activity state machine driven by world markers. */
export function createActivities(state, economy, notify) {
  let activity = '', raceStage = 0, taxiTimer = 0, taxiStops = 0, taxiStart = 0;
  let raceClock = 0, raceSplit = 0, raceAbandon = 0;
  const taxiRoute = [[164, -148], [12, 148], [318, 92]];
  const checkpoints = [[276, -184], [368, -184], [368, -92], [276, 0]];

  return {
    start(position, vehicle) {
      if (Math.hypot(position.x - 28, position.z - 36) < 18 && vehicle?.kind === 'taxi') {
        activity = 'taxi'; taxiTimer = 55; taxiStops = 0; taxiStart = 55;
        notify('SOLANA FARES · PICKUP LIVE · STOP 1: CORAL HEIGHTS'); return;
      }
      if (Math.hypot(position.x - 276, position.z + 276) < 18 && vehicle) {
        activity = 'race'; raceStage = 0; raceClock = 0; raceSplit = 0; raceAbandon = 0;
        notify('CAUSEWAY SPRINT · CHECKPOINT 1 MARKED · STAY ON COURSE');
      } else if (vehicle?.kind === 'taxi') {
        activity = 'taxi'; taxiTimer = 55; taxiStops = 0; taxiStart = 55;
        notify('SOLANA FARES · NEXT STOP: CORAL HEIGHTS · FAST DROPOFF BONUS ACTIVE');
      } else notify('ACTIVITY MARKERS · CAB FARES AND THE CAUSEWAY SPRINT');
    },
    tick(dt, position, vehicle = null) {
      if (activity === 'taxi') {
        taxiTimer -= dt;
        const stop = taxiRoute[taxiStops];
        if (stop && Math.hypot(position.x - stop[0], position.z - stop[1]) < 14) {
          taxiStops++;
          const fast = taxiTimer > taxiStart * .45;
          economy.fare({ bonus: fast ? 90 : 0, reason: fast ? 'FAST DROP-OFF' : 'DROP-OFF' });
          if (taxiStops >= taxiRoute.length) {
            activity = '';
            state.respect += 1;
            notify('SOLANA FARES · SHIFT COMPLETE · RESPECT +1');
          } else {
            taxiTimer += 18; taxiStart = taxiTimer;
            notify(`SOLANA FARES · STOP ${taxiStops + 1}/${taxiRoute.length} · ${fast ? 'BONUS KEPT' : 'KEEP MOVING'}`);
          }
        } else if (taxiTimer <= 0) { activity = ''; notify('FARE MISSED · PASSENGER BAILED, TRY ANOTHER RUN'); }
      }
      if (activity === 'race') {
        raceClock += dt; raceSplit += dt;
        const target = checkpoints[raceStage];
        const onCourse = vehicle && Math.hypot(position.x - 322, position.z + 138) < 260;
        raceAbandon = onCourse ? 0 : raceAbandon + dt;
        if (raceAbandon > 8) { activity = ''; notify('CAUSEWAY SPRINT · COURSE ABANDONED'); return; }
        if (target && Math.hypot(position.x - target[0], position.z - target[1]) < 13) {
          raceStage++;
          const split = raceSplit; raceSplit = 0;
          if (raceStage >= checkpoints.length) {
            const bonus = Math.max(0, Math.round((95 - raceClock) * 12));
            const payout = 950 + bonus;
            state.cash += payout; state.respect++;
            activity = '';
            notify(`CAUSEWAY SPRINT · FINISH ${raceClock.toFixed(1)}s · +$${payout}${bonus ? ' BONUS' : ''}`);
          } else notify(`CHECKPOINT ${raceStage}/${checkpoints.length} · SPLIT ${split.toFixed(1)}s`);
        }
      }
    },
    get current() { return activity; },
    get status() {
      if (activity === 'taxi') return `TAXI ${taxiStops + 1}/${taxiRoute.length} · ${Math.max(0, Math.ceil(taxiTimer))}s`;
      if (activity === 'race') return `SPRINT ${raceStage + 1}/${checkpoints.length} · ${raceClock.toFixed(1)}s`;
      return '';
    },
  };
}
