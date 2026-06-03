import { useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import type { LeadFormValues, LeadStatus } from "./leadTypes";

type LeadFormProps = {
  initialValues?: LeadFormValues;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (values: LeadFormValues) => void;
};

const statusOptions: LeadStatus[] = ["new", "contacted", "qualified", "lost"];

const emptyValues: LeadFormValues = {
  name: "",
  company: "",
  phone: "",
  email: "",
  status: "new",
  notes: "",
};

export function LeadForm({
  initialValues = emptyValues,
  submitLabel,
  isSubmitting = false,
  onSubmit,
}: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>(initialValues);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField<K extends keyof LeadFormValues>(
    field: K,
    value: LeadFormValues[K]
  ) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSubmit() {
    setErrorMessage("");

    if (!values.name.trim()) {
      setErrorMessage("Lead name is required.");
      return;
    }

    onSubmit(values);
  }

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.input}
        placeholder="Lead name"
        value={values.name}
        onChangeText={(text) => updateField("name", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Company"
        value={values.company}
        onChangeText={(text) => updateField("company", text)}
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={values.phone}
        onChangeText={(text) => updateField("phone", text)}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={values.email}
        onChangeText={(text) => updateField("email", text)}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Status</Text>

      <View style={styles.statusRow}>
        {statusOptions.map((status) => {
          const isSelected = values.status === status;

          return (
            <Pressable
              key={status}
              style={[
                styles.statusButton,
                isSelected && styles.selectedStatusButton,
              ]}
              onPress={() => updateField("status", status)}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  isSelected && styles.selectedStatusButtonText,
                ]}
              >
                {status}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextInput
        style={[styles.input, styles.notesInput]}
        placeholder="Notes"
        value={values.notes}
        onChangeText={(text) => updateField("notes", text)}
        multiline
      />

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

      <Pressable
        style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  label: {
    fontWeight: "700",
    color: "#18181b",
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedStatusButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  statusButtonText: {
    color: "#52525b",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  selectedStatusButtonText: {
    color: "#ffffff",
  },
  errorText: {
    color: "#dc2626",
    fontWeight: "600",
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
  disabledButton: {
    opacity: 0.6,
  },
});