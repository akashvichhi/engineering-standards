# Checklist: Kotlin Android app

Use when the change touches `android/`. Rules: `kotlin-android.md`.

## Read-only checks

```bash
# android/
./gradlew ktlintCheck detekt lintDebug testDebugUnitTest   # check tasks only, never the format task
```

## Checklist
- **Layering:** composables render and forward events; ViewModels hold one `StateFlow<UiState>` and call use cases; use cases hold the rules; repositories own data access; `platform/` components stay thin. No `Context` or `View` held by a ViewModel.
- **Dependencies:** passed through constructors and wired in the `AppContainer`; no singletons or `object` state holders inside classes; dispatchers and `Clock` injected, never `Dispatchers.IO`, `System.currentTimeMillis()`, or `Instant.now()` referenced directly.
- **Kotlin safety:** no `!!`; platform types given an explicit Kotlin type; no `Any` for domain data; explicit types on public declarations; `when` over sealed types without `else`.
- **Coroutines:** no `GlobalScope` or `runBlocking`; no disk, network, or database work on the main thread; `CancellationException` rethrown; streams handled in chunks, never loaded whole into memory.
- **UI state:** no exposed `MutableStateFlow`; state collected with `collectAsStateWithLifecycle()`; screens split into `<Screen>Route` and a stateless `<Screen>Screen`; no `LaunchedEffect` mirroring state; one-off events not lost while the screen is stopped; stable `key`s in lazy lists.
- **States and feedback:** placeholders shaped like content, error state with retry, empty state with a hint, action buttons show progress and are disabled while pending, no screen-blocking spinners, destructive actions confirm first.
- **Resources and accessibility:** user-facing text from `strings.xml` (plurals for counts); colours, type, and spacing from the theme, no hardcoded dp or hex; `contentDescription` on icon-only buttons; 48dp touch targets; no colour-only status.
- **Security and privacy:** no personal data, file names, or file contents in logs; no direct `android.util.Log` outside the logger wrapper; explicit `android:exported`; cleartext and other exceptions scoped and recorded; no secrets in the APK; immutable `PendingIntent`s; file names from outside sanitised; no `MANAGE_EXTERNAL_STORAGE`.
- **Permissions:** requested at the moment of use, denial and "don't ask again" handled, each manifest permission explained in `docs/architecture.md`.
- **Lifecycle and background:** state survives rotation (ViewModel) and process death where it matters (`SavedStateHandle`); foreground services declare their type and show a stop action; wake and Wi-Fi locks released in `finally`.
- **Persistence:** DataStore, not `SharedPreferences`; Room schema changes have a migration and a test; no `fallbackToDestructiveMigration()` in release.
- **Build:** versions only in `libs.versions.toml`, pinned; `gradle.lockfile` updated with dependency changes; keep rules commented.
- **Tests:** fakes over mocks, `runTest` with injected test dispatchers and a fixed `Clock`, assertions on the emitted `UiState`, Compose nodes found by text, content description, or role (`testTag` only as a last resort).
- **Never in the diff:** keystores, `local.properties`, `build/`, `.gradle/`, APKs or bundles.
