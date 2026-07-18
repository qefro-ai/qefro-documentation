#!/usr/bin/env node
/**
 * Generates documentation MDX pages with consistent GEO-optimized structure.
 * Run: node scripts/generate-docs.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const docs = path.join(root, 'docs');

function ensureDir(p) {
  fs.mkdirSync(p, {recursive: true});
}

function write(rel, content) {
  const full = path.join(docs, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content.trimStart() + '\n');
  console.log('wrote', rel);
}

function page({
  title,
  description,
  summary,
  intro,
  why,
  concepts,
  architecture,
  mermaid,
  workflow,
  code,
  practices,
  security,
  faq,
  related,
  slug,
}) {
  const relatedJson = JSON.stringify(
    related.map(([label, to]) => ({label, to})),
    null,
    2,
  );
  const faqJson = JSON.stringify(
    faq.map(([q, a]) => ({question: q, answer: a})),
    null,
    2,
  );

  return `---
sidebar_label: ${JSON.stringify(title)}
title: ${JSON.stringify(title)}
description: ${JSON.stringify(description)}
---

import {
  InfoBox,
  Warning,
  RelatedTopics,
  FaqAccordion,
  WorkflowCard,
} from '@site/src/components';

# ${title}

${summary}

## Introduction

${intro}

## Why it exists

${why}

## Concepts

${concepts}

## Architecture

${architecture}

\`\`\`mermaid
${mermaid}
\`\`\`

## Workflow

${workflow}

## Code examples

${code}

## Best practices

${practices}

## Security notes

${security}

## FAQ

<FaqAccordion items={${faqJson}} />

## Related topics

<RelatedTopics topics={${relatedJson}} />
`;
}

// Remove default intro
const introPath = path.join(docs, 'intro.md');
if (fs.existsSync(introPath)) fs.unlinkSync(introPath);
['tutorial-basics', 'tutorial-extras'].forEach((d) => {
  const p = path.join(docs, d);
  if (fs.existsSync(p)) fs.rmSync(p, {recursive: true, force: true});
});

const pages = [
  {
    slug: 'getting-started/installation.mdx',
    title: 'Installation',
    description:
      'How to create a Qefro account, open the Admin Console, and prepare your first organization.',
    summary:
      '**Installation** means creating your Qefro organization and accessing the Admin Console at app.qefro.com — no self-hosted infrastructure is required for the cloud product.',
    intro:
      'Qefro is delivered as a multi-tenant cloud platform. You sign up, create an organization, and configure AI Workspaces from the Admin Console. Optional self-hosted and private deployment options are available for Enterprise customers.',
    why: 'Teams need a low-friction path from signup to a working workspace without standing up vector databases, LLM gateways, or RAG pipelines themselves.',
    concepts: `- **Organization** — your company tenant on Qefro
- **Admin Console** — \`https://app.qefro.com\` for configuration
- **Workspace** — an isolated AI context (for example Customer Support or HR)
- **Plan** — Free, Starter, Growth, or Enterprise limits`,
    architecture: 'Cloud signup creates a tenant, default Free plan, and empty workspace capacity ready for knowledge and tools.',
    mermaid: `flowchart LR
  A[Sign up] --> B[Organization]
  B --> C[Admin Console]
  C --> D[Create Workspace]
  D --> E[Upload Knowledge]`,
    workflow: `<WorkflowCard
  title="Install (cloud)"
  steps={[
    {title: 'Create account', description: 'Register at app.qefro.com with a work email.'},
    {title: 'Verify email', description: 'Confirm ownership so invitations and billing work.'},
    {title: 'Name organization', description: 'Choose a display name and optional subdomain.'},
    {title: 'Invite admins', description: 'Add Owners/Admins before production changes.'},
  ]}
/>`,
    code: `\`\`\`bash
# Open the Admin Console
open https://app.qefro.com

# API base (authenticated requests)
export QEFRO_API=https://api.qefro.com
\`\`\`

\`\`\`typescript
// Example: health check against the public API host
const res = await fetch('https://api.qefro.com/health');
console.log(await res.text());
\`\`\``,
    practices: `- Use a shared admin mailbox only if audit ownership is clear
- Enable MFA for Owner accounts before connecting production APIs
- Create separate workspaces for Customer Support vs internal HR/IT`,
    security: `<Warning>
Never embed long-lived API secrets in website JavaScript. Use the widget JWT flow and server-side Business Tools credentials instead.
</Warning>`,
    faq: [
      ['Do I need to install Docker locally?', 'Not for the cloud product. Docker is relevant only for private/Enterprise deployments.'],
      ['Is there a free plan?', 'Yes. Free includes limited conversations and one business system connection for evaluation.'],
    ],
    related: [
      ['Quick Start', '/docs/getting-started/quick-start'],
      ['Organizations', '/docs/platform/organizations'],
      ['Deployment', '/docs/platform/deployment'],
    ],
  },
  {
    slug: 'getting-started/quick-start.mdx',
    title: 'Quick Start',
    description:
      'Create an AI Workspace, upload knowledge, and chat in under 15 minutes.',
    summary:
      '**Quick Start** walks through creating a workspace, adding documents, and testing Customer AI in the Admin Console.',
    intro:
      'This guide produces a working AI Workspace grounded on your documents. You will not yet expose a public widget or WhatsApp channel — that comes in the deploy guides.',
    why: 'A short path from empty tenant to cited answers validates retrieval quality before you connect actions or channels.',
    concepts: `- **Document** — PDF, DOCX, Markdown, TXT, or crawled page
- **Citation** — source reference returned with answers
- **Instruction** — system guidance for tone and scope`,
    architecture: 'Upload → chunk/embed → hybrid retrieve → generate with citations.',
    mermaid: `sequenceDiagram
  participant Admin
  participant Console
  participant Knowledge
  participant AI
  Admin->>Console: Create workspace
  Admin->>Knowledge: Upload PDF
  Admin->>AI: Ask test question
  AI->>Knowledge: Retrieve chunks
  AI-->>Admin: Answer + citations`,
    workflow: `<WorkflowCard
  title="First workspace"
  steps={[
    {title: 'Create workspace', description: 'Name it (e.g. Customer Support).'},
    {title: 'Upload docs', description: 'Add policies, FAQs, and product guides.'},
    {title: 'Set instructions', description: 'Define tone, language, and refusal behavior.'},
    {title: 'Test chat', description: 'Ask questions that should and should not be answerable.'},
  ]}
/>`,
    code: `\`\`\`json
{
  "workspace": "customer-support",
  "instructions": "Answer only from knowledge. Cite sources. Refuse when unsure."
}
\`\`\``,
    practices: `- Start with 5–20 high-quality documents, not an entire drive dump
- Test refusal: ask something outside the corpus
- Keep Customer Support and Employee AI in separate workspaces`,
    security: `<InfoBox>
Workspace knowledge is isolated. Documents in HR must not appear in Customer Support answers.
</InfoBox>`,
    faq: [
      ['How long until documents are searchable?', 'Usually seconds to a few minutes depending on size and OCR.'],
      ['Can I use website crawl instead of upload?', 'Yes — see Knowledge Platform.'],
    ],
    related: [
      ['AI Workspaces', '/docs/platform/ai-workspaces'],
      ['Knowledge Platform', '/docs/platform/knowledge-platform'],
      ['Build AI Customer Support', '/docs/guides/build-ai-customer-support'],
    ],
  },
];

// Platform pages metadata
const platformTopics = [
  ['ai-workspaces', 'AI Workspaces', 'Isolated AI contexts with their own knowledge, instructions, actions, and conversations.', 'An **AI Workspace** is a scoped AI environment for a team or use case inside a Qefro organization.', 'org→workspace→knowledge+tools+rbac', `flowchart TB
  Org[Organization] --> WS1[Workspace: Support]
  Org --> WS2[Workspace: HR]
  WS1 --> K1[Knowledge]
  WS1 --> T1[Business Tools]
  WS2 --> K2[Knowledge]
  WS2 --> T2[Business Tools]`],
  ['customer-ai', 'Customer AI', 'External-facing assistants on website widget and WhatsApp.', '**Customer AI** is Qefro’s external assistant experience for end customers.', 'channels→workspace→knowledge/actions', `flowchart LR
  W[Website Widget] --> WS[Support Workspace]
  WA[WhatsApp] --> WS
  WS --> RAG[Knowledge]
  WS --> ACT[Business Actions]`],
  ['employee-ai', 'Employee AI', 'Internal assistants via branded Internal Portal.', '**Employee AI** serves staff through the Internal Portal with RBAC-aware knowledge and actions.', 'portal→auth→workspace', `flowchart LR
  Emp[Employee] --> Portal[Internal Portal]
  Portal --> Auth[Auth / Teams]
  Auth --> WS[Workspace]
  WS --> Actions[Permitted Actions]`],
  ['knowledge-platform', 'Knowledge Platform', 'Hybrid BM25+vector RAG with OCR, crawl, citations, and isolation.', 'The **Knowledge Platform** indexes organizational content for retrieval-augmented generation.', 'ingest→index→retrieve→cite', `flowchart LR
  Docs[Docs/Crawl/OCR] --> Index[Hybrid Index]
  Index --> Retrieve[Retrieve]
  Retrieve --> Cite[Answer + Citations]`],
  ['business-actions', 'Business Actions', 'Secure execution of tools against customer systems of record.', 'A **Business Action** is an AI-invoked call to a Business Tool (REST/OpenAPI) under policy.', 'intent→authorize→execute→log', `sequenceDiagram
  participant User
  participant AI
  participant Policy
  participant Tool
  User->>AI: Request order status
  AI->>Policy: Authorize action
  Policy->>Tool: Call REST API
  Tool-->>AI: Result
  AI-->>User: Answer`],
  ['business-tools', 'Business Tools', 'REST connectors and OpenAPI imports with encrypted credentials.', '**Business Tools** are the configured connectors that power Business Actions.', 'openapi/rest→secrets→workspace binding', `flowchart TB
  OpenAPI[OpenAPI Import] --> Tool[Business Tool]
  REST[Manual REST] --> Tool
  Tool --> Secret[Encrypted Credentials]
  Tool --> WS[Workspace Binding]`],
  ['internal-portal', 'Internal Portal', 'Branded employee chat experience on yourcompany.qefro.com.', 'The **Internal Portal** is the employee-facing web app for Employee AI.', 'branding→auth→workspaces', `flowchart LR
  DNS[Custom Domain] --> Portal
  Portal[Internal Portal] --> Workspaces
  Workspaces --> Chat`],
  ['website-widget', 'Website Widget', 'Embeddable chat with short-lived JWT auth and optional identify().', 'The **Website Widget** embeds Customer AI on your site.', 'embed→jwt→stream', `sequenceDiagram
  participant Site
  participant Widget
  participant API
  Site->>Widget: Load script
  Widget->>API: Auth JWT
  Widget->>API: Chat WebSocket`],
  ['whatsapp', 'WhatsApp', 'Customer AI over WhatsApp (Growth+).', '**WhatsApp** connects Meta Cloud API messaging to a Qefro workspace.', 'webhook→workspace→reply', `flowchart LR
  User --> Meta[Meta Cloud API]
  Meta --> Qefro[Qefro Webhook]
  Qefro --> WS[Workspace]
  WS --> Meta`],
  ['authentication', 'Authentication', 'How humans and services authenticate to Qefro.', '**Authentication** verifies Admin Console users, portal employees, and API clients.', 'session/jwt/api key', `flowchart TB
  Admin[Admin Console] --> Session[Session Auth]
  Portal[Internal Portal] --> Session
  Widget[Widget] --> JWT[Short-lived JWT]
  API[REST API] --> Bearer[Bearer Token]`],
  ['identity-forwarding', 'Identity Forwarding', 'Pass end-user identity into Business Actions via identify().', '**Identity Forwarding** attaches verified end-user identity so actions run as that user.', 'identify→claims→tool headers', `sequenceDiagram
  participant App
  participant Widget
  participant Qefro
  participant CRM
  App->>Widget: identify(jwt)
  Widget->>Qefro: Chat + identity
  Qefro->>CRM: API with forwarded identity`],
  ['organizations', 'Organizations', 'Tenant boundary for billing, users, and workspaces.', 'An **Organization** is the top-level tenant in Qefro.', 'tenant isolation', `flowchart TB
  Org --> Users
  Org --> Workspaces
  Org --> Billing
  Org --> Branding`],
  ['teams', 'Teams', 'Group users for collaboration and access patterns.', '**Teams** organize members inside an organization for workspace access.', 'team→workspace roles', `flowchart LR
  Team[Team] --> Members
  Team --> WS[Workspace Access]`],
  ['rbac', 'RBAC', 'Owner, Admin, Member roles and workspace permissions.', '**RBAC** controls who can configure, publish, and use AI capabilities.', 'role→permission→resource', `flowchart TB
  Owner --> Admin
  Admin --> Member
  Owner --> Billing
  Admin --> Configure
  Member --> Use`],
  ['analytics', 'Analytics', 'Conversation, retrieval, and action metrics.', '**Analytics** summarizes usage, quality signals, and action outcomes.', 'events→dashboards', `flowchart LR
  Events --> Store
  Store --> Dashboard`],
  ['branding', 'Branding', 'Logos, colors, and portal appearance.', '**Branding** customizes the Internal Portal and widget chrome to match your brand.', 'tokens→portal/widget', `flowchart LR
  Logo --> Portal
  Colors --> Widget`],
  ['custom-domains', 'Custom Domains', 'Serve Internal Portal on your domain.', '**Custom Domains** map a hostname you control to the Internal Portal.', 'DNS→TLS→portal', `flowchart LR
  DNS[CNAME] --> Edge
  Edge --> Portal`],
  ['deployment', 'Deployment', 'Cloud vs private deployment options.', '**Deployment** describes how Qefro runs — managed cloud by default, private options for Enterprise.', 'cloud|private', `flowchart TB
  Cloud[Qefro Cloud] --> Tenants
  Private[Private Deploy] --> VPC`],
];

for (const [id, title, desc, summary, archShort, mermaid] of platformTopics) {
  pages.push({
    slug: `platform/${id}.mdx`,
    title,
    description: desc,
    summary,
    intro: `${title} is a core part of the Qefro AI Workspace Platform. This page defines the concept, how it fits the architecture, and how to operate it safely.`,
    why: `Organizations need clear boundaries for ${title.toLowerCase()} so Customer AI and Employee AI stay accurate, permissioned, and auditable.`,
    concepts: `- Definition aligned with Qefro terminology
- Relationship to workspaces, knowledge, and Business Actions
- Operational settings in the Admin Console`,
    architecture: archShort,
    mermaid,
    workflow: `<WorkflowCard
  title="${title} workflow"
  steps={[
    {title: 'Plan', description: 'Decide ownership, scope, and success metrics.'},
    {title: 'Configure', description: 'Set this capability in the Admin Console.'},
    {title: 'Validate', description: 'Test happy path, refusal, and permission edges.'},
    {title: 'Monitor', description: 'Review analytics and execution logs.'},
  ]}
/>`,
    code: `\`\`\`bash
# Typical console / API orientation
export QEFRO_APP=https://app.qefro.com
export QEFRO_API=https://api.qefro.com
\`\`\`

\`\`\`typescript
// Conceptual: resolve a workspace-scoped request
type WorkspaceContext = {
  organizationId: string;
  workspaceId: string;
  actorId: string;
};
\`\`\``,
    practices: `- Prefer least privilege
- Separate customer-facing and employee-facing workspaces
- Document owners for each workspace and tool`,
    security: `<Warning>
Treat configuration changes as production changes. Review Business Tools and RBAC before go-live.
</Warning>`,
    faq: [
      [`What is ${title}?`, summary.replace(/\*\*/g, '')],
      ['Where do I configure it?', 'In the Admin Console at app.qefro.com, under the relevant workspace or organization settings.'],
    ],
    related: [
      ['AI Workspaces', '/docs/platform/ai-workspaces'],
      ['Business Actions', '/docs/platform/business-actions'],
      ['Security Overview', '/docs/security/overview'],
      ['Glossary', '/docs/glossary'],
    ],
  });
}

