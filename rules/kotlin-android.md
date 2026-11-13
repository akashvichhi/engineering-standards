# Android rules (Kotlin + Jetpack Compose)

Stack: Kotlin 2.x, Android Gradle Plugin, Jetpack Compose (Material 3), Kotlin coroutines and Flow, Jetpack ViewModel and Navigation, DataStore, Room (when a local database is needed). Examples use an `employee` entity; replace it with your own.

Read [`common.md`](common.md) first, and [`api-contract.md`](api-contract.md) when the app calls or hosts an HTTP API. These rules add to them, and override `common.md` where they say so.

---

## Paths and commands

What `common.md` refers to as "the stack rules name it":

| Item | Android |
|---|---|
| Configuration (the only place build-time values are read) | `config/AppConfig.kt`, with `local.properties.example` listing every local property |
| Time zone and display formats | `constants/TimeConstants.kt` |
| User-facing messages | `res/values/strings.xml` |
| Type checking | The Kotlin compiler with warnings as errors, plus the typing rules below |
| Money type | `BigDecimal` |
| Lock file / install | `gradle.lockfile` (Gradle dependency locking) / any Gradle build uses it |
| Tooling config files | `*.gradle.kts`, `gradle/libs.versions.toml`, `config/detekt/`, `Makefile` |
| Full check | `make check` in `android/` |
| One test class | `./gradlew testDebugUnitTest --tests "*EmployeeRepositoryTest"` |
| Never commit | `build/`, `.gradle/`, `.kotlin/`, `local.properties`, keystores (`*.jks`, `*.keystore`), `*.apk`, `*.aab` |
| Commit scope | `android` |

## Folder structure

Describe folders and their purpose, not every file, so this stays true as files are added. One Gradle module (`app`) until a second module is clearly needed.

```
android/
├── app/
│   └── src/
│       ├── main/
│       │   ├── kotlin/<package path>/
│       │   │   ├── app/         Application class, AppContainer (manual dependency wiring), MainActivity
│       │   │   ├── config/      AppConfig: the ONLY place BuildConfig and build-time values are read
│       │   │   ├── constants/   named constants, one file per domain (incl. TimeConstants)
│       │   │   ├── models/      immutable domain data classes and sealed error types. No logic
│       │   │   ├── repositories/ data access: Room, DataStore, MediaStore, files, network
│       │   │   ├── domain/      business rules: one use case per class (GetEmployeesUseCase)
│       │   │   ├── platform/    Android components: foreground services, receivers, workers. Thin; delegate to domain
│       │   │   ├── ui/
│       │   │   │   ├── theme/       Material 3 theme: colours, typography, shapes, spacing tokens
│       │   │   │   ├── components/  reusable, logic-free composables
│       │   │   │   ├── navigation/  route definitions and the NavHost
│       │   │   │   └── screens/     one package per screen: <Screen>Route, <Screen>Screen, <Screen>ViewModel, <Screen>UiState, components/
│       │   │   └── utils/       small pure functions (formatting, parsing)
│       │   ├── res/             strings, plurals, drawables, network security config
│       │   └── AndroidManifest.xml
│       ├── test/                JVM unit tests, mirrors main/
│       └── androidTest/         instrumented and Compose UI tests
├── gradle/
│   └── libs.versions.toml       version catalog: the ONLY place dependency versions are declared
├── config/detekt/               detekt configuration
├── Makefile                     the check target
└── local.properties.example     lists every local property (signing, SDK path); local.properties is never committed
```

## Naming (overrides common.md for Kotlin sources)
- **Kotlin files are `PascalCase`, named after their main declaration** (`EmployeeRepository.kt`), not snake_case. Reason: Kotlin's conventions, ktlint (`filename`), and detekt (`MatchingDeclarationName`) all require it; fighting the toolchain costs more than the consistency gains.
- **Packages (and so source folders) are lowercase with no underscores**, words joined (`ui.screens.employeelist`), per the Kotlin conventions.
- **Resources stay snake_case** (Android requires it), prefixed by kind: `ic_` icons, `img_` images; strings are `<screen>_<purpose>` (`employee_list_title`), shared ones `common_<purpose>`.
- Classes, objects, interfaces: `PascalCase`. Functions, properties, variables: `camelCase`. Constants (`const val`, top-level or in `object`s): `UPPER_SNAKE_CASE`.
- Layer suffixes, so editor tabs never show five files called `Employee.kt`: `EmployeeRepository`, `GetEmployeesUseCase`, `EmployeeListViewModel`, `EmployeeListUiState`, `EmployeeListScreen`.
- Composables are `PascalCase` nouns and return `Unit`. Functions that return a value are `camelCase`.
- Tests: `<Class>Test.kt`; functions in backticks named after the behaviour: `` `create employee rejects duplicate email`() ``.

## Layer responsibilities

