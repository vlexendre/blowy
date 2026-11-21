// Univers « Les cadeaux » : offrir, recevoir, choisir, emballer, surprendre.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'cadeaux',
  icon: '🎁',
  title: {
    fr: ['Les cadeaux', 'Offrir, recevoir et surprendre.'],
    en: ['Gifts', 'Giving, receiving and surprising.'],
    es: ['Los regalos', 'Regalar, recibir y sorprender.'],
    pt: ['Os presentes', 'Dar, receber e surpreender.'],
    nl: ['Cadeaus', 'Geven, krijgen en verrassen.'],
  },
  steps: [
    {
      id: 'cadeaux_1',
      title: { fr: 'Le choix', en: 'Choosing', es: 'La elección', pt: 'A escolha', nl: 'Kiezen' },
      questions: [
        c('cadeaux_liste', 'cap', [['✨', -60, 'spontane'], ['📝', 70, 'plan'], ['🔎', 20, null]], {
          fr: {
            t: 'Un anniversaire approche. Pour trouver le cadeau, tu…',
            o: 'Demande-lui comment elle ou il trouve ses idées de cadeaux.',
            a: [
              ['Attends le coup de cœur en flânant', 'Le hasard fait bien les choses, hop !'],
              ['Ressors ta liste d’idées notées toute l’année', 'Mon carnet secret est déjà plein.'],
              ['Cherches un peu en ligne, puis tu décides', 'Trois onglets, une décision. Efficace.'],
            ],
          },
          en: {
            t: 'A birthday is coming up. To find the gift, you…',
            o: 'Ask them how they come up with gift ideas.',
            a: [
              ['Wait for love at first sight while browsing', 'Chance knows what it’s doing!'],
              ['Pull out the list of ideas you keep all year', 'My secret notebook is already full.'],
              ['Look around online a bit, then decide', 'Three tabs, one decision. Efficient.'],
            ],
          },
          es: {
            t: 'Se acerca un cumpleaños. Para encontrar el regalo…',
            o: 'Pregúntale cómo se le ocurren las ideas de regalos.',
            a: [
              ['Espero el flechazo paseando', '¡El azar sabe lo que hace!'],
              ['Saco mi lista de ideas de todo el año', 'Mi libreta secreta ya está llena.'],
              ['Busco un poco en internet y decido', 'Tres pestañas, una decisión. Eficaz.'],
            ],
          },
          pt: {
            t: 'Um aniversário está chegando. Para achar o presente, você…',
            o: 'Pergunte como essa pessoa tem ideias de presentes.',
            a: [
              ['Espera amor à primeira vista passeando', 'O acaso sabe o que faz!'],
              ['Pega a lista de ideias anotadas o ano todo', 'Meu caderninho secreto já está cheio.'],
              ['Pesquisa um pouco na internet e decide', 'Três abas, uma decisão. Eficiente.'],
            ],
          },
          nl: {
            t: 'Er komt een verjaardag aan. Om het cadeau te vinden…',
            o: 'Vraag hoe die persoon op cadeau-ideeën komt.',
            a: [
              ['Wacht ik op liefde op het eerste gezicht', 'Het toeval weet wat het doet!'],
              ['Pak ik mijn ideeënlijstje van het hele jaar', 'Mijn geheime boekje zit al vol.'],
              ['Zoek ik wat online en dan beslis ik', 'Drie tabbladen, één besluit. Efficiënt.'],
            ],
          },
        }),
        s('cadeaux_derniere', 'cap', ['⚡', -100, 'spontane'], ['📅', 100, 'plan'], {
          fr: { t: 'Ton cadeau, tu l’achètes plutôt…', o: 'Demande-lui quand elle ou il achète ses cadeaux.', a: [['La veille au soir', 'Course contre la montre, j’adore.'], ['Des semaines à l’avance', 'Il est même déjà emballé ?']], m: 'Quelques jours avant, tranquille.' },
          en: { t: 'You usually buy your gift…', o: 'Ask them when they tend to buy their gifts.', a: [['The night before', 'A race against the clock, love it.'], ['Weeks in advance', 'Is it already wrapped too?']], m: 'A few days before, no rush.' },
          es: { t: 'Tu regalo, lo compras más bien…', o: 'Pregúntale cuándo suele comprar sus regalos.', a: [['La noche antes', 'Carrera contrarreloj, me encanta.'], ['Semanas antes', '¿Y ya está envuelto y todo?']], m: 'Unos días antes, con calma.' },
          pt: { t: 'Seu presente, você compra mais…', o: 'Pergunte quando essa pessoa costuma comprar presentes.', a: [['Na noite anterior', 'Corrida contra o relógio, adoro.'], ['Semanas antes', 'E já está até embrulhado?']], m: 'Alguns dias antes, tranquilo.' },
          nl: { t: 'Je cadeau koop je meestal…', o: 'Vraag wanneer die persoon cadeaus koopt.', a: [['De avond ervoor', 'Race tegen de klok, heerlijk.'], ['Weken van tevoren', 'Is het ook al ingepakt?']], m: 'Een paar dagen ervoor, rustig aan.' },
        }),
        c('cadeaux_boutique', 'ancrage', [['🏪', -60, 'racines'], ['🧭', 70, 'curiosite'], ['🧺', 20, null]], {
          fr: {
            t: 'Pour dénicher le cadeau, tu vas…',
            o: 'Demande-lui où elle ou il aime chercher des cadeaux.',
            a: [
              ['Dans la boutique que je connais par cœur', 'On y va les yeux fermés.'],
              ['Explorer un quartier où je ne vais jamais', 'Carte, boussole, je te suis !'],
              ['Faire un tour au marché du coin', 'J’adore fouiller les étals.'],
            ],
          },
          en: {
            t: 'To track down the gift, you go…',
            o: 'Ask them where they like to look for gifts.',
            a: [
              ['To the shop I know inside out', 'We could go blindfolded.'],
              ['Exploring a part of town I never visit', 'Map, compass, I’m right behind you!'],
              ['For a wander round the local market', 'I love rummaging through the stalls.'],
            ],
          },
          es: {
            t: 'Para encontrar el regalo, vas…',
            o: 'Pregúntale dónde le gusta buscar regalos.',
            a: [
              ['A la tienda que conozco de memoria', 'Podríamos ir con los ojos cerrados.'],
              ['A explorar un barrio donde nunca voy', '¡Mapa, brújula, te sigo!'],
              ['A dar una vuelta por el mercadillo', 'Me encanta curiosear en los puestos.'],
            ],
          },
          pt: {
            t: 'Para achar o presente, você vai…',
            o: 'Pergunte onde essa pessoa gosta de procurar presentes.',
            a: [
              ['Na loja que conheço de cor', 'Dá para ir de olhos fechados.'],
              ['Explorar um bairro onde nunca vou', 'Mapa, bússola, estou com você!'],
              ['Dar uma volta na feirinha do bairro', 'Adoro fuçar nas barracas.'],
            ],
          },
          nl: {
            t: 'Om het cadeau te vinden, ga je…',
            o: 'Vraag waar die persoon graag naar cadeaus zoekt.',
            a: [
              ['Naar de winkel die ik op mijn duimpje ken', 'Daar kunnen we blind heen.'],
              ['Een wijk verkennen waar ik nooit kom', 'Kaart, kompas, ik volg je!'],
              ['Een rondje over de markt', 'Ik snuffel zo graag tussen de kraampjes.'],
            ],
          },
        }),
        c('cadeaux_avis', 'foyer', [['🧍', -60, 'liberte'], ['👯', 70, 'famille']], {
          fr: {
            t: 'Avant d’acheter, tu demandes l’avis de quelqu’un ?',
            o: 'Demande-lui si elle ou il aime se faire conseiller pour un cadeau.',
            a: [
              ['Non, je suis mon instinct', 'Mon flair ne se trompe jamais. Presque.'],
              ['Oui, je consulte mes proches', 'Le conseil des sages est réuni !'],
            ],
          },
          en: {
            t: 'Before buying, do you ask anyone’s opinion?',
            o: 'Ask them whether they like advice when choosing a gift.',
            a: [
              ['No, I follow my gut', 'My instinct is never wrong. Almost.'],
              ['Yes, I check with my nearest and dearest', 'The council of the wise is in session!'],
            ],
          },
          es: {
            t: 'Antes de comprar, ¿pides opinión a alguien?',
            o: 'Pregúntale si le gusta que le aconsejen con los regalos.',
            a: [
              ['No, sigo mi instinto', 'Mi olfato nunca falla. Casi.'],
              ['Sí, consulto a mi gente', '¡Se reúne el consejo de sabios!'],
            ],
          },
          pt: {
            t: 'Antes de comprar, você pede a opinião de alguém?',
            o: 'Pergunte se essa pessoa gosta de conselhos para escolher presentes.',
            a: [
              ['Não, sigo meu instinto', 'Meu faro nunca erra. Quase.'],
              ['Sim, consulto as pessoas próximas', 'O conselho dos sábios está reunido!'],
            ],
          },
          nl: {
            t: 'Vraag je iemand om advies voordat je iets koopt?',
            o: 'Vraag of die persoon graag advies krijgt bij een cadeau.',
            a: [
              ['Nee, ik volg mijn gevoel', 'Mijn neus zit er nooit naast. Bijna.'],
              ['Ja, ik overleg met mijn naasten', 'De raad der wijzen is bijeen!'],
            ],
          },
        }),
        s('cadeaux_fait_main', 'elan', ['🛍️', -100, 'temps_libre'], ['🧶', 100, 'projets'], {
          fr: { t: 'Fabriquer un cadeau toi-même, pour toi c’est…', o: 'Demande-lui quel est le plus beau cadeau fait main qu’elle ou il a reçu.', a: [['Pas mon truc, j’achète et je profite', 'Plus de temps pour les câlins.'], ['Un vrai projet qui me motive', 'Je t’apporte la colle et les paillettes !']], m: 'Ça dépend pour qui.' },
          en: { t: 'Making a gift yourself is…', o: 'Ask them about the best handmade gift they’ve ever received.', a: [['Not my thing, I buy and relax', 'More time for cuddles.'], ['A real project that fires me up', 'I’ll fetch the glue and glitter!']], m: 'Depends who it’s for.' },
          es: { t: 'Hacer un regalo con tus manos, para ti es…', o: 'Pregúntale cuál es el mejor regalo hecho a mano que ha recibido.', a: [['No es lo mío, compro y disfruto', 'Más tiempo para mimos.'], ['Un proyecto que me motiva', '¡Te traigo el pegamento y la purpurina!']], m: 'Depende de para quién.' },
          pt: { t: 'Fazer um presente com as próprias mãos é…', o: 'Pergunte qual o presente feito à mão mais bonito que essa pessoa já ganhou.', a: [['Não é comigo, compro e aproveito', 'Mais tempo para carinho.'], ['Um projeto que me anima', 'Vou buscar a cola e o glitter!']], m: 'Depende de para quem.' },
          nl: { t: 'Zelf een cadeau maken is voor jou…', o: 'Vraag wat het mooiste zelfgemaakte cadeau is dat die persoon ooit kreeg.', a: [['Niks voor mij, ik koop en geniet', 'Meer tijd om te knuffelen.'], ['Een echt project waar ik zin in heb', 'Ik haal de lijm en de glitters!']], m: 'Hangt ervan af voor wie.' },
        }),
      ],
    },
    {
      id: 'cadeaux_2',
      title: { fr: 'L’emballage', en: 'Wrapping', es: 'El envoltorio', pt: 'O embrulho', nl: 'Inpakken' },
      questions: [
        c('cadeaux_papier', 'cap', [['🎀', 60, 'ordre'], ['📰', -60, 'spontane'], ['🛍️', -10, null]], {
          fr: {
            t: 'Ton emballage ressemble plutôt à…',
            o: 'Demande-lui à quoi ressemblent ses paquets cadeaux.',
            a: [
              ['Coins parfaits, ruban assorti', 'On dirait une vitrine !'],
              ['Du papier journal et beaucoup de scotch', 'Original… et un peu collant.'],
              ['Un joli sac, et c’est réglé', 'Malin, ni vu ni froissé.'],
            ],
          },
          en: {
            t: 'Your wrapping looks more like…',
            o: 'Ask them what their wrapped presents look like.',
            a: [
              ['Perfect corners, matching ribbon', 'It’s like a shop window!'],
              ['Newspaper and loads of tape', 'Original… and a bit sticky.'],
              ['A nice gift bag, job done', 'Clever, no creases at all.'],
            ],
          },
          es: {
            t: 'Tu envoltorio se parece más bien a…',
            o: 'Pregúntale cómo son sus paquetes de regalo.',
            a: [
              ['Esquinas perfectas, lazo a juego', '¡Parece un escaparate!'],
              ['Papel de periódico y mucho celo', 'Original… y algo pegajoso.'],
              ['Una bolsa bonita y listo', 'Muy listo, ni una arruga.'],
            ],
          },
          pt: {
            t: 'Seu embrulho parece mais…',
            o: 'Pergunte como são os embrulhos de presente dessa pessoa.',
            a: [
              ['Cantos perfeitos, fita combinando', 'Parece vitrine de loja!'],
              ['Jornal e muita fita adesiva', 'Original… e meio grudento.'],
              ['Uma sacolinha bonita e pronto', 'Esperto, nem um amassado.'],
            ],
          },
          nl: {
            t: 'Jouw inpakwerk lijkt vooral op…',
            o: 'Vraag hoe de ingepakte cadeaus van die persoon eruitzien.',
            a: [
              ['Strakke hoeken, bijpassend lint', 'Net een etalage!'],
              ['Krantenpapier en heel veel plakband', 'Origineel… en een beetje plakkerig.'],
              ['Een mooi tasje en klaar', 'Slim, geen kreukje te zien.'],
            ],
          },
        }),
        s('cadeaux_deballer', 'rythme', ['🤫', -100, 'calme'], ['🎉', 100, 'fete'], {
          fr: { t: 'Pour ouvrir les cadeaux, tu préfères…', o: 'Demande-lui comment se passe le moment des cadeaux chez elle ou lui.', a: [['En petit comité, au calme', 'Je chuchote : ouvre doucement.'], ['Devant tout le monde, avec des cris', 'Ouvre ! Ouvre ! Ouvre !']], m: 'Un peu des deux selon l’humeur.' },
          en: { t: 'For opening presents, you prefer…', o: 'Ask them what present-opening time is like for them.', a: [['A small group, nice and calm', 'I’ll whisper: open it gently.'], ['In front of everyone, with cheering', 'Open it! Open it! Open it!']], m: 'A bit of both, depending on my mood.' },
          es: { t: 'Para abrir los regalos, prefieres…', o: 'Pregúntale cómo es el momento de abrir regalos en su casa.', a: [['En grupo pequeño, con calma', 'Susurro: ábrelo despacito.'], ['Delante de todos, con gritos', '¡Ábrelo! ¡Ábrelo! ¡Ábrelo!']], m: 'Un poco de todo, según el día.' },
          pt: { t: 'Para abrir os presentes, você prefere…', o: 'Pergunte como é a hora de abrir presentes para essa pessoa.', a: [['Com pouca gente, com calma', 'Vou sussurrar: abre devagar.'], ['Na frente de todo mundo, com gritaria', 'Abre! Abre! Abre!']], m: 'Um pouco de cada, depende do humor.' },
          nl: { t: 'Cadeaus openmaken doe je het liefst…', o: 'Vraag hoe het uitpakmoment er bij die persoon uitziet.', a: [['In kleine kring, rustig', 'Ik fluister: rustig openmaken.'], ['Voor iedereen, met gejuich', 'Open! Open! Open!']], m: 'Een beetje van allebei, net hoe ik me voel.' },
        }),
        c('cadeaux_tissu', 'ancrage', [['📜', -60, 'racines'], ['🧣', 70, 'curiosite'], ['📦', 0, null]], {
          fr: {
            t: 'Pour emballer, tu prends…',
            o: 'Demande-lui quelle est son astuce d’emballage préférée.',
            a: [
              ['Le même papier que d’habitude', 'Ta signature, on te reconnaît.'],
              ['Un tissu noué à la japonaise, pour tester', 'Ooh, un nœud que je ne connaissais pas.'],
              ['Ce qui traîne dans le placard', 'Mission débrouille accomplie.'],
            ],
          },
          en: {
            t: 'To wrap a present, you use…',
            o: 'Ask them for their favourite wrapping trick.',
            a: [
              ['The same paper as always', 'Your signature look, we know it’s you.'],
              ['A Japanese-style knotted cloth, just to try', 'Ooh, a knot I’ve never seen.'],
              ['Whatever’s lying around in the cupboard', 'Resourceful mission accomplished.'],
            ],
          },
          es: {
            t: 'Para envolver, usas…',
            o: 'Pregúntale cuál es su truco favorito para envolver.',
            a: [
              ['El mismo papel de siempre', 'Tu sello, se te reconoce.'],
              ['Una tela anudada a la japonesa, por probar', 'Oh, un nudo que no conocía.'],
              ['Lo que haya por el armario', 'Misión apaño cumplida.'],
            ],
          },
          pt: {
            t: 'Para embrulhar, você usa…',
            o: 'Pergunte qual é o truque de embrulho favorito dessa pessoa.',
            a: [
              ['O mesmo papel de sempre', 'Sua marca registrada.'],
              ['Um tecido amarrado ao estilo japonês, para testar', 'Ooh, um nó que eu não conhecia.'],
              ['O que estiver sobrando no armário', 'Missão improviso cumprida.'],
            ],
          },
          nl: {
            t: 'Om in te pakken, gebruik je…',
            o: 'Vraag naar de favoriete inpaktruc van die persoon.',
            a: [
              ['Hetzelfde papier als altijd', 'Jouw handtekening, herkenbaar.'],
              ['Een Japans geknoopte doek, om te proberen', 'Ooh, een knoop die ik nog niet kende.'],
              ['Wat er nog in de kast ligt', 'Missie improviseren geslaagd.'],
            ],
          },
        }),
        c('cadeaux_carte', 'elan', [['🙃', -70, null], ['✍️', 60, 'projets'], ['😊', -20, null]], {
          fr: {
            t: 'Avec le cadeau, tu glisses une carte ?',
            o: 'Demande-lui ce qu’elle ou il aime écrire sur une carte de vœux.',
            a: [
              ['Pas de carte, le cadeau parle tout seul', 'Le silence est d’or… et de papier cadeau.'],
              ['Oui, un vrai texte que je peaufine', 'Je sors mon plus beau stylo.'],
              ['Un simple « Bon anniversaire ! »', 'Court et efficace, j’aime.'],
            ],
          },
          en: {
            t: 'Do you slip a card in with the present?',
            o: 'Ask them what they like to write in a card.',
            a: [
              ['No card, the gift speaks for itself', 'Silence is golden… and gift-wrapped.'],
              ['Yes, a proper message I polish', 'I’ll fetch my fanciest pen.'],
              ['A simple “Happy birthday!”', 'Short and sweet, I like it.'],
            ],
          },
          es: {
            t: 'Con el regalo, ¿metes una tarjeta?',
            o: 'Pregúntale qué le gusta escribir en una tarjeta.',
            a: [
              ['Sin tarjeta, el regalo habla solo', 'El silencio es oro… y papel de regalo.'],
              ['Sí, un texto de verdad que pulo', 'Saco mi mejor boli.'],
              ['Un simple «¡Feliz cumpleaños!»', 'Corto y eficaz, me gusta.'],
            ],
          },
          pt: {
            t: 'Junto com o presente, você coloca um cartão?',
            o: 'Pergunte o que essa pessoa gosta de escrever num cartão.',
            a: [
              ['Sem cartão, o presente fala por si', 'O silêncio é de ouro… e de papel de presente.'],
              ['Sim, um texto caprichado', 'Vou pegar minha caneta mais bonita.'],
              ['Um simples “Feliz aniversário!”', 'Curto e certeiro, gosto.'],
            ],
          },
          nl: {
            t: 'Doe je een kaartje bij het cadeau?',
            o: 'Vraag wat die persoon graag op een kaartje schrijft.',
            a: [
              ['Geen kaartje, het cadeau spreekt voor zich', 'Zwijgen is goud… en ingepakt.'],
              ['Ja, een echte tekst waar ik aan schaaf', 'Ik pak mijn mooiste pen.'],
              ['Gewoon “Gefeliciteerd!”', 'Kort en krachtig, fijn.'],
            ],
          },
        }),
        c('cadeaux_atelier_paquets', 'foyer', [['🫶', 70, 'accueil'], ['🚪', -60, 'liberte']], {
          fr: {
            t: 'Pour emballer une pile de cadeaux, tu t’installes…',
            o: 'Demande-lui si elle ou il aime emballer à plusieurs.',
            a: [
              ['Avec des proches, à la chaîne', 'Je tiens le scotch, tu coupes !'],
              ['Tranquille dans mon coin, porte fermée', 'Zone secrète, entrée interdite.'],
            ],
          },
          en: {
            t: 'To wrap a pile of presents, you settle in…',
            o: 'Ask them whether they like wrapping with other people.',
            a: [
              ['With loved ones, like a production line', 'I’ll hold the tape, you cut!'],
              ['Quietly on my own, door shut', 'Top secret zone, no entry.'],
            ],
          },
          es: {
            t: 'Para envolver un montón de regalos, te pones…',
            o: 'Pregúntale si le gusta envolver regalos en compañía.',
            a: [
              ['Con mi gente, en cadena', '¡Yo sujeto el celo, tú cortas!'],
              ['A mi aire en mi rincón, puerta cerrada', 'Zona secreta, prohibido pasar.'],
            ],
          },
          pt: {
            t: 'Para embrulhar uma pilha de presentes, você fica…',
            o: 'Pergunte se essa pessoa gosta de embrulhar presentes junto com outras.',
            a: [
              ['Com gente querida, em linha de produção', 'Eu seguro a fita, você corta!'],
              ['No meu canto, de porta fechada', 'Zona secreta, entrada proibida.'],
            ],
          },
          nl: {
            t: 'Om een stapel cadeaus in te pakken, ga je zitten…',
            o: 'Vraag of die persoon graag samen met anderen inpakt.',
            a: [
              ['Met dierbaren, aan de lopende band', 'Ik houd het plakband vast, jij knipt!'],
              ['Rustig in mijn eentje, deur dicht', 'Geheime zone, verboden toegang.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_3',
      title: { fr: 'Le moment d’offrir', en: 'Giving time', es: 'El momento de regalar', pt: 'A hora de dar', nl: 'Het moment van geven' },
      questions: [
        c('cadeaux_attendre', 'cap', [['🎁', -70, 'spontane'], ['🗓️', 60, 'plan']], {
          fr: {
            t: 'Ton cadeau est prêt bien avant le jour J. Tu…',
            o: 'Demande-lui si elle ou il arrive à garder un cadeau jusqu’au bon jour.',
            a: [
              ['Craques et l’offres tout de suite', 'Impossible d’attendre, je comprends !'],
              ['Attends sagement la date prévue', 'Patience, le grand jour arrive.'],
            ],
          },
          en: {
            t: 'Your gift is ready well before the big day. You…',
            o: 'Ask them whether they can hold on to a gift until the right day.',
            a: [
              ['Cave in and give it straight away', 'Waiting is impossible, I get it!'],
              ['Wait patiently for the planned date', 'Patience, the big day is coming.'],
            ],
          },
          es: {
            t: 'Tu regalo está listo mucho antes del gran día. Tú…',
            o: 'Pregúntale si aguanta con un regalo guardado hasta el día.',
            a: [
              ['No aguantas y lo das ya', '¡Imposible esperar, lo entiendo!'],
              ['Esperas con calma a la fecha', 'Paciencia, el gran día llega.'],
            ],
          },
          pt: {
            t: 'Seu presente está pronto bem antes do grande dia. Você…',
            o: 'Pergunte se essa pessoa consegue guardar um presente até o dia certo.',
            a: [
              ['Não aguenta e entrega na hora', 'Impossível esperar, entendo!'],
              ['Espera direitinho a data marcada', 'Paciência, o grande dia está chegando.'],
            ],
          },
          nl: {
            t: 'Je cadeau is al lang klaar vóór de grote dag. Je…',
            o: 'Vraag of die persoon een cadeau kan bewaren tot de juiste dag.',
            a: [
              ['Bezwijkt en geeft het meteen', 'Wachten lukt gewoon niet, snap ik!'],
              ['Wacht braaf tot de geplande datum', 'Geduld, de grote dag komt eraan.'],
            ],
          },
        }),
        s('cadeaux_remise', 'rythme', ['🕯️', -100, 'cocooning'], ['🥳', 100, 'fete'], {
          fr: { t: 'Offrir un cadeau, tu le fais plutôt…', o: 'Demande-lui comment elle ou il aime remettre un cadeau.', a: [['En tête-à-tête, tout doucement', 'Un moment tout doux.'], ['En pleine fête, devant tout le monde', 'Roulement de tambour !']], m: 'Ça dépend du cadeau.' },
          en: { t: 'When you give a gift, you’d rather…', o: 'Ask them how they like to hand over a gift.', a: [['Do it one-to-one, quietly', 'A soft little moment.'], ['Do it mid-party, in front of everyone', 'Drum roll, please!']], m: 'Depends on the gift.' },
          es: { t: 'Dar un regalo, lo haces más bien…', o: 'Pregúntale cómo le gusta entregar un regalo.', a: [['A solas, con calma', 'Un momento muy tierno.'], ['En plena fiesta, delante de todos', '¡Redoble de tambores!']], m: 'Depende del regalo.' },
          pt: { t: 'Dar um presente, você prefere…', o: 'Pergunte como essa pessoa gosta de entregar um presente.', a: [['A sós, com calma', 'Um momento fofinho.'], ['No meio da festa, na frente de todos', 'Rufem os tambores!']], m: 'Depende do presente.' },
          nl: { t: 'Een cadeau geven doe je het liefst…', o: 'Vraag hoe die persoon graag een cadeau overhandigt.', a: [['Onder vier ogen, rustig', 'Een zacht momentje.'], ['Midden op het feest, voor iedereen', 'Tromgeroffel!']], m: 'Hangt van het cadeau af.' },
        }),
        c('cadeaux_mise_en_scene', 'elan', [['🤲', -50, 'temps_libre'], ['🗺️', 70, 'projets'], ['🎭', 10, 'humour']], {
          fr: {
            t: 'Pour offrir, tu montes une petite mise en scène ?',
            o: 'Demande-lui quelle est la remise de cadeau la plus folle qu’elle ou il a faite.',
            a: [
              ['Non, je le tends avec un sourire', 'Un sourire, c’est déjà un cadeau.'],
              ['Oui : chasse au trésor, indices, tout !', 'Je cherche le premier indice !'],
              ['Juste une petite blague avant', 'Hi hi, j’ai compris la blague.'],
            ],
          },
          en: {
            t: 'Do you stage a little show when you give a gift?',
            o: 'Ask them about the wildest way they’ve ever handed over a gift.',
            a: [
              ['No, I hand it over with a smile', 'A smile is a gift already.'],
              ['Yes: treasure hunt, clues, the lot!', 'I’m looking for the first clue!'],
              ['Just a little joke first', 'Hee hee, I got the joke.'],
            ],
          },
          es: {
            t: 'Para regalar, ¿montas un pequeño espectáculo?',
            o: 'Pregúntale cuál es la forma más loca en que ha dado un regalo.',
            a: [
              ['No, lo doy con una sonrisa', 'Una sonrisa ya es un regalo.'],
              ['Sí: búsqueda del tesoro, pistas, ¡todo!', '¡Busco la primera pista!'],
              ['Solo una bromita antes', 'Ji, ji, he pillado la broma.'],
            ],
          },
          pt: {
            t: 'Para dar o presente, você monta uma encenação?',
            o: 'Pergunte qual foi a entrega de presente mais maluca que essa pessoa já fez.',
            a: [
              ['Não, entrego com um sorriso', 'Um sorriso já é um presente.'],
              ['Sim: caça ao tesouro, pistas, tudo!', 'Estou procurando a primeira pista!'],
              ['Só uma piadinha antes', 'Hi hi, entendi a piada.'],
            ],
          },
          nl: {
            t: 'Maak je er een klein toneelstukje van als je iets geeft?',
            o: 'Vraag wat de gekste manier is waarop die persoon ooit een cadeau gaf.',
            a: [
              ['Nee, ik geef het met een glimlach', 'Een glimlach is al een cadeau.'],
              ['Ja: speurtocht, hints, alles!', 'Ik zoek de eerste hint!'],
              ['Alleen een grapje vooraf', 'Hihi, ik snap de grap.'],
            ],
          },
        }),
        c('cadeaux_commun', 'foyer', [['🤝', 60, 'famille'], ['🎈', -50, 'liberte']], {
          fr: {
            t: 'Pour l’anniversaire d’une amie ou d’un ami, tu offres plutôt…',
            o: 'Demande-lui si elle ou il préfère les cadeaux communs ou perso.',
            a: [
              ['Un cadeau commun avec toute la bande', 'Tous ensemble, c’est plus fort !'],
              ['Mon propre cadeau, choisi à ma façon', 'Ta petite touche perso, j’adore.'],
            ],
          },
          en: {
            t: 'For a friend’s birthday, you’d rather give…',
            o: 'Ask them whether they prefer group gifts or personal ones.',
            a: [
              ['A joint gift with the whole gang', 'All together, we’re stronger!'],
              ['My own gift, chosen my way', 'Your personal touch, love it.'],
            ],
          },
          es: {
            t: 'Para el cumple de una amiga o un amigo, regalas más bien…',
            o: 'Pregúntale si prefiere los regalos en grupo o personales.',
            a: [
              ['Un regalo común con todo el grupo', '¡Todos juntos, mejor!'],
              ['Mi propio regalo, a mi manera', 'Tu toque personal, me encanta.'],
            ],
          },
          pt: {
            t: 'No aniversário de uma amiga ou amigo, você dá mais…',
            o: 'Pergunte se essa pessoa prefere presentes coletivos ou individuais.',
            a: [
              ['Um presente coletivo com a turma toda', 'Todo mundo junto, é mais forte!'],
              ['Meu próprio presente, do meu jeito', 'Seu toque pessoal, adoro.'],
            ],
          },
          nl: {
            t: 'Voor de verjaardag van een vriend of vriendin geef je liever…',
            o: 'Vraag of die persoon liever een groepscadeau of iets persoonlijks geeft.',
            a: [
              ['Een groepscadeau met de hele club', 'Samen staan we sterk!'],
              ['Mijn eigen cadeau, op mijn manier', 'Jouw persoonlijke touch, top.'],
            ],
          },
        }),
        c('cadeaux_classique', 'ancrage', [['🧸', -60, 'racines'], ['🪐', 70, 'curiosite'], ['🍫', -20, 'cuisine']], {
          fr: {
            t: 'Tu offres plutôt…',
            o: 'Demande-lui quel cadeau étonnant elle ou il a déjà offert.',
            a: [
              ['Un classique qui plaît à coup sûr', 'Valeur sûre, sourire garanti.'],
              ['Un truc étonnant que la personne ne connaît pas', 'Surprise ! C’est quoi, ce machin ?'],
              ['Une gourmandise, ça marche toujours', 'Je peux goûter ? Juste un bout ?'],
            ],
          },
          en: {
            t: 'You tend to give…',
            o: 'Ask them about the most surprising gift they’ve ever given.',
            a: [
              ['A classic that’s sure to please', 'A safe bet, smiles guaranteed.'],
              ['Something unusual they’ve never seen', 'Surprise! What on earth is that?'],
              ['A tasty treat, it always works', 'Can I try? Just a nibble?'],
            ],
          },
          es: {
            t: 'Sueles regalar…',
            o: 'Pregúntale cuál es el regalo más sorprendente que ha hecho.',
            a: [
              ['Un clásico que siempre gusta', 'Apuesta segura, sonrisa garantizada.'],
              ['Algo curioso que la persona no conoce', '¡Sorpresa! ¿Qué es este cacharro?'],
              ['Algo rico, nunca falla', '¿Puedo probar? ¿Un trocito?'],
            ],
          },
          pt: {
            t: 'Você costuma dar…',
            o: 'Pergunte qual foi o presente mais surpreendente que essa pessoa já deu.',
            a: [
              ['Um clássico que sempre agrada', 'Aposta certa, sorriso garantido.'],
              ['Algo inusitado que a pessoa não conhece', 'Surpresa! O que é essa coisa?'],
              ['Uma gostosura, nunca falha', 'Posso provar? Só um pedacinho?'],
            ],
          },
          nl: {
            t: 'Je geeft meestal…',
            o: 'Vraag wat het verrassendste cadeau is dat die persoon ooit gaf.',
            a: [
              ['Een klassieker die altijd goed valt', 'Een veilige keuze, glimlach gegarandeerd.'],
              ['Iets verrassends dat de ander niet kent', 'Verrassing! Wat is dit nou weer?'],
              ['Iets lekkers, dat werkt altijd', 'Mag ik proeven? Een klein hapje?'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_4',
      title: { fr: 'Recevoir', en: 'Receiving', es: 'Recibir', pt: 'Receber', nl: 'Krijgen' },
      questions: [
        c('cadeaux_ouvrir', 'cap', [['💥', -70, 'spontane'], ['✂️', 60, 'ordre'], ['👂', 10, null]], {
          fr: {
            t: 'On te tend un cadeau. Tu l’ouvres…',
            o: 'Demande-lui comment elle ou il ouvre un cadeau.',
            a: [
              ['En déchirant tout, tout de suite', 'Des confettis de papier partout !'],
              ['Délicatement, je garde le papier', 'Pas une déchirure, chapeau.'],
              ['Je le secoue d’abord pour deviner', 'Ça fait gling gling… un indice ?'],
            ],
          },
          en: {
            t: 'Someone hands you a present. You open it…',
            o: 'Ask them how they open a present.',
            a: [
              ['Tearing everything, right away', 'Paper confetti everywhere!'],
              ['Carefully, saving the paper', 'Not a single rip, hats off.'],
              ['I shake it first to guess', 'It goes jingle jingle… a clue?'],
            ],
          },
          es: {
            t: 'Te dan un regalo. Lo abres…',
            o: 'Pregúntale cómo abre un regalo.',
            a: [
              ['Rompiéndolo todo, ya', '¡Confeti de papel por todas partes!'],
              ['Con cuidado, guardo el papel', 'Ni un rasguño, chapó.'],
              ['Primero lo agito para adivinar', 'Suena tilín tilín… ¿una pista?'],
            ],
          },
          pt: {
            t: 'Alguém te entrega um presente. Você abre…',
            o: 'Pergunte como essa pessoa abre um presente.',
            a: [
              ['Rasgando tudo, na hora', 'Confete de papel para todo lado!'],
              ['Com cuidado, guardo o papel', 'Nem um rasgo, parabéns.'],
              ['Primeiro sacudo para adivinhar', 'Faz plim plim… uma pista?'],
            ],
          },
          nl: {
            t: 'Iemand geeft je een cadeau. Je maakt het open…',
            o: 'Vraag hoe die persoon een cadeau openmaakt.',
            a: [
              ['Alles scheuren, meteen', 'Overal papiersnippers!'],
              ['Voorzichtig, ik bewaar het papier', 'Geen scheurtje, petje af.'],
              ['Eerst schudden om te raden', 'Het rammelt… een hint?'],
            ],
          },
        }),
        s('cadeaux_centre', 'rythme', ['🫣', -100, 'calme'], ['🌟', 100, 'fete'], {
          fr: { t: 'Être au centre de l’attention quand tu ouvres un cadeau…', o: 'Demande-lui comment elle ou il vit le moment où tout le monde la ou le regarde.', a: [['Je préfère ouvrir plus tard, au calme', 'On se cache sous le plaid ?'], ['J’adore, applaudissez !', 'Bravo ! Bravo ! Une ovation !']], m: 'Ça va, tant que ça ne dure pas.' },
          en: { t: 'Being the centre of attention while opening a gift…', o: 'Ask them how they feel when everyone’s watching them.', a: [['I’d rather open it later, in peace', 'Shall we hide under the blanket?'], ['Love it, round of applause!', 'Bravo! Bravo! A standing ovation!']], m: 'Fine, as long as it doesn’t last.' },
          es: { t: 'Ser el centro de atención al abrir un regalo…', o: 'Pregúntale cómo vive el momento en que todos le miran.', a: [['Prefiero abrirlo luego, con calma', '¿Nos escondemos bajo la manta?'], ['Me encanta, ¡aplausos!', '¡Bravo! ¡Bravo! ¡Ovación!']], m: 'Bien, mientras no dure mucho.' },
          pt: { t: 'Ser o centro das atenções ao abrir um presente…', o: 'Pergunte como essa pessoa se sente quando todo mundo está olhando.', a: [['Prefiro abrir depois, com calma', 'Vamos nos esconder debaixo da manta?'], ['Adoro, aplausos!', 'Bravo! Bravo! Ovação!']], m: 'Tudo bem, desde que seja rapidinho.' },
          nl: { t: 'In het middelpunt staan als je een cadeau openmaakt…', o: 'Vraag hoe die persoon het vindt als iedereen kijkt.', a: [['Ik maak het liever later rustig open', 'Kruipen we onder het dekentje?'], ['Heerlijk, applaus!', 'Bravo! Bravo! Een staande ovatie!']], m: 'Prima, als het maar kort duurt.' },
        }),
        c('cadeaux_reve', 'ancrage', [['🏡', -60, 'racines'], ['🧳', 70, 'voyage'], ['📚', 30, 'curiosite']], {
          fr: {
            t: 'Le cadeau qui te ferait sauter de joie ?',
            o: 'Demande-lui quel cadeau la ou le ferait sauter de joie.',
            a: [
              ['Un bel objet pour mon chez-moi', 'Il ira parfaitement sur l’étagère.'],
              ['Un billet pour une ville inconnue', 'Je me glisse dans ta valise !'],
              ['Un livre sur un sujet tout nouveau', 'Tu me raconteras chaque chapitre ?'],
            ],
          },
          en: {
            t: 'The gift that would make you jump for joy?',
            o: 'Ask them which gift would make them jump for joy.',
            a: [
              ['Something lovely for my home', 'It’ll look perfect on the shelf.'],
              ['A ticket to a city I don’t know', 'I’m sneaking into your suitcase!'],
              ['A book on a brand-new subject', 'Will you tell me every chapter?'],
            ],
          },
          es: {
            t: '¿El regalo que te haría saltar de alegría?',
            o: 'Pregúntale qué regalo le haría saltar de alegría.',
            a: [
              ['Algo bonito para mi casa', 'Quedará perfecto en la estantería.'],
              ['Un billete a una ciudad desconocida', '¡Me cuelo en tu maleta!'],
              ['Un libro sobre un tema nuevo', '¿Me contarás cada capítulo?'],
            ],
          },
          pt: {
            t: 'O presente que faria você pular de alegria?',
            o: 'Pergunte qual presente faria essa pessoa pular de alegria.',
            a: [
              ['Algo bonito para a minha casa', 'Vai ficar perfeito na estante.'],
              ['Uma passagem para uma cidade desconhecida', 'Vou entrar escondido na sua mala!'],
              ['Um livro sobre um assunto novo', 'Você me conta cada capítulo?'],
            ],
          },
          nl: {
            t: 'Het cadeau waar je een gat van in de lucht springt?',
            o: 'Vraag van welk cadeau die persoon een gat in de lucht zou springen.',
            a: [
              ['Iets moois voor in huis', 'Dat staat perfect op de plank.'],
              ['Een ticket naar een onbekende stad', 'Ik kruip in je koffer!'],
              ['Een boek over een gloednieuw onderwerp', 'Vertel je me elk hoofdstuk?'],
            ],
          },
        }),
        c('cadeaux_montrer', 'foyer', [['🗝️', -60, 'liberte'], ['📣', 70, 'accueil']], {
          fr: {
            t: 'Tu viens de recevoir un super cadeau. Tu…',
            o: 'Demande-lui quel cadeau reçu l’a rendu le plus fier ou la plus fière.',
            a: [
              ['Le savoures pour toi, dans ta bulle', 'Un petit bonheur rien qu’à toi.'],
              ['Files le montrer à tout le monde', 'Regardez ! Regardez !'],
            ],
          },
          en: {
            t: 'You’ve just received a great gift. You…',
            o: 'Ask them which gift they were proudest to show off.',
            a: [
              ['Enjoy it on your own, in your bubble', 'A little joy just for you.'],
              ['Rush to show it to everyone', 'Look! Look!'],
            ],
          },
          es: {
            t: 'Acabas de recibir un regalazo. Tú…',
            o: 'Pregúntale qué regalo le ha hecho más ilusión enseñar.',
            a: [
              ['Lo disfrutas en tu burbuja', 'Una alegría solo para ti.'],
              ['Corres a enseñárselo a todo el mundo', '¡Mirad! ¡Mirad!'],
            ],
          },
          pt: {
            t: 'Você acabou de ganhar um presentão. Você…',
            o: 'Pergunte qual presente essa pessoa mais teve orgulho de mostrar.',
            a: [
              ['Aproveita na sua bolha', 'Uma alegria só sua.'],
              ['Corre para mostrar para todo mundo', 'Olha! Olha!'],
            ],
          },
          nl: {
            t: 'Je hebt net een geweldig cadeau gekregen. Je…',
            o: 'Vraag welk cadeau die persoon het trotst liet zien.',
            a: [
              ['Geniet ervan in je eigen bubbel', 'Een geluksmomentje voor jou alleen.'],
              ['Rent om het aan iedereen te laten zien', 'Kijk! Kijk!'],
            ],
          },
        }),
        s('cadeaux_utile', 'elan', ['🛋️', -100, 'temps_libre'], ['🎯', 100, 'projets'], {
          fr: { t: 'Un cadeau idéal pour toi, c’est…', o: 'Demande-lui quel cadeau lui a vraiment servi.', a: [['Un truc pour buller et profiter', 'Vive le hamac !'], ['Un outil pour un projet qui me tient', 'On démarre le chantier quand ?']], m: 'Un peu des deux, si possible !' },
          en: { t: 'The ideal gift for you is…', o: 'Ask them about a gift that turned out really useful.', a: [['Something to laze about and enjoy', 'Long live the hammock!'], ['A tool for a project I care about', 'When do we start?']], m: 'A bit of both, if possible!' },
          es: { t: 'Para ti, el regalo ideal es…', o: 'Pregúntale qué regalo le ha sido realmente útil.', a: [['Algo para remolonear y disfrutar', '¡Viva la hamaca!'], ['Una herramienta para un proyecto mío', '¿Cuándo empezamos?']], m: '¡Un poco de todo, si se puede!' },
          pt: { t: 'O presente ideal para você é…', o: 'Pergunte qual presente foi realmente útil para essa pessoa.', a: [['Algo para relaxar e curtir', 'Viva a rede!'], ['Uma ferramenta para um projeto meu', 'Quando a gente começa?']], m: 'Um pouco de cada, se der!' },
          nl: { t: 'Het ideale cadeau voor jou is…', o: 'Vraag welk cadeau die persoon echt goed van pas kwam.', a: [['Iets om lekker te luieren', 'Leve de hangmat!'], ['Gereedschap voor een project van mij', 'Wanneer beginnen we?']], m: 'Een beetje van allebei, graag!' },
        }),
      ],
    },
    {
      id: 'cadeaux_5',
      title: { fr: 'Les surprises', en: 'Surprises', es: 'Las sorpresas', pt: 'As surpresas', nl: 'Verrassingen' },
      questions: [
        s('cadeaux_fete_surprise', 'cap', ['😱', -100, 'spontane'], ['🗒️', 100, 'plan'], {
          fr: { t: 'Une fête surprise organisée pour toi, c’est…', o: 'Demande-lui ce qu’elle ou il pense des fêtes surprises.', a: [['Génial, j’adore l’imprévu', 'Surpriiiise !'], ['Stressant, je préfère savoir', 'Je te glisse le programme en douce.']], m: 'Sympa, si on me prévient un peu.' },
          en: { t: 'A surprise party thrown for you is…', o: 'Ask them what they think of surprise parties.', a: [['Brilliant, I love the unexpected', 'Surpriiiise!'], ['Stressful, I’d rather know', 'I’ll slip you the schedule secretly.']], m: 'Nice, with a little heads-up.' },
          es: { t: 'Una fiesta sorpresa para ti es…', o: 'Pregúntale qué opina de las fiestas sorpresa.', a: [['Genial, me encanta lo imprevisto', '¡Sorpreeesa!'], ['Estresante, prefiero saberlo', 'Te paso el programa a escondidas.']], m: 'Bien, si me avisan un poco.' },
          pt: { t: 'Uma festa surpresa para você é…', o: 'Pergunte o que essa pessoa acha de festas surpresa.', a: [['Incrível, adoro o inesperado', 'Surpreeesa!'], ['Estressante, prefiro saber', 'Te passo a programação escondido.']], m: 'Legal, se me avisarem um pouco.' },
          nl: { t: 'Een verrassingsfeest voor jou is…', o: 'Vraag wat die persoon van verrassingsfeestjes vindt.', a: [['Geweldig, ik hou van het onverwachte', 'Verrassiiing!'], ['Stressvol, ik weet het liever', 'Ik stop je stiekem het programma toe.']], m: 'Leuk, als ik een seintje krijg.' },
        }),
        c('cadeaux_complices', 'foyer', [['👥', 70, 'famille'], ['🤐', -60, 'liberte'], ['🤫', 10, null]], {
          fr: {
            t: 'Tu prépares une surprise. Tu mets dans le secret…',
            o: 'Demande-lui si elle ou il sait garder un secret de surprise.',
            a: [
              ['Toute la bande, c’est plus drôle', 'Réunion secrète à minuit !'],
              ['Personne, je gère tout', 'Agent très spécial en mission.'],
              ['Une seule personne complice', 'Un duo de choc, chut !'],
            ],
          },
          en: {
            t: 'You’re planning a surprise. You let in on the secret…',
            o: 'Ask them whether they can keep a surprise secret.',
            a: [
              ['The whole gang, it’s more fun', 'Secret meeting at midnight!'],
              ['Nobody, I handle everything', 'Very special agent on a mission.'],
              ['Just one accomplice', 'A dream team of two, shh!'],
            ],
          },
          es: {
            t: 'Preparas una sorpresa. Pones al tanto…',
            o: 'Pregúntale si sabe guardar el secreto de una sorpresa.',
            a: [
              ['A todo el grupo, es más divertido', '¡Reunión secreta a medianoche!'],
              ['A nadie, lo llevo yo todo', 'Agente muy especial en misión.'],
              ['A una sola persona cómplice', 'Un dúo de lujo, ¡chis!'],
            ],
          },
          pt: {
            t: 'Você prepara uma surpresa. Conta o segredo para…',
            o: 'Pergunte se essa pessoa sabe guardar segredo de surpresa.',
            a: [
              ['A turma toda, é mais divertido', 'Reunião secreta à meia-noite!'],
              ['Ninguém, eu cuido de tudo', 'Agente muito especial em missão.'],
              ['Uma única pessoa cúmplice', 'Uma dupla imbatível, psiu!'],
            ],
          },
          nl: {
            t: 'Je bereidt een verrassing voor. Je vertelt het geheim aan…',
            o: 'Vraag of die persoon een verrassing geheim kan houden.',
            a: [
              ['De hele groep, dat is leuker', 'Geheime vergadering om middernacht!'],
              ['Niemand, ik regel alles zelf', 'Heel speciaal agent op missie.'],
              ['Eén handlanger', 'Een topduo, sst!'],
            ],
          },
        }),
        c('cadeaux_surprise_ideale', 'rythme', [['🎬', -30, 'cocooning'], ['🎊', 80, 'fete'], ['🧺', -60, 'calme']], {
          fr: {
            t: 'La surprise parfaite pour toi ?',
            o: 'Demande-lui quelle est la plus belle surprise qu’on lui a faite.',
            a: [
              ['Un film et un plaid déjà installés', 'J’ai même fait le pop-corn.'],
              ['Une fête avec plein de monde', 'Les ballons sont gonflés !'],
              ['Un pique-nique tranquille avec quelqu’un de cher', 'Je porte le panier, promis.'],
            ],
          },
          en: {
            t: 'The perfect surprise for you?',
            o: 'Ask them about the best surprise anyone ever gave them.',
            a: [
              ['A film and a blanket all set up', 'I even made the popcorn.'],
              ['A party with loads of people', 'The balloons are blown up!'],
              ['A quiet picnic with someone dear', 'I’ll carry the basket, promise.'],
            ],
          },
          es: {
            t: '¿La sorpresa perfecta para ti?',
            o: 'Pregúntale cuál es la mejor sorpresa que le han dado.',
            a: [
              ['Una peli y una manta ya preparadas', 'Hasta he hecho palomitas.'],
              ['Una fiesta con mucha gente', '¡Los globos ya están inflados!'],
              ['Un pícnic tranquilo con alguien querido', 'Yo llevo la cesta, prometido.'],
            ],
          },
          pt: {
            t: 'A surpresa perfeita para você?',
            o: 'Pergunte qual foi a melhor surpresa que essa pessoa já ganhou.',
            a: [
              ['Um filme e uma manta já arrumados', 'Até fiz a pipoca.'],
              ['Uma festa com muita gente', 'Os balões já estão cheios!'],
              ['Um piquenique tranquilo com alguém querido', 'Eu levo a cesta, prometo.'],
            ],
          },
          nl: {
            t: 'De perfecte verrassing voor jou?',
            o: 'Vraag wat de mooiste verrassing is die die persoon ooit kreeg.',
            a: [
              ['Een film en een dekentje, al klaargezet', 'Ik heb zelfs popcorn gemaakt.'],
              ['Een feest met heel veel mensen', 'De ballonnen zijn opgeblazen!'],
              ['Een rustige picknick met iemand die me dierbaar is', 'Ik draag de mand, beloofd.'],
            ],
          },
        }),
        c('cadeaux_yeux_bandes', 'ancrage', [['🗺️', 70, 'aventure'], ['🍝', -60, 'racines']], {
          fr: {
            t: 'On t’emmène les yeux bandés vers une surprise. Tu espères…',
            o: 'Demande-lui où elle ou il rêverait d’aller par surprise.',
            a: [
              ['Un endroit totalement inconnu', 'Aventure en vue, capitaine !'],
              ['Mon resto préféré de toujours', 'Je sens déjà les bonnes odeurs.'],
            ],
          },
          en: {
            t: 'You’re led blindfolded towards a surprise. You hope it’s…',
            o: 'Ask them where they’d love to be whisked off to by surprise.',
            a: [
              ['Somewhere totally unknown', 'Adventure ahoy, captain!'],
              ['My all-time favourite restaurant', 'I can already smell it.'],
            ],
          },
          es: {
            t: 'Te llevan con los ojos vendados a una sorpresa. Esperas…',
            o: 'Pregúntale adónde le gustaría que le llevaran por sorpresa.',
            a: [
              ['Un sitio totalmente desconocido', '¡Aventura a la vista, capitán!'],
              ['Mi restaurante favorito de siempre', 'Ya huelo lo rico.'],
            ],
          },
          pt: {
            t: 'Te levam de olhos vendados para uma surpresa. Você torce por…',
            o: 'Pergunte para onde essa pessoa gostaria de ser levada de surpresa.',
            a: [
              ['Um lugar totalmente desconhecido', 'Aventura à vista, capitão!'],
              ['Meu restaurante favorito de sempre', 'Já sinto o cheirinho.'],
            ],
          },
          nl: {
            t: 'Je wordt geblinddoekt naar een verrassing gebracht. Je hoopt op…',
            o: 'Vraag waar die persoon graag mee naartoe genomen zou worden als verrassing.',
            a: [
              ['Een totaal onbekende plek', 'Avontuur in zicht, kapitein!'],
              ['Mijn favoriete restaurant van altijd', 'Ik ruik het al.'],
            ],
          },
        }),
        c('cadeaux_preparation', 'elan', [['🍰', -50, 'temps_libre'], ['🏗️', 70, 'projets']], {
          fr: {
            t: 'Pour réussir une surprise, tu choisis…',
            o: 'Demande-lui quelle surprise elle ou il a mis le plus de temps à préparer.',
            a: [
              ['Faire simple : un gâteau et basta', 'Un gâteau, c’est déjà la fête.'],
              ['Des semaines de préparation', 'Opération secrète, phase 12.'],
            ],
          },
          en: {
            t: 'To pull off a surprise, you’re up for…',
            o: 'Ask them which surprise took them longest to prepare.',
            a: [
              ['Keeping it simple: a cake, done', 'A cake is already a party.'],
              ['Weeks of preparation', 'Secret operation, phase 12.'],
            ],
          },
          es: {
            t: 'Para que una sorpresa salga bien, te apuntas a…',
            o: 'Pregúntale qué sorpresa le costó más tiempo preparar.',
            a: [
              ['Algo sencillo: una tarta y listo', 'Una tarta ya es una fiesta.'],
              ['Semanas de preparación', 'Operación secreta, fase 12.'],
            ],
          },
          pt: {
            t: 'Para uma surpresa dar certo, você topa…',
            o: 'Pergunte qual surpresa essa pessoa mais demorou para preparar.',
            a: [
              ['Algo simples: um bolo e pronto', 'Um bolo já é uma festa.'],
              ['Semanas de preparação', 'Operação secreta, fase 12.'],
            ],
          },
          nl: {
            t: 'Voor een geslaagde verrassing ben je in voor…',
            o: 'Vraag welke verrassing die persoon het langst voorbereidde.',
            a: [
              ['Simpel houden: een taart en klaar', 'Een taart is al een feestje.'],
              ['Wekenlange voorbereiding', 'Geheime operatie, fase 12.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_6',
      title: { fr: 'Les anniversaires', en: 'Birthdays', es: 'Los cumpleaños', pt: 'Os aniversários', nl: 'Verjaardagen' },
      questions: [
        c('cadeaux_ton_anniv', 'rythme', [['🛁', -70, 'cocooning'], ['🪩', 80, 'fete'], ['🍽️', 10, 'cuisine']], {
          fr: {
            t: 'Pour ton anniversaire, tu rêves de…',
            o: 'Demande-lui à quoi ressemble son anniversaire idéal.',
            a: [
              ['Une journée tranquille, rien que pour moi', 'Bain moussant et chaussons, validé.'],
              ['Une grande fête jusqu’au bout de la nuit', 'Je sors mes plus beaux pas de danse !'],
              ['Un dîner avec quelques proches', 'Je mets les petits plats dans les grands.'],
            ],
          },
          en: {
            t: 'For your birthday, you dream of…',
            o: 'Ask them what their ideal birthday looks like.',
            a: [
              ['A quiet day, just for me', 'Bubble bath and slippers, approved.'],
              ['A big party until the small hours', 'Time for my best dance moves!'],
              ['Dinner with a few close friends', 'I’ll bring out the good plates.'],
            ],
          },
          es: {
            t: 'Para tu cumpleaños, sueñas con…',
            o: 'Pregúntale cómo sería su cumpleaños ideal.',
            a: [
              ['Un día tranquilo, solo para mí', 'Baño de espuma y zapatillas, aprobado.'],
              ['Una gran fiesta hasta el amanecer', '¡Saco mis mejores pasos de baile!'],
              ['Una cena con unos pocos íntimos', 'Saco la vajilla buena.'],
            ],
          },
          pt: {
            t: 'No seu aniversário, você sonha com…',
            o: 'Pergunte como seria o aniversário ideal dessa pessoa.',
            a: [
              ['Um dia tranquilo, só para mim', 'Banho de espuma e pantufas, aprovado.'],
              ['Uma festa enorme até o amanhecer', 'Vou mostrar meus melhores passos!'],
              ['Um jantar com poucas pessoas queridas', 'Vou caprichar na mesa.'],
            ],
          },
          nl: {
            t: 'Voor je verjaardag droom je van…',
            o: 'Vraag hoe de ideale verjaardag van die persoon eruitziet.',
            a: [
              ['Een rustige dag, helemaal voor mij', 'Schuimbad en sloffen, goedgekeurd.'],
              ['Een groot feest tot diep in de nacht', 'Ik laat mijn beste danspasjes zien!'],
              ['Een etentje met een paar dierbaren', 'Ik pak het mooie servies.'],
            ],
          },
        }),
        s('cadeaux_rappel', 'cap', ['🫠', -100, 'spontane'], ['🔔', 100, 'plan'], {
          fr: { t: 'Les anniversaires des autres, tu les retiens…', o: 'Demande-lui comment elle ou il se souvient des anniversaires.', a: [['Au feeling, parfois en retard', 'Joyeux anniversaire… d’hier !'], ['Tous notés, avec des rappels', 'Ding ! Rappel n°47.']], m: 'Les plus importants, de tête.' },
          en: { t: 'Other people’s birthdays, you remember them…', o: 'Ask them how they keep track of birthdays.', a: [['By feel, sometimes late', 'Happy birthday… for yesterday!'], ['All noted, with reminders', 'Ding! Reminder no. 47.']], m: 'The important ones, by heart.' },
          es: { t: 'Los cumpleaños de los demás, los recuerdas…', o: 'Pregúntale cómo se acuerda de los cumpleaños.', a: [['A ojo, a veces tarde', 'Feliz cumpleaños… ¡de ayer!'], ['Todos apuntados, con avisos', '¡Ding! Aviso n.º 47.']], m: 'Los importantes, de memoria.' },
          pt: { t: 'Os aniversários dos outros, você lembra…', o: 'Pergunte como essa pessoa se lembra dos aniversários.', a: [['No feeling, às vezes atrasado', 'Feliz aniversário… de ontem!'], ['Todos anotados, com lembretes', 'Plim! Lembrete nº 47.']], m: 'Os mais importantes, de cabeça.' },
          nl: { t: 'De verjaardagen van anderen onthoud je…', o: 'Vraag hoe die persoon verjaardagen onthoudt.', a: [['Op gevoel, soms te laat', 'Gefeliciteerd… met gisteren!'], ['Allemaal genoteerd, met herinneringen', 'Ping! Herinnering nr. 47.']], m: 'De belangrijkste, uit mijn hoofd.' },
        }),
        c('cadeaux_gateau', 'ancrage', [['🍓', 10, 'cuisine'], ['🎂', -60, 'racines'], ['🍡', 70, 'curiosite']], {
          fr: {
            t: 'Le gâteau d’anniversaire idéal ?',
            o: 'Demande-lui quel est son gâteau d’anniversaire préféré.',
            a: [
              ['Peu importe, tant qu’il y a des fraises', 'Je pique la plus grosse fraise.'],
              ['Le même que quand j’étais petit ou petite', 'Le goût des souvenirs, miam.'],
              ['Une recette d’ailleurs, jamais goûtée', 'Une première bouchée pleine de mystère.'],
            ],
          },
          en: {
            t: 'The ideal birthday cake?',
            o: 'Ask them what their favourite birthday cake is.',
            a: [
              ['Anything, as long as there are strawberries', 'I’m nabbing the biggest strawberry.'],
              ['The same one I had as a kid', 'The taste of memories, yum.'],
              ['A recipe from elsewhere I’ve never tried', 'A first bite full of mystery.'],
            ],
          },
          es: {
            t: '¿La tarta de cumpleaños ideal?',
            o: 'Pregúntale cuál es su tarta de cumpleaños favorita.',
            a: [
              ['Me da igual, mientras lleve fresas', 'Me pido la fresa más grande.'],
              ['La misma que de pequeño o pequeña', 'Sabor a recuerdos, ñam.'],
              ['Una receta de fuera que no he probado', 'Un primer bocado lleno de misterio.'],
            ],
          },
          pt: {
            t: 'O bolo de aniversário ideal?',
            o: 'Pergunte qual é o bolo de aniversário favorito dessa pessoa.',
            a: [
              ['Tanto faz, desde que tenha morango', 'Vou pegar o maior morango.'],
              ['O mesmo da minha infância', 'Gosto de lembrança, hmm.'],
              ['Uma receita de outro país, nunca provada', 'Uma primeira garfada cheia de mistério.'],
            ],
          },
          nl: {
            t: 'De ideale verjaardagstaart?',
            o: 'Vraag wat de favoriete verjaardagstaart van die persoon is.',
            a: [
              ['Maakt niet uit, als er maar aardbeien op zitten', 'Ik pik de grootste aardbei.'],
              ['Dezelfde als toen ik klein was', 'De smaak van vroeger, mmm.'],
              ['Een recept van ver weg, nooit geproefd', 'Een eerste hap vol mysterie.'],
            ],
          },
        }),
        c('cadeaux_messages', 'foyer', [['📱', 60, 'famille'], ['🌿', -60, 'liberte']], {
          fr: {
            t: 'Le jour de ton anniversaire, les messages pleuvent. Tu…',
            o: 'Demande-lui comment elle ou il passe la journée de son anniversaire.',
            a: [
              ['Appelles tout le monde pour remercier', 'Allô, allô, merci, merci !'],
              ['Réponds demain, aujourd’hui je profite', 'Téléphone en mode nuage.'],
            ],
          },
          en: {
            t: 'On your birthday, the messages pour in. You…',
            o: 'Ask them how they spend their birthday.',
            a: [
              ['Call everyone to say thank you', 'Hello, hello, thanks, thanks!'],
              ['Reply tomorrow, today I’m enjoying myself', 'Phone on cloud mode.'],
            ],
          },
          es: {
            t: 'El día de tu cumple te llueven mensajes. Tú…',
            o: 'Pregúntale cómo pasa el día de su cumpleaños.',
            a: [
              ['Llamas a todo el mundo para dar las gracias', '¿Diga? ¡Gracias, gracias!'],
              ['Contestas mañana, hoy disfruto', 'Móvil en modo nube.'],
            ],
          },
          pt: {
            t: 'No dia do seu aniversário, chovem mensagens. Você…',
            o: 'Pergunte como essa pessoa passa o dia do aniversário.',
            a: [
              ['Liga para todo mundo agradecendo', 'Alô, alô, obrigado, obrigado!'],
              ['Responde amanhã, hoje é para curtir', 'Celular no modo nuvem.'],
            ],
          },
          nl: {
            t: 'Op je verjaardag regent het berichtjes. Je…',
            o: 'Vraag hoe die persoon de dag van de verjaardag doorbrengt.',
            a: [
              ['Belt iedereen om te bedanken', 'Hallo, hallo, dank je, dank je!'],
              ['Antwoordt morgen, vandaag geniet je', 'Telefoon op wolkjesstand.'],
            ],
          },
        }),
        c('cadeaux_nouvelle_annee', 'elan', [['☁️', -60, 'temps_libre'], ['🚀', 70, 'projets']], {
          fr: {
            t: 'Une nouvelle année de vie commence. Tu…',
            o: 'Demande-lui ce qu’elle ou il aimerait faire avant son prochain anniversaire.',
            a: [
              ['Ne prévois rien, tu savoures', 'Un an de plus de douceur.'],
              ['Te fixes un défi pour l’année', 'Je note : défi accepté !'],
            ],
          },
          en: {
            t: 'A new year of your life begins. You…',
            o: 'Ask them what they’d love to do before their next birthday.',
            a: [
              ['Plan nothing and savour it', 'One more year of sweetness.'],
              ['Set yourself a challenge for the year', 'Noted: challenge accepted!'],
            ],
          },
          es: {
            t: 'Empieza un nuevo año de vida. Tú…',
            o: 'Pregúntale qué le gustaría hacer antes de su próximo cumpleaños.',
            a: [
              ['No planeas nada, lo saboreas', 'Un año más de dulzura.'],
              ['Te pones un reto para el año', 'Apuntado: ¡reto aceptado!'],
            ],
          },
          pt: {
            t: 'Um novo ano de vida começa. Você…',
            o: 'Pergunte o que essa pessoa gostaria de fazer antes do próximo aniversário.',
            a: [
              ['Não planeja nada, só aproveita', 'Mais um ano de doçura.'],
              ['Se dá um desafio para o ano', 'Anotado: desafio aceito!'],
            ],
          },
          nl: {
            t: 'Er begint een nieuw levensjaar. Je…',
            o: 'Vraag wat die persoon nog wil doen vóór de volgende verjaardag.',
            a: [
              ['Plant niks en geniet', 'Weer een jaar vol zachtheid.'],
              ['Stelt jezelf een uitdaging voor het jaar', 'Genoteerd: uitdaging aangenomen!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_7',
      title: { fr: 'Offrir des moments', en: 'Giving experiences', es: 'Regalar momentos', pt: 'Dar momentos', nl: 'Momenten geven' },
      questions: [
        c('cadeaux_objet_moment', 'ancrage', [['🎁', -50, 'racines'], ['🎟️', 60, 'curiosite']], {
          fr: {
            t: 'Tu préfères offrir…',
            o: 'Demande-lui quel moment offert l’a le plus marqué.',
            a: [
              ['Un objet qu’on garde longtemps', 'Un trésor pour l’étagère.'],
              ['Une expérience à vivre', 'Un souvenir tout neuf en vue !'],
            ],
          },
          en: {
            t: 'You’d rather give…',
            o: 'Ask them which experience they were given that stuck with them most.',
            a: [
              ['An object to keep for ages', 'A treasure for the shelf.'],
              ['An experience to live', 'A brand-new memory on the way!'],
            ],
          },
          es: {
            t: 'Prefieres regalar…',
            o: 'Pregúntale qué experiencia regalada le marcó más.',
            a: [
              ['Un objeto para guardar mucho tiempo', 'Un tesoro para la estantería.'],
              ['Una experiencia para vivir', '¡Un recuerdo nuevo a la vista!'],
            ],
          },
          pt: {
            t: 'Você prefere dar…',
            o: 'Pergunte qual experiência de presente mais marcou essa pessoa.',
            a: [
              ['Um objeto para guardar por anos', 'Um tesouro para a estante.'],
              ['Uma experiência para viver', 'Uma lembrança novinha a caminho!'],
            ],
          },
          nl: {
            t: 'Je geeft liever…',
            o: 'Vraag welke gekregen belevenis die persoon het meest is bijgebleven.',
            a: [
              ['Een voorwerp om lang te bewaren', 'Een schat voor op de plank.'],
              ['Een belevenis', 'Een gloednieuwe herinnering in aantocht!'],
            ],
          },
        }),
        s('cadeaux_cours', 'elan', ['🛋️', -100, 'temps_libre'], ['🏺', 100, 'projets'], {
          fr: { t: 'Recevoir un atelier (poterie, cuisine, chant…), pour toi c’est…', o: 'Demande-lui quel atelier elle ou il aimerait recevoir.', a: [['Je préfère un moment à ne rien faire', 'Ne rien faire, c’est tout un art.'], ['Le rêve, j’adore apprendre', 'On fait un vase pour moi ?']], m: 'Sympa, si c’est sans pression.' },
          en: { t: 'Being given a workshop (pottery, cooking, singing…) is…', o: 'Ask them which workshop they’d love to be given.', a: [['I’d rather have time to do nothing', 'Doing nothing is an art form.'], ['A dream, I love learning', 'Will you make me a vase?']], m: 'Nice, as long as it’s no pressure.' },
          es: { t: 'Que te regalen un taller (cerámica, cocina, canto…) es…', o: 'Pregúntale qué taller le gustaría que le regalaran.', a: [['Prefiero un rato sin hacer nada', 'No hacer nada es todo un arte.'], ['Un sueño, me encanta aprender', '¿Me haces un jarrón?']], m: 'Bien, si es sin presión.' },
          pt: { t: 'Ganhar uma oficina (cerâmica, cozinha, canto…) é…', o: 'Pergunte qual oficina essa pessoa adoraria ganhar.', a: [['Prefiro um tempo sem fazer nada', 'Não fazer nada é uma arte.'], ['Um sonho, adoro aprender', 'Faz um vaso para mim?']], m: 'Legal, se for sem pressão.' },
          nl: { t: 'Een workshop krijgen (pottenbakken, koken, zingen…) is…', o: 'Vraag welke workshop die persoon graag zou krijgen.', a: [['Ik heb liever tijd om niks te doen', 'Niksen is een kunst.'], ['Een droom, ik leer graag', 'Maak je een vaas voor mij?']], m: 'Leuk, als het zonder druk is.' },
        }),
        c('cadeaux_places', 'rythme', [['🌌', -60, 'calme'], ['🎸', 80, 'musique'], ['🎭', 10, null]], {
          fr: {
            t: 'On t’offre deux places. Tu espères que c’est pour…',
            o: 'Demande-lui quelle sortie lui ferait le plus plaisir.',
            a: [
              ['Une soirée au planétarium, tout doux', 'On compte les étoiles ensemble.'],
              ['Un concert debout, dans la foule', 'Je saute plus haut que tout le monde !'],
              ['Une pièce de théâtre', 'Rideau ! Je retiens mon souffle.'],
            ],
          },
          en: {
            t: 'You’re given two tickets. You hope they’re for…',
            o: 'Ask them which outing would make them happiest.',
            a: [
              ['A gentle evening at the planetarium', 'Let’s count the stars together.'],
              ['A standing gig in the crowd', 'I’ll jump higher than everyone!'],
              ['A play at the theatre', 'Curtain up! I’m holding my breath.'],
            ],
          },
          es: {
            t: 'Te regalan dos entradas. Esperas que sean para…',
            o: 'Pregúntale qué plan le haría más ilusión.',
            a: [
              ['Una noche tranquila en el planetario', 'Contamos estrellas juntos.'],
              ['Un concierto de pie, entre la gente', '¡Salto más alto que nadie!'],
              ['Una obra de teatro', '¡Se abre el telón! Contengo el aliento.'],
            ],
          },
          pt: {
            t: 'Você ganha dois ingressos. Torce para que sejam para…',
            o: 'Pergunte qual passeio deixaria essa pessoa mais feliz.',
            a: [
              ['Uma noite tranquila no planetário', 'Vamos contar estrelas juntos.'],
              ['Um show de pé, no meio da multidão', 'Vou pular mais alto que todo mundo!'],
              ['Uma peça de teatro', 'Abrem-se as cortinas! Prendo a respiração.'],
            ],
          },
          nl: {
            t: 'Je krijgt twee kaartjes. Je hoopt dat ze zijn voor…',
            o: 'Vraag van welk uitje die persoon het blijst zou worden.',
            a: [
              ['Een rustige avond in het planetarium', 'Samen sterren tellen.'],
              ['Een staand concert, midden in de menigte', 'Ik spring hoger dan iedereen!'],
              ['Een toneelstuk', 'Doek op! Ik houd mijn adem in.'],
            ],
          },
        }),
        c('cadeaux_week_end', 'cap', [['📋', 70, 'plan'], ['🕵️', 0, null], ['🧳', -70, 'spontane']], {
          fr: {
            t: 'On t’offre un week-end surprise. Tu…',
            o: 'Demande-lui comment elle ou il réagirait à un week-end surprise.',
            a: [
              ['Veux connaître le programme', 'Je te fais un petit planning.'],
              ['Cherches des indices partout', 'Loupe en main, inspecteur.'],
              ['Fais ton sac en cinq minutes', 'Une brosse à dents et c’est parti !'],
            ],
          },
          en: {
            t: 'You’re given a surprise weekend away. You…',
            o: 'Ask them how they’d react to a surprise weekend away.',
            a: [
              ['Want to know the itinerary', 'I’ll draw you a little schedule.'],
              ['Hunt for clues everywhere', 'Magnifying glass ready, detective.'],
              ['Pack your bag in five minutes', 'A toothbrush and off we go!'],
            ],
          },
          es: {
            t: 'Te regalan un fin de semana sorpresa. Tú…',
            o: 'Pregúntale cómo reaccionaría a un fin de semana sorpresa.',
            a: [
              ['Quieres saber el programa', 'Te hago un planning.'],
              ['Buscas pistas por todas partes', 'Lupa en mano, inspector.'],
              ['Haces la maleta en cinco minutos', '¡Un cepillo de dientes y en marcha!'],
            ],
          },
          pt: {
            t: 'Você ganha um fim de semana surpresa. Você…',
            o: 'Pergunte como essa pessoa reagiria a um fim de semana surpresa.',
            a: [
              ['Quer saber a programação', 'Te faço um cronograma.'],
              ['Procura pistas por todo lado', 'Lupa na mão, detetive.'],
              ['Faz a mala em cinco minutos', 'Uma escova de dentes e partiu!'],
            ],
          },
          nl: {
            t: 'Je krijgt een verrassingsweekend. Je…',
            o: 'Vraag hoe die persoon zou reageren op een verrassingsweekend.',
            a: [
              ['Wilt het programma weten', 'Ik maak een planninkje voor je.'],
              ['Zoekt overal naar hints', 'Vergrootglas erbij, inspecteur.'],
              ['Pakt je tas in vijf minuten', 'Een tandenborstel en gaan!'],
            ],
          },
        }),
        c('cadeaux_ensemble', 'foyer', [['🎈', -50, 'liberte'], ['🫶', 70, 'famille']], {
          fr: {
            t: 'Tu offres une sortie. Tu l’offres…',
            o: 'Demande-lui si elle ou il préfère vivre une sortie offerte en groupe ou à sa façon.',
            a: [
              ['Pour que la personne en profite à sa façon', 'Liberté totale, j’adore.'],
              ['Pour qu’on y aille toute la bande ensemble', 'On fait une photo de groupe ?'],
            ],
          },
          en: {
            t: 'You give an outing as a gift. You give it…',
            o: 'Ask them whether they’d rather enjoy a gifted outing as a group or their own way.',
            a: [
              ['So they can enjoy it however they like', 'Total freedom, love it.'],
              ['So the whole gang can go together', 'Group photo, anyone?'],
            ],
          },
          es: {
            t: 'Regalas un plan. Lo regalas…',
            o: 'Pregúntale si prefiere disfrutar un plan regalado en grupo o a su manera.',
            a: [
              ['Para que la persona lo disfrute a su manera', 'Libertad total, me encanta.'],
              ['Para ir todo el grupo junto', '¿Hacemos foto de grupo?'],
            ],
          },
          pt: {
            t: 'Você dá um passeio de presente. Você dá…',
            o: 'Pergunte se essa pessoa prefere curtir um passeio de presente em grupo ou do seu jeito.',
            a: [
              ['Para a pessoa curtir do jeito dela', 'Liberdade total, adoro.'],
              ['Para a turma toda ir junto', 'Vamos tirar uma foto de grupo?'],
            ],
          },
          nl: {
            t: 'Je geeft een uitje cadeau. Je geeft het…',
            o: 'Vraag of die persoon een gekregen uitje liever met een groep of op eigen manier beleeft.',
            a: [
              ['Zodat de ander er op eigen manier van geniet', 'Totale vrijheid, top.'],
              ['Zodat de hele club samen kan gaan', 'Groepsfoto, iemand?'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_8',
      title: { fr: 'Les petites attentions', en: 'Little gestures', es: 'Los detalles', pt: 'Os mimos', nl: 'Kleine attenties' },
      questions: [
        c('cadeaux_sans_raison', 'cap', [['🌼', -70, 'spontane'], ['📆', 60, 'plan']], {
          fr: {
            t: 'Offrir un petit truc sans occasion, chez toi c’est…',
            o: 'Demande-lui quelle petite attention lui a fait plaisir récemment.',
            a: [
              ['Souvent, dès que j’y pense', 'Un mardi, une fleur, pourquoi pas !'],
              ['Plutôt pour les dates prévues', 'Chaque chose en son temps.'],
            ],
          },
          en: {
            t: 'Giving a little something for no reason is, for you…',
            o: 'Ask them about a small gesture that made them happy recently.',
            a: [
              ['Frequent, whenever it crosses my mind', 'A Tuesday, a flower, why not!'],
              ['More for planned occasions', 'Everything in its own time.'],
            ],
          },
          es: {
            t: 'Regalar algo pequeño sin motivo, para ti es…',
            o: 'Pregúntale qué detalle le hizo ilusión hace poco.',
            a: [
              ['Frecuente, en cuanto se me ocurre', 'Un martes, una flor, ¡por qué no!'],
              ['Más bien para fechas previstas', 'Cada cosa a su tiempo.'],
            ],
          },
          pt: {
            t: 'Dar uma lembrancinha sem motivo, para você é…',
            o: 'Pergunte qual mimo deixou essa pessoa feliz recentemente.',
            a: [
              ['Frequente, sempre que me vem a ideia', 'Uma terça, uma flor, por que não!'],
              ['Mais para datas marcadas', 'Cada coisa no seu tempo.'],
            ],
          },
          nl: {
            t: 'Zomaar iets kleins geven, zonder aanleiding, is voor jou…',
            o: 'Vraag welke kleine attentie die persoon onlangs blij maakte.',
            a: [
              ['Vaak, zodra ik eraan denk', 'Een dinsdag, een bloem, waarom niet!'],
              ['Meer voor vaste momenten', 'Alles op zijn tijd.'],
            ],
          },
        }),
        s('cadeaux_ramener', 'foyer', ['🙋', -100, 'liberte'], ['🏘️', 100, 'accueil'], {
          fr: { t: 'Tu ramènes des gourmandises de vacances pour…', o: 'Demande-lui ce qu’elle ou il aime rapporter de vacances.', a: [['Moi, et c’est très bien', 'Et une pour moi, une pour moi…'], ['Tout l’immeuble et les collègues', 'Distribution générale !']], m: 'Mes proches les plus proches.' },
          en: { t: 'You bring back holiday treats for…', o: 'Ask them what they like to bring back from holidays.', a: [['Me, and that’s fine', 'One for me, one for me…'], ['The whole building and my colleagues', 'Handouts for everyone!']], m: 'My nearest and dearest.' },
          es: { t: 'Traes dulces de las vacaciones para…', o: 'Pregúntale qué le gusta traer de las vacaciones.', a: [['Para mí, y tan a gusto', 'Uno para mí, otro para mí…'], ['Todo el edificio y los compañeros', '¡Reparto general!']], m: 'Para los más cercanos.' },
          pt: { t: 'Você traz guloseimas das férias para…', o: 'Pergunte o que essa pessoa gosta de trazer das férias.', a: [['Mim, e está ótimo', 'Uma para mim, outra para mim…'], ['O prédio todo e os colegas', 'Distribuição geral!']], m: 'As pessoas mais próximas.' },
          nl: { t: 'Je neemt lekkers mee van vakantie voor…', o: 'Vraag wat die persoon graag meeneemt van vakantie.', a: [['Mezelf, en dat is prima', 'Eentje voor mij, eentje voor mij…'], ['Het hele gebouw en de collega’s', 'Uitdelen maar!']], m: 'Mijn allernaasten.' },
        }),
        c('cadeaux_attention_type', 'ancrage', [['🥐', -50, 'cuisine'], ['🌍', 60, 'voyage'], ['📖', 20, 'curiosite']], {
          fr: {
            t: 'Ta petite attention préférée à offrir ?',
            o: 'Demande-lui quelle petite attention elle ou il aime offrir.',
            a: [
              ['Des viennoiseries de la boulangerie du coin', 'Les croissants sont encore chauds.'],
              ['Un souvenir rapporté de voyage', 'Ça sent l’ailleurs, cette chose.'],
              ['Un livre que j’ai adoré', 'Avec une dédicace de ta part ?'],
            ],
          },
          en: {
            t: 'Your favourite little thing to give?',
            o: 'Ask them what little gesture they like to make.',
            a: [
              ['Pastries from the local bakery', 'The croissants are still warm.'],
              ['A souvenir from a trip', 'This smells of faraway places.'],
              ['A book I loved', 'With a note from you inside?'],
            ],
          },
          es: {
            t: '¿Tu detalle favorito para regalar?',
            o: 'Pregúntale qué detalle le gusta regalar.',
            a: [
              ['Bollería de la panadería del barrio', 'Los cruasanes aún están calentitos.'],
              ['Un recuerdo traído de un viaje', 'Esto huele a lejos.'],
              ['Un libro que me encantó', '¿Con dedicatoria tuya?'],
            ],
          },
          pt: {
            t: 'Sua lembrancinha favorita para dar?',
            o: 'Pergunte qual mimo essa pessoa gosta de dar.',
            a: [
              ['Pãezinhos da padaria do bairro', 'Ainda estão quentinhos.'],
              ['Uma lembrança trazida de viagem', 'Isso tem cheiro de longe.'],
              ['Um livro que eu adorei', 'Com dedicatória sua?'],
            ],
          },
          nl: {
            t: 'Je favoriete kleine attentie om te geven?',
            o: 'Vraag welke kleine attentie die persoon graag geeft.',
            a: [
              ['Iets lekkers van de bakker om de hoek', 'De croissants zijn nog warm.'],
              ['Een souvenir van een reis', 'Dit ruikt naar verre oorden.'],
              ['Een boek waar ik dol op was', 'Met een opdracht van jou erin?'],
            ],
          },
        }),
        c('cadeaux_deposer', 'rythme', [['☕', 70, 'monde'], ['🚪', -60, 'calme']], {
          fr: {
            t: 'Tu passes déposer une petite attention chez quelqu’un. Tu…',
            o: 'Demande-lui si elle ou il aime les visites à l’improviste.',
            a: [
              ['Sonnes et restes pour un café et papoter', 'Je sors les biscuits !'],
              ['La laisses devant la porte, en toute discrétion', 'Mission ninja réussie.'],
            ],
          },
          en: {
            t: 'You drop off a little gift at someone’s place. You…',
            o: 'Ask them how they feel about unannounced visits.',
            a: [
              ['Ring and stay for a coffee and a chat', 'I’ll get the biscuits out!'],
              ['Leave it at the door, very discreetly', 'Ninja mission accomplished.'],
            ],
          },
          es: {
            t: 'Pasas a dejar un detalle en casa de alguien. Tú…',
            o: 'Pregúntale qué le parecen las visitas sin avisar.',
            a: [
              ['Llamas y te quedas a un café y a charlar', '¡Saco las galletas!'],
              ['Lo dejas en la puerta, sin hacer ruido', 'Misión ninja cumplida.'],
            ],
          },
          pt: {
            t: 'Você passa para deixar um mimo na casa de alguém. Você…',
            o: 'Pergunte o que essa pessoa acha de visitas sem aviso.',
            a: [
              ['Toca a campainha e fica para um café e um papo', 'Vou pegar os biscoitos!'],
              ['Deixa na porta, bem discreto', 'Missão ninja cumprida.'],
            ],
          },
          nl: {
            t: 'Je brengt een kleine attentie langs bij iemand. Je…',
            o: 'Vraag wat die persoon van onverwacht bezoek vindt.',
            a: [
              ['Belt aan en blijft voor koffie en een praatje', 'Ik pak de koekjes!'],
              ['Zet het stilletjes bij de deur', 'Ninjamissie geslaagd.'],
            ],
          },
        }),
        c('cadeaux_faire_plaisir', 'elan', [['💬', -40, 'temps_libre'], ['🎨', 60, 'projets'], ['🎶', 10, 'musique']], {
          fr: {
            t: 'Pour faire plaisir à quelqu’un, tu préfères…',
            o: 'Demande-lui ce qui lui fait plaisir quand on pense à elle ou lui.',
            a: [
              ['Envoyer un message gentil, tout simple', 'Petit message, grand effet.'],
              ['Créer un dessin ou un poème', 'Je l’accroche sur le frigo ?'],
              ['Partager une chanson qui me fait penser à la personne', 'Je fredonne déjà.'],
            ],
          },
          en: {
            t: 'To brighten someone’s day, you’d rather…',
            o: 'Ask them what makes them feel thought of.',
            a: [
              ['Send a simple kind message', 'Small message, big effect.'],
              ['Make a drawing or a poem', 'Shall I stick it on the fridge?'],
              ['Share a song that reminds me of them', 'I’m already humming.'],
            ],
          },
          es: {
            t: 'Para alegrarle el día a alguien, prefieres…',
            o: 'Pregúntale qué le hace sentir que piensan en ella o en él.',
            a: [
              ['Mandar un mensaje bonito y sencillo', 'Mensaje pequeño, gran efecto.'],
              ['Hacer un dibujo o un poema', '¿Lo pego en la nevera?'],
              ['Compartir una canción que me recuerda a esa persona', 'Ya la estoy tarareando.'],
            ],
          },
          pt: {
            t: 'Para alegrar alguém, você prefere…',
            o: 'Pergunte o que faz essa pessoa sentir que pensaram nela.',
            a: [
              ['Mandar uma mensagem carinhosa e simples', 'Mensagem pequena, grande efeito.'],
              ['Criar um desenho ou um poema', 'Vou pendurar na geladeira?'],
              ['Compartilhar uma música que me lembra a pessoa', 'Já estou cantarolando.'],
            ],
          },
          nl: {
            t: 'Om iemand blij te maken, doe je liever…',
            o: 'Vraag waardoor die persoon zich bedacht voelt.',
            a: [
              ['Een lief, simpel berichtje sturen', 'Klein berichtje, groot effect.'],
              ['Een tekening of gedicht maken', 'Zal ik het op de koelkast hangen?'],
              ['Een liedje delen dat me aan de ander doet denken', 'Ik neurie al mee.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_9',
      title: { fr: 'Se faire plaisir', en: 'Treating yourself', es: 'Darse un capricho', pt: 'Se dar um mimo', nl: 'Jezelf verwennen' },
      questions: [
        c('cadeaux_soi_quand', 'cap', [['🛒', -60, 'spontane'], ['🎯', 60, 'plan']], {
          fr: {
            t: 'Te faire un cadeau à toi-même, c’est plutôt…',
            o: 'Demande-lui quel petit cadeau elle ou il s’est fait récemment.',
            a: [
              ['Un coup de cœur sur le moment', 'Coup de foudre, c’est validé.'],
              ['Une récompense prévue après un objectif', 'Bien mérité, bravo !'],
            ],
          },
          en: {
            t: 'Treating yourself is more…',
            o: 'Ask them what little treat they gave themselves recently.',
            a: [
              ['A spur-of-the-moment crush', 'Love at first sight, approved.'],
              ['A reward planned after a goal', 'Well deserved, bravo!'],
            ],
          },
          es: {
            t: 'Hacerte un regalo a ti, es más bien…',
            o: 'Pregúntale qué capricho se ha dado hace poco.',
            a: [
              ['Un flechazo del momento', 'Flechazo aprobado.'],
              ['Un premio previsto tras un objetivo', '¡Bien merecido, bravo!'],
            ],
          },
          pt: {
            t: 'Dar um presente para si, para você é mais…',
            o: 'Pergunte qual mimo essa pessoa se deu recentemente.',
            a: [
              ['Uma paixão do momento', 'Amor à primeira vista, aprovado.'],
              ['Uma recompensa planejada depois de uma meta', 'Merecidíssimo, parabéns!'],
            ],
          },
          nl: {
            t: 'Jezelf een cadeautje geven is eerder…',
            o: 'Vraag welk cadeautje die persoon zichzelf onlangs gaf.',
            a: [
              ['Een opwelling van het moment', 'Liefde op het eerste gezicht, goedgekeurd.'],
              ['Een geplande beloning na een doel', 'Dik verdiend, bravo!'],
            ],
          },
        }),
        s('cadeaux_soi_soiree', 'rythme', ['🧖', -100, 'cocooning'], ['💃', 100, 'fete'], {
          fr: { t: 'Ton cadeau pour toi après une longue semaine…', o: 'Demande-lui comment elle ou il se fait plaisir après une grosse semaine.', a: [['Une soirée cocooning sous la couette', 'Je réchauffe tes chaussettes.'], ['Une sortie avec plein d’amis', 'On danse jusqu’à quelle heure ?']], m: 'Un dîner tranquille dehors.' },
          en: { t: 'Your treat to yourself after a long week…', o: 'Ask them how they treat themselves after a big week.', a: [['A cosy night under the duvet', 'I’ll warm your socks.'], ['A night out with loads of friends', 'How late are we dancing?']], m: 'A quiet dinner out.' },
          es: { t: 'Tu regalo para ti tras una semana larga…', o: 'Pregúntale cómo se mima después de una semana intensa.', a: [['Una noche de manta y sofá', 'Te caliento los calcetines.'], ['Salir con un montón de amigos', '¿Hasta qué hora bailamos?']], m: 'Una cena tranquila fuera.' },
          pt: { t: 'Seu presente para você depois de uma semana longa…', o: 'Pergunte como essa pessoa se mima depois de uma semana puxada.', a: [['Uma noite aconchegante debaixo do edredom', 'Vou esquentar suas meias.'], ['Uma saída com um monte de amigos', 'Até que horas a gente dança?']], m: 'Um jantar tranquilo fora.' },
          nl: { t: 'Je cadeautje aan jezelf na een lange week…', o: 'Vraag hoe die persoon zichzelf verwent na een drukke week.', a: [['Een knusse avond onder het dekbed', 'Ik warm je sokken op.'], ['Uit met een heleboel vrienden', 'Tot hoe laat dansen we?']], m: 'Rustig ergens uit eten.' },
        }),
        c('cadeaux_soi_livre', 'ancrage', [['📕', -50, 'racines'], ['🪄', 70, 'curiosite'], ['🎲', 20, 'spontane']], {
          fr: {
            t: 'Tu t’offres un livre ou un album. Tu prends…',
            o: 'Demande-lui quel livre ou album elle ou il s’est offert dernièrement.',
            a: [
              ['La suite de ma série favorite', 'Enfin ! Que se passe-t-il ensuite ?'],
              ['Un genre que je n’ai jamais essayé', 'Un nouveau monde à explorer.'],
              ['Au hasard, pour la jolie couverture', 'Elle est vraiment belle, celle-là.'],
            ],
          },
          en: {
            t: 'You treat yourself to a book or an album. You pick…',
            o: 'Ask them which book or album they treated themselves to lately.',
            a: [
              ['The next one in my favourite series', 'Finally! What happens next?'],
              ['A genre I’ve never tried', 'A whole new world to explore.'],
              ['At random, for the pretty cover', 'It really is a lovely one.'],
            ],
          },
          es: {
            t: 'Te regalas un libro o un disco. Eliges…',
            o: 'Pregúntale qué libro o disco se ha regalado últimamente.',
            a: [
              ['La continuación de mi serie favorita', '¡Por fin! ¿Qué pasa después?'],
              ['Un género que nunca he probado', 'Un mundo nuevo por explorar.'],
              ['Al azar, por la portada bonita', 'Es que es preciosa.'],
            ],
          },
          pt: {
            t: 'Você se dá um livro ou um álbum. Você escolhe…',
            o: 'Pergunte qual livro ou álbum essa pessoa se deu por último.',
            a: [
              ['A continuação da minha série favorita', 'Finalmente! O que acontece agora?'],
              ['Um gênero que nunca experimentei', 'Um mundo novo para explorar.'],
              ['Ao acaso, pela capa bonita', 'Ela é linda mesmo.'],
            ],
          },
          nl: {
            t: 'Je trakteert jezelf op een boek of album. Je kiest…',
            o: 'Vraag welk boek of album die persoon zichzelf laatst gaf.',
            a: [
              ['Het vervolg van mijn favoriete reeks', 'Eindelijk! Hoe gaat het verder?'],
              ['Een genre dat ik nooit probeerde', 'Een hele nieuwe wereld.'],
              ['Op goed geluk, om de mooie kaft', 'Hij is ook echt mooi.'],
            ],
          },
        }),
        c('cadeaux_soi_annee', 'elan', [['🏖️', -70, 'temps_libre'], ['🚲', 20, 'sport'], ['📘', 70, 'projets']], {
          fr: {
            t: 'Le meilleur cadeau à te faire cette année ?',
            o: 'Demande-lui quel cadeau elle ou il aimerait se faire cette année.',
            a: [
              ['Une semaine pour ne rien faire', 'Mode chaise longue activé.'],
              ['Un vélo pour explorer le coin', 'Dring dring, je monte devant !'],
              ['Un cours pour apprendre un truc nouveau', 'Je prends des notes avec toi.'],
            ],
          },
          en: {
            t: 'The best gift to give yourself this year?',
            o: 'Ask them what they’d love to give themselves this year.',
            a: [
              ['A week of doing nothing', 'Deckchair mode activated.'],
              ['A bike to explore the area', 'Ring ring, I’m riding up front!'],
              ['A course to learn something new', 'I’ll take notes with you.'],
            ],
          },
          es: {
            t: '¿El mejor regalo que hacerte este año?',
            o: 'Pregúntale qué regalo le gustaría hacerse este año.',
            a: [
              ['Una semana sin hacer nada', 'Modo tumbona activado.'],
              ['Una bici para explorar la zona', '¡Ring ring, yo voy delante!'],
              ['Un curso para aprender algo nuevo', 'Tomo apuntes contigo.'],
            ],
          },
          pt: {
            t: 'O melhor presente para se dar este ano?',
            o: 'Pergunte que presente essa pessoa gostaria de se dar este ano.',
            a: [
              ['Uma semana sem fazer nada', 'Modo espreguiçadeira ativado.'],
              ['Uma bicicleta para explorar a região', 'Trim trim, vou na frente!'],
              ['Um curso para aprender algo novo', 'Faço anotações com você.'],
            ],
          },
          nl: {
            t: 'Het beste cadeau om jezelf dit jaar te geven?',
            o: 'Vraag wat die persoon zichzelf dit jaar graag zou geven.',
            a: [
              ['Een week helemaal niks doen', 'Ligstoelmodus aan.'],
              ['Een fiets om de buurt te verkennen', 'Tring tring, ik zit voorop!'],
              ['Een cursus om iets nieuws te leren', 'Ik maak aantekeningen met je mee.'],
            ],
          },
        }),
        c('cadeaux_soi_partage', 'foyer', [['🍕', 70, 'famille'], ['🧘', -60, 'liberte']], {
          fr: {
            t: 'Ton petit plaisir, tu le savoures…',
            o: 'Demande-lui avec qui elle ou il aime partager ses petits plaisirs.',
            a: [
              ['Avec des proches, c’est meilleur', 'Une part pour chacun, et une pour moi.'],
              ['Dans ma bulle, c’est mon moment', 'Je monte la garde devant ta bulle.'],
            ],
          },
          en: {
            t: 'Your little treat, you enjoy it…',
            o: 'Ask them who they like to share their little pleasures with.',
            a: [
              ['With loved ones, it’s better', 'A slice each, and one for me.'],
              ['In my bubble, it’s my moment', 'I’ll stand guard by your bubble.'],
            ],
          },
          es: {
            t: 'Tu pequeño capricho, lo disfrutas…',
            o: 'Pregúntale con quién le gusta compartir sus pequeños placeres.',
            a: [
              ['Con mi gente, sabe mejor', 'Un trozo para cada uno, y otro para mí.'],
              ['En mi burbuja, es mi momento', 'Yo vigilo tu burbuja.'],
            ],
          },
          pt: {
            t: 'Seu pequeno prazer, você curte…',
            o: 'Pergunte com quem essa pessoa gosta de dividir os pequenos prazeres.',
            a: [
              ['Com gente querida, fica melhor', 'Um pedaço para cada um, e um para mim.'],
              ['Na minha bolha, é meu momento', 'Eu fico de guarda na sua bolha.'],
            ],
          },
          nl: {
            t: 'Van je kleine verwennerij geniet je…',
            o: 'Vraag met wie die persoon graag kleine genoegens deelt.',
            a: [
              ['Met dierbaren, dat smaakt beter', 'Een stuk voor iedereen, en eentje voor mij.'],
              ['In mijn bubbel, mijn moment', 'Ik houd de wacht bij je bubbel.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cadeaux_10',
      title: { fr: 'Après le cadeau', en: 'After the gift', es: 'Después del regalo', pt: 'Depois do presente', nl: 'Na het cadeau' },
      questions: [
        c('cadeaux_rubans', 'cap', [['🗂️', 70, 'ordre'], ['♻️', -60, 'spontane']], {
          fr: {
            t: 'Les rubans et le papier récupérés après les cadeaux…',
            o: 'Demande-lui ce qu’elle ou il fait des emballages après une fête.',
            a: [
              ['Rangés et triés pour la prochaine fois', 'Un tiroir à rubans, quel luxe.'],
              ['Direction le recyclage, sans hésiter', 'Hop, une boule de papier, panier !'],
            ],
          },
          en: {
            t: 'The ribbons and paper saved after opening presents…',
            o: 'Ask them what they do with the wrapping after a party.',
            a: [
              ['Sorted and stored for next time', 'A ribbon drawer, how fancy.'],
              ['Straight into the recycling', 'A paper ball, and… score!'],
            ],
          },
          es: {
            t: 'Las cintas y el papel que quedan tras los regalos…',
            o: 'Pregúntale qué hace con los envoltorios después de una fiesta.',
            a: [
              ['Ordenados para la próxima vez', 'Un cajón de lazos, qué lujo.'],
              ['Al reciclaje, sin dudar', 'Una bola de papel y… ¡canasta!'],
            ],
          },
          pt: {
            t: 'As fitas e o papel que sobram depois dos presentes…',
            o: 'Pergunte o que essa pessoa faz com os embrulhos depois de uma festa.',
            a: [
              ['Guardados e organizados para a próxima', 'Uma gaveta de fitas, que luxo.'],
              ['Direto para a reciclagem', 'Uma bolinha de papel e… cesta!'],
            ],
          },
          nl: {
            t: 'Het lint en papier dat overblijft na het uitpakken…',
            o: 'Vraag wat die persoon na een feest met het inpakpapier doet.',
            a: [
              ['Gesorteerd en bewaard voor de volgende keer', 'Een lintjeslade, wat een luxe.'],
              ['Meteen bij het oud papier', 'Een prop papier en… raak!'],
            ],
          },
        }),
        s('cadeaux_garder', 'ancrage', ['🧸', -100, 'racines'], ['🔄', 100, 'curiosite'], {
          fr: { t: 'Les cadeaux reçus il y a longtemps, tu…', o: 'Demande-lui quel vieux cadeau elle ou il garde encore.', a: [['Les gardes tous, chacun a son histoire', 'Un petit musée rien qu’à toi.'], ['Les fais tourner, place au nouveau', 'Au suivant, avec le sourire !']], m: 'Je garde les plus chers à mon cœur.' },
          en: { t: 'Gifts you got ages ago, you…', o: 'Ask them which old gift they still keep.', a: [['Keep them all, each one has a story', 'Your very own little museum.'], ['Pass them on, make room for new', 'Next, with a smile!']], m: 'I keep the ones closest to my heart.' },
          es: { t: 'Los regalos de hace mucho, tú…', o: 'Pregúntale qué regalo antiguo conserva todavía.', a: [['Los guardas todos, cada uno tiene su historia', 'Tu propio museíto.'], ['Los haces circular, hueco para lo nuevo', '¡El siguiente, con una sonrisa!']], m: 'Guardo los más queridos.' },
          pt: { t: 'Os presentes que você ganhou há muito tempo, você…', o: 'Pergunte qual presente antigo essa pessoa ainda guarda.', a: [['Guarda todos, cada um tem sua história', 'Seu próprio museuzinho.'], ['Passa adiante, espaço para o novo', 'Próximo, com um sorriso!']], m: 'Guardo os mais queridos.' },
          nl: { t: 'Cadeaus die je lang geleden kreeg, die…', o: 'Vraag welk oud cadeau die persoon nog steeds bewaart.', a: [['Bewaar je allemaal, elk heeft een verhaal', 'Je eigen kleine museum.'], ['Geef je door, ruimte voor iets nieuws', 'Volgende, met een glimlach!']], m: 'Ik bewaar de dierbaarste.' },
        }),
        c('cadeaux_exposer', 'foyer', [['🖼️', 60, 'accueil'], ['🗝️', -60, 'liberte']], {
          fr: {
            t: 'Tes cadeaux préférés, tu les…',
            o: 'Demande-lui l’histoire d’un objet offert qu’elle ou il adore.',
            a: [
              ['Exposes dans le salon et racontes leur histoire', 'Visite guidée, suivez-moi !'],
              ['Gardes dans un coin à toi, c’est perso', 'Ton jardin secret, chut.'],
            ],
          },
          en: {
            t: 'Your favourite gifts, you…',
            o: 'Ask them the story behind a gift they love.',
            a: [
              ['Display them and tell their story', 'Guided tour, follow me!'],
              ['Keep them in a corner of your own', 'Your secret garden, shh.'],
            ],
          },
          es: {
            t: 'Tus regalos favoritos, los…',
            o: 'Pregúntale la historia de un regalo que adora.',
            a: [
              ['Expones en el salón y cuentas su historia', '¡Visita guiada, seguidme!'],
              ['Guardas en un rincón tuyo, es personal', 'Tu jardín secreto, chis.'],
            ],
          },
          pt: {
            t: 'Seus presentes favoritos, você…',
            o: 'Pergunte a história de um presente que essa pessoa adora.',
            a: [
              ['Expõe na sala e conta a história deles', 'Visita guiada, me sigam!'],
              ['Guarda num cantinho seu, é pessoal', 'Seu jardim secreto, psiu.'],
            ],
          },
          nl: {
            t: 'Je favoriete cadeaus…',
            o: 'Vraag naar het verhaal achter een cadeau waar die persoon dol op is.',
            a: [
              ['Staan in de woonkamer, met verhaal erbij', 'Rondleiding, volg mij!'],
              ['Bewaar je in een eigen hoekje, privé', 'Je geheime tuin, sst.'],
            ],
          },
        }),
        c('cadeaux_troc', 'rythme', [['📚', -60, 'calme'], ['🙂', 10, null], ['🎉', 80, 'fete']], {
          fr: {
            t: 'Une soirée troc où chacun échange les cadeaux qui ne lui servent pas ?',
            o: 'Demande-lui ce qu’elle ou il pense des soirées troc.',
            a: [
              ['Je préfère une soirée lecture', 'Chut, tourne la page doucement.'],
              ['J’y passe un moment', 'Juste le temps d’un échange !'],
              ['Génial, venez nombreux !', 'J’échange ma chaussette en premier.'],
            ],
          },
          en: {
            t: 'A swap party where everyone trades gifts they don’t use?',
            o: 'Ask them what they think of swap parties.',
            a: [
              ['I’d rather have a reading night', 'Shh, turn the page gently.'],
              ['I’ll pop in for a bit', 'Just long enough for one swap!'],
              ['Brilliant, the more the merrier!', 'I’m swapping my sock first.'],
            ],
          },
          es: {
            t: '¿Una fiesta de trueque para cambiar los regalos que no usas?',
            o: 'Pregúntale qué le parecen las fiestas de trueque.',
            a: [
              ['Prefiero una noche de lectura', 'Chis, pasa la página despacio.'],
              ['Me paso un rato', '¡Lo justo para un cambio!'],
              ['¡Genial, cuantos más mejor!', 'Yo cambio mi calcetín primero.'],
            ],
          },
          pt: {
            t: 'Uma festa de troca onde todo mundo troca presentes que não usa?',
            o: 'Pergunte o que essa pessoa acha de festas de troca.',
            a: [
              ['Prefiro uma noite de leitura', 'Psiu, vira a página devagar.'],
              ['Passo um tempinho lá', 'Só o tempo de uma troca!'],
              ['Incrível, quanto mais gente melhor!', 'Eu troco minha meia primeiro.'],
            ],
          },
          nl: {
            t: 'Een ruilavond waar iedereen ongebruikte cadeaus ruilt?',
            o: 'Vraag wat die persoon van ruilavonden vindt.',
            a: [
              ['Ik heb liever een leesavond', 'Sst, sla de bladzijde zachtjes om.'],
              ['Ik ga er even langs', 'Net lang genoeg voor één ruil!'],
              ['Geweldig, hoe meer zielen hoe meer vreugd!', 'Ik ruil eerst mijn sok.'],
            ],
          },
        }),
        c('cadeaux_kit', 'elan', [['🛠️', 70, 'projets'], ['📥', -50, 'temps_libre'], ['🤝', 10, null]], {
          fr: {
            t: 'On t’offre un kit (jardinage, peinture, bricolage…). Tu…',
            o: 'Demande-lui quel kit elle ou il aimerait recevoir.',
            a: [
              ['T’y mets dès ce week-end', 'Tablier enfilé, au boulot !'],
              ['Le gardes pour un jour tranquille', 'Il t’attendra bien sagement.'],
              ['Proposes à quelqu’un de le faire avec toi', 'Deux paires de mains, c’est mieux.'],
            ],
          },
          en: {
            t: 'You’re given a kit (gardening, painting, DIY…). You…',
            o: 'Ask them which kit they’d love to be given.',
            a: [
              ['Get stuck in this weekend', 'Apron on, let’s go!'],
              ['Save it for a quiet day', 'It’ll wait for you patiently.'],
              ['Ask someone to do it with you', 'Two pairs of hands are better.'],
            ],
          },
          es: {
            t: 'Te regalan un kit (jardinería, pintura, bricolaje…). Tú…',
            o: 'Pregúntale qué kit le gustaría que le regalaran.',
            a: [
              ['Te pones este mismo fin de semana', '¡Delantal puesto, manos a la obra!'],
              ['Lo guardas para un día tranquilo', 'Te esperará con paciencia.'],
              ['Le propones a alguien hacerlo contigo', 'Dos pares de manos, mejor.'],
            ],
          },
          pt: {
            t: 'Você ganha um kit (jardinagem, pintura, faça você mesmo…). Você…',
            o: 'Pergunte qual kit essa pessoa adoraria ganhar.',
            a: [
              ['Começa já neste fim de semana', 'Avental vestido, mãos à obra!'],
              ['Guarda para um dia tranquilo', 'Ele espera você com paciência.'],
              ['Chama alguém para fazer junto', 'Dois pares de mãos é melhor.'],
            ],
          },
          nl: {
            t: 'Je krijgt een pakket (tuinieren, schilderen, klussen…). Je…',
            o: 'Vraag welk pakket die persoon graag zou krijgen.',
            a: [
              ['Gaat er dit weekend al mee aan de slag', 'Schort aan, aan het werk!'],
              ['Bewaart het voor een rustige dag', 'Het wacht geduldig op je.'],
              ['Vraagt iemand om het samen te doen', 'Twee paar handen is beter.'],
            ],
          },
        }),
      ],
    },
  ],
};
