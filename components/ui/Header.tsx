import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/store/theme.store';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  gradient?: boolean;
  className?: string;
  onBack?: () => void;
  backHref?: string;
}

export default function Header({
  title,
  showBack = false,
  rightAction,
  leftAction,
  gradient = false,
  className = '',
  onBack,
  backHref,
}: HeaderProps) {
  const { darkMode } = useThemeStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref as any);
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const content = (
    <View className={`flex-row items-center justify-between px-5 pt-2 ${className}`}>
      {leftAction ? (
        <View className="flex-1 mr-3">{leftAction}</View>
      ) : (
        <View className="w-10">
          {showBack && (
            <TouchableOpacity onPress={handleBack}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={darkMode ? '#F9FAFB' : '#2563EB'}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {title && (
        <Text
          className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-primary'}`}
        >
          {title}
        </Text>
      )}

      <View className="w-10 items-end">
        {rightAction}
      </View>
    </View>
  );

  if (gradient && !darkMode) {
    return (
      <LinearGradient colors={['rgba(37,99,235,0.1)', 'transparent']} className="pt-2">
        {content}
      </LinearGradient>
    );
  }

  return content;
}