import type { LegalPage } from '../types';

export const cookies: LegalPage = {
  title: 'Cookies — Minimoa',
  heading: 'Cookies',
  description: 'O site minimoa.app não grava nenhum cookie. O que ele carrega de outros serviços, e o que esses serviços recebem.',
  intro: 'Versão curta: o site minimoa.app não grava nenhum cookie. Aqui estão os detalhes, conferidos no código dele.',
  body: [
    { h2: 'O que o site grava', id: 'depose' },
    {
      p: 'O site minimoa.app não grava **nenhum cookie** e não usa o armazenamento local do seu navegador. Só durante a visita (armazenamento de sessão, apagado quando a aba é fechada), ele guarda o código de um link aberto e o código do seu resultado no quiz, para reutilizá-los na página; nada disso é enviado para te rastrear. Ele não usa nenhuma ferramenta de medição de audiência, nenhuma publicidade e nenhum botão de rede social. É por isso que não existe aviso de consentimento.',
    },
    { p: 'Esta página trata só do site. O app Minimoa é coberto pela [política de privacidade](@confidentialite).' },

    { h2: 'O que o site carrega de outros serviços', id: 'tiers' },
    {
      p: 'Para ser exibido, o site carrega alguns arquivos de outros servidores. Esses serviços não gravam cookies por esse meio, mas recebem, como qualquer servidor web, o seu endereço IP e informações técnicas sobre o seu navegador:',
    },
    {
      table: {
        head: ['Serviço', 'Para quê', 'Em quais páginas'],
        rows: [
          ['Hospedagem do site: {{siteHost.name}}', 'Entregar as páginas', 'Todas'],
          ['Servidor do app Minimoa (API)', 'Mostrar o nome e o minimoa da pessoa, registrar as palavras escolhidas', 'Páginas “3 palavras” e convite'],
          ['Servidor do app Minimoa (API)', 'Calcular e guardar seu resultado no quiz, mostrar o contador de um bairro, registrar sua inscrição', 'Páginas “Qual minimoa é você?” e “Abra seu bairro”'],
        ],
      },
    },
    {
      p: 'Nas páginas “3 palavras”, guardamos uma impressão irreversível do seu endereço IP e do seu navegador para limitar votos duplicados (veja a [política de privacidade](@confidentialite#donnees)).',
    },

    { h2: 'Se isso mudar', id: 'changements' },
    {
      p: 'Se um dia o site gravar cookies que não sejam estritamente necessários (medição de audiência, por exemplo), vamos pedir sua concordância antes, com um botão “recusar” de verdade, e esta página será atualizada.',
    },

    { h2: 'Manter o controle', id: 'reglages' },
    {
      p: 'Seu navegador permite bloquear ou apagar cookies e limitar as requisições a outros sites. A fonte do site (Allo) é servida pelo próprio site: nenhuma fonte é carregada de outro serviço.',
    },
    { p: 'Alguma dúvida? {{email.privacy}}.' },
  ],
};
