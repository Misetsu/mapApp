// layout.js
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="sign_up" />
    </Stack>
  );
}
