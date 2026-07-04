import {
  getLocalLeadById,
  markLocalLeadSynced,
  replaceLocalLeadWithRemoteLead,
} from "@/db/leadLocalService";
import {
  getRemoteLeadByIdForUser,
  updateSupabaseLeadFromLocal,
} from "@/features/leads/leadService";
import { captureAppError } from "@/lib/sentry";

export type LeadConflictResolutionStrategy = "keep_local" | "use_remote";

export type ResolveLeadConflictResult = {
  leadId: string;
  strategy: LeadConflictResolutionStrategy;
  resolved: boolean;
};

export async function resolveLeadConflict(
  userId: string,
  leadId: string,
  strategy: LeadConflictResolutionStrategy,
): Promise<ResolveLeadConflictResult> {
  try {
    console.log("Resolving lead conflict", { leadId, strategy });

    const localLead = await getLocalLeadById(leadId, userId);

    if (!localLead) {
      throw new Error("Local lead could not be found.");
    }

    if (localLead.sync_status !== "conflict") {
      throw new Error("This lead does not have a sync conflict.");
    }

    if (strategy === "keep_local") {
      await updateSupabaseLeadFromLocal(localLead);

      await markLocalLeadSynced({
        id: localLead.id,
        user_id: localLead.user_id,
      });

      const result: ResolveLeadConflictResult = {
        leadId,
        strategy,
        resolved: true,
      };

      console.log("Resolved lead conflict", { leadId, strategy });

      return result;
    }

    const remoteLead = await getRemoteLeadByIdForUser(leadId, userId);

    if (!remoteLead) {
      throw new Error("Remote lead could not be found.");
    }

    await replaceLocalLeadWithRemoteLead(remoteLead, userId);

    const result: ResolveLeadConflictResult = {
      leadId,
      strategy,
      resolved: true,
    };

    console.log("Resolved lead conflict", { leadId, strategy });

    return result;
  } catch (error) {
    console.error("Failed to resolve lead conflict", error);
    captureAppError(error);
    throw error;
  }
}
