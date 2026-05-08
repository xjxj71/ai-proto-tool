# Plan 1 Review: Project Foundation & UI Shell

**File reviewed:** `docs/superpowers/plans/2026-05-08-project-foundation.md`
**Date:** 2026-05-08
**Reviewer:** Claude (automated review)

---

## Executive Summary

Plan 1 defines 12 tasks to scaffold a Tauri 2.x + React desktop app. The plan is well-structured with clear TDD steps, good file organization, and reasonable task sequencing. However, it contains **3 FATAL issues** that will prevent compilation, **3 SERIOUS issues** causing runtime or test failures, and several moderate/minor issues. The most critical problem is that the entire Rust command architecture (Task 5) is built on a non-existent `tauri_plugin_sql::SqlitePool` type -- the plugin's internal pool is not designed for direct Rust access via `tauri::State`.

---

## FATAL Issues (Will Not Compile or Run)

### F1. `SqlitePool` is not a public type exported by `tauri-plugin-sql`

**Location:** Lines 847, 858, 899, 912, 926, 945, 975, 987, 1040, 1057, 1085, 1109, 1127, 1191, 1203

**Description:** Every Rust IPC command uses `State<'_, SqlitePool>` with the import `use tauri_plugin_sql::SqlitePool;`. The `tauri-plugin-sql` crate does NOT export a public `SqlitePool` type for use as managed state. The plugin's internal pool (`DbPool`) is an enum variant that wraps `sqlx::SqlitePool` but is not exposed for direct Rust consumption. The plugin is designed to be invoked from the **JavaScript frontend** via `@tauri-apps/plugin-sql`, not from Rust commands via injected State.

**Impact:** All 12 Rust IPC commands in `project_commands.rs`, `page_commands.rs`, and `model_commands.rs` will fail to compile. The entire Task 5 is architecturally incorrect.

**Fix options:**
1. **Preferred:** Call the SQL plugin from the frontend JavaScript side using `Database.load("sqlite:app.db")` and execute queries there. This is how the plugin is designed to work.
2. **Alternative:** Bypass the plugin entirely. Use `sqlx::SqlitePool` directly as managed state in Tauri, managing pool creation and migrations manually. This requires adding `sqlx` as a direct dependency with `sqlite` runtime features and writing a custom setup.

---

### F2. `Builder::new()` should be `Builder::default()`

**Location:** Line 1233

**Code:**
```rust
tauri_plugin_sql::Builder::new().add_migrations("sqlite:app.db", migrations).build()
```

**Description:** The `tauri_plugin_sql::Builder` type does not implement `new()`. The correct constructor is `Builder::default()`.

**Fix:**
```rust
tauri_plugin_sql::Builder::default().add_migrations("sqlite:app.db", migrations).build()
```

---

### F3. `update_project` passes raw pool reference to `get_project` which expects `State`

**Location:** Lines 952-963 (`project_commands.rs`)

**Code:**
```rust
pub async fn update_project(
    pool: State<'_, SqlitePool>,
    id: String,
    name: String,
    description: String,
) -> Result<Project, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let pool = pool.inner();
    // ... execute UPDATE ...
    get_project(pool, id).await  // BUG: pool is &SqlitePool, get_project expects State<'_, SqlitePool>
}
```

**Description:** After `let pool = pool.inner();` on line 952, the `pool` variable is a reference to the underlying pool. On line 963, `get_project(pool, id).await` is called, but `get_project` expects `State<'_, SqlitePool>` as its first argument. This is a type mismatch that will not compile.

**Fix:** Either inline the SELECT query (same pattern as the other commands), or restructure to share a common pool reference type.

---

## SERIOUS Issues (Runtime Failures or Incorrect Behavior)

### S1. No `#[serde(rename_all = "camelCase")]` on Rust structs

**Location:** Lines 518, 529, 542 (`repository.rs` -- struct definitions)

