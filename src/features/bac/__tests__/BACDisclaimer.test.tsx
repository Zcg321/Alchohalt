import { describe, expect, it, beforeEach } from 'vitest';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import BACDisclaimerModal, {
  BAC_DISCLAIMER_BODY,
  BAC_DISCLAIMER_TITLE,
  isBACDisclaimerAcknowledged,
  _resetBACDisclaimerForTests,
} from '../BACDisclaimerModal';
import { useBACDisclaimerGate } from '../useBACDisclaimerGate';

describe('[R11-B] BACDisclaimerModal', () => {
  beforeEach(() => {
    _resetBACDisclaimerForTests();
  });

  it('renders title + body verbatim from the brief', () => {
    render(<BACDisclaimerModal open onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.getByText(BAC_DISCLAIMER_TITLE)).toBeInTheDocument();
    expect(screen.getByText(BAC_DISCLAIMER_BODY)).toBeInTheDocument();
  });

  it('disclaimer body mentions: approximations, body weight, food, time, metabolism, and the only-safe-BAC-is-zero-for-driving line', () => {
    expect(BAC_DISCLAIMER_BODY).toMatch(/approximation/i);
    expect(BAC_DISCLAIMER_BODY).toMatch(/body weight/i);
    expect(BAC_DISCLAIMER_BODY).toMatch(/food/i);
    expect(BAC_DISCLAIMER_BODY).toMatch(/metabolism/i);
    expect(BAC_DISCLAIMER_BODY).toMatch(/the only safe BAC for driving is 0/i);
  });

  it('Cancel does not persist acknowledgement', () => {
    const onCancel = () => {};
    render(<BACDisclaimerModal open onConfirm={() => {}} onCancel={onCancel} />);
    fireEvent.click(screen.getByTestId('bac-disclaimer-cancel'));
    expect(isBACDisclaimerAcknowledged()).toBe(false);
  });

  it('does not render when open=false', () => {
    render(<BACDisclaimerModal open={false} onConfirm={() => {}} onCancel={() => {}} />);
    expect(screen.queryByTestId('bac-disclaimer-modal')).not.toBeInTheDocument();
  });

  it('has dialog role + aria-modal + describedby for screen readers', () => {
    render(<BACDisclaimerModal open onConfirm={() => {}} onCancel={() => {}} />);
    const modal = screen.getByTestId('bac-disclaimer-modal');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'bac-disclaimer-title');
    expect(modal).toHaveAttribute('aria-describedby', 'bac-disclaimer-body');
  });
});

describe('[R11-B] useBACDisclaimerGate', () => {
  beforeEach(() => {
    _resetBACDisclaimerForTests();
  });

  it('first call: defers the action and opens the modal', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useBACDisclaimerGate());
    act(() => result.current.requireAcknowledgement(action));
    expect(action).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(true);
  });

  it('confirm runs the action and persists acknowledgement', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useBACDisclaimerGate());
    act(() => result.current.requireAcknowledgement(action));
    act(() => result.current.onConfirm());
    expect(action).toHaveBeenCalledTimes(1);
    expect(isBACDisclaimerAcknowledged()).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it('after acknowledgement: subsequent requireAcknowledgement runs immediately, no modal', () => {
    const action1 = vi.fn();
    const { result } = renderHook(() => useBACDisclaimerGate());
    act(() => result.current.requireAcknowledgement(action1));
    act(() => result.current.onConfirm());

    const action2 = vi.fn();
    act(() => result.current.requireAcknowledgement(action2));
    expect(action2).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('cancel does NOT run the action and does NOT persist — re-prompts next time', () => {
    const action = vi.fn();
    const { result } = renderHook(() => useBACDisclaimerGate());
    act(() => result.current.requireAcknowledgement(action));
    act(() => result.current.onCancel());
    expect(action).not.toHaveBeenCalled();
    expect(isBACDisclaimerAcknowledged()).toBe(false);
    expect(result.current.isOpen).toBe(false);

    // Second attempt: re-prompts.
    act(() => result.current.requireAcknowledgement(action));
    expect(result.current.isOpen).toBe(true);
    expect(action).not.toHaveBeenCalled();
  });
});

import { vi } from 'vitest';
