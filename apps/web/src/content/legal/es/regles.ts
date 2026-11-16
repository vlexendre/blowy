import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Normas de la comunidad — Minimoa',
  heading: 'Normas de la comunidad',
  description: 'Las normas de Minimoa: respeto, consentimiento, nada de acoso, nada de menores, nada de contenido sexual. Qué pasa si no se respetan.',
  intro: 'Minimoas, y humanos de verdad detrás. Para que siga siendo un sitio al que apetezca volver, unas pocas normas sencillas.',
  body: [
    { h2: 'Respeta a la gente', id: 'respect' },
    { p: 'Detrás de cada minimoa hay una persona real. Humor, sí; humillaciones, no. Se puede no estar de acuerdo sin hacer daño.' },

    { h2: 'No es no', id: 'consentement' },
    {
      p: 'Si alguien no responde, no te devuelve el saludo, sale de un vínculo o te bloquea, es su decisión. No se insiste una y otra vez, no se crea otra cuenta para saltarse un rechazo y no se busca a la persona en otro sitio.',
    },

    { h2: 'Nada de acoso ni de odio', id: 'harcelement' },
    {
      p: 'Prohibido: insultos, amenazas, chantaje, mensajes repetidos no deseados, burlas sobre el físico, el origen, la religión, el género, la orientación sexual o la discapacidad, llamadas al odio o a la violencia.',
    },

    { h2: '18 años o más, sin excepciones', id: 'majeurs' },
    {
      p: 'Minimoa es solo para adultos. Toda cuenta de una persona menor de edad se elimina. Todo contenido que sexualice a un menor se retira, su autor es expulsado y lo denunciamos a las autoridades. Si crees que hablas con una persona menor, denúnciala con el motivo «Persona menor de edad».',
    },

    { h2: 'Nada de desnudos ni de contenido sexual', id: 'contenus' },
    {
      p: 'Ni en los mensajes, ni en la foto de perfil, ni en la foto de prueba. Tampoco contenido violento, impactante o ilegal. Una foto de prueba son tus zapatillas, tu libro, tu plato: no tú en ropa interior.',
    },

    { h2: 'Sé tú', id: 'authenticite' },
    { p: 'Una cuenta por persona, para una persona real. Nada de perfiles falsos ni de suplantación de identidad. Y nada de trampas: nada de fotos de prueba falsas ni de ubicación falsificada.' },

    { h2: 'Nada de estafas ni de comercio', id: 'arnaques' },
    {
      p: 'No se pide dinero, regalos ni códigos. Nada de publicidad, spam, enlaces dudosos ni servicios sexuales remunerados. ¿Alguien te pide dinero? Denúncialo.',
    },

    { h2: 'Protege la intimidad de los demás', id: 'vie-privee' },
    { p: 'No compartas la dirección, el número, las fotos o los mensajes de nadie sin su consentimiento. Lo que se dice en un vínculo se queda en el vínculo.' },

    { h2: 'Qué pasa si no se respeta una norma', id: 'sanctions' },
    {
      p: 'Los nombres, los nombres de minimoa, los mensajes y las fotos de perfil pasan por un **filtro automático**: lo que infringe claramente estas normas no se publica, y la app dice por qué; un mensaje dudoso (un insulto, por ejemplo) se envía, pero se señala al equipo de moderación. Cada denuncia, de una persona o del filtro, avisa al equipo, que la revisa con el objetivo de responder en 24 horas. Un moderador puede leer el mensaje denunciado y su contexto inmediato, nada más. Según la gravedad:',
    },
    {
      ol: [
        'se retira el contenido;',
        'la persona recibe una advertencia;',
        'se limitan algunas funciones o se suspende la cuenta;',
        'se cierra la cuenta definitivamente, desde la primera vez en los casos graves (menores, amenazas, violencia, estafas).',
      ],
    },
    {
      p: 'Dos casos suspenden una cuenta automáticamente, 72 horas como máximo, mientras un moderador la revisa: vocabulario pederasta explícito en un mensaje, o una cuenta denunciada como menor por dos personas distintas. Lo que es ilegal puede denunciarse a las autoridades. La persona afectada recibe los motivos de la decisión y puede impugnarla, sea automática o no ([condiciones de uso](@conditions#moderation)).',
    },

    { h2: 'Denunciar y bloquear', id: 'signaler' },
    {
      p: 'Desde un chat o un encuentro, abre el menú y elige **Denunciar** o **Bloquear**; en un chat, una pulsación larga sobre un mensaje también permite denunciarlo. La persona no sabe quién la ha denunciado y no recibe aviso de un bloqueo. Todo se explica en [seguridad y denuncias](@securite).',
    },
    { p: 'Estas normas forman parte de las [condiciones de uso](@conditions). Una pregunta, una duda: {{email.support}}. Responde un humano, no un minimoa.' },
  ],
};
