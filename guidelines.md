# Tecma — AI Agent Guidelines

This file is the **single source of truth** for AI agents working on this codebase. Follow these patterns and conventions. When you make architectural changes, **update this file** in the same change so future agents stay aligned.

---

## 1. Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix), `tw-animate-css` |
| Data | Prisma 7 (PostgreSQL via `@prisma/adapter-pg`, `pg`) |
| Auth | NextAuth v5 (beta), Credentials provider, bcryptjs |
| Forms | react-hook-form, @hookform/resolvers, Zod 4 |
| Data fetching (client) | SWR for list/table endpoints; `fetch` + local state elsewhere |
| Tables | @tanstack/react-table |
| Utils | dayjs, sonner (toast), clsx, tailwind-merge |

- **Prisma client** is generated to `generated/prisma` (see `prisma/schema.prisma`). Import client from `@/generated/prisma/client`, types/enums from `@/generated/prisma/models` and `@/generated/prisma/enums`.
- **Path alias**: `@/` → project root (e.g. `@/lib/prisma`, `@/components/ui/button`).

---

## 2. Directory structure

```
app/                    # Next.js App Router
  api/                  # Route handlers (REST-style JSON APIs)
    <resource>/         # e.g. whatsapp, properties, tenants, messages, rooms, tickets
      route.ts          # GET (list), POST if needed
      [id]/route.ts     # GET/PATCH/DELETE by id when used
      lean/route.ts     # Optional lean endpoints for dropdowns etc.
  admin/                # Admin app (protected)
    layout.tsx          # Sidebar + header wrapper
    <resource>/         # e.g. whatsapp, properties, tenants, units, employees, tickets
      page.tsx          # List page (server component)
      create/page.tsx   # Create page
      update/[id]/      # Update page
  layout.tsx            # Root layout (fonts, Toaster)
  page.tsx              # Login/landing

components/
  ui/                   # shadcn primitives (button, input, card, table, dialog, etc.)
  admin/                # Feature-specific components
    <resource>/         # data-table.tsx, create-form.tsx, update-form.tsx
    sidebar.tsx, header.tsx, breadcrumb.tsx

lib/
  prisma.ts             # Single PrismaClient instance (pg adapter)
  auth.ts               # NextAuth config (credentials, authorized callback)
  utils.ts              # cn() (clsx + tailwind-merge)
  dayjs.ts              # dayjs config/plugins
  actions/              # Server actions by domain
    <resource>/         # create-*, update-*, delete-* (e.g. create-whatsapp.ts)

types/
  ApiResponse.ts        # Shared API response type

prisma/
  schema.prisma         # Schema; client output → ../generated/prisma
  migrations/
generated/
  prisma/               # Generated client (do not edit)
```

---

## 3. API routes (`app/api/**/route.ts`)

- **Purpose**: JSON APIs for list/detail/mutations used by client components (e.g. data tables, inbox).
- **Request validation**: Use **Zod** on `request.url` (GET) or `request.json()` (POST). Use `safeParse`; on failure return `400` with a consistent JSON body.
- **Response shape**: All JSON responses use the shared type `ApiResponse<T>` from `@/types/ApiResponse`:
  - `{ data: T | null, success: boolean, message: string }`
- **Export types**: Export `XxxApiItem`, `XxxApiData`, and `XxxApiResponse` from the route file so client components can type `fetch` responses.
- **DB access**: Use `prisma` from `@/lib/prisma`. Use Prisma types from `@/generated/prisma/models` (e.g. `XxxWhereInput`) and `@/generated/prisma/enums` when needed.
- **Errors**: `try/catch`; log and return `500` with `success: false` and a generic message; do not leak internals.
- **Auth**: Admin APIs are protected by NextAuth’s `authorized` callback (routes under `/admin`). API routes do not currently enforce auth in code; rely on layout protection. If you add API-level auth, document it here.

---

## 4. Server actions (`lib/actions/**/*.ts`)

- **Directive**: File must start with `"use server"`.
- **Naming**: `createXxxAction`, `updateXxxAction`, `deleteXxxAction`; file names: `create-xxx.ts`, `update-xxx.ts`, `delete-xxx.ts`.
- **Input**: Accept `FormData` (or typed object). Parse with **Zod** (`safeParse`); on failure return `{ success: false, message: "Invalid input" }` (no `data`).
- **Return type**: `Promise<ApiResponse<SomeType>>`. For create/update/delete, often `ApiResponse<null>`.
- **DB**: Use `prisma` from `@/lib/prisma`. Handle `Prisma.PrismaClientKnownRequestError` (e.g. P2002 unique) and return user-friendly messages.
- **Usage**: Called from client components (forms); caller shows toast and redirects on success.

---

## 5. Pages (`app/admin/**/page.tsx`)

