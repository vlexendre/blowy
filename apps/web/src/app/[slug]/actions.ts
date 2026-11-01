'use server';
/** Envoi des mots : fonctionne sans JavaScript (formulaire HTML + server action). */
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { PublicSlugSchema, AnonymousWordSchema } from '@blowy/api-contract';
import { publicApi } from '../../lib/api';
import { SENT_COOKIE, VISITOR_COOKIE, IS_LOCAL } from '../../lib/config';

export async function submitWords(fd: FormData): Promise<void> {
  const slug = PublicSlugSchema.safeParse(String(fd.get('slug') ?? ''));
  if (!slug.success) redirect('/');
  const words = fd.getAll('w').map(String).filter((w) => AnonymousWordSchema.safeParse(w).success);
  if (words.length < 1 || words.length > 3) redirect(`/${slug.data}?erreur=mots`);
  const jar = await cookies();
  const h = await headers();
  const visitor = jar.get(VISITOR_COOKIE)?.value ?? h.get('x-blowy-visitor') ?? '';
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? h.get('x-real-ip');
  const r = await publicApi<{ status: string; displayName: string }>('POST', `/v1/public/profiles/${slug.data}/responses`, { body: { words, formToken: String(fd.get('formToken') ?? ''), visitorToken: visitor }, forwardedFor: ip });
  if (!r.ok) {
    const code = r.status === 429 ? 'limite' : r.status === 404 ? 'indisponible' : r.status === 409 || r.status === 412 ? 'expire' : 'erreur';
    redirect(`/${slug.data}?erreur=${code}`);
  }
  jar.set(SENT_COOKIE, JSON.stringify({ slug: slug.data, words, already: r.data.status === 'ALREADY_ANSWERED' }), { httpOnly: true, sameSite: 'lax', secure: !IS_LOCAL, path: `/${slug.data}`, maxAge: 300 });
  redirect(`/${slug.data}/envoye`);
}
