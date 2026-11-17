import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Condiciones de uso — Minimoa',
  heading: 'Condiciones de uso',
  description: 'El contrato entre tú y Minimoa: mayores de 18 años, tu cuenta, lo que está permitido, tus contenidos, la moderación, el fin del contrato, la ley aplicable.',
  intro: 'El contrato entre tú y Minimoa. Al crear una cuenta, lo aceptas. Tómate cinco minutos para leerlo.',
  summary: {
    title: 'En resumen',
    items: [
      'Minimoa es solo para **adultos de 18 años o más**. Una cuenta por persona, para una persona real.',
      'Tu **minimoa** lleva tu visión de la vida y te presenta a personas compatibles para crear vínculos. Lo que lleguen a ser depende de vosotros. Sus mensajes son automáticos: no es una persona.',
      'Respeta a los demás y las [normas de la comunidad](@regles). Nada de acoso, nada de contenido sexual, nada que implique a un menor.',
      'Tus mensajes y tus fotos siguen siendo tuyos. Solo nos das el derecho de tratarlos para que Minimoa funcione.',
      'Minimoa es gratis. **Minimoa+** es una suscripción opcional, pagada a través de la App Store, en iPhone ([condiciones de Minimoa+](@abonnement)).',
      'Puedes irte cuando quieras: [eliminar tu cuenta](@supprimer-mon-compte) se hace en la app.',
      'Se aplica la ley francesa. Si hay un problema, escríbenos primero; también puedes acudir a un mediador, gratis.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quiénes somos', id: 'editeur' },
    {
      p: 'La app Minimoa y la web blowy.app están editadas por **{{publisher.name}}** («Minimoa», «nosotros»). Sus datos completos están en el [aviso legal](@mentions-legales). Para escribirnos: {{email.support}}.',
    },
    {
      p: 'Estas condiciones se aplican a cualquier uso de la app. Las [normas de la comunidad](@regles), las [condiciones de la suscripción Minimoa+](@abonnement) y la [política de privacidad](@confidentialite) forman parte de ellas.',
    },

    { h2: '2. Qué es Minimoa', id: 'service' },
    {
      p: 'En Minimoa, cada persona cría un **minimoa**, un pequeño personaje que lleva su visión de la vida: lo que la persona proyecta para su vida (hogar y familia, dónde vivir, el lugar del trabajo, el ritmo del día a día, el largo plazo). El minimoa presenta a su persona a gente cuya visión es compatible, para conocerse, y cuida de cada vínculo.',
    },
    {
      ul: [
        '**La visión** se construye con un test al registrarte, una pregunta al día, tus hábitos y tu forma de cuidar a tu minimoa. Es orientativa y se afina con el tiempo.',
        '**Los encuentros**: tu minimoa solo te presenta a personas cuya compatibilidad supera un umbral. Nada ocurre sin tu acuerdo: saludas, la otra persona acepta, se crea el vínculo. Cómo funciona se explica en la [política de privacidad](@confidentialite#compatibilite).',
        '**Los vínculos**: un chat, una racha que crece cada día en que os escribís los dos, recuerdos y vidas que bajan cuando el vínculo se queda en silencio.',
        '**Tu minimoa** tiene indicadores (sociabilidad, hambre, energía, humor), hábitos que mantener, una racha, objetos. Nunca muere.',
        '**El mapa** muestra los minimoas compatibles a tu alrededor (o alrededor de la ciudad que elegiste, si no activas la ubicación), en una posición imprecisa a propósito.',
      ],
    },
    {
      p: '**Los minimoas no son personas.** Sus mensajes, sus comentarios y el balance semanal se generan automáticamente, a partir de plantillas de frases o con inteligencia artificial. Pueden equivocarse. No son consejos profesionales, ni consejos médicos, ni una garantía sobre nadie.',
    },
    { p: 'Una compatibilidad, aunque sea alta, no dice nada de la honestidad o las intenciones de alguien. Minimoa no verifica la identidad de las personas ni investiga sobre ellas.' },

    { h2: '3. Quién puede usar Minimoa', id: 'age' },
    {
      ul: [
        '**Debes tener 18 años o más.** Te pedimos tu fecha de nacimiento antes de iniciar sesión. Con menos de 18 años, el registro se detiene y no se crea nada. Mentir sobre tu edad conlleva el cierre de la cuenta.',
        '**Una sola cuenta por persona**, para una persona real: tú. Nada de cuentas compartidas ni a nombre de otra persona.',
        'No debes haber sido expulsado de Minimoa, ni tener prohibido por ley usar este tipo de servicio.',
      ],
    },

    { h2: '4. Tu cuenta', id: 'compte' },
    {
      p: 'Inicias sesión con **Apple** (en iPhone) o **Google** (en Android). Estos servicios nos confirman tu identidad; nunca conocemos tu contraseña. Guarda para ti el acceso a esa cuenta de Apple o Google: lo que ocurre en tu cuenta de Minimoa es tu responsabilidad. Si crees que alguien ha accedido a ella, escríbenos enseguida.',
    },
    { p: 'La información que das (nombre, fecha de nacimiento, sexo) debe ser verdadera y estar actualizada. Puedes cambiarla en la app.' },

    { h2: '5. Lo que está permitido y lo que no', id: 'usage' },
    { p: 'Usas Minimoa respetando la ley, a los demás y las [normas de la comunidad](@regles). En particular, está prohibido:' },
    {
      ul: [
        'acosar, amenazar, insultar, humillar, chantajear o incitar al odio o a la violencia;',
        'enviar desnudos o contenido sexual, también como foto de perfil o foto de prueba;',
        'implicar a un menor de cualquier forma;',
        'publicar contenido ilegal, violento o impactante;',
        'hacerte pasar por otra persona, crear un perfil falso o varias cuentas;',
        'estafar, pedir dinero, hacer publicidad o spam;',
        'ofrecer o pedir servicios sexuales remunerados;',
        'difundir información privada o fotos de otra persona sin su consentimiento;',
        'engañar a las verificaciones (foto de prueba falsa, ubicación falsificada) o eludir el filtro automático de contenidos;',
        'automatizar el uso del servicio (bots, extracción de datos), eludir sus límites, bloqueos o protecciones, o perturbar su funcionamiento.',
      ],
    },

    { h2: '6. Tus contenidos', id: 'contenus' },
    {
      p: 'Tus mensajes, tus fotos y tus respuestas siguen siendo tuyos. Para que Minimoa funcione, nos concedes una **licencia gratuita, no exclusiva y mundial**, limitada a lo necesario para: almacenarlos, entregarlos a las personas a las que los envías, mostrarlos en la app, tratarlos técnicamente (redimensionar una foto, por ejemplo) y, cuando está previsto, filtrarlos automáticamente y, cuando está previsto, hacer que una IA los analice (fotos de prueba, si lo has aceptado; mensajes, si los dos lo habéis activado; foto de perfil y mensajes que dejan dudas, por seguridad; ver la [política de privacidad](@confidentialite#ia)). Esta licencia dura mientras el contenido esté en línea y termina cuando se elimina, salvo lo que debamos conservar según la [política de privacidad](@confidentialite#durees).',
    },
    { p: 'No usamos tus contenidos para publicidad y no los vendemos.' },
    { p: 'Garantizas que tienes derecho a publicar lo que publicas y que no vulnera los derechos de otros (imagen, intimidad, derechos de autor).' },

    { h2: '7. Denuncias, moderación y sanciones', id: 'moderation' },
    {
      p: 'Puedes denunciar o bloquear a una persona en cualquier momento desde la app ([cómo hacerlo](@securite)). Cada denuncia avisa al equipo de moderación, que la revisa con el objetivo de responder en 24 horas. Para ello, un moderador de Minimoa puede leer el mensaje denunciado y su contexto inmediato (los mensajes de alrededor). Fuera de este caso, nadie en Minimoa lee tus conversaciones; una IA solo las lee si los dos lo habéis activado.',
    },
    {
      p: 'Los nombres, los nombres de minimoa, los mensajes y las fotos de perfil pasan por un **filtro automático** antes de publicarse: un contenido que infringe claramente las normas se rechaza, y la app te dice por qué; un mensaje dudoso se envía, pero se señala a la moderación. Solo en dos casos la cuenta queda **suspendida automáticamente**, 72 horas como máximo, mientras un moderador la revisa: vocabulario pederasta explícito en un mensaje, o una cuenta denunciada como menor por dos personas distintas. El moderador levanta o confirma la suspensión.',
    },
    { p: 'Según la gravedad, podemos:' },
    {
      ul: [
        'retirar un contenido;',
        'enviar una advertencia;',
        'limitar algunas funciones (encuentros, mapa, fotos);',
        'suspender la cuenta durante un tiempo limitado;',
        'cerrar la cuenta definitivamente, por un incumplimiento grave o repetido.',
      ],
    },
    {
      p: 'Lo que es grave e ilegal (contenido que implica a un menor, una amenaza seria, por ejemplo) se denuncia a las autoridades. Cuando tomamos una decisión que te afecta, te damos los motivos, salvo que la ley lo prohíba o que ello ponga a alguien en peligro. Puedes impugnarla, sea automática o no, escribiendo a {{email.support}} en un plazo de seis meses; una persona revisa la decisión.',
    },

    { h2: '8. La inteligencia artificial en Minimoa', id: 'ia' },
    {
      ul: [
        '**Lectura de los mensajes**: solo si los dos la activáis, para que vuestros minimoas puedan reaccionar. Podéis desactivarla cuando queráis.',
        '**Fotos de prueba**: solo si lo aceptas, una IA dice si la foto corresponde al hábito; en caso de duda, confiamos en ti. Sin consentimiento, validas de palabra, sin foto.',
        '**Comprobaciones de seguridad**: cada foto de perfil, y un mensaje que deja dudas en un chat en el que los dos habéis aceptado la lectura.',
        '**Resumen de la semana**: reformulado por una IA, sin ningún nombre. Los demás comentarios de los minimoas vienen de frases ya escritas.',
      ],
    },
    {
      p: 'Esta IA es la de {{sub.ai.provider}} ({{sub.ai.location}}), nuestro proveedor. Estas funciones sirven al juego, a la conversación y a la seguridad. Ninguna toma una decisión que produzca efectos jurídicos sobre ti. Los detalles, y lo que recibe el proveedor, están en la [política de privacidad](@confidentialite#ia); tus consentimientos se ven y se retiran en la app, **Yo → La IA y tú**.',
    },

    { h2: '9. Gratis, y Minimoa+ como opción', id: 'blowy-plus' },
    {
      p: 'Minimoa es gratis y sin publicidad. **Minimoa+** es una suscripción opcional que abre funciones adicionales. La vende y la factura Apple, en iPhone (una suscripción hecha en iPhone acompaña a tu cuenta en tus otros dispositivos). Lo que incluye, sus precios, su prueba gratuita, su renovación y cómo cancelarla están en las [condiciones de la suscripción Minimoa+](@abonnement).',
    },
    {
      p: 'Si descargaste Minimoa del App Store, el [contrato de licencia estándar de Apple para aplicaciones](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) (“Licensed Application End User License Agreement”) también se aplica a la app.',
    },
    {
      p: 'Los objetos, comodines, rachas, vidas y demás elementos del juego no tienen valor monetario. No se intercambian, no se revenden y no se reembolsan, salvo lo que exija la ley.',
    },

    { h2: '10. Fin del contrato', id: 'fin' },
    {
      ul: [
        '**Por tu parte**, puedes irte cuando quieras: en la app, **Yo → Ajustes → Eliminar mi cuenta** ([qué se borra](@supprimer-mon-compte)). Eliminar tu cuenta no cancela una suscripción Minimoa+: cancélala también en los ajustes de tu iPhone.',
        '**Por nuestra parte**, podemos suspender o cerrar tu cuenta si no respetas estas condiciones, si la ley nos obliga o si está en juego la seguridad de alguien. Salvo urgencia o incumplimiento grave, te avisamos antes y te explicamos por qué.',
        'Si dejamos de prestar el servicio, te avisamos con al menos 30 días de antelación.',
      ],
    },

    { h2: '11. Disponibilidad y responsabilidad', id: 'responsabilite' },
    {
      p: 'Hacemos todo lo posible para que Minimoa funcione bien, siempre. No podemos garantizar la ausencia de fallos, errores o interrupciones, sobre todo durante una actualización. Podemos hacer evolucionar las funciones de la app.',
    },
    {
      p: 'Cada persona es responsable de lo que publica y de cómo se comporta. Los encuentros en persona son responsabilidad tuya: lee nuestros [consejos de seguridad](@securite#rencontre). No somos responsables del comportamiento de otro usuario ni de los daños indirectos, en la medida en que lo permita la ley.',
    },
    {
      p: 'Nada en estas condiciones limita nuestra responsabilidad en caso de culpa grave o dolo, ni por daños personales, ni los derechos que la ley te garantiza como consumidor, en particular la garantía legal de conformidad de los contenidos y servicios digitales.',
    },

    { h2: '12. Propiedad intelectual', id: 'propriete' },
    {
      p: 'La marca Minimoa, los minimoas, las ilustraciones, los textos y el software pertenecen a {{publisher.name}} o a sus socios. Te damos un derecho personal, no exclusivo e intransferible a usar la app para tu uso privado, mientras exista tu cuenta. Puedes compartir capturas de pantalla de tus propias conversaciones, sin exponer a otras personas.',
    },

    { h2: '13. Cambios', id: 'changements' },
    {
      p: 'Estas condiciones pueden cambiar, por ejemplo cuando llega una función nueva. Si el cambio es importante, te avisamos en la app al menos 30 días antes de que se aplique, salvo que la ley o la seguridad exijan actuar más rápido. Si no estás de acuerdo, puedes eliminar tu cuenta antes de esa fecha.',
    },

    { h2: '14. Ley aplicable, litigios y mediación', id: 'litiges' },
    { p: 'Estas condiciones se rigen por la **ley francesa**. Si vives en otro país de la Unión Europea, conservas la protección de las normas imperativas de tu país.' },
    { p: 'Si hay un problema, escríbenos primero a {{email.support}}: buscaremos una solución amistosa.' },
    { p: 'Si tu reclamación por escrito no da resultado, puedes acudir gratuitamente al mediador de consumo que nos corresponde, en el plazo de un año desde tu reclamación:' },
    { ul: ['**Mediador:** {{mediator.name}}', '**Dirección:** {{mediator.address}}', '**Web:** {{mediator.website}}'] },
    {
      p: 'A falta de acuerdo, el litigio se somete a los tribunales franceses competentes. Si eres consumidor, también puedes acudir al tribunal del lugar donde vivías en el momento del registro o del hecho.',
    },
  ],
};
