/**
 * Le minimoa de l'accueil qui joue : soins optimistes (il croque, joue, dort à l'appui ; un refus du serveur le fait
 * revenir et il le dit), câlin au toucher, un petit moment à l'ouverture, le salut au retour dans l'app. Ce qu'il dit
 * passe par une bulle courte (3,5 s) à côté de la série, jamais par-dessus du contenu.
 */
import { ApiError } from '@blowy/api-client';
import type { CareAction, Needs } from '@blowy/domain';
import { type CareProp, careProp, type PetReaction, useHelloWave } from '@blowy/ui';
import { useEffect, useRef, useState } from 'react';

import { careAvailable, useCare } from '@/features/pet';
import { careLabel } from '@/locales/content';

import { homeEntrance } from './logic';
import { useHomeVisit } from './visit';

/** Durée d'affichage d'une réplique après un soin (« Miam. », « Il n’a plus faim. »). */
const SAID_MS = 3500;

export interface PetPlay {
  reaction: PetReaction | null;
  reactionKey: number;
  reactionItem: CareProp | null;
  /** Ce qu'il vient de dire (null : rien en ce moment). */
  said: string | null;
  /** Objets portés par chaque soin (la nourriture et le jouet tournent d'un soin à l'autre). */
  carry: Partial<Record<CareAction, CareProp | null>>;
  onCare: (action: CareAction) => void;
  onRefused: (action: CareAction) => void;
  /** Toucher le minimoa : un câlin (le quatrième soin), ou non de la tête s'il est comblé. */
  onPetPress: () => void;
  care: ReturnType<typeof useCare>;
}

export function usePetPlay(o: { petId: string | undefined; needs: Needs | undefined; night: boolean; focused: boolean; hello: string }): PetPlay {
  const care = useCare();
  const [reaction, setReaction] = useState<PetReaction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [reactionItem, setReactionItem] = useState<CareProp | null>(null);
  const [careTurn, setCareTurn] = useState(() => new Date().getDate());
  const [said, setSaid] = useState<{ text: string; key: number } | null>(null);

  const say = (text: string) => setSaid((s) => ({ text, key: (s?.key ?? 0) + 1 }));
  const play = (re: PetReaction, item: CareProp | null = null) => {
    setReactionItem(item);
    setReaction(re);
    setReactionKey((k) => k + 1);
  };

  useEffect(() => {
    if (!said) return;
    const id = setTimeout(() => setSaid(null), SAID_MS);
    return () => clearTimeout(id);
  }, [said]);

  // Retour dans l'app (rare, budget partagé) : il fait coucou depuis son panneau, sans rien couvrir.
  useHelloWave(
    () => {
      play('wave');
      say(o.hello);
    },
    { seed: o.petId, active: o.focused },
  );

  // Un moment par ouverture : il arrive en marchant, fait coucou après plus de 12 h, bâille la nuit.
  const entered = useRef(false);
  useEffect(() => {
    if (entered.current || !o.petId) return;
    entered.current = true;
    const now = Date.now();
    const visit = useHomeVisit.getState();
    const moment = homeEntrance({ last: visit.last, now, night: o.night });
    visit.mark(now);
    // Il part tout de suite (sinon on le verrait une image à sa place avant qu'il arrive) ; le coucou attend un peu.
    const id = setTimeout(
      () => {
        play(moment);
        if (moment === 'wave' || moment === 'welcome') say(o.hello);
      },
      moment === 'arrive' ? 0 : moment === 'welcome' ? 900 : 260,
    );
    return () => clearTimeout(id);
    // `play` et `say` ne changent que l'état local : lus au moment du moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.petId]);

  const onRefused = (action: CareAction) => {
    play('no');
    say(careLabel[action]?.refused ?? '');
  };
  // Optimiste : il croque, joue ou dort à l'appui (jauges déjà à jour) ; un refus du serveur le fait revenir.
  const onCare = (action: CareAction) => {
    play(action, careProp(action, careTurn));
    setCareTurn((n) => n + 1);
    say(careLabel[action]?.done ?? '');
    care.mutate(action, {
      onError: (e) => {
        // Refus (besoin déjà comblé) : il le dit lui-même dans sa bulle, et fait non de la tête.
        if (e instanceof ApiError && e.code === 'already_done') {
          play('no');
          say(e.message || (careLabel[action]?.refused ?? ''));
        }
      },
    });
  };
  const onPetPress = () => {
    if (o.needs && careAvailable(o.needs).cuddle) onCare('cuddle');
    else onRefused('cuddle');
  };

  return {
    reaction,
    reactionKey,
    reactionItem,
    said: said?.text ?? null,
    carry: { feed: careProp('feed', careTurn), play: careProp('play', careTurn), nap: careProp('nap', careTurn) },
    onCare,
    onRefused,
    onPetPress,
    care,
  };
}