const guides = [
  ['build-ai-customer-support', 'Build AI Customer Support', 'Ship a support workspace with knowledge, widget, and optional actions.'],
  ['create-employee-ai', 'Create Employee AI', 'Stand up Internal Portal Employee AI with RBAC.'],
  ['connect-rest-apis', 'Connect REST APIs', 'Register REST Business Tools securely.'],
  ['import-openapi', 'Import OpenAPI', 'Import OpenAPI specs into Business Tools.'],
  ['deploy-whatsapp-ai', 'Deploy WhatsApp AI', 'Connect WhatsApp to a Customer AI workspace.'],
  ['deploy-website-widget', 'Deploy Website Widget', 'Embed and authenticate the website widget.'],
  ['configure-rbac', 'Configure RBAC', 'Set Owners, Admins, Members, and workspace access.'],
  ['secure-business-actions', 'Secure Business Actions', 'Harden tools, secrets, and identity forwarding.'],
  ['enable-custom-domains', 'Enable Custom Domains', 'Point DNS at your Internal Portal.'],
  ['production-deployment', 'Production Deployment', 'Checklist for production readiness.'],
];

for (const [id, title, desc] of guides) {
  pages.push({
    slug: `guides/${id}.mdx`,
    title,
    description: desc,
    summary: `**${title}** is a practical guide: ${desc}`,
    intro: `Follow this guide to ${desc.toLowerCase()} using the Qefro Admin Console and documented APIs.`,
    why: 'Guides encode the recommended path so teams avoid insecure shortcuts and incomplete go-lives.',
    concepts: `- Prerequisites (plan, roles, workspace)
- Configuration steps
- Validation and rollback`,
    architecture: 'Guide steps map to Admin Console configuration and optional API calls.',
    mermaid: `flowchart TD
  A[Prerequisites] --> B[Configure]
  B --> C[Validate]
  C --> D[Go live]
  D --> E[Monitor]`,
    workflow: `<WorkflowCard
  title="${title}"
  steps={[
    {title: 'Prerequisites', description: 'Confirm plan limits, Owner/Admin access, and target workspace.'},
    {title: 'Configure', description: 'Apply settings described in this guide.'},
    {title: 'Validate', description: 'Run test conversations and permission checks.'},
    {title: 'Go live', description: 'Enable channels or publish portal access.'},
  ]}
/>`,
    code: `\`\`\`bash
# Example curl pattern against the API host
curl -sS -H "Authorization: Bearer $TOKEN" \\
  https://api.qefro.com/api/v1/health
\`\`\`

\`\`\`javascript
// Widget snippet placeholder — replace with your workspace keys from the console
window.QefroWidget?.init({ workspaceId: 'YOUR_WORKSPACE_ID' });
\`\`\``,
    practices: `- Keep a staging workspace for experiments
- Record owners and runbooks before production
- Re-test after every OpenAPI/tool change`,
    security: `<InfoBox>
Prefer encrypted secrets in Business Tools. Never paste production credentials into chat transcripts or screenshots.
</InfoBox>`,
    faq: [
      ['How long does this take?', 'Typically 30–90 minutes depending on knowledge volume and API readiness.'],
      ['What if validation fails?', 'Disable the channel, fix knowledge/tools, and re-test before re-enabling.'],
    ],
    related: [
      ['Quick Start', '/docs/getting-started/quick-start'],
      ['Business Tools', '/docs/platform/business-tools'],
      ['RBAC', '/docs/platform/rbac'],
      ['Security Overview', '/docs/security/overview'],
    ],
  });
}

