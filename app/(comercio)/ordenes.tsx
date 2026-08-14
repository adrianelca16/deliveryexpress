import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Orden } from '@/type';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import ThemePicker from '@/components/ThemePicker';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';
import { colorEstado } from "@/utils/ordenes";

export default function Ordenes() {
  const { darkMode } = useThemeStore();
  const router = useRouter();

  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [fechaFilter, setFechaFilter] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchOrdenes = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrdenes(res.data);
    } catch (err) {
      console.log('Error al obtener las órdenes:', err);
    }
  };

  const fetchEstados = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstados(res.data.map((e: { id: string; nombre: string }) => e.nombre));
    } catch (err) {
      console.log('Error al obtener los estados:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrdenes();
      fetchEstados();
    }, [])
  );

  const ordenesFiltradas = ordenes
    .filter((orden) => {
      const statusMatch = statusFilter ? orden.estado_nombre === statusFilter : true;
      const fechaMatch = fechaFilter ? orden.creado_en?.startsWith(fechaFilter) : true;
      return statusMatch && fechaMatch;
    })
    .sort((a, b) => (b.numero_orden ?? 0) - (a.numero_orden ?? 0));

  return (
    <ScreenWrapper>
      <Header title="Órdenes" showBack backHref="/(comercio)" className='mb-3' />

      <View className="px-5">
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="flex-row gap-3 mt-2">
          <View className="flex-1">
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`flex-row items-center justify-between px-4 py-3.5 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"}`}
            >
              <Text className={`text-sm font-medium ${fechaFilter ? (darkMode ? "text-white" : "text-gray-900") : (darkMode ? "text-gray-400" : "text-gray-500")}`}>
                {fechaFilter || "Fecha"}
              </Text>
              {fechaFilter ? (
                <TouchableOpacity onPress={() => setFechaFilter('')}>
                  <Ionicons name="close-circle" size={20} color={darkMode ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="calendar-outline" size={20} color={darkMode ? "#D1D5DB" : "#2563EB"} />
              )}
            </TouchableOpacity>
            {showDatePicker && Platform.OS === 'ios' && (
              <View className={`rounded-2xl overflow-hidden mb-4 ${darkMode ? "bg-gray-800" : "bg-white border border-purple-100/50"}`}>
                <DateTimePicker
                  value={fechaFilter ? new Date(fechaFilter + 'T00:00:00') : new Date()}
                  mode="date"
                  display="spinner"
                  themeVariant={darkMode ? "dark" : "light"}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setFechaFilter(selectedDate.toISOString().split('T')[0]);
                    }
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="py-2 items-center"
                >
                  <Text className="text-primary font-bold">Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}
            {showDatePicker && Platform.OS === 'android' && (
              <DateTimePicker
                value={fechaFilter ? new Date(fechaFilter + 'T00:00:00') : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setFechaFilter(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </View>

          <View className="flex-1">
            <ThemePicker
              selectedValue={statusFilter}
              onValueChange={(itemValue) => setStatusFilter(itemValue)}
              items={[
                { label: 'Estado', value: '' },
                ...estados.map((estado) => ({ label: estado, value: estado })),
              ]}
              placeholder="Estado"
            />
          </View>
        </Animated.View>
      </View>

      <ScrollView className="flex-1 px-5">
        {ordenesFiltradas.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <Card>
              <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} text-center`}>No se encontraron órdenes.</Text>
            </Card>
          </Animated.View>
        ) : (
          ordenesFiltradas.map((orden, index) => (
            <Animated.View key={orden.id} entering={FadeInDown.delay(200 + index * 60).duration(400)}>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: "/(comercio)/ordenes/orden-detalle",
                    params: { id: orden.id },
                  });
                }}
              >
                <Card className="flex-row justify-between items-center mt-3">
                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, backgroundColor: colorEstado(orden?.estado_nombre || "", darkMode) }} />
                  <View className="flex-1 ">
                    <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-secondary"}`}>
                      Orden #{orden.numero_orden}
                    </Text>
                    <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {orden.creado_en ? new Date(orden.creado_en).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }) : ''}
                    </Text>
                    <Text className='text-xs mt-1 font-semibold' style={{ color: colorEstado(orden.estado_nombre || "", darkMode) }}>
                      {orden.estado_nombre}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className='text-xl font-bold text-primary'>${orden.total}</Text>
                    <Text className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Ver más</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
