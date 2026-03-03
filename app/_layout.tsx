import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  Merriweather_400Regular,
  Merriweather_700Bold,
  Merriweather_900Black,
} from '@expo-google-fonts/merriweather';

import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth.service';
import { colors } from '@/constants/theme';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Merriweather_400Regular,
    Merriweather_700Bold,
    Merriweather_900Black,
  });

  const isLoading = useAuthStore((s) => s.isLoading);
  const initialize = useAuthStore((s) => s.initialize);
  const handleAuthChange = useAuthStore((s) => s.handleAuthChange);

  // On mount: check for an existing Supabase session.
  // Think of this as the app "waking up" and checking if someone
  // is already logged in (like a hotel checking if a guest's
  // keycard is still active).
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for auth state changes (login, logout, token refresh).
  // This keeps the store in sync whenever Supabase's auth state
  // changes — even if it happens in the background (e.g. token
  // auto-refresh). Think of it as a "doorbell" that rings whenever
  // someone enters or leaves.
  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange(
      (_event, session) => {
        handleAuthChange(session);
      },
    );

    return () => subscription.unsubscribe();
  }, [handleAuthChange]);

  // Show a warm-colored loading screen while fonts load and
  // auth state is being checked. This prevents a flash of the
  // wrong screen (like briefly seeing onboarding when the user
  // is actually logged in).
  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(main)" />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});
