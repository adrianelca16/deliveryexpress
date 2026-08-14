import CustomInput from '@/components/CustomInput'
import { Link, router } from 'expo-router'
import React, { useState } from 'react'
import { Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'
import { API_URL } from '@/constants'
import CountryPicker, { DARK_THEME } from 'react-native-country-picker-modal'
import PopupMessage from '@/components/PopupMessage'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useThemeStore } from '@/store/theme.store'
import { LinearGradient } from 'expo-linear-gradient'
import Button from '@/components/ui/Button'
import { SafeAreaView } from 'react-native-safe-area-context'

const SignUp = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const rol = useAuthStore((state) => state.selectedRole)
  const { darkMode } = useThemeStore()
  const login = useAuthStore((state) => state.login)
  const setVerificado = useAuthStore((state) => state.setVerificado)

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    rol,
  })

  const [popup, setPopup] = useState({
    visible: false,
    message: '',
    icon: 'info' as keyof typeof MaterialIcons.glyphMap,
  })

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = 'info') => {
    setPopup({ visible: true, message, icon })
  }

  const [country, setCountry] = useState({
    cca2: 'VE',
    callingCode: ['58'],
  })
  const [visible, setVisible] = useState(false)

  const onSelect = (countrySelected: any) => {
    setCountry(countrySelected)
  }

  const submit = async () => {
    if (!form.email || !form.password || !form.nombre || !form.telefono) {
      showPopup('Por favor completa todos los campos', 'warning')
      return
    }

    if (form.password !== form.confirmPassword) {
      return showPopup('Las contraseñas no coinciden', 'cancel')
    }

    if (form.telefono.length !== 10) {
      return showPopup('El número de teléfono debe tener exactamente 10 dígitos', 'cancel')
    }

    setIsSubmitting(true)

    try {
      const fullPhone = `+${country.callingCode[0]}${form.telefono}`
      const payload = {
        nombre: form.nombre,
        email: form.email,
        password: form.password,
        telefono: fullPhone,
        rol: form.rol,
      }

      const registerResp = await axios.post(`${API_URL}/api/user/register/`, payload)
      
      // Auto-login después del registro
      const loginResp = await axios.post(`${API_URL}/api/user/login/`, {
        email: form.email,
        password: form.password,
      })
      
      const tokenData = loginResp.data
      const usuario = registerResp.data
      
      login({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: tokenData.access,
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        foto_perfil_url: usuario.foto_perfil_url,
        verificacion_email: false,
        verificacion_telefono: false,
        verificacion_identidad: false,
      })

      setVerificado({ email: false, telefono: false, cedula: false })

      showPopup('Cuenta creada correctamente', 'check-circle')

      if (usuario.rol === 'comercio') router.replace('/(comercio)');
      else if (usuario.rol === 'conductor') router.replace('/(delivery)');
      else router.replace('/(tabs)');
    } catch (error: any) {
      showPopup('Ocurrió un error al registrarte', 'cancel')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {!darkMode && (
        <LinearGradient
          colors={['rgba(37,99,235,0.08)', 'transparent']}
          className="absolute inset-0"
        />
      )}

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-5 pt-2">
              <Link href="/role-select" asChild>
                <TouchableOpacity
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.1)' }}
                >
                  <Ionicons name="chevron-back" size={22} color={darkMode ? '#F9FAFB' : '#2563EB'} />
                </TouchableOpacity>
              </Link>
            </View>

            <View className="px-6 pt-4 pb-8">
              <Animated.View entering={FadeInUp.delay(100).duration(600)} className="items-center mb-8">
                <View className={`w-20 h-20 rounded-2xl items-center justify-center mb-4 ${darkMode ? 'bg-blue-600/30' : 'bg-blue-100'}`}>
                  <Ionicons name="person-add-outline" size={36} color="#2563EB" />
                </View>
                <Text className={`text-3xl font-extrabold text-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Crear Cuenta
                </Text>
                <Text className={`text-base mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Completa tus datos para registrarte
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(600)} className="gap-4">
                <CustomInput
                  placeholder="Tu nombre completo"
                  value={form.nombre}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, nombre: text }))}
                  label="Nombre completo"
                />

                <CustomInput
                  placeholder="tu@email.com"
                  value={form.email}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                  label="Correo Electrónico"
                  keyboardType="email-address"
                />

                <CustomInput
                  placeholder="••••••••"
                  value={form.password}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                  label="Contraseña"
                  secureTextEntry
                />

                <CustomInput
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChangeText={(text) => setForm((prev) => ({ ...prev, confirmPassword: text }))}
                  label="Confirmar contraseña"
                  secureTextEntry
                />

                <View>
                  <Text className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Teléfono
                  </Text>
                    <View className="flex-row items-center gap-3">
                    <View
                      className={`flex-row items-center rounded-xl px-4 ${
                        darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                      }`}
                      style={{ height: 48 }}
                    >
                      <CountryPicker
                        countryCode={country.cca2 as any}
                        withFilter
                        withFlag
                        withCallingCode
                        withEmoji
                        onSelect={onSelect}
                        visible={visible}
                        onClose={() => setVisible(false)}
                        theme={darkMode ? DARK_THEME : undefined}
                      />

                      <TouchableOpacity onPress={() => setVisible(true)}>
                        <Text className={darkMode ? 'text-gray-300' : 'text-gray-600'} style={{ fontSize: 16, marginRight: 5 }}>
                          +{country.callingCode[0]}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1 }}>
                      <TextInput
                        placeholder="Número de teléfono"
                        value={form.telefono}
                        onChangeText={(text) => {
                          const cleaned = text.replace(/[^0-9]/g, '')
                          if (cleaned.length <= 10) {
                            setForm((prev) => ({ ...prev, telefono: cleaned }))
                          }
                        }}
                        keyboardType="phone-pad"
                        placeholderTextColor="#9CA3AF"
                        className={`rounded-xl px-4 ${darkMode ? "bg-gray-800 border border-gray-700 text-gray-100" : "bg-white border border-gray-200 text-gray-900"} font-semibold`}
                        style={{ height: 48 }}
                      />
                    </View>
                  </View>
                </View>

                <Button
                  title="Crear Cuenta"
                  onPress={submit}
                  loading={isSubmitting}
                  size="lg"
                />

                <View className="flex-row justify-center gap-1 mt-2">
                  <Text className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    ¿Ya tienes cuenta?
                  </Text>
                  <Link href="/sign-in" className="font-bold text-primary">
                    Iniciar sesión
                  </Link>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  )
}

export default SignUp
