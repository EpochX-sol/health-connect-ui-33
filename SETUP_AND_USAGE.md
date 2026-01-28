# Health Connect UI - Setup & Usage Guide

## Prerequisites

Before you start, make sure you have:

- **Node.js** (version 16 or higher) — Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes with Node.js) or **pnpm** (optional, but faster)
- **Git** — For cloning the repository from GitHub
- **A text editor or IDE** — VS Code is recommended ([download](https://code.visualstudio.com/))
- **GitHub account** — To access the repository (if it's private)

Check if you have Node.js installed by running:
```bash
node --version
npm --version
```

---

## Step-by-Step Setup

### Step 1: Clone the Repository from GitHub

Open your terminal (Command Prompt, PowerShell, or Git Bash on Windows) and run:

```bash
git clone https://github.com/<YOUR_USERNAME>/<REPOSITORY_NAME>.git
```

Replace `<YOUR_USERNAME>` and `<REPOSITORY_NAME>` with the actual GitHub username and repository name.

**Example:**
```bash
git clone https://github.com/john-doe/health-connect-ui.git
```

### Step 2: Navigate into the Project Folder

After cloning, go into the project directory:

```bash
cd health-connect-ui
```

Or replace `health-connect-ui` with whatever your repository name is.

### Step 3: Install Dependencies

Install all required packages using npm:

```bash
npm install
```

Or if you prefer pnpm (faster):

```bash
pnpm install
```

Or using yarn:

```bash
yarn install
```

This may take a few minutes. You'll see a lot of packages being downloaded — this is normal.

---

## Step 4: Set Up Environment Variables

The app needs environment variables to connect to Supabase and the backend API.

### Create a `.env.local` file

In the root directory of the project (same level as `package.json`), create a new file called `.env.local` (note the dot at the beginning):

```bash
# On Windows (using Command Prompt or PowerShell):
# Just create a new file named .env.local using your text editor

# On Mac/Linux (using Terminal):
touch .env.local
```

### Add Environment Variables

Open `.env.local` in your text editor and add these variables:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key-here
VITE_BACKEND_URL=https://api.your-backend.com
```

**Where to get these values:**

- **VITE_SUPABASE_URL** and **VITE_SUPABASE_PUBLISHABLE_KEY**: Get these from your Supabase project dashboard (Settings → API Keys)
- **VITE_BACKEND_URL**: The URL of your backend API server. Ask your backend developer for this.

**Important:** Never commit `.env.local` to GitHub — it's already in `.gitignore` (a file that tells Git what not to upload).

---

## Step 5: Run the Application

Start the development server:

```bash
npm run dev
```

Or with pnpm:

```bash
pnpm dev
```

You should see output like:

```
  VITE v5.4.19  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Open in Browser

Open your web browser and go to:

```
http://localhost:5173/
```

The app will automatically reload whenever you save a file (hot reload).

---

## Available Commands

Here are all the npm scripts you can run:

```bash
# Start development server
npm run dev

# Build the app for production
npm run build

# Build for development (with debugging capabilities)
npm run build:dev

# Check code style and find issues
npm run lint

# Preview the production build locally
npm run preview
```

---

## How to Use the Application

### Logging In

1. Navigate to `http://localhost:5173/`
2. You'll see the home page with a login option
3. Click **Login** and enter your credentials
4. You'll be directed to your role-specific dashboard (Patient, Doctor, or Admin)

### Patient Dashboard

Once logged in as a patient, you can:

- **View Appointments** — See scheduled appointments with doctors
- **Book Appointments** — Search for doctors and book appointments
- **View Prescriptions** — Check medication prescriptions issued by doctors
- **Messages** — Chat with your doctor
- **Payment** — View and manage payment history
- **Profile** — Update your personal information

### Doctor Dashboard

Once logged in as a doctor, you can:

- **View Appointments** — See patient appointments scheduled with you
- **Manage Patients** — View list of patients under your care
- **Send Prescriptions** — Issue prescriptions to patients
- **Messages** — Communicate with patients
- **Payment** — Track earnings and payments
- **Profile** — Update your professional information

### Admin Dashboard

As an admin, you can:

- **View System Statistics** — Overall platform metrics
- **Manage Users** — View and manage patient and doctor accounts
- **Monitor Activities** — Track system usage and activity

---

## Common Issues & Troubleshooting

### Issue: "npm: command not found"

**Solution:** Node.js isn't installed properly. Download and install from [nodejs.org](https://nodejs.org/)

### Issue: Port 5173 is already in use

**Solution:** The port is busy with another app. Either:
- Close the app using that port
- Change the port in `vite.config.ts` (look for `port: 5173`)

### Issue: "Cannot find module" or missing dependencies

**Solution:** Run `npm install` again or try clearing node_modules:

```bash
rm -r node_modules package-lock.json
npm install
```

### Issue: Environment variables not working

**Solution:**
- Make sure the file is named `.env.local` (with a dot at the start)
- Restart the dev server after creating/editing `.env.local`
- Variable names must start with `VITE_` to be accessible in the browser

### Issue: Supabase connection error

**Solution:**
- Verify your Supabase URL and key in `.env.local`
- Check that your Supabase project is active
- Make sure the backend is running (if required)

---

## Deploying to Production

Once you're ready to deploy, follow these steps:

### Build for Production

```bash
npm run build
```

This creates an optimized `dist/` folder ready for deployment.

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com/) and sign up
3. Click "Import Project" and connect your GitHub repository
4. Add your environment variables in Vercel's settings
5. Click "Deploy"

The app will be live at a URL like `your-app.vercel.app`

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com/) and sign up
3. Click "New site from Git" and select your repository
4. Add environment variables in Netlify's settings
5. Deploy

### Deploy to Other Platforms

The app can be deployed to:
- **AWS** (Amplify or S3 + CloudFront)
- **Heroku** (with a simple `Procfile`)
- **GitHub Pages** (for static hosting)
- **DigitalOcean**
- Any Node.js hosting service

---

## Making Changes & Development

### Edit Files

You can edit any files in the `src/` folder. Changes are automatically reflected in the browser.

**Best practices:**

- Never edit files in the `dist/` folder (it gets regenerated)
- Keep components small and reusable
- Use TypeScript for type safety
- Follow the existing code style (run `npm run lint` to check)

### Adding New Pages

1. Create a new file in `src/pages/`
2. Define the component
3. Add a route in `src/App.tsx` (find the Router setup)
4. Link to it using navigation components

### Adding New Components

1. Create a new file in `src/components/`
2. Use existing UI components from `src/components/ui/`
3. Import and use in your pages

### Checking Code Quality

Before pushing changes:

```bash
npm run lint
```

Fix any issues it reports.

---

## Common Development Tasks

### Reset to Fresh State

```bash
# Clear everything and reinstall
npm run clean  # (if available)
rm -r node_modules package-lock.json
npm install
```

### Debug in Browser

1. Open your browser's Developer Tools (F12 or Ctrl+Shift+I)
2. Go to the **Console** tab to see errors
3. Go to the **Network** tab to see API requests
4. Set breakpoints in the **Sources** tab to debug JavaScript

### Check API Calls

Look in Browser Dev Tools → Network tab to see:
- API requests to your backend
- Supabase calls
- Any network errors

---

## Getting Help

If you run into issues:

1. Check this guide again
2. Look at the existing code for examples
3. Check browser console for error messages (F12)
4. Ask in your team's chat/email
5. Search GitHub issues for similar problems
6. Check the project's issue tracker

---

## Summary

You're now ready to develop! The workflow is:

1. Edit code in `src/`
2. See changes instantly in browser (auto-reload)
3. Test in the browser and dev tools
4. Run `npm run lint` before committing
5. Push to GitHub
6. Deploy to production when ready

Happy coding! 🚀
