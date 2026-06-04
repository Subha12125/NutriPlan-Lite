# NutriplanLite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet)](https://supabase.com)
[![AI-Coach: Gemini](https://img.shields.io/badge/AI--Coach-Gemini-blue)](https://deepmind.google/technologies/gemini/)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

A privacy-first nutrition tracker that works offline, tracks calories, macros, hydration, and provides intelligent nutrition guidance.

✅ Works offline by default
✅ No account required
✅ Optional cloud sync with Supabase
✅ Lightweight Vanilla JavaScript SPA
✅ AI-assisted nutrition coaching

NutriplanLite is a modern, lightweight, and privacy-first single-page web application designed to help users log food, track macronutrients, monitor hydration, and receive personalized nutrition insights. It works offline out of the box using local storage and can optionally connect to Supabase for cloud synchronization and authentication.

## Quick Start

```bash
git clone https://github.com/Subha12125/NutriPlan-Lite.git

cd NutriPlan-Lite

python -m http.server 8000
```

Open your browser and visit:

```text
http://localhost:8000
```

---


## Features

- **Dynamic Goal Configuration**: Computes personalized daily calorie targets using the Mifflin-St Jeor equation. Supports presets for weight loss, maintenance, and muscle gain, alongside balanced, low-carb, high-protein, or customized macronutrient ratios.
- **Real-Time Tracking Dashboard**: Displays calorie balance, target progress circles, and interactive progress bars for protein, carbohydrate, and fat limits.
- **Interactive Hydration Tracker**: Features an animated water glass visualization to track daily water intake against customized targets, with standard quick-add volume presets.
- **Offline Autocomplete Logger**: Logs food items instantaneously under Breakfast, Lunch, Dinner, or Snacks. Suggestions are populated using a local food database (`foodDB.json`) for zero-latency lookups.
- **Gemini-Powered AI Coach & Quick Log**: Uses client-side integrations with the Google Gemini API to chat contextually with a digital nutrition coach (Aria) and parse free-form natural language strings (e.g. *"I had a banana and 3 scrambled eggs for breakfast"*) into automated nutrient logs.
- **Weekly Trend Analytics**: Evaluates 7-day nutritional and hydration historical records through dynamic, custom CSS-based bar charts.
- **Secure Cloud Authentication**: Integrated sign-up, login, and password recovery workflows backed by Supabase Auth and Row Level Security (RLS) tables.

---

## Screenshots

> [!NOTE]
> Screenshots will be added as UI assets are finalized. Below are standard placeholders:

| Landing Page | Dashboard Overview | AI Coach Aria Panel |
| :---: | :---: | :---: |
| `![Landing Page Placeholder](docs/screenshots/landing-placeholder.png)` | `![Dashboard Placeholder](docs/screenshots/dashboard-placeholder.png)` | `![AI Coach Placeholder](docs/screenshots/ai-coach-placeholder.png)` |

---

## Tech Stack

**Frontend**: HTML5 (Single Page Architecture utilizing `<template>` templates), CSS3 (featuring responsive flex/grid layouts, variables-based design system, and custom glassmorphism components), Vanilla JavaScript (ES6 modules).

**Backend**: Supabase JavaScript Client SDK (Client-side authentication, session state management, and real-time database CRUD transactions).

**Database**: PostgreSQL (hosted on Supabase) utilizing custom Row Level Security (RLS) filters and automated Postgres triggers for database profile initialization.

**Other Tools**:
- **GSAP (GreenSock Animation Platform)**: Handles premium landing page page-load and scroll-triggered animations.
- **Google Gemini API** (`gemini-2.5-flash`): Powers natural language instruction parsing and conversational chat coach feedback.
- **Google Fonts (Inter)**: Delivers clean typography.
- **FontAwesome / Emojis**: Integrated for semantic micro-iconography.

---

## Architecture Overview

NutriplanLite is organized as a lightweight Single Page Application (SPA) that structures data flow, navigation, and API gateways fully on the client-side.

```
                  ┌───────────────────────────────┐
                  │      User UI Interaction      │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │    Client-side Form Check     │
                  └───────────────┬───────────────┘
                                  │
                                  ▼
                  ┌───────────────────────────────┐
                  │  Application Controller State  │◄─── [Local foodDB.json]
                  │          (script.js)          │
                  └───────────────┬───────────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
      [Supabase API Sync Gateway]    [localStorage Fallback Engine]
          (Online Sync Mode)               (Local Demo Mode)
                  │                               │
                  ▼                               ▼
       ┌─────────────────────┐         ┌─────────────────────┐
       │ Supabase PostgreSQL │         │ Browser LocalStorage│
       └─────────────────────┘         └─────────────────────┘
```

### High-Level Architecture Components:
1. **SPA Routing Engine (`scripts/navigation.js`)**: Listens to URL hash parameters (`#landing`, `#dashboard`, `#ai-helper`) and dynamically swaps content zones into `<main>` by cloning HTML templates.
2. **State & Synchronization Controller (`script.js`)**: Tracks global auth states, selected active calendar dates, and configuration profiles. It routes updates dynamically to Supabase tables or defaults to local browser storage fallback states.
3. **AI Interface Wrapper (`scripts/ai.js`)**: Interacts directly with Google's Generative AI REST endpoints. Reads the configured API key from local storage, dynamically bundles the user's current goals/metrics as prompt context, and returns estimated nutritional data.
4. **Relational Database (`supabase_setup.sql`)**: Isolates multi-user profile information, food entries, and water logs using PostgreSQL Row Level Security policies (`auth.uid() = user_id`). An `AFTER INSERT` database trigger automatically bootstraps profiles on signup to prevent query faults.

---

## Getting Started

### Prerequisites
- A modern, compliant web browser (Chrome, Firefox, Safari, Edge).
- (Optional) A **Supabase Account & Project** (for online cloud backup).
- (Optional) A **Google Gemini API Key** (for natural language logging and chat coaching).

### Installation
1. Clone the repository from GitHub:
   ```bash
   git clone https://github.com/Subha12125/NutriPlan-Lite.git
   ```
2. Navigate to the project directory:
   ```bash
   cd NutriPlan-Lite
   ```

> [!NOTE]
   > No dependencies are required out of the box. NutriplanLite is structured as a static, zero-compilation project. It can be opened directly without `npm install`.

### Environment Variables
Because the app is a pure client-side SPA, configuration keys are managed in-browser rather than through static `.env` files:
1. Launch the application locally.
2. Click the **Settings Gear** icon in the header (top-right).
3. Input your **Supabase URL**, **Supabase Anon Key**, and **Gemini API Key**.
4. Click **Save & Reload** to write these details to your local browser storage instance.

### Run Locally
To explore the application without CORS issues (which occur when files are opened directly via `file://`), launch a local web server:

**Using Python (3.x):**
```bash
python -m http.server 8000
```
Open your browser and visit `http://localhost:8000`.

**Using Node.js static server:**
```bash
npx serve .
```
Open your browser and visit `http://localhost:3000`.

### Build for Production
No build command is necessary since the source HTML, CSS, and JS files can be run natively by web servers.
For production performance improvements (minification, file bundling, and environment variable configuration), please refer to the integration details inside [production-improvements.md].

---

## Project Structure

The codebase is organized cleanly to separate layout templates, application scripts, database configuration schemas, and UI styling files:

```
.
├── foodDB.json                       # Local fallback database containing 43+ food items
├── index.html                        # Main shell page containing app skeleton and SPA templates
├── pages                             # Fragment HTML sub-views
│   ├── ai-helper.html                # UI template for Coach Aria and NLP Logger
│   ├── dashboard.html                # UI template for tracking progress & trends
│   └── landing.html                  # UI template for landing product page
├── pr_instructions_for_maintainers.md# Integration guidelines for core code reviewers
├── pr_submission_notes.md            # Summary of PR changes and testing benchmarks
├── production-improvements.md        # Technical guidelines for deployment scaling
├── script.js                         # Core Controller managing state, event listeners, and API calls
├── scripts                           # Modular JavaScript source modules
│   ├── ai.js                         # Chatbot responses and contextual prompt assembly
│   ├── analytics.js                  # Nutrition calculations & custom bar chart renderers
│   ├── app.js                        # App bootstrapping and document loaded listeners
│   ├── chat.js                       # Messaging UI management and event bindings
│   ├── dashboard.js                  # Dashboard card controller
│   ├── hydration.js                  # Hydration log management & glass animations
│   ├── landing-animations.js         # GSAP ScrollTrigger configuration
│   ├── navigation.js                 # SPA routing control and transition handles
│   ├── sidebar.js                    # Mobile drawer toggles and responsive panels
│   ├── storage.js                    # LocalStorage read/write controller
│   ├── tracker.js                    # Food logging validation, autocomplete, and edits
│   └── ui.js                         # UI loaders and modal controls
├── styles                            # Modular CSS sheets
│   ├── ai-panel.css                  # Side AI assistant layouts
│   ├── ai.css                        # Message chat layouts
│   ├── animations.css                # Base visual keyframes
│   ├── base.css                      # Global color tokens and CSS variables
│   ├── chat.css                      # Chat room constraints
│   ├── components.css                # Custom glass cards, inputs, and button components
│   ├── dashboard.css                 # Hero, health score ring, and grid cards
│   ├── hydration.css                 # Glass water cup animations
│   ├── landing.css                   # Header navigation and hero CTA design
│   ├── layout.css                    # Grid shells and main shell layout
│   ├── responsive.css                # Breakpoints for tablets and mobile viewports
│   ├── sidebar.css                   # Left navigation sidebar styles
│   └── tracker.css                   # Search forms and autocomplete logs
├── supabase_setup.sql                # SQL database initialization schema
└── workflow.md                       # Architectural runbooks and recovery logs
```

---

## API Overview

NutriplanLite uses a client-side serverless pattern utilizing the Supabase SDK. The interface points represent the Postgres database schema and the client SDK method mappings:

### 1. Database Schema (PostgreSQL)

| Table Name | Column Name | Type | Constraints | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.profiles` | `user_id` | UUID | PRIMARY KEY, References auth.users | User demographics & active fitness goals |
| | `age` | INTEGER | NOT NULL, DEFAULT 25 | Used for BMR calculations |
| | `weight` | NUMERIC | NOT NULL, DEFAULT 70 | User weight in kg |
| | `height` | NUMERIC | NOT NULL, DEFAULT 175 | User height in cm |
| | `gender` | VARCHAR | NOT NULL, DEFAULT 'male' | Gender factor for BMR calculations |
| | `activity_level` | NUMERIC | NOT NULL, DEFAULT 1.2 | Activity multiplier (BMR -> TDEE) |
| | `fitness_goal` | VARCHAR | NOT NULL, DEFAULT 'maintain'| Target adjustment ('lose', 'maintain', 'gain') |
| | `macro_split` | VARCHAR | NOT NULL, DEFAULT 'balanced'| Target macros ratio preset |
| | `water_target` | INTEGER | NOT NULL, DEFAULT 2500 | Daily water goal in ml |
| `public.food_logs` | `id` | UUID | PRIMARY KEY, DEFAULT gen_uuid | Unique entry log identifier |
| | `user_id` | UUID | References auth.users | Identifies owner of log entry |
| | `log_date` | DATE | NOT NULL, DEFAULT current_date | Logging date track |
| | `meal_type` | VARCHAR | NOT NULL | Category ('breakfast', 'lunch', 'dinner', 'snack')|
| | `food_name` | TEXT | NOT NULL | Logged food name |
| | `quantity_grams`| NUMERIC | NOT NULL, DEFAULT 100 | Logged food quantity |
| | `calories` | INTEGER | NOT NULL, DEFAULT 0 | Caloric value |
| | `protein` / `carbs` / `fat` | NUMERIC | NOT NULL, DEFAULT 0 | Macro split measurements |
| `public.water_logs`| `id` | UUID | PRIMARY KEY, DEFAULT gen_uuid | Unique hydration log entry |
| | `user_id` | UUID | References auth.users | Identifies log owner |
| | `log_date` | DATE | NOT NULL, DEFAULT current_date | Date track |
| | `amount_ml` | INTEGER | NOT NULL, DEFAULT 0 | Volume consumed in ml |

### 2. Client SDK API Mappings

The application interacts with Supabase using the following client methods:

* **Authentication API**:
  * Create Account: `supabaseClient.auth.signUp({ email, password })`
  * Log In: `supabaseClient.auth.signInWithPassword({ email, password })`
  * Log Out: `supabaseClient.auth.signOut()`
* **Profile Database API**:
  * Retrieve Profile: `supabaseClient.from('profiles').select('*').eq('user_id', uid).single()`
  * Update Profile: `supabaseClient.from('profiles').update({ ... }).eq('user_id', uid)`
* **Logging Database API**:
  * Get Food Entries: `supabaseClient.from('food_logs').select('*').eq('user_id', uid).eq('log_date', date)`
  * Add Food Entry: `supabaseClient.from('food_logs').insert([entry])`
  * Delete Food Entry: `supabaseClient.from('food_logs').delete().eq('id', entryId)`
  * Add Water Log: `supabaseClient.from('water_logs').insert([log])`
  * Reset Hydration: `supabaseClient.from('water_logs').delete().eq('user_id', uid).eq('log_date', date)`

---

## Contributing

We welcome contributions from the open-source community! To contribute to NutriplanLite:

1. **Fork the Project**: Create your own copy of the repository.
2. **Create a Branch**: Commit changes on an isolated topic branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Write Clear Commits**: Follow standard prefixes:
   - `feat:` for new capabilities.
   - `fix:` for bug resolutions.
   - `docs:` for documentation modifications.
4. **Test Locally**: Verify features across multiple viewpoints and check console output for warnings or errors.
5. **Open a PR**: Submit your branch to the main repository, explaining your implementation decisions.

> [!TIP]
> **First-Time Contributors Guide:**
> - You don't need a Supabase configuration to work on frontend aesthetics or local modules! Simply launch the app in **Local Demo Mode** (default state when settings are blank) to modify trackers, styles, and dashboard modules.
> - Review [pr_instructions_for_maintainers.md] to inspect testing expectations before opening a PR.

---

## Coding Standards

- **ES6 JavaScript Modules**: Keep methods focused. Use descriptive variable naming, handle promise rejections explicitly using try-catch blocks, and clean up event listeners inside page navigations.
- **CSS Architecture**: Maintain variables in `base.css` to enable system-wide styling changes. Avoid using style modifications inline. Always test form control components in both dark and light modes.
- **Semantic Markup**: Ensure form inputs use explicit `<label>` tags. Provide ARIA labels (`aria-live`, `aria-atomic`) on widgets that change dynamically.
- **Quality Checking**: Run syntax checks and test select drop-downs across different web browsers (particularly Edge/Firefox on Windows systems) to catch text formatting issues.

---

## Roadmap

- [x] **Core SPA Navigation**: Switchable Landing, Dashboard, and Chat sub-views.
- [x] **Local Fallback Mode**: Client-side storage failsafe when database configuration is absent.
- [x] **AI Chat Coach & Parser**: Integrated client-side Gemini NLP connections.
- [ ] **Package Bundling**: Create a `package.json` file to manage frontend tasks.
- [ ] **Build Process**: Integrate Vite or Webpack to compile scripts, minify stylesheet files, and support compile-time `.env` environment injection.
- [ ] **E2E & Unit Test Pipeline**: Configure Jest for mathematics validations and Cypress for user flow checks.
- [ ] **Service Worker (PWA)**: Implement offline asset caching and home-screen install banners.
- [ ] **CI/CD Integration**: Connect GitHub Actions to execute automated code linting and deploy code shifts.

---

## Testing

NutriplanLite is validated using a manual regression testing plan:
- **Authentication Lifecycle**: Registration, login verification, session preservation on page reload, and sign-out states.
- **Metric Verification**: Validating that Mifflin-St Jeor adjustments accurately update daily calorie and macro-nutrient targets when profile fields are modified.
- **Goal Edge-cases**: Verifying custom macro limits reject calculations when input percentages do not total exactly 100%.
- **Log Aggregations**: Asserting food quantities compile totals, timelines update UI lists, and water reset commands purge logs correctly.
- **Gemini NLP**: Verification that natural language inputs reliably populate food entries with estimated calorie/macro parameters.

*Note: Plans to introduce Jest unit tests and Cypress E2E scripts are detail-mapped inside [production-improvements.md].*

---

## Deployment

### Deploying Static Files (GitHub Pages, Netlify, Vercel)
Deploying NutriplanLite is simple and requires no build pipeline:
1. Push your local workspace directory to a public GitHub repository.
2. Select your repository in Vercel or Netlify.
3. Configure the **Build Command** to remain empty, and set the **Publish Directory** to the root folder (`.`).
4. Click **Deploy**.

Once live, visit the deployed site, open the top-right Settings Cog, and write your database configurations. These keys remain local to your browser and are never exposed publicly on the internet.

---

## Troubleshooting

- **Error: "Supabase SDK is not loaded"**: The CDN scripts for the Supabase library could not be fetched. Check your internet connection or verify script tags in `index.html`.
- **A Warning Icon / Demo Badge Appears**: The application is running in **Local Demo Mode** because Supabase keys are not set. Input your keys in the settings modal to connect online.
- **AI coach returns key configuration error**: Open the settings modal (top-right cog) and paste a valid Google Gemini API Key.
- **Goals do not save/targets show as zero**: Ensure profile inputs contain positive numbers. Age, weight, and height must be within bounds (e.g. weight between 10kg and 300kg) to save successfully.
- **Supabase inserts fail**: Ensure you copied and executed all commands inside the `supabase_setup.sql` file in your Supabase SQL Editor.

---

## License

This project is licensed under the MIT License. See the [LICENSE](TODO: Add LICENSE file link) file for details.

---

---

## Support

- Open a bug report or feature request on the GitHub repository issue tracker.
- Engage with developers in the discussions forum: [TODO: Add discussion board link]
- For support inquiries, contact the maintenance team: [TODO: Add support email address]
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
