import type { LegalUi } from '../types';

export const ui: LegalUi = {
  skip: 'ir para o conteúdo',
  download: 'baixar',
  updated: 'Última atualização:',
  translationNotice: 'Esta é uma tradução. Se houver diferença em relação à versão francesa, vale a versão francesa.',
  frenchVersion: 'Ler a versão em francês',
  languageLabel: 'Idioma',
  tocLabel: 'Sumário',
  otherDocs: 'Outros documentos',
  footerLabel: 'links legais',
  footerLinks: [
    { slug: 'assistance', label: 'ajuda' },
    { slug: 'mentions-legales', label: 'informações legais' },
    { slug: 'conditions', label: 'termos' },
    { slug: 'confidentialite', label: 'privacidade' },
    { slug: 'index', label: 'todos os documentos legais' },
  ],
  index: {
    title: 'Informações legais — Minimoa',
    heading: 'Informações legais',
    description: 'Todos os documentos legais do Minimoa: informações legais, termos, privacidade, Minimoa+, regras, cookies, segurança, exclusão da conta, suporte.',
    intro: 'Tudo o que rege o Minimoa, num só lugar. Vale a versão francesa.',
    publisherTitle: 'Quem edita o Minimoa',
    publisherText:
      'O Minimoa é editado por **{{publisher.name}}**. Os detalhes (forma jurídica, registro, endereço, hospedagem) estão nas [informações legais](@mentions-legales). Para falar com a gente: {{email.support}}.',
  },
  short: {
    'mentions-legales': 'Informações legais',
    conditions: 'Termos de uso',
    confidentialite: 'Privacidade',
    abonnement: 'Assinatura Minimoa+',
    regles: 'Regras da comunidade',
    cookies: 'Cookies',
    securite: 'Segurança e denúncias',
    'supprimer-mon-compte': 'Excluir minha conta',
    assistance: 'Suporte',
  },
};
