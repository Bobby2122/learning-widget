# Aster STEM Learning Map

Aster is an iPhone-first interdisciplinary learning-map prototype spanning Mathematics, Physics, Computer Science, Biology, Chemistry, Economics, Data Science, and Machine Learning.

The app uses local structured knowledge and deterministic recommendations. It does not require an API key, backend, or embedded chatbot.

## Run

```bash
node server.js
```

Open `http://localhost:4173`.

## Product

- `Today`: a recommended concept with definition, explanation, examples, applications, formulas, prerequisites, cross-links, deeper concepts, notes, and external references.
- `Path`: eight subject roots, difficulty lanes, concept search, and prerequisite routes that cross subject boundaries.
- `Saved`: liked, saved, and noted concepts.
- `You`: progress and subject interests used by local recommendation rules.

## Knowledge Architecture

The catalog is defined in [`src/knowledge/catalog.js`](src/knowledge/catalog.js). It currently contains 100 concepts.

Every normalized concept includes:

- `id`, `title`, `subject`, `subjects`
- `difficulty`
- `shortDefinition`, `detailedExplanation`
- `prerequisites`, `relatedTerms`, `deeperConcepts`
- `applications`, `examples`
- `formulaTex`
- `frontierExtensions`
- `sources`

`src/data.js` is the catalog boundary consumed by the UI. This allows the source to be split into multiple files, moved to JSON, or replaced by a database later without rewriting the views.

## Recommendations

[`src/recommendation.js`](src/recommendation.js) scores concepts using prerequisite completion, path momentum, cross-subject relationships, selected interests, difficulty fit, novelty, saves, likes, notes, skips, and completion.

## Formula Rendering

Formulas are stored as TeX strings and rendered with KaTeX. If the CDN is unavailable, the original TeX remains readable as a fallback.

## Future AI Integration

[`src/services/aiProvider.js`](src/services/aiProvider.js) defines provider boundaries for:

- generated explanations
- selected-concept questions
- recommendation ranking
- learner-level estimation

No provider is configured or used yet.

## Native iOS

The current project is a responsive web app. A native SwiftUI and WidgetKit migration plan is in [`docs/IOS_WIDGET_PLAN.md`](docs/IOS_WIDGET_PLAN.md).
