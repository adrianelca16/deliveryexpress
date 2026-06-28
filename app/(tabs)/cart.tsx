import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCarrito } from "@/store/useCart";
import { API_URL, images } from "@/constants";
import { useCallback, useEffect, useState } from "react";
import { Direccion, Estado, MetodosPagos } from "@/type";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import PopupMessage from "@/components/PopupMessage";

const Cart = () => {
  const router = useRouter();
  const { carrito, quitarDelCarrito, limpiarCarrito, agregarAlCarrito } = useCarrito();
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [costoEnvio, setCostoEnvio] = useState(0);

  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [impuesto, setImpuesto] = useState(0);

  const [metodosPago, setMetodosPago] = useState<MetodosPagos[]>([]);
  const [metodo, setMetodo] = useState<MetodosPagos | null>(null);

  const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(null);

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "check-circle" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "check-circle") => {
    setPopup({ visible: true, message, icon });
  };

  const fetchPagos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pagos/metodos-pago/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetodosPago(res.data);
    } catch (err) {
      console.log("Error obteniendo métodos de pago:", err);
    }
  };

  const fetchDireccionPrincipal = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const principal = res.data.find((d: Direccion) => d.es_predeterminada === true);
      setDireccionPrincipal(principal || null);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(res.data.find((e: Estado) => e.nombre.toLowerCase() === "pendiente"));
    } catch (err) {
      console.log("Error obteniendo estado de orden:", err);
    }
  };

  const calcularCostoEnvio = async () => {
    try {
      if (!direccionPrincipal || carrito.length === 0) return;

      const restauranteId = carrito[0].restauranteId;
      if (!restauranteId) return;

      const resRestaurante = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${restauranteId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const restaurante = resRestaurante.data;

      if (!restaurante.latitud || !restaurante.longitud) {
        console.warn("El restaurante no tiene coordenadas válidas");
        return;
      }

      const origen = {
        latitude: restaurante.latitud,
        longitude: restaurante.longitud,
      };
      const destino = {
        latitude: direccionPrincipal.latitud,
        longitude: direccionPrincipal.longitud,
      };

      const url = `https://maps.enruta.store/route/v1/driving/${origen.longitude},${origen.latitude};${destino.longitude},${destino.latitude}?overview=full&geometries=geojson`;

      const res = await axios.get(url);
      const distanciaMetros = res.data.routes[0].distance;
      const distanciaKm = distanciaMetros / 1000;

      let costo = distanciaKm <= 1 ? 1 : 1 + (distanciaKm - 1) * 0.45;

      const newSubtotal = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
      const newImpuesto = newSubtotal * 0.16;
      const newTotal = newSubtotal + newImpuesto + costo;

      setCostoEnvio(parseFloat(costo.toFixed(2)));
      setSubtotal(parseFloat(newSubtotal.toFixed(2)));
      setImpuesto(parseFloat(newImpuesto.toFixed(2)));
      setTotal(parseFloat(newTotal.toFixed(2)));

      console.log(`Distancia: ${distanciaKm.toFixed(2)} km`);
      console.log(`Costo envío: ${costo.toFixed(2)} USD`);
    } catch (err) {
      showPopup("No se pudo calcular el costo de envío", "cancel");
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPagos();
      fetchDireccionPrincipal();
      fecthEstatusOrden();
      calcularCostoEnvio();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  useEffect(() => {
    if (direccionPrincipal && carrito.length > 0) {
      calcularCostoEnvio();
    }
  }, [direccionPrincipal, carrito]);

  const handledSubmit = async () => {
    try {
      if (metodo) {
        if (metodo.nombre === "Pago móvil") {
          router.push({
            pathname: "/orden/pago-movil",
            params: { montoTotal: total.toFixed(2) },
          });
        } else {
          const restauranteId = carrito;

          const detalles = carrito.map((item) => ({
            plato: item.id,
            cantidad: item.cantidad,
          }));

          const payload = {
            restaurante: restauranteId[0].restauranteId,
            estado: estado?.id,
            metodo_pago: metodo.id,
            direccion_entrega: `${direccionPrincipal?.direccion_texto}`,
            latitud: direccionPrincipal?.latitud,
            longitud: direccionPrincipal?.longitud,
            detalles,
          };
          const res = await axios.post(
            `${API_URL}/api/ordenes/ordenes/`,
            payload,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (metodo.nombre === "Bolívares") {
            const payloadPagoBs = {
              orden: res.data.id,
              metodo: metodo.id,
              monto_usd: res.data.total,
              tasa_cambio: "160.00",
            };
            await axios.post(
              `${API_URL}/api/pagos/pagos/`,
              payloadPagoBs,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          } else {
            const payloadPago = {
              orden: res.data.id,
              metodo: metodo.id,
              monto_usd: res.data.total,
            };

            await axios.post(
              `${API_URL}/api/pagos/pagos/`,
              payloadPago,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
          }
          limpiarCarrito();
          showPopup("Tu orden fue registrada correctamente", "check-circle");
          setMetodo(null);
          setTimeout(() => router.replace("/(tabs)"), 2000);
        }
      }
    } catch (err) {
      console.log("Error al procesar la orden:", err);
    }
  };

  const seleccionarMetodo = (op: any) => {
    setMetodo(op);
    setModalVisible(false);
  };

  const renderCartItem = ({ item, index }: { item: any; index: number }) => {
    const itemEnCarrito = carrito.find((c) => c.id === item.id.toString());
    return (
      <Animated.View entering={FadeInDown.delay(index * 80).springify()} className="overflow-visible">
        <Card className="flex-row overflow-hidden p-0 mb-3" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
          <Image
            source={item.imagen ? { uri: item.imagen } : images.avatar}
            className="w-[100px] h-full rounded-l-2xl"
            resizeMode="cover"
          />
          <View className="flex-1 p-4 justify-between">
            <View>
              <Text className={`text-base font-extrabold ${darkMode ? "text-gray-100" : "text-gray-900"} mb-1`}>
                {item.nombre}
              </Text>
              {item.descripcion && (
                <Text
                  className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-1`}
                  numberOfLines={1}
                >
                  {item.descripcion}
                </Text>
              )}
            </View>
            <View className="flex-row justify-between items-center">
              {item.precio_descuento ? (
                <View className="flex-row items-center gap-2">
<Text className="text-lg font-bold" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
                      ${item.precio_descuento}
                    </Text>
                  <Text className="text-xs text-gray-400 line-through">
                    ${item.precio}
                  </Text>
                </View>
              ) : (
<Text className="text-lg font-bold" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
                      ${item.precio}
                    </Text>
              )}

              <View className="flex-row items-center gap-2">
                <TouchableOpacity
                  onPress={() => quitarDelCarrito(item.id.toString())}
                  className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center"
                >
                  <Ionicons name="remove" size={16} color="#2563EB" />
                </TouchableOpacity>
                <Text className={`text-base font-bold min-w-[18px] text-center ${darkMode ? "text-white" : "text-gray-900"}`}>
                  {itemEnCarrito?.cantidad ?? item.cantidad}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    agregarAlCarrito({
                      id: item.id.toString(),
                      nombre: item.nombre,
                      precio: item.precio,
                      imagen: item.imagen,
                      descripcion: item.descripcion,
                      precio_descuento: item.precio_descuento,
                    });
                  }}
                  className="w-7 h-7 rounded-full bg-primary items-center justify-center"
                >
                  <Ionicons name="add" size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <ScreenWrapper className="flex-1">
      <Header
        showBack
        title="Mi Carrito"
        rightAction={
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Ionicons name="notifications" size={24} color="#2563EB" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {carrito.length === 0 ? (
          <View className="flex-1 items-center justify-center mt-24 px-4">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons name="cart-outline" size={40} color="#2563EB" />
            </View>
            <Text className={`text-lg font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              Tu carrito está vacío
            </Text>
            <Text className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"} text-center`}>
              Agrega productos de tu restaurante favorito
            </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 bg-primary py-3 px-8 rounded-2xl shadow-lg shadow-primary/30"
            >
              <Text className="text-white font-bold">Ver menú</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="px-4">
            {/* Indicador de restaurante */}
            <Animated.View entering={FadeInDown.delay(0).springify()} className="overflow-visible">
              <Card className="flex-row items-center gap-3 mb-4" style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
<View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="restaurant" size={20} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Pedido de
                  </Text>
                  <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
                    {carrito[0]?.nombre_restaurante || "Restaurante"}
                  </Text>
                </View>
                <View className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full">
                  <Text className="text-sm font-bold text-primary">{carrito.length} items</Text>
                </View>
              </Card>
            </Animated.View>

            {/* Productos */}
            <View className="mb-4">
              {carrito.map((item, index) => (
                <View key={item.id}>
                  {renderCartItem({ item, index })}
                </View>
              ))}
            </View>

            {/* Resumen */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="overflow-visible">
              <Card className="mb-4" style={{ elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }}>
                <Text className={`text-lg font-extrabold mb-4 text-primary`}>
                  Detalles del pedido
                </Text>

                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Subtotal</Text>
                  <Text className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    ${subtotal.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Envío</Text>
                  <Text className="font-semibold" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${costoEnvio.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Impuestos (16%)</Text>
                  <Text className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    ${impuesto.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Total</Text>
                  <Text className="text-xl font-extrabold text-primary">
                    ${total.toFixed(2)}
                  </Text>
                </View>
              </Card>
            </Animated.View>

            {/* Método de pago */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="flex-row items-center justify-between py-4 px-5 rounded-2xl mb-4"
                style={{
                  backgroundColor: metodo
                    ? darkMode ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.1)"
                    : darkMode ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.08)",
                  borderWidth: 1,
                  borderColor: "#2563EB",
                }}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${metodo ? "bg-primary" : "bg-primary"}`}>
                    <Ionicons
                      name={metodo ? "card" : "wallet-outline"}
                      size={20}
                      color="white"
                    />
                  </View>
                  <View>
                    <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Método de pago
                    </Text>
                    <Text className={`text-base font-bold ${metodo ? "text-primary" : darkMode ? "text-white" : "text-primary"}`}>
                      {metodo ? metodo.nombre : "Seleccionar"}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color="#2563EB"
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Dirección */}
            {direccionPrincipal && (
              <Animated.View entering={FadeInDown.delay(350).springify()}>
                <Card className="flex-row items-center gap-3 mb-6">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="location" size={20} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Dirección de entrega
                    </Text>
                    <Text className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-900"}`} numberOfLines={1}>
                      {direccionPrincipal.direccion_texto}
                    </Text>
                  </View>
                </Card>
              </Animated.View>
            )}

            {/* Botón de pago */}
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <TouchableOpacity
                className={`py-4 px-6 rounded-2xl items-center flex-row justify-center gap-2 ${
                  direccionPrincipal && metodo ? "bg-primary" : darkMode ? "bg-gray-800" : "bg-gray-200"
                }`}
                onPress={() => handledSubmit()}
                disabled={!direccionPrincipal || !metodo}
                style={direccionPrincipal && metodo ? { shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 } : {}}
              >
                <Ionicons name="card" size={22} color={direccionPrincipal && metodo ? "white" : darkMode ? "#9CA3AF" : "#9CA3AF"} />
                <Text className={`text-lg font-bold ${direccionPrincipal && metodo ? "text-white" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  Pagar ${total.toFixed(2)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 mb-8"
                onPress={limpiarCarrito}
              >
                <Text className="text-center font-semibold" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
                  Cancelar pedido
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      </ScrollView>

      {/* Modal de selección */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className={`rounded-t-3xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-extrabold ${darkMode ? "text-white" : "text-gray-900"}`}>
                Método de pago
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
              >
                <Ionicons name="close" size={20} color={darkMode ? "#F9FAFB" : "#6B7280"} />
              </TouchableOpacity>
            </View>

            {metodosPago.length === 0 ? (
              <View className="items-center py-8">
                <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>No hay métodos de pago disponibles</Text>
              </View>
            ) : (
              metodosPago.map((op) => (
                <TouchableOpacity
                  key={op.id}
                  onPress={() => seleccionarMetodo(op)}
                  activeOpacity={0.8}
                >
                  <Card
                    className={`flex-row items-center justify-between mb-3 ${
                      metodo?.id === op.id
                        ? darkMode
                          ? "border border-primary/50 bg-primary/10"
                          : "border border-primary bg-primary/5"
                        : ""
                    }`}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className={`w-10 h-10 rounded-full items-center justify-center ${
                        metodo?.id === op.id ? "bg-primary" : darkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}>
                        <Ionicons
                          name={op.icons as any}
                          size={20}
                          color={metodo?.id === op.id ? "white" : darkMode ? "#F9FAFB" : "#6B7280"}
                        />
                      </View>
                      <Text className={`text-base font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                        {op.nombre}
                      </Text>
                    </View>

                    {metodo?.id === op.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#2563EB" />
                    )}
                  </Card>
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className={`mt-4 py-3.5 rounded-2xl items-center border ${
                darkMode ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <Text className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
};

export default Cart;
