/**
 * Image de contenu (visage filigrané, photo de lieu) : URL distante (jeton média court, expo-image,
 * sans cache disque pour les visages) ou, en démonstration locale, portrait illustré / image d'asset.
 */
import { Image } from 'expo-image';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Portrait, type PortraitKey } from './Portrait';
import { Sprite } from './Sprite';

export type MediaSource =
  | { kind: 'portrait'; who: PortraitKey }
  | { kind: 'sprite'; path: string }
  | { kind: 'uri'; uri: string; private?: boolean };

export function MediaView({
  source,
  style,
  contentFit = 'cover',
  contentPosition,
  bottomInset,
}: {
  source: MediaSource;
  style?: StyleProp<ViewStyle>;
  contentFit?: 'cover' | 'contain';
  contentPosition?: { top?: string; left?: string };
  bottomInset?: number;
}) {
  if (source.kind === 'portrait')
    return <Portrait who={source.who} bottomInset={bottomInset} style={style} />;
  if (source.kind === 'sprite') {
    return (
      <View style={[{ overflow: 'hidden' }, style]}>
        <Sprite
          path={source.path}
          size={1}
          contentFit={contentFit}
          contentPosition={contentPosition}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </View>
    );
  }
  return (
    <View style={[{ overflow: 'hidden' }, style]}>
      <Image
        source={{ uri: source.uri }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        contentFit={contentFit}
        contentPosition={contentPosition as never}
        transition={0}
        cachePolicy={source.private ? 'none' : 'memory-disk'}
      />
    </View>
  );
}
