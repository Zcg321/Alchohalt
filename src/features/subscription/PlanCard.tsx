import React from 'react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { PLANS, type PlanId } from '../../config/plans';
import { HIGHLIGHTS, PER_PLAN_PERKS } from './subscriptionPlans';

interface Props {
  planId: PlanId;
  isCurrent: boolean;
  isWorking: boolean;
  onSubscribe: (planId: PlanId) => void;
}

const CHECK_ICON = (
  <svg
    className="me-2 mt-0.5 h-4 w-4 shrink-0 text-green-500"
    fill="currentColor"
    viewBox="0 0 20 20"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

function PlanCardCTA({
  planId,
  isCurrent,
  isWorking,
  onSubscribe,
}: {
  planId: PlanId;
  isCurrent: boolean;
  isWorking: boolean;
  onSubscribe: (planId: PlanId) => void;
}) {
  if (planId === 'free') {
    return (
      <Button variant="secondary" className="w-full" disabled={isCurrent}>
        {isCurrent ? 'Your current plan' : 'Switch to free'}
      </Button>
    );
  }
  if (isCurrent) {
    return (
      <Button variant="secondary" className="w-full" disabled>
        Active
      </Button>
    );
  }
  return (
    <Button onClick={() => onSubscribe(planId)} disabled={isWorking} className="w-full">
      {isWorking ? 'Processing…' : `Get ${PLANS[planId].name}`}
    </Button>
  );
}

export function PlanCard({ planId, isCurrent, isWorking, onSubscribe }: Props) {
  const plan = PLANS[planId];
  const highlight = HIGHLIGHTS[planId];
  return (
    <article
      className={`relative flex flex-col rounded-xl border p-5 transition ${
        highlight
          ? 'border-blue-400 ring-1 ring-blue-200 dark:border-blue-500 dark:ring-blue-900/40'
          : 'border-gray-200 dark:border-gray-700'
      } ${isCurrent ? 'ring-2 ring-green-500' : 'hover:-translate-y-0.5 hover:shadow-md'} bg-white dark:bg-gray-900`}
    >
      {highlight && (
        <div className="absolute -top-3 start-1/2 -translate-x-1/2">
          <Badge variant={highlight.tone} size="sm">
            {highlight.label}
          </Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 end-3">
          <Badge variant="success" size="sm">
            Current
          </Badge>
        </div>
      )}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{plan.name}</h3>
        <p className="mt-3 text-2xl font-semibold tracking-tight">{plan.priceLabel}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{plan.subtitle}</p>
      </div>
      <ul className="mt-6 flex-1 space-y-2 text-sm">
        {PER_PLAN_PERKS[planId].map((perk, i) => (
          <li key={i} className="flex items-start">
            {CHECK_ICON}
            <span className="text-gray-700 dark:text-gray-300">{perk}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <PlanCardCTA
          planId={planId}
          isCurrent={isCurrent}
          isWorking={isWorking}
          onSubscribe={onSubscribe}
        />
      </div>
    </article>
  );
}
