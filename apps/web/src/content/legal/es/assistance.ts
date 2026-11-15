import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Ayuda y contacto — Blowy',
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
            'Tu minimoa eres tú en pequeño: lleva tu visión de la vida y tus hábitos. Te presenta a personas cuya visión es compatible con la tuya, para ser amigos o algo más. Cuanto más lo cuidas (saliendo, manteniendo tus hábitos), más gente te presenta. Nunca muere.',
          ],
        },
        {
          q: '¿Cómo elige mi minimoa a quién presentarme?',
          a: [
            'Compara tu visión (5 ejes: hogar, arraigo, impulso, ritmo, rumbo) con la de los demás, y solo presenta a personas por encima del 70 % de compatibilidad. Cada encuentro explica por qué: 3 puntos en común y 1 diferencia. Los detalles están en la [política de privacidad](@confidentialite#compatibilite).',
          ],
        },
        {
          q: '¿Por qué Blowy pide mi ubicación?',
          a: [
            'Para el mapa y los encuentros cercanos, solo con la app abierta. Tu posición se redondea y se desplaza para los demás, y el modo discreto te quita del mapa. Sin ubicación, el resto de la app funciona.',
          ],
        },
        {
          q: '¿Quién lee mis mensajes?',
          a: [
            'Ningún humano lee tus conversaciones. Si los dos lo activáis, una IA lee vuestros mensajes para que vuestros minimoas puedan reaccionar; no se conserva nada después. Puedes desactivarla en las opciones del vínculo o en Yo. Única excepción: si se denuncia un mensaje, un moderador lee ese mensaje y su contexto inmediato.',
          ],
        },
        {
          q: '¿Qué pasa con mis fotos de prueba?',
          a: ['Una IA verifica la foto, ningún humano la ve y se elimina en 24 horas, salvo si la guardas en tus recuerdos privados.'],
        },
        {
          q: 'Ya no puedo iniciar sesión. ¿Qué hago?',
          a: [
            'El inicio de sesión pasa por Apple (iPhone) o Google (Android). Usa el mismo ID de Apple o la misma cuenta de Google que al registrarte. Si sigue sin funcionar, escríbenos a {{email.support}}.',
          ],
        },
        {
          q: '¿Cómo cancelo Blowy+?',
          a: [
            'En los ajustes de tu tienda, no en Blowy. iPhone: Ajustes → tu nombre → Suscripciones. Android: Google Play → perfil → Pagos y suscripciones → Suscripciones. Detalles en las [condiciones de Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: '¿Cómo consigo un reembolso?',
          a: ['Los pagos pasan por Apple o Google: son ellos quienes reembolsan, según sus condiciones. Los enlaces están en las [condiciones de Blowy+](@abonnement#remboursements).'],
        },
        {
          q: '¿Cómo denuncio o bloqueo a alguien?',
          a: ['Desde el chat o el encuentro, menú arriba a la derecha y luego Denunciar o Bloquear. Consulta [seguridad y denuncias](@securite).'],
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
