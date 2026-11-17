import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'O site blowy.app não instala nenhum cookie. O que carrega de outros serviços e o que esses serviços recebem.',
  intro: 'Versão curta: o site blowy.app não instala nenhum cookie. Aqui estão os detalhes, verificados no seu código.',
  body: [
    { h2: 'O que o site instala', id: 'depose' },
    {
      p: 'O site blowy.app não instala **nenhum cookie** e não guarda nada no armazenamento do teu navegador (nem armazenamento local, nem de sessão). Não usa nenhuma ferramenta de medição de audiência, publicidade nem botões de redes sociais. É por isso que não há banner de consentimento.',
    },
    { p: 'Esta página diz respeito apenas ao site. A app Minimoa está coberta pela [política de privacidade](@confidentialite).' },

    { h2: 'O que o site carrega de outros serviços', id: 'tiers' },
    {
      p: 'Para ser apresentado, o site carrega alguns ficheiros de outros servidores. Estes serviços não instalam cookies por esta via, mas, como qualquer servidor web, recebem o teu endereço IP e informações técnicas sobre o teu navegador:',
    },
    {
      table: {
        head: ['Serviço', 'Para quê', 'Em que páginas'],
        rows: [
          ['Google Fonts (Google)', 'O tipo de letra Anton', 'Todas'],
          ['cdnjs (Cloudflare)', 'A biblioteca de animação GSAP', 'Página inicial'],
          ['Fornecedor de alojamento do site: {{siteHost.name}}', 'Servir as páginas', 'Todas'],
          ['Servidor da app Minimoa (API)', 'Mostrar o nome e o minimoa da pessoa, guardar as palavras escolhidas', 'Páginas «3 palavras» e convite'],
        ],
      },
    },
    {
      p: 'Nas páginas «3 palavras», guardamos uma impressão não reversível do teu endereço IP e do teu navegador para limitar votos duplicados (vê a [política de privacidade](@confidentialite#donnees)).',
    },

    { h2: 'Se isto mudar', id: 'changements' },
    {
      p: 'Se um dia o site instalar cookies que não sejam estritamente necessários (medição de audiência, por exemplo), pediremos o teu consentimento antes, com um verdadeiro botão «recusar», e esta página será atualizada.',
    },

    { h2: 'Manter o controlo', id: 'reglages' },
    {
      p: 'O teu navegador permite-te bloquear ou apagar cookies e limitar os pedidos a outros sites. O site continua legível se bloqueares os tipos de letra externos: usará os do teu dispositivo.',
    },
    { p: 'Alguma pergunta: {{email.privacy}}.' },
  ],
};
