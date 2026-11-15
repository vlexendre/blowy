import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar } from '../atoms/Avatar';
import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { Appear } from '../motion/Appear';
import { useRipple, useRippleAnchor } from '../motion/Ripple';
import { alpha, color, petTint, size, space, veil } from '../theme';
import type { PetLook } from '../types';

export interface MapPinCardProps {
  /** Clé de la personne choisie : la fiche glisse doucement quand elle change. */
  motionKey: string;
  pet: PetLook;
  /** « Le minimoa de Sasha ». */
  owner: string;
  /** « 86 % » (toujours avec `why`). */
  compat?: string;
  compatLabel?: string;
  /** Pourquoi (`MatchWhy`). */
  why?: ReactNode;
  actionLabel: string;
  onAction: () => void;
  actionLoading?: boolean;
  /** Bouton secondaire (« Voir de plus près »). */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/** Fiche flottante du minimoa choisi sur la carte : qui, pourquoi, et une action. Saluer lance une onde. */
export function MapPinCard({ motionKey, pet, owner, compat, compatLabel, why, actionLabel, onAction, actionLoading, secondaryLabel, onSecondary }: MapPinCardProps) {
  const anchor = useRippleAnchor();
  const ripple = useRipple();
  const act = () => {
    onAction();
    ripple(anchor.target(), { color: color.accent });
  };
  return (
    <View style={styles.card}>
      <Appear key={motionKey} from="right" distance={14} duration={200} style={styles.body}>
        <View style={[layout.row, styles.head]}>
          <Avatar size={52} pet={pet} hidden bg={petTint[pet.species]} />
          <View style={layout.grow}>
            <Title text={pet.name} size={28} numberOfLines={1} />
            <Text size={15} muted numberOfLines={1}>
              {owner}
            </Text>
          </View>
          {compat ? (
            <View style={styles.compat}>
              <Title text={compat} size={30} color={color.accent} />
              {compatLabel ? (
                <Text variant="bodyHeavy" size={13} muted>
                  {compatLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {why}
        <View style={[layout.row, styles.actions]}>
          {secondaryLabel && onSecondary ? <Button label={secondaryLabel} variant="ghost" size="md" onPress={onSecondary} block={false} style={layout.fill} /> : null}
          <View {...anchor.props} style={layout.fill}>
            <Button label={actionLabel} size="md" onPress={act} loading={actionLoading} />
          </View>
        </View>
      </Appear>
    </View>
  );
}

export interface MapPlusStripProps {
  title: string;
  text: string;
  ctaLabel: string;
  onPress: () => void;
}

/** Bandeau Blowy+ de la carte (violet) : toute la bande se touche. */
export function MapPlusStrip({ title, text, ctaLabel, onPress }: MapPlusStripProps) {
  return (
    <Pressable onPress={onPress} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${title}. ${text}`}>
      <Panel gradient="violet" radius={26} padding="none" style={styles.strip}>
        <View style={layout.grow}>
          <Text variant="bodyHeavy" size={17} color={color.white}>
            {title}
          </Text>
          <Text size={15} color={alpha(color.white, 0.85)}>
            {text}
          </Text>
        </View>
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
          <Button label={ctaLabel} variant="white" size="sm" block={false} style={styles.cta} />
        </View>
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.lg,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: veil.glass,
    backgroundColor: color.panel,
    shadowColor: color.night,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 },
  },
  body: { gap: space.md },
  head: { gap: space.md },
  compat: { alignItems: 'flex-end' },
  actions: { gap: space.sm },
  strip: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  cta: { height: size.touch },
});
