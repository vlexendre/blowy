import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '../atoms/IconButton';
import { Pressable } from '../atoms/Pressable';
import { Text } from '../atoms/Text';
import { InkProvider } from '../lib/ink';
import { layout } from '../lib/styles';
import { ProgressLine } from '../molecules/ProgressLine';
import { Appear } from '../motion/Appear';
import { color, space } from '../theme';

export interface StageTemplateProps {
  /** Retour en haut à gauche (même place que `OnboardingTemplate`). */
  onBack?: () => void;
  backLabel?: string;
  /** Barre d'avancement continue de l'inscription (0 à 1) ; absente : pas de barre. */
  progress?: number;
  progressFrom?: number;
  /** Élément en haut à droite (« passer »). */
  right?: ReactNode;
  /** Contenu centré : grandes lignes, puces, pet au milieu. */
  children?: ReactNode;
  /** Où poser le contenu : au centre de l'écran, ou dans sa moitié haute (un pet sort du bas). Défaut `upper`. */
  align?: 'center' | 'upper';
  /**
   * Calque plein écran derrière le contenu, sans marges ni zones sûres (pets qui sortent du bord bas, confettis).
   * Ce qui s'y trouve ne doit pas capter les touches.
   */
  stage?: ReactNode;
  /** Pied (bouton principal), au-dessus de la zone sûre du bas. */
  footer?: ReactNode;
  /** Un tap n'importe où : continuer (ou passer au temps suivant d'une scène). */
  onTap?: () => void;
  /** Petite ligne « touche pour continuer » sous le contenu (aussi lue comme un bouton par le lecteur d'écran). */
  tapLabel?: string;
  /** Attente avant la ligne `tapLabel` (ms). Défaut 900. */
  tapHintDelay?: number;
}

/** Marges des écrans d'inscription. */
const GUTTER = 18;

/**
 * Gabarit des « temps forts » de l'inscription, plein écran sur fond nuit : entrée en scène, réaction après le quiz,
 * promesse, préparation, « tout est prêt ». Retour et barre continue en haut (comme `OnboardingTemplate`), contenu
 * centré, calque `stage` plein écran derrière (le pet qui sort du bas, rogné par le bord), pied en bas.
 * Avec `onTap`, tout l'écran se touche (les boutons gardent leurs touches) ; `tapLabel` le dit, et le lecteur d'écran
 * le lit comme un bouton.
 */
export function StageTemplate({
  onBack,
  backLabel = 'Retour',
  progress,
  progressFrom,
  right,
  children,
  align = 'upper',
  stage,
  footer,
  onTap,
  tapLabel,
  tapHintDelay = 900,
}: StageTemplateProps) {
  const insets = useSafeAreaInsets();
  const header =
    onBack || progress !== undefined || right ? (
      <View style={[layout.row, styles.header]}>
        {onBack ? <IconButton glyph="back" variant="back" label={backLabel} onPress={onBack} size={40} /> : null}
        {progress !== undefined ? <ProgressLine value={progress} from={progressFrom} /> : <View style={layout.grow} />}
        {right}
      </View>
    ) : null;
  const content = (
    <InkProvider value={color.white} mute={color.mute}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {stage}
      </View>
      <View pointerEvents="box-none" style={[styles.column, { paddingTop: insets.top + 6 }]}>
        {header}
        <View pointerEvents="box-none" style={[styles.body, align === 'upper' ? styles.upper : styles.center]}>
          {children}
          {onTap && tapLabel ? (
            <Appear delay={tapHintDelay} distance={6}>
              <Pressable onPress={onTap} accessibilityLabel={tapLabel} haptic={false} style={styles.hint}>
                <Text variant="bodyBold" size={14} muted center>
                  {tapLabel}
                </Text>
              </Pressable>
            </Appear>
          ) : null}
        </View>
        {footer ? <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View> : null}
      </View>
    </InkProvider>
  );
  // Tout l'écran se touche ; pour le lecteur d'écran, c'est la ligne `tapLabel` (bouton) qui continue : la racine n'est
  // pas un bouton (rôle « none »), sinon les boutons qu'elle contient disparaîtraient de l'arbre d'accessibilité (web).
  // Toujours la même racine : retirer `onTap` en cours de route (erreur) ne remonte pas l'écran.
  return (
    <Pressable onPress={onTap} accessible={false} focusable={false} tabIndex={-1} accessibilityRole="none" scaleTo={1} haptic={false} style={styles.root}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.night, overflow: 'hidden' },
  column: { flex: 1, paddingHorizontal: GUTTER },
  header: { gap: space.md, minHeight: 40 },
  body: { flex: 1, alignItems: 'center' },
  upper: { justifyContent: 'flex-start', paddingTop: '14%' },
  center: { justifyContent: 'center' },
  hint: { marginTop: space.lg, minHeight: 44, paddingHorizontal: space.lg, justifyContent: 'center' },
  footer: { paddingTop: space.md, gap: space.sm },
});
