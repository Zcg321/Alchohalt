import React from 'react';
import { stdDrinks } from '../../lib/calc';
import { Drink } from './DrinkForm';
import { Table, THead, TBody, TR, TH, TD } from '../../components/ui/Table';

interface Props {
  drinks: Drink[];
}

export function DrinkList({ drinks }: Props) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Date</TH>
          <TH>Intention</TH>
          <TH>Std</TH>
          <TH>Craving</TH>
          <TH>HALT</TH>
          <TH>Alternative</TH>
        </TR>
      </THead>
      <TBody>
        {drinks.map((d) => (
          <TR key={d.ts}>
            <TD>{new Date(d.ts).toLocaleString()}</TD>
            <TD>{d.intention}</TD>
            <TD>{stdDrinks(d.volumeMl, d.abvPct).toFixed(2)}</TD>
            <TD>{d.craving}</TD>
            <TD>{d.halt.join(',')}</TD>
            <TD>{d.alt}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
