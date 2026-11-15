/**
 * Moi › L'IA et toi (App Review 5.1.2(i), audit B5) : un seul endroit pour voir chaque usage de l'IA tierce et retirer
 * son accord. Le prestataire (nom, pays) vient de l'API. Preuves d'habitude : interrupteur (retrait immédiat).
 * Lecture des chats : accord chat par chat, sur l'écran des minimoas. Bilan de la semaine : rien n'est demandé, il part
 * sans aucun prénom ni nom.
 */
import { Banner, SettingsSection, SettingsTemplate, Skeleton, Stack, Stagger, Text } from '@blowy/ui';
import { router } from 'expo-router';

import { ScreenMotion } from '@/core';
import { useAiConsents, useSetAiProofs } from '@/features/ai';
import { openLegal } from '@/features/me';
import { goBack } from '@/features/session';
import { ia } from '@/locales/ia';

const t = ia.screen;

export default function AiAndYou() {
  const consents = useAiConsents();
  const setProofs = useSetAiProofs();
  const back = () => goBack('/(tabs)/moi');
  const data = consents.data;
  const proofs = data?.proofs;
  const status = !proofs ? '' : proofs.consent === true ? t.proofs.on(proofs.at ? ia.date(proofs.at) : '') : proofs.consent === false ? t.proofs.off : t.proofs.never;

  return (
    <ScreenMotion>
      <SettingsTemplate title={t.title} onBack={back} backLabel={t.back}>
        {consents.isPending ? (
          <Stack>
            <Skeleton height={64} radius="lg" />
            <Skeleton height={120} radius="lg" />
            <Skeleton height={120} radius="lg" />
          </Stack>
        ) : !data ? (
          <Banner tone="error" title={t.loadError} text={consents.error?.message ?? ''} actionLabel={t.retry} onAction={() => void consents.refetch()} />
        ) : (
          <Stagger onceKey="moi:ia" step={50}>
            <Text key="lead" size={15} muted>
              {t.lead(data.provider.name, data.provider.country)}
            </Text>
            {setProofs.isError ? <Banner key="error" tone="error" text={t.error} onClose={() => setProofs.reset()} /> : null}
            <SettingsSection
              key="proofs"
              title={t.sections.proofs}
              rows={[
                {
                  key: 'proofs',
                  title: t.proofs.title,
                  subtitle: status,
                  switchValue: proofs?.consent === true,
                  onSwitchChange: (on: boolean) => setProofs.mutate(on),
                  disabled: setProofs.isPending,
                },
              ]}
              footer={t.proofs.footer}
            />
            <SettingsSection
              key="chats"
              title={t.sections.chats}
              rows={[{ key: 'chats', title: t.chats.title, subtitle: t.chats.subtitle, onPress: () => router.push('/moi/minimoas') }]}
              footer={t.chats.footer}
            />
            <SettingsSection
              key="review"
              title={t.sections.review}
              rows={[{ key: 'review', title: t.review.title, subtitle: t.review.subtitle, chevron: false }]}
              footer={t.review.footer}
            />
            <SettingsSection key="policy" rows={[{ key: 'policy', title: t.policy, onPress: openLegal('confidentialite'), chevron: true }]} />
          </Stagger>
        )}
      </SettingsTemplate>
    </ScreenMotion>
  );
}
