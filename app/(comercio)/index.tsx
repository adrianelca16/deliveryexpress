import { View, Text, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import { Bell } from 'lucide-react-native';
import axios from 'axios';
import { API_URL } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Orden } from '@/type';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';

export default function ComercioHome() {
  const token = useAuthStore((state) => state.user?.token);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [ingresosDia, setIngresosDia] = useState(0);
  const [ventasSemana, setVentasSemana] = useState<number[]>([]);
  const [totalVentasSemana, setTotalVentasSemana] = useState(0);
  const router = useRouter()
  const { darkMode } = useThemeStore();

  const fetchOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/ordenes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const ordenesPendientes = res.data
        .filter((orden: Orden) => orden?.estado_nombre?.toLowerCase() === "pendiente")
        .sort((a: Orden, b: Orden) => (b.numero_orden ?? 0) - (a.numero_orden ?? 0));

      setOrdenes(ordenesPendientes);

      const hoy = new Date();
      const hoyStr = hoy.toISOString().split('T')[0];

      const ingresosDiaActual = res.data
        .filter((orden: Orden) =>
          orden?.estado_nombre?.toLowerCase() === "completada" &&
          orden.creado_en?.startsWith(hoyStr)
        )
        .reduce((acc: number, orden: Orden) => acc + (orden.total ?? 0), 0);

      setIngresosDia(ingresosDiaActual);

      const ingresosPorDia = Array(7).fill(0);

      res.data
        .filter((orden: Orden) => orden?.estado_nombre?.toLowerCase() === "completada")
        .forEach((orden: Orden) => {
          if (!orden.creado_en) return;

          const fechaOrden = new Date(orden.creado_en);
          const diffDias = Math.floor((hoy.getTime() - fechaOrden.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDias >= 0 && diffDias < 7) {
            ingresosPorDia[6 - diffDias] += orden.total ?? 0;
          }
        });

      const ventasSemanaNumeros = ingresosPorDia.map(v => Number(v) || 0);
      setVentasSemana(ventasSemanaNumeros);
      setTotalVentasSemana(ventasSemanaNumeros.reduce((acc, monto) => acc + monto, 0));

    } catch (err) {
      console.log("Error obteniendo órdenes:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrden();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  return (
    <ScreenWrapper>
      <Header title="Inicio" showBack={false}/>
      <ScrollView showsVerticalScrollIndicator={false} className='px-5'>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="flex-row justify-between mt-4">
          <Card className="flex-1 mr-2 items-center " style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
            <Text className={`text-sm font-bold text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Pedidos en curso</Text>
            <Text className="text-3xl font-bold text-primary mt-2">{ordenes.length}</Text>
          </Card>
          <Card className="flex-1 ml-2 items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
            <Text className={`text-sm font-bold text-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Ingresos del día</Text>
            <Text className="text-3xl font-bold text-secondary mt-2">${ingresosDia}</Text>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} className="mt-6">
          <Text className={`text-center text-lg font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>Tendencias de ventas</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Card className="mt-3" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
            <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Ventas semanales</Text>
            <Text className="text-2xl font-bold text-primary mt-1">${totalVentasSemana}</Text>

            <View className="items-center mt-4">
              {ventasSemana.length > 0 && (
                <LineChart
                  data={{
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{ data: ventasSemana }],
                  }}
                  width={Dimensions.get('window').width - 80}
                  height={220}
                  yAxisLabel="$"
                  chartConfig={{
                    backgroundColor: darkMode ? '#1F2937' : '#ffffff',
                    backgroundGradientFrom: darkMode ? '#1F2937' : '#ffffff',
                    backgroundGradientTo: darkMode ? '#1F2937' : '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `#2563EB`,
                    labelColor: () => darkMode ? '#D1D5DB' : '#6b7280',
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#2563EB',
                    },
                  }}
                  bezier
                  style={{ borderRadius: 16 }}
                />
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text className={`text-start mt-8 text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Órdenes Pendientes</Text>
        </Animated.View>

        <View className='mb-4 mt-2'>
          {ordenes.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(500).duration(400)}>
              <Card >
                <Text className={`text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>No tienes pedidos pendientes.</Text>
              </Card>
            </Animated.View>
          ) : (
            ordenes.slice(0, 5).map((orden, index) => (
              <Animated.View key={orden.id} entering={FadeInDown.delay(500 + index * 80).duration(400)}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(comercio)/ordenes/orden-detalle',
                      params: { id: orden.id }
                    })
                  }>
                  <Card className="flex-row items-center" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}>
                    <View className="mr-4 w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: 'rgba(124,58,237,0.1)' }}>
                      <Bell size={24} color="#2563EB" />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-lg ${darkMode ? "text-white" : "text-gray-900"}`}>Pedido #{orden.numero_orden}</Text>
                      <Text className={`text-sm mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cliente: {orden.cliente_nombre}</Text>
                      <TouchableOpacity className="bg-primary py-2 px-6 rounded-2xl self-start mt-2 shadow-sm"
                        style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
                        onPress={() =>
                          router.push({
                            pathname: '/(comercio)/ordenes/orden-detalle',
                            params: { id: orden.id }
                          })
                        }>
                        <Text className="text-white font-semibold text-sm">Ver Detalles</Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
