import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Informação legal — Blowy',
  heading: 'Informação legal',
  description: 'Quem edita o Blowy, quem o aloja e como nos contactar.',
  intro: 'Quem edita a app e o site Blowy, quem os aloja e como nos contactar.',
  body: [
    { h2: 'Editor', id: 'editeur' },
    { p: 'O site blowy.app e a app Blowy são editados por:' },
    {
      ul: [
        '**Denominação social:** {{publisher.name}}',
        '**Forma jurídica:** {{publisher.legalForm}}',
        '**Capital social:** {{publisher.shareCapital}}',
        '**Registo (SIREN, RCS):** {{publisher.registration}}',
        '**Número de IVA intracomunitário:** {{publisher.vatNumber}}',
        '**Sede:** {{publisher.address}}',
        '**Telefone:** {{publisher.phone}}',
        '**E-mail:** {{email.support}}',
      ],
    },
    { h2: 'Diretor da publicação', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Alojamento', id: 'hebergement' },
    { h3: 'O site blowy.app' },
    { ul: ['**Fornecedor:** {{siteHost.name}}', '**Morada:** {{siteHost.address}}', '**Telefone:** {{siteHost.phone}}'] },
    { h3: 'Os dados da app' },
    {
      ul: [
        '**Fornecedor:** {{dataHost.name}}',
        '**Morada:** {{dataHost.address}}',
        '**Telefone:** {{dataHost.phone}}',
        '**Localização dos servidores:** {{dataHost.region}}',
      ],
    },
    { p: 'A lista completa dos nossos prestadores está na [política de privacidade](@confidentialite#prestataires).' },
    { h2: 'Contactar-nos', id: 'contact' },
    {
      ul: [
        'Ajuda, perguntas, reclamações: {{email.support}}.',
        'Dados pessoais: {{email.privacy}}.',
        'Segurança e conteúdos ilícitos: {{email.safety}}, ou a opção de denunciar na app.',
      ],
    },
    {
      p: '{{email.support}} é também o nosso ponto de contacto único para as autoridades e para os utilizadores, nos termos do Regulamento europeu dos Serviços Digitais (DSA). Respondemos em francês ou em inglês.',
    },
    { h2: 'Denunciar um conteúdo ilícito', id: 'signaler' },
    {
      p: 'Na app, denuncia a mensagem ou a pessoa: é o mais rápido (vê [segurança e denúncias](@securite)). Também podes escrever para {{email.safety}}, indicando qual é o problema, onde está e porque o consideras ilícito.',
    },
    { h2: 'Propriedade intelectual', id: 'propriete' },
    {
      p: 'A marca Blowy, os minimoas, as ilustrações, os textos, as animações e o software estão protegidos pelo direito da propriedade intelectual. Pertencem a {{publisher.name}} ou aos seus parceiros. É proibido reproduzi-los ou reutilizá-los sem autorização, salvo o que a lei permite (citação curta, cópia privada).',
    },
    { p: 'Tipos de letra do site: Anton e Bricolage Grotesque, sob a licença SIL Open Font License. Animações da página inicial: biblioteca GSAP.' },
    { h2: 'Outros documentos', id: 'documents' },
    {
      p: 'A utilização do Blowy rege-se pelos [termos de utilização](@conditions), pela [política de privacidade](@confidentialite), pelas [condições da subscrição Blowy+](@abonnement) e pelas [regras da comunidade](@regles).',
    },
  ],
};
