import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {
  FeatureCard,
  FeatureCardGrid,
} from '@site/src/components';

import styles from './index.module.css';

const whyItems = [
  {
    title: 'Configure once',
    description:
      'Centralize knowledge, permissions, and business actions in the Admin Console — then deploy across channels.',
  },
  {
    title: 'Deploy everywhere',
    description:
      'Customer AI on website and WhatsApp. Employee AI on a branded Internal Portal. One platform.',
  },
  {
    title: 'Actions, not only answers',
    description:
      'Securely call your REST APIs and OpenAPI tools with identity forwarding and execution logs.',
  },
];

const features = [
  {
    title: 'AI Workspaces',
    description:
      'Isolated contexts per team — Support, HR, IT — each with knowledge, instructions, and actions.',
    href: '/docs/platform/ai-workspaces',
  },
  {
    title: 'Customer AI',
    description:
      'Website widget and WhatsApp assistants grounded in your knowledge with citations.',
    href: '/docs/platform/customer-ai',
  },
  {
    title: 'Employee AI',
    description:
      'Branded Internal Portal for internal Q&A and permitted business actions.',
    href: '/docs/platform/employee-ai',
  },
  {
    title: 'Business Actions',
    description:
      'Connect systems of record via Business Tools — REST, OpenAPI, encrypted credentials.',
    href: '/docs/platform/business-actions',
  },
  {
    title: 'Knowledge Platform',
    description:
      'Hybrid retrieval, OCR, multilingual RAG, workspace isolation, and source citations.',
    href: '/docs/platform/knowledge-platform',
  },
  {
    title: 'RBAC & Security',
    description:
      'Teams, roles, tenant isolation, identity forwarding, and audit-ready execution logs.',
    href: '/docs/platform/rbac',
  },
];

const categories = [
  {label: 'Concepts', to: '/docs/concepts/what-is-an-ai-workspace'},
  {label: 'Getting Started', to: '/docs/getting-started/installation'},
  {label: 'Platform', to: '/docs/platform/ai-workspaces'},
  {label: 'Guides', to: '/docs/guides/build-ai-customer-support'},
  {label: 'API', to: '/docs/api/authentication'},
  {label: 'Security', to: '/docs/security/overview'},
  {label: 'Compare', to: '/docs/compare/chatbase-vs-qefro'},
  {label: 'Glossary', to: '/docs/glossary'},
  {label: 'Blog', to: '/blog'},
];

const concepts = [
  {
    title: 'What is an AI Workspace?',
    description:
      'The isolation unit for knowledge, tools, and conversations inside an organization.',
    href: '/docs/concepts/what-is-an-ai-workspace',
  },
  {
    title: 'AI Workspace vs AI Chatbot',
    description:
      'When a chatbot is enough — and when you need workspaces, RBAC, and actions.',
    href: '/docs/concepts/ai-workspace-vs-ai-chatbot',
  },
  {
    title: 'Customer AI vs Employee AI',
    description:
      'External channels versus Internal Portal with Teams and workspace grants.',
    href: '/docs/concepts/customer-ai-vs-employee-ai',
  },
  {
    title: 'Business Actions',
    description:
      'Authorized, logged tool calls from assistants into your APIs.',
    href: '/docs/concepts/business-actions',
  },
  {
    title: 'Hybrid RAG',
    description:
      'Lexical + vector retrieval for identifiers and paraphrase queries.',
    href: '/docs/concepts/hybrid-rag',
  },
  {
    title: 'Multi-tenant AI Architecture',
    description:
      'How organizations and workspaces keep customer data from mixing.',
    href: '/docs/concepts/multi-tenant-ai-architecture',
  },
];

const guides = [
  {
    label: 'Build AI Customer Support',
    to: '/docs/guides/build-ai-customer-support',
  },
  {label: 'Create Employee AI', to: '/docs/guides/create-employee-ai'},
  {label: 'Connect REST APIs', to: '/docs/guides/connect-rest-apis'},
  {label: 'Import OpenAPI', to: '/docs/guides/import-openapi'},
  {label: 'Deploy Website Widget', to: '/docs/guides/deploy-website-widget'},
  {
    label: 'Production Deployment',
    to: '/docs/guides/production-deployment',
  },
];

