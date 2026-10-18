---
title: "Troubleshooting"
description: "Diagnosing solution build, publish, install and render failures — symptoms, causes and fixes."
sidebar_label: "Troubleshooting"
---

# Troubleshooting

Work stage by stage: build → publish → install → render. Every failure in
the pipeline surfaces with a message; this page maps the common ones to
fixes.

## Build failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| `solution id must be kebab-case: {id}` | `id` has capitals, `_` or starts with a digit | Rename to lowercase kebab-case, e.g. `restaurant-pro` |
| `missing definition: {dir}/workflows/{id}.yaml` | `flows:` lists an id with no `workflows/<id>` definition | Add the definition or remove the entry |
| `no signing key: set QEFRO_SIGNING_KEY_HEX or provide {path}` | Neither `QEFRO_SIGNING_KEY_HEX` nor `QEFRO_KEYS_FILE` resolves | Provide a key — see [Packaging](/docs/solutions/packaging) |
| `manifest.yaml not found in {dir}` | Build run outside the solution root | Run `qefro solution build .` from the package directory |
| `dev ok` then `error: missing definition: …` | `qefro app validate` prints its success line before assembling the package | Treat `dev ok` as a directory-shape result only — see [Validation](/docs/solutions/validation) |

## Publish failures

Publish failures arrive as HTTP 400 with code `invalid_manifest` and the
message `invalid manifest: {section}: {detail}`.

| Symptom | Cause | Fix |
| --- | --- | --- |
| `invalid signature for {name}@{version}` (422) | Package rebuilt after signing, or wrong key | Rebuild and republish in one flow; verify `signature_kid` |
| `ui: widget '{id}' has unsupported type '{kind}'` | Widget `type` outside the closed catalogue | Use a supported kind — see [Metric](/docs/solutions/widgets/metric) for the catalogue |
| `manifest.yaml: unknown capability '{capability}'` | Misspelled or invented capability | Use names from [Capabilities](/docs/solutions/capabilities) |
| ``invalid permission '{permission}': expected `resource.action` `` | Permission string outside the grammar | Use `resource.action`, lowercase, `_` or `-` in the resource, `*` allowed as the action |
| `ui: navigation '{id}' uses icon '{icon}' outside the host icon set` | Icon outside the closed host set | Pick from the set in [Navigation](/docs/solutions/navigation) |
| `ui: grid columns must be 1-12` | Layout `columns` outside 1–12 | Correct the layout preset |
| `assets: executable content is not allowed in solution UIs: '{path}'` | Forbidden extension on a path under `ui/` | Remove it — [images only](/docs/solutions/assets) |
| `manifest.yaml: hosting: runtime requires at least one entity in entities/` | Runtime app with no entity schemas | Ship at least one `entities/{id}.yaml` and list it under `entities:` |
| `{section}: manifest references {label} '{item}' which is missing from the package` | Manifest declares an id the package does not ship | Add the file, or drop the manifest entry |
| `{section}: {label} '{item}' is not referenced by the manifest` | Package ships a component the manifest never declares | Declare it, or delete the file |
| `solution already published: {name}@{version}` (409) | Republishing an immutable version | Bump the version and publish again |

## Install failures

Tenant-facing install failures surface as HTTP 400 `validation error: {…}`
(code `validation_error`) or as the registry errors below.

| Symptom | Cause | Fix |
| --- | --- | --- |
| `solution already installed: {name}` (409) | An `active`, `installing` or `upgrading` row already exists for this workspace | Upgrade the existing installation instead of reinstalling |
| `validation error: required setting '{key}' is missing` | Install payload omits a setting the schema declares required | Supply the value, or give the schema a `default` and republish |
| `validation error: setting '{key}' must be of type {type}` | Value type does not match the declared `setting_type` | Send the JSON type the schema declares |
| `validation error: unknown setting '{key}' is not declared by the solution` | Setting not present in the installed version's schema | Remove it, or declare it in `settings/` and publish a new version |
| `connector not enabled for tenant: {name}` (404) | Declared connector has no tenant enablement | Enable the connector for the tenant first |
| `no installation binding for solution '{name}'` (404) | Application descriptor was never bound, or the row was pruned | Reinstall so the binding is created |
| `invalid signature for {connector}@{version}` (422) | Connector package signature does not verify against the registry | Republish the connector, or pin a version that verifies |
| `ENCRYPTION_KEY is unset; connector credentials cannot be stored unencrypted` | Server configuration, not the package | Set `ENCRYPTION_KEY` on the solution-service |
| `SOLUTION_PUBLIC_KEYS is not configured, so package signatures cannot be verified; installing is refused in production (set SOLUTION_PUBLIC_KEYS=kid:<hex>,… to enable install)` | Fail-closed signature policy with no keys | Configure `SOLUTION_PUBLIC_KEYS` |
| ``state must be `active` or `paused`, got '{other}'`` | Tenant state update with an unsupported target | Use `active` or `paused` |
| `unknown onboarding step '{step_id}' for solution '{name}'` | Completion call names a step outside the installed version | Use an id from the installed package's `onboarding` component |

## Render issues (installed, but wrong)

| Symptom | Cause | Fix |
| --- | --- | --- |
| Widget shows an empty state, no error | The source capability is not granted, so no request fired | Check the granted capability set on the installation card; compare with [Capabilities](/docs/solutions/capabilities) |
| Scoped error card on one widget | Degenerate definition survived coercion | Open Developer mode → Solution UI events; look for `ui.error`; fix the definition and publish a patch |
| Table renders but columns are empty | `columns[].key` doesn't match payload fields | Inspect the connector operation response; align keys (dot paths supported) |
| Metric shows an em-dash | `value_path` doesn't resolve in the payload | Verify the runtime/connector payload shape for the path |
| Chart flat / no points | Rows lack `x_key` / `y_key`, or payload order is wrong | Pre-aggregate and order rows in the connector |
| Timeline empty | Rows missing the `time_field`, or unparseable timestamps | Ensure ISO timestamps in the payload |
| Form submit does nothing | `workflow.trigger` not granted, or workflow id wrong | Verify `workflow.execute` permission and the `action.trigger` id |
| Navigation entry missing | Entry's `page` doesn't resolve | Match navigation ids to `pages.yaml` ids |
| Theme looks wrong in one area | Hard-coded colors in a widget/markdown | Move styling into [theme tokens](/docs/solutions/themes) |

## Where to look

| Tool | Shows |
| --- | --- |
| Portal → Developer mode → **Solution UI events** | `ui.loaded` / `ui.action` / `ui.error` emitted by this tenant's UI |
| `GET /v1/ui/events?limit=50` | Same events over the API (tenant-scoped) |
| Installation card | Active version, granted capabilities, declared connectors |
| Flow-run history | Workflow executions triggered by the solution — see [Run Business Flows](/docs/guides/run-business-flows) |
| `qefro solution list` | Published versions and tenant installations |

## Escalation path

1. Reproduce locally with `qefro solution build .` — this catches assembly and
   ADR-003 storage-target failures only. Contract violations reported at
   publish (permissions, entity fields, widget kinds, setting types) are not
   checked by any local command; read the `invalid manifest: …` message.
2. Compare the requested vs granted capability set — capability gaps
   explain most "silent" UI behavior.
3. Check the connector side: operation exists, published version
   satisfies the constraint, pool healthy. See
   [connector reference](/docs/reference/connector-reference).
4. Only then escalate to platform support with the solution id, version,
   tenant id and the failing event/error payload.

## Related topics

- [Validation](/docs/solutions/validation)
- [Events](/docs/solutions/events)
- [Platform troubleshooting](/docs/troubleshooting)
