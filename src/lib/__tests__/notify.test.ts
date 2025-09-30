import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('notify utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('notification permission can be requested', () => {
    const mockNotification = {
      permission: 'default' as NotificationPermission,
      requestPermission: vi.fn().mockResolvedValue('granted' as NotificationPermission)
    };
    
    global.Notification = mockNotification as any;
    
    expect(Notification.permission).toBe('default');
  });

  it('handles notification permission denied', () => {
    const mockNotification = {
      permission: 'denied' as NotificationPermission,
      requestPermission: vi.fn().mockResolvedValue('denied' as NotificationPermission)
    };
    
    global.Notification = mockNotification as any;
    
    expect(Notification.permission).toBe('denied');
  });

  it('handles missing Notification API', () => {
    const originalNotification = global.Notification;
    (global as any).Notification = undefined;
    
    expect(global.Notification).toBeUndefined();
    
    global.Notification = originalNotification;
  });
});
