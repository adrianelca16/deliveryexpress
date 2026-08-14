import { View, Text, TouchableOpacity, Image } from 'react-native';
import React, { useCallback, useState } from 'react';
import { images, API_URL } from '@/constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { FontAwesome6, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import ScreenLoading from '@/components/ScreenLoading';
import PopupMessage from '@/components/PopupMessage';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import CustomButton from '@/components/CustomButton';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function ConfirmacionCedula() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [documento, setDocumento] = useState(false);
  const [archivo, setArchivo] = useState<string | null>(null);
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

    if (!result.canceled) {
      setArchivo(result.assets[0].uri);
      setDocumento(true);
    }
  };

  const subirArchivo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setArchivo(result.assets[0].uri);
      setDocumento(true);
    }
  };

  const confirmar = async () => {
    if (!archivo) {
      showPopup('Por favor, sube un documento', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('cedula_imagen', {
      uri: archivo,
      type: 'image/jpeg',
      name: 'documento.jpg',
    } as any);

    try {
      const res = await axios.patch(`${API_URL}/api/user/usuario/${user?.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.cedula_imagen) {
        showPopup('Documento validado', 'check-circle');
        setTimeout(() => router.push('/(tabs)/registros/foto-perfil'), 1000);
      } else {
        showPopup('No se pudo verificar el documento', 'cancel');
      }
    } catch (error) {
      showPopup('Hubo un problema al enviar el documento', 'cancel');
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchUsuario = async () => {
        try {
          const res = await axios.get(`${API_URL}/api/user/usuario/${user?.id}/`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          });

          setDocumento(res.data.cedula_imagen);
          setLoading(false);
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        }
      };
      fetchUsuario();
    }, [user?.token])
  );

  if (loading) {
    return <ScreenLoading />
  }

  return (
    <ScreenWrapper>
      <Header title="Validar Identidad" showBack />

      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="px-4">
        
        <TouchableOpacity onPress={tomarFoto} activeOpacity={0.8}>
          <Card className="items-center py-6 mb-3 mt-6"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
          >
            <View className={`w-20 h-20 rounded-2xl items-center justify-center mb-3 ${documento ? 'bg-blue-100' : 'bg-primary/10'}`}>
              <FontAwesome6 name="camera" size={40} color={documento ? '#2563EB' : '#2563EB'} />
            </View>
            <Text className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tomar foto a tu documento</Text>
            <Text className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Usa la cámara para capturar tu cédula</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={subirArchivo} activeOpacity={0.8}>
          <Card className="items-center py-6 mb-3"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
          >
            <View className={`w-20 h-20 rounded-2xl items-center justify-center mb-3 ${documento ? 'bg-blue-100' : 'bg-primary/10'}`}>
              <MaterialCommunityIcons name="file-upload" size={40} color={documento ? '#2563EB' : '#2563EB'} />
            </View>
            <Text className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Subir documento</Text>
            <Text className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Selecciona desde tu galería</Text>
          </Card>
        </TouchableOpacity>

        {archivo && (
          <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="items-center my-4">
            <Image source={{ uri: archivo }} className="w-48 h-48 rounded-2xl border-2 border-purple-200" resizeMode="cover" />
          </Animated.View>
        )}

        <CustomButton
          title="Confirmar"
          onPress={confirmar}
          disabled={!documento}
          style={documento ? 'bg-secondary' : 'bg-gray-300'}
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