import type { Outfit, Species } from '@blowy/domain';
import { StyleSheet, View } from 'react-native';

import { PetBadge } from '../atoms/PetBadge';
import { Text } from '../atoms/Text';
import { ICON_NAMES, type IconName } from '../assets/pets';
import { layout } from '../lib/styles';
import { AnswerSlider, type AnswerSliderProps } from '../molecules/AnswerSlider';
import { ChoiceCard } from '../molecules/ChoiceCard';
import { HostBubble } from '../molecules/HostBubble';
import { Appear } from '../motion/Appear';
import { PopIn } from '../motion/PopIn';
import type { MascotMoment, MascotSource } from '../motion/mascot';
import type { PetActorReaction } from '../motion/pets/PetActor';
import { alpha, color, petTint, radius, space } from '../theme';

export interface SeanceOption {
  id: string;
  label: string;
  /** Emoji, ou nom d'une illustration de l'app ; inconnu : rien. */
  icon: string;
}

export interface SeanceQuestionProps {
  /** Au-dessus (« Ton chemin · ta façon de vivre »). */
  kicker: string;
  /** La question, dite par le minimoa dans sa bulle. */
  text: string;
  pet: { species: Species; outfit?: Outfit | null; name: string; id?: string };
  format: 'choice' | 'slider';
  options: readonly SeanceOption[];
  picked: string | null;
  onPick: (optionId: string) => void;
  /** Curseur : réglages de la piste (bouts, valeur, lecture). */
  slider?: Omit<AnswerSliderProps, 'low' | 'high'> | null;
  /** Réaction du minimoa à la réponse (texte du serveur), sous les réponses. */
  reaction?: string | null;
  /** Change à chaque réponse : il réagit (`reactWith`), la réaction se réécrit. */
  reactKey?: number;
  reactWith?: PetActorReaction | null;
  /** Clé de la question (rejoue l'entrée des réponses). */
  questionKey: string;
  /** Sous la bulle, en petit (l'intro du minimoa avant la première question). */
  note?: string | null;
  /** Minimoa animé réglé par l'API (à la place du petit minimoa) ; absent : affichage habituel. */
  mascot?: MascotSource | null;
  /** Moment joué à chaque nouvelle `mascotKey` (réfléchir à l'arrivée d'une question, rire à une réponse). */
  mascotMoment?: MascotMoment | null;
  mascotKey?: number;
}

/** Une icône d'option : une illustration de l'app si le nom est connu, sinon l'emoji tel quel. */
export const optionIcon = (icon: string): { emoji?: string; icon?: IconName } =>
  (ICON_NAMES as readonly string[]).includes(icon) ? { icon: icon as IconName } : /[^\x20-\x7e]/.test(icon) ? { emoji: icon } : {};

/**
 * Une question de la séance (V6-GSeance) : le minimoa la pose dans sa bulle, puis les réponses en cartes illustrées
 * (la choisie passe au jaune et s'incline) ou un curseur entre deux bouts ; sa réaction monte dessous.
 */
export function SeanceQuestion({ kicker, text, pet, format, options, picked, onPick, slider, reaction, reactKey, reactWith, questionKey, note, mascot, mascotMoment, mascotKey }: SeanceQuestionProps) {
  const low = options[0];
  const high = options[options.length - 1];
  return (
    <View style={styles.wrap}>
      <Text variant="label" color={color.accent}>
        {kicker}
      </Text>
      <HostBubble species={pet.species} line={text} seed={pet.id} name={pet.name} reactKey={reactKey} reaction={reactWith ?? 'joy'} mood="neutre" note={note ?? undefined} mascot={mascot} mascotMoment={mascotMoment} mascotKey={mascotKey} />
      <Appear key={questionKey} replay={questionKey} delay={180} style={styles.answers}>
        {format === 'slider' && slider && low && high ? (
          <AnswerSlider {...slider} low={{ label: low.label, icon: optionIcon(low.icon).emoji ?? null }} high={{ label: high.label, icon: optionIcon(high.icon).emoji ?? null }} />
        ) : (
          options.map((o) => {
            const look = optionIcon(o.icon);
            return <ChoiceCard key={o.id} title={o.label} emoji={look.emoji} icon={look.icon} plain compact marker selected={picked === o.id} onPress={() => onPick(o.id)} />;
          })
        )}
      </Appear>
      {reaction ? (
        <PopIn key={reactKey} from={0.85} style={styles.reaction}>
          <View style={[layout.row, styles.reactionRow]}>
            <PetBadge species={pet.species} outfit={pet.outfit} size={36} background={petTint[pet.species]} />
            <Text variant="bodyBold" size={15} style={layout.shrink}>
              {reaction}
            </Text>
          </View>
        </PopIn>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md, paddingTop: space.md },
  answers: { gap: space.sm + 2, marginTop: space.sm },
  reaction: { borderRadius: radius.card, borderWidth: 1, borderColor: alpha(color.lime, 0.5), backgroundColor: color.panel, padding: space.md },
  reactionRow: { gap: space.sm + 2 },
});
