// Univers « Voyages » : partir, préparer, destinations, valises, découvrir ailleurs.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'voyages',
  icon: '🧳',
  title: {
    fr: ['Voyages', 'Partir, préparer, découvrir ailleurs.'],
    en: ['Travel', 'Setting off, planning, discovering elsewhere.'],
    es: ['Viajes', 'Salir, preparar, descubrir otros lugares.'],
    pt: ['Viagens', 'Partir, planejar, descobrir outros lugares.'],
    nl: ['Reizen', 'Vertrekken, voorbereiden, elders ontdekken.'],
  },
  steps: [
    {
      id: 'voyages_1',
      title: { fr: 'L’envie de partir', en: 'The urge to go', es: 'Las ganas de irse', pt: 'A vontade de partir', nl: 'Zin om te gaan' },
      questions: [
        c('voyages_declic', 'cap', [['📅', 70, 'plan'], ['⚡', -70, 'spontane'], ['💭', 10, null]], {
          fr: {
            t: 'L’envie de partir te prend…',
            o: 'Demande-lui comment naît une envie de voyage chez elle ou lui.',
            a: [
              ['Je cale mes congés un an à l’avance', 'L’agenda est déjà en vacances.'],
              ['D’un coup, je réserve dans la soirée', 'Hop, billet en poche ! Je fais ma valise.'],
              ['Je rêve longtemps avant de me décider', 'Rêver, c’est déjà voyager un peu.'],
            ],
          },
          en: {
            t: 'The urge to travel hits you…',
            o: 'Ask them how a travel idea usually starts for them.',
            a: [
              ['I book my holidays a year ahead', 'The diary is already on holiday.'],
              ['Out of nowhere, I book that evening', 'Ticket in pocket! I’m packing.'],
              ['I dream for ages before deciding', 'Dreaming is already a little trip.'],
            ],
          },
          es: {
            t: 'Las ganas de viajar te llegan…',
            o: 'Pregúntale cómo le nacen las ganas de viajar.',
            a: [
              ['Cuadro las vacaciones con un año de antelación', 'La agenda ya está de vacaciones.'],
              ['De golpe, reservo esa misma noche', '¡Billete en mano! Hago la maleta.'],
              ['Sueño mucho tiempo antes de decidir', 'Soñar ya es viajar un poco.'],
            ],
          },
          pt: {
            t: 'A vontade de viajar bate…',
            o: 'Pergunte como nasce a vontade de viajar dessa pessoa.',
            a: [
              ['Marco as férias com um ano de antecedência', 'A agenda já está de férias.'],
              ['Do nada, compro a passagem na mesma noite', 'Passagem na mão! Tô fazendo a mala.'],
              ['Sonho muito antes de decidir', 'Sonhar já é viajar um pouco.'],
            ],
          },
          nl: {
            t: 'De zin om op reis te gaan overvalt je…',
            o: 'Vraag hoe een reisidee bij die persoon meestal ontstaat.',
            a: [
              ['Ik plan mijn vakantie een jaar vooruit', 'De agenda is al op vakantie.'],
              ['Ineens, ik boek dezelfde avond', 'Ticket op zak! Ik pak mijn koffer.'],
              ['Ik droom er lang over voor ik beslis', 'Dromen is al een beetje reizen.'],
            ],
          },
        }),
        s('voyages_loin_proche', 'ancrage', ['🏡', -100, 'racines'], ['🌏', 100, 'voyage'], {
          fr: { t: 'Ta prochaine escapade…', o: 'Demande-lui où elle ou il rêve de partir.', a: [['Un coin que je connais par cœur', 'Là où même les chats te reconnaissent.'], ['Un pays dont je ne parle pas la langue', 'Je prépare mon plus beau sourire universel.']], m: 'Une région voisine encore inconnue.' },
          en: { t: 'Your next getaway…', o: 'Ask them where they dream of going.', a: [['A place I know by heart', 'Where even the cats recognise you.'], ['A country whose language I don’t speak', 'Getting my best universal smile ready.']], m: 'A nearby region I don’t know yet.' },
          es: { t: 'Tu próxima escapada…', o: 'Pregúntale a dónde sueña con ir.', a: [['Un rincón que conozco de memoria', 'Donde hasta los gatos te reconocen.'], ['Un país cuyo idioma no hablo', 'Preparo mi mejor sonrisa universal.']], m: 'Una región cercana aún por descubrir.' },
          pt: { t: 'Sua próxima escapada…', o: 'Pergunte para onde essa pessoa sonha em ir.', a: [['Um lugar que conheço de cor', 'Onde até os gatos te reconhecem.'], ['Um país cuja língua eu não falo', 'Preparando meu melhor sorriso universal.']], m: 'Uma região vizinha ainda desconhecida.' },
          nl: { t: 'Je volgende uitstapje…', o: 'Vraag waar die persoon van droomt om naartoe te gaan.', a: [['Een plek die ik uit mijn hoofd ken', 'Waar zelfs de katten je herkennen.'], ['Een land waarvan ik de taal niet spreek', 'Ik oefen mijn beste universele glimlach.']], m: 'Een streek dichtbij die ik nog niet ken.' },
        }),
        c('voyages_pourquoi', 'elan', [['🏖️', -70, 'temps_libre'], ['🧗', 70, 'aventure'], ['📸', 10, 'curiosite']], {
          fr: {
            t: 'Partir, pour toi, c’est surtout…',
            o: 'Demande-lui ce qu’elle ou il cherche en voyage.',
            a: [
              ['Me reposer, ne rien prévoir', 'Le hamac est prêt.'],
              ['Un défi : un trek, une langue, un sommet', 'Je porte la gourde, toi le courage.'],
              ['Voir de mes yeux ce que j’ai lu', 'Les livres qui prennent vie, magique.'],
            ],
          },
          en: {
            t: 'Travelling, for you, is mostly…',
            o: 'Ask them what they look for when travelling.',
            a: [
              ['Resting, planning nothing', 'The hammock is ready.'],
              ['A challenge: a trek, a language, a summit', 'I’ll carry the flask, you bring the courage.'],
              ['Seeing with my own eyes what I’ve read', 'Books coming to life, magical.'],
            ],
          },
          es: {
            t: 'Viajar, para ti, es sobre todo…',
            o: 'Pregúntale qué busca cuando viaja.',
            a: [
              ['Descansar, no planear nada', 'La hamaca está lista.'],
              ['Un reto: una ruta, un idioma, una cima', 'Yo llevo la cantimplora, tú el valor.'],
              ['Ver con mis ojos lo que he leído', 'Los libros cobran vida, qué magia.'],
            ],
          },
          pt: {
            t: 'Viajar, para você, é principalmente…',
            o: 'Pergunte o que essa pessoa procura numa viagem.',
            a: [
              ['Descansar, não planejar nada', 'A rede já está armada.'],
              ['Um desafio: uma trilha, uma língua, um cume', 'Eu levo o cantil, você a coragem.'],
              ['Ver com meus olhos o que li', 'Os livros ganhando vida, mágico.'],
            ],
          },
          nl: {
            t: 'Op reis gaan is voor jou vooral…',
            o: 'Vraag wat die persoon zoekt op reis.',
            a: [
              ['Uitrusten, niks plannen', 'De hangmat hangt klaar.'],
              ['Een uitdaging: een trektocht, een taal, een top', 'Ik draag de veldfles, jij de moed.'],
              ['Met eigen ogen zien wat ik las', 'Boeken die tot leven komen, magisch.'],
            ],
          },
        }),
        c('voyages_lancer_idee', 'foyer', [['🎒', -70, 'liberte'], ['📣', 70, 'accueil']], {
          fr: {
            t: 'Une idée de voyage te trotte dans la tête.',
            o: 'Demande-lui avec qui elle ou il aime partir.',
            a: [
              ['Je pars en solo, c’est plus simple', 'Libre comme l’air, avec moi dans la poche.'],
              ['Je lance l’idée dans le groupe d’amis', 'Le groupe s’enflamme en trois minutes !'],
            ],
          },
          en: {
            t: 'A travel idea keeps buzzing in your head.',
            o: 'Ask them who they like travelling with.',
            a: [
              ['I go solo, it’s simpler', 'Free as a bird, with me in your pocket.'],
              ['I throw the idea into the group chat', 'The group lights up in three minutes!'],
            ],
          },
          es: {
            t: 'Una idea de viaje te ronda la cabeza.',
            o: 'Pregúntale con quién le gusta viajar.',
            a: [
              ['Me voy a solas, es más fácil', 'Libre como el viento, conmigo en el bolsillo.'],
              ['Lanzo la idea al grupo de amigos', '¡El grupo se anima en tres minutos!'],
            ],
          },
          pt: {
            t: 'Uma ideia de viagem não sai da sua cabeça.',
            o: 'Pergunte com quem essa pessoa gosta de viajar.',
            a: [
              ['Vou só eu, é mais simples', 'Livre como o vento, comigo no bolso.'],
              ['Jogo a ideia no grupo dos amigos', 'O grupo se anima em três minutos!'],
            ],
          },
          nl: {
            t: 'Er spookt een reisidee door je hoofd.',
            o: 'Vraag met wie die persoon graag op reis gaat.',
            a: [
              ['Ik ga alleen, dat is makkelijker', 'Vrij als een vogel, met mij op zak.'],
              ['Ik gooi het idee in de vriendengroep', 'De groep is binnen drie minuten enthousiast!'],
            ],
          },
        }),
        s('voyages_week_end', 'rythme', ['🛖', -100, 'calme'], ['🌆', 100, 'ville'], {
          fr: { t: 'Un week-end ailleurs, c’est…', o: 'Demande-lui son week-end idéal loin de chez elle ou lui.', a: [['Une cabane loin de tout', 'Rien que le vent et nous.'], ['Une grande ville qui ne dort jamais', 'Je garde les yeux grands ouverts !']], m: 'Une petite ville tranquille mais vivante.' },
          en: { t: 'A weekend away means…', o: 'Ask them about their ideal weekend away.', a: [['A cabin far from everything', 'Just the wind and us.'], ['A big city that never sleeps', 'Keeping my eyes wide open!']], m: 'A small town, calm but lively.' },
          es: { t: 'Un finde fuera es…', o: 'Pregúntale cómo sería su escapada de fin de semana ideal.', a: [['Una cabaña lejos de todo', 'Solo el viento y nosotros.'], ['Una gran ciudad que nunca duerme', '¡Mantengo los ojos bien abiertos!']], m: 'Un pueblo tranquilo pero con vida.' },
          pt: { t: 'Um fim de semana fora é…', o: 'Pergunte como seria o fim de semana fora ideal dessa pessoa.', a: [['Uma cabana longe de tudo', 'Só o vento e a gente.'], ['Uma cidade grande que nunca dorme', 'Vou ficar de olhos bem abertos!']], m: 'Uma cidadezinha calma, mas animada.' },
          nl: { t: 'Een weekendje weg is…', o: 'Vraag naar het ideale weekendje weg van die persoon.', a: [['Een hutje ver van alles', 'Alleen de wind en wij.'], ['Een grote stad die nooit slaapt', 'Ik hou mijn ogen wijd open!']], m: 'Een stadje, rustig maar levendig.' },
        }),
      ],
    },
    {
      id: 'voyages_2',
      title: { fr: 'Choisir où aller', en: 'Choosing where', es: 'Elegir destino', pt: 'Escolher o destino', nl: 'Kiezen waarheen' },
      questions: [
        c('voyages_choix_destination', 'ancrage', [['📍', -60, 'racines'], ['🎯', 80, 'curiosite'], ['📚', 20, null]], {
          fr: {
            t: 'Pour choisir où aller, tu…',
            o: 'Demande-lui comment elle ou il choisit ses destinations.',
            a: [
              ['Retournes là où tu te sens bien', 'Un endroit qui te connaît, c’est précieux.'],
              ['Poses le doigt sur une carte au hasard', 'Pourvu que ce ne soit pas l’océan !'],
              ['Lis des récits de voyage', 'Les histoires des autres, ta boussole.'],
            ],
          },
          en: {
            t: 'To choose where to go, you…',
            o: 'Ask them how they choose their destinations.',
            a: [
              ['Go back where you feel good', 'A place that knows you, how precious.'],
              ['Put your finger on a map at random', 'Let’s hope it’s not the ocean!'],
              ['Read travel stories', 'Other people’s tales, your compass.'],
            ],
          },
          es: {
            t: 'Para elegir a dónde ir, tú…',
            o: 'Pregúntale cómo elige sus destinos.',
            a: [
              ['Vuelves a donde te sientes bien', 'Un sitio que te conoce, qué valor.'],
              ['Pones el dedo en un mapa al azar', '¡Ojalá no caiga en el océano!'],
              ['Lees relatos de viaje', 'Las historias de otros, tu brújula.'],
            ],
          },
          pt: {
            t: 'Para escolher para onde ir, você…',
            o: 'Pergunte como essa pessoa escolhe os destinos.',
            a: [
              ['Volta aonde se sente bem', 'Um lugar que te conhece, que precioso.'],
              ['Põe o dedo no mapa ao acaso', 'Tomara que não caia no oceano!'],
              ['Lê relatos de viagem', 'As histórias dos outros, sua bússola.'],
            ],
          },
          nl: {
            t: 'Om te kiezen waar je heen gaat…',
            o: 'Vraag hoe die persoon bestemmingen kiest.',
            a: [
              ['Ga je terug naar waar je je fijn voelt', 'Een plek die je kent, zo waardevol.'],
              ['Zet je blind je vinger op een kaart', 'Hopelijk niet midden in de oceaan!'],
              ['Lees je reisverhalen', 'De verhalen van anderen, jouw kompas.'],
            ],
          },
        }),
        c('voyages_choix_groupe', 'foyer', [['🧭', -70, 'liberte'], ['🤝', 70, 'accueil']], {
          fr: {
            t: 'Entre amis, la destination se choisit…',
            o: 'Demande-lui comment se décide un voyage en groupe avec elle ou lui.',
            a: [
              ['Je décide, qui veut me suit', 'Le capitaine a parlé, on embarque !'],
              ['Tous ensemble, chacun donne son avis', 'Grande réunion au sommet, j’apporte les biscuits.'],
            ],
          },
          en: {
            t: 'Among friends, the destination is chosen…',
            o: 'Ask them how a group trip gets decided with them.',
            a: [
              ['I decide, whoever wants can follow', 'The captain has spoken, all aboard!'],
              ['All together, everyone has a say', 'Big summit meeting, I’ll bring biscuits.'],
            ],
          },
          es: {
            t: 'Entre amigos, el destino se elige…',
            o: 'Pregúntale cómo se decide un viaje en grupo con esa persona.',
            a: [
              ['Decido yo, quien quiera me sigue', '¡Habla el capitán, todos a bordo!'],
              ['Entre todos, cada uno opina', 'Gran cumbre, yo llevo las galletas.'],
            ],
          },
          pt: {
            t: 'Entre amigos, o destino é escolhido…',
            o: 'Pergunte como se decide uma viagem em grupo com essa pessoa.',
            a: [
              ['Eu decido, quem quiser vem junto', 'O capitão falou, todos a bordo!'],
              ['Todo mundo junto, cada um opina', 'Grande reunião de cúpula, eu levo os biscoitos.'],
            ],
          },
          nl: {
            t: 'Onder vrienden wordt de bestemming gekozen…',
            o: 'Vraag hoe een groepsreis met die persoon wordt beslist.',
            a: [
              ['Ik beslis, wie wil gaat mee', 'De kapitein heeft gesproken, aan boord!'],
              ['Samen, iedereen zegt z’n zegje', 'Grote topvergadering, ik neem koekjes mee.'],
            ],
          },
        }),
        s('voyages_recherches', 'cap', ['🎲', -100, 'spontane'], ['📊', 100, 'plan'], {
          fr: { t: 'Avant de choisir une destination…', o: 'Demande-lui combien de temps elle ou il met à choisir un voyage.', a: [['Je choisis à l’instinct', 'Ton instinct a bon goût.'], ['Je compare dix options dans un tableau', 'Un tableau ? Avec des couleurs ? J’adore.']], m: 'Un peu de lecture, puis l’instinct.' },
          en: { t: 'Before choosing a destination…', o: 'Ask them how long they take to pick a trip.', a: [['I go with my gut', 'Your gut has great taste.'], ['I compare ten options in a spreadsheet', 'A spreadsheet? With colours? Love it.']], m: 'A bit of reading, then gut feeling.' },
          es: { t: 'Antes de elegir un destino…', o: 'Pregúntale cuánto tarda en elegir un viaje.', a: [['Elijo por instinto', 'Tu instinto tiene buen gusto.'], ['Comparo diez opciones en una tabla', '¿Una tabla? ¿Con colores? Me encanta.']], m: 'Un poco de lectura, y luego instinto.' },
          pt: { t: 'Antes de escolher um destino…', o: 'Pergunte quanto tempo essa pessoa leva para escolher uma viagem.', a: [['Escolho no instinto', 'Seu instinto tem bom gosto.'], ['Comparo dez opções numa planilha', 'Planilha? Com cores? Adoro.']], m: 'Um pouco de leitura, depois o instinto.' },
          nl: { t: 'Voordat je een bestemming kiest…', o: 'Vraag hoe lang die persoon erover doet om een reis te kiezen.', a: [['Ik kies op gevoel', 'Je gevoel heeft goede smaak.'], ['Ik vergelijk tien opties in een tabel', 'Een tabel? Met kleurtjes? Heerlijk.']], m: 'Een beetje lezen, dan op gevoel.' },
        }),
        c('voyages_saison', 'rythme', [['🍂', -70, 'calme'], ['🎆', 70, 'monde']], {
          fr: {
            t: 'Tu préfères partir…',
            o: 'Demande-lui à quelle période elle ou il aime voyager.',
            a: [
              ['Hors saison, quand c’est tranquille', 'Les rues rien que pour nous.'],
              ['Pendant les grandes fêtes locales', 'Je sors mes confettis !'],
            ],
          },
          en: {
            t: 'You prefer to travel…',
            o: 'Ask them what time of year they like travelling.',
            a: [
              ['Off season, when it’s quiet', 'The streets all to ourselves.'],
              ['During the big local festivals', 'Getting my confetti out!'],
            ],
          },
          es: {
            t: 'Prefieres viajar…',
            o: 'Pregúntale en qué época le gusta viajar.',
            a: [
              ['En temporada baja, con calma', 'Las calles solo para nosotros.'],
              ['Durante las grandes fiestas locales', '¡Saco el confeti!'],
            ],
          },
          pt: {
            t: 'Você prefere viajar…',
            o: 'Pergunte em que época do ano essa pessoa gosta de viajar.',
            a: [
              ['Na baixa temporada, com calma', 'As ruas só pra gente.'],
              ['Durante as grandes festas locais', 'Vou pegar meus confetes!'],
            ],
          },
          nl: {
            t: 'Je reist het liefst…',
            o: 'Vraag in welke periode die persoon graag reist.',
            a: [
              ['Buiten het seizoen, als het rustig is', 'De straten helemaal voor ons.'],
              ['Tijdens de grote lokale feesten', 'Ik pak mijn confetti!'],
            ],
          },
        }),
        c('voyages_destination_exigeante', 'elan', [['💪', 70, 'aventure'], ['🛋️', -70, 'temps_libre'], ['🤔', 10, null]], {
          fr: {
            t: 'Une destination lointaine : trois avions et une langue nouvelle.',
            o: 'Demande-lui le voyage le plus ambitieux dont elle ou il rêve.',
            a: [
              ['Ça me motive, c’est un vrai projet', 'Je prépare mon passeport en carton !'],
              ['Je préfère un voyage simple pour profiter', 'Profiter, c’est le vrai luxe.'],
              ['Peut-être, avec quelqu’un qui connaît', 'Avec un bon guide, tout devient possible.'],
            ],
          },
          en: {
            t: 'A faraway destination: three flights and a new language.',
            o: 'Ask them about the most ambitious trip they dream of.',
            a: [
              ['That motivates me, a real project', 'I’m making my cardboard passport!'],
              ['I’d rather keep it simple and enjoy', 'Enjoying is the real luxury.'],
              ['Maybe, with someone who knows it', 'With a good guide, anything’s possible.'],
            ],
          },
          es: {
            t: 'Un destino lejano: tres aviones y un idioma nuevo.',
            o: 'Pregúntale cuál es el viaje más ambicioso con el que sueña.',
            a: [
              ['Me motiva, es un proyecto de verdad', '¡Preparo mi pasaporte de cartón!'],
              ['Prefiero algo sencillo para disfrutar', 'Disfrutar es el verdadero lujo.'],
              ['Quizá, con alguien que lo conozca', 'Con buena guía, todo es posible.'],
            ],
          },
          pt: {
            t: 'Um destino distante: três voos e uma língua nova.',
            o: 'Pergunte qual é a viagem mais ambiciosa com que essa pessoa sonha.',
            a: [
              ['Isso me motiva, é um projeto de verdade', 'Vou fazer meu passaporte de papelão!'],
              ['Prefiro algo simples pra aproveitar', 'Aproveitar é o verdadeiro luxo.'],
              ['Talvez, com alguém que conheça', 'Com um bom guia, tudo é possível.'],
            ],
          },
          nl: {
            t: 'Een verre bestemming: drie vluchten en een nieuwe taal.',
            o: 'Vraag naar de meest ambitieuze reis waar die persoon van droomt.',
            a: [
              ['Dat motiveert me, een echt project', 'Ik maak mijn kartonnen paspoort!'],
              ['Ik hou het liever simpel om te genieten', 'Genieten is de echte luxe.'],
              ['Misschien, met iemand die het kent', 'Met een goede gids kan alles.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_3',
      title: { fr: 'Préparer', en: 'Getting ready', es: 'Preparar', pt: 'Preparar', nl: 'Voorbereiden' },
      questions: [
        s('voyages_programme', 'cap', ['🍃', -100, 'spontane'], ['🗂️', 100, 'plan'], {
          fr: { t: 'Ton programme sur place…', o: 'Demande-lui si elle ou il prévoit tout avant un voyage.', a: [['Aucun, je verrai en arrivant', 'Le meilleur plan, c’est pas de plan !'], ['Heure par heure, réservations comprises', 'Ton classeur de voyage me fascine.']], m: 'Deux ou trois incontournables, le reste libre.' },
          en: { t: 'Your plan once you’re there…', o: 'Ask them if they plan everything before a trip.', a: [['None, I’ll see when I arrive', 'The best plan is no plan!'], ['Hour by hour, bookings included', 'Your travel binder fascinates me.']], m: 'Two or three must-sees, the rest free.' },
          es: { t: 'Tu programa allí…', o: 'Pregúntale si lo planea todo antes de un viaje.', a: [['Ninguno, ya veré al llegar', '¡El mejor plan es no tener plan!'], ['Hora a hora, reservas incluidas', 'Tu carpeta de viaje me fascina.']], m: 'Dos o tres imprescindibles, el resto libre.' },
          pt: { t: 'Sua programação no destino…', o: 'Pergunte se essa pessoa planeja tudo antes de viajar.', a: [['Nenhuma, vejo quando chegar', 'O melhor plano é não ter plano!'], ['Hora a hora, com reservas', 'Sua pasta de viagem me fascina.']], m: 'Dois ou três imperdíveis, o resto livre.' },
          nl: { t: 'Je programma ter plekke…', o: 'Vraag of die persoon alles vooraf plant.', a: [['Geen, ik zie het wel als ik er ben', 'Het beste plan is geen plan!'], ['Uur voor uur, met reserveringen', 'Je reismap fascineert me.']], m: 'Twee of drie hoogtepunten, de rest vrij.' },
        }),
        c('voyages_guide', 'ancrage', [['📘', -50, 'racines'], ['🗣️', 70, 'curiosite'], ['🎁', 30, null]], {
          fr: {
            t: 'Pour préparer ton voyage, tu lis…',
            o: 'Demande-lui où elle ou il trouve ses meilleures idées de voyage.',
            a: [
              ['Le guide classique, il a fait ses preuves', 'Corné à toutes les bonnes pages.'],
              ['Les conseils des gens qui y vivent', 'Les vraies adresses, celles des voisins.'],
              ['Rien, je garde la surprise', 'Surprise totale, j’adore les surprises.'],
            ],
          },
          en: {
            t: 'To prepare your trip, you read…',
            o: 'Ask them where they find their best travel ideas.',
            a: [
              ['The classic guidebook, tried and tested', 'Dog-eared at all the right pages.'],
              ['Tips from people who live there', 'The real spots, the neighbours’ ones.'],
              ['Nothing, I keep it a surprise', 'Total surprise, I love surprises.'],
            ],
          },
          es: {
            t: 'Para preparar tu viaje, lees…',
            o: 'Pregúntale dónde encuentra sus mejores ideas de viaje.',
            a: [
              ['La guía clásica, nunca falla', 'Con todas las buenas páginas dobladas.'],
              ['Los consejos de gente que vive allí', 'Los sitios de verdad, los de los vecinos.'],
              ['Nada, prefiero la sorpresa', 'Sorpresa total, me encantan.'],
            ],
          },
          pt: {
            t: 'Para preparar sua viagem, você lê…',
            o: 'Pergunte onde essa pessoa encontra as melhores ideias de viagem.',
            a: [
              ['O guia clássico, já provou que funciona', 'Com orelha em todas as páginas boas.'],
              ['As dicas de quem mora lá', 'Os lugares de verdade, os dos vizinhos.'],
              ['Nada, prefiro a surpresa', 'Surpresa total, adoro surpresas.'],
            ],
          },
          nl: {
            t: 'Om je reis voor te bereiden, lees je…',
            o: 'Vraag waar die persoon de beste reisideeën vindt.',
            a: [
              ['De klassieke reisgids, beproefd', 'Met ezelsoren op alle goede pagina’s.'],
              ['Tips van mensen die er wonen', 'De echte adresjes, die van de buren.'],
              ['Niks, ik hou het een verrassing', 'Totale verrassing, daar hou ik van.'],
            ],
          },
        }),
        c('voyages_prepa_ensemble', 'foyer', [['📝', -60, 'liberte'], ['🍕', 70, 'accueil'], ['💬', 20, null]], {
          fr: {
            t: 'La préparation du voyage se fait…',
            o: 'Demande-lui comment elle ou il aime préparer un voyage.',
            a: [
              ['De mon côté, à mon rythme', 'Tranquille, avec ta carte et ton thé.'],
              ['Lors d’une soirée préparation avec les autres', 'Pizza et cartes étalées partout !'],
              ['Dans une conversation de groupe', 'Trois cents messages et un plan, bravo.'],
            ],
          },
          en: {
            t: 'Trip preparation happens…',
            o: 'Ask them how they like preparing a trip.',
            a: [
              ['On my own, at my own pace', 'Calm, with your map and your tea.'],
              ['At a planning night with the others', 'Pizza and maps spread everywhere!'],
              ['In a group chat', 'Three hundred messages and a plan, well done.'],
            ],
          },
          es: {
            t: 'La preparación del viaje se hace…',
            o: 'Pregúntale cómo le gusta preparar un viaje.',
            a: [
              ['Por mi cuenta, a mi ritmo', 'Con calma, con tu mapa y tu té.'],
              ['En una noche de preparación con los demás', '¡Pizza y mapas por todas partes!'],
              ['En un chat de grupo', 'Trescientos mensajes y un plan, bravo.'],
            ],
          },
          pt: {
            t: 'A preparação da viagem acontece…',
            o: 'Pergunte como essa pessoa gosta de preparar uma viagem.',
            a: [
              ['Do meu lado, no meu ritmo', 'Na calma, com seu mapa e seu chá.'],
              ['Numa noite de planejamento com a turma', 'Pizza e mapas espalhados por todo lado!'],
              ['Num grupo de mensagens', 'Trezentas mensagens e um plano, parabéns.'],
            ],
          },
          nl: {
            t: 'De voorbereiding van de reis gebeurt…',
            o: 'Vraag hoe die persoon graag een reis voorbereidt.',
            a: [
              ['Op mijn eentje, in mijn eigen tempo', 'Rustig, met je kaart en je thee.'],
              ['Op een planavond met de anderen', 'Pizza en kaarten overal!'],
              ['In een groepsapp', 'Driehonderd berichten en een plan, knap.'],
            ],
          },
        }),
        c('voyages_langue', 'elan', [['📖', 70, 'projets'], ['😄', -60, 'temps_libre'], ['📱', -10, null]], {
          fr: {
            t: 'Apprendre quelques mots de la langue avant de partir…',
            o: 'Demande-lui quels mots étrangers elle ou il connaît.',
            a: [
              ['Je m’y mets des semaines avant', 'Bientôt bilingue, je le sens.'],
              ['Je me débrouillerai avec des gestes', 'Les mains parlent toutes les langues.'],
              ['L’appli de traduction fera le travail', 'Ton téléphone, ton interprète.'],
            ],
          },
          en: {
            t: 'Learning a few words of the language before leaving…',
            o: 'Ask them which foreign words they know.',
            a: [
              ['I start weeks in advance', 'Bilingual soon, I can tell.'],
              ['I’ll manage with gestures', 'Hands speak every language.'],
              ['The translation app will do it', 'Your phone, your interpreter.'],
            ],
          },
          es: {
            t: 'Aprender unas palabras del idioma antes de ir…',
            o: 'Pregúntale qué palabras en otros idiomas conoce.',
            a: [
              ['Empiezo semanas antes', 'Pronto bilingüe, lo noto.'],
              ['Me apañaré con gestos', 'Las manos hablan todos los idiomas.'],
              ['La app de traducción se encarga', 'Tu móvil, tu intérprete.'],
            ],
          },
          pt: {
            t: 'Aprender umas palavras da língua antes de ir…',
            o: 'Pergunte que palavras estrangeiras essa pessoa conhece.',
            a: [
              ['Começo semanas antes', 'Logo bilíngue, estou sentindo.'],
              ['Me viro com gestos', 'As mãos falam todas as línguas.'],
              ['O app de tradução resolve', 'Seu celular, seu intérprete.'],
            ],
          },
          nl: {
            t: 'Voor vertrek een paar woorden van de taal leren…',
            o: 'Vraag welke buitenlandse woorden die persoon kent.',
            a: [
              ['Ik begin er weken van tevoren mee', 'Binnenkort tweetalig, ik voel het.'],
              ['Ik red me wel met gebaren', 'Handen spreken elke taal.'],
              ['De vertaalapp doet het werk', 'Je telefoon, je tolk.'],
            ],
          },
        }),
        c('voyages_veille', 'rythme', [['🛋️', -70, 'cocooning'], ['🎉', 70, 'fete']], {
          fr: {
            t: 'La veille du départ…',
            o: 'Demande-lui comment elle ou il passe la veille d’un voyage.',
            a: [
              ['Soirée calme, je me couche tôt', 'Je borde la valise aussi.'],
              ['Petite fête de départ avec les amis', 'Bon voyage en chansons !'],
            ],
          },
          en: {
            t: 'The night before you leave…',
            o: 'Ask them how they spend the night before a trip.',
            a: [
              ['Quiet evening, early night', 'I’ll tuck the suitcase in too.'],
              ['A little send-off party with friends', 'Bon voyage, in song!'],
            ],
          },
          es: {
            t: 'La víspera de la salida…',
            o: 'Pregúntale cómo pasa la noche antes de un viaje.',
            a: [
              ['Noche tranquila, me acuesto pronto', 'Arropo también a la maleta.'],
              ['Pequeña fiesta de despedida con amigos', '¡Buen viaje, con canciones!'],
            ],
          },
          pt: {
            t: 'Na véspera da viagem…',
            o: 'Pergunte como essa pessoa passa a véspera de uma viagem.',
            a: [
              ['Noite calma, durmo cedo', 'Vou cobrir a mala também.'],
              ['Festinha de despedida com os amigos', 'Boa viagem, com música!'],
            ],
          },
          nl: {
            t: 'De avond voor vertrek…',
            o: 'Vraag hoe die persoon de avond voor een reis doorbrengt.',
            a: [
              ['Rustige avond, vroeg naar bed', 'Ik stop de koffer ook in.'],
              ['Klein afscheidsfeestje met vrienden', 'Goede reis, met een liedje!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_4',
      title: { fr: 'La valise', en: 'The suitcase', es: 'La maleta', pt: 'A mala', nl: 'De koffer' },
      questions: [
        c('voyages_valise_quand', 'cap', [['📋', 80, 'ordre'], ['⏰', -70, 'spontane'], ['🌙', -10, null]], {
          fr: {
            t: 'Ta valise, tu la fais…',
            o: 'Demande-lui quand elle ou il boucle sa valise.',
            a: [
              ['Une semaine avant, avec une liste', 'Liste cochée, valise heureuse.'],
              ['Une heure avant de partir', 'Le sprint de la valise, quel sport !'],
              ['La veille au soir', 'Juste à temps, comme il faut.'],
            ],
          },
          en: {
            t: 'You pack your suitcase…',
            o: 'Ask them when they pack their suitcase.',
            a: [
              ['A week before, with a list', 'List ticked, happy suitcase.'],
              ['An hour before leaving', 'The suitcase sprint, what a sport!'],
              ['The night before', 'Just in time, as it should be.'],
            ],
          },
          es: {
            t: 'Tu maleta la haces…',
            o: 'Pregúntale cuándo hace la maleta.',
            a: [
              ['Una semana antes, con lista', 'Lista marcada, maleta feliz.'],
              ['Una hora antes de salir', '¡El sprint de la maleta, qué deporte!'],
              ['La noche anterior', 'Justo a tiempo, como debe ser.'],
            ],
          },
          pt: {
            t: 'Sua mala, você faz…',
            o: 'Pergunte quando essa pessoa faz a mala.',
            a: [
              ['Uma semana antes, com lista', 'Lista ticada, mala feliz.'],
              ['Uma hora antes de sair', 'A corrida da mala, que esporte!'],
              ['Na noite anterior', 'Na hora certa, como deve ser.'],
            ],
          },
          nl: {
            t: 'Je koffer pak je in…',
            o: 'Vraag wanneer die persoon de koffer inpakt.',
            a: [
              ['Een week van tevoren, met een lijstje', 'Lijstje afgevinkt, blije koffer.'],
              ['Een uur voor vertrek', 'De koffersprint, wat een sport!'],
              ['De avond ervoor', 'Net op tijd, zoals het hoort.'],
            ],
          },
        }),
        s('voyages_place_valise', 'foyer', ['🎒', -100, 'liberte'], ['🎁', 100, 'accueil'], {
          fr: { t: 'Dans ta valise, il y a de la place pour…', o: 'Demande-lui ce qu’elle ou il glisse toujours dans sa valise.', a: [['Mes affaires, et c’est tout', 'Léger comme une plume.'], ['Des cadeaux et des trucs à partager', 'Ta valise, une malle aux trésors.']], m: 'Mes affaires, plus une ou deux surprises.' },
          en: { t: 'In your suitcase, there’s room for…', o: 'Ask them what they always slip into their suitcase.', a: [['My things, and that’s it', 'Light as a feather.'], ['Gifts and things to share', 'Your suitcase is a treasure chest.']], m: 'My things, plus one or two surprises.' },
          es: { t: 'En tu maleta hay sitio para…', o: 'Pregúntale qué mete siempre en la maleta.', a: [['Mis cosas, y ya', 'Ligera como una pluma.'], ['Regalos y cosas para compartir', 'Tu maleta es un cofre del tesoro.']], m: 'Mis cosas, y una o dos sorpresas.' },
          pt: { t: 'Na sua mala, tem espaço para…', o: 'Pergunte o que essa pessoa sempre coloca na mala.', a: [['Minhas coisas, e só', 'Leve como uma pena.'], ['Presentes e coisas pra dividir', 'Sua mala é um baú de tesouros.']], m: 'Minhas coisas, e uma ou duas surpresas.' },
          nl: { t: 'In je koffer is plek voor…', o: 'Vraag wat die persoon altijd in de koffer stopt.', a: [['Mijn spullen, meer niet', 'Licht als een veertje.'], ['Cadeautjes en dingen om te delen', 'Je koffer is een schatkist.']], m: 'Mijn spullen, plus een of twee verrassingen.' },
        }),
        c('voyages_porte_bonheur', 'ancrage', [['🧸', -70, 'racines'], ['📓', 60, 'curiosite']], {
          fr: {
            t: 'Dans ta valise, il y a toujours…',
            o: 'Demande-lui l’objet qui l’accompagne dans tous ses voyages.',
            a: [
              ['Un objet de chez moi, mon porte-bonheur', 'Un bout de maison qui voyage.'],
              ['Un carnet vide pour les découvertes', 'Toutes ces pages à remplir !'],
            ],
          },
          en: {
            t: 'In your suitcase, there’s always…',
            o: 'Ask them which object comes on every trip with them.',
            a: [
              ['Something from home, my lucky charm', 'A piece of home that travels.'],
              ['A blank notebook for discoveries', 'All those pages to fill!'],
            ],
          },
          es: {
            t: 'En tu maleta siempre hay…',
            o: 'Pregúntale qué objeto le acompaña en todos sus viajes.',
            a: [
              ['Algo de casa, mi amuleto', 'Un trocito de casa que viaja.'],
              ['Una libreta vacía para descubrimientos', '¡Cuántas páginas por llenar!'],
            ],
          },
          pt: {
            t: 'Na sua mala sempre tem…',
            o: 'Pergunte qual objeto acompanha essa pessoa em todas as viagens.',
            a: [
              ['Algo de casa, meu amuleto', 'Um pedaço de casa que viaja.'],
              ['Um caderno vazio pras descobertas', 'Quantas páginas pra preencher!'],
            ],
          },
          nl: {
            t: 'In je koffer zit altijd…',
            o: 'Vraag welk voorwerp die persoon op elke reis meeneemt.',
            a: [
              ['Iets van thuis, mijn geluksbrenger', 'Een stukje thuis dat meereist.'],
              ['Een leeg schrift voor ontdekkingen', 'Al die bladzijden om te vullen!'],
            ],
          },
        }),
        c('voyages_tenues', 'rythme', [['✨', 70, 'fete'], ['🧦', -70, 'cocooning'], ['👟', 20, 'sport']], {
          fr: {
            t: 'Côté vêtements, tu emportes surtout…',
            o: 'Demande-lui ce qu’elle ou il n’oublie jamais de mettre dans sa valise.',
            a: [
              ['Une tenue pour sortir, on ne sait jamais', 'Prête pour la piste de danse, la valise.'],
              ['Mes chaussettes douillettes et un pyjama', 'Le confort avant tout, sage.'],
              ['Des baskets pour marcher partout', 'On va en faire, des kilomètres !'],
            ],
          },
          en: {
            t: 'Clothes-wise, you mostly pack…',
            o: 'Ask them what they never forget to pack.',
            a: [
              ['An outfit for going out, just in case', 'Suitcase ready for the dance floor.'],
              ['Cosy socks and pyjamas', 'Comfort first, wise.'],
              ['Trainers to walk everywhere', 'So many miles ahead!'],
            ],
          },
          es: {
            t: 'De ropa, te llevas sobre todo…',
            o: 'Pregúntale qué nunca se olvida de meter en la maleta.',
            a: [
              ['Un conjunto para salir, por si acaso', 'Maleta lista para la pista de baile.'],
              ['Calcetines gorditos y pijama', 'La comodidad primero, sensato.'],
              ['Zapatillas para andar por todas partes', '¡Cuántos kilómetros nos esperan!'],
            ],
          },
          pt: {
            t: 'De roupa, você leva principalmente…',
            o: 'Pergunte o que essa pessoa nunca esquece de pôr na mala.',
            a: [
              ['Uma roupa pra sair, nunca se sabe', 'Mala pronta pra pista de dança.'],
              ['Meias quentinhas e pijama', 'Conforto em primeiro lugar, sábio.'],
              ['Tênis pra andar por todo lado', 'Quantos quilômetros pela frente!'],
            ],
          },
          nl: {
            t: 'Qua kleding neem je vooral mee…',
            o: 'Vraag wat die persoon nooit vergeet in te pakken.',
            a: [
              ['Een outfit om uit te gaan, je weet maar nooit', 'Koffer klaar voor de dansvloer.'],
              ['Knusse sokken en een pyjama', 'Comfort voorop, verstandig.'],
              ['Sneakers om overal te lopen', 'Wat een kilometers gaan we maken!'],
            ],
          },
        }),
        c('voyages_bagage_occupation', 'elan', [['💻', 70, 'projets'], ['📚', -60, 'temps_libre']], {
          fr: {
            t: 'Pour t’occuper pendant le voyage, tu prends…',
            o: 'Demande-lui ce qu’elle ou il fait pendant ses heures de trajet.',
            a: [
              ['De quoi avancer mes projets', 'Bureau mobile, ça roule.'],
              ['Des romans et rien d’autre à faire', 'Lire en voyage, le bonheur.'],
            ],
          },
          en: {
            t: 'To keep busy on the trip, you bring…',
            o: 'Ask them what they do during long journeys.',
            a: [
              ['What I need to move my projects on', 'Mobile office, rolling along.'],
              ['Novels and nothing else to do', 'Reading on the road, bliss.'],
            ],
          },
          es: {
            t: 'Para entretenerte en el viaje, llevas…',
            o: 'Pregúntale qué hace durante los trayectos largos.',
            a: [
              ['Lo necesario para avanzar mis proyectos', 'Oficina móvil, sobre ruedas.'],
              ['Novelas y nada más que hacer', 'Leer de viaje, una gozada.'],
            ],
          },
          pt: {
            t: 'Para se ocupar na viagem, você leva…',
            o: 'Pergunte o que essa pessoa faz nos trajetos longos.',
            a: [
              ['O necessário pra adiantar meus projetos', 'Escritório móvel, tudo rodando.'],
              ['Romances e nada mais pra fazer', 'Ler viajando, que delícia.'],
            ],
          },
          nl: {
            t: 'Om je onderweg bezig te houden, neem je mee…',
            o: 'Vraag wat die persoon doet tijdens lange reizen.',
            a: [
              ['Spullen om mijn projecten verder te helpen', 'Mobiel kantoor, het rolt.'],
              ['Romans en verder niks te doen', 'Lezen onderweg, heerlijk.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_5',
      title: { fr: 'Le trajet', en: 'The journey', es: 'El trayecto', pt: 'O trajeto', nl: 'De reis erheen' },
      questions: [
        s('voyages_trajet_plaisir', 'elan', ['🪟', -100, 'temps_libre'], ['⏩', 100, 'projets'], {
          fr: { t: 'Le trajet, pour toi…', o: 'Demande-lui son plus beau souvenir de trajet.', a: [['Fait partie des vacances, je savoure', 'Les paysages défilent, on rêve.'], ['Doit être le plus court possible', 'Direct à destination, efficace !']], m: 'Pas trop long, mais agréable.' },
          en: { t: 'The journey, for you…', o: 'Ask them about their best journey memory.', a: [['Is part of the holiday, I savour it', 'Landscapes roll by, we daydream.'], ['Should be as short as possible', 'Straight there, efficient!']], m: 'Not too long, but pleasant.' },
          es: { t: 'El trayecto, para ti…', o: 'Pregúntale cuál es su mejor recuerdo de un trayecto.', a: [['Es parte de las vacaciones, lo disfruto', 'Pasan los paisajes, soñamos.'], ['Tiene que ser lo más corto posible', '¡Directo al destino, eficaz!']], m: 'No muy largo, pero agradable.' },
          pt: { t: 'O trajeto, para você…', o: 'Pergunte qual é a melhor lembrança de trajeto dessa pessoa.', a: [['Faz parte das férias, eu curto', 'As paisagens passam, a gente sonha.'], ['Tem que ser o mais curto possível', 'Direto ao destino, eficiente!']], m: 'Não muito longo, mas gostoso.' },
          nl: { t: 'De reis erheen is voor jou…', o: 'Vraag naar de mooiste reisherinnering van die persoon.', a: [['Deel van de vakantie, ik geniet', 'Landschappen glijden voorbij, we dromen.'], ['Moet zo kort mogelijk zijn', 'Recht naar de bestemming, efficiënt!']], m: 'Niet te lang, wel fijn.' },
        }),
        c('voyages_gare', 'cap', [['⏱️', 80, 'ordre'], ['🏃', -70, 'spontane'], ['☕', 20, null]], {
          fr: {
            t: 'Ton train part à 10 h. Tu arrives à la gare…',
            o: 'Demande-lui à quelle heure elle ou il arrive à la gare.',
            a: [
              ['À 9 h 15, par sécurité', 'Le quai t’appartient.'],
              ['À 9 h 58, en courant', 'Les portes se ferment… ouf !'],
              ['À 9 h 40, le temps d’un café', 'Le timing parfait, avec un café.'],
            ],
          },
          en: {
            t: 'Your train leaves at 10. You get to the station…',
            o: 'Ask them what time they get to the station.',
            a: [
              ['At 9.15, to be safe', 'The platform is all yours.'],
              ['At 9.58, running', 'Doors closing… phew!'],
              ['At 9.40, time for a coffee', 'Perfect timing, with a coffee.'],
            ],
          },
          es: {
            t: 'Tu tren sale a las 10. Llegas a la estación…',
            o: 'Pregúntale a qué hora llega a la estación.',
            a: [
              ['A las 9.15, por si acaso', 'El andén es todo tuyo.'],
              ['A las 9.58, corriendo', 'Se cierran las puertas… ¡uf!'],
              ['A las 9.40, para tomar un café', 'Tiempo perfecto, con café.'],
            ],
          },
          pt: {
            t: 'Seu trem sai às 10h. Você chega à estação…',
            o: 'Pergunte a que horas essa pessoa chega à estação.',
            a: [
              ['Às 9h15, por segurança', 'A plataforma é toda sua.'],
              ['Às 9h58, correndo', 'As portas fechando… ufa!'],
              ['Às 9h40, dá tempo de um café', 'Timing perfeito, com café.'],
            ],
          },
          nl: {
            t: 'Je trein vertrekt om 10.00 uur. Je bent op het station…',
            o: 'Vraag hoe laat die persoon op het station is.',
            a: [
              ['Om 9.15 uur, voor de zekerheid', 'Het perron is helemaal van jou.'],
              ['Om 9.58 uur, rennend', 'Deuren sluiten… pfoe!'],
              ['Om 9.40 uur, tijd voor koffie', 'Perfecte timing, met koffie.'],
            ],
          },
        }),
        c('voyages_voisin_siege', 'foyer', [['💬', 70, 'accueil'], ['🎧', -70, 'liberte'], ['🙂', 10, null]], {
          fr: {
            t: 'La personne assise à côté de toi engage la conversation.',
            o: 'Demande-lui sa plus belle rencontre pendant un trajet.',
            a: [
              ['On parle tout le trajet', 'Arrivée avec une nouvelle connaissance !'],
              ['Je souris et je remets mon casque', 'Ta bulle, ton voyage.'],
              ['Quelques mots, puis chacun son livre', 'Le juste équilibre.'],
            ],
          },
          en: {
            t: 'The person sitting next to you starts chatting.',
            o: 'Ask them about the best encounter they’ve had while travelling.',
            a: [
              ['We talk the whole way', 'Arriving with a new acquaintance!'],
              ['I smile and put my headphones back on', 'Your bubble, your journey.'],
              ['A few words, then back to our books', 'The right balance.'],
            ],
          },
          es: {
            t: 'La persona sentada a tu lado te da conversación.',
            o: 'Pregúntale cuál es su mejor encuentro durante un trayecto.',
            a: [
              ['Hablamos todo el trayecto', '¡Llegas con un conocido nuevo!'],
              ['Sonrío y me vuelvo a poner los cascos', 'Tu burbuja, tu viaje.'],
              ['Unas palabras, y cada uno a su libro', 'El equilibrio justo.'],
            ],
          },
          pt: {
            t: 'A pessoa sentada ao seu lado puxa conversa.',
            o: 'Pergunte qual foi o melhor encontro dessa pessoa durante um trajeto.',
            a: [
              ['Conversamos a viagem toda', 'Chegando com um novo conhecido!'],
              ['Sorrio e coloco o fone de novo', 'Sua bolha, sua viagem.'],
              ['Umas palavras, depois cada um no seu livro', 'O equilíbrio certo.'],
            ],
          },
          nl: {
            t: 'Degene naast je begint een gesprek.',
            o: 'Vraag naar de leukste ontmoeting van die persoon onderweg.',
            a: [
              ['We praten de hele reis', 'Aankomen met een nieuwe kennis!'],
              ['Ik glimlach en zet mijn koptelefoon weer op', 'Jouw bubbel, jouw reis.'],
              ['Een paar woorden, dan ieder z’n boek', 'Het juiste evenwicht.'],
            ],
          },
        }),
        c('voyages_itineraire', 'ancrage', [['🛣️', -60, 'racines'], ['🗺️', 70, 'aventure']], {
          fr: {
            t: 'Sur la route, ton itinéraire…',
            o: 'Demande-lui le plus beau détour qu’elle ou il ait fait.',
            a: [
              ['La route habituelle, la plus sûre', 'On connaît chaque virage, c’est doux.'],
              ['Les petites routes et les détours', 'Un détour, c’est une surprise.'],
            ],
          },
          en: {
            t: 'On the road, your route is…',
            o: 'Ask them about the best detour they’ve ever taken.',
            a: [
              ['The usual way, the safest', 'Knowing every bend, so soothing.'],
              ['Back roads and detours', 'A detour is a surprise.'],
            ],
          },
          es: {
            t: 'En carretera, tu itinerario…',
            o: 'Pregúntale cuál es el mejor desvío que ha hecho.',
            a: [
              ['La ruta de siempre, la más segura', 'Conocer cada curva, qué gusto.'],
              ['Carreteras pequeñas y desvíos', 'Un desvío es una sorpresa.'],
            ],
          },
          pt: {
            t: 'Na estrada, seu itinerário…',
            o: 'Pergunte qual foi o desvio mais bonito que essa pessoa já fez.',
            a: [
              ['O caminho de sempre, o mais seguro', 'Conhecer cada curva, que conforto.'],
              ['Estradinhas e desvios', 'Um desvio é uma surpresa.'],
            ],
          },
          nl: {
            t: 'Onderweg is je route…',
            o: 'Vraag naar de mooiste omweg die die persoon ooit maakte.',
            a: [
              ['De vaste weg, de veiligste', 'Elke bocht kennen, zo vertrouwd.'],
              ['Kleine weggetjes en omwegen', 'Een omweg is een verrassing.'],
            ],
          },
        }),
        c('voyages_escale', 'rythme', [['🏙️', 80, 'ville'], ['📖', -60, 'calme'], ['🛍️', 20, null]], {
          fr: {
            t: 'Une escale de cinq heures dans une ville inconnue.',
            o: 'Demande-lui ce qu’elle ou il fait pendant une longue escale.',
            a: [
              ['Je sors visiter la ville', 'Une ville bonus, quelle chance !'],
              ['Je m’installe dans un coin tranquille', 'Une pause entre deux départs.'],
              ['Je fais le tour des boutiques', 'Lèche-vitrine international.'],
            ],
          },
          en: {
            t: 'A five-hour stopover in an unknown city.',
            o: 'Ask them what they do during a long stopover.',
            a: [
              ['I head out to see the city', 'A bonus city, how lucky!'],
              ['I settle in a quiet corner', 'A pause between two departures.'],
              ['I browse the shops', 'International window shopping.'],
            ],
          },
          es: {
            t: 'Una escala de cinco horas en una ciudad desconocida.',
            o: 'Pregúntale qué hace durante una escala larga.',
            a: [
              ['Salgo a ver la ciudad', '¡Una ciudad extra, qué suerte!'],
              ['Me instalo en un rincón tranquilo', 'Una pausa entre dos salidas.'],
              ['Me doy una vuelta por las tiendas', 'Escaparates internacionales.'],
            ],
          },
          pt: {
            t: 'Uma escala de cinco horas numa cidade desconhecida.',
            o: 'Pergunte o que essa pessoa faz numa escala longa.',
            a: [
              ['Saio pra conhecer a cidade', 'Uma cidade bônus, que sorte!'],
              ['Me instalo num cantinho tranquilo', 'Uma pausa entre duas partidas.'],
              ['Dou uma volta pelas lojas', 'Vitrines internacionais.'],
            ],
          },
          nl: {
            t: 'Een overstap van vijf uur in een onbekende stad.',
            o: 'Vraag wat die persoon doet tijdens een lange overstap.',
            a: [
              ['Ik ga de stad bekijken', 'Een bonusstad, wat een geluk!'],
              ['Ik zoek een rustig hoekje', 'Een pauze tussen twee vertrekken.'],
              ['Ik loop langs de winkeltjes', 'Internationaal etalages kijken.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_6',
      title: { fr: 'Où dormir', en: 'Where to stay', es: 'Dónde dormir', pt: 'Onde ficar', nl: 'Waar slapen' },
      questions: [
        c('voyages_logement', 'foyer', [['🏨', -60, 'liberte'], ['🏡', 70, 'accueil'], ['🛏️', 30, 'curiosite']], {
          fr: {
            t: 'Pour dormir en voyage, tu choisis…',
            o: 'Demande-lui son logement de voyage préféré.',
            a: [
              ['Une chambre rien qu’à moi', 'Ton royaume, ta clé, ton calme.'],
              ['Une grande maison à partager', 'Je réserve le lit près de la fenêtre !'],
              ['Chez l’habitant, pour rencontrer', 'Petit-déjeuner et histoires locales.'],
            ],
          },
          en: {
            t: 'To sleep while travelling, you choose…',
            o: 'Ask them about their favourite kind of place to stay.',
            a: [
              ['A room all to myself', 'Your kingdom, your key, your calm.'],
              ['A big house to share', 'Dibs on the bed by the window!'],
              ['A local’s home, to meet people', 'Breakfast and local stories.'],
            ],
          },
          es: {
            t: 'Para dormir de viaje, eliges…',
            o: 'Pregúntale cuál es su alojamiento de viaje favorito.',
            a: [
              ['Una habitación solo para mí', 'Tu reino, tu llave, tu calma.'],
              ['Una casa grande para compartir', '¡Me pido la cama junto a la ventana!'],
              ['En casa de alguien de allí, para conocer gente', 'Desayuno e historias locales.'],
            ],
          },
          pt: {
            t: 'Para dormir na viagem, você escolhe…',
            o: 'Pergunte qual é a hospedagem de viagem favorita dessa pessoa.',
            a: [
              ['Um quarto só pra mim', 'Seu reino, sua chave, sua calma.'],
              ['Uma casa grande pra dividir', 'Quero a cama perto da janela!'],
              ['Na casa de um morador, pra conhecer gente', 'Café da manhã e histórias locais.'],
            ],
          },
          nl: {
            t: 'Om te slapen op reis kies je…',
            o: 'Vraag naar het favoriete soort verblijf van die persoon.',
            a: [
              ['Een kamer helemaal voor mij', 'Jouw rijk, jouw sleutel, jouw rust.'],
              ['Een groot huis om te delen', 'Ik claim het bed bij het raam!'],
              ['Bij iemand thuis, om mensen te leren kennen', 'Ontbijt en lokale verhalen.'],
            ],
          },
        }),
        s('voyages_logement_style', 'ancrage', ['🛌', -100, 'racines'], ['🛶', 100, 'aventure'], {
          fr: { t: 'Ton logement idéal en voyage…', o: 'Demande-lui l’endroit le plus insolite où elle ou il ait dormi.', a: [['Comme à la maison, avec mes repères', 'Un cocon loin de chez toi.'], ['Insolite : cabane, bateau, yourte', 'Une nuit dans un arbre ? J’en suis !']], m: 'Confortable, avec une touche locale.' },
          en: { t: 'Your ideal place to stay while travelling…', o: 'Ask them about the most unusual place they’ve slept.', a: [['Like home, with my bearings', 'A cocoon far from home.'], ['Unusual: treehouse, boat, yurt', 'A night in a tree? Count me in!']], m: 'Comfortable, with a local touch.' },
          es: { t: 'Tu alojamiento ideal de viaje…', o: 'Pregúntale cuál es el sitio más insólito donde ha dormido.', a: [['Como en casa, con mis referencias', 'Un nido lejos de casa.'], ['Insólito: cabaña, barco, yurta', '¿Una noche en un árbol? ¡Me apunto!']], m: 'Cómodo, con un toque local.' },
          pt: { t: 'Sua hospedagem ideal em viagem…', o: 'Pergunte qual foi o lugar mais inusitado onde essa pessoa já dormiu.', a: [['Como em casa, com minhas referências', 'Um ninho longe de casa.'], ['Inusitada: cabana, barco, iurta', 'Uma noite numa árvore? Tô dentro!']], m: 'Confortável, com um toque local.' },
          nl: { t: 'Je ideale verblijf op reis…', o: 'Vraag naar de vreemdste plek waar die persoon ooit sliep.', a: [['Zoals thuis, met mijn vertrouwde dingen', 'Een cocon ver van huis.'], ['Bijzonder: boomhut, boot, joert', 'Een nacht in een boom? Ik doe mee!']], m: 'Comfortabel, met een lokaal tintje.' },
        }),
        c('voyages_arrivee', 'cap', [['🧳', 70, 'ordre'], ['🚪', -60, 'spontane']], {
          fr: {
            t: 'Tu arrives à ton logement.',
            o: 'Demande-lui ce qu’elle ou il fait en premier en arrivant quelque part.',
            a: [
              ['Je défais ma valise et je range tout', 'Les cintres sont alignés, bravo.'],
              ['Je pose mon sac et je file dehors', 'Le sac attendra, la ville non !'],
            ],
          },
          en: {
            t: 'You arrive at your accommodation.',
            o: 'Ask them what they do first when they arrive somewhere.',
            a: [
              ['I unpack and put everything away', 'Hangers all lined up, bravo.'],
              ['I drop my bag and head out', 'The bag can wait, the city can’t!'],
            ],
          },
          es: {
            t: 'Llegas a tu alojamiento.',
            o: 'Pregúntale qué hace primero al llegar a un sitio.',
            a: [
              ['Deshago la maleta y lo ordeno todo', 'Perchas alineadas, bravo.'],
              ['Dejo la mochila y salgo', '¡La mochila puede esperar, la ciudad no!'],
            ],
          },
          pt: {
            t: 'Você chega à hospedagem.',
            o: 'Pergunte o que essa pessoa faz primeiro ao chegar a um lugar.',
            a: [
              ['Desfaço a mala e arrumo tudo', 'Cabides alinhados, parabéns.'],
              ['Largo a mochila e saio', 'A mochila espera, a cidade não!'],
            ],
          },
          nl: {
            t: 'Je komt aan bij je verblijf.',
            o: 'Vraag wat die persoon als eerste doet bij aankomst.',
            a: [
              ['Ik pak uit en ruim alles op', 'Kleerhangers netjes op een rij, knap.'],
              ['Ik zet mijn tas neer en ga naar buiten', 'De tas kan wachten, de stad niet!'],
            ],
          },
        }),
        c('voyages_quartier', 'rythme', [['🎶', 70, 'monde'], ['🌾', -70, 'calme'], ['🚲', 10, null]], {
          fr: {
            t: 'Ton logement est idéalement…',
            o: 'Demande-lui dans quel genre de quartier elle ou il aime loger.',
            a: [
              ['En plein centre, au cœur de l’animation', 'La fête sous la fenêtre !'],
              ['À l’écart, au calme', 'Le chant des grillons pour berceuse.'],
              ['Un peu à l’écart, avec un vélo', 'Le meilleur des deux, à pédales.'],
            ],
          },
          en: {
            t: 'Your accommodation is ideally…',
            o: 'Ask them what kind of area they like staying in.',
            a: [
              ['Right in the centre, where it’s buzzing', 'The party under the window!'],
              ['Out of the way, peaceful', 'Crickets for a lullaby.'],
              ['A bit out, with a bike', 'Best of both, pedal-powered.'],
            ],
          },
          es: {
            t: 'Tu alojamiento, idealmente, está…',
            o: 'Pregúntale en qué tipo de barrio le gusta alojarse.',
            a: [
              ['En pleno centro, donde hay ambiente', '¡La fiesta bajo la ventana!'],
              ['Apartado, en calma', 'Los grillos de nana.'],
              ['Algo apartado, con bici', 'Lo mejor de ambos, a pedales.'],
            ],
          },
          pt: {
            t: 'Sua hospedagem fica, idealmente…',
            o: 'Pergunte em que tipo de bairro essa pessoa gosta de ficar.',
            a: [
              ['Bem no centro, no meio do agito', 'A festa embaixo da janela!'],
              ['Mais afastada, na calma', 'Os grilos como canção de ninar.'],
              ['Um pouco afastada, com uma bicicleta', 'O melhor dos dois, no pedal.'],
            ],
          },
          nl: {
            t: 'Je verblijf ligt het liefst…',
            o: 'Vraag in wat voor buurt die persoon graag verblijft.',
            a: [
              ['Midden in het centrum, waar het bruist', 'Het feest onder het raam!'],
              ['Afgelegen, in de rust', 'Krekels als slaapliedje.'],
              ['Iets buiten het centrum, met een fiets', 'Het beste van twee werelden, op pedalen.'],
            ],
          },
        }),
        c('voyages_premier_matin', 'elan', [['🌅', 70, 'projets'], ['😴', -70, 'temps_libre'], ['🥐', -10, null]], {
          fr: {
            t: 'Premier matin sur place.',
            o: 'Demande-lui comment commence sa première journée en voyage.',
            a: [
              ['Réveil à 6 h pour tout voir', 'Le soleil et toi, même horaire.'],
              ['Grasse matinée, on est en vacances', 'Chut, je ferme les volets.'],
              ['Long petit-déjeuner, puis on verra', 'Le programme commence par une tartine.'],
            ],
          },
          en: {
            t: 'First morning there.',
            o: 'Ask them how their first day on a trip begins.',
            a: [
              ['Up at 6 to see everything', 'You and the sun, same schedule.'],
              ['A lie-in, we’re on holiday', 'Shh, I’m closing the shutters.'],
              ['Long breakfast, then we’ll see', 'The plan starts with toast.'],
            ],
          },
          es: {
            t: 'Primera mañana allí.',
            o: 'Pregúntale cómo empieza su primer día de viaje.',
            a: [
              ['Me levanto a las 6 para verlo todo', 'Tú y el sol, mismo horario.'],
              ['Dormir hasta tarde, estamos de vacaciones', 'Chis, cierro las persianas.'],
              ['Desayuno largo, y luego ya veremos', 'El plan empieza con una tostada.'],
            ],
          },
          pt: {
            t: 'Primeira manhã no destino.',
            o: 'Pergunte como começa o primeiro dia de viagem dessa pessoa.',
            a: [
              ['Acordo às 6h pra ver tudo', 'Você e o sol, mesmo horário.'],
              ['Durmo até tarde, estamos de férias', 'Psiu, vou fechar a janela.'],
              ['Café da manhã demorado, depois vemos', 'O plano começa com um pão na chapa.'],
            ],
          },
          nl: {
            t: 'De eerste ochtend ter plekke.',
            o: 'Vraag hoe de eerste reisdag van die persoon begint.',
            a: [
              ['Om 6 uur op om alles te zien', 'Jij en de zon, zelfde rooster.'],
              ['Uitslapen, het is vakantie', 'Sst, ik doe de luiken dicht.'],
              ['Lang ontbijten, dan zien we wel', 'Het plan begint met een boterham.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_7',
      title: { fr: 'Explorer', en: 'Exploring', es: 'Explorar', pt: 'Explorar', nl: 'Verkennen' },
      questions: [
        s('voyages_se_perdre', 'cap', ['🍃', -100, 'spontane'], ['🗺️', 100, 'plan'], {
          fr: { t: 'Dans une ville que tu ne connais pas…', o: 'Demande-lui si elle ou il aime se perdre en voyage.', a: [['Je me perds exprès', 'Les plus belles rues sont cachées.'], ['Je suis mon itinéraire', 'Le GPS te dit merci.']], m: 'Un itinéraire, et quelques détours.' },
          en: { t: 'In a city you don’t know…', o: 'Ask them if they like getting lost when travelling.', a: [['I get lost on purpose', 'The best streets are hidden.'], ['I follow my route', 'The satnav thanks you.']], m: 'A route, and a few detours.' },
          es: { t: 'En una ciudad que no conoces…', o: 'Pregúntale si le gusta perderse cuando viaja.', a: [['Me pierdo a propósito', 'Las calles más bonitas están escondidas.'], ['Sigo mi itinerario', 'El GPS te da las gracias.']], m: 'Un itinerario, y algún desvío.' },
          pt: { t: 'Numa cidade que você não conhece…', o: 'Pergunte se essa pessoa gosta de se perder em viagem.', a: [['Me perco de propósito', 'As ruas mais bonitas ficam escondidas.'], ['Sigo meu roteiro', 'O GPS agradece.']], m: 'Um roteiro, e alguns desvios.' },
          nl: { t: 'In een stad die je niet kent…', o: 'Vraag of die persoon graag verdwaalt op reis.', a: [['Ik verdwaal expres', 'De mooiste straatjes zijn verstopt.'], ['Ik volg mijn route', 'De navigatie bedankt je.']], m: 'Een route, met wat omwegen.' },
        }),
        c('voyages_incontournables', 'ancrage', [['📸', -50, 'racines'], ['🔎', 70, 'curiosite']], {
          fr: {
            t: 'Les monuments célèbres…',
            o: 'Demande-lui le lieu secret qu’elle ou il a découvert en voyage.',
            a: [
              ['Je veux voir les incontournables', 'La carte postale, en vrai !'],
              ['Je préfère les coins que personne ne visite', 'Un trésor caché rien que pour nous.'],
            ],
          },
          en: {
            t: 'The famous landmarks…',
            o: 'Ask them about a hidden spot they discovered while travelling.',
            a: [
              ['I want to see the must-sees', 'The postcard, in real life!'],
              ['I prefer places nobody visits', 'A hidden treasure just for us.'],
            ],
          },
          es: {
            t: 'Los monumentos famosos…',
            o: 'Pregúntale qué rincón secreto ha descubierto de viaje.',
            a: [
              ['Quiero ver los imprescindibles', '¡La postal, en persona!'],
              ['Prefiero los sitios que nadie visita', 'Un tesoro escondido solo para nosotros.'],
            ],
          },
          pt: {
            t: 'Os monumentos famosos…',
            o: 'Pergunte que cantinho secreto essa pessoa descobriu viajando.',
            a: [
              ['Quero ver os imperdíveis', 'O cartão-postal, ao vivo!'],
              ['Prefiro os lugares que ninguém visita', 'Um tesouro escondido só pra gente.'],
            ],
          },
          nl: {
            t: 'De bekende bezienswaardigheden…',
            o: 'Vraag naar een verborgen plekje dat die persoon op reis ontdekte.',
            a: [
              ['Ik wil de hoogtepunten zien', 'De ansichtkaart, in het echt!'],
              ['Ik ga liever waar niemand komt', 'Een verborgen schat, alleen voor ons.'],
            ],
          },
        }),
        c('voyages_visite_groupe', 'foyer', [['🤝', 70, 'accueil'], ['🚶', -70, 'liberte'], ['🗣️', 20, null]], {
          fr: {
            t: 'Pour découvrir les lieux, tu…',
            o: 'Demande-lui comment elle ou il aime découvrir un nouvel endroit.',
            a: [
              ['Rejoins une visite en groupe', 'Plein de nouvelles têtes, j’adore.'],
              ['Explores à ta guise, à ton rythme', 'Libre comme un nuage.'],
              ['Discutes avec les gens du coin', 'Les meilleures visites sont des conversations.'],
            ],
          },
          en: {
            t: 'To discover a place, you…',
            o: 'Ask them how they like discovering a new place.',
            a: [
              ['Join a group tour', 'So many new faces, love it.'],
              ['Wander as you please, at your pace', 'Free as a cloud.'],
              ['Chat with the locals', 'The best tours are conversations.'],
            ],
          },
          es: {
            t: 'Para descubrir un lugar, tú…',
            o: 'Pregúntale cómo le gusta descubrir un sitio nuevo.',
            a: [
              ['Te unes a una visita en grupo', 'Muchas caras nuevas, me encanta.'],
              ['Exploras a tu aire, a tu ritmo', 'Libre como una nube.'],
              ['Charlas con la gente de allí', 'Las mejores visitas son conversaciones.'],
            ],
          },
          pt: {
            t: 'Para conhecer um lugar, você…',
            o: 'Pergunte como essa pessoa gosta de descobrir um lugar novo.',
            a: [
              ['Entra numa visita em grupo', 'Um monte de gente nova, adoro.'],
              ['Explora do seu jeito, no seu ritmo', 'Livre como uma nuvem.'],
              ['Conversa com os moradores', 'As melhores visitas são conversas.'],
            ],
          },
          nl: {
            t: 'Om een plek te ontdekken…',
            o: 'Vraag hoe die persoon graag een nieuwe plek ontdekt.',
            a: [
              ['Sluit je aan bij een groepsrondleiding', 'Zoveel nieuwe gezichten, top.'],
              ['Verken je op je gemak, in je eigen tempo', 'Vrij als een wolkje.'],
              ['Praat je met mensen uit de buurt', 'De beste rondleidingen zijn gesprekken.'],
            ],
          },
        }),
        c('voyages_journee', 'elan', [['🥾', 70, 'sport'], ['🏖️', -70, 'temps_libre'], ['🏛️', 10, 'curiosite']], {
          fr: {
            t: 'Ta journée idéale sur place…',
            o: 'Demande-lui sa plus belle journée de voyage.',
            a: [
              ['Une randonnée de 20 km', 'Je porte les biscuits, promis.'],
              ['Lecture au bord de l’eau', 'Le clapotis comme bande-son.'],
              ['Un musée, puis une balade', 'Culture et grand air, l’équilibre.'],
            ],
          },
          en: {
            t: 'Your ideal day there…',
            o: 'Ask them about the best day they’ve had on a trip.',
            a: [
              ['A 20 km hike', 'I’ll carry the biscuits, promise.'],
              ['Reading by the water', 'Lapping waves as a soundtrack.'],
              ['A museum, then a stroll', 'Culture and fresh air, balanced.'],
            ],
          },
          es: {
            t: 'Tu día ideal allí…',
            o: 'Pregúntale cuál ha sido su mejor día de viaje.',
            a: [
              ['Una ruta de 20 km', 'Yo llevo las galletas, prometido.'],
              ['Leer junto al agua', 'El chapoteo de banda sonora.'],
              ['Un museo, y luego un paseo', 'Cultura y aire libre, equilibrio.'],
            ],
          },
          pt: {
            t: 'Seu dia ideal no destino…',
            o: 'Pergunte qual foi o melhor dia de viagem dessa pessoa.',
            a: [
              ['Uma trilha de 20 km', 'Eu levo os biscoitos, prometo.'],
              ['Leitura à beira da água', 'O barulhinho da água de trilha sonora.'],
              ['Um museu, depois um passeio', 'Cultura e ar livre, equilíbrio.'],
            ],
          },
          nl: {
            t: 'Je ideale dag ter plekke…',
            o: 'Vraag naar de mooiste reisdag van die persoon.',
            a: [
              ['Een wandeltocht van 20 km', 'Ik draag de koekjes, beloofd.'],
              ['Lezen aan het water', 'Kabbelend water als soundtrack.'],
              ['Een museum, daarna een wandeling', 'Cultuur en buitenlucht, in balans.'],
            ],
          },
        }),
        s('voyages_soir', 'rythme', ['🌙', -100, 'calme'], ['💃', 100, 'fete'], {
          fr: { t: 'Le soir, en voyage…', o: 'Demande-lui à quoi ressemblent ses soirées en voyage.', a: [['Je rentre tôt, au calme', 'Une bonne nuit pour un grand lendemain.'], ['Je cherche où ça bouge', 'Je te suis sur la piste !']], m: 'Un dîner dehors, puis au lit.' },
          en: { t: 'In the evening, when travelling…', o: 'Ask them what their evenings are like on a trip.', a: [['I head back early, nice and calm', 'A good night for a big day ahead.'], ['I look for where it’s happening', 'I’ll follow you to the dance floor!']], m: 'Dinner out, then bed.' },
          es: { t: 'Por la noche, de viaje…', o: 'Pregúntale cómo son sus noches de viaje.', a: [['Vuelvo pronto, con calma', 'Buena noche para un gran día.'], ['Busco dónde hay marcha', '¡Te sigo a la pista!']], m: 'Una cena fuera y a la cama.' },
          pt: { t: 'À noite, em viagem…', o: 'Pergunte como são as noites de viagem dessa pessoa.', a: [['Volto cedo, na calma', 'Uma boa noite pra um grande dia.'], ['Procuro onde está o agito', 'Te sigo até a pista!']], m: 'Um jantar fora, depois cama.' },
          nl: { t: '’s Avonds, op reis…', o: 'Vraag hoe de avonden van die persoon op reis eruitzien.', a: [['Ik ga vroeg terug, lekker rustig', 'Een goede nacht voor een grote dag.'], ['Ik zoek waar het bruist', 'Ik volg je naar de dansvloer!']], m: 'Uit eten, dan naar bed.' },
        }),
      ],
    },
    {
      id: 'voyages_8',
      title: { fr: 'Manger ailleurs', en: 'Eating abroad', es: 'Comer fuera', pt: 'Comer longe de casa', nl: 'Eten op reis' },
      questions: [
        c('voyages_plat_inconnu', 'ancrage', [['🍽️', 80, 'curiosite'], ['🍝', -70, 'racines'], ['👉', 20, null]], {
          fr: {
            t: 'Au menu, que des plats que tu ne connais pas.',
            o: 'Demande-lui le plat le plus surprenant goûté en voyage.',
            a: [
              ['Je commande au hasard', 'Roulement de tambour… surprise !'],
              ['Je cherche un plat qui me rassure', 'Un peu de familier, ça fait du bien.'],
              ['Je montre l’assiette d’à côté', 'Technique universelle, efficace.'],
            ],
          },
          en: {
            t: 'The menu is full of dishes you don’t know.',
            o: 'Ask them about the most surprising dish they’ve tasted abroad.',
            a: [
              ['I order at random', 'Drum roll… surprise!'],
              ['I look for something reassuring', 'A bit of the familiar feels good.'],
              ['I point at the next table’s plate', 'Universal technique, works a treat.'],
            ],
          },
          es: {
            t: 'En la carta, solo platos que no conoces.',
            o: 'Pregúntale cuál es el plato más sorprendente que ha probado de viaje.',
            a: [
              ['Pido al azar', 'Redoble de tambor… ¡sorpresa!'],
              ['Busco un plato que me dé confianza', 'Algo conocido sienta bien.'],
              ['Señalo el plato de la mesa de al lado', 'Técnica universal, funciona.'],
            ],
          },
          pt: {
            t: 'No cardápio, só pratos que você não conhece.',
            o: 'Pergunte qual foi o prato mais surpreendente que essa pessoa provou viajando.',
            a: [
              ['Peço no escuro', 'Rufem os tambores… surpresa!'],
              ['Procuro um prato que me dê segurança', 'Um pouco de familiar faz bem.'],
              ['Aponto o prato da mesa ao lado', 'Técnica universal, funciona.'],
            ],
          },
          nl: {
            t: 'Op de kaart staan alleen gerechten die je niet kent.',
            o: 'Vraag naar het verrassendste gerecht dat die persoon op reis proefde.',
            a: [
              ['Ik bestel op goed geluk', 'Tromgeroffel… verrassing!'],
              ['Ik zoek iets vertrouwds', 'Een beetje bekend doet goed.'],
              ['Ik wijs het bord van de buurtafel aan', 'Universele techniek, werkt altijd.'],
            ],
          },
        }),
        c('voyages_resto_choix', 'cap', [['📲', 70, 'plan'], ['👃', -70, 'spontane']], {
          fr: {
            t: 'Pour trouver où manger, tu…',
            o: 'Demande-lui comment elle ou il trouve ses bonnes adresses en voyage.',
            a: [
              ['Réserves les adresses repérées avant', 'Table réservée, ventre serein.'],
              ['Suis ton nez dans la rue', 'Ton nez, meilleur guide du monde.'],
            ],
          },
          en: {
            t: 'To find somewhere to eat, you…',
            o: 'Ask them how they find good places to eat when travelling.',
            a: [
              ['Book the places you scouted beforehand', 'Table booked, happy tummy.'],
              ['Follow your nose down the street', 'Your nose, the best guide in the world.'],
            ],
          },
          es: {
            t: 'Para encontrar dónde comer, tú…',
            o: 'Pregúntale cómo encuentra buenos sitios para comer de viaje.',
            a: [
              ['Reservas los sitios que fichaste antes', 'Mesa reservada, tripa tranquila.'],
              ['Sigues tu olfato por la calle', 'Tu nariz, la mejor guía del mundo.'],
            ],
          },
          pt: {
            t: 'Para achar onde comer, você…',
            o: 'Pergunte como essa pessoa acha bons lugares para comer viajando.',
            a: [
              ['Reserva os lugares que pesquisou antes', 'Mesa reservada, barriga tranquila.'],
              ['Segue o seu nariz pela rua', 'Seu nariz, o melhor guia do mundo.'],
            ],
          },
          nl: {
            t: 'Om een plek te vinden om te eten…',
            o: 'Vraag hoe die persoon op reis goede eetadresjes vindt.',
            a: [
              ['Reserveer je de adresjes die je vooraf vond', 'Tafel gereserveerd, buik tevreden.'],
              ['Volg je je neus door de straat', 'Je neus, de beste gids ter wereld.'],
            ],
          },
        }),
        s('voyages_repas_ideal', 'rythme', ['🧺', -100, 'calme'], ['🏮', 100, 'monde'], {
          fr: { t: 'Ton repas idéal en voyage…', o: 'Demande-lui son plus beau repas de voyage.', a: [['Un pique-nique au calme', 'Une nappe, une vue, le bonheur.'], ['Un marché de nuit bondé', 'Les lanternes, les odeurs, j’adore !']], m: 'Une petite terrasse animée.' },
          en: { t: 'Your ideal meal while travelling…', o: 'Ask them about the best meal they’ve had on a trip.', a: [['A quiet picnic', 'A blanket, a view, pure joy.'], ['A packed night market', 'The lanterns, the smells, love it!']], m: 'A small, lively terrace.' },
          es: { t: 'Tu comida ideal de viaje…', o: 'Pregúntale cuál ha sido su mejor comida de viaje.', a: [['Un pícnic tranquilo', 'Un mantel, unas vistas, felicidad.'], ['Un mercado nocturno abarrotado', '¡Los farolillos, los olores, me encanta!']], m: 'Una terracita animada.' },
          pt: { t: 'Sua refeição ideal em viagem…', o: 'Pergunte qual foi a melhor refeição de viagem dessa pessoa.', a: [['Um piquenique tranquilo', 'Uma toalha, uma vista, felicidade.'], ['Uma feira noturna lotada', 'As lanternas, os cheiros, adoro!']], m: 'Uma mesinha ao ar livre, animada.' },
          nl: { t: 'Je ideale maaltijd op reis…', o: 'Vraag naar de lekkerste maaltijd van die persoon op reis.', a: [['Een rustige picknick', 'Een kleed, een uitzicht, geluk.'], ['Een drukke avondmarkt', 'De lampionnen, de geuren, heerlijk!']], m: 'Een klein, levendig terras.' },
        }),
        c('voyages_table_partagee', 'foyer', [['😊', 70, 'accueil'], ['🪑', -60, 'liberte']], {
          fr: {
            t: 'Dans une cantine locale, on te propose une table partagée.',
            o: 'Demande-lui si elle ou il aime manger avec des inconnus.',
            a: [
              ['Avec plaisir, j’adore', 'Nouveaux voisins, nouvelles histoires.'],
              ['Je préfère une petite table à moi', 'Ton petit coin, en toute tranquillité.'],
            ],
          },
          en: {
            t: 'At a local canteen, you’re offered a shared table.',
            o: 'Ask them if they enjoy eating with strangers.',
            a: [
              ['Gladly, I love it', 'New neighbours, new stories.'],
              ['I’d rather have a small table to myself', 'Your little corner, in peace.'],
            ],
          },
          es: {
            t: 'En un comedor local, te ofrecen una mesa compartida.',
            o: 'Pregúntale si le gusta comer con desconocidos.',
            a: [
              ['Con mucho gusto, me encanta', 'Vecinos nuevos, historias nuevas.'],
              ['Prefiero una mesita para mí', 'Tu rinconcito, con toda la calma.'],
            ],
          },
          pt: {
            t: 'Num restaurante local, te oferecem uma mesa compartilhada.',
            o: 'Pergunte se essa pessoa gosta de comer com desconhecidos.',
            a: [
              ['Com prazer, adoro', 'Novos vizinhos, novas histórias.'],
              ['Prefiro uma mesinha só pra mim', 'Seu cantinho, com toda a calma.'],
            ],
          },
          nl: {
            t: 'In een lokaal eethuisje krijg je een gedeelde tafel aangeboden.',
            o: 'Vraag of die persoon graag met onbekenden eet.',
            a: [
              ['Graag, daar hou ik van', 'Nieuwe buren, nieuwe verhalen.'],
              ['Ik heb liever een tafeltje voor mezelf', 'Je eigen hoekje, in alle rust.'],
            ],
          },
        }),
        c('voyages_cours_cuisine', 'elan', [['🧑‍🍳', 70, 'cuisine'], ['😋', -60, 'temps_libre']], {
          fr: {
            t: 'On te propose un cours de cuisine locale.',
            o: 'Demande-lui quel plat d’ailleurs elle ou il sait cuisiner.',
            a: [
              ['Je m’inscris, je veux refaire les plats chez moi', 'Tu rapportes des recettes, pas des magnets.'],
              ['Je préfère juste manger', 'Manger, c’est aussi apprendre.'],
            ],
          },
          en: {
            t: 'You’re offered a local cooking class.',
            o: 'Ask them which dish from abroad they can cook.',
            a: [
              ['I sign up, I want to recreate it at home', 'You bring back recipes, not magnets.'],
              ['I’d rather just eat', 'Eating is learning too.'],
            ],
          },
          es: {
            t: 'Te proponen una clase de cocina local.',
            o: 'Pregúntale qué plato de otro país sabe cocinar.',
            a: [
              ['Me apunto, quiero repetirlo en casa', 'Traes recetas, no imanes.'],
              ['Prefiero solo comer', 'Comer también es aprender.'],
            ],
          },
          pt: {
            t: 'Te oferecem uma aula de culinária local.',
            o: 'Pergunte que prato de outro país essa pessoa sabe cozinhar.',
            a: [
              ['Me inscrevo, quero refazer em casa', 'Você traz receitas, não ímãs.'],
              ['Prefiro só comer', 'Comer também é aprender.'],
            ],
          },
          nl: {
            t: 'Je krijgt een lokale kookles aangeboden.',
            o: 'Vraag welk buitenlands gerecht die persoon kan koken.',
            a: [
              ['Ik schrijf me in, ik wil het thuis namaken', 'Je neemt recepten mee, geen magneetjes.'],
              ['Ik eet liever gewoon', 'Eten is ook leren.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_9',
      title: { fr: 'Partir avec qui', en: 'Who to go with', es: 'Con quién ir', pt: 'Com quem ir', nl: 'Met wie' },
      questions: [
        s('voyages_solo_groupe', 'foyer', ['🎒', -100, 'liberte'], ['🚐', 100, 'accueil'], {
          fr: { t: 'Ton voyage idéal, c’est…', o: 'Demande-lui avec combien de personnes elle ou il aime voyager.', a: [['En solo, libre comme l’air', 'Tes envies, ton chemin.'], ['À dix dans un minibus', 'Je lance la playlist !']], m: 'À deux ou trois, c’est l’idéal.' },
          en: { t: 'Your ideal trip is…', o: 'Ask them how many people they like travelling with.', a: [['Solo, free as a bird', 'Your wishes, your path.'], ['Ten of us in a minibus', 'I’m starting the playlist!']], m: 'Two or three is ideal.' },
          es: { t: 'Tu viaje ideal es…', o: 'Pregúntale con cuántas personas le gusta viajar.', a: [['A solas, libre como el viento', 'Tus ganas, tu camino.'], ['Diez en una furgoneta', '¡Pongo la lista de canciones!']], m: 'De dos o tres, lo ideal.' },
          pt: { t: 'Sua viagem ideal é…', o: 'Pergunte com quantas pessoas essa pessoa gosta de viajar.', a: [['Só eu, livre como o vento', 'Suas vontades, seu caminho.'], ['Em dez numa van', 'Vou soltar a playlist!']], m: 'Em dois ou três, o ideal.' },
          nl: { t: 'Je ideale reis is…', o: 'Vraag met hoeveel mensen die persoon graag reist.', a: [['Alleen, vrij als een vogel', 'Jouw zin, jouw pad.'], ['Met z’n tienen in een busje', 'Ik zet de playlist aan!']], m: 'Met z’n tweeën of drieën, ideaal.' },
        }),
        c('voyages_programme_groupe', 'cap', [['📋', 70, 'plan'], ['🎲', -60, 'spontane'], ['🤝', -10, null]], {
          fr: {
            t: 'Le groupe hésite sur le programme du jour.',
            o: 'Demande-lui quel rôle elle ou il prend quand le groupe hésite.',
            a: [
              ['Je sors le planning que j’ai préparé', 'Sauveteur ou sauveteuse du programme !'],
              ['On tire au sort !', 'Pile : la plage. Face : la plage aussi.'],
              ['Je suis le mouvement', 'Zen, comme une feuille au vent.'],
            ],
          },
          en: {
            t: 'The group can’t decide on today’s plan.',
            o: 'Ask them what role they take when a group can’t decide.',
            a: [
              ['I pull out the plan I prepared', 'The plan’s saviour!'],
              ['Let’s draw lots!', 'Heads: beach. Tails: also beach.'],
              ['I go with the flow', 'Zen, like a leaf in the wind.'],
            ],
          },
          es: {
            t: 'El grupo duda sobre el plan del día.',
            o: 'Pregúntale qué papel tiene cuando el grupo duda.',
            a: [
              ['Saco el plan que preparé', '¡Al rescate del programa!'],
              ['¡Lo echamos a suertes!', 'Cara: playa. Cruz: playa también.'],
              ['Me dejo llevar', 'Zen, como una hoja al viento.'],
            ],
          },
          pt: {
            t: 'O grupo não decide o programa do dia.',
            o: 'Pergunte que papel essa pessoa assume quando o grupo não decide.',
            a: [
              ['Tiro da manga o roteiro que preparei', 'Salvando o programa!'],
              ['Vamos sortear!', 'Cara: praia. Coroa: praia também.'],
              ['Vou na onda', 'Zen, como uma folha ao vento.'],
            ],
          },
          nl: {
            t: 'De groep twijfelt over het programma van vandaag.',
            o: 'Vraag welke rol die persoon pakt als de groep twijfelt.',
            a: [
              ['Ik haal de planning tevoorschijn die ik maakte', 'Redder van het programma!'],
              ['We loten erom!', 'Kop: strand. Munt: ook strand.'],
              ['Ik ga mee met de stroom', 'Zen, als een blaadje in de wind.'],
            ],
          },
        }),
        c('voyages_role', 'elan', [['🧭', 70, 'projets'], ['📸', -20, 'humour'], ['😎', -70, 'temps_libre']], {
          fr: {
            t: 'Dans un voyage à plusieurs, tu es plutôt…',
            o: 'Demande-lui comment elle ou il voyage à plusieurs.',
            a: [
              ['Celle ou celui qui organise tout', 'Chef d’expédition, quelle énergie !'],
              ['Celle ou celui qui prend les photos', 'Tu immortalises nos fous rires.'],
              ['Celle ou celui qui se laisse porter', 'Le voyage en mode coussin d’air.'],
            ],
          },
          en: {
            t: 'On a group trip, you’re usually…',
            o: 'Ask them what kind of travel companion they are.',
            a: [
              ['The one who organises everything', 'Expedition leader, what energy!'],
              ['The one taking the photos', 'You capture our giggles forever.'],
              ['The one who goes along for the ride', 'Travel in hovercraft mode.'],
            ],
          },
          es: {
            t: 'En un viaje en grupo, sueles ser…',
            o: 'Pregúntale qué tipo de compañía de viaje es.',
            a: [
              ['Quien lo organiza todo', '¡Al mando de la expedición, qué energía!'],
              ['Quien hace las fotos', 'Inmortalizas nuestras carcajadas.'],
              ['Quien se deja llevar', 'Viajar en modo colchón de aire.'],
            ],
          },
          pt: {
            t: 'Numa viagem em grupo, você costuma ser…',
            o: 'Pergunte que tipo de companhia de viagem essa pessoa é.',
            a: [
              ['Quem organiza tudo', 'No comando da expedição, que energia!'],
              ['Quem tira as fotos', 'Você eterniza nossas risadas.'],
              ['Quem só vai na onda', 'Viagem no modo almofada.'],
            ],
          },
          nl: {
            t: 'Op een groepsreis ben jij meestal…',
            o: 'Vraag wat voor reisgenoot die persoon is.',
            a: [
              ['Degene die alles regelt', 'Expeditieleider, wat een energie!'],
              ['Degene die de foto’s maakt', 'Jij legt onze lachbuien vast.'],
              ['Degene die zich laat meevoeren', 'Reizen op een luchtkussen.'],
            ],
          },
        }),
        c('voyages_pause_groupe', 'rythme', [['🌿', -70, 'calme'], ['🎉', 70, 'monde']], {
          fr: {
            t: 'Au milieu d’un voyage en groupe…',
            o: 'Demande-lui si elle ou il a besoin de moments pour soi en voyage.',
            a: [
              ['J’ai besoin d’une demi-journée pour moi', 'Une pause douce, bien méritée.'],
              ['Plus on est nombreux, mieux c’est', 'Toute la bande, tout le temps !'],
            ],
          },
          en: {
            t: 'Halfway through a group trip…',
            o: 'Ask them if they need some time alone when travelling.',
            a: [
              ['I need half a day to myself', 'A gentle break, well deserved.'],
              ['The more the merrier', 'The whole gang, all the time!'],
            ],
          },
          es: {
            t: 'A mitad de un viaje en grupo…',
            o: 'Pregúntale si necesita ratos a solas cuando viaja.',
            a: [
              ['Necesito medio día para mí', 'Una pausa suave, bien merecida.'],
              ['Cuantos más, mejor', '¡Toda la pandilla, todo el rato!'],
            ],
          },
          pt: {
            t: 'No meio de uma viagem em grupo…',
            o: 'Pergunte se essa pessoa precisa de momentos só seus em viagem.',
            a: [
              ['Preciso de meio dia pra mim', 'Uma pausa suave, bem merecida.'],
              ['Quanto mais gente, melhor', 'A turma toda, o tempo todo!'],
            ],
          },
          nl: {
            t: 'Halverwege een groepsreis…',
            o: 'Vraag of die persoon op reis tijd voor zichzelf nodig heeft.',
            a: [
              ['Ik heb een halve dag voor mezelf nodig', 'Een zachte pauze, welverdiend.'],
              ['Hoe meer zielen, hoe meer vreugd', 'De hele club, de hele tijd!'],
            ],
          },
        }),
        c('voyages_rencontre_route', 'ancrage', [['🧳', 70, 'curiosite'], ['📍', -60, 'racines']], {
          fr: {
            t: 'Tu rencontres des voyageurs sympas en chemin.',
            o: 'Demande-lui la rencontre de voyage qu’elle ou il n’oubliera jamais.',
            a: [
              ['Je change mes plans pour les suivre', 'Nouvelle route, nouveaux amis !'],
              ['On échange nos contacts, je garde mon cap', 'Fidèle à ton itinéraire, et un ami de plus.'],
            ],
          },
          en: {
            t: 'You meet some lovely travellers along the way.',
            o: 'Ask them about a travel encounter they’ll never forget.',
            a: [
              ['I change my plans to follow them', 'New road, new friends!'],
              ['We swap contacts, I stay on course', 'True to your route, plus a new friend.'],
            ],
          },
          es: {
            t: 'Conoces a viajeros majos por el camino.',
            o: 'Pregúntale por un encuentro de viaje que nunca olvidará.',
            a: [
              ['Cambio mis planes para seguirlos', '¡Nueva ruta, nuevos amigos!'],
              ['Nos pasamos los contactos y sigo mi rumbo', 'Fiel a tu ruta, y con un amigo más.'],
            ],
          },
          pt: {
            t: 'Você conhece viajantes legais pelo caminho.',
            o: 'Pergunte sobre um encontro de viagem que essa pessoa nunca vai esquecer.',
            a: [
              ['Mudo meus planos pra seguir com eles', 'Nova rota, novos amigos!'],
              ['Trocamos contatos e sigo meu rumo', 'Fiel ao seu roteiro, e com um amigo a mais.'],
            ],
          },
          nl: {
            t: 'Je ontmoet onderweg leuke reizigers.',
            o: 'Vraag naar een reisontmoeting die die persoon nooit vergeet.',
            a: [
              ['Ik pas mijn plannen aan om met ze mee te gaan', 'Nieuwe route, nieuwe vrienden!'],
              ['We wisselen contacten uit, ik hou mijn koers', 'Trouw aan je route, met een vriend erbij.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'voyages_10',
      title: { fr: 'Le retour', en: 'Coming home', es: 'La vuelta', pt: 'A volta', nl: 'Thuiskomen' },
      questions: [
        c('voyages_souvenirs', 'foyer', [['🎁', 70, 'accueil'], ['🪨', -60, 'liberte'], ['📮', 20, null]], {
          fr: {
            t: 'Tu rapportes de voyage…',
            o: 'Demande-lui le plus beau souvenir qu’elle ou il ait rapporté.',
            a: [
              ['Un petit cadeau pour chacun', 'Ta valise déborde d’attentions.'],
              ['Un seul objet, pour moi', 'Un trésor qui raconte tout.'],
              ['Des cartes postales envoyées de là-bas', 'Des nouvelles avec un timbre, quel charme.'],
            ],
          },
          en: {
            t: 'From your trip, you bring back…',
            o: 'Ask them about the best souvenir they’ve brought home.',
            a: [
              ['A little gift for everyone', 'Your suitcase overflows with kindness.'],
              ['Just one object, for me', 'A treasure that tells it all.'],
              ['Postcards sent from there', 'News with a stamp, how charming.'],
            ],
          },
          es: {
            t: 'De tu viaje, traes…',
            o: 'Pregúntale cuál es el mejor recuerdo que ha traído de un viaje.',
            a: [
              ['Un detallito para cada uno', 'Tu maleta rebosa de detalles.'],
              ['Un solo objeto, para mí', 'Un tesoro que lo cuenta todo.'],
              ['Postales enviadas desde allí', 'Noticias con sello, qué encanto.'],
            ],
          },
          pt: {
            t: 'Da viagem, você traz…',
            o: 'Pergunte qual foi a melhor lembrança que essa pessoa já trouxe de viagem.',
            a: [
              ['Um presentinho pra cada um', 'Sua mala transborda de carinho.'],
              ['Um único objeto, pra mim', 'Um tesouro que conta tudo.'],
              ['Cartões-postais enviados de lá', 'Notícias com selo, que charme.'],
            ],
          },
          nl: {
            t: 'Van je reis neem je mee…',
            o: 'Vraag naar het mooiste souvenir dat die persoon ooit meenam.',
            a: [
              ['Een klein cadeautje voor iedereen', 'Je koffer puilt uit van aandacht.'],
              ['Eén voorwerp, voor mezelf', 'Een schat die alles vertelt.'],
              ['Ansichtkaarten, vanuit daar verstuurd', 'Nieuws met een postzegel, zo charmant.'],
            ],
          },
        }),
        s('voyages_retour_maison', 'ancrage', ['🏠', -100, 'racines'], ['✈️', 100, 'voyage'], {
          fr: { t: 'Le retour à la maison…', o: 'Demande-lui ce qu’elle ou il aime retrouver en rentrant.', a: [['Quel bonheur de retrouver mon chez-moi', 'Ton lit t’attendait sagement.'], ['Je pense déjà au prochain départ', 'On repart quand ? Demain ?']], m: 'Un peu des deux, selon le voyage.' },
          en: { t: 'Coming home…', o: 'Ask them what they love coming back to.', a: [['Such joy to be back home', 'Your bed waited patiently.'], ['I’m already thinking about the next trip', 'When do we leave? Tomorrow?']], m: 'A bit of both, depending on the trip.' },
          es: { t: 'La vuelta a casa…', o: 'Pregúntale qué le gusta reencontrar al volver.', a: [['Qué felicidad volver a mi casa', 'Tu cama te esperaba tranquila.'], ['Ya pienso en el próximo viaje', '¿Cuándo nos vamos? ¿Mañana?']], m: 'Un poco de cada, según el viaje.' },
          pt: { t: 'A volta pra casa…', o: 'Pergunte do que essa pessoa gosta de reencontrar ao voltar.', a: [['Que alegria voltar pro meu canto', 'Sua cama te esperou quietinha.'], ['Já penso na próxima viagem', 'Quando a gente vai? Amanhã?']], m: 'Um pouco de cada, depende da viagem.' },
          nl: { t: 'Thuiskomen…', o: 'Vraag waar die persoon graag naar terugkeert.', a: [['Wat fijn om weer thuis te zijn', 'Je bed heeft braaf gewacht.'], ['Ik denk al aan de volgende reis', 'Wanneer gaan we weer? Morgen?']], m: 'Een beetje van allebei, per reis anders.' },
        }),
        c('voyages_photos', 'cap', [['🗂️', 80, 'ordre'], ['📱', -60, 'spontane'], ['🖼️', 20, null]], {
          fr: {
            t: 'Tes photos de voyage…',
            o: 'Demande-lui sa photo de voyage préférée.',
            a: [
              ['Triées, légendées, dans un album', 'Un vrai livre de souvenirs.'],
              ['Trois mille en vrac dans mon téléphone', 'Un trésor à fouiller un jour de pluie.'],
              ['Une seule imprimée, au mur', 'Une photo, mille souvenirs.'],
            ],
          },
          en: {
            t: 'Your travel photos…',
            o: 'Ask them about their favourite travel photo.',
            a: [
              ['Sorted, captioned, in an album', 'A real book of memories.'],
              ['Three thousand jumbled on my phone', 'A treasure to dig through on a rainy day.'],
              ['Just one printed, on the wall', 'One photo, a thousand memories.'],
            ],
          },
          es: {
            t: 'Tus fotos de viaje…',
            o: 'Pregúntale cuál es su foto de viaje favorita.',
            a: [
              ['Ordenadas, con pie de foto, en un álbum', 'Un auténtico libro de recuerdos.'],
              ['Tres mil revueltas en el móvil', 'Un tesoro para un día de lluvia.'],
              ['Solo una impresa, en la pared', 'Una foto, mil recuerdos.'],
            ],
          },
          pt: {
            t: 'Suas fotos de viagem…',
            o: 'Pergunte qual é a foto de viagem favorita dessa pessoa.',
            a: [
              ['Organizadas, com legenda, num álbum', 'Um verdadeiro livro de memórias.'],
              ['Três mil bagunçadas no celular', 'Um tesouro pra garimpar num dia de chuva.'],
              ['Só uma impressa, na parede', 'Uma foto, mil lembranças.'],
            ],
          },
          nl: {
            t: 'Je reisfoto’s…',
            o: 'Vraag naar de favoriete reisfoto van die persoon.',
            a: [
              ['Gesorteerd, met bijschrift, in een album', 'Een echt herinneringenboek.'],
              ['Drieduizend door elkaar op mijn telefoon', 'Een schat om op een regendag door te spitten.'],
              ['Eén afgedrukt, aan de muur', 'Eén foto, duizend herinneringen.'],
            ],
          },
        }),
        c('voyages_recit', 'rythme', [['🍽️', 70, 'monde'], ['☕', -40, 'calme'], ['📓', -80, 'cocooning']], {
          fr: {
            t: 'De retour, tu racontes ton voyage…',
            o: 'Demande-lui de te raconter son dernier voyage.',
            a: [
              ['Lors d’un dîner avec tout le monde', 'Diaporama et dessert, la soirée parfaite.'],
              ['À une ou deux personnes, autour d’un thé', 'Les confidences de voyage, ma préférence.'],
              ['Dans mon carnet, chez moi', 'Ton carnet garde tout au chaud.'],
            ],
          },
          en: {
            t: 'Back home, you tell the story of your trip…',
            o: 'Ask them to tell you about their last trip.',
            a: [
              ['Over dinner with everyone', 'Slideshow and pudding, perfect evening.'],
              ['To one or two people, over tea', 'Travel confidences, my favourite.'],
              ['In my notebook, at home', 'Your notebook keeps it all warm.'],
            ],
          },
          es: {
            t: 'De vuelta, cuentas tu viaje…',
            o: 'Pídele que te cuente su último viaje.',
            a: [
              ['En una cena con todo el mundo', 'Fotos y postre, la noche perfecta.'],
              ['A una o dos personas, con un té', 'Las confidencias de viaje, mis favoritas.'],
              ['En mi libreta, en casa', 'Tu libreta lo guarda todo calentito.'],
            ],
          },
          pt: {
            t: 'De volta, você conta sua viagem…',
            o: 'Peça para essa pessoa contar sobre a última viagem.',
            a: [
              ['Num jantar com todo mundo', 'Fotos e sobremesa, a noite perfeita.'],
              ['Pra uma ou duas pessoas, com um chá', 'Confidências de viagem, minhas favoritas.'],
              ['No meu caderno, em casa', 'Seu caderno guarda tudo quentinho.'],
            ],
          },
          nl: {
            t: 'Terug thuis vertel je over je reis…',
            o: 'Vraag die persoon over de laatste reis te vertellen.',
            a: [
              ['Tijdens een etentje met iedereen', 'Diavoorstelling en toetje, perfecte avond.'],
              ['Aan een of twee mensen, bij een kop thee', 'Reisverhalen onder vier ogen, mijn favoriet.'],
              ['In mijn schrift, thuis', 'Je schrift houdt alles warm.'],
            ],
          },
        }),
        c('voyages_lendemain', 'elan', [['🚀', 70, 'projets'], ['🛋️', -70, 'temps_libre']], {
          fr: {
            t: 'Le lendemain du retour…',
            o: 'Demande-lui comment elle ou il reprend le quotidien après un voyage.',
            a: [
              ['Je reprends mes projets, plein d’idées', 'Le voyage t’a rechargé les batteries !'],
              ['Je garde un jour de plus pour atterrir', 'Atterrissage en douceur, c’est malin.'],
            ],
          },
          en: {
            t: 'The day after you get back…',
            o: 'Ask them how they ease back into everyday life after a trip.',
            a: [
              ['I dive back into my projects, full of ideas', 'The trip recharged your batteries!'],
              ['I keep an extra day to land', 'Soft landing, smart move.'],
            ],
          },
          es: {
            t: 'El día después de volver…',
            o: 'Pregúntale cómo retoma el día a día después de un viaje.',
            a: [
              ['Retomo mis proyectos, con mil ideas', '¡El viaje te ha cargado las pilas!'],
              ['Me guardo un día más para aterrizar', 'Aterrizaje suave, muy listo.'],
            ],
          },
          pt: {
            t: 'No dia seguinte à volta…',
            o: 'Pergunte como essa pessoa retoma a rotina depois de uma viagem.',
            a: [
              ['Retomo meus projetos, com mil ideias', 'A viagem recarregou suas baterias!'],
              ['Guardo um dia a mais pra aterrissar', 'Pouso suave, esperto.'],
            ],
          },
          nl: {
            t: 'De dag na thuiskomst…',
            o: 'Vraag hoe die persoon na een reis weer in het dagelijks leven stapt.',
            a: [
              ['Ik duik weer in mijn projecten, vol ideeën', 'De reis heeft je batterij opgeladen!'],
              ['Ik neem nog een extra dag om te landen', 'Zachte landing, slim.'],
            ],
          },
        }),
      ],
    },
  ],
};
