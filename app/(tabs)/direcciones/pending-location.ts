import { usePendingLocationStore } from "@/store/pending-location.store";
export { usePendingLocationStore };

export const setPendingLocation = (lat: number, lng: number) =>
  usePendingLocationStore.getState().setPendingLocation(lat, lng);

export const consumePendingLocation = () =>
  usePendingLocationStore.getState().consumePendingLocation();
