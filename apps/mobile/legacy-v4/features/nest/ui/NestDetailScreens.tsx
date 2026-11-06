/**
 * Sous-écrans du Nid : fiche & garde-robe, boutique, série, mission, ligue.
 * Fiche : données réelles (GET /v1/pets/me). Boutique/série : portefeuille et catalogue de G.
 * Mission / ligue : endpoints non livrés → état « indisponible » honnête.
 */
import { STAGES } from '@blowy/domain';
import { ACCESSORIES, ICONS, resolveSprite } from '@blowy/sprites';
import {
  Banner,
  Button,
  DetailScreenTemplate,
  EmptyStateTemplate,
  KeyValue,
  ListRow,
  LoadingState,
  PetRenderer,
  SectionTitle,
  Sprite,
  StatusPill,
  Surface,
  Text,
  VisionCard,
  petAccessibilityLabel,
  space,
} from '@blowy/ui-mobile';
import { router } from 'expo-router';
import { View } from 'react-native';
import { isUnavailable } from '../../../core/api/errors';
import { useNetwork } from '../../../core/network/network';
import { hasKey, t, tDynamic } from '../../../i18n';
import { useCatalog, useEconomyCommands, useWalletBalance } from '../../economy';
import { petLabelWords, speciesName, useMyPet } from '../../pets';
import { useLeague, useTodayMission } from '../../social';

const back = () => router.back();

export function FicheScreen() {
  const pet = useMyPet();
  const wallet = useWalletBalance();
  if (!pet.data) return pet.isLoading ? <LoadingState label={t('common.loading')} /> : <EmptyStateTemplate title={t('common.unavailableTitle')} message={t('common.unavailableBody')} onBack={back} backLabel={t('common.back')} />;
  const p = pet.data;
  const owned = new Set((wallet.data?.inventory ?? []).filter((i) => i.status === 'OWNED' || i.status === 'ACTIVE').map((i) => i.catalogItemId.toUpperCase()));
  return (
    <DetailScreenTemplate title={t('fiche.title', { name: p.name })} onBack={back} backLabel={t('common.back')} testID="screen-fiche">
      <View style={{ alignItems: 'center' }}>
        <PetRenderer species={p.species} stage={p.stage} pose={p.pose} bodyHeight={170} accessibilityLabel={petAccessibilityLabel({ name: p.name, pose: p.pose }, petLabelWords)} />
      </View>
      <Surface style={{ gap: space.xs }}>
        <KeyValue label={t('fiche.species')} value={speciesName(p.species)} />
        <KeyValue label={t('fiche.stage')} value={tDynamic(`stage.${p.stage}`)} />
        <KeyValue label={t('fiche.xp')} value={String(p.petXp)} />
      </Surface>
      <SectionTitle label={t('fiche.evolution')} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
        {STAGES.map((s) => (
          <View key={s} style={{ alignItems: 'center', gap: space.xxs }}>
            <Sprite path={resolveSprite(p.species, s, 'PRESENTATION').path} size={s === p.stage ? 72 : 52} accessibilityLabel={tDynamic(`stage.${s}`)} />
            <StatusPill kind={s === p.stage ? 'confirmed' : 'info'} label={tDynamic(`stage.${s}`)} />
          </View>
        ))}
      </View>
      <SectionTitle label={t('fiche.wardrobe')} />
      {owned.size === 0 ? (
        <Text variant="small" tone="muted">
          {t('fiche.wardrobeEmpty')}
        </Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
          {Object.values(ACCESSORIES)
            .filter((a) => owned.has(a.id))
            .map((a) => (
              <Sprite key={a.id} path={a.path} size={48} accessibilityLabel={tDynamic(a.labelKey)} />
            ))}
        </View>
      )}
      {p.vision ? (
        <>
          <SectionTitle label={t('fiche.vision')} />
          <VisionCard
            petName={p.name}
            speciesLabel={tDynamic(`species.kind.${p.species}`)}
            spritePath={resolveSprite(p.species, p.stage, 'PRESENTATION').path}
            pendingLabel={t('vision.card.pending')}
            rows={[
              { key: 'school', label: t('vision.card.school'), value: tDynamic(`vision.school.${p.vision.school}`) },
              { key: 'sunday', label: t('vision.card.sunday'), value: tDynamic(`vision.sunday.${p.vision.sunday}`) },
              { key: 'passions', label: t('vision.card.passions'), value: p.vision.passions.map((x) => tDynamic(`vision.passion.${x}`)).join(', ') },
              { key: 'limit', label: t('vision.card.limit'), value: tDynamic(`vision.limit.${p.vision.limit}`) },
            ]}
          />
        </>
      ) : null}
    </DetailScreenTemplate>
  );
}

