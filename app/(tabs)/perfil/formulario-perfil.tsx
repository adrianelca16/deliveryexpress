import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { useState, useCallback } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import axios from "axios";
import { API_URL } from "@/constants";
import * as ImagePicker from "expo-image-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FormularioPerfil() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  const { darkMode } = useThemeStore();

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<ImagePickerAsset | null>(null);
  const [fotoRemota, setFotoRemota] = useState<string>("");
  const [email, setEmail] = useState("");

  useFocusEffect(
    useCallback(() => {
      const fetchUsuario = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/user/usuario/`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          const u = res.data[0];
          setNombre(u.nombre);
          setTelefono(u.telefono);
          setEmail(u.email);
          setFotoRemota(u.foto_perfil || "");
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      };
      fetchUsuario();
    }, [user?.token])
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setFotoPerfil(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("telefono", telefono);

    if (fotoPerfil) {
      formData.append("foto_perfil", {
        uri: fotoPerfil.uri,
        type: "image/jpeg",
        name: "perfil.jpg",
      } as any);
    }

    try {
      const res = await axios.patch(`${API_URL}/api/user/usuario/${user?.id}/`, formData, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedUser = res.data;

      login({
        ...user!,
        nombre: updatedUser.nombre,
        telefono: updatedUser.telefono,
        foto_perfil: updatedUser.foto_perfil,
      });

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      router.push("/(tabs)/profile");
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error.response?.data || error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  const inputClass = `${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-purple-100/50 text-gray-800'} rounded-2xl px-4 py-3.5 font-semibold`;

  return (
    <ScreenWrapper>
      <Header title="Editar Perfil" showBack onBack={() => router.push("/(tabs)/profile")} />

      <ScrollView className="px-4 mt-2">
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="items-center mb-6">
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil.uri }} className="w-28 h-28 rounded-full border-2 border-blue-200" />
          ) : fotoRemota ? (
            <Image source={{ uri: fotoRemota }} className="w-28 h-28 rounded-full border-2 border-blue-200" />
          ) : (
            <View className="w-28 h-28 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="person" size={48} color="#2563EB" />
            </View>
          )}

          <TouchableOpacity
            className="mt-3 flex-row items-center gap-2 bg-blue-100 px-5 py-2 rounded-full"
            onPress={pickImage}
          >
            <Entypo name="camera" size={20} color="#2563EB" />
            <Text className="font-bold text-primary">Cambiar foto</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
          <Card className="mb-4">
            <Text className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-primary'}`}>Nombre</Text>
            <TextInput
              className={inputClass}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre"
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
          <Card className="mb-4">
            <Text className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-primary'}`}>Correo electrónico</Text>
            <TextInput
              className={inputClass}
              value={email}
              placeholder="Correo electrónico"
              editable={false}
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
          <Card className="mb-6">
            <Text className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-primary'}`}>Teléfono</Text>
            <TextInput
              className={inputClass}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="Tu número de teléfono"
              keyboardType="phone-pad"
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} className="items-center gap-4">
          <CustomButton
            title="Guardar cambios"
            onPress={handleSubmit}
            style="bg-primary w-1/2"
          />

          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Text className="text-secondary text-center font-extrabold text-lg">Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
}
