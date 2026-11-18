import type { LegalPage } from '../types';

export const confidentialite: LegalPage = {
  title: 'Política de privacidade — Minimoa',
  heading: 'Política de privacidade',
  description: 'Os dados que o Minimoa usa, para quê, com que fundamento jurídico, durante quanto tempo, quem lhes acede e como exercer os teus direitos.',
  intro: 'O que sabemos sobre ti, para quê, quem lhe acede, quanto tempo o guardamos e como apagar tudo.',
  summary: {
    title: 'Em resumo',
    items: [
      'Usamos os teus dados para uma só coisa: dar vida ao teu minimoa e apresentar-te pessoas compatíveis. **Sem publicidade, sem revenda.**',
      'Não te perguntamos o que procuras: o teu minimoa cria vínculos, e o que eles se tornam é convosco. **Não recolhemos nenhum dado sobre a tua orientação.**',
      'A tua **localização** só é usada com a app aberta, e **nunca é guardada exata**: guardamos apenas um ponto arredondado a cerca de 300 m e a tua zona. No mapa, os outros veem uma posição arredondada e deslocada, nunca em tempo real, e o **modo discreto** tira-te do mapa. Sem localização, escolhes a tua cidade à mão.',
      'Uma **IA de terceiros**, a da {{sub.ai.provider}} ({{sub.ai.location}}), intervém em quatro sítios, detalhados [mais abaixo](#ia): a leitura dos chats se a ativarem os dois, as tuas fotos de prova se aceitares, a verificação de segurança das fotos de perfil e de algumas mensagens, e o resumo da semana, enviado sem nenhum nome.',
      '**Ninguém no Minimoa lê as tuas conversas**, exceto uma mensagem denunciada (por alguém ou pelo nosso filtro automático) e o seu contexto imediato, lidos por um moderador.',
      'Podes alterar tudo na app e [eliminar a tua conta](@supprimer-mon-compte) a qualquer momento. Para o resto: {{email.privacy}}.',
    ],
  },
  toc: true,
  body: [
    { h2: '1. Quem é o responsável', id: 'responsable' },
    {
      p: 'O responsável pelo tratamento é **{{publisher.name}}**, {{publisher.legalForm}}, {{publisher.address}}, que edita a app e o site Minimoa ([aviso legal](@mentions-legales)).',
    },
    { ul: ['Para qualquer pergunta sobre os teus dados: {{email.privacy}}.', 'Não designámos um encarregado da proteção de dados (EPD): todos os teus pedidos sobre os teus dados vão para {{email.privacy}}.'] },
    { p: 'Esta política aplica-se à app Minimoa e ao site minimoa.app. Para os cookies do site, consulta a [página de cookies](@cookies).' },

    { h2: '2. O que usamos, e para quê', id: 'donnees' },
    {
      p: 'Para cada uso: os dados em causa, a finalidade, o fundamento jurídico (o que nos autoriza a fazê-lo segundo o RGPD), o prazo de conservação e quem lhes acede. Os prazos estão resumidos na [tabela de prazos](#durees).',
    },

    { h3: 'A tua conta' },
    {
      ul: [
        '**Dados:** o identificador que a Apple ou a Google nos transmite quando inicias sessão, e o endereço de e-mail associado. Com a Apple, pode ser um endereço de reencaminhamento que esconde o verdadeiro. Com a Apple, guardamos também um token de início de sessão emitido pela Apple, que serve apenas para revogar o acesso do Minimoa ao teu ID Apple quando eliminas a tua conta.',
        '**Finalidade:** criar a tua conta, voltar a ligar-te, proteger o acesso e escrever-te sobre a tua conta (boas-vindas, nova ligação, lembrete de fim do período experimental, aviso de moderação, aviso antes de uma eliminação por inatividade).',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a tua conta existir. Na eliminação, o token Apple é primeiro revogado junto da Apple e depois apagado. Uma conta sem início de sessão durante 2 anos é eliminada, após um e-mail de aviso enviado 30 dias antes.',
        '**Acesso:** a equipa autorizada do Minimoa, o nosso fornecedor de autenticação e o nosso fornecedor de e-mail. A Apple ou a Google sabem que usas o Minimoa, já que o início de sessão passa por elas.',
      ],
    },

    { h3: 'O teu nome e a tua data de nascimento' },
    {
      ul: [
        '**Dados:** o nome (ou alcunha) que escolhes; a tua data de nascimento.',
        '**Finalidade:** o nome apresenta-te aos outros. Passa pelo nosso filtro automático antes de ser guardado (ver [moderação](#signalements)). A data de nascimento verifica que tens 18 anos ou mais, e serve para o filtro de idade dos encontros.',
        '**Fundamento jurídico:** execução do contrato; para a idade e o filtro, também o nosso interesse legítimo em proteger os menores e a comunidade.',
        '**Prazo:** enquanto a tua conta existir. Se tiveres menos de 18 anos, a inscrição para antes do início de sessão e nada é guardado.',
        '**Acesso:** o teu nome é visível para as pessoas que o teu minimoa te apresenta e para as tuas ligações. A tua data de nascimento não é mostrada aos outros.',
      ],
    },

    { h3: 'A tua foto de perfil', id: 'photo-profil' },
    {
      ul: [
        '**Dados:** a foto que escolhes, se adicionares uma (é opcional), tirada com a câmara ou escolhida na tua galeria.',
        '**Finalidade:** mostrar-te às tuas ligações: fica escondida numa ligação até ao nível 4, desfocada no nível 4 e nítida a partir do nível 5.',
        '**Verificação de segurança:** antes de ser publicada, a foto é reduzida e enviada ao nosso fornecedor de IA, a {{sub.ai.provider}}, que verifica que não mostra nudez, nem alguém que pareça menor, nem violência, nem ódio, nem publicidade. Dizemos-te isso na app antes de escolheres a foto. Uma foto recusada é apagada de imediato, e a equipa de moderação recebe uma denúncia automática, sem a foto. Se a verificação não for possível nesse momento, a foto é publicada e verificada um pouco mais tarde. Esta verificação não pode ser desativada: protege toda a gente. Sem foto de perfil, nada é enviado.',
        '**Fundamento jurídico:** execução do contrato para a mostrar; o nosso interesse legítimo e as nossas obrigações de segurança (filtrar os conteúdos publicados) para a verificação.',
        '**Prazo:** enquanto a mantiveres. Quando a mudas, a anterior é apagada. É apagada quando eliminas a tua conta.',
        '**Acesso:** as tuas ligações, consoante o nível da ligação; o nosso fornecedor de IA, durante a verificação.',
      ],
    },

    { h3: 'O teu sexo', id: 'sexe' },
    {
      ul: [
        '**Dados:** o teu sexo (mulher, homem, não binário ou «prefiro não dizer»).',
        '**Finalidade:** ajustar os textos da app e fazer estatísticas sem nomes. **Não serve para escolher quem o teu minimoa te apresenta.**',
        '**Fundamento jurídico:** o nosso interesse legítimo. «Prefiro não dizer» é sempre possível, e podes mudar a tua resposta na app (**Eu → Definições → Quem você é**).',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** só tu. Nunca é mostrado aos outros.',
        'Não te perguntamos o que procuras nem quem queres conhecer: o teu minimoa cria vínculos, e o que eles se tornam é convosco. As respostas dadas a essas perguntas antes de 17 de novembro de 2026, e o consentimento que as acompanhava, foram apagadas.',
      ],
    },

    { h3: 'A tua localização', id: 'localisation' },
    {
      ul: [
        '**Dados:** a tua posição, **só com a app aberta** (nunca em segundo plano). **Nunca é guardada tal como está**: o nosso servidor guarda apenas o centro da quadrícula de cerca de 300 m onde te encontras, e a tua zona de residência aproximada, deduzida dela (com a mesma precisão). A posição exata serve apenas, durante o pedido, para saber se estás fora da tua zona de residência.',
        '**Sem localização:** podes escolher a tua cidade à mão (grátis; uma vez a cada 30 dias, ou quando quiseres com o Minimoa+). Guardamos então apenas a cidade escolhida e o seu centro, que servem de zona.',
        '**Finalidade:** mostrar-te o mapa e os minimoas compatíveis à tua volta; propor-te encontros próximos; confirmar que uma saída aconteceu fora da tua zona de residência, para subir a sociabilidade do teu minimoa.',
        '**O que os outros veem:** nunca a tua posição exata. Veem uma posição arredondada a cerca de 300 m e deslocada, nunca em tempo real. O **modo discreto** tira-te completamente do mapa.',
        '**Fundamento jurídico:** o teu consentimento, dado através da autorização de localização do telemóvel ou ao escolheres a tua cidade. Podes retirá-lo a qualquer momento: nas definições do telemóvel, ou na app (**Eu → Definições → A minha localização → Esquecer a minha localização**), o que apaga a tua posição e a tua zona.',
        '**Prazo:** o último ponto arredondado e a tua zona (ou a cidade escolhida), substituídos a cada atualização. Não guardamos o histórico das tuas deslocações.',
        '**Acesso:** a equipa autorizada do Minimoa, o nosso fornecedor de alojamento e o fornecedor do mapa de fundo, que recebe do teu telemóvel a zona mostrada no ecrã.',
      ],
    },

    { h3: 'A tua visão e a compatibilidade' },
    {
      ul: [
        '**Dados:** as tuas respostas ao teste de visão (12 situações), as tuas respostas às perguntas do dia, os hábitos que escolhes e os que manténs, a forma como cuidas do teu minimoa (regularidade, horas, saídas) e as 3 palavras que os teus amigos escolhem para ti. A partir daí deduzimos a tua «visão» em 5 eixos, com um índice de confiança, e um «estilo» (sociável, brincalhão, terno, falador).',
        '**Finalidade:** calcular a compatibilidade com outras pessoas e apresentar-te as que combinam contigo; explicar cada encontro; dar carácter ao teu minimoa. Trata-se de **definição de perfis**, explicada em detalhe [mais abaixo](#compatibilite).',
        '**Fundamento jurídico:** execução do contrato (é o núcleo do serviço).',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** o algoritmo de encontros. Uma pessoa que te é apresentada vê o que têm em comum e uma diferença, nunca as tuas respostas nem um número isolado.',
      ],
    },
    { p: 'Não te perguntamos a tua religião, as tuas opiniões políticas nem a tua saúde.' },

    { h3: 'O teu minimoa, os teus hábitos e a tua série' },
    {
      ul: [
        '**Dados:** o nome e o aspeto do teu minimoa, os seus indicadores (sociabilidade, fome, energia, humor), os gestos que fazes, os teus hábitos e o seu ritmo, a tua série, os teus jokers, os teus objetos, os teus desafios do dia, o teu resumo da semana. O nome do minimoa passa pelo nosso filtro automático, como o teu nome.',
        '**Finalidade:** fazer funcionar o jogo.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** tu; as tuas ligações e as pessoas apresentadas veem o teu minimoa e o seu estilo.',
      ],
    },

    { h3: 'As fotos de prova e de desafio', id: 'preuves' },
    {
      ul: [
        '**Dados:** a foto que tiras na app quando o teu minimoa pede uma prova de um hábito (por exemplo, as tuas sapatilhas), ou para um desafio fotográfico do dia. É tirada com a câmara, não a partir da tua galeria.',
        '**Finalidade:** verificar que um hábito foi cumprido; contar um desafio como cumprido.',
        '**Verificação por uma IA, só se aceitares:** antes da tua primeira prova, a app diz-te o que é enviado, a quem e porquê, e tu escolhes. Se aceitares, cada foto de prova é reduzida e enviada à {{sub.ai.provider}} com o nome do hábito (nem o teu nome, nem a tua localização), que responde sim, não ou «não tenho a certeza», com uma frase; se «não tenho a certeza», confiamos em ti. Se recusares, **nenhuma foto é enviada a uma IA**: validas o hábito sob palavra, sem foto, e a tua série avança da mesma forma. Podes mudar de ideias quando quiseres em **Eu → A IA e tu**. As fotos dos desafios nunca são enviadas a uma IA.',
        '**Fundamento jurídico:** o teu consentimento, para a verificação pela IA; execução do contrato, para o armazenamento temporário.',
        '**Prazo:** **apagada do nosso armazenamento no prazo de 24 h**, exceto se decidires guardá-la nas tuas recordações privadas (fica lá até deixares de a guardar ou eliminares a tua conta).',
        '**Acesso:** **nenhum ser humano a vê**, nem no Minimoa nem em mais lado nenhum no Minimoa. Só a {{sub.ai.provider}} recebe uma foto de prova, reduzida, se tiveres aceitado.',
      ],
    },
    { p: 'Evita fotografar outras pessoas, documentos ou informações sensíveis.' },

    { h3: 'As tuas mensagens, e a sua leitura por uma IA se a ativarem', id: 'messages' },
    {
      ul: [
        '**Dados:** as mensagens que trocas nas tuas ligações, a sua data e o que foi lido.',
        '**Finalidade:** transmiti-las à outra pessoa e guardá-las na vossa conversa.',
        '**Filtro automático:** antes de ser enviada, cada mensagem passa pelo nosso filtro, nos nossos servidores (listas de palavras em várias línguas, sem IA). Uma infração clara (ameaça, ódio, conteúdo sexual que envolva um menor, sexo pago, burla) não é enviada: dizemos-te porquê, o teu texto fica no campo, e a equipa de moderação recebe uma denúncia automática com um breve excerto. Uma mensagem duvidosa (insulto, conteúdo sexual explícito) é enviada, mas sinalizada à equipa de moderação, e o teu minimoa propõe-te uma pausa.',
        '**Fundamento jurídico:** execução do contrato; para o filtro, o nosso interesse legítimo e as nossas obrigações de segurança.',
        '**Prazo:** enquanto a ligação existir, ou seja, enquanto as vossas duas contas existirem. Sair de uma ligação retira-a das listas dos dois sem apagar a conversa: ela volta se se reencontrarem. Se um de vocês eliminar a conta, a ligação e as suas mensagens são apagadas para os dois.',
        '**Acesso:** tu e a outra pessoa. Um moderador pode ler uma mensagem **denunciada**, por um de vocês ou pelo filtro, e o seu contexto imediato (ver [denúncias](#signalements)).',
      ],
    },
    {
      note: 'A frase que a app vos mostra antes de vos pedir o consentimento: «Ninguém no Minimoa lê as tuas conversas, exceto uma mensagem denunciada e as poucas mensagens à volta, para a moderação. Se a ativarem os dois, uma IA lê as vossas últimas mensagens para que os vossos minimoas possam reagir. Esta IA é fornecida pela {{sub.ai.provider}} ({{sub.ai.location}}), o nosso fornecedor, que recebe estas mensagens por nossa conta. Podes retirar o teu consentimento quando quiseres.»',
    },
    {
      ul: [
        '**Consentimento de cada um:** pedimo-lo aos dois, na primeira abertura do chat (ou uma vez para todos os teus chats, se escolheres uma definição por defeito). Se um de vocês não tiver dito sim, a IA não lê nada: os minimoas só reagem ao ritmo da ligação (silêncios, séries, desafios), com frases já escritas.',
        '**Retirada:** a qualquer momento, nas opções da ligação, ou para todos os teus chats em **Eu → A IA e tu**. A leitura para de imediato.',
        '**Como:** não há análise de cada mensagem. Quando algo a desencadeia (um silêncio, um certo número de mensagens, um tom que sobe), uma curta janela das últimas mensagens é enviada à {{sub.ai.provider}}, com os autores marcados A e B, sem os vossos nomes; a IA propõe a reação do minimoa. No máximo 3 intervenções por dia e por ligação, e podes desativá-las numa ligação. Se o tom subir, o teu minimoa pode propor-te uma pausa: essa mensagem só é visível para ti.',
        '**Verificação de segurança:** num chat em que os dois aceitaram a leitura, uma mensagem que deixa dúvidas ao nosso filtro (uma ligação externa, por exemplo) também pode ser enviada sozinha à {{sub.ai.provider}}, depois de enviada, para verificar que respeita as regras. Se não as respeitar, é sinalizada à equipa de moderação.',
        '**O que é guardado:** no Minimoa, nada da janela enviada nem da análise; só a reação do minimoa aparece no chat, como uma mensagem. O que a {{sub.ai.provider}} guarda do seu lado, e durante quanto tempo: {{ai.retention}}.',
        '**Fundamento jurídico:** o consentimento de cada um de vocês.',
      ],
    },

    { h3: 'A série e as etapas de uma ligação' },
    {
      ul: [
        '**Dados:** os dias em que cada um de vocês escreveu na ligação (não o conteúdo das mensagens) e as etapas da ligação (encontro, níveis passados, recordes de série). Para as ligações anteriores a 15 de novembro de 2026, as «fotos do dia» que enviaram um ao outro: o Minimoa já não recebe novas, e as antigas ficam nas recordações da ligação.',
        '**Finalidade:** fazer viver a série da ligação (os dias seguidos em que escrevem os dois), as suas vidas e os seus níveis, e mostrar-vos as vossas recordações.',
        '**Fundamento jurídico:** execução do contrato.',
        '**Prazo:** enquanto a ligação existir (mesmas regras que as mensagens): as antigas fotos do dia são apagadas quando a ligação o for, ou quando um de vocês eliminar a conta.',
        '**Acesso:** tu e a outra pessoa da ligação (as fotos antigas dela ficam desfocadas para ti até ao nível 5). As fotos são guardadas num espaço privado, acessíveis só através de ligações temporárias.',
      ],
    },

    { h3: 'As notificações e os e-mails' },
    {
      ul: [
        '**Dados:** o token técnico do teu telemóvel para as notificações, as tuas definições por tipo de notificação, a hora escolhida para o desafio do dia; no iPhone, os tokens das atividades em direto.',
        '**Finalidade:** avisar-te (desafio do dia, novo encontro, mensagem, «é a tua vez de escrever» à noite, ligação ou série em perigo, prova pedida, resumo, lembrete de fim do período experimental; primeiros passos nos 7 primeiros dias, notícias do teu minimoa quando estás ausente e nos vossos aniversários, mensagens da tua subscrição Minimoa+). Horas de silêncio das 22 h às 8 h; fora das mensagens, 3 por dia no máximo. O lembrete de fim do período experimental e os e-mails da tua subscrição (boas-vindas, pagamento recusado, fim) também são enviados por e-mail, mesmo que as notificações estejam desativadas. O e-mail após 14 dias de ausência e o único lembrete um mês depois do fim do Minimoa+ desativam-se com a mesma definição da notificação («Notícias do seu minimoa», «Sua assinatura do Minimoa+»). No iPhone, o widget e as atividades em direto usam os mesmos dados; uma atividade em direto no ecrã bloqueado nunca mostra o nome de ninguém.',
        '**Fundamento jurídico:** o teu consentimento para as notificações, dado através da autorização do telemóvel (retiras-o nas definições do telemóvel ou tipo a tipo na app); execução do contrato para os e-mails sobre a tua conta e a tua subscrição; interesse legítimo para o e-mail de ausência e o lembrete após o fim do Minimoa+ (opões-te desativando a definição).',
        '**Prazo:** até desativares as notificações ou eliminares a tua conta. A lista das mensagens já enviadas (apenas o tipo e a data, para nunca enviar duas vezes a mesma) é guardada 400 dias no máximo.',
        '**Acesso:** os nossos fornecedores de envio de notificações e de e-mails, e a Apple ou a Google, que fazem chegar as notificações ao teu telemóvel.',
      ],
    },

    { h3: 'As compras Minimoa+' },
    {
      ul: [
        '**Dados:** a oferta escolhida, as datas de compra, de período experimental e de renovação, o estado da subscrição, o identificador da transação. **Nunca recebemos os teus dados de pagamento**: é a Apple que te fatura.',
        '**Finalidade:** ativar as funções Minimoa+, verificar a compra junto da Apple, gerir o período experimental e o seu lembrete.',
        '**Fundamento jurídico:** execução do contrato; obrigações contabilísticas para as referências de transação.',
        '**Prazo:** o estado enquanto a tua conta existir; as referências de transação, desligadas da tua conta se for eliminada, até 10 anos (obrigações contabilísticas).',
        '**Acesso:** a equipa autorizada do Minimoa; a Apple, segundo a sua própria política.',
      ],
    },

    { h3: 'Filtragem, denúncias, bloqueios e moderação', id: 'signalements' },
    {
      ul: [
        '**Dados:** quem denuncia, quem é denunciado, a ligação em causa, o motivo, as precisões escritas; a **mensagem denunciada e o seu contexto imediato**; as denúncias automáticas do nosso filtro (nome ou nome de minimoa recusado, mensagem não enviada com um excerto de 280 caracteres no máximo, mensagem duvidosa, foto de perfil recusada, sem a foto); os bloqueios; as decisões de moderação e o registo das ações.',
        '**Filtragem automática:** os nomes, os nomes de minimoa, as mensagens e as fotos de perfil são filtrados antes de serem publicados (ver acima). Um nome recusado não é guardado, e a app diz-te porquê.',
        '**Finalidade:** proteger as pessoas, tratar as denúncias, aplicar as [regras](@regles), responder às autoridades, impedir que uma pessoa bloqueada te contacte. A equipa de moderação é avisada por e-mail de cada nova denúncia: de imediato se for urgente (menor, ameaça), caso contrário num resumo. Objetivo: tratamento em 24 h; depois disso, a denúncia sobe para o topo da fila.',
        '**Suspensão automática, só em dois casos:** uma mensagem com vocabulário pedocriminoso explícito, ou uma conta denunciada como menor por duas pessoas diferentes. A conta fica suspensa no máximo 72 h, enquanto um moderador a analisa; este levanta ou confirma a suspensão. Fora destes dois casos e das recusas do filtro, nenhuma sanção é tomada sem uma pessoa.',
        '**Contestar:** podes contestar qualquer decisão que te diga respeito, automática ou não, escrevendo para {{email.support}} (na app, o ecrã de conta suspensa tem um botão para isso). Uma pessoa reexamina a decisão.',
        '**Fundamento jurídico:** as nossas obrigações legais (nomeadamente o Regulamento dos Serviços Digitais) e o nosso interesse legítimo em garantir a segurança da comunidade.',
        '**Prazo:** ver a [tabela de prazos](#durees). Se eliminares a tua conta, as denúncias que te dizem respeito e o registo das decisões ficam até serem apagados, sem ligação a nenhuma conta (o registo guarda o nome em causa).',
        '**Acesso:** os moderadores autorizados do Minimoa e as autoridades se a lei o exigir. A pessoa denunciada não sabe quem a denunciou. Uma pessoa bloqueada não é avisada.',
      ],
    },

    { h3: 'De onde vens, e as etapas do teu percurso', id: 'croissance' },
    {
      ul: [
        '**Dados:** a forma como chegaste ao Minimoa (o código de um criador, o link de “3 palavras” ou de grupo que abriste, um convite, ou nada disso), lida **apenas** no link que abriste antes de te registares ou no código que escreveste (“Tem um código?”); a pessoa que te trouxe, se houver; e as grandes etapas do teu percurso, uma vez cada: registo concluído, primeira ligação, regresso 1, 7 e 30 dias depois, início do período experimental e primeiro pagamento Minimoa+.',
        '**O que não fazemos:** nenhuma impressão digital do teu dispositivo (nem modelo, nem endereço IP, nem identificador publicitário), nenhuma ferramenta de medição de terceiros. As visitas às páginas públicas (“3 palavras”, convite, grupo, código de criador), os primeiros arranques da app, os votos e as partilhas são apenas **contados por dia**, sem IP nem identificador: não há ninguém por trás destes contadores.',
        '**Finalidade:** saber que links e que criadores trazem pessoas que ficam, melhorar o percurso, e oferecer o objeto de guarda-roupa “Padrinho” a quem trouxe alguém e a quem chega (objeto decorativo, nunca ligado a uma compra nem a uma avaliação).',
        '**Base legal:** o nosso interesse legítimo.',
        '**Prazo:** a origem e as etapas, enquanto a tua conta existir. Quando a apagas, a origem é apagada e as etapas perdem qualquer ligação a ti (fica apenas um número). Os contadores diários são guardados sem limite.',
        '**Acesso:** algumas pessoas autorizadas da equipa, na ferramenta interna, apenas como números. Um criador nunca vê quem chegou com o seu código.',
      ],
    },

    { h3: 'O quiz «Qual minimoa és tu?» e «Abre o teu bairro» (site, sem conta)', id: 'quiz-quartier' },
    {
      ul: [
        '**Quiz:** as tuas respostas servem para calcular o teu resultado durante o pedido; guardamos **apenas o resultado** (a espécie, o carácter e os indicadores de partida) com um código curto, e o código do resultado da pessoa que te desafiou, se houver. Nenhum nome, endereço ou IP fica associado. O código permite voltar a encontrar o teu resultado e preencher o teu minimoa se o escreveres na app. Apagado ao fim de um ano.',
        '**Abre o teu bairro:** o teu endereço de e-mail, o bairro escolhido (numa lista ou pelo código postal; **nunca a tua localização**), a tua língua, a data do teu consentimento e da tua confirmação, o teu código para convidar e, se chegaste pelo link de alguém, quem te convidou. Só contas no contador do bairro depois de confirmares o teu endereço (dupla confirmação). Escrevemos-te duas vezes no máximo: a confirmação e a abertura do bairro.',
        '**Finalidade:** avisar-te da abertura do teu bairro, mostrar o contador real (um número, nunca um endereço) e oferecer o objeto decorativo «Fundador» às 3 primeiras pessoas que convidaram no bairro.',
        '**Fundamento jurídico:** o teu consentimento (caixa nunca marcada à partida), que podes retirar a qualquer momento através do link de cancelamento presente em cada e-mail.',
        '**Prazo:** se não for confirmada, a inscrição é apagada em 7 dias. Ao cancelares, o endereço é apagado de imediato. Depois do e-mail de abertura, o endereço é apagado em 30 dias; fica apenas uma linha anónima (bairro e código) para o contador e o objeto «Fundador».',
        '**Acesso:** os e-mails são enviados através do nosso prestador de e-mail ({{sub.email.provider}}). A ferramenta interna da equipa só mostra contadores por bairro, nunca um endereço.',
        '**No site:** durante a tua visita, o código do teu resultado fica guardado no armazenamento de sessão do teu navegador (apagado quando fechas o separador), para te voltar a mostrar o resultado. Sem cookies.',
      ],
    },

    { h3: 'Estatísticas e administração' },
    {
      ul: [
        '**Dados:** números calculados a partir da atividade: número de contas, contas ativas, retenção, subscritores e períodos experimentais, séries, mensagens dos minimoas, encontros propostos e aceites, custos da IA. Para os calcular, registamos os dias em que abres a app e os encontros propostos a cada pessoa.',
        '**Finalidade:** gerir e melhorar o Minimoa, controlar os custos.',
        '**Fundamento jurídico:** o nosso interesse legítimo.',
        '**Como:** estas estatísticas são calculadas a partir da nossa própria base de dados, numa ferramenta interna reservada a algumas pessoas autorizadas. Não há ferramentas de medição de audiência nem de publicidade na app. A ferramenta interna não dá acesso às conversas, exceto à mensagem denunciada e ao seu contexto imediato.',
        '**Prazo:** dias de atividade, 40 dias; encontros propostos, 30 dias; contador de uso da IA por pessoa, 2 dias; classificação interna dos minimoas mais ativos (nome e minimoa), 40 dias. Os números agregados, que não permitem identificar-te, são guardados sem limite.',
      ],
    },

    { h3: 'Dados técnicos' },
    {
      ul: [
        '**Dados:** endereço IP, modelo e sistema do dispositivo, versão da app, língua, registos de erros e de ligação.',
        '**Finalidade:** fazer funcionar o serviço, protegê-lo, limitar os abusos, corrigir erros.',
        '**Fundamento jurídico:** o nosso interesse legítimo.',
        '**Prazo:** ver a [tabela de prazos](#durees).',
        '**Acesso:** a equipa técnica autorizada e os nossos fornecedores de alojamento.',
      ],
    },

    { h3: 'As «3 palavras» e os convites (pessoas sem conta)' },
    {
      ul: [
        '**Dados:** quando alguém abre a tua página «3 palavras» ou o teu convite no site, mostramos o teu nome e o teu minimoa. Para os votos, guardamos as palavras escolhidas e uma impressão não reversível do endereço IP e do navegador, para limitar os votos repetidos. Não é pedida nenhuma conta.',
        '**Fundamento jurídico:** execução do contrato no teu caso; o nosso interesse legítimo em evitar abusos, para a impressão.',
        '**Prazo:** enquanto a tua conta existir.',
        '**Acesso:** tu vês as palavras, nunca quem as escolheu.',
      ],
    },

    { h3: 'Quando nos escreves' },
    {
      ul: [
        '**Dados:** o teu endereço de e-mail, a tua mensagem e o necessário para tratar o teu pedido.',
        '**Fundamento jurídico:** execução do contrato ou o nosso interesse legítimo em responder-te; obrigação legal para os pedidos de exercício dos teus direitos.',
        '**Prazo:** ver a [tabela de prazos](#durees).',
      ],
    },

    { h2: '3. Como funciona a compatibilidade', id: 'compatibilite' },
    { p: 'O teu minimoa só te apresenta pessoas cuja visão da vida vai na mesma direção que a tua. Eis a lógica, sem segredos:' },
    {
      ol: [
        '**A tua visão** é colocada em 5 eixos: lar (livre, sozinho ↔ formar família), raízes (ficar aqui ↔ partir), impulso (tempo para si ↔ grandes projetos), ritmo (calmo, em casa ↔ intenso, fora), rumo (dia a dia ↔ planear tudo). Cada eixo tem um índice de confiança.',
        '**De onde vem**, com pesos iniciais: teste de inscrição 40 % (e cada vez menos), pergunta do dia 20 %, hábitos 25 %, a forma como cuidas do teu minimoa 10 %, as 3 palavras dos teus amigos 5 %. Quanto mais usas o Minimoa, mais a confiança sobe.',
        '**Os filtros**: 18 anos ou mais; a zona; as pessoas bloqueadas. Nem o teu sexo nem o dos outros filtram quem te é apresentado.',
        '**A pontuação**: a proximidade nos 5 eixos, ponderada pela confiança. O eixo lar conta menos do que os outros. O estilo (sociável, brincalhão, terno, falador) não entra na pontuação.',
        '**O limiar**: abaixo de 70 %, ninguém é proposto, mesmo que isso signifique mostrar menos pessoas.',
        '**A explicação**: cada encontro diz porquê, com 3 pontos em comum e 1 diferença a explorar. Nunca um número isolado.',
        '**O número de encontros** depende também da forma do teu minimoa (quanto mais cuidas dele, mais gente te apresenta) e da tua subscrição.',
      ],
    },
    { p: 'A tua visão é indicativa: é «a tua visão, por agora». Não é um diagnóstico, e não usamos nenhum vocabulário médico ou psicológico.' },
    {
      p: '**Nenhuma decisão que produza efeitos jurídicos** sobre ti, ou que te afete de forma semelhante, é tomada por este cálculo. Decide apenas quem o teu minimoa te apresenta; és sempre tu quem escolhe cumprimentar, aceitar ou ignorar. Podes pedir-nos explicações, contestar um resultado ou opor-te a este tratamento escrevendo para {{email.privacy}}; neste último caso, deixaremos de te poder apresentar alguém.',
    },

    { h2: '4. A inteligência artificial', id: 'ia' },
    {
      p: 'O Minimoa usa a IA da **{{sub.ai.provider}}** ({{sub.ai.location}}), um fornecedor externo, em quatro sítios e em mais nenhum. Tudo se vê, e o que pode ser retirado retira-se, na app: **Eu → A IA e tu**.',
    },
    {
      table: {
        head: ['Uso', 'Quando', 'O que o fornecedor recebe', 'O que o Minimoa guarda'],
        rows: [
          [
            'Leitura dos chats',
            'Só se a ativaram os dois; pode ser retirada a qualquer momento',
            'Uma curta janela das últimas mensagens da ligação, com os autores marcados A e B, sem os vossos nomes',
            'Nada da janela nem da análise. Só a reação do minimoa aparece no chat.',
          ],
          [
            'Fotos de prova de hábitos',
            'Só se aceitaste, uma vez, antes da tua primeira prova; pode ser retirado. Sem consentimento: validação sob palavra, sem foto',
            'A foto reduzida e o nome do hábito',
            'A resposta (sim, não, não tenho a certeza). A foto é apagada em 24 h, exceto se a guardares.',
          ],
          [
            'Verificações de segurança',
            'Cada foto de perfil, antes de ser publicada (não pode ser desativada); uma mensagem que deixa dúvidas ao filtro, só num chat em que os dois aceitaram a leitura',
            'A foto de perfil reduzida; ou essa única mensagem',
            'A decisão (aceite, ou recusada e sinalizada à moderação). Uma foto recusada é apagada.',
          ],
          [
            'Resumo da semana',
            'Nas semanas ativas, para reformular o teu resumo',
            'Um texto feito de números e frases gerais, sem nenhum nome (nem o teu, nem os das tuas ligações, nem o do teu minimoa): nada que permita identificar-te',
            'O texto do resumo, na app.',
          ],
        ],
      },
    },
    {
      p: 'Nunca enviamos ao fornecedor de IA o teu endereço de e-mail, a tua data de nascimento, a tua localização nem o identificador da tua conta. Atua como subcontratante: trata estes dados apenas para nós, segundo as nossas instruções, e não para os seus próprios fins. O que guarda do seu lado, e durante quanto tempo: {{ai.retention}}. As fotos dos desafios do dia nunca são enviadas a uma IA. Sem consentimento para a leitura dos chats, os minimoas falam com frases já escritas, sem IA.',
    },
    {
      p: 'As respostas da IA podem enganar-se: não têm nenhum efeito jurídico. Em caso de dúvida sobre uma prova, confiamos em ti; uma foto de perfil recusada por engano pode ser comunicada para {{email.support}}.',
    },

    { h2: '5. O que os outros veem', id: 'visibilite' },
    {
      ul: [
        '**As pessoas que o teu minimoa te apresenta** veem o teu nome, o teu minimoa, o seu estilo, o que têm em comum e uma diferença, e a tua posição aproximada no mapa (exceto em modo discreto).',
        '**As tuas ligações** veem também as vossas mensagens, a vossa série, as etapas da vossa ligação, as vossas antigas fotos do dia, se as houver, e a tua foto de perfil, se tiveres uma (escondida até ao nível 4, desfocada no nível 4, nítida a partir do nível 5).',
        '**Quem visita a tua página «3 palavras» ou o teu convite** vê o teu nome e o teu minimoa.',
        'Ninguém vê o teu endereço de e-mail, a tua data de nascimento, o teu sexo, nem as tuas respostas ao teste de visão. A tua posição exata não é guardada em lado nenhum. As tuas fotos de prova não são vistas por nenhum ser humano, e são apagadas no prazo de 24 h (exceto se as guardares nas tuas recordações privadas).',
      ],
    },

    { h2: '6. Os nossos fornecedores', id: 'prestataires' },
    { p: 'Estes subcontratantes tratam dados por nossa conta, segundo as nossas instruções, com um contrato conforme ao artigo 28.º do RGPD:' },
    {
      subprocessors: {
        head: ['Função', 'Fornecedor', 'Local de tratamento', 'Garantia se fora da UE'],
        roles: {
          database: 'Base de dados, autenticação e armazenamento das fotos',
          api: 'Alojamento do servidor da app (API)',
          ai: 'IA: leitura dos chats se a ativarem os dois, fotos de prova se aceitares, verificação de segurança das fotos de perfil e de algumas mensagens, resumo da semana (sem nomes)',
          email: 'Envio de e-mails (conta, lembrete de fim do período experimental, alertas de moderação)',
          push: 'Envio de notificações',
          maps: 'Mapa de fundo',
          site: 'Alojamento do site minimoa.app',
        },
      },
    },
    {
      p: 'A **Apple e a Google** também intervêm, por conta própria e segundo as suas próprias políticas: início de sessão (Sign in with Apple, Google), distribuição da app (App Store, Google Play), pagamento do Minimoa+ (App Store) e entrega das notificações.',
    },
    { p: 'Por fim, podemos ter de comunicar dados às autoridades, quando a lei o exige.' },

    { h2: '7. Transferências para fora da União Europeia', id: 'transferts' },
    {
      p: 'Damos preferência a fornecedores que tratam os dados na União Europeia. Quando um fornecedor trata dados fora da UE (a tabela acima indica-o, por exemplo o nosso fornecedor de IA), a transferência é enquadrada pela garantia indicada na tabela: uma decisão de adequação da Comissão Europeia (por exemplo, o Quadro de Privacidade de Dados UE-EUA, para as empresas certificadas) ou as cláusulas contratuais-tipo da Comissão. Podes obter uma cópia escrevendo para {{email.privacy}}.',
    },

    { h2: '8. Durante quanto tempo guardamos os teus dados', id: 'durees' },
    {
      table: {
        head: ['Dado', 'Prazo'],
        rows: [
          ['Conta, perfil, visão, minimoa, hábitos, definições', 'Enquanto a tua conta existir. Apagados assim que a eliminas.'],
          ['Conta inativa', 'Eliminada após 2 anos sem início de sessão, depois de um e-mail de aviso enviado 30 dias antes.'],
          ['Token de início de sessão Apple', 'Enquanto a tua conta existir. Revogado junto da Apple e depois apagado quando a eliminas.'],
          ['Localização', 'Só o último ponto arredondado (cerca de 300 m) e a tua zona, ou a cidade escolhida, substituídos a cada atualização. Apagados se esqueceres a tua localização.'],
          ['Foto de perfil', 'Enquanto a mantiveres. A anterior é apagada quando a mudas; uma foto recusada pela verificação é apagada de imediato.'],
          ['Fotos de prova e de desafio', 'No prazo de 24 h, exceto se as guardares nas tuas recordações privadas (até deixares de as guardar ou eliminares a tua conta).'],
          ['O que é enviado à IA', 'O Minimoa não guarda nada, exceto a resposta (reação do minimoa, veredicto de uma prova, decisão de segurança, texto do resumo). No fornecedor: {{ai.retention}}.'],
          ['Mensagens, série, etapas e antigas fotos do dia de uma ligação', 'Enquanto a ligação existir, ou seja, até um de vocês eliminar a conta.'],
          ['Compras', 'Estado enquanto a conta existir; referências de transação até 10 anos (obrigações contabilísticas), desligadas da conta se for eliminada.'],
          ['Denúncias tratadas e decisões de moderação', '1 ano após o encerramento do processo, mais tempo só se a lei o exigir.'],
          ['Exclusão definitiva', 'Uma impressão não reversível do identificador Apple ou Google da conta, durante 3 anos, para impedir uma nova inscrição.'],
          ['Estatísticas', 'Dias de atividade e classificação interna nominativa: 40 dias. Encontros propostos: 30 dias. Números agregados, que não permitem identificar-te: sem limite.'],
          ['Quiz do site e «Abre o teu bairro»', 'Resultado do quiz: 1 ano. Inscrição não confirmada: 7 dias. Endereço de e-mail: até cancelares, ou 30 dias depois do e-mail de abertura do bairro.'],
          ['Origem de chegada e etapas do percurso', 'Enquanto a tua conta existir; apagadas ou anonimizadas quando é apagada. Contadores diários (visitas, primeiros arranques, votos, partilhas), sem ninguém por trás: sem limite.'],
          ['Registos técnicos da app', '30 dias no máximo. Os registos dos nossos fornecedores de alojamento seguem os seus próprios prazos.'],
          ['Trocas com o apoio', '1 ano após o encerramento do pedido.'],
          ['Pedidos de exercício dos teus direitos', '5 anos, para podermos provar que respondemos.'],
          ['Cópias de segurança', 'Substituídas à medida que rodam no nosso fornecedor de dados: {{dataHost.backupRetention}}.'],
        ],
      },
    },

    { h2: '9. Os teus direitos', id: 'droits' },
    { p: 'Segundo o RGPD e a lei francesa de proteção de dados, podes a qualquer momento:' },
    {
      ul: [
        '**aceder** aos teus dados e obter uma cópia;',
        'pedir a sua **retificação** (muitos alteram-se diretamente na app);',
        'pedir o seu **apagamento** ([eliminar a tua conta](@supprimer-mon-compte) fá-lo de uma vez);',
        '**retirar o teu consentimento** quando ele fundamenta um tratamento (localização, verificação das fotos de prova pela IA, leitura das mensagens pela IA, notificações), sem pôr em causa o que foi feito antes;',
        '**opor-te** a um tratamento baseado no nosso interesse legítimo, ou pedir a sua **limitação**;',
        'recuperar os dados que nos forneceste num formato legível por máquina (**portabilidade**);',
        'definir **diretrizes** sobre o destino dos teus dados após a tua morte.',
      ],
    },
    {
      p: 'Para exercer estes direitos, escreve para {{email.privacy}} ou para a morada postal de {{publisher.name}}: {{publisher.address}}. Respondemos no prazo de um mês; este prazo pode ser prolongado por dois meses para um pedido complexo, e nesse caso avisamos-te. Podemos pedir-te que proves que o pedido vem de ti.',
    },
    {
      p: 'Se considerares que os teus direitos não são respeitados, podes apresentar uma reclamação à **CNIL**, a autoridade francesa de proteção de dados (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, França, [cnil.fr](https://www.cnil.fr/fr/plaintes)), ou à autoridade de proteção de dados do teu país de residência na União Europeia.',
    },

    { h2: '10. Só para adultos', id: 'mineurs' },
    {
      p: 'O Minimoa é reservado a pessoas com 18 anos ou mais. Pedimos a data de nascimento antes do início de sessão; abaixo dos 18 anos, a inscrição para e nada é criado. Não recolhemos conscientemente dados sobre menores. Se soubermos que uma conta pertence a uma pessoa menor, é eliminada. Podes avisar-nos a partir da app com o motivo «Pessoa menor»; uma conta denunciada assim por duas pessoas diferentes fica suspensa até um moderador a analisar.',
    },

    { h2: '11. Segurança', id: 'securite' },
    {
      ul: [
        'As trocas entre a app, o site e os nossos servidores são cifradas em trânsito (HTTPS).',
        'Não guardamos palavras-passe: o início de sessão passa pela Apple ou pela Google.',
        'As fotos estão num armazenamento privado, acessíveis só através de ligações temporárias.',
        'O acesso aos dados está limitado às pessoas que precisam dele; a ferramenta de administração está reservada a pessoas autorizadas, só de leitura exceto para a moderação, e as suas ações ficam registadas.',
        'Guardamos o mínimo possível: localização nunca guardada exata, fotos de prova e de desafio apagadas em 24 h, nada guardado no Minimoa do que é enviado à IA.',
      ],
    },
    {
      p: 'Nenhum sistema é infalível. Em caso de violação de dados, avisamos a CNIL no prazo de 72 horas quando a lei o exige, e avisamos-te diretamente se ela representar um risco elevado para ti.',
    },

    { h2: '12. Alterações', id: 'changements' },
    {
      p: 'Se alterarmos esta política de forma importante (por exemplo, um novo uso dos teus dados), avisamos-te na app antes de as alterações se aplicarem, e voltamos a pedir o teu consentimento quando for necessário. A data da última atualização está no topo desta página.',
    },
  ],
};
