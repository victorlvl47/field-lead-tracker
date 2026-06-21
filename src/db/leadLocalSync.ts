import { Platform } from "react-native";

import {
  getLocalLeadById,
  upsertLocalLead,
} from "@/db/leadLocalService";
import { getLeads } from "@/features/leads/leadService";

export type RemoteToLocalSyncResult = {
  remoteCount: number;
  cachedCount: number;
  skippedPendingCount: number;
};

export async function syncRemoteLeadsToLocal(): Promise<RemoteToLocalSyncResult> {
  if (Platform.OS === "web") {
    console.log("Skipping remote leads cache on web");
    return {
      remoteCount: 0,
      cachedCount: 0,
      skippedPendingCount: 0,
    };
  }

  const remoteLeads = await getLeads();
  const now = new Date().toISOString();
  let cachedCount = 0;
  let skippedCount = 0;

  for (const lead of remoteLeads) {
    const existingLocalLead = await getLocalLeadById(lead.id, lead.user_id);

    if (existingLocalLead && existingLocalLead.sync_status !== "synced") {
      skippedCount += 1;

      console.log(
        "Skipping remote cache for pending local lead",
        existingLocalLead.id,
        existingLocalLead.sync_status,
      );

      continue;
    }

    await upsertLocalLead({
      id: lead.id,
      user_id: lead.user_id,

      name: lead.name,
      company: lead.company ?? null,
      phone: lead.phone ?? null,
      email: lead.email ?? null,
      status: lead.status,
      notes: lead.notes ?? null,

      created_at: lead.created_at,
      updated_at: lead.updated_at,

      sync_status: "synced",
      last_synced_at: now,
    });

    cachedCount += 1;
  }

  const result: RemoteToLocalSyncResult = {
    remoteCount: remoteLeads.length,
    cachedCount,
    skippedPendingCount: skippedCount,
  };

  console.log("Remote to local sync result", result);

  return result;
}
