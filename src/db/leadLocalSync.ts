import { Platform } from "react-native";

import {
  getLocalLeadById,
  upsertLocalLead,
} from "@/db/leadLocalService";
import { getLeads } from "@/features/leads/leadService";

export async function syncRemoteLeadsToLocal() {
  if (Platform.OS === "web") {
    console.log("Skipping remote leads cache on web");
    return [];
  }

  const remoteLeads = await getLeads();
  const now = new Date().toISOString();

  for (const lead of remoteLeads) {
    const existingLocalLead = await getLocalLeadById(lead.id, lead.user_id);

    if (existingLocalLead && existingLocalLead.sync_status !== "synced") {
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
  }

  console.log(`Cached ${remoteLeads.length} remote leads in SQLite`);

  return remoteLeads;
}
