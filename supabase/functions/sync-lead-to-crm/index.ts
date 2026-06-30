const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type JsonBody = Record<string, unknown>;

type LeadPayload = {
  id?: unknown;
  name?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  status?: unknown;
  notes?: unknown;
};

function jsonResponse(body: JsonBody, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function validationError(message: string): Response {
  return jsonResponse(
    {
      success: false,
      error: message,
    },
    400
  );
}

async function readJsonBody(request: Request): Promise<JsonBody | null> {
  const bodyText = await request.text();

  if (!bodyText.trim()) {
    return null;
  }

  try {
    const body = JSON.parse(bodyText);
    return body && typeof body === "object" && !Array.isArray(body)
      ? body
      : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        error: "Please use POST to sync a lead to the fake CRM.",
      },
      405
    );
  }

  try {
    const body = await readJsonBody(request);

    if (!body) {
      return validationError("Please provide a JSON request body.");
    }

    const lead = body.lead as LeadPayload | undefined;

    if (!lead || typeof lead !== "object" || Array.isArray(lead)) {
      return validationError("Please include a lead in the request body.");
    }

    if (typeof lead.id !== "string" || !lead.id.trim()) {
      return validationError("Please include lead.id before syncing to CRM.");
    }

    if (typeof lead.name !== "string" || !lead.name.trim()) {
      return validationError("Please include lead.name before syncing to CRM.");
    }

    const crmId = `crm_${crypto.randomUUID()}`;

    return jsonResponse({
      success: true,
      crmProvider: "fake_hubspot",
      crmId,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Unexpected fake CRM sync error", error);

    return jsonResponse(
      {
        success: false,
        error: "Something went wrong while syncing the lead to the fake CRM.",
      },
      500
    );
  }
});
