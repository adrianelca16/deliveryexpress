import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View, Image, TouchableOpacity } from "react-native";
import { useState, useCallback } from "react";
import Animated, { FadeInDown } from "react-native-reanimated";
import axios from "axios";
import { API_URL, images } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { Plato, Restaurante } from "@/type";
import { Ionicons, FontAwesome, Feather } from "@expo/vector-icons";
import CarritoFlotante from "@/components/FloatingCart";
import { useCarrito } from "@/store/useCart";
import { useThemeStore } from '@/store/theme.store';
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";

const RestaurantePlatos = () => {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const { carrito, agregarAlCarrito, quitarDelCarrito } = useCarrito();
  const { darkMode } = useThemeStore();

  const [platos, setPlatos] = useState<Plato[]>([]);
  const [restaurante, setRestaurante] = useState<Restaurante>();
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const fetchPlatos = async () => {
    try {
      const resPlatos = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${id}/platos/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlatos(resPlatos.data);

      const res = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${id}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurante(res.data);
    } catch (err) {
      console.log("Error obteniendo platos:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlatos();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id])
  );

  return (
    <ScreenWrapper className="flex-1">
      <Header
        showBack
        title={restaurante?.nombre || ""}
        rightAction={
          <TouchableOpacity onPress={() => router.push("/profile")} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                        <Ionicons name="notifications-outline" size={24} color="#2563EB" />
          </TouchableOpacity>
        }

        className="mb-3"
      />

      <ScrollView contentContainerStyle={{}} showsVerticalScrollIndicator={false}>
        {/* Imagen del restaurante */}
        <View className="px-4 mb-4">
          <View className="relative">
            <Image
              source={restaurante?.imagen_url ? { uri: restaurante.imagen_url } : images.avatar}
              className="w-full h-56 rounded-2xl"
              resizeMode="cover"
            />
            <View className="absolute top-3 right-3 flex-row items-center gap-1.5 bg-white px-3 py-1.5 rounded-full">
              <FontAwesome name="star" size={16} color="#B8860B" />
              <Text className="text-base font-bold" style={{ color: '#B8860B' }}>
                {restaurante?.calificacion_promedio ?? "0.0"}
              </Text>
            </View>
          </View>
        </View>

        {/* Info del restaurante */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center gap-4 mb-2">
            <View className="flex-row items-center gap-1.5 flex-1">
              <FontAwesome name="map-marker" size={16} color="#2563EB" />
              <Text className={`text-base font-semibold flex-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={1}>
                {restaurante?.direccion}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Feather name="clock" size={14} color="#2563EB" />
              <Text className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>30-40 min</Text>
            </View>
          </View>

          {restaurante?.descripcion && (
            <Text className={`text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {restaurante.descripcion}
            </Text>
          )}
        </View>

        {/* Separador con título */}
        <View className="flex-row items-center px-4 mb-4">
          <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <Text className={`mx-4 text-sm font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-primary"}`}>
            Menú
          </Text>
          <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </View>

        {loading ? (
          <View className="items-center py-12">
            <Text className={`text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cargando...</Text>
          </View>
        ) : platos.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="fast-food-outline" size={48} color={darkMode ? "#6B7280" : "#9CA3AF"} />
            <Text className={`mt-3 text-base ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No hay platos disponibles</Text>
          </View>
        ) : (
          <View className="px-4 gap-4 pb-8">
            {platos.map((p, index) => {
              const itemEnCarrito = carrito.find((c) => c.id === p.id.toString());
return (
                <Animated.View
                  key={p.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  className="overflow-visible"
                >
                  <TouchableOpacity
                    onPress={() => router.push(`/restaurante/plato-detalle?id=${p.id}`)}
                    activeOpacity={0.9}
                  >
                    <Card className="flex-row overflow-hidden p-0" style={{ elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, backgroundColor: 'white' }}>
                      <Image
                        source={p.imagen ? { uri: p.imagen } : images.avatar}
                        className="w-[120px] h-full rounded-l-2xl"
                        resizeMode="cover"
                      />
                      <View className="flex-1 p-4 justify-between">
                        <View>
                          <Text className={`text-base font-extrabold ${darkMode ? "text-gray-100" : "text-gray-900"} mb-1`}>
                            {p.nombre}
                          </Text>
                          <Text
                            className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mb-2`}
                            numberOfLines={2}
                          >
                            {p.descripcion}
                          </Text>
                        </View>
                        <View className="flex-row justify-between items-center">
{p.precio_descuento ? (
                             <View className="flex-row items-center gap-2">
                               <Text className="text-lg font-bold" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                                 ${p.precio_descuento}
                               </Text>
                               <Text className="text-xs text-gray-400 line-through">
                                 ${p.precio}
                               </Text>
                             </View>
                           ) : (
                             <Text className="text-lg font-bold" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                               ${p.precio}
                             </Text>
                           )}

                          {itemEnCarrito ? (
                            <View className="flex-row items-center gap-2">
                              <TouchableOpacity
                                onPress={() => quitarDelCarrito(p.id.toString())}
                                className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center"
                              >
                                <Ionicons name="remove" size={18} color="#2563EB" />
                              </TouchableOpacity>
                              <Text className={`text-base font-bold min-w-[20px] text-center ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {itemEnCarrito.cantidad}
                              </Text>
                              <TouchableOpacity
                                onPress={() => {
                                  agregarAlCarrito({
                                    id: p.id.toString(),
                                    nombre: p.nombre,
                                    precio: p.precio,
                                    imagen: p.imagen,
                                    nombre_restaurante: restaurante?.nombre || "",
                                    descripcion: p.descripcion,
                                    precio_descuento: p.precio_descuento,
                                    restauranteId: restaurante?.id || "",
                                  })
                                }}
                                className="w-8 h-8 rounded-full bg-primary items-center justify-center"
                              >
                                <Ionicons name="add" size={18} color="white" />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              onPress={() =>
                                agregarAlCarrito({
                                  id: p.id.toString(),
                                  nombre: p.nombre,
                                  precio: p.precio,
                                  imagen: p.imagen,
                                  nombre_restaurante: restaurante?.nombre || "",
                                  precio_descuento: p.precio_descuento,
                                  descripcion: p.descripcion,
                                  restauranteId: restaurante?.id || "",
                                })
                              }
                              className="bg-primary py-2 px-4 rounded-full shadow-lg shadow-primary/30"
                            >
                              <Text className="text-white text-sm font-bold">Añadir</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CarritoFlotante
        totalItems={carrito.reduce((acc, i) => acc + i.cantidad, 0)}
        onPress={() => router.push("/cart")}
      />
    </ScreenWrapper>
  );
};

export default RestaurantePlatos;
