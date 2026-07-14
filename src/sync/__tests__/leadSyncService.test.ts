import type { LocalLead } from "@/db/leadLocalService";
import {
  getPendingCreateLeads,
  getPendingUpdateLeads,
  markLocalLeadSynced,
} from "@/db/leadLocalService";
import {
  getRemoteLeadByIdForUser,
  insertLocalLeadIntoSupabase,
  updateSupabaseLeadFromLocal,
} from "@/features/leads/leadService";
import { captureAppError } from "@/lib/sentry";
import { shouldMarkPendingUpdateAsConflict } from "@/sync/conflictUtils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  pushPendingCreateLeads,
  pushPendingUpdateLeads,
} from "../leadSyncService";

vi.mock("@/db/leadLocalService", () => ({
  getPendingCreateLeads: vi.fn(),
  getPendingUpdateLeads: vi.fn(),
  markLocalLeadConflict: vi.fn(),
  markLocalLeadSynced: vi.fn(),
}));

vi.mock("@/features/leads/leadService", () => ({
  getRemoteLeadByIdForUser: vi.fn(),
  insertLocalLeadIntoSupabase: vi.fn(),
  updateSupabaseLeadFromLocal: vi.fn(),
}));

vi.mock("@/db/leadLocalSync", () => ({
  syncRemoteLeadsToLocal: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
  captureAppError: vi.fn(),
}));

vi.mock("@/sync/conflictUtils", () => ({
  shouldMarkPendingUpdateAsConflict: vi.fn(),
}));

const userId = "user-1";

function createPendingCreateLead(id: string): LocalLead {
  return {
    id,
    user_id: userId,
    name: id,
    company: null,
    phone: null,
    email: null,
    status: "new",
    notes: null,
    created_at: "2026-07-06T12:00:00.000Z",
    updated_at: "2026-07-06T12:00:00.000Z",
    sync_status: "pending_create",
    last_synced_at: null,
  };
}

function createPendingUpdateLead(id: string): LocalLead {
  return {
    ...createPendingCreateLead(id),
    updated_at: "2026-07-06T12:01:00.000Z",
    sync_status: "pending_update",
    last_synced_at: "2026-07-06T12:00:00.000Z",
  };
}

describe("pushPendingCreateLeads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records failed pending_create leads and continues syncing the rest", async () => {
    const leads = [
      createPendingCreateLead("lead-a"),
      createPendingCreateLead("lead-b"),
      createPendingCreateLead("lead-c"),
    ];
    const insertError = new Error("Supabase insert failed");

    vi.mocked(getPendingCreateLeads).mockResolvedValue(leads);
    vi.mocked(insertLocalLeadIntoSupabase).mockImplementation(async (lead) => {
      if (lead.id === "lead-b") {
        throw insertError;
      }

      return lead;
    });

    const result = await pushPendingCreateLeads(userId);

    expect(result).toEqual({
      foundCreates: 3,
      pushedCreates: 2,
      errors: [
        {
          leadId: "lead-b",
          message: "Supabase insert failed",
        },
      ],
    });
    expect(insertLocalLeadIntoSupabase).toHaveBeenCalledTimes(3);
    expect(markLocalLeadSynced).toHaveBeenCalledTimes(2);
    expect(markLocalLeadSynced).toHaveBeenCalledWith({
      id: "lead-a",
      user_id: userId,
    });
    expect(markLocalLeadSynced).not.toHaveBeenCalledWith({
      id: "lead-b",
      user_id: userId,
    });
    expect(markLocalLeadSynced).toHaveBeenCalledWith({
      id: "lead-c",
      user_id: userId,
    });
    expect(captureAppError).toHaveBeenCalledOnce();
    expect(captureAppError).toHaveBeenCalledWith(insertError);
  });
});

describe("pushPendingUpdateLeads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records failed pending_update leads and continues syncing the rest", async () => {
    const leads = [
      createPendingUpdateLead("lead-a"),
      createPendingUpdateLead("lead-b"),
      createPendingUpdateLead("lead-c"),
    ];
    const updateError = new Error("Supabase update failed");

    vi.mocked(getPendingUpdateLeads).mockResolvedValue(leads);
    vi.mocked(getRemoteLeadByIdForUser).mockImplementation(
      async (leadId) =>
        ({
          id: leadId,
          updated_at: "2026-07-06T12:00:00.000Z",
        }) as any,
    );
    vi.mocked(shouldMarkPendingUpdateAsConflict).mockReturnValue(false);
    vi.mocked(updateSupabaseLeadFromLocal).mockImplementation(async (lead) => {
      if (lead.id === "lead-b") {
        throw updateError;
      }

      return lead;
    });

    const result = await pushPendingUpdateLeads(userId);

    expect(result).toEqual({
      foundUpdates: 3,
      pushedUpdates: 2,
      conflicts: 0,
      errors: [
        {
          leadId: "lead-b",
          message: "Supabase update failed",
        },
      ],
    });
    expect(getPendingUpdateLeads).toHaveBeenCalledWith(userId);
    expect(getRemoteLeadByIdForUser).toHaveBeenCalledTimes(3);
    expect(shouldMarkPendingUpdateAsConflict).toHaveBeenCalledTimes(3);
    expect(updateSupabaseLeadFromLocal).toHaveBeenCalledTimes(3);
    expect(markLocalLeadSynced).toHaveBeenCalledTimes(2);
    expect(markLocalLeadSynced).toHaveBeenCalledWith({
      id: "lead-a",
      user_id: userId,
    });
    expect(markLocalLeadSynced).not.toHaveBeenCalledWith({
      id: "lead-b",
      user_id: userId,
    });
    expect(markLocalLeadSynced).toHaveBeenCalledWith({
      id: "lead-c",
      user_id: userId,
    });
    expect(captureAppError).toHaveBeenCalledOnce();
    expect(captureAppError).toHaveBeenCalledWith(updateError);
  });
});
