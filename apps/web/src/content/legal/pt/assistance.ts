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
            'Para o mapa e os encontros próximos, só com a app aberta. A tua posição exata nunca é guardada: guardamos apenas um ponto arredondado a cerca de 300 m. Os outros veem uma posição arredondada e deslocada, e o modo discreto tira-te do mapa. Sem localização, escolhes a tua cidade à mão (Encontros, ou Eu → Definições → A minha localização) e continuas a ter encontros.',
          ],
        },
        {
          q: 'Quem lê as minhas mensagens?',
          a: [
            'Ninguém no Blowy lê as tuas conversas, exceto uma mensagem denunciada (por alguém ou pelo nosso filtro automático): um moderador lê então essa mensagem e o seu contexto imediato. Se a ativarem os dois, uma IA, a do nosso fornecedor {{sub.ai.provider}}, lê as vossas últimas mensagens para que os vossos minimoas possam reagir; o Blowy não guarda nada dessa leitura. Podes desativá-la nas opções da ligação ou em Eu → A IA e tu.',
          ],
        },
        {
          q: 'O que acontece às minhas fotos de prova?',
          a: [
            'Antes da tua primeira prova, a app pergunta-te se uma IA ({{sub.ai.provider}}) pode verificar as tuas fotos. Se aceitares, a foto reduzida é-lhe enviada; caso contrário, validas os teus hábitos sob palavra, sem foto. Nenhum ser humano vê as tuas fotos de prova, e são apagadas em 24 horas, exceto se as guardares nas tuas recordações privadas. Podes mudar de ideias em Eu → A IA e tu.',
          ],
        },
        {
          q: 'Porque é que a minha mensagem, o meu nome ou a minha foto foi recusado?',
          a: [
            'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um filtro automático, que bloqueia o que viola claramente as [regras da comunidade](@regles). A app diz-te porquê, e o teu texto fica lá para o alterares. Achas que é um erro? Escreve para {{email.support}}: uma pessoa vai ver.',
          ],
        },
        {
          q: 'Já não consigo iniciar sessão. O que faço?',
          a: [
            'O início de sessão passa pela Apple (iPhone) ou pela Google (Android). Usa o mesmo ID Apple ou a mesma conta Google que na inscrição. A tua conta está suspensa? O ecrã diz-te até quando, e permite-te escrever ao apoio para contestar. Se continuar sem funcionar, escreve-nos para {{email.support}}.',
          ],
        },
        {
          q: 'Como cancelo o Blowy+?',
          a: [
            'Nas definições do teu iPhone, não no Blowy: Definições → o teu nome → Subscrições (na app, Eu → Blowy+ → Gerir a minha subscrição leva-te lá). Detalhes nas [condições do Blowy+](@abonnement#annuler).',
          ],
        },
        {
          q: 'Como obtenho um reembolso?',
          a: [
            'Os pagamentos passam pela Apple: é a Apple que reembolsa, segundo as suas condições. A ligação está nas [condições do Blowy+](@abonnement#remboursements).',
          ],
        },
        {
          q: 'Como denuncio ou bloqueio alguém?',
          a: [
            'No chat ou no encontro, menu «…» no canto superior direito e depois Denunciar ou Bloquear; num chat, um toque longo numa mensagem permite denunciá-la. Vê [segurança e denúncias](@securite).',
          ],
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
