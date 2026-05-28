import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";


import { supabase } from "@/lib/supabase";


export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/leads");
      } else {
        router.replace("/login");
      }
    }

    checkSession();
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Checking session...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  text: {
    color: "#52525b",
    fontSize: 16,
  },
});