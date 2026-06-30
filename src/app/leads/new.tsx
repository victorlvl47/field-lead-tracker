import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

import { createLocalLead } from "@/db/leadLocalService";
import { LeadForm } from "@/features/leads/LeadForm";
import { localLeadKeys } from "@/features/leads/leadLocalQueries";
import { useCreateLeadMutation } from "@/features/leads/leadQueries";
import type { LeadFormValues } from "@/features/leads/leadTypes";
import { supabase } from "@/lib/supabase";

export default function NewLeadScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createLeadMutation = useCreateLeadMutation();

  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [localErrorMessage, setLocalErrorMessage] = useState<string | null>(
    null,
  );

  const isSubmitting =
    Platform.OS === "web"
      ? createLeadMutation.isPending
      : isSubmittingLocal;

  const errorMessage =
    Platform.OS === "web"
      ? createLeadMutation.error instanceof Error
        ? createLeadMutation.error.message
        : createLeadMutation.isError
          ? "Failed to create lead."
          : null
      : localErrorMessage;

  async function handleSubmit(values: LeadFormValues) {
    if (Platform.OS === "web") {
      await createLeadMutation.mutateAsync(values);
      router.replace("/leads");
      return;
    }

    try {
      setIsSubmittingLocal(true);
      setLocalErrorMessage(null);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      const userId = data.session?.user.id;

      if (!userId) {
        throw new Error("You must be signed in to create a lead.");
      }

      await createLocalLead({
        user_id: userId,

        name: values.name,
        company: values.company || null,
        phone: values.phone || null,
        email: values.email || null,
        status: values.status,
        notes: values.notes || null,

        sync_status: "pending_create",
        last_synced_at: null,
      });

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });

      router.replace("/leads");
    } catch (error) {
      setLocalErrorMessage(
        error instanceof Error ? error.message : "Failed to create lead.",
      );
    } finally {
      setIsSubmittingLocal(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Lead</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <LeadForm
        submitLabel="Save Lead"
        isSubmitting={isSubmitting}
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