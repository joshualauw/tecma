# Tecma Project: Agent Tech Stack Notes

Quick reference for how the app is built (frameworks, libraries, and what they’re used for).

## Tech Stack


| Tech Stack                                | Description                                             | Documentation                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Next.js` (v16)                           | App framework (routing + server/client rendering).      | [Next.js Docs](https://nextjs.org/docs)                                                                                         |
| `React` (v19)                             | UI component model.                                     | [React Docs](https://react.dev)                                                                                                 |
| `TypeScript`                              | Type safety across the frontend and backend code.       | [TypeScript Docs](https://www.typescriptlang.org/docs)                                                                          |
| `Next.js App Router`                      | Pages/routes structure using the `app/` directory.      | [App Router Docs](https://nextjs.org/docs/app)                                                                                  |
| `NextAuth` (beta)                         | Authentication/session handling.                        | [NextAuth Docs](https://next-auth.js.org)                                                                                       |
| `Prisma`                                  | Database ORM + type-safe queries/models.                | [Prisma Docs](https://www.prisma.io/docs)                                                                                       |
| `PostgreSQL`                              | Primary relational database.                            | [PostgreSQL Docs](https://www.postgresql.org/docs/)                                                                             |
| `@prisma/adapter-pg`                      | Prisma-backed persistence for auth/session data.        | [Package on npm](https://www.npmjs.com/package/@prisma/adapter-pg)                                                              |
| `Tailwind CSS`                            | Utility-first styling (with Tailwind helpers).          | [Tailwind Docs](https://tailwindcss.com/docs)                                                                                   |
| `Radix UI` / `@base-ui/react`             | Accessible UI primitives and component building blocks. | [Radix Docs](https://www.radix-ui.com/docs) / [Base UI Docs](https://base-ui.com/)                                              |
| `shadcn` / component conventions          | Project’s prebuilt UI components (shadcn-style).        | [shadcn/ui](https://ui.shadcn.com/)                                                                                             |
| `react-hook-form`                         | Form state management.                                  | [React Hook Form Docs](https://react-hook-form.com/docs)                                                                        |
| `zod`                                     | Schema validation (commonly paired with forms).         | [Zod Docs](https://zod.dev)                                                                                                     |
| `SWR`                                     | Client-side data fetching + revalidation patterns.      | [SWR Docs](https://swr.vercel.app/docs)                                                                                         |
| `Axios`                                   | HTTP requests to external/internal APIs.                | [Axios Docs](https://axios-http.com/docs/intro)                                                                                 |
| `Pusher` / `pusher-js`                    | Realtime events/updates.                                | [Pusher Docs](https://pusher.com/docs)                                                                                          |
| `AWS SDK S3` (`@aws-sdk/client-s3`)       | File storage integration (S3).                          | [AWS SDK v3 S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/s3/)                                       |
| `bcryptjs`                                | Password hashing utilities.                             | [bcryptjs on npm](https://www.npmjs.com/package/bcryptjs)                                                                       |
| `@tanstack/react-table`                   | Data table/grid rendering and logic.                    | [TanStack Table Docs](https://tanstack.com/table/latest/docs/guide)                                                             |
| `Recharts`                                | Charting/visualizations.                                | [Recharts Docs](https://recharts.org/en-US/)                                                                                    |
| `Sonner`                                  | Toast notifications UI.                                 | [Sonner Docs](https://sonner.emilkowal.ski/)                                                                                    |
| `lucide-react`                            | Icon set for UI.                                        | [lucide-react](https://lucide.dev/guide/packages/lucide-react)                                                                  |
| `date-fns` / `dayjs` / `react-day-picker` | Date handling and date-picker UI.                       | [date-fns](https://date-fns.org/docs) / [dayjs](https://day.js.org/docs) / [react-day-picker](https://react-day-picker.js.org/) |


## UI Styling Guide

### Shadcn

Shadcn components exist in `@/components/ui`. **PRIORITIZE** to use component from this folder. **DO NOT** change the underlying implementation in any situation unless prompted.

### Classes Naming

This project doesn't use dark css classes, so **DO NOT** implement them when designing UI. **DO NOT** use aria label or stuff that will make the HTML elements longer unless neccessary for the feature. **PRIORITIZE** to use fixed width/height from tailwind if possible unless neccessary.

prioritized: `w-24`, `w-48`, `w-64`  
Secondary: `w-[500px]`, `w-[100px]`

# Components Guide

This section will teach how to properly create admin components in this app. Will take example from `@/components/admin/tenants`

## File Naming

Components follow **kebab case** naming for the file name (eg. `tenant/create-form.tsx`, not including the module name for the file) while component name itself use **pascal case** (eg. `TenantCreateForm`, include module name as prepend). Always use export default for the main component. Most of this projects will be done in `@/components/admin`. 

## Props

Component usually take props. Make the interface using the exact component name (eg. `TenantCreateFormProps`) using typescript interface. To use it, PRIORITIZE to destructure it inside the parameter (eg. `{ params1, params2 }: TenantCreateFormProps`).

## Admin Components

Admin components are usually separated into three files to manage CRUD:

1. `create-form.tsx` (create)
2. `data-table.tsx` or `data-list.tsx` (read + list)
3. `update-form.tsx` (update)

### Create / Update Forms

Form files are client components and follow the same pattern: define a `formSchema` with `zod` (placed in the same file), use `useForm<z.infer<typeof formSchema>>({ resolver: zodResolver(formSchema), defaultValues })`, and render labeled fields with `Field`, `FieldLabel`, `FieldError`, and `Controller` (especially for `Select` and `Textarea`).

Zod errors must be user-friendly because they appear client-side. For required strings, use messages like `z.string().trim().min(1, "Tenant name is required")`; for enums, prefer `z.enum([...])`.

Always match the client schema intent with the server schema intent, especially for `nullable()`. If the server expects `address` as `nullable()` (e.g. `z.string().trim().min(1).nullable()`), then the client should **ONLY** append to `FormData` when the value is present. If the client does not append that field, `formData.get("field")` becomes `null`, which passes `nullable()` correctly. Example pattern: `if (data.address) formData.append("address", data.address)`.

Build `FormData` in `onSubmit` and call the matching action in `@/lib/actions/...`. Create forms append only create fields (no `id`); update forms append `id` (usually `formData.append("id", String(id))`) plus the editable fields. For arrays, append repeated keys in a loop (e.g. `for (const employeeId of data.employeeIds ?? []) formData.append("employeeIds", employeeId)`).

After the action returns `{ success, message }`, on success `router.push("/admin/...")` and `toast.success("... successfully")`; on failure use `toast.error(result.message || "Failed to ...")`.

### Data Table / List

Data table components are client components and typically use an SWR hook (e.g. `useTenants`) to fetch data using `pageIndex`, `pageSize`, and filters. They initialize `pageSize` with `DATA_TABLE_PAGE_SIZE` and render with TanStack Table (`useReactTable`) using `manualPagination: true` and `manualFiltering: true`.

State and paging behavior should match existing components: keep `pagination` in local state (`{ pageIndex: 0, pageSize: DATA_TABLE_PAGE_SIZE }`), compute `pageCount` from the API `count` (`Math.max(1, Math.ceil(totalCount / pagination.pageSize))`), and show a loading/empty row using `isLoading` / `error`.

Search and filtering follows the existing UX: keep raw input in `searchInput`, debounce into `globalFilter` with `setTimeout(..., 300)`, and reset `pageIndex` back to `0` when the filter changes.

Row actions and deletes should follow the same pattern: gate the action column based on the `permissions` props (so columns shrink when a user lacks capabilities). For destructive actions, use `AlertDialog` with local `isDeleting` and a single `onConfirm...` handler. After a successful delete/update, call SWR `mutate()` to refresh the list, then close the dialog / clear selection.

# Actions

Actions exist in `@/lib/actions`. Actions files are used to manage create, update, delete from form components. 

## File Naming

Actions follow **kebab case** naming for the file name (eg. `tenants/create-tenant.ts`, including the module name for the file) while the exported function uses **camel case** (eg. `createTenantAction`, with `Action` as the last noun). **ALWAYS** use a regular export for the main function.

## Admin Actions

Admin server actions live under `lib/actions/<area>/` and are usually split into **three files** per resource, matching create / update / delete:

- `create-<resource>.ts` — create mutations (often accept `FormData` from a create form)
- `update-<resource>.ts` — update mutations (often accept `FormData` with an `id`)
- `delete-<resource>.ts` — delete mutations (often accept an `id` number or similar)

Other resources may exist outside these conventions depends on the need. But if prompt guide to do basic resource module, follow this closely.

### Form Validation

Because actions will be accepting FormData, we use `zod` library to validate incoming form data. Usually the schema will be put under variable using **camel case** (eg. `createTenantSchema`) and the shape will follow closely towards the existing table inside `prisma/schema.prisma`. But there are rules:

- for integer id in database, the zod schema must use `z.coerce.number().int().positive()`
- for varchar/text/string in database, the zod schema must use `z.string().trim().min(1)`
- for any nullable property type in database, the zod schema must use `nullable()` (not optional, **IMPORTANT**)
- for phone number, the zod schema must use `PHONE_NUMBER_REGEX` from `@/lib/constants`
- for datetime, the zod schema must use `z.coerce.date()`

To validate the schema, simply use zod built in function `schema.safeParse()` towards `formData.get(<property>)` or `formData.getAll(<property>)`. Then get the success boolean. If its false, **ALWAYS** return `{ success: false, message: "Invalid input" }` and console the error (eg. "Create ... Validation failed")

**ALWAYS** destructure all values if you want to use it. (eg. `const { name, phoneNumber, address } = parsed.data`)

### Authentication and Authorization

Actions is mapped as internal API with nextjs, so we want to protect them using `auth` and `getAuthenticatedUser` from lib. The pattern is calling a function `hasPermissions` of this API (eg. `tenants:create`). To see all available permission check variable `AVAILABLE_PERMISSIONS` from `@/lib/constants.ts`.
