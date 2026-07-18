---
slug: ai-workspaces-architecture
title: How AI Workspaces isolate knowledge and actions
authors: [abu]
tags: [architecture, ai]
---

An **AI Workspace** is the primary isolation unit inside a Qefro organization: knowledge, instructions, Business Tools, and conversations stay scoped.

<!-- truncate -->

Cross-workspace leakage is a design failure mode for multi-team AI. Qefro treats each workspace as its own retrieval and action boundary so Customer Support content does not answer HR questions and vice versa.

Read [AI Workspaces](/docs/platform/ai-workspaces) and [Tenant Isolation](/docs/security/tenant-isolation).
