/**
 * Widget iOS (WidgetKit via expo-widgets, SDK 58) : composant marqué 'widget', sans hook,
 * import, ni constante de module dans son corps (contrainte du bundler de widgets).
 * Couleurs : valeurs de @blowy/design-tokens (cream #FFF7EC, ink #16110D, coral #FF5A3C)
 * recopiées car le corps du widget ne peut rien importer.
 * Mise à jour : BlowyPetWidget.updateSnapshot(props) depuis l'app (useWidgetSync).
 * Nécessite un development build (extension native) — non vérifiable dans ce dépôt sans Xcode.
 */
import { HStack, Text, VStack } from '@expo/ui/swift-ui';
import { background, font, foregroundStyle, padding, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { WidgetProps } from './snapshot';

const BlowyPetWidgetView = (props: WidgetProps, env: WidgetEnvironment) => {
  'widget';
  const compact = env.widgetFamily === 'accessoryRectangular';
  if (!props.petName) {
    return (
      <VStack modifiers={[widgetURL(props.url), padding({ all: 12 }), background('#FFF7EC')]}>
        <Text modifiers={[font({ size: 15, weight: 'heavy' }), foregroundStyle('#16110D')]}>
          {props.emptyLabel}
        </Text>
      </VStack>
    );
  }
  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        widgetURL(props.url),
        padding({ all: compact ? 2 : 12 }),
        background(compact ? 'clear' : '#FFF7EC'),
      ]}
    >
      <Text
        modifiers={[font({ size: compact ? 14 : 20, weight: 'black' }), foregroundStyle('#16110D')]}
      >
        {props.petName.toUpperCase()}
      </Text>
      <Text modifiers={[font({ size: 13, weight: 'semibold' }), foregroundStyle('#5A5047')]}>
        {props.moodLabel}
      </Text>
      {props.streakLabel ? (
        <HStack>
          <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle('#FF5A3C')]}>
            {props.streakLabel}
          </Text>
        </HStack>
      ) : null}
      {props.waitingLabel && !compact ? (
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle('#16110D')]}>
          {props.waitingLabel}
        </Text>
      ) : null}
    </VStack>
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
