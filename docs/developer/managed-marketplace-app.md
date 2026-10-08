---
title: "Marketplace App Development"
description: "Tutorial: build, validate, package, publish, and install a metadata Marketplace App (hosting: runtime) into Qefro Runtime."
sidebar_label: "Marketplace App tutorial"
---

# Marketplace App Development

This tutorial guides you through building a complete Qefro Marketplace App as **pure declarative metadata** (`hosting: runtime`), publishing it to the catalog, and executing it within **Qefro Runtime**.

You do **not** write a backend server or `/qefro` process for this path.

---

## 1. Prerequisites

- The `qefro` CLI installed on your system.
- Familiarity with YAML and your business domain's data models.
- Platform administrator credentials (`QEFRO_PUBLISHER_ID` and `QEFRO_SIGNING_KEY_HEX`) if publishing to a production catalog.

---

## 2. Initialize the App

Create a new application metadata structure using the generator:

```bash
qefro app init clinic-pro --name "Clinic Pro"
cd clinic-pro
```

This generates the standard metadata directory layout:

```text
clinic-pro/
├── manifest.yaml          # Package metadata, permissions, channels, events
├── entities/              # Entity schemas for runtime managed storage
│   ├── patient.yaml
│   ├── doctor.yaml
│   └── appointment.yaml
├── workflows/             # Business Flows executed by FlowRunner
│   ├── book-appointment.yaml
│   └── cancel-appointment.yaml
└── ui/                    # Declarative staff portal views
    ├── theme.yaml
    ├── navigation.yaml
    ├── pages.yaml
    ├── layouts.yaml
    ├── widgets.yaml
    └── sources.yaml
```

---

## 3. Define the Manifest

```yaml title="manifest.yaml"
id: clinic-pro-runtime
name: Clinic Pro
version: 0.1.0
hosting: runtime                # Executed natively by Qefro Runtime
description: Clinical operations, patient records, and appointment scheduling.
category: healthcare
tags:
  - clinic
  - medical
  - appointments

channels:
  - widget
  - whatsapp

entities:
  - patient
  - doctor
  - appointment

flows:
  - book-appointment
  - cancel-appointment

events:
  - appointment.created
  - appointment.cancelled

permissions:
  - workflow.execute
  - storage.read
  - storage.write
  - storage.update
  - storage.delete

triggers:
  - id: book_appointment
    workflow: book-appointment
    match:
      intents:
        - book an appointment
        - schedule a visit
        - see a doctor
```

---

## 4. Define Entities (`entities/*.yaml`)

Entities represent your business data models and are persisted in triple-keyed runtime storage:

```yaml title="entities/appointment.yaml"
id: appointment
name: Appointment
allocate_code:
  prefix: APT-
  start: 1001

concurrency: optimistic

availability:
  booking:
    datetime_field: scheduled_at
    duration_minutes: 30
    capacity:
      mode: exclusive
      resource:
        field: doctor_id

fields:
  - name: patient_name
    type: string
    required: true

  - name: doctor_id
    type: relation
    ref_entity: doctor
    required: true

  - name: scheduled_at
    type: datetime
    required: true

  - name: status
    type: enum
    enum_values:
      - scheduled
      - confirmed
      - completed
      - cancelled
    default: scheduled

  - name: person_id
    type: person
    description: "Binds record to Customer Hub Person"
```

---

## 5. Define Workflows (`workflows/*.yaml`)

Workflows execute on FlowRunner using native runtime capabilities:

```yaml title="workflows/book-appointment.yaml"
id: book-appointment
name: Book Appointment
steps:
  - id: ask_doctor
    type: ask
    prompt: "Which doctor would you like to see?"
    choices_from:
      entity: doctor
      filter:
        status: active
      label_field: name
      value_field: id

  - id: check_slots
    type: tool
    tool: entity.appointment.availability
    execution: runtime
    input_map:
      kind: "$literal:slots"
      resource: ask_doctor

  - id: ask_slot
    type: ask
    prompt: "Please select an available appointment time:"
    choices_from:
      variable: check_slots.items
      label_field: label
      value_field: start_at

  - id: create_record
    type: tool
    tool: entity.appointment.create
    execution: runtime
    input_map:
      doctor_id: ask_doctor
      scheduled_at: ask_slot
      status: "$literal:scheduled"

  - id: confirm
    type: complete
    message: "Your appointment has been confirmed with {{ask_doctor}} for {{ask_slot}}. Reference: {{create_record.code}}."
```

---

## 6. Define Staff UI (`ui/*.yaml`)

Define responsive dashboards, tables, and forms without writing frontend code:

```yaml title="ui/pages.yaml"
- id: appointments
  title: Appointments
  layout: table
  source: appointments_source
  columns:
    - field: code
      header: Reference
    - field: patient_name
      header: Patient
    - field: scheduled_at
      header: Time
    - field: status
      header: Status

- id: doctors
  title: Doctors
  layout: table
  source: doctors_source
```

```yaml title="ui/sources.yaml"
- id: appointments_source
  type: entity
  target: appointment

- id: doctors_source
  type: entity
  target: doctor
```

---

## 7. Validate, Package & Publish

```bash
# Validate metadata structure and types
qefro app validate .

# Package and sign the distribution artifact
qefro app package .

# Publish to the global Marketplace catalog (Platform Admin)
qefro app publish .
```

---

## 8. Workspace Installation

Once published, tenant administrators can install the app directly into any AI Workspace:

```bash
qefro app install clinic-pro-runtime --version 0.1.0
```

Upon installation:
1. The metadata package is verified via its Ed25519 signature.
2. The UI bundle is registered for the workspace.
3. Entities are initialized with triple-scoped runtime storage.
4. Workflows are registered with FlowRunner.
5. Channels (Widget, WhatsApp, Instagram) begin routing conversational requests to the new flows.

---

## Related Documentation

- [Build Your First App Walkthrough](/docs/solutions/build-your-first-app)
- [Entity Schemas & Data Model](/docs/solutions/entity-schema)
- [FlowRunner State Machine](/docs/developer/concepts/flows)
- [Concurrency & Booking Integrity](/docs/solutions/concurrency-and-booking)
- [Publishing to the Registry](/docs/solutions/publishing)
