import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'ir al contenido',
  download: 'descargar',
  updated: 'Última actualización:',
  translationNotice: 'Esto es una traducción. Si difiere de la versión francesa, prevalece la versión francesa.',
  frenchVersion: 'Leer la versión francesa',
  languageLabel: 'Idioma',
  tocLabel: 'Índice',
  otherDocs: 'Otros documentos',
  footerLabel: 'enlaces legales',
  footerLinks: [
    { slug: 'assistance', label: 'ayuda' },
    { slug: 'mentions-legales', label: 'aviso legal' },
    { slug: 'conditions', label: 'condiciones' },
    { slug: 'confidentialite', label: 'privacidad' },
    { slug: 'index', label: 'todo lo legal' },
  ],
  index: {
    title: 'Información legal — Minimoa',
    heading: 'Información legal',
    description: 'Todos los documentos legales de Minimoa: aviso legal, condiciones, privacidad, Minimoa+, normas, cookies, seguridad, eliminación de la cuenta, ayuda.',
    intro: 'Todo lo que regula Minimoa, en un solo lugar. Prevalece la versión francesa.',
    publisherTitle: 'Quién edita Minimoa',
    publisherText:
      'Minimoa está editado por **{{publisher.name}}**. Los detalles (forma jurídica, registro, dirección, proveedores de alojamiento) están en el [aviso legal](@mentions-legales). Para escribirnos: {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Aviso legal',
    conditions: 'Condiciones de uso',
    confidentialite: 'Privacidad',
    abonnement: 'Suscripción Minimoa+',
    regles: 'Normas de la comunidad',
    cookies: 'Cookies',
    securite: 'Seguridad y denuncias',
    'supprimer-mon-compte': 'Eliminar mi cuenta',
    assistance: 'Ayuda',
  },
};
