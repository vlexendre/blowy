import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'ir para o conteúdo',
  download: 'descarregar',
  updated: 'Última atualização:',
  translationNotice: 'Isto é uma tradução. Se diferir da versão francesa, prevalece a versão francesa.',
  frenchVersion: 'Ler a versão francesa',
  languageLabel: 'Idioma',
  tocLabel: 'Índice',
  otherDocs: 'Outros documentos',
  footerLabel: 'ligações legais',
  footerLinks: [
    { slug: 'assistance', label: 'ajuda' },
    { slug: 'mentions-legales', label: 'informação legal' },
    { slug: 'conditions', label: 'termos' },
    { slug: 'confidentialite', label: 'privacidade' },
    { slug: 'index', label: 'tudo o que é legal' },
  ],
  index: {
    title: 'Informação legal — Minimoa',
    heading: 'Informação legal',
    description: 'Todos os documentos legais do Minimoa: informação legal, termos, privacidade, Minimoa+, regras, cookies, segurança, eliminação da conta, ajuda.',
    intro: 'Tudo o que rege o Minimoa, num só lugar. Prevalece a versão francesa.',
    publisherTitle: 'Quem edita o Minimoa',
    publisherText:
      'O Minimoa é editado por **{{publisher.name}}**. Os detalhes (forma jurídica, registo, morada, fornecedores de alojamento) estão na [informação legal](@mentions-legales). Para nos escreveres: {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Informação legal',
    conditions: 'Termos de utilização',
    confidentialite: 'Privacidade',
    abonnement: 'Subscrição Minimoa+',
    regles: 'Regras da comunidade',
    cookies: 'Cookies',
    securite: 'Segurança e denúncias',
    'supprimer-mon-compte': 'Eliminar a minha conta',
    assistance: 'Ajuda',
  },
};
