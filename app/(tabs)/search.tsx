import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import {
  ScrollView,
  Text,
  View,
  Image,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from "react-native";
import {
  API_URL,
  images,
  getCategoryImage,
  getCategoryColor,
} from "@/constants";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
import { Categoria, Direccion, Restaurante } from "@/type";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import LocationHeader from "@/components/ui/LocationHeader";
import { useThemeStore } from "@/store/theme.store";
import Animated, { FadeInDown } from "react-native-reanimated";

const Search = () => {
  const token = useAuthStore((state) => state.user?.token);
  const router = useRouter();
  const { categoriaSeleccionada } = useLocalSearchParams();

  const [direccionPrincipal, setDireccionPrincipal] =
    useState<Direccion | null>(null);

  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<
    Categoria[]
  >([]);
  const [loading, setLoading] = useState(true);

  const [filtroSeleccionado, setFiltroSeleccionado] = useState(
    Array.isArray(categoriaSeleccionada)
      ? categoriaSeleccionada[0] || "Todos"
      : categoriaSeleccionada || "Todos",
  );
  const [busqueda, setBusqueda] = useState("");

  const { darkMode } = useThemeStore();

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/categorias/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasDisponibles(res.data);
    } catch (err) {
      console.log("Error obteniendo categorías:", err);
    }
  };

  const fetchRestaurantes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/restaurantes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurantes(res.data);
    } catch (err) {
      console.log("Error cargando restaurantes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDireccionPrincipal = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const principal = res.data.find((d: Direccion) => d.es_predeterminada);
      setDireccionPrincipal(principal || null);
    } catch (err) {
      console.log("Error obteniendo direcciones:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRestaurantes();
      fetchCategorias();
      fetchDireccionPrincipal();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  useEffect(() => {
    if (categoriaSeleccionada) {
      setFiltroSeleccionado(
        Array.isArray(categoriaSeleccionada)
          ? categoriaSeleccionada[0] || "Todos"
          : categoriaSeleccionada || "Todos",
      );
    }
  }, [categoriaSeleccionada]);

  // Filtrar por categoría + búsqueda
  const restaurantesFiltrados = restaurantes.filter((r) => {
    const categoriaNombre =
      typeof r.categoria === "string" ? r.categoria : r.categoria?.nombre || "";

    const coincideCategoria =
      filtroSeleccionado === "Todos" ||
      categoriaNombre.toLowerCase().includes(filtroSeleccionado.toLowerCase());

    const coincideBusqueda = r.nombre
      ? r.nombre.toLowerCase().includes(busqueda.toLowerCase())
      : false;

    return coincideCategoria && coincideBusqueda;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-2 pb-2">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <LocationHeader
                direccionTexto={
                  direccionPrincipal?.nombre ||
                  direccionPrincipal?.direccion_texto
                }
                onLocationPress={() => router.push("/(tabs)/perfil/direccion")}
              />
            </View>
            <TouchableOpacity
              onPress={() => router.push("/profile")}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons
                name="notifications-outline"
                size={24}
                color="#2563EB"
              />
            </TouchableOpacity>
          </View>

          <View
            className={`flex-row items-center mt-2 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"} rounded-lg px-4`}
          >
            <Image
              source={images.search}
              className="w-5 h-5"
              resizeMode="contain"
              tintColor={darkMode ? "#9CA3AF" : "#2563EB"}
            />
            <TextInput
              placeholder="Buscar Restaurantes o platos ..."
              value={busqueda}
              onChangeText={setBusqueda}
              className={`flex-1 text-base font-semibold py-3.5 ${darkMode ? "text-gray-100" : "text-gray-800"}`}
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
              onSubmitEditing={() =>
                router.push({ pathname: "/search", params: { busqueda } })
              }
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
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingBottom: 12,
                gap: 16,
              }}
              renderItem={({ item, index }) => (
                <Animated.View
                  entering={FadeInDown.delay(index * 50).duration(300)}
                >
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/search",
                        params: { categoriaSeleccionada: item.nombre },
                      })
                    }
                    className="items-center gap-2"
                  >
                    <View
                      className="w-20 h-20 rounded-full items-center justify-center shadow-sm"
                      style={{ backgroundColor: getCategoryColor(item.nombre) }}
                    >
                      <Image
                        source={
                          item.imagen
                            ? { uri: item.imagen }
                            : getCategoryImage(item.nombre)
                        }
                        className="w-12 h-12"
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className={`text-sm font-bold ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {item.nombre}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          </View>
        )}

        {loading ? (
          <Text className="text-center text-gray-500">Cargando...</Text>
        ) : restaurantesFiltrados.length === 0 ? (
          <Text className="text-center text-gray-500">No hay restaurantes</Text>
        ) : (
          <View className="px-5">
            {restaurantesFiltrados.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/restaurante/restaurante",
                    params: { id: item.id.toString() },
                  })
                }
                className="rounded-2xl overflow-hidden mb-4"
              >
                <ImageBackground
                  source={images.placeholder}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                  imageStyle={{ borderRadius: 16 }}
                >
                  {/* 🔹 Overlay oscuro */}
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: "rgba(0,0,0,0.45)",
                    }}
                  />

                  {/* 🔹 Contenido encima del overlay */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                    }}
                  >
                    {/* Imagen circular */}
                    <Image
                      source={
                        item.imagen_url
                          ? { uri: item.imagen_url }
                          : images.avatar
                      }
                      className="w-20 h-20 rounded-full border-2 border-white"
                      resizeMode="cover"
                    />

                    {/* Info central */}
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        className="text-lg font-extrabold text-white"
                        numberOfLines={1}
                      >
                        {item.nombre}
                      </Text>
                      <Text
                        className="text-base text-white font-semibold"
                        numberOfLines={1}
                      >
                        {typeof item.categoria === "string"
                          ? item.categoria
                          : item.categoria?.nombre}{" "}
                        • $$$
                      </Text>
                    </View>

                    {/* Puntuación derecha */}
                    <View className="flex-row items-center">
                      <Text className="text-xl font-bold text-white mr-1">
                        {item.calificacion_promedio?.toFixed(1) ?? "0.0"}
                      </Text>
                      <FontAwesome name="star" size={16} color="#f97316" />
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Search;
