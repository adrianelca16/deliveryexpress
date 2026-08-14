import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal, ActivityIndicator } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import RutaMapa from "@/components/RutaMapa";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams} from 'expo-router';
import { Estado, Orden } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from "expo-clipboard";
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import PopupMessage from "@/components/PopupMessage";
import { colorEstado } from "@/utils/ordenes";

export default function OrdenDetalle() {
  const rawId = useLocalSearchParams().id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
   const { darkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [orden, setOrden] = useState<Orden>();
  const [loading, setLoading] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupIcon, setPopupIcon] = useState<"check-circle" | "cancel" | "warning" | "info">("info");
  const [modalConfirmacionEstado, setModalConfirmacionEstado] = useState(false);
  const [estadoPendiente, setEstadoPendiente] = useState<{ id: string; nombre: string } | null>(null);

  const fetchOrden = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);
    } catch (err) {
      setPopupMessage("Error al cargar la orden");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
  };

  const fecthEstatusOrden = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstados(res.data);
    } catch (err) {
      setPopupMessage("Error al cargar estados");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
  };

  useEffect(() => {
    fetchOrden();
    fecthEstatusOrden();
  }, [id]);

  useEffect(() => {
    if (!orden?.id) return;
    const activo = !["entregada", "cancelada", "confirmación de entrega"].includes(
      orden.estado_nombre?.toLowerCase() ?? ''
    );
    if (!activo) return;
    const interval = setInterval(() => {
      fetchOrden();
    }, 10000);
    return () => clearInterval(interval);
  }, [orden?.id, orden?.estado_nombre]);

  const cambiarEstado = async (nuevoEstado: string) => {
    const token = useAuthStore.getState().user?.token;
    if (!orden) return;

    setModalConfirmacionEstado(false);
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/api/ordenes/ordenes/${id}/cambiar-estado/`,
        { estado: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const estadoEncontrado = estados?.find((e) => e.id.toString() === nuevoEstado);
      const nombreEstado = estadoEncontrado?.nombre || nuevoEstado;
      setPopupMessage(`Orden actualizada a "${nombreEstado}"`);
      setPopupIcon("check-circle");
      setPopupVisible(true);
      fetchOrden();
    } catch (err: any) {
      console.log('Error al actualizar la orden:', err?.response?.data);
      const msg = err?.response?.data?.detail || err?.response?.data?.error || "Error al actualizar la orden";
      setPopupMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setPopupIcon("cancel");
      setPopupVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmarCambioEstado = (estadoId: string) => {
    const estadoEncontrado = estados?.find((e) => e.id.toString() === estadoId);
    if (!estadoEncontrado) return;
    setEstadoPendiente(estadoEncontrado);
    setModalConfirmacionEstado(true);
  };

  if (!orden && !loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className={`mt-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Cargando orden...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!orden) {
    return (
      <ScreenWrapper>
        <View className="flex-1 justify-center items-center">
          <Text className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>Orden no encontrada</Text>
          <TouchableOpacity onPress={fetchOrden} className="mt-4 bg-primary py-2 px-6 rounded-2xl">
            <Text className="text-white font-bold">Reintentar</Text>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper >
      <Header title="Detalle de Orden" showBack backHref="/(comercio)/ordenes" />

      <ScrollView className="px-5 mt-3" contentContainerStyle={{ paddingBottom: insets.bottom }}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
            <View className="flex-row justify-between items-center">
              <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-secondary"}`}>Pedido #{orden.numero_orden}</Text>
              <Text className="text-xl font-bold text-primary">${orden.total ?? 0}</Text>
            </View>
            <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.creado_en ? new Date(orden.creado_en).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }) : ''}</Text>

            <View className="flex-row items-center mt-3">
              <Text
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: `${colorEstado(orden.estado_nombre, darkMode)}20`,
                  color: colorEstado(orden.estado_nombre, darkMode),
                }}
              >
                {orden.estado_nombre}
              </Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Platos de la Orden</Text>
          {orden.detalles?.map((item, index) => (
            <Animated.View key={index} entering={FadeInDown.delay(250 + index * 60).duration(400)}>
              <Card className="flex-row items-center mb-2" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
                <Image source={{ uri: `${item.plato_imagen}` }}
                  className="h-20 w-20 rounded-2xl"
                  resizeMode="cover" />
                <View className="ml-4 flex-1">
                  <Text className="text-primary font-bold">{item.plato_nombre}</Text>
                  <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cantidad: {item.cantidad}</Text>
                  {(() => {
                    const extras = item.extras_detalle;
                    return extras && extras.length > 0 ? (
                      <View className="mt-1 gap-0.5">
                        {extras.map((extra: any) => (
                          <View key={extra.id} className="flex-row items-center gap-1">
                            <Text className="text-[10px] text-primary">+</Text>
                            <Text className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {extra.nombre}
                            </Text>
                            {Number(extra.precio_adicional) > 0 && (
                              <Text className="text-[10px] font-semibold" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                                +${Number(extra.precio_adicional).toFixed(2)}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    ) : null;
                  })()}
                </View>
                <Text className="font-bold text-primary">${item.precio_unitario}</Text>
              </Card>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Dirección de envío</Text>
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
              <View className="flex-row items-center mb-3">
                {orden.cliente_foto ? (
                  <Image
                    source={{ uri: orden.cliente_foto }}
                    className="w-10 h-10 rounded-2xl mr-3"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                    <Ionicons name="person" size={18} color="#2563EB" />
                  </View>
                )}
                <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>{orden.cliente_nombre}</Text>
                <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.direccion_entrega}</Text>
              </View>
            </View>
            <TouchableOpacity
              className="bg-primary py-3 px-6 rounded-2xl self-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
              onPress={() => setModalVisible(true)}>
              <Text className="text-white font-bold text-sm">Ver Perfil del Cliente</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Resumen</Text>
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
            <View className="flex-row justify-between items-center py-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Costo de la Orden</Text>
              <Text className="font-bold text-primary">${Number(orden.subtotal || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between items-center py-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Costo del envío</Text>
              <Text className="font-bold text-sm" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${Number(orden.costo_envio || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between items-center py-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>IVA</Text>
              <Text className="font-bold text-sm" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${Number(orden.iva || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between items-center py-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total de la orden</Text>
              <Text className="font-bold text-xl" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${Number(orden.total).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between items-center py-2">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ingreso neto por orden</Text>
              <Text className="font-bold text-lg text-primary">${Number(orden.monto_restaurante || 0).toFixed(2)}</Text>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} className="flex-row justify-around mt-8">
          {!["cancelada", "preparado", "en camino", "entregada", "confirmación de entrega"].includes(orden.estado_nombre?.toLowerCase() ?? '') && (
            (() => {
              const canceladaEstado = estados?.find((e) => e.nombre.toLowerCase() === "cancelada");
              return canceladaEstado ? (
                <TouchableOpacity
                  onPress={() => confirmarCambioEstado(canceladaEstado.id)}
                  className="bg-secondary py-3.5 px-6 rounded-2xl flex-1 mr-2 flex-row justify-center items-center gap-2"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {loading && <ActivityIndicator size="small" color="white" />}
                  <Text className="text-white text-center font-bold">
                    {loading ? "Cargando..." : "Cancelar"}
                  </Text>
                </TouchableOpacity>
              ) : null;
            })()
          )}

          {orden.estado_nombre?.toLowerCase() === 'pendiente' && (
            (() => {
              const aceptadaEstado = estados?.find((e) => e.nombre.toLowerCase() === "aceptada");
              return aceptadaEstado ? (
                <TouchableOpacity
                  onPress={() => confirmarCambioEstado(aceptadaEstado.id)}
                  className="bg-primary py-3.5 px-6 rounded-2xl flex-1 ml-2 flex-row justify-center items-center gap-2"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {loading && <ActivityIndicator size="small" color="white" />}
                  <Text className="text-white text-center font-bold">
                    {loading ? "Cargando..." : "Aceptar"}
                  </Text>
                </TouchableOpacity>
              ) : null;
            })()
          )}

          {["aceptada", "asignada", "esperando aceptacion"].includes(orden.estado_nombre?.toLowerCase() ?? '') && (
            (() => {
              const preparadoEstado = estados?.find((e) => e.nombre.toLowerCase() === "preparado");
              return preparadoEstado ? (
                <TouchableOpacity
                  onPress={() => confirmarCambioEstado(preparadoEstado.id)}
                  className="bg-primary py-3.5 px-6 rounded-2xl flex-1 ml-2 flex-row justify-center items-center gap-2"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                >
                  {loading && <ActivityIndicator size="small" color="white" />}
                  <Text className="text-white text-center font-bold">
                    {loading ? "Cargando..." : "Preparado"}
                  </Text>
                </TouchableOpacity>
              ) : null;
            })()
          )}
        </Animated.View>
      </ScrollView>

      <Modal
        visible={modalConfirmacionEstado}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalConfirmacionEstado(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className={`rounded-3xl p-6 w-5/6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`font-bold text-lg text-center mb-4 ${darkMode ? "text-white" : "text-black"}`}>
              {estadoPendiente?.nombre?.toLowerCase() === "preparado"
                ? "Pasando a preparado"
                : "¿Cambiar estado?"}
            </Text>
            <Text className={`text-sm text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {estadoPendiente?.nombre?.toLowerCase() === "preparado"
                ? "El restaurante comenzará la preparación de tu orden."
                : `¿Estás seguro de cambiar el estado a "${estadoPendiente?.nombre}"?`}
            </Text>
            <View className="flex-row justify-center gap-4">
              <TouchableOpacity
                onPress={() => setModalConfirmacionEstado(false)}
                className="bg-gray-300 dark:bg-gray-600 py-3 px-6 rounded-2xl flex-1"
              >
                <Text className="text-center font-bold text-gray-800 dark:text-gray-300">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (estadoPendiente) {
                    cambiarEstado(estadoPendiente.id);
                  }
                }}
                className="bg-primary py-3 px-6 rounded-2xl flex-1"
                disabled={loading}
                style={{ opacity: loading ? 0.6 : 1 }}
              >
                <Text className="text-white text-center font-bold">Sí, cambiar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

            {orden.latitud && orden.longitud && orden.restaurante_latitud && orden.restaurante_longitud ? (
              <View className="mt-4 w-full h-80 rounded-2xl overflow-hidden">
                <RutaMapa
                  restaurante={{
                    latitude: Number(orden.restaurante_latitud),
                    longitude: Number(orden.restaurante_longitud)
                  }}
                  destino={{
                    latitude: Number(orden.latitud),
                    longitude: Number(orden.longitud)
                  }}
                />
              </View>
            ) : null}

            <TouchableOpacity
              className="bg-primary mt-6 py-3 px-8 rounded-2xl"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white font-bold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PopupMessage
        visible={popupVisible}
        message={popupMessage}
        icon={popupIcon}
        onClose={() => setPopupVisible(false)}
      />
    </ScreenWrapper>
  );
}
