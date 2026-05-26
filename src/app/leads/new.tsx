// src/app/leads/new.tsx
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function NewLeadScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Lead</Text>

      <TextInput style={styles.input} placeholder="Lead name" />
      <TextInput style={styles.input} placeholder="Company" />
      <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" />
      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        multiline
      />

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Save Lead</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 16,
  },
});