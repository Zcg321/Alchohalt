/**
 * App Lock Feature (Task 18)
 * Optional PIN/biometric authentication for app access
 * Behind feature flag, secure storage via Capacitor
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAppLockStore } from './appLockStore';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PinDisplay, PinPad } from './PinPad';

interface AppLockProps {
  children: React.ReactNode;
}

function useAppLockEntry() {
  const { unlock } = useAppLockStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await unlock(pin);
      if (!success) {
        setError('Incorrect PIN. Please try again.');
        setPin('');
      }
    } catch {
      setError('Failed to unlock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin((p) => p + d);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  return { pin, error, loading, handleSubmit, handleDigit, handleBackspace };
}

/**
 * AppLock — gates app entry when lock is enabled.
 *
 * a11y: rendered as role="dialog" aria-modal="true" with focus trap
 * inside the unlock surface. Even though the feature is flagged off
 * by default (ENABLE_APP_LOCK), this keeps it correct the moment the
 * flag flips on.
 */
export function AppLock({ children }: AppLockProps) {
  const { isEnabled, isUnlocked, requiresUnlock } = useAppLockStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { pin, error, loading, handleSubmit, handleDigit, handleBackspace } = useAppLockEntry();

  useEffect(() => {
    requiresUnlock();
  }, [requiresUnlock]);

  const showDialog = isEnabled && !isUnlocked;
  useFocusTrap(dialogRef, showDialog);
  useEffect(() => {
    if (showDialog) {
      const first = dialogRef.current?.querySelector<HTMLElement>('button, input, [tabindex="0"]');
      first?.focus();
    }
  }, [showDialog]);

  if (!showDialog) return <>{children}</>;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-lock-title"
      aria-describedby="app-lock-desc"
      className="fixed inset-0 bg-surface z-50 flex items-center justify-center"
    >
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4" aria-hidden="true">
            🔒
          </div>
          <h1 id="app-lock-title" className="text-2xl font-bold text-primary mb-2">
            App Locked
          </h1>
          <p id="app-lock-desc" className="text-secondary">
            Enter your PIN to unlock
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <PinDisplay length={pin.length} />
          <PinPad
            pin={pin}
            onDigit={handleDigit}
            onBackspace={handleBackspace}
            showSubmit
            disabled={loading}
            submitDisabled={pin.length !== 4}
          />
          {error && (
            <p role="alert" className="text-center text-error text-sm mt-4">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

interface SetupState {
  pin: string;
  setPin: (p: string) => void;
  confirmPin: string;
  setConfirmPin: (p: string) => void;
  step: 'enter' | 'confirm';
  setStep: (s: 'enter' | 'confirm') => void;
  error: string;
  setError: (e: string) => void;
}

function useSetupState(): SetupState {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  return { pin, setPin, confirmPin, setConfirmPin, step, setStep, error, setError };
}

function AppLockSetupModal({
  state,
  onCommit,
  onCancel,
}: {
  state: SetupState;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true, onCancel);

  const currentPin = state.step === 'enter' ? state.pin : state.confirmPin;
  const setCurrentPin = state.step === 'enter' ? state.setPin : state.setConfirmPin;

  const onDigit = (d: string) => {
    if (currentPin.length < 4) {
      const next = currentPin + d;
      setCurrentPin(next);
      if (next.length === 4) setTimeout(onCommit, 100);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="applock-setup-title"
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <div className="bg-surface rounded-xl p-6 max-w-md w-full">
        <h2 id="applock-setup-title" className="text-xl font-bold text-primary mb-4">
          {state.step === 'enter' ? 'Set Your PIN' : 'Confirm Your PIN'}
        </h2>
        <PinDisplay length={currentPin.length} />
        <PinPad
          pin={currentPin}
          onDigit={onDigit}
          onBackspace={() => setCurrentPin(currentPin.slice(0, -1))}
          onCancel={onCancel}
          buttonClass={PinPad.SETUP_BTN}
        />
        {state.error && (
          <p role="alert" className="text-center text-error text-sm">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}

function AppLockToggleRow({
  isEnabled,
  onToggle,
}: {
  isEnabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-4 border border-default rounded-xl bg-surface">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-primary">App Lock</h3>
          <p className="text-sm text-secondary mt-1">Require PIN to access app</p>
        </div>
        <button
          onClick={onToggle}
          aria-pressed={isEnabled}
          aria-label={`${isEnabled ? 'Disable' : 'Enable'} app lock`}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-primary-600' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

/** App Lock Settings — toggle + PIN setup flow. */
export function AppLockSettings() {
  const { isEnabled, enable, disable } = useAppLockStore();
  const [showSetup, setShowSetup] = useState(false);
  const setup = useSetupState();

  const handleToggle = async () => {
    if (isEnabled) await disable();
    else setShowSetup(true);
  };

  const handlePinComplete = async () => {
    if (setup.step === 'enter') {
      if (setup.pin.length === 4) {
        setup.setStep('confirm');
        setup.setError('');
      }
      return;
    }
    if (setup.pin === setup.confirmPin) {
      try {
        await enable(setup.pin);
        setShowSetup(false);
        setup.setPin('');
        setup.setConfirmPin('');
        setup.setStep('enter');
      } catch {
        setup.setError('Failed to enable app lock. Please try again.');
      }
    } else {
      setup.setError('PINs do not match. Please try again.');
      setup.setPin('');
      setup.setConfirmPin('');
      setup.setStep('enter');
    }
  };

  if (showSetup) {
    return (
      <AppLockSetupModal
        state={setup}
        onCommit={handlePinComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }
  return <AppLockToggleRow isEnabled={isEnabled} onToggle={handleToggle} />;
}
