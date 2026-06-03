import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { LeadForm } from "@/features/leads/LeadForm";
import { useCreateLeadMutation } from "@/features/leads/leadQueries";
import type { LeadFormValues } from "@/features/leads/leadTypes";

export default function NewLeadScreen() {
  const router = useRouter();
  const createLeadMutation = useCreateLeadMutation();

  async function handleSubmit(values: LeadFormValues) {
    await createLeadMutation.mutateAsync(values);
    router.replace("/leads");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Lead</Text>

      {createLeadMutation.isError ? (
        <Text style={styles.errorText}>
          {createLeadMutation.error instanceof Error
            ? createLeadMutation.error.message
            : "Failed to create lead."}
        </Text>
      ) : null}

      <LeadForm
        submitLabel="Save Lead"
        isSubmitting={createLeadMutation.isPending}
        onSubmit={handleSubmit}
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 12,
  },
});