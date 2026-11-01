import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { InviteRefSchema, type InvitePreview } from '@blowy/api-contract';
import { ButtonLink, Code, Eyebrow, Heading, Notice, PublicLayout, Text } from '@blowy/ui-web';
import { publicApi } from '../../../lib/api';
import { PetSprite, PublicFooter, Stores } from '../../../components/public';

export const metadata: Metadata = { title: 'Invitation', robots: { index: false, follow: false } };

const REASONS: Record<string, string> = { EXPIRED: 'Cette invitation a expiré.', REVOKED: 'Cette invitation a été retirée.', UNKNOWN: 'Invitation inconnue.', INVALID_SIGNATURE: 'Lien d’invitation invalide.' };

/**
 * Invitation : aucun suivi (pas de cookie tiers, pas de pixel) et aucune récompense au clic.
 * Le lien universel ouvre l'app si elle est installée ; sinon, stores + code de repli à saisir
 * dans l'app après installation (la conservation du lien à travers l'installation n'est pas promise).
 */
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!InviteRefSchema.safeParse(token).success) notFound();
  const r = await publicApi<InvitePreview>('GET', `/v1/public/invites/${encodeURIComponent(token)}`);
  return (
    <PublicLayout footer={<PublicFooter />}>
      {!r.ok ? (
        <Notice tone="error">Invitation momentanément indisponible.</Notice>
      ) : !r.data.valid || !r.data.inviter ? (
        <>
          <Heading level={1}>Invitation non valable</Heading>
          <Text>{REASONS[r.data.reason ?? 'UNKNOWN']}</Text>
          <Stores />
        </>
      ) : (
        <>
          <div className="bw-hero">
            {r.data.inviter.species ? <PetSprite species={r.data.inviter.species} name={r.data.inviter.petName ?? r.data.inviter.displayName} /> : null}
            <div className="bw-stack" style={{ gap: 4 }}>
              <Eyebrow>Invitation</Eyebrow>
              <Heading level={1}>{r.data.inviter.displayName} t’attend dans son Quartier.</Heading>
            </div>
          </div>
          <p className="bw-public__lead">
            Crée ton pet : une fois ton compte activé (pet créé, vérification et première action), {r.data.inviter.displayName} et toi recevez chacun {r.data.rewardCoins.referee} pièces. Rien n’est versé pour un simple clic ou une installation.
          </p>
          <ButtonLink variant="lime" block href={`blowy://invite/${encodeURIComponent(token)}`}>Ouvrir dans l’app</ButtonLink>
          <Stores />
          <div className="bw-stack" style={{ gap: 6 }}>
            <Text>Après l’installation, si l’invitation n’est pas reprise automatiquement, saisis ce code dans l’app :</Text>
            <p style={{ margin: 0, fontSize: 28, letterSpacing: '0.2em' }}><Code>{r.data.code}</Code></p>
            {r.data.expiresAt ? <Text small>Valable jusqu’au {new Date(r.data.expiresAt).toLocaleDateString('fr-FR')}.</Text> : null}
          </div>
        </>
      )}
    </PublicLayout>
  );
}
