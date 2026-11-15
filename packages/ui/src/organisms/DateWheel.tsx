import { useMemo } from 'react';

import { WheelColumn, WheelPicker } from '../molecules/WheelPicker';

export interface DateParts {
  year: number;
  /** 1 à 12. */
  month: number;
  day: number;
}

export interface DateWheelProps {
  value: DateParts;
  onChange: (value: DateParts) => void;
  /** Noms des mois dans la langue de l'app (12). */
  monthNames: readonly string[];
  /** Noms lus des colonnes. */
  labels: { day: string; month: string; year: string };
  minYear: number;
  maxYear: number;
}

const daysIn = (year: number, month: number): number => new Date(Date.UTC(year, month, 0)).getUTCDate();

/** Date de naissance à trois roues (jour, mois, année), comme le sélecteur d'iOS ; le jour suit la longueur du mois. */
export function DateWheel({ value, onChange, monthNames, labels, minYear, maxYear }: DateWheelProps) {
  const years = useMemo(() => Array.from({ length: maxYear - minYear + 1 }, (_, i) => String(minYear + i)), [minYear, maxYear]);
  const days = useMemo(() => Array.from({ length: daysIn(value.year, value.month) }, (_, i) => String(i + 1)), [value.year, value.month]);
  const set = (patch: Partial<DateParts>) => {
    const next = { ...value, ...patch };
    next.day = Math.min(next.day, daysIn(next.year, next.month));
    onChange(next);
  };
  return (
    <WheelPicker>
      <WheelColumn items={days} index={value.day - 1} onChange={(i) => set({ day: i + 1 })} label={labels.day} flex={0.8} />
      <WheelColumn items={monthNames} index={value.month - 1} onChange={(i) => set({ month: i + 1 })} label={labels.month} flex={1.5} />
      <WheelColumn items={years} index={value.year - minYear} onChange={(i) => set({ year: minYear + i })} label={labels.year} flex={1} />
    </WheelPicker>
  );
}
