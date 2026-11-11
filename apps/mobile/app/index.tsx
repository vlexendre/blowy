/** Aiguillage de lancement : selon la session, on part vers l'inscription, la fin du profil ou l'app. */
import { space } from '@blowy/tokens';
import { EmptyState, PetImage, ScreenTemplate, Text } from '@blowy/ui';
import { Redirect } from 'expo-router';
import { View } from 'react-native';

import { usePendingInvite } from '@/features/encounters';
import { useDraft } from '@/features/onboarding';
import { useGate, useRetryGate } from '@/features/session';
import { common } from '@/locales/common';

export default function Gate() {
  const gate = useGate();
  const retry = useRetryGate();
  const petName = useDraft((d) => d.petName);
  const species = useDraft((d) => d.species);
  const pendingInvite = usePendingInvite((p) => p.code);

  switch (gate) {
    case 'signedOut':
      return <Redirect href="/(onboarding)/welcome" />;
    case 'needsOnboarding':
      // Un compte sans pet doit d'abord le créer ; si le brouillon a déjà un pet, on reprend au profil.
      return <Redirect href={petName.trim() ? '/(onboarding)/profil' : '/(onboarding)/craft'} />;
    case 'ready':
      return pendingInvite ? <Redirect href={{ pathname: '/i/[code]', params: { code: pendingInvite } }} /> : <Redirect href="/(tabs)/chats" />;
    case 'offline':
      return (
        <ScreenTemplate scroll={false}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState species={species} mood="triste" title={common.offlineTitle.toUpperCase()} text={common.offlineText} actionLabel={common.retry} onAction={retry} />
          </View>
        </ScreenTemplate>
      );
    default:
      return (
        <ScreenTemplate scroll={false}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }} accessibilityLabel={common.gate.sleeping} accessible>
            <PetImage species={species} mood="dodo" size={180} animation="breathe" />
            <Text muted center>
              {common.gate.sleeping}
            </Text>
          </View>
        </ScreenTemplate>
      );
  }
}
