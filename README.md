# NutriPlan Lite

NutriPlan Lite is a lightweight fitness and nutrition planner for calories, macros, hydration, and personal goals.

The project keeps its original kernel: static HTML, CSS, and vanilla JavaScript. It can run locally with `localStorage`, connect to Supabase for account sync, and optionally use Memact after user consent.

## What It Does

- Calculates nutrition targets from age, height, weight, activity level, and goal.
- Tracks meals, calories, protein, carbs, fat, and water.
- Shows daily progress, weekly charts, and simple coach-style recommendations.
- Works without a required account in local mode.
- Can reuse approved Memact fitness memory so users do not repeat setup questions.

## How Memact Helps The UX

Memact is optional. NutriPlan still works if the user denies consent.

When a user connects Memact, NutriPlan can ask for approved fitness memory such as goals, activity level, dietary preference, allergies, and hydration targets. If enough memory already exists, NutriPlan fills those setup fields and skips repeated onboarding questions. If anything is missing, NutriPlan asks only for the missing details.

When the user saves new fitness details, NutriPlan proposes that context back to Memact Wiki. The user can later review, edit, reject, or delete it there.

This keeps the app simple:

1. NutriPlan asks before using Memact.
2. The user can connect Memact or set up manually.
3. NutriPlan reads only approved fitness memory.
4. Missing fitness details are still asked inside NutriPlan.
5. New answers are proposed back to Memact Wiki for user control.

## Memact Server Setup

Memact API keys must stay on the server. Do not put a private Memact API key in browser code, public repos, logs, or user-facing settings.

```env
# Memact API endpoint, for example https://api.memact.com
MEMACT_BASE_URL=https://api.memact.com

# Server-side Memact API key. Keep private; keys usually start with mka_.
MEMACT_API_KEY=mka_your_server_side_key

# App identifier sent to Memact API calls, for example nutriplan-lite.
MEMACT_APP_ID=nutriplan-lite

# Signs Memact connect state tokens for this deployment.
MEMACT_SESSION_SECRET=replace_with_a_long_random_secret

# Optional outbound Memact API timeout in milliseconds.
MEMACT_TIMEOUT_MS=8000
```

Frontend configuration can be set before `scripts/memact.js` loads:

```html
<script>
  window.NUTRIPLAN_MEMACT_CONNECT_URL = "https://www.memact.com/connect";
  window.NUTRIPLAN_MEMACT_APP_ID = "nutriplan-lite";
  window.NUTRIPLAN_MEMACT_REDIRECT_URI = "https://your-domain.com/";
</script>
```

## Memact Integration Files

- `scripts/memact.js` starts the consent flow, reads approved fitness memory, fills known setup fields, and proposes newly entered fitness context back to Memact Wiki.
- `api/memact/session.js` creates a signed one-time state value for the connect flow.
- `api/memact/fitness-context.js` reads approved fitness memory from Memact through the server.
- `api/memact/propose-context.js` proposes saved fitness details back to Memact Wiki.
- `api/memact/_auth.js` verifies the signed state and applies outbound Memact API timeouts.

## Tech Stack

- HTML5
- CSS custom properties and responsive layouts
- Vanilla JavaScript
- LocalStorage fallback
- Optional Supabase tables in `supabase_setup.sql`
- Optional Vercel-style API routes in `api/memact/`
- Optional Gemini integrations already present in the app

## Local Development

```bash
npm install
npm run check
npm run build
```

Then serve the folder locally:

```bash
npm run dev
```

## Notes

- The Memact integration is designed to reduce onboarding friction, not replace NutriPlan’s own preference form.
- If Memact is unavailable or not configured, NutriPlan falls back to manual setup.
- The coach features can evolve behind server-side routes without exposing private keys in browser code.

## License

This project is licensed under the MIT License.
