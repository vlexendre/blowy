'use server';
/**
 * Server actions de l'espace lieu (BFF). Cookies DISTINCTS du staff (`blowy_venue*`, HttpOnly,
 * SameSite=Strict, Secure hors local) ; l'API exige en plus le CSRF lié à la session lieu.
 * Chaque mutation porte un Idempotency-Key fixé au rendu du formulaire (double clic = rejoué).
 */
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from '@blowy/ui-web';
import { api } from './api';
import { SECURE_COOKIES, VENUE_COOKIE } from './config';

const base = { httpOnly: true, secure: SECURE_COOKIES, sameSite: 'strict' as const, path: '/' };
const ALLOWED = /^\/v1\/venue\/(schedule\/days|schedule\/cap|schedule\/closures|contract\/sign|incidents|photo-requests)(\?venueId=[0-9a-f-]{36})?$/;

export async function venueLoginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await api<{ pendingToken: string; mfaEnrolled: boolean }>('POST', '/v1/venue/auth/login', { body: { provider: String(fd.get('provider') ?? 'local'), credential: String(fd.get('credential') ?? '') }, realm: 'venue' });
  if (!r.ok) return { status: 'error', message: r.status === 401 ? 'Identifiants refusés.' : r.message };
  (await cookies()).set(VENUE_COOKIE.pending, r.data.pendingToken, { ...base, maxAge: 300 });
  redirect(r.data.mfaEnrolled ? '/lieu/login/mfa' : '/lieu/login/mfa?enroll=1');
}

export async function venueMfaAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const jar = await cookies();
  const pending = jar.get(VENUE_COOKIE.pending)?.value;
  if (!pending) return { status: 'error', message: 'Étape expirée : reconnectez-vous.' };
  const r = await api<{ sessionToken: string; csrfToken: string; expiresAt: string }>('POST', '/v1/venue/auth/mfa/verify', { body: { code: String(fd.get('code') ?? '') }, extraHeaders: { 'x-blowy-venue-pending': pending }, realm: 'venue' });
  if (!r.ok) return { status: 'error', message: r.message };
  const maxAge = Math.max(60, Math.round((new Date(r.data.expiresAt).getTime() - Date.now()) / 1000));
  jar.set(VENUE_COOKIE.session, r.data.sessionToken, { ...base, maxAge });
  jar.set(VENUE_COOKIE.csrf, r.data.csrfToken, { ...base, maxAge });
  jar.delete(VENUE_COOKIE.pending);
  redirect('/lieu/effectif');
}

export async function venueLogoutAction(): Promise<void> {
  await api('DELETE', '/v1/venue/auth/session', { commandId: randomUUID(), realm: 'venue' });
  const jar = await cookies();
  jar.delete(VENUE_COOKIE.session);
  jar.delete(VENUE_COOKIE.csrf);
  redirect('/lieu/login');
}

/** Corps JSON depuis les champs `f.<nom>[:int|bool|nullable]`. */
function bodyFrom(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [raw, v] of fd.entries()) {
    if (!raw.startsWith('f.') || typeof v !== 'string') continue;
    const [name, type] = raw.slice(2).split(':') as [string, string | undefined];
    if (type === 'int') out[name] = Number.parseInt(v, 10);
    else if (type === 'bool') out[name] = v === 'true';
    else if (type === 'nullable') out[name] = v === '' ? null : v;
    else out[name] = v;
  }
  return out;
}

async function send(fd: FormData) {
  const endpoint = String(fd.get('_endpoint') ?? '');
  const method = String(fd.get('_method') ?? 'POST');
  if (!ALLOWED.test(endpoint) || !['POST', 'PUT'].includes(method)) return { ok: false as const, message: 'Action invalide.' };
  const r = await api(method, endpoint, { body: bodyFrom(fd), commandId: String(fd.get('_cid') || randomUUID()), realm: 'venue' });
  if (!r.ok && r.kind === 'unauthenticated') redirect('/lieu/login');
  const back = String(fd.get('_revalidate') ?? '');
  if (back.startsWith('/lieu/')) revalidatePath(back);
  return r.ok ? { ok: true as const } : { ok: false as const, message: `${r.message}${r.reason ? ` (${r.reason})` : ''}` };
}

/** Mutation directe (interrupteurs, plafond) : sans JavaScript, la page est simplement réaffichée. */
export async function venueQuickAction(fd: FormData): Promise<void> {
  await send(fd);
}

/** Mutation avec retour affiché (formulaires : signalement, fermeture, photo, signature). */
export async function venueFormAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const r = await send(fd);
  return r.ok ? { status: 'ok', message: String(fd.get('_ok') || 'Enregistré.') } : { status: 'error', message: r.message };
}
