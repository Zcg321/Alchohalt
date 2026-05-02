import { useCallback, useState } from 'react';
import {
  isBACDisclaimerAcknowledged,
  setBACDisclaimerAcknowledged,
} from './BACDisclaimerModal';

/**
 * [R11-B] Hook for gating any future BAC-related feature behind the
 * one-time disclaimer.
 *
 * Usage pattern (for whoever wires the BAC UI later):
 *
 *   const bacGate = useBACDisclaimerGate();
 *
 *   function onUserToggleBACOn() {
 *     bacGate.requireAcknowledgement(() => {
 *       // only runs after user confirms the modal — or immediately if
 *       // they've already acknowledged it on this device.
 *       setSettings({ showBAC: true });
 *     });
 *   }
 *
 *   return (
 *     <>
 *       {bacGate.modal}
 *       <Toggle onChange={onUserToggleBACOn} />
 *     </>
 *   );
 *
 * The hook returns the modal node itself so the caller doesn't have to
 * thread state. Acknowledgement is sticky on the device — confirming
 * once means it never shows again, dismissing leaves it un-set so
 * the next attempt re-prompts.
 */
export function useBACDisclaimerGate() {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAcknowledgement = useCallback((action: () => void) => {
    if (isBACDisclaimerAcknowledged()) {
      action();
      return;
    }
    setPendingAction(() => action);
  }, []);

  const onConfirm = useCallback(() => {
    setBACDisclaimerAcknowledged();
    if (pendingAction) pendingAction();
    setPendingAction(null);
  }, [pendingAction]);

  const onCancel = useCallback(() => {
    setPendingAction(null);
  }, []);

  return {
    requireAcknowledgement,
    isOpen: pendingAction !== null,
    onConfirm,
    onCancel,
  };
}
