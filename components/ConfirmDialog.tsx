import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/theme.store";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  visible,
  title,
  message,
  icon = "help-outline",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}: Props) => {
  const { darkMode } = useThemeStore();

  const accentColor = danger ? "#EF4444" : "#2563EB";
  const bgColor = darkMode ? "#1F2937" : "white";
  const textColor = darkMode ? "#F9FAFB" : "#1F2937";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center items-center px-8" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          className="rounded-2xl py-8 px-6 w-full items-center"
          style={{
            backgroundColor: bgColor,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: `${accentColor}15` }}>
            <MaterialIcons name={icon} size={40} color={accentColor} />
          </View>

          <Text className="text-xl font-bold text-center mb-1" style={{ color: textColor }}>
            {title}
          </Text>
          <Text className="text-base text-center mb-6" style={{ color: darkMode ? "#D1D5DB" : "#4B5563" }}>
            {message}
          </Text>

          <View className="flex-row gap-3 w-full">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 rounded-xl py-3.5 items-center"
              style={{ backgroundColor: darkMode ? "#374151" : "#E5E7EB" }}
            >
              <Text className="font-bold" style={{ color: darkMode ? "#F9FAFB" : "#374151" }}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className="flex-1 rounded-xl py-3.5 items-center"
              style={{ backgroundColor: accentColor }}
            >
              <Text className="font-bold text-white">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmDialog;
