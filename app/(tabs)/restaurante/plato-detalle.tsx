import { View, Text, ScrollView, TouchableOpacity, Image, useWindowDimensions, Modal, FlatList } from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { Plato, Restaurante } from "@/type";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { API_URL, images } from "@/constants";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useCarrito } from "@/store/useCart";
import { useThemeStore } from '@/store/theme.store';
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Card from "@/components/ui/Card";
import PopupMessage from "@/components/PopupMessage";

export default function PlatoDetalle() {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const [plato, setPlato] = useState<Plato>();
  const [restaurante, setRestaurante] = useState<Restaurante>();
  const [tiposOpciones, setTiposOpciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const { agregarAlCarrito } = useCarrito();
  const { darkMode } = useThemeStore();
  const [popup, setPopup] = useState({ visible: false, message: "", icon: "cancel" as const });
  const showError = (msg: string) => setPopup({ visible: true, message: msg, icon: "cancel" });
  const router = useRouter();
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const fetchPlato = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/platos/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlato(res.data);

      const restauranteRes = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/${res.data.restaurante}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurante(restauranteRes.data);

      const tiposRes = await axios.get(
        `${API_URL}/api/restaurantes/tipos-opciones/?plato=${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const tipos = tiposRes.data;

      const tiposConOpciones = await Promise.all(
        tipos.map(async (tipo: any) => {
          const opcionesRes = await axios.get(
            `${API_URL}/api/restaurantes/opciones/?tipo=${tipo.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return { ...tipo, opciones: opcionesRes.data };
        })
      );

      setTiposOpciones(tiposConOpciones);
    } catch (err) {
      showError("Error al cargar el plato");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPlato();
    }, [id])
  );

  const [selecciones, setSelecciones] = useState<Record<string, number[]>>({});
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const toggleOpcion = (tipoId: number, opcionId: number, multiple: boolean) => {
    setSelecciones((prev) => {
      const current = prev[tipoId] || [];
      if (multiple) {
        if (current.includes(opcionId)) {
          return { ...prev, [tipoId]: current.filter((id) => id !== opcionId) };
        } else {
          return { ...prev, [tipoId]: [...current, opcionId] };
        }
      } else {
        return { ...prev, [tipoId]: [opcionId] };
      }
    });
  };

  const calculateTotal = () => {
    if (!plato) return 0;

    const base = Number(plato.precio_descuento ?? plato.precio) || 0;
    let extras = 0;

    tiposOpciones.forEach((tipo) => {
      const seleccionadas = selecciones[tipo.id] || [];
      seleccionadas.forEach((opId) => {
        const op = tipo.opciones.find((o: any) => o.id === opId);
        if (op) extras += Number(op.precio_adicional) || 0;
      });
    });

    return (base + extras) * quantity;
  };

  const handleAddToCart = () => {
    const extrasSeleccionados: Array<{ id: string; nombre: string; precio: number }> = [];
    
    tiposOpciones.forEach((tipo) => {
      const seleccionadas = selecciones[tipo.id] || [];
      seleccionadas.forEach((opId) => {
        const op = tipo.opciones.find((o: any) => o.id === opId);
        if (op) {
          extrasSeleccionados.push({
            id: op.id.toString(),
            nombre: op.nombre,
            precio: Number(op.precio_adicional) || 0,
          });
        }
      });
    });

    const totalConExtras = calculateTotal();

    agregarAlCarrito({
      id: plato?.id?.toString() ?? "",
      nombre: plato?.nombre ?? "",
      precio: totalConExtras / quantity,
      imagen: plato?.imagen ?? "",
      nombre_restaurante: restaurante?.nombre || "",
      cantidad: quantity,
      restauranteId: restaurante?.id || "",
      extras: extrasSeleccionados,
    });

    router.back();
  };

  return (
    <ScreenWrapper>
      <Modal
        visible={loading}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.3)' }}>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 items-center justify-center" style={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }}>
            <Image
              source={images.carga}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <Text className={`mt-4 text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Cargando plato...
            </Text>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.1)',
          }}
        >
          <Ionicons name="chevron-back" size={22} color={darkMode ? "#F9FAFB" : "#2563EB"} />
        </TouchableOpacity>
        <Text className={`text-lg font-bold flex-1 text-center ${darkMode ? "text-white" : "text-primary"}`} numberOfLines={1}>
          {restaurante?.nombre ?? "Plato"}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
      >
        <View className="px-4">
          <Animated.View entering={FadeInDown.delay(0).springify()} className="-mx-4 mb-5">
            <View className="relative" style={{ height: screenHeight * 0.45 }}>
              <Image
                source={{ uri: plato?.imagen }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', darkMode ? 'rgba(17,24,39,1)' : 'rgba(255,255,255,1)']}
                className="absolute bottom-0 left-0 right-0"
                style={{ height: screenHeight * 0.045 }}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify()} className="px-1">
            {/* Fila: nombre a la izquierda, precio a la derecha */}
            <View className="flex-row items-start justify-between mb-1">
              <Text className="text-3xl font-extrabold text-primary flex-1 mr-3" numberOfLines={2}>
                {plato?.nombre}
              </Text>
              <View className="items-end">
                <Text className="text-2xl font-bold" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                  ${plato?.precio_descuento ?? plato?.precio}
                </Text>
                {plato?.precio_descuento && (
                  <Text className="text-sm text-gray-400 line-through">
                    ${plato?.precio}
                  </Text>
                )}
              </View>
            </View>
            {/* Fila: calificación + reseñas + disponible */}
            {restaurante && (
              <View className="flex-row items-center gap-2 mb-3">
                <View className="flex-row items-center gap-0.5">
                  <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                  <Text className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {restaurante.calificacion_promedio?.toFixed(1) ?? "0.0"}
                  </Text>
                </View>
                <Text className="text-sm text-gray-400 dark:text-gray-500">•</Text>
                <Text className="text-sm text-gray-400 dark:text-gray-500">0 reseñas</Text>
                <View className="bg-secondary/10 px-2.5 py-1 rounded-full">
                  <Text className="text-xs font-bold text-secondary">Disponible</Text>
                </View>
              </View>
            )}
            <Text className={`text-base mb-4 leading-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {plato?.descripcion}
            </Text>
          </Animated.View>
        </View>

        {/* Opciones */}
        {tiposOpciones.length > 0 && (
          <View className="px-4">
            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <Text className={`mx-4 text-sm font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-primary"}`}>
                Personaliza tu plato
              </Text>
              <View className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </View>
          </View>
        )}

        {tiposOpciones.map((tipo, tIndex) => (
          <Animated.View
            key={tipo.id}
            entering={FadeInDown.delay(200 + tIndex * 80).springify()}
          >
            <View className="px-4 mb-6">
              <Text className="text-lg font-extrabold mb-3" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                {tipo.nombre}
              </Text>

              {tipo.multiple ? (
                <>
                  {tipo.opciones.map((op: any) => {
                    const seleccionadas = selecciones[tipo.id] || [];
                    const isSelected = seleccionadas.includes(op.id);

                    return (
                      <TouchableOpacity
                        key={op.id}
                        onPress={() => toggleOpcion(tipo.id, op.id, true)}
                        activeOpacity={0.8}
                      >
                        <Card
                          className={`flex-row justify-between items-center mb-2 ${
                            isSelected
                              ? darkMode
                                ? "border border-primary/50 bg-primary/10"
                                : "border border-primary bg-primary/5"
                              : ""
                          }`}
                        >
                          <View className="flex-row items-center gap-3 flex-1">
                            <View className={`w-5 h-5 rounded items-center justify-center border-2 ${
                              isSelected ? "border-primary bg-primary" : darkMode ? "border-gray-600" : "border-gray-300"
                            }`}>
                              {isSelected && (
                                <Ionicons name="checkmark" size={14} color="white" />
                              )}
                            </View>
                            <Text className={`font-semibold ${
                              isSelected
                                ? darkMode ? "text-white" : "text-primary"
                                : darkMode ? "text-gray-200" : "text-gray-700"
                            }`}>
                              {op.nombre}
                            </Text>
                          </View>
                          {op.precio_adicional > 0 && (
                            <Text className="font-bold text-sm" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                              +${op.precio_adicional}
                            </Text>
                          )}
                        </Card>
                      </TouchableOpacity>
                    );
                  })}
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setDropdownOpen(tipo.id)}
                    activeOpacity={0.8}
                  >
                    <Card className="flex-row justify-between items-center mb-2">
                      <Text className={`font-semibold ${selecciones[tipo.id]?.length ? (darkMode ? "text-white" : "text-primary") : (darkMode ? "text-gray-400" : "text-gray-400")}`}>
                        {(() => {
                          const selectedId = selecciones[tipo.id]?.[0];
                          if (selectedId) {
                            const op = tipo.opciones.find((o: any) => o.id === selectedId);
                            return op?.nombre ?? "Selecciona una opción";
                          }
                          return "Selecciona una opción";
                        })()}
                      </Text>
                      <Ionicons name="chevron-down" size={18} color={darkMode ? "#9CA3AF" : "#6B7280"} />
                    </Card>
                  </TouchableOpacity>

                  <Modal
                    visible={dropdownOpen === tipo.id}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setDropdownOpen(null)}
                  >
                    <TouchableOpacity
                      className="flex-1 bg-black/50 justify-center px-6"
                      activeOpacity={1}
                      onPress={() => setDropdownOpen(null)}
                    >
                      <View className={`rounded-2xl overflow-hidden`} style={{ maxHeight: 400, backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }}>
                        <View className="px-4 py-3 border-b" style={{ borderColor: darkMode ? '#374151' : '#E5E7EB' }}>
                          <Text className="text-lg font-bold" style={{ color: darkMode ? '#FFFFFF' : '#111827' }}>{tipo.nombre}</Text>
                        </View>
                        <FlatList
                          data={tipo.opciones}
                          keyExtractor={(op: any) => op.id.toString()}
                          renderItem={({ item: op }: { item: any }) => {
                            const isSelected = (selecciones[tipo.id] || []).includes(op.id);
                            return (
                              <TouchableOpacity
                                onPress={() => {
                                  toggleOpcion(tipo.id, op.id, false);
                                  setDropdownOpen(null);
                                }}
                                className={`flex-row items-center justify-between px-4 py-3.5 ${isSelected ? "bg-primary/5" : ""}`}
                              >
                                <View className="flex-row items-center gap-3 flex-1">
                                  <View className={`w-5 h-5 rounded-full items-center justify-center border-2 ${isSelected ? "border-primary" : ""}`} style={{ borderColor: isSelected ? '#2563EB' : (darkMode ? '#4B5563' : '#D1D5DB') }}>
                                    {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                  </View>
                                  <Text className="font-semibold" style={{ color: isSelected ? '#2563EB' : (darkMode ? '#E5E7EB' : '#374151') }}>
                                    {op.nombre}
                                  </Text>
                                </View>
                                {op.precio_adicional > 0 && (
                                  <Text className="font-bold text-sm" style={{ color: darkMode ? "#EAB308" : "#B8860B" }}>
                                    +${op.precio_adicional}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          }}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                </>
              )}
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      {/* Barra inferior */}
      <LinearGradient
        colors={darkMode ? ['#111827', '#111827'] : ['#FFFFFF', '#FFFFFF']}
        className="absolute bottom-0 left-0 right-0"
        style={{
          borderTopWidth: 1,
          borderTopColor: '#B8860B',
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 12,
        }}
      >
        <View className="px-4 py-4 flex-row items-center gap-4">
          {/* Cantidad */}
          <Card className="flex-row items-center gap-2 p-0">
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="remove" size={22} color={darkMode ? "#F9FAFB" : "#2563EB"} />
            </TouchableOpacity>
            <Text className={`w-8 text-center font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>
              {quantity}
            </Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={22} color={darkMode ? "#F9FAFB" : "#2563EB"} />
            </TouchableOpacity>
          </Card>

          <TouchableOpacity
            onPress={handleAddToCart}
            className="flex-1 bg-primary py-3.5 px-6 rounded-2xl items-center justify-center flex-row gap-2 shadow-lg shadow-primary/40"
          >
            <Ionicons name="cart" size={20} color="white" />
            <Text className="text-white font-bold text-base">
              Agregar ${calculateTotal().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}