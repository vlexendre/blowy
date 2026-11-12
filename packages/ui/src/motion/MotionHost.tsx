import { createContext, type ReactNode, type RefObject, useContext, useEffect, useId, useMemo, useRef, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { type HapticMoment, hapticFor } from '../lib/haptics';
import { MotionProvider, useReducedMotion } from '../lib/motion';
import { Burst, type BurstKind } from './Burst';

/** Rectangle en coordonnées de la fenêtre (points). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type Listener = () => void;

/** Registre des calques du `MotionHost` (vols, explosions, pets qui passent la tête). */
class Registry {
  private nodes = new Map<string, ReactNode>();
  private order: string[] = [];
  private listeners = new Set<Listener>();
  private snapshot: readonly [string, ReactNode][] = [];
  set(key: string, node: ReactNode) {
    if (!this.nodes.has(key)) this.order.push(key);
    this.nodes.set(key, node);
    this.emit();
  }
  remove(key: string) {
    if (!this.nodes.delete(key)) return;
    this.order = this.order.filter((k) => k !== key);
    this.emit();
  }
  subscribe = (l: Listener) => {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  };
  getSnapshot = () => this.snapshot;
  private emit() {
    this.snapshot = this.order.map((k) => [k, this.nodes.get(k)] as [string, ReactNode]);
    this.listeners.forEach((l) => l());
  }
}

interface HostApi {
  registry: Registry;
  /** Rend `node` dans le calque ; renvoie la fonction qui l'enlève. */
  mount: (node: ReactNode) => () => void;
}

const HostContext = createContext<HostApi | null>(null);
let flightSeq = 0;

function Layer({ registry }: { registry: Registry }) {
  const entries = useSyncExternalStore(registry.subscribe, registry.getSnapshot, registry.getSnapshot);
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {entries.map(([k, node]) => (
        <View key={k} pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          {node}
        </View>
      ))}
    </View>
  );
}

export interface MotionHostProps {
  children?: ReactNode;
  /** Force « réduire les animations » (dév, tests). */
  reduced?: boolean | null;
}

/**
 * À poser une fois à la racine de l'app (sous les zones de sécurité, au-dessus du routeur).
 * Fournit `MotionProvider` (premier plan / arrière-plan, réduction des animations) et un calque plein écran,
 * transparent aux touchers, où passent les vols (`useFlyTo`), les explosions (`useBurst`) et les `PetPeek`.
 * Les modales natives (`Modal`) restent au-dessus de ce calque : à l'intérieur d'une modale, rendre `Burst` sur place.
 */
export function MotionHost({ children, reduced }: MotionHostProps) {
  const registry = useMemo(() => new Registry(), []);
  const api = useMemo<HostApi>(
    () => ({
      registry,
      mount: (node) => {
        const key = `m${++flightSeq}`;
        registry.set(key, node);
        return () => registry.remove(key);
      },
    }),
    [registry],
  );
  return (
    <MotionProvider reduced={reduced}>
      <HostContext.Provider value={api}>
        <View style={styles.fill}>
          {children}
          <Layer registry={registry} />
        </View>
      </HostContext.Provider>
    </MotionProvider>
  );
}

/** Accès au calque (null hors `MotionHost`). */
export function useMotionHost(): HostApi | null {
  return useContext(HostContext);
}

/**
 * Rend ses enfants dans le calque du `MotionHost` (au-dessus de tout l'écran), positionnés en coordonnées
 * de la fenêtre. Hors `MotionHost`, ne rend rien.
 */
export function HostPortal({ children }: { children?: ReactNode }) {
  const host = useContext(HostContext);
  const key = `p${useId()}`;
  useEffect(() => {
    if (!host) return;
    host.registry.set(key, children);
  });
  useEffect(() => {
    if (!host) return;
    return () => host.registry.remove(key);
  }, [host, key]);
  return null;
}

/** Une vue mesurable (ref d'une `View` : `useRef<ComponentRef<typeof View>>(null)`). */
export interface MeasurableNode {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
}
export type Measurable = RefObject<MeasurableNode | null>;

/** Mesure une vue en coordonnées de la fenêtre. */
export function measureInWindow(ref: Measurable): Promise<Rect | null> {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => resolve(width || height ? { x, y, width, height } : null));
  });
}

export interface FlightOptions {
  /** Départ : une vue (mesurée) ou un rectangle de la fenêtre. */
  from: Measurable | Rect;
  /** Arrivée : une vue (mesurée) ou un rectangle de la fenêtre. */
  to: Measurable | Rect;
  /** Ce qui vole, dessiné à la taille du départ (ex. `<ItemImage id size={from.width} />`). */
  render: (size: { width: number; height: number }) => ReactNode;
  /** Hauteur de la courbe au-dessus de la ligne droite (pt). Défaut : 30 % de la distance, 60 au moins. */
  arc?: number;
  /** Durée du vol (ms). Défaut 560. */
  duration?: number;
  /** Tours sur soi-même pendant le vol, en degrés. Défaut 0 (léger balancement). */
  spin?: number;
  /** Vibration à l'atterrissage. Défaut `land`. */
  haptic?: HapticMoment | false;
  /** Appelé à l'atterrissage (montrer l'objet sur place, faire réagir le pet). */
  onLand?: () => void;
}

