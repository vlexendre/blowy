// Univers « Café » : cafés, thés, terrasses, pauses, salons de thé.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'cafe',
  icon: '☕',
  title: {
    fr: ['Café et thé', 'Tasses, terrasses et pauses.'],
    en: ['Coffee and tea', 'Cups, terraces and breaks.'],
    es: ['Café y té', 'Tazas, terrazas y pausas.'],
    pt: ['Café e chá', 'Xícaras, varandas e pausas.'],
    nl: ['Koffie en thee', 'Kopjes, terrasjes en pauzes.'],
  },
  steps: [
    {
      id: 'cafe_1',
      title: { fr: 'Le premier café', en: 'The first cup', es: 'El primer café', pt: 'O primeiro café', nl: 'Het eerste kopje' },
      questions: [
        c('cafe_premiere_tasse', 'cap', [['⏱️', 70, 'ordre'], ['🌀', -60, 'spontane'], ['☕', -10, null]], {
          fr: {
            t: 'Ton premier café du matin…',
            o: 'Demande-lui à quoi ressemble sa première tasse de la journée.',
            a: [
              ['Même heure, même tasse, chaque jour', 'Un rituel bien huilé, j’adore.'],
              ['Quand j’y pense, parfois à midi', 'Le café t’attend, il est patient.'],
              ['Ça dépend de la journée', 'Chaque matin a sa propre tasse.'],
            ],
          },
          en: {
            t: 'Your first coffee of the morning…',
            o: 'Ask them what their first cup of the day looks like.',
            a: [
              ['Same time, same mug, every day', 'A well-oiled ritual, love it.'],
              ['When I remember, sometimes at noon', 'The coffee waits, it’s patient.'],
              ['It depends on the day', 'Every morning has its own cup.'],
            ],
          },
          es: {
            t: 'Tu primer café de la mañana…',
            o: 'Pregúntale cómo es su primera taza del día.',
            a: [
              ['Misma hora, misma taza, cada día', 'Un ritual bien engrasado, me encanta.'],
              ['Cuando me acuerdo, a veces a mediodía', 'El café te espera, tiene paciencia.'],
              ['Depende del día', 'Cada mañana tiene su taza.'],
            ],
          },
          pt: {
            t: 'Seu primeiro café da manhã…',
            o: 'Pergunte como é a primeira xícara do dia dessa pessoa.',
            a: [
              ['Mesma hora, mesma xícara, todo dia', 'Um ritual bem ensaiado, adoro.'],
              ['Quando lembro, às vezes ao meio-dia', 'O café espera, ele é paciente.'],
              ['Depende do dia', 'Cada manhã tem sua xícara.'],
            ],
          },
          nl: {
            t: 'Je eerste koffie van de ochtend…',
            o: 'Vraag hoe het eerste kopje van de dag van die persoon eruitziet.',
            a: [
              ['Zelfde tijd, zelfde mok, elke dag', 'Een goed geolied ritueel, heerlijk.'],
              ['Als ik eraan denk, soms pas om twaalf uur', 'De koffie wacht, die is geduldig.'],
              ['Hangt van de dag af', 'Elke ochtend heeft z’n eigen kopje.'],
            ],
          },
        }),
        s('cafe_matin_compagnie', 'foyer', ['🪟', -100, 'liberte'], ['🗣️', 100, 'accueil'], {
          fr: { t: 'Ce premier café, tu le prends…', o: 'Demande-lui avec qui elle ou il aime boire son café du matin.', a: [['Face à la fenêtre, rien qu’à moi', 'Toi, la vue et la vapeur.'], ['Autour de la table, à papoter', 'Je réclame une chaise !']], m: 'Avec une personne, ça suffit.' },
          en: { t: 'That first coffee, you have it…', o: 'Ask them who they like having their morning coffee with.', a: [['By the window, all to myself', 'You, the view and the steam.'], ['Round the table, chatting away', 'I’m claiming a chair!']], m: 'With one person, that’s plenty.' },
          es: { t: 'Ese primer café, te lo tomas…', o: 'Pregúntale con quién le gusta tomar el café de la mañana.', a: [['Frente a la ventana, solo para mí', 'Tú, las vistas y el vapor.'], ['Alrededor de la mesa, charlando', '¡Me pido una silla!']], m: 'Con una persona, basta.' },
          pt: { t: 'Esse primeiro café, você toma…', o: 'Pergunte com quem essa pessoa gosta de tomar o café da manhã.', a: [['Na janela, só pra mim', 'Você, a vista e o vapor.'], ['Em volta da mesa, batendo papo', 'Quero uma cadeira!']], m: 'Com uma pessoa, já basta.' },
          nl: { t: 'Dat eerste kopje drink je…', o: 'Vraag met wie die persoon graag de ochtendkoffie drinkt.', a: [['Bij het raam, helemaal voor mij', 'Jij, het uitzicht en de damp.'], ['Aan tafel, lekker kletsend', 'Ik claim een stoel!']], m: 'Met één persoon is genoeg.' },
        }),
        c('cafe_tasse_fetiche', 'ancrage', [['🫖', -70, 'racines'], ['🎨', 60, 'curiosite']], {
          fr: {
            t: 'Ta tasse du matin…',
            o: 'Demande-lui l’histoire de sa tasse préférée.',
            a: [
              ['La même depuis des années, un peu ébréchée', 'Chaque ébréchure raconte une histoire.'],
              ['Je change selon mon humeur', 'Humeur à pois aujourd’hui ?'],
            ],
          },
          en: {
            t: 'Your morning mug…',
            o: 'Ask them the story behind their favourite mug.',
            a: [
              ['The same for years, a bit chipped', 'Every chip tells a story.'],
              ['I change it with my mood', 'Polka-dot mood today?'],
            ],
          },
          es: {
            t: 'Tu taza de la mañana…',
            o: 'Pregúntale la historia de su taza favorita.',
            a: [
              ['La misma desde hace años, algo desportillada', 'Cada desconchón cuenta una historia.'],
              ['Cambio según mi humor', '¿Humor de lunares hoy?'],
            ],
          },
          pt: {
            t: 'Sua xícara da manhã…',
            o: 'Pergunte a história da xícara favorita dessa pessoa.',
            a: [
              ['A mesma há anos, meio lascada', 'Cada lasca conta uma história.'],
              ['Troco conforme o humor', 'Humor de bolinhas hoje?'],
            ],
          },
          nl: {
            t: 'Je ochtendmok…',
            o: 'Vraag naar het verhaal achter de favoriete mok van die persoon.',
            a: [
              ['Al jaren dezelfde, met een schilfertje eraf', 'Elk schilfertje vertelt een verhaal.'],
              ['Ik wissel per humeur', 'Stippeltjeshumeur vandaag?'],
            ],
          },
        }),
        s('cafe_tasse_ou', 'rythme', ['🛏️', -100, 'cocooning'], ['🚶', 100, 'ville'], {
          fr: { t: 'Le matin, ton café, tu le bois…', o: 'Demande-lui où elle ou il boit son café du matin.', a: [['Au lit, tout doucement', 'Je garde l’oreiller chaud.'], ['En marchant dans la rue animée', 'Gobelet en main, la ville s’éveille !']], m: 'Dans la cuisine, sans traîner.' },
          en: { t: 'In the morning, you drink your coffee…', o: 'Ask them where they drink their morning coffee.', a: [['In bed, nice and slow', 'I’ll keep the pillow warm.'], ['Walking down a busy street', 'Cup in hand, the city wakes up!']], m: 'In the kitchen, no dawdling.' },
          es: { t: 'Por la mañana, tu café te lo tomas…', o: 'Pregúntale dónde se toma el café por la mañana.', a: [['En la cama, muy despacio', 'Te guardo la almohada calentita.'], ['Andando por la calle animada', '¡Vaso en mano, la ciudad despierta!']], m: 'En la cocina, sin entretenerme.' },
          pt: { t: 'De manhã, você toma seu café…', o: 'Pergunte onde essa pessoa toma o café da manhã.', a: [['Na cama, bem devagar', 'Deixo o travesseiro quentinho.'], ['Andando pela rua movimentada', 'Copo na mão, a cidade acorda!']], m: 'Na cozinha, sem enrolar.' },
          nl: { t: 'Je ochtendkoffie drink je…', o: 'Vraag waar die persoon de ochtendkoffie drinkt.', a: [['In bed, heel rustig', 'Ik hou het kussen warm.'], ['Lopend door een drukke straat', 'Beker in de hand, de stad wordt wakker!']], m: 'In de keuken, zonder te treuzelen.' },
        }),
        c('cafe_avec_ta_tasse', 'elan', [['📋', 70, 'projets'], ['🌤️', -70, 'temps_libre'], ['📖', -10, null]], {
          fr: {
            t: 'Avec ton café du matin, tu…',
            o: 'Demande-lui ce qu’elle ou il fait pendant son café du matin.',
            a: [
              ['Fais ma liste de la journée', 'Une liste et un café, la journée est à toi.'],
              ['Ne fais rien, je regarde dehors', 'Les nuages te disent bonjour.'],
              ['Lis quelques pages', 'Un chapitre, une gorgée.'],
            ],
          },
          en: {
            t: 'With your morning coffee, you…',
            o: 'Ask them what they do while having their morning coffee.',
            a: [
              ['Write my to-do list for the day', 'A list and a coffee, the day is yours.'],
              ['Do nothing, I look outside', 'The clouds say good morning.'],
              ['Read a few pages', 'One chapter, one sip.'],
            ],
          },
          es: {
            t: 'Con tu café de la mañana, tú…',
            o: 'Pregúntale qué hace mientras se toma el café de la mañana.',
            a: [
              ['Hago la lista del día', 'Una lista y un café, el día es tuyo.'],
              ['No hago nada, miro por la ventana', 'Las nubes te dan los buenos días.'],
              ['Leo unas páginas', 'Un capítulo, un sorbo.'],
            ],
          },
          pt: {
            t: 'Com seu café da manhã, você…',
            o: 'Pergunte o que essa pessoa faz enquanto toma o café da manhã.',
            a: [
              ['Faço a lista do dia', 'Uma lista e um café, o dia é seu.'],
              ['Não faço nada, olho lá fora', 'As nuvens te dão bom-dia.'],
              ['Leio umas páginas', 'Um capítulo, um gole.'],
            ],
          },
          nl: {
            t: 'Bij je ochtendkoffie…',
            o: 'Vraag wat die persoon doet tijdens de ochtendkoffie.',
            a: [
              ['Maak ik mijn lijstje voor de dag', 'Een lijstje en koffie, de dag is van jou.'],
              ['Doe ik niks, ik kijk naar buiten', 'De wolken zeggen goedemorgen.'],
              ['Lees ik een paar bladzijden', 'Eén hoofdstuk, één slokje.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_2',
      title: { fr: 'Au comptoir', en: 'At the counter', es: 'En la barra', pt: 'No balcão', nl: 'Aan de bar' },
      questions: [
        c('cafe_commande', 'ancrage', [['☕', -70, 'racines'], ['🧋', 70, 'curiosite'], ['🤔', 10, null]], {
          fr: {
            t: 'Au café, tu commandes…',
            o: 'Demande-lui ce qu’elle ou il commande au café.',
            a: [
              ['Mon habituel, sans regarder la carte', 'La maison te connaît par cœur.'],
              ['La boisson la plus étrange de l’ardoise', 'Latte au sésame noir ? Je goûte !'],
              ['Je demande un conseil derrière le comptoir', 'Les conseils, c’est la vraie spécialité.'],
            ],
          },
          en: {
            t: 'At the café, you order…',
            o: 'Ask them what they order at a café.',
            a: [
              ['My usual, without looking at the menu', 'They know you by heart.'],
              ['The strangest drink on the board', 'Black sesame latte? I’m tasting!'],
              ['I ask behind the counter for a tip', 'Advice is the real house speciality.'],
            ],
          },
          es: {
            t: 'En la cafetería, pides…',
            o: 'Pregúntale qué pide en una cafetería.',
            a: [
              ['Lo de siempre, sin mirar la carta', 'En la casa te conocen de memoria.'],
              ['La bebida más rara de la pizarra', '¿Latte de sésamo negro? ¡Lo pruebo!'],
              ['Pido consejo en la barra', 'El consejo es la especialidad de la casa.'],
            ],
          },
          pt: {
            t: 'Na cafeteria, você pede…',
            o: 'Pergunte o que essa pessoa pede numa cafeteria.',
            a: [
              ['O de sempre, sem olhar o cardápio', 'A casa já te conhece de cor.'],
              ['A bebida mais estranha da lousa', 'Latte de gergelim preto? Eu provo!'],
              ['Peço uma dica no balcão', 'Dica é a especialidade da casa.'],
            ],
          },
          nl: {
            t: 'In het café bestel je…',
            o: 'Vraag wat die persoon in een café bestelt.',
            a: [
              ['Mijn vaste keuze, zonder de kaart te lezen', 'Ze kennen je hier uit hun hoofd.'],
              ['Het vreemdste drankje op het bord', 'Zwarte-sesamlatte? Ik proef!'],
              ['Ik vraag achter de bar om advies', 'Advies is de echte huisspecialiteit.'],
            ],
          },
        }),
        c('cafe_comptoir_papote', 'rythme', [['🙂', -50, 'calme'], ['💬', 70, 'monde']], {
          fr: {
            t: 'Au comptoir, quelqu’un t’adresse la parole.',
            o: 'Demande-lui si elle ou il aime discuter au comptoir.',
            a: [
              ['Je souris et je reste dans ma bulle', 'Un sourire, c’est déjà une conversation.'],
              ['Je papote volontiers', 'Et voilà, une nouvelle connaissance !'],
            ],
          },
          en: {
            t: 'At the counter, someone strikes up a conversation.',
            o: 'Ask them if they like chatting at the counter.',
            a: [
              ['I smile and stay in my bubble', 'A smile is already a conversation.'],
              ['I happily chat away', 'And there’s a new acquaintance!'],
            ],
          },
          es: {
            t: 'En la barra, alguien te da conversación.',
            o: 'Pregúntale si le gusta charlar en la barra.',
            a: [
              ['Sonrío y sigo en mi burbuja', 'Una sonrisa ya es una conversación.'],
              ['Charlo con mucho gusto', '¡Y ya tienes un conocido nuevo!'],
            ],
          },
          pt: {
            t: 'No balcão, alguém puxa conversa com você.',
            o: 'Pergunte se essa pessoa gosta de bater papo no balcão.',
            a: [
              ['Sorrio e fico na minha bolha', 'Um sorriso já é uma conversa.'],
              ['Bato papo com prazer', 'E pronto, um novo conhecido!'],
            ],
          },
          nl: {
            t: 'Aan de bar begint iemand een praatje met je.',
            o: 'Vraag of die persoon graag aan de bar kletst.',
            a: [
              ['Ik glimlach en blijf in mijn bubbel', 'Een glimlach is al een gesprek.'],
              ['Ik klets graag mee', 'En hop, een nieuwe kennis!'],
            ],
          },
        }),
        s('cafe_tour_file', 'cap', ['🎲', -100, 'spontane'], ['🎯', 100, 'plan'], {
          fr: { t: 'C’est bientôt ton tour dans la file.', o: 'Demande-lui si elle ou il sait toujours quoi commander.', a: [['Je découvre la carte à ce moment-là', 'Improvisation au comptoir, chapeau.'], ['Commande prête depuis la porte', 'Rapide comme un expresso !']], m: 'Je sais à peu près.' },
          en: { t: 'Your turn in the queue is coming up.', o: 'Ask them if they always know what to order.', a: [['I read the menu right then', 'Counter improv, hats off.'], ['Order ready since the door', 'Quick as an espresso!']], m: 'I roughly know.' },
          es: { t: 'Ya casi te toca en la cola.', o: 'Pregúntale si siempre sabe qué pedir.', a: [['Miro la carta en ese momento', 'Improvisación en la barra, chapó.'], ['Pedido listo desde la puerta', '¡Rápido como un expreso!']], m: 'Más o menos lo sé.' },
          pt: { t: 'Sua vez na fila está chegando.', o: 'Pergunte se essa pessoa sempre sabe o que pedir.', a: [['Leio o cardápio na hora', 'Improviso no balcão, tiro o chapéu.'], ['Pedido pronto desde a porta', 'Rápido como um expresso!']], m: 'Sei mais ou menos.' },
          nl: { t: 'Je bent bijna aan de beurt in de rij.', o: 'Vraag of die persoon altijd weet wat die gaat bestellen.', a: [['Ik lees de kaart pas dan', 'Improviseren aan de bar, petje af.'], ['Bestelling klaar sinds de deur', 'Snel als een espresso!']], m: 'Ik weet het ongeveer.' },
        }),
        c('cafe_tournee', 'foyer', [['🙌', 70, 'accueil'], ['🧾', -50, 'liberte'], ['🔁', 20, null]], {
          fr: {
            t: 'Tu arrives au comptoir avec trois personnes.',
            o: 'Demande-lui comment se passe une commande à plusieurs avec elle ou lui.',
            a: [
              ['Je prends la commande pour tout le monde', 'Chef de tablée, ça te va bien.'],
              ['Chacun commande le sien', 'Simple et efficace.'],
              ['Chacun son tour, on alterne', 'La prochaine fois, c’est moi ! Enfin…'],
            ],
          },
          en: {
            t: 'You reach the counter with three people.',
            o: 'Ask them how a group order goes with them.',
            a: [
              ['I order for everyone', 'Head of the table suits you.'],
              ['Everyone orders their own', 'Simple and efficient.'],
              ['We take turns', 'Next time it’s me! Well…'],
            ],
          },
          es: {
            t: 'Llegas a la barra con tres personas.',
            o: 'Pregúntale cómo pide cuando va en grupo.',
            a: [
              ['Pido para todos', 'Al mando de la mesa, te pega.'],
              ['Cada uno pide lo suyo', 'Sencillo y eficaz.'],
              ['Por turnos, vamos alternando', '¡La próxima me toca a mí! Bueno…'],
            ],
          },
          pt: {
            t: 'Você chega ao balcão com três pessoas.',
            o: 'Pergunte como essa pessoa faz o pedido em grupo.',
            a: [
              ['Peço para todo mundo', 'Chefe da mesa, combina com você.'],
              ['Cada um pede o seu', 'Simples e eficiente.'],
              ['Cada vez um, a gente reveza', 'Da próxima vez sou eu! Quer dizer…'],
            ],
          },
          nl: {
            t: 'Je komt met drie mensen aan de bar.',
            o: 'Vraag hoe een groepsbestelling gaat met die persoon erbij.',
            a: [
              ['Ik bestel voor iedereen', 'Tafelhoofd, dat past bij je.'],
              ['Iedereen bestelt voor zichzelf', 'Simpel en efficiënt.'],
              ['We wisselen af', 'Volgende keer ik! Nou ja…'],
            ],
          },
        }),
        c('cafe_sur_place', 'elan', [['🪑', -70, 'temps_libre'], ['🥡', 60, 'projets']], {
          fr: {
            t: 'Sur place ou à emporter ?',
            o: 'Demande-lui si elle ou il prend le temps de s’asseoir au café.',
            a: [
              ['Sur place, je prends mon temps', 'Je m’installe sur la chaise d’en face.'],
              ['À emporter, j’ai des choses à faire', 'Le café part en mission avec toi.'],
            ],
          },
          en: {
            t: 'Eat in or takeaway?',
            o: 'Ask them if they take the time to sit down at a café.',
            a: [
              ['Eat in, I take my time', 'I’ll settle into the chair opposite.'],
              ['Takeaway, I’ve got things to do', 'The coffee goes on a mission with you.'],
            ],
          },
          es: {
            t: '¿Para tomar aquí o para llevar?',
            o: 'Pregúntale si se toma el tiempo de sentarse en la cafetería.',
            a: [
              ['Aquí, sin prisa', 'Me siento en la silla de enfrente.'],
              ['Para llevar, tengo cosas que hacer', 'El café se va de misión contigo.'],
            ],
          },
          pt: {
            t: 'Pra tomar aqui ou pra viagem?',
            o: 'Pergunte se essa pessoa tira um tempo para sentar na cafeteria.',
            a: [
              ['Aqui, sem pressa', 'Vou sentar na cadeira da frente.'],
              ['Pra viagem, tenho coisas a fazer', 'O café sai em missão com você.'],
            ],
          },
          nl: {
            t: 'Hier opdrinken of meenemen?',
            o: 'Vraag of die persoon de tijd neemt om in een café te gaan zitten.',
            a: [
              ['Hier, ik neem de tijd', 'Ik ga op de stoel tegenover je zitten.'],
              ['Meenemen, ik heb nog van alles te doen', 'De koffie gaat met je mee op missie.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_3',
      title: { fr: 'En terrasse', en: 'On the terrace', es: 'En la terraza', pt: 'Na mesinha de fora', nl: 'Op het terras' },
      questions: [
        s('cafe_terrasse_place', 'rythme', ['🌿', -100, 'calme'], ['🎭', 100, 'monde'], {
          fr: { t: 'En terrasse, tu choisis…', o: 'Demande-lui quelle table elle ou il choisit en terrasse.', a: [['Le coin tranquille au fond', 'Notre petit coin secret.'], ['La table au bord, pour voir passer la vie', 'Le spectacle de la rue, au premier rang !']], m: 'Tranquille, mais avec vue.' },
          en: { t: 'On a terrace, you pick…', o: 'Ask them which table they pick on a terrace.', a: [['The quiet corner at the back', 'Our little secret corner.'], ['The front table, to watch life go by', 'Front row for the street show!']], m: 'Quiet, but with a view.' },
          es: { t: 'En la terraza, eliges…', o: 'Pregúntale qué mesa elige en una terraza.', a: [['El rincón tranquilo del fondo', 'Nuestro rincón secreto.'], ['La mesa del borde, para ver pasar la vida', '¡Primera fila para el espectáculo de la calle!']], m: 'Tranquila, pero con vistas.' },
          pt: { t: 'Nas mesinhas de fora, você escolhe…', o: 'Pergunte que mesa essa pessoa escolhe do lado de fora.', a: [['O cantinho tranquilo do fundo', 'Nosso cantinho secreto.'], ['A mesa da beirada, pra ver a vida passar', 'Primeira fila pro show da rua!']], m: 'Tranquila, mas com vista.' },
          nl: { t: 'Op het terras kies je…', o: 'Vraag welk tafeltje die persoon op een terras kiest.', a: [['Het rustige hoekje achterin', 'Ons geheime hoekje.'], ['Het tafeltje vooraan, om het leven te zien', 'Eerste rij voor de straatvoorstelling!']], m: 'Rustig, maar met uitzicht.' },
        }),
        c('cafe_rayon_soleil', 'cap', [['☀️', -70, 'spontane'], ['📆', 60, 'plan'], ['🧥', -20, 'dehors']], {
          fr: {
            t: 'Un rayon de soleil inattendu, un mardi de mars.',
            o: 'Demande-lui ce qu’elle ou il fait au premier rayon de soleil.',
            a: [
              ['Je file en terrasse, tout s’arrête', 'Le soleil a dit « maintenant » !'],
              ['Je garde mon programme, j’irai samedi', 'Samedi, il fera encore plus beau.'],
              ['Je sors, même avec mon manteau', 'Manteau et lunettes de soleil, le combo.'],
            ],
          },
          en: {
            t: 'An unexpected ray of sunshine on a Tuesday in March.',
            o: 'Ask them what they do at the first ray of sunshine.',
            a: [
              ['I rush to a terrace, everything stops', 'The sun said “now”!'],
              ['I stick to my plans, I’ll go Saturday', 'It’ll be even nicer on Saturday.'],
              ['I go out, coat and all', 'Coat and sunglasses, the combo.'],
            ],
          },
          es: {
            t: 'Un rayo de sol inesperado, un martes de marzo.',
            o: 'Pregúntale qué hace con el primer rayo de sol.',
            a: [
              ['Me voy a una terraza, todo se para', '¡El sol ha dicho «ahora»!'],
              ['Sigo con mis planes, iré el sábado', 'El sábado hará aún mejor.'],
              ['Salgo, aunque sea con abrigo', 'Abrigo y gafas de sol, el combo.'],
            ],
          },
          pt: {
            t: 'Um raio de sol inesperado numa terça de março.',
            o: 'Pergunte o que essa pessoa faz no primeiro raio de sol.',
            a: [
              ['Corro pra uma mesinha ao ar livre, tudo para', 'O sol disse “agora”!'],
              ['Mantenho meus planos, vou no sábado', 'No sábado vai estar ainda melhor.'],
              ['Saio, mesmo de casaco', 'Casaco e óculos escuros, o combo.'],
            ],
          },
          nl: {
            t: 'Een onverwacht zonnestraaltje op een dinsdag in maart.',
            o: 'Vraag wat die persoon doet bij het eerste zonnestraaltje.',
            a: [
              ['Ik ren naar een terras, alles ligt stil', 'De zon zei “nu”!'],
              ['Ik hou me aan mijn plan, zaterdag ga ik', 'Zaterdag is het nog mooier.'],
              ['Ik ga naar buiten, jas en al', 'Jas en zonnebril, de combo.'],
            ],
          },
        }),
        c('cafe_terrasse_tablee', 'foyer', [['📖', -70, 'liberte'], ['🪑', 80, 'accueil'], ['🌞', 20, null]], {
          fr: {
            t: 'Ta terrasse idéale…',
            o: 'Demande-lui avec qui elle ou il aime s’installer en terrasse.',
            a: [
              ['Une table pour moi et un bon livre', 'Je tourne les pages au soleil.'],
              ['On rapproche trois tables, ça s’agrandit', 'Encore une chaise, et une autre !'],
              ['Avec une personne, face au soleil', 'Duo solaire, parfait.'],
            ],
          },
          en: {
            t: 'Your ideal terrace moment…',
            o: 'Ask them who they like sitting on a terrace with.',
            a: [
              ['A table for me and a good book', 'I’ll turn the pages in the sun.'],
              ['We push three tables together, it grows', 'One more chair, and another!'],
              ['With one person, facing the sun', 'Sunny duo, perfect.'],
            ],
          },
          es: {
            t: 'Tu terraza ideal…',
            o: 'Pregúntale con quién le gusta sentarse en una terraza.',
            a: [
              ['Una mesa para mí y un buen libro', 'Paso las páginas al sol.'],
              ['Juntamos tres mesas, y crece', '¡Una silla más, y otra!'],
              ['Con una persona, de cara al sol', 'Dúo solar, perfecto.'],
            ],
          },
          pt: {
            t: 'Seu momento ideal ao ar livre…',
            o: 'Pergunte com quem essa pessoa gosta de sentar do lado de fora.',
            a: [
              ['Uma mesa pra mim e um bom livro', 'Viro as páginas no sol.'],
              ['Juntamos três mesas, e só cresce', 'Mais uma cadeira, e outra!'],
              ['Com uma pessoa, de frente pro sol', 'Dupla solar, perfeito.'],
            ],
          },
          nl: {
            t: 'Je ideale terrasmoment…',
            o: 'Vraag met wie die persoon graag op een terras zit.',
            a: [
              ['Een tafeltje voor mij en een goed boek', 'Ik sla de bladzijden om in de zon.'],
              ['We schuiven drie tafels aan elkaar', 'Nog een stoel, en nog een!'],
              ['Met één persoon, met het gezicht naar de zon', 'Zonnig duo, perfect.'],
            ],
          },
        }),
        c('cafe_terrasse_adresse', 'ancrage', [['📍', -70, 'racines'], ['🧭', 70, 'curiosite']], {
          fr: {
            t: 'Ta terrasse, c’est…',
            o: 'Demande-lui sa terrasse préférée du quartier.',
            a: [
              ['Toujours la même, au coin de ma rue', 'Ta chaise a la forme de toi.'],
              ['Une nouvelle à chaque fois', 'On en teste une autre demain ?'],
            ],
          },
          en: {
            t: 'Your terrace is…',
            o: 'Ask them about their favourite terrace in the area.',
            a: [
              ['Always the same, on my street corner', 'Your chair has your shape.'],
              ['A new one every time', 'Try another one tomorrow?'],
            ],
          },
          es: {
            t: 'Tu terraza es…',
            o: 'Pregúntale cuál es su terraza favorita del barrio.',
            a: [
              ['Siempre la misma, en mi esquina', 'Tu silla ya tiene tu forma.'],
              ['Una nueva cada vez', '¿Probamos otra mañana?'],
            ],
          },
          pt: {
            t: 'Seu cantinho ao ar livre é…',
            o: 'Pergunte qual é o lugar ao ar livre favorito dessa pessoa no bairro.',
            a: [
              ['Sempre o mesmo, na esquina de casa', 'Sua cadeira já tem o seu formato.'],
              ['Um novo a cada vez', 'Testamos outro amanhã?'],
            ],
          },
          nl: {
            t: 'Jouw terras is…',
            o: 'Vraag naar het favoriete terras van die persoon in de buurt.',
            a: [
              ['Altijd hetzelfde, op mijn straathoek', 'Je stoel heeft jouw vorm.'],
              ['Elke keer een nieuw', 'Morgen een ander proberen?'],
            ],
          },
        }),
        s('cafe_terrasse_duree', 'elan', ['🕰️', -100, 'temps_libre'], ['⚡', 100, 'projets'], {
          fr: { t: 'En terrasse, tu restes…', o: 'Demande-lui combien de temps elle ou il reste en terrasse.', a: [['Tout l’après-midi, sans regarder l’heure', 'L’heure ? Quelle heure ?'], ['Le temps d’un café, puis j’enchaîne', 'Un café, et en avant !']], m: 'Une petite heure, c’est bien.' },
          en: { t: 'On a terrace, you stay…', o: 'Ask them how long they stay on a terrace.', a: [['All afternoon, never checking the time', 'Time? What time?'], ['One coffee, then I’m off', 'One coffee, and onwards!']], m: 'About an hour is nice.' },
          es: { t: 'En la terraza, te quedas…', o: 'Pregúntale cuánto tiempo se queda en una terraza.', a: [['Toda la tarde, sin mirar la hora', '¿La hora? ¿Qué hora?'], ['Lo que dura un café, y sigo', '¡Un café, y adelante!']], m: 'Una horita está bien.' },
          pt: { t: 'Na mesinha de fora, você fica…', o: 'Pergunte quanto tempo essa pessoa fica sentada do lado de fora.', a: [['A tarde toda, sem olhar a hora', 'Hora? Que hora?'], ['O tempo de um café, e sigo', 'Um café, e bora!']], m: 'Uma horinha está ótimo.' },
          nl: { t: 'Op een terras blijf je…', o: 'Vraag hoe lang die persoon op een terras blijft zitten.', a: [['De hele middag, zonder op de klok te kijken', 'De tijd? Welke tijd?'], ['Eén koffie, dan ga ik weer', 'Eén koffie, en door!']], m: 'Een uurtje is fijn.' },
        }),
      ],
    },
    {
      id: 'cafe_4',
      title: { fr: 'Au salon de thé', en: 'At the tearoom', es: 'En la tetería', pt: 'Na casa de chá', nl: 'In de theesalon' },
      questions: [
        c('cafe_salon_ambiance', 'rythme', [['🕯️', -70, 'cocooning'], ['🎶', 60, 'musique'], ['🌿', -20, 'calme']], {
          fr: {
            t: 'Ton salon de thé idéal…',
            o: 'Demande-lui à quoi ressemble son salon de thé rêvé.',
            a: [
              ['Fauteuils moelleux et silence feutré', 'Je m’enfonce dans le coussin.'],
              ['De la musique, des conversations, ça vit', 'Je tape du pied sous la table.'],
              ['Une véranda pleine de plantes', 'Je fais coucou aux fougères.'],
            ],
          },
          en: {
            t: 'Your ideal tearoom…',
            o: 'Ask them what their dream tearoom looks like.',
            a: [
              ['Plush armchairs and hushed silence', 'I’m sinking into the cushion.'],
              ['Music, chatter, full of life', 'I’m tapping my foot under the table.'],
              ['A conservatory full of plants', 'Waving hello to the ferns.'],
            ],
          },
          es: {
            t: 'Tu tetería ideal…',
            o: 'Pregúntale cómo sería la tetería de sus sueños.',
            a: [
              ['Sillones mullidos y silencio', 'Me hundo en el cojín.'],
              ['Música, charlas, mucha vida', 'Llevo el ritmo bajo la mesa.'],
              ['Un invernadero lleno de plantas', 'Saludo a los helechos.'],
            ],
          },
          pt: {
            t: 'Sua casa de chá ideal…',
            o: 'Pergunte como seria a casa de chá dos sonhos dessa pessoa.',
            a: [
              ['Poltronas fofas e silêncio aconchegante', 'Vou afundar na almofada.'],
              ['Música, conversa, cheia de vida', 'Batendo o pé debaixo da mesa.'],
              ['Uma varanda cheia de plantas', 'Dou tchauzinho pras samambaias.'],
            ],
          },
          nl: {
            t: 'Je ideale theesalon…',
            o: 'Vraag hoe de droomtheesalon van die persoon eruitziet.',
            a: [
              ['Zachte fauteuils en gedempte stilte', 'Ik zak weg in het kussen.'],
              ['Muziek, gepraat, levendig', 'Ik tik met mijn voet onder tafel.'],
              ['Een serre vol planten', 'Ik zwaai naar de varens.'],
            ],
          },
        }),
        s('cafe_carte_thes', 'ancrage', ['🍵', -100, 'racines'], ['🗺️', 100, 'curiosite'], {
          fr: { t: 'Devant la longue carte des thés…', o: 'Demande-lui le thé le plus surprenant qu’elle ou il ait bu.', a: [['Mon thé préféré, sans hésiter', 'Fidèle à ta théière, bravo.'], ['Le thé fumé d’un pays lointain', 'Ça sent le feu de camp, j’adore.']], m: 'Un thé proche du mien, un peu différent.' },
          en: { t: 'Looking at the long tea menu…', o: 'Ask them about the most surprising tea they’ve ever had.', a: [['My favourite tea, no hesitation', 'Loyal to your teapot, well done.'], ['The smoked tea from a faraway land', 'Smells like a campfire, love it.']], m: 'A tea close to mine, a bit different.' },
          es: { t: 'Ante la larga carta de tés…', o: 'Pregúntale cuál es el té más sorprendente que ha probado.', a: [['Mi té favorito, sin dudar', 'Fiel a tu tetera, bravo.'], ['El té ahumado de un país lejano', 'Huele a hoguera, me encanta.']], m: 'Uno parecido al mío, algo distinto.' },
          pt: { t: 'Diante do cardápio enorme de chás…', o: 'Pergunte qual foi o chá mais surpreendente que essa pessoa já tomou.', a: [['Meu chá favorito, sem hesitar', 'Fiel ao seu bule, parabéns.'], ['O chá defumado de um país distante', 'Cheiro de fogueira, adoro.']], m: 'Um parecido com o meu, um pouco diferente.' },
          nl: { t: 'Voor de lange theekaart…', o: 'Vraag naar de verrassendste thee die die persoon ooit dronk.', a: [['Mijn favoriete thee, zonder twijfel', 'Trouw aan je theepot, knap.'], ['De gerookte thee uit een ver land', 'Ruikt naar kampvuur, heerlijk.']], m: 'Eentje die op de mijne lijkt, net anders.' },
        }),
        c('cafe_salon_reserve', 'cap', [['📞', 70, 'plan'], ['🚪', -60, 'spontane']], {
          fr: {
            t: 'Un salon de thé réputé, un dimanche après-midi.',
            o: 'Demande-lui si elle ou il réserve ou tente sa chance.',
            a: [
              ['J’ai réservé depuis mercredi', 'Table au nom de l’organisation, bravo.'],
              ['On tente notre chance', 'Croisons les doigts, et les petites cuillères.'],
            ],
          },
          en: {
            t: 'A popular tearoom on a Sunday afternoon.',
            o: 'Ask them if they book ahead or try their luck.',
            a: [
              ['I booked on Wednesday', 'Table under the name “organised”, bravo.'],
              ['We try our luck', 'Fingers crossed, and teaspoons too.'],
            ],
          },
          es: {
            t: 'Una tetería famosa, un domingo por la tarde.',
            o: 'Pregúntale si reserva o prueba suerte.',
            a: [
              ['Reservé el miércoles', 'Mesa a nombre de la organización, bravo.'],
              ['Probamos suerte', 'Crucemos los dedos, y las cucharillas.'],
            ],
          },
          pt: {
            t: 'Uma casa de chá famosa num domingo à tarde.',
            o: 'Pergunte se essa pessoa reserva ou arrisca.',
            a: [
              ['Reservei desde quarta', 'Mesa em nome da organização, parabéns.'],
              ['A gente arrisca', 'Dedos cruzados, e colherinhas também.'],
            ],
          },
          nl: {
            t: 'Een populaire theesalon op zondagmiddag.',
            o: 'Vraag of die persoon reserveert of het gewoon probeert.',
            a: [
              ['Ik heb woensdag al gereserveerd', 'Tafel op naam van “georganiseerd”, knap.'],
              ['We gokken erop', 'Duimen, en theelepeltjes erbij.'],
            ],
          },
        }),
        c('cafe_plateau_gateaux', 'foyer', [['🍰', 60, 'accueil'], ['🫖', -60, 'liberte'], ['🤝', 10, null]], {
          fr: {
            t: 'Le plateau de pâtisseries arrive sur la table.',
            o: 'Demande-lui si elle ou il aime tout partager au salon de thé.',
            a: [
              ['On coupe tout en petits bouts pour goûter', 'Dégustation collective, mon rêve.'],
              ['Chacun sa théière, chacun son gâteau', 'Chacun son royaume sucré.'],
              ['On échange une bouchée, pas plus', 'Un échange diplomatique.'],
            ],
          },
          en: {
            t: 'The cake stand lands on the table.',
            o: 'Ask them if they like sharing everything at a tearoom.',
            a: [
              ['We cut it all into tiny bits to taste', 'Group tasting, my dream.'],
              ['Own teapot, own cake', 'Everyone their own sweet kingdom.'],
              ['We swap one bite, no more', 'A diplomatic exchange.'],
            ],
          },
          es: {
            t: 'Llega a la mesa la bandeja de pasteles.',
            o: 'Pregúntale si le gusta compartirlo todo en la tetería.',
            a: [
              ['Lo cortamos todo en trocitos para probar', 'Cata colectiva, mi sueño.'],
              ['Cada uno su tetera y su pastel', 'Cada uno su reino dulce.'],
              ['Cambiamos un bocado, y ya', 'Un intercambio diplomático.'],
            ],
          },
          pt: {
            t: 'A bandeja de doces chega à mesa.',
            o: 'Pergunte se essa pessoa gosta de dividir tudo na casa de chá.',
            a: [
              ['Cortamos tudo em pedacinhos pra provar', 'Degustação coletiva, meu sonho.'],
              ['Cada um com seu bule e seu doce', 'Cada um no seu reino doce.'],
              ['Trocamos uma garfada, só', 'Uma troca diplomática.'],
            ],
          },
          nl: {
            t: 'De etagère met gebakjes komt op tafel.',
            o: 'Vraag of die persoon in een theesalon graag alles deelt.',
            a: [
              ['We snijden alles in stukjes om te proeven', 'Samen proeven, mijn droom.'],
              ['Ieder z’n theepot, ieder z’n taartje', 'Ieder z’n eigen zoete koninkrijk.'],
              ['We ruilen één hapje, meer niet', 'Een diplomatieke ruil.'],
            ],
          },
        }),
        c('cafe_salon_sac', 'elan', [['📓', 70, 'projets'], ['📚', -50, 'temps_libre'], ['👀', -80, 'calme']], {
          fr: {
            t: 'Au salon de thé, dans ton sac, il y a…',
            o: 'Demande-lui ce qu’elle ou il emporte au salon de thé.',
            a: [
              ['Mon carnet de projets', 'Les meilleures idées naissent près d’une théière.'],
              ['Un roman', 'Un chapitre par tasse, la règle d’or.'],
              ['Rien, je regarde le monde', 'Le meilleur film, c’est la salle.'],
            ],
          },
          en: {
            t: 'At the tearoom, in your bag, there’s…',
            o: 'Ask them what they bring to a tearoom.',
            a: [
              ['My project notebook', 'The best ideas are born near a teapot.'],
              ['A novel', 'One chapter per cup, golden rule.'],
              ['Nothing, I watch the world', 'The best film is the room itself.'],
            ],
          },
          es: {
            t: 'En la tetería, en tu bolso hay…',
            o: 'Pregúntale qué se lleva a la tetería.',
            a: [
              ['Mi libreta de proyectos', 'Las mejores ideas nacen junto a una tetera.'],
              ['Una novela', 'Un capítulo por taza, regla de oro.'],
              ['Nada, miro a la gente', 'La mejor película es la propia sala.'],
            ],
          },
          pt: {
            t: 'Na casa de chá, na sua bolsa tem…',
            o: 'Pergunte o que essa pessoa leva para a casa de chá.',
            a: [
              ['Meu caderno de projetos', 'As melhores ideias nascem perto de um bule.'],
              ['Um romance', 'Um capítulo por xícara, regra de ouro.'],
              ['Nada, fico olhando o mundo', 'O melhor filme é o próprio salão.'],
            ],
          },
          nl: {
            t: 'In de theesalon zit in je tas…',
            o: 'Vraag wat die persoon meeneemt naar een theesalon.',
            a: [
              ['Mijn projectenschrift', 'De beste ideeën ontstaan bij een theepot.'],
              ['Een roman', 'Eén hoofdstuk per kopje, gouden regel.'],
              ['Niks, ik kijk naar de mensen', 'De beste film is de zaal zelf.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_5',
      title: { fr: 'La pause café', en: 'The coffee break', es: 'La pausa del café', pt: 'A pausa do café', nl: 'De koffiepauze' },
      questions: [
        c('cafe_pause_heure', 'cap', [['🕥', 70, 'ordre'], ['🌀', -60, 'spontane']], {
          fr: {
            t: 'Ta pause café dans la journée…',
            o: 'Demande-lui à quel moment tombe sa pause préférée.',
            a: [
              ['10 h 30, réglée comme une horloge', 'Tic-tac, c’est l’heure du café.'],
              ['Quand j’en ai besoin', 'Ton corps sait mieux que l’horloge.'],
            ],
          },
          en: {
            t: 'Your coffee break during the day…',
            o: 'Ask them when their favourite break happens.',
            a: [
              ['10.30 am, like clockwork', 'Tick-tock, coffee o’clock.'],
              ['Whenever I need it', 'Your body knows better than the clock.'],
            ],
          },
          es: {
            t: 'Tu pausa del café durante el día…',
            o: 'Pregúntale cuándo es su pausa favorita.',
            a: [
              ['A las 10.30, como un reloj', 'Tic-tac, la hora del café.'],
              ['Cuando la necesito', 'Tu cuerpo sabe más que el reloj.'],
            ],
          },
          pt: {
            t: 'Sua pausa do café durante o dia…',
            o: 'Pergunte quando acontece a pausa favorita dessa pessoa.',
            a: [
              ['10h30, pontual como relógio', 'Tic-tac, hora do café.'],
              ['Quando eu preciso', 'Seu corpo sabe mais que o relógio.'],
            ],
          },
          nl: {
            t: 'Je koffiepauze overdag…',
            o: 'Vraag wanneer de favoriete pauze van die persoon valt.',
            a: [
              ['Om 10.30 uur, als een klok', 'Tik-tak, koffietijd.'],
              ['Als ik er behoefte aan heb', 'Je lijf weet het beter dan de klok.'],
            ],
          },
        }),
        s('cafe_pause_compagnie', 'foyer', ['🎧', -100, 'liberte'], ['👥', 100, 'accueil'], {
          fr: { t: 'À la pause, tu préfères…', o: 'Demande-lui avec qui elle ou il aime faire une pause.', a: [['Un moment rien qu’à moi', 'Pause solo, recharge complète.'], ['La machine à café avec tout le monde', 'Les meilleures nouvelles circulent ici.']], m: 'Une ou deux personnes, c’est bien.' },
          en: { t: 'On a break, you prefer…', o: 'Ask them who they like taking a break with.', a: [['A moment all to myself', 'Solo break, full recharge.'], ['The coffee machine with everyone', 'The best news travels here.']], m: 'One or two people is good.' },
          es: { t: 'En la pausa, prefieres…', o: 'Pregúntale con quién le gusta hacer una pausa.', a: [['Un rato solo para mí', 'Pausa a solas, recarga total.'], ['La máquina de café con todo el mundo', 'Las mejores noticias corren aquí.']], m: 'Una o dos personas, bien.' },
          pt: { t: 'Na pausa, você prefere…', o: 'Pergunte com quem essa pessoa gosta de fazer uma pausa.', a: [['Um momento só meu', 'Pausa solo, recarga completa.'], ['A máquina de café com todo mundo', 'As melhores novidades circulam aqui.']], m: 'Uma ou duas pessoas, bom.' },
          nl: { t: 'In de pauze heb je liever…', o: 'Vraag met wie die persoon graag pauze neemt.', a: [['Een moment helemaal voor mezelf', 'Solopauze, helemaal opgeladen.'], ['Het koffieapparaat met iedereen', 'Het beste nieuws gaat hier rond.']], m: 'Een of twee mensen, fijn.' },
        }),
        c('cafe_pause_ideale', 'rythme', [['🚶', 40, 'dehors'], ['🪴', -60, 'calme'], ['🏙️', 80, 'ville']], {
          fr: {
            t: 'Ta pause idéale…',
            o: 'Demande-lui comment elle ou il passe une bonne pause.',
            a: [
              ['Je fais le tour du pâté de maisons', 'Un petit tour, l’air frais, parfait.'],
              ['Je reste à ma place, au calme', 'Une bulle de silence, rien que pour toi.'],
              ['Je file au café du coin, plein de monde', 'L’ambiance du coin, ça réveille !'],
            ],
          },
          en: {
            t: 'Your ideal break…',
            o: 'Ask them how they spend a good break.',
            a: [
              ['I walk round the block', 'A little loop, fresh air, perfect.'],
              ['I stay at my desk, in peace', 'A bubble of quiet, just for you.'],
              ['I pop to the busy café on the corner', 'The buzz wakes you up!'],
            ],
          },
          es: {
            t: 'Tu pausa ideal…',
            o: 'Pregúntale cómo pasa una buena pausa.',
            a: [
              ['Doy una vuelta a la manzana', 'Una vueltecita, aire fresco, perfecto.'],
              ['Me quedo en mi sitio, con calma', 'Una burbuja de silencio para ti.'],
              ['Voy al bar de la esquina, lleno de gente', '¡El ambiente despierta!'],
            ],
          },
          pt: {
            t: 'Sua pausa ideal…',
            o: 'Pergunte como essa pessoa passa uma boa pausa.',
            a: [
              ['Dou uma volta no quarteirão', 'Uma voltinha, ar fresco, perfeito.'],
              ['Fico no meu lugar, na calma', 'Uma bolha de silêncio só pra você.'],
              ['Vou no café da esquina, cheio de gente', 'O movimento dá uma acordada!'],
            ],
          },
          nl: {
            t: 'Je ideale pauze…',
            o: 'Vraag hoe die persoon een goede pauze doorbrengt.',
            a: [
              ['Ik loop een rondje om het blok', 'Een rondje, frisse lucht, perfect.'],
              ['Ik blijf rustig op mijn plek', 'Een bubbel van stilte, alleen voor jou.'],
              ['Ik ga naar het drukke café op de hoek', 'De drukte maakt je wakker!'],
            ],
          },
        }),
        c('cafe_pause_avancer', 'elan', [['😌', -70, 'temps_libre'], ['💡', 70, 'projets']], {
          fr: {
            t: 'Pendant ta pause, tu…',
            o: 'Demande-lui si elle ou il arrive à vraiment décrocher.',
            a: [
              ['Décroche complètement', 'Mode avion activé.'],
              ['En profite pour avancer une idée', 'Une idée par tasse, quel rendement !'],
            ],
          },
          en: {
            t: 'During your break, you…',
            o: 'Ask them if they manage to truly switch off.',
            a: [
              ['Switch off completely', 'Aeroplane mode on.'],
              ['Use it to push an idea forward', 'One idea per cup, what output!'],
            ],
          },
          es: {
            t: 'Durante tu pausa, tú…',
            o: 'Pregúntale si consigue desconectar de verdad.',
            a: [
              ['Desconecto del todo', 'Modo avión activado.'],
              ['Aprovecho para avanzar una idea', '¡Una idea por taza, qué rendimiento!'],
            ],
          },
          pt: {
            t: 'Durante sua pausa, você…',
            o: 'Pergunte se essa pessoa consegue desligar de verdade.',
            a: [
              ['Desligo totalmente', 'Modo avião ativado.'],
              ['Aproveito pra adiantar uma ideia', 'Uma ideia por xícara, que rendimento!'],
            ],
          },
          nl: {
            t: 'Tijdens je pauze…',
            o: 'Vraag of die persoon echt kan uitschakelen.',
            a: [
              ['Schakel ik helemaal uit', 'Vliegtuigmodus aan.'],
              ['Werk ik nog even een idee uit', 'Eén idee per kopje, wat een productie!'],
            ],
          },
        }),
        s('cafe_nouveau_bouton', 'ancrage', ['🔘', -100, 'racines'], ['🆕', 100, 'curiosite'], {
          fr: { t: 'La machine à café a un nouveau bouton mystère.', o: 'Demande-lui si elle ou il appuie sur les boutons mystère.', a: [['Je reste sur mon bouton habituel', 'Ton bouton te remercie.'], ['J’appuie, pour voir', 'Bip ! Qu’est-ce qui va sortir ?']], m: 'J’attends que quelqu’un teste avant.' },
          en: { t: 'The coffee machine has a new mystery button.', o: 'Ask them if they press mystery buttons.', a: [['I stick to my usual button', 'Your button thanks you.'], ['I press it, just to see', 'Beep! What’s coming out?']], m: 'I wait for someone else to try first.' },
          es: { t: 'La máquina de café tiene un botón misterioso nuevo.', o: 'Pregúntale si pulsa los botones misteriosos.', a: [['Sigo con mi botón de siempre', 'Tu botón te lo agradece.'], ['Lo pulso, a ver qué pasa', '¡Bip! ¿Qué saldrá?']], m: 'Espero a que alguien lo pruebe antes.' },
          pt: { t: 'A máquina de café tem um botão misterioso novo.', o: 'Pergunte se essa pessoa aperta botões misteriosos.', a: [['Fico no meu botão de sempre', 'Seu botão agradece.'], ['Aperto, pra ver', 'Bip! O que vai sair?']], m: 'Espero alguém testar antes.' },
          nl: { t: 'Het koffieapparaat heeft een nieuwe mysterieknop.', o: 'Vraag of die persoon op mysterieknoppen drukt.', a: [['Ik blijf bij mijn vaste knop', 'Je knop bedankt je.'], ['Ik druk erop, gewoon proberen', 'Piep! Wat komt eruit?']], m: 'Ik wacht tot iemand anders het probeert.' },
        }),
      ],
    },
    {
      id: 'cafe_6',
      title: { fr: 'Travailler au café', en: 'Working at a café', es: 'Trabajar en la cafetería', pt: 'Trabalhar no café', nl: 'Werken in een café' },
      questions: [
        c('cafe_ordinateur', 'elan', [['💻', 70, 'projets'], ['📺', -60, 'temps_libre'], ['✉️', 10, null]], {
          fr: {
            t: 'Tu t’installes au café avec ton ordinateur.',
            o: 'Demande-lui ce qu’elle ou il fait avec un ordinateur au café.',
            a: [
              ['Trois heures de travail, c’est mon bureau', 'Bureau avec vue sur les croissants.'],
              ['Je regarde une série en douce', 'Je ne dirai rien, promis.'],
              ['Deux ou trois messages, puis je ferme', 'Vite fait, bien fait.'],
            ],
          },
          en: {
            t: 'You settle in at a café with your laptop.',
            o: 'Ask them what they do with a laptop at a café.',
            a: [
              ['Three hours of work, it’s my office', 'An office with a view of croissants.'],
              ['I sneakily watch a series', 'I won’t tell, promise.'],
              ['Two or three messages, then I close it', 'Quick and tidy.'],
            ],
          },
          es: {
            t: 'Te instalas en la cafetería con tu portátil.',
            o: 'Pregúntale qué hace con un portátil en una cafetería.',
            a: [
              ['Tres horas de trabajo, es mi oficina', 'Oficina con vistas a los cruasanes.'],
              ['Veo una serie a escondidas', 'No diré nada, prometido.'],
              ['Dos o tres mensajes y lo cierro', 'Rápido y bien hecho.'],
            ],
          },
          pt: {
            t: 'Você se instala no café com seu notebook.',
            o: 'Pergunte o que essa pessoa faz com um notebook no café.',
            a: [
              ['Três horas de trabalho, é meu escritório', 'Escritório com vista pros croissants.'],
              ['Vejo uma série às escondidas', 'Não conto pra ninguém, prometo.'],
              ['Duas ou três mensagens e fecho', 'Rapidinho e bem feito.'],
            ],
          },
          nl: {
            t: 'Je installeert je met je laptop in een café.',
            o: 'Vraag wat die persoon met een laptop in een café doet.',
            a: [
              ['Drie uur werken, het is mijn kantoor', 'Kantoor met uitzicht op croissants.'],
              ['Stiekem een serie kijken', 'Ik zeg niks, beloofd.'],
              ['Twee of drie berichtjes, dan klap ik hem dicht', 'Snel en netjes.'],
            ],
          },
        }),
        s('cafe_bruit_fond', 'rythme', ['🤫', -100, 'calme'], ['☕', 100, 'monde'], {
          fr: { t: 'Pour te concentrer au café, il te faut…', o: 'Demande-lui dans quelle ambiance elle ou il se concentre le mieux.', a: [['Une bibliothèque déguisée en café', 'Chut, même les tasses chuchotent.'], ['Le brouhaha des tasses et des voix', 'Le bruit, c’est ta musique de travail.']], m: 'Un fond sonore léger.' },
          en: { t: 'To focus at a café, you need…', o: 'Ask them what atmosphere helps them focus best.', a: [['A library disguised as a café', 'Shh, even the cups whisper.'], ['The clatter of cups and voices', 'Noise is your work music.']], m: 'A light background hum.' },
          es: { t: 'Para concentrarte en la cafetería, necesitas…', o: 'Pregúntale en qué ambiente se concentra mejor.', a: [['Una biblioteca disfrazada de cafetería', 'Chis, hasta las tazas susurran.'], ['El jaleo de tazas y voces', 'El ruido es tu música de trabajo.']], m: 'Un ruido de fondo suave.' },
          pt: { t: 'Para se concentrar no café, você precisa de…', o: 'Pergunte em que clima essa pessoa se concentra melhor.', a: [['Uma biblioteca disfarçada de café', 'Psiu, até as xícaras sussurram.'], ['O burburinho de xícaras e vozes', 'O barulho é sua trilha de trabalho.']], m: 'Um som de fundo leve.' },
          nl: { t: 'Om je in een café te concentreren heb je nodig…', o: 'Vraag in welke sfeer die persoon zich het best concentreert.', a: [['Een bibliotheek vermomd als café', 'Sst, zelfs de kopjes fluisteren.'], ['Het geroezemoes van kopjes en stemmen', 'Lawaai is jouw werkmuziek.']], m: 'Een zacht achtergrondgeluid.' },
        }),
        c('cafe_table_fetiche', 'cap', [['📌', 70, 'ordre'], ['🎲', -60, 'spontane']], {
          fr: {
            t: 'Ta table au café…',
            o: 'Demande-lui si elle ou il a une table attitrée quelque part.',
            a: [
              ['Toujours la même, près de la prise', 'Stratégie prise électrique, imparable.'],
              ['Celle qui est libre', 'Chaque table est une aventure.'],
            ],
          },
          en: {
            t: 'Your table at the café…',
            o: 'Ask them if they have a usual table somewhere.',
            a: [
              ['Always the same one, by the socket', 'Socket strategy, unbeatable.'],
              ['Whichever is free', 'Every table is an adventure.'],
            ],
          },
          es: {
            t: 'Tu mesa en la cafetería…',
            o: 'Pregúntale si tiene una mesa fija en algún sitio.',
            a: [
              ['Siempre la misma, junto al enchufe', 'Estrategia enchufe, infalible.'],
              ['La que esté libre', 'Cada mesa es una aventura.'],
            ],
          },
          pt: {
            t: 'Sua mesa no café…',
            o: 'Pergunte se essa pessoa tem uma mesa cativa em algum lugar.',
            a: [
              ['Sempre a mesma, perto da tomada', 'Estratégia tomada, imbatível.'],
              ['A que estiver livre', 'Cada mesa é uma aventura.'],
            ],
          },
          nl: {
            t: 'Je tafeltje in het café…',
            o: 'Vraag of die persoon ergens een vast tafeltje heeft.',
            a: [
              ['Altijd hetzelfde, bij het stopcontact', 'Stopcontactstrategie, onverslaanbaar.'],
              ['Welke er vrij is', 'Elk tafeltje is een avontuur.'],
            ],
          },
        }),
        c('cafe_voisin_table', 'foyer', [['👋', 70, 'accueil'], ['🎧', -60, 'liberte'], ['🙂', 10, null]], {
          fr: {
            t: 'À la table d’à côté, quelqu’un travaille aussi.',
            o: 'Demande-lui si elle ou il parle facilement à ses voisins de table.',
            a: [
              ['On finit par partager une prise et des idées', 'Une prise, deux idées, une rencontre.'],
              ['Casque sur les oreilles, chacun sa bulle', 'Deux bulles côte à côte, c’est joli.'],
              ['Un sourire de temps en temps', 'Les sourires, ça compte double.'],
            ],
          },
          en: {
            t: 'At the next table, someone’s working too.',
            o: 'Ask them if they easily chat to people at the next table.',
            a: [
              ['We end up sharing a socket and ideas', 'One socket, two ideas, one meeting.'],
              ['Headphones on, each in our bubble', 'Two bubbles side by side, sweet.'],
              ['A smile now and then', 'Smiles count double.'],
            ],
          },
          es: {
            t: 'En la mesa de al lado, alguien también trabaja.',
            o: 'Pregúntale si habla fácilmente con sus vecinos de mesa.',
            a: [
              ['Acabamos compartiendo enchufe e ideas', 'Un enchufe, dos ideas, un encuentro.'],
              ['Cascos puestos, cada uno en su burbuja', 'Dos burbujas juntas, qué bonito.'],
              ['Una sonrisa de vez en cuando', 'Las sonrisas cuentan doble.'],
            ],
          },
          pt: {
            t: 'Na mesa ao lado, alguém também está trabalhando.',
            o: 'Pergunte se essa pessoa puxa papo fácil com quem está na mesa ao lado.',
            a: [
              ['Acabamos dividindo tomada e ideias', 'Uma tomada, duas ideias, um encontro.'],
              ['Fone no ouvido, cada um na sua bolha', 'Duas bolhas lado a lado, fofo.'],
              ['Um sorriso de vez em quando', 'Sorriso vale em dobro.'],
            ],
          },
          nl: {
            t: 'Aan het tafeltje naast je zit ook iemand te werken.',
            o: 'Vraag of die persoon makkelijk praat met tafelburen.',
            a: [
              ['We delen uiteindelijk een stopcontact en ideeën', 'Eén stopcontact, twee ideeën, een ontmoeting.'],
              ['Koptelefoon op, ieder in z’n bubbel', 'Twee bubbels naast elkaar, schattig.'],
              ['Af en toe een glimlach', 'Glimlachjes tellen dubbel.'],
            ],
          },
        }),
        c('cafe_qg', 'ancrage', [['🏠', -60, 'racines'], ['🗺️', 70, 'curiosite'], ['📚', -20, null]], {
          fr: {
            t: 'Pour travailler hors de chez toi, tu vas…',
            o: 'Demande-lui son endroit préféré pour travailler dehors.',
            a: [
              ['Dans mon café du quartier, mon QG', 'Ton QG, ton fauteuil, ton café.'],
              ['Dans un nouveau lieu à chaque fois', 'Le monde entier est ton bureau.'],
              ['Plutôt à la médiathèque', 'Les livres te tiennent compagnie.'],
            ],
          },
          en: {
            t: 'To work away from home, you go…',
            o: 'Ask them about their favourite place to work outside home.',
            a: [
              ['To my local café, my HQ', 'Your HQ, your chair, your coffee.'],
              ['To a new place every time', 'The whole world is your office.'],
              ['To the library, mostly', 'Books keep you company.'],
            ],
          },
          es: {
            t: 'Para trabajar fuera de casa, vas…',
            o: 'Pregúntale cuál es su sitio favorito para trabajar fuera.',
            a: [
              ['A mi cafetería del barrio, mi cuartel general', 'Tu cuartel, tu silla, tu café.'],
              ['A un sitio nuevo cada vez', 'El mundo entero es tu oficina.'],
              ['Más bien a la biblioteca', 'Los libros te hacen compañía.'],
            ],
          },
          pt: {
            t: 'Para trabalhar fora de casa, você vai…',
            o: 'Pergunte qual é o lugar favorito dessa pessoa para trabalhar fora.',
            a: [
              ['Ao café do bairro, meu QG', 'Seu QG, sua cadeira, seu café.'],
              ['A um lugar novo a cada vez', 'O mundo todo é seu escritório.'],
              ['Mais pra biblioteca', 'Os livros te fazem companhia.'],
            ],
          },
          nl: {
            t: 'Om buiten de deur te werken, ga je…',
            o: 'Vraag naar de favoriete werkplek van die persoon buiten de deur.',
            a: [
              ['Naar mijn buurtcafé, mijn hoofdkwartier', 'Je hoofdkwartier, je stoel, je koffie.'],
              ['Elke keer naar een nieuwe plek', 'De hele wereld is je kantoor.'],
              ['Eerder naar de bibliotheek', 'De boeken houden je gezelschap.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_7',
      title: { fr: 'Thés et infusions', en: 'Teas and infusions', es: 'Tés e infusiones', pt: 'Chás e infusões', nl: 'Thee en kruidenthee' },
      questions: [
        s('cafe_infusion_inconnue', 'ancrage', ['🌼', -100, 'racines'], ['🌺', 100, 'curiosite'], {
          fr: { t: 'On te propose une infusion au nom très poétique.', o: 'Demande-lui l’infusion la plus étonnante qu’elle ou il ait goûtée.', a: [['Camomille, comme toujours', 'La camomille, une vieille amie.'], ['Je goûte, même sans savoir ce que c’est', '« Brume de forêt » ? Ça sent bon !']], m: 'Je sens d’abord, puis je décide.' },
          en: { t: 'You’re offered an infusion with a very poetic name.', o: 'Ask them about the most surprising infusion they’ve tasted.', a: [['Camomile, as always', 'Camomile, an old friend.'], ['I try it, even without knowing what it is', '“Forest mist”? Smells lovely!']], m: 'I sniff first, then decide.' },
          es: { t: 'Te ofrecen una infusión con un nombre muy poético.', o: 'Pregúntale cuál es la infusión más sorprendente que ha probado.', a: [['Manzanilla, como siempre', 'La manzanilla, una vieja amiga.'], ['La pruebo, aunque no sepa qué es', '¿«Bruma del bosque»? ¡Huele genial!']], m: 'Primero huelo, luego decido.' },
          pt: { t: 'Te oferecem uma infusão com um nome bem poético.', o: 'Pergunte qual foi a infusão mais surpreendente que essa pessoa já provou.', a: [['Camomila, como sempre', 'A camomila, velha amiga.'], ['Provo, mesmo sem saber o que é', '“Névoa da floresta”? Que cheiro bom!']], m: 'Cheiro primeiro, depois decido.' },
          nl: { t: 'Je krijgt een kruidenthee met een heel poëtische naam aangeboden.', o: 'Vraag naar de verrassendste kruidenthee die die persoon ooit proefde.', a: [['Kamille, zoals altijd', 'Kamille, een oude vriendin.'], ['Ik proef, ook al weet ik niet wat het is', '“Bosnevel”? Ruikt heerlijk!']], m: 'Eerst ruiken, dan beslissen.' },
        }),
        c('cafe_infuser', 'cap', [['🌡️', 70, 'ordre'], ['🫗', -60, 'spontane'], ['⏲️', 20, null]], {
          fr: {
            t: 'Préparer ton thé, c’est…',
            o: 'Demande-lui comment elle ou il prépare son thé.',
            a: [
              ['Température et temps d’infusion précis', 'Trois minutes trente, pas une de plus.'],
              ['Je laisse le sachet, on verra', 'Thé très, très corsé en vue.'],
              ['Un minuteur, pour ne pas oublier', 'Ding ! Ton thé t’appelle.'],
            ],
          },
          en: {
            t: 'Making your tea is…',
            o: 'Ask them how they make their tea.',
            a: [
              ['Exact temperature and steeping time', 'Three and a half minutes, not one more.'],
              ['I leave the bag in, we’ll see', 'Very, very strong tea ahead.'],
              ['A timer, so I don’t forget', 'Ding! Your tea is calling.'],
            ],
          },
          es: {
            t: 'Preparar tu té es…',
            o: 'Pregúntale cómo prepara su té.',
            a: [
              ['Temperatura y tiempo de infusión exactos', 'Tres minutos y medio, ni uno más.'],
              ['Dejo la bolsita, ya veremos', 'Se avecina un té muy, muy cargado.'],
              ['Un temporizador, para no olvidarme', '¡Din! Tu té te llama.'],
            ],
          },
          pt: {
            t: 'Preparar seu chá é…',
            o: 'Pergunte como essa pessoa prepara o chá.',
            a: [
              ['Temperatura e tempo de infusão exatos', 'Três minutos e meio, nem um a mais.'],
              ['Deixo o saquinho, vamos ver', 'Vem aí um chá bem, bem forte.'],
              ['Um timer, pra não esquecer', 'Plim! Seu chá está chamando.'],
            ],
          },
          nl: {
            t: 'Thee zetten is voor jou…',
            o: 'Vraag hoe die persoon thee zet.',
            a: [
              ['Precieze temperatuur en trektijd', 'Drieënhalve minuut, geen seconde meer.'],
              ['Ik laat het zakje erin, we zien wel', 'Heel, heel sterke thee in aantocht.'],
              ['Een timer, zodat ik het niet vergeet', 'Ping! Je thee roept.'],
            ],
          },
        }),
        c('cafe_theiere_pleine', 'foyer', [['☕', -60, 'liberte'], ['🫖', 70, 'accueil']], {
          fr: {
            t: 'Ta théière, tu la remplis…',
            o: 'Demande-lui pour combien de personnes elle ou il prépare le thé.',
            a: [
              ['Pour une tasse, rien que pour moi', 'Une tasse parfaite, pour toi.'],
              ['Pour six, quelqu’un passera bien', 'Je préviens les voisins !'],
            ],
          },
          en: {
            t: 'You fill your teapot…',
            o: 'Ask them how many people they make tea for.',
            a: [
              ['For one cup, just for me', 'One perfect cup, for you.'],
              ['For six, someone’s bound to drop by', 'I’ll tell the neighbours!'],
            ],
          },
          es: {
            t: 'Tu tetera la llenas…',
            o: 'Pregúntale para cuántas personas prepara té.',
            a: [
              ['Para una taza, solo para mí', 'Una taza perfecta, para ti.'],
              ['Para seis, alguien pasará', '¡Aviso a los vecinos!'],
            ],
          },
          pt: {
            t: 'Seu bule, você enche…',
            o: 'Pergunte para quantas pessoas essa pessoa prepara chá.',
            a: [
              ['Pra uma xícara, só pra mim', 'Uma xícara perfeita, pra você.'],
              ['Pra seis, alguém vai aparecer', 'Vou avisar os vizinhos!'],
            ],
          },
          nl: {
            t: 'Je theepot vul je…',
            o: 'Vraag voor hoeveel mensen die persoon thee zet.',
            a: [
              ['Voor één kopje, alleen voor mij', 'Eén perfect kopje, voor jou.'],
              ['Voor zes, er komt vast iemand langs', 'Ik waarschuw de buren!'],
            ],
          },
        }),
        c('cafe_degustation_the', 'elan', [['📓', 70, 'projets'], ['😌', -60, 'temps_libre'], ['🙋', 20, 'curiosite']], {
          fr: {
            t: 'Un atelier de dégustation de thés près de chez toi.',
            o: 'Demande-lui ce qu’elle ou il aimerait apprendre sur le thé.',
            a: [
              ['Je prends des notes, je veux tout savoir', 'Bientôt experte ou expert, je le sens.'],
              ['Je bois et je profite, c’est tout', 'Profiter, c’est déjà tout un art.'],
              ['Je pose plein de questions', 'Les questions, c’est le meilleur thé.'],
            ],
          },
          en: {
            t: 'A tea-tasting workshop near you.',
            o: 'Ask them what they’d love to learn about tea.',
            a: [
              ['I take notes, I want to know it all', 'Future expert, I can feel it.'],
              ['I drink and enjoy, that’s all', 'Enjoying is an art in itself.'],
              ['I ask loads of questions', 'Questions are the best brew.'],
            ],
          },
          es: {
            t: 'Un taller de cata de tés cerca de casa.',
            o: 'Pregúntale qué le gustaría aprender sobre el té.',
            a: [
              ['Tomo notas, quiero saberlo todo', 'Futuro experto, lo presiento.'],
              ['Bebo y disfruto, y ya', 'Disfrutar ya es todo un arte.'],
              ['Hago un montón de preguntas', 'Las preguntas son la mejor infusión.'],
            ],
          },
          pt: {
            t: 'Uma oficina de degustação de chás perto de você.',
            o: 'Pergunte o que essa pessoa gostaria de aprender sobre chá.',
            a: [
              ['Anoto tudo, quero saber de tudo', 'Futuro especialista, estou sentindo.'],
              ['Bebo e aproveito, só isso', 'Aproveitar já é uma arte.'],
              ['Faço um monte de perguntas', 'Perguntas são a melhor infusão.'],
            ],
          },
          nl: {
            t: 'Een theeproeverij bij jou in de buurt.',
            o: 'Vraag wat die persoon graag over thee zou leren.',
            a: [
              ['Ik maak aantekeningen, ik wil alles weten', 'Toekomstige expert, ik voel het.'],
              ['Ik drink en geniet, dat is alles', 'Genieten is al een kunst.'],
              ['Ik stel heel veel vragen', 'Vragen zijn de beste thee.'],
            ],
          },
        }),
        s('cafe_soiree_the', 'rythme', ['🛋️', -100, 'cocooning'], ['🎲', 100, 'fete'], {
          fr: { t: 'Ta soirée thé idéale…', o: 'Demande-lui à quoi ressemble une bonne soirée tranquille pour elle ou lui.', a: [['Plaid, tisane et une série', 'Je garde la télécommande au chaud.'], ['Grande soirée jeux autour de la théière', 'Je lance les dés !']], m: 'Deux ou trois personnes et une théière.' },
          en: { t: 'Your ideal tea evening…', o: 'Ask them what a nice evening in looks like for them.', a: [['Blanket, herbal tea and a series', 'I’ll keep the remote warm.'], ['Big games night round the teapot', 'I’m rolling the dice!']], m: 'Two or three people and a teapot.' },
          es: { t: 'Tu noche de té ideal…', o: 'Pregúntale cómo es una buena noche en casa para esa persona.', a: [['Manta, infusión y una serie', 'Te guardo el mando calentito.'], ['Gran noche de juegos alrededor de la tetera', '¡Tiro los dados!']], m: 'Dos o tres personas y una tetera.' },
          pt: { t: 'Sua noite de chá ideal…', o: 'Pergunte como é uma boa noite em casa para essa pessoa.', a: [['Manta, chá e uma série', 'Deixo o controle quentinho.'], ['Grande noite de jogos em volta do bule', 'Vou jogar os dados!']], m: 'Duas ou três pessoas e um bule.' },
          nl: { t: 'Je ideale theeavond…', o: 'Vraag hoe een fijne avond thuis eruitziet voor die persoon.', a: [['Dekentje, kruidenthee en een serie', 'Ik hou de afstandsbediening warm.'], ['Grote spelletjesavond rond de theepot', 'Ik gooi de dobbelstenen!']], m: 'Twee of drie mensen en een theepot.' },
        }),
      ],
    },
    {
      id: 'cafe_8',
      title: { fr: 'Se retrouver', en: 'Meeting up', es: 'Quedar', pt: 'Encontros', nl: 'Afspreken' },
      questions: [
        c('cafe_rdv', 'cap', [['📍', 70, 'plan'], ['💬', -60, 'spontane']], {
          fr: {
            t: 'Tu proposes un café à quelqu’un.',
            o: 'Demande-lui comment elle ou il organise un rendez-vous au café.',
            a: [
              ['Adresse, heure, table : tout est calé', 'Même la table ? Impressionnant.'],
              ['« On se retrouve vers le centre ? »', 'On se trouvera, c’est sûr.'],
            ],
          },
          en: {
            t: 'You suggest a coffee to someone.',
            o: 'Ask them how they arrange a coffee meet-up.',
            a: [
              ['Address, time, table: all sorted', 'Even the table? Impressive.'],
              ['“Meet somewhere near the centre?”', 'We’ll find each other, I’m sure.'],
            ],
          },
          es: {
            t: 'Le propones un café a alguien.',
            o: 'Pregúntale cómo organiza una quedada para un café.',
            a: [
              ['Dirección, hora, mesa: todo atado', '¿Hasta la mesa? Impresionante.'],
              ['«¿Nos vemos por el centro?»', 'Ya nos encontraremos, seguro.'],
            ],
          },
          pt: {
            t: 'Você chama alguém para um café.',
            o: 'Pergunte como essa pessoa marca um encontro num café.',
            a: [
              ['Endereço, hora, mesa: tudo certo', 'Até a mesa? Impressionante.'],
              ['“A gente se vê lá pelo centro?”', 'A gente se acha, com certeza.'],
            ],
          },
          nl: {
            t: 'Je stelt iemand voor om koffie te gaan drinken.',
            o: 'Vraag hoe die persoon een koffieafspraak regelt.',
            a: [
              ['Adres, tijd, tafel: alles geregeld', 'Zelfs de tafel? Indrukwekkend.'],
              ['“Zien we elkaar ergens in het centrum?”', 'We vinden elkaar wel, zeker weten.'],
            ],
          },
        }),
        s('cafe_entre_amis', 'foyer', ['☕', -100, 'liberte'], ['👥', 100, 'accueil'], {
          fr: { t: 'Un café entre amis, c’est…', o: 'Demande-lui à quoi ressemble un bon café entre amis.', a: [['Vite pris, chacun repart à sa vie', 'Court mais précieux.'], ['Toute la bande, on reste des heures', 'Je commande la troisième tournée de cafés.']], m: 'Deux ou trois, le temps qu’il faut.' },
          en: { t: 'Coffee with friends means…', o: 'Ask them what a good coffee with friends looks like.', a: [['A quick one, then back to our lives', 'Short but precious.'], ['The whole gang, we stay for hours', 'I’m ordering the third round of coffees.']], m: 'Two or three, as long as it takes.' },
          es: { t: 'Un café con amigos es…', o: 'Pregúntale cómo es un buen café con amigos.', a: [['Rapidito, y cada uno a lo suyo', 'Corto pero valioso.'], ['Toda la pandilla, horas y horas', 'Pido la tercera ronda de cafés.']], m: 'Dos o tres, el tiempo que haga falta.' },
          pt: { t: 'Um café com amigos é…', o: 'Pergunte como é um bom café com amigos para essa pessoa.', a: [['Rapidinho, e cada um segue a vida', 'Curto, mas precioso.'], ['A turma toda, ficamos horas', 'Vou pedir a terceira rodada de cafés.']], m: 'Dois ou três, o tempo que for.' },
          nl: { t: 'Koffie met vrienden is…', o: 'Vraag hoe een fijne koffie met vrienden eruitziet.', a: [['Snel eentje, dan ieder weer z’n weg', 'Kort maar kostbaar.'], ['De hele club, we blijven uren', 'Ik bestel de derde ronde koffie.']], m: 'Met z’n tweeën of drieën, zo lang als nodig.' },
        }),
        c('cafe_retard', 'elan', [['📖', -60, 'temps_libre'], ['💻', 60, 'projets'], ['👀', -20, 'curiosite']], {
          fr: {
            t: 'La personne que tu attends a vingt minutes de retard.',
            o: 'Demande-lui ce qu’elle ou il fait quand on l’attend.',
            a: [
              ['Parfait, je savoure mon café', 'Vingt minutes de bonheur offertes.'],
              ['J’en profite pour avancer un truc', 'Le retard le plus productif du monde.'],
              ['J’observe les gens autour', 'Tu inventes leur vie ? Moi oui.'],
            ],
          },
          en: {
            t: 'The person you’re waiting for is twenty minutes late.',
            o: 'Ask them what they do while waiting for someone.',
            a: [
              ['Perfect, I savour my coffee', 'Twenty minutes of bliss, on the house.'],
              ['I use it to get something done', 'The most productive delay ever.'],
              ['I people-watch', 'Making up their lives? I do.'],
            ],
          },
          es: {
            t: 'La persona a la que esperas llega veinte minutos tarde.',
            o: 'Pregúntale qué hace mientras espera a alguien.',
            a: [
              ['Perfecto, saboreo mi café', 'Veinte minutos de felicidad regalados.'],
              ['Aprovecho para adelantar algo', 'El retraso más productivo del mundo.'],
              ['Observo a la gente', '¿Les inventas la vida? Yo sí.'],
            ],
          },
          pt: {
            t: 'A pessoa que você espera está vinte minutos atrasada.',
            o: 'Pergunte o que essa pessoa faz enquanto espera alguém.',
            a: [
              ['Perfeito, saboreio meu café', 'Vinte minutos de alegria de presente.'],
              ['Aproveito pra adiantar alguma coisa', 'O atraso mais produtivo do mundo.'],
              ['Fico observando as pessoas', 'Inventando a vida delas? Eu invento.'],
            ],
          },
          nl: {
            t: 'Degene op wie je wacht is twintig minuten te laat.',
            o: 'Vraag wat die persoon doet tijdens het wachten.',
            a: [
              ['Perfect, ik geniet van mijn koffie', 'Twintig minuten geluk, cadeau.'],
              ['Ik werk nog even iets af', 'De productiefste vertraging ooit.'],
              ['Ik kijk naar de mensen om me heen', 'Hun leven verzinnen? Ik wel.'],
            ],
          },
        }),
        c('cafe_nouvelles_tetes', 'ancrage', [['🤩', 70, 'curiosite'], ['🙂', -50, 'racines']], {
          fr: {
            t: 'Quelqu’un de ta bande arrive au café avec deux personnes que tu ne connais pas.',
            o: 'Demande-lui comment elle ou il réagit aux nouvelles têtes.',
            a: [
              ['Génial, des nouvelles têtes !', 'Plus on est de fous, plus on rit.'],
              ['Je préfère nos habitudes, mais ça va', 'Les habitudes, c’est doux aussi.'],
            ],
          },
          en: {
            t: 'A friend turns up at the café with two people you don’t know.',
            o: 'Ask them how they feel about new faces.',
            a: [
              ['Brilliant, new faces!', 'The more, the merrier.'],
              ['I prefer our routine, but it’s fine', 'Routines are cosy too.'],
            ],
          },
          es: {
            t: 'Alguien de tu grupo llega a la cafetería con dos personas que no conoces.',
            o: 'Pregúntale cómo reacciona ante caras nuevas.',
            a: [
              ['¡Genial, caras nuevas!', 'Cuantos más, mejor.'],
              ['Prefiero lo de siempre, pero bien', 'Lo de siempre también es bonito.'],
            ],
          },
          pt: {
            t: 'Alguém da sua turma chega ao café com duas pessoas que você não conhece.',
            o: 'Pergunte como essa pessoa reage a gente nova.',
            a: [
              ['Que ótimo, gente nova!', 'Quanto mais, melhor.'],
              ['Prefiro nosso costume, mas tudo bem', 'Costume também é aconchego.'],
            ],
          },
          nl: {
            t: 'Iemand uit je groep komt naar het café met twee mensen die je niet kent.',
            o: 'Vraag hoe die persoon op nieuwe gezichten reageert.',
            a: [
              ['Leuk, nieuwe gezichten!', 'Hoe meer zielen, hoe meer vreugd.'],
              ['Ik hou meer van onze gewoonte, maar prima', 'Gewoontes zijn ook knus.'],
            ],
          },
        }),
        c('cafe_apres_rdv', 'rythme', [['🎉', 80, 'fete'], ['🚶', 20, 'ville'], ['🏠', -70, 'cocooning']], {
          fr: {
            t: 'Les tasses sont vides.',
            o: 'Demande-lui comment se termine un bon café entre amis.',
            a: [
              ['On enchaîne sur une soirée', 'La soirée commence à peine !'],
              ['On marche un peu ensemble', 'Une balade pour digérer les bavardages.'],
              ['Je rentre au chaud, le cœur content', 'Plein d’énergie douce, c’est parfait.'],
            ],
          },
          en: {
            t: 'The cups are empty.',
            o: 'Ask them how a good coffee with friends ends.',
            a: [
              ['We carry on into the evening', 'The night is just getting started!'],
              ['We walk together for a bit', 'A stroll to digest all the chatter.'],
              ['I head home, happy and cosy', 'Full of gentle energy, perfect.'],
            ],
          },
          es: {
            t: 'Las tazas están vacías.',
            o: 'Pregúntale cómo termina un buen café con amigos.',
            a: [
              ['Seguimos con un plan de noche', '¡La noche acaba de empezar!'],
              ['Paseamos un rato juntos', 'Un paseo para bajar la charla.'],
              ['Vuelvo a casa, con el corazón contento', 'Lleno de energía tranquila, perfecto.'],
            ],
          },
          pt: {
            t: 'As xícaras estão vazias.',
            o: 'Pergunte como termina um bom café com amigos.',
            a: [
              ['Emendamos numa noitada', 'A noite está só começando!'],
              ['Caminhamos um pouco juntos', 'Um passeio pra digerir o papo.'],
              ['Volto pra casa, de coração feliz', 'Cheio de energia boa, perfeito.'],
            ],
          },
          nl: {
            t: 'De kopjes zijn leeg.',
            o: 'Vraag hoe een fijne koffie met vrienden eindigt.',
            a: [
              ['We gaan door, de avond in', 'De avond begint pas!'],
              ['We lopen nog een stukje samen', 'Een wandelingetje om het gekletst te laten zakken.'],
              ['Ik ga naar huis, blij en tevreden', 'Vol zachte energie, perfect.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_9',
      title: { fr: 'Le café à la maison', en: 'Coffee at home', es: 'El café en casa', pt: 'Café em casa', nl: 'Koffie thuis' },
      questions: [
        c('cafe_methode', 'ancrage', [['🫖', -70, 'racines'], ['⚗️', 70, 'curiosite'], ['🔌', -10, null]], {
          fr: {
            t: 'Chez toi, ton café sort…',
            o: 'Demande-lui comment elle ou il fait son café à la maison.',
            a: [
              ['De la vieille cafetière italienne', 'Ce petit glouglou, quel bonheur.'],
              ['D’une méthode que je teste ce mois-ci', 'Ta cuisine, un vrai labo !'],
              ['D’une machine toute simple', 'Simple et efficace, j’approuve.'],
            ],
          },
          en: {
            t: 'At home, your coffee comes out of…',
            o: 'Ask them how they make coffee at home.',
            a: [
              ['The old stovetop pot', 'That little gurgle, pure joy.'],
              ['A method I’m trying this month', 'Your kitchen is a real lab!'],
              ['A very simple machine', 'Simple and effective, I approve.'],
            ],
          },
          es: {
            t: 'En casa, tu café sale…',
            o: 'Pregúntale cómo hace el café en casa.',
            a: [
              ['De la vieja cafetera italiana', 'Ese borboteo, qué felicidad.'],
              ['De un método que pruebo este mes', '¡Tu cocina es un laboratorio!'],
              ['De una máquina sencillita', 'Sencillo y eficaz, lo apruebo.'],
            ],
          },
          pt: {
            t: 'Em casa, seu café sai…',
            o: 'Pergunte como essa pessoa faz café em casa.',
            a: [
              ['Da velha cafeteira italiana', 'Aquele borbulhar, que alegria.'],
              ['De um método que estou testando este mês', 'Sua cozinha é um laboratório!'],
              ['De uma máquina bem simples', 'Simples e eficiente, aprovo.'],
            ],
          },
          nl: {
            t: 'Thuis komt je koffie uit…',
            o: 'Vraag hoe die persoon thuis koffie zet.',
            a: [
              ['De oude Italiaanse percolator', 'Dat geborrel, puur geluk.'],
              ['Een methode die ik deze maand probeer', 'Je keuken is een echt lab!'],
              ['Een heel simpel apparaat', 'Simpel en doeltreffend, goedgekeurd.'],
            ],
          },
        }),
        s('cafe_recevoir', 'foyer', ['🧘', -100, 'liberte'], ['🚪', 100, 'accueil'], {
          fr: { t: 'Chez toi, le café…', o: 'Demande-lui si on passe souvent boire un café chez elle ou lui.', a: [['C’est mon rituel en solo', 'Un rituel rien qu’à toi.'], ['On sonne, je mets la bouilloire', 'Ding-dong, ça chauffe !']], m: 'Pour moi, et pour qui passe.' },
          en: { t: 'At home, coffee is…', o: 'Ask them if people often drop by for a coffee.', a: [['My solo ritual', 'A ritual all your own.'], ['Doorbell rings, kettle goes on', 'Ding-dong, it’s brewing!']], m: 'For me, and whoever drops by.' },
          es: { t: 'En casa, el café…', o: 'Pregúntale si la gente pasa a menudo a tomar café a su casa.', a: [['Es mi ritual a solas', 'Un ritual solo tuyo.'], ['Llaman al timbre, pongo el hervidor', '¡Din-don, se calienta!']], m: 'Para mí, y para quien pase.' },
          pt: { t: 'Em casa, o café…', o: 'Pergunte se as pessoas costumam passar pra tomar café na casa dessa pessoa.', a: [['É meu ritual só meu', 'Um ritual todo seu.'], ['Tocou a campainha, ponho a chaleira', 'Dim-dom, tá esquentando!']], m: 'Pra mim, e pra quem passar.' },
          nl: { t: 'Thuis is koffie…', o: 'Vraag of er vaak mensen bij die persoon langskomen voor koffie.', a: [['Mijn eigen ritueel', 'Een ritueel helemaal voor jou.'], ['De bel gaat, de waterkoker aan', 'Ding-dong, het water kookt!']], m: 'Voor mij, en voor wie langskomt.' },
        }),
        c('cafe_reserve', 'cap', [['🗃️', 80, 'ordre'], ['😅', -70, 'spontane']], {
          fr: {
            t: 'Ta réserve de café ou de thé…',
            o: 'Demande-lui si son placard a déjà manqué de café.',
            a: [
              ['Étiquetée, rangée, jamais vide', 'Des bocaux bien alignés, je craque.'],
              ['Je découvre qu’elle est vide le matin même', 'Le petit matin qui pique, je compatis.'],
            ],
          },
          en: {
            t: 'Your stock of coffee or tea…',
            o: 'Ask them if they’ve ever run out of coffee.',
            a: [
              ['Labelled, tidy, never empty', 'Neatly lined-up jars, swoon.'],
              ['I find it empty that very morning', 'That rough morning, I feel you.'],
            ],
          },
          es: {
            t: 'Tu reserva de café o de té…',
            o: 'Pregúntale si alguna vez se ha quedado sin café.',
            a: [
              ['Etiquetada, ordenada, nunca vacía', 'Botes bien alineados, me encanta.'],
              ['Descubro que está vacía esa misma mañana', 'Qué mañana tan dura, te entiendo.'],
            ],
          },
          pt: {
            t: 'Seu estoque de café ou chá…',
            o: 'Pergunte se essa pessoa já ficou sem café.',
            a: [
              ['Etiquetado, organizado, nunca vazio', 'Potes bem alinhados, me derreto.'],
              ['Descubro que acabou na mesma manhã', 'Que manhã difícil, te entendo.'],
            ],
          },
          nl: {
            t: 'Je voorraad koffie of thee…',
            o: 'Vraag of die persoon ooit zonder koffie zat.',
            a: [
              ['Met etiket, opgeruimd, nooit leeg', 'Netjes rijen potjes, ik smelt.'],
              ['Ik ontdek die ochtend pas dat hij leeg is', 'Wat een ochtend, ik leef mee.'],
            ],
          },
        }),
        c('cafe_dessin_mousse', 'elan', [['🎨', 70, 'projets'], ['🥛', -60, 'temps_libre'], ['🤭', 10, 'humour']], {
          fr: {
            t: 'Faire un joli dessin sur la mousse de lait…',
            o: 'Demande-lui si elle ou il a déjà tenté le dessin sur mousse.',
            a: [
              ['Je m’entraîne jusqu’au cœur parfait', 'Bientôt des cygnes, je le sens.'],
              ['Mousse ou pas, je bois', 'Le goût d’abord, c’est sage.'],
              ['Mes cœurs ressemblent à des nuages', 'Les nuages, c’est très joli aussi.'],
            ],
          },
          en: {
            t: 'Drawing a pretty pattern on the milk foam…',
            o: 'Ask them if they’ve ever tried latte art.',
            a: [
              ['I practise until the heart is perfect', 'Swans coming soon, I can tell.'],
              ['Foam or not, I just drink it', 'Taste first, wise choice.'],
              ['My hearts look like clouds', 'Clouds are lovely too.'],
            ],
          },
          es: {
            t: 'Hacer un dibujo bonito en la espuma de leche…',
            o: 'Pregúntale si alguna vez ha intentado dibujar en la espuma.',
            a: [
              ['Practico hasta el corazón perfecto', 'Pronto cisnes, lo presiento.'],
              ['Con espuma o sin ella, me lo bebo', 'Primero el sabor, muy sensato.'],
              ['Mis corazones parecen nubes', 'Las nubes también son bonitas.'],
            ],
          },
          pt: {
            t: 'Fazer um desenho bonito na espuma do leite…',
            o: 'Pergunte se essa pessoa já tentou desenhar na espuma.',
            a: [
              ['Treino até o coração perfeito', 'Logo vêm os cisnes, estou sentindo.'],
              ['Com espuma ou não, eu bebo', 'O sabor primeiro, sábio.'],
              ['Meus corações parecem nuvens', 'Nuvens também são lindas.'],
            ],
          },
          nl: {
            t: 'Een mooi figuurtje in het melkschuim maken…',
            o: 'Vraag of die persoon ooit latte-art heeft geprobeerd.',
            a: [
              ['Ik oefen tot het hartje perfect is', 'Binnenkort zwanen, ik voel het.'],
              ['Schuim of niet, ik drink gewoon', 'Smaak eerst, verstandig.'],
              ['Mijn hartjes lijken op wolkjes', 'Wolkjes zijn ook mooi.'],
            ],
          },
        }),
        c('cafe_dimanche_maison', 'rythme', [['🛏️', -80, 'cocooning'], ['🌳', 20, 'dehors'], ['🥐', 70, 'monde']], {
          fr: {
            t: 'Dimanche matin, ton café…',
            o: 'Demande-lui à quoi ressemble son dimanche matin.',
            a: [
              ['Au lit, en pyjama', 'Pyjama du dimanche, tenue officielle.'],
              ['Au balcon ou au jardin', 'Bonjour les oiseaux !'],
              ['Grand brunch avec du monde', 'Je m’occupe des croissants !'],
            ],
          },
          en: {
            t: 'Sunday morning, your coffee…',
            o: 'Ask them what their Sunday morning looks like.',
            a: [
              ['In bed, in my pyjamas', 'Sunday pyjamas, official dress code.'],
              ['On the balcony or in the garden', 'Morning, birds!'],
              ['A big brunch with people over', 'I’ll handle the croissants!'],
            ],
          },
          es: {
            t: 'Domingo por la mañana, tu café…',
            o: 'Pregúntale cómo es su domingo por la mañana.',
            a: [
              ['En la cama, en pijama', 'Pijama de domingo, uniforme oficial.'],
              ['En el balcón o en el jardín', '¡Buenos días, pájaros!'],
              ['Gran brunch con gente', '¡Yo me encargo de los cruasanes!'],
            ],
          },
          pt: {
            t: 'Domingo de manhã, seu café…',
            o: 'Pergunte como é o domingo de manhã dessa pessoa.',
            a: [
              ['Na cama, de pijama', 'Pijama de domingo, traje oficial.'],
              ['Na varanda ou no quintal', 'Bom dia, passarinhos!'],
              ['Um brunchão com gente', 'Eu cuido dos croissants!'],
            ],
          },
          nl: {
            t: 'Zondagochtend, je koffie…',
            o: 'Vraag hoe de zondagochtend van die persoon eruitziet.',
            a: [
              ['In bed, in pyjama', 'Zondagse pyjama, officieel tenue.'],
              ['Op het balkon of in de tuin', 'Goedemorgen, vogeltjes!'],
              ['Uitgebreide brunch met mensen', 'Ik zorg voor de croissants!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'cafe_10',
      title: { fr: 'Ton café de quartier', en: 'Your local café', es: 'Tu café de barrio', pt: 'Seu café de bairro', nl: 'Je buurtcafé' },
      questions: [
        c('cafe_habitue', 'ancrage', [['😊', -70, 'racines'], ['🕵️', 60, 'curiosite']], {
          fr: {
            t: 'Au café du coin, on commence à te connaître.',
            o: 'Demande-lui si elle ou il a ses habitudes dans un café.',
            a: [
              ['J’adore qu’on connaisse ma commande', 'Ta tasse arrive avant toi.'],
              ['Je change d’adresse pour rester incognito', 'Agent secret du petit noir.'],
            ],
          },
          en: {
            t: 'At the corner café, they’re starting to know you.',
            o: 'Ask them if they’re a regular somewhere.',
            a: [
              ['I love that they know my order', 'Your cup arrives before you do.'],
              ['I switch places to stay incognito', 'Secret agent of the espresso.'],
            ],
          },
          es: {
            t: 'En el bar de la esquina empiezan a conocerte.',
            o: 'Pregúntale si es cliente habitual de algún sitio.',
            a: [
              ['Me encanta que sepan lo que pido', 'Tu taza llega antes que tú.'],
              ['Cambio de sitio para seguir de incógnito', 'Agente secreto del cortado.'],
            ],
          },
          pt: {
            t: 'No café da esquina, já começam a te conhecer.',
            o: 'Pergunte se essa pessoa é freguesa fiel de algum lugar.',
            a: [
              ['Adoro que saibam meu pedido', 'Sua xícara chega antes de você.'],
              ['Mudo de lugar pra ficar incógnito', 'Agente secreto do cafezinho.'],
            ],
          },
          nl: {
            t: 'In het café op de hoek beginnen ze je te kennen.',
            o: 'Vraag of die persoon ergens vaste klant is.',
            a: [
              ['Ik vind het heerlijk dat ze mijn bestelling kennen', 'Je kopje is er eerder dan jij.'],
              ['Ik wissel van zaak om incognito te blijven', 'Geheim agent van de espresso.'],
            ],
          },
        }),
        s('cafe_quartier_vie', 'rythme', ['📚', -100, 'calme'], ['🎤', 100, 'fete'], {
          fr: { t: 'Ton café de quartier idéal…', o: 'Demande-lui à quoi ressemble son café de quartier rêvé.', a: [['Petit, quelques tables, du silence', 'Un refuge, rien que ça.'], ['Concerts, quiz, du monde tous les soirs', 'Je m’inscris au quiz !']], m: 'Animé sans être bruyant.' },
          en: { t: 'Your ideal local café…', o: 'Ask them what their dream local café looks like.', a: [['Small, a few tables, quiet', 'A refuge, simple as that.'], ['Gigs, quizzes, packed every night', 'I’m signing up for the quiz!']], m: 'Lively but not loud.' },
          es: { t: 'Tu café de barrio ideal…', o: 'Pregúntale cómo sería el café de barrio de sus sueños.', a: [['Pequeño, pocas mesas, silencio', 'Un refugio, así de simple.'], ['Conciertos, concursos, lleno cada noche', '¡Me apunto al concurso!']], m: 'Animado sin ser ruidoso.' },
          pt: { t: 'Seu café de bairro ideal…', o: 'Pergunte como seria o café de bairro dos sonhos dessa pessoa.', a: [['Pequeno, poucas mesas, silêncio', 'Um refúgio, simples assim.'], ['Shows, quiz, cheio toda noite', 'Vou me inscrever no quiz!']], m: 'Animado sem ser barulhento.' },
          nl: { t: 'Je ideale buurtcafé…', o: 'Vraag hoe het droombuurtcafé van die persoon eruitziet.', a: [['Klein, een paar tafeltjes, stil', 'Een toevluchtsoord, zo simpel.'], ['Optredens, quizzen, elke avond vol', 'Ik schrijf me in voor de quiz!']], m: 'Levendig maar niet luid.' },
        }),
        c('cafe_nouvelle_adresse', 'cap', [['📆', 60, 'plan'], ['🚪', -60, 'spontane'], ['👂', 10, null]], {
          fr: {
            t: 'Un nouveau café ouvre en bas de chez toi.',
            o: 'Demande-lui le dernier café qu’elle ou il a découvert.',
            a: [
              ['Je bloque un créneau pour l’essayer', 'Rendez-vous noté, stylo rouge.'],
              ['J’entre dès que je passe devant', 'Le hasard fait bien les choses.'],
              ['J’attends les premiers avis du quartier', 'Le bouche-à-oreille, c’est sûr.'],
            ],
          },
          en: {
            t: 'A new café opens just downstairs.',
            o: 'Ask them about the last café they discovered.',
            a: [
              ['I block out time to try it', 'Appointment noted, in red pen.'],
              ['I go in as soon as I pass by', 'Chance does things nicely.'],
              ['I wait for the neighbours’ verdict', 'Word of mouth, a safe bet.'],
            ],
          },
          es: {
            t: 'Abre una cafetería nueva justo debajo de casa.',
            o: 'Pregúntale cuál es la última cafetería que ha descubierto.',
            a: [
              ['Me reservo un rato para probarla', 'Cita apuntada, en rojo.'],
              ['Entro en cuanto paso por delante', 'El azar hace bien las cosas.'],
              ['Espero las primeras opiniones del barrio', 'El boca a boca, apuesta segura.'],
            ],
          },
          pt: {
            t: 'Um café novo abre bem embaixo da sua casa.',
            o: 'Pergunte qual foi o último café que essa pessoa descobriu.',
            a: [
              ['Reservo um horário pra experimentar', 'Compromisso anotado, de caneta vermelha.'],
              ['Entro assim que passar na frente', 'O acaso faz bem as coisas.'],
              ['Espero as primeiras opiniões do bairro', 'O boca a boca nunca falha.'],
            ],
          },
          nl: {
            t: 'Er opent een nieuw café beneden bij jou.',
            o: 'Vraag naar het laatste café dat die persoon ontdekte.',
            a: [
              ['Ik plan een moment om het te proberen', 'Afspraak genoteerd, met rode pen.'],
              ['Ik ga binnen zodra ik erlangs loop', 'Het toeval doet het goed.'],
              ['Ik wacht op wat de buurt ervan vindt', 'Mond-tot-mondreclame, altijd raak.'],
            ],
          },
        }),
        c('cafe_table_commune', 'foyer', [['🪑', 70, 'accueil'], ['🪟', -60, 'liberte'], ['🙂', 20, null]], {
          fr: {
            t: 'Le café a une grande table commune.',
            o: 'Demande-lui si elle ou il aime les grandes tables partagées.',
            a: [
              ['Je m’y installe, on fait connaissance', 'Une table, dix histoires.'],
              ['Je prends le petit coin près de la fenêtre', 'Ton coin, ta vue, ton calme.'],
              ['Au bout de la table, un peu à part', 'Avec tout le monde, mais à ta façon.'],
            ],
          },
          en: {
            t: 'The café has a big communal table.',
            o: 'Ask them if they like big shared tables.',
            a: [
              ['I sit there, we get to know each other', 'One table, ten stories.'],
              ['I take the little corner by the window', 'Your corner, your view, your calm.'],
              ['At the end of the table, a bit apart', 'With everyone, but your way.'],
            ],
          },
          es: {
            t: 'La cafetería tiene una gran mesa compartida.',
            o: 'Pregúntale si le gustan las mesas grandes compartidas.',
            a: [
              ['Me siento ahí y nos conocemos', 'Una mesa, diez historias.'],
              ['Me pido el rincón junto a la ventana', 'Tu rincón, tus vistas, tu calma.'],
              ['En la punta de la mesa, algo aparte', 'Con todos, pero a tu manera.'],
            ],
          },
          pt: {
            t: 'O café tem uma mesa comunitária enorme.',
            o: 'Pergunte se essa pessoa gosta de mesas grandes compartilhadas.',
            a: [
              ['Sento lá e a gente se conhece', 'Uma mesa, dez histórias.'],
              ['Pego o cantinho perto da janela', 'Seu canto, sua vista, sua calma.'],
              ['Na ponta da mesa, um pouco à parte', 'Com todo mundo, mas do seu jeito.'],
            ],
          },
          nl: {
            t: 'Het café heeft een grote gedeelde tafel.',
            o: 'Vraag of die persoon van grote gedeelde tafels houdt.',
            a: [
              ['Ik ga erbij zitten, we leren elkaar kennen', 'Eén tafel, tien verhalen.'],
              ['Ik neem het hoekje bij het raam', 'Jouw hoekje, jouw uitzicht, jouw rust.'],
              ['Aan het eind van de tafel, een beetje apart', 'Met iedereen, maar op jouw manier.'],
            ],
          },
        }),
        s('cafe_animer', 'elan', ['☕', -100, 'temps_libre'], ['📣', 100, 'projets'], {
          fr: { t: 'Ton café de quartier cherche des idées d’animations.', o: 'Demande-lui quelle animation elle ou il aimerait voir dans un café.', a: [['Je viens profiter, c’est tout', 'Profiter, c’est aussi faire vivre le lieu.'], ['Je propose d’organiser un club', 'Club du jeudi, je m’inscris !']], m: 'Je donne une idée, sans m’engager.' },
          en: { t: 'Your local café is looking for event ideas.', o: 'Ask them which event they’d love to see at a café.', a: [['I come to enjoy, that’s all', 'Enjoying keeps the place alive too.'], ['I offer to run a club', 'Thursday club, sign me up!']], m: 'I share an idea, no strings attached.' },
          es: { t: 'Tu café de barrio busca ideas de actividades.', o: 'Pregúntale qué actividad le gustaría ver en una cafetería.', a: [['Vengo a disfrutar, y ya', 'Disfrutar también da vida al sitio.'], ['Me ofrezco a organizar un club', '¡Club de los jueves, me apunto!']], m: 'Doy una idea, sin comprometerme.' },
          pt: { t: 'Seu café de bairro procura ideias de atividades.', o: 'Pergunte que atividade essa pessoa gostaria de ver num café.', a: [['Vou pra aproveitar, só isso', 'Aproveitar também dá vida ao lugar.'], ['Me ofereço pra organizar um clube', 'Clube de quinta, me inscrevo!']], m: 'Dou uma ideia, sem compromisso.' },
          nl: { t: 'Je buurtcafé zoekt ideeën voor activiteiten.', o: 'Vraag welke activiteit die persoon graag in een café zou zien.', a: [['Ik kom genieten, meer niet', 'Genieten houdt de plek ook levend.'], ['Ik bied aan een club te organiseren', 'Donderdagclub, schrijf me in!']], m: 'Ik geef een idee, zonder verplichtingen.' },
        }),
      ],
    },
  ],
};
