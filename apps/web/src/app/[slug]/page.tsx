import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicSlugSchema, type PublicProfile } from '@blowy/api-contract';
import { Button, Eyebrow, Heading, Notice, PublicLayout, WordPicker } from '@blowy/ui-web';
import { publicApi } from '../../lib/api';
import { PetSprite, PublicFooter, SPECIES_LABEL } from '../../components/public';
import { submitWords } from './actions';

export const metadata: Metadata = { title: 'Décris-moi en 3 mots', robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  mots: 'Choisis de 1 à 3 mots dans la liste.',
  limite: 'Trop de réponses pour le moment : réessaie plus tard.',
  expire: 'Le formulaire a expiré ou a déjà été envoyé : recharge la page.',
  indisponible: 'Cette page n’accepte plus de réponses.',
  erreur: 'Envoi impossible pour le moment.',
};

export default async function DescribePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const { slug } = await params;
  const { erreur } = await searchParams;
  if (!PublicSlugSchema.safeParse(slug).success) notFound();
  const h = await headers();
  const r = await publicApi<PublicProfile>('GET', `/v1/public/profiles/${slug}`, { visitor: h.get('x-blowy-visitor') ?? undefined, forwardedFor: h.get('x-forwarded-for')?.split(',')[0] ?? null });
  if (!r.ok && r.status === 404) notFound();
  if (!r.ok) {
    return (
      <PublicLayout footer={<PublicFooter />}>
        <Notice tone="error">{r.status === 429 ? ERRORS.limite : 'Page momentanément indisponible.'}</Notice>
      </PublicLayout>
    );
  }
  const p = r.data;
  const petName = p.pet?.name ?? null;
  return (
    <PublicLayout footer={<PublicFooter />}>
      <div className="bw-hero">
        {p.pet ? <PetSprite species={p.pet.species} stage={p.pet.stage} name={p.pet.name} /> : null}
        <div className="bw-stack" style={{ gap: 4 }}>
          <Eyebrow>{petName ? `${petName}, le pet de ${p.displayName}` : `La page de ${p.displayName}`}</Eyebrow>
          <p className="bw-public__lead">« Aide-moi à connaître {p.displayName}. Je ne dirai à personne que c’est toi. »</p>
        </div>
      </div>
      <Heading level={1}>Décris {p.displayName} en 3 mots.</Heading>
      {erreur && ERRORS[erreur] ? <Notice tone="error">{ERRORS[erreur]}</Notice> : null}
      {p.acceptingResponses ? (
        <form action={submitWords} className="bw-stack" style={{ flex: 1 }}>
          <input type="hidden" name="slug" value={p.slug} />
          <input type="hidden" name="formToken" value={p.formToken} />
          <WordPicker name="w" words={p.words} legend={`Mots pour décrire ${p.displayName}`} />
          <p className="bw-small" style={{ color: '#bdb2a6', margin: 0 }}>
            Sans compte ni texte libre. {p.displayName} ne verra jamais qui a répondu. Nous ne gardons ni ton adresse IP ni d’empreinte de ton appareil : seulement un identifiant aléatoire chiffré pour éviter les doublons.
          </p>
          <Button type="submit" variant="lime" block style={{ marginTop: 'auto' }}>
            Envoyer à {petName ?? SPECIES_LABEL[p.pet?.species ?? ''] ?? p.displayName}
          </Button>
        </form>
      ) : (
        <Notice tone="info">{p.displayName} a mis cette page en pause.</Notice>
      )}
    </PublicLayout>
  );
}
