import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme.store';
import { useState } from 'react';

interface Option {
  label: string;
  value: string;
}

interface ThemePickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Option[];
  placeholder?: string;
  containerStyle?: string;
  disabled?: boolean;
}

export default function ThemePicker({ selectedValue, onValueChange, items, placeholder, containerStyle, disabled }: ThemePickerProps) {
  const { darkMode } = useThemeStore();
  const [visible, setVisible] = useState(false);

  const selectedLabel = items.find(i => i.value === selectedValue)?.label || placeholder || 'Seleccionar';

  const containerClass = `${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-xl px-4 py-3.5`;

  return (
    <>
      <TouchableOpacity
        onPress={() => !disabled && setVisible(true)}
        className={`flex-row items-center justify-between mb-4 ${containerClass} ${containerStyle || ""}`}
        style={disabled && { opacity: 0.5 }}
      >
        <Text className={`font-semibold ${selectedValue ? (darkMode ? "text-white" : "text-gray-900") : (darkMode ? "text-gray-400" : "text-gray-500")}`}>
          {selectedLabel}
        </Text>
        <Ionicons name="chevron-down" size={20} color={(disabled ? "#6B7280" : (darkMode ? "#9CA3AF" : "#2563EB"))} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={[{ borderRadius: 16, width: '80%', maxHeight: '60%', overflow: 'hidden' }, darkMode ? { backgroundColor: '#1F2937' } : { backgroundColor: '#FFFFFF' }]}
          >
            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                  className={`px-5 py-4 ${item.value === selectedValue ? (darkMode ? "bg-gray-700" : "bg-blue-50") : ""}`}
                >
                  <Text className={`text-base ${item.value === selectedValue ? "text-primary font-bold" : (darkMode ? "text-white" : "text-gray-900")}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}