import React from 'react';
import { stdDrinks } from '../../lib/calc';
import { Drink } from './DrinkForm';

interface Props {
  drinks: Drink[];
}

export function DrinkList({ drinks }: Props) {
  return (
    <ul className="space-y-1">
      {drinks.map((d) => (
        <li key={d.ts}>
          {new Date(d.ts).toLocaleString()} - {d.intention} -
          {stdDrinks(d.volumeMl, d.abvPct).toFixed(2)} std - craving {d.craving}
          {d.halt.length ? ` HALT: ${d.halt.join(',')}` : ''}
          {d.alt ? ` alt: ${d.alt}` : ''}
        </li>
      ))}
    </ul>
  );
}
