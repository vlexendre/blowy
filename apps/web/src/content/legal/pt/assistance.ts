import type { LegalPage } from '../types';

export const assistance: LegalPage = {
  title: 'Ajuda e contacto — Blowy',
  heading: 'Ajuda',
  description: 'Uma pergunta, um erro, um problema com alguém, com a tua subscrição ou com os teus dados? As respostas mais procuradas e como nos escrever.',
  intro: 'As perguntas que mais nos fazem. Não encontraste a tua? Escreve-nos: responde um humano, não um minimoa.',
  body: [
    { h2: 'Escreve-nos', id: 'contact' },
    {
      table: {
        head: ['Para', 'Escreve para'],
        rows: [
          ['Uma pergunta, um erro, uma ideia', '{{email.support}}'],
          ['Os teus dados pessoais', '{{email.privacy}}'],
          ['Um problema de segurança, um conteúdo ilegal, um menor', '{{email.safety}}, e denuncia também a pessoa na app'],
        ],
      },
    },
    {
      p: 'Se for um erro, diz-nos o modelo do teu telemóvel, a versão da app (no fundo de **Eu → Definições**) e o que estavas a fazer. Respondemos em francês ou em inglês.',
    },
    { note: '**Em perigo imediato?** Não esperes pela nossa resposta: liga **112** (ou **17** em França). Vê [segurança e denúncias](@securite).' },

    { h2: 'Perguntas frequentes', id: 'faq' },
    {
      faq: [
        {
          q: 'O que é um minimoa?',
          a: [
            'O teu minimoa és tu em pequeno: transporta a tua visão da vida e os teus hábitos. Apresenta-te pessoas cuja visão é compatível com a tua, para serem amigos ou mais. Quanto mais cuidas dele (saindo, mantendo os teus hábitos), mais gente te apresenta. Nunca morre.',
          ],
        },
        {
          q: 'Como é que o meu minimoa escolhe quem me apresentar?',
          a: [
            'Compara a tua visão (5 eixos: lar, raízes, impulso, ritmo, rumo) com a dos outros, e só apresenta pessoas acima de 70% de compatibilidade. Cada encontro explica porquê: 3 pontos em comum e 1 diferença. Os detalhes estão na [política de privacidade](@confidentialite#compatibilite).',
          ],
        },
        {
          q: 'Porque é que o Blowy pede a minha localização?',
          a: [
            'Para o mapa e os encontros próximos, só com a app aberta. A tua posição é arredondada e deslocada para os outros, e o modo discreto retira-te do mapa. Sem localização, o resto da app funciona.',
          ],
        },
        {
          q: 'Quem lê as minhas mensagens?',
          a: [
            'Nenhum humano lê as tuas conversas. Se ambos ativarem, uma IA lê as vossas mensagens para que os vossos minimoas possam reagir; nada é guardado depois. Podes desativá-la nas opções da ligação ou em Eu. Única exceção: se uma mensagem for denunciada, um moderador lê essa mensagem e o seu contexto imediato.',
          ],
        },
        {
          q: 'O que acontece às minhas fotos de prova?',
          a: ['Uma IA verifica a foto, nenhum humano a vê, e é eliminada em 24 horas, salvo se a guardares nas tuas recordações privadas.'],
        },
        {
          q: 'Já não consigo iniciar sessão. O que faço?',
          a: [
            'O início de sessão passa pela Apple (iPhone) ou pela Google (Android). Usa o mesmo ID Apple ou a mesma conta Google que no registo. Se continuar a não funcionar, escreve-nos para {{email.support}}.',
          ],
        },
        {
          q: 'Como cancelo o Blowy+?',
          a: [
            'Nas definições da tua loja, não no Blowy. iPhone: Definições → o teu nome → Subscrições. Android: Google Play → perfil → Pagamentos e subscrições → Subscrições. Detalhes nas [condições do Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Como obtenho um reembolso?',
          a: ['Os pagamentos passam pela Apple ou pela Google: são elas que reembolsam, segundo as suas condições. As ligações estão nas [condições do Blowy+](@abonnement#remboursements).'],
        },
        {
          q: 'Como denuncio ou bloqueio alguém?',
          a: ['No chat ou no encontro, menu no canto superior direito, depois Denunciar ou Bloquear. Vê [segurança e denúncias](@securite).'],
        },
        {
          q: 'Como elimino a minha conta?',
          a: ['Eu → Definições → Eliminar a minha conta. Está tudo explicado na página [eliminar a minha conta](@supprimer-mon-compte).'],
        },
        {
          q: 'Como obtenho uma cópia dos meus dados?',
          a: ['Escreve para {{email.privacy}}. Respondemos no prazo de um mês. Os teus direitos estão detalhados na [política de privacidade](@confidentialite#droits).'],
        },
      ],
    },

    { h2: 'Lê também', id: 'documents' },
    { p: '[Termos de utilização](@conditions) · [Privacidade](@confidentialite) · [Regras da comunidade](@regles) · [Informação legal](@mentions-legales)' },
  ],
};