const isRect = (v: Measurable | Rect): v is Rect => typeof (v as Rect).x === 'number' && typeof (v as Rect).width === 'number';

function Flight({
  from,
  to,
  render,
  arc,
  duration,
  spin,
  onEnd,
}: {
  from: Rect;
  to: Rect;
  render: FlightOptions['render'];
  arc: number;
  duration: number;
  spin: number;
  onEnd: () => void;
}) {
  const p = useSharedValue(0);
  const fade = useSharedValue(1);
  const dx = to.x + to.width / 2 - (from.x + from.width / 2);
  const dy = to.y + to.height / 2 - (from.y + from.height / 2);
  const k = from.width ? to.width / from.width : 1;
  useEffect(() => {
    p.value = withTiming(1, { duration, easing: Easing.bezier(0.45, 0.05, 0.35, 1) }, (finished) => {
      if (finished) scheduleOnRN(onEnd);
    });
    fade.value = withSequence(withTiming(1, { duration: duration - 40 }), withTiming(0, { duration: 90 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => {
    const t = p.value;
    const u = 1 - t;
    // Courbe de Bézier quadratique : point de contrôle au-dessus du milieu.
    const cx = dx / 2;
    const cy = Math.min(0, dy) / 2 - arc;
    const x = 2 * u * t * cx + t * t * dx;
    const y = 2 * u * t * cy + t * t * dy;
    const s = 1 + (k - 1) * t + Math.sin(t * Math.PI) * 0.18;
    // Étirement dans la vitesse au milieu, écrasement juste avant de se poser.
    const stretch = Math.sin(t * Math.PI) * 0.08 - (t > 0.88 ? (t - 0.88) * 0.9 : 0);
    const r = spin ? spin * t : Math.sin(t * Math.PI * 2) * 12;
    return {
      opacity: fade.value,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${r}deg` }, { scaleX: s * (1 - stretch * 0.5) }, { scaleY: s * (1 + stretch) }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.flight, { left: from.x, top: from.y, width: from.width, height: from.height }, style]}>
      {render({ width: from.width, height: from.height })}
    </Animated.View>
  );
}

/**
 * Faire voler un objet d'un point à un autre au-dessus de l'écran (garde-robe → pet, récompense → compteur).
 * Mesure le départ et l'arrivée, fait voler une copie en courbe dans le calque du `MotionHost`, puis appelle
 * `onLand`. Avec animations réduites ou hors `MotionHost` : pas de vol, `onLand` est appelé tout de suite.
 */
export function useFlyTo(): (options: FlightOptions) => Promise<void> {
  const host = useContext(HostContext);
  const reduced = useReducedMotion();
  const hostRef = useRef(host);
  hostRef.current = host;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  return useMemo(
    () =>
      async ({ from, to, render, arc, duration = 560, spin = 0, haptic = 'land', onLand }: FlightOptions) => {
        const h = hostRef.current;
        const land = () => {
          if (haptic) hapticFor(haptic);
          onLand?.();
        };
        if (!h || reducedRef.current) {
          land();
          return;
        }
        const [a, b] = await Promise.all([isRect(from) ? from : measureInWindow(from), isRect(to) ? to : measureInWindow(to)]);
        if (!a || !b) {
          land();
          return;
        }
        const dist = Math.hypot(b.x - a.x, b.y - a.y);
        await new Promise<void>((resolve) => {
          let unmount: () => void = () => undefined;
          const end = () => {
            land();
            unmount();
            resolve();
          };
          unmount = h.mount(<Flight from={a} to={b} render={render} arc={arc ?? Math.max(60, dist * 0.3)} duration={duration} spin={spin} onEnd={end} />);
        });
      },
    [],
  );
}

export interface HostBurstOptions {
  kind: BurstKind;
  /** Origine en coordonnées de la fenêtre. */
  x: number;
  y: number;
  count?: number;
  spread?: number;
  size?: number;
  seed?: string;
}

/** Explosion de particules au-dessus de tout l'écran, à un point de la fenêtre (ex. au centre d'un bouton mesuré). */
export function useBurst(): (options: HostBurstOptions) => void {
  const host = useContext(HostContext);
  const reduced = useReducedMotion();
  const hostRef = useRef(host);
  hostRef.current = host;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  return useMemo(
    () =>
      ({ kind, x, y, count, spread, size, seed }: HostBurstOptions) => {
        const h = hostRef.current;
        if (!h || reducedRef.current) return;
        let unmount: () => void = () => undefined;
        unmount = h.mount(
          <Burst
            kind={kind}
            trigger={1}
            count={count}
            spread={spread}
            size={size}
            seed={seed}
            onDone={() => unmount()}
            style={{ position: 'absolute', left: x, top: y }}
          />,
        );
      },
    [],
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flight: { position: 'absolute' },
});
