import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { LeadForm } from "@/features/leads/LeadForm";
import {
  useLeadQuery,
  useUpdateLeadMutation,
} from "@/features/leads/leadQueries";
import type { LeadFormValues } from "@/features/leads/leadTypes";

export default function EditLeadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const leadQuery = useLeadQuery(id ?? "");
  const updateLeadMutation = useUpdateLeadMutation(id ?? "");

  async function handleSubmit(values: LeadFormValues) {
    if (!id) {
      return;
    }

    await updateLeadMutation.mutateAsync(values);
    router.replace("/leads");
  }

  if (!id) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Missing lead ID.</Text>
      </View>
    );
  }

  if (leadQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Loading lead...</Text>
      </View>
    );
  }

  if (leadQuery.isError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {leadQuery.error instanceof Error
            ? leadQuery.error.message
            : "Failed to load lead."}
        </Text>

        <Pressable style={styles.secondaryButton} onPress={() => leadQuery.refetch()}>
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!leadQuery.data) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Lead not found.</Text>
      </View>
    );
  }

  const initialValues: LeadFormValues = {
    name: leadQuery.data.name,
    company: leadQuery.data.company ?? "",
    phone: leadQuery.data.phone ?? "",
    email: leadQuery.data.email ?? "",
    status: leadQuery.data.status,
    notes: leadQuery.data.notes ?? "",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Lead</Text>

      {updateLeadMutation.isError ? (
        <Text style={styles.errorText}>
          {updateLeadMutation.error instanceof Error
            ? updateLeadMutation.error.message
            : "Failed to update lead."}
        </Text>
      ) : null}

      <LeadForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        isSubmitting={updateLeadMutation.isPending}
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
  centeredContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  messageText: {
    color: "#52525b",
    fontSize: 16,
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 12,
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