/* global hexClip */

let history = [];
let view = "list";      // "list" | "hex"
let filter = "all";     // all | text | link | code | pinned
let selectedId = null;  // hex view selection

const $ = (id) => document.getElementById(id);

// ── Helpers ──────────────────────────────────────────────────────────────────
function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function typeIcon(t) {
  if (t === "link") return "🔗";
  if (t === "code") return "⌥";
  return "⌨";
}

function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function hexFill(t) {
  if (t === "link") return cssVar("--link");
  if (t === "code") return cssVar("--code");
  return cssVar("--primary");
}

// ── Filtering ────────────────────────────────────────────────────────────────
function filtered() {
  const q = $("search").value.toLowerCase();
  return history.filter((h) => {
    if (filter === "pinned") return h.pinned && (!q || h.text.toLowerCase().includes(q));
    if (filter !== "all" && h.type !== filter) return false;
    return !q || h.text.toLowerCase().includes(q);
  });
}

// ── Render ───────────────────────────────────────────────────────────────────
function render() {
  const items = filtered();
  $("count").textContent = `${items.length} item${items.length !== 1 ? "s" : ""}`;
  if (view === "list") renderList(items);
  else renderHex(items);
}

function itemHTML(i) {
  const preview = i.text.replace(/\n/g, " ").slice(0, 120);
  const pin = i.pinned && filter !== "pinned" ? '<span class="pin-pill">pinned</span>' : "";
  return `<div class="item" data-id="${i.id}">
    <span class="item-icon">${typeIcon(i.type)}</span>
    <div class="item-body">
      <div class="item-text"><span class="badge badge-${i.type}">${i.type}</span>${esc(preview)}${pin}</div>
      <div class="item-meta">${relTime(i.time)} · ${i.text.length} chars</div>
    </div>
    <div class="item-actions">
      <button class="act-btn${i.pinned ? " pinned" : ""}" data-action="pin" data-id="${i.id}" title="${i.pinned ? "Unpin" : "Pin"}">📌</button>
      <button class="act-btn" data-action="del" data-id="${i.id}" title="Delete">✕</button>
    </div>
  </div>`;
}

function renderList(items) {
  const list = $("list");
  if (!items.length) {
    list.innerHTML = '<div class="empty"><span class="empty-icon">⬡</span>Nothing here yet</div>';
    return;
  }
  const pinned = items.filter((i) => i.pinned);
  const rest = items.filter((i) => !i.pinned);
  let html = "";
  if (pinned.length && filter !== "pinned") {
    html += '<div class="section-label">Pinned</div>';
    pinned.forEach((i) => (html += itemHTML(i)));
    if (rest.length) html += '<div class="section-label">Recent</div>';
  }
  (filter === "pinned" ? pinned : rest).forEach((i) => (html += itemHTML(i)));
  list.innerHTML = html;
}

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 30);
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function renderHex(items) {
  const W = 90, H = 80, cx = W / 2, cy = H / 2, r = 36;
  $("grid").innerHTML = items.map((item) => {
    const flat = item.text.replace(/\n/g, " ");
    const trimmed = flat.length > 22 ? flat.slice(0, 22) + "…" : flat;
    const lines = trimmed.match(/.{1,12}/g) || [""];
    let rows = "";
    lines.slice(0, 3).forEach((l, i) => {
      rows += `<text x="${cx}" y="${cy - 8 + i * 14}" text-anchor="middle" font-size="9">${esc(l)}</text>`;
    });
    const cls = `hex-cell${item.pinned ? " pinned" : ""}${item.id === selectedId ? " active" : ""}`;
    return `<div class="${cls}" data-id="${item.id}">
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <polygon class="hex-bg" points="${hexPoints(cx, cy, r)}" fill="${hexFill(item.type)}" fill-opacity="0.18" stroke="var(--card-border)" stroke-width="1"/>
        ${rows}
      </svg>
    </div>`;
  }).join("");
}

function showDetail(id) {
  const item = history.find((h) => h.id === id);
  const detail = $("detail");
  if (!item) {
    detail.innerHTML = '<div class="detail-empty">Select a hex cell<br>to preview</div>';
    return;
  }
  detail.innerHTML = `
    <div class="detail-type">${item.type}${item.pinned ? " · pinned" : ""}</div>
    <div class="detail-text">${esc(item.text)}</div>
    <div class="detail-meta">${relTime(item.time)} · ${item.text.length} chars</div>
    <div class="detail-actions">
      <button class="btn-primary" id="dCopy">Copy</button>
      <button class="btn-secondary" id="dPin">${item.pinned ? "Unpin" : "Pin"}</button>
      <button class="btn-secondary" id="dDel">Delete</button>
    </div>`;
  $("dCopy").onclick = () => hexClip.copyItem(id);
  $("dPin").onclick = async () => { history = await hexClip.pinItem(id); render(); showDetail(id); };
  $("dDel").onclick = async () => {
    history = await hexClip.deleteItem(id);
    selectedId = null;
    render();
    showDetail(null);
  };
}

