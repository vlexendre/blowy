import type { LegalPage } from '../types';

export const regles: LegalPage = {
  title: 'Regras da comunidade — Blowy',
  heading: 'Regras da comunidade',
  description: 'As regras do Blowy: respeito, consentimento, nada de assédio, nada de menores, nada de conteúdo sexual. O que acontece se não forem respeitadas.',
  intro: 'Minimoas, e humanos de verdade por trás. Para que continue a ser um sítio a que apetece voltar, algumas regras simples.',
  body: [
    { h2: 'Respeita as pessoas', id: 'respect' },
    { p: 'Por trás de cada minimoa há uma pessoa real. Humor, sim; humilhação, não. Pode-se discordar sem magoar.' },

    { h2: 'Não é não', id: 'consentement' },
    {
      p: 'Se alguém não responde, não te cumprimenta de volta, sai de uma ligação ou te bloqueia, é escolha dessa pessoa. Não se insiste sem parar, não se cria outra conta para contornar uma recusa, e não se procura a pessoa noutro lado.',
    },

    { h2: 'Nada de assédio nem de ódio', id: 'harcelement' },
    {
      p: 'Proibido: insultos, ameaças, chantagem, mensagens repetidas não desejadas, troça sobre o físico, a origem, a religião, o género, a orientação sexual ou a deficiência, apelos ao ódio ou à violência.',
    },

    { h2: '18 anos ou mais, sem exceção', id: 'majeurs' },
    {
      p: 'O Blowy é só para adultos. Qualquer conta de uma pessoa menor é eliminada. Qualquer conteúdo que sexualize um menor é retirado, o seu autor é excluído e denunciamo-lo às autoridades. Se achares que estás a falar com uma pessoa menor, denuncia-a com o motivo «Pessoa menor».',
    },

    { h2: 'Nada de nudez nem de conteúdo sexual', id: 'contenus' },
    {
      p: 'Nem nas mensagens, nem na foto de perfil, nem na foto de prova. Também nada de conteúdo violento, chocante ou ilegal. Uma foto de prova são as tuas sapatilhas, o teu livro, o teu prato: não tu em roupa interior.',
    },

    { h2: 'Sê tu', id: 'authenticite' },
    { p: 'Uma conta por pessoa, para uma pessoa real. Nada de perfis falsos, nada de usurpação de identidade. E nada de batota: nada de fotos de prova falsas nem de localização falsificada.' },

    { h2: 'Nada de burlas nem de comércio', id: 'arnaques' },
    {
      p: 'Não se pede dinheiro, presentes nem códigos. Nada de publicidade, spam, ligações duvidosas ou serviços sexuais pagos. Alguém te pede dinheiro? Denuncia.',
    },

    { h2: 'Protege a privacidade dos outros', id: 'vie-privee' },
    { p: 'Não partilhes a morada, o número, as fotos ou as mensagens de alguém sem o seu consentimento. O que se diz numa ligação fica na ligação.' },

    { h2: 'O que acontece se uma regra não for respeitada', id: 'sanctions' },
    {
      p: 'Os nomes, os nomes de minimoa, as mensagens e as fotos de perfil passam por um **filtro automático**: o que viola claramente estas regras não é publicado, e a app diz porquê; uma mensagem duvidosa (um insulto, por exemplo) é enviada, mas sinalizada à equipa de moderação. Cada denúncia, de uma pessoa ou do filtro, avisa a equipa, que a analisa com o objetivo de responder em 24 horas. Um moderador pode ler a mensagem denunciada e o seu contexto imediato, nada mais. Consoante a gravidade:',
    },
    {
      ol: [
        'o conteúdo é retirado;',
        'a pessoa recebe um aviso;',
        'algumas funções são limitadas, ou a conta é suspensa;',
        'a conta é encerrada definitivamente, logo à primeira vez nos casos graves (menores, ameaças, violência, burlas).',
      ],
    },
    {
      p: 'Dois casos suspendem uma conta automaticamente, no máximo 72 horas, enquanto um moderador a analisa: vocabulário pedocriminoso explícito numa mensagem, ou uma conta denunciada como menor por duas pessoas diferentes. O que é ilegal pode ser denunciado às autoridades. A pessoa em causa recebe as razões da decisão e pode contestá-la, seja automática ou não ([condições de utilização](@conditions#moderation)).',
    },

    { h2: 'Denunciar e bloquear', id: 'signaler' },
    {
      p: 'Num chat ou num encontro, abre o menu e escolhe **Denunciar** ou **Bloquear**; num chat, um toque longo numa mensagem também permite denunciá-la. A pessoa não sabe quem a denunciou e não é avisada de um bloqueio. Está tudo explicado em [segurança e denúncias](@securite).',
    },
    { p: 'Estas regras fazem parte dos [termos de utilização](@conditions). Uma pergunta, uma dúvida: {{email.support}}. Responde um humano, não um minimoa.' },
  ],
};
