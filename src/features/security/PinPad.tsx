import React from 'react';

interface PinDisplayProps {
  length: number;
  total?: number;
}

export function PinDisplay({ length, total = 4 }: PinDisplayProps) {
  return (
    <div className="flex justify-center gap-3 mb-8" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 ${
            i < length ? 'bg-primary-600 border-primary-600' : 'border-muted'
          }`}
        />
      ))}
    </div>
  );
}

interface PinPadProps {
  pin: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  /** When true, renders a checkmark submit button (the form is responsible for handling submit). */
  showSubmit?: boolean;
  onCancel?: () => void;
  disabled?: boolean;
  buttonClass?: string;
  submitDisabled?: boolean;
}

const STANDARD_BTN =
  'w-16 h-16 rounded-full bg-surface-elevated text-primary text-2xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors';

const SETUP_BTN =
  'w-full aspect-square rounded-lg bg-surface-elevated text-primary text-xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors';

export function PinPad({
  pin,
  onDigit,
  onBackspace,
  showSubmit,
  onCancel,
  disabled,
  buttonClass = STANDARD_BTN,
  submitDisabled,
}: PinPadProps) {
  const isFull = pin.length >= 4;
  return (
    <div className={showSubmit ? 'grid grid-cols-3 gap-4 max-w-xs mx-auto' : 'grid grid-cols-3 gap-3 mb-4'}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => onDigit(num.toString())}
          className={buttonClass}
          disabled={disabled || isFull}
          aria-label={`PIN digit ${num}`}
        >
          {num}
        </button>
      ))}
      <button
        type="button"
        onClick={onBackspace}
        className={buttonClass}
        disabled={disabled || pin.length === 0}
        aria-label="Backspace"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => onDigit('0')}
        className={buttonClass}
        disabled={disabled || isFull}
        aria-label="PIN digit 0"
      >
        0
      </button>
      {showSubmit ? (
        <button
          type="submit"
          className="w-16 h-16 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          disabled={disabled || submitDisabled}
          aria-label="Submit PIN"
        >
          ✓
        </button>
      ) : (
        <button
          type="button"
          onClick={onCancel}
          className={`${SETUP_BTN} text-sm`}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

PinPad.STANDARD_BTN = STANDARD_BTN;
PinPad.SETUP_BTN = SETUP_BTN;
