import type { LegalPage } from '../types';

export const conditions: LegalPage = {
  title: 'Termos de uso — Minimoa',
  heading: 'Termos de uso',
  description:
    'O contrato entre você e o Minimoa: maiores de 18 anos, sua conta, o que é permitido, seus conteúdos, a moderação, o fim do contrato, a lei aplicável.',
  intro: 'O contrato entre você e o Minimoa. Ao criar uma conta, você o aceita. Reserve cinco minutos para ler.',
  summary: {
    title: 'Em resumo',
    items: [
      'O Minimoa é só para **adultos com 18 anos ou mais**. Uma conta por pessoa, para uma pessoa de verdade.',
      'Seu **minimoa** leva a sua visão de vida e te apresenta pessoas compatíveis para criar vínculos. O que esses vínculos vão virar é com vocês. As mensagens dele são automáticas: ele não é uma pessoa.',
      'Respeite os outros e as [regras da comunidade](@regles). Nada de assédio, nada de conteúdo sexual, nada que envolva um menor de idade.',
      'Suas mensagens e fotos continuam sendo suas. Você só nos dá o direito de tratá-las para o Minimoa funcionar.',
      'O Minimoa é gratuito. O **Minimoa+** é uma assinatura opcional, paga pela App Store, no iPhone ([termos do Minimoa+](@abonnement)).',
      'Você pode sair quando quiser: [excluir sua conta](@supprimer-mon-compte) é feito no app.',
      'Lei francesa. Se der algum problema, fale com a gente primeiro; você também pode recorrer a um mediador, de graça.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quem somos', id: 'editeur' },
    {
      p: 'O app Minimoa e o site minimoa.app são editados por **{{publisher.name}}** (“Minimoa”, “nós”). Os dados completos estão nas [informações legais](@mentions-legales). Para falar com a gente: {{email.support}}.',
    },
    {
      p: 'Estes termos se aplicam a todo uso do app. As [regras da comunidade](@regles), os [termos da assinatura Minimoa+](@abonnement) e a [política de privacidade](@confidentialite) fazem parte deles.',
    },

    { h2: '2. O que é o Minimoa', id: 'service' },
    {
      p: 'No Minimoa, cada pessoa cria um **minimoa**, um personagenzinho que leva a sua visão de vida: o que a pessoa projeta para a própria vida (lar, lugar onde morar, espaço do trabalho, ritmo do dia a dia, longo prazo). O minimoa apresenta a sua pessoa a gente com uma visão compatível, para se conhecerem, e cuida de cada vínculo.',
    },
    {
      ul: [
        '**A visão** é construída com um teste no cadastro, uma pergunta por dia, seus hábitos e o jeito como você cuida do seu minimoa. Ela é indicativa e fica mais precisa com o tempo.',
        '**Os encontros**: seu minimoa só te apresenta pessoas cuja compatibilidade passa de um limite mínimo. Nada acontece sem a sua concordância: você cumprimenta, a outra pessoa aceita, o vínculo é criado. O funcionamento está explicado na [política de privacidade](@confidentialite#compatibilite).',
        '**Os vínculos**: um chat, uma sequência que cresce a cada dia em que vocês dois trocam mensagens, lembranças, e vidas que diminuem quando o vínculo fica em silêncio.',
        '**Seu minimoa** tem medidores (sociabilidade, fome, energia, humor), hábitos a manter, uma sequência, itens. Ele nunca morre.',
        '**O mapa** mostra os minimoas compatíveis perto de você (ou perto da cidade que você escolheu, se não ativar a localização), numa posição propositalmente imprecisa.',
      ],
    },
    {
      p: '**Os minimoas não são pessoas.** As mensagens, os comentários e o resumo da semana deles são gerados automaticamente, a partir de modelos de frases ou por uma inteligência artificial. Eles podem errar. Não são conselhos profissionais, nem conselhos médicos, nem uma garantia sobre ninguém.',
    },
    {
      p: 'Uma compatibilidade, mesmo alta, não diz nada sobre a honestidade ou as intenções de alguém. O Minimoa não verifica a identidade das pessoas nem faz nenhuma investigação sobre elas.',
    },

    { h2: '3. Quem pode usar o Minimoa', id: 'age' },
    {
      ul: [
        '**Você precisa ter 18 anos ou mais.** Pedimos sua data de nascimento antes do login. Abaixo de 18 anos, o cadastro é interrompido e nada é criado. Mentir sobre a idade leva ao encerramento da conta.',
        '**Uma só conta por pessoa**, para uma pessoa de verdade: você. Nada de conta compartilhada, nada de conta em nome de outra pessoa.',
        'Você não pode ter sido excluído do Minimoa, nem estar proibido por lei de usar esse tipo de serviço.',
      ],
    },

    { h2: '4. Sua conta', id: 'compte' },
    {
      p: 'Você entra com a **Apple** (no iPhone) ou com o **Google** (no Android). Esses serviços nos confirmam a sua identidade; nós não conhecemos a sua senha. Mantenha só com você o acesso a essa conta Apple ou Google: o que acontece na sua conta Minimoa é responsabilidade sua. Se achar que alguém acessou sua conta, escreva para a gente na hora.',
    },
    {
      p: 'As informações que você fornece (nome, data de nascimento, sexo) precisam ser verdadeiras e estar atualizadas. Você pode alterá-las no app.',
    },

    { h2: '5. O que é permitido, e o que não é', id: 'usage' },
    { p: 'Você usa o Minimoa respeitando a lei, os outros e as [regras da comunidade](@regles). É proibido, em especial:' },
    {
      ul: [
        'assediar, ameaçar, insultar, humilhar, chantagear, ou incitar ao ódio ou à violência;',
        'enviar nudez ou conteúdo sexual, inclusive como foto de perfil ou foto de prova;',
        'envolver um menor de idade de qualquer forma;',
        'publicar conteúdo ilegal, violento ou chocante;',
        'se passar por outra pessoa, criar um perfil falso ou várias contas;',
        'aplicar golpes, pedir dinheiro, fazer propaganda ou spam;',
        'oferecer ou pedir serviços sexuais pagos;',
        'divulgar informações privadas ou fotos de outra pessoa sem o consentimento dela;',
        'enganar as verificações (foto de prova falsa, localização falsificada) ou burlar o filtro automático de conteúdos;',
        'automatizar o uso do serviço (robôs, extração de dados), burlar seus limites, bloqueios ou proteções, ou atrapalhar o seu funcionamento.',
      ],
    },

    { h2: '6. Seus conteúdos', id: 'contenus' },
    {
      p: 'Suas mensagens, fotos e respostas continuam sendo suas. Para o Minimoa funcionar, você nos concede uma **licença gratuita, não exclusiva e válida no mundo todo**, limitada ao necessário para: armazená-los, entregá-los às pessoas a quem você os destina, exibi-los no app, tratá-los tecnicamente (redimensionar uma foto, por exemplo), filtrá-los automaticamente e, quando previsto, mandá-los para análise por uma IA (fotos de prova, se você aceitou; mensagens, se vocês dois ativaram; foto de perfil e mensagens que deixam dúvida, por segurança; veja a [política de privacidade](@confidentialite#ia)). Essa licença vale enquanto o conteúdo estiver no ar e termina quando ele é excluído, exceto o que precisamos guardar conforme a [política de privacidade](@confidentialite#durees).',
    },
    { p: 'Não usamos seus conteúdos para publicidade e não os vendemos.' },
    { p: 'Você garante que tem o direito de publicar o que publica e que isso não viola os direitos de outras pessoas (imagem, vida privada, direito autoral).' },

    { h2: '7. Denúncias, moderação e sanções', id: 'moderation' },
    {
      p: 'Você pode denunciar ou bloquear uma pessoa a qualquer momento pelo app ([como fazer](@securite)). Cada denúncia avisa a equipe de moderação, que a analisa com o objetivo de responder em até 24 h. Para isso, um moderador do Minimoa pode ler a mensagem denunciada e o contexto imediato dela (as mensagens ao redor). Fora esse caso, ninguém no Minimoa lê suas conversas; uma IA só as lê se vocês dois tiverem ativado essa opção.',
    },
    {
      p: 'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um **filtro automático** antes de serem publicados: um conteúdo que viola claramente as regras é recusado, e o app te diz por quê; uma mensagem no limite é enviada, mas sinalizada à moderação. Só em dois casos a conta é **suspensa automaticamente**, por no máximo 72 h, enquanto um moderador analisa: vocabulário pedocriminoso explícito numa mensagem, ou uma conta denunciada como menor de idade por duas pessoas diferentes. O moderador retira ou confirma a suspensão.',
    },
    { p: 'Dependendo da gravidade, podemos:' },
    {
      ul: [
        'remover um conteúdo;',
        'enviar uma advertência;',
        'limitar algumas funções (encontros, mapa, fotos);',
        'suspender a conta por um período limitado;',
        'encerrar a conta definitivamente, por uma violação grave ou repetida.',
      ],
    },
    {
      p: 'O que é grave e ilegal (conteúdo envolvendo um menor de idade, ameaça séria, por exemplo) é comunicado às autoridades. Quando tomamos uma decisão que te diz respeito, informamos os motivos, a não ser que a lei proíba ou que isso coloque alguém em perigo. Você pode contestá-la, seja automática ou não, escrevendo para {{email.support}} em até seis meses; uma pessoa reexamina a decisão.',
    },

    { h2: '8. A inteligência artificial no Minimoa', id: 'ia' },
    {
      ul: [
        '**Leitura das mensagens**: só se vocês dois ativarem, para que os minimoas de vocês possam reagir. Vocês podem desativar quando quiserem.',
        '**Fotos de prova**: só se você aceitar, uma IA diz se a foto corresponde ao hábito; na dúvida, confiamos em você. Sem consentimento, você confirma na base da palavra, sem foto.',
        '**Verificações de segurança**: cada foto de perfil, e uma mensagem que deixa dúvida num chat em que vocês dois aceitaram a leitura.',
        '**Resumo da semana**: reescrito por uma IA, sem nenhum nome. Os outros comentários dos minimoas vêm de modelos de frases.',
      ],
    },
    {
      p: 'Essa IA é a da {{sub.ai.provider}} ({{sub.ai.location}}), nosso fornecedor. Essas funções servem ao jogo, à conversa e à segurança. Nenhuma delas toma uma decisão que produza efeitos jurídicos sobre você. Os detalhes, e o que o fornecedor recebe, estão na [política de privacidade](@confidentialite#ia); seus consentimentos podem ser vistos e retirados no app, em **Eu → A IA e você**.',
    },

    { h2: '9. Gratuito, com o Minimoa+ como opção', id: 'blowy-plus' },
    {
      p: 'O Minimoa é gratuito e sem anúncios. O **Minimoa+** é uma assinatura opcional que libera funções extras. Ele é vendido e cobrado pela Apple, no iPhone (uma assinatura feita no iPhone acompanha sua conta nos seus outros aparelhos). Os preços, o que está incluído, a renovação e como cancelar estão nos [termos da assinatura Minimoa+](@abonnement).',
    },
    {
      p: 'Se você baixou o Minimoa na App Store, o [contrato de licença padrão da Apple para aplicativos](https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) (“Licensed Application End User License Agreement”) também se aplica ao app.',
    },
    {
      p: 'Os itens, coringas, sequências, vidas e outros elementos do jogo não têm valor monetário. Eles não podem ser trocados, revendidos nem reembolsados, exceto quando a lei exigir.',
    },

    { h2: '10. Fim do contrato', id: 'fin' },
    {
      ul: [
        '**Da sua parte**, você pode sair quando quiser: no app, em **Eu → Ajustes → Excluir minha conta** ([o que é apagado](@supprimer-mon-compte)). Excluir a conta não cancela uma assinatura Minimoa+: cancele também nos ajustes do seu iPhone.',
        '**Da nossa parte**, podemos suspender ou encerrar sua conta se você não respeitar estes termos, se a lei nos obrigar, ou se a segurança de alguém estiver em jogo. Salvo em caso de urgência ou violação grave, avisamos antes e explicamos o motivo.',
        'Se encerrarmos o serviço, avisamos com pelo menos 30 dias de antecedência.',
      ],
    },

    { h2: '11. Disponibilidade e responsabilidade', id: 'responsabilite' },
    {
      p: 'Fazemos o possível para que o Minimoa funcione bem, o tempo todo. Não podemos garantir que não haverá falhas, bugs ou interrupções, principalmente durante uma atualização. Podemos mudar as funções do app.',
    },
    {
      p: 'Cada pessoa é responsável pelo que publica e pelo modo como se comporta. Os encontros presenciais são de sua responsabilidade: leia nossas [dicas de segurança](@securite#rencontre). Não somos responsáveis pelo comportamento de outro usuário nem por danos indiretos, nos limites permitidos pela lei.',
    },
    {
      p: 'Nada nestes termos limita a nossa responsabilidade em caso de culpa grave ou dolo, de dano corporal, nem os direitos que a lei te garante como consumidor, em especial a garantia legal de conformidade dos conteúdos e serviços digitais.',
    },

    { h2: '12. Propriedade intelectual', id: 'propriete' },
    {
      p: 'A marca Minimoa, os minimoas, as ilustrações, os textos e o software pertencem a {{publisher.name}} ou a seus parceiros. Damos a você um direito pessoal, não exclusivo e intransferível de usar o app para uso privado, enquanto sua conta existir. Você pode compartilhar capturas de tela das suas próprias conversas, sem expor as outras pessoas.',
    },

    { h2: '13. Alterações', id: 'changements' },
    {
      p: 'Estes termos podem mudar, por exemplo quando chega uma nova função. Para uma mudança importante, avisamos no app pelo menos 30 dias antes de ela valer, a não ser que a lei ou a segurança exijam agir mais rápido. Se não concordar, você pode excluir sua conta antes dessa data.',
    },

    { h2: '14. Lei aplicável, litígios e mediação', id: 'litiges' },
    { p: 'Estes termos são regidos pela **lei francesa**. Se você mora em outro país da União Europeia, continua protegido pelas normas imperativas do seu país.' },
    { p: 'Se houver algum problema, escreva primeiro para {{email.support}}: vamos buscar uma solução amigável.' },
    {
      requires: ['mediator.name'],
      p: 'Se a sua reclamação por escrito não resolver, você pode recorrer gratuitamente ao mediador de consumo ao qual estamos vinculados, em até um ano após a reclamação:',
    },
    { ul: ['**Mediador:** {{mediator.name}}', '**Endereço:** {{mediator.address}}', '**Site:** {{mediator.website}}'] },
    {
      p: 'Na falta de acordo, o litígio é levado aos tribunais franceses competentes. Se você é consumidor, também pode recorrer ao tribunal do lugar onde morava no momento do cadastro ou do fato.',
    },
  ],
};
