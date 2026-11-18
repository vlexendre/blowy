import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Excluir minha conta e meus dados — Minimoa',
  heading: 'Excluir minha conta',
  description: 'Como excluir sua conta Minimoa e seus dados, o que é apagado e quando, o que é guardado e por quê.',
  intro: 'Você pode excluir sua conta e seus dados quando quiser, direto no app. Veja como, e o que isso apaga.',
  body: [
    { h2: 'No app', id: 'app' },
    {
      ol: [
        'Abra a aba **Eu**.',
        'Toque em **Ajustes**.',
        'Toque em **Excluir minha conta**.',
        'Digite “excluir” para confirmar.',
      ],
    },
    { p: 'É imediato e definitivo: não dá para recuperar nada depois.' },
    {
      note: '**Você tem o Minimoa+?** Excluir sua conta não cancela a assinatura. Cancele primeiro nos ajustes do seu iPhone ([como fazer](@abonnement#annuler)).',
    },

    { h2: 'Sem o app', id: 'sans-app' },
    {
      p: 'Não tem mais acesso ao app? Escreva para {{email.privacy}}, de preferência pelo endereço de e-mail ligado à sua conta Apple ou Google, pedindo a exclusão da sua conta. Podemos pedir que você confirme que a conta é mesmo sua. Cuidamos disso em no máximo um mês, e confirmamos quando estiver feito.',
    },

    { h2: 'O que é apagado na hora', id: 'efface' },
    {
      ul: [
        'sua conta, seu nome, sua data de nascimento, seu sexo, sua foto de perfil;',
        'seu token de login da Apple, depois de revogar junto à Apple o acesso do Minimoa ao seu identificador;',
        'seu minimoa, a visão dele, o estilo dele, os itens dele, seus hábitos, sua sequência;',
        'sua localização arredondada, sua região de residência aproximada ou a cidade escolhida;',
        'seus vínculos, com as mensagens, as antigas fotos do dia e as etapas deles. **Eles também desaparecem para as outras pessoas**;',
        'suas fotos de prova e de desafio, guardadas como lembrança ou ainda não apagadas;',
        'as “3 palavras” recebidas, seus convites;',
        'seus ajustes e a autorização para te enviar notificações.',
      ],
    },

    { h2: 'O que é guardado, e por quê', id: 'garde' },
    {
      table: {
        head: ['O quê', 'Por quê', 'Por quanto tempo'],
        rows: [
          ['Backups técnicos', 'Poder restaurar o serviço em caso de falha', 'Substituídos conforme a rotação deles: {{dataHost.backupRetention}}'],
          ['Denúncias e decisões de moderação', 'Segurança dos outros e obrigações legais. Elas deixam de estar ligadas a uma conta; o registro das decisões guarda o nome envolvido.', '1 ano após o encerramento do caso (uma denúncia ainda aberta: até ser tratada, depois 1 ano), mais tempo só se a lei exigir'],
          ['Em caso de banimento definitivo: uma impressão irreversível do seu identificador Apple ou Google', 'Impedir um novo cadastro', '3 anos'],
          ['Referências das compras do Minimoa+', 'Obrigações contábeis. Elas deixam de estar ligadas a uma conta.', 'Até 10 anos'],
          ['Dias de atividade e classificação interna (estatísticas)', 'Calcular os números do serviço', 'No máximo 40 dias'],
          ['Estatísticas agregadas', 'Gerir o serviço. Elas não permitem identificar você.', 'Sem limite'],
        ],
      },
    },
    {
      p: 'As “3 palavras” que você escolheu para outras pessoas continuam na conta delas: são anônimas. A Apple ou o Google guardam os próprios dados de compra e de login, conforme as políticas deles. Com a Apple, a exclusão também tira o Minimoa dos apps que usam seu ID Apple; com o Google, você pode fazer isso pela sua Conta do Google. O que já foi enviado ao nosso fornecedor de IA segue o que ele guarda do lado dele ([política de privacidade](@confidentialite#ia)).',
    },

    { h2: 'Alguma dúvida', id: 'question' },
    { p: 'Escreva para {{email.privacy}}. Os detalhes do que guardamos e por quê estão na [política de privacidade](@confidentialite#durees).' },
  ],
};
