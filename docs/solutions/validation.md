---
title: "Validation"
description: "Every publish-time check applied to a solution package — run them locally with the build before you publish."
sidebar_label: "Validation"
---

# Validation

There are **three distinct gates**, and they do not check the same things.
Do not assume that passing an earlier one means passing a later one.

| Gate | Command / entry point | What it actually enforces |
| --- | --- | --- |
| Local dev | `qefro app validate .` | Six structural checks plus package assembly — see [What the local gate checks](#what-the-local-gate-checks) |
| Package build | `qefro solution build .` | The same assembly path (`load_package`), then checksum + signature. No schema validation |
| Publish | `POST /v1/solutions/publish` → `parse_and_validate` | The full contract: typed parsing of every section, manifest ↔ content consistency, entity and workflow semantics |

The publish gate is authoritative. A package that validates locally **is
not necessarily publishable** — the local command never calls
`parse_and_validate`, so it accepts manifests the registry will reject.
Verified by running `qefro app validate` against deliberately invalid
packages; see [Project Desk worked example](/docs/solutions/examples/project-desk-runtime).

## What the local gate checks

`qefro app validate` (`app_dev`) performs exactly these checks, in order,
and then optionally signs a package. Verbatim bail messages:

| Check | Failure string |
| --- | --- |
| `manifest.yaml` (or legacy `solution.yaml`) exists | `no manifest.yaml in {dir}` |
| Parsed YAML has an `id` | `manifest missing id` |
| `hosting` is not `managed` | `hosting: managed is not supported. Marketplace Apps use hosting: runtime. SDK connections to external systems use hosting: external.` |
| `workflows/` directory exists | `missing workflows/ directory` |
| `hosting: runtime` has `entities/` | `missing entities/ directory — hosting: runtime requires declarative entity schemas` |
| `hosting: external` has `src/` | `missing src/ directory — external SDK connections require a /qefro process` |

Assembly (`load_package`) additionally fails on:

| Check | Failure string |
| --- | --- |
| A `flows` entry has no matching `workflows/{id}.yaml` | `missing definition: {path}` |
| A `flows` object entry lacks `id` | `manifest flows entries need an id` |
| A `flows` entry is neither a string nor an object | `manifest flows must be strings or {id, file} objects` |
| `components.json` is malformed | `components.json is not valid JSON` |
| A `tool` step targets `storage/*` or `storage.*` (ADR-003) | `workflow '{id}': step targets forbidden platform storage '{tool}' (ADR-003: call app tools; persist via ctx.storage in the SDK app)` |
| A UI `source` targets platform storage (ADR-003) | `ui source '{id}': targets forbidden platform storage '{target}' (ADR-003: call app tools; persist via ctx.storage in the SDK app)` |

Anything not in those two tables — permission grammar, entity field names,
widget kinds, grid spans, setting types — is **only** checked at publish.

## The publish checklist

Every string below is the message the solution-service validator builds.
`invalid_section(section, detail)` renders as `{section}: {detail}`, and
workflow checks render as `workflow {id}: {detail}`. The tables show the
rendered form.

Each of these is a `PluginError::InvalidManifest`, so the HTTP response wraps
it as `invalid manifest: {rendered message}` with status **400** and error
code `invalid_manifest`. Checks that call `validate_package_id` directly
(step ids, action ids) return the bare message with the same 400 envelope and
no section prefix.

### Manifest

| Check | Failure message |
| --- | --- |
| `id` is kebab-case | `manifest.yaml: solution id must be kebab-case: {id}` |
| `name` non-empty | `manifest.yaml: name is empty` |
| `version` parses as semver | `manifest.yaml: version is not valid semver: {version}` |
| Connector entry has a name | `manifest.yaml: connectors[{idx}] has an empty name` |
| Connector does not use a reserved platform namespace (ADR-002/004) | `manifest.yaml: connector '{name}' collides with a reserved platform SDK namespace; use sdk.{name}.* via the platform — do not declare it as a connector` |
| Duplicate ids within any declared list | `{section}: duplicate entry: {item}` (checked for connectors, channels, flows, prompts, settings, onboarding, entities, http_tools, connections, events, capabilities, actions) |
| Capability is in the known registry | `manifest.yaml: unknown capability '{capability}'` |
| `permissions[]` entry grammar (`resource.action`) | ``invalid permission '{permission}': expected `resource.action` `` |
| Setting `type` is one of `string\|number\|boolean\|color\|url` | `manifest.yaml: setting '{key}' has unsupported type '{type}' (string \| number \| boolean \| color \| url)` |
| `hosting: managed` | `manifest.yaml: hosting: managed is not supported. Marketplace Apps must use hosting: runtime (metadata executed by Qefro Runtime). Connect an external ERP, POS, or CRM with an SDK Connection (hosting: external).` |
| `hosting: runtime` with a non-`runtime://` endpoint | `manifest.yaml: hosting: runtime must not declare an external /qefro endpoint` |
| `hosting: runtime` with no entities | `manifest.yaml: hosting: runtime requires at least one entity in entities/` |
| `hosting: external` with `tools[]` and no endpoint | `manifest.yaml: hosting: external with tools[] requires an endpoint (/qefro URL)` |
| `triggers[].id` empty / duplicate / unknown workflow | `manifest.yaml: triggers[].id must be non-empty` · `manifest.yaml: duplicate trigger id '{id}'` · `manifest.yaml: trigger '{id}' references workflow '{workflow}' not declared in flows` |

### Manifest ↔ package consistency

Both directions are checked (`require_set_match`) for `flows`, `prompts`,
`onboarding`, `entities`, `events`, `connections`, `http_tools`; `settings`
uses subset-only (`require_subset`).

| Direction | Failure message |
| --- | --- |
| Declared in manifest, absent from package | `{section}: manifest references {label} '{item}' which is missing from the package` |
| Present in package, absent from manifest | `{section}: {label} '{item}' is not referenced by the manifest` |

### Workflows

| Check | Failure message |
| --- | --- |
| Step `type` outside `KNOWN_STEP_TYPES` | `workflow {id}: unknown step type '{type}' in step '{step}'` |
| No steps | `workflow {id}: at least one step is required` |
| No `complete` step | ``workflow {id}: flow must contain a `complete` step`` |
| Step id grammar / duplicate | `step id must be kebab-case or snake_case: {id}` · `workflow {id}: duplicate step id '{step}'` |
| `next` targets an unknown step | `workflow {id}: step '{step}' points to unknown step '{next}'` |
| Tool step targets platform storage (ADR-003) | ``workflow {id}: step '{step}' targets forbidden platform storage (`{field}: {target}`) (ADR-003: call app tools; persist via ctx.storage in the SDK app)`` |
| `ask` step names an undeclared prompt | `workflows: flow '{flow}' step '{step}' references undeclared prompt '{prompt}'` |
| `onboarding` step names an undeclared connector | `onboarding: step '{id}' references connector '{connector}' not declared in the manifest` |

### Entities

| Check | Failure message |
| --- | --- |
| Field name reserved for trusted runtime context | `entities: entity '{id}' field '{name}' is reserved for trusted runtime context (metadata cannot specify workspace/tenant authority)` |
| Empty or duplicate field name | `entities: entity '{id}' has a field with an empty name` · `entities: entity '{id}' duplicate field '{name}'` |

### Widgets

| Check | Failure message |
| --- | --- |
| Closed widget kind list | `ui: widget '{id}' has unsupported type '{kind}'` |
| Widget ids unique | `ui: duplicate widget id '{id}'` |
| `source` references a declared source | `ui: widget '{id}' references undeclared source '{source}'` |
| `form` widget must not declare a source | `ui: form widget '{id}' must not declare a source` |
| `form` widget needs `options` | `ui: form widget '{id}' requires options` |
| `form` widget needs fields / sections / tabs | `ui: form widget '{id}' requires non-empty fields, sections, or tabs` |

### Pages, layouts and navigation

| Check | Failure message |
| --- | --- |
| Page needs `id` and `title` | `ui: pages require non-empty id and title` |
| Page ids unique | `ui: duplicate page id '{id}'` |
| `host` must be a known host page | `ui: page '{id}' has unsupported host '{host}' (contacts\|automations\|roles)` |
| Layout `type` must be `grid` | `ui: unsupported layout type '{kind}'` |
| `columns` between 1 and 12 | `ui: grid columns must be 1-12` |
| Placement span within 1–12 | `ui: page '{id}' widget span must be 1-12` |
| Placement names a declared widget | `ui: page '{id}' references undeclared widget '{widget}'` |
| Layout preset is declared | `ui: page '{id}' references undeclared layout preset '{id}'` |
| Nav ids unique | `ui: duplicate navigation id '{id}'` |
| Nav icon from the host set | `ui: navigation '{id}' uses icon '{icon}' outside the host icon set` |
| Nav entry points at a declared page | `ui: navigation '{id}' points at undeclared page '{page}'` |
| Route points at a declared page | `ui: route '{id}' points at undeclared page '{page}'` |

### Sources

| Check | Failure message |
| --- | --- |
| Source `type` is `runtime`, `connector` or `entity` | `ui: source '{id}' has unsupported type '{type}'` |
| Source has a non-empty `target` | `ui: source '{id}' requires a target` |
| Source must not target platform storage (ADR-003) | `ui: source '{id}' targets forbidden platform storage '{target}' (ADR-003: call app tools; persist via ctx.storage in the SDK app)` |
| Connector targets are `{connector}/{operation}` | `ui: source '{id}' connector target must be '{{connector}}/{{operation}}'` |

### Assets

| Check | Failure message |
| --- | --- |
| `ui.logo` / `ui.icon` package-relative | `ui: {label} must be a package-relative path: '{path}'` |
| `ui.logo` / `ui.icon` is an image | `ui: {label} must be an image (png/jpg/svg/webp): '{path}'` |
| No executable extension under `ui/` | `assets: executable content is not allowed in solution UIs: '{path}'` |
| Size limits per kind | `assets: '{path}' exceeds the {max} byte limit for {kind} assets` |
| Content type present | `assets: '{path}': content type is empty` |

Per-kind byte ceilings (`solution/assets.rs`): icon 2 MiB, banner 4 MiB,
README 512 KiB, other assets 8 MiB. Archive uploads are capped separately
(`solution/zip_security.rs`): 12 MiB compressed, 48 MiB uncompressed total,
4 MiB per entry. Forbidden extensions are `js`, `mjs`, `cjs`, `ts`, `tsx`,
`jsx`, `html`, `htm`, `sh`, `py`, `wasm`, `exe`, `dll`, `so`, `jar`, `php`.

### Capabilities

| Check | Detail |
| --- | --- |
| Known capability names | Unknown names rejected at publish (`unknown capability`) |
| Grant preconditions | Negotiated at **install**, not publish: `workflow.trigger` needs `workflow.execute`; `customer.query` needs `customer.read`; `connector.invoke` needs ≥ 1 declared connector; `theme.get`, `user.get`, `tenant.get`, `runtime.query` are always granted. See [Permissions and scope](/docs/solutions/permissions-and-scope) |

## Local validation loop

```bash
qefro app validate .
qefro solution build .
# then publish to a staging registry to exercise parse_and_validate
```

`qefro solution build` assembles and signs the package; it does not add any
validation beyond the assembly failures listed above. The only way to
exercise the full publish checklist locally is to run the solution-service
validator — either by publishing to a staging registry or through the
service's own test suite.

## Render-time defense

Validation does not make render-time checks redundant. The portal applies
defensive schema coercion and clamps values (spans, columns) before
render, and an error boundary degrades any broken definition to a scoped
error card. The gates have different jobs:

- **Publish-time validation** keeps bad packages out of the registry.
- **Render-time coercion** keeps the portal alive if a definition is
  degenerate.


## Related topics

- [Packaging](/docs/solutions/packaging) — what the build produces
- [Publishing](/docs/solutions/publishing) — registry-side enforcement
- [Security](/docs/solutions/security) — why the checklist exists
