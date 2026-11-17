import { CARE_ACTIONS, type CareAction } from '@blowy/domain';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { type CareProp, propImage } from '../assets/misc';
import { CareIcon } from '../atoms/CareIcon';
import { type CareLevel, CareButton } from '../molecules/CareButton';
import type { PetLure } from '../motion/pets/lure';
import { color, radius, size as sizes, veil } from '../theme';

export interface CareBarProps {
  /** Libellés des gestes (`careLabel` de @blowy/content accepté tel quel). */
  labels: Record<CareAction, { action: string; refused: string }>;
  /** Gestes que le pet accepte maintenant (`canCare(needs, action)`) ; les autres sont estompés. */
  available: Record<CareAction, boolean>;
  onCare: (action: CareAction) => void;
  /** Appui sur un geste refusé. */
  onRefused?: (action: CareAction) => void;
  /** Gestes conseillés (disque jaune). */
  hot?: Partial<Record<CareAction, boolean>>;
  /** Geste en cours d'envoi : les autres sont inactifs. */
  busy?: CareAction | null;
  /**
   * Lien avec le pet (`usePetLure`, le même que `PetStage lure`) : on peut alors glisser un soin jusqu'au pet
   * (appuyer, glisser, lâcher sur lui). Le tap reste le geste principal.
   */
  lure?: PetLure;
  /** Niveau du besoin comblé par chaque geste (barre sous le libellé) : remplace un `NeedsPanel` à part. */
  levels?: Partial<Record<CareAction, CareLevel>>;
  /** Diamètre des disques. Défaut 56. */
  size?: number;
  /** Pictos à la place des `CareIcon`. */
  icons?: Partial<Record<CareAction, ReactNode>>;
  /** Ce que chaque soin porte quand on le glisse jusqu'au pet (`careProp` : pomme, cookie, balle, coussin…). */
  carry?: Partial<Record<CareAction, CareProp | null>>;
  style?: StyleProp<ViewStyle>;
}

/** Les quatre soins (nourrir, jouer, sieste, câlin) dans une carte, en disques ronds (V6-Accueil). */
export function CareBar({ labels, available, onCare, onRefused, hot, busy, lure, levels, size = 56, icons, carry, style }: CareBarProps) {
  return (
    <View style={[styles.card, style]}>
      {CARE_ACTIONS.map((a) => (
        <CareButton
          key={a}
          label={labels[a].action}
          icon={icons?.[a] ?? <CareIcon name={a} size={Math.round(size * 0.48)} />}
          carry={carry?.[a] ? <Image source={propImage(carry[a] as CareProp)} contentFit="contain" style={{ width: Math.round(size * 0.62), height: Math.round(size * 0.62) }} /> : undefined}
          size={size}
          level={levels?.[a]}
          hot={!!hot?.[a]}
          refused={!available[a]}
          refusedLabel={labels[a].refused}
          onRefusedPress={onRefused ? () => onRefused(a) : undefined}
          loading={busy === a}
          disabled={!!busy && busy !== a}
          onPress={() => onCare(a)}
          lure={lure}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // `.card.row`, à l'échelle de densité, aérée en hauteur : padding 16 4, rayon des cartes.
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: radius.card,
    backgroundColor: color.panel,
    borderWidth: sizes.border,
    borderColor: veil.line,
  },
});
