/** Templates : mises en page complètes, sans données. */
import type { ReactNode } from 'react';
import { Badge, Text } from '../atoms/index';
import { AdminNav, type NavItem } from '../organisms/index';

export function AdminShell({ nav, current, user, env, children }: { nav: NavItem[]; current: string; user: ReactNode; env: string; children: ReactNode }) {
  return (
    <div className="bw-admin">
      <a href="#main" className="bw-skip">Aller au contenu</a>
      <aside className="bw-admin__side">
        <a className="bw-admin__brand" href="/">blowy admin</a>
        <Badge tone={env === 'production' ? 'danger' : 'info'}>{env}</Badge>
        <AdminNav items={nav} current={current} />
        <div className="bw-admin__user">{user}</div>
      </aside>
      <main id="main" className="bw-admin__main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="bw-auth">
      <div className="bw-auth__card bw-card bw-stack">{children}</div>
    </main>
  );
}

export function PublicLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="bw-public">
      <div className="bw-public__blob" aria-hidden="true" />
      <main className="bw-public__inner">
        {children}
        <footer className="bw-public__foot">{footer}</footer>
      </main>
    </div>
  );
}

export function LegalLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <footer className="bw-legal bw-row bw-small">{footer}</footer>
    </>
  );
}

export function PublicFootnote({ children }: { children: ReactNode }) {
  return <Text small muted>{children}</Text>;
}
