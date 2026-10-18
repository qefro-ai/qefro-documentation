---
title: "Settings reference"
description: "The tenant-configurable values a Marketplace App may declare: where the schema lives, every type and attribute, the exact validation rules, and which runtime component reads each key."
sidebar_label: "Settings reference"
---

# Settings reference

Settings are the **only** way a metadata-only Marketplace App varies its
behaviour per tenant without shipping code. A package declares a schema; the
tenant fills in values; the platform stores the values per workspace and hands
them to a small, fixed set of readers.

Nothing else is configurable per tenant. There is no per-app `.env`, no secret
store in the package, no hook, and no way for a workflow to read a setting that
nothing reads for it.

```text
settings/business.yaml            (your schema — one file)
  → SettingsSchema::from_value    (parsed)
  → require_subset vs manifest    (validated at publish)
  → solution_settings rows        (persisted per version)
  → plan_install / update_settings (tenant values validated + defaults merged)
  → tenant_settings rows          (persisted per workspace)
  → chat context → named readers (consumed)
```

## The five facts that matter most

1. **`settings/business.yaml` is the schema.** `manifest.settings[]` is a
   *list of keys the manifest is allowed to reference*, not the schema itself —
   see [Two declaration surfaces](#two-declaration-surfaces-one-schema).
2. **A required setting that has a default never blocks install.** The check is
   `spec.required && spec.default.is_none()`
   (`solution/settings.rs:156`).
3. **You may not write keys you did not declare.** Any unknown key in a tenant
   settings payload is refused — except host-owned keys.
4. **Only one settings file is ever read.** Extra files under `settings/` are
   silently ignored, not merged.
5. **A setting only does something if a named reader looks it up.** Settings are
   not injected into workflows generically; the readers are enumerated in
   [Runtime readers](#runtime-readers-exactly-who-looks-at-what).

## Two declaration surfaces, one schema

| Surface | What it does | Status |
| --- | --- | --- |
| `settings/business.yaml` | The settings schema: keys, types, defaults, `required`, descriptions. This is what `SettingsSchema` is built from. | **Supported** |
| `manifest.settings[]` | Names the settings your app references. Checked one direction only at publish. | **Partial** |

`parse_and_validate` builds the schema from the **component**
(`qefro-plugin-platform/services/solution-service/src/solution/validator.rs:73`):

```rust
let settings_schema = SettingsSchema::from_value(&components.settings)?;
```

then checks the manifest against it (`validator.rs:165-175`):

```rust
let schema_keys: Vec<String> = settings_schema
    .keys()
    .into_iter()
    .map(str::to_string)
    .collect();
require_subset(
    "settings",
    &manifest.setting_keys(),
    &schema_keys,
    "settings schema entry",
)?;
```

`require_subset` is **one-directional** (`solution/validator.rs:578`):

| Direction | Result |
| --- | --- |
| manifest key with no schema entry | refused: `settings: manifest references settings schema entry 'currency' which is missing from the package` |
| schema entry with no manifest reference | **accepted** — unlike workflows/entities/prompts/events, settings are *not* checked with `require_set_match`, so an unreferenced setting publishes fine |

So the manifest list is a declaration of intent that must be a subset of the
schema. The schema may legitimately contain more keys than the manifest lists
(e.g. `tax.enabled`, `flow_enabled`, or brand-override keys your UI does not
name).

:::note The manifest's own per-setting attributes are usually inert
`manifest.settings[]` accepts a bare string or a
`{key, type, required, default, description, secret}` object
(`solution/manifest.rs:291-323`). Only `key` is read by the validator
(`solution/manifest.rs:785`). The sub-attributes are used **only** by the CLI's fallback
synthesis below, and `secret` is never used by anything
([Secrets](#secrets-secret-is-a-key-name-heuristic)).
:::

### File discovery, exactly

Both assemblers read **one** settings document, and their fallbacks differ.

| Path | Discovery order | If nothing is found |
| --- | --- | --- |
| CLI (`qefro solution build` / `publish`) | `settings/business.yaml`, `business.yml`, `settings.yaml`, `settings.yml`, else the alphabetically first `settings/*.{yaml,yml,json}` (`qefro-cli/src/main.rs:576-598`) | `components.json` `settings` override (`:599`), else a schema **synthesized from `manifest.settings[]`** (`:602`, `:606-631`) |
| ZIP upload (`POST /v1/tenant/packages/upload`) | `settings/business.yaml`, `business.yml`, `settings.yaml`, `settings.yml`, `settings/business.json`, `settings/settings.json`, else the first `settings/*.{yaml,yml,json}` case-insensitively (`solution/zip_assemble.rs:491-521`) | `components.json` `settings`, else `{"settings": {}}` (`:522-525`) — **no manifest synthesis** |

Consequences you can be bitten by:

- A package with settings **only** in `manifest.settings[]` and no `settings/`
  file builds with the CLI and *fails* the same ZIP upload at publish, because
  the empty schema cannot cover the manifest's keys.
- `settings/extra.yaml` is read by neither path once `business.yaml` exists.
  Two settings files do not merge.
- The CLI synthesis turns `- currency` into `{ "type": "string" }` and copies
  `type`/`required`/`default`/`description` from an object entry
  (`qefro-cli/src/main.rs:606-631`). `secret` is dropped there, and `title`,
  `options` and `category` do not exist at all.

### Schema document shape

`SettingsSchema::from_value` accepts all of these
(`solution/settings.rs:101-119`):

```yaml
# (a) wrapped
settings:
  currency:
    type: string
    default: INR

# (b) bare mapping — same meaning
currency:
  type: string
  default: INR

# (c) scalar shorthand — declares type only, required=false, no default
timezone: string
```

| Input | Result |
| --- | --- |
| `null` / missing file | empty schema (`settings.rs:102-104`) — **Supported** |
| root is not a mapping | `settings: expected a mapping of setting keys` (`:111`) |
| an entry that is neither a string nor a mapping | `settings: setting 'x': expected a type shorthand or mapping` (`:276-281`) |
| unknown attributes inside an entry | silently ignored — `parse_spec` reads only `type`/`setting_type`, `required`, `default`, `description` (`:259-317`) |

## Types

`SettingType` is a closed enum
(`qefro-plugin-platform/services/solution-service/src/solution/settings.rs:19-52`).

| Canonical | Accepted aliases | Value must be | Empty accepted? |
| --- | --- | --- | --- |
| `string` | — | a JSON string | yes (`""` is a string) |
| `color` | — | `#RGB`, `#RRGGBB` or `#RRGGBBAA` (`settings.rs:68-75`) | yes — `""` short-circuits before the hex check (`:57-59`) |
| `url` | — | starts with `http://` or `https://`, ≤ 2048 chars, and contains none of `"`, `'`, `{`, `}`, `;` or a backslash (`settings.rs:77-82`) | yes (`:60`) |
| `boolean` | `bool` | a JSON `true`/`false` | no |
| `number` | `integer`, `float` | a JSON number | no |
| `json` | `object`, `array` | anything — `matches` returns `true` unconditionally (`settings.rs:63`) | n/a |

Notes that have caused real failures:

- An **unquoted** YAML value is not always the type you expect. `default: 2026`
  parses as a number, so `type: string` rejects it with
  `setting 'year': default does not match type string` (`settings.rs:296-306`).
  `default: "#ea580c"` needs the quotes in YAML or the `#` starts a comment.
- `type: string` does **not** coerce. A tenant value of `5` fails with
  `setting 'x' must be of type string`.
- `number` accepts decimals; `integer` and `float` are aliases for the *same*
  variant, so `type: integer` will happily accept `2.5`.
- Anything else is refused: `settings: setting 'x': unknown type 'select'`
  (`settings.rs:262-267`, `:288-293`). There is no enum/select setting type —
  a dropdown in the portal comes from key-name heuristics, not from your schema
  ([What the tenant sees](#what-the-tenant-sees-the-settings-form)).

## Setting attributes

| Key | Type | Required | Real default | Gates | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `type` | enum | no | `string` | P V N:plan C O | Supported | Read as `type`, falling back to `setting_type` (`settings.rs:283-287`). |
| `required` | bool | no | `false` | P V N:plan C O | Supported | Only meaningful when no `default` — see the rule below. |
| `default` | any | no | absent | P V N:plan C O | Supported | Must match `type`. Fills missing tenant values and seeds the chat context. |
| `description` | string | no | absent | P V N:plan C O | Supported | Stored in `solution_settings.description`; rendered as helper text under the field. No runtime behaviour. |
| `setting_type` | enum | no | — | P V | Supported | Alias for `type`, kept for registry-shaped payloads. |
| `title` | string | no | — | — | **Unsupported** | Portal-only field (`ai-customer-support-portal/src/api/client.ts:1844-1858`); the backend DTO never emits it (`crates/qefro-plugin-proto/src/solution.rs:150-161`). Label falls back to humanized key. |
| `options` | list | no | — | — | **Unsupported** | Portal renders a `<select>` when `def.options` is present; no package path can populate it. |
| `category` | string | no | — | — | **Unsupported** | Portal grouping falls back to key-name heuristics (`availabilitySettings.ts:138-153`). |
| `secret` | bool | no | `false` | P N:raw | **Metadata only** | In `manifest.settings[]` it is parsed into `SettingRef` (`solution/manifest.rs:306`) and preserved only in the raw version document; in a `settings/business.yaml` entry `parse_spec` never reads it at all. The flag the portal sees is recomputed from the key name ([Secrets](#secrets-secret-is-a-key-name-heuristic)). |

## Validation rules, verbatim

Schema-shape problems are refused at **publish**; value problems are refused at
**install** and on every **settings write**.

| Where | Helper | Error variant | Code | HTTP |
| --- | --- | --- | --- | --- |
| Publish, schema parse | `invalid_section("settings", detail)` (`solution/errors.rs:9`) | `InvalidManifest` | `invalid_manifest` | 400 |
| Publish, manifest↔schema | `require_subset` (`solution/validator.rs:578`) | `InvalidManifest` | `invalid_manifest` | 400 |
| Install / settings write | `invalid_setting(detail)` (`solution/errors.rs:14`) | `Validation` | `validation_error` | 400 |

(`crates/qefro-plugin-common/src/error.rs:148-153`, `:213`, `:236`.)

The tenant-facing rules, in the order `validate_values` applies them
(`solution/settings.rs:140-186`):

| # | Rule | Message |
| --- | --- | --- |
| 1 | A declared key is absent **and** `required: true` **and** it has no `default` | `required setting 'currency' is missing` |
| 2 | A declared key is present with the wrong JSON type | `setting 'currency' must be of type string` |
| 3 | An **undeclared**, non-host key appears | `unknown setting 'loyalty_tier' is not declared by the solution` |

:::tip A required setting with a default is not required
Rule 1 is `spec.required && spec.default.is_none()`. This is deliberate: the
default is applied by `merge_defaults` (`settings.rs:189-211`), so the value can
never be missing afterwards. Declare `required: true` **with** a default to get
"a portal field marked with `*` that always installs", and `required: true`
**without** a default to get a genuine hard gate.
:::

`validate_values` checks **only declared keys** for presence and type. It does
not enforce a minimum, maximum, regex, or length — `number` has no range and
`url` has no allowlist. Nothing in the settings layer enforces those.

### Dotted keys and nesting are the same thing

Values are flattened before checking, so a dotted declaration and a nested
payload are interchangeable (`settings.rs:140-150` via
`domain::flatten_settings`, `qefro-plugin-platform/services/solution-service/src/domain/mod.rs:11-37`).

| Declared key | Accepted tenant value |
| --- | --- |
| `tax.enabled` | `{"tax.enabled": true}` **or** `{"tax": {"enabled": true}}` |
| `currency` | `{"currency": "INR"}` |

Flattening rules that are easy to get wrong:

- Objects are recursed into and joined with `.` (`solution-service/src/domain/mod.rs:21-25`).
- **Keys starting with `_`, and anything under a `_` key, are not recursed** —
  the whole subtree is stored as one value. That is how `_ui_customization`
  survives as a document (`solution-service/src/domain/mod.rs:21`, asserted in `solution-service/src/domain/mod.rs:92-97`).
- Arrays are leaf values, not flattened.
- A non-object root payload becomes a single row keyed `value` (`solution-service/src/domain/mod.rs:29-35`).
- `unflatten_settings` rebuilds nesting from dotted rows for the PUT response
  (`solution-service/src/domain/mod.rs:40-47`), which is why the same setting can come back nested
  even though it is stored flat.
- Storing `tax.mode` nested *under an object that is not named in your schema*
  is what rule 3 catches: `{"tax": {"bogus": true}}` →
  `unknown setting 'tax.bogus' is not declared by the solution`.

## Host-owned keys a package must not declare

`is_host_setting_key` (`solution/settings.rs:217-222`) exempts three families
from rule 3, because the platform writes them itself:

| Key | Owner | Purpose |
| --- | --- | --- |
| `_*` (e.g. `_ui_customization`) | portal / host | opaque host documents; never a package setting |
| `navigation_layout` | tenant | sidebar/topbar override applied to the UI bundle |
| `flow_enabled`, `flow_enabled.<workflow>` | tenant | per-workflow enablement switch |

They are exempt from the unknown-key check **only**. Declaring one in
`settings/business.yaml` is legal but pointless: the portal hides
`navigation_layout`, `flow_enabled` and `flow_enabled.*` from the settings form
(`ai-customer-support-portal/src/pages/solutions/ui/availabilitySettings.ts:10`,
`:233-235`), and it also hides the response-envelope words `items`, `total`,
`install`, `state`, `onboarding`, `status`, `error` (`:12-20`, `:229-231`) — so
`{"items": [...]}` typed into the wrong place is refused as
`unknown setting 'items' is not declared by the solution` while a real
`_ui_customization` row sails through.

## Conventional keys the platform reads

These are ordinary settings — nothing special about the name is enforced — but
they are the keys with a real reader. A setting whose name matches none of
these is stored, listed, and read by nobody.

| Key | Reader | Effect |
| --- | --- | --- |
| `business_name` | `solution/brand.rs:16-18`; `flow_engine/entity_tax.rs:205-210` (seller name); portal `CartCheckoutWidget.tsx:381` | UI bundle display name; tax document seller party; receipt header |
| `logo_url` | `brand.rs:19-21` | UI bundle logo override (URL, not a package asset) |
| `primary_color`, `secondary_color`, `accent_color`, `background_color`, `surface_color`, `text_color`, `background_image_url` | `brand.rs:26-39` | Theme token overrides, only when non-empty after trim (`:46-50`) |
| `timezone` | `entity_dates.rs:131-136`; `availability.rs:287-291`; `runtime_adapter.rs:3568` | Booking windows, `current_date` defaults, date rendering |
| `currency` | `entity_tax.rs:193-203`; `CartCheckoutWidget.tsx:109` | Tax currency when the document has none; widget display |
| `duration_minutes`, `viewing_duration_minutes`, `slot_duration_minutes` | `availability.rs:292-304` | Slot length (only `> 0`) |
| `date_window_days` | `availability.rs:305-309` | How far ahead booking is allowed (only `> 0`) |
| `start_time`, `working_hours.start_time`, `viewing_hours.start`, `opening`, `opening_time` (+ `end_time` / `closing` / `closing_time` variants) | `availability.rs:310-364` | Working hours, `HH:MM` only |
| `closed_days`, `blocking_statuses` | `availability.rs:365-370` | Weekday list and blocking statuses; a JSON array or a comma/semicolon-separated string both work (`:408-437`) |
| `availability.*` | `availability.rs:439-466` | The whole set above may also be nested under an `availability` object |
| `tax.enabled`, `tax.mode`, `tax.country`, `tax.regime`, `tax.price_mode`, `tax.registration_type`, `tax.registration_number`, `tax.default_category`, `tax.rounding`, `tax.manual_rate` | `domain/src/tax.rs:122-179` | Tax engine configuration; each key is read flat **or** under a `tax` object, and `mode: automatic` is the only value that selects the rules engine (`:160-166`) |
| `flow_enabled.<workflow-id>` | `domain/src/flow_enablement.rs:35-73` | Removes the workflow from the catalog and refuses execution |
| `receipt_*` | portal `receiptConfig.ts:113-136`, `receiptPrintRenderer.ts:50-101` | Receipt print layout, shown in the `cart_checkout` widget only |
| `payment_terms_days` | portal `CartCheckoutWidget.tsx:110` | Payment due-date math in the checkout widget |
| `_ui_customization` | `solution/ui_overlay.rs:16`, `:34-63` | Host workspace UI overlay; must carry `"version": 1` or the entire overlay is ignored (`:49-57`) |

:::warning `flow_enabled` matching is forgiving in ways your schema is not
`is_flow_enabled_in_settings` tries `flow_enabled`, `_flow_enabled`, dotted and
nested forms, and six case/underscore variants of the workflow id
(`crates/domain/src/flow_enablement.rs:41-69`). Absent means **enabled** (`:71-72`). Declare the
dotted key you actually want (`flow_enabled.book-task`) rather than relying on
that fuzziness.
:::

## Runtime readers, exactly: who looks at what

Settings reach the runtime through **one** carrier: the tenant chat context.

| Carrier | Built at | Contents |
| --- | --- | --- |
| `N:ctx` | `services/solution-service/src/api/chat_context.rs:398-418` | version **defaults** first, then tenant rows over them (`:400-418`), as a flat object, forwarded as `settings` (`:546`) |
| ACS read side | `crates/api/src/flow_engine/runtime_adapter.rs:647-651` | `solution_install_settings()` = that same chat-context `settings` |

Two consequences:

1. **Defaults are visible even before the tenant sets anything.** A reader that
   finds `currency` in the chat context may be reading your `default:`, not a
   tenant value.
2. **A setting with no default and no tenant value is simply absent** — readers
   must and do fall back (`entity_compute.rs:613-618`, `entity_tax.rs:197-203`).

The readers, in the order they can act:

| # | Reader | Source location | What it does with the value |
| --- | --- | --- | --- |
| 1 | Prompt templates | `api/chat_context.rs:476-507`, `resolve_template` `:615-641` | `{{variable}}` in a prompt's `system:` is replaced from settings (defaults first, tenant rows override). **An unresolved placeholder is deleted from the text**, not left in place. |
| 2 | Entity `default_from_setting` | `flow_engine/entity_compute.rs:578-632` | On `create`, an empty field is filled from the named setting. |
| 3 | `default: current_date` | `entity_compute.rs:620-626` with `runtime_adapter.rs:3566-3576` | Fills the field with workspace-local today, computed from `timezone`. |
| 4 | Timezone / dates | `flow_engine/entity_dates.rs:131-136` | `timezone`, else `/availability/timezone`, else `/settings/timezone`. |
| 5 | Availability | `flow_engine/availability.rs:281-371` | Booking slot math, working hours, closed days, blocking statuses. |
| 6 | Tax | `flow_engine/entity_tax.rs:26`, `crates/domain/src/tax.rs:122` | Computes tax blocks on documents. |
| 7 | Flow enablement | `flow_engine/executor.rs:807`, `flow_engine/catalog.rs:123`, `:752` | Hides / refuses disabled workflows. |
| 8 | UI brand overlay | `solution/brand.rs:11-44`, applied at `service/installer.rs:317` | Rewrites the UI bundle's name/logo/theme when the bundle is assembled. |
| 9 | UI customization overlay | `solution/ui_overlay.rs:34-63` | Applies `_ui_customization` onto the bundle. |
| 10 | Portal settings form | `pages/solutions/SettingField.tsx`, `ui/AppConfigureStep.tsx` | Renders and edits the values (below). |
| 11 | `cart_checkout` widget | `CartCheckoutWidget.tsx:105-113`, `:381-386` | Currency, timezone, receipt layout, payment terms. |

:::danger `default_from_setting` does not see nested objects
`setting_value` looks for the key **flat** at the root, or under a top-level
`settings` object, and then unwraps a `{value: …}` or `{default: …}` wrapper object
(`entity_compute.rs:642-662`). It does **not** walk an arbitrary nested tree.
So `default_from_setting: enabled` with the value stored as
`{"tax": {"enabled": true}}` silently fills nothing, while
`default_from_setting: tax.enabled` against a flat `tax.enabled` row works.
Prefer a flat key name, or a dotted `default_from_setting` that matches a flat
row.
:::

:::note Settings are not workflow inputs
A workflow step cannot `${settings.currency}` its way to a value. Nothing in the
FlowRunner resolves settings generically — only the eleven readers above do.
If your app needs a tenant value inside a step, bind it through an entity field
(`default_from_setting`) or a prompt placeholder.
:::

## What the tenant sees: the settings form

The form is driven entirely by `solution_settings` rows for the installed
version (`repo/components.rs:54-71` → `SolutionSettingDefDto`,
`crates/qefro-plugin-proto/src/solution.rs:150-161`).

| Declared | Portal renders |
| --- | --- |
| `type: boolean` | checkbox labelled Enabled/Disabled (`SettingField.tsx:150-162`) |
| `type: color` | colour picker + hex text input, `#RGB` expanded to `#RRGGBB`, anything else shown as `#000000` (`:20-29`, `:163-179`) |
| `type: url` | URL input, plus an image preview when the key contains `logo` (`:180-201`) |
| `type: number` | number input; step 0.1 and a 0–100 hint when the key contains `tax_rate`/`manual_rate` (`:119-121`, `:202-221`) |
| `type: string`, `type: json` | text input; uppercased when the key contains `currency`, and `type=tel` when the key matches phone, whatsapp, mobile or tel (`:222-247`) |
| key is `tax.country`, `tax.mode`, `tax.price_mode`, `tax.rounding`, `tax.regime`, `tax.default_category`, `receipt_paper_size` | a `<select>` with the **hard-coded** option list in `SettingField.tsx:57-117` |
| key in the availability family | moved into the booking-hours block, ordered by `AVAILABILITY_KEYS` (`availabilitySettings.ts:22-30`, `:87-107`) |
| key classified as identity/tax/receipt by name | grouped in `categorizeSettingDefs` (`:186-218`) |
| `required: true` | a red `*` (`SettingField.tsx:128`) |
| `description` | helper text under the label (`:133-135`) |
| `secret` (name heuristic) | `(secret)` marker + password input (`:129-131`, `:224-226`) |

Label text is `def.title || TAX_SETTING_LABELS[key] || RECEIPT_SETTING_LABELS[key] || humanize(key)`
(`SettingField.tsx:54`) — and `title` never arrives from a package, so your
`business_name` shows as "Business Name" and nothing else.

When a package declares **no** settings, the form says
"This app runs with standard optimized defaults and requires no initial
configuration" (`AppConfigureStep.tsx:137-141`). That is a real, supported
state — an empty schema is valid.

## Reading and writing values over the API

| Verb | Path | Shape |
| --- | --- | --- |
| GET | `/v1/tenant/solutions/:name/settings` (`solution-service/src/api/mod.rs:103-104`) | `ListResponse<TenantSolutionSettingDto>` — flat rows `{key, value, updated_at}`, `total` = row count (`api/tenant.rs:255-271`, `proto/solution.rs:284-288`) |
| PUT | same | request `{ "settings": <any JSON> }` (`proto/solution.rs:291-293`); response is the **unflattened** merged set (`service/installer.rs:372`) |

`update_settings` is a read-modify-write, not a replace
(`service/installer.rs:329-373`):

1. load the install and its **validated package** for the installed version;
2. load existing rows into a flat map;
3. flatten the request and apply it — **`null` deletes a key, an absent key is
   preserved** (`:349-355`, same rule in `merge_install_settings`,
   `solution/settings.rs:226-242`);
4. `validate_values` the **resulting whole set**, then `merge_defaults` (`:358-359`);
5. rewrite every row in one transaction (`:361-371`);
6. return `unflatten_settings(...)`.

Step 3 is why an overlay save from the UI does not wipe `currency`: keys not
mentioned survive. Step 3 is also why `{"currency": null}` **deletes** the row —
and if `currency` is `required` without a default, the next save fails at step 4
with `required setting 'currency' is missing`.

There is no per-key endpoint, no dry-run, and no partial validation: a payload
containing one bad value is refused **whole**, leaving the stored set unchanged.

### Install and upgrade

| Moment | Behaviour |
| --- | --- |
| Install (`POST /v1/tenant/solutions/install` with `{solution_name, version, settings}` — `api/mod.rs:66-69`, `proto/solution.rs:214-222`) | `settings` is validated and defaults-merged inside `plan_install` (`solution/installer.rs:64-69`, called at `service/installer.rs:586`), then every value is written as flattened rows (`service/installer.rs:1446-1452`). The field is `#[serde(default)]` → a request that omits it installs `Value::Null`, which is fine **iff** every required key has a default. |
| Upgrade (`POST /v1/tenant/solutions/:name/upgrade`) | current rows are loaded, **pruned of keys the new version no longer declares**, then planned (`service/installer.rs:799-816` → `prune_undeclared_settings`, `solution/settings.rs:245-257`). Host keys (`_…`, `navigation_layout`, `flow_enabled*`) survive the prune (`:251`). |
| Re-publishing an existing `id@version` | refused before any of this: the version insert hits a unique constraint → `solution_already_published` (409) (`repo/catalog.rs:220-224`, `error.rs:168-174`). Schema rows belong to a version, so there is no "edit the settings schema in place" path — publish a new version. |

The prune is forward-only and destructive of *values*, not of records: drop
`loyalty_tier` in v1.2.0 and every workspace's value is deleted on upgrade. If a
rename is what you want, add the new key with `default_from_setting`-style
migration in mind, ship it alongside the old key, and remove the old key in a
later version.

## Secrets: `secret:` is a key-name heuristic

`manifest.settings[].secret` is parsed (`solution/manifest.rs:304-306`,
documented there as "Portal password field; install-time value only (never in
the package)") and then dropped: `parse_spec` never reads it
(`solution/settings.rs:259-317`) and the CLI synthesis skips it (`:620-624`).

What the portal renders as `secret` is recomputed at catalog read time from the
lowercased key (`solution-service/src/service/publisher.rs:405-419`):

```rust
secret: key_l.contains("api_key")
    || key_l.contains("token")
    || key_l.contains("secret")
    || key_l.ends_with("_key"),
```

Practical reading:

- Name the key so it contains `api_key` or `token` or `secret`, or ends with
  `_key`, and the portal gives the admin a password input. `notion_api_key`,
  `shopify_token`, `webhook_secret`, `notion_key` all qualify; `notion_auth`
  does not.
- `secret: true` in YAML changes nothing but your own conscience.
- **Values are stored as plain JSON in `tenant_settings` rows.** The heuristic
  controls the input type, not encryption. The GET response returns the value
  verbatim (`api/tenant.rs:261-268`) — nothing redacts it. Treat a settings value
  as tenant-visible, and put real credentials in a connector/secret path
  instead — see [Permissions and scope](/docs/solutions/permissions-and-scope).

## Valid example

`settings/business.yaml`:

```yaml
settings:
  business_name:
    type: string
    required: true
    default: Project Desk
    description: Shown in the app header and in outbound updates.
  timezone:
    type: string
    default: Asia/Kolkata
    description: >-
      IANA name. Due dates and `current_date` defaults resolve against this zone.
  currency:
    type: string
    default: INR
    description: "Applied by entity fields that declare `default_from_setting: currency`."
  default_project_rate:
    type: number
    default: 0
    description: Starting hourly rate for a new project.
  show_completed_tasks:
    type: boolean
    default: true
    description: Whether task lists include records already in `done`.
```

`manifest.yaml` — the same keys, as plain strings:

```yaml
settings:
  - business_name
  - timezone
  - currency
  - default_project_rate
  - show_completed_tasks
```

That is the pair used by the worked example, verbatim as
`qefro-documentation/examples/marketplace-handbook/project-desk/settings/business.yaml`
and `qefro-documentation/examples/marketplace-handbook/project-desk/manifest.yaml`.

This combination:

- passes `require_subset` (every manifest key has a schema entry);
- installs with **no** tenant input at all, because every `required` key has a
  default (rule 1);
- renders five typed fields, of which `business_name` carries the `*`;
- gives `timezone` a real reader (readers 4/5) and `currency` one via
  `default_from_setting` on an entity field.

`project-desk` wires the currency setting like this
(`examples/marketplace-handbook/project-desk/entities/project.yaml:36-38`):

```yaml
fields:
  - name: currency
    type: string
    default_from_setting: currency
```

:::note Two settings in this example have no reader
`default_project_rate` and `show_completed_tasks` are declared so the tenant can
see and edit them, and they round-trip through the API — but nothing in the
platform looks those names up. They are honest placeholders for a real app's own
convention: either wire them (`default_from_setting`, a prompt `{{variable}}`) or
drop them. Declaring a setting is not the same as applying it.
:::

## Invalid examples, and what each actually says

| What you wrote | Where it fails | Message |
| --- | --- | --- |
| `tier: { type: select }` | publish, schema parse | `settings: setting 'tier': unknown type 'select'` |
| `logo_url: { type: url, default: "cdn.example.com/logo.png" }` | publish | `settings: setting 'logo_url': default does not match type url` |
| `primary: { type: color, default: orange }` | publish | `settings: setting 'primary': default does not match type color` |
| `year: { type: string, default: 2026 }` | publish | `settings: setting 'year': default does not match type string` |
| `settings:\n  - currency` with no `settings/` file, via **ZIP upload** | publish | `settings: manifest references settings schema entry 'currency' which is missing from the package` |
| same package via `qefro solution build` | **nothing** | the CLI synthesizes `{ "currency": { "type": "string" } }` (`qefro-cli/src/main.rs:606-631`), which is exactly why this ships broken |
| `business.yaml` present, plus `settings/tax.yaml` | **nothing at build** | only `business.yaml` is read; your tax keys are missing and their `manifest.settings[]` entries then fail the subset check at publish |
| tenant PUT `{"settings": {"loyalty_tier": "gold"}}` | install / save | `unknown setting 'loyalty_tier' is not declared by the solution` |
| tenant PUT `{"settings": {"booking_enabled": "yes"}}` | install / save | `setting 'booking_enabled' must be of type boolean` |
| `required: true`, no default, tenant installs with `{}` | install | `required setting 'business_name' is missing` |
| `{"settings": {"currency": null}}` on a `required` key with no default | save | `required setting 'currency' is missing` — the null deleted the row before validation |

:::warning `qefro app validate` does not look at settings
The CLI's `validate` subcommand is `app_dev`
(`services/qefro-cli/src/main.rs:848`, implementation `:1418-1484`). It checks
`id`, `hosting`, the existence of `workflows/` and — for `hosting: runtime` —
`entities/`, prints `dev ok:` **before** building, and parses nothing
schema-shaped. Type errors, unknown types, mismatched defaults and manifest↔schema
gaps are found by `qefro solution build` at the earliest, and enforced only at
publish.
:::

## Support status

| Surface | Status |
| --- | --- |
| `settings/business.yaml` schema (`type`, `required`, `default`, `description`) | **Supported** |
| Bare-mapping and scalar-shorthand roots | **Supported** |
| Dotted keys, nested payloads, `null` deletes, defaults merge | **Supported** |
| Conventional reader keys in [the table](#conventional-keys-the-platform-reads) | **Supported** |
| `flow_enabled.<workflow>` | **Supported**, with name-fuzzy matching (host-owned; not package-declared) |
| `manifest.settings[]` | **Partial** — key subset only; sub-attributes used only by the CLI fallback |
| `manifest.settings[].secret` | **Metadata only** |
| `title`, `options`, `category` | **Unsupported** (portal-side types only) |
| Settings read generically by a workflow step | **Unsupported** — no such reader exists |
| Encrypted / redacted setting values | **Unsupported** |
| Live behaviour of a *new* conventional key you invent | **Unsupported** — no reader, no effect |

## Related topics

- [Attribute inventory](/docs/solutions/attribute-inventory) — §11 settings rows
- [Manifest reference](/docs/solutions/manifest)
- [Entity schema](/docs/solutions/entity-schema) — `default_from_setting`, `default: current_date`
- [Runtime capabilities and boundaries](/docs/solutions/runtime-capabilities)
- [Permissions and scope](/docs/solutions/permissions-and-scope) — where real credentials belong
- [Auxiliary components reference](/docs/solutions/auxiliary-reference) — prompts and `{{variable}}`
- [Troubleshooting](/docs/solutions/troubleshooting)
