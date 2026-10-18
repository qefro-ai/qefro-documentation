---
title: "Package structure"
description: "Every file a Marketplace App may contain, how each one is discovered, what actually enters the signed artifact, and what is silently ignored."
sidebar_label: "Package structure"
---

# Package structure

A Marketplace App is a **directory of declarative files**. There is no build
output, no dependency manifest, and no source code. This page documents the
layout the platform actually reads, the exact discovery rules for each
component, and what a packaged artifact contains.

## Two assemblers, one target shape

The same directory can be assembled by two different code paths, and their
discovery rules are **not identical**. Knowing which one runs matters when a
file is missing from your package.

| Assembler | Triggered by | Rules in source |
| --- | --- | --- |
| CLI filesystem loader | `qefro app package`, `qefro solution build`, `qefro solution publish` | `services/qefro-cli/src/main.rs` `load_package` |
| ZIP assembler | `POST /v1/tenant/packages/upload` (tenant ZIP upload) | `services/solution-service/src/solution/zip_assemble.rs` |

Behavioral differences that will bite you:

| | CLI loader | ZIP assembler |
| --- | --- | --- |
| `hosting` gate | warns/bails on `managed` | accepts only `runtime`/`metadata`/`qefro_runtime`/empty; anything else is `Validation` error |
| `ui` component | assembled **only** when `manifest.ui` is an object | assembled when `manifest.ui` is an object **or** any `ui/` file exists |
| `connections/`, `tools/` | only files named by `manifest.connections[]` / `manifest.http_tools[]` | same manifest-driven lookup (`load_named_list`) |
| `onboarding/` | loaded from `onboarding/<id>.yaml` per `manifest.onboarding[]` | **`components.json` only** — `onboarding/` files are not read |
| `policies`, `channels`, `migrations` | **`components.json` only** | **`components.json` only** |
| `actions` component | never populated | hard-coded `actions: Vec::new()` (`zip_assemble.rs:173`) |

:::info Actions live in the manifest
`PublishPackageComponents.actions` exists on the wire, but neither assembler
fills it. Declare actions under `actions:` in `manifest.yaml` — that is the
only path the platform produces today.
:::

## Minimal tree

This is a complete, working Marketplace App. It validates, packages and signs
with the local CLI:

```text
minimal/
├── manifest.yaml
├── entities/
│   └── note.yaml
└── workflows/
    └── create-note.yaml
```

Nothing else is required. `ui/`, `prompts/`, `settings/`, `onboarding/`,
`policies/`, `channels/`, `tools/`, `connections/`, `migrations/` and
`assets/` are all optional, and each one is only read when the manifest
declares it.

## Complete tree

The layout a real vertical app uses (this is
[Project Desk](/docs/solutions/examples/project-desk-runtime), the worked
example in this handbook):

```text
project-desk/
├── manifest.yaml              # required — identity, declarations, permissions
├── entities/                  # required for hosting: runtime
│   ├── client.yaml
│   ├── project.yaml
│   └── task.yaml
├── workflows/                 # required (directory must exist)
│   ├── create-project.yaml
│   ├── create-task.yaml
│   ├── close-task.yaml
│   └── list-projects.yaml
├── prompts/
│   └── task-intake.yaml
├── settings/
│   └── business.yaml          # only ONE settings file is ever packaged
├── onboarding/
│   ├── connect_whatsapp.yaml
│   └── set_profile.yaml
├── ui/
│   ├── theme.yaml
│   ├── navigation.yaml
│   ├── layouts.yaml
│   ├── pages.yaml
│   ├── widgets.yaml
│   └── sources.yaml
├── tools/                     # only with manifest.http_tools[]
├── connections/               # only with manifest.connections[]
├── policies/                  # not read by either assembler (see above)
├── migrations/                # not read by either assembler
└── assets/                    # uploaded separately, never in package.json
```

## File-by-file contract

