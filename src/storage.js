const KEY = "aster-learning-map-v4";
const VERSION = 4;

export function initialState() {
  return {
    version: VERSION,
    activeConceptId: "numbers",
    view: "today",
    interactions: {
      "numbers": { viewed: true }
    },
    notes: {},
    profile: {
      interests: ["Mathematics", "Computer Science", "Machine Learning"],
      streak: 3,
      lastActiveDate: new Date().toISOString().slice(0, 10)
    }
  };
}

export function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored?.version === VERSION) return stored;
  } catch {
    // A broken local snapshot should not block the app.
  }
  return initialState();
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetState() {
  const state = initialState();
  saveState(state);
  return state;
}
