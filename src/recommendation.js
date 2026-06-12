const LEVEL = { beginner: 1, intermediate: 2, advanced: 3, frontier: 4 };

function userState(state, id) {
  return state.interactions[id] || {};
}

export function completedIds(state) {
  return new Set(
    Object.entries(state.interactions)
      .filter(([, value]) => value.understood)
      .map(([id]) => id)
  );
}

export function isUnlocked(concept, state) {
  const completed = completedIds(state);
  return concept.prerequisites.every((id) => completed.has(id));
}

export function scoreConcept(concept, state, concepts) {
  const interaction = userState(state, concept.id);
  const active = concepts.find((item) => item.id === state.activeConceptId);
  const completed = completedIds(state);
  const desiredLevel = Math.min(4, 1 + Math.floor(completed.size / 12));
  const interests = new Set(state.profile.interests || []);
  const prerequisitesMet = concept.prerequisites.every((id) => completed.has(id));
  const completedPrerequisites = concept.prerequisites.filter((id) => completed.has(id)).length;
  const followsCurrent = (active?.deeperConcepts || []).includes(concept.id);
  const relatesToCurrent =
    (active?.relatedTerms || []).includes(concept.id) ||
    (concept.relatedTerms || []).includes(active?.id);
  const interestMatch = concept.subjects.some((subject) => interests.has(subject));

  const breakdown = {
    prerequisites: prerequisitesMet ? 34 : completedPrerequisites * 7 - 30,
    pathMomentum: followsCurrent ? 24 : relatesToCurrent ? 10 : 0,
    interdisciplinary: active && !concept.subjects.includes(active.subject) && relatesToCurrent ? 8 : 0,
    interest: interestMatch ? 18 : 2,
    levelFit: Math.max(-16, 15 - Math.abs(LEVEL[concept.difficulty] - desiredLevel) * 12),
    novelty: interaction.viewed ? -8 : 13,
    positiveSignals: (interaction.liked ? 5 : 0) + (interaction.saved ? 5 : 0) + (state.notes[concept.id] ? 4 : 0),
    skipped: interaction.skipped ? -38 : 0,
    understood: interaction.understood ? -90 : 0
  };

  return {
    total: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    breakdown
  };
}

export function recommendNext(state, concepts) {
  const ranked = concepts
    .filter((concept) => concept.id !== state.activeConceptId)
    .map((concept) => ({ concept, score: scoreConcept(concept, state, concepts) }))
    .sort((a, b) => b.score.total - a.score.total);

  const primary = ranked[0];
  return {
    primary,
    backups: ranked.slice(1, 4),
    reason: recommendationReason(primary.concept, state, concepts)
  };
}

export function recommendationReason(concept, state, concepts) {
  const active = concepts.find((item) => item.id === state.activeConceptId);
  if ((active?.deeperConcepts || []).includes(concept.id)) {
    return `Builds directly on ${active.title} while it is still fresh.`;
  }
  if ((active?.relatedTerms || []).includes(concept.id) && active.subject !== concept.subject) {
    return `Connects ${active.subject} to ${concept.subject} through a useful shared idea.`;
  }
  if (concept.subjects.some((subject) => (state.profile.interests || []).includes(subject))) {
    return `Matches your interest in ${concept.subject} and fits your current level.`;
  }
  if (concept.prerequisites.length === 0) {
    return "A useful foundation that opens a new branch of your knowledge map.";
  }
  return "Your prerequisites are in place, so this is a natural next step.";
}

export function pathStatus(concept, state) {
  const interaction = userState(state, concept.id);
  if (interaction.understood) return "understood";
  if (concept.id === state.activeConceptId) return "current";
  if (isUnlocked(concept, state)) return "ready";
  return "locked";
}

export function learningRoute(targetId, concepts) {
  const index = new Map(concepts.map((concept) => [concept.id, concept]));
  const visited = new Set();
  const route = [];

  function visit(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const concept = index.get(id);
    if (!concept) return;
    concept.prerequisites.forEach(visit);
    route.push(concept);
  }

  visit(targetId);
  return route;
}
