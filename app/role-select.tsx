import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { Role } from '@/type';
import { API_URL } from '@/constants';
import { Ionicons } from '@expo/vector-icons';
import ScreenLoading from '@/components/ScreenLoading';
import RoleCard from '@/components/RoleCard';

export default function RoleSelectScreen() {
  const setRole = useAuthStore((state) => state.setRole);
  const { darkMode } = useThemeStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/roles/`);
        setRoles(res.data);
      } catch (err) {
        console.log("Error cargando roles:", err);
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
    fetchRoles();
  }, []);

  const handleSelect = (roleId: string) => {
    setRole(roleId);
    router.push('/sign-in');
  };

  if (loading) {
    return <ScreenLoading />;
  }

  return (
    <View className={`flex-1 ${darkMode ? 'bg-gray-900' : 'bg-[#FAFAF8]'}`}>
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 justify-center px-6 py-12">
            <Animated.View entering={FadeInDown.delay(100).duration(600)} className="items-center mb-8">
              <View
                className={`w-20 h-20 rounded-full items-center justify-center mb-5 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}
              >
                <Ionicons name="leaf" size={36} color="#2563EB" />
              </View>
              <Text
                className={`text-2xl font-light tracking-widest uppercase ${darkMode ? 'text-blue-400' : 'text-blue-900'}`}
              >
                EnRuta
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(600)} className="items-center mb-10">
              <Text className={`text-base text-center max-w-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Elige cómo quieres utilizar nuestra plataforma.
              </Text>
            </Animated.View>

            <View className="gap-6">
              {roles.map((role, index) => (
                <RoleCard
                  key={role.id}
                  roleName={role.nombre}
                  description={role.descripcion}
                  iconName={role.icons || undefined}
                  onPress={() => handleSelect(role.id)}
                  delay={300 + index * 120}
                  darkMode={darkMode}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
