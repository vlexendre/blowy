import type { LegalPage } from '../types';

export const abonnement: LegalPage = {
  title: 'Termos da assinatura Minimoa+ — Minimoa',
  heading: 'Termos da assinatura Minimoa+',
  description:
    'Minimoa+: o que inclui, os planos (€ 59,88 por ano com 7 dias grátis, € 14,99 por mês ou € 2,99 por semana), a renovação automática, a cobrança pela Apple, como cancelar, o que acontece no fim, o direito de arrependimento e os reembolsos.',
  intro: 'O que o Minimoa+ inclui, quanto custa, como é renovado e como cancelar. Sem letras miúdas.',
  summary: {
    title: 'Em resumo',
    items: [
      '**€ 59,88 por ano**, com **7 dias grátis** no início, **€ 14,99 por mês** ou **€ 2,99 por semana**, sem teste grátis.',
      'A assinatura **é renovada automaticamente** enquanto você não cancelar.',
      'O Minimoa+ é comprado no iPhone: quem te cobra é a **Apple**, e é nos ajustes do seu iPhone que você cancela.',
      'No 5º dia do teste, avisamos você **por notificação e por e-mail**.',
      'Apagar o app ou excluir sua conta **não cancela** a assinatura.',
      'O Minimoa continua gratuito sem o Minimoa+.',
    ],
  },
  body: [
    { h2: 'O que o Minimoa+ acrescenta', id: 'contenu' },
    {
      ul: [
        '**O mapa inteiro**, e **mudar de cidade quando quiser**, sem sair do lugar. Sem o Minimoa+, você vê a sua região (cerca de 1,5 km ao seu redor); sem localização, você escolhe sua cidade manualmente, no máximo uma vez a cada 30 dias.',
        '**Um encontro a mais por dia.**',
        '**3 coringas de sequência por semana** para proteger sua sequência (sem o Minimoa+: um por semana).',
        '**Até 6 hábitos** acompanhados ao mesmo tempo (sem o Minimoa+: 2).',
        'O **resumo detalhado de domingo**: a evolução da sua visão em 4 semanas e a análise de cada vínculo.',
        '**Renomear seu minimoa quando quiser** (sem o Minimoa+: uma vez a cada 60 dias).',
        '**Todos os itens premium do guarda-roupa**: eles são do seu minimoa e podem ser usados na hora, enquanto a assinatura durar.',
      ],
    },
    {
      p: 'O conteúdo exato pode mudar com o app. Se tirarmos uma função importante do Minimoa+, avisamos antes, e você pode cancelar.',
    },

    { h2: 'Os planos e os preços', id: 'offres' },
    {
      table: {
        head: ['Plano', 'Preço', 'Teste grátis'],
        rows: [
          ['Anual', '€ 59,88 por ano, ou seja, € 4,99 por mês', '7 dias, depois € 59,88 por ano'],
          ['Mensal', '€ 14,99 por mês', 'Sem teste grátis'],
          ['Semanal', '€ 2,99 por semana', 'Sem teste grátis'],
        ],
      },
    },
    {
      p: 'Os preços incluem todos os impostos, para a França. Em outros países, a App Store mostra o preço na sua moeda, que pode ser diferente. O preço que vale é o exibido pela App Store no momento em que você confirma a compra.',
    },

    { h2: 'O teste grátis', id: 'essai' },
    {
      ul: [
        'O teste de 7 dias vale só para o plano anual, e só para uma nova assinatura, nas condições da Apple (em geral, um teste por conta Apple).',
        'Durante o teste, todo o Minimoa+ fica liberado, e você não paga nada.',
        'No 5º dia, mandamos um lembrete: faltam 2 dias. Ele chega por notificação (se você as autorizou) e por e-mail, no endereço ligado à sua conta Apple.',
        'Se você não cancelar **pelo menos 24 horas antes do fim do teste**, o primeiro pagamento de € 59,88 é cobrado no 7º dia, e a assinatura anual começa.',
        'Se você cancelar durante o teste, continua com o Minimoa+ até o fim dos 7 dias, e não paga nada.',
      ],
    },

    { h2: 'Pagamento e renovação automática', id: 'renouvellement' },
    {
      ul: [
        'A compra é feita no app, no iPhone, pela **App Store**. O pagamento é cobrado na forma de pagamento da sua conta Apple, na confirmação da compra ou no fim do teste. No Android e na web, o Minimoa+ não está à venda; uma assinatura feita no iPhone acompanha sua conta Minimoa em todo lugar.',
        'A assinatura **é renovada automaticamente** pelo mesmo período (um ano ou um mês), pelo mesmo preço, a não ser que você cancele **pelo menos 24 horas antes do fim do período atual**.',
        'Se o preço mudar, a Apple avisa você antes, de acordo com as regras dela, e pede sua concordância quando essas regras exigem.',
        'Nunca recebemos seus dados bancários. A Apple só nos confirma a compra, que o nosso servidor verifica com ela.',
        'Trocou de celular? Use **Restaurar compras** no app, com a mesma conta Apple.',
      ],
    },

    { h2: 'Cancelar', id: 'annuler' },
    { p: 'Você cancela nos ajustes do seu iPhone, não no Minimoa (no app, **Eu → Minimoa+ → Gerenciar assinatura** leva até lá):' },
    {
      ul: ['**iPhone:** Ajustes → seu nome → Assinaturas → Minimoa → Cancelar Assinatura.'],
    },
    {
      p: 'Depois do cancelamento, o Minimoa+ continua liberado até o fim do período já pago, e então sua conta volta para a versão gratuita. Seu minimoa, seus vínculos e seus dados continuam lá.',
    },
    {
      note: '**Apagar o app ou excluir sua conta Minimoa não cancela a assinatura.** Cancele primeiro nos ajustes do seu iPhone; senão, ela continua sendo cobrada.',
    },

    { h2: 'Quando o Minimoa+ termina', id: 'fin' },
    {
      ul: [
        'O mapa volta para a sua região (ou para a cidade escolhida manualmente); a cidade escolhida com o Minimoa+ fica registrada e volta com uma nova assinatura.',
        'Um encontro a menos por dia, um coringa por semana, o resumo de domingo simples, renomear uma vez a cada 60 dias.',
        'Os hábitos que você já acompanha continuam; você só pode acrescentar novos se tiver menos de 2.',
        'Seu minimoa **guarda os itens premium**: eles voltam a ficar bloqueados, e voltam com uma nova assinatura.',
        'Nada mais é apagado: seu minimoa, seus vínculos, suas sequências e os itens que você ganhou continuam.',
      ],
    },

    { h2: 'Direito de arrependimento', id: 'retractation' },
    {
      p: 'Como consumidor na União Europeia, você tem, em princípio, um prazo de 14 dias para desistir de um contrato celebrado a distância. O Minimoa+ é um serviço digital fornecido imediatamente: ao assinar, você pede que o acesso comece na hora. Se desistir dentro desse prazo, um valor proporcional ao serviço já fornecido pode ser retido, nas condições previstas pela lei.',
    },
    {
      p: 'Como a compra é feita com a Apple, o arrependimento é pedido à Apple:',
    },
    {
      ul: [
        '**Apple:** [reportaproblem.apple.com](https://reportaproblem.apple.com), ou pelo histórico de compras da sua conta.',
      ],
    },
    { p: 'Durante o teste grátis, não há nada do que se arrepender: basta cancelar antes do fim para não pagar nada.' },

    { h2: 'Reembolsos', id: 'remboursements' },
    {
      p: 'Como os pagamentos são recebidos pela Apple, **só a Apple pode reembolsar**, de acordo com as condições dela. Não podemos fazer isso no lugar dela. Se o Minimoa+ não funcionou como previsto, escreva também para {{email.support}}: vamos te ajudar, e os seus direitos de consumidor (em especial a garantia legal de conformidade) continuam valendo integralmente.',
    },

    { h2: 'Se sua conta for suspensa ou encerrada', id: 'sanctions' },
    {
      p: 'Se sua conta for encerrada por uma violação grave dos [termos de uso](@conditions), o acesso ao Minimoa+ também termina. Lembre-se de cancelar a assinatura nos ajustes do seu iPhone. Se encerrarmos o serviço, avisamos com pelo menos 30 dias de antecedência e explicamos como obter o reembolso do período não usado.',
    },

    { h2: 'O resto', id: 'reste' },
    {
      p: 'Estes termos complementam os [termos de uso](@conditions), que também se aplicam ao Minimoa+ (em especial a lei aplicável e a mediação). Os termos da Apple se aplicam à compra em si. Alguma dúvida? {{email.support}}.',
    },
  ],
};
