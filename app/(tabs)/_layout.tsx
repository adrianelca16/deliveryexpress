import { Tabs, Redirect } from "expo-router";
import { Image, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { images } from "@/constants";
import cn from "clsx";

const TabBarIcon = ({ focused, icon, title }: { focused: boolean; icon: any; title: string }) => {
  const { darkMode } = useThemeStore();
  return (
    <View className="tab-icon flex justify-center items-center w-4">
      <Image
        source={icon}
        className="size-7"
        resizeMode="cover"
        tintColor={focused ? "#2563EB" : (darkMode ? "#9CA3AF" : "#5D5F6D")}
      />
      <Text
        className={cn(
          "text-sm font-bold",
          focused ? (darkMode ? "text-gray-100" : "text-gray-800") : (darkMode ? "text-gray-400" : "text-gray-800")
        )}
      >
        {title}
      </Text>
    </View>
  );
};

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const { darkMode } = useThemeStore();
  const insets = useSafeAreaInsets();

  if (!isAuthenticated) return <Redirect href="/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: darkMode ? "#1F2937" : "white",
          borderTopWidth: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Inicio" icon={images.home} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Buscar",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Buscar" icon={images.search} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Carrito",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Carrito" icon={images.bag} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ focused }) => <TabBarIcon title="Perfil" icon={images.person} focused={focused} />,
        }}
      />

      {/* Rutas ocultas */}
      <Tabs.Screen name="perfil/historial" options={{ href: null }} />
      <Tabs.Screen name="perfil/direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/formulario-direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/formulario-perfil" options={{ href: null }} />
      <Tabs.Screen name="restaurante/restaurante" options={{ href: null }} />
      <Tabs.Screen name="restaurante/plato-detalle" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/orden-detalle" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="orden/pago-movil" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="perfil/seleccionar-direccion" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-registro" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-cedula" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-telefono" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/confirmacion-email" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="registros/foto-perfil" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}
