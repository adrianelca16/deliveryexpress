import "../global.css";
import {
  ScrollView,
  Text,
  View,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { API_URL, images, getCategoryImage } from "@/constants";
import { useCallback, useState } from "react";
import axios from "axios";
import { Categoria, Direccion, Plato, Restaurante } from "@/type";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { router, useFocusEffect } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Carrusel from "@/components/Carrusel";
import ScreenLoading from "@/components/ScreenLoading";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import LocationHeader from "@/components/ui/LocationHeader";
import PopupMessage from "@/components/PopupMessage";

export default function Index() {
  const token = useAuthStore((state) => state.user?.token);
  const user = useAuthStore((store) => store.user);
  const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantesTop, setRestaurantesTop] = useState<Restaurante[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);
  const [platosPromocion, setPlatosPromocion] = useState<Plato[]>([]);
  const [platosDescuento, setPlatosDescuento] = useState<Plato[]>([]);
  const { darkMode } = useThemeStore();

  const [popup, setPopup] = useState({ visible: false, message: "", icon: "cancel" as const });
  const showError = (msg: string) => setPopup({ visible: true, message: msg, icon: "cancel" });

  const [busqueda, setBusqueda] = useState('');

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/categorias/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasDisponibles(res.data);
    } catch (err) {
      showError("Error al cargar categorías");
    }
  };

  const fetchRestaurantes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/restaurantes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const top = [...res.data]
        .sort((a, b) => (b.calificacion_promedio || 0) - (a.calificacion_promedio || 0))
        .slice(0, 5);
      setRestaurantesTop(top);
    } catch (err) {
      showError("Error al cargar restaurantes");
    }
  };

  const fetchPlatos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/platos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: Plato[] = res.data;
      const ordenados = [...data]
        .sort((a, b) => (Number(b.precio_descuento ?? b.precio) || 0) - (Number(a.precio_descuento ?? a.precio) || 0))
        .slice(0, 10);
      setPlatosPromocion(ordenados);
      const descuento = [...data]
        .filter((p) => p.precio_descuento)
        .sort((a, b) => {
          const dA = ((a.precio - a.precio_descuento) / a.precio) * 100;
          const dB = ((b.precio - b.precio_descuento) / b.precio) * 100;
          return dB - dA;
        })
        .slice(0, 5);
      setPlatosDescuento(descuento);
    } catch (err) {
      showError("Error al cargar platos");
    }
  };

  const fetchDireccionPrincipal = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const principal = res.data.find((d: Direccion) => d.es_predeterminada);
      setDireccionPrincipal(principal || null);
    } catch (err) {
      showError("Error al cargar dirección");
    }
  };

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        fetchCategorias(),
        fetchPlatos(),
        fetchRestaurantes(),
        fetchDireccionPrincipal(),
      ]).finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: darkMode ? "#111827" : "#FFFFFF",
        }}
      >
        {/* Header: ubicación + búsqueda */}
        <View className="px-5 pt-2 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <LocationHeader
                direccionTexto={direccionPrincipal?.nombre || direccionPrincipal?.direccion_texto}
                onLocationPress={() => router.push('/(tabs)/direcciones/direccion')}
              />
            </View>
          </View>

          <View className={`flex-row items-center mt-2 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} rounded-lg px-4`}>
            <Image source={images.search} className="w-5 h-5" resizeMode="contain" tintColor={darkMode ? "#9CA3AF" : "#2563EB"} />
            <TextInput
              placeholder="Buscar Restaurantes o platos ..."
              value={busqueda}
              onChangeText={setBusqueda}
              className={`flex-1 text-base font-semibold py-3.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
              onSubmitEditing={() => router.push({ pathname: "/search", params: { busqueda } })}
            />
          </View>
        </View>

        {/* Categorías en círculo */}
        {categoriasDisponibles.length > 0 && (
          <View className="mb-3 mt-2">
            <FlatList
              data={categoriasDisponibles}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 16 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(tabs)/search',
                        params: { categoriaSeleccionada: item.nombre },
                      })
                    }
                    className="items-center gap-2"
                  >
                    <View className="w-20 h-20 rounded-full items-center justify-center shadow-sm"
                      style={{ backgroundColor: item.color || '#F3F4F6' }}
                    >
                      <Image
                        source={item.imagen_url ? { uri: item.imagen_url } : item.imagen ? { uri: item.imagen } : getCategoryImage(item.nombre)}
                        className="w-12 h-12"
                        resizeMode="contain"
                      />
                    </View>
                    <Text className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          </View>
        )}

        {/* Publicidad */}
        <View className="mx-5 mb-3">
          <Carrusel />
        </View>

        {/* Populares */}
        {platosPromocion.length > 0 && (
          <View className="mb-0">
            <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
              <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Platos Más Populares
              </Text>
              <TouchableOpacity onPress={() => router.push("/search")}>
                <Text className="text-sm font-semibold text-primary">Ver todo</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={platosPromocion}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 14 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 80).duration(400)} className="overflow-visible">
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/restaurante/plato-detalle",
                        params: { id: item.id.toString() },
                      })
                    }
                    className={`w-52 rounded-2xl overflow-visible ${darkMode ? "bg-gray-800" : "bg-white"}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                  >
                    <Image
                      source={{ uri: item.imagen }}
                      className="w-full h-32 rounded-t-2xl"
                      resizeMode="cover"
                    />
                    <View className="p-3">
                      <Text className={`font-semibold text-base ${darkMode ? "text-gray-200" : "text-gray-800"}`} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <View className="flex-row items-center justify-between mt-0.5">
                        <View className="flex-row items-center gap-1.5">
                          <Text className={`font-bold text-base ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                            ${item.precio_descuento ?? item.precio}
                          </Text>
                          {item.precio_descuento && (
                            <Text className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"} line-through`}>
                              ${item.precio}
                            </Text>
                          )}
                        </View>
                        <View className="flex-row items-center gap-0.5">
                          <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                          <Text className={`text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {item.calificacion_promedio?.toFixed(1) ?? "4.5"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          </View>
        )}

        {/* Platos con Mayor Descuentos */}
        {platosDescuento.length > 0 && (
          <View className="mb-0">
            <View className="flex-row items-center justify-between px-5 pb-3">
              <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Platos con Mayor Descuentos
              </Text>
            </View>
            <FlatList
              data={platosDescuento}
              horizontal
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}
              renderItem={({ item, index }) => (
                <Animated.View entering={FadeInDown.delay(index * 80).duration(400)} className="overflow-visible">
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/restaurante/plato-detalle",
                        params: { id: item.id.toString() },
                      })
                    }
                    className={`w-64 rounded-2xl p-3.5 flex-row overflow-visible ${darkMode ? "bg-gray-800" : "bg-blue-50"}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                  >
                    <View className="flex-1">
                      <Text className={`font-bold text-base ${darkMode ? "text-gray-200" : "text-gray-900"}`} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <View className="flex-row items-center gap-1.5 mt-1">
                        <Text className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"} line-through`}>
                          ${item.precio}
                        </Text>
                        <Ionicons name="arrow-forward" size={14} color="#2563EB" />
                        <Text className={`font-bold text-base ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
                          ${item.precio_descuento}
                        </Text>
                      </View>
                    </View>
                    <View className="bg-blue-600 rounded-xl px-3 py-2 items-center justify-center ml-2">
                      <Text className="font-bold text-base text-white">
                        {Math.round(((item.precio - item.precio_descuento) / item.precio) * 100)}% off
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          </View>
        )}

        {/* Restaurantes Más Calificados */}
        {restaurantesTop.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
              <Text className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Restaurantes Más Calificados
              </Text>
              <TouchableOpacity onPress={() => router.push("/search")}>
                <Text className="text-sm font-semibold text-primary">Ver todo</Text>
              </TouchableOpacity>
            </View>
            <View className="px-5 gap-4 pb-4">
              {restaurantesTop.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(index * 100).duration(400)} className="overflow-visible">
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/restaurante/restaurante",
                        params: { id: item.id.toString() },
                      })
                    }
                    className={`rounded-2xl overflow-visible ${darkMode ? "bg-gray-800" : "bg-white"}`}
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                  >
                    <Image
                      source={item.imagen_url ? { uri: item.imagen_url } : images.placeholder}
                      className="w-full h-44 rounded-t-2xl"
                      resizeMode="cover"
                    />
                    <View className="p-4">
                      <Text className={`font-bold text-xl ${darkMode ? "text-gray-200" : "text-gray-800"}`} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <View className="flex-row items-center justify-between mt-1.5">
                        <Text className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-500"}`} numberOfLines={1}>
                          {typeof item.categoria === "string" ? item.categoria : item.categoria?.nombre}
                        </Text>
                        <View className="flex-row items-center gap-0.5">
                          <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
                          <Text className={`text-sm font-semibold ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                            {item.calificacion_promedio?.toFixed(1) ?? "0.0"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}