| Path | Required | Discovered by | If missing |
| --- | --- | --- | --- |
| `manifest.yaml` | **yes** | `load_manifest` | `error: manifest.yaml not found in <dir>`; local validate says `no manifest.yaml in <dir>` |
| `solution.yaml` / `manifest.json` | legacy alias | same, in order `manifest.yaml` → `solution.yaml` → `manifest.json` | `warning: solution.yaml is deprecated — rename it to manifest.yaml` |
| `workflows/<flow-id>.yaml` | for each `flows[]` entry | directory must exist, then per-id lookup | `error: missing workflows/ directory`, or `error: missing definition: <dir>/workflows/<id>.yaml` |
| `entities/<entity-id>.yaml` | for each `entities[]` entry, and `entities/` itself for `hosting: runtime` | per-id lookup | `error: missing entities/ directory — hosting: runtime requires declarative entity schemas` |
| `prompts/<prompt-id>.yaml` | for each `prompts[]` entry | per-id lookup | `error: missing definition: …/prompts/<id>.yaml` |
| `ui/theme.yaml` | no | single file | theme omitted; `navigation_layout` may still come from `manifest.ui` |
| `ui/navigation.yaml` | no | single file | `navigation: []` |
| `ui/layouts.yaml` | no | single file | `layouts: []` |
| `ui/pages.yaml` | no | single file **or** legacy `ui/pages/*.yaml` | `pages: []` |
| `ui/widgets.yaml` | no | single file **or** legacy `ui/widgets/*.yaml` | `widgets: []` |
| `ui/sources.yaml` | no | single file | `sources: []` |
| `settings/business.yaml` | no | fixed name first, else first sorted `settings/*.{yaml,yml,json}` | schema synthesized from `manifest.settings[]` as `{ settings: { … } }` |
| `onboarding/<id>.yaml` | for each `onboarding[]` entry (CLI only) | per-id lookup | `error: missing definition: …/onboarding/<id>.yaml` |
| `components.json` | no | optional overrides for `settings`/`onboarding`/`policies`/`channels`/`migrations` | those components stay empty |
| `connections/<id>.yaml` | for each `manifest.connections[]` entry | per-id lookup | empty → the `connections` key is omitted from the artifact entirely |
| `tools/<id>.yaml` | for each `manifest.http_tools[]` entry | per-id lookup, folder is `tools/` but the manifest key is `http_tools` | `http_tools` key omitted when empty |
| `assets/*` | no | **not** read by either assembler | uploaded through `POST /v1/solutions/:name/:version/assets` after publish |

### Legacy shapes still accepted

| Legacy | Replacement | Warning printed |
| --- | --- | --- |
| `solution.yaml`, `manifest.json` | `manifest.yaml` | `… is deprecated — rename it to manifest.yaml` |
| `workflows/<id>.json`, `prompts/<id>.json` | `.yaml` | `<id>.json is deprecated — convert it to YAML` |
| `prompts/prompts.json` | one file per prompt | `prompts/prompts.json is deprecated — ship prompts/<id>.yaml files` |
| `ui/pages/`, `ui/widgets/` directories | `ui/pages.yaml`, `ui/widgets.yaml` | `ui/<name>/ is deprecated — merge it into ui/<name>.yaml` |
| `ui/capabilities.yaml` | `manifest.capabilities` | `ui/capabilities.yaml is deprecated — declare capabilities in manifest.yaml` |
| `ui/routes.yaml` | derived from `ui/navigation.yaml` | `ui/routes.yaml is deprecated — routes derive from navigation.yaml` |

Deprecated shapes are **warnings, not failures**. They still package and
still publish today; they are documented as legacy in the
[support matrix](/docs/solutions/support-matrix).

## Naming and case rules

Enforced by `validate_kebab_id` / `validate_package_id` at publish
(`solution-service/src/solution/manifest.rs`):

