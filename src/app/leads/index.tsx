import { Link, useRouter } from "expo-router";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import {
  getDebugLocalLeads,
  markLocalLeadConflict,
  printConflictLocalLeads,
  printPendingLocalLeads,
} from "@/db/leadLocalService";
import { syncRemoteLeadsToLocal } from "@/db/leadLocalSync";
import {
  localLeadKeys,
  useLocalLeadsQuery,
} from "@/features/leads/leadLocalQueries";
import { useLeadsQuery } from "@/features/leads/leadQueries";
import { getLeads } from "@/features/leads/leadService";
import type { Lead } from "@/features/leads/leadTypes";
import {
  type NetworkStatus,
  useNetworkStatus,
} from "@/hooks/useNetworkStatus";
import { supabase } from "@/lib/supabase";

import {
  type LeadStatusFilter,
  useLeadFiltersStore,
} from "@/store/leadFiltersStore";

import {
  pushPendingCreateLeads,
  pushPendingUpdateLeads,
  syncLeads,
} from "@/sync/leadSyncService";

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

// Expo only exposes environment variables prefixed with EXPO_PUBLIC_ to client code.
const shouldDisplayDebugTools =
  process.env.EXPO_PUBLIC_DISPLAY_DEBUG_TOOLS === "true";

// Read-only debug tooling for comparing local SQLite data with remote Supabase data.
async function handlePrintSupabaseLeads() {
  try {
    const remoteLeads = await getLeads();

    console.log("Supabase leads", remoteLeads);
  } catch (error) {
    console.error("Failed to print Supabase leads", error);
  }
}

export default function LeadsScreen() {
  if (Platform.OS === "web") {
    return <WebLeadsScreen />;
  }

  return <NativeLeadsScreen />;
}

function WebLeadsScreen() {
  const networkStatus = useNetworkStatus();

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useLeadsQuery();

  function handlePrintLocalSQLiteLeads() {
    console.log("SQLite local database is not available on web.");
  }

  function handlePrintPendingLocalLeads() {
    console.log("SQLite pending local leads are not available on web.");
  }

  function handlePushPendingCreates() {
    console.log("Push pending creates is not available on web.");
  }

  function handlePushPendingUpdates() {
    console.log("Push pending updates is not available on web.");
  }

  function handleSyncNow() {
    console.log("Lead sync is not available on web.");
  }

  function handleShowConflictLeads() {
    console.log("SQLite conflict local leads are not available on web.");
  }

  function handleMarkFirstLeadAsConflict() {
    console.log("Mark first lead as conflict is not available on web.");
  }

  return (
    <LeadsList
      leads={leads}
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      onRefresh={() => {
        void refetch();
      }}
      isRefreshing={isFetching}
      onPrintLocalSQLiteLeads={handlePrintLocalSQLiteLeads}
      onPrintPendingLocalLeads={handlePrintPendingLocalLeads}
      onPushPendingCreates={handlePushPendingCreates}
      isPushingCreates={false}
      onPushPendingUpdates={handlePushPendingUpdates}
      isPushingUpdates={false}
      onSyncNow={handleSyncNow}
      isSyncingLeads={false}
      onMarkFirstLeadAsConflict={handleMarkFirstLeadAsConflict}
      onShowConflictLeads={handleShowConflictLeads}
      networkStatus={networkStatus.status}
      syncFeedbackMessage={null}
      onPrintSupabaseLeads={() => {
        void handlePrintSupabaseLeads();
      }}
    />
  );
}