- **Default**: Prefer **async Server Components**. No `"use client"` unless the page is only a thin wrapper.
- **Structure**: Minimal layout (title, optional header actions like “Add”), then render one or more client components (e.g. `XxxDataTable`, `XxxCreateForm`).
- **Data**: For list pages, do not fetch in the page; the client-side data table fetches from `/api/<resource>`. For create/update, the form component calls server actions.
- **Routing**: List at `/<resource>`, create at `/<resource>/create`, update at `/<resource>/update/[id]`.

---

## 6. Admin client components

### Data tables (`components/admin/<resource>/data-table.tsx`)

- **Directive**: `"use client"` and `"use no memo"` at top.
- **State**: `pagination` (pageIndex, pageSize), `globalFilter`/`searchInput`, and for delete: `itemToDelete`, `isDeleteDialogOpen`, `isDeleting`. With SWR, `data` and `totalCount` come from the hook.
- **Fetching**: Prefer **SWR** via a dedicated hook (e.g. `useProperties` in `lib/fetching/properties/use-properties.ts`). Hook accepts `{ pageIndex, pageSize, search }`, uses `keepPreviousData: true`; returns `{ data, error, isLoading, mutate }`. On delete, call `mutate()`. Fallback: `useCallback` + `fetch` with `cache: "no-store"`.
- **Effects**: With SWR, one effect for toast on `error`; one debounced effect to sync `searchInput` → `globalFilter` (reset page to 0). Otherwise: effect to fetch on pagination/filter change.
- **Table**: Use `@tanstack/react-table` (`useReactTable`, `getCoreRowModel`), `ColumnDef`, and shadcn `Table`; columns include actions (dropdown with Edit/Delete). Delete opens AlertDialog, calls `deleteXxxAction(id)`, then `mutate()` (or refetch).
- **Navigation**: Edit uses `router.push(/admin/<resource>/update/[id])`. Optional: link “Add” in page, not in table.

### Forms (`create-form.tsx`, `update-form.tsx`)

- **Directive**: `"use client"`.
- **Form**: `react-hook-form` with `zodResolver(schema)`. Schema is Zod, matching server action validation (can share schema or duplicate with same rules).
- **Submit**: Build `FormData` from form values, call `createXxxAction(formData)` or `updateXxxAction(formData)`. On success: `toast.success`, `router.push` to list (or stay on update). On failure: `toast.error(result.message)`.
- **Layout**: Use shadcn `Card`/`CardContent`, `Field`/`FieldGroup`/`FieldLabel`/`FieldError`, `Input`/`Select`/etc., and `Button` submit. Use `Controller` when needed (e.g. for custom or controlled components).

---

## 7. UI and styling

- **Primitives**: Use components from `components/ui/` (shadcn). Add new primitives via shadcn CLI or copy the pattern from existing ones.
- **Class names**: Use `cn(...)` from `@/lib/utils` for conditional/merged Tailwind classes.
- **Icons**: `lucide-react`.
- **Toasts**: `sonner` (`toast.success`, `toast.error`); Toaster is in root layout.

---

## 8. Auth

- **Config**: `lib/auth.ts` — NextAuth with Credentials provider; `authorized` callback protects paths starting with `/admin` (redirect to sign-in if not logged in).
- **Route**: `app/api/auth/[...nextAuth]/route.ts` re-exports `handlers` from `lib/auth`.
- **Login**: Login form and action live in `components/login-form.tsx` and `lib/actions/login.ts`; sign-in page is `/` (configured in auth `pages.signIn`).
- **No root middleware**: There is no `middleware.ts` at project root; protection is via NextAuth `authorized`. If you add middleware, document it here.

---

## 9. Conventions and naming

- **Files**: kebab-case (`data-table.tsx`, `create-form.tsx`, `update-property.ts`).
- **Components**: PascalCase (e.g. `WhatsappDataTable`, `WhatsappCreateForm`).
- **API types**: Export from route file: `XxxApiItem`, `XxxApiData`, `XxxApiResponse`.
- **Prisma**: Use generated client and types only; do not add hand-written types that duplicate schema. Use `select` to limit fields when defining `XxxApiItem`-compatible shapes.
- **Date/time**: Use `dayjs` (and `@/lib/dayjs` if configured for locale/plugins).

---

## 10. How to update this file (for AI agents)

When you introduce **architectural or pattern changes**:

1. **Edit this file in the same PR/change** that implements the change.
2. **Place updates in the right section** (e.g. new auth mechanism → §8; new data-fetching pattern → §6 or new subsection).
3. **Add a short “Why” or “When”** if the rule is not obvious (e.g. “Use this when …”).
4. **Keep it scannable**: use lists and tables; avoid long prose. Prefer “Do / Don’t” or “Always / Never” where it helps.
5. **Version or date**: Optionally add a short “Last updated” line at the top when making larger revisions.

If you are unsure where a new rule fits, add a new subsection (e.g. “10. Caching” or “11. Testing”) and reference it from the section that uses it.
