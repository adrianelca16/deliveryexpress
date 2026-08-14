import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCarrito } from "@/store/useCart";
import axios from "axios";
import { API_URL, images } from "@/constants";
import { Direccion, Estado, MetodosPagos } from "@/type";
import { useAuthStore } from "@/store/auth.store";
import { useThemeStore } from '@/store/theme.store';
import CountryPicker, { DARK_THEME } from "react-native-country-picker-modal";
import PopupMessage from "@/components/PopupMessage";
import CustomButton from "@/components/CustomButton";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import Header from "@/components/ui/Header";
import Card from "@/components/ui/Card";

export default function PagoMovilModal() {
  const [referencia, setReferencia] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<Estado | null>(null);
  const token = useAuthStore((state) => state.user?.token);
  const [metodosPago, setMetodosPago] = useState<MetodosPagos[]>([]);
  const { carrito, limpiarCarrito } = useCarrito();
  const { darkMode } = useThemeStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [direccionPrincipal, setDireccionPrincipal] = useState<Direccion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tasaDolar, setTasaDolar] = useState(623.02);
  const [loadingData, setLoadingData] = useState(true);

  const [pagoMovilData, setPagoMovilData] = useState({
    pago_movil_telefono: '+58 0412-1234567',
    pago_movil_cedula: 'V-12345678',
    pago_movil_banco: 'Banco de Venezuela',
    pago_movil_titular: 'EnRuta Delivery',
  });

  const { montoTotal } = useLocalSearchParams();

  const montoTotalNum = Number(montoTotal) || 0;
  const montoEnBs = montoTotalNum * tasaDolar;

  const [country, setCountry] = useState({
    cca2: "VE",
    callingCode: ["58"],
  });
  const [visible, setVisible] = useState(false);
  const onSelect = (countrySelected: any) => setCountry(countrySelected);

  const [popup, setPopup] = useState({
    visible: false,
    message: "",
    icon: "info" as keyof typeof MaterialIcons.glyphMap,
  });

  const showPopup = (message: string, icon: keyof typeof MaterialIcons.glyphMap = "info") => {
    setPopup({ visible: true, message, icon });
  };

  const copiar = async (texto: string) => {
    await Clipboard.setStringAsync(texto);
  };

  const fetchTasaDolar = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pagos/tasa-dolar/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasaDolar(res.data.tasa);
    } catch (err) {
      showPopup("Error al obtener tasa de dólar", "cancel");
    }
  };

  const fetchPagoMovilData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/gestion/parametros/publicos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.pago_movil_telefono) {
        setPagoMovilData({
          pago_movil_telefono: res.data.pago_movil_telefono,
          pago_movil_cedula: res.data.pago_movil_cedula || 'V-12345678',
          pago_movil_banco: res.data.pago_movil_banco || 'Banco de Venezuela',
          pago_movil_titular: res.data.pago_movil_titular || 'EnRuta Delivery',
        });
      }
    } catch (err) {
      showPopup("Error al obtener datos de pago móvil", "cancel");
    }
  };

  const handleSubmit = async () => {
    if (!telefono || telefono.length < 7) {
      return showPopup("Debe ingresar un teléfono válido", "warning");
    }

    if (!referencia) {
      return showPopup("Debe ingresar la referencia del pago", "warning");
    }

    try {
      setIsSubmitting(true)
      const restauranteId = carrito;
      const detalles = carrito.map((item) => ({
        plato: item.id,
        cantidad: item.cantidad,
      }));

      const payload = {
        restaurante: restauranteId[0].restauranteId,
        estado: estado?.id,
        metodo_pago: metodosPago.find((x) => x.nombre === "Pago móvil")?.id,
        detalles,
        direccion_entrega: `${direccionPrincipal?.direccion_texto}`,
        latitud: direccionPrincipal?.latitud,
        longitud: direccionPrincipal?.longitud,
      };

      const res = await axios.post(`${API_URL}/api/ordenes/ordenes/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const payloadPago = {
        orden: res.data.id,
        metodo: metodosPago.find((x) => x.nombre === "Pago móvil")?.id,
        monto_usd: res.data.total,
        tasa_cambio: tasaDolar.toFixed(2),
        referencia,
        telefono_pago: `+${country.callingCode[0]}${telefono}`,
      };

      await axios.post(`${API_URL}/api/pagos/`, payloadPago, {
        headers: { Authorization: `Bearer ${token}` },
      }).finally(() => setIsSubmitting(false))

      limpiarCarrito();
      setReferencia("");
      setTelefono("");
      showPopup("Tu orden fue registrada correctamente", "check-circle");
      setTimeout(() => router.replace("/(tabs)"), 1200);
    } catch (err) {
      showPopup("No se pudo registrar el pago. Intenta nuevamente.", "cancel");
    }
  };

  const fecthEstatusOrden = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/ordenes/estados-orden/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstado(res.data.find((e: Estado) => e.nombre.toLowerCase() === "pago por verificar"));
    } catch (err) {
      showPopup("Error al cargar estados de orden", "cancel");
    }
  };

  const fetchPagos = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/pagos/metodos-pago/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetodosPago(res.data);
    } catch (err) {
      showPopup("Error al cargar métodos de pago", "cancel");
    }
  };

  const fetchDireccionPrincipal = async () => {
          try {
            const res = await axios.get(`${API_URL}/api/user/direcciones/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const principal = res.data.find((d: Direccion) => d.es_predeterminada === true);
            setDireccionPrincipal(principal || null);
          } catch (err) {
            showPopup("Error al cargar dirección", "cancel");
          }
    };


  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        await Promise.all([
          fecthEstatusOrden(),
          fetchPagos(),
          fetchDireccionPrincipal(),
          fetchTasaDolar(),
          fetchPagoMovilData(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    loadData();
  }, [carrito]);

  return (
    <ScreenWrapper>
      <Modal
        visible={loadingData}
        transparent
        animationType="fade"
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.3)' }}>
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 items-center justify-center" style={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }}>
            <Image
              source={images.carga}
              style={{ width: 120, height: 120 }}
              resizeMode="contain"
            />
            <Text className={`mt-4 text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Calculando monto...
            </Text>
          </View>
        </View>
      </Modal>

      <Header
        title="Pago Móvil"
        showBack
        onBack={() => router.push("/cart")}
        className='mb-3'
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-5 mt-4"
        contentContainerStyle={{ paddingBottom: 20 + insets.bottom }}
      >

        <Card className="mb-4" style={{ elevation: 2, backgroundColor: darkMode ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.1)' }}>
          <Text className="text-lg font-bold text-center mb-3" style={{ color: '#2563EB' }}>Instrucciones</Text>
          <Text className="text-base mb-1" style={{ color: '#2563EB' }}>1. Copia los datos de pago que aparecen abajo.</Text>
          <Text className="text-base mb-1" style={{ color: '#2563EB' }}>2. Realiza el pago móvil desde tu banco.</Text>
          <Text className="text-base mb-1" style={{ color: '#2563EB' }}>3. Guarda el número de referencia.</Text>
          <Text className="text-base" style={{ color: '#2563EB' }}>4. Ingresa la referencia y el teléfono.</Text>
        </Card>

        <Text className='font-bold text-xl mb-3' style={{ color: darkMode ? '#EAB308' : '#B8860B' }}>
          Datos para realizar el pago:
        </Text>

        <View className="gap-3">
          {[
            { label: "Monto Bs.", valor: `Bs. ${montoEnBs.toFixed(2)}`, icon: "cash" },
            { label: "Teléfono", valor: pagoMovilData.pago_movil_telefono, icon: "call" },
            { label: "Cédula", valor: pagoMovilData.pago_movil_cedula, icon: "person" },
            { label: "Banco", valor: pagoMovilData.pago_movil_banco, icon: "business" },
            { label: "Titular", valor: pagoMovilData.pago_movil_titular, icon: "person-circle" },
          ].map((item) => (
            <Card key={item.label} className="flex-row justify-between items-center py-3 px-3" style={{ elevation: 3 }}>
              <View className="flex-row items-center gap-3">
                <Ionicons name={item.icon as any} size={22} color="#2563EB" />
                <View>
                  <Text className={`${darkMode ? "text-gray-400" : "text-gray-500"} font-medium`}>{item.label}</Text>
                  <Text
                    className={`font-semibold text-lg ${
                        item.label === "Monto Bs." ? "text-secondary" : darkMode ? "text-white" : "text-black"
                    }`}
                  >
                    {item.valor}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => copiar(item.valor)}>
                <Ionicons name="copy-outline" size={22} color={darkMode ? '#D1D5DB' : '#374151'} />
              </TouchableOpacity>
            </Card>
          ))}
        </View>

        <View className="mt-6">
          <Text className={`font-semibold text-lg mb-2 ${darkMode ? "text-white" : "text-black"}`}>Teléfono desde donde realizó el pago</Text>
          <View className="flex-row items-center gap-2">
            <Card className="flex-row items-center px-4 rounded-2xl" style={{ elevation: 2, flexBasis: '30%' }}>
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
                <Text style={{ fontSize: 16, marginRight: 5, color: darkMode ? '#D1D5DB' : '#000' }}>+${country.callingCode[0]}</Text>
              </TouchableOpacity>
            </Card>

            <Card className="flex-1 rounded-2xl px-4" style={{ elevation: 2, flexBasis: '70%' }}>
              <TextInput
                className={`${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
                placeholder="Ingresa tu número de teléfono"
                placeholderTextColor="#9CA3AF"
                value={telefono}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, "");
                  if (cleaned.length <= 10) setTelefono(cleaned);
                }}
                keyboardType="numeric"
              />
            </Card>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="receipt-outline" size={22} color="#2563EB" />
            <Text className={`ml-2 font-semibold text-lg ${darkMode ? "text-white" : "text-black"}`}>Referencia</Text>
          </View>
          <Card className="rounded-lg px-4 py-3" style={{ elevation: 2 }}>
            <TextInput
              className={`${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
              value={referencia}
              onChangeText={setReferencia}
              placeholder="Ingrese el número de referencia"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </Card>
        </View>

        <View className="flex-row justify-between mt-6">
          <CustomButton
            title="Cancelar"
            style='bg-secondary'
            onPress={() => router.push("/cart")}
          />

          <CustomButton
            title="Confirmar"
            style='bg-primary'
            isLoading={isSubmitting}
            onPress={handleSubmit}
          />
        </View>
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