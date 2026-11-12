import { StyleSheet, View } from 'react-native';

import { Button } from '../atoms/Button';
import { Panel } from '../atoms/Panel';
import { PetImage } from '../atoms/PetImage';
import { Skeleton } from '../atoms/Skeleton';
import { Text } from '../atoms/Text';
import { Title } from '../atoms/Title';
import { layout } from '../lib/styles';
import { color, gradient, radius, space } from '../theme';
import type { PetLook, TitleContent } from '../types';

export interface InvitePanelProps {
  title: TitleContent;
  text: string;
  pet?: PetLook;
  /** Lien affiché sans protocole (« blowy.app/i/CODE ») ; la fin est mise en couleur. Absent : chargement. */
  url?: string;
  copyLabel: string;
  onCopy: () => void;
  shareLabel: string;
  onShare: () => void;
}

/** Panneau violet d'invitation (V6-Invite) : promesse, pet qui salue, lien à copier et bouton de partage. */
export function InvitePanel({ title, text, pet, url, copyLabel, onCopy, shareLabel, onShare }: InvitePanelProps) {
  const cut = url ? url.lastIndexOf('/') + 1 : 0;
  return (
    <Panel gradient="violet" radius={32} padding="none" style={styles.panel}>
      {pet ? (
        <View pointerEvents="none" style={styles.pet}>
          <PetImage species={pet.species} mood="salut" size={180} rotate={8} animation="bob" outline accessibilityLabel={pet.name} />
        </View>
      ) : null}
      <Title text={title} size={58} />
      <Text variant="bodyBold" size={15} style={styles.text}>
        {text}
      </Text>
      {url ? (
        <>
          <View style={[layout.row, styles.link]}>
            <Text variant="bodyHeavy" size={17} color={color.dark} numberOfLines={1} style={layout.grow}>
              {url.slice(0, cut)}
              <Text variant="bodyHeavy" size={17} color={gradient.violet[0]}>
                {url.slice(cut)}
              </Text>
            </Text>
            <Button label={copyLabel} icon="copy" variant="dark" size="sm" onPress={onCopy} style={styles.copy} />
          </View>
          <Button label={shareLabel} variant="dark" onPress={onShare} style={styles.share} />
        </>
      ) : (
        <>
          <Skeleton height={56} radius="pill" style={styles.linkGap} />
          <Skeleton height={56} radius="pill" style={styles.share} />
        </>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 20 },
  pet: { position: 'absolute', right: -44, top: 96 },
  text: { marginTop: 10, maxWidth: 200, lineHeight: 20 },
  link: { marginTop: space.lg, height: 56, gap: space.sm, paddingLeft: space.lg, paddingRight: 6, borderRadius: radius.pill, backgroundColor: color.white },
  linkGap: { marginTop: space.lg },
  copy: { height: 44 },
  share: { marginTop: 10 },
});
