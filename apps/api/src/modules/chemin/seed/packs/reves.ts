// Univers « Tes rêves » : envies pour plus tard, projets fous, « si tu pouvais… ».
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'reves',
  icon: '🌠',
  title: {
    fr: ['Tes rêves', 'Envies, projets fous et « si tu pouvais… ».'],
    en: ['Your dreams', 'Wishes, wild plans and “if you could…”.'],
    es: ['Tus sueños', 'Deseos, proyectos locos y «si pudieras…».'],
    pt: ['Seus sonhos', 'Vontades, projetos malucos e “se você pudesse…”.'],
    nl: ['Je dromen', 'Wensen, gekke plannen en “als je kon…”.'],
  },
  steps: [
    {
      id: 'reves_1',
      title: { fr: 'Si tu pouvais…', en: 'If you could…', es: 'Si pudieras…', pt: 'Se você pudesse…', nl: 'Als je kon…' },
      questions: [
        c('reves_pouvoir', 'ancrage', [['🏡', -50, 'cocooning'], ['🌀', 70, 'voyage'], ['🗣️', 40, 'curiosite']], {
          fr: {
            t: 'Si tu pouvais avoir un pouvoir magique…',
            o: 'Demande-lui quel pouvoir magique elle ou il choisirait.',
            a: [
              ['Faire durer les dimanches chez moi', 'Dimanche éternel, signé !'],
              ['Me téléporter n’importe où', 'Pouf ! On est où, là ?'],
              ['Parler toutes les langues du monde', 'Bonjour, hello, hola, olá, hallo !'],
            ],
          },
          en: {
            t: 'If you could have one magic power…',
            o: 'Ask them which magic power they’d choose.',
            a: [
              ['Make Sundays at home last forever', 'Endless Sunday, signed!'],
              ['Teleport anywhere', 'Poof! Where are we now?'],
              ['Speak every language in the world', 'Bonjour, hello, hola, olá, hallo!'],
            ],
          },
          es: {
            t: 'Si pudieras tener un poder mágico…',
            o: 'Pregúntale qué poder mágico elegiría.',
            a: [
              ['Alargar los domingos en casa', '¡Domingo eterno, firmado!'],
              ['Teletransportarme a cualquier sitio', '¡Puf! ¿Dónde estamos?'],
              ['Hablar todos los idiomas del mundo', '¡Bonjour, hello, hola, olá, hallo!'],
            ],
          },
          pt: {
            t: 'Se você pudesse ter um poder mágico…',
            o: 'Pergunte qual poder mágico essa pessoa escolheria.',
            a: [
              ['Fazer os domingos em casa durarem para sempre', 'Domingo eterno, assinado!'],
              ['Me teletransportar para qualquer lugar', 'Puf! Onde a gente está?'],
              ['Falar todas as línguas do mundo', 'Bonjour, hello, hola, olá, hallo!'],
            ],
          },
          nl: {
            t: 'Als je één magische kracht kon hebben…',
            o: 'Vraag welke magische kracht die persoon zou kiezen.',
            a: [
              ['Zondagen thuis eindeloos laten duren', 'Eeuwige zondag, getekend!'],
              ['Me overal naartoe teleporteren', 'Poef! Waar zijn we nu?'],
              ['Alle talen van de wereld spreken', 'Bonjour, hello, hola, olá, hallo!'],
            ],
          },
        }),
        c('reves_pouvoir_usage', 'foyer', [['🦅', -60, 'liberte'], ['🎁', 70, 'accueil']], {
          fr: {
            t: 'Avec un pouvoir magique, tu…',
            o: 'Demande-lui ce qu’elle ou il ferait en premier avec un pouvoir magique.',
            a: [
              ['Partirais vivre tes propres aventures', 'Libre comme le vent !'],
              ['Ferais plaisir à tous tes proches', 'Une pluie de bonheur pour tout le monde.'],
            ],
          },
          en: {
            t: 'With a magic power, you’d…',
            o: 'Ask them what they’d do first with a magic power.',
            a: [
              ['Go off on your own adventures', 'Free as the wind!'],
              ['Make all your loved ones happy', 'A shower of joy for everyone.'],
            ],
          },
          es: {
            t: 'Con un poder mágico, tú…',
            o: 'Pregúntale qué haría primero con un poder mágico.',
            a: [
              ['Te irías a vivir tus propias aventuras', '¡Libre como el viento!'],
              ['Harías felices a todos tus seres queridos', 'Una lluvia de alegría para todos.'],
            ],
          },
          pt: {
            t: 'Com um poder mágico, você…',
            o: 'Pergunte o que essa pessoa faria primeiro com um poder mágico.',
            a: [
              ['Sairia para viver suas próprias aventuras', 'Livre como o vento!'],
              ['Faria todas as pessoas queridas felizes', 'Uma chuva de alegria para todo mundo.'],
            ],
          },
          nl: {
            t: 'Met een magische kracht zou je…',
            o: 'Vraag wat die persoon als eerste zou doen met een magische kracht.',
            a: [
              ['Op je eigen avonturen vertrekken', 'Vrij als de wind!'],
              ['Al je dierbaren blij maken', 'Een regen van geluk voor iedereen.'],
            ],
          },
        }),
        s('reves_baguette', 'cap', ['📝', 100, 'plan'], ['✨', -100, 'spontane'], {
          fr: { t: 'Une baguette magique pour une journée. Tu…', o: 'Demande-lui le premier vœu qu’elle ou il ferait.', a: [['As déjà la liste de tes vœux', 'Vœu n°1, vœu n°2… quelle liste !'], ['Improvises au fil des envies', 'Abracadabra… on verra bien !']], m: 'Deux ou trois idées en tête.' },
          en: { t: 'A magic wand for one day. You…', o: 'Ask them what their first wish would be.', a: [['Already have your wish list', 'Wish no. 1, wish no. 2… what a list!'], ['Make it up as you go', 'Abracadabra… we’ll see!']], m: 'Two or three ideas in mind.' },
          es: { t: 'Una varita mágica durante un día. Tú…', o: 'Pregúntale cuál sería su primer deseo.', a: [['Ya tienes la lista de deseos', 'Deseo n.º 1, deseo n.º 2… ¡vaya lista!'], ['Improvisas según te apetezca', 'Abracadabra… ¡ya veremos!']], m: 'Dos o tres ideas en mente.' },
          pt: { t: 'Uma varinha mágica por um dia. Você…', o: 'Pergunte qual seria o primeiro desejo dessa pessoa.', a: [['Já tem a lista de desejos', 'Desejo nº 1, desejo nº 2… que lista!'], ['Improvisa conforme a vontade', 'Abracadabra… vamos ver!']], m: 'Duas ou três ideias na cabeça.' },
          nl: { t: 'Een toverstaf voor één dag. Je…', o: 'Vraag wat de eerste wens van die persoon zou zijn.', a: [['Hebt je wensenlijst al klaar', 'Wens nr. 1, wens nr. 2… wat een lijst!'], ['Improviseert naar zin', 'Abracadabra… we zien wel!']], m: 'Twee of drie ideeën in mijn hoofd.' },
        }),
        c('reves_animal', 'rythme', [['🐈', -60, 'cocooning'], ['🦅', -20, 'nature'], ['🐬', 70, 'monde']], {
          fr: {
            t: 'Si tu pouvais te transformer en animal ?',
            o: 'Demande-lui en quel animal elle ou il aimerait se transformer.',
            a: [
              ['Un chat roulé en boule près du radiateur', 'Ronron, je te rejoins.'],
              ['Un aigle qui plane au-dessus des montagnes', 'Quelle vue de là-haut !'],
              ['Un dauphin qui joue en bande', 'Splash ! On fait la course ?'],
            ],
          },
          en: {
            t: 'If you could turn into an animal?',
            o: 'Ask them which animal they’d like to turn into.',
            a: [
              ['A cat curled up by the radiator', 'Purr, I’m joining you.'],
              ['An eagle gliding over mountains', 'What a view from up there!'],
              ['A dolphin playing in a pod', 'Splash! Race you?'],
            ],
          },
          es: {
            t: '¿Si pudieras convertirte en un animal?',
            o: 'Pregúntale en qué animal le gustaría convertirse.',
            a: [
              ['Un gato hecho una bola junto al radiador', 'Ronroneo, voy contigo.'],
              ['Un águila planeando sobre las montañas', '¡Qué vistas desde ahí arriba!'],
              ['Un delfín jugando en grupo', '¡Plaf! ¿Echamos una carrera?'],
            ],
          },
          pt: {
            t: 'Se você pudesse virar um animal?',
            o: 'Pergunte em que animal essa pessoa gostaria de se transformar.',
            a: [
              ['Um gato enrolado perto do aquecedor', 'Ronrom, vou junto.'],
              ['Uma águia planando sobre as montanhas', 'Que vista lá de cima!'],
              ['Um golfinho brincando em bando', 'Splash! Apostamos corrida?'],
            ],
          },
          nl: {
            t: 'Als je in een dier kon veranderen?',
            o: 'Vraag in welk dier die persoon zou willen veranderen.',
            a: [
              ['Een kat opgerold bij de verwarming', 'Spin spin, ik kom erbij.'],
              ['Een arend die boven de bergen zweeft', 'Wat een uitzicht daarboven!'],
              ['Een dolfijn die speelt in een groep', 'Plons! Wie het eerst is?'],
            ],
          },
        }),
        c('reves_talent', 'elan', [['🎻', 60, 'projets'], ['🍳', 10, 'cuisine'], ['😌', -60, 'temps_libre']], {
          fr: {
            t: 'Un talent qu’on t’offrirait d’un coup ?',
            o: 'Demande-lui quel talent elle ou il aimerait avoir du jour au lendemain.',
            a: [
              ['Jouer d’un instrument comme un pro', 'Un concert privé, s’il te plaît !'],
              ['Cuisiner comme un grand chef', 'Je goûte tout, c’est promis.'],
              ['L’art de me la couler douce', 'Le plus beau des talents.'],
            ],
          },
          en: {
            t: 'A talent you’d be given instantly?',
            o: 'Ask them which talent they’d love to have overnight.',
            a: [
              ['Playing an instrument like a pro', 'A private concert, please!'],
              ['Cooking like a top chef', 'I’ll taste everything, promise.'],
              ['The art of taking it easy', 'The finest talent of all.'],
            ],
          },
          es: {
            t: '¿Un talento que te regalaran de golpe?',
            o: 'Pregúntale qué talento le gustaría tener de la noche a la mañana.',
            a: [
              ['Tocar un instrumento como un profesional', '¡Un concierto privado, porfa!'],
              ['Cocinar como un gran chef', 'Lo pruebo todo, prometido.'],
              ['El arte de tomármelo con calma', 'El mejor de los talentos.'],
            ],
          },
          pt: {
            t: 'Um talento que você ganharia de repente?',
            o: 'Pergunte qual talento essa pessoa gostaria de ter da noite para o dia.',
            a: [
              ['Tocar um instrumento como profissional', 'Um show particular, por favor!'],
              ['Cozinhar como um grande chef', 'Eu provo tudo, prometo.'],
              ['A arte de levar a vida numa boa', 'O mais bonito dos talentos.'],
            ],
          },
          nl: {
            t: 'Een talent dat je in één keer zou krijgen?',
            o: 'Vraag welk talent die persoon van de ene op de andere dag zou willen hebben.',
            a: [
              ['Een instrument bespelen als een prof', 'Een privéconcert, graag!'],
              ['Koken als een topkok', 'Ik proef alles, beloofd.'],
              ['De kunst van het lanterfanten', 'Het mooiste talent van allemaal.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_2',
      title: { fr: 'Ton coin rêvé', en: 'Your dream place', es: 'Tu rincón soñado', pt: 'Seu cantinho dos sonhos', nl: 'Je droomplek' },
      questions: [
        s('reves_ou_vivre', 'ancrage', ['🏘️', -100, 'racines'], ['🌏', 100, 'voyage'], {
          fr: { t: 'Plus tard, tu te vois vivre…', o: 'Demande-lui où elle ou il rêverait de vivre.', a: [['Près de là où j’ai grandi', 'On ne quitte jamais vraiment son nid.'], ['À l’autre bout du monde', 'Je prépare ma valise aussi !']], m: 'Dans une autre ville, pas trop loin.' },
          en: { t: 'Later on, you picture yourself living…', o: 'Ask them where they dream of living.', a: [['Near where I grew up', 'Home is where the heart is.'], ['On the other side of the world', 'I’m packing my case too!']], m: 'In another town, not too far.' },
          es: { t: 'Más adelante, te ves viviendo…', o: 'Pregúntale dónde soñaría vivir.', a: [['Cerca de donde crecí', 'El nido siempre tira.'], ['En la otra punta del mundo', '¡Yo también hago la maleta!']], m: 'En otra ciudad, no muy lejos.' },
          pt: { t: 'No futuro, você se vê morando…', o: 'Pergunte onde essa pessoa sonha em morar.', a: [['Perto de onde cresci', 'A gente nunca sai de verdade do ninho.'], ['Do outro lado do mundo', 'Também vou fazer minha mala!']], m: 'Em outra cidade, não muito longe.' },
          nl: { t: 'Later zie je jezelf wonen…', o: 'Vraag waar die persoon zou dromen te wonen.', a: [['Dicht bij waar ik opgroeide', 'Oost west, thuis best.'], ['Aan de andere kant van de wereld', 'Ik pak mijn koffer ook!']], m: 'In een andere stad, niet te ver.' },
        }),
        c('reves_decor', 'rythme', [['🏖️', 0, null], ['🏙️', 70, 'ville'], ['🏔️', -60, 'nature']], {
          fr: {
            t: 'Ton décor de rêve ?',
            o: 'Demande-lui quel décor la ou le fait rêver.',
            a: [
              ['Un village au bord de la mer', 'Le bruit des vagues, quel bonheur.'],
              ['Une grande ville qui ne dort jamais', 'Les lumières, le bruit, j’adore !'],
              ['Un chalet perdu en montagne', 'Chut, on entend la neige tomber.'],
            ],
          },
          en: {
            t: 'Your dream setting?',
            o: 'Ask them which setting makes them dream.',
            a: [
              ['A seaside village', 'The sound of waves, bliss.'],
              ['A big city that never sleeps', 'The lights, the buzz, love it!'],
              ['A chalet tucked away in the mountains', 'Shh, you can hear the snow fall.'],
            ],
          },
          es: {
            t: '¿Tu escenario soñado?',
            o: 'Pregúntale qué escenario le hace soñar.',
            a: [
              ['Un pueblo junto al mar', 'El ruido de las olas, qué gusto.'],
              ['Una gran ciudad que nunca duerme', '¡Las luces, el bullicio, me encanta!'],
              ['Una cabaña perdida en la montaña', 'Chis, se oye caer la nieve.'],
            ],
          },
          pt: {
            t: 'Seu cenário dos sonhos?',
            o: 'Pergunte qual cenário faz essa pessoa sonhar.',
            a: [
              ['Uma vila à beira-mar', 'O barulho das ondas, que delícia.'],
              ['Uma cidade grande que nunca dorme', 'As luzes, o agito, adoro!'],
              ['Um chalé escondido na montanha', 'Psiu, dá para ouvir a neve caindo.'],
            ],
          },
          nl: {
            t: 'Je droomdecor?',
            o: 'Vraag van welk decor die persoon droomt.',
            a: [
              ['Een dorpje aan zee', 'Het geluid van de golven, heerlijk.'],
              ['Een grote stad die nooit slaapt', 'De lichtjes, de drukte, top!'],
              ['Een chalet verscholen in de bergen', 'Sst, je hoort de sneeuw vallen.'],
            ],
          },
        }),
        c('reves_habiter_avec', 'foyer', [['🗝️', -60, 'liberte'], ['🐕', -10, null], ['🏡', 70, 'accueil']], {
          fr: {
            t: 'Ton chez-toi rêvé, tu le partages…',
            o: 'Demande-lui à quoi ressemblerait son chez-soi idéal.',
            a: [
              ['Avec personne, rien qu’à moi', 'Ton royaume, tes règles.'],
              ['Avec un chien, et c’est tout', 'Ouaf ! Il a l’air d’accord.'],
              ['Avec des amis, une maison toujours pleine', 'Je mets combien d’assiettes ?'],
            ],
          },
          en: {
            t: 'Your dream home, you share it…',
            o: 'Ask them what their ideal home would look like.',
            a: [
              ['With nobody, all mine', 'Your kingdom, your rules.'],
              ['With a dog, and that’s it', 'Woof! Sounds like a yes.'],
              ['With friends, a house that’s always full', 'How many plates shall I lay?'],
            ],
          },
          es: {
            t: 'Tu casa soñada, la compartes…',
            o: 'Pregúntale cómo sería su casa ideal.',
            a: [
              ['Con nadie, solo para mí', 'Tu reino, tus reglas.'],
              ['Con un perro, y ya está', '¡Guau! Parece que está de acuerdo.'],
              ['Con amigos, una casa siempre llena', '¿Cuántos platos pongo?'],
            ],
          },
          pt: {
            t: 'Sua casa dos sonhos, você divide…',
            o: 'Pergunte como seria a casa ideal dessa pessoa.',
            a: [
              ['Com ninguém, só minha', 'Seu reino, suas regras.'],
              ['Com um cachorro, e só', 'Au au! Parece que ele concorda.'],
              ['Com amigos, uma casa sempre cheia', 'Quantos pratos eu ponho?'],
            ],
          },
          nl: {
            t: 'Je droomhuis deel je…',
            o: 'Vraag hoe het ideale thuis van die persoon eruit zou zien.',
            a: [
              ['Met niemand, helemaal van mij', 'Jouw koninkrijk, jouw regels.'],
              ['Met een hond, en dat is het', 'Woef! Hij lijkt het eens.'],
              ['Met vrienden, een huis dat altijd vol is', 'Hoeveel borden zet ik neer?'],
            ],
          },
        }),
        c('reves_demenager', 'cap', [['🎒', -70, 'spontane'], ['📋', 70, 'plan']], {
          fr: {
            t: 'Partir vivre ailleurs, tu le ferais…',
            o: 'Demande-lui si elle ou il a déjà rêvé de tout plaquer pour partir.',
            a: [
              ['Sur un coup de tête', 'Hop, les cartons sont dans la voiture !'],
              ['Après des mois de préparation', 'Plan A, plan B, plan C : prêts.'],
            ],
          },
          en: {
            t: 'Moving somewhere new, you’d do it…',
            o: 'Ask them whether they’ve ever dreamt of dropping everything to move.',
            a: [
              ['On a whim', 'Boxes in the car, off we go!'],
              ['After months of preparation', 'Plan A, B and C: ready.'],
            ],
          },
          es: {
            t: 'Irte a vivir a otro sitio, lo harías…',
            o: 'Pregúntale si alguna vez ha soñado con dejarlo todo y mudarse.',
            a: [
              ['Por un impulso', '¡Hala, las cajas ya están en el coche!'],
              ['Tras meses de preparación', 'Plan A, plan B, plan C: listos.'],
            ],
          },
          pt: {
            t: 'Ir morar em outro lugar, você faria…',
            o: 'Pergunte se essa pessoa já sonhou em largar tudo e se mudar.',
            a: [
              ['Num impulso', 'Pronto, as caixas já estão no carro!'],
              ['Depois de meses de preparação', 'Plano A, plano B, plano C: prontos.'],
            ],
          },
          nl: {
            t: 'Ergens anders gaan wonen zou je doen…',
            o: 'Vraag of die persoon ooit droomde van alles achterlaten en verhuizen.',
            a: [
              ['In een opwelling', 'Hup, de dozen zitten in de auto!'],
              ['Na maanden voorbereiding', 'Plan A, B en C: klaar.'],
            ],
          },
        }),
        c('reves_quartier_vie', 'elan', [['🌿', -60, 'temps_libre'], ['🚀', 60, 'projets']], {
          fr: {
            t: 'Dans ton quartier de rêve, tu…',
            o: 'Demande-lui ce qu’elle ou il aimerait trouver dans son quartier idéal.',
            a: [
              ['Profites tranquillement de la vie', 'Un banc, du soleil, parfait.'],
              ['Lances plein d’initiatives', 'Présidence du comité des fêtes en vue !'],
            ],
          },
          en: {
            t: 'In your dream neighbourhood, you…',
            o: 'Ask them what they’d love to find in their ideal neighbourhood.',
            a: [
              ['Enjoy life at a gentle pace', 'A bench, some sun, perfect.'],
              ['Start loads of initiatives', 'Head of the events committee, here you come!'],
            ],
          },
          es: {
            t: 'En tu barrio soñado, tú…',
            o: 'Pregúntale qué le gustaría encontrar en su barrio ideal.',
            a: [
              ['Disfrutas de la vida con calma', 'Un banco, sol, perfecto.'],
              ['Lanzas un montón de iniciativas', '¡Presidencia de la comisión de fiestas a la vista!'],
            ],
          },
          pt: {
            t: 'No seu bairro dos sonhos, você…',
            o: 'Pergunte o que essa pessoa gostaria de encontrar no bairro ideal.',
            a: [
              ['Aproveita a vida com calma', 'Um banco, um solzinho, perfeito.'],
              ['Lança um monte de iniciativas', 'Presidência da comissão de festas à vista!'],
            ],
          },
          nl: {
            t: 'In je droombuurt…',
            o: 'Vraag wat die persoon graag in de ideale buurt zou vinden.',
            a: [
              ['Geniet je rustig van het leven', 'Een bankje, zon, perfect.'],
              ['Start je allerlei initiatieven', 'Voorzitter van de feestcommissie in zicht!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_3',
      title: { fr: 'Apprendre', en: 'Learning', es: 'Aprender', pt: 'Aprender', nl: 'Leren' },
      questions: [
        c('reves_apprendre', 'ancrage', [['🧶', -50, 'racines'], ['🎸', 10, 'musique'], ['🗾', 70, 'curiosite']], {
          fr: {
            t: 'Si tu pouvais apprendre n’importe quoi…',
            o: 'Demande-lui ce qu’elle ou il rêverait d’apprendre.',
            a: [
              ['Un savoir-faire traditionnel d’ici', 'Les secrets des anciens, quel trésor.'],
              ['Un instrument de musique', 'Do, ré, mi… j’applaudis déjà.'],
              ['Une langue de l’autre bout du monde', 'Konnichiwa ! J’ai bon ?'],
            ],
          },
          en: {
            t: 'If you could learn anything at all…',
            o: 'Ask them what they dream of learning.',
            a: [
              ['A traditional local craft', 'The old secrets, what a treasure.'],
              ['A musical instrument', 'Do, re, mi… I’m clapping already.'],
              ['A language from the other side of the world', 'Konnichiwa! Did I get it right?'],
            ],
          },
          es: {
            t: 'Si pudieras aprender cualquier cosa…',
            o: 'Pregúntale qué soñaría con aprender.',
            a: [
              ['Un oficio tradicional de aquí', 'Los secretos de antes, qué tesoro.'],
              ['Un instrumento musical', 'Do, re, mi… ya estoy aplaudiendo.'],
              ['Un idioma de la otra punta del mundo', '¡Konnichiwa! ¿Lo he dicho bien?'],
            ],
          },
          pt: {
            t: 'Se você pudesse aprender qualquer coisa…',
            o: 'Pergunte o que essa pessoa sonha em aprender.',
            a: [
              ['Um saber tradicional daqui', 'Os segredos de antigamente, que tesouro.'],
              ['Um instrumento musical', 'Dó, ré, mi… já estou aplaudindo.'],
              ['Uma língua do outro lado do mundo', 'Konnichiwa! Acertei?'],
            ],
          },
          nl: {
            t: 'Als je alles kon leren…',
            o: 'Vraag wat die persoon zou willen leren.',
            a: [
              ['Een traditioneel ambacht van hier', 'De geheimen van vroeger, wat een schat.'],
              ['Een muziekinstrument', 'Do, re, mi… ik applaudisseer al.'],
              ['Een taal van de andere kant van de wereld', 'Konnichiwa! Klopt dat?'],
            ],
          },
        }),
        s('reves_niveau', 'elan', ['🎈', -100, 'temps_libre'], ['🏆', 100, 'projets'], {
          fr: { t: 'Quand tu apprends un truc nouveau, ton but…', o: 'Demande-lui ce qu’elle ou il apprend en ce moment.', a: [['Juste m’amuser', 'Le plaisir avant tout !'], ['Atteindre un vrai niveau', 'Objectif : maîtrise totale.']], m: 'Progresser, sans pression.' },
          en: { t: 'When you learn something new, your goal is…', o: 'Ask them what they’re learning at the moment.', a: [['Just to have fun', 'Fun comes first!'], ['To reach a real level', 'Target: total mastery.']], m: 'To improve, no pressure.' },
          es: { t: 'Cuando aprendes algo nuevo, tu objetivo es…', o: 'Pregúntale qué está aprendiendo ahora.', a: [['Solo divertirme', '¡Lo primero, pasarlo bien!'], ['Alcanzar un nivel de verdad', 'Objetivo: dominio total.']], m: 'Mejorar, sin presión.' },
          pt: { t: 'Quando você aprende algo novo, seu objetivo é…', o: 'Pergunte o que essa pessoa está aprendendo agora.', a: [['Só me divertir', 'Diversão em primeiro lugar!'], ['Chegar a um nível de verdade', 'Meta: domínio total.']], m: 'Evoluir, sem pressão.' },
          nl: { t: 'Als je iets nieuws leert, is je doel…', o: 'Vraag wat die persoon op dit moment aan het leren is.', a: [['Gewoon plezier hebben', 'Plezier voorop!'], ['Een echt niveau halen', 'Doel: volledige beheersing.']], m: 'Vooruitgaan, zonder druk.' },
        }),
        c('reves_methode', 'cap', [['🧪', -60, 'spontane'], ['📚', 70, 'plan']], {
          fr: {
            t: 'Pour apprendre, tu…',
            o: 'Demande-lui comment elle ou il aime apprendre.',
            a: [
              ['Testes par essais et erreurs', 'Boum ! Bon, on réessaie.'],
              ['Suis un programme bien structuré', 'Leçon 1, leçon 2… impeccable.'],
            ],
          },
          en: {
            t: 'To learn, you…',
            o: 'Ask them how they like to learn.',
            a: [
              ['Go by trial and error', 'Boom! Right, let’s try again.'],
              ['Follow a well-structured plan', 'Lesson 1, lesson 2… spotless.'],
            ],
          },
          es: {
            t: 'Para aprender, tú…',
            o: 'Pregúntale cómo le gusta aprender.',
            a: [
              ['Pruebas a base de ensayo y error', '¡Bum! Vale, otra vez.'],
              ['Sigues un programa bien estructurado', 'Lección 1, lección 2… impecable.'],
            ],
          },
          pt: {
            t: 'Para aprender, você…',
            o: 'Pergunte como essa pessoa gosta de aprender.',
            a: [
              ['Vai na tentativa e erro', 'Bum! Tá, vamos de novo.'],
              ['Segue um programa bem estruturado', 'Lição 1, lição 2… impecável.'],
            ],
          },
          nl: {
            t: 'Om te leren…',
            o: 'Vraag hoe die persoon het liefst leert.',
            a: [
              ['Probeer je met vallen en opstaan', 'Boem! Oké, nog een keer.'],
              ['Volg je een goed gestructureerd programma', 'Les 1, les 2… keurig.'],
            ],
          },
        }),
        c('reves_cours', 'rythme', [['👥', 60, 'monde'], ['💻', -50, 'cocooning']], {
          fr: {
            t: 'Ton cours idéal ?',
            o: 'Demande-lui quel cours elle ou il aimerait suivre.',
            a: [
              ['En groupe, avec plein de gens', 'Nouvelle bande, nouvelles idées !'],
              ['Depuis mon canapé, à mon rythme', 'Plaid et cahier, l’école idéale.'],
            ],
          },
          en: {
            t: 'Your ideal class?',
            o: 'Ask them which class they’d love to take.',
            a: [
              ['In a group, with loads of people', 'New gang, new ideas!'],
              ['From my sofa, at my own pace', 'Blanket and notebook, the ideal school.'],
            ],
          },
          es: {
            t: '¿Tu clase ideal?',
            o: 'Pregúntale qué clase le gustaría hacer.',
            a: [
              ['En grupo, con mucha gente', '¡Nueva pandilla, nuevas ideas!'],
              ['Desde mi sofá, a mi ritmo', 'Manta y cuaderno, la escuela ideal.'],
            ],
          },
          pt: {
            t: 'Sua aula ideal?',
            o: 'Pergunte qual curso essa pessoa gostaria de fazer.',
            a: [
              ['Em grupo, com muita gente', 'Turma nova, ideias novas!'],
              ['Do meu sofá, no meu ritmo', 'Manta e caderno, a escola ideal.'],
            ],
          },
          nl: {
            t: 'Je ideale les?',
            o: 'Vraag welke cursus die persoon graag zou volgen.',
            a: [
              ['In een groep, met veel mensen', 'Nieuwe club, nieuwe ideeën!'],
              ['Vanaf mijn bank, in mijn eigen tempo', 'Dekentje en schrift, de ideale school.'],
            ],
          },
        }),
        c('reves_transmettre', 'foyer', [['🦉', -50, 'liberte'], ['🧑‍🏫', 70, 'accueil']], {
          fr: {
            t: 'Partager ce que tu sais, plus tard…',
            o: 'Demande-lui ce qu’elle ou il aimerait apprendre aux autres.',
            a: [
              ['Je garde mes passions pour moi', 'Ton jardin secret, bien gardé.'],
              ['Je rêve d’animer un atelier pour le quartier', 'Je m’inscris tout de suite !'],
            ],
          },
          en: {
            t: 'Sharing what you know, later on…',
            o: 'Ask them what they’d love to teach others.',
            a: [
              ['I keep my passions to myself', 'Your secret garden, well kept.'],
              ['I dream of running a neighbourhood workshop', 'I’m signing up first!'],
            ],
          },
          es: {
            t: 'Compartir lo que sabes, más adelante…',
            o: 'Pregúntale qué le gustaría enseñar a los demás.',
            a: [
              ['Me guardo mis pasiones para mí', 'Tu jardín secreto, bien guardado.'],
              ['Sueño con dar un taller en el barrio', '¡Me apunto el primero!'],
            ],
          },
          pt: {
            t: 'Compartilhar o que você sabe, no futuro…',
            o: 'Pergunte o que essa pessoa gostaria de ensinar aos outros.',
            a: [
              ['Guardo minhas paixões para mim', 'Seu jardim secreto, bem guardado.'],
              ['Sonho em dar uma oficina no bairro', 'Eu me inscrevo primeiro!'],
            ],
          },
          nl: {
            t: 'Later delen wat je weet…',
            o: 'Vraag wat die persoon anderen graag zou leren.',
            a: [
              ['Ik houd mijn passies voor mezelf', 'Je geheime tuin, goed bewaard.'],
              ['Ik droom van een workshop in de buurt', 'Ik schrijf me als eerste in!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_4',
      title: { fr: 'Le grand voyage', en: 'The big trip', es: 'El gran viaje', pt: 'A grande viagem', nl: 'De grote reis' },
      questions: [
        c('reves_voyage_dest', 'ancrage', [['🚂', 30, 'voyage'], ['🏞️', -40, 'racines'], ['🛶', 80, 'aventure']], {
          fr: {
            t: 'Le voyage de tes rêves ?',
            o: 'Demande-lui quel est le voyage de ses rêves.',
            a: [
              ['Un long voyage en train de nuit', 'Tchou tchou, réveil dans un autre pays !'],
              ['Le tour de ma propre région', 'Il y a tant à voir juste à côté.'],
              ['Une expédition au bout du monde', 'Boussole, carte, frissons !'],
            ],
          },
          en: {
            t: 'Your dream trip?',
            o: 'Ask them what their dream trip is.',
            a: [
              ['A long night-train journey', 'Choo choo, wake up in another country!'],
              ['A tour of my own region', 'So much to see right next door.'],
              ['An expedition to the ends of the earth', 'Compass, map, thrills!'],
            ],
          },
          es: {
            t: '¿El viaje de tus sueños?',
            o: 'Pregúntale cuál es el viaje de sus sueños.',
            a: [
              ['Un largo viaje en tren nocturno', '¡Chu chu, despertar en otro país!'],
              ['Recorrer mi propia región', 'Hay tanto que ver al lado de casa.'],
              ['Una expedición al fin del mundo', '¡Brújula, mapa, emoción!'],
            ],
          },
          pt: {
            t: 'A viagem dos seus sonhos?',
            o: 'Pergunte qual é a viagem dos sonhos dessa pessoa.',
            a: [
              ['Uma longa viagem de trem noturno', 'Piuí, acordar em outro país!'],
              ['Rodar a minha própria região', 'Tem tanta coisa para ver aqui do lado.'],
              ['Uma expedição ao fim do mundo', 'Bússola, mapa, frio na barriga!'],
            ],
          },
          nl: {
            t: 'Je droomreis?',
            o: 'Vraag wat de droomreis van die persoon is.',
            a: [
              ['Een lange reis met de nachttrein', 'Tsjoek tsjoek, wakker worden in een ander land!'],
              ['Een rondreis door mijn eigen streek', 'Zoveel te zien vlakbij.'],
              ['Een expeditie naar het einde van de wereld', 'Kompas, kaart, kriebels!'],
            ],
          },
        }),
        s('reves_voyage_itineraire', 'cap', ['🎲', -100, 'spontane'], ['🗺️', 100, 'plan'], {
          fr: { t: 'Ton grand voyage, il serait…', o: 'Demande-lui comment elle ou il organiserait un grand voyage.', a: [['Sans itinéraire, au jour le jour', 'À gauche ou à droite ? Pile ou face !'], ['Planifié étape par étape', 'Jour 12 : 14 h, musée. Parfait.']], m: 'Les grandes lignes, le reste au feeling.' },
          en: { t: 'Your big trip would be…', o: 'Ask them how they’d organise a big trip.', a: [['No itinerary, day by day', 'Left or right? Heads or tails!'], ['Planned stage by stage', 'Day 12: 2 pm, museum. Perfect.']], m: 'The broad strokes, the rest by feel.' },
          es: { t: 'Tu gran viaje sería…', o: 'Pregúntale cómo organizaría un gran viaje.', a: [['Sin itinerario, día a día', '¿Izquierda o derecha? ¡Cara o cruz!'], ['Planificado etapa a etapa', 'Día 12: 14 h, museo. Perfecto.']], m: 'Las líneas generales, lo demás sobre la marcha.' },
          pt: { t: 'Sua grande viagem seria…', o: 'Pergunte como essa pessoa organizaria uma grande viagem.', a: [['Sem roteiro, um dia de cada vez', 'Esquerda ou direita? Cara ou coroa!'], ['Planejada etapa por etapa', 'Dia 12: 14h, museu. Perfeito.']], m: 'O básico, o resto no improviso.' },
          nl: { t: 'Je grote reis zou zijn…', o: 'Vraag hoe die persoon een grote reis zou organiseren.', a: [['Zonder route, van dag tot dag', 'Links of rechts? Kop of munt!'], ['Stap voor stap gepland', 'Dag 12: 14 uur, museum. Perfect.']], m: 'De grote lijnen, de rest op gevoel.' },
        }),
        c('reves_voyage_qui', 'foyer', [['🚐', 70, 'famille'], ['🎒', -60, 'liberte']], {
          fr: {
            t: 'Pour ce grand voyage, tu partirais…',
            o: 'Demande-lui avec qui elle ou il partirait pour un grand voyage.',
            a: [
              ['En bande, dans un van plein à craquer', 'Je réserve la place à côté de la fenêtre !'],
              ['En solo, libre comme l’air', 'Toi, ton sac et le monde entier.'],
            ],
          },
          en: {
            t: 'For this big trip, you’d go…',
            o: 'Ask them who they’d take on a big trip.',
            a: [
              ['As a gang, in a packed van', 'Bagsy the window seat!'],
              ['Solo, free as a bird', 'You, your rucksack and the whole world.'],
            ],
          },
          es: {
            t: 'Para ese gran viaje, te irías…',
            o: 'Pregúntale con quién se iría de gran viaje.',
            a: [
              ['En grupo, en una furgo a reventar', '¡Me pido la ventanilla!'],
              ['En solitario, libre como el viento', 'Tú, tu mochila y el mundo entero.'],
            ],
          },
          pt: {
            t: 'Para essa grande viagem, você iria…',
            o: 'Pergunte com quem essa pessoa faria uma grande viagem.',
            a: [
              ['Em turma, numa van lotada', 'Eu fico com a janela!'],
              ['Solo, livre como um passarinho', 'Você, sua mochila e o mundo inteiro.'],
            ],
          },
          nl: {
            t: 'Voor die grote reis zou je gaan…',
            o: 'Vraag met wie die persoon op grote reis zou gaan.',
            a: [
              ['Met een groep, in een propvol busje', 'Ik claim de plek bij het raam!'],
              ['Solo, vrij als een vogel', 'Jij, je rugzak en de hele wereld.'],
            ],
          },
        }),
        c('reves_voyage_journees', 'rythme', [['🥾', 10, 'nature'], ['🏝️', -60, 'calme'], ['🎉', 70, 'fete']], {
          fr: {
            t: 'En voyage, tes journées idéales…',
            o: 'Demande-lui à quoi ressemble une journée parfaite en voyage.',
            a: [
              ['Randonnée et paysages à couper le souffle', 'Encore un sommet, encore une photo !'],
              ['Un hamac, un livre et la mer', 'Je me balance avec toi.'],
              ['Festivals et marchés de nuit', 'Les lampions, la musique, en avant !'],
            ],
          },
          en: {
            t: 'On a trip, your ideal days are…',
            o: 'Ask them what a perfect day on a trip looks like.',
            a: [
              ['Hiking and breathtaking views', 'Another summit, another photo!'],
              ['A hammock, a book and the sea', 'I’ll swing along with you.'],
              ['Festivals and night markets', 'Lanterns, music, let’s go!'],
            ],
          },
          es: {
            t: 'De viaje, tus días ideales son…',
            o: 'Pregúntale cómo es un día perfecto de viaje.',
            a: [
              ['Rutas y paisajes de quitar el aliento', '¡Otra cima, otra foto!'],
              ['Una hamaca, un libro y el mar', 'Me balanceo contigo.'],
              ['Festivales y mercados nocturnos', '¡Farolillos, música, vamos!'],
            ],
          },
          pt: {
            t: 'Em viagem, seus dias ideais são…',
            o: 'Pergunte como é um dia perfeito de viagem para essa pessoa.',
            a: [
              ['Trilhas e paisagens de tirar o fôlego', 'Mais um cume, mais uma foto!'],
              ['Uma rede, um livro e o mar', 'Eu balanço junto com você.'],
              ['Festivais e feiras noturnas', 'Lanternas, música, bora!'],
            ],
          },
          nl: {
            t: 'Op reis zijn je ideale dagen…',
            o: 'Vraag hoe een perfecte reisdag eruitziet voor die persoon.',
            a: [
              ['Wandelen en adembenemende uitzichten', 'Nog een top, nog een foto!'],
              ['Een hangmat, een boek en de zee', 'Ik schommel met je mee.'],
              ['Festivals en avondmarkten', 'Lampionnen, muziek, kom op!'],
            ],
          },
        }),
        c('reves_voyage_defi', 'elan', [['🛋️', -60, 'temps_libre'], ['🚴', 70, 'sport']], {
          fr: {
            t: 'Un voyage-défi, comme traverser un pays à vélo ?',
            o: 'Demande-lui quel voyage-défi elle ou il aimerait tenter.',
            a: [
              ['Non, en voyage je veux souffler', 'Vacances = repos, c’est la loi.'],
              ['Oui, c’est même mon rêve', 'Je pédale derrière toi !'],
            ],
          },
          en: {
            t: 'A challenge trip, like crossing a country by bike?',
            o: 'Ask them which challenge trip they’d like to try.',
            a: [
              ['No, on holiday I want to unwind', 'Holidays = rest, it’s the law.'],
              ['Yes, it’s actually my dream', 'I’ll pedal right behind you!'],
            ],
          },
          es: {
            t: '¿Un viaje-reto, como cruzar un país en bici?',
            o: 'Pregúntale qué viaje-reto le gustaría intentar.',
            a: [
              ['No, de viaje quiero descansar', 'Vacaciones = descanso, es la ley.'],
              ['Sí, de hecho es mi sueño', '¡Pedaleo detrás de ti!'],
            ],
          },
          pt: {
            t: 'Uma viagem-desafio, tipo atravessar um país de bicicleta?',
            o: 'Pergunte qual viagem-desafio essa pessoa gostaria de encarar.',
            a: [
              ['Não, viajando eu quero descansar', 'Férias = descanso, é lei.'],
              ['Sim, é até o meu sonho', 'Eu pedalo atrás de você!'],
            ],
          },
          nl: {
            t: 'Een uitdagingsreis, zoals een land doorfietsen?',
            o: 'Vraag welke uitdagingsreis die persoon zou willen proberen.',
            a: [
              ['Nee, op reis wil ik ontspannen', 'Vakantie = rust, zo is de wet.'],
              ['Ja, dat is zelfs mijn droom', 'Ik fiets achter je aan!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_5',
      title: { fr: 'Les projets fous', en: 'Wild plans', es: 'Proyectos locos', pt: 'Projetos malucos', nl: 'Gekke plannen' },
      questions: [
        c('reves_projet_fou', 'elan', [['🌳', -40, 'cocooning'], ['⛵', 70, 'aventure'], ['🎪', 30, 'fete']], {
          fr: {
            t: 'Ton projet un peu fou ?',
            o: 'Demande-lui quel est son projet le plus fou.',
            a: [
              ['Une cabane douillette dans les arbres', 'Une échelle de corde et c’est parfait.'],
              ['Le tour du monde en voilier', 'Larguez les amarres !'],
              ['Un festival dans mon quartier', 'Je tiens le stand de crêpes !'],
            ],
          },
          en: {
            t: 'Your slightly crazy plan?',
            o: 'Ask them what their wildest plan is.',
            a: [
              ['A cosy treehouse', 'A rope ladder and it’s perfect.'],
              ['Sailing round the world', 'Cast off!'],
              ['A festival in my neighbourhood', 'I’ll run the pancake stall!'],
            ],
          },
          es: {
            t: '¿Tu proyecto un poco loco?',
            o: 'Pregúntale cuál es su proyecto más loco.',
            a: [
              ['Una cabaña acogedora en los árboles', 'Una escalera de cuerda y perfecto.'],
              ['La vuelta al mundo en velero', '¡Soltad amarras!'],
              ['Un festival en mi barrio', '¡Yo llevo el puesto de crepes!'],
            ],
          },
          pt: {
            t: 'Seu projeto meio maluco?',
            o: 'Pergunte qual é o projeto mais maluco dessa pessoa.',
            a: [
              ['Uma casa na árvore aconchegante', 'Uma escada de corda e pronto.'],
              ['A volta ao mundo de veleiro', 'Soltar as amarras!'],
              ['Um festival no meu bairro', 'Eu cuido da barraca de crepe!'],
            ],
          },
          nl: {
            t: 'Je ietwat gekke plan?',
            o: 'Vraag wat het gekste plan van die persoon is.',
            a: [
              ['Een knusse boomhut', 'Een touwladder erbij en het is perfect.'],
              ['Met een zeilboot de wereld rond', 'Trossen los!'],
              ['Een festival in mijn buurt', 'Ik sta in de pannenkoekenkraam!'],
            ],
          },
        }),
        s('reves_projet_quand', 'cap', ['⚡', -100, 'spontane'], ['📆', 100, 'plan'], {
          fr: { t: 'Ton projet fou, tu le lances…', o: 'Demande-lui quand elle ou il compte se lancer.', a: [['Demain matin, sans attendre', 'Trois, deux, un… partez !'], ['Quand tout sera prêt', 'Chaque détail compte, j’adore.']], m: 'Bientôt, après un petit plan.' },
          en: { t: 'You’d launch your wild plan…', o: 'Ask them when they plan to get started.', a: [['Tomorrow morning, no waiting', 'Three, two, one… go!'], ['When everything’s ready', 'Every detail counts, love it.']], m: 'Soon, after a little plan.' },
          es: { t: 'Tu proyecto loco, lo lanzas…', o: 'Pregúntale cuándo piensa lanzarse.', a: [['Mañana por la mañana, sin esperar', 'Tres, dos, uno… ¡ya!'], ['Cuando todo esté listo', 'Cada detalle cuenta, me encanta.']], m: 'Pronto, tras un pequeño plan.' },
          pt: { t: 'Seu projeto maluco, você começa…', o: 'Pergunte quando essa pessoa pretende começar.', a: [['Amanhã de manhã, sem esperar', 'Três, dois, um… já!'], ['Quando tudo estiver pronto', 'Cada detalhe conta, adoro.']], m: 'Logo, depois de um planinho.' },
          nl: { t: 'Je gekke plan begin je…', o: 'Vraag wanneer die persoon wil beginnen.', a: [['Morgenochtend, zonder wachten', 'Drie, twee, een… go!'], ['Als alles klaar is', 'Elk detail telt, top.']], m: 'Binnenkort, na een klein plan.' },
        }),
        c('reves_projet_equipe', 'foyer', [['🦸', -60, 'liberte'], ['🤝', 70, 'famille']], {
          fr: {
            t: 'Pour ce projet, tu t’entoures…',
            o: 'Demande-lui qui elle ou il embarquerait dans son projet.',
            a: [
              ['De personne, je fonce', 'En solo, à toute vitesse !'],
              ['D’une équipe de proches', 'L’union fait la force !'],
            ],
          },
          en: {
            t: 'For this plan, you surround yourself with…',
            o: 'Ask them who they’d bring on board for their plan.',
            a: [
              ['Nobody, I just go for it', 'Solo, full speed ahead!'],
              ['A team of close friends', 'Strength in numbers!'],
            ],
          },
          es: {
            t: 'Para ese proyecto, te rodeas…',
            o: 'Pregúntale a quién se llevaría en su proyecto.',
            a: [
              ['De nadie, me lanzo', '¡En solitario, a toda velocidad!'],
              ['De un equipo de gente cercana', '¡La unión hace la fuerza!'],
            ],
          },
          pt: {
            t: 'Para esse projeto, você se cerca…',
            o: 'Pergunte quem essa pessoa chamaria para o projeto.',
            a: [
              ['De ninguém, eu vou com tudo', 'Solo, a toda velocidade!'],
              ['De uma equipe de gente próxima', 'A união faz a força!'],
            ],
          },
          nl: {
            t: 'Voor dat plan omring je je met…',
            o: 'Vraag wie die persoon bij het plan zou betrekken.',
            a: [
              ['Niemand, ik ga er gewoon voor', 'Solo, volle kracht vooruit!'],
              ['Een team van dierbaren', 'Eendracht maakt macht!'],
            ],
          },
        }),
        c('reves_projet_terrain', 'ancrage', [['🗺️', 70, 'curiosite'], ['🧱', -50, 'racines']], {
          fr: {
            t: 'Un projet fou, idéalement, c’est…',
            o: 'Demande-lui dans quel domaine elle ou il aimerait tenter un truc fou.',
            a: [
              ['Un domaine totalement nouveau pour moi', 'Terra incognita, en avant !'],
              ['Lié à ce que je connais déjà', 'Tes racines, ta force.'],
            ],
          },
          en: {
            t: 'A wild plan, ideally, is…',
            o: 'Ask them in which field they’d love to try something wild.',
            a: [
              ['In a field totally new to me', 'Terra incognita, onwards!'],
              ['Linked to what I already know', 'Your roots, your strength.'],
            ],
          },
          es: {
            t: 'Un proyecto loco, idealmente, es…',
            o: 'Pregúntale en qué campo le gustaría intentar algo loco.',
            a: [
              ['Algo totalmente nuevo para mí', '¡Terra incognita, adelante!'],
              ['Ligado a lo que ya conozco', 'Tus raíces, tu fuerza.'],
            ],
          },
          pt: {
            t: 'Um projeto maluco, idealmente, é…',
            o: 'Pergunte em que área essa pessoa gostaria de tentar algo maluco.',
            a: [
              ['Algo totalmente novo para mim', 'Terra incognita, avante!'],
              ['Ligado ao que eu já conheço', 'Suas raízes, sua força.'],
            ],
          },
          nl: {
            t: 'Een gek plan is idealiter…',
            o: 'Vraag op welk gebied die persoon iets geks zou willen proberen.',
            a: [
              ['Iets totaal nieuws voor mij', 'Terra incognita, vooruit!'],
              ['Verbonden met wat ik al ken', 'Je wortels, je kracht.'],
            ],
          },
        }),
        c('reves_projet_annonce', 'rythme', [['🤐', -60, 'calme'], ['📣', 70, 'monde']], {
          fr: {
            t: 'Ton projet fou, tu le racontes…',
            o: 'Demande-lui si elle ou il parle de ses projets avant de les lancer.',
            a: [
              ['À personne, secret jusqu’au bout', 'Motus et bouche cousue.'],
              ['À tout le monde, ça motive', 'Mégaphone en main !'],
            ],
          },
          en: {
            t: 'Your wild plan, you tell…',
            o: 'Ask them whether they talk about plans before launching them.',
            a: [
              ['Nobody, secret to the end', 'My lips are sealed.'],
              ['Everyone, it keeps me going', 'Megaphone in hand!'],
            ],
          },
          es: {
            t: 'Tu proyecto loco, se lo cuentas…',
            o: 'Pregúntale si habla de sus proyectos antes de lanzarlos.',
            a: [
              ['A nadie, secreto hasta el final', 'Punto en boca.'],
              ['A todo el mundo, me motiva', '¡Megáfono en mano!'],
            ],
          },
          pt: {
            t: 'Seu projeto maluco, você conta…',
            o: 'Pergunte se essa pessoa fala dos projetos antes de começar.',
            a: [
              ['Para ninguém, segredo até o fim', 'Boca de siri.'],
              ['Para todo mundo, me motiva', 'Megafone na mão!'],
            ],
          },
          nl: {
            t: 'Je gekke plan vertel je…',
            o: 'Vraag of die persoon over plannen praat voordat ze beginnen.',
            a: [
              ['Aan niemand, geheim tot het eind', 'Mijn lippen zijn verzegeld.'],
              ['Aan iedereen, dat motiveert', 'Megafoon in de hand!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_6',
      title: { fr: 'La maison de rêve', en: 'The dream home', es: 'La casa soñada', pt: 'A casa dos sonhos', nl: 'Het droomhuis' },
      questions: [
        c('reves_maison_type', 'ancrage', [['🛸', 70, 'curiosite'], ['🏠', 0, null], ['🏚️', -50, 'racines']], {
          fr: {
            t: 'Ta maison de rêve ?',
            o: 'Demande-lui à quoi ressemblerait sa maison de rêve.',
            a: [
              ['Une maison insolite : phare, bulle, péniche', 'Un phare ! Je monte en haut !'],
              ['Une maison simple et lumineuse', 'Du soleil dans chaque pièce.'],
              ['Une vieille maison de caractère retapée', 'Chaque pierre raconte une histoire.'],
            ],
          },
          en: {
            t: 'Your dream house?',
            o: 'Ask them what their dream house would look like.',
            a: [
              ['Something unusual: lighthouse, dome, barge', 'A lighthouse! I’m climbing to the top!'],
              ['A simple, bright house', 'Sunshine in every room.'],
              ['A charming old house, done up', 'Every stone tells a story.'],
            ],
          },
          es: {
            t: '¿Tu casa soñada?',
            o: 'Pregúntale cómo sería su casa soñada.',
            a: [
              ['Algo insólito: faro, burbuja, barcaza', '¡Un faro! ¡Subo arriba del todo!'],
              ['Una casa sencilla y luminosa', 'Sol en cada habitación.'],
              ['Una casa antigua con encanto, restaurada', 'Cada piedra cuenta una historia.'],
            ],
          },
          pt: {
            t: 'Sua casa dos sonhos?',
            o: 'Pergunte como seria a casa dos sonhos dessa pessoa.',
            a: [
              ['Algo inusitado: farol, bolha, barco-casa', 'Um farol! Vou subir até o topo!'],
              ['Uma casa simples e iluminada', 'Sol em todos os cômodos.'],
              ['Uma casa antiga cheia de charme, reformada', 'Cada pedra conta uma história.'],
            ],
          },
          nl: {
            t: 'Je droomhuis?',
            o: 'Vraag hoe het droomhuis van die persoon eruit zou zien.',
            a: [
              ['Iets bijzonders: vuurtoren, koepel, woonboot', 'Een vuurtoren! Ik klim naar boven!'],
              ['Een eenvoudig, licht huis', 'Zon in elke kamer.'],
              ['Een opgeknapt oud huis met karakter', 'Elke steen vertelt een verhaal.'],
            ],
          },
        }),
        c('reves_piece', 'rythme', [['🍽️', 60, 'accueil'], ['🎨', 0, null], ['📚', -60, 'cocooning']], {
          fr: {
            t: 'La pièce indispensable de ta maison de rêve ?',
            o: 'Demande-lui quelle pièce elle ou il ajouterait à sa maison de rêve.',
            a: [
              ['Une immense cuisine pour recevoir', 'Assez de chaises pour tout le quartier !'],
              ['Un atelier pour créer', 'De la peinture et des idées partout.'],
              ['Une bibliothèque avec un fauteuil moelleux', 'Je me roule en boule sur l’accoudoir.'],
            ],
          },
          en: {
            t: 'The must-have room in your dream house?',
            o: 'Ask them which room they’d add to their dream house.',
            a: [
              ['A huge kitchen for having people over', 'Enough chairs for the whole street!'],
              ['A studio for making things', 'Paint and ideas everywhere.'],
              ['A library with a squashy armchair', 'I’ll curl up on the armrest.'],
            ],
          },
          es: {
            t: '¿La habitación imprescindible de tu casa soñada?',
            o: 'Pregúntale qué habitación añadiría a su casa soñada.',
            a: [
              ['Una cocina enorme para recibir', '¡Sillas para todo el barrio!'],
              ['Un taller para crear', 'Pintura e ideas por todas partes.'],
              ['Una biblioteca con un sillón mullido', 'Me hago una bola en el reposabrazos.'],
            ],
          },
          pt: {
            t: 'O cômodo indispensável da sua casa dos sonhos?',
            o: 'Pergunte qual cômodo essa pessoa colocaria na casa dos sonhos.',
            a: [
              ['Uma cozinha enorme para receber', 'Cadeira para o bairro inteiro!'],
              ['Um ateliê para criar', 'Tinta e ideias para todo lado.'],
              ['Uma biblioteca com uma poltrona fofinha', 'Vou me enrolar no braço da poltrona.'],
            ],
          },
          nl: {
            t: 'De onmisbare kamer in je droomhuis?',
            o: 'Vraag welke kamer die persoon aan het droomhuis zou toevoegen.',
            a: [
              ['Een enorme keuken om mensen te ontvangen', 'Stoelen genoeg voor de hele buurt!'],
              ['Een atelier om te creëren', 'Overal verf en ideeën.'],
              ['Een bibliotheek met een zachte fauteuil', 'Ik krul me op op de armleuning.'],
            ],
          },
        }),
        s('reves_jardin', 'elan', ['🥕', 100, 'projets'], ['🌴', -100, 'temps_libre'], {
          fr: { t: 'Ton jardin de rêve…', o: 'Demande-lui ce qu’il y aurait dans son jardin idéal.', a: [['Un grand potager à cultiver', 'Je surveille les tomates !'], ['Un hamac entre deux arbres', 'On se balance, on ne fait rien.']], m: 'Quelques herbes aromatiques et une chaise longue.' },
          en: { t: 'Your dream garden…', o: 'Ask them what would be in their ideal garden.', a: [['A big vegetable patch to tend', 'I’ll keep an eye on the tomatoes!'], ['A hammock between two trees', 'We swing and do nothing.']], m: 'A few herbs and a deckchair.' },
          es: { t: 'Tu jardín soñado…', o: 'Pregúntale qué habría en su jardín ideal.', a: [['Un gran huerto que cuidar', '¡Yo vigilo los tomates!'], ['Una hamaca entre dos árboles', 'Nos balanceamos y no hacemos nada.']], m: 'Unas hierbas aromáticas y una tumbona.' },
          pt: { t: 'Seu jardim dos sonhos…', o: 'Pergunte o que teria no jardim ideal dessa pessoa.', a: [['Uma horta grande para cuidar', 'Eu fico de olho nos tomates!'], ['Uma rede entre duas árvores', 'A gente balança e não faz nada.']], m: 'Umas ervas e uma espreguiçadeira.' },
          nl: { t: 'Je droomtuin…', o: 'Vraag wat er in de ideale tuin van die persoon zou staan.', a: [['Een grote moestuin om te verzorgen', 'Ik houd de tomaten in de gaten!'], ['Een hangmat tussen twee bomen', 'We schommelen en doen niks.']], m: 'Wat kruiden en een ligstoel.' },
        }),
        c('reves_porte', 'foyer', [['🌿', -60, 'liberte'], ['🚪', 70, 'accueil']], {
          fr: {
            t: 'Ta maison de rêve, ce serait plutôt…',
            o: 'Demande-lui si elle ou il rêve d’une maison calme ou toujours pleine.',
            a: [
              ['Un refuge rien qu’à moi', 'Ton nid secret, bien caché.'],
              ['Une maison où les amis passent sans prévenir', 'Toc toc, qui est là ? Tout le monde !'],
            ],
          },
          en: {
            t: 'Your dream house would be more…',
            o: 'Ask them whether they dream of a quiet house or one that’s always full.',
            a: [
              ['A hideaway all my own', 'Your secret nest, well hidden.'],
              ['A house where friends drop by unannounced', 'Knock knock, who’s there? Everyone!'],
            ],
          },
          es: {
            t: 'Tu casa soñada sería más bien…',
            o: 'Pregúntale si sueña con una casa tranquila o siempre llena.',
            a: [
              ['Un refugio solo para mí', 'Tu nido secreto, bien escondido.'],
              ['Una casa donde los amigos vienen sin avisar', 'Toc toc, ¿quién es? ¡Todo el mundo!'],
            ],
          },
          pt: {
            t: 'Sua casa dos sonhos seria mais…',
            o: 'Pergunte se essa pessoa sonha com uma casa tranquila ou sempre cheia.',
            a: [
              ['Um refúgio só meu', 'Seu ninho secreto, bem escondido.'],
              ['Uma casa onde os amigos aparecem sem avisar', 'Toc toc, quem é? Todo mundo!'],
            ],
          },
          nl: {
            t: 'Je droomhuis zou eerder zijn…',
            o: 'Vraag of die persoon droomt van een rustig huis of een altijd vol huis.',
            a: [
              ['Een schuilplek helemaal voor mij', 'Je geheime nest, goed verstopt.'],
              ['Een huis waar vrienden zomaar binnenlopen', 'Klop klop, wie is daar? Iedereen!'],
            ],
          },
        }),
        c('reves_amenager', 'cap', [['🛋️', -60, 'spontane'], ['📐', 70, 'plan']], {
          fr: {
            t: 'Pour aménager ta maison de rêve, tu…',
            o: 'Demande-lui comment elle ou il aménagerait sa maison idéale.',
            a: [
              ['Ajoutes les choses au fil des trouvailles', 'Oh, une lampe en forme de champignon !'],
              ['Dessines tous les plans à l’avance', 'Plan au centimètre, bravo l’architecte.'],
            ],
          },
          en: {
            t: 'To furnish your dream house, you…',
            o: 'Ask them how they’d furnish their ideal home.',
            a: [
              ['Add things as you find them', 'Ooh, a mushroom-shaped lamp!'],
              ['Draw every plan in advance', 'Plans to the centimetre, bravo architect.'],
            ],
          },
          es: {
            t: 'Para amueblar tu casa soñada, tú…',
            o: 'Pregúntale cómo decoraría su casa ideal.',
            a: [
              ['Añades cosas según las encuentras', '¡Oh, una lámpara con forma de seta!'],
              ['Dibujas todos los planos de antemano', 'Planos al centímetro, bravo, arquitecto.'],
            ],
          },
          pt: {
            t: 'Para montar sua casa dos sonhos, você…',
            o: 'Pergunte como essa pessoa decoraria a casa ideal.',
            a: [
              ['Vai colocando as coisas conforme acha', 'Olha, um abajur em forma de cogumelo!'],
              ['Desenha toda a planta antes', 'Planta no centímetro, parabéns, arquiteto.'],
            ],
          },
          nl: {
            t: 'Om je droomhuis in te richten…',
            o: 'Vraag hoe die persoon het ideale huis zou inrichten.',
            a: [
              ['Voeg je dingen toe zodra je ze vindt', 'Oh, een lamp in de vorm van een paddenstoel!'],
              ['Teken je alle plannen van tevoren', 'Plannen op de centimeter, bravo architect.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_7',
      title: { fr: 'Ta journée parfaite', en: 'Your perfect day', es: 'Tu día perfecto', pt: 'Seu dia perfeito', nl: 'Je perfecte dag' },
      questions: [
        s('reves_journee_ambiance', 'rythme', ['🌙', -100, 'calme'], ['🎡', 100, 'monde'], {
          fr: { t: 'Ta journée parfaite serait…', o: 'Demande-lui de décrire sa journée parfaite.', a: [['Douce, lente et silencieuse', 'On chuchote toute la journée.'], ['Pleine de rencontres et de sorties', 'Bonjour ! Et bonjour ! Et re-bonjour !']], m: 'Un bel équilibre des deux.' },
          en: { t: 'Your perfect day would be…', o: 'Ask them to describe their perfect day.', a: [['Gentle, slow and quiet', 'We’ll whisper all day.'], ['Full of meetings and outings', 'Hello! And hello! And hello again!']], m: 'A nice balance of both.' },
          es: { t: 'Tu día perfecto sería…', o: 'Pregúntale cómo sería su día perfecto.', a: [['Suave, lento y silencioso', 'Susurramos todo el día.'], ['Lleno de encuentros y planes', '¡Hola! ¡Y hola! ¡Y otra vez hola!']], m: 'Un buen equilibrio de las dos cosas.' },
          pt: { t: 'Seu dia perfeito seria…', o: 'Pergunte como seria o dia perfeito dessa pessoa.', a: [['Suave, lento e silencioso', 'A gente sussurra o dia todo.'], ['Cheio de encontros e passeios', 'Oi! E oi! E oi de novo!']], m: 'Um bom equilíbrio dos dois.' },
          nl: { t: 'Je perfecte dag zou zijn…', o: 'Vraag hoe de perfecte dag van die persoon eruitziet.', a: [['Zacht, langzaam en stil', 'We fluisteren de hele dag.'], ['Vol ontmoetingen en uitjes', 'Hallo! En hallo! En nog eens hallo!']], m: 'Een mooie balans tussen beide.' },
        }),
        c('reves_journee_reveil', 'cap', [['😴', -60, 'spontane'], ['⏰', 60, 'plan']], {
          fr: {
            t: 'Ce jour parfait, tu te réveilles…',
            o: 'Demande-lui comment commencerait sa journée parfaite.',
            a: [
              ['Sans réveil, et on verra bien', 'Le soleil te réveillera en douceur.'],
              ['Tôt, avec un programme génial', 'Debout ! La journée commence !'],
            ],
          },
          en: {
            t: 'On that perfect day, you wake up…',
            o: 'Ask them how their perfect day would begin.',
            a: [
              ['With no alarm, and we’ll see', 'The sun will wake you gently.'],
              ['Early, with a brilliant plan', 'Up you get! The day is starting!'],
            ],
          },
          es: {
            t: 'Ese día perfecto, te despiertas…',
            o: 'Pregúntale cómo empezaría su día perfecto.',
            a: [
              ['Sin despertador, y ya veremos', 'El sol te despertará suavecito.'],
              ['Temprano, con un plan genial', '¡Arriba! ¡Empieza el día!'],
            ],
          },
          pt: {
            t: 'Nesse dia perfeito, você acorda…',
            o: 'Pergunte como começaria o dia perfeito dessa pessoa.',
            a: [
              ['Sem despertador, e vamos ver', 'O sol vai te acordar de mansinho.'],
              ['Cedo, com uma programação incrível', 'De pé! O dia está começando!'],
            ],
          },
          nl: {
            t: 'Op die perfecte dag word je wakker…',
            o: 'Vraag hoe de perfecte dag van die persoon zou beginnen.',
            a: [
              ['Zonder wekker, en we zien wel', 'De zon maakt je zachtjes wakker.'],
              ['Vroeg, met een geweldig programma', 'Opstaan! De dag begint!'],
            ],
          },
        }),
        c('reves_journee_lieu', 'ancrage', [['🏡', -60, 'racines'], ['🌋', 70, 'aventure']], {
          fr: {
            t: 'Ta journée parfaite se passe…',
            o: 'Demande-lui où se passerait sa journée parfaite.',
            a: [
              ['Dans mon quartier, avec mes petites habitudes', 'Les meilleures choses sont tout près.'],
              ['Dans un pays que je ne connais pas', 'Passeport ? Check !'],
            ],
          },
          en: {
            t: 'Your perfect day takes place…',
            o: 'Ask them where their perfect day would take place.',
            a: [
              ['In my neighbourhood, with my little habits', 'The best things are close by.'],
              ['In a country I’ve never been to', 'Passport? Check!'],
            ],
          },
          es: {
            t: 'Tu día perfecto transcurre…',
            o: 'Pregúntale dónde sería su día perfecto.',
            a: [
              ['En mi barrio, con mis costumbres', 'Lo mejor está muy cerca.'],
              ['En un país que no conozco', '¿Pasaporte? ¡Listo!'],
            ],
          },
          pt: {
            t: 'Seu dia perfeito acontece…',
            o: 'Pergunte onde seria o dia perfeito dessa pessoa.',
            a: [
              ['No meu bairro, com meus hábitos', 'As melhores coisas estão pertinho.'],
              ['Num país que eu não conheço', 'Passaporte? Ok!'],
            ],
          },
          nl: {
            t: 'Je perfecte dag speelt zich af…',
            o: 'Vraag waar de perfecte dag van die persoon zou plaatsvinden.',
            a: [
              ['In mijn buurt, met mijn gewoontes', 'De mooiste dingen zijn dichtbij.'],
              ['In een land dat ik niet ken', 'Paspoort? Check!'],
            ],
          },
        }),
        c('reves_journee_avec', 'foyer', [['👯', 20, 'accueil'], ['🌻', -60, 'liberte'], ['🎉', 70, 'famille']], {
          fr: {
            t: 'Ta journée parfaite, tu la passes…',
            o: 'Demande-lui avec qui elle ou il passerait sa journée parfaite.',
            a: [
              ['Avec une ou deux personnes complices', 'Le trio parfait.'],
              ['Avec moi-même, et c’est parfait', 'Toi et toi, quelle belle équipe.'],
              ['Avec toutes les personnes que j’aime', 'Une grande ronde de câlins !'],
            ],
          },
          en: {
            t: 'You spend your perfect day…',
            o: 'Ask them who they’d spend their perfect day with.',
            a: [
              ['With one or two kindred spirits', 'The perfect trio.'],
              ['With myself, and that’s perfect', 'You and you, what a team.'],
              ['With everyone I love', 'A big circle of hugs!'],
            ],
          },
          es: {
            t: 'Tu día perfecto, lo pasas…',
            o: 'Pregúntale con quién pasaría su día perfecto.',
            a: [
              ['Con una o dos personas cómplices', 'El trío perfecto.'],
              ['Conmigo, y es perfecto', 'Tú y tú, qué buen equipo.'],
              ['Con toda la gente que quiero', '¡Un gran corro de abrazos!'],
            ],
          },
          pt: {
            t: 'Seu dia perfeito, você passa…',
            o: 'Pergunte com quem essa pessoa passaria o dia perfeito.',
            a: [
              ['Com uma ou duas pessoas cúmplices', 'O trio perfeito.'],
              ['Comigo mesmo, e é perfeito', 'Você e você, que equipe.'],
              ['Com todas as pessoas que eu amo', 'Uma grande roda de abraços!'],
            ],
          },
          nl: {
            t: 'Je perfecte dag breng je door…',
            o: 'Vraag met wie die persoon de perfecte dag zou doorbrengen.',
            a: [
              ['Met een of twee zielsverwanten', 'Het perfecte trio.'],
              ['Met mezelf, en dat is perfect', 'Jij en jij, wat een team.'],
              ['Met iedereen van wie ik hou', 'Een grote kring vol knuffels!'],
            ],
          },
        }),
        c('reves_journee_bilan', 'elan', [['🌅', -60, 'temps_libre'], ['✅', 60, 'projets']], {
          fr: {
            t: 'Le soir de ce jour parfait, tu te dis…',
            o: 'Demande-lui ce qui rend une journée vraiment réussie.',
            a: [
              ['J’ai savouré chaque minute', 'Que de douceur, merci la vie.'],
              ['J’ai accompli un truc génial', 'Mission du jour : réussie !'],
            ],
          },
          en: {
            t: 'On the evening of that perfect day, you think…',
            o: 'Ask them what makes a day truly great.',
            a: [
              ['I savoured every minute', 'So much sweetness, thanks life.'],
              ['I achieved something brilliant', 'Mission of the day: accomplished!'],
            ],
          },
          es: {
            t: 'La noche de ese día perfecto, piensas…',
            o: 'Pregúntale qué hace que un día salga redondo.',
            a: [
              ['He saboreado cada minuto', 'Cuánta dulzura, gracias, vida.'],
              ['He logrado algo genial', 'Misión del día: ¡cumplida!'],
            ],
          },
          pt: {
            t: 'Na noite desse dia perfeito, você pensa…',
            o: 'Pergunte o que faz um dia ser realmente bom.',
            a: [
              ['Saboreei cada minuto', 'Quanta doçura, obrigado, vida.'],
              ['Fiz uma coisa incrível', 'Missão do dia: cumprida!'],
            ],
          },
          nl: {
            t: 'Op de avond van die perfecte dag denk je…',
            o: 'Vraag wat een dag echt geslaagd maakt.',
            a: [
              ['Ik heb van elke minuut genoten', 'Zoveel zachtheid, dank je, leven.'],
              ['Ik heb iets geweldigs bereikt', 'Missie van de dag: geslaagd!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_8',
      title: { fr: 'Créer quelque chose', en: 'Creating something', es: 'Crear algo', pt: 'Criar algo', nl: 'Iets maken' },
      questions: [
        c('reves_creer_quoi', 'ancrage', [['🌍', 70, 'voyage'], ['🍰', -50, 'racines'], ['🎨', 20, 'curiosite']], {
          fr: {
            t: 'Si tu créais un lieu ou une œuvre…',
            o: 'Demande-lui ce qu’elle ou il rêverait de créer.',
            a: [
              ['Un café aux saveurs du monde entier', 'Un tour du monde par tasse !'],
              ['Une boulangerie aux recettes d’ici', 'L’odeur du pain chaud, déjà.'],
              ['Une œuvre d’art jamais vue', 'Je pose devant pour la photo !'],
            ],
          },
          en: {
            t: 'If you created a place or a work of art…',
            o: 'Ask them what they dream of creating.',
            a: [
              ['A café with flavours from all over the world', 'A world tour in every cup!'],
              ['A bakery with local recipes', 'I can smell warm bread already.'],
              ['A work of art never seen before', 'I’ll pose in front for the photo!'],
            ],
          },
          es: {
            t: 'Si crearas un lugar o una obra…',
            o: 'Pregúntale qué soñaría con crear.',
            a: [
              ['Un café con sabores de todo el mundo', '¡La vuelta al mundo en cada taza!'],
              ['Una panadería con recetas de aquí', 'Ya huele a pan recién hecho.'],
              ['Una obra de arte nunca vista', '¡Poso delante para la foto!'],
            ],
          },
          pt: {
            t: 'Se você criasse um lugar ou uma obra…',
            o: 'Pergunte o que essa pessoa sonha em criar.',
            a: [
              ['Um café com sabores do mundo todo', 'Uma volta ao mundo por xícara!'],
              ['Uma padaria com receitas daqui', 'Já sinto o cheiro de pão quentinho.'],
              ['Uma obra de arte nunca vista', 'Vou posar na frente para a foto!'],
            ],
          },
          nl: {
            t: 'Als je een plek of kunstwerk zou maken…',
            o: 'Vraag wat die persoon zou dromen te maken.',
            a: [
              ['Een café met smaken uit de hele wereld', 'Een wereldreis in elk kopje!'],
              ['Een bakkerij met recepten van hier', 'Ik ruik het warme brood al.'],
              ['Een kunstwerk dat niemand ooit zag', 'Ik poseer ervoor voor de foto!'],
            ],
          },
        }),
        s('reves_creer_taille', 'elan', ['🌱', -100, 'temps_libre'], ['🚀', 100, 'projets'], {
          fr: { t: 'Ta création, tu la vois…', o: 'Demande-lui jusqu’où elle ou il aimerait voir grandir son projet.', a: [['Petite et tranquille, pour le plaisir', 'Petit mais costaud, et tout doux.'], ['Grande et connue partout', 'Bientôt sur toutes les cartes du monde !']], m: 'Juste assez grande pour faire du bien autour.' },
          en: { t: 'You picture your creation…', o: 'Ask them how big they’d like their project to grow.', a: [['Small and quiet, just for the joy of it', 'Small but mighty, and gentle.'], ['Big and known everywhere', 'Soon on every map in the world!']], m: 'Just big enough to do some good around.' },
          es: { t: 'Tu creación, la imaginas…', o: 'Pregúntale hasta dónde le gustaría que creciera su proyecto.', a: [['Pequeña y tranquila, por placer', 'Pequeña pero matona, y suavecita.'], ['Grande y conocida en todas partes', '¡Pronto en todos los mapas del mundo!']], m: 'Lo justo para hacer bien alrededor.' },
          pt: { t: 'Sua criação, você imagina…', o: 'Pergunte até onde essa pessoa gostaria que o projeto crescesse.', a: [['Pequena e tranquila, por prazer', 'Pequena mas valente, e fofinha.'], ['Grande e conhecida em todo lugar', 'Em breve em todos os mapas do mundo!']], m: 'Do tamanho certo para fazer bem ao redor.' },
          nl: { t: 'Je creatie zie je…', o: 'Vraag hoe groot die persoon het project zou willen laten worden.', a: [['Klein en rustig, voor de lol', 'Klein maar dapper, en lief.'], ['Groot en overal bekend', 'Binnenkort op elke kaart van de wereld!']], m: 'Net groot genoeg om iets goeds te doen.' },
        }),
        c('reves_creer_lieu', 'foyer', [['🏠', 70, 'accueil'], ['🔭', -60, 'liberte']], {
          fr: {
            t: 'Ta création, ce serait un endroit…',
            o: 'Demande-lui quel genre d’endroit elle ou il aimerait ouvrir.',
            a: [
              ['Où tout le quartier vient se retrouver', 'Bienvenue à tout le monde !'],
              ['Où je peux m’isoler pour créer', 'Chut, génie au travail.'],
            ],
          },
          en: {
            t: 'Your creation would be a place…',
            o: 'Ask them what kind of place they’d love to open.',
            a: [
              ['Where the whole neighbourhood gathers', 'Welcome, everyone!'],
              ['Where I can retreat to create', 'Shh, genius at work.'],
            ],
          },
          es: {
            t: 'Tu creación sería un lugar…',
            o: 'Pregúntale qué tipo de lugar le gustaría abrir.',
            a: [
              ['Donde todo el barrio se reúne', '¡Bienvenidos todos!'],
              ['Donde puedo aislarme para crear', 'Chis, genio trabajando.'],
            ],
          },
          pt: {
            t: 'Sua criação seria um lugar…',
            o: 'Pergunte que tipo de lugar essa pessoa gostaria de abrir.',
            a: [
              ['Onde o bairro todo se encontra', 'Sejam todos bem-vindos!'],
              ['Onde posso me isolar para criar', 'Psiu, gênio trabalhando.'],
            ],
          },
          nl: {
            t: 'Je creatie zou een plek zijn…',
            o: 'Vraag wat voor plek die persoon graag zou openen.',
            a: [
              ['Waar de hele buurt samenkomt', 'Welkom, allemaal!'],
              ['Waar ik me kan terugtrekken om te creëren', 'Sst, genie aan het werk.'],
            ],
          },
        }),
        c('reves_creer_methode', 'cap', [['🗂️', 70, 'ordre'], ['☕', 10, null], ['🎨', -70, 'spontane']], {
          fr: {
            t: 'Pour créer, tu…',
            o: 'Demande-lui comment lui viennent ses meilleures idées.',
            a: [
              ['Fais un plan détaillé', 'Étape 1, étape 2… on y est presque.'],
              ['Laisses mûrir l’idée tranquillement', 'Une idée, ça pousse comme une plante.'],
              ['Suis l’inspiration du moment', 'Eurêka ! Vite, un crayon !'],
            ],
          },
          en: {
            t: 'To create, you…',
            o: 'Ask them how their best ideas come to them.',
            a: [
              ['Make a detailed plan', 'Step 1, step 2… nearly there.'],
              ['Let the idea ripen slowly', 'An idea grows like a plant.'],
              ['Follow the inspiration of the moment', 'Eureka! Quick, a pencil!'],
            ],
          },
          es: {
            t: 'Para crear, tú…',
            o: 'Pregúntale cómo le llegan sus mejores ideas.',
            a: [
              ['Haces un plan detallado', 'Paso 1, paso 2… ya casi.'],
              ['Dejas madurar la idea con calma', 'Una idea crece como una planta.'],
              ['Sigues la inspiración del momento', '¡Eureka! ¡Rápido, un lápiz!'],
            ],
          },
          pt: {
            t: 'Para criar, você…',
            o: 'Pergunte como surgem as melhores ideias dessa pessoa.',
            a: [
              ['Faz um plano detalhado', 'Etapa 1, etapa 2… quase lá.'],
              ['Deixa a ideia amadurecer com calma', 'Uma ideia cresce como uma planta.'],
              ['Segue a inspiração do momento', 'Eureca! Rápido, um lápis!'],
            ],
          },
          nl: {
            t: 'Om iets te maken…',
            o: 'Vraag hoe die persoon op de beste ideeën komt.',
            a: [
              ['Maak je een gedetailleerd plan', 'Stap 1, stap 2… bijna klaar.'],
              ['Laat je het idee rustig rijpen', 'Een idee groeit als een plant.'],
              ['Volg je de inspiratie van het moment', 'Eureka! Snel, een potlood!'],
            ],
          },
        }),
        c('reves_creer_ouverture', 'rythme', [['🕯️', -60, 'calme'], ['🎊', 80, 'fete']], {
          fr: {
            t: 'Le jour de l’inauguration de ta création…',
            o: 'Demande-lui comment elle ou il fêterait un projet réussi.',
            a: [
              ['Ouverture discrète, en douceur', 'Les plus belles choses naissent sans bruit.'],
              ['Grande fête, tout le monde est invité', 'Je coupe le ruban ? S’il te plaît !'],
            ],
          },
          en: {
            t: 'On the opening day of your creation…',
            o: 'Ask them how they’d celebrate a successful project.',
            a: [
              ['A low-key, gentle opening', 'The loveliest things are born quietly.'],
              ['A big party, everyone’s invited', 'Can I cut the ribbon? Please!'],
            ],
          },
          es: {
            t: 'El día de la inauguración de tu creación…',
            o: 'Pregúntale cómo celebraría un proyecto que sale bien.',
            a: [
              ['Apertura discreta, con suavidad', 'Lo más bonito nace sin ruido.'],
              ['Gran fiesta, todos invitados', '¿Corto yo la cinta? ¡Porfa!'],
            ],
          },
          pt: {
            t: 'No dia da inauguração da sua criação…',
            o: 'Pergunte como essa pessoa comemoraria um projeto que deu certo.',
            a: [
              ['Abertura discreta, com calma', 'As coisas mais bonitas nascem sem barulho.'],
              ['Festa enorme, todo mundo convidado', 'Posso cortar a fita? Por favor!'],
            ],
          },
          nl: {
            t: 'Op de openingsdag van je creatie…',
            o: 'Vraag hoe die persoon een geslaagd project zou vieren.',
            a: [
              ['Een stille, zachte opening', 'De mooiste dingen ontstaan in stilte.'],
              ['Een groot feest, iedereen is uitgenodigd', 'Mag ik het lint doorknippen? Alsjeblieft!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_9',
      title: { fr: 'Te dépasser', en: 'Pushing yourself', es: 'Superarte', pt: 'Se superar', nl: 'Jezelf overtreffen' },
      questions: [
        c('reves_defi', 'elan', [['🐢', -50, 'temps_libre'], ['🏔️', 70, 'sport'], ['🎤', 40, null]], {
          fr: {
            t: 'Un défi que tu rêves de relever ?',
            o: 'Demande-lui quel défi elle ou il rêve de relever.',
            a: [
              ['Apprendre à prendre tout mon temps', 'Le défi le plus doux du monde.'],
              ['Gravir une montagne', 'Le sommet t’attend, allez !'],
              ['Monter sur scène', 'Les projecteurs sont pour toi !'],
            ],
          },
          en: {
            t: 'A challenge you dream of taking on?',
            o: 'Ask them which challenge they dream of taking on.',
            a: [
              ['Learning to take my sweet time', 'The gentlest challenge in the world.'],
              ['Climbing a mountain', 'The summit is waiting, come on!'],
              ['Getting up on stage', 'The spotlight is yours!'],
            ],
          },
          es: {
            t: '¿Un reto que sueñas con superar?',
            o: 'Pregúntale qué reto sueña con superar.',
            a: [
              ['Aprender a tomarme todo el tiempo del mundo', 'El reto más dulce del mundo.'],
              ['Subir una montaña', '¡La cima te espera, vamos!'],
              ['Subirme a un escenario', '¡Los focos son para ti!'],
            ],
          },
          pt: {
            t: 'Um desafio que você sonha em encarar?',
            o: 'Pergunte qual desafio essa pessoa sonha em encarar.',
            a: [
              ['Aprender a ir sem pressa nenhuma', 'O desafio mais gostoso do mundo.'],
              ['Escalar uma montanha', 'O cume está te esperando, vamos!'],
              ['Subir num palco', 'Os holofotes são seus!'],
            ],
          },
          nl: {
            t: 'Een uitdaging waar je van droomt?',
            o: 'Vraag van welke uitdaging die persoon droomt.',
            a: [
              ['Leren om alle tijd te nemen', 'De zachtste uitdaging ter wereld.'],
              ['Een berg beklimmen', 'De top wacht op je, kom op!'],
              ['Op een podium staan', 'De spotlights zijn voor jou!'],
            ],
          },
        }),
        s('reves_zone_confort', 'ancrage', ['🛋️', -100, 'racines'], ['🪂', 100, 'aventure'], {
          fr: { t: 'Sortir de ta zone de confort…', o: 'Demande-lui la dernière fois qu’elle ou il a tenté un truc complètement nouveau.', a: [['J’aime mon petit cocon familier', 'Ton cocon, c’est précieux.'], ['J’adore, plus c’est nouveau mieux c’est', 'Saut dans l’inconnu, youpi !']], m: 'Un petit pas de temps en temps.' },
          en: { t: 'Stepping out of your comfort zone…', o: 'Ask them about the last time they tried something completely new.', a: [['I love my familiar little cocoon', 'Your cocoon is precious.'], ['Love it, the newer the better', 'Leap into the unknown, woohoo!']], m: 'A small step now and then.' },
          es: { t: 'Salir de tu zona de confort…', o: 'Pregúntale cuándo fue la última vez que probó algo totalmente nuevo.', a: [['Me gusta mi capullito de siempre', 'Tu capullito es un tesoro.'], ['Me encanta, cuanto más nuevo mejor', '¡Salto a lo desconocido, yuju!']], m: 'Un pasito de vez en cuando.' },
          pt: { t: 'Sair da sua zona de conforto…', o: 'Pergunte qual foi a última vez que essa pessoa tentou algo totalmente novo.', a: [['Gosto do meu casulo de sempre', 'Seu casulo é um tesouro.'], ['Adoro, quanto mais novo melhor', 'Salto no desconhecido, uhu!']], m: 'Um passinho de vez em quando.' },
          nl: { t: 'Uit je comfortzone stappen…', o: 'Vraag wanneer die persoon voor het laatst iets compleet nieuws probeerde.', a: [['Ik hou van mijn vertrouwde cocon', 'Je cocon is kostbaar.'], ['Heerlijk, hoe nieuwer hoe beter', 'Sprong in het onbekende, joepie!']], m: 'Af en toe een klein stapje.' },
        }),
        c('reves_defi_regards', 'rythme', [['🌙', -60, 'calme'], ['📣', 70, 'monde']], {
          fr: {
            t: 'Ton grand défi, tu le relèves…',
            o: 'Demande-lui si elle ou il aime avoir du public pour l’encourager.',
            a: [
              ['Loin des regards, tranquille', 'Ta victoire secrète, je la garde.'],
              ['Devant une foule qui m’encourage', 'Allez ! Allez ! Allez !'],
            ],
          },
          en: {
            t: 'Your big challenge, you take it on…',
            o: 'Ask them whether they like having a crowd cheer them on.',
            a: [
              ['Away from prying eyes, quietly', 'Your secret victory, I’ll keep it.'],
              ['In front of a cheering crowd', 'Go! Go! Go!'],
            ],
          },
          es: {
            t: 'Tu gran reto, lo afrontas…',
            o: 'Pregúntale si le gusta que una multitud le anime.',
            a: [
              ['Lejos de las miradas, tranquilamente', 'Tu victoria secreta, la guardo yo.'],
              ['Delante de una multitud que me anima', '¡Vamos! ¡Vamos! ¡Vamos!'],
            ],
          },
          pt: {
            t: 'Seu grande desafio, você encara…',
            o: 'Pergunte se essa pessoa gosta de ter uma torcida.',
            a: [
              ['Longe dos olhares, tranquilo', 'Sua vitória secreta, eu guardo.'],
              ['Na frente de uma torcida animada', 'Vai! Vai! Vai!'],
            ],
          },
          nl: {
            t: 'Je grote uitdaging ga je aan…',
            o: 'Vraag of die persoon het fijn vindt om door een menigte aangemoedigd te worden.',
            a: [
              ['Ver van pottenkijkers, rustig', 'Je geheime overwinning, ik bewaar hem.'],
              ['Voor een juichende menigte', 'Hup! Hup! Hup!'],
            ],
          },
        }),
        c('reves_defi_prep', 'cap', [['📊', 70, 'plan'], ['🌊', -60, 'spontane']], {
          fr: {
            t: 'Pour te préparer à un grand défi, tu…',
            o: 'Demande-lui comment elle ou il se prépare avant un grand moment.',
            a: [
              ['Suis un plan d’entraînement précis', 'Jour 1 : coché. Jour 2 : coché.'],
              ['Y vas au feeling', 'Le cœur comme boussole !'],
            ],
          },
          en: {
            t: 'To prepare for a big challenge, you…',
            o: 'Ask them how they prepare for a big moment.',
            a: [
              ['Follow a precise training plan', 'Day 1: ticked. Day 2: ticked.'],
              ['Go with the flow', 'Heart as your compass!'],
            ],
          },
          es: {
            t: 'Para prepararte para un gran reto, tú…',
            o: 'Pregúntale cómo se prepara antes de un gran momento.',
            a: [
              ['Sigues un plan de entrenamiento preciso', 'Día 1: hecho. Día 2: hecho.'],
              ['Vas a lo que salga', '¡El corazón como brújula!'],
            ],
          },
          pt: {
            t: 'Para se preparar para um grande desafio, você…',
            o: 'Pergunte como essa pessoa se prepara antes de um grande momento.',
            a: [
              ['Segue um plano de treino certinho', 'Dia 1: feito. Dia 2: feito.'],
              ['Vai no feeling', 'O coração como bússola!'],
            ],
          },
          nl: {
            t: 'Om je voor te bereiden op een grote uitdaging…',
            o: 'Vraag hoe die persoon zich voorbereidt op een groot moment.',
            a: [
              ['Volg je een precies trainingsschema', 'Dag 1: afgevinkt. Dag 2: afgevinkt.'],
              ['Ga je op gevoel', 'Je hart als kompas!'],
            ],
          },
        }),
        c('reves_defi_equipe', 'foyer', [['🦅', -60, 'liberte'], ['🫂', 70, 'famille']], {
          fr: {
            t: 'Un défi, c’est meilleur…',
            o: 'Demande-lui si elle ou il préfère les défis en équipe ou en solo.',
            a: [
              ['En solo, face à moi-même', 'Toi contre toi : tu gagnes à tous les coups.'],
              ['En équipe, on se porte les uns les autres', 'Personne ne reste derrière !'],
            ],
          },
          en: {
            t: 'A challenge is better…',
            o: 'Ask them whether they prefer challenges as a team or solo.',
            a: [
              ['Solo, just me against myself', 'You versus you: you always win.'],
              ['As a team, carrying each other', 'Nobody gets left behind!'],
            ],
          },
          es: {
            t: 'Un reto es mejor…',
            o: 'Pregúntale si prefiere los retos en equipo o en solitario.',
            a: [
              ['En solitario, frente a mí', 'Tú contra ti: ganas siempre.'],
              ['En equipo, nos apoyamos', '¡Nadie se queda atrás!'],
            ],
          },
          pt: {
            t: 'Um desafio é melhor…',
            o: 'Pergunte se essa pessoa prefere desafios em equipe ou solo.',
            a: [
              ['Solo, eu comigo mesmo', 'Você contra você: sempre vence.'],
              ['Em equipe, um segurando o outro', 'Ninguém fica para trás!'],
            ],
          },
          nl: {
            t: 'Een uitdaging is leuker…',
            o: 'Vraag of die persoon uitdagingen liever in een team of solo doet.',
            a: [
              ['Solo, ik tegen mezelf', 'Jij tegen jij: je wint altijd.'],
              ['In een team, we dragen elkaar', 'Niemand blijft achter!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'reves_10',
      title: { fr: 'Rêver ensemble', en: 'Dreaming together', es: 'Soñar juntos', pt: 'Sonhar juntos', nl: 'Samen dromen' },
      questions: [
        s('reves_partager', 'foyer', ['🤫', -100, 'liberte'], ['📢', 100, 'famille'], {
          fr: { t: 'Tes rêves, tu les partages…', o: 'Demande-lui à qui elle ou il confie ses rêves.', a: [['Avec personne, ils sont à moi', 'Ton coffre à rêves, bien fermé.'], ['Avec tous mes proches', 'Rêvons tous ensemble !']], m: 'Avec une ou deux personnes de confiance.' },
          en: { t: 'Your dreams, you share them…', o: 'Ask them who they confide their dreams in.', a: [['With nobody, they’re mine', 'Your dream chest, locked tight.'], ['With all my loved ones', 'Let’s all dream together!']], m: 'With one or two trusted people.' },
          es: { t: 'Tus sueños, los compartes…', o: 'Pregúntale a quién le cuenta sus sueños.', a: [['Con nadie, son míos', 'Tu cofre de sueños, bien cerrado.'], ['Con toda mi gente', '¡Soñemos todos juntos!']], m: 'Con una o dos personas de confianza.' },
          pt: { t: 'Seus sonhos, você compartilha…', o: 'Pergunte para quem essa pessoa conta seus sonhos.', a: [['Com ninguém, são meus', 'Seu baú de sonhos, bem trancado.'], ['Com todas as pessoas queridas', 'Vamos sonhar todos juntos!']], m: 'Com uma ou duas pessoas de confiança.' },
          nl: { t: 'Je dromen deel je…', o: 'Vraag aan wie die persoon dromen toevertrouwt.', a: [['Met niemand, ze zijn van mij', 'Je dromenkist, goed op slot.'], ['Met al mijn dierbaren', 'Laten we samen dromen!']], m: 'Met een of twee vertrouwde mensen.' },
        }),
        c('reves_quartier_reve', 'rythme', [['🌻', -50, 'nature'], ['🎶', 70, 'musique'], ['📚', -10, 'calme']], {
          fr: {
            t: 'Le rêve que tu aimerais voir naître dans ton quartier ?',
            o: 'Demande-lui ce qu’elle ou il rêverait de voir dans le quartier.',
            a: [
              ['Un jardin partagé paisible', 'Je plante les tournesols !'],
              ['Une fête de la musique géante', 'Tout le quartier danse !'],
              ['Une boîte à livres à chaque coin de rue', 'Un livre pris, un livre offert.'],
            ],
          },
          en: {
            t: 'The dream you’d love to see come true in your neighbourhood?',
            o: 'Ask them what they’d dream of seeing in the neighbourhood.',
            a: [
              ['A peaceful community garden', 'I’ll plant the sunflowers!'],
              ['A giant street music festival', 'The whole neighbourhood is dancing!'],
              ['A little book box on every corner', 'Take a book, leave a book.'],
            ],
          },
          es: {
            t: '¿El sueño que te gustaría ver nacer en tu barrio?',
            o: 'Pregúntale qué soñaría ver en el barrio.',
            a: [
              ['Un huerto compartido tranquilo', '¡Yo planto los girasoles!'],
              ['Una fiesta de la música gigante', '¡Todo el barrio baila!'],
              ['Una caja de libros en cada esquina', 'Un libro tomado, un libro regalado.'],
            ],
          },
          pt: {
            t: 'O sonho que você gostaria de ver nascer no seu bairro?',
            o: 'Pergunte o que essa pessoa sonharia ver no bairro.',
            a: [
              ['Uma horta comunitária tranquila', 'Eu planto os girassóis!'],
              ['Um festival de música gigante na rua', 'O bairro inteiro dançando!'],
              ['Uma caixinha de livros em cada esquina', 'Pegue um livro, deixe um livro.'],
            ],
          },
          nl: {
            t: 'De droom die je in je buurt zou willen zien uitkomen?',
            o: 'Vraag wat die persoon graag in de buurt zou zien.',
            a: [
              ['Een rustige gemeenschapstuin', 'Ik plant de zonnebloemen!'],
              ['Een gigantisch muziekfeest op straat', 'De hele buurt danst!'],
              ['Een boekenkastje op elke hoek', 'Boek mee, boek terug.'],
            ],
          },
        }),
        c('reves_liste', 'cap', [['💭', -60, 'spontane'], ['📝', 70, 'plan']], {
          fr: {
            t: 'Tes rêves, tu les…',
            o: 'Demande-lui si elle ou il tient une liste de rêves.',
            a: [
              ['Laisses flotter dans ta tête', 'Comme des nuages, tout légers.'],
              ['Notes dans une liste à cocher', 'Rêve n°7 : coché ! Bravo !'],
            ],
          },
          en: {
            t: 'Your dreams, you…',
            o: 'Ask them whether they keep a list of dreams.',
            a: [
              ['Let them float around in your head', 'Like clouds, so light.'],
              ['Write them down in a list to tick off', 'Dream no. 7: ticked! Bravo!'],
            ],
          },
          es: {
            t: 'Tus sueños, los…',
            o: 'Pregúntale si tiene una lista de sueños.',
            a: [
              ['Dejas flotar en tu cabeza', 'Como nubes, ligeritos.'],
              ['Apuntas en una lista para tachar', 'Sueño n.º 7: ¡tachado! ¡Bravo!'],
            ],
          },
          pt: {
            t: 'Seus sonhos, você…',
            o: 'Pergunte se essa pessoa tem uma lista de sonhos.',
            a: [
              ['Deixa flutuando na cabeça', 'Como nuvens, levinhos.'],
              ['Anota numa lista para ir marcando', 'Sonho nº 7: feito! Parabéns!'],
            ],
          },
          nl: {
            t: 'Je dromen…',
            o: 'Vraag of die persoon een lijstje met dromen bijhoudt.',
            a: [
              ['Laat je in je hoofd zweven', 'Als wolkjes, heel licht.'],
              ['Schrijf je op in een lijst om af te vinken', 'Droom nr. 7: afgevinkt! Bravo!'],
            ],
          },
        }),
        c('reves_changent', 'ancrage', [['🌳', -60, 'racines'], ['🔄', 70, 'curiosite']], {
          fr: {
            t: 'Tes rêves changent…',
            o: 'Demande-lui quel rêve d’enfance elle ou il a toujours.',
            a: [
              ['Peu, j’ai les mêmes depuis l’enfance', 'Des rêves fidèles, comme de vieux amis.'],
              ['Tout le temps, j’en ai toujours de nouveaux', 'Une fabrique à rêves, wouah !'],
            ],
          },
          en: {
            t: 'Your dreams change…',
            o: 'Ask them which childhood dream they still have.',
            a: [
              ['Hardly, I’ve had the same ones since childhood', 'Loyal dreams, like old friends.'],
              ['All the time, I always have new ones', 'A dream factory, wow!'],
            ],
          },
          es: {
            t: 'Tus sueños cambian…',
            o: 'Pregúntale qué sueño de infancia conserva todavía.',
            a: [
              ['Poco, tengo los mismos desde pequeño o pequeña', 'Sueños fieles, como viejos amigos.'],
              ['Todo el rato, siempre tengo nuevos', '¡Una fábrica de sueños, guau!'],
            ],
          },
          pt: {
            t: 'Seus sonhos mudam…',
            o: 'Pergunte qual sonho de infância essa pessoa ainda tem.',
            a: [
              ['Pouco, tenho os mesmos desde a infância', 'Sonhos fiéis, como velhos amigos.'],
              ['O tempo todo, sempre tenho novos', 'Uma fábrica de sonhos, uau!'],
            ],
          },
          nl: {
            t: 'Je dromen veranderen…',
            o: 'Vraag welke kinderdroom die persoon nog steeds heeft.',
            a: [
              ['Weinig, ik heb dezelfde sinds mijn jeugd', 'Trouwe dromen, als oude vrienden.'],
              ['Constant, ik heb steeds nieuwe', 'Een dromenfabriek, wauw!'],
            ],
          },
        }),
        c('reves_prochain', 'elan', [['🚀', 70, 'projets'], ['☀️', -60, 'temps_libre']], {
          fr: {
            t: 'Le prochain rêve à réaliser, c’est…',
            o: 'Demande-lui quel est le prochain rêve qu’elle ou il aimerait réaliser.',
            a: [
              ['Un grand projet déjà en route', 'Moteurs allumés, décollage imminent !'],
              ['Un été entier sans contraintes', 'Tongs aux pieds, liberté totale.'],
            ],
          },
          en: {
            t: 'The next dream to make come true is…',
            o: 'Ask them which dream they’d like to make come true next.',
            a: [
              ['A big project already underway', 'Engines on, lift-off imminent!'],
              ['A whole summer with no obligations', 'Flip-flops on, total freedom.'],
            ],
          },
          es: {
            t: 'El próximo sueño por cumplir es…',
            o: 'Pregúntale cuál es el próximo sueño que le gustaría cumplir.',
            a: [
              ['Un gran proyecto ya en marcha', '¡Motores encendidos, despegue inminente!'],
              ['Un verano entero sin obligaciones', 'Chanclas puestas, libertad total.'],
            ],
          },
          pt: {
            t: 'O próximo sonho a realizar é…',
            o: 'Pergunte qual é o próximo sonho que essa pessoa gostaria de realizar.',
            a: [
              ['Um grande projeto já em andamento', 'Motores ligados, decolagem iminente!'],
              ['Um verão inteiro sem compromissos', 'Chinelo no pé, liberdade total.'],
            ],
          },
          nl: {
            t: 'De volgende droom om waar te maken is…',
            o: 'Vraag welke droom die persoon als volgende wil waarmaken.',
            a: [
              ['Een groot project dat al loopt', 'Motoren aan, lancering op komst!'],
              ['Een hele zomer zonder verplichtingen', 'Slippers aan, totale vrijheid.'],
            ],
          },
        }),
      ],
    },
  ],
};
