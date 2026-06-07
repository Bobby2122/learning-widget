import { indexConcepts, loadConcepts } from "./data.js";
import {
  isUnlocked,
  pathStatus,
  recommendNext,
  recommendationReason
} from "./recommendation.js";
import { loadState, resetState, saveState } from "./storage.js";

let concepts = [];
let conceptIndex = new Map();
let state = loadState();
let modal = null;
let toast = "";
let pathFilter = "All";

const iconPaths = {
  today: '<path d="M8 2v3M16 2v3M3.5 9h17M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z"/><path d="m9 15 2 2 4-5"/>',
  path: '<circle cx="6" cy="18" r="2.5"/><circle cx="12" cy="6" r="2.5"/><circle cx="18" cy="16" r="2.5"/><path d="m7.5 16 3.2-7.6M13.8 8.1l2.8 5.7"/>',
  saved: '<path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z"/>',
  you: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c.6-4.4 3-6.5 7-6.5s6.4 2.1 7 6.5"/>',
  heart: '<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  bookmark: '<path d="M6 3.5h12v17l-6-3.8-6 3.8v-17Z"/>',
  check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
  skip: '<path d="m6 5 9 7-9 7V5ZM18 5v14"/>',
  note: '<path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  arrow: '<path d="M5 12h14M14 7l5 5-5 5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v7H4V6h7"/>',
  flame: '<path d="M12 22c4 0 7-2.8 7-7.1 0-2.8-1.5-5.3-4.2-7.5.1 2.3-1 3.7-2.1 4.5.2-3.7-2-7-5.2-9.2.2 3.4-2.5 5.5-2.5 9.1C5 17.7 7.9 22 12 22Z"/>',
  reset: '<path d="M4 4v6h6M20 20v-6h-6"/><path d="M5.5 15a7 7 0 0 0 12.2 2M18.5 9A7 7 0 0 0 6.3 7"/>'
};

function icon(name, filled = false) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
}

function currentConcept() {
  return conceptIndex.get(state.activeConceptId) || concepts[0];
}

function interaction(id) {
  state.interactions[id] ||= {};
  return state.interactions[id];
}

function persist() {
  saveState(state);
}

function completedCount() {
  return Object.values(state.interactions).filter((item) => item.understood).length;
}

