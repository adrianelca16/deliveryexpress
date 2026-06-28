import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Direccion } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DireccionLista() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);

  const fetchDirecciones = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDirecciones(res.data);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  const marcarPrincipal = async (id: string) => {
    try {
      await axios.patch(
        `${API_URL}/api/user/direcciones/${id}/`,
        { es_predeterminada: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchDirecciones();
    } catch (error) {
      console.error("Error al marcar principal:", error);
      Alert.alert("Error", "No se pudo marcar esta dirección como principal.");
    }
  };

  const eliminarDireccion = (id: string) => {
    Alert.alert(
      "Eliminar dirección",
      "¿Seguro que quieres eliminar esta dirección?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/user/direcciones/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setDirecciones((prev) => prev.filter((d) => d.id !== id));
            } catch (error) {
              console.error("Error eliminando dirección:", error);
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchDirecciones();
    }, [])
  );

  return (
    <ScreenWrapper>
      <Header title="Direcciones" showBack onBack={() => router.push("/(tabs)/profile")} />

      <View className="px-4 mt-2">
        <Text className="text-center text-gray-500 text-base mb-4">Gestiona tus puntos de entregas frecuentes con presición</Text>

        <CustomButton
          title="Añadir Dirección"
          onPress={() => router.push({ pathname: "/perfil/formulario-direccion" })}
          style="bg-primary w-full mb-4"
        />

        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {direcciones.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400).springify()}>
              <Card>
                <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No tienes direcciones guardadas</Text>
              </Card>
            </Animated.View>
          ) : (
            direcciones.map((dir, index) => (
              <Animated.View key={dir.id} entering={FadeInDown.delay(100 + index * 80).duration(400).springify()} className="mb-3">
                <Card className='border-blue-300 dark:border-blue-700' style={{ elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                  <View>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className={`font-bold text-lg text-blue-600 dark:text-blue-400`}>
                        {dir.nombre}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          router.push({
                            pathname: "/perfil/formulario-direccion",
                            params: {
                              id: dir.id.toString(),
                              nombre: dir.nombre,
                              direccion_texto: dir.direccion_texto,
                              latitud: dir.latitud?.toString(),
                              longitud: dir.longitud?.toString(),
                            },
                          });
                        }}
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.1)' }}
                      >
                        <MaterialCommunityIcons name="pencil" size={18} color="#2563EB" />
                      </TouchableOpacity>
                    </View>
                    <Text className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {dir.direccion_texto}
                    </Text>
                    <View className="h-px bg-gray-200 my-3" />
                    {dir.es_predeterminada ? (
                      <View className="flex-row items-center">
                        <Ionicons name="star" size={14} color={darkMode ? '#EAB308' : '#B8860B'} />
                        <Text className="text-xs ml-1" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>Predeterminada</Text>
                      </View>
                    ) : (
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity
                          onPress={() => marcarPrincipal(dir.id)}
                          className="flex-row items-center"
                        >
                          <Text className="text-primary font-semibold text-sm">Establecer predeterminada</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => eliminarDireccion(dir.id)}
                          className="w-10 h-10 rounded-full items-center justify-center bg-red-50 dark:bg-red-900/20"
                        >
                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
