import { supabase } from "@/lib/supabase";

export type CrmLeadPayload = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  notes?: string | null;
};

export type SyncLeadToCrmSuccessResponse = {
  success: true;
  crmProvider: string;
  crmId: string;
  syncedAt: string;
};

export type SyncLeadToCrmErrorResponse = {
  success: false;
  error: string;
};

export type SyncLeadToCrmResponse =
  | SyncLeadToCrmSuccessResponse
  | SyncLeadToCrmErrorResponse;

export async function syncLeadToCrm(
  lead: CrmLeadPayload,
): Promise<SyncLeadToCrmResponse> {
  const { data, error } =
    await supabase.functions.invoke<SyncLeadToCrmResponse>(
      "sync-lead-to-crm",
      {
        body: {
          lead,
        },
      },
    );

  if (error) {
    throw new Error(
      `Could not sync lead to CRM right now: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Could not sync lead to CRM because no result was returned.",
    );
  }

  if (data.success === false) {
    throw new Error(data.error);
  }

  return data;
}
