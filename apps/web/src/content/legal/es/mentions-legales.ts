import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Aviso legal — Minimoa',
  heading: 'Aviso legal',
  description: 'Quién edita Minimoa, quién lo aloja y cómo contactarnos.',
  intro: 'Quién edita la app y la web de Minimoa, quién las aloja y cómo contactarnos.',
  body: [
    { h2: 'Editor', id: 'editeur' },
    { p: 'La web minimoa.app y la app Minimoa están editadas por:' },
    {
      ul: [
        '**Denominación social:** {{publisher.name}}',
        '**Forma jurídica:** {{publisher.legalForm}}',
        '**Capital social:** {{publisher.shareCapital}}',
        '**Registro (SIREN, RCS):** {{publisher.registration}}',
        '**NIF-IVA intracomunitario:** {{publisher.vatNumber}}',
        '**Domicilio social:** {{publisher.address}}',
        '**Teléfono:** {{publisher.phone}}',
        '**Correo electrónico:** {{email.support}}',
      ],
    },
    { h2: 'Director de la publicación', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Alojamiento', id: 'hebergement' },
    { h3: 'La web minimoa.app' },
    { ul: ['**Proveedor:** {{siteHost.name}}', '**Dirección:** {{siteHost.address}}', '**Teléfono:** {{siteHost.phone}}'] },
    { h3: 'Los datos de la app' },
    {
      ul: [
        '**Proveedor:** {{dataHost.name}}',
        '**Dirección:** {{dataHost.address}}',
        '**Teléfono:** {{dataHost.phone}}',
        '**Ubicación de los servidores:** {{dataHost.region}}',
      ],
    },
    { p: 'La lista completa de nuestros proveedores está en la [política de privacidad](@confidentialite#prestataires).' },
    { h2: 'Contacto', id: 'contact' },
    {
      ul: [
        'Ayuda, preguntas, reclamaciones: {{email.support}}.',
        'Datos personales: {{email.privacy}}.',
        'Seguridad y contenidos ilícitos: {{email.safety}}, o la opción de denunciar en la app.',
      ],
    },
    {
      p: '{{email.support}} es también nuestro punto de contacto único para las autoridades y para los usuarios según el Reglamento europeo de Servicios Digitales (DSA). Respondemos en francés o en inglés.',
    },
    { h2: 'Denunciar un contenido ilícito', id: 'signaler' },
    {
      p: 'En la app, denuncia el mensaje o a la persona: es lo más rápido (consulta [seguridad y denuncias](@securite)). También puedes escribir a {{email.safety}} indicando cuál es el problema, dónde está y por qué crees que es ilícito.',
    },
    { h2: 'Propiedad intelectual', id: 'propriete' },
    {
      p: 'La marca Minimoa, los minimoas, las ilustraciones, los textos, las animaciones y el software están protegidos por el derecho de propiedad intelectual. Pertenecen a {{publisher.name}} o a sus socios. Está prohibido reproducirlos o reutilizarlos sin autorización, salvo lo que permita la ley (cita breve, copia privada).',
    },
    { p: 'Fuentes de la web: Anton y Allo (Josh Puckett), con licencia SIL Open Font License. Animaciones de la página de inicio: biblioteca GSAP.' },
  ],
};
