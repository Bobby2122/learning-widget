import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { initialState } from "../src/storage.js";
import {
  isUnlocked,
  pathStatus,
  recommendNext,
  scoreConcept
} from "../src/recommendation.js";

const concepts = JSON.parse(
  await readFile(new URL("../src/concepts.json", import.meta.url), "utf8")
);

const byId = (id) => concepts.find((concept) => concept.id === id);

test("recommendation avoids the active concept and returns backups", () => {
  const state = initialState();
  const result = recommendNext(state, concepts);
  assert.notEqual(result.primary.concept.id, state.activeConceptId);
  assert.equal(result.backups.length, 3);
  assert.ok(result.reason.length > 20);
});

test("understood concepts receive a strong ranking penalty", () => {
  const state = initialState();
  const concept = byId("systems-thinking");
  const before = scoreConcept(concept, state, concepts).total;
  state.interactions[concept.id] = { understood: true };
  const after = scoreConcept(concept, state, concepts).total;
  assert.ok(before - after >= 80);
});

test("skipped concepts are deprioritized", () => {
  const state = initialState();
  const concept = byId("systems-thinking");
  const before = scoreConcept(concept, state, concepts).total;
  state.interactions[concept.id] = { skipped: true };
  const after = scoreConcept(concept, state, concepts).total;
  assert.equal(before - after, 38);
});

test("a concept unlocks only after prerequisites are understood", () => {
  const state = initialState();
  const systems = byId("systems-thinking");
  const feedback = byId("feedback-loops");
  assert.equal(isUnlocked(systems, state), false);
  state.interactions["mental-models"] = { understood: true };
  assert.equal(isUnlocked(systems, state), true);
  assert.equal(isUnlocked(feedback, state), false);
});

test("path status reflects locked, ready, current, and understood states", () => {
  const state = initialState();
  assert.equal(pathStatus(byId("mental-models"), state), "current");
  assert.equal(pathStatus(byId("systems-thinking"), state), "locked");
  state.interactions["mental-models"] = { understood: true };
  assert.equal(pathStatus(byId("mental-models"), state), "understood");
  assert.equal(pathStatus(byId("systems-thinking"), state), "ready");
});
