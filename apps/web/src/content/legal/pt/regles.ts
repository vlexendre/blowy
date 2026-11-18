import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Regras da comunidade — Minimoa',
  heading: 'Regras da comunidade',
  description: 'As regras do Minimoa: respeito, consentimento, nada de assédio, nada de menores de idade, nada de conteúdo sexual. O que acontece se elas não forem respeitadas.',
  intro: 'Minimoas, e humanos de verdade por trás deles. Para continuar sendo um lugar onde dá vontade de voltar, algumas regras simples.',
  body: [
    { h2: 'Respeite as pessoas', id: 'respect' },
    {
      p: 'Por trás de cada minimoa existe uma pessoa de verdade. Humor, sim; humilhação, não. Dá para discordar sem magoar.',
    },

    { h2: 'Não é não', id: 'consentement' },
    {
      p: 'Se alguém não responde, não cumprimenta de volta, sai de um vínculo ou te bloqueia, é escolha dessa pessoa. Não fique insistindo, não crie outra conta para contornar uma recusa e não vá procurar a pessoa em outro lugar.',
    },

    { h2: 'Nada de assédio nem de ódio', id: 'harcelement' },
    {
      p: 'Proibido: insultos, ameaças, chantagem, mensagens repetidas e indesejadas, piadas sobre a aparência, a origem, a religião, o gênero, a orientação sexual ou a deficiência, incitação ao ódio ou à violência.',
    },

    { h2: '18 anos ou mais, sem exceção', id: 'majeurs' },
    {
      p: 'O Minimoa é só para adultos. Toda conta de uma pessoa menor de idade é excluída. Todo conteúdo que sexualize um menor de idade é removido, o autor é banido, e comunicamos o caso às autoridades. Se você acha que está falando com uma pessoa menor de idade, denuncie com o motivo “Pessoa menor de idade”.',
    },

    { h2: 'Nada de nudez nem de conteúdo sexual', id: 'contenus' },
    {
      p: 'Nem nas mensagens, nem na foto de perfil, nem na foto de prova. Nada de conteúdo violento, chocante ou ilegal também. Uma foto de prova é o seu tênis, o seu livro, o seu prato: não você em trajes mínimos.',
    },

    { h2: 'Seja você', id: 'authenticite' },
    {
      p: 'Uma conta por pessoa, para uma pessoa de verdade. Nada de perfil falso, nada de se passar por outra pessoa. E nada de trapaça: nada de foto de prova falsa, nada de localização falsificada.',
    },

    { h2: 'Nada de golpe nem de comércio', id: 'arnaques' },
    {
      p: 'Ninguém pede dinheiro, presentes ou códigos. Nada de propaganda, nada de spam, nada de links suspeitos, nada de serviços sexuais pagos. Alguém te pediu dinheiro? Denuncie.',
    },

    { h2: 'Proteja a privacidade dos outros', id: 'vie-privee' },
    {
      p: 'Não compartilhe o endereço, o número, as fotos ou as mensagens de alguém sem o consentimento da pessoa. O que é dito num vínculo fica no vínculo.',
    },

    { h2: 'O que acontece se uma regra não for respeitada', id: 'sanctions' },
    {
      p: 'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um **filtro automático**: o que viola claramente estas regras não é publicado, e o app diz por quê; uma mensagem no limite (um insulto, por exemplo) é enviada, mas é sinalizada à equipe de moderação. Cada denúncia, de uma pessoa ou do filtro, avisa a equipe, que a analisa com o objetivo de responder em até 24 h. Um moderador pode ler a mensagem denunciada e o contexto imediato dela, nada além disso. Dependendo da gravidade:',
    },
    {
      ol: [
        'o conteúdo é removido;',
        'a pessoa recebe uma advertência;',
        'algumas funções são limitadas, ou a conta é suspensa;',
        'a conta é encerrada definitivamente, já na primeira vez para o que é grave (menores de idade, ameaças, violência, golpes).',
      ],
    },
    {
      p: 'Dois casos suspendem uma conta automaticamente, por no máximo 72 h, enquanto um moderador analisa: vocabulário pedocriminoso explícito numa mensagem, ou uma conta denunciada como menor de idade por duas pessoas diferentes. O que é ilegal pode ser comunicado às autoridades. A pessoa envolvida recebe os motivos da decisão e pode contestá-la, seja automática ou não ([termos de uso](@conditions#moderation)).',
    },

    { h2: 'Denunciar e bloquear', id: 'signaler' },
    {
      p: 'Num chat ou num encontro, abra o menu e escolha **Denunciar** ou **Bloquear**; num chat, tocar e segurar uma mensagem também permite denunciá-la. A pessoa não sabe quem a denunciou e não é avisada de um bloqueio. Tudo está explicado em [segurança e denúncias](@securite).',
    },
    {
      p: 'Estas regras fazem parte dos [termos de uso](@conditions). Uma pergunta, uma dúvida: {{email.support}}. Quem responde é um humano, não um minimoa.',
    },
  ],
};
