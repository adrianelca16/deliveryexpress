import { useEffect, useState, useRef } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { MapView, Marker, Polyline } from "@/components/maps";
import axios from "axios";
import { OSRM_API_URL } from "@/constants";

interface Coord {
  latitude: number;
  longitude: number;
}

interface RutaMapaProps {
  restaurante: Coord;    
  destino: Coord;      
  delivery?: Coord;    
}

const isValidRegion = (lat: number, lng: number) =>
  lat > -10 && lat < 15 && lng > -80 && lng < -55;

const hasValidCoords = (c: Coord | undefined): c is Coord =>
  c !== undefined && typeof c.latitude === "number" && typeof c.longitude === "number" &&
  !isNaN(c.latitude) && !isNaN(c.longitude);

const RutaMapa = ({ restaurante, destino, delivery }: RutaMapaProps) => {
  const [coords, setCoords] = useState<Coord[]>([]);
  const [loading, setLoading] = useState(true);
  const [osrmFailed, setOsrmFailed] = useState(false);
  const mapRef = useRef<MapView>(null);

  // Validar coordenadas
  const validRestaurante = hasValidCoords(restaurante) && isValidRegion(restaurante.latitude, restaurante.longitude)
    ? restaurante : undefined;
  const validDestino = hasValidCoords(destino) && isValidRegion(destino.latitude, destino.longitude)
    ? destino : undefined;

  // Fallback sin mapa
  if (!validRestaurante && !validDestino) {
    return (
      <View style={{ height: 400, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <Text style={{ color: "#666", fontSize: 16, paddingHorizontal: 20, textAlign: "center" }}>
          Ubicación no disponible
        </Text>
      </View>
    );
  }

  const centerLat = validRestaurante && validDestino 
    ? (validRestaurante.latitude + validDestino.latitude) / 2 
    : 10.48;
  const centerLng = validRestaurante && validDestino 
    ? (validRestaurante.longitude + validDestino.longitude) / 2 
    : -66.9;

  useEffect(() => {
    const fetchRuta = async () => {
      if (!validRestaurante || !validDestino) return;
      
      try {
        const url = `${OSRM_API_URL}/route/v1/driving/${validRestaurante.longitude},${validRestaurante.latitude};${validDestino.longitude},${validDestino.latitude}?overview=full&geometries=geojson`;
        const res = await axios.get(url, { timeout: 8000 });

        if (res.data?.routes?.[0]?.geometry?.coordinates) {
          const routeCoords: Coord[] = res.data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => ({ latitude: c[1], longitude: c[0] })
          );
          setCoords(routeCoords);
        }
      } catch (e) {
        console.log("OSRM error:", e);
        setOsrmFailed(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRuta();
  }, [validRestaurante, validDestino]);

  if (loading) {
    return (
      <View style={{ height: 400, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ height: 400, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {!osrmFailed && coords.length > 0 && validRestaurante && validDestino && (
          <Polyline coordinates={coords} strokeColor="#007bff" strokeWidth={4} />
        )}
        {validRestaurante && <Marker coordinate={validRestaurante} title="Restaurante" />}
        {validDestino && <Marker coordinate={validDestino} title="Cliente" />}
        {delivery && hasValidCoords(delivery) && isValidRegion(delivery.latitude, delivery.longitude) && (
          <Marker coordinate={delivery} title="Delivery" pinColor="#FF9800" />
        )}
      </MapView>
    </View>
  );
};

export default RutaMapa;