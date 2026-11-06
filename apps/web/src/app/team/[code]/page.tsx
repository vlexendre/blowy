import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ButtonLink, Code, Eyebrow, Heading, PublicLayout, Text } from '@blowy/ui-web';
import { PublicFooter, Stores } from '../../../components/public';

export const metadata: Metadata = { title: 'Venir avec quelqu’un', robots: { index: false, follow: false } };

/**
 * V5.6 (E16) : lien de team `/team/<code>` — ouvre l'app sur l'invitation de team ; le code se saisit dans l'app après
 * l'installation. Aucun prénom, aucune donnée de la team n'est affichée (le serveur vérifie le code dans l'app).
 */
export default async function TeamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9_-]{4,64}$/.test(code)) notFound();
  return (
    <PublicLayout footer={<PublicFooter />}>
      <div className="bw-stack" style={{ gap: 4 }}>
        <Eyebrow>Venir avec quelqu’un</Eyebrow>
        <Heading level={1}>On t’invite à venir ensemble à une sortie Blowy.</Heading>
      </div>
      <ButtonLink variant="lime" block href={`blowy://team/${encodeURIComponent(code)}`}>
        Ouvrir dans l’app
      </ButtonLink>
      <Stores />
      <div className="bw-stack" style={{ gap: 6 }}>
        <Text>Après l’installation, saisis ce code dans l’app :</Text>
        <p style={{ margin: 0, fontSize: 24, letterSpacing: '0.1em' }}>
          <Code>{code}</Code>
        </p>
      </div>
    </PublicLayout>
  );
}
