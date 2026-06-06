/* global hexClip */

let history = [];
let view = "list";      // "list" | "hex"
let filter = "all";     // all | text | link | code | pinned
let selected = [];      // hex view multi-selection (item ids, in selection order)

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
  const grid = $("grid");
  const wrap = grid.parentElement;

  // Pointy-top hexagon geometry — a true interlocking honeycomb (plaster grid).
  const r = 50;                       // circumradius
  const w = Math.sqrt(3) * r;         // hex width  (horizontal center spacing)
  const h = 2 * r;                    // hex height
  const vStep = 1.5 * r;              // row-to-row vertical spacing
  const pad = 10;
  const cx = w / 2, cy = h / 2;

  const avail = (wrap.clientWidth || 760) - pad * 2;
  const cols = Math.max(1, Math.floor((avail - w / 2) / w));

  let html = "";
  items.forEach((item, idx) => {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = pad + col * w + (row % 2 ? w / 2 : 0); // odd rows nestle into the gaps
    const y = pad + row * vStep;

    const flat = item.text.replace(/\s+/g, " ").trim();
    const trimmed = flat.length > 60 ? flat.slice(0, 60) + "…" : flat;
    const lines = (trimmed.match(/.{1,13}/g) || [""]).slice(0, 4);
    const startY = cy - (lines.length - 1) * 7 + 3;
    let textRows = "";
    lines.forEach((l, i) => {
      textRows += `<text x="${cx}" y="${(startY + i * 14).toFixed(1)}" text-anchor="middle" font-size="9.5">${esc(l)}</text>`;
    });

    const cls = `hex-cell${item.pinned ? " pinned" : ""}${selected.includes(item.id) ? " active" : ""}`;
    html += `<div class="${cls}" data-id="${item.id}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px">
      <svg width="${w.toFixed(1)}" height="${h.toFixed(1)}" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">
        <polygon class="hex-bg" points="${hexPoints(cx, cy, r)}" fill="${hexFill(item.type)}" fill-opacity="0.2"/>
        ${textRows}
      </svg>
    </div>`;
  });

  const totalRows = Math.ceil(items.length / cols) || 1;
  grid.style.height = (pad * 2 + totalRows * vStep + (h - vStep)).toFixed(0) + "px";
  grid.innerHTML = html;
}

// Toggle a hex cell in/out of the multi-selection.
function toggleSelect(id) {
  const i = selected.indexOf(id);
  if (i === -1) selected.push(id);
  else selected.splice(i, 1);
  syncWorkbench();
  renderDetail();
  if (view === "hex") render();
}

function clearSelection() {
  selected = [];
  $("workbenchText").value = "";
  syncWorkbench();
  renderDetail();
  render();
}

// Rebuild the bottom workbench text from the current selection.
function syncWorkbench() {
  const text = selected
    .map((id) => history.find((h) => h.id === id))
    .filter(Boolean)
    .map((it) => it.text)
    .join("\n\n");
  $("workbenchText").value = text;
  $("workbenchCount").textContent = `${selected.length} selected`;
}

// Right-side panel: lists every selected element with per-item copy/remove.
function renderDetail() {
  const detail = $("detail");
  if (!selected.length) {
    detail.innerHTML = '<div class="detail-empty">Click hex cells to<br>select &amp; gather them</div>';
    return;
  }
  let html = `<div class="detail-head">
    <span class="detail-count">${selected.length} selected</span>
    <div class="detail-head-actions">
      <button class="btn-secondary btn-sm" id="dCopyAll">Copy all</button>
      <button class="btn-secondary btn-sm" id="dClear">Clear</button>
    </div>
  </div>
  <div class="detail-list">`;
  selected.forEach((id) => {
    const it = history.find((h) => h.id === id);
    if (!it) return;
    html += `<div class="detail-item">
      <div class="detail-item-head">
        <span class="badge badge-${it.type}">${it.type}</span>
        <span class="detail-item-meta">${relTime(it.time)} · ${it.text.length} chars</span>
      </div>
      <div class="detail-item-text">${esc(it.text)}</div>
      <div class="detail-item-actions">
        <button class="btn-secondary btn-sm" data-sel-copy="${id}">Copy</button>
        <button class="btn-secondary btn-sm" data-sel-remove="${id}">Remove</button>
      </div>
    </div>`;
  });
  html += "</div>";
  detail.innerHTML = html;

  $("dCopyAll").onclick = () => hexClip.copyText($("workbenchText").value);
  $("dClear").onclick = clearSelection;
  detail.querySelectorAll("[data-sel-copy]").forEach((b) => {
    b.onclick = () => hexClip.copyItem(Number(b.dataset.selCopy));
  });
  detail.querySelectorAll("[data-sel-remove]").forEach((b) => {
    b.onclick = () => toggleSelect(Number(b.dataset.selRemove));
  });
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
    // Copy only — keep the window open (no hide/minimize).
    row.classList.add("flash");
    setTimeout(() => row.classList.remove("flash"), 450);
  }
});

window.addEventListener("resize", () => { if (view === "hex") render(); });

$("grid").addEventListener("click", (e) => {
  const cell = e.target.closest("[data-id]");
  if (cell) toggleSelect(Number(cell.dataset.id));
});

// Bottom workbench — plain editable text, copy / clear.
$("workbenchCopy").onclick = () => hexClip.copyText($("workbenchText").value);
$("workbenchClear").onclick = clearSelection;

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
  syncWorkbench();
  renderDetail();
  render();
}

init();
