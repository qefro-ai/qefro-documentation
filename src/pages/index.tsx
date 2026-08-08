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
    title: 'Assistants',
    description:
      'Customer AI on website and WhatsApp. Employee AI on a branded Internal Portal — shared knowledge and RBAC.',
  },
  {
    title: 'Installable apps',
    description:
      'Ship domain software with qefro create-app → publish → Marketplace install. The SDK process is the application.',
  },
  {
    title: 'Secure actions',
    description:
      'Business Tools (REST/OpenAPI) and app /qefro tools with identity forwarding, approvals, and audit logs.',
  },
];

const features = [
  {
    title: 'Installable SDK apps',
    description:
      'Managed /qefro packages with staff UI, storage, and onboarding — install once per workspace from Marketplace.',
    href: '/docs/solutions/build-your-first-app',
  },
  {
    title: 'Marketplace',
    description:
      'Publish signed packages to the catalog; tenants install and upgrade without forking.',
    href: '/docs/solutions/marketplace',
  },
  {
    title: 'Customer Hub (People)',
    description:
      'Shared people identity across channels. Portal nav: People. Apps use ctx.customer.',
    href: '/docs/user/people/overview',
  },
  {
    title: 'Marketing & Organization',
    description:
      'Apps register audiences and opaque workflow capabilities; the platform owns campaigns and orchestration.',
    href: '/docs/solutions/marketing',
  },
  {
    title: 'AI Workspaces',
    description:
      'Isolated contexts per team — Support, HR, IT — each with knowledge, instructions, and actions.',
    href: '/docs/platform/ai-workspaces',
  },
  {
    title: 'Knowledge & RBAC',
    description:
      'Hybrid RAG with citations, plus teams, roles, tenant isolation, and audit-ready execution logs.',
    href: '/docs/platform/knowledge-platform',
  },
];

const categories = [
  {label: 'Start', to: '/docs/introduction/overview'},
  {label: 'Build apps', to: '/docs/solutions/build-your-first-app'},
  {label: 'Operate', to: '/docs/user/getting-started'},
  {label: 'Reference', to: '/docs/reference/overview'},
  {label: 'Architecture', to: '/docs/architecture/overview'},
  {label: 'Marketplace', to: '/docs/solutions/marketplace'},
  {label: 'vs n8n', to: '/docs/compare/n8n-vs-qefro'},
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
    title: 'SDK app vs Business Tool SDK',
    description:
      'Installable /qefro applications versus webhook Business Tool connections — two different SDK stories.',
    href: '/docs/introduction/concepts',
  },
  {
    title: 'Customer AI vs Employee AI',
    description:
      'External channels versus Internal Portal with Teams and workspace grants.',
    href: '/docs/concepts/customer-ai-vs-employee-ai',
  },
  {
    title: 'Build your first app',
    description:
      'qefro create-app warehouse-pro → publish → install — the third-party maturity path.',
    href: '/docs/solutions/build-your-first-app',
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
    label: 'Build your first app',
    to: '/docs/solutions/build-your-first-app',
  },
  {
    label: 'Build AI Customer Support',
    to: '/docs/guides/build-ai-customer-support',
  },
  {label: 'Create Employee AI', to: '/docs/guides/create-employee-ai'},
  {label: 'Marketplace', to: '/docs/solutions/marketplace'},
  {label: 'Connect REST APIs', to: '/docs/guides/connect-rest-apis'},
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
          Assistants, installable SDK apps, and secure actions — from one
          platform.
        </p>
        <div className="qefro-hero__actions">
          <Link
            className="button button--primary button--lg"
            to="/docs/introduction/overview">
            Start
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/solutions/build-your-first-app">
            Build apps
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/docs/user/getting-started">
            Operate
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
  return (
    <Layout
      title="Documentation"
      description="Official Qefro documentation for AI Workspaces, installable SDK apps, Marketplace, Customer Hub, and Business Tools.">
      <HomepageHeader />
      <main className="qefro-home">
        <section className="qefro-section">
          <div className="qefro-section__inner">
            <h2>Why Qefro</h2>
            <p className="qefro-section__lead">
              Answer questions, ship installable business apps, and call your
              systems securely — without forking per tenant.
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
              Definition-led pages for GEO: workspaces, SDK apps, assistants,
              Hybrid RAG, and multi-tenant architecture.
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
              One Admin Console. Shared knowledge and permissions. Installable
              apps from Marketplace. Multiple experiences for customers and
              employees.
            </p>
            <div className="qefro-arch-flow">
              <div className="qefro-arch-step">
                <strong>Admin</strong>
                Workspaces, Marketplace, RBAC
              </div>
              <div className="qefro-arch-step">
                <strong>Apps</strong>
                SDK /qefro + staff UI
              </div>
              <div className="qefro-arch-step">
                <strong>Actions</strong>
                Tools · Marketing · Org workflows
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
              Everything you need to ship organizational AI and domain apps with
              clear boundaries and auditability.
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
              Multi-tenant isolation, workspace-scoped knowledge, installable
              SDK apps, and zero-trust-style authorization for business actions.
            </p>
            <pre className={clsx(styles.mermaidPreview)} aria-hidden="true">
{`Admin Console → Workspaces → Knowledge + Marketplace apps
        ↓
  Auth / RBAC / Customer Hub
        ↓
 Widget | Internal Portal | WhatsApp | App /qefro`}
            </pre>
            <p>
              See{' '}
              <Link to="/docs/architecture/overview">Architecture overview</Link>
              ,{' '}
              <Link to="/docs/solutions/architecture">Solutions architecture</Link>
              , and{' '}
              <Link to="/docs/security/tenant-isolation">Tenant Isolation</Link>.
            </p>
          </div>
        </section>

        <section className="qefro-section qefro-section--alt">
          <div className="qefro-section__inner">
            <h2>Popular Guides</h2>
            <p className="qefro-section__lead">
              Step-by-step paths from first workspace to published apps.
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
            <h2>Documentation hubs</h2>
            <p className="qefro-section__lead">
              Browse by audience. Search with <kbd>Ctrl</kbd>/<kbd>⌘</kbd>+
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
              Architecture, security, tutorials, and product notes — with links
              back into the docs.
            </p>
            <div className="qefro-guide-list">
              <Link to="/blog/introducing-qefro-docs">
                Introducing official Qefro documentation
                <span>→</span>
              </Link>
              <Link to="/blog/ai-workspaces-architecture">
                How AI Workspaces isolate knowledge and actions
                <span>→</span>
              </Link>
              <Link to="/blog/hybrid-rag-in-practice">
                Hybrid RAG in practice
                <span>→</span>
              </Link>
              <Link to="/blog/securing-business-actions">
                Securing Business Actions in production
                <span>→</span>
              </Link>
            </div>
            <p style={{marginTop: '1.5rem'}}>
              <Link className="button button--primary" to="/blog">
                View all posts
              </Link>
            </p>
          </div>
        </section>
      </main>
    </Layout>
  );
}
