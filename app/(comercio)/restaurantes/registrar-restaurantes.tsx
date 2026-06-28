import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  View,
  Image,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { API_URL } from '@/constants';

import ThemePicker from '@/components/ThemePicker';
import { Estado } from '@/type';
import { router, useLocalSearchParams } from 'expo-router';
import TimePickerInput from '@/components/TimePickerInput';
import * as ImagePicker from 'expo-image-picker';
import type { ImagePickerAsset } from 'expo-image-picker';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import CountryPicker, { DARK_THEME } from 'react-native-country-picker-modal';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Header from '@/components/ui/Header';

interface Categoria {
  id: string;
  nombre: string;
}

export default function RegistrarRestaurante() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ latitud?: string; longitud?: string }>();

  const [restauranteId, setRestauranteId] = useState<string | null>(null);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [horaApertura, setHoraApertura] = useState('');
  const [horaCierre, setHoraCierre] = useState('');

  const [estado, setEstado] = useState<string>('');
  const [estadosDisponibles, setEstadosDisponibles] = useState<Estado[]>([]);

  const [categoria, setCategoria] = useState<string>('');
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);

  const [telefono, setTelefono] = useState(
    user?.telefono ? user.telefono.replace(/^\+/, '').slice(-10) : ''
  );

  const [imagen, setImagen] = useState<ImagePickerAsset | null>(null);

  const [country, setCountry] = useState({
    cca2: 'VE',
    callingCode: ['58'],
  });
  const [visible, setVisible] = useState(false);

  const onSelect = (countrySelected: any) => {
    setCountry(countrySelected);
  };

  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setter(result.assets[0]);
    }
  };

  const fetchRestaurante = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.id) {
        const r = res.data;
        setRestauranteId(r.id);
        setNombre(r.nombre || '');
        setDescripcion(r.descripcion || '');
        setDireccion(r.direccion || '');
        setLatitud(String(r.latitud || ''));
        setLongitud(String(r.longitud || ''));
        setEstado(r.estado || '');
        setHoraApertura(r.horario_apertura || '');
        setHoraCierre(r.horario_cierre || '');
        setCategoria(r.categoria.id || '');
        setTelefono(r.telefono ? r.telefono.replace(/^\+/, '').slice(-10) : '');

        if (r.imagen || r.imagen_url) {
          setImagen({
            uri: r.imagen_url,
            width: 0,
            height: 0,
            fileName: "server-image.jpg",
            type: "image/jpeg",
          } as any);
        }
      }
    } catch (err) {
      console.log('Error cargando restaurante:', err);
    }
  };

  const fetchEstados = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/estados/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstadosDisponibles(res.data);
    } catch (err) {
      console.log('Error obteniendo estados:', err);
    }
  };

  const fetchCategorias = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/restaurantes/categorias/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategoriasDisponibles(res.data);
    } catch (err) {
      console.log('Error obteniendo categorías:', err);
    }
  };

  const convertirHora24 = (hora: string) => {
    if (!hora) return "";
    const pm = hora.toLowerCase().includes("pm");
    const am = hora.toLowerCase().includes("am");
    let [h, m] = hora.replace(/(am|pm)/i, "").trim().split(":");
    let horas = parseInt(h, 10);
    let minutos = parseInt(m, 10);
    if (pm && horas < 12) horas += 12;
    if (am && horas === 12) horas = 0;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:00`;
  };

  const handleGuardar = async () => {
    const faltantes: string[] = [];
    if (!nombre.trim()) faltantes.push('Nombre');
    if (!descripcion.trim()) faltantes.push('Descripción');
    if (!direccion.trim()) faltantes.push('Dirección');
    if (!latitud || !longitud) faltantes.push('Ubicación en el mapa');
    if (!horaApertura) faltantes.push('Hora de apertura');
    if (!horaCierre) faltantes.push('Hora de cierre');
    if (!estado) faltantes.push('Estado');
    if (!categoria) faltantes.push('Categoría');
    if (telefono.length !== 10) faltantes.push('Teléfono (10 dígitos)');
    if (faltantes.length > 0) {
      Alert.alert('Campos requeridos', `Completa los siguientes campos:\n• ${faltantes.join('\n• ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    formData.append('direccion', direccion);
    formData.append('latitud', latitud);
    formData.append('longitud', longitud);
    formData.append('horario_apertura', convertirHora24(horaApertura));
    formData.append('horario_cierre', convertirHora24(horaCierre));
    formData.append('estado', estado);
    formData.append('categoria_id', categoria);

    const fullPhone = `+${country.callingCode[0]}${telefono}`;
    formData.append('telefono', fullPhone);

    if (imagen) {
      formData.append('imagen', {
        uri: imagen.uri,
        type: 'image/jpeg',
        name: 'imagen.jpg',
      } as any);
    }

    try {
      if (restauranteId) {
        await axios.patch(
          `${API_URL}/api/restaurantes/restaurantes/mi_restaurante/`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert('Actualizado', 'Restaurante actualizado correctamente');
        router.replace('/(comercio)/perfil');
      } else {
        await axios.post(
          `${API_URL}/api/restaurantes/restaurantes/`,
          formData,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        Alert.alert('Registrado', 'Restaurante registrado correctamente');
        router.replace('/(comercio)');
      }
    } catch (err) {
      console.log('Error al guardar restaurante:', err);
      Alert.alert('Error', 'No se pudo guardar la información');
    }
  };

  useEffect(() => {
    fetchRestaurante();
    fetchEstados();
    fetchCategorias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (params?.latitud && params?.longitud) {
      setLatitud(params.latitud);
      setLongitud(params.longitud);
    }
  }, [params]);

  return (
    <ScreenWrapper>
      <Header title={restauranteId ? "Editar Restaurante" : "Registrar Restaurante"} showBack backHref="/(comercio)" className='mb-3' />

      <ScrollView className="flex-1 px-5" overScrollMode="never">
        {imagen && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center mt-2">
            <Image className="w-28 h-28 rounded-3xl" source={{ uri: imagen.uri }} />
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center mt-3 mb-4">
          <TouchableOpacity
            className="bg-primary/10 rounded-2xl px-5 py-2.5 flex-row items-center gap-2"
            onPress={() => pickImage(setImagen)}
          >
            <FontAwesome name="camera" size={16} color="#2563EB" />
            <Text className="text-primary font-semibold">{imagen ? 'Cambiar Imagen' : 'Seleccionar Imagen'}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Nombre del Restaurante</Text>
          <TextInput
            className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-4 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre de tu restaurante"
            placeholderTextColor="#9CA3AF"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Descripción</Text>
          <TextInput
            className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-4 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="Describe tu restaurante..."
            placeholderTextColor="#9CA3AF"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Dirección</Text>
          <TextInput
            className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-4 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Dirección del restaurante"
            placeholderTextColor="#9CA3AF"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TouchableOpacity
            className={`flex-row items-center gap-3 mb-4 p-4 rounded-2xl ${latitud && longitud ? darkMode ? "bg-gray-800 border border-green-500/30" : "bg-white border border-green-400" : darkMode ? "bg-gray-800" : "bg-white border border-purple-100/50"}`}
            style={darkMode ? {} : { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push('/restaurantes/seleccionar-direccion')}
          >
            <FontAwesome name="map-marker" size={22} color={latitud && longitud ? "#4CAF50" : "#2563EB"} />
            {latitud && longitud ? (
              <View className="flex-1">
                <Text className="text-green-600 font-bold">Ubicación seleccionada</Text>
                <Text className="text-green-500 text-xs">{parseFloat(latitud).toFixed(4)}, {parseFloat(longitud).toFixed(4)}</Text>
              </View>
            ) : (
              <Text className="text-primary font-bold flex-1">Seleccionar en el mapa</Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={latitud && longitud ? "#4CAF50" : "#2563EB"} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <TimePickerInput label="Hora de Apertura" value={horaApertura} onChange={setHoraApertura} />
          <TimePickerInput label="Hora de Cierre" value={horaCierre} onChange={setHoraCierre} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text className={`font-semibold mb-2 mt-2 ${darkMode ? "text-white" : "text-primary"}`}>Estado</Text>
          <ThemePicker
            selectedValue={estado}
            onValueChange={(itemValue) => setEstado(itemValue)}
            items={[
              { label: 'Selecciona un estado', value: '' },
              ...estadosDisponibles.map((estadoItem) => ({ label: estadoItem.nombre, value: estadoItem.id })),
            ]}
            placeholder="Selecciona un estado"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).duration(400)}>
          <Text className={`font-semibold mb-2 mt-2 ${darkMode ? "text-white" : "text-primary"}`}>Categoría</Text>
          <ThemePicker
            selectedValue={categoria}
            onValueChange={(itemValue) => setCategoria(itemValue)}
            items={[
              { label: 'Selecciona una categoría', value: '' },
              ...categoriasDisponibles.map((cat) => ({ label: cat.nombre, value: cat.id })),
            ]}
            placeholder="Selecciona una categoría"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text className={`font-semibold mb-2 mt-2 ${darkMode ? "text-white" : "text-primary"}`}>Teléfono</Text>
          <View className="flex-row items-center gap-2 mb-4">
            <View
              className={`flex-row items-center ${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4`}
              style={[{ height: 48 }]}
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
                <Text className={`${darkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontSize: 16, marginRight: 5 }}>+{country.callingCode[0]}</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <TextInput
                placeholder="Número de teléfono"
                value={telefono}
                onChangeText={(text) => {
                  const cleaned = text.replace(/[^0-9]/g, '');
                  if (cleaned.length <= 10) setTelefono(cleaned);
                }}
                keyboardType="phone-pad"
                placeholderTextColor="#9CA3AF"
                className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
                style={[{ height: 48 }]}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(550).duration(400)}>
          <TouchableOpacity
            onPress={handleGuardar}
            className="bg-secondary py-3.5 px-6 rounded-2xl mt-6 mb-4"
            style={{ shadowColor: '#65A30D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          >
            <Text className="text-white text-center font-bold text-lg">
              {restauranteId ? 'Guardar Cambios' : 'Registrar Restaurante'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(comercio)/perfil')} className="mb-8 py-2">
            <Text className="text-primary text-center font-semibold">
              Cancelar
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
}
