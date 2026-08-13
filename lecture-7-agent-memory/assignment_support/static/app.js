const form = document.querySelector("#memory-form");
const status = document.querySelector("#form-status");
const graph = document.querySelector("#graph");
const empty = document.querySelector("#graph-empty");
const refresh = document.querySelector("#refresh");
const lookupForm = document.querySelector("#lookup-form");
const lookupResult = document.querySelector("#lookup-result");

function el(name, attrs = {}, text = "") {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  node.textContent = text;
  return node;
}

function labelFor(node) {
  return node.properties.name || node.properties.session_id || node.labels[0] || "Memory";
}

function renderGraph(payload) {
  graph.replaceChildren();
  const nodes = payload.nodes || [];
  const relationships = payload.relationships || [];
  empty.hidden = nodes.length > 0;
  if (!nodes.length) return;

  const center = { x: 500, y: 260 };
  const radius = Math.min(205, 72 + nodes.length * 12);
  const positions = new Map();
  nodes.forEach((node, index) => {
    const angle = -Math.PI / 2 + (index / nodes.length) * Math.PI * 2;
    positions.set(node.id, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });

  relationships.forEach((rel) => {
    const from = positions.get(rel.from_node);
    const to = positions.get(rel.to_node);
    if (!from || !to) return;
    graph.append(el("line", { class: "edge", x1: from.x, y1: from.y, x2: to.x, y2: to.y }));
    graph.append(el("text", { class: "edge-label", x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 8 }, rel.type));
  });

  nodes.forEach((node) => {
    const pos = positions.get(node.id);
    const group = el("g", { class: "node", transform: `translate(${pos.x} ${pos.y})` });
    group.append(el("circle", { r: 58 }));
    const title = labelFor(node);
    group.append(el("text", { y: -3 }, title.length > 18 ? `${title.slice(0, 17)}…` : title));
    group.append(el("text", { class: "type", y: 20 }, node.properties.type || node.labels[0]));
    graph.append(group);
  });
}

async function loadGraph() {
  const response = await fetch("/api/graph");
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.detail || "Graph request failed");
  renderGraph(payload);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Storing…";
  const payload = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Write failed");
    status.textContent = `Stored ${result.relationship_type}.`;
    await loadGraph();
  } catch (error) {
    status.textContent = error.message;
  }
});

lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = new FormData(lookupForm).get("name");
  try {
    const response = await fetch(`/api/neighbors/${encodeURIComponent(name)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || "Traversal failed");
    lookupResult.textContent = JSON.stringify(payload.neighbors, null, 2);
  } catch (error) {
    lookupResult.textContent = JSON.stringify({ error: error.message }, null, 2);
  }
});

refresh.addEventListener("click", () => loadGraph().catch((error) => { status.textContent = error.message; }));
loadGraph().catch((error) => { status.textContent = error.message; });
