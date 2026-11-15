/** Pages légales en français (version qui fait foi). */
import type { LegalBundle } from '../types';
import { ui } from './_ui';
import { mentionsLegales } from './mentions-legales';
import { conditions } from './conditions';
import { confidentialite } from './confidentialite';
import { abonnement } from './abonnement';
import { regles } from './regles';
import { cookies } from './cookies';
import { securite } from './securite';
import { supprimerMonCompte } from './supprimer-mon-compte';
import { assistance } from './assistance';

export const fr: LegalBundle = {
  locale: 'fr',
  ui,
  pages: {
    'mentions-legales': mentionsLegales,
    conditions,
    confidentialite,
    abonnement,
    regles,
    cookies,
    securite,
    'supprimer-mon-compte': supprimerMonCompte,
    assistance,
  },
};
