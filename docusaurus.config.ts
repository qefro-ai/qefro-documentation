import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const siteUrl = 'https://docs.qefro.com';

const config: Config = {
  title: 'Qefro Docs',
  tagline: 'Build AI Workspaces for Your Organization',
  favicon: 'img/favicon.ico',

  url: siteUrl,
  baseUrl: '/',

  organizationName: 'qefro-ai',
  projectName: 'qefro-documentation',

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en'],
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        docsRouteBasePath: '/docs',
        blogRouteBasePath: '/blog',
        searchBarShortcutHint: true,
        searchBarShortcut: true,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/qefro-ai/qefro-documentation/tree/main/',
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
          breadcrumbs: true,
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'Qefro Blog',
            description:
              'Product, engineering, and architecture updates from the Qefro team.',
          },
          editUrl:
            'https://github.com/qefro-ai/qefro-documentation/tree/main/',
          blogTitle: 'Qefro Blog',
          blogDescription:
            'Platform, engineering, AI, architecture, product, security, and tutorials.',
          blogSidebarCount: 'ALL',
          blogSidebarTitle: 'All posts',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
        gtag: undefined,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/og-cover.png',
    metadata: [
      {
        name: 'description',
        content:
          'Official Qefro documentation for AI Workspaces, Customer AI, Employee AI, Knowledge Platform, Business Actions, and secure deployment.',
      },
      {name: 'twitter:card', content: 'summary_large_image'},
      {name: 'twitter:site', content: '@qefro'},
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'Qefro Docs'},
      {name: 'theme-color', content: '#7c3aed'},
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Qefro',
      logo: {
        alt: 'Qefro',
        src: 'img/qefro-logo.png',
        srcDark: 'img/qefro-logo-dark.png',
        href: '/',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'doc',
          docId: 'concepts/what-is-an-ai-workspace',
          position: 'left',
          label: 'Concepts',
        },
        {
          type: 'docSidebar',
          sidebarId: 'guidesSidebar',
          position: 'left',
          label: 'Guides',
        },
        {
          type: 'docSidebar',
          sidebarId: 'apiSidebar',
          position: 'left',
          label: 'API',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          type: 'docSidebar',
          sidebarId: 'compareSidebar',
          position: 'left',
          label: 'Compare',
        },
        {
          type: 'docSidebar',
          sidebarId: 'securitySidebar',
          position: 'left',
          label: 'Security',
        },
        {
          href: 'https://github.com/qefro-ai',
          label: 'GitHub',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {label: 'Concepts', to: '/docs/concepts/what-is-an-ai-workspace'},
            {label: 'Getting Started', to: '/docs/getting-started/installation'},
            {label: 'Platform', to: '/docs/platform/ai-workspaces'},
            {label: 'Guides', to: '/docs/guides/build-ai-customer-support'},
            {label: 'API Reference', to: '/docs/api/authentication'},
            {label: 'Glossary', to: '/docs/glossary'},
          ],
        },
        {
          title: 'Product',
          items: [
            {label: 'Website', href: 'https://qefro.com'},
            {label: 'App', href: 'https://app.qefro.com'},
            {label: 'Pricing', href: 'https://qefro.com/pricing'},
            {label: 'Security', to: '/docs/security/overview'},
            {label: 'Compare', to: '/docs/compare/chatbase-vs-qefro'},
            {label: 'Hybrid RAG', to: '/docs/concepts/hybrid-rag'},
          ],
        },
        {
          title: 'Company',
          items: [
            {label: 'Blog', to: '/blog'},
            {label: 'Status', href: 'https://status.qefro.com'},
            {label: 'Privacy', href: 'https://qefro.com/privacy'},
            {label: 'Terms', href: 'https://qefro.com/terms'},
            {label: 'Contact', href: 'https://qefro.com/contact'},
          ],
        },
        {
          title: 'Developers',
          items: [
            {label: 'GitHub', href: 'https://github.com/qefro-ai'},
            {label: 'REST APIs', to: '/docs/api/rest-apis'},
            {label: 'Webhooks', to: '/docs/api/webhooks'},
            {label: 'SDKs', to: '/docs/api/sdks'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Qefro. Configure once. Deploy everywhere.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: [
        'bash',
        'json',
        'rust',
        'python',
        'java',
        'csharp',
        'yaml',
        'toml',
        'graphql',
        'diff',
      ],
      magicComments: [
        {
          className: 'theme-code-block-highlighted-line',
          line: 'highlight-next-line',
          block: {start: 'highlight-start', end: 'highlight-end'},
        },
      ],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
  } satisfies Preset.ThemeConfig,

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: 'anonymous',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;500;600&display=swap',
      },
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Qefro',
        url: 'https://qefro.com',
        logo: 'https://docs.qefro.com/img/qefro-logo.png',
        sameAs: ['https://github.com/qefro-ai'],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@qefro.com',
          contactType: 'customer support',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Qefro',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: 'https://qefro.com',
        description:
          'AI Workspace Platform for Customer AI, Employee AI, and Business Actions.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {type: 'application/ld+json'},
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Qefro Docs',
        url: siteUrl,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      }),
    },
  ],
};

export default config;
