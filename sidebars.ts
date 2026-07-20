import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Information architecture (V1 stable):
 * Introduction → Getting Started → Concepts → Knowledge → Business Tools →
 * Channels → Internal Portal → Deployment → Security → API → Reference
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'guides/build-ai-customer-support',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'concepts/what-is-an-ai-workspace',
        'concepts/ai-workspace-vs-ai-chatbot',
        'concepts/customer-ai-vs-employee-ai',
        'concepts/business-actions',
        'concepts/ai-knowledge-platform',
        'concepts/hybrid-rag',
        'concepts/ai-agent-security',
        'concepts/multi-tenant-ai-architecture',
      ],
    },
    {
      type: 'category',
      label: 'Knowledge Base',
      collapsed: true,
      items: ['platform/knowledge-platform', 'platform/ai-workspaces'],
    },
    {
      type: 'category',
      label: 'Business Tools',
      collapsed: false,
      link: {type: 'doc', id: 'business-tools/index'},
      items: [
        'business-tools/index',
        'business-tools/runtime',
        'business-tools/rest-vs-sdk',
        'business-tools/rest-openapi',
        'business-tools/backend-sdk',
        'business-tools/authentication',
        'business-tools/identity-forwarding',
        'business-tools/identity-resolution',
        'business-tools/challenge-resume',
        'business-tools/mixed-integrations',
        'business-tools/parameters-reference',
        'business-tools/examples',
        'guides/connect-rest-apis',
        'guides/import-openapi',
        'guides/register-sdk-business-tools',
        'guides/secure-business-actions',
      ],
    },
    {
      type: 'category',
      label: 'Channels',
      collapsed: true,
      items: [
        'platform/customer-ai',
        'platform/website-widget',
        'platform/whatsapp',
        'guides/deploy-website-widget',
        'guides/deploy-whatsapp-ai',
      ],
    },
    {
      type: 'category',
      label: 'Internal Portal',
      collapsed: true,
      items: [
        'platform/internal-portal',
        'platform/employee-ai',
        'guides/create-employee-ai',
      ],
    },
    {
      type: 'category',
      label: 'Deployment',
      collapsed: true,
      items: [
        'platform/deployment',
        'guides/production-deployment',
        'guides/enable-custom-domains',
        'platform/custom-domains',
        'platform/branding',
      ],
    },
    {
      type: 'category',
      label: 'Organization',
      collapsed: true,
      items: [
        'platform/organizations',
        'platform/teams',
        'platform/rbac',
        'guides/configure-rbac',
        'platform/analytics',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: ['faq', 'glossary', 'troubleshooting', 'release-notes'],
    },
  ],

  businessToolsSidebar: [
    {
      type: 'doc',
      id: 'business-tools/index',
      label: 'Overview',
    },
    'business-tools/runtime',
    'business-tools/rest-vs-sdk',
    {
      type: 'category',
      label: 'Integration',
      collapsed: false,
      items: [
        'business-tools/rest-openapi',
        'business-tools/backend-sdk',
        'business-tools/mixed-integrations',
      ],
    },
    {
      type: 'category',
      label: 'Identity & auth',
      collapsed: false,
      items: [
        'business-tools/authentication',
        'business-tools/identity-forwarding',
        'business-tools/identity-resolution',
        'business-tools/challenge-resume',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/connect-rest-apis',
        'guides/import-openapi',
        'guides/register-sdk-business-tools',
        'guides/secure-business-actions',
      ],
    },
    'business-tools/parameters-reference',
    'business-tools/examples',
    'troubleshooting',
    'faq',
  ],

  guidesSidebar: [
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/build-ai-customer-support',
        'guides/create-employee-ai',
        'guides/connect-rest-apis',
        'guides/import-openapi',
        'guides/register-sdk-business-tools',
        'guides/deploy-whatsapp-ai',
        'guides/deploy-website-widget',
        'guides/configure-rbac',
        'guides/secure-business-actions',
        'guides/enable-custom-domains',
        'guides/production-deployment',
      ],
    },
  ],

  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      collapsed: false,
      items: [
        'api/authentication',
        'api/rest-apis',
        'api/sdks',
        'api/webhooks',
        'api/rate-limits',
        'api/error-codes',
        'api/examples',
      ],
    },
  ],

  securitySidebar: [
    {
      type: 'category',
      label: 'Security',
      collapsed: false,
      items: [
        'security/overview',
        'security/tenant-isolation',
        'security/secrets',
        'security/audit-logs',
        'security/compliance',
        'guides/secure-business-actions',
      ],
    },
  ],

  compareSidebar: [
    {
      type: 'category',
      label: 'Compare',
      collapsed: false,
      items: [
        'compare/chatbase-vs-qefro',
        'compare/intercom-vs-qefro',
        'compare/zendesk-vs-qefro',
        'compare/freshworks-vs-qefro',
        'compare/customgpt-vs-qefro',
        'compare/copilot-studio-vs-qefro',
      ],
    },
  ],
};

export default sidebars;
