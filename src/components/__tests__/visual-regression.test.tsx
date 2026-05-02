/**
 * [R8-B] Component visual regression rig — DOM serialization, not pixels.
 *
 * Mounts every UI primitive in every meaningful state combination and
 * snapshots the rendered HTML. Any structural change (class names, ARIA,
 * children, conditional branches) shows up as a snapshot diff. We
 * deliberately do NOT use pixel-based capture (Playwright/puppeteer)
 * here — see audit-walkthrough/store-screenshots/README.md for why that
 * path keeps wedging on viewport-dependent hydration.
 *
 * Coverage as of round 8:
 *   Button   6 variants × 3 sizes × {default, disabled, loading} = 54 cells
 *   Card     3 variants × 4 paddings                              = 12 cells
 *   Badge    7 variants × 3 sizes (× dot variant)                 = 22 cells
 *   Input    {default, error, success, disabled, with-icons}      =  5 cells
 *   Toggle   3 sizes × {checked,unchecked,disabled}               =  9 cells
 *   Progress 4 variants × {0%, 50%, 100%}                         = 12 cells
 *   Skeleton 3 variants                                            =  3 cells
 *   Label    {default, required}                                   =  2 cells
 *   StatRow  default                                               =  1 cell
 *   Toast    4 types × {with-action, plain}                        =  8 cells
 *   Disclaimer / A11ySkipLink                                      =  2 cells
 *   ─────────────────────────────────────────────────────────────────────
 *                                                                   130 cells
 *
 * Each cell is asserted against an inline snapshot for fast diffing.
 * The point isn't to lock pixel-perfect rendering — it's to catch
 * unintentional class-name churn that often slips through during
 * refactors (a Round-7 lesson where the dark-mode contrast fix
 * silently moved sage tokens on three unrelated surfaces).
 */

import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

import { Button } from '../ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Toggle } from '../ui/Toggle';
import { Progress } from '../ui/Progress';
import { Skeleton } from '../ui/Skeleton';
import { Label } from '../ui/Label';
import { StatRow } from '../ui/StatRow';
import { Toast } from '../ui/Toast';
import { Disclaimer } from '../Disclaimer';
import A11ySkipLink from '../A11ySkipLink';

function html(node: ReactElement): string {
  const { container } = render(node);
  return container.innerHTML;
}

describe('Button — variants × sizes × states', () => {
  const variants = ['primary', 'secondary', 'success', 'danger', 'ghost', 'outline'] as const;
  const sizes = ['sm', 'md', 'lg'] as const;
  const states = [
    { label: 'default', props: {} },
    { label: 'disabled', props: { disabled: true } },
    { label: 'loading', props: { loading: true } },
  ] as const;

  for (const variant of variants) {
    for (const size of sizes) {
      for (const state of states) {
        const key = `${variant}/${size}/${state.label}`;
        it(`renders ${key}`, () => {
          expect(
            html(
              <Button variant={variant} size={size} {...state.props}>
                Save
              </Button>,
            ),
          ).toMatchSnapshot();
        });
      }
    }
  }
});

describe('Card — variants × paddings', () => {
  const variants = ['default', 'bordered', 'ghost'] as const;
  const paddings = ['none', 'sm', 'md', 'lg'] as const;

  for (const variant of variants) {
    for (const padding of paddings) {
      it(`renders ${variant}/${padding}`, () => {
        expect(
          html(
            <Card variant={variant} padding={padding}>
              <CardHeader>Header</CardHeader>
              <CardContent>Body content</CardContent>
              <CardFooter>Footer</CardFooter>
            </Card>,
          ),
        ).toMatchSnapshot();
      });
    }
  }
});

describe('Badge — variants × sizes (+dot)', () => {
  const variants = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'neutral',
    'outline',
  ] as const;
  const sizes = ['sm', 'md', 'lg'] as const;

  for (const variant of variants) {
    for (const size of sizes) {
      it(`renders ${variant}/${size}`, () => {
        expect(
          html(
            <Badge variant={variant} size={size}>
              Active
            </Badge>,
          ),
        ).toMatchSnapshot();
      });
    }
    it(`renders ${variant}/dot`, () => {
      expect(html(<Badge variant={variant} dot>Online</Badge>)).toMatchSnapshot();
    });
  }
});

