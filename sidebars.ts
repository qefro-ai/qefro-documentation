import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Documentation as a product — priority order:
 *   P0 Getting Started · User · Developer
 *   P1 Integrations · Solutions
 *   P2 API / SDK Reference
 *   P3 Architecture deep dive
 *
 * Voice rules:
 *   User docs     → what to do (how-to)
 *   Developer docs → how Qefro works (runtime concepts)
 *   Reference     → exact specs
 *   Solutions     → business outcomes
 *
 * Deep pages under concepts/, platform/, business-tools/, guides/, api/, security/
 * keep stable URLs and are linked from audience hubs.
 */
const sidebars: SidebarsConfig = {
  userSidebar: [
    {
      type: 'category',
      label: 'Start here',
      collapsed: false,
      items: [
        'introduction/overview',
        'architecture/overview',
        'introduction/concepts',
        'compare/n8n-vs-qefro',
        'compare/langgraph-vs-qefro',
        'glossary',
      ],
    },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'user/getting-started',
        'getting-started/installation',
        'getting-started/quick-start',
        'guides/build-ai-customer-support',
      ],
    },
    {
      type: 'category',
      label: 'How to',
      collapsed: false,
      items: [
        'user/how-to/create-ai-agent',
        'user/how-to/configure-whatsapp',
        'user/how-to/connect-shopify',
        'user/how-to/track-orders',
        'user/how-to/add-approval-workflow',
      ],
    },
    {
      type: 'category',
      label: 'Workspaces',
      collapsed: true,
      items: ['user/workspaces/overview', 'platform/ai-workspaces'],
    },
    {
      type: 'category',
      label: 'Agents',
      collapsed: true,
      items: [
        'user/agents/overview',
        'platform/customer-ai',
        'platform/employee-ai',
        'guides/create-employee-ai',
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base',
      collapsed: true,
      items: [
        'user/knowledge-base/overview',
        'platform/knowledge-platform',
        'concepts/hybrid-rag',
      ],
    },
    {
      type: 'category',
      label: 'Channels',
      collapsed: true,
      items: [
        'user/channels/overview',
        'user/channels/website-widget',
        'user/channels/whatsapp',
        'user/channels/api',
        'guides/deploy-website-widget',
        'guides/deploy-whatsapp-ai',
      ],
    },
    {
      type: 'category',
      label: 'Conversations',
      collapsed: true,
      items: ['user/conversations/overview'],
    },
    {
      type: 'category',
      label: 'Approvals',
      collapsed: true,
      items: ['user/approvals/overview', 'guides/run-business-flows'],
    },
    {
      type: 'category',
      label: 'Analytics',
      collapsed: true,
      items: ['user/analytics/overview', 'platform/analytics'],
    },
    {
      type: 'category',
      label: 'Billing',
      collapsed: true,
      items: ['user/billing/overview'],
    },
    {
      type: 'category',
      label: 'Administration',
      collapsed: true,
      items: [
        'user/administration/overview',
        'platform/organizations',
        'platform/teams',
        'platform/rbac',
        'guides/configure-rbac',
        'platform/custom-domains',
        'platform/branding',
        'guides/enable-custom-domains',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: true,
      items: [
        'security/overview',
        'security/tenant-isolation',
        'security/secrets',
        'security/audit-logs',
        'security/compliance',
      ],
    },
  ],

  developerSidebar: [
    {
      type: 'category',
      label: 'Quick Start',
      collapsed: false,
      items: [
        'developer/quick-start',
        'architecture/overview',
        'guides/register-sdk-business-tools',
      ],
    },
    {
      type: 'category',
      label: 'How Qefro works',
      collapsed: false,
      items: [
        'developer/concepts/runtime',
        'developer/concepts/events',
        'developer/concepts/flows',
        'developer/concepts/tools',
        'developer/concepts/connectors',
        'developer/concepts/middleware',
        'developer/concepts/approvals',
        'developer/concepts/challenges',
        'developer/concepts/memory',
        'developer/concepts/sessions',
      ],
    },
    {
      type: 'category',
      label: 'Architecture deep dive',
      collapsed: true,
      items: [
        'architecture/overview',
        'introduction/architecture',
        'business-tools/runtime',
        'concepts/multi-tenant-ai-architecture',
        'concepts/ai-agent-security',
        'concepts/business-actions',
        'compare/n8n-vs-qefro',
        'compare/langgraph-vs-qefro',
      ],
    },
    {
      type: 'category',
      label: 'SDK guides',
      collapsed: false,
      items: [
        'developer/sdk/javascript',
        'developer/sdk/python',
        'developer/sdk/rust',
        'business-tools/backend-sdk',
      ],
    },
    {
      type: 'category',
      label: 'Business Tools',
      collapsed: true,
      link: {type: 'doc', id: 'business-tools/index'},
      items: [
        'business-tools/index',
        'business-tools/rest-vs-sdk',
        'business-tools/rest-openapi',
        'business-tools/authentication',
        'business-tools/identity-forwarding',
        'business-tools/identity-resolution',
        'business-tools/challenge-resume',
        'business-tools/mixed-integrations',
        'business-tools/parameters-reference',
        'business-tools/examples',
        'guides/connect-rest-apis',
        'guides/import-openapi',
        'guides/secure-business-actions',
      ],
    },
    {
      type: 'category',
      label: 'Flows',
      collapsed: true,
      items: [
        'guides/define-business-flows',
        'guides/run-business-flows',
        'guides/event-driven-triggers',
      ],
    },
    {
      type: 'category',
      label: 'Events',
      collapsed: true,
      items: [
        'developer/events/overview',
        'guides/event-driven-triggers',
        'reference/event-reference',
      ],
    },
    {
      type: 'category',
      label: 'Webhooks',
      collapsed: true,
      items: ['developer/webhooks/overview', 'api/webhooks'],
    },
    {
      type: 'category',
      label: 'Schedules',
      collapsed: true,
      items: ['developer/schedules/overview'],
    },
    {
      type: 'category',
      label: 'Channels',
      collapsed: true,
      items: ['developer/channels/overview'],
    },
    {
      type: 'category',
      label: 'Observability',
      collapsed: true,
      items: ['developer/observability/overview'],
    },
    {
      type: 'category',
      label: 'Deployment',
      collapsed: true,
      items: [
        'developer/deployment/overview',
        'developer/self-hosting/overview',
        'platform/deployment',
        'guides/production-deployment',
        'v1-docker',
        'v1-kubernetes',
      ],
    },
  ],

  integrationsSidebar: [
    'integrations/overview',
    {
      type: 'category',
      label: 'Shopify',
      collapsed: true,
      items: ['integrations/shopify/overview', 'user/how-to/connect-shopify'],
    },
    {
      type: 'category',
      label: 'WooCommerce',
      collapsed: true,
      items: ['integrations/woocommerce/overview'],
    },
    {
      type: 'category',
      label: 'Odoo',
      collapsed: true,
      items: ['integrations/odoo/overview'],
    },
    {
      type: 'category',
      label: 'ERPNext',
      collapsed: true,
      items: ['integrations/erpnext/overview'],
    },
    {
      type: 'category',
      label: 'HubSpot',
      collapsed: true,
      items: ['integrations/hubspot/overview'],
    },
    {
      type: 'category',
      label: 'Stripe',
      collapsed: true,
      items: ['integrations/stripe/overview'],
    },
    {
      type: 'category',
      label: 'Razorpay',
      collapsed: true,
      items: ['integrations/razorpay/overview', 'api/webhooks'],
    },
    {
      type: 'category',
      label: 'Zendesk',
      collapsed: true,
      items: ['integrations/zendesk/overview'],
    },
    'developer/concepts/connectors',
    'reference/connector-reference',
    'guides/event-driven-triggers',
  ],

  solutionsSidebar: [
    'solutions/overview',
    'solutions/customer-support',
    'solutions/whatsapp-commerce',
    'solutions/order-tracking',
    'solutions/abandoned-cart',
    'solutions/appointment-booking',
    'solutions/lead-qualification',
    'solutions/refund-automation',
    'solutions/conversational-commerce',
    {
      type: 'category',
      label: 'Related guides',
      collapsed: true,
      items: [
        'guides/build-ai-customer-support',
        'guides/event-driven-triggers',
        'guides/secure-business-actions',
        'user/how-to/track-orders',
        'user/how-to/add-approval-workflow',
      ],
    },
  ],

  referenceSidebar: [
    'reference/overview',
    {
      type: 'category',
      label: 'API reference',
      collapsed: false,
      items: [
        'developer/api-reference/overview',
        'api/authentication',
        'api/rest-apis',
        'api/webhooks',
        'api/rate-limits',
        'api/error-codes',
        'api/examples',
      ],
    },
    {
      type: 'category',
      label: 'SDK reference',
      collapsed: false,
      items: [
        'api/sdks',
        'developer/sdk/javascript',
        'developer/sdk/python',
        'developer/sdk/rust',
        'business-tools/backend-sdk',
        'business-tools/parameters-reference',
      ],
    },
    {
      type: 'category',
      label: 'Schemas & config',
      collapsed: false,
      items: [
        'reference/event-reference',
        'reference/connector-reference',
        'reference/environment-variables',
        'reference/configuration',
        'reference/cli',
      ],
    },
    {
      type: 'category',
      label: 'Architecture (P3)',
      collapsed: true,
      items: [
        'architecture/overview',
        'introduction/architecture',
        'concepts/multi-tenant-ai-architecture',
        'business-tools/runtime',
      ],
    },
    {
      type: 'category',
      label: 'Compare',
      collapsed: false,
      items: [
        'compare/n8n-vs-qefro',
        'compare/langgraph-vs-qefro',
        'compare/chatbase-vs-qefro',
        'compare/intercom-vs-qefro',
        'compare/zendesk-vs-qefro',
        'compare/freshworks-vs-qefro',
        'compare/customgpt-vs-qefro',
        'compare/copilot-studio-vs-qefro',
      ],
    },
    {
      type: 'category',
      label: 'Security reference',
      collapsed: true,
      items: [
        'security/overview',
        'security/tenant-isolation',
        'security/secrets',
        'security/audit-logs',
        'security/compliance',
      ],
    },
    'glossary',
    'faq',
    'troubleshooting',
    'reference/changelog',
    'release-notes',
  ],
};

export default sidebars;
