# Aster Learning Map

Aster is an iPhone-first learning app prototype for discovering small, useful concepts across AI, computer science, data science, math, economics, and productivity.

This rebuild intentionally removes the standalone AI tutor, embedded chat interface, OpenAI API dependency, and recommendation backend. The product is a lightweight concept-card app built around a learning tree and local rules.

## Run

```bash
npm start
```

Open `http://localhost:4173`.

## Product Shape

- `Today`: one recommended concept card with explanation, example, why it matters, prerequisites, next recommendations, notes, actions, and deeper links.
- `Path`: a progress-oriented learning tree where concepts unlock from prerequisites.
- `Saved`: liked, saved, and noted concepts.
- `You`: local progress and interest signals used by the recommendation rules.

## Data

Concepts live in [`src/concepts.json`](src/concepts.json). Add a concept by creating a new object with:

- `id`, `title`, `category`, `level`, `minutes`
- `summary`, `explanation`, `example`, `why`
- `prerequisites`, `next`
- `sources`

## Recommendation Rules

The recommender in [`src/recommendation.js`](src/recommendation.js) is deterministic and local. It scores concepts using:

- prerequisite completion
- current path momentum
- selected interests
- level fit based on progress
- novelty
- liked, saved, and noted concepts
- skipped and understood concepts

## iOS Widget Status

This repository is a web app, not a native iOS app. A real iOS Home Screen widget requires a SwiftUI app target plus a WidgetKit extension, so it cannot be shipped directly from this codebase.

The required native rebuild plan is documented in [`docs/IOS_WIDGET_PLAN.md`](docs/IOS_WIDGET_PLAN.md).