| Layer | Does | NEVER does |
|---|---|---|
| Composable (`ui/`) | Renders state, forwards user events as callbacks | Business rules, repository or Android API calls, launching coroutines for work |
| ViewModel | Holds screen state, turns events into use-case calls, maps results to UI state | Android `Context`/`View` references, direct repository access when a rule applies, navigation side effects stored as state |
| Use case (`domain/`) | Business rules (validation, uniqueness, existence), orchestration | UI concerns, Android framework types other than plain data |
| Repository | Data access: queries, files, MediaStore, DataStore, network; maps storage types to models | Business decisions |
| Platform component (`platform/`) | Android lifecycle glue: starts or stops work, shows the required notification | Business rules (delegates to use cases) |
| Model | Immutable data (`data class`, `sealed interface`) | Logic |

- Dependencies are passed through constructors and wired in **one** `AppContainer` created by the `Application` class. **NEVER** reach for singletons, `object` state holders, or a service locator inside classes. Add a DI framework (Hilt) only when the container clearly stops scaling, with a decision entry.
- ViewModels get their dependencies through a `ViewModelProvider.Factory` (`viewModelFactory { initializer { ... } }`) that reads from the container.
- Expected failures (not found, duplicate, permission denied, storage full) are **sealed types** returned by use cases (`sealed interface EmployeeError`). Exceptions are for the unexpected; the ViewModel is the boundary that catches them and shows a generic error.

## Kotlin and typing
- **Explicit types on every public and internal declaration:** function return types, properties, and constructor parameters. Local `val`s may use inference when the type is obvious from the right-hand side.
- **NEVER** use `!!`. Handle `null` with `?.`, `?:`, early returns, or `requireNotNull` with a message at a true invariant.
- **NEVER** use `Any` (or `Map<String, Any>`) for domain data; give it a data class.
- Java and Android APIs return platform types: give them an explicit Kotlin type at the call site, so nullability is decided once.
- Prefer `val` and read-only collections (`List`, not `MutableList`) in public signatures and in UI state.
- `lateinit` only for test fixtures. `when` over sealed types has no `else` branch, so a new case fails to compile.

## Coroutines and threading
- Structured concurrency only: `viewModelScope`, `lifecycleScope`, or a scope owned by an injected component. **NEVER** `GlobalScope`; **NEVER** `runBlocking` in app code.
- **Inject dispatchers** (an `AppDispatchers` holder with `io`, `default`, `main`), never reference `Dispatchers.IO` directly in classes. Tests replace them with a test dispatcher.
- Repositories switch to the IO dispatcher themselves (`withContext(dispatchers.io)`), so callers are main-safe. **NEVER** do disk, network, or database work on the main thread.
- Never swallow `CancellationException`: catching `Exception` in a coroutine rethrows it, so cancellation still works.
- Long-running streams (files, sockets) are read and written in chunks with a fixed buffer size from constants, never loaded whole into memory.

## UI state (Compose + ViewModel)
- Each ViewModel exposes **one** `StateFlow<<Screen>UiState>` (an immutable data class, or a sealed `Loading` / `Content` / `Empty` / `Error`), plus plain functions for user events. **NEVER** expose `MutableStateFlow` or several independent flows a screen must combine.
- One-off events (navigate, show a snackbar) are modelled as state the screen consumes and acknowledges, or as a `Channel` received in a lifecycle-aware effect. **NEVER** a `SharedFlow` that drops events while the screen is stopped.
- Screens are split in two: `<Screen>Route` (gets the ViewModel, collects state with `collectAsStateWithLifecycle()`, passes callbacks) and a **stateless** `<Screen>Screen(state, onEvent...)` that previews and tests can render without a ViewModel.
- Hoist state: composables take values and callbacks; only purely visual state (an expanded menu, scroll) lives in `remember`. State that must survive process death goes in `SavedStateHandle`.
- Every reusable composable takes `modifier: Modifier = Modifier` as its first optional parameter and applies it to its root.
- Derive values instead of storing them; no `LaunchedEffect` that copies one state into another. Effects use correct keys and clean up in `DisposableEffect`.
- Lists use `LazyColumn` / `LazyRow` with stable `key`s (IDs), never indexes for lists that change.
- Every screen and reusable component has a `@Preview` for its main states (content, empty, error), using fake data from the test or preview fixtures.

| Used by | Package |
|---|---|
| One screen only | `ui/screens/<screen>/components/` |
| 2+ screens | `ui/components/` (moved there when the second screen needs it; **NEVER** copied or imported across screen packages) |

## Loading and feedback

| Situation | Shown as |
|---|---|
| App start, while required state loads | The splash screen API only. **NEVER** a custom splash activity |
| A screen loading data | A placeholder shaped like the content |
| Refreshing data that is already shown | Keep the content visible with a pull-to-refresh or subtle progress indicator |
| An action (save, delete, send) | That button only shows progress and is disabled while pending |
| A long operation the user waits for (a transfer) | Determinate progress with a cancel action |

- **NEVER** block the whole screen with a spinner for a query or action.
- Every action reports success or failure (snackbar or inline), with texts from string resources.
- Destructive actions confirm first, naming the item.
- A failed load shows an error state with a retry; an empty result shows an empty state with a hint.

