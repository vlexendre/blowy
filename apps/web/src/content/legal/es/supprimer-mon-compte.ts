import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Eliminar mi cuenta y mis datos — Blowy',
  heading: 'Eliminar mi cuenta',
  description: 'Cómo eliminar tu cuenta de Blowy y tus datos, qué se borra y cuándo, qué se conserva y por qué.',
  intro: 'Puedes eliminar tu cuenta y tus datos cuando quieras, directamente en la app. Así se hace, y esto es lo que borra.',
  body: [
    { h2: 'En la app', id: 'app' },
    { ol: ['Abre la pestaña **Yo**.', 'Toca **Ajustes**.', 'Toca **Eliminar mi cuenta**.', 'Escribe la palabra de confirmación que aparece en pantalla.'] },
    { p: 'Es inmediato y definitivo: después no se puede recuperar nada.' },
    {
      note: '**¿Tienes Blowy+?** Eliminar tu cuenta no cancela la suscripción. Cancélala primero en los ajustes de tu iPhone ([cómo hacerlo](@abonnement#annuler)).',
    },

    { h2: 'Sin la app', id: 'sans-app' },
    {
      p: '¿Ya no tienes acceso a la app? Escribe a {{email.privacy}}, si es posible desde la dirección de correo vinculada a tu cuenta de Apple o Google, pidiendo que se elimine tu cuenta. Podemos pedirte que confirmes que la cuenta es tuya. Nos encargamos en un mes como máximo y te confirmamos cuando esté hecho.',
    },

    { h2: 'Lo que se borra enseguida', id: 'efface' },
    {
      ul: [
        'tu cuenta, tu nombre, tu fecha de nacimiento, tu sexo, lo que buscas, tu foto de perfil;',
        'tu token de inicio de sesión de Apple, después de revocar ante Apple el acceso de Blowy a tu ID de Apple;',
        'tu minimoa, su visión, su estilo, sus objetos, tus hábitos, tu racha;',
        'tu posición redondeada, tu zona de domicilio aproximada o la ciudad que elegiste;',
        'tus vínculos, con sus mensajes, sus antiguas fotos del día y sus etapas. **También desaparecen para las otras personas**;',
        'tus fotos de prueba y de reto, guardadas como recuerdo o aún no borradas;',
        'las «3 palabras» recibidas, tus invitaciones;',
        'tus ajustes y el permiso para enviarte notificaciones.',
      ],
    },

    { h2: 'Lo que se conserva, y por qué', id: 'garde' },
    {
      table: {
        head: ['Qué', 'Por qué', 'Cuánto tiempo'],
        rows: [
          ['Copias de seguridad técnicas', 'Poder restaurar el servicio en caso de avería', 'Se sobrescriben a medida que rotan: {{dataHost.backupRetention}}'],
          ['Denuncias y decisiones de moderación', 'Seguridad de los demás y obligaciones legales. Ya no están vinculadas a ninguna cuenta; el registro de decisiones conserva el nombre afectado.', '1 año después del cierre del expediente (una denuncia aún abierta: hasta que se tramite, y después 1 año), más tiempo solo si la ley lo exige'],
          ['En caso de exclusión definitiva: una huella no reversible de tu identificador de Apple o Google', 'Impedir un nuevo registro', '3 años'],
          ['Referencias de las compras de Blowy+', 'Obligaciones contables. Ya no están vinculadas a ninguna cuenta.', 'Hasta 10 años'],
          ['Días de actividad y clasificación interna (estadísticas)', 'Calcular las cifras del servicio', '40 días como máximo'],
          ['Estadísticas agregadas', 'Dirigir el servicio. No permiten identificarte.', 'Sin límite'],
        ],
      },
    },
    {
      p: 'Las «3 palabras» que elegiste para otras personas se quedan en su cuenta: son anónimas. Apple o Google conservan sus propios datos de compra y de inicio de sesión, según sus políticas. Con Apple, la eliminación también quita Blowy de las apps que usan tu ID de Apple; con Google, puedes hacerlo desde tu cuenta de Google. Lo que ya se envió a nuestro proveedor de IA sigue lo que este conserva por su parte ([política de privacidad](@confidentialite#ia)).',
    },

    { h2: 'Una pregunta', id: 'question' },
    { p: 'Escribe a {{email.privacy}}. El detalle de lo que conservamos y por qué está en la [política de privacidad](@confidentialite#durees).' },
  ],
};