describe('Input — states', () => {
  it('renders default', () => {
    expect(html(<Input placeholder="Email" />)).toMatchSnapshot();
  });
  it('renders with error', () => {
    expect(html(<Input placeholder="Email" error="Invalid email" />)).toMatchSnapshot();
  });
  it('renders with success', () => {
    expect(html(<Input placeholder="Email" success="Looks good" />)).toMatchSnapshot();
  });
  it('renders disabled', () => {
    expect(html(<Input placeholder="Email" disabled />)).toMatchSnapshot();
  });
  it('renders with leftIcon', () => {
    expect(
      html(<Input placeholder="Search" leftIcon={<span>🔍</span>} />),
    ).toMatchSnapshot();
  });
});

describe('Toggle — sizes × states', () => {
  const sizes = ['sm', 'md', 'lg'] as const;
  for (const size of sizes) {
    it(`renders ${size}/unchecked`, () => {
      expect(
        html(<Toggle size={size} checked={false} onChange={() => {}} aria-label="t" />),
      ).toMatchSnapshot();
    });
    it(`renders ${size}/checked`, () => {
      expect(
        html(<Toggle size={size} checked={true} onChange={() => {}} aria-label="t" />),
      ).toMatchSnapshot();
    });
    it(`renders ${size}/disabled`, () => {
      expect(
        html(
          <Toggle size={size} checked={false} disabled onChange={() => {}} aria-label="t" />,
        ),
      ).toMatchSnapshot();
    });
  }
});

describe('Progress — variants × values', () => {
  const variants = ['primary', 'success', 'warning', 'danger'] as const;
  const values = [0, 50, 100];

  for (const variant of variants) {
    for (const value of values) {
      it(`renders ${variant}/${value}%`, () => {
        expect(
          html(<Progress label="loading" value={value} max={100} variant={variant} />),
        ).toMatchSnapshot();
      });
    }
  }
});

describe('Skeleton — variants', () => {
  it('renders rectangular', () => {
    expect(html(<Skeleton width={200} height={20} variant="rectangular" />)).toMatchSnapshot();
  });
  it('renders circular', () => {
    expect(html(<Skeleton width={40} height={40} variant="circular" />)).toMatchSnapshot();
  });
  it('renders text', () => {
    expect(html(<Skeleton width={120} variant="text" />)).toMatchSnapshot();
  });
});

describe('Label — states', () => {
  it('renders default', () => {
    expect(html(<Label>Email address</Label>)).toMatchSnapshot();
  });
  it('renders required', () => {
    expect(html(<Label required>Email address</Label>)).toMatchSnapshot();
  });
});

describe('StatRow — default', () => {
  it('renders', () => {
    expect(html(<StatRow label="Streak"><strong>14 days</strong></StatRow>)).toMatchSnapshot();
  });
});

describe('Toast — types × action', () => {
  const types = ['success', 'error', 'warning', 'info'] as const;
  for (const type of types) {
    it(`renders ${type}/plain`, () => {
      expect(
        html(
          <Toast
            show={true}
            type={type}
            message={`${type} message`}
            onClose={() => {}}
          />,
        ),
      ).toMatchSnapshot();
    });
    it(`renders ${type}/with-action`, () => {
      expect(
        html(
          <Toast
            show={true}
            type={type}
            message={`${type} message`}
            onClose={() => {}}
            action={{ label: 'Undo', onClick: () => {} }}
          />,
        ),
      ).toMatchSnapshot();
    });
  }
});

describe('Disclaimer / A11ySkipLink — singletons', () => {
  it('renders Disclaimer', () => {
    expect(html(<Disclaimer />)).toMatchSnapshot();
  });
  it('renders A11ySkipLink', () => {
    expect(html(<A11ySkipLink />)).toMatchSnapshot();
  });
});
