/**
 * Barre d'onglets flottante `.gnav` (« verre liquide ») des maquettes V4 :
 *  - position : left/right 14, bottom 18 ; grille 5 colonnes, écart 2, marge interne 6, rayon 34 ;
 *  - verre : dégradé blanc .66 → .34, `backdrop-filter: blur(22px) saturate(190%)`, bord 1 px
 *    blanc .8, ombres internes (1 px blanc .95, −10 px/18 px blanc .2) et externes
 *    (0 16 36 encre .24, 0 2 6 encre .08), reflet `::before` (haut 44 %, dégradé blanc .75 → 0) ;
 *  - onglet : hauteur 54, rayon 28, Inter 9,5 px 800→700 .05em capitales, #5E544A ;
 *    actif : encre, dégradé lime (.95 → .85) + ombres, icône pleine ;
 *  - compteur `.bdg` (rose) à 50 % + 6 px, pastille `.pls` « PLUS » (violet) à 50 % + 4 px.
 * Verre dépoli (expo-blur) sur iOS et web si la transparence n'est pas réduite ; sinon fond crème
 * opaque sous le même dégradé (Android, « Réduire la transparence »).
 */
import { BlurView } from 'expo-blur';
import { useId, useState } from 'react';
import { Pressable, Text as RNText, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useA11yPrefs } from '../foundations/accessibility';
import { sheenPath, tabBarBottom } from '../foundations/layout';
import { alpha, color, layout, radii, textSpec } from '../foundations/theme';
import { bodyFont } from '../foundations/typography';
import { Badge } from '../atoms/Badge';
import { Icon, type IconName } from '../atoms/Icon';

export interface TabItem {
  key: string;
  label: string;
  icon: IconName;
  badge?: string | null;
  /** Pastille « PLUS » (fonction Blowy+), annoncée dans le libellé. */
  tag?: string | null;
  accessibilityLabel?: string;
}

export interface TabBarProps {
  items: readonly TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  bottomInset: number;
}

/** Hauteur réservée en bas des écrans d'onglet (`flex:0 0 96px`). */
export const TAB_BAR_SPACE = layout.navReserve;

function Gradient({ id, top, bottom, radius }: { id: string; top: string; bottom: string; radius: number }) {
  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} width="100%" height="100%">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} />
          <Stop offset="1" stopColor={bottom} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={radius} ry={radius} fill={`url(#${id})`} />
    </Svg>
  );
}

function Sheen({ id }: { id: string }) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  return (
    <View pointerEvents="none" onLayout={onLayout} style={{ position: 'absolute', left: 22, right: 22, top: 1, height: '44%' }}>
      {size ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color.white} stopOpacity={0.75} />
              <Stop offset="1" stopColor={color.white} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={sheenPath(size.w, size.h)} fill={`url(#${id})`} />
        </Svg>
      ) : null}
    </View>
  );
}

export function TabBar({ items, activeKey, onSelect, bottomInset }: TabBarProps) {
  const { allowBlur } = useA11yPrefs();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const label = bodyFont(textSpec.nav.size, textSpec.nav.weight, textSpec.nav.letterSpacingEm);
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: layout.navInset, right: layout.navInset, bottom: tabBarBottom(bottomInset), zIndex: 40 }}>
      <View
        style={{
          borderRadius: radii.nav,
          overflow: 'hidden',
          padding: layout.navPad,
          borderWidth: 1,
          borderColor: alpha.glassBorder,
          boxShadow: [
            { offsetX: 0, offsetY: 1, blurRadius: 1, spreadDistance: 0, color: 'rgba(255,255,255,0.95)', inset: true },
            { offsetX: 0, offsetY: -10, blurRadius: 18, spreadDistance: 0, color: 'rgba(255,255,255,0.2)', inset: true },
            { offsetX: 0, offsetY: 16, blurRadius: 36, spreadDistance: 0, color: alpha.navShadow },
            { offsetX: 0, offsetY: 2, blurRadius: 6, spreadDistance: 0, color: alpha.navShadowNear },
          ],
        }}
      >
        {allowBlur ? (
          <BlurView intensity={40} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        ) : (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: color.cream }} />
        )}
        <Gradient id={`gl${uid}`} top={alpha.glassTop} bottom={alpha.glassBottom} radius={0} />
        <Sheen id={`sh${uid}`} />
        <View style={{ flexDirection: 'row', gap: 2 }} accessibilityRole="tablist">
          {items.map((it) => {
            const on = it.key === activeKey;
            const ink = on ? color.ink : color.navInk;
            return (
              <Pressable
                key={it.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={it.accessibilityLabel ?? [it.label, it.tag, it.badge].filter(Boolean).join(', ')}
                onPress={() => onSelect(it.key)}
                testID={`tab-${it.key}`}
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: layout.navItemHeight,
                  borderRadius: radii.navItem,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  ...(on
                    ? {
                        boxShadow: [
                          { offsetX: 0, offsetY: 1, blurRadius: 1, spreadDistance: 0, color: 'rgba(255,255,255,0.95)', inset: true },
                          { offsetX: 0, offsetY: -2, blurRadius: 4, spreadDistance: 0, color: 'rgba(125,161,26,0.25)', inset: true },
                          { offsetX: 0, offsetY: 6, blurRadius: 14, spreadDistance: 0, color: alpha.tabOnGlow },
                        ],
                      }
                    : null),
                }}
              >
                {on ? <Gradient id={`on${uid}${it.key}`} top={alpha.tabOnTop} bottom={alpha.tabOnBottom} radius={radii.navItem} /> : null}
                {/* Vue enveloppe : au-dessus du dégradé absolu (ordre de peinture web). */}
                <View>
                  <Icon name={it.icon} size={21} tint={ink} filled={on} />
                </View>
                <RNText style={[label, { color: ink, textTransform: 'uppercase' }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                  {it.label}
                </RNText>
                {it.badge ? (
                  <View style={{ position: 'absolute', top: 4, left: '50%', marginLeft: 6 }}>
                    <Badge label={it.badge} />
                  </View>
                ) : it.tag ? (
                  <View style={{ position: 'absolute', top: 4, left: '50%', marginLeft: 4 }}>
                    <Badge label={it.tag} kind="plus" />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
