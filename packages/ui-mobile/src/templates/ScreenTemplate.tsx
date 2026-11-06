/**
 * Cadre d'écran des maquettes (div racine 390×844) : fond #FFF7EC, `display:flex;
 * flex-direction:column; overflow:hidden; padding:56px 22px 26px; position:relative`.
 * Zones sûres : voir foundations/layout.ts (haut = max(56, inset+9), bas = max(26, inset−8)).
 */
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { screenPadding } from '../foundations/layout';
import { color } from '../foundations/theme';

export interface ScreenTemplateProps {
  children: ReactNode;
  /** Calque décoratif sous le contenu (halos <Blob>). */
  background?: ReactNode;
  /** Couleur de fond (crème par défaut). */
  backgroundColor?: string;
  /** Défilement vertical (écrans plus hauts que 844). */
  scroll?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function ScreenTemplate({
  children,
  background,
  backgroundColor = color.cream,
  scroll,
  testID,
  style,
}: ScreenTemplateProps) {
  const insets = useSafeAreaInsets();
  const pad = screenPadding(insets);
  return (
    <View testID={testID} style={[{ flex: 1, backgroundColor, overflow: 'hidden' }, style]}>
      {background ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {background}
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1 }, pad]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1, flexDirection: 'column' }, pad]}>{children}</View>
      )}
    </View>
  );
}
