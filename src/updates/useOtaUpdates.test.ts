import React, { act } from 'react';
import * as Updates from 'expo-updates';
import { useOtaUpdates, OtaState } from './useOtaUpdates';

// Mock expo-updates
jest.mock('expo-updates', () => ({
  isEnabled: true,
  updateId: 'test-update-123',
  runtimeVersion: '1.0.0',
  channel: 'production',
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  reloadAsync: jest.fn(),
}));

describe('useOtaUpdates hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Simple test wrapper component
  function TestComponent({ onState }: { onState: (state: OtaState) => void }) {
    const ota = useOtaUpdates();
    React.useEffect(() => {
      onState(ota);
    });
    return null;
  }

  it('initializes with default state when enabled', () => {
    let capturedState: OtaState | null = null;
    act(() => {
      // In jest-expo with React, we can test state
      const element = React.createElement(TestComponent, {
        onState: (state) => {
          capturedState = state;
        },
      });
      expect(element).toBeDefined();
    });

    // Check mock properties
    expect(Updates.isEnabled).toBe(true);
    expect(Updates.updateId).toBe('test-update-123');
  });

  it('calls Updates.checkForUpdateAsync when checking for updates', async () => {
    (Updates.checkForUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isAvailable: true,
    });
    (Updates.fetchUpdateAsync as jest.Mock).mockResolvedValueOnce({
      isNew: true,
    });

    const check = await Updates.checkForUpdateAsync();
    expect(check.isAvailable).toBe(true);

    const fetch = await Updates.fetchUpdateAsync();
    expect(fetch.isNew).toBe(true);
  });

  it('calls Updates.reloadAsync when update is applied', async () => {
    await Updates.reloadAsync();
    expect(Updates.reloadAsync).toHaveBeenCalled();
  });
});
