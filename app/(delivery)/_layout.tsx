import { images } from "@/constants";
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { TabBarIconProps } from "@/type";
import cn from "clsx";
import { Redirect, Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

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
export default function TabsLayout() {

    const { darkMode } = useThemeStore();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    if (!isAuthenticated) return <Redirect href="/sign-in" />
    return (
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
                elevation: darkMode ? 0 : 5
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
                name='historial'
                options={{
                    title: 'Historial',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Historial" icon={images.search} focused={focused} />
                }}
            />
            <Tabs.Screen
                name='wallet'
                options={{
                    title: 'Wallet',
                    tabBarIcon: ({ focused }) => <TabBarIcon title="Wallet" icon={images.bag} focused={focused} />
                }}
            />

             <Tabs.Screen
                name="orden/orden-detalle"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}