| Identifier | Rule | Failure message |
| --- | --- | --- |
| solution `id` | kebab-case only: starts `[a-z]`, then `[a-z0-9-]` | `solution id must be kebab-case: {id}` |
| entity, workflow, step, prompt, onboarding, policy, action `id` | kebab-case **or** snake_case: starts `[a-z]`, then `[a-z0-9_-]` | `entity id must be kebab-case or snake_case: {id}` |
| workflow file | `workflows/{flow id}.yaml` unless `flows[]` gives `file:` | `missing definition: {path}` |
| entity file | `entities/{entity id}.yaml` unless `entities[]` gives `file:` | `missing definition: {path}` |
| settings file | `business.yaml` preferred; any other name is used only if it sorts first | no message — silent |
| migration names | `NNN_snake_case(.sql)`, 3-digit prefix, strictly increasing | `invalid migration name '{name}': expected NNN_snake_case(.sql)`, `migration '{name}' is out of order` |
| flow constants keys | alphanumeric + `_`, scalar values only | `constant '{key}' must be alphanumeric`, `constant '{key}' must be a scalar literal` |
| prompt variable names | lowercase-leading `[a-z0-9_]` | `prompt {id}: invalid variable name '{name}'` |

Ids are **case-sensitive** and compared as exact strings everywhere: a
manifest that declares `flows: [Create-Task]` while the file is
`create-task.yaml` fails to load, and a `flows: [create_task]` against a
`create-task.yaml` file fails the same way.

## Discovery: declared vs scanned

Only three things in a package are discovered by **directory scanning**;
everything else is **manifest-driven**, and a file that nothing declares is
never read.

| Mechanism | Applies to | Consequence |
| --- | --- | --- |
| Manifest-declared ids | `flows`, `prompts`, `entities`, `onboarding`, `connections`, `http_tools` | A file with no manifest entry is **silently excluded**. An entry with no file is a hard error. |
| Fixed-name lookup | `manifest.yaml`, `settings/business.yaml`, `ui/*.yaml` | Wrong name = the file is ignored and a fallback is used. |
| Directory scan | legacy `ui/pages/`, `ui/widgets/`, `settings/*` fallback only | Sorted by filename; in `settings/` only the **first** file wins. |

```text
# verified: entities/orphan.yaml exists, manifest declares only [note]
components.entities == ["note"]     # orphan file is not packaged, no warning
```

Multi-file rules worth memorizing:

- **`settings/`**: the loader tries `business.yaml`, `business.yml`,
  `settings.yaml`, `settings.yml` in that order; if none exists it sorts the
  directory and reads **only the first** `.yaml|.yml|.json` file. Splitting
  your schema across `settings/crm.yaml` and `settings/tax.yaml` silently
  drops one of them.
- **`ui/pages.yaml` / `ui/widgets.yaml`**: must be a YAML **list**, or the
  build fails with `ui/{name}.yaml must be a YAML list`.
- **`ui/theme.yaml`**: `navigation_layout` is *hoisted out* of the theme into
  `ui.navigation_layout` — it is a UI-bundle field, not a theme token.
- **`events`**: read from `manifest.events` verbatim; there is no `events/`
  directory.

## Path resolution across the pipeline

| Stage | Working directory | What it resolves |
| --- | --- | --- |
| local validate (`qefro app validate [dir]`) | the directory you pass | six structural checks only (see below); it assembles the package afterwards when signing keys are present |
| package (`qefro solution build`) | the same directory | each declared id → `<folder>/<id>.yaml`, or the explicit `file:` relative to the package root |
| publish (`POST /v1/solutions/publish`) | server-side, none | no filesystem access at all: it receives `{manifest, components}` JSON |
| install | catalog row | the stored version document `{manifest, components}` — files are never re-read |
| run (FlowRunner / UI) | none | capability strings and entity ids from the installed document |

`file:` overrides resolve against the package root, so
`flows: [{id: intake, file: workflows/legacy/intake.yaml}]` is valid, and the
`intake` id is what validation and the runtime use.

### The six structural checks in `qefro app validate`

`app_dev` refuses, in order, on:

1. no `manifest.yaml` (or legacy `solution.yaml`) in the directory;
2. the manifest is not parseable YAML/JSON;
3. the parsed manifest has no `id`;
4. `hosting` (or legacy `implementation_kind`) is `managed`;
5. no `workflows/` directory;
6. no `entities/` directory when `hosting: runtime`, or no `src/` directory
   otherwise.

It then prints `dev ok: {id}@{version} hosting={kind} workflows={n}`. Only
after that line, and only when `QEFRO_SIGNING_KEY_HEX`, `QEFRO_KEYS_FILE` or
the default key file is present, does it call the same `load_package` the
build uses — which is where the assembly failures and the ADR-003 storage
guard live. Nothing in this command calls the publish validator
(`parse_and_validate`), so it accepts entity fields, permission strings,
widget kinds and setting types that publish rejects. See
[Validation](/docs/solutions/validation).

## What enters the artifact

`qefro solution build` writes `dist/package.json` with exactly these top-level
keys (sorted, because the file is canonical JSON):

```json
{
  "components": { … },
  "manifest": { … },
  "publisher_id": "11111111-2222-3333-4444-555555555555",
  "signature": "<ed25519 hex>",
  "signature_kid": "k1"
}
```

Observed for a 4-flow, 3-entity app with UI, prompts, onboarding and settings:

| Component key | Populated from | Empty behavior |
| --- | --- | --- |
| `workflows` | `flows[]` → files | always present (array) |
| `prompts` | `prompts[]` → files (or `prompts/prompts.json`) | `[]` |
| `settings` | `settings/` file, else synthesized from `manifest.settings[]` | `{}` |
| `onboarding` | `onboarding/` files, else `components.json` | `[]` |
| `policies` | `components.json` only | `{}`/absent |
| `channels` | `components.json` only | `{}` |
| `migrations` | `components.json` only | `[]` |
| `ui` | `manifest.ui` object + `ui/*.yaml` | key **absent** when `manifest.ui` is not an object |
| `entities` | `entities[]` → files (raw YAML documents) | `[]` |
| `events` | `manifest.events` | `[]` |
| `connections` | `connections[]` → `connections/<id>.yaml` | key **absent** when empty |
| `http_tools` | `http_tools[]` → `tools/<id>.yaml` | key **absent** when empty |
| `actions` | — | never populated |

