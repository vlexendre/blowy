/**
 * Espace lieu partenaire (maquettes L-Effectif, L-Creneaux, L-Contrat) : composants serveur sans
 * données ni état, styles `@blowy/ui-web/venue.css`. Le gabarit reproduit la maquette au pixel près
 * (1280 × 800) ; les pages n'y ajoutent que leurs données.
 */
import type { ReactNode } from 'react';

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export interface VenueNavItem {
  href: string;
  label: string;
}

/** Gabarit : navigation latérale (marque, lieu, 3 écrans, astreinte) + zone principale. */
export function VenueShell({ venueLabel, nav, current, onCall, children }: { venueLabel: string; nav: VenueNavItem[]; current: string; onCall: { phone: string | null; hours: string }; children: ReactNode }) {
  return (
    <div className="bw-venue">
      <a href="#main" className="bw-v-skip">Aller au contenu</a>
      <nav aria-label="Espace lieu" className="bw-v-nav">
        <span className="bw-v-d bw-v-brand">
          blowy<span aria-hidden="true" className="bw-v-brand__dot">.</span> <span className="bw-v-brand__tag">LIEU</span>
        </span>
        <span className="bw-v-venue">{venueLabel}</span>
        {nav.map((n) => (
          <a key={n.href} href={n.href} className="bw-v-link" aria-current={current.startsWith(n.href) ? 'page' : undefined}>
            {n.label}
          </a>
        ))}
        <div className="bw-v-oncall">
          <span className="bw-v-oncall__lbl">ASTREINTE BLOWY</span>
          <span className="bw-v-d bw-v-oncall__num">{onCall.phone ?? 'Numéro à venir'}</span>
          <span className="bw-v-oncall__hours">{onCall.hours}</span>
        </div>
      </nav>
      <main id="main" className="bw-v-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function VenueHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <h1 className="bw-v-d bw-v-title">{title}</h1>
      {children ? <p className="bw-v-lead">{children}</p> : null}
    </div>
  );
}

/** Deux colonnes : contenu principal + colonne latérale de 340 px. */
export function VenueColumns({ main, aside }: { main: ReactNode; aside?: ReactNode }) {
  return (
    <div className="bw-v-cols">
      <div className="bw-v-col">{main}</div>
      {aside ? <aside className="bw-v-aside">{aside}</aside> : null}
    </div>
  );
}

/** Carte latérale (titre + texte), éventuellement un lien entier. */
export function VenueSideCard({ title, children, href, gap = 'md' }: { title: string; children: ReactNode; href?: string; gap?: 'sm' | 'md' | 'lg' }) {
  const cls = cx('bw-v-card', 'bw-v-card--side', gap === 'sm' && 'bw-v-card--tight', gap === 'lg' && 'bw-v-card--wide');
  const body = (
    <>
      <span className="bw-v-d bw-v-card__title">{title}</span>
      {children}
    </>
  );
  return href ? <a href={href} className={cls}>{body}</a> : <div className={cls}>{body}</div>;
}

export function VenueText({ children, relaxed }: { children: ReactNode; relaxed?: boolean }) {
  return <span className={cx('bw-v-soft', relaxed && 'bw-v-soft--lh')}>{children}</span>;
}

export function VenueLabel({ children }: { children: ReactNode }) {
  return <span className="bw-v-lbl">{children}</span>;
}

export function VenueGroup({ children, label }: { children: ReactNode; label?: string }) {
  return <div className="bw-v-grp" role={label ? 'group' : undefined} aria-label={label}>{children}</div>;
}

/** Ligne d'un groupe ; `kind` fixe la hauteur et la taille du texte de la maquette. */
export function VenueRow({ kind = 'base', children }: { kind?: 'base' | 'head' | 'person' | 'day'; children: ReactNode }) {
  return <div className={cx('bw-v-row', kind !== 'base' && `bw-v-row--${kind}`)}>{children}</div>;
}

export function VenueValue({ children, tone, nowrap }: { children: ReactNode; tone?: 'ok'; nowrap?: boolean }) {
  return <span className={cx('bw-v-val', tone === 'ok' && 'bw-v-val--ok', nowrap && 'bw-v-val--nowrap')}>{children}</span>;
}

/** Illustration décorative (jamais le pet d'une personne : le lieu ne voit que des prénoms). */
export function VenueAvatar({ src, background }: { src: string; background: string }) {
  return (
    <span className="bw-v-avatar" style={{ background }}>
      <img src={src} alt="" aria-hidden="true" width={29} height={29} />
    </span>
  );
}

export function VenueChip({ children }: { children: ReactNode }) {
  return <span className="bw-v-chip">{children}</span>;
}

/** Interrupteur (bouton de soumission d'un formulaire serveur : fonctionne sans JavaScript). */
export function VenueSwitch({ on, label, disabled }: { on: boolean; label: string; disabled?: boolean }) {
  return (
    <button type="submit" role="switch" aria-checked={on} aria-label={label} className="bw-v-sw" disabled={disabled}>
      <i>
        <b />
      </i>
    </button>
  );
}

export function VenuePill({ children, label, disabled }: { children: ReactNode; label: string; disabled?: boolean }) {
  return (
    <button type="submit" aria-label={label} className="bw-v-pill" disabled={disabled}>
      {children}
    </button>
  );
}

export function VenueNotice({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  return <p role={tone === 'error' ? 'alert' : 'status'} className={cx('bw-v-notice', `bw-v-notice--${tone}`)} style={{ margin: 0 }}>{children}</p>;
}

export function VenueAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bw-v-auth">
      <div className="bw-v-auth__card">{children}</div>
    </main>
  );
}
