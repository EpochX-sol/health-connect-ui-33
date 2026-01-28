# Health Connect — Frontend

A simple, friendly frontend for the Health Connect app. This README explains what the app is, the main technologies it uses, how the project is organized, and how to run it locally. It’s written for beginners.

---

## Project overview ✅

- **What it does:** The frontend provides the user interface for Health Connect. It shows pages for patients, doctors, and admins (appointments, messages, profiles, etc.).
- **What problem it solves:** It makes it easy for users to book appointments, manage medical records, and communicate with providers through a clean web interface.

---

## Tech stack (high-level) 🔧

- **Framework:** React + TypeScript (built with Vite)
- **Styling:** Tailwind CSS (utility-first styles)
- **Backend / data:** Calls a backend API and uses Supabase for auth and real-time features
- **Other:** React Router, Socket.IO (for calls/messages), TanStack Query (data fetching)

---

## Project structure (simple) 📁

Inside `src/` you’ll find:

- `components/` — Small reusable UI pieces (buttons, modals, form controls).
- `pages/` — Whole pages or screens (like dashboard, appointments, profile).
- `contexts/` — Places that keep shared state for the app (e.g., auth or call state).
- `hooks/` — Small helpers used across the app (reusable behaviors).
- `integrations/` — Setup for third-party services (e.g., Supabase client).
- `lib/` — Helper utilities, like the code that talks to the backend API.
- `types/` — Shared types and interfaces used across the app.
- `public/` — Static files (images, sounds, robots.txt).
- `src/main.tsx` and `src/App.tsx` — App entry points (start here to see how the app is mounted).

Note: This is a user-focused summary — it does not explain internal code logic.

---

## Getting started — setup & run ⚡

### Prerequisites

- Node.js (v16+ or newer) and a package manager (npm or pnpm)

### Install dependencies

Using npm:

```bash
npm install
```

Or using pnpm:

```bash
pnpm install
```

### Run in development

```bash
npm run dev
# or
pnpm dev
```

The app will open at `http://localhost:5173` by default.

### Build for production

```bash
npm run build
# or
pnpm build
```

### Preview the production build

```bash
npm run preview
# or
pnpm preview
```

---

## Environment variables (examples — do not commit secrets) 🔐

Create a `.env` or `.env.local` file with values like:

```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_BACKEND_URL="https://api.your-backend.com"  # optional
```

Only add *example* keys here; keep real keys secret and never push them to public repos.

---

## Notes for new developers ✨

- Look in `src/pages/` for the visible routes and screens.
- Check `src/integrations/supabase/client.ts` for how Supabase is used.
- Run `npm run lint` to check code style.
- If you need to change environment values, add them to `.env.local` and restart the dev server.

---

If you want a more detailed developer guide, let me know what to include (e.g., testing, deployment, or contribution steps).
# Online Doctor - Healthcare Connect Application

## Getting Started

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use your preferred IDE locally**

Clone and edit the repository:

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Deployment

You can deploy this project to any Node.js hosting platform such as:

- **Vercel** - Connect your GitHub repository and deploy with one click
- **Netlify** - Deploy with automatic builds on push
- **Heroku** - Deploy using the Heroku CLI
- **AWS** - Deploy using AWS Amplify or EC2

For custom domain setup, refer to your hosting provider's documentation.
