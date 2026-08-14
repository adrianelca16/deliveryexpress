import { create } from "zustand";

interface PendingLocationState {
  lat: number | null;
  lng: number | null;
  setPendingLocation: (lat: number, lng: number) => void;
  consumePendingLocation: () => { lat: number; lng: number } | null;
}

export const usePendingLocationStore = create<PendingLocationState>((set, get) => ({
  lat: null,
  lng: null,
  setPendingLocation: (lat: number, lng: number) => set({ lat, lng }),
  consumePendingLocation: () => {
    const { lat, lng } = get();
    if (lat === null || lng === null) return null;
    set({ lat: null, lng: null });
    return { lat, lng };
  },
}));