const apiPages = [
  ['authentication', 'Authentication', 'Authenticate to the Qefro REST API.'],
  ['rest-apis', 'REST APIs', 'REST resource overview (OpenAPI integration ready).'],
  ['sdks', 'SDKs', 'Official and community SDK guidance.'],
  ['examples', 'Examples', 'cURL, TypeScript, and Python examples.'],
  ['rate-limits', 'Rate Limits', 'Request budgets and backoff guidance.'],
  ['error-codes', 'Error Codes', 'Common API error shapes and meanings.'],
  ['webhooks', 'Webhooks', 'Verify and handle Qefro/Razorpay-related webhook patterns.'],
];

for (const [id, title, desc] of apiPages) {
  pages.push({
    slug: `api/${id}.mdx`,
    title,
    description: desc,
    summary: `**${title}** — ${desc}`,
    intro: `This page documents ${title.toLowerCase()} for builders integrating with \`https://api.qefro.com\`. Full OpenAPI export will plug into this section as it is published.`,
    why: 'Stable API contracts let customers automate Admin Console workflows and embed Qefro safely.',
    concepts: `- Base URL: \`https://api.qefro.com\`
- JSON request/response bodies
- Bearer authentication for server-side clients`,
    architecture: 'Clients call versioned REST endpoints; webhooks deliver async events.',
    mermaid: `sequenceDiagram
  participant Client
  participant API
  participant Qefro
  Client->>API: Authorization Bearer
  API->>Qefro: Authorize + route
  Qefro-->>Client: JSON response`,
    workflow: `<WorkflowCard
  title="API usage"
  steps={[
    {title: 'Obtain credentials', description: 'Create an API token in the Admin Console (Developer settings).'},
    {title: 'Call endpoints', description: 'Use HTTPS + Bearer token.'},
    {title: 'Handle errors', description: 'Map status codes and error.code fields.'},
    {title: 'Subscribe webhooks', description: 'Verify signatures before processing.'},
  ]}
/>`,
    code: `\`\`\`bash
curl -sS \\
  -H "Authorization: Bearer $QEFRO_TOKEN" \\
  -H "Content-Type: application/json" \\
  https://api.qefro.com/api/v1/billing/plans
\`\`\`

\`\`\`python
import os, urllib.request
req = urllib.request.Request(
    "https://api.qefro.com/api/v1/billing/plans",
    headers={"Authorization": f"Bearer {os.environ['QEFRO_TOKEN']}"},
)
print(urllib.request.urlopen(req).read().decode())
\`\`\`

\`\`\`typescript
const res = await fetch('https://api.qefro.com/api/v1/billing/plans', {
  headers: { Authorization: \`Bearer \${process.env.QEFRO_TOKEN}\` },
});
\`\`\``,
    practices: `- Store tokens in a secrets manager
- Prefer workspace-scoped tokens when available
- Log \`request_id\` / correlation IDs on failures`,
    security: `<Warning>
Rotate tokens after teammate offboarding. Do not commit tokens to git.
</Warning>`,
    faq: [
      ['Is OpenAPI available?', 'Structure is prepared here; publish your OpenAPI document under static/openapi when ready.'],
      ['Which languages are supported?', 'Any HTTP client. Examples cover cURL, TypeScript, and Python.'],
    ],
    related: [
      ['Authentication', '/docs/api/authentication'],
      ['Webhooks', '/docs/api/webhooks'],
      ['Error Codes', '/docs/api/error-codes'],
      ['Identity Forwarding', '/docs/platform/identity-forwarding'],
    ],
  });
}

