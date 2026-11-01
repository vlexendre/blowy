import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ANONYMOUS_WORD_ENTRIES } from '@blowy/content';
import { ButtonLink, Heading, PublicLayout, Text } from '@blowy/ui-web';
import { PublicFooter, Stores } from '../../../components/public';
import { SENT_COOKIE } from '../../../lib/config';

export const metadata: Metadata = { title: 'Envoyé', robots: { index: false, follow: false } };
const LABEL = new Map(ANONYMOUS_WORD_ENTRIES.map((w) => [w.id as string, w.fr]));

interface Sent { slug: string; words: string[]; already: boolean }
function parseSent(raw: string | undefined): Sent | null {
  try {
    return raw ? (JSON.parse(raw) as Sent) : null;
  } catch {
    return null;
  }
}

export default async function SentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const raw = (await cookies()).get(SENT_COOKIE)?.value;
  const sent = parseSent(raw);
  if (!sent || sent.slug !== slug) redirect(`/${slug}`);
  const chosen = sent.words.map((w) => LABEL.get(w) ?? w).join(', ');
  return (
    <PublicLayout footer={<PublicFooter />}>
      <Heading level={1}>{sent.already ? 'Déjà envoyé.' : 'Envoyé.'}</Heading>
      <p className="bw-public__lead">{sent.already ? 'Tu avais déjà répondu : ta première réponse est conservée, une seule par personne.' : `« ${chosen} » est parti. Sans jamais dire que c’est toi.`}</p>
      <div className="bw-stack" style={{ marginTop: 'auto', background: 'var(--c-cream)', color: 'var(--c-ink)', borderRadius: 24, padding: 14 }}>
        <Heading level={3}>Et toi, tes potes diraient quoi ?</Heading>
        <Text small>Crée ton pet, gratuit. Comptes vérifiés, accords mutuels.</Text>
        <Stores />
        <ButtonLink variant="ghost" href="/">Découvrir Blowy</ButtonLink>
      </div>
    </PublicLayout>
  );
}
