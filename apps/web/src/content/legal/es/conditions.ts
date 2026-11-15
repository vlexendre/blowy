import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Condiciones de uso — Blowy',
  heading: 'Condiciones de uso',
  description: 'El contrato entre tú y Blowy: mayores de 18 años, tu cuenta, lo que está permitido, tus contenidos, la moderación, el fin del contrato, la ley aplicable.',
  intro: 'El contrato entre tú y Blowy. Al crear una cuenta, lo aceptas. Tómate cinco minutos para leerlo.',
  summary: {
    title: 'En resumen',
    items: [
      'Blowy es solo para **adultos de 18 años o más**. Una cuenta por persona, para una persona real.',
      'Tu **minimoa** lleva tu visión de la vida y te presenta a personas compatibles, para ser amigos o algo más. Sus mensajes son automáticos: no es una persona.',
      'Respeta a los demás y las [normas de la comunidad](@regles). Nada de acoso, nada de contenido sexual, nada que implique a un menor.',
      'Tus mensajes y tus fotos siguen siendo tuyos. Solo nos das el derecho de tratarlos para que Blowy funcione.',
      'Blowy es gratis. **Blowy+** es una suscripción opcional, pagada a través de App Store o Google Play ([condiciones de Blowy+](@abonnement)).',
      'Puedes irte cuando quieras: [eliminar tu cuenta](@supprimer-mon-compte) se hace en la app.',
      'Se aplica la ley francesa. Si hay un problema, escríbenos primero; también puedes acudir a un mediador, gratis.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quiénes somos', id: 'editeur' },
    {
      p: 'La app Blowy y la web blowy.app están editadas por **{{publisher.name}}** («Blowy», «nosotros»). Sus datos completos están en el [aviso legal](@mentions-legales). Para escribirnos: {{email.support}}.',
    },
    {
      p: 'Estas condiciones se aplican a cualquier uso de la app. Las [normas de la comunidad](@regles), las [condiciones de la suscripción Blowy+](@abonnement) y la [política de privacidad](@confidentialite) forman parte de ellas.',
    },

    { h2: '2. Qué es Blowy', id: 'service' },
    {
      p: 'En Blowy, cada persona cría un **minimoa**, un pequeño personaje que lleva su visión de la vida: lo que la persona proyecta para su vida (hogar y familia, dónde vivir, el lugar del trabajo, el ritmo del día a día, el largo plazo). El minimoa presenta a su persona a gente cuya visión es compatible, para ser amigos o algo más, y cuida de cada vínculo.',
    },
    {
      ul: [
        '**La visión** se construye con un test al registrarte, una pregunta al día, tus hábitos y tu forma de cuidar a tu minimoa. Es orientativa y se afina con el tiempo.',
        '**Los encuentros**: tu minimoa solo te presenta a personas cuya compatibilidad supera un umbral. Nada ocurre sin tu acuerdo: saludas, la otra persona acepta, se crea el vínculo. Cómo funciona se explica en la [política de privacidad](@confidentialite#compatibilite).',
        '**Los vínculos**: un chat, una foto del día, recuerdos y vidas que bajan cuando el vínculo se queda en silencio.',
        '**Tu minimoa** tiene indicadores (sociabilidad, hambre, energía, humor), hábitos que mantener, una racha, objetos. Nunca muere.',
        '**El mapa** muestra los minimoas compatibles a tu alrededor, en una posición imprecisa a propósito.',
      ],
    },
    {
      p: '**Los minimoas no son personas.** Sus mensajes, sus comentarios y el balance semanal se generan automáticamente, a partir de plantillas de frases o con inteligencia artificial. Pueden equivocarse. No son consejos profesionales, ni consejos médicos, ni una garantía sobre nadie.',
    },
    { p: 'Una compatibilidad, aunque sea alta, no dice nada de la honestidad o las intenciones de alguien. Blowy no verifica la identidad de las personas ni investiga sobre ellas.' },

    { h2: '3. Quién puede usar Blowy', id: 'age' },
    {
      ul: [
        '**Debes tener 18 años o más.** Te pedimos tu fecha de nacimiento antes de iniciar sesión. Con menos de 18 años, el registro se detiene y no se crea nada. Mentir sobre tu edad conlleva el cierre de la cuenta.',
        '**Una sola cuenta por persona**, para una persona real: tú. Nada de cuentas compartidas ni a nombre de otra persona.',
        'No debes haber sido expulsado de Blowy, ni tener prohibido por ley usar este tipo de servicio.',
      ],
    },

    { h2: '4. Tu cuenta', id: 'compte' },
    {
      p: 'Inicias sesión con **Apple** (en iPhone) o **Google** (en Android). Estos servicios nos confirman tu identidad; nunca conocemos tu contraseña. Guarda para ti el acceso a esa cuenta de Apple o Google: lo que ocurre en tu cuenta de Blowy es tu responsabilidad. Si crees que alguien ha accedido a ella, escríbenos enseguida.',
    },
    { p: 'La información que das (nombre, fecha de nacimiento, lo que buscas) debe ser verdadera y estar actualizada. Puedes cambiarla en la app.' },

    { h2: '5. Lo que está permitido y lo que no', id: 'usage' },
    { p: 'Usas Blowy respetando la ley, a los demás y las [normas de la comunidad](@regles). En particular, está prohibido:' },
    {
      ul: [
        'acosar, amenazar, insultar, humillar, chantajear o incitar al odio o a la violencia;',
        'enviar desnudos o contenido sexual, también como foto del día o foto de prueba;',
        'implicar a un menor de cualquier forma;',
        'publicar contenido ilegal, violento o impactante;',
        'hacerte pasar por otra persona, crear un perfil falso o varias cuentas;',
        'estafar, pedir dinero, hacer publicidad o spam;',
        'ofrecer o pedir servicios sexuales remunerados;',
        'difundir información privada o fotos de otra persona sin su consentimiento;',
        'engañar a las verificaciones (foto de prueba falsa, ubicación falsificada);',
        'automatizar el uso del servicio (bots, extracción de datos), eludir sus límites, bloqueos o protecciones, o perturbar su funcionamiento.',
      ],
    },

    { h2: '6. Tus contenidos', id: 'contenus' },
    {
      p: 'Tus mensajes, tus fotos y tus respuestas siguen siendo tuyos. Para que Blowy funcione, nos concedes una **licencia gratuita, no exclusiva y mundial**, limitada a lo necesario para: almacenarlos, entregarlos a las personas a las que los envías, mostrarlos en la app, tratarlos técnicamente (redimensionar una foto, por ejemplo) y, cuando está previsto, hacer que una IA los analice (fotos de prueba; mensajes, si los dos lo habéis activado). Esta licencia dura mientras el contenido esté en línea y termina cuando se elimina, salvo lo que debamos conservar según la [política de privacidad](@confidentialite#durees).',
    },
    { p: 'No usamos tus contenidos para publicidad y no los vendemos.' },
    { p: 'Garantizas que tienes derecho a publicar lo que publicas y que no vulnera los derechos de otros (imagen, intimidad, derechos de autor).' },

    { h2: '7. Denuncias, moderación y sanciones', id: 'moderation' },
    {
      p: 'Puedes denunciar o bloquear a una persona en cualquier momento desde la app ([cómo hacerlo](@securite)). Revisamos cada denuncia, con el objetivo de responder en 24 horas. Para ello, un moderador de Blowy puede leer el mensaje denunciado y su contexto inmediato (los mensajes que lo rodean). Fuera de este caso, ningún humano lee tus conversaciones; una IA solo las lee si los dos lo habéis activado.',
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
      p: 'Lo que es grave e ilegal (contenido que implica a un menor, una amenaza seria, por ejemplo) se denuncia a las autoridades. Cuando tomamos una decisión que te afecta, te damos los motivos, salvo que la ley lo prohíba o que ello ponga a alguien en peligro. Puedes recurrirla escribiendo a {{email.support}} en un plazo de seis meses; una persona revisa la decisión.',
    },

    { h2: '8. La inteligencia artificial en Blowy', id: 'ia' },
    {
      ul: [
        '**Fotos de prueba**: una IA dice si la foto corresponde al hábito. En caso de duda, confiamos en ti.',
        '**Lectura de los mensajes**: solo si los dos la activáis, para que vuestros minimoas puedan reaccionar. Podéis desactivarla cuando queráis.',
        '**Balance semanal y comentarios de los minimoas**: textos generados automáticamente.',
      ],
    },
    {
      p: 'Estas funciones sirven al juego y a la conversación. Ninguna toma una decisión que produzca efectos jurídicos sobre ti. Los detalles están en la [política de privacidad](@confidentialite#ia).',
    },

    { h2: '9. Gratis, y Blowy+ como opción', id: 'blowy-plus' },
    {
      p: 'Blowy es gratis y sin publicidad. **Blowy+** es una suscripción opcional que abre funciones adicionales. La venden y la facturan Apple o Google. Sus precios, su prueba gratuita, su renovación y cómo cancelarla están en las [condiciones de la suscripción Blowy+](@abonnement).',
    },
    {
      p: 'Los objetos, comodines, rachas, vidas y demás elementos del juego no tienen valor monetario. No se intercambian, no se revenden y no se reembolsan, salvo lo que exija la ley.',
    },

    { h2: '10. Fin del contrato', id: 'fin' },
    {
      ul: [
        '**Por tu parte**, puedes irte cuando quieras: en la app, **Yo → Ajustes → Eliminar mi cuenta** ([qué se borra](@supprimer-mon-compte)). Eliminar tu cuenta no cancela una suscripción Blowy+: cancélala también en tu tienda.',
        '**Por nuestra parte**, podemos suspender o cerrar tu cuenta si no respetas estas condiciones, si la ley nos obliga o si está en juego la seguridad de alguien. Salvo urgencia o incumplimiento grave, te avisamos antes y te explicamos por qué.',
        'Si dejamos de prestar el servicio, te avisamos con al menos 30 días de antelación.',
      ],
    },

    { h2: '11. Disponibilidad y responsabilidad', id: 'responsabilite' },
    {
      p: 'Hacemos todo lo posible para que Blowy funcione bien, siempre. No podemos garantizar la ausencia de fallos, errores o interrupciones, sobre todo durante una actualización. Podemos hacer evolucionar las funciones de la app.',
    },
    {
      p: 'Cada persona es responsable de lo que publica y de cómo se comporta. Los encuentros en persona son responsabilidad tuya: lee nuestros [consejos de seguridad](@securite#rencontre). No somos responsables del comportamiento de otro usuario ni de los daños indirectos, en la medida en que lo permita la ley.',
    },
    {
      p: 'Nada en estas condiciones limita nuestra responsabilidad en caso de culpa grave o dolo, ni por daños personales, ni los derechos que la ley te garantiza como consumidor, en particular la garantía legal de conformidad de los contenidos y servicios digitales.',
    },

    { h2: '12. Propiedad intelectual', id: 'propriete' },
    {
      p: 'La marca Blowy, los minimoas, las ilustraciones, los textos y el software pertenecen a {{publisher.name}} o a sus socios. Te damos un derecho personal, no exclusivo e intransferible a usar la app para tu uso privado, mientras exista tu cuenta. Puedes compartir capturas de pantalla de tus propias conversaciones, sin exponer a otras personas.',
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
