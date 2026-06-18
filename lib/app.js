function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function interpolate(content, index) {
  const noteMap = {};
  index.forEach(note => { noteMap[note.name.toLowerCase()] = note.slug; });

  return content.replace(/\[\[([^\]]+)\]\]/g, (_, name) => {
    const slug = noteMap[name.toLowerCase()] ?? slugify(name);
    return `[${name}](${slug}.html)`;
  });
}

fetch("../lib/scaffold.html")
  .then(r => r.text())
  .then(html => {
    document.body.innerHTML = html;
    return Promise.all([
      fetch("../lib/index.json").then(r => r.json()),
      fetch("../lib/graph.json").then(r => r.json()),
      fetch("../" + PAGE.file).then(r => r.text()),
    ]);
  })
  .then(([index, graph, content]) => {
    // graph
    const canvas = document.getElementById("graph");
    const panel = document.getElementById("graph-panel");
    canvas.width = panel.offsetWidth;
    canvas.height = panel.offsetHeight;
    initGraph(canvas, graph, PAGE.slug);

    // sidebar
    const list = document.getElementById("file-list");
    index.forEach(note => {
      const li = document.createElement("li");
      if (note.slug === PAGE.slug) li.classList.add("active");
      li.innerHTML = `<a href="${note.slug}.html">${note.name}</a>`;
      list.appendChild(li);
    });

    // content
    document.getElementById("content-title").textContent = PAGE.name;
    document.getElementById("content-body").innerHTML = marked.parse(interpolate(content, index));

    // search
    document.getElementById("search").addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll("#file-list li").forEach(li => {
        li.style.display = li.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  });
