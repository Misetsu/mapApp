// layout.js
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen name="login_Form" />
      <Stack.Screen name="signup_Form" />
    </Stack>
  );
}
