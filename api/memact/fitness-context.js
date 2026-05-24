const MEMACT_BASE_URL = process.env.MEMACT_BASE_URL || "https://api.memact.com";
const MEMACT_API_KEY = process.env.MEMACT_API_KEY || "";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  const connectionId = request.query?.connection_id || "";
  if (!connectionId) {
    return response.status(400).json({ error: "missing_connection_id" });
  }

  if (!MEMACT_API_KEY) {
    return response.status(200).json({
      connected: true,
      status: "memact_not_configured",
      context: {},
      missing: ["age", "weight", "height", "activity", "goal", "dietaryPreference", "allergies"]
    });
  }

  try {
    const url = new URL("/v1/memory", MEMACT_BASE_URL);
    url.searchParams.set("connection_id", connectionId);
    url.searchParams.set("category", "fitness");
    const memactResponse = await fetch(url, {
      headers: {
        Authorization: `Bearer ${MEMACT_API_KEY}`,
        "X-Memact-Connection-Id": connectionId
      }
    });

    if (!memactResponse.ok) {
      return response.status(memactResponse.status).json({ error: "memact_context_lookup_failed" });
    }

    const payload = await memactResponse.json();
    return response.status(200).json({
      connected: true,
      context: normalizeMemactMemory(payload),
      source: "memact"
    });
  } catch (error) {
    return response.status(502).json({
      error: "memact_unavailable",
      message: error instanceof Error ? error.message : String(error)
    });
  }
}

function normalizeMemactMemory(payload = {}) {
  const records = payload.memory || payload.records || payload.entries || [];
  const merged = Array.isArray(records)
    ? records.reduce((acc, item) => ({ ...acc, ...(item.value || item.attributes || item.context || {}) }), {})
    : payload.context || {};

  return {
    age: merged.age,
    weight_kg: merged.weight_kg || merged.weight,
    height_cm: merged.height_cm || merged.height,
    activity_level: merged.activity_level || merged.activity,
    fitness_goal: merged.fitness_goal || merged.goal,
    macro_split: merged.macro_split || merged.macroSplit,
    water_target_ml: merged.water_target_ml || merged.waterTarget,
    dietary_preference: merged.dietary_preference || merged.dietaryPreference,
    allergies_or_restrictions: merged.allergies_or_restrictions || merged.allergies
  };
}
