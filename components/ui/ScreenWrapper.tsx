import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/theme.store';

interface ScreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  safe?: boolean;
}

export default function ScreenWrapper({
  children,
  className = '',
  gradient = false,
  safe = true,
}: ScreenWrapperProps) {
  const { darkMode } = useThemeStore();

  const Container = safe ? SafeAreaView : View;

  if (gradient && !darkMode) {
    return (
      <View className={`flex-1 ${className}`}>
        <LinearGradient
          colors={['rgba(37, 99, 235, 0.06)', 'transparent']}
          className="absolute inset-0"
        />
        <Container className="flex-1">{children}</Container>
      </View>
    );
  }

  return (
    <Container className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'} ${className}`}>
      {children}
    </Container>
  );
}
