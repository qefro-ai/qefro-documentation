---
title: "Markdown widget"
description: "The markdown widget — static narrative content rendered safely, capped at 20 KB."
sidebar_label: "Markdown"
---

# Markdown widget

The `markdown` widget renders static narrative — reporting notes, SOPs,
policy summaries. It is the only widget kind with **no data source**: the
content ships in the package itself.

## Definition

```yaml title="ui/widgets.yaml (excerpt)"
- id: reports_markdown
  type: markdown
  title: Reporting notes
  options:
    content: |
      ## How reports work

      Revenue is reconciled nightly against the POS connector. Payments
      that fail to settle are surfaced on the **Payments** page and emit a
      `ui.action` event for audit.

      - **Executions** reflect workflow runs on the solution runtime.
      - **Revenue** is grouped per day by the `payments` data source.
      - All queries are capability-gated (`runtime.query` / `connector.invoke`).
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Widget id referenced by page placements. |
| `type` | string | Yes | `markdown`. |
| `title` | string | Yes | Card header. |
| `options.content` | string | Yes | Markdown body, capped at **20 KB**. |

Note: `markdown` widgets declare no `source` — they never fetch.

## Safe rendering

Content is rendered by the portal's markdown renderer with a strict
allow-list:

- headings, lists, emphasis, inline code, tables and blockquotes render,
- raw HTML is stripped,
- links render as plain text references — no executable content, ever.

This enforces the platform rules at the content level: no JavaScript, no
DOM access, no iframes. See [Security](/docs/solutions/security).

## Restaurant Pro usage

Companion pane beside the revenue trend on the Reports page:

```yaml title="ui/pages.yaml (excerpt)"
- id: reports
  layout: split-grid
  widgets:
    - { widget: revenue_chart, span: 8 }
    - { widget: reports_markdown, span: 4 }
```

## Guidelines

- Use markdown for *stable* operational context (how numbers are
  computed, escalation policy). Live numbers belong in `metric`, `table`
  and `chart` widgets.
- Keep content well under the 20 KB cap; split long documents across
  several placements or pages.
- Reference widget names and page names as users see them — this is often
  the only in-app documentation a tenant gets.
- Updates to markdown content are package changes: publish a new version
  and let tenants upgrade. See [Publishing](/docs/solutions/publishing).

## Related topics

- [Pages](/docs/solutions/pages)
- [Events](/docs/solutions/events) — the `ui.action` audit events mentioned above
- [restaurant-pro example](/docs/solutions/examples/restaurant-pro)
