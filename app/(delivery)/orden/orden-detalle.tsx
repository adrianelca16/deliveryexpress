import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Estado, Orden } from "@/type";
import { Feather, Ionicons } from "@expo/vector-icons";
import RutaMapa from "@/components/RutaMapa";
import * as Clipboard from "expo-clipboard";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";


export default function OrdenDetalle() {
    const { id } = useLocalSearchParams();
    const { darkMode } = useThemeStore();
    const token = useAuthStore((state) => state.user?.token);
    const router = useRouter();
    const [estados, setEstados] = useState<Estado[]>();

    const [orden, setOrden] = useState<Orden | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchOrden = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ordenes/ordenes/${id}/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOrden(res.data);
        } catch (err) {
            console.log("Error obteniendo la orden:", err);
        }
    };

    const fetchEstados = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setEstados(res.data);
        } catch (err) {
            console.log('Error al obtener los estados:', err);
        }
    };

    const cambiarEstado = async (nuevoEstado: string) => {
        if (!orden) return;
        setLoading(true);
        try {
            await axios.patch(
                `${API_URL}/api/ordenes/ordenes/${id}/cambiar-estado/`,
                { estado: nuevoEstado },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            Alert.alert("✅ Éxito", `La orden cambió a "${nuevoEstado}"`);
            fetchOrden();
        } catch (err) {
            Alert.alert("Error", "No se pudo cambiar el estado.");
            console.log("Error actualizando estado:", err);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrden();
            fetchEstados();
        }, [])
    );

    if (!orden) {
        return (
            <ScreenWrapper gradient>
                <View className="flex-1 justify-center items-center">
                    <Text className={`${darkMode ? "text-white" : "text-black"}`}>Cargando orden...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    const colorEstado = (estado?: string) => {
        switch (estado?.toLowerCase()) {
            case "asignada":
                return "#FF9800";
            case "en camino":
                return "#009688";
            case "entregada":
                return "#4CAF50";
            case "cancelada":
                return "#F44336";
            default:
                return "#9E9E9E";
        }
    };

    return (
        <ScreenWrapper gradient>
            <Header title="Detalle de Orden" showBack backHref="/(delivery)" rightAction={
                <TouchableOpacity onPress={() => router.push("/profile")}>
                    <Ionicons name="notifications" size={28} color="#65A30D" />
                </TouchableOpacity>
            } />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}>
                <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
                    <Card className="mb-4">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-secondary text-lg font-bold">Pedido #{orden.numero_orden}</Text>
                            <Text className="text-primary text-lg font-bold">${orden.total}</Text>
                        </View>
                        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>{new Date(orden.creado_en).toLocaleDateString()}</Text>
                        <View className="flex-row items-center mt-3">
                            <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: colorEstado(orden?.estado_nombre) }} />
                            <Text className="font-semibold" style={{ color: colorEstado(orden?.estado_nombre) }}>
                                Estado: {orden.estado_nombre}
                            </Text>
                        </View>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
                    <Text className="text-xl font-bold text-secondary mb-3">Platos de la Orden</Text>

                    {orden.detalles?.map((item, index) => (
                        <Card key={index} className="mb-3">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <Image
                                        source={{ uri: item.plato_imagen }}
                                        className="h-16 w-16 rounded-xl mr-3"
                                        resizeMode="cover"
                                    />
                                    <View>
                                        <Text className={`font-semibold ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{item.plato_nombre}</Text>
                                        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>x{item.cantidad}</Text>
                                    </View>
                                </View>
                                <Text className="font-bold text-primary">${item.precio_unitario}</Text>
                            </View>
                        </Card>
                    ))}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
                    <Text className="mt-2 font-bold text-secondary text-xl mb-3">Información del Cliente</Text>
                    <Card>
                        <View className="flex-row items-center mb-3">
                            <Image
                                source={{
                                    uri: orden.cliente_foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                }}
                                className="w-14 h-14 rounded-full mr-3 border-2 border-purple-100"
                            />
                            <View>
                                <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-black"}`}>{orden.cliente_nombre}</Text>
                                <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.cliente_email || "Sin correo"}</Text>
                            </View>
                        </View>

                        <Text className={`font-bold ${darkMode ? "text-white" : "text-black"}`}>Dirección</Text>
                        <Text className={`font-medium mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.direccion_entrega}</Text>

                        <View className="flex-row items-center gap-2">
                            <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} mr-1`}>
                                {orden.cliente_telefono || "Sin teléfono"}
                            </Text>
                            {orden.cliente_telefono && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(orden.cliente_telefono || '');
                                        Alert.alert("📋 Copiado", "Número copiado al portapapeles");
                                    }}
                                    className="bg-secondary px-3 py-1 rounded-full"
                                >
                                    <Text className="text-white text-sm font-bold">Copiar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <CustomButton
                            title="Ver Perfil"
                            onPress={() => setModalVisible(true)}
                            style="bg-primary mt-4"
                        />
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
                    {orden.estado_nombre?.toLowerCase() === "asignada" && (
                        <CustomButton
                            title="Iniciar ruta"
                            onPress={() => {
                                const enCaminoEstado = estados?.find((e) => e.nombre.toLowerCase() === "en camino");
                                if (enCaminoEstado) {
                                    cambiarEstado(enCaminoEstado.id.toString());
                                } else {
                                    Alert.alert("Error", "No se encontró el estado 'En camino'");
                                }
                            }}
                            style="bg-secondary mt-6"
                            isLoading={loading}
                        />
                    )}

                    {orden.estado_nombre?.toLowerCase() === "en camino" && (
                        <CustomButton
                            title="✅ Finalizar entrega"
                            onPress={() => {
                                const entregadaEstado = estados?.find((e) => e.nombre.toLowerCase() === "entregada");
                                if (entregadaEstado) {
                                    cambiarEstado(entregadaEstado.id.toString());
                                } else {
                                    Alert.alert("Error", "No se encontró el estado 'Entregada'");
                                }
                            }}
                            style="bg-secondary mt-6"
                            isLoading={loading}
                        />
                    )}

                    {orden.estado_nombre?.toLowerCase() === "entregada" && (
                        <View className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 items-center mt-6">
                            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
                            <Text className="text-center text-lg text-green-600 font-bold mt-1">
                                Orden entregada
                            </Text>
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            <Modal
                visible={modalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <Card className="w-5/6 items-center">
                        <Image
                            source={{
                                uri: orden.cliente_foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                            }}
                            className="w-24 h-24 rounded-full mb-3 border-2 border-purple-100"
                        />
                        <Text className={`text-lg font-bold mb-1 ${darkMode ? "text-white" : "text-black"}`}>{orden.cliente_nombre}</Text>
                        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>{orden.cliente_email || "Sin correo"}</Text>

                        <View className="flex-row items-center mt-2">
                            <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} mr-2`}>
                                {orden.cliente_telefono || "Sin teléfono"}
                            </Text>
                            {orden.cliente_telefono && (
                                <TouchableOpacity
                                    onPress={async () => {
                                        await Clipboard.setStringAsync(orden.cliente_telefono || '');
                                        Alert.alert("📋 Copiado", "Número copiado al portapapeles");
                                    }}
                                    className="bg-secondary px-3 py-1 rounded-full"
                                >
                                    <Text className="text-white text-sm font-bold">Copiar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <CustomButton
                            title="Cerrar"
                            onPress={() => setModalVisible(false)}
                            style="bg-primary mt-6"
                        />
                    </Card>
                </View>
            </Modal>
        </ScreenWrapper>
    );
}
