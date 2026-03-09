# Agent guide – TECMA

This file gives coding agents enough context to read and modify this codebase consistently.

---

## Project overview

**TECMA** is a property/tenant management admin app with WhatsApp-style inbox, tickets, units, employees, and bots. It is a **Next.js 16** full-stack app with **PostgreSQL** (Prisma), **NextAuth v5** (credentials), and **React 19**.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| React | React 19 |
| Language | TypeScript (strict) |
| Database | PostgreSQL via Prisma 7 (`@prisma/adapter-pg` + `pg`) |
| Auth | NextAuth v5 (Credentials), bcrypt |
| Data fetching (client) | SWR |
| Forms | react-hook-form + Zod + @hookform/resolvers |
| UI | Radix UI, shadcn/ui (new-york, slate), Tailwind CSS 4, lucide-react |
| Toasts | sonner |
| Tables | @tanstack/react-table |
| Dates | dayjs (locale: `id`) |

**Paths:** `tsconfig` uses `"@/*": ["./*"]` (e.g. `@/lib/prisma`, `@/components/ui/button`).

---

## Repository layout

```
app/                    # Next.js App Router
  layout.tsx            # Root layout (fonts, Toaster, globals)
  page.tsx              # Public landing/login
  admin/                # Protected admin area
    layout.tsx          # Sidebar + header + content wrapper
    dashboard/
    properties/         # create, update/[id], page
    units/
    tenants/
    employees/
    tickets/            # + tickets/categories
    whatsapp/
    inbox/              # Chat-style inbox
  api/                  # Route handlers (REST-style)
    auth/[...nextAuth]/
    properties/, tenants/, units/, employees/
    tickets/, tickets/categories/
    whatsapp/, rooms/, messages/, messages/send/
    .../lean/           # Some entities have /lean for dropdowns

lib/                    # Shared server/client logic
  prisma.ts             # Prisma client (Pg adapter, DATABASE_URL)
  auth.ts               # NextAuth config (credentials, protected /admin)
  fetcher.ts            # SWR fetcher; expects ApiResponse<T>
  utils.ts              # cn() (clsx + tailwind-merge)
  constants.ts          # SWR_FETCH_RETRY_COUNT, PHONE_NUMBER_REGEX, DATA_TABLE_PAGE_SIZE
  dayjs.ts              # dayjs plugins + locale "id"
  actions/              # Server actions ("use server")
    <entity>/           # create, update, delete (e.g. tenants, tickets)
  fetching/             # SWR hooks (use-tenants, use-units, etc.)
    <entity>/           # use-<entity>.ts, use-lean-<entity>.ts, use-available-units, etc.

components/
  ui/                   # shadcn primitives (button, card, dialog, select, table, …)
  admin/                # Admin feature components
    sidebar.tsx, header.tsx, breadcrumb.tsx
    <entity>/           # data-table.tsx, create-form.tsx, update-form.tsx
    inbox/              # container, chat, info

prisma/
  schema.prisma         # Models + enums; client output → generated/prisma

generated/prisma/       # Prisma client (do not edit)

types/
  ApiResponse.ts        # { data?, success, message }

proxy.ts                # Exports auth as proxy (Next.js middleware for /admin)
```

---

## Conventions

### API responses

- All API routes and server actions that return a structured result use **`ApiResponse<T>`** from `@/types/ApiResponse`:
  - `success: boolean`
  - `message: string`
  - `data?: T | null`
- **API routes** (e.g. `app/api/tenants/route.ts`): validate query/body with Zod, use `prisma` from `@/lib/prisma`, return `NextResponse.json({ data, message, success })` with appropriate status (400 for validation, 500 for errors).
- **Server actions**: same shape; return `{ success, message, data? }`. Use `"use server"` at top of file.

### Server actions

- Live under `lib/actions/<entity>/` (e.g. `create-tenant.ts`, `update-tenant.ts`, `delete-tenant.ts`).
- Accept `FormData` for create/update; parse with Zod; return `ApiResponse<null>` or `ApiResponse<SomeType>`.
- Use `prisma` from `@/lib/prisma`. Handle `Prisma.PrismaClientKnownRequestError` (e.g. P2002) and return user-friendly messages.

### API routes

- Use `NextRequest` / `NextResponse`. Validate with Zod from `searchParams` or `request.json()`.
- Export types for response payloads (e.g. `TenantApiItem`, `TenantsApiData`) and use `ApiResponse<…>` for the handler return type.
- Use Prisma `select`/`where` explicitly; avoid importing from `generated/prisma` in app code except for types/enums if needed.

### Client data fetching

