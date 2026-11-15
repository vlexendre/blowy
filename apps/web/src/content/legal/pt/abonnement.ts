import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Condições da subscrição Blowy+ — Blowy',
  heading: 'Condições da subscrição Blowy+',
  description:
    'Blowy+: o que inclui, os planos (59,88 € por ano com 7 dias grátis, ou 14,99 € por mês), a renovação automática, a faturação pela Apple, como cancelar, o que acontece no fim, o direito de livre resolução e os reembolsos.',
  intro: 'O que o Blowy+ inclui, quanto custa, como se renova e como o parar. Sem letras pequenas.',
  summary: {
    title: 'Em resumo',
    items: [
      '**59,88 € por ano**, com **7 dias grátis** no início, ou **14,99 € por mês**, sem período experimental.',
      'A subscrição **renova-se automaticamente** enquanto não a cancelares.',
      'O Blowy+ compra-se no iPhone: é a **Apple** que te fatura, e é nas definições do teu iPhone que o cancelas.',
      'No 5.º dia do período experimental, avisamos-te **por notificação e por e-mail**.',
      'Eliminar a app ou a tua conta **não cancela** a subscrição.',
      'O Blowy continua gratuito sem o Blowy+.',
    ],
  },
  body: [
    { h2: 'O que o Blowy+ acrescenta', id: 'contenu' },
    {
      ul: [
        '**O mapa inteiro**, e **mudar de cidade quando quiseres**, sem sair do sítio. Sem o Blowy+, vês a tua zona (cerca de 1,5 km à tua volta); sem localização, escolhes a tua cidade à mão, no máximo uma vez a cada 30 dias.',
        '**Mais um encontro por dia.**',
        '**3 jokers de série por semana** para proteger a tua série (sem o Blowy+: um por semana).',
        '**Até 6 hábitos** ao mesmo tempo (sem o Blowy+: 2).',
        'O **resumo detalhado de domingo**: a evolução da tua visão em 4 semanas e o balanço de cada ligação.',
        '**Mudar o nome do teu minimoa quando quiseres** (sem o Blowy+: uma vez a cada 60 dias).',
        '**Todos os objetos premium do guarda-roupa**: são do teu minimoa e podem ser usados logo, enquanto a subscrição durar.',
      ],
    },
    { p: 'O conteúdo exato pode evoluir com a app. Se retirarmos uma função importante do Blowy+, avisamos-te antes, e podes cancelar.' },

    { h2: 'Planos e preços', id: 'offres' },
    {
      table: {
        head: ['Plano', 'Preço', 'Período experimental'],
        rows: [
          ['Anual', '59,88 € por ano, ou seja, 4,99 € por mês', '7 dias, depois 59,88 € por ano'],
          ['Mensal', '14,99 € por mês', 'Sem período experimental'],
        ],
      },
    },
    {
      p: 'Os preços incluem todos os impostos, para França. Noutros países, a App Store mostra o preço na tua moeda, que pode ser diferente. O preço que conta é o que a App Store mostra no momento em que confirmas a compra.',
    },

    { h2: 'O período experimental gratuito', id: 'essai' },
    {
      ul: [
        'O período experimental de 7 dias aplica-se só ao plano anual, e só a uma nova subscrição, nas condições da Apple (em geral, um período experimental por conta Apple).',
        'Durante o período experimental, todo o Blowy+ está aberto e não pagas nada.',
        'No 5.º dia, enviamos-te um lembrete: faltam 2 dias. Chega por notificação (se as autorizaste) e por e-mail, para o endereço associado à tua conta Apple.',
        'Se não cancelares **pelo menos 24 horas antes do fim do período experimental**, o primeiro pagamento de 59,88 € é cobrado no 7.º dia e a subscrição anual começa.',
        'Se cancelares durante o período experimental, manténs o Blowy+ até ao fim dos 7 dias e não pagas nada.',
      ],
    },

    { h2: 'Pagamento e renovação automática', id: 'renouvellement' },
    {
      ul: [
        'A compra faz-se na app, no iPhone, através da **App Store**. O pagamento é debitado no meio de pagamento da tua conta Apple, ao confirmares a compra ou no fim do período experimental. No Android e na web, o Blowy+ não está à venda; uma subscrição feita no iPhone acompanha a tua conta Blowy em todo o lado.',
        'A subscrição **renova-se automaticamente** pelo mesmo período (um ano ou um mês), ao mesmo preço, exceto se a cancelares **pelo menos 24 horas antes do fim do período em curso**.',
        'Se o preço mudar, a Apple avisa-te antes, segundo as suas regras, e pede o teu acordo quando estas o exigem.',
        'Nunca recebemos os teus dados bancários. A Apple só nos confirma a compra, que o nosso servidor verifica junto dela.',
        'Mudaste de telemóvel? Usa **Restaurar compras** na app, com a mesma conta Apple.',
      ],
    },

    { h2: 'Cancelar', id: 'annuler' },
    { p: 'Cancelas nas definições do teu iPhone, não no Blowy (na app, **Eu → Blowy+ → Gerir a minha subscrição** leva-te lá):' },
    { ul: ['**iPhone:** Definições → o teu nome → Subscrições → Blowy → Cancelar subscrição.'] },
    {
      p: 'Depois de cancelares, o Blowy+ fica aberto até ao fim do período já pago, e depois a tua conta volta à versão gratuita. O teu minimoa, as tuas ligações e os teus dados ficam.',
    },
    { note: '**Eliminar a app ou a tua conta Blowy não cancela a subscrição.** Cancela-a primeiro nas definições do teu iPhone, senão continuas a ser cobrado.' },

    { h2: 'Quando o Blowy+ termina', id: 'fin' },
    {
      ul: [
        'O mapa volta à tua zona (ou à cidade escolhida à mão); a cidade escolhida com o Blowy+ fica guardada e volta com uma nova subscrição.',
        'Menos um encontro por dia, um joker por semana, o resumo de domingo simples, mudança de nome uma vez a cada 60 dias.',
        'Os hábitos que já segues ficam; só podes acrescentar um se tiveres menos de 2.',
        'O teu minimoa **arruma os objetos premium**: voltam a ficar bloqueados, e regressam com uma nova subscrição.',
        'Nada mais é apagado: o teu minimoa, as tuas ligações, as tuas séries e os objetos ganhos ficam.',
      ],
    },

    { h2: 'Direito de livre resolução', id: 'retractation' },
    {
      p: 'Enquanto consumidor na União Europeia, dispões em princípio de 14 dias para resolver um contrato celebrado à distância. O Blowy+ é um serviço digital prestado de imediato: ao subscrever, pedes que o acesso comece logo. Se exerceres a livre resolução nesse prazo, pode ser retido um montante proporcional ao serviço já prestado, nas condições previstas na lei.',
    },
    { p: 'Como a compra é feita com a Apple, a livre resolução pede-se junto da Apple:' },
    { ul: ['**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), ou a partir do histórico de compras da tua conta.'] },
    { p: 'Durante o período experimental gratuito, não há nada a resolver: basta cancelar antes do fim para não pagar nada.' },

    { h2: 'Reembolsos', id: 'remboursements' },
    {
      p: 'Como os pagamentos são cobrados pela Apple, **só a Apple pode reembolsar**, segundo as suas próprias condições. Não o podemos fazer no lugar dela. Se o Blowy+ não funcionou como previsto, escreve-nos também para {{email.support}}: ajudamos-te, e os teus direitos de consumidor (nomeadamente a garantia legal de conformidade) continuam plenamente aplicáveis.',
    },

    { h2: 'Se a tua conta for suspensa ou encerrada', id: 'sanctions' },
    {
      p: 'Se a tua conta for encerrada por uma violação grave das [condições de utilização](@conditions), o acesso ao Blowy+ também termina. Lembra-te de cancelar a subscrição nas definições do teu iPhone. Se encerrarmos o serviço, avisamos-te pelo menos 30 dias antes e indicamos-te como obter o reembolso do período não utilizado.',
    },

    { h2: 'O resto', id: 'reste' },
    {
      p: 'Estas condições completam as [condições de utilização](@conditions), que também se aplicam ao Blowy+ (nomeadamente a lei aplicável e a mediação). As condições da Apple aplicam-se à compra em si. Qualquer pergunta: {{email.support}}.',
    },
  ],
};
