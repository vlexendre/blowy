/** Textes de l'onglet Moi et de ses sous-écrans. */
import { brand } from '@blowy/content';
import { messages, plural } from './runtime';

const up = (s: string): string => s.toUpperCase();
/** Heure pleine à l'américaine (l'anglais de Minimoa est américain) : « 9 AM », « 10 PM », « 12 PM » pour midi. */
const usHour = (h: number): string => `${h % 12 === 0 ? 12 : h % 12} ${h % 24 < 12 ? 'AM' : 'PM'}`;

export const moi = messages({
  fr: {
    tab: {
      title: (name: string, pet: string) => [
        { text: up(name) },
        { text: '.\n', dim: true },
        { text: `ET ${up(pet)}.`, dim: true },
      ],
      /** Lu sur tout l'en-tête (photo, noms). Ce que les autres voient de ta photo s'explique sur Mon compte. */
      heroLabel: (name: string, pet: string) => `${name} et ${pet}. Touche pour changer ton nom ou ta photo.`,
      /** Sous les noms : depuis combien de jours vous êtes ensemble (1 le premier jour). */
      together: (n: number) =>
        n <= 1 ? 'Premier jour ensemble' : `${n} ${plural(n, { one: 'jour', other: 'jours' })} ensemble`,
      wordsTitle: 'Décris-moi en 3 mots',
      /** Puce une fois des mots reçus. */
      wordsCount: (n: number) => `${n} ${plural(n, { one: 'réponse', other: 'réponses' })}`,
      wordsLead: (pet: string) => `Tes potes façonnent le caractère de ${pet}.`,
      wordsBadge: 'Anonyme',
      wordsShareCta: 'Partager le lien',
      copy: 'Copier',
      /** Après la copie (une coche se dessine à côté). */
      copied: 'Copié',
      wordsMessage: (url: string) => `Décris-moi en 3 mots (c’est anonyme) : ${url}`,
      /** Ce que compte chaque chiffre (un chiffre nul n'est pas montré). */
      stats: {
        links: (n: number) => plural(n, { one: 'lien', other: 'liens' }),
        streak: (n: number) => plural(n, { one: 'jour, meilleure série', other: 'jours, meilleure série' }),
      },
      /** Sans prix : le montant facturé se lit sur la feuille Minimoa+ (Apple 3.1.2).*/
      plusTitle: 'MINIMOA+',
      plusCta: 'Essayer',
      plusSoonCta: 'Voir',
      rows: {
        discreet: {
          title: 'Mode discret',
          subtitle: (on: boolean) => (on ? 'Invisible sur la carte' : 'Visible, position arrondie'),
        },
        ia: { title: 'L’IA et toi' },
        settings: { title: 'Réglages' },
      },
      discreetError: 'Le mode discret n’a pas changé. Réessaie.',
      ok: 'OK',
      errorText: 'Impossible de charger ton profil.',
    },
    reglages: {
      title: 'RÉGLAGES',
      sections: {
        account: 'Compte',
        privacy: 'Confidentialité',
        app: 'L’app',
        help: 'Aide et infos légales',
      },
      rows: {
        account: { title: 'Mon compte', subtitle: (name: string) => name },
        identity: { title: 'Qui tu es' },
        plus: {
          title: 'Minimoa+',
          subtitle: (member: boolean) => (member ? 'Abonnement actif' : 'Pas encore de Minimoa+'),
        },
        notifications: { title: 'Notifications' },
        location: {
          title: 'Ma position',
          subtitle: (on: boolean) => (on ? 'Activée, arrondie à 300 m environ' : 'Désactivée'),
        },
        /** Statistiques d’usage (Amplitude, États-Unis) : seulement avec l’accord de la personne. */
        analytics: {
          title: 'Statistiques d’usage',
          subtitle: (on: boolean) => (on ? 'Tu participes' : 'Désactivées'),
        },
        blocked: {
          title: 'Personnes bloquées',
          subtitle: (n: number | null) =>
            n === null ? ' ' : n === 0 ? 'Personne' : n === 1 ? '1 personne' : `${n} personnes`,
        },
        language: { title: 'Langue', subtitle: (name: string) => name },
        rules: { title: 'Règles de la communauté' },
        safety: { title: 'Sécurité et signalement' },
        terms: { title: 'Conditions d’utilisation' },
        privacy: { title: 'Politique de confidentialité' },
        subscription: { title: 'Conditions de Minimoa+' },
        legal: { title: 'Mentions légales' },
        help: { title: 'Assistance', subtitle: brand.supportEmail },
        signOut: { title: 'Se déconnecter' },
        delete: { title: 'Supprimer mon compte' },
      },
      languageNames: {
        fr: 'Français',
        en: 'English',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
      } as Record<string, string>,
      languageTitle: 'Langue',
      languageText:
        'Minimoa suit la langue de ton téléphone. Pour la changer, va dans Réglages › Minimoa › Langue (ou dans la langue du téléphone).',
      languageWeb: 'Ici, Minimoa suit la langue de ton navigateur.',
      languageOpen: 'Ouvrir les Réglages',
      signOutConfirmTitle: 'Se déconnecter ?',
      signOutConfirmText: 'Ton minimoa t’attendra. Ce téléphone ne recevra plus ses notifications.',
      signOutConfirm: 'Se déconnecter',
      version: (v: string) => `Minimoa ${v}`,
    },
    notifications: {
      title: 'NOTIFS',
      banner: (cap: number) =>
        `${cap} notifications par jour au plus, hors messages. Plusieurs d’un coup arrivent en une seule. Rien quand tu es dans l’app. Pas de pub, sauf si tu le demandes.`,
      /** Action sur la notification elle-même (appui long) : coupe sa catégorie. */
      mute: 'Ne plus recevoir ce genre',
      reply: { action: 'Répondre', send: 'Envoyer', placeholder: 'Ta réponse…' },
      sections: { pet: 'Ton minimoa', links: 'Tes liens', plus: 'Minimoa+' },
      morning: { title: 'Heure du défi', value: (h: number) => `${h} h` },
      quiet: {
        title: 'Heures calmes',
        value: (start: number, end: number) => `${start} h – ${end} h`,
        text: (start: number, end: number) =>
          `Rien entre ${start} h et ${end} h. Ce qui peut attendre arrive le matin.`,
      },
      morningTitle: [{ text: 'HEURE ' }, { text: 'DU DÉFI', dim: true }],
      morningText: 'Ton défi du jour arrive à cette heure-là (heure de ton téléphone).',
      hour: (h: number) => `${h} h`,
      rows: {
        daily_challenge: { title: 'Défi du jour' },
        needs_out: { title: (pet: string) => `${pet} aimerait sortir`, subtitle: '1 par jour au plus' },
        streak_in_danger: { title: 'Un rappel pour ta série', subtitle: 'Le soir, 1 par jour au plus' },
        unlocked: { title: 'Objet débloqué, 3 mots reçus' },
        encounters: { title: 'Nouvelle rencontre, on te fait signe' },
        messages: { title: 'Messages' },
        your_turn: { title: 'À toi d’écrire', subtitle: 'Le soir, 1 par jour au plus' },
        link_in_danger: { title: 'Un mot pour un lien', subtitle: 'Quand ça fait un moment' },
        trial_reminder: {
          title: 'Fin de l’essai',
          subtitle: 'Toujours envoyé, 2 jours avant le premier paiement',
        },
        marketing: { title: 'Offres Minimoa+', subtitle: 'Une relance au plus, seulement si tu le veux' },
        first_steps: { title: 'Premiers pas', subtitle: 'Tes 7 premiers jours, 3 idées' },
        minimoa_news: {
          title: 'Nouvelles de ton minimoa',
          subtitle: 'Quand tu t’absentes, vos anniversaires',
        },
        plus_account: { title: 'Ton abonnement Minimoa+', subtitle: 'Bienvenue, paiement, fin' },
      },
      /** Accord du téléphone. */
      permission: {
        undetermined: {
          title: 'Notifications pas encore activées',
          text: 'Le téléphone n’a pas encore donné son accord. Tes réglages sont gardés.',
          action: 'Activer les notifications',
        },
        denied: {
          title: 'Notifications coupées sur ce téléphone',
          text: 'Pour les recevoir, autorise-les dans Réglages › Minimoa › Notifications. Tes choix ci-dessous sont gardés.',
          action: 'Ouvrir les Réglages',
        },
        web: 'Sur le web, pas de notifications : elles arrivent sur ton téléphone.',
      },
      loadError: 'Impossible de charger tes réglages de notifications',
      saveError: 'Le réglage n’est pas passé. Réessaie.',
    },
    compte: {
      title: [{ text: 'MON ' }, { text: 'COMPTE.', dim: true }],
      photoLabel: 'Ta photo de profil',
      photoHint: 'Ta photo reste cachée dans un lien jusqu’au niveau 4, puis floue, puis nette au niveau 5.',
      photoChange: 'Changer la photo',
      photoAdd: 'Ajouter une photo',
      sheetTitle: [{ text: 'TA ' }, { text: 'PHOTO', dim: true }],
      camera: 'Prendre une photo',
      library: 'Choisir dans ma galerie',
      accessTitle: 'Accès refusé',
      accessCamera: 'Minimoa n’a pas accès à l’appareil photo. Autorise-le dans Réglages › Minimoa.',
      accessLibrary: 'Minimoa n’a pas accès à tes photos. Autorise-le dans Réglages › Minimoa › Photos.',
      openSettings: 'Ouvrir les Réglages',
      photoError: 'La photo n’est pas passée. Réessaie.',
      /** Photo refusée par le filtre : la raison vient de l’API. */
      photoRefusedTitle: 'Photo refusée',
      /**
       * Sous la photo et dans la feuille, avant de choisir (App Review 5.1.2(i)). Le prestataire (nom, pays) vient de
       * l’API (`GET /v1/me/ai`) ; tant qu’il n’est pas lu, « notre prestataire d’IA ».
       */
      photoCheck: (provider: string | null, country: string | null): string =>
        `Avant d’être montrée, chaque photo de profil est vérifiée automatiquement par ${provider ? `${provider}${country ? ` (${country})` : ''}, notre prestataire d’IA` : 'notre prestataire d’IA'} : ni nudité, ni personne qui semble mineure, ni violence, ni haine, ni pub. Une photo refusée est effacée.`,
      photoCheckAccept:
        'En choisissant une photo, tu acceptes cette vérification. Détails dans Moi › L’IA et toi.',
      photoSaved: 'Photo enregistrée.',
      nameLabel: 'Prénom',
      minimoaName: 'Nom de ton minimoa',
      cityLabel: 'Ville',
      cityPlaceholder: 'Facultatif',
      emailLabel: 'E-mail',
      save: 'Enregistrer',
      saved: 'C’est enregistré.',
      nameError: 'Ton prénom ne peut pas être vide.',
    },
    bloques: {
      title: 'BLOQUÉS',
      text: 'Une personne bloquée ne voit plus ton minimoa et ne peut plus t’écrire. Vos minimoas ne se croisent plus. Elle n’est pas prévenue.',
      unblock: 'Débloquer',
      unblockLabel: (name: string) => `Débloquer ${name}`,
      empty: 'Personne n’est bloqué. Et c’est très bien comme ça.',
      howTo: 'Pour bloquer quelqu’un : ouvre le lien, puis le menu en haut à droite.',
    },
    supprimer: {
      title: 'SUPPRIMER',
      heading: (pet: string) => [{ text: `${up(pet)} ` }, { text: 'S’EN VA AUSSI.', dim: true }],
      text: 'C’est immédiat et définitif : on ne peut rien récupérer ensuite.',
      erasedTitle: 'Ce qui est effacé tout de suite',
      items: (links: number | null) => [
        {
          key: 'account',
          title: 'Ton compte',
          subtitle: 'Prénom, photo, date de naissance, sexe, ce que tu cherches',
        },
        {
          key: 'pet',
          title: 'Ton minimoa',
          subtitle: 'Sa vision, son style, ses objets, tes habitudes, ta série',
        },
        { key: 'place', title: 'Ta position', subtitle: 'Arrondie, et ta zone ou ta ville choisie' },
        {
          key: 'links',
          title:
            links === null
              ? 'Tes liens'
              : links === 0
                ? 'Tes liens (tu n’en as pas encore)'
                : links === 1
                  ? 'Ton lien'
                  : `Tes ${links} liens`,
          subtitle: 'Messages, anciennes photos, étapes. Ils disparaissent aussi pour les autres',
        },
        {
          key: 'photos',
          title: 'Tes photos de preuve et de défi',
          subtitle: 'Et les « 3 mots » reçus, tes invitations',
        },
        {
          key: 'settings',
          title: 'Tes réglages',
          subtitle: 'Et l’autorisation de t’envoyer des notifications',
        },
      ],
      keptTitle: 'Ce qui est gardé, et pourquoi',
      kept: [
        { key: 'backups', title: 'Sauvegardes techniques', subtitle: 'Écrasées au fil de leur rotation' },
        {
          key: 'moderation',
          title: 'Signalements et modération',
          subtitle: 'Sécurité des autres, détachés de ton compte, 1 an',
        },
        {
          key: 'purchases',
          title: 'Références des achats Minimoa+',
          subtitle: 'Obligations comptables, jusqu’à 10 ans',
        },
        {
          key: 'stats',
          title: 'Statistiques',
          subtitle: 'Jours d’activité 40 jours au plus, puis seulement des chiffres anonymes',
        },
        {
          key: 'ban',
          title: 'En cas d’exclusion définitive',
          subtitle: 'Une empreinte de ton identifiant, pour empêcher la réinscription, 3 ans',
        },
      ],
      plusNote:
        'Tu as Minimoa+ ? Supprimer ton compte n’annule pas l’abonnement. Annule-le d’abord dans les réglages de ton store.',
      details: 'Tout le détail',
      confirmLabel: 'Écris « supprimer » pour confirmer',
      confirmWord: 'supprimer',
      cta: 'Supprimer mon compte',
      cancel: 'Finalement, non',
      error: 'La suppression n’a pas abouti. Réessaie.',
    },
    /** Qui tu es, ce que tu cherches (données sensibles : accord explicite). */
    identite: {
      title: [{ text: 'QUI ' }, { text: 'TU ES.', dim: true }],
      intro:
        'Personne d’autre ne voit cette réponse. Elle sert à accorder les phrases et, sans ton nom, à nos statistiques.',
      genderTitle: 'Tu es',
      gender: {
        femme: 'Une femme',
        homme: 'Un homme',
        non_binaire: 'Non-binaire',
        non_dit: 'Je préfère ne pas dire',
      } as Record<string, string>,
      save: 'Enregistrer',
      saved: 'C’est enregistré.',
      error: 'Ce n’est pas passé. Réessaie.',
      selectedA11y: (label: string) => `${label}, sélectionné`,
    },
    /** Les minimoas dans tes chats (réglage global). */
    minimoas: {
      title: [{ text: 'TES ' }, { text: 'MINIMOAS', dim: true }],
      allTitle: 'Pour tous mes chats',
      allOn: 'Activer la lecture partout',
      allOff: 'Couper la lecture partout',
      allDone: (n: number) =>
        n === 0
          ? 'Rien à changer.'
          : n === 1
            ? 'C’est fait pour ton chat.'
            : `C’est fait pour tes ${n} chats.`,
      allNote: 'Pour tes chats actuels.',
      /** Réglage par défaut des nouveaux chats. */
      defaultTitle: 'Pour mes prochains chats',
      defaults: {
        ask: { title: 'Me demander à chaque fois', subtitle: 'Après vos premiers messages' },
        on: { title: 'Toujours activer la lecture', subtitle: 'Il faut encore l’accord de l’autre' },
        off: {
          title: 'Ne jamais activer la lecture',
          subtitle: 'Les minimoas réagissent seulement au rythme',
        },
      },
      defaultA11y: (title: string, on: boolean) => (on ? `${title}, choisi` : title),
      perLink: 'Chat par chat',
      row: (name: string) => `Avec ${name}`,
      /** `theirs` : refus et question pas encore vue se disent pareil (« pas encore activé de son côté »). */
      sub: (on: boolean | null, both: boolean, muted: boolean, theirs?: 'agreed' | 'not_yet') =>
        muted
          ? 'Minimoas coupés ici'
          : on === null
            ? theirs === 'agreed'
              ? 'Pas encore choisi · activé de son côté'
              : 'Pas encore choisi'
            : !on
              ? 'Sans lecture'
              : both
                ? 'Lecture activée, vous deux'
                : 'Oui · pas encore activé de son côté',
      readA11y: (name: string) => `Lecture par une IA dans le chat avec ${name}`,
      empty: 'Pas encore de chat. Ton réglage pour les prochains chats s’appliquera au premier.',
      more: 'Voir plus',
      loadError: 'Impossible de charger tes réglages',
      error: 'Ce n’est pas passé. Réessaie.',
    },
    /** Ma position. */
    position: {
      title: [{ text: 'MA ' }, { text: 'POSITION', dim: true }],
      lead: 'Ta position sert à trouver des gens compatibles autour de toi et à confirmer tes sorties, seulement app ouverte. Minimoa n’enregistre jamais ta position exacte : seulement un point arrondi à 300 m environ. Les autres voient une position arrondie et décalée, jamais en direct.',
      on: 'Position activée',
      onSub: (date: string | null) => (date ? `Dernier relevé le ${date}` : 'Pas encore de relevé'),
      off: 'Position désactivée',
      offSub: 'Choisis ta ville à la main pour avoir des rencontres autour',
      zone: (km: string) => `Ta zone : ${km} km autour de ton domicile approximatif`,
      city: (name: string, active: boolean) =>
        active ? `Ville choisie : ${name}` : `Ville choisie : ${name} (avec Minimoa+)`,
      enable: 'Activer la localisation',
      forget: 'Oublier ma position',
      forgetTitle: [{ text: 'OUBLIER ' }, { text: 'TA POSITION ?', dim: true }],
      forgetText:
        'On efface ta position et ta zone, et on retire ton accord. Plus de rencontres près de chez toi, jusqu’à ce que tu la réactives ou que tu choisisses ta ville à la main.',
      forgetConfirm: 'Oublier ma position',
      forgotten: 'C’est oublié.',
      error: 'Ce n’est pas passé. Réessaie.',
    },
  } as const,
  en: {
    tab: {
      title: (name: string, pet: string) => [
        { text: up(name) },
        { text: '.\n', dim: true },
        { text: `AND ${up(pet)}.`, dim: true },
      ],
      heroLabel: (name: string, pet: string) => `${name} and ${pet}. Tap to change your name or photo.`,
      together: (n: number) =>
        n <= 1 ? 'First day together' : `${n} ${plural(n, { one: 'day', other: 'days' })} together`,
      wordsTitle: 'Describe me in 3 words',
      wordsCount: (n: number) => `${n} ${plural(n, { one: 'answer', other: 'answers' })}`,
      wordsLead: (pet: string) => `Your friends shape ${pet}’s personality.`,
      wordsBadge: 'Anonymous',
      wordsShareCta: 'Share the link',
      copy: 'Copy',
      copied: 'Copied',
      wordsMessage: (url: string) => `Describe me in 3 words (it’s anonymous): ${url}`,
      stats: {
        links: (n: number) => plural(n, { one: 'link', other: 'links' }),
        streak: (n: number) => plural(n, { one: 'day, best streak', other: 'days, best streak' }),
      },
      plusTitle: 'MINIMOA+',
      plusCta: 'Try it',
      plusSoonCta: 'See',
      rows: {
        discreet: {
          title: 'Discreet mode',
          subtitle: (on: boolean) => (on ? 'Hidden from the map' : 'Visible, location rounded'),
        },
        ia: { title: 'AI and you' },
        settings: { title: 'Settings' },
      },
      discreetError: 'Discreet mode didn’t change. Try again.',
      ok: 'OK',
      errorText: 'Couldn’t load your profile.',
    },
    reglages: {
      title: 'SETTINGS',
      sections: { account: 'Account', privacy: 'Privacy', app: 'The app', help: 'Help and legal' },
      rows: {
        account: { title: 'My account', subtitle: (name: string) => name },
        identity: { title: 'Who you are' },
        plus: {
          title: 'Minimoa+',
          subtitle: (member: boolean) => (member ? 'Subscription active' : 'No Minimoa+ yet'),
        },
        notifications: { title: 'Notifications' },
        location: {
          title: 'My location',
          subtitle: (on: boolean) => (on ? 'On, rounded to about 300 m' : 'Off'),
        },
        analytics: {
          title: 'Usage statistics',
          subtitle: (on: boolean) => (on ? 'You’re taking part' : 'Off'),
        },
        blocked: {
          title: 'Blocked people',
          subtitle: (n: number | null) =>
            n === null ? ' ' : n === 0 ? 'No one' : n === 1 ? '1 person' : `${n} people`,
        },
        language: { title: 'Language', subtitle: (name: string) => name },
        rules: { title: 'Community rules' },
        safety: { title: 'Safety and reporting' },
        terms: { title: 'Terms of use' },
        privacy: { title: 'Privacy policy' },
        subscription: { title: 'Minimoa+ terms' },
        legal: { title: 'Legal notice' },
        help: { title: 'Support', subtitle: brand.supportEmail },
        signOut: { title: 'Sign out' },
        delete: { title: 'Delete my account' },
      },
      languageNames: {
        fr: 'Français',
        en: 'English',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
      } as Record<string, string>,
      languageTitle: 'Language',
      languageText:
        'Minimoa follows your phone’s language. To change it, go to Settings › Minimoa › Language (or change your phone’s language).',
      languageWeb: 'Here, Minimoa follows your browser’s language.',
      languageOpen: 'Open Settings',
      signOutConfirmTitle: 'Sign out?',
      signOutConfirmText: 'Your minimoa will wait for you. This phone will stop getting its notifications.',
      signOutConfirm: 'Sign out',
      version: (v: string) => `Minimoa ${v}`,
    },
    notifications: {
      title: 'NOTIFS',
      banner: (cap: number) =>
        `${cap} notifications a day at most, messages aside. Several at once arrive as one. Nothing while you’re in the app. No ads, unless you ask for them.`,
      /** Action sur la notification elle-même (appui long) : coupe sa catégorie. */
      mute: 'Stop this kind',
      reply: { action: 'Reply', send: 'Send', placeholder: 'Your reply…' },
      sections: { pet: 'Your minimoa', links: 'Your links', plus: 'Minimoa+' },
      morning: { title: 'Challenge time', value: (h: number) => usHour(h) },
      quiet: {
        title: 'Quiet hours',
        value: (start: number, end: number) => `${usHour(start)} – ${usHour(end)}`,
        text: (start: number, end: number) =>
          `Nothing between ${usHour(start)} and ${usHour(end)}. Whatever can wait arrives in the morning.`,
      },
      morningTitle: [{ text: 'CHALLENGE ' }, { text: 'TIME', dim: true }],
      morningText: 'Your daily challenge arrives at this time (your phone’s time).',
      hour: (h: number) => usHour(h),
      rows: {
        daily_challenge: { title: 'Daily challenge' },
        needs_out: { title: (pet: string) => `${pet} would like to go out`, subtitle: '1 a day at most' },
        streak_in_danger: {
          title: 'A nudge for your streak',
          subtitle: 'In the evening, 1 a day at most',
        },
        unlocked: { title: 'Item unlocked, 3 words received' },
        encounters: { title: 'New encounter, someone waved' },
        messages: { title: 'Messages' },
        your_turn: { title: 'Your turn to write', subtitle: 'In the evening, 1 a day at most' },
        link_in_danger: { title: 'A word for a link', subtitle: 'When it’s been a while' },
        trial_reminder: { title: 'End of trial', subtitle: 'Always sent, 2 days before the first payment' },
        marketing: { title: 'Minimoa+ offers', subtitle: 'One reminder at most, only if you want it' },
        first_steps: { title: 'First steps', subtitle: 'Your first 7 days, 3 ideas' },
        minimoa_news: { title: 'News from your minimoa', subtitle: 'When you’re away, your anniversaries' },
        plus_account: { title: 'Your Minimoa+ subscription', subtitle: 'Welcome, payment, end' },
      },
      permission: {
        undetermined: {
          title: 'Notifications not on yet',
          text: 'Your phone hasn’t given permission yet. Your settings are kept.',
          action: 'Turn on notifications',
        },
        denied: {
          title: 'Notifications off on this phone',
          text: 'To get them, allow them in Settings › Minimoa › Notifications. Your choices below are kept.',
          action: 'Open Settings',
        },
        web: 'No notifications on the web: they arrive on your phone.',
      },
      loadError: 'Couldn’t load your notification settings',
      saveError: 'That setting didn’t go through. Try again.',
    },
    compte: {
      title: [{ text: 'MY ' }, { text: 'ACCOUNT.', dim: true }],
      photoLabel: 'Your profile photo',
      photoHint: 'In a link, your photo stays hidden until level 4, then blurred, then sharp at level 5.',
      photoChange: 'Change photo',
      photoAdd: 'Add a photo',
      sheetTitle: [{ text: 'YOUR ' }, { text: 'PHOTO', dim: true }],
      camera: 'Take a photo',
      library: 'Choose from my library',
      accessTitle: 'Access denied',
      accessCamera: 'Minimoa can’t use the camera. Allow it in Settings › Minimoa.',
      accessLibrary: 'Minimoa can’t see your photos. Allow it in Settings › Minimoa › Photos.',
      openSettings: 'Open Settings',
      photoError: 'The photo didn’t go through. Try again.',
      photoRefusedTitle: 'Photo rejected',
      photoCheck: (provider: string | null, country: string | null): string =>
        `Before it is shown, every profile photo is checked automatically by ${provider ? `${provider}${country ? ` (${country})` : ''}, our AI provider` : 'our AI provider'}: no nudity, no one who looks underage, no violence, no hate, no ads. A rejected photo is deleted.`,
      photoCheckAccept: 'By choosing a photo, you accept this check. Details in Me › AI and you.',
      photoSaved: 'Photo saved.',
      nameLabel: 'First name',
      minimoaName: 'Your minimoa’s name',
      cityLabel: 'City',
      cityPlaceholder: 'Optional',
      emailLabel: 'Email',
      save: 'Save',
      saved: 'Saved.',
      nameError: 'Your first name can’t be empty.',
    },
    bloques: {
      title: 'BLOCKED',
      text: 'A blocked person no longer sees your minimoa and can’t write to you. Your minimoas no longer cross paths. They aren’t notified.',
      unblock: 'Unblock',
      unblockLabel: (name: string) => `Unblock ${name}`,
      empty: 'No one is blocked. And that’s just fine.',
      howTo: 'To block someone: open the link, then the menu at the top right.',
    },
    supprimer: {
      title: 'DELETE',
      heading: (pet: string) => [{ text: `${up(pet)} ` }, { text: 'LEAVES TOO.', dim: true }],
      text: 'It’s immediate and permanent: nothing can be recovered afterwards.',
      erasedTitle: 'What is erased right away',
      items: (links: number | null) => [
        {
          key: 'account',
          title: 'Your account',
          subtitle: 'First name, photo, date of birth, gender, what you’re looking for',
        },
        {
          key: 'pet',
          title: 'Your minimoa',
          subtitle: 'Its vision, its style, its items, your habits, your streak',
        },
        { key: 'place', title: 'Your location', subtitle: 'Rounded, and your area or chosen city' },
        {
          key: 'links',
          title:
            links === null
              ? 'Your links'
              : links === 0
                ? 'Your links (you don’t have any yet)'
                : links === 1
                  ? 'Your link'
                  : `Your ${links} links`,
          subtitle: 'Messages, old photos, milestones. They disappear for the others too',
        },
        {
          key: 'photos',
          title: 'Your proof and challenge photos',
          subtitle: 'And the “3 words” received, your invitations',
        },
        { key: 'settings', title: 'Your settings', subtitle: 'And permission to send you notifications' },
      ],
      keptTitle: 'What is kept, and why',
      kept: [
        { key: 'backups', title: 'Technical backups', subtitle: 'Overwritten as they rotate' },
        {
          key: 'moderation',
          title: 'Reports and moderation',
          subtitle: 'For others’ safety, detached from your account, 1 year',
        },
        {
          key: 'purchases',
          title: 'Minimoa+ purchase references',
          subtitle: 'Accounting obligations, up to 10 years',
        },
        {
          key: 'stats',
          title: 'Statistics',
          subtitle: 'Activity days for 40 days at most, then only anonymous figures',
        },
        {
          key: 'ban',
          title: 'If permanently banned',
          subtitle: 'A fingerprint of your identifier, to prevent signing up again, 3 years',
        },
      ],
      plusNote:
        'Have Minimoa+? Deleting your account doesn’t cancel the subscription. Cancel it first in your store settings.',
      details: 'Full details',
      confirmLabel: 'Type “delete” to confirm',
      confirmWord: 'delete',
      cta: 'Delete my account',
      cancel: 'Actually, no',
      error: 'Deletion didn’t go through. Try again.',
    },
    identite: {
      title: [{ text: 'WHO ' }, { text: 'YOU ARE.', dim: true }],
      intro:
        'No one else sees this answer. It helps us word things for you and, without your name, feeds our statistics.',
      genderTitle: 'You are',
      gender: {
        femme: 'A woman',
        homme: 'A man',
        non_binaire: 'Non-binary',
        non_dit: 'I’d rather not say',
      } as Record<string, string>,
      save: 'Save',
      saved: 'Saved.',
      error: 'That didn’t go through. Try again.',
      selectedA11y: (label: string) => `${label}, selected`,
    },
    minimoas: {
      title: [{ text: 'YOUR ' }, { text: 'MINIMOAS', dim: true }],
      allTitle: 'For all my chats',
      allOn: 'Turn on reading everywhere',
      allOff: 'Turn off reading everywhere',
      allDone: (n: number) =>
        n === 0 ? 'Nothing to change.' : n === 1 ? 'Done for your chat.' : `Done for your ${n} chats.`,
      allNote: 'For your current chats.',
      defaultTitle: 'For my next chats',
      defaults: {
        ask: { title: 'Ask me every time', subtitle: 'After your first few messages' },
        on: { title: 'Always turn on reading', subtitle: 'The other person still has to agree' },
        off: { title: 'Never turn on reading', subtitle: 'The minimoas only react to the pace' },
      },
      defaultA11y: (title: string, on: boolean) => (on ? `${title}, chosen` : title),
      perLink: 'Chat by chat',
      row: (name: string) => `With ${name}`,
      sub: (on: boolean | null, both: boolean, muted: boolean, theirs?: 'agreed' | 'not_yet') =>
        muted
          ? 'Minimoas muted here'
          : on === null
            ? theirs === 'agreed'
              ? 'Not chosen yet · on for them'
              : 'Not chosen yet'
            : !on
              ? 'No reading'
              : both
                ? 'Reading on, both of you'
                : 'Yes · not on for them yet',
      readA11y: (name: string) => `AI reading in the chat with ${name}`,
      empty: 'No chats yet. Your setting for next chats will apply to the first one.',
      more: 'See more',
      loadError: 'Couldn’t load your settings',
      error: 'That didn’t go through. Try again.',
    },
    position: {
      title: [{ text: 'MY ' }, { text: 'LOCATION', dim: true }],
      lead: 'Your location is used to find compatible people around you and to confirm your outings, only while the app is open. Minimoa never saves your exact location: only a point rounded to about 300 m. Others see a rounded, offset location, never live.',
      on: 'Location on',
      onSub: (date: string | null) => (date ? `Last updated on ${date}` : 'No reading yet'),
      off: 'Location off',
      offSub: 'Pick your city by hand to get encounters around it',
      zone: (km: string) => `Your area: ${km} km around your approximate home`,
      city: (name: string, active: boolean) =>
        active ? `Chosen city: ${name}` : `Chosen city: ${name} (with Minimoa+)`,
      enable: 'Turn on location',
      forget: 'Forget my location',
      forgetTitle: [{ text: 'FORGET ' }, { text: 'YOUR LOCATION?', dim: true }],
      forgetText:
        'We erase your location and your area, and withdraw your consent. No more encounters near you, until you turn it back on or pick your city by hand.',
      forgetConfirm: 'Forget my location',
      forgotten: 'Forgotten.',
      error: 'That didn’t go through. Try again.',
    },
  },
  es: {
    tab: {
      title: (name: string, pet: string) => [
        { text: up(name) },
        { text: '.\n', dim: true },
        { text: `Y ${up(pet)}.`, dim: true },
      ],
      heroLabel: (name: string, pet: string) => `${name} y ${pet}. Toca para cambiar tu nombre o tu foto.`,
      together: (n: number) =>
        n <= 1 ? 'Primer día en equipo' : `${n} ${plural(n, { one: 'día', other: 'días' })} en equipo`,
      wordsTitle: 'Descríbeme en 3 palabras',
      wordsCount: (n: number) => `${n} ${plural(n, { one: 'respuesta', other: 'respuestas' })}`,
      wordsLead: (pet: string) => `Tu gente moldea el carácter de ${pet}.`,
      wordsBadge: 'Anónimo',
      wordsShareCta: 'Compartir el enlace',
      copy: 'Copiar',
      copied: 'Copiado',
      wordsMessage: (url: string) => `Descríbeme en 3 palabras (es anónimo): ${url}`,
      stats: {
        links: (n: number) => plural(n, { one: 'vínculo', other: 'vínculos' }),
        streak: (n: number) => plural(n, { one: 'día, mejor racha', other: 'días, mejor racha' }),
      },
      plusTitle: 'MINIMOA+',
      plusCta: 'Probar',
      plusSoonCta: 'Ver',
      rows: {
        discreet: {
          title: 'Modo discreto',
          subtitle: (on: boolean) => (on ? 'Fuera del mapa' : 'Visible, ubicación redondeada'),
        },
        ia: { title: 'La IA y tú' },
        settings: { title: 'Ajustes' },
      },
      discreetError: 'El modo discreto no ha cambiado. Inténtalo de nuevo.',
      ok: 'OK',
      errorText: 'No se pudo cargar tu perfil.',
    },
    reglages: {
      title: 'AJUSTES',
      sections: { account: 'Cuenta', privacy: 'Privacidad', app: 'La app', help: 'Ayuda y legal' },
      rows: {
        account: { title: 'Mi cuenta', subtitle: (name: string) => name },
        identity: { title: 'Quién eres' },
        plus: {
          title: 'Minimoa+',
          subtitle: (member: boolean) => (member ? 'Suscripción activa' : 'Aún sin Minimoa+'),
        },
        notifications: { title: 'Notificaciones' },
        location: {
          title: 'Mi ubicación',
          subtitle: (on: boolean) => (on ? 'Activada, redondeada a unos 300 m' : 'Desactivada'),
        },
        analytics: {
          title: 'Estadísticas de uso',
          subtitle: (on: boolean) => (on ? 'Participas' : 'Desactivadas'),
        },
        blocked: {
          title: 'Personas bloqueadas',
          subtitle: (n: number | null) =>
            n === null ? ' ' : n === 0 ? 'Ninguna' : n === 1 ? '1 persona' : `${n} personas`,
        },
        language: { title: 'Idioma', subtitle: (name: string) => name },
        rules: { title: 'Normas de la comunidad' },
        safety: { title: 'Seguridad y reportes' },
        terms: { title: 'Condiciones de uso' },
        privacy: { title: 'Política de privacidad' },
        subscription: { title: 'Condiciones de Minimoa+' },
        legal: { title: 'Aviso legal' },
        help: { title: 'Soporte', subtitle: brand.supportEmail },
        signOut: { title: 'Cerrar sesión' },
        delete: { title: 'Eliminar mi cuenta' },
      },
      languageNames: {
        fr: 'Français',
        en: 'English',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
      } as Record<string, string>,
      languageTitle: 'Idioma',
      languageText:
        'Minimoa sigue el idioma de tu teléfono. Para cambiarlo, ve a Ajustes › Minimoa › Idioma (o cambia el idioma del teléfono).',
      languageWeb: 'Aquí, Minimoa sigue el idioma de tu navegador.',
      languageOpen: 'Abrir Ajustes',
      signOutConfirmTitle: '¿Cerrar sesión?',
      signOutConfirmText: 'Tu minimoa te esperará. Este teléfono dejará de recibir sus notificaciones.',
      signOutConfirm: 'Cerrar sesión',
      version: (v: string) => `Minimoa ${v}`,
    },
    notifications: {
      title: 'AVISOS',
      banner: (cap: number) =>
        `${cap} notificaciones al día como máximo, sin contar los mensajes. Varias a la vez llegan en una sola. Nada mientras estás en la app. Sin publicidad, salvo si la pides.`,
      /** Action sur la notification elle-même (appui long) : coupe sa catégorie. */
      mute: 'No recibir más de este tipo',
      reply: { action: 'Responder', send: 'Enviar', placeholder: 'Tu respuesta…' },
      sections: { pet: 'Tu minimoa', links: 'Tus vínculos', plus: 'Minimoa+' },
      morning: { title: 'Hora del reto', value: (h: number) => `${h}:00` },
      quiet: {
        title: 'Horas de calma',
        value: (start: number, end: number) => `${start}:00 – ${end}:00`,
        text: (start: number, end: number) =>
          `Nada entre las ${start}:00 y las ${end}:00. Lo que puede esperar llega por la mañana.`,
      },
      morningTitle: [{ text: 'HORA ' }, { text: 'DEL RETO', dim: true }],
      morningText: 'Tu reto del día llega a esta hora (la de tu teléfono).',
      hour: (h: number) => `${h}:00`,
      rows: {
        daily_challenge: { title: 'Reto del día' },
        needs_out: { title: (pet: string) => `A ${pet} le apetece salir`, subtitle: '1 al día como máximo' },
        streak_in_danger: { title: 'Un recordatorio de tu racha', subtitle: 'Por la noche, 1 al día como máximo' },
        unlocked: { title: 'Objeto desbloqueado, 3 palabras recibidas' },
        encounters: { title: 'Nuevo encuentro, alguien te saluda' },
        messages: { title: 'Mensajes' },
        your_turn: { title: 'Te toca escribir', subtitle: 'Por la noche, 1 al día como máximo' },
        link_in_danger: { title: 'Un mensaje para un vínculo', subtitle: 'Cuando hace un tiempo' },
        trial_reminder: {
          title: 'Fin de la prueba',
          subtitle: 'Siempre se envía, 2 días antes del primer pago',
        },
        marketing: { title: 'Ofertas de Minimoa+', subtitle: 'Un recordatorio como máximo, solo si quieres' },
        first_steps: { title: 'Primeros pasos', subtitle: 'Tus 7 primeros días, 3 ideas' },
        minimoa_news: { title: 'Noticias de tu minimoa', subtitle: 'Cuando no estás, vuestros aniversarios' },
        plus_account: { title: 'Tu suscripción a Minimoa+', subtitle: 'Bienvenida, pago, final' },
      },
      permission: {
        undetermined: {
          title: 'Notificaciones aún no activadas',
          text: 'El teléfono aún no ha dado permiso. Tus ajustes se conservan.',
          action: 'Activar las notificaciones',
        },
        denied: {
          title: 'Notificaciones desactivadas en este teléfono',
          text: 'Para recibirlas, permítelas en Ajustes › Minimoa › Notificaciones. Tus elecciones de abajo se conservan.',
          action: 'Abrir Ajustes',
        },
        web: 'En la web no hay notificaciones: llegan a tu teléfono.',
      },
      loadError: 'No se pudieron cargar tus ajustes de notificaciones',
      saveError: 'El ajuste no se ha guardado. Inténtalo de nuevo.',
    },
    compte: {
      title: [{ text: 'MI ' }, { text: 'CUENTA.', dim: true }],
      photoLabel: 'Tu foto de perfil',
      photoHint:
        'En un vínculo, tu foto queda oculta hasta el nivel 4, luego borrosa y nítida en el nivel 5.',
      photoChange: 'Cambiar la foto',
      photoAdd: 'Añadir una foto',
      sheetTitle: [{ text: 'TU ' }, { text: 'FOTO', dim: true }],
      camera: 'Sacar una foto',
      library: 'Elegir de mi galería',
      accessTitle: 'Acceso denegado',
      accessCamera: 'Minimoa no tiene acceso a la cámara. Permítelo en Ajustes › Minimoa.',
      accessLibrary: 'Minimoa no tiene acceso a tus fotos. Permítelo en Ajustes › Minimoa › Fotos.',
      openSettings: 'Abrir Ajustes',
      photoError: 'La foto no se ha subido. Inténtalo de nuevo.',
      photoRefusedTitle: 'Foto rechazada',
      photoCheck: (provider: string | null, country: string | null): string =>
        `Antes de mostrarse, cada foto de perfil la revisa automáticamente ${provider ? `${provider}${country ? ` (${country})` : ''}, nuestro proveedor de IA` : 'nuestro proveedor de IA'}: nada de desnudos, ni personas que parezcan menores, ni violencia, ni odio, ni publicidad. Una foto rechazada se borra.`,
      photoCheckAccept: 'Al elegir una foto, aceptas esta revisión. Detalles en Yo › La IA y tú.',
      photoSaved: 'Foto guardada.',
      nameLabel: 'Nombre',
      minimoaName: 'Nombre de tu minimoa',
      cityLabel: 'Ciudad',
      cityPlaceholder: 'Opcional',
      emailLabel: 'Correo',
      save: 'Guardar',
      saved: 'Guardado.',
      nameError: 'Tu nombre no puede estar vacío.',
    },
    bloques: {
      title: 'BLOQUEOS',
      text: 'Una persona bloqueada ya no ve a tu minimoa y no puede escribirte. Sus minimoas ya no se cruzan con el tuyo. No recibe ningún aviso.',
      unblock: 'Desbloquear',
      unblockLabel: (name: string) => `Desbloquear a ${name}`,
      empty: 'No has bloqueado a nadie. Y así está muy bien.',
      howTo: 'Para bloquear a alguien: abre el vínculo y luego el menú de arriba a la derecha.',
    },
    supprimer: {
      title: 'ELIMINAR',
      heading: (pet: string) => [{ text: `${up(pet)} ` }, { text: 'TAMBIÉN SE VA.', dim: true }],
      text: 'Es inmediato y definitivo: después no se puede recuperar nada.',
      erasedTitle: 'Lo que se borra al momento',
      items: (links: number | null) => [
        {
          key: 'account',
          title: 'Tu cuenta',
          subtitle: 'Nombre, foto, fecha de nacimiento, género, lo que buscas',
        },
        {
          key: 'pet',
          title: 'Tu minimoa',
          subtitle: 'Su visión, su estilo, sus objetos, tus hábitos, tu racha',
        },
        { key: 'place', title: 'Tu ubicación', subtitle: 'Redondeada, y tu zona o la ciudad elegida' },
        {
          key: 'links',
          title:
            links === null
              ? 'Tus vínculos'
              : links === 0
                ? 'Tus vínculos (aún no tienes)'
                : links === 1
                  ? 'Tu vínculo'
                  : `Tus ${links} vínculos`,
          subtitle: 'Mensajes, fotos antiguas, etapas. También desaparecen para las demás personas',
        },
        {
          key: 'photos',
          title: 'Tus fotos de prueba y de reto',
          subtitle: 'Y las «3 palabras» recibidas, tus invitaciones',
        },
        { key: 'settings', title: 'Tus ajustes', subtitle: 'Y el permiso para enviarte notificaciones' },
      ],
      keptTitle: 'Lo que se conserva, y por qué',
      kept: [
        {
          key: 'backups',
          title: 'Copias de seguridad técnicas',
          subtitle: 'Se sobrescriben a medida que rotan',
        },
        {
          key: 'moderation',
          title: 'Reportes y moderación',
          subtitle: 'Seguridad de los demás, desvinculados de tu cuenta, 1 año',
        },
        {
          key: 'purchases',
          title: 'Referencias de compras de Minimoa+',
          subtitle: 'Obligaciones contables, hasta 10 años',
        },
        {
          key: 'stats',
          title: 'Estadísticas',
          subtitle: 'Días de actividad durante 40 días como máximo, luego solo cifras anónimas',
        },
        {
          key: 'ban',
          title: 'En caso de expulsión definitiva',
          subtitle: 'Una huella de tu identificador, para impedir que vuelvas a registrarte, 3 años',
        },
      ],
      plusNote:
        '¿Tienes Minimoa+? Eliminar tu cuenta no cancela la suscripción. Cancélala antes en los ajustes de tu tienda de apps.',
      details: 'Todos los detalles',
      confirmLabel: 'Escribe «eliminar» para confirmar',
      confirmWord: 'eliminar',
      cta: 'Eliminar mi cuenta',
      cancel: 'Mejor no',
      error: 'No se pudo eliminar. Inténtalo de nuevo.',
    },
    identite: {
      title: [{ text: 'QUIÉN ' }, { text: 'ERES.', dim: true }],
      intro:
        'Nadie más ve esta respuesta. Sirve para adaptar los textos y, sin tu nombre, para nuestras estadísticas.',
      genderTitle: 'Eres',
      gender: {
        femme: 'Una mujer',
        homme: 'Un hombre',
        non_binaire: 'Persona no binaria',
        non_dit: 'Prefiero no decirlo',
      } as Record<string, string>,
      save: 'Guardar',
      saved: 'Guardado.',
      error: 'No se ha guardado. Inténtalo de nuevo.',
      selectedA11y: (label: string) => `${label}, seleccionado`,
    },
    minimoas: {
      title: [{ text: 'TUS ' }, { text: 'MINIMOAS', dim: true }],
      allTitle: 'Para todos mis chats',
      allOn: 'Activar la lectura en todos',
      allOff: 'Desactivar la lectura en todos',
      allDone: (n: number) =>
        n === 0 ? 'Nada que cambiar.' : n === 1 ? 'Hecho en tu chat.' : `Hecho en tus ${n} chats.`,
      allNote: 'Para tus chats actuales.',
      defaultTitle: 'Para mis próximos chats',
      defaults: {
        ask: { title: 'Preguntarme cada vez', subtitle: 'Después de vuestros primeros mensajes' },
        on: { title: 'Activar siempre la lectura', subtitle: 'Aún hace falta que la otra persona acepte' },
        off: { title: 'No activar nunca la lectura', subtitle: 'Los minimoas solo reaccionan al ritmo' },
      },
      defaultA11y: (title: string, on: boolean) => (on ? `${title}, elegido` : title),
      perLink: 'Chat por chat',
      row: (name: string) => `Con ${name}`,
      sub: (on: boolean | null, both: boolean, muted: boolean, theirs?: 'agreed' | 'not_yet') =>
        muted
          ? 'Minimoas silenciados aquí'
          : on === null
            ? theirs === 'agreed'
              ? 'Aún sin elegir · activada por su parte'
              : 'Aún sin elegir'
            : !on
              ? 'Sin lectura'
              : both
                ? 'Lectura activada, por ambas partes'
                : 'Sí · aún no activada por su parte',
      readA11y: (name: string) => `Lectura por una IA en el chat con ${name}`,
      empty: 'Aún no tienes chats. Tu ajuste para los próximos chats se aplicará al primero.',
      more: 'Ver más',
      loadError: 'No se pudieron cargar tus ajustes',
      error: 'No se ha guardado. Inténtalo de nuevo.',
    },
    position: {
      title: [{ text: 'MI ' }, { text: 'UBICACIÓN', dim: true }],
      lead: 'Tu ubicación sirve para encontrar gente compatible a tu alrededor y para confirmar tus salidas, solo con la app abierta. Minimoa nunca guarda tu ubicación exacta: solo un punto redondeado a unos 300 m. Los demás ven una ubicación redondeada y desplazada, nunca en directo.',
      on: 'Ubicación activada',
      onSub: (date: string | null) => (date ? `Última lectura el ${date}` : 'Aún sin lectura'),
      off: 'Ubicación desactivada',
      offSub: 'Elige tu ciudad a mano para tener encuentros cerca',
      zone: (km: string) => `Tu zona: ${km} km alrededor de tu domicilio aproximado`,
      city: (name: string, active: boolean) =>
        active ? `Ciudad elegida: ${name}` : `Ciudad elegida: ${name} (con Minimoa+)`,
      enable: 'Activar la ubicación',
      forget: 'Olvidar mi ubicación',
      forgetTitle: [{ text: '¿OLVIDAR ' }, { text: 'TU UBICACIÓN?', dim: true }],
      forgetText:
        'Borramos tu ubicación y tu zona, y retiramos tu consentimiento. No más encuentros cerca de ti, hasta que la vuelvas a activar o elijas tu ciudad a mano.',
      forgetConfirm: 'Olvidar mi ubicación',
      forgotten: 'Olvidada.',
      error: 'No se ha guardado. Inténtalo de nuevo.',
    },
  },
  pt: {
    tab: {
      title: (name: string, pet: string) => [
        { text: up(name) },
        { text: '.\n', dim: true },
        { text: `E ${up(pet)}.`, dim: true },
      ],
      heroLabel: (name: string, pet: string) => `${name} e ${pet}. Toque para trocar seu nome ou sua foto.`,
      together: (n: number) =>
        n <= 1 ? 'Primeiro dia em equipe' : `${n} ${plural(n, { one: 'dia', other: 'dias' })} em equipe`,
      wordsTitle: 'Me descreva em 3 palavras',
      wordsCount: (n: number) => `${n} ${plural(n, { one: 'resposta', other: 'respostas' })}`,
      wordsLead: (pet: string) => `Sua galera molda a personalidade de ${pet}.`,
      wordsBadge: 'Anônimo',
      wordsShareCta: 'Compartilhar o link',
      copy: 'Copiar',
      copied: 'Copiado',
      wordsMessage: (url: string) => `Me descreva em 3 palavras (é anônimo): ${url}`,
      stats: {
        links: (n: number) => plural(n, { one: 'vínculo', other: 'vínculos' }),
        streak: (n: number) => plural(n, { one: 'dia, melhor sequência', other: 'dias, melhor sequência' }),
      },
      plusTitle: 'MINIMOA+',
      plusCta: 'Testar',
      plusSoonCta: 'Ver',
      rows: {
        discreet: {
          title: 'Modo discreto',
          subtitle: (on: boolean) => (on ? 'Fora do mapa' : 'Visível, localização arredondada'),
        },
        ia: { title: 'A IA e você' },
        settings: { title: 'Ajustes' },
      },
      discreetError: 'O modo discreto não mudou. Tente de novo.',
      ok: 'OK',
      errorText: 'Não foi possível carregar seu perfil.',
    },
    reglages: {
      title: 'AJUSTES',
      sections: { account: 'Conta', privacy: 'Privacidade', app: 'O app', help: 'Ajuda e jurídico' },
      rows: {
        account: { title: 'Minha conta', subtitle: (name: string) => name },
        identity: { title: 'Quem você é' },
        plus: {
          title: 'Minimoa+',
          subtitle: (member: boolean) => (member ? 'Assinatura ativa' : 'Ainda sem Minimoa+'),
        },
        notifications: { title: 'Notificações' },
        location: {
          title: 'Minha localização',
          subtitle: (on: boolean) => (on ? 'Ativada, arredondada para cerca de 300 m' : 'Desativada'),
        },
        analytics: {
          title: 'Estatísticas de uso',
          subtitle: (on: boolean) => (on ? 'Você participa' : 'Desativadas'),
        },
        blocked: {
          title: 'Pessoas bloqueadas',
          subtitle: (n: number | null) =>
            n === null ? ' ' : n === 0 ? 'Ninguém' : n === 1 ? '1 pessoa' : `${n} pessoas`,
        },
        language: { title: 'Idioma', subtitle: (name: string) => name },
        rules: { title: 'Regras da comunidade' },
        safety: { title: 'Segurança e denúncias' },
        terms: { title: 'Termos de uso' },
        privacy: { title: 'Política de privacidade' },
        subscription: { title: 'Termos do Minimoa+' },
        legal: { title: 'Informações legais' },
        help: { title: 'Suporte', subtitle: brand.supportEmail },
        signOut: { title: 'Sair' },
        delete: { title: 'Excluir minha conta' },
      },
      languageNames: {
        fr: 'Français',
        en: 'English',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
      } as Record<string, string>,
      languageTitle: 'Idioma',
      languageText:
        'O Minimoa segue o idioma do seu celular. Para mudar, vá em Ajustes › Minimoa › Idioma (ou mude o idioma do celular).',
      languageWeb: 'Aqui, o Minimoa segue o idioma do seu navegador.',
      languageOpen: 'Abrir Ajustes',
      signOutConfirmTitle: 'Sair?',
      signOutConfirmText:
        'Seu minimoa vai te esperar. Este celular não vai mais receber as notificações dele.',
      signOutConfirm: 'Sair',
      version: (v: string) => `Minimoa ${v}`,
    },
    notifications: {
      title: 'AVISOS',
      banner: (cap: number) =>
        `No máximo ${cap} notificações por dia, fora as mensagens. Várias ao mesmo tempo chegam como uma só. Nada enquanto você está no app. Sem anúncios, a não ser que você peça.`,
      /** Action sur la notification elle-même (appui long) : coupe sa catégorie. */
      mute: 'Não receber mais deste tipo',
      reply: { action: 'Responder', send: 'Enviar', placeholder: 'Sua resposta…' },
      sections: { pet: 'Seu minimoa', links: 'Seus vínculos', plus: 'Minimoa+' },
      morning: { title: 'Hora do desafio', value: (h: number) => `${h}h` },
      quiet: {
        title: 'Horas de silêncio',
        value: (start: number, end: number) => `${start}h – ${end}h`,
        text: (start: number, end: number) =>
          `Nada entre ${start}h e ${end}h. O que pode esperar chega de manhã.`,
      },
      morningTitle: [{ text: 'HORA ' }, { text: 'DO DESAFIO', dim: true }],
      morningText: 'Seu desafio do dia chega neste horário (o do seu celular).',
      hour: (h: number) => `${h}h`,
      rows: {
        daily_challenge: { title: 'Desafio do dia' },
        needs_out: { title: (pet: string) => `${pet} quer tomar um ar`, subtitle: 'No máximo 1 por dia' },
        streak_in_danger: { title: 'Um lembrete da sua sequência', subtitle: 'À noite, no máximo 1 por dia' },
        unlocked: { title: 'Item desbloqueado, 3 palavras recebidas' },
        encounters: { title: 'Novo encontro, alguém acenou' },
        messages: { title: 'Mensagens' },
        your_turn: { title: 'Sua vez de escrever', subtitle: 'À noite, no máximo 1 por dia' },
        link_in_danger: { title: 'Uma mensagem para um vínculo', subtitle: 'Quando faz um tempo' },
        trial_reminder: {
          title: 'Fim do teste gratuito',
          subtitle: 'Sempre enviado, 2 dias antes da primeira cobrança',
        },
        marketing: { title: 'Ofertas do Minimoa+', subtitle: 'No máximo um lembrete, só se você quiser' },
        first_steps: { title: 'Primeiros passos', subtitle: 'Seus 7 primeiros dias, 3 ideias' },
        minimoa_news: {
          title: 'Notícias do seu minimoa',
          subtitle: 'Quando você some, os aniversários de vocês',
        },
        plus_account: { title: 'Sua assinatura do Minimoa+', subtitle: 'Boas-vindas, pagamento, fim' },
      },
      permission: {
        undetermined: {
          title: 'Notificações ainda não ativadas',
          text: 'O celular ainda não deu permissão. Seus ajustes ficam guardados.',
          action: 'Ativar notificações',
        },
        denied: {
          title: 'Notificações desativadas neste celular',
          text: 'Para recebê-las, permita em Ajustes › Minimoa › Notificações. Suas escolhas abaixo ficam guardadas.',
          action: 'Abrir Ajustes',
        },
        web: 'Na web não há notificações: elas chegam no seu celular.',
      },
      loadError: 'Não foi possível carregar seus ajustes de notificação',
      saveError: 'O ajuste não foi salvo. Tente de novo.',
    },
    compte: {
      title: [{ text: 'MINHA ' }, { text: 'CONTA.', dim: true }],
      photoLabel: 'Sua foto de perfil',
      photoHint: 'Num vínculo, sua foto fica escondida até o nível 4, depois desfocada, e nítida no nível 5.',
      photoChange: 'Trocar a foto',
      photoAdd: 'Adicionar uma foto',
      sheetTitle: [{ text: 'SUA ' }, { text: 'FOTO', dim: true }],
      camera: 'Tirar uma foto',
      library: 'Escolher na galeria',
      accessTitle: 'Acesso negado',
      accessCamera: 'O Minimoa não tem acesso à câmera. Permita em Ajustes › Minimoa.',
      accessLibrary: 'O Minimoa não tem acesso às suas fotos. Permita em Ajustes › Minimoa › Fotos.',
      openSettings: 'Abrir Ajustes',
      photoError: 'A foto não foi enviada. Tente de novo.',
      photoRefusedTitle: 'Foto recusada',
      photoCheck: (provider: string | null, country: string | null): string =>
        `Antes de ser exibida, cada foto de perfil é verificada automaticamente por ${provider ? `${provider}${country ? ` (${country})` : ''}, nosso fornecedor de IA` : 'nosso fornecedor de IA'}: nada de nudez, de pessoa que pareça menor de idade, de violência, de ódio ou de propaganda. Uma foto recusada é apagada.`,
      photoCheckAccept: 'Ao escolher uma foto, você aceita essa verificação. Detalhes em Eu › A IA e você.',
      photoSaved: 'Foto salva.',
      nameLabel: 'Nome',
      minimoaName: 'Nome do teu minimoa',
      cityLabel: 'Cidade',
      cityPlaceholder: 'Opcional',
      emailLabel: 'E-mail',
      save: 'Salvar',
      saved: 'Salvo.',
      nameError: 'Seu nome não pode ficar vazio.',
    },
    bloques: {
      title: 'BLOQUEIOS',
      text: 'Uma pessoa bloqueada não vê mais seu minimoa e não pode mais te escrever. Os minimoas de vocês não se cruzam mais. Ela não é avisada.',
      unblock: 'Desbloquear',
      unblockLabel: (name: string) => `Desbloquear ${name}`,
      empty: 'Você não bloqueou ninguém. E está ótimo assim.',
      howTo: 'Para bloquear alguém: abra o vínculo e depois o menu no canto superior direito.',
    },
    supprimer: {
      title: 'EXCLUIR',
      heading: (pet: string) => [{ text: `${up(pet)} ` }, { text: 'VAI EMBORA TAMBÉM.', dim: true }],
      text: 'É imediato e definitivo: depois não dá para recuperar nada.',
      erasedTitle: 'O que é apagado na hora',
      items: (links: number | null) => [
        {
          key: 'account',
          title: 'Sua conta',
          subtitle: 'Nome, foto, data de nascimento, gênero, o que você procura',
        },
        {
          key: 'pet',
          title: 'Seu minimoa',
          subtitle: 'A visão, o estilo e os itens dele, seus hábitos, sua sequência',
        },
        { key: 'place', title: 'Sua localização', subtitle: 'Arredondada, e sua área ou a cidade escolhida' },
        {
          key: 'links',
          title:
            links === null
              ? 'Seus vínculos'
              : links === 0
                ? 'Seus vínculos (você ainda não tem)'
                : links === 1
                  ? 'Seu vínculo'
                  : `Seus ${links} vínculos`,
          subtitle: 'Mensagens, fotos antigas, etapas. Também somem para as outras pessoas',
        },
        {
          key: 'photos',
          title: 'Suas fotos de prova e de desafio',
          subtitle: 'E as “3 palavras” recebidas, seus convites',
        },
        { key: 'settings', title: 'Seus ajustes', subtitle: 'E a permissão para te enviar notificações' },
      ],
      keptTitle: 'O que é mantido, e por quê',
      kept: [
        { key: 'backups', title: 'Backups técnicos', subtitle: 'Sobrescritos conforme o rodízio' },
        {
          key: 'moderation',
          title: 'Denúncias e moderação',
          subtitle: 'Segurança das outras pessoas, desvinculadas da sua conta, 1 ano',
        },
        {
          key: 'purchases',
          title: 'Referências das compras do Minimoa+',
          subtitle: 'Obrigações contábeis, até 10 anos',
        },
        {
          key: 'stats',
          title: 'Estatísticas',
          subtitle: 'Dias de atividade por no máximo 40 dias, depois só números anônimos',
        },
        {
          key: 'ban',
          title: 'Em caso de banimento definitivo',
          subtitle: 'Uma impressão digital do seu identificador, para impedir um novo cadastro, 3 anos',
        },
      ],
      plusNote:
        'Tem Minimoa+? Excluir sua conta não cancela a assinatura. Cancele antes nos ajustes da sua loja de apps.',
      details: 'Todos os detalhes',
      confirmLabel: 'Digite “excluir” para confirmar',
      confirmWord: 'excluir',
      cta: 'Excluir minha conta',
      cancel: 'Melhor não',
      error: 'Não foi possível excluir. Tente de novo.',
    },
    identite: {
      title: [{ text: 'QUEM ' }, { text: 'VOCÊ É.', dim: true }],
      intro:
        'Ninguém mais vê esta resposta. Ela serve para ajustar os textos e, sem o seu nome, para as nossas estatísticas.',
      genderTitle: 'Você é',
      gender: {
        femme: 'Uma mulher',
        homme: 'Um homem',
        non_binaire: 'Pessoa não binária',
        non_dit: 'Prefiro não dizer',
      } as Record<string, string>,
      save: 'Salvar',
      saved: 'Salvo.',
      error: 'Não deu certo. Tente de novo.',
      selectedA11y: (label: string) => `${label}, selecionado`,
    },
    minimoas: {
      title: [{ text: 'SEUS ' }, { text: 'MINIMOAS', dim: true }],
      allTitle: 'Para todos os meus chats',
      allOn: 'Ativar a leitura em todos',
      allOff: 'Desativar a leitura em todos',
      allDone: (n: number) =>
        n === 0 ? 'Nada para mudar.' : n === 1 ? 'Feito no seu chat.' : `Feito nos seus ${n} chats.`,
      allNote: 'Para seus chats atuais.',
      defaultTitle: 'Para meus próximos chats',
      defaults: {
        ask: { title: 'Perguntar toda vez', subtitle: 'Depois das primeiras mensagens' },
        on: { title: 'Sempre ativar a leitura', subtitle: 'A outra pessoa ainda precisa aceitar' },
        off: { title: 'Nunca ativar a leitura', subtitle: 'Os minimoas só reagem ao ritmo' },
      },
      defaultA11y: (title: string, on: boolean) => (on ? `${title}, escolhido` : title),
      perLink: 'Chat por chat',
      row: (name: string) => `Com ${name}`,
      sub: (on: boolean | null, both: boolean, muted: boolean, theirs?: 'agreed' | 'not_yet') =>
        muted
          ? 'Minimoas silenciados aqui'
          : on === null
            ? theirs === 'agreed'
              ? 'Ainda não escolhido · ativada do outro lado'
              : 'Ainda não escolhido'
            : !on
              ? 'Sem leitura'
              : both
                ? 'Leitura ativada, para os dois lados'
                : 'Sim · ainda não ativada do outro lado',
      readA11y: (name: string) => `Leitura por uma IA no chat com ${name}`,
      empty: 'Ainda não há chats. Seu ajuste para os próximos chats vai valer para o primeiro.',
      more: 'Ver mais',
      loadError: 'Não foi possível carregar seus ajustes',
      error: 'Não deu certo. Tente de novo.',
    },
    position: {
      title: [{ text: 'MINHA ' }, { text: 'LOCALIZAÇÃO', dim: true }],
      lead: 'Sua localização serve para encontrar pessoas compatíveis perto de você e confirmar suas saídas, só com o app aberto. O Minimoa nunca salva sua localização exata: só um ponto arredondado para cerca de 300 m. As outras pessoas veem uma localização arredondada e deslocada, nunca ao vivo.',
      on: 'Localização ativada',
      onSub: (date: string | null) => (date ? `Última leitura em ${date}` : 'Nenhuma leitura ainda'),
      off: 'Localização desativada',
      offSub: 'Escolha sua cidade manualmente para ter encontros por perto',
      zone: (km: string) => `Sua área: ${km} km ao redor da sua casa aproximada`,
      city: (name: string, active: boolean) =>
        active ? `Cidade escolhida: ${name}` : `Cidade escolhida: ${name} (com Minimoa+)`,
      enable: 'Ativar a localização',
      forget: 'Esquecer minha localização',
      forgetTitle: [{ text: 'ESQUECER ' }, { text: 'SUA LOCALIZAÇÃO?', dim: true }],
      forgetText:
        'Apagamos sua localização e sua área, e retiramos seu consentimento. Sem encontros perto de você, até você ativá-la de novo ou escolher sua cidade manualmente.',
      forgetConfirm: 'Esquecer minha localização',
      forgotten: 'Esquecida.',
      error: 'Não deu certo. Tente de novo.',
    },
  },
  nl: {
    tab: {
      title: (name: string, pet: string) => [
        { text: up(name) },
        { text: '.\n', dim: true },
        { text: `EN ${up(pet)}.`, dim: true },
      ],
      heroLabel: (name: string, pet: string) => `${name} en ${pet}. Tik om je naam of foto te wijzigen.`,
      together: (n: number) =>
        n <= 1 ? 'Eerste dag samen' : `${n} ${plural(n, { one: 'dag', other: 'dagen' })} samen`,
      wordsTitle: 'Beschrijf me in 3 woorden',
      wordsCount: (n: number) => `${n} ${plural(n, { one: 'antwoord', other: 'antwoorden' })}`,
      wordsLead: (pet: string) => `Je vrienden vormen het karakter van ${pet}.`,
      wordsBadge: 'Anoniem',
      wordsShareCta: 'Link delen',
      copy: 'Kopiëren',
      copied: 'Gekopieerd',
      wordsMessage: (url: string) => `Beschrijf me in 3 woorden (het is anoniem): ${url}`,
      stats: {
        links: (n: number) => plural(n, { one: 'band', other: 'banden' }),
        streak: (n: number) => plural(n, { one: 'dag, beste reeks', other: 'dagen, beste reeks' }),
      },
      plusTitle: 'MINIMOA+',
      plusCta: 'Proberen',
      plusSoonCta: 'Bekijken',
      rows: {
        discreet: {
          title: 'Discrete modus',
          subtitle: (on: boolean) => (on ? 'Niet op de kaart' : 'Zichtbaar, locatie afgerond'),
        },
        ia: { title: 'AI en jij' },
        settings: { title: 'Instellingen' },
      },
      discreetError: 'Discrete modus is niet gewijzigd. Probeer het opnieuw.',
      ok: 'OK',
      errorText: 'Je profiel kon niet worden geladen.',
    },
    reglages: {
      title: 'INSTELLINGEN',
      sections: { account: 'Account', privacy: 'Privacy', app: 'De app', help: 'Hulp en juridisch' },
      rows: {
        account: { title: 'Mijn account', subtitle: (name: string) => name },
        identity: { title: 'Wie je bent' },
        plus: {
          title: 'Minimoa+',
          subtitle: (member: boolean) => (member ? 'Abonnement actief' : 'Nog geen Minimoa+'),
        },
        notifications: { title: 'Meldingen' },
        location: {
          title: 'Mijn locatie',
          subtitle: (on: boolean) => (on ? 'Aan, afgerond op ongeveer 300 m' : 'Uit'),
        },
        analytics: { title: 'Gebruiksstatistieken', subtitle: (on: boolean) => (on ? 'Je doet mee' : 'Uit') },
        blocked: {
          title: 'Geblokkeerde personen',
          subtitle: (n: number | null) =>
            n === null ? ' ' : n === 0 ? 'Niemand' : n === 1 ? '1 persoon' : `${n} personen`,
        },
        language: { title: 'Taal', subtitle: (name: string) => name },
        rules: { title: 'Communityregels' },
        safety: { title: 'Veiligheid en melden' },
        terms: { title: 'Gebruiksvoorwaarden' },
        privacy: { title: 'Privacybeleid' },
        subscription: { title: 'Voorwaarden van Minimoa+' },
        legal: { title: 'Juridische informatie' },
        help: { title: 'Support', subtitle: brand.supportEmail },
        signOut: { title: 'Uitloggen' },
        delete: { title: 'Mijn account verwijderen' },
      },
      languageNames: {
        fr: 'Français',
        en: 'English',
        es: 'Español',
        pt: 'Português',
        nl: 'Nederlands',
      } as Record<string, string>,
      languageTitle: 'Taal',
      languageText:
        'Minimoa volgt de taal van je telefoon. Wil je die wijzigen, ga dan naar Instellingen › Minimoa › Taal (of wijzig de taal van je telefoon).',
      languageWeb: 'Hier volgt Minimoa de taal van je browser.',
      languageOpen: 'Instellingen openen',
      signOutConfirmTitle: 'Uitloggen?',
      signOutConfirmText: 'Je minimoa wacht op je. Deze telefoon krijgt zijn meldingen niet meer.',
      signOutConfirm: 'Uitloggen',
      version: (v: string) => `Minimoa ${v}`,
    },
    notifications: {
      title: 'MELDINGEN',
      banner: (cap: number) =>
        `Hooguit ${cap} meldingen per dag, berichten niet meegeteld. Meerdere tegelijk komen als één. Niets terwijl je in de app bent. Geen reclame, tenzij je erom vraagt.`,
      /** Action sur la notification elle-même (appui long) : coupe sa catégorie. */
      mute: 'Dit soort niet meer ontvangen',
      reply: { action: 'Antwoorden', send: 'Versturen', placeholder: 'Je antwoord…' },
      sections: { pet: 'Je minimoa', links: 'Je banden', plus: 'Minimoa+' },
      morning: { title: 'Tijd van de uitdaging', value: (h: number) => `${h}:00` },
      quiet: {
        title: 'Rustige uren',
        value: (start: number, end: number) => `${start}:00 – ${end}:00`,
        text: (start: number, end: number) =>
          `Niets tussen ${start}:00 en ${end}:00. Wat kan wachten, komt ’s ochtends.`,
      },
      morningTitle: [{ text: 'TIJD VAN ' }, { text: 'DE UITDAGING', dim: true }],
      morningText: 'Je uitdaging van de dag komt op dit tijdstip (tijd van je telefoon).',
      hour: (h: number) => `${h}:00`,
      rows: {
        daily_challenge: { title: 'Uitdaging van de dag' },
        needs_out: { title: (pet: string) => `${pet} wil graag naar buiten`, subtitle: 'Hooguit 1 per dag' },
        streak_in_danger: {
          title: 'Een zetje voor je reeks',
          subtitle: '’s Avonds, hooguit 1 per dag',
        },
        unlocked: { title: 'Item ontgrendeld, 3 woorden ontvangen' },
        encounters: { title: 'Nieuwe ontmoeting, iemand zwaait' },
        messages: { title: 'Berichten' },
        your_turn: { title: 'Jouw beurt om te schrijven', subtitle: '’s Avonds, hooguit 1 per dag' },
        link_in_danger: { title: 'Een berichtje voor een band', subtitle: 'Als het even geleden is' },
        trial_reminder: {
          title: 'Einde van de proefperiode',
          subtitle: 'Altijd verstuurd, 2 dagen voor de eerste betaling',
        },
        marketing: {
          title: 'Minimoa+-aanbiedingen',
          subtitle: 'Hooguit één herinnering, alleen als je dat wilt',
        },
        first_steps: { title: 'Eerste stappen', subtitle: 'Je eerste 7 dagen, 3 ideeën' },
        minimoa_news: { title: 'Nieuws van je minimoa', subtitle: 'Als je weg bent, jullie verjaardagen' },
        plus_account: { title: 'Je Minimoa+-abonnement', subtitle: 'Welkom, betaling, einde' },
      },
      permission: {
        undetermined: {
          title: 'Meldingen nog niet aan',
          text: 'Je telefoon heeft nog geen toestemming gegeven. Je instellingen blijven bewaard.',
          action: 'Meldingen aanzetten',
        },
        denied: {
          title: 'Meldingen uit op deze telefoon',
          text: 'Sta ze toe via Instellingen › Minimoa › Meldingen om ze te krijgen. Je keuzes hieronder blijven bewaard.',
          action: 'Instellingen openen',
        },
        web: 'Op het web zijn er geen meldingen: die komen op je telefoon.',
      },
      loadError: 'Je meldingsinstellingen konden niet worden geladen',
      saveError: 'De instelling is niet opgeslagen. Probeer het opnieuw.',
    },
    compte: {
      title: [{ text: 'MIJN ' }, { text: 'ACCOUNT.', dim: true }],
      photoLabel: 'Je profielfoto',
      photoHint: 'In een band blijft je foto verborgen tot niveau 4, daarna wazig, en scherp vanaf niveau 5.',
      photoChange: 'Foto wijzigen',
      photoAdd: 'Foto toevoegen',
      sheetTitle: [{ text: 'JE ' }, { text: 'FOTO', dim: true }],
      camera: 'Foto maken',
      library: 'Kiezen uit mijn fotobibliotheek',
      accessTitle: 'Geen toegang',
      accessCamera: 'Minimoa heeft geen toegang tot de camera. Sta het toe in Instellingen › Minimoa.',
      accessLibrary:
        'Minimoa heeft geen toegang tot je foto’s. Sta het toe in Instellingen › Minimoa › Foto’s.',
      openSettings: 'Open Instellingen',
      photoError: 'De foto is niet gelukt. Probeer het opnieuw.',
      photoRefusedTitle: 'Foto geweigerd',
      photoCheck: (provider: string | null, country: string | null): string =>
        `Voordat hij wordt getoond, wordt elke profielfoto automatisch gecontroleerd door ${provider ? `${provider}${country ? ` (${country})` : ''}, onze AI-leverancier` : 'onze AI-leverancier'}: geen naakt, niemand die minderjarig lijkt, geen geweld, geen haat, geen reclame. Een geweigerde foto wordt gewist.`,
      photoCheckAccept:
        'Door een foto te kiezen, ga je akkoord met deze controle. Details onder Ik › AI en jij.',
      photoSaved: 'Foto opgeslagen.',
      nameLabel: 'Voornaam',
      minimoaName: 'Naam van je minimoa',
      cityLabel: 'Stad',
      cityPlaceholder: 'Optioneel',
      emailLabel: 'E-mail',
      save: 'Opslaan',
      saved: 'Opgeslagen.',
      nameError: 'Je voornaam mag niet leeg zijn.',
    },
    bloques: {
      title: 'GEBLOKKEERD',
      text: 'Iemand die je hebt geblokkeerd, ziet je minimoa niet meer en kan je geen berichten meer sturen. Jullie minimoas komen elkaar niet meer tegen. Die persoon krijgt geen melding.',
      unblock: 'Deblokkeren',
      unblockLabel: (name: string) => `${name} deblokkeren`,
      empty: 'Niemand geblokkeerd. En dat is prima zo.',
      howTo: 'Iemand blokkeren: open de band en dan het menu rechtsboven.',
    },
    supprimer: {
      title: 'VERWIJDEREN',
      heading: (pet: string) => [{ text: `${up(pet)} ` }, { text: 'GAAT OOK WEG.', dim: true }],
      text: 'Het gebeurt meteen en is definitief: daarna valt er niets meer terug te halen.',
      erasedTitle: 'Wat meteen wordt gewist',
      items: (links: number | null) => [
        {
          key: 'account',
          title: 'Je account',
          subtitle: 'Voornaam, foto, geboortedatum, geslacht, wat je zoekt',
        },
        {
          key: 'pet',
          title: 'Je minimoa',
          subtitle: 'Zijn visie, zijn stijl, zijn items, je gewoontes, je reeks',
        },
        { key: 'place', title: 'Je locatie', subtitle: 'Afgerond, en je gebied of gekozen stad' },
        {
          key: 'links',
          title:
            links === null
              ? 'Je banden'
              : links === 0
                ? 'Je banden (je hebt er nog geen)'
                : links === 1
                  ? 'Je band'
                  : `Je ${links} banden`,
          subtitle: 'Berichten, oude foto’s, mijlpalen. Ze verdwijnen ook voor de anderen',
        },
        {
          key: 'photos',
          title: 'Je bewijs- en uitdagingsfoto’s',
          subtitle: 'En de ontvangen “3 woorden”, je uitnodigingen',
        },
        {
          key: 'settings',
          title: 'Je instellingen',
          subtitle: 'En de toestemming om je meldingen te sturen',
        },
      ],
      keptTitle: 'Wat bewaard blijft, en waarom',
      kept: [
        { key: 'backups', title: 'Technische back-ups', subtitle: 'Worden gaandeweg overschreven' },
        {
          key: 'moderation',
          title: 'Meldingen en moderatie',
          subtitle: 'Voor de veiligheid van anderen, losgekoppeld van je account, 1 jaar',
        },
        {
          key: 'purchases',
          title: 'Referenties van Minimoa+-aankopen',
          subtitle: 'Boekhoudkundige verplichtingen, tot 10 jaar',
        },
        {
          key: 'stats',
          title: 'Statistieken',
          subtitle: 'Activiteitsdagen hooguit 40 dagen, daarna alleen anonieme cijfers',
        },
        {
          key: 'ban',
          title: 'Bij een definitieve uitsluiting',
          subtitle: 'Een vingerafdruk van je ID, om opnieuw aanmelden te voorkomen, 3 jaar',
        },
      ],
      plusNote:
        'Heb je Minimoa+? Je account verwijderen zegt je abonnement niet op. Zeg het eerst op in de instellingen van je store.',
      details: 'Alle details',
      confirmLabel: 'Typ “verwijderen” om te bevestigen',
      confirmWord: 'verwijderen',
      cta: 'Mijn account verwijderen',
      cancel: 'Toch maar niet',
      error: 'Verwijderen is niet gelukt. Probeer het opnieuw.',
    },
    identite: {
      title: [{ text: 'WIE ' }, { text: 'JE BENT.', dim: true }],
      intro:
        'Niemand anders ziet dit antwoord. Het helpt ons de teksten goed te formuleren en, zonder je naam, voor onze statistieken.',
      genderTitle: 'Je bent',
      gender: {
        femme: 'Een vrouw',
        homme: 'Een man',
        non_binaire: 'Non-binair',
        non_dit: 'Zeg ik liever niet',
      } as Record<string, string>,
      save: 'Opslaan',
      saved: 'Opgeslagen.',
      error: 'Dat is niet gelukt. Probeer het opnieuw.',
      selectedA11y: (label: string) => `${label}, geselecteerd`,
    },
    minimoas: {
      title: [{ text: 'JE ' }, { text: 'MINIMOAS', dim: true }],
      allTitle: 'Voor al mijn chats',
      allOn: 'Overal meelezen aanzetten',
      allOff: 'Overal meelezen uitzetten',
      allDone: (n: number) =>
        n === 0 ? 'Niets te wijzigen.' : n === 1 ? 'Gedaan voor je chat.' : `Gedaan voor je ${n} chats.`,
      allNote: 'Voor je huidige chats.',
      defaultTitle: 'Voor mijn volgende chats',
      defaults: {
        ask: { title: 'Elke keer vragen', subtitle: 'Na jullie eerste berichten' },
        on: { title: 'Meelezen altijd aanzetten', subtitle: 'De ander moet nog wel akkoord gaan' },
        off: { title: 'Meelezen nooit aanzetten', subtitle: 'De minimoas reageren alleen op het ritme' },
      },
      defaultA11y: (title: string, on: boolean) => (on ? `${title}, gekozen` : title),
      perLink: 'Per chat',
      row: (name: string) => `Met ${name}`,
      sub: (on: boolean | null, both: boolean, muted: boolean, theirs?: 'agreed' | 'not_yet') =>
        muted
          ? 'Minimoas hier gedempt'
          : on === null
            ? theirs === 'agreed'
              ? 'Nog niet gekozen · aan bij de ander'
              : 'Nog niet gekozen'
            : !on
              ? 'Geen meelezen'
              : both
                ? 'Meelezen aan, bij jullie allebei'
                : 'Ja · nog niet aan bij de ander',
      readA11y: (name: string) => `Lezen door AI in de chat met ${name}`,
      empty: 'Nog geen chats. Je instelling voor volgende chats geldt voor de eerste.',
      more: 'Meer bekijken',
      loadError: 'Je instellingen konden niet worden geladen',
      error: 'Dat is niet gelukt. Probeer het opnieuw.',
    },
    position: {
      title: [{ text: 'MIJN ' }, { text: 'LOCATIE', dim: true }],
      lead: 'Je locatie wordt gebruikt om compatibele mensen om je heen te vinden en je uitjes te bevestigen, alleen als de app open is. Minimoa slaat nooit je exacte locatie op: alleen een punt afgerond op ongeveer 300 m. Anderen zien een afgeronde en verschoven locatie, nooit live.',
      on: 'Locatie aan',
      onSub: (date: string | null) => (date ? `Laatst bepaald op ${date}` : 'Nog niet bepaald'),
      off: 'Locatie uit',
      offSub: 'Kies zelf je stad om ontmoetingen in de buurt te krijgen',
      zone: (km: string) => `Je gebied: ${km} km rond je geschatte woonplek`,
      city: (name: string, active: boolean) =>
        active ? `Gekozen stad: ${name}` : `Gekozen stad: ${name} (met Minimoa+)`,
      enable: 'Locatie aanzetten',
      forget: 'Mijn locatie vergeten',
      forgetTitle: [{ text: 'JE LOCATIE ' }, { text: 'VERGETEN?', dim: true }],
      forgetText:
        'We wissen je locatie en je gebied, en trekken je toestemming in. Geen ontmoetingen meer bij jou in de buurt, tot je hem weer aanzet of zelf je stad kiest.',
      forgetConfirm: 'Mijn locatie vergeten',
      forgotten: 'Vergeten.',
      error: 'Dat is niet gelukt. Probeer het opnieuw.',
    },
  },
});