// ── View / filter switching ──────────────────────────────────────────────────
function setView(v) {
  view = v;
  $("tabList").classList.toggle("tab-active", v === "list");
  $("tabHex").classList.toggle("tab-active", v === "hex");
  $("listView").classList.toggle("hidden", v !== "list");
  $("hexView").classList.toggle("hidden", v !== "hex");
  render();
}

// ── Theme ────────────────────────────────────────────────────────────────────
function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem("theme", theme);
  document.querySelectorAll(".options-theme-btn").forEach((b) =>
    b.classList.toggle("active", b.dataset.theme === theme));
}

// ── Wiring ───────────────────────────────────────────────────────────────────
$("tabList").onclick = () => setView("list");
$("tabHex").onclick = () => setView("hex");

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.onclick = () => {
    document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("filter-active"));
    chip.classList.add("filter-active");
    filter = chip.dataset.filter;
    render();
  };
});

$("search").addEventListener("input", render);

$("list").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (btn) {
    const id = Number(btn.dataset.id);
    if (btn.dataset.action === "pin") history = await hexClip.pinItem(id);
    if (btn.dataset.action === "del") history = await hexClip.deleteItem(id);
    render();
    return;
  }
  const row = e.target.closest("[data-id]");
  if (row) {
    const id = Number(row.dataset.id);
    await hexClip.copyItem(id);
    row.classList.add("flash");
    setTimeout(() => hexClip.windowHide(), 140);
  }
});

$("grid").addEventListener("click", (e) => {
  const cell = e.target.closest("[data-id]");
  if (cell) {
    selectedId = Number(cell.dataset.id);
    render();
    showDetail(selectedId);
  }
});

$("clearBtn").onclick = async () => { history = await hexClip.clearHistory(); render(); };

// Options panel
$("optionsBtn").onclick = (e) => { e.stopPropagation(); $("optionsPanel").classList.toggle("hidden"); };
document.addEventListener("click", (e) => {
  if (!$("optionsPanel").classList.contains("hidden") && !e.target.closest(".options-wrap")) {
    $("optionsPanel").classList.add("hidden");
  }
});

document.querySelectorAll(".options-theme-btn").forEach((b) => {
  b.onclick = () => applyTheme(b.dataset.theme);
});

function setToggle(el, on) { el.classList.toggle("options-toggle-on", on); }

$("privateToggle").onclick = async () => {
  const on = !$("privateToggle").classList.contains("options-toggle-on");
  const result = await hexClip.setPrivateMode(on);
  reflectPrivate(result);
};

$("startupToggle").onclick = async () => {
  const on = !$("startupToggle").classList.contains("options-toggle-on");
  await hexClip.setLoginItem(on);
  setToggle($("startupToggle"), on);
};

$("optionsClear").onclick = async () => { history = await hexClip.clearHistory(); render(); };
$("optionsExit").onclick = () => hexClip.windowQuit();

// About dialog
$("aboutBtn").onclick = () => { $("optionsPanel").classList.add("hidden"); $("aboutDialog").classList.remove("hidden"); };
$("aboutClose").onclick = () => $("aboutDialog").classList.add("hidden");
$("aboutDialog").onclick = (e) => { if (e.target === $("aboutDialog")) $("aboutDialog").classList.add("hidden"); };

// Window controls
$("winClose").onclick = () => hexClip.windowHide();
$("winMinimize").onclick = () => hexClip.windowMinimize();
$("winMaximize").onclick = () => hexClip.windowMaximize();

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!$("aboutDialog").classList.contains("hidden")) $("aboutDialog").classList.add("hidden");
    else hexClip.windowHide();
  }
});

// ── Private-mode reflection ──────────────────────────────────────────────────
function reflectPrivate(on) {
  setToggle($("privateToggle"), on);
  $("privateBadge").classList.toggle("hidden", !on);
}

// ── Main -> renderer events ──────────────────────────────────────────────────
hexClip.onRefresh((data) => { history = data; render(); });
hexClip.onPrivateMode((on) => reflectPrivate(on));
hexClip.onSwitchTab((tab) => setView(tab === "hex" ? "hex" : "list"));

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  applyTheme(localStorage.getItem("theme") || "dark");
  $("aboutVersion").textContent = "v" + (await hexClip.getVersion());
  reflectPrivate(await hexClip.getPrivateMode());
  setToggle($("startupToggle"), await hexClip.getLoginItem());
  history = await hexClip.getHistory();
  render();
}

init();
