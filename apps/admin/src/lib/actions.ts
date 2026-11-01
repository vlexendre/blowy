'use server';
/**
 * Server actions de l'admin. Next vérifie l'origine des actions (protection CSRF côté Next) ;
 * l'API exige en plus le jeton CSRF lié à la session. Chaque mutation porte un Idempotency-Key
 * généré au rendu du formulaire : une double soumission est rejouée, jamais dupliquée.
 */
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@blowy/ui-web';
import { api } from './api';
import { COOKIE, SECURE_COOKIES } from './config';

const base = { httpOnly: true, secure: SECURE_COOKIES, sameSite: 'strict' as const, path: '/' };

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const provider = String(fd.get('provider') ?? 'local');
  const credential = String(fd.get('credential') ?? '');
  const r = await api<{ pendingToken: string; mfaEnrolled: boolean; expiresAt: string }>('POST', '/v1/admin/auth/login', { body: { provider, credential } });
  if (!r.ok) return { status: 'error', message: r.status === 401 ? 'Identifiants staff refusés.' : r.message, ...(r.requestId ? { requestId: r.requestId } : {}) };
  const jar = await cookies();
  jar.set(COOKIE.pending, r.data.pendingToken, { ...base, maxAge: 300 });
  redirect(r.data.mfaEnrolled ? '/login/mfa' : '/login/mfa?enroll=1');
}

export async function mfaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const jar = await cookies();
  const pending = jar.get(COOKIE.pending)?.value;
  if (!pending) return { status: 'error', message: 'Étape expirée : reconnecte-toi.' };
  const r = await api<{ sessionToken: string; csrfToken: string; expiresAt: string }>('POST', '/v1/admin/auth/mfa/verify', { body: { code: String(fd.get('code') ?? '') }, extraHeaders: { 'x-blowy-staff-pending': pending } });
  if (!r.ok) return { status: 'error', message: r.message };
  const maxAge = Math.max(60, Math.round((new Date(r.data.expiresAt).getTime() - Date.now()) / 1000));
  jar.set(COOKIE.session, r.data.sessionToken, { ...base, maxAge });
  jar.set(COOKIE.csrf, r.data.csrfToken, { ...base, maxAge });
  jar.delete(COOKIE.pending);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await api('DELETE', '/v1/admin/auth/sessions/current', { commandId: randomUUID() });
  const jar = await cookies();
  jar.delete(COOKIE.session);
  jar.delete(COOKIE.csrf);
  redirect('/login');
}

/** Convertit les champs `f.<nom>[:type]` en corps JSON typé. */
function bodyFrom(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [raw, v] of fd.entries()) {
    if (!raw.startsWith('f.') || typeof v !== 'string') continue;
    const [name, type] = raw.slice(2).split(':') as [string, string | undefined];
    if (type === 'int') out[name] = v === '' ? undefined : Number.parseInt(v, 10);
    else if (type === 'json') out[name] = v === '' ? undefined : JSON.parse(v);
    else if (type === 'bool') out[name] = v === 'true' || v === 'on';
    else if (type === 'nullable') out[name] = v === '' ? null : v;
    else out[name] = v;
  }
  return out;
}

/**
 * Mutation générique : `_endpoint` (doit viser /v1/admin/), `_method`, `_cid` (idempotence),
 * `_ok` (message de succès), `_revalidate` (chemin à rafraîchir), `_stepup` (code MFA si requis).
 */
