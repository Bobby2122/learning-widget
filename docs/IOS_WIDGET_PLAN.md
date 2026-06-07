# iOS WidgetKit Rebuild Plan

The current Aster project is a web app. iOS Home Screen widgets are native extensions, so WidgetKit support requires rebuilding the app shell in SwiftUI.

## Native Targets

1. `AsterApp`
   - SwiftUI iPhone app.
   - No Mac destination.
   - Reads bundled concept JSON.
   - Stores user interactions, notes, and selected interests in an App Group container.

2. `AsterWidgetExtension`
   - WidgetKit extension.
   - Reads the same App Group state.
   - Shows one recommended concept or today's concept.
   - Opens the app with a deep link such as `aster://concept/gradient-descent`.

## Shared Model

Recommended Swift structs:

```swift
struct Concept: Codable, Identifiable {
    let id: String
    let title: String
    let category: String
    let level: String
    let minutes: Int
    let summary: String
    let explanation: String
    let example: String
    let why: String
    let prerequisites: [String]
    let next: [String]
    let sources: [ConceptSource]
}

struct ConceptInteraction: Codable {
    var liked: Bool
    var saved: Bool
    var understood: Bool
    var skipped: Bool
    var note: String?
}
```

## Widget Behavior

- Small widget: title, category, one-line summary, progress badge.
- Medium widget: title, category, short summary, next action affordance.
- Tap widget: `Link(destination: URL(string: "aster://concept/\(concept.id)")!)`.
- Interactive controls: use AppIntents for simple `SaveConceptIntent` and `MarkUnderstoodIntent` on iOS 17+.
- Keep notes, source links, and complex navigation inside the app.

## Recommendation Port

Port the local rules from `src/recommendation.js` into a shared Swift service:

```swift
struct RecommendationService {
    func recommendNext(state: LearnerState, concepts: [Concept]) -> Recommendation {
        // prerequisite fit + path momentum + interests + level fit + novelty
    }
}
```

The widget timeline provider should call this service and refresh a few times per day, not continuously.

## Data Sharing

Use an App Group such as:

```text
group.com.example.aster
```

Store user state in `UserDefaults(suiteName:)` or a small file in the shared container. Keep concept JSON bundled with both targets or place it in a shared Swift package.
