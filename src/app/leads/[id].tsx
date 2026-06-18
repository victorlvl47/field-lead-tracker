import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { updateLocalLead } from "@/db/leadLocalService";
import { LeadForm } from "@/features/leads/LeadForm";
import {
  localLeadKeys,
  useLocalLeadQuery,
} from "@/features/leads/leadLocalQueries";
import {
  useLeadQuery,
  useUpdateLeadMutation,
} from "@/features/leads/leadQueries";
import type { LeadFormValues } from "@/features/leads/leadTypes";
import { supabase } from "@/lib/supabase";

function normalizeValues(values: LeadFormValues): LeadFormValues {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    status: values.status,
    notes: values.notes.trim(),
  };
}

function areValuesEqual(a: LeadFormValues, b: LeadFormValues) {
  const normalizedA = normalizeValues(a);
  const normalizedB = normalizeValues(b);

  return (
    normalizedA.name === normalizedB.name &&
    normalizedA.company === normalizedB.company &&
    normalizedA.phone === normalizedB.phone &&
    normalizedA.email === normalizedB.email &&
    normalizedA.status === normalizedB.status &&
    normalizedA.notes === normalizedB.notes
  );
}

export default function EditLeadScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Missing lead ID.</Text>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return <WebEditLeadScreen id={id} />;
  }

  return <NativeEditLeadScreen id={id} />;
}

function WebEditLeadScreen({ id }: { id: string }) {
  const router = useRouter();

  const leadQuery = useLeadQuery(id);
  const updateLeadMutation = useUpdateLeadMutation(id);

  async function handleSubmit(values: LeadFormValues) {
    if (!leadQuery.data) {
      return;
    }

    const initialValues: LeadFormValues = {
      name: leadQuery.data.name,
      company: leadQuery.data.company ?? "",
      phone: leadQuery.data.phone ?? "",
      email: leadQuery.data.email ?? "",
      status: leadQuery.data.status,
      notes: leadQuery.data.notes ?? "",
    };

    if (areValuesEqual(initialValues, values)) {
      router.replace("/leads");
      return;
    }

    await updateLeadMutation.mutateAsync(values);
    router.replace("/leads");
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

        <Pressable
          style={styles.secondaryButton}
          onPress={() => leadQuery.refetch()}
        >
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

function NativeEditLeadScreen({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Failed to get session", error);
      }

      if (isMounted) {
        setUserId(data.session?.user.id ?? null);
        setIsCheckingSession(false);
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const leadQuery = useLocalLeadQuery(id, userId);

  async function handleSubmit(values: LeadFormValues) {
    if (!userId || !leadQuery.data) {
      return;
    }

    const initialValues: LeadFormValues = {
      name: leadQuery.data.name,
      company: leadQuery.data.company ?? "",
      phone: leadQuery.data.phone ?? "",
      email: leadQuery.data.email ?? "",
      status: leadQuery.data.status,
      notes: leadQuery.data.notes ?? "",
    };

    if (areValuesEqual(initialValues, values)) {
      router.replace("/leads");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await updateLocalLead({
        id,
        user_id: userId,

        name: values.name.trim(),
        company: values.company.trim() || null,
        phone: values.phone.trim() || null,
        email: values.email.trim() || null,
        status: values.status,
        notes: values.notes.trim() || null,
      });

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.detail(id, userId),
      });

      router.replace("/leads");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to update lead.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession || leadQuery.isLoading) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Loading lead...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>You must be signed in.</Text>
      </View>
    );
  }

  if (leadQuery.isError) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>
          {leadQuery.error instanceof Error
            ? leadQuery.error.message
            : "Failed to load local lead."}
        </Text>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => leadQuery.refetch()}
        >
          <Text style={styles.secondaryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  if (!leadQuery.data) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Lead not found locally.</Text>
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

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <LeadForm
        initialValues={initialValues}
        submitLabel="Save Changes"
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