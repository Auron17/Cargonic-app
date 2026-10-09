import {
  canCarrierMove,
  cancellableByCarrier,
  formatDistance,
  geofenceTarget,
  getNextStatus,
  getStatusActionLabel,
  isActiveTrip,
  isFinalStatus,
  outOfZoneMessage,
  requiresPhoto,
} from './nextStatus';

describe('Trip nextStatus state machine', () => {
  describe('getNextStatus and canCarrierMove', () => {
    it('moves from ASSIGNED to EN_ROUTE_TO_PICKUP', () => {
      expect(getNextStatus('ASSIGNED')).toBe('EN_ROUTE_TO_PICKUP');
      expect(canCarrierMove('ASSIGNED', 'EN_ROUTE_TO_PICKUP')).toBe(true);
    });

    it('moves from EN_ROUTE_TO_PICKUP to AT_PICKUP', () => {
      expect(getNextStatus('EN_ROUTE_TO_PICKUP')).toBe('AT_PICKUP');
      expect(canCarrierMove('EN_ROUTE_TO_PICKUP', 'AT_PICKUP')).toBe(true);
    });

    it('moves from AT_PICKUP to LOADED', () => {
      expect(getNextStatus('AT_PICKUP')).toBe('LOADED');
      expect(canCarrierMove('AT_PICKUP', 'LOADED')).toBe(true);
    });

    it('moves from LOADED to DELIVERED', () => {
      expect(getNextStatus('LOADED')).toBe('DELIVERED');
      expect(canCarrierMove('LOADED', 'DELIVERED')).toBe(true);
    });

    it('does not allow carrier to move past DELIVERED', () => {
      expect(getNextStatus('DELIVERED')).toBeNull();
      expect(canCarrierMove('DELIVERED', 'COMPLETED')).toBe(false);
    });

    it('does not allow invalid skipping or backwards transitions', () => {
      expect(canCarrierMove('ASSIGNED', 'LOADED')).toBe(false);
      expect(canCarrierMove('LOADED', 'AT_PICKUP')).toBe(false);
      expect(canCarrierMove('CANCELLED', 'ASSIGNED')).toBe(false);
      expect(canCarrierMove('COMPLETED', 'ASSIGNED')).toBe(false);
    });
  });

  describe('requiresPhoto', () => {
    it('requires photo for LOADED and DELIVERED', () => {
      expect(requiresPhoto('LOADED')).toBe(true);
      expect(requiresPhoto('DELIVERED')).toBe(true);
    });

    it('does not require photo for other statuses', () => {
      expect(requiresPhoto('EN_ROUTE_TO_PICKUP')).toBe(false);
      expect(requiresPhoto('AT_PICKUP')).toBe(false);
      expect(requiresPhoto('ASSIGNED')).toBe(false);
      expect(requiresPhoto('COMPLETED')).toBe(false);
      expect(requiresPhoto('CANCELLED')).toBe(false);
    });
  });

  describe('cancellableByCarrier', () => {
    it('allows carrier to cancel before loading', () => {
      expect(cancellableByCarrier('ASSIGNED')).toBe(true);
      expect(cancellableByCarrier('EN_ROUTE_TO_PICKUP')).toBe(true);
      expect(cancellableByCarrier('AT_PICKUP')).toBe(true);
    });

    it('forbids carrier from cancelling once loaded or later', () => {
      expect(cancellableByCarrier('LOADED')).toBe(false);
      expect(cancellableByCarrier('DELIVERED')).toBe(false);
      expect(cancellableByCarrier('COMPLETED')).toBe(false);
      expect(cancellableByCarrier('CANCELLED')).toBe(false);
    });
  });

  describe('isFinalStatus and isActiveTrip', () => {
    it('detects final statuses', () => {
      expect(isFinalStatus('COMPLETED')).toBe(true);
      expect(isFinalStatus('CANCELLED')).toBe(true);
      expect(isFinalStatus('ASSIGNED')).toBe(false);
      expect(isFinalStatus('DELIVERED')).toBe(false);
    });

    it('detects active trips', () => {
      expect(isActiveTrip('ASSIGNED')).toBe(true);
      expect(isActiveTrip('EN_ROUTE_TO_PICKUP')).toBe(true);
      expect(isActiveTrip('AT_PICKUP')).toBe(true);
      expect(isActiveTrip('LOADED')).toBe(true);
      expect(isActiveTrip('DELIVERED')).toBe(true);
      expect(isActiveTrip('COMPLETED')).toBe(false);
      expect(isActiveTrip('CANCELLED')).toBe(false);
    });
  });

  describe('getStatusActionLabel', () => {
    it('returns proper action label for next status', () => {
      expect(getStatusActionLabel('EN_ROUTE_TO_PICKUP')).toBe('Yo‘lga chiqdim');
      expect(getStatusActionLabel('AT_PICKUP')).toBe('Yetib keldim');
      expect(getStatusActionLabel('LOADED')).toBe('Yuk ortildi');
      expect(getStatusActionLabel('DELIVERED')).toBe('Topshirdim');
      expect(getStatusActionLabel(null)).toBe('');
    });
  });

  describe('geofence', () => {
    it('checks arrival and loading at pickup, delivery at dropoff', () => {
      expect(geofenceTarget('AT_PICKUP')).toBe('PICKUP');
      expect(geofenceTarget('LOADED')).toBe('PICKUP');
      expect(geofenceTarget('DELIVERED')).toBe('DROPOFF');
      expect(geofenceTarget('EN_ROUTE_TO_PICKUP')).toBeNull();
    });

    it('formats distances in metres and kilometres', () => {
      expect(formatDistance(300)).toBe('300 m');
      expect(formatDistance(849.6)).toBe('850 m');
      expect(formatDistance(1234)).toBe('1,2 km');
    });

    it('builds an out-of-zone message from server details', () => {
      expect(outOfZoneMessage({ target: 'PICKUP', distanceM: 1234, radiusM: 300 })).toBe(
        'Siz ortish joyidan 1,2 km uzoqdasiz. Manzilga 300 m gacha yaqinlashgach qayta urinib ko‘ring.'
      );
      expect(outOfZoneMessage({ target: 'DROPOFF', distanceM: 640, radiusM: 300 })).toContain(
        'topshirish manzilidan 640 m'
      );
      expect(outOfZoneMessage(undefined)).toBeNull();
      expect(outOfZoneMessage({ target: 'PICKUP' })).toBeNull();
    });
  });
});
