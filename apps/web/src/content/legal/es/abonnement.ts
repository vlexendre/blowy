import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Condiciones de la suscripción Minimoa+ — Minimoa',
  heading: 'Condiciones de la suscripción Minimoa+',
  description:
    'Minimoa+: lo que incluye, planes y precios, renovación automática, facturación por Apple, cómo cancelar, desistimiento y reembolsos.',
  intro: 'Qué incluye Minimoa+, cuánto cuesta, cómo se renueva y cómo pararlo. Sin letra pequeña.',
  summary: {
    title: 'En resumen',
    items: [
      '**59,99 € al año** (es decir, 4,99 € al mes), **14,99 € al mes** o **2,99 € a la semana**. Sin prueba gratuita: pagas al comprar.',
      'La suscripción **se renueva automáticamente** mientras no la canceles.',
      'Minimoa+ se compra en iPhone: te factura **Apple**, y se cancela en los ajustes de tu iPhone.',
      'Eliminar la app o tu cuenta **no cancela** la suscripción.',
      'Minimoa sigue siendo gratis sin Minimoa+.',
    ],
  },
  body: [
    { h2: 'Lo que añade Minimoa+', id: 'contenu' },
    {
      ul: [
        '**Todo el mapa**, y **cambiar de ciudad cuando quieras**, sin moverte. Sin Minimoa+, ves tu zona (unos 1,5 km a tu alrededor); sin ubicación, eliges tu ciudad a mano, como mucho una vez cada 30 días.',
        '**10 personas presentadas al día en vez de 3.**',
        '**3 comodines de racha por semana** para proteger tu racha (sin Minimoa+: uno por semana).',
        '**Hasta 6 hábitos** a la vez (sin Minimoa+: 2).',
        'El **resumen detallado del domingo**: la evolución de tu visión en 4 semanas y el balance de cada vínculo.',
        '**Cambiar el nombre de tu minimoa cuando quieras** (sin Minimoa+: una vez cada 60 días).',
        '**Todos los objetos premium del armario**: son de tu minimoa y se pueden poner enseguida, mientras dure la suscripción.',
      ],
    },
    { p: 'El contenido exacto puede cambiar con la app. Si retiramos una función importante de Minimoa+, te avisamos antes, y puedes cancelar.' },

    { h2: 'Planes y precios', id: 'offres' },
    {
      table: {
        head: ['Plan', 'Precio', 'Prueba gratuita'],
        rows: [
          ['Anual', '59,99 € al año, es decir, 4,99 € al mes', 'Sin prueba'],
          ['Mensual', '14,99 € al mes', 'Sin prueba'],
          ['Semanal', '2,99 € a la semana', 'Sin prueba'],
        ],
      },
    },
    {
      p: 'Los precios incluyen todos los impuestos, para Francia. En otros países, la App Store muestra el precio en tu moneda, que puede ser distinto. El precio que cuenta es el que muestra la App Store cuando confirmas la compra.',
    },

    { h2: 'Sin prueba gratuita', id: 'essai' },
    { p: 'Minimoa+ no tiene prueba gratuita: el pago se cobra en cuanto confirmas la compra. Si empezaste una prueba antes del 21 de noviembre de 2026, sigue hasta el final: te avisamos el día 5 y puedes cancelarla hasta 24 horas antes del final sin pagar nada.' },

    { h2: 'Pago y renovación automática', id: 'renouvellement' },
    {
      ul: [
        'La compra se hace en la app, en iPhone, a través de la **App Store**. El pago se carga al método de pago de tu cuenta de Apple, al confirmar la compra. En Android y en la web, Minimoa+ no está a la venta; una suscripción hecha en iPhone acompaña a tu cuenta de Minimoa en todas partes.',
        'La suscripción **se renueva automáticamente** por el mismo periodo (un año o un mes), al mismo precio, salvo que la canceles **al menos 24 horas antes del final del periodo en curso**.',
        'Si el precio cambia, Apple te avisa antes, según sus normas, y te pide tu conformidad cuando estas lo exigen.',
        'Nunca recibimos tus datos bancarios. Apple solo nos confirma la compra, que nuestro servidor verifica con ella.',
        '¿Has cambiado de teléfono? Usa **Restaurar compras** en la app, con la misma cuenta de Apple.',
      ],
    },

    { h2: 'Cancelar', id: 'annuler' },
    { p: 'Se cancela en los ajustes de tu iPhone, no en Minimoa (en la app, **Yo → Minimoa+ → Gestionar mi suscripción** te lleva allí):' },
    { ul: ['**iPhone:** Ajustes → tu nombre → Suscripciones → Minimoa → Cancelar suscripción.'] },
    {
      p: 'Tras cancelar, Minimoa+ sigue abierto hasta el final del periodo ya pagado, y después tu cuenta vuelve a la versión gratuita. Tu minimoa, tus vínculos y tus datos se quedan.',
    },
    { note: '**Eliminar la app o tu cuenta de Minimoa no cancela la suscripción.** Cancélala primero en los ajustes de tu iPhone, o se te seguirá cobrando.' },

    { h2: 'Cuando Minimoa+ termina', id: 'fin' },
    {
      ul: [
        'El mapa vuelve a tu zona (o a la ciudad elegida a mano); la ciudad elegida con Minimoa+ queda guardada y vuelve con una nueva suscripción.',
        'Un encuentro menos al día, un comodín por semana, el resumen del domingo sencillo, cambio de nombre una vez cada 60 días.',
        'Los hábitos que ya sigues se quedan; solo puedes añadir uno si tienes menos de 2.',
        'Tu minimoa **guarda los objetos premium**: vuelven a estar bloqueados, y regresan con una nueva suscripción.',
        'No se borra nada más: tu minimoa, tus vínculos, tus rachas y los objetos ganados se quedan.',
      ],
    },

    { h2: 'Derecho de desistimiento', id: 'retractation' },
    {
      p: 'Como consumidor en la Unión Europea, en principio dispones de 14 días para desistir de un contrato celebrado a distancia. Minimoa+ es un servicio digital que se presta de inmediato: al suscribirte, pides que el acceso empiece enseguida. Si desistes en ese plazo, puede retenerse un importe proporcional al servicio ya prestado, en las condiciones previstas por la ley.',
    },
    { p: 'Como la compra se hace con Apple, el desistimiento se pide a Apple:' },
    { ul: ['**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), o desde el historial de compras de tu cuenta.'] },
    { p: 'Una prueba empezada antes del 21 de noviembre de 2026 se desiste fácilmente: cancela antes del final para no pagar nada.' },

    { h2: 'Reembolsos', id: 'remboursements' },
    {
      p: 'Como los pagos los cobra Apple, **solo Apple puede reembolsar**, según sus propias condiciones. No podemos hacerlo en su lugar. Si Minimoa+ no ha funcionado como debía, escríbenos también a {{email.support}}: te ayudaremos, y tus derechos como consumidor (en particular la garantía legal de conformidad) siguen siendo plenamente aplicables.',
    },

    { h2: 'Si tu cuenta se suspende o se cierra', id: 'sanctions' },
    {
      p: 'Si tu cuenta se cierra por un incumplimiento grave de las [condiciones de uso](@conditions), el acceso a Minimoa+ también se detiene. Acuérdate de cancelar la suscripción en los ajustes de tu iPhone. Si cerramos el servicio, te avisamos al menos 30 días antes y te indicamos cómo obtener el reembolso del periodo no utilizado.',
    },

    { h2: 'Lo demás', id: 'reste' },
    {
      p: 'Estas condiciones completan las [condiciones de uso](@conditions), que también se aplican a Minimoa+ (en particular el derecho aplicable y la mediación). Las condiciones de Apple se aplican a la compra en sí. Cualquier pregunta: {{email.support}}.',
    },
  ],
};
