/* global hexClip */

const $ = (id) => document.getElementById(id);
const noteId = Number(new URLSearchParams(location.search).get("id"));
const LS_SIZE = `note-${noteId}-size`;
const LS_LOCK = `note-${noteId}-locked`;

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const escAttr = (s) => esc(s).replace(/'/g, "&#39;");

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function noteLines(body) {
  return (body || "").split("\n").map((l) => l.trim()).filter(Boolean);
}

// Plain-text form of a note (used by the Copy button).
function noteToText(note) {
  if (!note) return "";
  if (note.type !== "list") return note.body || "";
  return noteLines(note.body)
    .map((l, i) => (note.listStyle === "number" ? `${i + 1}. ${l}` : `• ${l}`))
    .join("\n");
}

let current = null;
let locked = localStorage.getItem(LS_LOCK) === "1";

function renderContent() {
  const c = $("stickyContent");
  if (!current) {
    c.innerHTML = '<div class="sticky-empty">This note no longer exists.</div>';
    return;
  }
  if (locked) {
    // Read-only reference render.
    if (current.type === "list") {
      const lines = noteLines(current.body);
      const tag = current.listStyle === "number" ? "ol" : "ul";
      const cls = current.listStyle === "number" ? "number" : "bullet";
      c.innerHTML = lines.length
        ? `<${tag} class="sticky-list ${cls}">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</${tag}>`
        : '<div class="sticky-empty">Empty note</div>';
    } else {
      const text = (current.body || "").trim();
      c.innerHTML = text ? `<pre class="sticky-text">${esc(text)}</pre>` : '<div class="sticky-empty">Empty note</div>';
    }
    return;
  }
  // Editable.
  c.innerHTML = `
    <input id="edTitle" class="sticky-edit-title" placeholder="Title" spellcheck="false" value="${escAttr(current.title || "")}" />
    <textarea id="edBody" class="sticky-edit-body" placeholder="${current.type === "list" ? "One item per line…" : "Write…"}" spellcheck="false">${esc(current.body || "")}</textarea>`;
  const save = debounce(async () => {
    await hexClip.updateNote(noteId, { title: $("edTitle").value, body: $("edBody").value });
    current.title = $("edTitle").value;
    current.body = $("edBody").value;
    const t = current.title.trim() || "Untitled note";
    $("stickyTitle").textContent = t;
    document.title = t;
  }, 350);
  $("edTitle").oninput = save;
  $("edBody").oninput = save;
}

function applyLockUI() {
  document.body.classList.toggle("locked", locked);
  $("lock").textContent = locked ? "🔒" : "🔓";
  $("lock").classList.toggle("active", locked);
  $("lock").title = locked ? "Unlock (editable, movable)" : "Lock (read-only, pinned on top)";
}

async function setLocked(next) {
  // When locking from edit mode, flush the current values first.
  if (next && !locked && $("edTitle")) {
    await hexClip.updateNote(noteId, { title: $("edTitle").value, body: $("edBody").value });
    current.title = $("edTitle").value;
    current.body = $("edBody").value;
  }
  locked = next;
  localStorage.setItem(LS_LOCK, locked ? "1" : "0");
  await hexClip.noteSetLock(locked);
  applyLockUI();
  renderContent();
}

// Size the window to the minimum needed for its text (first open only).
function fitToContent() {
  const header = document.querySelector(".sticky-bar").offsetHeight;
  let bodyH;
  const ta = $("edBody");
  if (ta) { ta.style.height = "auto"; bodyH = ta.scrollHeight; }
  else bodyH = $("stickyContent").scrollHeight;
  const maxH = Math.floor((window.screen.availHeight || 800) * 0.7);
  const h = Math.min(maxH, Math.max(150, header + bodyH + 28));
  hexClip.noteSetSize(300, h);
}

function restoreSize() {
  const saved = localStorage.getItem(LS_SIZE);
  if (!saved) return false;
  try {
    const { w, h } = JSON.parse(saved);
    if (w && h) { hexClip.noteSetSize(w, h); return true; }
  } catch { /* ignore bad JSON */ }
  return false;
}

async function load() {
  document.body.className = (localStorage.getItem("theme") || "dark") + " note-window";
  const notes = await hexClip.getNotes();
  current = notes.find((n) => n.id === noteId) || null;
  const title = current ? ((current.title || "").trim() || "Untitled note") : "Note not found";
  $("stickyTitle").textContent = title;
  document.title = title;
  applyLockUI();
  renderContent();
  await hexClip.noteSetLock(locked);
  if (!restoreSize()) fitToContent();
}

$("dockLeft").onclick = () => hexClip.noteDock("left");
$("dockRight").onclick = () => hexClip.noteDock("right");
$("copy").onclick = () => hexClip.copyText(noteToText(current));
$("hide").onclick = () => hexClip.noteClose();
$("lock").onclick = () => setLocked(!locked);

// Remember the window size after a manual resize (won't fire while locked).
const saveSize = debounce(() => {
  localStorage.setItem(LS_SIZE, JSON.stringify({ w: window.innerWidth, h: window.innerHeight }));
}, 300);
window.addEventListener("resize", saveSize);

// While locked (read-only), refresh from disk on focus to reflect edits made elsewhere.
window.addEventListener("focus", async () => {
  if (!locked) return;
  const notes = await hexClip.getNotes();
  current = notes.find((n) => n.id === noteId) || current;
  const title = current ? ((current.title || "").trim() || "Untitled note") : "Note not found";
  $("stickyTitle").textContent = title;
  document.title = title;
  renderContent();
});

load();
