# Migrating to Flutter

This project was generated with Next.js and React. To rebuild the application in Flutter while keeping existing features, follow these steps.

1. **Create a new Flutter project**
   ```bash
   flutter create fintouch_flutter
   cd fintouch_flutter
   ```
2. **Add Firebase to the Flutter project**
   - Configure Firebase for Android and iOS following the [FlutterFire docs](https://firebase.flutter.dev/docs/overview). Include Authentication and Firestore.
   - Copy the Firebase configuration from `src/lib/firebase.ts` into the Flutter configuration (`google-services.json` and `GoogleService-Info.plist`).
3. **Model data structures**
   - Translate TypeScript interfaces in `src/lib/types.ts` to Dart classes.
   - Create services for authentication, Firestore reads/writes, and application state.
4. **Replicate features**
   - Build screens for login, onboarding, dashboard, categories, budgets and reports.
   - Use packages like `provider` or `riverpod` for state management.
   - Recreate audio recording and OCR features using `speech_to_text`, `image_picker`, `google_mlkit_ocr`, or equivalents.
5. **Apply style guidelines**
   - Match the colors and typography from `docs/blueprint.md`.
   - Use a responsive layout to support mobile and web.
6. **Test and iterate**
   - Validate authentication flows and database sync.
   - Ensure that all existing features work as in the React version.

This document provides an overview for a manual migration. There is no automated conversion tool from React to Flutter, so each component and page must be reimplemented in Dart using Flutter widgets.
