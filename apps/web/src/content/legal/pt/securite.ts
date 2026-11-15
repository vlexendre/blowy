import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Segurança e denúncias — Blowy',
  heading: 'Segurança e denúncias',
  description: 'Como denunciar ou bloquear alguém no Blowy, o que acontece a seguir, os nossos conselhos para um primeiro encontro, os números de emergência e a nossa política de proteção de menores.',
  intro: 'Como denunciar, bloquear, proteger-te e a quem ligar em caso de emergência.',
  body: [
    { note: '**Em perigo imediato?** Liga **112** (emergência em toda a União Europeia). Em França: **17** (polícia), ou envia SMS para o **114** se não puderes falar.' },

    { h2: 'Denunciar alguém', id: 'signaler' },
    {
      ol: [
        'Abre o chat com a pessoa, ou a ficha dela nos teus encontros.',
        'Toca no menu («…») e depois em **Denunciar** (num encontro: **Denunciar ou bloquear**). Para uma mensagem concreta, faz um toque longo nela e depois **Denunciar esta mensagem**.',
        'Escolhe o motivo: assédio, conteúdo inapropriado, perfil falso, pessoa menor ou outro.',
        'Acrescenta algumas palavras se quiseres (o que aconteceu, quando). Ajuda-nos a agir depressa.',
        'Podes bloquear a pessoa ao mesmo tempo.',
      ],
    },
    {
      p: 'A pessoa não sabe que a denúncia veio de ti. Não tens a app à mão? Escreve para {{email.safety}} com o nome da pessoa e o que aconteceu.',
    },

    { h2: 'O que acontece a seguir', id: 'suite' },
    {
      ul: [
        'A equipa de moderação é **avisada por e-mail** de cada denúncia: de imediato se for urgente (menor, ameaça), caso contrário num resumo. **Objetivo: uma resposta em 24 horas**; depois disso, a denúncia sobe para o topo da fila.',
        'Um moderador do Blowy lê **a mensagem denunciada e o seu contexto imediato**, e mais nada das tuas conversas.',
        'Consoante a gravidade: retirada do conteúdo, aviso, limitação, suspensão ou encerramento da conta. O que é ilegal pode ser transmitido às autoridades.',
        'Uma conta denunciada como menor por duas pessoas diferentes fica suspensa automaticamente, até o moderador a analisar.',
        'A app confirma-te que a tua denúncia foi enviada. Para proteger a privacidade de todos, não te mantemos informado da sanção.',
      ],
    },

    { h2: 'Bloquear alguém', id: 'bloquer' },
    {
      p: 'No mesmo menu, escolhe **Bloquear**. A pessoa deixa de te poder escrever, a vossa ligação desaparece, e os vossos minimoas não voltam a cruzar-se, nem nos encontros nem no mapa. Ela não é avisada. Encontras as pessoas bloqueadas em **Eu → Definições → Pessoas bloqueadas**, onde as podes desbloquear.',
    },

    { h2: 'As tuas proteções na app', id: 'protections' },
    {
      ul: [
        'A tua posição exata nunca é guardada; no mapa, aparece arredondada a cerca de 300 m e deslocada, nunca em tempo real.',
        'Os nomes, as mensagens e as fotos de perfil passam por um **filtro automático**: o que viola claramente as [regras](@regles) não é publicado, uma mensagem duvidosa é sinalizada à moderação.',
        'Quando uma ligação chega ao nível em que se encontram pessoalmente, a app lembra-te estes conselhos de segurança.',
        'O **modo discreto** retira-te do mapa.',
        'Nada acontece sem o teu acordo: cumprimentas, a outra pessoa aceita, a ligação é criada.',
        'Podes sair de uma ligação a qualquer momento.',
      ],
    },

    { h2: 'Antes de se encontrarem pessoalmente', id: 'rencontre' },
    {
      ul: [
        '**Vai com calma.** Conversem primeiro na app. Alguém que te apressa é um sinal de alerta.',
        '**Um lugar público**, na primeira vez: um café, um parque movimentado. Nem em tua casa, nem na casa da outra pessoa.',
        '**Avisa alguém próximo**: onde, quando, com quem. Combinem uma mensagem a enviar durante ou depois.',
        '**Mantém a tua autonomia**: vai e volta pelos teus próprios meios. Mantém o telemóvel carregado.',
        '**Não dês cedo demais** a tua morada, o teu local de trabalho ou informações privadas.',
        '**Nunca dinheiro.** Ninguém tem uma boa razão para to pedir. Denuncia.',
        '**Atenção à tua bebida**, e ao que consomes.',
        '**Ouve-te**: se algo não bater certo, podes ir embora, sem te justificares.',
      ],
    },
    { p: 'Uma compatibilidade, mesmo elevada, não garante nada sobre uma pessoa. O Blowy não verifica a identidade dos utilizadores.' },

    { h2: 'Números úteis', id: 'urgences' },
    {
      table: {
        head: ['Número', 'Para quê'],
        rows: [
          ['**112**', 'Emergência, a partir de qualquer país da União Europeia'],
          ['**17**', 'Polícia, gendarmaria (França)'],
          ['**15**', 'Emergência médica, SAMU (França)'],
          ['**18**', 'Bombeiros (França)'],
          ['**114**', 'Emergência por SMS, para pessoas surdas, com deficiência auditiva ou que não podem falar (França)'],
          ['**3919**', 'Violência contra as mulheres, gratuito e anónimo (França)'],
          ['**3018**', 'Ciberassédio e violência digital, gratuito e confidencial (França)'],
          ['**119**', 'Crianças em perigo (França)'],
        ],
      },
    },
    {
      p: 'Um conteúdo ilegal na internet também pode ser denunciado na plataforma oficial francesa [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Fora de França, liga 112 ou os números de emergência do teu país.',
    },

    { h2: 'Proteção de menores', id: 'mineurs' },
    {
      p: 'O Blowy é só para adultos com 18 anos ou mais. A data de nascimento é pedida antes do início de sessão; com menos de 18 anos, o registo para e nada é criado.',
    },
    {
      p: '**Tolerância zero** para qualquer conteúdo ou comportamento que sexualize ou ponha em perigo um menor. Assim que tomamos conhecimento: o conteúdo é retirado, a conta é encerrada definitivamente e os factos são denunciados às autoridades competentes.',
    },
    {
      ul: [
        'Na app: **Denunciar**, motivo «Pessoa menor».',
        'Por e-mail: {{email.safety}}.',
        'Em França, também podes denunciar em [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), ou ligar **119** se uma criança estiver em perigo.',
      ],
    },
    { p: 'Para saber mais: [regras da comunidade](@regles), [termos de utilização](@conditions#moderation).' },
  ],
};
