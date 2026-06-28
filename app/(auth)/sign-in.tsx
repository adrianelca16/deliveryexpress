import CustomInput from '@/components/CustomInput';
import { useAuthStore } from '@/store/auth.store';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import axios from 'axios';
import { API_URL } from '@/constants';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import PopupMessage from '@/components/PopupMessage';
import { useThemeStore } from '@/store/theme.store';
import { LinearGradient } from 'expo-linear-gradient';
import Button from '@/components/ui/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

const SignIn = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { darkMode } = useThemeStore();
  const login = useAuthStore((state) => state.login);

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const submit = async () => {
    if (!form.email || !form.password) {
      showPopup('Por favor ingresa un Correo Electrónico y Contraseña', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/user/login/`, form);
      const { usuario, token } = response.data;

      login({
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        token: token.access,
        $id: usuario.id,
        $collectionId: '',
        $databaseId: '',
        $createdAt: '',
        $updatedAt: '',
        $permissions: [],
        telefono: usuario.telefono,
        foto_perfil: usuario.foto_perfil,
        foto_perfil_url: usuario.foto_perfil_url,
      });

      showPopup('Inicio sesión correctamente', 'check-circle');

      setTimeout(() => {
        if (usuario.rol === 'comercio') router.replace('/(comercio)');
        if (usuario.rol === 'cliente') router.replace('/(tabs)');
        if (usuario.rol === 'conductor') router.replace('/(delivery)');
      }, 1000);
    } catch (error: any) {
      showPopup('Correo o contraseña incorrectos. Por favor verifica tus datos e inténtalo de nuevo.', 'cancel');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <View className="px-5 pt-4">
              <Link href="/role-select" asChild>
                <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.1)' }}>
                  <Ionicons name="chevron-back" size={22} color={darkMode ? '#F9FAFB' : '#2563EB'} />
                </TouchableOpacity>
              </Link>
            </View>

            <View className="flex-1 justify-center px-6 pb-10">
              <Animated.View entering={FadeInUp.delay(100).duration(600)} className="items-center mb-10">
                <View className={`w-20 h-20 rounded-2xl items-center justify-center mb-6 ${darkMode ? 'bg-blue-600/30' : 'bg-blue-100'}`}>
                  <Ionicons name="log-in-outline" size={36} color="#2563EB" />
                </View>
                <Text className={`text-3xl font-extrabold text-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  Bienvenido
                </Text>
                <Text className={`text-base mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Inicia sesión para continuar
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(600)} className="gap-5">
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

                <Button
                  title="Iniciar Sesión"
                  onPress={submit}
                  loading={isSubmitting}
                  size="lg"
                />

                <View className="flex-row justify-center gap-1 mt-2">
                  <Text className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    ¿No tienes cuenta?
                  </Text>
                  <Link href="/sign-up" className="font-bold text-primary">
                    Crear Cuenta
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
  );
};

export default SignIn;
