import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Política de privacidade — Blowy',
  heading: 'Política de privacidade',
  description: 'Os dados que o Blowy usa, para quê, com que fundamento jurídico, durante quanto tempo, quem lhes acede e como exercer os teus direitos.',
  intro: 'O que sabemos sobre ti, para quê, quem lhe acede, quanto tempo o guardamos e como apagar tudo.',
  summary: {
    title: 'Em resumo',
    items: [
      'Usamos os teus dados para uma só coisa: dar vida ao teu minimoa e apresentar-te pessoas compatíveis. **Sem publicidade, sem venda de dados.**',
      'O que procuras e quem queres conhecer pode revelar a tua orientação sexual: pedimos-te um **consentimento explícito**, e podes retirá-lo.',
      'A tua **localização** só é usada com a app aberta. No mapa é arredondada e deslocada, nunca em tempo real, e o **modo discreto** retira-te do mapa.',
      'As tuas **fotos de prova** são verificadas por uma IA, não são vistas por nenhum humano e são eliminadas em 24 horas (salvo se as guardares).',
      '**Nenhum humano lê as tuas conversas.** Se ambos ativarem, uma IA lê as vossas mensagens para que os vossos minimoas possam reagir. Nada é guardado depois. Única exceção humana: uma mensagem denunciada e o seu contexto imediato, lidos por um moderador.',
      'Podes alterar tudo na app e [eliminar a tua conta](@supprimer-mon-compte) a qualquer momento. Para o resto: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quem é o responsável', id: 'responsable' },
    {
      p: 'O responsável pelo tratamento é **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, que edita a app e o site Blowy ([informação legal](@mentions-legales)).',
    },
    { ul: ['Para qualquer pergunta sobre os teus dados: {{email.privacy}}.', 'Encarregado da proteção de dados: {{dpo.name}}.'] },
    { p: 'Esta política aplica-se à app Blowy e ao site blowy.app. Para os cookies do site, vê a [página de cookies](@cookies).' },

    { h2: '2. O que usamos, e para quê', id: 'donnees' },
    {
      p: 'Para cada utilização: os dados em causa, a finalidade, o fundamento jurídico (o que nos autoriza a fazê-lo nos termos do RGPD), o prazo de conservação e quem lhes acede. Os prazos estão resumidos na [tabela de prazos](#durees).',
    },

    { h3: 'A tua conta' },
    {
      ul: [
        '**Dados:** o identificador que a Apple ou a Google nos envia quando inicias sessão, e o endereço de e-mail associado. Com a Apple, pode ser um endereço de reencaminhamento que esconde o verdadeiro.',
        '**Finalidade:** criar a tua conta, voltar a iniciar sessão, proteger o acesso, escrever-te sobre a tua conta.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** a equipa autorizada do Blowy e o nosso fornecedor de autenticação. A Apple ou a Google sabem que usas o Blowy, já que o início de sessão passa por elas.',
      ],
    },

    { h3: 'O teu nome e a tua data de nascimento' },
    {
      ul: [
        '**Dados:** o nome (ou alcunha) que escolhes; a tua data de nascimento.',
        '**Finalidade:** o nome apresenta-te aos outros. A data de nascimento verifica que tens 18 anos ou mais e serve para o filtro de idade dos encontros.',
        '**Fundamento jurídico:** execução do contrato; para a idade, também o nosso interesse legítimo em proteger os menores.',
        '**Prazo:** enquanto a tua conta existir. Se tiveres menos de 18 anos, o registo para antes do início de sessão e nada é guardado.',
        '**Acesso:** o teu nome é visível para as pessoas que o teu minimoa te apresenta e para as tuas ligações. A tua data de nascimento não é mostrada aos outros.',
      ],
    },

    { h3: 'O teu sexo, o que procuras, quem queres conhecer', id: 'sensibles' },
    {
      ul: [
        '**Dados:** o teu sexo (mulher, homem, não binário, ou «prefiro não dizer»); o que procuras (amigos, mais, ou ambos); se procuras «mais», quem queres conhecer (mulheres, homens, toda a gente).',
        '**Porque é sensível:** em conjunto, estas respostas podem revelar a tua **orientação sexual**, um dado protegido pelo artigo 9.º do RGPD.',
        '**Finalidade:** apresentar-te apenas pessoas que procuram o mesmo que tu e que querem conhecer alguém como tu.',
        '**Fundamento jurídico:** o teu **consentimento explícito**, pedido no registo antes de responderes. Podes retirá-lo: altera as tuas respostas na app («prefiro não dizer», só «amigos») ou elimina a tua conta. Sem estas respostas, não podemos propor-te encontros «mais».',
        '**Prazo:** enquanto a tua conta existir, ou até alterares as tuas respostas.',
        '**Acesso:** o algoritmo de encontros. Estas respostas servem para filtrar: uma pessoa que te é apresentada pode deduzir que procuram o mesmo. Nunca são usadas para publicidade nem transmitidas a terceiros.',
      ],
    },

    { h3: 'A tua localização', id: 'localisation' },
    {
      ul: [
        '**Dados:** a tua posição, **só com a app aberta** (nunca em segundo plano), e uma zona aproximada da tua casa deduzida a partir dela.',
        '**Finalidade:** mostrar-te o mapa e os minimoas compatíveis à tua volta; propor-te encontros próximos; confirmar que uma saída aconteceu fora da zona da tua casa, para fazer subir a sociabilidade do teu minimoa.',
        '**O que os outros veem:** nunca a tua posição exata. É arredondada a cerca de 300 m e deslocada, e nunca é mostrada em tempo real. O **modo discreto** retira-te completamente do mapa.',
        '**Fundamento jurídico:** o teu consentimento, dado através da autorização de localização do telemóvel. Podes retirá-lo a qualquer momento nas definições do telemóvel. Sem ele, não há mapa nem encontros próximos (dizemos-to claramente), mas o resto da app funciona.',
        '**Prazo:** guardamos a tua última posição arredondada e a zona aproximada da tua casa, substituídas a cada atualização. Não guardamos o histórico das tuas deslocações.',
        '**Acesso:** a equipa autorizada do Blowy, o nosso fornecedor de alojamento e o fornecedor do mapa base, que recebe a zona mostrada no ecrã.',
      ],
    },

    { h3: 'A tua visão e a compatibilidade' },
    {
      ul: [
        '**Dados:** as tuas respostas ao teste de visão (12 situações), as tuas respostas às perguntas do dia, os hábitos que escolhes e os que manténs, a forma como cuidas do teu minimoa (regularidade, horas, saídas) e as 3 palavras que os teus amigos escolhem para ti. A partir daí deduzimos a tua «visão» em 5 eixos, com um índice de confiança, e um «estilo» (sociável, brincalhão, terno, falador).',
        '**Finalidade:** calcular a compatibilidade com outras pessoas e apresentar-te as que combinam contigo; explicar cada encontro; dar personalidade ao teu minimoa. Trata-se de **definição de perfis**, explicada em detalhe [mais abaixo](#compatibilite).',
        '**Fundamento jurídico:** execução do contrato (é o núcleo do serviço).',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** o algoritmo de encontros. Uma pessoa que te é apresentada vê os vossos pontos em comum e uma diferença, nunca as tuas respostas nem um número isolado.',
      ],
    },
    { p: 'Não te perguntamos a religião, as opiniões políticas nem a saúde.' },

    { h3: 'O teu minimoa, os teus hábitos e a tua série' },
    {
      ul: [
        '**Dados:** o nome e o aspeto do teu minimoa, os seus indicadores (sociabilidade, fome, energia, humor), os gestos que fazes, os teus hábitos e o seu ritmo, a tua série, os teus jokers, os teus objetos, o teu balanço semanal.',
        '**Finalidade:** fazer funcionar o jogo.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** tu; as tuas ligações e as pessoas apresentadas veem o teu minimoa e o seu estilo.',
      ],
    },

    { h3: 'As fotos de prova', id: 'preuves' },
    {
      ul: [
        '**Dados:** a foto que tiras na app quando o teu minimoa pede uma prova de um hábito (as tuas sapatilhas, por exemplo). É tirada com a câmara, não escolhida da galeria.',
        '**Finalidade:** verificar que o hábito foi cumprido. Uma IA responde sim, não ou «não tenho a certeza», com uma frase. Se responder «não tenho a certeza», confiamos em ti.',
        '**Fundamento jurídico:** o teu consentimento: és tu que escolhes tirar e enviar a foto.',
        '**Prazo:** **eliminada em 24 horas**, salvo se decidires guardá-la nas tuas recordações privadas (fica lá até a apagares ou eliminares a conta).',
        '**Acesso:** **nenhum humano a vê.** Só o nosso fornecedor de IA a recebe, reduzida, para a analisar. Mais ninguém no Blowy a vê.',
      ],
    },
    { p: 'Evita fotografar outras pessoas, documentos ou informações sensíveis.' },

    { h3: 'As tuas mensagens, e a sua leitura por uma IA se a ativarem' },
    {
      ul: [
        '**Dados:** as mensagens que trocas nas tuas ligações, a sua data e o que foi lido.',
        '**Finalidade:** entregá-las à outra pessoa e guardá-las na vossa conversa.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a ligação existir. Se saíres de uma ligação, a conversa é apagada para ti. Se um de vocês eliminar a conta, a ligação e as mensagens desaparecem para os dois.',
        '**Acesso:** tu e a outra pessoa. Um moderador pode ler uma mensagem **denunciada** e o seu contexto imediato (vê [denúncias](#signalements)).',
      ],
    },
    {
      note: '«Nenhum humano lê as tuas conversas. Se ambos ativarem, uma IA lê as vossas mensagens para que os vossos minimoas possam reagir. Nada é guardado depois.»',
    },
    {
      ul: [
        '**Acordo de cada um:** pedimo-lo aos dois, na primeira vez que abrem o chat. Se um recusar, ninguém lê: os minimoas só reagem ao ritmo da ligação (silêncios, séries, desafios).',
        '**Retirada:** a qualquer momento, nas opções da ligação ou em **Eu**. A leitura para de imediato nessa ligação.',
        '**Como:** não há análise a cada mensagem. Quando algo o desencadeia (um silêncio, um certo número de mensagens), uma janela curta das últimas mensagens é enviada ao nosso fornecedor de IA, que propõe a reação do minimoa. No máximo 3 intervenções por dia e por ligação, e podes desligá-las numa ligação.',
        '**O que é guardado:** nada da análise. Só a reação do minimoa aparece no chat, como uma mensagem.',
        '**Fundamento jurídico:** o consentimento de cada um de vocês.',
      ],
    },

    { h3: 'A série e as etapas de uma ligação' },
    {
      ul: [
        '**Dados:** os dias em que cada um de vocês escreveu na ligação (não o conteúdo das mensagens) e as etapas da ligação (encontro, níveis alcançados, recordes de série). Nas ligações anteriores a 15 de novembro de 2026, as fotos que tinham trocado, que ficam nas vossas recordações; já não recebemos fotos novas.',
        '**Finalidade:** fazer viver a série da ligação (os dias seguidos em que vocês os dois escrevem), as suas vidas e os seus níveis, e mostrar-vos as vossas recordações.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a ligação existir (mesmas regras que as mensagens).',
        '**Acesso:** tu e a outra pessoa da ligação. As fotos são guardadas num espaço privado, acessíveis apenas através de ligações temporárias.',
      ],
    },

    { h3: 'As notificações' },
    {
      ul: [
        '**Dados:** o identificador técnico do teu telemóvel para as notificações, as tuas definições por tipo de notificação, a hora escolhida para o desafio do dia.',
        '**Finalidade:** avisar-te (desafio do dia, novo encontro, mensagem, «é a tua vez de escrever» à noite, ligação ou série em perigo, prova pedida, balanço, lembrete do fim do período experimental). Horas de silêncio das 22h às 8h; fora as mensagens, no máximo 3 por dia. No iPhone, o widget e as atividades em direto usam os mesmos dados.',
        '**Fundamento jurídico:** o teu consentimento, dado através da autorização do telemóvel. Retiras-o nas definições do telemóvel ou tipo a tipo na app.',
        '**Prazo:** até desativares as notificações ou eliminares a conta.',
        '**Acesso:** o nosso prestador de envio de notificações, e a Apple ou a Google, que as fazem chegar ao teu telemóvel.',
      ],
    },

    { h3: 'As compras Blowy+' },
    {
      ul: [
        '**Dados:** o plano escolhido, as datas de compra, de período experimental e de renovação, o estado da subscrição, o identificador da transação. **Nunca recebemos os teus dados de pagamento**: é a Apple ou a Google que te fatura.',
        '**Finalidade:** desbloquear as funções Blowy+, verificar a compra junto da loja, gerir o período experimental e o respetivo lembrete.',
        '**Fundamento jurídico:** execução do contrato; obrigações contabilísticas para as referências de transação.',
        '**Prazo:** o estado enquanto a tua conta existir; as referências de transação, o tempo exigido pelas nossas obrigações contabilísticas (10 anos no máximo).',
        '**Acesso:** a equipa autorizada do Blowy; a Apple ou a Google, segundo as suas próprias políticas.',
      ],
    },

    { h3: 'Denúncias, bloqueios e moderação', id: 'signalements' },
    {
      ul: [
        '**Dados:** quem denuncia, quem é denunciado, a ligação em causa, o motivo, os detalhes escritos; a **mensagem denunciada e o seu contexto imediato**; os bloqueios; as decisões de moderação e o registo das ações.',
        '**Finalidade:** proteger as pessoas, tratar as denúncias (objetivo: em 24 horas), aplicar as [regras](@regles), responder às autoridades, impedir que uma pessoa bloqueada te contacte.',
        '**Fundamento jurídico:** as nossas obrigações legais (nomeadamente o Regulamento dos Serviços Digitais) e o nosso interesse legítimo em garantir a segurança da comunidade.',
        '**Prazo:** vê a [tabela de prazos](#durees).',
        '**Acesso:** os moderadores autorizados do Blowy, e as autoridades se a lei o exigir. A pessoa denunciada não sabe quem a denunciou. Uma pessoa bloqueada não é avisada.',
      ],
    },

    { h3: 'Estatísticas e administração' },
    {
      ul: [
        '**Dados:** números calculados a partir da atividade: número de contas, contas ativas, retenção, assinantes e períodos experimentais, séries, mensagens dos minimoas, encontros propostos e aceites, custos da IA.',
        '**Finalidade:** gerir e melhorar o Blowy, controlar os custos.',
        '**Fundamento jurídico:** o nosso interesse legítimo.',
        '**Como:** estas estatísticas são calculadas a partir da nossa própria base de dados, numa ferramenta interna reservada a poucas pessoas autorizadas. Não há ferramentas de medição de audiência nem de publicidade na app. A ferramenta interna não dá acesso às conversas, exceto à mensagem denunciada e ao seu contexto imediato.',
        '**Prazo:** os dados individuais seguem a vida da tua conta; os números agregados, que não permitem identificar-te, podem ser guardados durante mais tempo.',
      ],
    },

    { h3: 'Dados técnicos' },
    {
      ul: [
        '**Dados:** endereço IP, modelo e sistema do dispositivo, versão da app, idioma, registos de erros e de ligação.',
        '**Finalidade:** fazer funcionar o serviço, protegê-lo, limitar abusos, corrigir erros.',
        '**Fundamento jurídico:** o nosso interesse legítimo; as nossas obrigações legais de conservação de certos dados de ligação.',
        '**Prazo:** vê a [tabela de prazos](#durees).',
        '**Acesso:** a equipa técnica autorizada e os nossos fornecedores de alojamento.',
      ],
    },

    { h3: 'As «3 palavras» e os convites (pessoas sem conta)' },
    {
      ul: [
        '**Dados:** quando alguém abre a tua página «3 palavras» ou o teu convite no site, mostramos o teu nome e o teu minimoa. Para os votos, guardamos as palavras escolhidas e uma impressão não reversível do endereço IP e do navegador, para limitar votos duplicados. Não é pedida nenhuma conta.',
        '**Fundamento jurídico:** execução do contrato no teu caso; o nosso interesse legítimo em evitar abusos para a impressão.',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** tu vês as palavras, nunca quem as escolheu.',
      ],
    },

    { h3: 'Quando nos escreves' },
    {
      ul: [
        '**Dados:** o teu endereço de e-mail, a tua mensagem e o necessário para tratar o teu pedido.',
        '**Fundamento jurídico:** execução do contrato ou o nosso interesse legítimo em responder-te; obrigação legal para os pedidos de exercício dos teus direitos.',
        '**Prazo:** vê a [tabela de prazos](#durees).',
      ],
    },

    { h2: '3. Como funciona a compatibilidade', id: 'compatibilite' },
    { p: 'O teu minimoa só te apresenta pessoas cuja visão da vida vai no mesmo sentido que a tua. Esta é a lógica, sem segredos:' },
    {
      ol: [
        '**A tua visão** é colocada em 5 eixos: lar (livre, sozinho ↔ formar família), raízes (ficar aqui ↔ partir), impulso (tempo para si ↔ grandes projetos), ritmo (calmo, em casa ↔ intenso, fora), rumo (dia a dia ↔ planear tudo). Cada eixo tem um índice de confiança.',
        '**De onde vem**, com pesos iniciais: teste de registo 40% (depois cada vez menos), pergunta do dia 20%, hábitos 25%, forma de cuidar do teu minimoa 10%, as 3 palavras dos teus amigos 5%. Quanto mais usas o Blowy, mais sobe a confiança.',
        '**Os filtros**: o que cada um procura e, para «mais», quem quer conhecer; 18 anos ou mais; a zona; as pessoas bloqueadas.',
        '**A pontuação**: a proximidade nos 5 eixos, ponderada pela confiança. Para «amigos», o eixo lar conta pouco; para «mais», conta a dobrar. O estilo (sociável, brincalhão, terno, falador) não entra na pontuação.',
        '**O limiar**: abaixo de 70%, ninguém é proposto, mesmo que isso signifique mostrar menos pessoas.',
        '**A explicação**: cada encontro diz porquê, com 3 pontos em comum e 1 diferença a explorar. Nunca um número isolado.',
        '**O número de encontros** depende também da forma do teu minimoa (quanto mais cuidas dele, mais gente te apresenta) e da tua subscrição.',
      ],
    },
    { p: 'A tua visão é indicativa: é «a tua visão, por agora». Não é um diagnóstico, e não usamos vocabulário médico nem psicológico.' },
    {
      p: '**Este cálculo não toma nenhuma decisão que produza efeitos jurídicos** sobre ti ou que te afete de forma igualmente significativa. Só decide quem o teu minimoa te apresenta; és sempre tu quem escolhe cumprimentar, aceitar ou ignorar. Podes pedir-nos explicações, contestar um resultado ou opor-te a este tratamento escrevendo para {{email.privacy}}; neste último caso, deixaremos de poder apresentar-te pessoas.',
    },

    { h2: '4. A inteligência artificial', id: 'ia' },
    { p: 'O Blowy usa uma IA em três sítios, e em mais nenhum:' },
    {
      table: {
        head: ['Utilização', 'O que a IA recebe', 'O que é guardado'],
        rows: [
          ['Fotos de prova', 'A foto, reduzida', 'A resposta (sim, não, não tenho a certeza). A foto é eliminada em 24 horas, salvo se a guardares.'],
          ['Leitura das mensagens (se ambos a ativarem)', 'Uma janela curta das últimas mensagens da ligação', 'Nada da análise. Só a reação do minimoa aparece no chat.'],
          ['Balanço semanal e voz dos minimoas', 'Um resumo da tua atividade da semana (saídas, hábitos, série, ligações)', 'O texto do balanço, na app.'],
        ],
      },
    },
    {
      p: 'O nosso fornecedor de IA atua como subcontratante: trata estes dados apenas para nós, segundo as nossas instruções, e não para fins próprios. Nenhum membro da equipa do Blowy vê estes conteúdos durante a análise. As respostas da IA podem estar erradas: não têm efeitos jurídicos e, em caso de dúvida sobre uma prova, confiamos em ti.',
    },

    { h2: '5. O que os outros veem', id: 'visibilite' },
    {
      ul: [
        '**As pessoas que o teu minimoa te apresenta** veem o teu nome, o teu minimoa, o seu estilo, os vossos pontos em comum e uma diferença, e a tua posição aproximada no mapa (exceto em modo discreto).',
        '**As tuas ligações** veem também as vossas mensagens, a vossa série, as etapas da vossa ligação e as vossas fotos de antes, se as houver.',
        '**Quem visita a tua página «3 palavras» ou o teu convite** vê o teu nome e o teu minimoa.',
        'Ninguém vê o teu endereço de e-mail, a tua data de nascimento, a tua posição exata nem as tuas respostas ao teste de visão. As tuas fotos de prova são verificadas por uma IA: nenhum humano as vê, e são eliminadas em 24 horas (salvo se as guardares nas tuas recordações privadas).',
      ],
    },

    { h2: '6. Os nossos prestadores', id: 'prestataires' },
    { p: 'Estes subcontratantes tratam dados por nossa conta, segundo as nossas instruções, com um contrato conforme ao artigo 28.º do RGPD:' },
    {
      subprocessors: {
        head: ['Função', 'Prestador', 'Local do tratamento', 'Garantia se fora da UE'],
        roles: {
          database: 'Base de dados, autenticação e armazenamento das fotos',
          api: 'Alojamento do servidor da app (API)',
          ai: 'IA: fotos de prova, leitura das mensagens se ativada, balanços',
          email: 'Envio de e-mails',
          push: 'Envio de notificações',
          maps: 'Mapa base',
          site: 'Alojamento do site blowy.app',
        },
      },
    },
    {
      p: 'A **Apple e a Google** também intervêm, por conta própria e segundo as suas próprias políticas: início de sessão (Iniciar sessão com a Apple, Google), distribuição da app (App Store, Google Play), pagamento do Blowy+ e entrega das notificações.',
    },
    { p: 'Por fim, podemos ter de comunicar dados às autoridades quando a lei o exigir.' },

    { h2: '7. Transferências para fora da União Europeia', id: 'transferts' },
    {
      p: 'Damos preferência a prestadores que tratam os dados na União Europeia. Quando um prestador trata dados fora da UE (a tabela acima indica-o), a transferência é enquadrada por uma decisão de adequação da Comissão Europeia (por exemplo, o Quadro de Privacidade de Dados UE-EUA, para as empresas certificadas) ou pelas cláusulas contratuais-tipo da Comissão. Podes obter uma cópia escrevendo para {{email.privacy}}.',
    },

    { h2: '8. Quanto tempo guardamos os teus dados', id: 'durees' },
    {
      table: {
        head: ['Dado', 'Prazo'],
        rows: [
          ['Conta, perfil, visão, minimoa, hábitos, definições', 'Enquanto a tua conta existir. Apagados assim que a eliminas.'],
          ['Conta inativa', 'Eliminada após 2 anos sem início de sessão, depois de uma mensagem de aviso.'],
          ['Localização', 'Só a última posição arredondada e a zona aproximada da casa, substituídas a cada atualização.'],
          ['Fotos de prova', 'Em 24 horas, salvo se as guardares nas tuas recordações privadas.'],
          ['Leitura das mensagens pela IA', 'Nada é guardado depois da análise.'],
          ['Mensagens, série, etapas e fotos de antes de uma ligação', 'Enquanto a ligação existir.'],
          ['Compras', 'O estado enquanto a conta existir; as referências de transação até 10 anos (obrigações contabilísticas).'],
          ['Denúncias e decisões de moderação', '1 ano após o encerramento do processo, mais se um processo judicial o exigir.'],
          ['Exclusão definitiva', 'Um identificador técnico da conta Apple ou Google, durante 3 anos, para impedir um novo registo.'],
          ['Registos técnicos', '30 dias, salvo incidente de segurança em análise. Os dados de ligação que a lei nos obriga a guardar: o prazo fixado pela lei, um ano no máximo.'],
          ['Contactos com a assistência', '1 ano após o encerramento do pedido.'],
          ['Pedidos de exercício dos teus direitos', '5 anos, para podermos provar que respondemos.'],
          ['Cópias de segurança', 'Substituídas à medida que rodam, no máximo 30 dias após a eliminação.'],
        ],
      },
    },

    { h2: '9. Os teus direitos', id: 'droits' },
    { p: 'Nos termos do RGPD e da lei francesa de proteção de dados, podes a qualquer momento:' },
    {
      ul: [
        '**aceder** aos teus dados e obter uma cópia;',
        'pedir a sua **retificação** (muitos alteram-se diretamente na app);',
        'pedir o seu **apagamento** ([eliminar a tua conta](@supprimer-mon-compte) fá-lo de uma só vez);',
        '**retirar o teu consentimento** quando é o fundamento de um tratamento (dados sensíveis, localização, fotos de prova, leitura das mensagens pela IA, notificações), sem pôr em causa o que foi feito antes;',
        '**opor-te** a um tratamento baseado no nosso interesse legítimo, ou pedir a sua **limitação**;',
        'receber os dados que nos forneceste num formato de leitura automática (**portabilidade**);',
        'definir **diretivas** sobre o destino dos teus dados após a tua morte.',
      ],
    },
    {
      p: 'Para exercer estes direitos, escreve para {{email.privacy}} ou para a morada postal de {{publisher.name}}: {{publisher.address}}. Respondemos no prazo de um mês; este prazo pode ser prorrogado por dois meses para um pedido complexo, e nesse caso avisamos-te. Podemos pedir-te que proves que o pedido vem mesmo de ti.',
    },
    {
      p: 'Se achares que os teus direitos não estão a ser respeitados, podes apresentar reclamação à **CNIL**, a autoridade francesa de proteção de dados (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, França, [cnil.fr](https://www.cnil.fr/fr/plaintes)), ou à autoridade de proteção de dados do teu país de residência na União Europeia.',
    },

    { h2: '10. Só para adultos', id: 'mineurs' },
    {
      p: 'O Blowy é só para pessoas com 18 anos ou mais. Pedimos a data de nascimento antes do início de sessão; com menos de 18 anos, o registo para e nada é criado. Não recolhemos conscientemente dados de menores. Se soubermos que uma conta pertence a um menor, é eliminada. Podes avisar-nos a partir da app com o motivo «Pessoa menor».',
    },

    { h2: '11. Segurança', id: 'securite' },
    {
      ul: [
        'As trocas entre a app, o site e os nossos servidores são cifradas em trânsito (HTTPS).',
        'Não guardamos palavras-passe: o início de sessão passa pela Apple ou pela Google.',
        'As fotos ficam num armazenamento privado, acessível apenas por ligações temporárias.',
        'O acesso aos dados é limitado às pessoas que dele precisam; a ferramenta de administração está reservada a pessoas autorizadas, só de leitura exceto para a moderação, e as suas ações ficam registadas.',
        'Guardamos o mínimo possível: fotos de prova eliminadas em 24 horas, localização arredondada, nada guardado após a leitura das mensagens pela IA.',
      ],
    },
    {
      p: 'Nenhum sistema é infalível. Em caso de violação de dados, avisamos a CNIL em 72 horas quando a lei o exige, e avisamos-te diretamente se ela representar um risco elevado para ti.',
    },

    { h2: '12. Alterações', id: 'changements' },
    {
      p: 'Se alterarmos esta política de forma importante (por exemplo, uma nova utilização dos teus dados), avisamos-te na app antes de as alterações se aplicarem, e voltamos a pedir o teu consentimento quando for necessário. A data da última atualização está no topo desta página.',
    },
  ],
};
