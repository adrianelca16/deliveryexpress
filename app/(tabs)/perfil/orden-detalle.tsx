import { View, Text, ScrollView, ActivityIndicator, Image, TouchableOpacity, Alert, Modal, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Orden } from "@/type";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import RutaMapa from "@/components/RutaMapa";
import PopupMessage from "@/components/PopupMessage";
import { colorEstado, estadoTerminado } from "@/utils/ordenes";


export default function OrdenDetalleCliente() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { darkMode } = useThemeStore();
  const token = useAuthStore((state) => state.user?.token);
  const [orden, setOrden] = useState<Orden | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{ latitud: number; longitud: number } | null>(null);
  const [restaurantePuntaje, setRestaurantePuntaje] = useState(0);
  const [conductorPuntaje, setConductorPuntaje] = useState(0);
  const [confirmando, setConfirmando] = useState(false);
  const [popup, setPopup] = useState({ visible: false, message: "", icon: "info" as "check-circle" | "cancel" | "warning" | "info" });
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const insets = useSafeAreaInsets();

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrden(res.data);
    } catch {
      setPopup({ visible: true, message: "Error al cargar la orden", icon: "cancel" });
    }
  };

  const fetchDeliveryLocation = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/ubicacion-conductor/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.latitud && res.data?.longitud) {
        setDeliveryLocation(res.data);
      }
    } catch (e) {
      console.log("Error obteniendo ubicación del delivery", e);
    }
  };

  const handleConfirmarEntrega = async () => {
    setConfirmando(true);
    try {
      if (restaurantePuntaje > 0 || conductorPuntaje > 0) {
        await axios.post(
          `${API_URL}/api/calificaciones/calificaciones/`,
          {
            orden: orden?.id,
            restaurante_puntaje: restaurantePuntaje > 0 ? restaurantePuntaje : null,
            conductor_puntaje: conductorPuntaje > 0 ? conductorPuntaje : null,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await axios.post(
        `${API_URL}/api/ordenes/ordenes/${id}/confirmar-entrega/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPopup({ visible: true, message: "Recepción confirmada. ¡Gracias!", icon: "check-circle" });
      fetchOrden();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || "Error al confirmar recepción";
      setPopup({ visible: true, message: typeof msg === 'string' ? msg : JSON.stringify(msg), icon: "cancel" });
    } finally {
      setConfirmando(false);
    }
  };

  useEffect(() => {
    setRestaurantePuntaje(0);
    setConductorPuntaje(0);
    if (orden?.estado_nombre?.toLowerCase() === "entregada") {
      setModalConfirmacion(true);
    }
    if (orden?.estado_nombre?.toLowerCase() === "confirmación de entrega") {
      setModalConfirmacion(false);
    }
  }, [orden?.id, orden?.estado_nombre]);

  useEffect(() => {
    if (id) fetchOrden();
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

  useEffect(() => {
    if (!orden?.id) return;

    if (["asignada", "esperando aceptacion", "preparado", "en camino"].includes(orden.estado_nombre?.toLowerCase() ?? '') && orden.conductor_nombre) {
      fetchDeliveryLocation();
      const interval = setInterval(() => {
        fetchDeliveryLocation();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [orden?.id, orden?.estado_nombre]);

  if (!orden) {
    return (
      <ScreenWrapper>
        <Header title="Detalle de Orden" showBack />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </ScreenWrapper>
    );
  }

  const InfoRow = ({ icon, label, value, darkMode }: { icon: any; label: string; value: string; darkMode: boolean }) => (
    <View className="flex-1 items-center">
      <FontAwesome5 name={icon} size={20} color="#B8860B" />
      <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{label}</Text>
      <Text className="font-semibold text-sm" style={{ color: darkMode ? '#EAB308' : '#2563EB' }}>{value}</Text>
    </View>
  );

  const restauranteCoords = {
    latitude: Number(orden.restaurante_latitud) || 0,
    longitude: Number(orden.restaurante_longitud) || 0,
  };

  return (
    <ScreenWrapper>
      <Header title="Detalle de Orden" showBack />
      
      <ScrollView
        className="px-5 flex-1"
        contentContainerStyle={{ paddingBottom: 80 + insets.bottom }}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="mb-4">
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }} className="mt-3">
            <View className="flex-row justify-between items-start mb-2">
              <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>
                Pedido #{orden.numero_orden}
              </Text>
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
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                {format(new Date(orden.creado_en), "dd/MM/yyyy", { locale: es })}
              </Text>
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Est. entrega: 30-45 min
              </Text>
            </View>

            <View className="flex-row justify-between border-t border-gray-200 pt-3">
              <InfoRow darkMode={darkMode} icon="credit-card" label="Método" value="Efectivo" />
              <InfoRow darkMode={darkMode} icon="dollar-sign" label="Pagado" value={`$${orden.total}`} />
              <InfoRow darkMode={darkMode} icon="calendar" label="Fecha" value={format(new Date(orden.creado_en), "dd/MM/yyyy", { locale: es })} />
              <InfoRow darkMode={darkMode} icon="clock" label="Hora" value={format(new Date(orden.creado_en), "HH:mm", { locale: es })} />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="mb-4">
          <Text className={`font-extrabold text-base mb-2 ${darkMode ? "text-white" : "text-black"}`}>Mapa</Text>
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
            {["asignada", "esperando aceptacion", "preparado", "en camino"].includes(orden.estado_nombre?.toLowerCase() ?? '') && orden.conductor_nombre ? (
              deliveryLocation && orden.latitud && orden.longitud ? (
                <RutaMapa
                  restaurante={restauranteCoords}
                  destino={{ latitude: orden.latitud, longitude: orden.longitud }}
                  delivery={deliveryLocation ? { latitude: deliveryLocation.latitud, longitude: deliveryLocation.longitud } : undefined}
                />
              ) : (
                <View className="h-48 items-center justify-center">
                  <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Esperando ubicación del delivery...</Text>
                </View>
              )
            ) : ["entregada", "confirmación de entrega"].includes(orden.estado_nombre?.toLowerCase() ?? '') ? (
              <View className="h-48 items-center justify-center">
                <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                <Text className="text-green-500 font-bold text-lg mt-2">¡Orden finalizada!</Text>
                <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Tu pedido fue entregado exitosamente</Text>
              </View>
            ) : (
              <View className="h-48 items-center justify-center">
                <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Mapa disponible cuando el delivery esté asignado</Text>
              </View>
            )}
          </Card>
        </Animated.View>

        {["asignada", "esperando aceptacion", "preparado", "en camino", "entregada", "confirmación de entrega"].includes(orden.estado_nombre?.toLowerCase() ?? '') && orden.conductor_nombre && (
          <Animated.View entering={FadeInDown.delay(400).duration(400).springify()} className="mb-4">
            <Text className={`font-extrabold text-base mb-2 ${darkMode ? "text-white" : "text-black"}`}>Delivery</Text>
            <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
<Image
                      source={{ uri: orden.conductor_foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png" }}
                      className="w-14 h-14 rounded-full mr-3 border-2 border-blue-200"
                    />
                <View>
                      <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>{orden.conductor_nombre || "Sin asignar"}</Text>
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {orden.conductor_telefono || "Sin teléfono"}
                      </Text>
                      <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {orden.conductor_calificacion && orden.conductor_calificacion > 0
                          ? `${orden.conductor_calificacion.toFixed(1)} (${orden.conductor_calificacion_count ?? 0} reseñas)`
                          : "Sin calificación"}
                      </Text>
                    </View>
                </View>
                
                <TouchableOpacity
                  onPress={() => {
                    if (orden.conductor_telefono) {
                      const url = `https://wa.me/${orden.conductor_telefono.replace(/\D/g, '')}`;
                      Linking.openURL(url);
                    } else {
                      Alert.alert("Sin teléfono", "El conductor no tiene teléfono registrado.");
                    }
                  }}
                  className="bg-green-600 px-4 py-2 rounded-full"
                >
                  <Text className="text-white font-semibold">WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} className="mb-4">
          <Text className={`font-extrabold text-base mb-2 ${darkMode ? "text-white" : "text-black"}`}>Restaurante</Text>
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <Image
                  source={{ uri: orden.restaurante_imagen || "https://cdn-icons-png.flaticon.com/512/3081/3081909.png" }}
                  className="w-14 h-14 rounded-xl mr-3"
                  resizeMode="cover"
                />
                <View>
                  <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>{orden.restaurante_nombre}</Text>
                  <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {orden.restaurante_calificacion && orden.restaurante_calificacion > 0
                      ? `${orden.restaurante_calificacion.toFixed(1)} (${orden.restaurante_calificacion_count ?? 0} reseñas)`
                      : "Sin calificación"}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => router.push("/search")}
                className="bg-primary px-4 py-2 rounded-full"
              >
                <Text className="text-white font-semibold">Ver</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400).springify()} className="mb-4">
          <Text className={`font-extrabold text-base mb-2 ${darkMode ? "text-white" : "text-black"}`}>Detalle de la orden</Text>
          {orden.detalles?.map((item, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(100 + idx * 50).duration(400).springify()} className="mb-2">
              <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={{ uri: item.plato_imagen }}
                      className="h-16 w-16 rounded-xl mr-3"
                      resizeMode="cover"
                    />
                    <View>
                      <Text className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>{item.plato_nombre}</Text>
                      <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-sm`}>x{item.cantidad}</Text>
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
                  </View>
                  <Text className="font-bold text-primary">${Number(item.subtotal || 0).toFixed(2)}</Text>
                </View>
              </Card>
            </Animated.View>
          ))}
          
          <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }} className="mt-2">
            <View className="flex-row justify-between py-2">
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Subtotal</Text>
              <Text className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>${Number(orden.subtotal || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between py-2">
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>IVA</Text>
              <Text className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>${Number(orden.iva || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between py-2">
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Envío</Text>
              <Text className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>${Number(orden.costo_envio || 0).toFixed(2)}</Text>
            </View>
            <View className="h-px bg-gray-200 my-1" />
            <View className="flex-row justify-between py-2">
              <Text className="font-bold text-primary">Total</Text>
              <Text className="font-bold text-lg" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${Number(orden.total).toFixed(2)}</Text>
            </View>
          </Card>
        </Animated.View>


      </ScrollView>
      <Modal
        visible={modalConfirmacion}
        animationType="fade"
        transparent
        onRequestClose={() => {}}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className={`rounded-3xl p-6 w-5/6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`font-bold text-lg text-center mb-4 ${darkMode ? "text-white" : "text-black"}`}>
              ¡Orden entregada!
            </Text>
            <Text className={`text-sm text-center mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Confirma que recibiste tu pedido y califica tu experiencia
            </Text>

            <Text className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Califica al restaurante</Text>
            <View className="flex-row justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRestaurantePuntaje(star)}>
                  <Ionicons
                    name={star <= restaurantePuntaje ? "star" : "star-outline"}
                    size={36}
                    color={star <= restaurantePuntaje ? "#EAB308" : darkMode ? "#6B7280" : "#D1D5DB"}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {orden?.conductor_nombre && (
              <>
                <Text className={`font-semibold mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Califica al repartidor</Text>
                <View className="flex-row justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setConductorPuntaje(star)}>
                      <Ionicons
                        name={star <= conductorPuntaje ? "star" : "star-outline"}
                        size={36}
                        color={star <= conductorPuntaje ? "#EAB308" : darkMode ? "#6B7280" : "#D1D5DB"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity
              onPress={() => {
                setModalConfirmacion(false);
                handleConfirmarEntrega();
              }}
              disabled={confirmando}
              className="bg-primary py-3.5 px-6 rounded-2xl items-center mt-2"
              style={{ opacity: confirmando ? 0.6 : 1 }}
            >
              <Text className="text-white font-bold">
                {confirmando ? "Confirmando..." : "Confirmar recepción"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalConfirmacion(false)}
              className="py-3 px-6 rounded-2xl items-center mt-2"
            >
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon as any}
        onClose={() => setPopup({ ...popup, visible: false })}
      />
    </ScreenWrapper>
  );
}