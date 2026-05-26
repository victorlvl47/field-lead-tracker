// src/app/leads/index.tsx
import { Link } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

const mockLeads = [
  {
    id: "1",
    name: "Juan Pérez",
    company: "Ferretería El Martillo",
    status: "New",
  },
  {
    id: "2",
    name: "María López",
    company: "Distribuidora Central",
    status: "Contacted",
  },
];

export default function LeadsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leads</Text>

        <Link href="/leads/new" asChild>
          <Pressable style={styles.addButton}>
            <Text style={styles.addButtonText}>+ New</Text>
          </Pressable>
        </Link>
      </View>

      <FlatList
        data={mockLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={`/leads/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <Text style={styles.leadName}>{item.name}</Text>
              <Text style={styles.company}>{item.company}</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
  list: {
    gap: 12,
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
  },
});