const Store = require("electron-store");

const store = new Store();

const MAX_HISTORY = 500;

function getHistory() {
  return store.get("history", []);
}

function setHistory(history) {
  store.set("history", history);
  return history;
}

// Insert a new entry at the front, de-duplicating by text and capping length.
function addToHistory(entry) {
  let history = getHistory();
  const duplicate = history.findIndex((h) => h.text === entry.text);
  if (duplicate !== -1) history.splice(duplicate, 1);
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  return setHistory(history);
}

function togglePin(id) {
  const history = getHistory();
  const item = history.find((h) => h.id === id);
  if (item) item.pinned = !item.pinned;
  return setHistory(history);
}

function deleteItem(id) {
  return setHistory(getHistory().filter((h) => h.id !== id));
}

// Clearing keeps pinned items so favourites survive.
function clearHistory() {
  return setHistory(getHistory().filter((h) => h.pinned));
}

function findItem(id) {
  return getHistory().find((h) => h.id === id);
}

module.exports = {
  MAX_HISTORY,
  getHistory,
  setHistory,
  addToHistory,
  togglePin,
  deleteItem,
  clearHistory,
  findItem,
};
