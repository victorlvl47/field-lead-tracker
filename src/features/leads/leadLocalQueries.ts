import { useQuery } from "@tanstack/react-query";
import { Platform } from "react-native";

import { getLocalLeadById, getLocalLeads } from "@/db/leadLocalService";

export const localLeadKeys = {
  all: ["local-leads"] as const,
  lists: () => [...localLeadKeys.all, "list"] as const,
  list: (userId: string) => [...localLeadKeys.lists(), userId] as const,
  details: () => [...localLeadKeys.all, "detail"] as const,
  detail: (id: string, userId: string) =>
    [...localLeadKeys.details(), id, userId] as const,
};

export function useLocalLeadsQuery(userId: string | null | undefined) {
  return useQuery({
    queryKey: localLeadKeys.list(userId ?? "anonymous"),
    queryFn: async () => {
      if (!userId || Platform.OS === "web") {
        return [];
      }

      return getLocalLeads(userId);
    },
    enabled: !!userId,
  });
}

export function useLocalLeadQuery(
  id: string | null | undefined,
  userId: string | null | undefined,
) {
  return useQuery({
    queryKey: localLeadKeys.detail(id ?? "missing-id", userId ?? "anonymous"),
    queryFn: async () => {
      if (!id || !userId || Platform.OS === "web") {
        return null;
      }

      return getLocalLeadById(id, userId);
    },
    enabled: !!id && !!userId,
  });
}