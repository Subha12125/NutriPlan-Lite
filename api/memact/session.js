import { createSignedState } from "./_auth.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "method_not_allowed" });
  }

  return response.status(200).json({ state: createSignedState() });
}
