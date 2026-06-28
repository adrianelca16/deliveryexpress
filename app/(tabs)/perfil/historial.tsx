import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Orden } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function HistorialOrdenes() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdenes(res.data);

      console.log(ordenes);
    } catch (err) {
      console.log("Error obteniendo órdenes:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
    }, [])
  );

  return (
    <ScreenWrapper gradient>
      <Header title="Historial de Órdenes" showBack onBack={() => router.push("/(tabs)/profile")} rightAction={
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="notifications" size={28} color="#65A30D" />
        </TouchableOpacity>
      } />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className={`mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Cargando órdenes...</Text>
        </View>
      ) : ordenes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Card className="items-center py-10 w-full">
            <Ionicons name="file-tray-outline" size={60} color={darkMode ? '#9CA3AF' : '#9CA3AF'} />
            <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} mt-3 text-lg`}>No tienes órdenes aún</Text>
          </Card>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 110 }} className="px-4">
          <Text className={`text-center font-extrabold text-2xl mb-4 ${darkMode ? "text-white" : "text-secondary"}`}>Historial de Órdenes</Text>
          {ordenes.map((orden, index) => (
            <Animated.View key={orden.id} entering={FadeInDown.delay(100 + index * 80).duration(400).springify()} className="mb-3">
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/perfil/orden-detalle",
                    params: { id: orden.id.toString() },
                  })
                }
                activeOpacity={0.8}
              >
                <Card>
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>{orden.restaurante_nombre}</Text>
                      <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-sm`}>Fecha: {new Date(orden.creado_en).toLocaleDateString()}</Text>
                    </View>

                    <View className="items-end">
                      <Text className={`${darkMode ? "text-gray-100" : "text-gray-800"} font-bold text-lg text-primary`}>${orden.total}</Text>
                      <Text
                        className={`text-sm font-semibold mt-1 ${
                          darkMode
                            ? orden.estado_nombre === "Entregada"
                              ? "text-green-400"
                              : orden.estado_nombre === "En camino"
                              ? "text-yellow-400"
                              : "text-red-400"
                            : orden.estado_nombre === "Entregada"
                            ? "text-green-600"
                            : orden.estado_nombre === "En camino"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {orden.estado_nombre}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
}