## Resources, theme, and accessibility
- **All user-facing text lives in `res/values/strings.xml`** (with `plurals` for counts), read through `stringResource`. **NEVER** hardcode a user-facing string in Kotlin. This replaces common.md's "messages constants" on Android.
- Colours, typography, and shapes come from `MaterialTheme`; spacing comes from the theme's spacing tokens (a 4dp scale). **NEVER** hardcode colours or dp values in screens; allowed literals: `0.dp`, `1.dp` borders, weights, and fractions. If no token fits, add one to the theme.
- Support light and dark themes from the start; dynamic colour is optional.
- Icon-only buttons have a `contentDescription` from strings; decorative images pass `null`. Touch targets are at least 48dp. Status is never shown by colour alone. Text scales with the system font size (no fixed-height text containers).

## Configuration, security, and privacy
- Build-time values (`BuildConfig` fields, flavour flags) are read only in `config/AppConfig.kt`. Local signing settings come from `local.properties` or environment variables; **NEVER** commit keystores, `local.properties`, or signing passwords.
- **Anything in the APK is public.** It can be decompiled; **NEVER** ship secrets (API keys with write access, private keys) in code, resources, or `BuildConfig`.
- **Logging:** one `AppLogger` wrapper. **NEVER** log personal data, file names, or file contents (see common rules). Debug logs are compiled out of release builds; **NEVER** call `android.util.Log` directly outside the wrapper.
- **Manifest:** every component sets `android:exported` explicitly; only the launcher activity and components that must be reachable are exported. `android:allowBackup` and data-extraction rules are decided explicitly, with personal data excluded.
- **Cleartext traffic** is off by default (`network_security_config.xml`). Any exception is scoped as narrowly as possible and recorded in `docs/decisions.md`.
- **Permissions:** request only what a feature needs, at the moment it is used, with a rationale when Android says to show one; handle "denied" and "don't ask again" with a clear path to settings. Every permission in the manifest gets a one-line reason in `docs/architecture.md`.
- **Storage:** shared files go through MediaStore or the Storage Access Framework. **NEVER** request `MANAGE_EXTERNAL_STORAGE`. Temporary files live in the app's cache directory and are deleted when done. File names from outside the app are sanitised (no path separators, no `..`, length-limited) before use.
- **Intents:** validate data from incoming intents; use explicit intents for in-app components; `PendingIntent`s are `FLAG_IMMUTABLE` unless mutability is required.

## Data, time, and persistence
- Time comes from an injected `java.time.Clock` and the zone in `constants/TimeConstants.kt`. **NEVER** call `System.currentTimeMillis()`, `Instant.now()`, or `LocalDate.now()` without the clock, and **NEVER** depend on the device's default zone for business logic.
- Money uses `BigDecimal` (see common rules); display uses `NumberFormat` with the app's locale constant.
- Preferences use **DataStore**. **NEVER** `SharedPreferences` in new code.
- Room (when used): `exportSchema = true`, schemas committed, every schema change has a `Migration` with a test. **NEVER** `fallbackToDestructiveMigration()` in release builds.
- Background work: a foreground service declares its `foregroundServiceType` and the matching permission, and shows an ongoing notification with a stop action; deferrable work uses WorkManager. Wake and Wi-Fi locks are held only while work runs and always released in `finally`.

## Build and dependencies
- Versions live only in `gradle/libs.versions.toml`, pinned exactly. **Dependency locking** is enabled and `gradle.lockfile` files are committed (common.md's lock-file rule).
- The Gradle wrapper is committed with `distributionSha256Sum` set.
- `minSdk`, `targetSdk`, and `compileSdk` are set once in the app's build file; the project's `CLAUDE.md` states them and the reason for `minSdk`.
- Release builds: R8 minification and resource shrinking on. Every keep rule has a comment saying why it exists.
- Ship an Android App Bundle (`.aab`) to the Play Store.

## Testing
- **Unit tests (JVM, `test/`)** for use cases, repositories (with fakes or an in-memory Room database), ViewModels, and utils. Use `kotlinx-coroutines-test` (`runTest`, a test dispatcher injected through `AppDispatchers`) and a fixed `Clock`.
- **Prefer fakes over mocks.** Mock only at true boundaries you don't own and can't fake cheaply.
- ViewModel tests assert on the emitted `UiState` sequence, not on internals.
- **Compose UI tests (`androidTest/`)** render the stateless `<Screen>Screen` with fake state, and find nodes by text, content description, or role, as a user would. `testTag` only when no user-visible handle exists.
- Each test builds its own data with factories in the test source set. Tests never depend on each other, the device's clock, or the network.

## Tooling
- **ktlint** for formatting (Kotlin conventions, ktlint `filename` rule), **detekt** for static analysis (including `!!`, `GlobalScope`, magic numbers, complexity), **Android Lint** with warnings as errors, **Kover** for coverage.
- `android/Makefile`: `check` runs ktlint (format), detekt, Android Lint, the unit tests, and the Kover verification at the project threshold (default 90%). The threshold lives in the check target, not in the default test task, so a single test class runs without failing on coverage.
- Config templates for Android (`Makefile`, detekt config, version catalog) are added to the engineering-standards `templates/android/` once they've been tested in a project, with their tested versions in a header comment.
