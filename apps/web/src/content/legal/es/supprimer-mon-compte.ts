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
      note: '**¿Tienes Blowy+?** Eliminar tu cuenta no cancela la suscripción. Cancélala primero en los ajustes de tu tienda ([cómo hacerlo](@abonnement#annuler)).',
    },

    { h2: 'Sin la app', id: 'sans-app' },
    {
      p: '¿Ya no tienes acceso a la app? Escribe a {{email.privacy}}, si es posible desde la dirección de correo vinculada a tu cuenta de Apple o Google, pidiendo que se elimine tu cuenta. Podemos pedirte que confirmes que la cuenta es tuya. Nos encargamos en un mes como máximo y te confirmamos cuando esté hecho.',
    },

    { h2: 'Lo que se borra enseguida', id: 'efface' },
    {
      ul: [
        'tu cuenta, tu nombre, tu fecha de nacimiento, tu sexo, lo que buscas;',
        'tu minimoa, su visión, su estilo, sus objetos, tus hábitos, tu racha;',
        'tu ubicación y la zona aproximada de tu domicilio;',
        'tus vínculos, con sus mensajes, fotos del día y recuerdos. **También desaparecen para las otras personas**;',
        'las fotos de prueba que guardaste como recuerdo;',
        'las «3 palabras» recibidas, tus invitaciones;',
        'tus ajustes y el permiso para enviarte notificaciones.',
      ],
    },

    { h2: 'Lo que se conserva, y por qué', id: 'garde' },
    {
      table: {
        head: ['Qué', 'Por qué', 'Cuánto tiempo'],
        rows: [
          ['Copias de seguridad técnicas', 'Poder restaurar el servicio en caso de fallo', 'Se sobrescriben a medida que rotan, como máximo 30 días después'],
          ['Denuncias y decisiones de moderación', 'Seguridad de los demás y obligaciones legales. Ya no están vinculadas a tu cuenta.', '1 año después del cierre del expediente, más si un procedimiento judicial lo exige'],
          ['En caso de expulsión definitiva: un identificador técnico de tu cuenta de Apple o Google', 'Impedir un nuevo registro', '3 años'],
          ['Referencias de las compras de Blowy+', 'Obligaciones contables', 'Hasta 10 años'],
          ['Datos de conexión exigidos por la ley', 'Responder a los requerimientos de las autoridades', 'El plazo fijado por la ley, un año como máximo'],
          ['Estadísticas agregadas', 'Dirigir el servicio. No permiten identificarte.', 'Sin límite'],
        ],
      },
    },
    {
      p: 'Las «3 palabras» que elegiste para otras personas se quedan en su cuenta: son anónimas. Apple o Google conservan sus propios datos de compra y de inicio de sesión, según sus políticas. También puedes quitar Blowy de las apps conectadas a tu ID de Apple o a tu cuenta de Google.',
    },

    { h2: 'Una pregunta', id: 'question' },
    { p: 'Escribe a {{email.privacy}}. El detalle de lo que conservamos y por qué está en la [política de privacidad](@confidentialite#durees).' },
  ],
};