export function ShopScreen() {
  const wallet = useWalletBalance();
  const catalog = useCatalog();
  const { buy } = useEconomyCommands();
  const online = useNetwork((s) => s.online);
  if (isUnavailable(catalog.error) || isUnavailable(wallet.error)) return <EmptyStateTemplate title={t('common.unavailableTitle')} message={t('common.unavailableBody')} onBack={back} backLabel={t('common.back')} />;
  const balance = wallet.data?.balance ?? null;
  return (
    <DetailScreenTemplate title={t('shop.title')} eyebrow={balance !== null ? t('shop.balance', { coins: balance }) : undefined} onBack={back} backLabel={t('common.back')} testID="screen-shop" banner={!online ? <Banner message={t('common.requiresNetwork')} /> : null}>
      {catalog.isLoading ? <LoadingState label={t('common.loading')} /> : null}
      {buy.isSuccess ? <StatusPill kind="confirmed" label={t('shop.confirmed')} /> : null}
      {(catalog.data?.items ?? []).map((it) => {
        const affordable = balance !== null && balance >= it.priceCoins;
        return (
          <Surface key={it.id} style={{ gap: space.sm }}>
            <ListRow title={it.labelKey && hasKey(it.labelKey) ? tDynamic(it.labelKey) : it.id} subtitle={t('shop.buy', { price: it.priceCoins })} leading={<Sprite path={ICONS.coin} size={32} />} />
            <Button
              size="sm"
              label={affordable ? t('shop.buy', { price: it.priceCoins }) : t('shop.insufficient')}
              disabled={!affordable || !online}
              loading={buy.isPending && buy.variables === it.id}
              onPress={() => void buy.mutateAsync(it.id)}
            />
          </Surface>
        );
      })}
    </DetailScreenTemplate>
  );
}

export function StreakScreen() {
  const wallet = useWalletBalance();
  const { freeze } = useEconomyCommands();
  const online = useNetwork((s) => s.online);
  const freezes = wallet.data?.availableStreakFreezes ?? 0;
  return (
    <DetailScreenTemplate title={t('streak.title')} onBack={back} backLabel={t('common.back')} testID="screen-streak">
      <View style={{ alignItems: 'center' }}>
        <Sprite path={ICONS.flame} size={120} />
      </View>
      {freeze.data ? <KeyValue label={t('streak.title')} value={t('streak.days', { days: freeze.data.streakLength })} /> : null}
      <Surface style={{ gap: space.sm }}>
        <KeyValue label={t('streak.freeze')} value={t('streak.freezes', { count: freezes })} />
        <Text variant="small" tone="muted">
          {t('streak.freezeHint')}
        </Text>
        <Button label={t('streak.freeze')} variant="secondary" disabled={freezes === 0 || !online} loading={freeze.isPending} onPress={() => void freeze.mutateAsync()} />
      </Surface>
    </DetailScreenTemplate>
  );
}

/** Mission / ligue : endpoints V3 non livrés → indisponible, jamais de contenu fictif. */
export function MissionScreen() {
  const m = useTodayMission();
  if (m.isLoading) return <LoadingState label={t('common.loading')} />;
  return <EmptyStateTemplate headerTitle={t('mission.title')} title={t('common.unavailableTitle')} message={`${t('common.unavailableBody')} ${t('mission.private')}`} onBack={back} backLabel={t('common.back')} actionLabel={t('common.retry')} onAction={() => void m.refetch()} />;
}

export function LeagueScreen() {
  const l = useLeague();
  if (l.isLoading) return <LoadingState label={t('common.loading')} />;
  return <EmptyStateTemplate headerTitle={t('social.league.title')} title={t('common.unavailableTitle')} message={t('common.unavailableBody')} onBack={back} backLabel={t('common.back')} actionLabel={t('common.retry')} onAction={() => void l.refetch()} />;
}
