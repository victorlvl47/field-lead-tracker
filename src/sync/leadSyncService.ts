import {
    getPendingCreateLeads,
    markLocalLeadSynced,
} from "@/db/leadLocalService";
import { insertLocalLeadIntoSupabase } from "@/features/leads/leadService";

type SyncError = {
  leadId: string;
  message: string;
};

export type PushPendingCreateLeadsResult = {
  foundCreates: number;
  pushedCreates: number;
  errors: SyncError[];
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