import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import MapView, { Marker, MapPressEvent, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function SeleccionarDireccion() {
  const router = useRouter();
  const { darkMode } = useThemeStore();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 10.476,
    longitude: -66.599,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const newRegion = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(newRegion);
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        mapRef.current?.animateToRegion(newRegion);
      }
    })();
  }, []);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const buscarLugar = async (text: string) => {
    setSearch(text);
    if (text.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=ve`
      );
      setResults(res.data);
      setShowResults(true);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const seleccionarResultado = (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setLocation({ latitude: lat, longitude: lon });
    setRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    setSearch(item.display_name.split(",")[0]);
    setShowResults(false);
  };

  const handlePress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLocation({ latitude, longitude });
  };

  const handleConfirm = () => {
    if (location) {
      router.push({
        pathname: "/perfil/formulario-direccion",
        params: { latitud: location.latitude, longitud: location.longitude },
      });
    } else {
      alert("Por favor selecciona un punto en el mapa");
    }
  };

  const handleCancel = () => {
    router.push('/(tabs)/perfil/formulario-direccion');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handlePress}
      >
        {location && (
          <Marker 
            coordinate={location} 
            pinColor="#B8860B"
          />
        )}
      </MapView>

      {/* Header with search bar */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.header}>
          <View style={styles.searchContainer} className={`${darkMode ? "bg-gray-800" : "bg-white"} rounded-2xl`}>
            <Ionicons name="search" size={20} color={darkMode ? "#9CA3AF" : "#2563EB"} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.searchInput, { color: darkMode ? '#F9FAFB' : '#333' }]}
              placeholder="Buscar dirección..."
              value={search}
              onChangeText={buscarLugar}
              placeholderTextColor={darkMode ? "#6B7280" : "#999"}
            />
            {searching && <ActivityIndicator size="small" color="#2563EB" />}
          </View>
        </View>

        {showResults && results.length > 0 && (
          <View style={[styles.resultsContainer, { backgroundColor: darkMode ? '#1F2937' : 'white' }]}>
            <FlatList
              data={results}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={[styles.resultItem, { borderBottomColor: darkMode ? '#374151' : '#f0f0f0' }]} onPress={() => seleccionarResultado(item)}>
                  <Ionicons name="location-outline" size={20} color="#2563EB" />
                  <Text style={[styles.resultText, { color: darkMode ? '#D1D5DB' : '#333' }]} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        <View style={styles.footer}>
          <TouchableOpacity
            className="rounded-xl py-3 px-6 flex-1 mr-2"
            onPress={handleCancel}
            style={{ backgroundColor: darkMode ? '#374151' : '#9CA3AF' }}
          >
            <Text className="text-white text-center font-bold">Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="rounded-xl py-3 px-6 flex-1 ml-2"
            onPress={handleConfirm}
            style={{ backgroundColor: location ? '#2563EB' : '#9CA3AF' }}
          >
            <Text className="text-white text-center font-bold">Confirmar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: Dimensions.get("window").width, height: Dimensions.get("window").height },
  header: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 16 },
  resultsContainer: {
    position: "absolute",
    top: 110,
    left: 10,
    right: 10,
    borderRadius: 16,
    maxHeight: 220,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 8,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 10,
  },
  resultText: { flex: 1, fontSize: 14 },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
});