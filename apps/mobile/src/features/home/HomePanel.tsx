import type { Pet } from '@blowy/contract';
import { CARE_ACTIONS } from '@blowy/domain';
import { CareBar, formBodyPose, PetStage, usePetLure } from '@blowy/ui';

import { careAvailable } from '@/features/pet';
import { accueil as t } from '@/locales/accueil';
import { careLabel } from '@/locales/content';

import { useHomeCompact } from './compact';
import { type HomeMood, homePanelGradient } from './logic';
import type { PetPlay } from './play';


/**
 * Panneau du minimoa de l'accueil (V6-GAccueil `.panneau`) : 184 pt (168 en petit écran), nom en Allo ExtraBold
 * (31 pt, 27 en petit), puce d'humeur, « Garde-robe » blanc sans pastille, les 4 soins de 44 pt en bas à gauche (jamais
 * jaunes ; on peut aussi les glisser jusqu'à lui), « Le réveiller » à leur place quand il dort. Toucher le minimoa :
 * un câlin.
 */
export function HomePanel({
  pet,
  mood,
  play,
  sleepAfter,
  onSleepChange,
  onWardrobe,
}: {
  pet: Pet;
  mood: HomeMood;
  play: PetPlay;
  sleepAfter: number | null;
  onSleepChange: (asleep: boolean) => void;
  onWardrobe: () => void;
}) {
  const small = useHomeCompact();
  const lure = usePetLure();
  return (
    <PetStage
      pet={pet}
      title={pet.name.toUpperCase()}
      gradient={homePanelGradient(pet.species)}
      titleSize={small ? 36 : 42}
      moodLabel={t.mood[mood]}
      height={small ? 168 : 184}
      petSize={small ? 136 : 156}
      mood={formBodyPose(pet.form)}
      sleep={{ after: sleepAfter, wakeLabel: t.wake, wakeA11y: t.wakeA11y(pet.name), onSleepChange }}
      action={{ label: t.wardrobe, onPress: onWardrobe, accessibilityLabel: t.wardrobeA11y }}
      reaction={play.reaction}
      reactionKey={play.reactionKey}
      reactionItem={play.reactionItem}
      petLabel={t.petA11yCuddle(pet.name)}
      onPetPress={play.onPetPress}
      lure={lure}
      care={
        <CareBar
          compact
          actions={CARE_ACTIONS}
          labels={careLabel}
          available={careAvailable(pet.needs)}
          size={44}
          busy={null}
          onCare={play.onCare}
          onRefused={play.onRefused}
          lure={lure}
          carry={play.carry}
        />
      }
    />
  );
}
