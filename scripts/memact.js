// ================================================================
// memact.js - Optional Memact fitness context bridge
// NutriPlan-Lite
// ================================================================

window.MemactIntegration = (() => {
  const CONFIG = {
    connectBaseUrl: window.NUTRIPLAN_MEMACT_CONNECT_URL || "https://www.memact.com/connect",
    appId: window.NUTRIPLAN_MEMACT_APP_ID || "nutriplan-lite",
    redirectUri: window.NUTRIPLAN_MEMACT_REDIRECT_URI || window.location.origin + window.location.pathname,
    scopes: ["context:read", "context:write", "memory:read_summary"],
    categories: ["fitness", "dietary_preferences"]
  };

  const REQUIRED_FIELDS = [
    "age",
    "weight",
    "height",
    "activity",
    "goal",
    "dietaryPreference",
    "allergies"
  ];

  function init() {
    handleConnectRedirect();
    bindButtons();
    render();
    applyApprovedContext();
  }

  function bindButtons() {
    document.querySelectorAll("#memact-connect-btn, #dashboard-memact-connect").forEach((button) => {
      if (button.dataset.memactBound) return;
      button.dataset.memactBound = "true";
      button.addEventListener("click", async () => {
        try {
          window.location.href = await buildConnectUrl();
        } catch {
          setStatus("Memact connect could not start. Try again in a moment.");
        }
      });
    });

    document.querySelectorAll("#dashboard-memact-disconnect").forEach((button) => {
      if (button.dataset.memactBound) return;
      button.dataset.memactBound = "true";
      button.addEventListener("click", () => {
        Storage.clearMemactConnection();
        setStatus("Memact disconnected. NutriPlan will use manual preferences.");
        render();
      });
    });

    const skip = document.getElementById("memact-skip-btn");
    if (skip && !skip.dataset.memactBound) {
      skip.dataset.memactBound = "true";
      skip.addEventListener("click", () => {
        setStatus("Manual setup selected. You can connect Memact later.");
      });
    }
  }

  async function buildConnectUrl() {
    const url = new URL(CONFIG.connectBaseUrl);
    const state = await createConnectState();
    url.searchParams.set("app_id", CONFIG.appId);
    url.searchParams.set("redirect_uri", CONFIG.redirectUri);
    url.searchParams.set("scopes", CONFIG.scopes.join(","));
    url.searchParams.set("categories", CONFIG.categories.join(","));
    url.searchParams.set("state", state);
    return url.toString();
  }

  function handleConnectRedirect() {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("connected")) return;

    const returnedState = params.get("state") || "";
    const expectedState = getPendingState();
    if (!returnedState || !expectedState || returnedState !== expectedState) {
      setStatus("Memact connect was rejected because the session check failed.");
      clearPendingState();
      return;
    }

    const connected = params.get("connected") === "1";
    const connectionId = params.get("connection_id") || "";
    if (connected && connectionId) {
      Storage.saveProfile({
        memactConnectionId: connectionId,
        memactConnectionState: returnedState,
        memactContextSource: "memact",
        memactContextUpdatedAt: new Date().toISOString()
      });
      sessionStorage.setItem("nutriplan_memact_active_state", returnedState);
      setStatus("Memact connected. Checking fitness context.");
    } else {
      setStatus("Memact was not connected. Continue with manual fitness preferences.");
    }

    clearPendingState();
    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  async function applyApprovedContext() {
    const profile = Storage.getProfile();
    if (!profile.memactConnectionId) {
      revealMissingFields(REQUIRED_FIELDS);
      return;
    }

    try {
      const response = await fetch(`/api/memact/fitness-context?connection_id=${encodeURIComponent(profile.memactConnectionId)}`, {
        headers: memactSessionHeaders(profile)
      });
      if (!response.ok) throw new Error("Memact context is not available yet.");
      const payload = await response.json();
      const context = normalizeFitnessContext(payload.context || payload.profile || {});
      const availableFields = Object.keys(context).filter((key) => context[key] !== "" && context[key] !== undefined && context[key] !== null);

      if (availableFields.length) {
        Storage.saveProfile({
          ...context,
          memactContextSource: "memact",
          memactContextUpdatedAt: new Date().toISOString()
        });
        fillProfileFields(Storage.getProfile());
      }

      const missing = getMissingFields(Storage.getProfile());
      revealMissingFields(missing);

      if (!missing.length) {
        Storage.saveProfile({ isSetup: true });
        document.getElementById("onboarding-modal")?.classList.add("hidden");
        setStatus("Fitness context loaded from Memact.");
      } else {
        setStatus(`Memact is connected. Please fill ${missing.length} missing fitness detail${missing.length === 1 ? "" : "s"}.`);
      }
    } catch (error) {
      revealMissingFields(REQUIRED_FIELDS);
      setStatus(error.message || "Use manual setup for now.");
    }
  }

  async function proposeMissingContextToMemact(profile) {
    if (!profile.memactConnectionId) return;
    const context = pickFitnessContext(profile);
    try {
      const response = await fetch("/api/memact/propose-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...memactSessionHeaders(profile)
        },
        body: JSON.stringify({
          connection_id: profile.memactConnectionId,
          category: "fitness",
          source_app: "NutriPlan Lite",
          context,
          proposed_at: new Date().toISOString()
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.accepted !== true) {
        throw new Error(payload.error || payload.status || "Memact Wiki sync is not confirmed yet.");
      }
      setStatus("Fitness context proposed to Memact Wiki for user control.");
    } catch (error) {
      setStatus(error.message || "Saved locally. Memact Wiki sync can run after backend setup.");
    }
  }

  function pickFitnessContext(profile) {
    return {
      age: profile.age,
      weight_kg: profile.weight,
      height_cm: profile.height,
      activity_level: profile.activity,
      fitness_goal: profile.goal,
      macro_split: profile.macroSplit,
      water_target_ml: profile.waterTarget,
      dietary_preference: profile.dietaryPreference,
      allergies_or_restrictions: profile.allergies
    };
  }

  function normalizeFitnessContext(raw) {
    return {
      age: numberOrEmpty(raw.age),
      weight: numberOrEmpty(raw.weight || raw.weight_kg),
      height: numberOrEmpty(raw.height || raw.height_cm),
      activity: raw.activity || raw.activity_level || "",
      goal: raw.goal || raw.fitness_goal || "",
      macroSplit: raw.macroSplit || raw.macro_split || "",
      waterTarget: numberOrEmpty(raw.waterTarget || raw.water_target_ml),
      dietaryPreference: raw.dietaryPreference || raw.dietary_preference || "",
      allergies: raw.allergies || raw.allergies_or_restrictions || ""
    };
  }

  function numberOrEmpty(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : "";
  }

  function getMissingFields(profile) {
    return REQUIRED_FIELDS.filter((field) => {
      const value = profile[field];
      return value === undefined || value === null || String(value).trim() === "";
    });
  }

  function revealMissingFields(missing) {
    const missingSet = new Set(missing);
    document.querySelectorAll("[data-context-key]").forEach((field) => {
      const key = field.getAttribute("data-context-key");
      field.classList.toggle("context-filled", !missingSet.has(key));
    });
  }

  function fillProfileFields(profile) {
    Object.entries({
      age: "age",
      weight: "weight",
      height: "height",
      activity: "activity",
      goal: "goal",
      macroSplit: "macroSplit",
      waterTarget: "waterTarget",
      dietaryPreference: "dietaryPreference",
      allergies: "allergies"
    }).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && profile[key] !== undefined && profile[key] !== "") el.value = profile[key];
    });
  }

  function render() {
    const profile = Storage.getProfile();
    const connected = Boolean(profile.memactConnectionId);
    const pill = document.getElementById("memact-connection-pill");
    const copy = document.getElementById("memact-context-copy");
    const list = document.getElementById("memact-context-list");
    const connect = document.getElementById("dashboard-memact-connect");
    const disconnect = document.getElementById("dashboard-memact-disconnect");

    if (pill) pill.textContent = connected ? "Connected" : "Manual";
    if (copy) {
      copy.textContent = connected
        ? "Approved Memact fitness context can fill setup fields and reduce repeated questions."
        : "Connect Memact to reuse fitness context, or continue manually if consent is denied.";
    }
    if (connect) connect.classList.toggle("hidden", connected);
    if (disconnect) disconnect.classList.toggle("hidden", !connected);
    if (list) {
      const rows = [
        ["Goal", profile.goal || "Not set"],
        ["Diet", profile.dietaryPreference || "Not set"],
        ["Restrictions", profile.allergies || "Not set"],
        ["Updated", profile.memactContextUpdatedAt ? new Date(profile.memactContextUpdatedAt).toLocaleString() : "Not synced"]
      ];
      list.replaceChildren(...rows.map(([label, value]) => {
        const row = document.createElement("div");
        const labelEl = document.createElement("span");
        const valueEl = document.createElement("strong");
        labelEl.textContent = label;
        valueEl.textContent = String(value);
        row.append(labelEl, valueEl);
        return row;
      }));
    }
  }

  function setStatus(message) {
    const status = document.getElementById("memact-status");
    if (status) status.textContent = message;
    if (window.Toast) Toast.show(message, "info");
  }

  async function createConnectState() {
    try {
      const response = await fetch("/api/memact/session");
      if (!response.ok) throw new Error("session_unavailable");
      const payload = await response.json();
      if (!payload.state) throw new Error("missing_state");
      sessionStorage.setItem("nutriplan_memact_pending_state", payload.state);
      return payload.state;
    } catch {
      const fallback = cryptoRandomState();
      sessionStorage.setItem("nutriplan_memact_pending_state", fallback);
      return fallback;
    }
  }

  function getPendingState() {
    return sessionStorage.getItem("nutriplan_memact_pending_state") || "";
  }

  function clearPendingState() {
    sessionStorage.removeItem("nutriplan_memact_pending_state");
  }

  function memactSessionHeaders(profile) {
    const state = sessionStorage.getItem("nutriplan_memact_active_state") || profile.memactConnectionState || "";
    return {
      "X-NutriPlan-Connection-Id": profile.memactConnectionId || "",
      "X-NutriPlan-Memact-State": state
    };
  }

  function cryptoRandomState() {
    const bytes = new Uint8Array(24);
    window.crypto?.getRandomValues?.(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return {
    init,
    render,
    applyApprovedContext,
    proposeMissingContextToMemact
  };
})();
