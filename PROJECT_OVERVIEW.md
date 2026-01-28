# Health Connect UI - Project Overview

## What This Project Does

Health Connect is a modern web-based healthcare platform that connects patients, doctors, and administrators in one integrated system. The frontend (this project) provides an intuitive user interface where:

- **Patients** can book doctor appointments, view medical prescriptions, communicate with healthcare providers, check payment status, and manage their health records
- **Doctors** can view their appointments, manage patient records, send prescriptions, handle payments, and communicate with patients
- **Admins** can oversee the entire platform, manage users, and monitor system activities

The application handles real-time features like video calls and messaging, making healthcare accessible and convenient for all users.

---

## Project Structure & Folder Explanation

### Root Level Files

- **package.json** — Lists all project dependencies (libraries) and scripts for running, building, and linting the application
- **vite.config.ts** — Configuration file for Vite (the build tool that powers the development environment)
- **tsconfig.json** — TypeScript configuration that ensures type safety across the codebase
- **tailwind.config.ts** — Configuration for Tailwind CSS (styling framework)
- **postcss.config.js** — Processes CSS transformations before they reach the browser
- **eslint.config.js** — Code quality and style rules to keep code consistent
- **index.html** — The main HTML file that serves as the entry point for the web application
- **vercel.json** — Configuration for deployment on Vercel (a hosting platform)
- **components.json** — Configuration file for shadcn/ui component library

---

## Source Code Structure (`src/` folder)

### **src/App.tsx** & **src/main.tsx**
These are the entry points of the application. `main.tsx` loads the React app into the HTML page, and `App.tsx` contains the main application routing and layout structure.

### **src/index.css** & **src/App.css**
Global CSS styles that apply to the entire application. These files contain base styles and custom styling not covered by Tailwind CSS.

### **src/components/** — Reusable UI Components

This folder contains building blocks used throughout the application:

- **Modals** — Pop-up windows for specific actions:
  - `ActiveCallModal.tsx` — Shows details of an ongoing call
  - `CallModal.tsx` — Base modal for call-related interfaces
  - `IncomingCallModal.tsx` — Displays incoming call notifications
  - `OutgoingCallModal.tsx` — Shows outgoing call information
  - `VideoCallModal.tsx` — Contains the video call interface

- **Layout Components** — Page templates for different user roles:
  - `admin/AdminLayout.tsx` — Layout template for admin pages
  - `doctor/DoctorLayout.tsx` — Layout template for doctor pages
  - `patient/PatientLayout.tsx` — Layout template for patient pages

- **Utility Components**:
  - `NavLink.tsx` — Clickable navigation links
  - `PrescriptionPDF.tsx` — Generates PDF versions of prescriptions
  - `RequireRole.tsx` — Protects routes to only allow specific user roles
  - `RootRedirect.tsx` — Redirects users to appropriate landing pages based on their role

