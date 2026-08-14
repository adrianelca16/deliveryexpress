import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Orden } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colorEstado } from "@/utils/ordenes";
import PopupMessage from "@/components/PopupMessage";

export default function HistorialOrdenes() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [popup, setPopup] = useState({ visible: false, message: "", icon: "cancel" as const });
  const showError = (msg: string) => setPopup({ visible: true, message: msg, icon: "cancel" });
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sorted = res.data.sort(
        (a: Orden, b: Orden) => (b.numero_orden || 0) - (a.numero_orden || 0)
      );
      setOrdenes(sorted);
    } catch (err) {
      showError("Error al cargar historial");
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
    <ScreenWrapper>
      <Header title="Historial de Órdenes" showBack onBack={() => router.push("/(tabs)/profile")} />

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
        <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}>
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
                <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }} >
                  <View className="flex-row justify-between">
                    <View className="flex-1">
                      <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>Pedido #{orden.numero_orden}</Text>
                      <View className="mt-1">
                        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-sm`}>{orden.restaurante_nombre}</Text>
                        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>
                          {new Date(orden.creado_en).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end justify-center">
                      <View className="flex-row items-center">
                        <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colorEstado(orden.estado_nombre, darkMode) }} />
                        <Text className="text-xs font-semibold" style={{ color: colorEstado(orden.estado_nombre, darkMode) }}>
                          {orden.estado_nombre}
                        </Text>
                      </View>
                      <Text className="font-semibold text-lg mt-2" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
                        ${orden.total}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))}
      </ScrollView>
        )}
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}