import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Field Lead Tracker",
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            title: "Login",
          }}
        />

        <Stack.Screen
          name="leads/index"
          options={{
            title: "Leads",
          }}
        />

        <Stack.Screen
          name="leads/new"
          options={{
            title: "New Lead",
          }}
        />

        <Stack.Screen
          name="leads/[id]"
          options={{
            title: "Edit Lead",
          }}
        />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}