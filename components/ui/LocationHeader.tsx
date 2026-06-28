import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme.store';

interface LocationHeaderProps {
  direccionTexto?: string | null;
  onLocationPress?: () => void;
}

export default function LocationHeader({
  direccionTexto,
  onLocationPress,
}: LocationHeaderProps) {
  const { darkMode } = useThemeStore();

  return (
    <TouchableOpacity onPress={onLocationPress} className="flex-row items-center py-1">
      <Ionicons name="location-outline" size={24} color={darkMode ? "#60A5FA" : "#2563EB"} />
      <View className="ml-2 flex-1">
        <Text className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
          Añadir ubicación
        </Text>
        <Text className={`font-bold text ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} numberOfLines={1}>
          {direccionTexto || "Añadir direccion"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}