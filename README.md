# RestroHub

A production-grade, mobile-first React frontend for a QR-based cafe & restaurant management SaaS platform. Built against the LogDine API.

> Inspired by Toast POS, Swiggy admin, and Shopify — engineered to feel calm under fire during a Friday night rush.

## ✨ Highlights

- **React 18 + TypeScript + Vite** — strict mode, path aliases, code splitting
- **Tailwind CSS + custom design tokens** — warm cafe palette, Plus Jakarta Sans + Fraunces (serif headlines)
- **Shadcn-style UI primitives** — hand-rolled on Radix, fully themeable
- **TanStack Query** for server state, **Zustand** for client state, **Axios** for HTTP
- **React Hook Form + Zod** for forms
- **Framer Motion** for tasteful micro-animations
- **PWA** via `vite-plugin-pwa` — offline caching, installable, update prompt
- **Role-based routing** with auth-store hydration to avoid login flash
- **Recharts** dashboards
- **Optimistic UI** for menu edits, debounced filters, skeleton states throughout
- **Mobile-first**, with desktop sidebar/cart and mobile bottom-nav/slide-up cart

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit VITE_API_URL to point at your backend

# 3. Run
npm run dev          # http://localhost:5173
npm run build        # production build
npm run preview      # preview production build
```

## 🏗️ Architecture

```
src/
├── api/                  # Axios client, endpoints, QueryClient
│   ├── client.ts         # JWT interceptor + error normalization
│   ├── endpoints.ts      # All API URLs as builder functions
│   └── queryClient.ts    # React Query config + query keys
│
├── services/             # API service methods (typed)
│   ├── auth.service.ts
│   ├── restaurant.service.ts
│   └── publicOrder.service.ts
│
├── types/                # Domain types (single source of truth)
│   └── index.ts
│
├── store/                # Zustand stores (persisted)
│   ├── auth.store.ts     # JWT + user, hydration tracking
│   ├── cart.store.ts     # POS cart with variants/addons
│   └── ui.store.ts       # Theme, sidebar collapse
│
├── hooks/                # React Query hooks
│   ├── useAuth.ts
│   └── useRestaurant.ts  # Optimistic updates included
│
├── routes/               # Router config + ProtectedRoute
│
├── components/
│   ├── ui/               # Button, Input, Card, Badge, Sheet, Tabs, …
│   ├── layout/           # Sidebar, TopBar, MobileSidebar, BottomNav
│   └── common/           # Logo, PageLoader
│
├── layouts/              # AdminLayout, PublicLayout
│
├── pages/
│   ├── auth/             # LoginPage
│   ├── admin/            # Dashboard, POS, KDS, Orders, Menu, Tables, Reports, Offers, Settings
│   └── public/           # PublicMenuPage (QR), OrderStatusPage
│
├── pwa/                  # Service worker prompts
├── lib/utils.ts          # cn, formatCurrency, timeAgo, debounce
└── index.css             # Theme tokens, utilities
```

## 🎨 Design system

| Token | Light | Dark |
|---|---|---|
| `--primary` | `#ff6b00` (warm cafe orange) | Same |
| `--background` | warm cream `36 60% 98%` | espresso `24 18% 7%` |
| `--foreground` | ink `24 30% 12%` | cream `36 25% 94%` |

- **Display font** — Fraunces (variable serif, used for headlines)
- **Body font** — Plus Jakarta Sans
- **Radius** — `0.75rem` base
- **Shadows** — soft, warm-tinted (`shadow-soft`, `shadow-card`, `shadow-float`)
- **Animations** — `fade-in-up`, `shimmer`, `pulse-ring`

## 📱 Module map

| Module | Route | Page | Key features |
|---|---|---|---|
| **Auth** | `/login` | `LoginPage` | Split layout, RHF+Zod, password toggle, remember me |
| **Dashboard** | `/dashboard` | `DashboardPage` | Hero, 4 KPIs, live tables, kitchen status, revenue chart, top items |
| **POS Billing** | `/pos` | `POSPage` | 3-pane layout, order type tabs, category chips, item grid, sticky cart with totals, mobile slide-up cart, veg filter |
| **KDS** | `/kds` | `KDSPage` | Three-column kanban (Pending/Preparing/Ready), urgency highlighting, one-click status advance, 15s refresh |
| **Orders** | `/orders` | `OrdersPage` | Filterable list with status pills, detail drawer with status transitions |
| **Menu Mgmt** | `/menu` | `MenuPage` | Category rail, item grid, availability toggle (optimistic), AI extract CTA |
| **Tables** | `/tables` | `TablesPage` | Status grid, capacity editor, QR placeholder, status transitions |
| **Reports** | `/reports` | `ReportsPage` | Period selector, bar chart, top products table, CSV/PDF export buttons |
| **Offers** | `/offers` | `OffersPage` | Coupon cards with type/value/validity |
| **Settings** | `/settings` | `SettingsPage` | Tabs: Profile, Tax, Email, Integrations |
| **Customer Menu** | `/m/:slug/:table` | `PublicMenuPage` | Swiggy-style cards, veg filter, sticky cart FAB, order placement |
| **Order Tracker** | `/m/:slug/order/:orderId` | `OrderStatusPage` | Animated progress stages, auto-refresh every 10s |

## 🔌 API integration

All endpoints from `API_QUICK_REFERENCE.md` are wired through:

- `src/api/endpoints.ts` — pure URL builders
- `src/services/*.service.ts` — typed methods returning unwrapped `{success, data}` envelopes
- `src/hooks/useRestaurant.ts` — React Query hooks with hierarchical keys

Auth handling:
- JWT auto-injected via Axios interceptor
- 401 → auto-logout + toast + redirect (via `ProtectedRoute`)
- Persistence in localStorage with hydration tracking

## 📡 PWA

`vite.config.ts` configures:
- `NetworkFirst` strategy for API routes (4s timeout fallback)
- `CacheFirst` for menu images
- Auto-update with toast prompt (`src/pwa/PWAUpdatePrompt.tsx`)
- Manifest theme color `#ff6b00`, standalone display, portrait

To install: visit on mobile → "Add to Home Screen".

## 🧩 Extension points

Want to add a new module? Three steps:

1. Add types in `src/types/index.ts`
2. Add service method in `src/services/restaurant.service.ts`
3. Add hook in `src/hooks/useRestaurant.ts`, then build the page

The Sidebar nav, route guard, and layout will pick it up automatically — just register the route in `src/routes/router.tsx`.

## 🔧 What's not included (but easy to add)

- **PWA icons** — drop `192x192` and `512x512` PNGs in `public/icons/`
- **Push notifications** — config slot exists in `pwa/`; wire up VAPID
- **Background sync for offline orders** — IndexedDB queue stub TBD
- **Razorpay/Paytm checkout SDK** — service methods exist, just inject the JS SDK
- **Drag-and-drop on KDS** — column structure is in place, add `react-dnd` or `@dnd-kit/core`
- **AI menu extraction UI** — service exists, needs a stepper modal

## 📝 License

MIT
