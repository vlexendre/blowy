/**
 * Gabarits V5 : cadre d'écran (div racine 390×844 des maquettes, marges propres à chaque
 * écran), étape d'onboarding (retour + `.tag` + titre + intro + contenu + pied), écran de détail
 * (retour + titre `.d` + action), écran d'onglet (contenu + `.gnav`).
 * Zones sûres : la maquette suppose 47 pt en haut et 34 pt en bas ; la marge haute vaut
 * max(marge, inset + marge − 47), la marge basse max(marge, inset − (34 − marge)).
 */
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v5, v5Alpha, v5Gradient } from '../foundations/theme';
import { BodyText } from '../atoms/BodyText';
import { DisplayText } from '../atoms/DisplayText';
import { PopIn } from '../atoms/PopIn';
import { BackButton, IconAction, StepTag } from '../molecules/v5';
import { GlassNav, type GlassNavItem } from '../organisms/v5';

export type Pad =
  | readonly [top: number, x: number, bottom: number]
  | readonly [top: number, right: number, bottom: number, left: number];

export function framePadding(pad: Pad, insets: { top: number; bottom: number }) {
  const [top, right, bottom, left] = pad.length === 3 ? [pad[0], pad[1], pad[2], pad[1]] : pad;
  return {
    paddingTop: Math.max(top, insets.top + top - 47),
    paddingBottom: Math.max(bottom, insets.bottom - (34 - bottom)),
    paddingLeft: left,
    paddingRight: right,
  };
}

export interface FrameProps {
  children: ReactNode;
  pad?: Pad;
  /** Fond uni (crème par défaut). */
  background?: string;
  /** Dégradé CSS du fond (`linear-gradient(...)`). */
  gradient?: string;
  /** Calque décoratif sous le contenu (halos). */
  decor?: ReactNode;
  /** Calque au-dessus du contenu (barre d'onglets, feuille). */
  overlay?: ReactNode;
  /** Écart vertical entre enfants (`gap` de la div racine). */
  gap?: number;
  scroll?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

/** Div racine : `display:flex; flex-direction:column; overflow:hidden; position:relative`. */
export function Frame({
  children,
  pad = [56, 22, 26],
  background = v5.cream,
  gradient,
  decor,
  overlay,
  gap,
  scroll,
  testID,
  style,
}: FrameProps) {
  const insets = useSafeAreaInsets();
  const padding = framePadding(pad, insets);
  const body = {
    flexDirection: 'column' as const,
    ...padding,
    ...(gap !== undefined ? { gap } : null),
  };
  return (
    <View
      testID={testID}
      style={[
        { flex: 1, backgroundColor: background, overflow: 'hidden' },
        gradient ? { backgroundImage: gradient } : null,
        style,
      ]}
    >
      {decor ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {decor}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ flexGrow: 1 }, body]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, body]}>{children}</View>
      )}
      {overlay}
    </View>
  );
}

export interface StepScreenProps {
  step: number;
  total: number;
  stepLabel: string;
  stepA11y: string;
  backLabel: string;
  onBack: () => void;
  title: string;
  titleSize: number;
  titleLineHeight?: number;
  titleMarginTop?: number;
  /** Paragraphe sous le titre (14 600 interligne 1,45 #5A5047). */
  intro?: string;
  introColor?: string;
  introMarginTop?: number;
  /** Élément entre l'en-tête et le titre (pictogramme du consentement). */
  beforeTitle?: ReactNode;
  children?: ReactNode;
  footer: ReactNode;
  pad?: Pad;
  testID?: string;
}

/** Étape d'onboarding V5 (Ville → Créneaux) : `padding 52px 20px 22px`, pied collé en bas (`margin-top:auto`). */
export function StepScreen({
  step,
  total,
  stepLabel,
  stepA11y,
  backLabel,
  onBack,
  title,
  titleSize,
  titleLineHeight = 0.92,
  titleMarginTop = 16,
  intro,
  introColor = v5.inkSoft,
  introMarginTop = 8,
  beforeTitle,
  children,
  footer,
  pad = [52, 20, 22],
  testID,
}: StepScreenProps) {
  return (
    <Frame pad={pad} testID={testID}>
      <PopIn style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={onBack} label={backLabel} />
        <StepTag step={step} total={total} label={stepLabel} accessibilityLabel={stepA11y} />
      </PopIn>
      {beforeTitle}
      <PopIn delayMs={60} style={{ marginTop: titleMarginTop }}>
        <DisplayText size={titleSize} lineHeight={titleLineHeight}>
          {title}
        </DisplayText>
      </PopIn>
      {intro ? (
        <BodyText
          size={14}
          weight={600}
          lh={1.45}
          color={introColor}
          style={{ marginTop: introMarginTop }}
        >
          {intro}
        </BodyText>
      ) : null}
      {children}
      <View style={{ marginTop: 'auto' }}>{footer}</View>
    </Frame>
  );
}

