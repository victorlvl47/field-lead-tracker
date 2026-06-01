import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerTitleAlign: "center",
        }}
      >
        {/* your Stack.Screen items here */}
      </Stack>

      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}