Raw YAML documents are stored for `entities`, `workflows`, `ui`, `events`,
`connections` and `http_tools`. That is why
runtime-only keys that have no typed field (`concurrency`, `delete.mode`,
`import_synonyms`, `date_events`, `on_events`, `views`, `computed`) still
reach the runtime — see
[Attribute inventory §3.1](/docs/solutions/attribute-inventory#31-runtime-only-entity-keys-not-on-entitydefinition).

`publisher_id` defaults to the CLI's built-in UUID unless
`QEFRO_PUBLISHER_ID` is set, and `signature_kid` is **hard-coded to `k1`** by
`build_package`. The service verifies signatures against configured public
keys and `signature_kid` is optional on the wire — when the deployed key
material is `k2`, publish succeeds only if the kid check is satisfied by
`verify_package_signature_any`, otherwise the CLI's fixed `k1` is a known
packaging limitation.

## Checksum, signature and versioning

```text
canonical JSON of { manifest, components }   # recursive key sort, compact separators
  → SHA-256 hex                              # the package checksum
  → Ed25519 over "{id}|{version}|{checksum}"  # the signature
```

Verified properties of the checksum:

- **Content-only.** Rebuilding the same directory twice produced the identical
  checksum `bfe04730…1871af`.
- **Signature is independent.** Building the same package with a throwaway
  local key kept the checksum and changed only `signature`.
- **Sensitive to inert files.** Appending an unknown top-level key
  (`role_templates:`) to a manifest changed the checksum even though no
  validator reacts to it.
- The server recomputes it in `parse_and_validate` (`package_checksum`) and
  verifies the signature over `{id}|{version}|{checksum}`, so a
  hand-edited `dist/package.json` never publishes.

Signing key sources, in priority order (`load_signing_key`):

1. `QEFRO_SIGNING_KEY_HEX` — 32 bytes hex
2. `QEFRO_KEYS_FILE` — defaults to `~/qefro/tmp/e2e-keys/prod.env`, read for
   the `REGISTRY_PRIVATE_KEY=` line
3. otherwise `qefro app validate` prints
   `(skip sign: set QEFRO_SIGNING_KEY_HEX to dry-build a signed package)`

Any valid Ed25519 key builds a package locally. Publishing requires the
matching public key to be configured server-side; publish refuses with

```text
SOLUTION_PUBLIC_KEYS is not configured, so package signatures cannot be verified;
publishing is refused in production (set SOLUTION_PUBLIC_KEYS=kid:<hex>,… to enable publish)
```

Versions are immutable catalog rows: republishing the same `id` + `version`
does not replace the stored document. Bump `version` (semver, validated by
`parse_and_validate`) for every republish.

## Unknown files and unknown keys

| You add… | Result |
| --- | --- |
| `entities/extra.yaml` with no manifest entry | silently excluded from the artifact |
| `notes/` or `README.md` at package root | ignored by the assembler |
| `src/` in a `hosting: runtime` package | ignored (only `hosting: external` requires it) |
| an unknown top-level manifest key | **no error** — dropped from the typed struct, but preserved in the stored raw manifest and counted into the checksum |
| an unknown key inside a workflow step | preserved (`#[serde(flatten)] extra`) and delivered to FlowRunner, which reads only the keys it knows |
| an unknown key inside `ui/theme.yaml` | dropped: `UiTheme` is a closed typed struct with no passthrough map |
| an executable file (`app.js`, a binary) | not read by the assembler; the publish route never sees your filesystem |

The asymmetry between *preserved raw documents* and *closed typed structs* is
the single most confusing part of packaging. It is mapped per-attribute in the
[attribute inventory](/docs/solutions/attribute-inventory).

## Common packaging mistakes

1. **Declaring an entity you never ship.** `entities: [offer]` with no
   `entities/offer.yaml` fails the build with
   `error: missing definition: …/entities/offer.yaml`.
2. **Assuming `qefro app validate` checked your metadata.** It performs six
   structural checks, prints `dev ok`, and only then assembles the package —
   so a run can print `dev ok` and still exit 1 on a missing definition. It
   never runs the publish validator.
   See [Validation](/docs/solutions/validation).
3. **Splitting `settings/` across files.** Only one file is packaged.
4. **Expecting `policies/`, `channels/`, `migrations/` directories to be
   read.** They are not; only `components.json` feeds those components.
5. **Two ids for one thing.** `flows: [create-task]`, `id: create_task`
   inside the file, and `workflows/create-task.yaml` on disk. The filename
   must match the manifest entry; the in-file `id` must match
   `validate_package_id`. The validator's `require_set_match` compares
   manifest-declared ids against the shipped flow ids, so a mismatch between
   manifest and file `id` is a publish error even when the build succeeded.
6. **Relying on `manifest.actions` execution keys that the runtime does not
   read** (`required_permission`, `target_state`, `events[]`) — see
   [Auxiliary components](/docs/solutions/auxiliary-reference#actions).
7. **Publishing without bumping `version`.** A same-version republish is
   refused, not merged. `repo/catalog.rs:220-227` catches the Postgres
   unique violation `23505` and returns HTTP **409** with code
   `solution_already_published` and message
   `solution already published: {name}@{version}`. Nothing about the existing
   catalog row changes, so tenants keep installing the original document.
   Fixing a published package always means a new version.

## Related topics

- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Packaging](/docs/solutions/packaging) — build and signing in depth
- [Validation](/docs/solutions/validation) — what each gate enforces
- [Publishing](/docs/solutions/publishing) — catalog lifecycle
- [Installation](/docs/solutions/installation) — from artifact to workspace
