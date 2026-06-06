const Store = require("electron-store");

const store = new Store();

// Standalone notes, persisted separately from clipboard history (key: "notes").
// A note is { id, title, body, created, updated }, newest-first.
function getNotes() {
  return store.get("notes", []);
}

function setNotes(notes) {
  store.set("notes", notes);
  return notes;
}

function createNote() {
  const notes = getNotes();
  const now = Date.now();
  // type: "text" | "list"; listStyle: "bullet" | "number"
  const note = { id: now, title: "", body: "", type: "text", listStyle: "bullet", created: now, updated: now };
  notes.unshift(note);
  setNotes(notes);
  return note;
}

function updateNote(id, data = {}) {
  const notes = getNotes();
  const note = notes.find((n) => n.id === id);
  if (note) {
    if (typeof data.title === "string") note.title = data.title;
    if (typeof data.body === "string") note.body = data.body;
    if (data.type === "text" || data.type === "list") note.type = data.type;
    if (data.listStyle === "bullet" || data.listStyle === "number") note.listStyle = data.listStyle;
    note.updated = Date.now();
  }
  return setNotes(notes);
}

function deleteNote(id) {
  return setNotes(getNotes().filter((n) => n.id !== id));
}

module.exports = { getNotes, createNote, updateNote, deleteNote };
