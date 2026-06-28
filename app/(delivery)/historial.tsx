import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useFocusEffect, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Historial() {
  const { darkMode } = useThemeStore();
  const { user } = useAuthStore();
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const router = useRouter();

  const fetchOrdenes = async () => {
    try {
      const resp = await axios.get(
        `${API_URL}/api/ordenes/ordenes/mis-ordenes/`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setOrdenes(resp.data);

      console.log(ordenes)

    } catch (err) {
      console.error("Error al obtener órdenes:", err);
    }
  };

  useEffect(() => {
    fetchOrdenes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
    }, [])
  );

  const colorEstado = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'pago por verificar':
        return '#FBC02D';
      case 'pendiente':
        return '#9E9E9E';
      case 'aceptada':
        return '#0033A0';
      case 'asignada':
        return '#FF9800';
      case 'en camino':
        return '#009688';
      case 'entregada':
        return '#4CAF50';
      case 'cancelada':
        return '#F44336';
    }
  };

  return (
    <ScreenWrapper gradient>
      <Header title="Historial" showBack backHref="/(delivery)" rightAction={
        <TouchableOpacity onPress={() => router.push("/profile")}>
          <Ionicons name="notifications" size={28} color="#65A30D" />
        </TouchableOpacity>
      } />

      <ScrollView className="px-4 mt-2" contentContainerStyle={{ paddingBottom: 100 }}>
        <Text className="text-center font-extrabold text-secondary text-xl mb-5">
          Historial de Órdenes
        </Text>

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
                onPress={() => router.push({ pathname: `/(delivery)/orden/orden-detalle`, params: {id: orden.id} })}
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
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{new Date(orden.creado_en).toLocaleDateString()}</Text>
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={1}>{orden.direccion_entrega}</Text>
                      <Text className="text-xs font-semibold mt-1" style={{color: colorEstado(orden.estado_nombre || '')}}>
                        {orden.estado_nombre}
                      </Text>
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
    </ScreenWrapper>
  );
}
