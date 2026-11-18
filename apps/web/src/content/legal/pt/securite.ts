import type { LegalPage } from '../types';

export const securite: LegalPage = {
  title: 'Segurança e denúncias — Minimoa',
  heading: 'Segurança e denúncias',
  description: 'Como denunciar ou bloquear alguém no Minimoa, o que acontece depois, dicas para um primeiro encontro, números de emergência e proteção de menores.',
  intro: 'Como denunciar, bloquear, se proteger, e para quem ligar numa emergência.',
  body: [
    { note: '**Em perigo imediato?** Ligue **17** (polícia) ou **112** (emergências, em qualquer lugar da União Europeia). Por SMS, se você não puder falar: **114**.' },

    { h2: 'Denunciar alguém', id: 'signaler' },
    {
      ol: [
        'Abra o chat com a pessoa, ou o perfil dela nos seus encontros.',
        'Toque no menu (“…”) e depois em **Denunciar** (num encontro: **Denunciar ou bloquear**). Para uma mensagem específica, toque e segure nela e depois toque em **Denunciar esta mensagem**.',
        'Escolha o motivo: assédio, conteúdo impróprio, perfil falso, pessoa menor de idade, ou outro.',
        'Acrescente algumas palavras se quiser (o que aconteceu, quando). Isso nos ajuda a agir rápido.',
        'Você pode bloquear a pessoa ao mesmo tempo.',
      ],
    },
    {
      p: 'A pessoa não fica sabendo que a denúncia veio de você. Está sem o app à mão? Escreva para {{email.safety}} com o nome da pessoa e o que aconteceu.',
    },

    { h2: 'O que acontece depois', id: 'suite' },
    {
      ul: [
        'A equipe de moderação é **avisada por e-mail** de cada denúncia: na hora quando é urgente (pessoa menor de idade, ameaça), senão num resumo. **Objetivo: uma resposta em até 24 h**; passado esse prazo, a denúncia sobe para o topo da fila.',
        'Um moderador do Minimoa lê **a mensagem denunciada e o contexto imediato dela**, e nada mais das suas conversas.',
        'Dependendo da gravidade: remoção do conteúdo, advertência, limitação, suspensão ou encerramento da conta. O que é ilegal pode ser comunicado às autoridades.',
        'Uma conta denunciada como menor de idade por duas pessoas diferentes é suspensa automaticamente, enquanto aguarda o moderador.',
        'O app confirma que a sua denúncia foi enviada. Para proteger a privacidade de todos, não te informamos sobre a sanção.',
      ],
    },

    { h2: 'Bloquear alguém', id: 'bloquer' },
    {
      p: 'No mesmo menu, escolha **Bloquear**. A pessoa não pode mais te escrever, o vínculo de vocês desaparece, e os minimoas de vocês não vão mais se cruzar, nem em encontros nem no mapa. Ela não é avisada. Você encontra as pessoas bloqueadas em **Eu → Ajustes → Pessoas bloqueadas**, onde pode desbloqueá-las.',
    },

    { h2: 'Suas proteções no app', id: 'protections' },
    {
      ul: [
        'Sua localização exata nunca é registrada; no mapa, ela é arredondada para cerca de 300 m e deslocada, nunca em tempo real.',
        'Os nomes, as mensagens e as fotos de perfil passam por um **filtro automático**: o que viola claramente as [regras](@regles) não é publicado, e uma mensagem no limite é sinalizada à moderação.',
        'Quando um vínculo chega ao nível em que vocês se encontram pessoalmente, o app te lembra destas dicas de segurança.',
        'O **modo discreto** tira você do mapa.',
        'Nada acontece sem a sua concordância: você cumprimenta, a outra pessoa aceita, o vínculo é criado.',
        'Você pode sair de um vínculo a qualquer momento.',
      ],
    },

    { h2: 'Antes de se encontrar pessoalmente', id: 'rencontre' },
    {
      ul: [
        '**Vá com calma.** Converse primeiro pelo app. Alguém que te apressa é um sinal de alerta.',
        '**Lugar público**, na primeira vez: um café, um parque movimentado. Nem na sua casa, nem na casa da outra pessoa.',
        '**Avise alguém próximo**: onde, quando, com quem. Combinem uma mensagem para mandar durante ou depois.',
        '**Mantenha sua autonomia**: vá e volte por conta própria. Deixe o celular carregado.',
        '**Não passe rápido demais** seu endereço, seu local de trabalho ou suas informações privadas.',
        '**Dinheiro, nunca.** Ninguém tem um bom motivo para te pedir. Denuncie.',
        '**Fique de olho no seu copo**, e no que você consome.',
        '**Confie em você**: se algo parecer errado, você pode ir embora, sem se justificar.',
      ],
    },
    {
      p: 'Uma compatibilidade, mesmo alta, não garante nada sobre uma pessoa. O Minimoa não verifica a identidade dos usuários.',
    },

    { h2: 'Números úteis', id: 'urgences' },
    {
      table: {
        head: ['Número', 'Para quê'],
        rows: [
          ['**112**', 'Emergências, de qualquer país da União Europeia'],
          ['**17**', 'Polícia, gendarmaria (França)'],
          ['**15**', 'Emergência médica, Samu (França)'],
          ['**18**', 'Bombeiros (França)'],
          ['**114**', 'Emergências por SMS, para pessoas surdas, com deficiência auditiva ou que não podem falar (França)'],
          ['**3919**', 'Violência contra a mulher, gratuito e anônimo (França)'],
          ['**3018**', 'Cyberbullying e violência digital, gratuito e confidencial (França)'],
          ['**119**', 'Crianças em perigo (França)'],
        ],
      },
    },
    {
      p: 'Um conteúdo ilegal on-line também pode ser denunciado na plataforma oficial [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr). Fora da França, ligue 112 ou para os números de emergência do seu país.',
    },

    { h2: 'Proteção de menores de idade', id: 'mineurs' },
    {
      p: 'O Minimoa é só para adultos com 18 anos ou mais. A data de nascimento é pedida antes do login; abaixo de 18 anos, o cadastro é interrompido e nada é criado.',
    },
    {
      p: '**Tolerância zero** para qualquer conteúdo ou comportamento que sexualize ou coloque em perigo um menor de idade. Assim que ficamos sabendo: o conteúdo é removido, a conta é encerrada definitivamente, e os fatos são comunicados às autoridades competentes.',
    },
    {
      ul: [
        'No app: **Denunciar**, motivo “Pessoa menor de idade”.',
        'Por e-mail: {{email.safety}}.',
        'Na França, você também pode denunciar em [internet-signalement.gouv.fr](https://www.internet-signalement.gouv.fr), ou ligar **119** se uma criança estiver em perigo.',
      ],
    },
    {
      p: 'Para saber mais: [regras da comunidade](@regles), [termos de uso](@conditions#moderation).',
    },
  ],
};
