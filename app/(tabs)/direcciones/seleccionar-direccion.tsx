import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, TextInput, FlatList, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { MapView, Marker } from "@/components/maps";
import type { MapPressEvent, Region } from "@/components/maps";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useThemeStore } from '@/store/theme.store';
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { setPendingLocation } from "./pending-location";
import ConfirmDialog from "@/components/ConfirmDialog";

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
    irAUbicacionActual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [locating, setLocating] = useState(false);

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const irAUbicacionActual = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permiso de ubicación denegado");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newRegion);
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      mapRef.current?.animateToRegion?.(newRegion, 500);
    } catch {
      alert("No se pudo obtener tu ubicación");
    } finally {
      setLocating(false);
    }
  };

  const marcarEnCentro = () => {
    setLocation({ latitude: region.latitude, longitude: region.longitude });
  };

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
    if (!location) {
      alert("Por favor selecciona un punto en el mapa");
      return;
    }
    setPendingAction("confirm");
  };

  const handleCancel = () => {
    setPendingAction("cancel");
  };

  const [pendingAction, setPendingAction] = useState<"confirm" | "cancel" | null>(null);

  const ejecutarAccion = () => {
    if (pendingAction === "confirm" && location) {
      setPendingLocation(location.latitude, location.longitude);
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onPress={handlePress}
        onRegionChangeComplete={setRegion}
      >
        {location && (
          <Marker
            coordinate={location}
            pinColor="#B8860B"
            draggable
            onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
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

        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }]}
            onPress={marcarEnCentro}
          >
            <Ionicons name="pin" size={22} color="#B8860B" />
            <Text style={[styles.controlLabel, { color: darkMode ? '#D1D5DB' : '#374151' }]}>Marcar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, { backgroundColor: darkMode ? '#1F2937' : '#FFFFFF' }]}
            onPress={irAUbicacionActual}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <Ionicons name="locate" size={22} color="#2563EB" />
            )}
            <Text style={[styles.controlLabel, { color: darkMode ? '#D1D5DB' : '#374151' }]}>Mi ubicación</Text>
          </TouchableOpacity>
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

        <Text style={[styles.hint, { color: darkMode ? '#D1D5DB' : '#374151' }]}>
          Toca el mapa o arrastra el pin para ajustar
        </Text>

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

      <ConfirmDialog
        visible={pendingAction !== null}
        title={pendingAction === "confirm" ? "Confirmar ubicación" : "Cancelar selección"}
        message={
          pendingAction === "confirm"
            ? "¿Deseas guardar este punto como la ubicación de tu dirección?"
            : "¿Deseas cancelar la selección? Los cambios no se guardarán."
        }
        icon={pendingAction === "confirm" ? "place" : "warning"}
        confirmText={pendingAction === "confirm" ? "Confirmar" : "Sí, cancelar"}
        danger={pendingAction === "cancel"}
        onConfirm={ejecutarAccion}
        onCancel={() => setPendingAction(null)}
      />
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
  controls: {
    position: "absolute",
    right: 12,
    top: 130,
    gap: 10,
  },
  controlBtn: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  controlLabel: { fontSize: 11, fontWeight: "700", marginTop: 4 },
  hint: {
    position: "absolute",
    bottom: 96,
    left: 20,
    right: 20,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
});