import { create } from 'zustand';
import { Orden } from '@/type';

interface DeliveryState {
  disponible: boolean;
  calificacion: number;
  ordenActual: Orden | null;
  ordenesAsignadas: Orden[];
  tiempoLimite: number;

  setDisponible: (d: boolean) => void;
  setCalificacion: (c: number) => void;
  setOrdenActual: (o: Orden | null) => void;
  setOrdenesAsignadas: (o: Orden[]) => void;
  setTiempoLimite: (t: number) => void;
  agregarOrdenAsignada: (o: Orden) => void;
  removerOrdenAsignada: (id: string) => void;
  reset: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  disponible: false,
  calificacion: 0,
  ordenActual: null,
  ordenesAsignadas: [],
  tiempoLimite: 30,

  setDisponible: (disponible) => set({ disponible }),
  setCalificacion: (calificacion) => set({ calificacion }),
  setOrdenActual: (ordenActual) => set({ ordenActual }),
  setOrdenesAsignadas: (ordenesAsignadas) => set({ ordenesAsignadas }),
  setTiempoLimite: (tiempoLimite) => set({ tiempoLimite }),
  agregarOrdenAsignada: (orden) =>
    set((state) => ({ ordenesAsignadas: [...state.ordenesAsignadas, orden] })),
  removerOrdenAsignada: (id) =>
    set((state) => ({
      ordenesAsignadas: state.ordenesAsignadas.filter((o) => o.id !== id),
    })),
  reset: () =>
    set({
      disponible: false,
      calificacion: 0,
      ordenActual: null,
      ordenesAsignadas: [],
      tiempoLimite: 30,
    }),
}));
