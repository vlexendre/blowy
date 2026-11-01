/**
 * Widget Android (Glance via expo-widgets, `enableAndroid: true`). Même contrat de props que
 * la version iOS ; composants @expo/ui/jetpack-compose limités au sous-ensemble supporté par
 * les widgets (Column, Row, Text). Corps 'widget' sans import ni constante de module.
 * Limite connue (SDK 58) : le runtime Android d'expo-widgets n'expose que des actions de
 * diffusion (boutons), pas d'ouverture d'URL au tap — voir docs/mobile/widgets.md.
 */
import { Column, Text } from '@expo/ui/jetpack-compose';
import { background, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { createWidget } from 'expo-widgets';
import type { WidgetProps } from './snapshot';

const BlowyPetWidgetView = (props: WidgetProps) => {
  'widget';
  if (!props.petName) {
    return (
      <Column modifiers={[background('#FFF7EC'), paddingAll(12)]}>
        <Text color="#16110D" style={{ fontSize: 15, fontWeight: '800' }}>
          {props.emptyLabel}
        </Text>
      </Column>
    );
  }
  return (
    <Column modifiers={[background('#FFF7EC'), paddingAll(12)]}>
      <Text color="#16110D" style={{ fontSize: 20, fontWeight: '900' }}>
        {props.petName.toUpperCase()}
      </Text>
      <Text color="#5A5047" style={{ fontSize: 13, fontWeight: '600' }}>
        {props.moodLabel}
      </Text>
      {props.streakLabel ? (
        <Text color="#FF5A3C" style={{ fontSize: 13, fontWeight: '700' }}>
          {props.streakLabel}
        </Text>
      ) : null}
      {props.waitingLabel ? (
        <Text color="#16110D" style={{ fontSize: 12, fontWeight: '600' }} maxLines={2}>
          {props.waitingLabel}
        </Text>
      ) : null}
    </Column>
  );
};

export default createWidget<WidgetProps>('BlowyPetWidget', BlowyPetWidgetView, {
  petName: '',
  moodLabel: '',
  streakLabel: null,
  waitingLabel: null,
  url: 'blowy://nest',
  emptyLabel: 'Blowy',
});