function progressPercent() {
  return Math.round((completedCount() / concepts.length) * 100);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shell(content) {
  const tabs = [
    ["today", "Today"],
    ["path", "Path"],
    ["saved", "Saved"],
    ["you", "You"]
  ];
  return `
    <div class="app-frame">
      <header class="app-header">
        <button class="wordmark" data-nav="today" aria-label="Open Today">
          <span class="mark">A</span><span>Aster</span>
        </button>
        <div class="streak" aria-label="${state.profile.streak} day streak">
          ${icon("flame", true)}<strong>${state.profile.streak}</strong>
        </div>
      </header>
      <main class="screen">${content}</main>
      <nav class="tab-bar" aria-label="Primary navigation">
        ${tabs.map(([id, label]) => `
          <button class="tab-item ${state.view === id ? "active" : ""}" data-nav="${id}">
            ${icon(id)}<span>${label}</span>
          </button>`).join("")}
      </nav>
      ${modal ? renderModal() : ""}
      ${toast ? `<div class="toast" role="status">${escapeHtml(toast)}</div>` : ""}
    </div>`;
}

function todayView() {
  const concept = currentConcept();
  interaction(concept.id).viewed = true;
  const recommendation = recommendNext(state, concepts);
  return shell(`
    <section class="today-intro">
      <div>
        <p class="eyebrow">Sunday's concept</p>
        <h1>Keep your map moving.</h1>
      </div>
      <div class="progress-ring" style="--progress:${progressPercent() * 3.6}deg">
        <span>${completedCount()}</span><small>learned</small>
      </div>
    </section>
    <div class="reason-strip">
      <span class="reason-dot"></span>
      <p>${escapeHtml(recommendationReason(concept, state, concepts))}</p>
    </div>
    ${conceptCard(concept, true)}
    <section class="next-up">
      <div class="section-heading">
        <div><p class="eyebrow">On your path</p><h2>Next within reach</h2></div>
        <button class="text-button" data-nav="path">View map ${icon("arrow")}</button>
      </div>
      <div class="next-scroll">
        ${[recommendation.primary, ...recommendation.backups].map(({ concept: item }) => compactCard(item)).join("")}
      </div>
    </section>
  `);
}

function conceptCard(concept, expanded = false) {
  const item = interaction(concept.id);
  const prereqs = concept.prerequisites.map((id) => conceptIndex.get(id)).filter(Boolean);
  const next = concept.next.map((id) => conceptIndex.get(id)).filter(Boolean);
  return `
    <article class="concept-card accent-${concept.accent}">
      <div class="concept-visual" aria-hidden="true">
        <div class="orbit orbit-one"></div><div class="orbit orbit-two"></div>
        <span class="visual-node node-one"></span><span class="visual-node node-two"></span><span class="visual-node node-three"></span>
        <span class="visual-label">${escapeHtml(concept.category)}</span>
      </div>
      <div class="concept-body">
        <div class="concept-meta">
          <span>${escapeHtml(concept.category)}</span>
          <span>${escapeHtml(concept.level)}</span>
          <span>${concept.minutes} min</span>
        </div>
        <h2 class="concept-title">${escapeHtml(concept.title)}</h2>
        <p class="concept-summary">${escapeHtml(concept.summary)}</p>
        <div class="quick-actions" aria-label="Concept actions">
          ${actionButton("like", "heart", "Like", item.liked)}
          ${actionButton("save", "bookmark", "Save", item.saved)}
          ${actionButton("note", "note", "Note", Boolean(state.notes[concept.id]))}
          ${actionButton("skip", "skip", "Skip", item.skipped)}
        </div>
        <div class="lesson-section">
          <p class="section-label">The idea</p>
          <p>${escapeHtml(concept.explanation)}</p>
        </div>
        <div class="example-block">
          <p class="section-label">A concrete example</p>
          <p>${escapeHtml(concept.example)}</p>
        </div>
        <div class="lesson-section">
          <p class="section-label">Why it matters</p>
          <p>${escapeHtml(concept.why)}</p>
        </div>
        ${state.notes[concept.id] ? `
          <button class="saved-note" data-action="note">
            <span>${icon("note")}</span>
            <span><small>Your note</small>${escapeHtml(state.notes[concept.id])}</span>
            ${icon("chevron")}
          </button>` : ""}
        ${relationBlock("Prerequisites", prereqs, "This branch starts here.")}
        ${relationBlock("Recommended next", next, "You have reached the end of this branch.")}
        ${sourceBlock(concept)}
        <button class="understood-button ${item.understood ? "complete" : ""}" data-action="understood">
          ${icon("check")}
          <span>${item.understood ? "Understood" : "Mark as understood"}</span>
        </button>
      </div>
    </article>
  `;
}

function actionButton(action, iconName, label, active) {
  return `<button class="icon-action ${active ? "active" : ""}" data-action="${action}" aria-label="${label}" title="${label}">
    ${icon(iconName, active)}<span>${label}</span>
  </button>`;
}

function relationBlock(label, items, emptyText) {
  return `
    <div class="lesson-section relations">
      <p class="section-label">${label}</p>
      <div class="relation-list">
        ${items.length ? items.map((item) => `
          <button data-concept="${item.id}">
            <span class="relation-mark accent-${item.accent}"></span>
            <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)}</small></span>
            ${icon("chevron")}
          </button>`).join("") : `<p class="empty-copy">${emptyText}</p>`}
      </div>
    </div>`;
}

