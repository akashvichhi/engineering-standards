# Android rules: <Project name>

@../.standards/rules/kotlin-android.md

## Project-specific Android rules

Only what differs from or adds to the shared Android rules. Delete what doesn't apply.

- **Package / application ID:** <e.g. com.example.employees>
- **SDK levels:** <e.g. minSdk 29 (Android 10), because MediaStore's RELATIVE_PATH and IS_PENDING start there (decision 3); targetSdk and compileSdk 36>
- **Screens:** <e.g. employee_list, employee_detail, settings>
- **Permissions and why:** see `docs/architecture.md`
- **Foreground services:** <e.g. SyncService, type dataSync>
- **Cleartext or other security exceptions:** <e.g. none> (see `docs/decisions.md`)
