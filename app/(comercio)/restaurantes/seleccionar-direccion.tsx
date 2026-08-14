import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MapView, Marker } from "@/components/maps";
import type { Region } from "@/components/maps";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from '@/store/theme.store';
import axios from "axios";

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default function MapaScreen() {
  const { darkMode } = useThemeStore();
  const [region, setRegion] = useState<Region>({
    latitude: 10.4806,
    longitude: -66.9036,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [marker, setMarker] = useState({
    latitude: 10.4806,
    longitude: -66.9036,
  });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
      setMarker({ latitude, longitude });
    })();
  }, []);

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
    setMarker({ latitude: lat, longitude: lon });
    setRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.02, longitudeDelta: 0.02 });
    setSearch(item.display_name.split(",")[0]);
    setShowResults(false);
    Keyboard.dismiss();
  };

  const confirmar = () => {
    router.replace({
      pathname: "/(comercio)/restaurantes/registrar-restaurantes",
      params: { latitud: marker.latitude.toString(), longitud: marker.longitude.toString() },
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={(r: any) => setRegion(r)}
        onPress={(e: any) => setMarker(e.nativeEvent.coordinate)}
      >
        <Marker
          coordinate={marker}
          draggable
          pinColor="#B8860B"
          onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
          title="Ubicación del restaurante"
        />
      </MapView>

      <LinearGradient colors={['rgba(37,99,235,0.08)', 'transparent']} className="absolute top-0 left-0 right-0" style={{ height: 140 }}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(comercio)/restaurantes/registrar-restaurantes")}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(37,99,235,0.1)' }}
          >
            <Ionicons name="chevron-back" size={22} color={darkMode ? '#F9FAFB' : '#2563EB'} />
          </TouchableOpacity>
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
      </LinearGradient>

      <TouchableOpacity
        style={[styles.currentLocationBtn, { backgroundColor: darkMode ? '#1F2937' : 'white' }]}
        disabled={locating}
        onPress={async () => {
          setLocating(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;
            setMarker({ latitude, longitude });
            setRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          }
          setLocating(false);
        }}>
        {locating ? (
          <ActivityIndicator size="small" color="#2563EB" />
        ) : (
          <Ionicons name="locate" size={20} color="#2563EB" />
        )}
        <Text style={[styles.currentLocationText, { color: '#2563EB' }]}>{locating ? "Obteniendo ubicación..." : "Ubicación actual"}</Text>
      </TouchableOpacity>

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
        <View className="rounded-2xl px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <Text className="text-white text-xs font-mono">
            {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-primary py-3.5 px-6 rounded-2xl w-full items-center"
          style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 }}
          onPress={confirmar}>
          <Text className="text-white font-bold">Confirmar ubicación</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchContainer: {
    flex: 1,
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
    alignItems: "center",
    gap: 8,
  },
  currentLocationBtn: {
    position: "absolute",
    right: 15,
    top: 115,
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  currentLocationText: {
    fontSize: 14,
    fontWeight: "600",
  },
});