import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Seguridad y denuncias — Blowy',
  heading: 'Seguridad y denuncias',
  description: 'Cómo denunciar o bloquear a alguien en Blowy, qué pasa después, nuestros consejos para una primera cita, los números de emergencia y nuestra política de protección de menores.',
  intro: 'Cómo denunciar, bloquear, protegerte y a quién llamar en caso de emergencia.',
  body: [
    { note: '**¿Peligro inmediato?** Llama al **112** (emergencias en toda la Unión Europea). En Francia: **17** (policía), o envía un SMS al **114** si no puedes hablar.' },

    { h2: 'Denunciar a alguien', id: 'signaler' },
    {
      ol: [
        'Abre el chat con la persona, o su ficha en tus encuentros.',
        'Toca el menú arriba a la derecha y luego **Denunciar**.',
        'Elige el motivo: acoso, contenido inapropiado, perfil falso, persona menor de edad u otro.',
        'Añade unas palabras si quieres (qué pasó, cuándo). Nos ayuda a actuar rápido.',
        'Puedes bloquear a la persona al mismo tiempo.',
      ],
    },
    {
      p: 'La persona no sabe que la denuncia viene de ti. ¿No tienes la app a mano? Escribe a {{email.safety}} con el nombre de la persona y lo que pasó.',
    },

    { h2: 'Qué pasa después', id: 'suite' },
    {
      ul: [
        '**Objetivo: una respuesta en 24 horas.** Las denuncias graves (menores, amenazas, violencia) van primero.',
        'Un moderador de Blowy lee **el mensaje denunciado y su contexto inmediato**, y nada más de tus conversaciones.',
        'Según la gravedad: retirada del contenido, advertencia, limitación, suspensión o cierre de la cuenta. Lo que es ilegal puede transmitirse a las autoridades.',
        'Te confirmamos que tu denuncia se ha tramitado. Para proteger la intimidad de todos, no siempre detallamos la sanción.',
      ],
    },

    { h2: 'Bloquear a alguien', id: 'bloquer' },
    {
      p: 'En el mismo menú, elige **Bloquear**. La persona ya no puede escribirte, vuestro vínculo desaparece y vuestros minimoas no volverán a cruzarse, ni en encuentros ni en el mapa. No recibe aviso. Encontrarás a las personas bloqueadas en **Yo → Ajustes → Personas bloqueadas**, donde puedes desbloquearlas.',
    },

    { h2: 'Tus protecciones en la app', id: 'protections' },
    {
      ul: [
        'Tu posición nunca es exacta en el mapa: redondeada a unos 300 m y desplazada, nunca en tiempo real.',
        'El **modo discreto** te quita del mapa.',
        'Nada pasa sin tu acuerdo: saludas, la otra persona acepta, se crea el vínculo.',
        'Puedes salir de un vínculo en cualquier momento.',
      ],
    },

    { h2: 'Antes de veros en persona', id: 'rencontre' },
    {
      ul: [
        '**Tómate tu tiempo.** Habla primero en la app. Que alguien te meta prisa es una señal.',
        '**Un lugar público**, la primera vez: un café, un parque concurrido. Ni en tu casa ni en la suya.',
        '**Avisa a alguien de confianza**: dónde, cuándo, con quién. Acordad un mensaje que enviar durante o después.',
        '**Mantén tu autonomía**: ve y vuelve por tus propios medios. Lleva el teléfono cargado.',
        '**No des demasiado pronto** tu dirección, tu lugar de trabajo ni tu información privada.',
        '**Nunca dinero.** Nadie tiene una buena razón para pedírtelo. Denúncialo.',
        '**Vigila tu bebida** y lo que consumes.',
        '**Hazte caso**: si algo no encaja, puedes irte, sin dar explicaciones.',
      ],
    },
    { p: 'Una compatibilidad, aunque sea alta, no garantiza nada sobre una persona. Blowy no verifica la identidad de los usuarios.' },

    { h2: 'Números útiles', id: 'urgences' },
    {
      table: {
        head: ['Número', 'Para qué'],
        rows: [
          ['**112**', 'Emergencias, desde cualquier país de la Unión Europea'],
          ['**17**', 'Policía, gendarmería (Francia)'],
          ['**15**', 'Urgencias médicas, SAMU (Francia)'],
          ['**18**', 'Bomberos (Francia)'],
          ['**114**', 'Emergencias por SMS, para personas sordas, con discapacidad auditiva o que no pueden hablar (Francia)'],
          ['**3919**', 'Violencia contra las mujeres, gratuito y anónimo (Francia)'],
          ['**3018**', 'Ciberacoso y violencia digital, gratuito y confidencial (Francia)'],
          ['**119**', 'Infancia en peligro (Francia)'],
        ],
      },
    },
    {
      p: 'Un contenido ilegal en internet también puede denunciarse en la plataforma oficial francesa [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Fuera de Francia, llama al 112 o a los números de emergencia de tu país.',
    },

    { h2: 'Protección de menores', id: 'mineurs' },
    {
      p: 'Blowy es solo para adultos de 18 años o más. La fecha de nacimiento se pide antes de iniciar sesión; con menos de 18 años, el registro se detiene y no se crea nada.',
    },
    {
      p: '**Tolerancia cero** con cualquier contenido o comportamiento que sexualice o ponga en peligro a un menor. En cuanto lo sabemos: se retira el contenido, se cierra la cuenta definitivamente y los hechos se denuncian a las autoridades competentes.',
    },
    {
      ul: [
        'En la app: **Denunciar**, motivo «Persona menor de edad».',
        'Por correo: {{email.safety}}.',
        'En Francia, también puedes denunciarlo en [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), o llamar al **119** si un niño está en peligro.',
      ],
    },
    { p: 'Para saber más: [normas de la comunidad](@regles), [condiciones de uso](@conditions#moderation).' },
  ],
};
