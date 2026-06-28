import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from "react-native";
import { useCallback, useState } from "react";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { useThemeStore } from "@/store/theme.store";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import { API_URL } from "@/constants";
import { useFocusEffect } from "expo-router";
import { WalletData, Movimiento } from "@/type";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Wallet() {
  const { darkMode, toggleDarkMode } = useThemeStore();
  const token = useAuthStore((state) => state.user?.token);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWallet = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/wallet/wallets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length > 0) {
        setWallet(res.data[0]);
      }
    } catch (err) {
      console.log("Error obteniendo wallet:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallet();
    }, [])
  );

  const movimientos = wallet?.movimientos || [];
  const envios = movimientos.filter((m) => m.tipo === "ingreso").length;

  return (
    <ScreenWrapper >
      <Header title="Wallet" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="flex-row justify-between items-center px-4 py-2 mt-2 gap-3">
            <Animated.View entering={FadeInDown.delay(100).duration(400).springify()} className="flex-1">
              <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Saldo disponible</Text>
                    <Text className="text-2xl font-bold text-green-600 mt-1">${wallet?.saldo?.toFixed(2) || "0.00"}</Text>
                  </View>
                  <View className="w-10 h-10 rounded-2xl bg-green-100 items-center justify-center">
                    <FontAwesome5 name="dollar-sign" size={20} color="#16a34a" />
                  </View>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} className="flex-1">
              <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
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

          <View className="px-4 mt-6">
            <Text className={`font-bold text-lg mb-3 ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
              Historial de Transacciones
            </Text>

            {movimientos.length === 0 ? (
              <Card>
                <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  No hay transacciones aún
                </Text>
              </Card>
            ) : (
              movimientos.map((tx, index) => (
                <Animated.View key={tx.id} entering={FadeInDown.delay(200 + index * 80).duration(400).springify()}>
                  <Card className="mb-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
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
                          {tx.tipo === "ingreso" ? `+ $${tx.monto.toFixed(2)}` : `- $${Math.abs(tx.monto).toFixed(2)}`}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </Animated.View>
              ))
            )}

            <View className="items-center mt-4">
              <TouchableOpacity className="bg-secondary py-4 rounded-2xl w-3/4 self-center opacity-50 shadow-lg shadow-green-500/20">
                <Text className="text-center text-white font-bold text-lg">Retirar</Text>
              </TouchableOpacity>
            </View>

            <Card className="mt-6" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
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
    </ScreenWrapper>
  );
}
