import { images, API_URL, mediaUrl } from '@/constants';
import { router, useFocusEffect } from 'expo-router';
import { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Plato } from '@/type';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';

const filtros = ['Todos', 'Disponibles', 'Agotados'];

export default function Platos() {
  const { darkMode } = useThemeStore();
  const insets = useSafeAreaInsets();
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const getPlatos = async () => {
    const token = useAuthStore.getState().user?.token;
    try {
      const response = await axios.get(`${API_URL}/api/restaurantes/platos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlatos(response.data as Plato[]);
    } catch (err) {
      console.error('Error al obtener platos:', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getPlatos();
    }, [])
  );

  const filteredPlatos = useMemo(() => {
    return platos?.filter((plato) => {
      let matchesFilter = true;

      if (selectedFilter === 'Disponibles') {
        matchesFilter = plato.disponible === true;
      } else if (selectedFilter === 'Agotados') {
        matchesFilter = plato.disponible === false;
      } else if (selectedFilter === 'Todos') {
        matchesFilter = true;
      }

      const matchesSearch = plato.nombre.toLowerCase().includes(searchText.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [searchText, selectedFilter, platos]);

  const handleAddPlato = () => {
    router.push('/platos/formulario');
  };

  return (
    <ScreenWrapper>
      <Header
        title="Platos"
        showBack
        backHref="/(comercio)"
        className='mb-3'
      />

      <View className="px-5 mb-4">
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mx-1">
          <View className={`flex-row items-center rounded-lg px-4 py-1 ${darkMode ? "bg-gray-800" : "bg-white border border-purple-100/50"}`}
            style={darkMode ? {} : { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
          >
            <TextInput
              placeholder="Buscar platos..."
              value={searchText}
              onChangeText={setSearchText}
              className={`flex-1 text-base ${darkMode ? "text-gray-100" : "text-gray-800"} font-semibold`}
              placeholderTextColor="#70747a"
            />
            <Image source={images.search} className="w-5 h-5 mr-2" resizeMode="contain" tintColor={darkMode ? '#9CA3AF' : '#2563EB'} />
          </View>
        </Animated.View>
      </View>

      <FlatList
        data={filteredPlatos}
        keyExtractor={(item, index) => item.id ? String(item.id) : `plato-${index}`}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        ListHeaderComponent={() => (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <View className="flex-row mb-4 align-center justify-center px-5">
              {filtros.map((filtro) => (
                <TouchableOpacity
                  key={filtro}
                  onPress={() => setSelectedFilter(filtro)}
                  className={`mr-2 px-5 py-2 rounded-2xl border ${selectedFilter === filtro ? 'bg-primary border-primary' : darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                  style={selectedFilter === filtro ? { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 } : {}}
                >
                  <Text className={`font-semibold ${selectedFilter === filtro ? 'text-white' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                    {filtro}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text className='mb-4 font-bold text-xl text-secondary px-5'>Platos</Text>
          </Animated.View>
        )}
        ListFooterComponent={null}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(200 + index * 60).duration(400)}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/platos/formulario",
                  params: { id: item.id },
                })
              }
              activeOpacity={0.9}
            >
              <Card className="flex-row mb-4 mx-5" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8 }}>
                <Image
                  source={{ uri: mediaUrl(item.imagen_url) }}
                  className="h-28 w-28 rounded-2xl"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4 justify-between">
                  <View>
                    <Text className={`font-bold ${darkMode ? "text-gray-100" : "text-gray-900"}`} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`} numberOfLines={2}>
                      {item.descripcion}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1">
                      {Number(item.precio_descuento) > 0 && Number(item.precio_descuento) < Number(item.precio) ? (
                        <>
                          <Text className="font-bold text-secondary text-base">
                            ${Number(item.precio_descuento).toFixed(2)}
                          </Text>
                          <Text className="text-gray-400 text-xs line-through">
                            ${Number(item.precio).toFixed(2)}
                          </Text>
                        </>
                      ) : (
                        <Text className="font-bold text-secondary text-base">
                          ${Number(item.precio).toFixed(2)}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      className="bg-primary py-1.5 px-5 rounded-2xl"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 }}
                      onPress={() =>
                        router.push({
                          pathname: "/platos/formulario",
                          params: { id: item.id },
                        })
                      }>
                      <Text className='text-center text-white font-semibold text-sm'>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={() => (
          <Animated.View entering={FadeInDown.delay(300).duration(400)} className="px-5">
            <Card>
              <Text className="text-center text-gray-400">No se encontraron platos</Text>
            </Card>
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
      />

        <TouchableOpacity
          onPress={handleAddPlato}
          activeOpacity={0.8}
          className="absolute rounded-full items-center justify-center"
          style={{
            bottom: insets.bottom,
            right: 16,
            width: 56,
            height: 56,
            backgroundColor: '#B8860B',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <Image
            source={images.plus}
            className="w-6 h-6"
            style={{ tintColor: 'white' }}
            resizeMode="contain"
          />
        </TouchableOpacity>
     </ScreenWrapper>
  );
}