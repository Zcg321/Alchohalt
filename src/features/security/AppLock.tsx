/**
 * App Lock Feature (Task 18)
 * Optional PIN/biometric authentication for app access
 * Behind feature flag, secure storage via Capacitor
 */

import React, { useState, useEffect } from 'react';
import { useAppLockStore } from './appLockStore';

interface AppLockProps {
  children: React.ReactNode;
}

/**
 * AppLock component - Gates app entry when lock is enabled
 */
export function AppLock({ children }: AppLockProps) {
  const { isEnabled, isUnlocked, unlock, requiresUnlock } = useAppLockStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if app needs to be locked on mount
    requiresUnlock();
  }, [requiresUnlock]);

  if (!isEnabled || isUnlocked) {
    return <>{children}</>;
  }

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
    } catch (err) {
      setError('Failed to unlock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-surface z-50 flex items-center justify-center">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-primary mb-2">App Locked</h1>
          <p className="text-secondary">Enter your PIN to unlock</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 ${
                  i < pin.length
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-muted'
                }`}
              />
            ))}
          </div>

          {/* PIN Pad */}
          <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePinInput(num.toString())}
                className="w-16 h-16 rounded-full bg-surface-elevated text-primary text-2xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                disabled={loading || pin.length >= 4}
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleBackspace}
              className="w-16 h-16 rounded-full bg-surface-elevated text-primary hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              disabled={loading || pin.length === 0}
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => handlePinInput('0')}
              className="w-16 h-16 rounded-full bg-surface-elevated text-primary text-2xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              disabled={loading || pin.length >= 4}
            >
              0
            </button>
            <button
              type="submit"
              className="w-16 h-16 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
              disabled={loading || pin.length !== 4}
            >
              ✓
            </button>
          </div>

          {error && (
            <p className="text-center text-error text-sm mt-4">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

/**
 * App Lock Settings Component
 */
export function AppLockSettings() {
  const { isEnabled, enable, disable } = useAppLockStore();
  const [showSetup, setShowSetup] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');

  const handleToggle = async () => {
    if (isEnabled) {
      // Disable lock
      await disable();
    } else {
      // Show setup flow
      setShowSetup(true);
    }
  };

  const handlePinComplete = async () => {
    if (step === 'enter') {
      if (pin.length === 4) {
        setStep('confirm');
        setError('');
      }
    } else {
      // Confirm step
      if (pin === confirmPin) {
        try {
          await enable(pin);
          setShowSetup(false);
          setPin('');
          setConfirmPin('');
          setStep('enter');
        } catch (err) {
          setError('Failed to enable app lock. Please try again.');
        }
      } else {
        setError('PINs do not match. Please try again.');
        setPin('');
        setConfirmPin('');
        setStep('enter');
      }
    }
  };

  if (showSetup) {
    const currentPin = step === 'enter' ? pin : confirmPin;
    const setCurrentPin = step === 'enter' ? setPin : setConfirmPin;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-xl p-6 max-w-md w-full">
          <h2 className="text-xl font-bold text-primary mb-4">
            {step === 'enter' ? 'Set Your PIN' : 'Confirm Your PIN'}
          </h2>
          
          {/* PIN Display */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 ${
                  i < currentPin.length
                    ? 'bg-primary-600 border-primary-600'
                    : 'border-muted'
                }`}
              />
            ))}
          </div>

          {/* PIN Pad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => {
                  if (currentPin.length < 4) {
                    setCurrentPin(currentPin + num);
                    if (currentPin.length === 3) {
                      setTimeout(handlePinComplete, 100);
                    }
                  }
                }}
                className="w-full aspect-square rounded-lg bg-surface-elevated text-primary text-xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPin(currentPin.slice(0, -1))}
              className="w-full aspect-square rounded-lg bg-surface-elevated text-primary hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => {
                if (currentPin.length < 4) {
                  setCurrentPin(currentPin + '0');
                  if (currentPin.length === 3) {
                    setTimeout(handlePinComplete, 100);
                  }
                }
              }}
              className="w-full aspect-square rounded-lg bg-surface-elevated text-primary text-xl font-medium hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
            >
              0
            </button>
            <button
              onClick={() => setShowSetup(false)}
              className="w-full aspect-square rounded-lg bg-surface-elevated text-primary hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          {error && <p className="text-center text-error text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-default rounded-xl bg-surface">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-primary">App Lock</h3>
          <p className="text-sm text-secondary mt-1">
            Require PIN to access app
          </p>
        </div>
        <button
          onClick={handleToggle}
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
