import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Termos de utilização — Minimoa',
  heading: 'Termos de utilização',
  description: 'O contrato entre ti e o Minimoa: maiores de 18 anos, a tua conta, o que é permitido, os teus conteúdos, a moderação, o fim do contrato, a lei aplicável.',
  intro: 'O contrato entre ti e o Minimoa. Ao criares uma conta, aceita-lo. Tira cinco minutos para o ler.',
  summary: {
    title: 'Em resumo',
    items: [
      'O Minimoa é só para **adultos com 18 anos ou mais**. Uma conta por pessoa, para uma pessoa real.',
      'O teu **minimoa** transporta a tua visão da vida e apresenta-te pessoas compatíveis, para serem amigos ou mais. As mensagens dele são automáticas: não é uma pessoa.',
      'Respeita os outros e as [regras da comunidade](@regles). Nada de assédio, nada de conteúdo sexual, nada que envolva um menor.',
      'As tuas mensagens e fotos continuam a ser tuas. Só nos dás o direito de as tratar para o Minimoa funcionar.',
      'O Minimoa é gratuito. O **Minimoa+** é uma subscrição opcional, paga através da App Store, no iPhone ([condições do Minimoa+](@abonnement)).',
      'Podes sair quando quiseres: [eliminar a tua conta](@supprimer-mon-compte) faz-se na app.',
      'Aplica-se a lei francesa. Se houver um problema, escreve-nos primeiro; também podes recorrer a um mediador, gratuitamente.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quem somos', id: 'editeur' },
    {
      p: 'A app Minimoa e o site blowy.app são editados por **{{publisher.name}}** («Minimoa», «nós»). Os dados completos estão na [informação legal](@mentions-legales). Para nos escreveres: {{email.support}}.',
    },
    {
      p: 'Estes termos aplicam-se a qualquer utilização da app. As [regras da comunidade](@regles), as [condições da subscrição Minimoa+](@abonnement) e a [política de privacidade](@confidentialite) fazem parte deles.',
    },

    { h2: '2. O que é o Minimoa', id: 'service' },
    {
      p: 'No Minimoa, cada pessoa cria um **minimoa**, uma pequena personagem que transporta a sua visão da vida: o que a pessoa projeta para a sua vida (lar e família, onde viver, o lugar do trabalho, o ritmo do dia a dia, o longo prazo). O minimoa apresenta a sua pessoa a gente cuja visão é compatível, para serem amigos ou mais, e cuida de cada ligação.',
    },
    {
      ul: [
        '**A visão** constrói-se com um teste no registo, uma pergunta por dia, os teus hábitos e a forma como cuidas do teu minimoa. É indicativa e vai ficando mais precisa com o tempo.',
        '**Os encontros**: o teu minimoa só te apresenta pessoas cuja compatibilidade ultrapassa um limiar. Nada acontece sem o teu acordo: cumprimentas, a outra pessoa aceita, a ligação é criada. O funcionamento está explicado na [política de privacidade](@confidentialite#compatibilite).',
        '**As ligações**: um chat, uma série que cresce a cada dia em que vocês os dois escrevem, recordações e vidas que descem quando a ligação fica em silêncio.',
        '**O teu minimoa** tem indicadores (sociabilidade, fome, energia, humor), hábitos a manter, uma série, objetos. Nunca morre.',
        '**O mapa** mostra os minimoas compatíveis à tua volta (ou à volta da cidade que escolheste, se não ativares a localização), numa posição propositadamente imprecisa.',
      ],
    },
    {
      p: '**Os minimoas não são pessoas.** As suas mensagens, comentários e o balanço semanal são produzidos automaticamente, a partir de modelos de frases ou por inteligência artificial. Podem enganar-se. Não são conselhos profissionais, nem conselhos médicos, nem uma garantia sobre ninguém.',
    },
    { p: 'Uma compatibilidade, mesmo elevada, não diz nada sobre a honestidade ou as intenções de alguém. O Minimoa não verifica a identidade das pessoas nem faz qualquer investigação sobre elas.' },

    { h2: '3. Quem pode usar o Minimoa', id: 'age' },
    {
      ul: [
        '**Tens de ter 18 anos ou mais.** Pedimos a tua data de nascimento antes de iniciares sessão. Com menos de 18 anos, o registo para e nada é criado. Mentir sobre a idade leva ao encerramento da conta.',
        '**Uma só conta por pessoa**, para uma pessoa real: tu. Nada de contas partilhadas nem em nome de outra pessoa.',
        'Não podes ter sido excluído do Minimoa, nem estar proibido por lei de usar este tipo de serviço.',
      ],
    },

    { h2: '4. A tua conta', id: 'compte' },
    {
      p: 'Inicias sessão com a **Apple** (no iPhone) ou com a **Google** (no Android). Estes serviços confirmam-nos a tua identidade; nunca sabemos a tua palavra-passe. Guarda para ti o acesso a essa conta Apple ou Google: o que acontece na tua conta Minimoa é da tua responsabilidade. Se achares que alguém lhe acedeu, escreve-nos de imediato.',
    },
    { p: 'As informações que dás (nome, data de nascimento, o que procuras) têm de ser verdadeiras e estar atualizadas. Podes alterá-las na app.' },

    { h2: '5. O que é permitido, e o que não é', id: 'usage' },
    { p: 'Usas o Minimoa respeitando a lei, os outros e as [regras da comunidade](@regles). Em especial, é proibido:' },
    {
      ul: [
        'assediar, ameaçar, insultar, humilhar, chantagear, ou incitar ao ódio ou à violência;',
        'enviar nudez ou conteúdo sexual, incluindo como foto de perfil ou foto de prova;',
        'envolver um menor de qualquer forma;',
        'publicar conteúdo ilegal, violento ou chocante;',
        'fazeres-te passar por outra pessoa, criar um perfil falso ou várias contas;',
        'burlar, pedir dinheiro, fazer publicidade ou spam;',
        'oferecer ou pedir serviços sexuais pagos;',
        'divulgar informações privadas ou fotos de outra pessoa sem o seu consentimento;',
        'enganar as verificações (foto de prova falsa, localização falsificada) ou contornar o filtro automático de conteúdos;',
        'automatizar a utilização do serviço (bots, extração de dados), contornar os seus limites, bloqueios ou proteções, ou perturbar o seu funcionamento.',
      ],
    },

    { h2: '6. Os teus conteúdos', id: 'contenus' },
    {
      p: 'As tuas mensagens, fotos e respostas continuam a ser tuas. Para o Minimoa funcionar, concedes-nos uma **licença gratuita, não exclusiva e mundial**, limitada ao necessário para: guardá-los, entregá-los às pessoas a quem os destinas, mostrá-los na app, tratá-los tecnicamente (redimensionar uma foto, por exemplo) e, quando previsto, filtrá-los automaticamente e, quando previsto, fazê-los analisar por uma IA (fotos de prova, se aceitaste; mensagens, se ambos a tiverem ativado; foto de perfil e mensagens que deixam dúvidas, por segurança; ver a [política de privacidade](@confidentialite#ia)). Esta licença dura enquanto o conteúdo estiver online e termina quando é eliminado, salvo o que tivermos de guardar nos termos da [política de privacidade](@confidentialite#durees).',
    },
    { p: 'Não usamos os teus conteúdos para publicidade e não os vendemos.' },
    { p: 'Garantes que tens o direito de publicar o que publicas e que isso não viola os direitos de outras pessoas (imagem, vida privada, direitos de autor).' },

    { h2: '7. Denúncias, moderação e sanções', id: 'moderation' },
    {
      p: 'Podes denunciar ou bloquear uma pessoa a qualquer momento a partir da app ([como fazer](@securite)). Cada denúncia avisa a equipa de moderação, que a analisa com o objetivo de responder em 24 horas. Para isso, um moderador do Minimoa pode ler a mensagem denunciada e o seu contexto imediato (as mensagens à volta). Fora deste caso, ninguém no Minimoa lê as tuas conversas; uma IA só as lê se ambos o tiverem ativado.',
    },
    {
      p: 'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um **filtro automático** antes de serem publicados: um conteúdo que viola claramente as regras é recusado, e a app diz-te porquê; uma mensagem duvidosa é enviada, mas sinalizada à moderação. Só em dois casos a conta fica **suspensa automaticamente**, no máximo 72 horas, enquanto um moderador a analisa: vocabulário pedocriminoso explícito numa mensagem, ou uma conta denunciada como menor por duas pessoas diferentes. O moderador levanta ou confirma a suspensão.',
    },
    { p: 'Consoante a gravidade, podemos:' },
    {
      ul: [
        'retirar um conteúdo;',
        'enviar um aviso;',
        'limitar algumas funções (encontros, mapa, fotos);',
        'suspender a conta por um período limitado;',
        'encerrar a conta definitivamente, por uma violação grave ou repetida.',
      ],
    },
    {
      p: 'O que é grave e ilegal (conteúdo que envolve um menor, uma ameaça séria, por exemplo) é denunciado às autoridades. Quando tomamos uma decisão que te diz respeito, damos-te as razões, salvo se a lei o proibir ou se isso puser alguém em perigo. Podes contestá-la, seja automática ou não, escrevendo para {{email.support}} no prazo de seis meses; uma pessoa reexamina a decisão.',
    },

    { h2: '8. A inteligência artificial no Minimoa', id: 'ia' },
    {
      ul: [
        '**Leitura das mensagens**: só se ambos a ativarem, para que os vossos minimoas possam reagir. Podem desativá-la quando quiserem.',
        '**Fotos de prova**: só se aceitares, uma IA diz se a foto corresponde ao hábito; em caso de dúvida, confiamos em ti. Sem consentimento, validas sob palavra, sem foto.',
        '**Verificações de segurança**: cada foto de perfil, e uma mensagem que deixa dúvidas num chat em que ambos aceitaram a leitura.',
        '**Resumo da semana**: reformulado por uma IA, sem nenhum nome. Os outros comentários dos minimoas vêm de frases já escritas.',
      ],
    },
    {
      p: 'Esta IA é a da {{sub.ai.provider}} ({{sub.ai.location}}), o nosso fornecedor. Estas funções servem o jogo, a conversa e a segurança. Nenhuma toma uma decisão que produza efeitos jurídicos sobre ti. Os detalhes, e o que o fornecedor recebe, estão na [política de privacidade](@confidentialite#ia); os teus consentimentos veem-se e retiram-se na app, **Eu → A IA e tu**.',
    },

    { h2: '9. Gratuito, e Minimoa+ como opção', id: 'blowy-plus' },
    {
      p: 'O Minimoa é gratuito e sem publicidade. O **Minimoa+** é uma subscrição opcional que desbloqueia funções extra. É vendido e faturado pela Apple, no iPhone (uma subscrição feita no iPhone acompanha a tua conta nos teus outros dispositivos). O que inclui, os preços, o período experimental gratuito, a renovação e a forma de cancelar estão nas [condições da subscrição Minimoa+](@abonnement).',
    },
    {
      p: 'Os objetos, jokers, séries, vidas e outros elementos do jogo não têm valor monetário. Não se trocam, não se revendem e não se reembolsam, salvo o que a lei impuser.',
    },

    { h2: '10. Fim do contrato', id: 'fin' },
    {
      ul: [
        '**Da tua parte**, podes sair quando quiseres: na app, **Eu → Definições → Eliminar a minha conta** ([o que é apagado](@supprimer-mon-compte)). Eliminar a conta não cancela uma subscrição Minimoa+: cancela-a também nas definições do teu iPhone.',
        '**Da nossa parte**, podemos suspender ou encerrar a tua conta se não respeitares estes termos, se a lei o exigir, ou se a segurança de alguém estiver em causa. Salvo urgência ou violação grave, avisamos-te antes e explicamos porquê.',
        'Se deixarmos de prestar o serviço, avisamos-te com pelo menos 30 dias de antecedência.',
      ],
    },

    { h2: '11. Disponibilidade e responsabilidade', id: 'responsabilite' },
    {
      p: 'Fazemos o nosso melhor para que o Minimoa funcione bem, sempre. Não podemos garantir a ausência de falhas, erros ou interrupções, sobretudo durante uma atualização. Podemos fazer evoluir as funções da app.',
    },
    {
      p: 'Cada pessoa é responsável pelo que publica e pela forma como se comporta. Os encontros presenciais são da tua responsabilidade: lê os nossos [conselhos de segurança](@securite#rencontre). Não somos responsáveis pelo comportamento de outro utilizador nem por danos indiretos, na medida em que a lei o permita.',
    },
    {
      p: 'Nada nestes termos limita a nossa responsabilidade em caso de culpa grave ou dolo, ou por danos pessoais, nem os direitos que a lei te garante enquanto consumidor, nomeadamente a garantia legal de conformidade dos conteúdos e serviços digitais.',
    },

    { h2: '12. Propriedade intelectual', id: 'propriete' },
    {
      p: 'A marca Minimoa, os minimoas, as ilustrações, os textos e o software pertencem a {{publisher.name}} ou aos seus parceiros. Damos-te um direito pessoal, não exclusivo e intransmissível de usar a app para uso privado, enquanto a tua conta existir. Podes partilhar capturas de ecrã das tuas próprias conversas, sem expor outras pessoas.',
    },

    { h2: '13. Alterações', id: 'changements' },
    {
      p: 'Estes termos podem mudar, por exemplo quando chega uma nova função. Para uma alteração importante, avisamos-te na app pelo menos 30 dias antes de se aplicar, salvo se a lei ou a segurança exigirem agir mais depressa. Se não concordares, podes eliminar a tua conta antes dessa data.',
    },

    { h2: '14. Lei aplicável, litígios e mediação', id: 'litiges' },
    { p: 'Estes termos regem-se pela **lei francesa**. Se vives noutro país da União Europeia, manténs a proteção das normas imperativas do teu país.' },
    { p: 'Se houver um problema, escreve-nos primeiro para {{email.support}}: procuraremos uma solução amigável.' },
    { p: 'Se a tua reclamação escrita não resolver a situação, podes recorrer gratuitamente ao mediador de consumo a que estamos vinculados, no prazo de um ano após a reclamação:' },
    { ul: ['**Mediador:** {{mediator.name}}', '**Morada:** {{mediator.address}}', '**Site:** {{mediator.website}}'] },
    {
      p: 'Na falta de acordo, o litígio é submetido aos tribunais franceses competentes. Se fores consumidor, também podes recorrer ao tribunal do lugar onde vivias no momento do registo ou do facto.',
    },
  ],
};
