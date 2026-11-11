import { levelLabel } from '@blowy/content';
import { faceVisibility, LEVEL_KEYS, MAX_LEVEL, MAX_LIVES, levelProgress } from '@blowy/domain';
import { color } from '@blowy/tokens';
import {
  alpha,
  AvatarPair,
  Banner,
  Card,
  FeatureRow,
  Header,
  Hearts,
  LevelLadder,
  Panel,
  PetImage,
  ProgressBar,
  ScreenTemplate,
  Skeleton,
  Text,
  Title,
} from '@blowy/ui';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useLink } from '@/features/links';
import { levels as t, link as linkText } from '@/locales/chats';

export default function LevelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const link = useLink(id);
  const l = link.data;
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/link/${id}`));

  const header = (
    <Header
      onBack={back}
      backLabel={linkText.back}
      title={l ? t.header(l.other.displayName) : undefined}
      right={
        l ? (
          <AvatarPair size={34} first={{ pet: l.myPet, hidden: true }} second={{ pet: l.other.pet, uri: l.other.avatarUrl, face: l.other.face, name: l.other.displayName }} />
        ) : undefined
      }
    />
  );

  if (!l) {
    return (
      <ScreenTemplate header={header}>
        {link.isPending ? (
          <View style={styles.body}>
            <Skeleton height={190} radius="xl" />
            <Skeleton height={320} radius="lg" />
          </View>
        ) : (
          <Banner tone="error" title={linkText.loadError} text={link.error?.message ?? ''} actionLabel={linkText.retry} onAction={() => void link.refetch()} />
        )}
      </ScreenTemplate>
    );
  }

  const key = LEVEL_KEYS[Math.min(l.level, MAX_LEVEL) - 1] ?? 'rendezvous';
  const p = levelProgress(l.xp);
  const atMax = l.level >= MAX_LEVEL;
  const face = faceVisibility(l.level);

  return (
    <ScreenTemplate header={header}>
      <View style={styles.body}>
        <Panel gradient="rose" padding="lg">
          <View style={styles.heroRow}>
            <View style={styles.grow}>
              <Text variant="label" dim>
                {t.kicker(l.level)}
              </Text>
              <Title text={[{ text: levelLabel[key].title.toUpperCase() }]} size={40} />
            </View>
            <View style={styles.duo}>
              <PetImage species={l.myPet.species} mood="joie" size={70} outline />
              <PetImage species={l.other.pet.species} mood="amour" size={70} outline style={styles.duoSecond} />
            </View>
          </View>
          <View style={styles.progress}>
            <ProgressBar value={atMax ? 1 : l.levelRatio} color={color.dark} trackColor={alpha(color.dark, 0.15)} accessibilityLabel={t.kicker(l.level)} />
            <Text variant="bodyBold" size={13}>
              {atMax ? t.maxProgress : t.progress(p.into, p.span, l.level + 1)}
            </Text>
          </View>
        </Panel>

        <LevelLadder level={l.level} labels={levelLabel} ratio={l.levelRatio} currentLabel={t.current} nextLabel={atMax ? undefined : t.next(Math.max(0, p.span - p.into))} />

        <Card padding="lg">
          <Text variant="label" muted>
            {t.facesTitle}
          </Text>
          <Text style={styles.line}>{t.faces}</Text>
          <Text variant="bodyBold" color={color.accent} style={styles.line}>
            {t.faceNow[face]}
          </Text>
        </Card>

        <Card padding="lg">
          <Text variant="label" muted>
            {t.xpTitle}
          </Text>
          <View style={styles.xp}>
            {t.xp.map((x) => (
              <FeatureRow key={x.title} icon={x.icon} title={x.title} text={x.text} />
            ))}
          </View>
        </Card>

        <Card padding="lg">
          <View style={styles.heroRow}>
            <Title text={t.livesTitle(l.lives)} variant="h2" style={styles.grow} />
            <Hearts lives={l.lives} max={MAX_LIVES} ghost={l.status === 'ghost'} accessibilityLabel={linkText.lives(l.lives)} />
          </View>
          <Text variant="small" muted style={styles.line}>
            {t.livesText}
          </Text>
        </Card>
      </View>
    </ScreenTemplate>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingTop: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  progress: { gap: 8, marginTop: 12 },
  duo: { flexDirection: 'row', alignItems: 'flex-end' },
  duoSecond: { marginLeft: -24 },
  line: { marginTop: 6 },
  xp: { gap: 12, marginTop: 12 },
});
