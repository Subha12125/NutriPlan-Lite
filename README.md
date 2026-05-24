# NutriPlan Lite

NutriPlan Lite is a local-first fitness nutrition planner for calories, macros, hydration, and personal goals.

The app keeps the original lightweight project kernel: static HTML, CSS, and vanilla JavaScript. It works without an account through `localStorage`, and it can be connected to Supabase or Memact later.

## What It Does

- Calculates nutrition targets from age, height, weight, activity level, and goal.
- Tracks meals, calories, protein, carbs, fat, and water.
- Shows daily progress, weekly charts, and simple coach-style recommendations.
- Runs locally by default with no required signup.
- Can optionally use Memact fitness context after user consent.

## Memact Integration

Memact is optional. NutriPlan still works if the user denies consent.

Flow:

1. User opens NutriPlan setup.
2. User may connect Memact.
3. If Memact has enough approved fitness context, NutriPlan fills setup fields and skips repeated questions.
4. If context is missing, NutriPlan asks only the missing fitness questions.
5. When the user saves those answers, NutriPlan proposes the new fitness context back to Memact Wiki for user control.

Server environment variables:

```env
MEMACT_BASE_URL=https://api.memact.com
MEMACT_API_KEY=mka_your_server_side_key
MEMACT_APP_ID=nutriplan-lite
```

Frontend configuration can be set before `scripts/memact.js` loads:

```html
<script>
  window.NUTRIPLAN_MEMACT_CONNECT_URL = "https://www.memact.com/connect";
  window.NUTRIPLAN_MEMACT_APP_ID = "nutriplan-lite";
  window.NUTRIPLAN_MEMACT_REDIRECT_URI = "https://your-domain.com/";
</script>
```

Never put a private Memact API key in browser code.

## Tech Stack

- HTML5
- CSS custom properties and responsive layouts
- Vanilla JavaScript
- LocalStorage fallback
- Optional Supabase tables in `supabase_setup.sql`
- Optional Vercel-style API routes in `api/memact/`

## Local Development

```bash
npm install
npm run check
```

Then open `index.html` or serve the folder with any static server.

## Notes

The coach is rule-based in this version. It does not require an AI API. Future API integrations can be added behind server-side routes without breaking the local-first app.