const securityPages = [
  ['overview', 'Security Overview', 'Security model for the Qefro platform.'],
  ['tenant-isolation', 'Tenant Isolation', 'How organizations and workspaces are isolated.'],
  ['secrets', 'Secrets', 'Encrypted credentials for Business Tools.'],
  ['audit-logs', 'Audit Logs', 'Execution and configuration audit trails.'],
  ['compliance', 'Compliance', 'Roadmap items such as SOC 2 and SSO/SAML.'],
];

for (const [id, title, desc] of securityPages) {
  pages.push({
    slug: `security/${id}.mdx`,
    title,
    description: desc,
    summary: `**${title}** — ${desc}`,
    intro: `${desc} This page explains controls, responsibilities, and how they map to Customer AI and Employee AI deployments.`,
    why: 'Security documentation must be precise so buyers and builders can evaluate trust boundaries without marketing language.',
    concepts: `- Tenant / workspace isolation
- Encrypted secrets
- Identity forwarding
- Execution logs for Business Actions`,
    architecture: 'Defense in depth across authn, authz, network egress controls for tools, and auditability.',
    mermaid: `flowchart TB
  Tenant[Tenant Boundary] --> WS[Workspace Isolation]
  WS --> Secrets[Encrypted Secrets]
  WS --> AuthZ[RBAC / Action Auth]
  AuthZ --> Logs[Execution Logs]`,
    workflow: `<WorkflowCard
  title="Security review checklist"
  steps={[
    {title: 'Map data', description: 'Classify knowledge and tool payloads.'},
    {title: 'Least privilege', description: 'Tighten RBAC and tool scopes.'},
    {title: 'Verify isolation', description: 'Cross-workspace retrieval tests.'},
    {title: 'Audit', description: 'Confirm logs for sensitive actions.'},
  ]}
/>`,
    code: `\`\`\`json
{
  "security_controls": [
    "multi_tenant_isolation",
    "workspace_isolation",
    "encrypted_tool_secrets",
    "identity_forwarding",
    "execution_logs"
  ]
}
\`\`\``,
    practices: `- Separate staging and production organizations when possible
- Review OpenAPI imports for overly broad operations
- Disable unused Business Tools`,
    security: `<InfoBox>
SOC 2 compliance is on the roadmap — contact Sales for timeline. SSO/SAML is on the Enterprise roadmap.
</InfoBox>`,
    faq: [
      ['Is Qefro SOC 2 certified today?', 'SOC 2 is on the roadmap; ask Sales for the current timeline.'],
      ['Who can see execution logs?', 'Organization Owners/Admins with appropriate console access.'],
    ],
    related: [
      ['RBAC', '/docs/platform/rbac'],
      ['Business Actions', '/docs/platform/business-actions'],
      ['Identity Forwarding', '/docs/platform/identity-forwarding'],
      ['Secure Business Actions guide', '/docs/guides/secure-business-actions'],
    ],
  });
}

