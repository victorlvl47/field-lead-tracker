import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { initDatabase } from "@/db/database";
import { queryClient } from "@/lib/queryClient";

export default function RootLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);

  useEffect(() => {
    async function prepareDatabase() {
      try {
        await initDatabase();
      } catch (error) {
        console.error("Failed to initialize database", error);
      } finally {
        setIsDatabaseReady(true);
      }
    }

    prepareDatabase();
  }, []);

  if (!isDatabaseReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator />
        <StatusBar style="auto" />
      </View>
    );
  }

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