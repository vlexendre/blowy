import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Ayuda y contacto — Minimoa',
  heading: 'Ayuda',
  description: '¿Una pregunta, un error, un problema con alguien, con tu suscripción o con tus datos? Las respuestas más buscadas y cómo escribirnos.',
  intro: 'Las preguntas que más nos hacen. ¿No encuentras la tuya? Escríbenos: responde un humano, no un minimoa.',
  body: [
    { h2: 'Escríbenos', id: 'contact' },
    {
      table: {
        head: ['Para', 'Escribe a'],
        rows: [
          ['Una pregunta, un error, una idea', '{{email.support}}'],
          ['Tus datos personales', '{{email.privacy}}'],
          ['Un problema de seguridad, un contenido ilegal, un menor', '{{email.safety}}, y denuncia también a la persona en la app'],
        ],
      },
    },
    {
      p: 'Si es un error, dinos el modelo de tu teléfono, la versión de la app (abajo del todo en **Yo → Ajustes**) y qué estabas haciendo. Respondemos en francés o en inglés.',
    },
    { note: '**¿Peligro inmediato?** No esperes nuestra respuesta: llama al **112** (o al **17** en Francia). Consulta [seguridad y denuncias](@securite).' },

    { h2: 'Preguntas frecuentes', id: 'faq' },
    {
      faq: [
        {
          q: '¿Qué es un minimoa?',
          a: [
            'Tu minimoa eres tú en pequeño: lleva tu visión de la vida y tus hábitos. Te presenta a personas cuya visión es compatible con la tuya para crear vínculos. Lo que lleguen a ser depende de vosotros. Cuanto más lo cuidas (saliendo, manteniendo tus hábitos), más gente te presenta. Nunca muere.',
          ],
        },
        {
          q: '¿Cómo elige mi minimoa a quién presentarme?',
          a: [
            'Compara tu visión (5 ejes: hogar, arraigo, impulso, ritmo, rumbo) con la de los demás, y solo presenta a personas por encima del 70 % de compatibilidad. Cada encuentro explica por qué: 3 puntos en común y 1 diferencia. Los detalles están en la [política de privacidad](@confidentialite#compatibilite).',
          ],
        },
        {
          q: '¿Por qué Minimoa pide mi ubicación?',
          a: [
            'Para el mapa y los encuentros cercanos, solo con la app abierta. Tu posición exacta nunca se guarda: solo guardamos un punto redondeado a unos 300 m. Los demás ven una posición redondeada y desplazada, y el modo discreto te quita del mapa. Sin ubicación, eliges tu ciudad a mano (Encuentros, o Yo → Ajustes → Mi ubicación) y sigues teniendo encuentros.',
          ],
        },
        {
          q: '¿Quién lee mis mensajes?',
          a: [
            'Nadie en Minimoa lee tus conversaciones, salvo un mensaje denunciado (por alguien o por nuestro filtro automático): un moderador lee entonces ese mensaje y su contexto inmediato. Si la activáis los dos, una IA, la de nuestro proveedor {{sub.ai.provider}}, lee vuestros últimos mensajes para que vuestros minimoas puedan reaccionar; Minimoa no guarda nada de esa lectura. Puedes desactivarla en las opciones del vínculo o en Yo → La IA y tú.',
          ],
        },
        {
          q: '¿Qué pasa con mis fotos de prueba?',
          a: [
            'Antes de tu primera prueba, la app te pregunta si una IA ({{sub.ai.provider}}) puede comprobar tus fotos. Si aceptas, se le envía la foto reducida; si no, validas tus hábitos de palabra, sin foto. Ningún ser humano ve tus fotos de prueba, y se borran en 24 horas, salvo que las guardes en tus recuerdos privados. Puedes cambiar de opinión en Yo → La IA y tú.',
          ],
        },
        {
          q: '¿Por qué se ha rechazado mi mensaje, mi nombre o mi foto?',
          a: [
            'Los nombres, los nombres de minimoa, los mensajes y las fotos de perfil pasan por un filtro automático, que bloquea lo que infringe claramente las [normas de la comunidad](@regles). La app te dice por qué, y tu texto se queda ahí para que lo modifiques. ¿Crees que es un error? Escribe a {{email.support}}: una persona lo revisará.',
          ],
        },
        {
          q: 'Ya no puedo iniciar sesión. ¿Qué hago?',
          a: [
            'El inicio de sesión pasa por Apple (iPhone) o Google (Android). Usa el mismo ID de Apple o la misma cuenta de Google que al registrarte. ¿Tu cuenta está suspendida? La pantalla te dice hasta cuándo, y te permite escribir al soporte para impugnarlo. Si sigue sin funcionar, escríbenos a {{email.support}}.',
          ],
        },
        {
          q: '¿Cómo cancelo Minimoa+?',
          a: [
            'En los ajustes de tu iPhone, no en Minimoa: Ajustes → tu nombre → Suscripciones (en la app, Yo → Minimoa+ → Gestionar mi suscripción te lleva allí). Detalles en las [condiciones de Minimoa+](@abonnement#annuler).',
          ],
        },
        {
          q: '¿Cómo consigo un reembolso?',
          a: [
            'Los pagos pasan por Apple: es Apple quien reembolsa, según sus condiciones. El enlace está en las [condiciones de Minimoa+](@abonnement#remboursements).',
          ],
        },
        {
          q: '¿Cómo denuncio o bloqueo a alguien?',
          a: [
            'Desde el chat o el encuentro, menú «…» arriba a la derecha y luego Denunciar o Bloquear; en un chat, una pulsación larga sobre un mensaje permite denunciarlo. Consulta [seguridad y denuncias](@securite).',
          ],
        },
        {
          q: '¿Cómo elimino mi cuenta?',
          a: ['Yo → Ajustes → Eliminar mi cuenta. Todo se explica en la página [eliminar mi cuenta](@supprimer-mon-compte).'],
        },
        {
          q: '¿Cómo obtengo una copia de mis datos?',
          a: ['Escribe a {{email.privacy}}. Te respondemos en un mes. Tus derechos se detallan en la [política de privacidad](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'Lee también', id: 'documents' },
    { p: '[Condiciones de uso](@conditions) · [Privacidad](@confidentialite) · [Normas de la comunidad](@regles) · [Aviso legal](@mentions-legales)' },
  ],
};
