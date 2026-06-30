import { create } from "zustand";

import type { LeadStatus } from "@/features/leads/leadTypes";

export type LeadStatusFilter = "all" | LeadStatus;

type LeadFiltersState = {
  searchText: string;
  statusFilter: LeadStatusFilter;
  setSearchText: (searchText: string) => void;
  setStatusFilter: (statusFilter: LeadStatusFilter) => void;
  resetFilters: () => void;
};

export const useLeadFiltersStore = create<LeadFiltersState>()((set) => ({
  searchText: "",
  statusFilter: "all",

  setSearchText: (searchText) => set({ searchText }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  resetFilters: () =>
    set({
      searchText: "",
      statusFilter: "all",
    }),
}));