const comparisons = [
  ['chatbase-vs-qefro', 'Chatbase', 'Chatbot builders focused on website Q&A'],
  ['intercom-vs-qefro', 'Intercom', 'Customer messaging and support suites'],
  ['zendesk-vs-qefro', 'Zendesk', 'Ticketing-centric customer service platforms'],
  ['freshworks-vs-qefro', 'Freshworks', 'CRM/support suites with AI assistants'],
  ['customgpt-vs-qefro', 'CustomGPT', 'Custom GPT / knowledge chatbot products'],
  ['copilot-studio-vs-qefro', 'Copilot Studio', 'Microsoft low-code copilots'],
];

for (const [id, other, framing] of comparisons) {
  pages.push({
    slug: `compare/${id}.mdx`,
    title: `${other} vs Qefro`,
    description: `Factual comparison of ${other} and Qefro for AI workspaces and customer/employee AI.`,
    summary: `**${other} vs Qefro** compares ${framing} with Qefro’s AI Workspace Platform (Customer AI, Employee AI, Business Actions).`,
    intro: `This comparison is educational. Product capabilities change; verify details on each vendor’s site before purchasing. Qefro focuses on organization-wide AI Workspaces with shared knowledge, RBAC, and Business Actions — not on replacing every CRM or ticketing system of record.`,
    why: 'Buyers evaluating AI support tools need clear capability boundaries rather than slogans.',
    concepts: `- **Qefro**: AI Workspaces, Customer AI, Employee AI, Business Tools/Actions, Internal Portal
- **${other}**: ${framing}
- Overlap often exists in conversational Q&A; divergence appears in employee portals, action execution, and workspace isolation models`,
    architecture: 'Qefro centralizes Admin Console configuration and deploys multiple experiences from one knowledge/permission plane.',
    mermaid: `flowchart LR
  subgraph Qefro
    WS[AI Workspaces]
    CA[Customer AI]
    EA[Employee AI]
    BA[Business Actions]
  end
  Other[${other}]`,
    workflow: `<WorkflowCard
  title="Evaluation workflow"
  steps={[
    {title: 'List must-haves', description: 'Channels, actions, employee portal, isolation.'},
    {title: 'Pilot knowledge', description: 'Test citation quality and refusals.'},
    {title: 'Pilot actions', description: 'Connect one read-only API if needed.'},
    {title: 'Review security', description: 'Tenant isolation, secrets, logs.'},
  ]}
/>`,
    code: `\`\`\`json
{
  "evaluation_criteria": [
    "workspace_isolation",
    "employee_portal",
    "business_actions",
    "whatsapp",
    "rbac",
    "citations"
  ]
}
\`\`\``,
    practices: `- Compare against your required channels and identity model
- Prefer read-only tool scopes during pilots
- Document gaps honestly for stakeholders`,
    security: `<InfoBox>
Do not migrate production secrets into a pilot until DPA/security review is complete for either vendor.
</InfoBox>`,
    faq: [
      [`Does Qefro replace ${other}?`, `Not necessarily. Qefro may complement systems of record. ${other} may remain the system for tickets/CRM depending on your stack.`],
      ['Where can I learn Qefro specifics?', 'Start with AI Workspaces and Business Actions documentation.'],
    ],
    related: [
      ['AI Workspaces', '/docs/platform/ai-workspaces'],
      ['Business Actions', '/docs/platform/business-actions'],
      ['Security Overview', '/docs/security/overview'],
      ['Pricing', 'https://qefro.com/pricing'],
    ],
  });
}

