# Aster Product Rebuild Audit

Audit date: June 7, 2026

## Current Stack

- Dependency-free web app served by `server.js`.
- Static local concept data in `src/concepts.json`.
- Local browser persistence through `localStorage`.
- No OpenAI API key, chat endpoint, tutor fallback, or backend recommendation service.
- No Xcode project, SwiftUI target, or WidgetKit extension.

## Rebuild Result

- Removed the conversation-first tutor UI.
- Removed embedded chat and fake AI behavior.
- Removed OpenAI API configuration and server-side AI endpoints.
- Rebuilt the UI around an iPhone-first concept card flow.
- Added a learning path with prerequisite-based locking.
- Added deterministic local recommendation scoring.
- Added user actions: like, save, understood, skip, note, and external links.
- Added local static content across AI, CS, data science, math, economics, and productivity.

## Widget Finding

The current web codebase cannot realistically support a native iOS Home Screen widget. WidgetKit requires a native iOS app target and extension. The web app can be a strong product prototype and data-model source, but the widget must be rebuilt in SwiftUI.
