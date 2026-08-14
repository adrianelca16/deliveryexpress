import { View, Text, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { API_URL } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import PopupMessage from "@/components/PopupMessage";
import ScreenLoading from "@/components/ScreenLoading";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FotoPerfil() {
  const [archivo, setArchivo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuthStore();
  const { darkMode } = useThemeStore();
  const token = user?.token;

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const tomarFoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setArchivo(uri);
  };

  const submit = async () => {
    if (!archivo) return;

    const formData = new FormData();
    formData.append("foto_perfil", {
      uri: archivo,
      type: "image/jpeg",
      name: "selfie.jpg",
    } as any);

    try {
      setIsLoading(true);

      const res = await axios.patch(
        `${API_URL}/api/user/usuario/${user?.id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(res.data)

      setIsLoading(false);

      if (res.data.verificacion_identidad) {
        showPopup("Documento validado exitosamente ", "check-circle");
        setTimeout(() => {
          router.push("/(tabs)/registros/confirmacion-registro");
        }, 2000);
      } else {
showPopup("No se pudo validar la selfie", "cancel");
      setTimeout(() => {
        router.replace("/(tabs)/registros/foto-perfil");
      }, 2000);
    }
    } catch (error) {
      console.error("Error al subir la foto:", error);
      setIsLoading(false);
      showPopup("Hubo un problema al enviar la foto", "cancel");
      setTimeout(() => {
        router.replace("/(tabs)/registros/foto-perfil");
      }, 2000);
    }
  };

  if (isLoading) {
    return <ScreenLoading />;
  }

  return (
    <ScreenWrapper>
      <Header title="Selfie" showBack />

      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="items-center px-4">
        <Text className="text-center font-bold text-3xl text-secondary mt-2">
          ¡Una última cosa!
        </Text>
        <Text className={`font-semibold text-base mt-2 text-center px-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
          Queremos verificar que seas tú... ¡así que tómate tu mejor selfie!
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="items-center px-4 mt-6">
        {archivo ? (
          <View className="relative">
            <Image
              source={{ uri: archivo }}
              className="w-56 h-56 rounded-2xl border-2 border-purple-200"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => setArchivo(null)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-56 h-56 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Ionicons name="camera-outline" size={60} color={darkMode ? '#9CA3AF' : '#9CA3AF'} />
          </View>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="px-4 mt-6 gap-3">
        <TouchableOpacity onPress={tomarFoto} activeOpacity={0.8}>
          <Card className="items-center py-6"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
          >
            <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-3">
              <FontAwesome6 name="camera" size={32} color="#2563EB" />
            </View>
            <Text className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Toma una selfie</Text>
          </Card>
        </TouchableOpacity>

        <CustomButton
          title="Enviar foto"
          onPress={submit}
          disabled={!archivo}
          style={archivo ? 'bg-secondary' : 'bg-gray-300'}
        />
      </Animated.View>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}