- **SWR** via hooks in `lib/fetching/<entity>/` (e.g. `use-tenants.ts`, `use-lean-tenants.ts`).
- Use shared `fetcher` from `@/lib/fetcher` (expects `ApiResponse<T>` and returns `data` or throws).
- Build query string from params; use `useSWR(key, fetcher, { keepPreviousData: true, errorRetryCount: SWR_FETCH_RETRY_COUNT, ... })`.
- Types for list endpoints often come from the corresponding API route (e.g. `TenantsApiData` from `@/app/api/tenants/route`).

### Admin pages

- **Server components** by default: fetch initial data (e.g. list of properties) with `prisma` and pass to client components.
- List pages: title, “Add” button (Link to create), and a **data-table** component that uses SWR + TanStack Table (pagination, search, filters).
- Create/Update pages: wrap **create-form** / **update-form** in a layout that uses `AdminBreadcrumb` and passes initial data (e.g. properties, units) as needed.

### Forms

- **react-hook-form** + **Zod** + **zodResolver** from `@hookform/resolvers/zod`.
- Schema in the form file (or shared) with `.trim()`, `.min(1)`, optional `.regex(PHONE_NUMBER_REGEX)` for phone fields.
- Submit builds `FormData` and calls the corresponding server action; on success: `router.push` to list + `toast.success`; on failure: `toast.error(result.message)`.
- Use `Field`, `FieldLabel`, `FieldError`, `FieldGroup` from `@/components/ui/field`; `Controller` for Select/controlled inputs.

### Data tables

- **TanStack React Table** (`@tanstack/react-table`): `ColumnDef`, `getCoreRowModel`, `PaginationState`, etc.
- Data from SWR hook; pagination/size and filters (search, propertyId, etc.) in component state and passed to the hook.
- Actions column: dropdown with Edit (router to update page) and Delete; delete uses AlertDialog and the delete server action, then `mutate()`.

### Auth

- **NextAuth v5** in `lib/auth.ts`: Credentials provider, `authorized` callback protects paths starting with `/admin`.
- Auth API: `app/api/auth/[...nextAuth]/route.ts` re-exports `handlers` from `lib/auth`.
- Middleware: `proxy.ts` exports `auth` as the middleware (matcher excludes api, _next, favicon).

### Database

- **Prisma** schema in `prisma/schema.prisma`; client generated to `generated/prisma`. Use `prisma` from `@/lib/prisma` (single instance with Pg adapter).
- Models: `Users`, `Properties`, `Units`, `Tenants`, `Employees`, `Tickets`, `TicketCategories`, `Whatsapp`, `Rooms`, `Messages`, `Bots`, `Sources`; enums for roles, statuses, etc. Names are PascalCase; tables are `@@map` to snake_case.

### UI and styling

- **shadcn/ui** (new-york, slate); components in `components/ui/`. Use `cn()` from `@/lib/utils` for class names.
- Prefer existing UI components; add new ones via shadcn if needed.
- **Tailwind CSS 4**; global styles in `app/globals.css`.

### Naming and files

- **Components:** PascalCase (e.g. `TenantsDataTable`, `TenantCreateForm`).
- **Files:** kebab-case (e.g. `create-form.tsx`, `data-table.tsx`, `use-tenants.ts`).
- **Actions:** `createXAction`, `updateXAction`, `deleteXAction`; file names `create-<entity>.ts`, etc.

---

## Domain concepts

- **Property** → has **Units**, **Tenants**, **Employees**, **Tickets**, **Rooms** (inbox), **Bots**, **Sources**.
- **Tenant** / **Employee**: linked to one property; phone number unique.
- **Ticket**: tenant + unit + category + employee; status/priority enums.
- **Inbox:** **Rooms** (tenant + WhatsApp channel); **Messages** with sender type (tenant, bot, user) and message type (text, image, etc.).
- **WhatsApp:** channels (WABA, phone id/number); linked to rooms.

---

## Checklist for agents

- Use **`ApiResponse<T>`** and the existing **fetcher** for all API/action responses consumed by the client.
- Use **Zod** for validation in API routes and server actions; keep schemas close to the route/action or in a shared place.
- Use **server actions** for mutations from forms; **API routes** for GET (and POST where used by SWR or non-form clients).
- Use **SWR** hooks from `lib/fetching/` in client components; avoid ad-hoc fetch in components.
- Use **prisma** from `@/lib/prisma` only; do not instantiate a new client.
- Follow existing patterns: **data-table** (SWR + TanStack Table), **create-form** / **update-form** (react-hook-form + Zod + FormData → action).
- Preserve **path alias** `@/*` and **existing constants** (e.g. `PHONE_NUMBER_REGEX`, `DATA_TABLE_PAGE_SIZE`).
- Do not edit **generated/prisma**; change **prisma/schema.prisma** and run `prisma generate` for schema changes.
