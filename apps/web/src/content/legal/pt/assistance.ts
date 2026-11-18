import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Suporte e contato — Minimoa',
  heading: 'Suporte',
  description: 'Uma dúvida, um bug, um problema com alguém, com a sua assinatura ou com os seus dados? As respostas mais procuradas, e como falar com a gente.',
  intro: 'As perguntas que mais recebemos. Não achou? Escreva para a gente: quem responde é um humano, não um minimoa.',
  body: [
    { h2: 'Fale com a gente', id: 'contact' },
    {
      table: {
        head: ['Para', 'Escreva para'],
        rows: [
          ['Uma dúvida, um bug, uma ideia', '{{email.support}}'],
          ['Seus dados pessoais', '{{email.privacy}}'],
          ['Um problema de segurança, um conteúdo ilegal, um menor de idade', '{{email.safety}}, e denuncie também a pessoa no app'],
        ],
      },
    },
    {
      p: 'Para um bug, diga o modelo do seu celular, a versão do app (no fim de **Eu → Ajustes**) e o que você estava fazendo. Respondemos em francês ou em inglês.',
    },
    { note: '**Em perigo imediato?** Não espere a nossa resposta: ligue **17** ou **112**. Veja [segurança e denúncias](@securite).' },

    { h2: 'Perguntas frequentes', id: 'faq' },
    {
      faq: [
        {
          q: 'O que é um minimoa?',
          a: [
            'Seu minimoa é você em miniatura: ele leva a sua visão de vida e os seus hábitos. Ele te apresenta pessoas com uma visão compatível com a sua para criar vínculos. O que esses vínculos vão virar é com vocês. Quanto mais você cuida dele (saindo, mantendo seus hábitos), mais gente ele te apresenta. Ele nunca morre.',
          ],
        },
        {
          q: 'Como meu minimoa escolhe quem me apresentar?',
          a: [
            'Ele compara a sua visão (5 eixos: lar, raízes, impulso, ritmo, rumo) com a dos outros, e só apresenta pessoas acima de 70% de compatibilidade. Cada encontro explica por quê: 3 pontos em comum e 1 diferença. Os detalhes estão na [política de privacidade](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Por que o Minimoa pede a minha localização?',
          a: [
            'Para o mapa e os encontros por perto, só com o app aberto. Sua localização exata nunca é registrada: guardamos apenas um ponto arredondado para cerca de 300 m. Os outros veem uma posição arredondada e deslocada, e o modo discreto tira você do mapa. Sem localização, você escolhe sua cidade manualmente (Encontros, ou Eu → Ajustes → Minha localização) e continua tendo encontros.',
          ],
        },
        {
          q: 'Quem lê as minhas mensagens?',
          a: [
            'Ninguém no Minimoa lê suas conversas, exceto uma mensagem denunciada (por alguém ou pelo nosso filtro automático): nesse caso, um moderador lê essa mensagem e o contexto imediato dela. Se vocês dois ativarem, uma IA, a do nosso fornecedor {{sub.ai.provider}}, lê as últimas mensagens de vocês para que os minimoas possam reagir; no Minimoa, nada dessa leitura é guardado. Você pode desativar nas opções do vínculo ou em Eu → A IA e você.',
          ],
        },
        {
          q: 'O que acontece com as minhas fotos de prova?',
          a: [
            'Antes da sua primeira prova, o app pergunta se uma IA ({{sub.ai.provider}}) pode verificar suas fotos. Se você aceitar, a foto reduzida é enviada a ela; senão, você confirma seus hábitos na base da palavra, sem foto. Nenhum humano vê suas fotos de prova, e elas são excluídas em até 24 h, a não ser que você as guarde nas suas lembranças privadas. Você muda de ideia em Eu → A IA e você.',
          ],
        },
        {
          q: 'Por que minha mensagem, meu nome ou minha foto foi recusado?',
          a: [
            'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um filtro automático, que barra o que viola claramente as [regras da comunidade](@regles). O app diz por quê, e o seu texto continua lá para você editar. Acha que foi um erro? Escreva para {{email.support}}: uma pessoa vai analisar.',
          ],
        },
        {
          q: 'Não consigo mais entrar. O que fazer?',
          a: [
            'O login é feito pela Apple (iPhone) ou pelo Google (Android). Use o mesmo ID Apple ou a mesma Conta do Google do cadastro. Sua conta está suspensa? A tela diz até quando, e permite escrever ao suporte para contestar. Se ainda não funcionar, escreva para {{email.support}}.',
          ],
        },
        {
          q: 'Como cancelar o Minimoa+?',
          a: [
            'Nos ajustes do seu iPhone, não no Minimoa: Ajustes → seu nome → Assinaturas (no app, Eu → Minimoa+ → Gerenciar minha assinatura leva até lá). Detalhes nos [termos do Minimoa+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Como pedir um reembolso?',
          a: [
            'Os pagamentos passam pela Apple: é a Apple que reembolsa, de acordo com as condições dela. O link está nos [termos do Minimoa+](@abonnement#remboursements).',
          ],
        },
        {
          q: 'Como denunciar ou bloquear alguém?',
          a: ['No chat ou no encontro, menu “…” no canto superior direito, depois Denunciar ou Bloquear; num chat, tocar e segurar uma mensagem permite denunciá-la. Veja [segurança e denúncias](@securite).'],
        },
        {
          q: 'Como excluir minha conta?',
          a: ['Eu → Ajustes → Excluir minha conta. Tudo está explicado na página [excluir minha conta](@supprimer-mon-compte).'],
        },
        {
          q: 'Como obter uma cópia dos meus dados?',
          a: ['Escreva para {{email.privacy}}. Respondemos em até um mês. Seus direitos estão detalhados na [política de privacidade](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'Leia também', id: 'documents' },
    {
      p: '[Termos de uso](@conditions) · [Privacidade](@confidentialite) · [Regras da comunidade](@regles) · [Informações legais](@mentions-legales)',
    },
  ],
};
