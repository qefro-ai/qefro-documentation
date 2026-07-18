---
slug: ai-workspaces-architecture
title: How AI Workspaces isolate knowledge and actions
description: Why AI Workspaces are the isolation unit for knowledge, Business Tools, and conversations inside a Qefro organization.
authors: [abu]
tags: [architecture, ai]
---

An **AI Workspace** is the primary isolation unit inside a Qefro organization: knowledge, instructions, Business Tools, and conversations stay scoped.

<!-- truncate -->

Cross-workspace leakage is a design failure mode for multi-team AI. Qefro treats each workspace as its own retrieval and action boundary so Customer Support content does not answer HR questions and vice versa.

Read [What is an AI Workspace?](/docs/concepts/what-is-an-ai-workspace), [AI Workspaces](/docs/platform/ai-workspaces), [Multi-tenant AI Architecture](/docs/concepts/multi-tenant-ai-architecture), and [Tenant Isolation](/docs/security/tenant-isolation).