export async function mutate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const endpoint = String(fd.get('_endpoint') ?? '');
  const method = String(fd.get('_method') ?? 'POST');
  if (!endpoint.startsWith('/v1/admin/') || !['POST', 'PUT', 'DELETE'].includes(method)) return { status: 'error', message: 'Action invalide.' };
  let body: Record<string, unknown>;
  try {
    body = bodyFrom(fd);
  } catch {
    return { status: 'error', message: 'JSON invalide dans le formulaire.' };
  }
  const stepCode = String(fd.get('_stepup') ?? '');
  if (stepCode) {
    const s = await api('POST', '/v1/admin/auth/step-up', { body: { code: stepCode }, commandId: randomUUID() });
    if (!s.ok) return { status: 'stepup', message: `Réauthentification refusée : ${s.message}` };
  }
  const r = await api<{ auditId?: string; replayed?: boolean }>(method, endpoint, { body, commandId: String(fd.get('_cid') || randomUUID()) });
  if (!r.ok) {
    if (r.kind === 'stepup') return { status: 'stepup', message: 'Action sensible : réauthentification MFA requise.' };
    if (r.kind === 'unauthenticated') redirect('/login');
    const prefix = r.kind === 'refused' ? 'Refusé : ' : r.kind === 'unwired' ? 'Service non branché : ' : '';
    return { status: 'error', message: `${prefix}${r.message}${r.reason ? ` (${r.reason})` : ''}`, ...(r.requestId ? { requestId: r.requestId } : {}) };
  }
  const revalidate = String(fd.get('_revalidate') ?? '');
  if (revalidate.startsWith('/')) revalidatePath(revalidate);
  const replay = r.data && typeof r.data === 'object' && 'replayed' in r.data && r.data.replayed ? ' (déjà appliqué, rejoué)' : '';
  const audit = r.data && typeof r.data === 'object' && 'auditId' in r.data && r.data.auditId ? ` · audit ${String(r.data.auditId).slice(-8)}` : '';
  return { status: 'ok', message: `${String(fd.get('_ok') || 'Action enregistrée.')}${replay}${audit}` };
}

export async function stepUpAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await api<{ validUntil: string }>('POST', '/v1/admin/auth/step-up', { body: { code: String(fd.get('code') ?? '') }, commandId: randomUUID() });
  if (!r.ok) return { status: 'error', message: r.message };
  return { status: 'ok', message: `Réauthentifié jusqu’à ${new Date(r.data.validUntil).toLocaleTimeString('fr-FR')}.` };
}

/**
 * Brouillon de tuning depuis le formulaire typé : base = version active (JSON caché), champs
 * `t.<chemin>` numériques/booléens appliqués, nouvelle version. L'API valide par TuningSchema.
 */
export async function tuningDraftAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  let base: Record<string, unknown>;
  try {
    base = JSON.parse(String(fd.get('_base') ?? '{}')) as Record<string, unknown>;
  } catch {
    return { status: 'error', message: 'Base de tuning illisible.' };
  }
  const set = (path: string, value: unknown) => {
    const keys = path.split('.');
    let cur = base as Record<string, unknown>;
    for (const k of keys.slice(0, -1)) {
      if (typeof cur[k] !== 'object' || cur[k] === null) return;
      cur = cur[k] as Record<string, unknown>;
    }
    const last = keys.at(-1)!;
    if (!(last in cur)) return; // aucun nouveau paramètre : formulaire typé sur les clés existantes
    cur[last] = value;
  };
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith('t.') || typeof v !== 'string') continue;
    const [path, type] = k.slice(2).split(':') as [string, string | undefined];
    if (type === 'bool') set(path, v === 'true');
    else if (v.trim() !== '') set(path, Number(v));
  }
  base.version = String(fd.get('version') ?? '');
  const r = await api<{ result: { id: string; version: string } }>('POST', '/v1/admin/tuning/drafts', { body: { payload: base, note: String(fd.get('note') ?? '') || undefined }, commandId: String(fd.get('_cid') || randomUUID()) });
  if (!r.ok) return { status: 'error', message: `${r.message}${r.reason ? ` (${r.reason})` : ''}`, ...(r.requestId ? { requestId: r.requestId } : {}) };
  revalidatePath('/tuning');
  return { status: 'ok', message: `Brouillon ${r.data.result.version} créé — ouvre-le pour comparer et publier.` };
}
