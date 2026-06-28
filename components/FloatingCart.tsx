import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/theme.store";

interface Props {
  totalItems: number;
  onPress: () => void;
}

const FloatingCart = ({ totalItems, onPress }: Props) => {
  const darkMode = useThemeStore((s) => s.darkMode)
  if (totalItems === 0) return null;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-12 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center elevation-lg"
      activeOpacity={0.9}
    >
      <Ionicons name="cart" size={28} color="white" />

      <View className={`absolute -top-1 -right-1 rounded-full px-2 py-0.5 ${darkMode ? "bg-gray-800" : "bg-white"}`} style={{ borderWidth: 1, borderColor: '#2563EB' }}>
        <Text className="font-bold text-xs" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>{totalItems}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default FloatingCart;