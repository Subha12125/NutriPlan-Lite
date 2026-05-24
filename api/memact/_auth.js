import crypto from "node:crypto";

const SESSION_SECRET = process.env.MEMACT_SESSION_SECRET || process.env.MEMACT_API_KEY || "nutriplan-dev-session";
const STATE_TTL_MS = Number(process.env.MEMACT_STATE_TTL_MS || 10 * 60 * 1000);
const MEMACT_TIMEOUT_MS = Number(process.env.MEMACT_TIMEOUT_MS || 8000);

export function createSignedState() {
  const issuedAt = Date.now();
  const nonce = crypto.randomBytes(24).toString("base64url");
  const payload = `${issuedAt}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyConnectionRequest(request, connectionId) {
  const state = getHeader(request, "x-nutriplan-memact-state");
  const headerConnectionId = getHeader(request, "x-nutriplan-connection-id");

  if (!state || !verifySignedState(state)) {
    return { ok: false, status: 401, error: "invalid_memact_session" };
  }

  if (!connectionId || headerConnectionId !== connectionId) {
    return { ok: false, status: 403, error: "connection_session_mismatch" };
  }

  return { ok: true };
}

export async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MEMACT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

export function isAbortError(error) {
  return error?.name === "AbortError";
}

function verifySignedState(state) {
  const parts = String(state).split(".");
  if (parts.length !== 3) return false;

  const [issuedAtRaw, nonce, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > STATE_TTL_MS) return false;

  const expected = sign(`${issuedAtRaw}.${nonce}`);
  return safeEqual(signature, expected);
}

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getHeader(request, name) {
  return request.headers?.[name] || request.headers?.[name.toLowerCase()] || "";
}
