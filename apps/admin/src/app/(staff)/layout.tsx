import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { StaffMe } from '@blowy/api-contract';
import { AdminShell, Badge, Button } from '@blowy/ui-web';
import { apiGet } from '../../lib/api';
import { logoutAction } from '../../lib/actions';
import { BLOWY_ENV } from '../../lib/config';
import { NAV } from '../../lib/nav';

export const dynamic = 'force-dynamic';

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const me = await apiGet<StaffMe>('/v1/admin/auth/me');
  if (!me.ok) redirect('/login');
  const perms = new Set(me.data.permissions);
  const current = (await headers()).get('x-pathname') ?? '/';
  return (
    <AdminShell
      nav={NAV.filter((n) => perms.has(n.perm))}
      current={current}
      env={BLOWY_ENV}
      user={
        <>
          <strong>{me.data.displayName}</strong>
          <span className="bw-row">{me.data.roles.map((r) => <Badge key={r} tone="info">{r}</Badge>)}</span>
          <span>{me.data.stepUpValidUntil ? 'Réauthentifié' : 'Step-up requis pour les actions sensibles'}</span>
          <form action={logoutAction}>
            <Button type="submit" variant="secondary" size="sm">Se déconnecter</Button>
          </form>
        </>
      }
    >
      {children}
    </AdminShell>
  );
}
