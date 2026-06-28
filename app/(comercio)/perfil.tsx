import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from 'react-native'
import React, { useState, useCallback } from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { API_URL} from '@/constants';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Restaurante } from '@/type';
import { useRouter, useFocusEffect } from 'expo-router';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';

export default function Perfil() {

  const token = useAuthStore((state) => state.user?.token);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();

  const getRestaurante = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurante(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      getRestaurante();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <ScreenWrapper gradient>
      <Header title="Perfil" showBack backHref="/(comercio)" gradient={false} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card className="flex-row items-center">
            <Image source={{ uri: restaurante?.imagen_url }} className='w-20 h-20 rounded-2xl' />
            <View className="ml-4 flex-1">
              <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{restaurante?.nombre?.toUpperCase()}</Text>
              <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={2}>{restaurante?.descripcion}</Text>
              {restaurante?.calificacion_promedio != null && (
                <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>⭐ {restaurante.calificacion_promedio}</Text>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-6">
          <Text className='text-lg font-bold text-secondary mb-3'>Información del restaurante</Text>
          <Card>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                <FontAwesome name="map-marker" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Dirección</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{restaurante?.direccion}</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                <MaterialCommunityIcons name="clock" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Horario de Atención</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{restaurante?.horario_apertura} - {restaurante?.horario_cierre}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Tipo de cocina</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{restaurante?.categoria?.nombre}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-secondary py-3.5 px-6 rounded-2xl flex-row items-center justify-center mt-6"
              style={{ shadowColor: '#65A30D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              onPress={() => router.push('/(comercio)/restaurantes/registrar-restaurantes')}>
              <FontAwesome name="pencil" size={16} color="white" />
              <Text className='font-semibold ml-2 text-white'>Editar Información</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mt-4">
          <TouchableOpacity className="flex-row items-center justify-center py-4">
            <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
              <Entypo name="tools" size={18} color="#2563EB" />
            </View>
            <Text className="font-semibold text-primary">Soporte Técnico</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card className="flex-row justify-between items-center">
            <Text className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Modo oscuro</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
              thumbColor="#2563EB"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} className="mt-2">
          <TouchableOpacity
            onPress={logout}
            className="py-4 flex-row justify-center items-center border border-red-400/40 rounded-2xl mt-2"
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="text-red-500 font-bold ml-2">Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  )
}
