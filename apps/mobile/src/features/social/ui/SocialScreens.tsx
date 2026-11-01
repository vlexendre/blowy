/**
 * Quartier, chez un ami, carte (consentement + zone approximative), partage.
 * Endpoints social non livrés (V3) → « indisponible » ; la carte gère réellement la
 * permission de localisation et le floutage à 500 m avant tout envoi.
 */
import { ICONS, SCENES } from '@blowy/sprites';
import { Banner, Button, DetailScreenTemplate, EmptyState, EmptyStateTemplate, ListRow, LoadingState, Sprite, StatusPill, Surface, TabScreenTemplate, space } from '@blowy/ui-mobile';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, View } from 'react-native';
import { isUnavailable } from '../../../core/api/errors';
import { paths } from '../../../core/navigation/paths';
import { useServices } from '../../../core/providers/services';
import { t } from '../../../i18n';
import { useMe, useSavePrivacy } from '../../account';
import { PlusGate } from '../../subscription';
import { useFriends, useGroups } from '../api/probes';

export function NeighborhoodScreen() {
  const friends = useFriends();
  const groups = useGroups();
  return (
    <TabScreenTemplate title={t('social.neighborhood.title')} testID="screen-neighborhood">
      <Sprite path={SCENES.STREET} size={358} height={232} contentFit="cover" accessibilityLabel={t('social.neighborhood.lead')} />
      {friends.isLoading ? <LoadingState label={t('common.loading')} /> : null}
      {isUnavailable(friends.error) || friends.isError ? <EmptyState title={t('common.unavailableTitle')} message={t('common.unavailableBody')} actionLabel={t('common.retry')} onAction={() => void friends.refetch()} /> : null}
      <Surface style={{ gap: space.xs }}>
        <ListRow icon="plus" title={t('social.neighborhood.invite')} onPress={() => router.push(paths.share)} testID="neighborhood-invite" />
        <ListRow icon="trophy" title={t('social.league.title')} onPress={() => router.push(paths.league)} />
        <ListRow icon="neighborhood" title={t('chats.groupsSection')} subtitle={groups.isSuccess ? undefined : t('common.unavailableTitle')} />
      </Surface>
    </TabScreenTemplate>
  );
}

export function FriendHomeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EmptyStateTemplate headerTitle={t('social.friend.title', { name: '' }).trim()} title={t('common.unavailableTitle')} message={t('common.unavailableBody')} illustrationPath={SCENES.HOUSE} onBack={() => router.back()} backLabel={t('common.back')} testID={`screen-friend-${id}`} />;
}

/**
 * Carte (V4-Carte) : consentement d'apparition (préférence privacy.mapVisible), permission
 * de localisation au moment utile, refus = alternative (le reste fonctionne).
 */
export function MapScreen() {
  const me = useMe();
  const savePrivacy = useSavePrivacy();
  const { location } = useServices();
  const perm = useQuery({ queryKey: ['location', 'perm'], queryFn: () => location.getForegroundPermission() });
  const [denied, setDenied] = useState(false);
  const privacy = me.data?.privacy;

  const consent = async (visible: boolean) => {
    if (!privacy) return;
    if (visible) {
      const p = await location.requestForegroundPermission();
      if (p !== 'granted') {
        setDenied(true);
        return;
      }
    }
    await savePrivacy.mutateAsync({ ...privacy, mapVisible: visible });
    void perm.refetch();
  };

  return (
    <TabScreenTemplate title={t('social.map.title')} testID="screen-map" banner={denied ? <Banner message={t('social.map.denied')} live /> : null}>
      <Sprite path={SCENES.CITY_MAP} size={358} height={300} contentFit="cover" accessibilityLabel={t('social.map.title')} />
      <Surface style={{ gap: space.sm }}>
        <ListRow icon="pin" title={t('social.map.consentTitle')} subtitle={t('social.map.consentLead')} />
        {privacy ? <StatusPill kind={privacy.mapVisible ? 'confirmed' : 'info'} label={privacy.mapVisible ? t('social.map.consentYes') : t('social.map.consentNo')} /> : null}
        <Button label={t('social.map.consentYes')} onPress={() => void consent(true)} loading={savePrivacy.isPending} disabled={!privacy} testID="map-consent-yes" />
        <Button label={t('social.map.consentNo')} variant="secondary" onPress={() => void consent(false)} disabled={!privacy} />
      </Surface>
      <PlusGate entitlement="PLUS_MAP" fallback={<Banner message={t('social.map.plusRequired')} tone="violet" icon="star" actionLabel={t('subscription.upgrade')} onAction={() => router.push(paths.paywall)} />}>
        <EmptyState title={t('common.unavailableTitle')} message={t('common.unavailableBody')} />
      </PlusGate>
    </TabScreenTemplate>
  );
}

/** Partager (V4-Story) : feuille de partage système ; aucune récompense pour « avoir posté ». */
export function ShareScreen() {
  return (
    <DetailScreenTemplate title={t('social.share.title')} lead={t('social.share.lead')} onBack={() => router.back()} backLabel={t('common.back')} testID="screen-share">
      <View style={{ alignItems: 'center' }}>
        <Sprite path={ICONS.appIconNino} size={160} />
      </View>
      <Button label={t('social.share.title')} icon="share" onPress={() => void Share.share({ message: t('onboarding.welcome.title') })} />
      <Banner message={t('common.unavailableBody')} tone="cream" />
    </DetailScreenTemplate>
  );
}
