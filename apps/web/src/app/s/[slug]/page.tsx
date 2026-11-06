import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ShareSlugSchema, type PublicShareView } from '@blowy/api-contract';
import { ButtonLink, Code, Eyebrow, Heading, Notice, PublicLayout, Text } from '@blowy/ui-web';
import { publicApi } from '../../../lib/api';
import { PublicFooter, Stores } from '../../../components/public';

export const metadata: Metadata = { title: 'Blowy', robots: { index: false, follow: false } };

/** Une phrase par carte — jamais un prénom, un lieu, une heure ni l'espèce réelle d'un pet tiers (spec §2.17). */
const CARD: Record<string, { eyebrow: string; title: string; lead: string }> = {
  INVITE: { eyebrow: 'Invitation', title: 'Quelqu’un t’invite à sortir avec Blowy.', lead: 'Des sorties à cinq, près de chez toi, avec des personnes vérifiées. Ta première sortie est offerte.' },
  CONFIRMED: { eyebrow: 'Cette semaine je sors', title: 'Une sortie est confirmée cette semaine.', lead: 'Blowy compose des groupes de cinq personnes vérifiées, dans un lieu partenaire.' },
  TEASER: { eyebrow: 'Alors, jeudi ?', title: 'Une sortie Blowy se prépare.', lead: 'Cinq personnes, un lieu partenaire, aucune animation : juste se rencontrer.' },
  HERE: { eyebrow: 'Je sors ce soir', title: 'Ce soir, une sortie Blowy.', lead: 'Des sorties à cinq avec des personnes vérifiées, toujours avec une équipe joignable.' },
  EVENING: { eyebrow: 'On était cinq', title: 'Une soirée Blowy a eu lieu.', lead: 'Cinq personnes qui ne se connaissaient pas, une table, et l’envie de recommencer.' },
  BAND: { eyebrow: 'Ta bande', title: 'Une bande s’est formée sur Blowy.', lead: 'Les personnes que tu as envie de revoir après une sortie forment ta bande.' },
  HELP_CITY: { eyebrow: 'Aide ta ville à sortir', title: 'Plus on est de personnes vérifiées, plus les sorties se forment.', lead: 'Rejoins Blowy pour qu’une sortie se forme près de chez toi.' },
  TEAM: { eyebrow: 'Venir avec quelqu’un', title: 'On t’invite à venir à deux ou à trois.', lead: 'Une team vient ensemble à la même sortie.' },
};

/**
 * V5.6 (E16) : page publique d'un lien de partage `/s/<slug>`. Le clic est compté côté serveur (agrégé, rien du
 * visiteur) ; aucun cookie tiers ni pixel. Une invitation se réclame dans l'app (code de repli affiché).
 */
export default async function SharePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!ShareSlugSchema.safeParse(slug).success) notFound();
  const r = await publicApi<PublicShareView>('GET', `/v1/public/s/${encodeURIComponent(slug)}`);
  const card = r.ok && r.data.valid && r.data.cardKind ? CARD[r.data.cardKind] : undefined;
  return (
    <PublicLayout footer={<PublicFooter />}>
      {!r.ok ? (
        <Notice tone="error">Lien momentanément indisponible.</Notice>
      ) : !card ? (
        <>
          <Heading level={1}>Lien non valable</Heading>
          <Text>Ce lien a expiré ou n’existe pas.</Text>
          <Stores />
        </>
      ) : (
        <>
          <div className="bw-stack" style={{ gap: 4 }}>
            <Eyebrow>{card.eyebrow}</Eyebrow>
            <Heading level={1}>{card.title}</Heading>
          </div>
          <p className="bw-public__lead">{card.lead}</p>
          <ButtonLink variant="lime" block href={r.data.teamCode ? `blowy://team/${encodeURIComponent(r.data.teamCode)}` : `blowy://s/${encodeURIComponent(slug)}`}>
            Ouvrir dans l’app
          </ButtonLink>
          <Stores />
          {r.data.inviteRef ? (
            <div className="bw-stack" style={{ gap: 6 }}>
              <Text>Après l’installation, si l’invitation n’est pas reprise automatiquement, saisis ce code dans l’app :</Text>
              <p style={{ margin: 0, fontSize: 28, letterSpacing: '0.2em' }}>
                <Code>{r.data.inviteRef}</Code>
              </p>
            </div>
          ) : null}
        </>
      )}
    </PublicLayout>
  );
}
