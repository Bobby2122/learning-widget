export class AIProvider {
  async explainConcept(_concept, _learnerContext) {
    throw new Error("No AI provider configured");
  }

  async answerQuestion(_concept, _question, _learnerContext) {
    throw new Error("No AI provider configured");
  }

  async rankRecommendations(_candidates, _learnerContext) {
    throw new Error("No AI provider configured");
  }

  async estimateLearnerLevel(_history) {
    throw new Error("No AI provider configured");
  }
}

export function aiFeaturesAvailable(provider) {
  return provider instanceof AIProvider;
}
