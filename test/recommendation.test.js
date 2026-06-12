import test from "node:test";
import assert from "node:assert/strict";
import { allConcepts as concepts, SUBJECTS } from "../src/knowledge/catalog.js";
import { initialState } from "../src/storage.js";
import {
  isUnlocked,
  learningRoute,
  pathStatus,
  recommendNext,
  scoreConcept
} from "../src/recommendation.js";

const byId = (id) => concepts.find((concept) => concept.id === id);

test("catalog contains 80-120 complete concepts across all subjects", () => {
  assert.ok(concepts.length >= 80 && concepts.length <= 120);
  for (const subject of SUBJECTS) {
    assert.ok(concepts.some((concept) => concept.subjects.includes(subject)), subject);
  }
  for (const concept of concepts) {
    for (const key of [
      "id",
      "title",
      "subjects",
      "difficulty",
      "shortDefinition",
      "detailedExplanation",
      "prerequisites",
      "relatedTerms",
      "applications",
      "formulaTex",
      "examples",
      "deeperConcepts",
      "frontierExtensions"
    ]) {
      assert.ok(key in concept, `${concept.id} missing ${key}`);
    }
  }
});

test("recommendation avoids the active concept and returns backups", () => {
  const state = initialState();
  const result = recommendNext(state, concepts);
  assert.notEqual(result.primary.concept.id, state.activeConceptId);
  assert.equal(result.backups.length, 3);
  assert.ok(result.reason.length > 20);
});

test("understood and skipped concepts are deprioritized", () => {
  const state = initialState();
  const concept = byId("algebra");
  const before = scoreConcept(concept, state, concepts).total;
  state.interactions[concept.id] = { skipped: true };
  const skipped = scoreConcept(concept, state, concepts).total;
  assert.equal(before - skipped, 38);
  state.interactions[concept.id] = { understood: true };
  const understood = scoreConcept(concept, state, concepts).total;
  assert.ok(before - understood >= 90);
});

test("a concept unlocks only after prerequisites are understood", () => {
  const state = initialState();
  const algebra = byId("algebra");
  const functions = byId("functions");
  assert.equal(isUnlocked(algebra, state), false);
  state.interactions.numbers = { understood: true };
  assert.equal(isUnlocked(algebra, state), true);
  assert.equal(isUnlocked(functions, state), false);
});

test("path status reflects current, understood, ready, and locked states", () => {
  const state = initialState();
  assert.equal(pathStatus(byId("numbers"), state), "current");
  assert.equal(pathStatus(byId("algebra"), state), "locked");
  state.interactions.numbers = { understood: true };
  assert.equal(pathStatus(byId("numbers"), state), "understood");
  assert.equal(pathStatus(byId("algebra"), state), "ready");
});

test("heat equation route crosses mathematics and physics", () => {
  const route = learningRoute("heat-equation", concepts);
  const ids = new Set(route.map((concept) => concept.id));
  const subjects = new Set(route.flatMap((concept) => concept.subjects));
  assert.ok(ids.has("pdes"));
  assert.ok(ids.has("heat-transfer"));
  assert.ok(subjects.has("Mathematics"));
  assert.ok(subjects.has("Physics"));
});

test("diffusion model route includes the heat equation and stochastic processes", () => {
  const ids = new Set(learningRoute("diffusion-models", concepts).map((concept) => concept.id));
  assert.ok(ids.has("heat-equation"));
  assert.ok(ids.has("stochastic-processes"));
  assert.ok(ids.has("generative-models"));
});
