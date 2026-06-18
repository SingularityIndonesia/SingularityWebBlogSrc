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

  let hoveredNode = null;

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
      if (n.pinned) continue;
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

    const connectedIds = new Set();
    const connectedEdges = new Set();
    if (hoveredNode) {
      connectedIds.add(hoveredNode.id);
      edges.forEach((e, i) => {
        if (e.source.id === hoveredNode.id || e.target.id === hoveredNode.id) {
          connectedIds.add(e.source.id);
          connectedIds.add(e.target.id);
          connectedEdges.add(i);
        }
      });
    }

    const dimming = hoveredNode !== null;

    edges.forEach((e, i) => {
      const highlighted = !dimming || connectedEdges.has(i);
      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);
      ctx.strokeStyle = !dimming ? "#2a2a2a" : connectedEdges.has(i) ? "#aaa" : "#1a1a1a";
      ctx.lineWidth = !dimming ? 1 : connectedEdges.has(i) ? 2 : 0.5;
      ctx.stroke();
    });

    for (const n of nodes) {
      const isActive = n.id === currentSlug;
      const highlighted = !dimming || connectedIds.has(n.id);
      const r = isActive ? 5 : 3;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      const nodeColor = !dimming
        ? (isActive ? "#e0e0e0" : "#555")
        : connectedIds.has(n.id)
          ? (n.id === hoveredNode?.id ? "#fff" : isActive ? "#e0e0e0" : "#bbb")
          : "#222";

      ctx.fillStyle = nodeColor;
      ctx.fill();

      ctx.font = `${!dimming || !connectedIds.has(n.id) ? "9" : "9"}px monospace`;
      ctx.fillStyle = nodeColor;
      ctx.textAlign = "center";
      ctx.fillText(n.name, n.x, n.y - r - 4);
    }
  }

  let frame = 0;
  let simFrames = cacheValid ? 0 : 300;

  function loop() {
    if (frame < simFrames) simulate();
    if (!noCache && frame === simFrames && simFrames > 0) {
      const positions = {};
      nodes.forEach(n => { positions[n.id] = { x: n.x, y: n.y }; });
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(positions));
    }
    draw();
    frame++;
    requestAnimationFrame(loop);
  }
  loop();

  // interaction state
  let mode = null; // 'node' | 'pan' | null
  let draggedNode = null;
  let didMove = false;
  let last = { x: 0, y: 0 };

  function nodeAtMouse(mx, my) {
    return nodes.find(n => Math.sqrt((n.x - mx) ** 2 + (n.y - my) ** 2) < 8) ?? null;
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    last = { x: e.clientX, y: e.clientY };
    didMove = false;

    const hit = nodeAtMouse(mx, my);
    if (hit) {
      mode = "node";
      draggedNode = hit;
      draggedNode.pinned = true;
      canvas.style.cursor = "grabbing";
    } else {
      mode = "pan";
      canvas.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", (e) => {
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didMove = true;

    if (mode === "node" && draggedNode) {
      draggedNode.x += dx;
      draggedNode.y += dy;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    } else if (mode === "pan") {
      nodes.forEach(n => { n.x += dx; n.y += dy; });
    } else {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      hoveredNode = nodeAtMouse(mx, my);
      canvas.style.cursor = hoveredNode ? "pointer" : "default";
    }

    last = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener("mouseup", (e) => {
    if (!mode) return;

    if (!didMove) {
      // treat as click
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = nodeAtMouse(mx, my);
      if (hit) window.location.href = hit.id + ".html";
    }

    if (mode === "node" && draggedNode) {
      draggedNode.pinned = false;
      draggedNode = null;
      // re-stabilize
      frame = 0;
      simFrames = 300;
    }

    mode = null;
    canvas.style.cursor = "default";
  });

  canvas.addEventListener("mouseleave", () => {
    hoveredNode = null;
  });
}
