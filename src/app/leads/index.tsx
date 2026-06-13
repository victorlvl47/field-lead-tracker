import { Link, useRouter } from "expo-router";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { syncRemoteLeadsToLocal } from "@/db/leadLocalSync";
import {
  localLeadKeys,
  useLocalLeadsQuery,
} from "@/features/leads/leadLocalQueries";
import { supabase } from "@/lib/supabase";

import {
  type LeadStatusFilter,
  useLeadFiltersStore,
} from "@/store/leadFiltersStore";

const statusFilters: LeadStatusFilter[] = [
  "all",
  "new",
  "contacted",
  "qualified",
  "lost",
];

const statusFilterLabels: Record<LeadStatusFilter, string> = {
  all: "All",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  lost: "Lost",
};

export default function LeadsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRefreshingRemote, setIsRefreshingRemote] = useState(false);

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

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLocalLeadsQuery(userId);
  const searchText = useLeadFiltersStore((state) => state.searchText);
  const statusFilter = useLeadFiltersStore((state) => state.statusFilter);
  const setSearchText = useLeadFiltersStore((state) => state.setSearchText);
  const setStatusFilter = useLeadFiltersStore((state) => state.setStatusFilter);
  const resetFilters = useLeadFiltersStore((state) => state.resetFilters);

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredLeads = leads.filter((lead) => {
    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;
 
    const searchableText = [
      lead.name,
      lead.company,
      lead.phone,
      lead.email,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const hasActiveFilters = Boolean(normalizedSearch) || statusFilter !== "all";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleRefreshFromSupabase() {
    if (!userId) {
      return;
    }

    try {
      setIsRefreshingRemote(true);

      await syncRemoteLeadsToLocal();

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });
    } catch (error) {
      console.error("Failed to refresh local leads", error);
    } finally {
      setIsRefreshingRemote(false);
    }
  }

  if (isCheckingSession || isLoading) {
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

          <Pressable
            style={styles.secondaryButton}
            onPress={handleRefreshFromSupabase}
            disabled={isRefreshingRemote}
          >
            <Text style={styles.secondaryButtonText}>
              {isRefreshingRemote ? "Refreshing..." : "Refresh"}
            </Text>
          </Pressable>

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

      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search leads..."
          value={searchText}
          onChangeText={setSearchText}
          autoCapitalize="none"
        />

        <View style={styles.statusFiltersRow}>
          {statusFilters.map((status) => {
            const isSelected = statusFilter === status;

            return (
              <Pressable
                key={status}
                style={[
                  styles.statusFilterButton,
                  isSelected && styles.selectedStatusFilterButton,
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    isSelected && styles.selectedStatusFilterText,
                  ]}
                >
                  {statusFilterLabels[status]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {hasActiveFilters ? (
          <Pressable style={styles.clearFiltersButton} onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {hasActiveFilters ? "No matching leads" : "No leads yet"}
            </Text>

            <Text style={styles.emptyText}>
              {hasActiveFilters
                ? "Try changing your search or status filter."
                : "Create your first lead to test the Supabase connection."}
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
  filtersContainer: {
    gap: 12,
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  statusFiltersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusFilterButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedStatusFilterButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  statusFilterText: {
    color: "#52525b",
    fontWeight: "600",
  },
  selectedStatusFilterText: {
    color: "#ffffff",
  },
  clearFiltersButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  clearFiltersText: {
    color: "#2563eb",
    fontWeight: "700",
  },
});