function HomepageHeader(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className="qefro-hero">
      <div className="qefro-hero__inner">
        <div className="qefro-hero__eyebrow">Qefro Documentation</div>
        <Heading as="h1">{siteConfig.tagline}</Heading>
        <p className="qefro-hero__subtitle">
          Deploy Customer AI, Employee AI, and Business Actions from one
          platform.
        </p>
        <div className="qefro-hero__actions">
          <Link
            className="button button--primary button--lg"
            to="/docs/getting-started/quick-start">
            Get Started
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/concepts/what-is-an-ai-workspace">
            Concepts
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/platform/ai-workspaces">
            Documentation
          </Link>
          <Link
            className="button button--secondary button--lg"
            href="https://github.com/qefro-ai">
            GitHub
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Documentation"
      description="Official Qefro documentation for AI Workspaces, Customer AI, Employee AI, and Business Actions.">
      <HomepageHeader />
      <main className="qefro-home">
        <section className="qefro-section">
          <div className="qefro-section__inner">
            <h2>Why Qefro</h2>
            <p className="qefro-section__lead">
              Most AI platforms answer questions. Qefro also securely performs
              business actions using your organization&apos;s knowledge, APIs,
              and permissions.
            </p>
            <FeatureCardGrid>
              {whyItems.map((item) => (
                <FeatureCard
                  key={item.title}
                  title={item.title}
                  description={item.description}
                />
              ))}
            </FeatureCardGrid>
          </div>
        </section>

        <section className="qefro-section qefro-section--alt">
          <div className="qefro-section__inner">
            <h2>Concepts for AI search</h2>
            <p className="qefro-section__lead">
              Definition-led pages for GEO: what an AI Workspace is, how it
              differs from a chatbot, Hybrid RAG, Business Actions, and
              multi-tenant architecture.
            </p>
            <FeatureCardGrid>
              {concepts.map((c) => (
                <FeatureCard key={c.title} {...c} />
              ))}
            </FeatureCardGrid>
          </div>
        </section>

        <section className="qefro-section">
          <div className="qefro-section__inner">
            <h2>Platform Overview</h2>
            <p className="qefro-section__lead">
              One Admin Console. Shared knowledge and permissions. Multiple
              experiences for customers and employees.
            </p>
            <div className="qefro-arch-flow">
              <div className="qefro-arch-step">
                <strong>Admin</strong>
                Configure workspaces, tools, RBAC
              </div>
              <div className="qefro-arch-step">
                <strong>Knowledge</strong>
                Documents, crawl, hybrid RAG
              </div>
              <div className="qefro-arch-step">
                <strong>Actions</strong>
                REST / OpenAPI Business Tools
              </div>
              <div className="qefro-arch-step">
                <strong>Experiences</strong>
                Widget · Portal · WhatsApp
              </div>
            </div>
          </div>
        </section>

        <section className="qefro-section qefro-section--alt">
          <div className="qefro-section__inner">
            <h2>Core Features</h2>
            <p className="qefro-section__lead">
              Everything you need to ship organizational AI with clear
              boundaries and auditability.
            </p>
            <FeatureCardGrid>
              {features.map((f) => (
                <FeatureCard key={f.title} {...f} />
              ))}
            </FeatureCardGrid>
          </div>
        </section>

        <section className="qefro-section">
          <div className="qefro-section__inner">
            <h2>Architecture</h2>
            <p className="qefro-section__lead">
              Multi-tenant isolation, workspace-scoped knowledge, and
              zero-trust-style authorization for business actions.
            </p>
            <pre className={clsx(styles.mermaidPreview)} aria-hidden="true">
{`Admin Console → Workspaces → Knowledge + Tools
        ↓
  Auth / RBAC / Identity
        ↓
 Widget | Internal Portal | WhatsApp`}
            </pre>
            <p>
              See{' '}
              <Link to="/docs/concepts/multi-tenant-ai-architecture">
                Multi-tenant AI Architecture
              </Link>
              , <Link to="/docs/platform/ai-workspaces">AI Workspaces</Link>, and{' '}
              <Link to="/docs/security/tenant-isolation">Tenant Isolation</Link>.
            </p>
          </div>
        </section>

        <section className="qefro-section qefro-section--alt">
          <div className="qefro-section__inner">
            <h2>Popular Guides</h2>
            <p className="qefro-section__lead">
              Step-by-step paths from first workspace to production.
            </p>
            <div className="qefro-guide-list">
              {guides.map((g) => (
                <Link key={g.to} to={g.to}>
                  {g.label}
                  <span>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="qefro-section">
          <div className="qefro-section__inner">
            <h2>Documentation Categories</h2>
            <p className="qefro-section__lead">
              Browse by topic. Search with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+
              <kbd>K</kbd>.
            </p>
            <nav className="qefro-related" aria-label="Documentation categories">
              {categories.map((c) => (
                <Link key={c.to} to={c.to}>
                  {c.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section className="qefro-section qefro-section--alt">
          <div className="qefro-section__inner">
            <h2>Latest Blog Posts</h2>
            <p className="qefro-section__lead">
              Platform, engineering, AI, architecture, product, security, and
              tutorials from the Qefro team.
            </p>
            <Link
              className="button button--primary"
              to="/blog">
              Read the blog
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
