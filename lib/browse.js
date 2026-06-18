fetch("../lib/scaffold.html")
  .then(r => r.text())
  .then(html => {
    document.body.innerHTML = html;
    document.getElementById("content").remove();
    return Promise.all([
      fetch("../lib/index.json").then(r => r.json()),
      fetch("../lib/graph.json").then(r => r.json()),
    ]);
  })
  .then(([index, graph]) => {
    // sidebar
    const list = document.getElementById("file-list");
    index.forEach(note => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${note.slug}.html">${note.name}</a>`;
      list.appendChild(li);
    });

    // graph
    const canvas = document.getElementById("graph");
    const panel = document.getElementById("graph-panel");
    canvas.width = panel.offsetWidth;
    canvas.height = panel.offsetHeight;
    initGraph(canvas, graph, null, true);

    // search
    document.getElementById("search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll("#file-list li").forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  });
