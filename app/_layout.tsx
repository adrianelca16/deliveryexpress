import { SplashScreen, Stack } from "expo-router";
import { Platform } from "react-native";
import './global.css';
if (Platform.OS === 'web') { require('leaflet/dist/leaflet.css'); }
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import { View, StatusBar, LogBox } from "react-native";
import { useThemeStore } from "@/store/theme.store";
import { setBackgroundColorAsync } from 'expo-system-ui';

LogBox.ignoreLogs([
  'AxiosError',
  'Request failed with status code',
  'Network Error',
  'Failed to fetch',
]);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require('../assets/fonts/Quicksand-Bold.ttf'),
    "QuickSand-Medium": require('../assets/fonts/Quicksand-Medium.ttf'),
    "QuickSand-Regular": require('../assets/fonts/Quicksand-Regular.ttf'),
    "QuickSand-SemiBold": require('../assets/fonts/Quicksand-SemiBold.ttf'),
    "QuickSand-Light": require('../assets/fonts/Quicksand-Light.ttf'),
  });
  const darkMode = useThemeStore((s) => s.darkMode);
  const [hydrated, setHydrated] = useState(useThemeStore.persist.hasHydrated());

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    const unsub = useThemeStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useThemeStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!fontsLoaded || !hydrated) return;
    const bg = darkMode ? '#111827' : '#FFFFFF';
    setBackgroundColorAsync(bg);
    SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated, darkMode]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#111827' : '#FFFFFF' }}>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={darkMode ? "#111827" : "#FFFFFF"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </View>
  );
}
