/**
 * Cartes de partage V5 (V5-Partage-*, V5-Story) : aperçu 290 px, rayon 26, dégradé 170°, logo
 * « blowy. » + point coloré, titre `.d`, texte 14 700, art central, étiquette de lien (cta + url).
 * Les cartes ne montrent jamais un visage, un prénom ni le pet d'une autre personne.
 */
import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { v5 } from '../foundations/theme';
import { BodyText } from '../atoms/BodyText';
import { DisplayText } from '../atoms/DisplayText';
import { Glyph, type GlyphName } from '../atoms/Glyph';
import { Sprite } from '../atoms/Sprite';
import { Tap } from '../molecules/v5';

export interface ShareCardProps {
  gradient: string;
  dotColor: string;
  title: string;
  titleSize?: number;
  text: string;
  art?: ReactNode;
  /** Étiquette du lien : petite ligne + URL `.d` 17 (null = lien indisponible). */
  cta: string;
  ctaColor?: string;
  link: string;
  /** Texte encre (carte claire) au lieu du blanc. */
  ink?: boolean;
  /** Étiquette sombre (carte claire). */
  darkTag?: boolean;
  height?: number;
  a11yLabel: string;
  rotateTag?: boolean;
  /** « Sans logo blowy. » : le logo disparaît de l'image partagée. */
  noLogo?: boolean;
  children?: ReactNode;
}

export function ShareCard({ gradient, dotColor, title, titleSize = 50, text, art, cta, ctaColor = v5.coralText, link, ink, darkTag, height = 470, a11yLabel, rotateTag, noLogo, children }: ShareCardProps) {
  const fg = ink ? v5.ink : v5.white;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11yLabel} style={{ marginTop: 12, alignSelf: 'center', width: 290, height, borderRadius: 26, backgroundImage: gradient, overflow: 'hidden', paddingVertical: 18, paddingHorizontal: 16, boxShadow: [{ offsetX: 0, offsetY: 10, blurRadius: 30, spreadDistance: 0, color: 'rgba(0,0,0,0.4)' }] }}>
      <DisplayText size={20} color={fg} heading={false} style={noLogo ? { opacity: 0 } : null}>
        blowy
        <DisplayText size={20} color={dotColor} heading={false}>
          .
        </DisplayText>
      </DisplayText>
      <DisplayText size={titleSize} lineHeight={0.92} color={fg} heading={false} style={{ marginTop: 12 }}>
        {title}
      </DisplayText>
      <BodyText size={14} weight={700} lh={1.4} color={fg} style={{ marginTop: 10 }}>
        {text}
      </BodyText>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>{art}</View>
      {children}
      <View style={{ alignSelf: 'flex-start', backgroundColor: darkTag ? v5.ink : v5.white, borderRadius: 16, paddingVertical: 8, paddingHorizontal: 12, transform: rotateTag ? [{ rotate: '-2deg' }] : undefined, boxShadow: rotateTag ? undefined : [{ offsetX: 0, offsetY: 4, blurRadius: 0, spreadDistance: 0, color: 'rgba(22,17,13,0.3)' }] }}>
        <BodyText size={12} weight={800} color={ctaColor}>
          {cta}
        </BodyText>
        <DisplayText size={17} color={darkTag ? v5.white : v5.ink} heading={false}>
          {link}
        </DisplayText>
      </View>
    </View>
  );
}

/** Art « table du groupe » : 4 silhouettes colorées autour d'une table, pet au-dessus. */
export function GroupTableArt({ petPath }: { petPath: string }) {
  const blob = (s: ViewStyle, c: string) => <View style={[{ position: 'absolute', width: 44, height: 50, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderBottomLeftRadius: 19, borderBottomRightRadius: 19, backgroundColor: c }, s]} />;
  return (
    <View style={{ width: 230, height: 150 }}>
      {blob({ left: 20, top: 34 }, '#FFE36E')}
      {blob({ right: 20, top: 34 }, '#9FE3F5')}
      {blob({ left: 54, bottom: 0 }, '#FFB3C7')}
      {blob({ right: 54, bottom: 0 }, v5.lime)}
      <View style={{ position: 'absolute', left: 55, top: 52, width: 120, height: 56, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.25)', borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' }} />
      <Sprite path={petPath} size={70} style={{ position: 'absolute', left: 80, top: -10 }} />
    </View>
  );
}

/** Notes sous l'aperçu : coche + 12 700 #E3D9CF, centrées (`plain` : une ligne sans coche). */
export function ShareNotes({ lines, plain, style }: { lines: string[]; plain?: boolean; style?: StyleProp<ViewStyle> }) {
  if (plain)
    return (
      <BodyText size={12} weight={700} lh={1.35} color={v5.mist} style={[{ marginTop: 10 }, style as never]}>
        {lines.join(' · ')}
      </BodyText>
    );
  return (
    <View style={[{ marginTop: 10, gap: 4, alignItems: 'center' }, style]}>
      {lines.map((l) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Glyph name="check" size={12} color={v5.lime} />
          <BodyText size={12} weight={700} color={v5.mist}>
            {l}
          </BodyText>
        </View>
      ))}
    </View>
  );
}

export interface ShareAction {
  key: string;
  glyph: GlyphName;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}

