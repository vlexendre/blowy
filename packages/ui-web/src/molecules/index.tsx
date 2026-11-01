/** Molécules : composées d'atomes uniquement. */
import type { ReactNode } from 'react';
import { Badge, ButtonLink, Eyebrow, Heading, Text, type Tone } from '../atoms/index';

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="bw-field">
      <label className="bw-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? (
        <span className="bw-field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface MetricView {
  key: string;
  label: string;
  value: number | null;
  denominator: number | null;
  ratio: number | null;
  definition: string;
  status: 'OK' | 'NOT_INSTRUMENTED';
}

const fmt = new Intl.NumberFormat('fr-FR');
export function StatTile({ m }: { m: MetricView }) {
  return (
    <div className="bw-card bw-stat" data-metric={m.key}>
      <Eyebrow>{m.label}</Eyebrow>
      {m.status === 'NOT_INSTRUMENTED' ? (
        <Badge tone="warn">Non instrumenté</Badge>
      ) : (
        <span className="bw-stat__value">
          {m.value === null ? '—' : fmt.format(m.value)}
          {m.denominator !== null ? <span className="bw-small bw-text-muted"> / {fmt.format(m.denominator)}</span> : null}
        </span>
      )}
      {m.ratio !== null ? <Badge tone="info">{(m.ratio * 100).toFixed(1)} %</Badge> : null}
      <span className="bw-stat__def">{m.definition}</span>
    </div>
  );
}

export function PageHeader({ title, eyebrow, actions, children }: { title: string; eyebrow?: string; actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="bw-header">
      <div className="bw-stack" style={{ gap: 6 }}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Heading level={1}>{title}</Heading>
        {children ? <Text muted>{children}</Text> : null}
      </div>
      {actions ? <div className="bw-row">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="bw-state" role="status">
      <Heading level={3}>{title}</Heading>
      {children ? <Text muted>{children}</Text> : null}
    </div>
  );
}

export type StateKind = 'error' | 'refused' | 'unwired' | 'unauthenticated';
const STATE_TITLES: Record<StateKind, string> = {
  error: 'Impossible de charger ces données',
  refused: 'Accès refusé pour ton rôle',
  unwired: 'Service non branché',
  unauthenticated: 'Session expirée',
};
export function StatusState({ kind, detail, requestId, action }: { kind: StateKind; detail?: string; requestId?: string; action?: ReactNode }) {
  return (
    <div className={`bw-state bw-state--${kind === 'unauthenticated' ? 'refused' : kind}`} role={kind === 'error' ? 'alert' : 'status'} data-state={kind}>
      <Heading level={3}>{STATE_TITLES[kind]}</Heading>
      {detail ? <Text muted>{detail}</Text> : null}
      {requestId ? <Text small muted>Référence : {requestId}</Text> : null}
      {action}
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'ok' | 'error' | 'info' | 'warn'; children: ReactNode }) {
  return (
    <div className={`bw-notice bw-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function KeyValueList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="bw-kv">
      {items.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const tone: Tone = /ACTIVE|VERIFIED|PUBLISHED|PROCESSED|SUCCEEDED|REWARDED|RESOLVED|UPHELD|OK/.test(value)
    ? 'ok'
    : /BANNED|REJECTED|FAILED|DEAD|REVOKED|EXPIRED|OVERDUE/.test(value)
      ? 'danger'
      : /PENDING|OPEN|DRAFT|SUSPENDED|RESTRICTED|REVIEW|ASSIGNED|ESCALATED/.test(value)
        ? 'warn'
        : 'neutral';
  return <Badge tone={tone}>{value}</Badge>;
}

export function Pagination({ nextHref, prevHref }: { nextHref: string | null; prevHref?: string | null }) {
  if (!nextHref && !prevHref) return null;
  return (
    <nav className="bw-pagination" aria-label="Pagination">
      {prevHref ? <ButtonLink variant="secondary" size="sm" href={prevHref}>Début</ButtonLink> : null}
      {nextHref ? <ButtonLink variant="secondary" size="sm" href={nextHref}>Suivant</ButtonLink> : null}
    </nav>
  );
}

/** Mot sélectionnable (case à cocher native : fonctionne sans JavaScript). */
export function WordChip({ id, name, value, label, defaultChecked, disabled }: { id: string; name: string; value: string; label: string; defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <label className="bw-chip" htmlFor={id}>
      <input type="checkbox" id={id} name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} />
      <span>{label}</span>
    </label>
  );
}

export function StoreLinks({ appStoreUrl, playStoreUrl }: { appStoreUrl: string; playStoreUrl: string }) {
  return (
    <div className="bw-stores">
      <ButtonLink variant="secondary" href={appStoreUrl} rel="noopener">App Store</ButtonLink>
      <ButtonLink variant="secondary" href={playStoreUrl} rel="noopener">Google Play</ButtonLink>
    </div>
  );
}
