/* eslint-disable @typescript-eslint/no-unused-vars */
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_URL, VenezuelaEstados } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import PopupMessage from "@/components/PopupMessage";
import ThemePicker from '@/components/ThemePicker';
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";
import CustomButton from "@/components/CustomButton";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function FormularioDireccion() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const id = params.id as string | undefined;
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();

  const [nombre, setNombre] = useState("");
  const [calle, setCalle] = useState("");
  const [puntoReferencia, setPuntoReferencia] = useState("");
  const [latitud, setLatitud] = useState(0.0);
  const [longitud, setLongitud] = useState(0.0);
  const [esPredeterminada, setEsPredeterminada] = useState(false);

  const [estado, setEstado] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estadosData, setEstadosData] = useState<{ nombre: string; municipios: string[] }[]>([]);
  const [municipiosData, setMunicipiosData] = useState<string[]>([]);

  const justLoadedData = useRef(false);

  useEffect(() => {
    const mappedEstados = VenezuelaEstados.map(e => ({
      nombre: e.estado,
      municipios: e.municipios.map(m => m.municipio)
    }));
    setEstadosData(mappedEstados);
  }, []);

  useEffect(() => {
    if (justLoadedData.current) {
      const estadoEncontrado = estadosData.find(e => e.nombre === estado);
      if (estadoEncontrado) {
        setMunicipiosData(estadoEncontrado.municipios);
      }
      justLoadedData.current = false;
    }
  }, [estado, estadosData]);

  useFocusEffect(
    useCallback(() => {
      if (!id) {
        setNombre("");
        setEstado("");
        setMunicipio("");
        setCalle("");
        setPuntoReferencia("");
        setLatitud(0.0);
        setLongitud(0.0);
        setEsPredeterminada(false);
        setMunicipiosData([]);
      } else {
        const fetchDireccion = async () => {
          try {
            const response = await axios.get(`${API_URL}/api/user/direcciones/${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const d = response.data;
            const direccionParts = d.direccion_texto.split(",").map((part: string) => part.trim());

            setNombre(d.nombre);
            setEstado(direccionParts[0] || "");
            setMunicipio(direccionParts[1] || "");
            setCalle(direccionParts[2] || "");
            setPuntoReferencia(direccionParts.slice(3).join(", "));
            setLatitud(d.latitud.toString());
            setLongitud(d.longitud.toString());
            setEsPredeterminada(d.es_predeterminada);
            justLoadedData.current = true;
          } catch (error) {
            console.error("Error al cargar dirección:", error);
          }
        };
        fetchDireccion();
      }
    }, [id, token])
  );

  useEffect(() => {
    if (params.latitud && params.longitud) {
      setLatitud(parseFloat(params.latitud as string));
      setLongitud(parseFloat(params.longitud as string));
    }
  }, [params.latitud, params.longitud]);

  const handleSubmit = async () => {
    const direccionCompleta = `${estado}, ${municipio}, ${calle}, ${puntoReferencia}`;

    const payload = {
      nombre,
      direccion_texto: direccionCompleta,
      latitud,
      longitud,
      es_predeterminada: esPredeterminada,
    };

    try {
      if (!id && esPredeterminada) {
        const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const yaExistePredeterminada = res.data.some((d: any) => d.es_predeterminada);
        if (yaExistePredeterminada) {
          return showPopup(
            'Ya tienes una dirección predeterminada. Debes editarla o eliminarla antes de crear una nueva predeterminada.',
            'cancel'
          );
        }
      }

      if (id) {
        await axios.put(`${API_URL}/api/user/direcciones/${id}/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showPopup('Dirección editada correctamente', 'check-circle');
        setTimeout(() => { router.replace("/perfil/direccion"); }, 2000);
      } else {
        await axios.post(`${API_URL}/api/user/direcciones/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showPopup('Dirección creada correctamente', 'check-circle');
        setTimeout(() => { router.replace("/perfil/direccion"); }, 2000);
      }
    } catch (error) {
      showPopup('Error al guardar dirección', 'cancel');
    }
  };

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const ubicacionSeleccionada = latitud && longitud;

  return (
    <ScreenWrapper>
      <Header className="mb-3" title={id ? "Editar Dirección" : "Nueva Dirección"} showBack onBack={() => router.push("/perfil/direccion")} />

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <Card className="mb-4">
            <Text className="text-primary mb-2 font-bold">Nombre de la dirección</Text>
            <TextInput
              className={`${darkMode ? "bg-gray-800 border border-gray-600" : "bg-white border border-gray-300"} rounded-xl px-4 py-3.5 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Casa, Trabajo"
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
          <Card className="mb-4">
            <Text className="text-primary font-bold mb-2">Estado</Text>
            <ThemePicker
              selectedValue={estado}
              onValueChange={setEstado}
              items={estadosData.map(e => ({ label: e.nombre, value: e.nombre }))}
              placeholder="Selecciona un estado"
              containerStyle="mb-0"
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
          <Card className="mb-4">
            <Text className="text-primary font-bold mb-2">Municipio</Text>
            <ThemePicker
              selectedValue={municipio}
              onValueChange={setMunicipio}
              items={municipiosData.map(m => ({ label: m, value: m }))}
              placeholder="Selecciona un municipio"
              containerStyle="mb-0"
              disabled={municipiosData.length === 0}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
          <Card className="mb-4">
            <Text className="text-primary font-bold mb-2">Calle</Text>
            <TextInput
              className={`${darkMode ? "bg-gray-800 border border-gray-600" : "bg-white border border-gray-300"} rounded-xl px-4 py-3.5 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
              value={calle}
              onChangeText={setCalle}
              placeholder="Ej. Calle 123"
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400).springify()}>
          <Card className="mb-4">
            <Text className="text-primary font-bold mb-2">Punto de Referencia</Text>
            <TextInput
              className={`${darkMode ? "bg-gray-800 border border-gray-600" : "bg-white border border-gray-300"} rounded-xl px-4 py-3.5 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
              value={puntoReferencia}
              onChangeText={setPuntoReferencia}
              placeholder="Ej. La casa naranja ..."
              placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
            />
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(400).springify()}>
          <Card className="mb-4">
            <View className="flex-row justify-between items-center">
              <Text className={`${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}>¿Es predeterminada?</Text>
              <Switch
                value={esPredeterminada}
                onValueChange={setEsPredeterminada}
                trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
                thumbColor="#2563EB"
              />
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).duration(400).springify()}>
          <TouchableOpacity
            onPress={() => router.push("/perfil/seleccionar-direccion")}
            className="mb-6"
          >
            <Card className={`items-center py-4 border-dashed border-2 ${ubicacionSeleccionada ? "border-secondary/50" : "border-primary/30 dark:border-primary/50"}`}>
              <Ionicons name="map-outline" size={28} color={ubicacionSeleccionada ? "#B8860B" : "#2563EB"} />
              <Text className={`font-bold text-base mt-1 ${ubicacionSeleccionada ? "text-secondary" : "text-primary"}`}>Seleccionar en el mapa</Text>
            </Card>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(400).springify()} className="items-center gap-4">
          <CustomButton
            title={id ? "Guardar Cambios" : "Guardar Dirección"}
            onPress={handleSubmit}
            style="bg-primary w-3/4"
            textStyle="text-white font-bold"
          />

          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil/direccion')} className="rounded-xl py-3 px-6 w-3/4 items-center" style={{ backgroundColor: '#B8860B' }}>
            <Text className="text-white font-bold text-lg">Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <PopupMessage
        visible={popup.visible}
        message={popup.message}
        icon={popup.icon}
        onClose={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />
    </ScreenWrapper>
  );
}