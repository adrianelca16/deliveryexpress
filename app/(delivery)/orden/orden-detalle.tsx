import { View, Text, ScrollView, TouchableOpacity, Alert, Image, Modal, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Estado, Orden } from "@/type";
import { Ionicons } from "@expo/vector-icons";
import { colorEstado, TERMINADOS } from "@/utils/ordenes";
import * as Clipboard from "expo-clipboard";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";
import RutaMapa from "@/components/RutaMapa";
import PopupMessage from "@/components/PopupMessage";
import * as Linking from "expo-linking";

export default function OrdenDetalle() {
    const { id } = useLocalSearchParams();
    const idStr = Array.isArray(id) ? id[0] : id;
    const { darkMode } = useThemeStore();
    const insets = useSafeAreaInsets();
    const token = useAuthStore((state) => state.user?.token);
    const [estados, setEstados] = useState<Estado[]>([]);
    const [orden, setOrden] = useState<Orden | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [popupVisible, setPopupVisible] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");
    const [popupIcon, setPopupIcon] = useState<"check-circle" | "cancel" | "warning" | "info">("info");
    const [modalConfirmacionEstado, setModalConfirmacionEstado] = useState(false);
    const [estadoPendiente, setEstadoPendiente] = useState<{ id: string; nombre: string } | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrden = useCallback(async () => {
        if (!idStr) return;
        try {
            const res = await api.get(`/api/ordenes/ordenes/${idStr}/`);
            setOrden(res.data);
        } catch (err) {
            setPopupMessage("Error al obtener la orden");
            setPopupIcon("cancel");
            setPopupVisible(true);
        }
    }, [idStr]);

    const fetchEstados = useCallback(async () => {
        try {
            const res = await api.get("/api/ordenes/estados-orden/");
            setEstados(res.data);
        } catch (err) {
            setPopupMessage("Error al obtener estados");
            setPopupIcon("cancel");
            setPopupVisible(true);
        }
    }, []);

    const cambiarEstado = useCallback(async (nuevoEstado: string) => {
        if (!orden) return;
        setLoading(true);
        try {
            await api.patch(`/api/ordenes/ordenes/${idStr}/cambiar-estado/`, {
                estado: nuevoEstado,
            });
            const estadoEncontrado = estados?.find((e) => e.id.toString() === nuevoEstado);
            const nombreEstado = estadoEncontrado?.nombre || nuevoEstado;
            setPopupMessage(`La orden cambió a "${nombreEstado}"`);
            setPopupIcon("check-circle");
            setPopupVisible(true);
            fetchOrden();
        } catch (err: any) {
            const msg = err?.response?.data?.detail || "No se pudo cambiar el estado.";
            setPopupMessage(msg);
            setPopupIcon("cancel");
            setPopupVisible(true);
            console.log("Error actualizando estado:", err);
        } finally {
            setLoading(false);
        }
    }, [orden, idStr, estados, fetchOrden]);

    const confirmarCambioEstado = useCallback((estadoId: string) => {
        const estadoEncontrado = estados?.find((e) => e.id.toString() === estadoId);
        if (!estadoEncontrado) return;
        setEstadoPendiente(estadoEncontrado);
        setModalConfirmacionEstado(true);
    }, [estados]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchOrden(), fetchEstados()]);
        setRefreshing(false);
    }, [fetchOrden, fetchEstados]);

    useFocusEffect(
        useCallback(() => {
            fetchOrden();
            fetchEstados();
        }, [fetchOrden, fetchEstados])
    );

    useEffect(() => {
        if (!orden?.id || !orden?.estado_nombre) return;
        if (TERMINADOS.includes(orden.estado_nombre.toLowerCase())) return;

        intervalRef.current = setInterval(() => {
            fetchOrden();
            fetchEstados();
        }, 10000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [orden?.id, orden?.estado_nombre]);

    const abrirMapa = () => {
        if (orden?.restaurante_latitud && orden?.restaurante_longitud && orden?.latitud && orden?.longitud) {
            const url = `https://www.google.com/maps/dir/${orden.restaurante_latitud},${orden.restaurante_longitud}/${orden.latitud},${orden.longitud}`;
            Linking.openURL(url);
        }
    };

    if (!orden) {
        return (
            <ScreenWrapper gradient>
                <View className="flex-1 justify-center items-center">
                    <Text className={`${darkMode ? "text-white" : "text-black"}`}>Cargando orden...</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <Header title="Detalle de Orden" showBack backHref="/(delivery)" />

            <ScrollView
                className="px-5 mt-3"
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={darkMode ? "#60A5FA" : "#2563EB"} />
                }
                contentContainerStyle={{ paddingBottom: insets.bottom }}
            >
                <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
                    <Card className="mb-4" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
                        <View className="flex-row justify-between items-center">
                            <Text className="text-secondary text-lg font-bold">Pedido #{orden.numero_orden}</Text>
                            <Text className="text-primary text-lg font-bold">${orden.total}</Text>
                        </View>
                        {Number(orden.monto_conductor) > 0 && (
                            <View className="mt-2 items-center bg-secondary/10 px-3 py-2 rounded-lg">
                                <Text className={`text-xs ${darkMode ? "text-gray-300" : "text-secondary"}`}>Tu pago</Text>
                                <Text className="font-bold text-lg text-secondary">${Number(orden.monto_conductor).toFixed(2)}</Text>
                            </View>
                        )}
                        <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {orden.creado_en ? new Date(orden.creado_en).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            }) : ''}
                        </Text>
                        <View className="flex-row items-center mt-3">
                            <Text
                                className="px-3 py-1 rounded-full text-xs font-semibold"
                                style={{
                                    backgroundColor: `${colorEstado(orden?.estado_nombre, darkMode)}20`,
                                    color: colorEstado(orden?.estado_nombre, darkMode),
                                }}
                            >
                                {orden.estado_nombre}
                            </Text>
                        </View>
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
                    <Text className="text-xl font-bold text-secondary mb-3">Platos de la Orden</Text>

                    {orden.detalles?.map((item, index) => (
                        <Card key={index} className="mb-3" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
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
                                <Text className="font-bold text-primary">${item.precio_unitario}</Text>
                            </View>
                        </Card>
                    ))}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
                    <Text className="mt-2 font-bold text-secondary text-xl mb-3">Información del Cliente</Text>
                    <Card style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
                        <View className="flex-row items-center mb-3">
                            <Image
                                source={{
                                    uri: orden.cliente_foto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                                }}
                                className="w-14 h-14 rounded-full mr-3 border-2 border-blue-100"
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
                                <>
                                    <TouchableOpacity
                                        onPress={async () => {
                                            await Clipboard.setStringAsync(orden.cliente_telefono || '');
                                            Alert.alert("Copiado", "Número copiado al portapapeles");
                                        }}
                                        className="bg-secondary px-3 py-1 rounded-full"
                                    >
                                        <Text className="text-white text-sm font-bold">Copiar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${orden.cliente_telefono}`)}
                                        className="bg-green-600 px-3 py-1 rounded-full"
                                    >
                                        <Text className="text-white text-sm font-bold">Llamar</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>

                        {orden.restaurante_latitud && orden.restaurante_longitud && (
                            <TouchableOpacity
                                onPress={abrirMapa}
                                className="bg-primary px-3 py-2 rounded-full mt-3"
                            >
                                <Text className="text-white text-sm font-bold text-center">Abrir en Google Maps</Text>
                            </TouchableOpacity>
                        )}

                        <CustomButton
                            title="Ver Perfil"
                            onPress={() => setModalVisible(true)}
                            style="bg-primary mt-4"
                        />
                    </Card>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
                    {["asignada", "preparado"].includes(orden.estado_nombre?.toLowerCase() ?? '') && (
                        <View className="mt-4">
                            {orden.preparado_marcado ? (
                                <CustomButton
                                    title="Iniciar ruta"
                                    onPress={() => {
                                        const enCaminoEstado = estados?.find((e) => e.nombre.toLowerCase() === "en camino");
                                        if (enCaminoEstado) {
                                            confirmarCambioEstado(enCaminoEstado.id.toString());
                                        } else {
                                            setPopupMessage("No se encontró el estado 'En camino'");
                                            setPopupIcon("warning");
                                            setPopupVisible(true);
                                        }
                                    }}
                                    style="bg-secondary"
                                    isLoading={loading}
                                />
                            ) : (
                                <View pointerEvents="none">
                                    <CustomButton
                                        title="Iniciar ruta"
                                        onPress={() => {}}
                                        style="bg-secondary opacity-40"
                                    />
                                    <Text className="text-center text-xs text-gray-500 mt-2">
                                        Esperando a que el comercio prepare la orden
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {orden.estado_nombre?.toLowerCase() === "en camino" && (
                        <CustomButton
                            title="Finalizar entrega"
                            onPress={() => {
                                const entregadaEstado = estados?.find((e) => e.nombre.toLowerCase() === "entregada");
                                if (entregadaEstado) {
                                    confirmarCambioEstado(entregadaEstado.id.toString());
                                } else {
                                    setPopupMessage("No se encontró el estado 'Entregada'");
                                    setPopupIcon("warning");
                                    setPopupVisible(true);
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
                visible={modalConfirmacionEstado}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setModalConfirmacionEstado(false)}
            >
                <View className="flex-1 bg-black/50 justify-center items-center">
                    <Card className="w-5/6 items-center">
                        <Ionicons name="warning" size={50} color="#F59E0B" />
                        <Text className={`text-lg font-bold mt-2 mb-1 ${darkMode ? "text-white" : "text-black"}`}>
                            ¿Cambiar estado?
                        </Text>
                        <Text className={`text-sm text-center mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            ¿Estás seguro de cambiar el estado a "{estadoPendiente?.nombre}"?
                        </Text>
                        <View className="flex-row justify-center gap-4 mt-4">
                            <TouchableOpacity
                                onPress={() => setModalConfirmacionEstado(false)}
                                className="bg-gray-300 dark:bg-gray-600 py-3 px-6 rounded-2xl flex-1"
                            >
                                <Text className="text-center font-bold text-gray-800 dark:text-gray-300">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (estadoPendiente) {
                                        setModalConfirmacionEstado(false);
                                        cambiarEstado(estadoPendiente.id);
                                    }
                                }}
                                className="bg-primary py-3 px-6 rounded-2xl flex-1"
                                disabled={loading}
                                style={{ opacity: loading ? 0.6 : 1 }}
                            >
                                <Text className="text-white text-center font-bold">Sí, cambiar</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                </View>
            </Modal>

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
                            className="w-24 h-24 rounded-full mb-3 border-2 border-blue-100"
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
                                        Alert.alert("Copiado", "Número copiado al portapapeles");
                                    }}
                                    className="bg-secondary px-3 py-1 rounded-full"
                                >
                                    <Text className="text-white text-sm font-bold">Copiar</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {orden.latitud && orden.longitud && orden.restaurante_latitud && orden.restaurante_longitud && (
                            <View className="w-full h-48 rounded-xl overflow-hidden mt-4">
                                <RutaMapa
                                    restaurante={{
                                        latitude: Number(orden.restaurante_latitud),
                                        longitude: Number(orden.restaurante_longitud),
                                    }}
                                    destino={{
                                        latitude: Number(orden.latitud),
                                        longitude: Number(orden.longitud),
                                    }}
                                />
                            </View>
                        )}

                        <CustomButton
                            title="Cerrar"
                            onPress={() => setModalVisible(false)}
                            style="bg-primary mt-6"
                        />
                    </Card>
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
