import { View, Text, Image, TouchableOpacity } from 'react-native'
import React, { useCallback, useState } from 'react'
import { API_URL, images } from '@/constants'
import { FontAwesome6, Ionicons, MaterialIcons } from '@expo/vector-icons'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { useThemeStore } from '@/store/theme.store'
import { useFocusEffect, useRouter } from 'expo-router'
import ScreenWrapper from '@/components/ui/ScreenWrapper'
import Card from '@/components/ui/Card'
import Animated, { FadeInDown } from 'react-native-reanimated'

export default function ConfirmacionRegistro() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [email, setEmail] = useState(false);
  const [telefono, setTelefono] = useState(false);
  const [cedula, setCedula] = useState(false);

  const router = useRouter();

  const fetchValidacion = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/user/usuario/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data[0] : res.data;

      setEmail(!!data.verificacion_email);
      setTelefono(!!data.verificacion_telefono);
      setCedula(!!data.verificacion_identidad);
    } catch (err) {
      console.log("Error obteniendo validaciones:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchValidacion();
    }, [])
  );

  const steps = [
    { key: 'cedula', label: 'Verifica tu Cédula de Identidad', icon: (checked: boolean) => <FontAwesome6 name="drivers-license" size={28} color={checked ? '#65A30D' : 'white'} />, done: cedula, route: "/(tabs)/registros/confirmacion-cedula" },
    { key: 'telefono', label: 'Verifica tu Número de Teléfono', icon: (checked: boolean) => <MaterialIcons name="smartphone" size={28} color={checked ? '#65A30D' : 'white'} />, done: telefono, route: "/(tabs)/registros/confirmacion-telefono" },
    { key: 'email', label: 'Verifica tu Correo Electrónico', icon: (checked: boolean) => <Ionicons name="mail" size={28} color={checked ? '#65A30D' : 'white'} />, done: email, route: "/(tabs)/registros/confirmacion-email" },
  ];

  const allDone = email && telefono && cedula;

  return (
    <ScreenWrapper gradient safe>
      <View className="items-center px-4 mt-4">
        <Image source={images.pizza_detective} className="w-52 h-52" resizeMode="contain" />
      </View>

      <Text className="text-secondary text-center text-3xl font-bold mb-6">Confirma tu registro</Text>

      <View className="px-4 gap-3">
        {steps.map((step, index) => (
          <Animated.View key={step.key} entering={FadeInDown.delay(100 + index * 100).duration(400).springify()}>
            <TouchableOpacity
              disabled={step.done}
              onPress={() => router.push(step.route as any)}
              activeOpacity={step.done ? 1 : 0.8}
            >
              <Card className={`flex-row items-center gap-4 ${step.done ? 'border-green-300 dark:border-green-700' : ''}`}>
                <View className={`w-12 h-12 rounded-2xl items-center justify-center ${step.done ? 'bg-green-100' : 'bg-primary'}`}>
                  {step.done ? (
                    <Ionicons name="checkmark-circle" size={28} color="#65A30D" />
                  ) : (
                    step.icon(false)
                  )}
                </View>
                <Text className={`flex-1 font-semibold text-base ${step.done ? 'text-green-600 dark:text-green-400' : darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {step.label}
                </Text>
                {step.done && (
                  <Ionicons name="checkmark-circle" size={24} color="#65A30D" />
                )}
              </Card>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(500).duration(400).springify()} className="px-8 mt-8">
        <TouchableOpacity
          className={`py-4 rounded-2xl items-center shadow-lg ${allDone ? 'bg-secondary shadow-green-500/20' : 'bg-gray-300 dark:bg-gray-700'}`}
          disabled={!allDone}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text className={`font-bold text-lg ${allDone ? 'text-white' : 'text-gray-500'}`}>Confirmar</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScreenWrapper>
  )
}
