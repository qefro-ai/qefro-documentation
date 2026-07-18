import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

type FeatureCardProps = {
  title: string;
  description: string;
  href?: string;
  icon?: string;
};

export function FeatureCard({
  title,
  description,
  href,
  icon,
}: FeatureCardProps): ReactNode {
  const body = (
    <>
      {icon ? <div aria-hidden="true">{icon}</div> : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </>
  );

  if (href) {
    return (
      <Link className="qefro-feature-card" to={href} style={{display: 'block'}}>
        {body}
      </Link>
    );
  }

  return <div className="qefro-feature-card">{body}</div>;
}

export function FeatureCardGrid({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <div className="qefro-card-grid">{children}</div>;
}

type ArchitectureCardProps = {
  title: string;
  description: string;
  layer?: string;
};

export function ArchitectureCard({
  title,
  description,
  layer,
}: ArchitectureCardProps): ReactNode {
  return (
    <div className="qefro-architecture-card">
      {layer ? (
        <strong style={{color: 'var(--qefro-accent)', fontSize: '0.8rem'}}>
          {layer}
        </strong>
      ) : null}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

type CalloutProps = {
  title?: string;
  children: ReactNode;
};

export function InfoBox({title = 'Note', children}: CalloutProps): ReactNode {
  return (
    <aside className="qefro-callout qefro-callout--info" role="note">
      <div className="qefro-callout__title">{title}</div>
      <div>{children}</div>
    </aside>
  );
}

export function Warning({
  title = 'Warning',
  children,
}: CalloutProps): ReactNode {
  return (
    <aside className="qefro-callout qefro-callout--warning" role="alert">
      <div className="qefro-callout__title">{title}</div>
      <div>{children}</div>
    </aside>
  );
}

export function Success({
  title = 'Success',
  children,
}: CalloutProps): ReactNode {
  return (
    <aside className="qefro-callout qefro-callout--success">
      <div className="qefro-callout__title">{title}</div>
      <div>{children}</div>
    </aside>
  );
}

type RelatedTopic = {label: string; to?: string; href?: string};

export function RelatedTopics({
  topics,
  links,
}: {
  topics?: RelatedTopic[];
  links?: RelatedTopic[];
}): ReactNode {
  const items = topics ?? links ?? [];
  return (
    <nav className="qefro-related" aria-label="Related topics">
      {items.map((t) => {
        const destination = t.to ?? t.href ?? '#';
        return (
          <Link key={destination} to={destination}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

type FaqItem = {question: string; answer: ReactNode};

export function FaqAccordion({items = []}: {items?: FaqItem[]}): ReactNode {
  return (
    <div className="qefro-faq" role="list">
      {items.map((item) => (
        <details key={item.question} role="listitem">
          <summary>{item.question}</summary>
          <div style={{marginTop: '0.75rem'}}>{item.answer}</div>
        </details>
      ))}
    </div>
  );
}

type ComparisonRow = {capability: string; qefro: string; other: string};

export function ComparisonTable({
  otherName,
  rows = [],
}: {
  otherName: string;
  rows?: ComparisonRow[];
}): ReactNode {
  return (
    <div className="qefro-comparison">
      <table>
        <caption className="qefro-sr-only">
          Capability comparison between Qefro and {otherName}
        </caption>
        <thead>
          <tr>
            <th scope="col">Capability</th>
            <th scope="col">Qefro</th>
            <th scope="col">{otherName}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.capability}>
              <th scope="row">{row.capability}</th>
              <td>{row.qefro}</td>
              <td>{row.other}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ApiEndpointCardProps = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
};

export function ApiEndpointCard({
  method,
  path,
  description,
}: ApiEndpointCardProps): ReactNode {
  const colors: Record<string, string> = {
    GET: '#0891b2',
    POST: '#059669',
    PUT: '#7c3aed',
    PATCH: '#d97706',
    DELETE: '#dc2626',
  };

  return (
    <div className="qefro-api-card">
      <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.75rem',
            color: colors[method],
            minWidth: '3.5rem',
          }}>
          {method}
        </span>
        <code>{path}</code>
      </div>
      <p style={{margin: '0.75rem 0 0'}}>{description}</p>
    </div>
  );
}

type WorkflowStep = {title: string; description: string};

export function WorkflowCard({
  title,
  steps,
}: {
  title: string;
  steps: WorkflowStep[];
}): ReactNode {
  return (
    <div className="qefro-workflow-card">
      <h3 style={{marginTop: 0}}>{title}</h3>
      <ol style={{marginBottom: 0, paddingLeft: '1.25rem'}}>
        {steps.map((step) => (
          <li key={step.title} style={{marginBottom: '0.5rem'}}>
            <strong>{step.title}</strong> — {step.description}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Tabs wrapper — prefer Docusaurus Tabs for code; this is a simple label strip helper */
export function CodeTabs({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <div className="qefro-code-tabs">{children}</div>;
}

export function DocPageHeader({
  summary,
}: {
  summary: string;
}): ReactNode {
  return (
    <p>
      <strong>{summary}</strong>
    </p>
  );
}
