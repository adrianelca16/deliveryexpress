import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useDeliveryStore } from "@/store/delivery.store";
import { useThemeStore } from "@/store/theme.store";
import { useState, useCallback, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Orden } from "@/type";
import { colorEstado, ESTADOS_ORDEN, TERMINADOS } from "@/utils/ordenes";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";
import PopupMessage from "@/components/PopupMessage";

export default function DeliveryHome() {
  const { darkMode } = useThemeStore();
  const { user } = useAuthStore();
  const {
    disponible, setDisponible,
    calificacion, setCalificacion,
    ordenActual, setOrdenActual,
    ordenesAsignadas, setOrdenesAsignadas,
    tiempoLimite, setTiempoLimite,
  } = useDeliveryStore();
  const [contador, setContador] = useState(30);
  const [showModal, setShowModal] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupIcon, setPopupIcon] = useState<"check-circle" | "cancel" | "warning" | "info">("info");
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(true);
  const disponibleRef = useRef(disponible);
  const intervaloLocationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervaloOrdenesRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervaloTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();

  useEffect(() => {
    disponibleRef.current = disponible;
  }, [disponible]);

  const fetchDisponibilidad = useCallback(async () => {
    try {
      const res = await api.get("/api/user/conductor/mi_estado/");
      setDisponible(res.data.disponible);
      setCalificacion(res.data.calificacion_promedio ?? 0);
    } catch (err) {
      setPopupMessage("Error al cargar tu estado");
      setPopupIcon("cancel");
      setPopupVisible(true);
    } finally {
      setLoadingDisponibilidad(false);
    }
  }, []);

  const toggleDisponibilidad = useCallback(async () => {
    const nuevoEstado = !disponibleRef.current;
    setDisponible(nuevoEstado);

    try {
      await api.patch("/api/user/conductor/mi_estado/", {
        disponible: nuevoEstado,
      });
    } catch (err) {
      setDisponible(!nuevoEstado);
      setPopupMessage("Error al cambiar disponibilidad");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
  }, []);

  const fetchOrdenesPorAceptar = useCallback(async () => {
    try {
      const res = await api.get("/api/ordenes/ordenes/esperando-aceptacion/");
      if (res.data.length > 0) {
        const nuevaOrden = res.data[0];
        setOrdenActual(nuevaOrden);
        setShowModal(true);
        setContador(tiempoLimite);
      }
    } catch (err) {
      setPopupMessage("Error al buscar órdenes");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
  }, [tiempoLimite]);

  const fetchOrdenesAsignadas = useCallback(async () => {
    try {
      const res = await api.get("/api/ordenes/ordenes/mis-ordenes/");
      const filtradas = res.data.filter(
        (orden: Orden) => !TERMINADOS.includes(orden?.estado_nombre?.toLowerCase() ?? '')
      );
      setOrdenesAsignadas(filtradas);
    } catch (err) {
      setPopupMessage("Error al cargar órdenes asignadas");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchDisponibilidad(), fetchOrdenesAsignadas()]);
    setRefreshing(false);
  }, [fetchDisponibilidad, fetchOrdenesAsignadas]);

  const aceptarOrden = useCallback(async () => {
    if (!ordenActual) return;
    try {
      await api.post(`/api/ordenes/ordenes/${ordenActual.id}/aceptar/`);
      setPopupMessage("Orden aceptada");
      setPopupIcon("check-circle");
      setPopupVisible(true);
      fetchOrdenesAsignadas();
    } catch {
      setPopupMessage("No se pudo aceptar la orden.");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
    setShowModal(false);
    setOrdenActual(null);
  }, [ordenActual, fetchOrdenesAsignadas]);

  const rechazarOrden = useCallback(async () => {
    if (!ordenActual) return;
    try {
      await api.post(`/api/ordenes/ordenes/${ordenActual.id}/rechazar/`);
      setPopupMessage("Orden rechazada");
      setPopupIcon("cancel");
      setPopupVisible(true);
      fetchOrdenesAsignadas();
    } catch {
      setPopupMessage("Error al rechazar");
      setPopupIcon("cancel");
      setPopupVisible(true);
    }
    setShowModal(false);
    setOrdenActual(null);
  }, [ordenActual, fetchOrdenesAsignadas]);

  const fetchParametros = useCallback(async () => {
    try {
      const res = await api.get("/api/gestion/parametros/publicos/");
      const minutos = parseFloat(res.data?.tiempo_espera_aceptacion_minutos || '0.5');
      const segundos = Math.round(minutos * 60);
      setTiempoLimite(segundos);
    } catch {
      setTiempoLimite(30);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDisponibilidad();
      fetchOrdenesAsignadas();
      fetchParametros();
    }, [fetchDisponibilidad, fetchOrdenesAsignadas, fetchParametros]),
  );

  useEffect(() => {
    if (!disponible) {
      if (intervaloLocationRef.current) clearInterval(intervaloLocationRef.current);
      if (intervaloOrdenesRef.current) clearInterval(intervaloOrdenesRef.current);
      intervaloLocationRef.current = null;
      intervaloOrdenesRef.current = null;
      return;
    }

    const startSendingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      intervaloLocationRef.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          await api.patch("/api/user/conductor/mi_estado/", {
            latitud: location.coords.latitude,
            longitud: location.coords.longitude,
          });
        } catch (err) {
          console.log("Error enviando ubicación:", err);
        }
      }, 30000);
    };

    startSendingLocation();
    fetchOrdenesPorAceptar();
    intervaloOrdenesRef.current = setInterval(fetchOrdenesPorAceptar, 30000);

    return () => {
      if (intervaloLocationRef.current) clearInterval(intervaloLocationRef.current);
      if (intervaloOrdenesRef.current) clearInterval(intervaloOrdenesRef.current);
      intervaloLocationRef.current = null;
      intervaloOrdenesRef.current = null;
    };
  }, [disponible]);

  useEffect(() => {
    if (showModal && contador > 0) {
      intervaloTimerRef.current = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    } else if (showModal && contador === 0) {
      setShowModal(false);
      setOrdenActual(null);
    }

    return () => {
      if (intervaloTimerRef.current) clearInterval(intervaloTimerRef.current);
      intervaloTimerRef.current = null;
    };
  }, [showModal, contador]);

  return (
    <ScreenWrapper>
       <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={darkMode ? "#60A5FA" : "#2563EB"}
          />
        }
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: darkMode ? "#111827" : "#FFFFFF",
        }}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <Card className="flex-row gap-4 mx-4 mt-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
            <Image
              source={{ uri: user?.foto_perfil || user?.foto_perfil_url }}
              className="w-24 h-24 rounded-full border-2 border-primary"
            />
            <View className="justify-between flex-1">
              <View>
                <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>
                  {user?.nombre}
                </Text>
                <View className="flex-row justify-between items-center">
                  <Text className={`font-bold ${disponible ? "text-green-600" : "text-red-500"}`}>
                    Estado: {disponible ? "Disponible" : "No disponible"}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star" size={16} color="#EAB308" />
                    <Text className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {calificacion.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <TouchableOpacity
                  className={`py-2 px-4 rounded-full ${disponible ? "bg-red-500" : "bg-primary"}`}
                  onPress={toggleDisponibilidad}
                >
                  <Text className="font-bold text-white">
                    {disponible ? "Desactivarme" : "Activarme"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => useAuthStore.getState().logout()} className="justify-center">
                  <Text className="font-bold text-secondary">Cerrar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        </Animated.View>

        <View className="px-6 mt-4">
          <Text className="text-xl font-bold mt-4 mb-3 text-center text-primary">
            Órdenes asignadas
          </Text>
          {ordenesAsignadas.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
              <Card>
                <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-center`}>
                  No tienes órdenes asignadas.
                </Text>
              </Card>
            </Animated.View>
          ) : (
            ordenesAsignadas.map((orden, index) => (
              <Animated.View
                key={orden.id}
                entering={FadeInDown.delay(200 + index * 100).duration(400).springify()}
              >
                <TouchableOpacity
                  className="mb-3"
                  onPress={() =>
                    router.push({
                      pathname: "/(delivery)/orden/orden-detalle",
                      params: { id: orden.id },
                    })
                  }
                >
                  <Card>
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="font-bold text-lg text-secondary">
                          Pedido #{orden.numero_orden}
                        </Text>
                        <Text className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {orden.creado_en ? new Date(orden.creado_en).toLocaleDateString() : ''}
                        </Text>
                        {orden.estado_nombre && (
                          <Text className="text-xs font-semibold mt-1" style={{ color: colorEstado(orden.estado_nombre, darkMode) }}>
                            {orden.estado_nombre}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-primary text-lg font-bold">
                          ${orden.total}
                        </Text>
                        <Text className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          Ver detalles
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <Animated.View entering={FadeInDown.duration(500).springify()} className="w-5/6">
            <Card>
              {ordenActual && (
                <>
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-3">
                      <Ionicons name="bicycle" size={36} color="#2563EB" />
                    </View>
                    <Text className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}>
                      Nueva Orden
                    </Text>
                  </View>
                  <Text className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-2 text-center`}>
                    Cliente: {ordenActual.cliente_nombre}
                  </Text>
                  <View className="bg-secondary/10 dark:bg-secondary/20 rounded-xl py-2 px-4 mb-4 items-center">
                    <Text className="text-secondary font-bold text-lg">
                      Tiempo restante: {contador}s
                    </Text>
                  </View>
                  <View className="flex-row justify-between gap-4">
                    <CustomButton
                      title="Rechazar"
                      onPress={rechazarOrden}
                      style="bg-secondary flex-1"
                    />
                    <CustomButton
                      title="Aceptar"
                      onPress={aceptarOrden}
                      style="bg-primary flex-1"
                    />
                  </View>
                </>
              )}
            </Card>
          </Animated.View>
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
