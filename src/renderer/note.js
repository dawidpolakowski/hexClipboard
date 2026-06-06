/* global hexClip */

const $ = (id) => document.getElementById(id);
const noteId = Number(new URLSearchParams(location.search).get("id"));

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function relTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}

async function load() {
  document.body.className = (localStorage.getItem("theme") || "dark") + " note-window";

  const notes = await hexClip.getNotes();
  const note = notes.find((n) => n.id === noteId);
  if (!note) {
    $("noteBody").value = "Note not found.";
    $("noteBody").disabled = true;
    $("noteTitle").disabled = true;
    return;
  }

  $("noteTitle").value = note.title || "";
  $("noteBody").value = note.body || "";
  document.title = (note.title || "").trim() || "Note";
  $("noteMeta").textContent = "Edited " + relTime(note.updated);

  const save = debounce(async () => {
    await hexClip.updateNote(noteId, { title: $("noteTitle").value, body: $("noteBody").value });
    document.title = $("noteTitle").value.trim() || "Note";
    $("noteMeta").textContent = "Saved just now";
  }, 350);

  $("noteTitle").oninput = save;
  $("noteBody").oninput = save;
}

load();
