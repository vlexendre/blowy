import type { SeedTexts } from './texts';

export const es: SeedTexts = {
  units: {
    vision: ['Tu visión de la vida', 'Lo que quieres para más adelante.'],
    energie: ['Tu energía', 'Lo que te recarga, lo que te lanza.'],
    habitudes: ['Tus hábitos', 'Tu día a día, sin filtro.'],
    valeurs: ['Lo que te importa', 'Lo que no soltarías por nada.'],
    autres: ['Tú y los demás', 'Tus amigos, tu gente y los nuevos.'],
    gouts: ['Tus gustos', 'Lo que te apetece.'],
  },
  steps: {
    vision_1: 'Las grandes decisiones',
    vision_2: 'Tu casa, tu ritmo',
    energie_1: 'Recargar pilas',
    energie_2: 'Arrancar en un segundo',
    habitudes_1: 'Organizado o no',
    habitudes_2: 'Tus días',
    valeurs_1: 'Tus prioridades',
    valeurs_2: 'Aquí o en otra parte',
    autres_1: 'Tus amigos',
    autres_2: 'Tu gente',
    gouts_1: 'Descubrir',
    gouts_2: 'Tus placeres',
  },
  legacy: {
    dimanche: { o: 'Pregúntale cómo es su domingo perfecto.', r: ['Manta y serie: me acomodo a tu lado.', '¡Cojo la bufanda, vamos!'] },
    enfants: { o: 'Pregúntale cómo son sus comidas de domingo.', r: ['Habrá que alargar la mesa.', 'El brunch es sagrado.'] },
    mutation: { o: 'Pregúntale a qué país se iría mañana.', r: ['Me escondo en una caja.', 'Aquí está tu hogar.'] },
    heritage: { o: 'Pregúntale qué haría con 10 000 €.', r: ['Tu hucha te lo agradece.', 'Los recuerdos no se pierden.'] },
    promotion: { o: 'Pregúntale por el proyecto que le ocupa ahora.', r: ['Adelante, yo cuido la casa.', 'Tus tardes están a salvo.'] },
    vacances: { o: 'Pregúntale por sus mejores vacaciones.', r: ['Aventura de verdad.', 'Qué planificación tan bonita.'] },
    appartement: { o: 'Pregúntale cómo es la casa de sus sueños.', r: ['Un nido, me encantan los nidos.', 'Ligero como una pluma.'] },
    vendredi: { o: 'Pregúntale por su mejor viernes por la noche.', r: ['¡La noche es joven!', 'Buenas noches, hasta mañana.'] },
    cinq_ans: { o: 'Pregúntale dónde se ve dentro de cinco años.', r: ['Cerca de los tuyos, eso vale oro.', 'Mándame una postal.'] },
    projet: { o: 'Pregúntale por el proyecto que más le ilusiona.', r: ['¡Qué pasión!', 'Disfrutar primero, buena decisión.'] },
  },
  q: {
    energie_batterie: {
      t: 'Después de una semana intensa, recargas pilas…',
      o: 'Pregúntale cómo recarga pilas.',
      a: [
        ['Tranquilamente, en casa', 'Manta aprobada. Preparo el té.'],
        ['Rodeado de gente', '¡Aviso a la pandilla!'],
      ],
      m: 'Un poco de cada: la dosis justa.',
    },
    energie_samedi: {
      t: 'Sábado por la mañana, sin planes.',
      o: 'Pregúntale cómo es su sábado por la mañana ideal.',
      a: [
        ['Café lento junto a la ventana, nada más', 'El lujo absoluto: no hacer nada.'],
        ['Salgo y ya veré adónde', 'Cojo la bufanda y te sigo.'],
        ['Un brunch con amigos', 'Guárdame un cruasán.'],
      ],
    },
    energie_soiree: {
      t: 'Una fiesta en la que solo conoces a quien invita.',
      o: 'Pregúntale por su mejor o peor fiesta entre desconocidos.',
      a: [
        ['Voy, me encanta conocer gente', 'Volverás con diez contactos nuevos.'],
        ['Voy si puedo ir con alguien', 'En pareja de baile, buena idea.'],
        ['Paso, esta noche toca sofá', 'El sofá te lo agradece.'],
      ],
    },
    energie_pluie: {
      t: 'Domingo, llueve a cántaros. Tú…',
      o: 'Pregúntale qué hace cuando llueve todo el fin de semana.',
      a: [
        ['Avanzas en un proyecto personal', 'Aquí se trabaja duro.'],
        ['Te pierdes en un libro o una serie', 'Otro episodio, no diré nada.'],
        ['Cocinas algo complicado, por gusto', '¿Cuándo pruebo?'],
      ],
    },
    energie_semaine: {
      t: 'Tu semana ideal se parece más a…',
      o: 'Pregúntale cómo es su semana ideal.',
      a: [
        ['Tranquila, con tiempo para mí', 'La siesta es un arte.'],
        ['Llena de cosas que avanzan', '¡Motor encendido!'],
      ],
      m: 'Ni carrera ni siesta: equilibrio.',
    },
    energie_vacances: {
      t: 'De vacaciones, tu día perfecto…',
      o: 'Pregúntale por su día de vacaciones perfecto.',
      a: [
        ['Tumbona, libro y nada más', 'Te guardo la toalla.'],
        ['Ruta al amanecer, visitas por la tarde', 'Ya me duelen las patas.'],
        ['Playa de día, fiesta de noche', '¿Cuándo duermes?'],
      ],
    },
    energie_ce_soir: {
      t: 'Las 19 h, un mensaje: «¿Te apetece algo esta noche?»',
      o: 'Pregúntale cuándo dijo que sí a un plan de última hora.',
      a: [
        ['¡Sí! ¿Dónde quedamos?', 'Ya estás con los zapatos puestos.'],
        ['Depende de qué', 'Prudencia de gato.'],
        ['Hoy no, estoy en modo pijama', 'Ganó el pijama.'],
      ],
    },
    energie_semi: {
      t: 'Te proponen correr una media maratón dentro de seis meses.',
      o: 'Pregúntale qué reto deportivo le tienta.',
      a: [
        ['Me apunto, me motiva', 'Yo hago la pancarta.'],
        ['Quizá, si vamos en grupo', 'En pandilla todo es más fácil.'],
        ['Iré a animarte con un cruasán', 'El mejor puesto, sinceramente.'],
      ],
    },
    energie_cafe: {
      t: 'Tu café favorito es…',
      o: 'Pregúntale por su café o bar favorito del barrio.',
      a: [
        ['Una salita tranquila, con libros', 'Chis, leo por encima de tu hombro.'],
        ['Un sitio animado, música, gente que va y viene', 'Hay movimiento, me gusta.'],
      ],
    },
    energie_cinq_ans: {
      t: 'Dentro de cinco años, en el trabajo o en tus proyectos, quieres…',
      o: 'Pregúntale dónde estarán sus proyectos dentro de cinco años.',
      a: [
        ['Que todo vaya tranquilo', 'Tranquilo, pero seguro.'],
        ['Haber dado un salto', 'Ya veo la cima.'],
      ],
      m: 'Avanzar sin agotarse: buen plan.',
    },
    habitudes_courses: {
      t: 'La compra de la semana…',
      o: 'Pregúntale qué no puede evitar comprar.',
      a: [
        ['Una lista por pasillos, no se me olvida nada', '¿Me haces la mía?'],
        ['Improviso por los pasillos', 'Y sales con tres tipos de queso.'],
        ['A domicilio, prevista desde el domingo', 'Eficaz. Tomo nota.'],
      ],
    },
    habitudes_valise: {
      t: 'La maleta la haces…',
      o: 'Pregúntale qué se le olvida siempre de viaje.',
      a: [
        ['Tres días antes, con una lista', 'Seguro que tu lista tiene otra lista.'],
        ['La noche anterior', 'El gran clásico.'],
        ['Una hora antes de salir', '¿Has cogido calcetines?'],
      ],
    },
    habitudes_budget: {
      t: 'Tu dinero lo gestionas…',
      o: 'Pregúntale por su mejor capricho o su mejor ahorro.',
      a: [
        ['A ojo', 'Vivir el momento también es un presupuesto.'],
        ['Al céntimo', 'Hoja de cálculo abierta, respeto.'],
      ],
      m: 'Con un ojo encima, sin agobios.',
    },
    habitudes_dimanche_soir: {
      t: 'El domingo por la noche…',
      o: 'Pregúntale por su ritual del domingo por la noche.',
      a: [
        ['Preparas la semana', 'Que el lunes se prepare.'],
        ['Disfrutas hasta el último minuto', 'El lunes puede esperar.'],
      ],
    },
    habitudes_rdv: {
      t: 'Una cita a las 20 h. Llegas…',
      o: 'Pregúntale por su mejor excusa para llegar tarde.',
      a: [
        ['A las 19:50, siempre un poco antes', 'Nadie llega antes que tú.'],
        ['A las 20 en punto', 'Precisión suiza.'],
        ['A las 20:15, con una buena excusa', 'Me encantan tus excusas.'],
      ],
    },
    habitudes_diner: {
      t: 'Esta noche se cena…',
      o: 'Pregúntale cuál es el plato que mejor le sale.',
      a: [
        ['En casa, cocino yo', 'Huele bien hasta aquí.'],
        ['Fuera, me apetece ver gente', 'Reservo mesa para cuatro patas.'],
        ['Para llevar, en el sofá', 'Lo mejor de los dos mundos.'],
      ],
    },
    habitudes_week_end: {
      t: 'Tu fin de semana ideal está…',
      o: 'Pregúntale qué ha planeado este fin de semana. O no.',
      a: [
        ['Totalmente libre', 'El azar hace bien las cosas.'],
        ['Organizado de antemano', 'Qué planificación tan bonita.'],
      ],
      m: 'Un plan, pero no demasiado.',
    },
    habitudes_bureau: {
      t: 'Tu escritorio, ahora mismo…',
      o: 'Pregúntale por el objeto más improbable de su escritorio.',
      a: [
        ['Cada cosa en su sitio', 'No me atrevo a tocar nada.'],
        ['Un desorden alegre, pero sé dónde está todo', 'Un sistema, de verdad.'],
      ],
    },
    habitudes_matin: {
      t: 'Por la mañana, lo primero que haces…',
      o: 'Pregúntale cómo es su mañana perfecta.',
      a: [
        ['Pensar en todo lo que voy a hacer', 'Lista mental en marcha.'],
        ['Un café, en silencio, sin planes', 'Primero el café, luego el mundo.'],
      ],
    },
    habitudes_bouger: {
      t: 'Para moverte, prefieres…',
      o: 'Pregúntale qué deporte le gustaría probar.',
      a: [
        ['Yoga o caminar, tranquilo', 'Respira. Respiro contigo.'],
        ['Un deporte de equipo', 'Yo hago de mascota.'],
        ['¿Moverme? Camino hasta la nevera', 'Es cardio si corres.'],
      ],
    },
    valeurs_racines: {
      t: 'El lugar donde creciste es, para ti…',
      o: 'Pregúntale qué echa más de menos del lugar donde creció.',
      a: [
        ['Mi puerto de origen, vuelvo a menudo', 'Como en casa, en ningún sitio.'],
        ['Un buen recuerdo, mi vida está en otra parte', 'Siempre un paso más allá.'],
      ],
    },
    valeurs_temps_argent: {
      t: '¿Más tiempo libre o más dinero?',
      o: 'Pregúntale qué haría con un día libre más a la semana.',
      a: [
        ['Más tiempo', 'El tiempo, la verdadera riqueza.'],
        ['Más dinero', '¿Me invitas a merendar?'],
      ],
      m: 'Un poco de cada, razonable.',
    },
    valeurs_repas: {
      t: 'Las grandes comidas familiares…',
      o: 'Pregúntale por un plato de su infancia que todavía le encanta.',
      a: [
        ['Sagradas, nunca me las pierdo', 'Yo llevo el postre.'],
        ['Me gustan, pero a mi manera', 'Las tradiciones, a tu estilo.'],
        ['Prefiero las fiestas con amigos', 'La familia que se elige.'],
      ],
    },
    valeurs_demenagement: {
      t: 'Un amigo se muda el sábado, a las 8 h.',
      o: 'Pregúntale por su mejor o peor mudanza.',
      a: [
        ['Llevo cajas y cruasanes', 'Corazón de oro, certificado.'],
        ['Me paso por la noche para la pizza', 'La pizza, la mejor parte.'],
        ['Presto el coche, no la espalda', 'Tu espalda te lo agradece.'],
      ],
    },
    valeurs_reussite: {
      t: 'Para ti, una vida lograda es ante todo…',
      o: 'Pregúntale de qué está orgulloso u orgullosa ahora.',
      a: [
        ['Haber construido algo', 'Ya te veo con una estatua.'],
        ['Tiempo para lo que me gusta', 'Sabio. Muy sabio.'],
        ['Gente que quiero a mi alrededor', 'El mayor tesoro.'],
      ],
    },
    valeurs_etranger: {
      t: '¿Vivir un año en el extranjero, ahora mismo?',
      o: 'Pregúntale en qué ciudad viviría un año.',
      a: [
        ['No, gracias, estoy bien aquí', 'Aquí está tu hogar.'],
        ['Me voy mañana', 'Me cuelo en tu maleta.'],
      ],
      m: '¿Por qué no?… algún día.',
    },
    valeurs_chez_toi: {
      t: 'Tu casa ideal es…',
      o: 'Pregúntale cuál es su rincón favorito de casa.',
      a: [
        ['Un nido por el que siempre pasa gente', 'Me pido el sofá.'],
        ['Un sitio mío, tranquilo, con mis reglas', 'Tu reino, tus reglas.'],
        ['Ningún sitio fijo: donde esté', 'Nómada de corazón.'],
      ],
    },
    valeurs_occasion: {
      t: 'Una gran oportunidad, pero hay que decidir en una hora.',
      o: 'Pregúntale por la mejor decisión que tomó por impulso.',
      a: [
        ['Me lanzo', '¡Qué vértigo!'],
        ['Pido tiempo para pensarlo', 'Pensar ya es actuar.'],
      ],
    },
    valeurs_dix_ans: {
      t: 'Dentro de diez años te ves…',
      o: 'Pregúntale cómo sería un gran día dentro de diez años.',
      a: [
        ['Con una gran tribu a mi alrededor', 'Hará falta una mesa enorme.'],
        ['Libre como el aire, sin ataduras', 'El viento en el pelaje.'],
        ['Ni idea, y está muy bien así', 'El futuro es una sorpresa.'],
      ],
    },
    valeurs_boulot: {
      t: 'Tu trabajo ideal es más bien…',
      o: 'Pregúntale qué quería ser de pequeño o pequeña.',
      a: [
        ['Estable, sé adónde voy', 'Sólido como una roca.'],
        ['Cambiante, lleno de sorpresas', 'La montaña rusa te pega.'],
      ],
      m: 'Sólido, con un toque picante.',
    },
    autres_silence: {
      t: 'Alguien que te cae bien no contesta desde hace dos días.',
      o: 'Pregúntale por el mejor mensaje que ha recibido.',
      a: [
        ['No pasa nada, cada uno a su ritmo', 'Zen total.'],
        ['Le escribo algo gracioso', 'El meme perfecto existe.'],
        ['Me pregunto si dije algo', 'Seguro que no. Respira.'],
      ],
    },
    autres_bande: {
      t: 'Tus amigos son más bien…',
      o: 'Pregúntale cómo conoció a sus mejores amigos.',
      a: [
        ['Una gran pandilla, siempre hay gente', 'Quiero entrar en el grupo.'],
        ['Dos o tres, pero para toda la vida', 'Pocos, pero buenos.'],
      ],
    },
    autres_improviste: {
      t: 'Unos amigos se presentan en tu casa sin avisar.',
      o: 'Pregúntale qué ofrece cuando le visitan por sorpresa.',
      a: [
        ['Genial, saco los vasos', '¡La puerta siempre abierta!'],
        ['Encantado, pero avisad la próxima vez', 'Un mensaje no cuesta nada.'],
      ],
    },
    autres_anniversaire: {
      t: 'Para tu cumpleaños sueñas con…',
      o: 'Pregúntale por su mejor cumpleaños.',
      a: [
        ['Una gran fiesta, todo el mundo invitado', 'Yo llevo el confeti.'],
        ['Una cena con unos pocos', 'Pocos, pero qué momento.'],
        ['Que se olviden un poco, la verdad', 'Silencio. No he visto nada.'],
      ],
    },
    autres_conseil: {
      t: 'Un amigo te pide consejo para una gran decisión.',
      o: 'Pregúntale por el mejor consejo que le han dado.',
      a: [
        ['Hacemos la lista de pros y contras', 'La lista, arma definitiva.'],
        ['Hazle caso a tu instinto', 'La tripa siempre tiene razón.'],
        ['Lo hablamos con una pizza', 'La pizza ayuda a pensar, está demostrado.'],
      ],
    },
    autres_rencontrer: {
      t: 'Conocer gente nueva, para ti es…',
      o: 'Pregúntale por el encuentro más inesperado de su vida.',
      a: [
        ['Intimidante', 'Tranquilidad, yo hago las presentaciones.'],
        ['Emocionante', 'Te va a encantar lo que preparamos.'],
      ],
      m: 'Depende del día, es normal.',
    },
    autres_proches: {
      t: 'Con tu gente, necesitas…',
      o: 'Pregúntale cómo mantiene el contacto con su gente.',
      a: [
        ['Mucho espacio', '¡Aire, aire!'],
        ['Mucha presencia', '¿Cuenta un abrazo de minimoa?'],
      ],
      m: 'Cerca, pero sin agobiar.',
    },
    autres_vacances: {
      t: 'Vacaciones con amigos: ¿quién organiza?',
      o: 'Pregúntale por sus mejores vacaciones con amigos.',
      a: [
        ['Yo, con una hoja de cálculo compartida', '¿Tiene una pestaña de «imprevistos»?'],
        ['Echo una mano', 'La mano derecha ideal.'],
        ['Los demás, yo me dejo llevar', 'Tú pones el buen humor.'],
      ],
    },
    autres_voisins: {
      t: 'Tus vecinos…',
      o: 'Pregúntale por el rincón secreto de su barrio.',
      a: [
        ['Sé cómo se llaman, y su gato también', 'El barrio es familia.'],
        ['Un hola educado en la escalera', 'Cortés y discreto.'],
        ['¿Hay vecinos?', 'Un misterio por resolver.'],
      ],
    },
    autres_annule: {
      t: 'Un plan se cae en el último minuto.',
      o: 'Pregúntale qué hace con una tarde libre inesperada.',
      a: [
        ['Genial, una tarde libre', 'El mejor de los regalos.'],
        ['Me fastidia, lo tenía todo organizado', 'Tu agenda llora un poco.'],
      ],
    },
    gouts_voyage: {
      t: 'Tu viaje soñado…',
      o: 'Pregúntale por el viaje que sueña hacer.',
      a: [
        ['Un país cuyo idioma no hablo', 'Repaso el diccionario.'],
        ['Una casa en el campo, con amigos', 'La felicidad a dos horas.'],
        ['Una gran ciudad, museos y terrazas', 'Cojo el plano del metro.'],
      ],
    },
    gouts_resto: {
      t: 'En un restaurante pides…',
      o: 'Pregúntale por el plato más raro que ha probado.',
      a: [
        ['El plato que no conozco', '¡Paladar aventurero!'],
        ['Mi plato favorito, siempre el mismo', '¿Para qué cambiar lo que funciona?'],
      ],
    },
    gouts_musique: {
      t: 'Música esta noche, mejor…',
      o: 'Pregúntale qué canción escucha en bucle.',
      a: [
        ['Un álbum entero, con cascos', 'Viaje sonoro, no molestar.'],
        ['Un concierto, en primera fila', 'Grito las letras contigo.'],
        ['Un barecito con un grupo local', 'Los mejores descubrimientos.'],
      ],
    },
    gouts_nature_ville: {
      t: 'Para vivir, prefieres…',
      o: 'Pregúntale por su rincón favorito de naturaleza, o de ciudad.',
      a: [
        ['La naturaleza, el silencio', 'Los pájaros te saludan.'],
        ['La ciudad, la energía', 'Los neones también son bonitos.'],
      ],
      m: '¿Una ciudad con un gran parque?',
    },
    gouts_nouveau: {
      t: 'Probar cosas nuevas…',
      o: 'Pregúntale qué fue lo último que probó por primera vez.',
      a: [
        ['Prefiero lo que conozco', 'Lo seguro tranquiliza.'],
        ['Me encanta, cuanto más raro mejor', 'Te he encontrado una clase de trapecio.'],
      ],
      m: 'De vez en cuando, sí.',
    },
    gouts_film: {
      t: '¿Una peli esta noche?',
      o: 'Pregúntale qué película vería cien veces.',
      a: [
        ['Un clásico que he visto diez veces', 'Te sabes los diálogos de memoria.'],
        ['Una joya subtitulada de la que nadie habla', '¡Qué fino! Llevo las palomitas.'],
        ['El taquillazo del momento', 'Emoción garantizada.'],
      ],
    },
    gouts_fin_week_end: {
      t: 'Un fin de semana perfecto termina…',
      o: 'Pregúntale por su mejor domingo por la noche.',
      a: [
        ['En un sitio que no conocía', 'Explorar es lo tuyo.'],
        ['En casa, con un buen plato', 'Nada como tus zapatillas.'],
      ],
    },
    gouts_temps_libre: {
      t: 'Tu tiempo libre se parece más a…',
      o: 'Pregúntale qué está aprendiendo ahora.',
      a: [
        ['Aficiones por gusto, sin objetivo', 'El placer basta.'],
        ['Cosas en las que mejoro (un idioma, un instrumento)', 'Pronto imbatible.'],
      ],
    },
    gouts_saison: {
      t: 'Tu estación favorita…',
      o: 'Pregúntale por su mejor recuerdo de su estación favorita.',
      a: [
        ['El invierno: manta, sopa, velas', 'La manta es tuya.'],
        ['El verano: terrazas hasta medianoche', '¡Noches largas, sí!'],
        ['El otoño: paseos y hojas secas', 'Cruje bajo mis patas.'],
        ['La primavera: todo vuelve a empezar', 'El gran despertar.'],
      ],
    },
    gouts_surprise: {
      t: 'Te regalan un fin de semana sorpresa: no sabes adónde vas.',
      o: 'Pregúntale por la mejor sorpresa que le han dado.',
      a: [
        ['Un sueño', 'Maleta hecha en cinco minutos.'],
        ['Me gustaría saber al menos qué llevar', 'Llevar un jersey es de sabios.'],
      ],
    },
  },
};
