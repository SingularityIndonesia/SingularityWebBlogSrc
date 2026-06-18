function initGraph(canvas, graphData, currentSlug, forceRecalculate = false) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;

  const CACHE_KEY = "graph_positions";
  const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "{}");

  const currentIds = graphData.nodes.map(n => n.id).sort().join(",");
  const cachedIds = Object.keys(cached).sort().join(",");
  const cacheValid = !forceRecalculate && currentIds === cachedIds;
  if (!cacheValid) sessionStorage.removeItem(CACHE_KEY);
  const noCache = forceRecalculate;

  const positions = cacheValid ? cached : {};

  const nodes = graphData.nodes.map(n => ({
    ...n,
    x: positions[n.id]?.x ?? W / 2 + (Math.random() - 0.5) * W * 0.6,
    y: positions[n.id]?.y ?? H / 2 + (Math.random() - 0.5) * H * 0.6,
    vx: 0,
    vy: 0,
  }));

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = graphData.edges
    .map(e => ({ source: nodeById[e.source], target: nodeById[e.target] }))
    .filter(e => e.source && e.target);

  function simulate() {
    const repulsion = 1800;
    const spring = 0.04;
    const restLen = 60;
    const damping = 0.75;
    const gravity = 0.008;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = force * dx / dist, fy = force * dy / dist;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    for (const { source: a, target: b } of edges) {
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = spring * (dist - restLen);
      const fx = force * dx / dist, fy = force * dy / dist;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    for (const n of nodes) {
      n.vx += (W / 2 - n.x) * gravity;
      n.vy += (H / 2 - n.y) * gravity;
      n.vx *= damping;
      n.vy *= damping;
      n.x = Math.max(8, Math.min(W - 8, n.x + n.vx));
      n.y = Math.max(8, Math.min(H - 8, n.y + n.vy));
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const { source: a, target: b } of edges) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "#2a2a2a";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    for (const n of nodes) {
      const isActive = n.id === currentSlug;
      const r = isActive ? 5 : 3;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? "#e0e0e0" : "#555";
      ctx.fill();

      ctx.font = "9px monospace";
      ctx.fillStyle = isActive ? "#e0e0e0" : "#555";
      ctx.textAlign = "center";
      ctx.fillText(n.name, n.x, n.y - r - 4);
    }
  }

  let frame = 0;
  const settled = cacheValid;

  function loop() {
    if (frame < (settled ? 0 : 300)) simulate();
    if (!noCache && frame === (settled ? 0 : 300)) {
      const positions = {};
      nodes.forEach(n => { positions[n.id] = { x: n.x, y: n.y }; });
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(positions));
    }
    draw();
    frame++;
    requestAnimationFrame(loop);
  }
  loop();

  // click to navigate
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const n of nodes) {
      const dx = n.x - mx, dy = n.y - my;
      if (Math.sqrt(dx * dx + dy * dy) < 8) {
        window.location.href = n.id + ".html";
        return;
      }
    }
  });

  canvas.style.cursor = "default";
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = nodes.some(n => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < 8;
    });
    canvas.style.cursor = hit ? "pointer" : "default";
  });
}
