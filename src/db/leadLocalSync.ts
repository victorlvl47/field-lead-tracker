import { Platform } from "react-native";

import {
  getLocalLeadById,
  replaceLocalLeadWithRemoteLead,
} from "@/db/leadLocalService";
import { getLeads } from "@/features/leads/leadService";

export type RemoteToLocalSyncResult = {
  remoteCount: number;
  cachedCount: number;
  skippedNonSyncedCount: number;
};

export async function syncRemoteLeadsToLocal(): Promise<RemoteToLocalSyncResult> {
  if (Platform.OS === "web") {
    console.log("Skipping remote leads cache on web");
    return {
      remoteCount: 0,
      cachedCount: 0,
      skippedNonSyncedCount: 0,
    };
  }

  const remoteLeads = await getLeads();
  let cachedCount = 0;
  let skippedCount = 0;

  for (const lead of remoteLeads) {
    const existingLocalLead = await getLocalLeadById(lead.id, lead.user_id);

    if (existingLocalLead && existingLocalLead.sync_status !== "synced") {
      skippedCount += 1;

      console.log(
        "Skipping remote cache for non-synced local lead",
        existingLocalLead.id,
        existingLocalLead.sync_status,
      );

      continue;
    }

    await replaceLocalLeadWithRemoteLead(lead, lead.user_id);

    cachedCount += 1;
  }

  const result: RemoteToLocalSyncResult = {
    remoteCount: remoteLeads.length,
    cachedCount,
    skippedNonSyncedCount: skippedCount,
  };

  console.log("Remote to local sync result", result);

  return result;
}
