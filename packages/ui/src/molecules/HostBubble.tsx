import type { Mood, Species } from '@blowy/domain';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import type { PetPose } from '../assets/pets';
import { Text } from '../atoms/Text';
import { layout } from '../lib/styles';
import { PopIn } from '../motion/PopIn';
import { PetActor, type PetActorHandle, type PetActorReaction } from '../motion/pets/PetActor';
import { space } from '../theme';
import { SpeechBubble } from './SpeechBubble';

export interface HostBubbleProps {
  species: Species;
  /** Ce que demande le pet (la question de l'écran). */
  line: string;
  /** Mot de la phrase mis en jaune (son prénom, le nom du pet…). */
  highlight?: string;
  /** Petite ligne estompée sous la bulle (« réponds comme moi »). */
  note?: string;
  /** Pose de repos du petit pet. Défaut `neutre`. */
  mood?: Mood | PetPose;
  /** À incrémenter pour que le petit pet réagisse (une réponse vient de tomber). */
  reactKey?: number;
  /** Réaction jouée à chaque `reactKey`. Défaut `joy`. */
  reaction?: PetActorReaction;
  /** Graine du hasard du pet (règle 8). */
  seed?: string;
  /** Nom lu par le lecteur d'écran sur le petit pet. */
  name?: string;
}

const SIZE = 64;

/**
 * L'hôte de l'inscription : le pet choisi, petit et vivant en haut à gauche, pose la question de l'écran dans une
 * grande bulle. À l'arrivée, le pet fait « pop » puis la bulle s'écrit (« … » puis mot à mot) ; une nouvelle question
 * réécrit la bulle. `reactKey` le fait réagir (une réponse choisie). Animations réduites : tout est là, en fondu.
 */
export function HostBubble({ species, line, highlight, note, mood = 'neutre', reactKey, reaction = 'joy', seed, name }: HostBubbleProps) {
  const actor = useRef<PetActorHandle>(null);
  const last = useRef(reactKey);
  useEffect(() => {
    if (reactKey === undefined || reactKey === last.current) return;
    last.current = reactKey;
    actor.current?.react(reaction);
  }, [reactKey, reaction]);
  return (
    <View style={styles.wrap}>
      <View style={[layout.row, styles.row]}>
        <PopIn from={0.5} style={styles.pet}>
          <PetActor ref={actor} species={species} mood={mood} size={SIZE} seed={seed} sleepAfter={null} shadow={false} accessibilityLabel={name} />
        </PopIn>
        <PopIn delay={120} from={0.7} trigger={line} style={[layout.grow, styles.bubble]}>
          <SpeechBubble text={line} highlight={highlight} tone="dark" tail="left" size="lg" typing />
        </PopIn>
      </View>
      {note ? (
        <Text muted size={14} style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: space.md },
  row: { alignItems: 'flex-end', gap: space.xs },
  pet: { width: SIZE, marginLeft: -6, marginBottom: -4 },
  bubble: { minWidth: 0, transformOrigin: '0% 100%' },
  note: { marginTop: space.md, marginLeft: SIZE + space.xs - 6 },
});
