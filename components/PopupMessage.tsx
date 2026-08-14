import React, { useEffect } from "react";
import { Modal, View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeStore } from "@/store/theme.store";

type Props = {
  visible: boolean;
  message: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onClose: () => void;
};

const PopupMessage = ({ visible, message, icon, onClose }: Props) => {
  const { darkMode } = useThemeStore();

  useEffect(() => {
    if (visible) {
      const isError = icon === "cancel" || icon === "error-outline";
      const duration = isError ? 4000 : 3000;
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, icon]);

  const isSuccess = icon === "check-circle";
  const isError = icon === "cancel" || icon === "error-outline";
  const isWarning = icon === "warning";

  const accentColor = isSuccess ? "#2563EB" : isError ? "#B8860B" : isWarning ? "#F59E0B" : "#2563EB";
  const bgColor = darkMode ? "#1F2937" : "white";
  const textColor = darkMode ? "#F9FAFB" : "#1F2937";

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
        <View
          className="rounded-2xl px-8 py-8 items-center mx-8"
          style={{
            backgroundColor: bgColor,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: darkMode ? 0 : 0.2,
            shadowRadius: 12,
            elevation: darkMode ? 0 : 8,
          }}
        >
          <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: `${accentColor}15` }}>
            <MaterialIcons name={icon} size={40} color={accentColor} />
          </View>
          <Text className="text-base font-bold text-center" style={{ color: textColor }}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

export default PopupMessage;
