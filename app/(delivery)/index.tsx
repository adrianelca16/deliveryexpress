import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useFocusEffect, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Orden } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function DeliveryHome() {
  const { darkMode } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [disponible, setDisponible] = useState<boolean>(false);
  const [ordenActual, setOrdenActual] = useState<Orden | null>(null);
  const [ordenesAsignadas, setOrdenesAsignadas] = useState<Orden[]>([]);
  const [contador, setContador] = useState(30);
  const [showModal, setShowModal] = useState(false);

  const router = useRouter();

  const fetchDisponibilidad = () => {
    axios
      .get(`${API_URL}/api/user/conductor/mi_estado/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => setDisponible(res.data.disponible))
      .catch((err) => console.log("Error cargando estado:", err));
  };

  const toggleDisponibilidad = async () => {
    try {
      const nuevoEstado = !disponible;
      setDisponible(nuevoEstado);

      console.log(nuevoEstado);

      console.log(user?.token);
      await axios.patch(
        `${API_URL}/api/user/conductor/mi_estado/`,
        { disponible: nuevoEstado },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      Alert.alert(
        "Estado actualizado",
        nuevoEstado
          ? "Ahora estás disponible 🚴‍♂️"
          : "Te marcaste como inactivo ❌",
      );
    } catch (err) {
      console.log("Error actualizando disponibilidad:", err);
      setDisponible(!disponible);
    }
  };

  const fetchOrdenesPorAceptar = () => {
    axios
      .get(`${API_URL}/api/ordenes/ordenes/esperando-aceptacion/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => {
        if (res.data.length > 0) {
          const nuevaOrden = res.data[0];
          setOrdenActual(nuevaOrden);
          setShowModal(true);
          setContador(30);
        }
      })
      .catch((err) => console.log("Error cargando ordenes:", err));
  };

  const fetchOrdenesAsignadas = () => {
    axios
      .get(`${API_URL}/api/ordenes/ordenes/mis-ordenes/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      .then((res) => {
        setOrdenesAsignadas(res.data);
      })
      .catch((err) => console.log("Error cargando ordenes asignadas:", err));
  };

  const aceptarOrden = async () => {
    if (!ordenActual) return;
    try {
      await axios.post(
        `${API_URL}/api/ordenes/ordenes/${ordenActual.id}/aceptar/`,
        {},
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );
      Alert.alert("✅ Orden aceptada");
      fetchOrdenesAsignadas();
    } catch (e) {
      Alert.alert("Error", "No se pudo aceptar la orden.");
    }
    setShowModal(false);
    setOrdenActual(null);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDisponibilidad();
      fetchOrdenesAsignadas();
    }, []),
  );

  useEffect(() => {
    let locationInterval: ReturnType<typeof setInterval>;
    let ordenesInterval: ReturnType<typeof setInterval>;
    let timerInterval: ReturnType<typeof setInterval>;

    const startSendingLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se puede acceder a la ubicación.");
        return;
      }

      locationInterval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          await axios.patch(
            `${API_URL}/api/user/conductor/mi_estado/`,
            {
              latitud: location.coords.latitude,
              longitud: location.coords.longitude,
            },
            { headers: { Authorization: `Bearer ${user?.token}` } },
          );

          console.log("📍 Ubicación enviada:", location.coords);
        } catch (err) {
          console.log("Error enviando ubicación:", err);
        }
      }, 30000);
    };

    if (disponible) {
      startSendingLocation();

      fetchOrdenesPorAceptar();
      ordenesInterval = setInterval(() => {
        fetchOrdenesPorAceptar();
      }, 30000);
    }

    if (showModal && contador > 0) {
      timerInterval = setInterval(() => {
        setContador((prev) => prev - 1);
      }, 1000);
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
      if (ordenesInterval) clearInterval(ordenesInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [disponible, showModal]);

  return (
    <ScreenWrapper>
      <View className="flex-row justify-end items-center px-4 py-3 mb-2 mt-2 mx-4">
        <TouchableOpacity
          onPress={() => router.push("/profile")}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="notifications-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
        <Card className="flex-row gap-4 mx-4" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
          <Image
            source={{ uri: user?.foto_perfil || user?.foto_perfil_url }}
            className="w-24 h-24 rounded-full border-2 border-primary"
          />
          <View className="justify-between flex-1">
            <View>
              <Text
                className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}
              >
                {user?.nombre}
              </Text>
              <Text
                className={`font-bold ${disponible ? "text-green-600" : "text-red-500"}`}
              >
                Estado: {disponible ? "Disponible" : "No disponible"}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`py-2 px-4 rounded-full ${disponible ? "bg-red-500" : "bg-primary"}`}
                onPress={toggleDisponibilidad}
              >
                <Text className="font-bold text-white">
                  {disponible ? "Desactivarme" : "Activarme"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={logout} className="justify-center">
                <Text className="font-bold text-secondary">Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </Animated.View>

      <ScrollView
        className="px-6 mt-4"
      >
        <Text className="text-xl font-bold mt-4 mb-3 text-center text-primary">
          Órdenes asignadas
        </Text>
        {ordenesAsignadas.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400).springify()}
          >
            <Card>
              <Text
                className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-center`}
              >
                No tienes órdenes asignadas.
              </Text>
            </Card>
          </Animated.View>
        ) : (
          ordenesAsignadas.map((orden, index) => (
            <Animated.View
              key={orden.id}
              entering={FadeInDown.delay(200 + index * 100)
                .duration(400)
                .springify()}
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
                      <Text
                        className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}
                      >
                        {new Date(orden.creado_en).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-primary text-lg font-bold">
                        ${orden.total}
                      </Text>
                      <Text
                        className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Ver detalles
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center items-center">
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            className="w-5/6"
          >
            <Card>
              {ordenActual && (
                <>
                  <View className="items-center mb-4">
                    <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-3">
                      <Ionicons name="bicycle" size={36} color="#2563EB" />
                    </View>
                    <Text
                      className={`text-xl font-bold ${darkMode ? "text-white" : "text-black"}`}
                    >
                      Nueva Orden
                    </Text>
                  </View>
                  <Text
                    className={`${darkMode ? "text-gray-300" : "text-gray-700"} mb-2 text-center`}
                  >
                    Cliente: {ordenActual.cliente_nombre}
                  </Text>
                  <View className="bg-red-50 dark:bg-red-900/20 rounded-xl py-2 px-4 mb-4 items-center">
                    <Text className="text-red-600 font-bold text-lg">
                      Tiempo restante: {contador}s
                    </Text>
                  </View>
                  <View className="flex-row justify-between gap-4">
                    <CustomButton
                      title="Rechazar"
                      onPress={() => {
                        setShowModal(false);
                        setOrdenActual(null);
                      }}
                      style="bg-red-500 flex-1"
                    />
                    <CustomButton
                      title="Aceptar"
                      onPress={aceptarOrden}
                      style="bg-green-600 flex-1"
                    />
                  </View>
                </>
              )}
            </Card>
          </Animated.View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}
