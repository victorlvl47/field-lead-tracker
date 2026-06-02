import { Link, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLeadsQuery } from "@/features/leads/leadQueries";
import { supabase } from "@/lib/supabase";

export default function LeadsScreen() {
  const router = useRouter();
  const { data: leads = [], isLoading, isError, error, refetch } = useLeadsQuery();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Loading leads...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Failed to load leads."}
        </Text>

        <Pressable style={styles.secondaryButton} onPress={() => refetch()}>
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>

        <View style={styles.headerActions}>
          <Link href="/leads/new" asChild>
            <Pressable style={styles.addButton}>
              <Text style={styles.addButtonText}>+ New</Text>
            </Pressable>
          </Link>

          <Pressable style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No leads yet</Text>
            <Text style={styles.emptyText}>
              Create your first lead to test the Supabase connection.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Link
            href={{
              pathname: "/leads/[id]",
              params: { id: item.id },
            }}
            asChild
          >
            <Pressable style={styles.card}>
              <Text style={styles.leadName}>{item.name}</Text>

              {item.company ? (
                <Text style={styles.company}>{item.company}</Text>
              ) : null}

              <Text style={styles.status}>{item.status}</Text>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  centeredContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  signOutButtonText: {
    color: "#52525b",
    fontWeight: "700",
  },
  list: {
    gap: 12,
    flexGrow: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 14,
    padding: 16,
  },
  leadName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  company: {
    color: "#52525b",
    marginBottom: 8,
  },
  status: {
    color: "#2563eb",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#52525b",
    textAlign: "center",
  },
  messageText: {
    color: "#52525b",
    fontSize: 16,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontWeight: "700",
  },
});