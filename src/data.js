let conceptCache = [];

export async function loadConcepts() {
  if (conceptCache.length) return conceptCache;
  const response = await fetch("/src/concepts.json");
  if (!response.ok) throw new Error("Could not load local concept data");
  conceptCache = await response.json();
  return conceptCache;
}

export function indexConcepts(concepts) {
  return new Map(concepts.map((concept) => [concept.id, concept]));
}
