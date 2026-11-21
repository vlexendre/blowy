// Univers « Gourmandise » : douceurs, desserts, goûters, petites envies, boulangeries.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'gourmandise',
  icon: '🍰',
  title: {
    fr: ['Gourmandise', 'Douceurs, goûters et petites envies.'],
    en: ['Sweet tooth', 'Treats, snacks and little cravings.'],
    es: ['Golosinas', 'Dulces, meriendas y antojos.'],
    pt: ['Docinhos', 'Doces, lanches e pequenas vontades.'],
    nl: ['Zoetekauw', 'Lekkers, vieruurtjes en kleine trek.'],
  },
  steps: [
    {
      id: 'gourmandise_1',
      title: { fr: 'À la boulangerie', en: 'At the bakery', es: 'En la panadería', pt: 'Na padaria', nl: 'Bij de bakker' },
      questions: [
        c('gourmandise_vitrine', 'cap', [['📝', 70, 'plan'], ['👀', -60, 'spontane'], ['🥐', 20, null]], {
          fr: {
            t: 'Tu entres à la boulangerie.',
            o: 'Demande-lui ce qu’elle ou il prend en premier à la boulangerie.',
            a: [
              ['Je sais déjà ce que je prends', 'Commande prête avant la porte, bravo.'],
              ['Je craque pour ce qui me fait de l’œil', 'La vitrine a encore gagné.'],
              ['Mon habituel, avec un petit doute', 'Le doute, c’est la moitié du plaisir.'],
            ],
          },
          en: {
            t: 'You walk into the bakery.',
            o: 'Ask them what they pick first at the bakery.',
            a: [
              ['I already know what I’m getting', 'Order ready before the door, well done.'],
              ['I go for whatever catches my eye', 'The window display wins again.'],
              ['My usual, with a flicker of doubt', 'The doubt is half the fun.'],
            ],
          },
          es: {
            t: 'Entras en la panadería.',
            o: 'Pregúntale qué pide primero en la panadería.',
            a: [
              ['Ya sé lo que voy a pedir', 'Pedido listo antes de entrar, bravo.'],
              ['Caigo con lo que me guiña el ojo', 'El escaparate gana otra vez.'],
              ['Lo de siempre, con alguna duda', 'La duda es la mitad del gusto.'],
            ],
          },
          pt: {
            t: 'Você entra na padaria.',
            o: 'Pergunte o que essa pessoa pede primeiro na padaria.',
            a: [
              ['Já sei o que vou pedir', 'Pedido pronto antes da porta, parabéns.'],
              ['Me rendo ao que piscar pra mim', 'A vitrine ganhou de novo.'],
              ['O de sempre, com uma dúvida', 'A dúvida é metade da graça.'],
            ],
          },
          nl: {
            t: 'Je loopt de bakkerij binnen.',
            o: 'Vraag wat die persoon als eerste kiest bij de bakker.',
            a: [
              ['Ik weet al wat ik neem', 'Bestelling klaar vóór de deur, knap.'],
              ['Ik ga voor wat me toelacht', 'De etalage wint weer.'],
              ['Mijn vaste keuze, met een twijfel', 'Twijfel is de helft van de pret.'],
            ],
          },
        }),
        s('gourmandise_file', 'rythme', ['🤫', -100, 'calme'], ['🥖', 100, 'monde'], {
          fr: { t: 'Samedi matin, la boulangerie du quartier…', o: 'Demande-lui à quelle heure elle ou il aime aller à la boulangerie.', a: [['J’y vais tôt, quand c’est calme', 'Juste toi, le pain chaud et moi.'], ['J’adore la file qui discute', 'On apprend tout dans cette file !']], m: 'Un peu de monde, pas trop.' },
          en: { t: 'Saturday morning, the local bakery…', o: 'Ask them what time they like going to the bakery.', a: [['I go early, when it’s quiet', 'Just you, warm bread and me.'], ['I love the chatty queue', 'You learn everything in that queue!']], m: 'A few people, not too many.' },
          es: { t: 'Sábado por la mañana, la panadería del barrio…', o: 'Pregúntale a qué hora le gusta ir a la panadería.', a: [['Voy temprano, cuando hay calma', 'Solo tú, el pan caliente y yo.'], ['Me encanta la cola charlando', '¡En esa cola te enteras de todo!']], m: 'Un poco de gente, no demasiada.' },
          pt: { t: 'Sábado de manhã, a padaria do bairro…', o: 'Pergunte a que horas essa pessoa gosta de ir à padaria.', a: [['Vou cedo, quando está tranquilo', 'Só você, o pão quentinho e eu.'], ['Adoro a fila conversando', 'Nessa fila a gente sabe de tudo!']], m: 'Um pouco de gente, sem exagero.' },
          nl: { t: 'Zaterdagochtend, de bakker om de hoek…', o: 'Vraag hoe laat die persoon graag naar de bakker gaat.', a: [['Ik ga vroeg, als het rustig is', 'Alleen jij, warm brood en ik.'], ['Ik hou van de kletsende rij', 'In die rij hoor je alles!']], m: 'Een beetje druk, niet te veel.' },
        }),
        c('gourmandise_viennoiserie', 'ancrage', [['🥐', -70, 'racines'], ['✨', 70, 'curiosite'], ['🎲', 10, null]], {
          fr: {
            t: 'Ta viennoiserie, c’est plutôt…',
            o: 'Demande-lui sa viennoiserie préférée.',
            a: [
              ['Toujours la même, ma valeur sûre', 'On ne change pas une équipe qui gagne.'],
              ['La nouveauté du mois, forcément', 'Je goûte avec toi, promis.'],
              ['Ça dépend de mon humeur', 'Humeur pain au chocolat, je parie.'],
            ],
          },
          en: {
            t: 'Your pastry of choice is usually…',
            o: 'Ask them what their favourite pastry is.',
            a: [
              ['Always the same, my safe bet', 'Never change a winning team.'],
              ['The new one of the month, obviously', 'I’ll taste it with you, promise.'],
              ['It depends on my mood', 'Chocolate croissant mood, I bet.'],
            ],
          },
          es: {
            t: 'Tu bollo favorito suele ser…',
            o: 'Pregúntale cuál es su bollo preferido.',
            a: [
              ['Siempre el mismo, mi valor seguro', 'Equipo que gana no se toca.'],
              ['La novedad del mes, claro', 'Lo pruebo contigo, prometido.'],
              ['Depende de mi humor', 'Humor de napolitana, apuesto.'],
            ],
          },
          pt: {
            t: 'Seu folhado preferido costuma ser…',
            o: 'Pergunte qual é o folhado favorito dessa pessoa.',
            a: [
              ['Sempre o mesmo, minha aposta certa', 'Time que está ganhando não se mexe.'],
              ['A novidade do mês, claro', 'Eu provo com você, prometo.'],
              ['Depende do meu humor', 'Humor de croissant de chocolate, aposto.'],
            ],
          },
          nl: {
            t: 'Jouw koffiekoek is meestal…',
            o: 'Vraag wat de favoriete koffiekoek van die persoon is.',
            a: [
              ['Altijd dezelfde, mijn vaste waarde', 'Een winnend team verander je niet.'],
              ['De nieuwe van de maand, natuurlijk', 'Ik proef met je mee, beloofd.'],
              ['Hangt af van mijn humeur', 'Chocoladebroodjeshumeur, wedden?'],
            ],
          },
        }),
        c('gourmandise_pour_qui', 'foyer', [['🙋', -60, 'liberte'], ['🧺', 80, 'accueil'], ['🤝', 30, null]], {
          fr: {
            t: 'Tu ressors avec un sachet de douceurs. C’est pour…',
            o: 'Demande-lui pour qui elle ou il achète des douceurs.',
            a: [
              ['Moi, et c’est très bien comme ça', 'Un cadeau pour toi, de toi. Parfait.'],
              ['Toute la tablée de ce midi', 'Je mets le couvert !'],
              ['Moi, plus un pour le voisin', 'Le voisin va t’adorer.'],
            ],
          },
          en: {
            t: 'You walk out with a bag of treats. It’s for…',
            o: 'Ask them who they usually buy treats for.',
            a: [
              ['Me, and that’s just fine', 'A gift for you, from you. Perfect.'],
              ['The whole lunch table today', 'I’ll set the table!'],
              ['Me, plus one for the neighbour', 'The neighbour will love you.'],
            ],
          },
          es: {
            t: 'Sales con una bolsa de dulces. Es para…',
            o: 'Pregúntale para quién suele comprar dulces.',
            a: [
              ['Para mí, y tan a gusto', 'Un regalo tuyo para ti. Perfecto.'],
              ['Para toda la mesa de hoy', '¡Pongo la mesa!'],
              ['Para mí, y uno para el vecino', 'El vecino te va a adorar.'],
            ],
          },
          pt: {
            t: 'Você sai com um saquinho de doces. É para…',
            o: 'Pergunte para quem essa pessoa costuma comprar doces.',
            a: [
              ['Para mim, e está ótimo assim', 'Um presente seu para você. Perfeito.'],
              ['Para a mesa toda do almoço', 'Vou pôr a mesa!'],
              ['Para mim, e um para o vizinho', 'O vizinho vai te adorar.'],
            ],
          },
          nl: {
            t: 'Je loopt naar buiten met een zakje lekkers. Het is voor…',
            o: 'Vraag voor wie die persoon meestal lekkers koopt.',
            a: [
              ['Mezelf, en dat is prima zo', 'Een cadeautje van jou, voor jou. Top.'],
              ['De hele tafel van vanmiddag', 'Ik dek de tafel!'],
              ['Mezelf, plus eentje voor de buren', 'De buren gaan je geweldig vinden.'],
            ],
          },
        }),
        c('gourmandise_quignon', 'elan', [['😋', -70, 'temps_libre'], ['🏃', 60, 'projets']], {
          fr: {
            t: 'Sur le chemin du retour, la baguette est encore chaude.',
            o: 'Demande-lui si la baguette arrive entière chez elle ou lui.',
            a: [
              ['Je croque le quignon en marchant', 'Le meilleur moment de la journée.'],
              ['Je file, j’ai plein de choses à faire', 'La baguette suit le rythme, bravo.'],
            ],
          },
          en: {
            t: 'On the way home, the baguette is still warm.',
            o: 'Ask them if the baguette ever makes it home whole.',
            a: [
              ['I bite the end off as I walk', 'Best moment of the day.'],
              ['I hurry, I’ve got loads to do', 'The baguette keeps up, well done.'],
            ],
          },
          es: {
            t: 'De vuelta a casa, la barra aún está caliente.',
            o: 'Pregúntale si la barra llega entera a casa.',
            a: [
              ['Me como la punta por el camino', 'El mejor momento del día.'],
              ['Voy deprisa, tengo mil cosas que hacer', 'La barra sigue el ritmo, bravo.'],
            ],
          },
          pt: {
            t: 'No caminho de volta, a baguete ainda está quente.',
            o: 'Pergunte se a baguete chega inteira na casa dessa pessoa.',
            a: [
              ['Belisco a pontinha andando', 'O melhor momento do dia.'],
              ['Vou correndo, tenho muito a fazer', 'A baguete acompanha o ritmo, boa.'],
            ],
          },
          nl: {
            t: 'Op weg naar huis is het stokbrood nog warm.',
            o: 'Vraag of het stokbrood ooit heel thuiskomt bij die persoon.',
            a: [
              ['Ik eet onderweg het kontje op', 'Het beste moment van de dag.'],
              ['Ik haast me, ik heb nog veel te doen', 'Het stokbrood houdt het tempo bij.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'gourmandise_2',
      title: { fr: 'L’heure du goûter', en: 'Snack time', es: 'La merienda', pt: 'Hora do lanche', nl: 'Het vieruurtje' },
      questions: [
        c('gourmandise_heure_gouter', 'cap', [['🕓', 70, 'plan'], ['🍪', -60, 'spontane'], ['🎒', 40, 'ordre']], {
          fr: {
            t: 'Le goûter, chez toi, c’est…',
            o: 'Demande-lui à quelle heure tombe son goûter.',
            a: [
              ['À 16 h pile, c’est sacré', 'Je règle ma montre sur toi.'],
              ['Quand la faim se pointe', 'Ton ventre est ton agenda.'],
              ['Toujours un petit truc prévu dans mon sac', 'Ton sac, c’est une caverne aux trésors.'],
            ],
          },
          en: {
            t: 'For you, snack time is…',
            o: 'Ask them when their afternoon snack usually happens.',
            a: [
              ['4 pm sharp, it’s sacred', 'I’ll set my watch by you.'],
              ['Whenever hunger shows up', 'Your tummy is your diary.'],
              ['Always something packed in my bag', 'Your bag is a treasure cave.'],
            ],
          },
          es: {
            t: 'Para ti, la merienda es…',
            o: 'Pregúntale a qué hora suele merendar.',
            a: [
              ['A las 17 h en punto, sagrado', 'Pongo mi reloj en hora contigo.'],
              ['Cuando aprieta el hambre', 'Tu tripa es tu agenda.'],
              ['Siempre llevo algo en la mochila', 'Tu mochila es una cueva del tesoro.'],
            ],
          },
          pt: {
            t: 'Para você, a hora do lanche é…',
            o: 'Pergunte a que horas essa pessoa costuma lanchar.',
            a: [
              ['Às 16 h em ponto, é sagrado', 'Vou acertar meu relógio por você.'],
              ['Quando a fome aparece', 'Sua barriga é sua agenda.'],
              ['Sempre tenho algo na bolsa', 'Sua bolsa é uma caverna do tesouro.'],
            ],
          },
          nl: {
            t: 'Bij jou is het vieruurtje…',
            o: 'Vraag hoe laat die persoon meestal iets lekkers pakt.',
            a: [
              ['Om 16.00 uur stipt, heilig', 'Ik zet mijn klok op jou gelijk.'],
              ['Als de honger opduikt', 'Je buik is je agenda.'],
              ['Altijd iets bij me in mijn tas', 'Je tas is een schatkamer.'],
            ],
          },
        }),
        s('gourmandise_gouter_tablee', 'foyer', ['📖', -100, 'liberte'], ['🫖', 100, 'accueil'], {
          fr: { t: 'Ton goûter idéal, c’est…', o: 'Demande-lui avec qui elle ou il aime goûter.', a: [['En solo, tranquille, avec un livre', 'Je tourne les pages, tu manges.'], ['Une grande table où tout le monde pioche', 'Je pioche aussi, hein.']], m: 'Avec une ou deux personnes, parfait.' },
          en: { t: 'Your ideal afternoon snack is…', o: 'Ask them who they like having a snack with.', a: [['Solo, peaceful, with a book', 'I’ll turn the pages, you eat.'], ['A big table where everyone digs in', 'I’m digging in too, alright?']], m: 'With one or two people, perfect.' },
          es: { t: 'Tu merienda ideal es…', o: 'Pregúntale con quién le gusta merendar.', a: [['A solas, tranqui, con un libro', 'Yo paso las páginas, tú comes.'], ['Una mesa grande donde todos pican', 'Yo también pico, ¿eh?']], m: 'Con una o dos personas, perfecto.' },
          pt: { t: 'Seu lanche ideal é…', o: 'Pergunte com quem essa pessoa gosta de lanchar.', a: [['Só eu, na paz, com um livro', 'Eu viro as páginas, você come.'], ['Uma mesa grande, todo mundo beliscando', 'Eu também vou beliscar, tá?']], m: 'Com uma ou duas pessoas, perfeito.' },
          nl: { t: 'Je ideale vieruurtje is…', o: 'Vraag met wie die persoon graag iets lekkers eet.', a: [['Alleen, rustig, met een boek', 'Ik sla de bladzijden om, jij eet.'], ['Een grote tafel waar iedereen pakt', 'Ik pak ook, hoor.']], m: 'Met een of twee mensen, perfect.' },
        }),
        c('gourmandise_tartine', 'ancrage', [['🍞', -70, 'racines'], ['🥭', 70, 'curiosite'], ['🍫', -20, null]], {
          fr: {
            t: 'Pour le goûter, tu sors…',
            o: 'Demande-lui ce qu’il y avait dans ses goûters d’avant.',
            a: [
              ['La tartine beurre-confiture de toujours', 'Un classique, comme un vieux pull.'],
              ['Un fruit que je n’ai jamais goûté', 'Ça se mange avec la peau ?'],
              ['Un carré de chocolat, simple', 'Simple et parfait, comme moi.'],
            ],
          },
          en: {
            t: 'For your snack, you reach for…',
            o: 'Ask them what their snacks used to look like.',
            a: [
              ['Good old bread, butter and jam', 'A classic, like a favourite jumper.'],
              ['A fruit I’ve never tasted', 'Do you eat the skin?'],
              ['A square of chocolate, simple', 'Simple and perfect, like me.'],
            ],
          },
          es: {
            t: 'Para merendar, sacas…',
            o: 'Pregúntale cómo eran sus meriendas de antes.',
            a: [
              ['La tostada con mantequilla y mermelada', 'Un clásico, como un jersey viejo.'],
              ['Una fruta que nunca he probado', '¿Se come con piel?'],
              ['Una onza de chocolate, sencillo', 'Sencillo y perfecto, como yo.'],
            ],
          },
          pt: {
            t: 'Na hora do lanche, você pega…',
            o: 'Pergunte como eram os lanches dessa pessoa antigamente.',
            a: [
              ['O pão com manteiga e geleia de sempre', 'Um clássico, tipo moletom velho.'],
              ['Uma fruta que nunca provei', 'Come com casca?'],
              ['Um quadradinho de chocolate, simples', 'Simples e perfeito, igual a mim.'],
            ],
          },
          nl: {
            t: 'Als tussendoortje pak je…',
            o: 'Vraag hoe de tussendoortjes van die persoon vroeger waren.',
            a: [
              ['De boterham met jam van altijd', 'Een klassieker, zoals een oude trui.'],
              ['Een fruitsoort die ik nooit proefde', 'Eet je die met schil?'],
              ['Een blokje chocola, simpel', 'Simpel en perfect, net als ik.'],
            ],
          },
        }),
        c('gourmandise_gouter_ou', 'rythme', [['🛋️', -70, 'cocooning'], ['🌳', 20, 'dehors'], ['🎪', 80, 'monde']], {
          fr: {
            t: 'Un goûter un mercredi après-midi, tu le prends où ?',
            o: 'Demande-lui où elle ou il prend son goûter idéal.',
            a: [
              ['Sous un plaid, chez moi', 'Je me glisse sous le plaid aussi.'],
              ['Sur un banc au parc', 'Attention aux pigeons gourmands.'],
              ['À un goûter de quartier plein de monde', 'Je fais le tour des stands !'],
            ],
          },
          en: {
            t: 'A Wednesday afternoon snack: where do you have it?',
            o: 'Ask them where their ideal snack break happens.',
            a: [
              ['Under a blanket, at home', 'I’m sneaking under the blanket too.'],
              ['On a bench in the park', 'Watch out for greedy pigeons.'],
              ['At a busy neighbourhood tea party', 'I’m doing a lap of the stalls!'],
            ],
          },
          es: {
            t: 'Una merienda un miércoles por la tarde: ¿dónde?',
            o: 'Pregúntale dónde sería su merienda ideal.',
            a: [
              ['Bajo una manta, en casa', 'Me meto bajo la manta también.'],
              ['En un banco del parque', 'Ojo con las palomas golosas.'],
              ['En una merienda de barrio llena de gente', '¡Me doy una vuelta por los puestos!'],
            ],
          },
          pt: {
            t: 'Um lanche numa quarta à tarde: onde?',
            o: 'Pergunte onde seria o lanche ideal dessa pessoa.',
            a: [
              ['Debaixo da manta, em casa', 'Vou entrar debaixo da manta também.'],
              ['Num banco da praça', 'Cuidado com os pombos gulosos.'],
              ['Numa festa de bairro cheia de gente', 'Vou dar uma volta pelas barracas!'],
            ],
          },
          nl: {
            t: 'Een tussendoortje op woensdagmiddag: waar?',
            o: 'Vraag waar die persoon het liefst iets lekkers eet.',
            a: [
              ['Onder een dekentje, thuis', 'Ik kruip er ook onder.'],
              ['Op een bankje in het park', 'Pas op voor snoepende duiven.'],
              ['Op een druk buurtfeestje', 'Ik doe een rondje langs de kraampjes!'],
            ],
          },
        }),
        s('gourmandise_gouter_pause', 'elan', ['☕', -100, 'temps_libre'], ['⚡', 100, 'projets'], {
          fr: { t: 'Le goûter, pour toi, c’est surtout…', o: 'Demande-lui ce que représente le goûter pour elle ou lui.', a: [['Une vraie pause, je décroche', 'On ferme tout, on savoure.'], ['Du carburant pour finir ce que j’ai commencé', 'Plein fait, on repart !']], m: 'Un peu des deux selon la journée.' },
          en: { t: 'For you, a snack break is mostly…', o: 'Ask them what a snack break means to them.', a: [['A real pause, I switch off', 'Close everything, savour.'], ['Fuel to finish what I started', 'Tank full, off we go!']], m: 'A bit of both, depending on the day.' },
          es: { t: 'Para ti, merendar es sobre todo…', o: 'Pregúntale qué significa la merienda para esa persona.', a: [['Una pausa de verdad, desconecto', 'Cerramos todo y a disfrutar.'], ['Gasolina para acabar lo empezado', '¡Depósito lleno, seguimos!']], m: 'Un poco de cada, según el día.' },
          pt: { t: 'Para você, o lanche é principalmente…', o: 'Pergunte o que a hora do lanche significa para essa pessoa.', a: [['Uma pausa de verdade, eu desligo', 'Fecha tudo e aproveita.'], ['Combustível para terminar o que comecei', 'Tanque cheio, bora!']], m: 'Um pouco de cada, depende do dia.' },
          nl: { t: 'Voor jou is het vieruurtje vooral…', o: 'Vraag wat het vieruurtje voor die persoon betekent.', a: [['Echte pauze, ik schakel uit', 'Alles dicht, genieten maar.'], ['Brandstof om af te maken waar ik aan begon', 'Tank vol, we gaan weer!']], m: 'Een beetje van allebei, per dag anders.' },
        }),
      ],
    },
    {
      id: 'gourmandise_3',
      title: { fr: 'Le dessert', en: 'Pudding', es: 'El postre', pt: 'A sobremesa', nl: 'Het toetje' },
      questions: [
        c('gourmandise_carte_desserts', 'cap', [['🔍', 70, 'plan'], ['🎲', -60, 'spontane'], ['🤝', -20, null]], {
          fr: {
            t: 'Au restaurant, le dessert…',
            o: 'Demande-lui si elle ou il garde toujours une place pour le dessert.',
            a: [
              ['Je lis la carte des desserts avant les plats', 'Stratégie de pro, je note.'],
              ['Je décide à la fin, selon la place qu’il reste', 'Il reste toujours une petite place.'],
              ['Je prends ce qu’on me conseille', 'Confiance totale, j’aime ça.'],
            ],
          },
          en: {
            t: 'At a restaurant, pudding…',
            o: 'Ask them if they always save room for pudding.',
            a: [
              ['I read the pudding menu before the mains', 'Pro strategy, noted.'],
              ['I decide at the end, depending on room left', 'There’s always a little room.'],
              ['I go for whatever they recommend', 'Total trust, I love it.'],
            ],
          },
          es: {
            t: 'En el restaurante, el postre…',
            o: 'Pregúntale si siempre deja hueco para el postre.',
            a: [
              ['Leo la carta de postres antes que los platos', 'Estrategia de experto, apuntado.'],
              ['Lo decido al final, según el hueco', 'Siempre queda un huequito.'],
              ['Pido lo que me recomienden', 'Confianza total, me encanta.'],
            ],
          },
          pt: {
            t: 'No restaurante, a sobremesa…',
            o: 'Pergunte se essa pessoa sempre guarda espaço para a sobremesa.',
            a: [
              ['Leio o cardápio de sobremesas antes dos pratos', 'Estratégia de profissional, anotado.'],
              ['Decido no fim, conforme o espaço', 'Sempre sobra um espacinho.'],
              ['Peço o que me recomendarem', 'Confiança total, adoro.'],
            ],
          },
          nl: {
            t: 'In een restaurant, het dessert…',
            o: 'Vraag of die persoon altijd ruimte overhoudt voor het dessert.',
            a: [
              ['Ik lees de dessertkaart vóór de hoofdgerechten', 'Pro-strategie, genoteerd.'],
              ['Ik beslis op het eind, als er plek is', 'Er is altijd nog een plekje.'],
              ['Ik neem wat ze aanraden', 'Volle vertrouwen, heerlijk.'],
            ],
          },
        }),
        c('gourmandise_cuillere', 'foyer', [['🥄', 70, 'accueil'], ['🛡️', -60, 'liberte'], ['🍰', 20, null]], {
          fr: {
            t: 'Ton dessert arrive. À côté, une cuillère s’approche…',
            o: 'Demande-lui si elle ou il partage son dessert.',
            a: [
              ['Bien sûr, on partage tout', 'Je tends ma cuillère aussi, du coup.'],
              ['Mon dessert, c’est mon dessert', 'Je monte la garde avec toi.'],
              ['Une bouchée, pas plus', 'Une seule. Je compte.'],
            ],
          },
          en: {
            t: 'Your pudding arrives. A spoon creeps closer from next door…',
            o: 'Ask them if they share their pudding.',
            a: [
              ['Of course, we share everything', 'Then I’m holding out my spoon too.'],
              ['My pudding is my pudding', 'I’ll stand guard with you.'],
              ['One bite, no more', 'Just one. I’m counting.'],
            ],
          },
          es: {
            t: 'Llega tu postre. Al lado, una cuchara se acerca…',
            o: 'Pregúntale si comparte su postre.',
            a: [
              ['Claro, se comparte todo', 'Entonces yo también acerco la cuchara.'],
              ['Mi postre es mi postre', 'Monto guardia contigo.'],
              ['Un bocado, ni uno más', 'Solo uno. Lo cuento.'],
            ],
          },
          pt: {
            t: 'Sua sobremesa chega. Do lado, uma colher se aproxima…',
            o: 'Pergunte se essa pessoa divide a sobremesa.',
            a: [
              ['Claro, a gente divide tudo', 'Então também vou estender minha colher.'],
              ['Minha sobremesa é minha', 'Faço a guarda com você.'],
              ['Uma colherada, só', 'Só uma. Tô contando.'],
            ],
          },
          nl: {
            t: 'Je dessert komt. Naast je nadert een lepeltje…',
            o: 'Vraag of die persoon het dessert deelt.',
            a: [
              ['Natuurlijk, we delen alles', 'Dan steek ik mijn lepel ook uit.'],
              ['Mijn dessert is mijn dessert', 'Ik hou samen met jou de wacht.'],
              ['Eén hapje, niet meer', 'Eentje. Ik tel mee.'],
            ],
          },
        }),
        s('gourmandise_creation', 'ancrage', ['🍮', -100, 'racines'], ['🧪', 100, 'curiosite'], {
          fr: { t: 'Entre un dessert classique et une création étonnante…', o: 'Demande-lui le dessert le plus étonnant qu’elle ou il ait goûté.', a: [['La crème caramel comme à la maison', 'Le goût de toujours, ça rassure.'], ['Le dessert basilic et poivre rose', 'Du basilic ? Intrigant, vas-y.']], m: 'Un classique revisité, pourquoi pas.' },
          en: { t: 'Between a classic pudding and a surprising creation…', o: 'Ask them about the most surprising pudding they’ve ever tasted.', a: [['Crème caramel like at home', 'That familiar taste is so comforting.'], ['The basil and pink pepper dessert', 'Basil? I’m curious, go on.']], m: 'A classic with a twist, why not.' },
          es: { t: 'Entre un postre clásico y una creación sorprendente…', o: 'Pregúntale cuál es el postre más sorprendente que ha probado.', a: [['El flan como en casa', 'El sabor de siempre reconforta.'], ['El postre de albahaca y pimienta rosa', '¿Albahaca? Me pica la curiosidad.']], m: 'Un clásico renovado, ¿por qué no?' },
          pt: { t: 'Entre uma sobremesa clássica e uma criação surpreendente…', o: 'Pergunte qual foi a sobremesa mais surpreendente que essa pessoa já provou.', a: [['O pudim igual ao de casa', 'O gosto de sempre dá conforto.'], ['A sobremesa de manjericão e pimenta-rosa', 'Manjericão? Que curiosidade, vai.']], m: 'Um clássico repaginado, por que não.' },
          nl: { t: 'Tussen een klassiek toetje en een verrassende creatie…', o: 'Vraag naar het meest verrassende dessert dat die persoon ooit proefde.', a: [['Karamelpudding zoals thuis', 'Die vertrouwde smaak, zo fijn.'], ['Het dessert met basilicum en roze peper', 'Basilicum? Ik ben benieuwd, toe maar.']], m: 'Een klassieker met een twist, waarom niet.' },
        }),
        c('gourmandise_apres_dessert', 'rythme', [['🛋️', -80, 'cocooning'], ['🗨️', -20, 'calme'], ['💃', 70, 'fete']], {
          fr: {
            t: 'Le dessert est fini. Ensuite ?',
            o: 'Demande-lui comment se termine un bon repas pour elle ou lui.',
            a: [
              ['Canapé, direct', 'Je réserve le coussin de gauche.'],
              ['On reste à table à papoter', 'Encore une heure, au moins.'],
              ['On bouge, la soirée continue ailleurs', 'Je prends mon écharpe !'],
            ],
          },
          en: {
            t: 'Pudding’s done. What next?',
            o: 'Ask them how a good meal ends for them.',
            a: [
              ['Straight to the sofa', 'Dibs on the left cushion.'],
              ['We stay at the table chatting', 'Another hour, at least.'],
              ['We head out, the night goes on', 'Grabbing my scarf!'],
            ],
          },
          es: {
            t: 'Se acabó el postre. ¿Y ahora?',
            o: 'Pregúntale cómo termina una buena comida para esa persona.',
            a: [
              ['Al sofá, directo', 'Me pido el cojín de la izquierda.'],
              ['Sobremesa larga charlando', 'Una hora más, como mínimo.'],
              ['Nos movemos, la noche sigue', '¡Cojo mi bufanda!'],
            ],
          },
          pt: {
            t: 'A sobremesa acabou. E agora?',
            o: 'Pergunte como uma boa refeição termina para essa pessoa.',
            a: [
              ['Sofá, direto', 'Reservo a almofada da esquerda.'],
              ['A gente fica à mesa batendo papo', 'Mais uma hora, no mínimo.'],
              ['Bora, a noite continua em outro lugar', 'Vou pegar meu cachecol!'],
            ],
          },
          nl: {
            t: 'Het toetje is op. En nu?',
            o: 'Vraag hoe een fijne maaltijd voor die persoon eindigt.',
            a: [
              ['Meteen de bank op', 'Ik claim het linkerkussen.'],
              ['We blijven aan tafel kletsen', 'Nog een uurtje, minstens.'],
              ['We gaan op pad, de avond gaat door', 'Ik pak mijn sjaal!'],
            ],
          },
        }),
        c('gourmandise_apporter', 'elan', [['🍓', -20, null], ['🏆', 80, 'projets'], ['🛒', -60, 'temps_libre']], {
          fr: {
            t: 'On te demande d’apporter le dessert.',
            o: 'Demande-lui quel dessert elle ou il apporte quand on l’invite.',
            a: [
              ['Des fruits frais, simple et bon', 'Frais et joli, rien à redire.'],
              ['Je me lance un défi : un fraisier', 'Un fraisier ! Je tiens la poche à douille.'],
              ['J’achète un bon gâteau et je profite', 'Plus de temps pour papoter.'],
            ],
          },
          en: {
            t: 'You’re asked to bring pudding.',
            o: 'Ask them what pudding they bring when invited over.',
            a: [
              ['Fresh fruit, simple and good', 'Fresh and pretty, no complaints.'],
              ['I set myself a challenge: a fancy cake', 'Ooh! I’ll hold the piping bag.'],
              ['I buy a nice cake and relax', 'More time for chatting.'],
            ],
          },
          es: {
            t: 'Te piden que lleves el postre.',
            o: 'Pregúntale qué postre lleva cuando le invitan.',
            a: [
              ['Fruta fresca, sencillo y rico', 'Fresco y bonito, nada que decir.'],
              ['Me pongo un reto: una tarta de fresas', '¡Uy! Yo sujeto la manga pastelera.'],
              ['Compro una buena tarta y a disfrutar', 'Más tiempo para charlar.'],
            ],
          },
          pt: {
            t: 'Pediram para você levar a sobremesa.',
            o: 'Pergunte que sobremesa essa pessoa leva quando é convidada.',
            a: [
              ['Frutas frescas, simples e gostoso', 'Fresco e bonito, nada a dizer.'],
              ['Me desafio: uma torta de morango', 'Oba! Eu seguro o saco de confeitar.'],
              ['Compro um bolo bom e aproveito', 'Mais tempo pra conversar.'],
            ],
          },
          nl: {
            t: 'Je wordt gevraagd het toetje mee te nemen.',
            o: 'Vraag welk toetje die persoon meeneemt als die ergens te gast is.',
            a: [
              ['Vers fruit, simpel en lekker', 'Fris en mooi, niks op aan te merken.'],
              ['Ik daag mezelf uit: een aardbeientaart', 'Oeh! Ik hou de spuitzak vast.'],
              ['Ik koop een goede taart en geniet', 'Meer tijd om te kletsen.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'gourmandise_4',
      title: { fr: 'En cuisine', en: 'In the kitchen', es: 'En la cocina', pt: 'Na cozinha', nl: 'In de keuken' },
      questions: [
        c('gourmandise_pesee', 'cap', [['⚖️', 80, 'ordre'], ['👐', -70, 'spontane'], ['📖', 30, 'plan']], {
          fr: {
            t: 'Tu fais un gâteau.',
            o: 'Demande-lui comment elle ou il suit une recette.',
            a: [
              ['Je pèse tout au gramme près', 'Précision de laboratoire, chapeau.'],
              ['À l’œil, et on verra bien', 'L’aventure sort du four !'],
              ['La recette, avec quelques libertés', 'Un brin de folie dosé au gramme.'],
            ],
          },
          en: {
            t: 'You’re baking a cake.',
            o: 'Ask them how closely they follow a recipe.',
            a: [
              ['I weigh everything to the gram', 'Lab-level precision, hats off.'],
              ['By eye, and we’ll see', 'Adventure straight out of the oven!'],
              ['The recipe, with a few liberties', 'A dash of madness, measured to the gram.'],
            ],
          },
          es: {
            t: 'Estás haciendo un bizcocho.',
            o: 'Pregúntale cómo sigue una receta.',
            a: [
              ['Lo peso todo al gramo', 'Precisión de laboratorio, chapó.'],
              ['A ojo, y ya veremos', '¡La aventura sale del horno!'],
              ['La receta, con alguna libertad', 'Una pizca de locura, medida al gramo.'],
            ],
          },
          pt: {
            t: 'Você está fazendo um bolo.',
            o: 'Pergunte como essa pessoa segue uma receita.',
            a: [
              ['Peso tudo no grama', 'Precisão de laboratório, tiro o chapéu.'],
              ['No olho, e vamos ver', 'A aventura sai do forno!'],
              ['A receita, com algumas liberdades', 'Uma pitada de loucura, medida no grama.'],
            ],
          },
          nl: {
            t: 'Je bakt een taart.',
            o: 'Vraag hoe precies die persoon een recept volgt.',
            a: [
              ['Ik weeg alles op de gram af', 'Laboratoriumprecisie, petje af.'],
              ['Op het oog, we zien wel', 'Avontuur recht uit de oven!'],
              ['Het recept, met wat vrijheden', 'Een snufje gekte, op de gram afgewogen.'],
            ],
          },
        }),
        s('gourmandise_nouvelle_recette', 'ancrage', ['📒', -100, 'racines'], ['🌍', 100, 'curiosite'], {
          fr: { t: 'Ce week-end, en cuisine…', o: 'Demande-lui quelle pâtisserie elle ou il rêve d’essayer.', a: [['Ma recette fétiche, connue par cœur', 'Je pourrais la faire les yeux fermés.'], ['Une pâtisserie que je n’ai jamais faite', 'Nouvelle recette, nouvelle aventure !']], m: 'Ma recette, avec une touche nouvelle.' },
          en: { t: 'This weekend, in the kitchen…', o: 'Ask them which bake they dream of trying.', a: [['My signature recipe, known by heart', 'I could make it with my eyes shut.'], ['A bake I’ve never made before', 'New recipe, new adventure!']], m: 'My recipe, with a new twist.' },
          es: { t: 'Este finde, en la cocina…', o: 'Pregúntale qué dulce sueña con probar a hacer.', a: [['Mi receta estrella, de memoria', 'Podría hacerla con los ojos cerrados.'], ['Un dulce que nunca he hecho', '¡Receta nueva, aventura nueva!']], m: 'Mi receta, con un toque nuevo.' },
          pt: { t: 'Neste fim de semana, na cozinha…', o: 'Pergunte que doce essa pessoa sonha em tentar fazer.', a: [['Minha receita favorita, de cor', 'Eu faria de olhos fechados.'], ['Um doce que nunca fiz', 'Receita nova, aventura nova!']], m: 'Minha receita, com um toque novo.' },
          nl: { t: 'Dit weekend, in de keuken…', o: 'Vraag welk baksel die persoon ooit eens wil proberen.', a: [['Mijn vaste recept, uit mijn hoofd', 'Ik kan het blind maken.'], ['Iets wat ik nog nooit gebakken heb', 'Nieuw recept, nieuw avontuur!']], m: 'Mijn recept, met een nieuwe twist.' },
        }),
        c('gourmandise_patisser_avec', 'foyer', [['🎧', -70, 'liberte'], ['🧑‍🍳', 70, 'cuisine']], {
          fr: {
            t: 'Pâtisser, c’est mieux…',
            o: 'Demande-lui avec qui elle ou il aime cuisiner.',
            a: [
              ['En solo, avec ma musique', 'Je danse dans un coin, promis.'],
              ['À plusieurs, avec de la farine partout', 'J’ai déjà de la farine sur le nez.'],
            ],
          },
          en: {
            t: 'Baking is better…',
            o: 'Ask them who they like cooking with.',
            a: [
              ['Solo, with my music on', 'I’ll dance in a corner, promise.'],
              ['In a group, flour everywhere', 'I’ve already got flour on my nose.'],
            ],
          },
          es: {
            t: 'Hacer repostería es mejor…',
            o: 'Pregúntale con quién le gusta cocinar.',
            a: [
              ['A solas, con mi música', 'Yo bailo en un rincón, prometido.'],
              ['En grupo, con harina por todas partes', 'Ya tengo harina en la nariz.'],
            ],
          },
          pt: {
            t: 'Fazer doces é melhor…',
            o: 'Pergunte com quem essa pessoa gosta de cozinhar.',
            a: [
              ['Só eu, com minha música', 'Eu danço num canto, prometo.'],
              ['Em turma, com farinha por todo lado', 'Já estou com farinha no nariz.'],
            ],
          },
          nl: {
            t: 'Bakken is leuker…',
            o: 'Vraag met wie die persoon graag kookt.',
            a: [
              ['Alleen, met mijn muziek aan', 'Ik dans in een hoekje, beloofd.'],
              ['Met z’n allen, overal bloem', 'Ik heb al bloem op mijn neus.'],
            ],
          },
        }),
        c('gourmandise_gateau_rate', 'elan', [['🔁', 80, 'projets'], ['🥄', -60, null], ['🏷️', -20, 'humour']], {
          fr: {
            t: 'Ton gâteau s’effondre en sortant du four.',
            o: 'Demande-lui son plus beau raté en cuisine.',
            a: [
              ['J’en refais un, je veux le réussir', 'Deuxième fournée, on y croit !'],
              ['On le mange à la cuillère, c’est pareil', 'Moi, je trouve ça encore meilleur.'],
              ['Je le rebaptise « gâteau rustique »', 'Rustique, c’est très tendance.'],
            ],
          },
          en: {
            t: 'Your cake collapses as it comes out of the oven.',
            o: 'Ask them about their best kitchen flop.',
            a: [
              ['I make another, I want to nail it', 'Second batch, we believe!'],
              ['We eat it with a spoon, same thing', 'Honestly, it’s even better.'],
              ['I rename it “rustic cake”', 'Rustic is very on trend.'],
            ],
          },
          es: {
            t: 'Tu bizcocho se hunde al salir del horno.',
            o: 'Pregúntale cuál ha sido su mejor desastre en la cocina.',
            a: [
              ['Hago otro, quiero que salga bien', '¡Segunda hornada, vamos!'],
              ['Nos lo comemos a cucharadas, igual', 'Yo creo que está aún mejor.'],
              ['Lo rebautizo «bizcocho rústico»', 'Lo rústico está de moda.'],
            ],
          },
          pt: {
            t: 'Seu bolo desmorona ao sair do forno.',
            o: 'Pergunte qual foi o melhor desastre dessa pessoa na cozinha.',
            a: [
              ['Faço outro, quero acertar', 'Segunda fornada, bora!'],
              ['A gente come de colher, dá na mesma', 'Pra mim fica até melhor.'],
              ['Rebatizo de “bolo rústico”', 'Rústico está super na moda.'],
            ],
          },
          nl: {
            t: 'Je taart zakt in als hij uit de oven komt.',
            o: 'Vraag naar de mooiste mislukking van die persoon in de keuken.',
            a: [
              ['Ik bak een nieuwe, hij moet lukken', 'Tweede poging, we geloven erin!'],
              ['We eten hem met een lepel, net zo lekker', 'Ik vind het zelfs lekkerder.'],
              ['Ik noem hem voortaan “rustieke taart”', 'Rustiek is heel hip.'],
            ],
          },
        }),
        s('gourmandise_cuisine_ambiance', 'rythme', ['🕯️', -100, 'calme'], ['🎉', 100, 'fete'], {
          fr: { t: 'Quand tu pâtisses, ta cuisine est…', o: 'Demande-lui à quoi ressemble sa cuisine quand elle ou il pâtisse.', a: [['Calme, c’est ma bulle', 'Je chuchote près du four.'], ['Pleine de monde qui goûte la pâte', 'Je fais la queue pour le saladier !']], m: 'Une ou deux personnes qui passent, c’est bien.' },
          en: { t: 'When you bake, your kitchen is…', o: 'Ask them what their kitchen is like when they bake.', a: [['Calm, it’s my bubble', 'I’ll whisper by the oven.'], ['Full of people tasting the batter', 'I’m queuing for the bowl!']], m: 'One or two people dropping by is nice.' },
          es: { t: 'Cuando haces dulces, tu cocina está…', o: 'Pregúntale cómo es su cocina cuando hace dulces.', a: [['Tranquila, es mi burbuja', 'Susurro junto al horno.'], ['Llena de gente probando la masa', '¡Hago cola para el bol!']], m: 'Una o dos personas que pasan, bien.' },
          pt: { t: 'Quando você faz doces, sua cozinha fica…', o: 'Pergunte como fica a cozinha dessa pessoa quando ela faz doces.', a: [['Calma, é a minha bolha', 'Vou sussurrar perto do forno.'], ['Cheia de gente provando a massa', 'Tô na fila pra raspar a tigela!']], m: 'Uma ou duas pessoas passando, tudo bem.' },
          nl: { t: 'Als je bakt, is je keuken…', o: 'Vraag hoe de keuken van die persoon eruitziet tijdens het bakken.', a: [['Rustig, het is mijn bubbel', 'Ik fluister bij de oven.'], ['Vol mensen die van het beslag proeven', 'Ik sta in de rij voor de kom!']], m: 'Een of twee mensen die langskomen, fijn.' },
        }),
      ],
    },
    {
      id: 'gourmandise_5',
      title: { fr: 'Petites envies', en: 'Little cravings', es: 'Antojos', pt: 'Vontades', nl: 'Kleine trek' },
      questions: [
        c('gourmandise_envie_soir', 'cap', [['🗄️', 60, 'ordre'], ['🏃', -60, 'spontane'], ['🍯', -20, null]], {
          fr: {
            t: '22 h, une grosse envie de sucré.',
            o: 'Demande-lui ce qu’elle ou il grignote quand l’envie arrive le soir.',
            a: [
              ['J’ai ma réserve prévue pour ça', 'Le placard secret, je le savais.'],
              ['Je file à l’épicerie du coin', 'En chaussons ? J’arrive.'],
              ['Je bricole un truc avec ce qu’il y a', 'Chef de l’improvisation sucrée.'],
            ],
          },
          en: {
            t: '10 pm, a huge sugar craving.',
            o: 'Ask them what they nibble when a late craving hits.',
            a: [
              ['I keep a stash just for this', 'The secret cupboard, I knew it.'],
              ['I pop out to the corner shop', 'In slippers? I’m coming.'],
              ['I rustle up something from what’s there', 'Chef of sweet improvisation.'],
            ],
          },
          es: {
            t: 'Las 22 h, unas ganas enormes de dulce.',
            o: 'Pregúntale qué picotea cuando le entra el antojo por la noche.',
            a: [
              ['Tengo mi reserva para esto', 'El armario secreto, lo sabía.'],
              ['Bajo a la tienda de la esquina', '¿En zapatillas? Voy contigo.'],
              ['Me apaño algo con lo que hay', 'Chef de la improvisación dulce.'],
            ],
          },
          pt: {
            t: '22 h, uma vontade enorme de doce.',
            o: 'Pergunte o que essa pessoa belisca quando bate a vontade à noite.',
            a: [
              ['Tenho meu estoque só para isso', 'O armário secreto, eu sabia.'],
              ['Corro até a mercearia da esquina', 'De chinelo? Tô indo junto.'],
              ['Invento algo com o que tiver', 'Chef da improvisação doce.'],
            ],
          },
          nl: {
            t: '22.00 uur, enorme zin in iets zoets.',
            o: 'Vraag wat die persoon ’s avonds pakt als de trek toeslaat.',
            a: [
              ['Ik heb er een voorraadje voor', 'De geheime kast, ik wist het.'],
              ['Ik ren naar de winkel om de hoek', 'Op sloffen? Ik kom mee.'],
              ['Ik fix iets met wat er is', 'Chef zoete improvisatie.'],
            ],
          },
        }),
        s('gourmandise_envie_inconnue', 'ancrage', ['🍫', -100, 'racines'], ['🍡', 100, 'curiosite'], {
          fr: { t: 'Une envie de douceur, tu la combles avec…', o: 'Demande-lui sa douceur réconfort préférée.', a: [['Mon chocolat préféré, toujours le même', 'Fidèle au carré près.'], ['Une sucrerie inconnue du rayon du monde', 'Il y a des inscriptions que je ne lis pas !']], m: 'Ça dépend des jours.' },
          en: { t: 'When a craving hits, you satisfy it with…', o: 'Ask them what their go-to comfort treat is.', a: [['My favourite chocolate, always the same', 'Loyal down to the last square.'], ['A mystery sweet from the world foods aisle', 'There’s writing I can’t read!']], m: 'Depends on the day.' },
          es: { t: 'Un antojo de dulce lo calmas con…', o: 'Pregúntale cuál es su dulce reconfortante preferido.', a: [['Mi chocolate de siempre', 'Fiel hasta la última onza.'], ['Un dulce desconocido de la sección internacional', '¡Tiene letras que no sé leer!']], m: 'Depende del día.' },
          pt: { t: 'Uma vontade de doce, você mata com…', o: 'Pergunte qual é o doce de conforto preferido dessa pessoa.', a: [['Meu chocolate favorito, sempre o mesmo', 'Fiel até o último quadradinho.'], ['Um doce desconhecido da seção importada', 'Tem letras que não consigo ler!']], m: 'Depende do dia.' },
          nl: { t: 'Trek in iets zoets stil je met…', o: 'Vraag wat de favoriete troostsnack van die persoon is.', a: [['Mijn favoriete chocola, altijd dezelfde', 'Trouw tot het laatste blokje.'], ['Onbekend snoep uit de wereldafdeling', 'Er staan letters op die ik niet kan lezen!']], m: 'Hangt van de dag af.' },
        }),
        c('gourmandise_paquet', 'foyer', [['📣', 70, 'accueil'], ['🤫', -60, 'liberte'], ['🍪', 20, null]], {
          fr: {
            t: 'Tu ouvres un paquet de biscuits devant les autres.',
            o: 'Demande-lui si ses biscuits font le tour de la pièce.',
            a: [
              ['Je fais tourner le paquet', 'Le paquet revient vide, mais quelle ambiance.'],
              ['Je le savoure discrètement', 'Le bruit du papier va te trahir.'],
              ['J’en propose à qui me regarde', 'Je te regarde. Très fort.'],
            ],
          },
          en: {
            t: 'You open a packet of biscuits in front of others.',
            o: 'Ask them if their biscuits get passed around the room.',
            a: [
              ['I pass the packet round', 'It comes back empty, but what a vibe.'],
              ['I enjoy them quietly', 'The rustling will give you away.'],
              ['I offer some to whoever’s looking', 'I’m looking. Very hard.'],
            ],
          },
          es: {
            t: 'Abres un paquete de galletas delante de los demás.',
            o: 'Pregúntale si sus galletas dan la vuelta a la sala.',
            a: [
              ['Hago circular el paquete', 'Vuelve vacío, pero qué buen rollo.'],
              ['Me las como con discreción', 'El ruido del envoltorio te delata.'],
              ['Ofrezco a quien me mira', 'Te estoy mirando. Mucho.'],
            ],
          },
          pt: {
            t: 'Você abre um pacote de biscoitos na frente dos outros.',
            o: 'Pergunte se os biscoitos dessa pessoa rodam pela sala.',
            a: [
              ['Passo o pacote pra todo mundo', 'Volta vazio, mas que clima bom.'],
              ['Como discretamente', 'O barulho do pacote vai te entregar.'],
              ['Ofereço a quem estiver olhando', 'Tô olhando. Muito.'],
            ],
          },
          nl: {
            t: 'Je opent een pak koekjes waar anderen bij zijn.',
            o: 'Vraag of de koekjes van die persoon de ronde doen.',
            a: [
              ['Ik laat het pak rondgaan', 'Het komt leeg terug, maar wat gezellig.'],
              ['Ik eet ze stilletjes op', 'Het geritsel verraadt je.'],
              ['Ik bied het aan wie kijkt', 'Ik kijk. Heel hard.'],
            ],
          },
        }),
        c('gourmandise_patisserie_loin', 'rythme', [['🛋️', -70, 'cocooning'], ['🚋', 70, 'monde']], {
          fr: {
            t: 'On parle d’une pâtisserie géniale à l’autre bout de la ville.',
            o: 'Demande-lui jusqu’où elle ou il irait pour une bonne pâtisserie.',
            a: [
              ['Je reste au chaud, ce sera pour une autre fois', 'Un jour, elle viendra à toi.'],
              ['J’y vais et j’embarque des gens', 'Expédition sucrée, je fais le guide !'],
            ],
          },
          en: {
            t: 'Word is there’s a brilliant pâtisserie across town.',
            o: 'Ask them how far they’d travel for a great pastry.',
            a: [
              ['I stay cosy, another time', 'One day it’ll come to you.'],
              ['I go and bring people along', 'Sweet expedition, I’ll be the guide!'],
            ],
          },
          es: {
            t: 'Dicen que hay una pastelería genial en la otra punta de la ciudad.',
            o: 'Pregúntale hasta dónde iría por un buen pastel.',
            a: [
              ['Me quedo en casita, otro día será', 'Algún día vendrá ella a ti.'],
              ['Voy y me llevo a gente', '¡Expedición dulce, yo hago de guía!'],
            ],
          },
          pt: {
            t: 'Falam de uma confeitaria incrível do outro lado da cidade.',
            o: 'Pergunte até onde essa pessoa iria por um bom doce.',
            a: [
              ['Fico no quentinho, fica pra outra vez', 'Um dia ela vem até você.'],
              ['Vou e levo uma turma junto', 'Expedição doce, eu sou o guia!'],
            ],
          },
          nl: {
            t: 'Er schijnt een geweldige banketbakker aan de andere kant van de stad te zitten.',
            o: 'Vraag hoe ver die persoon zou reizen voor een goed gebakje.',
            a: [
              ['Ik blijf lekker thuis, een andere keer', 'Ooit komt hij naar jou.'],
              ['Ik ga en neem mensen mee', 'Zoete expeditie, ik ben de gids!'],
            ],
          },
        }),
        s('gourmandise_recompense', 'elan', ['😋', -100, 'temps_libre'], ['🎯', 100, 'projets'], {
          fr: { t: 'Ta douceur, tu la manges…', o: 'Demande-lui si elle ou il garde le meilleur pour la fin.', a: [['Tout de suite, la vie est courte', 'Pourquoi attendre ? Miam.'], ['Une fois le travail fini, en récompense', 'Elle aura encore meilleur goût.']], m: 'Un bout maintenant, le reste après.' },
          en: { t: 'Your treat, you eat it…', o: 'Ask them if they save the best for last.', a: [['Right now, life is short', 'Why wait? Yum.'], ['Once the work’s done, as a reward', 'It’ll taste even better.']], m: 'A bit now, the rest later.' },
          es: { t: 'Tu capricho, te lo comes…', o: 'Pregúntale si deja lo mejor para el final.', a: [['Ya mismo, la vida es corta', '¿Para qué esperar? Ñam.'], ['Al acabar el trabajo, como premio', 'Sabrá todavía mejor.']], m: 'Un poco ahora, el resto luego.' },
          pt: { t: 'Seu docinho, você come…', o: 'Pergunte se essa pessoa deixa o melhor para o final.', a: [['Agora mesmo, a vida é curta', 'Pra que esperar? Nham.'], ['Depois do trabalho, como prêmio', 'Vai ficar ainda mais gostoso.']], m: 'Um pouco agora, o resto depois.' },
          nl: { t: 'Je lekkernij eet je…', o: 'Vraag of die persoon het beste voor het laatst bewaart.', a: [['Meteen, het leven is kort', 'Waarom wachten? Mmm.'], ['Als het werk af is, als beloning', 'Dan smaakt het nog beter.']], m: 'Een stukje nu, de rest later.' },
        }),
      ],
    },
    {
      id: 'gourmandise_6',
      title: { fr: 'Offrir des douceurs', en: 'Giving treats', es: 'Regalar dulces', pt: 'Presentear com doces', nl: 'Lekkers geven' },
      questions: [
        c('gourmandise_boite_chocolats', 'cap', [['🗓️', 70, 'plan'], ['🏃', -70, 'spontane'], ['🎁', 20, null]], {
          fr: {
            t: 'Tu offres une boîte de chocolats.',
            o: 'Demande-lui comment elle ou il choisit un cadeau gourmand.',
            a: [
              ['Commandée il y a deux semaines', 'Ruban assorti, je parie.'],
              ['Attrapée sur le chemin', 'Le cadeau du cœur et du dernier moment.'],
              ['Je compose la boîte moi-même', 'Je goûte un chocolat pour vérifier ?'],
            ],
          },
          en: {
            t: 'You’re giving a box of chocolates.',
            o: 'Ask them how they choose a sweet gift.',
            a: [
              ['Ordered two weeks ago', 'Matching ribbon, I bet.'],
              ['Grabbed on the way', 'From the heart, at the last minute.'],
              ['I pick each one myself', 'Shall I taste one to check?'],
            ],
          },
          es: {
            t: 'Regalas una caja de bombones.',
            o: 'Pregúntale cómo elige un regalo goloso.',
            a: [
              ['Encargada hace dos semanas', 'Con lazo a juego, seguro.'],
              ['Pillada por el camino', 'Regalo de corazón y de última hora.'],
              ['Elijo cada bombón yo', '¿Pruebo uno para comprobar?'],
            ],
          },
          pt: {
            t: 'Você vai dar uma caixa de bombons.',
            o: 'Pergunte como essa pessoa escolhe um presente gostoso.',
            a: [
              ['Encomendada há duas semanas', 'Com fita combinando, aposto.'],
              ['Peguei no caminho', 'Presente de coração e de última hora.'],
              ['Eu monto a caixa', 'Posso provar um pra conferir?'],
            ],
          },
          nl: {
            t: 'Je geeft een doos bonbons.',
            o: 'Vraag hoe die persoon een lekker cadeau kiest.',
            a: [
              ['Twee weken geleden besteld', 'Met bijpassend lint, wedden?'],
              ['Onderweg meegegrist', 'Uit het hart, op het laatste moment.'],
              ['Ik stel de doos zelf samen', 'Zal ik er eentje proeven ter controle?'],
            ],
          },
        }),
        s('gourmandise_fait_maison', 'elan', ['🛍️', -100, 'temps_libre'], ['🍪', 100, 'projets'], {
          fr: { t: 'Un cadeau gourmand, tu le…', o: 'Demande-lui le plus beau cadeau gourmand qu’elle ou il ait offert.', a: [['Achète, et je garde du temps pour moi', 'Malin, et tout aussi gentil.'], ['Fais maison, j’y passe le week-end', 'Un week-end de biscuits ? J’en suis.']], m: 'Acheté, avec un petit mot écrit main.' },
          en: { t: 'A sweet gift, you…', o: 'Ask them about the best sweet gift they’ve ever given.', a: [['Buy it, and keep time for myself', 'Smart, and just as kind.'], ['Make it, I spend the weekend on it', 'A weekend of biscuits? Count me in.']], m: 'Bought, with a handwritten note.' },
          es: { t: 'Un regalo goloso, lo…', o: 'Pregúntale cuál es el mejor regalo goloso que ha hecho.', a: [['Compro, y me guardo tiempo para mí', 'Listo, e igual de bonito.'], ['Hago en casa, le dedico el finde', '¿Un finde de galletas? Me apunto.']], m: 'Comprado, con una notita a mano.' },
          pt: { t: 'Um presente gostoso, você…', o: 'Pergunte qual foi o melhor presente gostoso que essa pessoa já deu.', a: [['Compro, e guardo tempo pra mim', 'Esperto, e igualmente gentil.'], ['Faço em casa, passo o fim de semana nisso', 'Um fim de semana de biscoitos? Tô dentro.']], m: 'Comprado, com um bilhetinho à mão.' },
          nl: { t: 'Een lekker cadeau, dat…', o: 'Vraag naar het mooiste lekkere cadeau dat die persoon ooit gaf.', a: [['Koop ik, dan hou ik tijd voor mezelf', 'Slim, en net zo lief.'], ['Maak ik zelf, mijn hele weekend', 'Een weekend koekjes? Ik doe mee.']], m: 'Gekocht, met een handgeschreven kaartje.' },
        }),
        c('gourmandise_fournee', 'foyer', [['🚪', 80, 'accueil'], ['📦', -60, 'liberte'], ['🏢', 30, null]], {
          fr: {
            t: 'Il te reste toute une fournée de cookies.',
            o: 'Demande-lui ce qu’elle ou il fait de ses restes gourmands.',
            a: [
              ['Je frappe chez les voisins', 'Tout l’immeuble va t’aimer.'],
              ['Boîte en fer, réserve perso', 'Une réserve pour les jours gris, sage.'],
              ['Je les apporte au travail', 'Héros ou héroïne de la pause, direct.'],
            ],
          },
          en: {
            t: 'You’ve got a whole batch of cookies left.',
            o: 'Ask them what they do with leftover treats.',
            a: [
              ['I knock on the neighbours’ doors', 'The whole building will love you.'],
              ['Into a tin, my personal stash', 'A stash for grey days, wise.'],
              ['I take them to work', 'Instant break-time hero.'],
            ],
          },
          es: {
            t: 'Te sobra una hornada entera de galletas.',
            o: 'Pregúntale qué hace con los dulces que le sobran.',
            a: [
              ['Llamo a la puerta de los vecinos', 'Todo el edificio te va a querer.'],
              ['A una lata, mi reserva personal', 'Reserva para días grises, sabio.'],
              ['Me las llevo al trabajo', 'Estrella del descanso, al instante.'],
            ],
          },
          pt: {
            t: 'Sobrou uma fornada inteira de cookies.',
            o: 'Pergunte o que essa pessoa faz com os doces que sobram.',
            a: [
              ['Bato na porta dos vizinhos', 'O prédio todo vai te amar.'],
              ['Pote de lata, estoque pessoal', 'Estoque pros dias cinzentos, sábio.'],
              ['Levo pro trabalho', 'Estrela do cafezinho, na hora.'],
            ],
          },
          nl: {
            t: 'Je hebt nog een hele ovenplaat koekjes over.',
            o: 'Vraag wat die persoon met overgebleven lekkers doet.',
            a: [
              ['Ik klop aan bij de buren', 'Het hele gebouw gaat van je houden.'],
              ['In een blik, mijn eigen voorraad', 'Een voorraadje voor grijze dagen, wijs.'],
              ['Ik neem ze mee naar het werk', 'Meteen de held van de pauze.'],
            ],
          },
        }),
        c('gourmandise_specialite', 'ancrage', [['🏡', -70, 'racines'], ['🗺️', 70, 'voyage']], {
          fr: {
            t: 'Tu apportes une douceur à quelqu’un. Tu choisis…',
            o: 'Demande-lui quelle douceur elle ou il aime faire découvrir.',
            a: [
              ['La spécialité de ma région', 'Un petit bout de chez toi, joli.'],
              ['Une douceur découverte en voyage', 'Un souvenir qui se mange !'],
            ],
          },
          en: {
            t: 'You’re bringing someone a treat. You choose…',
            o: 'Ask them which treat they love introducing people to.',
            a: [
              ['The speciality from my region', 'A little piece of home, lovely.'],
              ['A treat I discovered while travelling', 'A souvenir you can eat!'],
            ],
          },
          es: {
            t: 'Le llevas un dulce a alguien. Eliges…',
            o: 'Pregúntale qué dulce le encanta dar a conocer.',
            a: [
              ['La especialidad de mi tierra', 'Un trocito de tu casa, qué bonito.'],
              ['Un dulce que descubrí de viaje', '¡Un recuerdo que se come!'],
            ],
          },
          pt: {
            t: 'Você vai levar um doce para alguém. Escolhe…',
            o: 'Pergunte que doce essa pessoa adora apresentar aos outros.',
            a: [
              ['A especialidade da minha região', 'Um pedacinho da sua terra, que lindo.'],
              ['Um doce que descobri viajando', 'Uma lembrança que se come!'],
            ],
          },
          nl: {
            t: 'Je neemt iets lekkers mee voor iemand. Je kiest…',
            o: 'Vraag welk lekkers die persoon graag aan anderen laat proeven.',
            a: [
              ['De specialiteit uit mijn streek', 'Een stukje thuis, mooi.'],
              ['Iets wat ik op reis ontdekte', 'Een souvenir dat je kunt eten!'],
            ],
          },
        }),
        s('gourmandise_remise', 'rythme', ['💌', -100, 'calme'], ['🎊', 100, 'fete'], {
          fr: { t: 'Ton cadeau gourmand, tu le remets…', o: 'Demande-lui comment elle ou il aime offrir.', a: [['En douce, avec un petit mot', 'Discret comme un chat qui ronronne.'], ['Devant tout le monde, avec une chanson', 'Je fais les chœurs !']], m: 'En main propre, sans chichis.' },
          en: { t: 'Your sweet gift, you hand it over…', o: 'Ask them how they like to give gifts.', a: [['Quietly, with a little note', 'Discreet as a purring cat.'], ['In front of everyone, with a song', 'I’ll do backing vocals!']], m: 'In person, no fuss.' },
          es: { t: 'Tu regalo goloso lo entregas…', o: 'Pregúntale cómo le gusta regalar.', a: [['Con discreción, con una notita', 'Discreto como un gato ronroneando.'], ['Delante de todos, con canción', '¡Yo hago los coros!']], m: 'En mano, sin florituras.' },
          pt: { t: 'Seu presente gostoso, você entrega…', o: 'Pergunte como essa pessoa gosta de presentear.', a: [['De mansinho, com um bilhete', 'Discreto como um gato ronronando.'], ['Na frente de todos, com música', 'Eu faço o coro!']], m: 'Em mãos, sem frescura.' },
          nl: { t: 'Je lekkere cadeau geef je…', o: 'Vraag hoe die persoon graag iets geeft.', a: [['Stilletjes, met een kaartje', 'Discreet als een spinnende kat.'], ['Waar iedereen bij is, met een liedje', 'Ik zing de achtergrondkoortjes!']], m: 'Persoonlijk, zonder poespas.' },
        }),
      ],
    },
    {
      id: 'gourmandise_7',
      title: { fr: 'Saveurs d’ailleurs', en: 'Flavours from afar', es: 'Sabores de fuera', pt: 'Sabores de longe', nl: 'Smaken van elders' },
      questions: [
        s('gourmandise_rayon_monde', 'ancrage', ['🧈', -100, 'racines'], ['🌏', 100, 'curiosite'], {
          fr: { t: 'Au rayon des douceurs du monde…', o: 'Demande-lui la douceur étrangère qu’elle ou il adore.', a: [['Je reviens à mes biscuits habituels', 'Les copains de toujours, rassurants.'], ['Je prends l’étiquette que je ne sais pas lire', 'On ouvre ensemble ? Suspense !']], m: 'Un petit nouveau parmi mes habitudes.' },
          en: { t: 'In the world sweets aisle…', o: 'Ask them which foreign treat they adore.', a: [['I go back to my usual biscuits', 'Old friends, so reassuring.'], ['I grab the label I can’t read', 'Shall we open it together? Suspense!']], m: 'One newcomer among my usuals.' },
          es: { t: 'En la sección de dulces del mundo…', o: 'Pregúntale qué dulce extranjero le encanta.', a: [['Vuelvo a mis galletas de siempre', 'Los amigos de siempre, qué tranquilidad.'], ['Cojo la etiqueta que no sé leer', '¿Lo abrimos juntos? ¡Qué intriga!']], m: 'Un nuevo entre mis costumbres.' },
          pt: { t: 'Na seção de doces do mundo…', o: 'Pergunte qual doce estrangeiro essa pessoa adora.', a: [['Volto pros meus biscoitos de sempre', 'Os amigos de sempre, que conforto.'], ['Pego o rótulo que não sei ler', 'Vamos abrir juntos? Suspense!']], m: 'Um novato entre os de sempre.' },
          nl: { t: 'Bij het schap met snoep uit de hele wereld…', o: 'Vraag welk buitenlands lekkers die persoon geweldig vindt.', a: [['Ik ga terug naar mijn vaste koekjes', 'Oude vrienden, zo vertrouwd.'], ['Ik pak het etiket dat ik niet kan lezen', 'Samen openmaken? Spannend!']], m: 'Eén nieuwkomer tussen mijn vaste keuzes.' },
        }),
        c('gourmandise_ouverture', 'cap', [['📅', 60, 'plan'], ['🚶', -60, 'spontane'], ['📲', 30, null]], {
          fr: {
            t: 'Une pâtisserie japonaise ouvre dans ton quartier.',
            o: 'Demande-lui la dernière adresse gourmande qu’elle ou il a testée.',
            a: [
              ['Je note la date d’ouverture', 'Premier ou première dans la file !'],
              ['J’entrerai un jour en passant devant', 'Le hasard fait bien les choses.'],
              ['Je regarde d’abord la carte en ligne', 'Repérage en douce, malin.'],
            ],
          },
          en: {
            t: 'A Japanese pâtisserie is opening in your area.',
            o: 'Ask them about the last sweet spot they tried.',
            a: [
              ['I note the opening date', 'First in the queue!'],
              ['I’ll pop in one day as I pass', 'Chance does things nicely.'],
              ['I check the menu online first', 'Sneaky scouting, clever.'],
            ],
          },
          es: {
            t: 'Abre una pastelería japonesa en tu barrio.',
            o: 'Pregúntale cuál es el último sitio goloso que ha probado.',
            a: [
              ['Apunto la fecha de apertura', '¡Primero en la cola!'],
              ['Entraré algún día al pasar', 'El azar hace bien las cosas.'],
              ['Miro antes la carta en internet', 'Exploración discreta, qué listo.'],
            ],
          },
          pt: {
            t: 'Uma confeitaria japonesa vai abrir no seu bairro.',
            o: 'Pergunte qual foi o último lugar gostoso que essa pessoa testou.',
            a: [
              ['Anoto a data de abertura', 'Primeiro da fila!'],
              ['Um dia entro quando passar na frente', 'O acaso faz bem as coisas.'],
              ['Olho o cardápio online antes', 'Sondagem discreta, esperto.'],
            ],
          },
          nl: {
            t: 'Er opent een Japanse patisserie in je buurt.',
            o: 'Vraag naar de laatste lekkere zaak die die persoon uitprobeerde.',
            a: [
              ['Ik noteer de openingsdatum', 'Als eerste in de rij!'],
              ['Ik loop er ooit eens binnen', 'Het toeval doet het goed.'],
              ['Ik bekijk eerst de kaart online', 'Stiekem verkennen, slim.'],
            ],
          },
        }),
        c('gourmandise_atelier_macarons', 'elan', [['🎓', 80, 'projets'], ['🍵', -60, 'temps_libre'], ['👅', 10, 'curiosite']], {
          fr: {
            t: 'Un atelier pour apprendre les macarons…',
            o: 'Demande-lui quelle douceur elle ou il aimerait savoir faire.',
            a: [
              ['Je m’inscris, je veux maîtriser', 'Bientôt des macarons parfaits !'],
              ['Je préfère les déguster tranquille', 'La dégustation, c’est un art aussi.'],
              ['J’y vais surtout pour goûter', 'On a le même plan, toi et moi.'],
            ],
          },
          en: {
            t: 'A workshop to learn how to make macarons…',
            o: 'Ask them which treat they’d love to know how to make.',
            a: [
              ['I sign up, I want to master it', 'Perfect macarons coming soon!'],
              ['I’d rather just enjoy eating them', 'Tasting is an art too.'],
              ['I go mainly for the tasting', 'Same plan as me.'],
            ],
          },
          es: {
            t: 'Un taller para aprender a hacer macarons…',
            o: 'Pregúntale qué dulce le gustaría saber hacer.',
            a: [
              ['Me apunto, quiero dominarlo', '¡Pronto macarons perfectos!'],
              ['Prefiero comerlos tranquilamente', 'Degustar también es un arte.'],
              ['Voy sobre todo a probar', 'Tenemos el mismo plan.'],
            ],
          },
          pt: {
            t: 'Uma oficina para aprender a fazer macarons…',
            o: 'Pergunte que doce essa pessoa gostaria de saber fazer.',
            a: [
              ['Me inscrevo, quero dominar', 'Em breve, macarons perfeitos!'],
              ['Prefiro só saborear com calma', 'Saborear também é uma arte.'],
              ['Vou mais pra provar', 'Mesmo plano que o meu.'],
            ],
          },
          nl: {
            t: 'Een workshop om macarons te leren maken…',
            o: 'Vraag welk lekkers die persoon graag zou kunnen maken.',
            a: [
              ['Ik schrijf me in, ik wil het beheersen', 'Binnenkort perfecte macarons!'],
              ['Ik eet ze liever rustig op', 'Proeven is ook een kunst.'],
              ['Ik ga vooral om te proeven', 'Zelfde plan als ik.'],
            ],
          },
        }),
        c('gourmandise_ramener', 'foyer', [['🧳', 70, 'accueil'], ['🌸', -60, 'liberte']], {
          fr: {
            t: 'En voyage, tu découvres une douceur incroyable.',
            o: 'Demande-lui la meilleure douceur goûtée loin de chez elle ou lui.',
            a: [
              ['J’en rapporte pour tout le monde', 'Ta valise sent le sucre, j’adore.'],
              ['Je la savoure pour moi, mon souvenir', 'Un secret délicieux, bien gardé.'],
            ],
          },
          en: {
            t: 'Travelling, you discover an amazing treat.',
            o: 'Ask them about the best treat they’ve tasted far from home.',
            a: [
              ['I bring some back for everyone', 'Your suitcase smells sweet, love it.'],
              ['I savour it alone, my own memory', 'A delicious secret, well kept.'],
            ],
          },
          es: {
            t: 'De viaje, descubres un dulce increíble.',
            o: 'Pregúntale cuál es el mejor dulce que ha probado lejos de casa.',
            a: [
              ['Traigo para todo el mundo', 'Tu maleta huele a azúcar, me encanta.'],
              ['Lo disfruto a solas, mi recuerdo', 'Un secreto delicioso, bien guardado.'],
            ],
          },
          pt: {
            t: 'Viajando, você descobre um doce incrível.',
            o: 'Pergunte qual foi o melhor doce que essa pessoa provou longe de casa.',
            a: [
              ['Trago pra todo mundo', 'Sua mala tem cheiro de açúcar, amei.'],
              ['Saboreio só eu, minha lembrança', 'Um segredo delicioso, bem guardado.'],
            ],
          },
          nl: {
            t: 'Op reis ontdek je iets ongelooflijk lekkers.',
            o: 'Vraag naar het lekkerste wat die persoon ver van huis proefde.',
            a: [
              ['Ik neem voor iedereen wat mee', 'Je koffer ruikt zoet, heerlijk.'],
              ['Ik geniet er alleen van, mijn herinnering', 'Een lekker geheim, goed bewaard.'],
            ],
          },
        }),
        c('gourmandise_salon_chocolat', 'rythme', [['🎟️', 80, 'monde'], ['🛋️', -70, 'cocooning'], ['🕘', -20, 'calme']], {
          fr: {
            t: 'Un salon du chocolat en ville ce week-end.',
            o: 'Demande-lui si elle ou il aime les salons gourmands.',
            a: [
              ['J’y fonce, j’adore la foule gourmande', 'Je te suis entre les stands !'],
              ['J’attends qu’on m’en rapporte', 'Le chocolat vient à toi, royal.'],
              ['J’y vais à l’ouverture, avant la foule', 'Les dégustations rien que pour nous.'],
            ],
          },
          en: {
            t: 'A chocolate fair in town this weekend.',
            o: 'Ask them if they enjoy food fairs.',
            a: [
              ['I dash there, I love a greedy crowd', 'I’ll follow you between the stalls!'],
              ['I wait for someone to bring me some', 'Chocolate comes to you, royal.'],
              ['I go at opening, before the crowds', 'Tastings all to ourselves.'],
            ],
          },
          es: {
            t: 'Un salón del chocolate en la ciudad este finde.',
            o: 'Pregúntale si le gustan las ferias gastronómicas.',
            a: [
              ['Voy volando, me encanta el gentío goloso', '¡Te sigo entre los puestos!'],
              ['Espero a que me traigan', 'El chocolate viene a ti, de lujo.'],
              ['Voy a la apertura, antes del gentío', 'Las catas solo para nosotros.'],
            ],
          },
          pt: {
            t: 'Uma feira de chocolate na cidade neste fim de semana.',
            o: 'Pergunte se essa pessoa gosta de feiras gastronômicas.',
            a: [
              ['Vou correndo, adoro a multidão gulosa', 'Vou atrás de você entre as barracas!'],
              ['Espero alguém me trazer', 'O chocolate vem até você, chique.'],
              ['Vou na abertura, antes da multidão', 'As degustações só pra gente.'],
            ],
          },
          nl: {
            t: 'Dit weekend is er een chocoladebeurs in de stad.',
            o: 'Vraag of die persoon van foodbeurzen houdt.',
            a: [
              ['Ik ga erheen, ik hou van een snoepende menigte', 'Ik volg je langs de kraampjes!'],
              ['Ik wacht tot iemand wat meeneemt', 'De chocola komt naar jou, chic.'],
              ['Ik ga bij de opening, vóór de drukte', 'Proeverijen helemaal voor ons.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'gourmandise_8',
      title: { fr: 'Souvenirs sucrés', en: 'Sweet memories', es: 'Recuerdos dulces', pt: 'Lembranças doces', nl: 'Zoete herinneringen' },
      questions: [
        c('gourmandise_recette_transmise', 'ancrage', [['📜', -70, 'racines'], ['🔄', 60, 'curiosite'], ['✏️', 10, null]], {
          fr: {
            t: 'On te confie une recette de famille.',
            o: 'Demande-lui la recette qu’elle ou il tient de quelqu’un.',
            a: [
              ['Je la refais exactement pareil', 'Gardien ou gardienne du goût.'],
              ['Je la réinvente à ma façon', 'La recette prend un coup de jeune !'],
              ['Pareil, avec une note en marge', 'Une petite trace de toi dedans.'],
            ],
          },
          en: {
            t: 'Someone hands down a family recipe to you.',
            o: 'Ask them about a recipe they got from someone.',
            a: [
              ['I make it exactly the same', 'Guardian of the flavour.'],
              ['I reinvent it my own way', 'The recipe gets a fresh look!'],
              ['The same, with a note in the margin', 'A little trace of you in it.'],
            ],
          },
          es: {
            t: 'Te confían una receta de familia.',
            o: 'Pregúntale qué receta ha heredado de alguien.',
            a: [
              ['La hago exactamente igual', 'Guardián del sabor.'],
              ['La reinvento a mi manera', '¡La receta se pone al día!'],
              ['Igual, con una nota al margen', 'Un poquito de ti dentro.'],
            ],
          },
          pt: {
            t: 'Alguém te passa uma receita de família.',
            o: 'Pergunte qual receita essa pessoa herdou de alguém.',
            a: [
              ['Faço exatamente igual', 'Guardiã do sabor.'],
              ['Reinvento do meu jeito', 'A receita ganha cara nova!'],
              ['Igual, com uma anotação na margem', 'Um pouquinho de você ali.'],
            ],
          },
          nl: {
            t: 'Je krijgt een familierecept toevertrouwd.',
            o: 'Vraag welk recept die persoon van iemand heeft gekregen.',
            a: [
              ['Ik maak het precies hetzelfde', 'Bewaker van de smaak.'],
              ['Ik geef er mijn eigen draai aan', 'Het recept krijgt een opfrisbeurt!'],
              ['Hetzelfde, met een notitie in de kantlijn', 'Een klein spoortje van jou erin.'],
            ],
          },
        }),
        s('gourmandise_gouters_enfance', 'rythme', ['🏠', -100, 'calme'], ['⚽', 100, 'monde'], {
          fr: { t: 'Les goûters de ton enfance, c’était plutôt…', o: 'Demande-lui à quoi ressemblaient ses goûters d’enfance.', a: [['Tranquilles, à la maison', 'Le calme et les miettes sur la table.'], ['Dehors, avec toute la bande', 'Des genoux pleins de terre et de confiture !']], m: 'Un peu des deux, selon les jours.' },
          en: { t: 'Your childhood snack times were mostly…', o: 'Ask them what their childhood snack times were like.', a: [['Quiet, at home', 'Calm and crumbs on the table.'], ['Outside, with the whole gang', 'Knees covered in mud and jam!']], m: 'A bit of both, depending on the day.' },
          es: { t: 'Las meriendas de tu infancia eran más bien…', o: 'Pregúntale cómo eran sus meriendas de pequeño o pequeña.', a: [['Tranquilas, en casa', 'Calma y migas en la mesa.'], ['En la calle, con toda la pandilla', '¡Rodillas con barro y mermelada!']], m: 'Un poco de cada, según el día.' },
          pt: { t: 'Os lanches da sua infância eram mais…', o: 'Pergunte como eram os lanches da infância dessa pessoa.', a: [['Tranquilos, em casa', 'Calma e farelos na mesa.'], ['Na rua, com a turma toda', 'Joelhos cheios de terra e geleia!']], m: 'Um pouco de cada, dependia do dia.' },
          nl: { t: 'Je tussendoortjes als kind waren vooral…', o: 'Vraag hoe die persoon als kind iets lekkers at.', a: [['Rustig, thuis', 'Rust en kruimels op tafel.'], ['Buiten, met de hele bende', 'Knieën vol modder en jam!']], m: 'Een beetje van allebei.' },
        }),
        c('gourmandise_carnet', 'cap', [['📒', 80, 'ordre'], ['🧠', -60, 'spontane'], ['📸', 20, null]], {
          fr: {
            t: 'Tes recettes sucrées préférées sont…',
            o: 'Demande-lui où elle ou il range ses recettes.',
            a: [
              ['Dans un carnet, bien classées', 'Un trésor avec des onglets !'],
              ['Dans ma tête, à peu près', 'À peu près, c’est déjà délicieux.'],
              ['En photos quelque part dans mon téléphone', 'Entre deux couchers de soleil.'],
            ],
          },
          en: {
            t: 'Your favourite sweet recipes are…',
            o: 'Ask them where they keep their recipes.',
            a: [
              ['In a notebook, neatly sorted', 'A treasure with tabs!'],
              ['In my head, roughly', 'Roughly is already delicious.'],
              ['Photos somewhere on my phone', 'Between two sunsets.'],
            ],
          },
          es: {
            t: 'Tus recetas dulces favoritas están…',
            o: 'Pregúntale dónde guarda sus recetas.',
            a: [
              ['En una libreta, bien ordenadas', '¡Un tesoro con pestañas!'],
              ['En mi cabeza, más o menos', 'Más o menos ya está riquísimo.'],
              ['En fotos, en algún sitio del móvil', 'Entre dos puestas de sol.'],
            ],
          },
          pt: {
            t: 'Suas receitas doces favoritas estão…',
            o: 'Pergunte onde essa pessoa guarda as receitas.',
            a: [
              ['Num caderno, bem organizadas', 'Um tesouro com divisórias!'],
              ['Na minha cabeça, mais ou menos', 'Mais ou menos já fica delicioso.'],
              ['Em fotos, em algum lugar do celular', 'Entre dois pores do sol.'],
            ],
          },
          nl: {
            t: 'Je favoriete zoete recepten staan…',
            o: 'Vraag waar die persoon recepten bewaart.',
            a: [
              ['In een schriftje, netjes geordend', 'Een schat met tabbladen!'],
              ['In mijn hoofd, ongeveer', 'Ongeveer is al heerlijk.'],
              ['Als foto ergens op mijn telefoon', 'Tussen twee zonsondergangen.'],
            ],
          },
        }),
        c('gourmandise_odeur', 'foyer', [['📞', 70, 'famille'], ['🌸', -60, null]], {
          fr: {
            t: 'Une odeur de gâteau te rappelle un bon moment.',
            o: 'Demande-lui quelle odeur gourmande lui rappelle un bon souvenir.',
            a: [
              ['J’appelle quelqu’un pour en parler', 'Un souvenir, ça se partage.'],
              ['Je savoure le souvenir pour moi', 'Je ferme les yeux avec toi.'],
            ],
          },
          en: {
            t: 'The smell of cake reminds you of a happy moment.',
            o: 'Ask them which sweet smell brings back a happy memory.',
            a: [
              ['I call someone to talk about it', 'Memories are for sharing.'],
              ['I savour the memory on my own', 'I’ll close my eyes with you.'],
            ],
          },
          es: {
            t: 'Un olor a bizcocho te recuerda un buen momento.',
            o: 'Pregúntale qué olor goloso le trae un buen recuerdo.',
            a: [
              ['Llamo a alguien para contárselo', 'Los recuerdos se comparten.'],
              ['Saboreo el recuerdo para mí', 'Cierro los ojos contigo.'],
            ],
          },
          pt: {
            t: 'Um cheiro de bolo te lembra um momento bom.',
            o: 'Pergunte que cheiro gostoso traz uma boa lembrança para essa pessoa.',
            a: [
              ['Ligo pra alguém pra contar', 'Lembrança boa se compartilha.'],
              ['Saboreio a lembrança só pra mim', 'Fecho os olhos com você.'],
            ],
          },
          nl: {
            t: 'De geur van taart doet je denken aan een fijn moment.',
            o: 'Vraag welke lekkere geur die persoon aan iets fijns herinnert.',
            a: [
              ['Ik bel iemand om erover te praten', 'Herinneringen deel je.'],
              ['Ik geniet er in m’n eentje van', 'Ik doe mijn ogen dicht met je.'],
            ],
          },
        }),
        s('gourmandise_gateau_disparu', 'elan', ['🤷', -100, 'temps_libre'], ['🔎', 100, 'projets'], {
          fr: { t: 'Le biscuit de ton enfance a disparu des rayons.', o: 'Demande-lui quel biscuit d’enfance elle ou il aimerait retrouver.', a: [['Tant pis, j’en trouverai un autre', 'Plein d’autres biscuits t’attendent.'], ['Je retrouve la recette et je le recrée', 'Mission biscuit perdu, je t’aide !']], m: 'Je cherche un peu, sans me prendre la tête.' },
          en: { t: 'Your childhood biscuit has vanished from the shelves.', o: 'Ask them which childhood biscuit they’d love to find again.', a: [['Oh well, I’ll find another', 'Loads of other biscuits await.'], ['I find the recipe and recreate it', 'Mission lost biscuit, I’ll help!']], m: 'I look a bit, without stressing.' },
          es: { t: 'La galleta de tu infancia ha desaparecido de las tiendas.', o: 'Pregúntale qué galleta de su infancia le gustaría recuperar.', a: [['Bueno, ya encontraré otra', 'Te esperan muchas más galletas.'], ['Busco la receta y la recreo', '¡Misión galleta perdida, te ayudo!']], m: 'Busco un poco, sin agobios.' },
          pt: { t: 'O biscoito da sua infância sumiu das prateleiras.', o: 'Pergunte que biscoito da infância essa pessoa gostaria de reencontrar.', a: [['Paciência, acho outro', 'Muitos outros biscoitos te esperam.'], ['Acho a receita e recrio', 'Missão biscoito perdido, eu ajudo!']], m: 'Procuro um pouco, sem esquentar.' },
          nl: { t: 'Het koekje uit je jeugd ligt niet meer in de winkel.', o: 'Vraag welk jeugdkoekje die persoon graag terug zou willen.', a: [['Jammer, ik vind wel een ander', 'Er wachten nog genoeg koekjes.'], ['Ik zoek het recept en maak het na', 'Missie verloren koekje, ik help!']], m: 'Ik zoek een beetje, zonder stress.' },
        }),
      ],
    },
    {
      id: 'gourmandise_9',
      title: { fr: 'Sorties gourmandes', en: 'Sweet outings', es: 'Salidas golosas', pt: 'Passeios gostosos', nl: 'Zoete uitjes' },
      questions: [
        c('gourmandise_glacier', 'ancrage', [['🍦', -70, 'racines'], ['🌶️', 80, 'curiosite'], ['🍓', 10, null]], {
          fr: {
            t: 'Chez le glacier, ton parfum…',
            o: 'Demande-lui son parfum de glace préféré.',
            a: [
              ['Vanille, toujours', 'La vanille, une valeur sûre.'],
              ['Le plus bizarre de la liste', 'Glace au piment ? Je goûte avec toi.'],
              ['Le parfum du jour', 'Surprise du jour, j’adore.'],
            ],
          },
          en: {
            t: 'At the ice-cream shop, your flavour is…',
            o: 'Ask them what their favourite ice-cream flavour is.',
            a: [
              ['Vanilla, always', 'Vanilla, a safe bet.'],
              ['The weirdest one on the list', 'Chilli ice cream? I’ll try it with you.'],
              ['The flavour of the day', 'Daily surprise, love it.'],
            ],
          },
          es: {
            t: 'En la heladería, tu sabor es…',
            o: 'Pregúntale cuál es su sabor de helado favorito.',
            a: [
              ['Vainilla, siempre', 'La vainilla, apuesta segura.'],
              ['El más raro de la lista', '¿Helado de guindilla? Lo pruebo contigo.'],
              ['El sabor del día', 'Sorpresa del día, me encanta.'],
            ],
          },
          pt: {
            t: 'Na sorveteria, seu sabor é…',
            o: 'Pergunte qual é o sabor de sorvete favorito dessa pessoa.',
            a: [
              ['Baunilha, sempre', 'Baunilha, aposta certa.'],
              ['O mais esquisito da lista', 'Sorvete de pimenta? Provo com você.'],
              ['O sabor do dia', 'Surpresa do dia, adoro.'],
            ],
          },
          nl: {
            t: 'Bij de ijssalon is jouw smaak…',
            o: 'Vraag wat de favoriete ijssmaak van die persoon is.',
            a: [
              ['Vanille, altijd', 'Vanille, altijd goed.'],
              ['De gekste van de lijst', 'Pepersijs? Ik proef met je mee.'],
              ['De smaak van de dag', 'Verrassing van de dag, top.'],
            ],
          },
        }),
        c('gourmandise_creperie', 'foyer', [['👥', 80, 'accueil'], ['🙋', -70, 'liberte'], ['🤝', 20, null]], {
          fr: {
            t: 'Sortie crêpes ce soir.',
            o: 'Demande-lui avec qui elle ou il aime sortir manger une crêpe.',
            a: [
              ['On y va à huit, on prend la grande table', 'Huit crêpes, huit fous rires.'],
              ['Une crêpe à emporter, balade en solo', 'Je marche à côté, sans bruit.'],
              ['À deux ou trois, c’est l’idéal', 'Petit comité, grandes discussions.'],
            ],
          },
          en: {
            t: 'Crêpe night out tonight.',
            o: 'Ask them who they like going out for crêpes with.',
            a: [
              ['Eight of us, we take the big table', 'Eight crêpes, eight fits of giggles.'],
              ['A crêpe to go, a solo stroll', 'I’ll walk beside you, quietly.'],
              ['Two or three of us, ideal', 'Small group, big chats.'],
            ],
          },
          es: {
            t: 'Esta noche, salida de crepes.',
            o: 'Pregúntale con quién le gusta salir a comer crepes.',
            a: [
              ['Vamos ocho, cogemos la mesa grande', 'Ocho crepes, ocho ataques de risa.'],
              ['Un crepe para llevar, paseo a solas', 'Camino a tu lado, sin ruido.'],
              ['Dos o tres, lo ideal', 'Grupo pequeño, grandes charlas.'],
            ],
          },
          pt: {
            t: 'Hoje à noite tem saída para comer crepe.',
            o: 'Pergunte com quem essa pessoa gosta de sair para comer crepe.',
            a: [
              ['Vamos em oito, pegamos a mesa grande', 'Oito crepes, oito crises de riso.'],
              ['Um crepe pra viagem, passeio só eu', 'Caminho do seu lado, quietinho.'],
              ['Em dois ou três, o ideal', 'Grupo pequeno, papos grandes.'],
            ],
          },
          nl: {
            t: 'Vanavond pannenkoeken eten.',
            o: 'Vraag met wie die persoon graag pannenkoeken gaat eten.',
            a: [
              ['Met z’n achten, aan de grote tafel', 'Acht pannenkoeken, acht slappe lachen.'],
              ['Eentje om mee te nemen, alleen wandelen', 'Ik loop stilletjes naast je.'],
              ['Met z’n tweeën of drieën, ideaal', 'Klein clubje, grote gesprekken.'],
            ],
          },
        }),
        s('gourmandise_marche_stands', 'cap', ['🎲', -100, 'spontane'], ['🗒️', 100, 'plan'], {
          fr: { t: 'Au marché, devant les stands de douceurs…', o: 'Demande-lui ce qu’elle ou il rapporte toujours du marché.', a: [['Je goûte tout ce qu’on me tend', 'Encore un petit morceau ?'], ['Je suis ma liste, pas d’écart', 'Liste respectée, bravo la discipline.']], m: 'Ma liste, plus un petit écart.' },
          en: { t: 'At the market, in front of the sweet stalls…', o: 'Ask them what they always bring back from the market.', a: [['I taste everything I’m offered', 'Another little piece?'], ['I stick to my list, no detours', 'List respected, great discipline.']], m: 'My list, plus one little detour.' },
          es: { t: 'En el mercado, ante los puestos de dulces…', o: 'Pregúntale qué se trae siempre del mercado.', a: [['Pruebo todo lo que me ofrecen', '¿Otro trocito?'], ['Sigo mi lista, sin desvíos', 'Lista cumplida, qué disciplina.']], m: 'Mi lista, más un pequeño capricho.' },
          pt: { t: 'Na feira, diante das barracas de doces…', o: 'Pergunte o que essa pessoa sempre traz da feira.', a: [['Provo tudo que me oferecem', 'Mais um pedacinho?'], ['Sigo minha lista, sem desvio', 'Lista cumprida, que disciplina.']], m: 'Minha lista, mais um desviozinho.' },
          nl: { t: 'Op de markt, bij de kraampjes met lekkers…', o: 'Vraag wat die persoon altijd van de markt meeneemt.', a: [['Ik proef alles wat ik krijg', 'Nog een stukje?'], ['Ik hou me aan mijn lijstje', 'Lijstje gevolgd, knap gedaan.']], m: 'Mijn lijstje, plus één uitstapje.' },
        }),
        c('gourmandise_file_star', 'elan', [['⏳', 70, 'projets'], ['🚶', -60, 'temps_libre'], ['🌅', 20, null]], {
          fr: {
            t: 'Une pâtisserie star : une heure de queue.',
            o: 'Demande-lui si elle ou il attendrait longtemps pour une douceur.',
            a: [
              ['Je fais la queue, objectif fixé', 'Je garde ta place si tu veux.'],
              ['Je vais chez la petite d’à côté', 'Les petites adresses, ça a du charme.'],
              ['Je reviendrai à l’ouverture', 'Lève-tôt gourmand, j’adore.'],
            ],
          },
          en: {
            t: 'A star pâtisserie: an hour’s queue.',
            o: 'Ask them if they’d wait for a treat.',
            a: [
              ['I queue, goal set', 'I’ll save your spot if you like.'],
              ['I go to the little one next door', 'Small places have charm.'],
              ['I’ll come back at opening time', 'An early-bird foodie, love it.'],
            ],
          },
          es: {
            t: 'Una pastelería famosa: una hora de cola.',
            o: 'Pregúntale si esperaría por un dulce.',
            a: [
              ['Hago cola, objetivo fijado', 'Te guardo el sitio si quieres.'],
              ['Voy a la pequeña de al lado', 'Los sitios pequeños tienen encanto.'],
              ['Volveré a la hora de abrir', 'Madrugar por un dulce, me encanta.'],
            ],
          },
          pt: {
            t: 'Uma confeitaria famosa: uma hora de fila.',
            o: 'Pergunte se essa pessoa esperaria por um doce.',
            a: [
              ['Encaro a fila, objetivo definido', 'Guardo seu lugar se quiser.'],
              ['Vou na pequenininha do lado', 'Os lugares pequenos têm charme.'],
              ['Volto na hora de abrir', 'Madrugar por um doce, adoro.'],
            ],
          },
          nl: {
            t: 'Een beroemde patisserie: een uur in de rij.',
            o: 'Vraag of die persoon zou wachten voor iets lekkers.',
            a: [
              ['Ik sta in de rij, doel gesteld', 'Ik hou je plekje vrij als je wilt.'],
              ['Ik ga naar het zaakje ernaast', 'Kleine zaakjes hebben charme.'],
              ['Ik kom terug bij de opening', 'Een vroege vogel met trek, top.'],
            ],
          },
        }),
        c('gourmandise_tournee', 'rythme', [['🚲', 80, 'ville'], ['🧁', -30, 'calme'], ['🏡', -80, 'cocooning']], {
          fr: {
            t: 'Dimanche : tournée des pâtisseries du quartier ?',
            o: 'Demande-lui à quoi ressemble son dimanche gourmand.',
            a: [
              ['Oui ! Cinq adresses, on y va', 'Je prépare un plan avec des étoiles.'],
              ['Une seule, mais on prend le temps', 'Lentement, c’est meilleur.'],
              ['Je pâtisse chez moi, au chaud', 'Le four, c’est ma cheminée.'],
            ],
          },
          en: {
            t: 'Sunday: a tour of the local pâtisseries?',
            o: 'Ask them what their perfect sweet Sunday looks like.',
            a: [
              ['Yes! Five places, let’s go', 'I’m drawing a map with stars.'],
              ['Just one, but we take our time', 'Slowly is tastier.'],
              ['I bake at home, nice and cosy', 'The oven is my fireplace.'],
            ],
          },
          es: {
            t: 'Domingo: ¿ruta por las pastelerías del barrio?',
            o: 'Pregúntale cómo es su domingo goloso ideal.',
            a: [
              ['¡Sí! Cinco sitios, vamos', 'Preparo un mapa con estrellitas.'],
              ['Solo una, pero sin prisa', 'Despacio sabe mejor.'],
              ['Hago dulces en casa, calentito', 'El horno es mi chimenea.'],
            ],
          },
          pt: {
            t: 'Domingo: roteiro pelas confeitarias do bairro?',
            o: 'Pergunte como é o domingo gostoso ideal dessa pessoa.',
            a: [
              ['Sim! Cinco lugares, bora', 'Vou fazer um mapa com estrelinhas.'],
              ['Só uma, mas sem pressa', 'Devagar é mais gostoso.'],
              ['Faço doce em casa, no quentinho', 'O forno é minha lareira.'],
            ],
          },
          nl: {
            t: 'Zondag: een rondje langs de patisserieën in de buurt?',
            o: 'Vraag hoe de ideale zoete zondag van die persoon eruitziet.',
            a: [
              ['Ja! Vijf adressen, we gaan', 'Ik maak een kaartje met sterren.'],
              ['Eentje maar, met alle tijd', 'Langzaam is lekkerder.'],
              ['Ik bak thuis, lekker warm', 'De oven is mijn openhaard.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'gourmandise_10',
      title: { fr: 'Les fêtes sucrées', en: 'Sweet celebrations', es: 'Fiestas dulces', pt: 'Festas doces', nl: 'Zoete feestjes' },
      questions: [
        c('gourmandise_gateau_anniv', 'cap', [['📋', 70, 'plan'], ['🎲', -60, 'spontane']], {
          fr: {
            t: 'Le gâteau d’anniversaire d’un ou une proche…',
            o: 'Demande-lui le plus beau gâteau d’anniversaire qu’elle ou il ait vu.',
            a: [
              ['Commandé un mois à l’avance', 'Rien ne sera laissé au hasard.'],
              ['Improvisé le matin même', 'Les bougies tiennent, c’est l’essentiel.'],
            ],
          },
          en: {
            t: 'A loved one’s birthday cake…',
            o: 'Ask them about the best birthday cake they’ve ever seen.',
            a: [
              ['Ordered a month ahead', 'Nothing left to chance.'],
              ['Improvised that very morning', 'The candles stand up, that’s what counts.'],
            ],
          },
          es: {
            t: 'La tarta de cumpleaños de alguien cercano…',
            o: 'Pregúntale cuál es la tarta de cumpleaños más bonita que ha visto.',
            a: [
              ['Encargada con un mes de antelación', 'Nada queda al azar.'],
              ['Improvisada esa misma mañana', 'Las velas se sostienen, es lo que cuenta.'],
            ],
          },
          pt: {
            t: 'O bolo de aniversário de alguém querido…',
            o: 'Pergunte qual foi o bolo de aniversário mais bonito que essa pessoa já viu.',
            a: [
              ['Encomendado com um mês de antecedência', 'Nada fica ao acaso.'],
              ['Improvisado na mesma manhã', 'As velas ficam em pé, é o que importa.'],
            ],
          },
          nl: {
            t: 'De verjaardagstaart van iemand die je dierbaar is…',
            o: 'Vraag naar de mooiste verjaardagstaart die die persoon ooit zag.',
            a: [
              ['Een maand van tevoren besteld', 'Niets aan het toeval overgelaten.'],
              ['Dezelfde ochtend geïmproviseerd', 'De kaarsjes staan, daar gaat het om.'],
            ],
          },
        }),
        c('gourmandise_galette', 'rythme', [['👑', 80, 'fete'], ['🤫', -60, 'calme'], ['🎉', 30, 'monde']], {
          fr: {
            t: 'Galette des rois entre voisins.',
            o: 'Demande-lui si elle ou il a déjà eu la fève.',
            a: [
              ['Je veux la fève et la couronne', 'Votre Majesté, je m’incline.'],
              ['Je prends ma part tranquillement', 'Une part en douceur, parfait.'],
              ['Je viens surtout pour l’ambiance', 'L’ambiance, c’est la vraie fève.'],
            ],
          },
          en: {
            t: 'King cake with the neighbours.',
            o: 'Ask them if they’ve ever found the charm in the cake.',
            a: [
              ['I want the charm and the crown', 'Your Majesty, I bow.'],
              ['I take my slice quietly', 'A gentle slice, perfect.'],
              ['I’m mostly there for the vibe', 'The vibe is the real prize.'],
            ],
          },
          es: {
            t: 'Roscón entre vecinos.',
            o: 'Pregúntale si alguna vez le ha tocado la sorpresa.',
            a: [
              ['Quiero la sorpresa y la corona', 'Majestad, me inclino.'],
              ['Cojo mi trozo con calma', 'Un trozo tranquilo, perfecto.'],
              ['Voy sobre todo por el ambiente', 'El ambiente es la verdadera sorpresa.'],
            ],
          },
          pt: {
            t: 'Bolo-rei entre vizinhos.',
            o: 'Pergunte se essa pessoa já tirou o brinde do bolo.',
            a: [
              ['Quero o brinde e a coroa', 'Majestade, eu me curvo.'],
              ['Pego minha fatia na calma', 'Uma fatia tranquila, perfeito.'],
              ['Vou mais pelo clima', 'O clima é o verdadeiro brinde.'],
            ],
          },
          nl: {
            t: 'Driekoningentaart met de buren.',
            o: 'Vraag of die persoon ooit de boon in de taart vond.',
            a: [
              ['Ik wil de boon én de kroon', 'Majesteit, ik buig.'],
              ['Ik neem rustig mijn stukje', 'Een rustig stukje, perfect.'],
              ['Ik kom vooral voor de sfeer', 'De sfeer is de echte boon.'],
            ],
          },
        }),
        s('gourmandise_buffet', 'foyer', ['🧁', -100, 'liberte'], ['🍰', 100, 'accueil'], {
          fr: { t: 'Pour une fête, le buffet de desserts…', o: 'Demande-lui comment elle ou il aime préparer une fête.', a: [['Chacun apporte ce qu’il veut', 'Liberté totale, surprises garanties.'], ['On le prépare tous ensemble l’après-midi', 'J’ai mon tablier, j’arrive !']], m: 'Chacun le sien, et on dresse ensemble.' },
          en: { t: 'For a party, the pudding table…', o: 'Ask them how they like getting ready for a party.', a: [['Everyone brings what they like', 'Total freedom, surprises guaranteed.'], ['We make it all together that afternoon', 'Apron on, I’m coming!']], m: 'Each brings theirs, we set it out together.' },
          es: { t: 'Para una fiesta, la mesa de postres…', o: 'Pregúntale cómo le gusta preparar una fiesta.', a: [['Cada uno trae lo que quiere', 'Libertad total, sorpresas aseguradas.'], ['La preparamos todos juntos por la tarde', '¡Delantal puesto, voy!']], m: 'Cada uno el suyo, y montamos juntos.' },
          pt: { t: 'Numa festa, a mesa de sobremesas…', o: 'Pergunte como essa pessoa gosta de preparar uma festa.', a: [['Cada um traz o que quiser', 'Liberdade total, surpresas garantidas.'], ['A gente prepara junto à tarde', 'Avental no lugar, tô chegando!']], m: 'Cada um traz o seu, e a gente monta junto.' },
          nl: { t: 'Voor een feest, de desserttafel…', o: 'Vraag hoe die persoon graag een feest voorbereidt.', a: [['Iedereen neemt mee wat die wil', 'Totale vrijheid, verrassingen gegarandeerd.'], ['We maken alles samen die middag', 'Schort aan, ik kom eraan!']], m: 'Ieder het zijne, samen opdienen.' },
        }),
        c('gourmandise_fin_annee', 'ancrage', [['🏡', -70, 'racines'], ['🌏', 70, 'curiosite'], ['🎀', -10, null]], {
          fr: {
            t: 'Pour les fêtes de fin d’année, le dessert…',
            o: 'Demande-lui quel dessert annonce les fêtes pour elle ou lui.',
            a: [
              ['Toujours le même, c’est la tradition', 'Le goût des fêtes, intact.'],
              ['Chaque année un dessert d’un autre pays', 'Cette année, on part où ?'],
              ['Le classique, plus une petite surprise', 'Tradition et clin d’œil, joli.'],
            ],
          },
          en: {
            t: 'For the end-of-year holidays, the pudding is…',
            o: 'Ask them which pudding means the holidays for them.',
            a: [
              ['Always the same, it’s tradition', 'The taste of the holidays, intact.'],
              ['A pudding from a different country each year', 'Where are we off to this year?'],
              ['The classic, plus a little surprise', 'Tradition with a wink, lovely.'],
            ],
          },
          es: {
            t: 'En las fiestas de fin de año, el postre…',
            o: 'Pregúntale qué postre le anuncia las fiestas.',
            a: [
              ['Siempre el mismo, es tradición', 'El sabor de las fiestas, intacto.'],
              ['Cada año uno de otro país', '¿A dónde nos vamos este año?'],
              ['El clásico, más una sorpresita', 'Tradición con guiño, bonito.'],
            ],
          },
          pt: {
            t: 'Nas festas de fim de ano, a sobremesa…',
            o: 'Pergunte que sobremesa anuncia as festas para essa pessoa.',
            a: [
              ['Sempre a mesma, é tradição', 'O gosto das festas, intacto.'],
              ['Todo ano uma de outro país', 'Pra onde vamos este ano?'],
              ['A clássica, mais uma surpresinha', 'Tradição com uma piscadela, lindo.'],
            ],
          },
          nl: {
            t: 'Bij de feestdagen aan het eind van het jaar is het dessert…',
            o: 'Vraag welk dessert voor die persoon de feestdagen aankondigt.',
            a: [
              ['Altijd hetzelfde, traditie', 'De smaak van de feestdagen, intact.'],
              ['Elk jaar een dessert uit een ander land', 'Waar gaan we dit jaar heen?'],
              ['De klassieker, plus een verrassing', 'Traditie met een knipoog, mooi.'],
            ],
          },
        }),
        s('gourmandise_grand_dessert', 'elan', ['😌', -100, 'temps_libre'], ['🏗️', 100, 'projets'], {
          fr: { t: 'Pour une grande occasion, ton dessert…', o: 'Demande-lui le dessert le plus ambitieux qu’elle ou il ait tenté.', a: [['Simple, je veux profiter de la fête', 'Toi à la fête, c’est le vrai cadeau.'], ['Trois étages, mon grand projet', 'J’apporte l’échelle !']], m: 'Joli mais faisable, sans stress.' },
          en: { t: 'For a big occasion, your pudding is…', o: 'Ask them about the most ambitious pudding they’ve attempted.', a: [['Simple, I want to enjoy the party', 'You at the party, that’s the real gift.'], ['Three tiers, my big project', 'I’ll bring the ladder!']], m: 'Pretty but doable, no stress.' },
          es: { t: 'Para una gran ocasión, tu postre…', o: 'Pregúntale cuál es el postre más ambicioso que ha intentado.', a: [['Sencillo, quiero disfrutar de la fiesta', 'Tú en la fiesta, ese es el regalo.'], ['Tres pisos, mi gran proyecto', '¡Traigo la escalera!']], m: 'Bonito pero factible, sin estrés.' },
          pt: { t: 'Para uma grande ocasião, sua sobremesa…', o: 'Pergunte qual foi a sobremesa mais ambiciosa que essa pessoa já tentou.', a: [['Simples, quero curtir a festa', 'Você na festa, esse é o presente.'], ['Três andares, meu grande projeto', 'Eu levo a escada!']], m: 'Bonita mas possível, sem estresse.' },
          nl: { t: 'Voor een grote gelegenheid is je dessert…', o: 'Vraag naar het meest ambitieuze dessert dat die persoon ooit probeerde.', a: [['Simpel, ik wil van het feest genieten', 'Jij op het feest, dat is het cadeau.'], ['Drie verdiepingen, mijn grote project', 'Ik neem de ladder mee!']], m: 'Mooi maar haalbaar, zonder stress.' },
        }),
      ],
    },
  ],
};
