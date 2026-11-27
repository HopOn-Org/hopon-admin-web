# HopOn Admin Web

A responsive frontend operations workspace built with React, TypeScript, Vite, and Tailwind CSS. Business records are fictional sample data. Administrator sign-in uses Keycloak; no business backend APIs, map services, or payment services are called.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Application URL: https://hopon-admin-web.vercel.app/. Use this deployment for Keycloak sign-in. The development command above runs a local server; it does not publish to Vercel.

```sh
npm run build      # TypeScript check and production build
npm run preview    # Serve the production build
npm test           # Browser workflow tests using installed Google Chrome
npm run test:ui    # Interactive Playwright runner
npm run lint       # Oxlint
npm run format     # Prettier
```

Playwright uses installed Google Chrome. It starts a local Vite server or reuses one already running on port 5173. For another browser, update `channel` in `playwright.config.ts` and install that browser as needed.

## Included screens

| Route                     | Functionality                                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------ |
| `/dashboard`              | Summary cards, illustrative ride/revenue trends, fleet map, recent rides, applications, activity |
| `/passengers`             | Search, status/verification filters, sorting, pagination, CSV export                             |
| `/passengers/:id`         | Profile, sample trips, suspend/reactivate with a reason                                          |
| `/drivers`                | Search, verification tabs, vehicle/account filters, sorting, pagination, CSV export              |
| `/drivers/:id`            | Profile, vehicle, sample document preview, gated approval, rejection, suspend/reactivate         |
| `/vehicles`               | Vehicle type cards, search, filters, sorting, pagination, driver links, CSV export               |
| `/live-map`               | Illustrated Colombo map, clickable markers, zoom, availability/type/area filters, driver focus   |
| `/rides` and `/rides/:id` | Searchable journeys, filters, people, route illustration, timeline, fare details                 |
| `/payments`               | Cash/card transactions, search, filters, transaction details, CSV export                         |
| `/reports`                | Date-based revenue/ride charts, vehicle/payment breakdowns, CSV report                           |
| `/audit-logs`             | Action history, search, category filters, detail dialogs, CSV export                             |
| `/notifications`          | Read/unread notifications and links to related screens                                           |
| `/settings`               | Read-only Keycloak profile, session claims, preferences, reset demo data                         |

The app requires Keycloak sign-in and an ADMIN or SUPER_ADMIN realm role before rendering the workspace. Read [Keycloak setup](keycloak/SETUP.md) to configure the public SPA client, allowed redirect/origin settings, and administrator MFA. The default auth server is https://hopon-auth.duckdns.org (realm hopon, client hopon-admin-web).

## Local behavior

- Zustand persists sample records and preferences under `hopon-admin-demo` in browser local storage.
- Driver approval requires reviewing four sample documents. Verification decisions and account changes create local audit entries.
- Suspension removes a driver from the simulated map. Reactivation restores the account; the driver stays offline.
- Restore original records through **Settings → Reset demo**, including preferences, notifications, and audit entries.
- Map and route illustrations are local SVGs. They do not use Google Maps or require an API key.
- Dashboard historical trends and comparisons are illustrative. Reports and table totals use sample ride records. Reporting dates are fixed to November 24–26, 2026. Audit timestamps use the current action time and display in Asia/Colombo.
- Notification preferences are stored locally; no messages are sent.

## Frontend structure

```text
src/
  app/layouts/        Sidebar, header, global search, notification panel
  components/ui/     Radix/Slot-based button and accessible dialog primitives
  components/shared/ Tables, confirmations, badges, exports, toasts
  data/              Typed sample records and illustrative metrics
  features/          Feature pages and local workflows
  lib/               Keycloak authentication, persistent demo state, utilities
  types/             Shared domain types
```

React Router handles SPA navigation. Recharts renders charts, TanStack Table handles client-side sorting/pagination, and React Hook Form + Zod validate settings. TanStack Query's provider is available for future integration; there are no query functions or API clients. Pages load on demand.

For Vercel, build with `npm run build` and serve `dist/`. The included `vercel.json` provides the SPA fallback for deep links and authentication callbacks. No backend code is included.
