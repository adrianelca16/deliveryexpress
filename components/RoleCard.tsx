import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const ROLE_ICONS: Record<string, string> = {
  cliente: 'fast-food-outline',
  repartidor: 'bicycle-outline',
  conductor: 'bicycle-outline',
  comercio: 'storefront-outline',
  admin: 'shield-checkmark-outline',
};

const ROLE_ACTIONS: Record<string, string> = {
  cliente: 'Pedir Ahora',
  repartidor: 'Empezar a Ganar',
  conductor: 'Empezar a Ganar',
  comercio: 'Administrar Negocio',
  admin: 'Gestionar',
};

const ROLE_ICON_COLORS: Record<string, string> = {
  cliente: '#2563EB',
  repartidor: '#2563EB',
  conductor: '#2563EB',
  comercio: '#2563EB',
  admin: '#2563EB',
};

function resolveIcon(roleName: string, apiIcon?: string): string {
  if (apiIcon) return apiIcon;
  return ROLE_ICONS[roleName?.toLowerCase()] || 'person-outline';
}

function resolveAction(roleName: string): string {
  return ROLE_ACTIONS[roleName?.toLowerCase()] || 'Ingresar';
}

function resolveAccentColor(roleName: string): string {
  return ROLE_ICON_COLORS[roleName?.toLowerCase()] || '#2563EB';
}

interface RoleCardProps {
  roleName: string;
  description?: string;
  iconName?: string;
  actionLabel?: string;
  onPress: () => void;
  delay?: number;
  darkMode?: boolean;
}

export default function RoleCard({
  roleName,
  description,
  iconName,
  actionLabel,
  onPress,
  delay = 0,
  darkMode = false,
}: RoleCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const icon = resolveIcon(roleName, iconName);
  const label = actionLabel || resolveAction(roleName);
  const accent = resolveAccentColor(roleName);

  return (
    <Animated.View entering={FadeInUp.delay(delay).duration(500)}>
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={animatedStyle}
      >
        <View
          className={`
            rounded-3xl p-6
            ${darkMode
              ? 'bg-gray-800 border border-gray-700'
              : 'bg-white border border-gray-100'
            }
            ${darkMode
              ? ''
              : 'shadow-lg shadow-gray-200/80'
            }
          `}
        >
          <View className="items-center mb-5">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center"
              style={{ backgroundColor: `${accent}12` }}
            >
              <Ionicons name={icon as any} size={30} color={accent} />
            </View>
          </View>

          <Text
            className={`text-center text-xl font-bold mb-1.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            {roleName}
          </Text>

          {description ? (
            <Text
              className={`text-center text-sm leading-5 mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}
            >
              {description}
            </Text>
          ) : (
            <View className="mb-5" />
          )}

          <View className="items-center">
            <View
              className="py-2.5 px-8 rounded-full"
              style={{ backgroundColor: accent }}
            >
              <Text className="text-white font-semibold text-base">{label}</Text>
            </View>
          </View>
        </View>
      </AnimatedTouchable>
    </Animated.View>
  );
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
