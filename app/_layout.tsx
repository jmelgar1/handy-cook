import '../global.css';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { foodClassificationService } from '@/services/foodClassificationService';

export default function RootLayout() {
  // Initialize food classification service on app start
  useEffect(() => {
    const initClassificationService = async () => {
      try {
        await foodClassificationService.initialize();
        // Sync from backend if cache is stale (non-blocking)
        foodClassificationService.syncFromBackend().catch((err) => {
          console.warn('[App] Failed to sync classification data:', err);
        });
      } catch (err) {
        console.warn('[App] Failed to initialize classification service:', err);
      }
    };

    initClassificationService();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen
            name="recipe/[id]"
            options={{
              headerShown: true,
              title: 'Recipe',
              presentation: 'card',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
