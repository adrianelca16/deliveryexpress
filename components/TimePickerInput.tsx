import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from '@expo/vector-icons';

interface TimePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const formatTo12Hour = (date: Date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, '0');
  return `${hour12}:${paddedMinutes} ${period}`;
};

export default function TimePickerInput({ label, value, onChange }: TimePickerInputProps) {
  const darkMode = useThemeStore((s) => s.darkMode);
  const [visible, setVisible] = useState(false);

  const showPicker = () => setVisible(true);
  const hidePicker = () => setVisible(false);

  const handleConfirm = (date: Date) => {
    const formattedTime = formatTo12Hour(date);
    onChange(formattedTime);
    hidePicker();
  };

  const initialDate = (() => {
    if (!value) return undefined;
    const match = value.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return undefined;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === "PM" && h < 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  })();

  const containerClass = `${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5`;

  return (
    <View className="w-full mb-4">
      <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>{label}</Text>
      <TouchableOpacity
        className={`flex-row items-center justify-between ${containerClass}`}
        onPress={showPicker}
      >
        <Text className={`font-semibold ${value ? (darkMode ? "text-gray-100" : "text-gray-800") : (darkMode ? "text-gray-500" : "text-gray-400")}`}>
          {value || 'Selecciona una hora'}
        </Text>
        <Ionicons name="time-outline" size={20} color={darkMode ? "#9CA3AF" : "#2563EB"} />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={visible}
        mode="time"
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        date={initialDate}
        locale="es_ES"
        is24Hour={false}
      />
    </View>
  );
}
