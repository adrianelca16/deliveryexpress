import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Estado, Orden } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from "expo-clipboard";
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';

export default function OrdenDetalle() {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const router = useRouter();

  const [orden, setOrden] = useState<Orden>();
  const [loading, setLoading] = useState(false);
  const [estado, setEstado] = useState<Estado>()
  const [modalVisible, setModalVisible] = useState(false);

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);
    } catch (err) {
      console.log('Error obteniendo la orden:', err);
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(res.data.find((e: Estado) => e.nombre.toLowerCase() === "aceptada"));
    } catch (err) {
      console.log("Error obteniendo métodos de pago:", err);
    }
  };

  useEffect(() => {
    fetchOrden();
    fecthEstatusOrden();

    const interval = setInterval(() => {
      fetchOrden();
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!orden) return;

    setLoading(true);
    try {
      await axios.patch(`${API_URL}/api/ordenes/ordenes/${id}/cambiar-estado/`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Éxito', `Orden actualizada a "${nuevoEstado}"`);
      fetchOrden();
    } catch (err: any) {
      console.log('Error al actualizar la orden:', err?.response?.data);
      Alert.alert('Error', 'No se pudo actualizar la orden');
    } finally {
      setLoading(false);
    }
  };

  const colorEstado = (estado?: string) => {
    if (!darkMode) {
      switch (estado?.toLowerCase()) {
        case 'pago por verificar': return '#FBC02D';
        case 'pendiente': return '#9E9E9E';
        case 'aceptada': return '#0033A0';
        case 'asignada': return '#FF9800';
        case 'en camino': return '#009688';
        case 'entregada': return '#4CAF50';
        case 'cancelada': return '#F44336';
      }
    } else {
      switch (estado?.toLowerCase()) {
        case 'pago por verificar': return '#FDD835';
        case 'pendiente': return '#D1D5DB';
        case 'aceptada': return '#60A5FA';
        case 'asignada': return '#FFB74D';
        case 'en camino': return '#4DB6AC';
        case 'entregada': return '#81C784';
        case 'cancelada': return '#EF9A9A';
      }
    }
  };

  if (!orden) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <Text className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Cargando orden...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper gradient>
      <Header title="Detalle de Orden" showBack backHref="/(comercio)/ordenes" gradient />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card>
            <View className="flex-row justify-between items-center">
              <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-secondary"}`}>Pedido #{orden.numero_orden}</Text>
              <Text className="text-xl font-bold text-primary">${orden.total ?? 0}</Text>
            </View>
            <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{new Date(orden.creado_en).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}</Text>

            <View className="flex-row items-center mt-3">
              <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colorEstado(orden.estado_nombre) }} />
              <Text className="font-semibold text-sm" style={{ color: colorEstado(orden.estado_nombre) }}>
                Estado: {orden.estado_nombre}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Platos de la Orden</Text>
          {orden.detalles?.map((item, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(250 + index * 60).duration(400)}>
              <Card className="flex-row items-center mb-2">
                <Image source={{ uri: `${item.plato_imagen}` }}
                  className="h-20 w-20 rounded-2xl"
                  resizeMode="cover" />
                <View className="ml-4 flex-1">
                  <Text className="text-primary font-bold">{item.plato_nombre}</Text>
                  <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cantidad: {item.cantidad}</Text>
                </View>
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Dirección de envío</Text>
          <Card>
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                <Ionicons name="person" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{orden.cliente_nombre}</Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.direccion_entrega}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-primary py-3 px-6 rounded-2xl self-center"
              style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              onPress={() => setModalVisible(true)}>
              <Text className="text-white font-bold text-sm">Ver Perfil del Cliente</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} className="flex-row justify-around mt-8">
          {orden.estado_nombre?.toLowerCase() !== 'cancelada' && (
            <TouchableOpacity
              onPress={() => cambiarEstado('cancelada')}
              className="bg-red-500 py-3.5 px-6 rounded-2xl flex-1 mr-2"
              style={{ shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold">Cancelar</Text>
            </TouchableOpacity>
          )}

          {orden.estado_nombre?.toLowerCase() === 'pendiente' && estado?.id && (
            <TouchableOpacity
              onPress={() => cambiarEstado(estado.id)}
              className="bg-secondary py-3.5 px-6 rounded-2xl flex-1 ml-2"
              style={{ shadowColor: '#65A30D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              disabled={loading}
            >
              <Text className="text-white text-center font-bold">Aceptar</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className={`rounded-3xl p-6 w-5/6 items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Image
              source={{
                uri: orden.cliente_foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
              }}
              className="w-24 h-24 rounded-3xl mb-4"
            />
            <Text className={`text-lg font-bold mb-1 ${darkMode ? "text-white" : "text-gray-900"}`}>{orden.cliente_nombre}</Text>
            <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.cliente_email || "Sin correo"}</Text>

            <View className="flex-row items-center mt-3">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mr-2`}>
                {orden.cliente_telefono || "Sin teléfono"}
              </Text>
              {orden.cliente_telefono && (
                <TouchableOpacity
                  onPress={async () => {
                    await Clipboard.setStringAsync(orden.cliente_telefono || '');
                    Alert.alert("Copiado", "Número copiado al portapapeles");
                  }}
                  className="bg-secondary px-4 py-1.5 rounded-2xl"
                >
                  <Text className="text-white text-xs font-bold">Copiar</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              className="bg-primary mt-6 py-3 px-8 rounded-2xl"
              style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white font-bold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
