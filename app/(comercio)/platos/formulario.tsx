import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { API_URL, images, mediaUrl } from '@/constants';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import ThemePicker from '@/components/ThemePicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Header from '@/components/ui/Header';

export default function FormularioPlato() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const rawId = useLocalSearchParams().id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const user = useAuthStore((state) => state.user);
    const token = user?.token;
    const { darkMode } = useThemeStore();

    const [nombre, setNombre] = useState('');
    const [desc, setDesc] = useState('');
    const [precio, setPrecio] = useState('');
    const [precioDescuento, setPrecioDescuento] = useState('');
    const [disponible, setDisponible] = useState<boolean | null>(true);
    const [imagen, setImagen] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchPlato = async () => {
                if (id) {
                    try {
                        const response = await axios.get(`${API_URL}/api/restaurantes/platos/${id}/`, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        const { nombre, descripcion, precio, disponible, imagen_url, precio_descuento } = response.data;
                        setNombre(nombre);
                        setDesc(descripcion);
                        setPrecio(precio.toString());
                        setDisponible(disponible ?? true);
                        setPrecioDescuento(precio_descuento || '');

                        if (imagen_url) {
                            if (imagen_url.startsWith('http')) {
                                setImagen(imagen_url);
                            } else {
                                setImagen(mediaUrl(imagen_url));
                            }
                        }
                    } catch (error) {
                        console.error('Error al cargar plato:', error);
                    }
                } else {
                    setNombre('');
                    setDesc('');
                    setPrecio('');
                    setDisponible(null);
                    setImagen(null);
                    setPrecioDescuento('')
                }
            };

            fetchPlato();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [id])
    );

    const seleccionarImagen = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 1,
            });

            if (!result.canceled) {
                setImagen(result.assets[0].uri);
            }
        } catch {
            Alert.alert("Error", "No se pudo acceder a la galería");
        }
    };

        const handleSubmit = async () => {
        setLoading(true);
        if (!token) {
            Alert.alert('Error de autenticación', 'No hay token de acceso. Inicia sesión nuevamente.');
            setLoading(false);
            return;
        }

        const formDataHeaders: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        };
        const jsonHeaders: Record<string, string> = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        };

        const payload: Record<string, any> = {
            nombre,
            descripcion: desc,
            precio: parseFloat(precio) || 0,
            disponible: !!disponible,
        };
        if (precioDescuento) payload.precio_descuento = parseFloat(precioDescuento) || 0;

        if (imagen && !imagen.startsWith('http')) {
            try {
                const filename = imagen.split('/').pop() || 'imagen.jpg';
                const ext = filename.split('.').pop()?.toLowerCase() || 'jpeg';
                const mimeMap: Record<string, string> = { jpg: 'jpeg', jpeg: 'jpeg', png: 'png', gif: 'gif', webp: 'webp' };
                const type = `image/${mimeMap[ext] || 'jpeg'}`;
                const formData = new FormData();
                formData.append('imagen', { uri: imagen, name: filename, type } as any);
                formData.append('nombre', nombre);
                formData.append('descripcion', desc);
                formData.append('precio', String(parseFloat(precio) || 0));
                formData.append('disponible', String(!!disponible));
                if (precioDescuento) formData.append('precio_descuento', String(parseFloat(precioDescuento) || 0));

                const url = id
                    ? `${API_URL}/api/restaurantes/platos/${id}/`
                    : `${API_URL}/api/restaurantes/platos/`;
                const method = id ? axios.patch : axios.post;
                await method(url, formData, { headers: formDataHeaders, timeout: 60000 });
                setLoading(false);
                router.replace('/(comercio)/platos');
                return;
            } catch (uploadErr: any) {
                const detail = uploadErr.response?.data?.detail
                    || (typeof uploadErr.response?.data === 'object' ? JSON.stringify(uploadErr.response.data) : uploadErr.response?.data)
                    || uploadErr.message
                    || 'Error desconocido';
                Alert.alert('Error al guardar plato', typeof detail === 'string' ? detail : JSON.stringify(detail));
                setLoading(false);
                return;
            }
        }

        try {
            const url = id
                ? `${API_URL}/api/restaurantes/platos/${id}/`
                : `${API_URL}/api/restaurantes/platos/`;
            const method = id ? axios.patch : axios.post;
            await method(url, payload, { headers: jsonHeaders, timeout: 60000 });
            setLoading(false);
            router.replace('/(comercio)/platos');
        } catch (error: any) {
            const detail = error.response?.data?.detail
                || (typeof error.response?.data === 'object' ? JSON.stringify(error.response.data) : error.response?.data)
                || error.message
                || 'Error desconocido';
            console.log('Error full:', error.response || error.message);
            Alert.alert('Error al guardar plato', typeof detail === 'string' ? detail : JSON.stringify(detail));
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <Modal
                visible={loading}
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
                            Guardando plato...
                        </Text>
                    </View>
                </View>
            </Modal>

            <Header className='mb-4' title={id ? "Editar Plato" : "Crear Plato"} showBack backHref="/(comercio)/platos" />

            <ScrollView
                className="flex-1 px-6"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom }}
            >
                <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                    <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Nombre del plato</Text>
                    <TextInput
                        className={`${darkMode ? "bg-gray-800 border-gray-300" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}
                        value={nombre}
                        onChangeText={setNombre}
                        placeholder="Ej. Pizza Hawaiana"
                        placeholderTextColor="#9CA3AF"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                    <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Descripción</Text>
                    <TextInput
                        className={`${darkMode ? "bg-gray-800 border-gray-300" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-5 h-28 ${darkMode ? "text-white" : "text-gray-900"}`}
                        value={desc}
                        onChangeText={setDesc}
                        multiline
                        placeholder="Describe el plato..."
                        placeholderTextColor="#9CA3AF"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).duration(400)}>
                    <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Precio</Text>
                    <TextInput
                        className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}
                        value={precio}
                        onChangeText={setPrecio}
                        placeholder="10.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(250).duration(400)}>
                    <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Descuento</Text>
                    <TextInput
                        className={`${darkMode ? "bg-gray-800" : "bg-white border border-gray-300"} rounded-2xl px-4 py-3.5 mb-5 ${darkMode ? "text-white" : "text-gray-900"}`}
                        value={precioDescuento}
                        onChangeText={setPrecioDescuento}
                        placeholder="0.00"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).duration(400)}>
                    <Text className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-primary"}`}>Estado</Text>
                    <ThemePicker
                        selectedValue={disponible === null ? '' : disponible ? 'true' : 'false'}
                        onValueChange={(value) => setDisponible(value === '' ? null : value === 'true')}
                        items={[
                            { label: 'Selecciona un estado', value: '' },
                            { label: 'Disponible', value: 'true' },
                            { label: 'No disponible', value: 'false' },
                        ]}
                        placeholder="Selecciona un estado"
                        containerStyle="mb-6"
                    />
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(350).duration(400)} className="mb-8">
                    {imagen ? (
                        <View className="relative">
                            <Image
                                source={{ uri: imagen }}
                                className="w-full h-48 rounded-2xl"
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                onPress={seleccionarImagen}
                                className="absolute bottom-3 self-center bg-white/90 px-6 py-2 rounded-2xl flex-row items-center"
                                activeOpacity={0.8}
                            >
                                <Ionicons name="camera" size={16} color="#2563EB" />
                                <Text className="text-primary font-semibold ml-2">Cambiar</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={seleccionarImagen}
                            className="bg-secondary/90 py-3.5 rounded-2xl items-center"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="image-outline" size={20} color="white" />
                            <Text className="text-center text-white font-semibold mt-1">
                                Seleccionar imagen
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).duration(400)}>
                    <TouchableOpacity
                        className="bg-primary py-3.5 px-6 rounded-2xl"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                        activeOpacity={0.85}
                        onPress={handleSubmit}
                    >
                        <Text className="text-white text-center font-bold text-lg">
                            {id ? "Guardar Cambios" : "Guardar Plato"}
                        </Text>
                    </TouchableOpacity>

                    {id && (
                        <TouchableOpacity
                            className="bg-secondary py-3.5 px-6 rounded-2xl mt-4"
                            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                            activeOpacity={0.85}
                            onPress={() => router.push({pathname:'/platos/formulario-opciones', params:{ id: id} } )}
                        >
                            <Text className="text-white text-center font-bold text-lg">
                               Extras
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </ScrollView>
        </ScreenWrapper>
    );
}
