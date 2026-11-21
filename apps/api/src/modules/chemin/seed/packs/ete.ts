// Univers « Été » : chaleur, plages, festivals, longues soirées, vacances d’été.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'ete',
  icon: '☀️',
  title: {
    fr: ['L’été', 'Chaleur, plages et longues soirées.'],
    en: ['Summer', 'Heat, beaches and long evenings.'],
    es: ['El verano', 'Calor, playas y noches largas.'],
    pt: ['O verão', 'Calor, praias e noites longas.'],
    nl: ['De zomer', 'Warmte, stranden en lange avonden.'],
  },
  steps: [
    {
      id: 'ete_1',
      title: { fr: 'L’été arrive', en: 'Summer’s here', es: 'Llega el verano', pt: 'O verão chegou', nl: 'De zomer komt' },
      questions: [
        c('ete_premier_jour', 'cap', [['📅', 60, 'plan'], ['☀️', -70, 'spontane'], ['🩴', -10, null]], {
          fr: {
            t: 'Premier vrai jour d’été.',
            o: 'Demande-lui ce qu’elle ou il fait le premier jour d’été.',
            a: [
              ['J’ai déjà mon programme de l’été', 'Un été bien rangé, j’adore.'],
              ['Je laisse tout tomber et je sors', 'Le soleil t’appelle, tu réponds !'],
              ['Je sors les tongs, et on verra', 'Clac-clac, l’été commence.'],
            ],
          },
          en: {
            t: 'First real day of summer.',
            o: 'Ask them what they do on the first day of summer.',
            a: [
              ['My summer plan is already set', 'A tidy summer, love it.'],
              ['I drop everything and go out', 'The sun calls, you answer!'],
              ['Flip-flops on, and we’ll see', 'Flip-flop, summer begins.'],
            ],
          },
          es: {
            t: 'Primer día de verano de verdad.',
            o: 'Pregúntale qué hace el primer día de verano.',
            a: [
              ['Ya tengo el plan del verano', 'Un verano ordenadito, me encanta.'],
              ['Lo dejo todo y salgo', '¡El sol te llama y tú respondes!'],
              ['Saco las chanclas, y ya veremos', 'Chas-chas, empieza el verano.'],
            ],
          },
          pt: {
            t: 'Primeiro dia de verão de verdade.',
            o: 'Pergunte o que essa pessoa faz no primeiro dia de verão.',
            a: [
              ['Já tenho a programação do verão', 'Um verão organizado, adoro.'],
              ['Largo tudo e saio', 'O sol chama, você atende!'],
              ['Calço os chinelos, e vamos ver', 'Plec-plec, o verão começou.'],
            ],
          },
          nl: {
            t: 'De eerste echte zomerdag.',
            o: 'Vraag wat die persoon doet op de eerste zomerdag.',
            a: [
              ['Mijn zomerplanning staat al', 'Een opgeruimde zomer, heerlijk.'],
              ['Ik laat alles vallen en ga naar buiten', 'De zon roept, jij antwoordt!'],
              ['Slippers aan, en we zien wel', 'Flip-flop, de zomer begint.'],
            ],
          },
        }),
        s('ete_ou_cet_ete', 'ancrage', ['🏡', -100, 'racines'], ['🌍', 100, 'voyage'], {
          fr: { t: 'Ton été, tu l’imagines…', o: 'Demande-lui à quoi ressemble son été rêvé.', a: [['Comme chaque année, au même endroit', 'Les bons endroits, on y revient.'], ['Dans un endroit tout nouveau pour moi', 'Nouvel horizon, je prépare mon chapeau !']], m: 'Un mélange de rituels et de nouveautés.' },
          en: { t: 'You picture your summer…', o: 'Ask them what their dream summer looks like.', a: [['Like every year, in the same place', 'Good places are worth returning to.'], ['Somewhere completely new to me', 'New horizon, I’m grabbing my hat!']], m: 'A mix of rituals and new things.' },
          es: { t: 'Tu verano lo imaginas…', o: 'Pregúntale cómo sería su verano soñado.', a: [['Como cada año, en el mismo sitio', 'A los buenos sitios se vuelve.'], ['En un lugar totalmente nuevo para mí', '¡Nuevo horizonte, cojo mi sombrero!']], m: 'Una mezcla de rituales y novedades.' },
          pt: { t: 'Seu verão, você imagina…', o: 'Pergunte como seria o verão dos sonhos dessa pessoa.', a: [['Como todo ano, no mesmo lugar', 'Lugar bom a gente sempre volta.'], ['Num lugar totalmente novo pra mim', 'Novo horizonte, vou pegar meu chapéu!']], m: 'Uma mistura de rituais e novidades.' },
          nl: { t: 'Je zomer stel je je voor…', o: 'Vraag hoe de droomzomer van die persoon eruitziet.', a: [['Zoals elk jaar, op dezelfde plek', 'Naar goede plekken ga je terug.'], ['Op een plek die helemaal nieuw voor me is', 'Nieuwe horizon, ik pak mijn zonnehoed!']], m: 'Een mix van rituelen en nieuwe dingen.' },
        }),
        c('ete_liste_envies', 'elan', [['📝', 70, 'projets'], ['🌞', -70, 'temps_libre'], ['🍉', -10, null]], {
          fr: {
            t: 'Ta liste d’envies pour l’été…',
            o: 'Demande-lui ce qu’il y a sur sa liste d’envies de l’été.',
            a: [
              ['Longue : surfer, lire dix livres…', 'Je tiens le crayon pour cocher !'],
              ['Une seule ligne : ne rien faire', 'La meilleure liste du monde.'],
              ['Manger des pastèques, surtout', 'Je m’occupe des pépins.'],
            ],
          },
          en: {
            t: 'Your summer wish list…',
            o: 'Ask them what’s on their summer wish list.',
            a: [
              ['Long: surfing, reading ten books…', 'I’ll hold the pencil to tick things off!'],
              ['One line: do nothing', 'Best list in the world.'],
              ['Eating watermelon, mainly', 'I’ll handle the pips.'],
            ],
          },
          es: {
            t: 'Tu lista de deseos para el verano…',
            o: 'Pregúntale qué hay en su lista de deseos del verano.',
            a: [
              ['Larga: surfear, leer diez libros…', '¡Yo sujeto el lápiz para tachar!'],
              ['Una sola línea: no hacer nada', 'La mejor lista del mundo.'],
              ['Comer sandía, sobre todo', 'Yo me encargo de las pepitas.'],
            ],
          },
          pt: {
            t: 'Sua lista de desejos para o verão…',
            o: 'Pergunte o que tem na lista de desejos de verão dessa pessoa.',
            a: [
              ['Longa: surfar, ler dez livros…', 'Eu seguro o lápis pra riscar!'],
              ['Uma linha só: não fazer nada', 'A melhor lista do mundo.'],
              ['Comer melancia, principalmente', 'Eu cuido das sementes.'],
            ],
          },
          nl: {
            t: 'Je zomerwensenlijstje…',
            o: 'Vraag wat er op het zomerwensenlijstje van die persoon staat.',
            a: [
              ['Lang: surfen, tien boeken lezen…', 'Ik hou het potlood vast om af te vinken!'],
              ['Eén regel: niks doen', 'Het beste lijstje ter wereld.'],
              ['Vooral watermeloen eten', 'Ik zorg voor de pitjes.'],
            ],
          },
        }),
        c('ete_feter_ete', 'foyer', [['🌅', -60, 'liberte'], ['🍢', 70, 'accueil']], {
          fr: {
            t: 'Pour fêter l’arrivée de l’été…',
            o: 'Demande-lui comment elle ou il fête le début de l’été.',
            a: [
              ['Je regarde le coucher de soleil, rien qu’à moi', 'Le ciel rose, rien que pour toi.'],
              ['J’invite tout le monde dans la cour', 'Je mets des guirlandes partout !'],
            ],
          },
          en: {
            t: 'To celebrate the start of summer…',
            o: 'Ask them how they celebrate the start of summer.',
            a: [
              ['I watch the sunset, just for me', 'A pink sky, just for you.'],
              ['I invite everyone to the courtyard', 'I’m hanging fairy lights everywhere!'],
            ],
          },
          es: {
            t: 'Para celebrar que llega el verano…',
            o: 'Pregúntale cómo celebra el comienzo del verano.',
            a: [
              ['Miro la puesta de sol, solo para mí', 'El cielo rosa, solo para ti.'],
              ['Invito a todo el mundo al patio', '¡Pongo guirnaldas por todas partes!'],
            ],
          },
          pt: {
            t: 'Para comemorar a chegada do verão…',
            o: 'Pergunte como essa pessoa comemora o começo do verão.',
            a: [
              ['Vejo o pôr do sol, só pra mim', 'O céu rosado, só pra você.'],
              ['Chamo todo mundo pro quintal', 'Vou pendurar luzinhas por todo lado!'],
            ],
          },
          nl: {
            t: 'Om het begin van de zomer te vieren…',
            o: 'Vraag hoe die persoon het begin van de zomer viert.',
            a: [
              ['Ik kijk naar de zonsondergang, voor mij alleen', 'Een roze lucht, alleen voor jou.'],
              ['Ik nodig iedereen uit op de binnenplaats', 'Ik hang overal lichtslingers op!'],
            ],
          },
        }),
        s('ete_agenda', 'rythme', ['🧘', -100, 'calme'], ['🎉', 100, 'fete'], {
          fr: { t: 'L’été, ton agenda…', o: 'Demande-lui à quoi ressemble son agenda d’été.', a: [['Se vide, enfin le calme', 'Des pages blanches, quel luxe.'], ['Se remplit de sorties', 'Il ne reste plus une case libre !']], m: 'Équilibré : une sortie, une pause.' },
          en: { t: 'In summer, your diary…', o: 'Ask them what their summer diary looks like.', a: [['Empties out, finally calm', 'Blank pages, what luxury.'], ['Fills up with outings', 'Not a single free slot left!']], m: 'Balanced: one outing, one break.' },
          es: { t: 'En verano, tu agenda…', o: 'Pregúntale cómo es su agenda de verano.', a: [['Se vacía, por fin calma', 'Páginas en blanco, qué lujo.'], ['Se llena de planes', '¡No queda ni un hueco libre!']], m: 'Equilibrada: un plan, una pausa.' },
          pt: { t: 'No verão, sua agenda…', o: 'Pergunte como é a agenda de verão dessa pessoa.', a: [['Esvazia, finalmente calma', 'Páginas em branco, que luxo.'], ['Enche de programas', 'Não sobra um espacinho livre!']], m: 'Equilibrada: um programa, uma pausa.' },
          nl: { t: 'In de zomer is je agenda…', o: 'Vraag hoe de zomeragenda van die persoon eruitziet.', a: [['Leeg, eindelijk rust', 'Lege bladzijden, wat een luxe.'], ['Vol met uitjes', 'Geen vakje meer vrij!']], m: 'In balans: een uitje, een pauze.' },
        }),
      ],
    },
    {
      id: 'ete_2',
      title: { fr: 'La chaleur', en: 'The heat', es: 'El calor', pt: 'O calor', nl: 'De hitte' },
      questions: [
        c('ete_canicule', 'rythme', [['🪭', -70, 'cocooning'], ['🏊', 60, 'monde'], ['🌳', -10, 'nature']], {
          fr: {
            t: 'Il fait 34 °C dehors.',
            o: 'Demande-lui comment elle ou il survit aux grosses chaleurs.',
            a: [
              ['Volets fermés, je ne bouge plus', 'Mode tortue à l’ombre activé.'],
              ['Direction la piscine bondée', 'Plouf ! Je garde ta serviette.'],
              ['Un coin d’ombre au parc', 'Le meilleur arbre, je te le réserve.'],
            ],
          },
          en: {
            t: 'It’s 34 °C outside.',
            o: 'Ask them how they get through a heatwave.',
            a: [
              ['Shutters closed, I don’t move', 'Shady tortoise mode on.'],
              ['Off to the packed swimming pool', 'Splash! I’ll mind your towel.'],
              ['A shady spot in the park', 'I’ll save you the best tree.'],
            ],
          },
          es: {
            t: 'Hace 34 °C fuera.',
            o: 'Pregúntale cómo sobrevive a los días de mucho calor.',
            a: [
              ['Persianas bajadas, no me muevo', 'Modo tortuga a la sombra activado.'],
              ['A la piscina llena de gente', '¡Chof! Te guardo la toalla.'],
              ['Un rincón de sombra en el parque', 'Te reservo el mejor árbol.'],
            ],
          },
          pt: {
            t: 'Está fazendo 34 °C lá fora.',
            o: 'Pergunte como essa pessoa sobrevive aos dias de muito calor.',
            a: [
              ['Janelas fechadas, não me mexo', 'Modo tartaruga na sombra ativado.'],
              ['Rumo à piscina lotada', 'Tchibum! Eu cuido da sua toalha.'],
              ['Uma sombra no parque', 'Te guardo a melhor árvore.'],
            ],
          },
          nl: {
            t: 'Het is buiten 34 °C.',
            o: 'Vraag hoe die persoon een hittegolf doorkomt.',
            a: [
              ['Luiken dicht, ik beweeg niet meer', 'Schildpadmodus in de schaduw aan.'],
              ['Naar het overvolle zwembad', 'Plons! Ik let op je handdoek.'],
              ['Een schaduwplekje in het park', 'Ik hou de beste boom voor je vrij.'],
            ],
          },
        }),
        s('ete_heure_sortie', 'cap', ['🎲', -100, 'spontane'], ['⏰', 100, 'plan'], {
          fr: { t: 'Quand il fait très chaud, tes sorties…', o: 'Demande-lui à quelle heure elle ou il sort quand il fait chaud.', a: [['Au feeling, quand l’envie me prend', 'Le soleil n’a qu’à suivre.'], ['Calées tôt le matin ou tard le soir', 'Stratégie anti-chaleur, bravo.']], m: 'Je regarde le ciel, puis je décide.' },
          en: { t: 'When it’s very hot, your outings…', o: 'Ask them what time they go out when it’s hot.', a: [['Whenever I feel like it', 'The sun will just have to keep up.'], ['Early morning or late evening', 'Anti-heat strategy, well done.']], m: 'I check the sky, then decide.' },
          es: { t: 'Cuando hace mucho calor, tus salidas…', o: 'Pregúntale a qué hora sale cuando hace calor.', a: [['Según me apetezca', 'Que el sol se adapte.'], ['Temprano por la mañana o tarde por la noche', 'Estrategia anticalor, bravo.']], m: 'Miro el cielo y decido.' },
          pt: { t: 'Quando está muito quente, suas saídas…', o: 'Pergunte a que horas essa pessoa sai quando está calor.', a: [['Quando der vontade', 'O sol que se vire.'], ['Bem cedo ou bem tarde', 'Estratégia anticalor, parabéns.']], m: 'Olho o céu e decido.' },
          nl: { t: 'Als het heel warm is, gaan je uitjes…', o: 'Vraag hoe laat die persoon naar buiten gaat als het warm is.', a: [['Op gevoel, wanneer ik zin heb', 'De zon past zich maar aan.'], ['Vroeg in de ochtend of laat op de avond', 'Anti-hittestrategie, knap.']], m: 'Ik kijk naar de lucht en beslis dan.' },
        }),
        c('ete_rafraichir', 'ancrage', [['🍋', -60, 'racines'], ['🧊', 70, 'curiosite']], {
          fr: {
            t: 'Pour te rafraîchir…',
            o: 'Demande-lui sa boisson fraîche préférée de l’été.',
            a: [
              ['La citronnade maison de toujours', 'Le goût de tous les étés.'],
              ['Une boisson glacée jamais goûtée', 'Couleur fluo ? Je goûte avec toi !'],
            ],
          },
          en: {
            t: 'To cool down…',
            o: 'Ask them about their favourite cold summer drink.',
            a: [
              ['The same homemade lemonade as ever', 'The taste of every summer.'],
              ['An iced drink I’ve never tried', 'Neon colour? I’ll try it with you!'],
            ],
          },
          es: {
            t: 'Para refrescarte…',
            o: 'Pregúntale cuál es su bebida fresca favorita del verano.',
            a: [
              ['La limonada casera de siempre', 'El sabor de todos los veranos.'],
              ['Una bebida helada que nunca probé', '¿Color fosforito? ¡La pruebo contigo!'],
            ],
          },
          pt: {
            t: 'Para se refrescar…',
            o: 'Pergunte qual é a bebida gelada favorita dessa pessoa no verão.',
            a: [
              ['A limonada caseira de sempre', 'O sabor de todos os verões.'],
              ['Uma bebida gelada que nunca provei', 'Cor neon? Provo com você!'],
            ],
          },
          nl: {
            t: 'Om af te koelen…',
            o: 'Vraag naar het favoriete koude zomerdrankje van die persoon.',
            a: [
              ['De zelfgemaakte limonade van altijd', 'De smaak van elke zomer.'],
              ['Een ijsdrankje dat ik nooit proefde', 'Neonkleur? Ik proef met je mee!'],
            ],
          },
        }),
        c('ete_ventilateur', 'foyer', [['🤝', 70, 'accueil'], ['🌀', -60, 'liberte'], ['😄', 20, 'humour']], {
          fr: {
            t: 'Un seul ventilateur pour toute la pièce…',
            o: 'Demande-lui comment elle ou il partage le frais en été.',
            a: [
              ['On se serre tous devant', 'Tous ensemble face au vent !'],
              ['Je file dans un coin frais, rien qu’à moi', 'Ton coin frais secret, bien joué.'],
              ['Il tourne à tour de rôle', 'Chacun son tour, quelle justice.'],
            ],
          },
          en: {
            t: 'Just one fan for the whole room…',
            o: 'Ask them how they share the cool air in summer.',
            a: [
              ['We all squeeze in front of it', 'All together, facing the wind!'],
              ['I slip off to a cool corner of my own', 'Your secret cool spot, well played.'],
              ['It takes turns pointing at each of us', 'Everyone gets a turn, so fair.'],
            ],
          },
          es: {
            t: 'Un solo ventilador para toda la sala…',
            o: 'Pregúntale cómo reparte el fresquito en verano.',
            a: [
              ['Nos apretujamos todos delante', '¡Todos juntos frente al viento!'],
              ['Me voy a un rincón fresco para mí', 'Tu rincón fresco secreto, bien jugado.'],
              ['Va girando por turnos', 'Cada uno su turno, qué justo.'],
            ],
          },
          pt: {
            t: 'Um único ventilador para a sala toda…',
            o: 'Pergunte como essa pessoa divide o frescor no verão.',
            a: [
              ['A gente se aperta na frente dele', 'Todo mundo junto contra o vento!'],
              ['Vou pra um canto fresco só meu', 'Seu canto fresco secreto, boa jogada.'],
              ['Ele gira, um de cada vez', 'Cada um na sua vez, que justo.'],
            ],
          },
          nl: {
            t: 'Maar één ventilator voor de hele kamer…',
            o: 'Vraag hoe die persoon in de zomer de koelte deelt.',
            a: [
              ['We kruipen allemaal ervoor', 'Allemaal samen in de wind!'],
              ['Ik zoek een koel hoekje voor mezelf', 'Je geheime koele plekje, goed gedaan.'],
              ['Hij draait om de beurt naar iedereen', 'Ieder z’n beurt, zo eerlijk.'],
            ],
          },
        }),
        c('ete_trop_chaud', 'elan', [['💪', 70, 'projets'], ['😎', -70, 'temps_libre']], {
          fr: {
            t: 'Il fait trop chaud pour réfléchir.',
            o: 'Demande-lui ce qu’elle ou il fait des journées trop chaudes.',
            a: [
              ['Je me lève à 6 h pour avancer au frais', 'Lève-tôt de l’été, respect.'],
              ['Tout attendra septembre', 'Septembre est très patient.'],
            ],
          },
          en: {
            t: 'It’s too hot to think.',
            o: 'Ask them what they do on scorching days.',
            a: [
              ['I get up at 6 to work in the cool', 'Summer early bird, respect.'],
              ['Everything can wait till September', 'September is very patient.'],
            ],
          },
          es: {
            t: 'Hace demasiado calor para pensar.',
            o: 'Pregúntale qué hace los días de demasiado calor.',
            a: [
              ['Me levanto a las 6 para avanzar con fresco', 'Madrugar en verano, respeto.'],
              ['Todo esperará a septiembre', 'Septiembre tiene mucha paciencia.'],
            ],
          },
          pt: {
            t: 'Está quente demais para pensar.',
            o: 'Pergunte o que essa pessoa faz nos dias quentes demais.',
            a: [
              ['Acordo às 6h pra adiantar no fresquinho', 'Acordar cedo no verão, respeito.'],
              ['Tudo espera até setembro', 'Setembro é muito paciente.'],
            ],
          },
          nl: {
            t: 'Het is te warm om na te denken.',
            o: 'Vraag wat die persoon doet op bloedhete dagen.',
            a: [
              ['Ik sta om 6 uur op om in de koelte te werken', 'Vroege zomervogel, respect.'],
              ['Alles wacht tot september', 'September is heel geduldig.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_3',
      title: { fr: 'À la plage', en: 'At the beach', es: 'En la playa', pt: 'Na praia', nl: 'Aan het strand' },
      questions: [
        s('ete_plage_ideale', 'rythme', ['🏝️', -100, 'calme'], ['🏐', 100, 'monde'], {
          fr: { t: 'Ta plage idéale…', o: 'Demande-lui sa plage préférée.', a: [['Une crique déserte', 'Juste les vagues et nous.'], ['Une grande plage pleine de vie', 'Glaces, ballons, rires : j’adore !']], m: 'Un coin tranquille, près de l’animation.' },
          en: { t: 'Your ideal beach…', o: 'Ask them about their favourite beach.', a: [['A deserted cove', 'Just the waves and us.'], ['A big beach full of life', 'Ice creams, balls, laughter: love it!']], m: 'A quiet spot, near the buzz.' },
          es: { t: 'Tu playa ideal…', o: 'Pregúntale cuál es su playa favorita.', a: [['Una cala desierta', 'Solo las olas y nosotros.'], ['Una playa grande llena de vida', 'Helados, pelotas, risas: ¡me encanta!']], m: 'Un rincón tranquilo, cerca del ambiente.' },
          pt: { t: 'Sua praia ideal…', o: 'Pergunte qual é a praia favorita dessa pessoa.', a: [['Uma enseada deserta', 'Só as ondas e a gente.'], ['Uma praia grande cheia de vida', 'Sorvete, bola, risada: adoro!']], m: 'Um canto tranquilo, perto do agito.' },
          nl: { t: 'Je ideale strand…', o: 'Vraag naar het favoriete strand van die persoon.', a: [['Een verlaten baai', 'Alleen de golven en wij.'], ['Een groot strand vol leven', 'IJsjes, ballen, gelach: heerlijk!']], m: 'Een rustig plekje, vlak bij de drukte.' },
        }),
        c('ete_plage_installation', 'cap', [['⛱️', 70, 'ordre'], ['🩳', -70, 'spontane']], {
          fr: {
            t: 'Tu arrives à la plage.',
            o: 'Demande-lui ce qu’elle ou il emporte à la plage.',
            a: [
              ['Parasol, glacière, serviettes : tout est prévu', 'Un vrai camp de base, chapeau.'],
              ['Juste une serviette, et je plonge', 'Léger et libre, comme une mouette.'],
            ],
          },
          en: {
            t: 'You arrive at the beach.',
            o: 'Ask them what they take to the beach.',
            a: [
              ['Parasol, cool box, towels: all planned', 'A proper base camp, hats off.'],
              ['Just a towel, and I dive in', 'Light and free, like a seagull.'],
            ],
          },
          es: {
            t: 'Llegas a la playa.',
            o: 'Pregúntale qué se lleva a la playa.',
            a: [
              ['Sombrilla, nevera, toallas: todo previsto', 'Un campamento base en toda regla.'],
              ['Solo una toalla, y al agua', 'Sin peso y en libertad, como una gaviota.'],
            ],
          },
          pt: {
            t: 'Você chega à praia.',
            o: 'Pergunte o que essa pessoa leva para a praia.',
            a: [
              ['Guarda-sol, cooler, toalhas: tudo previsto', 'Um acampamento-base de verdade.'],
              ['Só uma toalha, e mergulho', 'Leve e livre, como uma gaivota.'],
            ],
          },
          nl: {
            t: 'Je komt aan op het strand.',
            o: 'Vraag wat die persoon meeneemt naar het strand.',
            a: [
              ['Parasol, koelbox, handdoeken: alles geregeld', 'Een echt basiskamp, petje af.'],
              ['Alleen een handdoek, en ik duik erin', 'Licht en vrij, als een meeuw.'],
            ],
          },
        }),
        c('ete_plage_activite', 'elan', [['🏄', 70, 'sport'], ['📖', -60, 'temps_libre'], ['🏰', 20, 'humour']], {
          fr: {
            t: 'À la plage, tu…',
            o: 'Demande-lui ce qu’elle ou il préfère faire à la plage.',
            a: [
              ['Enchaînes surf, paddle et beach-volley', 'Je fatigue rien qu’à regarder !'],
              ['Lis à l’ombre du parasol', 'Une page, une vague, une page.'],
              ['Construis un château de sable géant', 'Je creuse les douves !'],
            ],
          },
          en: {
            t: 'At the beach, you…',
            o: 'Ask them what they like doing most at the beach.',
            a: [
              ['Go surfing, paddleboarding and beach volleyball', 'I’m tired just watching!'],
              ['Read in the shade of the parasol', 'A page, a wave, a page.'],
              ['Build a giant sandcastle', 'I’ll dig the moat!'],
            ],
          },
          es: {
            t: 'En la playa, tú…',
            o: 'Pregúntale qué es lo que más le gusta hacer en la playa.',
            a: [
              ['Encadenas surf, paddle y vóley playa', '¡Me canso solo de mirar!'],
              ['Lees a la sombra de la sombrilla', 'Una página, una ola, una página.'],
              ['Construyes un castillo de arena gigante', '¡Yo cavo el foso!'],
            ],
          },
          pt: {
            t: 'Na praia, você…',
            o: 'Pergunte o que essa pessoa mais gosta de fazer na praia.',
            a: [
              ['Emenda surfe, stand-up e vôlei de praia', 'Canso só de olhar!'],
              ['Lê na sombra do guarda-sol', 'Uma página, uma onda, uma página.'],
              ['Constrói um castelo de areia gigante', 'Eu cavo o fosso!'],
            ],
          },
          nl: {
            t: 'Aan het strand…',
            o: 'Vraag wat die persoon het liefst doet aan het strand.',
            a: [
              ['Surf, sup en beachvolley je achter elkaar', 'Ik word al moe van het kijken!'],
              ['Lees je in de schaduw van de parasol', 'Een bladzijde, een golf, een bladzijde.'],
              ['Bouw je een reusachtig zandkasteel', 'Ik graaf de slotgracht!'],
            ],
          },
        }),
        c('ete_plage_habitude', 'ancrage', [['🐚', -70, 'racines'], ['🧭', 70, 'aventure']], {
          fr: {
            t: 'Ta plage, c’est…',
            o: 'Demande-lui s’il y a une plage où elle ou il revient toujours.',
            a: [
              ['La même depuis toujours', 'Elle connaît tes pas dans le sable.'],
              ['Une nouvelle à chaque sortie', 'Toutes les plages du monde t’attendent.'],
            ],
          },
          en: {
            t: 'Your beach is…',
            o: 'Ask them if there’s a beach they always go back to.',
            a: [
              ['The same one, forever', 'It knows your footprints in the sand.'],
              ['A new one every time', 'All the beaches in the world await.'],
            ],
          },
          es: {
            t: 'Tu playa es…',
            o: 'Pregúntale si hay una playa a la que siempre vuelve.',
            a: [
              ['La misma de toda la vida', 'Conoce tus huellas en la arena.'],
              ['Una nueva cada vez', 'Todas las playas del mundo te esperan.'],
            ],
          },
          pt: {
            t: 'Sua praia é…',
            o: 'Pergunte se existe uma praia aonde essa pessoa sempre volta.',
            a: [
              ['A mesma de sempre', 'Ela conhece seus passos na areia.'],
              ['Uma nova a cada vez', 'Todas as praias do mundo te esperam.'],
            ],
          },
          nl: {
            t: 'Jouw strand is…',
            o: 'Vraag of er een strand is waar die persoon altijd naar terugkeert.',
            a: [
              ['Altijd hetzelfde', 'Het kent je voetstappen in het zand.'],
              ['Elke keer een ander', 'Alle stranden van de wereld wachten.'],
            ],
          },
        }),
        c('ete_plage_qui', 'foyer', [['🎒', -60, 'liberte'], ['🚗', 70, 'accueil'], ['🤝', 20, null]], {
          fr: {
            t: 'Pour aller à la plage, tu pars…',
            o: 'Demande-lui avec qui elle ou il aime aller à la plage.',
            a: [
              ['En solo, avec mon livre', 'Toi, le sable et les mots.'],
              ['À toute une bande, voiture pleine', 'Je chante plus fort que la radio !'],
              ['Avec une ou deux personnes', 'Petite équipe, grand soleil.'],
            ],
          },
          en: {
            t: 'To go to the beach, you head off…',
            o: 'Ask them who they like going to the beach with.',
            a: [
              ['Solo, with my book', 'You, the sand and the words.'],
              ['With a whole gang, car packed', 'I’ll sing louder than the radio!'],
              ['With one or two people', 'Small crew, big sunshine.'],
            ],
          },
          es: {
            t: 'Para ir a la playa, vas…',
            o: 'Pregúntale con quién le gusta ir a la playa.',
            a: [
              ['A solas, con mi libro', 'Tú, la arena y las palabras.'],
              ['Con toda la pandilla, coche lleno', '¡Canto más alto que la radio!'],
              ['Con una o dos personas', 'Equipo pequeño, gran sol.'],
            ],
          },
          pt: {
            t: 'Para ir à praia, você vai…',
            o: 'Pergunte com quem essa pessoa gosta de ir à praia.',
            a: [
              ['Só eu, com meu livro', 'Você, a areia e as palavras.'],
              ['Com a turma toda, carro lotado', 'Vou cantar mais alto que o rádio!'],
              ['Com uma ou duas pessoas', 'Equipe pequena, sol grande.'],
            ],
          },
          nl: {
            t: 'Naar het strand ga je…',
            o: 'Vraag met wie die persoon graag naar het strand gaat.',
            a: [
              ['Alleen, met mijn boek', 'Jij, het zand en de woorden.'],
              ['Met een hele groep, auto vol', 'Ik zing harder dan de radio!'],
              ['Met een of twee mensen', 'Klein team, grote zon.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_4',
      title: { fr: 'Les longues soirées', en: 'Long evenings', es: 'Noches largas', pt: 'Noites longas', nl: 'Lange avonden' },
      questions: [
        c('ete_soiree_ideale', 'rythme', [['🌌', -70, 'calme'], ['💃', 80, 'fete'], ['🎲', 10, null]], {
          fr: {
            t: 'Une soirée d’été idéale…',
            o: 'Demande-lui sa plus belle soirée d’été.',
            a: [
              ['Sur l’herbe, à regarder les étoiles', 'Je compte les étoiles filantes avec toi.'],
              ['Un bal en plein air', 'Je danse sous les lampions !'],
              ['Des jeux sur la terrasse entre voisins', 'Je mélange les cartes.'],
            ],
          },
          en: {
            t: 'An ideal summer evening…',
            o: 'Ask them about the best summer evening they’ve had.',
            a: [
              ['On the grass, watching the stars', 'I’ll count shooting stars with you.'],
              ['An open-air dance', 'Dancing under the lanterns!'],
              ['Games on the terrace with neighbours', 'I’ll shuffle the cards.'],
            ],
          },
          es: {
            t: 'Una noche de verano ideal…',
            o: 'Pregúntale cuál ha sido su mejor noche de verano.',
            a: [
              ['En la hierba, mirando las estrellas', 'Cuento estrellas fugaces contigo.'],
              ['Una verbena al aire libre', '¡Bailo bajo los farolillos!'],
              ['Juegos en la terraza con los vecinos', 'Yo barajo las cartas.'],
            ],
          },
          pt: {
            t: 'Uma noite de verão ideal…',
            o: 'Pergunte qual foi a noite de verão mais bonita dessa pessoa.',
            a: [
              ['Na grama, olhando as estrelas', 'Conto estrelas cadentes com você.'],
              ['Um baile ao ar livre', 'Danço debaixo das lanternas!'],
              ['Jogos na varanda com os vizinhos', 'Eu embaralho as cartas.'],
            ],
          },
          nl: {
            t: 'Een ideale zomeravond…',
            o: 'Vraag naar de mooiste zomeravond van die persoon.',
            a: [
              ['In het gras, naar de sterren kijken', 'Ik tel vallende sterren met je.'],
              ['Een openluchtbal', 'Ik dans onder de lampionnen!'],
              ['Spelletjes op het terras met de buren', 'Ik schud de kaarten.'],
            ],
          },
        }),
        s('ete_coucher', 'cap', ['🌙', -100, 'spontane'], ['⏰', 100, 'ordre'], {
          fr: { t: 'L’été, l’heure du coucher…', o: 'Demande-lui si ses soirées d’été finissent tard.', a: [['Aucune idée, la soirée décide', 'La lune te dira quand.'], ['La même qu’en hiver', 'Ton horloge ne prend pas de vacances.']], m: 'Un peu plus tard, sans excès.' },
          en: { t: 'In summer, bedtime is…', o: 'Ask them if their summer evenings end late.', a: [['No idea, the evening decides', 'The moon will tell you when.'], ['The same as in winter', 'Your body clock never takes a holiday.']], m: 'A little later, nothing crazy.' },
          es: { t: 'En verano, la hora de acostarse…', o: 'Pregúntale si sus noches de verano acaban tarde.', a: [['Ni idea, la noche decide', 'La luna te dirá cuándo.'], ['La misma que en invierno', 'Tu reloj no se va de vacaciones.']], m: 'Un poco más tarde, sin pasarse.' },
          pt: { t: 'No verão, a hora de dormir…', o: 'Pergunte se as noites de verão dessa pessoa terminam tarde.', a: [['Não faço ideia, a noite decide', 'A lua vai te avisar.'], ['A mesma do inverno', 'Seu relógio não tira férias.']], m: 'Um pouco mais tarde, sem exagero.' },
          nl: { t: 'In de zomer is bedtijd…', o: 'Vraag of de zomeravonden van die persoon laat eindigen.', a: [['Geen idee, de avond beslist', 'De maan zegt het je wel.'], ['Dezelfde als in de winter', 'Je klok gaat nooit op vakantie.']], m: 'Iets later, zonder te overdrijven.' },
        }),
        c('ete_diner_dehors', 'foyer', [['🍽️', 70, 'accueil'], ['🥗', -60, 'liberte']], {
          fr: {
            t: 'Le dîner d’été se prend…',
            o: 'Demande-lui à quoi ressemble son dîner d’été parfait.',
            a: [
              ['Sur une grande table dehors, avec tout le monde', 'Je fais passer le plat !'],
              ['Au balcon, tranquille, rien que moi', 'Un dîner avec vue sur le ciel.'],
            ],
          },
          en: {
            t: 'Summer dinner is eaten…',
            o: 'Ask them what their perfect summer dinner looks like.',
            a: [
              ['At a big outdoor table, with everyone', 'I’ll pass the dish round!'],
              ['On the balcony, quietly, just me', 'Dinner with a sky view.'],
            ],
          },
          es: {
            t: 'La cena de verano se toma…',
            o: 'Pregúntale cómo sería su cena de verano perfecta.',
            a: [
              ['En una mesa grande fuera, con todos', '¡Paso la fuente!'],
              ['En el balcón, tranquilamente, a solas', 'Una cena con vistas al cielo.'],
            ],
          },
          pt: {
            t: 'O jantar de verão acontece…',
            o: 'Pergunte como seria o jantar de verão perfeito dessa pessoa.',
            a: [
              ['Numa mesa grande ao ar livre, com todo mundo', 'Eu passo a travessa!'],
              ['Na varanda, na calma, só eu', 'Um jantar com vista pro céu.'],
            ],
          },
          nl: {
            t: 'Het zomerse diner eet je…',
            o: 'Vraag hoe het perfecte zomerdiner van die persoon eruitziet.',
            a: [
              ['Aan een grote tafel buiten, met iedereen', 'Ik geef de schaal door!'],
              ['Op het balkon, rustig, alleen ik', 'Diner met uitzicht op de lucht.'],
            ],
          },
        }),
        c('ete_cinema_plein_air', 'ancrage', [['🎬', -60, 'racines'], ['🌐', 70, 'curiosite']], {
          fr: {
            t: 'Un cinéma en plein air ce soir. Tu espères…',
            o: 'Demande-lui le film qu’elle ou il rêve de voir sous les étoiles.',
            a: [
              ['Un film culte que je connais par cœur', 'Je récite les répliques avec toi.'],
              ['Un film d’un pays lointain, sous-titré', 'Un voyage sur une toile, j’adore.'],
            ],
          },
          en: {
            t: 'Open-air cinema tonight. You’re hoping for…',
            o: 'Ask them which film they’d love to see under the stars.',
            a: [
              ['A cult film I know by heart', 'I’ll recite the lines with you.'],
              ['A subtitled film from far away', 'A trip on a screen, love it.'],
            ],
          },
          es: {
            t: 'Cine al aire libre esta noche. Esperas…',
            o: 'Pregúntale qué película le encantaría ver bajo las estrellas.',
            a: [
              ['Una película de culto que me sé de memoria', 'Recito las frases contigo.'],
              ['Una película de un país lejano, subtitulada', 'Un viaje en una pantalla, me encanta.'],
            ],
          },
          pt: {
            t: 'Cinema ao ar livre hoje. Você espera…',
            o: 'Pergunte que filme essa pessoa adoraria ver sob as estrelas.',
            a: [
              ['Um filme cult que sei de cor', 'Recito as falas com você.'],
              ['Um filme de um país distante, legendado', 'Uma viagem numa tela, adoro.'],
            ],
          },
          nl: {
            t: 'Vanavond openluchtbioscoop. Je hoopt op…',
            o: 'Vraag welke film die persoon graag onder de sterren zou zien.',
            a: [
              ['Een cultfilm die ik uit mijn hoofd ken', 'Ik zeg de zinnen met je mee.'],
              ['Een ondertitelde film uit een ver land', 'Een reis op een doek, heerlijk.'],
            ],
          },
        }),
        s('ete_soiree_projets', 'elan', ['🌅', -100, 'temps_libre'], ['🛠️', 100, 'projets'], {
          fr: { t: 'Les longues soirées d’été, c’est le moment…', o: 'Demande-lui ce qu’elle ou il fait de ses longues soirées d’été.', a: [['De ne rien faire, enfin', 'Ne rien faire, un art d’été.'], ['D’avancer mes projets, il fait jour tard', 'La lumière travaille avec toi !']], m: 'Un peu de chaque.' },
          en: { t: 'Long summer evenings are the time…', o: 'Ask them what they do with long summer evenings.', a: [['To do nothing, at last', 'Doing nothing, a summer art.'], ['To push my projects, it’s light till late', 'The daylight works with you!']], m: 'A bit of each.' },
          es: { t: 'Las largas noches de verano son el momento…', o: 'Pregúntale qué hace con las largas tardes de verano.', a: [['De no hacer nada, por fin', 'No hacer nada, un arte veraniego.'], ['De avanzar mis proyectos, hay luz hasta tarde', '¡La luz trabaja contigo!']], m: 'Un poco de cada.' },
          pt: { t: 'As longas noites de verão são o momento…', o: 'Pergunte o que essa pessoa faz nas longas noites de verão.', a: [['De não fazer nada, finalmente', 'Não fazer nada, uma arte de verão.'], ['De adiantar meus projetos, escurece tarde', 'A luz trabalha com você!']], m: 'Um pouco de cada.' },
          nl: { t: 'Lange zomeravonden zijn het moment…', o: 'Vraag wat die persoon doet met lange zomeravonden.', a: [['Om niks te doen, eindelijk', 'Niksen, een zomerkunst.'], ['Om aan mijn projecten te werken, het blijft lang licht', 'Het licht werkt met je mee!']], m: 'Een beetje van allebei.' },
        }),
      ],
    },
    {
      id: 'ete_5',
      title: { fr: 'Les festivals', en: 'Festivals', es: 'Los festivales', pt: 'Os festivais', nl: 'Festivals' },
      questions: [
        c('ete_festival_choix', 'ancrage', [['🎸', -60, 'racines'], ['🪕', 70, 'curiosite'], ['🎪', 10, null]], {
          fr: {
            t: 'Un festival cet été ? Tu choisis…',
            o: 'Demande-lui son festival préféré.',
            a: [
              ['Celui où je vais chaque année', 'Ton rendez-vous fidèle de l’été.'],
              ['Un festival de musiques que je ne connais pas', 'De nouveaux sons pour tes oreilles !'],
              ['Le festival de rue du coin', 'La fête au pied de chez toi.'],
            ],
          },
          en: {
            t: 'A festival this summer? You pick…',
            o: 'Ask them about their favourite festival.',
            a: [
              ['The one I go to every year', 'Your faithful summer date.'],
              ['A festival of music I don’t know', 'New sounds for your ears!'],
              ['The local street festival', 'The party right on your doorstep.'],
            ],
          },
          es: {
            t: '¿Un festival este verano? Eliges…',
            o: 'Pregúntale cuál es su festival favorito.',
            a: [
              ['Al que voy cada año', 'Tu cita fiel del verano.'],
              ['Uno de músicas que no conozco', '¡Sonidos nuevos para tus oídos!'],
              ['El festival callejero del barrio', 'La fiesta en tu misma calle.'],
            ],
          },
          pt: {
            t: 'Um festival neste verão? Você escolhe…',
            o: 'Pergunte qual é o festival favorito dessa pessoa.',
            a: [
              ['Aquele aonde vou todo ano', 'Seu encontro fiel do verão.'],
              ['Um festival de músicas que não conheço', 'Sons novos pros seus ouvidos!'],
              ['O festival de rua do bairro', 'A festa na porta de casa.'],
            ],
          },
          nl: {
            t: 'Een festival deze zomer? Je kiest…',
            o: 'Vraag naar het favoriete festival van die persoon.',
            a: [
              ['Het festival waar ik elk jaar heen ga', 'Je trouwe zomerafspraak.'],
              ['Een festival met muziek die ik niet ken', 'Nieuwe klanken voor je oren!'],
              ['Het straatfestival in de buurt', 'Het feest voor je deur.'],
            ],
          },
        }),
        s('ete_festival_place', 'rythme', ['🌳', -100, 'calme'], ['🤘', 100, 'fete'], {
          fr: { t: 'Au concert en plein air, tu te places…', o: 'Demande-lui le meilleur concert qu’elle ou il ait vu en plein air.', a: [['Au fond, sur l’herbe', 'Le son arrive en douceur jusqu’à nous.'], ['Tout devant, près de la scène', 'Je saute avec toi !']], m: 'Au milieu, avec de la place pour danser.' },
          en: { t: 'At an open-air gig, you stand…', o: 'Ask them about the best open-air gig they’ve seen.', a: [['At the back, on the grass', 'The sound drifts gently to us.'], ['Right at the front, by the stage', 'I’m jumping with you!']], m: 'In the middle, with room to dance.' },
          es: { t: 'En un concierto al aire libre, te pones…', o: 'Pregúntale cuál es el mejor concierto al aire libre que ha visto.', a: [['Al fondo, en la hierba', 'El sonido nos llega suavecito.'], ['Delante del todo, junto al escenario', '¡Salto contigo!']], m: 'En medio, con sitio para bailar.' },
          pt: { t: 'No show ao ar livre, você fica…', o: 'Pergunte qual foi o melhor show ao ar livre que essa pessoa já viu.', a: [['Lá no fundo, na grama', 'O som chega de mansinho.'], ['Bem na frente, perto do palco', 'Eu pulo com você!']], m: 'No meio, com espaço pra dançar.' },
          nl: { t: 'Bij een openluchtconcert sta je…', o: 'Vraag naar het beste openluchtconcert dat die persoon zag.', a: [['Achteraan, op het gras', 'Het geluid komt zacht naar ons toe.'], ['Helemaal vooraan, bij het podium', 'Ik spring met je mee!']], m: 'In het midden, met ruimte om te dansen.' },
        }),
        c('ete_festival_programme', 'cap', [['📋', 80, 'plan'], ['🎲', -70, 'spontane']], {
          fr: {
            t: 'Un festival de trois jours.',
            o: 'Demande-lui comment elle ou il prépare un festival.',
            a: [
              ['Programme surligné, horaires notés', 'Ton programme est une œuvre d’art.'],
              ['Je me laisse guider par le son', 'Tes oreilles, ta boussole.'],
            ],
          },
          en: {
            t: 'A three-day festival.',
            o: 'Ask them how they prepare for a festival.',
            a: [
              ['Line-up highlighted, times noted', 'Your schedule is a work of art.'],
              ['I let the sound guide me', 'Your ears, your compass.'],
            ],
          },
          es: {
            t: 'Un festival de tres días.',
            o: 'Pregúntale cómo prepara un festival.',
            a: [
              ['Cartel subrayado, horarios apuntados', 'Tu programa es una obra de arte.'],
              ['Me dejo guiar por la música', 'Tus oídos, tu brújula.'],
            ],
          },
          pt: {
            t: 'Um festival de três dias.',
            o: 'Pergunte como essa pessoa se prepara para um festival.',
            a: [
              ['Programação marcada, horários anotados', 'Sua programação é uma obra de arte.'],
              ['Deixo o som me guiar', 'Seus ouvidos, sua bússola.'],
            ],
          },
          nl: {
            t: 'Een festival van drie dagen.',
            o: 'Vraag hoe die persoon zich op een festival voorbereidt.',
            a: [
              ['Programma gemarkeerd, tijden genoteerd', 'Je schema is een kunstwerk.'],
              ['Ik laat me leiden door de muziek', 'Je oren, je kompas.'],
            ],
          },
        }),
        c('ete_festival_bande', 'foyer', [['👥', 80, 'accueil'], ['🎧', -70, 'liberte'], ['🤝', 20, null]], {
          fr: {
            t: 'Tu vas au festival…',
            o: 'Demande-lui avec qui elle ou il va en festival.',
            a: [
              ['À douze, campement commun', 'Un village de tentes, j’adore !'],
              ['En solo, je vais où je veux', 'Libre d’une scène à l’autre.'],
              ['À deux ou trois', 'Petit groupe, grands souvenirs.'],
            ],
          },
          en: {
            t: 'You go to the festival…',
            o: 'Ask them who they go to festivals with.',
            a: [
              ['Twelve of us, shared camp', 'A tent village, love it!'],
              ['Solo, I go wherever I like', 'Free from one stage to the next.'],
              ['Two or three of us', 'Small group, big memories.'],
            ],
          },
          es: {
            t: 'Vas al festival…',
            o: 'Pregúntale con quién va a los festivales.',
            a: [
              ['Doce, campamento común', '¡Un pueblo de tiendas, me encanta!'],
              ['A solas, voy donde quiero', 'Libre de un escenario a otro.'],
              ['Dos o tres', 'Grupo pequeño, grandes recuerdos.'],
            ],
          },
          pt: {
            t: 'Você vai ao festival…',
            o: 'Pergunte com quem essa pessoa vai a festivais.',
            a: [
              ['Em doze, acampamento coletivo', 'Uma vila de barracas, adoro!'],
              ['Só eu, vou aonde quiser', 'Livre de um palco pro outro.'],
              ['Em dois ou três', 'Grupo pequeno, grandes lembranças.'],
            ],
          },
          nl: {
            t: 'Je gaat naar het festival…',
            o: 'Vraag met wie die persoon naar festivals gaat.',
            a: [
              ['Met z’n twaalven, gedeeld kampement', 'Een tentendorp, heerlijk!'],
              ['Alleen, ik ga waar ik wil', 'Vrij van het ene podium naar het andere.'],
              ['Met z’n tweeën of drieën', 'Klein groepje, grote herinneringen.'],
            ],
          },
        }),
        c('ete_benevole', 'elan', [['🙋', 70, 'projets'], ['🎶', -60, 'temps_libre']], {
          fr: {
            t: 'Le festival cherche des bénévoles.',
            o: 'Demande-lui si elle ou il a déjà donné un coup de main à un événement.',
            a: [
              ['Je m’inscris, j’adore aider', 'Gilet fluo et grand sourire !'],
              ['Je préfère profiter des concerts', 'Profiter, c’est aussi soutenir.'],
            ],
          },
          en: {
            t: 'The festival is looking for volunteers.',
            o: 'Ask them if they’ve ever helped out at an event.',
            a: [
              ['I sign up, I love helping', 'Hi-vis vest and a big smile!'],
              ['I’d rather enjoy the gigs', 'Enjoying is supporting too.'],
            ],
          },
          es: {
            t: 'El festival busca voluntarios.',
            o: 'Pregúntale si alguna vez ha echado una mano en un evento.',
            a: [
              ['Me apunto, me encanta ayudar', '¡Chaleco fosforito y gran sonrisa!'],
              ['Prefiero disfrutar de los conciertos', 'Disfrutar también es apoyar.'],
            ],
          },
          pt: {
            t: 'O festival procura voluntários.',
            o: 'Pergunte se essa pessoa já ajudou num evento.',
            a: [
              ['Me inscrevo, adoro ajudar', 'Colete neon e sorrisão!'],
              ['Prefiro curtir os shows', 'Curtir também é apoiar.'],
            ],
          },
          nl: {
            t: 'Het festival zoekt vrijwilligers.',
            o: 'Vraag of die persoon ooit heeft meegeholpen bij een evenement.',
            a: [
              ['Ik meld me aan, ik help graag', 'Fluohesje en een grote glimlach!'],
              ['Ik geniet liever van de concerten', 'Genieten is ook steunen.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_6',
      title: { fr: 'Les vacances d’été', en: 'Summer holidays', es: 'Las vacaciones', pt: 'As férias de verão', nl: 'Zomervakantie' },
      questions: [
        s('ete_vacances_reserver', 'cap', ['🎲', -100, 'spontane'], ['📆', 100, 'plan'], {
          fr: { t: 'Tes vacances d’été, tu les réserves…', o: 'Demande-lui quand elle ou il prépare ses vacances d’été.', a: [['La veille, selon la météo', 'Le soleil choisit pour toi.'], ['En janvier', 'L’été est prêt avant l’hiver !']], m: 'Au printemps, tranquillement.' },
          en: { t: 'You book your summer holidays…', o: 'Ask them when they sort out their summer holidays.', a: [['The day before, depending on the weather', 'The sun picks for you.'], ['In January', 'Summer’s ready before winter ends!']], m: 'In spring, calmly.' },
          es: { t: 'Tus vacaciones de verano las reservas…', o: 'Pregúntale cuándo prepara sus vacaciones de verano.', a: [['La víspera, según el tiempo', 'El sol elige por ti.'], ['En enero', '¡El verano listo antes que el invierno!']], m: 'En primavera, sin prisa.' },
          pt: { t: 'Suas férias de verão, você reserva…', o: 'Pergunte quando essa pessoa organiza as férias de verão.', a: [['Na véspera, conforme o tempo', 'O sol escolhe por você.'], ['Em janeiro', 'O verão pronto antes do inverno!']], m: 'Na primavera, com calma.' },
          nl: { t: 'Je zomervakantie boek je…', o: 'Vraag wanneer die persoon de zomervakantie regelt.', a: [['De dag ervoor, afhankelijk van het weer', 'De zon kiest voor jou.'], ['In januari', 'De zomer staat klaar voor de winter voorbij is!']], m: 'In de lente, rustig aan.' },
        }),
        c('ete_vacances_lieu', 'ancrage', [['🏡', -70, 'racines'], ['🗺️', 70, 'voyage'], ['🏠', -20, null]], {
          fr: {
            t: 'Cet été, tu pars…',
            o: 'Demande-lui où elle ou il passe ses étés.',
            a: [
              ['Dans la maison où je vais depuis toujours', 'Les volets bleus t’attendent.'],
              ['Dans une région que je ne connais pas', 'Une page blanche à remplir !'],
              ['Nulle part : je redécouvre ma ville', 'Touriste chez toi, quelle idée.'],
            ],
          },
          en: {
            t: 'This summer, you’re going…',
            o: 'Ask them where they spend their summers.',
            a: [
              ['To the house I’ve always gone to', 'The blue shutters await you.'],
              ['To a region I don’t know', 'A blank page to fill!'],
              ['Nowhere: I rediscover my town', 'A tourist at home, what an idea.'],
            ],
          },
          es: {
            t: 'Este verano, te vas…',
            o: 'Pregúntale dónde pasa sus veranos.',
            a: [
              ['A la casa a la que voy desde siempre', 'Las contraventanas azules te esperan.'],
              ['A una región que no conozco', '¡Una página en blanco por llenar!'],
              ['A ningún sitio: redescubro mi ciudad', 'Turista en casa, qué idea.'],
            ],
          },
          pt: {
            t: 'Neste verão, você vai…',
            o: 'Pergunte onde essa pessoa passa os verões.',
            a: [
              ['Pra casa aonde vou desde sempre', 'As janelas azuis te esperam.'],
              ['Pra uma região que não conheço', 'Uma página em branco pra preencher!'],
              ['Pra lugar nenhum: redescubro minha cidade', 'Turista em casa, que ideia.'],
            ],
          },
          nl: {
            t: 'Deze zomer ga je…',
            o: 'Vraag waar die persoon de zomers doorbrengt.',
            a: [
              ['Naar het huis waar ik altijd al heen ga', 'De blauwe luiken wachten op je.'],
              ['Naar een streek die ik niet ken', 'Een lege bladzijde om te vullen!'],
              ['Nergens: ik herontdek mijn stad', 'Toerist in je eigen stad, leuk idee.'],
            ],
          },
        }),
        c('ete_vacances_qui', 'foyer', [['🏘️', 80, 'famille'], ['🚲', -70, 'liberte'], ['🤝', 20, null]], {
          fr: {
            t: 'Tes vacances idéales…',
            o: 'Demande-lui avec qui elle ou il aime passer l’été.',
            a: [
              ['Une grande maison avec les proches', 'Une tablée de vingt, j’adore.'],
              ['En solo, à vélo', 'Le vent dans le dos, la route devant.'],
              ['Avec un petit groupe d’amis', 'La bonne taille pour les fous rires.'],
            ],
          },
          en: {
            t: 'Your ideal holiday…',
            o: 'Ask them who they like spending summer with.',
            a: [
              ['A big house with loved ones', 'A table for twenty, love it.'],
              ['Solo, by bike', 'Wind at your back, road ahead.'],
              ['With a small group of friends', 'The right size for giggles.'],
            ],
          },
          es: {
            t: 'Tus vacaciones ideales…',
            o: 'Pregúntale con quién le gusta pasar el verano.',
            a: [
              ['Una casa grande con los tuyos', 'Una mesa de veinte, me encanta.'],
              ['A solas, en bici', 'El viento a la espalda, la carretera delante.'],
              ['Con un grupito de amigos', 'El tamaño justo para las risas.'],
            ],
          },
          pt: {
            t: 'Suas férias ideais…',
            o: 'Pergunte com quem essa pessoa gosta de passar o verão.',
            a: [
              ['Uma casa grande com a família e os amigos', 'Uma mesa pra vinte, adoro.'],
              ['Só eu, de bicicleta', 'Vento nas costas, estrada à frente.'],
              ['Com um grupinho de amigos', 'O tamanho certo pras risadas.'],
            ],
          },
          nl: {
            t: 'Je ideale vakantie…',
            o: 'Vraag met wie die persoon graag de zomer doorbrengt.',
            a: [
              ['Een groot huis met dierbaren', 'Een tafel voor twintig, heerlijk.'],
              ['Alleen, op de fiets', 'Wind in de rug, de weg voor je.'],
              ['Met een klein groepje vrienden', 'De juiste maat voor slappe lach.'],
            ],
          },
        }),
        c('ete_vacances_apprendre', 'elan', [['📚', 60, 'projets'], ['🏖️', -70, 'temps_libre']], {
          fr: {
            t: 'Pendant les vacances, tu…',
            o: 'Demande-lui ce qu’elle ou il a appris pendant un été.',
            a: [
              ['Apprends un truc nouveau chaque jour', 'Un été qui rend plus grand.'],
              ['Ne fais strictement rien', 'Champion ou championne du transat.'],
            ],
          },
          en: {
            t: 'During the holidays, you…',
            o: 'Ask them about something they learned one summer.',
            a: [
              ['Learn something new every day', 'A summer that helps you grow.'],
              ['Do absolutely nothing', 'Deckchair champion.'],
            ],
          },
          es: {
            t: 'Durante las vacaciones, tú…',
            o: 'Pregúntale qué aprendió durante algún verano.',
            a: [
              ['Aprendo algo nuevo cada día', 'Un verano que te hace crecer.'],
              ['No hago absolutamente nada', 'Récord mundial de tumbona.'],
            ],
          },
          pt: {
            t: 'Durante as férias, você…',
            o: 'Pergunte o que essa pessoa aprendeu em algum verão.',
            a: [
              ['Aprendo algo novo todo dia', 'Um verão que faz crescer.'],
              ['Não faço absolutamente nada', 'Recorde mundial de espreguiçadeira.'],
            ],
          },
          nl: {
            t: 'Tijdens de vakantie…',
            o: 'Vraag wat die persoon ooit in een zomer heeft geleerd.',
            a: [
              ['Leer ik elke dag iets nieuws', 'Een zomer waar je van groeit.'],
              ['Doe ik helemaal niks', 'Kampioen ligstoelhangen.'],
            ],
          },
        }),
        c('ete_journee_type', 'rythme', [['🎢', 80, 'monde'], ['🛏️', -80, 'cocooning'], ['🚶', 10, 'dehors']], {
          fr: {
            t: 'Une journée de vacances type…',
            o: 'Demande-lui à quoi ressemble sa journée de vacances parfaite.',
            a: [
              ['Parc, marché, concert : on remplit tout', 'Je cours derrière toi !'],
              ['Sieste, livre, sieste', 'Le programme de rêve.'],
              ['Une balade, un repas, une baignade', 'Simple et parfait.'],
            ],
          },
          en: {
            t: 'A typical holiday day…',
            o: 'Ask them what their perfect holiday day looks like.',
            a: [
              ['Park, market, gig: we pack it all in', 'I’m running after you!'],
              ['Nap, book, nap', 'The dream schedule.'],
              ['A walk, a meal, a swim', 'Simple and perfect.'],
            ],
          },
          es: {
            t: 'Un día de vacaciones típico…',
            o: 'Pregúntale cómo es su día de vacaciones perfecto.',
            a: [
              ['Parque, mercado, concierto: lo llenamos todo', '¡Voy corriendo detrás de ti!'],
              ['Siesta, libro, siesta', 'El plan soñado.'],
              ['Un paseo, una comida, un baño', 'Sencillo y perfecto.'],
            ],
          },
          pt: {
            t: 'Um dia típico de férias…',
            o: 'Pergunte como é o dia de férias perfeito dessa pessoa.',
            a: [
              ['Parque, feira, show: a gente enche tudo', 'Vou correndo atrás de você!'],
              ['Cochilo, livro, cochilo', 'A programação dos sonhos.'],
              ['Um passeio, uma refeição, um mergulho', 'Simples e perfeito.'],
            ],
          },
          nl: {
            t: 'Een typische vakantiedag…',
            o: 'Vraag hoe de perfecte vakantiedag van die persoon eruitziet.',
            a: [
              ['Park, markt, concert: alles erin', 'Ik ren achter je aan!'],
              ['Dutje, boek, dutje', 'Het droomprogramma.'],
              ['Een wandeling, een maaltijd, een duik', 'Simpel en perfect.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_7',
      title: { fr: 'Pique-niques et grillades', en: 'Picnics and barbecues', es: 'Pícnics y barbacoas', pt: 'Piqueniques e churrascos', nl: 'Picknicks en barbecues' },
      questions: [
        c('ete_piquenique_prep', 'cap', [['🧺', 80, 'ordre'], ['🥖', -70, 'spontane']], {
          fr: {
            t: 'Un pique-nique, ça se prépare…',
            o: 'Demande-lui ce qu’il y a toujours dans son panier de pique-nique.',
            a: [
              ['Panier rempli la veille, liste cochée', 'Même les serviettes sont pliées !'],
              ['On achète tout en chemin', 'Le pique-nique surprise, mon préféré.'],
            ],
          },
          en: {
            t: 'A picnic gets prepared…',
            o: 'Ask them what’s always in their picnic basket.',
            a: [
              ['Basket packed the night before, list ticked', 'Even the napkins are folded!'],
              ['We buy everything on the way', 'The surprise picnic, my favourite.'],
            ],
          },
          es: {
            t: 'Un pícnic se prepara…',
            o: 'Pregúntale qué hay siempre en su cesta de pícnic.',
            a: [
              ['Cesta llena la víspera, lista marcada', '¡Hasta las servilletas dobladas!'],
              ['Lo compramos todo por el camino', 'El pícnic sorpresa, mi favorito.'],
            ],
          },
          pt: {
            t: 'Um piquenique se prepara…',
            o: 'Pergunte o que sempre tem na cesta de piquenique dessa pessoa.',
            a: [
              ['Cesta pronta na véspera, lista ticada', 'Até os guardanapos dobrados!'],
              ['A gente compra tudo no caminho', 'O piquenique surpresa, meu favorito.'],
            ],
          },
          nl: {
            t: 'Een picknick bereid je voor…',
            o: 'Vraag wat er altijd in de picknickmand van die persoon zit.',
            a: [
              ['Mand de avond ervoor gevuld, lijstje afgevinkt', 'Zelfs de servetjes zijn gevouwen!'],
              ['We kopen alles onderweg', 'De verrassingspicknick, mijn favoriet.'],
            ],
          },
        }),
        s('ete_piquenique_monde', 'foyer', ['🌾', -100, 'liberte'], ['🧺', 100, 'accueil'], {
          fr: { t: 'Ton pique-nique idéal…', o: 'Demande-lui son plus beau souvenir de pique-nique.', a: [['Moi, une couverture, un livre', 'Ta bulle sur l’herbe.'], ['Trente personnes, chacun apporte un plat', 'Un buffet géant sur l’herbe !']], m: 'Quelques amis, une nappe à carreaux.' },
          en: { t: 'Your ideal picnic…', o: 'Ask them about their best picnic memory.', a: [['Me, a blanket, a book', 'Your bubble on the grass.'], ['Thirty people, everyone brings a dish', 'A giant buffet on the grass!']], m: 'A few friends, a checked tablecloth.' },
          es: { t: 'Tu pícnic ideal…', o: 'Pregúntale cuál es su mejor recuerdo de un pícnic.', a: [['Yo, una manta, un libro', 'Tu burbuja sobre la hierba.'], ['Treinta personas, cada una trae un plato', '¡Un bufé gigante en la hierba!']], m: 'Unos pocos amigos, un mantel de cuadros.' },
          pt: { t: 'Seu piquenique ideal…', o: 'Pergunte qual é a melhor lembrança de piquenique dessa pessoa.', a: [['Eu, uma manta, um livro', 'Sua bolha na grama.'], ['Trinta pessoas, cada uma traz um prato', 'Um bufê gigante na grama!']], m: 'Alguns amigos, uma toalha xadrez.' },
          nl: { t: 'Je ideale picknick…', o: 'Vraag naar de mooiste picknickherinnering van die persoon.', a: [['Ik, een kleed, een boek', 'Jouw bubbel op het gras.'], ['Dertig mensen, iedereen neemt iets mee', 'Een reuzenbuffet op het gras!']], m: 'Een paar vrienden, een geruit kleed.' },
        }),
        c('ete_grillades', 'ancrage', [['🌽', -60, 'racines'], ['🥭', 70, 'curiosite'], ['🍉', -10, null]], {
          fr: {
            t: 'Au barbecue, tu apportes…',
            o: 'Demande-lui sa spécialité de barbecue.',
            a: [
              ['Les classiques : maïs et brochettes', 'Les classiques, ça rassemble.'],
              ['Une marinade testée pour l’occasion', 'Mystère et épices, je goûte !'],
              ['La pastèque, toujours', 'Fraîche et ronde, la star.'],
            ],
          },
          en: {
            t: 'To the barbecue, you bring…',
            o: 'Ask them what their barbecue speciality is.',
            a: [
              ['The classics: corn and skewers', 'Classics bring people together.'],
              ['A marinade I tried just for this', 'Mystery and spice, I’m tasting!'],
              ['The watermelon, always', 'Cool and round, the star.'],
            ],
          },
          es: {
            t: 'A la barbacoa, llevas…',
            o: 'Pregúntale cuál es su especialidad en una barbacoa.',
            a: [
              ['Los clásicos: maíz y brochetas', 'Los clásicos unen.'],
              ['Un adobo probado para la ocasión', '¡Misterio y especias, lo pruebo!'],
              ['La sandía, siempre', 'Fresca y redonda, la estrella.'],
            ],
          },
          pt: {
            t: 'No churrasco, você leva…',
            o: 'Pergunte qual é a especialidade de churrasco dessa pessoa.',
            a: [
              ['Os clássicos: milho e espetinhos', 'Os clássicos unem a turma.'],
              ['Uma marinada testada pra ocasião', 'Mistério e tempero, eu provo!'],
              ['A melancia, sempre', 'Fresquinha e redonda, a estrela.'],
            ],
          },
          nl: {
            t: 'Naar de barbecue neem je mee…',
            o: 'Vraag naar de barbecuespecialiteit van die persoon.',
            a: [
              ['De klassiekers: maïs en spiesjes', 'Klassiekers brengen mensen samen.'],
              ['Een marinade die ik speciaal probeerde', 'Mysterie en kruiden, ik proef!'],
              ['De watermeloen, altijd', 'Fris en rond, de ster.'],
            ],
          },
        }),
        c('ete_piquenique_lieu', 'rythme', [['🏞️', -70, 'nature'], ['🏙️', 70, 'ville']], {
          fr: {
            t: 'Ton pique-nique, tu l’installes…',
            o: 'Demande-lui son coin préféré pour pique-niquer.',
            a: [
              ['Au bord d’une rivière, loin de tout', 'Le glouglou de l’eau, quel calme.'],
              ['Sur une pelouse en ville, pleine de monde', 'Pique-nique avec vue sur la vie !'],
            ],
          },
          en: {
            t: 'You set up your picnic…',
            o: 'Ask them about their favourite picnic spot.',
            a: [
              ['By a river, far from everything', 'The babbling water, so calm.'],
              ['On a busy lawn in town', 'Picnic with a view of life!'],
            ],
          },
          es: {
            t: 'Tu pícnic lo montas…',
            o: 'Pregúntale cuál es su sitio favorito para hacer pícnic.',
            a: [
              ['Junto a un río, lejos de todo', 'El murmullo del agua, qué calma.'],
              ['En un césped de la ciudad, lleno de gente', '¡Pícnic con vistas a la vida!'],
            ],
          },
          pt: {
            t: 'Seu piquenique, você monta…',
            o: 'Pergunte qual é o lugar favorito dessa pessoa para um piquenique.',
            a: [
              ['À beira de um rio, longe de tudo', 'O barulhinho da água, que calma.'],
              ['Num gramado da cidade, cheio de gente', 'Piquenique com vista pra vida!'],
            ],
          },
          nl: {
            t: 'Je picknick zet je neer…',
            o: 'Vraag naar het favoriete picknickplekje van die persoon.',
            a: [
              ['Aan een rivier, ver van alles', 'Het kabbelende water, zo rustig.'],
              ['Op een druk grasveld in de stad', 'Picknicken met uitzicht op het leven!'],
            ],
          },
        }),
        c('ete_barbecue_role', 'elan', [['🔥', 70, 'projets'], ['🪑', -70, 'temps_libre'], ['🎵', 10, 'musique']], {
          fr: {
            t: 'Au barbecue, ton rôle…',
            o: 'Demande-lui quel rôle elle ou il prend à un barbecue.',
            a: [
              ['Aux commandes du grill, c’est ma mission', 'Pince en main, regard concentré.'],
              ['Dans un transat, je profite', 'Le transat est ravi de t’accueillir.'],
              ['À la musique', 'Une playlist ensoleillée, merci !'],
            ],
          },
          en: {
            t: 'At a barbecue, your role…',
            o: 'Ask them what role they take at a barbecue.',
            a: [
              ['In charge of the grill, it’s my mission', 'Tongs in hand, focused look.'],
              ['In a deckchair, enjoying it', 'The deckchair has found its master.'],
              ['On music duty', 'A sunny playlist, thank you!'],
            ],
          },
          es: {
            t: 'En la barbacoa, tu papel…',
            o: 'Pregúntale qué papel tiene en una barbacoa.',
            a: [
              ['Al mando de la parrilla, es mi misión', 'Pinzas en mano, mirada concentrada.'],
              ['En una tumbona, disfrutando', 'La tumbona te da la bienvenida.'],
              ['Con la música', '¡Una lista soleada, gracias!'],
            ],
          },
          pt: {
            t: 'No churrasco, seu papel…',
            o: 'Pergunte que papel essa pessoa assume num churrasco.',
            a: [
              ['No comando da churrasqueira, é minha missão', 'Pegador na mão, olhar concentrado.'],
              ['Numa espreguiçadeira, curtindo', 'A espreguiçadeira te adotou.'],
              ['Na música', 'Uma playlist ensolarada, valeu!'],
            ],
          },
          nl: {
            t: 'Op een barbecue is jouw rol…',
            o: 'Vraag welke rol die persoon op een barbecue pakt.',
            a: [
              ['Aan de grill, het is mijn missie', 'Tang in de hand, geconcentreerde blik.'],
              ['In een ligstoel, genieten', 'De ligstoel heeft z’n meester gevonden.'],
              ['De muziek', 'Een zonnige playlist, dank je!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_8',
      title: { fr: 'Bouger l’été', en: 'Summer moves', es: 'Moverse en verano', pt: 'Movimento no verão', nl: 'Zomerse uitjes' },
      questions: [
        s('ete_baignade', 'ancrage', ['🏊', -100, 'racines'], ['🌊', 100, 'aventure'], {
          fr: { t: 'Pour te baigner, tu choisis…', o: 'Demande-lui sa plus belle baignade.', a: [['La piscine de mon quartier', 'Le bassin qui te connaît par cœur.'], ['Un lac de montagne trouvé au hasard', 'Brrr… mais quelle vue !']], m: 'La mer, au même coin chaque année.' },
          en: { t: 'For a swim, you choose…', o: 'Ask them about the best swim they’ve ever had.', a: [['My local swimming pool', 'The pool that knows you by heart.'], ['A mountain lake found by chance', 'Brrr… but what a view!']], m: 'The sea, same spot every year.' },
          es: { t: 'Para bañarte, eliges…', o: 'Pregúntale cuál ha sido su mejor baño.', a: [['La piscina de mi barrio', 'La piscina que te conoce de memoria.'], ['Un lago de montaña encontrado por casualidad', 'Brrr… ¡pero qué vistas!']], m: 'El mar, en el mismo rincón cada año.' },
          pt: { t: 'Para nadar, você escolhe…', o: 'Pergunte qual foi o melhor mergulho dessa pessoa.', a: [['A piscina do meu bairro', 'A piscina que te conhece de cor.'], ['Um lago de montanha achado por acaso', 'Brrr… mas que vista!']], m: 'O mar, no mesmo cantinho todo ano.' },
          nl: { t: 'Om te zwemmen kies je…', o: 'Vraag naar de mooiste zwempartij van die persoon.', a: [['Het zwembad in mijn buurt', 'Het bad dat je door en door kent.'], ['Een bergmeer dat ik toevallig vond', 'Brrr… maar wat een uitzicht!']], m: 'De zee, elk jaar op hetzelfde plekje.' },
        }),
        c('ete_rando_depart', 'cap', [['🌄', 70, 'plan'], ['🥾', -60, 'spontane']], {
          fr: {
            t: 'Une randonnée en plein été…',
            o: 'Demande-lui sa plus belle balade d’été.',
            a: [
              ['Départ 6 h, itinéraire imprimé', 'Le lever de soleil en bonus !'],
              ['On part quand on est prêts', 'Le chemin attendra, il est patient.'],
            ],
          },
          en: {
            t: 'A hike in high summer…',
            o: 'Ask them about the best summer walk they’ve done.',
            a: [
              ['Off at 6, route printed', 'Sunrise as a bonus!'],
              ['We leave when we’re ready', 'The path will wait, it’s patient.'],
            ],
          },
          es: {
            t: 'Una ruta a pie en pleno verano…',
            o: 'Pregúntale cuál ha sido su mejor paseo de verano.',
            a: [
              ['Salida a las 6, ruta impresa', '¡El amanecer de regalo!'],
              ['Salimos cuando estemos listos', 'El camino esperará, es paciente.'],
            ],
          },
          pt: {
            t: 'Uma trilha em pleno verão…',
            o: 'Pergunte qual foi o passeio de verão mais bonito dessa pessoa.',
            a: [
              ['Saída às 6h, roteiro impresso', 'O nascer do sol de brinde!'],
              ['A gente sai quando estiver pronto', 'A trilha espera, ela é paciente.'],
            ],
          },
          nl: {
            t: 'Een wandeltocht hartje zomer…',
            o: 'Vraag naar de mooiste zomerwandeling van die persoon.',
            a: [
              ['Vertrek om 6 uur, route uitgeprint', 'De zonsopgang als bonus!'],
              ['We gaan als we klaar zijn', 'Het pad wacht wel, het is geduldig.'],
            ],
          },
        }),
        c('ete_sport_ete', 'elan', [['🏆', 80, 'sport'], ['🧘', -40, 'calme'], ['🛋️', -80, 'temps_libre']], {
          fr: {
            t: 'L’été, côté sport…',
            o: 'Demande-lui son activité préférée de l’été.',
            a: [
              ['Je me lance un défi : une course, une traversée', 'Je prépare les pancartes !'],
              ['Des étirements au soleil, tranquille', 'Doux comme un chat au soleil.'],
              ['Le hamac est mon sport', 'Le balancement, sport olympique ?'],
            ],
          },
          en: {
            t: 'In summer, sport-wise…',
            o: 'Ask them about their favourite summer activity.',
            a: [
              ['I set a challenge: a race, a crossing', 'I’m making the banners!'],
              ['Gentle stretching in the sun', 'Soft as a cat in the sunshine.'],
              ['The hammock is my sport', 'Swinging, an Olympic event?'],
            ],
          },
          es: {
            t: 'En verano, en cuanto a deporte…',
            o: 'Pregúntale cuál es su actividad favorita del verano.',
            a: [
              ['Me pongo un reto: una carrera, una travesía', '¡Preparo las pancartas!'],
              ['Estiramientos al sol, tranquilamente', 'Suave como un gato al sol.'],
              ['La hamaca es mi deporte', '¿Columpiarse, deporte olímpico?'],
            ],
          },
          pt: {
            t: 'No verão, em termos de esporte…',
            o: 'Pergunte qual é a atividade de verão favorita dessa pessoa.',
            a: [
              ['Me desafio: uma corrida, uma travessia', 'Vou fazer os cartazes!'],
              ['Alongamento no sol, na calma', 'Suave como um gato no sol.'],
              ['A rede é meu esporte', 'Balançar, esporte olímpico?'],
            ],
          },
          nl: {
            t: 'In de zomer, qua sport…',
            o: 'Vraag naar de favoriete zomeractiviteit van die persoon.',
            a: [
              ['Ik zet een uitdaging neer: een loop, een oversteek', 'Ik maak de spandoeken!'],
              ['Rustig rekken en strekken in de zon', 'Zacht als een kat in de zon.'],
              ['De hangmat is mijn sport', 'Schommelen, een olympische sport?'],
            ],
          },
        }),
        c('ete_tournoi', 'foyer', [['🎯', 70, 'accueil'], ['👀', -50, 'liberte'], ['🙋', 20, null]], {
          fr: {
            t: 'Un tournoi de pétanque s’organise dans le quartier.',
            o: 'Demande-lui si elle ou il participe aux jeux de quartier.',
            a: [
              ['J’inscris une équipe avec les voisins', 'L’équipe de l’immeuble, imbattable !'],
              ['Je regarde de loin, en passant', 'Le meilleur siège : le banc d’à côté.'],
              ['Je rejoins une équipe qui manque de monde', 'Renfort de dernière minute, bravo.'],
            ],
          },
          en: {
            t: 'A pétanque tournament is being organised in the area.',
            o: 'Ask them if they join in neighbourhood games.',
            a: [
              ['I enter a team with the neighbours', 'The building’s team, unbeatable!'],
              ['I watch from afar, passing by', 'Best seat: the bench next door.'],
              ['I join a team that’s one short', 'Last-minute backup, well done.'],
            ],
          },
          es: {
            t: 'Se organiza un torneo de petanca en el barrio.',
            o: 'Pregúntale si participa en los juegos del barrio.',
            a: [
              ['Inscribo un equipo con los vecinos', '¡El equipo del edificio, imbatible!'],
              ['Miro de lejos, al pasar', 'El mejor asiento: el banco de al lado.'],
              ['Me uno a un equipo al que le falta gente', 'Refuerzo de última hora, bravo.'],
            ],
          },
          pt: {
            t: 'Um torneio de bocha está sendo organizado no bairro.',
            o: 'Pergunte se essa pessoa participa dos jogos do bairro.',
            a: [
              ['Inscrevo um time com os vizinhos', 'O time do prédio, imbatível!'],
              ['Assisto de longe, de passagem', 'O melhor lugar: o banco ao lado.'],
              ['Entro num time que está desfalcado', 'Reforço de última hora, boa.'],
            ],
          },
          nl: {
            t: 'Er wordt een jeu-de-boulestoernooi in de buurt georganiseerd.',
            o: 'Vraag of die persoon meedoet aan buurtspelletjes.',
            a: [
              ['Ik schrijf een team in met de buren', 'Het team van het gebouw, onverslaanbaar!'],
              ['Ik kijk van een afstandje, in het voorbijgaan', 'Beste plek: het bankje ernaast.'],
              ['Ik val in bij een team dat iemand mist', 'Last-minute versterking, knap.'],
            ],
          },
        }),
        s('ete_activite_ambiance', 'rythme', ['🎣', -100, 'calme'], ['🎡', 100, 'monde'], {
          fr: { t: 'Ton activité d’été préférée…', o: 'Demande-lui ce qu’elle ou il aime faire un après-midi d’été.', a: [['Calme, au bord de l’eau', 'Les libellules te font coucou.'], ['Une fête foraine pleine de bruit', 'Un tour de grande roue ?']], m: 'Une balade à vélo entre amis.' },
          en: { t: 'Your favourite summer activity…', o: 'Ask them what they like doing on a summer afternoon.', a: [['Something calm, by the water', 'The dragonflies wave hello.'], ['A noisy funfair', 'A spin on the big wheel?']], m: 'A bike ride with friends.' },
          es: { t: 'Tu actividad de verano favorita…', o: 'Pregúntale qué le gusta hacer una tarde de verano.', a: [['Algo tranquilo, junto al agua', 'Las libélulas te saludan.'], ['Una feria ruidosa', '¿Una vuelta en la noria?']], m: 'Un paseo en bici con amigos.' },
          pt: { t: 'Sua atividade de verão favorita…', o: 'Pergunte o que essa pessoa gosta de fazer numa tarde de verão.', a: [['Algo calmo, à beira da água', 'As libélulas dão tchauzinho.'], ['Um parque de diversões barulhento', 'Uma volta na roda-gigante?']], m: 'Um passeio de bicicleta com amigos.' },
          nl: { t: 'Je favoriete zomeractiviteit…', o: 'Vraag wat die persoon graag doet op een zomermiddag.', a: [['Iets rustigs, aan het water', 'De libellen zwaaien naar je.'], ['Een lawaaiige kermis', 'Een rondje in het reuzenrad?']], m: 'Een fietstochtje met vrienden.' },
        }),
      ],
    },
    {
      id: 'ete_9',
      title: { fr: 'L’été en ville', en: 'Summer in town', es: 'El verano en la ciudad', pt: 'Verão na cidade', nl: 'Zomer in de stad' },
      questions: [
        c('ete_ville_aout', 'rythme', [['🤫', -70, 'calme'], ['🎶', 70, 'monde']], {
          fr: {
            t: 'La ville se vide en août.',
            o: 'Demande-lui ce qu’elle ou il aime dans la ville en août.',
            a: [
              ['J’adore, tout est calme', 'Les rues rien que pour toi.'],
              ['Je cherche les derniers coins animés', 'Il reste toujours une fête quelque part !'],
            ],
          },
          en: {
            t: 'The city empties out in August.',
            o: 'Ask them what they love about the city in August.',
            a: [
              ['I love it, everything’s calm', 'The streets all to yourself.'],
              ['I hunt for the last lively spots', 'There’s always a party somewhere!'],
            ],
          },
          es: {
            t: 'La ciudad se vacía en agosto.',
            o: 'Pregúntale qué le gusta de la ciudad en agosto.',
            a: [
              ['Me encanta, todo está tranquilo', 'Las calles solo para ti.'],
              ['Busco los últimos sitios con ambiente', '¡Siempre queda una fiesta en algún sitio!'],
            ],
          },
          pt: {
            t: 'A cidade esvazia em agosto.',
            o: 'Pergunte do que essa pessoa gosta na cidade em agosto.',
            a: [
              ['Adoro, tudo fica calmo', 'As ruas só pra você.'],
              ['Procuro os últimos lugares animados', 'Sempre tem uma festa em algum lugar!'],
            ],
          },
          nl: {
            t: 'In augustus loopt de stad leeg.',
            o: 'Vraag wat die persoon fijn vindt aan de stad in augustus.',
            a: [
              ['Heerlijk, alles is rustig', 'De straten helemaal voor jou.'],
              ['Ik zoek de laatste levendige plekken', 'Ergens is er altijd een feestje!'],
            ],
          },
        }),
        s('ete_ville_touriste', 'ancrage', ['☕', -100, 'racines'], ['🗺️', 100, 'curiosite'], {
          fr: { t: 'L’été en ville, tu…', o: 'Demande-lui le coin de sa ville qu’elle ou il a découvert récemment.', a: [['Retrouves tes lieux habituels', 'Tes repères, en version ensoleillée.'], ['Joues au touriste dans ta propre ville', 'Appareil photo autour du cou !']], m: 'Un nouveau lieu par semaine.' },
          en: { t: 'Summer in town, you…', o: 'Ask them about a corner of their town they discovered recently.', a: [['Go back to your usual spots', 'Your landmarks, sunny edition.'], ['Play tourist in your own city', 'Camera round your neck!']], m: 'One new place a week.' },
          es: { t: 'En verano en la ciudad, tú…', o: 'Pregúntale qué rincón de su ciudad ha descubierto hace poco.', a: [['Vuelves a tus sitios de siempre', 'Tus referencias, versión soleada.'], ['Haces de turista en tu propia ciudad', '¡Cámara al cuello!']], m: 'Un sitio nuevo por semana.' },
          pt: { t: 'No verão na cidade, você…', o: 'Pergunte que canto da cidade essa pessoa descobriu recentemente.', a: [['Volta aos seus lugares de sempre', 'Suas referências, versão ensolarada.'], ['Banca o turista na própria cidade', 'Câmera no pescoço!']], m: 'Um lugar novo por semana.' },
          nl: { t: 'In de zomer in de stad…', o: 'Vraag welk plekje in de stad die persoon onlangs ontdekte.', a: [['Ga je naar je vaste plekken', 'Je vertrouwde plekjes, zonnige editie.'], ['Speel je toerist in je eigen stad', 'Camera om je nek!']], m: 'Eén nieuwe plek per week.' },
        }),
        c('ete_ville_animations', 'cap', [['📅', 70, 'plan'], ['🚶', -60, 'spontane']], {
          fr: {
            t: 'Les animations d’été de ta ville…',
            o: 'Demande-lui la meilleure animation d’été de sa ville.',
            a: [
              ['J’ai le programme, tout est noté', 'Ton été est une affiche !'],
              ['Je tombe dessus par hasard', 'Les meilleures surprises arrivent comme ça.'],
            ],
          },
          en: {
            t: 'Your town’s summer events…',
            o: 'Ask them about the best summer event in their town.',
            a: [
              ['I’ve got the programme, all noted', 'Your summer is a poster!'],
              ['I stumble on them by chance', 'The best surprises happen that way.'],
            ],
          },
          es: {
            t: 'Las actividades de verano de tu ciudad…',
            o: 'Pregúntale cuál es la mejor actividad de verano de su ciudad.',
            a: [
              ['Tengo el programa, todo apuntado', '¡Tu verano es un cartel!'],
              ['Me las encuentro por casualidad', 'Las mejores sorpresas llegan así.'],
            ],
          },
          pt: {
            t: 'A programação de verão da sua cidade…',
            o: 'Pergunte qual é o melhor evento de verão da cidade dessa pessoa.',
            a: [
              ['Tenho a programação, tudo anotado', 'Seu verão é um cartaz!'],
              ['Esbarro neles por acaso', 'As melhores surpresas vêm assim.'],
            ],
          },
          nl: {
            t: 'De zomeractiviteiten in je stad…',
            o: 'Vraag naar het leukste zomerevenement in de stad van die persoon.',
            a: [
              ['Ik heb het programma, alles genoteerd', 'Jouw zomer is een affiche!'],
              ['Ik kom ze toevallig tegen', 'Zo komen de beste verrassingen.'],
            ],
          },
        }),
        c('ete_ville_cour', 'foyer', [['🪑', 80, 'accueil'], ['🪟', -60, 'liberte'], ['🙂', 20, null]], {
          fr: {
            t: 'Les voisins sortent des chaises dans la cour.',
            o: 'Demande-lui comment sont ses soirées d’été entre voisins.',
            a: [
              ['Je descends avec ma chaise et un gâteau', 'Tu viens de lancer la soirée !'],
              ['Je salue de la fenêtre', 'Un coucou du balcon, c’est joli.'],
              ['Je passe dire bonjour', 'Un petit bonjour, ça fait plaisir.'],
            ],
          },
          en: {
            t: 'The neighbours bring chairs out into the courtyard.',
            o: 'Ask them what summer evenings with the neighbours are like.',
            a: [
              ['I go down with my chair and a cake', 'You’ve just started the party!'],
              ['I wave from the window', 'A wave from the balcony, sweet.'],
              ['I pop by to say hello', 'A quick hello is always nice.'],
            ],
          },
          es: {
            t: 'Los vecinos sacan sillas al patio.',
            o: 'Pregúntale cómo son sus noches de verano con los vecinos.',
            a: [
              ['Bajo con mi silla y un bizcocho', '¡Acabas de empezar la fiesta!'],
              ['Saludo desde la ventana', 'Un saludo desde el balcón, qué bonito.'],
              ['Paso a decir hola', 'Un holita siempre alegra.'],
            ],
          },
          pt: {
            t: 'Os vizinhos levam cadeiras para o pátio.',
            o: 'Pergunte como são as noites de verão com os vizinhos dessa pessoa.',
            a: [
              ['Desço com minha cadeira e um bolo', 'Você acabou de começar a festa!'],
              ['Aceno da janela', 'Um tchauzinho da varanda, fofo.'],
              ['Passo pra dar um oi', 'Um oizinho sempre alegra.'],
            ],
          },
          nl: {
            t: 'De buren zetten stoelen buiten op de binnenplaats.',
            o: 'Vraag hoe de zomeravonden met de buren van die persoon zijn.',
            a: [
              ['Ik ga naar beneden met mijn stoel en een taart', 'Jij hebt net het feest geopend!'],
              ['Ik zwaai vanuit het raam', 'Een zwaai vanaf het balkon, lief.'],
              ['Ik kom even gedag zeggen', 'Even gedag, altijd fijn.'],
            ],
          },
        }),
        c('ete_ville_projet', 'elan', [['🛠️', 70, 'projets'], ['🌇', -70, 'temps_libre']], {
          fr: {
            t: 'L’été en ville, c’est l’occasion…',
            o: 'Demande-lui ce qu’elle ou il aime faire quand la ville ralentit.',
            a: [
              ['De lancer ce projet qui attend', 'Enfin son tour, à ce projet !'],
              ['De flâner, sans but', 'Flâner, le plus beau des programmes.'],
            ],
          },
          en: {
            t: 'Summer in town is the chance…',
            o: 'Ask them what they like doing when the city slows down.',
            a: [
              ['To start that project that’s been waiting', 'Finally that project’s turn!'],
              ['To wander, aimlessly', 'Wandering, the finest plan.'],
            ],
          },
          es: {
            t: 'El verano en la ciudad es la ocasión…',
            o: 'Pregúntale qué le gusta hacer cuando la ciudad va más despacio.',
            a: [
              ['De lanzar ese proyecto que espera', '¡Por fin le toca a ese proyecto!'],
              ['De pasear, sin rumbo', 'Pasear, el mejor de los planes.'],
            ],
          },
          pt: {
            t: 'O verão na cidade é a chance…',
            o: 'Pergunte o que essa pessoa gosta de fazer quando a cidade desacelera.',
            a: [
              ['De tirar do papel aquele projeto', 'Finalmente a vez desse projeto!'],
              ['De passear, sem rumo', 'Passear, o melhor dos programas.'],
            ],
          },
          nl: {
            t: 'De zomer in de stad is de kans…',
            o: 'Vraag wat die persoon graag doet als de stad vertraagt.',
            a: [
              ['Om dat project te starten dat ligt te wachten', 'Eindelijk is dat project aan de beurt!'],
              ['Om doelloos rond te slenteren', 'Slenteren, het mooiste plan.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'ete_10',
      title: { fr: 'La fin de l’été', en: 'End of summer', es: 'El final del verano', pt: 'O fim do verão', nl: 'Het einde van de zomer' },
      questions: [
        c('ete_derniers_jours', 'rythme', [['🎉', 70, 'fete'], ['🌾', -70, 'calme']], {
          fr: {
            t: 'Les derniers jours d’août…',
            o: 'Demande-lui comment elle ou il dit au revoir à l’été.',
            a: [
              ['Une grande fête de fin d’été', 'Au revoir l’été, en musique !'],
              ['Des balades calmes pour savourer', 'Chaque minute de soleil compte.'],
            ],
          },
          en: {
            t: 'The last days of August…',
            o: 'Ask them how they say goodbye to summer.',
            a: [
              ['A big end-of-summer party', 'Goodbye summer, with music!'],
              ['Quiet walks to savour it', 'Every minute of sun counts.'],
            ],
          },
          es: {
            t: 'Los últimos días de agosto…',
            o: 'Pregúntale cómo se despide del verano.',
            a: [
              ['Una gran fiesta de fin de verano', '¡Adiós verano, con música!'],
              ['Paseos tranquilos para saborearlo', 'Cada minuto de sol cuenta.'],
            ],
          },
          pt: {
            t: 'Os últimos dias de agosto…',
            o: 'Pergunte como essa pessoa se despede do verão.',
            a: [
              ['Uma grande festa de fim de verão', 'Tchau verão, com música!'],
              ['Passeios calmos pra saborear', 'Cada minuto de sol conta.'],
            ],
          },
          nl: {
            t: 'De laatste dagen van augustus…',
            o: 'Vraag hoe die persoon afscheid neemt van de zomer.',
            a: [
              ['Een groot eind-van-de-zomerfeest', 'Dag zomer, met muziek!'],
              ['Rustige wandelingen om te genieten', 'Elke minuut zon telt.'],
            ],
          },
        }),
        s('ete_rentree', 'cap', ['🎲', -100, 'spontane'], ['🗓️', 100, 'plan'], {
          fr: { t: 'La rentrée approche.', o: 'Demande-lui comment elle ou il prépare la rentrée.', a: [['J’y penserai le jour même', 'L’été jusqu’à la dernière seconde.'], ['Mon agenda de septembre est prêt', 'Septembre n’a qu’à bien se tenir.']], m: 'Je jette un œil la dernière semaine.' },
          en: { t: 'September is coming.', o: 'Ask them how they get ready for September.', a: [['I’ll think about it on the day', 'Summer till the very last second.'], ['My September diary is ready', 'September had better behave.']], m: 'I take a look in the last week.' },
          es: { t: 'Se acerca septiembre.', o: 'Pregúntale cómo prepara la vuelta de septiembre.', a: [['Ya pensaré en ello ese mismo día', 'Verano hasta el último segundo.'], ['Mi agenda de septiembre está lista', 'Que se prepare septiembre.']], m: 'Le echo un ojo la última semana.' },
          pt: { t: 'A volta da rotina está chegando.', o: 'Pergunte como essa pessoa se prepara para a volta da rotina.', a: [['Penso nisso no próprio dia', 'Verão até o último segundo.'], ['Minha agenda de setembro está pronta', 'Setembro que se cuide.']], m: 'Dou uma olhada na última semana.' },
          nl: { t: 'September komt eraan.', o: 'Vraag hoe die persoon zich op september voorbereidt.', a: [['Ik denk er die dag zelf wel aan', 'Zomer tot de laatste seconde.'], ['Mijn septemberagenda staat klaar', 'September moet zich maar gedragen.']], m: 'Ik kijk er de laatste week even naar.' },
        }),
        c('ete_plus_beau_souvenir', 'foyer', [['👥', 70, 'accueil'], ['🌅', -60, 'liberte']], {
          fr: {
            t: 'Ton plus beau souvenir de l’été, c’est…',
            o: 'Demande-lui son plus beau souvenir de cet été.',
            a: [
              ['Une soirée avec plein de monde', 'Tous ces sourires, quel trésor.'],
              ['Un moment rien qu’à moi', 'Un secret doré, bien gardé.'],
            ],
          },
          en: {
            t: 'Your best summer memory is…',
            o: 'Ask them about their best memory from this summer.',
            a: [
              ['An evening with loads of people', 'All those smiles, what a treasure.'],
              ['A moment all to myself', 'A golden secret, well kept.'],
            ],
          },
          es: {
            t: 'Tu mejor recuerdo del verano es…',
            o: 'Pregúntale cuál es su mejor recuerdo de este verano.',
            a: [
              ['Una noche con muchísima gente', 'Tantas sonrisas, qué tesoro.'],
              ['Un momento solo para mí', 'Un secreto dorado, bien guardado.'],
            ],
          },
          pt: {
            t: 'Sua melhor lembrança do verão é…',
            o: 'Pergunte qual é a melhor lembrança deste verão para essa pessoa.',
            a: [
              ['Uma noite com muita gente', 'Tantos sorrisos, que tesouro.'],
              ['Um momento só meu', 'Um segredo dourado, bem guardado.'],
            ],
          },
          nl: {
            t: 'Je mooiste zomerherinnering is…',
            o: 'Vraag naar de mooiste herinnering van die persoon aan deze zomer.',
            a: [
              ['Een avond met heel veel mensen', 'Al die glimlachen, wat een schat.'],
              ['Een moment helemaal voor mezelf', 'Een gouden geheim, goed bewaard.'],
            ],
          },
        }),
        c('ete_prolonger', 'ancrage', [['🫙', -60, 'racines'], ['✈️', 70, 'voyage'], ['📸', 10, null]], {
          fr: {
            t: 'Pour garder l’été un peu plus longtemps…',
            o: 'Demande-lui comment elle ou il prolonge l’été.',
            a: [
              ['Je fais des confitures, comme chaque année', 'L’été en pot, pour tout l’hiver.'],
              ['Je pars chercher le soleil ailleurs', 'Le soleil, tu le suis partout !'],
              ['Je regarde mes photos', 'Un petit rayon à chaque photo.'],
            ],
          },
          en: {
            t: 'To make summer last a little longer…',
            o: 'Ask them how they stretch out summer.',
            a: [
              ['I make jam, like every year', 'Summer in a jar, all winter long.'],
              ['I go chasing the sun elsewhere', 'You follow the sun everywhere!'],
              ['I look through my photos', 'A little sunbeam in every photo.'],
            ],
          },
          es: {
            t: 'Para que el verano dure un poco más…',
            o: 'Pregúntale cómo alarga el verano.',
            a: [
              ['Hago mermeladas, como cada año', 'El verano en tarro, para todo el invierno.'],
              ['Me voy a buscar el sol a otra parte', '¡Sigues al sol a todas partes!'],
              ['Miro mis fotos', 'Un rayito en cada foto.'],
            ],
          },
          pt: {
            t: 'Para fazer o verão durar um pouco mais…',
            o: 'Pergunte como essa pessoa prolonga o verão.',
            a: [
              ['Faço geleias, como todo ano', 'O verão no pote, pro inverno todo.'],
              ['Vou buscar o sol em outro lugar', 'Você segue o sol por toda parte!'],
              ['Olho minhas fotos', 'Um raiozinho em cada foto.'],
            ],
          },
          nl: {
            t: 'Om de zomer wat langer vast te houden…',
            o: 'Vraag hoe die persoon de zomer rekt.',
            a: [
              ['Ik maak jam, zoals elk jaar', 'Zomer in een pot, de hele winter lang.'],
              ['Ik ga ergens anders de zon opzoeken', 'Jij volgt de zon overal!'],
              ['Ik kijk naar mijn foto’s', 'Een zonnestraaltje in elke foto.'],
            ],
          },
        }),
        s('ete_bilan', 'elan', ['🌴', -100, 'temps_libre'], ['🏅', 100, 'projets'], {
          fr: { t: 'Ton été, au final…', o: 'Demande-lui à quoi a ressemblé son été.', a: [['Reposant, j’ai juste profité', 'Mission farniente accomplie.'], ['Productif, j’ai réalisé plein de choses', 'Quel été bien rempli, bravo !']], m: 'Un peu des deux, parfait.' },
          en: { t: 'Your summer, all in all…', o: 'Ask them what their summer was like.', a: [['Restful, I just enjoyed it', 'Mission lazy days: complete.'], ['Productive, I got loads done', 'What a full summer, well done!']], m: 'A bit of both, perfect.' },
          es: { t: 'Tu verano, al final…', o: 'Pregúntale cómo ha sido su verano.', a: [['Relajado, solo he disfrutado', 'Misión dolce far niente cumplida.'], ['Productivo, he hecho un montón de cosas', '¡Qué verano tan completo, bravo!']], m: 'Un poco de cada, perfecto.' },
          pt: { t: 'Seu verão, no fim das contas…', o: 'Pergunte como foi o verão dessa pessoa.', a: [['Tranquilo, só aproveitei', 'Missão preguiça cumprida.'], ['Produtivo, fiz um monte de coisas', 'Que verão cheio, parabéns!']], m: 'Um pouco de cada, perfeito.' },
          nl: { t: 'Je zomer, al met al…', o: 'Vraag hoe de zomer van die persoon was.', a: [['Ontspannen, ik heb gewoon genoten', 'Missie luieren: geslaagd.'], ['Productief, ik heb veel gedaan', 'Wat een volle zomer, knap!']], m: 'Een beetje van allebei, perfect.' },
        }),
      ],
    },
  ],
};
