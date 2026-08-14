import { View, Text, TouchableOpacity, Image, ScrollView, Switch, Alert, Linking, ActivityIndicator, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useCallback, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { Orden } from "@/type";
import { colorEstado } from "@/utils/ordenes";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import PopupMessage from "@/components/PopupMessage";


const Profile = () => {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [recentOrders, setRecentOrders] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const [popup, setPopup] = useState({ visible: false, message: "", icon: "cancel" as const });
  const showError = (msg: string) => setPopup({ visible: true, message: msg, icon: "cancel" });

  const menuItems = [
    { label: "Direcciones", icon: "map-marker-alt", action: () => router.push("/direcciones/direccion") },
    { label: "Historial de pedidos", icon: "clock", action: () => router.push("/perfil/historial") },
  ];

  const fetchRecentOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      console.log('ordenes: ', res.data);

      const sorted = res.data.sort(
        (a: Orden, b: Orden) => new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
      );

       setRecentOrders(sorted.slice(0, 3));
    } catch {
      showError("Error al cargar órdenes recientes");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRecentOrders();
    }, [])
  );

  return (
    <ScreenWrapper>
      <Header className="mb-3" title="Perfil" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 8 + insets.bottom }}>
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="px-4 overflow-visible">
          <Card style={{ elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 gap-3">
                {user?.foto_perfil ? (
                  <Image source={{ uri: user?.foto_perfil }} className="w-20 h-20 rounded-full border-2 border-blue-200" />
                ) : (
                  <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
                    <Ionicons name="person" size={36} color="#2563EB" />
                  </View>
                )}

                <View className="flex-1">
                  <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-black"}`}>{user?.nombre || "Usuario"}</Text>
                  <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{user?.email}</Text>
                  <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{user?.telefono}</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push("/perfil/formulario-perfil")}
                className="w-10 h-10 rounded-full items-center justify-center bg-blue-100 dark:bg-blue-900/30"
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        {/* <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="px-4 mt-4">
          <TouchableOpacity activeOpacity={0.8} onPress={() => router.push("/search")} className="flex-row items-center justify-center gap-2 rounded-2xl py-4 bg-primary">
            <AntDesign name="heart" size={24} color="white" />
            <Text className="font-extrabold text-lg text-white">Platos Favoritos</Text>
            <Ionicons name="chevron-forward" size={22} color="white" />
          </TouchableOpacity> 
        </Animated.View>
        */}

        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()} className="px-4 mt-6 overflow-visible">
          <Text className={`text-lg font-extrabold mb-3 text-primary`}>Últimas Órdenes</Text>
          {recentOrders.length > 0 ? (
            recentOrders.map((order, index) => (
              <Animated.View key={order.id} entering={FadeInDown.delay(100 + index * 80).duration(400).springify()} className="mb-3">
                <TouchableOpacity
                  onPress={() => router.push({ pathname: "/(tabs)/perfil/orden-detalle", params: { id: order.id } })}
                  activeOpacity={0.8}
                >
                  <Card style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }} >
                    <View className="flex-row justify-between">
                      <View className="flex-1">
                        <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>Pedido #{order.numero_orden}</Text>
                        <View className="mt-1">
                          <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-sm`}>{order.restaurante_nombre}</Text>
                          <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-xs`}>
                            {order.creado_en ? format(new Date(order.creado_en), "dd/MM/yyyy HH:mm", { locale: es }) : "Sin fecha"}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end justify-center">
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: colorEstado(order.estado_nombre, darkMode) }} />
                          <Text className="text-xs font-semibold" style={{ color: colorEstado(order.estado_nombre, darkMode) }}>
                            {order.estado_nombre}
                          </Text>
                        </View>
                        <Text className="font-semibold text-lg mt-2" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
                          ${order.total}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <Card className="items-center py-6" style={{ elevation: 4 }}>
              <Ionicons name="file-tray-outline" size={40} color={darkMode ? '#9CA3AF' : '#9CA3AF'} />
              <Text className={`mb-3 text-base mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Aún no tienes ninguna orden</Text>
              <TouchableOpacity
                onPress={() => router.push("/search")}
                className="bg-primary px-6 py-3 rounded-2xl shadow-lg shadow-blue-500/20"
              >
                <Text className="text-white font-semibold text-lg">Explorar restaurantes</Text>
              </TouchableOpacity>
            </Card>
          )}
        </Animated.View>

        <View className="flex-row gap-3 mt-6 px-4">
            {menuItems.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={item.action}
                activeOpacity={0.8}
                className="flex-1 items-center rounded-2xl py-4"
                style={{ elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }}
              >
                <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2 bg-primary/10">
                  <FontAwesome5 name={item.icon as any} size={24} color="#2563EB" />
                </View>
                <Text className={`font-extrabold text-sm text-center ${darkMode ? "text-white" : "text-gray-800"}`}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} className="px-4 mt-6 overflow-visible">
          <Card style={{ elevation: 4 }}>
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-gray-400">Versión</Text>
              <Text className={`font-semibold ${darkMode ? "text-white" : "text-black"}`}>1.0.0</Text>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center py-1">
              <Text className="text-gray-400">Modo oscuro</Text>
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
                thumbColor="#2563EB"
              />
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center py-1">
              <TouchableOpacity className="flex-row justify-between items-center py-1 flex-1" onPress={() => Linking.openURL("mailto:soporte@enruta.com")}>
                <Text className="text-gray-400">Centro de ayuda</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center py-1">
              <TouchableOpacity className="flex-row justify-between items-center py-1 flex-1" onPress={() => Alert.alert("Términos y condiciones", "Próximamente disponible")}>
                <Text className="text-gray-400">Términos y condiciones</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View className="h-px bg-gray-200 my-3" />
            <View className="flex-row justify-between items-center py-1">
              <TouchableOpacity className="flex-row justify-between items-center py-1 flex-1" onPress={() => Alert.alert("Política de privacidad", "Próximamente disponible")}>
                <Text className="text-gray-400">Política de privacidad</Text>
                <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400).springify()} className="px-4 mt-6 items-center">
          <TouchableOpacity
            onPress={logout}
            className="rounded-2xl py-4 flex-row justify-center items-center w-3/4"
            activeOpacity={0.8}
            style={{ backgroundColor: '#B8860B', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 }}
          >
            <Ionicons name="log-out-outline" size={20} color="white" />
            <Text className="text-white font-bold ml-2 text-lg">Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />

      <Modal
        visible={loading}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className={`rounded-3xl p-8 w-5/6 items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text className={`font-bold text-lg mt-4 text-center ${darkMode ? "text-white" : "text-black"}`}>
              Cargando perfil...
            </Text>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default Profile;