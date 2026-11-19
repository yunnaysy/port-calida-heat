export function createMinimap(canvas, pauseCanvas, titleCanvas) {
  const context = canvas.getContext('2d');
  const pauseContext = pauseCanvas.getContext('2d');
  const titleContext = titleCanvas.getContext('2d');
  function drawMap(ctx, width, height, player, items, rotate) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#142729'; ctx.fillRect(0, 0, width, height);
    ctx.save();
    const overview = !rotate;
    ctx.translate(width / 2, height / 2);
    if (rotate) ctx.rotate(-player.yaw);
    const scale = overview ? Math.min(width / 940, height / 940) : width / (player.zoom ?? 182);
    ctx.scale(scale, scale);
    ctx.translate(overview ? 0 : -player.x, overview ? 0 : -player.z);
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
      drawMap(pauseContext, pauseCanvas.width, pauseCanvas.height, player, items, false);
      drawMap(titleContext, titleCanvas.width, titleCanvas.height, player, items, false);
    },
  };
}
