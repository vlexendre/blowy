import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Política de privacidade — Minimoa',
  heading: 'Política de privacidade',
  description:
    'Os dados que o Minimoa usa, por quê, com qual base legal, por quanto tempo, quem tem acesso, e como exercer seus direitos.',
  intro: 'O que sabemos sobre você, por quê, quem tem acesso, por quanto tempo guardamos, e como apagar tudo.',
  summary: {
    title: 'Em resumo',
    items: [
      'Usamos seus dados para uma coisa só: dar vida ao seu minimoa e te apresentar pessoas compatíveis. **Sem publicidade, sem revenda.**',
      'Não perguntamos o que você procura: seu minimoa cria vínculos, e o que eles vão ser é com vocês. **Nenhum dado sobre a sua orientação é coletado.**',
      'Sua **localização** só é usada com o app aberto, e **nunca é registrada de forma exata**: guardamos apenas um ponto arredondado para cerca de 300 m e a sua região. No mapa, os outros veem uma posição arredondada e deslocada, nunca em tempo real, e o **modo discreto** tira você do mapa. Sem localização, você escolhe sua cidade manualmente.',
      'Uma **IA de terceiros**, a da {{sub.ai.provider}} ({{sub.ai.location}}), entra em quatro pontos, detalhados [mais abaixo](#ia): a leitura dos chats se vocês dois ativarem, suas fotos de prova se você aceitar, a verificação de segurança das fotos de perfil e de algumas mensagens, e o resumo da semana, enviado sem nenhum nome.',
      '**Ninguém no Minimoa lê suas conversas**, exceto uma mensagem denunciada (por alguém ou pelo nosso filtro automático) e o contexto imediato dela, lidos por um moderador.',
      'Você pode alterar tudo no app e [excluir sua conta](@supprimer-mon-compte) a qualquer momento. Para o resto: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quem é o responsável', id: 'responsable' },
    {
      p: 'O controlador dos dados é **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, que edita o app e o site Minimoa ([informações legais](@mentions-legales)).',
    },
    {
      ul: [
        'Para qualquer dúvida sobre os seus dados: {{email.privacy}}.',
        'Não nomeamos um encarregado de proteção de dados (DPO): todos os seus pedidos sobre seus dados vão para {{email.privacy}}.',
      ],
    },
    {
      p: 'Esta política se aplica ao app Minimoa e ao site minimoa.app. Para os cookies do site, veja a [página de cookies](@cookies).',
    },

    { h2: '2. O que usamos, e por quê', id: 'donnees' },
    {
      p: 'Para cada uso: os dados envolvidos, a finalidade, a base legal (o que nos autoriza a fazer isso, segundo o RGPD), o prazo de conservação e quem tem acesso. Os prazos estão reunidos na [tabela de prazos](#durees).',
    },

    { h3: 'Sua conta' },
    {
      ul: [
        '**Dados:** o identificador que a Apple ou o Google nos transmite quando você entra, e o endereço de e-mail associado. Com a Apple, esse endereço pode ser um endereço de retransmissão que esconde o verdadeiro. Com a Apple, também guardamos um token de login fornecido pela Apple, que serve só para revogar o acesso do Minimoa ao seu ID Apple quando você exclui sua conta.',
        '**Finalidade:** criar sua conta, permitir que você entre de novo, proteger o acesso, e te escrever sobre assuntos da sua conta (boas-vindas, novo vínculo, lembrete do fim do teste, advertência de moderação, aviso antes de uma exclusão por inatividade).',
        '**Base legal:** execução do contrato.',
        '**Prazo:** enquanto sua conta existir. Na exclusão, o token da Apple é primeiro revogado junto à Apple e depois apagado. Uma conta sem login por 2 anos é excluída, depois de um e-mail de aviso enviado 30 dias antes.',
        '**Acesso:** a equipe autorizada do Minimoa, nosso serviço de autenticação, nosso fornecedor de envio de e-mails. A Apple ou o Google sabem que você usa o Minimoa, já que o login passa por eles.',
      ],
    },

    { h3: 'Seu nome e sua data de nascimento' },
    {
      ul: [
        '**Dados:** o nome (ou apelido) que você escolhe; sua data de nascimento.',
        '**Finalidade:** o nome apresenta você aos outros. Ele passa pelo nosso filtro automático antes de ser registrado (veja [moderação](#signalements)). A data de nascimento verifica que você tem 18 anos ou mais, e serve para o filtro de idade dos encontros.',
        '**Base legal:** execução do contrato; para a idade e o filtro, também o nosso legítimo interesse em proteger os menores de idade e a comunidade.',
        '**Prazo:** enquanto sua conta existir. Se você tiver menos de 18 anos, o cadastro é interrompido antes do login e nada é registrado.',
        '**Acesso:** seu nome fica visível para as pessoas que seu minimoa te apresenta e para os seus vínculos. Sua data de nascimento não é mostrada aos outros.',
      ],
    },

    { h3: 'Sua foto de perfil', id: 'photo-profil' },
    {
      ul: [
        '**Dados:** a foto que você escolhe, se adicionar uma (é opcional), tirada com a câmera ou escolhida na sua galeria.',
        '**Finalidade:** mostrar você aos seus vínculos, e dar uma ideia de você às pessoas que cruzam com você sem vínculo (apresentações, mapa, acenos). Até vocês dois se cumprimentarem, elas só veem uma **versão bem desfocada**, feita pelos nossos servidores a partir de uma cópia reduzida a poucos pixels, na qual não dá para reconhecer um rosto: ela só deixa adivinhar cores dominantes (tom de pele, cabelo, fundo). O original nunca é enviado a elas, nem no mapa, nem nas apresentações, nem com um aceno, no plano gratuito ou no Minimoa+. Depois que o vínculo se forma, seu vínculo a vê nítida; se ele for deixado ou se um de vocês bloquear o outro, mais nada é enviado.',
        '**Verificação de segurança:** antes de ser publicada, a foto é reduzida e enviada ao nosso fornecedor de IA, {{sub.ai.provider}}, que verifica se ela não mostra nudez, nem pessoa que pareça menor de idade, nem violência, nem ódio, nem propaganda. Avisamos você no app antes de escolher a foto. Uma foto recusada é apagada na hora, e a equipe de moderação recebe uma denúncia automática, sem a foto. Se a verificação não for possível no momento, a foto é publicada e verificada um pouco depois. Essa verificação não pode ser desativada: ela protege todo mundo. Sem foto de perfil, nada é enviado.',
        '**Base legal:** execução do contrato para exibi-la; nosso legítimo interesse e nossas obrigações de segurança (filtrar os conteúdos publicados) para a verificação.',
        '**Prazo:** enquanto você a mantiver. Quando você a troca, a anterior e a versão desfocada dela são apagadas. As duas são apagadas quando você exclui sua conta.',
        '**Acesso:** seus vínculos (foto nítida); as pessoas que cruzam com você sem vínculo: apresentações, mapa, acenos (só a versão bem desfocada); nosso fornecedor de IA, durante a verificação. As duas versões ficam num espaço privado, acessíveis só por links temporários.',
      ],
    },

    { h3: 'Seu sexo', id: 'sexe' },
    {
      ul: [
        '**Dados:** seu sexo (mulher, homem, não binário, ou “prefiro não dizer”).',
        '**Finalidade:** ajustar a concordância dos textos do app, e estatísticas sem nome. **Ele não é usado para escolher quem seu minimoa te apresenta.**',
        '**Base legal:** nosso legítimo interesse. “Prefiro não dizer” é sempre possível, e você pode mudar sua resposta no app (**Eu → Ajustes → Quem você é**).',
        '**Prazo:** enquanto sua conta existir.',
        '**Acesso:** só você. Ele nunca é mostrado aos outros.',
        'Não perguntamos o que você procura nem quem você quer conhecer: seu minimoa cria vínculos, e o que eles vão ser é com vocês. As respostas dadas a essas perguntas antes de 17 de novembro de 2026, e o consentimento que as acompanhava, foram apagados.',
      ],
    },

    { h3: 'Sua localização', id: 'localisation' },
    {
      ul: [
        '**Dados:** sua posição, **só com o app aberto** (nunca em segundo plano). **Ela nunca é registrada como está**: nosso servidor guarda apenas o centro do quadrado de cerca de 300 m onde você está, e a sua região de residência aproximada, deduzida dele (mesma precisão). A posição exata só serve, durante a requisição, para saber se você está fora da sua região de residência.',
        '**Sem localização:** você pode escolher sua cidade manualmente (grátis; uma vez a cada 30 dias, ou quando quiser com o Minimoa+). Nesse caso, guardamos apenas a cidade escolhida e o centro dela, que servem como região.',
        '**Finalidade:** mostrar o mapa e os minimoas compatíveis perto de você; propor encontros por perto; confirmar que uma saída aconteceu mesmo fora da sua região de residência, para aumentar a sociabilidade do seu minimoa.',
        '**O que os outros veem:** nunca sua posição exata. Eles veem uma posição arredondada para cerca de 300 m e deslocada, nunca em tempo real. O **modo discreto** tira você completamente do mapa.',
        '**Base legal:** seu consentimento, dado pela permissão de localização do seu celular, ou ao escolher sua cidade. Você pode retirá-lo a qualquer momento: nos ajustes do celular, ou no app (**Eu → Ajustes → Minha localização → Esquecer minha localização**), o que apaga sua posição e sua região.',
        '**Prazo:** o último ponto arredondado e sua região (ou a cidade escolhida), substituídos a cada atualização. Não guardamos o histórico dos seus deslocamentos.',
        '**Acesso:** a equipe autorizada do Minimoa, nossa hospedagem, e o fornecedor do mapa de fundo, que recebe do seu celular a área exibida na tela.',
      ],
    },

    { h3: 'Sua visão e a compatibilidade' },
    {
      ul: [
        '**Dados:** suas respostas ao teste de visão (12 situações), suas respostas às perguntas do dia, os hábitos que você escolhe e os que você mantém, o jeito como você cuida do seu minimoa (regularidade, horários, saídas), e as 3 palavras que seus amigos escolhem para você. A partir disso deduzimos a sua “visão” em 5 eixos, com um índice de confiança, e um “estilo” (sociável, brincalhão, carinhoso, falante).',
        '**Finalidade:** calcular a compatibilidade com outras pessoas e te apresentar as que combinam com você; explicar cada encontro; dar uma personalidade ao seu minimoa. Isso é **criação de perfil**, explicada em detalhes [mais abaixo](#compatibilite).',
        '**Base legal:** execução do contrato (é o coração do serviço).',
        '**Prazo:** enquanto sua conta existir.',
        '**Acesso:** o algoritmo de encontros. Uma pessoa que te é apresentada vê os pontos em comum entre vocês e uma diferença, nunca suas respostas nem um número sozinho.',
      ],
    },
    { p: 'Não perguntamos sua religião, suas opiniões políticas nem sua saúde.' },

    { h3: 'Seu minimoa, seus hábitos e sua sequência' },
    {
      ul: [
        '**Dados:** o nome e a aparência do seu minimoa, os medidores dele (sociabilidade, fome, energia, humor), os gestos que você faz, seus hábitos e o ritmo deles, sua sequência, seus coringas, seus itens, seus desafios do dia, seu resumo da semana. O nome do minimoa passa pelo nosso filtro automático, como o seu nome.',
        '**Finalidade:** fazer o jogo funcionar.',
        '**Base legal:** execução do contrato.',
        '**Prazo:** enquanto sua conta existir.',
        '**Acesso:** você; seus vínculos e as pessoas apresentadas veem seu minimoa e o estilo dele.',
      ],
    },

    { h3: 'As fotos de prova e de desafio', id: 'preuves' },
    {
      ul: [
        '**Dados:** a foto que você tira no app quando seu minimoa pede uma prova de hábito (por exemplo, o seu tênis), ou para um desafio de foto do dia. Ela é tirada com a câmera, não escolhida na galeria.',
        '**Finalidade:** verificar que um hábito foi mantido; contar um desafio cumprido.',
        '**Verificação por uma IA, só se você aceitar:** antes da sua primeira prova, o app diz o que é enviado, para quem e por quê, e você escolhe. Se aceitar, cada foto de prova é reduzida e enviada à {{sub.ai.provider}} com o nome do hábito (sem o seu nome e sem a sua localização), que responde sim, não ou “não tenho certeza”, com uma frase; em caso de “não tenho certeza”, confiamos em você. Se recusar, **nenhuma foto é enviada a uma IA**: você confirma o hábito na base da palavra, sem foto, e sua sequência avança do mesmo jeito. Você muda de ideia quando quiser em **Eu → A IA e você**. As fotos dos desafios nunca são enviadas a uma IA.',
        '**Base legal:** seu consentimento, para a verificação pela IA; execução do contrato, para o armazenamento temporário.',
        '**Prazo:** **excluída do nosso armazenamento em até 24 h**, a não ser que você escolha guardá-la nas suas lembranças privadas (ela fica lá até você deixar de guardá-la ou excluir sua conta).',
        '**Acesso:** **nenhum humano a vê**, nem no Minimoa nem em nenhum outro lugar do Minimoa. Só a {{sub.ai.provider}} recebe uma foto de prova, reduzida, se você aceitou.',
      ],
    },
    { p: 'Evite fotografar outras pessoas, documentos ou informações sensíveis.' },

    { h3: 'Suas mensagens, e a leitura delas por uma IA se vocês ativarem', id: 'messages' },
    {
      ul: [
        '**Dados:** as mensagens que você troca nos seus vínculos, a data delas, e o que foi lido.',
        '**Finalidade:** entregá-las à outra pessoa e guardá-las na conversa de vocês.',
        '**Filtro automático:** antes de ser enviada, cada mensagem passa pelo nosso filtro, nos nossos servidores (listas de palavras em vários idiomas, sem IA). Uma violação clara (ameaça, ódio, conteúdo sexual envolvendo um menor de idade, sexo pago, golpe) não é enviada: dizemos por quê, seu texto continua no campo, e a equipe de moderação recebe uma denúncia automática com um trecho curto. Uma mensagem no limite (insulto, conteúdo sexual explícito) é enviada, mas sinalizada à equipe de moderação, e seu minimoa te sugere uma pausa.',
        '**Base legal:** execução do contrato; para o filtro, nosso legítimo interesse e nossas obrigações de segurança.',
        '**Prazo:** enquanto o vínculo existir, ou seja, enquanto as contas de vocês dois existirem. Sair de um vínculo o tira da lista de vocês dois, sem apagar a conversa: ela volta se vocês se reencontrarem. Se um de vocês excluir a conta, o vínculo e as mensagens dele são apagados para os dois.',
        '**Acesso:** você e a outra pessoa. Um moderador pode ler uma mensagem **denunciada**, por um de vocês ou pelo filtro, e o contexto imediato dela (veja [denúncias](#signalements)).',
      ],
    },
    {
      note: 'A frase que o app mostra a vocês antes de pedir a concordância: “Ninguém no Minimoa lê suas conversas, exceto uma mensagem denunciada e as poucas mensagens ao redor, para a moderação. Se vocês dois ativarem, uma IA lê as últimas mensagens de vocês para que os minimoas possam reagir. Essa IA é fornecida pela {{sub.ai.provider}} ({{sub.ai.location}}), nosso fornecedor, que recebe essas mensagens em nosso nome. Você pode retirar sua concordância quando quiser.”',
    },
    {
      ul: [
        '**Concordância de cada um:** pedimos a vocês dois, na primeira vez que o chat é aberto (ou uma vez para todos os seus chats, se você escolher um ajuste padrão). Se um dos dois não disser sim, a IA não lê nada: os minimoas reagem só ao ritmo do vínculo (silêncios, sequências, desafios), com frases prontas.',
        '**Retirada:** a qualquer momento, nas opções do vínculo, ou para todos os seus chats em **Eu → A IA e você**. A leitura para na hora.',
        '**Como:** nada de análise a cada mensagem. No momento de um gatilho (um silêncio, um certo número de mensagens, um tom que esquenta), uma janela curta das últimas mensagens é enviada à {{sub.ai.provider}}, com os autores identificados como A e B, sem os nomes de vocês; a IA sugere a reação do minimoa. No máximo 3 intervenções por dia e por vínculo, e você pode desativá-las para um vínculo. Se o tom esquentar, seu minimoa pode sugerir uma pausa: essa mensagem só é visível para você.',
        '**Verificação de segurança:** num chat em que vocês dois aceitaram a leitura, uma mensagem que deixe dúvida ao nosso filtro (um link, por exemplo) também pode ser enviada sozinha à {{sub.ai.provider}}, depois do envio, para verificar se respeita as regras. Se não respeitar, ela é sinalizada à equipe de moderação.',
        '**O que é guardado:** no Minimoa, nada da janela enviada nem da análise; só a reação do minimoa aparece no chat, como uma mensagem. O que a {{sub.ai.provider}} guarda do lado dela, e por quanto tempo: {{ai.retention}}.',
        '**Base legal:** o consentimento de cada um de vocês dois.',
      ],
    },

    { h3: 'A sequência e as etapas de um vínculo' },
    {
      ul: [
        '**Dados:** os dias em que cada um de vocês dois escreveu no vínculo (não o conteúdo das mensagens) e as etapas do vínculo (encontro, níveis alcançados, recordes de sequência). Para os vínculos de antes de 15 de novembro de 2026, as “fotos do dia” que vocês tinham trocado nele: o Minimoa não recebe mais fotos novas, e as antigas continuam nas lembranças do vínculo.',
        '**Finalidade:** dar vida ao vínculo: a sequência dele (os dias seguidos em que vocês dois trocam mensagens), o estado dele (vivo, calmo, dormindo) e os níveis, e mostrar as lembranças de vocês.',
        '**Base legal:** execução do contrato.',
        '**Prazo:** enquanto o vínculo existir (mesmas regras das mensagens): as antigas fotos do dia são apagadas quando o vínculo é apagado, ou quando um de vocês exclui a conta.',
        '**Acesso:** você e a outra pessoa do vínculo (as antigas fotos dela só são enviadas para você a partir do nível 5 do vínculo, e nunca mais se o vínculo for deixado ou se um de vocês bloquear o outro). As fotos são armazenadas num espaço privado, acessíveis só por links temporários.',
      ],
    },

    { h3: 'As notificações e os e-mails' },
    {
      ul: [
        '**Dados:** o token técnico do seu celular para as notificações, seus ajustes por tipo de notificação, o horário escolhido para o desafio do dia; no iPhone, os tokens das atividades ao vivo.',
        '**Finalidade:** te avisar (desafio do dia, novo encontro, mensagem (inclusive o oizinho quando alguém acorda o vínculo de vocês), “sua vez de escrever” à noite, lembrete da sua sequência, prova pedida, resumo, lembrete do fim do teste; primeiros passos nos 7 primeiros dias, notícias do seu minimoa quando você some e nos aniversários de vocês, mensagens da sua assinatura Minimoa+). Horas de silêncio das 22h às 8h; fora as mensagens, no máximo 3 por dia. O lembrete do fim do teste e os e-mails da sua assinatura (boas-vindas, pagamento recusado, fim) também são enviados por e-mail, mesmo se as notificações estiverem desativadas. O e-mail depois de 14 dias de ausência e o lembrete único um mês depois do fim do Minimoa+ são desativados pelo mesmo ajuste da notificação (“Notícias do seu minimoa”, “Sua assinatura do Minimoa+”). No iPhone, o widget e as atividades ao vivo usam os mesmos dados; uma atividade ao vivo na tela bloqueada nunca mostra o nome de alguém.',
        '**Base legal:** seu consentimento para as notificações, dado pela permissão do seu celular (você o retira nos ajustes do celular ou tipo por tipo no app); execução do contrato para os e-mails ligados à sua conta e à sua assinatura; legítimo interesse para o e-mail de ausência e o lembrete depois do fim do Minimoa+ (você se opõe desativando o ajuste).',
        '**Prazo:** até você desativar as notificações ou excluir sua conta. A lista das mensagens já enviadas (só o tipo e a data, para nunca enviar a mesma duas vezes) é guardada por no máximo 400 dias.',
        '**Acesso:** nossos fornecedores de envio das notificações e dos e-mails, e a Apple ou o Google, que entregam as notificações até o seu celular.',
      ],
    },

    { h3: 'As compras do Minimoa+' },
    {
      ul: [
        '**Dados:** o plano escolhido, as datas de compra, de teste e de renovação, o status da assinatura, o identificador da transação. **Nunca recebemos seus dados de pagamento**: é a Apple que te cobra.',
        '**Finalidade:** liberar as funções do Minimoa+, verificar a compra com a Apple, gerenciar o teste e o lembrete dele.',
        '**Base legal:** execução do contrato; obrigações contábeis para as referências de transação.',
        '**Prazo:** o status, enquanto sua conta existir; as referências de transação, desvinculadas da sua conta se ela for excluída, por até 10 anos (obrigações contábeis).',
        '**Acesso:** a equipe autorizada do Minimoa; a Apple, conforme a própria política.',
      ],
    },

    { h3: 'Filtragem, denúncias, bloqueios e moderação', id: 'signalements' },
    {
      ul: [
        '**Dados:** quem denuncia, quem é denunciado, o vínculo envolvido, o motivo, os detalhes escritos; a **mensagem denunciada e o contexto imediato dela**; as denúncias automáticas do nosso filtro (nome ou nome de minimoa recusado, mensagem não enviada com um trecho de no máximo 280 caracteres, mensagem no limite, foto de perfil recusada, sem a foto); os bloqueios; as decisões de moderação e o registro das ações.',
        '**Filtragem automática:** os nomes, os nomes de minimoa, as mensagens e as fotos de perfil são filtrados antes de serem publicados (veja acima). Um nome recusado não é registrado, e o app diz por quê.',
        '**Finalidade:** proteger as pessoas, tratar as denúncias, aplicar as [regras](@regles), responder às autoridades, impedir que uma pessoa bloqueada entre em contato com você. A equipe de moderação é avisada por e-mail de cada nova denúncia: na hora para uma denúncia urgente (pessoa menor de idade, ameaça), senão num resumo. Objetivo: um tratamento em até 24 h; passado esse prazo, a denúncia sobe para o topo da fila.',
        '**Suspensão automática, só em dois casos:** uma mensagem que contenha vocabulário pedocriminoso explícito, ou uma conta denunciada como menor de idade por duas pessoas diferentes. A conta fica então suspensa por no máximo 72 h, enquanto um moderador analisa; ele retira ou confirma a suspensão. Fora esses dois casos e as recusas do filtro, nenhuma sanção é aplicada sem um humano.',
        '**Contestar:** você pode contestar qualquer decisão que te diga respeito, automática ou não, escrevendo para {{email.support}} (no app, a tela de uma conta suspensa tem um botão para isso). Uma pessoa reexamina a decisão.',
        '**Base legal:** nossas obrigações legais (em especial o regulamento sobre serviços digitais) e nosso legítimo interesse em garantir a segurança da comunidade.',
        '**Prazo:** veja a [tabela de prazos](#durees). Se você excluir sua conta, as denúncias que te envolvem e o registro das decisões continuam até serem apagados, sem ligação com uma conta (o registro guarda o nome envolvido).',
        '**Acesso:** os moderadores autorizados do Minimoa, e as autoridades se a lei exigir. A pessoa denunciada não sabe quem a denunciou. Uma pessoa bloqueada não é avisada.',
      ],
    },

    { h3: 'De onde você veio, e as etapas da sua jornada', id: 'croissance' },
    {
      ul: [
        '**Dados:** o jeito como você chegou ao Minimoa (o código de um criador, o link “3 palavras” ou o link de grupo aberto, um convite, ou nada disso), lido **só** no link que você abriu antes do cadastro ou no código que você digitou (“Tem um código?”); a pessoa que te trouxe, se houver; e as grandes etapas da sua jornada, uma vez cada: cadastro concluído, primeiro vínculo, volta 1, 7 e 30 dias depois, início do teste e primeiro pagamento do Minimoa+.',
        '**O que não fazemos:** nenhuma impressão digital do seu aparelho (nem modelo, nem endereço IP, nem identificador de publicidade), nenhuma ferramenta de medição de terceiros. As visitas às páginas públicas (“3 palavras”, convite, grupo, código de criador), as primeiras aberturas do app, os votos e os compartilhamentos são só **contados por dia**, sem IP nem identificador: ninguém se esconde por trás desses contadores.',
        '**Finalidade:** saber quais links e quais criadores trazem pessoas que ficam, melhorar a jornada, e oferecer o item de guarda-roupa “Presente de padrinho” à pessoa que trouxe outra e a quem chegou (item decorativo, nunca ligado a uma compra nem a uma avaliação).',
        '**Base legal:** nosso legítimo interesse.',
        '**Prazo:** a origem e as etapas, enquanto sua conta existir. Quando você a exclui, a origem é apagada e as etapas perdem qualquer ligação com você (sobra só um número). Os contadores do dia são guardados sem limite.',
        '**Acesso:** algumas pessoas autorizadas da equipe, na ferramenta interna, só em números. Um criador nunca vê quem chegou com o código dele.',
      ],
    },

    { h3: 'O quiz “Qual minimoa é você?” e “Abra seu bairro” (site, sem conta)', id: 'quiz-quartier' },
    {
      ul: [
        '**Quiz:** suas respostas servem para calcular seu resultado durante a requisição; guardamos **só o resultado** (a espécie, a personalidade e os medidores iniciais), sob um código curto, e o código do resultado da pessoa que te desafiou, se houver. Nenhum nome, nenhum endereço, nenhum IP é ligado a ele. O código serve para recuperar seu resultado e pré-preencher seu minimoa se você digitá-lo no app. Apagado depois de um ano.',
        '**Abra seu bairro:** seu endereço de e-mail, o bairro escolhido (numa lista ou pelo código postal; **nunca a sua localização**), seu idioma, a data da sua concordância e da sua confirmação, seu código para convidar e, se você veio pelo link de alguém, quem te convidou. Você só entra no contador do bairro depois de confirmar seu endereço (dupla verificação). Escrevemos no máximo duas vezes: a confirmação, e depois a abertura do bairro.',
        '**Finalidade:** te avisar da abertura do seu bairro, mostrar o contador real (um número, nunca um endereço), e oferecer o item decorativo “Medalha de fundador” às 3 primeiras pessoas que convidaram gente no bairro.',
        '**Base legal:** seu consentimento (caixa de seleção, nunca marcada de antemão), que pode ser retirado a qualquer momento pelo link de descadastro presente em cada e-mail.',
        '**Prazo:** sem confirmação, a inscrição é apagada em até 7 dias. Descadastro: o endereço é apagado na hora. Depois do e-mail de abertura, o endereço é apagado em até 30 dias; sobra só uma linha anônima (bairro e código) para o contador e o item “Medalha de fundador”.',
        '**Acesso:** o envio dos e-mails passa pelo nosso fornecedor de e-mails ({{sub.email.provider}}). A ferramenta interna da equipe só mostra contadores por bairro, nunca endereços.',
        '**No site:** durante a sua visita, o código do seu resultado fica guardado no armazenamento de sessão do seu navegador (apagado quando você fecha a aba), para te mostrar seu resultado de novo. Nenhum cookie.',
      ],
    },

    { h3: 'Estatísticas e administração' },
    {
      ul: [
        '**Dados:** números calculados a partir da atividade: quantidade de contas, contas ativas, retenção, assinantes e testes, sequências, mensagens dos minimoas, encontros propostos e aceitos, custos da IA. Para calculá-los, registramos os dias em que você abre o app, e os encontros propostos a cada pessoa.',
        '**Finalidade:** gerir e melhorar o Minimoa, controlar os custos.',
        '**Base legal:** nosso legítimo interesse.',
        '**Como:** essas estatísticas são calculadas a partir da nossa própria base, numa ferramenta interna restrita a algumas pessoas autorizadas. Não há publicidade no app; a única ferramenta de medição de uso, a {{sub.analytics.provider}}, só funciona com o seu consentimento ([veja abaixo](#statistiques-usage)). A ferramenta interna não dá acesso às conversas, exceto à mensagem denunciada e ao contexto imediato dela.',
        '**Prazo:** dias de atividade, 40 dias; encontros propostos, 30 dias; contador de uso da IA por pessoa, 2 dias; classificação interna dos minimoas mais ativos (nome e minimoa), 40 dias. Os números agregados, que não permitem identificar você, são guardados sem limite.',
      ],
    },

    { h3: 'Estatísticas de uso, só com o seu consentimento', id: 'statistiques-usage' },
    {
      ul: [
        '**Dados:** um identificador aleatório criado pela ferramenta no seu celular (sem o seu nome, o seu e-mail nem o identificador da sua conta), o modelo e o sistema do aparelho, a versão do app, o idioma e ações feitas no app (por enquanto, só uma: a criação da sua conta). Esses dados são pseudônimos, não anônimos: não dizem quem você é, mas se referem ao seu celular. **Nem endereço IP nem localização:** a ferramenta está configurada para não registrar o seu endereço IP, então não deduz dele nem cidade, nem região, nem país; também não lê a sua operadora nem a região do seu celular.',
        '**Finalidade:** entender como o app é usado, para melhorá-lo. Nunca publicidade, nunca rastreamento entre apps ou sites.',
        '**Base legal:** o seu consentimento. A pergunta é feita logo antes da criação da sua conta (“Sim, quero participar” ou “Não, obrigado”, nada vem escolhido de antemão). Sem o seu consentimento, nada é enviado.',
        '**Retirada:** a qualquer momento, em **Eu → Ajustes → Estatísticas de uso**. O envio para na hora.',
        '**Acesso:** nossa ferramenta de medição, {{sub.analytics.provider}} ({{sub.analytics.location}}), que trata esses dados em nosso nome; garantia da transferência: {{sub.analytics.safeguard}}.',
        '**Duração:** veja a [tabela de prazos](#durees).',
      ],
    },

    { h3: 'Dados técnicos' },
    {
      ul: [
        '**Dados:** endereço IP, modelo e sistema do aparelho, versão do app, idioma, registros de erros e de login.',
        '**Finalidade:** fazer o serviço funcionar, protegê-lo, limitar abusos, corrigir bugs.',
        '**Base legal:** nosso legítimo interesse.',
        '**Prazo:** veja a [tabela de prazos](#durees).',
        '**Acesso:** a equipe técnica autorizada e nossas empresas de hospedagem.',
      ],
    },

    { h3: 'As “3 palavras” e os convites (pessoas sem conta)' },
    {
      ul: [
        '**Dados:** quando alguém abre sua página “3 palavras” ou seu convite no site, mostramos seu nome e seu minimoa. Para os votos, registramos as palavras escolhidas e uma impressão irreversível do endereço IP e do navegador, para limitar votos duplicados. Nenhuma conta é pedida.',
        '**Base legal:** execução do contrato para você; nosso legítimo interesse em evitar abusos, para a impressão.',
        '**Prazo:** enquanto sua conta existir.',
        '**Acesso:** você vê as palavras, nunca quem as escolheu.',
      ],
    },

    { h3: 'Quando você escreve para a gente' },
    {
      ul: [
        '**Dados:** seu endereço de e-mail, sua mensagem, e o que for preciso para tratar o seu pedido.',
        '**Base legal:** execução do contrato ou nosso legítimo interesse em te responder; obrigação legal para os pedidos de exercício dos seus direitos.',
        '**Prazo:** veja a [tabela de prazos](#durees).',
      ],
    },

    { h2: '3. Como funciona a compatibilidade', id: 'compatibilite' },
    {
      p: 'Seu minimoa só te apresenta pessoas cuja visão de vida vai na mesma direção que a sua. Aqui está a lógica, sem segredo:',
    },
    {
      ol: [
        '**Sua visão** é posicionada em 5 eixos: lar (livre, sozinho ↔ formar uma família), raízes (ficar aqui ↔ partir), impulso (tempo para si ↔ grandes projetos), ritmo (calmo, em casa ↔ intenso, na rua), rumo (um dia de cada vez ↔ planejar tudo). Cada eixo tem um índice de confiança.',
        '**De onde ela vem**, com pesos iniciais: teste do cadastro 40% (depois cada vez menos), pergunta do dia 20%, hábitos 25%, jeito de cuidar do seu minimoa 10%, as 3 palavras dos seus amigos 5%. Quanto mais você usa o Minimoa, mais a confiança aumenta.',
        '**Os filtros**: 18 anos ou mais; a região; as pessoas bloqueadas. Nem o seu sexo nem o dos outros filtram quem te é apresentado.',
        '**A pontuação**: a proximidade nos 5 eixos, ponderada pela confiança; o eixo lar conta menos que os outros. O estilo (sociável, brincalhão, carinhoso, falante) não entra na pontuação.',
        '**O limite**: abaixo de 70%, ninguém é proposto, mesmo que isso signifique mostrar menos gente.',
        '**A explicação**: cada encontro diz por quê, com 3 pontos em comum e 1 diferença a explorar. Nunca um número sozinho.',
        '**O número de encontros** também depende da forma do seu minimoa (quanto mais você cuida dele, mais gente ele te apresenta) e da sua assinatura.',
      ],
    },
    {
      p: 'Sua visão é indicativa: é “a sua visão, por enquanto”. Não é um diagnóstico, e não usamos nenhum vocabulário médico ou psicológico.',
    },
    {
      p: '**Nenhuma decisão que produza efeitos jurídicos** sobre você, ou que te afete de forma comparável, é tomada por esse cálculo. Ele decide só quem seu minimoa te apresenta; é sempre você quem escolhe cumprimentar, aceitar ou ignorar. Você pode nos pedir explicações, contestar um resultado ou se opor a esse tratamento escrevendo para {{email.privacy}}; neste último caso, não poderemos mais te apresentar encontros.',
    },

    { h2: '4. A inteligência artificial', id: 'ia' },
    {
      p: 'O Minimoa usa a IA da **{{sub.ai.provider}}** ({{sub.ai.location}}), um fornecedor externo, em quatro pontos e em nenhum outro. Tudo pode ser visto, e o que pode ser retirado se retira, no app: **Eu → A IA e você**.',
    },
    {
      table: {
        head: ['Uso', 'Quando', 'O que o fornecedor recebe', 'O que fica guardado no Minimoa'],
        rows: [
          [
            'Leitura dos chats',
            'Só se vocês dois ativaram; pode ser retirada a qualquer momento',
            'Uma janela curta das últimas mensagens do vínculo, autores identificados como A e B, sem os nomes de vocês',
            'Nada da janela nem da análise. Só a reação do minimoa aparece no chat.',
          ],
          [
            'Fotos de prova de hábito',
            'Só se você aceitou, uma vez, antes da sua primeira prova; pode ser retirada. Sem concordância: confirmação na base da palavra, sem foto',
            'A foto reduzida e o nome do hábito',
            'A resposta (sim, não, não tenho certeza). A foto é excluída em até 24 h, a não ser que você a guarde.',
          ],
          [
            'Verificações de segurança',
            'Cada foto de perfil, antes de ser publicada (não pode ser desativada); uma mensagem que deixe dúvida ao filtro, só num chat em que vocês dois aceitaram a leitura',
            'A foto de perfil reduzida; ou só essa mensagem',
            'A decisão (aceita, ou recusada e sinalizada à moderação). Uma foto recusada é apagada.',
          ],
          [
            'Resumo da semana',
            'Nas semanas ativas, para reescrever seu resumo',
            'Um texto feito de números e frases gerais, sem nenhum nome (nem o seu, nem os dos seus vínculos, nem o do seu minimoa): nada que permita identificar você',
            'O texto do resumo, no app.',
          ],
        ],
      },
    },
    {
      p: 'Nunca enviamos ao fornecedor de IA seu endereço de e-mail, sua data de nascimento, sua localização nem o identificador da sua conta. Ele atua como operador: trata esses dados só para nós, segundo as nossas instruções, e não para fins próprios. O que ele guarda do lado dele, e por quanto tempo: {{ai.retention}}. As fotos dos desafios do dia nunca são enviadas a uma IA. Sem concordância para a leitura dos chats, os minimoas falam com frases prontas, sem IA.',
    },
    {
      p: 'As respostas da IA podem errar: elas não têm nenhum efeito jurídico. Na dúvida sobre uma prova, confiamos em você; uma foto de perfil recusada por engano pode ser comunicada a {{email.support}}.',
    },

    { h2: '5. O que os outros veem', id: 'visibilite' },
    {
      ul: [
        '**As pessoas que cruzam com você sem vínculo** (apresentações, mapa, acenos) veem seu nome, seu minimoa, o estilo dele, os pontos em comum entre vocês e uma diferença, uma versão bem desfocada da sua foto de perfil se você tiver uma (nunca o original), e a sua posição aproximada no mapa (exceto no modo discreto).',
        '**Seus vínculos** veem, além disso, as mensagens de vocês, a sequência de vocês, as etapas do vínculo, as antigas fotos do dia de vocês se houver, e sua foto de perfil nítida se você tiver uma (assim que o vínculo se forma).',
        '**Os visitantes da sua página “3 palavras” ou do seu convite** veem seu nome e seu minimoa.',
        'Ninguém vê seu endereço de e-mail, sua data de nascimento, seu sexo nem suas respostas ao teste de visão. Sua posição exata não é registrada em lugar nenhum. Suas fotos de prova não são vistas por nenhum humano, e são excluídas em até 24 h (a não ser que você as guarde nas suas lembranças privadas).',
      ],
    },

    { h2: '6. Nossos fornecedores', id: 'prestataires' },
    {
      p: 'Estes operadores tratam dados em nosso nome, segundo as nossas instruções, com um contrato conforme o artigo 28 do RGPD:',
    },
    {
      subprocessors: {
        head: ['Função', 'Fornecedor', 'Local do tratamento', 'Garantia se fora da UE'],
        roles: {
          database: 'Banco de dados, autenticação e armazenamento das fotos',
          api: 'Hospedagem do servidor do app (API)',
          ai: 'IA: leitura dos chats se vocês dois ativarem, fotos de prova se você aceitar, verificação de segurança das fotos de perfil e de algumas mensagens, resumo da semana (sem nome)',
          email: 'Envio dos e-mails (conta, lembrete do fim do teste, alertas de moderação)',
          push: 'Envio das notificações',
          maps: 'Mapa de fundo',
          analytics: 'Estatísticas de uso, só com o seu consentimento',
          site: 'Hospedagem do site minimoa.app',
        },
      },
    },
    {
      p: '**A Apple e o Google** também participam, por conta própria e segundo as próprias políticas: login (Sign in with Apple, Google), distribuição do app (App Store, Google Play), pagamento do Minimoa+ (App Store), e entrega das notificações.',
    },
    { p: 'Por fim, podemos ter que comunicar dados às autoridades, quando a lei exigir.' },

    { h2: '7. Transferências para fora da União Europeia', id: 'transferts' },
    {
      p: 'Damos preferência a fornecedores que tratam os dados na União Europeia. Quando um fornecedor trata dados fora da UE (a tabela acima indica, por exemplo o nosso fornecedor de IA), a transferência é protegida pela garantia indicada na tabela: uma decisão de adequação da Comissão Europeia (por exemplo, o Quadro de Privacidade de Dados UE–EUA, para as empresas certificadas) ou as cláusulas contratuais-tipo da Comissão. Você pode obter uma cópia escrevendo para {{email.privacy}}.',
    },

    { h2: '8. Por quanto tempo guardamos seus dados', id: 'durees' },
    {
      table: {
        head: ['Dado', 'Prazo'],
        rows: [
          ['Conta, perfil, visão, minimoa, hábitos, ajustes', 'Enquanto sua conta existir. Apagados assim que você a exclui.'],
          ['Conta inativa', 'Excluída depois de 2 anos sem login, após um e-mail de aviso enviado 30 dias antes.'],
          ['Token de login da Apple', 'Enquanto sua conta existir. Revogado junto à Apple e depois apagado quando você a exclui.'],
          ['Localização', 'Só o último ponto arredondado (cerca de 300 m) e a sua região, ou a cidade escolhida, substituídos a cada atualização. Apagados se você esquecer sua localização.'],
          ['Foto de perfil', 'Enquanto você a mantiver. A anterior é apagada quando você a troca; uma foto recusada pela verificação é apagada na hora.'],
          ['Fotos de prova e de desafio', 'Em até 24 h, a não ser que você as guarde nas suas lembranças privadas (até você deixar de guardá-las ou excluir sua conta).'],
          ['O que é enviado à IA', 'Nada fica guardado no Minimoa, exceto a resposta (reação do minimoa, veredito de uma prova, decisão de segurança, texto do resumo). No fornecedor: {{ai.retention}}.'],
          ['Mensagens, sequência, etapas e antigas fotos do dia de um vínculo', 'Enquanto o vínculo existir, ou seja, até a exclusão da conta de um de vocês dois.'],
          ['Compras', 'Status enquanto a conta existir; referências de transação por até 10 anos (obrigações contábeis), desvinculadas da conta se ela for excluída.'],
          ['Denúncias tratadas e decisões de moderação', '1 ano após o encerramento do caso, mais tempo só se a lei exigir.'],
          ['Banimento definitivo', 'Uma impressão irreversível do identificador Apple ou Google da conta, por 3 anos, para impedir um novo cadastro.'],
          ['Estatísticas', 'Dias de atividade e classificação interna nominal: 40 dias. Encontros propostos: 30 dias. Números agregados, que não permitem identificar você: sem limite.'],
          ['Estatísticas de uso (se você disse sim)', 'Na {{sub.analytics.provider}}: 25 meses no máximo.'],
          ['Quiz do site e “Abra seu bairro”', 'Resultado do quiz: 1 ano. Inscrição não confirmada: 7 dias. Endereço de e-mail: até o seu descadastro, ou 30 dias após o e-mail de abertura do bairro.'],
          ['Origem de chegada e etapas da jornada', 'Enquanto sua conta existir; apagadas ou anonimizadas na exclusão dela. Contadores do dia (visitas, primeiras aberturas, votos, compartilhamentos), sem ninguém por trás: sem limite.'],
          ['Registros técnicos do app', 'No máximo 30 dias. Os registros das nossas empresas de hospedagem seguem os prazos delas.'],
          ['Conversas com o suporte', '1 ano após o encerramento do pedido.'],
          ['Pedidos de exercício dos seus direitos', '5 anos, para podermos provar que respondemos.'],
          ['Backups', 'Substituídos conforme a rotação deles na nossa hospedagem de dados: {{dataHost.backupRetention}}.'],
        ],
      },
    },

    { h2: '9. Seus direitos', id: 'droits' },
    { p: 'Segundo o RGPD e a lei francesa Informatique et Libertés, você pode a qualquer momento:' },
    {
      ul: [
        '**acessar** seus dados e obter uma cópia;',
        'pedir a **correção** deles (muitos podem ser alterados direto no app);',
        'pedir a **exclusão** deles ([excluir sua conta](@supprimer-mon-compte) faz isso de uma vez);',
        '**retirar seu consentimento** quando ele for a base de um tratamento (localização, verificação das fotos de prova pela IA, leitura das mensagens pela IA, estatísticas de uso, notificações), sem que isso afete o que foi feito antes;',
        'se **opor** a um tratamento baseado no nosso legítimo interesse, ou pedir a **limitação** dele;',
        'receber os dados que você nos forneceu num formato legível por máquina (**portabilidade**);',
        'definir **diretrizes** sobre o destino dos seus dados depois da sua morte.',
      ],
    },
    {
      p: 'Para exercer esses direitos, escreva para {{email.privacy}} ou para o endereço postal de {{publisher.name}}: {{publisher.address}}. Respondemos em até um mês; esse prazo pode ser prorrogado por mais dois meses para um pedido complexo, e nesse caso avisamos você. Podemos pedir que você comprove que o pedido é mesmo seu.',
    },
    {
      p: 'Se você achar que seus direitos não estão sendo respeitados, pode recorrer à **CNIL** (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, [cnil.fr](https://www.cnil.fr/fr/plaintes)) ou à autoridade de proteção de dados do seu país de residência na União Europeia.',
    },

    { h2: '10. Só para adultos', id: 'mineurs' },
    {
      p: 'O Minimoa é só para pessoas com 18 anos ou mais. Pedimos a data de nascimento antes do login; abaixo de 18 anos, o cadastro é interrompido e nada é criado. Não coletamos conscientemente dados de menores de idade. Se ficarmos sabendo que uma conta pertence a uma pessoa menor de idade, ela é excluída. Você pode nos avisar pelo app com o motivo “Pessoa menor de idade”; uma conta denunciada assim por duas pessoas diferentes é suspensa enquanto aguarda um moderador.',
    },

    { h2: '11. Segurança', id: 'securite' },
    {
      ul: [
        'As trocas entre o app, o site e os nossos servidores são criptografadas em trânsito (HTTPS).',
        'Nenhuma senha fica com a gente: o login passa pela Apple ou pelo Google.',
        'As fotos ficam num armazenamento privado, acessíveis só por links temporários.',
        'O acesso aos dados é limitado às pessoas que precisam dele; a ferramenta de administração é restrita a pessoas autorizadas, só para leitura, exceto para a moderação, e as ações nela são registradas.',
        'Guardamos o mínimo possível: localização nunca registrada de forma exata, fotos de prova e de desafio excluídas em até 24 h, nada guardado no Minimoa do que é enviado à IA.',
      ],
    },
    {
      p: 'Nenhum sistema é infalível. Em caso de violação de dados, avisamos a CNIL em até 72 horas quando a lei exigir, e avisamos você diretamente se ela representar um risco alto para você.',
    },

    { h2: '12. Alterações', id: 'changements' },
    {
      p: 'Se alterarmos esta política de forma importante (por exemplo, um novo uso dos seus dados), avisamos você no app antes de as mudanças valerem, e pedimos de novo a sua concordância quando ela for necessária. A data da última atualização está no topo desta página.',
    },
  ],
};
