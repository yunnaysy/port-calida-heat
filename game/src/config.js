export const CITY = { half: 460, spacing: 92, road: 16, block: 76 };
export const COLORS = {
  asphalt: 0x30383b, sand: 0xe7c99a, sea: 0x087f9d, palm: 0x286344,
  cream: 0xd9c3a0, coral: 0xf17e78, mint: 0x76a94b, blue: 0x38c7d9,
};
export const WEAPONS = [
  { name: 'BARE HANDS', label: 'UNARMED', damage: 8, range: 3, ammo: Infinity, rate: 0.55 },
  { name: 'SUNLINE 9', label: 'PISTOL', damage: 28, range: 105, ammo: 48, rate: 0.32 },
  { name: 'TIDECUTTER', label: 'SMG', damage: 15, range: 115, ammo: 120, rate: 0.12 },
  { name: 'BREAKWATER', label: 'SHOTGUN', damage: 65, range: 42, ammo: 20, rate: 0.8 },
];
export const SAVE_KEY = 'port-calida-heat.save.v1';
export const MISSIONS = [
  { title: 'A clean car. A dirty start.', detail: 'Find Lu’s silver Solstice coupe and bring it to the Lantern Garage.', target: [-60, -60], reward: 650 },
  { title: 'No time for small talk.', detail: 'Get Lu to the Coral Heights overlook before the meeting starts.', target: [164, -148], reward: 900, timer: 105 },
  { title: 'Cut the courier loose.', detail: 'Catch Dex’s courier on the Causeway. Stop the car before the port.', target: [244, 154], reward: 1250 },
  { title: 'A warm welcome.', detail: 'Lose the PCPD tail. Break their line of sight and get off the Causeway.', target: [-154, 246], reward: 1550, wanted: 3 },
  { title: 'The dock goes quiet.', detail: 'Clear Dex’s crew from Pier Nine. Keep the port workers breathing.', target: [-330, 154], reward: 2100 },
  { title: 'Low tide, high stakes.', detail: 'Take the blueprints to Lu. Get the crew out before the sirens arrive.', target: [-100, -340], reward: 4000 },
];