**Description:** The Rust structs `Project`, `Page`, and `ModelConfig` use snake_case field names (e.g., `cover_image`, `canvas_preset`, `project_id`, `is_default_text`). The TypeScript types in `src/types/index.ts` (lines 346-413) use camelCase (e.g., `coverImage`, `canvasPreset`, `projectId`, `isDefaultText`). When Tauri serializes these structs to JSON via serde, the field names will be snake_case (e.g., `"cover_image"`) by default, which will not match the camelCase properties expected by the frontend.

**Impact:** All IPC command responses will produce JSON that the frontend cannot correctly consume. Properties like `project.coverImage` will be `undefined` at runtime; the actual data will be in `project.cover_image`.

**Fix:** Add `#[serde(rename_all = "camelCase")]` to each struct:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project { ... }
```

---

### S2. Migration SQL contains multiple statements -- may fail with sqlx

**Location:** Lines 468-509 (`migrations.rs`)

**Description:** The `MIGRATIONS` constant contains three `CREATE TABLE` statements separated by semicolons in a single string. The `sqlx` crate used by tauri-plugin-sql typically executes one statement per `query()` call. When the migration is executed, the multi-statement string may fail depending on how the plugin dispatches it.

**Impact:** Database initialization may fail silently or throw an error about unexpected characters after the first semicolon.

**Fix:** Either:
1. Define each migration as a separate `Migration` struct with a single SQL statement, OR
2. Verify that `tauri-plugin-sql`'s migration runner splits on semicolons (check plugin version behavior), OR
3. Use `sqlite`'s `execute_batch` if available through the plugin.

The safest approach is to split into three separate `Migration` entries with version numbers 1, 2, 3.

---

### S3. `App.test.tsx` uses `await import()` inside non-async test callback

**Location:** Lines 2590-2596 (`tests/App.test.tsx`)

**Code:**
```typescript
it("should show editor when view is set to editor", () => {  // NOT async
  const { useUiStore } = await import("@/stores/uiStore");   // await in non-async function
  useUiStore.getState().setView("editor");
  render(<App />);
  expect(screen.getByText("画板工作区")).toBeInTheDocument();
});
```

**Description:** The test callback is not declared `async`, but uses `await` on line 2591. This is a syntax error.

**Fix:**
```typescript
it("should show editor when view is set to editor", async () => {
```

Also, the dynamic `await import()` here is unnecessary since `useUiStore` is already available via static import at the top of the file (or should be). The test should use a regular import instead.

---

## MODERATE Issues

### M1. Missing `tauri.conf.json` SQL plugin preload configuration

**Location:** Task 5, Step 4 (lib.rs setup) and Step 5 (capabilities)

**Description:** The plan adds SQL plugin permissions to `capabilities/default.json` (line 1282-1296) but does not address the `tauri.conf.json` configuration. In Tauri 2.x, plugins may require registration in `tauri.conf.json` under the `plugins` section for proper initialization. While the `Builder::default().build()` approach in `lib.rs` handles plugin registration programmatically, the plan should explicitly note that no `tauri.conf.json` changes are needed for the SQL plugin (if that is the case) to avoid confusion.

---

### M2. `WelcomeScreen.tsx` uses `never` type casts instead of proper typing

**Location:** Lines 2153, 2154, 2162, 2172 (`WelcomeScreen.tsx`)

**Code:**
```typescript
setProjects(updated as never[]);
setCurrentProject(project as never);
const handleOpenProject = (project: never) => {
setProjects(updated as never[]);
```

**Description:** Multiple uses of `as never[]` and `as never` to bypass TypeScript type checking. This suppresses legitimate type errors rather than fixing them. The `invoke()` call returns `unknown`, and the correct fix is to type-narrow with `as Project[]` or `as Project` from the proper type imports.

**Fix:**
```typescript
import type { Project } from "@/types";
const project = await invoke("create_project", { ... }) as Project;
const updated = await invoke("list_projects") as Project[];
setProjects(updated);
setCurrentProject(project);
```

---

### M3. `dirs` crate name collision

**Location:** Lines 660-719 (`src-tauri/src/fs/dirs.rs`)

**Description:** The file imports `dirs::document_dir()` from the external `dirs` crate (line 665), but the module itself is also named `dirs` (`src-tauri/src/fs/dirs.rs`, referenced as `crate::fs::dirs`). Inside the module, `use std::fs;` is declared. However, the call `dirs::document_dir()` on line 665 would refer to the module itself (which has no `document_dir` function), not the external crate. The `dirs` crate must be imported with a different name or accessed via the full path.

**Fix:** Add an explicit use statement:
```rust
use ::dirs::document_dir;  // or
extern crate dirs as dirs_crate;
```
Or simply call `::dirs::document_dir()` with the fully qualified path.

---

### M4. `PathBuf` reference parameters should be `&Path`

**Location:** Lines 671, 690, 705 (`dirs.rs`) and lines 729, 737, 742 (`io.rs`)

**Code:**
```rust
pub fn initialize_app_directories(base_dir: &PathBuf) -> Result<(), String>
pub fn create_project_directories(base_dir: &PathBuf, project_id: &str) -> Result<PathBuf, String>
pub fn write_json<T: serde::Serialize>(path: &PathBuf, data: &T) -> Result<(), String>
```

**Description:** Rust convention is to accept `&Path` rather than `&PathBuf` for function parameters. `&PathBuf` works but is unnecessarily specific and not idiomatic.

**Impact:** Functional but non-idiomatic. Will trigger Clippy warnings (`clippy::ptr_arg`).

---

### M5. File structure lists `repository_test.rs` but tests are inline

**Location:** Lines 100-101 (file structure section) vs. lines 561-626 (inline tests)

**Description:** The file structure diagram lists `src-tauri/src/db/repository_test.rs` as a separate test file, but the actual implementation puts tests inline in `repository.rs` using `#[cfg(test)] mod tests { ... }`. This is inconsistent.

**Fix:** Either update the file structure diagram to remove `repository_test.rs`, or move the tests to a separate file as the structure indicates.

---

## MINOR Issues

### m1. Unused npm packages installed

**Location:** Line 241 (npm install)

**Description:** The following packages are installed but never used in any component of this plan:
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` -- drag-and-drop libraries, no usage in Plan 1
- `fabric` -- canvas library, only used in Plan 2
- `@tauri-apps/plugin-fs` -- FS plugin, no direct usage in Plan 1 frontend
- `@tauri-apps/plugin-dialog` -- dialog plugin, no direct usage in Plan 1 frontend
- `@radix-ui/react-dropdown-menu`, `@radix-ui/react-tooltip`, `@radix-ui/react-select`, `@radix-ui/react-context-menu`, `@radix-ui/react-separator` -- no usage in Plan 1

**Impact:** Increases `node_modules` size and initial install time. Not a blocking issue but adds unnecessary dependencies.

---

### m2. Task 2 commit references `tailwind.config.ts` and `postcss.config.js` that do not exist

**Location:** Line 428 (Task 2, Step 7 commit command)

**Code:**
```bash
git add ... tailwind.config.ts postcss.config.js ...
```

**Description:** The commit command stages `tailwind.config.ts` and `postcss.config.js`, but with TailwindCSS v4 via the `@tailwindcss/vite` plugin approach, these files are never created. TailwindCSS v4 uses `@import "tailwindcss"` in CSS and `@theme` blocks for customization, requiring neither a config file nor PostCSS config.

**Impact:** The `git add` command will simply skip these files (no error, just a warning). Non-blocking.

---

### m3. `npm create tauri-app@latest .` may fail in non-empty directory

**Location:** Line 133 (Task 1, Step 1)

**Description:** Running `npm create tauri-app@latest .` in the project directory which already contains `.git/`, `.claude/`, and `docs/` may fail or produce unexpected results. The scaffolding tool typically expects an empty or non-existent directory.

**Fix:** Consider using `--force` flag or creating in a temp directory and moving files. Or the plan's note "If prompted about existing files, choose to overwrite" may be sufficient for some scaffolding versions.

---

### m4. Tauri 2.x `invoke` API import path

**Location:** Lines 2144, 2169 (`WelcomeScreen.tsx`)

**Code:**
```typescript
const { invoke } = await import("@tauri-apps/api/core");
```

**Description:** Uses dynamic import with `await import()` inside event handlers. While functional, the standard approach in Tauri 2.x is a static import at the top of the file:
```typescript
import { invoke } from "@tauri-apps/api/core";
```
The dynamic import was likely chosen to avoid test failures (Tauri API not available in jsdom), but it should be mocked at the module level instead (as done in the test files).

---

### m5. `main.rs` function name `ai_proto_tool_lib::run()` depends on crate name

**Location:** Line 1268

**Description:** The `main.rs` calls `ai_proto_tool_lib::run()`, which depends on the `[lib]` name in `Cargo.toml` being exactly `ai_proto_tool_lib`. The `npm create tauri-app` template may generate a different library name (typically matching the package name). This needs to be verified after scaffolding.

---

### m6. `create_page` uses `pool.inner()` on line 993 but `pool` variable is shadowed

**Location:** Lines 993-1003 (`page_commands.rs`)

**Code:**
```rust
let pool_inner = pool.inner();
let max_order: Option<(i64,)> = sqlx::query_as(...)
    .fetch_one(pool_inner)
    .await
```

**Description:** This file correctly avoids shadowing by using `pool_inner` instead of `pool`, which is better than the pattern used in `project_commands.rs`. This inconsistency suggests the two files were written with different conventions.

---

## TDD Validity Assessment

### T1. Tests are not truly TDD for Rust backend

**Location:** Task 3, Step 3 (lines 513-627)

**Description:** The Rust "tests" in `repository.rs` only test struct serialization (serde round-trip), not actual database operations. There are no tests for the SQL queries, error handling, or IPC command behavior. True TDD for the data layer would require integration tests with an in-memory SQLite database. The plan acknowledges this implicitly (the file structure mentions `repository_test.rs` for "Rust unit tests for repository") but the actual tests are minimal serialization checks.

---

### T2. Frontend tests mock Tauri API but do not test IPC contracts

**Location:** Lines 2223-2225, 2580-2582

**Description:** All Tauri `invoke` calls are mocked with `vi.fn().mockResolvedValue([])`. This means the tests verify component rendering but not the actual IPC contract (argument shapes, response shapes). A test that verifies the correct arguments are passed to `invoke` would catch the snake_case/camelCase mismatch (S1).

---

## Tauri 2.x Specifics Assessment

### T1. Capabilities configuration is incomplete

**Location:** Lines 1282-1296

**Description:** The capabilities file includes `"sql:default"`, `"sql:allow-execute"`, and `"sql:allow-select"` but does not include `"sql:allow-load"`, which is typically needed to load a database instance. Additionally, if the frontend will call SQL directly (which is the intended use of tauri-plugin-sql), the `allow-execute` and `allow-select` permissions are for the JS API, not for Rust commands. The plan mixes two approaches without clearly committing to one.

---

### T2. No `sqlx` direct dependency in `Cargo.toml`

**Location:** Lines 443-456 (Task 3, Step 1)

**Description:** The Rust code uses `sqlx::query()` and `sqlx::query_as()` extensively, but `sqlx` is never added as a direct dependency in `Cargo.toml`. If the intent is to re-export sqlx types from `tauri-plugin-sql`, this would require `use tauri_plugin_sql::sqlx` -- but this is never shown. If `sqlx` must be a direct dependency, it needs to be added with the `sqlite` feature and `runtime-tokio` feature.

---

## Practical Issues

### P1. No error handling strategy for database initialization failures

**Location:** Task 5, Step 4 (lib.rs setup, lines 1250-1257)

**Description:** The `.setup()` closure uses `.expect()` for all initialization, which will panic on failure. While acceptable for a desktop app (crash early), there is no user-facing error message. A failed migration or directory creation will crash with a Rust panic message, not a helpful dialog.

---

### P2. No `.gitignore` updates for generated files

**Description:** The plan does not mention updating `.gitignore` to exclude `node_modules/`, `target/`, `src-tauri/target/`, or `dist/`. The initial `npm create tauri-app` generates a `.gitignore`, but the plan should verify it covers all generated directories.

---

### P3. `get_app_data_dir()` in `setup` closure vs. in commands

**Location:** Lines 1251-1255 vs. line 889

**Description:** In `lib.rs` setup (line 1251), `app.path().app_data_dir()` is used (Tauri API for app data). In `dirs.rs` (line 665), `dirs::document_dir()` is used (system Documents directory). These are different paths. The setup closure creates directories at the Tauri app data path, but the commands create project directories at the Documents path. This means the database file (`sqlite:app.db`) will be in Tauri's app data directory, while project files go to `~/Documents/AI-Prototyper/`. This may be intentional but should be documented.

---

## Issue Summary Table

| ID | Severity | Category | Line(s) | Description |
|----|----------|----------|---------|-------------|
| F1 | FATAL | Technical Accuracy | 847+ | `SqlitePool` not exported by tauri-plugin-sql |
| F2 | FATAL | Technical Accuracy | 1233 | `Builder::new()` should be `Builder::default()` |
| F3 | FATAL | Type Mismatch | 952-963 | `update_project` passes wrong type to `get_project` |
| S1 | SERIOUS | Serialization | 518-558 | Missing `#[serde(rename_all = "camelCase")]` |
| S2 | SERIOUS | Migration | 468-509 | Multi-statement SQL may fail |
| S3 | SERIOUS | Test Syntax | 2590-2596 | `await` in non-async test callback |
| M1 | MODERATE | Config | 1282-1296 | Capabilities may need `sql:allow-load` |
| M2 | MODERATE | Type Safety | 2153-2172 | `as never` type casts |
| M3 | MODERATE | Name Collision | 665 | `dirs` crate vs. `dirs` module |
| M4 | MODERATE | Idiomatic Rust | 671,690,705,729,737 | `&PathBuf` should be `&Path` |
| M5 | MODERATE | Consistency | 100-101 vs 561 | File structure mismatches actual layout |
| m1 | MINOR | Dependencies | 241 | Unused npm packages |
| m2 | MINOR | Git | 428 | Commit stages non-existent files |
| m3 | MINOR | Build | 133 | Scaffold in non-empty directory |
| m4 | MINOR | Import Style | 2144,2169 | Dynamic vs static import |
| m5 | MINOR | Naming | 1268 | Crate name dependency |
| m6 | MINOR | Consistency | 993 | Inconsistent pool variable naming |
| T1 | TDD | Coverage | 513-627 | Tests only cover serialization |
| T2 | TDD | Coverage | 2223-2225 | IPC contracts untested |
| T1 | Tauri 2.x | Config | 1282-1296 | Incomplete capabilities |
| T2 | Tauri 2.x | Dependencies | 443-456 | Missing `sqlx` direct dependency |
| P1 | Practical | Error Handling | 1250-1257 | `.expect()` panics without user message |
| P2 | Practical | Git | -- | No `.gitignore` verification |
| P3 | Practical | Architecture | 1251 vs 665 | Two different data directory paths |

---

## Recommendations

1. **Resolve F1 first** -- the entire data layer architecture depends on this. Choose either:
   - Frontend-only SQL access via `@tauri-apps/plugin-sql` (simpler, matches plugin design)
   - Direct `sqlx` integration without the plugin (more control, requires custom setup)
   
2. **Add `#[serde(rename_all = "camelCase")]`** to all Rust structs that cross the IPC boundary.

3. **Fix `App.test.tsx`** async/await syntax error.

4. **Split multi-statement migration** into separate `Migration` entries.

5. **Replace `as never` casts** with proper type assertions using imported TypeScript types.

6. **Resolve the `dirs` crate name collision** with an explicit import alias.