function NativeLeadsScreen() {
  const queryClient = useQueryClient();
  const networkStatus = useNetworkStatus();

  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRefreshingRemote, setIsRefreshingRemote] = useState(false);
  const [isPushingCreates, setIsPushingCreates] = useState(false);
  const [isPushingUpdates, setIsPushingUpdates] = useState(false);
  const [isSyncingLeads, setIsSyncingLeads] = useState(false);
  const [syncFeedbackMessage, setSyncFeedbackMessage] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    if (!networkStatus.isClearlyOffline) {
      setSyncFeedbackMessage(null);
    }
  }, [networkStatus.isClearlyOffline]);

  const {
    data: leads = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useLocalLeadsQuery(userId);

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

  async function handlePrintLocalSQLiteLeads() {
    try {
      const localLeads = await getDebugLocalLeads();

      console.log("Local SQLite leads", localLeads);
    } catch (error) {
      console.error("Failed to print local SQLite leads", error);
    }
  }

  async function handlePrintPendingLocalLeads() {
    if (!userId) {
      console.log("No user id found");
      return;
    }

    try {
      await printPendingLocalLeads(userId);
    } catch (error) {
      console.error("Failed to print pending local leads", error);
    }
  }

  async function handleShowConflictLeads() {
    if (!userId) {
      console.log("No user id found");
      return;
    }

    try {
      await printConflictLocalLeads(userId);
    } catch (error) {
      console.error("Failed to show conflict local leads", error);
    }
  }

  async function handleMarkFirstLeadAsConflict() {
    if (!userId) {
      console.log("No user id found");
      return;
    }

    const firstLead = leads[0];

    if (!firstLead) {
      console.log("No local leads found to mark as conflict.");
      return;
    }

    try {
      await markLocalLeadConflict(firstLead.id, userId);

      console.log("Marked local lead as conflict", firstLead.id);

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });
    } catch (error) {
      console.error("Failed to mark first local lead as conflict", error);
    }
  }

  async function handlePushPendingCreates() {
    if (!userId) {
      console.log("No user id found");
      return;
    }

    try {
      setIsPushingCreates(true);

      const result = await pushPendingCreateLeads(userId);

      console.log("Push pending creates result", result);

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });
    } catch (error) {
      console.error("Failed to push pending creates", error);
    } finally {
      setIsPushingCreates(false);
    }
  }

  async function handlePushPendingUpdates() {
    if (!userId) {
      console.log("No user id found");
      return;
    }

    try {
      setIsPushingUpdates(true);

      const result = await pushPendingUpdateLeads(userId);

      console.log("Push pending updates result", result);

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });
    } catch (error) {
      console.error("Failed to push pending updates", error);
    } finally {
      setIsPushingUpdates(false);
    }
  }

  async function handleSyncNow() {
    setSyncFeedbackMessage(null);

    if (networkStatus.isClearlyOffline) {
      const message =
        "Cannot sync leads because the device appears to be offline.";

      console.log(message);
      setSyncFeedbackMessage(message);
      return;
    }

    if (!userId) {
      const message =
        "Cannot sync leads because no user session was found.";

      console.log(message);
      setSyncFeedbackMessage(message);
      return;
    }

    try {
      setIsSyncingLeads(true);

      await syncLeads(userId);

      await queryClient.invalidateQueries({
        queryKey: localLeadKeys.list(userId),
      });
    } catch (error) {
      console.error("Failed to sync leads", error);
      setSyncFeedbackMessage("Failed to sync leads. Please try again.");
    } finally {
      setIsSyncingLeads(false);
    }
  }

  return (
    <LeadsList
      leads={leads}
      isLoading={isCheckingSession || isLoading}
      isError={isError}
      error={error}
      onRetry={() => {
        void refetch();
      }}
      onRefresh={() => {
        void handleRefreshFromSupabase();
      }}
      isRefreshing={isRefreshingRemote}
      onPrintLocalSQLiteLeads={() => {
        void handlePrintLocalSQLiteLeads();
      }}
      onPrintPendingLocalLeads={() => {
        void handlePrintPendingLocalLeads();
      }}
      onPrintSupabaseLeads={() => {
        void handlePrintSupabaseLeads();
      }}
      onPushPendingCreates={() => {
        void handlePushPendingCreates();
      }}
      isPushingCreates={isPushingCreates}
      onPushPendingUpdates={() => {
        void handlePushPendingUpdates();
      }}
      isPushingUpdates={isPushingUpdates}
      onSyncNow={() => {
        void handleSyncNow();
      }}
      isSyncingLeads={isSyncingLeads}
      onMarkFirstLeadAsConflict={() => {
        void handleMarkFirstLeadAsConflict();
      }}
      onShowConflictLeads={() => {
        void handleShowConflictLeads();
      }}
      networkStatus={networkStatus.status}
      syncFeedbackMessage={syncFeedbackMessage}
    />
  );
}

type LeadListItem = Pick<
  Lead,
  "id" | "name" | "company" | "phone" | "email" | "status"
>;

