import { type MaskoHandle, MaskoView } from '@masko/player-react-native';
import { requireOptionalNativeModule } from 'expo';
import { Component, forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

import { fadeTo, useMotionActive, useReducedMotion } from '../lib/motion';
import { MASCOT_LOAD_TIMEOUT_MS, type MascotMoment, type MascotSource, mascotEvent, mascotMode } from '../motion/mascot';

export interface AnimatedMascotHandle {
  /** Joue un moment une fois (rire, réfléchir, applaudir) ; il revient seul au repos. Rien tant qu'il n'est pas montré. */
  play: (moment: MascotMoment) => void;
}

export interface AnimatedMascotProps {
  /** Le personnage animé réglé par l'API (`mascot` de la séance) ; absent : seulement `fallback`. */
  source: MascotSource | null | undefined;
  /** L'affichage habituel du minimoa (`PetActor`, `PetImage`) : montré tant que le lecteur ne joue pas. */
  fallback: ReactNode;
  /** Côté du carré où joue le personnage (centré, posé en bas de la place de `fallback`). */
  size: number;
  /** Déclaratif : à chaque nouvelle `momentKey`, joue `moment` (comme `reactKey` des autres pets). */
  moment?: MascotMoment | null;
  momentKey?: number | string;
  /** Sa voix (les clips parlés). Coupée par défaut. */
  sound?: boolean;
  /** Lu par le lecteur d'écran (son nom). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Un moment demandé pendant le chargement reste valable ce temps-là. */
const PENDING_MS = 4000;

/** Le lecteur natif est-il dans ce build (pas sur le web, ni dans un ancien client de développement) ? */
let available: boolean | undefined;
function playerAvailable(): boolean {
  if (available === undefined) available = Platform.OS !== 'web' && requireOptionalNativeModule('MaskoPlayer') != null;
  return available;
}

/** Un plantage du lecteur au rendu ne doit jamais laisser un trou : on retombe sur l'affichage habituel. */
class PlayerBoundary extends Component<{ onCrash: () => void; children: ReactNode }, { crashed: boolean }> {
  override state = { crashed: false };
  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }
  override componentDidCatch(): void {
    this.props.onCrash();
  }
  override render(): ReactNode {
    return this.state.crashed ? null : this.props.children;
  }
}

/**
 * Minimoa animé (docs/MOTION.md, « Minimoa animé ») : joue le personnage Masko réglé par l'API ; sinon, en cas d'erreur,
 * sans réseau, sans lecteur (web) ou avec « Réduire les animations », l'affichage habituel (`fallback`), jamais un vide.
 * L'affichage habituel reste en place jusqu'à la première pose du personnage, puis s'efface en fondu. Pause quand
 * l'écran n'est plus au premier plan ; son coupé par défaut.
 */
export const AnimatedMascot = forwardRef<AnimatedMascotHandle, AnimatedMascotProps>(function AnimatedMascot(
  { source, fallback, size, moment, momentKey, sound = false, accessibilityLabel, style },
  ref,
) {
  const reduced = useReducedMotion();
  const active = useMotionActive();
  const player = useRef<MaskoHandle>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const mode = mascotMode({ source, available: source ? playerAvailable() : false, reduced, failed });
  const shown = mode === 'masko' && ready;
  const fade = useSharedValue(0);

  // Un autre personnage : on repart de l'affichage habituel.
  const key = source ? `${source.url}|${source.appKey}` : '';
  useEffect(() => {
    setReady(false);
    setFailed(false);
  }, [key]);

  // Pas montré à temps (réseau lent, release introuvable) : on garde l'affichage habituel.
  useEffect(() => {
    if (mode !== 'masko' || ready) return;
    const timer = setTimeout(() => setFailed(true), MASCOT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [mode, ready, key]);

  useEffect(() => {
    fade.value = fadeTo(shown ? 1 : 0);
  }, [shown, fade]);

  // Règle 5 : rien ne tourne hors du premier plan.
  useEffect(() => {
    if (!shown) return;
    if (active) player.current?.play();
    else player.current?.pause();
  }, [active, shown]);

  // Un moment demandé avant la première pose (il applaudit à l'arrivée) : joué dès qu'il se montre, s'il est récent.
  const pending = useRef<{ moment: MascotMoment; at: number } | null>(null);
  const play = useCallback(
    (m: MascotMoment) => {
      if (!shown) {
        pending.current = { moment: m, at: Date.now() };
        return;
      }
      const name = mascotEvent(source, m);
      if (name) player.current?.fire(name);
    },
    [shown, source],
  );
  useEffect(() => {
    const p = pending.current;
    if (!shown || !p) return;
    pending.current = null;
    if (Date.now() - p.at > PENDING_MS) return;
    const name = mascotEvent(source, p.moment);
    if (name) player.current?.fire(name);
  }, [shown, source]);
  useImperativeHandle(ref, () => ({ play }), [play]);

  const last = useRef(momentKey);
  useEffect(() => {
    if (momentKey === undefined || momentKey === last.current) return;
    last.current = momentKey;
    if (moment) play(moment);
  }, [momentKey, moment, play]);

  const fallbackStyle = useAnimatedStyle(() => ({ opacity: 1 - fade.value }));
  const playerStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setFailed(true), []);
  // Avant la première pose, une erreur (release illisible, pas de réseau) : l'affichage habituel. Ensuite, le lecteur
  // garde la dernière image d'un clip raté ou ignore un nom refusé : il reste.
  const readyRef = useRef(false);
  readyRef.current = ready;
  const onError = useCallback(() => {
    if (!readyRef.current) setFailed(true);
  }, []);

  return (
    <View style={style} accessible={!!accessibilityLabel} accessibilityRole={accessibilityLabel ? 'image' : undefined} accessibilityLabel={accessibilityLabel}>
      <Animated.View style={fallbackStyle} pointerEvents={shown ? 'none' : 'auto'} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {fallback}
      </Animated.View>
      {mode === 'masko' && source ? (
        <Animated.View pointerEvents="none" style={[styles.player, playerStyle]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <PlayerBoundary key={key} onCrash={onFail}>
            <MaskoView
              key={key}
              ref={player}
              url={source.url}
              appKey={source.appKey}
              sound={sound}
              style={{ width: size, height: size }}
              onPose={onReady}
              onClip={onReady}
              onError={onError}
            />
          </PlayerBoundary>
        </Animated.View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  // Centré horizontalement, posé sur le bas de la place de l'affichage habituel (même ligne de sol).
  player: { position: 'absolute', bottom: 0, left: -1000, right: -1000, alignItems: 'center' },
});
