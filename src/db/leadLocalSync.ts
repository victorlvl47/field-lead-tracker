import { Platform } from "react-native";

import { upsertLocalLead } from "@/db/leadLocalService";
import { getLeads } from "@/features/leads/leadService";

export async function syncRemoteLeadsToLocal() {
  if (Platform.OS === "web") {
    console.log("Skipping remote leads cache on web");
    return [];
  }

  const remoteLeads = await getLeads();
  const now = new Date().toISOString();

  for (const lead of remoteLeads) {
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
  }

  console.log(`Cached ${remoteLeads.length} remote leads in SQLite`);

  return remoteLeads;
}