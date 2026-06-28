import { images, API_URL } from '@/constants';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { Plato } from '@/type';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Card from '@/components/ui/Card';
import Header from '@/components/ui/Header';

const filtros = ['Todos', 'Disponibles', 'Agotados'];

export default function Platos() {
  const token = useAuthStore((state) => state.user?.token);
  const { darkMode } = useThemeStore();
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Todos');

  const getPlatos = async () => {
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <ScreenWrapper gradient>
      <Header
        title="Platos"
        showBack
        backHref="/(comercio)"
        gradient
      />

      <View className="px-5 flex-1 pb-28">
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="mx-1 mb-4">
          <View className={`flex-row items-center rounded-2xl px-4 py-1 ${darkMode ? "bg-gray-800" : "bg-white border border-purple-100/50"}`}
            style={darkMode ? {} : { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
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

        <FlatList
          data={filteredPlatos}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={() => (
            <Animated.View entering={FadeInDown.delay(150).duration(400)}>
              <View className="flex-row mb-4">
                {filtros.map((filtro) => (
                  <TouchableOpacity
                    key={filtro}
                    onPress={() => setSelectedFilter(filtro)}
                    className={`mr-2 px-5 py-2 rounded-2xl border ${selectedFilter === filtro ? 'bg-primary border-primary' : darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    style={selectedFilter === filtro ? { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 } : {}}
                  >
                    <Text className={`font-semibold ${selectedFilter === filtro ? 'text-white' : (darkMode ? 'text-gray-300' : 'text-gray-700')}`}>
                      {filtro}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text className='mb-4 font-bold text-xl text-secondary'>Platos</Text>
            </Animated.View>
          )}
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
                <Card className="flex-row mb-4">
                  <Image
                    source={{ uri: `${API_URL}/media/${item.imagen_url}` }}
                    className="h-28 w-28 rounded-2xl"
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4 justify-between">
                    <View>
                      <Text className={`font-bold ${darkMode ? "text-white" : "text-gray-900"}`} numberOfLines={1}>
                        {item.nombre}
                      </Text>
                      <Text className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`} numberOfLines={2}>
                        {item.descripcion}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1">
                        {item.precio_descuento && item.precio_descuento < item.precio ? (
                          <>
                            <Text className="font-bold text-primary text-base">
                              ${item.precio_descuento}
                            </Text>
                            <Text className="text-gray-400 text-xs line-through">
                              ${item.precio}
                            </Text>
                          </>
                        ) : (
                          <Text className="font-bold text-primary text-base">
                            ${item.precio}
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        className="bg-primary py-1.5 px-5 rounded-2xl"
                        style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
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
            <Animated.View entering={FadeInDown.delay(300).duration(400)}>
              <Card>
                <Text className="text-center text-gray-400">No se encontraron platos</Text>
              </Card>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          onPress={handleAddPlato}
          className="bg-secondary py-3.5 px-6 rounded-2xl flex-row items-center justify-center mb-4 self-center"
          style={{ shadowColor: '#65A30D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }}
        >
          <Image source={images.plus} className="w-5 h-5" style={{ tintColor: 'white' }} resizeMode="contain" />
          <Text className='text-white font-semibold ml-2 text-base'>Agregar Plato</Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
