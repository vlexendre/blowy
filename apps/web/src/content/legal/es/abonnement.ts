import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Condiciones de la suscripción Blowy+ — Blowy',
  heading: 'Condiciones de la suscripción Blowy+',
  description:
    'Blowy+: los planes (59,88 € al año con 7 días gratis, o 14,99 € al mes), la renovación automática, la facturación por Apple o Google, cómo cancelar, el desistimiento y los reembolsos.',
  intro: 'Qué incluye Blowy+, cuánto cuesta, cómo se renueva y cómo pararlo. Sin letra pequeña.',
  summary: {
    title: 'En resumen',
    items: [
      '**59,88 € al año**, con **7 días gratis** al principio, o **14,99 € al mes**, sin prueba.',
      'La suscripción **se renueva automáticamente** mientras no la canceles.',
      'Te factura **Apple o Google**, y se cancela en los ajustes de tu tienda.',
      'Eliminar la app o tu cuenta **no cancela** la suscripción.',
      'Blowy sigue siendo gratis sin Blowy+.',
    ],
  },
  body: [
    { h2: 'Lo que añade Blowy+', id: 'contenu' },
    {
      ul: [
        '**Todo el mapa**, y la posibilidad de **cambiar de ciudad** sin moverte (sin Blowy+, ves tu zona, unos 1,5 km a tu alrededor).',
        '**Más encuentros.**',
        '**Más comodines** para proteger tu racha (sin Blowy+: un comodín gratis por semana).',
        '**6 hábitos** en lugar de 2.',
        'Un **balance semanal detallado**: la evolución de tu visión en 4 semanas y la revisión de cada vínculo.',
        '**Cambiar el nombre de tu minimoa** libremente (sin Blowy+: una vez cada 60 días).',
        '**Objetos premium**.',
      ],
    },
    { p: 'El contenido exacto puede cambiar con la app. Si retiramos una función importante de Blowy+, te avisamos antes y puedes cancelar.' },

    { h2: 'Planes y precios', id: 'offres' },
    {
      table: {
        head: ['Plan', 'Precio', 'Prueba gratuita'],
        rows: [
          ['Anual', '59,88 € al año, es decir, 4,99 € al mes', '7 días, después 59,88 € al año'],
          ['Mensual', '14,99 € al mes', 'Sin prueba'],
        ],
      },
    },
    {
      p: 'Los precios incluyen todos los impuestos, para Francia. En otros países, la tienda muestra el precio en tu moneda, que puede ser distinto. El precio que vale es el que muestra App Store o Google Play cuando confirmas la compra.',
    },

    { h2: 'La prueba gratuita', id: 'essai' },
    {
      ul: [
        'La prueba de 7 días solo se aplica al plan anual, y solo a una suscripción nueva, según las condiciones de la tienda (en general, una prueba por cuenta de Apple o Google).',
        'Durante la prueba, todo Blowy+ está abierto y no pagas nada.',
        'El día 5 te enviamos un recordatorio: quedan 2 días.',
        'Si no cancelas **al menos 24 horas antes del final de la prueba**, el primer pago de 59,88 € se cobra el día 7 y empieza la suscripción anual.',
        'Si cancelas durante la prueba, conservas Blowy+ hasta el final de los 7 días y no pagas nada.',
      ],
    },

    { h2: 'Pago y renovación automática', id: 'renouvellement' },
    {
      ul: [
        'La compra se hace en la app, a través de **App Store** (iPhone) o **Google Play** (Android). El pago se carga en el método de pago de tu cuenta de Apple o Google, al confirmar la compra o al final de la prueba.',
        'La suscripción **se renueva automáticamente** por el mismo periodo (un año o un mes), al mismo precio, salvo que la canceles **al menos 24 horas antes del final del periodo en curso**.',
        'Si el precio cambia, la tienda te avisa antes, según sus normas, y te pide tu acuerdo cuando estas lo exigen.',
        'Nunca recibimos tus datos bancarios. La tienda solo nos confirma la compra, que nuestro servidor verifica con ella.',
        '¿Has cambiado de teléfono? Usa **Restaurar compras** en la app, con la misma cuenta de Apple o Google.',
      ],
    },

    { h2: 'Cancelar', id: 'annuler' },
    { p: 'Se cancela en los ajustes de tu tienda, no en Blowy:' },
    {
      ul: [
        '**iPhone:** Ajustes → tu nombre → Suscripciones → Blowy → Cancelar suscripción.',
        '**Android:** Google Play → tu perfil → Pagos y suscripciones → Suscripciones → Blowy → Cancelar suscripción.',
      ],
    },
    {
      p: 'Después de cancelar, Blowy+ sigue abierto hasta el final del periodo ya pagado; luego tu cuenta vuelve a la versión gratuita. Tu minimoa, tus vínculos y tus datos se quedan.',
    },
    { note: '**Eliminar la app o tu cuenta de Blowy no cancela la suscripción.** Cancélala primero en tu tienda, si no, se seguirá cobrando.' },

    { h2: 'Derecho de desistimiento', id: 'retractation' },
    {
      p: 'Como consumidor en la Unión Europea, en principio dispones de 14 días para desistir de un contrato celebrado a distancia. Blowy+ es un servicio digital que se presta de inmediato: al suscribirte, pides que el acceso empiece enseguida. Si desistes en ese plazo, puede retenerse un importe proporcional al servicio ya prestado, en las condiciones previstas por la ley.',
    },
    { p: 'Como la compra se hace con Apple o Google, el desistimiento se pide a ellos:' },
    {
      ul: [
        '**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), o desde el historial de compras de tu cuenta.',
        '**Google:** desde tu historial de pedidos de Google Play ([ayuda de Google Play](https://support.google.com/googleplay/answer/2479637)).',
      ],
    },
    { p: 'Durante la prueba gratuita no hay nada de lo que desistir: basta con cancelar antes del final para no pagar nada.' },

    { h2: 'Reembolsos', id: 'remboursements' },
    {
      p: 'Como los pagos los cobran Apple o Google, **solo ellos pueden reembolsar**, según sus propias condiciones. No podemos hacerlo en su lugar. Si Blowy+ no ha funcionado como debía, escríbenos también a {{email.support}}: te ayudaremos, y tus derechos como consumidor (en particular la garantía legal de conformidad) siguen siendo plenamente aplicables.',
    },

    { h2: 'Si tu cuenta se suspende o se cierra', id: 'sanctions' },
    {
      p: 'Si tu cuenta se cierra por un incumplimiento grave de las [condiciones de uso](@conditions), el acceso a Blowy+ también se detiene. Recuerda cancelar la suscripción en tu tienda. Si dejamos de prestar el servicio, te avisamos con al menos 30 días de antelación y te indicamos cómo obtener el reembolso del periodo no utilizado.',
    },

    { h2: 'Lo demás', id: 'reste' },
    {
      p: 'Estas condiciones completan las [condiciones de uso](@conditions), que también se aplican a Blowy+ (en particular la ley aplicable y la mediación). Las condiciones de Apple o Google se aplican a la compra en sí. Cualquier pregunta: {{email.support}}.',
    },
  ],
};
