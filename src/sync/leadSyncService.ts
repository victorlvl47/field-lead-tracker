import {
  getPendingCreateLeads,
  getPendingUpdateLeads,
  markLocalLeadConflict,
  markLocalLeadSynced,
} from "@/db/leadLocalService";
import {
  syncRemoteLeadsToLocal,
  type RemoteToLocalSyncResult,
} from "@/db/leadLocalSync";
import {
  getRemoteLeadByIdForUser,
  insertLocalLeadIntoSupabase,
  updateSupabaseLeadFromLocal,
} from "@/features/leads/leadService";

type SyncError = {
  leadId: string;
  message: string;
};

export type PushPendingCreateLeadsResult = {
  foundCreates: number;
  pushedCreates: number;
  errors: SyncError[];
};

export type PushPendingUpdateLeadsResult = {
  foundUpdates: number;
  pushedUpdates: number;
  conflicts: number;
  errors: SyncError[];
};

export type LeadSyncResult = {
  creates: PushPendingCreateLeadsResult;
  updates: PushPendingUpdateLeadsResult;
  pull: RemoteToLocalSyncResult;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function pushPendingCreateLeads(
  userId: string,
): Promise<PushPendingCreateLeadsResult> {
  const pendingCreateLeads = await getPendingCreateLeads(userId);

  const result: PushPendingCreateLeadsResult = {
    foundCreates: pendingCreateLeads.length,
    pushedCreates: 0,
    errors: [],
  };

  for (const lead of pendingCreateLeads) {
    try {
      await insertLocalLeadIntoSupabase(lead);

      await markLocalLeadSynced({
        id: lead.id,
        user_id: lead.user_id,
      });

      result.pushedCreates += 1;

      console.log("Pushed pending_create lead to Supabase", lead.id);
    } catch (error) {
      const message = getErrorMessage(error);

      result.errors.push({
        leadId: lead.id,
        message,
      });

      console.error("Failed to push pending_create lead", lead.id, error);
    }
  }

  console.log("Push pending_create result", result);

  return result;
}

export async function syncLeads(userId: string): Promise<LeadSyncResult> {
  const creates = await pushPendingCreateLeads(userId);
  const updates = await pushPendingUpdateLeads(userId);
  const pull = await syncRemoteLeadsToLocal();

  const result: LeadSyncResult = {
    creates,
    updates,
    pull,
  };

  console.log("Lead sync result", result);

  return result;
}

export async function pushPendingUpdateLeads(
  userId: string,
): Promise<PushPendingUpdateLeadsResult> {
  const pendingUpdateLeads = await getPendingUpdateLeads(userId);

  const result: PushPendingUpdateLeadsResult = {
    foundUpdates: pendingUpdateLeads.length,
    pushedUpdates: 0,
    conflicts: 0,
    errors: [],
  };

  for (const lead of pendingUpdateLeads) {
    try {
      console.log("Checking pending update for conflicts", lead.id);

      const remoteLead = await getRemoteLeadByIdForUser(lead.id, userId);

      if (remoteLead && lead.last_synced_at) {
        const remoteUpdatedAtMs = new Date(remoteLead.updated_at).getTime();
        const lastSyncedAtMs = new Date(lead.last_synced_at).getTime();

        const remoteChangedAfterLastSync = remoteUpdatedAtMs > lastSyncedAtMs;

        if (remoteChangedAfterLastSync) {
          await markLocalLeadConflict(lead.id, userId);

          result.conflicts += 1;

          console.log("Detected sync conflict for lead", lead.id);
          console.log("Skipping push for conflicted lead", lead.id);

          continue;
        }
      }

      await updateSupabaseLeadFromLocal(lead);

      await markLocalLeadSynced({
        id: lead.id,
        user_id: lead.user_id,
      });

      result.pushedUpdates += 1;

      console.log("Pushed pending_update lead to Supabase", lead.id);
    } catch (error) {
      const message = getErrorMessage(error);

      result.errors.push({
        leadId: lead.id,
        message,
      });

      console.error("Failed to push pending_update lead", lead.id, error);
    }
  }

  console.log("Push pending_update result", result);

  return result;
}