for (const p of pages) {
  write(p.slug, page(p));
}

// FAQ, glossary, release notes
write(
  'faq.mdx',
  `---
title: FAQ
description: Frequently asked questions about Qefro.
---

import { FaqAccordion, RelatedTopics } from '@site/src/components';

# FAQ

**FAQ** answers common questions about Qefro’s AI Workspace Platform.

## Product

<FaqAccordion items={[
  {question: 'What is Qefro?', answer: 'Qefro is an AI Workspace Platform for organizations. Configure once in the Admin Console, deploy Customer AI on website and WhatsApp, and give employees a branded Internal Portal.'},
  {question: 'How is Qefro different from a chatbot widget?', answer: 'Qefro also supports Employee AI, Business Actions against your APIs, workspace isolation, and shared RBAC — not only website Q&A.'},
  {question: 'Does Qefro replace my CRM?', answer: 'No. Business Actions call your systems of record; Qefro does not become the CRM/ERP.'},
]} />

## Plans & limits

<FaqAccordion items={[
  {question: 'Is there a free plan?', answer: 'Yes — limited conversations and one business system connection for getting started.'},
  {question: 'When is WhatsApp available?', answer: 'WhatsApp is available on Growth and above.'},
]} />

## Related topics

<RelatedTopics topics={[
  {label: 'Glossary', to: '/docs/glossary'},
  {label: 'Security', to: '/docs/security/overview'},
  {label: 'Pricing', to: 'https://qefro.com/pricing'},
]} />
`,
);

