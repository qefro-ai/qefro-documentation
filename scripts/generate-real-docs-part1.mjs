#!/usr/bin/env node
/**
 * Regenerate documentation pages from the real Qefro implementation.
 * Sources: api routes, portal Widget.tsx, domain plans/RBAC, widget identity.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docs = path.join(__dirname, '..', 'docs');

function ensureDir(p) {
  fs.mkdirSync(p, {recursive: true});
}
function write(rel, content) {
  const full = path.join(docs, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content.trimStart() + '\n');
  console.log('wrote', rel);
}

const IMPORTS = `import {
  InfoBox,
  Warning,
  Success,
  RelatedTopics,
  FaqAccordion,
  WorkflowCard,
  ApiEndpointCard,
  ComparisonTable,
} from '@site/src/components';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';`;

function shell(title, description, body) {
  return `---
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
sidebar_label: ${JSON.stringify(title)}
---

${IMPORTS}

# ${title}

${body}
`;
}

// ---------------------------------------------------------------------------
// Getting started
// ---------------------------------------------------------------------------
write(
  'getting-started/installation.mdx',
  shell(
    'Installation',
    'Create a Qefro organization at app.qefro.com — cloud hosted, no local RAG stack required.',
    `
**Installation** for Qefro cloud means signing up at [app.qefro.com](https://app.qefro.com), verifying email, and creating an organization (tenant). You do not install vector databases, LLM gateways, or RAG infrastructure yourself.

## Introduction

Qefro is a multi-tenant SaaS platform. Production hosts:

| Surface | URL |
| --- | --- |
| Marketing | https://qefro.com |
| Admin Console | https://app.qefro.com |
| API | https://api.qefro.com |
| Widget CDN | https://cdn.qefro.com/widget.js |
| Internal Portal | \`{slug}.qefro.com\` (or custom domain) |

## Why it exists

Teams need Customer AI and Employee AI without operating embedding pipelines, hybrid search, or tool-execution sandboxes.

## Concepts

- **Organization / tenant** — billing and isolation boundary created at signup
- **Admin Console** — configure workspaces, knowledge, Business Tools, channels, RBAC
- **Workspace** — isolated knowledge + tools + conversations (e.g. Customer Support, HR)
- **Plan** — Free, Starter, Growth, Enterprise (Razorpay billing)

## Architecture

\`\`\`mermaid
flowchart LR
  Signup[app.qefro.com signup] --> Org[Organization / tenant]
  Org --> Console[Admin Console]
  Console --> WS[Workspaces]
  WS --> API[api.qefro.com]
  API --> Exp[Widget / Portal / WhatsApp]
\`\`\`

## Workflow

<WorkflowCard
  title="Cloud setup"
  steps={[
    {title: 'Register', description: 'Create an account at app.qefro.com with a work email.'},
    {title: 'Verify email', description: 'Complete OTP / email verification before inviting teammates.'},
    {title: 'Create organization', description: 'Choose a display name and tenant slug (used for {slug}.qefro.com).'},
    {title: 'Open Admin Console', description: 'Create your first workspace and upload knowledge.'},
  ]}
/>

## Code examples

<Tabs>
  <TabItem value="bash" label="Bash" default>

\`\`\`bash
# Health (no auth)
curl -sS https://api.qefro.com/health

# Ready (dependencies)
curl -sS https://api.qefro.com/ready
\`\`\`

  </TabItem>
  <TabItem value="ts" label="TypeScript">

\`\`\`typescript
const res = await fetch('https://api.qefro.com/health');
console.log(await res.text());
\`\`\`

  </TabItem>
</Tabs>

## Best practices

- Use a real company email for ownership and billing
- Enable MFA / strong passwords on Owner accounts before connecting production APIs
- Prefer separate workspaces for Customer Support vs internal HR/IT

## Security notes

<Warning>
Never put long-lived Business Tool secrets or Admin Console JWTs in website JavaScript. Widget embeds use a publishable widget token; tool credentials stay encrypted server-side.
</Warning>

## FAQ

<FaqAccordion items={[
  {question: 'Do I need Docker?', answer: 'Not for Qefro cloud. Private / Enterprise deployment is a separate conversation with Sales.'},
  {question: 'Where is GraphQL?', answer: 'Primary Admin Console API is GraphQL at POST https://api.qefro.com/graphql (authenticated). REST covers uploads, billing, tools, widget, WhatsApp, and org RBAC.'},
]} />

## Related topics

<RelatedTopics topics={[
  {label: 'Quick Start', to: '/docs/getting-started/quick-start'},
  {label: 'Organizations', to: '/docs/platform/organizations'},
  {label: 'Authentication', to: '/docs/platform/authentication'},
  {label: 'API Authentication', to: '/docs/api/authentication'},
]} />
`,
  ),
);

write(
  'getting-started/quick-start.mdx',
  shell(
    'Quick Start',
    'Create a workspace, upload documents, test chat, then embed the website widget.',
    `
**Quick Start** gets you from an empty organization to cited answers in the Admin Console, then optionally to a live website widget.

## Introduction

In Qefro, knowledge is scoped to a **workspace**. Customer AI (widget / WhatsApp) and Employee AI (Internal Portal) both bind to workspaces you configure in the Admin Console.

## Why it exists

Validating retrieval quality before connecting Business Tools or public channels avoids shipping an inaccurate assistant.

## Concepts

- **Document** — PDF, DOCX, Markdown, TXT, or crawled pages; chunked and indexed with hybrid BM25 + vector retrieval
- **Citation** — answers include source references; the model is instructed to refuse when no relevant source exists
- **Widget token** — publishable embed key from **Widget** in the Admin Console (rotatable)

## Architecture

\`\`\`mermaid
sequenceDiagram
  participant You
  participant Console as Admin Console
  participant API as api.qefro.com
  participant RAG as Knowledge Platform
  You->>Console: Create workspace
  You->>Console: Upload PDF / crawl site
  Console->>API: GraphQL + POST /api/v1/documents
  API->>RAG: Chunk, embed, index
  You->>Console: Test chat
  API->>RAG: Hybrid retrieve
  RAG-->>You: Answer + citations
\`\`\`

## Workflow

<WorkflowCard
  title="First productive workspace"
  steps={[
    {title: 'Create workspace', description: 'Admin Console → Workspaces (e.g. Customer Support).'},
    {title: 'Add knowledge', description: 'Documents → upload files or start a website crawl.'},
    {title: 'Set instructions', description: 'Define tone, languages, and refusal behavior for the assistant.'},
    {title: 'Test in console', description: 'Ask in-scope and out-of-scope questions; check citations.'},
    {title: 'Embed widget (optional)', description: 'Widget page → copy script with data-token and data-workspace-id.'},
  ]}
/>

## Code examples

Website embed (values come from Admin Console → Widget):

\`\`\`html
<script
  src="https://cdn.qefro.com/widget.js"
  data-token="YOUR_WIDGET_TOKEN"
  data-endpoint="https://api.qefro.com"
  data-theme="auto"
  data-position="bottom-right"
  data-workspace-id="YOUR_WORKSPACE_ID">
</script>
\`\`\`

## Best practices

- Start with 5–20 high-quality docs, not a full drive dump
- Keep customer-facing and employee knowledge in separate workspaces
- Test refusal: ask something outside the corpus

## Security notes

<InfoBox>
Workspace knowledge is isolated. HR documents must not answer Customer Support widget questions.
</InfoBox>

## FAQ

<FaqAccordion items={[
  {question: 'How long until uploads are searchable?', answer: 'Usually seconds to a few minutes depending on size and OCR.'},
  {question: 'Is chat WebSocket or HTTP?', answer: 'The widget prefers WebSocket at /ws/chat?token=… with HTTP SSE fallback at POST /api/v1/widget/chat.'},
]} />

## Related topics

<RelatedTopics topics={[
  {label: 'AI Workspaces', to: '/docs/platform/ai-workspaces'},
  {label: 'Knowledge Platform', to: '/docs/platform/knowledge-platform'},
  {label: 'Website Widget', to: '/docs/platform/website-widget'},
  {label: 'Build AI Customer Support', to: '/docs/guides/build-ai-customer-support'},
]} />
`,
  ),
);

console.log('getting-started done');
