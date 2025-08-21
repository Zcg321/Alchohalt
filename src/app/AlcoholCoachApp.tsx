import React, { useEffect, useState } from 'react';
import { stdDrinks } from '../lib/calc';
import {
  getVersioned,
  setVersionedDebounced,
} from '../lib/storage';
import { Drink, DrinkForm, Intention, haltOptions, Halt } from '../features/drinks/DrinkForm';
import { DrinkList } from '../features/drinks/DrinkList';
import { DrinkChart } from '../features/drinks/DrinkChart';
import { ExportImport } from '../features/drinks/ExportImport';
import { Stats } from '../features/rewards/Stats';
import { NotificationsToggle } from '../features/coach/NotificationsToggle';
import { GoalSettings, Goals } from '../features/goals/GoalSettings';
import { ThemeToggle } from '../features/settings/ThemeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';

export function AlcoholCoachApp() {
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [goals, setGoals] = useState<Goals>({
    dailyCap: 3,
    weeklyGoal: 14,
    pricePerStd: 2,
    baselineMonthlySpend: 200,
  });

  const DRINKS_V = 1;
  const GOALS_V = 1;

  useEffect(() => {
    function migrateDrinks(old: unknown): Drink[] {
      const base =
        typeof old === 'object' && old !== null
          ? (old as Record<string, unknown>)
          : undefined;
      const withData = base as { data?: unknown } | undefined;
      const raw = Array.isArray(withData?.data)
        ? (withData.data as unknown[])
        : Array.isArray(base)
        ? (base as unknown[])
        : [];
      return (raw as Record<string, unknown>[]).map((d) => ({
        volumeMl: Number(d.volumeMl) || 0,
        abvPct: Number(d.abvPct) || 0,
        intention: (d.intention as Intention) || 'taste',
        craving: typeof d.craving === 'number' ? d.craving : 0,
        halt: Array.isArray(d.halt)
          ? (d.halt as unknown[]).filter((h): h is Halt =>
              (haltOptions as readonly string[]).includes(String(h))
            )
          : [],
        alt: typeof d.alt === 'string' ? d.alt : '',
        ts: Number(d.ts) || Date.now(),
      }));
    }
    getVersioned<Drink[]>('drinks', DRINKS_V, migrateDrinks).then(setDrinks);
  }, []);

  useEffect(() => {
    function migrateGoals(old: unknown): Goals {
      const base =
        typeof old === 'object' && old !== null
          ? (old as Record<string, unknown>)
          : {};
      const g =
        'data' in base && typeof base.data === 'object' && base.data
          ? (base.data as Record<string, unknown>)
          : base;
      return {
        dailyCap: typeof g.dailyCap === 'number' ? g.dailyCap : 3,
        weeklyGoal: typeof g.weeklyGoal === 'number' ? g.weeklyGoal : 14,
        pricePerStd: typeof g.pricePerStd === 'number' ? g.pricePerStd : 2,
        baselineMonthlySpend:
          typeof g.baselineMonthlySpend === 'number'
            ? g.baselineMonthlySpend
            : 200,
      };
    }
    getVersioned<Goals>('goals', GOALS_V, migrateGoals).then(setGoals);
  }, []);

  useEffect(() => {
    setVersionedDebounced('drinks', DRINKS_V, drinks);
  }, [drinks]);

  useEffect(() => {
    setVersionedDebounced('goals', GOALS_V, goals);
  }, [goals]);

  function addDrink(drink: Drink) {
    setDrinks((d) => [...d, drink]);
  }

  function importDrinks(d: Drink[]) {
    setDrinks(
      d.map((x) => ({
        volumeMl: x.volumeMl,
        abvPct: x.abvPct,
        intention: (x.intention as Intention) || 'taste',
        craving: typeof x.craving === 'number' ? x.craving : 0,
        halt: Array.isArray(x.halt)
          ? x.halt.filter((h): h is Halt => (haltOptions as readonly string[]).includes(h))
          : [],
        alt: x.alt || '',
        ts: x.ts,
      }))
    );
  }

  const totalStd = drinks.reduce(
    (sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct),
    0
  );
  return (
    <div className="p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">alchohalt</h1>
        <ThemeToggle />
      </header>
      <Alert>
        <AlertTitle>Privacy & Safety</AlertTitle>
        <AlertDescription>
          Data stays on this device. This app is not medical advice.
        </AlertDescription>
      </Alert>
      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <Card>
            <CardHeader>Log a drink</CardHeader>
            <CardContent>
              <DrinkForm onAdd={addDrink} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="goals">
          <Card>
            <CardHeader>Goals</CardHeader>
            <CardContent>
              <GoalSettings goals={goals} onChange={setGoals} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="stats">
          <Card>
            <CardHeader>Stats</CardHeader>
            <CardContent>
              <Stats drinks={drinks} goals={goals} />
              <div className="mt-2">Total standard drinks: {totalStd.toFixed(2)}</div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reminders">
          <Card>
            <CardHeader>Reminders</CardHeader>
            <CardContent>
              <NotificationsToggle />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="chart">
          <Card>
            <CardHeader>Chart</CardHeader>
            <CardContent>
              <DrinkChart drinks={drinks} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="data">
          <Card>
            <CardHeader>Data</CardHeader>
            <CardContent>
              <ExportImport drinks={drinks} onImport={importDrinks} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>History</CardHeader>
            <CardContent>
              <DrinkList drinks={drinks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
