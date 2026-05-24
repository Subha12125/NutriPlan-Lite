import { fetchWithTimeout, isAbortError, verifyConnectionRequest } from "./_auth.js";

const MEMACT_BASE_URL = process.env.MEMACT_BASE_URL || "https://api.memact.com";
const MEMACT_API_KEY = process.env.MEMACT_API_KEY || "";
const MEMACT_APP_ID = process.env.MEMACT_APP_ID || "nutriplan-lite";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  const body = request.body || {};
  const connectionId = body.connection_id || "";
  if (!connectionId) return response.status(400).json({ error: "missing_connection_id" });

  const auth = verifyConnectionRequest(request, connectionId);
  if (!auth.ok) {
    return response.status(auth.status).json({ error: auth.error });
  }

  const proposal = {
    schema_version: "memact.app_context_proposal.v0",
    app_id: MEMACT_APP_ID,
    source_app: body.source_app || "NutriPlan Lite",
    category: body.category || "fitness",
    context: body.context || {},
    proposed_at: body.proposed_at || new Date().toISOString(),
    source_type: "app",
    status: "pending",
    user_visible: true
  };

  if (!MEMACT_API_KEY) {
    return response.status(202).json({
      accepted: false,
      status: "memact_not_configured",
      proposal
    });
  }

  try {
    const memactResponse = await fetchWithTimeout(new URL("/v1/wiki/proposals", MEMACT_BASE_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MEMACT_API_KEY}`,
        "X-Memact-Connection-Id": connectionId
      },
      body: JSON.stringify({ connection_id: connectionId, proposal })
    });

    const payload = await memactResponse.json().catch(() => ({}));
    return response.status(memactResponse.ok ? 200 : memactResponse.status).json({
      accepted: memactResponse.ok,
      ...payload
    });
  } catch (error) {
    if (isAbortError(error)) {
      return response.status(504).json({ error: "memact_timeout" });
    }

    return response.status(502).json({
      error: "memact_proposal_failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
