/**
 * [R8-B] Component Gallery — every UI primitive in every state.
 *
 * Mounted by AlcoholCoachApp when the URL includes ?gallery=1, this
 * gives the round-8 visual-regression Playwright spec a single page
 * to walk: each component appears in default / hover-styled / focused
 * / disabled / loading / error / empty / dark-mode states under
 * stable, predictable dimensions.
 *
 * The gallery is gated to dev / debug only — it ships in the bundle
 * (size cost: a few KB minified, traded for a permanent visual
 * regression baseline) but is never linked from the user-facing UI.
 *
 * Component sections each carry a stable data-gallery="<name>" attr
 * so the Playwright spec can clip a screenshot per section instead of
 * paginating one giant page. Each section is full-width on mobile,
 * fixed 800px max on desktop — Playwright runs at a fixed viewport so
 * snapshot dimensions stay constant across runs.
 *
 * Adding a new component here is the visual-regression baseline ask:
 * write the section, run the spec with --update-snapshots once, and
 * future PRs that change the rendered output need a deliberate
 * baseline refresh to merge.
 */

import React, { useState } from 'react';

import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/Progress';
import { Skeleton, SkeletonCard, SkeletonText } from '../components/ui/Skeleton';
import { StatRow } from '../components/ui/StatRow';
import { Toggle } from '../components/ui/Toggle';

interface SectionProps {
  name: string;
  title: string;
  children: React.ReactNode;
}

function Section({ name, title, children }: SectionProps) {
  return (
    <section
      data-gallery={name}
      className="border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 bg-white dark:bg-neutral-900"
    >
      <h2 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">
        {title}
      </h2>
      <div className="flex flex-wrap gap-4 items-start">{children}</div>
    </section>
  );
}

function GalleryControlled() {
  const [toggleA, setToggleA] = useState(false);
  const [toggleB, setToggleB] = useState(true);

  return (
    <Section name="toggle" title="Toggle">
      <Toggle checked={false} onChange={() => undefined} aria-label="off">
        Off
      </Toggle>
      <Toggle checked={true} onChange={() => undefined} aria-label="on">
        On
      </Toggle>
      <Toggle checked={toggleA} onChange={setToggleA} aria-label="interactive a">
        Interactive
      </Toggle>
      <Toggle checked={toggleB} onChange={setToggleB} disabled aria-label="disabled on">
        Disabled on
      </Toggle>
      <Toggle checked={false} onChange={() => undefined} disabled aria-label="disabled off">
        Disabled off
      </Toggle>
      <Toggle checked={false} onChange={() => undefined} size="sm" aria-label="sm">
        Small
      </Toggle>
      <Toggle checked={true} onChange={() => undefined} size="lg" aria-label="lg">
        Large
      </Toggle>
    </Section>
  );
}

// eslint-disable-next-line max-lines-per-function -- [R19-B] dev-only visual-regression baseline; sections are snapshotted by e2e/component-gallery.spec.ts. Splitting decouples the snapshot anchors from the gallery shape.
export default function ComponentGallery({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      data-gallery-root="true"
      data-gallery-theme={theme}
      className={
        theme === 'dark'
          ? 'dark min-h-screen bg-neutral-950 p-8'
          : 'min-h-screen bg-neutral-50 p-8'
      }
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Component gallery — {theme}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Visual-regression baseline. Sections snapshotted by
            <code className="ms-1 font-mono text-xs">e2e/component-gallery.spec.ts</code>.
          </p>
        </header>

        <Section name="button-variants" title="Button — variants">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="success">Success</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="outline">Outline</Button>
        </Section>

        <Section name="button-sizes" title="Button — sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Section>

        <Section name="button-states" title="Button — states">
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button leftIcon={<span aria-hidden>★</span>}>With left icon</Button>
          <Button rightIcon={<span aria-hidden>→</span>}>With right icon</Button>
        </Section>

        <Section name="badge-variants" title="Badge — variants">
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="neutral">Neutral</Badge>
          <Badge variant="outline">Outline</Badge>
        </Section>

        <Section name="badge-sizes" title="Badge — sizes + dot">
          <Badge size="sm">Small</Badge>
          <Badge size="md">Medium</Badge>
          <Badge size="lg">Large</Badge>
          <Badge dot variant="success">Active</Badge>
          <Badge dot variant="warning">Pending</Badge>
        </Section>

        <Section name="input-states" title="Input — states">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input placeholder="Default empty" />
            <Input placeholder="With value" defaultValue="example text" />
            <Input placeholder="Error state" error="That doesn't look right" />
            <Input placeholder="Success state" success="Looks good" />
            <Input placeholder="Disabled" disabled />
            <Input
              placeholder="With left icon"
              leftIcon={<span aria-hidden>@</span>}
            />
          </div>
        </Section>

        <GalleryControlled />

        <Section name="progress" title="Progress">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Progress value={0} max={100} label="empty" />
            <Progress value={25} max={100} label="quarter" />
            <Progress value={50} max={100} label="half" variant="warning" />
            <Progress value={75} max={100} label="three-quarters" variant="success" />
            <Progress value={100} max={100} label="full" />
            <Progress value={120} max={100} label="over" variant="danger" />
          </div>
        </Section>

        <Section name="card-variants" title="Card — variants">
          <Card padding="md" className="w-full sm:w-72">
            <CardHeader>
              <h3 className="font-semibold">Default card</h3>
            </CardHeader>
            <CardContent>Standard surface for grouped content.</CardContent>
          </Card>
          <Card variant="bordered" padding="md" className="w-full sm:w-72">
            <CardHeader>
              <h3 className="font-semibold">Bordered card</h3>
            </CardHeader>
            <CardContent>Heavier outline for emphasis.</CardContent>
          </Card>
          <Card variant="ghost" padding="md" className="w-full sm:w-72">
            <CardHeader>
              <h3 className="font-semibold">Ghost card</h3>
            </CardHeader>
            <CardContent>No surface, no shadow — just spacing.</CardContent>
          </Card>
        </Section>

        <Section name="skeleton" title="Skeleton">
          <div className="w-full space-y-4">
            <Skeleton width={240} height={20} />
            <Skeleton variant="circular" width={48} height={48} />
            <SkeletonText lines={3} />
            <SkeletonCard />
          </div>
        </Section>

        <Section name="statrow" title="StatRow">
          <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatRow label="Streak">7 days</StatRow>
            <StatRow label="Average / week">2.4</StatRow>
            <StatRow label="Goal">≤ 7 / week</StatRow>
          </div>
        </Section>
      </div>
    </div>
  );
}
