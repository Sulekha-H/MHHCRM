# Base44 Layout vs Current App Layout

## Base44 Layout (single shell)

- **Component:** `Layout({ children, currentPageName })`
- **Auth:** Inside layout via `base44.auth.me()`; loading + auth error states; redirect/Log In UI.
- **Structure:**
  - `SidebarProvider` → `div.flex.min-h-screen.w-full.bg-slate-50`
  - **One** shadcn **Sidebar** (SidebarHeader + SidebarContent with SidebarGroups: Main, Operations, Support & Care, Compliance & Documents, Property/Landlords*, Administration*, Personal)
  - **One** content area: `div.flex-1.flex.flex-col.min-w-0.w-full`
    - **Header:** SidebarTrigger + **page title** from `currentPageName` (e.g. "Dashboard", "Office Logs", "Service Charges")
    - **Main:** `main.flex-1.w-full.min-w-0.overflow-x-auto.p-6` → `div.w-full.h-full` → `{children}`
- **Nav:** Uses `createPageUrl("Dashboard")` etc. from `@/components/utils`; conditional Property/Landlord and Administration sections via `hasPropertyLandlordAccess(user)` and `hasAdminAccess(user)`.
- **Result:** One sidebar, one header (with page title), one main. Children (e.g. dashboard) get full width minus one sidebar.

---

## Current setup (double shell)

### Root layout (`app/layout.jsx`)

- **Props:** `{ children }` (from Next.js).
- **Structure:**
  - `ClerkProvider` → `SidebarProvider` → `div.flex.min-h-screen.w-full.bg-slate-50`
  - **One** shadcn **Sidebar** (SidebarHeader + SidebarContent with `SidebarNavigation`)
  - **SidebarInset** (`flex-1 flex flex-col`): header + main
    - **Header:** SidebarTrigger only; comment "Page title will be handled by individual pages" — **no page title**.
    - **Main:** `main.flex-1.w-full.min-w-0.overflow-x-auto.p-6` → `{children}` (for protected routes this is the output of (protected) layout, not the page directly).

### Protected layout (`app/(protected)/layout.jsx`)

- When authenticated: wraps children in **AppLayout** → `return <AppLayout>{children}</AppLayout>`.

### AppLayout (`components/AppLayout.jsx`)

- **Second** layout shell: custom **sidebar** (plain `<aside>`, not shadcn) + **main** with `{children}`.
- No `SidebarInset`; no page title in its header (it has a mobile header with "My Hope Housing" only).

---

## How this affects children (e.g. dashboard)

| Aspect              | Base44                         | Current                                      |
|---------------------|--------------------------------|----------------------------------------------|
| Number of sidebars  | 1 (shadcn)                     | 2 (root shadcn + AppLayout custom)           |
| Content width       | Viewport − 1 sidebar           | Viewport − 2 sidebars (narrower)             |
| Header page title   | Yes (`currentPageName`)        | No (only SidebarTrigger in root)             |
| Who wraps the page  | Single Layout component        | Root layout, then AppLayout inside root main |

So the same dashboard code is currently rendered inside **two** sidebars and **two** main areas, with **no** page title in the header. That explains the narrower, “simplified” look and missing title.

---

## Recommendation

- Use **one** shell for protected routes, matching Base44: **one** shadcn Sidebar + **one** header (with page title) + **one** main with `{children}`.
- **Stop** wrapping protected children in AppLayout so the page is the direct child of the root layout’s main (like Base44).
- **Add** a page title in the root header, derived from the current path (e.g. pathname → "Dashboard", "Office Logs", "Service Charges") via a small client component, since Base44 passed `currentPageName` for that.
- Keep auth in (protected) layout (Clerk); no need to duplicate AppLayout’s custom sidebar once it’s removed.

After this, the layout that influences the children will match Base44: one sidebar, one header with title, one main.

---

## Changes applied

- **Protected layout:** No longer wraps children in `AppLayout`. When authenticated, it returns `{children}` so the page is the direct child of the root layout’s main (one shell, like Base44).
- **Root layout:** Added `PageTitle` in the header so the current page name (e.g. "Dashboard", "Office Logs") is shown, derived from the pathname via a small client component.
- **PageTitle component:** New client component at `components/PageTitle.jsx` that maps pathname to the same display names Base44 used (e.g. "Office Logs", "Service Charges", "Support Plans").
