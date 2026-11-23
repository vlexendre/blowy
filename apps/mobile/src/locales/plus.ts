/**
 * Textes de la feuille Minimoa+ (« Moi › Minimoa+ », points d'entrée `openPlus`). Les faits (offres,
 * avantages, frise de l'essai, mentions, nombre de personnes compatibles) viennent de l'API dans la langue de l'app ;
 * ici, seulement ce que l'app compose elle-même. Un prix n'est jamais écrit dans une phrase : il arrive mis en forme.
 */
import { messages } from './runtime';

export const plus = messages({
  fr: {
    brand: 'minimoa',
    /** Grand titre bénéfice (le composant le met en capitales) : ce que la personne vient d'essayer de faire. */
    headline: {
      generic: (pet: string) => `${pet} te présente\nplus de monde.`,
      onboarding: (pet: string) => `${pet} te présente\nplus de monde.`,
      premium_item: (item: string) => `${item}, ça lui irait bien.`,
      map: 'Toute la carte, pas que ta zone.',
      change_city: 'Change de ville sans bouger.',
      rename: (pet: string) => `Renomme ${pet} quand tu veux.`,
      jokers: 'Un gel de série par semaine.',
      encounters: '10 personnes par jour, au lieu de 3.',
      far_away: 'Vois qui est au-delà de ta zone.',
      try_on: (item: string) => `${item} lui va bien.`,
      worn_by: (item: string) => `${item}, pour lui aussi.`,
      collection: (until: string) => `Collection Hiver, jusqu’au ${until}.`,
    },
    plan: { yearly: 'Annuel', monthly: 'Mensuel', weekly: 'Hebdomadaire' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} jours gratuits, puis`,
    },
    /** Montant facturé à partir du prix du magasin (« 59,99 € »). */
    price: {
      year: (p: string) => `${p} par an`,
      month: (p: string) => `${p} par mois`,
      week: (p: string) => `${p} par semaine`,
    },
    perMonth: (p: string) => `soit ${p} par mois`,
    badge: (percent: number) => `Économise ${percent} %`,
    offersLabel: 'Choisis ton abonnement',
    cta: {
      trial: (days: number) => `Commencer mes ${days} jours gratuits`,
      subscribe: (price: string) => `M’abonner : ${price}`,
      unavailable: 'Disponible sur iPhone',
      retry: 'Réessayer',
    },
    status: {
      pending:
        'Achat en attente de validation (contrôle parental ou paiement à confirmer). Minimoa+ s’ouvrira tout seul.',
      welcome: (pet: string) => `Bienvenue dans Minimoa+. ${pet} a déjà sorti ses objets premium.`,
      failed: 'L’achat n’a pas abouti. Rien n’a été facturé. Réessaie dans un instant.',
      activation:
        'Ton achat est passé chez Apple, mais on n’a pas pu l’activer. Touche « Restaurer mes achats » dans un instant.',
      restored: 'Achats restaurés : Minimoa+ est ouvert.',
      restoreNone: 'Aucun abonnement à restaurer sur ce compte Apple.',
      restoreError: 'La restauration n’a pas abouti. Réessaie.',
      loadError: 'Impossible de charger l’offre. Vérifie ta connexion.',
      pricesError: 'L’App Store ne répond pas : pas de prix pour l’instant. Réessaie.',
      noOffers: 'Les offres ne sont pas disponibles pour l’instant. Réessaie plus tard.',
      unavailable: 'L’abonnement se prend pour l’instant sur iPhone, dans l’app.',
      simulated: 'Mode dev : achat simulé, rien n’est facturé.',
    },
    member: {
      title: 'Tu as Minimoa+',
      fallback: 'Ton abonnement est actif.',
      manage: 'Gérer mon abonnement',
    },
    /**
     * Sous le bouton d'achat, dans la barre fixe : la date du premier paiement (l'essai et le prix sont dans le bouton),
     * le renouvellement automatique et où annuler (Apple 3.1.2 ; la mention complète est sur la page « Conditions de
     * Minimoa+ »). Le prix vient de l'App Store.
     */
    ctaNote: {
      trial: (days: number, price: string, date: string) =>
        `Premier paiement le ${date}. Renouvellement automatique, annulable à tout moment dans Réglages › ton nom › Abonnements.`,
      plain: (price: string) =>
        `${price}, renouvellement automatique. Annulable à tout moment dans Réglages › ton nom › Abonnements.`,
    },
    /** Cartes des offres : la durée, la période sous le montant, l'équivalent mensuel en petit. */
    planCard: { yearly: '1 an', monthly: '1 mois', weekly: '1 semaine' },
    period: { year: 'par an', month: 'par mois', week: 'par semaine' },
    perMonthShort: (p: string) => `${p}/mois`,
    /** Bouton d'essai, seconde ligne : le montant facturé ensuite et sa période (le prix vient de l'App Store). */
    ctaThen: (price: string) => `puis ${price}`,
    /** Titre en gras d'une ligne d'avantage ou d'un jalon de la frise, ponctuation comprise. */
    colon: (s: string) => `${s} :`,
    /** Avantages en une phrase « Titre : explication » (la phrase de l'API reste celle du lecteur d'écran). */
    perkLines: (pet: string, premium: number) => ({
      map_everywhere: ['Toute la carte', 'et d’autres villes'],
      more_encounters: ['10 personnes par jour', 'au lieu de 3'],
      streak_jokers: ['Un gel par semaine', 'au lieu d’un par mois'],
      free_rename: [`Renommer ${pet}`, 'quand tu veux'],
      premium_items: ['Objets premium', `${premium} pièces à porter`],
    }),
    /** Sans essai : la même frise, pour dire ce qui se passe (paiement aujourd'hui, renouvellement, annulation). */
    noTrial: {
      today: ['Aujourd’hui', 'premier paiement, tout est ouvert'],
      every: { year: 'Chaque année', month: 'Chaque mois', week: 'Chaque semaine' },
      renews: 'renouvellement automatique',
      anytime: ['Quand tu veux', 'tu annules dans Réglages'],
    },
    continueFree: 'Continuer gratuitement',
    restore: 'Restaurer mes achats',
    links: { terms: 'Conditions', privacy: 'Confidentialité', plusTerms: 'Conditions de Minimoa+' },
    /**
     * Avantages en bref, une ligne chacun sur deux colonnes (l'API donne la phrase longue, lue par le lecteur d'écran).
     * La carte compte pour deux : toute la carte, et changer de ville.
     */
    perks: (pet: string) => ({
      map_everywhere: ['Toute la carte', 'Changer de ville'],
      more_encounters: ['Plus de rencontres'],
      streak_jokers: ['Un gel par semaine'],
      free_rename: [`Renommer ${pet}`],
      premium_items: ['Objets premium'],
    }),
    /** Frise de l'essai, après « Aujourd’hui : », « Jour 5 : », « Jour 7 : » (titres de l'API). */
    timeline: ['tout Minimoa+ est ouvert', 'rappel avant la fin de l’essai', '1er paiement, sauf annulation'],
    /** Sous les trois avantages montrés : déplie la liste complète. */
    morePerks: (n: number) => `Et ${n} de plus`,
  } as const,
  en: {
    brand: 'minimoa',
    headline: {
      generic: (pet: string) => `${pet} introduces you\nto more people.`,
      onboarding: (pet: string) => `${pet} introduces you\nto more people.`,
      premium_item: (item: string) => `${item}: it would look great.`,
      map: 'The whole map, not just your area.',
      change_city: 'Change cities without moving.',
      rename: (pet: string) => `Rename ${pet} whenever you like.`,
      jokers: 'One streak freeze a week.',
      encounters: 'More encounters, every day.',
      far_away: 'See who’s beyond your area.',
      try_on: (item: string) => `${item} suits them.`,
      worn_by: (item: string) => `${item}, for yours too.`,
      collection: (until: string) => `Winter collection, until ${until}.`,
    },
    plan: { yearly: 'Yearly', monthly: 'Monthly', weekly: 'Weekly' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} days free, then`,
    },
    price: {
      year: (p: string) => `${p} per year`,
      month: (p: string) => `${p} per month`,
      week: (p: string) => `${p} per week`,
    },
    perMonth: (p: string) => `that’s ${p} a month`,
    badge: (percent: number) => `Save ${percent}%`,
    offersLabel: 'Choose your subscription',
    cta: {
      trial: (days: number) => `Start my ${days} free days`,
      subscribe: (price: string) => `Subscribe: ${price}`,
      unavailable: 'Available on iPhone',
      retry: 'Try again',
    },
    status: {
      pending:
        'Purchase awaiting approval (parental control or payment to confirm). Minimoa+ will unlock on its own.',
      welcome: (pet: string) => `Welcome to Minimoa+. ${pet} has already got the premium items out.`,
      failed: 'The purchase didn’t go through. Nothing was charged. Try again in a moment.',
      activation:
        'Your purchase went through with Apple, but we couldn’t activate it. Tap “Restore purchases” in a moment.',
      restored: 'Purchases restored: Minimoa+ is unlocked.',
      restoreNone: 'No subscription to restore on this Apple Account.',
      restoreError: 'Restoring didn’t go through. Try again.',
      loadError: 'Couldn’t load the offer. Check your connection.',
      pricesError: 'The App Store isn’t responding: no prices for now. Try again.',
      noOffers: 'The plans aren’t available right now. Try again later.',
      unavailable: 'For now, you can subscribe on iPhone, in the app.',
      simulated: 'Dev mode: simulated purchase, nothing is charged.',
    },
    member: {
      title: 'You have Minimoa+',
      fallback: 'Your subscription is active.',
      manage: 'Manage my subscription',
    },
    ctaNote: {
      trial: (days: number, price: string, date: string) =>
        `First payment on ${date}. Renews automatically; cancel anytime in Settings › your name › Subscriptions.`,
      plain: (price: string) =>
        `${price}, renews automatically. Cancel anytime in Settings › your name › Subscriptions.`,
    },
    planCard: { yearly: '1 year', monthly: '1 month', weekly: '1 week' },
    period: { year: 'per year', month: 'per month', week: 'per week' },
    perMonthShort: (p: string) => `${p}/month`,
    ctaThen: (price: string) => `then ${price}`,
    colon: (s: string) => `${s}:`,
    perkLines: (pet: string, premium: number) => ({
      map_everywhere: ['The whole map', 'and other cities too'],
      more_encounters: ['10 people a day', 'instead of 3'],
      streak_jokers: ['One freeze a week', 'instead of one a month'],
      free_rename: [`Rename ${pet}`, 'whenever you like'],
      premium_items: ['Premium items', `${premium} wardrobe pieces`],
    }),
    noTrial: {
      today: ['Today', 'first payment, everything unlocked'],
      every: { year: 'Every year', month: 'Every month', week: 'Every week' },
      renews: 'renews automatically',
      anytime: ['Anytime', 'cancel in Settings'],
    },
    continueFree: 'Continue for free',
    restore: 'Restore purchases',
    links: { terms: 'Terms', privacy: 'Privacy', plusTerms: 'Minimoa+ terms' },
    perks: (pet: string) => ({
      map_everywhere: ['The whole map', 'Change cities'],
      more_encounters: ['More encounters'],
      streak_jokers: ['One freeze a week'],
      free_rename: [`Rename ${pet}`],
      premium_items: ['Premium items'],
    }),
    timeline: [
      'all of Minimoa+ unlocked',
      'reminder before the trial ends',
      'first payment, unless you cancel',
    ],
    morePerks: (n: number) => `And ${n} more`,
  },
  es: {
    brand: 'minimoa',
    headline: {
      generic: (pet: string) => `${pet} te presenta\na más gente.`,
      onboarding: (pet: string) => `${pet} te presenta\na más gente.`,
      premium_item: (item: string) => `${item}: le quedaría genial.`,
      map: 'Todo el mapa, no solo tu zona.',
      change_city: 'Cambia de ciudad sin moverte.',
      rename: (pet: string) => `Renombra a ${pet} cuando quieras.`,
      jokers: 'Un protector de racha a la semana.',
      encounters: 'Más encuentros, cada día.',
      far_away: 'Mira quién hay más allá de tu zona.',
      try_on: (item: string) => `${item} le queda bien.`,
      worn_by: (item: string) => `${item}, para el tuyo también.`,
      collection: (until: string) => `Invierno, hasta el ${until}.`,
    },
    plan: { yearly: 'Anual', monthly: 'Mensual', weekly: 'Semanal' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} días gratis, luego`,
    },
    price: {
      year: (p: string) => `${p} al año`,
      month: (p: string) => `${p} al mes`,
      week: (p: string) => `${p} a la semana`,
    },
    perMonth: (p: string) => `o sea, ${p} al mes`,
    badge: (percent: number) => `Ahorra ${percent} %`,
    offersLabel: 'Elige tu suscripción',
    cta: {
      trial: (days: number) => `Empezar mis ${days} días gratis`,
      subscribe: (price: string) => `Suscribirme: ${price}`,
      unavailable: 'Disponible en iPhone',
      retry: 'Reintentar',
    },
    status: {
      pending:
        'Compra pendiente de aprobación (control parental o pago por confirmar). Minimoa+ se activará solo.',
      welcome: (pet: string) => `Te damos la bienvenida a Minimoa+. ${pet} ya ha sacado sus objetos premium.`,
      failed: 'La compra no se ha completado. No se ha cobrado nada. Inténtalo de nuevo en un momento.',
      activation:
        'Tu compra se ha hecho en Apple, pero no hemos podido activarla. Toca «Restaurar compras» en un momento.',
      restored: 'Compras restauradas: Minimoa+ está activo.',
      restoreNone: 'No hay ninguna suscripción que restaurar en esta cuenta de Apple.',
      restoreError: 'No se pudo restaurar. Inténtalo de nuevo.',
      loadError: 'No se pudo cargar la oferta. Revisa tu conexión.',
      pricesError: 'El App Store no responde: de momento no hay precios. Inténtalo de nuevo.',
      noOffers: 'Los planes no están disponibles por ahora. Inténtalo más tarde.',
      unavailable: 'Por ahora, la suscripción se contrata en iPhone, desde la app.',
      simulated: 'Modo dev: compra simulada, no se cobra nada.',
    },
    member: {
      title: 'Tienes Minimoa+',
      fallback: 'Tu suscripción está activa.',
      manage: 'Gestionar mi suscripción',
    },
    ctaNote: {
      trial: (days: number, price: string, date: string) =>
        `Primer pago el ${date}. Renovación automática; cancela cuando quieras en Ajustes › tu nombre › Suscripciones.`,
      plain: (price: string) =>
        `${price}, renovación automática. Cancela cuando quieras en Ajustes › tu nombre › Suscripciones.`,
    },
    planCard: { yearly: '1 año', monthly: '1 mes', weekly: '1 semana' },
    period: { year: 'al año', month: 'al mes', week: 'a la semana' },
    perMonthShort: (p: string) => `${p}/mes`,
    ctaThen: (price: string) => `luego ${price}`,
    colon: (s: string) => `${s}:`,
    perkLines: (pet: string, premium: number) => ({
      map_everywhere: ['Todo el mapa', 'y también otras ciudades'],
      more_encounters: ['10 personas al día', 'en vez de 3'],
      streak_jokers: ['Un protector a la semana', 'en vez de uno al mes'],
      free_rename: [`Renombrar a ${pet}`, 'cuando quieras'],
      premium_items: ['Objetos premium', `${premium} piezas del armario`],
    }),
    noTrial: {
      today: ['Hoy', 'primer pago, todo disponible'],
      every: { year: 'Cada año', month: 'Cada mes', week: 'Cada semana' },
      renews: 'renovación automática',
      anytime: ['Cuando quieras', 'cancela en Ajustes'],
    },
    continueFree: 'Seguir gratis',
    restore: 'Restaurar compras',
    links: { terms: 'Condiciones', privacy: 'Privacidad', plusTerms: 'Condiciones de Minimoa+' },
    perks: (pet: string) => ({
      map_everywhere: ['Todo el mapa', 'Cambiar de ciudad'],
      more_encounters: ['Más encuentros'],
      streak_jokers: ['Un protector a la semana'],
      free_rename: [`Renombrar a ${pet}`],
      premium_items: ['Objetos premium'],
    }),
    timeline: [
      'todo Minimoa+ disponible',
      'aviso antes de que acabe la prueba',
      'primer pago, salvo si cancelas',
    ],
    morePerks: (n: number) => `Y ${n} más`,
  },
  pt: {
    brand: 'minimoa',
    headline: {
      generic: (pet: string) => `${pet} te apresenta\nmais gente.`,
      onboarding: (pet: string) => `${pet} te apresenta\nmais gente.`,
      premium_item: (item: string) => `${item}: ia ficar ótimo nele.`,
      map: 'O mapa inteiro, não só a sua área.',
      change_city: 'Mude de cidade sem sair do lugar.',
      rename: (pet: string) => `Renomeie ${pet} quando quiser.`,
      jokers: 'Uma proteção de sequência por semana.',
      encounters: 'Mais encontros, todo dia.',
      far_away: 'Veja quem está além da sua área.',
      try_on: (item: string) => `${item} ficou ótimo nele.`,
      worn_by: (item: string) => `${item}, pro seu também.`,
      collection: (until: string) => `Coleção Inverno, até ${until}.`,
    },
    plan: { yearly: 'Anual', monthly: 'Mensal', weekly: 'Semanal' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} dias grátis, depois`,
    },
    price: {
      year: (p: string) => `${p} por ano`,
      month: (p: string) => `${p} por mês`,
      week: (p: string) => `${p} por semana`,
    },
    perMonth: (p: string) => `ou seja, ${p} por mês`,
    badge: (percent: number) => `Economize ${percent}%`,
    offersLabel: 'Escolha sua assinatura',
    cta: {
      trial: (days: number) => `Começar meus ${days} dias grátis`,
      subscribe: (price: string) => `Assinar: ${price}`,
      unavailable: 'Disponível no iPhone',
      retry: 'Tentar de novo',
    },
    status: {
      pending:
        'Compra aguardando aprovação (controle parental ou pagamento a confirmar). O Minimoa+ vai ser liberado sozinho.',
      welcome: (pet: string) => `Boas-vindas ao Minimoa+. ${pet} já tirou os itens premium do armário.`,
      failed: 'A compra não foi concluída. Nada foi cobrado. Tente de novo daqui a pouco.',
      activation:
        'Sua compra foi feita na Apple, mas não conseguimos ativá-la. Toque em “Restaurar compras” daqui a pouco.',
      restored: 'Compras restauradas: o Minimoa+ está liberado.',
      restoreNone: 'Nenhuma assinatura para restaurar nesta conta Apple.',
      restoreError: 'Não foi possível restaurar. Tente de novo.',
      loadError: 'Não foi possível carregar a oferta. Verifique sua conexão.',
      pricesError: 'A App Store não está respondendo: sem preços por enquanto. Tente de novo.',
      noOffers: 'Os planos não estão disponíveis no momento. Tente mais tarde.',
      unavailable: 'Por enquanto, a assinatura é feita no iPhone, pelo app.',
      simulated: 'Modo dev: compra simulada, nada é cobrado.',
    },
    member: {
      title: 'Você tem Minimoa+',
      fallback: 'Sua assinatura está ativa.',
      manage: 'Gerenciar minha assinatura',
    },
    ctaNote: {
      trial: (days: number, price: string, date: string) =>
        `Primeira cobrança em ${date}. Renovação automática; cancele quando quiser em Ajustes › seu nome › Assinaturas.`,
      plain: (price: string) =>
        `${price}, renovação automática. Cancele quando quiser em Ajustes › seu nome › Assinaturas.`,
    },
    planCard: { yearly: '1 ano', monthly: '1 mês', weekly: '1 semana' },
    period: { year: 'por ano', month: 'por mês', week: 'por semana' },
    perMonthShort: (p: string) => `${p}/mês`,
    ctaThen: (price: string) => `depois ${price}`,
    colon: (s: string) => `${s}:`,
    perkLines: (pet: string, premium: number) => ({
      map_everywhere: ['O mapa inteiro', 'e outras cidades também'],
      more_encounters: ['10 pessoas por dia', 'em vez de 3'],
      streak_jokers: ['Uma proteção por semana', 'em vez de uma por mês'],
      free_rename: [`Renomear ${pet}`, 'quando quiser'],
      premium_items: ['Itens premium', `${premium} peças do guarda-roupa`],
    }),
    noTrial: {
      today: ['Hoje', '1ª cobrança, tudo liberado'],
      every: { year: 'Todo ano', month: 'Todo mês', week: 'Toda semana' },
      renews: 'renovação automática',
      anytime: ['Quando quiser', 'cancele em Ajustes'],
    },
    continueFree: 'Continuar grátis',
    restore: 'Restaurar compras',
    links: { terms: 'Termos', privacy: 'Privacidade', plusTerms: 'Termos do Minimoa+' },
    perks: (pet: string) => ({
      map_everywhere: ['O mapa inteiro', 'Mudar de cidade'],
      more_encounters: ['Mais encontros'],
      streak_jokers: ['Uma proteção por semana'],
      free_rename: [`Renomear ${pet}`],
      premium_items: ['Itens premium'],
    }),
    timeline: [
      'todo o Minimoa+ liberado',
      'lembrete antes do fim do teste',
      '1ª cobrança, a menos que cancele',
    ],
    morePerks: (n: number) => `E mais ${n}`,
  },
  nl: {
    brand: 'minimoa',
    headline: {
      generic: (pet: string) => `${pet} stelt je aan\nmeer mensen voor.`,
      onboarding: (pet: string) => `${pet} stelt je aan\nmeer mensen voor.`,
      premium_item: (item: string) => `${item}: dat staat hem goed.`,
      map: 'De hele kaart, niet alleen je gebied.',
      change_city: 'Wissel van stad zonder te verhuizen.',
      rename: (pet: string) => `Hernoem ${pet} wanneer je wilt.`,
      jokers: 'Eén reeksbevriezer per week.',
      encounters: 'Meer ontmoetingen, elke dag.',
      far_away: 'Zie wie er buiten je zone is.',
      try_on: (item: string) => `${item} staat hem goed.`,
      worn_by: (item: string) => `${item}, ook voor de jouwe.`,
      collection: (until: string) => `Wintercollectie, tot ${until}.`,
    },
    plan: { yearly: 'Jaarlijks', monthly: 'Maandelijks', weekly: 'Wekelijks' },
    lead: {
      trial: (plan: string, days: number) => `${plan} · ${days} dagen gratis, daarna`,
    },
    price: {
      year: (p: string) => `${p} per jaar`,
      month: (p: string) => `${p} per maand`,
      week: (p: string) => `${p} per week`,
    },
    perMonth: (p: string) => `dat is ${p} per maand`,
    badge: (percent: number) => `Bespaar ${percent}%`,
    offersLabel: 'Kies je abonnement',
    cta: {
      trial: (days: number) => `Start mijn ${days} gratis dagen`,
      subscribe: (price: string) => `Abonneren: ${price}`,
      unavailable: 'Beschikbaar op iPhone',
      retry: 'Opnieuw proberen',
    },
    status: {
      pending:
        'Aankoop wacht op goedkeuring (ouderlijk toezicht of betaling nog te bevestigen). Minimoa+ gaat vanzelf open.',
      welcome: (pet: string) => `Welkom bij Minimoa+. ${pet} heeft de premium items al tevoorschijn gehaald.`,
      failed: 'De aankoop is niet gelukt. Er is niets in rekening gebracht. Probeer het zo opnieuw.',
      activation:
        'Je aankoop is bij Apple gelukt, maar we konden hem niet activeren. Tik zo op “Aankopen herstellen”.',
      restored: 'Aankopen hersteld: Minimoa+ staat open.',
      restoreNone: 'Geen abonnement om te herstellen op dit Apple-account.',
      restoreError: 'Herstellen is niet gelukt. Probeer het opnieuw.',
      loadError: 'Het aanbod kon niet worden geladen. Controleer je verbinding.',
      pricesError: 'De App Store reageert niet: nog geen prijzen. Probeer het opnieuw.',
      noOffers: 'De abonnementen zijn nu niet beschikbaar. Probeer het later opnieuw.',
      unavailable: 'Abonneren kan voorlopig alleen op iPhone, in de app.',
      simulated: 'Dev-modus: gesimuleerde aankoop, er wordt niets in rekening gebracht.',
    },
    member: {
      title: 'Je hebt Minimoa+',
      fallback: 'Je abonnement is actief.',
      manage: 'Mijn abonnement beheren',
    },
    ctaNote: {
      trial: (days: number, price: string, date: string) =>
        `Eerste betaling op ${date}. Wordt automatisch verlengd; altijd opzegbaar via Instellingen › je naam › Abonnementen.`,
      plain: (price: string) =>
        `${price}, wordt automatisch verlengd. Altijd opzegbaar via Instellingen › je naam › Abonnementen.`,
    },
    planCard: { yearly: '1 jaar', monthly: '1 maand', weekly: '1 week' },
    period: { year: 'per jaar', month: 'per maand', week: 'per week' },
    perMonthShort: (p: string) => `${p}/mnd`,
    ctaThen: (price: string) => `daarna ${price}`,
    colon: (s: string) => `${s}:`,
    perkLines: (pet: string, premium: number) => ({
      map_everywhere: ['De hele kaart', 'ook in andere steden'],
      more_encounters: ['10 mensen per dag', 'in plaats van 3'],
      streak_jokers: ['Eén bevriezer per week', 'in plaats van één per maand'],
      free_rename: [`${pet} hernoemen`, 'wanneer je wilt'],
      premium_items: ['Premium-items', `${premium} stuks in de garderobe`],
    }),
    noTrial: {
      today: ['Vandaag', 'eerste betaling, alles open'],
      every: { year: 'Elk jaar', month: 'Elke maand', week: 'Elke week' },
      renews: 'automatisch verlengd',
      anytime: ['Wanneer je wilt', 'opzeggen via Instellingen'],
    },
    continueFree: 'Gratis doorgaan',
    restore: 'Aankopen herstellen',
    links: { terms: 'Voorwaarden', privacy: 'Privacy', plusTerms: 'Voorwaarden Minimoa+' },
    perks: (pet: string) => ({
      map_everywhere: ['De hele kaart', 'Van stad wisselen'],
      more_encounters: ['Meer ontmoetingen'],
      streak_jokers: ['Eén bevriezer per week'],
      free_rename: [`${pet} hernoemen`],
      premium_items: ['Premium-items'],
    }),
    timeline: [
      'alles van Minimoa+ open',
      'herinnering voor het einde van de proef',
      'eerste betaling, tenzij je opzegt',
    ],
    morePerks: (n: number) => `En nog ${n}`,
  },
});
