import { Stack } from "expo-router";

export default function DireccionesLayout() {
  return (
    <Stack
      initialRouteName="direccion"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
      }}
    />
  );
}
