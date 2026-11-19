import type { SeedTexts } from './texts';

/** Português do Brasil, com « você » (como o app). */
export const pt: SeedTexts = {
  units: {
    vision: ['Sua visão da vida', 'O que você quer para o futuro.'],
    energie: ['Sua energia', 'O que te recarrega, o que te anima.'],
    habitudes: ['Seus hábitos', 'Seu dia a dia, sem filtro.'],
    valeurs: ['O que importa para você', 'O que você não largaria por nada.'],
    autres: ['Você e os outros', 'Seus amigos, sua gente e os novos.'],
    gouts: ['Seus gostos', 'O que te dá vontade.'],
  },
  steps: {
    vision_1: 'As grandes escolhas',
    vision_2: 'Sua casa, seu ritmo',
    energie_1: 'Recarregar as baterias',
    energie_2: 'Pronto num segundo',
    habitudes_1: 'Organizado ou não',
    habitudes_2: 'Seus dias',
    valeurs_1: 'Suas prioridades',
    valeurs_2: 'Aqui ou em outro lugar',
    autres_1: 'Seus amigos',
    autres_2: 'Sua gente',
    gouts_1: 'Descobrir',
    gouts_2: 'Seus prazeres',
  },
  legacy: {
    dimanche: { o: 'Pergunte como é o domingo perfeito dessa pessoa.', r: ['Manta e série: vou me ajeitar do seu lado.', 'Pego meu cachecol, vamos!'] },
    enfants: { o: 'Pergunte como são os almoços de domingo dessa pessoa.', r: ['Vai precisar de uma mesa maior.', 'O brunch é sagrado.'] },
    mutation: { o: 'Pergunte para qual país essa pessoa iria amanhã.', r: ['Vou me esconder numa caixa.', 'Aqui é a sua casa.'] },
    heritage: { o: 'Pergunte o que essa pessoa faria com 10 000 €.', r: ['Seu cofrinho agradece.', 'Lembranças não se perdem.'] },
    promotion: { o: 'Pergunte qual projeto ocupa essa pessoa agora.', r: ['Vai fundo, eu cuido da casa.', 'Suas noites estão garantidas.'] },
    vacances: { o: 'Pergunte quais foram as melhores férias dessa pessoa.', r: ['Aventura de verdade.', 'Que planejamento lindo.'] },
    appartement: { o: 'Pergunte como é a casa dos sonhos dessa pessoa.', r: ['Um ninho, eu adoro ninhos.', 'Leve como uma pena.'] },
    vendredi: { o: 'Pergunte qual foi a melhor sexta à noite dessa pessoa.', r: ['A noite é uma criança!', 'Boa noite, até amanhã.'] },
    cinq_ans: { o: 'Pergunte onde essa pessoa se vê daqui a cinco anos.', r: ['Perto dos seus, isso não tem preço.', 'Me mande um cartão-postal.'] },
    projet: { o: 'Pergunte qual projeto é mais especial para essa pessoa.', r: ['Que paixão!', 'Aproveitar primeiro, decisão sábia.'] },
  },
  q: {
    energie_batterie: {
      t: 'Depois de uma semana cheia, você recarrega as baterias…',
      o: 'Pergunte como essa pessoa recarrega as baterias.',
      a: [
        ['Na calma, em casa', 'Manta aprovada. Vou fazer um chá.'],
        ['Com muita gente em volta', 'Vou avisar a turma!'],
      ],
      m: 'Um pouco de cada: a dose certa.',
    },
    energie_samedi: {
      t: 'Sábado de manhã, nada planejado.',
      o: 'Pergunte como é a manhã de sábado ideal dessa pessoa.',
      a: [
        ['Café sem pressa na janela, mais nada', 'O luxo absoluto: não fazer nada.'],
        ['Saio e vejo aonde vou parar', 'Pego meu cachecol e vou junto.'],
        ['Um brunch com os amigos', 'Guarda um pão de queijo para mim.'],
      ],
    },
    energie_soiree: {
      t: 'Uma festa em que você só conhece quem convidou.',
      o: 'Pergunte qual foi a melhor ou a pior festa com desconhecidos dessa pessoa.',
      a: [
        ['Eu vou, adoro conhecer gente', 'Você vai voltar com dez contatos novos.'],
        ['Vou se puder levar alguém', 'Em dupla, boa ideia.'],
        ['Passo, hoje é noite de sofá', 'O sofá agradece.'],
      ],
    },
    energie_pluie: {
      t: 'Domingo, está chovendo muito. Você…',
      o: 'Pergunte o que essa pessoa faz quando chove o fim de semana inteiro.',
      a: [
        ['Avança num projeto pessoal', 'Aqui se trabalha duro.'],
        ['Se perde num livro ou numa série', 'Mais um episódio, não conto para ninguém.'],
        ['Cozinha algo complicado, por prazer', 'Quando eu provo?'],
      ],
    },
    energie_semaine: {
      t: 'Sua semana ideal é mais…',
      o: 'Pergunte como é a semana ideal dessa pessoa.',
      a: [
        ['Tranquila, com tempo para mim', 'Cochilar é uma arte.'],
        ['Cheia de coisas andando', 'Motor ligado!'],
      ],
      m: 'Nem correria nem cochilo: equilíbrio.',
    },
    energie_vacances: {
      t: 'Nas férias, seu dia perfeito…',
      o: 'Pergunte como é o dia de férias perfeito dessa pessoa.',
      a: [
        ['Espreguiçadeira, livro, mais nada', 'Eu guardo sua toalha.'],
        ['Trilha de madrugada, passeio à tarde', 'Minhas patas já doem.'],
        ['Praia de dia, festa à noite', 'Quando você dorme?'],
      ],
    },
    energie_ce_soir: {
      t: '19 h, uma mensagem: “Bora fazer algo hoje?”',
      o: 'Pergunte quando foi a última vez que essa pessoa topou um plano de última hora.',
      a: [
        ['Bora! Onde a gente se encontra?', 'Já está de sapato.'],
        ['Depende do quê', 'Cautela de gato.'],
        ['Hoje não, estou no modo pijama', 'O pijama venceu.'],
      ],
    },
    energie_semi: {
      t: 'Te chamam para correr uma meia maratona daqui a seis meses.',
      o: 'Pergunte qual desafio esportivo atrai essa pessoa.',
      a: [
        ['Me inscrevo, isso me motiva', 'Eu faço o cartaz.'],
        ['Talvez, se formos em grupo', 'Em turma tudo fica mais fácil.'],
        ['Vou torcer por você com um croissant', 'O melhor posto, sinceramente.'],
      ],
    },
    energie_cafe: {
      t: 'Seu café preferido é…',
      o: 'Pergunte qual é o café ou bar preferido dessa pessoa no bairro.',
      a: [
        ['Uma salinha calma, com livros', 'Psiu, estou lendo por cima do seu ombro.'],
        ['Um lugar animado, música, gente passando', 'Tem movimento, eu gosto.'],
      ],
    },
    energie_cinq_ans: {
      t: 'Daqui a cinco anos, no trabalho ou nos seus projetos, você quer…',
      o: 'Pergunte onde estarão os projetos dessa pessoa daqui a cinco anos.',
      a: [
        ['Que tudo flua tranquilo', 'Tranquilo, mas firme.'],
        ['Ter subido de nível', 'Já estou vendo o topo.'],
      ],
      m: 'Avançar sem se esgotar: é um plano.',
    },
    habitudes_courses: {
      t: 'As compras da semana…',
      o: 'Pergunte o que essa pessoa não resiste em comprar.',
      a: [
        ['Lista por corredor, nada fica de fora', 'Faz a minha também?'],
        ['Improviso nos corredores', 'E sai com três tipos de queijo.'],
        ['Entregues, planejadas desde domingo', 'Eficiente. Anotado.'],
      ],
    },
    habitudes_valise: {
      t: 'Sua mala, você faz…',
      o: 'Pergunte o que essa pessoa sempre esquece numa viagem.',
      a: [
        ['Três dias antes, com uma lista', 'Sua lista deve ter uma lista.'],
        ['Na noite anterior', 'O grande clássico.'],
        ['Uma hora antes de sair', 'Lembrou das meias?'],
      ],
    },
    habitudes_budget: {
      t: 'Seu dinheiro, você administra…',
      o: 'Pergunte qual foi a melhor extravagância, ou a melhor economia, dessa pessoa.',
      a: [
        ['No feeling', 'Viver o momento também é um orçamento.'],
        ['Centavo por centavo', 'Planilha aberta, respeito.'],
      ],
      m: 'De olho, sem estresse.',
    },
    habitudes_dimanche_soir: {
      t: 'Domingo à noite, você…',
      o: 'Pergunte qual é o ritual de domingo à noite dessa pessoa.',
      a: [
        ['Prepara a semana', 'A segunda que se cuide.'],
        ['Aproveita até o último minuto', 'A segunda pode esperar.'],
      ],
    },
    habitudes_rdv: {
      t: 'Um compromisso às 20 h. Você chega…',
      o: 'Pergunte qual é a melhor desculpa de atraso dessa pessoa.',
      a: [
        ['Às 19h50, sempre um pouco antes', 'Ninguém chega antes de você.'],
        ['Às 20 h em ponto', 'Precisão suíça.'],
        ['Às 20h15, com uma boa desculpa', 'Adoro suas desculpas.'],
      ],
    },
    habitudes_diner: {
      t: 'Hoje à noite, a gente come…',
      o: 'Pergunte qual é o prato que essa pessoa faz melhor.',
      a: [
        ['Em casa, eu cozinho', 'O cheiro chega até aqui.'],
        ['Fora, quero ver gente', 'Reservo uma mesa para quatro patas.'],
        ['Delivery, no sofá', 'O melhor dos dois mundos.'],
      ],
    },
    habitudes_week_end: {
      t: 'Seu fim de semana ideal é…',
      o: 'Pergunte o que essa pessoa planejou para o fim de semana. Ou não.',
      a: [
        ['Totalmente livre', 'O acaso faz bem as coisas.'],
        ['Planejado com antecedência', 'Que planejamento lindo.'],
      ],
      m: 'Um plano, mas não demais.',
    },
    habitudes_bureau: {
      t: 'Sua mesa de trabalho, agora…',
      o: 'Pergunte qual é o objeto mais improvável na mesa dessa pessoa.',
      a: [
        ['Cada coisa no seu lugar', 'Nem ouso tocar em nada.'],
        ['Uma bagunça feliz, mas sei onde está tudo', 'Um sistema, de verdade.'],
      ],
    },
    habitudes_matin: {
      t: 'De manhã, seu primeiro reflexo…',
      o: 'Pergunte como é a manhã perfeita dessa pessoa.',
      a: [
        ['Pensar em tudo o que vou fazer', 'Lista mental carregando.'],
        ['Um café, em silêncio, sem planos', 'Primeiro o café, depois o mundo.'],
      ],
    },
    habitudes_bouger: {
      t: 'Para se mexer, você prefere…',
      o: 'Pergunte qual esporte essa pessoa gostaria de experimentar.',
      a: [
        ['Ioga ou caminhada, tranquilo', 'Respira. Eu respiro com você.'],
        ['Um esporte em equipe', 'Eu sou o mascote.'],
        ['Me mexer? Vou até a geladeira', 'É cardio, se for correndo.'],
      ],
    },
    valeurs_racines: {
      t: 'O lugar onde você cresceu é, para você…',
      o: 'Pergunte do que essa pessoa mais sente falta do lugar onde cresceu.',
      a: [
        ['Meu porto seguro, volto sempre', 'Nada como a nossa casa.'],
        ['Uma boa lembrança, minha vida é em outro lugar', 'Sempre um passo além.'],
      ],
    },
    valeurs_temps_argent: {
      t: 'Mais tempo livre ou mais dinheiro?',
      o: 'Pergunte o que essa pessoa faria com um dia de folga a mais por semana.',
      a: [
        ['Mais tempo', 'Tempo, a verdadeira riqueza.'],
        ['Mais dinheiro', 'Me paga um lanche?'],
      ],
      m: 'Um pouco de cada, sensato.',
    },
    valeurs_repas: {
      t: 'Os grandes almoços de família…',
      o: 'Pergunte qual prato da infância essa pessoa ainda adora.',
      a: [
        ['Sagrados, nunca perco', 'Eu levo a sobremesa.'],
        ['Gosto, mas do meu jeito', 'Tradições, versão você.'],
        ['Prefiro as festas com os amigos', 'A família que a gente escolhe.'],
      ],
    },
    valeurs_demenagement: {
      t: 'Um amigo vai se mudar no sábado, às 8 h.',
      o: 'Pergunte qual foi a melhor ou a pior mudança dessa pessoa.',
      a: [
        ['Levo as caixas e os croissants', 'Coração de ouro, certificado.'],
        ['Passo à noite para a pizza', 'A pizza, a melhor parte.'],
        ['Empresto o carro, não as costas', 'Suas costas agradecem.'],
      ],
    },
    valeurs_reussite: {
      t: 'Para você, uma vida bem vivida é antes de tudo…',
      o: 'Pergunte do que essa pessoa se orgulha agora.',
      a: [
        ['Ter construído algo', 'Já te vejo com uma estátua.'],
        ['Tempo para o que eu gosto', 'Sábio. Muito sábio.'],
        ['Gente que eu amo por perto', 'O maior dos tesouros.'],
      ],
    },
    valeurs_etranger: {
      t: 'Morar um ano fora do país, agora mesmo?',
      o: 'Pergunte em qual cidade essa pessoa moraria por um ano.',
      a: [
        ['Não, obrigado, estou bem aqui', 'Aqui é a sua casa.'],
        ['Parto amanhã', 'Vou me esconder na sua mala.'],
      ],
      m: 'Por que não… um dia.',
    },
    valeurs_chez_toi: {
      t: 'Sua casa ideal é…',
      o: 'Pergunte qual é o cômodo preferido da casa dessa pessoa.',
      a: [
        ['Um ninho onde sempre passa gente', 'Já reservei o sofá.'],
        ['Um lugar só meu, calmo, com minhas regras', 'Seu reino, suas regras.'],
        ['Nenhum lugar fixo: onde eu estiver', 'Nômade de alma.'],
      ],
    },
    valeurs_occasion: {
      t: 'Uma grande oportunidade, mas é preciso decidir em uma hora.',
      o: 'Pergunte qual foi a melhor decisão que essa pessoa tomou por impulso.',
      a: [
        ['Eu vou', 'Que emoção!'],
        ['Peço um tempo para pensar', 'Pensar já é agir.'],
      ],
    },
    valeurs_dix_ans: {
      t: 'Daqui a dez anos, você se vê…',
      o: 'Pergunte como seria um dia incrível daqui a dez anos.',
      a: [
        ['Com uma grande tribo em volta', 'Vai precisar de uma mesa enorme.'],
        ['Livre como o vento, sem amarras', 'O vento no pelo.'],
        ['Não faço ideia, e tudo bem', 'O futuro é uma surpresa.'],
      ],
    },
    valeurs_boulot: {
      t: 'Seu trabalho ideal é mais…',
      o: 'Pergunte o que essa pessoa sonhava ser quando criança.',
      a: [
        ['Estável, sei para onde vou', 'Firme como uma rocha.'],
        ['Variado, cheio de surpresas', 'Montanha-russa combina com você.'],
      ],
      m: 'Firme, com uma pitada de pimenta.',
    },
    autres_silence: {
      t: 'Alguém de quem você gosta não responde há dois dias.',
      o: 'Pergunte qual foi a melhor mensagem que essa pessoa já recebeu.',
      a: [
        ['Tudo bem, cada um no seu ritmo', 'Zen total.'],
        ['Mando uma mensagem engraçada', 'O meme perfeito existe.'],
        ['Fico pensando se falei algo', 'Com certeza não. Respira.'],
      ],
    },
    autres_bande: {
      t: 'Seus amigos são mais…',
      o: 'Pergunte como essa pessoa conheceu os melhores amigos.',
      a: [
        ['Uma turma grande, sempre tem gente', 'Quero entrar no grupo.'],
        ['Dois ou três, mas para a vida toda', 'Poucos, mas de verdade.'],
      ],
    },
    autres_improviste: {
      t: 'Amigos aparecem na sua casa sem avisar.',
      o: 'Pergunte o que essa pessoa serve quando recebe visitas de surpresa.',
      a: [
        ['Que ótimo, vou pegar os copos', 'A porta está sempre aberta!'],
        ['Adoro, mas avisem da próxima vez', 'Uma mensagem não custa nada.'],
      ],
    },
    autres_anniversaire: {
      t: 'No seu aniversário, você sonha com…',
      o: 'Pergunte qual foi o aniversário mais bonito dessa pessoa.',
      a: [
        ['Uma festa enorme, todo mundo convidado', 'Eu levo os confetes.'],
        ['Um jantar com algumas pessoas próximas', 'Poucos, mas que momento.'],
        ['Que esqueçam um pouco, sinceramente', 'Boca fechada. Não vi nada.'],
      ],
    },
    autres_conseil: {
      t: 'Um amigo pede seu conselho sobre uma grande decisão.',
      o: 'Pergunte qual foi o melhor conselho que essa pessoa já recebeu.',
      a: [
        ['Fazemos a lista de prós e contras', 'A lista, arma absoluta.'],
        ['Siga sua intuição', 'O instinto sempre tem razão.'],
        ['Conversamos com uma pizza', 'Pizza ajuda a pensar, está provado.'],
      ],
    },
    autres_rencontrer: {
      t: 'Conhecer pessoas novas, para você, é…',
      o: 'Pergunte qual foi o encontro mais inesperado da vida dessa pessoa.',
      a: [
        ['Intimidador', 'Fica tranquilo, eu faço as apresentações.'],
        ['Empolgante', 'Você vai adorar o que estamos preparando.'],
      ],
      m: 'Depende do dia, é normal.',
    },
    autres_proches: {
      t: 'Com a sua gente, você precisa…',
      o: 'Pergunte como essa pessoa mantém contato com a família e os amigos.',
      a: [
        ['De muito espaço', 'Ar, ar!'],
        ['De muita presença', 'Abraço de minimoa conta?'],
      ],
      m: 'Perto, mas sem grudar.',
    },
    autres_vacances: {
      t: 'Férias com amigos: quem organiza?',
      o: 'Pergunte quais foram as melhores férias com amigos dessa pessoa.',
      a: [
        ['Eu, com uma planilha compartilhada', 'Tem uma aba de “imprevistos”?'],
        ['Eu dou uma mão', 'O braço direito ideal.'],
        ['Os outros, eu vou na onda', 'Você traz o bom humor.'],
      ],
    },
    autres_voisins: {
      t: 'Seus vizinhos…',
      o: 'Pergunte qual é o cantinho secreto do bairro dessa pessoa.',
      a: [
        ['Sei o nome deles e o do gato', 'O bairro é família.'],
        ['Um oi educado na escada', 'Cortês e discreto.'],
        ['Existem vizinhos?', 'Um mistério a resolver.'],
      ],
    },
    autres_annule: {
      t: 'Um plano é cancelado em cima da hora.',
      o: 'Pergunte o que essa pessoa faz com uma noite livre inesperada.',
      a: [
        ['Oba, uma noite livre', 'O melhor dos presentes.'],
        ['Fico irritado, tinha tudo planejado', 'Sua agenda está chorando um pouco.'],
      ],
    },
    gouts_voyage: {
      t: 'Sua viagem dos sonhos…',
      o: 'Pergunte qual é a viagem dos sonhos dessa pessoa.',
      a: [
        ['Um país cuja língua eu não falo', 'Vou revisar meu dicionário.'],
        ['Uma casa no campo, com amigos', 'A felicidade a duas horas daqui.'],
        ['Uma cidade grande, museus e bares', 'Pego o mapa do metrô.'],
      ],
    },
    gouts_resto: {
      t: 'No restaurante, você pede…',
      o: 'Pergunte qual foi o prato mais estranho que essa pessoa já provou.',
      a: [
        ['O prato que não conheço', 'Paladar aventureiro!'],
        ['Meu prato preferido, sempre o mesmo', 'Para que mudar o que funciona?'],
      ],
    },
    gouts_musique: {
      t: 'Música hoje à noite, mais para…',
      o: 'Pergunte qual música essa pessoa está ouvindo sem parar.',
      a: [
        ['Um álbum inteiro, de fone', 'Viagem sonora, não perturbe.'],
        ['Um show, na primeira fila', 'Grito a letra com você.'],
        ['Um barzinho com uma banda local', 'As melhores descobertas.'],
      ],
    },
    gouts_nature_ville: {
      t: 'Para morar, você prefere…',
      o: 'Pergunte qual é o cantinho de natureza, ou de cidade, preferido dessa pessoa.',
      a: [
        ['A natureza, o silêncio', 'Os passarinhos dão bom dia.'],
        ['A cidade, a energia', 'Neon também é bonito.'],
      ],
      m: 'Uma cidade com um parque grande?',
    },
    gouts_nouveau: {
      t: 'Experimentar coisas novas…',
      o: 'Pergunte qual foi a última coisa que essa pessoa fez pela primeira vez.',
      a: [
        ['Prefiro o que eu já conheço', 'O certo é reconfortante.'],
        ['Adoro, quanto mais estranho melhor', 'Achei uma aula de trapézio para você.'],
      ],
      m: 'De vez em quando, sim.',
    },
    gouts_film: {
      t: 'Um filme hoje à noite?',
      o: 'Pergunte qual filme essa pessoa veria cem vezes.',
      a: [
        ['Um clássico que já vi dez vezes', 'Você sabe as falas de cor.'],
        ['Uma joia legendada de que ninguém fala', 'Que refinado! Levo a pipoca.'],
        ['O filmão do momento', 'Emoção garantida.'],
      ],
    },
    gouts_fin_week_end: {
      t: 'Um fim de semana perfeito termina…',
      o: 'Pergunte qual foi o domingo à noite mais bonito dessa pessoa.',
      a: [
        ['Num lugar que eu não conhecia', 'Explorar é a sua praia.'],
        ['Em casa, com uma comida boa', 'Nada como o seu chinelo.'],
      ],
    },
    gouts_temps_libre: {
      t: 'Seu tempo livre é mais…',
      o: 'Pergunte o que essa pessoa está aprendendo agora.',
      a: [
        ['Hobbies por prazer, sem meta', 'O prazer basta.'],
        ['Coisas em que eu evoluo (uma língua, um instrumento)', 'Logo imbatível.'],
      ],
    },
    gouts_saison: {
      t: 'Sua estação preferida…',
      o: 'Pergunte qual é a melhor lembrança da estação preferida dessa pessoa.',
      a: [
        ['O inverno: manta, sopa, velas', 'A manta é sua.'],
        ['O verão: bares até meia-noite', 'Noites longas, sim!'],
        ['O outono: passeios e folhas secas', 'Estala debaixo das patas.'],
        ['A primavera: tudo recomeça', 'O grande despertar.'],
      ],
    },
    gouts_surprise: {
      t: 'Você ganha um fim de semana surpresa: não sabe para onde vai.',
      o: 'Pergunte qual foi a melhor surpresa que essa pessoa já recebeu.',
      a: [
        ['Um sonho', 'Mala pronta em cinco minutos.'],
        ['Queria pelo menos saber o que levar', 'Levar um casaco é sabedoria.'],
      ],
    },
  },
};
