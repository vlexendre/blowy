// Univers « Tes souvenirs » : enfance, vacances, objets gardés, nostalgie joyeuse.
import { c, s, type SeedPack } from './pack';

export const pack: SeedPack = {
  id: 'souvenirs',
  icon: '🧸',
  title: {
    fr: ['Tes souvenirs', 'Enfance, vacances et trésors gardés.'],
    en: ['Your memories', 'Childhood, holidays and kept treasures.'],
    es: ['Tus recuerdos', 'Infancia, vacaciones y tesoros guardados.'],
    pt: ['Suas lembranças', 'Infância, férias e tesouros guardados.'],
    nl: ['Je herinneringen', 'Jeugd, vakanties en bewaarde schatten.'],
  },
  steps: [
    {
      id: 'souvenirs_1',
      title: { fr: 'Les jeux d’enfance', en: 'Childhood games', es: 'Los juegos de infancia', pt: 'As brincadeiras', nl: 'Kinderspelletjes' },
      questions: [
        c('souvenirs_jeu_prefere', 'rythme', [['🧩', -60, 'calme'], ['🏰', 0, null], ['⚽', 70, 'monde']], {
          fr: {
            t: 'Enfant, ton jeu préféré ?',
            o: 'Demande-lui à quoi elle ou il jouait le plus, enfant.',
            a: [
              ['Puzzles et briques dans ma chambre', 'Une pièce de plus… et voilà !'],
              ['Des histoires inventées avec des figurines', 'Et là, le dragon dit…'],
              ['Les jeux de ballon avec toute la rue', 'Passe ! Passe ! But !'],
            ],
          },
          en: {
            t: 'As a child, your favourite game?',
            o: 'Ask them what they played most as a child.',
            a: [
              ['Puzzles and building bricks in my room', 'One more piece… there!'],
              ['Made-up stories with little figures', 'And then the dragon says…'],
              ['Ball games with the whole street', 'Pass! Pass! Goal!'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, ¿tu juego favorito?',
            o: 'Pregúntale a qué jugaba más de pequeño o pequeña.',
            a: [
              ['Puzles y bloques en mi cuarto', 'Una pieza más… ¡listo!'],
              ['Historias inventadas con muñequitos', 'Y entonces el dragón dice…'],
              ['Juegos de pelota con toda la calle', '¡Pasa! ¡Pasa! ¡Gol!'],
            ],
          },
          pt: {
            t: 'Na infância, sua brincadeira favorita?',
            o: 'Pergunte do que essa pessoa mais brincava na infância.',
            a: [
              ['Quebra-cabeças e blocos no meu quarto', 'Mais uma peça… pronto!'],
              ['Histórias inventadas com bonequinhos', 'E aí o dragão diz…'],
              ['Bola com a rua inteira', 'Passa! Passa! Gol!'],
            ],
          },
          nl: {
            t: 'Je favoriete spel als kind?',
            o: 'Vraag wat die persoon als kind het meest speelde.',
            a: [
              ['Puzzels en blokken op mijn kamer', 'Nog één stukje… klaar!'],
              ['Verzonnen verhalen met poppetjes', 'En toen zei de draak…'],
              ['Balspelletjes met de hele straat', 'Speel over! Goal!'],
            ],
          },
        }),
        s('souvenirs_regles', 'cap', ['📜', 100, 'ordre'], ['🌀', -100, 'spontane'], {
          fr: { t: 'Enfant, dans les jeux, tu…', o: 'Demande-lui quel jeu elle ou il avait inventé, enfant.', a: [['Inventais des règles très précises', 'Article 12 : interdit de tricher.'], ['Changeais les règles en cours de route', 'Nouvelle règle : je gagne !']], m: 'Un peu des deux selon la partie.' },
          en: { t: 'As a child, in games, you…', o: 'Ask them about a game they made up as a child.', a: [['Invented very precise rules', 'Rule 12: no cheating.'], ['Changed the rules halfway through', 'New rule: I win!']], m: 'A bit of both, depending on the game.' },
          es: { t: 'De pequeño o pequeña, en los juegos, tú…', o: 'Pregúntale qué juego se inventó de pequeño o pequeña.', a: [['Inventabas reglas muy precisas', 'Artículo 12: prohibido hacer trampa.'], ['Cambiabas las reglas sobre la marcha', 'Nueva regla: ¡gano yo!']], m: 'Un poco de todo, según la partida.' },
          pt: { t: 'Na infância, nas brincadeiras, você…', o: 'Pergunte qual brincadeira essa pessoa inventou quando criança.', a: [['Inventava regras bem precisas', 'Artigo 12: proibido roubar.'], ['Mudava as regras no meio do jogo', 'Regra nova: eu ganho!']], m: 'Um pouco de cada, depende do jogo.' },
          nl: { t: 'Als kind, bij spelletjes…', o: 'Vraag welk spel die persoon als kind zelf bedacht.', a: [['Bedacht je heel precieze regels', 'Artikel 12: niet valsspelen.'], ['Veranderde je de regels halverwege', 'Nieuwe regel: ik win!']], m: 'Een beetje van allebei.' },
        }),
        c('souvenirs_role', 'elan', [['🎈', -60, 'temps_libre'], ['👑', 70, 'projets'], ['🃏', 0, 'humour']], {
          fr: {
            t: 'Dans la bande, enfant, ton rôle était…',
            o: 'Demande-lui quel rôle elle ou il avait dans sa bande d’enfance.',
            a: [
              ['Je suivais, tant qu’on s’amusait', 'L’important, c’était de rire.'],
              ['J’organisais tout, chef de bande', 'Oui, chef ! À vos ordres !'],
              ['Le clown de service', 'Encore une grimace, s’il te plaît !'],
            ],
          },
          en: {
            t: 'In your childhood gang, your role was…',
            o: 'Ask them what role they played in their childhood gang.',
            a: [
              ['I tagged along, as long as it was fun', 'Laughing was what mattered.'],
              ['I ran everything, gang leader', 'Yes, boss! At your command!'],
              ['The resident joker', 'Another funny face, please!'],
            ],
          },
          es: {
            t: 'En tu pandilla de infancia, tu papel era…',
            o: 'Pregúntale qué papel tenía en su pandilla de infancia.',
            a: [
              ['Seguía al resto, mientras nos divirtiéramos', 'Lo importante era reír.'],
              ['Lo organizaba todo, jefe de la pandilla', '¡Sí, jefe! ¡A sus órdenes!'],
              ['El payaso del grupo', '¡Otra mueca, porfa!'],
            ],
          },
          pt: {
            t: 'Na sua turma de infância, seu papel era…',
            o: 'Pergunte qual era o papel dessa pessoa na turma de infância.',
            a: [
              ['Eu seguia, desde que fosse divertido', 'O importante era rir.'],
              ['Eu organizava tudo, líder da turma', 'Sim, chefe! Às ordens!'],
              ['O palhaço da turma', 'Mais uma careta, por favor!'],
            ],
          },
          nl: {
            t: 'In je vriendengroepje als kind was jouw rol…',
            o: 'Vraag welke rol die persoon als kind in het groepje had.',
            a: [
              ['Ik liep mee, als het maar leuk was', 'Lachen, daar ging het om.'],
              ['Ik regelde alles, de leider', 'Ja, baas! Tot uw orders!'],
              ['De grappenmaker van dienst', 'Nog een gek gezicht, graag!'],
            ],
          },
        }),
        c('souvenirs_seul_groupe', 'foyer', [['👫', 70, 'famille'], ['🧸', -60, 'liberte']], {
          fr: {
            t: 'Enfant, tu jouais plutôt…',
            o: 'Demande-lui avec qui elle ou il jouait, enfant.',
            a: [
              ['Avec une ribambelle de copains', 'Plus on est de fous…'],
              ['Dans mon monde à moi', 'Un monde rien qu’à toi, magique.'],
            ],
          },
          en: {
            t: 'As a child, you mostly played…',
            o: 'Ask them who they used to play with as a child.',
            a: [
              ['With a whole bunch of friends', 'The more the merrier…'],
              ['In my own little world', 'A world all your own, magical.'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, jugabas más bien…',
            o: 'Pregúntale con quién jugaba de pequeño o pequeña.',
            a: [
              ['Con un montón de amigos', 'Cuantos más, mejor…'],
              ['En mi propio mundo', 'Un mundo solo tuyo, mágico.'],
            ],
          },
          pt: {
            t: 'Na infância, você brincava mais…',
            o: 'Pergunte com quem essa pessoa brincava na infância.',
            a: [
              ['Com uma penca de amigos', 'Quanto mais, melhor…'],
              ['No meu mundinho', 'Um mundo só seu, mágico.'],
            ],
          },
          nl: {
            t: 'Als kind speelde je meestal…',
            o: 'Vraag met wie die persoon als kind speelde.',
            a: [
              ['Met een hele zwerm vriendjes', 'Hoe meer zielen…'],
              ['In mijn eigen wereldje', 'Een wereld helemaal van jou, magisch.'],
            ],
          },
        }),
        c('souvenirs_jeu_nouveau', 'ancrage', [['🪀', -60, 'racines'], ['🙋', 70, 'curiosite']], {
          fr: {
            t: 'Un nouveau jeu débarquait dans la cour. Tu…',
            o: 'Demande-lui quel était le jeu à la mode dans sa cour d’école.',
            a: [
              ['Restais fidèle à ton jeu favori', 'Les classiques ne meurent jamais.'],
              ['Étais parmi les premiers à essayer', 'Montre-moi, montre-moi !'],
            ],
          },
          en: {
            t: 'A new game hit the playground. You…',
            o: 'Ask them which game was all the rage in their playground.',
            a: [
              ['Stayed loyal to your favourite game', 'Classics never go out of style.'],
              ['Were among the first to try it', 'Show me, show me!'],
            ],
          },
          es: {
            t: 'Llegaba un juego nuevo al patio. Tú…',
            o: 'Pregúntale qué juego estaba de moda en su patio del cole.',
            a: [
              ['Seguías fiel a tu juego favorito', 'Los clásicos nunca pasan.'],
              ['Eras de los primeros en probarlo', '¡Enséñamelo, enséñamelo!'],
            ],
          },
          pt: {
            t: 'Uma brincadeira nova chegava no recreio. Você…',
            o: 'Pergunte qual brincadeira estava na moda no recreio dessa pessoa.',
            a: [
              ['Continuava fiel à sua favorita', 'Clássico é clássico.'],
              ['Era dos primeiros a experimentar', 'Me mostra, me mostra!'],
            ],
          },
          nl: {
            t: 'Er kwam een nieuw spel op het schoolplein. Je…',
            o: 'Vraag welk spel er populair was op het schoolplein van die persoon.',
            a: [
              ['Bleef trouw aan je favoriete spel', 'Klassiekers gaan nooit vervelen.'],
              ['Was een van de eersten om het te proberen', 'Laat zien, laat zien!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_2',
      title: { fr: 'Les étés d’avant', en: 'Summers past', es: 'Los veranos de antes', pt: 'Os verões de antes', nl: 'Zomers van vroeger' },
      questions: [
        s('souvenirs_vacances_lieu', 'ancrage', ['🏡', -100, 'racines'], ['🗺️', 100, 'voyage'], {
          fr: { t: 'Tes vacances d’enfance, c’était…', o: 'Demande-lui où elle ou il passait ses vacances, enfant.', a: [['Le même endroit chaque été', 'Ton petit coin de paradis.'], ['Un endroit différent chaque année', 'Un nouveau tampon sur le passeport !']], m: 'Un mélange des deux.' },
          en: { t: 'Your childhood holidays were…', o: 'Ask them where they spent their holidays as a child.', a: [['The same place every summer', 'Your own little slice of paradise.'], ['Somewhere different every year', 'A new stamp in the passport!']], m: 'A mix of both.' },
          es: { t: 'Tus vacaciones de infancia eran…', o: 'Pregúntale dónde pasaba las vacaciones de pequeño o pequeña.', a: [['El mismo sitio cada verano', 'Tu rinconcito de paraíso.'], ['Un sitio distinto cada año', '¡Un sello nuevo en el pasaporte!']], m: 'Una mezcla de las dos cosas.' },
          pt: { t: 'Suas férias de infância eram…', o: 'Pergunte onde essa pessoa passava as férias na infância.', a: [['O mesmo lugar todo verão', 'Seu cantinho do paraíso.'], ['Um lugar diferente a cada ano', 'Um carimbo novo no passaporte!']], m: 'Uma mistura dos dois.' },
          nl: { t: 'Je vakanties als kind waren…', o: 'Vraag waar die persoon als kind op vakantie ging.', a: [['Elke zomer dezelfde plek', 'Je eigen stukje paradijs.'], ['Elk jaar ergens anders', 'Een nieuw stempel in het paspoort!']], m: 'Een mix van allebei.' },
        }),
        c('souvenirs_journee_ete', 'rythme', [['📚', -60, 'calme'], ['🎣', -10, 'nature'], ['🏖️', 60, 'dehors']], {
          fr: {
            t: 'Ta journée de vacances idéale, enfant ?',
            o: 'Demande-lui à quoi ressemblait une journée d’été parfaite dans son enfance.',
            a: [
              ['Lire à l’ombre d’un arbre', 'Chut, j’en suis au chapitre 3.'],
              ['Chercher des têtards dans la rivière', 'Regarde, il a des petites pattes !'],
              ['La plage du matin au soir avec plein d’enfants', 'Château de sable géant en vue !'],
            ],
          },
          en: {
            t: 'Your perfect holiday day as a child?',
            o: 'Ask them what a perfect summer day looked like when they were little.',
            a: [
              ['Reading in the shade of a tree', 'Shh, I’m on chapter 3.'],
              ['Looking for tadpoles in the river', 'Look, it’s got tiny legs!'],
              ['The beach all day with loads of kids', 'Giant sandcastle ahead!'],
            ],
          },
          es: {
            t: '¿Tu día de vacaciones ideal de pequeño o pequeña?',
            o: 'Pregúntale cómo era un día de verano perfecto en su infancia.',
            a: [
              ['Leer a la sombra de un árbol', 'Chis, voy por el capítulo 3.'],
              ['Buscar renacuajos en el río', '¡Mira, tiene patitas!'],
              ['Playa todo el día con muchos niños', '¡Castillo de arena gigante a la vista!'],
            ],
          },
          pt: {
            t: 'Seu dia de férias ideal na infância?',
            o: 'Pergunte como era um dia de verão perfeito na infância dessa pessoa.',
            a: [
              ['Ler na sombra de uma árvore', 'Psiu, estou no capítulo 3.'],
              ['Procurar girinos no rio', 'Olha, ele tem perninhas!'],
              ['Praia o dia inteiro com um monte de criança', 'Castelo de areia gigante à vista!'],
            ],
          },
          nl: {
            t: 'Je ideale vakantiedag als kind?',
            o: 'Vraag hoe een perfecte zomerdag eruitzag toen die persoon klein was.',
            a: [
              ['Lezen in de schaduw van een boom', 'Sst, ik ben bij hoofdstuk 3.'],
              ['Kikkervisjes zoeken in de rivier', 'Kijk, hij heeft pootjes!'],
              ['De hele dag strand met veel kinderen', 'Reuzenzandkasteel in zicht!'],
            ],
          },
        }),
        c('souvenirs_colo', 'foyer', [['🏕️', 70, 'accueil'], ['🦋', -50, 'liberte']], {
          fr: {
            t: 'Les colos et camps de vacances, pour toi c’était…',
            o: 'Demande-lui un souvenir drôle de colo ou de camp de vacances.',
            a: [
              ['Le paradis des copains', 'Feu de camp et fous rires !'],
              ['Pas mon truc, je préférais l’été à ma façon', 'Ton été, tes règles.'],
            ],
          },
          en: {
            t: 'Summer camps, for you, were…',
            o: 'Ask them for a funny memory from summer camp.',
            a: [
              ['Friend paradise', 'Campfires and fits of giggles!'],
              ['Not my thing, I liked summer my own way', 'Your summer, your rules.'],
            ],
          },
          es: {
            t: 'Los campamentos de verano, para ti eran…',
            o: 'Pregúntale por un recuerdo divertido de campamento.',
            a: [
              ['El paraíso de los amigos', '¡Fogatas y ataques de risa!'],
              ['No era lo mío, prefería el verano a mi aire', 'Tu verano, tus reglas.'],
            ],
          },
          pt: {
            t: 'Os acampamentos de férias, para você eram…',
            o: 'Pergunte uma lembrança engraçada de acampamento de férias.',
            a: [
              ['O paraíso dos amigos', 'Fogueira e crises de riso!'],
              ['Não era comigo, preferia o verão do meu jeito', 'Seu verão, suas regras.'],
            ],
          },
          nl: {
            t: 'Zomerkampen waren voor jou…',
            o: 'Vraag naar een grappige herinnering aan een zomerkamp.',
            a: [
              ['Het paradijs van de vriendschap', 'Kampvuur en slappe lach!'],
              ['Niks voor mij, ik deed de zomer op mijn manier', 'Jouw zomer, jouw regels.'],
            ],
          },
        }),
        c('souvenirs_vacances_carte', 'cap', [['🦋', -60, 'spontane'], ['🗺️', 60, 'plan']], {
          fr: {
            t: 'En vacances, enfant, tu…',
            o: 'Demande-lui quel genre d’enfant elle ou il était en vacances.',
            a: [
              ['Partais à l’aventure au bout du jardin', 'Expédition au fond du jardin !'],
              ['Suivais l’itinéraire sur la carte', 'Copilote officiel, bravo.'],
            ],
          },
          en: {
            t: 'On holiday as a child, you…',
            o: 'Ask them what kind of child they were on holiday.',
            a: [
              ['Set off on adventures at the end of the garden', 'Expedition to the bottom of the garden!'],
              ['Followed the route on the map', 'Official co-pilot, bravo.'],
            ],
          },
          es: {
            t: 'En vacaciones, de pequeño o pequeña, tú…',
            o: 'Pregúntale qué tipo de niño o niña era en vacaciones.',
            a: [
              ['Te ibas de aventura al fondo del jardín', '¡Expedición al fondo del jardín!'],
              ['Seguías la ruta en el mapa', 'Copiloto oficial, bravo.'],
            ],
          },
          pt: {
            t: 'Nas férias, quando criança, você…',
            o: 'Pergunte que tipo de criança essa pessoa era nas férias.',
            a: [
              ['Saía em aventuras no fundo do quintal', 'Expedição ao fundo do quintal!'],
              ['Acompanhava o roteiro no mapa', 'Copiloto oficial, parabéns.'],
            ],
          },
          nl: {
            t: 'Op vakantie als kind…',
            o: 'Vraag wat voor kind die persoon op vakantie was.',
            a: [
              ['Ging je op avontuur achter in de tuin', 'Expeditie naar achter in de tuin!'],
              ['Volgde je de route op de kaart', 'Officiële copiloot, bravo.'],
            ],
          },
        }),
        c('souvenirs_rapporter', 'elan', [['🐚', -50, 'temps_libre'], ['📔', 60, 'projets'], ['🎨', 20, null]], {
          fr: {
            t: 'De tes vacances, enfant, tu rapportais…',
            o: 'Demande-lui quel trésor de vacances elle ou il rapportait.',
            a: [
              ['Des coquillages et du sable partout', 'Il y en a encore dans tes chaussures ?'],
              ['Un carnet de voyage bien rempli', 'Je peux lire la page 7 ?'],
              ['Des dessins de tout ce que j’avais vu', 'On les accroche au mur ?'],
            ],
          },
          en: {
            t: 'From your childhood holidays, you brought back…',
            o: 'Ask them what holiday treasure they used to bring back.',
            a: [
              ['Shells, and sand everywhere', 'Is there still some in your shoes?'],
              ['A well-filled travel journal', 'Can I read page 7?'],
              ['Drawings of everything I’d seen', 'Shall we pin them on the wall?'],
            ],
          },
          es: {
            t: 'De tus vacaciones de pequeño o pequeña, traías…',
            o: 'Pregúntale qué tesoro de vacaciones solía traer.',
            a: [
              ['Conchas, y arena por todas partes', '¿Aún te queda en los zapatos?'],
              ['Un diario de viaje bien lleno', '¿Puedo leer la página 7?'],
              ['Dibujos de todo lo que había visto', '¿Los colgamos en la pared?'],
            ],
          },
          pt: {
            t: 'Das férias de infância, você trazia…',
            o: 'Pergunte que tesouro de férias essa pessoa trazia.',
            a: [
              ['Conchinhas e areia por todo lado', 'Ainda tem no seu sapato?'],
              ['Um diário de viagem bem cheio', 'Posso ler a página 7?'],
              ['Desenhos de tudo que eu tinha visto', 'Vamos pendurar na parede?'],
            ],
          },
          nl: {
            t: 'Van vakantie nam je als kind mee…',
            o: 'Vraag welke vakantieschat die persoon vroeger meenam.',
            a: [
              ['Schelpen, en overal zand', 'Zit het nog in je schoenen?'],
              ['Een goedgevuld reisdagboek', 'Mag ik pagina 7 lezen?'],
              ['Tekeningen van alles wat ik zag', 'Hangen we ze aan de muur?'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_3',
      title: { fr: 'Les trésors gardés', en: 'Kept treasures', es: 'Los tesoros guardados', pt: 'Os tesouros guardados', nl: 'Bewaarde schatten' },
      questions: [
        c('souvenirs_boite', 'ancrage', [['📦', -70, 'racines'], ['🧸', -20, null], ['🎒', 50, 'curiosite']], {
          fr: {
            t: 'Tu as gardé une boîte à trésors d’enfance ?',
            o: 'Demande-lui ce qu’il y a dans sa boîte à souvenirs, si elle ou il en a une.',
            a: [
              ['Oui, et je l’ouvre de temps en temps', 'On l’ouvre ensemble ? Dis oui !'],
              ['Juste une peluche, la plus fidèle', 'Je lui fais un câlin de ta part.'],
              ['Non, je fais de la place pour le neuf', 'Place aux trésors de demain !'],
            ],
          },
          en: {
            t: 'Have you kept a childhood treasure box?',
            o: 'Ask them what’s in their memory box, if they have one.',
            a: [
              ['Yes, and I open it now and then', 'Shall we open it together? Say yes!'],
              ['Just a soft toy, the most loyal one', 'I’ll give it a hug from you.'],
              ['No, I make room for new things', 'Make way for tomorrow’s treasures!'],
            ],
          },
          es: {
            t: '¿Guardas una caja de tesoros de la infancia?',
            o: 'Pregúntale qué hay en su caja de recuerdos, si tiene una.',
            a: [
              ['Sí, y la abro de vez en cuando', '¿La abrimos juntos? ¡Di que sí!'],
              ['Solo un peluche, el más fiel', 'Le doy un abrazo de tu parte.'],
              ['No, hago sitio para lo nuevo', '¡Paso a los tesoros de mañana!'],
            ],
          },
          pt: {
            t: 'Você guardou uma caixa de tesouros da infância?',
            o: 'Pergunte o que tem na caixa de lembranças dessa pessoa, se tiver uma.',
            a: [
              ['Sim, e abro de vez em quando', 'Vamos abrir juntos? Diz que sim!'],
              ['Só um bichinho de pelúcia, o mais fiel', 'Dou um abraço nele por você.'],
              ['Não, abro espaço para o novo', 'Abram alas para os tesouros de amanhã!'],
            ],
          },
          nl: {
            t: 'Heb je een schatkistje uit je jeugd bewaard?',
            o: 'Vraag wat er in het herinneringsdoosje van die persoon zit, als die er een heeft.',
            a: [
              ['Ja, en ik maak het af en toe open', 'Doen we het samen open? Zeg ja!'],
              ['Alleen een knuffel, de trouwste', 'Ik geef hem een knuffel van jou.'],
              ['Nee, ik maak plaats voor nieuwe dingen', 'Plaats voor de schatten van morgen!'],
            ],
          },
        }),
        s('souvenirs_classer', 'cap', ['🗃️', 100, 'ordre'], ['🎒', -100, 'spontane'], {
          fr: { t: 'Tes souvenirs (photos, tickets, cartes postales) sont…', o: 'Demande-lui où elle ou il range ses petits souvenirs.', a: [['Classés par date', 'Un archiviste de génie !'], ['Un peu partout, au hasard', 'Chasse aux trésors dans chaque tiroir.']], m: 'Tous dans une grande boîte.' },
          en: { t: 'Your keepsakes (photos, tickets, postcards) are…', o: 'Ask them where they keep their little keepsakes.', a: [['Filed by date', 'An archivist genius!'], ['Scattered about, at random', 'A treasure hunt in every drawer.']], m: 'All in one big box.' },
          es: { t: 'Tus recuerdos (fotos, entradas, postales) están…', o: 'Pregúntale dónde guarda sus pequeños recuerdos.', a: [['Ordenados por fecha', '¡Un archivero genial!'], ['Por todas partes, al azar', 'Búsqueda del tesoro en cada cajón.']], m: 'Todos en una caja grande.' },
          pt: { t: 'Suas lembranças (fotos, ingressos, cartões-postais) estão…', o: 'Pergunte onde essa pessoa guarda suas lembrancinhas.', a: [['Organizadas por data', 'Um arquivista genial!'], ['Espalhadas, ao acaso', 'Caça ao tesouro em cada gaveta.']], m: 'Todas numa caixa grande.' },
          nl: { t: 'Je aandenkens (foto’s, kaartjes, ansichtkaarten) zijn…', o: 'Vraag waar die persoon kleine aandenkens bewaart.', a: [['Op datum gesorteerd', 'Een archiefgenie!'], ['Overal, willekeurig', 'Schatzoeken in elke la.']], m: 'Allemaal in één grote doos.' },
        }),
        c('souvenirs_grenier', 'foyer', [['📲', 60, 'famille'], ['🕰️', -50, 'liberte']], {
          fr: {
            t: 'Tu retrouves un vieux jouet au fond d’un placard. Tu…',
            o: 'Demande-lui quel jouet d’enfance elle ou il aimerait retrouver.',
            a: [
              ['Envoies une photo à celles et ceux qui l’ont connu', 'Tout le monde va rire, c’est sûr.'],
              ['Prends un moment rien que pour toi avec lui', 'Un petit voyage dans le temps.'],
            ],
          },
          en: {
            t: 'You find an old toy at the back of a cupboard. You…',
            o: 'Ask them which childhood toy they’d love to find again.',
            a: [
              ['Send a photo to everyone who remembers it', 'Everyone’s going to laugh, for sure.'],
              ['Take a moment just for you with it', 'A little trip back in time.'],
            ],
          },
          es: {
            t: 'Encuentras un juguete antiguo al fondo de un armario. Tú…',
            o: 'Pregúntale qué juguete de infancia le gustaría recuperar.',
            a: [
              ['Mandas una foto a quienes lo conocieron', 'Todo el mundo se va a reír, seguro.'],
              ['Te tomas un momento solo para ti con él', 'Un pequeño viaje en el tiempo.'],
            ],
          },
          pt: {
            t: 'Você acha um brinquedo antigo no fundo do armário. Você…',
            o: 'Pergunte qual brinquedo de infância essa pessoa adoraria reencontrar.',
            a: [
              ['Manda uma foto para quem conheceu o brinquedo', 'Todo mundo vai rir, certeza.'],
              ['Tira um momento só seu com ele', 'Uma viagenzinha no tempo.'],
            ],
          },
          nl: {
            t: 'Je vindt een oud speeltje achter in een kast. Je…',
            o: 'Vraag welk speelgoed uit de jeugd die persoon graag zou terugvinden.',
            a: [
              ['Stuurt een foto naar iedereen die het nog kent', 'Iedereen gaat lachen, zeker weten.'],
              ['Neemt er even rustig de tijd voor', 'Een kleine reis terug in de tijd.'],
            ],
          },
        }),
        c('souvenirs_collection', 'elan', [['🏆', 60, 'projets'], ['🍂', -50, 'temps_libre']], {
          fr: {
            t: 'Enfant, tu collectionnais…',
            o: 'Demande-lui ce qu’elle ou il collectionnait, enfant.',
            a: [
              ['Des cartes, avec l’objectif de toutes les avoir', 'Plus qu’une et l’album est complet !'],
              ['Des cailloux et des feuilles, au fil des balades', 'Celui-là est en forme de cœur !'],
            ],
          },
          en: {
            t: 'As a child, you collected…',
            o: 'Ask them what they collected as a child.',
            a: [
              ['Cards, aiming to get every single one', 'Just one left and the album’s full!'],
              ['Pebbles and leaves, from my walks', 'That one’s shaped like a heart!'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, coleccionabas…',
            o: 'Pregúntale qué coleccionaba de pequeño o pequeña.',
            a: [
              ['Cromos, con el objetivo de tenerlos todos', '¡Solo falta uno y el álbum está completo!'],
              ['Piedras y hojas de los paseos', '¡Esa tiene forma de corazón!'],
            ],
          },
          pt: {
            t: 'Na infância, você colecionava…',
            o: 'Pergunte o que essa pessoa colecionava na infância.',
            a: [
              ['Figurinhas, com a meta de completar tudo', 'Falta só uma e o álbum fica completo!'],
              ['Pedrinhas e folhas dos passeios', 'Essa tem formato de coração!'],
            ],
          },
          nl: {
            t: 'Als kind verzamelde je…',
            o: 'Vraag wat die persoon als kind verzamelde.',
            a: [
              ['Plaatjes, met het doel ze allemaal te hebben', 'Nog eentje en het album is vol!'],
              ['Steentjes en blaadjes van wandelingen', 'Die heeft de vorm van een hart!'],
            ],
          },
        }),
        c('souvenirs_vide_grenier', 'rythme', [['📦', -60, 'calme'], ['🏷️', 70, 'monde']], {
          fr: {
            t: 'Échanger tes vieux jouets dans une brocante de quartier ?',
            o: 'Demande-lui ce qu’elle ou il pense des brocantes de quartier.',
            a: [
              ['Non, ils restent au calme dans leur carton', 'Chut, ils font la sieste.'],
              ['Oui, j’adore l’ambiance et le monde', 'Je tiens le stand avec toi !'],
            ],
          },
          en: {
            t: 'Swap your old toys at a neighbourhood car boot sale?',
            o: 'Ask them what they think of neighbourhood car boot sales.',
            a: [
              ['No, they stay snug in their box', 'Shh, they’re napping.'],
              ['Yes, I love the buzz and the crowds', 'I’ll help you run the stall!'],
            ],
          },
          es: {
            t: '¿Cambiar tus juguetes antiguos en un mercadillo del barrio?',
            o: 'Pregúntale qué le parecen los mercadillos de barrio.',
            a: [
              ['No, se quedan tranquilos en su caja', 'Chis, están durmiendo la siesta.'],
              ['Sí, me encanta el ambiente y la gente', '¡Te ayudo con el puesto!'],
            ],
          },
          pt: {
            t: 'Trocar seus brinquedos antigos num bazar do bairro?',
            o: 'Pergunte o que essa pessoa acha dos bazares de bairro.',
            a: [
              ['Não, eles ficam quietinhos na caixa', 'Psiu, estão tirando um cochilo.'],
              ['Sim, adoro o clima e o movimento', 'Eu cuido da barraca com você!'],
            ],
          },
          nl: {
            t: 'Je oude speelgoed ruilen op een buurtrommelmarkt?',
            o: 'Vraag wat die persoon van rommelmarkten in de buurt vindt.',
            a: [
              ['Nee, het blijft rustig in de doos', 'Sst, ze doen een dutje.'],
              ['Ja, ik hou van de sfeer en de drukte', 'Ik sta samen met jou in het kraampje!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_4',
      title: { fr: 'Les goûts d’enfance', en: 'Childhood flavours', es: 'Sabores de infancia', pt: 'Sabores da infância', nl: 'Smaken van vroeger' },
      questions: [
        c('souvenirs_gouter', 'ancrage', [['🍡', 60, 'curiosite'], ['🍫', -70, 'racines']], {
          fr: {
            t: 'Ton goûter d’enfance préféré, aujourd’hui…',
            o: 'Demande-lui quel était son goûter préféré, enfant.',
            a: [
              ['J’en ai découvert mille autres depuis', 'Un explorateur de la gourmandise !'],
              ['J’en mange encore, exactement pareil', 'Certaines choses ne changent jamais.'],
            ],
          },
          en: {
            t: 'Your favourite childhood snack, these days…',
            o: 'Ask them what their favourite after-school snack was.',
            a: [
              ['I’ve discovered a thousand others since', 'An explorer of treats!'],
              ['I still eat it, exactly the same', 'Some things never change.'],
            ],
          },
          es: {
            t: 'Tu merienda favorita de la infancia, hoy en día…',
            o: 'Pregúntale cuál era su merienda favorita de pequeño o pequeña.',
            a: [
              ['He descubierto mil más desde entonces', '¡Un explorador del dulce!'],
              ['La sigo comiendo, igualita', 'Hay cosas que nunca cambian.'],
            ],
          },
          pt: {
            t: 'Seu lanche favorito da infância, hoje em dia…',
            o: 'Pergunte qual era o lanche favorito dessa pessoa na infância.',
            a: [
              ['Já descobri mil outros desde então', 'Um explorador de gostosuras!'],
              ['Ainda como, igualzinho', 'Tem coisa que nunca muda.'],
            ],
          },
          nl: {
            t: 'Je favoriete tussendoortje van vroeger, nu…',
            o: 'Vraag wat het favoriete vieruurtje van die persoon was.',
            a: [
              ['Ik heb er sindsdien duizend andere ontdekt', 'Een ontdekkingsreiziger in lekkernijen!'],
              ['Eet ik nog steeds, precies hetzelfde', 'Sommige dingen veranderen nooit.'],
            ],
          },
        }),
        s('souvenirs_plat_enfance', 'foyer', ['🍳', -100, 'liberte'], ['🍲', 100, 'famille'], {
          fr: { t: 'Le plat de ton enfance, tu le prépares…', o: 'Demande-lui quel plat lui rappelle son enfance.', a: [['À ma façon, rien que pour moi', 'Un festin pour une personne, royal.'], ['Pour une grande tablée', 'Je mets les assiettes, combien on est ?']], m: 'Pour une ou deux personnes chères.' },
          en: { t: 'The dish from your childhood, you make it…', o: 'Ask them which dish reminds them of childhood.', a: [['My way, just for me', 'A feast for one, fit for royalty.'], ['For a big table of people', 'I’ll lay the plates, how many of us?']], m: 'For one or two dear people.' },
          es: { t: 'El plato de tu infancia, lo preparas…', o: 'Pregúntale qué plato le recuerda a su infancia.', a: [['A mi manera, solo para mí', 'Un festín para uno, de lujo.'], ['Para una mesa grande', 'Pongo los platos, ¿cuántos somos?']], m: 'Para una o dos personas queridas.' },
          pt: { t: 'O prato da sua infância, você prepara…', o: 'Pergunte qual prato lembra a infância dessa pessoa.', a: [['Do meu jeito, só para mim', 'Um banquete para um, de rei.'], ['Para uma mesa cheia', 'Ponho os pratos, quantos somos?']], m: 'Para uma ou duas pessoas queridas.' },
          nl: { t: 'Het gerecht uit je jeugd maak je…', o: 'Vraag welk gerecht die persoon aan vroeger doet denken.', a: [['Op mijn manier, alleen voor mij', 'Een feestmaal voor één, koninklijk.'], ['Voor een lange tafel vol mensen', 'Ik zet de borden neer, met hoeveel zijn we?']], m: 'Voor een of twee dierbaren.' },
        }),
        c('souvenirs_recette', 'cap', [['👃', -60, 'spontane'], ['📒', 70, 'plan']], {
          fr: {
            t: 'La recette d’un plat de ton enfance, tu…',
            o: 'Demande-lui de quelle recette d’enfance elle ou il se souvient.',
            a: [
              ['La refais au feeling, de mémoire', 'Une pincée de ci, un soupçon de ça.'],
              ['L’as notée au gramme près', 'Le livre de recettes officiel !'],
            ],
          },
          en: {
            t: 'A recipe from your childhood, you…',
            o: 'Ask them which childhood recipe they remember.',
            a: [
              ['Make it by feel, from memory', 'A pinch of this, a dash of that.'],
              ['Have written it down to the gram', 'The official recipe book!'],
            ],
          },
          es: {
            t: 'La receta de un plato de tu infancia, tú…',
            o: 'Pregúntale de qué receta de su infancia se acuerda.',
            a: [
              ['La haces a ojo, de memoria', 'Una pizca de esto, un toque de aquello.'],
              ['La tienes apuntada al gramo', '¡El recetario oficial!'],
            ],
          },
          pt: {
            t: 'A receita de um prato da sua infância, você…',
            o: 'Pergunte de qual receita da infância essa pessoa se lembra.',
            a: [
              ['Faz no olho, de memória', 'Uma pitada disso, um toque daquilo.'],
              ['Tem anotada no grama', 'O caderno de receitas oficial!'],
            ],
          },
          nl: {
            t: 'Het recept van een gerecht uit je jeugd…',
            o: 'Vraag welk recept uit de jeugd die persoon nog kent.',
            a: [
              ['Maak je op gevoel, uit je hoofd', 'Een snufje dit, een scheutje dat.'],
              ['Heb je tot op de gram opgeschreven', 'Het officiële receptenboek!'],
            ],
          },
        }),
        c('souvenirs_gouter_lieu', 'rythme', [['🎪', 70, 'fete'], ['🧺', -50, 'calme'], ['🌳', 10, 'dehors']], {
          fr: {
            t: 'Ton meilleur souvenir de goûter, c’était…',
            o: 'Demande-lui où elle ou il prenait ses meilleurs goûters.',
            a: [
              ['Une crêpe à la fête foraine', 'Avec du sucre partout sur le nez !'],
              ['Une tartine tranquille à la maison', 'Le chocolat qui fond, miam.'],
              ['Un fruit cueilli dans un jardin', 'Croc ! Le plus juteux du monde.'],
            ],
          },
          en: {
            t: 'Your best snack-time memory was…',
            o: 'Ask them where they had their best childhood snacks.',
            a: [
              ['A pancake at the funfair', 'With sugar all over your nose!'],
              ['A quiet slice of bread and jam at home', 'Melting chocolate, yum.'],
              ['A fruit picked straight from a garden', 'Crunch! The juiciest in the world.'],
            ],
          },
          es: {
            t: 'Tu mejor recuerdo de merienda era…',
            o: 'Pregúntale dónde tomaba sus mejores meriendas.',
            a: [
              ['Un crepe en la feria', '¡Con azúcar hasta en la nariz!'],
              ['Una tostada tranquila en casa', 'El chocolate que se derrite, ñam.'],
              ['Una fruta recién cogida del huerto', '¡Ñac! La más jugosa del mundo.'],
            ],
          },
          pt: {
            t: 'Sua melhor lembrança de lanche era…',
            o: 'Pergunte onde essa pessoa fazia os melhores lanches.',
            a: [
              ['Um crepe no parque de diversões', 'Com açúcar até no nariz!'],
              ['Um pão com manteiga tranquilo em casa', 'O chocolate derretendo, hmm.'],
              ['Uma fruta colhida no quintal', 'Nhac! A mais suculenta do mundo.'],
            ],
          },
          nl: {
            t: 'Je mooiste vieruurtjesherinnering was…',
            o: 'Vraag waar die persoon de lekkerste tussendoortjes at.',
            a: [
              ['Een pannenkoek op de kermis', 'Met poedersuiker op je neus!'],
              ['Een rustige boterham thuis', 'Smeltende chocolade, mmm.'],
              ['Fruit vers uit een tuin geplukt', 'Knap! Het sappigste van de wereld.'],
            ],
          },
        }),
        c('souvenirs_cuisine_enfant', 'elan', [['🥄', -50, 'temps_libre'], ['🧁', 60, 'projets']], {
          fr: {
            t: 'Enfant, en cuisine, tu…',
            o: 'Demande-lui quelle était sa spécialité en cuisine, enfant.',
            a: [
              ['Léchais surtout la cuillère', 'Le meilleur poste de la cuisine.'],
              ['Voulais tout faire toi-même', 'Petit chef en action !'],
            ],
          },
          en: {
            t: 'As a child, in the kitchen, you…',
            o: 'Ask them what their kitchen speciality was as a child.',
            a: [
              ['Mostly licked the spoon', 'The best job in the kitchen.'],
              ['Wanted to do everything yourself', 'Little chef in action!'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, en la cocina, tú…',
            o: 'Pregúntale cuál era su especialidad en la cocina de pequeño o pequeña.',
            a: [
              ['Sobre todo lamías la cuchara', 'El mejor puesto de la cocina.'],
              ['Querías hacerlo todo tú', '¡Pequeño chef en acción!'],
            ],
          },
          pt: {
            t: 'Na infância, na cozinha, você…',
            o: 'Pergunte qual era a especialidade dessa pessoa na cozinha quando criança.',
            a: [
              ['Mais lambia a colher', 'O melhor cargo da cozinha.'],
              ['Queria fazer tudo por conta própria', 'Pequeno chef em ação!'],
            ],
          },
          nl: {
            t: 'Als kind, in de keuken…',
            o: 'Vraag wat de keukenspecialiteit van die persoon als kind was.',
            a: [
              ['Likte je vooral de lepel af', 'De beste functie in de keuken.'],
              ['Wilde je alles zelf doen', 'Kleine chef in actie!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_5',
      title: { fr: 'Les années d’école', en: 'School days', es: 'Los años de cole', pt: 'Os tempos de escola', nl: 'De schooltijd' },
      questions: [
        c('souvenirs_cartable', 'cap', [['📐', 70, 'ordre'], ['✏️', 10, null], ['🌪️', -60, 'spontane']], {
          fr: {
            t: 'Ton cartable, enfant, c’était…',
            o: 'Demande-lui à quoi ressemblait son cartable, enfant.',
            a: [
              ['Rangé au millimètre', 'Même les crayons étaient alignés !'],
              ['Rangé… le jour de la rentrée', 'Un jour, c’est déjà ça.'],
              ['Un joyeux bazar', 'Tiens, une tartine de l’an dernier !'],
            ],
          },
          en: {
            t: 'Your school bag, as a child, was…',
            o: 'Ask them what their school bag looked like.',
            a: [
              ['Perfectly organised', 'Even the pencils were lined up!'],
              ['Tidy… on the first day of term', 'One day is better than none.'],
              ['A cheerful mess', 'Ooh, a sandwich from last year!'],
            ],
          },
          es: {
            t: 'Tu mochila del cole era…',
            o: 'Pregúntale cómo era su mochila del cole.',
            a: [
              ['Ordenada al milímetro', '¡Hasta los lápices en fila!'],
              ['Ordenada… el primer día de clase', 'Un día ya es algo.'],
              ['Un alegre desastre', '¡Anda, un bocadillo del año pasado!'],
            ],
          },
          pt: {
            t: 'Sua mochila da escola era…',
            o: 'Pergunte como era a mochila da escola dessa pessoa.',
            a: [
              ['Arrumada nos mínimos detalhes', 'Até os lápis em fila!'],
              ['Arrumada… no primeiro dia de aula', 'Um dia já é alguma coisa.'],
              ['Uma bagunça alegre', 'Olha, um sanduíche do ano passado!'],
            ],
          },
          nl: {
            t: 'Je schooltas als kind was…',
            o: 'Vraag hoe de schooltas van die persoon eruitzag.',
            a: [
              ['Tot op de millimeter opgeruimd', 'Zelfs de potloden op een rij!'],
              ['Opgeruimd… op de eerste schooldag', 'Eén dag is ook wat.'],
              ['Een vrolijke chaos', 'Hé, een boterham van vorig jaar!'],
            ],
          },
        }),
        s('souvenirs_recre', 'rythme', ['📖', -100, 'calme'], ['🏃', 100, 'monde'], {
          fr: { t: 'À la récré, tu étais…', o: 'Demande-lui ce qu’elle ou il faisait à la récré.', a: [['Dans un coin calme, avec une histoire', 'Ton coin lecture secret.'], ['Au cœur de toutes les parties', 'Chat perché ! Tu es le chat !']], m: 'Un peu partout, selon les jours.' },
          en: { t: 'At break time, you were…', o: 'Ask them what they did at break time.', a: [['In a quiet corner, with a story', 'Your secret reading corner.'], ['In the thick of every game', 'Tag! You’re it!']], m: 'All over, depending on the day.' },
          es: { t: 'En el recreo, estabas…', o: 'Pregúntale qué hacía en el recreo.', a: [['En un rincón tranquilo, con un cuento', 'Tu rincón secreto de lectura.'], ['En el centro de todos los juegos', '¡Pillado! ¡Te toca!']], m: 'Un poco en todas partes, según el día.' },
          pt: { t: 'No recreio, você estava…', o: 'Pergunte o que essa pessoa fazia no recreio.', a: [['Num canto tranquilo, com uma história', 'Seu cantinho secreto de leitura.'], ['No meio de todas as brincadeiras', 'Pega-pega! Tá com você!']], m: 'Um pouco em todo canto, depende do dia.' },
          nl: { t: 'In de pauze was je…', o: 'Vraag wat die persoon in de pauze deed.', a: [['In een rustig hoekje, met een verhaal', 'Je geheime leeshoekje.'], ['Midden in elk spelletje', 'Tikkertje! Jij bent hem!']], m: 'Overal een beetje, per dag anders.' },
        }),
        c('souvenirs_matiere', 'ancrage', [['📜', -40, 'racines'], ['🎨', 10, null], ['🌍', 60, 'voyage']], {
          fr: {
            t: 'Ta matière préférée, à l’école ?',
            o: 'Demande-lui quelle matière elle ou il adorait à l’école.',
            a: [
              ['L’histoire de ma région', 'Raconte-moi les châteaux du coin !'],
              ['Les arts plastiques', 'De la peinture jusqu’aux coudes.'],
              ['La géographie, pour rêver d’ailleurs', 'On pointe le globe au hasard ?'],
            ],
          },
          en: {
            t: 'Your favourite school subject?',
            o: 'Ask them which subject they loved at school.',
            a: [
              ['The history of my region', 'Tell me about the local castles!'],
              ['Art class', 'Paint up to the elbows.'],
              ['Geography, to dream of far-off places', 'Shall we spin the globe?'],
            ],
          },
          es: {
            t: '¿Tu asignatura favorita en el cole?',
            o: 'Pregúntale qué asignatura le encantaba en el cole.',
            a: [
              ['La historia de mi región', '¡Cuéntame lo de los castillos de la zona!'],
              ['Plástica', 'Pintura hasta los codos.'],
              ['Geografía, para soñar con otros lugares', '¿Giramos el globo al azar?'],
            ],
          },
          pt: {
            t: 'Sua matéria favorita na escola?',
            o: 'Pergunte qual matéria essa pessoa adorava na escola.',
            a: [
              ['A história da minha região', 'Me conta das histórias da sua terra!'],
              ['Artes', 'Tinta até os cotovelos.'],
              ['Geografia, para sonhar com outros lugares', 'Vamos girar o globo?'],
            ],
          },
          nl: {
            t: 'Je favoriete schoolvak?',
            o: 'Vraag van welk schoolvak die persoon hield.',
            a: [
              ['De geschiedenis van mijn streek', 'Vertel me over de kastelen hier!'],
              ['Tekenen en handvaardigheid', 'Verf tot aan de ellebogen.'],
              ['Aardrijkskunde, om weg te dromen', 'Zullen we aan de wereldbol draaien?'],
            ],
          },
        }),
        c('souvenirs_spectacle', 'elan', [['🌳', -60, 'temps_libre'], ['🎭', 70, 'projets']], {
          fr: {
            t: 'Le spectacle de fin d’année, tu…',
            o: 'Demande-lui quel rôle elle ou il a joué dans un spectacle d’école.',
            a: [
              ['Faisais l’arbre au fond, très bien comme ça', 'Le plus bel arbre de la scène.'],
              ['Voulais le premier rôle', 'Bravo ! Rappel ! Rappel !'],
            ],
          },
          en: {
            t: 'The end-of-year school show, you…',
            o: 'Ask them which part they played in a school show.',
            a: [
              ['Played the tree at the back, quite happily', 'The finest tree on stage.'],
              ['Wanted the lead role', 'Bravo! Encore! Encore!'],
            ],
          },
          es: {
            t: 'La función de fin de curso, tú…',
            o: 'Pregúntale qué papel hizo en una función del cole.',
            a: [
              ['Hacías de árbol al fondo, tan a gusto', 'El árbol más bonito del escenario.'],
              ['Querías el papel principal', '¡Bravo! ¡Otra! ¡Otra!'],
            ],
          },
          pt: {
            t: 'A apresentação de fim de ano, você…',
            o: 'Pergunte qual papel essa pessoa fez numa apresentação da escola.',
            a: [
              ['Fazia a árvore lá no fundo, numa boa', 'A árvore mais linda do palco.'],
              ['Queria o papel principal', 'Bravo! Bis! Bis!'],
            ],
          },
          nl: {
            t: 'De eindejaarsvoorstelling op school, je…',
            o: 'Vraag welke rol die persoon speelde in een schoolvoorstelling.',
            a: [
              ['Was de boom achteraan, prima zo', 'De mooiste boom op het podium.'],
              ['Wilde de hoofdrol', 'Bravo! Toegift! Toegift!'],
            ],
          },
        }),
        c('souvenirs_copains', 'foyer', [['🦊', -60, 'liberte'], ['🧑‍🤝‍🧑', 70, 'accueil']], {
          fr: {
            t: 'À l’école, tu…',
            o: 'Demande-lui comment étaient ses amitiés d’école.',
            a: [
              ['Passais librement d’un groupe à l’autre', 'Un vrai petit renard voyageur.'],
              ['Avais une grande bande inséparable', 'Tous pour un, un pour tous !'],
            ],
          },
          en: {
            t: 'At school, you…',
            o: 'Ask them what their school friendships were like.',
            a: [
              ['Drifted freely from group to group', 'A little travelling fox.'],
              ['Had a big inseparable gang', 'All for one, one for all!'],
            ],
          },
          es: {
            t: 'En el cole, tú…',
            o: 'Pregúntale cómo eran sus amistades del cole.',
            a: [
              ['Ibas libremente de un grupo a otro', 'Un zorrito viajero.'],
              ['Tenías una pandilla inseparable', '¡Todos para uno, uno para todos!'],
            ],
          },
          pt: {
            t: 'Na escola, você…',
            o: 'Pergunte como eram as amizades de escola dessa pessoa.',
            a: [
              ['Circulava livremente entre os grupos', 'Uma raposinha viajante.'],
              ['Tinha uma turma grande e inseparável', 'Um por todos, todos por um!'],
            ],
          },
          nl: {
            t: 'Op school…',
            o: 'Vraag hoe de schoolvriendschappen van die persoon waren.',
            a: [
              ['Zwierf je vrij van groepje naar groepje', 'Een klein reizend vosje.'],
              ['Had je een grote, onafscheidelijke club', 'Eén voor allen, allen voor één!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_6',
      title: { fr: 'Photos et albums', en: 'Photos and albums', es: 'Fotos y álbumes', pt: 'Fotos e álbuns', nl: 'Foto’s en albums' },
      questions: [
        c('souvenirs_regarder_photos', 'foyer', [['🛋️', -60, 'liberte'], ['🫶', 70, 'famille']], {
          fr: {
            t: 'Regarder de vieilles photos, tu préfères…',
            o: 'Demande-lui quelle vieille photo la ou le fait toujours sourire.',
            a: [
              ['Tranquille, à mon rythme', 'Page après page, tout doux.'],
              ['Tous ensemble, en riant des coiffures', 'Cette coupe ! Mais quelle coupe !'],
            ],
          },
          en: {
            t: 'Looking through old photos, you prefer…',
            o: 'Ask them which old photo always makes them smile.',
            a: [
              ['Quietly, at my own pace', 'Page after page, gently.'],
              ['All together, laughing at the haircuts', 'That haircut! What a haircut!'],
            ],
          },
          es: {
            t: 'Ver fotos antiguas, prefieres…',
            o: 'Pregúntale qué foto antigua siempre le hace sonreír.',
            a: [
              ['Con calma, a mi ritmo', 'Página a página, despacito.'],
              ['Todos juntos, riéndonos de los peinados', '¡Ese peinado! ¡Pero qué peinado!'],
            ],
          },
          pt: {
            t: 'Ver fotos antigas, você prefere…',
            o: 'Pergunte qual foto antiga sempre faz essa pessoa sorrir.',
            a: [
              ['Com calma, no meu ritmo', 'Página por página, devagarinho.'],
              ['Todo mundo junto, rindo dos penteados', 'Esse corte! Que corte!'],
            ],
          },
          nl: {
            t: 'Oude foto’s bekijken doe je het liefst…',
            o: 'Vraag van welke oude foto die persoon altijd moet glimlachen.',
            a: [
              ['Rustig, in mijn eigen tempo', 'Bladzijde na bladzijde, zachtjes.'],
              ['Met z’n allen, lachend om de kapsels', 'Dat kapsel! Wat een kapsel!'],
            ],
          },
        }),
        c('souvenirs_photo_format', 'ancrage', [['☁️', 50, 'curiosite'], ['📸', -60, 'racines']], {
          fr: {
            t: 'Tes photos souvenirs, tu les gardes…',
            o: 'Demande-lui comment elle ou il garde ses photos.',
            a: [
              ['En ligne, avec les dernières applis', 'Le nuage garde tout, magique.'],
              ['En albums papier, comme avant', 'Ça sent bon le vieux papier.'],
            ],
          },
          en: {
            t: 'You keep your photo memories…',
            o: 'Ask them how they keep their photos.',
            a: [
              ['Online, with the latest apps', 'The cloud keeps it all, magic.'],
              ['In paper albums, like the old days', 'It smells of old paper, lovely.'],
            ],
          },
          es: {
            t: 'Tus fotos de recuerdo, las guardas…',
            o: 'Pregúntale cómo guarda sus fotos.',
            a: [
              ['En línea, con las últimas apps', 'La nube lo guarda todo, magia.'],
              ['En álbumes de papel, como antes', 'Huele a papel antiguo, qué gusto.'],
            ],
          },
          pt: {
            t: 'Suas fotos de lembrança, você guarda…',
            o: 'Pergunte como essa pessoa guarda as fotos.',
            a: [
              ['On-line, com os aplicativos mais novos', 'A nuvem guarda tudo, mágico.'],
              ['Em álbuns de papel, como antigamente', 'Cheirinho de papel antigo.'],
            ],
          },
          nl: {
            t: 'Je fotoherinneringen bewaar je…',
            o: 'Vraag hoe die persoon foto’s bewaart.',
            a: [
              ['Online, met de nieuwste apps', 'De cloud bewaart alles, magisch.'],
              ['In papieren albums, zoals vroeger', 'Het ruikt naar oud papier, heerlijk.'],
            ],
          },
        }),
        s('souvenirs_photo_quantite', 'cap', ['🎞️', -100, 'spontane'], ['📷', 100, 'plan'], {
          fr: { t: 'En vacances, côté photos, tu…', o: 'Demande-lui quelle est la plus belle photo qu’elle ou il a prise.', a: [['En prends peu, au coup de cœur', 'Une photo, un instant magique.'], ['Prévois tout, avec l’album en tête', 'Chapitre 1 : l’arrivée.']], m: 'Quelques-unes chaque jour.' },
          en: { t: 'On holiday, when it comes to photos, you…', o: 'Ask them about the best photo they’ve ever taken.', a: [['Take a few, when something grabs me', 'One photo, one magic moment.'], ['Plan it all, with the album in mind', 'Chapter 1: the arrival.']], m: 'A few every day.' },
          es: { t: 'En vacaciones, con las fotos, tú…', o: 'Pregúntale cuál es la foto más bonita que ha hecho.', a: [['Haces pocas, cuando algo me enamora', 'Una foto, un instante mágico.'], ['Lo planeas todo, pensando en el álbum', 'Capítulo 1: la llegada.']], m: 'Unas cuantas cada día.' },
          pt: { t: 'Nas férias, com as fotos, você…', o: 'Pergunte qual a foto mais bonita que essa pessoa já tirou.', a: [['Tira poucas, quando algo me encanta', 'Uma foto, um instante mágico.'], ['Planeja tudo, já pensando no álbum', 'Capítulo 1: a chegada.']], m: 'Algumas todo dia.' },
          nl: { t: 'Op vakantie, qua foto’s…', o: 'Vraag wat de mooiste foto is die die persoon ooit maakte.', a: [['Maak je er weinig, als iets me raakt', 'Eén foto, één magisch moment.'], ['Plan je alles, met het album in gedachten', 'Hoofdstuk 1: de aankomst.']], m: 'Elke dag een paar.' },
        }),
        c('souvenirs_photo_preferee', 'rythme', [['🌳', 0, 'nature'], ['🎂', 60, 'fete'], ['🛁', -50, 'cocooning']], {
          fr: {
            t: 'Ta photo d’enfance préférée, c’est…',
            o: 'Demande-lui de décrire sa photo d’enfance préférée.',
            a: [
              ['Une cabane perchée dans un arbre', 'Je vois une tête qui dépasse !'],
              ['Un anniversaire plein de monde', 'Tout le monde a de la crème sur le nez.'],
              ['Un bain moussant avec des canards', 'Coin coin, quelle mousse !'],
            ],
          },
          en: {
            t: 'Your favourite childhood photo is…',
            o: 'Ask them to describe their favourite childhood photo.',
            a: [
              ['A treehouse up in the branches', 'I can see a head poking out!'],
              ['A birthday full of people', 'Everyone’s got cream on their nose.'],
              ['A bubble bath with rubber ducks', 'Quack quack, what bubbles!'],
            ],
          },
          es: {
            t: 'Tu foto de infancia favorita es…',
            o: 'Pregúntale cómo es su foto de infancia favorita.',
            a: [
              ['Una cabaña subida a un árbol', '¡Veo una cabeza asomando!'],
              ['Un cumpleaños lleno de gente', 'Todos tienen nata en la nariz.'],
              ['Un baño de espuma con patitos', '¡Cua cua, cuánta espuma!'],
            ],
          },
          pt: {
            t: 'Sua foto de infância favorita é…',
            o: 'Pergunte como é a foto de infância favorita dessa pessoa.',
            a: [
              ['Uma casa na árvore', 'Estou vendo uma cabeça aparecendo!'],
              ['Um aniversário cheio de gente', 'Todo mundo com chantilly no nariz.'],
              ['Um banho de espuma com patinhos', 'Quá quá, quanta espuma!'],
            ],
          },
          nl: {
            t: 'Je favoriete jeugdfoto is…',
            o: 'Vraag hoe de favoriete jeugdfoto van die persoon eruitziet.',
            a: [
              ['Een boomhut hoog in de takken', 'Ik zie een hoofd uitsteken!'],
              ['Een verjaardag vol mensen', 'Iedereen heeft slagroom op zijn neus.'],
              ['Een schuimbad met badeendjes', 'Kwak kwak, wat een schuim!'],
            ],
          },
        }),
        c('souvenirs_album_projet', 'elan', [['📚', 70, 'projets'], ['😌', -60, 'temps_libre']], {
          fr: {
            t: 'Faire un bel album de tes souvenirs ?',
            o: 'Demande-lui si elle ou il a un projet autour de ses souvenirs.',
            a: [
              ['Oui, c’est même en cours', 'Je peux coller les étoiles ?'],
              ['Un jour… peut-être… on verra', 'Rien ne presse, les photos attendent.'],
            ],
          },
          en: {
            t: 'Make a lovely album of your memories?',
            o: 'Ask them whether they have a project around their memories.',
            a: [
              ['Yes, it’s actually underway', 'Can I stick on the stars?'],
              ['One day… maybe… we’ll see', 'No rush, the photos can wait.'],
            ],
          },
          es: {
            t: '¿Hacer un álbum bonito con tus recuerdos?',
            o: 'Pregúntale si tiene algún proyecto con sus recuerdos.',
            a: [
              ['Sí, de hecho está en marcha', '¿Puedo pegar las estrellitas?'],
              ['Algún día… quizá… ya veremos', 'Sin prisa, las fotos esperan.'],
            ],
          },
          pt: {
            t: 'Fazer um álbum caprichado das suas lembranças?',
            o: 'Pergunte se essa pessoa tem algum projeto com as lembranças.',
            a: [
              ['Sim, já está em andamento', 'Posso colar as estrelinhas?'],
              ['Um dia… talvez… vamos ver', 'Sem pressa, as fotos esperam.'],
            ],
          },
          nl: {
            t: 'Een mooi album van je herinneringen maken?',
            o: 'Vraag of die persoon een project rond herinneringen heeft.',
            a: [
              ['Ja, ik ben er zelfs mee bezig', 'Mag ik de sterretjes plakken?'],
              ['Ooit… misschien… we zien wel', 'Geen haast, de foto’s wachten.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_7',
      title: { fr: 'En route !', en: 'On the road!', es: '¡En marcha!', pt: 'Pé na estrada!', nl: 'Op weg!' },
      questions: [
        c('souvenirs_route_ambiance', 'rythme', [['🎶', 70, 'musique'], ['🚗', 10, null], ['😴', -60, 'calme']], {
          fr: {
            t: 'Les longs trajets de ton enfance, c’était…',
            o: 'Demande-lui comment se passaient les longs trajets de son enfance.',
            a: [
              ['Chanter à tue-tête tous ensemble', 'Et on reprend le refrain !'],
              ['Compter les voitures rouges', 'Quarante-deux ! Non, quarante-trois !'],
              ['Dormir la joue contre la vitre', 'Chut, on te réveille à l’arrivée.'],
            ],
          },
          en: {
            t: 'Long journeys in your childhood were…',
            o: 'Ask them what long journeys were like when they were young.',
            a: [
              ['Singing at the top of our lungs', 'And again, the chorus!'],
              ['Counting red cars', 'Forty-two! No, forty-three!'],
              ['Sleeping with my cheek on the window', 'Shh, we’ll wake you when we arrive.'],
            ],
          },
          es: {
            t: 'Los viajes largos de tu infancia eran…',
            o: 'Pregúntale cómo eran los viajes largos de su infancia.',
            a: [
              ['Cantar a grito pelado todos juntos', '¡Y otra vez el estribillo!'],
              ['Contar coches rojos', '¡Cuarenta y dos! ¡No, cuarenta y tres!'],
              ['Dormir con la cara pegada al cristal', 'Chis, te despertamos al llegar.'],
            ],
          },
          pt: {
            t: 'As viagens longas da sua infância eram…',
            o: 'Pergunte como eram as viagens longas da infância dessa pessoa.',
            a: [
              ['Cantar a plenos pulmões todo mundo junto', 'E de novo o refrão!'],
              ['Contar carros vermelhos', 'Quarenta e dois! Não, quarenta e três!'],
              ['Dormir com o rosto colado no vidro', 'Psiu, a gente te acorda na chegada.'],
            ],
          },
          nl: {
            t: 'Lange ritten in je jeugd waren…',
            o: 'Vraag hoe lange reizen in de jeugd van die persoon gingen.',
            a: [
              ['Keihard meezingen met z’n allen', 'En nog een keer het refrein!'],
              ['Rode auto’s tellen', 'Tweeënveertig! Nee, drieënveertig!'],
              ['Slapen met mijn wang tegen het raam', 'Sst, we maken je wakker als we er zijn.'],
            ],
          },
        }),
        c('souvenirs_route_question', 'cap', [['🌄', -50, 'spontane'], ['🕐', 60, 'plan']], {
          fr: {
            t: 'Enfant, en voyage, tu demandais surtout…',
            o: 'Demande-lui quelle question elle ou il posait sans arrêt en voyage.',
            a: [
              ['« On peut s’arrêter là ? »', 'Oh, une cascade ! Stop !'],
              ['« On arrive à quelle heure ? »', 'Dans exactement 2 h 14 min.'],
            ],
          },
          en: {
            t: 'As a child, on trips, you mostly asked…',
            o: 'Ask them which question they kept asking on trips.',
            a: [
              ['“Can we stop here?”', 'Ooh, a waterfall! Stop!'],
              ['“What time do we get there?”', 'In exactly 2 h 14 min.'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, de viaje, preguntabas sobre todo…',
            o: 'Pregúntale qué preguntaba sin parar en los viajes.',
            a: [
              ['«¿Podemos parar aquí?»', '¡Oh, una cascada! ¡Para!'],
              ['«¿A qué hora llegamos?»', 'Dentro de 2 h 14 min exactos.'],
            ],
          },
          pt: {
            t: 'Na infância, em viagem, você mais perguntava…',
            o: 'Pergunte qual pergunta essa pessoa fazia sem parar nas viagens.',
            a: [
              ['“Dá para parar aqui?”', 'Olha, uma cachoeira! Para!'],
              ['“Que horas a gente chega?”', 'Em exatamente 2h14.'],
            ],
          },
          nl: {
            t: 'Als kind vroeg je op reis vooral…',
            o: 'Vraag welke vraag die persoon onderweg steeds stelde.',
            a: [
              ['“Mogen we hier stoppen?”', 'Oh, een waterval! Stop!'],
              ['“Hoe laat zijn we er?”', 'Over precies 2 u 14 min.'],
            ],
          },
        }),
        s('souvenirs_route_destination', 'ancrage', ['🏘️', -100, 'racines'], ['🧭', 100, 'aventure'], {
          fr: { t: 'Les trajets de ton enfance menaient…', o: 'Demande-lui où menaient les grands trajets de son enfance.', a: [['Toujours au même endroit, chez les mêmes gens', 'On connaissait chaque virage.'], ['Vers des endroits jamais vus', 'Terre en vue, moussaillon !']], m: 'Un peu des deux.' },
          en: { t: 'The journeys of your childhood led…', o: 'Ask them where the big journeys of their childhood used to lead.', a: [['Always to the same place, the same people', 'We knew every bend in the road.'], ['To places never seen before', 'Land ahoy, deckhand!']], m: 'A bit of both.' },
          es: { t: 'Los viajes de tu infancia llevaban…', o: 'Pregúntale adónde llevaban los grandes viajes de su infancia.', a: [['Siempre al mismo sitio, con la misma gente', 'Nos sabíamos cada curva.'], ['A lugares nunca vistos', '¡Tierra a la vista, grumete!']], m: 'Un poco de las dos cosas.' },
          pt: { t: 'As viagens da sua infância levavam…', o: 'Pergunte para onde iam as grandes viagens da infância dessa pessoa.', a: [['Sempre ao mesmo lugar, às mesmas pessoas', 'A gente conhecia cada curva.'], ['A lugares nunca vistos', 'Terra à vista, marujo!']], m: 'Um pouco dos dois.' },
          nl: { t: 'De reizen uit je jeugd gingen…', o: 'Vraag waar de grote reizen uit de jeugd van die persoon naartoe gingen.', a: [['Altijd naar dezelfde plek, dezelfde mensen', 'We kenden elke bocht.'], ['Naar plekken die we nooit zagen', 'Land in zicht, scheepsmaatje!']], m: 'Een beetje van allebei.' },
        }),
        c('souvenirs_route_place', 'foyer', [['🗨️', 60, 'famille'], ['🪟', -50, 'liberte']], {
          fr: {
            t: 'Ta place préférée pendant les trajets ?',
            o: 'Demande-lui quelle était sa place préférée en voiture ou en train.',
            a: [
              ['Au milieu, pour ne rien rater des discussions', 'Tes oreilles traînent partout !'],
              ['Côté fenêtre, dans ma bulle', 'Le paysage rien que pour toi.'],
            ],
          },
          en: {
            t: 'Your favourite seat on journeys?',
            o: 'Ask them what their favourite seat was in the car or on the train.',
            a: [
              ['In the middle, so I don’t miss any chat', 'Your ears are everywhere!'],
              ['By the window, in my bubble', 'The view all to yourself.'],
            ],
          },
          es: {
            t: '¿Tu sitio favorito en los viajes?',
            o: 'Pregúntale cuál era su sitio favorito en el coche o en el tren.',
            a: [
              ['En medio, para no perderme ninguna charla', '¡Tus orejas están en todas partes!'],
              ['En la ventana, en mi burbuja', 'El paisaje solo para ti.'],
            ],
          },
          pt: {
            t: 'Seu lugar favorito nas viagens?',
            o: 'Pergunte qual era o lugar favorito dessa pessoa no carro ou no trem.',
            a: [
              ['No meio, para não perder nenhuma conversa', 'Suas orelhas estão em todo canto!'],
              ['Na janela, na minha bolha', 'A paisagem só para você.'],
            ],
          },
          nl: {
            t: 'Je favoriete plek tijdens reizen?',
            o: 'Vraag wat de favoriete plek van die persoon was in de auto of trein.',
            a: [
              ['In het midden, om niks van de gesprekken te missen', 'Jouw oren zijn overal!'],
              ['Bij het raam, in mijn bubbel', 'Het uitzicht helemaal voor jou.'],
            ],
          },
        }),
        c('souvenirs_route_occupation', 'elan', [['☁️', -60, 'temps_libre'], ['📓', 60, 'projets']], {
          fr: {
            t: 'Pendant les trajets, enfant, tu…',
            o: 'Demande-lui ce qu’elle ou il faisait pour passer le temps en voyage.',
            a: [
              ['Regardais défiler le paysage', 'Une vache ! Une autre vache !'],
              ['Remplissais des cahiers de jeux', 'Mots croisés : terminé !'],
            ],
          },
          en: {
            t: 'On journeys as a child, you…',
            o: 'Ask them how they passed the time on trips.',
            a: [
              ['Watched the scenery roll by', 'A cow! Another cow!'],
              ['Filled in puzzle books', 'Crossword: done!'],
            ],
          },
          es: {
            t: 'En los viajes, de pequeño o pequeña, tú…',
            o: 'Pregúntale qué hacía para pasar el rato en los viajes.',
            a: [
              ['Mirabas pasar el paisaje', '¡Una vaca! ¡Otra vaca!'],
              ['Rellenabas cuadernos de pasatiempos', '¡Crucigrama: terminado!'],
            ],
          },
          pt: {
            t: 'Nas viagens, quando criança, você…',
            o: 'Pergunte o que essa pessoa fazia para passar o tempo nas viagens.',
            a: [
              ['Olhava a paisagem passar', 'Uma vaca! Outra vaca!'],
              ['Preenchia revistinhas de passatempo', 'Palavras cruzadas: pronto!'],
            ],
          },
          nl: {
            t: 'Tijdens reizen als kind…',
            o: 'Vraag hoe die persoon onderweg de tijd doodde.',
            a: [
              ['Keek je naar het voorbijglijdende landschap', 'Een koe! Nog een koe!'],
              ['Vulde je puzzelboekjes in', 'Kruiswoordpuzzel: klaar!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_8',
      title: { fr: 'Chansons et dessins animés', en: 'Songs and cartoons', es: 'Canciones y dibujos', pt: 'Músicas e desenhos', nl: 'Liedjes en tekenfilms' },
      questions: [
        s('souvenirs_soiree_dessins', 'rythme', ['🛋️', -100, 'cocooning'], ['🎉', 100, 'fete'], {
          fr: { t: 'Une soirée « dessins animés d’enfance », tu la vois…', o: 'Demande-lui quel dessin animé elle ou il reverrait avec plaisir.', a: [['Sous un plaid, en petit comité', 'Je prépare les coussins.'], ['Grande soirée déguisée avec plein de monde', 'Je viens en costume de nuage !']], m: 'Quelques amis et du pop-corn.' },
          en: { t: 'A “childhood cartoons” night, you picture it…', o: 'Ask them which cartoon they’d happily watch again.', a: [['Under a blanket, just a few of us', 'I’ll get the cushions ready.'], ['A big fancy-dress party with loads of people', 'I’m coming dressed as a cloud!']], m: 'A few friends and some popcorn.' },
          es: { t: 'Una noche de «dibujos de la infancia», la imaginas…', o: 'Pregúntale qué serie de dibujos volvería a ver encantado o encantada.', a: [['Bajo una manta, en grupo pequeño', 'Preparo los cojines.'], ['Gran fiesta de disfraces con mucha gente', '¡Voy disfrazado de nube!']], m: 'Unos amigos y palomitas.' },
          pt: { t: 'Uma noite de “desenhos da infância”, você imagina…', o: 'Pergunte qual desenho essa pessoa reveria com prazer.', a: [['Debaixo da manta, com pouca gente', 'Vou arrumar as almofadas.'], ['Uma festa à fantasia com muita gente', 'Vou fantasiado de nuvem!']], m: 'Alguns amigos e pipoca.' },
          nl: { t: 'Een avond met “tekenfilms van vroeger” zie je…', o: 'Vraag welke tekenfilm die persoon graag nog eens zou zien.', a: [['Onder een dekentje, met een paar mensen', 'Ik leg de kussens klaar.'], ['Groot verkleedfeest met veel mensen', 'Ik kom verkleed als wolk!']], m: 'Een paar vrienden en popcorn.' },
        }),
        c('souvenirs_revoir', 'ancrage', [['📼', -60, 'racines'], ['🎬', 60, 'curiosite']], {
          fr: {
            t: 'Les films de ton enfance, tu les revois ?',
            o: 'Demande-lui quel film d’enfance elle ou il connaît par cœur.',
            a: [
              ['Oui, en boucle, je connais les répliques', 'Et là, il dit… je sais, je sais !'],
              ['Rarement, je préfère découvrir', 'Un film nouveau, une nouvelle aventure.'],
            ],
          },
          en: {
            t: 'Do you rewatch the films from your childhood?',
            o: 'Ask them which childhood film they know by heart.',
            a: [
              ['Yes, on repeat, I know every line', 'And then he says… I know, I know!'],
              ['Rarely, I’d rather discover new ones', 'A new film, a new adventure.'],
            ],
          },
          es: {
            t: 'Las pelis de tu infancia, ¿las vuelves a ver?',
            o: 'Pregúntale qué peli de su infancia se sabe de memoria.',
            a: [
              ['Sí, en bucle, me sé los diálogos', 'Y ahora dice… ¡lo sé, lo sé!'],
              ['Poco, prefiero descubrir', 'Peli nueva, aventura nueva.'],
            ],
          },
          pt: {
            t: 'Os filmes da sua infância, você revê?',
            o: 'Pergunte qual filme de infância essa pessoa sabe de cor.',
            a: [
              ['Sim, sem parar, sei as falas', 'E aí ele diz… eu sei, eu sei!'],
              ['Raramente, prefiro descobrir', 'Filme novo, aventura nova.'],
            ],
          },
          nl: {
            t: 'Kijk je de films uit je jeugd nog eens?',
            o: 'Vraag welke jeugdfilm die persoon uit het hoofd kent.',
            a: [
              ['Ja, keer op keer, ik ken de zinnen', 'En nu zegt hij… ik weet het, ik weet het!'],
              ['Zelden, ik ontdek liever iets nieuws', 'Nieuwe film, nieuw avontuur.'],
            ],
          },
        }),
        c('souvenirs_heros', 'elan', [['🐻', -60, 'temps_libre'], ['🕵️', 20, 'curiosite'], ['🦸', 60, 'projets']], {
          fr: {
            t: 'Enfant, ton héros ou ton héroïne préférée…',
            o: 'Demande-lui quel était son héros ou son héroïne d’enfance.',
            a: [
              ['Faisait la sieste dans un hamac', 'Mon modèle absolu.'],
              ['Résolvait des énigmes', 'Élémentaire, mon cher !'],
              ['Sauvait le monde chaque samedi', 'Cape au vent, c’est parti !'],
            ],
          },
          en: {
            t: 'As a child, your favourite hero…',
            o: 'Ask them who their childhood hero was.',
            a: [
              ['Napped in a hammock', 'My absolute role model.'],
              ['Solved mysteries', 'Elementary, my dear!'],
              ['Saved the world every Saturday', 'Cape flying, off we go!'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, tu héroe o heroína favorita…',
            o: 'Pregúntale quién era su héroe o heroína de la infancia.',
            a: [
              ['Dormía la siesta en una hamaca', 'Mi modelo absoluto.'],
              ['Resolvía misterios', '¡Elemental, querido!'],
              ['Salvaba el mundo cada sábado', '¡Capa al viento, vamos!'],
            ],
          },
          pt: {
            t: 'Na infância, seu herói ou heroína favorita…',
            o: 'Pergunte quem era o herói ou a heroína de infância dessa pessoa.',
            a: [
              ['Tirava um cochilo na rede', 'Meu modelo absoluto.'],
              ['Resolvia mistérios', 'Elementar, meu caro!'],
              ['Salvava o mundo todo sábado', 'Capa ao vento, vamos lá!'],
            ],
          },
          nl: {
            t: 'Je favoriete held als kind…',
            o: 'Vraag wie de jeugdheld van die persoon was.',
            a: [
              ['Deed een dutje in een hangmat', 'Mijn absolute voorbeeld.'],
              ['Loste raadsels op', 'Elementair, beste vriend!'],
              ['Redde elke zaterdag de wereld', 'Cape in de wind, daar gaan we!'],
            ],
          },
        }),
        c('souvenirs_chanson_radio', 'foyer', [['🎧', -50, 'liberte'], ['📞', 60, 'famille']], {
          fr: {
            t: 'Une chanson de ton enfance passe à la radio. Tu…',
            o: 'Demande-lui quelle chanson la ou le ramène tout de suite en enfance.',
            a: [
              ['Montes le son et savoures dans ton coin', 'Concert privé, entrée gratuite.'],
              ['Écris à qui la chantait avec toi', 'Tu te souviens ? Moi, oui !'],
            ],
          },
          en: {
            t: 'A song from your childhood comes on the radio. You…',
            o: 'Ask them which song takes them straight back to childhood.',
            a: [
              ['Turn it up and enjoy it on your own', 'Private concert, free entry.'],
              ['Message whoever used to sing it with you', 'Remember? I do!'],
            ],
          },
          es: {
            t: 'Suena en la radio una canción de tu infancia. Tú…',
            o: 'Pregúntale qué canción le lleva directo a su infancia.',
            a: [
              ['Subes el volumen y la disfrutas a solas', 'Concierto privado, entrada libre.'],
              ['Escribes a quien la cantaba contigo', '¿Te acuerdas? ¡Yo sí!'],
            ],
          },
          pt: {
            t: 'Uma música da sua infância toca no rádio. Você…',
            o: 'Pergunte qual música leva essa pessoa direto para a infância.',
            a: [
              ['Aumenta o volume e curte no seu canto', 'Show particular, entrada grátis.'],
              ['Manda mensagem para quem cantava com você', 'Lembra? Eu lembro!'],
            ],
          },
          nl: {
            t: 'Er komt een liedje uit je jeugd op de radio. Je…',
            o: 'Vraag van welk liedje die persoon meteen weer kind wordt.',
            a: [
              ['Zet het harder en geniet in je eentje', 'Privéconcert, gratis entree.'],
              ['Stuurt een bericht aan wie het met je meezong', 'Weet je nog? Ik wel!'],
            ],
          },
        }),
        c('souvenirs_cassettes', 'cap', [['🎲', -60, 'spontane'], ['🗂️', 70, 'ordre']], {
          fr: {
            t: 'Enfant, tes cassettes, CD ou playlists étaient…',
            o: 'Demande-lui quelle était sa musique préférée, enfant.',
            a: [
              ['Mélangés, on écoutait ce qui tombait', 'Surprise musicale à chaque fois !'],
              ['Rangés par ordre alphabétique', 'De A à Z, impeccable.'],
            ],
          },
          en: {
            t: 'As a child, your tapes, CDs or playlists were…',
            o: 'Ask them what their favourite music was as a child.',
            a: [
              ['All mixed up, we played whatever came out', 'A musical surprise every time!'],
              ['Sorted alphabetically', 'From A to Z, spotless.'],
            ],
          },
          es: {
            t: 'De pequeño o pequeña, tus casetes, CD o listas estaban…',
            o: 'Pregúntale cuál era su música favorita de pequeño o pequeña.',
            a: [
              ['Mezclados, sonaba lo que saliera', '¡Sorpresa musical cada vez!'],
              ['Ordenados alfabéticamente', 'De la A a la Z, impecable.'],
            ],
          },
          pt: {
            t: 'Na infância, suas fitas, CDs ou playlists eram…',
            o: 'Pergunte qual era a música favorita dessa pessoa na infância.',
            a: [
              ['Misturados, tocava o que viesse', 'Surpresa musical toda vez!'],
              ['Em ordem alfabética', 'De A a Z, impecável.'],
            ],
          },
          nl: {
            t: 'Je cassettes, cd’s of playlists waren als kind…',
            o: 'Vraag wat de favoriete muziek van die persoon als kind was.',
            a: [
              ['Door elkaar, we draaiden wat er opkwam', 'Elke keer een muzikale verrassing!'],
              ['Op alfabetische volgorde', 'Van A tot Z, keurig.'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_9',
      title: { fr: 'Cabanes et aventures', en: 'Dens and adventures', es: 'Cabañas y aventuras', pt: 'Cabanas e aventuras', nl: 'Hutten en avonturen' },
      questions: [
        c('souvenirs_cabane', 'elan', [['🪵', 70, 'projets'], ['🧺', -50, 'cocooning']], {
          fr: {
            t: 'Construire une cabane, enfant, c’était…',
            o: 'Demande-lui à quoi ressemblait sa plus belle cabane d’enfance.',
            a: [
              ['Un vrai chantier sur plusieurs jours', 'Avec un toit, une porte et un drapeau !'],
              ['Un drap sur deux chaises, et hop', 'La plus douillette des forteresses.'],
            ],
          },
          en: {
            t: 'Building a den, as a child, was…',
            o: 'Ask them what their best childhood den looked like.',
            a: [
              ['A proper project over several days', 'With a roof, a door and a flag!'],
              ['A sheet over two chairs, done', 'The cosiest fortress of all.'],
            ],
          },
          es: {
            t: 'Construir una cabaña, de pequeño o pequeña, era…',
            o: 'Pregúntale cómo era su mejor cabaña de infancia.',
            a: [
              ['Una obra de verdad durante días', '¡Con techo, puerta y bandera!'],
              ['Una sábana sobre dos sillas, y listo', 'La fortaleza más acogedora.'],
            ],
          },
          pt: {
            t: 'Construir uma cabana, na infância, era…',
            o: 'Pergunte como era a cabana mais bonita da infância dessa pessoa.',
            a: [
              ['Uma obra de verdade durante dias', 'Com telhado, porta e bandeira!'],
              ['Um lençol em cima de duas cadeiras e pronto', 'A fortaleza mais aconchegante.'],
            ],
          },
          nl: {
            t: 'Een hut bouwen was als kind…',
            o: 'Vraag hoe de mooiste hut uit de jeugd van die persoon eruitzag.',
            a: [
              ['Een echt bouwproject van dagen', 'Met een dak, een deur en een vlag!'],
              ['Een laken over twee stoelen, klaar', 'Het knusste fort van allemaal.'],
            ],
          },
        }),
        s('souvenirs_explorer', 'ancrage', ['🏡', -100, 'racines'], ['🔭', 100, 'aventure'], {
          fr: { t: 'Enfant, autour de chez toi, tu…', o: 'Demande-lui quel était son coin préféré à explorer, enfant.', a: [['Connaissais chaque recoin par cœur', 'Le roi ou la reine du quartier.'], ['Partais toujours plus loin explorer', 'Encore une rue, juste une !']], m: 'Un peu plus loin à chaque fois.' },
          en: { t: 'As a child, around your home, you…', o: 'Ask them about their favourite spot to explore as a child.', a: [['Knew every nook by heart', 'Ruler of the neighbourhood.'], ['Went further and further exploring', 'One more street, just one!']], m: 'A little further each time.' },
          es: { t: 'De pequeño o pequeña, alrededor de casa, tú…', o: 'Pregúntale cuál era su rincón favorito para explorar de pequeño o pequeña.', a: [['Conocías cada rincón de memoria', 'El rey o la reina del barrio.'], ['Ibas cada vez más lejos a explorar', '¡Otra calle, solo una!']], m: 'Un poco más lejos cada vez.' },
          pt: { t: 'Na infância, perto de casa, você…', o: 'Pergunte qual era o cantinho favorito dessa pessoa para explorar na infância.', a: [['Conhecia cada cantinho de cor', 'O rei ou a rainha do bairro.'], ['Ia cada vez mais longe explorar', 'Mais uma rua, só mais uma!']], m: 'Um pouco mais longe a cada vez.' },
          nl: { t: 'Als kind, rond je huis…', o: 'Vraag wat als kind de favoriete plek van die persoon was om te verkennen.', a: [['Kende je elk hoekje uit je hoofd', 'De koning of koningin van de buurt.'], ['Ging je steeds verder op ontdekking', 'Nog één straat, nog maar één!']], m: 'Elke keer een stukje verder.' },
        }),
        c('souvenirs_pluie', 'cap', [['🌧️', -60, 'spontane'], ['🎲', 50, 'plan']], {
          fr: {
            t: 'Il pleuvait, enfant, tu…',
            o: 'Demande-lui ce qu’elle ou il faisait les jours de pluie, enfant.',
            a: [
              ['Sautais dans toutes les flaques', 'Splash ! Et re-splash !'],
              ['Sortais le jeu de société prévu pour ça', 'Le plan pluie, toujours prêt.'],
            ],
          },
          en: {
            t: 'When it rained, as a child, you…',
            o: 'Ask them what they did on rainy days as a child.',
            a: [
              ['Jumped in every puddle', 'Splash! And splash again!'],
              ['Got out the board game kept for rainy days', 'The rain plan, always ready.'],
            ],
          },
          es: {
            t: 'Cuando llovía, de pequeño o pequeña, tú…',
            o: 'Pregúntale qué hacía los días de lluvia de pequeño o pequeña.',
            a: [
              ['Saltabas en todos los charcos', '¡Plaf! ¡Y otra vez plaf!'],
              ['Sacabas el juego de mesa reservado para eso', 'El plan lluvia, siempre listo.'],
            ],
          },
          pt: {
            t: 'Quando chovia, na infância, você…',
            o: 'Pergunte o que essa pessoa fazia nos dias de chuva na infância.',
            a: [
              ['Pulava em todas as poças', 'Splash! E mais splash!'],
              ['Pegava o jogo de tabuleiro guardado para isso', 'O plano chuva, sempre pronto.'],
            ],
          },
          nl: {
            t: 'Als het regende, als kind…',
            o: 'Vraag wat die persoon als kind op regendagen deed.',
            a: [
              ['Sprong je in elke plas', 'Plons! En nog eens plons!'],
              ['Pakte je het spel dat daarvoor klaarlag', 'Het regenplan, altijd paraat.'],
            ],
          },
        }),
        c('souvenirs_aventures', 'rythme', [['🚲', 70, 'monde'], ['🐞', -50, 'nature']], {
          fr: {
            t: 'Tes aventures dehors, enfant, c’était…',
            o: 'Demande-lui sa plus grande aventure d’enfance.',
            a: [
              ['Des courses de vélo avec la bande du quartier', 'Le premier au coin de la rue gagne !'],
              ['Des balades tranquilles à observer les insectes', 'Regarde, une coccinelle à sept points !'],
            ],
          },
          en: {
            t: 'Your outdoor adventures as a child were…',
            o: 'Ask them about their biggest childhood adventure.',
            a: [
              ['Bike races with the neighbourhood gang', 'First to the corner wins!'],
              ['Quiet walks watching insects', 'Look, a seven-spot ladybird!'],
            ],
          },
          es: {
            t: 'Tus aventuras al aire libre de pequeño o pequeña eran…',
            o: 'Pregúntale cuál fue su mayor aventura de infancia.',
            a: [
              ['Carreras de bici con la pandilla del barrio', '¡El primero en llegar a la esquina gana!'],
              ['Paseos tranquilos observando bichitos', '¡Mira, una mariquita de siete puntos!'],
            ],
          },
          pt: {
            t: 'Suas aventuras ao ar livre na infância eram…',
            o: 'Pergunte qual foi a maior aventura da infância dessa pessoa.',
            a: [
              ['Corridas de bicicleta com a turma do bairro', 'Quem chegar primeiro na esquina ganha!'],
              ['Passeios tranquilos observando insetos', 'Olha, uma joaninha de sete pintas!'],
            ],
          },
          nl: {
            t: 'Je buitenavonturen als kind waren…',
            o: 'Vraag naar het grootste jeugdavontuur van die persoon.',
            a: [
              ['Fietsraces met de buurtkinderen', 'Wie het eerst op de hoek is, wint!'],
              ['Rustige wandelingen om insecten te bekijken', 'Kijk, een lieveheersbeestje met zeven stippen!'],
            ],
          },
        }),
        c('souvenirs_cachette', 'foyer', [['🗝️', -60, 'liberte'], ['🤝', 60, 'fidelite']], {
          fr: {
            t: 'Ta cachette secrète d’enfance, tu la partageais…',
            o: 'Demande-lui où était sa cachette secrète, enfant.',
            a: [
              ['Avec personne, c’était mon royaume', 'Mot de passe : top secret.'],
              ['Avec ma bande, c’était notre QG', 'Réunion au QG à 16 h !'],
            ],
          },
          en: {
            t: 'Your secret childhood hideout, you shared it…',
            o: 'Ask them where their secret hideout was as a child.',
            a: [
              ['With nobody, it was my kingdom', 'Password: top secret.'],
              ['With my gang, it was our HQ', 'Meeting at HQ at 4 pm!'],
            ],
          },
          es: {
            t: 'Tu escondite secreto de infancia, lo compartías…',
            o: 'Pregúntale dónde estaba su escondite secreto de pequeño o pequeña.',
            a: [
              ['Con nadie, era mi reino', 'Contraseña: alto secreto.'],
              ['Con mi pandilla, era nuestro cuartel', '¡Reunión en el cuartel a las 16 h!'],
            ],
          },
          pt: {
            t: 'Seu esconderijo secreto da infância, você dividia…',
            o: 'Pergunte onde ficava o esconderijo secreto dessa pessoa na infância.',
            a: [
              ['Com ninguém, era meu reino', 'Senha: ultrassecreta.'],
              ['Com a minha turma, era nosso QG', 'Reunião no QG às 16h!'],
            ],
          },
          nl: {
            t: 'Je geheime schuilplek als kind deelde je…',
            o: 'Vraag waar de geheime schuilplek van die persoon als kind was.',
            a: [
              ['Met niemand, het was mijn koninkrijk', 'Wachtwoord: topgeheim.'],
              ['Met mijn club, het was ons hoofdkwartier', 'Vergadering in het hoofdkwartier om 16 uur!'],
            ],
          },
        }),
      ],
    },
    {
      id: 'souvenirs_10',
      title: { fr: 'Raconter', en: 'Telling stories', es: 'Contar', pt: 'Contar histórias', nl: 'Vertellen' },
      questions: [
        c('souvenirs_retourner', 'ancrage', [['✈️', 60, 'voyage'], ['🏘️', -60, 'racines']], {
          fr: {
            t: 'Retourner sur un lieu de ton enfance…',
            o: 'Demande-lui quel lieu d’enfance elle ou il aimerait revoir.',
            a: [
              ['Je préfère créer de nouveaux souvenirs ailleurs', 'Une nouvelle page à écrire !'],
              ['J’y retourne souvent, avec plaisir', 'Ça sent bon les souvenirs.'],
            ],
          },
          en: {
            t: 'Going back to a childhood place…',
            o: 'Ask them which childhood place they’d love to see again.',
            a: [
              ['I’d rather make new memories elsewhere', 'A fresh page to write!'],
              ['I often go back, happily', 'It smells of good memories.'],
            ],
          },
          es: {
            t: 'Volver a un lugar de tu infancia…',
            o: 'Pregúntale qué lugar de su infancia le gustaría volver a ver.',
            a: [
              ['Prefiero crear recuerdos nuevos en otro sitio', '¡Una página nueva por escribir!'],
              ['Vuelvo a menudo, con gusto', 'Huele a buenos recuerdos.'],
            ],
          },
          pt: {
            t: 'Voltar a um lugar da sua infância…',
            o: 'Pergunte qual lugar da infância essa pessoa gostaria de rever.',
            a: [
              ['Prefiro criar lembranças novas em outro lugar', 'Uma página nova para escrever!'],
              ['Volto sempre, com prazer', 'Tem cheirinho de boas lembranças.'],
            ],
          },
          nl: {
            t: 'Teruggaan naar een plek uit je jeugd…',
            o: 'Vraag welke plek uit de jeugd die persoon graag terug zou zien.',
            a: [
              ['Ik maak liever nieuwe herinneringen elders', 'Een nieuwe bladzijde om te schrijven!'],
              ['Doe ik vaak, met plezier', 'Het ruikt naar fijne herinneringen.'],
            ],
          },
        }),
        s('souvenirs_raconter', 'rythme', ['🤫', -100, 'calme'], ['🎙️', 100, 'monde'], {
          fr: { t: 'Raconter tes souvenirs d’enfance, tu le fais…', o: 'Demande-lui de te raconter un souvenir d’enfance qui la ou le fait rire.', a: [['En tête-à-tête, à voix basse', 'Je tends l’oreille, raconte.'], ['Devant toute la tablée, avec les bruitages', 'Vroum ! Boum ! Et là, la chute !']], m: 'Avec quelques amis proches.' },
          en: { t: 'Telling your childhood stories, you do it…', o: 'Ask them to tell you a childhood memory that makes them laugh.', a: [['One-to-one, in a low voice', 'I’m all ears, go on.'], ['To the whole table, with sound effects', 'Vroom! Boom! And then the punchline!']], m: 'With a few close friends.' },
          es: { t: 'Contar tus recuerdos de infancia, lo haces…', o: 'Pregúntale por un recuerdo de infancia que le haga reír.', a: [['A solas, en voz baja', 'Soy todo oídos, cuenta.'], ['Delante de toda la mesa, con efectos de sonido', '¡Brum! ¡Bum! ¡Y entonces el final!']], m: 'Con unos pocos amigos cercanos.' },
          pt: { t: 'Contar suas lembranças de infância, você faz…', o: 'Pergunte uma lembrança de infância que faz essa pessoa rir.', a: [['A sós, em voz baixa', 'Sou todo ouvidos, conta.'], ['Para a mesa toda, com efeitos sonoros', 'Vrum! Bum! E aí o final!']], m: 'Com alguns amigos próximos.' },
          nl: { t: 'Je jeugdherinneringen vertel je…', o: 'Vraag om een jeugdherinnering waar die persoon om moet lachen.', a: [['Onder vier ogen, zachtjes', 'Ik ben een en al oor, vertel.'], ['Aan de hele tafel, met geluidseffecten', 'Vroem! Boem! En dan de clou!']], m: 'Met een paar goede vrienden.' },
        }),
        c('souvenirs_anecdote', 'foyer', [['👫', 60, 'famille'], ['🦸', -50, 'liberte']], {
          fr: {
            t: 'Ton anecdote d’enfance préférée met en scène…',
            o: 'Demande-lui son anecdote d’enfance préférée.',
            a: [
              ['Toute une bande', 'Le casting est énorme !'],
              ['Moi, en solo, en pleine aventure', 'Le héros ou l’héroïne de l’histoire !'],
            ],
          },
          en: {
            t: 'Your favourite childhood anecdote stars…',
            o: 'Ask them for their favourite childhood anecdote.',
            a: [
              ['A whole gang', 'What a huge cast!'],
              ['Me, solo, mid-adventure', 'The hero of the story!'],
            ],
          },
          es: {
            t: 'Tu anécdota de infancia favorita la protagoniza…',
            o: 'Pregúntale por su anécdota de infancia favorita.',
            a: [
              ['Toda una pandilla', '¡Menudo reparto!'],
              ['Yo, en solitario, en plena aventura', '¡El héroe o la heroína de la historia!'],
            ],
          },
          pt: {
            t: 'Sua história de infância favorita tem como estrela…',
            o: 'Pergunte qual é a história de infância favorita dessa pessoa.',
            a: [
              ['Uma turma inteira', 'Que elenco enorme!'],
              ['Eu, numa aventura solo', 'O herói ou a heroína da história!'],
            ],
          },
          nl: {
            t: 'In je favoriete jeugdverhaal speelt de hoofdrol…',
            o: 'Vraag naar het favoriete jeugdverhaal van die persoon.',
            a: [
              ['Een hele club', 'Wat een grote cast!'],
              ['Ik, solo, midden in een avontuur', 'De held van het verhaal!'],
            ],
          },
        }),
        c('souvenirs_capsule', 'cap', [['📦', 70, 'plan'], ['🤷', -60, 'spontane']], {
          fr: {
            t: 'Une capsule temporelle à ouvrir dans 10 ans ?',
            o: 'Demande-lui ce qu’elle ou il mettrait dans une capsule temporelle.',
            a: [
              ['Oui, avec la date notée partout', 'Rendez-vous noté, dans 10 ans pile.'],
              ['J’oublierais où je l’ai cachée !', 'Je retiendrai pour toi, promis.'],
            ],
          },
          en: {
            t: 'A time capsule to open in 10 years?',
            o: 'Ask them what they’d put in a time capsule.',
            a: [
              ['Yes, with the date written everywhere', 'Date noted, in exactly 10 years.'],
              ['I’d forget where I hid it!', 'I’ll remember for you, promise.'],
            ],
          },
          es: {
            t: '¿Una cápsula del tiempo para abrir dentro de 10 años?',
            o: 'Pregúntale qué metería en una cápsula del tiempo.',
            a: [
              ['Sí, con la fecha apuntada por todas partes', 'Cita apuntada, dentro de 10 años justos.'],
              ['¡Olvidaría dónde la escondí!', 'Yo me acuerdo por ti, prometido.'],
            ],
          },
          pt: {
            t: 'Uma cápsula do tempo para abrir daqui a 10 anos?',
            o: 'Pergunte o que essa pessoa colocaria numa cápsula do tempo.',
            a: [
              ['Sim, com a data anotada em todo lugar', 'Encontro marcado, daqui a 10 anos.'],
              ['Eu ia esquecer onde escondi!', 'Eu lembro por você, prometo.'],
            ],
          },
          nl: {
            t: 'Een tijdcapsule om over 10 jaar te openen?',
            o: 'Vraag wat die persoon in een tijdcapsule zou stoppen.',
            a: [
              ['Ja, met de datum overal genoteerd', 'Afspraak genoteerd, over precies 10 jaar.'],
              ['Ik zou vergeten waar ik hem verstopte!', 'Ik onthoud het voor je, beloofd.'],
            ],
          },
        }),
        c('souvenirs_demain', 'elan', [['🍃', -60, 'temps_libre'], ['🗓️', 60, 'projets']], {
          fr: {
            t: 'Les souvenirs de demain, tu…',
            o: 'Demande-lui quel souvenir elle ou il aimerait se créer cette année.',
            a: [
              ['Les laisses venir tranquillement', 'Les plus beaux arrivent sans prévenir.'],
              ['Les fabriques avec des projets fous', 'Je note : projet fou numéro 1 !'],
            ],
          },
          en: {
            t: 'Tomorrow’s memories, you…',
            o: 'Ask them which memory they’d love to create this year.',
            a: [
              ['Let them come along gently', 'The best ones arrive unannounced.'],
              ['Build them with wild projects', 'Noted: wild project number 1!'],
            ],
          },
          es: {
            t: 'Los recuerdos de mañana, tú…',
            o: 'Pregúntale qué recuerdo le gustaría crear este año.',
            a: [
              ['Dejas que lleguen con calma', 'Los mejores llegan sin avisar.'],
              ['Los fabricas con proyectos locos', 'Apuntado: ¡proyecto loco número 1!'],
            ],
          },
          pt: {
            t: 'As lembranças de amanhã, você…',
            o: 'Pergunte qual lembrança essa pessoa gostaria de criar este ano.',
            a: [
              ['Deixa que cheguem com calma', 'As melhores chegam sem avisar.'],
              ['Fabrica com projetos malucos', 'Anotado: projeto maluco número 1!'],
            ],
          },
          nl: {
            t: 'De herinneringen van morgen…',
            o: 'Vraag welke herinnering die persoon dit jaar graag zou maken.',
            a: [
              ['Laat je rustig komen', 'De mooiste komen onaangekondigd.'],
              ['Maak je met gekke projecten', 'Genoteerd: gek project nummer 1!'],
            ],
          },
        }),
      ],
    },
  ],
};
