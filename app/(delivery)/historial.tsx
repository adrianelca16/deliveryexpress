import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from "@expo/vector-icons";
import api from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { Orden } from "@/type";
import { colorEstado } from "@/utils/ordenes";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import PopupMessage from "@/components/PopupMessage";

export default function Historial() {
  const { darkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const router = useRouter();

  const fetchOrdenes = useCallback(async () => {
    try {
      const resp = await api.get("/api/ordenes/ordenes/mis-ordenes/");
      setOrdenes(resp.data);
    } catch (err) {
      setPopupMessage("Error al obtener órdenes");
      setPopupVisible(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
    }, [fetchOrdenes])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrdenes();
    setRefreshing(false);
  }, [fetchOrdenes]);

  return (
    <ScreenWrapper>
      <Header title="Historial" showBack backHref="/(delivery)" />

      <ScrollView
        className="px-4 mt-3"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={darkMode ? "#60A5FA" : "#2563EB"} />
        }
      >
        {ordenes.length === 0 ? (
          <Animated.View entering={FadeInDown.duration(400).springify()}>
            <Card>
              <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"} font-bold`}>No tienes órdenes aún.</Text>
            </Card>
          </Animated.View>
        ) : (
          ordenes.map((orden, index) => (
            <Animated.View key={orden.id} entering={FadeInDown.delay(100 + index * 80).duration(400).springify()}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: "/(delivery)/orden/orden-detalle", params: { id: orden.id } })}
                className="mb-4"
              >
                <Card>
                  <View className="flex-row gap-3">
                    <View className="items-center">
                      <Text className="text-lg text-center font-bold text-secondary mb-2">
                        Pedido #{orden.numero_orden}
                      </Text>
                      <Image source={{ uri: orden.restaurante_imagen }} className="w-20 h-20 rounded-full border-2 border-purple-100" />
                    </View>

                    <View className="flex-1 justify-center ml-1">
                      <Text className={`text-sm font-bold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{orden.cliente_nombre}</Text>
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.creado_en ? new Date(orden.creado_en).toLocaleDateString() : ''}</Text>
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={1}>{orden.direccion_entrega}</Text>
                      {orden.estado_nombre && (
                        <Text className="text-xs font-semibold mt-1" style={{ color: colorEstado(orden.estado_nombre, darkMode) }}>
                          {orden.estado_nombre}
                        </Text>
                      )}
                    </View>

                    <View className="justify-between items-end">
                      <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>Ver detalles</Text>
                      <Text className="text-primary text-xl font-bold">${orden.total}</Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
      <PopupMessage
        visible={popupVisible}
        message={popupMessage}
        icon="cancel"
        onClose={() => setPopupVisible(false)}
      />
    </ScreenWrapper>
  );
}
