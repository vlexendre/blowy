import type { LegalPage } from '../types';

export const supprimerMonCompte: LegalPage = {
  title: 'Eliminar a minha conta e os meus dados — Blowy',
  heading: 'Eliminar a minha conta',
  description: 'Como eliminar a tua conta Blowy e os teus dados, o que é apagado e quando, o que é guardado e porquê.',
  intro: 'Podes eliminar a tua conta e os teus dados quando quiseres, diretamente na app. Eis como, e o que isso apaga.',
  body: [
    { h2: 'Na app', id: 'app' },
    { ol: ['Abre o separador **Eu**.', 'Toca em **Definições**.', 'Toca em **Eliminar a minha conta**.', 'Escreve a palavra de confirmação indicada no ecrã.'] },
    { p: 'É imediato e definitivo: depois não é possível recuperar nada.' },
    {
      note: '**Tens Blowy+?** Eliminar a tua conta não cancela a subscrição. Cancela-a primeiro nas definições da tua loja ([como fazer](@abonnement#annuler)).',
    },

    { h2: 'Sem a app', id: 'sans-app' },
    {
      p: 'Já não tens acesso à app? Escreve para {{email.privacy}}, se possível a partir do endereço de e-mail associado à tua conta Apple ou Google, pedindo a eliminação da tua conta. Podemos pedir-te que confirmes que a conta é tua. Tratamos do assunto no prazo máximo de um mês e confirmamos quando estiver feito.',
    },

    { h2: 'O que é apagado de imediato', id: 'efface' },
    {
      ul: [
        'a tua conta, o teu nome, a tua data de nascimento, o teu sexo, o que procuras;',
        'o teu minimoa, a sua visão, o seu estilo, os seus objetos, os teus hábitos, a tua série;',
        'a tua localização e a zona aproximada da tua casa;',
        'as tuas ligações, com as suas mensagens, fotos do dia e recordações. **Também desaparecem para as outras pessoas**;',
        'as fotos de prova guardadas como recordação;',
        'as «3 palavras» recebidas, os teus convites;',
        'as tuas definições e a autorização para te enviar notificações.',
      ],
    },

    { h2: 'O que é guardado, e porquê', id: 'garde' },
    {
      table: {
        head: ['O quê', 'Porquê', 'Durante quanto tempo'],
        rows: [
          ['Cópias de segurança técnicas', 'Poder restaurar o serviço em caso de falha', 'Substituídas à medida que rodam, no máximo 30 dias depois'],
          ['Denúncias e decisões de moderação', 'Segurança dos outros e obrigações legais. Deixam de estar associadas à tua conta.', '1 ano após o encerramento do processo, mais se um processo judicial o exigir'],
          ['Em caso de exclusão definitiva: um identificador técnico da tua conta Apple ou Google', 'Impedir um novo registo', '3 anos'],
          ['Referências das compras Blowy+', 'Obrigações contabilísticas', 'Até 10 anos'],
          ['Dados de ligação exigidos por lei', 'Responder aos pedidos das autoridades', 'O prazo fixado pela lei, um ano no máximo'],
          ['Estatísticas agregadas', 'Gerir o serviço. Não permitem identificar-te.', 'Sem limite'],
        ],
      },
    },
    {
      p: 'As «3 palavras» que escolheste para outras pessoas ficam na conta delas: são anónimas. A Apple ou a Google guardam os seus próprios dados de compra e de início de sessão, segundo as suas políticas. Também podes retirar o Blowy das apps ligadas ao teu ID Apple ou à tua conta Google.',
    },

    { h2: 'Uma pergunta', id: 'question' },
    { p: 'Escreve para {{email.privacy}}. O detalhe do que guardamos e porquê está na [política de privacidade](@confidentialite#durees).' },
  ],
};
