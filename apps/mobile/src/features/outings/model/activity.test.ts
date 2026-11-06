import { describe, expect, it } from 'vitest';
import {
  acceptPriceLine as accept0,
  activityPrepaidLine as prepaid0,
  paymentLines,
} from './activity';

const nb = (s: string | null) => s && s.replace(/\u00A0/g, ' ');
const acceptPriceLine = (...a: Parameters<typeof accept0>) => nb(accept0(...a));
const activityPrepaidLine = (...a: Parameters<typeof prepaid0>) => nb(prepaid0(...a));

const foot = {
  activityDetail: { key: 'five_a_side', label: 'Foot à 5', durationMinutes: 120, priceCents: 900 },
};
const none = {
  activityDetail: { key: 'board_games', label: 'Jeux de société', durationMinutes: 120 },
};

describe('activités prépayées', () => {
  it('prix sous « Je viens »', () => {
    expect(acceptPriceLine(foot, 499, true)).toBe(
      'Place offerte (ta 1re sortie) + terrain 9 € · ensuite 4,99 € + 9 €',
    );
    expect(acceptPriceLine(none, 499, true)).toBe('Offerte (ta 1re sortie) · ensuite 4,99 €');
  });
  it('ligne « Comment ça se passe »', () => {
    expect(activityPrepaidLine(foot)).toBe('Foot à 5 : 9 €, payé dans l’app avec ta place.');
    expect(activityPrepaidLine(none)).toBeNull();
  });
  it('récapitulatif : place + activité, ou activité seule (place offerte, Blowy+)', () => {
    const bloc = {
      activityDetail: {
        key: 'bouldering',
        label: 'Bloc d’escalade',
        durationMinutes: 120,
        priceCents: 1200,
      },
    };
    expect(paymentLines(bloc, 1699, 1200)).toEqual([
      { label: 'Place de sortie', cents: 499 },
      { label: 'Bloc d’escalade, payé avec ta place', cents: 1200 },
    ]);
    expect(paymentLines(bloc, 1200, 1200)).toEqual([
      { label: 'Bloc d’escalade, payé avec ta place', cents: 1200 },
    ]);
    expect(paymentLines(bloc, 499, undefined)).toEqual([]);
  });
});
