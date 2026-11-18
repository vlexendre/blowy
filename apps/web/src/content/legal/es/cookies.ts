import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'La web minimoa.app no instala ninguna cookie. Lo que carga desde otros servicios y lo que esos servicios reciben.',
  intro: 'Versión corta: la web minimoa.app no instala ninguna cookie. Aquí tienes los detalles, comprobados en su código.',
  body: [
    { h2: 'Lo que instala la web', id: 'depose' },
    {
      p: 'La web minimoa.app no instala **ninguna cookie** y no usa el almacenamiento local de tu navegador. Solo durante la visita (almacenamiento de sesión, que se borra al cerrar la pestaña), guarda el código de un enlace abierto y el código de tu resultado del test, para reutilizarlos en la página; nada de esto se envía para seguirte. No usa ninguna herramienta de medición de audiencia, publicidad ni botones de redes sociales. Por eso no hay banner de consentimiento.',
    },
    { p: 'Esta página solo se refiere a la web. La app Minimoa está cubierta por la [política de privacidad](@confidentialite).' },

    { h2: 'Lo que la web carga desde otros servicios', id: 'tiers' },
    {
      p: 'Para mostrarse, la web carga algunos archivos desde otros servidores. Estos servicios no instalan cookies por esta vía, pero, como cualquier servidor web, reciben tu dirección IP e información técnica sobre tu navegador:',
    },
    {
      table: {
        head: ['Servicio', 'Para qué', 'En qué páginas'],
        rows: [
          ['Proveedor de alojamiento de la web: {{siteHost.name}}', 'Servir las páginas', 'Todas'],
          ['Servidor de la app Minimoa (API)', 'Mostrar el nombre y el minimoa de la persona, guardar las palabras elegidas', 'Páginas de «3 palabras» e invitación'],
          ['Servidor de la app Minimoa (API)', 'Calcular y guardar tu resultado del test, mostrar el contador de un barrio, guardar tu inscripción', 'Páginas «¿Qué minimoa eres?» y «Abre tu barrio»'],
        ],
      },
    },
    {
      p: 'En las páginas de «3 palabras», guardamos una huella no reversible de tu dirección IP y de tu navegador para limitar los votos duplicados (consulta la [política de privacidad](@confidentialite#donnees)).',
    },

    { h2: 'Si esto cambia', id: 'changements' },
    {
      p: 'Si algún día la web instala cookies que no sean estrictamente necesarias (medición de audiencia, por ejemplo), te pediremos tu consentimiento antes, con un botón de «rechazar» de verdad, y actualizaremos esta página.',
    },

    { h2: 'Mantener el control', id: 'reglages' },
    {
      p: 'Tu navegador te permite bloquear o borrar las cookies y limitar las peticiones a otros sitios. La fuente de la web (Allo) la sirve la propia web: no se carga ninguna fuente desde otro servicio.',
    },
    { p: 'Cualquier pregunta: {{email.privacy}}.' },
  ],
};
