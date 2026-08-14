import { View, Text, ScrollView, Image, TouchableOpacity, Switch, Modal, TextInput, ActivityIndicator } from 'react-native'
import React, { useState, useCallback, useEffect, useMemo } from 'react'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { API_URL, mediaUrl } from '@/constants';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Restaurante, WalletData } from '@/type';
import { useRouter, useFocusEffect } from 'expo-router';
import { Entypo, FontAwesome, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import PopupMessage from '@/components/PopupMessage';

export default function Perfil() {

  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const router = useRouter();

  const logout = useAuthStore((state) => state.logout);
  const { darkMode, toggleDarkMode } = useThemeStore();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [montoRetiro, setMontoRetiro] = useState('');
  const [modalRetiro, setModalRetiro] = useState(false);
  const [retirando, setRetirando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState("");
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroRapido, setFiltroRapido] = useState('todo');

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
    return movs.filter((m) => {
      const fecha = new Date(m.creado_en);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      return true;
    }).reverse();
  }, [wallet, filtroDesde, filtroHasta]);

  const getRestaurante = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const response = await axios.get(`${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRestaurante(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
    }
  }

  const getWallet = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const res = await axios.get(`${API_URL}/api/wallet/wallets/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.length > 0) {
        setWallet(res.data[0]);
      } else {
        const created = await axios.post(`${API_URL}/api/wallet/wallets/create_wallet/`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWallet(created.data.wallet);
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        try {
          const created = await axios.post(`${API_URL}/api/wallet/wallets/create_wallet/`, {}, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setWallet(created.data.wallet);
        } catch (e) {
          console.error('Error creating wallet:', e);
        }
      }
    }
  }

  const handleRetirar = async () => {
    const token = useAuthStore.getState().user?.token;
    if (!montoRetiro || isNaN(Number(montoRetiro)) || Number(montoRetiro) <= 0) {
      setPopupMessage("Ingresa un monto válido.");
      return;
    }
    setRetirando(true);
    try {
      const res = await axios.post(`${API_URL}/api/wallet/wallets/retirar/`,
        { monto: montoRetiro },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setWallet(res.data.wallet);
      setModalRetiro(false);
      setMontoRetiro('');
      setPopupMessage("Solicitud de retiro procesada.");
    } catch (err: any) {
      setPopupMessage(err?.response?.data?.error || "Error al procesar retiro.");
    } finally {
      setRetirando(false);
    }
  }

  const totalIngresos = wallet?.movimientos
    ?.filter((m) => m.tipo === 'ingreso')
    ?.reduce((sum, m) => sum + Number(m.monto), 0) || 0;

  const ingresoDelDia = wallet?.movimientos
    ?.filter((m) => {
      if (m.tipo !== 'ingreso') return false;
      const hoy = new Date();
      const fechaMov = new Date(m.creado_en);
      return fechaMov.toDateString() === hoy.toDateString();
    })
    ?.reduce((sum, m) => sum + Number(m.monto), 0) || 0;

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getRestaurante(), getWallet()]).finally(() => {
        setLoading(false);
      });
    }, [])
  );

  useEffect(() => {
    const interval = setInterval(getWallet, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScreenWrapper>
      <Header title="Perfil" showBack onBack={() => router.push("/(comercio)")} className='mb-3'/>

      <ScrollView showsVerticalScrollIndicator={false} className='px-5' contentContainerStyle={{ paddingBottom: 16}}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Card className="flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
            <Image source={{ uri: mediaUrl(restaurante?.imagen_url) || 'https://via.placeholder.com/80' }} className='w-20 h-20 rounded-2xl' />
            <View className="ml-4 flex-1">
              <Text className={`text-xl font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`}>{restaurante?.nombre?.toUpperCase()}</Text>
              <Text className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={2}>{restaurante?.descripcion}</Text>
              {restaurante?.calificacion_promedio != null && (
                <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>⭐ {restaurante.calificacion_promedio}</Text>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-lg font-bold ${darkMode ? "text-white" : "text-secondary"}`}>Wallet</Text>
            <TouchableOpacity onPress={getWallet} className="flex-row items-center gap-1">
              <Ionicons name="refresh" size={16} color="#2563EB" />
              <Text className="text-primary text-xs font-semibold">Actualizar</Text>
            </TouchableOpacity>
          </View>
          <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Saldo disponible</Text>
                <Text className="text-2xl font-bold text-primary">${Number(wallet?.saldo || 0).toFixed(2)}</Text>
              </View>
              <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                <Ionicons name="wallet" size={24} color="#2563EB" />
              </View>
            </View>

            <View className="flex-row justify-between items-center py-2" style={{ borderTopWidth: 1, borderTopColor: darkMode ? '#374151' : '#E5E7EB' }}>
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ingreso del día</Text>
              <Text className="font-bold text-sm text-green-600">+${ingresoDelDia.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: darkMode ? '#374151' : '#E5E7EB' }}>
              <Text className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total ingresado</Text>
              <Text className="font-bold text-sm" style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>${totalIngresos.toFixed(2)}</Text>
            </View>

            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Movimientos</Text>
              </View>

              <View className={`rounded-xl p-2 mb-2 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
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
                <Text className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No hay movimientos en este período
                </Text>
              ) : (
                <ScrollView nestedScrollEnabled style={{ maxHeight: 300 }} showsVerticalScrollIndicator={true}>
                  {movimientosFiltrados.map((mov) => (
                    <View key={mov.id} className="flex-row justify-between items-center py-2 pr-2" style={{ borderBottomWidth: 1, borderBottomColor: darkMode ? '#374151' : '#F3F4F6' }}>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-1">
                          {mov.tipo === 'ingreso' ? (
                            <Ionicons name="arrow-down" size={14} color="#22C55E" />
                          ) : (
                            <Ionicons name="arrow-up" size={14} color="#EF4444" />
                          )}
                          <Text className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {mov.tipo === 'ingreso' ? 'Ingreso' : 'Retiro'}
                          </Text>
                        </View>
                        <Text className={`text-[10px] mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`} numberOfLines={1}>
                          {mov.descripcion || new Date(mov.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <Text className={`text-sm font-bold ${mov.tipo === 'ingreso' ? 'text-green-500' : 'text-red-500'}`}>
                        {mov.tipo === 'ingreso' ? '+' : '-'}${Number(mov.monto).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              className="bg-primary py-3 px-6 rounded-2xl flex-row items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
              onPress={() => {
                if (Number(wallet?.saldo || 0) <= 0) {
                  setPopupMessage("No tienes saldo disponible para retirar.");
                  return;
                }
                setModalRetiro(true);
              }}
            >
              <Ionicons name="cash-outline" size={18} color="white" />
              <Text className='font-semibold ml-2 text-white'>Retirar saldo</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-6">
          <Text className={`text-lg font-bold mb-3 ${darkMode ? "text-white" : "text-secondary"}`}>Información del restaurante</Text>
          <Card style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                <FontAwesome name="map-marker" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Dirección</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`} numberOfLines={2}>{restaurante?.direccion}</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                <MaterialCommunityIcons name="clock" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Horario de Atención</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{restaurante?.horario_apertura} - {restaurante?.horario_cierre}</Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl items-center justify-center mr-4" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                <MaterialCommunityIcons name="silverware-fork-knife" size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Tipo de cocina</Text>
                <Text className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{restaurante?.categoria?.nombre}</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary py-3.5 px-6 rounded-2xl flex-row items-center justify-center mt-6"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
              onPress={() => router.push('/(comercio)/restaurantes/registrar-restaurantes')}>
              <FontAwesome name="pencil" size={16} color="white" />
              <Text className='font-semibold ml-2 text-white'>Editar Información</Text>
            </TouchableOpacity>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="mt-4">
          <TouchableOpacity className="flex-row items-center justify-center py-4">
            <View className="w-10 h-10 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
              <Entypo name="tools" size={18} color="#2563EB" />
            </View>
            <Text className="font-semibold text-primary">Soporte Técnico</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Card className="flex-row justify-between items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.122, shadowRadius: 8, elevation: 5 }}>
            <Text className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-900"}`}>Modo oscuro</Text>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
              thumbColor="#2563EB"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)} className="mt-2">
          <TouchableOpacity
            onPress={logout}
            className="py-4 flex-row justify-center items-center border border-secondary rounded-2xl mt-2"
          >
            <Ionicons name="log-out-outline" size={20} color="#B8860B" />
            <Text className="text-secondary font-bold ml-2">Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={modalRetiro}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalRetiro(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View className={`rounded-3xl p-6 w-5/6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <Text className={`text-lg font-bold mb-4 text-center ${darkMode ? "text-white" : "text-gray-900"}`}>Retirar saldo</Text>
            <Text className={`text-sm mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Saldo disponible: <Text className="font-bold text-primary">${Number(wallet?.saldo || 0).toFixed(2)}</Text>
            </Text>
            <TextInput
              className={`border rounded-2xl px-4 py-3 text-base ${darkMode ? "border-gray-600 text-white bg-gray-700" : "border-gray-300 text-gray-900 bg-white"}`}
              placeholder="Monto a retirar"
              placeholderTextColor={darkMode ? "#9CA3AF" : "#9CA3AF"}
              keyboardType="decimal-pad"
              value={montoRetiro}
              onChangeText={setMontoRetiro}
            />
            <View className="flex-row justify-end mt-6 gap-3">
              <TouchableOpacity
                className="py-3 px-6 rounded-2xl border border-gray-300"
                onPress={() => { setModalRetiro(false); setMontoRetiro(''); }}
              >
                <Text className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-primary py-3 px-6 rounded-2xl"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                onPress={handleRetirar}
                disabled={retirando}
              >
                <Text className="text-white font-semibold">{retirando ? 'Procesando...' : 'Retirar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PopupMessage
        visible={!!popupMessage}
        message={popupMessage}
        icon={
          popupMessage.toLowerCase().includes("error") || popupMessage.toLowerCase().includes("inválido") || popupMessage.toLowerCase().includes("insuficiente")
            ? "cancel"
            : "check-circle"
        }
        onClose={() => setPopupMessage("")}
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
  )
}