function sourceBlock(concept) {
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(`Teach me about ${concept.title}. Use a concrete example and connect it to ${concept.category}.`)}`;
  return `
    <div class="lesson-section">
      <p class="section-label">Go deeper</p>
      <div class="source-list">
        ${concept.sources.map((source) => `
          <a href="${source.url}" target="_blank" rel="noreferrer">
            <span><small>${escapeHtml(source.type)}</small>${escapeHtml(source.label)}</span>${icon("external")}
          </a>`).join("")}
        <a href="${chatGptUrl}" target="_blank" rel="noreferrer">
          <span><small>ChatGPT</small>Explore this concept</span>${icon("external")}
        </a>
      </div>
    </div>`;
}

function compactCard(concept) {
  const status = pathStatus(concept, state);
  return `
    <button class="compact-card accent-${concept.accent}" data-concept="${concept.id}">
      <span class="compact-top"><span>${escapeHtml(concept.category)}</span><span>${concept.minutes} min</span></span>
      <strong>${escapeHtml(concept.title)}</strong>
      <small>${status === "locked" ? "Complete prerequisites first" : concept.summary}</small>
      <span class="compact-arrow">${icon("arrow")}</span>
    </button>`;
}

function pathView() {
  const categories = ["All", "AI", "Computer Science", "Data Science", "Math", "Economics", "Productivity"];
  const visible = pathFilter === "All" ? concepts : concepts.filter((concept) => concept.category === pathFilter);
  return shell(`
    <section class="page-title">
      <p class="eyebrow">${progressPercent()}% of the map</p>
      <h1>Your learning path</h1>
      <p>Each idea unlocks a useful next step.</p>
    </section>
    <div class="filter-row">
      ${categories.map((category) => `<button class="${pathFilter === category ? "active" : ""}" data-filter="${category}">${category}</button>`).join("")}
    </div>
    <section class="path-list">
      ${visible.map((concept, index) => pathNode(concept, index, visible)).join("")}
    </section>
  `);
}

function pathNode(concept, index, visible) {
  const status = pathStatus(concept, state);
  const previous = visible[index - 1];
  const connected = previous && (
    previous.next.includes(concept.id) ||
    concept.prerequisites.includes(previous.id)
  );
  return `
    <div class="path-step ${connected ? "connected" : ""}">
      <div class="path-rail">
        <span class="path-dot ${status}">${status === "understood" ? icon("check") : index + 1}</span>
      </div>
      <button class="path-card accent-${concept.accent} ${status}" data-concept="${concept.id}" ${status === "locked" ? "aria-describedby=locked-note" : ""}>
        <span class="path-card-top">
          <span>${escapeHtml(concept.category)} · ${escapeHtml(concept.level)}</span>
          <span>${status === "understood" ? "Learned" : status === "current" ? "Today" : status === "ready" ? "Ready" : "Locked"}</span>
        </span>
        <strong>${escapeHtml(concept.title)}</strong>
        <small>${escapeHtml(concept.summary)}</small>
      </button>
    </div>`;
}

function savedView() {
  const items = concepts.filter((concept) => {
    const item = interaction(concept.id);
    return item.saved || item.liked || state.notes[concept.id];
  });
  return shell(`
    <section class="page-title">
      <p class="eyebrow">${items.length} collected</p>
      <h1>Saved for later</h1>
      <p>Your useful ideas and personal notes, kept close.</p>
    </section>
    <section class="collection-list">
      ${items.length ? items.map(collectionCard).join("") : `
        <div class="empty-state">
          <span>${icon("bookmark")}</span>
          <h2>Nothing saved yet</h2>
          <p>Save a concept or add a note and it will appear here.</p>
          <button data-nav="today">Explore today's concept</button>
        </div>`}
    </section>
  `);
}

function collectionCard(concept) {
  const item = interaction(concept.id);
  return `
    <button class="collection-card" data-concept="${concept.id}">
      <span class="collection-accent accent-${concept.accent}"></span>
      <span class="collection-copy">
        <small>${escapeHtml(concept.category)} · ${item.understood ? "Learned" : "In progress"}</small>
        <strong>${escapeHtml(concept.title)}</strong>
        <span>${state.notes[concept.id] ? escapeHtml(state.notes[concept.id]) : escapeHtml(concept.summary)}</span>
      </span>
      <span class="collection-signals">
        ${item.liked ? icon("heart", true) : ""}
        ${item.saved ? icon("bookmark", true) : ""}
        ${icon("chevron")}
      </span>
    </button>`;
}

function youView() {
  const interests = ["AI", "Computer Science", "Data Science", "Math", "Economics", "Productivity"];
  const liked = Object.values(state.interactions).filter((item) => item.liked).length;
  const saved = Object.values(state.interactions).filter((item) => item.saved).length;
  return shell(`
    <section class="profile-hero">
      <div class="profile-mark">BC</div>
      <div><p class="eyebrow">Your progress</p><h1>Curiosity, mapped.</h1></div>
    </section>
    <section class="stat-grid">
      <div><strong>${completedCount()}</strong><span>understood</span></div>
      <div><strong>${state.profile.streak}</strong><span>day streak</span></div>
      <div><strong>${saved}</strong><span>saved</span></div>
      <div><strong>${liked}</strong><span>liked</span></div>
    </section>
    <section class="profile-section">
      <div class="section-heading"><div><p class="eyebrow">Recommendations</p><h2>Your interests</h2></div></div>
      <div class="interest-grid">
        ${interests.map((interest) => `
          <button class="${state.profile.interests.includes(interest) ? "active" : ""}" data-interest="${interest}">
            <span class="interest-check">${state.profile.interests.includes(interest) ? icon("check") : ""}</span>${interest}
          </button>`).join("")}
      </div>
    </section>
    <section class="profile-section">
      <p class="eyebrow">Your map</p>
      <div class="map-progress">
        <div><strong>${progressPercent()}%</strong><span>${completedCount()} of ${concepts.length} concepts</span></div>
        <div class="progress-track"><span style="width:${progressPercent()}%"></span></div>
      </div>
    </section>
    <button class="reset-button" data-reset>${icon("reset")} Reset local progress</button>
  `);
}

function renderModal() {
  if (modal.type === "note") {
    const concept = currentConcept();
    return `
      <div class="sheet-backdrop" data-close-modal>
        <section class="sheet" role="dialog" aria-modal="true" aria-label="Personal note">
          <div class="sheet-handle"></div>
          <p class="eyebrow">${escapeHtml(concept.title)}</p>
          <h2>Make it yours</h2>
          <textarea id="note-input" rows="6" placeholder="Write what you want to remember...">${escapeHtml(state.notes[concept.id] || "")}</textarea>
          <div class="sheet-actions">
            <button class="sheet-secondary" data-close-modal>Cancel</button>
            <button class="sheet-primary" data-save-note>Save note</button>
          </div>
        </section>
      </div>`;
  }

  const recommendation = modal.recommendation;
  return `
    <div class="sheet-backdrop">
      <section class="sheet recommendation-sheet" role="dialog" aria-modal="true" aria-label="Next concept">
        <div class="sheet-handle"></div>
        <div class="celebration">${icon("check")}</div>
        <p class="eyebrow">Concept understood</p>
        <h2>${escapeHtml(recommendation.primary.concept.title)} is next</h2>
        <p>${escapeHtml(recommendation.reason)}</p>
        ${compactCard(recommendation.primary.concept)}
        <div class="sheet-actions">
          <button class="sheet-secondary" data-later>Later</button>
          <button class="sheet-primary" data-start-next>Keep learning</button>
        </div>
      </section>
    </div>`;
}

function navigate(view) {
  state.view = view;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openConcept(id) {
  const concept = conceptIndex.get(id);
  if (!concept) return;
  if (!isUnlocked(concept, state) && concept.prerequisites.length) {
    const missing = concept.prerequisites
      .filter((prerequisiteId) => !interaction(prerequisiteId).understood)
      .map((prerequisiteId) => conceptIndex.get(prerequisiteId)?.title)
      .filter(Boolean);
    showToast(`Learn ${missing.join(" and ")} first`);
    return;
  }
  state.activeConceptId = id;
  state.view = "today";
  interaction(id).viewed = true;
  interaction(id).skipped = false;
  persist();
  const url = new URL(window.location.href);
  url.searchParams.set("concept", id);
  history.replaceState({}, "", url);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function handleAction(action) {
  const concept = currentConcept();
  const item = interaction(concept.id);
  if (action === "note") {
    modal = { type: "note" };
    render();
    requestAnimationFrame(() => document.querySelector("#note-input")?.focus());
    return;
  }
  if (action === "like") item.liked = !item.liked;
  if (action === "save") item.saved = !item.saved;
  if (action === "skip") {
    item.skipped = true;
    const recommendation = recommendNext(state, concepts);
    showToast("Skipped for now");
    openConcept(recommendation.primary.concept.id);
    return;
  }
  if (action === "understood") {
    item.understood = !item.understood;
    item.understoodAt = item.understood ? Date.now() : null;
    persist();
    if (item.understood) {
      modal = { type: "recommendation", recommendation: recommendNext(state, concepts) };
    }
  }
  persist();
  render();
}

function showToast(message) {
  toast = message;
  render();
  window.setTimeout(() => {
    toast = "";
    render();
  }, 2200);
}

function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => navigate(button.dataset.nav));
  });
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => handleAction(button.dataset.action));
  });
  document.querySelectorAll("[data-concept]").forEach((button) => {
    button.addEventListener("click", () => openConcept(button.dataset.concept));
  });
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      pathFilter = button.dataset.filter;
      render();
    });
  });
  document.querySelectorAll("[data-interest]").forEach((button) => {
    button.addEventListener("click", () => {
      const interest = button.dataset.interest;
      if (state.profile.interests.includes(interest)) {
        state.profile.interests = state.profile.interests.filter((item) => item !== interest);
      } else {
        state.profile.interests.push(interest);
      }
      persist();
      render();
    });
  });
  document.querySelectorAll("[data-close-modal]").forEach((element) => {
    element.addEventListener("click", (event) => {
      if (event.target === element || element.tagName === "BUTTON") {
        modal = null;
        render();
      }
    });
  });
  document.querySelector("[data-save-note]")?.addEventListener("click", () => {
    const note = document.querySelector("#note-input").value.trim();
    if (note) state.notes[state.activeConceptId] = note;
    else delete state.notes[state.activeConceptId];
    modal = null;
    persist();
    showToast(note ? "Note saved" : "Note removed");
  });
  document.querySelector("[data-later]")?.addEventListener("click", () => {
    modal = null;
    render();
  });
  document.querySelector("[data-start-next]")?.addEventListener("click", () => {
    const id = modal.recommendation.primary.concept.id;
    modal = null;
    openConcept(id);
  });
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    state = resetState();
    pathFilter = "All";
    render();
    showToast("Progress reset");
  });
}

function render() {
  const views = {
    today: todayView,
    path: pathView,
    saved: savedView,
    you: youView
  };
  document.querySelector("#app").innerHTML = (views[state.view] || todayView)();
  bindEvents();
}

async function bootstrap() {
  try {
    concepts = await loadConcepts();
    conceptIndex = indexConcepts(concepts);
    const deepLink = new URL(window.location.href).searchParams.get("concept");
    if (deepLink && conceptIndex.has(deepLink)) {
      state.activeConceptId = deepLink;
      state.view = "today";
    }
    if (!conceptIndex.has(state.activeConceptId)) state.activeConceptId = concepts[0].id;
    render();
  } catch (error) {
    document.querySelector("#app").innerHTML = `<div class="load-error"><h1>Aster could not load.</h1><p>${escapeHtml(error.message)}</p></div>`;
  }
}

bootstrap();