write(
  'glossary.mdx',
  `---
title: Glossary
description: Canonical Qefro terminology for AI Workspaces and related concepts.
---

import { RelatedTopics } from '@site/src/components';

# Glossary

**Glossary** defines Qefro terms used across documentation and product UI.

| Term | Definition |
| --- | --- |
| AI Workspace | Isolated AI context with knowledge, instructions, actions, and conversations |
| Customer AI | External assistant on website widget and/or WhatsApp |
| Employee AI | Internal assistant via Internal Portal |
| Knowledge Platform | Ingestion + hybrid retrieval + citations |
| Business Tool | REST/OpenAPI connector with encrypted credentials |
| Business Action | Authorized execution of a Business Tool |
| Identity Forwarding | Passing verified end-user identity into actions |
| Internal Portal | Branded employee web experience |
| Organization | Top-level tenant |
| RBAC | Role-based access control (Owner/Admin/Member) |

## Related topics

<RelatedTopics topics={[
  {label: 'AI Workspaces', to: '/docs/platform/ai-workspaces'},
  {label: 'Business Actions', to: '/docs/platform/business-actions'},
  {label: 'FAQ', to: '/docs/faq'},
]} />
`,
);

write(
  'release-notes.mdx',
  `---
title: Release Notes
description: Qefro platform and documentation release notes.
---

import { RelatedTopics } from '@site/src/components';

# Release Notes

**Release Notes** summarize notable platform and documentation changes.

## 2026-07 — Documentation site launch

- Launched official docs at docs.qefro.com (this repository)
- Added platform, guides, API, security, and compare sections
- Enabled Mermaid diagrams and local search (\`Ctrl/⌘ + K\`)

## Related topics

<RelatedTopics topics={[
  {label: 'Blog', to: '/blog'},
  {label: 'Getting Started', to: '/docs/getting-started/quick-start'},
]} />
`,
);

console.log('Done. Generated', pages.length, 'structured pages + reference.');
