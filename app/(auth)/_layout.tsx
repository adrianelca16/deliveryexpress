import { View } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeStore } from "@/store/theme.store";

export default function AuthLayout() {
  const darkMode = useThemeStore((s) => s.darkMode);

  if (darkMode) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111827' }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <LinearGradient
        colors={['rgba(124, 58, 237, 0.08)', 'transparent']}
        className="absolute inset-0"
      />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }} />
    </View>
  );
}
