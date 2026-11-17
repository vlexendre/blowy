import type { Outfit, Species } from '@blowy/domain';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from '../atoms/IconButton';
import { Panel } from '../atoms/Panel';
import { Sticker } from '../atoms/Sticker';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { Burst } from '../motion/Burst';
import { CountUp } from '../motion/CountUp';
import { useFirstTime } from '../motion/once';
import { PetActor } from '../motion/pets/PetActor';
import { StreakFlame } from '../motion/pets/StreakFlame';
import { color, space } from '../theme';
import type { TitleContent } from '../types';

export interface StreakHeroProps {
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  /** Série en cours. */
  count: number;
  /** « JOURS / DE SÉRIE. » */
  title: TitleContent;
  /** Ligne en bas à gauche (« Sa mèche brûle plus fort chaque jour. »). */
  line?: string;
  /** Puce en haut à droite (« Record battu », « Record : 21 jours »). */
  badge?: string | null;
  /** La série est le record (et non nulle) : confettis à la première visite. */
  record?: boolean;
  /** Défi du jour pas encore fait : la flamme brûle plus bas. */
  low?: boolean;
  onBack: () => void;
  backLabel: string;
  petLabel?: string;
}

const PET = 200;

/**
 * Haut de l'écran de la série (V6-GSerie) : le grand chiffre en capitales (police des titres) qui défile depuis 0, le minimoa à droite avec
 * sa mèche allumée (à sa taille du jour), qui se rallume à la première visite de la session. Panneau lie-de-vin.
 */
export function StreakHero({ pet, count, title, line, badge, record = false, low = false, onBack, backLabel, petLabel }: StreakHeroProps) {
  const first = useFirstTime(`streak-hero:${count}`);
  const [ignite] = useState(() => (first ? 1 : null));
  return (
    <Panel gradient="wine" radius={32} padding="none" style={styles.panel}>
      <View style={styles.pet} pointerEvents="box-none">
        <PetActor
          species={pet.species}
          outfit={pet.outfit}
          size={PET}
          mood="joie"
          seed={pet.id ?? pet.name}
          sleepAfter={null}
          crest={<StreakFlame streak={count} size={Math.round(PET * 0.32)} low={low} igniteKey={ignite} />}
          crestSize={Math.round(PET * 0.32)}
          accessibilityLabel={petLabel ?? pet.name}
        />
      </View>
      {record && first ? <Burst kind="confetti" trigger={1} count={18} size={11} spread={180} seed={`record:${count}`} style={styles.burst} /> : null}
      <View style={styles.top}>
        <IconButton label={backLabel} glyph="back" variant="glass" onPress={onBack} />
        {badge ? <Sticker label={badge} tone="accent" font="body" rotate={4} /> : null}
      </View>
      <View style={styles.text} pointerEvents="none">
        <CountUp value={count} from={first ? 0 : count} variant="hero" size={128} duration={700} color={color.white} accessibilityLabel={String(count)} />
        <Title text={title} size={40} style={styles.title} />
        {line ? (
          <Text variant="bodyHeavy" size={15} style={styles.line}>
            {line}
          </Text>
        ) : null}
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { minHeight: 372, paddingHorizontal: space.lg + 2, paddingTop: space.md, paddingBottom: space.lg + 2 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 3 },
  text: { zIndex: 2, maxWidth: '58%', marginTop: space.xs },
  title: { marginTop: -space.md },
  line: { marginTop: space.lg, maxWidth: 170 },
  pet: { position: 'absolute', right: -18, bottom: -16, zIndex: 1 },
  burst: { position: 'absolute', right: 100, top: 90 },
});
