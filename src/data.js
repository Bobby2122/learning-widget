import { allConcepts, SUBJECTS } from "./knowledge/catalog.js";

let conceptCache = [];

export async function loadConcepts() {
  if (!conceptCache.length) {
    conceptCache = allConcepts.map((concept) => ({
      ...concept,
      category: concept.subject,
      level: concept.difficulty[0].toUpperCase() + concept.difficulty.slice(1),
      summary: concept.shortDefinition,
      explanation: concept.detailedExplanation,
      why: concept.applications.join(" "),
      next: concept.deeperConcepts
    }));
  }
  return conceptCache;
}

export function indexConcepts(concepts) {
  return new Map(concepts.map((concept) => [concept.id, concept]));
}

export function conceptsBySubject(concepts) {
  return new Map(
    SUBJECTS.map((subject) => [
      subject,
      concepts.filter((concept) => concept.subjects.includes(subject))
    ])
  );
}

export { SUBJECTS };
