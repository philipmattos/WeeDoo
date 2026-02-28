# WeeDoo

WeeDoo is a modern, modular productivity hub and local-first personal organization application. Its primary technical architecture is designed to consolidate everyday tools into a single, high-performance interface that minimizes friction, load times, and payload bloat.

## Core Features

WeeDoo operates primarily through an ephemeral modal navigation systems granting instant access to:

- Tasks: Quick daily task management with priority assignments.
- Kanban: Visual project organization across custom columns with Drag-and-Drop capability.
- Notes: Markdown-supported text editor for drafts and comprehensive annotations.
- Calendar: Event and deadline tracking intrinsically linked to the Task suite.
- Groceries: Shared shopping list manager capable of real-time synchronization.

## Architecture & Infrastructure

The application abandons traditional email/password authentication models in favor of a "Local-First" methodology combined with an optional Cloud Sync infrastructure.

### Local-First Persistence
By default, all user data (Tasks, Kanban boards, Notes, Calendar events, and Settings) is aggressively cached via localStorage and orchestrated globally using Zustand. This ensures that the application operates at native-like speeds and remains fully functional even in offline environments.

### Cloud Hydration & Shared Groceries (Netlify + Airtable)
For users who require cross-device availability, WeeDoo implements an atomic "Savecode" system. 
- Multi-Table Storage: A backend composed of 5 isolated Airtable bases (`UsersData_Tasks`, `UsersData_Kanban`, `UsersData_Notes`, etc.) persists the serialized Zustand configurations. This prevents data bloating by ensuring that modifying a single checkbox in the task list does not force a re-upload of a user's entire markdown notes history.
- Netlify Serverless Proxy: The frontend never directly communicates with Airtable. All payload transfers and Airtable API keys are obfuscated and routed securely through Netlify Serverless Functions (`/api/airtable`).
- Groceries Web-Links: The Groceries module relies on an ephemeral ID sharing protocol. When a list is marked for sharing, its ID is sent to the cloud, allowing an unlimited number of anonymous users to retrieve and update the list without requiring an account.

## Tech Stack

The stack is strictly focused on modern front-end ecosystem standards:

- Framework: React + TypeScript
- Build Tooling: Vite
- Styling: Tailwind CSS & Shadcn UI
- Global State Management: Zustand (with Persistence Middleware)
- Backend Provider: Netlify Serverless Functions
- Database: Airtable

## Repository Documentation

For developers looking to inspect the application rules, implementation logic, or clone the project for personal use, please refer to the internal documentation suite located in the `/Documents` directory. 
Important setup files such as `deploy_backend_setup.md` and `airtable_setup.md` outline the required procedures for building you own Netlify proxy.
