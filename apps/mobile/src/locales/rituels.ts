/**
 * Textes des rituels (V7 §5 à §8, §15) : la sortie du jour, le défi du jour et sa carte, la série et sa mèche,
 * les habitudes et leurs preuves en photo, les souvenirs privés, le bilan de la semaine, et les ajouts du caractère.
 * Les questions, consignes, verdicts et bilans eux-mêmes viennent de l'API (déjà traduits) ; ici, le cadre autour.
 */
import { TODO } from '@blowy/content';
import type { DailyKind, OutingAnswer, ProofVerdict, VisionAxis } from '@blowy/domain';
import type { TitleSegment } from '@blowy/ui';

import { formatDate, messages, plural } from './runtime';

const days = (n: number): string => `${n} ${plural(n, { one: 'jour', other: 'jours' })}`;

export const rituels = messages({
  fr: {
    /** Jauge vedette de l'accueil. */
    meter: {
      label: 'Sociabilité',
      suffix: ' %',
      needsOut: 'Il a besoin de sortir.',
      a11y: (n: number): string => `Sociabilité : ${n} sur 100`,
    },
    /** Ce que dit le minimoa quand il a besoin de sortir (3 phrases, choisies selon son état). */
    speechOut: ['On sort ? Même un petit tour.', 'J’ai besoin d’air. Et de monde.', 'Dehors, il paraît qu’il y a des gens.'],
    /** Après une sortie comptée, s'il n'a pas d'autre besoin. */
    speechOutDone: 'Ça fait du bien, l’air frais.',
    /** Question du jour (la question et les réponses viennent de l'API). */
    outing: {
      emoji: { saw_people: '🙌', walk: '🚶', not_yet: '🛋️' } as Record<OutingAnswer, string>,
      confirmed: 'Confirmé par ta position',
      error: 'Ta réponse n’est pas partie. Réessaie.',
    },
    /** Défi du jour : la ligne de l'accueil. */
    entry: {
      kicker: (kind: string): string => `Défi du jour · ${kind}`,
      todo: 'Avant minuit. Touche pour le voir.',
      done: 'Fait. Reviens demain.',
      streakNext: '+1',
      streakA11y: (n: number): string => (n > 0 ? `Ta série : ${days(n)}. Ouvrir la série` : 'Ouvrir la série'),
      loading: 'Le défi du jour…',
      error: 'Le défi du jour n’a pas chargé.',
      retry: 'Réessayer',
    },
    /** Carte plein écran du défi (V6-GDefi). */
    card: {
      kicker: (day: string): string => `Défi du jour · ${formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' })}`,
      /** Titre : le type du défi en capitales, le dernier mot estompé. */
      title: (kindLabel: string): TitleSegment[] => {
        const words = kindLabel.toUpperCase().replace(/\.$/, '').split(' ');
        if (words.length < 2) return [{ text: `${words[0] ?? ''}.` }];
        return [{ text: `${words.slice(0, -1).join(' ')}\n` }, { text: `${words[words.length - 1] ?? ''}.`, dim: true }];
      },
      rewardStreak: (n: number): string => `Série ${n}`,
      rewardStreakText: 'Un jour de plus',
      rewardItemText: (left: number): string => (left <= 1 ? 'Gagné ce soir' : `Plus que ${days(left)}`),
      rewardVision: 'Ta vision',
      rewardVisionText: (axis: string | null): string => (axis ? `« ${axis} » s’affine` : 'Elle s’affine'),
      rewardSocial: 'Sociabilité',
      rewardSocialText: 'Elle remonte',
      accept: 'J’y vais',
      later: 'Plus tard',
      close: 'Fermer',
      note: 'Il t’attend en haut de l’accueil jusqu’à minuit.',
      /** Après « j'y vais », selon le type. */
      goPhoto: 'Prendre la photo',
      goWrite: 'Ouvrir mes chats',
      goOutHint: 'Va prendre l’air. En rentrant, dis-le-lui sur l’accueil.',
      goOut: 'C’est parti',
      writeHint: 'Écris dans l’un de tes liens. Il le verra tout seul.',
      noLinks: 'Pas encore de lien : il t’en présentera.',
      done: 'Fait. Reviens demain.',
      doneLine: 'Défi relevé.',
      error: 'Ça n’est pas parti. Réessaie.',
      dismissA11y: 'Plus tard, fermer la carte',
      loadError: 'Le défi du jour n’a pas chargé.',
      retry: 'Réessayer',
    },
    /** Fête d'un défi relevé. */
    celebrate: {
      kicker: 'Défi relevé',
      title: (n: number): TitleSegment[] => [{ text: n > 1 ? 'JOURS\n' : 'JOUR\n' }, { text: 'DE SÉRIE.', dim: true }],
      record: 'C’est son record',
      tap: 'Touche pour continuer',
      fallback: 'Sa mèche brûle un peu plus fort.',
    },
    /** Écran de la série (V6-GSerie). */
    streak: {
      back: 'Retour',
      title: (n: number): TitleSegment[] => [{ text: n > 1 ? 'JOURS\n' : 'JOUR\n' }, { text: 'DE SÉRIE.', dim: true }],
      lineLit: 'Sa mèche brûle plus fort chaque jour.',
      lineOff: 'Sa mèche s’allume au premier défi relevé.',
      record: 'C’est son record',
      best: (n: number): string => `Record : ${days(n)}`,
      letters: ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as readonly string[],
      dayA11y: {
        done: (d: string): string => `${d} : défi relevé`,
        joker: (d: string): string => `${d} : protégé par un joker`,
        missed: (d: string): string => `${d} : pas de défi`,
        today: (d: string): string => `${d} : aujourd’hui, à faire`,
        future: (d: string): string => `${d} : à venir`,
        not_yet: (d: string): string => `${d} : avant ton arrivée`,
      },
      weekday: (day: string): string => formatDate(day, { weekday: 'long' }),
      todayLead: 'Aujourd’hui : ',
      todayDone: (n: number): string => `, et c’est ${n}.`,
      todayTodo: ', avant minuit.',
      /** Jour manqué, dit simplement. */
      reset: (best: number): string => `La série est repartie de zéro. Le record reste : ${days(best)}.`,
      milestones: 'Ses objets de série',
      milestoneHint: (item: string, left: number): string => `${item} dans ${days(left)}`,
      milestoneAll: 'Tout est gagné.',
      milestoneLabel: (d: number): string => `${d} j`,
      milestoneA11y: (item: string, d: number, state: 'owned' | 'next' | 'locked'): string =>
        `${item}, ${days(d)}, ${state === 'owned' ? 'gagné' : state === 'next' ? 'le prochain' : 'plus loin'}`,
      jokers: (n: number): string => `${n} ${plural(n, { one: 'joker', other: 'jokers' })} cette semaine.`,
      jokersText: 'Il protège ta série si tu rates un jour. Il se pose tout seul.',
      jokersPlus: (n: number): string => `Avec Blowy+ : ${n} par semaine.`,
      seePlus: 'Voir Blowy+',
      cta: 'Voir le défi du jour',
      loadError: 'La série n’a pas chargé.',
      retry: 'Réessayer',
    },
    /** Habitudes (V6-GHabitudes). */
    habits: {
      back: 'Retour',
      title: [{ text: 'SES ' }, { text: 'HABITUDES', dim: true }] as TitleSegment[],
      count: (used: number, limit: number): string => `${used}/${limit}`,
      countA11y: (used: number, limit: number): string => `${used} sur ${limit}`,
      intro: (pet: string): string => `Tiens-les : ${pet} gagne des objets, et ta vision s’affine.`,
      meta: (axis: string, streak: number, weekly: boolean, hour: number): string =>
        streak > 0
          ? `${axis} · série de ${streak} ${weekly ? plural(streak, { one: 'semaine', other: 'semaines' }) : plural(streak, { one: 'jour', other: 'jours' })} · photo vers ${hour} h`
          : `${axis} · photo vers ${hour} h`,
      progress: (item: string, need: number): string => `${item} à ${need} ${plural(need, { one: 'habitude tenue', other: 'habitudes tenues' })}`,
      progressAll: 'Tous ses objets d’habitude sont gagnés.',
      itemsTitle: 'Ce qu’elles lui font gagner',
      itemsLabel: (n: number): string => `${n} ×`,
      doneToday: 'Fait aujourd’hui',
      week: (done: number, target: number): string => `${done}/${target} cette semaine`,
      prove: 'Montrer la preuve',
      remove: 'Arrêter',
      removeA11y: (label: string): string => `Arrêter l’habitude ${label}`,
      removeTitle: (label: string): string => `Arrêter « ${label} » ?`,
      removeText: 'Sa série s’arrête. Les objets gagnés restent.',
      removeConfirm: 'Arrêter cette habitude',
      removeCancel: 'La garder',
      catalogue: 'Dans le catalogue',
      limitFree: (free: number, plus: number): string => `Gratuit : ${free} habitudes. Avec Blowy+, jusqu’à ${plus}.`,
      limitPlus: (n: number): string => `Avec Blowy+ : jusqu’à ${n} habitudes.`,
      full: 'Complet',
      locked: 'Blowy+',
      lockedA11y: (label: string): string => `${label} : avec Blowy+`,
      addA11y: (label: string): string => `Ajouter l’habitude ${label}`,
      social: 'Avec du monde',
      addTitle: (label: string): string => label,
      addAsk: (ask: string): string => `Il te demandera : « ${ask} »`,
      addHour: (h: number): string => `Vers ${h} h, quand c’est à faire.`,
      addConfirm: 'Commencer',
      emptyTitle: [{ text: 'PAS ENCORE\n' }, { text: 'D’HABITUDE.', dim: true }] as TitleSegment[],
      empty: 'Choisis-en une dans le catalogue : ton minimoa suivra.',
      plusCta: 'Voir Blowy+',
      loadError: 'Les habitudes n’ont pas chargé.',
      error: 'Ça n’a pas marché. Réessaie.',
      retry: 'Réessayer',
      emoji: {
        marcher: '👟',
        sport: '🏃',
        voir_un_ami: '🫶',
        appeler_un_proche: '📞',
        cuisiner: '🍝',
        lire: '📖',
        creer: '🎨',
        apprendre: '🧠',
        se_coucher_tot: '😴',
        planifier: '🗓️',
        decouvrir: '🧭',
        plantes: '🪴',
      } as Record<string, string>,
      /** Repli si la vision n'est pas encore chargée. */
      axis: { foyer: 'Foyer', ancrage: 'Ancrage', elan: 'Élan', rythme: 'Rythme', cap: 'Cap' } as Record<VisionAxis, string>,
    },
    /** Preuve en photo (V6-GPreuve) et photo du défi. */
    proof: {
      close: 'Fermer',
      dailyChip: 'Défi du jour',
      busy: 'Il regarde…',
      /** Vrai à la lettre : aucun humain ; une IA tierce la vérifie, seulement avec l’accord donné avant (audit B5). */
      privacy: 'Prise ici, jamais depuis ta galerie. Aucun humain ne la voit : une IA la vérifie, avec ton accord. Supprimée sous 24 h chez Blowy, sauf si tu la gardes.',
      privacyDaily: 'Prise ici, jamais depuis ta galerie. Aucun humain ne la voit. Supprimée sous 24 h, sauf si tu la gardes.',
      verdict: { yes: 'VALIDÉ !', unsure: 'ÇA COMPTE.', no: 'PAS CETTE FOIS.' } as Record<ProofVerdict, string>,
      dailyDone: 'FAIT !',
      badge: (streak: number, weekly: boolean): string =>
        `+1 · série de ${streak} ${weekly ? plural(streak, { one: 'semaine', other: 'semaines' }) : plural(streak, { one: 'jour', other: 'jours' })}`,
      shutter: 'Prendre la photo',
      retake: 'Reprendre',
      continue: 'Continuer',
      keep: 'La garder dans mes souvenirs privés',
      kept: 'Gardée dans tes souvenirs privés',
      unkeep: 'Ne plus la garder',
      retry: 'Réessayer',
      permissionTitle: [{ text: 'IL VEUT\n' }, { text: 'VOIR.', dim: true }] as TitleSegment[],
      permissionText: 'Pour la preuve, la photo se prend ici, avec l’appareil photo. Jamais depuis ta galerie.',
      permissionAsk: 'Autoriser l’appareil photo',
      permissionSettings: 'Ouvrir les réglages',
      unavailable: 'Pas d’appareil photo disponible ici. Essaie depuis ton téléphone.',
      sendError: 'La photo n’est pas partie. Réessaie.',
      notFound: 'Cette habitude n’existe plus.',
      back: 'Revenir',
    },
    /** Souvenirs privés. */
    memories: {
      back: 'Retour',
      title: [{ text: 'TES ' }, { text: 'SOUVENIRS', dim: true }] as TitleSegment[],
      intro: 'Tes souvenirs privés : les photos que tu as gardées. Personne d’autre ne les voit.',
      empty: [{ text: 'RIEN\n' }, { text: 'GARDÉ.', dim: true }] as TitleSegment[],
      emptyText: 'Après une preuve, garde la photo si tu veux t’en souvenir. Sinon, elle disparaît sous 24 h.',
      day: (day: string): string => formatDate(day, { day: 'numeric', month: 'short' }),
      more: 'Voir plus',
      loadError: 'Tes souvenirs n’ont pas chargé.',
      retry: 'Réessayer',
    },
    /** Bilan de la semaine (V6-GBilan). */
    review: {
      /** L'axe qui a le plus bougé (`axisMoves` de l'API) : direction et taille en mots, jamais un chiffre. */
      moveTitle: (axis: string): string => `Ta vision · ${axis}`,
      moveSticker: (pole: string, size: 'small' | 'medium' | 'large'): string => `${size === 'small' ? 'Un peu' : size === 'medium' ? 'Nettement' : 'Beaucoup'} vers ${pole}`,
      moveA11y: (axis: string, pole: string, size: 'small' | 'medium' | 'large'): string =>
        `${axis} : cette semaine, ${size === 'small' ? 'un peu' : size === 'medium' ? 'nettement' : 'beaucoup'} vers ${pole}`,
      close: 'Fermer',
      back: 'Retour',
      kicker: (week: number): string => `Dimanche soir · semaine ${week}`,
      title: (title: string): TitleSegment[] => {
        const words = title.toUpperCase().replace(/\.$/, '').split(' ');
        if (words.length < 2) return [{ text: `${words[0] ?? ''}.` }];
        return [{ text: `${words.slice(0, -1).join(' ')}\n` }, { text: `${words[words.length - 1] ?? ''}.`, dim: true }];
      },
      outings: (n: number): string => plural(n, { one: 'sortie', other: 'sorties' }),
      habits: (n: number): string => plural(n, { one: 'habitude', other: 'habitudes' }),
      streak: (n: number): string => plural(n, { one: 'jour de série', other: 'jours de série' }),
      did: 'Ta semaine',
      noticed: (pet: string): string => `Ce que ${pet} a remarqué`,
      links: 'Tes liens',
      plusChip: 'Blowy+',
      plusLead: 'Bilan détaillé, avec Blowy+',
      plusText: 'Tes axes sur 4 semaines, et chaque lien.',
      plusA11y: 'Bilan détaillé avec Blowy+',
      detailedAxes: 'Tes axes sur 4 semaines',
      detailedLinks: 'Chaque lien',
      all: 'Tous tes bilans',
      listTitle: [{ text: 'SES ' }, { text: 'BILANS', dim: true }] as TitleSegment[],
      listIntro: 'Chaque dimanche soir, il te raconte ta semaine.',
      row: (weekStart: string): string => `Semaine du ${formatDate(weekStart, { day: 'numeric', month: 'long' })}`,
      unread: 'Nouveau',
      empty: [{ text: 'PAS ENCORE\n' }, { text: 'DE BILAN.', dim: true }] as TitleSegment[],
      emptyText: 'Le premier arrive dimanche soir.',
      more: 'Voir plus',
      loadError: 'Le bilan n’a pas chargé.',
      retry: 'Réessayer',
      /** Carte de l'accueil quand un bilan n'est pas lu. */
      homeTitle: 'Le bilan de la semaine est là',
      homeText: (pet: string): string => `${pet} te raconte ta semaine.`,
    },
    /** Accueil : lignes vers les rituels. */
    home: {
      /** Compte sans test de vision : l'entrée vers `/vision-test`. */
      visionTestTitle: (pet: string): string => `${pet} ne sait pas encore qui te présenter`,
      visionTestText: 'Passe le test de vision : 12 situations, 2 minutes. Sans lui, pas de rencontres.',
      habitsTitle: 'Ses habitudes',
      habitsDue: (n: number): string => `${n} ${plural(n, { one: 'à faire', other: 'à faire' })} aujourd’hui`,
      habitsNone: 'Choisis-en une : il gagne des objets.',
      habitsQuiet: 'Rien à faire aujourd’hui.',
      proofTitle: (pet: string): string => `${pet} demande une preuve`,
    },
    /** Son caractère, rééquilibré (§15). */
    character: {
      vision: 'Sa vision',
      visionHint: 'pour l’instant · indicatif',
      visionFooter: (note: string): string => `C’est elle qui choisit qui il te présente. ${note}`,
      between: 'entre les deux',
      axisA11y: (name: string, line: string): string => `${name} : ${line}`,
      style: 'Son style',
      styleHint: 'ne filtre personne',
      styleEmpty: 'Son style prend forme avec les 3 mots de tes potes et avec le temps passé ensemble.',
      styleA11y: (name: string, value: number): string => `${name} : ${value > 0 ? '+' : ''}${value}`,
      habits: 'Ses habitudes',
      habitsText: (n: number, best: number): string =>
        n === 0 ? 'Aucune pour l’instant' : `${n} ${plural(n, { one: 'habitude', other: 'habitudes' })} · meilleure série : ${best}`,
      streak: 'Sa série',
      streakText: (n: number, best: number): string => (n > 0 ? `${days(n)} · record ${best}` : best > 0 ? `Record : ${days(best)}` : 'Sa mèche attend le premier défi'),
      evolution: 'Son évolution',
      evolutionText: 'Comment il change avec toi',
      reviews: 'Ses bilans',
      reviewsText: 'Chaque dimanche soir',
      memories: 'Souvenirs privés',
      memoriesText: 'Les photos que tu as gardées',
      visionError: 'Sa vision n’a pas chargé.',
    },
    /** Libellés courts des types de défi (lecteur d'écran). */
    kinds: { question: 'Une question', photo: 'Une photo', write: 'Un mot à un lien', go_out: 'Sortir' } as Record<DailyKind, string>,
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
