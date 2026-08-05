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
| `solution id must be kebab-case` | `id` has capitals, `_` or starts with a digit | Rename to lowercase kebab-case, e.g. `restaurant-pro` |
| `workflow file missing` | `flows:` lists an id with no `workflows/<id>` definition | Add the definition or remove the entry |
| `no signing key` | Neither `QEFRO_SIGNING_KEY_HEX` nor `QEFRO_KEYS_FILE` resolves | Provide a key — see [Packaging](/docs/solutions/packaging) |
| `manifest.yaml not found` | Build run outside the solution root | Run `qefro solution build .` from the package directory |

## Publish failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Signature rejected | Package rebuilt after signing, or wrong key | Rebuild and republish in one flow; verify `signature_kid` |
| `unknown widget type` | Widget `type` outside the closed catalogue | Use a supported kind — see [Metric](/docs/solutions/widgets/metric) for the catalogue |
| `unknown capability` | Misspelled or invented capability | Use names from [Capabilities](/docs/solutions/capabilities) |
| Icon rejected | Icon outside the closed host set | Pick from the set in [Navigation](/docs/solutions/navigation) |
| `bad grid columns` | Layout `columns` outside 1–12 | Correct the layout preset |
| Executable asset rejected | Non-image file under `assets/` | Remove it — [images only](/docs/solutions/assets) |
| Version exists | Republishing an immutable version | Bump the version and publish again |

## Install failures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Connector dependency unresolved | No published connector satisfies the constraint | Publish the connector, or relax the semver constraint |
| Capability missing from granted set | Requested capability has no grant precondition (`workflow.trigger` without `workflow.execute`) | Add the manifest permission and publish a new version |
| Missing credential | Connector declares `auth` but the tenant skipped it | Complete credentials in the install wizard / settings |
| Signature verification failed | Registry copy differs from stored checksum | Republish; if persistent, contact platform support |

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

1. Reproduce locally with `qefro solution build .` — most definitions are
   debuggable without a tenant.
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
