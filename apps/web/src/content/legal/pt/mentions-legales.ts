import type { LegalPage } from '../types';

export const mentionsLegales: LegalPage = {
  title: 'Informações legais — Minimoa',
  heading: 'Informações legais',
  description: 'Quem edita o Minimoa, quem o hospeda e como falar com a gente.',
  intro: 'Quem edita o app e o site Minimoa, quem os hospeda e como falar com a gente.',
  body: [
    { h2: 'Editor', id: 'editeur' },
    { p: 'O site minimoa.app e o app Minimoa são editados por:' },
    {
      ul: [
        '**Razão social:** {{publisher.name}}',
        '**Forma jurídica:** {{publisher.legalForm}}',
        '**Capital social:** {{publisher.shareCapital}}',
        '**Registro (SIREN, RCS):** {{publisher.registration}}',
        '**Número de IVA intracomunitário:** {{publisher.vatNumber}}',
        '**Sede:** {{publisher.address}}',
        '**Telefone:** {{publisher.phone}}',
        '**E-mail:** {{email.support}}',
      ],
    },
    { h2: 'Diretor da publicação', id: 'publication' },
    { p: '{{publisher.publicationDirector}}' },
    { h2: 'Hospedagem', id: 'hebergement' },
    { h3: 'O site minimoa.app' },
    { ul: ['**Hospedagem:** {{siteHost.name}}', '**Endereço:** {{siteHost.address}}', '**Telefone:** {{siteHost.phone}}'] },
    { h3: 'Os dados do app' },
    {
      ul: [
        '**Hospedagem:** {{dataHost.name}}',
        '**Endereço:** {{dataHost.address}}',
        '**Contato:** {{dataHost.contact}}',
        '**Localização dos servidores:** {{dataHost.region}}',
      ],
    },
    { p: 'A lista completa dos nossos fornecedores está na [política de privacidade](@confidentialite#prestataires).' },
    { h2: 'Fale com a gente', id: 'contact' },
    {
      ul: [
        'Suporte, dúvidas, reclamações: {{email.support}}.',
        'Dados pessoais: {{email.privacy}}.',
        'Segurança e conteúdos ilícitos: {{email.safety}}, ou a denúncia no app.',
      ],
    },
    {
      p: 'O endereço {{email.support}} também é o nosso ponto de contato único para as autoridades e para os usuários, nos termos do regulamento europeu sobre serviços digitais (DSA). Respondemos em francês ou em inglês.',
    },
    { h2: 'Denunciar um conteúdo ilícito', id: 'signaler' },
    {
      p: 'No app, denuncie a mensagem ou a pessoa: é o jeito mais rápido (veja [segurança e denúncias](@securite)). Você também pode escrever para {{email.safety}}, dizendo qual é o problema, onde ele está e por que você o considera ilícito.',
    },
    { h2: 'Propriedade intelectual', id: 'propriete' },
    {
      p: 'A marca Minimoa, os minimoas, as ilustrações, os textos, as animações e o software são protegidos pelo direito de propriedade intelectual. Eles pertencem a {{publisher.name}} ou a seus parceiros. É proibido reproduzi-los ou reutilizá-los sem autorização, exceto no que a lei permite (citação curta, cópia privada).',
    },
    { p: 'Fonte do site e das suas imagens: Allo (Josh Puckett), sob a licença SIL Open Font License. Animações da página inicial: biblioteca GSAP.' },
  ],
};
