// Univers « Tes rituels » : petites habitudes et rituels personnels du quotidien.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'rituels',
  icon: '⏳',
  title: {
    fr: ['Tes rituels', 'Les petites habitudes qui font ta journée.'],
    en: ['Your rituals', 'The little habits that make your day.'],
    es: ['Tus rituales', 'Los pequeños hábitos que hacen tu día.'],
    pt: ['Seus rituais', 'Os pequenos hábitos que fazem o seu dia.'],
    nl: ['Je rituelen', 'De kleine gewoontes die je dag maken.'],
  },
  steps: [
    {
      id: 'rituels_1',
      title: { fr: 'Le matin', en: 'Mornings', es: 'La mañana', pt: 'A manhã', nl: 'De ochtend' },
      questions: [
        c('rituels_premier_geste', 'cap', [['🪟', -50, 'spontane'], ['🛏️', 60, 'ordre'], ['📻', 0, null]], {
          fr: {
            t: 'Ton tout premier geste en te levant ?',
            o: 'Demande-lui quel est son premier geste du matin.',
            a: [
              ['Ouvrir la fenêtre et voir l’humeur du jour', 'Bonjour le ciel, tu es comment ?'],
              ['Faire mon lit, au carré', 'Pas un pli, impressionnant.'],
              ['Allumer la radio', 'Les nouvelles du jour, en direct.'],
            ],
          },
          en: {
            t: 'Your very first move when you get up?',
            o: 'Ask them what the first thing they do in the morning is.',
            a: [
              ['Open the window and check the day’s mood', 'Morning, sky, how are you?'],
              ['Make my bed, nice and neat', 'Not a single crease, impressive.'],
              ['Switch on the radio', 'Today’s news, live.'],
            ],
          },
          es: {
            t: '¿Tu primerísimo gesto al levantarte?',
            o: 'Pregúntale qué es lo primero que hace por la mañana.',
            a: [
              ['Abrir la ventana y ver el humor del día', 'Buenos días, cielo, ¿qué tal?'],
              ['Hacer la cama, perfecta', 'Ni una arruga, impresionante.'],
              ['Encender la radio', 'Las noticias del día, en directo.'],
            ],
          },
          pt: {
            t: 'Seu primeiríssimo gesto ao acordar?',
            o: 'Pergunte qual é a primeira coisa que essa pessoa faz de manhã.',
            a: [
              ['Abrir a janela e ver o humor do dia', 'Bom dia, céu, como você está?'],
              ['Arrumar a cama, bem esticada', 'Nem uma dobra, impressionante.'],
              ['Ligar o rádio', 'As notícias do dia, ao vivo.'],
            ],
          },
          nl: {
            t: 'Het allereerste wat je doet als je opstaat?',
            o: 'Vraag wat die persoon ’s ochtends als eerste doet.',
            a: [
              ['Het raam openen en de dag peilen', 'Goeiemorgen lucht, hoe gaat het?'],
              ['Mijn bed strak opmaken', 'Geen kreukje, indrukwekkend.'],
              ['De radio aanzetten', 'Het nieuws van de dag, live.'],
            ],
          },
        }),
        s('rituels_petit_dej_lieu', 'rythme', ['🥣', -100, 'cocooning'], ['🥐', 100, 'ville'], {
          fr: { t: 'Ton petit-déjeuner, tu le prends…', o: 'Demande-lui où elle ou il aime prendre son petit-déjeuner.', a: [['Tranquille chez moi, en pyjama', 'Pyjama et tartines, le bonheur.'], ['Au café du coin, au milieu du monde', 'Bonjour à toute la terrasse !']], m: 'Sur le pouce, en marchant.' },
          en: { t: 'You have your breakfast…', o: 'Ask them where they like to have breakfast.', a: [['Quietly at home, in my pyjamas', 'Pyjamas and toast, pure joy.'], ['At the local café, among people', 'Morning, everyone!']], m: 'On the go, while walking.' },
          es: { t: 'El desayuno, lo tomas…', o: 'Pregúntale dónde le gusta desayunar.', a: [['Tranquilamente en casa, en pijama', 'Pijama y tostadas, la felicidad.'], ['En el bar de la esquina, entre gente', '¡Buenos días a toda la terraza!']], m: 'Sobre la marcha, andando.' },
          pt: { t: 'Seu café da manhã, você toma…', o: 'Pergunte onde essa pessoa gosta de tomar café da manhã.', a: [['Tranquilo em casa, de pijama', 'Pijama e torrada, felicidade.'], ['Na padaria da esquina, no meio do povo', 'Bom dia, pessoal!']], m: 'Correndo, no caminho.' },
          nl: { t: 'Je ontbijt eet je het liefst…', o: 'Vraag waar die persoon graag ontbijt.', a: [['Rustig thuis, in mijn pyjama', 'Pyjama en boterhammen, geluk.'], ['In het café om de hoek, tussen de mensen', 'Goeiemorgen, allemaal!']], m: 'Onderweg, al lopend.' },
        }),
        c('rituels_meme_bol', 'ancrage', [['🍞', -70, 'racines'], ['🥭', 60, 'curiosite'], ['🍳', 10, 'cuisine']], {
          fr: {
            t: 'Ton petit-déjeuner, c’est…',
            o: 'Demande-lui ce qu’elle ou il mange le matin.',
            a: [
              ['Le même depuis des années', 'Une valeur sûre, comme un vieux copain.'],
              ['Jamais le même, j’aime varier', 'Surprise du chef chaque matin !'],
              ['Ça dépend de ce qu’il y a', 'Le frigo décide, moi j’applaudis.'],
            ],
          },
          en: {
            t: 'Your breakfast is…',
            o: 'Ask them what they eat in the morning.',
            a: [
              ['The same for years', 'A safe bet, like an old friend.'],
              ['Never the same, I like variety', 'Chef’s surprise every morning!'],
              ['Whatever’s in the kitchen', 'The fridge decides, I clap.'],
            ],
          },
          es: {
            t: 'Tu desayuno es…',
            o: 'Pregúntale qué desayuna.',
            a: [
              ['El mismo desde hace años', 'Un clásico, como un viejo amigo.'],
              ['Nunca el mismo, me gusta variar', '¡Sorpresa del chef cada mañana!'],
              ['Depende de lo que haya', 'La nevera decide, yo aplaudo.'],
            ],
          },
          pt: {
            t: 'Seu café da manhã é…',
            o: 'Pergunte o que essa pessoa come de manhã.',
            a: [
              ['O mesmo há anos', 'Aposta certa, como um velho amigo.'],
              ['Nunca o mesmo, gosto de variar', 'Surpresa do chef toda manhã!'],
              ['Depende do que tiver', 'A geladeira decide, eu aplaudo.'],
            ],
          },
          nl: {
            t: 'Je ontbijt is…',
            o: 'Vraag wat die persoon ’s ochtends eet.',
            a: [
              ['Al jaren hetzelfde', 'Vertrouwd, als een oude vriend.'],
              ['Nooit hetzelfde, ik wissel graag af', 'Elke ochtend een verrassing van de chef!'],
              ['Wat er maar in huis is', 'De koelkast beslist, ik klap.'],
            ],
          },
        }),
        c('rituels_matin_objectif', 'elan', [['☕', -60, 'temps_libre'], ['📋', 60, 'projets']], {
          fr: {
            t: 'Le matin, avant de te lancer dans la journée…',
            o: 'Demande-lui comment elle ou il démarre sa journée.',
            a: [
              ['Je savoure mon café sans penser à rien', 'Chut, le café parle.'],
              ['Je note mes trois objectifs du jour', 'Liste prête, journée conquise.'],
            ],
          },
          en: {
            t: 'In the morning, before diving into the day…',
            o: 'Ask them how they kick off their day.',
            a: [
              ['I enjoy my coffee and think of nothing', 'Shh, the coffee is talking.'],
              ['I jot down my three goals for the day', 'List ready, day conquered.'],
            ],
          },
          es: {
            t: 'Por la mañana, antes de lanzarte al día…',
            o: 'Pregúntale cómo empieza su día.',
            a: [
              ['Saboreo el café sin pensar en nada', 'Chis, el café está hablando.'],
              ['Apunto mis tres objetivos del día', 'Lista lista, día conquistado.'],
            ],
          },
          pt: {
            t: 'De manhã, antes de encarar o dia…',
            o: 'Pergunte como essa pessoa começa o dia.',
            a: [
              ['Saboreio meu café sem pensar em nada', 'Psiu, o café está falando.'],
              ['Anoto meus três objetivos do dia', 'Lista pronta, dia conquistado.'],
            ],
          },
          nl: {
            t: 'In de ochtend, voordat je de dag in duikt…',
            o: 'Vraag hoe die persoon de dag begint.',
            a: [
              ['Geniet ik van mijn koffie zonder te denken', 'Sst, de koffie praat.'],
              ['Schrijf ik mijn drie doelen van de dag op', 'Lijstje klaar, dag veroverd.'],
            ],
          },
        }),
        c('rituels_matin_bonjour', 'foyer', [['💬', 60, 'famille'], ['🎧', -60, 'liberte'], ['👋', 20, 'accueil']], {
          fr: {
            t: 'Ton petit rituel du matin avec les autres ?',
            o: 'Demande-lui à qui elle ou il dit bonjour en premier le matin.',
            a: [
              ['Un message à mes proches', 'Coucou, bien dormi ?'],
              ['Aucun, le matin c’est ma bulle', 'Je ne dis rien, promis.'],
              ['Un bonjour aux voisins en sortant', 'Bonjour madame, bonjour monsieur !'],
            ],
          },
          en: {
            t: 'Your little morning ritual with other people?',
            o: 'Ask them who they say good morning to first.',
            a: [
              ['A message to my loved ones', 'Hi there, sleep well?'],
              ['None, mornings are my bubble', 'I won’t say a word, promise.'],
              ['A hello to the neighbours on my way out', 'Morning, neighbours!'],
            ],
          },
          es: {
            t: '¿Tu pequeño ritual de la mañana con los demás?',
            o: 'Pregúntale a quién le da los buenos días primero.',
            a: [
              ['Un mensaje a mi gente', 'Hola, ¿qué tal has dormido?'],
              ['Ninguno, la mañana es mi burbuja', 'No digo nada, prometido.'],
              ['Un saludo a los vecinos al salir', '¡Buenos días, vecinos!'],
            ],
          },
          pt: {
            t: 'Seu pequeno ritual matinal com os outros?',
            o: 'Pergunte para quem essa pessoa dá bom-dia primeiro.',
            a: [
              ['Uma mensagem para as pessoas queridas', 'Oi, dormiu bem?'],
              ['Nenhum, de manhã é minha bolha', 'Não falo nada, prometo.'],
              ['Um bom-dia aos vizinhos ao sair', 'Bom dia, vizinhança!'],
            ],
          },
          nl: {
            t: 'Je kleine ochtendritueel met anderen?',
            o: 'Vraag wie die persoon ’s ochtends als eerste goedemorgen zegt.',
            a: [
              ['Een berichtje aan mijn dierbaren', 'Hoi, lekker geslapen?'],
              ['Geen, de ochtend is mijn bubbel', 'Ik zeg niks, beloofd.'],
              ['Goedemorgen tegen de buren als ik vertrek', 'Goedemorgen, buren!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_2',
      title: { fr: 'La pause chaude', en: 'The warm break', es: 'La pausa caliente', pt: 'A pausa quentinha', nl: 'De warme pauze' },
      questions: [
        c('rituels_boisson', 'ancrage', [['🍵', 60, 'curiosite'], ['☕', -60, 'racines'], ['🫖', 10, null]], {
          fr: {
            t: 'Ta boisson chaude du quotidien ?',
            o: 'Demande-lui quelle est sa boisson chaude préférée.',
            a: [
              ['Un thé différent chaque jour', 'Aujourd’hui, on voyage où ?'],
              ['Le même café, toujours', 'Fidèle au poste, comme toi.'],
              ['Une infusion, selon l’humeur', 'Camomille ou verveine, à toi de voir.'],
            ],
          },
          en: {
            t: 'Your everyday hot drink?',
            o: 'Ask them what their favourite hot drink is.',
            a: [
              ['A different tea every day', 'Where are we travelling today?'],
              ['The same coffee, always', 'Loyal to the post, just like you.'],
              ['A herbal tea, depending on my mood', 'Camomile or verbena, your call.'],
            ],
          },
          es: {
            t: '¿Tu bebida caliente de cada día?',
            o: 'Pregúntale cuál es su bebida caliente favorita.',
            a: [
              ['Un té distinto cada día', '¿Adónde viajamos hoy?'],
              ['El mismo café, siempre', 'Fiel a su puesto, como tú.'],
              ['Una infusión, según el humor', 'Manzanilla o hierbaluisa, tú decides.'],
            ],
          },
          pt: {
            t: 'Sua bebida quente do dia a dia?',
            o: 'Pergunte qual é a bebida quente favorita dessa pessoa.',
            a: [
              ['Um chá diferente por dia', 'Para onde a gente viaja hoje?'],
              ['O mesmo café, sempre', 'Fiel ao posto, como você.'],
              ['Um chá de ervas, conforme o humor', 'Camomila ou erva-cidreira, você decide.'],
            ],
          },
          nl: {
            t: 'Je warme drankje van elke dag?',
            o: 'Vraag wat het favoriete warme drankje van die persoon is.',
            a: [
              ['Elke dag een andere thee', 'Waar reizen we vandaag naartoe?'],
              ['Altijd dezelfde koffie', 'Trouw op post, net als jij.'],
              ['Kruidenthee, naargelang mijn stemming', 'Kamille of verveine, kies maar.'],
            ],
          },
        }),
        s('rituels_dosage', 'cap', ['⚖️', 100, 'ordre'], ['🌀', -100, 'spontane'], {
          fr: { t: 'Ta boisson chaude, tu la prépares…', o: 'Demande-lui sa recette de boisson chaude.', a: [['Toujours pareil, dosage au gramme près', 'Un vrai laboratoire !'], ['Au pif, ça change à chaque fois', 'Chaque tasse, une aventure.']], m: 'Un rituel, mais souple.' },
          en: { t: 'You make your hot drink…', o: 'Ask them for their hot drink recipe.', a: [['Exactly the same, measured to the gram', 'A proper laboratory!'], ['By eye, it’s different every time', 'Every cup is an adventure.']], m: 'A ritual, but a flexible one.' },
          es: { t: 'Tu bebida caliente, la preparas…', o: 'Pregúntale su receta de bebida caliente.', a: [['Siempre igual, al gramo', '¡Todo un laboratorio!'], ['A ojo, cambia cada vez', 'Cada taza, una aventura.']], m: 'Un ritual, pero flexible.' },
          pt: { t: 'Sua bebida quente, você prepara…', o: 'Pergunte a receita de bebida quente dessa pessoa.', a: [['Sempre igual, medida no grama', 'Um verdadeiro laboratório!'], ['No olho, muda toda vez', 'Cada xícara, uma aventura.']], m: 'Um ritual, mas flexível.' },
          nl: { t: 'Je warme drankje maak je…', o: 'Vraag naar het recept van het warme drankje van die persoon.', a: [['Altijd hetzelfde, tot op de gram', 'Een echt laboratorium!'], ['Op gevoel, elke keer anders', 'Elk kopje een avontuur.']], m: 'Een ritueel, maar soepel.' },
        }),
        c('rituels_pause_avec', 'foyer', [['🪟', -60, 'liberte'], ['👯', 70, 'accueil']], {
          fr: {
            t: 'Ta pause boisson chaude, tu la prends…',
            o: 'Demande-lui avec qui elle ou il aime faire une pause.',
            a: [
              ['À la fenêtre, dans ma bulle', 'Je regarde les nuages avec toi.'],
              ['Avec des collègues ou des amis', 'Qui veut un biscuit ?'],
            ],
          },
          en: {
            t: 'You take your hot drink break…',
            o: 'Ask them who they like to take a break with.',
            a: [
              ['By the window, in my bubble', 'I’ll watch the clouds with you.'],
              ['With colleagues or friends', 'Who wants a biscuit?'],
            ],
          },
          es: {
            t: 'Tu pausa para un café o un té, la haces…',
            o: 'Pregúntale con quién le gusta hacer una pausa.',
            a: [
              ['En la ventana, en mi burbuja', 'Miro las nubes contigo.'],
              ['Con compañeros o amigos', '¿Quién quiere una galleta?'],
            ],
          },
          pt: {
            t: 'Sua pausa para um café ou chá, você faz…',
            o: 'Pergunte com quem essa pessoa gosta de fazer uma pausa.',
            a: [
              ['Na janela, na minha bolha', 'Olho as nuvens com você.'],
              ['Com colegas ou amigos', 'Quem quer um biscoito?'],
            ],
          },
          nl: {
            t: 'Je pauze met een warm drankje neem je…',
            o: 'Vraag met wie die persoon graag pauze neemt.',
            a: [
              ['Bij het raam, in mijn bubbel', 'Ik kijk met je naar de wolken.'],
              ['Met collega’s of vrienden', 'Wie wil er een koekje?'],
            ],
          },
        }),
        c('rituels_chocolat', 'rythme', [['🛋️', -70, 'cocooning'], ['🏞️', 10, 'nature'], ['🏙️', 60, 'ville']], {
          fr: {
            t: 'Ton endroit préféré pour un chocolat chaud ?',
            o: 'Demande-lui où elle ou il boit le meilleur chocolat chaud.',
            a: [
              ['Mon canapé, sous un plaid', 'Moustache de chocolat garantie.'],
              ['Un banc au parc, thermos en main', 'Les écureuils sont jaloux.'],
              ['Un café animé en ville', 'Ça papote, ça rit, j’adore.'],
            ],
          },
          en: {
            t: 'Your favourite spot for a hot chocolate?',
            o: 'Ask them where they’ve had the best hot chocolate.',
            a: [
              ['My sofa, under a blanket', 'Chocolate moustache guaranteed.'],
              ['A park bench, flask in hand', 'The squirrels are jealous.'],
              ['A buzzing café in town', 'Chatter and laughter, I love it.'],
            ],
          },
          es: {
            t: '¿Tu sitio favorito para un chocolate caliente?',
            o: 'Pregúntale dónde ha tomado el mejor chocolate caliente.',
            a: [
              ['Mi sofá, bajo una manta', 'Bigote de chocolate asegurado.'],
              ['Un banco del parque, termo en mano', 'Las ardillas tienen envidia.'],
              ['Una cafetería animada del centro', 'Charlas y risas, me encanta.'],
            ],
          },
          pt: {
            t: 'Seu lugar favorito para um chocolate quente?',
            o: 'Pergunte onde essa pessoa tomou o melhor chocolate quente.',
            a: [
              ['Meu sofá, debaixo de uma manta', 'Bigode de chocolate garantido.'],
              ['Um banco de praça, garrafa térmica na mão', 'Os esquilos estão com inveja.'],
              ['Um café animado na cidade', 'Conversa e risada, adoro.'],
            ],
          },
          nl: {
            t: 'Je favoriete plek voor warme chocolademelk?',
            o: 'Vraag waar die persoon de lekkerste warme chocolademelk dronk.',
            a: [
              ['Mijn bank, onder een dekentje', 'Chocoladesnor gegarandeerd.'],
              ['Een bankje in het park, thermosfles erbij', 'De eekhoorns zijn jaloers.'],
              ['Een levendig café in de stad', 'Gekwebbel en gelach, heerlijk.'],
            ],
          },
        }),
        s('rituels_pause_duree', 'elan', ['⏱️', 100, 'projets'], ['🐌', -100, 'temps_libre'], {
          fr: { t: 'Ta pause, elle dure…', o: 'Demande-lui à quoi ressemble sa pause idéale.', a: [['Deux minutes, j’ai des choses à faire', 'Hop, on y retourne !'], ['Le temps qu’il faut, rien ne presse', 'Je suis l’escargot officiel de la pause.']], m: 'Un quart d’heure bien mérité.' },
          en: { t: 'Your break lasts…', o: 'Ask them what their ideal break looks like.', a: [['Two minutes, I’ve got things to do', 'Right, back to it!'], ['As long as it takes, no rush', 'I’m the official break snail.']], m: 'A well-earned fifteen minutes.' },
          es: { t: 'Tu pausa dura…', o: 'Pregúntale cómo sería su pausa ideal.', a: [['Dos minutos, tengo cosas que hacer', '¡Venga, de vuelta!'], ['Lo que haga falta, sin prisa', 'Soy el caracol oficial de la pausa.']], m: 'Un cuarto de hora bien merecido.' },
          pt: { t: 'Sua pausa dura…', o: 'Pergunte como é a pausa ideal dessa pessoa.', a: [['Dois minutos, tenho coisas para fazer', 'Bora, de volta!'], ['O tempo que precisar, sem pressa', 'Sou o caracol oficial da pausa.']], m: 'Quinze minutos bem merecidos.' },
          nl: { t: 'Je pauze duurt…', o: 'Vraag hoe de ideale pauze van die persoon eruitziet.', a: [['Twee minuten, ik heb dingen te doen', 'Hup, weer aan de slag!'], ['Zo lang als nodig, geen haast', 'Ik ben de officiële pauzeslak.']], m: 'Een welverdiend kwartiertje.' },
        }),
      ],
    },
    {
      id: 'rituels_3',
      title: { fr: 'Les trajets', en: 'Getting around', es: 'Los trayectos', pt: 'Os trajetos', nl: 'Onderweg' },
      questions: [
        s('rituels_chemin', 'ancrage', ['🛤️', -100, 'racines'], ['🔀', 100, 'curiosite'], {
          fr: { t: 'Pour aller quelque part que tu connais, tu prends…', o: 'Demande-lui si elle ou il prend toujours le même chemin.', a: [['Toujours le même chemin', 'Je connais chaque pavé par son prénom.'], ['Un chemin différent à chaque fois', 'Tiens, une rue inconnue !']], m: 'Parfois un petit détour.' },
          en: { t: 'To get somewhere familiar, you take…', o: 'Ask them whether they always take the same route.', a: [['The same route every time', 'I know every cobblestone by name.'], ['A different way each time', 'Ooh, a street I don’t know!']], m: 'A little detour now and then.' },
          es: { t: 'Para ir a un sitio que conoces, tomas…', o: 'Pregúntale si siempre va por el mismo camino.', a: [['Siempre el mismo camino', 'Conozco cada adoquín por su nombre.'], ['Un camino distinto cada vez', '¡Anda, una calle nueva!']], m: 'A veces un pequeño desvío.' },
          pt: { t: 'Para ir a um lugar que você conhece, você pega…', o: 'Pergunte se essa pessoa sempre faz o mesmo caminho.', a: [['Sempre o mesmo caminho', 'Conheço cada pedrinha pelo nome.'], ['Um caminho diferente cada vez', 'Olha, uma rua nova!']], m: 'Às vezes um pequeno desvio.' },
          nl: { t: 'Om ergens te komen waar je de weg kent, neem je…', o: 'Vraag of die persoon altijd dezelfde route neemt.', a: [['Altijd dezelfde route', 'Ik ken elke kei bij naam.'], ['Elke keer een andere weg', 'Hé, een onbekende straat!']], m: 'Soms een klein ommetje.' },
        }),
        c('rituels_trajet_ecoute', 'elan', [['🎧', -30, 'musique'], ['🧠', 60, 'projets'], ['👀', -60, 'calme']], {
          fr: {
            t: 'Pendant tes trajets, tu…',
            o: 'Demande-lui ce qu’elle ou il écoute en chemin.',
            a: [
              ['Écoutes ta playlist favorite', 'Je bouge la tête en rythme.'],
              ['Écoutes un podcast pour apprendre', 'Une petite leçon par trajet.'],
              ['Regardes dehors et rêvasses', 'Les nuages ont de drôles de formes.'],
            ],
          },
          en: {
            t: 'When you’re travelling around, you…',
            o: 'Ask them what they listen to on the way.',
            a: [
              ['Listen to your favourite playlist', 'I’m nodding along.'],
              ['Listen to a podcast to learn something', 'A mini lesson every trip.'],
              ['Look outside and daydream', 'The clouds have funny shapes.'],
            ],
          },
          es: {
            t: 'Durante tus trayectos, tú…',
            o: 'Pregúntale qué escucha por el camino.',
            a: [
              ['Escuchas tu lista favorita', 'Muevo la cabeza al ritmo.'],
              ['Escuchas un pódcast para aprender', 'Una lección por trayecto.'],
              ['Miras por la ventana y sueñas despierto', 'Las nubes tienen formas graciosas.'],
            ],
          },
          pt: {
            t: 'Nos seus trajetos, você…',
            o: 'Pergunte o que essa pessoa escuta no caminho.',
            a: [
              ['Escuta sua playlist favorita', 'Balanço a cabeça no ritmo.'],
              ['Escuta um podcast para aprender', 'Uma liçãozinha por trajeto.'],
              ['Olha pela janela e sonha acordado', 'As nuvens têm formas engraçadas.'],
            ],
          },
          nl: {
            t: 'Onderweg doe je…',
            o: 'Vraag waar die persoon onderweg naar luistert.',
            a: [
              ['Je favoriete playlist luisteren', 'Ik knik mee op de maat.'],
              ['Een podcast om iets te leren', 'Elke rit een lesje.'],
              ['Naar buiten kijken en dagdromen', 'De wolken hebben grappige vormen.'],
            ],
          },
        }),
        c('rituels_avance', 'cap', [['🏃', -60, 'spontane'], ['⏰', 70, 'plan']], {
          fr: {
            t: 'Pour un rendez-vous, tu pars…',
            o: 'Demande-lui si elle ou il arrive plutôt en avance ou pile à l’heure.',
            a: [
              ['Pile à l’heure… en courant', 'Sprint final et… ouf, à l’heure !'],
              ['Avec dix minutes d’avance', 'Le temps de tout observer.'],
            ],
          },
          en: {
            t: 'For an appointment, you leave…',
            o: 'Ask them whether they tend to be early or right on time.',
            a: [
              ['Just in time… running', 'Final sprint and… made it!'],
              ['Ten minutes early', 'Time to take everything in.'],
            ],
          },
          es: {
            t: 'Para una cita, sales…',
            o: 'Pregúntale si suele llegar pronto o justo a tiempo.',
            a: [
              ['Justo a tiempo… corriendo', 'Sprint final y… ¡llegamos!'],
              ['Con diez minutos de margen', 'Tiempo para observarlo todo.'],
            ],
          },
          pt: {
            t: 'Para um compromisso, você sai…',
            o: 'Pergunte se essa pessoa costuma chegar adiantada ou em cima da hora.',
            a: [
              ['Em cima da hora… correndo', 'Sprint final e… cheguei!'],
              ['Com dez minutos de folga', 'Dá tempo de observar tudo.'],
            ],
          },
          nl: {
            t: 'Voor een afspraak vertrek je…',
            o: 'Vraag of die persoon meestal te vroeg of precies op tijd is.',
            a: [
              ['Precies op tijd… rennend', 'Eindsprint en… gehaald!'],
              ['Tien minuten te vroeg', 'Tijd om alles te bekijken.'],
            ],
          },
        }),
        c('rituels_bus', 'foyer', [['🗣️', 60, 'accueil'], ['🎧', -50, 'liberte']], {
          fr: {
            t: 'Dans le bus, quelqu’un que tu connais monte. Tu…',
            o: 'Demande-lui si elle ou il aime papoter pendant les trajets.',
            a: [
              ['Lui fais signe de s’asseoir à côté', 'Viens, il y a de la place !'],
              ['Fais un sourire et gardes ton casque', 'Un sourire, ça suffit parfois.'],
            ],
          },
          en: {
            t: 'Someone you know gets on your bus. You…',
            o: 'Ask them whether they like chatting on their commute.',
            a: [
              ['Wave them over to sit next to you', 'Come on, there’s room!'],
              ['Smile and keep your headphones on', 'Sometimes a smile is enough.'],
            ],
          },
          es: {
            t: 'En el bus sube alguien que conoces. Tú…',
            o: 'Pregúntale si le gusta charlar en los trayectos.',
            a: [
              ['Le haces señas para que se siente contigo', '¡Ven, hay sitio!'],
              ['Sonríes y te dejas los cascos', 'A veces basta una sonrisa.'],
            ],
          },
          pt: {
            t: 'No ônibus, entra alguém que você conhece. Você…',
            o: 'Pergunte se essa pessoa gosta de bater papo nos trajetos.',
            a: [
              ['Faz sinal para sentar do seu lado', 'Vem, tem lugar!'],
              ['Sorri e continua de fone', 'Às vezes um sorriso basta.'],
            ],
          },
          nl: {
            t: 'In de bus stapt iemand in die je kent. Je…',
            o: 'Vraag of die persoon onderweg graag kletst.',
            a: [
              ['Gebaart dat die naast je komt zitten', 'Kom, er is plek!'],
              ['Glimlacht en houdt je koptelefoon op', 'Soms is een glimlach genoeg.'],
            ],
          },
        }),
        c('rituels_trajet_mode', 'rythme', [['🚶', -50, 'calme'], ['🚲', 20, 'sport'], ['🚇', 60, 'ville']], {
          fr: {
            t: 'Ton trajet préféré du quotidien ?',
            o: 'Demande-lui comment elle ou il aime se déplacer en ville.',
            a: [
              ['À pied, par les petites rues calmes', 'On compte les chats aux fenêtres ?'],
              ['À vélo, le vent dans les cheveux', 'Dring dring, place au vélo !'],
              ['En métro, au milieu de la foule', 'Tout le monde a une histoire.'],
            ],
          },
          en: {
            t: 'Your favourite everyday way to get around?',
            o: 'Ask them how they like to get around town.',
            a: [
              ['On foot, through quiet little streets', 'Shall we count cats in windows?'],
              ['By bike, wind in my hair', 'Ring ring, bike coming through!'],
              ['By underground, amid the crowd', 'Everyone has a story.'],
            ],
          },
          es: {
            t: '¿Tu forma favorita de moverte cada día?',
            o: 'Pregúntale cómo le gusta moverse por la ciudad.',
            a: [
              ['A pie, por callejuelas tranquilas', '¿Contamos gatos en las ventanas?'],
              ['En bici, con el viento en la cara', '¡Rin rin, paso a la bici!'],
              ['En metro, entre la multitud', 'Todo el mundo tiene una historia.'],
            ],
          },
          pt: {
            t: 'Seu jeito favorito de se deslocar no dia a dia?',
            o: 'Pergunte como essa pessoa gosta de circular pela cidade.',
            a: [
              ['A pé, por ruazinhas tranquilas', 'Vamos contar gatos nas janelas?'],
              ['De bicicleta, vento no cabelo', 'Trim trim, abre caminho!'],
              ['De metrô, no meio da multidão', 'Todo mundo tem uma história.'],
            ],
          },
          nl: {
            t: 'Je favoriete manier om je dagelijks te verplaatsen?',
            o: 'Vraag hoe die persoon zich graag door de stad beweegt.',
            a: [
              ['Te voet, door rustige straatjes', 'Zullen we katten voor het raam tellen?'],
              ['Op de fiets, wind door mijn haar', 'Tring tring, fiets erdoor!'],
              ['Met de metro, tussen de drukte', 'Iedereen heeft een verhaal.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_4',
      title: { fr: 'Le soir', en: 'Evenings', es: 'La noche', pt: 'A noite', nl: 'De avond' },
      questions: [
        c('rituels_soir_retour', 'rythme', [['🍝', 0, 'cuisine'], ['🧦', -70, 'cocooning'], ['📞', 60, 'monde']], {
          fr: {
            t: 'En rentrant le soir, tu…',
            o: 'Demande-lui ce qu’elle ou il fait en premier en rentrant le soir.',
            a: [
              ['Files en cuisine', 'Ça sent bon, je mets la table.'],
              ['Enfiles tes chaussons, direct', 'Chaussons : activés.'],
              ['Proposes une sortie à des amis', 'On ressort ? Je prends mon écharpe !'],
            ],
          },
          en: {
            t: 'When you get home in the evening, you…',
            o: 'Ask them what they do first when they get home at night.',
            a: [
              ['Head straight to the kitchen', 'Smells good, I’ll set the table.'],
              ['Pop your slippers on, right away', 'Slippers: activated.'],
              ['Suggest going out with friends', 'Back out? I’ll grab my scarf!'],
            ],
          },
          es: {
            t: 'Al volver a casa por la noche, tú…',
            o: 'Pregúntale qué es lo primero que hace al llegar a casa.',
            a: [
              ['Vas directo a la cocina', 'Qué bien huele, pongo la mesa.'],
              ['Te pones las zapatillas, sin más', 'Zapatillas: activadas.'],
              ['Propones salir con amigos', '¿Volvemos a salir? ¡Cojo la bufanda!'],
            ],
          },
          pt: {
            t: 'Chegando em casa à noite, você…',
            o: 'Pergunte o que essa pessoa faz primeiro ao chegar em casa.',
            a: [
              ['Vai direto para a cozinha', 'Que cheiro bom, vou pôr a mesa.'],
              ['Calça as pantufas na hora', 'Pantufas: ativadas.'],
              ['Chama os amigos para sair', 'Vamos sair de novo? Pego meu cachecol!'],
            ],
          },
          nl: {
            t: 'Als je ’s avonds thuiskomt…',
            o: 'Vraag wat die persoon ’s avonds als eerste doet bij thuiskomst.',
            a: [
              ['Duik je meteen de keuken in', 'Ruikt lekker, ik dek de tafel.'],
              ['Trek je meteen je sloffen aan', 'Sloffen: geactiveerd.'],
              ['Stel je vrienden voor om uit te gaan', 'Weer op pad? Ik pak mijn sjaal!'],
            ],
          },
        }),
        s('rituels_soiree_prevue', 'cap', ['🎲', -100, 'spontane'], ['🗓️', 100, 'plan'], {
          fr: { t: 'Ta soirée, elle est plutôt…', o: 'Demande-lui à quoi ressemble une soirée type pour elle ou lui.', a: [['Improvisée, on verra bien', 'La soirée surprise, à chaque fois !'], ['Prévue depuis le matin', 'Programme affiché, rien ne m’échappe.']], m: 'Une idée, mais rien de fixe.' },
          en: { t: 'Your evening is usually…', o: 'Ask them what a typical evening looks like for them.', a: [['Improvised, we’ll see', 'A mystery evening every time!'], ['Planned since the morning', 'Schedule posted, I miss nothing.']], m: 'An idea, but nothing fixed.' },
          es: { t: 'Tu noche suele ser…', o: 'Pregúntale cómo es una noche normal para esa persona.', a: [['Improvisada, ya veremos', '¡Noche sorpresa cada vez!'], ['Planeada desde la mañana', 'Programa a la vista, no se me escapa nada.']], m: 'Una idea, pero nada fijo.' },
          pt: { t: 'Sua noite costuma ser…', o: 'Pergunte como é uma noite típica para essa pessoa.', a: [['Improvisada, a gente vê', 'Noite surpresa toda vez!'], ['Planejada desde de manhã', 'Programação na parede, não perco nada.']], m: 'Uma ideia, mas nada fixo.' },
          nl: { t: 'Je avond is meestal…', o: 'Vraag hoe een gewone avond er bij die persoon uitziet.', a: [['Geïmproviseerd, we zien wel', 'Elke keer een verrassingsavond!'], ['Al sinds de ochtend gepland', 'Programma hangt op, ik mis niks.']], m: 'Een idee, maar niks vast.' },
        }),
        c('rituels_coucher', 'ancrage', [['📖', -50, 'racines'], ['🌐', 60, 'curiosite'], ['🎵', 0, 'musique']], {
          fr: {
            t: 'Avant de dormir, ton rituel ?',
            o: 'Demande-lui ce qu’elle ou il fait juste avant de dormir.',
            a: [
              ['Quelques pages de mon livre de chevet', 'Encore une page… et une autre.'],
              ['Un documentaire sur un sujet inconnu', 'Tu savais que les pieuvres… zzz.'],
              ['Une musique douce', 'Je fredonne la berceuse.'],
            ],
          },
          en: {
            t: 'Your bedtime ritual?',
            o: 'Ask them what they do just before falling asleep.',
            a: [
              ['A few pages of my bedside book', 'One more page… and another.'],
              ['A documentary on something new', 'Did you know octopuses… zzz.'],
              ['Some soft music', 'I’m humming the lullaby.'],
            ],
          },
          es: {
            t: '¿Tu ritual antes de dormir?',
            o: 'Pregúntale qué hace justo antes de dormirse.',
            a: [
              ['Unas páginas de mi libro de mesilla', 'Otra página… y otra.'],
              ['Un documental sobre algo desconocido', '¿Sabías que los pulpos…? zzz.'],
              ['Música suave', 'Tarareo la nana.'],
            ],
          },
          pt: {
            t: 'Seu ritual antes de dormir?',
            o: 'Pergunte o que essa pessoa faz logo antes de dormir.',
            a: [
              ['Algumas páginas do meu livro de cabeceira', 'Mais uma página… e outra.'],
              ['Um documentário sobre algo desconhecido', 'Sabia que os polvos… zzz.'],
              ['Uma música suave', 'Cantarolo a canção de ninar.'],
            ],
          },
          nl: {
            t: 'Je ritueel voor het slapengaan?',
            o: 'Vraag wat die persoon doet vlak voor het slapen.',
            a: [
              ['Een paar bladzijden uit mijn boek', 'Nog één bladzijde… en nog één.'],
              ['Een documentaire over iets onbekends', 'Wist je dat octopussen… zzz.'],
              ['Rustige muziek', 'Ik neurie het slaapliedje.'],
            ],
          },
        }),
        c('rituels_soir_projet', 'elan', [['🛋️', -70, 'temps_libre'], ['🛠️', 60, 'projets']], {
          fr: {
            t: 'Le soir, tu aimes…',
            o: 'Demande-lui ce qui occupe ses soirées en ce moment.',
            a: [
              ['Ne plus rien faire du tout', 'Mode veille enclenché.'],
              ['Avancer sur un projet perso', 'Encore une étape, et au lit.'],
            ],
          },
          en: {
            t: 'In the evening, you like to…',
            o: 'Ask them what fills their evenings at the moment.',
            a: [
              ['Do absolutely nothing', 'Standby mode engaged.'],
              ['Make progress on a personal project', 'One more step, then bed.'],
            ],
          },
          es: {
            t: 'Por la noche, te gusta…',
            o: 'Pregúntale a qué dedica sus noches ahora mismo.',
            a: [
              ['No hacer absolutamente nada', 'Modo reposo activado.'],
              ['Avanzar en un proyecto personal', 'Un paso más y a la cama.'],
            ],
          },
          pt: {
            t: 'À noite, você gosta de…',
            o: 'Pergunte com o que essa pessoa ocupa as noites ultimamente.',
            a: [
              ['Não fazer absolutamente nada', 'Modo descanso ativado.'],
              ['Avançar num projeto pessoal', 'Mais uma etapa e cama.'],
            ],
          },
          nl: {
            t: '’s Avonds vind je het fijn om…',
            o: 'Vraag waar die persoon de avonden nu mee vult.',
            a: [
              ['Helemaal niks meer te doen', 'Slaapstand ingeschakeld.'],
              ['Aan een eigen project te werken', 'Nog één stap, dan naar bed.'],
            ],
          },
        }),
        c('rituels_diner', 'foyer', [['🍲', 70, 'famille'], ['🍱', -60, 'liberte']], {
          fr: {
            t: 'Le dîner du soir, idéalement, c’est…',
            o: 'Demande-lui comment se passe son dîner idéal.',
            a: [
              ['Autour d’une table, à plusieurs', 'Passe-moi le pain, s’il te plaît !'],
              ['Un plateau à ma façon, à mon rythme', 'Pique-nique dans le salon, j’adore.'],
            ],
          },
          en: {
            t: 'Dinner, ideally, is…',
            o: 'Ask them what their ideal dinner is like.',
            a: [
              ['Round a table, with others', 'Pass the bread, please!'],
              ['A tray my way, at my own pace', 'Living-room picnic, love it.'],
            ],
          },
          es: {
            t: 'La cena, idealmente, es…',
            o: 'Pregúntale cómo es su cena ideal.',
            a: [
              ['Alrededor de una mesa, con gente', '¡Pásame el pan, porfa!'],
              ['Una bandeja a mi manera, a mi ritmo', 'Pícnic en el salón, me encanta.'],
            ],
          },
          pt: {
            t: 'O jantar, idealmente, é…',
            o: 'Pergunte como é o jantar ideal dessa pessoa.',
            a: [
              ['Em volta da mesa, com mais gente', 'Me passa o pão, por favor!'],
              ['Uma bandeja do meu jeito, no meu ritmo', 'Piquenique na sala, adoro.'],
            ],
          },
          nl: {
            t: 'Het avondeten is idealiter…',
            o: 'Vraag hoe het ideale avondeten van die persoon eruitziet.',
            a: [
              ['Aan tafel, met meerderen', 'Geef je het brood even door?'],
              ['Een dienblad op mijn manier, in mijn tempo', 'Picknick in de woonkamer, top.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_5',
      title: { fr: 'Le week-end', en: 'Weekends', es: 'El fin de semana', pt: 'O fim de semana', nl: 'Het weekend' },
      questions: [
        s('rituels_samedi', 'rythme', ['🏠', -100, 'cocooning'], ['🎡', 100, 'monde'], {
          fr: { t: 'Ton samedi type…', o: 'Demande-lui à quoi ressemble son samedi idéal.', a: [['Sans mettre le nez dehors', 'Le canapé t’appelle.'], ['Dehors du matin au soir', 'J’ai déjà mes baskets aux pieds !']], m: 'Une sortie, puis la maison.' },
          en: { t: 'Your typical Saturday…', o: 'Ask them what their ideal Saturday looks like.', a: [['Without setting foot outside', 'The sofa is calling you.'], ['Out from morning till night', 'I’ve got my trainers on already!']], m: 'One outing, then home.' },
          es: { t: 'Tu sábado típico…', o: 'Pregúntale cómo es su sábado ideal.', a: [['Sin asomar la nariz a la calle', 'El sofá te llama.'], ['Fuera de la mañana a la noche', '¡Ya tengo las zapatillas puestas!']], m: 'Una salida y luego a casa.' },
          pt: { t: 'Seu sábado típico…', o: 'Pergunte como é o sábado ideal dessa pessoa.', a: [['Sem pôr o pé na rua', 'O sofá está te chamando.'], ['Na rua de manhã até a noite', 'Já estou de tênis!']], m: 'Um passeio, depois casa.' },
          nl: { t: 'Je typische zaterdag…', o: 'Vraag hoe de ideale zaterdag van die persoon eruitziet.', a: [['Zonder een voet buiten de deur', 'De bank roept je.'], ['Van ’s ochtends tot ’s avonds op pad', 'Mijn sneakers zitten al aan!']], m: 'Eén uitje, dan naar huis.' },
        }),
        c('rituels_dimanche_matin', 'ancrage', [['🗺️', 70, 'aventure'], ['🧺', -50, 'racines'], ['🛌', -10, null]], {
          fr: {
            t: 'Le dimanche matin, tu…',
            o: 'Demande-lui ce qu’elle ou il fait le dimanche matin.',
            a: [
              ['Pars découvrir un village inconnu', 'En route vers l’inconnu !'],
              ['Fais ton marché habituel', 'Bonjour au marchand de fruits !'],
              ['Fais la grasse matinée', 'Encore cinq minutes… ou cinquante.'],
            ],
          },
          en: {
            t: 'On Sunday mornings, you…',
            o: 'Ask them what they get up to on Sunday mornings.',
            a: [
              ['Go off to discover an unknown village', 'Off into the unknown!'],
              ['Do your usual market round', 'Morning to the fruit seller!'],
              ['Have a long lie-in', 'Five more minutes… or fifty.'],
            ],
          },
          es: {
            t: 'El domingo por la mañana, tú…',
            o: 'Pregúntale qué hace los domingos por la mañana.',
            a: [
              ['Sales a descubrir un pueblo desconocido', '¡Rumbo a lo desconocido!'],
              ['Haces tu mercado de siempre', '¡Buenos días al frutero!'],
              ['Te quedas en la cama hasta tarde', 'Cinco minutos más… o cincuenta.'],
            ],
          },
          pt: {
            t: 'No domingo de manhã, você…',
            o: 'Pergunte o que essa pessoa faz no domingo de manhã.',
            a: [
              ['Sai para descobrir uma cidadezinha nova', 'Rumo ao desconhecido!'],
              ['Vai à feira de sempre', 'Bom dia, moço da fruta!'],
              ['Dorme até tarde', 'Mais cinco minutinhos… ou cinquenta.'],
            ],
          },
          nl: {
            t: 'Op zondagochtend…',
            o: 'Vraag wat die persoon op zondagochtend doet.',
            a: [
              ['Ga je een onbekend dorpje ontdekken', 'Op naar het onbekende!'],
              ['Doe je je vaste rondje op de markt', 'Goedemorgen, groenteman!'],
              ['Slaap je lekker uit', 'Nog vijf minuutjes… of vijftig.'],
            ],
          },
        }),
        c('rituels_weekend_plan', 'cap', [['📝', 70, 'plan'], ['📌', 20, null], ['🎲', -70, 'spontane']], {
          fr: {
            t: 'Ton week-end, tu le…',
            o: 'Demande-lui quand elle ou il prévoit son week-end.',
            a: [
              ['Prépares dès le mercredi', 'Tout est calé, chapeau.'],
              ['Organises autour d’une seule activité', 'Un point fixe, le reste en roue libre.'],
              ['Décides le samedi matin', 'Pile ou face, on verra bien !'],
            ],
          },
          en: {
            t: 'Your weekend, you…',
            o: 'Ask them when they plan their weekend.',
            a: [
              ['Plan it from Wednesday', 'All sorted, hats off.'],
              ['Build around a single activity', 'One fixed point, the rest freewheeling.'],
              ['Decide on Saturday morning', 'Heads or tails, we’ll see!'],
            ],
          },
          es: {
            t: 'Tu fin de semana, lo…',
            o: 'Pregúntale cuándo planea su fin de semana.',
            a: [
              ['Preparas desde el miércoles', 'Todo atado, chapó.'],
              ['Organizas en torno a un solo plan', 'Un punto fijo, lo demás a la aventura.'],
              ['Decides el sábado por la mañana', '¡Cara o cruz, ya veremos!'],
            ],
          },
          pt: {
            t: 'Seu fim de semana, você…',
            o: 'Pergunte quando essa pessoa planeja o fim de semana.',
            a: [
              ['Prepara desde quarta-feira', 'Tudo certinho, parabéns.'],
              ['Organiza em torno de uma só atividade', 'Um ponto fixo, o resto solto.'],
              ['Decide no sábado de manhã', 'Cara ou coroa, a gente vê!'],
            ],
          },
          nl: {
            t: 'Je weekend…',
            o: 'Vraag wanneer die persoon het weekend plant.',
            a: [
              ['Bereid je al op woensdag voor', 'Alles geregeld, petje af.'],
              ['Plan je rond één activiteit', 'Eén vast punt, de rest op de bonnefooi.'],
              ['Beslis je op zaterdagochtend', 'Kop of munt, we zien wel!'],
            ],
          },
        }),
        c('rituels_brunch', 'foyer', [['🥐', -60, 'liberte'], ['🥞', 70, 'famille']], {
          fr: {
            t: 'Le brunch du dimanche…',
            o: 'Demande-lui à quoi ressemble son brunch idéal.',
            a: [
              ['En solo, avec un bon livre', 'Toi, ton livre et ton croissant.'],
              ['Une grande tablée, c’est mon rendez-vous', 'Qui reprend des pancakes ?'],
            ],
          },
          en: {
            t: 'Sunday brunch…',
            o: 'Ask them what their ideal brunch looks like.',
            a: [
              ['Solo, with a good book', 'You, your book and your croissant.'],
              ['A big table of people, it’s my ritual', 'Who wants more pancakes?'],
            ],
          },
          es: {
            t: 'El brunch del domingo…',
            o: 'Pregúntale cómo es su brunch ideal.',
            a: [
              ['A solas, con un buen libro', 'Tú, tu libro y tu cruasán.'],
              ['Una mesa grande, es mi cita fija', '¿Quién repite tortitas?'],
            ],
          },
          pt: {
            t: 'O brunch de domingo…',
            o: 'Pergunte como é o brunch ideal dessa pessoa.',
            a: [
              ['Na minha, com um bom livro', 'Você, seu livro e seu croissant.'],
              ['Uma mesa cheia, é meu encontro fixo', 'Quem quer mais panqueca?'],
            ],
          },
          nl: {
            t: 'De zondagse brunch…',
            o: 'Vraag hoe de ideale brunch van die persoon eruitziet.',
            a: [
              ['In mijn eentje, met een goed boek', 'Jij, je boek en je croissant.'],
              ['Een lange tafel vol mensen, mijn vaste afspraak', 'Wie wil er nog pannenkoeken?'],
            ],
          },
        }),
        c('rituels_weekend_defi', 'elan', [['🧗', 70, 'sport'], ['😴', -70, 'temps_libre']], {
          fr: {
            t: 'Le week-end, ton rituel c’est plutôt…',
            o: 'Demande-lui ce qu’elle ou il a fait le week-end dernier.',
            a: [
              ['Un défi : rando, escalade, atelier…', 'Encore un sommet, allez !'],
              ['Recharger les batteries', 'Batterie : 3 %… 50 %… 100 %.'],
            ],
          },
          en: {
            t: 'At the weekend, your ritual is more…',
            o: 'Ask them what they did last weekend.',
            a: [
              ['A challenge: hike, climbing, workshop…', 'One more summit, come on!'],
              ['Recharging my batteries', 'Battery: 3%… 50%… 100%.'],
            ],
          },
          es: {
            t: 'El fin de semana, tu ritual es más bien…',
            o: 'Pregúntale qué hizo el fin de semana pasado.',
            a: [
              ['Un reto: ruta, escalada, taller…', '¡Otra cima, vamos!'],
              ['Recargar pilas', 'Batería: 3 %… 50 %… 100 %.'],
            ],
          },
          pt: {
            t: 'No fim de semana, seu ritual é mais…',
            o: 'Pergunte o que essa pessoa fez no último fim de semana.',
            a: [
              ['Um desafio: trilha, escalada, oficina…', 'Mais um cume, vamos!'],
              ['Recarregar as baterias', 'Bateria: 3%… 50%… 100%.'],
            ],
          },
          nl: {
            t: 'In het weekend is je ritueel eerder…',
            o: 'Vraag wat die persoon afgelopen weekend deed.',
            a: [
              ['Een uitdaging: wandeltocht, klimmen, workshop…', 'Nog een top, kom op!'],
              ['De batterij opladen', 'Batterij: 3%… 50%… 100%.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_6',
      title: { fr: 'Chez toi', en: 'At home', es: 'En casa', pt: 'Em casa', nl: 'Thuis' },
      questions: [
        c('rituels_menage', 'cap', [['🌪️', -60, 'spontane'], ['🎶', 0, 'musique'], ['📅', 70, 'ordre']], {
          fr: {
            t: 'Le ménage, chez toi…',
            o: 'Demande-lui comment elle ou il s’organise pour le ménage.',
            a: [
              ['Quand l’envie me prend', 'Tornade de propreté en approche !'],
              ['En musique, ça passe mieux', 'Le balai devient micro.'],
              ['Un jour fixe, chaque semaine', 'Mardi, jour du plumeau.'],
            ],
          },
          en: {
            t: 'Housework, at your place…',
            o: 'Ask them how they organise their cleaning.',
            a: [
              ['When the mood strikes', 'Cleaning tornado incoming!'],
              ['With music, it goes down better', 'The broom becomes a microphone.'],
              ['On a set day, every week', 'Tuesday is feather-duster day.'],
            ],
          },
          es: {
            t: 'La limpieza, en tu casa…',
            o: 'Pregúntale cómo se organiza con la limpieza.',
            a: [
              ['Cuando me da el punto', '¡Tornado de limpieza a la vista!'],
              ['Con música, se lleva mejor', 'La escoba se convierte en micro.'],
              ['Un día fijo cada semana', 'Martes, día del plumero.'],
            ],
          },
          pt: {
            t: 'A faxina, na sua casa…',
            o: 'Pergunte como essa pessoa se organiza com a faxina.',
            a: [
              ['Quando dá vontade', 'Furacão da limpeza chegando!'],
              ['Com música, fica mais leve', 'A vassoura vira microfone.'],
              ['Um dia fixo, toda semana', 'Terça é dia do espanador.'],
            ],
          },
          nl: {
            t: 'Het huishouden, bij jou thuis…',
            o: 'Vraag hoe die persoon het schoonmaken regelt.',
            a: [
              ['Als ik er zin in heb', 'Schoonmaaktornado in aantocht!'],
              ['Met muziek, dan gaat het beter', 'De bezem wordt een microfoon.'],
              ['Een vaste dag, elke week', 'Dinsdag is plumeaudag.'],
            ],
          },
        }),
        s('rituels_chantier', 'elan', ['🔨', 100, 'projets'], ['🛋️', -100, 'cocooning'], {
          fr: { t: 'Améliorer ton chez-toi (bricoler, réaménager…)…', o: 'Demande-lui quel est son prochain petit projet pour chez elle ou lui.', a: [['Toujours un chantier en cours', 'Passe-moi le tournevis !'], ['Tout est bien, je profite', 'On ne touche à rien, c’est parfait.']], m: 'Un petit projet de temps en temps.' },
          en: { t: 'Improving your home (DIY, rearranging…)…', o: 'Ask them what their next little home project is.', a: [['There’s always something on the go', 'Pass me the screwdriver!'], ['It’s all fine, I just enjoy it', 'Don’t touch a thing, it’s perfect.']], m: 'A small project now and then.' },
          es: { t: 'Mejorar tu casa (bricolaje, redecorar…)…', o: 'Pregúntale cuál es su próximo proyectito para casa.', a: [['Siempre hay una obra en marcha', '¡Pásame el destornillador!'], ['Todo está bien, disfruto', 'No tocamos nada, es perfecto.']], m: 'Un proyectito de vez en cuando.' },
          pt: { t: 'Melhorar a sua casa (consertar, reorganizar…)…', o: 'Pergunte qual é o próximo projetinho dessa pessoa para a casa.', a: [['Sempre tem uma obra rolando', 'Me passa a chave de fenda!'], ['Está tudo ótimo, eu curto', 'Não mexe em nada, está perfeito.']], m: 'Um projetinho de vez em quando.' },
          nl: { t: 'Je huis verbeteren (klussen, herinrichten…)…', o: 'Vraag wat het volgende kleine klusproject van die persoon is.', a: [['Er is altijd wel een klus bezig', 'Geef me de schroevendraaier!'], ['Alles is goed, ik geniet', 'Niks aanraken, het is perfect.']], m: 'Af en toe een klein projectje.' },
        }),
        c('rituels_deco', 'ancrage', [['🔄', 70, 'curiosite'], ['🖼️', -60, 'racines']], {
          fr: {
            t: 'Ta déco change…',
            o: 'Demande-lui quel objet de déco elle ou il ne changerait pour rien au monde.',
            a: [
              ['À chaque saison, j’aime le neuf', 'Nouveau décor, nouvelle humeur !'],
              ['Rarement, chaque objet a sa place', 'Chaque chose à sa place, rassurant.'],
            ],
          },
          en: {
            t: 'Your decor changes…',
            o: 'Ask them which decorative object they’d never part with.',
            a: [
              ['Every season, I love a fresh look', 'New decor, new mood!'],
              ['Rarely, everything has its place', 'A place for everything, so soothing.'],
            ],
          },
          es: {
            t: 'Tu decoración cambia…',
            o: 'Pregúntale qué objeto de decoración no cambiaría por nada.',
            a: [
              ['Cada temporada, me gusta lo nuevo', '¡Nueva deco, nuevo humor!'],
              ['Pocas veces, cada cosa tiene su sitio', 'Cada cosa en su sitio, qué paz.'],
            ],
          },
          pt: {
            t: 'Sua decoração muda…',
            o: 'Pergunte qual objeto de decoração essa pessoa não trocaria por nada.',
            a: [
              ['A cada estação, gosto de novidade', 'Decoração nova, humor novo!'],
              ['Raramente, cada objeto tem seu lugar', 'Cada coisa no seu lugar, que paz.'],
            ],
          },
          nl: {
            t: 'Je inrichting verandert…',
            o: 'Vraag van welk decoratiestuk die persoon nooit afstand zou doen.',
            a: [
              ['Elk seizoen, ik hou van iets nieuws', 'Nieuwe inrichting, nieuwe stemming!'],
              ['Zelden, alles heeft zijn plek', 'Alles op zijn plek, rustgevend.'],
            ],
          },
        }),
        c('rituels_recevoir', 'rythme', [['🍽️', 60, 'accueil'], ['☕', 0, null], ['🕯️', -60, 'calme']], {
          fr: {
            t: 'Recevoir du monde chez toi, c’est…',
            o: 'Demande-lui quand elle ou il a reçu du monde pour la dernière fois.',
            a: [
              ['Chaque semaine, porte ouverte', 'Toc toc ! Entrez, entrez !'],
              ['Un café de temps en temps', 'Juste ce qu’il faut.'],
              ['Rare, mon chez-moi est mon cocon', 'Ton cocon, je le garde au chaud.'],
            ],
          },
          en: {
            t: 'Having people over is…',
            o: 'Ask them when they last had people over.',
            a: [
              ['Every week, open house', 'Knock knock! Come in, come in!'],
              ['A coffee now and then', 'Just the right amount.'],
              ['Rare, my home is my cocoon', 'I’ll keep your cocoon cosy.'],
            ],
          },
          es: {
            t: 'Recibir gente en casa es…',
            o: 'Pregúntale cuándo recibió gente en casa por última vez.',
            a: [
              ['Cada semana, puertas abiertas', '¡Toc toc! ¡Pasad, pasad!'],
              ['Un café de vez en cuando', 'Lo justo.'],
              ['Poco, mi casa es mi refugio', 'Tu refugio, yo lo cuido.'],
            ],
          },
          pt: {
            t: 'Receber gente em casa é…',
            o: 'Pergunte quando essa pessoa recebeu gente em casa pela última vez.',
            a: [
              ['Toda semana, casa aberta', 'Toc toc! Entra, entra!'],
              ['Um café de vez em quando', 'Na medida certa.'],
              ['Raro, minha casa é meu ninho', 'Eu cuido do seu ninho.'],
            ],
          },
          nl: {
            t: 'Mensen over de vloer hebben is…',
            o: 'Vraag wanneer die persoon voor het laatst mensen thuis ontving.',
            a: [
              ['Elke week, open huis', 'Klop klop! Kom binnen, kom binnen!'],
              ['Af en toe een kopje koffie', 'Precies genoeg.'],
              ['Zelden, mijn huis is mijn cocon', 'Ik houd je cocon warm.'],
            ],
          },
        }),
        c('rituels_cles', 'foyer', [['🔒', -50, 'liberte'], ['🔑', 60, 'fidelite']], {
          fr: {
            t: 'Un double de tes clés…',
            o: 'Demande-lui si elle ou il aime que ses proches passent à l’improviste.',
            a: [
              ['Chez personne, mon espace est à moi', 'Ton royaume, ta clé.'],
              ['Chez des proches, ils passent quand ils veulent', 'Porte ouverte aux gens qu’on aime.'],
            ],
          },
          en: {
            t: 'A spare set of your keys…',
            o: 'Ask them whether they like loved ones dropping by unannounced.',
            a: [
              ['Nobody has one, my space is mine', 'Your kingdom, your key.'],
              ['Loved ones have one and drop by anytime', 'Open door for the people we love.'],
            ],
          },
          es: {
            t: 'Una copia de tus llaves…',
            o: 'Pregúntale si le gusta que su gente se pase sin avisar.',
            a: [
              ['No la tiene nadie, mi espacio es mío', 'Tu reino, tu llave.'],
              ['La tienen mis cercanos y vienen cuando quieren', 'Puerta abierta a quien quieres.'],
            ],
          },
          pt: {
            t: 'Uma cópia das suas chaves…',
            o: 'Pergunte se essa pessoa gosta que os mais próximos apareçam sem avisar.',
            a: [
              ['Ninguém tem, meu espaço é meu', 'Seu reino, sua chave.'],
              ['Pessoas próximas têm e vêm quando quiserem', 'Porta aberta para quem a gente ama.'],
            ],
          },
          nl: {
            t: 'Een reservesleutel van je huis…',
            o: 'Vraag of die persoon het fijn vindt als dierbaren onaangekondigd langskomen.',
            a: [
              ['Heeft niemand, mijn plek is van mij', 'Jouw koninkrijk, jouw sleutel.'],
              ['Hebben dierbaren, ze komen wanneer ze willen', 'Open deur voor wie je liefhebt.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_7',
      title: { fr: 'Avec tes proches', en: 'With your people', es: 'Con tu gente', pt: 'Com sua turma', nl: 'Met je dierbaren' },
      questions: [
        s('rituels_nouvelles', 'foyer', ['📵', -100, 'liberte'], ['📞', 100, 'famille'], {
          fr: { t: 'Donner des nouvelles à tes proches…', o: 'Demande-lui comment elle ou il garde le contact avec ses proches.', a: [['Quand j’y pense, sans rythme', 'Libre comme l’air.'], ['Un appel fixe chaque semaine', 'Dimanche, 18 h, le rendez-vous.']], m: 'Un petit message de temps en temps.' },
          en: { t: 'Keeping your loved ones posted…', o: 'Ask them how they keep in touch with their loved ones.', a: [['Whenever I think of it, no routine', 'Free as a bird.'], ['A set call every week', 'Sunday, 6 pm, it’s a date.']], m: 'A little message now and then.' },
          es: { t: 'Dar noticias a tu gente…', o: 'Pregúntale cómo mantiene el contacto con su gente.', a: [['Cuando me acuerdo, sin ritmo', 'Libre como el viento.'], ['Una llamada fija cada semana', 'Domingo, 18 h, la cita.']], m: 'Un mensajito de vez en cuando.' },
          pt: { t: 'Dar notícias para as pessoas queridas…', o: 'Pergunte como essa pessoa mantém contato com quem ama.', a: [['Quando lembro, sem ritmo', 'Livre como um passarinho.'], ['Uma ligação fixa toda semana', 'Domingo, 18h, encontro marcado.']], m: 'Uma mensagenzinha de vez em quando.' },
          nl: { t: 'Je dierbaren op de hoogte houden…', o: 'Vraag hoe die persoon contact houdt met dierbaren.', a: [['Als ik eraan denk, zonder ritme', 'Vrij als een vogel.'], ['Een vast belletje elke week', 'Zondag, 18 uur, vaste prik.']], m: 'Af en toe een berichtje.' },
        }),
        c('rituels_soiree_amis', 'ancrage', [['🍕', -60, 'racines'], ['🎯', 60, 'curiosite']], {
          fr: {
            t: 'Avec tes amis, vous avez plutôt…',
            o: 'Demande-lui quelle est la tradition de sa bande d’amis.',
            a: [
              ['La même soirée pizza depuis des années', 'Une tradition, ça se respecte.'],
              ['Une activité nouvelle à chaque fois', 'La prochaine fois : trapèze ?'],
            ],
          },
          en: {
            t: 'With your friends, you tend to have…',
            o: 'Ask them what their friend group’s tradition is.',
            a: [
              ['The same pizza night for years', 'A tradition deserves respect.'],
              ['A new activity every time', 'Next time: trapeze?'],
            ],
          },
          es: {
            t: 'Con tus amigos, tenéis más bien…',
            o: 'Pregúntale cuál es la tradición de su grupo de amigos.',
            a: [
              ['La misma noche de pizza desde hace años', 'Una tradición se respeta.'],
              ['Un plan nuevo cada vez', 'La próxima: ¿trapecio?'],
            ],
          },
          pt: {
            t: 'Com seus amigos, vocês têm mais…',
            o: 'Pergunte qual é a tradição da turma de amigos dessa pessoa.',
            a: [
              ['A mesma noite de pizza há anos', 'Tradição é tradição.'],
              ['Uma atividade nova a cada vez', 'Da próxima vez: trapézio?'],
            ],
          },
          nl: {
            t: 'Met je vrienden hebben jullie eerder…',
            o: 'Vraag wat de traditie van de vriendengroep van die persoon is.',
            a: [
              ['Al jaren dezelfde pizza-avond', 'Een traditie, die respecteer je.'],
              ['Elke keer een nieuwe activiteit', 'Volgende keer: trapeze?'],
            ],
          },
        }),
        c('rituels_retrouvailles', 'cap', [['📲', -70, 'spontane'], ['📆', 70, 'plan'], ['🔁', 20, null]], {
          fr: {
            t: 'Les retrouvailles entre amis, chez vous…',
            o: 'Demande-lui comment sa bande s’organise pour se voir.',
            a: [
              ['« Dispo ce soir ? » à la dernière minute', 'Ce soir ? J’enfile mes chaussures !'],
              ['Une date fixe dans l’agenda', 'Noté au stylo, pas au crayon.'],
              ['Un sondage pour trouver la date', 'Je coche toutes les cases.'],
            ],
          },
          en: {
            t: 'Getting together with friends, in your group…',
            o: 'Ask them how their group organises meet-ups.',
            a: [
              ['“Free tonight?” at the last minute', 'Tonight? I’m ready already!'],
              ['A fixed date in the diary', 'Written in pen, not pencil.'],
              ['A poll to find a date', 'I’m ticking every box.'],
            ],
          },
          es: {
            t: 'Los reencuentros con amigos, en tu grupo…',
            o: 'Pregúntale cómo se organiza su grupo para quedar.',
            a: [
              ['«¿Libre esta noche?» a última hora', '¿Esta noche? ¡Ya estoy listo!'],
              ['Una fecha fija en la agenda', 'Apuntado en boli, no a lápiz.'],
              ['Una encuesta para elegir fecha', 'Marco todas las casillas.'],
            ],
          },
          pt: {
            t: 'Os encontros com amigos, na sua turma…',
            o: 'Pergunte como a turma dessa pessoa se organiza para se ver.',
            a: [
              ['“Livre hoje à noite?” em cima da hora', 'Hoje? Já estou pronto!'],
              ['Uma data fixa na agenda', 'Anotado à caneta, não a lápis.'],
              ['Uma enquete para achar a data', 'Marco todas as opções.'],
            ],
          },
          nl: {
            t: 'Afspreken met vrienden gaat bij jullie…',
            o: 'Vraag hoe de vriendengroep van die persoon afspraken regelt.',
            a: [
              ['“Kun je vanavond?” op het laatste moment', 'Vanavond? Ik sta al klaar!'],
              ['Met een vaste datum in de agenda', 'In pen geschreven, niet in potlood.'],
              ['Via een prikker om een datum te kiezen', 'Ik vink alle vakjes aan.'],
            ],
          },
        }),
        c('rituels_rituel_groupe', 'rythme', [['🎲', -40, 'calme'], ['🎤', 80, 'fete'], ['🥾', 10, 'nature']], {
          fr: {
            t: 'Le rituel de groupe que tu préfères ?',
            o: 'Demande-lui quel rituel elle ou il partage avec ses amis.',
            a: [
              ['Une soirée jeux de société', 'Je lance les dés, croise les doigts !'],
              ['Un karaoké endiablé', 'Je prends le micro en premier !'],
              ['Une balade le dimanche', 'Un pas, deux pas, que d’histoires.'],
            ],
          },
          en: {
            t: 'Your favourite group ritual?',
            o: 'Ask them what ritual they share with their friends.',
            a: [
              ['A board game night', 'Rolling the dice, fingers crossed!'],
              ['A wild karaoke session', 'I’m grabbing the mic first!'],
              ['A Sunday stroll', 'Step by step, so many stories.'],
            ],
          },
          es: {
            t: '¿Tu ritual de grupo favorito?',
            o: 'Pregúntale qué ritual comparte con sus amigos.',
            a: [
              ['Una noche de juegos de mesa', '¡Tiro los dados, crucemos los dedos!'],
              ['Un karaoke desmadrado', '¡El micro para mí primero!'],
              ['Un paseo el domingo', 'Paso a paso, cuántas historias.'],
            ],
          },
          pt: {
            t: 'Seu ritual de turma favorito?',
            o: 'Pergunte qual ritual essa pessoa compartilha com os amigos.',
            a: [
              ['Uma noite de jogos de tabuleiro', 'Jogo os dados, dedos cruzados!'],
              ['Um karaokê animado', 'Eu pego o microfone primeiro!'],
              ['Uma caminhada no domingo', 'Passo a passo, quanta história.'],
            ],
          },
          nl: {
            t: 'Je favoriete groepsritueel?',
            o: 'Vraag welk ritueel die persoon met vrienden deelt.',
            a: [
              ['Een spelletjesavond', 'Ik gooi de dobbelsteen, duimen maar!'],
              ['Een uitbundige karaoke', 'Ik pak als eerste de microfoon!'],
              ['Een zondagse wandeling', 'Stap voor stap, zoveel verhalen.'],
            ],
          },
        }),
        c('rituels_defi_amis', 'elan', [['🌸', -60, 'temps_libre'], ['🏆', 70, 'projets']], {
          fr: {
            t: 'Lancer un défi entre amis (un livre par mois, une rando par saison…) ?',
            o: 'Demande-lui quel défi elle ou il aimerait lancer avec ses amis.',
            a: [
              ['Non, on se voit juste pour profiter', 'Profiter, c’est déjà un art.'],
              ['Carrément, j’adore les défis', 'Je fais le tableau des scores !'],
            ],
          },
          en: {
            t: 'Start a challenge with friends (a book a month, a hike a season…)?',
            o: 'Ask them which challenge they’d love to start with friends.',
            a: [
              ['No, we just meet up to enjoy ourselves', 'Enjoying is an art in itself.'],
              ['Absolutely, I love a challenge', 'I’ll do the scoreboard!'],
            ],
          },
          es: {
            t: '¿Lanzar un reto entre amigos (un libro al mes, una ruta por estación…)?',
            o: 'Pregúntale qué reto le gustaría lanzar con sus amigos.',
            a: [
              ['No, quedamos solo para disfrutar', 'Disfrutar ya es un arte.'],
              ['Claro, me encantan los retos', '¡Yo llevo el marcador!'],
            ],
          },
          pt: {
            t: 'Lançar um desafio entre amigos (um livro por mês, uma trilha por estação…)?',
            o: 'Pergunte que desafio essa pessoa gostaria de lançar com os amigos.',
            a: [
              ['Não, a gente se vê só para curtir', 'Curtir já é uma arte.'],
              ['Com certeza, adoro desafios', 'Eu faço o placar!'],
            ],
          },
          nl: {
            t: 'Een uitdaging met vrienden (een boek per maand, een tocht per seizoen…)?',
            o: 'Vraag welke uitdaging die persoon graag met vrienden zou starten.',
            a: [
              ['Nee, we zien elkaar gewoon om te genieten', 'Genieten is al een kunst.'],
              ['Zeker, ik hou van uitdagingen', 'Ik houd het scorebord bij!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_8',
      title: { fr: 'Tes petites manies', en: 'Your little quirks', es: 'Tus pequeñas manías', pt: 'Suas manias', nl: 'Je kleine eigenaardigheden' },
      questions: [
        c('rituels_place', 'ancrage', [['💺', -60, 'racines'], ['🎲', 60, 'curiosite']], {
          fr: {
            t: 'Au café ou au cinéma, ta place…',
            o: 'Demande-lui si elle ou il a une place préférée quelque part.',
            a: [
              ['Toujours la même, c’est ma place', 'Réservée à vie, avec ton nom dessus.'],
              ['Au hasard, pour changer de point de vue', 'Aujourd’hui, vue sur… surprise !'],
            ],
          },
          en: {
            t: 'At the café or the cinema, your seat…',
            o: 'Ask them whether they have a favourite seat somewhere.',
            a: [
              ['Always the same one, it’s my seat', 'Reserved for life, with your name on it.'],
              ['Anywhere, for a change of view', 'Today’s view is… a surprise!'],
            ],
          },
          es: {
            t: 'En la cafetería o en el cine, tu sitio…',
            o: 'Pregúntale si tiene un sitio favorito en algún lugar.',
            a: [
              ['Siempre el mismo, es mi sitio', 'Reservado de por vida, con tu nombre.'],
              ['Al azar, para cambiar de perspectiva', 'Hoy las vistas son… ¡sorpresa!'],
            ],
          },
          pt: {
            t: 'No café ou no cinema, seu lugar…',
            o: 'Pergunte se essa pessoa tem um lugar favorito em algum canto.',
            a: [
              ['Sempre o mesmo, é o meu lugar', 'Reservado para sempre, com seu nome.'],
              ['Qualquer um, para mudar de ponto de vista', 'Hoje a vista é… surpresa!'],
            ],
          },
          nl: {
            t: 'In het café of de bioscoop is je plek…',
            o: 'Vraag of die persoon ergens een vaste lievelingsplek heeft.',
            a: [
              ['Altijd dezelfde, dat is mijn plek', 'Voor altijd gereserveerd, met je naam erop.'],
              ['Willekeurig, voor een ander uitzicht', 'Het uitzicht van vandaag is… verrassing!'],
            ],
          },
        }),
        s('rituels_chanson', 'rythme', ['🙂', -100, 'calme'], ['💃', 100, 'fete'], {
          fr: { t: 'Quand ta chanson préférée passe quelque part…', o: 'Demande-lui quelle chanson la ou le fait toujours bouger.', a: [['Je fredonne tout bas', 'Mmm mmm, je t’accompagne.'], ['Je danse, peu importe qui regarde', 'Piste de danse improvisée !']], m: 'Je tape du pied en rythme.' },
          en: { t: 'When your favourite song comes on somewhere…', o: 'Ask them which song always gets them moving.', a: [['I hum along quietly', 'Mmm mmm, I’ll join in.'], ['I dance, whoever’s watching', 'Instant dance floor!']], m: 'I tap my foot to the beat.' },
          es: { t: 'Cuando suena tu canción favorita en algún sitio…', o: 'Pregúntale qué canción siempre le hace moverse.', a: [['La tarareo bajito', 'Mmm mmm, te acompaño.'], ['Bailo, me mire quien me mire', '¡Pista de baile improvisada!']], m: 'Llevo el ritmo con el pie.' },
          pt: { t: 'Quando sua música favorita toca em algum lugar…', o: 'Pergunte qual música sempre faz essa pessoa se mexer.', a: [['Cantarolo baixinho', 'Hum hum, eu te acompanho.'], ['Danço, não importa quem esteja olhando', 'Pista de dança improvisada!']], m: 'Bato o pé no ritmo.' },
          nl: { t: 'Als je favoriete liedje ergens opstaat…', o: 'Vraag van welk liedje die persoon altijd gaat bewegen.', a: [['Neurie ik zachtjes mee', 'Mmm mmm, ik doe mee.'], ['Dans ik, wie er ook kijkt', 'Spontane dansvloer!']], m: 'Ik tik met mijn voet mee.' },
        }),
        c('rituels_listes', 'cap', [['🧠', -60, 'spontane'], ['🗒️', 10, null], ['✅', 70, 'ordre']], {
          fr: {
            t: 'Les listes, pour toi, c’est…',
            o: 'Demande-lui si elle ou il fait des listes, et de quoi.',
            a: [
              ['Jamais, tout est dans ma tête', 'Une tête bien pleine, bravo.'],
              ['Juste pour les courses', 'Lait, pain… et des bonbons pour moi.'],
              ['Pour tout : courses, envies, idées', 'Une liste de listes, le rêve.'],
            ],
          },
          en: {
            t: 'Lists, for you, are…',
            o: 'Ask them whether they make lists, and of what.',
            a: [
              ['Never needed, it’s all in my head', 'A well-stocked head, bravo.'],
              ['Just for the shopping', 'Milk, bread… and sweets for me.'],
              ['For everything: shopping, wishes, ideas', 'A list of lists, the dream.'],
            ],
          },
          es: {
            t: 'Las listas, para ti, son…',
            o: 'Pregúntale si hace listas, y de qué.',
            a: [
              ['Nunca, todo está en mi cabeza', 'Una cabeza bien llena, bravo.'],
              ['Solo para la compra', 'Leche, pan… y chuches para mí.'],
              ['Para todo: compra, deseos, ideas', 'Una lista de listas, un sueño.'],
            ],
          },
          pt: {
            t: 'Listas, para você, são…',
            o: 'Pergunte se essa pessoa faz listas, e de quê.',
            a: [
              ['Nunca, está tudo na cabeça', 'Uma cabeça bem cheia, parabéns.'],
              ['Só para o mercado', 'Leite, pão… e bala para mim.'],
              ['Para tudo: compras, vontades, ideias', 'Uma lista de listas, um sonho.'],
            ],
          },
          nl: {
            t: 'Lijstjes zijn voor jou…',
            o: 'Vraag of die persoon lijstjes maakt, en waarvan.',
            a: [
              ['Nooit nodig, alles zit in mijn hoofd', 'Een goedgevuld hoofd, bravo.'],
              ['Alleen voor de boodschappen', 'Melk, brood… en snoep voor mij.'],
              ['Voor alles: boodschappen, wensen, ideeën', 'Een lijst van lijstjes, een droom.'],
            ],
          },
        }),
        c('rituels_carnet', 'elan', [['📓', 60, 'projets'], ['✏️', 10, null], ['🌿', -50, 'temps_libre']], {
          fr: {
            t: 'Tu tiens un carnet ?',
            o: 'Demande-lui ce qu’il y a dans son carnet, si elle ou il en a un.',
            a: [
              ['Oui, j’y note mes objectifs', 'Page 1 : conquérir le monde.'],
              ['Un carnet de gribouillages', 'Je peux dessiner un chat dedans ?'],
              ['Non, je vis le moment', 'Le moment présent te dit merci.'],
            ],
          },
          en: {
            t: 'Do you keep a notebook?',
            o: 'Ask them what’s in their notebook, if they have one.',
            a: [
              ['Yes, I track my goals in it', 'Page 1: conquer the world.'],
              ['A doodle notebook', 'Can I draw a cat in it?'],
              ['No, I live in the moment', 'The present moment says thank you.'],
            ],
          },
          es: {
            t: '¿Llevas una libreta?',
            o: 'Pregúntale qué hay en su libreta, si tiene una.',
            a: [
              ['Sí, sigo ahí mis objetivos', 'Página 1: conquistar el mundo.'],
              ['Una libreta de garabatos', '¿Puedo dibujar un gato?'],
              ['No, vivo el momento', 'El presente te da las gracias.'],
            ],
          },
          pt: {
            t: 'Você tem um caderninho?',
            o: 'Pergunte o que tem no caderninho dessa pessoa, se ela tiver um.',
            a: [
              ['Sim, acompanho meus objetivos nele', 'Página 1: conquistar o mundo.'],
              ['Um caderno de rabiscos', 'Posso desenhar um gato nele?'],
              ['Não, vivo o momento', 'O presente agradece.'],
            ],
          },
          nl: {
            t: 'Houd je een notitieboekje bij?',
            o: 'Vraag wat er in het boekje van die persoon staat, als die er een heeft.',
            a: [
              ['Ja, ik volg er mijn doelen in', 'Pagina 1: de wereld veroveren.'],
              ['Een krabbelboekje', 'Mag ik er een kat in tekenen?'],
              ['Nee, ik leef in het moment', 'Het nu zegt dank je wel.'],
            ],
          },
        }),
        c('rituels_partager_habitudes', 'foyer', [['🦉', -60, 'liberte'], ['🫂', 70, 'famille']], {
          fr: {
            t: 'Tes petits rituels, tu aimes les partager avec quelqu’un ?',
            o: 'Demande-lui quel petit rituel elle ou il partage avec une personne proche.',
            a: [
              ['Non, ce sont mes moments à moi', 'Ta bulle, je n’y touche pas.'],
              ['Oui, à plusieurs c’est encore mieux', 'On fait la ronde des rituels ?'],
            ],
          },
          en: {
            t: 'Do you like sharing your little rituals with someone?',
            o: 'Ask them which little ritual they share with someone close.',
            a: [
              ['No, those moments are mine', 'Your bubble, I won’t touch it.'],
              ['Yes, it’s even better together', 'Shall we form a ritual circle?'],
            ],
          },
          es: {
            t: 'Tus pequeños rituales, ¿te gusta compartirlos con alguien?',
            o: 'Pregúntale qué pequeño ritual comparte con alguien cercano.',
            a: [
              ['No, son mis momentos', 'Tu burbuja, no la toco.'],
              ['Sí, en compañía es aún mejor', '¿Hacemos un corro de rituales?'],
            ],
          },
          pt: {
            t: 'Você gosta de dividir seus pequenos rituais com alguém?',
            o: 'Pergunte qual pequeno ritual essa pessoa divide com alguém próximo.',
            a: [
              ['Não, são momentos só meus', 'Sua bolha, não mexo nela.'],
              ['Sim, junto é ainda melhor', 'Vamos fazer uma roda de rituais?'],
            ],
          },
          nl: {
            t: 'Deel je je kleine rituelen graag met iemand?',
            o: 'Vraag welk klein ritueel die persoon met iemand dichtbij deelt.',
            a: [
              ['Nee, dat zijn mijn eigen momenten', 'Jouw bubbel, ik blijf eraf.'],
              ['Ja, samen is het nog leuker', 'Maken we een rituelenkring?'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_9',
      title: { fr: 'Au fil des saisons', en: 'Through the seasons', es: 'Con las estaciones', pt: 'Pelas estações', nl: 'Door de seizoenen' },
      questions: [
        c('rituels_premier_soleil', 'rythme', [['🌷', -50, 'calme'], ['🌞', 70, 'dehors'], ['🚲', 20, 'sport']], {
          fr: {
            t: 'Premier jour de soleil au printemps, tu…',
            o: 'Demande-lui ce qu’elle ou il fait le premier beau jour de l’année.',
            a: [
              ['Ouvres grand les fenêtres chez toi', 'Bonjour le printemps, entre donc !'],
              ['Files en terrasse retrouver du monde', 'Je garde une chaise au soleil.'],
              ['Ressors ton vélo', 'Les pneus sont regonflés !'],
            ],
          },
          en: {
            t: 'First sunny day of spring, you…',
            o: 'Ask them what they do on the first nice day of the year.',
            a: [
              ['Throw your windows wide open', 'Hello spring, come on in!'],
              ['Head to a terrace to meet people', 'I’ll save a chair in the sun.'],
              ['Get your bike out again', 'Tyres pumped up!'],
            ],
          },
          es: {
            t: 'Primer día de sol en primavera, tú…',
            o: 'Pregúntale qué hace el primer día bonito del año.',
            a: [
              ['Abres de par en par las ventanas', '¡Hola, primavera, pasa!'],
              ['Te vas a una terraza a ver gente', 'Te guardo una silla al sol.'],
              ['Vuelves a sacar la bici', '¡Ruedas infladas!'],
            ],
          },
          pt: {
            t: 'Primeiro dia de sol na primavera, você…',
            o: 'Pergunte o que essa pessoa faz no primeiro dia bonito do ano.',
            a: [
              ['Abre todas as janelas de casa', 'Olá, primavera, pode entrar!'],
              ['Vai para uma área ao ar livre encontrar gente', 'Guardo uma cadeira no sol.'],
              ['Tira a bicicleta da garagem', 'Pneus calibrados!'],
            ],
          },
          nl: {
            t: 'Eerste zonnige lentedag, je…',
            o: 'Vraag wat die persoon doet op de eerste mooie dag van het jaar.',
            a: [
              ['Zet alle ramen wijd open', 'Hallo lente, kom binnen!'],
              ['Gaat naar een terras om mensen te zien', 'Ik houd een stoel in de zon vrij.'],
              ['Haalt je fiets weer tevoorschijn', 'Banden opgepompt!'],
            ],
          },
        }),
        s('rituels_rentree', 'elan', ['🍂', -100, 'temps_libre'], ['🚀', 100, 'projets'], {
          fr: { t: 'La rentrée de septembre, pour toi c’est…', o: 'Demande-lui ce qu’elle ou il aime à la rentrée.', a: [['Garder l’esprit vacances le plus longtemps', 'Encore un peu de sable dans les poches.'], ['Plein de nouvelles résolutions', 'Cahier neuf, idées neuves !']], m: 'Un ou deux petits projets.' },
          en: { t: 'Back-to-school season in September is…', o: 'Ask them what they enjoy about the start of autumn.', a: [['Keeping the holiday mood as long as possible', 'Still some sand in my pockets.'], ['Loads of fresh resolutions', 'New notebook, new ideas!']], m: 'One or two little projects.' },
          es: { t: 'La vuelta de septiembre, para ti es…', o: 'Pregúntale qué le gusta de la vuelta en septiembre.', a: [['Alargar el espíritu de vacaciones', 'Aún me queda arena en los bolsillos.'], ['Un montón de propósitos nuevos', '¡Cuaderno nuevo, ideas nuevas!']], m: 'Uno o dos proyectitos.' },
          pt: { t: 'A volta da rotina depois das férias, para você é…', o: 'Pergunte o que essa pessoa curte na volta da rotina.', a: [['Manter o clima de férias o máximo possível', 'Ainda tem areia no bolso.'], ['Um monte de resoluções novas', 'Caderno novo, ideias novas!']], m: 'Um ou dois projetinhos.' },
          nl: { t: 'Het nieuwe seizoen in september is voor jou…', o: 'Vraag wat die persoon fijn vindt aan september.', a: [['Het vakantiegevoel zo lang mogelijk vasthouden', 'Nog wat zand in mijn zakken.'], ['Een hoop nieuwe voornemens', 'Nieuw schrift, nieuwe ideeën!']], m: 'Een of twee kleine projectjes.' },
        }),
        c('rituels_hiver', 'foyer', [['🫕', 70, 'cuisine'], ['🧣', -60, 'cocooning']], {
          fr: {
            t: 'Les soirées d’hiver, tu les passes…',
            o: 'Demande-lui comment elle ou il aime passer l’hiver.',
            a: [
              ['Autour d’une raclette avec des proches', 'Je garde la place près du fromage.'],
              ['Sous un plaid, à mon rythme', 'Plaid, chaussettes, et toi : parfait.'],
            ],
          },
          en: {
            t: 'Winter evenings, you spend them…',
            o: 'Ask them how they like to spend the winter.',
            a: [
              ['Round a raclette with loved ones', 'I’m saving the seat by the cheese.'],
              ['Under a blanket, at my own pace', 'Blanket, socks and you: perfect.'],
            ],
          },
          es: {
            t: 'Las noches de invierno, las pasas…',
            o: 'Pregúntale cómo le gusta pasar el invierno.',
            a: [
              ['En torno a una raclette con mi gente', 'Me pido el sitio junto al queso.'],
              ['Bajo una manta, a mi ritmo', 'Manta, calcetines y tú: perfecto.'],
            ],
          },
          pt: {
            t: 'As noites de inverno, você passa…',
            o: 'Pergunte como essa pessoa gosta de passar o inverno.',
            a: [
              ['Em volta de um fondue com gente querida', 'Guardo o lugar perto do queijo.'],
              ['Debaixo da manta, no meu ritmo', 'Manta, meias e você: perfeito.'],
            ],
          },
          nl: {
            t: 'Winteravonden breng je door…',
            o: 'Vraag hoe die persoon de winter graag doorbrengt.',
            a: [
              ['Rond een gourmetstel met dierbaren', 'Ik houd de plek bij de kaas vrij.'],
              ['Onder een dekentje, in mijn eigen tempo', 'Dekentje, sokken en jij: perfect.'],
            ],
          },
        }),
        c('rituels_saison_cuisine', 'ancrage', [['🥧', -60, 'racines'], ['🌶️', 60, 'curiosite']], {
          fr: {
            t: 'À chaque saison, en cuisine, tu…',
            o: 'Demande-lui quel plat lui annonce l’arrivée d’une saison.',
            a: [
              ['Refais les mêmes recettes de saison', 'La tarte aux pommes est de retour !'],
              ['Testes un plat de saison venu d’ailleurs', 'Nouvelle recette, nouveau voyage.'],
            ],
          },
          en: {
            t: 'Each season, in the kitchen, you…',
            o: 'Ask them which dish tells them a new season has arrived.',
            a: [
              ['Make the same seasonal recipes again', 'Apple pie is back!'],
              ['Try a seasonal dish from elsewhere', 'New recipe, new journey.'],
            ],
          },
          es: {
            t: 'Cada estación, en la cocina, tú…',
            o: 'Pregúntale qué plato le anuncia el cambio de estación.',
            a: [
              ['Repites las recetas de temporada de siempre', '¡Vuelve la tarta de manzana!'],
              ['Pruebas un plato de temporada de otro país', 'Receta nueva, viaje nuevo.'],
            ],
          },
          pt: {
            t: 'A cada estação, na cozinha, você…',
            o: 'Pergunte qual prato anuncia a chegada de uma estação para essa pessoa.',
            a: [
              ['Refaz as mesmas receitas da estação', 'A torta de maçã voltou!'],
              ['Testa um prato da estação de outro país', 'Receita nova, viagem nova.'],
            ],
          },
          nl: {
            t: 'Elk seizoen, in de keuken…',
            o: 'Vraag welk gerecht voor die persoon een nieuw seizoen aankondigt.',
            a: [
              ['Maak je dezelfde seizoensrecepten', 'De appeltaart is terug!'],
              ['Probeer je een seizoensgerecht van ver weg', 'Nieuw recept, nieuwe reis.'],
            ],
          },
        }),
        c('rituels_vacances_prep', 'cap', [['🎒', -70, 'spontane'], ['🗺️', 20, null], ['🗓️', 70, 'plan']], {
          fr: {
            t: 'Tes vacances d’été, tu les prépares…',
            o: 'Demande-lui comment elle ou il prépare ses vacances.',
            a: [
              ['La semaine d’avant', 'Valise express, c’est parti !'],
              ['Au printemps, tranquillement', 'Une idée par-ci, une idée par-là.'],
              ['Dès janvier', 'Le compte à rebours a commencé.'],
            ],
          },
          en: {
            t: 'You plan your summer holidays…',
            o: 'Ask them how they plan their holidays.',
            a: [
              ['The week before', 'Express suitcase, let’s go!'],
              ['In spring, at a gentle pace', 'An idea here, an idea there.'],
              ['From January', 'The countdown has begun.'],
            ],
          },
          es: {
            t: 'Tus vacaciones de verano, las preparas…',
            o: 'Pregúntale cómo prepara sus vacaciones.',
            a: [
              ['La semana antes', '¡Maleta exprés, vamos!'],
              ['En primavera, con calma', 'Una idea por aquí, otra por allá.'],
              ['Desde enero', 'La cuenta atrás ha empezado.'],
            ],
          },
          pt: {
            t: 'Suas férias de verão, você prepara…',
            o: 'Pergunte como essa pessoa prepara as férias.',
            a: [
              ['Na semana anterior', 'Mala expressa, partiu!'],
              ['Uns meses antes, com calma', 'Uma ideia aqui, outra ali.'],
              ['Com quase um ano de antecedência', 'A contagem regressiva começou.'],
            ],
          },
          nl: {
            t: 'Je zomervakantie bereid je voor…',
            o: 'Vraag hoe die persoon de vakantie voorbereidt.',
            a: [
              ['De week ervoor', 'Snelkoffer, daar gaan we!'],
              ['In de lente, op het gemak', 'Hier een idee, daar een idee.'],
              ['Al vanaf januari', 'Het aftellen is begonnen.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'rituels_10',
      title: { fr: 'Nouvelles habitudes', en: 'New habits', es: 'Nuevos hábitos', pt: 'Novos hábitos', nl: 'Nieuwe gewoontes' },
      questions: [
        s('rituels_nouvelle', 'ancrage', ['🔁', -100, 'racines'], ['✨', 100, 'curiosite'], {
          fr: { t: 'Prendre une nouvelle habitude, chez toi c’est…', o: 'Demande-lui quelle est sa dernière nouvelle habitude.', a: [['Rare, j’aime mes habitudes', 'Les bonnes vieilles, les meilleures.'], ['Fréquent, j’adore tester', 'Cette semaine : on essaie quoi ?']], m: 'Une de temps en temps.' },
          en: { t: 'Picking up a new habit is, for you…', o: 'Ask them about their most recent new habit.', a: [['Rare, I love my habits', 'The good old ones are the best.'], ['Frequent, I love trying things', 'What are we trying this week?']], m: 'One every now and then.' },
          es: { t: 'Adoptar un hábito nuevo, para ti es…', o: 'Pregúntale cuál es su último hábito nuevo.', a: [['Raro, me gustan mis costumbres', 'Las de siempre son las mejores.'], ['Frecuente, me encanta probar', '¿Qué probamos esta semana?']], m: 'Uno de vez en cuando.' },
          pt: { t: 'Criar um hábito novo, para você é…', o: 'Pergunte qual foi o último hábito novo dessa pessoa.', a: [['Raro, gosto dos meus hábitos', 'Os de sempre são os melhores.'], ['Frequente, adoro testar', 'O que a gente testa esta semana?']], m: 'Um de vez em quando.' },
          nl: { t: 'Een nieuwe gewoonte aannemen is voor jou…', o: 'Vraag wat de nieuwste gewoonte van die persoon is.', a: [['Zeldzaam, ik hou van mijn gewoontes', 'De oude vertrouwde zijn de beste.'], ['Vaak, ik probeer graag dingen', 'Wat proberen we deze week?']], m: 'Af en toe eentje.' },
        }),
        c('rituels_tenir', 'cap', [['🌊', -60, 'spontane'], ['📊', 70, 'plan']], {
          fr: {
            t: 'Pour tenir une nouvelle habitude, tu…',
            o: 'Demande-lui son astuce pour garder une bonne habitude.',
            a: [
              ['Suis l’envie du moment', 'Au fil de l’eau, tranquille.'],
              ['Coches chaque jour dans un tableau', 'Encore une case verte !'],
            ],
          },
          en: {
            t: 'To stick with a new habit, you…',
            o: 'Ask them for their trick to keep a good habit going.',
            a: [
              ['Go with whatever you feel like', 'Going with the flow, easy.'],
              ['Tick a box every day on a chart', 'Another green box!'],
            ],
          },
          es: {
            t: 'Para mantener un hábito nuevo, tú…',
            o: 'Pregúntale su truco para mantener un buen hábito.',
            a: [
              ['Sigues las ganas del momento', 'Dejándote llevar, tranqui.'],
              ['Marcas cada día en una tabla', '¡Otra casilla verde!'],
            ],
          },
          pt: {
            t: 'Para manter um hábito novo, você…',
            o: 'Pergunte o truque dessa pessoa para manter um bom hábito.',
            a: [
              ['Segue a vontade do momento', 'Ao sabor da maré, tranquilo.'],
              ['Marca cada dia numa tabela', 'Mais um quadradinho verde!'],
            ],
          },
          nl: {
            t: 'Om een nieuwe gewoonte vol te houden…',
            o: 'Vraag naar de truc van die persoon om een goede gewoonte vol te houden.',
            a: [
              ['Volg je de zin van het moment', 'Met de stroom mee, rustig.'],
              ['Vink je elke dag een vakje af', 'Weer een groen vakje!'],
            ],
          },
        }),
        c('rituels_defi_30', 'elan', [['🏅', 70, 'projets'], ['🎨', 20, null], ['🙃', -60, 'temps_libre']], {
          fr: {
            t: 'Un défi de 30 jours (dessiner, lire, marcher…) ?',
            o: 'Demande-lui quel défi de 30 jours elle ou il aimerait tenter.',
            a: [
              ['Je me lance dès demain', 'Jour 1 sur 30, c’est parti !'],
              ['Seulement si c’est créatif', 'Trente dessins de moi, peut-être ?'],
              ['Très peu pour moi, je préfère flâner', 'Flâner, c’est un défi aussi.'],
            ],
          },
          en: {
            t: 'A 30-day challenge (drawing, reading, walking…)?',
            o: 'Ask them which 30-day challenge they’d like to try.',
            a: [
              ['I’m starting tomorrow', 'Day 1 of 30, here we go!'],
              ['Only if it’s creative', 'Thirty drawings of me, maybe?'],
              ['Not for me, I’d rather wander', 'Wandering is a challenge too.'],
            ],
          },
          es: {
            t: '¿Un reto de 30 días (dibujar, leer, caminar…)?',
            o: 'Pregúntale qué reto de 30 días le gustaría probar.',
            a: [
              ['Empiezo mañana mismo', '¡Día 1 de 30, vamos!'],
              ['Solo si es creativo', '¿Treinta dibujos de mí, quizá?'],
              ['No es lo mío, prefiero callejear', 'Callejear también es un reto.'],
            ],
          },
          pt: {
            t: 'Um desafio de 30 dias (desenhar, ler, caminhar…)?',
            o: 'Pergunte qual desafio de 30 dias essa pessoa gostaria de tentar.',
            a: [
              ['Começo amanhã mesmo', 'Dia 1 de 30, vamos lá!'],
              ['Só se for criativo', 'Trinta desenhos de mim, quem sabe?'],
              ['Não é comigo, prefiro passear sem rumo', 'Passear também é um desafio.'],
            ],
          },
          nl: {
            t: 'Een uitdaging van 30 dagen (tekenen, lezen, wandelen…)?',
            o: 'Vraag welke 30-dagenuitdaging die persoon zou willen proberen.',
            a: [
              ['Ik begin morgen al', 'Dag 1 van 30, daar gaan we!'],
              ['Alleen als het creatief is', 'Dertig tekeningen van mij, misschien?'],
              ['Niks voor mij, ik slenter liever', 'Slenteren is ook een uitdaging.'],
            ],
          },
        }),
        c('rituels_commencer_avec', 'foyer', [['🤝', 70, 'famille'], ['🦋', -60, 'liberte']], {
          fr: {
            t: 'Commencer une nouvelle habitude, tu le fais…',
            o: 'Demande-lui si elle ou il aime se motiver à plusieurs.',
            a: [
              ['Avec quelqu’un, on se motive', 'Tope là, équipe !'],
              ['À ma façon, sans compte à rendre', 'Libre comme un papillon.'],
            ],
          },
          en: {
            t: 'Starting a new habit, you do it…',
            o: 'Ask them whether they like motivating each other with others.',
            a: [
              ['With someone, we cheer each other on', 'High five, team!'],
              ['My own way, answering to no one', 'Free as a butterfly.'],
            ],
          },
          es: {
            t: 'Empezar un hábito nuevo, lo haces…',
            o: 'Pregúntale si le gusta motivarse en compañía.',
            a: [
              ['Con alguien, nos animamos', '¡Choca esos cinco, equipo!'],
              ['A mi manera, sin rendir cuentas', 'Libre como una mariposa.'],
            ],
          },
          pt: {
            t: 'Começar um hábito novo, você faz…',
            o: 'Pergunte se essa pessoa gosta de se motivar junto com alguém.',
            a: [
              ['Com alguém, a gente se motiva', 'Toca aqui, equipe!'],
              ['Do meu jeito, sem dar satisfação', 'Livre como uma borboleta.'],
            ],
          },
          nl: {
            t: 'Een nieuwe gewoonte begin je…',
            o: 'Vraag of die persoon zich graag samen met anderen motiveert.',
            a: [
              ['Met iemand samen, we peppen elkaar op', 'High five, team!'],
              ['Op mijn manier, zonder verantwoording', 'Vrij als een vlinder.'],
            ],
          },
        }),
        c('rituels_quartier', 'rythme', [['🌳', -50, 'calme'], ['🥖', 0, null], ['🍲', 70, 'monde']], {
          fr: {
            t: 'Un nouveau rituel dans ton quartier, ce serait…',
            o: 'Demande-lui quel rituel elle ou il aimerait lancer dans le quartier.',
            a: [
              ['Une balade tranquille au parc', 'Je salue chaque canard.'],
              ['Un bonjour à la boulangerie chaque matin', 'La baguette est encore tiède !'],
              ['Un repas partagé avec les voisins chaque mois', 'J’apporte le dessert !'],
            ],
          },
          en: {
            t: 'A new ritual in your neighbourhood would be…',
            o: 'Ask them which ritual they’d love to start in the neighbourhood.',
            a: [
              ['A quiet walk in the park', 'I greet every duck.'],
              ['A hello at the bakery every morning', 'The baguette is still warm!'],
              ['A shared meal with neighbours every month', 'I’ll bring pudding!'],
            ],
          },
          es: {
            t: 'Un nuevo ritual en tu barrio sería…',
            o: 'Pregúntale qué ritual le gustaría empezar en el barrio.',
            a: [
              ['Un paseo tranquilo por el parque', 'Saludo a cada pato.'],
              ['Un buenos días en la panadería cada mañana', '¡La barra aún está calentita!'],
              ['Una comida compartida con los vecinos cada mes', '¡Yo traigo el postre!'],
            ],
          },
          pt: {
            t: 'Um novo ritual no seu bairro seria…',
            o: 'Pergunte que ritual essa pessoa gostaria de começar no bairro.',
            a: [
              ['Uma caminhada tranquila no parque', 'Cumprimento cada pato.'],
              ['Um bom-dia na padaria toda manhã', 'O pão ainda está quentinho!'],
              ['Uma refeição com os vizinhos todo mês', 'Eu levo a sobremesa!'],
            ],
          },
          nl: {
            t: 'Een nieuw ritueel in je buurt zou zijn…',
            o: 'Vraag welk ritueel die persoon graag in de buurt zou beginnen.',
            a: [
              ['Een rustige wandeling in het park', 'Ik groet elke eend.'],
              ['Elke ochtend goedemorgen bij de bakker', 'Het stokbrood is nog warm!'],
              ['Elke maand samen eten met de buren', 'Ik neem het toetje mee!'],
            ],
          },
        }),
      ],
    },
  ],
};
