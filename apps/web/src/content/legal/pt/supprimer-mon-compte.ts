import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Eliminar a minha conta e os meus dados — Minimoa',
  heading: 'Eliminar a minha conta',
  description: 'Como eliminar a tua conta Minimoa e os teus dados, o que é apagado e quando, o que é guardado e porquê.',
  intro: 'Podes eliminar a tua conta e os teus dados quando quiseres, diretamente na app. Eis como, e o que isso apaga.',
  body: [
    { h2: 'Na app', id: 'app' },
    { ol: ['Abre o separador **Eu**.', 'Toca em **Definições**.', 'Toca em **Eliminar a minha conta**.', 'Escreve a palavra de confirmação indicada no ecrã.'] },
    { p: 'É imediato e definitivo: depois não é possível recuperar nada.' },
    {
      note: '**Tens Minimoa+?** Eliminar a tua conta não cancela a subscrição. Cancela-a primeiro nas definições do teu iPhone ([como fazer](@abonnement#annuler)).',
    },

    { h2: 'Sem a app', id: 'sans-app' },
    {
      p: 'Já não tens acesso à app? Escreve para {{email.privacy}}, se possível a partir do endereço de e-mail associado à tua conta Apple ou Google, pedindo a eliminação da tua conta. Podemos pedir-te que confirmes que a conta é tua. Tratamos do assunto no prazo máximo de um mês e confirmamos quando estiver feito.',
    },

    { h2: 'O que é apagado de imediato', id: 'efface' },
    {
      ul: [
        'a tua conta, o teu nome, a tua data de nascimento, o teu sexo, o que procuras, a tua foto de perfil;',
        'o teu token de início de sessão Apple, depois de revogado junto da Apple o acesso do Minimoa ao teu ID Apple;',
        'o teu minimoa, a sua visão, o seu estilo, os seus objetos, os teus hábitos, a tua série;',
        'a tua posição arredondada, a tua zona de residência aproximada ou a cidade que escolheste;',
        'as tuas ligações, com as suas mensagens, antigas fotos do dia e etapas. **Também desaparecem para as outras pessoas**;',
        'as tuas fotos de prova e de desafio, guardadas como recordação ou ainda não apagadas;',
        'as «3 palavras» recebidas, os teus convites;',
        'as tuas definições e a autorização para te enviar notificações.',
      ],
    },

    { h2: 'O que é guardado, e porquê', id: 'garde' },
    {
      table: {
        head: ['O quê', 'Porquê', 'Durante quanto tempo'],
        rows: [
          ['Cópias de segurança técnicas', 'Poder restaurar o serviço em caso de avaria', 'Substituídas à medida que rodam: {{dataHost.backupRetention}}'],
          ['Denúncias e decisões de moderação', 'Segurança dos outros e obrigações legais. Já não estão ligadas a nenhuma conta; o registo das decisões guarda o nome em causa.', '1 ano após o encerramento do processo (uma denúncia ainda aberta: até ser tratada, e depois 1 ano), mais tempo só se a lei o exigir'],
          ['Em caso de exclusão definitiva: uma impressão não reversível do teu identificador Apple ou Google', 'Impedir uma nova inscrição', '3 anos'],
          ['Referências das compras Minimoa+', 'Obrigações contabilísticas. Já não estão ligadas a nenhuma conta.', 'Até 10 anos'],
          ['Dias de atividade e classificação interna (estatísticas)', 'Calcular os números do serviço', '40 dias no máximo'],
          ['Estatísticas agregadas', 'Gerir o serviço. Não permitem identificar-te.', 'Sem limite'],
        ],
      },
    },
    {
      p: 'As «3 palavras» que escolheste para outras pessoas ficam na conta delas: são anónimas. A Apple ou a Google guardam os seus próprios dados de compra e de início de sessão, segundo as suas políticas. Com a Apple, a eliminação também retira o Minimoa das apps que usam o teu ID Apple; com a Google, podes fazê-lo a partir da tua conta Google. O que já foi enviado ao nosso fornecedor de IA segue o que ele guarda do seu lado ([política de privacidade](@confidentialite#ia)).',
    },

    { h2: 'Uma pergunta', id: 'question' },
    { p: 'Escreve para {{email.privacy}}. O detalhe do que guardamos e porquê está na [política de privacidade](@confidentialite#durees).' },
  ],
};
