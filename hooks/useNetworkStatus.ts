// Network status hook — monitors live internet connectivity.
//
// Think of it like a traffic light for your internet connection:
// green (online) means data can flow to Supabase, red (offline)
// means we need to save things locally until it turns green again.
//
// Uses NetInfo under the hood, which listens for OS-level
// connectivity changes (WiFi on/off, airplane mode, etc.).

import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  // Start optimistic — assume online until we hear otherwise.
  // On startup, NetInfo's `isInternetReachable` can be null
  // (meaning "I don't know yet"), so treating that as online
  // prevents the app from acting offline during the first second.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Subscribe to connectivity changes. NetInfo calls this
    // callback immediately with the current state, then again
    // whenever it changes (like a doorbell that also rings
    // when you first install it to tell you it's working).
    const unsubscribe = NetInfo.addEventListener((state) => {
      // `isInternetReachable` is the most reliable signal.
      // `isConnected` only means "attached to a network" (you
      // could be on WiFi with no actual internet). But if
      // `isInternetReachable` is null (startup), we fall back
      // to `isConnected`, then default to true (optimistic).
      const reachable = state.isInternetReachable ?? state.isConnected ?? true;
      setIsOnline(reachable);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
