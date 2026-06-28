import { TabBarIconProps } from '@/type';
import { Redirect, Tabs, usePathname } from 'expo-router';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import cn from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { API_URL, images } from '@/constants';
import { useEffect, useState } from 'react';
import axios from 'axios';

const TabBarIcon = ({ focused, icon, title }: TabBarIconProps) => {
    const { darkMode } = useThemeStore();
    return (
        <View className="tab-icon flex justify-center items-center w-4">
            <Image source={icon} className="size-7" resizeMode="cover" tintColor={focused ? '#2563EB' : (darkMode ? '#9CA3AF' : '#5D5F6D')} />
            <Text className={cn('text-sm font-bold', focused ? (darkMode ? 'text-gray-100' : 'text-gray-800') : (darkMode ? 'text-gray-400' : 'text-gray-800'))}>
                {title}
            </Text>
        </View>
    );
}

export default function ComercioLayout() {
  const { user, isAuthenticated } = useAuthStore();
  const { darkMode } = useThemeStore();
  const [loading, setLoading] = useState(true);
  const [debeRegistrar, setDebeRegistrar] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const verificar = async () => {
      if (!user || user.rol !== 'comercio') return;

      try {
        const res = await axios.get(`${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const restaurante = res.data;

        const camposIncompletos =
          !restaurante?.nombre ||
          !restaurante?.descripcion ||
          !restaurante?.direccion ||
          !restaurante?.latitud ||
          !restaurante?.longitud ||
          !restaurante?.estado;

        if (!restaurante || camposIncompletos) {
          setDebeRegistrar(true);
        }
      } catch (err) {
        console.log('Verificación falló:', err);
        setDebeRegistrar(true);
      } finally {
        setLoading(false);
      }
    };

    verificar();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

const estaEnRegistro = pathname.includes('/restaurantes/registrar-restaurantes');
const estaEnSeleccionDireccion = pathname.includes('/restaurantes/seleccionar-direccion');

if (debeRegistrar && !estaEnRegistro && !estaEnSeleccionDireccion) {
  return <Redirect href="/(comercio)/restaurantes/registrar-restaurantes" />;
}

    return (
      <View className="flex-1">
        {!darkMode && (
          <LinearGradient
            colors={['rgba(124,58,237,0.06)', 'transparent']}
            className="absolute inset-0"
          />
        )}
        <View className={`flex-1 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
          <Tabs screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              borderTopLeftRadius: 50,
              borderTopRightRadius: 50,
              borderBottomLeftRadius: 50,
              borderBottomRightRadius: 50,
              marginHorizontal: 20,
              height: 80,
              position: 'absolute',
              bottom: 20,
              backgroundColor: darkMode ? '#1F2937' : 'white',
              borderTopWidth: 0,
              borderColor: 'transparent',
              shadowColor: darkMode ? '#000' : '#2563EB',
              shadowOffset: { width: 0, height: darkMode ? 0 : 2 },
              shadowOpacity: darkMode ? 0 : 0.1,
              shadowRadius: darkMode ? 0 : 4,
              elevation: darkMode ? 0 : 5,
            }
          }}>
            <Tabs.Screen
                name='index'
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Inicio" icon={images.home} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='platos'
                options={{
                    title: 'Platos',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Platos" icon={images.platos} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='ordenes'
                options={{
                    title: 'Ordenes',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Ordenes" icon={images.bag} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='perfil'
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Perfil" icon={images.person} focused={focused} />
                }}
            />
            <Tabs.Screen
                name="platos/formulario"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="restaurantes/registrar-restaurantes"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' }
                }}
            />
            <Tabs.Screen
                name="ordenes/orden-detalle"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="restaurantes/seleccionar-direccion"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' }
                }}
            />
            <Tabs.Screen
                name="platos/formulario-opciones"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' }
                }}
            />
          </Tabs>
        </View>
      </View>
    );
}
