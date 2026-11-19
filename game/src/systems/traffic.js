import * as THREE from 'three';
import { createVehicle, placeVehicle, tickVehicle } from '../entities/vehicle.js';

const palette = [0x73a499, 0xd5a45f, 0x68869b, 0xb77b61, 0xd7d0bc, 0x506865];

export function populateTraffic(scene, random) {
  const vehicles = [];
  for (let i = 0; i < 19; i++) {
    const axis = i % 2 ? 'x' : 'z';
    const lane = Math.floor(random() * 7 - 3) * 92;
    const sign = random() > .5 ? 1 : -1;
    const vehicle = createVehicle(scene, {
      kind: ['compact', 'taxi', 'suv', 'muscle'][i % 4], color: palette[Math.floor(random() * palette.length)],
      ai: true, x: axis === 'x' ? sign * (30 + random() * 370) : lane,
      z: axis === 'z' ? sign * (30 + random() * 370) : lane,
      yaw: axis === 'x' ? sign < 0 ? Math.PI / 2 : -Math.PI / 2 : sign < 0 ? Math.PI : 0,
      routeAxis: axis, routeSign: sign,
    });
    vehicle.cruise = 9 + random() * 5; vehicles.push(vehicle);
  }
  return vehicles;
}

export function tickTraffic(traffic, dt, player, wanted, setWanted, sound) {
  const position = player.vehicle?.mesh.position ?? player.mesh.position;
  for (const car of traffic) {
    const carPosition = car.mesh.position;
    if (car.ai) {
      if (car.routeAxis === 'x') {
        carPosition.x += car.routeSign * car.cruise * dt;
        if (carPosition.x > 445) carPosition.x = -620;
        if (carPosition.x < -630) carPosition.x = 440;
        car.yaw = car.routeSign > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else {
        carPosition.z += car.routeSign * car.cruise * dt;
        if (Math.abs(carPosition.z) > 445) { carPosition.z = -Math.sign(carPosition.z) * 440; }
        car.yaw = car.routeSign > 0 ? Math.PI : 0;
      }
      const trafficLight = Math.abs((car.routeAxis === 'x' ? carPosition.x : carPosition.z) % 92);
      if (trafficLight < 8 && Math.floor(performance.now() / 7500) % 2 === 0) {
        carPosition[car.routeAxis] -= car.routeSign * car.cruise * dt;
      }
    }
    tickVehicle(car, dt);
    if (!player.onFoot && car !== player.vehicle && carPosition.distanceTo(position) < 3.8) {
      car.speed = -car.speed * .28; car.health -= 8;
      if (car.ai) { car.ai = false; car.speed = -10; setWanted(12, 'reckless driving'); }
    }
  }
}
