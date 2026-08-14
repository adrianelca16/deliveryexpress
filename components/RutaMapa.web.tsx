import { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
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
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [osrmFailed, setOsrmFailed] = useState(false);

  const validRestaurante = hasValidCoords(restaurante) && isValidRegion(restaurante.latitude, restaurante.longitude)
    ? restaurante : undefined;
  const validDestino = hasValidCoords(destino) && isValidRegion(destino.latitude, destino.longitude)
    ? destino : undefined;

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
          const routeCoords: [number, number][] = res.data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
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
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!osrmFailed && coords.length > 0 && validRestaurante && validDestino && (
          <Polyline positions={coords} color="#007bff" weight={4} />
        )}
        {validRestaurante && (
          <Marker position={[validRestaurante.latitude, validRestaurante.longitude]}>
            <Popup>Restaurante</Popup>
          </Marker>
        )}
        {validDestino && (
          <Marker position={[validDestino.latitude, validDestino.longitude]}>
            <Popup>Cliente</Popup>
          </Marker>
        )}
        {delivery && hasValidCoords(delivery) && isValidRegion(delivery.latitude, delivery.longitude) && (
          <Marker position={[delivery.latitude, delivery.longitude]}>
            <Popup>Delivery</Popup>
          </Marker>
        )}
      </MapContainer>
    </View>
  );
};

export default RutaMapa;
