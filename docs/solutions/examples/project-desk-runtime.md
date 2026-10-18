---
title: "Project Desk worked example"
description: "A complete metadata-only Marketplace App — tree, every YAML, the real CLI commands you run locally with their exact captured output, and the failures that follow from each of the platform's hard boundaries."
sidebar_label: "Project Desk example"
---

# Project Desk worked example

This is a runnable Marketplace App that uses **only** metadata. No source
code, no `src/`, no `Dockerfile`, no `/qefro` server. It exercises entities,
a state machine, workflows, prompts, settings, onboarding, triggers, an
agent block, an action, and a UI bundle. Every command shown below was
executed on this working tree; the output is captured verbatim.

App id: `project-desk`. `hosting: runtime`. Source:
[`qefro-documentation/examples/marketplace-handbook/project-desk`](file:///Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk).

## What it proves

- A package that ships **only declarative YAML** can be assembled, signed,
  and (in principle) published.
- The local CLI commands **build the artifact** but do **not** run the
  solution-service validator. `qefro app validate` is a structural check,
  not a contract check. This example documents that gap and shows what you
  actually need to catch a broken package.
- Every real boundary in [Runtime capabilities](/docs/solutions/runtime-capabilities)
  and [Permissions and scope](/docs/solutions/permissions-and-scope) is
  demonstrated against one app.

## Tree

```text
project-desk/
├── manifest.yaml
├── entities/
│   ├── client.yaml
│   ├── project.yaml
│   └── task.yaml
├── workflows/
│   ├── create-project.yaml
│   ├── create-task.yaml
│   ├── close-task.yaml
│   └── list-projects.yaml
├── prompts/
│   └── task-intake.yaml
├── settings/
│   └── business.yaml
├── onboarding/
│   ├── connect_whatsapp.yaml
│   └── set_profile.yaml
└── ui/
    ├── layouts.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── sources.yaml
    ├── theme.yaml
    └── widgets.yaml
```

Nothing else. No `components.json`, no `policies/`, no `channels/`, no
`migrations/`, no `connections/`, no `tools/`, no `actions/`. See
[Auxiliary components reference](/docs/solutions/auxiliary-reference) for
which of those can only arrive via `components.json`.

## `manifest.yaml`

```yaml
id: project-desk
name: Project Desk
version: 0.1.0
description: >-
  Metadata-only project delivery Marketplace App: clients, projects and tasks
  managed from WhatsApp, the web widget and the portal UI — no SDK process.
category: productivity
tags: [projects, tasks, handbook, runtime]
hosting: runtime
channels: [widget, whatsapp]
connectors: [whatsapp]
entities: [client, project, task]
flows: [create-project, create-task, close-task, list-projects]
prompts: [task-intake]
events:
  - project.created
  - project.updated
  - task.created
  - task.completed
settings:
  - business_name
  - timezone
  - currency
  - default_project_rate
  - show_completed_tasks
onboarding: [connect_whatsapp, set_profile]
ui:
  name: Project Desk
permissions:
  - storage.read
  - storage.write
  - storage.update
  - workflow.execute
capabilities:
  - theme.get
  - user.get
  - tenant.get
  - runtime.query
  - workflow.trigger
  - storage.read
  - storage.write
  - storage.update
triggers:
  - id: create_task
    workflow: create-task
    input_variable: task_input
    match:
      intents: [create a task, add a task, new task]
      confirmation:
        reply_signals: [task, created]
        required_slots: [task_title, project_name]
    confirmation_message: Task '{{task_title}}' created in {{project_name}}.
  - id: close_task
    workflow: close-task
    input_variable: task_close
    match:
      intents: [close the task, finish task, mark task done]
      confirmation:
        reply_signals: [closed, done]
        required_slots: [task_ref]
    confirmation_message: Task {{task_ref}} closed.
conversation_slots:
  - { id: task_title,   kind: string,      labels: [task, "task name", title] }
  - { id: project_name, kind: string,      labels: [project, "project name"] }
  - { id: task_ref,     kind: string,      labels: [task, "task id", "task code"] }
  - { id: client_name,  kind: person_name, labels: [client, customer, company],
      identity: person_name }
agent:
  enabled: true
  roles:
    customer: { capabilities: [knowledge] }
    business:
      capabilities: [crm, customers, analytics]
      flows: [create-task, close-task]
actions:
  - id: close_task_record
    name: Close task record
    description: Transition one task to done from the portal record view.
    target: { entity: task, record_bound: true }
    required_permission: storage.update
    parameters:
      - { name: id,           type: string, required: true,  description: Task record id }
      - { name: closing_note, type: string, required: false }
    execution: { type: state_transition, target_state: done }
```

Every field here is documented in
[Attribute inventory §2.6](/docs/solutions/attribute-inventory#26-actions-actiondefinition).

## `entities/task.yaml` (the interesting one)

```yaml
id: task
name: Task
description: One unit of work inside a project.
fields:
  - { name: project_id,  type: relation, ref_entity: project, required: true, label: Project }
  - { name: title,       type: string,   required: true, label: Title }
  - { name: details,     type: string,   label: Details }
  - { name: assignee,    type: string,   label: Assignee }
  - { name: due_date,    type: date,     label: Due date }
  - name: status
    type: enum
    enum_values: [todo, doing, blocked, done]
    default: todo
    label: Status
  - { name: estimate_hours, type: float, label: "Estimate (hours)" }
  - name: closing_note
    type: string
    label: Closing note
    required_when: { field: status, operator: eq, value: done }
status_field: status
status_events:
  done: task.completed
  blocked: task.updated
state_machine:
  initial: todo
  states:
    - { name: todo,    label: To do }
    - { name: doing,   label: In progress }
    - { name: blocked, label: Blocked, color: '#b45309' }
    - { name: done,    label: Done, terminal: true }
  transitions:
    - { from: todo,    to: doing,   name: Start }
    - { from: doing,   to: blocked, name: Block }
    - { from: blocked, to: doing,   name: Unblock }
    - { from: doing,   to: done,    name: Complete }
    - { from: todo,    to: done,    name: Quick close }
title_field: title
views: [{ type: table }]
```

Notice: no `workspace_id`, `tenant_id`, `installation_id`, `organization_id`
— those are `FORBIDDEN_AUTHORITY_FIELDS` at
[`solution/entities.rs:19-25`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/entities.rs#L19-L25)
and adding one fails publish with
`entity 'task' field 'workspace_id' is reserved for trusted runtime context
(metadata cannot specify workspace/tenant authority)`.

## `settings/business.yaml`

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

Only `type`, `required`, `default`, `description` are real schema attributes.
See [Settings reference](/docs/solutions/settings-reference).

## `workflows/create-task.yaml`

```yaml
id: create-task
name: Create task
description: Capture one task against a project.
trigger: { type: conversation }
surfaces: [customer, staff]
steps:
  - { id: ask_project, type: ask, field: project_name, message: Which project is this for? }
  - { id: ask_title,   type: ask, field: task_title,   prompt: task-intake, message: What should the task say? }
  - { id: ask_assignee, type: ask, field: assignee,    message: Who should own it? }
  - id: create
    type: tool
    tool: entity.task.create
    execution: runtime
    input_map:
      title:    task_title
      assignee: assignee
      status:   $literal:todo
  - { id: done, type: complete, message: Task added. }
```

The `type: tool` + `tool: entity.task.create` step is the **only** way a
metadata workflow writes to storage. It reaches
`RuntimeAdapter::execute_storage`
([`flow_engine/runtime_adapter.rs:2919`](file:///Users/abu/qefro/ai-customer-support/crates/api/src/flow_engine/runtime_adapter.rs#L2919)).
Anything naming `storage/insert` is refused by `app_dev` with the ADR-003
error string — see [Runtime capabilities §1d](/docs/solutions/runtime-capabilities#1d--adr-003-storage-guard-cli).

## `onboarding/connect_whatsapp.yaml`

```yaml
id: connect_whatsapp
title: Connect WhatsApp
action: connector.connect
connector: whatsapp
required: true
description: Authorise the number that will receive project updates.
```

The `connector.connect` action requires `connector` and the connector must
be declared in `manifest.connectors[]`. Refused otherwise with
`step 'connect_whatsapp' references connector 'whatsapp' not declared in the
manifest`.

## Real commands and captured output

Run from `qefro-plugin-platform`. The environment must be able to build
`qefro-cli`; nothing else is required for these three commands.

### Build the CLI

```bash
cd /Users/abu/qefro/qefro-plugin-platform
cargo build -p qefro-cli
```

### `qefro app validate` on the good package

```bash
cargo run -p qefro-cli -- app validate \
  /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk
```

Captured output:

```text
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 0.10s
     Running `target/debug/qefro app validate /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk`
dev ok: project-desk@0.1.0 hosting=runtime workflows=4 (metadata package, no SDK process)
  path: metadata → Qefro Runtime → FlowRunner → RuntimeAdapter → entity storage or generic HTTP
built project-desk@0.1.0
  checksum:  bfe04730a2633fd29d17c6d09c1ef26abb07bc7cd7aa553bd08926d71e1871af
  signature: 8495ca87cd524048c160930aa50c87af19744018c467a176b65ec7fa76253330fa9f28dc32630f26202217f14d367ec0a16929e6d0fd68d4e14b668df01d5e0d
  package:   /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk/dist/package.json
  package signed successfully
```

### `qefro app validate` on the minimal package

A smaller example lives at
[`qefro-documentation/examples/marketplace-handbook/minimal`](file:///Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/minimal):

```bash
cargo run -p qefro-cli -- app validate \
  /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/minimal
```

```text
dev ok: handbook-minimal@0.1.0 hosting=runtime workflows=1 (metadata package, no SDK process)
  path: metadata → Qefro Runtime → FlowRunner → RuntimeAdapter → entity storage or generic HTTP
built handbook-minimal@0.1.0
  checksum:  4a8db96808583d6ae8a8251623c4296c3882e110822ec96434b0a90d5dfaf39d
  signature: 6c6d28821ef88f2ed317fa4ef40dd30d10df8d57e6c96bfc5421921c365d0ba867279fe5ceabf126014ef811faf83e2d7fcfc96ef010cc289ac1a9037e95190e
  package:   /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/minimal/dist/package.json
  package signed successfully
```

### `qefro solution build`

Same tree, no validation side effects:

```bash
cargo run -p qefro-cli -- solution build \
  /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk
```

```text
built project-desk@0.1.0
  checksum:  bfe04730a2633fd29d17c6d09c1ef26abb07bc7cd7aa553bd08926d71e1871af
  signature: 8495ca87cd524048c160930aa50c87af19744018c467a176b65ec7fa76253330fa9f28dc32630f26202217f14d367ec0a16929e6d0fd68d4e14b668df01d5e0d
  package:   /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk/dist/package.json
```

## What `qefro app validate` actually checks

Read
[`qefro-cli/src/main.rs:1418-1484`](file:///Users/abu/qefro/qefro-plugin-platform/services/qefro-cli/src/main.rs#L1418-L1484)
`app_dev`. It only asserts:

| Check | Fires when |
| --- | --- |
| `manifest.yaml` or `solution.yaml` exists | It does not |
| `manifest.id` is present | Missing |
| `hosting` is not `managed` | It is |
| `workflows/` is a directory | It is not |
| When `hosting: runtime`: `entities/` is a directory | It is not |
| When `hosting: external`: `src/` is a directory | It is not |

:::warning "Validates cleanly" is not "publishable"
`qefro app validate` does **not** call `parse_and_validate`. A package can
pass this command and then fail `qefro solution publish` on any of the
publish-side gates documented in
[Runtime capabilities](/docs/solutions/runtime-capabilities) and
[Permissions and scope](/docs/solutions/permissions-and-scope).
:::

The CLI's own help text —
`qefro app validate [dir]  Validate package locally (alias of qefro dev)` —
overstates what the command does. Use the checks below before publishing.

## Real failures you can reproduce

The commands below mutate a copy of the good package and re-run it. Each one
shows what the CLI accepts today and what publish refuses. The publish-side
refusal is quoted from source, not observed.

### Failure 1 — forbidden authority field

```bash
TMP=/tmp/pd-bad-$(date +%s)
cp -r qefro-documentation/examples/marketplace-handbook/project-desk $TMP
python3 - <<'PY'
import os
p = "/tmp/pd-bad-PLACEHOLDER/entities/task.yaml"
p = p.replace("PLACEHOLDER", os.environ["STAMP"])
txt = open(p).read()
open(p, "w").write(txt.replace(
  "  - name: title",
  "  - name: workspace_id\n    type: string\n    label: Bad\n  - name: title"))
PY
STAMP=$TMP cargo run -p qefro-cli -- app validate $TMP
```

Captured CLI output on the working tree (2026-10-18):

```text
dev ok: project-desk@0.1.0 hosting=runtime workflows=4 (metadata package, no SDK process)
  path: metadata → Qefro Runtime → FlowRunner → RuntimeAdapter → entity storage or generic HTTP
built project-desk@0.1.0
  ...
  package signed successfully
```

**The CLI accepts it.** Publish refuses
([`solution/entities.rs:348-358`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/entities.rs#L348-L358))
with:

```text
entities: entity 'task' field 'workspace_id' is reserved for trusted runtime context
          (metadata cannot specify workspace/tenant authority)
```

### Failure 2 — malformed permission

Replace a `manifest.permissions[]` entry with `storage_update` (no dot). The
CLI passes; publish refuses with
``invalid permission 'storage_update': expected `resource.action` ``
([`manifest.rs:914-935`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/manifest.rs#L914-L935)).

### Failure 3 — unknown step type

Add a step `type: exec`. The CLI passes; publish refuses with
`{file}: unknown step type 'exec' in step '{id}'`
([`workflows.rs:180-185`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/workflows.rs#L180-L185)).

### Failure 4 — undeclared workflow reference in trigger

Point `triggers[].workflow` at a flow that is not in `flows[]`. Publish
refuses with `trigger '{id}' references workflow '{workflow}' not declared
in flows`
([`validator.rs:237-300`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/validator.rs#L237-L300)).

### Failure 5 — connector step referencing an undeclared connector

Remove `whatsapp` from `manifest.connectors[]` but keep the onboarding step
that connects it. Publish refuses with
`step 'connect_whatsapp' references connector 'whatsapp' not declared in the
manifest`.

### Failure 6 — unknown UI capability

Set `ui.capabilities: [database.read]`. Publish refuses with
`ui: unknown capability 'database.read'`
([`solution/ui.rs:103-111`](file:///Users/abu/qefro/qefro-plugin-platform/services/solution-service/src/solution/ui.rs#L103-L111)).

### Failure 7 — host-routed forbidden storage tool

Set `workflows/create-task.yaml`'s `tool: entity.task.create` to
`tool: storage/insert`. The `app_dev` path (`main.rs:1418` does not actually
invoke `reject_forbidden_storage_targets`, but the assembled-package path at
`main.rs:349-397` fires when invoked via `app_dev` after `load_package`)
refuses:

```text
workflow 'create-task': step targets forbidden platform storage 'storage/insert'
  (ADR-003: call app tools; persist via ctx.storage in the SDK app)
```

:::warning The ADR-003 guard is uneven
`reject_forbidden_storage_targets` is called on the `app_dev` flow (via the
load → assemble → check chain at `main.rs:349-397`), but **not** on
`solution build` (`main.rs:295-330`). A package built with `solution build`
can contain a `storage/insert` step and get to publish, where
solution-service's own `workflows.rs` check at `:191-195` fires — but only
on the `tool` string, not on `connector`. See
[Runtime capabilities §1c](/docs/solutions/runtime-capabilities#1c--step-type-vocabulary).
:::

## Real end-to-end: publish, install, exercise

Not executed on this working tree. Recording what would be needed, so the
handbook is honest about the gap.

To complete this example live, you would run:

```bash
export QEFRO_SOLUTION_URL=https://…/api/solution-service
export QEFRO_TENANT_ID=…
export QEFRO_ORGANIZATION_ID=…
export QEFRO_PUBLISHER_ID=…     # must be in QEFRO_PLATFORM_ADMIN_IDS
export QEFRO_SIGNING_KEY_HEX=…  # Ed25519 key matching a registered kid
cargo run -p qefro-cli -- solution publish \
  /Users/abu/qefro/qefro-documentation/examples/marketplace-handbook/project-desk
cargo run -p qefro-cli -- solution install project-desk \
  --settings '{"business_name":"Acme Studio","timezone":"Asia/Kolkata","currency":"INR"}'
```

Then send "Create a task called Draft handbook in Project Atlas" to the
workspace's WhatsApp number. The `create_task` trigger routes to the
`create-task` workflow. FlowRunner asks for `project_name`, then `task_title`
(rendered via the `task-intake` prompt), then `assignee`, then invokes
`entity.task.create` through `RuntimeAdapter`. The task record appears in
the portal at `/installations/project-desk/ui`.

**Status: PENDING.** None of the above was executed for this handbook.
Publishing writes to a shared catalog. Installing mutates tenant state. The
end-to-end claim requires a live ACS. All three boundaries are traced to
code; none are observed at runtime here.

## What you have after this walkthrough

- A signed `dist/package.json` artifact built by the real CLI, checksum
  `bfe04730a2633fd29d17c6d09c1ef26abb07bc7cd7aa553bd08926d71e1871af`.
- Seven concrete failures that the CLI does **not** catch and publish **does**
  refuse.
- The verbatim error strings for each refusal.
- An honest picture of what the local `qefro` commands do and do not check.

## Related pages

- [Handbook](/docs/solutions/handbook)
- [Package structure](/docs/solutions/package-structure)
- [Attribute inventory](/docs/solutions/attribute-inventory)
- [Auxiliary components reference](/docs/solutions/auxiliary-reference)
- [Settings reference](/docs/solutions/settings-reference)
- [Runtime capabilities](/docs/solutions/runtime-capabilities)
- [Permissions and scope](/docs/solutions/permissions-and-scope)
- [Validation](/docs/solutions/validation)
- [Troubleshooting](/docs/solutions/troubleshooting)
