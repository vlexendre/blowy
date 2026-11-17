import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Política de privacidad — Minimoa',
  heading: 'Política de privacidad',
  description: 'Los datos que usa Minimoa, para qué, con qué base jurídica, durante cuánto tiempo, quién tiene acceso y cómo ejercer tus derechos.',
  intro: 'Lo que sabemos de ti, para qué, quién tiene acceso, cuánto tiempo lo guardamos y cómo borrarlo todo.',
  summary: {
    title: 'En resumen',
    items: [
      'Usamos tus datos para una sola cosa: dar vida a tu minimoa y presentarte a personas compatibles. **Sin publicidad, sin reventa.**',
      'No te preguntamos qué buscas: tu minimoa crea vínculos, y lo que lleguen a ser depende de vosotros. **No recogemos ningún dato sobre tu orientación.**',
      'Tu **ubicación** solo se usa con la app abierta, y **nunca se guarda exacta**: solo guardamos un punto redondeado a unos 300 m y tu zona. En el mapa, los demás ven una posición redondeada y desplazada, nunca en tiempo real, y el **modo discreto** te quita del mapa. Sin ubicación, eliges tu ciudad a mano.',
      'Una **IA de terceros**, la de {{sub.ai.provider}} ({{sub.ai.location}}), interviene en cuatro sitios, detallados [más abajo](#ia): la lectura de los chats si la activáis los dos, tus fotos de prueba si lo aceptas, la comprobación de seguridad de las fotos de perfil y de algunos mensajes, y el resumen de la semana, enviado sin ningún nombre.',
      '**Nadie en Minimoa lee tus conversaciones**, salvo un mensaje denunciado (por alguien o por nuestro filtro automático) y su contexto inmediato, que lee un moderador.',
      'Puedes cambiarlo todo en la app y [eliminar tu cuenta](@supprimer-mon-compte) en cualquier momento. Para lo demás: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quién es el responsable', id: 'responsable' },
    {
      p: 'El responsable del tratamiento es **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, que edita la app y el sitio web de Minimoa ([aviso legal](@mentions-legales)).',
    },
    { ul: ['Para cualquier pregunta sobre tus datos: {{email.privacy}}.', 'Delegado de protección de datos: {{dpo.name}}.'] },
    { p: 'Esta política se aplica a la app Minimoa y al sitio minimoa.app. Para las cookies del sitio, consulta la [página de cookies](@cookies).' },

    { h2: '2. Lo que usamos, y para qué', id: 'donnees' },
    {
      p: 'Para cada uso: los datos afectados, la finalidad, la base jurídica (lo que nos autoriza a hacerlo según el RGPD), el plazo de conservación y quién tiene acceso. Los plazos se resumen en la [tabla de plazos](#durees).',
    },

    { h3: 'Tu cuenta' },
    {
      ul: [
        '**Datos:** el identificador que nos transmite Apple o Google cuando inicias sesión, y la dirección de correo asociada. Con Apple, puede ser una dirección de reenvío que oculta la real. Con Apple, guardamos también un token de inicio de sesión emitido por Apple, que solo sirve para revocar el acceso de Minimoa a tu ID de Apple cuando eliminas tu cuenta.',
        '**Finalidad:** crear tu cuenta, volver a conectarte, proteger el acceso y escribirte sobre tu cuenta (bienvenida, nuevo vínculo, recordatorio de fin de prueba, aviso de moderación, aviso antes de una eliminación por inactividad).',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista tu cuenta. Al eliminarla, el token de Apple se revoca primero ante Apple y después se borra. Una cuenta sin conexión durante 2 años se elimina, tras un correo de aviso enviado 30 días antes.',
        '**Acceso:** el equipo autorizado de Minimoa, nuestro proveedor de autenticación y nuestro proveedor de correo. Apple o Google saben que usas Minimoa, ya que el inicio de sesión pasa por ellos.',
      ],
    },

    { h3: 'Tu nombre y tu fecha de nacimiento' },
    {
      ul: [
        '**Datos:** el nombre (o apodo) que eliges; tu fecha de nacimiento.',
        '**Finalidad:** tu nombre te presenta a los demás. Pasa por nuestro filtro automático antes de guardarse (ver [moderación](#signalements)). La fecha de nacimiento comprueba que tienes 18 años o más, y sirve para el filtro de edad de los encuentros.',
        '**Base jurídica:** ejecución del contrato; para la edad y el filtro, también nuestro interés legítimo en proteger a los menores y a la comunidad.',
        '**Plazo:** mientras exista tu cuenta. Si tienes menos de 18 años, el registro se detiene antes del inicio de sesión y no se guarda nada.',
        '**Acceso:** tu nombre es visible para las personas que tu minimoa te presenta y para tus vínculos. Tu fecha de nacimiento no se muestra a los demás.',
      ],
    },

    { h3: 'Tu foto de perfil', id: 'photo-profil' },
    {
      ul: [
        '**Datos:** la foto que eliges, si añades una (es opcional), hecha con la cámara o elegida de tu galería.',
        '**Finalidad:** mostrarte a tus vínculos: queda oculta en un vínculo hasta el nivel 4, borrosa en el nivel 4 y nítida a partir del nivel 5.',
        '**Comprobación de seguridad:** antes de publicarse, la foto se reduce y se envía a nuestro proveedor de IA, {{sub.ai.provider}}, que comprueba que no muestra desnudos, ni a nadie que parezca menor, ni violencia, ni odio, ni publicidad. Te lo decimos en la app antes de que elijas la foto. Una foto rechazada se borra al instante, y el equipo de moderación recibe una denuncia automática, sin la foto. Si la comprobación no es posible en ese momento, la foto se publica y se comprueba un poco más tarde. Esta comprobación no se puede desactivar: protege a todo el mundo. Sin foto de perfil, no se envía nada.',
        '**Base jurídica:** ejecución del contrato para mostrarla; nuestro interés legítimo y nuestras obligaciones de seguridad (filtrar los contenidos publicados) para la comprobación.',
        '**Plazo:** mientras la conserves. Cuando la cambias, la anterior se borra. Se borra cuando eliminas tu cuenta.',
        '**Acceso:** tus vínculos, según el nivel del vínculo; nuestro proveedor de IA, durante la comprobación.',
      ],
    },

    { h3: 'Tu sexo', id: 'sexe' },
    {
      ul: [
        '**Datos:** tu sexo (mujer, hombre, no binario o «prefiero no decirlo»).',
        '**Finalidad:** adaptar los textos de la app y elaborar estadísticas sin nombres. **No sirve para elegir a quién te presenta tu minimoa.**',
        '**Base jurídica:** nuestro interés legítimo. «Prefiero no decirlo» siempre es posible, y puedes cambiar tu respuesta en la app (**Yo → Ajustes → Quién eres**).',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** solo tú. Nunca se muestra a los demás.',
        'No te preguntamos qué buscas ni a quién quieres conocer: tu minimoa crea vínculos, y lo que lleguen a ser depende de vosotros. Las respuestas dadas a esas preguntas antes del 17 de noviembre de 2026, y el consentimiento que las acompañaba, se han borrado.',
      ],
    },

    { h3: 'Tu ubicación', id: 'localisation' },
    {
      ul: [
        '**Datos:** tu posición, **solo con la app abierta** (nunca en segundo plano). **Nunca se guarda tal cual**: nuestro servidor solo guarda el centro de la casilla de unos 300 m en la que estás, y tu zona de domicilio aproximada, deducida de ella (con la misma precisión). La posición exacta solo sirve, durante la petición, para saber si estás fuera de tu zona de domicilio.',
        '**Sin ubicación:** puedes elegir tu ciudad a mano (gratis; una vez cada 30 días, o cuando quieras con Minimoa+). En ese caso solo guardamos la ciudad elegida y su centro, que sirven de zona.',
        '**Finalidad:** mostrarte el mapa y los minimoas compatibles a tu alrededor; proponerte encuentros cercanos; confirmar que una salida ha tenido lugar fuera de tu zona de domicilio, para subir la sociabilidad de tu minimoa.',
        '**Lo que ven los demás:** nunca tu posición exacta. Ven una posición redondeada a unos 300 m y desplazada, nunca en tiempo real. El **modo discreto** te quita por completo del mapa.',
        '**Base jurídica:** tu consentimiento, dado a través del permiso de ubicación de tu teléfono o al elegir tu ciudad. Puedes retirarlo en cualquier momento: en los ajustes del teléfono, o en la app (**Yo → Ajustes → Mi ubicación → Olvidar mi ubicación**), lo que borra tu posición y tu zona.',
        '**Plazo:** el último punto redondeado y tu zona (o la ciudad elegida), sustituidos en cada actualización. No guardamos el historial de tus desplazamientos.',
        '**Acceso:** el equipo autorizado de Minimoa, nuestro proveedor de alojamiento y el proveedor del mapa base, que recibe desde tu teléfono la zona que aparece en pantalla.',
      ],
    },

    { h3: 'Tu visión y la compatibilidad' },
    {
      ul: [
        '**Datos:** tus respuestas al test de visión (12 situaciones), tus respuestas a las preguntas del día, los hábitos que eliges y los que mantienes, tu forma de cuidar a tu minimoa (regularidad, horarios, salidas) y las 3 palabras que tus amistades eligen para ti. De ahí deducimos tu «visión» en 5 ejes, con un índice de confianza, y un «estilo» (sociable, juguetón, tierno, charlatán).',
        '**Finalidad:** calcular la compatibilidad con otras personas y presentarte a las que encajan contigo; explicar cada encuentro; dar carácter a tu minimoa. Es una **elaboración de perfiles**, explicada en detalle [más abajo](#compatibilite).',
        '**Base jurídica:** ejecución del contrato (es el núcleo del servicio).',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** el algoritmo de encuentros. Una persona que se te presenta ve lo que tenéis en común y una diferencia, nunca tus respuestas ni una cifra suelta.',
      ],
    },
    { p: 'No te preguntamos tu religión, tus opiniones políticas ni tu salud.' },

    { h3: 'Tu minimoa, tus hábitos y tu racha' },
    {
      ul: [
        '**Datos:** el nombre y el aspecto de tu minimoa, sus indicadores (sociabilidad, hambre, energía, humor), los gestos que haces, tus hábitos y su ritmo, tu racha, tus comodines, tus objetos, tus retos del día, tu resumen de la semana. El nombre del minimoa pasa por nuestro filtro automático, como tu nombre.',
        '**Finalidad:** hacer funcionar el juego.',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** tú; tus vínculos y las personas presentadas ven tu minimoa y su estilo.',
      ],
    },

    { h3: 'Las fotos de prueba y de reto', id: 'preuves' },
    {
      ul: [
        '**Datos:** la foto que haces en la app cuando tu minimoa pide una prueba de un hábito (por ejemplo, tus zapatillas), o para un reto fotográfico del día. Se hace con la cámara, no desde tu galería.',
        '**Finalidad:** comprobar que un hábito se ha cumplido; contar un reto como superado.',
        '**Comprobación por una IA, solo si lo aceptas:** antes de tu primera prueba, la app te dice qué se envía, a quién y por qué, y tú eliges. Si aceptas, cada foto de prueba se reduce y se envía a {{sub.ai.provider}} con el nombre del hábito (ni tu nombre ni tu ubicación), que responde sí, no o «no estoy seguro», con una frase; si responde «no estoy seguro», confiamos en ti. Si no aceptas, **no se envía ninguna foto a una IA**: validas el hábito de palabra, sin foto, y tu racha avanza igual. Puedes cambiar de opinión cuando quieras en **Yo → La IA y tú**. Las fotos de los retos nunca se envían a una IA.',
        '**Base jurídica:** tu consentimiento, para la comprobación por la IA; ejecución del contrato, para el almacenamiento temporal.',
        '**Plazo:** **se borra de nuestro almacenamiento en un plazo de 24 h**, salvo que decidas guardarla en tus recuerdos privados (permanece allí hasta que dejes de guardarla o elimines tu cuenta).',
        '**Acceso:** **ningún ser humano la ve**, ni en Minimoa ni en ninguna otra parte de Minimoa. Solo {{sub.ai.provider}} recibe una foto de prueba, reducida, si lo has aceptado.',
      ],
    },
    { p: 'Evita fotografiar a otras personas, documentos o información sensible.' },

    { h3: 'Tus mensajes, y su lectura por una IA si la activáis', id: 'messages' },
    {
      ul: [
        '**Datos:** los mensajes que intercambias en tus vínculos, su fecha y lo que se ha leído.',
        '**Finalidad:** transmitirlos a la otra persona y conservarlos en vuestra conversación.',
        '**Filtro automático:** antes de enviarse, cada mensaje pasa por nuestro filtro, en nuestros servidores (listas de palabras en varios idiomas, sin IA). Una infracción clara (amenaza, odio, contenido sexual que implique a un menor, sexo de pago, estafa) no se envía: te decimos por qué, tu texto se queda en el campo y el equipo de moderación recibe una denuncia automática con un breve extracto. Un mensaje dudoso (insulto, contenido sexual explícito) se envía, pero se señala al equipo de moderación, y tu minimoa te propone una pausa.',
        '**Base jurídica:** ejecución del contrato; para el filtro, nuestro interés legítimo y nuestras obligaciones de seguridad.',
        '**Plazo:** mientras exista el vínculo, es decir, mientras existan vuestras dos cuentas. Salir de un vínculo lo quita de las listas de los dos sin borrar la conversación: vuelve si os reencontráis. Si uno de los dos elimina su cuenta, el vínculo y sus mensajes se borran para ambos.',
        '**Acceso:** tú y la otra persona. Un moderador puede leer un mensaje **denunciado**, por uno de vosotros o por el filtro, y su contexto inmediato (ver [denuncias](#signalements)).',
      ],
    },
    {
      note: 'La frase que la app os muestra antes de pediros el consentimiento: «Nadie en Minimoa lee tus conversaciones, salvo un mensaje denunciado y los pocos mensajes de alrededor, para la moderación. Si la activáis los dos, una IA lee vuestros últimos mensajes para que vuestros minimoas puedan reaccionar. Esta IA la proporciona {{sub.ai.provider}} ({{sub.ai.location}}), nuestro proveedor, que recibe estos mensajes por nuestra cuenta. Puedes retirar tu consentimiento cuando quieras.»',
    },
    {
      ul: [
        '**Consentimiento de cada uno:** os lo pedimos a los dos, la primera vez que abrís el chat (o una vez para todos tus chats, si eliges un ajuste por defecto). Si uno de los dos no ha dicho que sí, la IA no lee nada: los minimoas solo reaccionan al ritmo del vínculo (silencios, rachas, retos), con frases ya escritas.',
        '**Retirada:** en cualquier momento, en las opciones del vínculo, o para todos tus chats en **Yo → La IA y tú**. La lectura se detiene de inmediato.',
        '**Cómo:** no hay análisis de cada mensaje. Cuando algo lo activa (un silencio, cierto número de mensajes, un tono que sube), se envía a {{sub.ai.provider}} una breve ventana de los últimos mensajes, con los autores marcados A y B, sin vuestros nombres; la IA propone la reacción del minimoa. Como máximo 3 intervenciones al día por vínculo, y puedes desactivarlas para un vínculo. Si el tono sube, tu minimoa puede proponerte una pausa: ese mensaje solo lo ves tú.',
        '**Comprobación de seguridad:** en un chat en el que los dos habéis aceptado la lectura, un mensaje que deja dudas a nuestro filtro (un enlace, por ejemplo) también puede enviarse solo a {{sub.ai.provider}}, después de enviarlo, para comprobar que respeta las normas. Si no las respeta, se señala al equipo de moderación.',
        '**Lo que se guarda:** en Minimoa, nada de la ventana enviada ni del análisis; solo la reacción del minimoa aparece en el chat, como un mensaje. Lo que {{sub.ai.provider}} guarda por su parte, y durante cuánto tiempo: {{ai.retention}}.',
        '**Base jurídica:** el consentimiento de cada uno de vosotros.',
      ],
    },

    { h3: 'La racha y las etapas de un vínculo' },
    {
      ul: [
        '**Datos:** los días en los que cada uno de vosotros escribió en el vínculo (no el contenido de los mensajes) y las etapas del vínculo (encuentro, niveles superados, récords de racha). Para los vínculos anteriores al 15 de noviembre de 2026, las «fotos del día» que os enviasteis allí: Minimoa ya no recibe nuevas, y las antiguas se quedan en los recuerdos del vínculo.',
        '**Finalidad:** hacer vivir la racha del vínculo (los días seguidos en que os escribís los dos), sus vidas y sus niveles, y mostraros vuestros recuerdos.',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista el vínculo (mismas reglas que los mensajes): las antiguas fotos del día se borran cuando se borra el vínculo, o cuando uno de los dos elimina su cuenta.',
        '**Acceso:** tú y la otra persona del vínculo (sus fotos antiguas siguen borrosas para ti hasta el nivel 5). Las fotos se guardan en un espacio privado, accesibles solo mediante enlaces temporales.',
      ],
    },

    { h3: 'Las notificaciones y los correos' },
    {
      ul: [
        '**Datos:** el token técnico de tu teléfono para las notificaciones, tus ajustes por tipo de notificación, la hora elegida para el reto del día; en iPhone, los tokens de las actividades en directo.',
        '**Finalidad:** avisarte (reto del día, nuevo encuentro, mensaje, «te toca escribir» por la noche, vínculo o racha en peligro, prueba pedida, resumen, recordatorio de fin de prueba; primeros pasos durante los 7 primeros días, noticias de tu minimoa cuando no estás y en vuestros aniversarios, mensajes de tu suscripción a Minimoa+). Horas de silencio de 22 h a 8 h; fuera de los mensajes, 3 al día como máximo. El recordatorio de fin de prueba y los correos de tu suscripción (bienvenida, pago rechazado, final) también se envían por correo, aunque las notificaciones estén desactivadas. El correo tras 14 días de ausencia y el único recordatorio un mes después del final de Minimoa+ se desactivan con el mismo ajuste que la notificación («Noticias de tu minimoa», «Tu suscripción a Minimoa+»). En iPhone, el widget y las actividades en directo usan los mismos datos; una actividad en directo en la pantalla bloqueada nunca muestra el nombre de nadie.',
        '**Base jurídica:** tu consentimiento para las notificaciones, dado a través del permiso de tu teléfono (lo retiras en los ajustes del teléfono o tipo por tipo en la app); ejecución del contrato para los correos sobre tu cuenta y tu suscripción; interés legítimo para el correo de ausencia y el recordatorio tras el final de Minimoa+ (te opones desactivando el ajuste).',
        '**Plazo:** hasta que desactives las notificaciones o elimines tu cuenta. La lista de mensajes ya enviados (solo su tipo y su fecha, para no enviar nunca dos veces el mismo) se conserva 400 días como máximo.',
        '**Acceso:** nuestros proveedores de envío de notificaciones y de correos, y Apple o Google, que hacen llegar las notificaciones a tu teléfono.',
      ],
    },

    { h3: 'Las compras de Minimoa+' },
    {
      ul: [
        '**Datos:** la oferta elegida, las fechas de compra, de prueba y de renovación, el estado de la suscripción, el identificador de transacción. **Nunca recibimos tus datos de pago**: es Apple quien te factura.',
        '**Finalidad:** activar las funciones de Minimoa+, verificar la compra con Apple, gestionar la prueba y su recordatorio.',
        '**Base jurídica:** ejecución del contrato; obligaciones contables para las referencias de transacción.',
        '**Plazo:** el estado mientras exista tu cuenta; las referencias de transacción, desvinculadas de tu cuenta si se elimina, hasta 10 años (obligaciones contables).',
        '**Acceso:** el equipo autorizado de Minimoa; Apple, según su propia política.',
      ],
    },

    { h3: 'Filtrado, denuncias, bloqueos y moderación', id: 'signalements' },
    {
      ul: [
        '**Datos:** quién denuncia, a quién se denuncia, el vínculo afectado, el motivo, las precisiones escritas; el **mensaje denunciado y su contexto inmediato**; las denuncias automáticas de nuestro filtro (nombre o nombre de minimoa rechazado, mensaje no enviado con un extracto de 280 caracteres como máximo, mensaje dudoso, foto de perfil rechazada, sin la foto); los bloqueos; las decisiones de moderación y el registro de acciones.',
        '**Filtrado automático:** los nombres, los nombres de minimoa, los mensajes y las fotos de perfil se filtran antes de publicarse (ver más arriba). Un nombre rechazado no se guarda, y la app te dice por qué.',
        '**Finalidad:** proteger a las personas, tramitar las denuncias, aplicar las [normas](@regles), responder a las autoridades, impedir que una persona bloqueada contacte contigo. El equipo de moderación recibe un aviso por correo de cada nueva denuncia: de inmediato si es urgente (menor, amenaza), si no en un resumen. Objetivo: tramitarla en 24 h; pasado ese plazo, la denuncia sube al principio de la cola.',
        '**Suspensión automática, solo en dos casos:** un mensaje con vocabulario pederasta explícito, o una cuenta denunciada como menor por dos personas distintas. La cuenta queda suspendida 72 h como máximo, mientras un moderador la revisa; este levanta o confirma la suspensión. Fuera de estos dos casos y de los rechazos del filtro, ninguna sanción se toma sin una persona.',
        '**Impugnar:** puedes impugnar cualquier decisión que te afecte, automática o no, escribiendo a {{email.support}} (en la app, la pantalla de cuenta suspendida tiene un botón para ello). Una persona revisa la decisión.',
        '**Base jurídica:** nuestras obligaciones legales (en particular el Reglamento de Servicios Digitales) y nuestro interés legítimo en garantizar la seguridad de la comunidad.',
        '**Plazo:** ver la [tabla de plazos](#durees). Si eliminas tu cuenta, las denuncias que te afectan y el registro de decisiones permanecen hasta que se borran, sin vínculo con ninguna cuenta (el registro conserva el nombre afectado).',
        '**Acceso:** los moderadores autorizados de Minimoa y las autoridades si la ley lo exige. La persona denunciada no sabe quién la denunció. Una persona bloqueada no recibe aviso.',
      ],
    },

    { h3: 'De dónde vienes, y las etapas de tu recorrido', id: 'croissance' },
    {
      ul: [
        '**Datos:** cómo llegaste a Minimoa (el código de un creador, el enlace de «3 palabras» o de grupo que abriste, una invitación, o nada de eso), leído **solo** en el enlace que abriste antes de registrarte o en el código que escribiste («¿Tienes un código?»); la persona que te trajo, si la hay; y las grandes etapas de tu recorrido, una vez cada una: registro terminado, primer vínculo, regreso 1, 7 y 30 días después, inicio de la prueba y primer pago de Minimoa+.',
        '**Lo que no hacemos:** ninguna huella de tu dispositivo (ni modelo, ni dirección IP, ni identificador publicitario), ninguna herramienta de medición de terceros. Las visitas a las páginas públicas («3 palabras», invitación, grupo, código de creador), los primeros arranques de la app, los votos y los compartidos solo se **cuentan por día**, sin IP ni identificador: no hay nadie detrás de esos contadores.',
        '**Finalidad:** saber qué enlaces y qué creadores traen a gente que se queda, mejorar el recorrido, y regalar el objeto de armario «Padrino» a quien trajo a alguien y a quien llega (objeto decorativo, nunca ligado a una compra ni a una reseña).',
        '**Base legal:** nuestro interés legítimo.',
        '**Plazo:** la fuente y las etapas, mientras exista tu cuenta. Cuando la eliminas, la fuente se borra y las etapas pierden todo vínculo contigo (solo queda un número). Los contadores diarios se conservan sin límite.',
        '**Acceso:** unas pocas personas autorizadas del equipo, en la herramienta interna, solo como cifras. Un creador nunca ve quién llegó con su código.',
      ],
    },

    { h3: 'Estadísticas y administración' },
    {
      ul: [
        '**Datos:** cifras calculadas a partir de la actividad: número de cuentas, cuentas activas, retención, suscriptores y pruebas, rachas, mensajes de los minimoas, encuentros propuestos y aceptados, costes de la IA. Para calcularlas, anotamos los días en que abres la app y los encuentros propuestos a cada persona.',
        '**Finalidad:** dirigir y mejorar Minimoa, controlar los costes.',
        '**Base jurídica:** nuestro interés legítimo.',
        '**Cómo:** estas estadísticas se calculan a partir de nuestra propia base de datos, en una herramienta interna reservada a unas pocas personas autorizadas. No hay herramientas de medición de audiencia ni de publicidad en la app. La herramienta interna no da acceso a las conversaciones, salvo al mensaje denunciado y a su contexto inmediato.',
        '**Plazo:** días de actividad, 40 días; encuentros propuestos, 30 días; contador de uso de la IA por persona, 2 días; clasificación interna de los minimoas más activos (nombre y minimoa), 40 días. Las cifras agregadas, que no permiten identificarte, se conservan sin límite.',
      ],
    },

    { h3: 'Datos técnicos' },
    {
      ul: [
        '**Datos:** dirección IP, modelo y sistema del dispositivo, versión de la app, idioma, registros de errores y de conexión.',
        '**Finalidad:** hacer funcionar el servicio, protegerlo, limitar los abusos, corregir errores.',
        '**Base jurídica:** nuestro interés legítimo.',
        '**Plazo:** ver la [tabla de plazos](#durees).',
        '**Acceso:** el equipo técnico autorizado y nuestros proveedores de alojamiento.',
      ],
    },

    { h3: 'Las «3 palabras» y las invitaciones (personas sin cuenta)' },
    {
      ul: [
        '**Datos:** cuando alguien abre tu página de «3 palabras» o tu invitación en el sitio, mostramos tu nombre y tu minimoa. Para los votos, guardamos las palabras elegidas y una huella no reversible de la dirección IP y del navegador, para limitar los votos repetidos. No se pide ninguna cuenta.',
        '**Base jurídica:** ejecución del contrato en tu caso; nuestro interés legítimo en evitar abusos para la huella.',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** tú ves las palabras, nunca quién las eligió.',
      ],
    },

    { h3: 'Cuando nos escribes' },
    {
      ul: [
        '**Datos:** tu dirección de correo, tu mensaje y lo necesario para tramitar tu solicitud.',
        '**Base jurídica:** ejecución del contrato o nuestro interés legítimo en responderte; obligación legal para las solicitudes de ejercicio de tus derechos.',
        '**Plazo:** ver la [tabla de plazos](#durees).',
      ],
    },

    { h2: '3. Cómo funciona la compatibilidad', id: 'compatibilite' },
    { p: 'Tu minimoa solo te presenta a personas cuya visión de la vida va en la misma dirección que la tuya. Esta es la lógica, sin secretos:' },
    {
      ol: [
        '**Tu visión** se sitúa en 5 ejes: hogar (libre, en solitario ↔ formar un hogar), arraigo (quedarse aquí ↔ irse), impulso (tiempo para uno mismo ↔ grandes proyectos), ritmo (tranquilo, en casa ↔ intenso, fuera), rumbo (día a día ↔ preverlo todo). Cada eje tiene un índice de confianza.',
        '**De dónde viene**, con pesos iniciales: test de registro 40 % (y cada vez menos), pregunta del día 20 %, hábitos 25 %, tu forma de cuidar a tu minimoa 10 %, las 3 palabras de tus amistades 5 %. Cuanto más usas Minimoa, más sube la confianza.',
        '**Los filtros**: 18 años o más; la zona; las personas bloqueadas. Ni tu sexo ni el de los demás filtran a quién se te presenta.',
        '**La puntuación**: la cercanía en los 5 ejes, ponderada por la confianza. El eje hogar cuenta menos que los demás. El estilo (sociable, juguetón, tierno, charlatán) no entra en la puntuación.',
        '**El umbral**: por debajo del 70 %, no se propone a nadie, aunque eso signifique mostrar menos personas.',
        '**La explicación**: cada encuentro dice por qué, con 3 puntos en común y 1 diferencia por explorar. Nunca una cifra suelta.',
        '**El número de encuentros** también depende de la forma de tu minimoa (cuanto más lo cuidas, más gente te presenta) y de tu suscripción.',
      ],
    },
    { p: 'Tu visión es orientativa: es «tu visión, por ahora». No es un diagnóstico, y no usamos ningún vocabulario médico ni psicológico.' },
    {
      p: '**Ninguna decisión que produzca efectos jurídicos** sobre ti, o que te afecte de forma similar, se toma con este cálculo. Solo decide a quién te presenta tu minimoa; siempre eres tú quien decide saludar, aceptar o ignorar. Puedes pedirnos explicaciones, impugnar un resultado u oponerte a este tratamiento escribiendo a {{email.privacy}}; en este último caso, ya no podremos presentarte a nadie.',
    },

    { h2: '4. La inteligencia artificial', id: 'ia' },
    {
      p: 'Minimoa usa la IA de **{{sub.ai.provider}}** ({{sub.ai.location}}), un proveedor externo, en cuatro sitios y en ningún otro. Todo se ve, y lo que puede retirarse se retira, en la app: **Yo → La IA y tú**.',
    },
    {
      table: {
        head: ['Uso', 'Cuándo', 'Lo que recibe el proveedor', 'Lo que guarda Minimoa'],
        rows: [
          [
            'Lectura de los chats',
            'Solo si la habéis activado los dos; se puede retirar en cualquier momento',
            'Una breve ventana de los últimos mensajes del vínculo, con los autores marcados A y B, sin vuestros nombres',
            'Nada de la ventana ni del análisis. Solo la reacción del minimoa aparece en el chat.',
          ],
          [
            'Fotos de prueba de hábitos',
            'Solo si lo has aceptado, una vez, antes de tu primera prueba; se puede retirar. Sin consentimiento: validación de palabra, sin foto',
            'La foto reducida y el nombre del hábito',
            'La respuesta (sí, no, no estoy seguro). La foto se borra en 24 h, salvo que la guardes.',
          ],
          [
            'Comprobaciones de seguridad',
            'Cada foto de perfil, antes de publicarse (no se puede desactivar); un mensaje que deja dudas al filtro, solo en un chat en el que los dos habéis aceptado la lectura',
            'La foto de perfil reducida; o ese único mensaje',
            'La decisión (aceptada, o rechazada y señalada a la moderación). Una foto rechazada se borra.',
          ],
          [
            'Resumen de la semana',
            'Las semanas activas, para reformular tu resumen',
            'Un texto hecho de cifras y frases generales, sin ningún nombre (ni el tuyo, ni el de tus vínculos, ni el de tu minimoa): nada que permita identificarte',
            'El texto del resumen, en la app.',
          ],
        ],
      },
    },
    {
      p: 'Nunca enviamos al proveedor de IA tu dirección de correo, tu fecha de nacimiento, tu ubicación ni el identificador de tu cuenta. Actúa como encargado del tratamiento: trata estos datos solo para nosotros, siguiendo nuestras instrucciones, y no para sus propios fines. Lo que guarda por su parte, y durante cuánto tiempo: {{ai.retention}}. Las fotos de los retos del día nunca se envían a una IA. Sin consentimiento para la lectura de los chats, los minimoas hablan con frases ya escritas, sin IA.',
    },
    {
      p: 'Las respuestas de la IA pueden equivocarse: no tienen ningún efecto jurídico. Si hay dudas sobre una prueba, confiamos en ti; una foto de perfil rechazada por error puede comunicarse a {{email.support}}.',
    },

    { h2: '5. Lo que ven los demás', id: 'visibilite' },
    {
      ul: [
        '**Las personas que tu minimoa te presenta** ven tu nombre, tu minimoa, su estilo, lo que tenéis en común y una diferencia, y tu posición aproximada en el mapa (salvo en modo discreto).',
        '**Tus vínculos** ven además vuestros mensajes, vuestra racha, las etapas de vuestro vínculo, vuestras antiguas fotos del día si las hay, y tu foto de perfil si tienes una (oculta hasta el nivel 4, borrosa en el nivel 4, nítida a partir del nivel 5).',
        '**Los visitantes de tu página de «3 palabras» o de tu invitación** ven tu nombre y tu minimoa.',
        'Nadie ve tu dirección de correo, tu fecha de nacimiento, tu sexo, ni tus respuestas al test de visión. Tu posición exacta no se guarda en ningún sitio. Tus fotos de prueba no las ve ningún ser humano, y se borran en un plazo de 24 h (salvo que las guardes en tus recuerdos privados).',
      ],
    },

    { h2: '6. Nuestros proveedores', id: 'prestataires' },
    { p: 'Estos encargados del tratamiento tratan datos por nuestra cuenta, siguiendo nuestras instrucciones, con un contrato conforme al artículo 28 del RGPD:' },
    {
      subprocessors: {
        head: ['Función', 'Proveedor', 'Lugar de tratamiento', 'Garantía si fuera de la UE'],
        roles: {
          database: 'Base de datos, autenticación y almacenamiento de fotos',
          api: 'Alojamiento del servidor de la app (API)',
          ai: 'IA: lectura de los chats si la activáis los dos, fotos de prueba si lo aceptas, comprobación de seguridad de las fotos de perfil y de algunos mensajes, resumen de la semana (sin nombres)',
          email: 'Envío de correos (cuenta, recordatorio de fin de prueba, alertas de moderación)',
          push: 'Envío de notificaciones',
          maps: 'Mapa base',
          site: 'Alojamiento del sitio minimoa.app',
        },
      },
    },
    {
      p: '**Apple y Google** también intervienen, por su propia cuenta y según sus propias políticas: inicio de sesión (Sign in with Apple, Google), distribución de la app (App Store, Google Play), pago de Minimoa+ (App Store) y envío de las notificaciones.',
    },
    { p: 'Por último, podemos tener que comunicar datos a las autoridades cuando la ley lo exige.' },

    { h2: '7. Transferencias fuera de la Unión Europea', id: 'transferts' },
    {
      p: 'Damos prioridad a proveedores que tratan los datos en la Unión Europea. Cuando un proveedor trata datos fuera de la UE (la tabla anterior lo indica, por ejemplo nuestro proveedor de IA), la transferencia está cubierta por la garantía indicada en la tabla: una decisión de adecuación de la Comisión Europea (por ejemplo, el Marco de Privacidad de Datos UE-EE. UU., para las empresas certificadas) o las cláusulas contractuales tipo de la Comisión. Puedes obtener una copia escribiendo a {{email.privacy}}.',
    },

    { h2: '8. Cuánto tiempo guardamos tus datos', id: 'durees' },
    {
      table: {
        head: ['Dato', 'Plazo'],
        rows: [
          ['Cuenta, perfil, visión, minimoa, hábitos, ajustes', 'Mientras exista tu cuenta. Se borran en cuanto la eliminas.'],
          ['Cuenta inactiva', 'Se elimina tras 2 años sin conexión, después de un correo de aviso enviado 30 días antes.'],
          ['Token de inicio de sesión de Apple', 'Mientras exista tu cuenta. Revocado ante Apple y después borrado cuando la eliminas.'],
          ['Ubicación', 'Solo el último punto redondeado (unos 300 m) y tu zona, o la ciudad elegida, sustituidos en cada actualización. Se borran si olvidas tu ubicación.'],
          ['Foto de perfil', 'Mientras la conserves. La anterior se borra cuando la cambias; una foto rechazada por la comprobación se borra al instante.'],
          ['Fotos de prueba y de reto', 'En 24 h, salvo que las guardes en tus recuerdos privados (hasta que dejes de guardarlas o elimines tu cuenta).'],
          ['Lo que se envía a la IA', 'Minimoa no guarda nada, salvo la respuesta (reacción del minimoa, veredicto de una prueba, decisión de seguridad, texto del resumen). En el proveedor: {{ai.retention}}.'],
          ['Mensajes, racha, etapas y antiguas fotos del día de un vínculo', 'Mientras exista el vínculo, es decir, hasta que uno de los dos elimine su cuenta.'],
          ['Compras', 'Estado mientras exista la cuenta; referencias de transacción hasta 10 años (obligaciones contables), desvinculadas de la cuenta si se elimina.'],
          ['Denuncias tramitadas y decisiones de moderación', '1 año después del cierre del expediente, más tiempo solo si la ley lo exige.'],
          ['Exclusión definitiva', 'Una huella no reversible del identificador de Apple o Google de la cuenta, durante 3 años, para impedir un nuevo registro.'],
          ['Estadísticas', 'Días de actividad y clasificación interna nominativa: 40 días. Encuentros propuestos: 30 días. Cifras agregadas, que no permiten identificarte: sin límite.'],
          ['Fuente de llegada y etapas del recorrido', 'Mientras exista tu cuenta; borradas o anonimizadas al eliminarla. Contadores diarios (visitas, primeros arranques, votos, compartidos), sin nadie detrás: sin límite.'],
          ['Registros técnicos de la app', '30 días como máximo. Los registros de nuestros proveedores de alojamiento siguen sus propios plazos.'],
          ['Intercambios con el soporte', '1 año después del cierre de la solicitud.'],
          ['Solicitudes de ejercicio de tus derechos', '5 años, para poder demostrar que respondimos.'],
          ['Copias de seguridad', 'Se sobrescriben a medida que rotan en nuestro proveedor de datos: {{dataHost.backupRetention}}.'],
        ],
      },
    },

    { h2: '9. Tus derechos', id: 'droits' },
    { p: 'Según el RGPD y la ley francesa de protección de datos, puedes en cualquier momento:' },
    {
      ul: [
        '**acceder** a tus datos y obtener una copia;',
        'hacer que se **corrijan** (muchos se modifican directamente en la app);',
        'hacer que se **borren** ([eliminar tu cuenta](@supprimer-mon-compte) lo hace de una vez);',
        '**retirar tu consentimiento** cuando fundamenta un tratamiento (ubicación, comprobación de las fotos de prueba por la IA, lectura de los mensajes por la IA, notificaciones), sin que ello afecte a lo realizado antes;',
        '**oponerte** a un tratamiento basado en nuestro interés legítimo, o pedir su **limitación**;',
        'recuperar los datos que nos has facilitado en un formato legible por máquina (**portabilidad**);',
        'establecer **directrices** sobre el destino de tus datos tras tu fallecimiento.',
      ],
    },
    {
      p: 'Para ejercer estos derechos, escribe a {{email.privacy}} o a la dirección postal de {{publisher.name}}: {{publisher.address}}. Respondemos en el plazo de un mes; este plazo puede ampliarse dos meses para una solicitud compleja, y en ese caso te avisamos. Podemos pedirte que demuestres que la solicitud viene de ti.',
    },
    {
      p: 'Si consideras que no se respetan tus derechos, puedes presentar una reclamación ante la **CNIL**, la autoridad francesa de protección de datos (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Francia, [cnil.fr](https://www.cnil.fr/fr/plaintes)), o ante la autoridad de protección de datos de tu país de residencia en la Unión Europea.',
    },

    { h2: '10. Solo para adultos', id: 'mineurs' },
    {
      p: 'Minimoa está reservado a personas de 18 años o más. Pedimos la fecha de nacimiento antes del inicio de sesión; por debajo de 18 años, el registro se detiene y no se crea nada. No recogemos a sabiendas datos de menores. Si nos enteramos de que una cuenta pertenece a una persona menor, se elimina. Puedes avisarnos desde la app con el motivo «Persona menor»; una cuenta denunciada así por dos personas distintas queda suspendida hasta que la revise un moderador.',
    },

    { h2: '11. Seguridad', id: 'securite' },
    {
      ul: [
        'Los intercambios entre la app, el sitio y nuestros servidores están cifrados en tránsito (HTTPS).',
        'No guardamos contraseñas: el inicio de sesión pasa por Apple o Google.',
        'Las fotos están en un almacenamiento privado, accesibles solo mediante enlaces temporales.',
        'El acceso a los datos está limitado a las personas que lo necesitan; la herramienta de administración está reservada a personas autorizadas, de solo lectura salvo para la moderación, y sus acciones quedan registradas.',
        'Guardamos lo mínimo: ubicación nunca guardada exacta, fotos de prueba y de reto borradas en 24 h, nada guardado en Minimoa de lo que se envía a la IA.',
      ],
    },
    {
      p: 'Ningún sistema es infalible. En caso de violación de datos, avisamos a la CNIL en un plazo de 72 horas cuando la ley lo exige, y te avisamos directamente si supone un riesgo elevado para ti.',
    },

    { h2: '12. Cambios', id: 'changements' },
    {
      p: 'Si modificamos esta política de forma importante (por ejemplo, un nuevo uso de tus datos), te avisamos en la app antes de que los cambios se apliquen, y volvemos a pedirte tu consentimiento cuando sea necesario. La fecha de la última actualización figura en la parte superior de esta página.',
    },
  ],
};
