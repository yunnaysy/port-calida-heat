// Runs optional taxi-fare and Causeway Sprint side activities, including timers and rewards.
/** Creates the side-activity state machine driven by world markers. */
export function createActivities(state, economy, notify) {
  let activity = '', raceStage = 0, taxiTimer = 0;
  const checkpoints = [[276, -184], [368, -184], [368, -92], [276, 0]];

  return {
    start(position, vehicle) {
      if (Math.hypot(position.x - 28, position.z - 36) < 18 && vehicle?.kind === 'taxi') {
        activity = 'taxi'; taxiTimer = 50; notify('SOLANA FARES · PICK UP AT MARINA ROW'); return;
      }
      if (Math.hypot(position.x - 276, position.z + 276) < 18 && vehicle) {
        activity = 'race'; raceStage = 0; notify('CAUSEWAY SPRINT · FIRST CHECKPOINT MARKED');
      } else if (vehicle?.kind === 'taxi') {
        activity = 'taxi'; taxiTimer = 50; notify('SOLANA FARES · NEXT STOP: CORAL HEIGHTS');
      } else notify('ACTIVITY MARKERS · CAB FARES AND THE CAUSEWAY SPRINT');
    },
    tick(dt, position) {
      if (activity === 'taxi') {
        taxiTimer -= dt;
        if (Math.hypot(position.x - 164, position.z + 148) < 14) {
          activity = ''; economy.fare();
        } else if (taxiTimer <= 0) { activity = ''; notify('FARE MISSED · ANOTHER PASSENGER WILL COME'); }
      }
      if (activity === 'race') {
        const target = checkpoints[raceStage];
        if (target && Math.hypot(position.x - target[0], position.z - target[1]) < 13) {
          raceStage++;
          if (raceStage >= checkpoints.length) { state.cash += 950; state.respect++; activity = ''; notify('CAUSEWAY SPRINT · FINISH · +$950'); }
          else notify(`CHECKPOINT ${raceStage + 1} / ${checkpoints.length}`);
        }
      }
    },
    get current() { return activity; },
  };
}
