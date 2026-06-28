import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { API_URL } from "@/constants";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from "@/store/theme.store";
import { useLocalSearchParams, useRouter } from "expo-router";
import PopupMessage from "@/components/PopupMessage";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Card from "@/components/ui/Card";
import Header from "@/components/ui/Header";

export default function FormularioOpciones() {
  const { id } = useLocalSearchParams();
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const { user } = useAuthStore();
  const router = useRouter();

  const [tipos, setTipos] = useState<
    { id?: number; nombre: string; obligatorio: boolean; multiple: boolean; opciones: any[] }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/restaurantes/tipos-opciones/?plato=${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tiposData = await Promise.all(
          res.data.map(async (tipo: any) => {
            const opcionesRes = await axios.get(`${API_URL}/api/restaurantes/opciones/?tipo=${tipo.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return {
              ...tipo,
              opciones: opcionesRes.data,
            };
          })
        );

        setTipos(tiposData.length ? tiposData : [
          { nombre: "", obligatorio: false, multiple: false, opciones: [] },
        ]);
      } catch (err) {
        console.log("Error cargando tipos:", err);
        setTipos([{ nombre: "", obligatorio: false, multiple: false, opciones: [] }]);
      } finally {
        setLoading(false);
      }
    };

    fetchTipos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAddTipo = () => {
    setTipos([...tipos, { nombre: "", obligatorio: false, multiple: false, opciones: [] }]);
  };

  const handleRemoveTipo = async (index: number, tipoId?: number) => {
    if (tipoId) {
      try {
        await axios.delete(`${API_URL}/api/restaurantes/tipos-opciones/${tipoId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log("Error eliminando tipo:", err);
      }
    }
    setTipos(tipos.filter((_, i) => i !== index));
  };

  const handleAddOpcion = (index: number) => {
    const nuevos = [...tipos];
    nuevos[index].opciones.push({ nombre: "", precio_adicional: "" });
    setTipos(nuevos);
  };

  const handleRemoveOpcion = async (tipoIndex: number, opcionIndex: number, opcionId?: number) => {
    if (opcionId) {
      try {
        await axios.delete(`${API_URL}/api/restaurantes/opciones/${opcionId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.log("Error eliminando opción:", err);
      }
    }

    const nuevos = [...tipos];
    nuevos[tipoIndex].opciones.splice(opcionIndex, 1);
    setTipos(nuevos);
  };

  const handleChangeTipo = (index: number, key: string, value: any) => {
    const nuevos = [...tipos];
    (nuevos[index] as any)[key] = value;
    setTipos(nuevos);
  };

  const handleChangeOpcion = (tipoIndex: number, opcionIndex: number, key: string, value: any) => {
    const nuevos = [...tipos];
    (nuevos[tipoIndex].opciones[opcionIndex] as any)[key] = value;
    setTipos(nuevos);
  };

  const handleGuardar = async () => {
    try {
      for (const tipo of tipos) {
        let tipoId = tipo.id;

        if (!tipoId) {
          const tipoRes = await axios.post(
            `${API_URL}/api/restaurantes/tipos-opciones/`,
            {
              plato: id,
              nombre: tipo.nombre,
              obligatorio: tipo.obligatorio,
              multiple: tipo.multiple,
              restaurante: user?.$id,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          tipoId = tipoRes.data.id;
        } else {
          await axios.put(
            `${API_URL}/api/restaurantes/tipos-opciones/${tipo.id}/`,
            {
              nombre: tipo.nombre,
              obligatorio: tipo.obligatorio,
              multiple: tipo.multiple,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        for (const opcion of tipo.opciones) {
          if (opcion.id) {
            await axios.put(
              `${API_URL}/api/restaurantes/opciones/${opcion.id}/`,
              {
                nombre: opcion.nombre,
                precio_adicional: parseFloat(opcion.precio_adicional || 0),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } else {
            await axios.post(
              `${API_URL}/api/restaurantes/opciones/`,
              {
                tipo: tipoId,
                nombre: opcion.nombre,
                precio_adicional: parseFloat(opcion.precio_adicional || 0),
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }
        }
      }

      showPopup("Opciones guardadas correctamente", "check-circle");
      router.push("/(comercio)/platos");
    } catch (err) {
      console.log("Error guardando opciones:", err);
      showPopup("No se pudieron guardar las opciones", "cancel");
    }
  };

  if (loading) return (
    <ScreenWrapper>
      <View className="flex-1 justify-center items-center">
        <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cargando opciones...</Text>
      </View>
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper gradient>
      <Header title="Opciones del Plato" showBack gradient />

      <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mb-2">
          <Text className="text-lg font-bold text-secondary text-center">Configurar Opciones del Plato</Text>
        </Animated.View>

        {tipos.map((tipo, i) => (
          <Animated.View key={`tipo-${i}`} entering={FadeInDown.delay(150 + i * 60).duration(400)}>
            <Card className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-lg text-primary">Tipo #{i + 1}</Text>
                <TouchableOpacity className="w-8 h-8 rounded-full items-center justify-center bg-red-50" onPress={() => handleRemoveTipo(i, tipo.id)}>
                  <MaterialIcons name="delete" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Ej. Tamaño, Extras..."
                placeholderTextColor="#9CA3AF"
                value={tipo.nombre}
                onChangeText={(t) => handleChangeTipo(i, "nombre", t)}
                className={`rounded-2xl p-3.5 mb-4 ${darkMode ? "bg-gray-700 text-white" : "bg-gray-50 text-gray-900 border border-purple-100/50"}`}
              />

              <View className="flex-row justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <Text className={`font-semibold text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Obligatorio</Text>
                  <Switch
                    value={tipo.obligatorio}
                    onValueChange={(v) => handleChangeTipo(i, "obligatorio", v)}
                    trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
                    thumbColor="#2563EB"
                  />
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className={`font-semibold text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Múltiple</Text>
                  <Switch
                    value={tipo.multiple}
                    onValueChange={(v) => handleChangeTipo(i, "multiple", v)}
                    trackColor={{ false: "#D9D9D9", true: "#2563EB" }}
                    thumbColor="#2563EB"
                  />
                </View>
              </View>

              <Text className={`font-semibold text-sm mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Opciones:</Text>

              {tipo.opciones.map((op, j) => (
                <View key={`op-${j}`} className={`rounded-2xl p-3 mb-2 ${darkMode ? "bg-gray-700" : "bg-gray-50 border border-purple-100/50"}`}>
                  <View className="flex-row justify-between items-center">
                    <TextInput
                      placeholder="Nombre de la opción"
                      placeholderTextColor="#9CA3AF"
                      value={op.nombre}
                      onChangeText={(t) => handleChangeOpcion(i, j, "nombre", t)}
                      className={`flex-1 mr-2 text-sm ${darkMode ? "text-white" : "text-gray-900"}`}
                    />
                    <TouchableOpacity onPress={() => handleRemoveOpcion(i, j, op.id)}>
                      <MaterialIcons name="delete" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="Precio adicional (0.00)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={op.precio_adicional?.toString() || ""}
                    onChangeText={(t) => handleChangeOpcion(i, j, "precio_adicional", t)}
                    className={`mt-2 text-sm border-b ${darkMode ? "text-white border-gray-600" : "text-gray-900 border-gray-300"}`}
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={() => handleAddOpcion(i)}
                className="bg-primary py-2.5 px-6 rounded-2xl mt-2"
                style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 }}
              >
                <Text className="text-center text-white font-semibold text-sm">+ Añadir Opción</Text>
              </TouchableOpacity>
            </Card>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            onPress={handleAddTipo}
            className="bg-secondary py-3.5 px-6 rounded-2xl mb-4"
            style={{ shadowColor: '#65A30D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          >
            <Text className="text-center text-white font-bold">+ Añadir Tipo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGuardar}
            className="bg-primary py-3.5 px-6 rounded-2xl mb-10"
            style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          >
            <Text className="text-center text-white font-bold text-lg">Guardar Todo</Text>
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
