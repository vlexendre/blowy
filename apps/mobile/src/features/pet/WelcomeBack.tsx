import { Appear, Banner } from '@blowy/ui';
import { router } from 'expo-router';

import { useEncounters } from '@/features/encounters';
import { totalUnread, useLinks } from '@/features/links';
import { home as t } from '@/locales/pet';

/**
 * Retour après une longue absence (`WELCOME_BACK_AFTER_DAYS`, 14 jours sans ouvrir l'accueil) : le minimoa t'accueille
 * et dit ce qui s'est passé pendant ce temps (messages non lus, personnes qui t'ont fait signe), sans reproche. Une
 * action mène là où quelque chose attend ; « Merci » le ferme. Rendu seulement à ce moment-là (les rencontres ne sont
 * pas relues sinon).
 */
export function WelcomeBack({ petName, onClose }: { petName: string; onClose: () => void }) {
  const links = useLinks();
  const encounters = useEncounters();
  if (!links.data || !encounters.data) return null;
  const unread = totalUnread(links.data);
  const waves = encounters.data.incoming.length;
  const action =
    unread > 0
      ? { label: t.welcomeBackChats, go: () => router.navigate('/(tabs)/chats') }
      : waves > 0
        ? { label: t.welcomeBackWaves, go: () => router.navigate('/(tabs)/quartier') }
        : null;
  return (
    <Appear once="home:welcome-back" delay={150}>
      <Banner
        tone="info"
        title={t.welcomeBackTitle(petName)}
        text={t.welcomeBack(unread, waves)}
        actionLabel={action?.label}
        onAction={
          action
            ? () => {
                onClose();
                action.go();
              }
            : undefined
        }
        actionBelow
        onClose={onClose}
        closeLabel={t.welcomeBackClose}
      />
    </Appear>
  );
}
