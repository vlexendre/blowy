/** `.cap` : bulle noire (fond #16110D, rayon 12, marges 9/13, Inter 13 px 600 blanc, une ligne). */
import { Text as RNText, View, type StyleProp, type ViewStyle } from 'react-native';
import { color, textSpec } from '../foundations/theme';
import { bodyFont } from '../foundations/typography';
import { captionBox } from './styles';

export interface CaptionProps {
  children: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Caption({ children, style, testID }: CaptionProps) {
  return (
    <View style={[captionBox, style]} testID={testID}>
      <RNText maxFontSizeMultiplier={1.4} style={[bodyFont(textSpec.cap.size, textSpec.cap.weight), { color: color.white }]}>
        {children}
      </RNText>
    </View>
  );
}