export interface DetailScreenProps {
  title: string;
  titleSize?: number;
  backLabel: string;
  onBack: () => void;
  /** Action à droite de l'en-tête (Signaler, menu…). */
  action?: ReactNode;
  children: ReactNode;
  pad?: Pad;
  gap?: number;
  scroll?: boolean;
  background?: string;
  gradient?: string;
  overlay?: ReactNode;
  titleColor?: string;
  testID?: string;
}

/** Écran de détail V5 (Réglages, Affiner, Les visages…) : `padding 52px 16px 24px; gap 10px`. */
export function DetailScreen({
  title,
  titleSize = 40,
  backLabel,
  onBack,
  action,
  children,
  pad = [52, 16, 24],
  gap = 10,
  scroll,
  background,
  gradient,
  overlay,
  titleColor,
  testID,
}: DetailScreenProps) {
  return (
    <Frame
      pad={pad}
      gap={gap}
      scroll={scroll}
      background={background}
      gradient={gradient}
      overlay={overlay}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <BackButton onPress={onBack} label={backLabel} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <DisplayText size={titleSize} color={titleColor} numberOfLines={1}>
            {title}
          </DisplayText>
        </View>
        {action}
      </View>
      {children}
    </Frame>
  );
}

export interface TabScreenProps {
  children: ReactNode;
  nav: { items: readonly GlassNavItem[]; activeKey: string; onSelect: (key: string) => void };
  pad?: Pad;
  gap?: number;
  scroll?: boolean;
  background?: string;
  decor?: ReactNode;
  testID?: string;
}

/** Écran d'onglet V5 (Accueil, Chats, Bande, Profil) : contenu + `.gnav` flottante. */
export function TabScreen({
  children,
  nav,
  pad = [56, 16, 26],
  gap,
  scroll,
  background,
  decor,
  testID,
}: TabScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <Frame
      pad={pad}
      gap={gap}
      scroll={scroll}
      background={background}
      decor={decor}
      testID={testID}
      overlay={
        <GlassNav
          items={nav.items}
          activeKey={nav.activeKey}
          onSelect={nav.onSelect}
          bottomInset={insets.bottom}
        />
      }
    >
      {children}
    </Frame>
  );
}

export interface ChatScreenProps {
  /** Contenu de l'en-tête violet (rangée retour/titre/actions + rangées supplémentaires). */
  header: ReactNode;
  children: ReactNode;
  composer?: ReactNode;
  overlay?: ReactNode;
  testID?: string;
}

/**
 * Chat V5 (Groupe, duo) : en-tête violet (`linear-gradient(160deg, #4C1D95, #6D28D9)`, marges
 * 52/14/12, rayon bas 28, ombre `0 5px 0 #2E1065`), fil (marge 14, écart 10), barre d'écriture.
 */
export function ChatScreen({ header, children, composer, overlay, testID }: ChatScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View testID={testID} style={{ flex: 1, backgroundColor: v5.cream, overflow: 'hidden' }}>
      <View
        style={{
          paddingTop: Math.max(52, insets.top + 5),
          paddingHorizontal: 14,
          paddingBottom: 12,
          backgroundImage: v5Gradient.violet,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          gap: 10,
          zIndex: 2,
          boxShadow: [
            { offsetX: 0, offsetY: 5, blurRadius: 0, spreadDistance: 0, color: v5.violetDark },
          ],
        }}
      >
        {header}
      </View>
      <View style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 14, gap: 10 }}>
        {children}
      </View>
      {composer}
      {overlay}
    </View>
  );
}

/** Écran de partage (V5-Partage-*, V5-Story) : fond encre, retour translucide, titre `.d` 26 blanc. */
export function ShareScreen({
  title,
  backLabel,
  onBack,
  children,
  pad = [52, 16, 18],
  testID,
}: {
  title: string;
  backLabel: string;
  onBack: () => void;
  children: ReactNode;
  pad?: Pad;
  testID?: string;
}) {
  return (
    <Frame pad={pad} background={v5.ink} testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <IconAction
          glyph="back"
          glyphSize={16}
          label={backLabel}
          background={v5Alpha.white18}
          glyphColor={v5.white}
          onPress={onBack}
        />
        <DisplayText size={26} color={v5.white}>
          {title}
        </DisplayText>
      </View>
      {children}
    </Frame>
  );
}
