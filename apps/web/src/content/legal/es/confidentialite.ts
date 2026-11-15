import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Política de privacidad — Blowy',
  heading: 'Política de privacidad',
  description: 'Los datos que usa Blowy, para qué, con qué base jurídica, durante cuánto tiempo, quién tiene acceso y cómo ejercer tus derechos.',
  intro: 'Lo que sabemos de ti, para qué, quién tiene acceso, cuánto tiempo lo guardamos y cómo borrarlo todo.',
  summary: {
    title: 'En resumen',
    items: [
      'Usamos tus datos para una sola cosa: dar vida a tu minimoa y presentarte a personas compatibles. **Sin publicidad y sin venta de datos.**',
      'Lo que buscas y a quién quieres conocer puede revelar tu orientación sexual: te pedimos un **consentimiento explícito**, y puedes retirarlo.',
      'Tu **ubicación** solo se usa con la app abierta. En el mapa se redondea y se desplaza, nunca en tiempo real, y el **modo discreto** te quita del mapa.',
      'Tus **fotos de prueba** las verifica una IA, no las ve ningún humano y se eliminan en 24 horas (salvo si las guardas).',
      '**Ningún humano lee tus conversaciones.** Si los dos lo activáis, una IA lee vuestros mensajes para que vuestros minimoas puedan reaccionar. No se conserva nada después. Única excepción humana: un mensaje denunciado y su contexto inmediato, leídos por un moderador.',
      'Puedes cambiarlo todo en la app y [eliminar tu cuenta](@supprimer-mon-compte) en cualquier momento. Para lo demás: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quién es el responsable', id: 'responsable' },
    {
      p: 'El responsable del tratamiento es **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, que edita la app y la web de Blowy ([aviso legal](@mentions-legales)).',
    },
    { ul: ['Para cualquier pregunta sobre tus datos: {{email.privacy}}.', 'Delegado de protección de datos: {{dpo.name}}.'] },
    { p: 'Esta política se aplica a la app Blowy y a la web blowy.app. Para las cookies de la web, consulta la [página de cookies](@cookies).' },

    { h2: '2. Qué usamos y para qué', id: 'donnees' },
    {
      p: 'Para cada uso: los datos afectados, la finalidad, la base jurídica (lo que nos autoriza a hacerlo según el RGPD), el plazo de conservación y quién tiene acceso. Los plazos se resumen en la [tabla de plazos](#durees).',
    },

    { h3: 'Tu cuenta' },
    {
      ul: [
        '**Datos:** el identificador que nos envía Apple o Google al iniciar sesión y la dirección de correo asociada. Con Apple, puede ser una dirección de reenvío que oculta la real.',
        '**Finalidad:** crear tu cuenta, volver a iniciar sesión, proteger el acceso, escribirte sobre tu cuenta.',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** el personal autorizado de Blowy y nuestro proveedor de autenticación. Apple o Google saben que usas Blowy, ya que el inicio de sesión pasa por ellos.',
      ],
    },

    { h3: 'Tu nombre y tu fecha de nacimiento' },
    {
      ul: [
        '**Datos:** el nombre (o apodo) que eliges; tu fecha de nacimiento.',
        '**Finalidad:** el nombre te presenta a los demás. La fecha de nacimiento comprueba que tienes 18 años o más y sirve para el filtro de edad de los encuentros.',
        '**Base jurídica:** ejecución del contrato; para la edad, también nuestro interés legítimo en proteger a los menores.',
        '**Plazo:** mientras exista tu cuenta. Si tienes menos de 18 años, el registro se detiene antes de iniciar sesión y no se guarda nada.',
        '**Acceso:** tu nombre lo ven las personas que tu minimoa te presenta y tus vínculos. Tu fecha de nacimiento no se muestra a los demás.',
      ],
    },

    { h3: 'Tu sexo, lo que buscas, a quién quieres conocer', id: 'sensibles' },
    {
      ul: [
        '**Datos:** tu sexo (mujer, hombre, no binario o «prefiero no decirlo»); lo que buscas (amigos, algo más o ambos); si buscas «algo más», a quién quieres conocer (mujeres, hombres, todo el mundo).',
        '**Por qué es sensible:** juntas, estas respuestas pueden revelar tu **orientación sexual**, un dato protegido por el artículo 9 del RGPD.',
        '**Finalidad:** presentarte solo a personas que buscan lo mismo que tú y que quieren conocer a alguien como tú.',
        '**Base jurídica:** tu **consentimiento explícito**, que te pedimos al registrarte antes de que respondas. Puedes retirarlo: cambia tus respuestas en la app («prefiero no decirlo», solo «amigos») o elimina tu cuenta. Sin estas respuestas, no podemos proponerte encuentros de «algo más».',
        '**Plazo:** mientras exista tu cuenta o hasta que cambies tus respuestas.',
        '**Acceso:** el algoritmo de encuentros. Estas respuestas sirven para filtrar: una persona que te es presentada puede deducir que buscáis lo mismo. Nunca se usan para publicidad ni se ceden a terceros.',
      ],
    },

    { h3: 'Tu ubicación', id: 'localisation' },
    {
      ul: [
        '**Datos:** tu posición, **solo con la app abierta** (nunca en segundo plano), y una zona aproximada de tu domicilio deducida de ella.',
        '**Finalidad:** mostrarte el mapa y los minimoas compatibles a tu alrededor; proponerte encuentros cercanos; confirmar que una salida ha tenido lugar fuera de la zona de tu domicilio, para que suba la sociabilidad de tu minimoa.',
        '**Lo que ven los demás:** nunca tu posición exacta. Se redondea a unos 300 m y se desplaza, y nunca se muestra en tiempo real. El **modo discreto** te quita del mapa por completo.',
        '**Base jurídica:** tu consentimiento, dado con el permiso de ubicación de tu teléfono. Puedes retirarlo en cualquier momento en los ajustes del teléfono. Sin él, no hay mapa ni encuentros cercanos (te lo decimos claramente), pero el resto de la app funciona.',
        '**Plazo:** guardamos tu última posición redondeada y la zona aproximada de tu domicilio, que se sustituyen en cada actualización. No guardamos el historial de tus desplazamientos.',
        '**Acceso:** el personal autorizado de Blowy, nuestro proveedor de alojamiento y el proveedor del mapa base, que recibe la zona que se muestra en pantalla.',
      ],
    },

    { h3: 'Tu visión y la compatibilidad' },
    {
      ul: [
        '**Datos:** tus respuestas al test de visión (12 situaciones), tus respuestas a las preguntas del día, los hábitos que eliges y los que mantienes, tu forma de cuidar a tu minimoa (regularidad, horas, salidas) y las 3 palabras que tus amigos eligen para ti. A partir de ellos deducimos tu «visión» en 5 ejes, con un índice de confianza, y un «estilo» (sociable, juguetón, tierno, hablador).',
        '**Finalidad:** calcular la compatibilidad con otras personas y presentarte a las que encajan contigo; explicar cada encuentro; dar carácter a tu minimoa. Es una **elaboración de perfiles**, explicada en detalle [más abajo](#compatibilite).',
        '**Base jurídica:** ejecución del contrato (es el núcleo del servicio).',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** el algoritmo de encuentros. Una persona que te es presentada ve vuestros puntos en común y una diferencia, nunca tus respuestas ni una cifra sola.',
      ],
    },
    { p: 'No te preguntamos ni tu religión, ni tus opiniones políticas, ni tu salud.' },

    { h3: 'Tu minimoa, tus hábitos y tu racha' },
    {
      ul: [
        '**Datos:** el nombre y el aspecto de tu minimoa, sus indicadores (sociabilidad, hambre, energía, humor), los gestos que haces, tus hábitos y su ritmo, tu racha, tus comodines, tus objetos, tu balance semanal.',
        '**Finalidad:** hacer funcionar el juego.',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista tu cuenta.',
        '**Acceso:** tú; tus vínculos y las personas presentadas ven tu minimoa y su estilo.',
      ],
    },

    { h3: 'Las fotos de prueba', id: 'preuves' },
    {
      ul: [
        '**Datos:** la foto que haces en la app cuando tu minimoa pide una prueba de un hábito (tus zapatillas, por ejemplo). Se hace con la cámara, no desde tu galería.',
        '**Finalidad:** comprobar que el hábito se ha cumplido. Una IA responde sí, no o «no estoy seguro», con una frase. Si responde «no estoy seguro», confiamos en ti.',
        '**Base jurídica:** tu consentimiento: tú eliges hacer y enviar la foto.',
        '**Plazo:** **se elimina en 24 horas**, salvo si decides guardarla en tus recuerdos privados (allí se queda hasta que la borres o elimines tu cuenta).',
        '**Acceso:** **ningún humano la ve.** Solo la recibe nuestro proveedor de IA, reducida, para analizarla. Nadie más en Blowy la ve.',
      ],
    },
    { p: 'Evita fotografiar a otras personas, documentos o información sensible.' },

    { h3: 'Tus mensajes, y su lectura por una IA si la activáis' },
    {
      ul: [
        '**Datos:** los mensajes que intercambias en tus vínculos, su fecha y lo que se ha leído.',
        '**Finalidad:** entregarlos a la otra persona y guardarlos en vuestra conversación.',
        '**Base jurídica:** ejecución del contrato.',
        '**Plazo:** mientras exista el vínculo. Si sales de un vínculo, la conversación se borra para ti. Si uno de los dos elimina su cuenta, el vínculo y sus mensajes desaparecen para ambos.',
        '**Acceso:** tú y la otra persona. Un moderador puede leer un mensaje **denunciado** y su contexto inmediato (consulta [denuncias](#signalements)).',
      ],
    },
    {
      note: '«Ningún humano lee tus conversaciones. Si los dos lo activáis, una IA lee vuestros mensajes para que vuestros minimoas puedan reaccionar. No se conserva nada después.»',
    },
    {
      ul: [
        '**Acuerdo de cada uno:** os lo pedimos a los dos, la primera vez que abrís el chat. Si uno lo rechaza, nadie lee: los minimoas solo reaccionan al ritmo del vínculo (silencios, rachas, retos).',
        '**Retirada:** en cualquier momento, en las opciones del vínculo o en **Yo**. La lectura se detiene de inmediato para ese vínculo.',
        '**Cómo:** no se analiza cada mensaje. Cuando algo lo activa (un silencio, cierto número de mensajes), se envía una ventana corta de los últimos mensajes a nuestro proveedor de IA, que propone la reacción del minimoa. Como máximo 3 intervenciones al día por vínculo, y puedes desactivarlas para un vínculo.',
        '**Qué se guarda:** nada del análisis. Solo la reacción del minimoa aparece en el chat, como un mensaje.',
        '**Base jurídica:** el consentimiento de cada uno de los dos.',
      ],
    },

    { h3: 'La racha y las etapas de un vínculo' },
    {
      ul: [
        '**Datos:** los días en que cada uno de vosotros escribió en el vínculo (no el contenido de los mensajes) y las etapas del vínculo (encuentro, niveles alcanzados, récords de racha). En los vínculos anteriores al 15 de noviembre de 2026, las fotos que os habíais enviado, que se quedan en vuestros recuerdos; ya no recibimos fotos nuevas.',
        '**Finalidad:** hacer vivir la racha del vínculo (los días seguidos en que os escribís los dos), sus vidas y sus niveles, y mostraros vuestros recuerdos.',
        '**Base legal:** ejecución del contrato.',
        '**Plazo:** mientras exista el vínculo (mismas reglas que los mensajes).',
        '**Acceso:** tú y la otra persona del vínculo. Las fotos se guardan en un espacio privado, accesibles solo mediante enlaces temporales.',
      ],
    },

    { h3: 'Las notificaciones' },
    {
      ul: [
        '**Datos:** el identificador técnico de tu teléfono para las notificaciones, tus ajustes por tipo de notificación, la hora elegida para el reto del día.',
        '**Finalidad:** avisarte (reto del día, nuevo encuentro, mensaje, «te toca escribir» por la noche, vínculo o racha en peligro, prueba pedida, balance, recordatorio del fin de la prueba). Horas de silencio de 22 h a 8 h; sin contar los mensajes, 3 al día como máximo. En iPhone, el widget y las actividades en directo usan los mismos datos.',
        '**Base jurídica:** tu consentimiento, dado con el permiso de tu teléfono. Lo retiras en los ajustes del teléfono o tipo por tipo en la app.',
        '**Plazo:** hasta que desactives las notificaciones o elimines tu cuenta.',
        '**Acceso:** nuestro proveedor de envío de notificaciones, y Apple o Google, que las hacen llegar a tu teléfono.',
      ],
    },

    { h3: 'Las compras de Blowy+' },
    {
      ul: [
        '**Datos:** el plan elegido, las fechas de compra, prueba y renovación, el estado de la suscripción, el identificador de la transacción. **Nunca recibimos tus datos de pago**: te factura Apple o Google.',
        '**Finalidad:** abrir las funciones de Blowy+, verificar la compra con la tienda, gestionar la prueba y su recordatorio.',
        '**Base jurídica:** ejecución del contrato; obligaciones contables para las referencias de transacción.',
        '**Plazo:** el estado mientras exista tu cuenta; las referencias de transacción, el tiempo que exijan nuestras obligaciones contables (10 años como máximo).',
        '**Acceso:** el personal autorizado de Blowy; Apple o Google, según sus propias políticas.',
      ],
    },

    { h3: 'Denuncias, bloqueos y moderación', id: 'signalements' },
    {
      ul: [
        '**Datos:** quién denuncia, a quién se denuncia, el vínculo afectado, el motivo, los detalles escritos; el **mensaje denunciado y su contexto inmediato**; los bloqueos; las decisiones de moderación y el registro de acciones.',
        '**Finalidad:** proteger a las personas, tramitar las denuncias (objetivo: en 24 horas), aplicar las [normas](@regles), responder a las autoridades, impedir que una persona bloqueada contacte contigo.',
        '**Base jurídica:** nuestras obligaciones legales (en particular el Reglamento de Servicios Digitales) y nuestro interés legítimo en garantizar la seguridad de la comunidad.',
        '**Plazo:** consulta la [tabla de plazos](#durees).',
        '**Acceso:** los moderadores autorizados de Blowy y las autoridades si la ley lo exige. La persona denunciada no sabe quién la ha denunciado. Una persona bloqueada no recibe aviso.',
      ],
    },

    { h3: 'Estadísticas y administración' },
    {
      ul: [
        '**Datos:** cifras calculadas a partir de la actividad: número de cuentas, cuentas activas, retención, suscriptores y pruebas, rachas, mensajes de los minimoas, encuentros propuestos y aceptados, costes de la IA.',
        '**Finalidad:** dirigir y mejorar Blowy, controlar los costes.',
        '**Base jurídica:** nuestro interés legítimo.',
        '**Cómo:** estas estadísticas se calculan a partir de nuestra propia base de datos, en una herramienta interna reservada a unas pocas personas autorizadas. No hay herramientas de medición de audiencia ni de publicidad en la app. La herramienta interna no da acceso a las conversaciones, salvo al mensaje denunciado y su contexto inmediato.',
        '**Plazo:** los datos individuales siguen la vida de tu cuenta; las cifras agregadas, que no permiten identificarte, pueden conservarse más tiempo.',
      ],
    },

    { h3: 'Datos técnicos' },
    {
      ul: [
        '**Datos:** dirección IP, modelo y sistema del dispositivo, versión de la app, idioma, registros de errores y de conexión.',
        '**Finalidad:** hacer funcionar el servicio, protegerlo, limitar los abusos, corregir errores.',
        '**Base jurídica:** nuestro interés legítimo; nuestras obligaciones legales de conservar ciertos datos de conexión.',
        '**Plazo:** consulta la [tabla de plazos](#durees).',
        '**Acceso:** el equipo técnico autorizado y nuestros proveedores de alojamiento.',
      ],
    },

    { h3: 'Las «3 palabras» y las invitaciones (personas sin cuenta)' },
    {
      ul: [
        '**Datos:** cuando alguien abre tu página de «3 palabras» o tu invitación en la web, mostramos tu nombre y tu minimoa. Para los votos, guardamos las palabras elegidas y una huella no reversible de la dirección IP y del navegador, para limitar los votos duplicados. No se pide ninguna cuenta.',
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
        '**Plazo:** consulta la [tabla de plazos](#durees).',
      ],
    },

    { h2: '3. Cómo funciona la compatibilidad', id: 'compatibilite' },
    { p: 'Tu minimoa solo te presenta a personas cuya visión de la vida va en la misma dirección que la tuya. Esta es la lógica, sin secretos:' },
    {
      ol: [
        '**Tu visión** se sitúa en 5 ejes: hogar (libre, en solitario ↔ formar una familia), arraigo (quedarse aquí ↔ irse), impulso (tiempo para uno ↔ grandes proyectos), ritmo (tranquilo, en casa ↔ intenso, fuera), rumbo (día a día ↔ planificarlo todo). Cada eje tiene un índice de confianza.',
        '**De dónde viene**, con pesos iniciales: test de registro 40 % (luego cada vez menos), pregunta del día 20 %, hábitos 25 %, tu forma de cuidar a tu minimoa 10 %, las 3 palabras de tus amigos 5 %. Cuanto más usas Blowy, más sube la confianza.',
        '**Los filtros**: lo que busca cada uno y, para «algo más», a quién quiere conocer; 18 años o más; la zona; las personas bloqueadas.',
        '**La puntuación**: la cercanía en los 5 ejes, ponderada por la confianza. Para «amigos», el eje hogar cuenta poco; para «algo más», cuenta el doble. El estilo (sociable, juguetón, tierno, hablador) no entra en la puntuación.',
        '**El umbral**: por debajo del 70 %, no se propone a nadie, aunque eso signifique mostrar menos personas.',
        '**La explicación**: cada encuentro dice por qué, con 3 puntos en común y 1 diferencia por explorar. Nunca una cifra sola.',
        '**El número de encuentros** depende también de la forma de tu minimoa (cuanto más lo cuidas, más gente te presenta) y de tu suscripción.',
      ],
    },
    { p: 'Tu visión es orientativa: es «tu visión, por ahora». No es un diagnóstico y no usamos vocabulario médico ni psicológico.' },
    {
      p: '**Este cálculo no toma ninguna decisión que produzca efectos jurídicos** sobre ti o que te afecte de forma similar. Solo decide a quién te presenta tu minimoa; siempre eres tú quien elige saludar, aceptar o ignorar. Puedes pedirnos explicaciones, impugnar un resultado u oponerte a este tratamiento escribiendo a {{email.privacy}}; en este último caso, ya no podremos presentarte a nadie.',
    },

    { h2: '4. La inteligencia artificial', id: 'ia' },
    { p: 'Blowy usa una IA en tres lugares, y en ningún otro:' },
    {
      table: {
        head: ['Uso', 'Lo que recibe la IA', 'Lo que se guarda'],
        rows: [
          ['Fotos de prueba', 'La foto, reducida', 'La respuesta (sí, no, no estoy seguro). La foto se elimina en 24 horas, salvo si la guardas.'],
          ['Lectura de mensajes (si los dos la activáis)', 'Una ventana corta con los últimos mensajes del vínculo', 'Nada del análisis. Solo la reacción del minimoa aparece en el chat.'],
          ['Balance semanal y voz de los minimoas', 'Un resumen de tu actividad de la semana (salidas, hábitos, racha, vínculos)', 'El texto del balance, en la app.'],
        ],
      },
    },
    {
      p: 'Nuestro proveedor de IA actúa como encargado del tratamiento: trata estos datos solo para nosotros, siguiendo nuestras instrucciones, y no para sus propios fines. Ningún miembro del equipo de Blowy ve estos contenidos durante el análisis. Las respuestas de la IA pueden equivocarse: no tienen efectos jurídicos y, si una prueba es dudosa, confiamos en ti.',
    },

    { h2: '5. Lo que ven los demás', id: 'visibilite' },
    {
      ul: [
        '**Las personas que tu minimoa te presenta** ven tu nombre, tu minimoa, su estilo, vuestros puntos en común y una diferencia, y tu posición aproximada en el mapa (salvo en modo discreto).',
        '**Tus vínculos** ven además vuestros mensajes, vuestra racha, las etapas de vuestro vínculo y vuestras fotos de antes, si las hay.',
        '**Quienes visitan tu página de «3 palabras» o tu invitación** ven tu nombre y tu minimoa.',
        'Nadie ve tu dirección de correo, tu fecha de nacimiento, tu posición exacta ni tus respuestas al test de visión. Tus fotos de prueba las verifica una IA: ningún humano las ve y se eliminan en 24 horas (salvo si las guardas en tus recuerdos privados).',
      ],
    },

    { h2: '6. Nuestros proveedores', id: 'prestataires' },
    { p: 'Estos encargados del tratamiento tratan datos por cuenta nuestra, siguiendo nuestras instrucciones, con un contrato conforme al artículo 28 del RGPD:' },
    {
      subprocessors: {
        head: ['Función', 'Proveedor', 'Lugar del tratamiento', 'Garantía si está fuera de la UE'],
        roles: {
          database: 'Base de datos, autenticación y almacenamiento de fotos',
          api: 'Alojamiento del servidor de la app (API)',
          ai: 'IA: fotos de prueba, lectura de mensajes si está activada, balances',
          email: 'Envío de correos electrónicos',
          push: 'Envío de notificaciones',
          maps: 'Mapa base',
          site: 'Alojamiento de la web blowy.app',
        },
      },
    },
    {
      p: '**Apple y Google** también intervienen, por cuenta propia y según sus propias políticas: inicio de sesión (Iniciar sesión con Apple, Google), distribución de la app (App Store, Google Play), pago de Blowy+ y entrega de las notificaciones.',
    },
    { p: 'Por último, podemos tener que comunicar datos a las autoridades cuando la ley lo exija.' },

    { h2: '7. Transferencias fuera de la Unión Europea', id: 'transferts' },
    {
      p: 'Damos prioridad a proveedores que tratan los datos en la Unión Europea. Cuando un proveedor trata datos fuera de la UE (la tabla anterior lo indica), la transferencia se ampara en una decisión de adecuación de la Comisión Europea (por ejemplo, el Marco de Privacidad de Datos UE-EE. UU., para las empresas certificadas) o en las cláusulas contractuales tipo de la Comisión. Puedes obtener una copia escribiendo a {{email.privacy}}.',
    },

    { h2: '8. Cuánto tiempo guardamos tus datos', id: 'durees' },
    {
      table: {
        head: ['Dato', 'Plazo'],
        rows: [
          ['Cuenta, perfil, visión, minimoa, hábitos, ajustes', 'Mientras exista tu cuenta. Se borran en cuanto la eliminas.'],
          ['Cuenta inactiva', 'Se elimina tras 2 años sin iniciar sesión, después de un mensaje de aviso.'],
          ['Ubicación', 'Solo la última posición redondeada y la zona aproximada del domicilio, sustituidas en cada actualización.'],
          ['Fotos de prueba', 'En 24 horas, salvo si las guardas en tus recuerdos privados.'],
          ['Lectura de mensajes por la IA', 'No se conserva nada después del análisis.'],
          ['Mensajes, racha, etapas y fotos de antes de un vínculo', 'Mientras exista el vínculo.'],
          ['Compras', 'El estado mientras exista la cuenta; las referencias de transacción hasta 10 años (obligaciones contables).'],
          ['Denuncias y decisiones de moderación', '1 año después del cierre del expediente, más si un procedimiento judicial lo exige.'],
          ['Expulsión definitiva', 'Un identificador técnico de la cuenta de Apple o Google, durante 3 años, para impedir un nuevo registro.'],
          ['Registros técnicos', '30 días, salvo incidente de seguridad en análisis. Los datos de conexión que la ley nos obliga a conservar: el plazo fijado por la ley, un año como máximo.'],
          ['Conversaciones con la asistencia', '1 año después del cierre de la solicitud.'],
          ['Solicitudes de ejercicio de tus derechos', '5 años, para poder demostrar que respondimos.'],
          ['Copias de seguridad', 'Se sobrescriben a medida que rotan, como máximo 30 días después de la eliminación.'],
        ],
      },
    },

    { h2: '9. Tus derechos', id: 'droits' },
    { p: 'Según el RGPD y la ley francesa de protección de datos, puedes en cualquier momento:' },
    {
      ul: [
        '**acceder** a tus datos y obtener una copia;',
        'hacer que se **rectifiquen** (muchos se cambian directamente en la app);',
        'hacer que se **supriman** ([eliminar tu cuenta](@supprimer-mon-compte) lo hace de una vez);',
        '**retirar tu consentimiento** cuando es la base de un tratamiento (datos sensibles, ubicación, fotos de prueba, lectura de mensajes por la IA, notificaciones), sin que eso afecte a lo hecho antes;',
        '**oponerte** a un tratamiento basado en nuestro interés legítimo, o pedir su **limitación**;',
        'recibir los datos que nos diste en un formato legible por máquina (**portabilidad**);',
        'dejar **instrucciones** sobre el destino de tus datos después de tu fallecimiento.',
      ],
    },
    {
      p: 'Para ejercer estos derechos, escribe a {{email.privacy}} o a la dirección postal de {{publisher.name}}: {{publisher.address}}. Respondemos en un mes; este plazo puede ampliarse dos meses si la solicitud es compleja, y en ese caso te avisamos. Podemos pedirte que demuestres que la solicitud viene de ti.',
    },
    {
      p: 'Si crees que tus derechos no se respetan, puedes presentar una reclamación ante la **CNIL**, la autoridad francesa de protección de datos (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, Francia, [cnil.fr](https://www.cnil.fr/fr/plaintes)), o ante la autoridad de protección de datos de tu país de residencia en la Unión Europea.',
    },

    { h2: '10. Solo para adultos', id: 'mineurs' },
    {
      p: 'Blowy es solo para personas de 18 años o más. Pedimos la fecha de nacimiento antes de iniciar sesión; con menos de 18 años, el registro se detiene y no se crea nada. No recogemos a sabiendas datos de menores. Si descubrimos que una cuenta pertenece a un menor, se elimina. Puedes avisarnos desde la app con el motivo «Persona menor de edad».',
    },

    { h2: '11. Seguridad', id: 'securite' },
    {
      ul: [
        'Los intercambios entre la app, la web y nuestros servidores están cifrados en tránsito (HTTPS).',
        'No guardamos contraseñas: el inicio de sesión pasa por Apple o Google.',
        'Las fotos están en un almacenamiento privado, accesible solo mediante enlaces temporales.',
        'El acceso a los datos se limita a las personas que lo necesitan; la herramienta de administración está reservada a personas autorizadas, en modo de solo lectura salvo para la moderación, y sus acciones quedan registradas.',
        'Guardamos lo mínimo posible: fotos de prueba eliminadas en 24 horas, ubicación redondeada, nada guardado tras la lectura de los mensajes por la IA.',
      ],
    },
    {
      p: 'Ningún sistema es infalible. En caso de violación de datos, avisamos a la CNIL en 72 horas cuando la ley lo exige, y te avisamos directamente si supone un riesgo alto para ti.',
    },

    { h2: '12. Cambios', id: 'changements' },
    {
      p: 'Si cambiamos esta política de forma importante (por ejemplo, un nuevo uso de tus datos), te avisamos en la app antes de que los cambios se apliquen, y te volvemos a pedir tu consentimiento cuando sea necesario. La fecha de la última actualización está al principio de esta página.',
    },
  ],
};