type LeadsListProps = {
  leads: LeadListItem[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onPrintLocalSQLiteLeads: () => void;
  onPrintPendingLocalLeads: () => void;
  onPrintSupabaseLeads: () => void;
  onPushPendingCreates: () => void;
  isPushingCreates: boolean;
  onPushPendingUpdates: () => void;
  isPushingUpdates: boolean;
  onSyncNow: () => void;
  isSyncingLeads: boolean;
  onMarkFirstLeadAsConflict: () => void;
  onShowConflictLeads: () => void;
  networkStatus: NetworkStatus;
  syncFeedbackMessage: string | null;
};

function LeadsList({
  leads,
  isLoading,
  isError,
  error,
  onRetry,
  onRefresh,
  isRefreshing,
  onPrintLocalSQLiteLeads,
  onPrintPendingLocalLeads,
  onPrintSupabaseLeads,
  onPushPendingCreates,
  isPushingCreates,
  onPushPendingUpdates,
  isPushingUpdates,
  onSyncNow,
  isSyncingLeads,
  onMarkFirstLeadAsConflict,
  onShowConflictLeads,
  networkStatus,
  syncFeedbackMessage,
}: LeadsListProps) {
  const router = useRouter();
  const [areDebugToolsOpen, setAreDebugToolsOpen] = useState(false);
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

        <Pressable style={styles.secondaryButton} onPress={onRetry}>
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
            onPress={onRefresh}
            disabled={isRefreshing}
          >
            <Text style={styles.secondaryButtonText}>
              {isRefreshing ? "Refreshing..." : "Refresh"}
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

      <Text style={styles.networkStatusText}>
        Network:{" "}
        {networkStatus === "unknown"
          ? "Checking..."
          : networkStatus === "online"
            ? "Online"
            : "Offline"}
      </Text>

      {syncFeedbackMessage ? (
        <Text style={styles.syncFeedbackErrorText}>{syncFeedbackMessage}</Text>
      ) : null}

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

      {shouldDisplayDebugTools ? (
        <View style={styles.debugToolsContainer}>
          <Pressable
            style={styles.debugToolsHeader}
            onPress={() => setAreDebugToolsOpen((current) => !current)}
          >
            <Text style={styles.debugToolsTitle}>Debug Tools</Text>
            <Text style={styles.debugToolsToggle}>
              {areDebugToolsOpen ? "Hide" : "Show"}
            </Text>
          </Pressable>

          {areDebugToolsOpen ? (
            <ScrollView
              style={styles.debugToolsScroll}
              contentContainerStyle={styles.debugToolsContent}
            >
              <Pressable
                style={styles.debugButton}
                onPress={onPrintLocalSQLiteLeads}
              >
                <Text style={styles.debugButtonText}>
                  Print Local SQLite Leads
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onPrintPendingLocalLeads}
              >
                <Text style={styles.debugButtonText}>
                  Print Pending Local Leads
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onPushPendingCreates}
                disabled={isPushingCreates}
              >
                <Text style={styles.debugButtonText}>
                  {isPushingCreates
                    ? "Pushing Creates..."
                    : "Push Pending Creates"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onPushPendingUpdates}
                disabled={isPushingUpdates}
              >
                <Text style={styles.debugButtonText}>
                  {isPushingUpdates
                    ? "Pushing Updates..."
                    : "Push Pending Updates"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onSyncNow}
                disabled={isSyncingLeads}
              >
                <Text style={styles.debugButtonText}>
                  {isSyncingLeads ? "Syncing..." : "Sync Now"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onMarkFirstLeadAsConflict}
              >
                <Text style={styles.debugButtonText}>
                  Mark First Lead as Conflict
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onShowConflictLeads}
              >
                <Text style={styles.debugButtonText}>
                  Show Conflict Local Leads
                </Text>
              </Pressable>

              <Pressable
                style={styles.debugButton}
                onPress={onPrintSupabaseLeads}
              >
                <Text style={styles.debugButtonText}>
                  Print Supabase Leads
                </Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      ) : null}

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
  networkStatusText: {
    color: "#52525b",
    fontWeight: "600",
    marginBottom: 12,
  },
  syncFeedbackErrorText: {
    color: "#dc2626",
    fontWeight: "600",
    marginBottom: 12,
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
  debugToolsContainer: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  debugToolsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  debugToolsTitle: {
    color: "#18181b",
    fontSize: 14,
    fontWeight: "700",
  },
  debugToolsToggle: {
    color: "#2563eb",
    fontWeight: "700",
  },
  debugToolsScroll: {
    maxHeight: 180,
  },
  debugToolsContent: {
    gap: 8,
    paddingTop: 8,
  },
  debugButton: {
    alignSelf: "flex-start",
    backgroundColor: "#18181b",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  debugButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
});
