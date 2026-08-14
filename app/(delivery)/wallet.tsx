import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, TextInput, Alert } from "react-native";
import { useCallback, useState, useMemo, useRef } from "react";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useThemeStore } from "@/store/theme.store";
import api from "@/lib/api";
import { useFocusEffect } from "expo-router";
import { WalletData, Movimiento } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";
import PopupMessage from "@/components/PopupMessage";

export default function Wallet() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todo');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const aplicarFiltroRapido = (opcion: string) => {
    setFiltroRapido(opcion);
    const hoy = new Date();
    if (opcion === 'hoy') {
      setFiltroDesde(hoy.toISOString().slice(0, 10));
      setFiltroHasta(hoy.toISOString().slice(0, 10));
    } else if (opcion === 'semana') {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
      setFiltroDesde(lunes.toISOString().slice(0, 10));
      setFiltroHasta(hoy.toISOString().slice(0, 10));
    } else if (opcion === 'mes') {
      const primero = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFiltroDesde(primero.toISOString().slice(0, 10));
      setFiltroHasta(hoy.toISOString().slice(0, 10));
    } else {
      setFiltroDesde('');
      setFiltroHasta('');
    }
  };

  const movimientosFiltrados = useMemo(() => {
    const movs = wallet?.movimientos || [];
    let desde = filtroDesde ? new Date(filtroDesde + 'T00:00:00') : null;
    let hasta = filtroHasta ? new Date(filtroHasta + 'T23:59:59') : null;
    return movs.filter((m: Movimiento) => {
      const fecha = new Date(m.creado_en);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      return true;
    });
  }, [wallet, filtroDesde, filtroHasta]);

  const fetchWallet = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get("/api/wallet/wallets/");
      if (res.data.length > 0) {
        setWallet(res.data[0]);
      } else {
        const created = await api.post("/api/wallet/wallets/create_wallet/");
        setWallet(created.data.wallet);
      }
    } catch (err) {
      setPopupMessage("Error al cargar wallet");
      setPopupVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWallet();

      intervalRef.current = setInterval(() => {
        fetchWallet(true);
      }, 30000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      };
    }, [fetchWallet])
  );

  const handleRetirar = () => {
    const saldo = wallet?.saldo ?? 0;
    if (saldo <= 0) {
      Alert.alert("Saldo insuficiente", "No tienes saldo disponible para retirar.");
      return;
    }

    Alert.alert(
      "Retirar fondos",
      `Tu saldo actual es $${saldo.toFixed(2)}. ¿Deseas solicitar un retiro?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Solicitar",
          onPress: async () => {
            try {
              await api.post("/api/wallet/wallets/retirar/");
              Alert.alert("Solicitud enviada", "Tu solicitud de retiro ha sido procesada.");
              fetchWallet();
            } catch (err) {
              Alert.alert("Error", "No se pudo procesar la solicitud de retiro.");
            }
          },
        },
      ]
    );
  };

  const movimientos = wallet?.movimientos || [];
  const envios = movimientos.filter((m) => m.tipo === "ingreso").length;
  const ingresoDelDia = movimientos.filter((m) => {
    if (m.tipo !== "ingreso") return false;
    const hoy = new Date();
    const fechaMov = new Date(m.creado_en);
    return fechaMov.toDateString() === hoy.toDateString();
  }).reduce((sum, m) => sum + Number(m.monto), 0);

  return (
    <ScreenWrapper>
      <Header title="Wallet" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
          <TouchableOpacity
            onPress={() => fetchWallet(true)}
            disabled={refreshing}
            className="flex-row items-center justify-end px-6 py-2"
          >
            <Feather name="refresh-cw" size={16} color={darkMode ? "#60A5FA" : "#2563EB"} />
            <Text className="text-primary text-sm font-semibold ml-1">
              {refreshing ? "Actualizando..." : "Actualizar"}
            </Text>
          </TouchableOpacity>
          <View className="flex-row justify-between items-center px-4 py-2 mt-2 gap-3">
            <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="flex-1">
              <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Saldo disponible</Text>
                    <Text className="text-2xl font-bold text-green-600 mt-1">${Number(wallet?.saldo ?? 0).toFixed(2)}</Text>
                  </View>
                  <View className="w-10 h-10 rounded-2xl bg-green-100 items-center justify-center">
                    <FontAwesome5 name="dollar-sign" size={20} color="#16a34a" />
                  </View>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="flex-1">
              <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Envíos</Text>
                    <Text className="text-2xl font-bold text-primary mt-1">{envios}</Text>
                  </View>
                  <View className="w-10 h-10 rounded-2xl bg-blue-100 items-center justify-center">
                    <Feather name="trending-up" size={20} color="#2563EB" />
                  </View>
                </View>
              </Card>
            </Animated.View>
          </View>

          <View className="px-4 mt-4">
            <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ingreso del día</Text>
                <Text className="font-bold text-sm text-green-600">+${ingresoDelDia.toFixed(2)}</Text>
              </View>
            </Card>
          </View>

          <View className="px-4 mt-6">
            <Text className={`font-bold text-lg mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              Historial de Transacciones
            </Text>

            <View className={`rounded-xl p-2 mb-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {['todo', 'hoy', 'semana', 'mes'].map((op) => (
                  <TouchableOpacity
                    key={op}
                    className={`px-3 py-1.5 rounded-full ${filtroRapido === op ? 'bg-primary' : darkMode ? 'bg-gray-600' : 'bg-white'}`}
                    onPress={() => aplicarFiltroRapido(op)}
                  >
                    <Text className={`text-xs font-medium ${filtroRapido === op ? 'text-white' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {op === 'todo' ? 'Todo' : op === 'hoy' ? 'Hoy' : op === 'semana' ? 'Semana' : 'Mes'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row gap-2">
                <TextInput
                  className={`flex-1 border rounded-lg px-3 py-1.5 text-xs ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                  placeholder="Desde (YYYY-MM-DD)"
                  placeholderTextColor="#9CA3AF"
                  value={filtroDesde}
                  onChangeText={(t) => { setFiltroDesde(t); setFiltroRapido(''); }}
                />
                <TextInput
                  className={`flex-1 border rounded-lg px-3 py-1.5 text-xs ${darkMode ? 'border-gray-600 text-white bg-gray-700' : 'border-gray-300 text-gray-900 bg-white'}`}
                  placeholder="Hasta (YYYY-MM-DD)"
                  placeholderTextColor="#9CA3AF"
                  value={filtroHasta}
                  onChangeText={(t) => { setFiltroHasta(t); setFiltroRapido(''); }}
                />
              </View>
            </View>

            {movimientosFiltrados.length === 0 ? (
              <Card>
                <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No hay transacciones aún
                </Text>
              </Card>
            ) : (
              movimientosFiltrados.map((tx, index) => (
                <Animated.View key={tx.id} entering={FadeInDown.delay(200 + index * 80).duration(400).springify()}>
                  <Card className="mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-1">
                        <Text className={`font-semibold capitalize ${darkMode ? "text-gray-100" : "text-gray-800"}`}>{tx.tipo}</Text>
                        <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {new Date(tx.creado_en).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        </Text>
                        {tx.descripcion ? (
                          <Text className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{tx.descripcion}</Text>
                        ) : null}
                      </View>

                      <View className="items-end">
                        <Text className={`font-bold text-lg ${tx.tipo === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                          {tx.tipo === "ingreso" ? `+ $${Number(tx.monto).toFixed(2)}` : `- $${Math.abs(Number(tx.monto)).toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))
            )}

            <View className="items-center mt-4">
              <TouchableOpacity
                className="bg-secondary py-4 rounded-2xl w-3/4 self-center shadow-lg"
                onPress={handleRetirar}
              >
                <Text className="text-center text-white font-bold text-lg">Retirar</Text>
              </TouchableOpacity>
            </View>

            <Card className="mt-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
              <View className="flex-row justify-between items-center">
                <Text className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Modo oscuro</Text>
                <Switch
                  value={darkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
                  thumbColor="#2563EB"
                />
              </View>
            </Card>
          </View>
        </ScrollView>
      )}
      <PopupMessage
        visible={popupVisible}
        message={popupMessage}
        icon="cancel"
        onClose={() => setPopupVisible(false)}
      />
    </ScreenWrapper>
  );
}
