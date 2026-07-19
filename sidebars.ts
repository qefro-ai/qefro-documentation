import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Manual sidebars grouped by category.
 * Auto-generated category indexes use `_category_.json` where helpful.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'V1 Documentation',
      collapsed: false,
      items: [
        'v1-readme',
        'v1-getting-started',
        'v1-installation',
        'v1-quick-start',
        'v1-architecture',
        'v1-business-tools',
        'v1-customer-provider',
        'v1-authentication',
        'v1-rest-openapi',
        'v1-sdk-framework',
        'v1-internal-portal',
        'v1-whatsapp',
        'v1-deployment',
        'v1-docker',
        'v1-kubernetes',
        'v1-security',
        'v1-examples',
        'v1-migration',
        'v1-faq',
        'v1-troubleshooting',
        'v1-best-practices',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
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
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Platform',
      collapsed: true,
      items: [
        'platform/ai-workspaces',
        'platform/customer-ai',
        'platform/employee-ai',
        'platform/knowledge-platform',
        'platform/business-actions',
        'platform/business-tools',
        'platform/identity-verification',
        'platform/identity-and-authentication',
        'platform/internal-portal',
        'platform/website-widget',
        'platform/whatsapp',
        'platform/authentication',
        'platform/identity-forwarding',
        'platform/organizations',
        'platform/teams',
        'platform/rbac',
        'platform/analytics',
        'platform/branding',
        'platform/custom-domains',
        'platform/deployment',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      items: ['faq', 'glossary', 'release-notes'],
    },
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
        'api/examples',
        'api/rate-limits',
        'api/error-codes',
        'api/webhooks',
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
