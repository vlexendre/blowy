import { levelLabel } from '@blowy/content';
import { LEVEL_KEYS, MAX_LEVEL, MAX_LIVES, levelProgress, type Species } from '@blowy/domain';
import { AvatarPair, Banner, Header, LevelHero, LevelLadder, LivesCard, PetImage, ScreenTemplate, Skeleton } from '@blowy/ui';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenMotion } from '@/core';
import { useBackToLink, useLevelUps, useLink } from '@/features/links';
import { levels as t, link as linkText } from '@/locales/chats';

export default function LevelsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const link = useLink(id);
  const l = link.data;
  const back = useBackToLink(id);
  const levelUps = useLevelUps(id, l?.level);

  const header = (
    <Header
      onBack={back}
      backLabel={linkText.back}
      title={l ? t.header(l.other.displayName) : undefined}
      titleSize={15}
      style={styles.edge}
      right={
        l ? (
          <AvatarPair size={34} first={{ pet: l.myPet, hidden: true }} second={{ pet: l.other.pet, uri: l.other.avatarUrl, face: l.other.face, name: l.other.displayName }} />
        ) : undefined
      }
    />
  );

  if (!l) {
    return (
      <ScreenMotion>
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
      </ScreenMotion>
    );
  }

  const key = LEVEL_KEYS[Math.min(l.level, MAX_LEVEL) - 1] ?? 'rendezvous';
  const p = levelProgress(l.xp);
  const atMax = l.level >= MAX_LEVEL;

  return (
    <ScreenMotion>
    <ScreenTemplate header={header} padded={false} contentStyle={styles.edge}>
      <View style={styles.body}>
        <LevelHero
          kicker={t.kicker(l.level)}
          title={t.heroTitle(levelLabel[key].title)}
          ratio={atMax ? 1 : l.levelRatio}
          progressLabel={atMax ? t.maxProgress : t.progress(p.into, p.span, l.level + 1)}
          art={<DuoArt mine={l.myPet.species} theirs={l.other.pet.species} />}
        />

        <LevelLadder
          level={l.level}
          labels={ladder}
          currentLabel={t.current}
          nextLabel={atMax ? undefined : t.next(Math.max(0, p.span - p.into))}
          animateKey={l.id}
          celebrate={levelUps > 0}
        />

        <LivesCard style={styles.lives} title={t.livesTitle(l.lives)} lives={l.lives} max={MAX_LIVES} ghost={l.status === 'ghost'} text={t.livesText} accessibilityLabel={linkText.lives(l.lives)} />
      </View>
    </ScreenTemplate>
    </ScreenMotion>
  );
}

/** Le duo illustré de la paire quand il existe, sinon les deux pets côte à côte. */
function DuoArt({ mine, theirs }: { mine: Species; theirs: Species }) {
  const pair = [mine, theirs].sort().join('+');
  const art = pair === 'nino+suzie' ? 'duo_nino_suzie' : pair === 'gaston+pia' ? 'duo_gaston_pia' : null;
  if (art) return <PetImage art={art} size={210} animation="breathe" />;
  return (
    <View style={styles.duo}>
      <PetImage species={mine} mood="joie" size={112} animation="breathe" />
      <PetImage species={theirs} mood="amour" size={112} animation="breathe" delay={400} style={styles.duoSecond} />
    </View>
  );
}

/** Titres et phrases des niveaux en minuscules, sans point final (ton des maquettes). */
const ladder = Object.fromEntries(
  Object.entries(levelLabel).map(([k, v]) => [k, { title: lowerFirst(v.title), text: lowerFirst(v.text).replace(/\.$/, '') }]),
) as typeof levelLabel;

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

const styles = StyleSheet.create({
  // Maquette : panneau 12 sous l'en-tête, échelle 16 plus bas, carte des vies collée en bas (24 au-dessus du bord).
  body: { flex: 1, gap: 16, paddingTop: 4 },
  lives: { marginTop: 'auto' },
  // Marges de 14 comme les autres écrans du lien.
  edge: { paddingHorizontal: 14 },
  duo: { flexDirection: 'row', alignItems: 'flex-end' },
  duoSecond: { marginLeft: -28 },
});
