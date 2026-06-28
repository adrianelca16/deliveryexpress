import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { useThemeStore } from '@/store/theme.store';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  className = '',
}: ButtonProps) {
  const { darkMode } = useThemeStore();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sizeStyles: Record<Size, string> = {
    sm: 'py-2 px-4 rounded-xl',
    md: 'py-3.5 px-6 rounded-2xl',
    lg: 'py-4 px-8 rounded-2xl',
  };

  const variantStyles: Record<Variant, string> = {
    primary: darkMode ? 'bg-purple-600' : 'bg-primary',
    secondary: 'bg-secondary',
    outline: `border-2 ${darkMode ? 'border-purple-400' : 'border-primary'}`,
    ghost: '',
  };

  const textStyles: Record<Variant, string> = {
    primary: 'text-white',
    secondary: 'text-white',
    outline: darkMode ? 'text-purple-400' : 'text-primary',
    ghost: darkMode ? 'text-purple-400' : 'text-primary',
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => { scale.value = withSpring(0.96); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      className={`
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${disabled ? 'opacity-50' : ''}
        flex-row items-center justify-center gap-2
        shadow-lg shadow-purple-500/20
        ${className}
      `}
      style={animatedStyle}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator color="white" size="small" />
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text className={`font-bold text-base ${textStyles[variant]}`}>
            {title}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}
