import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";

export type CarritoItem = {
  id: string;
  nombre: string;
  precio: number;
  imagen?: string;
  cantidad: number;
  nombre_restaurante?: string;
  restauranteId?: string;
  descripcion?: string;
  precio_descuento?: number;
  extras?: Array<{ id: string; nombre: string; precio: number }>;
};

interface CarritoState {
  carrito: CarritoItem[];
  agregarAlCarrito: (plato: Omit<CarritoItem, "cantidad"> & { cantidad?: number }) => void;
  quitarDelCarrito: (platoId: string) => void;
  limpiarCarrito: () => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      carrito: [],

      agregarAlCarrito: (plato) => {
        const { carrito } = get();
        const restauranteActual = carrito[0]?.restauranteId;

        if (restauranteActual && restauranteActual !== plato.restauranteId) {
          Alert.alert(
            "Restaurante distinto",
            "Tu carrito ya tiene platos de otro restaurante. ¿Quieres reemplazarlos?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Sí, reemplazar",
                style: "destructive",
                onPress: () => {
                  set({ carrito: [{ ...plato, cantidad: plato.cantidad ?? 1 }] });
                },
              },
            ]
          );
          return;
        }

        set((state) => {
          const existe = state.carrito.find((p) => p.id === plato.id);
          if (existe) {
            return {
              carrito: state.carrito.map((p) =>
                p.id === plato.id
                  ? { ...p, cantidad: p.cantidad + (plato.cantidad ?? 1) }
                  : p
              ),
            };
          }
          return { carrito: [...state.carrito, { ...plato, cantidad: plato.cantidad ?? 1 }] };
        });
      },

      quitarDelCarrito: (platoId) => {
        set((state) => ({
          carrito: state.carrito
            .map((p) =>
              p.id === platoId ? { ...p, cantidad: p.cantidad - 1 } : p
            )
            .filter((p) => p.cantidad > 0),
        }));
      },

      limpiarCarrito: () => set({ carrito: [] }),
    }),
    {
      name: 'carrito-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export const useCarrito = () => {
  const carrito = useCarritoStore((state) => state.carrito);
  const agregarAlCarrito = useCarritoStore((state) => state.agregarAlCarrito);
  const quitarDelCarrito = useCarritoStore((state) => state.quitarDelCarrito);
  const limpiarCarrito = useCarritoStore((state) => state.limpiarCarrito);
  return { carrito, agregarAlCarrito, quitarDelCarrito, limpiarCarrito };
};
