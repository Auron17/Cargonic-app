jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { LocationPoint } from '../api/types';
import { tripsApi } from '../api/client';
import {
  addToQueue,
  clearQueue,
  enqueueLocations,
  flushQueue,
  getQueueStorageKey,
  isSendableQueue,
  loadQueue,
  removeFromQueue,
  saveQueue,
  takeBatch,
} from './queue';

describe('Tracking queue logic', () => {
  const p1: LocationPoint = {
    lat: 41.3,
    lng: 69.2,
    speedKmh: 50,
    heading: 90,
    recordedAt: '2026-10-06T07:00:00.000Z',
  };

  const p2: LocationPoint = {
    lat: 41.31,
    lng: 69.21,
    speedKmh: 60,
    heading: 95,
    recordedAt: '2026-10-06T07:00:30.000Z',
  };

  const p3: LocationPoint = {
    lat: 41.32,
    lng: 69.22,
    speedKmh: 55,
    heading: 100,
    recordedAt: '2026-10-06T07:01:00.000Z',
  };

  const p4: LocationPoint = {
    lat: 41.33,
    lng: 69.23,
    speedKmh: 65,
    heading: 105,
    recordedAt: '2026-10-06T07:01:30.000Z',
  };

  const p5: LocationPoint = {
    lat: 41.34,
    lng: 69.24,
    speedKmh: 70,
    heading: 110,
    recordedAt: '2026-10-06T07:02:00.000Z',
  };

  describe('addToQueue', () => {
    it('adds new points to an empty queue in chronological order', () => {
      const result = addToQueue([], [p2, p1]);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(p1);
      expect(result[1]).toEqual(p2);
    });

    it('ignores duplicates with matching recordedAt and coordinates', () => {
      const initial = [p1, p2];
      const result = addToQueue(initial, [p2, p3]);
      expect(result).toHaveLength(3);
      expect(result).toEqual([p1, p2, p3]);
    });

    it('handles out-of-order points and sorts them correctly', () => {
      const result = addToQueue([p3, p1], [p2]);
      expect(result).toEqual([p1, p2, p3]);
    });

    it('returns a copy of existing queue if new points is empty', () => {
      const initial = [p1, p2];
      const result = addToQueue(initial, []);
      expect(result).toEqual(initial);
      expect(result).not.toBe(initial);
    });
  });

  describe('takeBatch', () => {
    it('returns empty batch and remaining for empty queue', () => {
      const { batch, remaining } = takeBatch([]);
      expect(batch).toEqual([]);
      expect(remaining).toEqual([]);
    });

    it('splits queue into batch and remaining using default batchSize', () => {
      const queue = [p1, p2, p3, p4, p5];
      const { batch, remaining } = takeBatch(queue, 3);
      expect(batch).toEqual([p1, p2, p3]);
      expect(remaining).toEqual([p4, p5]);
    });

    it('returns all items in batch when queue is smaller than batchSize', () => {
      const queue = [p1, p2];
      const { batch, remaining } = takeBatch(queue, 100);
      expect(batch).toEqual([p1, p2]);
      expect(remaining).toEqual([]);
    });
  });

  describe('removeFromQueue', () => {
    it('removes sent points accurately', () => {
      const queue = [p1, p2, p3, p4, p5];
      const sent = [p1, p3];
      const result = removeFromQueue(queue, sent);
      expect(result).toEqual([p2, p4, p5]);
    });

    it('returns unmodified queue if sent points is empty', () => {
      const queue = [p1, p2];
      const result = removeFromQueue(queue, []);
      expect(result).toEqual([p1, p2]);
    });

    it('handles removing points not found in queue gracefully', () => {
      const queue = [p1, p2];
      const stranger: LocationPoint = {
        lat: 42.0,
        lng: 70.0,
        recordedAt: '2026-10-06T09:00:00.000Z',
      };
      const result = removeFromQueue(queue, [stranger]);
      expect(result).toEqual([p1, p2]);
    });
  });

  describe('isSendableQueue', () => {
    it('returns false for empty queue', () => {
      expect(isSendableQueue(0)).toBe(false);
      expect(isSendableQueue(0, 5, true)).toBe(false);
    });

    it('returns false when queue length is below threshold without force', () => {
      expect(isSendableQueue(4, 5, false)).toBe(false);
    });

    it('returns true when queue length meets or exceeds threshold', () => {
      expect(isSendableQueue(5, 5, false)).toBe(true);
      expect(isSendableQueue(10, 5, false)).toBe(true);
    });

    it('returns true for any non-empty queue when force is true', () => {
      expect(isSendableQueue(1, 5, true)).toBe(true);
      expect(isSendableQueue(3, 5, true)).toBe(true);
    });
  });

  describe('Queue storage and async sync operations', () => {
    const testTripId = 'trip-storage-test';

    beforeEach(async () => {
      await clearQueue(testTripId);
    });

    describe('getQueueStorageKey', () => {
      it('returns proper storage key with prefix and tripId', () => {
        expect(getQueueStorageKey(testTripId)).toBe('@yuk_tracking_queue_trip-storage-test');
      });
    });

    describe('loadQueue / saveQueue / clearQueue', () => {
      it('returns empty array when queue does not exist in storage', async () => {
        const queue = await loadQueue('non-existent-trip');
        expect(queue).toEqual([]);
      });

      it('saves points to storage and loads them back', async () => {
        await saveQueue(testTripId, [p1, p2]);
        const loaded = await loadQueue(testTripId);
        expect(loaded).toEqual([p1, p2]);
      });

      it('clears persisted queue from storage', async () => {
        await saveQueue(testTripId, [p1, p2]);
        await clearQueue(testTripId);
        const loaded = await loadQueue(testTripId);
        expect(loaded).toEqual([]);
      });

      it('removes storage key when saving empty queue', async () => {
        await saveQueue(testTripId, [p1]);
        await saveQueue(testTripId, []);
        const loaded = await loadQueue(testTripId);
        expect(loaded).toEqual([]);
      });
    });

    describe('enqueueLocations', () => {
      it('persists new points and returns updated queue', async () => {
        const first = await enqueueLocations(testTripId, [p1]);
        expect(first).toEqual([p1]);

        const second = await enqueueLocations(testTripId, [p2]);
        expect(second).toEqual([p1, p2]);

        const loaded = await loadQueue(testTripId);
        expect(loaded).toEqual([p1, p2]);
      });
    });

    describe('flushQueue', () => {
      it('does not send if queue is smaller than 5 and force is false', async () => {
        await saveQueue(testTripId, [p1, p2]);
        const mockApi: Pick<typeof tripsApi, 'sendLocations'> = {
          sendLocations: jest.fn().mockResolvedValue({ accepted: 2 }),
        };

        const result = await flushQueue(testTripId, false, mockApi);
        expect(result).toEqual({ sentCount: 0, remainingCount: 2 });
        expect(mockApi.sendLocations).not.toHaveBeenCalled();
      });

      it('sends points when force is true even if smaller than 5', async () => {
        await saveQueue(testTripId, [p1, p2]);
        const mockApi: Pick<typeof tripsApi, 'sendLocations'> = {
          sendLocations: jest.fn().mockResolvedValue({ accepted: 2 }),
        };

        const result = await flushQueue(testTripId, true, mockApi);
        expect(result).toEqual({ sentCount: 2, remainingCount: 0 });
        expect(mockApi.sendLocations).toHaveBeenCalledWith(testTripId, {
          points: [p1, p2],
        });

        const remaining = await loadQueue(testTripId);
        expect(remaining).toEqual([]);
      });

      it('sends points automatically when threshold of 5 is met', async () => {
        await saveQueue(testTripId, [p1, p2, p3, p4, p5]);
        const mockApi: Pick<typeof tripsApi, 'sendLocations'> = {
          sendLocations: jest.fn().mockResolvedValue({ accepted: 5 }),
        };

        const result = await flushQueue(testTripId, false, mockApi);
        expect(result).toEqual({ sentCount: 5, remainingCount: 0 });
        expect(mockApi.sendLocations).toHaveBeenCalledWith(testTripId, {
          points: [p1, p2, p3, p4, p5],
        });

        const remaining = await loadQueue(testTripId);
        expect(remaining).toEqual([]);
      });

      it('stops and retains queue in storage if sending fails', async () => {
        await saveQueue(testTripId, [p1, p2, p3, p4, p5]);
        const mockApi: Pick<typeof tripsApi, 'sendLocations'> = {
          sendLocations: jest.fn().mockRejectedValue(new Error('Network offline')),
        };

        const result = await flushQueue(testTripId, false, mockApi);
        expect(result).toEqual({ sentCount: 0, remainingCount: 5 });

        const remaining = await loadQueue(testTripId);
        expect(remaining).toEqual([p1, p2, p3, p4, p5]);
      });
    });
  });
});