/** Rangée d'actions de partage (2 ou 4 colonnes) : pastille blanche 52 rayon 18 + libellé 12 700. */
export function ShareActions({ actions }: { actions: ShareAction[] }) {
  return (
    <View style={{ marginTop: 'auto', flexDirection: 'row', gap: 6 }}>
      {actions.map((a) => (
        <Tap key={a.key} onPress={a.disabled ? undefined : a.onPress} accessibilityRole="button" accessibilityLabel={a.label} accessibilityState={{ disabled: !!a.disabled }} pressDepth={0} style={{ flex: 1, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 6, opacity: a.disabled ? 0.45 : 1 }}>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: v5.white, alignItems: 'center', justifyContent: 'center' }}>
            <Glyph name={a.glyph} size={22} />
          </View>
          <BodyText size={12} weight={700} color={v5.white}>
            {a.label}
          </BodyText>
        </Tap>
      ))}
    </View>
  );
}

/** Art « 5 verres, 1 table » : table arrondie bordée, 5 pastilles colorées autour. */
export function TableOfFiveArt({ label }: { label: string }) {
  const dot = (c: string, s: ViewStyle) => <View key={c + JSON.stringify(s)} style={[{ position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: c, borderWidth: 3, borderColor: v5.white }, s]} />;
  return (
    <View style={{ width: 200, height: 150 }}>
      <View style={{ position: 'absolute', left: 25, top: 30, width: 150, height: 86, borderRadius: 22, borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <BodyText size={13} weight={800} color={v5.white}>
          {label}
        </BodyText>
      </View>
      {dot('#FFE36E', { left: 36, top: 10 })}
      {dot('#9FE3F5', { right: 36, top: 10 })}
      {dot('#FFB3C7', { left: 8, top: 66 })}
      {dot(v5.lime, { right: 8, top: 66 })}
      {dot('#FFB37A', { left: 83, top: 106 })}
    </View>
  );
}

/** Art « lieu secret » : enveloppe pêche, rabat, cadenas corail. */
export function SecretEnvelopeArt({ label }: { label: string }) {
  return (
    <View style={{ width: 168, height: 112, borderRadius: 8, backgroundColor: v5.peach, overflow: 'hidden', alignItems: 'center', boxShadow: [{ offsetX: 0, offsetY: 6, blurRadius: 0, spreadDistance: 0, color: 'rgba(0,0,0,0.25)' }] }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 84, borderRightWidth: 84, borderTopWidth: 52, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#F4C9A0' }} />
      <View style={{ position: 'absolute', top: 30, width: 34, height: 34, borderRadius: 17, backgroundColor: v5.coralBtn, alignItems: 'center', justifyContent: 'center' }}>
        <Glyph name="lock" size={16} color={v5.white} color2={v5.coralBtn} />
      </View>
      <BodyText size={12} weight={800} style={{ position: 'absolute', bottom: 10 }}>
        {label}
      </BodyText>
    </View>
  );
}

/** Art « invitation » : 3 lignes blanches avec coche verte. */
export function CheckRowsArt({ rows }: { rows: string[] }) {
  return (
    <View style={{ alignSelf: 'stretch', paddingHorizontal: 12, gap: 6 }}>
      {rows.map((r) => (
        <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: v5.white, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 }}>
          <Glyph name="check" size={13} color={v5.green} />
          <BodyText size={12} weight={700} lh={1.3} style={{ flexShrink: 1 }}>
            {r}
          </BodyText>
        </View>
      ))}
    </View>
  );
}

/** Art « une table de 5 » (Welcome) : table pêche cerclée d'encre, 4 silhouettes cerclées, pet au-dessus. */
export function TableOfFiveInkArt({ petPath, a11yLabel }: { petPath: string; a11yLabel: string }) {
  const blob = (c: string, s: ViewStyle) => <View style={[{ position: 'absolute', width: 46, height: 54, borderTopLeftRadius: 23, borderTopRightRadius: 23, borderBottomLeftRadius: 19, borderBottomRightRadius: 19, backgroundColor: c, borderWidth: 3, borderColor: v5.ink }, s]} />;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={a11yLabel} style={{ width: 300, height: 170 }}>
      <View style={{ position: 'absolute', left: 65, top: 66, width: 170, height: 70, borderRadius: 85, backgroundColor: v5.peach, borderWidth: 3, borderColor: v5.ink }} />
      {blob('#FFE36E', { left: 30, top: 50 })}
      {blob('#9FE3F5', { right: 30, top: 50 })}
      {blob('#FFB3C7', { left: 76, bottom: 0 })}
      {blob(v5.lime, { right: 76, bottom: 0 })}
      <Sprite path={petPath} size={76} style={{ position: 'absolute', left: 112, top: -4 }} />
    </View>
  );
}

/** Art « 5 verres sur une table » (Souvenir V5.5) : table bois, 5 verres colorés, pet au centre. */
export function GlassesTableArt({ petPath }: { petPath: string }) {
  const glass = (fill: string, s: ViewStyle, k: string) => (
    <View key={k} style={[{ position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 3, borderColor: v5.white, boxShadow: [{ offsetX: 0, offsetY: -10, blurRadius: 0, spreadDistance: 0, color: fill, inset: true }] }, s]} />
  );
  return (
    <View style={{ width: 220, height: 170 }}>
      <View style={{ position: 'absolute', left: 30, top: 30, width: 160, height: 100, borderRadius: 30, backgroundColor: '#8C5A2B', boxShadow: [{ offsetX: 0, offsetY: 8, blurRadius: 0, spreadDistance: 0, color: '#5E3A1A' }] }} />
      {glass('#FFB347', { left: 44, top: 8 }, 'a')}
      {glass('#C2185B', { right: 44, top: 8 }, 'b')}
      {glass('#7DA11A', { left: 6, top: 64 }, 'c')}
      {glass('#FFB347', { right: 6, top: 64 }, 'd')}
      {glass('#9FE3F5', { left: 93, bottom: 6 }, 'e')}
      <Sprite path={petPath} size={48} style={{ position: 'absolute', left: 86, top: 46 }} />
    </View>
  );
}
