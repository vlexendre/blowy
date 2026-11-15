import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Condições da subscrição Blowy+ — Blowy',
  heading: 'Condições da subscrição Blowy+',
  description:
    'Blowy+: os planos (59,88 € por ano com 7 dias grátis, ou 14,99 € por mês), a renovação automática, a faturação pela Apple ou pela Google, como cancelar, o direito de livre resolução e os reembolsos.',
  intro: 'O que o Blowy+ inclui, quanto custa, como se renova e como o parar. Sem letras pequenas.',
  summary: {
    title: 'Em resumo',
    items: [
      '**59,88 € por ano**, com **7 dias grátis** no início, ou **14,99 € por mês**, sem período experimental.',
      'A subscrição **renova-se automaticamente** enquanto não a cancelares.',
      'É a **Apple ou a Google** que te fatura, e é nas definições da tua loja que a cancelas.',
      'Eliminar a app ou a tua conta **não cancela** a subscrição.',
      'O Blowy continua gratuito sem o Blowy+.',
    ],
  },
  body: [
    { h2: 'O que o Blowy+ acrescenta', id: 'contenu' },
    {
      ul: [
        '**O mapa inteiro**, e a possibilidade de **mudar de cidade** sem sair do sítio (sem Blowy+, vês a tua zona, cerca de 1,5 km à tua volta).',
        '**Mais encontros.**',
        '**Mais jokers** para proteger a tua série (sem Blowy+: um joker oferecido por semana).',
        '**6 hábitos** em vez de 2.',
        'Um **balanço semanal detalhado**: a evolução da tua visão em 4 semanas e a análise de cada ligação.',
        '**Mudar o nome do teu minimoa** livremente (sem Blowy+: uma vez a cada 60 dias).',
        '**Objetos premium**.',
      ],
    },
    { p: 'O conteúdo exato pode evoluir com a app. Se retirarmos uma função importante do Blowy+, avisamos-te antes, e podes cancelar.' },

    { h2: 'Planos e preços', id: 'offres' },
    {
      table: {
        head: ['Plano', 'Preço', 'Período experimental gratuito'],
        rows: [
          ['Anual', '59,88 € por ano, ou seja, 4,99 € por mês', '7 dias, depois 59,88 € por ano'],
          ['Mensal', '14,99 € por mês', 'Sem período experimental'],
        ],
      },
    },
    {
      p: 'Os preços incluem todos os impostos, para França. Noutros países, a loja mostra o preço na tua moeda, que pode ser diferente. O preço que conta é o mostrado pela App Store ou pelo Google Play no momento em que confirmas a compra.',
    },

    { h2: 'O período experimental gratuito', id: 'essai' },
    {
      ul: [
        'O período experimental de 7 dias aplica-se só ao plano anual, e só a uma subscrição nova, nas condições da loja (em geral, um período experimental por conta Apple ou Google).',
        'Durante o período experimental, todo o Blowy+ fica desbloqueado e não pagas nada.',
        'No 5.º dia, enviamos-te um lembrete: faltam 2 dias.',
        'Se não cancelares **pelo menos 24 horas antes do fim do período experimental**, o primeiro pagamento de 59,88 € é cobrado no 7.º dia e começa a subscrição anual.',
        'Se cancelares durante o período experimental, manténs o Blowy+ até ao fim dos 7 dias e não pagas nada.',
      ],
    },

    { h2: 'Pagamento e renovação automática', id: 'renouvellement' },
    {
      ul: [
        'A compra faz-se na app, através da **App Store** (iPhone) ou do **Google Play** (Android). O pagamento é debitado no meio de pagamento da tua conta Apple ou Google, quando confirmas a compra ou no fim do período experimental.',
        'A subscrição **renova-se automaticamente** pelo mesmo período (um ano ou um mês), ao mesmo preço, salvo se a cancelares **pelo menos 24 horas antes do fim do período em curso**.',
        'Se o preço mudar, a loja avisa-te antes, segundo as suas regras, e pede o teu acordo quando estas o exigem.',
        'Nunca recebemos os teus dados bancários. A loja só nos confirma a compra, que o nosso servidor verifica junto dela.',
        'Mudaste de telemóvel? Usa **Restaurar compras** na app, com a mesma conta Apple ou Google.',
      ],
    },

    { h2: 'Cancelar', id: 'annuler' },
    { p: 'Cancelas nas definições da tua loja, não no Blowy:' },
    {
      ul: [
        '**iPhone:** Definições → o teu nome → Subscrições → Blowy → Cancelar subscrição.',
        '**Android:** Google Play → o teu perfil → Pagamentos e subscrições → Subscrições → Blowy → Cancelar subscrição.',
      ],
    },
    {
      p: 'Depois de cancelares, o Blowy+ continua desbloqueado até ao fim do período já pago; depois, a tua conta volta à versão gratuita. O teu minimoa, as tuas ligações e os teus dados ficam.',
    },
    { note: '**Eliminar a app ou a tua conta Blowy não cancela a subscrição.** Cancela-a primeiro na tua loja; caso contrário, continua a ser cobrada.' },

    { h2: 'Direito de livre resolução', id: 'retractation' },
    {
      p: 'Enquanto consumidor na União Europeia, dispões em princípio de 14 dias para resolver um contrato celebrado à distância. O Blowy+ é um serviço digital prestado de imediato: ao subscrever, pedes que o acesso comece logo. Se exerceres a livre resolução nesse prazo, pode ser retido um montante proporcional ao serviço já prestado, nas condições previstas na lei.',
    },
    { p: 'Como a compra é feita com a Apple ou a Google, a livre resolução pede-se junto delas:' },
    {
      ul: [
        '**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), ou a partir do histórico de compras da tua conta.',
        '**Google:** a partir do teu histórico de encomendas do Google Play ([ajuda do Google Play](https://support.google.com/googleplay/answer/2479637)).',
      ],
    },
    { p: 'Durante o período experimental gratuito, não há nada a resolver: basta cancelar antes do fim para não pagar nada.' },

    { h2: 'Reembolsos', id: 'remboursements' },
    {
      p: 'Como os pagamentos são cobrados pela Apple ou pela Google, **só elas podem reembolsar**, segundo as suas próprias condições. Não o podemos fazer por elas. Se o Blowy+ não funcionou como previsto, escreve-nos também para {{email.support}}: vamos ajudar, e os teus direitos de consumidor (nomeadamente a garantia legal de conformidade) continuam plenamente aplicáveis.',
    },

    { h2: 'Se a tua conta for suspensa ou encerrada', id: 'sanctions' },
    {
      p: 'Se a tua conta for encerrada por uma violação grave dos [termos de utilização](@conditions), o acesso ao Blowy+ também termina. Lembra-te de cancelar a subscrição na tua loja. Se deixarmos de prestar o serviço, avisamos-te com pelo menos 30 dias de antecedência e indicamos-te como obter o reembolso do período não utilizado.',
    },

    { h2: 'O resto', id: 'reste' },
    {
      p: 'Estas condições completam os [termos de utilização](@conditions), que também se aplicam ao Blowy+ (nomeadamente a lei aplicável e a mediação). As condições da Apple ou da Google aplicam-se à compra em si. Alguma pergunta: {{email.support}}.',
    },
  ],
};
