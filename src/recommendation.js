const LEVEL = { Starter: 1, Growing: 2, Advanced: 3 };

function userState(state, id) {
  return state.interactions[id] || {};
}

function completedIds(state) {
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
  const completedCount = completed.size;
  const desiredLevel = completedCount < 3 ? 1 : completedCount < 7 ? 2 : 3;
  const interests = new Set(state.profile.interests || []);
  const prerequisitesMet = concept.prerequisites.every((id) => completed.has(id));
  const completedPrerequisites = concept.prerequisites.filter((id) => completed.has(id)).length;
  const followsCurrent = active?.next.includes(concept.id);
  const interestMatch = interests.has(concept.category);

  const breakdown = {
    prerequisites: prerequisitesMet ? 34 : completedPrerequisites * 5 - 28,
    pathMomentum: followsCurrent ? 24 : 0,
    interest: interestMatch ? 18 : 2,
    levelFit: Math.max(-12, 14 - Math.abs(LEVEL[concept.level] - desiredLevel) * 13),
    novelty: interaction.viewed ? -8 : 13,
    positiveSignals: (interaction.liked ? 5 : 0) + (interaction.saved ? 5 : 0) + (state.notes[concept.id] ? 4 : 0),
    skipped: interaction.skipped ? -38 : 0,
    understood: interaction.understood ? -80 : 0
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
  if (active?.next.includes(concept.id)) {
    return `Builds directly on ${active.title} while it is still fresh.`;
  }
  if ((state.profile.interests || []).includes(concept.category)) {
    return `Matches your interest in ${concept.category} and fits your current path.`;
  }
  if (concept.prerequisites.length === 0) {
    return "A useful new starting point that opens another branch of your map.";
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
