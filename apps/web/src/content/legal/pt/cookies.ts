import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'O site minimoa.app não instala nenhum cookie. O que carrega de outros serviços e o que esses serviços recebem.',
  intro: 'Versão curta: o site minimoa.app não instala nenhum cookie. Aqui estão os detalhes, verificados no seu código.',
  body: [
    { h2: 'O que o site instala', id: 'depose' },
    {
      p: 'O site minimoa.app não instala **nenhum cookie** e não usa o armazenamento local do teu navegador. Só durante a visita (armazenamento de sessão, apagado quando fechas o separador), guarda o código de um link aberto e o código do teu resultado do quiz, para os reutilizar na página; nada disto é enviado para te seguir. Não usa nenhuma ferramenta de medição de audiência, publicidade nem botões de redes sociais. É por isso que não há banner de consentimento.',
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
          ['Fornecedor de alojamento do site: {{siteHost.name}}', 'Servir as páginas', 'Todas'],
          ['Servidor da app Minimoa (API)', 'Mostrar o nome e o minimoa da pessoa, guardar as palavras escolhidas', 'Páginas «3 palavras» e convite'],
          ['Servidor da app Minimoa (API)', 'Calcular e guardar o teu resultado do quiz, mostrar o contador de um bairro, guardar a tua inscrição', 'Páginas «Qual minimoa és tu?» e «Abre o teu bairro»'],
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
      p: 'O teu navegador permite-te bloquear ou apagar cookies e limitar os pedidos a outros sites. O tipo de letra do site (Allo) é servido pelo próprio site: nenhum tipo de letra é carregado de outro serviço.',
    },
    { p: 'Alguma pergunta: {{email.privacy}}.' },
  ],
};
