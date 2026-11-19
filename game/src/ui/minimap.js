export function createMinimap(canvas, pauseCanvas, titleCanvas) {
  const context = canvas.getContext('2d');
  const pauseContext = pauseCanvas.getContext('2d');
  const titleContext = titleCanvas.getContext('2d');
  const mapView = { zoom: 1, panX: 0, panZ: 0, waypoint: null };
  let drag = null;
  pauseCanvas.addEventListener('wheel', event => {
    event.preventDefault();
    mapView.zoom = Math.max(.75, Math.min(3.2, mapView.zoom * (event.deltaY < 0 ? 1.14 : .88)));
    pauseCanvas.dataset.zoom = mapView.zoom.toFixed(2);
  }, { passive: false });
  pauseCanvas.addEventListener('pointerdown', event => {
    drag = { x: event.clientX, y: event.clientY, panX: mapView.panX, panZ: mapView.panZ };
    pauseCanvas.setPointerCapture(event.pointerId);
  });
  pauseCanvas.addEventListener('pointermove', event => {
    if (!drag) return;
    const scale = Math.min(pauseCanvas.width / 940, pauseCanvas.height / 940) * mapView.zoom;
    const rect = pauseCanvas.getBoundingClientRect();
    mapView.panX = drag.panX - (event.clientX - drag.x) * pauseCanvas.width / rect.width / scale;
    mapView.panZ = drag.panZ - (event.clientY - drag.y) * pauseCanvas.height / rect.height / scale;
    pauseCanvas.dataset.pan = `${mapView.panX.toFixed(0)},${mapView.panZ.toFixed(0)}`;
  });
  pauseCanvas.addEventListener('pointerup', event => {
    if (!drag) return;
    const moved = Math.hypot(event.clientX - drag.x, event.clientY - drag.y);
    if (moved < 5) {
      const rect = pauseCanvas.getBoundingClientRect();
      const scale = Math.min(pauseCanvas.width / 940, pauseCanvas.height / 940) * mapView.zoom;
      const pixelX = (event.clientX - rect.left) * pauseCanvas.width / rect.width;
      const pixelZ = (event.clientY - rect.top) * pauseCanvas.height / rect.height;
      const x = mapView.panX + (pixelX - pauseCanvas.width / 2) / scale;
      const z = mapView.panZ + (pixelZ - pauseCanvas.height / 2) / scale;
      mapView.waypoint = { x: Math.max(-470, Math.min(470, x)), z: Math.max(-470, Math.min(470, z)) };
      pauseCanvas.dataset.waypoint = `${mapView.waypoint.x.toFixed(0)},${mapView.waypoint.z.toFixed(0)}`;
    }
    drag = null;
  });
  function drawMap(ctx, width, height, player, items, rotate, view = null) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#142729'; ctx.fillRect(0, 0, width, height);
    ctx.save();
    const overview = !rotate && !view;
    ctx.translate(width / 2, height / 2);
    if (rotate) ctx.rotate(-player.yaw);
    const scale = overview ? Math.min(width / 940, height / 940) :
      view ? Math.min(width / 940, height / 940) * view.zoom : width / (player.zoom ?? 182);
    ctx.scale(scale, scale);
    ctx.translate(overview ? 0 : view ? -view.panX : -player.x, overview ? 0 : view ? -view.panZ : -player.z);
    ctx.fillStyle = '#d1b993'; ctx.fillRect(-470, -470, 940, 940);
    ctx.fillStyle = '#378e91'; ctx.fillRect(-540, -500, 94, 1000);
    ctx.strokeStyle = '#53605b'; ctx.lineWidth = 17;
    for (let lane = -5; lane <= 5; lane++) {
      ctx.beginPath(); ctx.moveTo(-470, lane * 92); ctx.lineTo(470, lane * 92); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lane * 92, -470); ctx.lineTo(lane * 92, 470); ctx.stroke();
    }
    ctx.fillStyle = '#f2c56f';
    for (const [x, z] of [[-60, -60], [190, -190], [280, 100], [-360, 160]]) {
      ctx.beginPath(); ctx.arc(x, z, 3.8, 0, Math.PI * 2); ctx.fill();
    }
    for (const item of items) {
      ctx.fillStyle = item.color; ctx.beginPath(); ctx.arc(item.x, item.z, item.radius ?? 3, 0, Math.PI * 2); ctx.fill();
    }
    if (view?.waypoint) {
      ctx.strokeStyle = '#63d6e5'; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.arc(view.waypoint.x, view.waypoint.z, 7, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#63d6e5'; ctx.beginPath(); ctx.arc(view.waypoint.x, view.waypoint.z, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    if (overview) {
      ctx.save();
      ctx.fillStyle = '#ffe4ad'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center';
      for (const [label, x, z] of [
        ['CORAL HEIGHTS', 184, -280], ['MARINA ROW', -12, -38], ['OLD MERCADO', 184, 230],
        ['PORT DOCKS', -355, 174], ['THE CAUSEWAY', -492, 310],
      ]) ctx.fillText(label, x, z);
      ctx.restore();
    }
    ctx.fillStyle = '#fff3d4'; ctx.beginPath();
    ctx.moveTo(player.x, player.z - 7); ctx.lineTo(player.x - 4.5, player.z + 4); ctx.lineTo(player.x + 4.5, player.z + 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  return {
    draw(player, items) {
      drawMap(context, canvas.width, canvas.height, player, items, true);
      drawMap(pauseContext, pauseCanvas.width, pauseCanvas.height, player, items, false, mapView);
      drawMap(titleContext, titleCanvas.width, titleCanvas.height, player, items, false);
    },
    get waypoint() { return mapView.waypoint; },
  };
}
