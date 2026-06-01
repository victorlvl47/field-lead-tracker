import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
    createLead,
    getLeadById,
    getLeads,
    updateLead,
} from "./leadService";
import type { LeadFormValues } from "./leadTypes";

export const leadKeys = {
  all: ["leads"] as const,
  detail: (id: string) => ["leads", id] as const,
};

export function useLeadsQuery() {
  return useQuery({
    queryKey: leadKeys.all,
    queryFn: getLeads,
  });
}

export function useLeadQuery(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLeadById(id),
    enabled: Boolean(id),
  });
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useUpdateLeadMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: LeadFormValues) => updateLead(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) });
    },
  });
}