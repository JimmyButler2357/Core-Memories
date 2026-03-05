import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';

// ─── Shared types ────────────────────────────────────────

/**
 * Describes WHY location is or isn't available.
 *
 * Think of it like a traffic light:
 * - 'available'         → green  — permission granted AND phone GPS is on
 * - 'services_off'      → yellow — app has permission, but the phone's
 *                                   Location Services toggle is OFF
 * - 'permission_denied' → red    — user denied or revoked app permission
 * - 'unavailable'       → red    — GPS failed for an unknown reason
 */
export type LocationStatus =
  | 'available'
  | 'services_off'
  | 'permission_denied'
  | 'unavailable';

// ─── Lightweight permission-only hook ────────────────────

interface LocationPermissionState {
  /** Whether the app has foreground location permission */
  granted: boolean;
  /** Whether the phone's Location Services toggle is on */
  servicesEnabled: boolean;
  /** Combined status — the single value screens should branch on */
  status: LocationStatus;
}

/**
 * Checks whether foreground location permission is granted AND
 * whether the phone's Location Services are enabled.
 *
 * Does NOT trigger GPS or geocoding — just two quick system queries.
 *
 * Re-checks automatically when the app returns to the foreground,
 * so if the user flips Location Services on/off in phone settings
 * and comes back, the status updates immediately.
 *
 * Use this on screens that only need to know "should I show location UI?"
 * (e.g., Entry Detail, Settings). For screens that actually capture
 * location, use useLocation() instead.
 */
export function useLocationPermission(): LocationPermissionState {
  const [state, setState] = useState<LocationPermissionState>({
    granted: false,
    servicesEnabled: true,
    status: 'permission_denied',
  });

  const check = useCallback(async () => {
    try {
      const [servicesEnabled, { status }] = await Promise.all([
        Location.hasServicesEnabledAsync(),
        Location.getForegroundPermissionsAsync(),
      ]);

      const granted = status === 'granted';

      let locationStatus: LocationStatus;
      if (!granted) locationStatus = 'permission_denied';
      else if (!servicesEnabled) locationStatus = 'services_off';
      else locationStatus = 'available';

      setState({ granted, servicesEnabled, status: locationStatus });
    } catch {
      setState({ granted: false, servicesEnabled: false, status: 'unavailable' });
    }
  }, []);

  // Check on mount
  useEffect(() => {
    check();
  }, [check]);

  // Re-check when app returns to foreground (user may have toggled
  // Location Services in phone settings and come back)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') check();
    });
    return () => sub.remove();
  }, [check]);

  return state;
}

// ─── Full location detection hook ────────────────────────

interface LocationState {
  /** Readable place name, e.g. "Tampa, FL" — or null if unavailable */
  locationText: string | null;
  /** True while detecting location */
  loading: boolean;
  /** Friendly error message, or null */
  error: string | null;
  /** Whether the user has granted foreground location permission */
  permissionGranted: boolean;
  /** Detailed reason for location availability */
  status: LocationStatus;
}

/**
 * Hook that auto-detects the device location and reverse-geocodes it
 * to a readable label like "Tampa, FL".
 *
 * Think of it like sending someone to check the address while you talk —
 * by the time you're done recording, the location is ready.
 *
 * Checks three things in order:
 * 1. App permission (did the user allow location for this app?)
 * 2. Location Services (is the phone's GPS toggle on?)
 * 3. GPS + geocoding (can we actually get coordinates and a city name?)
 *
 * If any check fails, it returns null silently.
 * Location is always optional — never blocks the recording flow.
 */
export function useLocation(): LocationState & { refresh: () => void } {
  const [state, setState] = useState<LocationState>({
    locationText: null,
    loading: true,
    error: null,
    permissionGranted: false,
    status: 'permission_denied',
  });

  // Track whether the component is still mounted so async work
  // doesn't try to update state after unmount
  const detect = useCallback(async (cancelled: () => boolean) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check current permission status (doesn't trigger a prompt)
      const { status } = await Location.getForegroundPermissionsAsync();

      if (cancelled()) return;

      if (status !== 'granted') {
        setState({ locationText: null, loading: false, error: null, permissionGranted: false, status: 'permission_denied' });
        return;
      }

      // Check if the phone's Location Services toggle is on.
      // Without this, getCurrentPositionAsync() would sit and wait
      // for a 10-second timeout before failing silently.
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (cancelled()) return;

      if (!servicesEnabled) {
        setState({ locationText: null, loading: false, error: null, permissionGranted: true, status: 'services_off' });
        return;
      }

      // Get coordinates — balanced accuracy is fast enough for city-level,
      // with a 10-second timeout so we don't block indoors
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
      });

      if (cancelled()) return;

      // Reverse geocode coordinates → readable address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (cancelled()) return;

      let locationText: string | null = null;
      if (address) {
        // Build a label like "Tampa, FL" or "London, England"
        const parts: string[] = [];
        if (address.city) parts.push(address.city);
        if (address.region) parts.push(address.region);

        // Fallback: if no city or region, try country
        if (parts.length === 0 && address.country) {
          parts.push(address.country);
        }

        locationText = parts.length > 0 ? parts.join(', ') : null;
      }

      setState({ locationText, loading: false, error: null, permissionGranted: true, status: 'available' });
    } catch {
      if (cancelled()) return;
      // Silent failure — location is never required
      setState({ locationText: null, loading: false, error: 'Could not detect location', permissionGranted: false, status: 'unavailable' });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    detect(() => cancelled);
    return () => { cancelled = true; };
  }, [detect]);

  // Re-check when app returns to foreground (user may have toggled
  // Location Services in phone settings while recording was open)
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') detect(() => false);
    });
    return () => sub.remove();
  }, [detect]);

  // Refresh: re-run detection (e.g., user moved and wants updated location)
  const refresh = useCallback(() => {
    detect(() => false);
  }, [detect]);

  return { ...state, refresh };
}
