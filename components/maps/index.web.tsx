import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
  useMap,
  useMapEvents,
} from "react-leaflet";

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapPressEvent {
  nativeEvent: {
    coordinate: { latitude: number; longitude: number };
  };
}

function RegionController({ region, onRegionChangeComplete }: { region?: Region; onRegionChangeComplete?: (r: Region) => void }) {
  const map = useMap();

  useEffect(() => {
    if (region) {
      map.setView([region.latitude, region.longitude], Math.round(Math.log2(360 / region.latitudeDelta)));
    }
  }, [region, map]);

  useEffect(() => {
    if (!onRegionChangeComplete) return;
    const handler = () => {
      const c = map.getCenter();
      const b = map.getBounds();
      onRegionChangeComplete({
        latitude: c.lat,
        longitude: c.lng,
        latitudeDelta: b.getNorth() - b.getSouth(),
        longitudeDelta: b.getEast() - b.getWest(),
      });
    };
    map.on("moveend", handler);
    return () => { map.off("moveend", handler); };
  }, [map, onRegionChangeComplete]);

  return null;
}

function PressHandler({ onPress }: { onPress?: (e: MapPressEvent) => void }) {
  useMapEvents({
    click(e) {
      onPress?.({
        nativeEvent: { coordinate: { latitude: e.latlng.lat, longitude: e.latlng.lng } },
      });
    },
  });
  return null;
}

export interface MapViewProps {
  style?: any;
  initialRegion?: Region;
  region?: Region;
  onPress?: (e: MapPressEvent) => void;
  onRegionChangeComplete?: (r: Region) => void;
  children?: React.ReactNode;
}

export const MapView = forwardRef<any, MapViewProps>((props, ref) => {
  const { style, initialRegion, region, onPress, onRegionChangeComplete, children } = props;
  const center: [number, number] = [
    (region || initialRegion)?.latitude ?? 10.48,
    (region || initialRegion)?.longitude ?? -66.9,
  ];
  const zoom = initialRegion
    ? Math.round(Math.log2(360 / (initialRegion.latitudeDelta || 0.1)))
    : 13;

  useImperativeHandle(ref, () => ({}), []);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={style ?? { width: "100%", height: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RegionController region={region} onRegionChangeComplete={onRegionChangeComplete} />
      <PressHandler onPress={onPress} />
      {children}
    </MapContainer>
  );
});

export interface MarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  pinColor?: string;
  draggable?: boolean;
  onDragEnd?: (e: MapPressEvent) => void;
}

export class Marker extends React.Component<MarkerProps> {
  render() {
    const { coordinate, title, draggable, onDragEnd } = this.props;
    return (
      <LeafletMarker
        position={[coordinate.latitude, coordinate.longitude]}
        draggable={draggable}
        eventHandlers={{
          dragend: onDragEnd
            ? (e) => {
                const latlng = e.target.getLatLng();
                onDragEnd({
                  nativeEvent: {
                    coordinate: { latitude: latlng.lat, longitude: latlng.lng },
                  },
                });
              }
            : undefined,
        }}
      >
        {title && <LeafletPopup>{title}</LeafletPopup>}
      </LeafletMarker>
    );
  }
}

const LeafletPopup = ({ children }: { children: React.ReactNode }) => {
  const { Popup } = require("react-leaflet") as typeof import("react-leaflet");
  return <Popup>{children}</Popup>;
};

export interface PolylineProps {
  coordinates: { latitude: number; longitude: number }[];
  strokeColor?: string;
  strokeWidth?: number;
}

export class Polyline extends React.Component<PolylineProps> {
  render() {
    const { coordinates, strokeColor, strokeWidth } = this.props;
    const positions: [number, number][] = coordinates.map((c) => [c.latitude, c.longitude]);
    return (
      <LeafletPolyline
        positions={positions}
        color={strokeColor ?? "#007bff"}
        weight={strokeWidth ?? 4}
      />
    );
  }
}