- **ui/** — Pre-built shadcn/ui components (these are styled versions of Radix UI primitives):
  - Form controls: `input.tsx`, `button.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`, `textarea.tsx`, `toggle.tsx`, `switch.tsx`
  - Layout & containers: `card.tsx`, `accordion.tsx`, `tabs.tsx`, `sidebar.tsx`, `drawer.tsx`, `sheet.tsx`
  - Dialogs & alerts: `dialog.tsx`, `alert-dialog.tsx`, `alert.tsx`, `popover.tsx`, `hover-card.tsx`
  - Data display: `table.tsx`, `carousel.tsx`, `chart.tsx`, `progress.tsx`, `badge.tsx`, `avatar.tsx`
  - Menus & navigation: `dropdown-menu.tsx`, `context-menu.tsx`, `command.tsx`, `navigation-menu.tsx`, `pagination.tsx`, `menubar.tsx`
  - Feedback: `toast.tsx`, `toaster.tsx`, `sonner.tsx` (toast notifications)
  - Other utilities: `calendar.tsx`, `aspect-ratio.tsx`, `separator.tsx`, `skeleton.tsx`, `scroll-area.tsx`, `resizable.tsx`, `slider.tsx`, `tooltip.tsx`, `use-toast.ts`

### **src/pages/** — Full Page Components

These are complete screens that users interact with. Organized by user role:

- **Patient Pages** (`patient/`):
  - `Appointments.tsx` — View and manage patient appointments
  - `BookAppointment.tsx` — Interface for booking new appointments
  - `Dashboard.tsx` — Patient home/overview page
  - `Messages.tsx` — Chat/messaging with doctors
  - `Payment.tsx` — Payment management and history
  - `PaymentStatus.tsx` — Check status of payments
  - `Prescriptions.tsx` — View medical prescriptions
  - `Profile.tsx` — Patient profile and settings

- **Doctor Pages** (`doctor/`):
  - `Appointments.tsx` — View and manage doctor schedules
  - `Dashboard.tsx` — Doctor home/overview page
  - `Messages.tsx` — Communication with patients
  - `Patients.tsx` — List of patients under the doctor's care
  - `Payment.tsx` — Payment and earning tracking
  - `Prescriptions.tsx` — Issue and manage prescriptions
  - `Profile.tsx` — Doctor profile and credentials

- **Admin Pages** (`admin/`):
  - `Dashboard.tsx` — System overview and management controls

- **General Pages** (root of `pages/`):
  - `Index.tsx` — Home/landing page
  - `Login.tsx` — User login page
  - `RegisterPatient.tsx` — New patient registration
  - `RegisterDoctor.tsx` — New doctor registration
  - `DoctorProfile.tsx` — Public doctor profile viewing
  - `AppointmentDetail.tsx` — Detailed view of a single appointment
  - `NotFound.tsx` — 404 error page for non-existent routes

### **src/contexts/** — Shared State Management

Context API is used to share data across components without prop drilling:

- **AuthContext.tsx** — Manages user authentication state (login, logout, user info, role)
- **CallSystemContext.tsx** — Manages real-time call state (active calls, call participants, call status)

### **src/hooks/** — Custom Reusable Logic

React hooks that encapsulate logic used in multiple components:

- **useCallState.ts** — Custom hook to manage call-related state
- **useVideoCall.ts** — Custom hook for video call functionality
- **use-mobile.tsx** — Detects if the app is running on a mobile device
- **use-toast.ts** — Hook for displaying toast notifications

### **src/integrations/supabase/** — Third-Party Service Integration

Supabase is used for authentication and real-time database features:

- **client.ts** — Initializes and exports the Supabase client used throughout the app
- **types.ts** — TypeScript types for Supabase data structures

### **src/lib/** — Utility Functions & Helpers

General-purpose functions used across the application:

- **api.ts** — Functions for making API calls to the backend server
- **auth.ts** — Authentication helper functions (login, signup, token management)
- **utils.ts** — General utility functions (formatting dates, validation, etc.)

### **src/types/** — TypeScript Definitions

- **index.ts** — Shared TypeScript interfaces and types used throughout the project (e.g., User, Appointment, Prescription types)

### **public/** — Static Assets

- **robots.txt** — File for search engine crawlers
- **sounds/** — Audio files (likely for notifications or call alerts)

---

## Key Technologies Explained

### React
A JavaScript library for building user interfaces using reusable components. React makes building interactive, dynamic web applications easier.

### TypeScript
A superset of JavaScript that adds type checking. This helps catch errors before the code runs and makes the code more maintainable.

### Vite
A fast build tool that provides instant feedback during development and optimizes code for production. It's much faster than older build tools like Webpack.

### Tailwind CSS
A utility-first CSS framework that lets you style components by adding class names instead of writing custom CSS. It speeds up development significantly.

### shadcn/ui
A collection of pre-designed, accessible UI components built on top of Radix UI and styled with Tailwind CSS. These components are highly customizable and production-ready.

### React Router
Enables navigation between different pages in the application without full page reloads (single-page application).

### Supabase
A backend-as-a-service platform that provides authentication, real-time database, and other backend features without needing a separate backend server.

### Socket.IO
Enables real-time, bidirectional communication between the client and server, used for live messaging and video calls.

### TanStack Query (React Query)
Manages server state and data fetching, making it easy to fetch, cache, and synchronize data from the backend.

### React Hook Form
Simplifies form handling in React, making it easier to manage form state and validation.

### Zod
A TypeScript-first validation library used to validate data structures and ensure type safety at runtime.

---

## How Everything Works Together

1. **User opens the app** → Browser loads `index.html` which runs `main.tsx`
2. **main.tsx** mounts the React `App` component
3. **App.tsx** sets up routing using React Router, determines which page to show based on the URL
4. **Pages use components** from `src/components/` to build their UI
5. **Components get data** from Supabase (via `integrations/supabase/`) or the backend API (via `lib/api.ts`)
6. **Data is shared** using Context API (auth info, call state) and stored locally with TanStack Query
7. **Real-time features** like calls and messages use Socket.IO to communicate with the server
8. **Styling** is applied through Tailwind CSS classes and custom CSS files

---

## Summary

This is a comprehensive healthcare platform frontend that provides different interfaces for patients, doctors, and administrators. It's built with modern tools and follows best practices for code organization, state management, and user experience.
